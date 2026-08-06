import { redirect } from "next/navigation";
import { Sparkles, Mail, Send, Building2, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import type { Profile } from "@/types/db";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OutreachPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/outreach`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarded) redirect("/onboarding");

  // Fetch outreach leads and logs
  const { data: logs } = await supabase
    .from("outreach_logs")
    .select("*, lead:outreach_leads(*, company:companies(*)), opportunity:opportunities(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const outreachLogs = logs || [];

  // Fetch Hot Leads
  const { data: hotLeadsData } = await supabase
    .from("outreach_leads")
    .select("*, company:companies(*)")
    .eq("lead_type", "founder")
    .order("created_at", { ascending: false })
    .limit(3);
    
  const hotLeads = hotLeadsData || [];

  return (
    <div className="min-h-screen">
      <NavBar email={user.email} isAdmin={profile.role === "admin"} />
      
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10 animate-fade-up">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2 text-primary">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="size-4" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Cold Outreach
            </h1>
          </div>
          <p className="text-muted-foreground text-[15px] max-w-2xl">
            Track your cold emails, generate AI outreach drafts, and connect directly with hiring managers and founders for your saved opportunities.
          </p>
        </header>

        {hotLeads.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" /> Hot Leads This Week
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {hotLeads.map((lead: any) => (
                <div key={lead.id} className="rounded-xl border border-border/60 bg-card p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {lead.company?.logo_url ? (
                        <img src={lead.company.logo_url} alt="Logo" className="size-10 rounded-md object-contain bg-white p-1 border border-border/50" />
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <Building2 className="size-5" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-[14px] font-semibold text-foreground leading-tight">
                          {lead.company?.name || "Startup"}
                        </h4>
                        {lead.company?.funding_stage && (
                          <span className="text-[11px] text-primary font-medium">
                            {lead.company.funding_stage} {lead.company.total_funding && `· ${lead.company.total_funding}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h5 className="text-[13px] font-semibold text-foreground flex items-center gap-1.5">
                      {lead.name}
                      {lead.email_verified && <CheckCircle2 className="size-3 text-emerald-500" />}
                    </h5>
                    <p className="text-[12px] text-muted-foreground">{lead.title}</p>
                    {lead.company?.description && (
                      <p className="text-[12px] text-muted-foreground mt-2 line-clamp-2">
                        {lead.company.description}
                      </p>
                    )}
                  </div>
                  
                  <Button className="w-full h-8 text-xs gap-1.5" variant="secondary">
                    <Mail className="size-3" /> Draft Email
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        <h2 className="text-lg font-bold text-foreground mb-4">Your Outreach Log</h2>

        {outreachLogs.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card/40 p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Send className="size-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No outreach attempts yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Start by saving an opportunity and clicking "Action Plan" to generate cold emails to verified company contacts.
            </p>
            <div className="mt-6">
              <Link href="/">
                <Button>Browse Opportunities</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {outreachLogs.map((log: any) => (
              <div key={log.id} className="rounded-xl border border-border/60 bg-card/40 p-5 shadow-sm hover:border-primary/20 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex gap-4">
                    {log.lead?.company?.logo_url ? (
                       <img src={log.lead.company.logo_url} alt="Logo" className="size-10 rounded-md object-contain bg-white p-1 border border-border/50" />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Building2 className="size-5" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-[15px] font-semibold text-foreground">
                        {log.lead?.name || "Unknown Lead"}
                        {log.lead?.email_verified && (
                          <span title="Verified Email" className="ml-2 inline-flex text-emerald-500"><CheckCircle2 className="size-3.5" /></span>
                        )}
                      </h4>
                      <p className="text-[13px] text-muted-foreground">
                        {log.lead?.title || "Team Member"} at {log.lead?.company?.name || "Company"}
                      </p>
                      {log.opportunity && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background px-2.5 py-1 text-[11px] font-medium text-foreground/80">
                          Regarding: {log.opportunity.title}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                       <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                         {log.status}
                       </span>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      View Draft
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
