import { MARK_GEOMETRY, MARK_SPOKES, MARK_WEDGE } from "@/lib/brand-mark";

const { C, RIM, INNER, HUB } = MARK_GEOMETRY;

/** Inline mark: ink follows `currentColor`, the painted wedge uses the accent. */
export function BrandMark({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <path d={MARK_WEDGE} fill="var(--wood)" />
      <circle cx={C} cy={C} r={RIM} fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx={C} cy={C} r={INNER} fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d={MARK_SPOKES} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx={C} cy={C} r={HUB} fill="currentColor" />
    </svg>
  );
}
