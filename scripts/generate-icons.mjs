/**
 * Regenerates favicon / touch / manifest icons from src/lib/brand-mark.ts.
 *   node --experimental-strip-types scripts/generate-icons.mjs
 */
import { writeFileSync } from "node:fs";
import sharp from "sharp";
import { markSvg, BRAND } from "../src/lib/brand-mark.ts";

const tile = (inset, rounded) =>
  markSvg({ ink: BRAND.ivory, paint: BRAND.terracotta, bg: BRAND.night, inset, rounded });

// Favicon: tight inset so the wheel reads at 16-32px.
const fav = tile(4, 14);
writeFileSync("public/favicon.svg", fav + "\n");
writeFileSync("src/app/icon.svg", fav + "\n");

async function png(svg, size) {
  return sharp(Buffer.from(svg), { density: 600 }).resize(size, size).png().toBuffer();
}

// iOS masks the corners itself, so the touch icon is square and roomier.
const touch = tile(14, 0);
writeFileSync("public/apple-touch-icon.png", await png(touch, 180));
writeFileSync("public/icon-192.png", await png(touch, 192));
writeFileSync("public/icon-512.png", await png(touch, 512));
writeFileSync("public/icon-maskable-512.png", await png(tile(30, 0), 512));

// favicon.ico with embedded PNGs (16, 32, 48).
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((s) => png(fav, s)));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const at = 6 + i * 16;
  header.writeUInt8(s, at);
  header.writeUInt8(s, at + 1);
  header.writeUInt16LE(1, at + 4);
  header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(pngs[i].length, at + 8);
  header.writeUInt32LE(offset, at + 12);
  offset += pngs[i].length;
});
const ico = Buffer.concat([header, ...pngs]);
writeFileSync("public/favicon.ico", ico);
writeFileSync("src/app/favicon.ico", ico);
console.log("icons written");
