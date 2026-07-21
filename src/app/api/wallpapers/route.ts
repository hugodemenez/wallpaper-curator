import { NextRequest, NextResponse } from "next/server";
import {
  getWallpaperById,
  listFacets,
  searchWallpapers,
  SITE_URL,
} from "@/lib/mcp-catalog";

/**
 * Public catalog API for the Raycast extension (and other clients).
 * GET /api/wallpapers
 * GET /api/wallpapers?q=sea
 * GET /api/wallpapers?id=pissarro-garden-full-sunlight
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (id) {
    const wallpaper = getWallpaperById(id);
    if (!wallpaper) {
      return NextResponse.json({ error: "not_found", id }, { status: 404 });
    }
    return NextResponse.json(
      { siteUrl: SITE_URL, wallpaper },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }

  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  const artist = req.nextUrl.searchParams.get("artist") ?? undefined;
  const tone = req.nextUrl.searchParams.get("tone") ?? undefined;
  const limitRaw = req.nextUrl.searchParams.get("limit");
  const limit = limitRaw ? Number(limitRaw) : 100;
  const offset = Number(req.nextUrl.searchParams.get("offset") ?? "0");

  const { total, results } = searchWallpapers({
    query: q,
    artist,
    tone,
    limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 100,
    offset: Number.isFinite(offset) ? Math.max(offset, 0) : 0,
  });

  return NextResponse.json(
    {
      siteUrl: SITE_URL,
      galleryUrl: `${SITE_URL}/gallery`,
      ...listFacets(),
      total,
      wallpapers: results,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
