import { loadWallpapers } from "@/lib/load-wallpapers";
import { thumbUrl, type Wallpaper } from "@/lib/wallpapers";

/** Newest catalog entries first (by artwork date, then id). */
export function latestWallpapers(count = 4): Wallpaper[] {
  const all = loadWallpapers();
  return [...all]
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || a.id.localeCompare(b.id),
    )
    .slice(0, count);
}

/** Fetch a Wikimedia thumb as a data URL for next/og (reliable in ImageResponse). */
export async function wallpaperDataUrl(
  wallpaper: Wallpaper,
  width = 500,
): Promise<string | null> {
  const url = thumbUrl(wallpaper.url, width);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "WallpaperCurator/1.0 (github.com/hugodemenez/wallpaper-curator)",
        Accept: "image/*",
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "image/jpeg";
    if (!type.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
