"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CardActions } from "@/components/CardActions";
import { thumbUrl, type Wallpaper } from "@/lib/wallpapers";
import {
  clamp,
  itemPose,
  project,
  rubberOffset,
  stepSpring,
  visibleRange,
  wheelMetrics,
} from "@/components/wheel-math";
import styles from "./wheel-gallery.module.css";

type Frame = { nearest: number; start: number; end: number };

export function WheelGallery({
  wallpapers,
  onOpen,
}: {
  wallpapers: Wallpaper[];
  onOpen: (id: string) => void;
}) {
  const count = wallpapers.length;
  const stageRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Map<number, HTMLButtonElement>>(new Map());
  const rawRef = useRef(0);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);
  const targetRef = useRef(0);
  const modeRef = useRef<"idle" | "drag" | "glide">("idle");
  const reducedRef = useRef(false);
  const metricsRef = useRef({ cardW: 280, radius: 360, pxPerItem: 140 });
  const movedRef = useRef(false);
  const rafRef = useRef(0);
  const snapTimerRef = useRef(0);
  const countRef = useRef(count);

  const [frame, setFrame] = useState<Frame>(() => visibleRange(0, count));
  const [dragging, setDragging] = useState(false);

  const paint = useCallback(() => {
    const { radius, cardW } = metricsRef.current;
    const offset = offsetRef.current;
    const stage = stageRef.current;
    if (stage) stage.style.setProperty("--card-w", `${cardW}px`);
    for (const [index, node] of nodesRef.current) {
      const pose = itemPose(index, offset, radius);
      node.style.transform = `translate(-50%, -50%) translate3d(0px, ${pose.y}px, ${pose.z}px) rotateX(${pose.rotateX}deg) scale(${pose.scale})`;
      node.style.opacity = String(pose.opacity);
      node.style.zIndex = String(Math.round(2000 + pose.z));
      node.style.pointerEvents = pose.opacity < 0.2 ? "none" : "auto";
      if (pose.opacity < 0.2) node.setAttribute("aria-hidden", "true");
      else node.removeAttribute("aria-hidden");
    }
  }, []);

  const publish = useCallback(() => {
    paint();
    const max = Math.max(0, countRef.current - 1);
    const next = visibleRange(clamp(offsetRef.current, -0.6, max + 0.6), countRef.current);
    setFrame((prev) =>
      prev.nearest === next.nearest && prev.start === next.start && prev.end === next.end
        ? prev
        : next,
    );
  }, [paint]);

  const measure = useCallback(() => {
    const stage = stageRef.current;
    const arc = stage?.querySelector("[data-wheel-arc]");
    if (!arc) return;
    const rect = arc.getBoundingClientRect();
    metricsRef.current = wheelMetrics(rect.width, rect.height);
  }, []);

  const stopGlide = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    window.clearTimeout(snapTimerRef.current);
  }, []);

  const glideTo = useCallback(
    (target: number, velocity: number) => {
      const max = Math.max(0, countRef.current - 1);
      targetRef.current = clamp(target, 0, max);
      velocityRef.current = velocity;
      modeRef.current = "glide";
      stopGlide();
      let last = 0;
      const tick = (now: number) => {
        if (modeRef.current !== "glide") return;
        const dt = last === 0 ? 0.016 : Math.min(0.032, (now - last) / 1000);
        last = now;
        const step = stepSpring(
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
        else modeRef.current = "idle";
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [publish, stopGlide],
  );

  const nudge = useCallback(
    (dir: number) => {
      const max = Math.max(0, countRef.current - 1);
      const base =
        modeRef.current === "glide" ? targetRef.current : Math.round(offsetRef.current);
      glideTo(clamp(base + dir, 0, max), 0);
    },
    [glideTo],
  );

  useEffect(() => {
    countRef.current = count;
  }, [count]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      reducedRef.current = mq.matches;
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useLayoutEffect(() => {
    measure();
    paint();
  }, [measure, paint, frame.start, frame.end]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const arc = stage.querySelector("[data-wheel-arc]");
    if (!arc) return;

    const observer = new ResizeObserver(() => {
      measure();
      paint();
    });
    observer.observe(arc);

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      stopGlide();
      modeRef.current = "drag";
      let dy = event.deltaY;
      if (event.deltaMode === 1) dy *= 16;
      if (event.deltaMode === 2) dy *= stage.getBoundingClientRect().height;
      const max = Math.max(0, countRef.current - 1);
      rawRef.current += dy / metricsRef.current.pxPerItem;
      offsetRef.current = rubberOffset(rawRef.current, max);
      publish();
      window.clearTimeout(snapTimerRef.current);
      snapTimerRef.current = window.setTimeout(() => {
        const snapped = clamp(Math.round(rawRef.current), 0, max);
        glideTo(snapped, 0);
      }, 90);
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
    };
  }, [glideTo, measure, paint, publish, stopGlide]);

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
    const recent = now - 80;
    while (drag.samples.length > 2 && drag.samples[0].t < recent) drag.samples.shift();
    const max = Math.max(0, countRef.current - 1);
    rawRef.current += -dy / metricsRef.current.pxPerItem;
    offsetRef.current = rubberOffset(rawRef.current, max);
    publish();
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
    const vPx = ((event.clientY - sample.y) / dt) * 1000;
    const px = metricsRef.current.pxPerItem;
    const max = Math.max(0, countRef.current - 1);
    const projected = rawRef.current + -project(vPx) / px;
    const visualVelocity = -vPx / px;
    glideTo(Math.round(clamp(projected, -0.5, max + 0.5)), visualVelocity);
    window.setTimeout(() => {
      movedRef.current = false;
    }, 0);
  }

  function onItemClick(index: number) {
    if (movedRef.current) return;
    const current = clamp(Math.round(offsetRef.current), 0, Math.max(0, count - 1));
    if (index === current) onOpen(wallpapers[index].id);
    else glideTo(index, 0);
  }

  const current = wallpapers[frame.nearest];
  const indexes: number[] = [];
  for (let index = frame.start; index <= frame.end; index += 1) indexes.push(index);

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
                if (node) nodesRef.current.set(index, node);
                else nodesRef.current.delete(index);
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbUrl(wallpaper.url, 960)}
                alt=""
                draggable={false}
                decoding="async"
                loading={centered ? "eager" : "lazy"}
              />
            </button>
          );
        })}
      </div>
      {current && (
        <div className={styles.caption}>
          <p className={styles.title} aria-live="polite">
            {current.artist} — {current.name}
          </p>
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
