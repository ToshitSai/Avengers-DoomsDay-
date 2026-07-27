"use client";

import { TIMELINE_UNITS } from "@/lib/constants";

type LenisLike = {
  scrollTo: (target: number, options?: { duration?: number; easing?: (t: number) => number; immediate?: boolean }) => void;
};

type WindowWithNavigation = Window & {
  __lenis?: LenisLike;
  __sectionNavTimer?: number;
};

export type SectionTarget = "overview" | "universe" | "heroes" | "trailers" | "tickets";

export const SECTION_NAV = [
  { label: "Overview", target: "overview" },
  { label: "Universe", target: "universe" },
  { label: "Heroes", target: "heroes" },
  { label: "Trailers", target: "trailers" },
  { label: "Tickets", target: "tickets" },
] as const;

const TARGET_UNITS: Record<SectionTarget, number> = {
  overview: 7.9,
  universe: 16.9,
  heroes: 11.9,
  trailers: 24.6,
  tickets: 47.8,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function scrollTopFromTimelineUnit(unit: number) {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  return clamp((unit / TIMELINE_UNITS) * maxScroll, 0, maxScroll);
}

export function goToSection(target: SectionTarget) {
  if (typeof window === "undefined") return;

  const w = window as WindowWithNavigation;
  const top = scrollTopFromTimelineUnit(TARGET_UNITS[target]);
  window.dispatchEvent(new CustomEvent("section-transition"));

  window.clearTimeout(w.__sectionNavTimer);
  w.__sectionNavTimer = window.setTimeout(() => {
    if (w.__lenis) {
      w.__lenis.scrollTo(top, { duration: 1.25, easing: easeInOutCubic });
      return;
    }
    window.scrollTo({ top, behavior: "smooth" });
  }, 130);
}
