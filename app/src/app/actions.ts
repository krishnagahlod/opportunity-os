"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleSaved(opportunityId: string, isSaved: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  if (isSaved) {
    await supabase
      .from("saved_opportunities")
      .delete()
      .eq("user_id", user.id)
      .eq("opportunity_id", opportunityId);
  } else {
    await supabase.from("saved_opportunities").insert({
      user_id: user.id,
      opportunity_id: opportunityId,
    });
  }

  revalidatePath("/");
  revalidatePath("/saved");
  return { ok: true };
}

export async function markApplied(opportunityId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  await supabase.from("applications").upsert(
    {
      user_id: user.id,
      opportunity_id: opportunityId,
      status: "applied",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,opportunity_id" },
  );

  revalidatePath("/");
  revalidatePath("/applications");
  return { ok: true };
}

export async function updateApplicationStatus(
  opportunityId: string,
  status: "saved" | "applied" | "interviewing" | "rejected" | "won",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  await supabase.from("applications").upsert(
    {
      user_id: user.id,
      opportunity_id: opportunityId,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,opportunity_id" },
  );

  revalidatePath("/applications");
  return { ok: true };
}
