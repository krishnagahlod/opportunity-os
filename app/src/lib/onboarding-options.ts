/**
 * Source of truth for the chip option lists shown on /onboarding and /settings.
 * Both the UI (chip toggles) and the AI prompt (so it returns values that
 * match our chips exactly) read from here. Adding a new option in one place
 * is enough.
 */

export const INTEREST_OPTIONS = [
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
] as const;

export const SKILL_OPTIONS = [
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
] as const;

export const STAGE_OPTIONS = [
  "First Year",
  "Second Year",
  "Pre-final Year",
  "Final Year",
  "Graduate",
  "Early Professional"
] as const;

export const GOAL_OPTIONS = [
  "Internships",
  "Full-time roles",
  "Hackathons",
  "Case Competitions",
  "Fellowships",
  "Scholarships",
  "Workshops / Events"
] as const;

export const AVOID_OPTIONS = [
  "Unpaid",
  "Onsite",
  "Senior roles",
  "Sales / Marketing",
  "Low-stipend internships"
] as const;

export type InterestOption = (typeof INTEREST_OPTIONS)[number];
export type SkillOption = (typeof SKILL_OPTIONS)[number];
export type StageOption = (typeof STAGE_OPTIONS)[number];
export type GoalOption = (typeof GOAL_OPTIONS)[number];
export type AvoidOption = (typeof AVOID_OPTIONS)[number];
