// SPDX-FileCopyrightText: 2026 Felipe Drummond
// SPDX-License-Identifier: GPL-3.0-or-later
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { allOffKey, blindKey, deviceKey, sceneKey, PLAIN_LABEL, PLAIN_LOOK } from "../src/keys.ts";
import { keyText } from "../src/i18n.ts";

const CHROME = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const pluginDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(pluginDir, "..");
const workDir = join(pluginDir, "node_modules", ".cache", "promo");
const iconDir = join(pluginDir, "com.felipedrummond.tuacasa.sdPlugin", "imgs", "plugin");
mkdirSync(workDir, { recursive: true });

function screenshot(name, html, width, height, outFile) {
  const page = join(workDir, `${name}.html`);
  writeFileSync(page, html, "utf8");
  execFileSync(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
    "--default-background-color=00000000", `--window-size=${width},${height}`,
    `--screenshot=${outFile}`, pathToFileURL(page).href,
  ], { stdio: "ignore" });
  console.log(`wrote ${outFile}`);
}

const look = (icon, over = {}) => ({ ...PLAIN_LOOK, icon, ...over, label: { ...PLAIN_LABEL } });

const pluginSvg = readFileSync(join(iconDir, "plugin.svg"), "utf8");
for (const [size, file] of [[256, "plugin.png"], [512, "plugin@2x.png"]]) {
  screenshot(`icon-${size}`, `<!doctype html><style>html,body{margin:0;background:transparent}
    svg{display:block;width:${size}px;height:${size}px}</style>${pluginSvg}`,
    size, size, join(iconDir, file));
}

const COPY = {
  en: {
    title: "Your home on the<br>Stream Deck.",
    body: "Lights, sockets, wall switches, blinds and scenes on your keys. " +
      "Commands go straight over your network in about 100 ms, and every key shows live state.",
    chips: ["Works with Tuya®-compatible devices", "Pairs inside the panel", "Free · GPL-3.0"],
    names: { socket: "Floor lamp", gang1: "Living — 1", gang2: "Living — 2", bulb: "Reading",
      spot: "Counter", fan: "Fan", blind: "Blind", curtain: "Curtain", sleep: "Sleep",
      movie: "Movie", work: "Focus", night: "Night mode", frame: "Frame", hall: "Hallway" },
  },
  pt: {
    title: "A sua casa no<br>Stream Deck.",
    body: "Luzes, tomadas, interruptores de parede, persianas e cenas nas suas teclas. " +
      "Os comandos vão direto pela sua rede, em cerca de 100 ms, e cada tecla mostra o estado ao vivo.",
    chips: ["Funciona com aparelhos compatíveis com Tuya®", "Pareia dentro do painel", "Gratuito · GPL-3.0"],
    names: { socket: "Luminária", gang1: "Sala — 1", gang2: "Sala — 2", bulb: "Leitura",
      spot: "Bancada", fan: "Ventilador", blind: "Persiana", curtain: "Cortina", sleep: "Dormir",
      movie: "Cinema", work: "Foco", night: "Modo noturno", frame: "Moldura", hall: "Entrada" },
  },
};

for (const [locale, copy] of Object.entries(COPY)) {
  const text = keyText(locale);
  const name = copy.names;
  const keys = [
    deviceKey(true, true, name.socket, "7.6 W", "lan", look("lamp")),
    deviceKey(true, true, name.gang1, "", "lan", look("switch")),
    deviceKey(false, true, name.gang2, "", "lan", look("switch")),
    deviceKey(true, true, name.bulb, "", "cloud", look("bulb")),
    deviceKey(false, true, name.spot, "", "lan", look("spot")),
    blindKey(30, true, name.blind, `${text.close} 10%`, ""),
    blindKey(100, true, name.curtain, text.stop, text.isClosed),
    deviceKey(true, true, name.fan, "", "lan", look("fan")),
    deviceKey(true, true, name.frame, "", "cloud", look("picture")),
    deviceKey(false, true, name.hall, "0.0 W", "lan", look("socket")),
    sceneKey(name.sleep, "", false, look("sleep")),
    sceneKey(name.movie, text.tapApplies, true, look("star")),
    sceneKey(name.work, "", false, look("work")),
    sceneKey(name.night, "", false, look("night")),
    allOffKey(text.allOff.join(" "), text.hold, false, look("power")),
  ];
  const html = `<!doctype html><meta charset="utf-8"><style>
    html,body{margin:0;width:1280px;height:640px;overflow:hidden}
    body{background:radial-gradient(circle at 78% 50%,#1d2129 0,#101216 62%);color:#e8eaed;
      font-family:Segoe UI,system-ui,sans-serif;display:flex;align-items:center;gap:56px;
      padding:0 64px;box-sizing:border-box}
    .copy{flex:1;min-width:0}
    .brand{display:flex;align-items:center;gap:12px;color:#ffb02e;font-weight:600;
      letter-spacing:.14em;text-transform:uppercase;font-size:17px;margin-bottom:22px}
    .brand img{width:44px;height:44px;border-radius:9px}
    h1{font-size:52px;line-height:1.08;margin:0 0 20px;font-weight:700;letter-spacing:-.01em}
    p{font-size:19px;line-height:1.5;color:#aab1bb;margin:0 0 28px;max-width:470px}
    .chips{display:flex;flex-wrap:wrap;gap:8px;max-width:500px}
    .chips span{font-size:14px;color:#c8ccd2;border:1px solid #2f343e;background:#171a20;
      border-radius:999px;padding:6px 13px}
    .deck{background:#0b0c0f;border:1px solid #262a32;border-radius:26px;padding:20px;
      display:grid;grid-template-columns:repeat(5,96px);gap:12px;
      box-shadow:0 30px 60px rgba(0,0,0,.45)}
    .deck img{width:96px;height:96px;border-radius:12px;display:block;background:#000}
  </style>
  <div class="copy">
    <div class="brand"><img src="data:image/svg+xml;utf8,${encodeURIComponent(pluginSvg)}">Tua Casa</div>
    <h1>${copy.title}</h1>
    <p>${copy.body}</p>
    <div class="chips">${copy.chips.map((chip) => `<span>${chip}</span>`).join("")}</div>
  </div>
  <div class="deck">${keys.map((uri) => `<img src="${uri}">`).join("")}</div>`;
  screenshot(`social-${locale}`, html, 1280, 640, join(repoRoot, "docs", "img", `social-preview-${locale}.png`));
}
