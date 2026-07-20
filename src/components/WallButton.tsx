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

export function WallButton({
  imageUrl,
  title,
  className,
  onClickCapture,
}: Props) {
  const [mode, setMode] = useState<Mode>("pending");
  const [busy, setBusy] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shareFile, setShareFile] = useState<File | null>(null);
  const [shareReady, setShareReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMode(canUseRaycastWallpaper() ? "raycast" : "share");
    setShareReady(canNativeShareFiles());
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const label =
    mode === "raycast"
      ? `Set ${title} as wallpaper with Raycast`
      : `Share ${title} to set as wallpaper`;

  async function openShareFlow(e: React.MouseEvent) {
    onClickCapture?.(e);
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;

    setBusy(true);
    setError(null);
    try {
      const file = await prepareWallpaperFile(thumbUrl(imageUrl, 1920), title);
      setShareFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return objectUrl;
      });

      // Prefer the native sheet immediately (needs HTTPS / secure context).
      if (canNativeShareFiles()) {
        const result = await shareWallpaperFile(file);
        if (result === "shared" || result === "cancelled") {
          setBusy(false);
          return;
        }
      }

      // Stay in-app — never open a new tab. Sheet can re-trigger share.
      setSheetOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not prepare image");
      setSheetOpen(true);
    } finally {
      setBusy(false);
    }
  }

  async function retryShare() {
    if (!shareFile || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (!canNativeShareFiles()) {
        setError(
          "Share needs a secure page (HTTPS). Use the address starting with https://, or long-press the image below.",
        );
        return;
      }
      const result = await shareWallpaperFile(shareFile);
      if (result === "unsupported") {
        setError("This browser can’t share image files. Long-press the image instead.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Share failed");
    } finally {
      setBusy(false);
    }
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
              Set as wallpaper
            </h2>

            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={styles.tipPreview}
                src={previewUrl}
                alt={title}
              />
            )}

            <p className={styles.tipLead}>
              {shareReady
                ? "Tap Share to open iOS — look for Use as Wallpaper."
                : "This page isn’t HTTPS yet, so Safari blocked Share. Long-press the image → Share → Use as Wallpaper."}
            </p>

            {error && <p className={styles.tipError}>{error}</p>}

            <div className={styles.tipActions}>
              <button
                type="button"
                className={styles.tipClose}
                onClick={retryShare}
                disabled={busy || !shareFile}
              >
                {busy ? "Preparing…" : "Share"}
              </button>
              <button
                type="button"
                className={styles.tipSecondary}
                onClick={closeSheet}
              >
                Close
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
