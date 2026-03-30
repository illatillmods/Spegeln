"use client";

import { useEffect, useState } from "react";
import type {
  AppealType,
  AuthorityTarget,
  BillingModel,
  MassAppealBatch,
  MassAppealCatalog,
  MassAppealPayload,
  MassAppealPreview,
} from "@/lib/mass-appeals-types";

type FormState = MassAppealPayload;

const statusLabels = {
  queued: "I kö",
  sent: "Skickad",
  delivered: "Bekräftad",
  manual_review: "Manuell kontroll",
  failed: "Misslyckad",
};

const statusClasses = {
  queued: "bg-[rgba(22,32,42,0.08)] text-(--foreground)",
  sent: "bg-[rgba(15,118,110,0.15)] text-[rgb(6,95,70)]",
  delivered: "bg-[rgba(15,118,110,0.22)] text-[rgb(6,95,70)]",
  manual_review: "bg-[rgba(194,107,20,0.16)] text-[rgb(146,64,14)]",
  failed: "bg-[rgba(153,27,27,0.16)] text-[rgb(127,29,29)]",
};

function getInitialForm(catalog: MassAppealCatalog): FormState {
  const defaultAppeal = catalog.appealTypes[0];

  return {
    appealType: defaultAppeal.id,
    senderName: "",
    senderEmail: "",
    senderRole: "",
    region: catalog.regions[0],
    subject: "",
    caseReference: "",
    incidentSummary: "",
    requestedAction: defaultAppeal.defaultRequestedAction,
    legalBasis: defaultAppeal.defaultLegalBasis,
    selectedAuthorityIds: [],
    billingModel: "payg",
    urgency: "standard",
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getRecommendedAuthorities(authorities: AuthorityTarget[], appealType: AppealType, region: string) {
  return authorities
    .filter((authority) => authority.supportedAppealTypes.includes(appealType))
    .filter((authority) => authority.region === "Nationell" || authority.region === region)
    .slice(0, 4);
}

export function MassAppealsWorkbench({ catalog }: { catalog: MassAppealCatalog }) {
  const [form, setForm] = useState<FormState>(() => getInitialForm(catalog));
  const [preview, setPreview] = useState<MassAppealPreview | null>(null);
  const [batches, setBatches] = useState<MassAppealBatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);

  const recommendedAuthorities = getRecommendedAuthorities(catalog.authorities, form.appealType, form.region);

  useEffect(() => {
    const definition = catalog.appealTypes.find((appealType) => appealType.id === form.appealType);
    if (!definition) {
      return;
    }

    setForm((current) => ({
      ...current,
      requestedAction: definition.defaultRequestedAction,
      legalBasis: definition.defaultLegalBasis,
      selectedAuthorityIds: getRecommendedAuthorities(catalog.authorities, definition.id, current.region).map((authority) => authority.id),
    }));
  }, [catalog.appealTypes, catalog.authorities, form.appealType]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      selectedAuthorityIds: getRecommendedAuthorities(catalog.authorities, current.appealType, current.region).map((authority) => authority.id),
    }));
  }, [catalog.authorities, form.region]);

  useEffect(() => {
    async function loadBatches() {
      if (!form.senderEmail.includes("@")) {
        setBatches([]);
        return;
      }

      const response = await fetch(`/api/byrakrati-bombaren/batches?senderEmail=${encodeURIComponent(form.senderEmail)}`);
      const data = await response.json();
      setBatches(Array.isArray(data.batches) ? data.batches : []);
    }

    void loadBatches();
  }, [form.senderEmail]);

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleAuthority(authorityId: string) {
    setForm((current) => {
      const selected = current.selectedAuthorityIds.includes(authorityId)
        ? current.selectedAuthorityIds.filter((id) => id !== authorityId)
        : [...current.selectedAuthorityIds, authorityId];

      return {
        ...current,
        selectedAuthorityIds: selected,
      };
    });
  }

  async function requestPreview() {
    setLoadingPreview(true);
    setError(null);

    try {
      const response = await fetch("/api/byrakrati-bombaren/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Kunde inte generera dokumenten.");
      }

      setPreview(data as MassAppealPreview);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Kunde inte generera dokumenten.");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function sendBatch() {
    setLoadingSend(true);
    setError(null);

    try {
      const response = await fetch("/api/byrakrati-bombaren/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Kunde inte skicka batchen.");
      }

      const batch = data as MassAppealBatch;
      setBatches((current) => [batch, ...current].slice(0, 6));
      setPreview(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Kunde inte skicka batchen.");
    } finally {
      setLoadingSend(false);
    }
  }

  return (
    <div className="space-y-16">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="space-y-5 reveal">
          <p className="eyebrow">Byråkrati-bombaren</p>
          <h1 className="max-w-4xl font-title text-5xl leading-none sm:text-6xl">
            Bygg, skicka och följ upp JO-anmälningar, GDPR-begäranden och informationskrav i en enda batch.
          </h1>
          <p className="max-w-3xl text-(--muted) text-lg leading-8">
            Välj ärendetyp, skriv ett underlag en gång och låt Spegeln generera mottagaranpassade dokument med spårningskod, prisestimat och abuse-skydd inbyggt från start.
          </p>
          <div className="flex flex-wrap gap-2 text-(--muted) text-sm">
            <span className="tag">Autogenererade mallar</span>
            <span className="tag">Bulk-sändning till relevanta myndigheter</span>
            <span className="tag">Statusspårning per mottagare</span>
            <span className="tag">Rate limiting och spärrar</span>
          </div>
        </div>

        <article className="surface-strong rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Ekonomi och spärrar</p>
          <h2 className="mt-3 font-title text-4xl">Usage när det passar, obegränsat när arbetsflödet kräver det.</h2>
          <div className="mt-6 space-y-4">
            {catalog.billingModels.map((model) => (
              <div className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/70 p-5" key={model.id}>
                <h3 className="text-(--foreground) text-xl font-semibold">{model.label}</h3>
                <p className="mt-2 text-(--muted) text-sm leading-7">{model.summary}</p>
              </div>
            ))}
          </div>
          <ul className="mt-6 space-y-3 text-sm leading-7 text-(--muted)">
            {catalog.antiAbuseSummary.map((item) => (
              <li className="flex gap-3" key={item}>
                <span className="signal-dot mt-2 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="surface rounded-4xl p-6 md:p-8 reveal">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="eyebrow">Ärendetyp</span>
              <select className="input" value={form.appealType} onChange={(event) => updateField("appealType", event.target.value as AppealType)}>
                {catalog.appealTypes.map((appealType) => (
                  <option key={appealType.id} value={appealType.id}>
                    {appealType.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="eyebrow">Region</span>
              <select className="input" value={form.region} onChange={(event) => updateField("region", event.target.value)}>
                {catalog.regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="eyebrow">Avsändare</span>
              <input className="input" value={form.senderName} onChange={(event) => updateField("senderName", event.target.value)} placeholder="Namn eller organisation" />
            </label>
            <label className="space-y-2">
              <span className="eyebrow">E-post</span>
              <input className="input" type="email" value={form.senderEmail} onChange={(event) => updateField("senderEmail", event.target.value)} placeholder="namn@exempel.se" />
            </label>
            <label className="space-y-2">
              <span className="eyebrow">Roll</span>
              <input className="input" value={form.senderRole} onChange={(event) => updateField("senderRole", event.target.value)} placeholder="Privatperson, journalist, ombud" />
            </label>
            <label className="space-y-2">
              <span className="eyebrow">Betalmodell</span>
              <select className="input" value={form.billingModel} onChange={(event) => updateField("billingModel", event.target.value as BillingModel)}>
                {catalog.billingModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 grid gap-5">
            <label className="space-y-2">
              <span className="eyebrow">Ämne</span>
              <input className="input" value={form.subject} onChange={(event) => updateField("subject", event.target.value)} placeholder="Kort och sakligt ämne för batchen" />
            </label>
            <label className="space-y-2">
              <span className="eyebrow">Referens</span>
              <input className="input" value={form.caseReference} onChange={(event) => updateField("caseReference", event.target.value)} placeholder="Diarienummer, intern referens eller datum" />
            </label>
            <label className="space-y-2">
              <span className="eyebrow">Bakgrund</span>
              <textarea className="input min-h-40" value={form.incidentSummary} onChange={(event) => updateField("incidentSummary", event.target.value)} placeholder="Beskriv vad som hänt, vilka handlingar som efterfrågas eller varför klagomålet lämnas." />
            </label>
            <label className="space-y-2">
              <span className="eyebrow">Önskad åtgärd</span>
              <textarea className="input min-h-28" value={form.requestedAction} onChange={(event) => updateField("requestedAction", event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className="eyebrow">Rättslig grund eller stöd</span>
              <textarea className="input min-h-24" value={form.legalBasis} onChange={(event) => updateField("legalBasis", event.target.value)} />
            </label>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/70 p-4">
              <input checked={form.urgency === "standard"} name="urgency" onChange={() => updateField("urgency", "standard")} type="radio" />
              <div>
                <div className="font-semibold">Ordinarie</div>
                <div className="text-(--muted) text-sm">Vanlig handläggning och normal ton.</div>
              </div>
            </label>
            <label className="flex items-center gap-3 rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/70 p-4">
              <input checked={form.urgency === "urgent"} name="urgency" onChange={() => updateField("urgency", "urgent")} type="radio" />
              <div>
                <div className="font-semibold">Skyndsamt</div>
                <div className="text-(--muted) text-sm">Markerar behov av snabb respons i underlaget.</div>
              </div>
            </label>
          </div>

          <div className="mt-6 space-y-3">
            <div>
              <p className="eyebrow">Mottagare</p>
              <p className="mt-2 text-(--muted) text-sm leading-7">
                Systemet förvaljer relevanta myndigheter utifrån typ och region. Du kan finjustera batchen innan förhandsgranskning.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {recommendedAuthorities.map((authority) => {
                const checked = form.selectedAuthorityIds.includes(authority.id);

                return (
                  <label className="flex gap-3 rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/70 p-4" key={authority.id}>
                    <input checked={checked} onChange={() => toggleAuthority(authority.id)} type="checkbox" />
                    <div>
                      <div className="font-semibold">{authority.name}</div>
                      <div className="mt-1 text-(--muted) text-sm">{authority.channel} • {authority.endpoint}</div>
                      <div className="mt-1 text-(--muted) text-xs">Svarstid cirka {authority.estimatedResponseDays} dagar</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {error ? <div className="mt-5 rounded-3xl border border-[rgba(194,107,20,0.3)] bg-[rgba(248,227,197,0.8)] px-4 py-3 text-sm text-[rgb(146,64,14)]">{error}</div> : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn-primary" disabled={loadingPreview || loadingSend} onClick={requestPreview} type="button">
              {loadingPreview ? "Genererar..." : "Förhandsgranska batch"}
            </button>
            <button className="btn-secondary" disabled={loadingSend || loadingPreview} onClick={sendBatch} type="button">
              {loadingSend ? "Skickar..." : "Skicka batch"}
            </button>
          </div>
        </article>

        <div className="space-y-5">
          <article className="surface-strong rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
            <p className="eyebrow">Förhandsgranskning</p>
            {preview ? (
              <div className="mt-4 space-y-5">
                <div className="rounded-3xl bg-[rgba(22,32,42,0.94)] p-5 text-white">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-title text-3xl">{preview.appealLabel}</h2>
                      <p className="mt-2 text-sm text-white/70">Skapad {formatDate(preview.createdAt)}</p>
                    </div>
                    <span className="tag border-white/10 bg-white/10 text-white">{preview.pricing.label}</span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-white/80">{preview.pricing.summary}</p>
                </div>

                <div className="space-y-3">
                  {preview.recipients.map((recipient) => (
                    <article className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-4" key={recipient.trackingCode}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold">{recipient.authorityName}</h3>
                          <p className="text-(--muted) text-sm">{recipient.channel} • {recipient.endpoint}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[recipient.status]}`}>
                          {statusLabels[recipient.status]}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-(--muted)">
                        <span className="tag">Spårning {recipient.trackingCode}</span>
                        <span className="tag">Svarstid {recipient.estimatedResponseDays} dagar</span>
                        <span className="tag">Kostnad {recipient.feeSek} kr</span>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="space-y-3">
                  <p className="eyebrow">Dokument</p>
                  {preview.documents.slice(0, 2).map((document) => (
                    <article className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-4" key={document.id}>
                      <h3 className="text-lg font-semibold">{document.title}</h3>
                      <p className="mt-1 text-(--muted) text-sm">{document.subjectLine}</p>
                      <pre className="mt-4 overflow-x-auto whitespace-pre-wrap font-sans text-sm leading-7 text-(--foreground)">{document.body}</pre>
                    </article>
                  ))}
                </div>

                <div className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-4">
                  <p className="eyebrow">Skyddsräcken</p>
                  <ul className="mt-3 space-y-3 text-sm leading-7 text-(--muted)">
                    {preview.guardrails.map((item) => (
                      <li className="flex gap-3" key={item}>
                        <span className="signal-dot mt-2 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-(--muted)">
                    <span className="tag">Förhandsgranskningar kvar: {preview.remainingQuota.previews}</span>
                    <span className="tag">Skarpa utskick kvar: {preview.remainingQuota.sends}</span>
                    <span className="tag">Max mottagare: {preview.remainingQuota.maxRecipientsPerBatch}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-(--muted) text-sm leading-7">
                Kör en förhandsgranskning för att se vilka myndigheter som väljs, hur dokumenten formuleras och vad batchen kostar innan den skickas.
              </p>
            )}
          </article>
        </div>
      </section>

      <section className="space-y-5 reveal">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Utskickslogg</p>
            <h2 className="mt-2 font-title text-4xl">Spåra skickade batcher och mottagarstatus.</h2>
          </div>
          <p className="max-w-2xl text-(--muted) text-sm leading-7">
            Utskicken sparas i databasen och hämtas tillbaka per användare eller avsändaradress. SMTP och secure mailbox-webhooks kan kopplas in parallellt, medan manuella fall stannar kvar i statusflödet.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {batches.length ? (
            batches.map((batch) => (
              <article className="surface rounded-[1.9rem] p-6" key={batch.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow">{batch.appealLabel}</p>
                    <h3 className="mt-2 font-title text-3xl">{batch.subject}</h3>
                  </div>
                  <span className="tag">{batch.pricing.label}</span>
                </div>
                <p className="mt-3 text-(--muted) text-sm leading-7">{formatDate(batch.createdAt)} • {batch.region} • {batch.deliveryMode}</p>
                <div className="mt-5 space-y-3">
                  {batch.recipients.map((recipient) => (
                    <div className="rounded-3xl border border-[rgba(22,32,42,0.08)] bg-white/75 p-4" key={recipient.trackingCode}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">{recipient.authorityName}</div>
                          <div className="mt-1 text-(--muted) text-sm">{recipient.trackingCode} • {recipient.endpoint}</div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[recipient.status]}`}>
                          {statusLabels[recipient.status]}
                        </span>
                      </div>
                      {recipient.notes.length ? <p className="mt-3 text-(--muted) text-sm leading-7">{recipient.notes[recipient.notes.length - 1]}</p> : null}
                    </div>
                  ))}
                </div>
              </article>
            ))
          ) : (
            <article className="surface rounded-[1.9rem] p-6">
              <p className="text-(--muted) text-sm leading-7">Inga batcher har skickats ännu. När du skickar första ärendet dyker statusloggen upp här.</p>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}