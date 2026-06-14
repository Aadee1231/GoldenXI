import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Navbar from "@/src/components/layout/Navbar";
import Footer from "@/src/components/layout/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://goldenxi.vercel.app"),
  title: {
    default:
      "GoldenXI — World Cup 2026 Bracket Generator, Predictions & Leaderboard",
    template: "%s | GoldenXI",
  },
  description:
    "Create your World Cup 2026 bracket, predict every knockout round, compete with friends in private groups, climb the leaderboard, and play AI soccer games like Goalie Camera.",
  keywords: [
    "World Cup 2026 bracket",
    "World Cup bracket generator",
    "World Cup 2026 predictions",
    "soccer bracket",
    "FIFA 2026",
    "goalie game",
    "AI soccer game",
    "tournament predictions",
    "World Cup leaderboard",
    "GoldenXI",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: "/trophy.svg",
    shortcut: "/trophy.svg",
    apple: "/trophy.svg",
  },
  openGraph: {
    title:
      "GoldenXI — World Cup 2026 Bracket Generator, Predictions & Leaderboard",
    description:
      "Create your World Cup 2026 bracket, predict every knockout round, compete with friends in private groups, climb the leaderboard, and play AI soccer games like Goalie Camera.",
    url: "https://goldenxi.vercel.app",
    siteName: "GoldenXI",
    images: [
      {
        url: "https://goldenxi.vercel.app/og-image.png?v=6",
        width: 1200,
        height: 630,
        alt: "GoldenXI — World Cup 2026 Bracket Generator",
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GoldenXI — World Cup 2026 Bracket Generator & Predictions",
    description:
      "Create your World Cup 2026 bracket, predict every knockout round, compete with friends in private groups, and play AI soccer games.",
    images: ["https://goldenxi.vercel.app/og-image.png?v=6"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#080808] text-white">
        <Navbar />
        <main className="flex-1 pt-14 sm:pt-16 pb-safe">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
