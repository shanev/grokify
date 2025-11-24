# Grokify

Grokify is a browser extension that rewrites Wikipedia links to their Grokipedia equivalents.

## New Feature: X (Twitter) Flags
Automatically displays the verified "Account based in" country flag on X (Twitter) profiles.

![X Profile Flag Example](website/assets/greg1.png)

## Installation

### Option 1: Chrome Web Store (Recommended)
[Install from Chrome Web Store](https://chromewebstore.google.com/detail/mgmilhggbecipldajclmdlndcamjjmia) – Get automatic updates and the easiest installation experience.

### Option 2: Manual Installation (Developer Mode)
If you prefer to sideload the extension or are testing a specific version:

1.  **Download:** Go to the [Releases](https://github.com/shanev/grokify/releases) page (or the `website/` folder in this repo) and download `grokify-extension.zip`.
2.  **Unzip:** Extract the zip file to a folder on your computer.
3.  **Open Extensions:** Navigate to `chrome://extensions` in your browser (works for Chrome, Brave, Edge, Arc, etc.).
4.  **Enable Developer Mode:** Toggle the switch in the top-right corner.
5.  **Load Unpacked:** Click the "Load unpacked" button and select the folder you just extracted.

## Privacy & Contact
- The extension runs entirely client-side; see `website/privacy.html` for the full policy.
- Contact: `shane@grokify.app`

## Contributing (For Developers)

If you want to build the extension from source:

1.  **Install dependencies:**
    ```bash
    cd extension
    bun install    # or pnpm install
    ```
2.  **Run in development:**
    ```bash
    bun dev        # plasmo dev server
    ```
    Load the generated build (e.g., `extension/build/chrome-mv3-dev`) into Chrome as an unpacked extension.
3.  **Production build:**
    ```bash
    bun run build
    ```
