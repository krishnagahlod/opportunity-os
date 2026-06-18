import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * GET /api/cron/source-quality
 * 
 * Aggregates feedback (saves, applies, dismisses) per source and updates
 * their `quality_score`. Run daily via Vercel cron.
 */
export async function GET(req: Request) {
  // Enforce CRON_SECRET if present in env (Vercel standard)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();

  // Fetch stats from the view
  const { data: stats, error: statsErr } = await admin
    .from("source_quality_stats")
    .select("*");

  if (statsErr) {
    console.error("[api/cron/source-quality] Error fetching stats:", statsErr);
    return NextResponse.json({ error: statsErr.message }, { status: 500 });
  }

  const updates: { id: string; quality_score: number }[] = [];

  for (const s of stats || []) {
    // Need a minimum sample size before we start penalizing or boosting
    if (s.total_opps < 5) continue;

    const save_rate = Number(s.total_saves) / Number(s.total_opps);
    const apply_rate = Number(s.total_applies) / Number(s.total_opps);
    const dismiss_rate = Number(s.total_dismisses) / Number(s.total_opps);

    // Base score is 1.0.
    // Dismissals carry a heavy penalty. Saves and applies are positive signals.
    let score = 1.0;
    
    // Penalty: high dismissal rate brings the score down. Max penalty -0.5
    const penalty = Math.min(0.5, dismiss_rate * 1.5);
    
    // Boost: high engagement (saves + applies) brings the score up. Max boost +0.5
    // Applies are worth 2x saves.
    const boost = Math.min(0.5, (save_rate * 0.5) + (apply_rate * 1.5));

    score = score - penalty + boost;

    // Clamp between 0.5 (heavy penalty) and 1.5 (high yield boost)
    score = Math.max(0.5, Math.min(1.5, score));

    updates.push({
      id: s.source_id,
      quality_score: Number(score.toFixed(2)),
    });
  }

  // Upsert the updated scores into the sources table
  const { error: updateErr } = await admin
    .from("sources")
    .upsert(updates, { onConflict: "id" });

  if (updateErr) {
    console.error("[api/cron/source-quality] Error updating sources:", updateErr);
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    sources_updated: updates.length,
    updates,
  });
}
