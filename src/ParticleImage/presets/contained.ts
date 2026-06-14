import type { ParticleImageConfig } from "../types";

/**
 * `contained` — bounded containers: cards, result screens, dashboard blocks.
 * Clips to host bounds, disables pointer-events, centered layout.
 */
export const containedPreset = (): Partial<ParticleImageConfig> => ({
  layout: {
    scale: 0.36,
    horizontalPosition: "center",
    horizontalOffset: 0,
    mobileHorizontalOffset: 0,
    verticalPosition: 0.5,
    verticalOffset: -0.05,
    overflow: "hidden",
    pointerEvents: "none",
    fit: "contain",
  },
  animation: {
    flyInFromWholePage: false,
    particlesVisibleOutsideComponent: false,
    introDuration: 5200,
    introDelayMin: 0,
    introDelayMax: 2800,
    introDurationMin: 900,
    introDurationMax: 2200,
    amplitudeMin: 2.5,
    amplitudeMax: 4.5,
    speedMin: 8,
    speedMax: 10.5,
  },
  canvas: {
    defaultSize: 520,
    heightRatio: 0.88,
    maxHeight: 2000,
  },
  visual: {
    dotSpacing: 6,
    baseDotSize: 1.4,
    maxDots: 1400,
    bouncingParticlesCount: 12,
    sizeMin: 0.55,
    sizeMax: 1.35,
    jitter: 0.52,
    bouncingParticlesSpeedMin: 0.4,
    bouncingParticlesSpeedMax: 1.2,
  },
  responsive: {
    // Cards/squares are small; reference against a compact size so a normal card
    // renders near full density and only genuinely tiny containers scale down.
    referenceWidth: 480,
    referenceHeight: 440,
    // Keep cards from collapsing too far at small sizes.
    minScale: 0.7,
    maxScale: 1.15,
  },
});
