import { useEffect, useState } from "react"
import packageJson from "./package.json"

function IndexPopup() {
  const [enabled, setEnabled] = useState(true)
  const [linkCount, setLinkCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Load initial state from storage
  useEffect(() => {
    chrome.storage.sync.get(["enabled"], (result) => {
      setEnabled(result.enabled !== false) // Default to true
      setLoading(false)
    })

    // Get link count from current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs
          .sendMessage(tabs[0].id, { action: "getCount" })
          .then((response) => {
            if (response && typeof response.count === 'number') {
              setLinkCount(response.count)
            }
          })
          .catch(() => {
            // Content script not ready or not injected
            setLinkCount(0)
          })
      }
    })
  }, [])

  // Handle toggle change
  const handleToggle = async () => {
    const newEnabled = !enabled
    setEnabled(newEnabled)

    // Save to storage
    chrome.storage.sync.set({ enabled: newEnabled })

    // Reload the active tab to apply changes
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tabs[0]?.id) {
      chrome.tabs.reload(tabs[0].id)
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Grokify</h2>
        <p style={styles.subtitle}>Wikipedia → Grokipedia Link Replacer</p>
      </div>

      <div style={styles.content}>
        <div style={styles.toggleContainer}>
          <label style={styles.toggleLabel}>
            <span style={styles.toggleText}>
              {enabled ? "Enabled" : "Disabled"}
            </span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={handleToggle}
              style={styles.checkbox}
            />
            <span
              style={{
                ...styles.toggleSwitch,
                backgroundColor: enabled ? "#4CAF50" : "#ccc"
              }}
            />
          </label>
        </div>

        {enabled && (
          <div style={styles.stats}>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>{linkCount}</span>
              <span style={styles.statLabel}>
                {linkCount === 1 ? "link replaced" : "links replaced"}
              </span>
            </div>
            <p style={styles.hint}>on this page</p>
          </div>
        )}

        {!enabled && (
          <p style={styles.disabledMessage}>
            Toggle on to start replacing Wikipedia links with Grokipedia
          </p>
        )}
      </div>

      <div style={styles.footer}>
        <a
          href="https://grokipedia.com"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.link}>
          Visit Grokipedia →
        </a>
        <p style={styles.version}>v{packageJson.version}</p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    width: "320px",
    padding: "20px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: "#f8f9fa"
  },
  header: {
    textAlign: "center" as const,
    marginBottom: "20px",
    borderBottom: "2px solid #e0e0e0",
    paddingBottom: "15px"
  },
  title: {
    margin: "0 0 5px 0",
    fontSize: "24px",
    fontWeight: "600",
    color: "#1a1a1a"
  },
  subtitle: {
    margin: "0",
    fontSize: "12px",
    color: "#666",
    fontWeight: "400"
  },
  content: {
    marginBottom: "20px"
  },
  toggleContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px"
  },
  toggleLabel: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    gap: "12px",
    position: "relative" as const
  },
  toggleText: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#333",
    minWidth: "80px"
  },
  checkbox: {
    position: "absolute" as const,
    opacity: 0,
    width: 0,
    height: 0
  },
  toggleSwitch: {
    width: "50px",
    height: "26px",
    borderRadius: "13px",
    transition: "background-color 0.2s",
    position: "relative" as const,
    display: "inline-block",
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)"
  },
  stats: {
    textAlign: "center" as const,
    padding: "15px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  },
  statItem: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "5px"
  },
  statNumber: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#4CAF50"
  },
  statLabel: {
    fontSize: "14px",
    color: "#666",
    fontWeight: "500"
  },
  hint: {
    margin: "10px 0 0 0",
    fontSize: "11px",
    color: "#999"
  },
  disabledMessage: {
    textAlign: "center" as const,
    fontSize: "14px",
    color: "#666",
    padding: "15px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    margin: "0"
  },
  footer: {
    textAlign: "center" as const,
    paddingTop: "15px",
    borderTop: "1px solid #e0e0e0"
  },
  link: {
    color: "#1976d2",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    transition: "color 0.2s"
  },
  version: {
    margin: "8px 0 0 0",
    fontSize: "11px",
    color: "#999",
    fontWeight: "400"
  }
}

export default IndexPopup
