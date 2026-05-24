"use client";
import { motion } from "framer-motion";

const services = [
  {
    icon: "🎙️",
    title: "Podcast Shorts",
    desc: "Transform your long-form podcast episodes into punchy, highly shareable short clips that capture attention instantly.",
    tags: ["Best moments extraction", "Auto-captions", "Audiogram"],
  },
  {
    icon: "📱",
    title: "TikTok / Reels Editing",
    desc: "Vertical-first editing built for maximum engagement. Trending formats, hooks, and sound design baked in.",
    tags: ["9:16 format", "Trending hooks", "B-roll"],
  },
  {
    icon: "▶️",
    title: "YouTube Shorts",
    desc: "Drive subscribers and watch time with precisely cut Shorts optimised for the YouTube algorithm and retention.",
    tags: ["Algorithm-optimised", "End screens", "Chapters"],
  },
  {
    icon: "🎬",
    title: "Long-form Podcast Editing",
    desc: "Full episode editing with intro/outro, music mixing, noise reduction, and professional grade audio mastering.",
    tags: ["Full episode", "Audio mastering", "Show notes"],
  },
  {
    icon: "✍️",
    title: "Captions & Retention Editing",
    desc: "Animated captions, strategic jump cuts, zoom effects and pacing techniques proven to increase watch time.",
    tags: ["Animated subtitles", "Jump cuts", "Pacing"],
  },
  {
    icon: "🚀",
    title: "Full Content Strategy",
    desc: "Let us plan and execute your entire short-form strategy. Monthly content calendars, format testing, and analytics review.",
    tags: ["Content calendar", "Analytics", "A/B testing"],
    highlight: true,
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-24 px-6 bg-[#0f0f0f]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block bg-[rgba(232,255,71,0.08)] border border-[rgba(232,255,71,0.15)] text-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded mb-4">
            Services
          </span>
          <h2 className="font-display font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight mb-3">
            Everything you need to go viral
          </h2>
          <p className="text-white/40 text-base font-light mb-10 max-w-md">
            From raw footage to platform-ready content — we handle it all.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-2xl p-7 border transition-all duration-300 hover:-translate-y-1 ${
                s.highlight
                  ? "bg-[rgba(232,255,71,0.04)] border-[rgba(232,255,71,0.2)] hover:border-[rgba(232,255,71,0.35)]"
                  : "glass hover:border-white/15"
              }`}
            >
              <div className="w-12 h-12 bg-[rgba(232,255,71,0.08)] rounded-xl flex items-center justify-center text-2xl mb-5">
                {s.icon}
              </div>
              <h3 className="font-display font-bold text-base mb-2">{s.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed font-light mb-4">
                {s.desc}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {s.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-white/[0.04] border border-white/[0.07] text-white/40 text-[11px] px-2.5 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
