*Language: **English** · [Português](PRIVACY.pt-BR.md)*

# Privacy

Short version: this plugin has no server, collects nothing, and sends nothing anywhere except
to your own devices and to the account service you already use.

## What is stored, and where

Everything lives on your machine, in `%LOCALAPPDATA%\streamdeck-tuacasa\`:

| File | What it holds |
|---|---|
| `tokens.json` | The session created when you paired, plus your user code |
| `devices.json` | Your device list: names, addresses, local keys, capabilities |
| `channel-names.json` | Names you gave to each gang of a switch |
| `scenes.json` | Scenes you recorded with the plugin |

These files contain **credentials for your home**. They are deliberately kept outside the
project folder so they are never committed to a repository by accident. Treat them like a
password file: anyone who copies them can control your devices.

To erase everything, press **Disconnect account** in the panel, or delete that folder.

## What leaves your machine

**On the local path — nothing leaves your network.** The worker opens a direct connection to
each device over your LAN and speaks the device protocol. No internet involved.

**On the pairing and fallback paths**, the plugin talks to the same service your phone app
already talks to, to: exchange your user code for a session, list your devices and their keys,
run scenes, and command devices that refuse local connections. This traffic goes to the vendor
that already runs your devices — the plugin does not add a new party.

**There is no telemetry, no analytics, no crash reporting and no update check.** No author of
this plugin sees your device names, your usage, or anything else.

## Logs

The plugin writes to `com.felipedrummond.tuacasa.sdPlugin/logs/`. Those logs contain device
names and command names, useful for troubleshooting. **They do not contain keys or tokens.**
If you share a log to report a problem, you are sharing what your devices are called.

## Third-party services

Pairing relies on an application identity registered by another open-source project. This is
disclosed in [LIMITS.md](LIMITS.md) — it affects who the vendor thinks is asking, not what is
shared about you.
