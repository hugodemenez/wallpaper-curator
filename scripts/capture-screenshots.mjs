/**
 * Capture desktop screenshots for the README.
 * Requires: npx playwright install chromium
 *
 *   SITE_URL=https://wallpaper-curator.vercel.app node scripts/capture-screenshots.mjs
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const base = process.env.SITE_URL ?? "https://wallpaper-curator.vercel.app";
const dir = join(process.cwd(), "docs/screenshots");
mkdirSync(dir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

async function shot(path, file, settleMs) {
  console.log("capturing", path);
  await page.goto(base + path, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForSelector("img", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(settleMs);
  const png = await page.screenshot({ fullPage: false, type: "png" });
  const out = join(dir, file);
  await sharp(png)
    .resize(1440, 900, { fit: "fill" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out);
  console.log("wrote", file);
}

await shot("/", "landing-desktop.jpg", 3000);
await shot("/gallery", "gallery-desktop.jpg", 5000);
await browser.close();
console.log("done");
