import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enrichCompany } from "@/lib/companies/enrich";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const supabase = createAdminClient();
  
  const { data: opps } = await supabase
    .from("opportunities")
    .select("id, organization, company_id")
    .is("company_id", null)
    .order("date_added", { ascending: false })
    .limit(50);

  if (!opps || opps.length === 0) {
    return NextResponse.json({ message: "No opportunities to backfill." });
  }

  let enrichedCount = 0;
  for (const opp of opps) {
    if (opp.organization) {
      try {
        await enrichCompany(opp.id, opp.organization);
        enrichedCount++;
      } catch (e) {
        console.error("Failed to enrich", opp.organization, e);
      }
    }
  }

  return NextResponse.json({ 
    message: `Enriched ${enrichedCount} out of ${opps.length} opportunities.`
  });
}
