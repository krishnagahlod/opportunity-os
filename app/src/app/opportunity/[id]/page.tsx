import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Clock,
  MapPin,
  Sparkles,
  Tag,
  Wallet,
  Activity,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  Users,
} from "lucide-react";
import {
  format,
  formatDistanceToNowStrict,
  isPast,
  parseISO,
} from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { SaveButton } from "@/components/SaveButton";
import { ApplyButton } from "@/components/ApplyButton";
import { ExternalApplyLink } from "@/components/ApplyNudge";
import { ActionPlanButton } from "@/components/ActionPlanButton";
import { buttonVariants } from "@/components/ui/button";
import { getCategoryStyle, orgInitials } from "@/lib/categories";
import {
  computeScore,
  findMatchedTerms,
  findMissingRequirements,
} from "@/lib/scoring/score";
import { fetchBehavioralSignal } from "@/lib/scoring/refresh";
import { MissingSkillChip } from "@/components/MissingSkillChip";
import { cn, stripHtml } from "@/lib/utils";
import type {
  ApplicationStatus,
  Opportunity,
  Profile,
} from "@/types/db";
import { OutreachButton } from "@/components/OutreachButton";

import { ResumeMatchScore } from "@/components/ResumeMatchScore";
import { EnrichmentInsights } from "@/components/EnrichmentInsights";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";

export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function OpportunityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ action?: string }>;
}) {
  const { id } = await params;
  const { action } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/opportunity/${id}`)}`);

  // Profile required for scoring; redirect to onboarding if incomplete.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile?.onboarded) redirect("/onboarding");

  // Determine if user has a resume uploaded for the Deep AI Match
  const hasResume = !!profile.resume_url;

  // Fetch opportunity + user state in parallel
  const [oppRes, savedRes, appRes] = await Promise.all([
    supabase.from("opportunities").select("*,company:companies(*)").eq("id", id).maybeSingle(),
    supabase
      .from("saved_opportunities")
      .select("opportunity_id")
      .eq("user_id", user.id)
      .eq("opportunity_id", id)
      .maybeSingle(),
    supabase
      .from("applications")
      .select("status")
      .eq("user_id", user.id)
      .eq("opportunity_id", id)
      .maybeSingle(),
  ]);

  const opp = oppRes.data as Opportunity | null;
  if (!opp || opp.status === "spam") notFound();

  // Source name lookup (small extra query — kept separate for clarity)
  let sourceName: string | null = null;
  if (opp.source_id) {
    const { data } = await supabase
      .from("sources")
      .select("name")
      .eq("id", opp.source_id)
      .maybeSingle();
    sourceName = (data?.name as string) ?? null;
  }

  const isSaved = !!savedRes.data;
  const applicationStatus = (appRes.data?.status ?? undefined) as
    | ApplicationStatus
    | undefined;

  // why-text can mention "similar to opportunities you've saved" when true.
  const behavioralSignal = await fetchBehavioralSignal(user.id);
  const { score, fitScore, valueScore, actionabilityScore, why } = computeScore(
    profile as Profile,
    opp,
    behavioralSignal,
  );
  const matchedTerms = findMatchedTerms(profile as Profile, opp);
  const missingSkills = findMissingRequirements(profile as Profile, opp);

  const cat = getCategoryStyle(opp.category);
  const description = stripHtml(opp.description);
  const summary = stripHtml(opp.summary);
  const compensation = stripHtml(opp.compensation);
  const location = opp.is_remote ? "Remote" : opp.location;
  const deadlineDate = opp.deadline ? parseISO(opp.deadline) : null;
  const deadlineRel = deadlineDate
    ? isPast(deadlineDate)
      ? "Closed"
      : `${formatDistanceToNowStrict(deadlineDate)} left`
    : "Rolling";
  const deadlineUrgent =
    deadlineDate &&
    !isPast(deadlineDate) &&
    (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 7;
  const isExpired = opp.status === "expired";

  return (
    <div className="min-h-screen">
      <NavBar email={user.email} isAdmin={profile.role === "admin"} />

      <main id="main" className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to feed
        </Link>

        {/* Hero */}
        <header className="mt-5">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]">
            <span
              aria-hidden
              className={cn("size-1.5 rounded-full", cat.dotBg)}
            />
            <span className={cat.badgeText}>{cat.label}</span>
            {isExpired && (
              <span className="ml-2 rounded-md bg-slate-500/10 px-2 py-0.5 text-[10px] tracking-normal text-muted-foreground">
                Closed
              </span>
            )}
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {opp.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 text-[14px] text-foreground/85">
              <span
                aria-hidden
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full",
                  cat.chipBg,
                  cat.chipText,
                )}
              >
                <Building2 className="size-3.5" />
              </span>
              <span className="font-medium">{opp.organization}</span>
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
                {orgInitials(opp.organization)}
              </span>
            </div>
            <ScoreBadge score={score} />
          </div>
        </header>

        {/* Action bar — Save/MarkApplied wrap in a flex row, Apply takes full
            width on mobile (clear primary CTA), content-width on desktop. */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <SaveButton opportunityId={opp.id} isSaved={isSaved} />
          <ApplyButton
            opportunityId={opp.id}
            currentStatus={applicationStatus}
          />
          <ActionPlanButton opportunityId={opp.id} defaultOpen={action === "plan"} />
          {opp.company && <OutreachButton opportunityId={opp.id} />}
          {opp.apply_url && (
            <ExternalApplyLink
              href={opp.apply_url}
              opp={{
                id: opp.id,
                title: opp.title,
                organization: opp.organization,
              }}
              className="w-full justify-center sm:ml-auto sm:w-auto"
            >
              Apply
              <ArrowUpRight className="size-4" />
            </ExternalApplyLink>
          )}
        </div>

        <div className="mt-8">
          <ScoreBreakdown 
            fitScore={fitScore ?? 0}
            valueScore={valueScore ?? 0}
            actionabilityScore={actionabilityScore ?? 0}
          />
        </div>

        <ResumeMatchScore opportunityId={opp.id} hasResume={hasResume} />
        
        <div className="mt-6">
          <EnrichmentInsights opportunity={opp} missingSkills={missingSkills} />
        </div>

        {/* Company Intelligence */}
        {opp.company && (
          <section className="mt-8">
            <h2 className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
              <Building2 className="size-3" />
              Company Intelligence
            </h2>
            <div className="rounded-2xl border border-border/60 bg-card/40 p-5 shadow-sm transition-all hover:border-border/80">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {opp.company.logo_url ? (
                  <img src={opp.company.logo_url} alt="Logo" className="size-12 shrink-0 rounded-lg object-contain bg-white p-1 shadow-sm" />
                ) : (
                  <div className={cn("size-12 shrink-0 rounded-lg flex items-center justify-center shadow-sm", cat.chipBg, cat.chipText)}>
                    <Building2 className="size-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground truncate">
                      {opp.company.name}
                    </h3>
                    {opp.company.trust_score >= 60 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        <ShieldCheck className="size-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  {opp.company.industry && (
                    <p className="text-[13px] text-muted-foreground mt-0.5">{opp.company.industry}</p>
                  )}
                  {opp.company.description && (
                    <p className="mt-2.5 text-[13px] leading-relaxed text-foreground/80 line-clamp-3">
                      {opp.company.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {opp.company.founded_year && (
                  <Fact icon={<Clock className="size-3" />} label="Founded" value={opp.company.founded_year} />
                )}
                {opp.company.employee_count && (
                  <Fact icon={<Users className="size-3" />} label="Employees" value={opp.company.employee_count} />
                )}
                {opp.company.headquarters && (
                  <Fact icon={<MapPin className="size-3" />} label="HQ" value={opp.company.headquarters} />
                )}
                {opp.company.total_funding && (
                  <Fact icon={<Wallet className="size-3" />} label="Funding" value={opp.company.total_funding} />
                )}
              </div>
              
              {opp.company.website && (
                <div className="mt-4 flex justify-end">
                  <Link
                    href={opp.company.website}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
                  >
                    Visit Website <ArrowUpRight className="size-3" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Quick facts strip */}
        <section className="mt-8 grid gap-3 sm:grid-cols-2">
          <Fact
            icon={<Clock className="size-3.5" />}
            label="Deadline"
            value={
              <span
                className={cn(
                  deadlineUrgent && "text-amber-600 dark:text-amber-300",
                  isPast(deadlineDate ?? new Date()) &&
                    deadlineDate &&
                    "text-destructive",
                )}
              >
                {deadlineDate ? format(deadlineDate, "EEE, MMM d") : "Rolling"}
                {deadlineDate && (
                  <span className="ml-1.5 text-[11px] text-muted-foreground/80">
                    ({deadlineRel})
                  </span>
                )}
              </span>
            }
          />
          {location && (
            <Fact
              icon={<MapPin className="size-3.5" />}
              label="Location"
              value={location}
            />
          )}
          {compensation && (
            <Fact
              icon={<Wallet className="size-3.5" />}
              label="Compensation"
              value={compensation}
            />
          )}
          {sourceName && (
            <Fact
              icon={<Sparkles className="size-3.5" />}
              label="Source"
              value={sourceName}
            />
          )}
        </section>

        {/* Why for you */}
        {(why || matchedTerms.length > 0) && (
          <section className="mt-8">
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
              Why this is for you
            </h2>
            <div className="rounded-xl border-l-2 border-primary/50 bg-primary/[0.04] px-4 py-3 dark:bg-primary/[0.06]">
              {why && (
                <p className="text-[14px] italic leading-relaxed text-primary/90">
                  {why}
                </p>
              )}
              {matchedTerms.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Matches your profile
                  </span>
                  {matchedTerms.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[11.5px] font-medium text-primary"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Summary (only if distinct from description) */}
        {summary && summary.length > 0 && summary !== description && (
          <section className="mt-8">
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
              Summary
            </h2>
            <p className="text-[14px] leading-relaxed text-foreground/85">
              {summary}
            </p>
          </section>
        )}

        {/* Description */}
        {description && (
          <section className="mt-8">
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
              Details
            </h2>
            <div className="space-y-3 text-[14px] leading-relaxed text-foreground/85">
              {description.split(/\n\s*\n/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>
        )}

        {/* Eligibility */}
        {eligibility && (
          <section className="mt-8">
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
              Eligibility
            </h2>
            <p className="text-[14px] leading-relaxed text-foreground/85">
              {eligibility}
            </p>
          </section>
        )}

        {/* Tags */}
        {opp.tags && opp.tags.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
              <Tag className="size-3" />
              Tags
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {opp.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-border/60 bg-background px-2 py-0.5 text-[11.5px] text-muted-foreground"
                >
                  {t}
                </span>
              ))}
              {opp.eligibility_tags?.map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[11.5px] text-blue-600 dark:text-blue-400"
                >
                  {t}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Footer meta */}
        <footer className="mt-12 border-t border-border/40 pt-6 text-[11.5px] text-muted-foreground/80">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Added{" "}
              {formatDistanceToNowStrict(parseISO(opp.date_added), {
                addSuffix: true,
              })}
            </span>
            {opp.extraction_confidence !== null &&
              opp.extraction_confidence !== undefined &&
              opp.extraction_confidence < 0.7 && (
                <span className="rounded-full bg-amber-100/60 px-2 py-0.5 text-[10.5px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  Lower-confidence extraction (
                  {Math.round(opp.extraction_confidence * 100)}%)
                </span>
              )}
            {opp.source_url && !opp.source_url.startsWith("hash:") && (
              <Link
                href={opp.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-muted-foreground transition hover:text-foreground"
              >
                View source
                <ArrowUpRight className="size-3" />
              </Link>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
}

/* ============ Internals ============ */

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
      : score >= 60
        ? "bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300"
        : score >= 40
          ? "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300"
          : "bg-muted text-muted-foreground ring-border";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold tabular-nums ring-1 ring-inset",
        tone,
      )}
      title={`Personal fit: ${score}/100`}
    >
      <Sparkles className="size-3" />
      {score}/100
    </span>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/40 px-4 py-3">
      <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
          {label}
        </p>
        <p className="mt-0.5 text-[13.5px] font-medium text-foreground/90">
          {value}
        </p>
      </div>
    </div>
  );
}
