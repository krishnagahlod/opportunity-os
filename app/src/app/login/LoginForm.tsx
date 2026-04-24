"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => sendMagicLink(formData))}
      className="space-y-4 rounded-lg border bg-card p-6 shadow-sm"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          autoFocus
        />
      </div>
      {next && <input type="hidden" name="next" value={next} />}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Sending magic link..." : "Send magic link"}
      </Button>
      <p className="text-xs text-muted-foreground">
        We&apos;ll email you a one-click sign-in link. No password needed.
      </p>
    </form>
  );
}
