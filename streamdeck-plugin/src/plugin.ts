// SPDX-FileCopyrightText: 2026 Felipe Drummond
// SPDX-License-Identifier: GPL-3.0-or-later
// Tua Casa — control your smart home from the Stream Deck.
//
// The plugin does not speak the device protocol. It spawns a Python worker
// (worker/tuacasa.py) as a child process and talks JSONL over stdin/stdout.
// The worker reaches devices over the LAN with a persistent connection
// (~100ms) or, for devices that refuse local connections, through the cloud
// session (~250ms).
//
// The unit here is the switchable output, not the device: a 4-gang wall switch
// is one device but shows up as four independent entries, because that is how it
// gets laid out on the Deck.
//
// Keys are SVG generated at runtime. IMPORTANT: the rasterizer is QtSvg (SVG
// Tiny profile), which ignores font lists and quotes in font-family. Always
// use a single family with no quotes, or the font silently falls back.
import streamDeck, {
  action,
  SingletonAction,
  type DidReceiveSettingsEvent,
  type KeyDownEvent,
  type KeyUpEvent,
  type SendToPluginEvent,
  type WillAppearEvent,
  type WillDisappearEvent,
} from "@elgato/streamdeck";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { asLocale, keyText, type KeyText, type Locale } from "./i18n.ts";
import {
  alertKey, allOffKey, blindKey, deviceKey, iconGallery, isTint, noticeKey, sceneKey, wakingKey,
  FONTS, PLAIN_LABEL, TINTS, type KeyLook,
} from "./keys.ts";

const PLUGIN_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WORKER_PATH = join(PLUGIN_ROOT, "worker", "tuacasa.py");
const RESPAWN_MS = 4000;
const HOLD_MS = 800;

type Load = {
  id: string;
  code: string;
  name: string;
  device: string;
  category: string;
  product: string;
  version: string;
  via: "lan" | "cloud";
  kind: "onoff" | "position";
};

type CloudScene = { id: string; home: string; name: string; homeName: string };
type DeviceState = { values: Record<string, unknown>; online: boolean; via: string };
type JournalLine = { at: number; bad: boolean; text: string };
/** What a failed command was aimed at, so the key that sent it can say so. */
type Failure = { target?: string; scene?: string };

const JOURNAL_LIMIT = 200;

// Metering drifts by itself every few seconds. In the log that is not news,
// it is a wall of noise that buries the presses — the watts belong on the key.
const NOT_NEWS = new Set(["cur_power", "cur_voltage", "cur_current", "add_ele", "countdown_1"]);

/** How a value reads in the activity log: short enough for one line. */
function readable(value: unknown): string {
  if (typeof value === "boolean") return value ? "on" : "off";
  const text = String(value);
  return text.length > 22 ? `${text.slice(0, 21)}…` : text;
}

/** Owner of the Python process. One worker serves every key. */
class Worker {
  private child: ChildProcessWithoutNullStreams | null = null;
  private respawnTimer: NodeJS.Timeout | null = null;
  readonly loads: Load[] = [];
  readonly scenes: CloudScene[] = [];
  readonly localScenes: string[] = [];
  readonly states = new Map<string, DeviceState>();
  private listeners = new Set<() => void>();
  private failureListeners = new Set<(failed: Failure) => void>();
  private subscribed = new Set<string>();
  /** Recent activity, so the panel can show what is happening without
   *  anyone having to open a log file. */
  readonly journal: JournalLine[] = [];
  alive = false;
  paired = false;
  /** The account session died for good: only a new QR scan brings the cloud back. */
  sessionExpired = false;

  note(text: string, bad = false): void {
    this.journal.push({ at: Date.now(), bad, text });
    if (this.journal.length > JOURNAL_LIMIT) this.journal.shift();
    void streamDeck.ui.sendToPropertyInspector({ evt: "journal", lines: this.journal });
  }

  clearJournal(): void {
    this.journal.length = 0;
    void streamDeck.ui.sendToPropertyInspector({ evt: "journal", lines: this.journal });
  }

  nameOf(target: unknown): string {
    const identifier = String(target ?? "");
    return this.loads.find((load) => load.id === identifier)?.name || identifier;
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onFailure(listener: (failed: Failure) => void): void {
    this.failureListeners.add(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  /** Force every key to redraw — used when the interface language changes. */
  repaint(): void {
    this.notify();
  }

  start(): void {
    if (this.child) return;
    if (!existsSync(WORKER_PATH)) {
      streamDeck.logger.error(`worker not found at ${WORKER_PATH}`);
      return;
    }
    const [runtime, leadingArgs] = pythonRuntime();
    const child = spawn(runtime, [...leadingArgs, "-u", WORKER_PATH], { windowsHide: true });
    this.child = child;

    createInterface({ input: child.stdout }).on("line", (line) => {
      if (!line.startsWith("{")) return;
      try {
        this.receive(JSON.parse(line));
      } catch (error) {
        streamDeck.logger.warn(`unreadable worker line: ${String(error)}`);
      }
    });
    createInterface({ input: child.stderr }).on("line", (line) => {
      streamDeck.logger.info(`[worker] ${line}`);
      this.note(line, /error|fail|drop|unavailable|refus/i.test(line));
    });

    child.on("exit", (code) => {
      streamDeck.logger.warn(`worker exited (${code}); respawning`);
      this.note(`worker stopped (code ${code}); restarting in 4s`, true);
      this.child = null;
      this.alive = false;
      this.subscribed.clear();
      this.notify();
      if (!this.respawnTimer) {
        this.respawnTimer = setTimeout(() => {
          this.respawnTimer = null;
          this.start();
        }, RESPAWN_MS);
      }
    });
    child.on("error", (error) => streamDeck.logger.error(`worker failed: ${error.message}`));
  }

  private receive(event: Record<string, any>): void {
    switch (event.evt) {
      case "ready":
        this.loads.length = 0;
        this.loads.push(...((event.loads ?? []) as Load[]));
        this.scenes.length = 0;
        this.scenes.push(...((event.scenes ?? []) as CloudScene[]));
        this.localScenes.length = 0;
        this.localScenes.push(...((event.localScenes ?? []) as string[]));
        this.alive = true;
        this.paired = !!event.paired;
        this.sessionExpired = !!event.sessionExpired;
        this.note(`catalogue: ${this.loads.length} devices, ${this.scenes.length} scenes, ` +
                  `${this.localScenes.length} of my own`);
        for (const target of this.subscribed) this.send({ cmd: "subscribe", targets: [target] });
        break;
      case "state": {
        const before = this.states.get(event.target);
        const values = (event.values ?? {}) as Record<string, unknown>;
        const online = !!event.online;
        this.states.set(event.target, { values, online, via: event.via ?? "lan" });
        const who = event.name || this.nameOf(event.target);
        const worth = Object.keys(values).filter((code) => !NOT_NEWS.has(code));
        if (!before) {
          const first = worth.slice(0, 4)
            .map((code) => `${code}=${readable(values[code])}`).join(" ");
          this.note(`${who}: read ${first || "(nothing)"}`);
        } else {
          const moved = worth.filter((code) => before.values[code] !== values[code]);
          if (moved.length) {
            this.note(`${who}: ${moved.slice(0, 4)
              .map((code) => `${code}=${readable(values[code])}`).join(" ")}`);
          }
          if (before.online !== online) {
            this.note(`${who}: ${online ? "back" : "no answer"}`, !online);
          }
        }
        break;
      }
      case "error":
        streamDeck.logger.warn(`worker: ${event.message}`);
        this.note(event.message ?? "unknown error", true);
        for (const listener of this.failureListeners) listener(event);
        return;
      default:
        // qr, paired, progress: only the property inspector cares.
        void streamDeck.ui.sendToPropertyInspector(event as any);
        return;
    }
    this.notify();
  }

  send(request: Record<string, unknown>): void {
    const command = String(request.cmd ?? "?");
    const about = request.target ? ` ${this.nameOf(request.target)}` : "";
    const extra = request.code ? ` ${request.code}`
      : request.values ? ` ${Object.entries(request.values as Record<string, unknown>)
          .map(([code, value]) => `${code}=${readable(value)}`).join(" ")}`
      : request.name ? ` "${request.name}"`
      : request.targets ? ` ${this.nameOf((request.targets as string[])[0])}`
      : "";
    this.note(`→ ${command}${about}${extra}`);
    if (!this.child) return this.start();
    this.child.stdin.write(`${JSON.stringify(request)}\n`);
  }

  subscribe(target: string | undefined): void {
    if (!target || this.subscribed.has(target)) return;
    this.subscribed.add(target);
    this.send({ cmd: "subscribe", targets: [target] });
  }

  stateOf(target: string | undefined): DeviceState | undefined {
    return target ? this.states.get(target) : undefined;
  }

  loadOf(target: string | undefined, code: string | undefined): Load | undefined {
    if (!target || !code) return undefined;
    return this.loads.find((load) => load.id === target && load.code === code);
  }
}

function pythonRuntime(): [string, string[]] {
  // The `py` launcher is the reliable path on Windows; python3 covers the rest.
  return process.platform === "win32" ? ["py", ["-3"]] : ["python3", []];
}

const worker = new Worker();

// The panel lets the user pick the interface language; "auto" (or nothing
// saved) follows the Stream Deck app. Someone may well run the Deck in one
// language and want this plugin in another.
let chosenLocale: string = "auto";

function currentLocale(): Locale {
  return chosenLocale && chosenLocale !== "auto"
    ? asLocale(chosenLocale)
    : asLocale(streamDeck.info?.application?.language);
}

async function refreshLocale(): Promise<void> {
  try {
    const global = (await streamDeck.settings.getGlobalSettings()) as any;
    chosenLocale = global?.uiLang ?? "auto";
  } catch {
    chosenLocale = "auto";
  }
}

// ———————————————————————————— actions ————————————————————————————

type Labelled = {
  label?: string;
  /** "auto" (or nothing) lets the action pick the picture from what it is. */
  icon?: string;
  labelFont?: string;
  labelSize?: number;
  labelBold?: boolean;
  labelCase?: "as" | "upper" | "lower";
  /** A colour from the palette; empty or unknown means the action default. */
  tint?: string;
};
type LoadSettings = Labelled & { target?: string; code?: string; showPower?: boolean };
type BlindSettings = LoadSettings & {
  move?: "open" | "close" | "stop" | "up" | "down";
  step?: number;
  /** True when 0% means the window is clear. Varies per installation. */
  zeroIsOpen?: boolean;
  /** The number over the blind. Absent means shown — it is the useful default. */
  showLevel?: boolean;
};
type SceneSettings = Labelled & { scene?: string; home?: string; localName?: string };
type AllOffSettings = Labelled;

/** Nothing typed by hand reaches the SVG: the family, the colour and the size
 *  are all checked against what this plugin actually ships. */
function look(settings: Labelled, fallbackIcon: string): KeyLook {
  const size = Number(settings.labelSize);
  return {
    icon: settings.icon && settings.icon !== "auto" ? settings.icon : fallbackIcon,
    tint: isTint(settings.tint) ? settings.tint! : "",
    label: {
      font: FONTS.includes(settings.labelFont ?? "") ? settings.labelFont! : PLAIN_LABEL.font,
      size: Number.isFinite(size) ? Math.max(6, Math.min(20, size)) : PLAIN_LABEL.size,
      bold: settings.labelBold === true,
      letters: settings.labelCase === "upper" || settings.labelCase === "lower"
        ? settings.labelCase : "as",
    },
  };
}

/** What a device looks like when nobody said otherwise: the vendor's own
 *  category code, never a guess from the device's name. */
function defaultIconFor(category: string | undefined): string {
  return category === "cz" || category === "tdq" ? "socket"
    : category === "kg" ? "switch" : "bulb";
}

function catalogForInspector(): any {
  return {
    evt: "catalog",
    alive: worker.alive,
    paired: worker.paired,
    sessionExpired: worker.sessionExpired,
    loads: worker.loads,
    scenes: worker.scenes,
    localScenes: worker.localScenes,
    fonts: FONTS,
    icons: iconGallery(),
    tints: TINTS,
  };
}

abstract class TuaCasaKey<T extends Labelled> extends SingletonAction<T> {
  private release: (() => void) | null = null;
  /** The SDK hands settings over asynchronously and never exposes them on the
   *  action itself, so a repaint triggered by the worker has nothing to draw
   *  with. Remembering the last settings per key is what makes the key follow
   *  the device instead of freezing on the picture it had when it appeared. */
  private known = new Map<string, { action: any; settings: T }>();

  protected abstract paint(action: any, settings: T, text: KeyText): void;

  constructor() {
    super();
    worker.onFailure((failed) => this.alertFor(failed));
  }

  /** A press that failed shows the Deck's own warning on the key that sent it,
   *  instead of failing in silence. */
  private alertFor(failed: Failure): void {
    for (const { action, settings } of this.known.values()) {
      const mine = settings as Failure;
      if ((failed.target && mine.target === failed.target) ||
          (failed.scene && mine.scene === failed.scene)) void action.showAlert();
    }
  }

  private repaintAll(): void {
    const text = keyText(currentLocale());
    for (const entry of this.known.values()) this.paint(entry.action, entry.settings, text);
  }

  private remember(action: any, settings: T): void {
    this.known.set(action.id, { action, settings });
  }

  override async onWillAppear(event: WillAppearEvent<T>): Promise<void> {
    worker.start();
    const settings = event.payload.settings;
    this.remember(event.action, settings);
    const target = (settings as any).target;
    if (target) worker.subscribe(target);
    if (!this.release) this.release = worker.onChange(() => this.repaintAll());
    this.paint(event.action, settings, keyText(currentLocale()));
  }

  override onWillDisappear(event: WillDisappearEvent<T>): void {
    this.known.delete(event.action.id);
    if (!this.known.size && this.release) {
      this.release();
      this.release = null;
    }
  }

  override onDidReceiveSettings(event: DidReceiveSettingsEvent<T>): void {
    const settings = event.payload.settings;
    this.remember(event.action, settings);
    const target = (settings as any).target;
    if (target) worker.subscribe(target);
    this.paint(event.action, settings, keyText(currentLocale()));
  }

  /** The panel talks to the worker through here: pairing, rescan, catalog. */
  override onSendToPlugin(event: SendToPluginEvent<any, T>): void {
    const payload = (event.payload ?? {}) as any;
    if (payload.ask === "catalog") {
      void streamDeck.ui.sendToPropertyInspector(catalogForInspector());
      void streamDeck.ui.sendToPropertyInspector({ evt: "journal", lines: worker.journal });
      return;
    }
    if (payload.ask === "clearLog") return worker.clearJournal();
    if (payload.ask === "pair") worker.send({ cmd: "pair", userCode: payload.userCode });
    else if (payload.ask === "forget") worker.send({ cmd: "forget" });
    else if (payload.ask === "rediscover") worker.send({ cmd: "rediscover" });
    else if (payload.ask === "saveScene")
      worker.send({ cmd: "localScene", name: payload.name, action: "save" });
    else if (payload.ask === "deleteScene")
      worker.send({ cmd: "localScene", name: payload.name, action: "delete" });
  }
}

@action({ UUID: "com.felipedrummond.tuacasa.switch" })
class SwitchKey extends TuaCasaKey<LoadSettings> {
  protected paint(action: any, settings: LoadSettings, text: KeyText): void {
    if (!action.isKey?.()) return;
    const load = worker.loadOf(settings.target, settings.code);
    const dressed = look(settings, defaultIconFor(load?.category));
    if (!worker.alive) {
      return void action.setImage(wakingKey(settings.label || load?.name || "", dressed));
    }
    if (!worker.paired) return void action.setImage(noticeKey(text.notPaired));
    if (!settings.target || !settings.code) return void action.setImage(noticeKey(text.pickLoad));

    if (worker.sessionExpired && load?.via === "cloud") {
      return void action.setImage(alertKey(settings.label || load.name, text.reconnect, dressed));
    }

    const state = worker.stateOf(settings.target);
    const on = !!state?.values[settings.code];
    // No state yet means "not read yet", not "offline". Saying offline while the
    // first read is still in flight is a lie the user has no way to interpret.
    const known = state !== undefined;
    const online = known ? state.online : true;
    const title = settings.label || load?.name || "";
    const via = state?.via ?? load?.via ?? "lan";

    let detail = "";
    if (known && !online) detail = text.offline;
    else if (settings.showPower && typeof state?.values["cur_power"] === "number") {
      detail = `${((state.values["cur_power"] as number) / 10).toFixed(1)} W`;
    }

    action.setImage(deviceKey(on, online, title, detail, via, dressed));
  }

  override onKeyUp(event: KeyUpEvent<LoadSettings>): void {
    const { target, code } = event.payload.settings;
    if (!target || !code) return;
    worker.send({ cmd: "toggle", target, code });
  }
}

@action({ UUID: "com.felipedrummond.tuacasa.blind" })
class BlindKey extends TuaCasaKey<BlindSettings> {
  protected paint(action: any, settings: BlindSettings, text: KeyText): void {
    if (!action.isKey?.()) return;
    const load = worker.loadOf(settings.target, "percent_control");
    const dressed = look(settings, "blind");
    if (!worker.alive) {
      return void action.setImage(wakingKey(settings.label || load?.name || "", dressed));
    }
    if (!worker.paired) return void action.setImage(noticeKey(text.notPaired));
    if (!settings.target) return void action.setImage(noticeKey(text.pickBlind));
    if (worker.sessionExpired && load?.via === "cloud") {
      return void action.setImage(alertKey(settings.label || load.name, text.reconnect, dressed));
    }

    const state = worker.stateOf(settings.target);
    const raw = state?.values["percent_control"];
    const position = typeof raw === "number" ? raw : 0;
    const known = state !== undefined;
    const online = known ? state.online : true;
    const title = settings.label || load?.name || "";
    const step = settings.step ?? 10;
    const caption: Record<string, string> = {
      open: text.open,
      close: text.close,
      stop: text.stop,
      up: `${text.open} ${step}%`,
      down: `${text.close} ${step}%`,
    };
    // Which end of the scale covers the window depends on how the motor was
    // wired, and the API never says. `zeroIsOpen` is the user's answer to that.
    const covered = settings.zeroIsOpen ? position : 100 - position;
    const word = covered === 0 ? text.isOpen : covered === 100 ? text.isClosed : "";
    const detail = online ? caption[settings.move ?? "open"] : text.offline;
    action.setImage(blindKey(covered, online, title, detail, online ? word : "", dressed,
                             settings.showLevel !== false));
  }

  override onKeyUp(event: KeyUpEvent<BlindSettings>): void {
    const settings = event.payload.settings;
    if (!settings.target) return;
    const move = settings.move ?? "open";
    if (move === "open" || move === "close" || move === "stop") {
      worker.send({ cmd: "write", target: settings.target, values: { control: move } });
      return;
    }
    const raw = worker.stateOf(settings.target)?.values["percent_control"];
    const current = typeof raw === "number" ? raw : 0;
    const step = settings.step ?? 10;
    // Think in coverage, then translate back: "open a bit" must open the window
    // whichever way this particular motor counts.
    const covered = settings.zeroIsOpen ? current : 100 - current;
    const wanted = Math.max(0, Math.min(100, move === "up" ? covered - step : covered + step));
    const asPercent = settings.zeroIsOpen ? wanted : 100 - wanted;
    worker.send({ cmd: "write", target: settings.target,
                  values: { percent_control: asPercent } });
  }
}

@action({ UUID: "com.felipedrummond.tuacasa.scene" })
class SceneKey extends TuaCasaKey<SceneSettings> {
  private heldAt = new Map<string, number>();

  protected paint(action: any, settings: SceneSettings, text: KeyText): void {
    if (!action.isKey?.()) return;
    const dressed = look(settings, "star");
    if (!worker.alive) {
      return void action.setImage(
        wakingKey(settings.label || settings.localName || "", dressed));
    }
    if (!settings.scene && !settings.localName)
      return void action.setImage(noticeKey(text.pickScene));

    const isLocal = !!settings.localName;
    const found = worker.scenes.find((scene) => scene.id === settings.scene);
    const title = settings.label || settings.localName || found?.name || "";
    if (worker.sessionExpired && !isLocal) {
      return void action.setImage(alertKey(title, text.reconnect, dressed));
    }
    // Only a local scene can be re-recorded, so only it earns the hint.
    action.setImage(sceneKey(title, isLocal ? text.tapApplies : "", isLocal, dressed));
  }

  override onKeyDown(event: KeyDownEvent<SceneSettings>): void {
    this.heldAt.set(event.action.id, Date.now());
  }

  override async onKeyUp(event: KeyUpEvent<SceneSettings>): Promise<void> {
    const settings = event.payload.settings;
    const held = Date.now() - (this.heldAt.get(event.action.id) ?? Date.now());
    this.heldAt.delete(event.action.id);
    const text = keyText(currentLocale());
    const dressed = look(settings, "star");

    // Local scenes only: holding overwrites the scene with what is on right now.
    if (settings.localName && held >= HOLD_MS) {
      worker.send({ cmd: "localScene", name: settings.localName, action: "save" });
      await event.action.setImage(
        sceneKey(settings.label || settings.localName, text.sceneSaved, true, dressed));
      return;
    }
    if (settings.localName) {
      worker.send({ cmd: "localScene", name: settings.localName, action: "apply" });
    } else if (settings.scene && settings.home) {
      worker.send({ cmd: "cloudScene", scene: settings.scene, home: settings.home });
    }
  }
}

@action({ UUID: "com.felipedrummond.tuacasa.alloff" })
class AllOffKey extends TuaCasaKey<AllOffSettings> {
  private heldAt = new Map<string, number>();

  protected paint(action: any, settings: AllOffSettings, text: KeyText): void {
    if (!action.isKey?.()) return;
    const dressed = look(settings, "power");
    if (!worker.alive) {
      return void action.setImage(wakingKey(settings.label || "", dressed));
    }
    action.setImage(
      allOffKey(settings.label || text.allOff.join(" "), text.hold, false, dressed));
  }

  override onKeyDown(event: KeyDownEvent<AllOffSettings>): void {
    this.heldAt.set(event.action.id, Date.now());
  }

  override async onKeyUp(event: KeyUpEvent<AllOffSettings>): Promise<void> {
    const held = Date.now() - (this.heldAt.get(event.action.id) ?? Date.now());
    this.heldAt.delete(event.action.id);
    const text = keyText(currentLocale());
    const dressed = look(event.payload.settings, "power");
    // Guarded on purpose: a stray tap must not black out the whole house.
    if (held < HOLD_MS) {
      worker.note("all off: short tap ignored, hold it to fire");
      await event.action.setImage(
        allOffKey(text.holdToSave[0], text.holdToSave[1], true, dressed));
      // A short tap is deliberately inert: it only explains itself.
      setTimeout(() => this.paint(event.action, event.payload.settings, text), 900);
      return;
    }
    worker.send({ cmd: "allOff" });
    await event.action.setImage(
      allOffKey(text.allOff.join(" "), text.done, true, dressed));
    setTimeout(() => this.paint(event.action, event.payload.settings, text), 1200);
  }
}

streamDeck.settings.onDidReceiveGlobalSettings((event) => {
  chosenLocale = (event.settings as any)?.uiLang ?? "auto";
  worker.repaint();
});

streamDeck.actions.registerAction(new SwitchKey());
streamDeck.actions.registerAction(new BlindKey());
streamDeck.actions.registerAction(new SceneKey());
streamDeck.actions.registerAction(new AllOffKey());
streamDeck.connect();
void refreshLocale();
worker.start();
