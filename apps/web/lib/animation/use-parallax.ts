"use client";

import type { RefObject } from "react";
import { gsap, ScrollTrigger } from "./gsap";
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";
import { getPrefersReducedMotion } from "./use-reduced-motion";

export function useParallax(scopeRef: RefObject<HTMLElement | null>, refreshKey?: string | number) {
  useIsomorphicLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope || getPrefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const layers = gsap.utils.toArray<HTMLElement>("[data-parallax]");

      for (const layer of layers) {
        const speed = Number(layer.dataset.parallax || "0.16");
        const distance = Math.max(12, Math.min(96, speed * 180));
        const trigger = layer.closest<HTMLElement>("[data-parallax-scene]") ?? scope;

        gsap.fromTo(
          layer,
          { y: -distance },
          {
            y: distance,
            ease: "none",
            scrollTrigger: {
              trigger,
              start: "top bottom",
              end: "bottom top",
              scrub: true
            }
          }
        );
      }
    }, scope);

    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, [scopeRef, refreshKey]);
}
