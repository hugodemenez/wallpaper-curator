/** Raycast wallpaper command is macOS-only (AppleScript). */
export function canUseRaycastWallpaper(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isMac = /Macintosh|Mac OS X/i.test(ua);
  const isIpadDesktopUa =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return isMac && !isIpadDesktopUa;
}

export function isAppleMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  // iPadOS 13+ reports as Mac with touch
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

export function canShareFiles(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  if (typeof navigator.canShare !== "function") return true;
  try {
    const probe = new File(["x"], "probe.jpg", { type: "image/jpeg" });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}
