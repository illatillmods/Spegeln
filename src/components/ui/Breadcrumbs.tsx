import Link from "next/link";

export type BreadcrumbItem = {
  href?: string;
  label: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Brödsmulor" className="shell pt-6">
      <ol className="flex flex-wrap items-center gap-2 text-(--muted) text-xs">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li className="flex items-center gap-2" key={`${item.label}-${index}`}>
              {item.href && !isLast ? (
                <Link className="transition hover:text-(--foreground)" href={item.href}>
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "font-medium text-(--foreground)" : undefined}>{item.label}</span>
              )}
              {!isLast ? <span aria-hidden>/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
