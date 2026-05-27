import { Suspense } from "react";
import type { Metadata } from "next";
import type { SessionUser } from "@/lib/auth";
import { serverApiJson } from "@/lib/server-api";
import { AccountClient, AccountPageShell } from "./AccountClient";

export const metadata: Metadata = {
  title: "Mina spår",
  description: "Bevakningar, batcher, rapporter och analyser kopplade till ditt konto.",
};

export default async function AccountPage() {
  const user = await serverApiJson<SessionUser>("/api/me", {}, { allowStatuses: [401] });

  return (
    <AccountPageShell user={user}>
      <Suspense fallback={<p className="text-(--muted) text-sm">Laddar...</p>}>
        <AccountClient user={user} />
      </Suspense>
    </AccountPageShell>
  );
}
