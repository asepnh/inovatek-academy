"use client";

import { useState, useTransition } from "react";
import { runInvoiceGenerationNow } from "@/actions/invoices";

type Result = Awaited<ReturnType<typeof runInvoiceGenerationNow>>;

export function RunInvoicesButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);

  function run() {
    setResult(null);
    startTransition(async () => {
      const r = await runInvoiceGenerationNow();
      setResult(r);
    });
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={run} disabled={pending} className="btn">
        {pending ? "Running…" : "Run invoicing now"}
      </button>

      {result && result.ok && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          {result.skipped ? (
            <>This month is marked as a billing holiday — no new invoices were created.</>
          ) : (
            <>Created {result.invoicesCreated} new payment{result.invoicesCreated === 1 ? "" : "s"}.</>
          )}
          {" "}Flagged {result.overdueFlagged} payment{result.overdueFlagged === 1 ? "" : "s"} as overdue.
        </div>
      )}
      {result && !result.ok && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{result.error}</div>
      )}
    </div>
  );
}
