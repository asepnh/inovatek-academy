"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteUser } from "@/actions/users";

export function DeleteUserButton({ userId, role, className }: { userId: string; role: string; className: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    const warning =
      role === "parent"
        ? "Delete this account? This also permanently deletes all their students, enrollments, payments, and attendance records. This cannot be undone."
        : "Delete this account? This cannot be undone.";
    if (!confirm(warning)) return;

    startTransition(async () => {
      const result = await deleteUser(userId);
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
