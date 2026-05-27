import Link from "next/link";
import { StepProgress } from "@/components/ui/StepProgress";

export default function SkatteplaneringLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8">
      <div className="shell pt-6">
        <StepProgress
          steps={[
            { label: "Översikt", href: "/skatteplanering" },
            { label: "Input", href: "/skatteplanering/onboarding", current: true },
            { label: "Resultat", href: "/skatteplanering/result" },
          ]}
        />
        <div className="mt-4">
          <Link className="text-(--muted) text-sm hover:text-(--foreground)" href="/skatteplanering">
            ← Tillbaka till modulöversikt
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
