import type { SVGProps } from "react";

/**
 * Swedish flag as an inline React SVG component.
 * Cross position matches the canonical Swedish flag proportions (3/8 horizontal, centred vertically).
 */
export function SeFlag(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 10"
      {...props}
    >
      <rect width="16" height="10" fill="#005293" />
      {/* vertical bar: centred at x=6 (3/8 of 16), width 2 */}
      <rect x="5" width="2" height="10" fill="#fecb00" />
      {/* horizontal bar: centred at y=5 (midpoint), height 2 */}
      <rect y="4" width="16" height="2" fill="#fecb00" />
    </svg>
  );
}
