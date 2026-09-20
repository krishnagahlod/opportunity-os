import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError } from "@/lib/security/errors";

export const runtime = "nodejs";

/**
 * GET /api/account/export
 * DPDPA 2023 Section 11 & GDPR Article 20: Right to Data Portability.
 * Provides an authenticated user with a complete, structured JSON export
 * of all personal data, resume skills, applications, saved opportunities,
 * feedback, and device sessions associated with their account.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Fetch all user-related data in parallel
    const [
      profileRes,
      savedRes,
      applicationsRes,
      feedbackRes,
      sessionsRes,
      entitlementsRes,
    ] = await Promise.all([
      admin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      admin.from("saved_opportunities").select("opportunity_id, saved_at").eq("user_id", user.id),
      admin.from("applications").select("opportunity_id, status, notes, updated_at").eq("user_id", user.id),
      admin.from("opportunity_feedback").select("opportunity_id, feedback, created_at").eq("user_id", user.id),
      admin.from("user_sessions").select("device_name, ip_hash, last_active_at, created_at, revoked_at").eq("user_id", user.id),
      admin.from("entitlements").select("product, plan_key, status, starts_at, expires_at, created_at").eq("user_id", user.id),
    ]);

    const exportPayload = {
      format: "Opportunity OS Personal Data Export",
      version: "1.0",
      exportTimestamp: new Date().toISOString(),
      statutoryFramework: "India DPDPA 2023 (Section 11) & GDPR (Article 20)",
      dataPrincipal: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
      profile: profileRes.data || null,
      savedOpportunities: savedRes.data || [],
      applicationsTracker: applicationsRes.data || [],
      opportunityFeedback: feedbackRes.data || [],
      registeredDeviceSessions: sessionsRes.data || [],
      careerPassEntitlements: entitlementsRes.data || [],
    };

    const jsonString = JSON.stringify(exportPayload, null, 2);

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="opportunity_os_data_${user.id.slice(0, 8)}.json"`,
      },
    });
  } catch (error) {
    return handleApiError(error, "account-export");
  }
}
