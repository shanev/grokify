# Grokify Website

Simple static landing page for the Grokify browser extension.

## 🌐 Live Site

Coming soon: https://grokify.app

## 🚀 Deployment to Cloudflare Pages

### First Time Setup

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add website"
   git push origin main
   ```

2. **Create Cloudflare Pages Project**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Select "Workers & Pages" from the sidebar
   - Click "Create application" → "Pages" → "Connect to Git"
   - Select your repository: `shanev/groki`
   - Configure build settings:
     - **Production branch**: `main`
     - **Build output directory**: `website`
     - **Build command**: (leave empty - it's static HTML)
     - **Root directory**: `website`

3. **Configure Custom Domain**:
   - After deployment, go to "Custom domains" tab
   - Click "Set up a custom domain"
   - Enter `grokify.app`
   - Follow DNS configuration instructions (add CNAME record)

### Subsequent Deployments

Every push to `main` will automatically deploy! No build step needed.

## 🛠️ Local Development

Since it's plain HTML, just open `index.html` in your browser:

```bash
cd website
open index.html
```

Or use a simple HTTP server:

```bash
# Python
python3 -m http.server 8000

# Node.js (npx)
npx serve

# PHP
php -S localhost:8000
```

Then visit http://localhost:8000

## 📁 Structure

```
website/
├── index.html       # Main landing page
├── assets/
│   └── icon.png    # Grokify logo
└── README.md       # This file
```

## ✨ Features

- Single HTML file (no build step!)
- Responsive design
- Dark theme matching Grokipedia
- Fast load times
- SEO optimized with meta tags
- Open Graph tags for social sharing
