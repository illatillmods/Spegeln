"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { localeOptions, type AppLocale } from "@/lib/i18n";

type LanguageSwitcherProps = {
  currentLocale: AppLocale;
  label: string;
};

export function LanguageSwitcher({ currentLocale, label }: LanguageSwitcherProps) {
  const router = useRouter();
  const [selectedLocale, setSelectedLocale] = useState<AppLocale>(currentLocale);
  const [pending, setPending] = useState(false);

  async function updateLocale(nextLocale: AppLocale) {
    setPending(true);

    await fetch("/api/preferences/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: nextLocale }),
    });

    startTransition(() => {
      router.refresh();
    });

    setPending(false);
  }

  return (
    <label className="flex items-center gap-2 text-(--muted) text-sm">
      <span>{label}</span>
      <select
        aria-label={label}
        className="select-field min-w-28"
        disabled={pending}
        onChange={(event) => {
          const nextLocale = event.target.value as AppLocale;
          setSelectedLocale(nextLocale);
          void updateLocale(nextLocale);
        }}
        value={selectedLocale}
      >
        {localeOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}