"use client";

import type { RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "./gsap";

export function useParallax(scopeRef: RefObject<HTMLElement | null>, refreshKey?: string | number) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const scope = scopeRef.current;
        const layers = gsap.utils.toArray<HTMLElement>("[data-parallax]");

        for (const layer of layers) {
          const speed = Number(layer.dataset.parallax || "0.16");
          const distance = Math.max(12, Math.min(96, speed * 180));
          const trigger = layer.closest<HTMLElement>("[data-parallax-scene]") ?? scope ?? undefined;

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

        ScrollTrigger.refresh();
      });

      return () => mm.revert();
    },
    { scope: scopeRef, dependencies: [refreshKey], revertOnUpdate: true }
  );
}
