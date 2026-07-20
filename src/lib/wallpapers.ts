export type Wallpaper = {
  id: string;
  name: string;
  artist: string;
  date: string;
  url: string;
  size?: number;
  tones: string[];
  source: string;
};

/**
 * Wikimedia only serves these thumbnail widths for direct hotlinks
 * (see https://w.wiki/GHai). Other sizes return HTTP 400.
 */
export const WIKIMEDIA_THUMB_STEPS = [
  20, 40, 60, 120, 250, 330, 500, 960, 1280, 1920, 3840,
] as const;

/** Round up to the nearest allowed Wikimedia thumbnail width. */
export function snapWikimediaThumbWidth(width: number): number {
  const w = Math.max(1, Math.ceil(width));
  for (const step of WIKIMEDIA_THUMB_STEPS) {
    if (step >= w) return step;
  }
  return WIKIMEDIA_THUMB_STEPS[WIKIMEDIA_THUMB_STEPS.length - 1];
}

/** Wikimedia commons → thumbnail URL (falls back to original). */
export function thumbUrl(url: string, width = 500): string {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("upload.wikimedia.org")) return url;
    const parts = u.pathname.split("/").filter(Boolean);
    const commonsIdx = parts.indexOf("commons");
    if (commonsIdx < 0 || parts.length < commonsIdx + 4) return url;
    if (parts[commonsIdx + 1] === "thumb") return url;
    const a = parts[commonsIdx + 1];
    const ab = parts[commonsIdx + 2];
    const file = parts.slice(commonsIdx + 3).join("/");
    const base = file.split("/").pop() ?? file;
    const snapped = snapWikimediaThumbWidth(width);
    return `https://upload.wikimedia.org/wikipedia/commons/thumb/${a}/${ab}/${file}/${snapped}px-${base}`;
  } catch {
    return url;
  }
}

export function fmtSize(n?: number): string {
  if (n == null || n <= 0) return "—";
  const u = ["B", "K", "M", "G"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return (i === 0 ? v.toFixed(0) : v.toFixed(1)) + u[i];
}
