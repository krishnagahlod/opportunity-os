#!/usr/bin/env bash
# Quick smoke test for the Phase 2 API endpoints.
# Run from the app/ directory. Reads INGEST_SHARED_SECRET from .env.local.
#
# Usage:
#   cd app && bash scripts/test-ingest.sh
#
# Requires the dev server running: pnpm dev

set -euo pipefail

BASE="${APP_BASE_URL:-http://localhost:3000}"
SECRET=$(grep '^INGEST_SHARED_SECRET=' .env.local | cut -d= -f2-)

if [ -z "$SECRET" ]; then
  echo "ERROR: INGEST_SHARED_SECRET not found in .env.local"
  exit 1
fi

echo "==> GET /api/health"
curl -s "$BASE/api/health" | head -c 200
echo -e "\n"

echo "==> POST /api/ai/extract (should call Gemini/Groq and return structured JSON)"
EXTRACT_RESULT=$(curl -s -X POST "$BASE/api/ai/extract" \
  -H "Content-Type: application/json" \
  -H "X-Ingest-Secret: $SECRET" \
  -d '{
    "text": "Product Management Internship at Acme Corp. Join our payments team for a 10-week summer internship in Bangalore. Stipend: 50,000 INR/month. Deadline to apply: 30 June 2026. Open to pre-final year students.",
    "source_url": "https://example.com/acme-pm-intern",
    "hint": "Test smoke run"
  }')
echo "$EXTRACT_RESULT" | head -c 800
echo -e "\n"

echo "==> Extract the opportunity object and POST to /api/ingest/upsert"
OPPORTUNITY=$(echo "$EXTRACT_RESULT" | node -e "process.stdin.on('data', d => { const j = JSON.parse(d.toString()); process.stdout.write(JSON.stringify(j.opportunity)); })")

if [ -z "$OPPORTUNITY" ]; then
  echo "ERROR: AI extract did not return an opportunity. Abort."
  exit 1
fi

curl -s -X POST "$BASE/api/ingest/upsert" \
  -H "Content-Type: application/json" \
  -H "X-Ingest-Secret: $SECRET" \
  -d "{
    \"opportunity\": $OPPORTUNITY,
    \"source_url\": \"https://example.com/acme-pm-intern\",
    \"source_name\": \"Manual Admin Entry\"
  }"
echo -e "\n"

echo "==> Done. Check Supabase opportunities table or http://localhost:3000 for the new row."
