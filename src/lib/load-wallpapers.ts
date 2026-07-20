import { readFileSync } from "fs";
import { join } from "path";
import { parse } from "yaml";
import type { Wallpaper } from "./wallpapers";

let cache: Wallpaper[] | null = null;

export function loadWallpapers(): Wallpaper[] {
  if (cache) return cache;
  const path = join(process.cwd(), "data", "wallpapers.yaml");
  const raw = readFileSync(path, "utf8");
  const data = parse(raw) as Wallpaper[];
  if (!Array.isArray(data)) {
    throw new Error("data/wallpapers.yaml must be a list");
  }
  cache = data;
  return data;
}
