"use client";

import styles from "./gallery.module.css";

type Props = {
  src: string;
  alt: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function ViewerStage({
  src,
  alt,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: Props) {
  return (
    <div className={styles.stage}>
      <button
        type="button"
        className={styles.nav}
        aria-label="Previous wallpaper"
        disabled={!canPrev}
        onClick={onPrev}
      >
        ‹
      </button>

      <div className={styles.stageMedia} data-viewer-media="">
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
