"use client";

import { useRef } from "react";
import { gsap } from "./gsap";
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";
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

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const from = previousValueRef.current;
    previousValueRef.current = value;

    if (getPrefersReducedMotion()) {
      element.textContent = formatCounterValue(value, options);
      return;
    }

    const state = { value: from };
    const ctx = gsap.context(() => {
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
    }, element);

    return () => ctx.revert();
  }, [value, options.prefix, options.suffix, options.decimals, options.duration]);

  return ref;
}
