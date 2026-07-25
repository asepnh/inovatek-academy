import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { formatMYR, monthName } from "@/lib/format";

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

  const month = parseInt(req.nextUrl.searchParams.get("month") ?? "", 10);
  const year = parseInt(req.nextUrl.searchParams.get("year") ?? "", 10);
  if (!month || !year) {
    return NextResponse.json({ message: "Missing month or year." }, { status: 400 });
  }

  const { data: payments, error } = await supabase
    .from("payments")
    .select(
      "status, amount_cents, due_date, paid_at, students(full_name, grade), classes(name)"
    )
    .eq("period_month", month)
    .eq("period_year", year)
    .order("due_date", { ascending: true });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Payments");
  sheet.columns = [
    { header: "Student", key: "student", width: 28 },
    { header: "Grade", key: "grade", width: 14 },
    { header: "Class", key: "class", width: 24 },
    { header: "Amount", key: "amount", width: 14 },
    { header: "Status", key: "status", width: 12 },
    { header: "Due date", key: "due", width: 14 },
    { header: "Paid at", key: "paid", width: 18 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const p of payments ?? []) {
    const student = Array.isArray(p.students) ? p.students[0] : p.students;
    const course = Array.isArray(p.classes) ? p.classes[0] : p.classes;
    sheet.addRow({
      student: student?.full_name ?? "",
      grade: student?.grade ?? "",
      class: course?.name ?? "",
      amount: formatMYR(p.amount_cents),
      status: p.status,
      due: p.due_date,
      paid: p.paid_at ? new Date(p.paid_at).toISOString().slice(0, 16).replace("T", " ") : "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="payments_${monthName(month)}_${year}.xlsx"`,
    },
  });
}
