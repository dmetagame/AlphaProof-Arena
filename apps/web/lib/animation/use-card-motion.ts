"use client";

import type { RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "./gsap";

type CardMotionOptions = {
  /** Changes whenever cards/badges may have been added or remounted. */
  refreshKey?: string | number;
};

/**
 * Card-level motion:
 * - Entrance: ScrollTrigger.batch on [data-batch-card]; each card is marked
 *   data-animated after entering so polling re-renders never replay it.
 * - Hover (fine pointers only): GSAP lift y/scale; glow handled by a CSS
 *   pseudo-element opacity toggle via the `is-hover` class.
 * - Badges: [data-badge] pops in with back.out on first appearance; keyed
 *   remounts (status changes) pop again because the marker attribute resets.
 */
export function useCardMotion(scopeRef: RefObject<HTMLElement | null>, options: CardMotionOptions = {}) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        const pending = gsap.utils.toArray<HTMLElement>(
          "[data-batch-card]:not([data-animated]), [data-badge]:not([data-badge-animated])"
        );
        for (const el of pending) {
          el.setAttribute(el.hasAttribute("data-batch-card") ? "data-animated" : "data-badge-animated", "true");
        }
        gsap.set(pending, { autoAlpha: 1, clearProps: "transform,opacity,visibility" });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const freshCards = gsap.utils.toArray<HTMLElement>("[data-batch-card]:not([data-animated])");
        if (freshCards.length > 0) {
          gsap.set(freshCards, { autoAlpha: 0, y: 40, scale: 0.97 });
          ScrollTrigger.batch(freshCards, {
            start: "top 85%",
            once: true,
            onEnter: (batch) => {
              for (const el of batch) el.setAttribute("data-animated", "true");
              gsap.to(batch, {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                duration: 0.7,
                ease: "power2.out",
                stagger: 0.1,
                overwrite: true
              });
            }
          });
          ScrollTrigger.refresh();
        }

        const freshBadges = gsap.utils.toArray<HTMLElement>("[data-badge]:not([data-badge-animated])");
        for (const badge of freshBadges) {
          badge.setAttribute("data-badge-animated", "true");
          gsap.fromTo(
            badge,
            { scale: 0.8, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, duration: 0.45, ease: "back.out(1.6)", overwrite: true }
          );
        }
      });

      mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-batch-card]");
        const cleanups: Array<() => void> = [];

        for (const card of cards) {
          const enter = () => {
            card.classList.add("is-hover");
            gsap.to(card, { y: -4, scale: 1.015, duration: 0.3, ease: "power2.out", overwrite: "auto" });
          };
          const leave = () => {
            card.classList.remove("is-hover");
            gsap.to(card, { y: 0, scale: 1, duration: 0.3, ease: "power2.out", overwrite: "auto" });
          };

          card.addEventListener("pointerenter", enter);
          card.addEventListener("pointerleave", leave);
          cleanups.push(() => {
            card.removeEventListener("pointerenter", enter);
            card.removeEventListener("pointerleave", leave);
            card.classList.remove("is-hover");
          });
        }

        return () => {
          for (const cleanup of cleanups) cleanup();
        };
      });

      return () => mm.revert();
    },
    { scope: scopeRef, dependencies: [options.refreshKey], revertOnUpdate: true }
  );
}
