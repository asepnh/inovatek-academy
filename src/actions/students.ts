"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { GRADE_OPTIONS } from "@/lib/grades";
import { uploadStudentPhoto, deleteStudentPhoto } from "@/lib/student-photo";

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

  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const { path, error: photoError } = await uploadStudentPhoto(supabase, student!.id, photo);
    if (photoError) {
      revalidatePath("/parent");
      redirect(`/parent/students/${student!.id}?created=1&photoError=` + encodeURIComponent(photoError));
    }
    await supabase.from("students").update({ photo_path: path }).eq("id", student!.id);
  }

  revalidatePath("/parent");
  redirect(`/parent/students/${student!.id}?created=1`);
}

export async function updateStudentPhoto(studentId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("students")
    .select("photo_path")
    .eq("id", studentId)
    .single();

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    redirect(`/parent/students/${studentId}?error=` + encodeURIComponent("Please choose a photo."));
  }

  const { path, error: photoError } = await uploadStudentPhoto(supabase, studentId, photo as File);
  if (photoError) {
    redirect(`/parent/students/${studentId}?error=` + encodeURIComponent(photoError));
  }

  await supabase.from("students").update({ photo_path: path }).eq("id", studentId);

  if (existing?.photo_path) {
    await deleteStudentPhoto(supabase, existing.photo_path);
  }

  revalidatePath(`/parent/students/${studentId}`);
  redirect(`/parent/students/${studentId}?photoUpdated=1`);
}

export async function setFeeWaived(studentId: string, waived: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  await supabase.from("students").update({ fee_waived: waived }).eq("id", studentId);
  revalidatePath(`/admin/students/${studentId}`);
}
