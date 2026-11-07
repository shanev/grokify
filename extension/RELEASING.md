# Releasing Grokify

## Cutting a release

From an up-to-date, clean `main`:

```bash
cd extension
bun run release minor   # or patch, major, or an exact x.y.z
```

This bumps `package.json`, runs unit tests, builds, refreshes the
`website/grokify-extension.zip` download, commits `release: vX.Y.Z`, tags
`vX.Y.Z`, and pushes. Use `--no-push` to stop before pushing.

The tag starts the [Release workflow](../.github/workflows/release.yml):

1. **test**: typecheck, unit, and e2e tests (same as PR CI)
2. **package**: checks the tag matches `package.json`, builds the zip, and
   creates the GitHub Release with the zip attached
3. **publish-chrome**: uploads to the Chrome Web Store and submits for review.
   The update goes live automatically once Google approves it, usually within
   a few days.

If a job fails, fix the cause and use **Re-run failed jobs** on the run.
Publishing is idempotent: it skips the upload if that version is already
submitted or published.

## One-time Chrome Web Store setup

Publishing uses the Chrome Web Store API v2 with keyless auth (Workload
Identity Federation). GitHub Actions exchanges its OIDC token for a short-lived
Google token scoped to the Web Store. No keys are stored in GitHub.

1. Pick or create a Google Cloud project, then run:

   ```bash
   extension/scripts/setup-cws-gcp.sh <gcp-project-id> [cws-publisher-id]
   ```

   It enables the API, creates the `grokify-cws-publisher` service account and
   the identity pool/provider, creates the `chrome-web-store` GitHub environment
   (restricted to `v*` tags), and sets its variables. It is safe to re-run.

2. In the [Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   under **Account**, add the service account email the script prints. Only
   one service account can be linked per publisher.

3. If you didn't pass a publisher ID in step 1, copy it from **Publisher >
   Settings** and set it:

   ```bash
   gh variable set CWS_PUBLISHER_ID --repo shanev/grokify --env chrome-web-store --body <id>
   ```

Optional: add yourself as a required reviewer on the `chrome-web-store`
environment (repo **Settings > Environments**) to approve each store
submission by hand.

### Environment variables (`chrome-web-store`)

| Variable | Value |
| --- | --- |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/<number>/locations/global/workloadIdentityPools/github/providers/grokify` |
| `GCP_SERVICE_ACCOUNT` | `grokify-cws-publisher@<project>.iam.gserviceaccount.com` |
| `CWS_PUBLISHER_ID` | From the Developer Dashboard |
| `CWS_EXTENSION_ID` | `mgmilhggbecipldajclmdlndcamjjmia` |

### Publishing by hand

`scripts/publish-cws.sh <zip> <version>` works locally with a token from
`gcloud auth print-access-token --impersonate-service-account=<sa-email>
--scopes=https://www.googleapis.com/auth/chromewebstore` (requires
`roles/iam.serviceAccountTokenCreator` on the service account).
