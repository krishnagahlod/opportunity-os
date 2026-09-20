import Link from "next/link";
import { Zap, ShieldCheck } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white text-zinc-900 font-sans">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-5 lg:gap-12">
          {/* Brand Column (2 cols wide) */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-sm text-zinc-900 tracking-tight">
              <span className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 text-white font-mono text-xs shadow-2xs">
                <Zap className="size-4 fill-current" />
              </span>
              <span className="text-base font-extrabold">Opportunity OS</span>
            </Link>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
              The high-velocity career intelligence platform. Aggregating 50+ tech networks, scoring listings against your resume, and uncovering verified hiring manager contacts.
            </p>

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1 text-[11px] font-mono font-semibold text-emerald-800 shadow-2xs">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>50+ Ingestion Networks Operational</span>
            </div>
          </div>

          {/* Col 1: Platform */}
          <div className="space-y-3 text-xs">
            <p className="font-mono font-bold uppercase tracking-wider text-zinc-900 text-[11px]">
              Platform
            </p>
            <ul className="space-y-2 text-zinc-500 font-medium">
              <li>
                <Link href="#feed-preview" className="hover:text-zinc-900 transition-colors">
                  Live Feed Preview
                </Link>
              </li>
              <li>
                <Link href="#workflow" className="hover:text-zinc-900 transition-colors">
                  0–100 Resume Scoring
                </Link>
              </li>
              <li>
                <Link href="#superpowers" className="hover:text-zinc-900 transition-colors">
                  Recruiter Contact Radar
                </Link>
              </li>
              <li>
                <Link href="#alerts" className="hover:text-zinc-900 transition-colors">
                  Closing Deadline Alerts
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Access & Pricing */}
          <div className="space-y-3 text-xs">
            <p className="font-mono font-bold uppercase tracking-wider text-zinc-900 text-[11px]">
              Passes & Campus
            </p>
            <ul className="space-y-2 text-zinc-500 font-medium">
              <li>
                <Link href="#pricing" className="hover:text-zinc-900 transition-colors">
                  Career Passes (₹299+)
                </Link>
              </li>
              <li>
                <Link href="#campus" className="text-blue-600 font-bold hover:underline">
                  @iitb.ac.in Student Access
                </Link>
              </li>
              <li>
                <Link href="#faq" className="hover:text-zinc-900 transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-zinc-900 transition-colors">
                  Candidate Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Statutory */}
          <div className="space-y-3 text-xs">
            <p className="font-mono font-bold uppercase tracking-wider text-zinc-900 text-[11px]">
              Legal & Trust
            </p>
            <ul className="space-y-2 text-zinc-500 font-medium">
              <li>
                <Link href="/terms" className="hover:text-zinc-900 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-zinc-900 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-zinc-900 transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-zinc-900 transition-colors">
                  Refund & Cancellation
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-zinc-900 transition-colors">
                  Contact & Grievances
                </Link>
              </li>
              <li className="pt-1">
                <span className="text-[11px] text-zinc-400 font-mono">UPI & Card via Dodo Payments</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sub-Footer */}
      <div className="border-t border-zinc-200/80 bg-zinc-50/70 py-5 text-xs text-zinc-500 font-mono">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-3 px-4">
          <div className="space-y-1 text-center sm:text-left">
            <p>© {new Date().getFullYear()} Opportunity OS · Developed & Operated by Krishna Gahlod, Mumbai, India.</p>
            <p className="text-[10px] text-zinc-400">
              Grievance Redressal: krishnagahlod@gmail.com · Statutory TAT: 30 days (DPDPA 2023 Sec 13)
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] shrink-0">
            <span>100% Verified Listings</span>
            <span>·</span>
            <span>Zero AI Model Training</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
