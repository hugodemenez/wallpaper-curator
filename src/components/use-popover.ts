"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { placePopover, type PopoverSide } from "./place-popover";

export function usePopover(
  prefer: PopoverSide,
  rootRef: RefObject<HTMLDivElement | null>,
  triggerRef: RefObject<HTMLButtonElement | null>,
  menuRef: RefObject<HTMLDivElement | null>,
) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const dismissCleanup = useRef<(() => void) | null>(null);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((value) => !value), []);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (document.body.classList.contains("viewer-open")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setOpen(false);
      triggerRef.current?.focus();
    }

    function onPointerDown(event: PointerEvent) {
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && root.contains(event.target)) return;
      setOpen(false);

      let timer = 0;
      const cleanup = () => {
        document.removeEventListener("click", killClick, true);
        window.clearTimeout(timer);
        if (dismissCleanup.current === cleanup) dismissCleanup.current = null;
      };
      const killClick = (clickEvent: MouseEvent) => {
        const target = clickEvent.target;
        const opensCard =
          target instanceof Element &&
          target.closest("[data-gallery-card]") &&
          !target.closest("[data-card-action]");
        if (opensCard) {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
        }
        cleanup();
      };

      dismissCleanup.current?.();
      document.addEventListener("click", killClick, true);
      timer = window.setTimeout(cleanup, 500);
      dismissCleanup.current = cleanup;
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, rootRef, triggerRef]);

  useLayoutEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const place = () => placePopover(trigger, menu, prefer);
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, prefer, menuRef, triggerRef]);

  return { open, close, toggle, menuId };
}
