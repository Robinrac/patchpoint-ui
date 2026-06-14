import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const playgroundDir = path.dirname(fileURLToPath(import.meta.url));
const librarySrc = path.resolve(playgroundDir, "../src");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@library": librarySrc,
    },
  },
  server: {
    fs: {
      allow: [playgroundDir, librarySrc],
    },
  },
});
