import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { reportServerError } from "@/lib/observability";
import { getPrismaClient } from "@/lib/prisma";

const feedbackSchema = z.object({
  email: z.email().optional().or(z.literal("")),
  category: z.string().trim().min(2).max(64),
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().min(10).max(3000),
  locale: z.enum(["sv", "en"]).default("sv"),
});

export async function POST(request: Request) {
  try {
    const input = feedbackSchema.parse(await request.json());
    const prisma = getPrismaClient();
    const user = await getSessionUser();

    if (!prisma) {
      return NextResponse.json({ error: "Databasanslutning saknas för feedbackinsamling." }, { status: 503 });
    }

    await prisma.betaFeedback.create({
      data: {
        userId: user?.id,
        email: input.email || user?.email,
        locale: input.locale === "en" ? "en-GB" : "sv-SE",
        category: input.category,
        message: input.message,
        rating: input.rating,
      },
    });

    return NextResponse.json({ message: "Tack. Feedbacken är registrerad för betakön." }, { status: 201 });
  } catch (error) {
    await reportServerError(error, { route: "feedback.create" });
    return NextResponse.json({ error: "Kunde inte registrera feedback." }, { status: 400 });
  }
}