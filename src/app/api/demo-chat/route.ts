import { NextRequest, NextResponse } from 'next/server';
import { VentureStore, storeContext } from '@/lib/store';
import { generateChatResponse } from '@/lib/ai';
import { z } from 'zod';

const turn = z.object({role:z.enum(['customer','ai']), text:z.string().min(1).max(1000)});
const schema = z.object({
  businessSlug:z.enum(['luxe-salon','apex-institute','care-clinic','roastery-cafe']),
  message:z.string().min(1).max(1000),
  history:z.array(turn).max(12).default([])
});

export async function POST(req:NextRequest) {
  const data = schema.safeParse(await req.json().catch(() => null));
  if (!data.success) return NextResponse.json({error:'Invalid demo message'}, {status:400});
  const demo = new VentureStore();
  const business = demo.getBusiness(data.data.businessSlug)!;
  // Each request gets an isolated store: no visitor contact details are persisted.
  const result = await storeContext.run(demo, () =>
    generateChatResponse(business, 'demo', data.data.message, data.data.history, true));
  const wouldSave = result.toolCalls?.some(t => t.name === 'save_lead' || t.name === 'request_booking');
  return NextResponse.json({
    success:true,
    reply:wouldSave
      ? result.reply + '\n\nDemo only — nothing has been saved. Create a workspace to receive real enquiries.'
      : result.reply
  });
}
