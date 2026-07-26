"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

function roleHome(role: UserRole) {
  if (role === "admin") return "/admin";
  if (role === "mentor") return "/mentor";
  return "/parent";
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const inviteToken = String(formData.get("invite") ?? "").trim();

  if (!email || !password || !fullName) {
    redirect("/signup?error=" + encodeURIComponent("Please fill in all required fields.") + inviteQuery(inviteToken));
  }
  if (password.length < 8) {
    redirect("/signup?error=" + encodeURIComponent("Password must be at least 8 characters.") + inviteQuery(inviteToken));
  }

  let role: UserRole = "parent";
  let invite: { id: string; role: UserRole } | null = null;

  if (inviteToken) {
    const adminClient = createAdminClient();
    const { data: invitedRow } = await adminClient
      .from("invites")
      .select("id, role, used_at, expires_at")
      .eq("token", inviteToken)
      .maybeSingle();

    if (!invitedRow || invitedRow.used_at || new Date(invitedRow.expires_at) < new Date()) {
      redirect("/signup?error=" + encodeURIComponent("This invite link is invalid or has expired."));
    }

    invite = { id: invitedRow.id, role: invitedRow.role };
    role = invitedRow.role;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone, role },
    },
  });

  if (error) {
    redirect("/signup?error=" + encodeURIComponent(error.message) + inviteQuery(inviteToken));
  }

  if (invite && data.user) {
    const adminClient = createAdminClient();
    await adminClient
      .from("invites")
      .update({ used_by: data.user.id, used_at: new Date().toISOString() })
      .eq("id", invite.id);
  }

  if (!data.session) {
    redirect(
      "/login?message=" +
        encodeURIComponent("Account created! Check your email to confirm before signing in.")
    );
  }

  redirect(role === "mentor" ? "/mentor" : role === "admin" ? "/admin" : "/parent");
}

function inviteQuery(token: string) {
  return token ? "&invite=" + encodeURIComponent(token) : "";
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirect("/login?error=" + encodeURIComponent(error?.message ?? "Invalid credentials."));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = (profile?.role as UserRole) ?? "parent";
  redirect(next && next.startsWith("/") ? next : roleHome(role));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
