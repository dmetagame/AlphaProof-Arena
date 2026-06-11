"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "./gsap";
import { getPrefersReducedMotion } from "./use-reduced-motion";

type CounterOptions = {
  prefix?: string;
  suffix?: string;
  decimals?: number;
  from?: number;
  duration?: number;
};

export function formatCounterValue(value: number, options: CounterOptions = {}) {
  const decimals = options.decimals ?? 0;
  const rounded = value.toLocaleString("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  });

  return `${options.prefix ?? ""}${rounded}${options.suffix ?? ""}`;
}

export function useCounterAnimation(value: number, options: CounterOptions = {}) {
  const ref = useRef<HTMLElement | null>(null);
  const previousValueRef = useRef(options.from ?? 0);
  const hasAnimatedRef = useRef(false);

  useGSAP(
    () => {
      const element = ref.current;
      if (!element) return;

      const from = previousValueRef.current;
      previousValueRef.current = value;
      const isUpdate = hasAnimatedRef.current && from !== value;
      hasAnimatedRef.current = true;

      if (getPrefersReducedMotion()) {
        element.textContent = formatCounterValue(value, options);
        return;
      }

      const state = { value: from };
      gsap.to(state, {
        value,
        duration: options.duration ?? 1.18,
        ease: "power3.out",
        onUpdate: () => {
          element.textContent = formatCounterValue(state.value, options);
        },
        onComplete: () => {
          element.textContent = formatCounterValue(value, options);
        },
        scrollTrigger: {
          trigger: element,
          start: "top 92%",
          once: true
        }
      });

      // Live-update flash: pulse the value when it changes after first paint.
      if (isUpdate) {
        gsap.fromTo(
          element,
          { autoAlpha: 0.35, y: 4 },
          { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out", overwrite: "auto" }
        );
      }
    },
    { dependencies: [value, options.prefix, options.suffix, options.decimals, options.duration], revertOnUpdate: true }
  );

  return ref;
}
