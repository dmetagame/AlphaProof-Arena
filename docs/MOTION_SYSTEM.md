# AlphaProof Arena Motion System

AlphaProof Arena uses GSAP and Lenis for its premium Web3 arena motion layer. CSS keyframe animations are intentionally avoided; runtime animation is centralized in reusable client hooks.

## Created Files

- `apps/web/components/motion-provider.tsx`: site-wide client motion provider, Lenis bootstrapping, page fade-in, scroll-aware navbar state, and smooth-scroll context.
- `apps/web/components/animated-number.tsx`: reusable numeric display component backed by GSAP count-up animation.
- `apps/web/lib/animation/gsap.ts`: centralized GSAP plugin registration for `ScrollTrigger` and `ScrollToPlugin`.
- `apps/web/lib/animation/use-lenis-scroll.ts`: Lenis smooth-scroll hook integrated with GSAP ticker and `ScrollTrigger.update()`.
- `apps/web/lib/animation/use-reveal-animation.ts`: section/card reveal hook using `ScrollTrigger`.
- `apps/web/lib/animation/use-parallax.ts`: scroll-linked parallax hook for ambient and hero depth layers.
- `apps/web/lib/animation/use-magnetic-button.ts`: magnetic hover and ripple hook for CTAs and proof actions.
- `apps/web/lib/animation/use-counter-animation.ts`: direct-DOM numeric count-up hook for reputation, stats, and confidence values.
- `apps/web/lib/animation/use-card-tilt.ts`: pointer tilt hook for arena cards.
- `apps/web/lib/animation/use-arena-motion.ts`: page-specific orchestration for hero entrance, particles, scan spinner, XP burst, achievement toast, progress bars, tab transitions, active section state, and scroll-linked story motion.
- `apps/web/lib/animation/use-reduced-motion.ts`: shared `prefers-reduced-motion` detection.
- `apps/web/lib/animation/use-isomorphic-layout-effect.ts`: SSR-safe layout effect helper.

## Modified Files

- `apps/web/app/layout.tsx`: wraps the app with `MotionProvider`.
- `apps/web/app/page.tsx`: adds motion refs, active-section navigation, animated counters, hero word masks, magnetic controls, tilt cards, parallax layers, XP/achievement UI, and tab-panel targets.
- `apps/web/app/globals.css`: removes CSS keyframe animation usage and adds static styling for GSAP-controlled layers, particles, ripple surfaces, hero masks, reduced-motion fallbacks, and responsive motion-safe layout.
- `apps/web/package.json`: adds `gsap` and `lenis`.
- `package-lock.json`: locks GSAP and Lenis dependency versions.

## Accessibility And Performance

- Reduced-motion users skip Lenis and GSAP-driven movement, with content rendered statically.
- Animations use refs, `gsap.context()`, `quickTo()`, and direct DOM updates to avoid React re-render loops.
- Lenis is driven by the GSAP ticker, so `ScrollTrigger` and smooth scrolling share one animation clock.
- CSS keyframes and transitions were removed so motion behavior remains centralized and reversible.
