import Link from "next/link";

type ModuleHeroLink = {
  href: string;
  label: string;
};

type ModuleHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction?: ModuleHeroLink;
  secondaryAction?: ModuleHeroLink;
  aside?: React.ReactNode;
};

export function ModuleHero({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  aside,
}: ModuleHeroProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
      <div className="space-y-5 reveal">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="max-w-4xl font-title text-5xl leading-none sm:text-6xl">{title}</h1>
        <p className="max-w-3xl text-(--muted) text-lg leading-8">{description}</p>
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-wrap gap-3">
            {primaryAction ? (
              <Link className="btn-primary" href={primaryAction.href}>
                {primaryAction.label}
              </Link>
            ) : null}
            {secondaryAction ? (
              <Link className="btn-secondary" href={secondaryAction.href}>
                {secondaryAction.label}
              </Link>
            ) : null}
          </div>
        )}
      </div>
      {aside ? (
        <div className="reveal" style={{ animationDelay: "120ms" }}>
          {aside}
        </div>
      ) : null}
    </section>
  );
}
