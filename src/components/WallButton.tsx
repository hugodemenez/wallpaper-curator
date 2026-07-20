"use client";

import { useEffect, useState } from "react";
import { wallpaperDeeplink } from "@/lib/raycast";
import {
  canNativeShareFiles,
  prepareWallpaperFile,
  shareWallpaperFile,
} from "@/lib/ios-wallpaper";
import { canUseRaycastWallpaper } from "@/lib/platform";
import { thumbUrl } from "@/lib/wallpapers";
import styles from "./wall-button.module.css";

type Props = {
  imageUrl: string;
  title: string;
  className?: string;
  onClickCapture?: (e: React.MouseEvent) => void;
};

type Mode = "pending" | "raycast" | "share";
type SheetKind = "guide" | "https";

export function WallButton({
  imageUrl,
  title,
  className,
  onClickCapture,
}: Props) {
  const [mode, setMode] = useState<Mode>("pending");
  const [busy, setBusy] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetKind, setSheetKind] = useState<SheetKind>("guide");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shareFile, setShareFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMode(canUseRaycastWallpaper() ? "raycast" : "share");
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const label =
    mode === "raycast"
      ? `Set ${title} as wallpaper with Raycast`
      : `Save ${title} and set as wallpaper`;

  async function ensurePrepared() {
    if (shareFile && previewUrl) return shareFile;
    const file = await prepareWallpaperFile(thumbUrl(imageUrl, 1920), title);
    setShareFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return objectUrl;
    });
    return file;
  }

  function showGuide() {
    setSheetKind("guide");
    setSheetOpen(true);
  }

  async function openShareFlow(e: React.MouseEvent) {
    onClickCapture?.(e);
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;

    setBusy(true);
    setError(null);
    try {
      const file = await ensurePrepared();

      if (!canNativeShareFiles()) {
        setSheetKind("https");
        setSheetOpen(true);
        return;
      }

      const result = await shareWallpaperFile(file);
      // Safari’s sheet offers Save Image, not Use as Wallpaper.
      // After save (or dismiss), walk them through Photos.
      if (result === "shared") {
        showGuide();
      } else if (result === "cancelled") {
        // They may have saved before cancelling — still show the path.
        showGuide();
      } else {
        showGuide();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not prepare image");
      showGuide();
    } finally {
      setBusy(false);
    }
  }

  async function retryShare() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (!canNativeShareFiles()) {
        setSheetKind("https");
        setError("Share needs HTTPS. Long-press the image below instead.");
        return;
      }
      const file = await ensurePrepared();
      const result = await shareWallpaperFile(file);
      if (result === "shared" || result === "cancelled") {
        setSheetKind("guide");
      } else if (result === "unsupported") {
        setError("This browser can’t share files. Long-press the image instead.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Share failed");
    } finally {
      setBusy(false);
    }
  }

  function openPhotos() {
    // Undocumented but widely used — opens the Photos app.
    window.location.href = "photos-redirect://";
  }

  function closeSheet() {
    setSheetOpen(false);
    setError(null);
  }

  if (mode === "raycast") {
    return (
      <a
        className={className}
        href={wallpaperDeeplink(imageUrl)}
        aria-label={label}
        onClick={onClickCapture}
      >
        wall
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`${styles.wallBtn} ${className ?? ""}`}
        aria-label={label}
        aria-busy={busy || mode === "pending"}
        disabled={busy || mode === "pending"}
        onClick={openShareFlow}
      >
        {busy ? "…" : "wall"}
      </button>

      {sheetOpen && (
        <div
          className={styles.tip}
          role="dialog"
          aria-modal="true"
          aria-labelledby="wall-tip-title"
        >
          <div className={styles.tipCard}>
            <h2 id="wall-tip-title" className={styles.tipTitle}>
              {sheetKind === "https"
                ? "One more step"
                : "Almost there — set wallpaper"}
            </h2>

            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={styles.tipPreview}
                src={previewUrl}
                alt={title}
              />
            )}

            {sheetKind === "https" ? (
              <p className={styles.tipLead}>
                Long-press the image → <strong>Share</strong> →{" "}
                <strong>Save Image</strong>, then follow the Photos steps below.
              </p>
            ) : (
              <>
                <p className={styles.tipLead}>
                  Safari only offers <strong>Save Image</strong> here — Apple
                  keeps <strong>Use as Wallpaper</strong> inside Photos.
                </p>
                <ol className={styles.tipSteps}>
                  <li>
                    In the share sheet, tap <strong>Save Image</strong>.
                  </li>
                  <li>
                    Open <strong>Photos</strong> and select the painting
                    (usually newest).
                  </li>
                  <li>
                    Tap <strong>Share</strong> →{" "}
                    <strong>Use as Wallpaper</strong>.
                  </li>
                  <li>Choose Lock Screen, Home Screen, or both.</li>
                </ol>
              </>
            )}

            {error && <p className={styles.tipError}>{error}</p>}

            <div className={styles.tipActions}>
              <button
                type="button"
                className={styles.tipClose}
                onClick={openPhotos}
              >
                Open Photos
              </button>
              <button
                type="button"
                className={styles.tipSecondary}
                onClick={retryShare}
                disabled={busy}
              >
                {busy ? "…" : "Share again"}
              </button>
              <button
                type="button"
                className={styles.tipSecondary}
                onClick={closeSheet}
              >
                Done
              </button>
            </div>
          </div>
          <button
            type="button"
            className={styles.tipBackdrop}
            aria-label="Dismiss"
            onClick={closeSheet}
          />
        </div>
      )}
    </>
  );
}
