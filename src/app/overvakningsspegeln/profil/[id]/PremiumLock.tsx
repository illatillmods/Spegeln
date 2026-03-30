import Link from "next/link";

export function PremiumLock({ feature }: { feature: string }) {
  return (
    <div className="surface rounded-2xl p-6 my-6 flex flex-col items-center text-center border border-amber-300 bg-amber-50">
      <div className="text-amber-700 font-bold text-lg mb-2">Premiumfunktion</div>
      <div className="mb-4">{feature} kräver premiumabonnemang.</div>
      <Link className="btn-primary" href="/prissattning">Uppgradera till premium</Link>
    </div>
  );
}
