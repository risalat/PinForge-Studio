"use client";

import { useRef, useState } from "react";
import { inviteTeammateAction } from "@/app/dashboard/team/actions";

export function TeamInviteForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [inviteUrl, setInviteUrl] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInviteUrl("");
    setCopied(false);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const result = await inviteTeammateAction(formData);
      setInviteUrl(result.inviteUrl);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invitation.");
    }
  }

  async function copyInviteLink() {
    if (inviteUrl) {
      try {
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // fallback
      }
    }
  }

  return (
    <form ref={ref} onSubmit={handleSubmit} className="mt-3 space-y-3">
      <div>
        <label htmlFor="invite-email" className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
          Email address
        </label>
        <input
          id="invite-email"
          name="email"
          type="email"
          required
          placeholder="colleague@example.com"
          className="mt-1 w-full rounded-[14px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2.5 text-sm text-[var(--dashboard-text)] placeholder:text-[var(--dashboard-muted)]"
        />
      </div>

      <div>
        <label htmlFor="invite-role" className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-muted)]">
          Role
        </label>
        <select
          id="invite-role"
          name="role"
          defaultValue="MEMBER"
          className="mt-1 w-full rounded-[14px] border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-4 py-2.5 text-sm text-[var(--dashboard-text)]"
        >
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <button
        type="submit"
        className="rounded-full dashboard-accent-action bg-[var(--dashboard-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--dashboard-shadow-accent)]"
      >
        Create invite link
      </button>

      {error && (
        <p className="text-sm text-[var(--dashboard-danger-ink)]">{error}</p>
      )}

      {inviteUrl && (
        <div className="rounded-[16px] border border-[var(--dashboard-success-border)] bg-[var(--dashboard-success-soft)] p-3">
          <p className="text-xs font-semibold text-[var(--dashboard-success-ink)]">
            Invite link created
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-white/80 px-2 py-1 text-xs">
              {inviteUrl}
            </code>
            <button
              type="button"
              onClick={copyInviteLink}
              className="rounded-full border border-[var(--dashboard-line)] bg-[var(--dashboard-panel)] px-3 py-1.5 text-xs font-semibold"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
