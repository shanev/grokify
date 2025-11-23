import type { PlasmoCSConfig } from "plasmo"

import { countryToFlag } from "./utils/countries"

export const config: PlasmoCSConfig = {
  matches: ["https://*/*"],
  all_frames: true
}

const GROKIFIED_ATTR = "grokified"
const GROKIFIED_LOCATION_ATTR = "grokified-location"

const getReplacedLinkCount = () =>
  document.querySelectorAll<HTMLAnchorElement>(
    `a[data-${GROKIFIED_ATTR}="true"]`
  ).length

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCount") {
    if (window.top !== window) {
      return false
    }
    sendResponse({ count: getReplacedLinkCount() })
    return true
  }
  return false
})

// Function to replace Wikipedia links with Grokipedia links
function replaceWikipediaLinks(container: Document | Element = document) {
  // Find all anchor tags
  const links = container.querySelectorAll<HTMLAnchorElement>("a[href]")

  links.forEach((link) => {
    // Skip if already processed
    if (link.dataset[GROKIFIED_ATTR]) return

    const href = link.getAttribute("href")
    if (!href) return

    // Skip if it's already a Grokipedia link
    if (href.includes("grokipedia.com")) {
      return
    }

    // Skip anchor-only links (starts with #)
    if (href.startsWith("#")) {
      return
    }

    let articleName = ""
    let suffix = ""

    // Check if it's an absolute Wikipedia link (desktop) - English only
    const absoluteMatch = href.match(
      /https?:\/\/en\.wikipedia\.org\/wiki\/([^#?]+)([#?].*)?/
    )

    // Check if it's a mobile Wikipedia link - English only
    const mobileMatch = href.match(
      /https?:\/\/(en\.)?m\.wikipedia\.org\/wiki\/([^#?]+)([#?].*)?/
    )

    // Check if it's the /w/index.php?title= format - English only
    const indexPhpMatch = href.match(
      /https?:\/\/en\.wikipedia\.org\/w\/index\.php\?.*[&?]title=([^&#]+)/
    )

    // Check if it's a relative /w/index.php?title= format
    const relativeIndexPhpMatch = href.match(
      /^\/w\/index\.php\?.*[&?]title=([^&#]+)/
    )

    // Check if it's a relative Wikipedia link (starts with /wiki/)
    const relativeMatch = href.match(/^\/wiki\/([^#?]+)([#?].*)?$/)

    if (absoluteMatch) {
      articleName = absoluteMatch[1]
      suffix = absoluteMatch[2] || ""
    } else if (mobileMatch) {
      articleName = mobileMatch[2]
      suffix = mobileMatch[3] || ""
    } else if (indexPhpMatch) {
      // Decode the title parameter (it's often URL-encoded)
      articleName = decodeURIComponent(indexPhpMatch[1])
      suffix = ""
    } else if (relativeIndexPhpMatch) {
      articleName = decodeURIComponent(relativeIndexPhpMatch[1])
      suffix = ""
    } else if (relativeMatch) {
      articleName = relativeMatch[1]
      suffix = relativeMatch[2] || ""
    }

    // Strip Wikipedia query parameters, keep only hash fragments
    // Extract only the fragment (#section) and discard query params (?oldid=123)
    if (suffix) {
      const hashIndex = suffix.indexOf("#")
      if (hashIndex !== -1) {
        // Keep everything from # onwards
        suffix = suffix.substring(hashIndex)
      } else if (suffix.startsWith("?")) {
        // It's only query params, strip them
        suffix = ""
      }
    }

    // If we found a Wikipedia link, replace it
    if (articleName) {
      // Skip special pages, /w/ paths, and non-article namespaces
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
        return
      }

      // Properly encode the article name for the URL
      // Decode first to normalize, then encode to ensure proper format
      const normalizedArticleName = decodeURIComponent(articleName)
      const encodedArticleName = encodeURIComponent(normalizedArticleName)
        .replace(/%20/g, "_") // Wikipedia uses underscores for spaces
        .replace(/%2F/g, "/") // Don't encode forward slashes

      // Replace with Grokipedia URL
      const newUrl = `https://grokipedia.com/page/${encodedArticleName}${suffix}`
      link.setAttribute("href", newUrl)
      link.dataset[GROKIFIED_ATTR] = "true"
    }
  })
}

// --- X (Twitter) Logic ---

function isX() {
  return (
    window.location.hostname.includes("x.com") ||
    window.location.hostname.includes("twitter.com")
  )
}

function getXUsername() {
  if (!isX()) return null
  const path = window.location.pathname
  const parts = path.split("/").filter(Boolean)
  if (parts.length === 0) return null

  const potentialUsername = parts[0]
  // List of common reserved words on X
  const reserved = [
    "home",
    "explore",
    "notifications",
    "messages",
    "search",
    "settings",
    "i",
    "compose",
    "tos",
    "privacy",
    "jobs",
    "about"
  ]
  if (reserved.includes(potentialUsername)) return null

  return potentialUsername
}

async function handleXProfile() {
  if (!isX()) return

  const username = getXUsername()
  if (!username) return

  // Try to find the user name element
  const userNameElement = document.querySelector('[data-testid="UserName"]')
  if (!userNameElement) return

  // Check if already processed
  if (userNameElement.getAttribute(`data-${GROKIFIED_LOCATION_ATTR}`)) return

  // Mark as processing
  userNameElement.setAttribute(`data-${GROKIFIED_LOCATION_ATTR}`, "processing")

  try {
    const response = await fetch(
      `https://${window.location.hostname}/${username}/about`
    )
    const text = await response.text()

    let foundCountry = null
    // Search for country name in the response text
    // Optimization: iterate through keys
    for (const country of Object.keys(countryToFlag)) {
      if (text.includes(country)) {
        foundCountry = country
        // If we find a "Based in" match, break immediately as it's high confidence
        if (
          text.includes(`Based in ${country}`) ||
          text.includes(`Based in: ${country}`)
        ) {
          break
        }
      }
    }

    if (foundCountry) {
      const flag = countryToFlag[foundCountry]
      const span = document.createElement("span")
      span.textContent = ` ${flag}`
      span.title = `Based in ${foundCountry}`
      span.style.marginLeft = "4px"

      // Find the name text node to append next to
      // userNameElement usually has nested divs. We look for the span that holds the name.
      // The handle (@username) is usually in a separate div below or next to it.
      // We want the one that DOES NOT start with @

      const spans = Array.from(userNameElement.querySelectorAll("span"))
      const nameSpan = spans.find(
        (s) =>
          s.textContent &&
          s.textContent.trim().length > 0 &&
          !s.textContent.includes("@")
      )

      if (nameSpan) {
        nameSpan.appendChild(span)
      } else {
        userNameElement.appendChild(span)
      }
    }

    userNameElement.setAttribute(`data-${GROKIFIED_LOCATION_ATTR}`, "true")
  } catch (e) {
    // console.error("Grokify: Failed to fetch X location", e)
    // Fail silently or allow retry? For now mark as failed so we don't loop
    userNameElement.setAttribute(`data-${GROKIFIED_LOCATION_ATTR}`, "failed")
  }
}

// Function to check if extension is enabled
async function isExtensionEnabled(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["enabled"], (result) => {
      // Default to true if not set
      resolve(result.enabled !== false)
    })
  })
}

// Main function to initialize the content script
async function init() {
  const enabled = await isExtensionEnabled()

  if (!enabled) {
    return
  }

  // Replace existing links on page load
  replaceWikipediaLinks()

  // Handle X Profile if applicable
  if (isX()) {
    handleXProfile()
  }

  // Watch for dynamically added links (SPAs, infinite scroll, etc.)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          replaceWikipediaLinks(node as Element)
        }
      })
    })

    // Check for X profile updates
    if (isX()) {
      handleXProfile()
    }
  })

  // Start observing the document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })

  // Listener registered at top-level to ensure popup queries always respond
}

// Run when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}