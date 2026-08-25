import Link from "next/link";
import { ArrowRight, Zap, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InteractiveFeedHero } from "@/components/landing/InteractiveFeedHero";
import { LiveSourcesStrip } from "@/components/landing/LiveSourcesStrip";
import { SuperpowersShowcase } from "@/components/landing/SuperpowersShowcase";
import { CampusPartnerSection } from "@/components/landing/CampusPartnerSection";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
import { LandingFooter } from "@/components/landing/LandingFooter";

export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-foreground">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-sm text-foreground tracking-tight">
            <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background font-mono text-xs">
              <Zap className="size-4 fill-current" />
            </span>
            <span>Opportunity OS</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <Link href="#feed-preview" className="hover:text-foreground transition-colors">
              Live Feed
            </Link>
            <Link href="#features" className="hover:text-foreground transition-colors">
              Platform
            </Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">
              Passes
            </Link>
            <Link href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                Sign in
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="text-xs font-bold gap-1.5 shadow-xs">
                Get Started <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs font-medium text-foreground mb-6">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>50+ Career Networks Monitored 24/7</span>
          </div>

          {/* Clean Modern Headline */}
          <h1 className="mx-auto max-w-4xl text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.08]">
            High-fit opportunities,
            <br />
            scored and delivered first.
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            We continuously scrape 50+ startup, VC, and enterprise networks, score every listing against your resume, and surface high-match roles with direct recruiter contact details.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto h-12 px-7 text-sm font-bold gap-2 shadow-md">
                Get Your Personalized Feed <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="#pricing">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-6 text-sm font-semibold border-border/80">
                View Career Passes
              </Button>
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-500" /> Verified Job Postings Only
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="size-4 text-amber-500" /> 0–100 Resume Match Scoring
            </span>
          </div>

          {/* Interactive Live Opportunity Explorer (Hero Demo) */}
          <div id="feed-preview">
            <InteractiveFeedHero />
          </div>
        </div>
      </section>

      {/* 3. Live Sources Ticker */}
      <LiveSourcesStrip />

      {/* 4. Deep Superpowers Walkthrough */}
      <div id="features">
        <SuperpowersShowcase />
      </div>

      {/* 5. IIT Bombay & Campus Tier */}
      <CampusPartnerSection />

      {/* 6. Transparent Pricing Passes */}
      <LandingPricing />

      {/* 7. FAQ */}
      <LandingFAQ />

      {/* 8. Bottom Final Call to Action */}
      <section className="py-24 border-b border-border/70 bg-card/40 text-center">
        <div className="mx-auto max-w-3xl px-4 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Stop scrolling 10 different job boards.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Drop your resume once and get a curated, scored feed of high-match internships and engineering roles delivered every morning.
          </p>
          <div className="pt-2">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-sm font-bold gap-2 shadow-lg">
                Get Started for Free <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <LandingFooter />
    </div>
  );
}
