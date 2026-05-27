import { AuthorityCategory, OfficialCategory, type PrismaClient } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";

export type WatchdogImportRow = {
  authorityName: string;
  authoritySlug: string;
  officialName: string;
  officialTitle: string;
  category?: AuthorityCategory;
  officialCategory?: OfficialCategory;
  region?: string;
  sourceKey?: string;
  externalId?: string;
  profileUrl?: string;
  photoUrl?: string;
  slug?: string;
};

function normalizeFullName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export async function upsertOfficialFromRow(
  prisma: PrismaClient,
  row: WatchdogImportRow,
  authorityId: string,
) {
  const fullName = normalizeFullName(row.officialName);

  const existing = await prisma.official.findUnique({
    where: { authorityId_fullName: { authorityId, fullName } },
  });

  const official = existing
    ? await prisma.official.update({
        where: { id: existing.id },
        data: {
          title: row.officialTitle,
          category: row.officialCategory ?? existing.category,
          photoUrl: row.photoUrl ?? existing.photoUrl,
          slug: row.slug ?? existing.slug,
          lastIngestedAt: new Date(),
        },
      })
    : await prisma.official.create({
        data: {
          fullName,
          title: row.officialTitle,
          authorityId,
          category: row.officialCategory ?? OfficialCategory.OTHER,
          photoUrl: row.photoUrl,
          slug: row.slug,
          lastIngestedAt: new Date(),
        },
      });

  if (row.sourceKey && row.externalId) {
    await prisma.officialIdentity.upsert({
      where: {
        sourceKey_externalId: {
          sourceKey: row.sourceKey,
          externalId: row.externalId,
        },
      },
      update: {
        officialId: official.id,
        profileUrl: row.profileUrl,
      },
      create: {
        officialId: official.id,
        sourceKey: row.sourceKey,
        externalId: row.externalId,
        profileUrl: row.profileUrl,
      },
    });
  }

  return { official, created: !existing };
}

export async function importWatchdogRows(rows: WatchdogImportRow[]) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error("DATABASE_URL saknas.");
  }

  let createdAuthorities = 0;
  let createdOfficials = 0;
  let updatedOfficials = 0;

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

    const { created } = await upsertOfficialFromRow(prisma, row, authority.id);
    if (created) {
      createdOfficials += 1;
    } else {
      updatedOfficials += 1;
    }
  }

  return { createdAuthorities, createdOfficials, updatedOfficials, total: rows.length };
}
