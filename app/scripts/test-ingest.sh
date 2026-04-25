#!/usr/bin/env bash
# Quick smoke test for the Phase 2 API endpoints.
# Run from the app/ directory. Reads INGEST_SHARED_SECRET from .env.local.
#
# Usage:
#   cd app && bash scripts/test-ingest.sh
#
# Requires `pnpm dev` to be running in another terminal.

set -uo pipefail   # NOT -e — we want to see curl errors before we abort

# Resolve the right hostname:
# - In WSL: 127.0.0.1 is WSL's own loopback, not Windows. Use host.docker.internal.
# - Elsewhere (Git Bash, macOS, Linux): 127.0.0.1 is the right loopback.
if [ -z "${APP_BASE_URL:-}" ]; then
  if grep -qi microsoft /proc/version 2>/dev/null; then
    BASE="http://host.docker.internal:3000"
  else
    BASE="http://127.0.0.1:3000"
  fi
else
  BASE="$APP_BASE_URL"
fi
SECRET=$(grep '^INGEST_SHARED_SECRET=' .env.local | cut -d= -f2- || true)

if [ -z "$SECRET" ]; then
  echo "ERROR: INGEST_SHARED_SECRET not found in .env.local"
  exit 1
fi

echo "==> Using BASE=$BASE"
echo "==> Using SECRET=***${SECRET: -4} (last 4 chars)"
echo ""

echo "==> [1/3] GET $BASE/api/health"
HEALTH=$(curl -sS --max-time 10 -w "\n[HTTP %{http_code}]\n" "$BASE/api/health" 2>&1)
HEALTH_EXIT=$?
echo "$HEALTH"
if [ $HEALTH_EXIT -ne 0 ]; then
  echo ""
  echo "FAILED: curl could not reach $BASE/api/health (exit code $HEALTH_EXIT)"
  echo "Check that 'pnpm dev' is running in another terminal and listening on port 3000."
  exit 1
fi
echo ""

echo "==> [2/3] POST $BASE/api/ai/extract"
EXTRACT_RESULT=$(curl -sS --max-time 60 -w "\n[HTTP %{http_code}]\n" -X POST "$BASE/api/ai/extract" \
  -H "Content-Type: application/json" \
  -H "X-Ingest-Secret: $SECRET" \
  -d '{
    "text": "Product Management Internship at Acme Corp. Join our payments team for a 10-week summer internship in Bangalore. Stipend: 50,000 INR/month. Deadline to apply: 30 June 2026. Open to pre-final year students.",
    "source_url": "https://example.com/acme-pm-intern",
    "hint": "Test smoke run"
  }' 2>&1)
EXTRACT_EXIT=$?
echo "$EXTRACT_RESULT"
if [ $EXTRACT_EXIT -ne 0 ]; then
  echo "FAILED: curl exit $EXTRACT_EXIT"
  exit 1
fi
echo ""

# Strip the "[HTTP 200]" suffix to get clean JSON
CLEAN_JSON=$(echo "$EXTRACT_RESULT" | sed '/^\[HTTP/d')

# Parse with python3 (bundled in WSL / most distros). If missing, guide the user.
if ! command -v python3 >/dev/null 2>&1; then
  echo "FAILED: python3 not found. Install it (WSL: sudo apt install -y python3) or edit this script to use another JSON parser."
  exit 1
fi

HAS_OPP=$(echo "$CLEAN_JSON" | python3 -c "import sys, json
try:
  print('yes' if json.load(sys.stdin).get('opportunity') else 'no')
except Exception:
  print('parse-error')")

if [ "$HAS_OPP" != "yes" ]; then
  echo "FAILED: /api/ai/extract did not return an opportunity. Got: $CLEAN_JSON"
  exit 1
fi

OPPORTUNITY=$(echo "$CLEAN_JSON" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin)['opportunity']))")

echo "==> [3/3] POST $BASE/api/ingest/upsert"
curl -sS --max-time 15 -w "\n[HTTP %{http_code}]\n" -X POST "$BASE/api/ingest/upsert" \
  -H "Content-Type: application/json" \
  -H "X-Ingest-Secret: $SECRET" \
  -d "{
    \"opportunity\": $OPPORTUNITY,
    \"source_url\": \"https://example.com/acme-pm-intern\",
    \"source_name\": \"Manual Admin Entry\"
  }"
echo ""
echo "==> Done. Refresh http://localhost:3000 to see the new 'Acme Corp' opportunity in your feed."
