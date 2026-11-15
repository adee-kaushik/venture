import { NextRequest,NextResponse } from 'next/server';
import { VentureStore, storeContext } from '@/lib/store';
import { generateChatResponse } from '@/lib/ai';
import { z } from 'zod';
const schema=z.object({businessSlug:z.enum(['luxe-salon','apex-institute','care-clinic','roastery-cafe']),message:z.string().min(1).max(1000)});
export async function POST(req:NextRequest){
 const data=schema.safeParse(await req.json());if(!data.success)return NextResponse.json({error:'Invalid demo message'},{status:400});
 const demo=new VentureStore();const b=demo.getBusiness(data.data.businessSlug)!;
 const result=await storeContext.run(demo,()=>generateChatResponse(b,'demo',data.data.message,[],true));
 return NextResponse.json({success:true,reply:result.toolCalls?.some(t=>t.name==='save_lead'||t.name==='request_booking')?'This is a demonstration. No contact details or booking have been saved. Create your own workspace to receive real enquiries.':result.reply});
}
