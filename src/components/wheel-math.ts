/** Degrees between neighbouring paintings on the drum. */
export const WHEEL_STEP = 24;

/** How many items either side of centre stay mounted. */
export const WHEEL_REACH = 4;

/** Positive modulo, so the wheel can spin past either end. */
export function wrapIndex(index: number, count: number) {
  if (count <= 0) return 0;
  return ((Math.round(index) % count) + count) % count;
}

/** Fold an unbounded scroll position into one turn of the wheel. */
export function normalizeOffset(offset: number, count: number) {
  if (count <= 0) return 0;
  const wrapped = offset % count;
  return wrapped < 0 ? wrapped + count : wrapped;
}

/** Signed steps from the centred painting, taking the short way around. */
export function circularDelta(index: number, offset: number, count: number) {
  if (count <= 1) return 0;
  const base = normalizeOffset(offset, count);
  let delta = index - base;
  if (delta > count / 2) delta -= count;
  if (delta < -count / 2) delta += count;
  return delta;
}

/**
 * Apple's exponential-decay projection (Designing Fluid Interfaces).
 * `velocity` is px/s. Returns a pixel distance.
 */
export function project(velocity: number, deceleration = 0.995) {
  return (velocity / 1000) * (deceleration / (1 - deceleration));
}

export function wheelMetrics(stageWidth: number, stageHeight: number) {
  const cardW = Math.min(stageWidth * (stageWidth < 720 ? 0.84 : 0.5), 640);
  const cardH = (cardW * 9) / 16;
  const maxY = Math.max(96, stageHeight * 0.34);
  const y1 = Math.min(cardH * 0.7, maxY);
  const stepRad = (WHEEL_STEP * Math.PI) / 180;
  const radius = y1 / Math.sin(stepRad);
  return {
    cardW,
    radius,
    /** Pixels of drag that move the wheel by one painting, matched to the arc. */
    pxPerItem: y1,
  };
}

export type ItemPose = {
  y: number;
  z: number;
  rotateX: number;
  scale: number;
  opacity: number;
  /** 0 at the centre, about 2px on the next painting, capped at 6px. */
  blur: number;
};

export function itemPose(
  index: number,
  offset: number,
  radius: number,
  count: number,
  reducedMotion = false,
): ItemPose {
  const delta = circularDelta(index, offset, count);
  const theta = delta * WHEEL_STEP;
  const rad = (theta * Math.PI) / 180;
  const y = Math.sin(rad) * radius;
  const z = (Math.cos(rad) - 1) * radius;
  const abs = Math.abs(theta);
  const t = Math.min(abs / 72, 1);
  const scale = 1.08 - t * 0.5;
  // Smooth fade to zero between 66° and 78° instead of a hard cut-off.
  const edge = Math.min(1, Math.max(0, (78 - abs) / 12));
  const opacity = (1 - t ** 1.2 * 0.9) * edge;
  const dist = Math.abs(delta);
  // Continuous: 0 at centre, 2px per painting, capped at 6px.
  const blur = reducedMotion ? 0 : Math.min(6, dist * 2);
  return { y, z, rotateX: -theta, scale, opacity, blur };
}

/** Blur radii pre-baked into stacked layers on each card (see BLUR_LAYERS). */
export const BLUR_LEVELS = [3, 6] as const;

/**
 * Opacity for the pre-blurred layers so a sharp base + 3px + 6px stack reads as
 * a continuous `blur(px)`. Animating `filter` itself would re-rasterise every
 * frame on iOS; opacity stays on the compositor.
 */
export function blurLayerOpacity(blur: number): [number, number] {
  const [lo, hi] = BLUR_LEVELS;
  const a = Math.min(1, Math.max(0, blur / lo));
  const b = Math.min(1, Math.max(0, (blur - lo) / (hi - lo)));
  return [a, b];
}

/**
 * Higher for the painting closest to centre, so it always paints last.
 * Quantised to whole steps so it only changes when the stacking order does,
 * instead of every frame.
 */
export function itemZIndex(index: number, offset: number, count: number) {
  return 1000 - Math.round(Math.abs(circularDelta(index, offset, count))) * 10;
}

/**
 * Each card carries its own perspective. They are flat layers, not one shared
 * 3D scene, so Safari cannot depth-test a neighbour through the centre image.
 */
export function itemTransform(pose: ItemPose) {
  return `translate(-50%, -50%) perspective(860px) translate3d(0px, ${pose.y.toFixed(2)}px, ${pose.z.toFixed(2)}px) rotateX(${pose.rotateX.toFixed(3)}deg) scale(${pose.scale.toFixed(4)})`;
}

function signedWindow(velocity: number) {
  const dir = velocity > 0.5 ? 1 : velocity < -0.5 ? -1 : 0;
  const extra = dir === 0 ? 0 : Math.min(4, Math.ceil(Math.abs(velocity) / 3));
  const before = 7 + (dir < 0 ? extra : 0);
  const after = 7 + (dir > 0 ? extra : 0);
  return { before, after };
}

/** Wallpaper indexes to warm, wrapping past either end. */
export function prefetchIndices(offset: number, velocity: number, count: number) {
  if (count <= 0) return [];
  const { before, after } = signedWindow(velocity);
  const origin = Math.round(offset);
  const seen = new Set<number>();
  const indexes: number[] = [];
  for (let step = -before; step <= after; step += 1) {
    const index = wrapIndex(origin + step, count);
    if (seen.has(index)) continue;
    seen.add(index);
    indexes.push(index);
  }
  return indexes;
}

export function visibleSlots(offset: number, count: number) {
  if (count <= 0) return { nearest: 0, slots: [] as number[] };
  const origin = Math.round(offset);
  const nearest = wrapIndex(origin, count);
  const seen = new Set<number>();
  const slots: number[] = [];
  for (let step = -WHEEL_REACH; step <= WHEEL_REACH; step += 1) {
    const index = wrapIndex(origin + step, count);
    if (seen.has(index)) continue;
    seen.add(index);
    slots.push(index);
  }
  return { nearest, slots };
}

/** Natural frequency of the snap spring (rad/s). ~0.45s to settle. */
const SPRING_OMEGA = 13;
/** Accept a pure ease-out decay when its rate lands in this range (1/s). */
const DECAY_MIN = 2.2;
const DECAY_MAX = 14;

export type Motion =
  | { kind: "decay"; rate: number }
  | { kind: "spring"; omega: number };

/**
 * Pick how to reach `target` from `x` moving at `velocity` (items/s).
 * A flick whose momentum already carries it to the snapped target uses
 * exponential decay (the iOS scroll-view curve), so release velocity is
 * preserved exactly and the wheel eases out onto the item. Anything else uses
 * a critically damped spring, which never overshoots.
 */
export function planMotion(x: number, velocity: number, target: number): Motion {
  const remaining = target - x;
  if (Math.abs(remaining) > 0.02 && Math.sign(remaining) === Math.sign(velocity)) {
    const rate = velocity / remaining;
    if (rate >= DECAY_MIN && rate <= DECAY_MAX) return { kind: "decay", rate };
  }
  return { kind: "spring", omega: SPRING_OMEGA };
}

/**
 * Advance the motion by `dt` seconds using the closed-form solution, so the
 * curve is identical at 60Hz, 120Hz or with dropped frames.
 */
export function stepMotion(
  motion: Motion,
  x: number,
  velocity: number,
  target: number,
  dt: number,
  reduced: boolean,
) {
  if (reduced) return { x: target, velocity: 0, done: true };
  const e0 = x - target;
  let e: number;
  let v: number;
  if (motion.kind === "decay") {
    const k = Math.exp(-motion.rate * dt);
    e = e0 * k;
    v = -motion.rate * e;
  } else {
    const w = motion.omega;
    const c2 = velocity + w * e0;
    const k = Math.exp(-w * dt);
    e = (e0 + c2 * dt) * k;
    v = (c2 - w * (e0 + c2 * dt)) * k;
  }
  const done = Math.abs(e) < 0.0015 && Math.abs(v) < 0.06;
  if (done) return { x: target, velocity: 0, done: true };
  return { x: target + e, velocity: v, done: false };
}
