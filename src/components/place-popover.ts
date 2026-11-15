export type PopoverSide = "above" | "below";

/** Pin a menu to its trigger and keep it inside the viewport. */
export function placePopover(
  trigger: HTMLElement,
  menu: HTMLElement,
  prefer: PopoverSide,
) {
  const margin = 8;
  const gap = 6;
  const parent = menu.offsetParent instanceof HTMLElement ? menu.offsetParent : null;
  const parentRect = parent?.getBoundingClientRect() ?? { left: 0, top: 0 };
  const triggerRect = trigger.getBoundingClientRect();
  const width = menu.offsetWidth;
  const height = menu.offsetHeight;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = triggerRect.right - width;
  if (left < margin) left = triggerRect.left;
  if (left + width > viewportWidth - margin) {
    left = viewportWidth - width - margin;
  }
  if (left < margin) left = margin;

  const spaceAbove = triggerRect.top - margin;
  const spaceBelow = viewportHeight - triggerRect.bottom - margin;
  const needed = height + gap;

  let side: PopoverSide = prefer;
  if (prefer === "below" && spaceBelow < needed && spaceAbove > spaceBelow) {
    side = "above";
  } else if (prefer === "above" && spaceAbove < needed && spaceBelow > spaceAbove) {
    side = "below";
  }

  let top =
    side === "below"
      ? triggerRect.bottom + gap
      : triggerRect.top - height - gap;
  if (top < margin) top = margin;
  if (top + height > viewportHeight - margin) {
    top = Math.max(margin, viewportHeight - height - margin);
  }

  menu.dataset.side = side;
  menu.style.right = "auto";
  menu.style.bottom = "auto";
  menu.style.left = `${Math.round(left - parentRect.left)}px`;
  menu.style.top = `${Math.round(top - parentRect.top)}px`;
}
