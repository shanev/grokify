import { formatBadgeText } from "./lib/indicators"

chrome.action.setBadgeBackgroundColor({ color: "#1a1a1a" })

chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.action !== "updateBadge") return false

  const tabId = sender.tab?.id
  if (tabId === undefined || typeof request.count !== "number") return false

  chrome.action.setBadgeText({ tabId, text: formatBadgeText(request.count) })
  return false
})

// Clear a tab's badge when it navigates, so a stale count never lingers on
// pages where the content script doesn't run (chrome://, Web Store, etc.).
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    chrome.action.setBadgeText({ tabId, text: "" })
  }
})
