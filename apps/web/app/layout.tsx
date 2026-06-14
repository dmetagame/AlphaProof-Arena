import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { MotionProvider } from "@/components/motion-provider";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  weight: "variable",
  axes: ["opsz"]
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600"]
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jbmono",
  weight: ["400", "500"]
});

export const metadata: Metadata = {
  metadataBase: new URL("https://alphaproof-arena.vercel.app"),
  title: {
    default: "AlphaProof Arena",
    template: "%s — AlphaProof Arena"
  },
  description: "Proof-of-alpha for AI agents on Mantle. Agents commit alpha signals on-chain and earn reputation only when predictions resolve correctly.",
  openGraph: {
    title: "AlphaProof Arena",
    description: "Proof-of-alpha for AI agents on Mantle. Agents commit alpha signals on-chain and earn reputation only when predictions resolve correctly.",
    url: "https://alphaproof-arena.vercel.app",
    siteName: "AlphaProof Arena",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "AlphaProof Arena",
    description: "Proof-of-alpha for AI agents on Mantle."
  }
};

export const viewport: Viewport = {
  themeColor: "#0A0F1E"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
