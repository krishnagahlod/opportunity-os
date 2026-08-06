import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import * as cheerio from "cheerio";
import { callLLM } from "@/lib/ai/fallover";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const TechCrunchStartupRSS = "https://techcrunch.com/category/startups/feed/";

const HotLeadsSchema = z.object({
  leads: z.array(z.object({
    companyName: z.string().describe("Name of the startup that raised funding"),
    domain: z.string().optional().describe("Website domain if mentioned or easily guessed (e.g. startup.com)"),
    founderName: z.string().describe("Name of the founder or CEO mentioned"),
    founderTitle: z.string().describe("Title, e.g. CEO, Co-founder"),
    fundingAmount: z.string().optional().describe("Amount raised, e.g. $5M, $10M"),
    fundingStage: z.string().optional().describe("Stage, e.g. Seed, Series A"),
    description: z.string().describe("One sentence summary of what the company does")
  }))
});

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    if (!isCron && process.env.NODE_ENV !== "development") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 1. Fetch RSS Feed
    const rssRes = await fetch(TechCrunchStartupRSS);
    if (!rssRes.ok) throw new Error("Failed to fetch RSS feed");
    const xml = await rssRes.text();

    // 2. Parse RSS using cheerio
    const $ = cheerio.load(xml, { xmlMode: true });
    const items = $("item").slice(0, 5).toArray(); 
    
    let combinedText = "";
    items.forEach(item => {
      const title = $(item).find("title").text();
      const content = $(item).find("content\\:encoded").text() || $(item).find("description").text();
      const cleanContent = cheerio.load(content).text().substring(0, 1500);
      combinedText += `\n\nARTICLE TITLE: ${title}\nCONTENT: ${cleanContent}`;
    });

    // 3. Extract leads using centralized LLM fallover logic
    const prompt = `Read the following recent news articles and extract the startups that just raised funding, along with their founders/CEOs. Only include if a specific person (founder/CEO) is named.

Articles:${combinedText}

IMPORTANT: You MUST return a single JSON object with EXACTLY one key called "leads" which contains an array of objects.
Example output format:
{
  "leads": [
    {
      "companyName": "Example Corp",
      "domain": "example.com",
      "founderName": "Jane Doe",
      "founderTitle": "CEO",
      "fundingAmount": "$10M",
      "fundingStage": "Series A",
      "description": "Building AI tools for developers"
    }
  ]
}
`;

    const { data } = await callLLM({
      prompt,
      schema: HotLeadsSchema,
      systemInstruction: "You are an expert at extracting startup funding news and identifying founders.",
      maxTokens: 2000,
    });

    const leads = data.leads;
    const supabase = createAdminClient();
    let leadsAdded = 0;

    for (const lead of leads) {
      if (!lead.companyName || !lead.founderName) continue;

      let domain = lead.domain || lead.companyName.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";

      let companyId: string;
      const { data: existingCompany } = await supabase
        .from("companies")
        .select("id")
        .eq("domain", domain)
        .maybeSingle();

      if (existingCompany) {
        companyId = existingCompany.id;
        if (lead.fundingAmount || lead.fundingStage) {
          await supabase.from("companies").update({
            total_funding: lead.fundingAmount || undefined,
            funding_stage: lead.fundingStage || undefined
          }).eq("id", companyId);
        }
      } else {
        const { data: newCompany, error: companyErr } = await supabase
          .from("companies")
          .insert({
            name: lead.companyName,
            domain: domain,
            description: lead.description,
            total_funding: lead.fundingAmount,
            funding_stage: lead.fundingStage,
            trust_score: 85,
            trust_signals: { source: "TechCrunch RSS", date: new Date().toISOString() }
          })
          .select("id")
          .single();
        
        if (companyErr || !newCompany) {
          console.error("Failed to create company", companyErr);
          continue;
        }
        companyId = newCompany.id;
      }

      const { data: existingLead } = await supabase
        .from("outreach_leads")
        .select("id")
        .eq("company_id", companyId)
        .eq("name", lead.founderName)
        .maybeSingle();

      if (!existingLead) {
        await supabase.from("outreach_leads").insert({
          company_id: companyId,
          name: lead.founderName,
          title: lead.founderTitle,
          lead_type: "founder",
          source: "TechCrunch",
          relevance_score: 90
        });
        leadsAdded++;
      }
    }

    return NextResponse.json({ success: true, leadsAdded, extracted: leads });

  } catch (err: any) {
    console.error("Hot Leads ingestion error:", err);
    return new NextResponse(err.message || "Internal Error", { status: 500 });
  }
}
