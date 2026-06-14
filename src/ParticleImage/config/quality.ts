import type { ResolvedParticleImageConfig } from "../types";

/** A concrete workload tier — `"auto"` is always resolved away before use. */
export type ResolvedQuality = "low" | "medium" | "high";

/**
 * Resolves the active workload tier. An explicit `"low" | "medium" | "high"` is
 * always honored (so a consumer can force high quality on a phone, or low on a
 * desktop). `"auto"` maps the breakpoint to a tier:
 *
 *   phone  → low      tablet → medium      desktop → high
 *
 * Reduced motion is handled separately by the static-render path, so it is not
 * folded in here.
 */
export function resolveQuality(
  quality: "auto" | "low" | "medium" | "high",
  breakpoint: "mobile" | "tablet" | "desktop",
): ResolvedQuality {
  if (quality !== "auto") return quality;
  if (breakpoint === "mobile") return "low";
  if (breakpoint === "tablet") return "medium";
  return "high";
}

/**
 * Values a consumer explicitly set via the `config` prop / top-level props. The
 * caps layer never overrides one of these — a deliberate choice always wins over
 * a tier default. Presets are *not* included here: those flow through
 * the resolved config and are treated as defaults that caps may tighten.
 */
export interface QualityOverrideSignals {
  physicsEnabled?: boolean;
  targetFps?: number;
  maxPixelDensity?: number;
  bouncingParticlesCount?: number;
  maxDots?: number;
}

interface QualityCaps {
  /** Hard ceiling on sampled dots (workload, not design — applied as a min()). */
  maxDotsCeiling?: number;
  /** Hard ceiling on ambient bouncer count. */
  bouncerCeiling?: number;
  /** Draw-rate cap (fps), filled in only when the consumer left targetFps unset. */
  targetFps?: number;
  /** pixelDensity cap, filled in only when the consumer left maxPixelDensity unset. */
  maxPixelDensity?: number;
  /** Turn physics (mouse/touch interaction) off unless explicitly requested. */
  disablePhysics?: boolean;
}

/**
 * Per-tier workload caps. These deliberately touch only *workload* knobs —
 * dot/bouncer counts, frame rate, pixel density, physics — and never design
 * proportions (dot size, spacing, jitter, amplitude), which responsive scaling
 * already owns. That separation is what prevents the two systems from
 * double-shrinking the visual.
 *
 *   high   → no caps (full desktop quality).
 *   medium → gentle ceilings for tablets / mid screens.
 *   low    → phone-friendly: fewer dots/bouncers, 30fps, density 1, physics off.
 */
const QUALITY_CAPS: Record<ResolvedQuality, QualityCaps> = {
  high: {},
  medium: {
    maxDotsCeiling: 1800,
    maxPixelDensity: 2,
  },
  low: {
    maxDotsCeiling: 800,
    bouncerCeiling: 6,
    targetFps: 30,
    maxPixelDensity: 1,
    disablePhysics: true,
  },
};

/**
 * Applies the resolved tier's workload caps to a fully-resolved, already
 * responsively-scaled config. Runs as the *last* step of the config pipeline:
 *
 *   defaults → preset → breakpoint → compat → user   (mergeConfig)
 *     → applyMobileOverrides → applyResponsiveScaling → applyQualityCaps
 *
 * Caps are clamps (`min`) over the scaled values, so they compose cleanly with
 * responsive scaling rather than fighting it. Every cap is skipped when the
 * consumer set the corresponding value explicitly (see {@link QualityOverrideSignals}).
 * Returns the input unchanged for the `"high"` tier.
 */
export function applyQualityCaps(
  config: ResolvedParticleImageConfig,
  quality: ResolvedQuality,
  overrides: QualityOverrideSignals = {},
): ResolvedParticleImageConfig {
  const caps = QUALITY_CAPS[quality];
  if (Object.keys(caps).length === 0) return config;

  const visual = { ...config.visual };
  const physics = { ...config.physics };
  const performance = { ...config.performance };

  if (caps.maxDotsCeiling !== undefined && overrides.maxDots === undefined) {
    visual.maxDots = Math.min(visual.maxDots, caps.maxDotsCeiling);
  }

  if (
    caps.bouncerCeiling !== undefined &&
    overrides.bouncingParticlesCount === undefined
  ) {
    visual.bouncingParticlesCount = Math.min(
      visual.bouncingParticlesCount,
      caps.bouncerCeiling,
    );
  }

  // Fill in fps/density only when the consumer left them at the uncapped
  // default (0 / unset) — never override an explicit cap of their own.
  if (caps.targetFps !== undefined && !overrides.targetFps) {
    if (!performance.targetFps || performance.targetFps <= 0) {
      performance.targetFps = caps.targetFps;
    }
  }
  if (caps.maxPixelDensity !== undefined && !overrides.maxPixelDensity) {
    if (!performance.maxPixelDensity || performance.maxPixelDensity <= 0) {
      performance.maxPixelDensity = caps.maxPixelDensity;
    }
  }

  if (caps.disablePhysics && overrides.physicsEnabled === undefined) {
    physics.enabled = false;
  }

  return { ...config, visual, physics, performance };
}
