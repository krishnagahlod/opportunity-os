import Link from "next/link";
import { GraduationCap, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CampusPartnerSection() {
  return (
    <section className="py-20 border-b border-border/70 bg-card/30">
      <div className="mx-auto max-w-6xl px-4">
        <div className="rounded-3xl border border-border/80 bg-gradient-to-b from-card to-background p-8 md:p-12 shadow-xl">
          <div className="grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <GraduationCap className="size-4" />
                <span>Academic Partner Program</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                IIT Bombay Student? Your Pro pass is already activated.
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Sign in with your official <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">@iitb.ac.in</code> Google Workspace account. Our system automatically verifies your campus domain and unlocks full Opportunity OS Pro access with zero payment required.
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground pt-2">
                <span className="flex items-center gap-1.5 text-foreground">
                  <ShieldCheck className="size-4 text-emerald-500" /> Instant Domain Verification
                </span>
                <span className="flex items-center gap-1.5 text-foreground">
                  <Zap className="size-4 text-amber-500" /> Full Pro Quotas Unlocked
                </span>
              </div>
            </div>

            <div className="md:col-span-4 flex md:justify-end">
              <Link href="/login">
                <Button size="lg" className="w-full md:w-auto font-bold text-sm h-12 px-6 gap-2 shadow-sm">
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
