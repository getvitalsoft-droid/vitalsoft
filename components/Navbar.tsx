"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#services", label: "Services" },
  { href: "#pricing", label: "Pricing" },
  { href: "#calculator", label: "Calculator" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleScroll = (href: string) => {
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between transition-all duration-300 ${
          scrolled
            ? "bg-[#080808]/90 backdrop-blur-xl border-b border-white/5"
            : "bg-transparent"
        }`}
      >
        {/* Logo */}
        <div className="font-display font-black text-xl tracking-tight">
          <span className="text-accent">Vital</span>
          <span className="text-white">Soft</span>
        </div>

        {/* Desktop links */}
        <ul className="hidden md:flex gap-8 list-none">
          {links.map((l) => (
            <li key={l.href}>
              <button
                onClick={() => handleScroll(l.href)}
                className="text-white/50 hover:text-white text-sm font-body font-normal transition-colors duration-200"
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={() => handleScroll("#calculator")}
          className="hidden md:block bg-accent hover:bg-accent-2 text-[#080808] font-display font-bold text-sm px-5 py-2.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
        >
          Get Started
        </button>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-white/60 hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 left-0 right-0 z-40 bg-[#0f0f0f]/95 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex flex-col gap-4"
          >
            {links.map((l) => (
              <button
                key={l.href}
                onClick={() => handleScroll(l.href)}
                className="text-left text-white/70 hover:text-accent font-body text-base py-1 transition-colors"
              >
                {l.label}
              </button>
            ))}
            <button
              onClick={() => handleScroll("#calculator")}
              className="mt-2 bg-accent text-[#080808] font-display font-bold text-sm px-5 py-3 rounded-lg text-center"
            >
              Get Started →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
