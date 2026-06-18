"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { GbFlag } from "./flags/GbFlag";
import { SeFlag } from "./flags/SeFlag";
import type { ComponentType, CSSProperties, SVGProps } from "react";
import type { LanguageSwitcherLocale, LanguageSwitcherProps } from "./types";

// ---------------------------------------------------------------------------
// One-time style injection for pseudo-class states that can't use inline styles
// ---------------------------------------------------------------------------

const STYLE_ID = "ppui-lang-switcher";
let _stylesInjected = false;

function injectStyles(): void {
  if (_stylesInjected || typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) {
    _stylesInjected = true;
    return;
  }
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = [
    `.ppui-lang-trigger{outline:none;-webkit-tap-highlight-color:transparent}`,
    `.ppui-lang-trigger:focus-visible{outline:2px solid rgba(255,255,255,0.25);outline-offset:2px}`,
    `.ppui-lang-item{outline:none;background:transparent;-webkit-tap-highlight-color:transparent}`,
    `.ppui-lang-item:hover{color:rgba(255,255,255,1)!important}`,
    `.ppui-lang-item:focus-visible{background:rgba(255,255,255,0.08);outline:none}`,
  ].join("\n");
  document.head.appendChild(el);
  _stylesInjected = true;
}

// ---------------------------------------------------------------------------
// Locale definitions — package owns these, consumers don't pass them in
// ---------------------------------------------------------------------------

interface LocaleEntry {
  value: LanguageSwitcherLocale;
  shortLabel: string;
  label: string;
  Flag: ComponentType<SVGProps<SVGSVGElement>>;
}

const LOCALES: LocaleEntry[] = [
  { value: "en", shortLabel: "EN", label: "English", Flag: GbFlag },
  { value: "sv", shortLabel: "SV", label: "Svenska", Flag: SeFlag },
];

// ---------------------------------------------------------------------------
// Internal chevron icon
// ---------------------------------------------------------------------------

function ChevronDown({ style }: { style?: CSSProperties }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={style}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// LanguageSwitcher
// ---------------------------------------------------------------------------

export function LanguageSwitcher({
  value,
  onChange,
  className,
  ariaLabel = "Select language",
  disabled = false,
}: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = `ppui-lang-${useId().replace(/:/g, "")}`;
  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    injectStyles();
  }, []);

  const current = LOCALES.find((l) => l.value === value) ?? LOCALES[0];

  // Keep dropdown position in sync with the trigger
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    const update = () => {
      if (!triggerRef.current) return;
      const r = triggerRef.current.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  // Close when clicking outside the trigger or menu
  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      const menu = document.getElementById(menuId);
      if (menu?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open, menuId]);

  // Close on Escape, returning focus to trigger
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleToggle = useCallback(() => {
    if (!disabled) setOpen((v) => !v);
  }, [disabled]);

  return (
    <div className={className} style={{ display: "inline-block" }}>
      <button
        ref={triggerRef}
        type="button"
        className="ppui-lang-trigger"
        onClick={handleToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={ariaLabel}
        disabled={disabled}
        style={{
          display: "flex",
          alignItems: "center",
          minHeight: 40,
          gap: 8,
          padding: "0 6px",
          border: "none",
          background: "transparent",
          cursor: disabled ? "not-allowed" : "pointer",
          borderRadius: 8,
          opacity: disabled ? 0.5 : 1,
          color: "rgba(255,255,255,0.9)",
        }}
      >
        <current.Flag
          width={36}
          height={27}
          style={{ borderRadius: 4, flexShrink: 0, display: "block" }}
          aria-hidden={true}
        />
        <span
          style={{
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            lineHeight: 1,
          }}
        >
          {current.shortLabel}
        </span>
        <ChevronDown
          style={{
            flexShrink: 0,
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 150ms",
          }}
        />
      </button>

      {open &&
        rect &&
        typeof document !== "undefined" &&
        createPortal(
          <ul
            id={menuId}
            role="menu"
            aria-label={ariaLabel}
            style={{
              position: "fixed",
              top: rect.top + rect.height + 6,
              left: rect.left,
              minWidth: 130,
              zIndex: 9999,
              background: "rgba(10, 7, 34, 0.88)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 12,
              padding: 6,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              listStyle: "none",
              margin: 0,
            }}
          >
            {LOCALES.filter((loc) => loc.value !== value).map((loc) => (
              <li key={loc.value} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="ppui-lang-item"
                  onClick={() => {
                    onChange(loc.value);
                    setOpen(false);
                  }}
                  aria-label={loc.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    width: "100%",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    boxSizing: "border-box",
                  }}
                >
                  <loc.Flag
                    width={36}
                    height={27}
                    style={{ borderRadius: 4, flexShrink: 0, display: "block" }}
                    aria-hidden={true}
                  />
                  <span>{loc.shortLabel}</span>
                </button>
              </li>
            ))}
          </ul>,
          document.body
        )}
    </div>
  );
}
