import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://*/*"],
  all_frames: true
}

const GROKIFIED_ATTR = "grokified"
const GROKIFIED_LOCATION_ATTR = "grokified-location"
const MAX_CACHE_SIZE = 2000

// Global cache to track processed usernames and their locations
// Map<username, countryName | null>
const grokifyUserCache = new Map<string, string | null>()

const countryToFlag: Record<string, string> = {
  "Afghanistan": "🇦🇫",
  "Albania": "🇦🇱",
  "Algeria": "🇩🇿",
  "Andorra": "🇦🇩",
  "Angola": "🇦🇴",
  "Antigua and Barbuda": "🇦🇬",
  "Argentina": "🇦🇷",
  "Armenia": "🇦🇲",
  "Australia": "🇦🇺",
  "Austria": "🇦🇹",
  "Azerbaijan": "🇦🇿",
  "Bahamas": "🇧🇸",
  "Bahrain": "🇧🇭",
  "Bangladesh": "🇧🇩",
  "Barbados": "🇧🇧",
  "Belarus": "🇧🇾",
  "Belgium": "🇧🇪",
  "Belize": "🇧🇿",
  "Benin": "🇧🇯",
  "Bhutan": "🇧🇹",
  "Bolivia": "🇧🇴",
  "Bosnia and Herzegovina": "🇧🇦",
  "Botswana": "🇧🇼",
  "Brazil": "🇧🇷",
  "Brunei": "🇧🇳",
  "Bulgaria": "🇧🇬",
  "Burkina Faso": "🇧4",
  "Burundi": "🇧🇮",
  "Cabo Verde": "🇨🇻",
  "Cambodia": "🇰🇭",
  "Cameroon": "🇨🇲",
  "Canada": "🇨🇦",
  "Central African Republic": "🇨🇫",
  "Chad": "🇹🇩",
  "Chile": "🇨🇱",
  "China": "🇨🇳",
  "Colombia": "🇨🇴",
  "Comoros": "🇰🇲",
  "Congo": "🇨🇬",
  "Costa Rica": "🇨🇷",
  "Croatia": "🇭🇷",
  "Cuba": "🇨🇺",
  "Cyprus": "🇨🇾",
  "Czechia": "🇨🇿",
  "Denmark": "🇩🇰",
  "Djibouti": "🇩🇯",
  "Dominica": "🇩🇲",
  "Dominican Republic": "🇩🇴",
  "Ecuador": "🇪🇨",
  "Egypt": "🇪🇬",
  "El Salvador": "🇸🇻",
  "Equatorial Guinea": "🇬🇶",
  "Eritrea": "🇪🇷",
  "Estonia": "🇪🇪",
  "Eswatini": "🇸🇿",
  "Ethiopia": "🇪🇹",
  "Fiji": "🇫🇯",
  "Finland": "🇫🇮",
  "France": "🇫🇷",
  "Gabon": "🇬🇦",
  "Gambia": "🇬🇲",
  "Georgia": "🇬🇪",
  "Germany": "🇩🇪",
  "Ghana": "🇬🇭",
  "Greece": "🇬🇷",
  "Grenada": "🇬🇩",
  "Guatemala": "🇬🇹",
  "Guinea": "🇬🇳",
  "Guinea-Bissau": "🇬🇼",
  "Guyana": "🇬🇾",
  "Haiti": "🇭🇹",
  "Honduras": "🇭🇳",
  "Hungary": "🇭🇺",
  "Iceland": "🇮🇸",
  "India": "🇮🇳",
  "Indonesia": "🇮🇩",
  "Iran": "🇮🇷",
  "Iraq": "🇮🇶",
  "Ireland": "🇮🇪",
  "Israel": "🇮🇱",
  "Italy": "🇮🇹",
  "Jamaica": "🇯🇲",
  "Japan": "🇯🇵",
  "Jordan": "🇯🇴",
  "Kazakhstan": "🇰🇿",
  "Kenya": "🇰🇪",
  "Kiribati": "🇰🇮",
  "Korea, North": "🇰🇵",
  "Korea, South": "🇰🇷",
  "Kosovo": "🇽🇰",
  "Kuwait": "🇰🇼",
  "Kyrgyzstan": "🇰🇬",
  "Laos": "🇱🇦",
  "Latvia": "🇱🇻",
  "Lebanon": "🇱🇧",
  "Lesotho": "🇱🇸",
  "Liberia": "🇱🇷",
  "Libya": "🇱🇾",
  "Liechtenstein": "🇱🇮",
  "Lithuania": "🇱🇹",
  "Luxembourg": "🇱🇺",
  "Madagascar": "🇲🇬",
  "Malawi": "🇲🇼",
  "Malaysia": "🇲🇾",
  "Maldives": "🇲🇻",
  "Mali": "🇲🇱",
  "Malta": "🇲🇹",
  "Marshall Islands": "🇲🇭",
  "Mauritania": "🇲🇷",
  "Mauritius": "🇲🇺",
  "Mexico": "🇲🇽",
  "Micronesia": "🇫🇲",
  "Moldova": "🇲🇩",
  "Monaco": "🇲🇨",
  "Mongolia": "🇲🇳",
  "Montenegro": "🇲🇪",
  "Morocco": "🇲🇦",
  "Mozambique": "🇲🇿",
  "Myanmar": "🇲🇲",
  "Namibia": "🇳🇦",
  "Nauru": "🇳🇷",
  "Nepal": "🇳🇵",
  "Netherlands": "🇳🇱",
  "New Zealand": "🇳🇿",
  "Nicaragua": "🇳🇮",
  "Niger": "🇳🇪",
  "Nigeria": "🇳🇬",
  "North Macedonia": "🇲🇰",
  "Norway": "🇳🇴",
  "Oman": "🇴🇲",
  "Pakistan": "🇵🇰",
  "Palau": "🇵🇼",
  "Palestine": "🇵🇸",
  "Panama": "🇵🇦",
  "Papua New Guinea": "🇵🇬",
  "Paraguay": "🇵🇾",
  "Peru": "🇵🇪",
  "Philippines": "🇵🇭",
  "Poland": "🇵🇱",
  "Portugal": "🇵🇹",
  "Qatar": "🇶🇦",
  "Romania": "🇷🇴",
  "Russia": "🇷🇺",
  "Rwanda": "🇷🇼",
  "Saint Kitts and Nevis": "🇰🇳",
  "Saint Lucia": "🇱🇨",
  "Saint Vincent and the Grenadines": "🇻🇨",
  "Samoa": "🇼🇸",
  "San Marino": "🇸🇲",
  "Sao Tome and Principe": "🇸🇹",
  "Saudi Arabia": "🇸🇦",
  "Senegal": "🇸🇳",
  "Serbia": "🇷🇸",
  "Seychelles": "🇸🇨",
  "Sierra Leone": "🇸🇱",
  "Singapore": "🇸🇬",
  "Slovakia": "🇸🇰",
  "Slovenia": "🇸🇮",
  "Solomon Islands": "🇸🇧",
  "Somalia": "🇸🇴",
  "South Africa": "🇿🇦",
  "South Sudan": "🇸🇸",
  "Spain": "🇪🇸",
  "Sri Lanka": "🇱🇰",
  "Sudan": "🇸🇩",
  "Suriname": "🇸🇷",
  "Sweden": "🇸🇪",
  "Switzerland": "🇨🇭",
  "Syria": "🇸🇾",
  "Taiwan": "🇹🇼",
  "Tajikistan": "🇹🇯",
  "Tanzania": "🇹🇿",
  "Thailand": "🇹🇭",
  "Timor-Leste": "🇹🇱",
  "Togo": "🇹🇬",
  "Tonga": "🇹🇴",
  "Trinidad and Tobago": "🇹🇹",
  "Tunisia": "🇹🇳",
  "Turkey": "🇹🇷",
  "Turkmenistan": "🇹🇲",
  "Tuvalu": "🇹🇻",
  "Uganda": "🇺🇬",
  "Ukraine": "🇺🇦",
  "United Arab Emirates": "🇦🇪",
  "United Kingdom": "🇬🇧",
  "United States": "🇺🇸",
  "Uruguay": "🇺🇾",
  "Uzbekistan": "🇺🇿",
  "Vanuatu": "🇻🇺",
  "Vatican City": "🇻🇦",
  "Venezuela": "🇻🇪",
  "Vietnam": "🇻🇳",
  "Yemen": "🇾🇪",
  "Zambia": "🇿🇲",
  "Zimbabwe": "🇿🇼",

  // Common Abbreviations
  "USA": "🇺🇸",
  "UK": "🇬🇧",
  "UAE": "🇦🇪",
  "DRC": "🇨🇩",
  
  // Territories & Regions
  "Europe": "🇪🇺",
  "European Union": "🇪🇺",
  "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  "Hong Kong": "🇭🇰",
  "Macau": "🇲🇴",
  "Puerto Rico": "🇵🇷",
  "Guam": "🇬🇺",
  "American Samoa": "🇦🇸",
  "Northern Mariana Islands": "🇲🇵",
  "US Virgin Islands": "🇻🇮",
  "British Virgin Islands": "🇻🇬",
  "Cayman Islands": "🇰🇾",
  "Bermuda": "🇧🇲",
  "Falkland Islands": "🇫🇰",
  "Gibraltar": "🇬🇮",
  "Greenland": "🇬🇱",
  "Faroe Islands": "🇫🇴",
  "Aruba": "🇦🇼",
  "Curacao": "🇨🇼",
  "Sint Maarten": "🇸🇽",
  "French Guiana": "🇬🇫",
  "Guadeloupe": "🇬🇵",
  "Martinique": "🇲🇶",
  "Reunion": "🇷🇪",
  "Mayotte": "🇾🇹",
  "New Caledonia": "🇳🇨",
  "French Polynesia": "🇵🇫",
  "Saint Pierre and Miquelon": "🇵🇲",
  "Wallis and Futuna": "🇼🇫",
  "Niue": "🇳🇺",
  "Tokelau": "🇹🇰",
  "Cook Islands": "🇨🇰",
  "Saint Helena": "🇸🇭",
  "Ascension": "🇦🇨",
  "Tristan da Cunha": "🇹🇦",
  "Anguilla": "🇦🇮",
  "Montserrat": "🇲🇸",
  "Turks and Caicos Islands": "🇹🇨",
  "Western Sahara": "🇪🇭",
  "Antarctica": "🇦🇶",
  
  // Continents (using globes where flags aren't standard)
  "Africa": "🌍",
  "Asia": "🌏",
  "North America": "🌎",
  "South America": "🌎",
  "Oceania": "🌏",
  "World": "🌍"
}

function findCountryInText(rawText: string): string[] {
  const highConfidenceMatches: string[] = []
  const keywords = ["Account based in", "Based in"]

  // Robust cleanup: normalize ALL whitespace to single space
  const normalized = rawText
    .replace(/\\u00[a-fA-F0-9]{2}/g, (match) => String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16)))
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Strategy 1: Exact Match against DB keys
  if (countryToFlag[normalized]) {
      return [normalized];
  }
  
  // Strategy 2: Contains Match
  for (const country of Object.keys(countryToFlag)) {
      if (normalized.includes(country)) {
          highConfidenceMatches.push(country)
      }
  }

  // Strategy 3: Keyword proximity
  for (const keyword of keywords) {
    let pos = normalized.indexOf(keyword)
    while (pos !== -1) {
      const snippet = normalized.substring(pos, pos + 150)
      for (const country of Object.keys(countryToFlag)) {
        if (snippet.includes(country)) {
           highConfidenceMatches.push(country)
        }
      }
      pos = normalized.indexOf(keyword, pos + 1)
    }
  }

  return highConfidenceMatches.sort((a, b) => b.length - a.length)
}

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

function replaceWikipediaLinks(container: Document | Element = document) {
  const links = container.querySelectorAll<HTMLAnchorElement>("a[href]")

  links.forEach((link) => {
    if (link.dataset[GROKIFIED_ATTR]) return

    const href = link.getAttribute("href")
    if (!href) return

    if (href.includes("grokipedia.com")) {
      return
    }

    if (href.startsWith("#")) {
      return
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
    const isOnWikipedia = window.location.hostname.endsWith("wikipedia.org")

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
        return
      }

      const normalizedArticleName = decodeURIComponent(articleName)
      const encodedArticleName = encodeURIComponent(normalizedArticleName)
        .replace(/%20/g, "_")
        .replace(/%2F/g, "/")

      const newUrl = `https://grokipedia.com/page/${encodedArticleName}${suffix}`
      link.setAttribute("href", newUrl)
      link.dataset[GROKIFIED_ATTR] = "true"
    }
  })
}

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

function getCsrfToken() {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim()
        if (cookie.startsWith("ct0=")) {
            return cookie.substring(4)
        }
    }
    return null
}

async function handleXProfile() {
  if (!isX()) return

  const username = getXUsername()
  if (!username) return

  const userNameElement = document.querySelector('[data-testid="UserName"]')
  if (!userNameElement) return

  // DOM GUARD: Check attribute
  if (userNameElement.getAttribute(`data-${GROKIFIED_LOCATION_ATTR}`)) return

  // Set processing state immediately
  userNameElement.setAttribute(`data-${GROKIFIED_LOCATION_ATTR}`, "processing")

  let finalCountry: string | null = null

  // CACHE CHECK: Use cached result if available
  if (grokifyUserCache.has(username)) {
      finalCountry = grokifyUserCache.get(username) ?? null
      
      // LRU Refresh: Delete and re-add to move to end (most recently used)
      grokifyUserCache.delete(username)
      grokifyUserCache.set(username, finalCountry)
  } else {
      // DATA FETCH: Only fetch if not in cache
      try {
        // Strategy: Direct GraphQL Fetch for AboutAccountQuery
        const queryId = "XRqGa7EeokUU5kppkh13EA"
        const variables = { screenName: username }
        
        const encodedVariables = encodeURIComponent(JSON.stringify(variables))
        const graphQLUrl = `https://${window.location.hostname}/i/api/graphql/${queryId}/AboutAccountQuery?variables=${encodedVariables}`
        
        const csrfToken = getCsrfToken()

        const response = await fetch(graphQLUrl, {
          credentials: "include",
          headers: {
            "x-twitter-active-user": "yes",
            "x-csrf-token": csrfToken || "",
            "authorization": "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA" 
          }
        })
        
        if (response.ok) {
            const data = await response.json()
            const accountBasedIn = data?.data?.user_result_by_screen_name?.result?.about_profile?.account_based_in
            
            if (accountBasedIn) {
              const matches = findCountryInText(accountBasedIn)
              if (matches.length > 0) {
                finalCountry = matches[0]
              }
            }
        }
      } catch (e) {
        // Silent fail, finalCountry remains null
      }
      
      // CACHE SET: Store result (string or null) to prevent future fetches/loops
      // Enforce Max Size (Simple LRU)
      if (grokifyUserCache.size >= MAX_CACHE_SIZE) {
          const oldestKey = grokifyUserCache.keys().next().value
          grokifyUserCache.delete(oldestKey)
      }
      grokifyUserCache.set(username, finalCountry)
  }

  if (finalCountry) {
    const flag = countryToFlag[finalCountry]
    const span = document.createElement("span")
    span.textContent = ` ${flag}`
    span.title = `Based in ${finalCountry}`
    span.style.marginLeft = "4px"

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
    
    userNameElement.setAttribute(`data-${GROKIFIED_LOCATION_ATTR}`, "true")
  } else {
    // No country found or fetch failed - mark as processed
    userNameElement.setAttribute(`data-${GROKIFIED_LOCATION_ATTR}`, "no_data")
  }
}

async function isExtensionEnabled(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["enabled"], (result) => {
      resolve(result.enabled !== false)
    })
  })
}

async function init() {
  const enabled = await isExtensionEnabled()

  if (!enabled) {
    return
  }

  replaceWikipediaLinks()

  if (isX()) {
    handleXProfile()
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          replaceWikipediaLinks(node as Element)
        }
      })
    })

    if (isX()) {
      handleXProfile()
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
