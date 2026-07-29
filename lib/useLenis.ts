"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";

/**
 * Smooth-scroll spine. The whole experience is scroll-driven, so Lenis runs from
 * load and feeds GSAP's ticker + ScrollTrigger. Its inertia is what makes the
 * scrubbed trailers glide instead of snap.
 */
export function useLenis() {
  const ref = useRef<Lenis | null>(null);

  useEffect(() => {
    const previousScrollRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const lenis = new Lenis({
      duration: 0.95,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      wheelMultiplier: 0.82,
      touchMultiplier: 1.05,
      lerp: 0.13,
    });
    ref.current = lenis;
    lenis.scrollTo(0, { immediate: true, force: true });
    (window as unknown as Record<string, unknown>).__lenis = lenis;
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as Record<string, unknown>).__lenis = lenis;
    }

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      history.scrollRestoration = previousScrollRestoration;
      delete (window as unknown as Record<string, unknown>).__lenis;
      ref.current = null;
    };
  }, []);

  return ref;
}
