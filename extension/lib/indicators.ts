// Pure helpers for showing users which links Grokify rewrote.
// Kept free of chrome/DOM globals so they can be unit tested directly.

export const ORIGINAL_HREF_ATTR = "grokify-original"
export const INDICATOR_STYLE_ID = "grokify-indicator-style"
export const SHOW_INDICATORS_KEY = "showIndicators"

// CSS-only marker: adds no DOM nodes, so it never re-triggers the
// MutationObserver. Links wrapping media (thumbnails, logos) are skipped.
// Every declaration is !important and inherited text styles are reset, since
// host pages style links aggressively (e.g. gwern.net's white text-shadow
// underline trick otherwise buries the "G").
export const INDICATOR_CSS = `
a[data-grokified="true"]:not(:has(img, svg, picture, video))::after {
  content: "G" !important;
  display: inline-block !important;
  position: static !important;
  width: auto !important;
  height: auto !important;
  margin: 0 0 0 0.15em !important;
  padding: 0 0.25em !important;
  border: 0 !important;
  border-radius: 0.3em !important;
  font: 700 0.6em/1.4 system-ui, -apple-system, "Segoe UI", sans-serif !important;
  font-variant: normal !important;
  letter-spacing: normal !important;
  text-transform: none !important;
  text-indent: 0 !important;
  text-shadow: none !important;
  text-decoration: none !important;
  vertical-align: super !important;
  color: #fff !important;
  -webkit-text-fill-color: #fff !important;
  background: #1a1a1a !important;
  opacity: 0.75 !important;
  filter: none !important;
  mask: none !important;
  -webkit-mask: none !important;
  transform: none !important;
  visibility: visible !important;
  pointer-events: none !important;
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
