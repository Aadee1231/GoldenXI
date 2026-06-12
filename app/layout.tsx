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
  title: "GoldenXI",
  description: "Create your World Cup bracket and compete with friends.",
  icons: {
    icon: "/trophy.svg",
    shortcut: "/trophy.svg",
    apple: "/trophy.svg",
  },
  openGraph: {
    title: "GoldenXI",
    description: "Create your World Cup bracket and compete with friends.",
    url: "https://goldenxi.vercel.app",
    siteName: "GoldenXI",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "GoldenXI World Cup Bracket Challenge",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GoldenXI",
    description: "Create your World Cup bracket and compete with friends.",
    images: ["/og-image.svg"],
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
        <main className="flex-1 pt-16">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
