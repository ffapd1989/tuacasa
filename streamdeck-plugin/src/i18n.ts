// SPDX-FileCopyrightText: 2026 Felipe Drummond
// SPDX-License-Identifier: GPL-3.0-or-later
// Words that appear ON THE KEY, in the three interface languages.
//
// Kept apart from the panel's own strings (ui/i18n.js) because the reader is
// the same person but the space is not: a key is 72 px and the font shrinks
// until the text fits. Two short words is the practical ceiling here.

export type Locale = "pt" | "en" | "es";

export type KeyText = {
  starting: string;
  noWorker: string;
  notPaired: [string, string];
  pickLoad: [string, string];
  pickBlind: [string, string];
  pickScene: [string, string];
  offline: string;
  open: string;
  close: string;
  stop: string;
  /** State, not action: what the blind IS, not what the key does. */
  isOpen: string;
  isClosed: string;
  sceneSaved: string;
  hold: string;
  holdToSave: [string, string];
  tapApplies: string;
  allOff: [string, string];
  done: string;
};

const TEXT: Record<Locale, KeyText> = {
  pt: {
    starting: "iniciando…",
    noWorker: "sem worker",
    notPaired: ["conecte", "sua conta"],
    pickLoad: ["escolha", "o aparelho"],
    pickBlind: ["escolha", "a persiana"],
    pickScene: ["escolha", "a cena"],
    offline: "sem contato",
    open: "abrir",
    close: "fechar",
    stop: "parar",
    isOpen: "aberta",
    isClosed: "fechada",
    sceneSaved: "gravada",
    hold: "segure",
    holdToSave: ["segure p/", "gravar"],
    tapApplies: "toque aplica",
    allOff: ["apagar", "tudo"],
    done: "pronto",
  },
  en: {
    starting: "starting…",
    noWorker: "no worker",
    notPaired: ["connect", "your account"],
    pickLoad: ["choose", "a device"],
    pickBlind: ["choose", "a blind"],
    pickScene: ["choose", "a scene"],
    offline: "offline",
    open: "open",
    close: "close",
    stop: "stop",
    isOpen: "open",
    isClosed: "closed",
    sceneSaved: "saved",
    hold: "hold",
    holdToSave: ["hold to", "save"],
    tapApplies: "tap to apply",
    allOff: ["all", "off"],
    done: "done",
  },
  es: {
    starting: "iniciando…",
    noWorker: "sin worker",
    notPaired: ["conecta", "tu cuenta"],
    pickLoad: ["elige", "un aparato"],
    pickBlind: ["elige", "la persiana"],
    pickScene: ["elige", "la escena"],
    offline: "sin señal",
    open: "abrir",
    close: "cerrar",
    stop: "parar",
    isOpen: "abierta",
    isClosed: "cerrada",
    sceneSaved: "guardada",
    hold: "mantén",
    holdToSave: ["mantén p/", "guardar"],
    tapApplies: "pulsa: aplica",
    allOff: ["apagar", "todo"],
    done: "listo",
  },
};

/** Maps whatever the Stream Deck reports into one of the three we speak. */
export function asLocale(raw: string | undefined): Locale {
  const tag = (raw ?? "").toLowerCase();
  if (tag.startsWith("pt")) return "pt";
  if (tag.startsWith("es")) return "es";
  return "en";
}

export function keyText(locale: Locale): KeyText {
  return TEXT[locale] ?? TEXT.en;
}
