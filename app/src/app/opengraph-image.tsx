import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Opportunity OS — The High-Velocity Career Intelligence Platform";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#09090b",
          backgroundImage: "radial-gradient(circle at 25px 25px, #18181b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #18181b 2%, transparent 0%)",
          backgroundSize: "100px 100px",
          padding: "80px",
          fontFamily: "sans-serif",
          color: "#fafafa",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#10b981">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px" }}>
            Opportunity OS
          </span>
          <div
            style={{
              marginLeft: "16px",
              padding: "6px 14px",
              borderRadius: "9999px",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#34d399",
              fontSize: "14px",
              fontWeight: 700,
              fontFamily: "monospace",
            }}
          >
            50+ NETWORKS
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "900px" }}>
          <h1
            style={{
              fontSize: "64px",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-2px",
              margin: 0,
              background: "linear-gradient(to right, #ffffff, #a1a1aa)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Opportunities that actually match your resume.
          </h1>
          <p style={{ fontSize: "24px", color: "#a1a1aa", margin: 0, lineHeight: 1.4 }}>
            Aggregating 50+ career networks, instant 0–100 candidate scoring, and verified recruiter contacts.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid #27272a",
            paddingTop: "28px",
          }}
        >
          <div style={{ display: "flex", gap: "24px", fontSize: "16px", color: "#71717a", fontFamily: "monospace" }}>
            <span>Greenhouse · Lever · Ashby</span>
            <span>·</span>
            <span>Hacker News · YC · Devpost</span>
          </div>
          <span style={{ fontSize: "16px", color: "#10b981", fontWeight: 700, fontFamily: "monospace" }}>
            opportunity-os.vercel.app
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
