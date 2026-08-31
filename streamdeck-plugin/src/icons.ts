// SPDX-FileCopyrightText: 2026 Felipe Drummond
// SPDX-License-Identifier: GPL-3.0-or-later
// The pictures a key can wear. One family of shapes, drawn in the key's own
// 72x72 space and tinted with whatever colour the state calls for — so any
// icon works on any action, and every icon still says on or off.
//
// QtSvg (SVG Tiny) rasterises these: transforms and strokes are fine, but
// nothing here may rely on CSS, gradients or filters.

const PAPER = "#16181d";

/** The accent a key may wear. Amber is what a lamp does when it is on; the rest
 *  are there because a wall of amber keys is a wall you cannot read. */
export const TINTS: { name: string; value: string }[] = [
  { name: "amber", value: "#ffb02e" },
  { name: "warm", value: "#ffd9a0" },
  { name: "white", value: "#e8eaed" },
  { name: "green", value: "#7fd1a6" },
  { name: "cyan", value: "#5fd6cf" },
  { name: "blue", value: "#5aa9e6" },
  { name: "violet", value: "#b18cf0" },
  { name: "pink", value: "#ec86b8" },
  { name: "red", value: "#e8705c" },
];

export function isTint(colour: string | undefined): boolean {
  return TINTS.some((entry) => entry.value === colour);
}

export type IconName =
  | "bulb" | "lamp" | "spot" | "socket" | "switch" | "fan" | "blind" | "picture"
  | "star" | "sleep" | "work" | "worklate" | "night" | "power";

export const ICON_NAMES: IconName[] = [
  "bulb", "lamp", "spot", "socket", "switch", "fan", "blind", "picture",
  "star", "sleep", "work", "worklate", "night", "power",
];

/** Places borrowed artwork, given in its own coordinates, on the key. */
function fitted(art: string, minX: number, minY: number,
                width: number, height: number, span: number): string {
  const scale = span / Math.max(width, height);
  const x = 36 - (width * scale) / 2 - minX * scale;
  const y = 27.5 - (height * scale) / 2 - minY * scale;
  return `<g transform="translate(${x.toFixed(2)},${y.toFixed(2)})` +
    ` scale(${scale.toFixed(4)})">${art}</g>`;
}

// Table lamp, after the Phosphor `lamp` glyph (MIT). The shade is the lit part:
// filled with the state colour rather than the source's flat grey, so it goes
// orange with everything else.
const LAMP_SHADE =
  "M227.86768,152H28.13232a8,8,0,0,1-7.35315-11.15137l41.14283-96A8.00018,8.00018,0,0,1," +
  "69.27521,40H186.72485a8.0001,8.0001,0,0,1,7.35315,4.84863l41.14289,96A8.00007,8.00007," +
  "0,0,1,227.86768,152Z";
const LAMP_BODY =
  "M242.57373,137.69727l-41.14258-96A15.98283,15.98283,0,0,0,186.72461,32H69.27539a15.98283," +
  "15.98283,0,0,0-14.70654,9.69727l-41.14258,96A15.99943,15.99943,0,0,0,28.13232,160H120v48H96a8," +
  "8,0,0,0,0,16h64a8,8,0,0,0,0-16H136V160h56v32a8,8,0,0,0,16,0V160h19.86768a15.99943,15.99943,0,0," +
  "0,14.70605-22.30273ZM28.13232,144,69.273,48H186.7251l41.14258,96Z";

const ART: Record<IconName, (tone: string, lit: boolean) => string> = {
  bulb: (tone, lit) =>
    (lit ? `<circle cx="36" cy="26" r="19" fill="${tone}" opacity="0.16"/>` : "") +
    `<path d="M36 12c-6.6 0-12 5.2-12 11.7 0 4.3 2.3 7.4 4.4 9.8 1.3 1.5 2.1 2.6 2.3 4.1h10.6` +
    `c.2-1.5 1-2.6 2.3-4.1 2.1-2.4 4.4-5.5 4.4-9.8C48 17.2 42.6 12 36 12z" fill="${tone}"/>` +
    `<rect x="30" y="39.5" width="12" height="3.2" rx="1.6" fill="${tone}" opacity="0.75"/>` +
    `<rect x="31.5" y="44" width="9" height="3" rx="1.5" fill="${tone}" opacity="0.55"/>`,

  lamp: (tone, lit) =>
    (lit ? `<circle cx="36" cy="22" r="20" fill="${tone}" opacity="0.14"/>` : "") +
    fitted(`<path d="${LAMP_SHADE}" fill="${tone}" opacity="0.5"/>` +
           `<path d="${LAMP_BODY}" fill="${tone}"/>`, 13, 32, 230, 192, 41),

  // Ceiling spot: the beam only exists when the light is on, which is the
  // clearest on/off this whole gallery has.
  spot: (tone, lit) =>
    (lit
      ? `<path d="M22 29 13 47h46l-9-18z" fill="${tone}" opacity="0.26"/>` +
        `<path d="M26 29 21 47h30l-5-18z" fill="${tone}" opacity="0.22"/>`
      : "") +
    `<path d="M27 9h18a2 2 0 0 1 2 2l3 12H22l3-12a2 2 0 0 1 2-2z" fill="${tone}"/>` +
    `<rect x="20" y="24" width="32" height="4.6" rx="2.3" fill="${tone}"/>` +
    `<rect x="33.5" y="4" width="5" height="5" rx="1.4" fill="${tone}" opacity="0.7"/>`,

  fan: (tone, lit) =>
    `<circle cx="36" cy="27" r="20" fill="none" stroke="${tone}" stroke-width="1.6"` +
    ` opacity="0.35"/>` +
    [0, 120, 240].map((turn) =>
      `<g transform="rotate(${turn} 36 27)"><path d="M36 25c-2.6-9.4 1-15.6 6.4-14.2` +
      `C47 12 46.4 20.4 36 25z" fill="${tone}" opacity="${lit ? 0.95 : 0.8}"/></g>`).join("") +
    `<circle cx="36" cy="27" r="4.2" fill="${tone}"/>`,

  socket: (tone) =>
    `<rect x="19" y="10" width="34" height="34" rx="17" fill="none" stroke="${tone}"` +
    ` stroke-width="3.4"/><circle cx="30" cy="24" r="2.9" fill="${tone}"/>` +
    `<circle cx="42" cy="24" r="2.9" fill="${tone}"/>` +
    `<rect x="33.4" y="31" width="5.2" height="3" rx="1.5" fill="${tone}"/>`,

  switch: (tone, lit) =>
    `<rect x="22" y="8" width="28" height="38" rx="4" fill="none" stroke="${tone}"` +
    ` stroke-width="2.6"/><rect x="26" y="${lit ? 10 : 22}" width="20" height="18" rx="2.6"` +
    ` fill="${tone}" opacity="0.92"/>`,

  blind: (tone) =>
    `<rect x="16" y="9" width="40" height="36" rx="3" fill="none" stroke="${tone}"` +
    ` stroke-width="2.2"/>` +
    [0, 1, 2, 3].map((row) =>
      `<rect x="19" y="${13 + row * 7}" width="34" height="4" rx="1.3" fill="${tone}"` +
      ` opacity="0.55"/>`).join(""),

  picture: (tone) =>
    `<path d="M23 13 36 6l13 7" fill="none" stroke="${tone}" stroke-width="1.5"` +
    ` opacity="0.45" stroke-linejoin="round"/>` +
    `<rect x="16" y="13" width="40" height="32" rx="2.4" fill="none" stroke="${tone}"` +
    ` stroke-width="2.6"/>` +
    `<circle cx="45" cy="22" r="3.6" fill="${tone}" opacity="0.8"/>` +
    `<path d="M20 41l9-12 7 7 5-5 11 10z" fill="${tone}" opacity="0.5"/>`,

  star: (tone) =>
    `<path d="M36 11l4.6 9.6 10.4 1.5-7.5 7.4 1.8 10.5L36 35l-9.3 5 1.8-10.5-7.5-7.4 10.4-1.5z"` +
    ` fill="${tone}" opacity="0.92"/>`,

  // Sleep: the Zzz itself, which is the whole idea and the only part of a
  // sleeping face that survives being 40 px wide.
  sleep: (tone) =>
    `<path d="M34 9h18L34 25h18" fill="none" stroke="${tone}" stroke-width="3.6"` +
    ` stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M21 26h14L21 38h14" fill="none" stroke="${tone}" stroke-width="2.9"` +
    ` stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M13 39h9l-9 8h9" fill="none" stroke="${tone}" stroke-width="2.2"` +
    ` stroke-linecap="round" stroke-linejoin="round"/>`,

  work: (tone) =>
    `<rect x="19" y="10" width="34" height="24" rx="2.5" fill="${tone}" opacity="0.28"/>` +
    `<rect x="19" y="10" width="34" height="24" rx="2.5" fill="none" stroke="${tone}"` +
    ` stroke-width="2.6"/><path d="M17 37h38l5 6H12z" fill="${tone}"/>`,

  worklate: (tone) =>
    `<rect x="12" y="15" width="30" height="20" rx="2.4" fill="${tone}" opacity="0.28"/>` +
    `<rect x="12" y="15" width="30" height="20" rx="2.4" fill="none" stroke="${tone}"` +
    ` stroke-width="2.4"/><path d="M11 38h32l4 5H7z" fill="${tone}"/>` +
    `<circle cx="52" cy="17" r="10" fill="${PAPER}"/>` +
    `<circle cx="52" cy="17" r="8.4" fill="none" stroke="${tone}" stroke-width="2.4"/>` +
    `<path d="M52 17V11M52 17h4.5" fill="none" stroke="${tone}" stroke-width="2.2"` +
    ` stroke-linecap="round"/>`,

  night: (tone) =>
    `<circle cx="29" cy="22" r="8" fill="${tone}"/>` +
    `<path d="M15 47c0-9 6-15 14-15s14 6 14 15z" fill="${tone}"/>` +
    `<path d="M52 7a10.5 10.5 0 1 0 7.5 17.9A8.8 8.8 0 0 1 52 7z" fill="${tone}"/>`,

  power: (tone) =>
    `<path d="M26 18a13 13 0 1 0 20 0" fill="none" stroke="${tone}" stroke-width="3.4"` +
    ` stroke-linecap="round"/><rect x="34.3" y="9" width="3.4" height="15" rx="1.7"` +
    ` fill="${tone}"/>`,
};

export function iconArt(name: string, tone: string, lit = false): string {
  return (ART[name as IconName] ?? ART.bulb)(tone, lit);
}
