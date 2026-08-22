import { ImageResponse } from "next/og";

import { getMessages } from "@/lib/i18n/config";

export const alt = "Family Money Management";
export const size = { height: 630, width: 1200 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const messages = getMessages();

  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#173a34",
        color: "#fffaf1",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        padding: "72px",
        width: "100%",
      }}
    >
      <div
        style={{
          border: "1px solid rgba(255,250,241,0.16)",
          borderRadius: "36px",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "56px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, letterSpacing: "0.08em" }}>
          {messages.brand.name.toUpperCase()}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 76,
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 0.98,
            maxWidth: "820px",
          }}
        >
          {messages.dashboard.title}
        </div>
        <div style={{ color: "#d8b89f", display: "flex", fontSize: 26 }}>
          {messages.brand.subtitle}
        </div>
      </div>
    </div>,
    size,
  );
}
