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
  const opacity = abs > 76 ? 0 : 1 - t ** 1.2 * 0.9;
  const dist = Math.abs(delta);
  const blur = reducedMotion || dist < 0.35 ? 0 : Math.min(6, dist * 2);
  return { y, z, rotateX: -theta, scale, opacity, blur };
}

/** Higher for the painting closest to centre, so it always paints last. */
export function itemZIndex(index: number, offset: number, count: number) {
  return 5000 - Math.round(Math.abs(circularDelta(index, offset, count)) * 100);
}

/**
 * Each card carries its own perspective. They are flat layers, not one shared
 * 3D scene, so Safari cannot depth-test a neighbour through the centre image.
 */
export function itemTransform(pose: ItemPose) {
  return `translate(-50%, -50%) perspective(860px) translate3d(0px, ${pose.y.toFixed(2)}px, ${pose.z.toFixed(2)}px) rotateX(${pose.rotateX.toFixed(2)}deg) scale(${pose.scale.toFixed(4)})`;
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

export function stepSpring(
  x: number,
  velocity: number,
  target: number,
  dt: number,
  reduced: boolean,
) {
  if (reduced) return { x: target, velocity: 0, done: true };
  const stiffness = 86;
  const damping = 17;
  const acc = -stiffness * (x - target) - damping * velocity;
  const nextVelocity = velocity + acc * dt;
  const next = x + nextVelocity * dt;
  const done = Math.abs(next - target) < 0.001 && Math.abs(nextVelocity) < 0.02;
  if (done) return { x: target, velocity: 0, done: true };
  return { x: next, velocity: nextVelocity, done: false };
}
