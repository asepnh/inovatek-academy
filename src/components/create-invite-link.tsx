"use client";

import { useState, useTransition } from "react";
import { createInvite } from "@/actions/users";
import type { UserRole } from "@/lib/types";

export function CreateInviteLink() {
  const [role, setRole] = useState<UserRole>("mentor");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function generate() {
    setError(null);
    setCopied(false);
    startTransition(async () => {
      const result = await createInvite(role);
      if (result.error) {
        setError(result.error);
        return;
      }
      setLink(`${window.location.origin}/signup?invite=${result.token}`);
    });
  }

  function copy() {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => setCopied(true));
  }

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="font-semibold text-slate-900">Send an invite link instead</h2>
        <p className="mt-1 text-sm text-slate-600">
          Generates a one-time signup link — send it to them and they fill in their own
          name, email, and password at <code>/signup</code>. Their account is created as
          the role below automatically. The link expires in 7 days or after first use,
          whichever comes first.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="invite_role">Role</label>
          <select
            className="input"
            id="invite_role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value="mentor">Mentor</option>
            <option value="parent">Parent</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="button" onClick={generate} disabled={pending} className="btn">
          {pending ? "Generating…" : "Generate link"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {link && (
        <div className="space-y-2">
          <input className="input font-mono text-xs" value={link} readOnly onFocus={(e) => e.target.select()} />
          <button type="button" onClick={copy} className="btn-secondary text-sm">
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      )}
    </div>
  );
}
