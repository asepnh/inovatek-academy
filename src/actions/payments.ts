"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createBill } from "@/lib/billplz";
import { monthName } from "@/lib/format";

/**
 * Parent clicks "Pay Now" on a pending/overdue payment. Creates (or reuses)
 * a Billplz bill and redirects the browser to Billplz's hosted FPX payment
 * page.
 */
export async function payNow(paymentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: payment, error } = await supabase
    .from("payments")
    .select("id, amount_cents, status, billplz_url, period_month, period_year, students(full_name, parent_id), courses(name)")
    .eq("id", paymentId)
    .single();

  if (error || !payment) redirect("/parent/payments?error=" + encodeURIComponent("Payment not found."));

  const student = Array.isArray(payment!.students) ? payment!.students[0] : payment!.students;
  const course = Array.isArray(payment!.courses) ? payment!.courses[0] : payment!.courses;

  if (!student || student.parent_id !== user!.id) {
    redirect("/parent/payments?error=" + encodeURIComponent("Not authorized."));
  }

  if (payment!.status === "paid") {
    redirect("/parent/payments?info=" + encodeURIComponent("This payment is already settled."));
  }

  // Reuse the existing Billplz bill if one was already created for this
  // payment, instead of creating a duplicate bill on every click.
  if (payment!.billplz_url) {
    redirect(payment!.billplz_url);
  }

  const { data: parentProfile } = await supabase
    .from("profiles")
    .select("full_name, email, phone")
    .eq("id", user!.id)
    .single();

  const bill = await createBill({
    amountCents: payment!.amount_cents,
    name: parentProfile?.full_name || student.full_name,
    email: parentProfile?.email || user!.email!,
    mobile: parentProfile?.phone ?? undefined,
    description: `${student.full_name} - ${course?.name ?? "Class"} - ${monthName(payment!.period_month)} ${payment!.period_year}`,
    referenceId: payment!.id,
  });

  await supabase
    .from("payments")
    .update({ billplz_bill_id: bill.id, billplz_url: bill.url })
    .eq("id", payment!.id);

  redirect(bill.url);
}
