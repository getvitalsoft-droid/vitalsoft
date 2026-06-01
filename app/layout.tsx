import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import Script from "next/script";
import CookieBanner from "@/components/CookieBanner";
import VersionChecker from "@/components/VersionChecker";
import "./globals.css";

const syne = Syne({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-syne", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-dm-sans", display: "swap" });

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.png",
  },
  title: "VitalSoft — Convierte Contenido Largo en Shorts",
  description: "Edición de vídeo profesional para creadores, podcasters y marcas. Subtítulos, formato vertical, edición de retención — optimizado para TikTok, Reels y YouTube Shorts.",
  keywords: ["edición de vídeo", "shorts", "TikTok", "YouTube Shorts", "Instagram Reels", "clips podcast", "VitalSoft"],
  openGraph: {
    title: "VitalSoft — Convierte Contenido Largo en Shorts",
    description: "Edición de vídeo profesional. Subtítulos, retención, formato vertical — entrega en 24h.",
    type: "website",
    url: "https://vitalsoft.pro",
  },
};

const GA_ID = "G-KSQTCPBCE4";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${syne.variable} ${dmSans.variable}`}>
      <head>
        {/* Preconnect y carga directa de fuentes — garantiza Syne/DM Sans aunque next/font falle en build */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" />
        {/* Google Consent Mode v2 — denegado por defecto hasta que el usuario acepte */}
        <Script id="google-consent-default" strategy="beforeInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            wait_for_update: 500
          });
        `}</Script>

        {/* Google Analytics */}
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
            anonymize_ip: true
          });
        `}</Script>
      </head>
      <body className="bg-[#080808] text-[#f0f0f0] font-body antialiased overflow-x-hidden">
        {children}
        <CookieBanner />
        <VersionChecker />
      </body>
    </html>
  );
}
