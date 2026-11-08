*Language: **English** · [Português](PUBLISHING.pt-BR.md)*

# Publishing

Where Tua Casa ships, and what each destination asks of it.

| Destination | State |
|---|---|
| **GitHub release** | live since v1.0.0 — the steps and texts are in [LAUNCH.md](LAUNCH.md) |
| **Elgato Marketplace** | being prepared — listing, art and the checklist before submitting are in [marketplace/LISTING.md](marketplace/LISTING.md) |

## Settled

**Nothing personal is versioned.** Every tracked file was swept for names, addresses,
network ranges, local paths, MAC addresses and long secrets. The only hits are the
product's own identity — `com.felipedrummond.tuacasa` as the plugin UUID and
`Felipe Drummond` as `Author` in the manifest — which is what a reverse-DNS UUID is for
and is permanent once published.

Keys, tokens and the device inventory never enter the repository at all: they live in
`%LOCALAPPDATA%\streamdeck-tuacasa\`, and `.gitignore` also blocks them by name in case a
future change ever writes one locally. The plugin's `logs/` folder — which does carry
device names and machine details — is ignored as a whole directory, and `git check-ignore`
confirms it.

**Licences are inventoried and credited.** Every runtime and build dependency, with
version, licence and author: [THIRD-PARTY.md](../THIRD-PARTY.md). Two ship under a choice
of licences, and this project's choice is stated rather than left to accident —
`paho-mqtt` under BSD-3-Clause rather than EPL-2.0, which is what keeps it compatible with
the GPL.

**One drawing came from outside.** The table lamp is the `lamp` glyph from **Phosphor
Icons**, MIT. Verified against Phosphor's own `LICENSE` and by comparing the path: same
256-unit grid, same vertices. Its copyright notice is reproduced in
[THIRD-PARTY.md](../THIRD-PARTY.md#artwork), which is what MIT requires. Nothing else in
`imgs/` came from outside.

**No proprietary code is linked in.** The Stream Deck SDK is MIT, and the plugin runs as a
separate process talking over a WebSocket.

**The name is not a trademark of somebody else's.** "Tua Casa" carries no vendor's mark.
Compatibility is *declared* — "works with Tuya-compatible devices" — and both READMEs and
[docs/TUYA.md](TUYA.md) carry an explicit non-affiliation notice.

**Nothing needs a terminal.** `npm run pack` builds one `.streamDeckPlugin` file with the
Windows embeddable Python inside it
([CONTRIBUTING.md](../CONTRIBUTING.md#building-the-release-package)), so the person
installing it needs nothing else. Checked on 2026-11-02: the worker started on the bundled
Python in an environment with no Python on the PATH, and on the author's Stream Deck it
brought up 45 loads and the cloud session (MQTT included) on the bundled runtime alone.
The price is size: about 19 MB, where the plugin itself is under 1 MB. Pairing happens
inside the Stream Deck panel: [docs/PAIRING.md](PAIRING.md).

## The licence: what GPL-3.0 does and does not do

The licence is **GPL-3.0-or-later** ([LICENSE](../LICENSE)).

What it guarantees:

- Anyone who receives the program, modified or not, must be able to get its **complete
  source** under the same licence.
- No one can take this code, close it, and ship a proprietary product from it.
- A fork stays free, and so does a fork of the fork.

What it does **not** guarantee, and this is worth being explicit about: **the GPL does not
require the software to be free of charge.** It requires freedom, not price. Someone may
legally sell copies — including on a store — provided they hand over the source under the
GPL. In practice the price collapses to zero, because anyone who buys a copy is entitled
to redistribute it for nothing, and nothing stops them.

If the goal is literally "always free of charge, even when modified", no open-source
licence delivers it; only a non-commercial clause does, and that would stop the project
being open source at all, would be flagged as proprietary by GitHub, and would close the
Marketplace door. This project chose the GPL over that trade.

## The GPL and the Elgato Marketplace

**Nothing in Elgato's public guidelines forbids a GPL plugin.** The
[Plugin Guidelines](https://docs.elgato.com/guidelines/stream-deck/plugins/) say nothing
about software licensing at all, and the
[Product Guidelines](https://docs.elgato.com/guidelines/products/) require only that you
*own the rights to what you post* — which licensing your own work under the GPL does not
affect, since you keep the copyright either way. Products may be listed free or paid.

Two caveats:

- **The Maker Agreement is the binding text, and it is private** — it lives inside Maker
  Console, under the organisation's Settings. Read it before submitting. That is where a
  clause incompatible with the GPL would be, if one exists.
- **Marketplace builds are protected.** The store encrypts and integrity-checks what it
  distributes. GPLv3 §6 bars a *licensee* from shipping a GPL binary the recipient cannot
  modify and run. It does not bind the *copyright holder*: as long as every line of GPL
  code in the plugin is the author's own — and today it is, since every dependency is
  permissive — the author can ship a protected store build of their own work while the
  source stays public here.

That second point is what an outside contribution would change. Once someone else's code is
merged under the GPL, the protected store build needs their permission too. Ask
contributors to agree to it **before** merging, not after.

## The Marketplace build

The same source builds both destinations. What the store asks for, and how this plugin
meets it:

- **SDK 3.** `@elgato/streamdeck` 3.x, `SDKVersion: 3`, Stream Deck 7.1 or later and
  Node 24. SDK 3 refuses to connect below 7.1.
- **Files are immutable once installed.** Elgato's
  [DRM rules](https://docs.elgato.com/streamdeck/sdk/introduction/distribution/) forbid
  changing the files a plugin ships and reading `manifest.json` at runtime. So the worker
  runs Python with `-B` and never writes bytecode next to the bundled packages, the pack
  ships no `__pycache__`, and nothing reads the manifest. State lives in
  `%LOCALAPPDATA%\streamdeck-tuacasa\`, outside the plugin.
- **Action-list icons are white on transparent.** `imgs/action/*` and
  `imgs/plugin/category.svg` are `#FFFFFF`, with no colour and no background.
- **A key is redrawn only when its picture changes.** The guidelines cap programmatic
  updates at 10 per second, and a worker that reports every device's state would otherwise
  repaint every key on each report.
- **A failed press calls `showAlert`** on the key that sent it.

The listing describes pairing the way [LIMITS.md](../LIMITS.md) does.

## Decisions worth a second look

- **`bin/plugin.js` is not versioned.** Many Stream Deck plugins commit the bundle so the
  repository is clone-and-link with no build step. This one does not, because a stale
  bundle in a diff is unreviewable noise. Reverting is one line of `.gitignore`.
- **Windows only.** Nothing in the design is Windows-specific beyond the Python runtime
  and the state directory, but nothing has been tested elsewhere, and the manifest
  declares Windows alone.
- **Colour and brightness are read but not exposed.** Listed in
  [LIMITS.md](../LIMITS.md) so nobody files it twice.
- **Naming the gangs of a multi-gang switch still means editing a JSON file.** The key's
  own label covers the everyday case, so this only affects the names in the device list.
