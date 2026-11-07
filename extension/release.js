#!/usr/bin/env bun

/**
 * Cuts a Grokify release.
 *
 * Usage: bun run release <patch|minor|major|x.y.z> [--no-push]
 *
 * 1. Checks you're on an up-to-date, clean main
 * 2. Bumps the version in package.json
 * 3. Runs unit tests, builds, and zips the extension
 * 4. Copies the zip to website/ (the site's direct download)
 * 5. Commits "release: vX.Y.Z", tags vX.Y.Z, and pushes both
 *
 * Pushing the tag triggers .github/workflows/release.yml, which runs the full
 * test suite, creates the GitHub Release, and submits to the Chrome Web Store.
 * See RELEASING.md.
 */

const { execFileSync } = require("child_process")
const fs = require("fs")
const path = require("path")

const ROOT = __dirname
const PACKAGE_JSON = path.join(ROOT, "package.json")
const BUILD_DIR = path.join(ROOT, "build", "chrome-mv3-prod")
const ZIP_NAME = "grokify-extension.zip"
const ZIP_PATH = path.join(ROOT, ZIP_NAME)
const WEBSITE_ZIP = path.join(ROOT, "..", "website", ZIP_NAME)

// Arguments are passed as arrays (no shell), so nothing is ever interpolated
const run = (file, args, opts = {}) =>
  execFileSync(file, args, { cwd: ROOT, stdio: "inherit", ...opts })
const read = (file, args) =>
  execFileSync(file, args, { cwd: ROOT, encoding: "utf8" }).trim()
const git = (...args) => run("git", args)
const gitRead = (...args) => read("git", args)

function fail(message) {
  console.error(`❌ ${message}`)
  process.exit(1)
}

function nextVersion(current, bump) {
  if (/^\d+\.\d+\.\d+$/.test(bump)) return bump
  const [major, minor, patch] = current.split(".").map(Number)
  switch (bump) {
    case "major":
      return `${major + 1}.0.0`
    case "minor":
      return `${major}.${minor + 1}.0`
    case "patch":
      return `${major}.${minor}.${patch + 1}`
    default:
      fail(`Unknown bump "${bump}". Use patch, minor, major, or x.y.z.`)
  }
}

function isNewer(a, b) {
  const pa = a.split(".").map(Number)
  const pb = b.split(".").map(Number)
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] > pb[i]
  }
  return false
}

const args = process.argv.slice(2)
const push = !args.includes("--no-push")
const bump = args.find((a) => !a.startsWith("--"))
if (!bump) fail("Usage: bun run release <patch|minor|major|x.y.z> [--no-push]")

// 1. Preflight
if (gitRead("rev-parse", "--abbrev-ref", "HEAD") !== "main") {
  fail("Releases are cut from main.")
}
if (gitRead("status", "--porcelain")) {
  fail("Working tree is not clean.")
}
git("fetch", "--quiet", "--tags", "origin", "main")
if (gitRead("rev-parse", "HEAD") !== gitRead("rev-parse", "origin/main")) {
  fail("Local main differs from origin/main. Pull or push first.")
}

// 2. Bump
const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf8"))
const version = nextVersion(pkg.version, bump)
const tag = `v${version}`
if (!isNewer(version, pkg.version)) {
  fail(`${version} is not newer than ${pkg.version}.`)
}
if (gitRead("tag", "--list", tag)) fail(`Tag ${tag} already exists.`)

console.log(`🚀 Releasing ${pkg.version} → ${version}\n`)
pkg.version = version
fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + "\n")

try {
  // 3. Test, build, zip
  console.log("🧪 Running unit tests...")
  run("bun", ["run", "test"])

  console.log("\n📦 Building...")
  run("bun", ["run", "build"])
  const manifestPath = path.join(BUILD_DIR, "manifest.json")
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Build output not found at ${BUILD_DIR}`)
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  if (manifest.version !== version) {
    throw new Error(`Built manifest is ${manifest.version}, expected ${version}`)
  }

  console.log("\n🗜️  Zipping...")
  fs.rmSync(ZIP_PATH, { force: true })
  run("zip", ["-qr", ZIP_PATH, "."], { cwd: BUILD_DIR })
  console.log(`✅ ${ZIP_NAME}: ${Math.round(fs.statSync(ZIP_PATH).size / 1024)}KB`)

  // 4. Website download
  fs.copyFileSync(ZIP_PATH, WEBSITE_ZIP)
  console.log("✅ Copied to website/\n")
} catch (error) {
  // Leave the repo as we found it
  git("checkout", "--", "package.json", WEBSITE_ZIP)
  fail(error.message)
}

// 5. Commit, tag, push
git("add", "package.json", WEBSITE_ZIP)
git("commit", "--quiet", "-m", `release: ${tag}`)
git("tag", "-a", tag, "-m", tag)

if (push) {
  git("push", "--atomic", "origin", "main", tag)
  console.log(`\n🎉 ${tag} pushed. Follow the release with:`)
  console.log("   gh run watch $(gh run list --workflow release.yml -L1 --json databaseId -q '.[0].databaseId')")
} else {
  console.log(`\n✅ ${tag} committed and tagged locally. Push with:`)
  console.log(`   git push --atomic origin main ${tag}`)
}
