#!/usr/bin/env bash
set -euo pipefail

BACKEND_URL="${BACKEND_URL:-https://spegeln-production.up.railway.app}"
CRON_SECRET="${CRON_SECRET:?CRON_SECRET must be set}"

curl -fsS -X POST "${BACKEND_URL%/}/api/admin/watchdog/ingest-cron" \
  -H "x-cron-secret: ${CRON_SECRET}"

echo ""
echo "Watchdog ingest cron completed at $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
