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
// One-time style injection — responsive pseudo-class and breakpoint styles
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
    // Trigger — responsive gap/padding; focus ring as box-shadow (matches SkillTap ring-2 ring-white/20)
    `.ppui-lang-trigger{gap:4px;padding:0 4px;outline:none;-webkit-tap-highlight-color:transparent;transition:color 150ms,background-color 150ms,border-color 150ms}`,
    `.ppui-lang-trigger:focus-visible{box-shadow:0 0 0 2px rgba(255,255,255,0.2);outline:none}`,
    `.ppui-lang-trigger:active{filter:brightness(0.9)}`,
    // Flag — responsive sizes matching SkillTap w-6/sm:w-7/md:w-9 h-[18px]/sm:h-[21px]/md:h-[27px]
    `.ppui-lang-flag{width:24px;height:18px;border-radius:4px;display:block;flex-shrink:0;overflow:hidden}`,
    // Label — hidden on mobile (matches SkillTap hidden sm:inline)
    `.ppui-lang-label{display:none;color:#fff;font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.025em;line-height:1}`,
    // Option label — display toggle only; color/font inherit from .ppui-lang-item
    `.ppui-lang-item-label{display:none}`,
    // Chevron — responsive sizes matching SkillTap w-3.5/sm:w-4/md:w-5
    `.ppui-lang-chevron{width:14px;height:14px;flex-shrink:0;transition:transform 150ms;color:#fff}`,
    // Option items — responsive gap/padding/font-size matching SkillTap
    `.ppui-lang-item{display:flex;align-items:center;gap:6px;padding:8px;border-radius:8px;font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.025em;outline:none;background:transparent;-webkit-tap-highlight-color:transparent;transition:color 150ms,background-color 150ms;width:100%;box-sizing:border-box;cursor:pointer}`,
    `.ppui-lang-item:hover{color:#fff!important}`,
    `.ppui-lang-item:focus-visible{background:rgba(255,255,255,0.08);outline:none}`,
    // sm: 640px+
    `@media(min-width:640px){.ppui-lang-trigger{gap:8px;padding:0 6px}.ppui-lang-flag{width:28px;height:21px}.ppui-lang-label{display:inline}.ppui-lang-item-label{display:inline}.ppui-lang-chevron{width:16px;height:16px}.ppui-lang-item{gap:8px;padding:10px}}`,
    // md: 768px+
    `@media(min-width:768px){.ppui-lang-trigger{gap:10px}.ppui-lang-flag{width:36px;height:27px}.ppui-lang-label{font-size:.875rem}.ppui-lang-chevron{width:20px;height:20px}.ppui-lang-item{gap:12px;padding:10px 12px;font-size:1rem}}`,
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
// Internal chevron — matches Tabler IconChevronDown path and stroke exactly
// ---------------------------------------------------------------------------

function ChevronDown({
  style,
  className,
}: {
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={true}
      className={className}
      style={style}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M6 9l6 6 6-6" />
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
  // Inject styles synchronously during render so CSS is present before paint.
  // Idempotent — safe to call on every render and in React StrictMode.
  injectStyles();

  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = `ppui-lang-${useId().replace(/:/g, "")}`;
  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

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
          border: "none",
          background: "transparent",
          cursor: disabled ? "not-allowed" : "pointer",
          borderRadius: 8,
          opacity: disabled ? 0.5 : 1,
          color: "#ffffff",
        }}
      >
        <current.Flag
          className="ppui-lang-flag"
          width={36}
          height={27}
          aria-hidden={true}
        />
        <span className="ppui-lang-label">{current.shortLabel}</span>
        <ChevronDown
          className="ppui-lang-chevron"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
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
              width:
                typeof window !== "undefined" && window.innerWidth < 640
                  ? Math.max(rect.width + 12, 68)
                  : window.innerWidth < 768
                    ? 130
                    : 168,
              zIndex: 9999,
              background: "transparent",
              overflow: "hidden",
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
                    border: "none",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  <loc.Flag
                    className="ppui-lang-flag"
                    width={36}
                    height={27}
                    aria-hidden={true}
                  />
                  <span className="ppui-lang-item-label">{loc.shortLabel}</span>
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
