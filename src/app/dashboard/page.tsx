"use client";

import { BookingDesk, Inbox, FollowUps, BusinessSettings } from "@/components/dashboard/Operations";
import TeamSettings from "@/components/dashboard/TeamSettings";
import Overview from "@/components/dashboard/Overview";
import "./workspace.css";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import VentureBrand from "../venture-brand";
import {
  Users,
  MessageSquare,
  BookOpen,
  HelpCircle,
  CalendarCheck,
  TrendingUp,
  RefreshCw,
  Plus,
  CheckCircle,
  Sparkles,
  Layers,
  Phone,
  Trash2,
  Copy,
  Check,
  Download,
  QrCode,
  Printer,
  Send
} from "lucide-react";

interface BusinessItem {
  slug: string;
  id: string;
  name: string;
  vertical: string;
  city?: string;
  timings?: string;
  contact?: string;
  address?: string;
}

interface LeadItem {
  id: string;
  name: string;
  phone: string;
  details?: Record<string, string>;
  status?: string;
  createdAt: string;
}

interface KnowledgeItem {
  id: string;
  businessId: string;
  category: string;
  title: string;
  content: string;
  updatedAt: string;
}

interface UnansweredItem {
  id: string;
  businessId: string;
  question: string;
  answer?: string;
  resolved: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface BookingItem {
  id: string;
  businessId: string;
  name?: string;
  phone?: string;
  leadId?: string;
  requestedTime: string;
  details?: Record<string, string>;
  status: "pending" | "confirmed" | "declined" | "cancelled";
  createdAt: string;
  updatedAt?: string;
}

interface ConversationItem {
  id: string;
  businessId: string;
  channel: "web" | "whatsapp";
  status: "active" | "closed";
  messageCount?: number;
  lastMessage?: { text?: string } | string;
  startedAt: string;
  updatedAt: string;
}

interface StatsData {
  totalLeads: number;
  newLeads: number;
  conversionRate: number | string;
  totalBookings: number;
  pendingBookings: number;
  totalConversations: number;
  totalMessages: number;
  unansweredCount: number;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costINR: number;
    costUSD?: number;
    costPerConversationINR: number;
  };
  estimatedCostInr?: string;
  costPerConversationInr?: string;
}

export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState<
    "settings" | "followups" | "overview" | "leads" | "knowledge" | "unanswered" | "bookings" | "conversations" | "qr" | "embed"
  >("overview");

  const [role,setRole]=useState('owner');
  const [moreOpen,setMoreOpen]=useState(false);
  const [businessesReady, setBusinessesReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  // Businesses list for switcher (fetched dynamically + defaults)
  const [businesses, setBusinesses] = useState<BusinessItem[]>([
    { slug: "apex-institute", id: "biz-coaching-1", name: "Apex IIT-JEE Academy", vertical: "Coaching" },
    { slug: "luxe-salon", id: "biz-salon-1", name: "Luxe Studio & Spa", vertical: "Salon" },
    { slug: "care-clinic", id: "biz-clinic-1", name: "Care Family Clinic", vertical: "Clinic" },
    { slug: "roastery-cafe", id: "biz-cafe-1", name: "The Roastery Cafe", vertical: "Cafe" }
  ]);

  // Selected active business
  const [_activeBusinessSlug, setActiveBusinessSlug] = useState("luxe-salon");
  const [businessId, setBusinessId] = useState("biz-salon-1");

  // Dashboard Data State
  const [stats, setStats] = useState<StatsData | null>(null);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [unanswered, setUnanswered] = useState<UnansweredItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("");
  const [loadError, setLoadError] = useState("");

  // New Knowledge Item Form
  const [showAddKb, setShowAddKb] = useState(false);
  const [newKb, setNewKb] = useState({ category: "faq", title: "", content: "" });

  // Unanswered answer modal
  const [answeringQuestion, setAnsweringQuestion] = useState<UnansweredItem | null>(null);
  const [answerContent, setAnswerContent] = useState("");

  // Copy embed snippet
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Fetch all onboarded businesses
  const fetchBusinesses = React.useCallback(async () => {
    try {
      const res = await fetch("/api/business");
      const data = await res.json();
      if (data.success && Array.isArray(data.businesses)) {
        const formatted: BusinessItem[] = data.businesses.map((b: { slug: string; id: string; name: string; templateType: string; city?: string; timings?: string; contact?: string; address?: string }) => ({
          slug: b.slug,
          id: b.id,
          name: b.name,
          vertical: b.templateType.charAt(0).toUpperCase() + b.templateType.slice(1),
          city: b.city,
          timings: b.timings,
          contact: b.contact,
          address: b.address
        }));
        setBusinesses(formatted);setBusinessesReady(true);setIsAdmin(data.isAdmin);setRole(data.role || "owner");
        if (formatted.length) { setBusinessId(formatted[0].id); setActiveBusinessSlug(formatted[0].slug); }
      }
    } catch (e) {
      console.error("Failed to fetch businesses:", e);
    }
  }, []);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [resStats, resLeads, resKb, resUnans, resBooks, resConvs] = await Promise.all([
        fetch(`/api/stats?businessId=${businessId}`),
        fetch(`/api/leads?businessId=${businessId}`),
        fetch(`/api/knowledge?businessId=${businessId}`),
        fetch(`/api/unanswered?businessId=${businessId}`),
        fetch(`/api/bookings?businessId=${businessId}`),
        fetch(`/api/conversations?businessId=${businessId}`)
      ]);

      const [dataStats, dataLeads, dataKb, dataUnans, dataBooks, dataConvs] = await Promise.all([
        resStats.json(),
        resLeads.json(),
        resKb.json(),
        resUnans.json(),
        resBooks.json(),
        resConvs.json()
      ]);

      if(!resStats.ok) throw new Error(dataStats.error || "Could not load workspace");
      if (dataStats.success) { setStats(dataStats.stats); setConnectionStatus(`${dataStats.integrations.storage} · ${dataStats.integrations.replyMode} · WhatsApp ${dataStats.integrations.whatsapp ? "configured" : "not connected"}`); }
      if (dataLeads.success) setLeads(dataLeads.leads);
      if (dataKb.success) setKnowledge(dataKb.items);
      if (dataUnans.success) setUnanswered(dataUnans.unanswered);
      if (dataBooks.success) setBookings(dataBooks.bookings);
      if (dataConvs.success) setConversations(dataConvs.conversations);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load workspace");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectBusiness = (b: { slug: string; id: string }) => {
    setActiveBusinessSlug(b.slug);
    setBusinessId(b.id);
  };

  const handleAddKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKb.title || !newKb.content) return;

    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          ...newKb
        })
      });
      const data = await res.json();
      if (data.success) {
        setKnowledge((prev) => [data.item, ...prev]);
        setNewKb({ category: "faq", title: "", content: "" });
        setShowAddKb(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    try {
      const res = await fetch(`/api/knowledge?businessId=${businessId}&id=${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setKnowledge((prev) => prev.filter((k) => k.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveUnanswered = async (id: string, addToKb: boolean) => {
    try {
      const res = await fetch("/api/unanswered", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          id,
          addToKnowledgeBase: addToKb,
          answer: answerContent
        })
      });
      const data = await res.json();
      if (data.success) {
        setUnanswered((prev) =>
          prev.map((u) => (u.id === id ? { ...u, resolved: true, answer: answerContent } : u))
        );
        if (addToKb && data.knowledgeItem) {
          setKnowledge((prev) => [data.knowledgeItem, ...prev]);
        }
        setAnsweringQuestion(null);
        setAnswerContent("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateBookingStatus = async (
    bookingId: string,
    status: "confirmed" | "declined" | "cancelled"
  ) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          bookingId,
          status
        })
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: data.booking.status } : b))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, status: "new" | "contacted" | "converted") => {
    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          leadId,
          status
        })
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: data.lead.status } : l))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to export Leads as CSV
  const exportLeadsToCSV = () => {
    if (leads.length === 0) {
      alert("No leads to export yet.");
      return;
    }

    const headers = ["ID", "Name", "Phone", "Status", "Created At", "Details"];
    const rows = leads.map((l) => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      l.status || "new",
      new Date(l.createdAt).toLocaleString(),
      `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `venturelab-leads-${currentBusiness.slug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for 1-Click WhatsApp Direct Chat URL
  const getWhatsAppFollowUpUrl = (lead: LeadItem) => {
    const cleanPhone = lead.phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const greeting = `Namaste ${lead.name}! Aapne ${currentBusiness.name} ke baare mein inquire kiya tha. How can we help you today with admission/booking details?`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(greeting)}`;
  };

  if(!businessesReady)return <main className="min-h-screen grid place-items-center"><div className="text-center"><p>Opening your workspace…</p><a className="text-teal-700 text-sm underline" href="/login">Return to sign in</a></div></main>;
  if(!businesses.length)return <main className="p-10"><h1>No businesses yet</h1><Link href="/onboard">Add your first business</Link></main>;
  const currentBusiness = businesses.find((b) => b.id === businessId) || businesses[0];
  const embedSnippet = `<script src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js" data-business-slug="${currentBusiness.slug}"></script>`;
  const chatUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/c/${currentBusiness.slug}`;
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(chatUrl)}`;

  const navTabs = [
    { id: "overview" as const, label: "Overview", icon: TrendingUp },
    { id: "followups" as const, label: "Follow-ups", icon: Send },
    { id: "leads" as const, label: "Leads", icon: Users, badge: leads.length },
    { id: "bookings" as const, label: "Bookings", icon: CalendarCheck, badge: bookings.filter((b) => b.status === "pending").length },
    { id: "knowledge" as const, label: "Knowledge", icon: BookOpen, badge: knowledge.length },
    { id: "unanswered" as const, label: "Gaps", icon: HelpCircle, badge: unanswered.filter((u) => !u.resolved).length, badgeColor: "rose" },
    { id: "conversations" as const, label: "Inbox", icon: MessageSquare },
    { id: "settings" as const, label: "Settings", icon: Layers },
    { id: "qr" as const, label: "QR Standee", icon: QrCode },
    { id: "embed" as const, label: "Widget", icon: Layers }
  ];

  return (
    <div className="workspace min-h-screen bg-[#F7F9F8] text-[#172F32] selection:bg-teal-200 selection:text-teal-900 flex flex-col md:flex-row w-full overflow-x-hidden">
      {/* Sidebar Navigation (Responsive: Top on mobile, Left on desktop) */}
      <aside className="workspace-sidebar"><VentureBrand className="brand-compact"/><label className="business-switch"><span className="sr-only">Active business</span><select value={businessId} onChange={e=>{const b=businesses.find(b=>b.id===e.target.value);if(b)handleSelectBusiness(b);}}>{businesses.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label><nav className="desktop-nav" aria-label="Workspace">{navTabs.filter(t=>role==='owner'||['overview','conversations','leads','bookings','followups'].includes(t.id)).map(t=><button key={t.id} aria-current={activeTab===t.id?'page':undefined} onClick={()=>setActiveTab(t.id)}><t.icon size={22}/>{t.label}</button>)}</nav><span className="workspace-role">{role==='staff'?'Staff workspace':'Owner workspace'}</span><button className="signout" onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});location.href='/login';}}>Sign out</button>{isAdmin&&<Link href="/onboard">Add business</Link>}</aside>
      <nav className="mobile-nav" aria-label="Mobile workspace">{navTabs.filter(t=>['overview','conversations','leads','bookings'].includes(t.id)).map(t=><button key={t.id} aria-current={activeTab===t.id?'page':undefined} onClick={()=>{setActiveTab(t.id);setMoreOpen(false);}}><t.icon size={24}/>{t.id==='overview'?'Home':t.label}</button>)}<button aria-expanded={moreOpen} onClick={()=>setMoreOpen(!moreOpen)}><Layers size={24}/>More</button></nav>{moreOpen&&<div className="mobile-more">{navTabs.filter(t=>!['overview','conversations','leads','bookings'].includes(t.id)&&(role==='owner'||t.id==='followups')).map(t=><button key={t.id} onClick={()=>{setActiveTab(t.id);setMoreOpen(false);}}>{t.label}</button>)}<button onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});location.href='/login';}}>Sign out</button></div>}
      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
        <header className="workspace-header"><div><h1>{activeTab==='overview'?'Welcome, '+currentBusiness.name:navTabs.find(t=>t.id===activeTab)?.label}</h1><p>{role==='staff'?'Your team’s front desk workspace':'Here is what needs your attention today'}</p></div><div className="header-actions"><a href={chatUrl} target="_blank" rel="noreferrer" className="ops-button filled"><MessageSquare size={18}/>Test chat</a><button className="ops-button" disabled={loading} onClick={fetchData}><RefreshCw size={16}/>Refresh</button><span className="channel-state">Website chat live · <em>{connectionStatus.includes('WhatsApp configured')?'WhatsApp configured':'WhatsApp not connected'}</em></span></div></header>{loadError&&<p role="alert" className="ops-error">{loadError}</p>}{loading&&!stats&&<p role="status">Loading workspace…</p>}{activeTab==='overview'&&stats&&<Overview businessId={businessId} stats={stats} bookings={bookings} leads={leads} conversations={conversations} unanswered={unanswered} staff={role==='staff'} navigate={tab=>setActiveTab(tab as typeof activeTab)}/>}
        {/* TAB 2: LEADS PIPELINE */}
        {activeTab === "leads" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-stone-900">Lead Pipeline & Qualification</h2>
                <p className="text-xs text-[#596F71]">
                  Qualified customer leads ready for instant phone or WhatsApp follow-up
                </p>
              </div>

              <button
                onClick={exportLeadsToCSV}
                className="px-3 py-1.5 bg-white border border-[#CDDCD7] hover:bg-[#FFFFFF] text-stone-800 rounded-xl text-xs font-medium flex items-center gap-1.5 transition self-start shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export to Excel / CSV</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["new", "contacted", "converted"].map((statusCol) => {
                const columnLeads = leads.filter((l) => l.status === statusCol);
                return (
                  <div key={statusCol} className="bg-white border border-[#DEE7E4] rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#DEE7E4]">
                      <span className="text-xs font-semibold capitalize text-stone-900">
                        {statusCol} ({columnLeads.length})
                      </span>
                    </div>

                    <div className="space-y-3">
                      {columnLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="bg-[#FFFFFF] border border-[#DEE7E4] p-3.5 rounded-xl shadow-xs text-xs space-y-2.5"
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-semibold text-stone-900">{lead.name}</span>
                            <span className="text-[10px] text-[#596F71]">
                              {new Date(lead.createdAt).toLocaleDateString([], {
                                month: "short",
                                day: "numeric"
                              })}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <a
                              href={`tel:${lead.phone}`}
                              className="text-teal-700 font-mono flex items-center gap-1 hover:underline text-xs"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{lead.phone}</span>
                            </a>

                            {/* 1-Click WhatsApp Follow-up */}
                            <a
                              href={getWhatsAppFollowUpUrl(lead)}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 rounded text-[10px] font-medium flex items-center gap-1 transition"
                            >
                              <Send className="w-2.5 h-2.5" />
                              <span>WhatsApp</span>
                            </a>
                          </div>

                          {lead.details && Object.keys(lead.details).length > 0 && (
                            <div className="bg-white p-2 rounded-lg text-[11px] text-stone-800 space-y-0.5 border border-[#DEE7E4]">
                              {Object.entries(lead.details).map(([k, v]) => (
                                <div key={k} className="truncate">
                                  <span className="text-stone-500 capitalize">{k}:</span> {String(v)}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Quick status transition buttons */}
                          <div className="flex items-center gap-1.5 pt-1">
                            {statusCol !== "contacted" && (
                              <button
                                onClick={() => handleUpdateLeadStatus(lead.id, "contacted")}
                                className="px-2 py-1 bg-white hover:bg-stone-100 border border-[#CDDCD7] text-stone-800 rounded text-[10px]"
                              >
                                Mark Contacted
                              </button>
                            )}
                            {statusCol !== "converted" && (
                              <button
                                onClick={() => handleUpdateLeadStatus(lead.id, "converted")}
                                className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-[10px]"
                              >
                                Mark Converted
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {columnLeads.length === 0 && (
                        <div className="py-6 text-center text-xs text-[#8C767C]">No leads in {statusCol}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: KNOWLEDGE BASE EDITOR */}
        {activeTab === "knowledge" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-stone-900">Knowledge Base Grounding</h2>
                <p className="text-xs text-[#596F71]">
                  Any edit or new entry here is immediately reflected in customer AI chat replies
                </p>
              </div>

              <button
                onClick={() => setShowAddKb(!showAddKb)}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow transition self-start"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Knowledge Item</span>
              </button>
            </div>

            {/* Add New Knowledge Modal / Form */}
            {showAddKb && (
              <form onSubmit={handleAddKnowledge} className="bg-white border border-teal-300 rounded-2xl p-4 sm:p-5 space-y-3 shadow-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Category</label>
                    <select
                      value={newKb.category}
                      onChange={(e) => setNewKb({ ...newKb, category: e.target.value })}
                      className="w-full bg-[#FFFFFF] border border-[#DEE7E4] rounded-lg px-3 py-2 text-xs text-stone-900"
                    >
                      <option value="fees">Fees & Pricing</option>
                      <option value="courses">Courses / Services</option>
                      <option value="faculty">Faculty / Staff</option>
                      <option value="timings">Timings & Schedule</option>
                      <option value="location">Location & Landmark</option>
                      <option value="faq">General FAQ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Title / Question</label>
                    <input
                      type="text"
                      required
                      value={newKb.title}
                      onChange={(e) => setNewKb({ ...newKb, title: e.target.value })}
                      placeholder="e.g. Class 11 Fee Installment Schedule"
                      className="w-full bg-[#FFFFFF] border border-[#DEE7E4] rounded-lg px-3 py-2 text-xs text-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Verified Information / Answer</label>
                  <textarea
                    rows={3}
                    required
                    value={newKb.content}
                    onChange={(e) => setNewKb({ ...newKb, content: e.target.value })}
                    placeholder="Enter the factual details. The AI assistant will only say what is written here."
                    className="w-full bg-[#FFFFFF] border border-[#DEE7E4] rounded-lg px-3 py-2 text-xs text-stone-900 leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddKb(false)}
                    className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-medium shadow-sm"
                  >
                    Save & Ground AI
                  </button>
                </div>
              </form>
            )}

            {/* List of Knowledge Base Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {knowledge.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-[#DEE7E4] rounded-xl p-4 space-y-2 relative group hover:border-teal-300 transition shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-mono">
                      {item.category}
                    </span>
                    <button
                      onClick={() => handleDeleteKnowledge(item.id)}
                      className="text-stone-400 hover:text-teal-600 transition opacity-0 group-hover:opacity-100 p-1"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="font-semibold text-sm text-stone-900">{item.title}</h4>
                  <p className="text-xs text-[#596F71] leading-relaxed whitespace-pre-wrap">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: UNANSWERED QUESTIONS LOOP */}
        {activeTab === "unanswered" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-stone-900">Unanswered Question Learning Loop</h2>
                <p className="text-xs text-[#596F71]">
                  When a customer asks something not in the knowledge base, the AI falls back safely and logs it here.
                  Click &apos;Add to Knowledge Base&apos; to immediately teach the AI the right answer!
                </p>
              </div>
            </div>

            {/* Answer Modal */}
            {answeringQuestion && (
              <div className="bg-white border border-teal-400 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-teal-700 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Teach Assistant Answer
                  </span>
                  <button
                    onClick={() => setAnsweringQuestion(null)}
                    className="text-xs text-stone-500 hover:text-stone-800"
                  >
                    Close
                  </button>
                </div>

                <div className="bg-[#FFFFFF] p-3 rounded-lg border border-[#DEE7E4] text-xs text-stone-900 font-medium">
                  &ldquo;{answeringQuestion.question}&rdquo;
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Official Answer (This will be saved to Knowledge Base)
                  </label>
                  <textarea
                    rows={3}
                    value={answerContent}
                    onChange={(e) => setAnswerContent(e.target.value)}
                    placeholder="Enter the official answer. From now on, the AI will answer this question correctly!"
                    className="w-full bg-[#FFFFFF] border border-[#DEE7E4] rounded-lg p-2.5 text-xs text-stone-900"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setAnsweringQuestion(null)}
                    className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleResolveUnanswered(answeringQuestion.id, true)}
                    disabled={!answerContent.trim()}
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium shadow-sm"
                  >
                    Save & Resolve
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {unanswered.map((u) => (
                <div
                  key={u.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition ${
                    u.resolved
                      ? "bg-[#FFFFFF]/50 border-[#DEE7E4] text-stone-500 opacity-60"
                      : "bg-white border-[#DEE7E4] text-stone-900 shadow-xs"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-stone-900">{u.question}</div>
                    <div className="text-[11px] text-[#8C767C]">
                      Logged {new Date(u.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!u.resolved ? (
                      <>
                        <button
                          onClick={() => {
                            setAnsweringQuestion(u);
                            setAnswerContent("");
                          }}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Knowledge Base</span>
                        </button>
                        <button
                          onClick={() => handleResolveUnanswered(u.id, false)}
                          className="px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#DFECE6] border border-[#CDDCD7] text-stone-700 rounded-lg text-xs"
                        >
                          Dismiss
                        </button>
                      </>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-700 text-xs">
                        <CheckCircle className="w-4 h-4" />
                        <span>Resolved</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {unanswered.length === 0 && (
                <div className="py-8 text-center text-xs text-[#596F71]">
                  No unanswered questions logged yet. Keep reviewing your business knowledge.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && role === "owner" && <><BusinessSettings key={businessId} businessId={businessId} initialBusiness={currentBusiness} onSaved={fetchBusinesses}/><TeamSettings key={businessId+"team"} businessId={businessId}/></>}
        {activeTab === "bookings" && <BookingDesk key={businessId} businessId={businessId}/>}
        {activeTab === "conversations" && <Inbox key={businessId} businessId={businessId}/>}
        {activeTab === "followups" && <FollowUps key={businessId} businessId={businessId}/>}

        {/* TAB 7: COUNTER QR STANDEE GENERATOR */}
        {activeTab === "qr" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-stone-900">Physical Front-Desk QR Standee</h2>
              <p className="text-xs text-[#596F71]">
                Print this sign for your reception counter or store entrance. Visitors can scan with their phone camera to instantly chat!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Standee Preview Card */}
              <div className="bg-white text-stone-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-[#DEE7E4] text-center space-y-4 flex flex-col items-center max-w-sm mx-auto w-full">
                <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center font-bold text-white text-sm shadow">
                  VL
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-stone-900 leading-tight">{currentBusiness.name}</h3>
                  <p className="text-xs text-teal-700 font-semibold mt-1">24/7 Digital Assistant</p>
                </div>

                {/* QR Image */}
                <div className="p-3 bg-[#FFFFFF] border border-teal-200 rounded-2xl shadow-inner max-w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeApiUrl}
                    alt="Scan to Chat QR"
                    width={200}
                    height={200}
                    className="rounded-lg mx-auto"
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-stone-800">Scan to ask Fees, Timings & Demo</p>
                  <p className="text-[10px] text-[#596F71] font-mono truncate max-w-xs">{chatUrl}</p>
                </div>

                <div className="pt-2 text-[10px] text-[#8C767C] uppercase tracking-widest font-semibold">
                  Powered by VentureLab
                </div>
              </div>

              {/* Printing Instructions & Actions */}
              <div className="bg-white border border-[#DEE7E4] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
                <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-teal-600" />
                  <span>How to Use for Local Businesses</span>
                </h3>
                <ul className="text-xs text-[#596F71] space-y-2 leading-relaxed">
                  <li>• <strong>Reception Counter:</strong> Place an acrylic standee next to the front desk so waiting customers get instant answers.</li>
                  <li>• <strong>Store Entrance:</strong> Print on an A5 sheet so evening walk-ins after closing hours can still register their inquiries.</li>
                  <li>• <strong>Social Media Stories:</strong> Download the QR graphic and post it to Instagram/WhatsApp status.</li>
                </ul>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <a
                    href={qrCodeApiUrl}
                    download={`venturelab-qr-${currentBusiness.slug}.png`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download High-Res QR</span>
                  </a>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2.5 bg-[#FFFFFF] hover:bg-[#DFECE6] border border-[#CDDCD7] text-stone-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Standee</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: EMBED WIDGET */}
        {activeTab === "embed" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-stone-900">Embed Chat Widget on Any Website</h2>
              <p className="text-xs text-[#596F71]">
                Paste this one-line script tag into your client&apos;s website HTML before &lt;/body&gt;
              </p>
            </div>

            <div className="bg-white border border-[#DEE7E4] rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-mono text-teal-700">widget.js script embed</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(embedSnippet);
                    setCopiedSnippet(true);
                    setTimeout(() => setCopiedSnippet(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
                >
                  {copiedSnippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSnippet ? "Copied!" : "Copy Snippet"}</span>
                </button>
              </div>

              <pre className="bg-[#FFFFFF] p-4 rounded-xl border border-[#DEE7E4] text-xs font-mono text-emerald-800 overflow-x-auto whitespace-pre-wrap break-all">
                {embedSnippet}
              </pre>

              <div className="text-xs text-[#596F71] space-y-1">
                <p>• Automatically renders a floating chat trigger in the bottom right corner.</p>
                <p>• Mobile-responsive popup optimized for WhatsApp & website traffic.</p>
                <p>• Done-for-you onboarding takes under 5 minutes per business.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
