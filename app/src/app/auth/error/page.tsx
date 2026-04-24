import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="relative min-h-screen overflow-hidden bg-hero-radial dark:bg-hero-radial-dark">
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-border/70 bg-card/80 p-6 text-center shadow-[0_30px_80px_-24px_color-mix(in_oklch,var(--primary)_20%,transparent)] backdrop-blur">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
            <AlertTriangle className="size-5" />
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">
            Sign-in failed
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {message ?? "Something went wrong. Please try again."}
          </p>
          <Link href="/login" className={buttonVariants({ className: "mt-6 w-full" })}>
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
