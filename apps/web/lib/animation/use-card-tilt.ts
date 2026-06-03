"use client";

import type { RefObject } from "react";
import { gsap } from "./gsap";
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";
import { getPrefersReducedMotion } from "./use-reduced-motion";

export function useCardTilt(scopeRef: RefObject<HTMLElement | null>, selector = "[data-tilt-card]") {
  useIsomorphicLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope || getPrefersReducedMotion()) return;

    const cleanups: Array<() => void> = [];
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(selector);

      for (const card of cards) {
        const setRotateX = gsap.quickTo(card, "rotateX", { duration: 0.42, ease: "power3.out" });
        const setRotateY = gsap.quickTo(card, "rotateY", { duration: 0.42, ease: "power3.out" });
        const setZ = gsap.quickTo(card, "z", { duration: 0.42, ease: "power3.out" });

        const move = (event: PointerEvent) => {
          const bounds = card.getBoundingClientRect();
          const x = (event.clientX - bounds.left) / bounds.width - 0.5;
          const y = (event.clientY - bounds.top) / bounds.height - 0.5;

          setRotateX(y * -7);
          setRotateY(x * 7);
          setZ(18);
        };

        const leave = () => {
          setRotateX(0);
          setRotateY(0);
          setZ(0);
        };

        card.addEventListener("pointermove", move);
        card.addEventListener("pointerleave", leave);

        cleanups.push(() => {
          card.removeEventListener("pointermove", move);
          card.removeEventListener("pointerleave", leave);
        });
      }
    }, scope);

    return () => {
      for (const cleanup of cleanups) cleanup();
      ctx.revert();
    };
  }, [scopeRef, selector]);
}
