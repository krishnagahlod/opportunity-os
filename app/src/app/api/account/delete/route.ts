import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError } from "@/lib/security/errors";

export const runtime = "nodejs";

/**
 * DELETE /api/account/delete
 * Authenticated GDPR data deletion endpoint:
 * Purges all personal data, resume files, sessions, applications,
 * saved jobs, and deletes the Supabase auth account.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Delete resume file from Supabase storage if it exists
    const { data: prof } = await admin
      .from("profiles")
      .select("resume_url")
      .eq("id", user.id)
      .maybeSingle();

    if (prof?.resume_url) {
      try {
        await admin.storage.from("resumes").remove([prof.resume_url]);
      } catch (storageErr) {
        console.warn("[account/delete] Failed to remove resume storage file:", storageErr);
      }
    }

    // 2. Cascade delete all user records
    await admin.from("user_sessions").delete().eq("user_id", user.id);
    await admin.from("applications").delete().eq("user_id", user.id);
    await admin.from("saved_opportunities").delete().eq("user_id", user.id);
    await admin.from("opportunity_feedback").delete().eq("user_id", user.id);
    await admin.from("user_entitlements").delete().eq("user_id", user.id);
    await admin.from("profiles").delete().eq("id", user.id);

    // 3. Delete auth account
    const { error: authError } = await admin.auth.admin.deleteUser(user.id);
    if (authError) {
      console.warn("[account/delete] Error deleting auth user:", authError);
    }

    // 4. Sign out of current session
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: "Account and associated personal data deleted successfully.",
    });
  } catch (error) {
    return handleApiError(error, "account-delete");
  }
}
