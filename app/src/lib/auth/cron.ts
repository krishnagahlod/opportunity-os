import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

/** Constant-time comparison to prevent side-channel timing attacks */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Guard for cron-triggered routes. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`;
 * locally you'd manually pass the same header via curl when testing.
 *
 * Returns null when authorized, or a 401 NextResponse to short-circuit the route.
 */
export function requireCronAuth(req: NextRequest): NextResponse | null {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "Server misconfigured: CRON_SECRET not set" },
      { status: 500 },
    );
  }

  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match || !safeCompare(match[1], expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
