import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchHunterLeads } from "@/lib/companies/hunter";
import { callLLM } from "@/lib/ai/fallover";
import { z } from "zod";

export const maxDuration = 60; // Allow enough time for LLM call

const GENERATE_OUTREACH_PROMPT = `
You are an expert career coach and recruiter writing a highly personalized cold outreach email.
The goal is to get a response and a potential interview or referral for the candidate.

Candidate Details:
{PROFILE_DETAILS}

Company & Lead Details:
{COMPANY_DETAILS}
Target Lead: {LEAD_NAME} ({LEAD_TITLE})
Email: {LEAD_EMAIL}

Opportunity Details:
{OPPORTUNITY_DETAILS}

Write a short, compelling cold email (max 4-5 sentences). 
- Subject line should be catchy but professional.
- Mention a specific detail about the company or the role.
- Hook them with the candidate's strongest matching skill/experience.
- End with a soft, low-friction call to action (e.g. asking for a quick 10-minute chat or advice).
- DO NOT use placeholders like [Insert Date] - make it sound complete.

Respond with a JSON object containing a single 'email' field containing the generated email text. The email text should include the subject line on the first line prefixed with "Subject:". No extra pleasantries before or after.
`;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { opportunity_id } = body;
    if (!opportunity_id) return NextResponse.json({ error: "opportunity_id required" }, { status: 400 });

    // Enforce AI Cold Outreach quota (2/month for Free, 50/month for Pro/IITB)
    const { checkAndConsumeQuota, hasFeatureAccess } = await import("@/lib/auth/entitlements");
    const quotaCheck = await checkAndConsumeQuota(user.id, "ai_cold_outreach", 1);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          error: "Monthly cold email generation limit reached (2 drafts/month on Free tier). Upgrade to Pro for 50 drafts/month + verified hiring manager emails.",
          code: "QUOTA_EXCEEDED",
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    const canSeeVerifiedContacts = await hasFeatureAccess(user.id, "verified_contact_info");

    // 1. Fetch Opportunity, Company, and Profile
    const { data: opp } = await supabase
      .from("opportunities")
      .select("*, company:companies(*)")
      .eq("id", opportunity_id)
      .single();

    if (!opp) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    if (!opp.company) return NextResponse.json({ error: "Company details missing" }, { status: 400 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // 2. Find or fetch Leads
    let { data: leads } = await supabase
      .from("outreach_leads")
      .select("*")
      .eq("company_id", opp.company.id)
      .order("relevance_score", { ascending: false });

    if (!leads || leads.length === 0) {
      // Use Hunter.io to find leads for the domain
      const hunterLeads = await fetchHunterLeads(opp.company.domain);
      if (hunterLeads.length > 0) {
        // Insert them into DB
        const toInsert = hunterLeads.map(l => ({
          company_id: opp.company.id,
          name: `${l.first_name || ""} ${l.last_name || ""}`.trim(),
          title: l.position,
          email: l.email,
          email_verified: l.confidence >= 80,
          relevance_score: l.confidence, // Rough proxy for now
          lead_type: l.seniority,
          source: "hunter.io"
        }));

        const { data: insertedLeads } = await supabase
          .from("outreach_leads")
          .insert(toInsert)
          .select("*");
          
        if (insertedLeads) leads = insertedLeads;
      }
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({ error: "No leads found for this company." }, { status: 404 });
    }

    const targetLead = leads[0]; // Pick highest relevance lead

    // 3. Generate Draft via AI
    const profileText = `Name: ${profile.full_name}\nCollege: ${profile.college}\nSkills: ${profile.skills.join(", ")}`;
    const compText = `Name: ${opp.company.name}\nIndustry: ${opp.company.industry}\nDescription: ${opp.company.description}`;
    const oppText = `Title: ${opp.title}\nDescription: ${opp.description}`;

    const prompt = GENERATE_OUTREACH_PROMPT
      .replace("{PROFILE_DETAILS}", profileText)
      .replace("{COMPANY_DETAILS}", compText)
      .replace("{LEAD_NAME}", targetLead.name)
      .replace("{LEAD_TITLE}", targetLead.title || "Team Member")
      .replace("{LEAD_EMAIL}", targetLead.email || "")
      .replace("{OPPORTUNITY_DETAILS}", oppText);

    const { data: { email: emailDraft } } = await callLLM({
      prompt,
      schema: z.object({ email: z.string() }),
      systemInstruction: "You are an expert cold email writer.",
    });

    // 4. Save to outreach_logs
    const { data: log } = await supabase
      .from("outreach_logs")
      .insert({
        user_id: user.id,
        lead_id: targetLead.id,
        opportunity_id: opp.id,
        status: "drafted",
        email_draft: emailDraft
      })
      .select()
      .single();

    return NextResponse.json({ ok: true, draft: log });
  } catch (err: any) {
    console.error("Error generating outreach:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
