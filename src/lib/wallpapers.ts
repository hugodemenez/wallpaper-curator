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

/** Wikimedia commons → thumbnail URL (falls back to original). */
export function thumbUrl(url: string, width = 640): string {
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
    return `https://upload.wikimedia.org/wikipedia/commons/thumb/${a}/${ab}/${file}/${width}px-${base}`;
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
