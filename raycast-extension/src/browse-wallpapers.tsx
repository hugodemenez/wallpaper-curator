import { useMemo, useState } from "react";
import {
  Action,
  ActionPanel,
  Detail,
  getPreferenceValues,
  Icon,
  List,
} from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { setWallpaperWithFeedback } from "./lib/set-wallpaper";

type WallpaperCard = {
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

type CatalogResponse = {
  siteUrl: string;
  galleryUrl: string;
  count: number;
  total: number;
  wallpapers: WallpaperCard[];
};

type Preferences = {
  apiBaseUrl: string;
};

function apiBase(): string {
  const prefs = getPreferenceValues<Preferences>();
  const raw =
    prefs.apiBaseUrl?.trim() || "https://wallpaper-curator.vercel.app";
  return raw.replace(/\/$/, "");
}

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const base = apiBase();
  const catalogUrl = `${base}/api/wallpapers?limit=200`;

  const { data, isLoading, error, revalidate } = useFetch<CatalogResponse>(
    catalogUrl,
    {
      keepPreviousData: true,
    },
  );

  const filtered = useMemo(() => {
    const items = data?.wallpapers ?? [];
    const q = searchText.trim().toLowerCase();
    if (!q) return items;
    return items.filter((w) => {
      const hay = [w.id, w.name, w.artist, w.date, w.source, ...w.tones]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [data, searchText]);

  if (error) {
    return (
      <Detail
        markdown={`# Could not load catalog\n\nFailed to fetch \`${catalogUrl}\`.\n\n${error.message}\n\nCheck **Preferences → API Base URL**, or open the [gallery](${base}/gallery).`}
        actions={
          <ActionPanel>
            <Action
              title="Retry"
              icon={Icon.ArrowClockwise}
              onAction={revalidate}
            />
            <Action.OpenInBrowser
              title="Open Gallery"
              url={`${base}/gallery`}
            />
          </ActionPanel>
        }
      />
    );
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search artist, title, tone…"
      onSearchTextChange={setSearchText}
      filtering={false}
      throttle
    >
      <List.Section
        title="Wallpaper Curator"
        subtitle={
          data
            ? `${filtered.length} of ${data.total} · from ${base}`
            : undefined
        }
      >
        {filtered.map((w) => (
          <List.Item
            key={w.id}
            title={w.name}
            subtitle={w.artist}
            keywords={[w.id, w.date, w.source, ...w.tones]}
            icon={{ source: w.thumbUrl }}
            accessories={[
              { text: w.date },
              ...(w.tones[0] ? [{ tag: w.tones[0] }] : []),
            ]}
            actions={
              <ActionPanel>
                <Action
                  title="Set as Wallpaper"
                  icon={Icon.Desktop}
                  onAction={() => setWallpaperWithFeedback(w.imageUrl)}
                />
                <Action.OpenInBrowser
                  title="Open Source Image"
                  url={w.imageUrl}
                  icon={Icon.Link}
                />
                <Action.OpenInBrowser
                  title="Open Gallery"
                  url={w.galleryUrl}
                  shortcut={{ modifiers: ["cmd"], key: "g" }}
                />
                <Action.CopyToClipboard
                  title="Copy Image URL"
                  content={w.imageUrl}
                />
                <Action
                  title="Refresh Catalog"
                  icon={Icon.ArrowClockwise}
                  onAction={revalidate}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
