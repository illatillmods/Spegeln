"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="shell py-20">
      <div className="surface rounded-4xl p-8">
        <p className="eyebrow">Fel</p>
        <h1 className="mt-3 font-title text-4xl">Något gick fel i den här vyn.</h1>
        <p className="mt-4 text-(--muted) text-sm leading-7">
          Felet har loggats på serversidan om observability är aktiverad. Försök igen eller gå tillbaka till startsidan.
        </p>
        <button className="btn-primary mt-6" onClick={() => reset()} type="button">
          Försök igen
        </button>
      </div>
    </div>
  );
}