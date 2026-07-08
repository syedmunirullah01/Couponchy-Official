"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setEmail("");
        setMessage("Thank you! You are now subscribed.");
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to subscribe. Please try again.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubscribe} className="flex flex-col gap-4">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === "loading" || status === "success"}
        placeholder="Your Email Address"
        className="h-12 w-full rounded-xl border border-white/10 bg-[#050507] px-5 text-sm font-medium text-white outline-none transition-all placeholder:text-white/20 focus:border-[var(--color-primary)]/30 focus:bg-[#07070a] disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="group/btn relative overflow-hidden flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[var(--color-primary)] text-black font-bold transition-all hover:scale-[1.01] hover:bg-[var(--color-primary-hover)] active:scale-[0.98] cursor-pointer disabled:opacity-50"
      >
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-1000 group-hover/btn:translate-x-full" />
        <span className="relative z-10 text-[14px] font-extrabold">
          {status === "loading" ? "Subscribing..." : "Subscribe Now"}
        </span>
        <span className="relative z-10 text-[16px] transition-transform duration-300 group-hover/btn:translate-x-1">→</span>
      </button>

      {message && (
        <p className={`text-xs text-center font-bold mt-1 animate-fadeIn ${status === "success" ? "text-emerald-400" : "text-rose-400"}`}>
          {message}
        </p>
      )}

      <p className="text-[10px] text-center text-white/20 font-bold uppercase tracking-[0.05em] mt-1">
        No Spam. Unsubscribe Anytime.
      </p>
    </form>
  );
}
