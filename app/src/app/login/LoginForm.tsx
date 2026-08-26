"use client";

import { useTransition } from "react";
import { ArrowRight, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink, signInWithGoogle } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [isMagicPending, startMagicTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();

  return (
    <div className="space-y-4">
      {/* Google OAuth Button with tactile physics */}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full h-11 gap-2.5 font-bold text-xs border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300 shadow-2xs active:scale-[0.98] transition-all"
        disabled={isGooglePending || isMagicPending}
        onClick={() =>
          startGoogleTransition(() => signInWithGoogle(next))
        }
      >
        {isGooglePending ? (
          <Loader2 className="size-4 animate-spin text-zinc-500" />
        ) : (
          <GoogleIcon className="size-4" />
        )}
        <span>{isGooglePending ? "Connecting to Google..." : "Continue with Google"}</span>
      </Button>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-zinc-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
            or use email
          </span>
        </div>
      </div>

      {/* Magic link form */}
      <form
        action={(formData) =>
          startMagicTransition(() => sendMagicLink(formData))
        }
        className="space-y-4"
      >
        <div className="space-y-1.5 text-left">
          <Label htmlFor="email" className="text-xs font-bold text-zinc-700">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com or you@iitb.ac.in"
              required
              autoComplete="email"
              autoFocus
              className="h-10 pl-9.5 text-xs rounded-xl border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 shadow-2xs"
            />
          </div>
        </div>
        {next && <input type="hidden" name="next" value={next} />}
        <Button
          type="submit"
          size="lg"
          className="w-full h-11 gap-2 font-bold text-xs bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs active:scale-[0.98] transition-all"
          disabled={isMagicPending || isGooglePending}
        >
          {isMagicPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Sending Magic Link...</span>
            </>
          ) : (
            <>
              <span>Send Magic Link</span>
              <ArrowRight className="size-3.5" />
            </>
          )}
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
