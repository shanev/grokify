// Pure helpers for showing users which links Grokify rewrote.
// Kept free of chrome/DOM globals so they can be unit tested directly.

export const ORIGINAL_HREF_ATTR = "grokify-original"
export const INDICATOR_STYLE_ID = "grokify-indicator-style"
export const SHOW_INDICATORS_KEY = "showIndicators"

// CSS-only marker: adds no DOM nodes, so it never re-triggers the
// MutationObserver. Links wrapping media (thumbnails, logos) are skipped.
export const INDICATOR_CSS = `
a[data-grokified="true"]:not(:has(img, svg, picture, video))::after {
  content: "G";
  display: inline-block;
  margin-left: 0.15em;
  padding: 0 0.25em;
  border-radius: 0.3em;
  font: 700 0.6em/1.4 system-ui, -apple-system, "Segoe UI", sans-serif;
  vertical-align: super;
  text-decoration: none;
  color: #fff;
  background: #1a1a1a;
  opacity: 0.75;
  pointer-events: none;
}
`

export function isWikipediaHost(hostname: string): boolean {
  return hostname === "wikipedia.org" || hostname.endsWith(".wikipedia.org")
}

// Inline markers are noise on Wikipedia itself, where nearly every link is
// rewritten; elsewhere rewritten links are sparse and most surprising.
export function shouldShowInlineIndicators(
  hostname: string,
  enabledSetting: unknown
): boolean {
  return enabledSetting !== false && !isWikipediaHost(hostname)
}

export function describeOriginalHref(originalHref: string): string {
  const withoutProtocol = originalHref.replace(/^https?:\/\//, "")
  try {
    return decodeURI(withoutProtocol)
  } catch {
    return withoutProtocol
  }
}

// Appends to an existing title rather than replacing it: Wikipedia uses
// the title attribute for the article name.
export function buildLinkTitle(
  existingTitle: string | null,
  originalHref: string
): string {
  const note = `Grokify: opens on Grokipedia (was ${describeOriginalHref(originalHref)})`
  return existingTitle ? `${existingTitle}\n${note}` : note
}

export function formatBadgeText(count: number): string {
  if (count <= 0) return ""
  if (count > 999) return "999+"
  return String(count)
}
