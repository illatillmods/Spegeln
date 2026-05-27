"use client";

import Link from "next/link";
import { useState } from "react";
import type { WikiPageView } from "@/lib/civic-features";
import { FormError, LoadingButton } from "@/components/ui/FormControls";
import { EmptyState } from "@/components/ui/EmptyState";

type Props = {
  initialItems: WikiPageView[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function LoopholesWikiClient({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const response = await fetch("/api/statens-svagheter/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug: slug || slugify(title),
        summary,
        category,
        tags: tags.split(",").map((value) => value.trim()).filter(Boolean),
        bodyMarkdown: body,
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error || "Kunde inte spara utkastet.");
      setPending(false);
      return;
    }

    const refresh = await fetch("/api/statens-svagheter/pages");
    const data = await refresh.json();
    setItems(Array.isArray(data.items) ? data.items : initialItems);
    setTitle("");
    setSlug("");
    setSummary("");
    setCategory("");
    setTags("");
    setBody("");
    setPending(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <form className="surface rounded-4xl p-6 md:p-8 space-y-3" onSubmit={handleSubmit}>
        <p className="eyebrow">Folkets wiki</p>
        <h2 className="font-title text-4xl">Skriv ett nytt angreppsspår.</h2>
        <input className="input" placeholder="Titel" required value={title} onChange={(event) => { setTitle(event.target.value); if (!slug) setSlug(slugify(event.target.value)); }} />
        <input className="input" placeholder="Slug (valfritt, genereras från titel)" value={slug} onChange={(event) => setSlug(event.target.value)} />
        <input className="input" placeholder="Kort sammanfattning" required value={summary} onChange={(event) => setSummary(event.target.value)} />
        <input className="input" placeholder="Kategori" required value={category} onChange={(event) => setCategory(event.target.value)} />
        <input className="input" placeholder="Taggar, kommaseparerade" value={tags} onChange={(event) => setTags(event.target.value)} />
        <textarea className="input min-h-40" placeholder="Första versionen av artikeln" required value={body} onChange={(event) => setBody(event.target.value)} />
        {error ? <FormError message={error} /> : null}
        <LoadingButton loading={pending} type="submit">
          Publicera utkast
        </LoadingButton>
      </form>

      <section className="space-y-4">
        {items.length === 0 ? (
          <EmptyState description="Skriv första artikeln eller kör databas-seed." title="Inga wiki-artiklar" />
        ) : (
          items.map((item) => (
            <Link className="block surface rounded-4xl p-5 transition hover:-translate-y-0.5" href={`/statens-svagheter/${item.slug}`} key={item.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">{item.category}</p>
                  <h3 className="mt-2 text-2xl font-semibold">{item.title}</h3>
                </div>
                <span className="tag">Score {item.score}</span>
              </div>
              <p className="mt-3 text-(--muted) text-sm leading-7">{item.summary}</p>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
