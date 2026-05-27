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
        take: 1,
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
  };
}
