"use client";

import React from "react";
import {
  Sheet,
  type SheetViewProps,
  useClientMediaQuery,
} from "@silk-hq/components";
import "./DetachedSheet.css";

type SheetRootProps = React.ComponentPropsWithoutRef<typeof Sheet.Root>;
type DetachedSheetRootProps = Omit<SheetRootProps, "license"> & {
  license?: SheetRootProps["license"];
};

const DetachedSheetRoot = React.forwardRef<
  React.ElementRef<typeof Sheet.Root>,
  DetachedSheetRootProps
>(({ children, license = "non-commercial", ...restProps }, ref) => {
  return (
    <Sheet.Root license={license} {...restProps} ref={ref}>
      {children}
    </Sheet.Root>
  );
});
DetachedSheetRoot.displayName = "DetachedSheet.Root";

const DetachedSheetView = React.forwardRef<
  React.ElementRef<typeof Sheet.View>,
  React.ComponentPropsWithoutRef<typeof Sheet.View>
>(({ children, className, ...restProps }, ref) => {
  const largeViewport = useClientMediaQuery("(min-width: 650px)");
  const contentPlacement = largeViewport ? "center" : "bottom";
  const tracks: SheetViewProps["tracks"] = largeViewport
    ? ["top", "bottom"]
    : "bottom";

  return (
    <Sheet.View
      className={`DetachedSheet-view contentPlacement-${contentPlacement} ${className ?? ""}`.trim()}
      contentPlacement={contentPlacement}
      tracks={tracks}
      nativeEdgeSwipePrevention={true}
      {...restProps}
      ref={ref}
    >
      {children}
    </Sheet.View>
  );
});
DetachedSheetView.displayName = "DetachedSheet.View";

const DetachedSheetBackdrop = React.forwardRef<
  React.ElementRef<typeof Sheet.Backdrop>,
  React.ComponentPropsWithoutRef<typeof Sheet.Backdrop>
>(({ className, ...restProps }, ref) => {
  return (
    <Sheet.Backdrop
      className={`DetachedSheet-backdrop ${className ?? ""}`.trim()}
      travelAnimation={{
        opacity: ({ progress }) => Math.min(progress * 0.45, 0.45),
      }}
      themeColorDimming="auto"
      {...restProps}
      ref={ref}
    />
  );
});
DetachedSheetBackdrop.displayName = "DetachedSheet.Backdrop";

const DetachedSheetContent = React.forwardRef<
  React.ElementRef<typeof Sheet.Content>,
  React.ComponentPropsWithoutRef<typeof Sheet.Content>
>(({ children, className, ...restProps }, ref) => {
  return (
    <Sheet.Content
      className={`DetachedSheet-content ${className ?? ""}`.trim()}
      {...restProps}
      ref={ref}
    >
      <div className="DetachedSheet-innerContent">{children}</div>
    </Sheet.Content>
  );
});
DetachedSheetContent.displayName = "DetachedSheet.Content";

const DetachedSheetHandle = React.forwardRef<
  React.ElementRef<typeof Sheet.Handle>,
  React.ComponentPropsWithoutRef<typeof Sheet.Handle>
>(({ className, ...restProps }, ref) => {
  return (
    <Sheet.Handle
      className={`DetachedSheet-handle ${className ?? ""}`.trim()}
      action="dismiss"
      {...restProps}
      ref={ref}
    />
  );
});
DetachedSheetHandle.displayName = "DetachedSheet.Handle";

export const DetachedSheet = {
  Root: DetachedSheetRoot,
  Portal: Sheet.Portal,
  View: DetachedSheetView,
  Backdrop: DetachedSheetBackdrop,
  Content: DetachedSheetContent,
  Trigger: Sheet.Trigger,
  Handle: DetachedSheetHandle,
  Outlet: Sheet.Outlet,
  Title: Sheet.Title,
  Description: Sheet.Description,
};
