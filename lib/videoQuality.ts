"use client";

import { useEffect, useState } from "react";

type VideoQualityMode = "adaptive" | "smooth";

function canUse4kVideo() {
  if (typeof window === "undefined") return false;

  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  const largeDisplay = window.innerWidth >= 1440 && window.devicePixelRatio >= 1.25;

  return largeDisplay && !coarsePointer && !reducedMotion && memory >= 8 && cores >= 8;
}

export function video4kPath(src: string) {
  const fileName = src.split("/").pop();
  return fileName ? `/videos/4k/${fileName}` : src;
}

export function useVideoSource(src: string, mode: VideoQualityMode = "adaptive") {
  const [resolved, setResolved] = useState(src);

  useEffect(() => {
    setResolved(mode === "adaptive" && canUse4kVideo() ? video4kPath(src) : src);
  }, [src, mode]);

  return resolved;
}

export function useVideoSources(sources: readonly string[], mode: VideoQualityMode = "adaptive") {
  const key = sources.join("|");
  const [resolved, setResolved] = useState(() => [...sources]);

  useEffect(() => {
    const use4k = mode === "adaptive" && canUse4kVideo();
    setResolved(sources.map((src) => (use4k ? video4kPath(src) : src)));
  }, [key, mode]);

  return resolved;
}
