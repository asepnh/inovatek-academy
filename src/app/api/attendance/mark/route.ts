import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Roster-based attendance: "present" means a row exists for the student in
 * today's window; "absent" (the default) means no row exists. Marking a
 * student Present inserts a row; marking them Absent deletes it, rather than
 * storing an explicit "absent" status.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "mentor" && profile?.role !== "admin") {
    return NextResponse.json({ message: "Only mentors can record attendance." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const studentId = body?.student_id as string | undefined;
  const classId = body?.class_id as string | undefined;
  const present = body?.present as boolean | undefined;
  if (!studentId || !classId || typeof present !== "boolean") {
    return NextResponse.json({ message: "Missing student, class, or status." }, { status: 400 });
  }

  // RLS restricts this to enrollments in a class this mentor owns.
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, status")
    .eq("student_id", studentId)
    .eq("class_id", classId)
    .maybeSingle();

  if (!enrollment || enrollment.status !== "active") {
    return NextResponse.json(
      { message: "Student is not actively enrolled in this class." },
      { status: 409 }
    );
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  if (present) {
    const { data: existing } = await supabase
      .from("attendance")
      .select("id")
      .eq("student_id", studentId)
      .eq("class_id", classId)
      .gte("scanned_at", startOfDay.toISOString())
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from("attendance").insert({
        student_id: studentId,
        class_id: classId,
        mentor_id: user.id,
        status: "present",
      });
      if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    }
  } else {
    // Requires the "attendance: mentor delete own class" RLS policy from
    // migration 0002/0003 — run those migrations if this starts failing silently.
    const { error } = await supabase
      .from("attendance")
      .delete()
      .eq("student_id", studentId)
      .eq("class_id", classId)
      .gte("scanned_at", startOfDay.toISOString());
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, present });
}
