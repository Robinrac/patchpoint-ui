import type { ResolvedParticleImageConfig } from "../types";

/**
 * Mobile-only overrides (viewport < 768px). Applied after the full config merge
 * chain so explicit `mobileHorizontalOffset` still wins.
 */
export function applyMobileOverrides(
  config: ResolvedParticleImageConfig,
  isMobile: boolean,
): ResolvedParticleImageConfig {
  if (!isMobile) return config;

  const { layout, animation, visual } = config;

  return {
    ...config,
    layout: {
      ...layout,
      horizontalOffset:
        layout.mobileHorizontalOffset !== undefined
          ? layout.mobileHorizontalOffset
          : layout.horizontalOffset,
    },
    animation: {
      ...animation,
      animationTypes: ["vertical", "horizontal", "circular"],
      amplitudeMin: 1.5,
      amplitudeMax: 3,
    },
    visual: {
      ...visual,
      jitter: 0.1,
      alphaThreshold: 160,
      bouncingParticlesCount: Math.min(visual.bouncingParticlesCount, 10),
      dotSpacing: 5,
      baseDotSize: 1.4,
      maxDots: 1200,
    },
  };
}
