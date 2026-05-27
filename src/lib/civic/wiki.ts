import { createHash } from "node:crypto";
import { ModerationDecision } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";

export type WikiPageDetail = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  score: number;
  bodyMarkdown: string;
  revisionNumber: number;
  updatedAt: string;
  revisions: Array<{
    revisionNumber: number;
    title: string;
    changeSummary?: string;
    createdAt: string;
  }>;
};

export async function getWikiPageBySlug(slug: string): Promise<WikiPageDetail | null> {
  const prisma = getPrismaClient();
  if (!prisma) {
    return null;
  }

  const page = await prisma.loopholeWikiPage.findUnique({
    where: { slug },
    include: {
      revisions: {
        where: { moderationDecision: ModerationDecision.APPROVED },
        orderBy: { revisionNumber: "desc" },
      },
      votes: { select: { value: true } },
    },
  });

  if (!page || page.revisions.length === 0) {
    return null;
  }

  const revision = page.revisions[0];

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    summary: page.summary,
    category: page.category,
    tags: page.tags,
    score: page.votes.reduce((sum, vote) => sum + vote.value, 0),
    bodyMarkdown: revision.bodyMarkdown,
    revisionNumber: revision.revisionNumber,
    updatedAt: page.updatedAt.toISOString(),
    revisions: page.revisions.map((entry) => ({
      revisionNumber: entry.revisionNumber,
      title: entry.title,
      changeSummary: entry.changeSummary || undefined,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}

export async function submitWikiVote(input: {
  pageId: string;
  value: 1 | -1;
  userId?: string;
  fingerprintSource?: string;
}) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error("DATABASE_URL saknas.");
  }

  const page = await prisma.loopholeWikiPage.findUnique({ where: { id: input.pageId }, select: { id: true } });
  if (!page) {
    throw new Error("Artikeln hittades inte.");
  }

  const voterFingerprintHash = input.fingerprintSource
    ? createHash("sha256").update(input.fingerprintSource).digest("hex")
    : null;

  await prisma.loopholeWikiVote.create({
    data: {
      pageId: input.pageId,
      userId: input.userId,
      voterFingerprintHash,
      value: input.value,
    },
  });

  const votes = await prisma.loopholeWikiVote.findMany({
    where: { pageId: input.pageId },
    select: { value: true },
  });

  return {
    ok: true,
    score: votes.reduce((sum, vote) => sum + vote.value, 0),
  };
}

export async function listWikiCategories() {
  const prisma = getPrismaClient();
  if (!prisma) {
    return [];
  }

  const pages = await prisma.loopholeWikiPage.findMany({
    select: { category: true, tags: true },
  });

  const categories = Array.from(new Set(pages.map((page) => page.category))).sort();
  const tags = Array.from(new Set(pages.flatMap((page) => page.tags))).sort();

  return { categories, tags };
}
