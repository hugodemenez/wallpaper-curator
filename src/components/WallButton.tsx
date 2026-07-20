"use client";

import { useEffect, useState } from "react";
import { wallpaperDeeplink } from "@/lib/raycast";
import { shareImageForWallpaper } from "@/lib/ios-wallpaper";
import {
  canShareFiles,
  canUseRaycastWallpaper,
  isAppleMobile,
} from "@/lib/platform";
import { thumbUrl } from "@/lib/wallpapers";
import styles from "./wall-button.module.css";

type Props = {
  imageUrl: string;
  title: string;
  className?: string;
  onClickCapture?: (e: React.MouseEvent) => void;
};

export function WallButton({
  imageUrl,
  title,
  className,
  onClickCapture,
}: Props) {
  const [mode, setMode] = useState<"raycast" | "share" | "open">("raycast");
  const [busy, setBusy] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);

  useEffect(() => {
    if (canUseRaycastWallpaper()) {
      setMode("raycast");
      return;
    }
    setMode(canShareFiles() || isAppleMobile() ? "share" : "open");
  }, []);

  const label =
    mode === "raycast"
      ? `Set ${title} as wallpaper with Raycast`
      : `Share ${title} to set as wallpaper`;

  async function onShareClick(e: React.MouseEvent) {
    onClickCapture?.(e);
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      // Phone screens don't need 30MB museum masters — 1920px is plenty.
      const shareUrl = thumbUrl(imageUrl, 1920);
      const result = await shareImageForWallpaper(shareUrl, title);
      if (result === "shared" || result === "opened") {
        setTipOpen(true);
      }
    } catch {
      window.open(imageUrl, "_blank", "noopener,noreferrer");
      setTipOpen(true);
    } finally {
      setBusy(false);
    }
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
        aria-busy={busy}
        disabled={busy}
        onClick={onShareClick}
      >
        {busy ? "…" : "wall"}
      </button>

      {tipOpen && (
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
            <ol className={styles.tipSteps}>
              <li>In the share sheet, choose <strong>Save Image</strong> (or Save to Photos).</li>
              <li>Open <strong>Photos</strong>, select the painting.</li>
              <li>Tap <strong>Share</strong> → <strong>Use as Wallpaper</strong>.</li>
              <li>Choose Lock Screen, Home Screen, or both.</li>
            </ol>
            <p className={styles.tipNote}>
              iPhone can’t set a wallpaper from a website directly — Photos is the reliable path.
            </p>
            <button
              type="button"
              className={styles.tipClose}
              onClick={() => setTipOpen(false)}
            >
              Got it
            </button>
          </div>
          <button
            type="button"
            className={styles.tipBackdrop}
            aria-label="Dismiss"
            onClick={() => setTipOpen(false)}
          />
        </div>
      )}
    </>
  );
}
