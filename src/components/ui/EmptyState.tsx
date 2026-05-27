import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="rounded-4xl border border-dashed border-[rgba(22,32,42,0.14)] bg-white/60 px-6 py-10 text-center">
      <p className="font-title text-2xl text-(--foreground)">{title}</p>
      <p className="mx-auto mt-3 max-w-xl text-(--muted) text-sm leading-7">{description}</p>
      {actionLabel && actionHref ? (
        <Link className="btn-primary mt-6 inline-flex" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
