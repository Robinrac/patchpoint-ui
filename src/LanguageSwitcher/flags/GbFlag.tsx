import { useId } from "react";
import type { SVGProps } from "react";

/**
 * UK/GB flag (Union Jack) as an inline React SVG component.
 * Each instance generates unique clip-path IDs via useId to avoid collisions
 * when multiple instances are rendered on the same page.
 */
export function GbFlag(props: SVGProps<SVGSVGElement>) {
  const uid = useId();
  const a = `${uid}gb-a`;
  const b = `${uid}gb-b`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 30"
      {...props}
    >
      <defs>
        <clipPath id={a}>
          <path d="M0 0v30h60V0z" />
        </clipPath>
        <clipPath id={b}>
          <path d="M30 15h30v15zv15H0zH0V0zV0h30z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${a})`}>
        <path d="M0 0v30h60V0z" fill="#012169" />
        <path d="m0 0 60 30m0-30L0 30" stroke="#fff" strokeWidth={6} />
        <path
          d="m0 0 60 30m0-30L0 30"
          clipPath={`url(#${b})`}
          stroke="#C8102E"
          strokeWidth={4}
        />
        <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth={10} />
        <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth={6} />
      </g>
    </svg>
  );
}
