import { NextRequest, NextResponse } from "next/server";
import { generateMonthlyInvoices } from "@/lib/invoices";

/**
 * Call monthly (e.g. via Vercel Cron or any external scheduler) to create
 * this month's payment rows for every active enrollment and flag overdue
 * ones. Protected by CRON_SECRET so only your scheduler can trigger it.
 *
 * Example Vercel Cron entry (vercel.json):
 *   { "crons": [{ "path": "/api/cron/generate-invoices?secret=YOUR_SECRET", "schedule": "0 1 1 * *" }] }
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  try {
    const result = await generateMonthlyInvoices(month, year);
    return NextResponse.json({ ok: true, month, year, ...result });
  } catch (err) {
    console.error("generate-invoices failed", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
