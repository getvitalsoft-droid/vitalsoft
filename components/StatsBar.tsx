"use client";
import { motion } from "framer-motion";

const stats = [
  { num: "1,200+", label: "Clips Edited & Delivered" },
  { num: "48M+", label: "Views Generated for Clients" },
  { num: "300+", label: "Happy Creators & Brands" },
  { num: "24h", label: "Average Turnaround Time" },
];

export default function StatsBar() {
  return (
    <div className="bg-[#0f0f0f] border-y border-white/5 py-12 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <div className="font-display text-4xl font-extrabold text-accent leading-none mb-1">
              {s.num}
            </div>
            <div className="text-white/40 text-sm">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
