# @patchpoint/ui

React UI component library. Currently ships **ParticleImage** — a client-only component that samples a PNG/logo into animated dots via a dynamically imported [p5](https://p5js.org/) sketch.

Created by [Patchpoint](https://patchpoint.se). Also see [joinbics.se](https://joinbics.se).

## Status

`ParticleImage` is a **single unified component with one engine**. Behavior is driven by `preset`, top-level compatibility props, and `config` — there are no project-specific wrapper components and no built-in brand presets.

This is the first functional release. It is intentionally **not yet performance-optimized** (no WebGL, workers, or OffscreenCanvas). The goal is a correct, working, reusable component.

## Installation

```bash
npm install @patchpoint/ui
```

Peer dependencies (must be installed in the consuming app):

```bash
npm install react react-dom
```

`p5` is a direct dependency and is **dynamically imported** at runtime (client-only), so it never runs during SSR and is code-split out of the initial bundle.

## Usage

The image path always comes from the consuming app. Pass colors via props or `config.visual`.

### Subpath import (recommended)

```tsx
import { ParticleImage } from "@patchpoint/ui/ParticleImage";

<ParticleImage
  preset="hero"
  imagePath="/images/logos/example.png"
  primaryColor="#2d9cdb"
  secondaryColor="#56ccf2"
/>;
```

### Root import

```tsx
import { ParticleImage } from "@patchpoint/ui";

<ParticleImage
  preset="hero"
  imagePath="/images/hero.png"
  width={800}
  height={400}
/>;
```

### Migration-compatibility props

Flat props from earlier implementations are still supported and normalized internally:

```tsx
<ParticleImage
  preset="compact"
  imagePath="/icons/badge.png"
  canvasSize={600}
  dotSpacing={6}
  baseDotSize={1.35}
  maxDots={900}
  primaryColor="var(--color-primary)"
  secondaryColor="var(--color-secondary)"
/>
```

Colors accept hex (`#2d9cdb`) or CSS custom properties (`var(--color-primary)`), resolved against the component container at runtime.

### Custom config override

```tsx
import { ParticleImage } from "@patchpoint/ui/ParticleImage";

<ParticleImage
  preset="background"
  imagePath="/images/logo.png"
  config={{
    layout: { horizontalPosition: "center", verticalOffset: -0.1 },
    visual: { maxDots: 1400, bouncingParticlesCount: 20 },
    animation: { flyInFromWholePage: true },
  }}
/>;
```

> **Tip:** pass a stable `config` reference. Changing the resolved config (or `imagePath`, dimensions, or `preset`) restarts the p5 sketch and replays the intro.

## API

### Props

```ts
interface ParticleImageProps {
  imagePath?: string;
  mode?: "auto" | "image" | "particles";
  preset?: "hero" | "background" | "contained" | "compact" | "static";
  config?: Partial<ParticleImageConfig>;
  className?: string;
  width?: number;
  height?: number;

  // Top-level migration-compatibility props (normalized into config):
  canvasSize?: number;
  dotSpacing?: number;
  baseDotSize?: number;
  maxDots?: number;
  primaryColor?: string;
  secondaryColor?: string;
}
```

Defaults when omitted: `mode="auto"`, `preset="hero"`.

### Config model

```ts
interface ParticleImageConfig {
  layout?: ImageLayoutConfig;
  animation?: AnimationConfig;
  physics?: PhysicsConfig;
  visual?: VisualConfig;
  canvas?: CanvasConfig;
  performance?: PerformanceConfig;
  effects?: EffectsConfig;
  responsive?: ResponsiveConfig;
}
```

See [`src/ParticleImage/README.md`](src/ParticleImage/README.md) for the full config reference, presets, responsive scaling, and quality tiers.

### Presets

| Preset       | Intent                                                                  |
| ------------ | ----------------------------------------------------------------------- |
| `hero`       | Wide hero sections — full intro, oscillation, physics.                   |
| `background` | Decorative background mode: softer, more ambient particles.             |
| `contained`  | Bounded containers — clipped, centered layout.                        |
| `compact`    | Smaller inline slots (podium, badge, avatar).                          |
| `static`     | No active animation after initial render — weak devices / reduced motion. |

### Config merge order

1. Shared defaults (`DEFAULT_CONFIG`)
2. Preset config
3. `responsive[breakpoint]` (preset-defined, then user-defined)
4. Top-level compatibility props (`canvasSize`, `dotSpacing`, …)
5. User `config` prop overrides

## Features

- `"use client"` boundary and client-only rendering (no SSR canvas).
- Dynamic `p5` import (code-split, never imported at the top level).
- Image sampling from alpha with grid spacing, jitter, size variance, and a `maxDots` cap.
- CSS-variable color resolution (`var(--token)` → rgb).
- Responsive canvas sizing via `ResizeObserver` + window-resize fallback.
- Reduced-motion support (lands particles, stops the loop).
- Offscreen pause (`IntersectionObserver`) and tab-hidden pause (`visibilitychange`).
- Intro fly-in with per-particle delay/duration and ease-out.
- Optional ambient bouncing particles.
- Mouse/touch repulsion + outer attraction + damping + return physics.
- Full-viewport / outside-component particle mode.
- p5 cleanup on unmount and host clearing to prevent duplicate canvases.
- Image-load failure → circular-mask fallback.

## Playground

A local demo app lives in `playground/`. It is **not published to npm**.

```bash
npm install
npm run playground
```

The playground includes an **All Props** editor with live preview, color presets, and optional debug metrics.

## Development

```bash
npm install
npm run typecheck
npm run build
```

## License

MIT
