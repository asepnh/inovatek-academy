"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { GRADE_OPTIONS } from "@/lib/grades";

export async function createStudent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const studentName = String(formData.get("student_name") ?? "").trim();
  const parentName = String(formData.get("parent_name") ?? "").trim();
  const parentEmail = String(formData.get("parent_email") ?? "").trim();
  const parentPhone = String(formData.get("parent_phone") ?? "").trim();
  const grade = String(formData.get("grade") ?? "").trim();

  if (!studentName || !parentName || !parentEmail || !parentPhone || !grade) {
    redirect("/parent/students/new?error=" + encodeURIComponent("Please fill in all fields."));
  }
  if (!(GRADE_OPTIONS as readonly string[]).includes(grade)) {
    redirect("/parent/students/new?error=" + encodeURIComponent("Please choose a valid grade."));
  }

  // Keep the parent's own profile contact details in sync with what was
  // entered on the enrollment form.
  await supabase
    .from("profiles")
    .update({ full_name: parentName, phone: parentPhone })
    .eq("id", user!.id);

  const { data: student, error } = await supabase
    .from("students")
    .insert({ parent_id: user!.id, full_name: studentName, grade })
    .select("id")
    .single();

  if (error) {
    redirect("/parent/students/new?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/parent");
  redirect(`/parent/students/${student!.id}?created=1`);
}
