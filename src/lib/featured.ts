import type { Wallpaper } from "@/lib/wallpapers";

/**
 * Hand-picked paintings for the landing page and share images. All are
 * Wikimedia Commons sources so they resize to exact thumbnail steps.
 */
export const LANDING_WHEEL_IDS = [
  "valenciennes-clouds-roman-campagna",
  "aivazovsky-in-the-roads-evening",
  "turner-dogana-salute-venice",
  "bierstadt-lake-lucerne",
  "monet-argenteuil",
] as const;

export const LANDING_COLLECTION_IDS = [
  "pissarro-garden-full-sunlight",
  "gurlitt-cliffs-mon",
  "jean-victor-bertin-le-paysage-d-italie",
  "felix-vallotton-plage-au-matin-houlgate",
] as const;

export const OG_IDS = [
  "aivazovsky-in-the-roads-evening",
  "turner-dogana-salute-venice",
  "bierstadt-lake-lucerne",
] as const;

/** Look up `ids` in catalog order of `ids`, topping up from `all` if any went missing. */
export function pick(all: Wallpaper[], ids: readonly string[]): Wallpaper[] {
  const found = ids
    .map((id) => all.find((w) => w.id === id))
    .filter((w): w is Wallpaper => Boolean(w));
  for (const w of all) {
    if (found.length >= ids.length) break;
    if (!found.includes(w) && w.url.includes("upload.wikimedia.org")) found.push(w);
  }
  return found;
}
