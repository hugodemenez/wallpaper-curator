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

async function toJpegFile(blob: Blob, baseName: string): Promise<File> {
  if (typeof createImageBitmap !== "function") {
    return new File([blob], `${baseName}.jpg`, {
      type: blob.type.startsWith("image/") ? blob.type : "image/jpeg",
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

export function canNativeShareFiles(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof navigator.share === "function"
  );
}

/** Download + JPEG-encode for the iOS share sheet. */
export async function prepareWallpaperFile(
  imageUrl: string,
  title: string,
): Promise<File> {
  const res = await fetch(proxiedUrl(imageUrl));
  if (!res.ok) throw new Error(`Could not download image (${res.status})`);
  return toJpegFile(await res.blob(), safeBaseName(title));
}

export type ShareResult = "shared" | "cancelled" | "unsupported";

/** Trigger the OS share sheet with a prepared image file. Never opens a tab. */
export async function shareWallpaperFile(file: File): Promise<ShareResult> {
  if (!canNativeShareFiles()) return "unsupported";

  const payload: ShareData = { files: [file] };
  if (typeof navigator.canShare === "function" && !navigator.canShare(payload)) {
    return "unsupported";
  }

  try {
    await navigator.share(payload);
    return "shared";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return "cancelled";
    }
    throw err;
  }
}
