import {
  Award,
  Briefcase,
  Code2,
  GraduationCap,
  Laptop,
  Megaphone,
  Mic,
  Sparkles,
  Trophy,
  Users,
  Wrench,
  Zap,
  Gift,
  FileBadge,
  type LucideIcon,
} from "lucide-react";
import type { OpportunityCategory } from "@/types/db";

export type CategoryStyle = {
  label: string;
  Icon: LucideIcon;
  /** Tailwind background classes for the icon chip (light-mode tinted). */
  chipBg: string;
  /** Text color class for the icon inside the chip. */
  chipText: string;
  /** Badge text color used on the pill next to the title. */
  badgeText: string;
  /** Solid bg class for the small dot used in editorial row layout. */
  dotBg: string;
};

const DEFAULT: CategoryStyle = {
  label: "Other",
  Icon: Sparkles,
  chipBg: "bg-violet-100 dark:bg-violet-500/15",
  chipText: "text-violet-600 dark:text-violet-300",
  badgeText: "text-violet-700 dark:text-violet-300",
  dotBg: "bg-violet-500",
};

const STYLES: Record<OpportunityCategory, CategoryStyle> = {
  internship: {
    label: "Internship",
    Icon: GraduationCap,
    chipBg: "bg-indigo-100 dark:bg-indigo-500/15",
    chipText: "text-indigo-600 dark:text-indigo-300",
    badgeText: "text-indigo-700 dark:text-indigo-300",
    dotBg: "bg-indigo-500",
  },
  fulltime: {
    label: "Full-time",
    Icon: Briefcase,
    chipBg: "bg-sky-100 dark:bg-sky-500/15",
    chipText: "text-sky-600 dark:text-sky-300",
    badgeText: "text-sky-700 dark:text-sky-300",
    dotBg: "bg-sky-500",
  },
  case_competition: {
    label: "Case Comp",
    Icon: Trophy,
    chipBg: "bg-amber-100 dark:bg-amber-500/15",
    chipText: "text-amber-600 dark:text-amber-300",
    badgeText: "text-amber-700 dark:text-amber-300",
    dotBg: "bg-amber-500",
  },
  hackathon: {
    label: "Hackathon",
    Icon: Code2,
    chipBg: "bg-emerald-100 dark:bg-emerald-500/15",
    chipText: "text-emerald-600 dark:text-emerald-300",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    dotBg: "bg-emerald-500",
  },
  fellowship: {
    label: "Fellowship",
    Icon: Award,
    chipBg: "bg-rose-100 dark:bg-rose-500/15",
    chipText: "text-rose-600 dark:text-rose-300",
    badgeText: "text-rose-700 dark:text-rose-300",
    dotBg: "bg-rose-500",
  },
  scholarship: {
    label: "Scholarship",
    Icon: Award,
    chipBg: "bg-rose-100 dark:bg-rose-500/15",
    chipText: "text-rose-600 dark:text-rose-300",
    badgeText: "text-rose-700 dark:text-rose-300",
    dotBg: "bg-rose-400",
  },
  conference: {
    label: "Conference",
    Icon: Mic,
    chipBg: "bg-fuchsia-100 dark:bg-fuchsia-500/15",
    chipText: "text-fuchsia-600 dark:text-fuchsia-300",
    badgeText: "text-fuchsia-700 dark:text-fuchsia-300",
    dotBg: "bg-fuchsia-500",
  },
  workshop: {
    label: "Workshop",
    Icon: Wrench,
    chipBg: "bg-cyan-100 dark:bg-cyan-500/15",
    chipText: "text-cyan-600 dark:text-cyan-300",
    badgeText: "text-cyan-700 dark:text-cyan-300",
    dotBg: "bg-cyan-500",
  },
  bootcamp: {
    label: "Bootcamp",
    Icon: Zap,
    chipBg: "bg-orange-100 dark:bg-orange-500/15",
    chipText: "text-orange-600 dark:text-orange-300",
    badgeText: "text-orange-700 dark:text-orange-300",
    dotBg: "bg-orange-500",
  },
  networking: {
    label: "Networking",
    Icon: Users,
    chipBg: "bg-teal-100 dark:bg-teal-500/15",
    chipText: "text-teal-600 dark:text-teal-300",
    badgeText: "text-teal-700 dark:text-teal-300",
    dotBg: "bg-teal-500",
  },
  campus_ambassador: {
    label: "Ambassador",
    Icon: Megaphone,
    chipBg: "bg-lime-100 dark:bg-lime-500/15",
    chipText: "text-lime-600 dark:text-lime-300",
    badgeText: "text-lime-700 dark:text-lime-300",
    dotBg: "bg-lime-500",
  },
  remote_gig: {
    label: "Remote gig",
    Icon: Laptop,
    chipBg: "bg-slate-100 dark:bg-slate-500/15",
    chipText: "text-slate-600 dark:text-slate-300",
    badgeText: "text-slate-700 dark:text-slate-300",
    dotBg: "bg-slate-500",
  },
  freebie: {
    label: "Freebie",
    Icon: Gift,
    chipBg: "bg-pink-100 dark:bg-pink-500/15",
    chipText: "text-pink-600 dark:text-pink-300",
    badgeText: "text-pink-700 dark:text-pink-300",
    dotBg: "bg-pink-500",
  },
  certification: {
    label: "Certification",
    Icon: FileBadge,
    chipBg: "bg-blue-100 dark:bg-blue-500/15",
    chipText: "text-blue-600 dark:text-blue-300",
    badgeText: "text-blue-700 dark:text-blue-300",
    dotBg: "bg-blue-500",
  },
  other: DEFAULT,
};

export function getCategoryStyle(
  category: OpportunityCategory | string | null | undefined,
): CategoryStyle {
  if (!category) return DEFAULT;
  return STYLES[category as OpportunityCategory] ?? DEFAULT;
}

/** Iterable lookup for use in pickers/filters. Same data as getCategoryStyle. */
export const CATEGORY_META: Record<OpportunityCategory, CategoryStyle> = STYLES;

/** Stable pastel initial circle for an organization. */
export function orgInitials(org: string): string {
  const words = org.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
