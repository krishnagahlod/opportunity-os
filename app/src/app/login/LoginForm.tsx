"use client";

import { useTransition } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink, signInWithGoogle } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [isMagicPending, startMagicTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();

  return (
    <div className="space-y-4">
      {/* Google OAuth */}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full gap-2"
        disabled={isGooglePending}
        onClick={() =>
          startGoogleTransition(() => signInWithGoogle(next))
        }
      >
        <GoogleIcon className="size-4" />
        {isGooglePending ? "Redirecting..." : "Continue with Google"}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            or
          </span>
        </div>
      </div>

      {/* Magic link */}
      <form
        action={(formData) =>
          startMagicTransition(() => sendMagicLink(formData))
        }
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium">
            Email
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              autoFocus
              className="pl-9"
            />
          </div>
        </div>
        {next && <input type="hidden" name="next" value={next} />}
        <Button
          type="submit"
          size="lg"
          className="w-full gap-2"
          disabled={isMagicPending}
        >
          {isMagicPending ? "Sending link..." : "Send magic link"}
          {!isMagicPending && <ArrowRight className="size-4" />}
        </Button>
      </form>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#EA4335"
        d="M12 5.04c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.86 14.97.84 12 .84 7.7.84 3.99 3.31 2.18 6.91l3.66 2.84C6.71 7.04 9.14 5.04 12 5.04z"
      />
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.55-.21-2.27H12v4.51h6.45c-.28 1.49-1.13 2.76-2.41 3.61l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.69z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09a7.02 7.02 0 010-4.18L2.18 7.07A11.96 11.96 0 00.84 12c0 1.93.46 3.75 1.34 5.36l3.66-3.27z"
      />
      <path
        fill="#34A853"
        d="M12 23.16c3.24 0 5.95-1.07 7.93-2.91l-3.66-2.84c-1.02.69-2.32 1.1-4.27 1.1-2.86 0-5.29-2-6.16-4.71L2.18 16.5C3.99 20.69 7.7 23.16 12 23.16z"
      />
    </svg>
  );
}
