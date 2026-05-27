"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const pathways = [
  {
    href: "/overvakningsspegeln/sok",
    title: "Gräv i profiler",
    description: "Sök tjänstepersoner, följ signaler och starta bevakningar.",
  },
  {
    href: "/byrakrati-bombaren",
    title: "Skicka tryck",
    description: "Massutskick, registerkrav och automatiserade överklaganden.",
  },
  {
    href: "/myndighetsgranskaren",
    title: "Lämna tips",
    description: "Anonym rapportering, video och wiki om statens svagheter.",
  },
];

export function PostLoginOnboarding() {
  const router = useRouter();

  return (
    <div className="shell max-w-3xl space-y-8 pb-20 pt-10 md:pt-14">
      <section className="space-y-4">
        <p className="eyebrow">Välkommen</p>
        <h1 className="font-title text-5xl leading-none sm:text-6xl">Vad vill du göra först?</h1>
        <p className="text-(--muted) text-lg leading-8">
          Välj ett spår för att komma igång. Du hittar allt senare under Mina spår.
        </p>
      </section>

      <div className="grid gap-4">
        {pathways.map((pathway) => (
          <Link className="surface block rounded-4xl p-6 transition hover:-translate-y-0.5" href={pathway.href} key={pathway.href}>
            <h2 className="font-title text-3xl">{pathway.title}</h2>
            <p className="mt-2 text-(--muted) text-sm leading-7">{pathway.description}</p>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link className="btn-secondary" href="/konto">
          Gå till Mina spår
        </Link>
        <button className="btn-secondary" onClick={() => router.push("/")} type="button">
          Hoppa över
        </button>
      </div>
    </div>
  );
}
