import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { PostHogProvider, PostHogPageView } from "@/components/PostHogProvider";
import { ApplyNudge } from "@/components/ApplyNudge";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://opportunity-os.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Opportunity OS — Find Opportunities That Actually Matter",
    template: "%s | Opportunity OS",
  },
  description:
    "The high-velocity career intelligence platform. Aggregating 50+ tech networks, scoring listings against your resume, and uncovering verified hiring manager contacts.",
  keywords: [
    "internships",
    "software engineering jobs",
    "tech careers",
    "resume match score",
    "IIT Bombay placement",
    "hackathons",
    "case competitions",
    "startup jobs",
    "recruiter contacts",
  ],
  authors: [{ name: "Krishna Gahlod" }],
  creator: "Krishna Gahlod",
  publisher: "Opportunity OS",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    title: "Opportunity OS — The High-Velocity Career Intelligence Platform",
    description:
      "Aggregating 50+ tech networks, instant 0–100 candidate fit scoring, and verified recruiter contacts.",
    siteName: "Opportunity OS",
  },
  twitter: {
    card: "summary_large_image",
    title: "Opportunity OS — The High-Velocity Career Intelligence Platform",
    description:
      "Aggregating 50+ tech networks, instant 0–100 candidate fit scoring, and verified recruiter contacts.",
    creator: "@krishnagahlod",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "Opportunity OS",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "299",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "120",
      },
      "description":
        "Algorithmic career intelligence platform that aggregates tech opportunities across 50+ networks, scores listings against resumes, and reveals verified hiring contacts.",
    },
    {
      "@type": "Organization",
      "name": "Opportunity OS",
      "url": appUrl,
      "founder": {
        "@type": "Person",
        "name": "Krishna Gahlod",
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "krishnagahlod@gmail.com",
        "contactType": "customer support",
      },
    },
  ],
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <PostHogProvider>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-elevated"
          >
            Skip to content
          </a>
          {children}
          {/* Global "did you finish applying?" toast */}
          <ApplyNudge />
          {/* DPDPA & GDPR Cookie and Telemetry Consent Banner */}
          <CookieConsentBanner />
          {/* Power user keyboard shortcuts modal */}
          <KeyboardShortcutsModal />
        </PostHogProvider>
      </body>
    </html>
  );
}
