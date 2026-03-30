import { getSessionUser, requireRole } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!requireRole(user, ["ADMIN"])) redirect("/login");

  const prisma = getPrismaClient();
  const [counts, legalQueue, moderationQueue, paymentsQueue, privacyQueue, feedbackQueue] = prisma
    ? await Promise.all([
        Promise.all([
          prisma.user.count(),
          prisma.reviewQueueItem.count({ where: { moderationDecision: "PENDING" } }),
          prisma.legalReview.count({ where: { status: "PENDING" } }),
          prisma.paymentRequest.count({ where: { status: { in: ["PENDING_REVIEW", "AWAITING_PAYMENT"] } } }),
          prisma.privacyRequest.count({ where: { status: { in: ["PENDING", "IN_REVIEW"] } } }),
          prisma.apiConsumer.count(),
        ]),
        prisma.legalReview.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { report: { select: { title: true } } },
        }),
        prisma.reviewQueueItem.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, targetType: true, status: true, moderationDecision: true, legalDecision: true, createdAt: true },
        }),
        prisma.paymentRequest.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, email: true, method: true, status: true, finalAmountSek: true, itemLabel: true, createdAt: true },
        }),
        prisma.privacyRequest.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, email: true, requestKind: true, status: true, createdAt: true },
        }),
        prisma.betaFeedback.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, category: true, rating: true, status: true, createdAt: true },
        }),
      ])
    : [[0, 0, 0, 0, 0, 0], [], [], [], [], []];

  const [userCount, moderationCount, legalCount, paymentCount, privacyCount, apiCount] = counts;

  return (
    <div className="shell space-y-12 pb-20 pt-10 md:pt-14">
      <section className="grid gap-6 lg:grid-cols-[1fr_0.88fr] lg:items-start">
        <div className="space-y-5 reveal">
          <p className="eyebrow">Operations</p>
          <h1 className="font-title text-5xl leading-none sm:text-6xl">Adminpanel för moderation, analys och legal review</h1>
          <p className="max-w-2xl text-(--muted) text-lg leading-8">
            Välkommen, {user?.name || user?.email}. Den här vyn samlar plattformens operativa köer i stället för att lämna moderation, integritet, betalning och partneraccess utspridda över flera verktyg.
          </p>
        </div>
        <aside className="surface-strong rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Runtime</p>
          <p className="mt-3 text-(--foreground) text-sm leading-7">
            {prisma ? "Databasanslutning aktiv. Panelen läser liveköer för moderation, juridik, GDPR och betalning." : "Databasanslutning saknas. Panelen kör i read-only fallbackläge."}
          </p>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          ["Användare", userCount],
          ["Moderationskö", moderationCount],
          ["Legal review", legalCount],
          ["Betalningskö", paymentCount],
          ["Integritetsärenden", privacyCount],
          ["API-konsumenter", apiCount],
        ].map(([label, value], index) => (
          <article className="metric-card reveal" key={String(label)} style={{ animationDelay: `${index * 80}ms` }}>
            <p className="text-(--foreground) text-3xl font-semibold">{value}</p>
            <p className="mt-2 text-(--foreground) text-sm font-medium">{label}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="surface rounded-4xl p-6 md:p-8 reveal">
          <p className="eyebrow">Legal review</p>
          <h2 className="mt-3 font-title text-4xl">Senaste juridiska ärenden</h2>
          <div className="mt-6 space-y-3 text-sm leading-7">
            {legalQueue.length > 0 ? legalQueue.map((item) => (
              <div className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-4" key={item.id}>
                <p className="font-semibold text-(--foreground)">{item.report.title}</p>
                <p className="text-(--muted)">{item.status}{item.nextCheckpointAt ? ` • nästa checkpoint ${new Intl.DateTimeFormat("sv-SE").format(item.nextCheckpointAt)}` : ""}</p>
              </div>
            )) : <p className="text-(--muted)">Inga juridiska ärenden ännu.</p>}
          </div>
        </article>

        <article className="surface rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Moderation</p>
          <h2 className="mt-3 font-title text-4xl">Senaste granskningskön</h2>
          <div className="mt-6 space-y-3 text-sm leading-7">
            {moderationQueue.length > 0 ? moderationQueue.map((item) => (
              <div className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-4" key={item.id}>
                <p className="font-semibold text-(--foreground)">{item.targetType}</p>
                <p className="text-(--muted)">{item.status} • moderation {item.moderationDecision} • legal {item.legalDecision}</p>
              </div>
            )) : <p className="text-(--muted)">Ingen moderationskö ännu.</p>}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="surface rounded-4xl p-6 md:p-8 reveal">
          <p className="eyebrow">Payments</p>
          <h2 className="mt-3 font-title text-3xl">Manuella betalningsflöden</h2>
          <div className="mt-5 space-y-3 text-sm leading-7">
            {paymentsQueue.length > 0 ? paymentsQueue.map((item) => (
              <div className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-4" key={item.id}>
                <p className="font-semibold text-(--foreground)">{item.itemLabel}</p>
                <p className="text-(--muted)">{item.method} • {item.finalAmountSek} kr • {item.status}</p>
                <p className="text-(--muted)">{item.email}</p>
              </div>
            )) : <p className="text-(--muted)">Inga manuella betalningsärenden ännu.</p>}
          </div>
        </article>

        <article className="surface rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">GDPR</p>
          <h2 className="mt-3 font-title text-3xl">Integritetsbegäran</h2>
          <div className="mt-5 space-y-3 text-sm leading-7">
            {privacyQueue.length > 0 ? privacyQueue.map((item) => (
              <div className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-4" key={item.id}>
                <p className="font-semibold text-(--foreground)">{item.requestKind}</p>
                <p className="text-(--muted)">{item.email}</p>
                <p className="text-(--muted)">{item.status}</p>
              </div>
            )) : <p className="text-(--muted)">Inga integritetsärenden ännu.</p>}
          </div>
        </article>

        <article className="surface rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "240ms" }}>
          <p className="eyebrow">Beta</p>
          <h2 className="mt-3 font-title text-3xl">Feedbackkö</h2>
          <div className="mt-5 space-y-3 text-sm leading-7">
            {feedbackQueue.length > 0 ? feedbackQueue.map((item) => (
              <div className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-4" key={item.id}>
                <p className="font-semibold text-(--foreground)">{item.category}</p>
                <p className="text-(--muted)">Betyg {item.rating ?? "-"} • {item.status}</p>
              </div>
            )) : <p className="text-(--muted)">Ingen betafeedback ännu.</p>}
          </div>
        </article>
      </section>
    </div>
  );
}
