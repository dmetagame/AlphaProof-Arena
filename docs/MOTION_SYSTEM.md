# AlphaProof Arena Motion System

AlphaProof Arena uses GSAP (with `@gsap/react`), ScrollTrigger, and Lenis for its motion layer, plus a small set of CSS keyframes for lightweight ambient loops (block ticker marquee, receipt-tile cascade, score-ring sweep). Runtime animation is centralized in reusable client hooks built on `useGSAP`, so every tween and trigger is cleaned up automatically on unmount, dependency change, and fast refresh.

## Architecture

- **Provider**: `apps/web/components/motion-provider.tsx` bootstraps Lenis (lerp 0.1, smooth wheel), page fade-in, scroll-aware navbar state, and a smooth-scroll context.
- **GSAP core**: `apps/web/lib/animation/gsap.ts` registers `ScrollTrigger` and `ScrollToPlugin` once.
- **Lenis ↔ ScrollTrigger sync**: `use-lenis-scroll.ts` wires `lenis.on("scroll", ScrollTrigger.update)`, drives Lenis from the GSAP ticker (`lenis.raf(time * 1000)`), and sets `lagSmoothing(0)` so smooth scrolling and scroll triggers share one clock.

## Hooks

- `use-arena-motion.ts`: page orchestration — hero entrance timeline (y 32 → 0, 0.9s, power3.out, 0.08 stagger), reputation-row slide-ins (x -16, 0.05 stagger), alpha-card clip-path reveal with staggered inner rows, scan spinner, XP burst and achievement toast, dossier tab transitions, and active-section tracking.
- `use-card-motion.ts`: signal-card entrances via `ScrollTrigger.batch` on `[data-batch-card]` (y 40 → 0, scale 0.97 → 1, 0.7s, 0.1 stagger, once). Cards are marked `data-animated` after entering so chain-polling re-renders never replay entrances. Desktop-only hover (gated by `gsap.matchMedia` on fine pointers) lifts cards y -4 / scale 1.015 with a pseudo-element opacity glow — no box-shadow tweening. Badge pills (`[data-badge]`) pop in with `back.out(1.6)` on appearance and on status changes (keyed remounts).
- `use-counter-animation.ts`: GSAP count-up for stats; on live value changes it also pulses the new value (opacity 0.35 → 1, y 4 → 0, 0.35s). Tabular numbers in the type system prevent layout shift.
- `use-hash-scramble.ts`: hex strings scramble through random characters and settle progressively (~600 ms cubic ease) whenever the target hash changes.
- `use-reveal-animation.ts`: generic section/group reveals (groups: y 24, 0.06 stagger, once).
- `use-card-tilt.ts`: pointer tilt on `[data-tilt-card]` (fine pointers only).
- `use-magnetic-button.ts`: magnetic hover and click ripple for CTAs.
- `use-parallax.ts`: scroll-linked parallax for depth layers.
- `use-reduced-motion.ts` / `use-isomorphic-layout-effect.ts`: shared guards.

## Proof-layer components

- `components/block-stream-ticker.tsx`: marquee of the eight most recent Mantle Sepolia blocks (live RPC via `/api/chain-ticker`, 12s refresh), pause-on-hover, each entry linking to Mantle Explorer.
- `components/proof-pulse.tsx`: SVG Agent → SignalRegistry → ScoreRegistry diagram; a pulse travels the first edge when a round starts and the second when chain state shows a new resolution.
- `components/animated-number.tsx`: numeric display backed by the counter hook.

## CSS-side motion (globals.css)

- Ticker marquee, receipt-tile cascade for evidence tiles, score-ring sweep (registered `@property --score` angle transition), chip pulse, scan spinner fallback, and hover glow layers (pseudo-element opacity only).
- All CSS animations have explicit `prefers-reduced-motion: reduce` overrides.

## Accessibility and performance

- Reduced-motion users skip Lenis and all GSAP movement via `gsap.matchMedia`; content renders statically and instantly.
- Hover and tilt effects only attach on `(hover: hover) and (pointer: fine)`.
- Animations use refs, `useGSAP` contexts with `revertOnUpdate`, `quickTo()`, and direct DOM updates to avoid React re-render loops; entrances are `once: true` and guarded with `data-animated` markers so live polling cannot replay them.
- Only `transform`, `opacity`, and (for the alpha card reveal) `clip-path` are animated — no layout-triggering properties, no box-shadow tweens.
