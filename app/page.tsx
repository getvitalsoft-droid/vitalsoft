import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import TestimonialsSection from "@/components/TestimonialsSection";
import ServicesSection from "@/components/ServicesSection";
import PricingSection from "@/components/PricingSection";
import CalculatorSection from "@/components/CalculatorSection";
import FAQSection from "@/components/FAQSection";
import TransformationFlow from "@/components/TransformationFlow";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

// "ref" es palabra reservada en React — usamos "refCode" internamente
export default function Home({ searchParams }: { searchParams: { ref?: string; clips?: string; pago?: string } }) {
  const refCode = searchParams.ref;
  return (
    <main>
      <Navbar />
      <HeroSection />
      <StatsBar />
      <TestimonialsSection />
      <ServicesSection />
      <TransformationFlow />
      <PricingSection refCode={refCode} />
      <CalculatorSection refCode={refCode} />
      <FAQSection />
      <FinalCTA />
      <Footer />
      {searchParams.pago === "ok" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#111] border border-green-400/30 text-green-400 px-6 py-3 rounded-xl text-sm font-semibold shadow-xl">
          ✅ ¡Pago completado! Recibirás un email de confirmación en breve.
        </div>
      )}
    </main>
  );
}
