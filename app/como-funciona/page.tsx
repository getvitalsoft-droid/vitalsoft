import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ComoFuncionaContent from "./ComoFuncionaContent";

export const metadata: Metadata = {
  title: "Cómo funciona — VitalSoft",
  description: "Todo lo que ocurre desde que contratas hasta que recibes tus clips. Onboarding, flujo mensual, revisiones y entregas.",
};

export default function ComoFuncionaPage() {
  return (
    <main>
      <Navbar />
      <ComoFuncionaContent />
      <Footer />
    </main>
  );
}
