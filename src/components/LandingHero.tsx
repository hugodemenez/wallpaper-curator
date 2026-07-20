"use client";

import Link from "next/link";
import styles from "./landing.module.css";

type Props = {
  heroUrl: string;
};

export function LandingHero({ heroUrl }: Props) {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-label="Wallpaper Curator">
        <div className={styles.visual} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.heroImg}
            src={heroUrl}
            alt=""
            decoding="async"
          />
          <div className={styles.scrim} />
        </div>

        <div className={styles.copy}>
          <p className={styles.brand}>Wallpaper Curator</p>
          <h1 className={styles.headline}>
            Public-domain paintings,
            <br />
            set as wallpaper.
          </h1>
          <p className={styles.support}>
            A terminal gallery of curated museum originals — browse, download,
            or send straight to your desktop with Raycast.
          </p>
          <div className={styles.cta}>
            <Link className={styles.primary} href="/gallery">
              Browse wallpapers
            </Link>
            <a
              className={styles.secondary}
              href="#raycast"
            >
              Raycast
            </a>
          </div>
        </div>
      </section>

      <section className={styles.about} aria-labelledby="about-title">
        <h2 id="about-title" className={styles.aboutTitle}>
          Terminal, not dashboard
        </h2>
        <p className={styles.aboutBody}>
          Black ground. Mono type. Zoom, search, sort — then{" "}
          <code>wall</code> via Raycast or <code>dl</code> the file. Catalog
          lives in YAML so you can add a painting without touching the UI.
        </p>
      </section>

      <section
        id="raycast"
        className={styles.about}
        aria-labelledby="raycast-title"
      >
        <h2 id="raycast-title" className={styles.aboutTitle}>
          Set wallpaper with Raycast
        </h2>
        <p className={styles.aboutBody}>
          Install the companion extension from this repo (
          <code>raycast-extension/</code>), run{" "}
          <code>npm install && npm run dev</code>, then use{" "}
          <code>wall</code> on any gallery image. Publish with{" "}
          <code>npx ray submit</code> when ready for the store.
        </p>
      </section>
    </main>
  );
}
