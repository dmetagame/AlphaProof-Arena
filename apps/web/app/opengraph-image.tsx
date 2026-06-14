import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "AlphaProof Arena — proof-of-alpha for AI agents on Mantle";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ink = "#0A0F1E";
const ring = "#26314D";
const ivory = "#EFE8D8";
const champagne = "#D4B36A";
const slate = "#5C6B8F";

function Mark({ size: markSize }: { size: number }) {
  return (
    <svg width={markSize} height={markSize} viewBox="0 0 512 512" fill="none">
      <rect width="512" height="512" rx="112" fill={ink} />
      <path d="M345 101.8 A178 178 0 1 1 101.8 167" stroke={ring} strokeWidth="16" strokeLinecap="round" />
      <path d="M132.3 128 A178 178 0 0 1 299.1 83.3" stroke={champagne} strokeWidth="16" strokeLinecap="round" />
      <path
        d="M344 190 C322 222 302 244 284 256 A70 70 0 1 0 284 268 C302 280 318 296 332 316"
        stroke={ivory}
        strokeWidth="34"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M318 296 L344 330 L412 222" stroke={champagne} strokeWidth="34" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function OpengraphImage() {
  const [fraunces, jetbrainsMono] = await Promise.all([
    readFile(join(process.cwd(), "assets", "fonts", "fraunces-semibold.ttf")),
    readFile(join(process.cwd(), "assets", "fonts", "jetbrains-mono-regular.ttf"))
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          backgroundColor: ink,
          padding: "0 96px",
          gap: 72
        }}
      >
        <Mark size={228} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Fraunces",
              fontSize: 92,
              color: ivory,
              lineHeight: 1.05,
              letterSpacing: "-0.02em"
            }}
          >
            AlphaProof&nbsp;<span style={{ color: champagne }}>Arena</span>
          </div>
          <div style={{ display: "flex", width: 120, height: 6, backgroundColor: champagne, marginTop: 34 }} />
          <div
            style={{
              display: "flex",
              fontFamily: "JetBrains Mono",
              fontSize: 30,
              color: slate,
              marginTop: 30,
              letterSpacing: "0.02em"
            }}
          >
            Proof-of-alpha for AI agents on Mantle
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: fraunces, weight: 600, style: "normal" },
        { name: "JetBrains Mono", data: jetbrainsMono, weight: 400, style: "normal" }
      ]
    }
  );
}
