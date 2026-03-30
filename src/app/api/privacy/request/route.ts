import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { reportServerError } from "@/lib/observability";
import { getPrismaClient } from "@/lib/prisma";

const privacyRequestSchema = z.object({
  email: z.email(),
  requestKind: z.enum(["ACCESS", "EXPORT", "DELETE", "RECTIFY", "OBJECTION", "RESTRICTION"]),
  details: z.string().max(2000).optional(),
  locale: z.enum(["sv", "en"]).default("sv"),
});

export async function POST(request: Request) {
  try {
    const input = privacyRequestSchema.parse(await request.json());
    const prisma = getPrismaClient();
    const user = await getSessionUser();

    if (!prisma) {
      return NextResponse.json({ error: "Databasanslutning saknas för integritetsärenden." }, { status: 503 });
    }

    await prisma.privacyRequest.create({
      data: {
        userId: user?.id,
        email: input.email,
        requestKind: input.requestKind,
        locale: input.locale === "en" ? "en-GB" : "sv-SE",
        details: input.details,
      },
    });

    return NextResponse.json({ message: "Din begäran är registrerad och går till juridisk granskning." }, { status: 201 });
  } catch (error) {
    await reportServerError(error, { route: "privacy.request" });
    return NextResponse.json({ error: "Kunde inte skapa integritetsärende." }, { status: 400 });
  }
}