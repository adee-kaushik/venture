"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import VentureBrand from "../venture-brand";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to sign in");
      router.replace("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F7F9F8] px-4">
      <form onSubmit={signIn} className="w-full max-w-sm rounded-2xl border border-teal-200 bg-white p-7 shadow-xl space-y-5">
        <div>
          <VentureBrand className="brand-compact mb-5" />
          <h1 className="text-2xl font-bold text-stone-900">Owner Login</h1>
          <p className="mt-2 text-sm text-stone-600">Sign in to manage businesses, enquiries and bookings.</p>
        </div>
        <label className="block text-sm font-medium" htmlFor="email">Email</label><input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" className="w-full rounded-xl border border-stone-300 px-4 py-3" placeholder="Your account email"/><label className="block text-sm font-medium text-stone-700" htmlFor="password">Owner password</label>
        <input id="password" name="password" type="password" autoComplete="current-password"
          required value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500" />
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={loading} type="submit"
          className="w-full rounded-xl bg-teal-600 px-4 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <p className="text-xs text-stone-500">New business? <a href="/signup" className="text-teal-700 underline">Create your workspace</a></p>
      </form>
    </main>
  );
}
