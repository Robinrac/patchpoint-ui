import type { ParticleImageConfig } from "../types";

/**
 * `background` — decorative full-area treatment. Enable
 * `particlesVisibleOutsideComponent` via config for full-viewport backgrounds.
 */
export const backgroundPreset = (): Partial<ParticleImageConfig> => ({
  layout: {
    scale: 0.34,
    horizontalPosition: "center",
    horizontalOffset: 0,
    mobileHorizontalOffset: 0,
    verticalPosition: 0.5,
    verticalOffset: 0.05,
  },
  animation: {
    flyInFromWholePage: false,
    particlesVisibleOutsideComponent: false,
  },
  canvas: {
    defaultSize: 800,
    heightRatio: 1,
    maxHeight: 2000,
  },
  visual: {
    sizeMin: 1.1,
    sizeMax: 2.05,
    bouncingParticlesCount: 50,
  },
  responsive: {
    // Full-area/viewport treatment — reference against a viewport-like size.
    referenceWidth: 1440,
    referenceHeight: 800,
  },
});
