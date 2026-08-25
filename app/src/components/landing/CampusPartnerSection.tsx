import Link from "next/link";
import { GraduationCap, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CampusPartnerSection() {
  return (
    <section className="py-20 border-b border-zinc-200/80 bg-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-8 md:p-12 shadow-sm">
          <div className="grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-mono font-semibold text-blue-700">
                <GraduationCap className="size-4" />
                <span>Academic Partner Tier</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
                IIT Bombay Student? Your Pro pass is already activated.
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed max-w-2xl">
                Sign in with your official <code className="bg-zinc-200/80 px-1.5 py-0.5 rounded text-zinc-900 font-mono font-semibold">@iitb.ac.in</code> Google Workspace email. Our system automatically verifies your campus domain and unlocks full Opportunity OS Pro access with zero payment required.
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-zinc-600 pt-2">
                <span className="flex items-center gap-1.5 text-zinc-900">
                  <ShieldCheck className="size-4 text-emerald-600" /> Instant Domain Verification
                </span>
                <span className="flex items-center gap-1.5 text-zinc-900">
                  <Zap className="size-4 text-amber-500 fill-amber-500" /> Full Pro Quotas Unlocked
                </span>
              </div>
            </div>

            <div className="md:col-span-4 flex md:justify-end">
              <Link href="/login">
                <Button size="lg" className="w-full md:w-auto font-bold text-xs h-11 px-6 gap-2 bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm">
                  Sign in with @iitb.ac.in <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
