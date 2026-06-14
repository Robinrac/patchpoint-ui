import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "ParticleImage/index": "src/ParticleImage/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  treeshake: true,
  // ParticleImage is a client component (uses hooks + dynamic p5 import).
  // esbuild strips the source-level "use client" directive during bundling, and
  // a tsup `banner` is dropped the same way, so re-add it as a post-build step
  // to preserve the client boundary for Next.js RSC apps.
  onSuccess: "node scripts/add-use-client.mjs",
});
