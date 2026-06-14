import type { ParticleImageConfig } from "../types";

/**
 * `static` — no active animation after the initial render. Particles land in
 * their final positions immediately (no intro fly-in, no idle oscillation, no
 * mouse physics, no ambient particles) and the render loop is stopped. Intended
 * for weak devices and as the natural target for reduced-motion users.
 */
export const staticPreset = (): Partial<ParticleImageConfig> => ({
  animation: {
    enabled: false,
    introEnabled: false,
    flyInFromWholePage: false,
    particlesVisibleOutsideComponent: false,
  },
  physics: {
    enabled: false,
  },
  visual: {
    bouncingParticlesCount: 0,
  },
  performance: {
    respectReducedMotion: true,
    pauseWhenOffscreen: true,
    pauseWhenTabHidden: true,
    disableMouseInteractionOnMobile: true,
    quality: "low",
  },
});
