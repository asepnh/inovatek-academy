import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getBill, parseBillplzQuery } from "@/lib/billplz";

/**
 * Billplz sends the payer's browser back here after they finish (or
 * abandon) the payment page. We reconcile with Billplz's API the same way
 * the webhook does, then bounce the parent to their payments page with a
 * friendly status flag. This is a convenience UX path only — the webhook
 * above is what durably marks a payment as paid even if the browser never
 * makes it back here.
 */
export async function GET(req: NextRequest) {
  const params = parseBillplzQuery(req.nextUrl.searchParams);
  const billId = params["id"];
  const site = process.env.NEXT_PUBLIC_SITE_URL!;

  if (!billId) {
    return NextResponse.redirect(`${site}/parent/payments`);
  }

  try {
    const bill = await getBill(billId);
    const paymentId = bill.reference_1;
    if (paymentId && (bill.state === "paid" || bill.paid)) {
      const supabase = createAdminClient();
      await supabase
        .from("payments")
        .update({ status: "paid", paid_at: bill.paid_at ?? new Date().toISOString(), billplz_bill_id: bill.id })
        .eq("id", paymentId)
        .neq("status", "paid");
    }
    const flag = bill.state === "paid" || bill.paid ? "paid" : "unpaid";
    return NextResponse.redirect(`${site}/parent/payments?result=${flag}`);
  } catch (err) {
    console.error("Billplz redirect reconciliation failed", err);
    return NextResponse.redirect(`${site}/parent/payments?result=unknown`);
  }
}
