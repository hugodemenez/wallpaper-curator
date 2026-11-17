/* Shared markup for opengraph-image + twitter-image (next/og ImageResponse). */
import { BRAND, markSvg } from "@/lib/brand-mark";

const MARK = `data:image/svg+xml;base64,${Buffer.from(
  markSvg({ ink: BRAND.ink, paint: BRAND.pompeian }),
).toString("base64")}`;

function Painting({
  src,
  width,
  height,
  dim,
}: {
  src: string | null;
  width: number;
  height: number;
  dim?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        width,
        height,
        overflow: "hidden",
        position: "relative",
        background: "#d8d0c2",
        ...(dim ? {} : { boxShadow: "0 24px 50px -20px rgba(40,28,20,0.55)" }),
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={width}
          height={height}
          style={{ width, height, objectFit: "cover" }}
        />
      ) : null}
      {/* A veil instead of `opacity`, which resvg mis-composites here. */}
      {dim ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width,
            height,
            background: "rgba(246,242,234,0.5)",
          }}
        />
      ) : null}
    </div>
  );
}

export function OgCard({
  images,
  caption,
}: {
  images: (string | null)[];
  caption: string;
}) {
  const [above, centre, below] = images;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: BRAND.ivory,
        color: BRAND.ink,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: 520,
          padding: "0 0 0 72px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MARK} alt="" width={84} height={84} style={{ marginBottom: 30 }} />
        <div
          style={{
            display: "flex",
            fontFamily: "Cinzel",
            fontSize: 68,
            letterSpacing: "0.06em",
            lineHeight: 1,
          }}
        >
          ROTAPICTA
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Cormorant",
            fontStyle: "italic",
            fontSize: 40,
            color: BRAND.pompeian,
            marginTop: 14,
          }}
        >
          the painted wheel
        </div>
        <div
          style={{ display: "flex", width: 64, height: 2, background: BRAND.ink, margin: "34px 0 26px" }}
        />
        <div
          style={{
            display: "flex",
            fontFamily: "Cormorant",
            fontStyle: "italic",
            fontSize: 32,
            lineHeight: 1.25,
            color: "#4a4038",
            maxWidth: 400,
          }}
        >
          Public-domain masterpieces, turned into wallpapers.
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Cinzel",
            fontSize: 20,
            letterSpacing: "0.22em",
            marginTop: 40,
            color: "#6b5f55",
          }}
        >
          ROTAPICTA.COM
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          paddingRight: 40,
        }}
      >
        <Painting src={above} width={470} height={92} dim />
        <Painting src={centre} width={600} height={338} />
        <Painting src={below} width={470} height={92} dim />
        <div
          style={{
            display: "flex",
            fontFamily: "Cormorant",
            fontStyle: "italic",
            fontSize: 22,
            color: "#6b5f55",
            marginTop: 2,
            maxWidth: 600,
          }}
        >
          {caption}
        </div>
      </div>
    </div>
  );
}
