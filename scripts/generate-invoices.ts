/**
 * Standalone CLI entry point for the monthly invoice job, for setups that
 * use a plain server cron / GitHub Actions schedule instead of Vercel Cron.
 *
 * Usage:
 *   npx tsx scripts/generate-invoices.ts
 *
 * Requires the same env vars as the app (NEXT_PUBLIC_SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY) to be set in the environment running this.
 */
import { generateMonthlyInvoices } from "../src/lib/invoices";

async function main() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const result = await generateMonthlyInvoices(month, year);
  console.log(`Invoices generated for ${month}/${year}:`, result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
