export function isAppleMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPhone UA contains "like Mac OS X" — do not treat that as desktop Mac.
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  // iPadOS 13+ can report as MacIntel with touch
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/**
 * Raycast wallpaper command uses AppleScript — macOS desktop only.
 * iOS Raycast cannot run that command; never offer raycast:// there.
 */
export function canUseRaycastWallpaper(): boolean {
  if (typeof navigator === "undefined") return false;
  if (isAppleMobile()) return false;
  const ua = navigator.userAgent;
  // Require Macintosh (desktop), not merely "Mac OS X" (also in iOS UAs).
  return /Macintosh/i.test(ua) && !/Mobile/i.test(ua);
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
