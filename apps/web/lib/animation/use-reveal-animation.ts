"use client";

import type { RefObject } from "react";
import { gsap, ScrollTrigger } from "./gsap";
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";
import { getPrefersReducedMotion } from "./use-reduced-motion";

type RevealOptions = {
  itemSelector?: string;
  groupSelector?: string;
  refreshKey?: string | number;
};

export function useRevealAnimation(scopeRef: RefObject<HTMLElement | null>, options: RevealOptions = {}) {
  const itemSelector = options.itemSelector ?? "[data-reveal]";
  const groupSelector = options.groupSelector ?? "[data-reveal-group]";

  useIsomorphicLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const ctx = gsap.context(() => {
      const revealItems = gsap.utils.toArray<HTMLElement>(itemSelector);
      const revealGroups = gsap.utils.toArray<HTMLElement>(groupSelector);

      if (getPrefersReducedMotion()) {
        gsap.set([...revealItems, ...revealGroups.flatMap((group) => Array.from(group.children))], {
          autoAlpha: 1,
          clearProps: "transform,opacity,visibility"
        });
        return;
      }

      for (const item of revealItems) {
        gsap.fromTo(
          item,
          { autoAlpha: 0, y: 34, scale: 0.985 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.78,
            ease: "power3.out",
            scrollTrigger: {
              trigger: item,
              start: "top 88%",
              once: true
            }
          }
        );
      }

      for (const group of revealGroups) {
        const children = Array.from(group.children);
        if (!children.length) continue;

        gsap.fromTo(
          children,
          { autoAlpha: 0, y: 28, scale: 0.975 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.72,
            ease: "power3.out",
            stagger: 0.075,
            scrollTrigger: {
              trigger: group,
              start: "top 86%",
              once: true
            }
          }
        );
      }
    }, scope);

    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, [scopeRef, itemSelector, groupSelector, options.refreshKey]);
}
