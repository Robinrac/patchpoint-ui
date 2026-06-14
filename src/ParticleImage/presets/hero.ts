import type { ParticleImageConfig } from "../types";

/**
 * `hero` — wide hero sections: right-aligned logo, full intro, oscillation, physics.
 */
export const heroPreset = (): Partial<ParticleImageConfig> => ({
  layout: {
    scale: 0.34,
    horizontalPosition: "right",
    horizontalOffset: -35,
    mobileHorizontalOffset: -10,
    verticalPosition: 0.5,
    verticalOffset: 0.08,
  },
  animation: {
    flyInFromWholePage: false,
    particlesVisibleOutsideComponent: false,
  },
  responsive: {
    // Hero sections are wide; measure proportions against a large reference.
    referenceWidth: 1100,
    referenceHeight: 600,
  },
});
