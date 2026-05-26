import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobVanta | AI-Powered Career Success Platform",
  description: "Land your dream job with JobVanta. Build ATS-optimized resumes, find verified job matches, and get AI-driven career insights.",
  keywords: ["job search", "AI resume builder", "career growth", "ATS optimization", "verified jobs"],
};

export const viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { Toaster } from "sonner";
import FloatingChatbot from "@/components/shared/FloatingChatbot";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${outfit.variable} font-sans min-h-screen bg-white text-slate-900 antialiased`}>
        {children}
        <Toaster richColors position="top-right" closeButton />
        <FloatingChatbot />
      </body>
    </html>
  );
}
