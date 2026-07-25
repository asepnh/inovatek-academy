import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getBill, verifyXSignature } from "@/lib/billplz";

/**
 * Billplz posts application/x-www-form-urlencoded data here after a payment
 * attempt. We do NOT trust the posted fields directly (docs on the exact
 * X-Signature format are incomplete) — instead we take the posted bill `id`
 * and re-fetch it from Billplz's API using our secret key, which is the
 * authoritative source of truth. verifyXSignature() is still checked as a
 * best-effort sanity gate and logged if it disagrees, but never used to
 * *deny* a real Billplz-confirmed payment.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const payload: Record<string, string> = {};
  form.forEach((value, key) => {
    payload[key] = String(value);
  });

  const billId = payload["id"];
  if (!billId) {
    return NextResponse.json({ error: "missing bill id" }, { status: 400 });
  }

  const signatureOk = verifyXSignature(payload);
  if (!signatureOk) {
    console.warn("Billplz callback: X-Signature did not match for bill", billId, "- reconciling via API anyway.");
  }

  let bill;
  try {
    bill = await getBill(billId);
  } catch (err) {
    console.error("Billplz callback: failed to fetch bill from Billplz", err);
    return NextResponse.json({ error: "failed to reconcile bill" }, { status: 502 });
  }

  const paymentId = bill.reference_1;
  if (!paymentId) {
    return NextResponse.json({ error: "bill missing reference_1 (payment id)" }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (bill.state === "paid" || bill.paid) {
    await supabase
      .from("payments")
      .update({ status: "paid", paid_at: bill.paid_at ?? new Date().toISOString(), billplz_bill_id: bill.id })
      .eq("id", paymentId)
      .neq("status", "paid");
  }
  // Billplz bills don't get "un-paid"; a failed/abandoned attempt just
  // leaves the bill in `due` state and the payment stays pending/overdue as
  // determined by the monthly invoice job.

  return NextResponse.json({ ok: true });
}
