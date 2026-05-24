import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VitalSoft — Turn Long Content Into Viral Shorts",
  description:
    "Professional short-form video editing for creators, podcasters & brands. Subtitles, vertical formatting, retention hooks — optimised for TikTok, Reels & YouTube Shorts.",
  keywords: [
    "video editing",
    "short form content",
    "TikTok editing",
    "YouTube Shorts",
    "Instagram Reels",
    "podcast clips",
    "content creator",
    "VitalSoft",
  ],
  openGraph: {
    title: "VitalSoft — Turn Long Content Into Viral Shorts",
    description:
      "Professional short-form video editing. Captions, retention editing, vertical format — 24h turnaround.",
    type: "website",
    url: "https://vitalsoft.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "VitalSoft — Turn Long Content Into Viral Shorts",
    description: "Professional short-form video editing for creators & brands.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="bg-[#080808] text-[#f0f0f0] font-body antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
