#!/usr/bin/env python3
"""Diagnostics for Tua Casa. Talks to devices directly, without the plugin.

Useful when a key does not respond and you need to know whether the problem is
the key, the worker, the network or the device itself.

    python tools/probe.py list
    python tools/probe.py read   "<device name>"
    python tools/probe.py on     "<device name>" [channel]
    python tools/probe.py off    "<device name>" [channel]
    python tools/probe.py scan

Device names are matched loosely: case and accents are ignored, and a fragment
is enough as long as it is unambiguous.
"""

import json
import logging
import os
import sys
import time
import unicodedata
from pathlib import Path

logging.disable(logging.CRITICAL)
import tinytuya

# tinytuya pulls in colorama, which wraps Windows stdout and raises on any
# accented character. Undo the wrap before printing device names.
try:
    import colorama
    colorama.deinit()
except ImportError:
    pass
sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def state_dir() -> Path:
    chosen = os.environ.get("TUACASA_STATE_DIR")
    if chosen:
        return Path(chosen)
    base = os.environ.get("LOCALAPPDATA") or os.environ.get("XDG_STATE_HOME")
    return Path(base) / "streamdeck-tuacasa" if base else Path.home() / ".streamdeck-tuacasa"


def load_inventory() -> list:
    path = state_dir() / "devices.json"
    if not path.exists():
        raise SystemExit(f"No inventory at {path}.\n"
                         "Pair the plugin from the Stream Deck panel first.")
    return json.loads(path.read_text(encoding="utf-8"))["devices"]


def plain(text: str) -> str:
    stripped = unicodedata.normalize("NFKD", text)
    return "".join(c for c in stripped if not unicodedata.combining(c)).lower()


def find(inventory: list, fragment: str) -> dict:
    wanted = plain(fragment)
    matches = [d for d in inventory if wanted in plain(d["name"])]
    if not matches:
        raise SystemExit(f'No device matches "{fragment}".')
    if len(matches) > 1:
        exact = [d for d in matches if plain(d["name"]) == wanted]
        if len(exact) != 1:
            names = ", ".join(f'"{d["name"]}"' for d in matches)
            raise SystemExit(f'"{fragment}" is ambiguous: {names}')
        matches = exact
    device = matches[0]
    if not device["onLan"]:
        raise SystemExit(f'"{device["name"]}" is not reachable on the LAN '
                         "(the plugin drives it through the cloud).")
    return device


def connect(device: dict) -> tinytuya.Device:
    link = tinytuya.Device(device["id"], device["ip"], device["localKey"],
                           version=float(device["version"]))
    link.set_socketTimeout(8)
    return link


def cmd_list(inventory: list) -> None:
    print(f"{'name':<32} {'cat':<12} {'ip':<15} {'ver':<4} {'via':<6} product (as the API returns)")
    print("-" * 108)
    for device in sorted(inventory, key=lambda d: (not d["onLan"], d["category"], d["name"].lower())):
        print(f"{device['name'][:31]:<32} {device['category']:<12} "
              f"{(device['ip'] or ''):<15} {(device['version'] or '-'):<4} "
              f"{device['via']:<6} {(device.get('product') or '')[:38]}")
    reachable = sum(1 for d in inventory if d["onLan"])
    print(f"\n{len(inventory)} devices, {reachable} reachable on the LAN.")


def cmd_read(device: dict) -> None:
    started = time.monotonic()
    answer = connect(device).status()
    elapsed = (time.monotonic() - started) * 1000
    if not isinstance(answer, dict) or "dps" not in answer:
        raise SystemExit(f"Read failed: {answer}\n"
                         "  914 = key or version rejected · 901/905 = network problem")
    codes = device.get("dpMap") or {}
    print(f"{device['name']}  [{device['category']}]  v{device['version']}  "
          f"{device['ip']}   {elapsed:.0f} ms")
    for dp, value in sorted(answer["dps"].items(), key=lambda kv: int(kv[0])):
        print(f"   dp {dp:>3}  {codes.get(str(dp), ''):<18} = {value!r}")


def cmd_switch(device: dict, channel: str, turn_on: bool) -> None:
    link = connect(device)
    dp = "20" if device["category"] in ("dd", "dj") else channel
    answer = link.set_value(dp, turn_on)
    print(f"{device['name']}  dp {dp} -> {'ON' if turn_on else 'OFF'}   ({answer})")


def cmd_scan() -> None:
    print("Listening for device broadcasts (~18s)...")
    found = tinytuya.deviceScan(False, 18, color=False, poll=False)
    rows = sorted(found.values(), key=lambda d: str(d.get("ip", "")))
    for data in rows:
        print(f"   {str(data.get('ip','')):<15} v{str(data.get('version','')):<4} "
              f"{data.get('gwId','')}")
    print(f"\n{len(rows)} devices announced themselves.")
    print("A device that answers here but not to `read` usually has a stale local key.")


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    command, args = sys.argv[1].lower(), sys.argv[2:]

    if command == "scan":
        return cmd_scan()

    inventory = load_inventory()
    if command == "list":
        return cmd_list(inventory)
    if not args:
        raise SystemExit(f'"{command}" needs a device name.')

    device = find(inventory, args[0])
    channel = args[1] if len(args) > 1 else "1"
    if command == "read":
        cmd_read(device)
    elif command in ("on", "off"):
        cmd_switch(device, channel, command == "on")
    else:
        raise SystemExit(f'Unknown command "{command}".\n{__doc__}')


if __name__ == "__main__":
    main()
