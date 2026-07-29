"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteStudent } from "@/actions/students";

export function DeleteStudentButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (
      !confirm(
        `Delete ${studentName}? This also removes their enrollments, payments, and attendance records. This cannot be undone.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteStudent(studentId);
      if (result?.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
