# Grokify - Browser Extension

## ✅ Completed Features

### Core Functionality
- [x] Replace Wikipedia links with Grokipedia across all webpages
- [x] Toggle extension on/off via popup UI
- [x] Show count of replaced links on current page
- [x] Auto-refresh page when toggling extension

### URL Handling & Edge Cases
- [x] Ignore non-article namespaces (`Special:`, `Talk:`, `File:`, `Category:`, `Portal:`, `Template:`, `MediaWiki:`)
- [x] Handle `/w/index.php?title=` URL format
- [x] Normalize mobile Wikipedia (`m.wikipedia.org`, `en.m.wikipedia.org`)
- [x] Strip Wikipedia query strings (`?oldid=`, `?printable=`, etc.)
- [x] Preserve hash fragments (`#Section`)
- [x] Proper URL encoding/decoding for special characters (`São_Paulo`, `%E2%80%93`)
- [x] Detect and skip existing Grokipedia links (prevent double-rewriting)
- [x] Limit to HTML anchor `href` attributes only
- [x] Protect intra-page fragment links (`href="#References"`)
- [x] English Wikipedia only (skip other languages)

### UI/UX
- [x] Clean popup interface with toggle switch
- [x] Grokipedia logo/branding
- [x] Statistics display (link count)
- [x] Immediate visual feedback (page refresh on toggle)

## 🚀 Future Enhancements

### Validation & Fallback
- [ ] Pre-validate links via Grokipedia API (if available)
- [ ] Add "Open in Wikipedia" context menu option
- [ ] Inject fallback button on Grokipedia 404 pages

### Multi-language Support
- [ ] Support non-English Wikipedia (es, fr, de, etc.) if Grokipedia expands
- [ ] Language detection and routing

### Performance
- [ ] Optimize for pages with 1000+ links
- [ ] Batch processing for large DOM changes
- [ ] Debounce MutationObserver callbacks

### Distribution
- [x] Publish to Chrome Web Store
- [ ] Firefox Add-ons support
- [ ] Edge Add-ons support
- [ ] Safari extension support
