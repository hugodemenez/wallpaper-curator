/** Degrees between neighbouring paintings on the drum. */
export const WHEEL_STEP = 24;

/** How many items either side of centre stay mounted. */
export const WHEEL_REACH = 4;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Resistance past an edge. `overshoot` and the result share units. */
export function rubberband(overshoot: number, dimension = 1, constant = 0.55) {
  const amount = Math.abs(overshoot);
  if (amount === 0) return 0;
  const resisted =
    (amount * dimension * constant) / (dimension + constant * amount);
  return Math.sign(overshoot) * resisted;
}

/** Visual index after soft edges. `max` is the last item index. */
export function rubberOffset(raw: number, max: number) {
  if (raw < 0) return rubberband(raw, 1);
  if (raw > max) return max + rubberband(raw - max, 1);
  return raw;
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
  reducedMotion = false,
): ItemPose {
  const theta = (index - offset) * WHEEL_STEP;
  const rad = (theta * Math.PI) / 180;
  const y = Math.sin(rad) * radius;
  const z = (Math.cos(rad) - 1) * radius;
  const abs = Math.abs(theta);
  const t = Math.min(abs / 72, 1);
  const scale = 1.08 - t * 0.5;
  const opacity = abs > 76 ? 0 : 1 - t ** 1.2 * 0.9;
  const dist = Math.abs(index - offset);
  const blur = reducedMotion || dist < 0.35 ? 0 : Math.min(6, dist * 2);
  return { y, z, rotateX: -theta, scale, opacity, blur };
}

/** Higher for the painting closest to centre, so it always paints last. */
export function itemZIndex(index: number, offset: number) {
  return 5000 - Math.round(Math.abs(index - offset) * 100);
}

/**
 * Each card carries its own perspective. They are flat layers, not one shared
 * 3D scene, so Safari cannot depth-test a neighbour through the centre image.
 */
export function itemTransform(pose: ItemPose) {
  return `translate(-50%, -50%) perspective(860px) translate3d(0px, ${pose.y.toFixed(2)}px, ${pose.z.toFixed(2)}px) rotateX(${pose.rotateX.toFixed(2)}deg) scale(${pose.scale.toFixed(4)})`;
}

/** Indices to warm ahead of the mounted arc. Wider in the direction of travel. */
export function prefetchRange(offset: number, velocity: number, count: number) {
  const max = Math.max(0, count - 1);
  const dir = velocity > 0.5 ? 1 : velocity < -0.5 ? -1 : 0;
  const extra = dir === 0 ? 0 : Math.min(4, Math.ceil(Math.abs(velocity) / 3));
  const before = 7 + (dir < 0 ? extra : 0);
  const after = 7 + (dir > 0 ? extra : 0);
  return {
    start: clamp(Math.floor(offset) - before, 0, max),
    end: clamp(Math.ceil(offset) + after, 0, max),
  };
}

export function visibleRange(offset: number, count: number) {
  const max = Math.max(0, count - 1);
  const nearest = clamp(Math.round(offset), 0, max);
  return {
    nearest,
    start: Math.max(0, nearest - WHEEL_REACH),
    end: Math.min(max, nearest + WHEEL_REACH),
  };
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
