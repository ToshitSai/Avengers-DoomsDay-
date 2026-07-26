# AVENGERS: DOOMSDAY - Cinematic Scroll Experience

Created by **Toshit Sai**.

A fully scroll-driven cinematic web experience built to feel like one continuous movie rather than a conventional website. Every video, camera move, particle, and title is choreographed to scroll position, so the viewer directs the trailer by moving through the page.

> This is a non-commercial, Marvel-inspired fan concept created as an educational and portfolio showcase of creative front-end development. It is not affiliated with, endorsed by, or sponsored by Marvel or The Walt Disney Company. All Marvel characters and trademarks belong to their respective owners.

## Overview

- **Name:** AVENGERS: DOOMSDAY
- **Creator:** Toshit Sai
- **Type:** Single-page cinematic scroll experience
- **Stack:** Next.js, React, TypeScript, Three.js, React Three Fiber, GSAP, Lenis, Zustand
- **Purpose:** A performance-minded portfolio piece demonstrating scroll orchestration, WebGL atmosphere, video scrubbing, and immersive interaction.

## Features

- Scroll-scrubbed Marvel intro, hero trailer, and final battle footage
- Transparent WebGL atmosphere with particles, fog, lightning, sparks, and portal effects
- 3D Doctor Doom showcase with six orbiting autoplay character video cards
- Fullscreen story panels and horizontal cinematic timeline
- MCU timeline pan, title reveal video, and closing footer
- Silent playback, inline video, no controls, and responsive sizing across devices

## Performance Work

This version keeps the videos and animation design intact while making playback smoother:

- Adaptive WebGL quality for lower-memory, lower-core, mobile, and reduced-motion devices
- Lower mobile DPR for the transparent canvas to reduce GPU pressure
- Reduced particle, lightning, and spark workload on constrained devices
- Quantized and rate-limited scroll video seeking to avoid decoder thrashing
- Deferred preload metadata for videos that are not immediately on screen
- Section-gated autoplay videos so hidden clips are paused instead of decoding in the background

## Getting Started

Prerequisites: Node.js 20.9+ and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For production:

```bash
npm run build
npm run start
```

## Project Structure

```text
app/                  Root layout, page, global CSS
components/           Experience director, overlays, UI, and WebGL scene
lib/                  Constants, signals, video helpers, performance helpers
public/story/         Story and timeline images
public/videos/        Video clips and posters
```

## Credits

- Created by Toshit Sai.
- Built with Next.js, React, TypeScript, Three.js, React Three Fiber, drei, GSAP, Lenis, and Zustand.
- Fonts: Anton and Chakra Petch via Google Fonts.
- Marvel-inspired fan concept for non-commercial demonstration only.
