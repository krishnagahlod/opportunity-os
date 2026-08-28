import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enrichCompany } from "@/lib/companies/enrich";
import { requireCronAuth } from "@/lib/auth/cron";
import { handleApiError } from "@/lib/security/errors";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/admin/backfill-companies
 * Secured admin route: Requires either valid CRON_SECRET or authenticated Admin user role.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Check if invoked via CRON
    const cronDenied = requireCronAuth(req);
    let isAuthorized = !cronDenied;

    // 2. If not cron, check if invoked by authenticated Admin user
    if (!isAuthorized) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "admin") {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();
    
    const { data: opps } = await supabaseAdmin
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
  } catch (error) {
    return handleApiError(error, "admin-backfill-companies");
  }
}
