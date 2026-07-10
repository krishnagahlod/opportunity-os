import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60; 

export async function GET(req: NextRequest) {
  const start = Date.now();
  
  // 1. Wake up Neon Database by running a simple query
  const supabase = createAdminClient();
  try {
    console.log("[wake-n8n] Waking up Neon Database...");
    // A simple query to wake up the Neon compute endpoint
    const { data, error } = await supabase.from("profiles").select("id").limit(1);
    if (error) {
      console.error("[wake-n8n] Database wake up failed:", error);
    } else {
      console.log(`[wake-n8n] Database awake. Took ${Date.now() - start}ms`);
    }
  } catch (e) {
    console.error("[wake-n8n] Database query threw error:", e);
  }

  // 2. Wait 3 seconds to ensure Neon's compute proxy is fully ready
  // before n8n attempts to connect its task runner.
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 3. Ping n8n to wake up the Render container
  // Now that the DB is already awake, n8n will successfully boot up without timing out!
  let n8nStatus = "unknown";
  try {
    console.log("[wake-n8n] Pinging n8n...");
    // We catch the error because if n8n is cold starting, it might take 40 seconds 
    // to respond, which could exceed this Vercel function's timeout. 
    // Simply initiating the request is enough to wake up Render.
    const res = await fetch("https://n8n-latest-ylum.onrender.com/healthz", {
      method: "GET",
      signal: AbortSignal.timeout(15000) 
    }).catch(e => {
        console.log("[wake-n8n] n8n ping triggered (may be cold starting)");
        return null;
    });
    
    n8nStatus = res ? res.status.toString() : "timeout/triggered";
  } catch (e) {
    n8nStatus = "fetch_error";
  }

  return NextResponse.json({
    ok: true,
    message: "Wake up sequence completed",
    databaseTimeMs: Date.now() - start,
    n8nStatus
  });
}
