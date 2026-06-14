import type { CSSProperties } from "react";

// Shared design tokens used by every scenario page so all chrome
// (eyebrow, heading, body, card, CTA, input) looks identical.

export const FONT_FAMILY = "system-ui, sans-serif";

export const T: Record<string, CSSProperties> = {
  eyebrow: {
    fontFamily: FONT_FAMILY,
    fontSize: "0.75rem",
    fontWeight: 500,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#56ccf2",
    margin: "0 0 0.625rem",
  },
  heading: {
    fontFamily: FONT_FAMILY,
    fontSize: "1.5rem",
    fontWeight: 700,
    lineHeight: 1.2,
    color: "#ffffff",
    margin: "0 0 0.75rem",
  },
  headingLg: {
    fontFamily: FONT_FAMILY,
    fontSize: "2.5rem",
    fontWeight: 700,
    lineHeight: 1.15,
    color: "#ffffff",
    margin: "0 0 1rem",
  },
  body: {
    fontFamily: FONT_FAMILY,
    fontSize: "0.9rem",
    lineHeight: 1.65,
    color: "#a0a0b8",
    margin: "0 0 1.25rem",
  },
  card: {
    background: "rgba(10, 7, 34, 0.72)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "1.25rem",
    padding: "1.75rem 2rem",
    fontFamily: FONT_FAMILY,
    color: "#ffffff",
  },
  cta: {
    fontFamily: FONT_FAMILY,
    background: "#2d9cdb",
    color: "#ffffff",
    border: "none",
    borderRadius: "0.5rem",
    padding: "0.7rem 1.5rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    display: "block",
    width: "100%",
    textAlign: "center",
  },
  input: {
    fontFamily: FONT_FAMILY,
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    borderRadius: "0.5rem",
    padding: "0.7rem 1rem",
    color: "#ffffff",
    fontSize: "0.875rem",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
    marginBottom: "0.75rem",
  },
  subtext: {
    fontFamily: FONT_FAMILY,
    fontSize: "0.875rem",
    color: "#a0a0b8",
  },
};
