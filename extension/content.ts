import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://*/*"],
  all_frames: true
}

let replacementCount = 0

// Function to replace Wikipedia links with Grokipedia links
function replaceWikipediaLinks(container: Document | Element = document) {
  // Find all anchor tags
  const links = container.querySelectorAll<HTMLAnchorElement>("a[href]")

  links.forEach((link) => {
    // Skip if already processed
    if (link.dataset.grokified) return

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
      link.dataset.grokified = "true"
      replacementCount++
    }
  })
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

  // Watch for dynamically added links (SPAs, infinite scroll, etc.)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          replaceWikipediaLinks(node as Element)
        }
      })
    })
  })

  // Start observing the document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })

  // Listen for messages from popup to send current count
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getCount") {
      sendResponse({ count: replacementCount })
    }
  })
}

// Run when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}

// Listen for storage changes (when user toggles the extension)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync" && changes.enabled) {
    if (changes.enabled.newValue === true) {
      // Re-initialize if enabled
      location.reload()
    }
  }
})
