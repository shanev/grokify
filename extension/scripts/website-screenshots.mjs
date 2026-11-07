#!/usr/bin/env node
/**
 * Regenerates the product screenshots used on grokify.app from the real
 * extension build. Run from extension/:
 *
 *   pnpm build && node scripts/website-screenshots.mjs
 *
 * Writes WebP images to ../website/assets/shots/, the share card to
 * ../website/assets/og.png, and prints the live values
 * (badge count, tooltip text) that the site's copy refers to.
 */
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { chromium } from "@playwright/test"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const EXTENSION_PATH = path.resolve(HERE, "../build/chrome-mv3-prod")
const OUT_DIR = path.resolve(HERE, "../../website/assets/shots")
const TMP_DIR = fs.mkdtempSync(path.join(fs.realpathSync("/tmp"), "grokify-shots-"))

// Served at an HTTPS URL via interception so the content script runs on it
const ARTICLE_URL = "https://fieldnotes.example/machines-that-taught-us"
const ARTICLE_HTML = fs.readFileSync(path.join(HERE, "screenshot-pages/article.html"), "utf8")

function toWebp(pngPath, name) {
  const out = path.join(OUT_DIR, `${name}.webp`)
  execFileSync("cwebp", ["-quiet", "-q", "86", "-m", "6", pngPath, "-o", out])
  const kb = Math.round(fs.statSync(out).size / 1024)
  console.log(`  ${path.relative(process.cwd(), out)} (${kb}KB)`)
}

async function shoot(locatorOrPage, name, opts = {}) {
  const png = path.join(TMP_DIR, `${name}.png`)
  await locatorOrPage.screenshot({ path: png, ...opts })
  toWebp(png, name)
}

if (!fs.existsSync(path.join(EXTENSION_PATH, "manifest.json"))) {
  console.error(`No build at ${EXTENSION_PATH}. Run \`pnpm build\` first.`)
  process.exit(1)
}
fs.mkdirSync(OUT_DIR, { recursive: true })

const context = await chromium.launchPersistentContext("", {
  channel: "chromium",
  viewport: { width: 1200, height: 760 },
  deviceScaleFactor: 2,
  args: [
    `--disable-extensions-except=${EXTENSION_PATH}`,
    `--load-extension=${EXTENSION_PATH}`
  ]
})
await context.route(ARTICLE_URL, (route) =>
  route.fulfill({ contentType: "text/html; charset=utf-8", body: ARTICLE_HTML })
)
const worker =
  context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"))
const extensionId = new URL(worker.url()).host

// 1. The article, with live markers
const article = await context.newPage()
await article.goto(ARTICLE_URL)
await article.locator('a[data-grokified="true"]').first().waitFor({ state: "attached" })
await article.waitForTimeout(800) // let the badge throttle settle

const badge = await worker.evaluate(async (url) => {
  const [tab] = await chrome.tabs.query({ url })
  return chrome.action.getBadgeText({ tabId: tab.id })
}, ARTICLE_URL)
const tooltip = await article.locator("#p1 a").nth(2).getAttribute("title")
const firstHref = await article.locator("#p2 a").first().getAttribute("href")

console.log("Writing screenshots:")
await shoot(article, "article")
await shoot(article.locator("#p1"), "markers-closeup", { scale: "device" })

// 2. The popup, reading the real count from the article tab. The popup asks
// the *active* tab for its count; as a standalone page it would be the active
// tab itself, so point its tab query at the article instead.
const popup = await context.newPage()
await popup.setViewportSize({ width: 420, height: 480 })
await popup.addInitScript((url) => {
  const query = chrome.tabs.query.bind(chrome.tabs)
  chrome.tabs.query = (_q, cb) => query({ url }, cb)
}, ARTICLE_URL)
await popup.goto(`chrome-extension://${extensionId}/popup.html`)
await popup.getByText(/links? replaced/).waitFor()
await popup.waitForFunction(() => /[1-9]/.test(document.body.innerText))
await shoot(popup.locator('div[style*="width: 320px"]').first(), "popup")

// 3. Social share card (og:image), composed from the screenshot above
const og = await context.newPage()
await og.setViewportSize({ width: 1200, height: 630 })
await og.goto(`file://${path.join(HERE, "screenshot-pages/og.html")}`, { waitUntil: "networkidle" })
await og.evaluate(() => document.fonts.ready)
const ogPath = path.resolve(OUT_DIR, "../og.png")
await og.screenshot({ path: ogPath, scale: "css" })
console.log(`  ${path.relative(process.cwd(), ogPath)} (${Math.round(fs.statSync(ogPath).size / 1024)}KB)`)

console.log("\nLive values:")
console.log(JSON.stringify({ badge, tooltip, firstHref }, null, 2))

await context.close()
fs.rmSync(TMP_DIR, { recursive: true, force: true })
