import { NextRequest } from 'next/server';
import { persistent } from '@/lib/database';
import { accounts, registerAccount } from '@/lib/accounts';
import { ADMIN_COOKIE, isAdminRequest, sessionScope } from '@/lib/admin-auth';
import { store } from '@/lib/store';
import { z } from 'zod';

const publicAccount = (a: ReturnType<typeof accounts>[number]) => ({email:a.email,name:a.name || a.email,active:a.active !== false,role:'staff'});
function allowed(req: NextRequest, businessId: string) {
  const scope = sessionScope(req.cookies.get(ADMIN_COOKIE)?.value);
  return isAdminRequest(req) && (scope === '*' || scope === businessId);
}
export const GET = persistent(async req => {
  const businessId = req.nextUrl.searchParams.get('businessId') || '';
  if(!allowed(req,businessId)) return Response.json({error:'Unauthorized'},{status:403});
  return Response.json({staff:accounts().filter(a=>a.businessId===businessId&&a.role==='staff').map(publicAccount)});
});
export const POST = persistent(async req => {
  const parsed = z.object({businessId:z.string(),name:z.string().trim().min(1).max(80),email:z.email().max(254),password:z.string().min(12).max(128)}).safeParse(await req.json());
  if(!parsed.success) return Response.json({error:'Enter a name, valid email and password of at least 12 characters.'},{status:400});
  const {businessId,name,password}=parsed.data, email=parsed.data.email.toLowerCase();
  if(!allowed(req,businessId)) return Response.json({error:'Unauthorized'},{status:403});
  if(!store.getBusiness(businessId)) return Response.json({error:'Business not found'},{status:404});
  if(accounts().some(a=>a.email===email)) return Response.json({error:'This email already has an account.'},{status:409});
  registerAccount(email,password,businessId);
  Object.assign(accounts().find(a=>a.email===email)!,{name,role:'staff',active:true,sessionVersion:0});
  return Response.json({success:true});
});
export const PATCH = persistent(async req => {
  const {businessId,email,active}=await req.json();
  if(!allowed(req,businessId)) return Response.json({error:'Unauthorized'},{status:403});
  const account=accounts().find(a=>a.businessId===businessId&&a.email===email&&a.role==='staff');
  if(!account||typeof active!=='boolean') return Response.json({error:'Invalid staff account'},{status:400});
  account.active=active;account.sessionVersion=(account.sessionVersion||0)+1;store.dirty=true;
  return Response.json({success:true});
});
