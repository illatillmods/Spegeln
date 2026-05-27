import { AuthorityCategory } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";

export type WatchdogImportRow = {
  authorityName: string;
  authoritySlug: string;
  officialName: string;
  officialTitle: string;
  category?: AuthorityCategory;
  region?: string;
};

export async function importWatchdogRows(rows: WatchdogImportRow[]) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error("DATABASE_URL saknas.");
  }

  let createdAuthorities = 0;
  let createdOfficials = 0;

  for (const row of rows) {
    const authority = await prisma.authority.upsert({
      where: { slug: row.authoritySlug },
      update: {
        name: row.authorityName,
        region: row.region || "Nationell",
      },
      create: {
        name: row.authorityName,
        slug: row.authoritySlug,
        level: "Importerad",
        region: row.region || "Nationell",
        category: row.category || AuthorityCategory.AGENCY,
        summary: `Importerad myndighet ${row.authorityName}.`,
      },
    });

    if (authority.createdAt.getTime() === authority.updatedAt.getTime()) {
      createdAuthorities += 1;
    }

    await prisma.official.create({
      data: {
        fullName: row.officialName,
        title: row.officialTitle,
        authorityId: authority.id,
      },
    });
    createdOfficials += 1;
  }

  return { createdAuthorities, createdOfficials, total: rows.length };
}
