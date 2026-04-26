import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Unified empty state for feed/saved/applications/etc.
 * Always offers a single primary CTA so users know the next action.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  decorative,
}: {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  action?: { label: string; href: string };
  /** When true, render the muted ghost-rows backdrop (used on dashboard). */
  decorative?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-12 text-center">
      {decorative && (
        <div className="mask-bottom-fade pointer-events-none absolute inset-x-6 bottom-0 top-24 space-y-3 opacity-40">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-12 rounded-xl border border-border/60 bg-muted/40"
            />
          ))}
        </div>
      )}
      <div className="relative">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
          <Icon className="size-5" />
        </div>
        <h2 className="mt-4 text-base font-semibold tracking-tight">{title}</h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
        {action && (
          <Link
            href={action.href}
            className={cn(
              buttonVariants({ size: "sm" }),
              "mt-5 inline-flex gap-1",
            )}
          >
            {action.label}
            <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
