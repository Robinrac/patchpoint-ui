"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { applyMobileOverrides } from "./config/mobileOverrides";
import { resolveParticleImageConfig } from "./config/mergeConfig";
import { applyQualityCaps, resolveQuality } from "./config/quality";
import type { ResolvedQuality } from "./config/quality";
import {
  applyResponsiveScaling,
  computeResponsiveScaleFactor,
} from "./config/responsiveScaling";
import { createSketch } from "./engine/createSketch";
import type { SketchController, SketchMetrics } from "./engine/createSketch";
import { resolveCssColor } from "./utils/color";
import type { ParticleImageProps } from "./types";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
/** Trailing debounce (ms) for resize-driven dimension updates. */
const RESIZE_DEBOUNCE_MS = 120;

function matches(query: string): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(query).matches;
}

function resolveImageUrl(imagePath: string): string {
  if (typeof window === "undefined") return imagePath;
  if (imagePath.startsWith("/")) return window.location.origin + imagePath;
  return imagePath;
}

/**
 * Classifies the *device*, not just the viewport width — so a phone in landscape
 * (e.g. 844 × 390) is still treated as a phone, not a small tablet.
 *
 * A phone is identified by its physical screen envelope: short side under ~480px,
 * long side under ~950px (covers 320×568 up to 430×932), AND a realistic phone
 * aspect ratio. The aspect-ratio gate is essential: without it a wide-but-short
 * viewport like 900×300 or 720×260 (aspect ≥ 2.4) slips under the size envelope
 * and gets wrongly treated as a phone — applying mobile overrides + low-quality
 * caps that make those layouts look sparse. Real phones top out around 21:9
 * (≈2.33) even in landscape, so 2.35 cleanly separates phones from wide-short
 * desktop/embed containers. Tablets/desktops are then split by width as before.
 */
const PHONE_SHORT_SIDE_MAX = 480;
const PHONE_LONG_SIDE_MAX = 950;
const PHONE_MAX_ASPECT = 2.35;

function detectBreakpoint(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  const h = window.innerHeight;
  const short = Math.min(w, h);
  const long = Math.max(w, h);
  const aspect = short > 0 ? long / short : Infinity;
  if (
    short < PHONE_SHORT_SIDE_MAX &&
    long < PHONE_LONG_SIDE_MAX &&
    aspect <= PHONE_MAX_ASPECT
  ) {
    return "mobile";
  }
  if (w < 1024) return "tablet";
  return "desktop";
}

/** Snapshot rendered by the dev-only debug overlay / exposed via ref. */
interface DebugSnapshot extends SketchMetrics {
  width: number;
  height: number;
  preset: string;
  mode: string;
  loopState: "loop" | "noLoop";
  effectiveVisible: boolean;
  tabVisible: boolean;
  intersecting: boolean;
  // Mobile/quality diagnostics.
  breakpoint: "mobile" | "tablet" | "desktop";
  quality: ResolvedQuality;
  pixelDensity: number;
  targetFps: number;
  physicsEnabled: boolean;
  pointerEvents: string;
}

/** Effective p5 pixelDensity given the configured density and optional cap. */
function effectivePixelDensity(
  pixelDensity: number,
  maxPixelDensity: number,
): number {
  const base = pixelDensity || 1;
  return maxPixelDensity && maxPixelDensity > 0
    ? Math.min(base, maxPixelDensity)
    : base;
}


export const ParticleImage = React.forwardRef(function ParticleImage(
  {
    imagePath,
    mode = "auto",
    preset = "hero",
    config,
    className,
    width,
    height,
    canvasSize,
    dotSpacing,
    baseDotSize,
    maxDots,
    primaryColor,
    secondaryColor,
    hideImageShape = false,
    glow,
    iconPosition,
    debug = false,
  }: ParticleImageProps,
  ref: React.Ref<{ getMetrics: () => SketchMetrics | null }>,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const [viewport, setViewport] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [breakpoint, setBreakpoint] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [debugSnapshot, setDebugSnapshot] = useState<DebugSnapshot | null>(null);

  // p5 instance + imperative controller (resize fast-path lives on the controller).
  const instanceRef = useRef<{ remove: () => void; noLoop: () => void; loop: () => void } | null>(null);
  const controllerRef = useRef<SketchController | null>(null);
  // Dims/config the canvas currently reflects, so the resize effect can skip no-ops.
  const appliedDimsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  // Separated visibility state — never conflated (fixes the tab-resume bug).
  const isIntersectingRef = useRef(true);
  const isTabVisibleRef = useRef(true);
  const loopStateRef = useRef<"loop" | "noLoop">("loop");

  // Resolve the effective rendering mode.
  const resolvedMode = useMemo(() => {
    if (hideImageShape) return "particles"; // deprecated compat
    if (mode === "auto") return imagePath ? "image" : "particles";
    return mode;
  }, [mode, hideImageShape, imagePath]);

  const skipImage = resolvedMode === "particles";

  const baseConfig = useMemo(
    () =>
      resolveParticleImageConfig({
        preset,
        breakpoint,
        compat: {
          canvasSize,
          dotSpacing,
          baseDotSize,
          maxDots,
          primaryColor,
          secondaryColor,
        },
        config,
        glow,
        iconPosition,
      }),
    [
      preset,
      breakpoint,
      canvasSize,
      dotSpacing,
      baseDotSize,
      maxDots,
      primaryColor,
      secondaryColor,
      config,
      glow,
      iconPosition,
    ],
  );

  // Dimension-INDEPENDENT resolved config. Responsive proportional scaling (which
  // depends on canvas size) is applied separately below, so this object only
  // changes on real config/prop changes — never on resize.
  const resolvedConfig = useMemo(
    () => applyMobileOverrides(baseConfig, isMobile),
    [baseConfig, isMobile],
  );

  const fullViewport =
    resolvedConfig.animation.particlesVisibleOutsideComponent === true;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track breakpoint for the responsive config layer. setState bails out when the
  // value is unchanged, so this does not churn on every resize tick.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => {
      const bp = detectBreakpoint();
      setBreakpoint(bp);
      // Keep `isMobile` aligned with the phone breakpoint so mobile overrides,
      // mouse-disable, and quality=auto→low all agree across orientations.
      setIsMobile(bp === "mobile");
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Track the viewport size for full-viewport (background) mode, debounced.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const apply = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    apply();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(apply, RESIZE_DEBOUNCE_MS);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Measure the host width for normal (non-full-viewport, auto-width) layouts,
  // debounced so a resize drag doesn't trigger a regeneration per frame.
  useEffect(() => {
    if (!mounted || fullViewport || width !== undefined) return;
    const el = containerRef.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      const next = Math.round(el.clientWidth);
      setMeasuredWidth((prev) => (prev === next ? prev : next));
    };
    update();

    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(update, RESIZE_DEBOUNCE_MS);
    };

    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    ro?.observe(el);
    return () => {
      clearTimeout(timer);
      ro?.disconnect();
    };
  }, [mounted, fullViewport, width]);

  const dims = useMemo(() => {
    if (fullViewport) {
      const w = viewport.w || (typeof window !== "undefined" ? window.innerWidth : 0);
      const h = viewport.h || (typeof window !== "undefined" ? window.innerHeight : 0);
      return { w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h)) };
    }
    const { canvas } = resolvedConfig;
    const w =
      width ?? (measuredWidth && measuredWidth > 0 ? measuredWidth : canvas.defaultSize);
    const h =
      height ?? Math.min(Math.round(w * canvas.heightRatio), canvas.maxHeight);
    return { w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h)) };
  }, [fullViewport, viewport.w, viewport.h, width, height, measuredWidth, resolvedConfig]);

  // Proportional scaling based on the actual rendered canvas size. No-op when
  // `responsive.enabled` is false. Canvas dims are derived above from the
  // unscaled canvas config, so there is no feedback loop here.
  const scaledConfig = useMemo(
    () => applyResponsiveScaling(resolvedConfig, dims.w, dims.h),
    [resolvedConfig, dims.w, dims.h],
  );

  // The same linear scale factor used by particle scaling, exposed so the glow
  // layer can stay proportional to the icon at every canvas size.
  const glowScaleFactor = useMemo(
    () => computeResponsiveScaleFactor(resolvedConfig.responsive, dims.w, dims.h),
    [resolvedConfig.responsive, dims.w, dims.h],
  );

  // Active workload tier. `"auto"` maps the breakpoint to low/medium/high; an
  // explicit quality is respected as-is.
  const resolvedQuality = useMemo(
    () => resolveQuality(resolvedConfig.performance.quality, breakpoint),
    [resolvedConfig.performance.quality, breakpoint],
  );

  // Values the consumer set explicitly — caps must never override these.
  const qualityOverrides = useMemo(
    () => ({
      physicsEnabled: config?.physics?.enabled,
      targetFps: config?.performance?.targetFps,
      maxPixelDensity: config?.performance?.maxPixelDensity,
      bouncingParticlesCount: config?.visual?.bouncingParticlesCount,
      maxDots: config?.visual?.maxDots ?? maxDots,
    }),
    [config, maxDots],
  );

  // Final step: apply quality/performance caps AFTER responsive scaling. This is
  // the config the engine actually consumes.
  const engineConfig = useMemo(
    () => applyQualityCaps(scaledConfig, resolvedQuality, qualityOverrides),
    [scaledConfig, resolvedQuality, qualityOverrides],
  );

  // Latest engine config + dims, read by the (effect-stable) lifecycle handlers
  // without listing them as effect deps — this is what lets a resize hit the
  // fast-path instead of a teardown.
  const engineConfigRef = useRef(engineConfig);
  engineConfigRef.current = engineConfig;
  const dimsRef = useRef(dims);
  dimsRef.current = dims;

  // Render-level mirror of the engine's interaction gating. When interaction is
  // off (static, physics disabled, or mouse disabled on mobile) the decorative
  // canvas must not capture pointer events, so scroll/tap pass straight through.
  // This is the default on phones, where `quality: low` turns physics off.
  const renderReducedMotion =
    engineConfig.performance.respectReducedMotion && matches(REDUCED_MOTION_QUERY);
  const renderStatic =
    renderReducedMotion || engineConfig.animation.enabled === false;
  const interactionActive =
    !renderStatic &&
    engineConfig.physics.enabled !== false &&
    !(isMobile && engineConfig.performance.disableMouseInteractionOnMobile);
  const effectivePointerEvents: React.CSSProperties["pointerEvents"] =
    interactionActive
      ? (engineConfig.layout.pointerEvents as React.CSSProperties["pointerEvents"])
      : "none";

  // Stable signature for the things that genuinely require a fresh p5 instance:
  // image source, particle-only flag, the dimension-independent resolved config
  // (colors, spacing base, physics, layout, etc), and the resolved quality tier
  // (drives physics-off / pixelDensity / targetFps, all applied in p.setup).
  // Crucially this does NOT include canvas dimensions, so resizing never
  // re-creates the instance.
  const recreateKey = useMemo(
    () =>
      JSON.stringify({
        resolvedConfig,
        quality: resolvedQuality,
        imagePath: imagePath ?? "",
        skipImage,
      }),
    [resolvedConfig, resolvedQuality, imagePath, skipImage],
  );

  // ── p5 lifecycle (create / destroy only) ─────────────────────────────────
  // Re-runs only when `recreateKey` changes — never on resize.
  useEffect(() => {
    if (!mounted) return;
    const host = hostRef.current;
    if (!host) return;
    const cfg = engineConfigRef.current;
    const dW = dimsRef.current.w;
    const dH = dimsRef.current.h;
    if (dW <= 0 || dH <= 0) return;

    let cancelled = false;
    let io: IntersectionObserver | null = null;

    const reducedMotion =
      cfg.performance.respectReducedMotion && matches(REDUCED_MOTION_QUERY);
    const staticRender = reducedMotion || cfg.animation.enabled === false;
    const disableMouse =
      staticRender ||
      cfg.physics.enabled === false ||
      (isMobile && cfg.performance.disableMouseInteractionOnMobile);

    const primary = resolveCssColor(cfg.visual.primaryColor, containerRef.current);
    const secondary = resolveCssColor(cfg.visual.secondaryColor, containerRef.current);

    // Initialize the two visibility flags independently.
    isIntersectingRef.current = true;
    isTabVisibleRef.current = cfg.performance.pauseWhenTabHidden
      ? !document.hidden
      : true;
    loopStateRef.current = staticRender ? "noLoop" : "loop";

    const effectiveVisible = () =>
      isIntersectingRef.current && isTabVisibleRef.current;

    const applyRunState = () => {
      const inst = instanceRef.current;
      if (!inst || staticRender) return;
      if (effectiveVisible()) {
        inst.loop();
        loopStateRef.current = "loop";
      } else {
        inst.noLoop();
        loopStateRef.current = "noLoop";
      }
    };

    const onVisibility = () => {
      isTabVisibleRef.current = !document.hidden;
      applyRunState();
    };

    const getContainerOffset = () => {
      const el = containerRef.current;
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      return { x: rect.left, y: rect.top };
    };

    void (async () => {
      const p5 = (await import("p5")).default;
      if (cancelled || !hostRef.current) return;

      host.innerHTML = "";

      const { sketch, controller } = createSketch({
        imageUrl: imagePath ? resolveImageUrl(imagePath) : "",
        width: dW,
        height: dH,
        config: cfg,
        primary,
        secondary,
        isMobile,
        staticRender,
        disableMouse,
        hideImageShape: skipImage,
        skipImage,
        getContainerOffset,
      });

      const instance = new p5(sketch, host);
      instanceRef.current = instance;
      controllerRef.current = controller;
      appliedDimsRef.current = { w: dW, h: dH };

      if (cfg.performance.pauseWhenOffscreen && containerRef.current) {
        io = new IntersectionObserver(
          (entries) => {
            isIntersectingRef.current = entries[0]?.isIntersecting ?? true;
            applyRunState();
          },
          { threshold: 0 },
        );
        io.observe(containerRef.current);
      }

      if (cfg.performance.pauseWhenTabHidden) {
        document.addEventListener("visibilitychange", onVisibility);
      }

      applyRunState();
    })();

    return () => {
      cancelled = true;
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      instanceRef.current?.remove();
      instanceRef.current = null;
      controllerRef.current = null;
      if (host) host.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, recreateKey, imagePath, skipImage, isMobile]);

  // ── Resize fast-path ──────────────────────────────────────────────────────
  // Dimension-only changes reshape the existing canvas and reproject particles
  // via the controller — no p5 teardown, no image reload.
  useEffect(() => {
    const ctrl = controllerRef.current;
    if (!ctrl) return;
    const applied = appliedDimsRef.current;
    if (applied.w === dims.w && applied.h === dims.h) return;
    ctrl.resize(dims.w, dims.h, engineConfigRef.current);
    appliedDimsRef.current = { w: dims.w, h: dims.h };
  }, [dims.w, dims.h]);

  // Latest quality/perf diagnostics, read by the polling interval below without
  // re-subscribing it on every render.
  const debugMetaRef = useRef({
    breakpoint,
    quality: resolvedQuality,
    pixelDensity: 1,
    targetFps: 0,
    physicsEnabled: true,
    pointerEvents: "auto" as string,
  });
  debugMetaRef.current = {
    breakpoint,
    quality: resolvedQuality,
    pixelDensity: effectivePixelDensity(
      engineConfig.canvas.pixelDensity,
      engineConfig.performance.maxPixelDensity,
    ),
    targetFps: engineConfig.performance.targetFps,
    physicsEnabled: engineConfig.physics.enabled,
    pointerEvents: String(effectivePointerEvents),
  };

  // ── Metrics polling (opt-in via `debug`) ──────────────────────────────────
  // Only runs when `debug` is set, so production consumers pay zero cost: no
  // interval, no per-tick setState/re-render. The playground enables it to feed
  // its external metrics panel through the exposed ref.
  useEffect(() => {
    if (!mounted || !debug) return;
    const id = setInterval(() => {
      const ctrl = controllerRef.current;
      if (!ctrl) return;
      const m = ctrl.getMetrics();
      setDebugSnapshot({
        ...m,
        width: dimsRef.current.w,
        height: dimsRef.current.h,
        preset,
        mode: resolvedMode,
        loopState: loopStateRef.current,
        effectiveVisible: isIntersectingRef.current && isTabVisibleRef.current,
        tabVisible: isTabVisibleRef.current,
        intersecting: isIntersectingRef.current,
        ...debugMetaRef.current,
      });
    }, 250);
    return () => clearInterval(id);
  }, [mounted, debug, preset, resolvedMode]);

  // Expose metrics via ref for external debug panels (playground only).
  React.useImperativeHandle(
    ref,
    () => ({
      getMetrics: () => debugSnapshot,
    }),
    [debugSnapshot],
  );

  const wrapperStyle: React.CSSProperties = fullViewport
    ? {
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        width: "100vw",
        height: "100vh",
      }
    : {
        position: "relative",
        width: width ?? "100%",
        height: height ?? dims.h,
        contain: "layout paint style",
        overflow: engineConfig.layout.overflow,
        pointerEvents: effectivePointerEvents,
      };

  // Resolve glow: prefer config.effects.glow over the deprecated top-level glow prop.
  // (The deprecated glow is already normalized into effects.glow by resolveParticleImageConfig.)
  const resolvedGlow = resolvedConfig.effects.glow;
  const glowStyle: React.CSSProperties | null = (() => {
    if (!resolvedGlow?.color) return null;
    const glowResponsive = resolvedGlow.responsive !== false;
    const sf = glowResponsive ? glowScaleFactor : 1;
    const gw = Math.round((resolvedGlow.width ?? 0.4) * sf * 100);
    const gh = Math.round((resolvedGlow.height ?? 0.4) * sf * 100);
    const gx = Math.round((resolvedGlow.x ?? 0.5) * 100);
    const gy = Math.round((resolvedGlow.y ?? 0.5) * 100);
    return {
      position: "absolute",
      inset: 0,
      opacity: resolvedGlow.opacity ?? 0.3,
      background: `radial-gradient(ellipse ${gw}% ${gh}% at ${gx}% ${gy}%, ${resolvedGlow.color}, transparent 70%)`,
      pointerEvents: "none",
    };
  })();

  return (
    <div
      ref={containerRef}
      className={className}
      data-component="ParticleImage"
      data-package="@patchpoint/ui"
      data-preset={preset}
      style={wrapperStyle}
    >
      {glowStyle && <div aria-hidden style={glowStyle} />}
      {mounted ? (
        <div
          ref={hostRef}
          style={{ width: "100%", height: "100%", willChange: "contents" }}
        />
      ) : null}
    </div>
  );
});


