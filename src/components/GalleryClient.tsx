"use client";

import Link from "next/link";
import { useMemo, useState, useCallback, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { wallpaperDeeplink } from "@/lib/raycast";
import { fmtSize, thumbUrl, type Wallpaper } from "@/lib/wallpapers";
import styles from "./gallery.module.css";

const ZOOM_STEPS = [140, 180, 220, 280, 340, 420];

type SortKey =
  | "name-asc"
  | "name-desc"
  | "date-desc"
  | "date-asc"
  | "size-desc"
  | "size-asc";

function nearestZoom(n: number) {
  return ZOOM_STEPS.reduce((best, z) =>
    Math.abs(z - n) < Math.abs(best - n) ? z : best,
  );
}

export function GalleryClient({ wallpapers }: { wallpapers: Wallpaper[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [zoom, setZoom] = useState(220);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = wallpapers;
    if (q) {
      list = list.filter((w) => {
        const hay = [w.name, w.artist, w.date, w.tones.join(" "), w.source]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "date-asc":
          return a.date.localeCompare(b.date) || a.name.localeCompare(b.name);
        case "date-desc":
          return b.date.localeCompare(a.date) || a.name.localeCompare(b.name);
        case "size-asc":
          return (a.size ?? 0) - (b.size ?? 0);
        case "size-desc":
          return (b.size ?? 0) - (a.size ?? 0);
        default:
          return 0;
      }
    });
    return sorted;
  }, [wallpapers, query, sort]);

  const zoomIdx = ZOOM_STEPS.indexOf(nearestZoom(zoom));

  const openViewer = useCallback((id: string) => {
    const i = filtered.findIndex((w) => w.id === id);
    if (i >= 0) setViewerIndex(i);
  }, [filtered]);

  const closeViewer = useCallback(() => setViewerIndex(null), []);

  useEffect(() => {
    if (viewerIndex == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowLeft") {
        setViewerIndex((i) => (i == null ? i : Math.max(0, i - 1)));
      }
      if (e.key === "ArrowRight") {
        setViewerIndex((i) =>
          i == null ? i : Math.min(filtered.length - 1, i + 1),
        );
      }
    };
    document.body.classList.add("viewer-open");
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("viewer-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [viewerIndex, filtered.length, closeViewer]);

  const viewing = viewerIndex != null ? filtered[viewerIndex] : null;

  return (
    <div className={styles.shell}>
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
            <ThemeToggle />
          </div>
          <p className={`${styles.summary} dim`} id="gallery-count">
            {filtered.length} wallpaper{filtered.length === 1 ? "" : "s"}
            {query ? ` · filter “${query}”` : ""}
          </p>
          <div className={styles.row}>
            <label className={styles.srOnly} htmlFor="gallery-search">
              Search wallpapers
            </label>
            <input
              id="gallery-search"
              className={styles.search}
              type="search"
              placeholder="Search artist or title…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              enterKeyHint="search"
            />
            <label className={styles.srOnly} htmlFor="gallery-sort">
              Sort wallpapers
            </label>
            <select
              id="gallery-sort"
              className={styles.sort}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="date-desc">Date newest</option>
              <option value="date-asc">Date oldest</option>
              <option value="size-desc">Size largest</option>
              <option value="size-asc">Size smallest</option>
            </select>
            <button
              type="button"
              aria-label="Zoom out"
              disabled={zoomIdx <= 0}
              onClick={() => setZoom(ZOOM_STEPS[Math.max(0, zoomIdx - 1)])}
            >
              −
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              disabled={zoomIdx >= ZOOM_STEPS.length - 1}
              onClick={() =>
                setZoom(
                  ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, zoomIdx + 1)],
                )
              }
            >
              +
            </button>
          </div>
        </header>
      </div>

      <main id="main" aria-labelledby="gallery-count">
      {filtered.length === 0 ? (
        <div className={styles.empty} role="status">
          No wallpapers match your search.
        </div>
      ) : (
        <div
          className={styles.grid}
          style={{ ["--card-min" as string]: `${zoom}px` }}
        >
          {filtered.map((w) => (
            <article
              key={w.id}
              className={styles.card}
              onClick={() => openViewer(w.id)}
              onKeyDown={(e) => {
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
                  src={thumbUrl(w.url, Math.max(500, zoom * 2))}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className={styles.meta}>
                <div className={styles.name}>
                  {w.artist} — {w.name}
                </div>
                <div className={styles.size}>
                  {w.date} · {fmtSize(w.size)} · {w.tones.join(", ")}
                </div>
                <div className={styles.actions}>
                  <a
                    href={wallpaperDeeplink(w.url)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Set ${w.name} as wallpaper with Raycast`}
                  >
                    wall
                  </a>
                  <a
                    href={w.url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Download ${w.name}`}
                  >
                    dl
                  </a>
                </div>
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
              {viewerIndex + 1} / {filtered.length}
            </span>
            <a
              href={wallpaperDeeplink(viewing.url)}
              aria-label="Set as wallpaper with Raycast"
            >
              wall
            </a>
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
          <div className={styles.stage}>
            <button
              type="button"
              className={styles.nav}
              aria-label="Previous wallpaper"
              disabled={viewerIndex <= 0}
              onClick={() => setViewerIndex(viewerIndex - 1)}
            >
              ‹
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbUrl(viewing.url, 1920)}
              alt={`${viewing.artist} — ${viewing.name}`}
            />
            <button
              type="button"
              className={styles.nav}
              aria-label="Next wallpaper"
              disabled={viewerIndex >= filtered.length - 1}
              onClick={() => setViewerIndex(viewerIndex + 1)}
            >
              ›
            </button>
          </div>
          <div className={styles.film} role="list" aria-label="Wallpaper filmstrip">
            {filtered.map((w, i) => (
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
