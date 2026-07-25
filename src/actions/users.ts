"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (profile?.role !== "admin") redirect("/");
  return supabase;
}

/**
 * Promotes an existing account (they must sign up normally first) to Mentor
 * or Admin. Keeping self-signup limited to Parent accounts and requiring an
 * admin to grant staff roles avoids anyone being able to grant themselves
 * elevated access.
 */
export async function setUserRole(userId: string, role: UserRole) {
  const supabase = await requireAdmin();
  await supabase.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/admin/users");
}
