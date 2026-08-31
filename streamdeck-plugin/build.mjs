// Bundle do plugin. O banner injeta um `require` (createRequire) porque a lib
// `ws` (WebSocket do SDK) usa require() de builtins, e o esbuild em ESM nao
// suporta require dinamico sem esse shim.
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
