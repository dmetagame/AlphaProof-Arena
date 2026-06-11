"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/animation/use-reduced-motion";

const HEX_ALPHABET = "0123456789abcdef";
const DEFAULT_DURATION_MS = 600;
const FRAME_MS = 32;

function randomHex(length: number) {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += HEX_ALPHABET[Math.floor(Math.random() * HEX_ALPHABET.length)];
  }
  return out;
}

/**
 * Animates a hex-prefixed string by scrambling characters and progressively
 * settling each position. Returns the current displayed value and re-runs
 * whenever `target` changes.
 */
export function useHashScramble(target: string, durationMs: number = DEFAULT_DURATION_MS) {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number | null>(null);
  const startedAt = useRef<number>(0);

  useEffect(() => {
    if (!target) {
      setDisplay(target);
      return;
    }
    if (reducedMotion) {
      setDisplay(target);
      return;
    }

    const prefix = target.startsWith("0x") ? "0x" : "";
    const body = target.slice(prefix.length);
    const length = body.length;
    if (length === 0) {
      setDisplay(target);
      return;
    }

    startedAt.current = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startedAt.current;
      const progress = Math.min(1, elapsed / durationMs);
      // Eased progress so most chars settle in the second half.
      const eased = 1 - Math.pow(1 - progress, 3);
      const settledCount = Math.floor(eased * length);

      let next = "";
      for (let i = 0; i < length; i += 1) {
        next += i < settledCount ? body[i] : HEX_ALPHABET[Math.floor(Math.random() * HEX_ALPHABET.length)];
      }
      setDisplay(prefix + next);

      if (progress < 1) {
        rafRef.current = window.setTimeout(tick, FRAME_MS) as unknown as number;
      } else {
        setDisplay(target);
      }
    };

    tick();

    return () => {
      if (rafRef.current !== null) {
        clearTimeout(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [target, durationMs, reducedMotion]);

  return display;
}
