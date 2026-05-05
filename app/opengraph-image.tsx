/**
 * Default OG image for NexCart.
 * Rendered via Next.js ImageResponse — no static PNG required.
 * Access at /opengraph-image
 */
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt     = "NexCart — Smart Shopping. Modern Services.";
export const size    = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width:          "100%",
          height:         "100%",
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          background:     "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #312e81 100%)",
          fontFamily:     "system-ui, sans-serif",
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width:          80,
            height:         80,
            background:     "#3b82f6",
            borderRadius:   20,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontSize:       44,
            fontWeight:     900,
            color:          "white",
            marginBottom:   28,
          }}
        >
          N
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize:    72,
            fontWeight:  900,
            color:       "white",
            letterSpacing: "-2px",
            lineHeight:  1,
          }}
        >
          Nex<span style={{ color: "#60a5fa" }}>Cart</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize:    28,
            color:       "#94a3b8",
            marginTop:   16,
            letterSpacing: "0.5px",
          }}
        >
          Smart Shopping. Modern Services.
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position:   "absolute",
            bottom:     40,
            fontSize:   18,
            color:      "#64748b",
            letterSpacing: "1px",
          }}
        >
          nexcart.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
