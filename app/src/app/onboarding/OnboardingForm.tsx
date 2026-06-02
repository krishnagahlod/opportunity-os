"use client";

import { useState, useTransition } from "react";
import { ArrowRight, ArrowLeft, Check, Send } from "lucide-react";
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
import { 
  INTEREST_OPTIONS, 
  SKILL_OPTIONS,
  STAGE_OPTIONS,
  GOAL_OPTIONS,
  AVOID_OPTIONS
} from "@/lib/onboarding-options";
import { DOMAINS } from "@/lib/domains";
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

function DomainCards({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {DOMAINS.map(({ style }) => {
        const active = selected.has(style.label);
        const Icon = style.Icon;
        return (
          <button
            type="button"
            key={style.label}
            onClick={() => onToggle(style.label)}
            className={cn(
              "relative flex flex-col items-center justify-center gap-3 rounded-2xl border p-4 text-center transition-all",
              active
                ? "border-primary/50 bg-primary/5 shadow-md shadow-primary/10"
                : "border-border bg-background/60 hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-muted/50"
            )}
          >
            {active && (
              <div className="absolute right-3 top-3 rounded-full bg-primary p-0.5 text-primary-foreground">
                <Check className="size-3" />
              </div>
            )}
            <div className={cn("flex size-10 items-center justify-center rounded-xl", style.bg, style.text)}>
              <Icon className="size-5" />
            </div>
            <span className={cn("text-xs font-medium", active ? "text-primary" : "text-muted-foreground")}>
              {style.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SectionLabel({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h2>
      {hint && (
        <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>
      )}
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
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Selections
  const [interests, setInterests] = useState<Set<string>>(new Set());
  const [skills, setSkills] = useState<Set<string>>(new Set());
  const [goals, setGoals] = useState<Set<string>>(new Set());
  const [avoids, setAvoids] = useState<Set<string>>(new Set());

  const toggleSet = (setFunc: React.Dispatch<React.SetStateAction<Set<string>>>) => (v: string) =>
    setFunc((s) => {
      const n = new Set(s);
      n.has(v) ? n.delete(v) : n.add(v);
      return n;
    });

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
      extraSkills: Math.max(0, extraction.skills.length - matchedSkills.length),
    };
  }

  async function onSubmit(formData: FormData) {
    setError(null);
    formData.set("interests", JSON.stringify([...interests]));
    formData.set("skills", JSON.stringify([...skills]));
    formData.set("opportunity_goals", JSON.stringify([...goals]));
    formData.set("avoid_tags", JSON.stringify([...avoids]));
    
    startTransition(async () => {
      const res = await saveOnboarding(formData);
      if (res && "error" in res) setError(res.error);
    });
  }

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-12 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-primary/20"
              )}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-muted-foreground">Step {step} of 4</span>
      </div>

      <form action={onSubmit} className="space-y-8">
        {step === 1 && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-300">
            <ResumeQuickStart userId={userId} onParsed={applyResumeExtraction} />
            <section>
              <SectionLabel title="About you" />
              <div className="grid gap-6 sm:grid-cols-2">
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
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="stage" className="text-xs">Current Stage</Label>
                  <Select name="stage">
                    <SelectTrigger className="bg-background/60 backdrop-blur-sm">
                      <SelectValue placeholder="Select your current stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGE_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-300">
            <section>
              <SectionLabel
                title="What tracks are you hunting for?"
                hint="Pick every area you're genuinely curious about. We rank matches against these."
              />
              <DomainCards
                selected={interests}
                onToggle={toggleSet(setInterests)}
              />
            </section>
            <section>
              <SectionLabel
                title="What are you good at?"
                hint="Tools, languages, capabilities — anything you'd put on a resume."
              />
              <Chips
                options={SKILL_OPTIONS}
                selected={skills}
                onToggle={toggleSet(setSkills)}
              />
            </section>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-300">
            <section>
              <SectionLabel
                title="What are your goals?"
                hint="Select the types of opportunities you actually want to see."
              />
              <Chips
                options={GOAL_OPTIONS}
                selected={goals}
                onToggle={toggleSet(setGoals)}
              />
            </section>
            <section>
              <SectionLabel
                title="What should we avoid?"
                hint="Select any red flags or dealbreakers."
              />
              <Chips
                options={AVOID_OPTIONS}
                selected={avoids}
                onToggle={toggleSet(setAvoids)}
              />
            </section>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-300">
            <section>
              <SectionLabel title="Preferences & Targets" />
              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  id="preferred_location"
                  name="preferred_location"
                  label="Preferred location"
                  placeholder="Bangalore, Mumbai, anywhere…"
                />
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="min_compensation" className="text-xs">
                      Min Compensation Target
                    </Label>
                    <span className="text-xs font-semibold text-primary">
                      {typeof document !== "undefined" && (document.getElementById("min_compensation") as HTMLInputElement)?.value 
                        ? `$${(document.getElementById("min_compensation") as HTMLInputElement).value}/yr`
                        : "$0+"}
                    </span>
                  </div>
                  <input
                    id="min_compensation"
                    name="min_compensation"
                    type="range"
                    min="0"
                    max="200000"
                    step="5000"
                    defaultValue="0"
                    className="w-full accent-primary"
                    onChange={(e) => {
                      const val = e.target.value;
                      const display = e.target.parentElement?.querySelector('span');
                      if (display) {
                        display.textContent = val === "0" ? "Any amount" : `$${parseInt(val).toLocaleString()}/yr`;
                      }
                    }}
                  />
                  <p className="text-[10px] text-muted-foreground">Adjust to filter out low-paying or unpaid roles.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="remote_preference" className="text-xs">
                    Remote preference
                  </Label>
                  <Select name="remote_preference" defaultValue="any">
                    <SelectTrigger id="remote_preference" className="bg-background/60 backdrop-blur-sm">
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
              </div>
            </section>

            <section>
              <SectionLabel
                title="Get pinged on Telegram"
                hint="Optional — but without this you'll miss the 48-hour deadline alerts that catch the things you'd otherwise miss."
              />
              <div className="rounded-2xl border border-primary/25 bg-primary/[0.04] p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-sm">
                    <Send className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold tracking-tight">
                      Connect your Telegram chat
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  <Label htmlFor="telegram_chat_id" className="text-xs">
                    Telegram chat ID
                  </Label>
                  <Input
                    id="telegram_chat_id"
                    name="telegram_chat_id"
                    placeholder="e.g. 1064311577"
                    inputMode="numeric"
                    className="bg-background/60 backdrop-blur-sm"
                  />
                </div>
              </div>
            </section>
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between pt-6 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={prevStep}
            disabled={step === 1 || isPending}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>
          
          {step < 4 ? (
            <Button type="button" onClick={nextStep}>
              Next Step
              <ArrowRight className="ml-2 size-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              className="bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white"
              disabled={isPending}
            >
              {isPending ? "Saving…" : "Save & View Dashboard"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

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
