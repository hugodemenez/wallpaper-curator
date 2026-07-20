# Wallpaper Curator — Raycast extension

Set your macOS desktop wallpaper from any image URL. Companion to the
[Wallpaper Curator](../) gallery (`wall` deeplinks).

## Requirements

- macOS
- [Raycast](https://www.raycast.com/)
- Node.js 20+

## Develop locally

```bash
cd raycast-extension
npm install
npm run dev
```

Raycast will load the extension in development mode. Try **Set Wallpaper from URL**
with any direct image URL (e.g. a Wikimedia Commons upload link).

## Publish

When ready for the Raycast Store (author must be `hugodemenez`):

```bash
cd raycast-extension
npm install
npx ray submit
```

Ensure `package.json` `author` matches your Raycast username.

## How it works

1. Downloads the image URL
2. Saves under `~/.cache/wallpaper-curator/`
3. Sets every desktop picture via AppleScript / System Events
