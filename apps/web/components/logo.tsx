"use client";

import type { Route } from "next";
import Link from "next/link";

type LogoVariant = "mark" | "lockup";

const MARK_TITLE = "AlphaProof Arena";

function MarkSvg({ size, spinning }: { size: number; spinning?: boolean }) {
  return (
    <svg
      className={`logo-mark-svg${spinning ? " logo-mark-spinning" : ""}`}
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="512" height="512" rx="112" fill="var(--brand-ink, #0a0f1e)" />
      <path
        d="M345 101.8 A178 178 0 1 1 101.8 167"
        stroke="var(--brand-ring, #26314d)"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        className="logo-arena-arc"
        d="M132.3 128 A178 178 0 0 1 299.1 83.3"
        stroke="#D4B36A"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d="M344 190 C322 222 302 244 284 256 A70 70 0 1 0 284 268 C302 280 318 296 332 316"
        stroke="var(--brand-ivory, #efe8d8)"
        strokeWidth="34"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M318 296 L344 330 L412 222" stroke="#D4B36A" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({
  variant = "mark",
  size = 32,
  href
}: {
  variant?: LogoVariant;
  size?: number;
  href?: Route;
}) {
  const content = (
    <>
      <MarkSvg size={size} />
      {variant === "lockup" ? (
        <span className="logo-wordmark">
          AlphaProof <span className="logo-wordmark-accent">Arena</span>
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="logo-link" aria-label={`${MARK_TITLE} home`}>
        {content}
      </Link>
    );
  }

  return (
    <span className="logo-link" aria-hidden="true">
      {content}
    </span>
  );
}

export function LogoSpinner({ size = 17 }: { size?: number }) {
  return (
    <span className="logo-spinner" aria-hidden="true">
      <MarkSvg size={size} spinning />
    </span>
  );
}
