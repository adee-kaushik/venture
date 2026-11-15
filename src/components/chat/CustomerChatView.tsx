"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Phone,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Clock
} from "lucide-react";
import { BusinessTemplate } from "@/lib/templates";

interface Message {
  id: string;
  role: "customer" | "ai" | "owner";
  text: string;
  createdAt: string;
  isStreaming?: boolean;
}

function makeMessage(role: "customer" | "ai", text: string): Message {
  return {
    id: `${role}-${Math.random().toString(36).slice(2, 9)}`,
    role,
    text,
    createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  };
}

interface CustomerChatViewProps {
  business: {
    id: string;
    slug: string;
    name: string;
    templateType: string;
    city: string;
    timings: string;
    address: string;
    contact: string;
  };
  template: BusinessTemplate;
  demo?: boolean;
}

export default function CustomerChatView({ business, template, demo = false }: CustomerChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "ai",
      text: `Namaste! Welcome to ${business.name}. I am your 24/7 AI assistant. Ask about our services, timings or request a ${template.bookingFlowName.toLowerCase()} in English or Hinglish.`,
      createdAt: "Just now"
    }
  ]);
  const [requestError, setRequestError] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", detail: "" });
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  useEffect(() => {
    if(demo) return;
    let alive=true;
    async function poll(){
      if(document.hidden || loading) return;
      try {
        const r=await fetch(`/api/chat?businessSlug=${encodeURIComponent(business.slug)}`);
        const d=await r.json();
        if(alive && d.success && d.messages?.length){
          setConversationId(d.conversationId);
          setMessages(d.messages.map((m: Message)=>({...m,createdAt:new Date(m.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})})));
        }
      } catch { /* Retry on the next poll; sending errors are shown inline. */ }
    }
    void poll(); const timer=setInterval(poll,7000); return()=>{alive=false;clearInterval(timer);};
  },[business.slug,loading,demo]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const customerMsg = makeMessage("customer", text);

    setMessages((prev) => [...prev, customerMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(demo?"/api/demo-chat":"/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessSlug: business.slug,
          message: text,
          conversationId: conversationId || undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        if (!conversationId && data.conversationId) {
          setConversationId(data.conversationId);
        }

        const aiMsg = makeMessage("ai", data.reply);
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errorMsg = makeMessage("ai", data.error || "Sorry, I had trouble retrieving that. Please try again.");
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch {
      const errorMsg = makeMessage("ai", "Network connection lost. Please check your internet or call us directly.");
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const submitDirectLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone) return;

    if(demo){setRequestError("This is a demo. Create a workspace to receive real booking requests.");return;}
    setLoading(true); setRequestError("");
    try {
      const res=await fetch('/api/booking-request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({businessSlug:business.slug,name:leadForm.name,phone:leadForm.phone.replace(/[^+0-9]/g,''),detail:leadForm.detail,requestedTime:preferredTime?new Date(preferredTime+':00+05:30').toISOString():''})});
      const data=await res.json(); if(!res.ok)throw Error(data.error||'Unable to save request');
      setLeadSubmitted(true);
    }catch(e){setRequestError(e instanceof Error?e.message:'Unable to save request');}finally{setLoading(false);}

  };

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-xl mx-auto bg-[#F7F9F8] text-[#172F32] shadow-2xl border-x border-[#DEE7E4] overflow-hidden">
      {demo && <div className="bg-amber-50 text-amber-800 text-[10px] text-center p-2">Interactive demo · fictional business · nothing is saved. <a href="/signup" className="underline">Create your workspace</a></div>}
      {/* Business Header */}
      <header className="px-4 py-3 bg-[#FFFFFF]/95 backdrop-blur border-b border-[#DEE7E4] flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center font-bold text-white shadow-md shadow-teal-500/25">
              {business.name.charAt(0)}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#FFFFFF] rounded-full"></span>
          </div>
          <div>
            <h1 className="font-semibold text-sm sm:text-base leading-tight text-stone-900 flex items-center gap-1.5">
              {business.name}
              <ShieldCheck className="w-4 h-4 text-emerald-600 inline" />
            </h1>
            <p className="text-xs text-[#596F71] flex items-center gap-1">
              <span className="text-emerald-600 font-medium">Online</span> • Responds instantly
            </p>
          </div>
        </div>

        <button
          onClick={() => {setLeadSubmitted(false);setRequestError("");setShowLeadModal(true);}}
          className="text-xs font-medium px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-sm transition flex items-center gap-1.5"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{template.bookingFlowName.split("/")[0]}</span>
        </button>
      </header>

      {/* Business Details Banner (Mobile-Friendly Horizontal Scroll) */}
      <div className="px-4 py-2 bg-[#EDF4F1] border-b border-[#DEE7E4] text-xs text-stone-600 flex items-center justify-between gap-3 overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-1 shrink-0">
          <Clock className="w-3.5 h-3.5 text-stone-500" />
          <span>{business.timings}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <MapPin className="w-3.5 h-3.5 text-stone-500" />
          <span>{business.city}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-teal-700 font-medium">
          <Phone className="w-3.5 h-3.5" />
          <span>{business.contact}</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${m.role === "customer" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                m.role === "customer"
                  ? "bg-[#DFECE6] text-stone-800"
                  : "bg-teal-100 text-teal-700 border border-teal-200 shadow-sm"
              }`}
            >
              {m.role === "customer" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                m.role === "customer"
                  ? "bg-teal-600 text-white rounded-tr-none"
                  : "bg-white text-stone-900 rounded-tl-none border border-[#DEE7E4]"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
              <span
                className={`block text-[10px] mt-1 text-right ${
                  m.role === "customer" ? "text-teal-100" : "text-stone-400"
                }`}
              >
                {m.createdAt}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-stone-600 text-xs py-2 px-3 bg-white rounded-xl w-fit border border-[#DEE7E4]">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-spin" />
            <span>Assistant is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts / Suggestion Pills */}
      <div className="px-3 py-2 bg-[#FFFFFF] border-t border-[#DEE7E4] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {template.sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            disabled={loading}
            onClick={() => handleSend(q)}
            className="whitespace-nowrap px-3 py-1 text-xs bg-white hover:bg-teal-50 active:scale-95 text-stone-800 rounded-full border border-[#DEE7E4] transition shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 bg-[#FFFFFF] border-t border-[#DEE7E4]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question (fees, timings, demo)..."
            className="flex-1 bg-white border border-[#DEE7E4] rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder-[#9C868C] focus:outline-none focus:border-teal-500 transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white p-2.5 rounded-xl shadow-sm transition shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-2 text-center">
          <span className="text-[10px] text-[#8C767C] flex items-center justify-center gap-1">
            ⚡ Powered by <strong className="text-stone-800">VentureLab</strong> — AI Business Engine
          </span>
        </div>
      </div>

      {/* Lead / Booking Modal */}
      {showLeadModal && (
        <div onClick={e=>{if(e.target===e.currentTarget)setShowLeadModal(false);}} className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDFB] border border-[#DEE7E4] rounded-2xl w-full max-w-sm p-5 shadow-2xl relative">
            <h3 className="text-base font-semibold text-stone-900 flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-teal-600" />
              {template.bookingFlowName}
            </h3>
            <p className="text-xs text-[#596F71] mb-4">
              Leave your contact and preferred time. Our team will verify and reserve your slot.
            </p>

            {leadSubmitted ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
                <p className="text-sm font-medium text-emerald-700">Request Received!</p>
                <p className="text-xs text-stone-500">Your request is pending. The team will confirm your appointment.</p><button type="button" className="ops-button" onClick={()=>setShowLeadModal(false)}>Done</button>
              </div>
            ) : (
              <form onSubmit={submitDirectLead} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-[#FFFFFF] border border-[#DEE7E4] rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">10-Digit WhatsApp / Phone</label>
                  <input
                    type="tel"
                    required
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    placeholder="Your mobile number" pattern="(?:\+91[ -]?)?[6-9][0-9]{9}"
                    className="w-full bg-[#FFFFFF] border border-[#DEE7E4] rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Preferred Slot / Requirement</label>
                  <input
                    type="text"
                    value={leadForm.detail}
                    onChange={(e) => setLeadForm({ ...leadForm, detail: e.target.value })}
                    placeholder="e.g. Saturday 11 AM, Class 11 Physics"
                    className="w-full bg-[#FFFFFF] border border-[#DEE7E4] rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <label className="block text-xs">Preferred date & time (IST)<input className="w-full mt-1 border border-teal-100 rounded-lg px-3 py-2" type="datetime-local" required value={preferredTime} onChange={e=>setPreferredTime(e.target.value)}/></label>
                <p className="text-[10px] text-stone-500">By submitting, you agree that this business may contact you about this request. Please avoid sharing medical or other sensitive information.</p>
                {requestError && <p role="alert" className="text-xs text-red-700">{requestError}</p>}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLeadModal(false)}
                    className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" disabled={loading}
                    className="px-4 py-2 text-xs font-medium bg-teal-600 hover:bg-teal-500 text-white rounded-lg shadow"
                  >
                    Request appointment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
