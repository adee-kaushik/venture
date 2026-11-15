import { persistent } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { store } from "@/lib/store";

async function handleGET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId") || "biz-coaching-1";
  const unanswered = store.getUnanswered(businessId);
  return NextResponse.json({ success: true, unanswered });
}

async function handlePATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { businessId, id, action, answer, category, title } = body;

    if (!businessId || !id) {
      return NextResponse.json(
        { error: "businessId and id are required" },
        { status: 400 }
      );
    }

    if (action === "resolve") {
      const resolved = store.resolveUnanswered(businessId, id);
      return NextResponse.json({ success: resolved });
    }

    // 1-Click "Add to Knowledge Base" loop:
    // Adds the answer to the knowledge base and resolves the unanswered question
    if (action === "addToKnowledge") {
      if (!answer) {
        return NextResponse.json({ error: "Answer content is required" }, { status: 400 });
      }

      const unansweredList = store.getUnanswered(businessId);
      const questionItem = unansweredList.find((q) => q.id === id);

      const newKB = store.addKnowledgeItem(businessId, {
        category: category || "faq",
        title: title || (questionItem ? questionItem.question : "Customer FAQ"),
        content: answer
      });

      store.resolveUnanswered(businessId, id);

      return NextResponse.json({
        success: true,
        knowledgeItem: newKB,
        message: "Question resolved and added to knowledge base"
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to process unanswered question" }, { status: 500 });
  }
}

export const GET = persistent(handleGET);
export const PATCH = persistent(handlePATCH);
