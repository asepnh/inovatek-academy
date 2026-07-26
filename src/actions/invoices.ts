"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateMonthlyInvoices } from "@/lib/invoices";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (profile?.role !== "admin") redirect("/");
}

/**
 * Lets an admin manually re-run this month's invoice generation on demand
 * (e.g. to catch a student enrolled/approved after the 1st, since the
 * automatic cron only runs once, on the 1st). Safe to run repeatedly: the
 * underlying upsert only fills in payment rows that don't already exist.
 */
export async function runInvoiceGenerationNow() {
  await requireAdmin();

  const now = new Date();
  try {
    const result = await generateMonthlyInvoices(now.getMonth() + 1, now.getFullYear());
    return { ok: true as const, ...result };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
