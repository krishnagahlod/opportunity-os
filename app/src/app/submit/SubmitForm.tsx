"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/ai/prompts";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { submitOpportunity } from "./actions";

export function SubmitForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await submitOpportunity(formData);
      if ("error" in res) {
        setError(res.error);
      } else {
        setSubmittedId(res.id);
      }
    });
  }

  if (submittedId) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
          <Check className="size-5" />
        </div>
        <h2 className="mt-4 text-lg font-semibold tracking-tight">
          Submitted for review
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Thanks — an admin will approve and publish it shortly. Want to add
          another?
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSubmittedId(null)}
          >
            Submit another
          </Button>
          <Link
            href="/"
            className={cn(buttonVariants({ size: "sm", className: "gap-1" }))}
          >
            Back to feed
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      action={onSubmit}
      className="space-y-6 rounded-2xl border border-border/70 bg-card p-6 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="title" className="text-xs">
            Title
          </Label>
          <Input
            id="title"
            name="title"
            placeholder="APM Internship — Acme Corp"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="organization" className="text-xs">
            Organization
          </Label>
          <Input
            id="organization"
            name="organization"
            placeholder="Acme Corp"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category" className="text-xs">
            Category
          </Label>
          <Select name="category" defaultValue="internship">
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="apply_url" className="text-xs">
            Apply URL
          </Label>
          <Input
            id="apply_url"
            name="apply_url"
            type="url"
            placeholder="https://..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deadline" className="text-xs">
            Deadline (optional)
          </Label>
          <Input id="deadline" name="deadline" type="date" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location" className="text-xs">
            Location
          </Label>
          <Input
            id="location"
            name="location"
            placeholder="Bangalore / Remote / ..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="compensation" className="text-xs">
            Compensation (optional)
          </Label>
          <Input
            id="compensation"
            name="compensation"
            placeholder="₹50,000/month"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description" className="text-xs">
            Description
          </Label>
          <Textarea
            id="description"
            name="description"
            rows={5}
            placeholder="What's the opportunity? Eligibility? Selection process?"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          Submission goes to admin review before appearing in the feed.
        </p>
        <Button type="submit" size="sm" className="gap-1.5" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit for review"}
          {!isPending && <ArrowRight className="size-3.5" />}
        </Button>
      </div>
    </form>
  );
}
