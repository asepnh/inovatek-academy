"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function enrollStudent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const studentId = String(formData.get("student_id") ?? "");
  const classId = String(formData.get("class_id") ?? "");

  if (!studentId || !classId) {
    redirect("/parent/classes?error=" + encodeURIComponent("Choose a student and a class."));
  }

  // RLS ensures this student actually belongs to the signed-in parent.
  const { error } = await supabase
    .from("enrollments")
    .insert({ student_id: studentId, class_id: classId, status: "pending" });

  if (error) {
    const message = error.code === "23505" ? "Already enrolled in this class." : error.message;
    redirect("/parent/classes?error=" + encodeURIComponent(message));
  }

  revalidatePath("/parent");
  redirect("/parent/classes?enrolled=1");
}

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (profile?.role !== "admin") redirect("/");
  return supabase;
}

export async function setEnrollmentStatus(enrollmentId: string, status: "active" | "cancelled" | "pending") {
  const supabase = await requireStaff();
  await supabase.from("enrollments").update({ status }).eq("id", enrollmentId);
  revalidatePath("/admin/enrollments");
}

/**
 * Admin bulk-enrolls a set of students into one class, e.g. for students a
 * parent registered but never got around to registering for a class
 * themselves. Skips (rather than errors on) any student already enrolled in
 * that class -- safe to select an already-enrolled student by mistake, or
 * to run twice. Goes straight to 'active', not 'pending', since an admin
 * doing this deliberately doesn't need to also approve their own action.
 */
export async function bulkEnrollStudents(studentIds: string[], classId: string) {
  const supabase = await requireStaff();
  if (studentIds.length === 0 || !classId) return { error: "Choose at least one student and a class." };

  const { data, error } = await supabase
    .from("enrollments")
    .upsert(
      studentIds.map((studentId) => ({ student_id: studentId, class_id: classId, status: "active" })),
      { onConflict: "student_id,class_id", ignoreDuplicates: true }
    )
    .select("id");

  if (error) return { error: error.message };

  revalidatePath("/admin/students");
  revalidatePath("/admin/enrollments");
  return { enrolled: data?.length ?? 0 };
}
