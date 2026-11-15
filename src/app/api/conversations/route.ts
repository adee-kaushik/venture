import { persistent } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { store } from "@/lib/store";

async function handleGET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId") || "biz-coaching-1";
  const conversationId = searchParams.get("conversationId");

  if (conversationId) {
    const conversation = store.getConversations(businessId).find((item) => item.id === conversationId);
    if (!conversation) return NextResponse.json({ error: "Conversation not found for this business" }, { status: 404 });
    const messages = store.getMessages(conversationId);
    return NextResponse.json({ success: true, messages });
  }

  const conversations = store.getConversations(businessId);
  const conversationsWithLastMessage = conversations.map((c) => {
    const msgs = store.getMessages(c.id);
    return {
      ...c,
      messageCount: msgs.length,
      lastMessage: msgs.length > 0 ? msgs[msgs.length - 1] : null
    };
  });

  return NextResponse.json({ success: true, conversations: conversationsWithLastMessage });
}

export const GET = persistent(handleGET);

export const PATCH = persistent(async (req: NextRequest) => {
  if (!isAdminRequest(req)) return NextResponse.json({error:'Unauthorized'},{status:401});
  const {businessId,conversationId,status,text}=await req.json();
  const c=store.getConversations(businessId).find(c=>c.id===conversationId);
  if(!c)return NextResponse.json({error:'Conversation not found'},{status:404});
  if(text!==undefined){
    if(typeof text!=='string'||!text.trim()||text.length>2000)return NextResponse.json({error:'Enter a reply under 2000 characters'},{status:400});
    if(c.channel==='whatsapp')return NextResponse.json({error:'WhatsApp owner replies require an active business messaging connection.'},{status:422});
    store.setConversationStatus(businessId,conversationId,'human');
    store.addMessage(conversationId,{role:'owner',text:text.trim(),inputTokens:0,outputTokens:0});
  }else if(['active','human','closed'].includes(status))store.setConversationStatus(businessId,conversationId,status);
  else return NextResponse.json({error:'Invalid status'},{status:400});
  return NextResponse.json({success:true});
});
