// Prepends the `"use client"` directive to the built JS/CJS bundles.
//
// ParticleImage is a client component, but esbuild (via tsup) strips both the
// source-level directive and any configured banner during bundling. tsup emits
// the component and its config utilities into a shared chunk, so we mark every
// emitted module as a client module to preserve the Next.js RSC client
// boundary. This is intentional: the package's primary surface is the
// component, and the apps pass config in via props rather than resolving it on
// the server.

import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const DIRECTIVE = '"use client";\n';

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else if (/\.(js|cjs)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

let patched = 0;
for (const file of walk(DIST)) {
  const contents = readFileSync(file, "utf8");
  if (contents.startsWith('"use client"') || contents.startsWith("'use client'")) {
    continue;
  }
  // Keep a leading "use strict" (CJS) first, then add "use client" after it.
  if (contents.startsWith("'use strict';")) {
    const rest = contents.slice("'use strict';".length).replace(/^\n/, "");
    writeFileSync(file, `'use strict';\n${DIRECTIVE}${rest}`);
  } else {
    writeFileSync(file, DIRECTIVE + contents);
  }
  patched += 1;
}

console.log(`[add-use-client] patched ${patched} file(s)`);
