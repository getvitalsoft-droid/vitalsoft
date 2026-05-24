import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-syne", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-dm-sans", display: "swap" });

export const metadata: Metadata = {
  title: "VitalSoft — Convierte Contenido Largo en Shorts Virales",
  description: "Edición de vídeo profesional para creadores, podcasters y marcas. Subtítulos, formato vertical, edición de retención — optimizado para TikTok, Reels y YouTube Shorts.",
  keywords: ["edición de vídeo", "shorts virales", "TikTok", "YouTube Shorts", "Instagram Reels", "clips podcast", "VitalSoft"],
  openGraph: { title: "VitalSoft — Convierte Contenido Largo en Shorts Virales", description: "Edición de vídeo profesional. Subtítulos, retención, formato vertical — entrega en 24h.", type: "website", url: "https://vitalsoft.pro" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="bg-[#080808] text-[#f0f0f0] font-body antialiased overflow-x-hidden">{children}</body>
    </html>
  );
}
