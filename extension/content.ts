import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://*/*"],
  all_frames: true
}

let replacementCount = 0

// Function to replace Wikipedia links with Grokipedia links
function replaceWikipediaLinks(container: Document | Element = document) {
  // Find all anchor tags with Wikipedia links
  const links = container.querySelectorAll<HTMLAnchorElement>(
    'a[href*="en.wikipedia.org/wiki/"]'
  )

  links.forEach((link) => {
    const href = link.getAttribute("href")
    if (!href) return

    // Check if it's a Wikipedia link
    const wikiMatch = href.match(
      /https?:\/\/en\.wikipedia\.org\/wiki\/([^#?]+)([#?].*)?/
    )

    if (wikiMatch) {
      const articleName = wikiMatch[1]
      const suffix = wikiMatch[2] || "" // Preserve hash/query params if any

      // Replace with Grokipedia URL
      const newUrl = `https://grokipedia.com/page/${articleName}${suffix}`
      link.setAttribute("href", newUrl)

      // Add a visual indicator (optional - small badge)
      if (!link.dataset.grokified) {
        link.dataset.grokified = "true"
        replacementCount++
      }
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
