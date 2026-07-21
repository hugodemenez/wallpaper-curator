import { loadWallpapers } from "@/lib/load-wallpapers";
import { SITE_URL } from "@/lib/site";
import { fmtSize, thumbUrl, type Wallpaper } from "@/lib/wallpapers";

export { SITE_URL };

export type WallpaperCard = {
  id: string;
  name: string;
  artist: string;
  date: string;
  added: string;
  tones: string[];
  source: string;
  size: string | null;
  imageUrl: string;
  thumbUrl: string;
  galleryUrl: string;
};

export function toCard(w: Wallpaper): WallpaperCard {
  return {
    id: w.id,
    name: w.name,
    artist: w.artist,
    date: w.date,
    added: w.added,
    tones: w.tones,
    source: w.source,
    size: w.size != null ? fmtSize(w.size) : null,
    imageUrl: w.url,
    thumbUrl: thumbUrl(w.url, 960),
    galleryUrl: `${SITE_URL}/gallery`,
  };
}

export function getWallpaperById(id: string): WallpaperCard | null {
  const hit = loadWallpapers().find((w) => w.id === id);
  return hit ? toCard(hit) : null;
}

export function listFacets(): {
  count: number;
  artists: string[];
  tones: string[];
  sources: string[];
} {
  const all = loadWallpapers();
  const artists = [...new Set(all.map((w) => w.artist))].sort((a, b) =>
    a.localeCompare(b),
  );
  const tones = [...new Set(all.flatMap((w) => w.tones))].sort((a, b) =>
    a.localeCompare(b),
  );
  const sources = [...new Set(all.map((w) => w.source))].sort((a, b) =>
    a.localeCompare(b),
  );
  return { count: all.length, artists, tones, sources };
}

export function searchWallpapers(opts: {
  query?: string;
  artist?: string;
  tone?: string;
  limit?: number;
  offset?: number;
}): { total: number; results: WallpaperCard[] } {
  const q = opts.query?.trim().toLowerCase() ?? "";
  const artist = opts.artist?.trim().toLowerCase() ?? "";
  const tone = opts.tone?.trim().toLowerCase() ?? "";
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
  const offset = Math.max(opts.offset ?? 0, 0);

  const filtered = loadWallpapers().filter((w) => {
    if (artist && !w.artist.toLowerCase().includes(artist)) return false;
    if (tone && !w.tones.some((t) => t.toLowerCase() === tone)) return false;
    if (!q) return true;
    const hay = [w.id, w.name, w.artist, w.date, w.added, w.source, ...w.tones]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });

  const sorted = [...filtered].sort(
    (a, b) =>
      b.added.localeCompare(a.added) || a.artist.localeCompare(b.artist),
  );

  return {
    total: sorted.length,
    results: sorted.slice(offset, offset + limit).map(toCard),
  };
}

export function catalogJson(): string {
  const facets = listFacets();
  const wallpapers = loadWallpapers().map(toCard);
  return JSON.stringify(
    {
      name: "Wallpaper Curator",
      description:
        "Curated public-domain paintings for desktop wallpapers. Browse, download, or set via Raycast.",
      siteUrl: SITE_URL,
      galleryUrl: `${SITE_URL}/gallery`,
      mcpUrl: `${SITE_URL}/api/mcp`,
      ...facets,
      wallpapers,
    },
    null,
    2,
  );
}
