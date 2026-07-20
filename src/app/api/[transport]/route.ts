import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  catalogJson,
  getWallpaperById,
  listFacets,
  searchWallpapers,
  SITE_URL,
} from "@/lib/mcp-catalog";

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "list_facets",
      "List catalog size plus distinct artists, tones, and sources. Call first to discover filters for search_wallpapers.",
      {},
      async () => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(listFacets(), null, 2),
          },
        ],
      }),
    );

    server.tool(
      "search_wallpapers",
      "Search the Wallpaper Curator public-domain painting catalog by free text, artist, and/or tone. Returns image URLs and gallery links.",
      {
        query: z
          .string()
          .optional()
          .describe("Free-text match on title, artist, tones, date, id"),
        artist: z
          .string()
          .optional()
          .describe("Filter by artist name (substring, case-insensitive)"),
        tone: z
          .string()
          .optional()
          .describe(
            "Exact tone tag filter, e.g. green, mist, sea (use list_facets)",
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe("Max results (default 20, max 50)"),
        offset: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Pagination offset (default 0)"),
      },
      async ({ query, artist, tone, limit, offset }) => {
        const result = searchWallpapers({
          query,
          artist,
          tone,
          limit,
          offset,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      },
    );

    server.tool(
      "get_wallpaper",
      "Get one wallpaper by id, including full-resolution and thumbnail image URLs.",
      {
        id: z
          .string()
          .describe("Wallpaper id from search_wallpapers or the catalog"),
      },
      async ({ id }) => {
        const card = getWallpaperById(id);
        if (!card) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: "not_found",
                  id,
                  hint: "Call search_wallpapers or list_facets, then retry with a valid id.",
                }),
              },
            ],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(card, null, 2),
            },
          ],
        };
      },
    );

    server.resource(
      "catalog",
      "wallpaper://catalog",
      {
        description:
          "Full Wallpaper Curator catalog as JSON (ids, artists, tones, image URLs).",
        mimeType: "application/json",
      },
      async (uri) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: catalogJson(),
          },
        ],
      }),
    );
  },
  {
    serverInfo: {
      name: "wallpaper-curator",
      version: "1.0.0",
    },
    instructions: [
      "Wallpaper Curator is a curated library of public-domain paintings for wallpapers.",
      `Browse the web gallery at ${SITE_URL}/gallery.`,
      "Prefer list_facets → search_wallpapers → get_wallpaper.",
      "Image URLs are public (Wikimedia Commons / open museums). Respect source attribution when sharing.",
    ].join(" "),
  },
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV === "development",
  },
);

export { handler as GET, handler as POST, handler as DELETE };
