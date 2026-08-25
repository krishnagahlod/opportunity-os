import Link from "next/link";
import { Zap } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-border/70 bg-card py-12 text-xs">
      <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1.5">
          <Link href="/" className="flex items-center gap-2 font-bold text-sm text-foreground">
            <span className="flex size-6 items-center justify-center rounded-md bg-foreground text-background font-mono text-xs">
              <Zap className="size-3.5 fill-current" />
            </span>
            <span>Opportunity OS</span>
          </Link>
          <p className="text-muted-foreground text-[11px]">
            Decision-intelligence platform for internships, jobs & fellowships.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground font-medium">
          <Link href="/pricing" className="hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="#faq" className="hover:text-foreground transition-colors">
            FAQ
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
        </div>

        <div className="text-center md:text-right text-[11px] text-muted-foreground">
          <p>© {new Date().getFullYear()} Opportunity OS.</p>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">Built for students who want high-fit placements.</p>
        </div>
      </div>
    </footer>
  );
}
