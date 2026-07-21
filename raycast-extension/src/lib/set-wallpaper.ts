import { showHUD, showToast, Toast } from "@raycast/api";
import { runAppleScript } from "@raycast/utils";
import { mkdir, writeFile } from "fs/promises";
import { basename, extname, join } from "path";
import { homedir } from "os";

function escapeAppleScript(path: string): string {
  return path.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function filenameFromUrl(url: string): string {
  try {
    const name = decodeURIComponent(basename(new URL(url).pathname));
    if (name && name !== "/" && extname(name)) return name;
  } catch {
    /* ignore */
  }
  return `wallpaper-${Date.now()}.jpg`;
}

/** Download from the real source URL and set every desktop via AppleScript. */
export async function setWallpaperFromUrl(url: string): Promise<void> {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error("Missing image URL");
  }

  const res = await fetch(trimmed);
  if (!res.ok) {
    throw new Error(`Download failed (HTTP ${res.status})`);
  }

  const bytes = Buffer.from(await res.arrayBuffer());
  const dir = join(homedir(), ".cache", "wallpaper-curator");
  await mkdir(dir, { recursive: true });
  const dest = join(dir, filenameFromUrl(trimmed));
  await writeFile(dest, bytes);

  const escaped = escapeAppleScript(dest);
  await runAppleScript(`
tell application "System Events"
  tell every desktop
    set picture to POSIX file "${escaped}"
  end tell
end tell
`);
}

export async function setWallpaperWithFeedback(url: string): Promise<void> {
  try {
    await setWallpaperFromUrl(url);
    await showHUD("Wallpaper set");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await showToast({
      style: Toast.Style.Failure,
      title: "Could not set wallpaper",
      message,
    });
  }
}
