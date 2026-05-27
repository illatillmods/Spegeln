type Step = {
  label: string;
  href?: string;
  current?: boolean;
};

type StepProgressProps = {
  steps: Step[];
};

export function StepProgress({ steps }: StepProgressProps) {
  return (
    <ol className="flex flex-wrap gap-3">
      {steps.map((step, index) => (
        <li
          className={`rounded-full px-4 py-2 text-sm font-medium ${step.current ? "bg-(--foreground) text-white" : "border border-[rgba(22,32,42,0.1)] bg-white/75 text-(--foreground)"}`}
          key={step.label}
        >
          {index + 1}. {step.label}
        </li>
      ))}
    </ol>
  );
}
