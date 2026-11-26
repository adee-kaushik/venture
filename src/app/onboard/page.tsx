"use client";

import React, { useState } from "react";
import Link from "next/link";
import VentureBrand from "../venture-brand";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  GraduationCap,
  Scissors,
  HeartPulse,
  Coffee,
  Plus,
  Trash2
} from "lucide-react";
import { TEMPLATES } from "@/lib/templates";

export default function OnboardPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form state
  const [vertical, setVertical] = useState<"coaching" | "salon" | "clinic" | "cafe">("salon");
  const [bizName, setBizName] = useState("");
  const [slug, setSlug] = useState("");
  const [city, setCity] = useState("Jaipur");
  const [timings, setTimings] = useState("9:00 AM - 8:00 PM (Mon-Sat)");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");

  // Custom knowledge cards initialized from vertical
  const [knowledgeList, setKnowledgeList] = useState<Array<{ category: string; title: string; content: string }>>(
    TEMPLATES.salon.defaultKnowledge
  );

  const [submitting, setSubmitting] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const handleSelectVertical = (v: "coaching" | "salon" | "clinic" | "cafe") => {
    setVertical(v);
    setKnowledgeList(TEMPLATES[v].defaultKnowledge);
  };

  const handleNameChange = (name: string) => {
    setBizName(name);
    // auto-generate clean slug
    const clean = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setSlug(clean);
  };

  const handleKnowledgeChange = (index: number, field: "title" | "content", val: string) => {
    const updated = [...knowledgeList];
    updated[index] = { ...updated[index], [field]: val };
    setKnowledgeList(updated);
  };

  const handleAddCustomFact = () => {
    setKnowledgeList([
      ...knowledgeList,
      { category: "policy", title: "New Custom Business Rule", content: "Write the rule, fee, or timing here..." }
    ]);
  };

  const handleRemoveFact = (index: number) => {
    setKnowledgeList(knowledgeList.filter((_, idx) => idx !== index));
  };

  const handleCompleteOnboarding = async () => {
    if (!bizName || !slug || !contact) {
      alert("Please enter business name and contact number");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: bizName,
          slug,
          templateType: vertical,
          city,
          timings,
          contact,
          address,
          initialKnowledge: knowledgeList
        })
      });

      const data = await res.json();
      if (data.success) {
        setStep(4);
      } else {
        alert(data.error || "Failed to onboard business. Slug might already exist.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error creating business");
    } finally {
      setSubmitting(false);
    }
  };

  const embedSnippet = `<script src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js" data-business-slug="${slug}"></script>`;

  return (
    <div className="min-h-screen bg-[#F7F9F8] text-[#172F32] selection:bg-teal-200 selection:text-teal-900 flex flex-col justify-between w-full overflow-x-hidden">
      {/* Top Header */}
      <header className="border-b border-[#DEE7E4] bg-[#FFFFFF]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <VentureBrand className="brand-compact" subtitle="3-Minute Done-For-You Setup" />

          {/* Stepper Dots */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-1 sm:gap-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition ${
                    step === s
                      ? "bg-teal-600 text-white shadow-md shadow-teal-600/30"
                      : step > s
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-[#DFECE6] text-stone-600"
                  }`}
                >
                  {step > s ? "✓" : s}
                </div>
                {s < 4 && <div className={`w-3 sm:w-4 h-0.5 ${step > s ? "bg-emerald-400" : "bg-[#DFECE6]"}`} />}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Form Body */}
      <main className="max-w-3xl mx-auto px-4 py-8 w-full flex-1">
        {/* STEP 1: SELECT VERTICAL */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center max-w-lg mx-auto">
              <span className="px-3 py-1 rounded-full bg-teal-100 border border-teal-200 text-teal-800 text-xs font-semibold">
                Step 1 of 3
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-2">What type of business are we setting up?</h1>
              <p className="text-xs sm:text-sm text-[#596F71] mt-1">
                Each vertical template comes pre-grounded with industry-specific qualification flows and pricing schemas.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {[
                { id: "coaching" as const, name: "Coaching Centre / Institute", icon: GraduationCap, desc: "JEE, NEET, Foundation & School Batches. Demo class flow." },
                { id: "salon" as const, name: "Salon, Spa & Beauty Lounge", icon: Scissors, desc: "Haircut, Keratin, Facials, Bridal makeup bookings." },
                { id: "clinic" as const, name: "Fitness Club & Gym", icon: HeartPulse, desc: "Membership tiers, trainers, 1-Day VIP trial passes." },
                { id: "cafe" as const, name: "Artisan Cafe & Bakery", icon: Coffee, desc: "Menu, table reservations, rooftop party bookings." }
              ].map((item) => {
                const IconComponent = item.icon;
                const isSelected = vertical === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectVertical(item.id)}
                    className={`p-5 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? "bg-teal-50/80 border-teal-500 shadow-md shadow-teal-950/5 text-stone-900"
                        : "bg-white border-[#DEE7E4] text-stone-700 hover:border-teal-300 hover:bg-teal-50/30"
                    }`}
                  >
                    <div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                        isSelected ? "bg-teal-600 text-white" : "bg-[#EDF4F1] text-stone-700"
                      }`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-sm text-stone-900">{item.name}</h3>
                      <p className="text-xs text-[#596F71] mt-1 leading-relaxed">{item.desc}</p>
                    </div>

                    <div className="pt-4 flex items-center gap-1.5 text-[11px] font-medium text-teal-700">
                      <span>{isSelected ? "Selected" : "Select Template"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2"
              >
                <span>Continue to Business Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: BUSINESS PROFILE */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center max-w-lg mx-auto">
              <span className="px-3 py-1 rounded-full bg-teal-100 border border-teal-200 text-teal-800 text-xs font-semibold">
                Step 2 of 3
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-2">Enter Business Information</h1>
              <p className="text-xs sm:text-sm text-[#596F71] mt-1">
                This identity and contact info will be communicated directly to customers.
              </p>
            </div>

            <div className="bg-white border border-[#DEE7E4] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Official Business Name <span className="text-teal-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bizName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Allen Career Institute Jaipur"
                    className="w-full bg-[#FFFFFF] border border-[#DEE7E4] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 placeholder-[#9C868C] focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Custom Web Link Slug <span className="text-teal-600">*</span>
                  </label>
                  <div className="flex items-center bg-[#FFFFFF] border border-[#DEE7E4] rounded-xl px-3 text-xs text-stone-500">
                    <span className="shrink-0 font-mono text-[11px]">/c/</span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="allen-jaipur"
                      className="w-full bg-transparent border-none py-2.5 pl-1 text-xs text-stone-900 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">City / Region</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Jaipur"
                    className="w-full bg-[#FFFFFF] border border-[#DEE7E4] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Business Timings</label>
                  <input
                    type="text"
                    value={timings}
                    onChange={(e) => setTimings(e.target.value)}
                    placeholder="9:00 AM - 8:30 PM (Mon-Sat)"
                    className="w-full bg-[#FFFFFF] border border-[#DEE7E4] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">WhatsApp / Call Contact</label>
                  <input
                    type="tel"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="+91 98290 12345"
                    className="w-full bg-[#FFFFFF] border border-[#DEE7E4] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Complete Address & Landmark</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Plot 12, Tonk Road, Lal Kothi, Near Vidhan Sabha, Jaipur"
                  className="w-full bg-[#FFFFFF] border border-[#DEE7E4] rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900"
              >
                Back
              </button>
              <button
                disabled={!bizName.trim() || !contact.trim()}
                onClick={() => setStep(3)}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 transition flex items-center gap-2"
              >
                <span>Continue to Knowledge Base</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: KNOWLEDGE BASE VERIFICATION */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center max-w-lg mx-auto">
              <span className="px-3 py-1 rounded-full bg-teal-100 border border-teal-200 text-teal-800 text-xs font-semibold">
                Step 3 of 3
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-2">Ground the AI with Real Facts</h1>
              <p className="text-xs sm:text-sm text-[#596F71] mt-1">
                The AI will strictly answer based on these items. Review, customize, or add your specific fee packages.
              </p>
            </div>

            <div className="space-y-3">
              {knowledgeList.map((item, idx) => (
                <div key={idx} className="bg-white border border-[#DEE7E4] rounded-xl p-4 space-y-2 relative shadow-sm">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleKnowledgeChange(idx, "title", e.target.value)}
                      className="font-semibold text-xs text-teal-800 bg-transparent border-b border-transparent focus:border-teal-500 focus:outline-none w-2/3"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase bg-teal-50 text-teal-700 border border-teal-200/60 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                      <button
                        onClick={() => handleRemoveFact(idx)}
                        className="text-stone-400 hover:text-teal-600 p-1 transition"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={item.content}
                    onChange={(e) => handleKnowledgeChange(idx, "content", e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#DEE7E4] rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none focus:border-teal-500 leading-relaxed"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddCustomFact}
                className="w-full py-2.5 bg-white hover:bg-teal-50/50 border border-dashed border-[#CDDCD7] rounded-xl text-xs text-teal-700 font-medium flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Fact / Policy / Price</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900"
              >
                Back
              </button>
              <button
                disabled={submitting}
                onClick={handleCompleteOnboarding}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{submitting ? "Deploying Engine..." : "Deploy & Go Live"}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS & GO-LIVE LAUNCHPAD */}
        {step === 4 && (
          <div className="space-y-6 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Your Assistant is Live!</h1>
              <p className="text-xs text-[#596F71] mt-1">
                <strong>{bizName}</strong> is grounded and ready to capture inquiries in Hinglish 24/7.
              </p>
            </div>

            {/* Launch Links Card */}
            <div className="bg-white border border-[#DEE7E4] rounded-2xl p-5 text-left space-y-4 shadow-md">
              <div>
                <span className="text-[11px] font-semibold text-stone-700 block mb-1">Direct Chat URL</span>
                <div className="flex items-center justify-between bg-[#FFFFFF] p-2.5 rounded-xl border border-[#DEE7E4] text-xs font-mono text-teal-700">
                  <span className="truncate">
                    {typeof window !== "undefined" ? window.location.origin : ""}/c/{slug}
                  </span>
                  <Link
                    href={`/c/${slug}`}
                    target="_blank"
                    className="ml-2 px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-sans flex items-center gap-1 shrink-0"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-stone-700 block mb-1">
                  1-Line Website Embed Snippet
                </span>
                <div className="relative">
                  <pre className="bg-[#FFFFFF] p-3 rounded-xl border border-[#DEE7E4] text-[11px] font-mono text-emerald-800 overflow-x-auto whitespace-pre-wrap break-all">
                    {embedSnippet}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(embedSnippet);
                      setCopiedSnippet(true);
                      setTimeout(() => setCopiedSnippet(false), 2000);
                    }}
                    className="absolute top-2 right-2 px-2 py-1 bg-white hover:bg-stone-100 border border-[#CDDCD7] text-stone-700 rounded text-[10px] flex items-center gap-1 shadow-sm"
                  >
                    {copiedSnippet ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSnippet ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2"
              >
                <span>Open Owner Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={`/c/${slug}`}
                target="_blank"
                className="w-full sm:w-auto px-6 py-3 bg-[#EDF4F1] hover:bg-[#DFECE6] border border-[#CDDCD7] text-stone-800 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Test Live Chat Now</span>
              </Link>
            </div>
          </div>
        )}
      </main>

      <footer className="py-4 border-t border-[#DEE7E4] bg-[#FFFFFF] text-center text-xs text-[#7C666B]">
        VentureLab Done-For-You Architecture • Ready for Pilot Onboarding
      </footer>
    </div>
  );
}
