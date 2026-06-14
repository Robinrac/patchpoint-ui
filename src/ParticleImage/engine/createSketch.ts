import type { ResolvedParticleImageConfig } from "../types";
import type { Rgb } from "../utils/color";

type P5 = any;

export interface SketchParams {
  imageUrl: string;
  width: number;
  height: number;
  config: ResolvedParticleImageConfig;
  primary: Rgb;
  secondary: Rgb;
  isMobile: boolean;
  staticRender: boolean;
  disableMouse: boolean;
  hideImageShape: boolean;
  /** When true, skip image loading entirely — only bouncing particles render. */
  skipImage?: boolean;
  /** Used to offset logo placement in full-viewport mode (non-center layouts). */
  getContainerOffset?: () => { x: number; y: number };
}

interface Dot {
  bx: number;
  by: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rgb: Rgb;
  opacity: number;
  animType: "vertical" | "horizontal" | "circular" | "diagonal";
  amp: number;
  speed: number;
  phase: number;
  delay: number;
  dur: number;
  sx: number;
  sy: number;
  hasLanded: boolean;
}

interface Bouncer {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rgb: Rgb;
  opacity: number;
  delay: number;
  dur: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  hasLanded: boolean;
}

/** Live runtime metrics, read by the dev-only debug overlay. */
export interface SketchMetrics {
  dotCount: number;
  bouncerCount: number;
  lastDrawMs: number;
  avgDrawMs: number;
  worstDrawMs: number;
  lastAction: "init" | "resize-fast" | "regenerate";
  genCacheHit: boolean;
}

/**
 * Imperative handle returned alongside the p5 sketch. Lets the React wrapper
 * push canvas-size changes WITHOUT tearing down and recreating the p5 instance
 * (no canvas recreate, no image reload). Particle base positions are re-derived
 * from the already-loaded image (pixel sampling is cached — see SAMPLE_CACHE).
 */
export interface SketchController {
  /** Reshape the canvas and reproject particles for the new size + scaled config. */
  resize: (width: number, height: number, config: ResolvedParticleImageConfig) => void;
  /** Snapshot current metrics. Resets the rolling "worst draw" window. */
  getMetrics: () => SketchMetrics;
}

const OFF_SCREEN_MARGIN = 100;
/**
 * Max share of the canvas height the sampled silhouette may occupy under the
 * default "contain" fit. Leaves headroom for dot radius, jitter and idle
 * oscillation so the icon never clips the top/bottom edge on short canvases.
 */
const IMAGE_CONTAIN_HEIGHT_FRACTION = 0.9;
const easeOut = (t: number): number => t * (2 - t);

/**
 * Module-level cache of *pixel-sampled* base positions, in image-display-local
 * coordinates (jitter/offset/shuffle are applied per-build on top, so they stay
 * cheap and don't pollute the key). This is the single expensive operation
 * (createGraphics + loadPixels + grid scan); caching it removes pixel sampling
 * from the resize fast-path entirely.
 *
 * Key inputs: imageUrl, rounded display size, sampling step, alpha threshold —
 * i.e. exactly the inputs that change which pixels are collected. Color, jitter,
 * canvas offset, density cap and animation state are NOT keyed (they're applied
 * later or are per-instance).
 */
const SAMPLE_CACHE = new Map<string, Array<{ x: number; y: number }>>();
const SAMPLE_CACHE_LIMIT = 16;

function cacheGet(key: string): Array<{ x: number; y: number }> | undefined {
  return SAMPLE_CACHE.get(key);
}

function cacheSet(key: string, value: Array<{ x: number; y: number }>): void {
  if (SAMPLE_CACHE.size >= SAMPLE_CACHE_LIMIT) {
    const oldest = SAMPLE_CACHE.keys().next().value;
    if (oldest !== undefined) SAMPLE_CACHE.delete(oldest);
  }
  SAMPLE_CACHE.set(key, value);
}

/**
 * Builds a p5 sketch: global intro window, ease-out fly-in toward animated targets,
 * mouse repulsion + outer attraction, velocity-based return/damping, and
 * bouncing ambient particles.
 *
 * Returns the sketch plus an imperative {@link SketchController} so the wrapper
 * can resize/reproject in place instead of recreating the instance.
 */
export function createSketch(params: SketchParams): {
  sketch: (p: P5) => void;
  controller: SketchController;
} {
  const {
    imageUrl,
    primary,
    secondary,
    staticRender,
    disableMouse,
    hideImageShape,
    skipImage = false,
    getContainerOffset,
  } = params;

  // Mutable engine state. `cfg`, `width`, `height` are updated in place by the
  // controller on resize so the draw loop and (re)generation always read current
  // values without a teardown.
  const state = {
    cfg: params.config,
    width: params.width,
    height: params.height,
    img: null as { width: number; height: number; pixels: number[] } | null,
    imageFailed: false,
  };

  const metrics: SketchMetrics = {
    dotCount: 0,
    bouncerCount: 0,
    lastDrawMs: 0,
    avgDrawMs: 0,
    worstDrawMs: 0,
    lastAction: "init",
    genCacheHit: false,
  };
  let frames = 0;

  const useFullViewport = state.cfg.animation.particlesVisibleOutsideComponent;

  // Assigned inside p.setup once the canvas exists. Until then the controller is
  // a no-op (new p5() runs setup synchronously, so this is wired before the
  // wrapper ever calls resize).
  const controller: SketchController = {
    resize: () => {},
    getMetrics: () => {
      const snapshot = { ...metrics };
      metrics.worstDrawMs = 0; // worst is reported per polling window
      return snapshot;
    },
  };

  const sketch = (p: P5) => {
    let dots: Dot[] = [];
    let bouncers: Bouncer[] = [];
    let sketchStartTime = 0;

    // Uniform random in [min, max). `randRange` is a readability alias used at
    // call sites that pick from a configured min/max range.
    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    const randRange = rand;

    const pickColor = (): Rgb =>
      Math.random() < state.cfg.visual.primaryColorProbability ? primary : secondary;

    const clampIntroDelay = (delay: number, dur: number) =>
      Math.min(delay, state.cfg.animation.introDuration - dur);

    const spawnPoint = (): { x: number; y: number } => {
      const { width, height } = state;
      if (state.cfg.animation.flyInFromWholePage) {
        const vw = typeof window !== "undefined" ? window.innerWidth : width;
        const vh = typeof window !== "undefined" ? window.innerHeight : height;
        return {
          x: rand(-OFF_SCREEN_MARGIN, vw + OFF_SCREEN_MARGIN),
          y: rand(-OFF_SCREEN_MARGIN, vh + OFF_SCREEN_MARGIN),
        };
      }
      const side = Math.floor(rand(0, 4));
      switch (side) {
        case 0:
          return { x: -OFF_SCREEN_MARGIN - rand(0, 50), y: rand(0, height) };
        case 1:
          return { x: width + OFF_SCREEN_MARGIN + rand(0, 50), y: rand(0, height) };
        case 2:
          return { x: rand(0, width), y: -OFF_SCREEN_MARGIN - rand(0, 50) };
        default:
          return { x: rand(0, width), y: height + OFF_SCREEN_MARGIN + rand(0, 50) };
      }
    };

    const layoutOffset = (): { x: number; y: number } => {
      if (!useFullViewport || state.cfg.layout.horizontalPosition === "center") {
        return { x: 0, y: 0 };
      }
      return getContainerOffset?.() ?? { x: 0, y: 0 };
    };

    const makeDot = (bx: number, by: number): Dot => {
      const { animation, visual } = state.cfg;
      const spawn = spawnPoint();
      const types = animation.animationTypes;
      const animType = types[Math.floor(Math.random() * types.length)] ?? "vertical";
      const dur = randRange(animation.introDurationMin, animation.introDurationMax);
      const delay = clampIntroDelay(
        randRange(animation.introDelayMin, animation.introDelayMax),
        dur,
      );

      return {
        bx,
        by,
        x: staticRender ? bx : spawn.x,
        y: staticRender ? by : spawn.y,
        vx: 0,
        vy: 0,
        size: visual.baseDotSize * randRange(visual.sizeMin, visual.sizeMax),
        rgb: pickColor(),
        opacity: randRange(visual.opacityMin, visual.opacityMax),
        animType,
        amp: randRange(animation.amplitudeMin, animation.amplitudeMax),
        speed: randRange(animation.speedMin, animation.speedMax),
        phase: rand(0, Math.PI * 2),
        delay,
        dur,
        sx: spawn.x,
        sy: spawn.y,
        hasLanded: staticRender,
      };
    };

    /**
     * Expensive step: scans the scaled image's alpha channel and returns the
     * collected pixel positions in display-local coordinates. Cached by content
     * key so resizes that land on a previously-seen size skip sampling entirely.
     */
    const sampleLocalPositions = (
      img: { width: number; height: number },
      displayW: number,
      displayH: number,
      step: number,
      alphaThreshold: number,
    ): Array<{ x: number; y: number }> => {
      const key = `${imageUrl}|${Math.round(displayW)}|${Math.round(displayH)}|${step}|${alphaThreshold}`;
      const cached = cacheGet(key);
      if (cached) {
        metrics.genCacheHit = true;
        return cached;
      }
      metrics.genCacheHit = false;

      const buffer = p.createGraphics(Math.ceil(displayW), Math.ceil(displayH));
      buffer.pixelDensity(1);
      buffer.clear();
      buffer.image(img, 0, 0, displayW, displayH);
      buffer.loadPixels();

      const out: Array<{ x: number; y: number }> = [];
      const bw = buffer.width;
      for (let y = 0; y < displayH; y += step) {
        for (let x = 0; x < displayW; x += step) {
          const idx = 4 * (Math.floor(y) * bw + Math.floor(x));
          const alpha = buffer.pixels[idx + 3];
          if (alpha !== undefined && alpha > alphaThreshold) {
            out.push({ x, y });
          }
        }
      }
      buffer.remove();

      cacheSet(key, out);
      return out;
    };

    /** Resolves the image silhouette anchor (top-left) in canvas coordinates. */
    const imageOffset = (displayW: number, displayH: number): { ox: number; oy: number } => {
      const { layout } = state.cfg;
      const { width, height } = state;
      const pos = layout.position;

      let offsetX: number;
      if (pos?.x !== undefined) {
        offsetX = pos.x * width - displayW / 2;
      } else {
        const hp = layout.horizontalPosition;
        if (hp === "left") offsetX = 0;
        else if (hp === "right") offsetX = width - displayW;
        else if (hp === "center") offsetX = (width - displayW) / 2;
        else offsetX = hp * width - displayW / 2;
        offsetX += layout.horizontalOffset;
      }

      let offsetY: number;
      if (pos?.y !== undefined) {
        offsetY = pos.y * height - displayH / 2;
      } else {
        offsetY = height * layout.verticalPosition - displayH / 2 + layout.verticalOffset * height;
      }

      const comp = layoutOffset();
      return { ox: offsetX + comp.x, oy: offsetY + comp.y };
    };

    /** Builds image dots from the loaded image (uses the cached pixel sample). */
    const buildImageDots = (img: { width: number; height: number }): Dot[] => {
      const { layout, visual } = state.cfg;
      const aspect = img.height && img.width ? img.height / img.width : 1;

      // The silhouette is sized as a fraction of the canvas width, but on a
      // wide-but-short canvas a width-derived icon overflows the height and
      // stays large while the (limiting-dimension-scaled) dots spread out around
      // it. Contain it within the canvas height so the icon scales DOWN with the
      // limiting dimension, keeping icon size and dot spacing/density coherent.
      // Only the default "contain" fit clamps; "fill"/"cover" keep width-sizing.
      let displayW = Math.max(1, state.width * layout.scale);
      let displayH = displayW * aspect;
      if (layout.fit !== "fill" && layout.fit !== "cover") {
        const maxH = state.height * IMAGE_CONTAIN_HEIGHT_FRACTION;
        if (displayH > maxH) {
          displayH = maxH;
          displayW = Math.max(1, maxH / aspect);
        }
      }

      const step = Math.max(2, visual.dotSpacing);
      const local = sampleLocalPositions(
        img as { width: number; height: number; pixels: number[] },
        displayW,
        displayH,
        step,
        visual.alphaThreshold,
      );

      const { ox, oy } = imageOffset(displayW, displayH);
      const jitterMax = visual.jitter * step;

      const collected: Array<{ x: number; y: number }> = local.map((pt) => ({
        x: ox + pt.x + rand(-jitterMax, jitterMax),
        y: oy + pt.y + rand(-jitterMax, jitterMax),
      }));

      let chosen = collected;
      if (collected.length > visual.maxDots) {
        for (let i = collected.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [collected[i], collected[j]] = [collected[j], collected[i]];
        }
        chosen = collected.slice(0, visual.maxDots);
      }

      return chosen.map((pt) => makeDot(pt.x, pt.y));
    };

    const buildCircleFallbackDots = (): Dot[] => {
      const { layout, visual } = state.cfg;
      const { width, height } = state;
      const comp = layoutOffset();
      const radius = (width * layout.scale) / 2;
      const pos = layout.position;

      let cx: number;
      if (pos?.x !== undefined) {
        cx = pos.x * width + comp.x;
      } else {
        const hp = layout.horizontalPosition;
        if (typeof hp === "number") cx = hp;
        else if (hp === "left") cx = radius * 0.8;
        else if (hp === "center") cx = width / 2;
        else cx = width - radius * 0.8;
        cx += layout.horizontalOffset + comp.x;
      }

      let cy: number;
      if (pos?.y !== undefined) {
        cy = pos.y * height + comp.y;
      } else {
        cy = height * layout.verticalPosition + layout.verticalOffset * height + comp.y;
      }

      const step = Math.max(2, visual.dotSpacing);
      const collected: Array<{ x: number; y: number }> = [];
      for (let y = cy - radius; y <= cy + radius; y += step) {
        for (let x = cx - radius; x <= cx + radius; x += step) {
          if ((x - cx) ** 2 + (y - cy) ** 2 <= radius * radius) {
            collected.push({ x, y });
          }
        }
      }
      return collected.slice(0, visual.maxDots).map((pt) => makeDot(pt.x, pt.y));
    };

    const buildBouncers = (): Bouncer[] => {
      const { animation, visual } = state.cfg;
      const { width, height } = state;
      const count = staticRender ? 0 : visual.bouncingParticlesCount;
      const result: Bouncer[] = [];
      const margin = visual.baseDotSize * 2;

      for (let i = 0; i < count; i++) {
        const spawn = spawnPoint();
        const tx = rand(margin, width - margin);
        const ty = rand(margin, height - margin);
        const speed = randRange(
          visual.bouncingParticlesSpeedMin,
          visual.bouncingParticlesSpeedMax,
        );
        const dir = rand(0, Math.PI * 2);
        const dur = randRange(animation.introDurationMin, animation.introDurationMax);
        const delay = clampIntroDelay(
          randRange(animation.introDelayMin, animation.introDelayMax),
          dur,
        );

        result.push({
          x: spawn.x,
          y: spawn.y,
          vx: Math.cos(dir) * speed,
          vy: Math.sin(dir) * speed,
          size: visual.baseDotSize * randRange(visual.sizeMin, visual.sizeMax),
          rgb: pickColor(),
          opacity: randRange(visual.opacityMin, visual.opacityMax),
          delay,
          dur,
          sx: spawn.x,
          sy: spawn.y,
          tx,
          ty,
          hasLanded: staticRender,
        });
      }
      return result;
    };

    /**
     * (Re)builds dots + bouncers from current state. `resetIntro` restarts the
     * global intro window; resizes pass false so an already-finished fly-in does
     * NOT replay (particles re-derive at their final positions).
     */
    const regenerate = (resetIntro: boolean) => {
      if (resetIntro || sketchStartTime === 0) sketchStartTime = p.millis();

      if (skipImage) {
        dots = [];
      } else if (state.img) {
        dots = buildImageDots(state.img);
      } else if (state.imageFailed) {
        dots = buildCircleFallbackDots();
      } else {
        dots = []; // image still loading; load callback will regenerate
      }

      bouncers = buildBouncers();
      metrics.dotCount = dots.length;
      metrics.bouncerCount = bouncers.length;
    };

    controller.resize = (
      width: number,
      height: number,
      config: ResolvedParticleImageConfig,
    ) => {
      state.cfg = config;
      state.width = width;
      state.height = height;
      p.resizeCanvas(width, height, true);
      regenerate(false);
      metrics.lastAction = "resize-fast";
      if (staticRender) p.redraw();
    };

    p.setup = () => {
      p.createCanvas(state.width, state.height);
      // Effective pixel density = configured density, capped by maxPixelDensity
      // when set (>0). On high-DPI phones this is the single biggest fill-rate
      // lever; the "low" quality tier sets the cap to 1.
      const basePd = state.cfg.canvas.pixelDensity || 1;
      const maxPd = state.cfg.performance.maxPixelDensity;
      p.pixelDensity(maxPd && maxPd > 0 ? Math.min(basePd, maxPd) : basePd);
      p.noStroke();

      const targetFps = state.cfg.performance.targetFps;
      if (targetFps && targetFps > 0) p.frameRate(targetFps);

      const afterLoad = () => {
        regenerate(true);
        metrics.lastAction = "init";
        if (staticRender) {
          p.redraw();
          p.noLoop();
        }
      };

      if (skipImage || !imageUrl) {
        afterLoad();
      } else {
        p.loadImage(
          imageUrl,
          (img: { width: number; height: number; pixels: number[] }) => {
            state.img = img;
            afterLoad();
          },
          () => {
            state.imageFailed = true;
            afterLoad();
          },
        );
      }

      if (staticRender) p.noLoop();
    };

    p.draw = () => {
      const t0 =
        typeof performance !== "undefined" ? performance.now() : Date.now();

      const { animation, physics, visual } = state.cfg;
      const { width, height } = state;
      const introWindowMs = animation.introDuration;

      p.clear();

      const elapsed =
        sketchStartTime > 0 ? p.millis() - sketchStartTime : introWindowMs;
      const introPhase = !staticRender && animation.introEnabled && elapsed < introWindowMs;

      // Time base for idle oscillation. Default path is unchanged (frameCount /
      // frameRate). When a targetFps cap is active we use wall-clock time scaled
      // to the 60fps baseline so oscillation speed is independent of the cap.
      const fr = animation.frameRate;
      const targetFps = state.cfg.performance.targetFps;
      const time =
        targetFps && targetFps > 0
          ? (p.millis() / 1000) * (60 / fr)
          : p.frameCount / fr;

      const mouseX = p.mouseX;
      const mouseY = p.mouseY;
      const isMouseOver =
        !disableMouse &&
        physics.enabled &&
        mouseX >= 0 &&
        mouseX <= width &&
        mouseY >= 0 &&
        mouseY <= height;

      const repR = physics.repulsionRadius;
      const attR = physics.attractionRadius;
      const repR2 = repR * repR;
      const attR2 = attR * attR;
      const attZone = attR - repR;
      const animateDots = animation.enabled && !staticRender;
      const physicsDots = physics.enabled && !staticRender;

      if (!hideImageShape) {
        for (const dot of dots) {
          // Idle oscillation — allocation-free (writes directly to baseDx/baseDy).
          let baseDx = 0;
          let baseDy = 0;
          if (animateDots) {
            const tt = time * dot.speed + dot.phase;
            switch (dot.animType) {
              case "horizontal":
                baseDx = Math.sin(tt) * dot.amp;
                break;
              case "circular":
                baseDx = Math.cos(tt) * dot.amp;
                baseDy = Math.sin(tt) * dot.amp;
                break;
              case "diagonal": {
                const diag = Math.sin(tt) * dot.amp;
                baseDx = diag * 0.8;
                baseDy = -diag * 0.8;
                break;
              }
              case "vertical":
              default:
                baseDy = Math.sin(tt) * dot.amp;
                break;
            }
          }

          const targetX = dot.bx + baseDx;
          const targetY = dot.by + baseDy;

          let x = targetX;
          let y = targetY;
          let useIntro = false;

          if (introPhase && !dot.hasLanded) {
            let progress = 0;
            if (elapsed < dot.delay) {
              progress = 0;
            } else if (elapsed >= dot.delay + dot.dur) {
              dot.hasLanded = true;
              progress = 1;
            } else {
              progress = Math.max(0, Math.min(1, (elapsed - dot.delay) / dot.dur));
            }

            if (progress < 1 && !dot.hasLanded) {
              const eased = easeOut(progress);
              x = dot.sx + (targetX - dot.sx) * eased;
              y = dot.sy + (targetY - dot.sy) * eased;
              useIntro = true;
            } else {
              dot.hasLanded = true;
            }
          } else {
            dot.hasLanded = true;
          }

          if (!useIntro && physicsDots) {
            const currentX = targetX + dot.vx;
            const currentY = targetY + dot.vy;

            if (isMouseOver) {
              const dx = currentX - mouseX;
              const dy = currentY - mouseY;
              const distSq = dx * dx + dy * dy;

              if (distSq > 0) {
                if (distSq < repR2) {
                  const dist = Math.sqrt(distSq);
                  const dirX = dx / dist;
                  const dirY = dy / dist;
                  const norm = dist / repR;
                  const factor = 1 - norm;
                  const strength = physics.repulsionStrength * factor * factor;
                  const noiseX = (Math.random() - 0.5) * physics.repulsionNoise;
                  const noiseY = (Math.random() - 0.5) * physics.repulsionNoise;
                  dot.vx += (dirX + noiseX) * strength;
                  dot.vy += (dirY + noiseY) * strength;
                } else if (distSq < attR2 && attZone > 0) {
                  const dist = Math.sqrt(distSq);
                  const dirX = dx / dist;
                  const dirY = dy / dist;
                  const norm = (dist - repR) / attZone;
                  const factor = 1 - norm;
                  const strength = physics.attractionStrength * factor * factor;
                  dot.vx += -dirX * strength;
                  dot.vy += -dirY * strength;
                }
              }
            }

            dot.vx += -dot.vx * physics.returnStrength;
            dot.vy += -dot.vy * physics.returnStrength;
            dot.vx *= physics.damping;
            dot.vy *= physics.damping;
            x = targetX + dot.vx;
            y = targetY + dot.vy;
          }

          p.fill(dot.rgb.r, dot.rgb.g, dot.rgb.b, dot.opacity);
          p.circle(x, y, dot.size * 2);
        }
      }

      if (!staticRender && animation.enabled) {
        for (const b of bouncers) {
          let x = b.x;
          let y = b.y;
          let useIntro = false;

          if (introPhase && !b.hasLanded) {
            let progress = 0;
            if (elapsed < b.delay) {
              progress = 0;
            } else if (elapsed >= b.delay + b.dur) {
              b.hasLanded = true;
              progress = 1;
            } else {
              progress = Math.max(0, Math.min(1, (elapsed - b.delay) / b.dur));
            }

            if (progress < 1 && !b.hasLanded) {
              const eased = easeOut(progress);
              x = b.sx + (b.tx - b.sx) * eased;
              y = b.sy + (b.ty - b.sy) * eased;
              useIntro = true;
              b.x = x;
              b.y = y;
            } else {
              b.hasLanded = true;
              b.x = b.tx;
              b.y = b.ty;
              x = b.tx;
              y = b.ty;
            }
          } else {
            b.hasLanded = true;
          }

          if (!useIntro && b.hasLanded) {
            b.x += b.vx;
            b.y += b.vy;
            if (b.x - b.size <= 0 || b.x + b.size >= width) {
              b.vx *= -1;
              b.x = Math.max(b.size, Math.min(width - b.size, b.x));
            }
            if (b.y - b.size <= 0 || b.y + b.size >= height) {
              b.vy *= -1;
              b.y = Math.max(b.size, Math.min(height - b.size, b.y));
            }
            x = b.x;
            y = b.y;
          }

          p.fill(b.rgb.r, b.rgb.g, b.rgb.b, b.opacity);
          p.circle(x, y, b.size * 2);
        }
      }

      const dt =
        (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0;
      metrics.lastDrawMs = dt;
      metrics.avgDrawMs = frames === 0 ? dt : metrics.avgDrawMs * 0.9 + dt * 0.1;
      if (dt > metrics.worstDrawMs) metrics.worstDrawMs = dt;
      frames++;
    };
  };

  return { sketch, controller };
}
