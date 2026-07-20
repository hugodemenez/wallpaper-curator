"use client";

import Link from "next/link";
import { useMemo, useState, useCallback, useEffect } from "react";
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
          <div className={styles.crumbs}>
            <Link href="/">Wallpaper Curator</Link>
            <span className={styles.sep}>/</span>
            <span className={styles.here}>gallery</span>
          </div>
          <div className={`${styles.summary} dim`}>
            {filtered.length} wallpaper{filtered.length === 1 ? "" : "s"}
            {query ? ` · filter “${query}”` : ""}
          </div>
          <div className={styles.row}>
            <input
              className={styles.search}
              type="search"
              placeholder="search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            <select
              className={styles.sort}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              title="Sort"
            >
              <option value="name-asc">name A–Z</option>
              <option value="name-desc">name Z–A</option>
              <option value="date-desc">date newest</option>
              <option value="date-asc">date oldest</option>
              <option value="size-desc">size largest</option>
              <option value="size-asc">size smallest</option>
            </select>
            <button
              type="button"
              title="Smaller"
              disabled={zoomIdx <= 0}
              onClick={() => setZoom(ZOOM_STEPS[Math.max(0, zoomIdx - 1)])}
            >
              −
            </button>
            <button
              type="button"
              title="Larger"
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

      {filtered.length === 0 ? (
        <div className={styles.empty}>// empty</div>
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
            >
              <div className={styles.thumb}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbUrl(w.url, Math.max(480, zoom * 2))}
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
                  >
                    wall
                  </a>
                  <a
                    href={w.url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    dl
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {viewing && viewerIndex != null && (
        <div className={styles.viewer} role="dialog" aria-modal="true">
          <div className={styles.bar}>
            <span className={styles.title}>
              {viewing.artist} — {viewing.name}
            </span>
            <span className={`${styles.count} dim`}>
              {viewerIndex + 1} / {filtered.length}
            </span>
            <a href={wallpaperDeeplink(viewing.url)}>wall</a>
            <a href={viewing.url} download target="_blank" rel="noreferrer">
              dl
            </a>
            <button type="button" onClick={closeViewer}>
              close
            </button>
          </div>
          <div className={styles.stage}>
            <button
              type="button"
              className={styles.nav}
              aria-label="Previous"
              disabled={viewerIndex <= 0}
              onClick={() => setViewerIndex(viewerIndex - 1)}
            >
              ‹
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={viewing.url} alt={`${viewing.artist} — ${viewing.name}`} />
            <button
              type="button"
              className={styles.nav}
              aria-label="Next"
              disabled={viewerIndex >= filtered.length - 1}
              onClick={() => setViewerIndex(viewerIndex + 1)}
            >
              ›
            </button>
          </div>
          <div className={styles.film}>
            {filtered.map((w, i) => (
              <button
                key={w.id}
                type="button"
                className={i === viewerIndex ? styles.filmActive : undefined}
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
