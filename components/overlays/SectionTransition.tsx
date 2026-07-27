"use client";

import { useEffect, useRef } from "react";
import { useRaf } from "@/lib/useRaf";

export default function SectionTransition() {
  const ref = useRef<HTMLDivElement>(null);
  const pulseRef = useRef(0);

  useEffect(() => {
    const onTransition = () => {
      pulseRef.current = 1;
    };

    window.addEventListener("section-transition", onTransition);
    return () => window.removeEventListener("section-transition", onTransition);
  }, []);

  useRaf(() => {
    const el = ref.current;
    if (!el) return;
    pulseRef.current = Math.max(0, pulseRef.current - 0.035);
    const p = pulseRef.current;
    el.style.opacity = (Math.sin(p * Math.PI) * 0.42).toFixed(3);
    el.style.transform = `scaleX(${(0.82 + (1 - p) * 0.18).toFixed(3)})`;
  });

  return (
    <div
      ref={ref}
      className="overlay no-select"
      aria-hidden
      style={{
        zIndex: 14,
        opacity: 0,
        transformOrigin: "50% 50%",
        background:
          "linear-gradient(90deg, rgba(0,0,0,0.74), rgba(0,255,156,0.16) 48%, rgba(0,0,0,0.74))",
        mixBlendMode: "screen",
        pointerEvents: "none",
        willChange: "opacity, transform",
      }}
    />
  );
}
