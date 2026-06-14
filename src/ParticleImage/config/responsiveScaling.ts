import type {
  ParticleImageConfig,
  ResolvedParticleImageConfig,
  ResolvedResponsiveConfig,
  ResponsiveConfig,
} from "../types";
import { DEFAULT_RESPONSIVE } from "./defaults";

const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));

/** Scalar scaling-setting keys (everything in ResponsiveConfig except breakpoint partials). */
const SCALING_KEYS = [
  "enabled",
  "referenceWidth",
  "referenceHeight",
  "minScale",
  "maxScale",
  "scaleDotSpacing",
  "scaleBaseDotSize",
  "scaleJitter",
  "scaleAmplitude",
  "scaleSizeMinMax",
  "scaleMaxDots",
  "scaleBouncingParticles",
  "minDots",
  "minBouncingParticles",
] as const;

function pickScalingSettings(
  r: ResponsiveConfig | undefined,
): Partial<ResolvedResponsiveConfig> {
  if (!r) return {};
  const out: Partial<ResolvedResponsiveConfig> = {};
  for (const key of SCALING_KEYS) {
    const value = r[key];
    if (value !== undefined) {
      // Each key maps 1:1 to the resolved shape; the cast is safe.
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}

/**
 * Resolves the proportional-scaling settings by layering the `responsive` scalar
 * fields from each config (lowest → highest priority) onto the shared defaults.
 * Breakpoint partials (mobile/tablet/desktop) are ignored here — they are handled
 * separately by the merge chain.
 */
export function resolveResponsiveSettings(
  ...configs: (Partial<ParticleImageConfig> | undefined)[]
): ResolvedResponsiveConfig {
  let result: ResolvedResponsiveConfig = { ...DEFAULT_RESPONSIVE };
  for (const config of configs) {
    if (config?.responsive) {
      result = { ...result, ...pickScalingSettings(config.responsive) };
    }
  }
  return result;
}

/**
 * Derives the linear scale factor from the rendered canvas size. Uses the smaller
 * of the two axis ratios so neither dimension overflows the reference, then clamps
 * to [minScale, maxScale].
 */
export function computeResponsiveScaleFactor(
  r: ResolvedResponsiveConfig,
  canvasWidth: number,
  canvasHeight: number,
): number {
  if (!r.enabled) return 1;
  const raw = Math.min(
    canvasWidth / r.referenceWidth,
    canvasHeight / r.referenceHeight,
  );
  return clamp(raw, r.minScale, r.maxScale);
}

/**
 * Applies proportional scaling to a fully-resolved config based on the actual
 * rendered canvas size. Linear values (dot size/spacing, amplitude, optionally
 * jitter and the size range) scale by the clamped linear factor; density values
 * (maxDots, bouncing particle count) scale by canvas *area* and are floored so
 * the silhouette stays recognizable.
 *
 * This is the final step in the pipeline — it runs after the full merge chain and
 * after `applyMobileOverrides`, reading from the resolved config the renderer consumes.
 * Returns the input unchanged when `responsive.enabled` is false.
 */
export function applyResponsiveScaling(
  config: ResolvedParticleImageConfig,
  canvasWidth: number,
  canvasHeight: number,
): ResolvedParticleImageConfig {
  const r = config.responsive;
  if (!r.enabled || canvasWidth <= 0 || canvasHeight <= 0) return config;

  const factor = computeResponsiveScaleFactor(r, canvasWidth, canvasHeight);

  // Area ratio for density values, clamped so we never *increase* density beyond
  // the configured base (large canvases keep their intended counts, not more).
  const areaScale = clamp(
    (canvasWidth * canvasHeight) / (r.referenceWidth * r.referenceHeight),
    0,
    1,
  );

  const visual = { ...config.visual };
  const animation = { ...config.animation };

  if (r.scaleDotSpacing) {
    visual.dotSpacing = Math.max(2, config.visual.dotSpacing * factor);
  }
  if (r.scaleBaseDotSize) {
    visual.baseDotSize = config.visual.baseDotSize * factor;
  }
  if (r.scaleJitter) {
    visual.jitter = config.visual.jitter * factor;
  }
  if (r.scaleSizeMinMax) {
    visual.sizeMin = config.visual.sizeMin * factor;
    visual.sizeMax = config.visual.sizeMax * factor;
  }
  if (r.scaleAmplitude) {
    animation.amplitudeMin = config.animation.amplitudeMin * factor;
    animation.amplitudeMax = config.animation.amplitudeMax * factor;
  }
  if (r.scaleMaxDots) {
    visual.maxDots = clamp(
      Math.round(config.visual.maxDots * areaScale),
      Math.min(r.minDots, config.visual.maxDots),
      config.visual.maxDots,
    );
  }
  if (r.scaleBouncingParticles) {
    const base = config.visual.bouncingParticlesCount;
    visual.bouncingParticlesCount =
      base <= 0
        ? 0
        : Math.max(
            Math.min(r.minBouncingParticles, base),
            Math.round(base * areaScale),
          );
  }

  return { ...config, visual, animation };
}
