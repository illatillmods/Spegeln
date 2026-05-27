#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

SKIP_AI=false
for arg in "$@"; do
  if [[ "$arg" == "--no-ai" ]]; then
    SKIP_AI=true
  fi
done

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

AI_WORKER_CMD=""
if [[ "$SKIP_AI" == true ]]; then
  echo "Skipping AI worker (--no-ai)."
elif ! command -v python3 >/dev/null 2>&1; then
  echo "Note: python3 not found — starting without AI worker."
  echo "      Install: brew install python"
  echo "      Or run:  npm run dev:app"
elif ! python3 -m pip --version >/dev/null 2>&1; then
  echo "Note: pip not found — starting without AI worker."
  echo "      Install: brew install python"
  echo "      Or run:  npm run dev:app"
elif ! python3 -c "import uvicorn" >/dev/null 2>&1; then
  echo "Note: uvicorn not installed — starting without AI worker."
  echo "      Run once: python3 -m pip install -r ai-worker/requirements.txt"
  echo "      Or run:   npm run dev:app"
else
  AI_WORKER_CMD="npm run ai:worker:dev"
fi

cleanup() {
  echo ""
  echo "Stopping dev services..."
  local pid
  for pid in $(jobs -p); do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo "Starting Spegeln dev stack from $ROOT"
echo "  Backend  → http://127.0.0.1:4000"
echo "  Frontend → http://localhost:3000"
if [[ -n "$AI_WORKER_CMD" ]]; then
  echo "  AI worker→ http://localhost:8001"
else
  echo "  AI worker→ skipped (skatteplanering, AI-triage etc. need Railway worker or local Python)"
fi
echo "Press Ctrl+C to stop all services."
echo ""

npm run backend:dev &
if [[ -n "$AI_WORKER_CMD" ]]; then
  eval "$AI_WORKER_CMD" &
fi
npm run dev &

wait
