import { SearchDirectory } from "@/app/overvakningsspegeln/SearchDirectory";
import { getWatchdogPeople, getWatchdogSnapshot } from "@/lib/watchdog";

export const metadata = {
  title: "Sök person | Övervakningsspegeln",
  description: "Sök profiler med korrelationsdata, daglig synk och kronologiska offentliga poster.",
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const [individuals, snapshot] = await Promise.all([getWatchdogPeople(), getWatchdogSnapshot()]);
  const initialQuery = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";

  return (
    <div className="shell space-y-10 pb-20 pt-10 md:pt-14">
      <section className="grid gap-6 lg:grid-cols-[1.04fr_0.96fr] lg:items-start">
        <div className="space-y-5 reveal">
          <p className="eyebrow">Profilsök</p>
          <h1 className="font-title text-5xl leading-none sm:text-6xl">Sök profiler med live-signaler, tidslinje och anslutna källfamiljer.</h1>
          <p className="max-w-3xl text-(--muted) text-lg leading-8">
            Varje profil visar det som finns i den riktiga datamodellen just nu: klagomål, granskningsärenden, rapporter, alerts och vilka källfamiljer som driver bevakningen.
          </p>
        </div>
        <article className="surface-strong rounded-4xl p-6 md:p-8 reveal" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Sökdata</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="metric-card">
              <p className="text-3xl font-semibold">{snapshot.officialsCovered}</p>
              <p className="mt-2 text-sm font-medium">Profiler</p>
            </div>
            <div className="metric-card">
              <p className="text-3xl font-semibold">{snapshot.totalTrackedRecords}</p>
              <p className="mt-2 text-sm font-medium">Signaler</p>
            </div>
            <div className="metric-card">
              <p className="text-3xl font-semibold">{snapshot.authoritiesCovered}</p>
              <p className="mt-2 text-sm font-medium">Myndigheter</p>
            </div>
          </div>
          <p className="mt-5 text-(--muted) text-sm leading-7">{snapshot.dailySyncCoverage}</p>
        </article>
      </section>

      <SearchDirectory individuals={individuals} initialQuery={initialQuery} />
    </div>
  );
}
