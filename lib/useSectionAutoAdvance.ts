"use client";

import { useEffect, useRef } from "react";

type LenisLike = {
  scrollTo: (
    target: number,
    options?: {
      duration?: number;
      easing?: (t: number) => number;
      immediate?: boolean;
      lock?: boolean;
      force?: boolean;
    },
  ) => void;
};

type WindowWithLenis = Window & {
  __lenis?: LenisLike;
  __cinematicAutopilot?: boolean;
};

const MIN_GESTURE_DELTA = 8;
const TOUCH_GESTURE_DELTA = 34;
const MIN_DURATION = 10;
const FULL_RUN_DURATION = 58;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const steady = (t: number) => t;

function maxScroll() {
  return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
}

function stopEvent(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function scrollToPosition(target: number, duration: number) {
  const lenis = (window as WindowWithLenis).__lenis;
  if (lenis) {
    lenis.scrollTo(target, {
      duration,
      easing: steady,
      lock: true,
      force: true,
    });
    return;
  }

  window.scrollTo({ top: target, behavior: "smooth" });
}

function stopAutoScroll() {
  const lenis = (window as WindowWithLenis).__lenis;
  if (lenis) {
    lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    return;
  }

  window.scrollTo({ top: window.scrollY });
}

function targetForDirection(direction: 1 | -1) {
  const max = maxScroll();
  const current = window.scrollY;
  if (direction > 0) return max;
  return current > window.innerHeight * 0.35 ? 0 : max;
}

function durationForTarget(target: number) {
  const max = maxScroll();
  const distance = Math.abs(target - window.scrollY);
  const progress = clamp(distance / max, 0, 1);
  return clamp(FULL_RUN_DURATION * progress, MIN_DURATION, FULL_RUN_DURATION);
}

export function useSectionAutoAdvance() {
  const runningRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    const w = window as WindowWithLenis;

    const clearRun = () => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      runningRef.current = false;
      w.__cinematicAutopilot = false;
    };

    const startRun = (direction: 1 | -1) => {
      if (runningRef.current) return true;

      const target = targetForDirection(direction);
      if (Math.abs(target - window.scrollY) < 12) return false;

      const duration = durationForTarget(target);
      runningRef.current = true;
      w.__cinematicAutopilot = true;
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(clearRun, duration * 1000 + 500);
      scrollToPosition(target, duration);
      return true;
    };

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < MIN_GESTURE_DELTA) return;
      const handled = startRun(event.deltaY > 0 ? 1 : -1);
      if (handled) stopEvent(event);
    };

    const onTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (event: TouchEvent) => {
      const startY = touchStartYRef.current;
      const currentY = event.touches[0]?.clientY;
      if (startY == null || currentY == null) return;

      const delta = startY - currentY;
      if (Math.abs(delta) < TOUCH_GESTURE_DELTA) return;
      touchStartYRef.current = currentY;

      const handled = startRun(delta > 0 ? 1 : -1);
      if (handled) stopEvent(event);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (runningRef.current) {
          clearRun();
          stopAutoScroll();
          stopEvent(event);
        }
        return;
      }

      if (["ArrowDown", "PageDown", " ", "Enter"].includes(event.key)) {
        if (startRun(1)) stopEvent(event);
        return;
      }

      if (["ArrowUp", "PageUp", "Home"].includes(event.key)) {
        if (startRun(-1)) stopEvent(event);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    window.addEventListener("keydown", onKeyDown, { passive: false, capture: true });

    return () => {
      clearRun();
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("touchstart", onTouchStart, { capture: true });
      window.removeEventListener("touchmove", onTouchMove, { capture: true });
      window.removeEventListener("keydown", onKeyDown, { capture: true });
    };
  }, []);
}
