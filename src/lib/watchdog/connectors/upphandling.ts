import { AuthorityCategory, PublicRecordCategory, SourceKind } from "@prisma/client";
import type { ConnectorContext, WatchdogConnector } from "@/lib/watchdog/connectors/base";
import type { NormalizedRecordDraft } from "@/lib/watchdog/records";
import { sanitizeRecordText } from "@/lib/watchdog/records";

const CONNECTOR_KEY = "upphandling";

type ProcurementSeed = {
  id: string;
  title: string;
  buyer: string;
  buyerSlug: string;
  amount: string;
  date: string;
  sourceUrl: string;
};

const PROCUREMENT_FEED: ProcurementSeed[] = [
  {
    id: "proc-1",
    title: "Ramavtal IT-drift offentlig sektor",
    buyer: "Kammarkollegiet",
    buyerSlug: "kammarkollegiet",
    amount: "45000000",
    date: "2025-09-18",
    sourceUrl: "https://www.kammarkollegiet.se/upphandling",
  },
  {
    id: "proc-2",
    title: "Säkerhetslösningar för polismyndigheten",
    buyer: "Polismyndigheten",
    buyerSlug: "polismyndigheten",
    amount: "12800000",
    date: "2025-08-02",
    sourceUrl: "https://polisen.se/om-polisen/upphandling/",
  },
];

export const upphandlingConnector: WatchdogConnector = {
  key: CONNECTOR_KEY,
  label: "Upphandling",
  async run(context: ConnectorContext) {
    const drafts: NormalizedRecordDraft[] = [];

    for (const item of PROCUREMENT_FEED) {
      await context.prisma.authority.upsert({
        where: { slug: item.buyerSlug },
        update: { name: item.buyer },
        create: {
          name: item.buyer,
          slug: item.buyerSlug,
          level: "Myndighet",
          region: "Nationell",
          category: AuthorityCategory.AGENCY,
          summary: `${item.buyer} — offentlig upphandlande myndighet.`,
        },
      });

      drafts.push({
        connectorKey: CONNECTOR_KEY,
        category: PublicRecordCategory.PROCUREMENT,
        title: item.title,
        summary: sanitizeRecordText(
          `${item.buyer} annonserade upphandling "${item.title}" med uppskattat värde ${Number(item.amount).toLocaleString("sv-SE")} kr.`,
        ),
        occurredAt: new Date(item.date),
        sourceKind: SourceKind.PROCUREMENT,
        sourceUrl: item.sourceUrl,
        sourceRecordId: item.id,
        legalBasis: "Offentlig upphandlingsannons",
        payload: {
          buyer: item.buyer,
          amount: item.amount,
        },
      });
    }

    return drafts;
  },
};
