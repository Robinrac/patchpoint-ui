import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { ParticleImage } from "../../../src/ParticleImage";
import {
  applyResponsiveScaling,
  computeResponsiveScaleFactor,
  resolveParticleImageConfig,
} from "../../../src/ParticleImage";
import type {
  ParticleImageConfig,
  ParticleImageMode,
  ParticleImagePreset,
} from "../../../src/ParticleImage/types";
import { LOGO, PAGE_BG } from "../constants";
import { T } from "../theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type Overlay = "none" | "hero" | "results" | "form";

interface ColorPair {
  label: string;
  primary: string;
  secondary: string;
  glow: string;
}

// ─── Color presets ────────────────────────────────────────────────────────────

const COLOR_PRESETS: ColorPair[] = [
  { label: "Patchpoint", primary: "#2d9cdb", secondary: "#56ccf2", glow: "rgba(45,156,219,0.55)" },
  { label: "Orange",     primary: "#f97316", secondary: "#fb923c", glow: "rgba(249,115,22,0.55)" },
  { label: "Purple",     primary: "#9b51e0", secondary: "#c084fc", glow: "rgba(155,81,224,0.55)" },
  { label: "Green",      primary: "#27ae60", secondary: "#6fcf97", glow: "rgba(39,174,96,0.55)"  },
  { label: "SkillTap",   primary: "#7c3aed", secondary: "#a78bfa", glow: "rgba(124,58,237,0.55)" },
  { label: "Neutral",    primary: "#e0e0e0", secondary: "#a0a0b8", glow: "rgba(200,200,220,0.4)" },
];

const PRESETS: ParticleImagePreset[] = ["hero", "background", "contained", "compact", "static"];
const MODES: ParticleImageMode[]     = ["auto", "image", "particles"];
const SIZE_PRESETS = [
  { label: "Mobile",  w: 375,  h: 600 },
  { label: "Tablet",  w: 768,  h: 540 },
  { label: "Desktop", w: 1100, h: 620 },
];

// Contained/card responsiveness test sizes (from the responsive spec).
const CONTAINED_SIZES = [
  { label: "Square",   w: 420, h: 420 },
  { label: "Wide",     w: 640, h: 260 },
  { label: "Portrait", w: 320, h: 420 },
];

const sizeBtn: CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  fontSize: "0.7rem",
  fontWeight: 600,
  padding: "0.3rem 0.7rem",
  borderRadius: "0.375rem",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.05)",
  color: "#a0a0b8",
  cursor: "pointer",
};

// ─── Small control primitives ─────────────────────────────────────────────────

function CtrlLabel({ children }: { children: string }) {
  return (
    <span style={{
      fontSize: "0.7rem",
      fontWeight: 600,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "#606080",
      display: "block",
      marginBottom: "0.4rem",
    }}>
      {children}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "1rem" }}>
      <div style={{
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "#56ccf2",
        marginBottom: "0.875rem",
      }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {children}
      </div>
    </div>
  );
}

function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "0.75rem",
            fontWeight: 500,
            padding: "0.3rem 0.7rem",
            borderRadius: "0.375rem",
            border: "1px solid",
            cursor: "pointer",
            background: value === o ? "#2d9cdb" : "rgba(255,255,255,0.05)",
            borderColor: value === o ? "#2d9cdb" : "rgba(255,255,255,0.12)",
            color: value === o ? "#fff" : "#a0a0b8",
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", gap: "0.4rem" }}>
      {([true, false] as const).map((v) => (
        <button
          key={String(v)}
          onClick={() => onChange(v)}
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "0.75rem",
            fontWeight: 600,
            padding: "0.3rem 0.875rem",
            borderRadius: "0.375rem",
            border: "1px solid",
            cursor: "pointer",
            background: value === v ? (v ? "#22c55e" : "#ef4444") : "rgba(255,255,255,0.05)",
            borderColor: value === v ? (v ? "#22c55e" : "#ef4444") : "rgba(255,255,255,0.12)",
            color: value === v ? "#fff" : "#606080",
          }}
        >
          {v ? "true" : "false"}
        </button>
      ))}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
        <span style={{ fontSize: "0.75rem", color: "#a0a0b8", fontFamily: "system-ui, sans-serif" }}>{label}</span>
        <span style={{ fontSize: "0.75rem", color: "#e0e0f0", fontFamily: "monospace" }}>{value.toFixed(step < 1 ? 2 : 0)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#2d9cdb" }}
      />
    </div>
  );
}

function ColorSwatches({
  value,
  onChange,
}: {
  value: ColorPair;
  onChange: (p: ColorPair) => void;
}) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      {COLOR_PRESETS.map((p) => (
        <button
          key={p.label}
          title={p.label}
          onClick={() => onChange(p)}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: p.primary,
            border: value.label === p.label
              ? "2px solid #fff"
              : "2px solid rgba(255,255,255,0.15)",
            cursor: "pointer",
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

function DebugRow({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "1.5rem" }}>
      <span style={{ color: "#606080" }}>{k}</span>
      <span style={{ color: highlight ? "#fbbf24" : "#e0e0f0" }}>{v}</span>
    </div>
  );
}

// ─── Overlay components ───────────────────────────────────────────────────────

function HeroOverlay() {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 8%", zIndex: 10, pointerEvents: "none" }}>
      <div style={{ maxWidth: 420, color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <p style={{ ...T.eyebrow as CSSProperties, marginBottom: "0.5rem" }}>BICS · Hero</p>
        <h2 style={{ fontSize: "2.25rem", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 0 0.875rem" }}>
          Security insights<br />without the noise
        </h2>
        <p style={{ ...T.body as CSSProperties, maxWidth: 340, margin: "0 0 1.25rem" }}>
          Patchpoint helps security teams cut through alert fatigue and act before attackers do.
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button style={{ ...T.cta as CSSProperties, width: "auto", padding: "0.7rem 1.5rem", pointerEvents: "auto" }}>Get started</button>
          <button style={{ fontFamily: "system-ui, sans-serif", background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "0.5rem", padding: "0.7rem 1.25rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>Learn more</button>
        </div>
      </div>
    </div>
  );
}

function ResultsOverlay() {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-start", padding: "1.75rem 2rem 0", zIndex: 10, pointerEvents: "none" }}>
      <div>
        <p style={{ ...T.eyebrow as CSSProperties, marginBottom: "0.375rem" }}>SkillTap · Results</p>
        <h2 style={{ fontFamily: "system-ui, sans-serif", fontSize: "1.5rem", fontWeight: 700, color: "#fff", margin: 0 }}>1st Place</h2>
      </div>
    </div>
  );
}

function FormOverlay() {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, pointerEvents: "none" }}>
      <div style={{ ...T.card as CSSProperties, maxWidth: 360, width: "85%", pointerEvents: "auto", textAlign: "center" }}>
        <p style={{ ...T.eyebrow as CSSProperties, marginBottom: "0.5rem" }}>Patchpoint · Analysis</p>
        <h2 style={{ fontFamily: "system-ui, sans-serif", fontSize: "1.25rem", fontWeight: 700, color: "#fff", margin: "0 0 0.625rem" }}>Security Analysis</h2>
        <p style={{ ...T.body as CSSProperties, margin: "0 0 1rem" }}>Enter your domain to receive a free vulnerability report.</p>
        <input style={{ ...T.input as CSSProperties, marginBottom: "0.75rem" }} placeholder="your-company.com" readOnly />
        <button style={{ ...T.cta as CSSProperties }}>Analyse now</button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AllPropsPage() {
  // Ref to access ParticleImage metrics
  const particleImageRef = useRef<{ getMetrics: () => any }>(null);

  // Preset
  const [preset, setPreset] = useState<ParticleImagePreset>("compact");

  // Colors
  const [colors, setColors] = useState<ColorPair>(COLOR_PRESETS[0]);

  // Icon position
  const [iconX, setIconX] = useState(0.5);
  const [iconY, setIconY] = useState(0.48);

  // Glow
  const [glowEnabled, setGlowEnabled] = useState(true);
  const [glowWidth, setGlowWidth]   = useState(0.5);
  const [glowHeight, setGlowHeight] = useState(0.5);
  const [glowOpacity, setGlowOpacity] = useState(0.32);

  // Dots
  const [scale, setScale]           = useState(0.38);
  const [dotSpacing, setDotSpacing] = useState(6);
  const [baseDotSize, setBaseDotSize] = useState(1.5);
  const [maxDots, setMaxDots]       = useState(1400);

  // Visual
  const [sizeMin, setSizeMin]       = useState(0.75);
  const [sizeMax, setSizeMax]       = useState(1.5);
  const [bouncers, setBouncers]       = useState(20);
  const [bouncerSpeed, setBouncerSpeed] = useState(2);
  const [jitter, setJitter]         = useState(0.25);

  // Flags
  const [mode, setMode] = useState<ParticleImageMode>("auto");
  const [animEnabled, setAnimEnabled]   = useState(true);
  const [physicsEnabled, setPhysicsEnabled] = useState(true);
  const [flyFromPage, setFlyFromPage]   = useState(false);

  // Responsive proportional scaling
  const [responsiveEnabled, setResponsiveEnabled] = useState(true);

  // Dev-only runtime metrics overlay
  const [showDebug, setShowDebug] = useState(true);

  // Performance debug snapshot (polled from ParticleImage ref)
  const [perfSnapshot, setPerfSnapshot] = useState<any>(null);

  // Overlay
  const [overlay, setOverlay] = useState<Overlay>("none");

  // Preview size
  const [previewW, setPreviewW] = useState(720);
  const [previewH, setPreviewH] = useState(560);

  // Resize handle drag
  const draggingW = useRef(false);
  const draggingH = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startW = useRef(0);
  const startH = useRef(0);

  const onRightHandleDown = useCallback((e: React.MouseEvent) => {
    draggingW.current = true;
    startX.current = e.clientX;
    startW.current = previewW;
  }, [previewW]);

  const onBottomHandleDown = useCallback((e: React.MouseEvent) => {
    draggingH.current = true;
    startY.current = e.clientY;
    startH.current = previewH;
  }, [previewH]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (draggingW.current) {
        const delta = e.clientX - startX.current;
        setPreviewW(Math.max(280, Math.min(1200, startW.current + delta)));
      }
      if (draggingH.current) {
        const delta = e.clientY - startY.current;
        setPreviewH(Math.max(200, Math.min(900, startH.current + delta)));
      }
    };
    const onUp = () => {
      draggingW.current = false;
      draggingH.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // Poll performance metrics from ParticleImage ref
  useEffect(() => {
    if (!showDebug) return;
    const id = setInterval(() => {
      const metrics = particleImageRef.current?.getMetrics?.();
      if (metrics) {
        setPerfSnapshot(metrics);
      }
    }, 250);
    return () => clearInterval(id);
  }, [showDebug]);

  // Single source of truth for the config — shared by the live canvas and the
  // debug panel so the displayed resolved values exactly match what renders.
  const config: Partial<ParticleImageConfig> = useMemo(
    () => ({
      layout: { scale, position: { x: iconX, y: iconY } },
      animation: {
        enabled: animEnabled,
        flyInFromWholePage: flyFromPage,
        particlesVisibleOutsideComponent: false,
      },
      physics: { enabled: physicsEnabled },
      visual: {
        sizeMin,
        sizeMax,
        bouncingParticlesCount: bouncers,
        bouncingParticlesSpeedMin: bouncerSpeed * 0.5,
        bouncingParticlesSpeedMax: bouncerSpeed * 1.5,
        jitter,
      },
      canvas: { heightRatio: 1, maxHeight: 3000 },
      effects: glowEnabled
        ? {
            glow: {
              color: colors.glow,
              width: glowWidth,
              height: glowHeight,
              x: iconX,
              y: iconY,
              opacity: glowOpacity,
            },
          }
        : {},
      responsive: { enabled: responsiveEnabled },
    }),
    [
      scale, iconX, iconY, animEnabled, flyFromPage, physicsEnabled,
      sizeMin, sizeMax, bouncers, bouncerSpeed, jitter,
      glowEnabled, colors.glow, glowWidth, glowHeight, glowOpacity,
      responsiveEnabled,
    ],
  );

  // Recompute the resolved + proportionally-scaled config for the debug panel.
  // Mirrors the component pipeline for a desktop viewport (no mobile overrides).
  const debug = useMemo(() => {
    const resolved = resolveParticleImageConfig({
      preset,
      breakpoint: "desktop",
      compat: {
        dotSpacing,
        baseDotSize,
        maxDots,
        primaryColor: colors.primary,
        secondaryColor: colors.secondary,
      },
      config,
    });
    const scaled = applyResponsiveScaling(resolved, previewW, previewH);
    const factor = computeResponsiveScaleFactor(
      resolved.responsive,
      previewW,
      previewH,
    );
    return { scaled, factor };
  }, [preset, dotSpacing, baseDotSize, maxDots, colors, config, previewW, previewH]);

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, display: "flex", fontFamily: "system-ui, sans-serif" }}>

      {/* ── Preview area ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start", padding: "5rem 2.5rem 3rem", minWidth: 0, paddingLeft: "clamp(2.5rem, 6%, 6rem)" }}>

        <div style={{ marginBottom: "1rem" }}>
          <p style={T.eyebrow as CSSProperties}>ParticleImage · Live Editor</p>
          <h1 style={{ ...T.heading as CSSProperties, margin: 0 }}>All Props</h1>
        </div>

        {/* Size preset buttons */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
          {SIZE_PRESETS.map((s) => (
            <button
              key={s.label}
              onClick={() => { setPreviewW(s.w); setPreviewH(s.h); }}
              style={sizeBtn}
            >
              {s.label} {s.w}×{s.h}
            </button>
          ))}
          <span style={{ fontSize: "0.7rem", color: "#404060", alignSelf: "center", marginLeft: "0.25rem" }}>
            or drag handles
          </span>
        </div>

        {/* Contained responsiveness test sizes */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.7rem", color: "#56ccf2", fontWeight: 600 }}>Contained tests:</span>
          {CONTAINED_SIZES.map((s) => (
            <button
              key={s.label}
              onClick={() => { setPreset("contained"); setPreviewW(s.w); setPreviewH(s.h); }}
              style={sizeBtn}
            >
              {s.w}×{s.h}
            </button>
          ))}
        </div>

        {/* Resizable preview frame */}
        <div style={{ position: "relative", width: previewW, height: previewH, flexShrink: 0 }}>

          {/* The particle canvas + overlay */}
          <div style={{ ...T.card as CSSProperties, padding: 0, overflow: "hidden", width: "100%", height: "100%", position: "relative" }}>
            <ParticleImage
              ref={particleImageRef}
              preset={preset}
              imagePath={LOGO}
              mode={mode}
              width={previewW}
              height={previewH}
              primaryColor={colors.primary}
              secondaryColor={colors.secondary}
              dotSpacing={dotSpacing}
              baseDotSize={baseDotSize}
              maxDots={maxDots}
              config={config}
              debug={showDebug}
            />

            {overlay === "hero"    && <HeroOverlay />}
            {overlay === "results" && <ResultsOverlay />}
            {overlay === "form"    && <FormOverlay />}
          </div>

          {/* Right resize handle */}
          <div
            onMouseDown={onRightHandleDown}
            style={{
              position: "absolute",
              top: 0,
              right: -6,
              width: 12,
              height: "100%",
              cursor: "ew-resize",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 4, height: 40, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
          </div>

          {/* Bottom resize handle */}
          <div
            onMouseDown={onBottomHandleDown}
            style={{
              position: "absolute",
              bottom: -6,
              left: 0,
              width: "100%",
              height: 12,
              cursor: "ns-resize",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ height: 4, width: 40, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
          </div>

          {/* Corner handle */}
          <div
            onMouseDown={(e) => { onRightHandleDown(e); onBottomHandleDown(e); }}
            style={{
              position: "absolute",
              right: -6,
              bottom: -6,
              width: 16,
              height: 16,
              cursor: "nwse-resize",
              borderRadius: 2,
              background: "rgba(255,255,255,0.15)",
            }}
          />

          {/* Size readout */}
          <div style={{ position: "absolute", bottom: 8, right: 16, fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", fontFamily: "monospace", pointerEvents: "none" }}>
            {previewW} × {previewH}
          </div>
        </div>

        {/* Debug panels — responsive config + performance metrics, side-by-side */}
        <div style={{ marginTop: "1.75rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {/* Responsive scaling debug */}
          <div style={{
            background: "rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "0.625rem",
            padding: "0.875rem 1.125rem",
            fontFamily: "monospace",
            fontSize: "0.72rem",
            lineHeight: 1.7,
            color: "#a0a0b8",
            minWidth: 320,
            flex: 1,
          }}>
            <div style={{ color: "#56ccf2", fontWeight: 700, marginBottom: "0.5rem", letterSpacing: "0.08em" }}>
              RESPONSIVE DEBUG {responsiveEnabled ? "" : "(scaling disabled)"}
            </div>
            <DebugRow k="canvas" v={`${previewW} × ${previewH}`} />
            <DebugRow k="scaleFactor" v={debug.factor.toFixed(3)} highlight />
            <DebugRow k="dotSpacing" v={debug.scaled.visual.dotSpacing.toFixed(2)} />
            <DebugRow k="baseDotSize" v={debug.scaled.visual.baseDotSize.toFixed(3)} />
            <DebugRow k="jitter" v={debug.scaled.visual.jitter.toFixed(3)} />
            <DebugRow k="sizeMin / sizeMax" v={`${debug.scaled.visual.sizeMin.toFixed(2)} / ${debug.scaled.visual.sizeMax.toFixed(2)}`} />
            <DebugRow k="maxDots" v={String(debug.scaled.visual.maxDots)} />
            <DebugRow k="bouncingCount" v={String(debug.scaled.visual.bouncingParticlesCount)} />
            <DebugRow k="amplitudeMin / Max" v={`${debug.scaled.animation.amplitudeMin.toFixed(2)} / ${debug.scaled.animation.amplitudeMax.toFixed(2)}`} />
            <DebugRow k="reference" v={`${debug.scaled.responsive.referenceWidth} × ${debug.scaled.responsive.referenceHeight}`} />
          </div>

          {/* Performance metrics debug */}
          {showDebug && perfSnapshot && (
            <div style={{
              background: "rgba(0,0,0,0.35)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "0.625rem",
              padding: "0.875rem 1.125rem",
              fontFamily: "monospace",
              fontSize: "0.72rem",
              lineHeight: 1.7,
              color: "#a0a0b8",
              minWidth: 320,
              flex: 1,
            }}>
              <div style={{ color: "#56ccf2", fontWeight: 700, marginBottom: "0.5rem", letterSpacing: "0.08em" }}>
                PERFORMANCE DEBUG
              </div>
              <DebugRow k="viewport" v={`${typeof window !== "undefined" ? window.innerWidth : 0} × ${typeof window !== "undefined" ? window.innerHeight : 0}`} />
              <DebugRow k="canvas" v={`${perfSnapshot.width} × ${perfSnapshot.height}`} />
              <DebugRow k="breakpoint" v={String(perfSnapshot.breakpoint)} highlight />
              <DebugRow k="quality" v={String(perfSnapshot.quality)} highlight />
              <DebugRow k="preset / mode" v={`${perfSnapshot.preset} / ${perfSnapshot.mode}`} />
              <DebugRow k="dots" v={String(perfSnapshot.dotCount)} />
              <DebugRow k="bouncers" v={String(perfSnapshot.bouncerCount)} />
              <DebugRow k="pixelDensity" v={String(perfSnapshot.pixelDensity)} />
              <DebugRow k="targetFps" v={perfSnapshot.targetFps ? String(perfSnapshot.targetFps) : "uncapped"} />
              <DebugRow k="physics" v={String(perfSnapshot.physicsEnabled)} />
              <DebugRow k="pointerEvents" v={String(perfSnapshot.pointerEvents)} />
              <DebugRow k="draw avg" v={`${perfSnapshot.avgDrawMs.toFixed(2)} ms`} />
              <DebugRow k="draw worst" v={`${perfSnapshot.worstDrawMs.toFixed(2)} ms`} />
              <DebugRow k="loop" v={perfSnapshot.loopState} />
              <DebugRow k="effectiveVisible" v={String(perfSnapshot.effectiveVisible)} />
              <DebugRow k="tabVisible" v={String(perfSnapshot.tabVisible)} />
              <DebugRow k="intersecting" v={String(perfSnapshot.intersecting)} />
              <DebugRow k="lastAction" v={perfSnapshot.lastAction} />
              <DebugRow k="genCacheHit" v={String(perfSnapshot.genCacheHit)} />
            </div>
          )}
        </div>
      </div>

      {/* ── Controls panel ───────────────────────────────────────────────── */}
      <div style={{
        width: 300,
        flexShrink: 0,
        height: "100vh",
        overflowY: "auto",
        padding: "5rem 1.5rem 3rem",
        borderLeft: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        boxSizing: "border-box",
      }}>

        <Section title="Preset">
          <div>
            <CtrlLabel>Preset</CtrlLabel>
            <Chips options={PRESETS} value={preset} onChange={setPreset} />
          </div>
        </Section>

        <Section title="Colors">
          <div>
            <CtrlLabel>Color preset</CtrlLabel>
            <ColorSwatches value={colors} onChange={setColors} />
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <div style={{ flex: 1, fontSize: "0.7rem", color: "#606080" }}>
                Primary
                <div style={{ width: "100%", height: 6, borderRadius: 3, background: colors.primary, marginTop: 4 }} />
              </div>
              <div style={{ flex: 1, fontSize: "0.7rem", color: "#606080" }}>
                Secondary
                <div style={{ width: "100%", height: 6, borderRadius: 3, background: colors.secondary, marginTop: 4 }} />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Icon position">
          <Slider label="x (left → right)" value={iconX} min={0} max={1} onChange={setIconX} />
          <Slider label="y (top → bottom)"  value={iconY} min={0} max={1} onChange={setIconY} />
          <Slider label="scale"             value={scale} min={0.1} max={0.7} onChange={setScale} />
        </Section>

        <Section title="Glow">
          <div>
            <CtrlLabel>Enabled</CtrlLabel>
            <Toggle value={glowEnabled} onChange={setGlowEnabled} />
          </div>
          {glowEnabled && (
            <>
              <Slider label="width"   value={glowWidth}   min={0.1} max={1} onChange={setGlowWidth} />
              <Slider label="height"  value={glowHeight}  min={0.1} max={1} onChange={setGlowHeight} />
              <Slider label="opacity" value={glowOpacity} min={0}   max={1} onChange={setGlowOpacity} />
            </>
          )}
        </Section>

        <Section title="Dots">
          <Slider label="dotSpacing"  value={dotSpacing}  min={2}   max={20}   step={1}    onChange={setDotSpacing} />
          <Slider label="baseDotSize" value={baseDotSize} min={0.5} max={4}    step={0.05} onChange={setBaseDotSize} />
          <Slider label="maxDots"     value={maxDots}     min={100} max={5000} step={50}   onChange={setMaxDots} />
          <Slider label="sizeMin"     value={sizeMin}     min={0.1} max={3}    step={0.05} onChange={setSizeMin} />
          <Slider label="sizeMax"     value={sizeMax}     min={0.1} max={4}    step={0.05} onChange={setSizeMax} />
          <Slider label="jitter"      value={jitter}      min={0}   max={1}    onChange={setJitter} />
        </Section>

        <Section title="Particles">
          <Slider label="bouncingParticlesCount" value={bouncers}     min={0} max={120} step={1}   onChange={setBouncers} />
          <Slider label="speed"                 value={bouncerSpeed} min={0.1} max={12} step={0.1} onChange={setBouncerSpeed} />
        </Section>

        <Section title="Responsive">
          <div>
            <CtrlLabel>responsive.enabled</CtrlLabel>
            <Toggle value={responsiveEnabled} onChange={setResponsiveEnabled} />
          </div>
          <span style={{ fontSize: "0.68rem", color: "#606080", lineHeight: 1.5 }}>
            Resize the preview (or use the buttons above) and watch the debug panel —
            dot size/spacing, amplitude and density scale proportionally with the canvas.
          </span>
          <div>
            <CtrlLabel>debug overlay (dev-only)</CtrlLabel>
            <Toggle value={showDebug} onChange={setShowDebug} />
          </div>
        </Section>

        <Section title="Flags">
          <div>
            <CtrlLabel>mode</CtrlLabel>
            <Chips options={MODES} value={mode} onChange={setMode} />
          </div>
          <div>
            <CtrlLabel>animation.enabled</CtrlLabel>
            <Toggle value={animEnabled} onChange={setAnimEnabled} />
          </div>
          <div>
            <CtrlLabel>physics.enabled</CtrlLabel>
            <Toggle value={physicsEnabled} onChange={setPhysicsEnabled} />
          </div>
          <div>
            <CtrlLabel>flyInFromWholePage</CtrlLabel>
            <Toggle value={flyFromPage} onChange={setFlyFromPage} />
          </div>
        </Section>

        <Section title="Overlay">
          <Chips
            options={["none", "hero", "results", "form"] as const}
            value={overlay}
            onChange={setOverlay}
          />
        </Section>

      </div>
    </div>
  );
}
