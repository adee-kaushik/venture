import { persistent } from '@/lib/database';
import { store } from '@/lib/store';
import { isAdminRequest } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
type FollowUp={id:string;businessId:string;leadId:string;text:string;dueAt:string;status:'pending'|'done';createdAt:string};
function all(){return (store.extra.followups||[]) as FollowUp[];}
export const GET=persistent(async(req:NextRequest)=>{
 if(!isAdminRequest(req))return NextResponse.json({error:'Unauthorized'},{status:401});
 return NextResponse.json({success:true,followups:all().filter(f=>f.businessId===req.nextUrl.searchParams.get('businessId')).sort((a,b)=>a.dueAt.localeCompare(b.dueAt))});
});
const schema=z.object({businessId:z.string(),leadId:z.string(),text:z.string().min(1).max(2000),dueAt:z.iso.datetime()});
export const POST=persistent(async(req:NextRequest)=>{
 if(!isAdminRequest(req))return NextResponse.json({error:'Unauthorized'},{status:401});
 const p=schema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:'Select a lead, message and due date'},{status:400});
 if(!store.getLeads(p.data.businessId).some(l=>l.id===p.data.leadId))return NextResponse.json({error:'Lead not found'},{status:404});
 const followup={...p.data,id:crypto.randomUUID(),status:'pending' as const,createdAt:new Date().toISOString()};store.extra.followups=[...all(),followup];store.dirty=true;return NextResponse.json({success:true,followup});
});
export const PATCH=persistent(async(req:NextRequest)=>{
 if(!isAdminRequest(req))return NextResponse.json({error:'Unauthorized'},{status:401});
 const {businessId,id,status}=await req.json();const f=all().find(f=>f.businessId===businessId&&f.id===id);
 if(!f||!['done','pending'].includes(status))return NextResponse.json({error:'Invalid follow-up'},{status:400});f.status=status;store.dirty=true;return NextResponse.json({success:true});
});
