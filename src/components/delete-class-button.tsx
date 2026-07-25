"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteClass } from "@/actions/classes";

export function DeleteClassButton({ classId, className }: { classId: string; className: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (
      !confirm(
        "Delete this class? This also removes its enrollments, payments, and attendance records. This cannot be undone."
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteClass(classId);
      if (result?.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button type="button" onClick={handleDelete} disabled={pending} className={className}>
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
