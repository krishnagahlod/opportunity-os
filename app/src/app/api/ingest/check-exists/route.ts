import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireIngestAuth } from "@/lib/auth/ingest";

export const runtime = "nodejs";

/*
 * Cheap dedup probe called by n8n BEFORE the AI Extract step.
 * If the source_url already exists in opportunities, the workflow can skip
 * the (expensive) AI call entirely.
 *
 * Returns { exists: boolean, opportunity_id?: string }
 */

const RequestSchema = z.object({
  source_url: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  const unauthorized = requireIngestAuth(req);
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bad request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select("id")
    .eq("source_url", parsed.data.source_url)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Lookup failed", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    exists: !!data,
    opportunity_id: data?.id ?? null,
  });
}
