# grokify.app

The landing site for the Grokify extension: plain HTML and CSS, no build step.
Cloudflare Pages deploys this folder on every push to `main`.

```
website/
├── index.html               Landing page
├── privacy.html             Privacy policy
├── grokify-extension.zip    Direct download (updated by `bun run release`)
├── assets/
│   ├── icon.png             Logo / favicon
│   ├── og.png               Social share card (1200×630)
│   ├── greg1.png            X flag example (also used in the repo README)
│   └── shots/               Product screenshots (WebP)
├── robots.txt
└── sitemap.xml
```

## Screenshots

The images in `assets/shots/` and `assets/og.png` are captured from the real
extension build, so they stay accurate. To refresh them after a UI change:

```bash
cd extension
pnpm build
node scripts/website-screenshots.mjs
```

The demo article and share-card templates live in
`extension/scripts/screenshot-pages/`. The site's copy mentions the badge count
(8) and tooltip text that the script prints; update `index.html` if they change.

## Local preview

```bash
cd website && python3 -m http.server 8000   # http://localhost:8000
```
