import { readFile } from "fs/promises";
import { join } from "path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { OgCard } from "@/lib/og-card";
import { ogWallpapers, wallpaperDataUrl } from "@/lib/og-wallpapers";

export const ogAlt =
  "Rotapicta — the painted wheel: public-domain masterpieces as wallpapers";
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/jpeg";

async function font(file: string) {
  return readFile(join(process.cwd(), "src", "assets", "fonts", file));
}

/** Build a compact JPEG card — X often drops large PNG collages (~1MB+). */
export async function renderOgImage(): Promise<Response> {
  const [above, centre, below] = ogWallpapers();
  const [images, cinzel, cormorant] = await Promise.all([
    Promise.all([
      above ? wallpaperDataUrl(above, 500) : null,
      centre ? wallpaperDataUrl(centre, 960) : null,
      below ? wallpaperDataUrl(below, 500) : null,
    ]),
    font("Cinzel-SemiBold.ttf"),
    font("CormorantGaramond-MediumItalic.ttf"),
  ]);

  const png = new ImageResponse(
    <OgCard
      images={images}
      caption={centre ? `${centre.artist.split(" ").pop()} · ${centre.name}` : ""}
    />,
    {
      ...ogSize,
      fonts: [
        { name: "Cinzel", data: cinzel, weight: 600, style: "normal" },
        { name: "Cormorant", data: cormorant, weight: 500, style: "italic" },
      ],
    },
  );
  const pngBuf = Buffer.from(await png.arrayBuffer());
  const jpeg = await sharp(pngBuf)
    .jpeg({ quality: 80, mozjpeg: true, chromaSubsampling: "4:2:0" })
    .toBuffer();

  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": ogContentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
