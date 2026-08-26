import Link from "next/link";
import { ArrowRight, Zap, ShieldCheck, GraduationCap, Bell, Workflow, Sparkles, CheckCircle2 } from "lucide-react";
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
            <span className="text-sm font-extrabold tracking-tight">Opportunity OS</span>
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
              <Button size="sm" className="text-xs font-bold gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs active:scale-[0.98]">
                Get Started <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Expansive Grand Hero Section */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 border-b border-zinc-200/80 bg-gradient-to-b from-white via-[#FBFBFC] to-zinc-50/60 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 space-y-14">
          {/* Hero Content */}
          <div className="mx-auto max-w-4xl text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-mono font-bold text-zinc-800 shadow-2xs">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>50+ Career Networks Monitored 24/7 · Realtime Scraper Engine</span>
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-[76px] font-black tracking-[-0.04em] text-zinc-900 leading-[1.04]">
              High-fit opportunities,
              <br />
              <span className="text-zinc-900">scored and delivered first.</span>
            </h1>

            <p className="text-base sm:text-xl text-zinc-600 leading-relaxed max-w-2xl mx-auto font-medium">
              We continuously scrape 50+ tech networks, score listings against your resume, and reveal direct hiring manager emails before the 500-applicant rush.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-13 px-8 text-sm font-bold gap-2.5 bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg active:scale-[0.98] transition-all">
                  Get Your Personalized Feed <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="#pricing" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-13 px-7 text-sm font-bold border-zinc-300 text-zinc-800 hover:bg-zinc-50 active:scale-[0.98]">
                  View Career Passes
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-600 font-semibold pt-3">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-600" /> 100% Verified Authentic Listings
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="size-4 text-amber-500 fill-amber-500" /> 0–100 Resume Match Scoring
              </span>
              <span className="flex items-center gap-1.5">
                <GraduationCap className="size-4 text-blue-600" /> @iitb.ac.in Auto-Verified Tier
              </span>
            </div>
          </div>

          {/* Interactive Live Opportunity Feed Demo (Workstation) */}
          <div id="feed-preview" className="pt-4">
            <InteractiveFeedHero />
          </div>
        </div>
      </section>

      {/* 3. Single Smooth Continuous Moving Marquee Ticker */}
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
      <div id="campus">
        <CampusPartnerSection />
      </div>

      {/* 9. Transparent Career Passes */}
      <LandingPricing />

      {/* 10. Interactive FAQ */}
      <LandingFAQ />

      {/* 11. Commanding SaaS Final Call to Action Box */}
      <section className="py-20 md:py-28 bg-white border-t border-zinc-200/80">
        <div className="mx-auto max-w-5xl px-4">
          <div className="relative rounded-3xl border border-zinc-900 bg-zinc-950 text-white p-10 sm:p-16 shadow-2xl overflow-hidden text-center">
            {/* Subtle radial ambient light */}
            <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-96 rounded-full bg-blue-600/20 blur-[120px]" />

            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3.5 py-1 text-xs font-mono font-semibold text-zinc-300">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>1,248 Opportunities Waiting In Today&apos;s Feed</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Ready to land your dream placement?
              </h2>

              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-medium">
                Drop your resume once and get a curated feed of high-match internships and engineering roles scored specifically for you every single morning.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-xs font-bold gap-2 bg-white text-zinc-900 hover:bg-zinc-100 shadow-md active:scale-[0.98]">
                    Get Started for Free <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link href="#pricing" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-6 text-xs font-bold border-zinc-700 text-white hover:bg-zinc-900 active:scale-[0.98]">
                    Explore Career Passes
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-zinc-400 font-mono pt-4 border-t border-zinc-800/80">
                <span>✓ No credit card required</span>
                <span>·</span>
                <span>✓ One-time passes (No recurring traps)</span>
                <span>·</span>
                <span>✓ Verified IITB Student Tier</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. Enterprise SaaS Multi-Column Footer */}
      <LandingFooter />
    </div>
  );
}
