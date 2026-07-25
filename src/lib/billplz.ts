import crypto from "crypto";

const BASE_URL =
  process.env.BILLPLZ_ENV === "production"
    ? "https://www.billplz.com/api/v3"
    : "https://www.billplz-sandbox.com/api/v3";

function authHeader() {
  const apiKey = process.env.BILLPLZ_API_KEY!;
  return "Basic " + Buffer.from(`${apiKey}:`).toString("base64");
}

export interface BillplzBill {
  id: string;
  collection_id: string;
  paid: boolean;
  state: "due" | "paid" | "deleted";
  amount: number;
  paid_amount: string;
  due_at: string | null;
  email: string;
  mobile: string | null;
  name: string;
  url: string;
  reference_1_label?: string;
  reference_1?: string;
  paid_at?: string | null;
  [key: string]: unknown;
}

/**
 * Creates a Billplz bill restricted to a single recipient/amount. FPX is one
 * of the payment methods Billplz's hosted bill page offers by default;
 * customers pick their bank on that page. (To force-skip straight to a
 * specific bank's FPX page you can pass a bank code via reference_1 + the
 * Direct Payment Gateway feature — see Billplz's docs — but the default
 * hosted page already limits Malaysian payers to FPX/cards per your
 * collection's enabled payment channels, configurable in the Billplz
 * dashboard under the collection's settings.)
 */
export async function createBill(params: {
  amountCents: number;
  name: string;
  email: string;
  mobile?: string | null;
  description: string;
  referenceId: string;
  dueDate?: string; // YYYY-MM-DD
}): Promise<BillplzBill> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  const body = new URLSearchParams({
    collection_id: process.env.BILLPLZ_COLLECTION_ID!,
    email: params.email,
    name: params.name,
    amount: String(params.amountCents),
    description: params.description.slice(0, 200),
    callback_url: `${siteUrl}/api/billplz/callback`,
    redirect_url: `${siteUrl}/api/billplz/redirect`,
    reference_1_label: "Payment ID",
    reference_1: params.referenceId,
  });
  if (params.mobile) body.set("mobile", params.mobile);
  if (params.dueDate) body.set("due_at", params.dueDate);

  const res = await fetch(`${BASE_URL}/bills`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: authHeader(),
    },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Billplz create bill failed (${res.status}): ${text}`);
  }

  return res.json();
}

/**
 * Authoritative status check: fetches the bill directly from Billplz using
 * the secret API key. This is the source of truth used to mark a payment as
 * paid — it does not depend on trusting values posted to our webhook, so it
 * stays correct even if signature-format details ever drift from Billplz's
 * docs (see verifyXSignature below).
 */
export async function getBill(billId: string): Promise<BillplzBill> {
  const res = await fetch(`${BASE_URL}/bills/${billId}`, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Billplz get bill failed (${res.status}): ${text}`);
  }
  return res.json();
}

// Field order Billplz documents for building the X-Signature source string.
// Only fields actually present in the payload are included.
const SIGNATURE_FIELD_ORDER = [
  "collection_id", "paid_amount", "transaction_id", "transaction_status",
  "id", "due_at", "email", "mobile", "name", "amount", "description",
  "long_description", "paid_at", "state", "url", "reference_1_label",
  "reference_1", "reference_2_label", "reference_2", "redirect_url",
  "return_web", "callback_url", "deliver",
];

/**
 * Best-effort X-Signature check, used only as a fast preliminary filter
 * (e.g. to log suspicious requests). Because Billplz's public docs don't
 * fully spell out the exact source-string format, do NOT rely on this alone
 * to authorize marking a payment as paid — always reconcile with getBill()
 * (an authenticated call to Billplz) before mutating payment state. See the
 * callback route handler for how the two are combined.
 */
export function verifyXSignature(payload: Record<string, string>): boolean {
  const key = process.env.BILLPLZ_X_SIGNATURE_KEY;
  const signature = payload["x_signature"];
  if (!key || !signature) return false;

  const source = SIGNATURE_FIELD_ORDER.filter((k) => payload[k] !== undefined)
    .map((k) => `${k}${payload[k]}`)
    .join("|");

  const computed = crypto.createHmac("sha256", key).update(source).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  } catch {
    return false;
  }
}

/** Parses Billplz's bracketed redirect query params: billplz[id], billplz[paid], ... */
export function parseBillplzQuery(searchParams: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    const match = key.match(/^billplz\[(.+)]$/);
    if (match) out[match[1]] = value;
  }
  return out;
}
