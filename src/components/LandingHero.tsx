import Link from "next/link";
import type { CSSProperties } from "react";
import { BrandMark } from "@/components/BrandMark";
import { CopyButton } from "@/components/CopyButton";
import { itemPose, WHEEL_PERSPECTIVE } from "@/components/wheel-math";
import { SITE_URL } from "@/lib/site";
import { thumbUrl, type Wallpaper } from "@/lib/wallpapers";
import styles from "./landing.module.css";

const MCP_URL = `${SITE_URL}/api/mcp`;

type Props = {
  /** Five paintings, top to bottom; the middle one sits at the centre. */
  wheel: Wallpaper[];
  collection: Wallpaper[];
};

/** Commons thumbs at real Wikimedia steps, as an <img> srcset. */
function srcSet(url: string, widths: number[]) {
  return widths.map((w) => `${thumbUrl(url, w)} ${w}w`).join(", ");
}

/** Short source credit for a museum label. */
function credit(w: Wallpaper) {
  return w.source || "Public domain";
}

/** Shorter artist name for tight labels: "Joseph Mallord William Turner" → "J. M. W. Turner". */
function shortArtist(name: string) {
  const parts = name.split(" ");
  if (parts.length < 3) return name;
  const last = parts.pop() as string;
  return `${parts.map((p) => `${p[0]}.`).join(" ")} ${last}`;
}

/**
 * A still frame of the gallery wheel, posed with the same math (and the same
 * per-card perspective) the real wheel uses. Distances are in units of the
 * wheel radius, scaled by `--r` in CSS so the stack resizes without JS.
 */
function WheelStill({ wheel }: { wheel: Wallpaper[] }) {
  const centre = Math.floor(wheel.length / 2);
  return (
    <div className={styles.wheel}>
      {wheel.map((w, i) => {
        const pose = itemPose(i, centre, 1, wheel.length + 6);
        const dist = Math.abs(i - centre);
        const style = {
          "--y": pose.y.toFixed(4),
          "--z": pose.z.toFixed(4),
          "--rx": `${pose.rotateX.toFixed(2)}deg`,
          "--s": pose.scale.toFixed(4),
          "--o": pose.opacity.toFixed(3),
          "--p": `${WHEEL_PERSPECTIVE}px`,
          "--d": String(i),
          zIndex: 10 - dist,
        } as CSSProperties;
        return (
          <div
            key={w.id}
            className={styles.card}
            data-dist={dist}
            style={style}
          >
            <div className={styles.cardIn}>
              {/* Commons thumbs at fixed steps; next/image would re-encode them. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbUrl(w.url, dist === 0 ? 960 : 500)}
                srcSet={dist === 0 ? srcSet(w.url, [500, 960, 1280]) : undefined}
                sizes={dist === 0 ? "(min-width: 900px) 520px, 86vw" : undefined}
                alt={dist === 0 ? `${w.name} by ${w.artist}` : ""}
                width={1280}
                height={720}
                decoding="async"
                fetchPriority={dist === 0 ? "high" : "low"}
                loading={dist > 1 ? "lazy" : "eager"}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path
        d="M4 10h11M11 5.5 15.5 10 11 14.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LandingHero({ wheel, collection }: Props) {
  const centre = wheel[Math.floor(wheel.length / 2)];

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <Link href="/" className={styles.brand} aria-label="Rotapicta">
          <BrandMark className={styles.brandMark} size={26} />
          <span className={styles.brandWord}>Rotapicta</span>
        </Link>
        <Link href="/gallery" className={styles.topLink}>
          The wheel
        </Link>
      </header>

      <main id="main">
        <section className={styles.hero} aria-labelledby="hero-title">
          <Link
            href={`/gallery?p=${encodeURIComponent(centre.id)}`}
            className={styles.stage}
            aria-label={`Open ${centre.name} by ${centre.artist} on the wheel`}
          >
            <WheelStill wheel={wheel} />
          </Link>

          <p className={styles.label}>
            <span className={styles.labelArtist}>{shortArtist(centre.artist)}</span>
            <span className={styles.labelTitle}>{centre.name}</span>
            <span className={styles.labelMeta}>
              {centre.date} · {credit(centre)}
            </span>
          </p>

          <div className={styles.copy}>
            <p className={styles.kicker}>
              <span>Rota picta</span>
              <span className={styles.kickerRule} aria-hidden="true" />
              <em>the painted wheel</em>
            </p>
            <h1 id="hero-title" className={styles.headline}>
              Old masters for new screens
            </h1>
            <p className={styles.support}>
              Turn a wheel of public-domain masterpieces from the world’s great
              museums. Stop on the one that moves you, and make it your
              wallpaper.
            </p>
            <div className={styles.cta}>
              <Link className={styles.primary} href="/gallery">
                <span>Turn the wheel</span>
                <Arrow />
              </Link>
              <p className={styles.ctaNote}>Free · No account · Phone &amp; desktop</p>
            </div>
          </div>
        </section>

        <section className={styles.steps} aria-labelledby="steps-title">
          <h2 id="steps-title" className={styles.sectionTitle}>
            How it turns
          </h2>
          <ol className={styles.stepList}>
            <li>
              <span className={styles.numeral} aria-hidden="true">I</span>
              <h3>Turn</h3>
              <p>Swipe the wheel up or down. It never ends: the paintings come round again.</p>
            </li>
            <li>
              <span className={styles.numeral} aria-hidden="true">II</span>
              <h3>Stop</h3>
              <p>Let it settle on a painting. Every one is from a museum’s open, public-domain collection.</p>
            </li>
            <li>
              <span className={styles.numeral} aria-hidden="true">III</span>
              <h3>Keep</h3>
              <p>Download the original, or set it as your wallpaper in a tap or two.</p>
            </li>
          </ol>
        </section>

        <section className={styles.collection} aria-labelledby="collection-title">
          <div className={styles.sectionHead}>
            <h2 id="collection-title" className={styles.sectionTitle}>
              On the wheel
            </h2>
            <p className={styles.sectionLead}>Seen as they would sit on your lock screen.</p>
          </div>
          <ul className={styles.frames}>
            {collection.map((w) => (
              <li key={w.id}>
                <Link href={`/gallery?p=${encodeURIComponent(w.id)}`} className={styles.frameLink}>
                  <span className={styles.phone}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbUrl(w.url, 960)}
                      srcSet={srcSet(w.url, [960, 1280])}
                      sizes="(min-width: 900px) 420px, 90vw"
                      alt={`${w.name} by ${w.artist}`}
                      width={1280}
                      height={720}
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                  <span className={styles.frameLabel}>
                    <span className={styles.labelArtist}>{shortArtist(w.artist)}</span>
                    <span className={styles.labelTitle}>{w.name}</span>
                    <span className={styles.labelMeta}>
                      {w.date} · {credit(w)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className={styles.collectionCta}>
            <Link className={styles.secondary} href="/gallery">
              <span>See them all on the wheel</span>
              <Arrow />
            </Link>
          </div>
        </section>

        <section id="mcp" className={styles.agents} aria-labelledby="mcp-title">
          <h2 id="mcp-title" className={styles.sectionTitle}>
            For agents
          </h2>
          <p className={styles.agentsBody}>
            The catalog is open over MCP. Point Claude, Cursor or any MCP
            client at the endpoint to search paintings and fetch image URLs.
            Details in <a href="/agents.md">agents.md</a>.
          </p>
          <div className={styles.endpoint}>
            <code>{MCP_URL}</code>
            <CopyButton value={MCP_URL} className={styles.copyBtn} />
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <BrandMark size={20} />
        <p>
          <span className={styles.footerWord}>Rotapicta</span> — from the Latin{" "}
          <em>rota picta</em>, the painted wheel. Paintings are public-domain works
          shared openly by Wikimedia Commons, the National Gallery of Art, the
          Cleveland Museum of Art, The Met and SMK.
        </p>
      </footer>
    </div>
  );
}
