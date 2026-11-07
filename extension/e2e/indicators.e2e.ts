import {
  expect,
  FIXTURE_URLS,
  getBadgeText,
  markerContent,
  test,
  waitForGrokify
} from "./fixtures"

test.describe("on a non-Wikipedia site", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FIXTURE_URLS.blog)
    await waitForGrokify(page)
  })

  test("rewrites Wikipedia links and keeps the original URL", async ({
    page
  }) => {
    await expect(page.locator("#plain")).toHaveAttribute(
      "href",
      "https://grokipedia.com/page/Alan_Turing"
    )
    await expect(page.locator("#plain")).toHaveAttribute(
      "data-grokify-original",
      "https://en.wikipedia.org/wiki/Alan_Turing"
    )
    await expect(page.locator("#mobile")).toHaveAttribute(
      "href",
      "https://grokipedia.com/page/S%C3%A3o_Paulo#History"
    )
    await expect(page.locator("#unrelated")).toHaveAttribute(
      "href",
      "https://example.com/about"
    )
    await expect(page.locator("#unrelated")).not.toHaveAttribute(
      "data-grokified",
      /.*/
    )
  })

  test("adds a tooltip naming the original URL", async ({ page }) => {
    await expect(page.locator("#plain")).toHaveAttribute(
      "title",
      "Grokify: opens on Grokipedia (was en.wikipedia.org/wiki/Alan_Turing)"
    )
    await expect(page.locator("#titled")).toHaveAttribute(
      "title",
      "Ada Lovelace\nGrokify: opens on Grokipedia (was en.wikipedia.org/wiki/Ada_Lovelace)"
    )
    await expect(page.locator("#mobile")).toHaveAttribute(
      "title",
      "Grokify: opens on Grokipedia (was en.m.wikipedia.org/wiki/São_Paulo#History)"
    )
  })

  test("marks text links but not image links", async ({ page }, testInfo) => {
    expect(await markerContent(page, "#plain")).toBe('"G"')
    expect(await markerContent(page, "#titled")).toBe('"G"')
    expect(await markerContent(page, "#image")).toBe("none")
    expect(await markerContent(page, "#unrelated")).toBe("none")

    await testInfo.attach("blog-with-markers", {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png"
    })
  })

  test("marker survives hostile site styles", async ({ page }) => {
    const style = await page.locator("#hostile-link").evaluate((el) => {
      const cs = getComputedStyle(el, "::after")
      return {
        content: cs.content,
        display: cs.display,
        color: cs.color,
        textShadow: cs.textShadow,
        letterSpacing: cs.letterSpacing,
        textTransform: cs.textTransform
      }
    })
    expect(style).toEqual({
      content: '"G"',
      display: "inline-block",
      color: "rgb(255, 255, 255)",
      textShadow: "none",
      letterSpacing: "normal",
      textTransform: "none"
    })
  })

  test("shows the replaced-link count on the badge", async ({
    serviceWorker
  }) => {
    await expect
      .poll(() => getBadgeText(serviceWorker, FIXTURE_URLS.blog))
      .toBe("5")
  })

  test("handles links added after load", async ({ page, serviceWorker }) => {
    await page.evaluate(() => {
      const feed = document.getElementById("feed")!
      for (const name of ["Claude_Shannon", "Edsger_W._Dijkstra"]) {
        const a = document.createElement("a")
        a.className = "late"
        a.href = `https://en.wikipedia.org/wiki/${name}`
        a.textContent = name
        const li = document.createElement("li")
        li.appendChild(a)
        feed.appendChild(li)
      }
    })

    await expect(page.locator('a.late[data-grokified="true"]')).toHaveCount(2)
    expect(await markerContent(page, "a.late >> nth=0")).toBe('"G"')
    await expect
      .poll(() => getBadgeText(serviceWorker, FIXTURE_URLS.blog))
      .toBe("7")
  })

  test("popup toggle hides and restores markers without a reload", async ({
    page,
    context,
    extensionId
  }) => {
    const popup = await context.newPage()
    await popup.goto(`chrome-extension://${extensionId}/popup.html`)
    const toggle = popup.getByLabel("Mark replaced links")
    await expect(toggle).toBeChecked()

    await toggle.uncheck()
    await expect.poll(() => markerContent(page, "#plain")).toBe("none")
    // Rewriting is unaffected
    await expect(page.locator("#plain")).toHaveAttribute(
      "href",
      "https://grokipedia.com/page/Alan_Turing"
    )

    await toggle.check()
    await expect.poll(() => markerContent(page, "#plain")).toBe('"G"')
  })
})

test.describe("on Wikipedia", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FIXTURE_URLS.wikipedia)
    await waitForGrokify(page)
  })

  test("rewrites relative links, skipping special pages and fragments", async ({
    page
  }) => {
    await expect(page.locator("#relative")).toHaveAttribute(
      "href",
      "https://grokipedia.com/page/Grace_Hopper"
    )
    await expect(page.locator("#relative")).toHaveAttribute(
      "data-grokify-original",
      "https://en.wikipedia.org/wiki/Grace_Hopper"
    )
    await expect(page.locator("#relative")).toHaveAttribute(
      "title",
      "Grace Hopper\nGrokify: opens on Grokipedia (was en.wikipedia.org/wiki/Grace_Hopper)"
    )
    await expect(page.locator("#special")).toHaveAttribute(
      "href",
      "/wiki/Special:Random"
    )
    await expect(page.locator("#fragment")).toHaveAttribute("href", "#History")
  })

  test("does not show inline markers", async ({ page }) => {
    expect(await markerContent(page, "#relative")).toBe("none")
    await expect(page.locator("#grokify-indicator-style")).toHaveCount(0)
  })

  test("still shows the badge count", async ({ serviceWorker }) => {
    await expect
      .poll(() => getBadgeText(serviceWorker, FIXTURE_URLS.wikipedia))
      .toBe("2")
  })
})
