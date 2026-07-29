"use client";

import { useEffect, useRef } from "react";
import { TIMELINE_UNITS } from "@/lib/constants";

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
const MIN_DURATION = 5;
const HERO_VIDEO_START_UNIT = 7.8;
const FIRST_VIDEO_HANDOFF_DURATION = 18;
const HERO_VIDEO_RUN_DURATION = 12.4;
const OPENING_STOP_UNIT = 11.58;
const OPENING_RUN_DURATION = FIRST_VIDEO_HANDOFF_DURATION + HERO_VIDEO_RUN_DURATION;
const FINALE_START_UNIT = 31.55;
const FINALE_STOP_UNIT = 38.52;
const FINALE_RUN_DURATION = 27;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const steady = (t: number) => t;

function maxScroll() {
  return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
}

function timelineUnitFromScroll() {
  return (window.scrollY / maxScroll()) * TIMELINE_UNITS;
}

function scrollTopFromTimelineUnit(unit: number) {
  return clamp((unit / TIMELINE_UNITS) * maxScroll(), 0, maxScroll());
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
  const current = window.scrollY;
  const unit = timelineUnitFromScroll();

  if (direction > 0) {
    if (unit < OPENING_STOP_UNIT - 0.08) return scrollTopFromTimelineUnit(OPENING_STOP_UNIT);
    if (unit >= FINALE_START_UNIT - 0.25 && unit < FINALE_STOP_UNIT - 0.08) {
      return scrollTopFromTimelineUnit(FINALE_STOP_UNIT);
    }
    return null;
  }

  if (unit > FINALE_START_UNIT + 0.08 && unit <= FINALE_STOP_UNIT + 0.25) {
    return scrollTopFromTimelineUnit(FINALE_START_UNIT);
  }
  if (unit > OPENING_STOP_UNIT + 0.08) return null;
  return current > window.innerHeight * 0.35 ? 0 : scrollTopFromTimelineUnit(OPENING_STOP_UNIT);
}

function durationForTarget(target: number) {
  const unit = timelineUnitFromScroll();
  const isFinale = unit >= FINALE_START_UNIT - 0.25;
  const runStart = scrollTopFromTimelineUnit(isFinale ? FINALE_START_UNIT : 0);
  const runEnd = scrollTopFromTimelineUnit(isFinale ? FINALE_STOP_UNIT : OPENING_STOP_UNIT);
  const runDistance = Math.max(1, Math.abs(runEnd - runStart));
  const distance = Math.abs(target - window.scrollY);
  const progress = clamp(distance / runDistance, 0, 1);
  const fullDuration = isFinale ? FINALE_RUN_DURATION : OPENING_RUN_DURATION;
  return clamp(fullDuration * progress, MIN_DURATION, fullDuration);
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

      const unit = timelineUnitFromScroll();
      const target = targetForDirection(direction);
      if (target == null) return false;
      if (Math.abs(target - window.scrollY) < 12) return false;

      const openingStopTop = scrollTopFromTimelineUnit(OPENING_STOP_UNIT);
      const shouldChainOpening =
        direction > 0 && unit < HERO_VIDEO_START_UNIT - 0.2 && Math.abs(target - openingStopTop) < 2;

      if (shouldChainOpening) {
        runningRef.current = true;
        w.__cinematicAutopilot = true;
        if (timerRef.current != null) window.clearTimeout(timerRef.current);
        scrollToPosition(scrollTopFromTimelineUnit(HERO_VIDEO_START_UNIT), FIRST_VIDEO_HANDOFF_DURATION);
        timerRef.current = window.setTimeout(() => {
          scrollToPosition(openingStopTop, HERO_VIDEO_RUN_DURATION);
          timerRef.current = window.setTimeout(clearRun, HERO_VIDEO_RUN_DURATION * 1000 + 500);
        }, FIRST_VIDEO_HANDOFF_DURATION * 1000 + 100);
        return true;
      }

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
