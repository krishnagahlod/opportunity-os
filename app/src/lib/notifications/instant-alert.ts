import "server-only";
import { createClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram/send";
import type { Opportunity } from "@/types/db";

export async function processInstantAlerts(opportunityId: string) {
  const supabase = await createClient();
  
  // Fetch the newly ingested opportunity
  const { data: opp, error: oppErr } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", opportunityId)
    .single();
    
  if (oppErr || !opp) {
    console.error(`Error fetching opportunity ${opportunityId} for alerts`, oppErr);
    return;
  }

  // Fetch all active target alerts joined with profile for telegram_chat_id and subscription
  const { data: alerts, error: alertsErr } = await supabase
    .from("target_alerts")
    .select(`
      *,
      profiles!inner(telegram_chat_id),
      subscriptions!inner(plan, status)
    `)
    .eq("is_active", true)
    .in("subscriptions.status", ["active", "trialing"])
    .in("subscriptions.plan", ["pro", "campus"]);

  if (alertsErr || !alerts) {
    console.error("Error fetching target alerts:", alertsErr);
    return;
  }

  for (const alert of alerts) {
    const chatId = (alert.profiles as any).telegram_chat_id;
    if (!chatId) continue;

    const matchesCompany = alert.target_companies?.length > 0 
      ? alert.target_companies.some((c: string) => opp.organization.toLowerCase().includes(c.toLowerCase()))
      : true;

    const matchesRole = alert.target_roles?.length > 0
      ? alert.target_roles.some((r: string) => opp.title.toLowerCase().includes(r.toLowerCase()))
      : true;

    const compensationMatch = alert.min_compensation
      ? (extractMaxNumber(opp.compensation) >= alert.min_compensation)
      : true;

    if (matchesCompany && matchesRole && compensationMatch) {
      // Send alert
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const link = opp.apply_url || `${appUrl}/opportunity/${opp.id}`;
      
      const html = [
        `🚨 <b>Target Alert Triggered</b> 🚨`,
        ``,
        `<b>${escapeHtml(opp.title)}</b> at <b>${escapeHtml(opp.organization)}</b>`,
        `📍 ${escapeHtml(opp.location || "Remote")}`,
        opp.compensation ? `💰 ${escapeHtml(opp.compensation)}` : null,
        ``,
        `<a href="${escapeAttr(link)}">Apply Now</a>`
      ].filter(Boolean).join("\n");

      await sendTelegramMessage(chatId, html);
    }
  }
}

function extractMaxNumber(str: string | null): number {
  if (!str) return 0;
  const numbers = str.match(/[\d,]+/g)?.map((s) => Number(s.replace(/,/g, ""))) ?? [];
  return numbers.length > 0 ? Math.max(...numbers) : 0;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, "&quot;");
}
