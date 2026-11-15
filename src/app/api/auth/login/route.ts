import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, SESSION_SECONDS, adminConfigured, checkAdminPassword, createAdminSession } from '@/lib/admin-auth';
import { persistent } from '@/lib/database';
import { accounts, verifyPassword, throttle } from '@/lib/accounts';
export const POST = persistent(async (req: NextRequest) => {
  if (!adminConfigured()) return NextResponse.json({error:'Sign-in is not configured'}, {status:503});
  const ip=(req.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim();
  if(!throttle('login:'+ip,10,15*60000)) return NextResponse.json({error:'Too many attempts. Try again in 15 minutes.'},{status:429});
  const body=await req.json().catch(()=>null);
  if(typeof body?.password!=='string'||body.password.length>256) return NextResponse.json({error:'Invalid credentials'},{status:400});
  const account=accounts().find(a=>a.email===String(body.email||'').trim().toLowerCase());
  let scope: string | null=null;
  if(account && verifyPassword(account,body.password)) scope=account.businessId;
  else if(!body.email && checkAdminPassword(body.password)) scope='*';
  if(!scope) return NextResponse.json({error:'Incorrect email or password'},{status:401});
  const res=NextResponse.json({success:true});
  res.cookies.set(ADMIN_COOKIE,createAdminSession(scope),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:SESSION_SECONDS});return res;
});
