# Opportunity OS — Design System & Visual Specification (DESIGN.md)

> The official visual source of truth for Opportunity OS. Built following the **Awesome Design MD** standard, **TasteSkill** anti-slop principles, and **Vercel Web Interface Guidelines**.

---

## 1. Visual Theme & Atmosphere
- **Aesthetic:** Modern, high-craft, precision-engineered technical platform.
- **Canvas Mood:** Warm technical light canvas (`#FBFBFC`) with crisp physical card elevation, high-contrast dark ink typography, and structured 1px border grids.
- **Personality Dials:**
  - **Visual Density:** `8/10` (High information density, telemetry tags, structured data tables).
  - **Motion Intensity:** `7/10` (Smooth infinite marquee, subtle tactile active press physics, responsive tab transitions).
  - **Design Variance:** `7/10` (Asymmetric layout balance, distinct typographic hierarchy, zero generic template tropes).

---

## 2. Semantic Color Palette & Roles

| Role | Token / Hex | Usage |
| :--- | :--- | :--- |
| **Canvas Background** | `#FBFBFC` | Main application background surface. |
| **Card Surface** | `#FFFFFF` | Elevate interactive components and modules. |
| **Subtle Surface** | `#F4F5F7` / `#F8F9FA` | Inputs, secondary button backgrounds, table headers. |
| **Hairline Border** | `#E2E4E9` / `#E5E7EB` | 1px clean technical dividers and card borders. |
| **Active / Focus Border** | `#18181B` / `#2563EB` | Active card borders, focused inputs, selected states. |
| **Primary Ink (Title)** | `#0F172A` / `#18181B` | High-contrast headlines, primary actions, bold numbers. |
| **Secondary Ink (Body)** | `#334155` / `#475569` | Explanatory copy, feature descriptions. |
| **Muted Ink (Metadata)** | `#64748B` / `#94A3B8` | Telemetry tags, timestamps, source labels. |
| **Accent Emerald (Success)** | `#059669` / `#10B981` | High match tiers (90%+), verified opening badges. |
| **Accent Blue (Precision)** | `#2563EB` / `#1D4ED8` | Primary brand accent, action links, active tabs. |
| **Accent Amber (Warning)** | `#D97706` / `#F59E0B` | Urgency countdowns, closing warnings, keyword alerts. |

---

## 3. Typography Rules & Scale

- **Primary Heading & Body Font:** Plus Jakarta Sans & Satoshi.
  - Tracking: Tight optical kerning on headings (`tracking-tight` / `-0.035em`).
  - Leading: Snug line heights for headlines (`leading-[1.08]`).
- **Monospace Metadata Font:** Geist Mono / JetBrains Mono.
  - Tracking: Uppercase wide tracking (`tracking-wider` / `0.15em`).
  - Usage: Telemetry badges (`[LIVE]`), timestamps, category pills, match scores, recruiter email cards.

---

## 4. Tactile Button & Elevation Physics

- **Primary Button:**
  - Background: `#18181B` (Zinc-900).
  - Text: `#FFFFFF` (White, Bold, `text-xs`).
  - Height: `h-10` / `h-12`.
  - Press State: `active:scale-[0.98]` sub-millisecond tactile compression.
  - Shadow: Crisp micro-shadow (`shadow-xs` / `shadow-md`), never mushy colored radial blur.
- **Secondary / Outline Button:**
  - Background: `#FFFFFF` with 1px border `#E2E4E9`.
  - Hover State: `hover:bg-zinc-50 hover:border-zinc-300`.
  - Press State: `active:scale-[0.98]`.

---

## 5. Layout & 8pt Baseline Grid Rules

- Section Padding: `py-20` (Mobile) / `py-24` (Desktop).
- Maximum Content Width: `max-w-6xl` (1152px) with `px-4` safety padding.
- Component Gaps: Strict 4px/8px multiples (`gap-2` = 8px, `gap-3` = 12px, `gap-4` = 16px, `gap-6` = 24px, `gap-8` = 32px).
- Icon Proportions: Icons must always match text cap-height (`size-3.5` with `text-xs`, `size-4` with `text-sm`, `size-5` with `text-base`).

---

## 6. Anti-Slop Guardrails (The "Never" List)

1. **NEVER** use pure unstyled `#FFFFFF` background for the entire page body — use warm technical canvas `#FBFBFC`.
2. **NEVER** use rainbow gradient text or purple/fuchsia vibe-code.
3. **NEVER** use generic sparkle icons (`<Sparkles />`) in badges — use clean live pulse indicators or precision icons.
4. **NEVER** use tilted floating browser mockups with 3 cartoon dots.
5. **NEVER** use fake testimonials with placeholder initials.
6. **NEVER** use mushy colored glow drop shadows.
