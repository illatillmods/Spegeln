import {
  getConfidenceBoard,
  listAuthorityFailureReports,
  listReverseSurveillance,
  listWikiPages,
} from "@/lib/civic-features";
import { getWatchdogAuthorities, getWatchdogSnapshot } from "@/lib/watchdog";
import { FrontPageLiveClient } from "./FrontPageLiveClient";

export default async function HomePage() {
  const [initialReports, initialVideos, confidenceBoard, wikiPages, snapshot, authorities] = await Promise.all([
    listAuthorityFailureReports(8),
    listReverseSurveillance(6),
    getConfidenceBoard(6),
    listWikiPages(6),
    getWatchdogSnapshot(),
    getWatchdogAuthorities(),
  ]);

  return (
    <FrontPageLiveClient
      authorities={authorities}
      confidenceBoard={confidenceBoard}
      initialReports={initialReports}
      initialVideos={initialVideos}
      snapshot={snapshot}
      wikiPages={wikiPages}
    />
  );
}