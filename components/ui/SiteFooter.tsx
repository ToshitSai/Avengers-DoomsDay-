"use client";

import { useRef } from "react";
import { signals } from "@/lib/signals";
import { useRaf } from "@/lib/useRaf";
import { SECTION_NAV, goToSection } from "@/lib/sectionNavigation";
import styles from "./footer.module.css";

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export default function SiteFooter() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLElement>(null);

  useRaf(() => {
    const foot = signals.footer;
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (foot <= 0.0006) {
      if (wrap.style.visibility !== "hidden") wrap.style.visibility = "hidden";
      return;
    }
    wrap.style.visibility = "visible";
    if (footRef.current) {
      footRef.current.style.transform = `translateY(${((1 - foot) * 100).toFixed(2)}%)`;
      footRef.current.style.opacity = smoothstep(0, 0.25, foot).toFixed(3);
    }
  });

  return (
    <div className={styles.wrap} ref={wrapRef} style={{ visibility: "hidden" }}>
      <footer className={styles.footer} ref={footRef} style={{ opacity: 0 }}>
        <span className={styles.glow} />
        <div className={styles.inner}>
          <div className={styles.brand}>
            <span className={styles.mark}>
              Doomsday<span>.</span>
            </span>
            <span className={styles.tag}>A scroll-driven cinematic concept experience.</span>
          </div>

          <nav>
            <div className={styles.colHead}>Explore</div>
            <div className={styles.links}>
              {SECTION_NAV.map((item) => (
                <a
                  key={item.target}
                  href={`#${item.target}`}
                  onClick={(e) => {
                    e.preventDefault();
                    goToSection(item.target);
                  }}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </nav>
        </div>

        <div className={styles.rule} />
        <div className={styles.base}>
          <span>© 2026 · Toshit Sai - fan concept, not affiliated with Marvel.</span>
          <span>Built by Toshit Sai as a cinematic web experience.</span>
        </div>
      </footer>
    </div>
  );
}
