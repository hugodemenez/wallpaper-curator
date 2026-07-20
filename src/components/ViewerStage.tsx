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

const SWIPE_PX = 64;
const CLOSE_PX = 80;
const VELOCITY = 0.32; // px/ms
const MOVE_PX = 8;

type Drag = {
  pointerId: number | null;
  startX: number;
  startY: number;
  startTime: number;
  dx: number;
  dy: number;
  moved: boolean;
  onMedia: boolean;
  capturing: boolean;
};

function isMediaTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("[data-viewer-media]"));
}

export function ViewerStage({
  src,
  alt,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onClose,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag>({
    pointerId: null,
    startX: 0,
    startY: 0,
    startTime: 0,
    dx: 0,
    dy: 0,
    moved: false,
    onMedia: false,
    capturing: false,
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
    el.style.opacity = String(
      dy > 0 ? Math.max(0.4, 1 - Math.abs(dy) / 320) : 1,
    );
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (drag.current.pointerId != null) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Let nav buttons work normally.
    if ((e.target as Element | null)?.closest?.("button")) return;

    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startTime: performance.now(),
      dx: 0,
      dy: 0,
      moved: false,
      onMedia: isMediaTarget(e.target),
      capturing: false,
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (d.pointerId !== e.pointerId) return;

    d.dx = e.clientX - d.startX;
    d.dy = e.clientY - d.startY;

    if (!d.moved && (Math.abs(d.dx) > MOVE_PX || Math.abs(d.dy) > MOVE_PX)) {
      d.moved = true;
      // Capture only after a real drag so taps keep the original target.
      try {
        stageRef.current?.setPointerCapture(e.pointerId);
        d.capturing = true;
      } catch {
        /* ignore */
      }
    }

    if (!d.moved) return;

    if (Math.abs(d.dx) > Math.abs(d.dy)) {
      setOffset(d.dx, d.dy * 0.12, false);
    } else {
      setOffset(d.dx * 0.12, Math.max(0, d.dy), false);
    }
  }

  function finish(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (d.pointerId !== e.pointerId) return;

    if (d.capturing) {
      try {
        stageRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }

    const dt = Math.max(1, performance.now() - d.startTime);
    const vx = Math.abs(d.dx) / dt;
    const vy = Math.abs(d.dy) / dt;
    const horizontal = Math.abs(d.dx) >= Math.abs(d.dy);
    const onMedia = d.onMedia;
    const moved = d.moved;
    const dx = d.dx;
    const dy = d.dy;

    drag.current.pointerId = null;
    drag.current.capturing = false;

    if (!moved) {
      // Tap outside the image closes; tap on image stays.
      if (!onMedia) onClose();
      setOffset(0, 0, true);
      return;
    }

    if (horizontal) {
      const goNext =
        canNext && (dx <= -SWIPE_PX || (dx < -12 && vx > VELOCITY));
      const goPrev =
        canPrev && (dx >= SWIPE_PX || (dx > 12 && vx > VELOCITY));
      if (goNext) {
        onNext();
        setOffset(0, 0, false);
        return;
      }
      if (goPrev) {
        onPrev();
        setOffset(0, 0, false);
        return;
      }
    } else if (dy > 0 && (dy >= CLOSE_PX || vy > VELOCITY)) {
      onClose();
      return;
    }

    setOffset(0, 0, true);
  }

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
    >
      <button
        type="button"
        className={styles.nav}
        aria-label="Previous wallpaper"
        disabled={!canPrev}
        onClick={onPrev}
      >
        ‹
      </button>

      <div
        ref={mediaRef}
        className={styles.stageMedia}
        data-viewer-media=""
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} draggable={false} data-viewer-media="" />
      </div>

      <button
        type="button"
        className={styles.nav}
        aria-label="Next wallpaper"
        disabled={!canNext}
        onClick={onNext}
      >
        ›
      </button>
    </div>
  );
}
