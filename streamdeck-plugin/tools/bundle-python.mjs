// SPDX-FileCopyrightText: 2026 Felipe Drummond
// SPDX-License-Identifier: GPL-3.0-or-later
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PYTHON_VERSION = "3.14.6";
const EMBED_SHA256 = "df901e84a896ff1ee720ad03377e0c8d8c2244fda79808aeeaff6316df1cb75c";
const EMBED_URL = `https://www.python.org/ftp/python/${PYTHON_VERSION}/python-${PYTHON_VERSION}-embed-amd64.zip`;
const [major, minor] = PYTHON_VERSION.split(".");

const pluginDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const runtimeDir = join(pluginDir, "com.felipedrummond.tuacasa.sdPlugin", "python");
const sitePackages = join(runtimeDir, "Lib", "site-packages");
const requirements = join(pluginDir, "..", "requirements.txt");
const cachedZip = join(pluginDir, "node_modules", ".cache", `python-${PYTHON_VERSION}-embed-amd64.zip`);

if (!existsSync(cachedZip)) {
  mkdirSync(dirname(cachedZip), { recursive: true });
  const response = await fetch(EMBED_URL);
  if (!response.ok) throw new Error(`download failed: ${response.status} ${EMBED_URL}`);
  writeFileSync(cachedZip, Buffer.from(await response.arrayBuffer()));
}
const digest = createHash("sha256").update(readFileSync(cachedZip)).digest("hex");
if (digest !== EMBED_SHA256) {
  rmSync(cachedZip);
  throw new Error(`python embed zip hash mismatch: got ${digest}, expected ${EMBED_SHA256}`);
}

try {
  rmSync(runtimeDir, { recursive: true, force: true });
} catch (error) {
  if (error.code !== "EPERM" && error.code !== "EBUSY") throw error;
  throw new Error("the linked plugin is running on this Python; " +
    "run `npx streamdeck stop com.felipedrummond.tuacasa` first, and `restart` after packing");
}
mkdirSync(runtimeDir, { recursive: true });
const windowsTar = join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe");
execFileSync(windowsTar, ["-xf", cachedZip, "-C", runtimeDir], { stdio: "inherit" });

const pathFile = join(runtimeDir, `python${major}${minor}._pth`);
writeFileSync(pathFile, Buffer.concat([readFileSync(pathFile), Buffer.from("Lib\\site-packages\n")]));

execFileSync("py", [
  `-${major}.${minor}`, "-m", "pip", "install",
  "--target", sitePackages,
  "--only-binary=:all:", "--no-compile", "--disable-pip-version-check", "--quiet",
  "-r", requirements,
], { stdio: "inherit" });

rmSync(join(sitePackages, "bin"), { recursive: true, force: true });

const pythonExe = join(runtimeDir, "python.exe");
execFileSync(pythonExe, ["-c", "import tinytuya, tuya_sharing, qrcode, cryptography, paho.mqtt"], { stdio: "inherit" });

const installed = readdirSync(sitePackages)
  .filter((name) => name.endsWith(".dist-info"))
  .map((name) => name.replace(/\.dist-info$/, ""))
  .sort();
console.log(`python ${PYTHON_VERSION} bundled with ${installed.length} packages: ${installed.join(", ")}`);
