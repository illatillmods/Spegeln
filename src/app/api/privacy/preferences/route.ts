import { NextResponse } from "next/server";
import { z } from "zod";
import { getPolicyVersion, getSessionUser } from "@/lib/auth";
import { reportServerError } from "@/lib/observability";
import { getPrismaClient } from "@/lib/prisma";

const preferencesSchema = z.object({
  locale: z.enum(["sv", "en"]).default("sv"),
  marketingConsent: z.boolean(),
  analyticsConsent: z.boolean(),
  personalizationConsent: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const input = preferencesSchema.parse(await request.json());
    const user = await getSessionUser();
    const prisma = getPrismaClient();

    if (prisma) {
      await prisma.privacyConsentEvent.create({
        data: {
          userId: user?.id,
          locale: input.locale === "en" ? "en-GB" : "sv-SE",
          policyVersion: getPolicyVersion(),
          acceptedTerms: true,
          acceptedPrivacy: true,
          marketingConsent: input.marketingConsent,
          analyticsConsent: input.analyticsConsent,
          personalizationConsent: input.personalizationConsent,
        },
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            marketingConsent: input.marketingConsent,
            preferredLanguage: input.locale,
            locale: input.locale === "en" ? "en-GB" : "sv-SE",
            privacyConsentAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ message: "Integritetsinställningar uppdaterade." });
  } catch (error) {
    await reportServerError(error, { route: "privacy.preferences" });
    return NextResponse.json({ error: "Kunde inte uppdatera integritetsinställningar." }, { status: 400 });
  }
}