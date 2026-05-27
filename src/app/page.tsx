import type { ConfidenceBoardEntry, FailureReportView, ReverseSurveillanceView, WikiPageView } from "@/lib/civic-features";
import type { WatchAuthorityCard, WatchdogSnapshot, WatchPublicRecordFeedItem } from "@/lib/watchdog";
import { serverApiJsonSafe } from "@/lib/server-api";
import { FrontPageLiveClient } from "./FrontPageLiveClient";

const emptySnapshot: WatchdogSnapshot = {
  totalTrackedRecords: 0,
  officialsCovered: 0,
  authoritiesCovered: 0,
  publishedReports: 0,
  liveAlerts: 0,
  dailySyncCoverage: "Anslut databasen och kör seed för att se live-signaler.",
  publicSourceFamilies: [],
  guardrails: [],
};

export default async function HomePage() {
  const [reportsResponse, videosResponse, boardResponse, wikiResponse, snapshotResponse, authoritiesResponse, feedResponse] = await Promise.all([
    serverApiJsonSafe<{ items: FailureReportView[] }>("/api/myndighetsgranskaren/reports", { items: [] }),
    serverApiJsonSafe<{ items: ReverseSurveillanceView[] }>("/api/reverse-surveillance/submissions", { items: [] }),
    serverApiJsonSafe<{ items: ConfidenceBoardEntry[] }>("/api/folkets-domstol/board", { items: [] }),
    serverApiJsonSafe<{ items: WikiPageView[] }>("/api/statens-svagheter/pages", { items: [] }),
    serverApiJsonSafe<{ snapshot: WatchdogSnapshot }>("/api/watchdog/snapshot", { snapshot: emptySnapshot }),
    serverApiJsonSafe<{ items: WatchAuthorityCard[] }>("/api/watchdog/authorities", { items: [] }),
    serverApiJsonSafe<{ items: WatchPublicRecordFeedItem[] }>("/api/watchdog/feed", { items: [] }),
  ]);

  return (
    <FrontPageLiveClient
      apiReady={reportsResponse.ok && snapshotResponse.ok}
      authorities={authoritiesResponse.data.items}
      confidenceBoard={boardResponse.data.items}
      initialReports={reportsResponse.data.items}
      initialVideos={videosResponse.data.items}
      snapshot={snapshotResponse.data.snapshot}
      watchdogFeed={feedResponse.data.items}
      wikiPages={wikiResponse.data.items}
    />
  );
}