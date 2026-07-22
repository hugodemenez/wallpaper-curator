"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CopyToast } from "@/components/CopyToast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SITE_URL } from "@/lib/site";
import { thumbUrl, type Wallpaper } from "@/lib/wallpapers";
import styles from "./landing.module.css";

const MCP_URL = `${SITE_URL}/api/mcp`;

const CURSOR_SNIPPET = `{
  "mcpServers": {
    "wallpaper-curator": {
      "url": "${MCP_URL}"
    }
  }
}`;

type Props = {
  hero: Wallpaper;
  previews: Wallpaper[];
};

export function LandingHero({ hero, previews }: Props) {
  const [shown, setShown] = useState(false);
  const [imageIn, setImageIn] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastNonce, setToastNonce] = useState(0);

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

  async function copy(kind: "url" | "snippet", value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setToastMessage(
        kind === "url" ? "MCP endpoint copied" : "Cursor MCP snippet copied",
      );
      setToastNonce((n) => n + 1);
    } catch {
      setToastMessage(null);
    }
  }

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
            <a className={styles.secondary} href="#mcp">
              Connect an agent
            </a>
          </div>
        </section>

        <section id="mcp" className={styles.mcp} aria-labelledby="mcp-title">
          <div className={styles.mcpIntro}>
            <p className={styles.teaseEyebrow}>For agents</p>
            <h2 id="mcp-title" className={styles.teaseTitle}>
              Discover the library over MCP
            </h2>
            <p className={styles.teaseBody}>
              Point Cursor, Claude, or any MCP client at the public Streamable
              HTTP endpoint — search the catalog, read facets, and fetch image
              URLs without scraping the page. Full agent instructions live at{" "}
              <a className={styles.mcpInlineLink} href="/agents.md">
                /agents.md
              </a>
              .
            </p>
          </div>

          <div className={styles.mcpEndpoint}>
            <p className={styles.mcpLabel}>Agent guide</p>
            <div className={styles.mcpRow}>
              <code className={styles.mcpCode}>{SITE_URL}/agents.md</code>
              <a className={styles.mcpCopy} href="/agents.md">
                Open
              </a>
            </div>
          </div>

          <div className={styles.mcpEndpoint}>
            <p className={styles.mcpLabel}>Endpoint</p>
            <div className={styles.mcpRow}>
              <code className={styles.mcpCode}>{MCP_URL}</code>
              <button
                type="button"
                className={styles.mcpCopy}
                onClick={() => copy("url", MCP_URL)}
              >
                Copy
              </button>
            </div>
          </div>

          <ul className={styles.mcpTools}>
            <li>
              <code>list_facets</code> — artists, tones, sources
            </li>
            <li>
              <code>search_wallpapers</code> — free text + filters
            </li>
            <li>
              <code>get_wallpaper</code> — one painting by id
            </li>
            <li>
              <code>wallpaper://catalog</code> — full catalog resource
            </li>
          </ul>

          <div className={styles.mcpEndpoint}>
            <p className={styles.mcpLabel}>Cursor · ~/.cursor/mcp.json</p>
            <div className={styles.mcpRow}>
              <pre className={styles.mcpPre}>{CURSOR_SNIPPET}</pre>
              <button
                type="button"
                className={styles.mcpCopy}
                onClick={() => copy("snippet", CURSOR_SNIPPET)}
              >
                Copy
              </button>
            </div>
          </div>
        </section>
      </main>

      <CopyToast message={toastMessage} nonce={toastNonce} />
    </div>
  );
}
