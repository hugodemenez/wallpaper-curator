import { thumbUrl } from "@/lib/wallpapers";

/** Neighbours stay on a smaller Wikimedia step. The centred card uses 960. */
export const NEIGHBOUR_THUMB = 500;
export const CENTER_THUMB = 960;

const MAX_ENTRIES = 28;

type Entry = {
  img: HTMLImageElement;
  ready: Promise<boolean>;
};

const entries = new Map<string, Entry>();
const recent: string[] = [];

function remember(url: string) {
  const at = recent.indexOf(url);
  if (at >= 0) recent.splice(at, 1);
  recent.push(url);
  while (recent.length > MAX_ENTRIES) {
    const drop = recent.shift();
    if (!drop) break;
    const entry = entries.get(drop);
    entries.delete(drop);
    if (entry) {
      entry.img.onload = null;
      entry.img.onerror = null;
      entry.img.src = "";
    }
  }
}

export function isDecoded(url: string) {
  const entry = entries.get(url);
  return !!entry && entry.img.complete && entry.img.naturalWidth > 0;
}

/** Decode a thumbnail off-screen and keep only a small recent set. */
export function prefetchUrl(url: string): Promise<boolean> {
  if (typeof Image === "undefined") return Promise.resolve(false);
  const hit = entries.get(url);
  if (hit) {
    remember(url);
    return hit.ready;
  }
  const img = new Image();
  img.decoding = "async";
  const ready = new Promise<boolean>((resolve) => {
    const finish = () => {
      if (typeof img.decode === "function") {
        img.decode().then(() => resolve(img.naturalWidth > 0)).catch(() => resolve(false));
      } else {
        resolve(img.naturalWidth > 0);
      }
    };
    if (img.complete && img.naturalWidth > 0) {
      finish();
      return;
    }
    img.onload = finish;
    img.onerror = () => resolve(false);
  });
  img.src = url;
  entries.set(url, { img, ready });
  remember(url);
  return ready;
}

/**
 * Show `url` on `img`. A new bitmap is assigned only after it has decoded,
 * so a swap never clears the picture that is already on screen.
 */
export function showDecoded(img: HTMLImageElement, url: string) {
  if (img.dataset.src === url) return;
  img.dataset.want = url;
  const commit = () => {
    if (!img.isConnected || img.dataset.want !== url || img.dataset.src === url) return;
    img.src = url;
    img.dataset.src = url;
    if (typeof img.decode === "function") img.decode().catch(() => undefined);
  };
  if (isDecoded(url)) {
    commit();
    return;
  }
  if (!img.getAttribute("src")) {
    img.src = url;
    img.dataset.src = url;
  }
  prefetchUrl(url).then(() => {
    if (isDecoded(url)) commit();
  });
}

/** Wikimedia thumbs, or an IIIF width when the source is not Commons. */
export function sizedSource(url: string, width: number) {
  const thumb = thumbUrl(url, width);
  if (thumb !== url) return thumb;
  return url
    .replace("/full/full/", `/full/${width},/`)
    .replace("/full/max/", `/full/${width},/`);
}

export function thumbFor(url: string, centered: boolean) {
  return sizedSource(url, centered ? CENTER_THUMB : NEIGHBOUR_THUMB);
}
