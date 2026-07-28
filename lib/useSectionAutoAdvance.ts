"use client";

import { useEffect, useRef } from "react";
import { TIMELINE_UNITS } from "@/lib/constants";

type LenisLike = {
  scrollTo: (target: number, options?: { duration?: number; easing?: (t: number) => number; immediate?: boolean }) => void;
};

type WindowWithLenis = Window & { __lenis?: LenisLike };

type AutoRange = {
  start: number;
  end: number;
  minDuration: number;
  maxDuration: number;
};

const AUTO_RANGES: AutoRange[] = [
  { start: 1.28, end: 3.95, minDuration: 2.8, maxDuration: 4.4 }, // Marvel intro video
  { start: 7.65, end: 11.35, minDuration: 3.4, maxDuration: 5.4 }, // hero video
  { start: 11.65, end: 16.55, minDuration: 4.2, maxDuration: 6.6 }, // character cards
  { start: 24.35, end: 31.45, minDuration: 5.2, maxDuration: 8.2 }, // horizontal reel
  { start: 31.55, end: 38.55, minDuration: 5.2, maxDuration: 8.6 }, // finale video
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function maxScroll() {
  return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
}

function timelineUnitFromScroll() {
  return (window.scrollY / maxScroll()) * TIMELINE_UNITS;
}

function scrollTopFromTimelineUnit(unit: number) {
  return clamp((unit / TIMELINE_UNITS) * maxScroll(), 0, maxScroll());
}

function currentRange(unit: number) {
  return AUTO_RANGES.find(({ start, end }) => unit >= start && unit <= end) ?? null;
}

function rangeTarget(range: AutoRange, unit: number, direction: 1 | -1) {
  const target = direction > 0 ? range.end : range.start;
  const remaining = Math.abs(target - unit);
  if (remaining < 0.12) return null;
  return target;
}

function durationFor(range: AutoRange, unit: number, target: number) {
  const rangeSize = Math.max(0.001, range.end - range.start);
  const progress = Math.abs(target - unit) / rangeSize;
  return clamp(range.maxDuration * progress, range.minDuration, range.maxDuration);
}

function scrollToUnit(unit: number, duration: number) {
  const target = scrollTopFromTimelineUnit(unit);
  const lenis = (window as WindowWithLenis).__lenis;
  if (lenis) {
    lenis.scrollTo(target, { duration, easing: easeInOutCubic });
    return;
  }
  window.scrollTo({ top: target, behavior: "smooth" });
}

function stopAutoScroll() {
  const lenis = (window as WindowWithLenis).__lenis;
  if (lenis) {
    lenis.scrollTo(window.scrollY, { immediate: true });
    return;
  }
  window.scrollTo({ top: window.scrollY });
}

export function useSectionAutoAdvance() {
  const autoUntilRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    const clearAuto = () => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      autoUntilRef.current = 0;
    };

    const interruptAuto = () => {
      clearAuto();
      stopAutoScroll();
    };

    const startAuto = (direction: 1 | -1) => {
      const now = performance.now();
      if (autoUntilRef.current > now) {
        interruptAuto();
        return false;
      }

      const unit = timelineUnitFromScroll();
      const range = currentRange(unit);
      if (!range) return false;

      const target = rangeTarget(range, unit, direction);
      if (target == null) return false;

      const duration = durationFor(range, unit, target);
      autoUntilRef.current = now + duration * 1000 + 250;
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(clearAuto, duration * 1000 + 300);
      scrollToUnit(target, duration);
      return true;
    };

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 8) return;
      const handled = startAuto(event.deltaY > 0 ? 1 : -1);
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

      const handled = startAuto(delta > 0 ? 1 : -1);
      if (handled) {
        touchStartYRef.current = currentY;
        event.preventDefault();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      clearAuto();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);
}
