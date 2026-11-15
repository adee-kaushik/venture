import { chatId, chatToken } from "@/lib/chat-session";
import { throttle } from "@/lib/accounts";
import { persistent } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/store";
import {
  generateChatResponse,
  SaveLeadSchema,
  RequestBookingSchema,
  LogUnansweredSchema
} from "@/lib/ai";

const ChatRequestSchema = z.object({
  businessSlug: z.string().min(1),
  message: z.string().min(1).max(1000),
  conversationId: z.string().min(1).max(128).optional()
});

// Simple in-memory rate limiting per IP / session
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 }); // 60 requests per minute
    return true;
  }
  if (entry.count >= 60) {
    return false;
  }
  entry.count++;
  return true;
}

async function handlePOST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local-client";
    if (!throttle("chat:"+ip, 60, 60000)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute before sending more messages." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { businessSlug, message } = parsed.data;

    // Retrieve business
    const business = store.getBusiness(businessSlug);
    if (!business) {
      return NextResponse.json(
        { error: `Business with slug '${businessSlug}' not found` },
        { status: 404 }
      );
    }

    // Get or initialize conversation
    const conversationId = chatId(req.cookies.get(`vl_chat_${business.id}`)?.value);
    const conversation = store.getOrCreateConversation(business.id, conversationId, "web");

    // Fetch previous message history for context
    const previousMessages = store.getMessages(conversation.id);
    const history = previousMessages.map((m) => ({
      role: m.role as "customer" | "ai",
      text: m.text
    }));

    // Record customer message
    store.addMessage(conversation.id, {
      role: "customer",
      text: message,
      inputTokens: 0,
      outputTokens: 0
    });

    if (conversation.status === "human" || /(?:human|receptionist|talk to (?:owner|staff)|speak to (?:someone|staff))/i.test(message)) {
      store.setConversationStatus(business.id, conversation.id, "human");
      const response = NextResponse.json({success:true,conversationId:conversation.id,reply:"Your message is in the team's inbox. A team member will reply here when available. You can also call the business directly."});
      response.cookies.set(`vl_chat_${business.id}`,chatToken(conversation.id),{httpOnly:true,sameSite:process.env.NODE_ENV==='production'?'none':'lax',secure:process.env.NODE_ENV==='production',partitioned:process.env.NODE_ENV==='production',path:'/',maxAge:86400});
      return response;
    }
    // Generate AI response grounded in knowledge base
    const aiResponse = await generateChatResponse(
      business,
      conversation.id,
      message,
      history
    );

    // Execute and validate tools if requested by AI
    if (aiResponse.toolCalls) {
      for (const tool of aiResponse.toolCalls) {
        if (tool.name === "save_lead") {
          const leadData = SaveLeadSchema.safeParse(tool.arguments);
          if (leadData.success) {
            store.saveLead(business.id, {
              name: leadData.data.name,
              phone: leadData.data.phone,
              details: leadData.data.details,
              conversationId: conversation.id
            });
          }
        } else if (tool.name === "request_booking") {
          const bookingData = RequestBookingSchema.safeParse(tool.arguments);
          if (bookingData.success) {
            const lead = store.saveLead(business.id, {
              name: bookingData.data.name,
              phone: bookingData.data.phone,
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

    // Store AI response with exact token metrics
    store.addMessage(conversation.id, {
      role: "ai",
      text: aiResponse.reply,
      inputTokens: aiResponse.inputTokens,
      outputTokens: aiResponse.outputTokens
    });

    const response = NextResponse.json({
      success: true,
      conversationId: conversation.id,
      reply: aiResponse.reply,
      toolCalls: aiResponse.toolCalls,
      tokens: {
        input: aiResponse.inputTokens,
        output: aiResponse.outputTokens
      }
    });
    response.cookies.set(`vl_chat_${business.id}`,chatToken(conversation.id),{httpOnly:true,sameSite:process.env.NODE_ENV==='production'?'none':'lax',secure:process.env.NODE_ENV==='production',partitioned:process.env.NODE_ENV==='production',path:'/',maxAge:86400});
    return response;
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

export const POST = persistent(handlePOST);

export const GET = persistent(async (req: NextRequest) => {
 const business=store.getBusiness(req.nextUrl.searchParams.get('businessSlug')||'');
 if(!business)return NextResponse.json({error:'Not found'},{status:404});
 const id=chatId(req.cookies.get(`vl_chat_${business.id}`)?.value);
 const c=id?store.getConversations(business.id).find(c=>c.id===id):null;
 if(!c)return NextResponse.json({success:true,messages:[]});
 return NextResponse.json({success:true,conversationId:c.id,status:c.status,messages:store.getMessages(c.id).map(({id,role,text,createdAt})=>({id,role,text,createdAt}))});
});
