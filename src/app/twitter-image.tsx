import { ImageResponse } from "next/og";
import { OgGalleryCard } from "@/lib/og-card";
import { latestWallpapers, wallpaperDataUrl } from "@/lib/og-wallpapers";

export const alt =
  "Wallpaper Curator — a gallery of curated public-domain paintings";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function TwitterImage() {
  const picks = latestWallpapers(4);
  const images = (
    await Promise.all(picks.map((w) => wallpaperDataUrl(w, 500)))
  ).filter((src): src is string => Boolean(src));

  return new ImageResponse(<OgGalleryCard images={images} />, { ...size });
}
