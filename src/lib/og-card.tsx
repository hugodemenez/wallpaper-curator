/* Shared markup for opengraph-image + twitter-image (next/og ImageResponse). */

export function OgGalleryCard({ images }: { images: string[] }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#ddd7cc",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          width: "100%",
          gap: 10,
          padding: "28px 28px 0",
        }}
      >
        {images.length > 0 ? (
          images.map((src, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flex: 1,
                height: "100%",
                overflow: "hidden",
                border: "1px solid #b8b0a2",
                background: "#cfc7b8",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                width={280}
                height={420}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          ))
        ) : (
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              color: "#5c4033",
              fontSize: 28,
            }}
          >
            Public-domain gallery
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "28px 36px 32px",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: 6,
            background: "#5c4033",
            marginBottom: 18,
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 500,
            color: "#2a221c",
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          Wallpaper Curator
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 10,
            fontSize: 28,
            color: "#5c4033",
            letterSpacing: "-0.01em",
          }}
        >
          Public-domain paintings, set as wallpaper.
        </div>
      </div>
    </div>
  );
}
