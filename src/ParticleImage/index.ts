export { ParticleImage } from "./ParticleImage";

export type {
  AnimationConfig,
  CanvasConfig,
  EffectsConfig,
  GlowConfig,
  IconPositionProp,
  ImageLayoutConfig,
  ParticleImageConfig,
  ParticleImageMode,
  ParticleImagePreset,
  ParticleImageProps,
  PerformanceConfig,
  PhysicsConfig,
  ResolvedParticleImageConfig,
  ResolvedResponsiveConfig,
  ResponsiveConfig,
  VisualConfig,
} from "./types";

export { DEFAULT_CONFIG, DEFAULT_RESPONSIVE } from "./config/defaults";
export { mergeConfig, resolveParticleImageConfig } from "./config/mergeConfig";
export {
  applyResponsiveScaling,
  computeResponsiveScaleFactor,
  resolveResponsiveSettings,
} from "./config/responsiveScaling";
export { applyQualityCaps, resolveQuality } from "./config/quality";
export type { ResolvedQuality } from "./config/quality";

export {
  backgroundPreset,
  compactPreset,
  containedPreset,
  getPresetConfig,
  heroPreset,
  staticPreset,
} from "./presets";
