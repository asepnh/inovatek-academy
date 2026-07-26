"use server";

import { randomBytes } from "crypto";
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

/**
 * Creates a brand-new account directly (rather than requiring the person to
 * self-register at /signup) with a generated temporary password, which the
 * admin shares with them out-of-band (no email provider is wired up in this
 * app). The account is created with email_confirm: true so it's usable
 * immediately, and its role is set via user_metadata so the existing
 * handle_new_user() trigger creates the profile row with the right role in
 * one step.
 */
export async function createUserAccount(input: {
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
}) {
  await requireAdmin();

  const fullName = input.fullName.trim();
  const email = input.email.trim();
  const phone = input.phone.trim();

  if (!fullName || !email) {
    return { error: "Name and email are required." };
  }

  const tempPassword = randomBytes(9).toString("base64url"); // ~12 url-safe chars

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone, role: input.role },
  });

  revalidatePath("/admin/users");
  if (error) return { error: error.message };
  return { tempPassword };
}

/**
 * Generates a single-use signup link that pre-sets the signer-upper's role
 * (see migration 0009_invites.sql). The admin doesn't need to know the
 * mentor's email/details in advance -- just send them this URL and they
 * self-register normally at /signup, ending up with the given role instead
 * of the default 'parent'. Consumed and validated server-side in
 * src/actions/auth.ts's signUp().
 */
export async function createInvite(role: UserRole) {
  const { supabase, currentUserId } = await requireAdmin();
  const token = randomBytes(24).toString("base64url");

  const { error } = await supabase.from("invites").insert({ token, role, created_by: currentUserId });
  if (error) return { error: error.message };
  return { token };
}
