"use client";

import { useState, useTransition } from "react";
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
            className={`rounded-full border px-3 py-1 text-sm transition ${
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted"
            }`}
          >
            {opt}
          </button>
        );
      })}
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
      className="space-y-6 rounded-lg border bg-card p-6 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            name="full_name"
            defaultValue={initialName}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={initialEmail} disabled />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="college">College / University</Label>
          <Input id="college" name="college" placeholder="IIT Bombay" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="graduation_year">Graduation year</Label>
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

      <div className="space-y-2">
        <Label>Interests — pick any that apply</Label>
        <Chips
          options={INTEREST_OPTIONS}
          selected={interests}
          onToggle={toggleInterest}
        />
      </div>

      <div className="space-y-2">
        <Label>Skills — what are you comfortable with?</Label>
        <Chips options={SKILL_OPTIONS} selected={skills} onToggle={toggleSkill} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="preferred_location">Preferred location</Label>
          <Input
            id="preferred_location"
            name="preferred_location"
            placeholder="Bangalore, Mumbai, anywhere, ..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="remote_preference">Remote preference</Label>
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="time_commitment">What are you looking for?</Label>
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

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : "Save and see my feed"}
      </Button>
    </form>
  );
}
