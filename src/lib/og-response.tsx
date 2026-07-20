import { ImageResponse } from "next/og";
import sharp from "sharp";
import { OgGalleryCard } from "@/lib/og-card";
import { latestWallpapers, wallpaperDataUrl } from "@/lib/og-wallpapers";

export const ogAlt =
  "Wallpaper Curator — a gallery of curated public-domain paintings";
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/jpeg";

/** Build a compact JPEG card — X often drops large PNG collages (~1MB+). */
export async function renderOgImage(): Promise<Response> {
  const picks = latestWallpapers(4);
  const images = (
    await Promise.all(picks.map((w) => wallpaperDataUrl(w, 320)))
  ).filter((src): src is string => Boolean(src));

  const png = new ImageResponse(<OgGalleryCard images={images} />, {
    ...ogSize,
  });
  const pngBuf = Buffer.from(await png.arrayBuffer());
  const jpeg = await sharp(pngBuf)
    .jpeg({ quality: 78, mozjpeg: true, chromaSubsampling: "4:2:0" })
    .toBuffer();

  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": ogContentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
