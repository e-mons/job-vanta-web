import type { Metadata } from "next";
import "./globals.css";

const inter = {
  variable: "font-inter",
};

const outfit = {
  variable: "font-outfit",
};

export const metadata: Metadata = {
  title: "JobVanta | AI-Powered Career Success Platform",
  description: "Land your dream job with JobVanta. Build ATS-optimized resumes, find verified job matches, and get AI-driven career insights.",
  keywords: ["job search", "AI resume builder", "career growth", "ATS optimization", "verified jobs"],
  openGraph: {
    title: "JobVanta | AI-Powered Career Success Platform",
    description: "Land your dream job with JobVanta. Build ATS-optimized resumes, find verified job matches, and get AI-driven career insights.",
    url: "https://www.jobvanta.ai",
    siteName: "JobVanta",
    images: [
      {
        url: "https://www.jobvanta.ai/og-image.png",
        width: 1200,
        height: 630,
        alt: "JobVanta AI Career Platform Mockup Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JobVanta | AI-Powered Career Success Platform",
    description: "Land your dream job with JobVanta. Build ATS-optimized resumes, find verified job matches, and get AI-driven career insights.",
    creator: "@jobvanta",
    images: ["https://www.jobvanta.ai/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  metadataBase: new URL("https://www.jobvanta.ai"),
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
import AppInitializer from "@/components/shared/AppInitializer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "JobVanta",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "All",
    "url": "https://www.jobvanta.ai",
    "description": "Enterprise-grade AI-powered career platform providing ATS keyword scanning, resume builder, AI career coach chat, and direct job matching.",
    "offers": {
      "@type": "Offer",
      "price": "9.99",
      "priceCurrency": "USD",
      "category": "Subscription"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "1250"
    }
  };

  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${outfit.variable} font-sans min-h-screen bg-white text-slate-900 antialiased`}>
        <AppInitializer />
        {children}
        <Toaster richColors position="top-right" closeButton />
        <FloatingChatbot />
      </body>
    </html>
  );
}
