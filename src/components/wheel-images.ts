import { thumbUrl } from "@/lib/wallpapers";

/** Neighbours stay on a smaller Wikimedia step. The centred card uses 960. */
export const NEIGHBOUR_THUMB = 500;
export const CENTER_THUMB = 960;
/**
 * A tiny stand-in (a few KB) that is fetched far ahead of the wheel. When a
 * fast flick outruns the 500px thumbnails, the card shows this instead of
 * nothing, then upgrades in place once the 500px one has decoded.
 */
export const TINY_THUMB = 120;

/**
 * Small LRU of decoded off-screen images. `max` must stay well above the
 * number of URLs one paint asks for (prefetch window + glide path + centre),
 * or the wheel evicts images it is about to show.
 */
function createCache(max: number) {
  type Entry = { img: HTMLImageElement; ready: Promise<boolean>; decoded: boolean };
  // Map iteration order is insertion order: the first key is the oldest.
  const entries = new Map<string, Entry>();

  function touch(url: string, entry: Entry) {
    entries.delete(url);
    entries.set(url, entry);
    while (entries.size > max) {
      const oldest = entries.keys().next().value as string;
      const drop = entries.get(oldest);
      entries.delete(oldest);
      if (drop) {
        drop.img.onload = null;
        drop.img.onerror = null;
        drop.img.src = "";
      }
    }
  }

  return {
    isDecoded(url: string) {
      const entry = entries.get(url);
      return !!entry && entry.decoded && entry.img.naturalWidth > 0;
    },
    load(url: string): Promise<boolean> {
      const hit = entries.get(url);
      if (hit) {
        touch(url, hit);
        return hit.ready;
      }
      const img = new Image();
      img.decoding = "async";
      const entry = { img, decoded: false } as Entry;
      entry.ready = new Promise<boolean>((resolve) => {
        const done = (ok: boolean) => {
          entry.decoded = ok;
          resolve(ok);
        };
        const finish = () => {
          if (typeof img.decode === "function") {
            img.decode().then(() => done(img.naturalWidth > 0)).catch(() => done(false));
          } else {
            done(img.naturalWidth > 0);
          }
        };
        img.onload = finish;
        img.onerror = () => done(false);
      });
      img.src = url;
      touch(url, entry);
      return entry.ready;
    },
  };
}

const main = createCache(48);
// Covers the whole catalog at ~4KB each, so stand-ins are effectively never evicted.
const tiny = createCache(160);

function cacheFor(url: string) {
  return tinyUrls.has(url) ? tiny : main;
}
const tinyUrls = new Set<string>();

export function isDecoded(url: string) {
  return cacheFor(url).isDecoded(url);
}

/** Fetch and decode off-screen. Resolves true once the bitmap is ready to paint. */
export function prefetchUrl(url: string): Promise<boolean> {
  if (typeof Image === "undefined") return Promise.resolve(false);
  return cacheFor(url).load(url);
}

/** URLs each on-screen image is already waiting on, so paint() can call every frame. */
const waiting = new WeakMap<HTMLImageElement, Set<string>>();

/**
 * Show the best picture we can on `img` without ever blanking it.
 *
 * `want` is the resolution this card should end up with; `fallbacks` are
 * lower resolutions of the same painting, best first. A URL is assigned to
 * `img` only after it has decoded off-screen, so a swap never leaves a frame
 * with nothing painted. Until `want` is ready the card keeps what it shows,
 * or climbs the ladder (tiny -> 500px -> want) as each rung decodes. A
 * picture outside the ladder (the 960px while heading back to 500px) is only
 * ever replaced by `want` itself.
 */
export function showDecoded(img: HTMLImageElement, want: string, fallbacks: (string | null)[] = []) {
  if (img.dataset.src === want) return;
  img.dataset.want = want;
  const ladder = [want];
  for (const url of fallbacks) if (url && !ladder.includes(url)) ladder.push(url);
  const rankOf = (src: string | undefined) => {
    if (!src) return Number.POSITIVE_INFINITY;
    const at = ladder.indexOf(src);
    return at < 0 ? 0.5 : at;
  };
  const upgrade = () => {
    if (!img.isConnected || img.dataset.want !== want) return;
    const shown = rankOf(img.dataset.src);
    for (let i = 0; i < ladder.length && i < shown; i += 1) {
      if (isDecoded(ladder[i])) {
        img.src = ladder[i];
        img.dataset.src = ladder[i];
        return;
      }
    }
  };
  upgrade();
  const shown = rankOf(img.dataset.src);
  let pending = waiting.get(img);
  if (!pending) {
    pending = new Set();
    waiting.set(img, pending);
  }
  for (let i = 0; i < ladder.length && i < shown; i += 1) {
    const url = ladder[i];
    if (pending.has(url) || isDecoded(url)) continue;
    pending.add(url);
    const set = pending;
    prefetchUrl(url).then(() => {
      set.delete(url);
      upgrade();
    });
  }
}

const resizedMemo = new Map<string, string | null>();

/** A genuinely resized URL (Wikimedia thumb step or IIIF width), or null. */
function resized(url: string, width: number): string | null {
  const key = `${width} ${url}`;
  const hit = resizedMemo.get(key);
  if (hit !== undefined) return hit;
  const out = resizeUncached(url, width);
  resizedMemo.set(key, out);
  return out;
}

function resizeUncached(url: string, width: number): string | null {
  const thumb = thumbUrl(url, width);
  if (thumb !== url) return thumb;
  const iiif = url
    .replace("/full/full/", `/full/${width},/`)
    .replace("/full/max/", `/full/${width},/`);
  return iiif !== url ? iiif : null;
}

/**
 * Museums without a resize API still publish a smaller "web" rendition.
 * Without it the neighbour tier would be the 3-6MB print original (28-48MB
 * decoded), far too slow to arrive and decode during a fast flick.
 */
function webRendition(url: string): string | null {
  if (url.includes("openaccess-cdn.clevelandart.org/") && url.endsWith("_print.jpg")) {
    return url.replace(/_print\.jpg$/, "_web.jpg");
  }
  if (url.includes("images.metmuseum.org/CRDImages/") && url.includes("/original/")) {
    return url.replace("/original/", "/web-large/");
  }
  return null;
}

/**
 * Wikimedia thumbs, or an IIIF width when the source is not Commons. The
 * neighbour tier falls back to a museum's web rendition; the centred size
 * keeps the original when nothing smaller exists.
 */
export function sizedSource(url: string, width: number) {
  return resized(url, width) ?? (width <= NEIGHBOUR_THUMB ? webRendition(url) : null) ?? url;
}

export function thumbFor(url: string, centered: boolean) {
  return sizedSource(url, centered ? CENTER_THUMB : NEIGHBOUR_THUMB);
}

/**
 * The tiny stand-in for `url`, or null when the source cannot be resized
 * (then the "tiny" file would be a full-size image, the opposite of cheap).
 */
export function tinyFor(url: string) {
  const sized = resized(url, TINY_THUMB);
  if (sized) tinyUrls.add(sized);
  return sized;
}

/**
 * Everything the opening spin needs decoded before the wheel is revealed:
 * the target at the centred size, its resting neighbours at 500px, and a
 * stand-in for every card the spin passes. Ordered so the target's own tiers
 * are requested first.
 */
export function introUrls(
  urls: { target: string; neighbours: string[]; path: string[] },
): string[] {
  const out: string[] = [];
  const add = (url: string | null) => {
    if (url && !out.includes(url)) out.push(url);
  };
  add(thumbFor(urls.target, false));
  add(thumbFor(urls.target, true));
  for (const url of urls.neighbours) add(thumbFor(url, false));
  for (const url of urls.path) add(tinyFor(url) ?? thumbFor(url, false));
  return out;
}

/** Resolves once every URL has decoded (or failed), or after `timeoutMs`. */
export function decodeAll(urls: string[], timeoutMs: number): Promise<"ready" | "timeout"> {
  const all = Promise.all(urls.map((url) => prefetchUrl(url))).then(() => "ready" as const);
  const late = new Promise<"timeout">((resolve) => window.setTimeout(() => resolve("timeout"), timeoutMs));
  return Promise.race([all, late]);
}
