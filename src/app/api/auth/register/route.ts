import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { persistent } from '@/lib/database';
import { accounts, registerAccount, throttle } from '@/lib/accounts';
import { store } from '@/lib/store';
import { ADMIN_COOKIE, SESSION_SECONDS, createAdminSession, adminConfigured } from '@/lib/admin-auth';
const schema=z.object({email:z.email().max(200),password:z.string().min(12).max(128),name:z.string().min(2).max(120),contact:z.string().regex(/^(?:\+91[ -]?)?[6-9]\d{9}$/),templateType:z.enum(['salon','coaching','clinic','cafe']),city:z.string().max(80).default('Jaipur'),timings:z.string().max(160).default('Please contact the business for opening hours')});
export const POST=persistent(async(req:NextRequest)=>{
 if(!adminConfigured())return NextResponse.json({error:'Registration is not configured'},{status:503});
 const ip=(req.headers.get('x-forwarded-for')||'unknown').split(',')[0];
 if(!throttle('signup:'+ip,5,3600000))return NextResponse.json({error:'Please try again later'},{status:429});
 const parsed=schema.safeParse(await req.json());
 if(!parsed.success)return NextResponse.json({error:'Use a valid email, 10-digit Indian mobile number and a password of at least 12 characters.'},{status:400});
 const {email,password,...biz}=parsed.data;const normalized=email.trim().toLowerCase();
 if(accounts().some(a=>a.email===normalized))return NextResponse.json({error:'This email is already registered. Please sign in.'},{status:409});
 const slug=(biz.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'business')+'-'+crypto.randomUUID().slice(0,6);
 const business=store.createBusiness({...biz,slug,address:''});registerAccount(normalized,password,business.id);
 const res=NextResponse.json({success:true,business});res.cookies.set(ADMIN_COOKIE,createAdminSession(business.id),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:SESSION_SECONDS});return res;
});
