import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserSession } from "@/types/db";

const MAX_ACTIVE_DEVICES = 3;

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Records or updates a user device session. If active sessions exceed the MAX_ACTIVE_DEVICES limit,
 * the oldest non-revoked session is automatically revoked.
 */
export async function recordSessionActivity({
  userId,
  sessionToken,
  userAgent = "",
  ip = "",
  deviceName,
}: {
  userId: string;
  sessionToken: string;
  userAgent?: string;
  ip?: string;
  deviceName?: string;
}): Promise<{ revoked: boolean; activeCount: number }> {
  const supabase = createAdminClient();
  const tokenHash = hashValue(sessionToken);
  const ipHash = ip ? hashValue(ip) : null;
  const deviceHash = userAgent ? hashValue(userAgent) : null;

  // Infer device name if not provided
  let inferredDevice = deviceName;
  if (!inferredDevice && userAgent) {
    if (/iphone|ipad|ipod/i.test(userAgent)) inferredDevice = "iOS Device";
    else if (/android/i.test(userAgent)) inferredDevice = "Android Device";
    else if (/macintosh|mac os x/i.test(userAgent)) inferredDevice = "Mac";
    else if (/windows/i.test(userAgent)) inferredDevice = "Windows PC";
    else if (/linux/i.test(userAgent)) inferredDevice = "Linux";
    else inferredDevice = "Web Browser";
  }

  // Check if session is already recorded and revoked
  const { data: existing } = await supabase
    .from("user_sessions")
    .select("id, revoked_at")
    .eq("session_token_hash", tokenHash)
    .maybeSingle();

  if (existing?.revoked_at) {
    return { revoked: true, activeCount: 0 };
  }

  const nowIso = new Date().toISOString();

  if (existing) {
    // Update last seen
    await supabase
      .from("user_sessions")
      .update({
        last_seen_at: nowIso,
        ip_hash: ipHash,
        device_name: inferredDevice || "Web Browser",
      })
      .eq("id", existing.id);
  } else {
    // Insert new session
    await supabase.from("user_sessions").insert({
      user_id: userId,
      session_token_hash: tokenHash,
      device_hash: deviceHash,
      device_name: inferredDevice || "Web Browser",
      user_agent: userAgent.slice(0, 255),
      ip_hash: ipHash,
      created_at: nowIso,
      last_seen_at: nowIso,
    });
  }

  // Fetch all active (non-revoked) sessions for this user
  const { data: activeSessions } = await supabase
    .from("user_sessions")
    .select("id, last_seen_at")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("last_seen_at", { ascending: false });

  const activeCount = activeSessions?.length || 1;

  // If sessions exceed concurrency limit, auto-revoke the oldest ones
  if (activeSessions && activeSessions.length > MAX_ACTIVE_DEVICES) {
    const toRevoke = activeSessions.slice(MAX_ACTIVE_DEVICES);
    const revokeIds = toRevoke.map((s) => s.id);

    await supabase
      .from("user_sessions")
      .update({ revoked_at: nowIso })
      .in("id", revokeIds);
  }

  return { revoked: false, activeCount: Math.min(activeCount, MAX_ACTIVE_DEVICES) };
}

/**
 * Returns all registered sessions for a user.
 */
export async function getUserActiveSessions(userId: string): Promise<UserSession[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("user_sessions")
    .select("*")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("last_seen_at", { ascending: false });

  return (data as UserSession[]) || [];
}

/**
 * Revokes all sessions for a user except the current session token.
 */
export async function revokeOtherSessions(
  userId: string,
  currentSessionToken: string
): Promise<number> {
  const supabase = createAdminClient();
  const currentHash = hashValue(currentSessionToken);
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("user_sessions")
    .update({ revoked_at: nowIso })
    .eq("user_id", userId)
    .is("revoked_at", null)
    .neq("session_token_hash", currentHash)
    .select("id");

  return data?.length || 0;
}

/**
 * Revokes a specific session by its ID.
 */
export async function revokeSessionById(
  userId: string,
  sessionId: string
): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", userId);

  return !error;
}
