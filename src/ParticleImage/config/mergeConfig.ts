import type {
  EffectsConfig,
  GlowConfig,
  IconPositionProp,
  ParticleImageConfig,
  ParticleImagePreset,
  ResolvedParticleImageConfig,
} from "../types";
import { getPresetConfig } from "../presets";
import { DEFAULT_CONFIG } from "./defaults";
import { resolveResponsiveSettings } from "./responsiveScaling";

/**
 * Sections that participate in the standard merge chain.
 * "responsive" is intentionally excluded — it is extracted and applied separately.
 */
const SECTIONS = [
  "layout",
  "animation",
  "physics",
  "visual",
  "canvas",
  "performance",
  "effects",
] as const satisfies ReadonlyArray<keyof ParticleImageConfig>;

type MergeableSection = (typeof SECTIONS)[number];

function mergeSection<S extends MergeableSection>(
  section: S,
  overrides: (ParticleImageConfig[S] | undefined)[],
): ResolvedParticleImageConfig[S] {
  let result = { ...DEFAULT_CONFIG[section as keyof ResolvedParticleImageConfig] } as object;

  for (const override of overrides) {
    if (override) {
      result = { ...result, ...(override as object) };
    }
  }

  return result as ResolvedParticleImageConfig[S];
}

/**
 * Deep-merges any number of partial configs onto the shared defaults, section by
 * section. Later arguments win. Always returns a fully populated config.
 *
 * Merge priority (lowest → highest):
 *   1. DEFAULT_CONFIG
 *   2. preset defaults
 *   3. responsive[breakpoint]
 *   4. compat props (canvasSize, dotSpacing, etc.)
 *   5. deprecated glow prop  → config.effects.glow
 *   6. user config
 *   7. deprecated iconPosition prop  → config.layout.position  (highest)
 */
export function mergeConfig(
  ...configs: (Partial<ParticleImageConfig> | undefined)[]
): ResolvedParticleImageConfig {
  const result = {} as ResolvedParticleImageConfig;

  for (const section of SECTIONS) {
    (result[section as keyof ResolvedParticleImageConfig] as unknown) = mergeSection(
      section,
      configs.map((config) => config?.[section as keyof ParticleImageConfig]) as never,
    );
  }

  // `responsive` is not a mergeable section (it mixes scalar scaling settings
  // with breakpoint partials). Resolve its scalar settings separately.
  result.responsive = resolveResponsiveSettings(...configs);

  return result;
}

/** Top-level migration-compatibility props, before normalization. */
export interface CompatibilityProps {
  canvasSize?: number;
  dotSpacing?: number;
  baseDotSize?: number;
  maxDots?: number;
  primaryColor?: string;
  secondaryColor?: string;
}

/**
 * Normalizes the legacy top-level props into a partial config layer so they can
 * participate in the standard merge chain. Only defined props produce overrides.
 */
export function normalizeCompatibilityProps(
  props: CompatibilityProps,
): Partial<ParticleImageConfig> {
  const visual: ParticleImageConfig["visual"] = {};
  const canvas: ParticleImageConfig["canvas"] = {};

  if (props.dotSpacing !== undefined) visual.dotSpacing = props.dotSpacing;
  if (props.baseDotSize !== undefined) visual.baseDotSize = props.baseDotSize;
  if (props.maxDots !== undefined) visual.maxDots = props.maxDots;
  if (props.primaryColor !== undefined) visual.primaryColor = props.primaryColor;
  if (props.secondaryColor !== undefined)
    visual.secondaryColor = props.secondaryColor;
  if (props.canvasSize !== undefined) canvas.defaultSize = props.canvasSize;

  const layer: Partial<ParticleImageConfig> = {};
  if (Object.keys(visual).length > 0) layer.visual = visual;
  if (Object.keys(canvas).length > 0) layer.canvas = canvas;
  return layer;
}

/**
 * Converts a deprecated `iconPosition` prop into a layout override that sets
 * `layout.position` and zeroes pixel offsets, ensuring purely fractional placement.
 * Applied as the highest-priority layer so it wins over all other config sources.
 *
 * @deprecated Consumers should use `config.layout.position` directly.
 */
export function normalizeIconPosition(
  pos: IconPositionProp,
): Partial<ParticleImageConfig> {
  return {
    layout: {
      position: { x: pos.x, y: pos.y },
      horizontalOffset: 0,
      mobileHorizontalOffset: 0,
      verticalOffset: 0,
    },
  };
}

/**
 * Converts a deprecated `glow` prop into an effects config layer.
 * Applied before user config so `config.effects.glow` takes precedence.
 *
 * @deprecated Consumers should use `config.effects.glow` directly.
 */
export function normalizeGlowProp(glow: GlowConfig): Partial<ParticleImageConfig> {
  return { effects: { glow } };
}

/**
 * Resolves the final config using the required merge order:
 *
 *   1. shared defaults
 *   2. preset defaults
 *   3. responsive[breakpoint]   ← preset-defined then user-defined breakpoint partials
 *   4. top-level compat props   (canvasSize, dotSpacing, etc.)
 *   5. deprecated glow prop     → config.effects.glow
 *   6. user config              (wins over everything above)
 *   7. deprecated iconPosition  → config.layout.position   (highest priority)
 *
 * Two further steps run in the component, after this resolution, on the result:
 *   - applyMobileOverrides()    legacy mobile field overrides (viewport < 768)
 *   - applyResponsiveScaling()  internal proportional scaling by rendered canvas size
 *
 * The scalar proportional-scaling settings (responsive.enabled, referenceWidth,
 * minScale, scale* flags, …) are resolved by mergeConfig and stored on
 * `resolved.responsive`; they are NOT merged as a section.
 */
export function resolveParticleImageConfig(options: {
  preset?: ParticleImagePreset;
  breakpoint?: "mobile" | "tablet" | "desktop";
  compat?: CompatibilityProps;
  config?: Partial<ParticleImageConfig>;
  /** @deprecated Use config.layout.position */
  iconPosition?: IconPositionProp;
  /** @deprecated Use config.effects.glow */
  glow?: GlowConfig;
}): ResolvedParticleImageConfig {
  const preset = options.preset ?? "hero";
  const userConfig = options.config;

  // The active breakpoint's partial overrides are merged as their own section
  // layer (preset-defined first, user-defined on top). The scalar scaling
  // settings inside `responsive` are resolved separately by mergeConfig →
  // resolveResponsiveSettings, which reads every config's `responsive`.
  const breakpoint = options.breakpoint ?? "desktop";
  const presetConfig = getPresetConfig(preset);
  const presetBreakpointLayer = presetConfig.responsive?.[breakpoint];
  const userBreakpointLayer = userConfig?.responsive?.[breakpoint];

  return mergeConfig(
    DEFAULT_CONFIG,
    presetConfig,
    presetBreakpointLayer,
    userBreakpointLayer,
    options.compat ? normalizeCompatibilityProps(options.compat) : undefined,
    options.glow ? normalizeGlowProp(options.glow) : undefined,
    userConfig,
    options.iconPosition ? normalizeIconPosition(options.iconPosition) : undefined,
  );
}
