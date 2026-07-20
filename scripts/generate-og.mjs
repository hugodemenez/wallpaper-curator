/**
 * Build a static 1200×630 JPEG for social cards.
 * X/Twitterbot is unreliable with dynamic /opengraph-image routes on Vercel
 * (cache BYPASS / cold renders). Serve public/og.jpg instead.
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { parse } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const W = 1200;
const H = 630;
const PAD = 28;
const GAP = 10;
const FOOTER = 150;
const WIKI_STEPS = [20, 40, 60, 120, 250, 330, 500, 960, 1280, 1920, 3840];

function snap(width) {
  const w = Math.max(1, Math.ceil(width));
  for (const step of WIKI_STEPS) if (step >= w) return step;
  return WIKI_STEPS[WIKI_STEPS.length - 1];
}

function thumbUrl(url, width = 320) {
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
    const snapped = snap(width);
    return `https://upload.wikimedia.org/wikipedia/commons/thumb/${a}/${ab}/${file}/${snapped}px-${base}`;
  } catch {
    return url;
  }
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function fetchBuf(url) {
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "WallpaperCurator/1.0 (github.com/hugodemenez/wallpaper-curator; contact via GitHub)",
          Accept: "image/*",
        },
      });
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`fetch ${url} → ${res.status}`);
        await sleep(800 * (attempt + 1));
        continue;
      }
      if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      lastErr = e;
      await sleep(800 * (attempt + 1));
    }
  }
  throw lastErr;
}

const outPublic = join(root, "public/og.jpg");

try {
  const wallpapers = parse(
    readFileSync(join(root, "data/wallpapers.yaml"), "utf8"),
  );
  const picks = [...wallpapers]
    .sort(
      (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id),
    )
    .slice(0, 4);

  const galleryH = H - FOOTER - PAD;
  const cellW = Math.floor(
    (W - PAD * 2 - GAP * (picks.length - 1)) / picks.length,
  );

  const panels = [];
  for (let i = 0; i < picks.length; i++) {
    const w = picks[i];
    const buf = await fetchBuf(thumbUrl(w.url, 330));
    const panel = await sharp(buf)
      .resize(cellW, galleryH, { fit: "cover", position: "centre" })
      .jpeg()
      .toBuffer();
    panels.push({
      input: panel,
      left: PAD + i * (cellW + GAP),
      top: PAD,
    });
    await sleep(250);
  }

  const titleSvg = Buffer.from(`
<svg width="${W}" height="${FOOTER}" xmlns="http://www.w3.org/2000/svg">
  <rect x="36" y="18" width="${W - 72}" height="6" fill="#5c4033"/>
  <text x="36" y="78" font-family="Georgia, 'Times New Roman', serif" font-size="54" font-weight="500" fill="#2a221c">Wallpaper Curator</text>
  <text x="36" y="118" font-family="Georgia, 'Times New Roman', serif" font-size="26" fill="#5c4033">Public-domain paintings, set as wallpaper.</text>
</svg>
`);

  const jpeg = await sharp({
    create: {
      width: W,
      height: H,
      channels: 3,
      background: "#ddd7cc",
    },
  })
    .composite([
      ...panels,
      { input: titleSvg, left: 0, top: H - FOOTER },
    ])
    .jpeg({
      quality: 82,
      mozjpeg: true,
      progressive: false,
    })
    .toBuffer();

  mkdirSync(join(root, "public"), { recursive: true });
  writeFileSync(outPublic, jpeg);
  console.log(`Wrote ${outPublic} (${jpeg.length} bytes)`);
} catch (err) {
  if (existsSync(outPublic)) {
    console.warn(
      "generate-og failed; keeping existing public/og.jpg:",
      err instanceof Error ? err.message : err,
    );
    process.exit(0);
  }
  console.error(err);
  process.exit(1);
}
