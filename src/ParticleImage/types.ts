/** Rendering mode: "image" samples the logo into dots, "particles" is bouncers only, "auto" detects from imagePath. */
export type ParticleImageMode = "image" | "particles" | "auto";

export type ParticleImagePreset = "hero" | "background" | "contained" | "compact" | "static";

/**
 * Where the sampled image silhouette is placed inside the canvas and how it is
 * scaled. Mirrors the layout block from the original per-app implementations.
 */
export interface ImageLayoutConfig {
  /** Image draw size as a fraction of the canvas width (e.g. 0.36). */
  scale?: number;
  /** Horizontal anchor. A number is treated as a 0..1 fraction of the width. */
  horizontalPosition?: "left" | "center" | "right" | number;
  /** Extra horizontal offset in pixels applied after anchoring. */
  horizontalOffset?: number;
  /** Additional horizontal offset (pixels) applied only on mobile widths. */
  mobileHorizontalOffset?: number;
  /** Vertical anchor as a 0..1 fraction of the canvas height (0.5 = center). */
  verticalPosition?: number;
  /** Extra vertical offset as a fraction of the canvas height. */
  verticalOffset?: number;
  /**
   * Fractional position of the icon center inside the canvas (0–1 each axis).
   * When set, wins over the legacy offset fields. Fully responsive.
   * x: 0 = left edge, 0.5 = center, 1 = right edge
   * y: 0 = top, 0.5 = center, 1 = bottom
   */
  position?: { x?: number; y?: number };
  /** How the canvas fills its host element. Default "contain". */
  fit?: "contain" | "cover" | "fill";
  /** Whether canvas content clips to host bounds. Default "visible". */
  overflow?: "hidden" | "visible";
  /** CSS pointer-events on the host wrapper. Default "auto". */
  pointerEvents?: "none" | "auto";
}

export interface AnimationConfig {
  /** Master switch for idle oscillation + physics. */
  enabled?: boolean;
  /** Whether the intro fly-in plays on first render. */
  introEnabled?: boolean;
  /** Global window (ms) during which all particles complete their intro. */
  introDuration?: number;
  introDelayMin?: number;
  introDelayMax?: number;
  introDurationMin?: number;
  introDurationMax?: number;
  amplitudeMin?: number;
  amplitudeMax?: number;
  speedMin?: number;
  speedMax?: number;
  animationTypes?: Array<"vertical" | "horizontal" | "circular" | "diagonal">;
  /** Idle-animation time divisor (lower = faster). */
  frameRate?: number;
  /** Particles fly in from anywhere on the page rather than the nearest edge. */
  flyInFromWholePage?: boolean;
  /** Render the canvas full-viewport so particles are visible outside the host. */
  particlesVisibleOutsideComponent?: boolean;
}

export interface PhysicsConfig {
  /** Master switch for mouse/touch interaction. */
  enabled?: boolean;
  repulsionRadius?: number;
  attractionRadius?: number;
  repulsionStrength?: number;
  attractionStrength?: number;
  damping?: number;
  returnStrength?: number;
  repulsionNoise?: number;
}

export interface VisualConfig {
  opacityMin?: number;
  opacityMax?: number;
  sizeMin?: number;
  sizeMax?: number;
  jitter?: number;
  primaryColorProbability?: number;
  alphaThreshold?: number;
  bouncingParticlesCount?: number;
  bouncingParticlesSpeedMin?: number;
  bouncingParticlesSpeedMax?: number;

  // --- Normalized migration-compatibility fields ---
  // These mirror the original top-level props so existing call sites keep
  // working. The top-level props are normalized into these by mergeConfig.
  /** Grid spacing (px) used when sampling the image into dots. */
  dotSpacing?: number;
  /** Base dot radius, multiplied by a per-dot size variance. */
  baseDotSize?: number;
  /** Hard cap on the number of sampled dots. */
  maxDots?: number;
  /** Primary dot color. Accepts hex or `var(--token)`. */
  primaryColor?: string;
  /** Secondary dot color. Accepts hex or `var(--token)`. */
  secondaryColor?: string;
}

export interface CanvasConfig {
  /** Fallback canvas size (px) when the container has not been measured. */
  defaultSize?: number;
  /** Canvas height as a fraction of its width when no explicit height is set. */
  heightRatio?: number;
  /** Upper bound (px) on the derived canvas height. */
  maxHeight?: number;
  /** p5 pixelDensity. 1 keeps the engine cheap; the renderer defaults to 1. */
  pixelDensity?: number;
}

export interface PerformanceConfig {
  respectReducedMotion?: boolean;
  pauseWhenOffscreen?: boolean;
  pauseWhenTabHidden?: boolean;
  disableMouseInteractionOnMobile?: boolean;
  /**
   * Workload tier. `"auto"` (the default) picks a tier from the active
   * breakpoint — phone → `"low"`, tablet → `"medium"`, desktop → `"high"` — and
   * applies workload caps (max dots, bouncer count, frame rate, pixel density,
   * physics) *after* responsive proportional scaling. An explicit value
   * (`"low" | "medium" | "high"`) is always respected and overrides the
   * breakpoint heuristic. Caps only reduce workload; they never touch design
   * proportions (dot size/spacing, jitter, amplitude) — those stay owned by
   * responsive scaling, so the two systems do not double-shrink the design.
   */
  quality?: "auto" | "low" | "medium" | "high";
  /**
   * Optional cap on the p5 draw rate, in frames per second. `0` (the default)
   * or unset leaves p5 at its native ~60fps. When set, idle-oscillation timing
   * is kept wall-clock stable so motion speed does not change with the cap.
   * The `"low"` quality tier fills this in (30fps) when left unset.
   */
  targetFps?: number;
  /**
   * Optional cap on the p5 `pixelDensity`. `0` (the default) or unset leaves the
   * configured `canvas.pixelDensity` (itself defaulting to 1) untouched. When
   * set, the effective density is `min(canvas.pixelDensity, maxPixelDensity)` —
   * the single biggest fill-rate lever on high-DPI phones. The `"low"` tier
   * fills this in (1) when left unset.
   */
  maxPixelDensity?: number;
}

/**
 * Optional radial gradient glow rendered as a CSS layer behind the canvas.
 * Useful for the subtle ambient light seen behind the particle logo in hero sections.
 */
export interface GlowConfig {
  /** CSS color for the glow (hex, rgba, or var token). Include opacity in the color itself, e.g. "rgba(45,156,219,0.5)". */
  color: string;
  /** Ellipse width as a fraction of the container width (0–1). Default 0.4. */
  width?: number;
  /** Ellipse height as a fraction of the container height (0–1). Default 0.4. */
  height?: number;
  /** Horizontal center as a fraction of width (0–1). Default 0.5. */
  x?: number;
  /** Vertical center as a fraction of height (0–1). Default 0.5. */
  y?: number;
  /** Overall div opacity (0–1). Default 0.3. */
  opacity?: number;
  /**
   * When `true` (default), the glow ellipse dimensions (`width`/`height`) are
   * multiplied by the same responsive scale factor used for the particle image,
   * keeping the glow proportionally sized to the icon at every canvas size.
   * Set to `false` to use the raw fraction values regardless of canvas size.
   */
  responsive?: boolean;
}

/** Visual effects rendered as CSS layers (not p5 canvas). */
export interface EffectsConfig {
  glow?: GlowConfig;
}

/**
 * Responsive behavior. Combines two independent mechanisms:
 *
 * 1. **Proportional scaling** (enabled/referenceWidth/.../scale* flags) — derives
 *    a scale factor from the *rendered canvas size* and scales visual values
 *    (dot size, spacing, amplitude, density) so the design stays proportional
 *    across desktop/tablet/mobile. Applied as the final step on the resolved config.
 *
 * 2. **Breakpoint overrides** (mobile/tablet/desktop) — partial config layers
 *    keyed off the *viewport width*, merged in before compat/user config.
 *    Breakpoints: mobile < 768px, tablet 768–1023px, desktop ≥ 1024px.
 */
export interface ResponsiveConfig {
  /** Master switch for proportional scaling. Default true. */
  enabled?: boolean;
  /** Reference width the scale factor is measured against. Default 900. */
  referenceWidth?: number;
  /** Reference height the scale factor is measured against. Default 540. */
  referenceHeight?: number;
  /** Lower clamp on the derived scale factor. Default 0.65. */
  minScale?: number;
  /** Upper clamp on the derived scale factor. Default 1.25. */
  maxScale?: number;
  /** Scale `visual.dotSpacing` by the scale factor. Default true. */
  scaleDotSpacing?: boolean;
  /** Scale `visual.baseDotSize` by the scale factor. Default true. */
  scaleBaseDotSize?: boolean;
  /** Scale `visual.jitter` by the scale factor. Default false (jitter already scales via dotSpacing). */
  scaleJitter?: boolean;
  /** Scale `animation.amplitudeMin/Max` by the scale factor. Default true. */
  scaleAmplitude?: boolean;
  /** Scale `visual.sizeMin/Max` by the scale factor. Default false (baseDotSize already scales dot size). */
  scaleSizeMinMax?: boolean;
  /** Scale `visual.maxDots` by canvas *area*. Default true. */
  scaleMaxDots?: boolean;
  /** Scale `visual.bouncingParticlesCount` by canvas *area*. Default true. */
  scaleBouncingParticles?: boolean;
  /** Floor for area-scaled `maxDots` so the silhouette stays recognizable. Default 250. */
  minDots?: number;
  /** Floor for area-scaled `bouncingParticlesCount`. Default 6. */
  minBouncingParticles?: number;

  // --- Breakpoint overrides (viewport-keyed partial config layers) ---
  mobile?: Partial<ParticleImageConfig>;
  tablet?: Partial<ParticleImageConfig>;
  desktop?: Partial<ParticleImageConfig>;
}

/** The proportional-scaling settings after resolution (breakpoint partials excluded). */
export interface ResolvedResponsiveConfig {
  enabled: boolean;
  referenceWidth: number;
  referenceHeight: number;
  minScale: number;
  maxScale: number;
  scaleDotSpacing: boolean;
  scaleBaseDotSize: boolean;
  scaleJitter: boolean;
  scaleAmplitude: boolean;
  scaleSizeMinMax: boolean;
  scaleMaxDots: boolean;
  scaleBouncingParticles: boolean;
  minDots: number;
  minBouncingParticles: number;
}

/**
 * Public config object. Every section and field is optional; unset values fall
 * back through the merge chain (defaults → preset → responsive → compat → user).
 */
export interface ParticleImageConfig {
  layout?: ImageLayoutConfig;
  animation?: AnimationConfig;
  physics?: PhysicsConfig;
  visual?: VisualConfig;
  canvas?: CanvasConfig;
  performance?: PerformanceConfig;
  effects?: EffectsConfig;
  /** Breakpoint-specific overrides. Applied before compat/user config in the merge chain. */
  responsive?: ResponsiveConfig;
}

/**
 * The result of merging the full config chain: every section is present and
 * fully populated. This is what the renderer consumes.
 */
export interface ResolvedParticleImageConfig {
  layout: Required<ImageLayoutConfig>;
  animation: Required<AnimationConfig>;
  physics: Required<PhysicsConfig>;
  visual: Required<VisualConfig>;
  canvas: Required<CanvasConfig>;
  performance: Required<PerformanceConfig>;
  /** Effects are optional — glow is absent unless explicitly configured. */
  effects: EffectsConfig;
  /** Resolved proportional-scaling settings (breakpoint partials excluded). */
  responsive: ResolvedResponsiveConfig;
}

/**
 * @deprecated Use `config.layout.position` instead.
 * Simple fractional positioning for the icon inside the canvas.
 */
export interface IconPositionProp {
  /** Horizontal center of the icon as a fraction of canvas width (0–1). */
  x?: number;
  /** Vertical center of the icon as a fraction of canvas height (0–1). */
  y?: number;
}

export interface ParticleImageProps {
  /** Path to the logo/image to sample into particles. Optional when mode="particles". */
  imagePath?: string;
  /**
   * Rendering mode.
   * - "image": sample `imagePath` into dots (requires imagePath)
   * - "particles": bouncing ambient particles only — imagePath not needed
   * - "auto" (default): "particles" if no imagePath, otherwise "image"
   */
  mode?: ParticleImageMode;
  preset?: ParticleImagePreset;
  config?: Partial<ParticleImageConfig>;
  className?: string;
  width?: number;
  height?: number;

  // Top-level migration-compatibility props. Normalized into the config model.
  canvasSize?: number;
  dotSpacing?: number;
  baseDotSize?: number;
  maxDots?: number;
  primaryColor?: string;
  secondaryColor?: string;
  /**
   * @deprecated Use `mode="particles"` instead.
   * When true, only ambient bouncing particles render.
   */
  hideImageShape?: boolean;
  /**
   * @deprecated Use `config.effects.glow` instead.
   * Optional radial gradient glow rendered behind the canvas.
   */
  glow?: GlowConfig;
  /**
   * @deprecated Use `config.layout.position` instead.
   * Fractional position of the icon within the canvas (both axes 0–1).
   * Overrides all preset/config layout offset fields — fully responsive.
   */
  iconPosition?: IconPositionProp;
  /**
   * Dev/diagnostics opt-in. When `true`, the component collects runtime metrics
   * (canvas size, particle counts, draw timing, loop/visibility state, last
   * lifecycle action, resolved quality/breakpoint) on a light polling interval
   * and exposes them via the component ref's `getMetrics()`. The component does
   * not render any visible overlay itself — consumers (e.g. the playground)
   * present the metrics. Defaults to `false`, in which case no interval runs and
   * there is zero overhead; rendering is identical either way.
   */
  debug?: boolean;
}
