"use client";

import { useTransition } from "react";

type SessionActionsProps = {
  adminHref?: string;
  adminLabel: string;
  logoutLabel: string;
};

export function SessionActions({ adminHref, adminLabel, logoutLabel }: SessionActionsProps) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
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