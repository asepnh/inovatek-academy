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

export async function createClass(formData: FormData) {
  const supabase = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const gradeLevel = String(formData.get("grade_level") ?? "All levels").trim();
  const schedule = String(formData.get("schedule") ?? "").trim();
  const monthlyFeeRM = parseFloat(String(formData.get("monthly_fee") ?? "0"));
  const mentorId = String(formData.get("mentor_id") ?? "") || null;

  if (!name || Number.isNaN(monthlyFeeRM) || monthlyFeeRM < 0) {
    redirect("/admin/classes/new?error=" + encodeURIComponent("Please fill in a valid name and fee."));
  }

  const { error } = await supabase.from("classes").insert({
    name,
    description,
    grade_level: gradeLevel || "All levels",
    schedule,
    monthly_fee_cents: Math.round(monthlyFeeRM * 100),
    mentor_id: mentorId,
  });

  if (error) {
    redirect("/admin/classes/new?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/admin/classes");
  redirect("/admin/classes?created=1");
}

export async function updateClass(classId: string, formData: FormData) {
  const supabase = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const gradeLevel = String(formData.get("grade_level") ?? "All levels").trim();
  const schedule = String(formData.get("schedule") ?? "").trim();
  const monthlyFeeRM = parseFloat(String(formData.get("monthly_fee") ?? "0"));
  const mentorId = String(formData.get("mentor_id") ?? "") || null;
  const isActive = formData.get("is_active") === "on";

  const { error } = await supabase
    .from("classes")
    .update({
      name,
      description,
      grade_level: gradeLevel || "All levels",
      schedule,
      monthly_fee_cents: Math.round(monthlyFeeRM * 100),
      mentor_id: mentorId,
      is_active: isActive,
    })
    .eq("id", classId);

  if (error) {
    redirect(`/admin/classes/${classId}/edit?error=` + encodeURIComponent(error.message));
  }

  revalidatePath("/admin/classes");
  redirect("/admin/classes?updated=1");
}
