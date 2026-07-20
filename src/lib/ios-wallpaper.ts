function proxiedUrl(imageUrl: string): string {
  return `/api/image?url=${encodeURIComponent(imageUrl)}`;
}

/**
 * Best-effort path for iOS/Android: share the image file so the OS share
 * sheet can offer Save Image / Set as wallpaper. Web pages cannot set
 * wallpaper programmatically on iOS.
 */
export async function shareImageForWallpaper(
  imageUrl: string,
  title: string,
): Promise<"shared" | "cancelled" | "opened"> {
  const res = await fetch(proxiedUrl(imageUrl));
  if (!res.ok) throw new Error(`Could not download image (${res.status})`);

  const blob = await res.blob();
  const type = blob.type || "image/jpeg";
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
  const safeName =
    title
      .replace(/[^\w\s-]+/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 48) || "wallpaper";
  const file = new File([blob], `${safeName}.${ext}`, { type });

  if (typeof navigator.share === "function") {
    try {
      // Files-only payload works best on iOS (title/url can hide Save Image).
      if (
        typeof navigator.canShare !== "function" ||
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({ files: [file] });
        return "shared";
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled";
      }
      // fall through to open
    }
  }

  // Fallback: open the image so the user can long-press → Add to Photos
  window.open(imageUrl, "_blank", "noopener,noreferrer");
  return "opened";
}
