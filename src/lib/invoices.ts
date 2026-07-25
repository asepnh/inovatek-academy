import { createAdminClient } from "@/lib/supabase/server";
import { monthName } from "@/lib/format";

/**
 * Monthly billing job. Intended to run once a month (e.g. on the 1st) via a
 * scheduled call to /api/cron/generate-invoices. Uses the service-role
 * client because it needs to write payments/notifications for every parent,
 * not just the caller.
 *
 * Steps:
 *  1. For every active enrollment, ensure a payment row exists for the
 *     given month/year (skips ones that already exist).
 *  2. Mark any still-`pending` payment whose due_date has passed as
 *     `overdue`, and create an in-app notification for the parent.
 */
export async function generateMonthlyInvoices(month: number, year: number) {
  const supabase = createAdminClient();

  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("enrollments")
    .select("id, student_id, course_id, courses(monthly_fee_cents, name)")
    .eq("status", "active");

  if (enrollmentsError) throw enrollmentsError;

  const dueDate = new Date(Date.UTC(year, month - 1, 7)); // due on the 7th
  const dueDateStr = dueDate.toISOString().slice(0, 10);

  let created = 0;
  for (const e of enrollments ?? []) {
    const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
    if (!course) continue;

    const { error: insertError, data } = await supabase
      .from("payments")
      .upsert(
        {
          enrollment_id: e.id,
          student_id: e.student_id,
          course_id: e.course_id,
          period_month: month,
          period_year: year,
          amount_cents: course.monthly_fee_cents,
          status: "pending",
          due_date: dueDateStr,
        },
        { onConflict: "enrollment_id,period_month,period_year", ignoreDuplicates: true }
      )
      .select("id");

    if (insertError) throw insertError;
    if (data && data.length > 0) created += 1;
  }

  const overdueResult = await markOverdueAndNotify();

  return { invoicesCreated: created, ...overdueResult };
}

export async function markOverdueAndNotify() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: overdue, error } = await supabase
    .from("payments")
    .select("id, student_id, amount_cents, period_month, period_year, students(full_name, parent_id), courses(name)")
    .eq("status", "pending")
    .lt("due_date", today);

  if (error) throw error;

  let flagged = 0;
  for (const p of overdue ?? []) {
    const student = Array.isArray(p.students) ? p.students[0] : p.students;
    const course = Array.isArray(p.courses) ? p.courses[0] : p.courses;
    if (!student) continue;

    await supabase.from("payments").update({ status: "overdue" }).eq("id", p.id);

    await supabase.from("notifications").insert({
      parent_id: student.parent_id,
      title: "Payment overdue",
      message: `${student.full_name}'s ${monthName(p.period_month)} ${p.period_year} fee for ${course?.name ?? "a class"} (RM ${(p.amount_cents / 100).toFixed(2)}) is overdue. Please make payment as soon as possible.`,
      type: "payment_overdue",
    });

    flagged += 1;
  }

  return { overdueFlagged: flagged };
}
