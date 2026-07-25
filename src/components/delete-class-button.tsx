"use client";

import { deleteClass } from "@/actions/classes";

export function DeleteClassButton({ classId, className }: { classId: string; className: string }) {
  return (
    <form
      action={deleteClass}
      onSubmit={(e) => {
        if (
          !confirm(
            "Delete this class? This also removes its enrollments, payments, and attendance records. This cannot be undone."
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={classId} />
      <button type="submit" className={className}>
        Delete
      </button>
    </form>
  );
}
