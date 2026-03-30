"use client";

import { useState } from "react";
import type { WikiPageView } from "@/lib/civic-features";

type Props = {
  initialItems: WikiPageView[];
};

export function LoopholesWikiClient({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [body, setBody] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/statens-svagheter/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug,
        summary,
        category,
        tags: tags.split(",").map((value) => value.trim()).filter(Boolean),
        bodyMarkdown: body,
      }),
    });
    if (response.ok) {
      const refresh = await fetch("/api/statens-svagheter/pages");
      const data = await refresh.json();
      setItems(Array.isArray(data.items) ? data.items : initialItems);
      setTitle("");
      setSlug("");
      setSummary("");
      setCategory("");
      setTags("");
      setBody("");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <form className="surface rounded-4xl p-6 md:p-8 space-y-3" onSubmit={handleSubmit}>
        <p className="eyebrow">Community-wiki</p>
        <h2 className="font-title text-4xl">Skriv ett nytt utkast.</h2>
        <input className="input" placeholder="Titel" value={title} onChange={(event) => setTitle(event.target.value)} />
        <input className="input" placeholder="Slug" value={slug} onChange={(event) => setSlug(event.target.value)} />
        <input className="input" placeholder="Kort sammanfattning" value={summary} onChange={(event) => setSummary(event.target.value)} />
        <input className="input" placeholder="Kategori" value={category} onChange={(event) => setCategory(event.target.value)} />
        <input className="input" placeholder="Taggar, kommaseparerade" value={tags} onChange={(event) => setTags(event.target.value)} />
        <textarea className="input min-h-40" placeholder="Version 1 av artikeln" value={body} onChange={(event) => setBody(event.target.value)} />
        <button className="btn-primary" type="submit">Skicka till moderation</button>
      </form>

      <section className="space-y-4">
        {items.map((item) => (
          <article className="surface rounded-4xl p-5" key={item.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{item.category}</p>
                <h3 className="mt-2 text-2xl font-semibold">{item.title}</h3>
              </div>
              <span className="tag">Score {item.score}</span>
            </div>
            <p className="mt-3 text-(--muted) text-sm leading-7">{item.summary}</p>
            <p className="mt-3 text-sm leading-7">{item.latestExcerpt}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-(--muted)">
              {item.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
              <span className="tag">Revisioner {item.revisionCount}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}