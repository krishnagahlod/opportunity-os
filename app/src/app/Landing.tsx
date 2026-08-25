import Link from "next/link";
import { ArrowRight, Zap, ShieldCheck, CheckCircle2, GraduationCap, Bell, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InteractiveFeedHero } from "@/components/landing/InteractiveFeedHero";
import { LiveSourcesStrip } from "@/components/landing/LiveSourcesStrip";
import { PipelineWorkflowSection } from "@/components/landing/PipelineWorkflowSection";
import { SuperpowersShowcase } from "@/components/landing/SuperpowersShowcase";
import { AlertsAndDigestShowcase } from "@/components/landing/AlertsAndDigestShowcase";
import { FeatureComparisonSection } from "@/components/landing/FeatureComparisonSection";
import { CampusPartnerSection } from "@/components/landing/CampusPartnerSection";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
import { LandingFooter } from "@/components/landing/LandingFooter";

export function Landing() {
  return (
    <div className="min-h-screen bg-[#FBFBFC] text-zinc-900 selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* 1. Navbar */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-sm text-zinc-900 tracking-tight">
            <span className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 text-white font-mono text-xs shadow-2xs">
              <Zap className="size-4 fill-current" />
            </span>
            <span>Opportunity OS</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-zinc-600">
            <Link href="#feed-preview" className="hover:text-zinc-900 transition-colors">
              Live Feed
            </Link>
            <Link href="#workflow" className="hover:text-zinc-900 transition-colors">
              Workflow
            </Link>
            <Link href="#superpowers" className="hover:text-zinc-900 transition-colors">
              Decision Radar
            </Link>
            <Link href="#alerts" className="hover:text-zinc-900 transition-colors">
              Closing Alerts
            </Link>
            <Link href="#comparison" className="hover:text-zinc-900 transition-colors">
              Comparison
            </Link>
            <Link href="#pricing" className="hover:text-zinc-900 transition-colors">
              Passes
            </Link>
            <Link href="#faq" className="hover:text-zinc-900 transition-colors">
              FAQ
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-zinc-700 hover:text-zinc-900">
                Sign in
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="text-xs font-bold gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs">
                Get Started <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-16 md:pb-24 border-b border-zinc-200/80 bg-gradient-to-b from-white via-[#FBFBFC] to-zinc-50/50">
        <div className="mx-auto max-w-6xl px-4 space-y-12">
          {/* Hero Header */}
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1 text-xs font-mono font-semibold text-zinc-800 shadow-2xs">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>50+ Career Networks Monitored 24/7</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 leading-[1.08]">
              High-fit opportunities,
              <br />
              scored and delivered first.
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 leading-relaxed max-w-2xl mx-auto">
              We continuously scrape 50+ tech networks, score listings against your resume, and reveal direct hiring manager contact info before the 500-applicant rush.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto h-12 px-7 text-xs font-bold gap-2 bg-zinc-900 hover:bg-zinc-800 text-white shadow-md">
                  Get Your Personalized Feed <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="#pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-6 text-xs font-bold border-zinc-300 text-zinc-800 hover:bg-zinc-50">
                  View Career Passes
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500 font-medium pt-2">
              <span className="flex items-center gap-1.5 text-zinc-800">
                <ShieldCheck className="size-4 text-emerald-600" /> Verified Listings Only
              </span>
              <span className="flex items-center gap-1.5 text-zinc-800">
                <Zap className="size-4 text-amber-500 fill-amber-500" /> 0–100 Resume Match Scoring
              </span>
              <span className="flex items-center gap-1.5 text-zinc-800">
                <GraduationCap className="size-4 text-blue-600" /> @iitb.ac.in Auto-Verified
              </span>
            </div>
          </div>

          {/* Interactive Live Opportunity Feed Demo */}
          <div id="feed-preview">
            <InteractiveFeedHero />
          </div>
        </div>
      </section>

      {/* 3. Infinite Horizontal Moving Marquee Ticker */}
      <LiveSourcesStrip />

      {/* 4. Interactive 4-Step Pipeline Workflow */}
      <div id="workflow">
        <PipelineWorkflowSection />
      </div>

      {/* 5. Decision Intelligence & Recruiter Radar Superpowers */}
      <div id="superpowers">
        <SuperpowersShowcase />
      </div>

      {/* 6. Closing Alerts & Morning Digest */}
      <div id="alerts">
        <AlertsAndDigestShowcase />
      </div>

      {/* 7. Feature Comparison Matrix */}
      <div id="comparison">
        <FeatureComparisonSection />
      </div>

      {/* 8. IIT Bombay Campus Partner Tier */}
      <CampusPartnerSection />

      {/* 9. Transparent Career Passes */}
      <LandingPricing />

      {/* 10. Interactive FAQ */}
      <LandingFAQ />

      {/* 11. Final Call to Action */}
      <section className="py-24 border-b border-zinc-200/80 bg-white text-center">
        <div className="mx-auto max-w-3xl px-4 space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-700">
            <Zap className="size-3.5 text-blue-600 fill-blue-600" />
            <span>Placement Sprint Engine</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 leading-tight">
            Stop scrolling 10 different job boards.
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-xl mx-auto">
            Drop your resume once and get a curated, scored feed of high-match internships and engineering roles delivered every morning.
          </p>
          <div className="pt-2">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-xs font-bold gap-2 bg-zinc-900 hover:bg-zinc-800 text-white shadow-md">
                Get Started for Free <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 12. Footer */}
      <LandingFooter />
    </div>
  );
}
