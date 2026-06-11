"use client";

import type { RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "./gsap";

type RevealOptions = {
  itemSelector?: string;
  groupSelector?: string;
  refreshKey?: string | number;
};

export function useRevealAnimation(scopeRef: RefObject<HTMLElement | null>, options: RevealOptions = {}) {
  const itemSelector = options.itemSelector ?? "[data-reveal]";
  const groupSelector = options.groupSelector ?? "[data-reveal-group]";

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        const revealItems = gsap.utils.toArray<HTMLElement>(itemSelector);
        const revealGroups = gsap.utils.toArray<HTMLElement>(groupSelector);
        gsap.set([...revealItems, ...revealGroups.flatMap((group) => Array.from(group.children))], {
          autoAlpha: 1,
          clearProps: "transform,opacity,visibility"
        });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        for (const item of gsap.utils.toArray<HTMLElement>(itemSelector)) {
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

        for (const group of gsap.utils.toArray<HTMLElement>(groupSelector)) {
          const children = Array.from(group.children);
          if (!children.length) continue;

          gsap.fromTo(
            children,
            { autoAlpha: 0, y: 24 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.7,
              ease: "power3.out",
              stagger: 0.06,
              scrollTrigger: {
                trigger: group,
                start: "top 86%",
                once: true
              }
            }
          );
        }
      });

      return () => mm.revert();
    },
    { scope: scopeRef, dependencies: [itemSelector, groupSelector, options.refreshKey], revertOnUpdate: true }
  );
}
