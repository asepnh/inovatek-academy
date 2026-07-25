import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return supabase;
}

export async function GET(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const classId = req.nextUrl.searchParams.get("class_id");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  if (!classId || !from || !to) {
    return NextResponse.json({ message: "Missing class_id, from, or to." }, { status: 400 });
  }

  const { data: attendance, error } = await supabase
    .from("attendance")
    .select("scanned_at, status, students(full_name, grade), classes(name)")
    .eq("class_id", classId)
    .gte("scanned_at", `${from}T00:00:00.000Z`)
    .lte("scanned_at", `${to}T23:59:59.999Z`)
    .order("scanned_at", { ascending: true });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Attendance");
  sheet.columns = [
    { header: "Student", key: "student", width: 28 },
    { header: "Grade", key: "grade", width: 14 },
    { header: "Class", key: "class", width: 24 },
    { header: "Status", key: "status", width: 12 },
    { header: "Date", key: "date", width: 14 },
    { header: "Time", key: "time", width: 12 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const a of attendance ?? []) {
    const student = Array.isArray(a.students) ? a.students[0] : a.students;
    const course = Array.isArray(a.classes) ? a.classes[0] : a.classes;
    const scannedAt = new Date(a.scanned_at);
    sheet.addRow({
      student: student?.full_name ?? "",
      grade: student?.grade ?? "",
      class: course?.name ?? "",
      status: a.status,
      date: scannedAt.toISOString().slice(0, 10),
      time: scannedAt.toISOString().slice(11, 16),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="attendance_${from}_to_${to}.xlsx"`,
    },
  });
}
