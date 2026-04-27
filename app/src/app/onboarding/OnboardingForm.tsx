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
import { INTEREST_OPTIONS, SKILL_OPTIONS } from "@/lib/onboarding-options";
import { saveOnboarding } from "./actions";
import { ResumeQuickStart, type ParseResultStats } from "./ResumeQuickStart";
import type { ResumeExtraction } from "@/lib/ai/prompts";

function Chips({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
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
            aria-pressed={active}
            className={cn(
              "group/chip inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
              active
                ? "border-primary/50 bg-primary/12 text-primary shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_25%,transparent),0_4px_14px_-4px_color-mix(in_oklch,var(--primary)_35%,transparent)] dark:bg-primary/18"
                : "border-border bg-background/60 text-foreground/80 backdrop-blur-sm hover:-translate-y-px hover:border-foreground/20 hover:text-foreground hover:shadow-sm",
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

function SectionLabel({
  step,
  title,
  hint,
}: {
  step: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-4 flex items-baseline gap-3">
      <span className="font-mono text-[11px] tabular-nums text-primary/70">
        {step}
      </span>
      <div>
        <h2 className="text-base font-semibold tracking-tight sm:text-lg">
          {title}
        </h2>
        {hint && (
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
    </div>
  );
}

export function OnboardingForm({
  userId,
  initialEmail,
  initialName,
}: {
  userId: string;
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

  // Resume parser is now constrained to return values from INTEREST_OPTIONS
  // for roles_of_interest, so the matcher just needs case-insensitive equality.
  // For skills the AI prefers chip-list spellings but may also return free
  // lowercase keywords (e.g. "dcf") that don't appear in our chips — those
  // get persisted in profile.resume_skills (via the parseResume action) for
  // confirmation later in Settings, so no signal is lost.
  //
  // Returns the actual ticked counts so the QuickStart block can show the
  // truth ("2 skills, 1 interest ticked") instead of the AI's raw extraction
  // count which can be misleading when many extracted terms aren't on our
  // chip list.
  function applyResumeExtraction(extraction: ResumeExtraction): ParseResultStats {
    const skillLower = new Set(extraction.skills.map((s) => s.toLowerCase()));
    const matchedSkills = SKILL_OPTIONS.filter((opt) =>
      skillLower.has(opt.toLowerCase()),
    );

    const roleLower = new Set(
      extraction.roles_of_interest.map((r) => r.toLowerCase()),
    );
    const matchedInterests = INTEREST_OPTIONS.filter((opt) =>
      roleLower.has(opt.toLowerCase()),
    );

    setSkills((prev) => new Set([...prev, ...matchedSkills]));
    setInterests((prev) => new Set([...prev, ...matchedInterests]));

    return {
      matchedSkills: matchedSkills.length,
      matchedInterests: matchedInterests.length,
      // Off-chip skills the AI surfaced but couldn't auto-tick (still saved
      // to profile.resume_skills for review in Settings).
      extraSkills: Math.max(0, extraction.skills.length - matchedSkills.length),
    };
  }

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
    <form action={onSubmit} className="space-y-12">
      {/* Resume quick start — prominent, gradient-tinted hero affordance */}
      <ResumeQuickStart userId={userId} onParsed={applyResumeExtraction} />

      {/* === 01 Basics ============================================== */}
      <section>
        <SectionLabel step="01" title="About you" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="full_name"
            name="full_name"
            label="Full name"
            defaultValue={initialName}
            required
          />
          <Field
            id="onboarding-email"
            label="Email"
            value={initialEmail}
            disabled
          />
          <Field
            id="college"
            name="college"
            label="College / University"
            placeholder="IIT Bombay"
            required
          />
          <Field
            id="graduation_year"
            name="graduation_year"
            label="Graduation year"
            type="number"
            min={2020}
            max={2035}
            placeholder="2027"
            required
          />
        </div>
      </section>

      {/* === 02 Interests ============================================ */}
      <section>
        <SectionLabel
          step="02"
          title="What are you into?"
          hint="Pick every area you're genuinely curious about. We rank matches against these."
        />
        <Chips
          options={INTEREST_OPTIONS}
          selected={interests}
          onToggle={toggleInterest}
        />
      </section>

      {/* === 03 Skills =============================================== */}
      <section>
        <SectionLabel
          step="03"
          title="What are you good at?"
          hint="Tools, languages, capabilities — anything you'd put on a resume."
        />
        <Chips
          options={SKILL_OPTIONS}
          selected={skills}
          onToggle={toggleSkill}
        />
      </section>

      {/* === 04 Preferences ========================================== */}
      <section>
        <SectionLabel
          step="04"
          title="What are you looking for?"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="preferred_location"
            name="preferred_location"
            label="Preferred location"
            placeholder="Bangalore, Mumbai, anywhere…"
          />
          <div className="space-y-1.5">
            <Label htmlFor="remote_preference" className="text-xs">
              Remote preference
            </Label>
            <Select name="remote_preference" defaultValue="any">
              <SelectTrigger
                id="remote_preference"
                className="bg-background/60 backdrop-blur-sm"
              >
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
              Type of opportunity
            </Label>
            <Select name="time_commitment" defaultValue="any">
              <SelectTrigger
                id="time_commitment"
                className="bg-background/60 backdrop-blur-sm"
              >
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
      </section>

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Sticky CTA bar — floats above the bottom edge so it's always reachable
          regardless of how far the user has scrolled. */}
      <div className="sticky bottom-4 z-10 mt-14">
        <div className="rounded-2xl border border-border/70 bg-card/85 p-2.5 shadow-[0_20px_50px_-20px_color-mix(in_oklch,var(--primary)_30%,transparent)] backdrop-blur-md">
          <Button
            type="submit"
            size="lg"
            className="group/cta w-full justify-center gap-2 bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md transition hover:from-indigo-500 hover:to-violet-500 hover:shadow-lg"
            disabled={isPending}
          >
            {isPending ? "Saving…" : "Save and see my feed"}
            {!isPending && (
              <ArrowRight className="size-4 transition-transform group-hover/cta:translate-x-0.5" />
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

/* ============ small primitives ============ */

function Field({
  id,
  name,
  label,
  type = "text",
  placeholder,
  defaultValue,
  value,
  required,
  disabled,
  min,
  max,
}: {
  id: string;
  name?: string;
  label: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        className="bg-background/60 backdrop-blur-sm"
      />
    </div>
  );
}
