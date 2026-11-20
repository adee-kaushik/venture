import { persistent } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import { sessionScope, ADMIN_COOKIE, isAdminRequest } from "@/lib/admin-auth";
import { store } from "@/lib/store";

async function handlePOST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { name, slug, templateType, city, timings, contact, address, initialKnowledge } = body;

    if (["luxe-salon","apex-institute","care-clinic","roastery-cafe"].includes(slug) || !name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || "") || !contact || !["salon", "coaching", "clinic", "cafe"].includes(templateType)) {
      return NextResponse.json(
        { error: "Name, slug, and contact are required fields" },
        { status: 400 }
      );
    }

    // Check if slug is already taken
    const existing = store.getBusiness(slug);
    if (existing) {
      return NextResponse.json(
        { error: `Business slug '${slug}' is already taken. Please choose another one.` },
        { status: 400 }
      );
    }

    // Create business
    const newBiz = store.createBusiness({
      name,
      slug,
      templateType: templateType || "coaching",
      city: city || "Jaipur",
      timings: timings || "9:00 AM - 8:00 PM",
      contact,
      address: address || ""
    });

    // If custom initial knowledge was supplied in the wizard, replace or append
    if (Array.isArray(initialKnowledge) && initialKnowledge.length > 0) {
      for (const item of initialKnowledge) {
        if (item.title && item.content) {
          store.addKnowledgeItem(newBiz.id, {
            category: item.category || "faq",
            title: item.title,
            content: item.content
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      business: newBiz
    });
  } catch (error) {
    console.error("Create business error:", error);
    return NextResponse.json(
      { error: "Failed to onboard business" },
      { status: 500 }
    );
  }
}

async function handleGET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = sessionScope(req.cookies.get(ADMIN_COOKIE)?.value);
  const businesses = store.getAllBusinesses().filter(b => scope === "*" || b.id === scope);
  return NextResponse.json({ success: true, businesses, isAdmin: scope === "*" });
}

export const POST = persistent(handlePOST);
export const GET = persistent(handleGET);

export const PATCH = persistent(async (req: NextRequest) => {
  if(!isAdminRequest(req))return NextResponse.json({error:'Unauthorized'},{status:401});
  const {businessId,...updates}=await req.json();const business=store.getBusiness(businessId);
  if(!business)return NextResponse.json({error:'Business not found'},{status:404});
  for(const key of ['name','city','timings','contact','address'] as const){
    if(updates[key]!==undefined){if(typeof updates[key]!=='string'||updates[key].length>250||(key!=='address'&&!updates[key].trim()))return NextResponse.json({error:'Complete every required business detail (maximum 250 characters each)'},{status:400});}
  }
  for(const key of ['name','city','timings','contact','address'] as const)if(updates[key]!==undefined)business[key]=updates[key].trim();
  store.dirty=true;return NextResponse.json({success:true,business});
});
