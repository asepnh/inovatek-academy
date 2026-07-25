"use client";

import { useState, useTransition } from "react";

export function AttendanceToggle({
  studentId,
  classId,
  initialPresent,
}: {
  studentId: string;
  classId: string;
  initialPresent: boolean;
}) {
  const [present, setPresent] = useState(initialPresent);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function setStatus(next: boolean) {
    if (next === present) return;
    const previous = present;
    setPresent(next); // optimistic UI update
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/attendance/mark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_id: studentId, class_id: classId, present: next }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to update attendance.");
        }
      } catch (err) {
        setPresent(previous); // revert on failure
        setError(err instanceof Error ? err.message : "Failed to update attendance.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="inline-flex overflow-hidden rounded-lg border border-slate-300">
        <button
          type="button"
          onClick={() => setStatus(false)}
          disabled={pending}
          aria-pressed={!present}
          className={`px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
            !present ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Absent
        </button>
        <button
          type="button"
          onClick={() => setStatus(true)}
          disabled={pending}
          aria-pressed={present}
          className={`border-l border-slate-300 px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
            present ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Present
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
