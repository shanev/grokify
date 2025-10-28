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

    let articleName = ""
    let suffix = ""

    // Check if it's an absolute Wikipedia link (desktop)
    const absoluteMatch = href.match(
      /https?:\/\/en\.wikipedia\.org\/wiki\/([^#?]+)([#?].*)?/
    )

    // Check if it's a mobile Wikipedia link
    const mobileMatch = href.match(
      /https?:\/\/(en\.)?m\.wikipedia\.org\/wiki\/([^#?]+)([#?].*)?/
    )

    // Check if it's a relative Wikipedia link (starts with /wiki/)
    const relativeMatch = href.match(/^\/wiki\/([^#?]+)([#?].*)?$/)

    // Check if it's an anchor-only link (starts with #) - skip these
    if (href.startsWith("#")) {
      return
    }

    if (absoluteMatch) {
      articleName = absoluteMatch[1]
      suffix = absoluteMatch[2] || ""
    } else if (mobileMatch) {
      articleName = mobileMatch[2]
      suffix = mobileMatch[3] || ""
    } else if (relativeMatch) {
      articleName = relativeMatch[1]
      suffix = relativeMatch[2] || ""
    }

    // If we found a Wikipedia link, replace it
    if (articleName) {
      // Skip special pages (e.g., File:, Special:, Help:, etc.)
      if (
        articleName.startsWith("Special:") ||
        articleName.startsWith("File:") ||
        articleName.startsWith("Help:") ||
        articleName.startsWith("Wikipedia:") ||
        articleName.startsWith("Talk:") ||
        articleName.startsWith("User:")
      ) {
        return
      }

      // Replace with Grokipedia URL
      const newUrl = `https://grokipedia.com/page/${articleName}${suffix}`
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
