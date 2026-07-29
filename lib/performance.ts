"use client";

export type VisualQuality = "low" | "medium" | "high";

export function getVisualQuality(): VisualQuality {
  if (typeof window === "undefined") return "medium";

  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  const narrow = window.innerWidth < 820;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  if (reducedMotion || memory <= 4 || cores <= 4 || (coarsePointer && narrow)) return "low";
  if (memory <= 6 || cores <= 6 || narrow) return "medium";
  return "high";
}

export function qualityScale(quality: VisualQuality) {
  if (quality === "low") return 0.22;
  if (quality === "medium") return 0.38;
  return 0.56;
}
