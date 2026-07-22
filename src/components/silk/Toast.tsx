"use client";

import React, {
  useEffect,
  useState,
  useRef,
  createContext,
  useContext,
} from "react";
import { Sheet, useClientMediaQuery } from "@silk-hq/components";
import "./Toast.css";

type ToastContextValue = {
  presented: boolean;
  setPresented: (presented: boolean) => void;
  pointerOver: boolean;
  setPointerOver: (pointerOver: boolean) => void;
  travelStatus: string;
  setTravelStatus: (status: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

type SheetRootProps = React.ComponentPropsWithoutRef<typeof Sheet.Root>;
type ToastRootProps = Omit<SheetRootProps, "license"> & {
  license?: SheetRootProps["license"];
};

const ToastRoot = React.forwardRef<
  React.ElementRef<typeof Sheet.Root>,
  ToastRootProps
>(({ children, license = "non-commercial", ...restProps }, ref) => {
  const [presented, setPresented] = useState(false);
  const [pointerOver, setPointerOver] = useState(false);
  const [travelStatus, setTravelStatus] = useState("idleOutside");
  const autoCloseTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    const startAutoCloseTimeout = () => {
      autoCloseTimeout.current = setTimeout(() => setPresented(false), 2800);
    };

    const clearAutoCloseTimeout = () => {
      clearTimeout(autoCloseTimeout.current);
    };

    if (presented) {
      if (travelStatus === "idleInside" && !pointerOver) {
        startAutoCloseTimeout();
      } else {
        clearAutoCloseTimeout();
      }
    }
    return clearAutoCloseTimeout;
  }, [presented, travelStatus, pointerOver]);

  return (
    <ToastContext.Provider
      value={{
        presented,
        setPresented,
        pointerOver,
        setPointerOver,
        travelStatus,
        setTravelStatus,
      }}
    >
      <Sheet.Root
        license={license}
        presented={presented}
        onPresentedChange={setPresented}
        sheetRole=""
        {...restProps}
        ref={ref}
      >
        {children}
      </Sheet.Root>
    </ToastContext.Provider>
  );
});
ToastRoot.displayName = "Toast.Root";

const ToastView = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Sheet.View>
>(({ children, className, ...restProps }, ref) => {
  const largeViewport = useClientMediaQuery("(min-width: 1000px)");
  const contentPlacement = largeViewport ? "right" : "top";

  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("ToastView must be used within a ToastContext.Provider");
  }
  const { setTravelStatus } = context;

  return (
    <div
      className={`Toast-container ${className ?? ""}`.trim()}
      role="status"
      aria-live="polite"
      ref={ref}
    >
      <Sheet.View
        className={`Toast-view ${className ?? ""}`.trim()}
        contentPlacement={contentPlacement}
        inertOutside={false}
        onPresentAutoFocus={{ focus: false }}
        onDismissAutoFocus={{ focus: false }}
        onClickOutside={{
          dismiss: false,
          stopOverlayPropagation: false,
        }}
        onEscapeKeyDown={{
          dismiss: false,
          stopOverlayPropagation: false,
        }}
        onTravelStatusChange={setTravelStatus}
        {...restProps}
      >
        {children}
      </Sheet.View>
    </div>
  );
});
ToastView.displayName = "Toast.View";

const ToastContent = React.forwardRef<
  React.ElementRef<typeof Sheet.Content>,
  React.ComponentPropsWithoutRef<typeof Sheet.Content>
>(({ children, className, ...restProps }, ref) => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("ToastContent must be used within ToastRoot");

  return (
    <Sheet.Content
      className={`Toast-content ${className ?? ""}`.trim()}
      asChild
      {...restProps}
      ref={ref}
    >
      <Sheet.SpecialWrapper.Root>
        <Sheet.SpecialWrapper.Content
          className="Toast-innerContent"
          onPointerEnter={() => context.setPointerOver(true)}
          onPointerLeave={() => context.setPointerOver(false)}
        >
          {children}
        </Sheet.SpecialWrapper.Content>
      </Sheet.SpecialWrapper.Root>
    </Sheet.Content>
  );
});
ToastContent.displayName = "Toast.Content";

function useToastPresent() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToastPresent must be used within Toast.Root");
  return context.setPresented;
}

export const Toast = {
  Root: ToastRoot,
  Portal: Sheet.Portal,
  View: ToastView,
  Content: ToastContent,
  Trigger: Sheet.Trigger,
  Title: Sheet.Title,
  Description: Sheet.Description,
  Handle: Sheet.Handle,
  Outlet: Sheet.Outlet,
  usePresent: useToastPresent,
};
