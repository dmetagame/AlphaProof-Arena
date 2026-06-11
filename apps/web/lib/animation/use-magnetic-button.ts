"use client";

import type { RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "./gsap";

type MagneticOptions = {
  selector?: string;
  strength?: number;
};

export function useMagneticButton(scopeRef: RefObject<HTMLElement | null>, options: MagneticOptions = {}) {
  const selector = options.selector ?? "[data-magnetic]";
  const strength = options.strength ?? 0.24;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const targets = gsap.utils.toArray<HTMLElement>(selector);
        const cleanups: Array<() => void> = [];

        for (const target of targets) {
          const setX = gsap.quickTo(target, "x", { duration: 0.34, ease: "power3.out" });
          const setY = gsap.quickTo(target, "y", { duration: 0.34, ease: "power3.out" });
          const setScale = gsap.quickTo(target, "scale", { duration: 0.24, ease: "power3.out" });

          const move = (event: PointerEvent) => {
            const bounds = target.getBoundingClientRect();
            setX((event.clientX - bounds.left - bounds.width / 2) * strength);
            setY((event.clientY - bounds.top - bounds.height / 2) * strength);
          };

          const enter = () => setScale(1.035);
          const leave = () => {
            setX(0);
            setY(0);
            setScale(1);
          };

          const click = (event: PointerEvent) => {
            const bounds = target.getBoundingClientRect();
            const ripple = document.createElement("span");
            ripple.className = "motion-ripple";
            ripple.style.left = `${event.clientX - bounds.left}px`;
            ripple.style.top = `${event.clientY - bounds.top}px`;
            target.appendChild(ripple);

            gsap.fromTo(
              ripple,
              { autoAlpha: 0.42, scale: 0 },
              {
                autoAlpha: 0,
                scale: 2.6,
                duration: 0.62,
                ease: "power2.out",
                onComplete: () => ripple.remove()
              }
            );
          };

          target.addEventListener("pointerenter", enter);
          target.addEventListener("pointermove", move);
          target.addEventListener("pointerleave", leave);
          target.addEventListener("pointerup", click);

          cleanups.push(() => {
            target.removeEventListener("pointerenter", enter);
            target.removeEventListener("pointermove", move);
            target.removeEventListener("pointerleave", leave);
            target.removeEventListener("pointerup", click);
          });
        }

        return () => {
          for (const cleanup of cleanups) cleanup();
        };
      });

      return () => mm.revert();
    },
    { scope: scopeRef, dependencies: [selector, strength], revertOnUpdate: true }
  );
}
