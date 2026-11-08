// SPDX-FileCopyrightText: 2026 Felipe Drummond
// SPDX-License-Identifier: GPL-3.0-or-later
// Bundles the plugin. The banner injects a `require` (createRequire) because
// `ws` -- the SDK's WebSocket -- calls require() on builtins, and esbuild in ESM
// has no dynamic require without that shim.
import * as esbuild from "esbuild";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const NOTICES_FILE = "com.felipedrummond.tuacasa.sdPlugin/THIRD-PARTY-NOTICES.txt";

const result = await esbuild.build({
  entryPoints: ["src/plugin.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outfile: "com.felipedrummond.tuacasa.sdPlugin/bin/plugin.js",
  banner: {
    js: "import{createRequire as ___cr}from'node:module';const require=___cr(import.meta.url);",
  },
  metafile: true,
  logLevel: "info",
});
writeNotices(result.metafile);
console.log("build ok");

function writeNotices(metafile) {
  const packageDirs = new Set();
  for (const input of Object.keys(metafile.inputs)) {
    const packageDir = /^(.*node_modules\/(?:@[^/]+\/)?[^/]+)\//.exec(input)?.[1];
    if (packageDir) packageDirs.add(packageDir);
  }
  const blocks = [...packageDirs].sort().map((packageDir) => {
    const pkg = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
    const licenseFile = readdirSync(packageDir).find((name) => /^licen[cs]e/i.test(name));
    const text = licenseFile
      ? readFileSync(join(packageDir, licenseFile), "utf8").replace(/\r\n/g, "\n").trim()
      : `License: ${pkg.license}`;
    return `${pkg.name} ${pkg.version} (${pkg.license})\n\n${text}`;
  });
  const rule = `\n\n${"-".repeat(72)}\n\n`;
  const pythonNote = "The bundled Python runtime and its packages carry their own licence texts:\n" +
    "python/LICENSE.txt and python/Lib/site-packages/*.dist-info/.";
  writeFileSync(NOTICES_FILE,
    `Tua Casa bundles the following JavaScript packages in bin/plugin.js.${rule}` +
    `${blocks.join(rule)}${rule}${pythonNote}\n`, "utf8");
}
