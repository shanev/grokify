import fs from "node:fs"
import path from "node:path"

import {
  chromium,
  test as base,
  type BrowserContext,
  type Page,
  type Worker
} from "@playwright/test"

const EXTENSION_PATH = path.resolve(__dirname, "../build/chrome-mv3-prod")
const PAGES_DIR = path.resolve(__dirname, "pages")

// The content script only matches https://*/*, so fixture pages are served
// at real-looking HTTPS URLs via request interception. Nothing hits the network.
export const FIXTURE_URLS = {
  blog: "https://blog.example.test/post",
  wikipedia: "https://en.wikipedia.org/wiki/Test_Article"
} as const

const FIXTURE_FILES: Record<string, string> = {
  [FIXTURE_URLS.blog]: "blog.html",
  [FIXTURE_URLS.wikipedia]: "wikipedia.html"
}

type Fixtures = {
  context: BrowserContext
  serviceWorker: Worker
  extensionId: string
}

export const test = base.extend<Fixtures>({
  context: async ({}, use) => {
    if (!fs.existsSync(path.join(EXTENSION_PATH, "manifest.json"))) {
      throw new Error(
        `No extension build at ${EXTENSION_PATH}. Run \`pnpm build\` first (or use \`pnpm test:e2e\`).`
      )
    }

    // "chromium" channel = full Chromium in new headless mode, which supports
    // extensions (the default headless shell does not).
    const context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`
      ]
    })

    await context.route("https://**/*", async (route) => {
      const file = FIXTURE_FILES[route.request().url()]
      if (file) {
        await route.fulfill({
          contentType: "text/html; charset=utf-8",
          body: fs.readFileSync(path.join(PAGES_DIR, file), "utf8")
        })
      } else {
        await route.fulfill({ status: 404, body: "" })
      }
    })

    await use(context)
    await context.close()
  },

  serviceWorker: async ({ context }, use) => {
    const worker =
      context.serviceWorkers()[0] ??
      (await context.waitForEvent("serviceworker"))
    await use(worker)
  },

  extensionId: async ({ serviceWorker }, use) => {
    await use(new URL(serviceWorker.url()).host)
  }
})

export const expect = test.expect

/** Badge text the extension set for the tab showing `url`. */
export function getBadgeText(serviceWorker: Worker, url: string) {
  return serviceWorker.evaluate(async (tabUrl) => {
    // Host permissions let the extension match tabs by URL without "tabs"
    const [tab] = await chrome.tabs.query({ url: tabUrl })
    if (tab?.id === undefined) throw new Error(`No tab for ${tabUrl}`)
    return chrome.action.getBadgeText({ tabId: tab.id })
  }, url)
}

/** Computed ::after content of a link: '"G"' when marked, 'none' otherwise. */
export function markerContent(page: Page, selector: string) {
  return page
    .locator(selector)
    .evaluate((el) => getComputedStyle(el, "::after").content)
}

/** Waits until the content script has processed the page's links. */
export async function waitForGrokify(page: Page) {
  await expect(page.locator('a[data-grokified="true"]').first()).toBeAttached()
}
