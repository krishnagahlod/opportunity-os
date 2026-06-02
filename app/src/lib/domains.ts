import {
  BarChart3,
  BrainCircuit,
  Briefcase,
  Code2,
  CreditCard,
  Database,
  FlaskConical,
  Globe,
  Heart,
  Landmark,
  LayoutDashboard,
  Lightbulb,
  Megaphone,
  Palette,
  Scale,
  Shield,
  ShoppingBag,
  Stethoscope,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type DomainStyle = {
  label: string;
  Icon: LucideIcon;
  bg: string;
  text: string;
};

const DOMAINS: { keywords: string[]; style: DomainStyle }[] = [
  {
    keywords: ["ai", "artificial intelligence", "machine learning", "ml", "deep learning", "nlp", "llm", "generative ai", "computer vision"],
    style: { label: "AI / ML", Icon: BrainCircuit, bg: "bg-violet-100 dark:bg-violet-500/15", text: "text-violet-600 dark:text-violet-400" },
  },
  {
    keywords: ["data science", "data analytics", "data analysis", "data engineering", "analytics", "business intelligence", "bi"],
    style: { label: "Data", Icon: Database, bg: "bg-cyan-100 dark:bg-cyan-500/15", text: "text-cyan-600 dark:text-cyan-400" },
  },
  {
    keywords: ["software", "web development", "frontend", "backend", "full stack", "fullstack", "sde", "developer", "engineering", "devops", "cloud"],
    style: { label: "Engineering", Icon: Code2, bg: "bg-emerald-100 dark:bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400" },
  },
  {
    keywords: ["consulting", "strategy", "management consulting", "advisory", "consultant"],
    style: { label: "Consulting", Icon: Lightbulb, bg: "bg-amber-100 dark:bg-amber-500/15", text: "text-amber-600 dark:text-amber-400" },
  },
  {
    keywords: ["finance", "investment banking", "private equity", "venture capital", "vc", "trading", "quant", "fintech", "financial"],
    style: { label: "Finance", Icon: CreditCard, bg: "bg-green-100 dark:bg-green-500/15", text: "text-green-600 dark:text-green-400" },
  },
  {
    keywords: ["marketing", "digital marketing", "social media", "content", "branding", "growth", "seo", "communications"],
    style: { label: "Marketing", Icon: Megaphone, bg: "bg-pink-100 dark:bg-pink-500/15", text: "text-pink-600 dark:text-pink-400" },
  },
  {
    keywords: ["design", "ui", "ux", "graphic design", "product design", "figma", "visual design", "creative"],
    style: { label: "Design", Icon: Palette, bg: "bg-fuchsia-100 dark:bg-fuchsia-500/15", text: "text-fuchsia-600 dark:text-fuchsia-400" },
  },
  {
    keywords: ["product management", "product manager", "pm", "product owner"],
    style: { label: "Product", Icon: LayoutDashboard, bg: "bg-indigo-100 dark:bg-indigo-500/15", text: "text-indigo-600 dark:text-indigo-400" },
  },
  {
    keywords: ["healthcare", "health", "medical", "biotech", "pharma", "biomedical", "clinical"],
    style: { label: "Healthcare", Icon: Stethoscope, bg: "bg-red-100 dark:bg-red-500/15", text: "text-red-600 dark:text-red-400" },
  },
  {
    keywords: ["law", "legal", "policy", "compliance", "regulatory", "governance"],
    style: { label: "Legal", Icon: Scale, bg: "bg-slate-100 dark:bg-slate-500/15", text: "text-slate-600 dark:text-slate-400" },
  },
  {
    keywords: ["research", "science", "r&d", "academic", "lab", "phd"],
    style: { label: "Research", Icon: FlaskConical, bg: "bg-teal-100 dark:bg-teal-500/15", text: "text-teal-600 dark:text-teal-400" },
  },
  {
    keywords: ["sales", "business development", "account management", "bd", "partnerships"],
    style: { label: "Sales", Icon: BarChart3, bg: "bg-orange-100 dark:bg-orange-500/15", text: "text-orange-600 dark:text-orange-400" },
  },
  {
    keywords: ["operations", "supply chain", "logistics", "ops"],
    style: { label: "Operations", Icon: Truck, bg: "bg-yellow-100 dark:bg-yellow-500/15", text: "text-yellow-600 dark:text-yellow-400" },
  },
  {
    keywords: ["cybersecurity", "security", "infosec", "penetration testing"],
    style: { label: "Security", Icon: Shield, bg: "bg-rose-100 dark:bg-rose-500/15", text: "text-rose-600 dark:text-rose-400" },
  },
  {
    keywords: ["ngo", "non-profit", "nonprofit", "social impact", "sustainability", "esg"],
    style: { label: "Social Impact", Icon: Heart, bg: "bg-lime-100 dark:bg-lime-500/15", text: "text-lime-600 dark:text-lime-400" },
  },
  {
    keywords: ["e-commerce", "ecommerce", "retail", "marketplace"],
    style: { label: "E-Commerce", Icon: ShoppingBag, bg: "bg-sky-100 dark:bg-sky-500/15", text: "text-sky-600 dark:text-sky-400" },
  },
  {
    keywords: ["government", "public sector", "civil services"],
    style: { label: "Government", Icon: Landmark, bg: "bg-stone-100 dark:bg-stone-500/15", text: "text-stone-600 dark:text-stone-400" },
  },
  {
    keywords: ["hr", "human resources", "people operations", "talent"],
    style: { label: "HR", Icon: Briefcase, bg: "bg-blue-100 dark:bg-blue-500/15", text: "text-blue-600 dark:text-blue-400" },
  },
];

const DEFAULT_DOMAIN: DomainStyle = {
  label: "General",
  Icon: Globe,
  bg: "bg-neutral-100 dark:bg-neutral-500/15",
  text: "text-neutral-600 dark:text-neutral-400",
};

/**
 * Infers a domain from an opportunity's tags, title, and organization.
 * Scans through predefined keyword lists and returns the first match.
 */
export function inferDomain(
  tags: string[] | null | undefined,
  title: string,
  organization: string,
): DomainStyle {
  // Build a single lowercase haystack from all available text
  const hay = [
    ...(tags ?? []),
    title,
    organization,
  ]
    .join(" ")
    .toLowerCase();

  for (const domain of DOMAINS) {
    for (const keyword of domain.keywords) {
      if (hay.includes(keyword)) {
        return domain.style;
      }
    }
  }

  return DEFAULT_DOMAIN;
}
