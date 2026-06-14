export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const FALLBACK: Rgb = { r: 255, g: 255, b: 255 };

/**
 * Resolves a CSS color string to an `{r,g,b}` tuple for use with p5's numeric
 * `fill()`. Handles plain hex (`#2d9cdb`), named/rgb colors, and CSS custom
 * properties via `var(--token)` / `var(--token, #fallback)` — the latter read
 * from the given root element's computed style so CSS custom properties resolve.
 *
 * Runs only in the browser; returns white if resolution fails.
 */
export function resolveCssColor(input: string, rootEl: Element | null): Rgb {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return FALLBACK;
  }

  let value = (input ?? "").trim();
  if (!value) return FALLBACK;

  // Resolve a single `var(--name, fallback)` wrapper if present.
  const varMatch = value.match(/^var\(\s*(--[^,)]+)\s*(?:,\s*([^)]+))?\)$/);
  if (varMatch) {
    const token = varMatch[1].trim();
    const fallback = varMatch[2]?.trim();
    const el = rootEl ?? document.documentElement;
    const resolved = getComputedStyle(el).getPropertyValue(token).trim();
    value = resolved || fallback || "";
    if (!value) return FALLBACK;
  }

  return normalizeToRgb(value);
}

/**
 * Normalizes any canvas-acceptable color string to `{r,g,b}` by letting the 2D
 * context parse it, then reading back the normalized form.
 */
function normalizeToRgb(value: string): Rgb {
  try {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return FALLBACK;
    ctx.fillStyle = "#000000";
    ctx.fillStyle = value;
    const normalized = ctx.fillStyle; // "#rrggbb" or "rgba(r, g, b, a)"

    if (normalized.startsWith("#")) {
      const hex = normalized.slice(1);
      const full =
        hex.length === 3
          ? hex
              .split("")
              .map((c) => c + c)
              .join("")
          : hex;
      return {
        r: parseInt(full.slice(0, 2), 16),
        g: parseInt(full.slice(2, 4), 16),
        b: parseInt(full.slice(4, 6), 16),
      };
    }

    const rgbMatch = normalized.match(
      /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i,
    );
    if (rgbMatch) {
      return {
        r: Number(rgbMatch[1]),
        g: Number(rgbMatch[2]),
        b: Number(rgbMatch[3]),
      };
    }
  } catch {
    // fall through
  }
  return FALLBACK;
}
