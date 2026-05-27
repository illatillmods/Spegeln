type FormErrorProps = {
  message: string;
};

export function FormError({ message }: FormErrorProps) {
  return (
    <div className="rounded-3xl border border-[rgba(153,27,27,0.25)] bg-white/80 px-4 py-3 text-sm text-[rgb(127,29,29)]" role="alert">
      {message}
    </div>
  );
}

type LoadingButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingLabel?: string;
};

export function LoadingButton({ loading, loadingLabel, children, disabled, className, ...props }: LoadingButtonProps) {
  return (
    <button className={className || "btn-primary disabled:cursor-not-allowed disabled:opacity-70"} disabled={disabled || loading} {...props}>
      {loading ? loadingLabel || "Arbetar..." : children}
    </button>
  );
}
