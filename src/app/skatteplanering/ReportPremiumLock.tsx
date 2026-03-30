import React from "react";
import Link from "next/link";

export default function ReportPremiumLock() {
  return (
    <div className="border border-yellow-400 bg-yellow-50 p-4 rounded text-center mt-6">
      <div className="font-semibold mb-2">Premium krävs</div>
      <p>Detaljerade rapporter och löpande optimering kräver ett premiumabonnemang.</p>
      <Link href="/prissattning" className="btn btn-warning mt-2">Uppgradera till Premium</Link>
    </div>
  );
}
