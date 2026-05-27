import { AuthorityCategory, Prisma, PublicRecordCategory } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { requestWatchdogNormalizeRecord } from "@/lib/ai-worker";
import type { NormalizedRecordDraft } from "@/lib/watchdog/records";
import { sanitizeRecordText } from "@/lib/watchdog/records";
import { upsertOfficialFromRow } from "@/lib/watchdog-import";

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function nameScore(left: string, right: string) {
  const a = normalizeName(left);
  const b = normalizeName(right);
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.85;

  const aParts = new Set(a.split(" "));
  const bParts = new Set(b.split(" "));
  const overlap = [...aParts].filter((part) => bParts.has(part)).length;
  const union = new Set([...aParts, ...bParts]).size;
  return union === 0 ? 0 : overlap / union;
}

function mapAiCategory(value: string): PublicRecordCategory {
  const normalized = value.toUpperCase();
  if (normalized in PublicRecordCategory) {
    return normalized as PublicRecordCategory;
  }
  return PublicRecordCategory.OTHER;
}

export async function maybeEnhanceDraftWithAi(draft: NormalizedRecordDraft): Promise<NormalizedRecordDraft> {
  const rawText = (draft.payload as { rawText?: string } | undefined)?.rawText;
  if (!rawText) return draft;

  try {
    const result = await requestWatchdogNormalizeRecord({
      title: draft.title,
      summary: rawText,
      connectorKey: draft.connectorKey,
      sourceKind: draft.sourceKind,
    });

    return {
      ...draft,
      category: mapAiCategory(result.category),
      summary: sanitizeRecordText(result.summary || draft.summary),
      officialHint:
        draft.officialHint ||
        (result.suggestedOfficialName
          ? {
              fullName: result.suggestedOfficialName,
              title: result.suggestedTitle || "Offentlig roll",
              authoritySlug: result.suggestedAuthoritySlug || "offentlig-sektor",
              authorityName: result.suggestedAuthoritySlug || "Offentlig sektor",
            }
          : undefined),
    };
  } catch {
    return draft;
  }
}

export async function resolveRecordDrafts(prisma: PrismaClient, drafts: NormalizedRecordDraft[]) {
  const resolved: NormalizedRecordDraft[] = [];

  for (const draft of drafts) {
    const enhanced = await maybeEnhanceDraftWithAi(draft);

    if (enhanced.officialId) {
      resolved.push(enhanced);
      continue;
    }

    if (enhanced.identity) {
      const identity = await prisma.officialIdentity.findUnique({
        where: {
          sourceKey_externalId: {
            sourceKey: enhanced.identity.sourceKey,
            externalId: enhanced.identity.externalId,
          },
        },
      });

      if (identity) {
        resolved.push({ ...enhanced, officialId: identity.officialId });
        continue;
      }
    }

    if (enhanced.officialHint) {
      const authority = await prisma.authority.upsert({
        where: { slug: enhanced.officialHint.authoritySlug },
        update: { name: enhanced.officialHint.authorityName },
        create: {
          name: enhanced.officialHint.authorityName,
          slug: enhanced.officialHint.authoritySlug,
          level: "Offentlig",
          region: "Nationell",
          category: AuthorityCategory.AGENCY,
          summary: `${enhanced.officialHint.authorityName} — offentlig aktör i övervakningspipelinen.`,
        },
      });

      const { official } = await upsertOfficialFromRow(
        prisma,
        {
          authorityName: enhanced.officialHint.authorityName,
          authoritySlug: enhanced.officialHint.authoritySlug,
          officialName: enhanced.officialHint.fullName,
          officialTitle: enhanced.officialHint.title,
          officialCategory: enhanced.officialHint.category,
          photoUrl: enhanced.officialHint.photoUrl,
          sourceKey: enhanced.identity?.sourceKey,
          externalId: enhanced.identity?.externalId,
          profileUrl: enhanced.identity?.profileUrl,
        },
        authority.id,
      );

      resolved.push({
        ...enhanced,
        officialId: official.id,
        authorityId: authority.id,
      });
      continue;
    }

    const matchName = enhanced.title;
    const candidates = await prisma.official.findMany({
      where: matchName
        ? { fullName: { contains: matchName.split(" ")[0], mode: "insensitive" } }
        : undefined,
      include: { authority: true },
      take: 12,
    });

    const best = candidates
      .map((candidate) => ({
        candidate,
        score:
          nameScore(candidate.fullName, matchName) +
          (enhanced.authorityId && candidate.authorityId === enhanced.authorityId ? 0.2 : 0),
      }))
      .sort((left, right) => right.score - left.score)[0];

    if (best && best.score >= 0.75) {
      resolved.push({
        ...enhanced,
        officialId: best.candidate.id,
        authorityId: best.candidate.authorityId,
      });
      continue;
    }

    if (enhanced.identity) {
      await prisma.ingestReviewItem.create({
        data: {
          connectorKey: enhanced.connectorKey,
          title: enhanced.title,
          summary: sanitizeRecordText(enhanced.summary),
          payload: enhanced.payload as Prisma.InputJsonValue | undefined,
          suggestedName: enhanced.title,
        },
      });
    }

    resolved.push(enhanced);
  }

  return resolved;
}

export async function queueUnmatchedRecord(
  prisma: PrismaClient,
  draft: NormalizedRecordDraft,
  suggestedName?: string,
) {
  await prisma.ingestReviewItem.create({
    data: {
      connectorKey: draft.connectorKey,
      title: draft.title,
      summary: sanitizeRecordText(draft.summary),
      payload: draft.payload as Prisma.InputJsonValue | undefined,
      suggestedName,
    },
  });
}
