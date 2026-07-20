import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 132,
            height: 100,
            border: "3px solid #fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: 100,
              height: 68,
              border: "2px solid #aaa",
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                width: "100%",
                height: 28,
                background: "#fff",
                clipPath: "polygon(0 100%, 20% 40%, 45% 70%, 70% 20%, 100% 100%)",
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
