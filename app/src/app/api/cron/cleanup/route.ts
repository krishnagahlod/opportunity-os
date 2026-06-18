import { NextResponse, type NextRequest } from "next/server";
import { requireCronAuth } from "@/lib/auth/cron";
import { verifyActiveLinks } from "@/lib/ingestion/link-checker";
import { markExpiredOpportunities } from "@/lib/notifications/digest";

export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds max

/**
 * Dedicated cleanup cron job.
 * Runs independently of the ingestion and daily-digest.
 * 
 * Flow:
 * 1. Mark expired based on hard deadlines (deadline passed)
 *    and rolling max-age limits (21 days for LinkedIn, 60 days for ATS).
 * 2. Sweep a large batch of the oldest un-verified URLs and send HEAD/GET requests
 *    to identify closed jobs (404s, "position filled" text, redirects).
 */
export async function GET(req: NextRequest) {
  const unauthorized = requireCronAuth(req);
  if (unauthorized) return unauthorized;

  try {
    // 1. Hard expiry
    const hardExpiry = await markExpiredOpportunities();

    // 2. Liveness check - do a batch of 50
    const livenessCheck = await verifyActiveLinks(50);

    return NextResponse.json({
      success: true,
      message: "Cleanup complete",
      details: {
        hardExpired: hardExpiry,
        livenessChecked: livenessCheck.checked,
        livenessExpired: livenessCheck.expired,
      }
    });
  } catch (error: any) {
    console.error("[cron/cleanup] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
