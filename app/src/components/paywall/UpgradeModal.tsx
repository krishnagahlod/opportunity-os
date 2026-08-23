"use client";

import { useState } from "react";
import { Sparkles, Check, X, ShieldCheck, Zap, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  highlightFeature?: string;
  userEmail?: string | null;
}

export function UpgradeModal({
  isOpen,
  onClose,
  title = "Upgrade to Opportunity OS Pro",
  description = "Unlock full intelligence, verified hiring manager contacts, and unlimited discovery.",
  highlightFeature,
  userEmail,
}: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"pro_30d" | "pro_90d" | "pro_365d">("pro_90d");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const plans = [
    {
      key: "pro_30d" as const,
      name: "30 Days",
      price: "₹299",
      perMonth: "₹299/mo",
      tag: "Flexible",
    },
    {
      key: "pro_90d" as const,
      name: "90 Days",
      price: "₹799",
      perMonth: "₹266/mo",
      tag: "Most Popular",
      popular: true,
    },
    {
      key: "pro_365d" as const,
      name: "1 Year",
      price: "₹2,499",
      perMonth: "₹208/mo",
      tag: "Best Value",
    },
  ];

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      // 1. Create Cashfree order on backend
      const res = await fetch("/api/billing/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey: selectedPlan }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to initiate payment");
      }

      const order = await res.json();

      // 2. Load Cashfree JS SDK v3 if not already in document
      if (typeof window !== "undefined" && !(window as any).Cashfree) {
        const script = document.createElement("script");
        script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => (script.onload = resolve));
      }

      const envMode = order.envMode === "production" ? "production" : "sandbox";
      const cashfree = (window as any).Cashfree({ mode: envMode });

      // 3. Open Cashfree Checkout Modal
      const checkoutOptions = {
        paymentSessionId: order.paymentSessionId,
        redirectTarget: "_modal",
      };

      cashfree.checkout(checkoutOptions).then(async (result: any) => {
        if (result.error) {
          console.error("Cashfree checkout error:", result.error);
          setError(result.error.message || "Payment cancelled or failed");
          setLoading(false);
          return;
        }

        if (result.paymentDetails) {
          // Payment completed or closed in modal
          try {
            const verifyRes = await fetch("/api/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: order.orderId,
                planKey: selectedPlan,
              }),
            });

            if (verifyRes.ok) {
              window.location.reload();
            } else {
              setError("Verifying your payment activation...");
              setTimeout(() => window.location.reload(), 2000);
            }
          } catch {
            setTimeout(() => window.location.reload(), 2000);
          }
        }
      });
    } catch (err: any) {
      setError(err.message || "Failed to open checkout");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl animate-scale-in">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-2 text-primary mb-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="size-4" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider">Opportunity OS Pro</span>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>

        {highlightFeature && (
          <div className="mt-4 rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs font-medium text-primary flex items-center gap-2">
            <Zap className="size-4 shrink-0" />
            <span>Feature required: {highlightFeature}</span>
          </div>
        )}

        {/* Feature List */}
        <div className="my-5 grid grid-cols-2 gap-2.5 text-xs text-foreground/90">
          <div className="flex items-center gap-2">
            <Check className="size-3.5 text-emerald-500 shrink-0" />
            <span>1,000+ Unrestricted Feed</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="size-3.5 text-emerald-500 shrink-0" />
            <span>Verified Lead Contacts</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="size-3.5 text-emerald-500 shrink-0" />
            <span>AI Action Plans & Prep</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="size-3.5 text-emerald-500 shrink-0" />
            <span>50 AI Cold Emails / mo</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="size-3.5 text-emerald-500 shrink-0" />
            <span>Unlimited Live Search</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="size-3.5 text-emerald-500 shrink-0" />
            <span>Instant Priority Alerts</span>
          </div>
        </div>

        {/* Plan Selector */}
        <div className="space-y-2 mb-6">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Select Pass Duration
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {plans.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelectedPlan(p.key)}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all",
                  selectedPlan === p.key
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                    : "border-border hover:bg-muted/50"
                )}
              >
                {p.popular && (
                  <span className="absolute -top-2.5 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground">
                    POPULAR
                  </span>
                )}
                <span className="text-xs font-medium text-muted-foreground">{p.name}</span>
                <span className="text-base font-bold text-foreground mt-0.5">{p.price}</span>
                <span className="text-[10px] text-muted-foreground">{p.perMonth}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive text-center">
            {error}
          </div>
        )}

        {/* CTA */}
        <Button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full h-11 text-sm font-semibold gap-2 shadow-md"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Opening Cashfree Checkout...
            </>
          ) : (
            <>
              Unlock Pro with Cashfree <ArrowRight className="size-4" />
            </>
          )}
        </Button>

        <p className="mt-3 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-3.5 text-emerald-500" />
          Supports UPI (GPay, PhonePe, Paytm), Cards, and Netbanking.
        </p>
      </div>
    </div>
  );
}
