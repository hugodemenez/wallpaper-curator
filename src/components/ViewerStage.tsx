"use client";

import { useEffect, useRef } from "react";
import styles from "./gallery.module.css";

type Props = {
  src: string;
  alt: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
};

const DISTANCE = 56;
const CLOSE_DISTANCE = 72;
const VELOCITY = 0.35; // px/ms

type Drag = {
  id: number | null;
  x: number;
  y: number;
  t: number;
  dx: number;
  dy: number;
  moved: boolean;
};

export function ViewerStage({
  src,
  alt,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onClose,
}: Props) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag>({
    id: null,
    x: 0,
    y: 0,
    t: 0,
    dx: 0,
    dy: 0,
    moved: false,
  });

  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.transform = "translate3d(0, 0, 0)";
    el.style.opacity = "1";
  }, [src]);

  function setOffset(dx: number, dy: number, animate: boolean) {
    const el = mediaRef.current;
    if (!el) return;
    el.style.transition = animate
      ? "transform 220ms cubic-bezier(0.23, 1, 0.32, 1), opacity 220ms ease"
      : "none";
    el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    const fade = Math.max(0.45, 1 - Math.abs(dy) / 280);
    el.style.opacity = String(dy > 0 ? fade : 1);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (drag.current.id != null) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      t: performance.now(),
      dx: 0,
      dy: 0,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    setOffset(0, 0, false);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (d.id !== e.pointerId) return;
    d.dx = e.clientX - d.x;
    d.dy = e.clientY - d.y;
    if (Math.abs(d.dx) > 4 || Math.abs(d.dy) > 4) d.moved = true;

    // Prefer the dominant axis; damp the other.
    if (Math.abs(d.dx) > Math.abs(d.dy)) {
      setOffset(d.dx, d.dy * 0.15, false);
    } else {
      setOffset(d.dx * 0.15, Math.max(0, d.dy), false);
    }
  }

  function endPointer(e: React.PointerEvent) {
    const d = drag.current;
    if (d.id !== e.pointerId) return;
    d.id = null;

    const dt = Math.max(1, performance.now() - d.t);
    const vx = Math.abs(d.dx) / dt;
    const vy = Math.abs(d.dy) / dt;
    const horizontal = Math.abs(d.dx) > Math.abs(d.dy);

    if (!d.moved) {
      // Tap on backdrop (outside image) closes.
      const target = e.target as HTMLElement | null;
      if (target?.dataset?.viewerMedia == null) {
        setOffset(0, 0, true);
        onClose();
        return;
      }
      setOffset(0, 0, true);
      return;
    }

    if (horizontal) {
      if ((d.dx <= -DISTANCE || (d.dx < 0 && vx > VELOCITY)) && canNext) {
        setOffset(-window.innerWidth * 0.2, 0, true);
        onNext();
        requestAnimationFrame(() => setOffset(0, 0, false));
        return;
      }
      if ((d.dx >= DISTANCE || (d.dx > 0 && vx > VELOCITY)) && canPrev) {
        setOffset(window.innerWidth * 0.2, 0, true);
        onPrev();
        requestAnimationFrame(() => setOffset(0, 0, false));
        return;
      }
    } else if (d.dy > 0 && (d.dy >= CLOSE_DISTANCE || vy > VELOCITY)) {
      setOffset(0, window.innerHeight * 0.2, true);
      onClose();
      return;
    }

    setOffset(0, 0, true);
  }

  return (
    <div
      className={styles.stage}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
    >
      <button
        type="button"
        className={styles.nav}
        aria-label="Previous wallpaper"
        disabled={!canPrev}
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        ‹
      </button>

      <div ref={mediaRef} className={styles.stageMedia}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img data-viewer-media="" src={src} alt={alt} draggable={false} />
      </div>

      <button
        type="button"
        className={styles.nav}
        aria-label="Next wallpaper"
        disabled={!canNext}
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        ›
      </button>
    </div>
  );
}
