# ParticleImage

React component that samples a PNG/logo into animated dots (p5 sketch, client-only).
Behavior is driven by `preset`, top-level compatibility props, and `config` — there are
no project-specific wrapper components.

## Quick start

```tsx
import { ParticleImage } from "@patchpoint/ui/ParticleImage";

<ParticleImage
  preset="hero"
  imagePath="/images/logo.png"
  width={800}
  height={480}
/>;
```

## Full example (all props & options)

Every prop and config field in one place. In practice you only set what you need;
unset values fall through defaults → preset → breakpoint overrides → your props/config.

```tsx
import { ParticleImage } from "@patchpoint/ui/ParticleImage";
import type { ParticleImageConfig } from "@patchpoint/ui/ParticleImage";

const config: Partial<ParticleImageConfig> = {
  layout: {
    scale: 0.36, // image draw size as fraction of canvas width
    horizontalPosition: "center", // "left" | "center" | "right" | number (0–1)
    horizontalOffset: 0, // px, after anchoring
    mobileHorizontalOffset: 0, // extra px on phone widths
    verticalPosition: 0.5, // 0–1 fraction of canvas height
    verticalOffset: 0.05, // fraction of canvas height
    position: { x: 0.5, y: 0.48 }, // wins over offset fields when set
    fit: "contain", // "contain" | "cover" | "fill"
    overflow: "visible", // "hidden" | "visible"
    pointerEvents: "auto", // "none" | "auto"
  },
  animation: {
    enabled: true,
    introEnabled: true,
    introDuration: 7000, // ms window for all intro fly-ins
    introDelayMin: 0,
    introDelayMax: 5000,
    introDurationMin: 1000,
    introDurationMax: 3000,
    amplitudeMin: 3,
    amplitudeMax: 6,
    speedMin: 7,
    speedMax: 8.5,
    animationTypes: ["vertical", "horizontal", "circular", "diagonal"],
    frameRate: 22, // idle time divisor (lower = faster)
    flyInFromWholePage: false,
    particlesVisibleOutsideComponent: false, // true → full-viewport background
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
    dotSpacing: 6,
    baseDotSize: 1.6,
    maxDots: 2200,
    primaryColor: "#2d9cdb", // hex or var(--token)
    secondaryColor: "#56ccf2",
  },
  canvas: {
    defaultSize: 500, // fallback width when container is unmeasured
    heightRatio: 0.6, // height = width × ratio when height is omitted
    maxHeight: 480,
    pixelDensity: 1,
  },
  performance: {
    respectReducedMotion: true,
    pauseWhenOffscreen: true,
    pauseWhenTabHidden: true,
    disableMouseInteractionOnMobile: true,
    quality: "auto", // "auto" | "low" | "medium" | "high"
    targetFps: 0, // 0 = uncapped (~60fps)
    maxPixelDensity: 0, // 0 = uncapped (uses canvas.pixelDensity)
  },
  effects: {
    glow: {
      color: "rgba(45,156,219,0.55)",
      width: 0.4, // ellipse width as fraction of container
      height: 0.4,
      x: 0.5, // center as fraction of width
      y: 0.5,
      opacity: 0.3,
      responsive: true, // scale glow with canvas (default true)
    },
  },
  responsive: {
    enabled: true,
    referenceWidth: 900,
    referenceHeight: 540,
    minScale: 0.65,
    maxScale: 1.25,
    scaleDotSpacing: true,
    scaleBaseDotSize: true,
    scaleJitter: false,
    scaleAmplitude: true,
    scaleSizeMinMax: false,
    scaleMaxDots: true,
    scaleBouncingParticles: true,
    minDots: 250,
    minBouncingParticles: 6,
    // Viewport-keyed partial overrides (mobile <768, tablet 768–1023, desktop ≥1024):
    mobile: { visual: { bouncingParticlesCount: 12 } },
    tablet: {},
    desktop: {},
  },
};

<ParticleImage
  ref={particleImageRef} // optional: ref.getMetrics() when debug={true}
  imagePath="/images/logo.png"
  mode="auto" // "auto" | "image" | "particles"
  preset="hero" // "hero" | "background" | "contained" | "compact" | "static"
  className="my-particle-image"
  width={800}
  height={480}
  debug={false} // dev-only metrics via ref.getMetrics()
  // Top-level compat props (normalized into config.visual / config.canvas):
  canvasSize={500}
  dotSpacing={6}
  baseDotSize={1.6}
  maxDots={2200}
  primaryColor="#2d9cdb"
  secondaryColor="#56ccf2"
  // Deprecated — prefer config / mode instead:
  hideImageShape={false} // → use mode="particles"
  glow={{ color: "rgba(45,156,219,0.55)", width: 0.5, height: 0.5 }} // → config.effects.glow
  iconPosition={{ x: 0.5, y: 0.48 }} // → config.layout.position
  config={config}
/>;
```

> **Tip:** keep `config` referentially stable (`useMemo`). Changing the resolved config,
> `imagePath`, dimensions, or `preset` restarts the p5 sketch and replays the intro.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `imagePath` | `string` | — | Logo/image to sample. Optional when `mode="particles"`. |
| `mode` | `"auto" \| "image" \| "particles"` | `"auto"` | `"image"` samples the logo; `"particles"` is ambient bouncers only; `"auto"` picks from `imagePath`. |
| `preset` | `"hero" \| "background" \| "contained" \| "compact" \| "static"` | `"hero"` | Starting config layer. See [Presets](#presets). |
| `config` | `Partial<ParticleImageConfig>` | — | Overrides merged on top of defaults + preset. |
| `className` | `string` | — | Applied to the outer wrapper. |
| `width` | `number` | measured / `canvas.defaultSize` | Canvas width in px. |
| `height` | `number` | `width × heightRatio` (capped) | Canvas height in px. |
| `debug` | `boolean` | `false` | When `true`, exposes runtime metrics via `ref.getMetrics()`. |
| `canvasSize` | `number` | — | Compat alias for `config.canvas.defaultSize`. |
| `dotSpacing` | `number` | — | Compat alias for `config.visual.dotSpacing`. |
| `baseDotSize` | `number` | — | Compat alias for `config.visual.baseDotSize`. |
| `maxDots` | `number` | — | Compat alias for `config.visual.maxDots`. |
| `primaryColor` | `string` | — | Compat alias for `config.visual.primaryColor`. |
| `secondaryColor` | `string` | — | Compat alias for `config.visual.secondaryColor`. |
| `hideImageShape` | `boolean` | `false` | **Deprecated.** Use `mode="particles"`. |
| `glow` | `GlowConfig` | — | **Deprecated.** Use `config.effects.glow`. |
| `iconPosition` | `{ x?, y? }` | — | **Deprecated.** Use `config.layout.position`. |

## Config sections

All sections are optional. Types are exported from `@patchpoint/ui/ParticleImage`.

| Section | Purpose |
|---------|---------|
| `layout` | Where and how the sampled silhouette sits in the canvas. |
| `animation` | Intro fly-in, idle oscillation, full-viewport mode. |
| `physics` | Mouse/touch repulsion, attraction, damping. |
| `visual` | Dot sampling, colors, opacity, size variance, ambient bouncers. |
| `canvas` | Default size derivation and p5 `pixelDensity`. |
| `performance` | Reduced motion, pause when offscreen/hidden, quality tier. |
| `effects` | CSS layers behind the canvas (radial glow). |
| `responsive` | Proportional scaling by canvas size + viewport breakpoint overrides. |

## Presets

| Preset | Intent | Reference size |
|--------|--------|----------------|
| `hero` | Wide hero sections — full intro, oscillation, physics. | 1100 × 600 |
| `background` | Decorative full-area / viewport-like treatment. | 1440 × 800 |
| `contained` | Cards and bounded containers — clipped, no pointer events. | 480 × 440 |
| `compact` | Smaller inline slots (e.g. podium). | 600 × 600 |
| `static` | No animation after initial render — weak devices / reduced motion. | 900 × 540 |

## Modes

| Mode | Behavior |
|------|----------|
| `auto` | `"particles"` when no `imagePath`, otherwise `"image"`. |
| `image` | Sample `imagePath` into dots (requires `imagePath`). |
| `particles` | Ambient bouncing particles only — no logo silhouette. |

## Config merge order

Later layers override earlier ones:

1. Shared defaults (`DEFAULT_CONFIG`)
2. Preset config
3. `responsive[breakpoint]` (preset-defined, then user-defined)
4. Top-level compat props (`canvasSize`, `dotSpacing`, …)
5. Deprecated `glow` prop → `config.effects.glow`
6. User `config` prop
7. Deprecated `iconPosition` prop → `config.layout.position` (highest)

Two further steps run in the component on the merged result:

- `applyMobileOverrides()` — legacy mobile field overrides
- `applyResponsiveScaling()` — proportional scaling by rendered canvas size
- `applyQualityCaps()` — workload caps from the quality tier

## Helpers (exported)

- `resolveParticleImageConfig(options)` — full merge → resolved config
- `applyResponsiveScaling(resolved, w, h)` — final proportional scaling step
- `computeResponsiveScaleFactor(resolved.responsive, w, h)` — just the factor
- `applyQualityCaps`, `resolveQuality` — quality tier workload caps
- `DEFAULT_CONFIG`, `DEFAULT_RESPONSIVE` — baseline values
- `getPresetConfig(preset)` — raw preset partial

The playground (`/`) includes a live **All Props** editor with a debug panel showing
resolved values as you resize the preview (enable `debug` to feed performance metrics).

---

# Responsive scaling

`ParticleImage` scales its particle design proportionally to the **rendered canvas
size** so it looks consistent on desktop, tablet, and mobile without per-call tuning.
Small canvases don't look chunky or overcrowded; large canvases don't look sparse;
the logo silhouette stays recognizable.

This is **on by default** — normal use needs no configuration.

## How it works

Two independent mechanisms live under `config.responsive`:

1. **Proportional scaling** (`enabled`, `referenceWidth/Height`, `minScale/maxScale`,
   `scale*` flags) — derives a scale factor from the rendered canvas size and scales
   visual values. Applied as the **final** step on the resolved config, after the full
   merge chain and after mobile overrides.
2. **Breakpoint overrides** (`mobile` / `tablet` / `desktop`) — partial config layers
   keyed off the **viewport width**, merged in before compat/user config.
   (mobile `< 768px`, tablet `768–1023px`, desktop `≥ 1024px`.)

### Scale factor

```ts
scaleFactor = clamp(
  Math.min(canvasWidth / referenceWidth, canvasHeight / referenceHeight),
  minScale,   // default 0.65
  maxScale,   // default 1.25
);
```

### What scales (defaults)

| Value | Scales by | Default | Notes |
|-------|-----------|---------|-------|
| `visual.dotSpacing` | linear factor | ✅ on | keeps logo dot-count ~constant |
| `visual.baseDotSize` | linear factor | ✅ on | dots shrink/grow with canvas |
| `animation.amplitudeMin/Max` | linear factor | ✅ on | movement stays proportional |
| `visual.maxDots` | **area** ratio | ✅ on | floored at `minDots` (250) |
| `visual.bouncingParticlesCount` | **area** ratio | ✅ on | floored at `minBouncingParticles` (6) |
| `visual.jitter` | linear factor | ⬜ off | already scales via `dotSpacing` |
| `visual.sizeMin/sizeMax` | linear factor | ⬜ off | dot size already scales via `baseDotSize` |

`maxDots` uses **area**, not linear scale, so density (dots per unit area) stays
roughly constant rather than collapsing on small canvases:

```ts
areaScale     = clamp((canvasWidth * canvasHeight) / (referenceWidth * referenceHeight), 0, 1);
scaledMaxDots = clamp(round(baseMaxDots * areaScale), min(minDots, baseMaxDots), baseMaxDots);
```

### Per-preset references

| Preset | reference (w×h) | Intent |
|--------|------------------|--------|
| `hero` | 1100 × 600 | wide hero sections |
| `background` | 1440 × 800 | viewport-like full-area |
| `contained` | 480 × 440 | cards/squares (minScale 0.7, maxScale 1.15) |
| `compact` | 600 × 600 | podium/light |
| `static` / default | 900 × 540 | baseline |

## Note on explicit values

Explicit values you set (via `config.visual` or top-level props like `dotSpacing`)
become the **base** that scaling is applied to. So with scaling enabled they still
scale with canvas size. To pin exact values, disable scaling (globally or per-field).

## Examples

Contained card (default scaling, custom clamps):

```tsx
<ParticleImage
  preset="contained"
  imagePath="/images/logo.png"
  width={420}
  height={420}
  config={{
    responsive: { enabled: true, minScale: 0.65, maxScale: 1.1 },
  }}
/>
```

Disable scaling entirely (pin values exactly as configured):

```tsx
<ParticleImage
  preset="hero"
  imagePath="/images/logo.png"
  config={{ responsive: { enabled: false } }}
/>
```

Disable specific scaling dimensions:

```tsx
<ParticleImage
  imagePath="/images/logo.png"
  config={{
    responsive: { scaleDotSpacing: false, scaleBaseDotSize: false },
  }}
/>
```

Breakpoint override (viewport-keyed) alongside proportional scaling:

```tsx
<ParticleImage
  preset="hero"
  imagePath="/images/logo.png"
  config={{
    responsive: {
      mobile: { visual: { bouncingParticlesCount: 12 } },
    },
  }}
/>
```

## Performance quality (separate system)

Responsive scaling owns **visual proportions**; a separate quality-tier system
(`config.performance.quality`) owns **workload reduction**. `quality: "auto"` (the
default) maps the active breakpoint to a tier — phone → `low`, tablet → `medium`,
desktop → `high` — and caps workload **after** responsive scaling runs:

| Tier | maxDots ceiling | bouncers | targetFps | maxPixelDensity | physics |
|------|-----------------|----------|-----------|-----------------|---------|
| `high` (desktop) | — | — | native | native | on |
| `medium` (tablet) | 1800 | — | native | 2 | on |
| `low` (phone) | 800 | 6 | 30 | 1 | off |

Caps are `min()` clamps that only touch workload knobs (counts, fps, pixel density,
physics) — never design proportions (dot size, spacing, jitter, amplitude). The two
systems therefore never double-shrink the design. Any value a consumer sets
explicitly always wins over a tier cap, and `quality: "high"` disables all caps even
on a phone. See `config/quality.ts`.

> **Still out of scope:** WebGL, Web Workers, OffscreenCanvas, and any renderer
> rewrite. The engine remains a single dynamically-imported p5 sketch.
