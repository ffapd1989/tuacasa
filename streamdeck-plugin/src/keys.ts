// SPDX-FileCopyrightText: 2026 Felipe Drummond
// SPDX-License-Identifier: GPL-3.0-or-later
// How every key is drawn. Pure functions: SVG in, data URI out.
//
// Kept apart from the plugin so the same code can be rendered outside the
// Stream Deck (see tools/render-keys.mjs) — the pictures in the docs are the
// real keys, not mockups.
//
// IMPORTANT: the rasteriser is QtSvg (SVG Tiny profile), which ignores font
// lists and quotes in font-family. Always a single family, unquoted, or the
// font silently falls back to the default.

import { iconArt, ICON_NAMES, TINTS } from "./icons.ts";

export type { IconName } from "./icons.ts";
export { TINTS, isTint } from "./icons.ts";

/** How the owner wants their label drawn. Per key, not global. */
export type LabelStyle = {
  font: string;
  size: number;
  bold: boolean;
  letters: "as" | "upper" | "lower";
};

/** Families that ship with Windows, so the silent fallback never bites. The
 *  panel builds its dropdown from this list — it travels with the catalogue,
 *  so there is one source of truth for it. */
export const FONTS = [
  "Segoe UI", "Arial", "Verdana", "Tahoma", "Trebuchet MS",
  "Georgia", "Times New Roman", "Consolas", "Impact",
];

export const PLAIN_LABEL: LabelStyle = {
  font: "Segoe UI", size: 10, bold: false, letters: "as",
};

/** Everything the owner chose about how one key looks, carried as one object
 *  because the alternative is a queue of seven positional arguments. */
export type KeyLook = {
  /** A name from the icon gallery. */
  icon: string;
  /** The accent this key wears; empty means the one its action was born with. */
  tint: string;
  label: LabelStyle;
};

export const PLAIN_LOOK: KeyLook = { icon: "bulb", tint: "", label: PLAIN_LABEL };

const PAPER = "#16181d";
const OFF = "#3b4048";
const ON = "#ffb02e";
const BLUE = "#5aa9e6";
const GREEN = "#7fd1a6";
const GONE = "#2a2d33";
const INK = "#e8eaed";

// The band the icons occupy, and the widest a line of label may be.
const ART_TOP = 8;
const ART_BOTTOM = 47;
const KEY_WIDTH = 66;
const MAX_LINES = 4;

export function escapeText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function asImage(inner: string): string {
  return `data:image/svg+xml;charset=utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">` +
      `<rect width="72" height="72" rx="8" fill="${PAPER}"/>${inner}</svg>`,
  )}`;
}

// Nothing here can measure text — QtSvg rasterises elsewhere and the plugin
// never sees a glyph. So the wrap estimates, with widths as a fraction of the
// font size. Erring wide costs an early break; erring narrow clips a word off
// the key, which is the failure nobody can work around.
const AVERAGE_WIDTH: Record<string, number> = {
  Verdana: 1.12, Tahoma: 1.0, Consolas: 1.02, Impact: 0.76,
  Georgia: 1.02, "Times New Roman": 0.92, "Trebuchet MS": 0.96,
};
const NARROW = "iljItfr'!.,:;|()[] ";
const WIDE = "mwMW@%—";

function textWidth(text: string, style: LabelStyle): number {
  const unit = style.size * (AVERAGE_WIDTH[style.font] ?? 1) * (style.bold ? 1.06 : 1);
  let total = 0;
  for (const glyph of text) {
    total += unit * (NARROW.includes(glyph) ? 0.31
      : WIDE.includes(glyph) ? 0.88
        : glyph >= "A" && glyph <= "Z" ? 0.66 : 0.55);
  }
  return total;
}

function clipToWidth(text: string, style: LabelStyle): string {
  let cut = text;
  while (cut.length > 1 && textWidth(`${cut}…`, style) > KEY_WIDTH) cut = cut.slice(0, -1);
  return `${cut}…`;
}

/** A word longer than the key has to be cut somewhere. */
function breakWord(word: string, style: LabelStyle): string[] {
  const parts: string[] = [];
  let current = "";
  for (const glyph of word) {
    if (current && textWidth(current + glyph, style) > KEY_WIDTH) {
      parts.push(current);
      current = glyph;
    } else {
      current += glyph;
    }
  }
  if (current) parts.push(current);
  return parts;
}

/** The label as it will actually appear: the owner's own line breaks honoured,
 *  anything still too long wrapped on word boundaries. */
export function wrapLabel(raw: string, style: LabelStyle = PLAIN_LABEL): string[] {
  const cased = style.letters === "upper" ? raw.toLocaleUpperCase()
    : style.letters === "lower" ? raw.toLocaleLowerCase() : raw;
  const lines: string[] = [];
  for (const paragraph of cased.split(/\r?\n/)) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (textWidth(candidate, style) <= KEY_WIDTH) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      const pieces = breakWord(word, style);
      lines.push(...pieces.slice(0, -1));
      line = pieces[pieces.length - 1] ?? "";
    }
    if (line) lines.push(line);
  }
  if (lines.length <= MAX_LINES) return lines;
  const kept = lines.slice(0, MAX_LINES);
  kept[MAX_LINES - 1] = clipToWidth(kept[MAX_LINES - 1], style);
  return kept;
}

function labelSvg(lines: string[], style: LabelStyle, lastBaseline: number): string {
  const step = style.size * 1.2;
  const weight = style.bold ? ` font-weight="bold"` : "";
  return lines
    .map((line, index) => {
      const y = lastBaseline - (lines.length - 1 - index) * step;
      return `<text x="36" y="${y.toFixed(1)}" text-anchor="middle"` +
        ` font-family="${style.font}" font-size="${style.size}"${weight}` +
        ` fill="${INK}" opacity="0.92">${escapeText(line)}</text>`;
    })
    .join("");
}

/** Discreet corner dot: blue means the order travelled through the cloud. */
export function cloudDot(via: string): string {
  return via === "cloud" ? `<circle cx="63" cy="9" r="2.6" fill="${BLUE}" opacity="0.8"/>` : "";
}

/** Puts the icon, the label and the state line on one key.
 *
 *  A label may run to several lines at any size, so the icon has to give way:
 *  it is scaled into whatever height the label leaves, and dropped entirely
 *  when the label wants the whole key. Crushing the icon into an unreadable
 *  smudge would be worse than losing it.
 *
 *  `mark` is the icon's own colour, and it is what survives that: a key with
 *  no room for an icon still has to say whether the light is on, so the colour
 *  comes back as a bar across the top.
 */
function compose(art: string, extra: string, title: string, detail: string,
                 tone: string, style: LabelStyle, mark: string): string {
  const detailLine = detail
    ? `<text x="36" y="67" text-anchor="middle" font-family="${style.font}"` +
      ` font-size="9" fill="${tone}" opacity="0.85">${escapeText(detail)}</text>`
    : "";
  const lines = wrapLabel(title, style);
  if (!lines.length) return asImage(art + extra + detailLine);

  const step = style.size * 1.2;
  const lastBaseline = detail ? 56 : 62;
  const top = lastBaseline - (lines.length - 1) * step - style.size * 0.8;
  const scale = Math.min(1, (top - 3 - ART_TOP) / (ART_BOTTOM - ART_TOP));

  if (scale >= 0.42) {
    const shrunk = scale > 0.99 ? art
      : `<g transform="translate(36,${ART_TOP}) scale(${scale.toFixed(3)})` +
        ` translate(-36,-${ART_TOP})">${art}</g>`;
    return asImage(shrunk + extra + labelSvg(lines, style, lastBaseline) + detailLine);
  }

  // No room left: the label IS the key. Centre it in what the detail line
  // spares, and keep the state as a bar so nothing is lost but the drawing.
  const bar = `<rect x="8" y="6" width="56" height="3.4" rx="1.7" fill="${mark}"/>`;
  const middle = detail ? 32 : 38;
  const centred = middle + ((lines.length - 1) * step) / 2 + style.size * 0.3;
  return asImage(bar + extra + labelSvg(lines, style, centred) + detailLine);
}

/** Any on/off output: a light, a socket, one gang of a wall switch. The picture
 *  and the accent are the owner's choice; which of the two states shows is the
 *  device's. */
export function deviceKey(on: boolean, online: boolean, title: string, detail: string,
                          via: string, look: KeyLook = PLAIN_LOOK): string {
  const accent = look.tint || ON;
  const tone = !online ? GONE : on ? accent : OFF;
  return compose(iconArt(look.icon, tone, on && online), cloudDot(via), title, detail,
                 on ? accent : INK, look.label, tone);
}

/** Blind key: how covered the window is, drawn as a blind that actually moves.
 *
 *  The slats are a gauge, not a picture — they hang from the headrail down to
 *  wherever the blind stopped — so this one draws its own art instead of taking
 *  an icon from the gallery. Fully open is an empty window, fully closed is a
 *  covered one, and in between the hem shows where the blind is. `readout` is
 *  the number (or the word) over it, which the owner can turn off.
 *
 *  `covered` is the share of window the blind hides (0 = clear glass). Which raw
 *  percentage means that is an install-time question — motors can be wired either
 *  way and the API does not say — so the caller resolves it.
 */
export function blindKey(covered: number, online: boolean, title: string, detail: string,
                         word: string, look: KeyLook = PLAIN_LOOK,
                         readout = true): string {
  const style = look.label;
  const tone = online ? look.tint || BLUE : GONE;
  const share = Math.max(0, Math.min(100, covered));
  const top = 12.5;
  const drop = (32 * share) / 100;
  // The headrail is always there — it is what says "blind" rather than "window".
  const rail = `<rect x="14" y="7.5" width="44" height="5" rx="1.7" fill="${tone}"` +
    ` opacity="0.9"/>`;
  const frame =
    `<rect x="15" y="8" width="42" height="38" rx="3" fill="none" stroke="${tone}"` +
    ` stroke-width="1.6" opacity="0.4"/>`;
  const panel = drop > 1
    ? `<rect x="17" y="${top.toFixed(1)}" width="38" height="${drop.toFixed(1)}" rx="1.2"` +
      ` fill="${tone}" opacity="0.24"/>`
    : "";
  const slats: string[] = [];
  for (let line = 1; line * 5.5 < drop - 1; line += 1) {
    slats.push(`<rect x="17" y="${(top + line * 5.5).toFixed(1)}" width="38" height="1.4"` +
      ` fill="${tone}" opacity="0.5"/>`);
  }
  // The weighted bottom rail is the part the eye tracks as the blind moves.
  const hem = drop > 3
    ? `<rect x="16" y="${(top + drop - 2).toFixed(1)}" width="40" height="2.6" rx="1.3"` +
      ` fill="${tone}" opacity="0.85"/>`
    : "";
  // At the extremes the number says nothing a word cannot say better. And the
  // owner may want neither: the drawing carries the position on its own.
  const centre = !readout ? ""
    : word
      ? `<text x="36" y="35" text-anchor="middle" font-family="${style.font}" font-size="14"` +
        ` fill="${INK}" opacity="0.95">${escapeText(word)}</text>`
      : `<text x="36" y="38" text-anchor="middle" font-family="${style.font}" font-size="24"` +
        ` fill="${INK}" opacity="0.95">${share}%</text>`;
  return compose(frame + panel + slats.join("") + hem + rail + centre, "", title, detail,
                 INK, style, tone);
}

export function sceneKey(title: string, detail: string, highlight: boolean,
                         look: KeyLook = PLAIN_LOOK): string {
  const tone = look.tint || (highlight ? GREEN : BLUE);
  return compose(iconArt(look.icon, tone), "", title, detail, tone, look.label, tone);
}

export function allOffKey(title: string, detail: string, armed: boolean,
                          look: KeyLook = PLAIN_LOOK): string {
  const tone = armed ? look.tint || ON : OFF;
  return compose(iconArt(look.icon, tone, armed), "", title, detail, tone, look.label, tone);
}

/** A message the owner has to read, centred and big enough to actually read.
 *  Deliberately not styled by the key's own settings: this is the plugin
 *  talking, not the key wearing its name. */
export function noticeKey(lines: string[]): string {
  const size = lines.length > 1 ? 12 : 13;
  const step = size + 4;
  const top = 36 - ((lines.length - 1) * step) / 2 + size / 3;
  const body = lines
    .map(
      (line, index) =>
        `<text x="36" y="${(top + index * step).toFixed(1)}" text-anchor="middle"` +
        ` font-family="${PLAIN_LABEL.font}" font-size="${size}" fill="${INK}"` +
        ` opacity="0.82">${escapeText(line)}</text>`,
    )
    .join("");
  return asImage(body);
}

/** Waiting for the worker: the key's own icon, dimmed. No English word flashing
 *  on a key the owner set up in another language, and no jitter. */
export function wakingKey(title: string, look: KeyLook = PLAIN_LOOK): string {
  return compose(iconArt(look.icon, GONE), "", title, "", INK, look.label, GONE);
}

/** Every icon as a picture, for the panel to show instead of a list of names. */
export function iconGallery(): { name: string; image: string }[] {
  const amber = TINTS[0].value;
  return ICON_NAMES.map((name) => ({ name, image: asImage(iconArt(name, amber)) }));
}
