/**
 * The Rotapicta mark: a classical eight-spoked wheel (rota) with one segment
 * painted (picta). Pure geometry so the favicon, PNG icons, OG image and the
 * inline React mark all draw exactly the same shape.
 */

const C = 32;
const RIM = 27;
const INNER = 21.5;
const HUB = 4.6;

function pt(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return `${(C + r * Math.cos(rad)).toFixed(3)} ${(C + r * Math.sin(rad)).toFixed(3)}`;
}

/** The painted wedge, between the 12 o'clock and 1:30 spokes. */
export const MARK_WEDGE = `M${C} ${C} L${pt(INNER, 0)} A${INNER} ${INNER} 0 0 1 ${pt(INNER, 45)} Z`;

export const MARK_SPOKES = Array.from({ length: 8 }, (_, i) => `M${pt(HUB, i * 45)} L${pt(INNER, i * 45)}`).join(" ");

export const MARK_GEOMETRY = { C, RIM, INNER, HUB };

type MarkColors = { ink: string; paint: string; bg?: string; rounded?: number; inset?: number };

/** Standalone SVG source (64×64 viewBox), for icons and OG images. */
export function markSvg({ ink, paint, bg, rounded = 0, inset = 0 }: MarkColors) {
  const s = 64 + inset * 2;
  const back = bg
    ? `<rect x="${-inset}" y="${-inset}" width="${s}" height="${s}" rx="${rounded}" fill="${bg}"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-inset} ${-inset} ${s} ${s}" width="${s}" height="${s}">${back}<path d="${MARK_WEDGE}" fill="${paint}"/><circle cx="${C}" cy="${C}" r="${RIM}" fill="none" stroke="${ink}" stroke-width="3"/><circle cx="${C}" cy="${C}" r="${INNER}" fill="none" stroke="${ink}" stroke-width="1.4"/><path d="${MARK_SPOKES}" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/><circle cx="${C}" cy="${C}" r="${HUB}" fill="${ink}"/></svg>`;
}

/** Brand colours outside CSS (icons, OG). */
export const BRAND = {
  ivory: "#f6f2ea",
  ink: "#1d1916",
  night: "#151210",
  pompeian: "#a8402c",
  terracotta: "#d9805e",
} as const;
