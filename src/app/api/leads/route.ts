import { persistent } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { store, LeadData } from "@/lib/store";

async function handleGET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId") || "biz-coaching-1";
  const leads = store.getLeads(businessId);
  return NextResponse.json({ success: true, leads });
}

async function handlePATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { businessId, leadId, status } = body;

    if (!businessId || !leadId || !["new", "contacted", "converted", "lost"].includes(status)) {
      return NextResponse.json(
        { error: "businessId, leadId, and status are required" },
        { status: 400 }
      );
    }

    const updated = store.updateLeadStatus(businessId, leadId, status as LeadData["status"]);
    if (!updated) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, lead: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update lead status" }, { status: 500 });
  }
}

export const GET = persistent(handleGET);
export const PATCH = persistent(handlePATCH);
