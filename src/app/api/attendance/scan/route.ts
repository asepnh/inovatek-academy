import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  const qrToken = body?.qr_token as string | undefined;
  const courseId = body?.course_id as string | undefined;
  if (!qrToken || !courseId) {
    return NextResponse.json({ message: "Missing QR token or course." }, { status: 400 });
  }

  // RLS restricts this select to students enrolled in a course this mentor
  // owns, so an unrelated student's QR simply won't resolve.
  const { data: student } = await supabase
    .from("students")
    .select("id, full_name")
    .eq("qr_token", qrToken)
    .maybeSingle();

  if (!student) {
    return NextResponse.json({ message: "QR code not recognized for your courses." }, { status: 404 });
  }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, status")
    .eq("student_id", student.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (!enrollment || enrollment.status !== "active") {
    return NextResponse.json(
      { message: "Student is not actively enrolled in this course.", studentName: student.full_name },
      { status: 409 }
    );
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: existing } = await supabase
    .from("attendance")
    .select("id")
    .eq("student_id", student.id)
    .eq("course_id", courseId)
    .gte("scanned_at", startOfDay.toISOString())
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      message: "Already marked present today.",
      studentName: student.full_name,
    });
  }

  const { error } = await supabase.from("attendance").insert({
    student_id: student.id,
    course_id: courseId,
    mentor_id: user.id,
    status: "present",
  });

  if (error) {
    return NextResponse.json({ message: error.message, studentName: student.full_name }, { status: 500 });
  }

  return NextResponse.json({ message: "Attendance recorded.", studentName: student.full_name });
}
