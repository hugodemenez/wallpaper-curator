"use client";

import { useRef } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePopover } from "@/components/use-popover";
import popover from "./popover.module.css";
import styles from "./gallery-settings.module.css";

const COL_OPTIONS = [1, 2, 3, 4] as const;

export function GallerySettings({
  cols,
  onCols,
}: {
  cols: number;
  onCols: (cols: number) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { open, toggle, menuId } = usePopover(
    "below",
    rootRef,
    triggerRef,
    menuRef,
  );
  const themeLabelId = `${menuId}-theme`;
  const colsLabelId = `${menuId}-cols`;

  return (
    <div
      className={popover.anchor}
      data-open={open ? "true" : "false"}
      ref={rootRef}
    >
      <button
        ref={triggerRef}
        type="button"
        className={popover.trigger}
        aria-label="Settings"
        title="Settings"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={toggle}
      >
        <GearIcon />
      </button>
      <div
        ref={menuRef}
        id={menuId}
        role="dialog"
        aria-label="Settings"
        className={`${popover.panel} ${styles.panel}`}
        data-open={open ? "true" : "false"}
        data-side="below"
        inert={open ? undefined : true}
        aria-hidden={open ? undefined : true}
      >
        <div className={styles.section}>
          <span className={styles.sectionLabel} id={themeLabelId}>
            Theme
          </span>
          <ThemeToggle showLabel className={styles.themeToggle} />
        </div>
        <div
          className={styles.section}
          role="group"
          aria-labelledby={colsLabelId}
        >
          <span className={styles.sectionLabel} id={colsLabelId}>
            Columns
          </span>
          <div className={styles.cols}>
            {COL_OPTIONS.map((count) => (
              <button
                key={count}
                type="button"
                className={
                  cols === count ? `${styles.col} ${styles.colActive}` : styles.col
                }
                aria-pressed={cols === count}
                aria-label={`${count} column${count === 1 ? "" : "s"}`}
                onClick={() => onCols(count)}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.2 2.8h3.6l.4 2.2a6.8 6.8 0 0 1 1.7.9l2-.8 1.8 3.1-1.6 1.4a6.9 6.9 0 0 1 0 2.8l1.6 1.4-1.8 3.1-2-.8a6.8 6.8 0 0 1-1.7.9l-.4 2.2h-3.6l-.4-2.2a6.8 6.8 0 0 1-1.7-.9l-2 .8-1.8-3.1 1.6-1.4a6.9 6.9 0 0 1 0-2.8L4.3 8.2l1.8-3.1 2 .8a6.8 6.8 0 0 1 1.7-.9l.4-2.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
