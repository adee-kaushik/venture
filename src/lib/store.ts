import { TEMPLATES } from "./templates";

export interface BusinessData {
  id: string;
  slug: string;
  name: string;
  templateType: "coaching" | "salon" | "clinic" | "cafe";
  city: string;
  timings: string;
  address: string;
  contact: string;
  config?: Record<string, unknown>;
  createdAt: string;
}

export interface KnowledgeItemData {
  id: string;
  businessId: string;
  category: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface MessageData {
  id: string;
  conversationId: string;
  role: "customer" | "ai" | "owner";
  text: string;
  inputTokens: number;
  outputTokens: number;
  createdAt: string;
}

export interface ConversationData {
  id: string;
  businessId: string;
  channel: "web" | "whatsapp";
  customerRef?: string;
  status: "active" | "closed" | "human";
  startedAt: string;
  updatedAt: string;
}

export interface LeadData {
  id: string;
  businessId: string;
  conversationId?: string;
  name: string;
  phone: string;
  details: Record<string, string>;
  status: "new" | "contacted" | "converted" | "lost";
  createdAt: string;
  updatedAt: string;
}

export interface BookingRequestData {
  id: string;
  businessId: string;
  leadId?: string;
  requestedTime: string;
  details: Record<string, string>;
  status: "pending" | "confirmed" | "declined";
  createdAt: string;
  updatedAt: string;
}

export interface UnansweredQuestionData {
  id: string;
  businessId: string;
  conversationId?: string;
  question: string;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

// In-memory data store for immediate demo and reliable offline execution
export class VentureStore {
  private businesses: Map<string, BusinessData> = new Map();
  private knowledge: Map<string, KnowledgeItemData[]> = new Map(); // businessId -> items
  private conversations: Map<string, ConversationData> = new Map();
  private messages: Map<string, MessageData[]> = new Map(); // conversationId -> messages
  private leads: Map<string, LeadData[]> = new Map(); // businessId -> leads
  private bookings: Map<string, BookingRequestData[]> = new Map(); // businessId -> bookings
  private unanswered: Map<string, UnansweredQuestionData[]> = new Map(); // businessId -> unanswered

  constructor() { this.seedDefaults(); }

  public dirty = false;
  public extra: Record<string, unknown> = {};
  exportState() {
    return { businesses: this.getAllBusinesses(), knowledge: Object.fromEntries(this.knowledge), conversations: [...this.conversations.values()], messages: Object.fromEntries(this.messages), leads: Object.fromEntries(this.leads), bookings: Object.fromEntries(this.bookings), unanswered: Object.fromEntries(this.unanswered), extra: this.extra };
  }
  importState(data: ReturnType<VentureStore["exportState"]>) {
    this.businesses.clear();
    for (const b of data.businesses || []) { this.businesses.set(b.id, b); this.businesses.set(b.slug, b); }
    this.knowledge = new Map(Object.entries(data.knowledge || {}));
    this.conversations = new Map((data.conversations || []).map(c => [c.id, c]));
    this.messages = new Map(Object.entries(data.messages || {}));
    this.leads = new Map(Object.entries(data.leads || {}));
    this.bookings = new Map(Object.entries(data.bookings || {}));
    this.unanswered = new Map(Object.entries(data.unanswered || {}));
    this.extra = data.extra || {};
  }
  private saveToDisk() { this.dirty = true; }
  setConversationStatus(businessId: string, id: string, status: "active" | "closed" | "human") {
    const c = this.conversations.get(id);
    if (!c || c.businessId !== businessId) return null;
    c.status = status; c.updatedAt = new Date().toISOString(); this.dirty = true; return c;
  }
  private seedDefaults() {
    // 1. Coaching Centre
    const coachingBiz: BusinessData = {
      id: "biz-coaching-1",
      slug: "apex-institute",
      name: "Apex IIT-JEE & Medical Academy",
      templateType: "coaching",
      city: "Jaipur",
      timings: "8:00 AM - 8:30 PM (Mon-Sat)",
      address: "Illustrative demo business, not a real location",
      contact: "Demo only — no phone number",
      createdAt: new Date().toISOString()
    };
    this.businesses.set(coachingBiz.id, coachingBiz);
    this.businesses.set(coachingBiz.slug, coachingBiz);

    const coachingKB = TEMPLATES.coaching.defaultKnowledge.map((item, idx) => ({
      id: `kb-coach-${idx + 1}`,
      businessId: coachingBiz.id,
      category: item.category,
      title: item.title,
      content: item.content,
      updatedAt: new Date().toISOString()
    }));
    this.knowledge.set(coachingBiz.id, coachingKB);

    // Initial demo leads for coaching
    // 2. Salon
    const salonBiz: BusinessData = {
      id: "biz-salon-1",
      slug: "luxe-salon",
      name: "Luxe Studio & Bridal Lounge",
      templateType: "salon",
      city: "Jaipur",
      timings: "10:00 AM - 8:30 PM (Tue-Sun)",
      address: "Illustrative demo business, not a real location",
      contact: "Demo only — no phone number",
      createdAt: new Date().toISOString()
    };
    this.businesses.set(salonBiz.id, salonBiz);
    this.businesses.set(salonBiz.slug, salonBiz);

    const salonKB = TEMPLATES.salon.defaultKnowledge.map((item, idx) => ({
      id: `kb-salon-${idx + 1}`,
      businessId: salonBiz.id,
      category: item.category,
      title: item.title,
      content: item.content,
      updatedAt: new Date().toISOString()
    }));
    this.knowledge.set(salonBiz.id, salonKB);

    // 3. Clinic
    const gymBiz: BusinessData = {
      id: "biz-clinic-1",
      slug: "care-clinic",
      name: "Care Family Clinic",
      templateType: "clinic",
      city: "Jaipur",
      timings: "6:00 AM - 10:30 PM",
      address: "Illustrative demo business, not a real location",
      contact: "Demo only — no phone number",
      createdAt: new Date().toISOString()
    };
    this.businesses.set(gymBiz.id, gymBiz);
    this.businesses.set(gymBiz.slug, gymBiz);

    const gymKB = TEMPLATES.clinic.defaultKnowledge.map((item, idx) => ({
      id: `kb-gym-${idx + 1}`,
      businessId: gymBiz.id,
      category: item.category,
      title: item.title,
      content: item.content,
      updatedAt: new Date().toISOString()
    }));
    this.knowledge.set(gymBiz.id, gymKB);

    // 4. Cafe
    const cafeBiz: BusinessData = {
      id: "biz-cafe-1",
      slug: "roastery-cafe",
      name: "The Roastery Cafe & Bakehouse",
      templateType: "cafe",
      city: "Jaipur",
      timings: "8:30 AM - 11:00 PM",
      address: "Illustrative demo business, not a real location",
      contact: "Demo only — no phone number",
      createdAt: new Date().toISOString()
    };
    this.businesses.set(cafeBiz.id, cafeBiz);
    this.businesses.set(cafeBiz.slug, cafeBiz);

    const cafeKB = TEMPLATES.cafe.defaultKnowledge.map((item, idx) => ({
      id: `kb-cafe-${idx + 1}`,
      businessId: cafeBiz.id,
      category: item.category,
      title: item.title,
      content: item.content,
      updatedAt: new Date().toISOString()
    }));
    this.knowledge.set(cafeBiz.id, cafeKB);
  }

  // Business queries
  getBusiness(slugOrId: string): BusinessData | undefined {
    return this.businesses.get(slugOrId);
  }

  getAllBusinesses(): BusinessData[] {
    const set = new Set<BusinessData>();
    for (const b of this.businesses.values()) {
      set.add(b);
    }
    return Array.from(set).sort((a,b) => Number(b.templateType === "salon") - Number(a.templateType === "salon"));
  }

  createBusiness(data: Omit<BusinessData, "id" | "createdAt">): BusinessData {
    const id = `biz-${crypto.randomUUID()}`;
    const newBiz: BusinessData = {
      ...data,
      id,
      createdAt: new Date().toISOString()
    };
    this.businesses.set(newBiz.id, newBiz);
    this.businesses.set(newBiz.slug, newBiz);

    // Initialize default template knowledge
    const template = TEMPLATES[data.templateType] || TEMPLATES.salon;
    const kb = ([] as typeof template.defaultKnowledge).map((item, idx) => ({
      id: `kb-${id}-${idx + 1}`,
      businessId: id,
      category: item.category,
      title: item.title,
      content: item.content,
      updatedAt: new Date().toISOString()
    }));
    this.knowledge.set(id, kb);
    this.saveToDisk();

    return newBiz;
  }

  // Knowledge base
  getKnowledge(businessId: string): KnowledgeItemData[] {
    return this.knowledge.get(businessId) || [];
  }

  addKnowledgeItem(businessId: string, item: { category: string; title: string; content: string }): KnowledgeItemData {
    const items = this.getKnowledge(businessId);
    const newItem: KnowledgeItemData = {
      id: `kb-${crypto.randomUUID()}`,
      businessId,
      category: item.category,
      title: item.title,
      content: item.content,
      updatedAt: new Date().toISOString()
    };
    items.unshift(newItem);
    this.knowledge.set(businessId, items);
    this.saveToDisk();
    return newItem;
  }

  updateKnowledgeItem(businessId: string, id: string, updates: Partial<KnowledgeItemData>): KnowledgeItemData | null {
    const items = this.getKnowledge(businessId);
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return null;

    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.knowledge.set(businessId, items);
    this.saveToDisk();
    return items[index];
  }

  deleteKnowledgeItem(businessId: string, id: string): boolean {
    const items = this.getKnowledge(businessId);
    const filtered = items.filter((i) => i.id !== id);
    this.knowledge.set(businessId, filtered);
    this.saveToDisk();
    return filtered.length !== items.length;
  }

  // Conversations & Messages
  getOrCreateConversation(businessId: string, conversationId?: string, channel: "web" | "whatsapp" = "web"): ConversationData {
    if (conversationId && this.conversations.has(conversationId)) {
      const existing = this.conversations.get(conversationId)!;
      if (existing.businessId === businessId && existing.channel === channel) return existing;
      // Never allow a supplied conversation id to cross businesses or channels.
      conversationId = undefined;
    }
    const id = conversationId || `conv-${crypto.randomUUID()}`;
    const conv: ConversationData = {
      id,
      businessId,
      channel,
      status: "active",
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.conversations.set(id, conv);
    this.dirty = true;
    return conv;
  }

  getConversations(businessId: string): ConversationData[] {
    const list: ConversationData[] = [];
    for (const conv of this.conversations.values()) {
      if (conv.businessId === businessId) {
        list.push(conv);
      }
    }
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getMessages(conversationId: string): MessageData[] {
    return this.messages.get(conversationId) || [];
  }

  addMessage(conversationId: string, message: Omit<MessageData, "id" | "conversationId" | "createdAt">): MessageData {
    const msgs = this.getMessages(conversationId);
    const newMsg: MessageData = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      conversationId,
      createdAt: new Date().toISOString()
    };
    msgs.push(newMsg);
    this.messages.set(conversationId, msgs);

    const conv = this.conversations.get(conversationId);
    if (conv) {
      conv.updatedAt = new Date().toISOString();
    }
    this.saveToDisk();
    return newMsg;
  }

  // Leads
  getLeads(businessId: string): LeadData[] {
    return (this.leads.get(businessId) || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  saveLead(businessId: string, lead: { name: string; phone: string; details: Record<string, string>; conversationId?: string }): LeadData {
    const leads = this.getLeads(businessId);
    // Check if lead with same phone already exists
    const existing = leads.find((l) => l.phone.replace(/\D/g, "") === lead.phone.replace(/\D/g, ""));
    if (existing) {
      existing.details = { ...existing.details, ...lead.details };
      existing.updatedAt = new Date().toISOString();
      this.saveToDisk();
      return existing;
    }

    const newLead: LeadData = {
      id: `lead-${crypto.randomUUID()}`,
      businessId,
      conversationId: lead.conversationId,
      name: lead.name,
      phone: lead.phone,
      details: lead.details,
      status: "new",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    leads.unshift(newLead);
    this.leads.set(businessId, leads);
    this.saveToDisk();
    return newLead;
  }

  updateLeadStatus(businessId: string, leadId: string, status: LeadData["status"]): LeadData | null {
    const leads = this.getLeads(businessId);
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return null;
    lead.status = status;
    lead.updatedAt = new Date().toISOString();
    this.saveToDisk();
    return lead;
  }

  // Bookings
  getBookings(businessId: string): BookingRequestData[] {
    return (this.bookings.get(businessId) || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  saveBooking(businessId: string, booking: { requestedTime: string; details: Record<string, string>; leadId?: string }): BookingRequestData {
    const list = this.getBookings(businessId);
    // Network retries and multi-turn assistants must not duplicate the same
    // customer's pending or confirmed request for the same exact slot.
    const duplicate = list.find(b => b.leadId && b.leadId === booking.leadId &&
      b.requestedTime === booking.requestedTime && b.status !== "declined");
    if (duplicate) return duplicate;
    const newBooking: BookingRequestData = {
      id: `book-${crypto.randomUUID()}`,
      businessId,
      leadId: booking.leadId,
      requestedTime: booking.requestedTime,
      details: booking.details,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.unshift(newBooking);
    this.bookings.set(businessId, list);
    this.saveToDisk();
    return newBooking;
  }

  updateBookingStatus(businessId: string, bookingId: string, status: BookingRequestData["status"]): BookingRequestData | null {
    const list = this.getBookings(businessId);
    const item = list.find((b) => b.id === bookingId);
    if (!item) return null;
    item.status = status;
    item.updatedAt = new Date().toISOString();
    this.saveToDisk();
    return item;
  }

  // Unanswered Questions
  getUnanswered(businessId: string): UnansweredQuestionData[] {
    return (this.unanswered.get(businessId) || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  logUnanswered(businessId: string, question: string, conversationId?: string): UnansweredQuestionData {
    const list = this.getUnanswered(businessId);
    // Don't duplicate exact question if unresolved
    const existing = list.find((q) => !q.resolved && q.question.toLowerCase().trim() === question.toLowerCase().trim());
    if (existing) return existing;

    const item: UnansweredQuestionData = {
      id: `unans-${crypto.randomUUID()}`,
      businessId,
      conversationId,
      question,
      resolved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.unshift(item);
    this.unanswered.set(businessId, list);
    this.saveToDisk();
    return item;
  }

  resolveUnanswered(businessId: string, id: string): boolean {
    const list = this.getUnanswered(businessId);
    const item = list.find((q) => q.id === id);
    if (!item) return false;
    item.resolved = true;
    item.updatedAt = new Date().toISOString();
    this.saveToDisk();
    return true;
  }

  // Aggregated Stats
  getStats(businessId: string) {
    const leads = this.getLeads(businessId);
    const bookings = this.getBookings(businessId);
    const unanswered = this.getUnanswered(businessId);
    const conversations = this.getConversations(businessId);

    // Compute token usage across all messages for this business
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalMessages = 0;

    for (const conv of conversations) {
      const msgs = this.getMessages(conv.id);
      totalMessages += msgs.length;
      for (const m of msgs) {
        totalInputTokens += m.inputTokens || 0;
        totalOutputTokens += m.outputTokens || 0;
      }
    }

    // Anthropic Claude 3.5 Haiku estimated rates:
    // $0.80 per 1M input tokens (~₹0.000067/tok)
    // $4.00 per 1M output tokens (~₹0.000336/tok)
    const costUSD = (totalInputTokens * 0.8 + totalOutputTokens * 4.0) / 1000000;
    const costINR = costUSD * 84;

    const convertedLeads = leads.filter((l) => l.status === "converted").length;
    const conversionRate = leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0;

    return {
      totalLeads: leads.length,
      newLeads: leads.filter((l) => l.status === "new").length,
      conversionRate,
      totalBookings: bookings.length,
      pendingBookings: bookings.filter((b) => b.status === "pending").length,
      totalConversations: conversations.length,
      totalMessages,
      unansweredCount: unanswered.filter((u) => !u.resolved).length,
      tokenUsage: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
        costUSD: Number(costUSD.toFixed(4)),
        costINR: Number(costINR.toFixed(2))
      }
    };
  }
}

// Each request receives its own snapshot; writes commit atomically in PostgreSQL.
import { AsyncLocalStorage } from "node:async_hooks";
export const storeContext = new AsyncLocalStorage<VentureStore>();
const demoStore = new VentureStore();
export const store = new Proxy(demoStore, {
  get(_target, prop) {
    const target = storeContext.getStore() || demoStore;
    const value = Reflect.get(target, prop);
    return typeof value === "function" ? value.bind(target) : value;
  },
  set(_target, prop, value) { return Reflect.set(storeContext.getStore() || demoStore, prop, value); }
});
