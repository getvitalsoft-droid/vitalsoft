"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import { calcPrice, fullPrice, savings, buildStripeUrl } from "@/lib/stripe";

export default function CalculatorSection() {
  const [videos, setVideos] = useState(10);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [social, setSocial] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const price = calcPrice(videos);
  const saved = savings(videos);
  const perVid = (price / videos).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setLoading(true);
    try {
      // Submit lead to backend
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, social, source, notes, videos, price }),
      });
      setSubmitted(true);

      // Redirect to Stripe after short delay
      setTimeout(() => {
        const url = buildStripeUrl("custom", { email, videos });
        window.open(url, "_blank");
      }, 800);
    } catch {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-sm font-body outline-none transition-all duration-200 placeholder:text-white/20 focus:border-[rgba(232,255,71,0.4)] focus:bg-white/[0.06]";

  return (
    <section id="calculator" className="py-24 px-6 bg-[#0f0f0f]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-4">
            Custom Plan
          </span>
          <h2 className="font-display font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight mb-3">
            Build your perfect plan
          </h2>
          <p className="text-white/40 text-base font-light mb-10 max-w-md">
            Slide to select how many videos you need. Price updates live with
            automatic volume discounts.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-8 md:p-10 max-w-2xl mx-auto"
        >
          {/* Slider */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="font-display font-bold text-base">
                Videos per month
              </span>
              <span className="font-display font-extrabold text-4xl text-accent">
                {videos}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={videos}
              onChange={(e) => setVideos(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-white/20 text-xs">
              <span>1 video</span>
              <span>100 videos</span>
            </div>
          </div>

          {/* Price display */}
          <div className="bg-[rgba(232,255,71,0.04)] border border-[rgba(232,255,71,0.12)] rounded-xl p-6 text-center mb-8">
            <div className="font-display font-extrabold text-5xl text-accent leading-none mb-2">
              €{price.toLocaleString()}
            </div>
            <div className="text-white/35 text-sm">€{perVid} per video · billed monthly</div>
            {saved > 0 && (
              <div className="inline-block mt-3 bg-green-400/10 border border-green-400/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full">
                You save €{saved} vs standard rate
              </div>
            )}
          </div>

          {/* Contact form */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-white/35 font-medium mb-1.5">
                  Full name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-white/35 font-medium mb-1.5">
                  Email address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-white/35 font-medium mb-1.5">
                  Instagram / TikTok / YouTube
                </label>
                <input
                  type="text"
                  placeholder="@yourhandle or channel URL"
                  value={social}
                  onChange={(e) => setSocial(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-white/35 font-medium mb-1.5">
                  How did you find us?
                </label>
                <input
                  type="text"
                  placeholder="TikTok, Google, friend..."
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-xs text-white/35 font-medium mb-1.5">
                Additional notes
              </label>
              <textarea
                rows={3}
                placeholder="Tell us about your content, style preferences, deadlines..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass + " resize-none"}
              />
            </div>

            <button
              type="submit"
              disabled={loading || submitted}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-2 text-[#080808] font-display font-black text-base py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_40px_rgba(232,255,71,0.35)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitted ? (
                "Redirecting to checkout…"
              ) : loading ? (
                "Processing…"
              ) : (
                <>
                  Continue to Checkout
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 mt-4 text-white/25 text-xs">
              <Lock size={11} />
              Secure checkout via Stripe · Cancel anytime · Discounts
              auto-applied for 20+ videos
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
