import { persistent } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { store } from "@/lib/store";

async function handleGET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId") || "biz-coaching-1";
  const stats = store.getStats(businessId);
  return NextResponse.json({ success: true, stats, integrations: { replyMode: process.env.ANTHROPIC_API_KEY ? "AI provider connected" : "Knowledge-based replies (AI provider not connected)", whatsapp: Boolean(process.env.WHATSAPP_TOKEN && process.env.META_APP_SECRET && process.env.WHATSAPP_BUSINESS_MAPPING), storage: "PostgreSQL connected" } });
}

export const GET = persistent(handleGET);
