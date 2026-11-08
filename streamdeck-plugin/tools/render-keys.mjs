// SPDX-FileCopyrightText: 2026 Felipe Drummond
// SPDX-License-Identifier: GPL-3.0-or-later
// Renders every key state into one contact sheet, using the SAME functions the
// physical key uses. Nothing here is a mockup: if a key looks wrong in the
// browser, it looks wrong on the Deck.
//
//   node tools/render-keys.mjs [pt|en|es]
//
// Writes docs/keys-<locale>.html and opens nothing — look at it yourself.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  allOffKey, blindKey, deviceKey, noticeKey, sceneKey, wakingKey,
  PLAIN_LABEL, PLAIN_LOOK, TINTS,
} from "../src/keys.ts";
import { keyText } from "../src/i18n.ts";

// look("lamp") is a plain key wearing that icon; anything else overrides on top.
const look = (icon, over = {}) => ({
  ...PLAIN_LOOK, icon, ...over,
  label: { ...PLAIN_LABEL, ...(over.label ?? {}) },
});
const tint = (name) => TINTS.find((entry) => entry.name === name).value;

// Invented names, in the sheet's own language. Deliberately nobody's real
// house: a contact sheet is documentation, and documentation travels.
const SAMPLE = {
  pt: {
    socket: "Luminária", gang: "Sala — 1", bulb: "Leitura", hall: "Entrada",
    spot: "Bancada", fan: "Ventilador", frame: "Moldura", blind: "Persiana",
    curtain: "Cortina", sleep: "Dormir", work: "Foco", late: "Fim de tarde",
    night: "Modo noturno", movie: "Cinema", room: "Sala", short: "Luz",
    long: "Luminária do canto da sala",
    twoLine: `Luz da
escada`,
    threeLine: `Luz de
leitura da
poltrona`,
    fourLine: `Apagar
tudo
antes de
sair`,
  },
  en: {
    socket: "Floor lamp", gang: "Living — 1", bulb: "Reading", hall: "Hallway",
    spot: "Counter", fan: "Fan", frame: "Frame", blind: "Blind",
    curtain: "Curtain", sleep: "Sleep", work: "Focus", late: "Evening",
    night: "Night mode", movie: "Movie", room: "Living", short: "Light",
    long: "Floor lamp in the living room corner",
    twoLine: `Stair
light`,
    threeLine: `Reading
light by
the chair`,
    fourLine: `Turn
everything
off before
leaving`,
  },
  es: {
    socket: "Lámpara", gang: "Salón — 1", bulb: "Lectura", hall: "Entrada",
    spot: "Encimera", fan: "Ventilador", frame: "Marco", blind: "Persiana",
    curtain: "Cortina", sleep: "Dormir", work: "Enfoque", late: "Atardecer",
    night: "Modo noche", movie: "Cine", room: "Salón", short: "Luz",
    long: "Lámpara del rincón del salón",
    twoLine: `Luz de la
escalera`,
    threeLine: `Luz de
lectura del
sillón`,
    fourLine: `Apagar
todo
antes de
salir`,
  },
};

const locale = process.argv[2] ?? "pt";
const text = keyText(locale);
const name = SAMPLE[locale] ?? SAMPLE.en;
const allOff = text.allOff.join(" ");
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const sheet = [
  ["Light / socket", [
    ["socket, on, power", deviceKey(true, true, name.socket, "7.6 W", "lan", look("socket"))],
    ["socket, off", deviceKey(false, true, name.socket, "0.0 W", "lan", look("socket"))],
    ["wall switch, on", deviceKey(true, true, name.gang, "", "lan", look("switch"))],
    ["wall switch, off", deviceKey(false, true, name.gang, "", "lan", look("switch"))],
    ["bulb via cloud", deviceKey(true, true, name.bulb, "", "cloud", look("bulb"))],
    ["offline", deviceKey(false, false, name.hall, text.offline, "lan", look("switch"))],
  ]],
  ["Icons you can pick — lit, unlit, out of touch", [
    ["lamp, on", deviceKey(true, true, name.socket, "7.6 W", "lan", look("lamp"))],
    ["lamp, off", deviceKey(false, true, name.socket, "", "lan", look("lamp"))],
    ["lamp, offline", deviceKey(false, false, name.socket, text.offline, "lan", look("lamp"))],
    ["spot, on", deviceKey(true, true, name.spot, "", "lan", look("spot"))],
    ["spot, off", deviceKey(false, true, name.spot, "", "lan", look("spot"))],
    ["fan, on", deviceKey(true, true, name.fan, "", "lan", look("fan"))],
    ["fan, off", deviceKey(false, true, name.fan, "", "lan", look("fan"))],
    ["picture, on", deviceKey(true, true, name.frame, "", "cloud", look("picture"))],
    ["picture, off", deviceKey(false, true, name.frame, "", "cloud", look("picture"))],
    ["sleep", sceneKey(name.sleep, "", false, look("sleep"))],
    ["work", sceneKey(name.work, text.tapApplies, true, look("work"))],
    ["work, late", sceneKey(name.late, "", false, look("worklate"))],
    ["night owl", sceneKey(name.night, "", false, look("night"))],
    ["blind as a picture", deviceKey(true, true, name.curtain, "", "lan", look("blind"))],
    ["star", sceneKey(name.movie, "", false, look("star"))],
    ["power", allOffKey(allOff, text.hold, false, look("power"))],
    ["sleep as all-off", allOffKey(name.sleep, text.hold, true, look("sleep"))],
  ]],
  ["Blind — the picture follows the position", [
    ["fully open", blindKey(0, true, name.blind, text.open, text.isOpen)],
    ["15% covered", blindKey(15, true, name.blind, `${text.close} 10%`, "")],
    ["30% covered", blindKey(30, true, name.blind, `${text.close} 10%`, "")],
    ["51% covered", blindKey(51, true, name.blind, `${text.open} 10%`, "")],
    ["80% covered", blindKey(80, true, name.blind, `${text.open} 10%`, "")],
    ["fully closed", blindKey(100, true, name.blind, text.stop, text.isClosed)],
    ["closed, offline", blindKey(100, false, name.blind, text.offline, "")],
    ["30%, no readout", blindKey(30, true, name.blind, `${text.close} 10%`, "",
      PLAIN_LOOK, false)],
    ["open, no readout", blindKey(0, true, name.blind, text.open, text.isOpen,
      PLAIN_LOOK, false)],
    ["closed, no readout", blindKey(100, true, name.blind, text.stop, text.isClosed,
      PLAIN_LOOK, false)],
  ]],
  ["Scene and all-off", [
    ["cloud scene", sceneKey(name.sleep, "", false, look("star"))],
    ["local scene", sceneKey(name.movie, text.tapApplies, true, look("star"))],
    ["just saved", sceneKey(name.movie, text.sceneSaved, true, look("star"))],
    ["all off, idle", allOffKey(allOff, text.hold, false, look("power"))],
    ["all off, armed", allOffKey(text.holdToSave[0], text.holdToSave[1], true, look("power"))],
  ]],
  ["Label — line breaks and wrapping", [
    ["one line", deviceKey(true, true, name.socket, "", "lan", look("lamp"))],
    ["wraps on its own", deviceKey(true, true, name.long, "", "lan", look("lamp"))],
    ["own line break", deviceKey(true, true, name.twoLine, "", "lan", look("switch"))],
    ["three lines + state", deviceKey(true, true, name.threeLine, "7.6 W", "lan", look("bulb"))],
    ["four lines: icon gives way", allOffKey(name.fourLine, "", false, look("power"))],
  ]],
  ["Label — font, case, weight, size", [
    ["bold", deviceKey(true, true, name.socket, "", "lan",
      look("socket", { label: { bold: true } }))],
    ["uppercase", deviceKey(true, true, name.socket, "", "lan",
      look("socket", { label: { letters: "upper" } }))],
    ["size 14 bold", deviceKey(true, true, name.short, "", "lan",
      look("socket", { label: { size: 14, bold: true } }))],
    ["size 7", deviceKey(true, true, name.long, "", "lan",
      look("socket", { label: { size: 7 } }))],
    ["Impact 13", deviceKey(true, true, name.room, "", "lan",
      look("switch", { label: { font: "Impact", size: 13, letters: "upper" } }))],
    ["Georgia 11", sceneKey(name.sleep, "", false,
      look("sleep", { label: { font: "Georgia", size: 11 } }))],
    ["Consolas 10", sceneKey(name.movie, "", true,
      look("star", { label: { font: "Consolas" } }))],
    ["Verdana bold 12", blindKey(40, true, name.room, "", "",
      look("blind", { label: { font: "Verdana", size: 12, bold: true } }))],
  ]],
  ["Colour, on every action", [
    ["blind, default", blindKey(60, true, name.blind, "", "")],
    ["blind, warm", blindKey(60, true, name.blind, "", "",
      look("blind", { tint: tint("warm") }))],
    ["blind, white", blindKey(60, true, name.blind, "", "",
      look("blind", { tint: tint("white") }))],
    ["blind, green", blindKey(60, true, name.blind, "", "",
      look("blind", { tint: tint("green") }))],
    ["lamp, amber", deviceKey(true, true, name.short, "", "lan", look("lamp"))],
    ["lamp, violet", deviceKey(true, true, name.short, "", "lan",
      look("lamp", { tint: tint("violet") }))],
    ["lamp, cyan", deviceKey(true, true, name.short, "", "lan",
      look("lamp", { tint: tint("cyan") }))],
    ["scene, pink", sceneKey(name.movie, "", false, look("star", { tint: tint("pink") }))],
    ["all off, red", allOffKey(allOff, text.hold, true, look("power", { tint: tint("red") }))],
    ["work, green", sceneKey(name.work, "", false, look("work", { tint: tint("green") }))],
  ]],
  ["Waiting and warnings", [
    ["starting (lamp)", wakingKey(name.socket, look("lamp"))],
    ["starting (blind)", wakingKey(name.blind, look("blind"))],
    ["starting (scene)", wakingKey(name.sleep, look("star"))],
    ["not paired", noticeKey(text.notPaired)],
    ["pick a device", noticeKey(text.pickLoad)],
  ]],
];

const groups = sheet.map(([title, keys]) => `
  <h2>${title}</h2>
  <div class="grid">
    ${keys.map(([caption, uri]) => `
      <figure><img src="${uri}" width="96" height="96" alt="${caption}">
      <figcaption>${caption}</figcaption></figure>`).join("")}
  </div>`).join("");

const page = `<!doctype html>
<meta charset="utf-8"><title>Tua Casa — keys (${locale})</title>
<style>
  body { background:#101216; color:#c8ccd2; font:14px/1.5 Segoe UI, system-ui, sans-serif;
         margin:0; padding:28px 32px; }
  h1 { font-size:19px; margin:0 0 4px; color:#e8eaed; font-weight:600; }
  .sub { color:#7e858d; font-size:12.5px; margin-bottom:26px; }
  h2 { font-size:13px; font-weight:600; color:#8fa3b8; margin:26px 0 10px;
       text-transform:uppercase; letter-spacing:.07em; }
  .grid { display:flex; flex-wrap:wrap; gap:18px; }
  figure { margin:0; text-align:center; }
  img { display:block; border-radius:9px; background:#000; }
  figcaption { font-size:11px; color:#7e858d; margin-top:6px; max-width:96px; }
</style>
<h1>Tua Casa — every key state</h1>
<div class="sub">Rendered by the same functions the Stream Deck uses · interface language:
<b>${locale}</b> · keys are 72&nbsp;px, shown at 96&nbsp;px · sample names are invented</div>
${groups}
`;

mkdirSync(join(root, "docs"), { recursive: true });
const out = join(root, "docs", `keys-${locale}.html`);
writeFileSync(out, page, "utf8");
console.log(`wrote ${out}`);
