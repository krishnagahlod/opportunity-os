import "server-only";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Guard for any endpoint that n8n calls. Compares the X-Ingest-Secret header
 * against INGEST_SHARED_SECRET. Returns a NextResponse on failure; undefined
 * if the request is authorized.
 */
export function requireIngestAuth(req: NextRequest): NextResponse | undefined {
  const expected = process.env.INGEST_SHARED_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "Server misconfigured: INGEST_SHARED_SECRET not set" },
      { status: 500 },
    );
  }
  const got = req.headers.get("x-ingest-secret");
  if (got !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return undefined;
}
