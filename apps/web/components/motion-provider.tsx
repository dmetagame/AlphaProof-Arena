"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo } from "react";
import { gsap, ScrollTrigger } from "@/lib/animation/gsap";
import { useLenisScroll } from "@/lib/animation/use-lenis-scroll";

type ScrollTarget = number | string | HTMLElement;

type MotionContextValue = {
  isReducedMotion: boolean;
  scrollTo: (target: ScrollTarget, options?: { offset?: number; duration?: number; immediate?: boolean }) => void;
};

const MotionContext = createContext<MotionContextValue | null>(null);

export function MotionProvider({ children }: { children: ReactNode }) {
  const { isReducedMotion, scrollTo } = useLenisScroll();

  useEffect(() => {
    if (isReducedMotion) {
      document.documentElement.classList.add("motion-reduced");
      document.documentElement.classList.remove("motion-ready", "navbar-compact");

      return () => {
        document.documentElement.classList.remove("motion-reduced");
      };
    }

    document.documentElement.classList.add("motion-ready");
    document.documentElement.classList.remove("motion-reduced");

    const intro = gsap.fromTo(
      document.body,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.42, ease: "power2.out", clearProps: "opacity,visibility" }
    );

    const navbarTrigger = ScrollTrigger.create({
      start: 12,
      end: 999999,
      onUpdate: (self) => {
        document.documentElement.classList.toggle("navbar-compact", self.scroll() > 12);
      }
    });

    return () => {
      intro.kill();
      navbarTrigger.kill();
      document.documentElement.classList.remove("motion-ready", "navbar-compact");
    };
  }, [isReducedMotion]);

  const value = useMemo(
    () => ({
      isReducedMotion,
      scrollTo
    }),
    [isReducedMotion, scrollTo]
  );

  return (
    <MotionContext.Provider value={value}>
      {children}
    </MotionContext.Provider>
  );
}

export function useMotion() {
  const context = useContext(MotionContext);

  if (!context) {
    throw new Error("useMotion must be used inside MotionProvider");
  }

  return context;
}
