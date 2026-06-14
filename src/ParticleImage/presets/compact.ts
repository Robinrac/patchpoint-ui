import type { ParticleImageConfig } from "../types";

/**
 * `compact` — smaller inline slots (e.g. podium, avatar, badge).
 */
export const compactPreset = (): Partial<ParticleImageConfig> => ({
  layout: {
    scale: 0.36,
    horizontalPosition: "center",
    horizontalOffset: 0,
    mobileHorizontalOffset: 0,
    verticalPosition: 0.5,
    verticalOffset: -0.15,
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
    defaultSize: 600,
    heightRatio: 1,
    maxHeight: 2000,
  },
  visual: {
    dotSpacing: 6,
    baseDotSize: 1.35,
    maxDots: 900,
    bouncingParticlesCount: 10,
    sizeMin: 0.55,
    sizeMax: 1.35,
    jitter: 0.52,
    bouncingParticlesSpeedMin: 0.4,
    bouncingParticlesSpeedMax: 1.2,
  },
  responsive: {
    // Podium/compact treatment stays light; reference against a square-ish size.
    referenceWidth: 600,
    referenceHeight: 600,
  },
});
