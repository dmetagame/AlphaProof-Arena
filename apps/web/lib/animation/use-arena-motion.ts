"use client";

import type { RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "./gsap";

type ArenaMotionOptions = {
  activeSection: string;
  dossierTab: string;
  onActiveSectionChange: (section: string) => void;
  scanStatus: "idle" | "running" | "ready" | "error";
  signalCount: number;
};

export function useArenaMotion(scopeRef: RefObject<HTMLElement | null>, options: ArenaMotionOptions) {
  // Mount-once scene: hero entrance, ambient loops, scroll choreography.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        const scope = scopeRef.current;
        if (!scope) return;
        gsap.set(scope.querySelectorAll("[data-hero-word], [data-hero-reveal], .alpha-pass, .agent-row"), {
          autoAlpha: 1,
          clearProps: "transform,opacity,visibility,clipPath"
        });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });

        heroTimeline
          .fromTo(
            "[data-hero-reveal]",
            { autoAlpha: 0, y: 32 },
            { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.9 }
          )
          .fromTo(
            "[data-hero-word]",
            { autoAlpha: 0, yPercent: 118, rotateX: -28 },
            { autoAlpha: 1, yPercent: 0, rotateX: 0, stagger: 0.075, duration: 0.88 },
            "-=0.62"
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

        // Reputation table rows slide in from the left.
        gsap.fromTo(
          ".agent-row",
          { x: -16, autoAlpha: 0 },
          {
            x: 0,
            autoAlpha: 1,
            duration: 0.6,
            ease: "power2.out",
            stagger: 0.05,
            scrollTrigger: {
              trigger: ".agent-panel",
              start: "top 85%",
              once: true
            }
          }
        );

        // Alpha card: clip-path reveal, then inner rows cascade.
        gsap
          .timeline({
            scrollTrigger: {
              trigger: ".alpha-pass",
              start: "top 85%",
              once: true
            }
          })
          .fromTo(
            ".alpha-pass",
            { clipPath: "inset(8% 0% 8% 0%)", autoAlpha: 0 },
            { clipPath: "inset(0% 0% 0% 0%)", autoAlpha: 1, duration: 0.7, ease: "power2.out" }
          )
          .fromTo(
            ".alpha-pass .alpha-topline, .alpha-pass h3, .alpha-pass p, .alpha-pass .alpha-stats > div",
            { autoAlpha: 0, y: 12 },
            { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.05 },
            "-=0.28"
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
      });

      return () => mm.revert();
    },
    { scope: scopeRef }
  );

  // Scan spinner while a round is starting.
  useGSAP(
    () => {
      const scope = scopeRef.current;
      if (!scope || options.scanStatus !== "running") return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const spinner = scope.querySelector(".scan-spinner");
        if (!spinner) return;
        gsap.to(spinner, { rotate: 360, duration: 0.88, ease: "none", repeat: -1 });
      });

      return () => mm.revert();
    },
    { scope: scopeRef, dependencies: [options.scanStatus], revertOnUpdate: true }
  );

  // XP burst + achievement toast when a round becomes ready.
  useGSAP(
    () => {
      const scope = scopeRef.current;
      if (!scope || options.scanStatus !== "ready") return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
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
      });

      return () => mm.revert();
    },
    { scope: scopeRef, dependencies: [options.scanStatus, options.signalCount], revertOnUpdate: true }
  );

  // Keep rail items visible when the active section changes.
  useGSAP(
    () => {
      const scope = scopeRef.current;
      if (!scope) return;

      gsap.to(scope.querySelectorAll(".rail-item"), {
        autoAlpha: 1,
        duration: 0.2,
        overwrite: true
      });
    },
    { scope: scopeRef, dependencies: [options.activeSection] }
  );

  // Dossier tab panel swap.
  useGSAP(
    () => {
      const scope = scopeRef.current;
      if (!scope) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const panel = scope.querySelector("[data-tab-panel]");
        if (!panel) return;
        gsap.fromTo(
          panel,
          { autoAlpha: 0, y: 16, scale: 0.985 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.42, ease: "power3.out" }
        );
      });

      return () => mm.revert();
    },
    { scope: scopeRef, dependencies: [options.dossierTab], revertOnUpdate: true }
  );
}
