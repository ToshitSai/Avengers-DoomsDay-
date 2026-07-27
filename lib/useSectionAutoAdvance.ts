"use client";

import { useEffect, useRef } from "react";
import { TIMELINE_UNITS } from "@/lib/constants";

type LenisLike = {
  scrollTo: (target: number, options?: { duration?: number; easing?: (t: number) => number; immediate?: boolean }) => void;
};

type WindowWithLenis = Window & { __lenis?: LenisLike };

const HEAVY_SECTION_POINTS = [
  1.4, 2.2, 3.0, 3.8,
  7.8, 8.65, 9.5, 10.35, 11.2,
  11.8, 12.6, 13.35, 14.1, 14.85, 15.6, 16.35,
  24.5, 26.0, 27.5, 29.0, 30.5, 31.3,
  31.7, 33.05, 34.4, 35.75, 37.1, 38.4,
] as const;

const HEAVY_RANGES = [
  [1.28, 3.95],
  [7.65, 11.35],
  [11.65, 16.55],
  [24.35, 31.45],
  [31.55, 38.55],
] as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function timelineUnitFromScroll() {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  return (window.scrollY / maxScroll) * TIMELINE_UNITS;
}

function scrollTopFromTimelineUnit(unit: number) {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  return clamp((unit / TIMELINE_UNITS) * maxScroll, 0, maxScroll);
}

function isHeavyUnit(unit: number) {
  return HEAVY_RANGES.some(([start, end]) => unit >= start && unit <= end);
}

function nextPoint(unit: number, direction: 1 | -1) {
  if (direction > 0) {
    return HEAVY_SECTION_POINTS.find((point) => point > unit + 0.08) ?? null;
  }

  for (let i = HEAVY_SECTION_POINTS.length - 1; i >= 0; i--) {
    const point = HEAVY_SECTION_POINTS[i];
    if (point < unit - 0.08) return point;
  }
  return null;
}

function scrollToUnit(unit: number) {
  const target = scrollTopFromTimelineUnit(unit);
  const lenis = (window as WindowWithLenis).__lenis;
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.05, easing: easeOutCubic });
    return;
  }
  window.scrollTo({ top: target, behavior: "smooth" });
}

export function useSectionAutoAdvance() {
  const lockUntilRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    const step = (direction: 1 | -1) => {
      const now = performance.now();
      if (now < lockUntilRef.current) return false;

      const unit = timelineUnitFromScroll();
      if (!isHeavyUnit(unit)) return false;

      const target = nextPoint(unit, direction);
      if (target == null || !isHeavyUnit(target)) return false;

      lockUntilRef.current = now + 880;
      scrollToUnit(target);
      return true;
    };

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 8) return;
      const handled = step(event.deltaY > 0 ? 1 : -1);
      if (handled) event.preventDefault();
    };

    const onTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (event: TouchEvent) => {
      const startY = touchStartYRef.current;
      const currentY = event.touches[0]?.clientY;
      if (startY == null || currentY == null) return;

      const delta = startY - currentY;
      if (Math.abs(delta) < 42) return;

      const handled = step(delta > 0 ? 1 : -1);
      if (handled) {
        touchStartYRef.current = currentY;
        event.preventDefault();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);
}
