#!/usr/bin/env bash
# Uploads a packaged extension to the Chrome Web Store (API v2) and submits it
# for review, publishing automatically once approved.
#
# Required env:
#   CWS_ACCESS_TOKEN   OAuth access token with the chromewebstore scope
#   CWS_PUBLISHER_ID   Developer Dashboard > Publisher > Settings
#   CWS_EXTENSION_ID   Store item ID
# Args:
#   $1  path to the zip
#   $2  expected manifest version (guards against uploading the wrong build)
#
# Safe to re-run: if this version is already published or submitted, it exits
# successfully without uploading again.
set -euo pipefail

ZIP="${1:?usage: publish-cws.sh <zip> <version>}"
VERSION="${2:?usage: publish-cws.sh <zip> <version>}"
: "${CWS_ACCESS_TOKEN:?CWS_ACCESS_TOKEN is required}"
: "${CWS_PUBLISHER_ID:?CWS_PUBLISHER_ID is required}"
: "${CWS_EXTENSION_ID:?CWS_EXTENSION_ID is required}"

API="${CWS_API_BASE:-https://chromewebstore.googleapis.com}"  # override for testing
ITEM="publishers/${CWS_PUBLISHER_ID}/items/${CWS_EXTENSION_ID}"
POLL_INTERVAL="${CWS_POLL_INTERVAL:-10}"
POLL_ATTEMPTS="${CWS_POLL_ATTEMPTS:-30}"

# curl wrapper: prints the body, fails loudly with the body on HTTP errors
api() {
  local method="$1" url="$2"; shift 2
  local body status
  body="$(mktemp)"
  status="$(curl -sS -o "$body" -w '%{http_code}' -X "$method" \
    -H "Authorization: Bearer ${CWS_ACCESS_TOKEN}" "$@" "$url")"
  if [[ "$status" -lt 200 || "$status" -ge 300 ]]; then
    echo "::error::$method $url returned HTTP $status" >&2
    cat "$body" >&2; echo >&2
    rm -f "$body"
    return 1
  fi
  cat "$body"; rm -f "$body"
}

fetch_status() { api GET "${API}/v2/${ITEM}:fetchStatus"; }

echo "Checking current store status..."
status="$(fetch_status)"
echo "$status" | jq .

if [[ "$(echo "$status" | jq -r '.takenDown // false')" == "true" ]]; then
  echo "::error::Item is taken down; resolve in the Developer Dashboard first." >&2
  exit 1
fi

published="$(echo "$status" | jq -r '[.publishedItemRevisionStatus.distributionChannels[]?.crxVersion] | join(",")')"
submitted="$(echo "$status" | jq -r '[.submittedItemRevisionStatus.distributionChannels[]?.crxVersion] | join(",")')"
submitted_state="$(echo "$status" | jq -r '.submittedItemRevisionStatus.state // empty')"

if [[ ",${published}," == *",${VERSION},"* ]]; then
  echo "v${VERSION} is already published. Nothing to do."
  exit 0
fi
if [[ ",${submitted}," == *",${VERSION},"* && "$submitted_state" != "REJECTED" && "$submitted_state" != "CANCELLED" ]]; then
  echo "v${VERSION} is already submitted (state: ${submitted_state}). Nothing to do."
  exit 0
fi

echo "Uploading ${ZIP} (v${VERSION})..."
upload="$(api POST "${API}/upload/v2/${ITEM}:upload" \
  -H "Content-Type: application/zip" --data-binary "@${ZIP}")"
echo "$upload" | jq .
state="$(echo "$upload" | jq -r '.uploadState // empty')"

# The reference docs call it IN_PROGRESS; the tutorial says UPLOAD_IN_PROGRESS
attempt=0
while [[ "$state" == "IN_PROGRESS" || "$state" == "UPLOAD_IN_PROGRESS" ]]; do
  attempt=$((attempt + 1))
  if (( attempt > POLL_ATTEMPTS )); then
    echo "::error::Upload still processing after $((POLL_ATTEMPTS * POLL_INTERVAL))s" >&2
    exit 1
  fi
  echo "Upload processing; checking again in ${POLL_INTERVAL}s (${attempt}/${POLL_ATTEMPTS})..."
  sleep "$POLL_INTERVAL"
  state="$(fetch_status | jq -r '.lastAsyncUploadState // empty')"
done

if [[ "$state" != "SUCCEEDED" ]]; then
  echo "::error::Upload did not succeed (uploadState: ${state:-missing})" >&2
  exit 1
fi

uploaded_version="$(echo "$upload" | jq -r '.crxVersion // empty')"
if [[ -n "$uploaded_version" && "$uploaded_version" != "$VERSION" ]]; then
  echo "::error::Store reports uploaded version ${uploaded_version}, expected ${VERSION}" >&2
  exit 1
fi

echo "Submitting for review..."
publish="$(api POST "${API}/v2/${ITEM}:publish" \
  -H "Content-Type: application/json" -d '{"publishType":"DEFAULT_PUBLISH"}')"
echo "$publish" | jq .

publish_state="$(echo "$publish" | jq -r '.state // empty')"
case "$publish_state" in
  PENDING_REVIEW|STAGED|PUBLISHED|PUBLISHED_TO_TESTERS)
    echo "v${VERSION} submitted (state: ${publish_state}). It goes live automatically once review passes."
    ;;
  *)
    echo "::error::Unexpected publish state: ${publish_state:-missing}" >&2
    exit 1
    ;;
esac

echo "$publish" | jq -r '.warningInfo.warnings[]? | "::warning::\(.reason): \(.description)"'
