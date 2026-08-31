// SPDX-FileCopyrightText: 2026 Felipe Drummond
// SPDX-License-Identifier: GPL-3.0-or-later
// Bundles the plugin. The banner injects a `require` (createRequire) because
// `ws` -- the SDK's WebSocket -- calls require() on builtins, and esbuild in ESM
// has no dynamic require without that shim.
import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/plugin.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outfile: "com.felipedrummond.tuacasa.sdPlugin/bin/plugin.js",
  banner: {
    js: "import{createRequire as ___cr}from'node:module';const require=___cr(import.meta.url);",
  },
  logLevel: "info",
});
console.log("build ok");
