"use client";

import React from "react";
import { Sheet } from "@silk-hq/components";
import "./PageFromBottom.css";

type SheetRootProps = React.ComponentPropsWithoutRef<typeof Sheet.Root>;
type PageFromBottomRootProps = Omit<SheetRootProps, "license"> & {
  license?: SheetRootProps["license"];
};

const PageFromBottomRoot = React.forwardRef<
  React.ElementRef<typeof Sheet.Root>,
  PageFromBottomRootProps
>(({ license = "non-commercial", ...props }, ref) => {
  return <Sheet.Root license={license} {...props} ref={ref} />;
});
PageFromBottomRoot.displayName = "PageFromBottom.Root";

const PageFromBottomView = React.forwardRef<
  React.ElementRef<typeof Sheet.View>,
  React.ComponentPropsWithoutRef<typeof Sheet.View>
>(({ children, className, ...restProps }, ref) => {
  return (
    <Sheet.View
      className={`PageFromBottom-view ${className ?? ""}`.trim()}
      contentPlacement="bottom"
      nativeEdgeSwipePrevention={true}
      {...restProps}
      ref={ref}
    >
      {children}
    </Sheet.View>
  );
});
PageFromBottomView.displayName = "PageFromBottom.View";

const PageFromBottomBackdrop = React.forwardRef<
  React.ElementRef<typeof Sheet.Backdrop>,
  React.ComponentPropsWithoutRef<typeof Sheet.Backdrop>
>(({ className, ...restProps }, ref) => {
  return (
    <Sheet.Backdrop
      className={`PageFromBottom-backdrop ${className ?? ""}`.trim()}
      travelAnimation={{ opacity: [0, 0.45] }}
      themeColorDimming="auto"
      {...restProps}
      ref={ref}
    />
  );
});
PageFromBottomBackdrop.displayName = "PageFromBottom.Backdrop";

const PageFromBottomContent = React.forwardRef<
  React.ElementRef<typeof Sheet.Content>,
  React.ComponentPropsWithoutRef<typeof Sheet.Content>
>(({ children, className, ...restProps }, ref) => {
  return (
    <Sheet.Content
      className={`PageFromBottom-content ${className ?? ""}`.trim()}
      {...restProps}
      ref={ref}
    >
      {children}
    </Sheet.Content>
  );
});
PageFromBottomContent.displayName = "PageFromBottom.Content";

export const PageFromBottom = {
  Root: PageFromBottomRoot,
  Portal: Sheet.Portal,
  View: PageFromBottomView,
  Backdrop: PageFromBottomBackdrop,
  Content: PageFromBottomContent,
  Trigger: Sheet.Trigger,
  Handle: Sheet.Handle,
  Outlet: Sheet.Outlet,
  Title: Sheet.Title,
  Description: Sheet.Description,
};
