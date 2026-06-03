"use client";

import { useEffect, useState } from "react";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

export function getPrefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia(reducedMotionQuery).matches;
}

export function useReducedMotion() {
  const [isReducedMotion, setIsReducedMotion] = useState(getPrefersReducedMotion);

  useEffect(() => {
    const media = window.matchMedia(reducedMotionQuery);
    const update = () => setIsReducedMotion(media.matches);

    update();
    media.addEventListener("change", update);

    return () => {
      media.removeEventListener("change", update);
    };
  }, []);

  return isReducedMotion;
}
