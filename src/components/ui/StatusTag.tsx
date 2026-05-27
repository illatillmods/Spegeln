const statusClasses: Record<string, string> = {
  LEGAL_REVIEW: "bg-[rgba(194,107,20,0.16)] text-[rgb(146,64,14)]",
  PROCESSING: "bg-[rgba(22,32,42,0.08)] text-(--foreground)",
  MODERATION: "bg-[rgba(15,118,110,0.12)] text-[rgb(6,95,70)]",
  PUBLISHED: "bg-[rgba(15,118,110,0.22)] text-[rgb(6,95,70)]",
  DRAFT: "bg-[rgba(22,32,42,0.08)] text-(--foreground)",
  DRAFTED: "bg-[rgba(22,32,42,0.08)] text-(--foreground)",
  SUBMITTED: "bg-[rgba(15,118,110,0.15)] text-[rgb(6,95,70)]",
  CRITICAL: "bg-[rgba(153,27,27,0.16)] text-[rgb(127,29,29)]",
  HIGH: "bg-[rgba(194,107,20,0.16)] text-[rgb(146,64,14)]",
  MEDIUM: "bg-[rgba(22,32,42,0.08)] text-(--foreground)",
  LOW: "bg-[rgba(22,32,42,0.06)] text-(--muted)",
};

type StatusTagProps = {
  label: string;
  value: string;
};

export function StatusTag({ label, value }: StatusTagProps) {
  return (
    <span className={`tag ${statusClasses[value] || statusClasses.MEDIUM}`} title={label}>
      {label}
    </span>
  );
}
