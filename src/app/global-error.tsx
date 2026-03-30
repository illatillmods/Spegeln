"use client";

import Link from "next/link";

export default function GlobalError() {
  return (
    <html lang="sv">
      <body>
        <div className="shell py-20">
          <div className="surface rounded-4xl p-8">
            <p className="eyebrow">Globalt fel</p>
            <h1 className="mt-3 font-title text-4xl">Appen kunde inte renderas.</h1>
            <Link className="btn-primary mt-6 inline-flex" href="/">
              Till startsidan
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}