import { persistent } from '@/lib/database';
import { store } from '@/lib/store';
import { throttle } from '@/lib/accounts';
import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
const schema=z.object({businessSlug:z.string().max(160),name:z.string().min(2).max(100),phone:z.string().regex(/^(?:\+91)?[6-9]\d{9}$/),detail:z.string().max(1000).default(''),requestedTime:z.iso.datetime()});
export const POST=persistent(async(req:NextRequest)=>{
 const data=schema.safeParse(await req.json());if(!data.success)return NextResponse.json({error:'Enter your name, a valid Indian mobile number and a preferred date/time.'},{status:400});
 const ip=(req.headers.get('x-forwarded-for')||'unknown').split(',')[0];if(!throttle('booking:'+ip,10,3600000))return NextResponse.json({error:'Please try again later'},{status:429});
 const b=store.getBusiness(data.data.businessSlug);if(!b)return NextResponse.json({error:'Business not found'},{status:404});
 if(Date.parse(data.data.requestedTime)<=Date.now())return NextResponse.json({error:'Please choose a future date and time'},{status:400});
 const lead=store.saveLead(b.id,{name:data.data.name,phone:data.data.phone,details:{request:data.data.detail}});
 const booking=store.saveBooking(b.id,{leadId:lead.id,requestedTime:data.data.requestedTime,details:{requestText:data.data.detail}});
 return NextResponse.json({success:true,bookingId:booking.id,status:'pending'});
});
