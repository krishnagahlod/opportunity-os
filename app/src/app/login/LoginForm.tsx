"use client";

import { useTransition } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => sendMagicLink(formData))}
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
        disabled={isPending}
      >
        {isPending ? "Sending link..." : "Send magic link"}
        {!isPending && <ArrowRight className="size-4" />}
      </Button>
    </form>
  );
}
