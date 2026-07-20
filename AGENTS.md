# Wallpaper Curator — agent guide

Curated public-domain paintings for desktop wallpapers. Humans browse the gallery; agents should use MCP (not scrape HTML).

## Site

| | URL |
| --- | --- |
| Home | https://wallpaper-curator.vercel.app/ |
| Gallery | https://wallpaper-curator.vercel.app/gallery |
| This file | https://wallpaper-curator.vercel.app/agents.md |
| MCP (Streamable HTTP) | https://wallpaper-curator.vercel.app/api/mcp |
| Catalog source | `data/wallpapers.yaml` in this repo |

## Prefer MCP

Connect any MCP client to the public endpoint. No auth.

```json
{
  "mcpServers": {
    "wallpaper-curator": {
      "url": "https://wallpaper-curator.vercel.app/api/mcp"
    }
  }
}
```

Stdio-only clients:

```bash
npx -y mcp-remote https://wallpaper-curator.vercel.app/api/mcp
```

### Tools

1. `list_facets` — catalog size, artists, tones, sources (call first)
2. `search_wallpapers` — optional `query`, `artist`, `tone`, `limit`, `offset`
3. `get_wallpaper` — required `id`; returns `imageUrl`, `thumbUrl`, metadata

### Resource

- `wallpaper://catalog` — full catalog JSON

### Suggested flow

`list_facets` → `search_wallpapers` → `get_wallpaper` → use `imageUrl` / `thumbUrl`.

## Content rules

- Entries are public-domain / openly licensed museum or Wikimedia sources.
- Prefer linking or downloading the provided URLs; do not rehost as your own work.
- When presenting a piece to a user, include artist + title + source when known.
- Do not invent catalog entries; only use ids returned by MCP or `data/wallpapers.yaml`.

## For coding agents (this repo)

### Commands

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

Local MCP while developing: `http://localhost:3000/api/mcp`

### Layout

- `data/wallpapers.yaml` — catalog (restart/redeploy after edits)
- `src/app/api/[transport]/route.ts` — MCP server (`mcp-handler`)
- `src/lib/mcp-catalog.ts` — search / facets / cards
- `src/lib/wallpapers.ts` — types + Wikimedia thumb helpers
- `src/components/LandingHero.tsx` — landing + MCP docs section (`/#mcp`)
- `src/components/GalleryClient.tsx` — gallery UI
- `raycast-extension/` — Raycast “set wallpaper” companion

### Conventions

- Keep the landing hero sparse (brand, one headline, one support line, CTAs).
- MCP stays public and unauthenticated; do not add secrets to the catalog path.
- Wikimedia thumbs must use allowed widths from `WIKIMEDIA_THUMB_STEPS` in `src/lib/wallpapers.ts`.
- Social card image is static `public/og.jpg` (regenerate with `npm run og` / `prebuild`).

### Deploy

```bash
vercel --prod
```

Production project: `deltalytix/wallpaper-curator` → https://wallpaper-curator.vercel.app
