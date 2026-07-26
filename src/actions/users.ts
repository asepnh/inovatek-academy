"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (profile?.role !== "admin") redirect("/");
  return { supabase, currentUserId: user!.id };
}

/**
 * Promotes an existing account (they must sign up normally first) to Mentor
 * or Admin. Keeping self-signup limited to Parent accounts and requiring an
 * admin to grant staff roles avoids anyone being able to grant themselves
 * elevated access.
 */
export async function setUserRole(userId: string, role: UserRole) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/admin/users");
  if (error) return { error: error.message };
  return {};
}

/**
 * Deletes an account entirely via the Supabase Admin API. This removes the
 * auth.users row, which cascades to profiles (on delete cascade), and for a
 * parent, further cascades to their students -> enrollments/payments/
 * attendance (also on delete cascade, see migration 0001_init.sql). Deleting
 * a mentor is non-destructive elsewhere: classes.mentor_id is set null, not
 * cascaded.
 */
export async function deleteUser(userId: string) {
  const { currentUserId } = await requireAdmin();
  if (userId === currentUserId) {
    return { error: "You can't delete your own account." };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  revalidatePath("/admin/users");
  if (error) return { error: error.message };
  return {};
}
