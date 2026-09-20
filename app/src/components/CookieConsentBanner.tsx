"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, Check, X } from "lucide-react";
import posthog from "posthog-js";

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem("opportunity_cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    } else if (consent === "denied") {
      try {
        posthog?.opt_out_capturing();
      } catch {}
    } else if (consent === "granted") {
      try {
        posthog?.opt_in_capturing();
      } catch {}
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("opportunity_cookie_consent", "granted");
    try {
      posthog?.opt_in_capturing();
    } catch {}
    window.dispatchEvent(new Event("cookie_consent_updated"));
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem("opportunity_cookie_consent", "denied");
    try {
      posthog?.opt_out_capturing();
    } catch {}
    window.dispatchEvent(new Event("cookie_consent_updated"));
    setShowBanner(false);
  };

  if (!mounted || !showBanner) return null;

  return (
    <div
      role="region"
      aria-label="Cookie and Privacy Consent"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="p-4 sm:p-5 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-2xl text-card-foreground">
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
            <Cookie className="size-4" />
          </div>
          <div className="space-y-1.5 flex-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground font-mono">
                Cookie & Privacy Choices
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                DPDPA & GDPR
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed font-sans">
              We use strictly essential cookies for secure authentication. With your permission, we also use anonymized telemetry to measure AI matching latency. We <strong>never</strong> sell your data or train AI models on your resume.
            </p>
            <div className="flex items-center gap-3 pt-0.5 text-[11px] font-mono">
              <Link href="/cookies" className="text-foreground hover:underline">
                Cookie Policy
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/privacy" className="text-foreground hover:underline">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 pt-2 border-t border-border/50">
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-2xs cursor-pointer"
          >
            <Check className="size-3.5" />
            Accept All
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
          >
            <X className="size-3.5" />
            Essential Only
          </button>
        </div>
      </div>
    </div>
  );
}
