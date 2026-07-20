function proxiedUrl(imageUrl: string): string {
  return `/api/image?url=${encodeURIComponent(imageUrl)}`;
}

function safeBaseName(title: string): string {
  return (
    title
      .replace(/[^\w\s-]+/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 48) || "wallpaper"
  );
}

/**
 * Re-encode as a plain JPEG File. iOS share sheet shows image actions
 * (Save Image / Use as Wallpaper) more reliably for public.jpeg than for
 * odd museum MIME types or WebP.
 */
async function toJpegFile(blob: Blob, baseName: string): Promise<File> {
  if (typeof createImageBitmap !== "function") {
    return new File([blob], `${baseName}.jpg`, {
      type: blob.type || "image/jpeg",
    });
  }

  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
    }
    ctx.drawImage(bitmap, 0, 0);
    const jpeg = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );
    if (!jpeg) {
      return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
    }
    return new File([jpeg], `${baseName}.jpg`, { type: "image/jpeg" });
  } finally {
    bitmap.close?.();
  }
}

/**
 * Share an image so iOS can offer Use as Wallpaper / Save Image.
 * Websites cannot set wallpaper themselves — the share sheet can.
 */
export async function shareImageForWallpaper(
  imageUrl: string,
  title: string,
): Promise<"shared" | "cancelled" | "opened"> {
  const res = await fetch(proxiedUrl(imageUrl));
  if (!res.ok) throw new Error(`Could not download image (${res.status})`);

  const blob = await res.blob();
  const file = await toJpegFile(blob, safeBaseName(title));

  if (typeof navigator.share === "function") {
    try {
      // Files-only: title/text/url often hide image actions on iOS.
      const payload: ShareData = { files: [file] };
      if (
        typeof navigator.canShare !== "function" ||
        navigator.canShare(payload)
      ) {
        await navigator.share(payload);
        return "shared";
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  window.open(imageUrl, "_blank", "noopener,noreferrer");
  return "opened";
}
