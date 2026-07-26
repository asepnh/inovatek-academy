"use client";

import { useState, useTransition } from "react";
import { setClassCoMentors } from "@/actions/classes";

export function CoMentorsForm({
  classId,
  mentors,
  initialSelectedIds,
}: {
  classId: string;
  mentors: { id: string; full_name: string }[];
  initialSelectedIds: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelectedIds));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSaved(false);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await setClassCoMentors(classId, Array.from(selected));
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  if (mentors.length === 0) {
    return <p className="text-sm text-slate-500">No mentor accounts exist yet.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {mentors.map((m) => (
          <label key={m.id} className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)} />
            {m.full_name}
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-700">Saved.</p>}
      <button type="button" onClick={save} disabled={pending} className="btn-secondary text-sm">
        {pending ? "Saving…" : "Save co-mentors"}
      </button>
    </div>
  );
}
