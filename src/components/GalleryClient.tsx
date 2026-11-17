"use client";

import Link from "next/link";
import { useMemo, useState, useCallback, useEffect } from "react";
import { BrandMark } from "@/components/BrandMark";
import { ViewerStage } from "@/components/ViewerStage";
import { WheelGallery } from "@/components/WheelGallery";
import { WallButton } from "@/components/WallButton";
import { thumbUrl, type Wallpaper } from "@/lib/wallpapers";
import styles from "./gallery.module.css";

export function GalleryClient({ wallpapers }: { wallpapers: Wallpaper[] }) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const ordered = useMemo(() => {
    return [...wallpapers].sort(
      (a, b) => b.added.localeCompare(a.added) || a.name.localeCompare(b.name),
    );
  }, [wallpapers]);

  const openViewer = useCallback((id: string) => {
    const i = ordered.findIndex((w) => w.id === id);
    if (i >= 0) setViewerIndex(i);
  }, [ordered]);

  const closeViewer = useCallback(() => setViewerIndex(null), []);

  useEffect(() => {
    document.body.classList.add("gallery-wheel");
    return () => document.body.classList.remove("gallery-wheel");
  }, []);

  useEffect(() => {
    if (viewerIndex == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowLeft") {
        setViewerIndex((i) => (i == null ? i : Math.max(0, i - 1)));
      }
      if (e.key === "ArrowRight") {
        setViewerIndex((i) =>
          i == null ? i : Math.min(ordered.length - 1, i + 1),
        );
      }
    };
    document.body.classList.add("viewer-open");
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("viewer-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [viewerIndex, ordered.length, closeViewer]);

  const viewing = viewerIndex != null ? ordered[viewerIndex] : null;

  return (
    <div className={`${styles.shell} ${styles.shellWheel}`}>
      <div className={styles.chrome}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="Rotapicta — home">
            <BrandMark className={styles.brandMark} size={22} />
            <span className={styles.brandWord}>Rotapicta</span>
          </Link>
        </header>
      </div>

      <main id="main" aria-label="Gallery">
      {ordered.length === 0 ? (
        <div className={styles.empty} role="status">
          No wallpapers yet.
        </div>
      ) : (
        <WheelGallery wallpapers={ordered} onOpen={openViewer} />
      )}
      </main>

      {viewing && viewerIndex != null && (
        <div
          className={styles.viewer}
          role="dialog"
          aria-modal="true"
          aria-label={`${viewing.artist} — ${viewing.name}`}
        >
          <div className={styles.bar}>
            <span className={styles.title} id="viewer-title">
              {viewing.artist} — {viewing.name}
            </span>
            <WallButton
              imageUrl={viewing.url}
              title={`${viewing.artist} — ${viewing.name}`}
            />
            <a
              href={viewing.url}
              download
              target="_blank"
              rel="noreferrer"
              aria-label="Download original"
            >
              dl
            </a>
            <button type="button" onClick={closeViewer} aria-label="Close viewer">
              close
            </button>
          </div>
          <ViewerStage
            src={thumbUrl(viewing.url, 1920)}
            alt={`${viewing.artist} — ${viewing.name}`}
            canPrev={viewerIndex > 0}
            canNext={viewerIndex < ordered.length - 1}
            onPrev={() => setViewerIndex(viewerIndex - 1)}
            onNext={() => setViewerIndex(viewerIndex + 1)}
            onClose={closeViewer}
          />
          <div className={styles.film} role="list" aria-label="Wallpaper filmstrip">
            {ordered.map((w, i) => (
              <button
                key={w.id}
                type="button"
                role="listitem"
                className={i === viewerIndex ? styles.filmActive : undefined}
                aria-label={`${w.artist} — ${w.name}`}
                aria-current={i === viewerIndex ? "true" : undefined}
                onClick={() => setViewerIndex(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbUrl(w.url, 120)} alt="" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
