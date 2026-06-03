"use client";

import Lenis from "lenis";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "./gsap";
import { getPrefersReducedMotion, useReducedMotion } from "./use-reduced-motion";

type ScrollTarget = number | string | HTMLElement;

type ScrollOptions = {
  offset?: number;
  duration?: number;
  immediate?: boolean;
};

export function useLenisScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const [isReady, setIsReady] = useState(false);
  const isReducedMotion = useReducedMotion();

  useEffect(() => {
    if (getPrefersReducedMotion()) {
      ScrollTrigger.refresh();
      setIsReady(true);
      return;
    }

    const lenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.08,
      wheelMultiplier: 0.92,
      anchors: {
        offset: -80,
        duration: 1.05
      }
    });

    lenisRef.current = lenis;

    const syncScrollTrigger = () => ScrollTrigger.update();
    const removeLenisListener = lenis.on("scroll", syncScrollTrigger);
    const updateLenis = (time: number) => lenis.raf(time * 1000);
    const resizeLenis = () => lenis.resize();

    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.addEventListener("refresh", resizeLenis);
    ScrollTrigger.refresh();
    setIsReady(true);

    return () => {
      removeLenisListener();
      ScrollTrigger.removeEventListener("refresh", resizeLenis);
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
      lenisRef.current = null;
      setIsReady(false);
    };
  }, []);

  const scrollTo = useCallback((target: ScrollTarget, options: ScrollOptions = {}) => {
    const offset = options.offset ?? -80;
    const duration = options.duration ?? 1.05;

    if (lenisRef.current && !isReducedMotion) {
      lenisRef.current.scrollTo(target, {
        duration,
        offset,
        immediate: options.immediate
      });
      return;
    }

    gsap.to(window, {
      duration: options.immediate || isReducedMotion ? 0 : duration,
      ease: "power3.inOut",
      scrollTo: {
        y: target,
        offsetY: Math.abs(offset)
      }
    });
  }, [isReducedMotion]);

  return {
    isReady,
    isReducedMotion,
    lenisRef,
    scrollTo
  };
}

export type LenisScrollController = ReturnType<typeof useLenisScroll>;
