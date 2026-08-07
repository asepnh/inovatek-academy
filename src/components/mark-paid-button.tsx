"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markPaymentPaid } from "@/actions/payments";

export function MarkPaidButton({ paymentId, studentName }: { paymentId: string; studentName: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!confirm(`Mark ${studentName}'s payment as paid? Use this for fees collected offline (cash, bank transfer, etc).`)) {
      return;
    }
    startTransition(async () => {
      const result = await markPaymentPaid(paymentId);
      if (result?.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button type="button" onClick={handleClick} disabled={pending} className="btn-secondary text-xs">
      {pending ? "Saving…" : "Mark as paid"}
    </button>
  );
}
