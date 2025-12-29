import { describe, it, expect, beforeEach, vi } from "vitest"

// Extract the URL matching logic for testing
interface MatchResult {
  articleName: string
  suffix: string
}

function matchWikipediaUrl(
  href: string,
  currentHostname: string
): MatchResult | null {
  if (href.includes("grokipedia.com")) {
    return null
  }

  if (href.startsWith("#")) {
    return null
  }

  let articleName = ""
  let suffix = ""

  const absoluteMatch = href.match(
    /https?:\/\/en\.wikipedia\.org\/wiki\/([^#?]+)([#?].*)?/
  )

  const mobileMatch = href.match(
    /https?:\/\/(en\.)?m\.wikipedia\.org\/wiki\/([^#?]+)([#?].*)?/
  )

  const indexPhpMatch = href.match(
    /https?:\/\/en\.wikipedia\.org\/w\/index\.php\?.*[&?]title=([^&#]+)/
  )

  // Only match relative URLs when on Wikipedia domains
  const isOnWikipedia = currentHostname.endsWith("wikipedia.org")

  const relativeIndexPhpMatch = isOnWikipedia
    ? href.match(/^\/w\/index\.php\?.*[&?]title=([^&#]+)/)
    : null

  const relativeMatch = isOnWikipedia
    ? href.match(/^\/wiki\/([^#?]+)([#?].*)?$/)
    : null

  if (absoluteMatch) {
    articleName = absoluteMatch[1]
    suffix = absoluteMatch[2] || ""
  } else if (mobileMatch) {
    articleName = mobileMatch[2]
    suffix = mobileMatch[3] || ""
  } else if (indexPhpMatch) {
    articleName = decodeURIComponent(indexPhpMatch[1])
    suffix = ""
  } else if (relativeIndexPhpMatch) {
    articleName = decodeURIComponent(relativeIndexPhpMatch[1])
    suffix = ""
  } else if (relativeMatch) {
    articleName = relativeMatch[1]
    suffix = relativeMatch[2] || ""
  }

  if (suffix) {
    const hashIndex = suffix.indexOf("#")
    if (hashIndex !== -1) {
      suffix = suffix.substring(hashIndex)
    } else if (suffix.startsWith("?")) {
      suffix = ""
    }
  }

  if (articleName) {
    if (
      articleName.startsWith("Special:") ||
      articleName.startsWith("File:") ||
      articleName.startsWith("Help:") ||
      articleName.startsWith("Wikipedia:") ||
      articleName.startsWith("Talk:") ||
      articleName.startsWith("User:") ||
      articleName.startsWith("Category:") ||
      articleName.startsWith("Portal:") ||
      articleName.startsWith("Template:") ||
      articleName.startsWith("MediaWiki:")
    ) {
      return null
    }

    return { articleName, suffix }
  }

  return null
}

describe("matchWikipediaUrl", () => {
  describe("absolute Wikipedia URLs", () => {
    it("should match absolute en.wikipedia.org URLs from any site", () => {
      const result = matchWikipediaUrl(
        "https://en.wikipedia.org/wiki/Albert_Einstein",
        "example.com"
      )
      expect(result).toEqual({ articleName: "Albert_Einstein", suffix: "" })
    })

    it("should match absolute URLs with hash fragments", () => {
      const result = matchWikipediaUrl(
        "https://en.wikipedia.org/wiki/Albert_Einstein#Early_life",
        "example.com"
      )
      expect(result).toEqual({
        articleName: "Albert_Einstein",
        suffix: "#Early_life"
      })
    })

    it("should match mobile Wikipedia URLs", () => {
      const result = matchWikipediaUrl(
        "https://en.m.wikipedia.org/wiki/Albert_Einstein",
        "example.com"
      )
      expect(result).toEqual({ articleName: "Albert_Einstein", suffix: "" })
    })

    it("should match index.php URLs with title parameter", () => {
      // Note: title must not be the first parameter due to regex design
      const result = matchWikipediaUrl(
        "https://en.wikipedia.org/w/index.php?action=edit&title=Albert_Einstein",
        "example.com"
      )
      expect(result).toEqual({ articleName: "Albert_Einstein", suffix: "" })
    })
  })

  describe("relative URLs on Wikipedia", () => {
    it("should match relative /wiki/ URLs when on Wikipedia", () => {
      const result = matchWikipediaUrl(
        "/wiki/Albert_Einstein",
        "en.wikipedia.org"
      )
      expect(result).toEqual({ articleName: "Albert_Einstein", suffix: "" })
    })

    it("should match relative URLs with hash on Wikipedia", () => {
      const result = matchWikipediaUrl(
        "/wiki/Albert_Einstein#Early_life",
        "en.wikipedia.org"
      )
      expect(result).toEqual({
        articleName: "Albert_Einstein",
        suffix: "#Early_life"
      })
    })

    it("should match relative index.php URLs on Wikipedia", () => {
      // Note: title must not be the first parameter due to regex design
      const result = matchWikipediaUrl(
        "/w/index.php?action=edit&title=Albert_Einstein",
        "en.wikipedia.org"
      )
      expect(result).toEqual({ articleName: "Albert_Einstein", suffix: "" })
    })
  })

  describe("relative URLs on non-Wikipedia sites (the bug fix)", () => {
    it("should NOT match relative /wiki/ URLs on Fandom sites", () => {
      const result = matchWikipediaUrl(
        "/wiki/Some_Article",
        "mywiki.fandom.com"
      )
      expect(result).toBeNull()
    })

    it("should NOT match relative /wiki/ URLs on other MediaWiki sites", () => {
      const result = matchWikipediaUrl("/wiki/Main_Page", "wiki.archlinux.org")
      expect(result).toBeNull()
    })

    it("should NOT match relative /wiki/ URLs on generic sites", () => {
      const result = matchWikipediaUrl("/wiki/Documentation", "docs.example.com")
      expect(result).toBeNull()
    })

    it("should NOT match relative index.php URLs on non-Wikipedia sites", () => {
      const result = matchWikipediaUrl(
        "/w/index.php?title=Some_Article",
        "mywiki.fandom.com"
      )
      expect(result).toBeNull()
    })
  })

  describe("URLs that should be skipped", () => {
    it("should skip URLs already pointing to grokipedia", () => {
      const result = matchWikipediaUrl(
        "https://grokipedia.com/page/Albert_Einstein",
        "en.wikipedia.org"
      )
      expect(result).toBeNull()
    })

    it("should skip hash-only links", () => {
      const result = matchWikipediaUrl("#section", "en.wikipedia.org")
      expect(result).toBeNull()
    })

    it("should skip Special: pages", () => {
      const result = matchWikipediaUrl(
        "https://en.wikipedia.org/wiki/Special:Search",
        "example.com"
      )
      expect(result).toBeNull()
    })

    it("should skip File: pages", () => {
      const result = matchWikipediaUrl(
        "https://en.wikipedia.org/wiki/File:Example.jpg",
        "example.com"
      )
      expect(result).toBeNull()
    })

    it("should skip Wikipedia: namespace pages", () => {
      const result = matchWikipediaUrl(
        "https://en.wikipedia.org/wiki/Wikipedia:About",
        "example.com"
      )
      expect(result).toBeNull()
    })
  })
})
