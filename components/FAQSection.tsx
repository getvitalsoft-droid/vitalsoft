"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const faqs = [
  {
    q: "What is the turnaround time?",
    a: "Standard turnaround is 24–48 hours per batch depending on your plan. Scale and Pro clients receive priority 24h delivery. Rush turnaround (12h) is available as an add-on for urgent projects.",
  },
  {
    q: "How many revisions do I get?",
    a: "Starter includes 1 revision per clip. Growth includes 2. Scale and Pro plans include unlimited revisions until you're 100% satisfied. We want you to love every single video.",
  },
  {
    q: "What formats and file types are supported?",
    a: "We accept MP4, MOV, AVI, MKV, and most major video formats. Deliverables include 9:16 vertical (TikTok/Reels/Shorts), 1:1 square, and 16:9 landscape. All exports are 1080p minimum, with 4K available on Pro.",
  },
  {
    q: "How does content delivery work?",
    a: "After subscribing you'll get access to a shared Google Drive folder. Upload your raw footage there, and we'll deliver your finished clips back to the same folder within the agreed turnaround window.",
  },
  {
    q: "Can I upgrade or downgrade my plan?",
    a: "Absolutely. You can upgrade, downgrade, pause, or cancel your plan at any time from your billing dashboard. Changes take effect at the start of the next billing cycle.",
  },
  {
    q: "Do you work with businesses and brands, not just individual creators?",
    a: "Yes! We work with solo creators, podcasters, agencies, e-commerce brands, and corporate clients. For large-scale needs (50+ videos/month), contact us for a custom enterprise quote.",
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-4">
            FAQ
          </span>
          <h2 className="font-display font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight mb-3">
            Frequently asked questions
          </h2>
          <p className="text-white/40 text-base font-light max-w-md mx-auto">
            Everything you need to know before getting started.
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={faq.q}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={`glass rounded-xl overflow-hidden border transition-colors duration-200 ${
                open === i ? "border-[rgba(232,255,71,0.2)]" : ""
              }`}
            >
              <button
                className="w-full text-left px-6 py-5 flex items-center justify-between font-display font-semibold text-sm hover:text-accent transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                {faq.q}
                <Plus
                  size={18}
                  className={`text-white/40 flex-shrink-0 ml-4 transition-transform duration-200 ${
                    open === i ? "rotate-45 text-accent" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5">
                      <p className="text-white/45 text-sm leading-relaxed font-light">
                        {faq.a}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
