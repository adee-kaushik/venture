import { persistent } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { store } from "@/lib/store";

async function handleGET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId") || "biz-coaching-1";
  const items = store.getKnowledge(businessId);
  return NextResponse.json({ success: true, items });
}

async function handlePOST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { businessId, category, title, content } = body;

    if (!businessId || !title || !content) {
      return NextResponse.json(
        { error: "businessId, title, and content are required" },
        { status: 400 }
      );
    }

    const newItem = store.addKnowledgeItem(businessId, {
      category: category || "faq",
      title,
      content
    });

    return NextResponse.json({ success: true, item: newItem }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create knowledge item" }, { status: 500 });
  }
}

async function handlePATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { businessId, id, updates } = body;

    if (!businessId || !id || !updates) {
      return NextResponse.json(
        { error: "businessId, id, and updates are required" },
        { status: 400 }
      );
    }

    const updated = store.updateKnowledgeItem(businessId, id, Object.fromEntries(Object.entries(updates).filter(([key, value]) => ["title", "content", "category"].includes(key) && typeof value === "string")));
    if (!updated) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

async function handleDELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const id = searchParams.get("id");

  if (!businessId || !id) {
    return NextResponse.json({ error: "businessId and id are required" }, { status: 400 });
  }

  const success = store.deleteKnowledgeItem(businessId, id);
  return NextResponse.json({ success });
}

export const GET = persistent(handleGET);
export const POST = persistent(handlePOST);
export const PATCH = persistent(handlePATCH);
export const DELETE = persistent(handleDELETE);
