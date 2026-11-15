"use client";

import Link from "next/link";
import { useMemo, useState, useCallback, useEffect } from "react";
import { CardActions } from "@/components/CardActions";
import { GallerySettings, type GalleryLayout } from "@/components/GallerySettings";
import { ViewerStage } from "@/components/ViewerStage";
import { WheelGallery } from "@/components/WheelGallery";
import { WallButton } from "@/components/WallButton";
import { thumbUrl, type Wallpaper } from "@/lib/wallpapers";
import styles from "./gallery.module.css";

export function GalleryClient({ wallpapers }: { wallpapers: Wallpaper[] }) {
  const [layout, setLayout] = useState<GalleryLayout>("wheel");
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
    if (layout !== "wheel") return;
    document.body.classList.add("gallery-wheel");
    return () => document.body.classList.remove("gallery-wheel");
  }, [layout]);

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
    <div className={layout === "wheel" ? `${styles.shell} ${styles.shellWheel}` : styles.shell}>
      <div className={styles.chrome}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.crumbs}>
              <Link href="/">Wallpaper Curator</Link>
              <span className={styles.sep} aria-hidden="true">
                /
              </span>
              <span className={styles.here}>Gallery</span>
            </div>
            <GallerySettings layout={layout} onLayout={setLayout} />
          </div>
          <p className={`${styles.summary} dim`} id="gallery-count">
            {ordered.length} wallpaper{ordered.length === 1 ? "" : "s"}
          </p>
        </header>
      </div>

      <main id="main" aria-labelledby="gallery-count">
      {ordered.length === 0 ? (
        <div className={styles.empty} role="status">
          No wallpapers yet.
        </div>
      ) : layout === "wheel" ? (
        <WheelGallery wallpapers={ordered} onOpen={openViewer} />
      ) : (
        <div
          className={styles.grid}
          style={{ ["--cols" as string]: String(layout) }}
        >
          {ordered.map((w) => (
            <article
              key={w.id}
              className={styles.card}
              data-gallery-card=""
              onClick={() => openViewer(w.id)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openViewer(w.id);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Open ${w.artist} — ${w.name}`}
            >
              <div className={styles.thumb}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbUrl(
                    w.url,
                    layout === 1 ? 960 : layout === 2 ? 500 : 330,
                  )}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className={styles.meta}>
                <div className={styles.name}>
                  {w.artist} — {w.name}
                </div>
                <CardActions
                  imageUrl={w.url}
                  title={`${w.artist} — ${w.name}`}
                />
              </div>
            </article>
          ))}
        </div>
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
            <span className={`${styles.count} dim`}>
              {viewerIndex + 1} / {ordered.length}
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
