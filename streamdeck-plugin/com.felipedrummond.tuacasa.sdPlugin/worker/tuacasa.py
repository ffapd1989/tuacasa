#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Felipe Drummond
# SPDX-License-Identifier: GPL-3.0-or-later
"""Tua Casa worker. Runs as a child process of the Stream Deck plugin.

Speaks JSONL over stdin/stdout and reaches devices through two paths:

  LAN   -- direct persistent TCP, ~100ms. The normal path.
  cloud -- via tuya-device-sharing-sdk (the same one Home Assistant uses),
           ~250ms, for devices that refuse local connections.

Both paths speak the same language outward: `code` (switch_1, switch_led,
percent_control). Only the LAN protocol uses numeric dps, and that conversion
comes from the `local_strategy` map the API itself provides -- never guessed.

It also owns onboarding, because pairing has to happen inside the Stream Deck
panel and not in a terminal. The panel sends the user code, this worker asks
for a QR token and ships the QR *matrix* back -- the panel draws it as plain
SVG, so there is no CDN and no image library involved.

stdin (one JSON object per line):
    {"cmd": "list"}
    {"cmd": "pair", "userCode": "<smart life user code>"}
    {"cmd": "forget"}
    {"cmd": "rediscover"}
    {"cmd": "subscribe", "targets": ["<id>", ...]}
    {"cmd": "set",    "target": "<id>", "code": "switch_1", "value": true}
    {"cmd": "toggle", "target": "<id>", "code": "switch_1"}
    {"cmd": "write",  "target": "<id>", "values": {"percent_control": 50}}
    {"cmd": "read",   "target": "<id>"}
    {"cmd": "cloudScene", "scene": "<scene_id>", "home": "<home_id>"}
    {"cmd": "localScene", "name": "<name>", "action": "apply|save|delete"}
    {"cmd": "allOff"}

stdout:
    {"evt": "ready",    "loads": [...], "scenes": [...], "paired": true}
    {"evt": "state",    "target": "<id>", "values": {...}, "online": true, "via": "lan"}
    {"evt": "qr",       "matrix": [[0,1,...], ...]}
    {"evt": "paired",   "ok": true, "user": "..."}
    {"evt": "progress", "step": "...", "detail": "..."}
    {"evt": "error",    "target": "<id>", "scene": "<scene_id>", "message": "..."}
"""

import json
import logging
import os
import queue
import re
import select
import socket
import sys
import threading
import time
from datetime import datetime
from pathlib import Path

logging.disable(logging.CRITICAL)
import tinytuya

# tinytuya pulls in colorama, which wraps Windows stdout and raises on any
# accented character. Without this, a device named "Café" kills the worker.
try:
    import colorama
    colorama.deinit()
except ImportError:
    pass
sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

CLIENT_ID = "HA_3y9q4ak7g4ephrvke"
SCHEMA = "haauthorize"

HEARTBEAT_SECONDS = 9
# Devices push their own changes, so this is only the safety net for a push
# that never arrives. Short enough that a key is never stale for long,
# long enough to stay invisible on the wire.
REREAD_SECONDS = 15
RECONNECT_SECONDS = 5
MAX_RECONNECT_SECONDS = 300
SOCKET_SECONDS = 8
LISTEN_SECONDS = 0.4
OUTAGE_AFTER_FAILURES = 2
DISCOVERY_RETRIES = 18
PAIRING_ATTEMPTS = 150
CHANNEL_RE = re.compile(r"switch_\d+")
POSITION_CODE = "percent_control"
CONTROL_CODE = "control"

output_lock = threading.Lock()


def emit(**fields) -> None:
    with output_lock:
        sys.stdout.write(json.dumps(fields, ensure_ascii=False) + "\n")
        sys.stdout.flush()


def log(message: str) -> None:
    sys.stderr.write(f"{message}\n")
    sys.stderr.flush()


def state_dir() -> Path:
    """Where keys and tokens live: never inside the repository."""
    chosen = os.environ.get("TUACASA_STATE_DIR")
    if chosen:
        folder = Path(chosen)
    else:
        base = os.environ.get("LOCALAPPDATA") or os.environ.get("XDG_STATE_HOME")
        folder = Path(base) / "streamdeck-tuacasa" if base else Path.home() / ".streamdeck-tuacasa"
    folder.mkdir(parents=True, exist_ok=True)
    return folder


def qr_matrix(payload: str) -> list:
    """QR as a 0/1 matrix, so the panel can draw it as plain SVG."""
    import qrcode

    code = qrcode.QRCode(border=2, error_correction=qrcode.constants.ERROR_CORRECT_M)
    code.add_data(payload)
    code.make(fit=True)
    return [[1 if cell else 0 for cell in row] for row in code.get_matrix()]


# Product names arrive as the manufacturer registered them, sometimes in
# Chinese. Only this commercial label is ever rewritten; the device NAME the
# owner chose in the app is never touched.
INDUSTRY_TERMS = {
    "公版": "generic",
    "插座": "socket",
    "灯带": "light strip",
    "窗帘": "curtain",
    "开关": "switch",
}


def readable_product(product) -> str:
    if not product:
        return ""
    text = str(product)
    for term, translation in INDUSTRY_TERMS.items():
        text = text.replace(term, translation)
    return text.strip(" -—·")


def dp_map(device) -> dict:
    """Numeric dp -> status_code, straight from the API's local_strategy."""
    mapping = {}
    for dp, rule in (getattr(device, "local_strategy", None) or {}).items():
        code = rule.get("status_code") if isinstance(rule, dict) else None
        if code:
            mapping[str(dp)] = code
    return mapping


def scan_lan(retries: int = DISCOVERY_RETRIES) -> dict:
    """Listen to Tuya UDP broadcasts: gives IP and protocol version per id."""
    found = tinytuya.deviceScan(False, retries, color=False, poll=False)
    by_id = {}
    for data in found.values():
        if data.get("gwId"):
            by_id[data["gwId"]] = {"ip": data.get("ip"), "version": str(data.get("version"))}
    return by_id


class LanDevice(threading.Thread):
    """Sole owner of one device's socket. Commands arrive through a queue."""

    def __init__(self, record: dict, publish) -> None:
        super().__init__(daemon=True, name=record["name"])
        self.record = record
        self.identifier = record["id"]
        self.publish = publish
        self.link = None
        self.state = {}
        self.online = False
        self.requests = queue.Queue()
        self.stopping = threading.Event()
        self.wake_reader, self.wake_writer = socket.socketpair()
        self.wake_reader.setblocking(False)
        # A single hiccup is not an outage. Devices drop a read now and then and
        # reconnect immediately; announcing "offline" for that made keys flicker
        # a warning the owner could do nothing about.
        self.failures = 0
        self.dp_by_code = {code: dp for dp, code in (record.get("dpMap") or {}).items()}
        self.code_by_dp = dict(record.get("dpMap") or {})

    def request(self, task: dict) -> None:
        self.requests.put(task)
        try:
            self.wake_writer.send(b"1")
        except OSError:
            pass

    def _dp_for(self, code: str) -> str:
        if code in self.dp_by_code:
            return self.dp_by_code[code]
        raise KeyError(f"'{code}' does not exist on {self.record['name']}")

    def _to_codes(self, points: dict) -> dict:
        return {self.code_by_dp.get(str(dp), str(dp)): value for dp, value in points.items()}

    def _absorb(self, points: dict, force: bool = False) -> None:
        previous = dict(self.state)
        self.state.update(self._to_codes(points))
        was_offline = not self.online
        self.online = True
        if force or was_offline or self.state != previous:
            self.publish(self.identifier, self.state, True, "lan")

    def _read(self, force: bool = False) -> None:
        answer = self.link.status()
        if isinstance(answer, dict) and "dps" in answer:
            self._absorb(answer["dps"], force=force)
        elif force:
            self.publish(self.identifier, self.state, True, "lan")

    def _apply(self, code: str, value) -> None:
        """Write, then publish the state the device itself returned.

        set_value answers with the new dps. Discarding that answer made the key
        only learn about the change when the push arrived, roughly a second later.
        """
        dp = self._dp_for(code)
        answer = self.link.set_value(dp, value)
        if isinstance(answer, dict) and isinstance(answer.get("dps"), dict):
            self._absorb(answer["dps"])
        else:
            self._absorb({dp: value})

    def _run_task(self, task: dict) -> None:
        command = task["cmd"]
        if command == "read":
            return self._read(force=True)
        if command == "set":
            return self._apply(task["code"], task["value"])
        if command == "toggle":
            code = task["code"]
            if code not in self.state:
                self._read()
            return self._apply(code, not bool(self.state.get(code)))
        if command == "write":
            for code, value in task["values"].items():
                self._apply(code, value)
            return
        raise ValueError(f"unknown command: {command}")

    def _drain(self) -> None:
        try:
            while self.wake_reader.recv(4096):
                pass
        except (BlockingIOError, OSError):
            pass
        while True:
            try:
                task = self.requests.get_nowait()
            except queue.Empty:
                return
            try:
                self._run_task(task)
            except Exception as error:
                emit(evt="error", target=self.identifier,
                     message=f"{type(error).__name__}: {error}")
                if not isinstance(error, KeyError):
                    raise

    def _open(self) -> None:
        link = tinytuya.Device(self.record["id"], self.record["ip"], self.record["localKey"],
                               version=float(self.record["version"]))
        link.set_socketTimeout(SOCKET_SECONDS)
        link.set_socketPersistent(True)
        self.link = link

    def _listen(self) -> None:
        """Read one spontaneous push without pinning the thread.

        receive() waits for a WHOLE packet until the socket timeout expires.
        At the 8s used for commands, a fragmented packet pinned this thread and
        user clicks sat in the queue until it gave up.
        """
        self.link.socket.settimeout(LISTEN_SECONDS)
        try:
            got = self.link.receive()
        except Exception:
            return
        finally:
            try:
                self.link.socket.settimeout(SOCKET_SECONDS)
            except Exception:
                pass
        if isinstance(got, dict) and "dps" in got:
            self._absorb(got["dps"])

    def run(self) -> None:
        while not self.stopping.is_set():
            try:
                self._open()
                self._read(force=True)
                self.failures = 0
                now = time.monotonic()
                next_beat, next_read = now + HEARTBEAT_SECONDS, now + REREAD_SECONDS
                while not self.stopping.is_set():
                    wait = max(0.05, min(next_beat, next_read) - time.monotonic())
                    # tinytuya only materialises .socket once a call succeeds, so
                    # an unreachable device leaves it None. Handing None to select
                    # raises, which used to kill this thread every few seconds.
                    watching = [self.wake_reader]
                    device_socket = getattr(self.link, "socket", None)
                    if device_socket is not None:
                        watching.append(device_socket)
                    ready, _, _ = select.select(watching, [], [], wait)
                    # Always, not only when the waker fires: a click arriving
                    # during receive() must not wait for the next lap.
                    self._drain()
                    if device_socket is not None and device_socket in ready:
                        self._listen()
                        self._drain()
                    now = time.monotonic()
                    if now >= next_read:
                        self._read()
                        next_read, next_beat = now + REREAD_SECONDS, now + HEARTBEAT_SECONDS
                    elif now >= next_beat:
                        self.link.heartbeat(nowait=True)
                        next_beat = now + HEARTBEAT_SECONDS
            except Exception as error:
                self.failures += 1
                if self.failures <= OUTAGE_AFTER_FAILURES + 1:
                    log(f"[{self.record['name']}] dropped ({self.failures}): "
                        f"{type(error).__name__}: {error}")
                if self.failures >= OUTAGE_AFTER_FAILURES:
                    self.online = False
                    self.publish(self.identifier, self.state, False, "lan")
                try:
                    if self.link:
                        self.link.close()
                except Exception:
                    pass
                self.link = None
                # Back off instead of hammering: a device that is simply not there
                # otherwise retries forever and buries the log in noise.
                delay = min(RECONNECT_SECONDS * (2 ** min(self.failures - 1, 5)),
                            MAX_RECONNECT_SECONDS)
                self.stopping.wait(delay)


class Cloud:
    """Fallback path, and owner of the account session.

    Uses tuya-device-sharing-sdk (the same one the official Home Assistant
    integration uses), which subscribes to Tuya's MQTT, so state for these
    devices also arrives pushed instead of polled.
    """

    def __init__(self, tokens_file: Path, publish) -> None:
        from tuya_sharing import Manager, SharingDeviceListener, SharingTokenListener

        saved = json.loads(tokens_file.read_text(encoding="utf-8"))
        self.publish = publish

        class TokenKeeper(SharingTokenListener):
            """Persist every refreshed token.

            The session token lives for two hours. The SDK renews it on its own
            and hands the new one to this listener -- but the refresh token is
            single use, so a renewal that is not written to disk breaks the whole
            chain: the next start replays a spent token and the API answers
            "sign invalid". Without this class the cloud path dies two hours
            after pairing, every time.
            """

            def update_token(self, token_info: dict) -> None:
                saved["token"] = token_info
                tokens_file.write_text(json.dumps(saved, indent=2), encoding="utf-8")
                log("session token renewed and saved")

        self.session = Manager(CLIENT_ID, saved["userCode"], saved["terminalId"],
                               saved["endpoint"], saved["token"], TokenKeeper())
        self.session.update_device_cache()

        bridge = self

        class Listener(SharingDeviceListener):
            def update_device(self, device, updated_status_properties=None, dp_timestamps=None):
                bridge.publish(device.id, dict(device.status), bool(device.online), "cloud")

            def add_device(self, device):
                pass

            def remove_device(self, device_id):
                pass

        self.session.add_device_listener(Listener())
        self.session.refresh_mq()

    def state_of(self, identifier: str) -> tuple:
        device = self.session.device_map.get(identifier)
        if not device:
            return {}, False
        return dict(device.status), bool(device.online)

    def announce(self, identifier: str) -> None:
        values, online = self.state_of(identifier)
        self.publish(identifier, values, online, "cloud")

    def scenes(self) -> list:
        found = []
        for home in self.session.home_repository.query_homes():
            try:
                for scene in self.session.scene_repository.query_scenes([str(home.id)]):
                    found.append({"id": getattr(scene, "scene_id", ""),
                                  "home": str(home.id),
                                  "name": getattr(scene, "name", "?"),
                                  "homeName": getattr(home, "name", "")})
            except Exception as error:
                log(f"scenes for home {home.id}: {type(error).__name__}: {error}")
        return found

    def trigger_scene(self, home_id: str, scene_id: str) -> None:
        self.session.scene_repository.trigger_scene(home_id, scene_id)

    def run_task(self, identifier: str, task: dict) -> None:
        command = task["cmd"]
        if command == "read":
            return self.announce(identifier)
        if command == "set":
            orders = [{"code": task["code"], "value": task["value"]}]
        elif command == "toggle":
            values, _ = self.state_of(identifier)
            orders = [{"code": task["code"], "value": not bool(values.get(task["code"]))}]
        elif command == "write":
            orders = [{"code": code, "value": value} for code, value in task["values"].items()]
        else:
            raise ValueError(f"unknown command: {command}")

        self.session.send_commands(identifier, orders)
        # Real confirmation arrives over MQTT; this echo lets the key react now.
        values, online = self.state_of(identifier)
        values.update({order["code"]: order["value"] for order in orders})
        self.publish(identifier, values, online, "cloud")


def pair(user_code: str, tokens_file: Path) -> dict:
    """Smart Life QR login: ship the QR matrix out and wait for approval."""
    from tuya_sharing import LoginControl

    control = LoginControl()
    answer = control.qr_code(CLIENT_ID, SCHEMA, user_code)
    if not answer.get("success"):
        raise RuntimeError(answer.get("msg") or answer.get("code") or "user code refused")

    token = answer["result"]["qrcode"]
    emit(evt="qr", matrix=qr_matrix(f"tuyaSmart--qrLogin?token={token}"))
    emit(evt="progress", step="waiting", detail="scan the code in the Smart Life app")

    for attempt in range(PAIRING_ATTEMPTS):
        approved, info = control.login_result(token, CLIENT_ID, user_code)
        if approved:
            tokens_file.write_text(json.dumps({
                "userCode": user_code,
                "terminalId": info["terminal_id"],
                "endpoint": info["endpoint"],
                "token": {key: info[key] for key in
                          ("t", "uid", "expire_time", "access_token", "refresh_token")},
            }, indent=2), encoding="utf-8")
            return info
        if attempt and attempt % 15 == 0:
            emit(evt="progress", step="waiting", detail=f"{attempt * 2}s")
        time.sleep(2)
    raise TimeoutError("the QR code expired without approval")


def build_inventory(cloud: Cloud) -> list:
    """Cross the cloud (names, keys, capabilities) with the LAN (IP, version)."""
    emit(evt="progress", step="scanning", detail="listening for devices on your network")
    on_lan = scan_lan()
    inventory = []
    for device in cloud.session.device_map.values():
        seen = on_lan.get(device.id, {})
        reachable = device.id in on_lan
        inventory.append({
            "id": device.id,
            "name": device.name,
            "ip": seen.get("ip") if reachable else None,
            "version": seen.get("version"),
            "localKey": device.local_key,
            "category": device.category,
            "product": readable_product(device.product_name),
            "productOriginal": device.product_name or "",
            "online": bool(device.online),
            "isSubDevice": bool(getattr(device, "sub", False)),
            "supportsLocal": bool(getattr(device, "support_local", False)),
            "onLan": reachable,
            "via": "lan" if reachable else "cloud",
            "functions": sorted(device.function.keys()),
            "dpMap": dp_map(device),
            "status": device.status,
        })
    inventory.sort(key=lambda item: (not item["onLan"], item["name"].lower()))
    return inventory


class Hub:
    def __init__(self, folder: Path) -> None:
        self.folder = folder
        self.devices_file = folder / "devices.json"
        self.tokens_file = folder / "tokens.json"
        self.scenes_file = folder / "scenes.json"
        self.names_file = folder / "channel-names.json"
        self.records = {}
        self.lan = {}
        self.cloud = None
        self.cloud_scenes = []
        self.names = {}
        self.pairing = None
        self.session_expired = False
        self._load()

    # ---------- loading ----------

    def _load(self) -> None:
        if self.devices_file.exists():
            data = json.loads(self.devices_file.read_text(encoding="utf-8"))
            self.records = {record["id"]: record for record in data["devices"]}
        self.names = self._read_names()
        # The cloud session takes 15-40s to come up (device cache + MQTT). The
        # inventory is already on disk, so waiting for it would leave every key
        # showing "starting" for the better part of a minute. Connect in the
        # background and re-announce when it lands.
        if self.tokens_file.exists():
            threading.Thread(target=self._connect_cloud, daemon=True).start()

    def _connect_cloud(self) -> None:
        try:
            cloud = Cloud(self.tokens_file, self.publish)
            scenes = cloud.scenes()
        except Exception as error:
            expired = "sign invalid" in str(error) or "token is expired" in str(error)
            log(f"cloud unavailable ({type(error).__name__}: {error}); LAN only"
                + (" -- session expired, pair again to restore it" if expired else ""))
            if expired:
                self.session_expired = True
                self.announce()
            return
        self.cloud, self.cloud_scenes = cloud, scenes
        log(f"cloud connected (MQTT live), {len(scenes)} scenes")
        self.announce()

    def _read_names(self) -> dict:
        # Tuya's API does NOT expose per-channel names (DeviceFunction arrives
        # without `name`), so they live in a file the owner edits. Keys starting
        # with '#' are reference comments, not data.
        if not self.names_file.exists():
            return {}
        try:
            raw = json.loads(self.names_file.read_text(encoding="utf-8"))
            return {key: value for key, value in raw.items()
                    if not key.startswith("#") and value}
        except Exception as error:
            log(f"channel-names.json unreadable ({error}); using defaults")
            return {}

    def _read_scenes(self) -> dict:
        if not self.scenes_file.exists():
            return {}
        try:
            return json.loads(self.scenes_file.read_text(encoding="utf-8"))
        except Exception:
            return {}

    def _save_json(self, path: Path, payload) -> None:
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    # ---------- publishing ----------

    def publish(self, identifier: str, values: dict, online: bool, via: str) -> None:
        record = self.records.get(identifier)
        emit(evt="state", target=identifier, name=record["name"] if record else "",
             values=values, online=online, via=via)

    def loads(self) -> list:
        """One entry per switchable output, not per device.

        A 4-gang switch is a single device but becomes 4 independent rows,
        because that is how it gets laid out: one Deck key per wall key.
        """
        result = []
        for record in sorted(self.records.values(), key=lambda r: r["name"].lower()):
            if not record["onLan"] and not record["online"]:
                continue
            shared = {
                "id": record["id"],
                "device": record["name"],
                "category": record["category"],
                "product": record.get("product") or "",
                "version": record.get("version") or "",
                "via": record["via"],
            }
            channels = sorted(c for c in record["functions"] if CHANNEL_RE.fullmatch(c))
            for code in channels:
                number = code.split("_")[1]
                fallback = f"{record['name']} — {number}" if len(channels) > 1 else record["name"]
                result.append({**shared, "code": code, "kind": "onoff",
                               "name": self.names.get(f"{record['id']}.{code}") or fallback})
            if "switch_led" in record["functions"]:
                result.append({**shared, "code": "switch_led", "kind": "onoff",
                               "name": record["name"]})
            if POSITION_CODE in record["functions"]:
                result.append({**shared, "code": POSITION_CODE, "kind": "position",
                               "name": record["name"]})
        return result

    def announce(self) -> None:
        emit(evt="ready", loads=self.loads(), scenes=self.cloud_scenes,
             localScenes=sorted(self._read_scenes().keys()),
             # Paired means "there is a session on disk", not "the cloud is up".
             # Otherwise a slow cloud would send the user back to the QR screen.
             paired=self.tokens_file.exists(), configured=bool(self.records),
             cloudReady=bool(self.cloud), sessionExpired=self.session_expired)

    # ---------- onboarding ----------

    def start_pairing(self, user_code: str) -> None:
        if self.pairing and self.pairing.is_alive():
            return emit(evt="error", message="pairing already in progress")

        def work():
            try:
                info = pair(user_code.strip(), self.tokens_file)
                emit(evt="progress", step="reading", detail="fetching your devices")
                self.cloud = Cloud(self.tokens_file, self.publish)
                self.session_expired = False
                self.cloud_scenes = self.cloud.scenes()
                inventory = build_inventory(self.cloud)
                self._save_json(self.devices_file,
                                {"generatedAt": datetime.now().isoformat(timespec="seconds"),
                                 "devices": inventory})
                self.records = {record["id"]: record for record in inventory}
                self._write_name_template()
                emit(evt="paired", ok=True, user=info.get("username", ""))
                self.announce()
            except Exception as error:
                emit(evt="paired", ok=False, message=f"{type(error).__name__}: {error}")

        self.pairing = threading.Thread(target=work, daemon=True)
        self.pairing.start()

    def _write_name_template(self) -> None:
        existing = self._read_names()
        template = {}
        for record in self.records.values():
            channels = sorted(c for c in record["functions"] if CHANNEL_RE.fullmatch(c))
            if len(channels) <= 1:
                continue
            for code in channels:
                key = f"{record['id']}.{code}"
                template[key] = existing.get(key, "")
                template[f"# {key}"] = f"{record['name']} — switch {code.split('_')[1]}"
        if template:
            ordered = {k: template[k] for k in sorted(template, key=lambda k: k.lstrip("# "))}
            self._save_json(self.names_file, ordered)
            self.names = self._read_names()

    def forget(self) -> None:
        for path in (self.tokens_file, self.devices_file):
            path.unlink(missing_ok=True)
        self.records, self.cloud, self.cloud_scenes = {}, None, []
        self.session_expired = False
        for device in self.lan.values():
            device.stopping.set()
        self.lan = {}
        self.announce()

    def rediscover(self) -> None:
        if not self.cloud:
            raise RuntimeError("not paired yet")
        emit(evt="progress", step="scanning", detail="rescanning your network")
        self.cloud.session.update_device_cache()
        inventory = build_inventory(self.cloud)
        self._save_json(self.devices_file,
                        {"generatedAt": datetime.now().isoformat(timespec="seconds"),
                         "devices": inventory})
        self.records = {record["id"]: record for record in inventory}
        self._write_name_template()
        self.announce()

    # ---------- scenes and panic ----------

    def _snapshot(self) -> dict:
        """Current on/off and position of everything reachable."""
        interesting = lambda code: (CHANNEL_RE.fullmatch(code)
                                    or code in ("switch_led", POSITION_CODE))
        picture = {}
        for identifier, device in self.lan.items():
            for code, value in device.state.items():
                if interesting(code):
                    picture.setdefault(identifier, {})[code] = value
        if self.cloud:
            for identifier, record in self.records.items():
                if record["onLan"]:
                    continue
                values, online = self.cloud.state_of(identifier)
                if not online:
                    continue
                for code, value in values.items():
                    if interesting(code):
                        picture.setdefault(identifier, {})[code] = value
        return picture

    def local_scene(self, name: str, action: str) -> None:
        scenes = self._read_scenes()
        if action == "save":
            scenes[name] = self._snapshot()
            self._save_json(self.scenes_file, scenes)
            log(f"local scene '{name}' saved with {len(scenes[name])} devices")
        elif action == "delete":
            scenes.pop(name, None)
            self._save_json(self.scenes_file, scenes)
        elif action == "apply":
            wanted = scenes.get(name)
            if not wanted:
                raise KeyError(f"local scene '{name}' does not exist")
            for identifier, values in wanted.items():
                try:
                    self.dispatch(identifier, {"cmd": "write", "values": values})
                except Exception as error:
                    log(f"scene '{name}' on {identifier}: {type(error).__name__}: {error}")
        else:
            raise ValueError(f"unknown scene action: {action}")
        self.announce()

    def all_off(self) -> None:
        for record in self.records.values():
            switches = [c for c in record["functions"] if CHANNEL_RE.fullmatch(c)]
            if "switch_led" in record["functions"]:
                switches.append("switch_led")
            if not switches:
                continue
            try:
                self.dispatch(record["id"],
                              {"cmd": "write", "values": {code: False for code in switches}})
            except Exception as error:
                log(f"[{record['name']}] allOff: {type(error).__name__}: {error}")

    # ---------- dispatch ----------

    def subscribe(self, targets=None) -> None:
        for identifier in (targets or list(self.records)):
            record = self.records.get(identifier)
            if not record:
                continue
            if record["onLan"]:
                if identifier not in self.lan:
                    device = LanDevice(record, self.publish)
                    self.lan[identifier] = device
                    device.start()
            elif self.cloud:
                self.cloud.announce(identifier)

    def dispatch(self, identifier: str, task: dict) -> None:
        record = self.records.get(identifier)
        if not record:
            raise KeyError(f"unknown device: {identifier}")
        if record["onLan"]:
            self.subscribe([identifier])
            return self.lan[identifier].request(task)
        if not self.cloud:
            raise RuntimeError(f"{record['name']} needs the cloud, which is unavailable")
        self.cloud.run_task(identifier, task)

    def handle(self, request: dict) -> None:
        command = request.get("cmd")
        if command == "list":
            return self.announce()
        if command == "pair":
            return self.start_pairing(request.get("userCode", ""))
        if command == "forget":
            return self.forget()
        if command == "rediscover":
            return self.rediscover()
        if command == "subscribe":
            return self.subscribe(request.get("targets"))
        if command == "allOff":
            return self.all_off()
        if command == "localScene":
            return self.local_scene(request["name"], request.get("action", "apply"))
        if command == "cloudScene":
            if not self.cloud:
                raise RuntimeError("scenes need the cloud session")
            return self.cloud.trigger_scene(request["home"], request["scene"])
        self.dispatch(request.get("target"), request)


def main() -> None:
    folder = state_dir()
    hub = Hub(folder)
    loads = hub.loads()
    by_lan = sum(1 for load in loads if load["via"] == "lan")
    log(f"worker up: {len(loads)} loads ({by_lan} LAN, {len(loads) - by_lan} cloud); "
        f"state in {folder}")
    hub.announce()

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            request = json.loads(line)
        except json.JSONDecodeError:
            emit(evt="error", message=f"invalid line: {line[:80]}")
            continue
        try:
            hub.handle(request)
        except Exception as error:
            emit(evt="error", target=request.get("target"), scene=request.get("scene"),
                 message=f"{type(error).__name__}: {error}")


if __name__ == "__main__":
    main()
