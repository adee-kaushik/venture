import { persistent } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { store } from "@/lib/store";
import { generateChatResponse, SaveLeadSchema, RequestBookingSchema, LogUnansweredSchema } from "@/lib/ai";

/**
 * GET handler: Meta WhatsApp Webhook Verification Handshake
 * Meta sends hub.mode, hub.verify_token, and hub.challenge
 */
async function handleGET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!verifyToken) return NextResponse.json({ error: "WhatsApp webhook is not configured" }, { status: 503 });

  if (mode === "subscribe" && token === verifyToken) {
    console.log("WhatsApp webhook verified successfully");
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification token mismatch" }, { status: 403 });
}

/**
 * POST handler: Incoming customer message from WhatsApp Cloud API
 */
async function handlePOST(req: NextRequest) {
  try {
    // Authenticate webhook payloads before parsing any customer content.
    const appSecret = process.env.META_APP_SECRET;
    if (!appSecret) {
      return NextResponse.json({ error: "WhatsApp webhook is not configured" }, { status: 503 });
    }
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256") || "";
    const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
    if (
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }
    const body = JSON.parse(rawBody);

    // Verify WhatsApp payload structure
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message || message.type !== "text") {
      // Return 200 OK to Meta even for non-text / status notifications
      return NextResponse.json({ status: "ignored" });
    }

    const customerPhone = message.from; // e.g. "919829012345"
    const text = message.text.body;

    // Explicit phone-number-to-business mapping prevents customer data leakage.
    // Example WHATSAPP_BUSINESS_MAPPING={"1234567890":"apex-institute"}
    let mapping: Record<string, string> = {};
    try {
      mapping = JSON.parse(process.env.WHATSAPP_BUSINESS_MAPPING || "{}");
    } catch {
      return NextResponse.json({ error: "Invalid WhatsApp business mapping" }, { status: 503 });
    }
    const inboundPhoneId = value?.metadata?.phone_number_id;
    const mappedSlug = typeof inboundPhoneId === "string" ? mapping[inboundPhoneId] : undefined;
    if (!mappedSlug) {
      console.error("Unmapped WhatsApp phone number ID");
      return NextResponse.json({ error: "Unmapped WhatsApp business number" }, { status: 422 });
    }
    const business = store.getBusiness(mappedSlug);
    if (!business) {
      return NextResponse.json({ status: "no_business_found" });
    }

    // Get or initialize conversation for this WhatsApp user
    const conversation = store.getOrCreateConversation(business.id, `wa-${inboundPhoneId}-${customerPhone}`, "whatsapp");

    // Fetch conversation history
    const previousMessages = store.getMessages(conversation.id);
    const history = previousMessages.map((m) => ({
      role: m.role as "customer" | "ai",
      text: m.text
    }));

    // Record incoming message
    store.addMessage(conversation.id, {
      role: "customer",
      text,
      inputTokens: 0,
      outputTokens: 0
    });

    if(conversation.status === "human") return NextResponse.json({success:true,queuedForOwner:true});
    // Run AI grounding engine
    const aiResponse = await generateChatResponse(business, conversation.id, text, history);

    // Execute tools if requested
    if (aiResponse.toolCalls) {
      for (const tool of aiResponse.toolCalls) {
        if (tool.name === "save_lead") {
          const leadData = SaveLeadSchema.safeParse(tool.arguments);
          if (leadData.success) {
            store.saveLead(business.id, {
              name: leadData.data.name || "WhatsApp Customer",
              phone: customerPhone,
              details: leadData.data.details,
              conversationId: conversation.id
            });
          }
        } else if (tool.name === "request_booking") {
          const bookingData = RequestBookingSchema.safeParse(tool.arguments);
          if (bookingData.success) {
            const lead = store.saveLead(business.id, {
              name: bookingData.data.name || "WhatsApp Customer",
              phone: customerPhone,
              details: bookingData.data.details,
              conversationId: conversation.id
            });
            store.saveBooking(business.id, {
              requestedTime: bookingData.data.requestedTime,
              details: bookingData.data.details,
              leadId: lead.id
            });
          }
        } else if (tool.name === "log_unanswered") {
          const unansData = LogUnansweredSchema.safeParse(tool.arguments);
          if (unansData.success) {
            store.logUnanswered(business.id, unansData.data.question, conversation.id);
          }
        }
      }
    }

    // Record outgoing AI message
    store.addMessage(conversation.id, {
      role: "ai",
      text: aiResponse.reply,
      inputTokens: aiResponse.inputTokens,
      outputTokens: aiResponse.outputTokens
    });

    // If WHATSAPP_TOKEN is configured in production, send outbound reply via Meta Cloud API
    const whatsappToken = process.env.WHATSAPP_TOKEN;
    const phoneId = inboundPhoneId;

    let sent = false;
    if (whatsappToken && phoneId) {
      try {
        const sendResponse = await fetch(`https://graph.facebook.com/v23.0/${phoneId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${whatsappToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: customerPhone,
            type: "text",
            text: { body: aiResponse.reply }
          })
        });
        if (!sendResponse.ok) {
          throw new Error(`Meta messages API returned HTTP ${sendResponse.status}`);
        }
        sent = true;
      } catch (sendErr) {
        console.error("Failed to send outbound WhatsApp message:", sendErr);
      }
    }

    return NextResponse.json({
      success: true,
      reply: aiResponse.reply,
      sent
    });
  } catch (error) {
    console.error("WhatsApp Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

export const GET = persistent(handleGET);
export const POST = persistent(handlePOST);
