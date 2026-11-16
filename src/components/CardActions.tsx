"use client";

import { useRef } from "react";
import { WallButton } from "@/components/WallButton";
import { usePopover } from "@/components/use-popover";
import styles from "./popover.module.css";

export function CardActions({
  imageUrl,
  title,
}: {
  imageUrl: string;
  title: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { open, close, toggle, menuId } = usePopover(
    "above",
    rootRef,
    triggerRef,
    menuRef,
  );

  return (
    <div
      className={styles.anchor}
      data-open={open ? "true" : "false"}
      data-card-action=""
      ref={rootRef}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${styles.triggerLabel}`}
        aria-label="Download"
        title="Download"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={toggle}
      >
        <DownloadIcon />
        <span>Download</span>
      </button>
      <div
        ref={menuRef}
        id={menuId}
        role="dialog"
        aria-label="Download"
        className={styles.panel}
        data-open={open ? "true" : "false"}
        data-side="above"
        inert={open ? undefined : true}
        aria-hidden={open ? undefined : true}
      >
        <WallButton
          imageUrl={imageUrl}
          title={title}
          text="Set as wallpaper"
          className={styles.item}
          onClickCapture={(event) => {
            event.stopPropagation();
            close();
          }}
        />
        <a
          className={styles.item}
          href={imageUrl}
          download
          target="_blank"
          rel="noreferrer"
          aria-label={`Download ${title}`}
          onClick={(event) => {
            event.stopPropagation();
            close();
          }}
        >
          Download
        </a>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.8v9.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="square"
      />
      <path
        d="M7.8 10.2 12 14.4l4.2-4.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="miter"
      />
      <path
        d="M5 19.2h14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="square"
      />
    </svg>
  );
}
