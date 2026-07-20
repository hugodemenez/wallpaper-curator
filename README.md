# Wallpaper Curator

A Vercel-deployable, terminal-styled gallery of curated **public-domain** wallpapers.
Inspired by the local pictures-gallery B&W UI — black ground, mono type, zoom / search / sort, `wall` + `dl`.

- **Landing:** `/`
- **Gallery:** `/gallery`
- **Catalog:** `data/wallpapers.yaml`
- **Raycast companion:** `raycast-extension/`

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Edit the wallpaper catalog

Add or change entries in [`data/wallpapers.yaml`](data/wallpapers.yaml):

```yaml
- id: unique-slug
  name: Painting Title
  artist: Artist Name
  date: "1877"          # artwork date when known
  url: https://upload.wikimedia.org/...
  size: 1234567         # bytes (optional)
  tones: [green, gold]
  source: Wikimedia Commons
```

Prefer high-res Wikimedia Commons (or open museum) URLs. For “Family — Inspired by …” Daily Wallpapers names, curate the **original** painting, not the AI file.

Restart `npm run dev` (or redeploy) after YAML changes — the file is read on the server.

## Raycast extension

```bash
cd raycast-extension
npm install
npm run dev          # local install into Raycast
npx ray submit       # publish to Raycast Store (author: hugodemenez)
```

Gallery `wall` links use:

`raycast://extensions/hugodemenez/wallpaper-curator/set-wallpaper?arguments=…`

The deeplink passes the wallpaper’s **own** image URL (from YAML), which the extension downloads and sets via AppleScript.

See [`raycast-extension/README.md`](raycast-extension/README.md).

## Deploy (Vercel)

```bash
vercel --prod
```

Or connect the GitHub repo in the Vercel dashboard. Project name: `wallpaper-curator`.

## Favicon

- `src/app/icon.svg` — App Router icon
- `public/favicon.svg` — static SVG
- `src/app/apple-icon.tsx` — generated Apple touch icon
- `public/favicon.ico` — legacy fallback

## Stack

Next.js (App Router) · TypeScript · IBM Plex Mono · YAML catalog · Raycast
