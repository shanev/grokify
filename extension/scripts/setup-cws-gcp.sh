#!/usr/bin/env bash
# One-time setup so GitHub Actions can publish to the Chrome Web Store without
# any stored keys (Workload Identity Federation). Safe to re-run.
#
# Usage: extension/scripts/setup-cws-gcp.sh <gcp-project-id> [cws-publisher-id]
#
# Creates in the given Google Cloud project:
#   - Chrome Web Store API enabled
#   - service account  grokify-cws-publisher@<project>.iam.gserviceaccount.com
#   - workload identity pool "github" + provider "grokify", which only accepts
#     tokens from this repo's chrome-web-store environment
# And in GitHub:
#   - the chrome-web-store environment, restricted to v* tags
#   - the environment variables release.yml reads
#
# Afterwards, one manual step: add the service account email in the Chrome Web
# Store Developer Dashboard (Account section). See RELEASING.md.
set -euo pipefail

PROJECT_ID="${1:?usage: setup-cws-gcp.sh <gcp-project-id> [cws-publisher-id]}"
PUBLISHER_ID="${2:-}"
REPO="shanev/grokify"
REPO_ID="1085345882" # immutable; guards against repo rename/re-creation
ENVIRONMENT="chrome-web-store"
EXTENSION_ID="mgmilhggbecipldajclmdlndcamjjmia"
SA_NAME="grokify-cws-publisher"
POOL="github"
PROVIDER="grokify"

SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
gc() { gcloud --project "$PROJECT_ID" --quiet "$@"; }

echo "→ Enabling APIs"
gc services enable chromewebstore.googleapis.com iamcredentials.googleapis.com \
  sts.googleapis.com iam.googleapis.com

echo "→ Service account"
gc iam service-accounts describe "$SA_EMAIL" >/dev/null 2>&1 ||
  gc iam service-accounts create "$SA_NAME" \
    --display-name "Grokify Chrome Web Store publisher (GitHub Actions)"

echo "→ Workload identity pool and provider"
gc iam workload-identity-pools describe "$POOL" --location global >/dev/null 2>&1 ||
  gc iam workload-identity-pools create "$POOL" --location global \
    --display-name "GitHub Actions"

CONDITION="assertion.repository_id == '${REPO_ID}' && assertion.sub == 'repo:${REPO}:environment:${ENVIRONMENT}'"
if gc iam workload-identity-pools providers describe "$PROVIDER" \
  --location global --workload-identity-pool "$POOL" >/dev/null 2>&1; then
  gc iam workload-identity-pools providers update-oidc "$PROVIDER" \
    --location global --workload-identity-pool "$POOL" \
    --attribute-condition "$CONDITION"
else
  gc iam workload-identity-pools providers create-oidc "$PROVIDER" \
    --location global --workload-identity-pool "$POOL" \
    --display-name "grokify releases" \
    --issuer-uri "https://token.actions.githubusercontent.com" \
    --attribute-mapping "google.subject=assertion.sub,attribute.repository_id=assertion.repository_id" \
    --attribute-condition "$CONDITION"
fi

POOL_ID="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}"
PROVIDER_ID="${POOL_ID}/providers/${PROVIDER}"

echo "→ Allowing the release job to act as the service account"
gc iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --role roles/iam.workloadIdentityUser \
  --member "principal://iam.googleapis.com/${POOL_ID}/subject/repo:${REPO}:environment:${ENVIRONMENT}" \
  >/dev/null

echo "→ GitHub environment ${ENVIRONMENT} (v* tags only)"
gh api -X PUT "repos/${REPO}/environments/${ENVIRONMENT}" --input - >/dev/null <<JSON
{"deployment_branch_policy": {"protected_branches": false, "custom_branch_policies": true}}
JSON
gh api "repos/${REPO}/environments/${ENVIRONMENT}/deployment-branch-policies" \
  -q '.branch_policies[] | select(.type == "tag") | .name' | grep -qxF 'v*' ||
  gh api -X POST "repos/${REPO}/environments/${ENVIRONMENT}/deployment-branch-policies" \
    -f name='v*' -f type=tag >/dev/null

setvar() { gh variable set "$1" --repo "$REPO" --env "$ENVIRONMENT" --body "$2"; }
setvar GCP_WORKLOAD_IDENTITY_PROVIDER "$PROVIDER_ID"
setvar GCP_SERVICE_ACCOUNT "$SA_EMAIL"
setvar CWS_EXTENSION_ID "$EXTENSION_ID"
[[ -n "$PUBLISHER_ID" ]] && setvar CWS_PUBLISHER_ID "$PUBLISHER_ID"

cat <<DONE

✅ Google Cloud and GitHub are set up.

Remaining manual step (Google doesn't expose an API for it):
  1. Open https://chrome.google.com/webstore/devconsole/ → Account
  2. Under "Service account", add: ${SA_EMAIL}
DONE
if [[ -z "$PUBLISHER_ID" ]]; then
  cat <<'DONE'
  3. Copy your publisher ID (Publisher → Settings) and run:
       gh variable set CWS_PUBLISHER_ID --repo shanev/grokify --env chrome-web-store --body <id>
DONE
fi
