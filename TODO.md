# MVP URL Rewrite Edge Cases
- Ignore non-article namespaces (`Special:`, `Talk:`, `File:`) and `/w/` or `index.php` paths before rewriting.
- Normalize mobile and international subdomains (`m.` variants, non-`en` locales) to canonical Wikipedia slugs.
- Strip or safely handle query strings (`?oldid=`, `?title=`) and fragments (`#Section`) that Grokipedia may not support.
- Ensure proper decoding/encoding for titles with accents, punctuation, or percent-encoding (e.g., `São_Paulo`, `%E2%80%93`).
- Detect existing Grokipedia links and skip rewriting to avoid double substitution or loops.
- Limit replacements to HTML anchor `href` attributes; ignore scripts, JSON, and inline styles.
- Protect intra-page fragment links (`href="#References"`) by scoping only to absolute Wikipedia URLs.
