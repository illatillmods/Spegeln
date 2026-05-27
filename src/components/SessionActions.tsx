"use client";

import { useTransition } from "react";

type SessionActionsProps = {
  accountHref?: string;
  accountLabel?: string;
  adminHref?: string;
  adminLabel: string;
  logoutLabel: string;
};

export function SessionActions({ accountHref, accountLabel, adminHref, adminLabel, logoutLabel }: SessionActionsProps) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      {accountHref && accountLabel ? (
        <a className="btn-secondary" href={accountHref}>
          {accountLabel}
        </a>
      ) : null}
      {adminHref ? (
        <a className="btn-secondary" href={adminHref}>
          {adminLabel}
        </a>
      ) : null}
      <button
        className="btn-secondary"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/";
          });
        }}
        type="button"
      >
        {pending ? "..." : logoutLabel}
      </button>
    </div>
  );
}