# MVP URL Rewrite Edge Cases
- [x] Ignore non-article namespaces (`Special:`, `Talk:`, `File:`) and handle `/w/` or `index.php` paths safely before rewriting.
- [ ] Normalize mobile and international subdomains (`m.` variants, non-`en` locales) to canonical Wikipedia slugs.
- [ ] Strip or remap query strings (`?oldid=`, `?title=`) that Grokipedia may not support; preserve fragments (`#Section`) safely.
- [x] Ensure proper decoding/encoding for titles with accents, punctuation, or percent-encoding (e.g., `São_Paulo`, `%E2%80%93`).
- [x] Detect existing Grokipedia links and skip rewriting to avoid double substitution or loops.
- [x] Limit replacements to HTML anchor `href` attributes; ignore scripts, JSON, and inline styles.
- [x] Protect intra-page fragment links (`href="#References"`) by scoping only to absolute Wikipedia URLs.
