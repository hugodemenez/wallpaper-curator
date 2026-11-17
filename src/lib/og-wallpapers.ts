import { loadWallpapers } from "@/lib/load-wallpapers";
import { OG_IDS, pick } from "@/lib/featured";
import { thumbUrl, type Wallpaper } from "@/lib/wallpapers";

/** The three paintings stacked on the share card (above, centre, below). */
export function ogWallpapers(): Wallpaper[] {
  return pick(loadWallpapers(), OG_IDS);
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
        "User-Agent": "Rotapicta/1.0 (https://rotapicta.com; github.com/hugodemenez/wallpaper-curator)",
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
