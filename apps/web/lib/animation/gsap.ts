"use client";

import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

gsap.defaults({
  duration: 0.82,
  ease: "power3.out"
});

ScrollTrigger.config({
  ignoreMobileResize: true
});

export { gsap, ScrollToPlugin, ScrollTrigger };
