"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

export async function addBillingHoliday(formData: FormData) {
  const supabase = await requireAdmin();

  const year = parseInt(String(formData.get("year") ?? ""), 10);
  const month = parseInt(String(formData.get("month") ?? ""), 10);
  const note = String(formData.get("note") ?? "").trim();

  if (!year || !month || month < 1 || month > 12) {
    redirect("/admin/settings?error=" + encodeURIComponent("Please choose a valid month and year."));
  }

  const { error } = await supabase.from("billing_holidays").insert({ year, month, note });

  if (error) {
    redirect(
      "/admin/settings?error=" +
        encodeURIComponent(error.code === "23505" ? "That month is already marked as a holiday." : error.message)
    );
  }

  revalidatePath("/admin/settings");
  redirect("/admin/settings?added=1");
}

export async function removeBillingHoliday(year: number, month: number) {
  const supabase = await requireAdmin();
  await supabase.from("billing_holidays").delete().eq("year", year).eq("month", month);
  revalidatePath("/admin/settings");
}
