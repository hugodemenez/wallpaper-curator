"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { thumbUrl, type Wallpaper } from "@/lib/wallpapers";
import styles from "./landing.module.css";

type Props = {
  hero: Wallpaper;
  previews: Wallpaper[];
};

export function LandingHero({ hero, previews }: Props) {
  const [shown, setShown] = useState(false);
  const [imageIn, setImageIn] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      setImageIn(true);
      setShown(true);
      return;
    }

    const imgFrame = requestAnimationFrame(() => setImageIn(true));
    const textTimer = window.setTimeout(() => setShown(true), 180);
    return () => {
      cancelAnimationFrame(imgFrame);
      window.clearTimeout(textTimer);
    };
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <ThemeToggle />
      </header>

      <main id="main">
        <section className={styles.hero} aria-label="Wallpaper Curator">
          <div
            className={`${styles.visual} ${imageIn ? styles.visualIn : ""}`}
            aria-hidden="true"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.heroImg}
              src={thumbUrl(hero.url, 1920)}
              alt=""
              decoding="async"
            />
            <div className={styles.scrim} />
          </div>

          <div className={styles.woodEdge} aria-hidden="true" />

          <div className={styles.copy}>
            <div className={`t-stagger ${shown ? "is-shown" : ""}`}>
              <p className={`t-stagger-line t-stagger-line--1 ${styles.brand}`}>
                Wallpaper Curator
              </p>
              <h1
                className={`t-stagger-line t-stagger-line--2 ${styles.headline}`}
              >
                Step into the gallery.
              </h1>
              <p
                className={`t-stagger-line t-stagger-line--3 ${styles.support}`}
              >
                Soft light, wooden calm, and public-domain paintings chosen for
                quiet rooms — browse the collection and take one home to your
                desktop.
              </p>
              <div className={`t-stagger-line t-stagger-line--4 ${styles.cta}`}>
                <Link className={styles.primary} href="/gallery">
                  Enter the gallery
                </Link>
                <a className={styles.secondary} href="#collection">
                  Peek inside
                </a>
              </div>
            </div>
          </div>
        </section>

        <section
          id="collection"
          className={styles.tease}
          aria-labelledby="tease-title"
        >
          <div className={styles.teaseIntro}>
            <p className={styles.teaseEyebrow}>The collection</p>
            <h2 id="tease-title" className={styles.teaseTitle}>
              Paintings waiting on the wall
            </h2>
            <p className={styles.teaseBody}>
              Open the gallery to zoom, search, and download — or send a piece
              straight to your desktop with Raycast.
            </p>
          </div>

          <ul className={styles.strip}>
            {previews.map((w, i) => (
              <li key={w.id} style={{ ["--i" as string]: String(i) }}>
                <Link href="/gallery" className={styles.stripItem}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbUrl(w.url, 500)}
                    alt={`${w.artist} — ${w.name}`}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className={styles.stripCaption}>{w.artist}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className={styles.teaseCta}>
            <Link className={styles.primary} href="/gallery">
              Browse all wallpapers
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
