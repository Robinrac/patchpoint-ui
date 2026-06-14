import type { ParticleImagePreset } from "../types";
import { backgroundPreset } from "./background";
import { compactPreset } from "./compact";
import { containedPreset } from "./contained";
import { heroPreset } from "./hero";
import { staticPreset } from "./static";

const PRESET_FACTORIES = {
  hero: heroPreset,
  background: backgroundPreset,
  contained: containedPreset,
  compact: compactPreset,
  static: staticPreset,
} as const;

export function getPresetConfig(preset: ParticleImagePreset) {
  return PRESET_FACTORIES[preset]();
}

export { backgroundPreset, compactPreset, containedPreset, heroPreset, staticPreset };
