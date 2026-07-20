"use client";

import { useEffect, useState } from "react";
import {
  applyTheme,
  cycleTheme,
  readThemePreference,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
  THEME_STORAGE_KEY,
} from "@/lib/theme";
import styles from "./theme-toggle.module.css";

const LABELS: Record<ThemePreference, string> = {
  system: "Theme: system (follows device)",
  light: "Theme: light",
  dark: "Theme: dark",
};

export function ThemeToggle({ className }: { className?: string }) {
  const [pref, setPref] = useState<ThemePreference>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = (nextPref: ThemePreference) => {
      setPref(nextPref);
      const nextResolved = resolveTheme(nextPref);
      setResolved(nextResolved);
      applyTheme(nextPref);
    };

    sync(readThemePreference());
    setReady(true);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => {
      if (readThemePreference() === "system") sync("system");
    };
    mq.addEventListener("change", onSystem);
    return () => mq.removeEventListener("change", onSystem);
  }, []);

  function onToggle() {
    const next = cycleTheme(pref);
    setPref(next);
    const nextResolved = resolveTheme(next);
    setResolved(nextResolved);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
  }

  const isDark = resolved === "dark";

  return (
    <button
      type="button"
      className={`${styles.toggle} ${className ?? ""}`}
      onClick={onToggle}
      aria-label={LABELS[pref]}
      title={LABELS[pref]}
      data-ready={ready ? "true" : "false"}
    >
      <span className={styles.icons} aria-hidden="true">
        <span
          className={`${styles.icon} ${styles.sun} ${isDark ? styles.hide : styles.show}`}
        >
          <SunIcon />
        </span>
        <span
          className={`${styles.icon} ${styles.moon} ${isDark ? styles.show : styles.hide}`}
        >
          <MoonIcon />
        </span>
      </span>
      <span className={styles.label}>{pref}</span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2v2.2M12 19.8V22M4.2 12H2M22 12h-2.2M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="square"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M17.5 14.5A7.5 7.5 0 0 1 9.5 4.2 7.8 7.8 0 1 0 17.5 14.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
