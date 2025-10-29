# Grokify

Automatically replace Wikipedia links with Grokipedia across the web.

This is a [Plasmo extension](https://docs.plasmo.com/) project that replaces all English Wikipedia links on any webpage with their Grokipedia equivalents.

## Features

- Replaces all Wikipedia links with Grokipedia links
- Handles relative and absolute URLs
- Supports mobile Wikipedia links
- Strips Wikipedia-specific query parameters
- Preserves section anchors (#)
- Toggle on/off via popup
- Shows count of replaced links

## Getting Started

First, run the development server:

```bash
bun dev
# or
pnpm dev
# or
npm run dev
```

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

You can start editing the popup by modifying `popup.tsx`. It should auto-update as you make changes. To add an options page, simply add a `options.tsx` file to the root of the project, with a react component default exported. Likewise to add a content page, add a `content.ts` file to the root of the project, importing some module and do some logic, then reload the extension on your browser.

For further guidance, [visit our Documentation](https://docs.plasmo.com/)

## Making production build

Run the following:

```bash
bun run build
# or
pnpm build
# or
npm run build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.

## Creating a release

To build and package the extension for distribution:

```bash
bun run release
```

This will:
1. Build the production extension
2. Create `grokify-extension.zip`
3. Copy it to `../website/` for download distribution

After running this, commit and push the updated zip:

```bash
git add ../website/grokify-extension.zip
git commit -m "Release v1.0.0"
git push
```

## Submit to the webstores

The easiest way to deploy your Plasmo extension is to use the built-in [bpp](https://bpp.browser.market) GitHub action. Prior to using this action however, make sure to build your extension and upload the first version to the store to establish the basic credentials. Then, simply follow [this setup instruction](https://docs.plasmo.com/framework/workflows/submit) and you should be on your way for automated submission!
