"use client";

import type { RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "./gsap";

export function useCardTilt(scopeRef: RefObject<HTMLElement | null>, selector = "[data-tilt-card]") {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray<HTMLElement>(selector);
        const cleanups: Array<() => void> = [];

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

        return () => {
          for (const cleanup of cleanups) cleanup();
        };
      });

      return () => mm.revert();
    },
    { scope: scopeRef, dependencies: [selector], revertOnUpdate: true }
  );
}
