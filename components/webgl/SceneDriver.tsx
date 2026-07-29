"use client";

import { useFrame } from "@react-three/fiber";
import { signals } from "@/lib/signals";

/**
 * The heartbeat. One component owns the shared clock, decays the impulse
 * channels, and smooths the pointer.
 * Everything else just reads `signals`.
 */
export default function SceneDriver() {
  useFrame((state, dt) => {
    const d = Math.min(dt, 1 / 20); // clamp huge tab-switch deltas
    signals.time = state.clock.getElapsedTime();

    // Impulse decay
    signals.shake *= Math.exp(-d * 3.4);
    signals.flash *= Math.exp(-d * 4.2);
    if (signals.shake < 0.0005) signals.shake = 0;
    if (signals.flash < 0.0005) signals.flash = 0;

    // Pointer smoothing (raw target -> smoothed)
    const k = 1 - Math.exp(-d * 7);
    signals.mx += (signals.mtx - signals.mx) * k;
    signals.my += (signals.mty - signals.my) * k;

  });

  return null;
}
