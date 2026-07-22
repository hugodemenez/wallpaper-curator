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
import { DetachedSheet } from "@/components/silk";
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
  const [error, setError] = useState<string | null>(null);
  const [shareReady, setShareReady] = useState(false);

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
      : `How to set ${title} as wallpaper`;

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

  async function openInstructions(e: React.MouseEvent) {
    onClickCapture?.(e);
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;

    setBusy(true);
    setError(null);
    try {
      await ensurePrepared();
      setSheetOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not prepare image");
      setSheetOpen(true);
    } finally {
      setBusy(false);
    }
  }

  async function shareNow() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (!canNativeShareFiles()) {
        setError(
          "Share needs HTTPS. Long-press the image above → Share → Save Image instead.",
        );
        return;
      }
      const file = await ensurePrepared();
      const result = await shareWallpaperFile(file);
      if (result === "unsupported") {
        setError("This browser can’t share files. Long-press the image instead.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Share failed");
    } finally {
      setBusy(false);
    }
  }

  function openPhotos() {
    window.location.href = "photos-redirect://";
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
    <DetachedSheet.Root
      presented={sheetOpen}
      onPresentedChange={(open) => {
        setSheetOpen(open);
        if (!open) setError(null);
      }}
    >
      <button
        type="button"
        className={`${styles.wallBtn} ${className ?? ""}`}
        aria-label={label}
        aria-busy={busy || mode === "pending"}
        disabled={busy || mode === "pending"}
        onClick={openInstructions}
      >
        {busy ? "…" : "wall"}
      </button>

      <DetachedSheet.Portal>
        <DetachedSheet.View>
          <DetachedSheet.Backdrop />
          <DetachedSheet.Content>
            <div className={styles.tipRoot}>
              <DetachedSheet.Handle className={styles.tipHandle} />
              <DetachedSheet.Title className={styles.tipTitle}>
                Set as wallpaper
              </DetachedSheet.Title>

              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className={styles.tipPreview}
                  src={previewUrl}
                  alt={title}
                />
              )}

              <DetachedSheet.Description asChild>
                <ol className={styles.tipSteps}>
                  <li>
                    Tap <strong>Save to Photos</strong> below (Safari shows{" "}
                    <strong>Save Image</strong>).
                  </li>
                  <li>
                    Open <strong>Photos</strong> and select the painting.
                  </li>
                  <li>
                    Tap <strong>Share</strong> → <strong>Use as Wallpaper</strong>.
                  </li>
                  <li>Choose Lock Screen, Home Screen, or both.</li>
                </ol>
              </DetachedSheet.Description>

              {!shareReady && (
                <p className={styles.tipLead}>
                  Or long-press the image → Share → Save Image.
                </p>
              )}

              {error && <p className={styles.tipError}>{error}</p>}

              <div className={styles.tipActions}>
                <button
                  type="button"
                  className={styles.tipClose}
                  onClick={shareNow}
                  disabled={busy || !shareFile}
                >
                  {busy ? "…" : "Save to Photos"}
                </button>
                <button
                  type="button"
                  className={styles.tipSecondary}
                  onClick={openPhotos}
                >
                  Open Photos
                </button>
                <DetachedSheet.Trigger action="dismiss" asChild>
                  <button type="button" className={styles.tipSecondary}>
                    Close
                  </button>
                </DetachedSheet.Trigger>
              </div>
            </div>
          </DetachedSheet.Content>
        </DetachedSheet.View>
      </DetachedSheet.Portal>
    </DetachedSheet.Root>
  );
}
