"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setFeeWaived } from "@/actions/students";

export function FeeWaivedToggle({ studentId, initialWaived }: { studentId: string; initialWaived: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    startTransition(async () => {
      await setFeeWaived(studentId, !initialWaived);
      router.refresh();
    });
  }

  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" checked={initialWaived} disabled={pending} onChange={toggle} />
      Fee waived (skips this student in monthly billing)
    </label>
  );
}
