import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Defensive HTML stripper for upstream-supplied text.
 * Some scrapers (notably Devpost) leak HTML wrappers like
 * `$<span data-currency-value>300</span>` into prize/description fields.
 * This is a pure-text fallback used at render time.
 */
export function stripHtml(s: string | null | undefined): string {
  if (!s) return "";
  return String(s)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
