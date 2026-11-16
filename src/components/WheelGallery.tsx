"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CardActions } from "@/components/CardActions";
import { type Wallpaper } from "@/lib/wallpapers";
import {
  blurLayerOpacity,
  circularDelta,
  itemPose,
  itemTransform,
  itemZIndex,
  prefetchIndices,
  planMotion,
  project,
  seamClips,
  type SeamSlot,
  stepMotion,
  titleBlend,
  type Motion,
  visibleSlots,
  wrapIndex,
  wheelMetrics,
} from "@/components/wheel-math";
import { prefetchUrl, showDecoded, thumbFor } from "@/components/wheel-images";
import styles from "./wheel-gallery.module.css";

type Frame = { nearest: number; lo: number; slots: number[] };

/** DOM handles for one card plus the last values written, so we only touch what changed. */
type Card = {
  node: HTMLButtonElement;
  sharp: HTMLImageElement;
  soft: [HTMLImageElement, HTMLImageElement];
  /** Counter-translated overflow wrappers that clip the card at its seams. */
  clipTop: HTMLElement;
  clipBottom: HTMLElement;
  layer: HTMLElement;
  clip: [number, number];
  z: number;
  live: boolean;
  softOn: [boolean, boolean];
};

/** Fastest the wheel may spin after a flick, in paintings per second. */
const MAX_VELOCITY = 40;

function setLayerVisible(el: HTMLElement, on: boolean) {
  el.style.visibility = on ? "visible" : "hidden";
}

function ty(px: number) {
  return `translate3d(0px, ${px.toFixed(2)}px, 0px)`;
}

/**
 * Clip `top` / `bottom` px off a card using only transforms: the outer box
 * slides down by `top` (hiding the top), the middle one slides up by
 * `top + bottom` (hiding the bottom), and the content slides back by `bottom`
 * so the painting itself never moves.
 */
function writeClip(card: Card, top: number, bottom: number) {
  const [t0, b0] = card.clip;
  if (Math.abs(top - t0) < 0.01 && Math.abs(bottom - b0) < 0.01) return;
  card.clip = [top, bottom];
  card.clipTop.style.transform = ty(top);
  card.clipBottom.style.transform = ty(-top - bottom);
  card.layer.style.transform = ty(bottom);
}

export function WheelGallery({
  wallpapers,
  onOpen,
}: {
  wallpapers: Wallpaper[];
  onOpen: (id: string) => void;
}) {
  const count = wallpapers.length;
  const stageRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<Map<number, Card>>(new Map());
  // Inline ref callbacks re-run on every render; keep each card's cached
  // style state on its DOM node so it is not reset mid-animation.
  const cardStateRef = useRef<WeakMap<HTMLButtonElement, Card>>(new WeakMap());
  const rawRef = useRef(0);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);
  const targetRef = useRef(0);
  const modeRef = useRef<"idle" | "drag" | "glide">("idle");
  const reducedRef = useRef(false);
  const metricsRef = useRef({ cardW: 280, cardH: 157.5, radius: 360, pxPerItem: 140 });
  /** Title layers by wallpaper id; their opacity is written in `paint`. */
  const titleRefs = useRef<Map<string, HTMLElement>>(new Map());
  const movedRef = useRef(false);
  const publishRef = useRef<() => void>(() => {});
  const rafRef = useRef(0);
  const frameRafRef = useRef(0);
  const motionRef = useRef<Motion>({ kind: "spring", omega: 13 });
  const snapTimerRef = useRef(0);
  const countRef = useRef(count);
  const wallpapersRef = useRef(wallpapers);

  const [frame, setFrame] = useState<Frame>(() => visibleSlots(0, count));
  const [dragging, setDragging] = useState(false);

  /**
   * Writes transforms / opacity only. No layout reads happen here, and values
   * that rarely change (z-index, visibility, pointer-events) are written only
   * when they actually change.
   */
  const paint = useCallback(() => {
    const { radius, cardH } = metricsRef.current;
    const offset = offsetRef.current;
    const velocity = velocityRef.current;
    const reduced = reducedRef.current;
    const total = countRef.current;
    const list = wallpapersRef.current;
    const fast = Math.abs(velocity) > 2.4;

    const placed: (SeamSlot & { card: Card })[] = [];
    for (const [index, card] of cardsRef.current) {
      const pose = itemPose(index, offset, radius, total, reduced);
      placed.push({
        card,
        pose,
        delta: circularDelta(index, offset, total),
        z: itemZIndex(index, offset, total),
      });
    }
    placed.sort((a, b) => a.delta - b.delta);
    const clips = seamClips(placed, cardH);

    for (let slot = 0; slot < placed.length; slot += 1) {
      const { card, pose, z } = placed[slot];
      const { node, sharp, soft } = card;
      const index = Number(node.dataset.wheelItem);
      const wallpaper = list[index];
      node.style.transform = itemTransform(pose);
      writeClip(card, clips[slot].top, clips[slot].bottom);

      // Still nearest-on-top, but the seams mean adjacent cards no longer
      // overlap, so this flip at the halfway point is invisible.
      if (z !== card.z) {
        card.z = z;
        node.style.zIndex = String(z);
      }

      const [a, b] = blurLayerOpacity(pose.blur);
      const levels = [a, b];
      for (let i = 0; i < 2; i += 1) {
        const on = levels[i] > 0.001;
        if (on !== card.softOn[i]) {
          card.softOn[i] = on;
          setLayerVisible(soft[i], on);
          if (!on) soft[i].style.opacity = "0";
        }
        if (on) soft[i].style.opacity = levels[i].toFixed(3);
      }

      let opacity = pose.opacity;
      if (wallpaper) {
        const dist = Math.abs(placed[slot].delta);
        const hi = thumbFor(wallpaper.url, true);
        const lo = thumbFor(wallpaper.url, false);
        const keepHi = sharp.dataset.src === hi && dist < 0.85;
        showDecoded(sharp, (dist < 0.45 && !fast) || keepHi ? hi : lo);
        // Blurred layers never need the large bitmap.
        if (card.softOn[0]) showDecoded(soft[0], lo);
        if (card.softOn[1]) showDecoded(soft[1], lo);
        if (sharp.naturalWidth === 0) {
          opacity = 0;
          sharp.onload = () => {
            sharp.onload = null;
            publishRef.current();
          };
        }
      }
      node.style.opacity = opacity.toFixed(3);

      const live = pose.opacity >= 0.2;
      if (live !== card.live) {
        card.live = live;
        node.style.pointerEvents = live ? "auto" : "none";
        if (live) node.removeAttribute("aria-hidden");
        else node.setAttribute("aria-hidden", "true");
      }
      const visible = opacity > 0.001;
      if (node.style.visibility !== (visible ? "visible" : "hidden")) {
        setLayerVisible(node, visible);
      }
    }
    if (total > 0) {
      const { lo, hi, mix } = titleBlend(offset, total, reduced);
      const titles = titleRefs.current;
      const loEl = list[lo] && titles.get(list[lo].id);
      const hiEl = list[hi] && titles.get(list[hi].id);
      if (loEl && loEl !== hiEl) loEl.style.opacity = (1 - mix).toFixed(3);
      if (hiEl) hiEl.style.opacity = loEl === hiEl ? "1" : mix.toFixed(3);
    }

    for (const index of prefetchIndices(offset, velocity, total)) {
      const wallpaper = list[index];
      if (wallpaper) prefetchUrl(thumbFor(wallpaper.url, false));
    }
    if (!fast && total > 0) {
      const nearest = wrapIndex(Math.round(offset), total);
      for (const step of [-1, 0, 1]) {
        const wallpaper = list[wrapIndex(nearest + step, total)];
        if (wallpaper) prefetchUrl(thumbFor(wallpaper.url, true));
      }
    }
  }, []);

  const publish = useCallback(() => {
    const total = countRef.current;
    if (total > 1) {
      const shift = Math.floor(offsetRef.current / total) * total;
      if (shift !== 0) {
        offsetRef.current -= shift;
        rawRef.current -= shift;
        targetRef.current -= shift;
      }
    }
    paint();
    const next = visibleSlots(offsetRef.current, total);
    setFrame((prev) =>
      prev.nearest === next.nearest &&
      prev.lo === next.lo &&
      prev.slots.length === next.slots.length &&
      prev.slots.every((slot, i) => slot === next.slots[i])
        ? prev
        : next,
    );
  }, [paint]);

  useEffect(() => {
    publishRef.current = publish;
  }, [publish]);

  /** Called on mount and from ResizeObserver only, never per frame. */
  const applySize = useCallback((width: number, height: number) => {
    metricsRef.current = wheelMetrics(width, height);
    stageRef.current?.style.setProperty("--card-w", `${metricsRef.current.cardW}px`);
  }, []);

  /** Coalesce input (pointer / wheel) into at most one paint per frame. */
  const schedulePublish = useCallback(() => {
    if (frameRafRef.current) return;
    frameRafRef.current = requestAnimationFrame(() => {
      frameRafRef.current = 0;
      publishRef.current();
    });
  }, []);

  const stopGlide = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    window.clearTimeout(snapTimerRef.current);
  }, []);

  /**
   * Animate to `target` starting at `velocity` (paintings/s). A flick decays
   * exponentially onto the target; everything else uses a critically damped
   * spring. Both are solved in closed form per frame, so motion stays smooth
   * regardless of frame rate.
   */
  const glideTo = useCallback(
    (target: number, velocity: number, motion?: Motion) => {
      cancelAnimationFrame(frameRafRef.current);
      frameRafRef.current = 0;
      stopGlide();
      targetRef.current = countRef.current <= 1 ? 0 : target;
      velocityRef.current = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocity));
      motionRef.current =
        motion ?? planMotion(offsetRef.current, velocityRef.current, targetRef.current);
      modeRef.current = "glide";
      let last = performance.now();
      const tick = (now: number) => {
        if (modeRef.current !== "glide") return;
        const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
        last = now;
        const step = stepMotion(
          motionRef.current,
          offsetRef.current,
          velocityRef.current,
          targetRef.current,
          dt,
          reducedRef.current,
        );
        offsetRef.current = step.x;
        rawRef.current = step.x;
        velocityRef.current = step.velocity;
        publish();
        if (!step.done) rafRef.current = requestAnimationFrame(tick);
        else {
          rafRef.current = 0;
          modeRef.current = "idle";
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [publish, stopGlide],
  );

  const nudge = useCallback(
    (dir: number) => {
      if (countRef.current <= 1) return;
      const base =
        modeRef.current === "glide" ? targetRef.current : Math.round(offsetRef.current);
      glideTo(base + dir, 0);
    },
    [glideTo],
  );

  useEffect(() => {
    countRef.current = count;
    wallpapersRef.current = wallpapers;
  }, [count, wallpapers]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      reducedRef.current = mq.matches;
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Newly mounted cards get their pose before the browser paints them.
  useLayoutEffect(() => {
    paint();
  }, [paint, frame.nearest, frame.lo, frame.slots]);

  // One layout read on mount; afterwards sizes arrive via ResizeObserver.
  useLayoutEffect(() => {
    const arc = stageRef.current?.querySelector("[data-wheel-arc]");
    if (!arc) return;
    const rect = arc.getBoundingClientRect();
    applySize(rect.width, rect.height);
    paint();
  }, [applySize, paint]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const arc = stage.querySelector("[data-wheel-arc]");
    if (!arc) return;

    let stageHeight = stage.clientHeight;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === arc) {
          applySize(entry.contentRect.width, entry.contentRect.height);
        } else {
          stageHeight = entry.contentRect.height;
        }
      }
      paint();
    });
    observer.observe(stage);
    observer.observe(arc);

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      let dy = event.deltaY;
      if (event.deltaMode === 1) dy *= 16;
      if (event.deltaMode === 2) dy *= stageHeight;
      // Mouse wheels jump in big notches; follow them with a stiff spring so
      // the wheel glides instead of stepping. Trackpads barely lag behind.
      const base = modeRef.current === "glide" ? targetRef.current : rawRef.current;
      rawRef.current = base + dy / metricsRef.current.pxPerItem;
      glideTo(rawRef.current, velocityRef.current, { kind: "spring", omega: 26 });
      snapTimerRef.current = window.setTimeout(() => {
        glideTo(Math.round(targetRef.current), velocityRef.current);
      }, 110);
    };

    const blockTouchMove = (event: TouchEvent) => {
      if (event.cancelable) event.preventDefault();
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("touchmove", blockTouchMove, { passive: false });
    return () => {
      observer.disconnect();
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("touchmove", blockTouchMove);
      stopGlide();
      cancelAnimationFrame(frameRafRef.current);
      frameRafRef.current = 0;
    };
  }, [applySize, glideTo, paint, stopGlide]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      if (document.body.classList.contains("viewer-open")) return;
      if (document.querySelector("[role='dialog'][data-open='true']")) return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("button, a, input, select, textarea") &&
        !target.closest("[data-wheel-arc]")
      ) {
        return;
      }
      event.preventDefault();
      nudge(event.key === "ArrowDown" ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nudge]);

  const dragRef = useRef<{
    id: number;
    lastY: number;
    startY: number;
    startX: number;
    samples: { y: number; t: number }[];
  } | null>(null);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const target = event.target;
    if (target instanceof Element && target.closest("[data-card-action]")) return;
    stopGlide();
    modeRef.current = "drag";
    rawRef.current = offsetRef.current;
    movedRef.current = false;
    dragRef.current = {
      id: event.pointerId,
      lastY: event.clientY,
      startY: event.clientY,
      startX: event.clientX,
      samples: [{ y: event.clientY, t: event.timeStamp }],
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dy = event.clientY - drag.lastY;
    drag.lastY = event.clientY;
    const travel = Math.hypot(event.clientY - drag.startY, event.clientX - drag.startX);
    if (!movedRef.current && travel < 8) return;
    if (!movedRef.current) {
      movedRef.current = true;
      setDragging(true);
    }
    const now = event.timeStamp;
    drag.samples.push({ y: event.clientY, t: now });
    const recent = now - 100;
    while (drag.samples.length > 2 && drag.samples[0].t < recent) drag.samples.shift();
    const first = drag.samples[0];
    const span = Math.max(16, now - first.t);
    velocityRef.current = -((event.clientY - first.y) / span) * 1000 / metricsRef.current.pxPerItem;
    rawRef.current += -dy / metricsRef.current.pxPerItem;
    offsetRef.current = rawRef.current;
    schedulePublish();
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    if (!movedRef.current) {
      modeRef.current = "idle";
      const hit = document.elementFromPoint(event.clientX, event.clientY);
      const button = hit instanceof Element ? hit.closest("[data-wheel-item]") : null;
      if (button instanceof HTMLElement && button.dataset.wheelItem) {
        onItemClick(Number(button.dataset.wheelItem));
      }
      return;
    }
    const now = event.timeStamp;
    const sample =
      [...drag.samples].reverse().find((point) => now - point.t > 16) ?? drag.samples[0];
    const dt = Math.max(16, now - sample.t);
    // A finger resting before lift-off means no momentum.
    const stale = now - drag.samples[drag.samples.length - 1].t > 60;
    const vPx = stale ? 0 : ((event.clientY - sample.y) / dt) * 1000;
    const px = metricsRef.current.pxPerItem;
    const visualVelocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, -vPx / px));
    const projected = rawRef.current + -project(-visualVelocity * px) / px;
    glideTo(Math.round(projected), visualVelocity);
    window.setTimeout(() => {
      movedRef.current = false;
    }, 0);
  }

  function onItemClick(index: number) {
    if (movedRef.current) return;
    const total = countRef.current;
    const here = wrapIndex(Math.round(offsetRef.current), total);
    if (index === here) onOpen(wallpapers[index].id);
    else glideTo(offsetRef.current + circularDelta(index, offsetRef.current, total), 0);
  }

  const current = wallpapers[frame.nearest];
  const indexes = frame.slots;
  // The two titles the wheel is between; `paint` crossfades them with the seam.
  const titleHi = wrapIndex(frame.lo + 1, count);
  const titleIds = titleHi === frame.lo ? [frame.lo] : [frame.lo, titleHi];

  return (
    <div
      className={styles.stage}
      ref={stageRef}
      data-dragging={dragging ? "true" : "false"}
      data-wheel-index={frame.nearest}
      role="group"
      aria-roledescription="vertical wheel"
      aria-label="Wallpapers"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div className={styles.arc} data-wheel-arc="">
        {indexes.map((index) => {
          const wallpaper = wallpapers[index];
          const centered = index === frame.nearest;
          return (
            <button
              key={wallpaper.id}
              type="button"
              className={styles.item}
              ref={(node) => {
                if (!node) {
                  cardsRef.current.delete(index);
                  return;
                }
                let card = cardStateRef.current.get(node);
                if (!card) {
                  const imgs = node.querySelectorAll("img");
                  const clipTop = node.firstElementChild as HTMLElement;
                  const clipBottom = clipTop.firstElementChild as HTMLElement;
                  card = {
                    node,
                    sharp: imgs[0],
                    soft: [imgs[1], imgs[2]],
                    clipTop,
                    clipBottom,
                    layer: clipBottom.firstElementChild as HTMLElement,
                    clip: [0, 0],
                    z: Number.NaN,
                    live: true,
                    softOn: [true, true],
                  };
                  cardStateRef.current.set(node, card);
                }
                cardsRef.current.set(index, card);
              }}
              data-wheel-item={index}
              aria-current={centered ? "true" : undefined}
              aria-label={
                centered
                  ? `Open ${wallpaper.artist} — ${wallpaper.name}`
                  : `Center ${wallpaper.artist} — ${wallpaper.name}`
              }
              onClick={() => onItemClick(index)}
            >
              {/* Seam clip: transform-only wrappers, see writeClip. */}
              <span className={styles.clip}>
                <span className={styles.clip}>
                  <span className={styles.layer}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="" draggable={false} decoding="async" />
                    {/* Pre-blurred copies; their opacity crossfades with distance. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="" className={styles.soft3} draggable={false} decoding="async" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="" className={styles.soft6} draggable={false} decoding="async" />
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {current && (
        <div className={styles.caption}>
          <div className={styles.titleBox} aria-live="polite">
            {titleIds.map((index) => {
              const wallpaper = wallpapers[index];
              const text = `${wallpaper.artist} — ${wallpaper.name}`;
              const shown = index === frame.nearest;
              return (
                <p
                  key={wallpaper.id}
                  ref={(node) => {
                    if (node) titleRefs.current.set(wallpaper.id, node);
                    else titleRefs.current.delete(wallpaper.id);
                  }}
                  className={styles.title}
                  title={shown ? text : undefined}
                  aria-hidden={shown ? undefined : "true"}
                >
                  <span>{text}</span>
                </p>
              );
            })}
          </div>
          <div className={styles.actions}>
            <CardActions
              imageUrl={current.url}
              title={`${current.artist} — ${current.name}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
