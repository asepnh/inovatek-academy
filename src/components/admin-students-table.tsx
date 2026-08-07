"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { bulkEnrollStudents } from "@/actions/enrollments";
import { DeleteStudentButton } from "@/components/delete-student-button";
import { formatDate } from "@/lib/format";

interface StudentRow {
  id: string;
  full_name: string;
  grade: string;
  created_at: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  classNames: string[];
}

export function AdminStudentsTable({
  students,
  classes,
}: {
  students: StudentRow[];
  classes: { id: string; name: string }[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [classId, setClassId] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const unenrolledIds = useMemo(
    () => students.filter((s) => s.classNames.length === 0).map((s) => s.id),
    [students]
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllUnenrolled() {
    setSelected((prev) => (prev.size === unenrolledIds.length ? new Set() : new Set(unenrolledIds)));
  }

  function handleEnroll() {
    setError(null);
    if (selected.size === 0 || !classId) {
      setError("Choose at least one student and a class.");
      return;
    }
    startTransition(async () => {
      const result = await bulkEnrollStudents(Array.from(selected), classId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSelected(new Set());
      setClassId("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="bulk_class">Enroll selected in</label>
          <select
            className="input"
            id="bulk_class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">Select a class…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleEnroll}
          disabled={pending || selected.size === 0 || !classId}
          className="btn"
        >
          {pending ? "Enrolling…" : `Enroll selected (${selected.size})`}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-2 pr-2 font-medium">
                <input
                  type="checkbox"
                  checked={unenrolledIds.length > 0 && selected.size === unenrolledIds.length}
                  onChange={toggleAllUnenrolled}
                  disabled={unenrolledIds.length === 0}
                  title="Select all not-enrolled students"
                />
              </th>
              <th className="pb-2 font-medium">Student</th>
              <th className="pb-2 font-medium">Grade</th>
              <th className="pb-2 font-medium">Class</th>
              <th className="pb-2 font-medium">Parent</th>
              <th className="pb-2 font-medium">Contact</th>
              <th className="pb-2 font-medium">Added</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s) => (
              <tr key={s.id}>
                <td className="py-2 pr-2">
                  {s.classNames.length === 0 && (
                    <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                  )}
                </td>
                <td className="py-2">{s.full_name}</td>
                <td className="py-2">{s.grade}</td>
                <td className="py-2">
                  {s.classNames.length > 0 ? (
                    s.classNames.join(", ")
                  ) : (
                    <span className="text-slate-400">Not Enrolled</span>
                  )}
                </td>
                <td className="py-2">{s.parentName}</td>
                <td className="py-2">
                  <div>{s.parentEmail}</div>
                  <div className="text-xs text-slate-400">{s.parentPhone}</div>
                </td>
                <td className="py-2">{formatDate(s.created_at)}</td>
                <td className="py-2 text-right space-x-3">
                  <Link href={`/admin/students/${s.id}`} className="text-brand-600 hover:underline">
                    View
                  </Link>
                  <DeleteStudentButton studentId={s.id} studentName={s.full_name} />
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-500">No students yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
