"use client";

import type { RefObject } from "react";
import { useEffect } from "react";
import { gsap, ScrollTrigger } from "./gsap";
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";
import { getPrefersReducedMotion } from "./use-reduced-motion";

type ArenaMotionOptions = {
  activeSection: string;
  dossierTab: string;
  onActiveSectionChange: (section: string) => void;
  scanStatus: "idle" | "running" | "ready" | "error";
  signalCount: number;
};

export function useArenaMotion(scopeRef: RefObject<HTMLElement | null>, options: ArenaMotionOptions) {
  useIsomorphicLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    if (getPrefersReducedMotion()) {
      gsap.set(scope.querySelectorAll("[data-hero-word], [data-hero-reveal]"), {
        autoAlpha: 1,
        clearProps: "transform,opacity,visibility"
      });
      return;
    }

    const ctx = gsap.context(() => {
      const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      heroTimeline
        .fromTo("[data-hero-reveal]", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.7 })
        .fromTo(
          "[data-hero-word]",
          { autoAlpha: 0, yPercent: 118, rotateX: -28 },
          { autoAlpha: 1, yPercent: 0, rotateX: 0, stagger: 0.075, duration: 0.88 },
          "-=0.42"
        )
        .fromTo(
          ".score-panel",
          { autoAlpha: 0, y: 28, scale: 0.96 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.78 },
          "-=0.52"
        );

      gsap.to(".ambient-scanline", {
        xPercent: 120,
        duration: 7.5,
        ease: "none",
        repeat: -1,
        yoyo: true
      });

      gsap.to(".hero-scanline", {
        xPercent: 118,
        duration: 5.4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true
      });

      gsap.to(".hero-edge-light, .alpha-edge-light", {
        xPercent: 110,
        duration: 4.2,
        ease: "none",
        repeat: -1
      });

      gsap.to(".proof-particle", {
        autoAlpha: 0.95,
        y: "random(-18, 18, 2)",
        x: "random(-16, 16, 2)",
        rotate: "random(-16, 16, 1)",
        duration: "random(2.4, 4.8, 0.2)",
        stagger: {
          each: 0.18,
          repeat: -1,
          yoyo: true
        },
        ease: "sine.inOut"
      });

      gsap.to(".chain-chip svg", {
        autoAlpha: 1,
        scale: 1.18,
        duration: 1.8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true
      });

      gsap.to(".rail-meter i", {
        backgroundPosition: "180px 0",
        duration: 2.2,
        ease: "none",
        repeat: -1
      });

      gsap.fromTo(
        ".confidence i, .spark i",
        { scaleX: 0, transformOrigin: "left center" },
        {
          scaleX: 1,
          duration: 0.95,
          ease: "power3.out",
          stagger: 0.05,
          scrollTrigger: {
            trigger: ".signal-studio",
            start: "top 82%",
            once: true
          }
        }
      );

      gsap.fromTo(
        ".metric-card",
        { x: (index) => (index % 2 === 0 ? -18 : 18) },
        {
          x: 0,
          ease: "none",
          scrollTrigger: {
            trigger: ".metric-strip",
            start: "top bottom",
            end: "bottom center",
            scrub: true
          }
        }
      );

      gsap.fromTo(
        ".alpha-pass",
        { y: 24 },
        {
          y: -18,
          ease: "none",
          scrollTrigger: {
            trigger: ".dossier",
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        }
      );

      for (const section of gsap.utils.toArray<HTMLElement>("[data-section]")) {
        ScrollTrigger.create({
          trigger: section,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => {
            if (self.isActive) {
              options.onActiveSectionChange(section.dataset.section ?? "command");
            }
          }
        });
      }
    }, scope);

    return () => ctx.revert();
  }, [scopeRef]);

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope || getPrefersReducedMotion()) return;

    const spinner = scope.querySelector(".scan-spinner");
    if (!spinner || options.scanStatus !== "running") return;

    const tween = gsap.to(spinner, {
      rotate: 360,
      duration: 0.88,
      ease: "none",
      repeat: -1
    });

    return () => {
      tween.kill();
    };
  }, [scopeRef, options.scanStatus]);

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope || getPrefersReducedMotion() || options.scanStatus !== "ready") return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".xp-burst",
        { autoAlpha: 0, y: 8, scale: 0.84 },
        { autoAlpha: 1, y: -18, scale: 1, duration: 0.36, ease: "back.out(2)" }
      );
      gsap.to(".xp-burst", {
        autoAlpha: 0,
        y: -38,
        duration: 0.42,
        ease: "power2.in",
        delay: 0.48
      });
      gsap.fromTo(
        ".achievement-toast",
        { autoAlpha: 0, y: 24, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.48, ease: "back.out(1.7)" }
      );
      gsap.to(".achievement-toast", {
        autoAlpha: 0,
        y: -18,
        duration: 0.42,
        ease: "power2.in",
        delay: 2
      });
    }, scope);

    return () => ctx.revert();
  }, [scopeRef, options.scanStatus, options.signalCount]);

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope || getPrefersReducedMotion()) return;

    gsap.to(scope.querySelectorAll(".rail-item"), {
      autoAlpha: 1,
      duration: 0.2,
      overwrite: true
    });
  }, [scopeRef, options.activeSection]);

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope || getPrefersReducedMotion()) return;

    const panel = scope.querySelector("[data-tab-panel]");
    if (!panel) return;

    const tween = gsap.fromTo(
      panel,
      { autoAlpha: 0, y: 16, scale: 0.985 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.42, ease: "power3.out" }
    );

    return () => {
      tween.kill();
    };
  }, [scopeRef, options.dossierTab]);
}
