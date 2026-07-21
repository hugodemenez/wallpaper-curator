# Wallpaper Curator — Raycast extension

macOS companion for [Wallpaper Curator](https://wallpaper-curator.vercel.app).

The website cannot embed Raycast itself — install this extension, then:

- **Browse Wallpapers** in Raycast loads the live catalog from `GET /api/wallpapers`
- Gallery **wall** buttons deeplink into **Set Wallpaper from URL**
- Both paths download the **source image URL** (Wikimedia / museum) and set every desktop via AppleScript

## Requirements

- macOS
- [Raycast](https://www.raycast.com/)
- Node.js 20+

## Develop locally

```bash
cd raycast-extension
npm install
npm run dev          # ray develop — installs into Raycast as a local extension
```

1. Keep the site running if you point preferences at localhost (`npm run dev` in the repo root).
2. In Raycast → Wallpaper Curator → Preferences → **API Base URL**:
   - Production: `https://wallpaper-curator.vercel.app` (default)
   - Local site: `http://localhost:3000`
3. Run **Browse Wallpapers**, pick a painting → **Set as Wallpaper**.
4. From the website gallery on Mac, click **wall** to exercise the deeplink command.

## How it works

1. Catalog: `GET {apiBaseUrl}/api/wallpapers` (JSON from `data/wallpapers.yaml`)
2. Download: `fetch(imageUrl)` from the real source host
3. Cache file under `~/.cache/wallpaper-curator/`
4. AppleScript / System Events → `set picture` on every desktop

## Publish to the Raycast Store

Author in `package.json` must match your Raycast username (`hugodemenez`).

```bash
cd raycast-extension
npm install
npm run lint
npm run build
npx ray submit
```

`ray submit` opens the Raycast publish flow (login required on your machine). After approval, Store users can install **Wallpaper Curator**; gallery `wall` deeplinks keep working because `author` / `name` / `set-wallpaper` stay stable.
