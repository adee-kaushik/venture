import { persistent } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { store } from '@/lib/store';
import { z } from 'zod';
export const GET=persistent(async(req:NextRequest)=>{
 if(!isAdminRequest(req))return NextResponse.json({error:'Unauthorized'},{status:401});
 return NextResponse.json({success:true,bookings:store.getBookings(req.nextUrl.searchParams.get('businessId')||'')});
});
const schema=z.object({businessId:z.string(),bookingId:z.string(),status:z.enum(['pending','confirmed','declined']),requestedTime:z.string().optional(),durationMinutes:z.number().int().min(15).max(480).optional(),resource:z.string().min(1).max(80).optional()});
export const PATCH=persistent(async(req:NextRequest)=>{
 if(!isAdminRequest(req))return NextResponse.json({error:'Unauthorized'},{status:401});
 const parsed=schema.safeParse(await req.json());if(!parsed.success)return NextResponse.json({error:'Invalid booking details'},{status:400});
 const {businessId,bookingId,status,requestedTime,durationMinutes,resource}=parsed.data;
 const booking=store.getBookings(businessId).find(b=>b.id===bookingId);if(!booking)return NextResponse.json({error:'Booking not found'},{status:404});
 const time=requestedTime||booking.requestedTime;const start=Date.parse(time);const duration=durationMinutes||Number(booking.details.durationMinutes)||30;const assigned=resource||booking.details.resource||'Front desk';
 if(status==='confirmed'){
  if(!Number.isFinite(start)||!/(Z|[+-]\d{2}:\d{2})$/.test(time)||start<Date.now())return NextResponse.json({error:'Choose a future date and time before confirming.'},{status:422});
  const conflict=store.getBookings(businessId).some(b=>b.id!==bookingId&&b.status==='confirmed'&&(b.details.resource||'Front desk')===assigned&&start<Date.parse(b.requestedTime)+(Number(b.details.durationMinutes)||30)*60000&&start+duration*60000>Date.parse(b.requestedTime));
  if(conflict)return NextResponse.json({error:'This team member or resource already has an overlapping booking. Choose another time or resource.'},{status:409});
 }
 booking.requestedTime=time;booking.details={...booking.details,durationMinutes:String(duration),resource:assigned};
 const changed=booking.status!==status;
 store.updateBookingStatus(businessId,bookingId,status);
 // One-click owner confirmations appear in the linked website conversation.
 // WhatsApp confirmations must use an approved, consent-aware provider flow.
 let notifiedCustomer=false;
 if(changed && (status==='confirmed'||status==='declined') && booking.leadId){
  const lead=store.getLeads(businessId).find(l=>l.id===booking.leadId);
  const conversation=lead?.conversationId && store.getConversations(businessId).find(c=>c.id===lead.conversationId);
  if(conversation && conversation.channel==='web' && conversation.status!=='closed'){
   const dateLabel=new Date(start).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'});
   const text=status==='confirmed'
    ? 'Your appointment request has been confirmed for '+dateLabel+' IST. Please contact the business if you need to make a change.'
    : 'Your appointment request could not be confirmed. Please reply here so our team can help with another time.';
   store.addMessage(conversation.id,{role:'owner',text,inputTokens:0,outputTokens:0});
   notifiedCustomer=true;
  }
 }
 return NextResponse.json({success:true,booking,notifiedCustomer});
});
