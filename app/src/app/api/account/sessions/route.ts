import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getUserActiveSessions,
  revokeOtherSessions,
  revokeSessionById,
} from "@/lib/auth/sessions";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await getUserActiveSessions(user.id);
    return NextResponse.json({ sessions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, sessionId, currentToken } = body;

    if (action === "revoke_others") {
      const revokedCount = await revokeOtherSessions(user.id, currentToken || user.id);
      return NextResponse.json({ success: true, revokedCount });
    }

    if (action === "revoke" && sessionId) {
      const success = await revokeSessionById(user.id, sessionId);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
