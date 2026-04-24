"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Check } from "lucide-react";
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
import { saveOnboarding } from "./actions";

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
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function OnboardingForm({
  initialEmail,
  initialName,
}: {
  initialEmail: string;
  initialName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [interests, setInterests] = useState<Set<string>>(new Set());
  const [skills, setSkills] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

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
    formData.set("interests", JSON.stringify([...interests]));
    formData.set("skills", JSON.stringify([...skills]));
    startTransition(async () => {
      const res = await saveOnboarding(formData);
      if (res && "error" in res) setError(res.error);
    });
  }

  return (
    <form
      action={onSubmit}
      className="space-y-8 rounded-2xl border border-border/70 bg-card/80 p-6 shadow-[0_30px_80px_-24px_color-mix(in_oklch,var(--primary)_18%,transparent)] backdrop-blur sm:p-8"
    >
      <Section title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="full_name" className="text-xs">
              Full name
            </Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={initialName}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input value={initialEmail} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="college" className="text-xs">
              College / University
            </Label>
            <Input
              id="college"
              name="college"
              placeholder="IIT Bombay"
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
              placeholder="2027"
              required
            />
          </div>
        </div>
      </Section>

      <Section
        title="Interests"
        hint="Pick every area you're genuinely curious about — we score matches against these."
      >
        <Chips
          options={INTEREST_OPTIONS}
          selected={interests}
          onToggle={toggleInterest}
        />
      </Section>

      <Section title="Skills" hint="What are you comfortable with?">
        <Chips options={SKILL_OPTIONS} selected={skills} onToggle={toggleSkill} />
      </Section>

      <Section title="Preferences">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="preferred_location" className="text-xs">
              Preferred location
            </Label>
            <Input
              id="preferred_location"
              name="preferred_location"
              placeholder="Bangalore, Mumbai, anywhere, ..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="remote_preference" className="text-xs">
              Remote preference
            </Label>
            <Select name="remote_preference" defaultValue="any">
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
            <Select name="time_commitment" defaultValue="any">
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

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full gap-2"
        disabled={isPending}
      >
        {isPending ? "Saving..." : "Save and see my feed"}
        {!isPending && <ArrowRight className="size-4" />}
      </Button>
    </form>
  );
}
