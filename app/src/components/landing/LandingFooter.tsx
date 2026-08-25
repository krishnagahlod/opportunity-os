import Link from "next/link";
import { Zap } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-12 text-xs">
      <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <Link href="/" className="flex items-center gap-2 font-bold text-sm text-zinc-900">
            <span className="flex size-6 items-center justify-center rounded bg-zinc-900 text-white font-mono text-xs">
              <Zap className="size-3.5 fill-current" />
            </span>
            <span>Opportunity OS</span>
          </Link>
          <p className="text-zinc-500 text-[11px]">
            Decision-intelligence platform for engineering internships, jobs & fellowships.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-zinc-600 font-medium">
          <Link href="/pricing" className="hover:text-zinc-900 transition-colors">
            Pricing
          </Link>
          <Link href="#faq" className="hover:text-zinc-900 transition-colors">
            FAQ
          </Link>
          <Link href="/privacy" className="hover:text-zinc-900 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-zinc-900 transition-colors">
            Terms of Service
          </Link>
        </div>

        <div className="text-center md:text-right text-[11px] text-zinc-500 font-mono">
          <p>© {new Date().getFullYear()} Opportunity OS.</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">Built for students who want high-fit placements.</p>
        </div>
      </div>
    </footer>
  );
}
