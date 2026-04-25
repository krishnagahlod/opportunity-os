"use client";

import { useState, useTransition } from "react";
import { Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/db";
import { saveSettings } from "./actions";

const INTEREST_OPTIONS = [
  "Consulting",
  "Finance",
  "Product Management",
  "Software Engineering",
  "Data Science",
  "Design",
  "Marketing",
  "Research",
  "Startups",
  "Venture Capital",
  "Sales",
  "Operations",
  "Content / Writing",
];

const SKILL_OPTIONS = [
  "Python",
  "JavaScript",
  "TypeScript",
  "React",
  "SQL",
  "Excel",
  "Figma",
  "PowerPoint",
  "Java",
  "Go",
  "Node.js",
  "Data Analysis",
  "Public Speaking",
  "Writing",
  "ML / AI",
  "No-code tools",
];

function Chips({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: Set<string>;
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.has(opt);
        return (
          <button
            type="button"
            key={opt}
            onClick={() => onToggle(opt)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
              active
                ? "border-primary/40 bg-primary/10 text-primary dark:bg-primary/15"
                : "border-border bg-background hover:border-border hover:bg-muted",
            )}
          >
            {active && <Check className="size-3" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint && (
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function SettingsForm({ profile }: { profile: Profile }) {
  const [isPending, startTransition] = useTransition();
  const [interests, setInterests] = useState<Set<string>>(
    new Set(profile.interests ?? []),
  );
  const [skills, setSkills] = useState<Set<string>>(
    new Set(profile.skills ?? []),
  );
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const toggleInterest = (v: string) =>
    setInterests((s) => {
      const n = new Set(s);
      n.has(v) ? n.delete(v) : n.add(v);
      return n;
    });

  const toggleSkill = (v: string) =>
    setSkills((s) => {
      const n = new Set(s);
      n.has(v) ? n.delete(v) : n.add(v);
      return n;
    });

  async function onSubmit(formData: FormData) {
    setError(null);
    setSavedAt(null);
    formData.set("interests", JSON.stringify([...interests]));
    formData.set("skills", JSON.stringify([...skills]));
    startTransition(async () => {
      const res = await saveSettings(formData);
      if (res && "error" in res) {
        setError(res.error);
      } else {
        setSavedAt(new Date().toLocaleTimeString());
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-8">
      <Section title="Profile">
        <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-xs">
                Full name
              </Label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={profile.full_name ?? ""}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input value={profile.email ?? ""} disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="college" className="text-xs">
                College / University
              </Label>
              <Input
                id="college"
                name="college"
                defaultValue={profile.college ?? ""}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="graduation_year" className="text-xs">
                Graduation year
              </Label>
              <Input
                id="graduation_year"
                name="graduation_year"
                type="number"
                min={2020}
                max={2035}
                defaultValue={profile.graduation_year ?? ""}
                required
              />
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Interests"
        hint="Powers your feed ranking. Adding/removing rescores on next dashboard load."
      >
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <Chips
            options={INTEREST_OPTIONS}
            selected={interests}
            onToggle={toggleInterest}
          />
        </div>
      </Section>

      <Section title="Skills">
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <Chips
            options={SKILL_OPTIONS}
            selected={skills}
            onToggle={toggleSkill}
          />
        </div>
      </Section>

      <Section title="Preferences">
        <div className="grid gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="preferred_location" className="text-xs">
              Preferred location
            </Label>
            <Input
              id="preferred_location"
              name="preferred_location"
              defaultValue={profile.preferred_location ?? ""}
              placeholder="Bangalore, Mumbai, anywhere, ..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="remote_preference" className="text-xs">
              Remote preference
            </Label>
            <Select
              name="remote_preference"
              defaultValue={profile.remote_preference ?? "any"}
            >
              <SelectTrigger id="remote_preference">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remote">Remote only</SelectItem>
                <SelectItem value="onsite">On-site only</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="any">Any</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="time_commitment" className="text-xs">
              What are you looking for?
            </Label>
            <Select
              name="time_commitment"
              defaultValue={profile.time_commitment ?? "any"}
            >
              <SelectTrigger id="time_commitment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internship">Internships</SelectItem>
                <SelectItem value="full-time">Full-time roles</SelectItem>
                <SelectItem value="part-time">Part-time / gigs</SelectItem>
                <SelectItem value="any">Anything relevant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      <Section
        title="Notifications"
        hint="Telegram chat ID for daily digest pushes. Get it by messaging your bot then visiting api.telegram.org/bot<TOKEN>/getUpdates."
      >
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="space-y-1.5">
            <Label htmlFor="telegram_chat_id" className="text-xs">
              Telegram chat ID
            </Label>
            <Input
              id="telegram_chat_id"
              name="telegram_chat_id"
              defaultValue={profile.telegram_chat_id ?? ""}
              placeholder="e.g. 1064311577"
              inputMode="numeric"
            />
            <p className="text-[11px] text-muted-foreground">
              Leave blank to fall back to the server&apos;s
              TELEGRAM_DEFAULT_CHAT_ID env var.
            </p>
          </div>
        </div>
      </Section>

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="sticky bottom-4 flex items-center justify-between rounded-xl border border-border/70 bg-card/90 px-4 py-3 shadow-md backdrop-blur">
        <span className="text-xs text-muted-foreground">
          {savedAt
            ? `Saved at ${savedAt}`
            : "Click save to apply changes."}
        </span>
        <Button
          type="submit"
          size="sm"
          className="gap-1.5"
          disabled={isPending}
        >
          {isPending ? (
            "Saving..."
          ) : (
            <>
              <Save className="size-3.5" />
              Save changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
