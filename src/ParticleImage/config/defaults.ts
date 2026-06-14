import type {
  ResolvedParticleImageConfig,
  ResolvedResponsiveConfig,
} from "../types";

/**
 * Baseline proportional-scaling settings. Presets and user config may override
 * individual fields. `enabled: true` means responsiveness works out of the box.
 */
export const DEFAULT_RESPONSIVE: ResolvedResponsiveConfig = {
  enabled: true,
  referenceWidth: 900,
  referenceHeight: 540,
  minScale: 0.65,
  maxScale: 1.25,
  scaleDotSpacing: true,
  scaleBaseDotSize: true,
  // jitter scales implicitly through dotSpacing (jitterMax = jitter * dotSpacing),
  // so the fraction itself stays constant by default.
  scaleJitter: false,
  scaleAmplitude: true,
  // dot size already scales via baseDotSize; scaling the size range too would
  // double-shrink dots, so this is off by default.
  scaleSizeMinMax: false,
  scaleMaxDots: true,
  scaleBouncingParticles: true,
  minDots: 250,
  minBouncingParticles: 6,
};

/**
 * Shared baseline config. Presets, compatibility props, and user overrides all
 * layer on top of this. Default colors are a neutral blue palette; pass
 * `primaryColor`/`secondaryColor` props or `config.visual.primaryColor/secondaryColor`
 * to use your own brand colors.
 */
export const DEFAULT_CONFIG: ResolvedParticleImageConfig = {
  layout: {
    scale: 0.36,
    horizontalPosition: "right",
    horizontalOffset: 0,
    mobileHorizontalOffset: 0,
    verticalPosition: 0.5,
    verticalOffset: 0.05,
    position: {},
    fit: "contain",
    overflow: "visible",
    pointerEvents: "auto",
  },
  animation: {
    enabled: true,
    introEnabled: true,
    introDuration: 7000,
    introDelayMin: 0,
    introDelayMax: 5000,
    introDurationMin: 1000,
    introDurationMax: 3000,
    amplitudeMin: 3,
    amplitudeMax: 6,
    speedMin: 7,
    speedMax: 8.5,
    animationTypes: ["vertical", "horizontal", "circular", "diagonal"],
    frameRate: 22.0,
    flyInFromWholePage: false,
    particlesVisibleOutsideComponent: false,
  },
  physics: {
    enabled: true,
    repulsionRadius: 300,
    attractionRadius: 300,
    repulsionStrength: 8,
    attractionStrength: 4.5,
    damping: 0.92,
    returnStrength: 0.08,
    repulsionNoise: 0.15,
  },
  visual: {
    opacityMin: 180,
    opacityMax: 240,
    sizeMin: 0.75,
    sizeMax: 1.5,
    jitter: 0.25,
    primaryColorProbability: 0.6,
    alphaThreshold: 128,
    bouncingParticlesCount: 40,
    bouncingParticlesSpeedMin: 1,
    bouncingParticlesSpeedMax: 3,
    // Normalized compatibility fields (formerly top-level props).
    dotSpacing: 6,
    baseDotSize: 1.6,
    maxDots: 2200,
    primaryColor: "#2d9cdb",
    secondaryColor: "#56ccf2",
  },
  canvas: {
    defaultSize: 500,
    heightRatio: 0.6,
    maxHeight: 480,
    pixelDensity: 1,
  },
  performance: {
    respectReducedMotion: true,
    pauseWhenOffscreen: true,
    pauseWhenTabHidden: true,
    disableMouseInteractionOnMobile: true,
    // "auto" resolves to a tier from the breakpoint (phone→low, tablet→medium,
    // desktop→high). Desktop therefore keeps full quality with no caps.
    quality: "auto",
    // 0 = uncapped (native p5 ~60fps). Preserves current default behavior.
    targetFps: 0,
    // 0 = uncapped (use canvas.pixelDensity, which itself defaults to 1).
    maxPixelDensity: 0,
  },
  effects: {},
  responsive: DEFAULT_RESPONSIVE,
};
