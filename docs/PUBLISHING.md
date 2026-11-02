*Language: **English** · [Português](PUBLISHING.pt-BR.md)*

# Publication readiness

What is settled, what is not, and what each remaining item actually blocks. Two
destinations are assessed separately, because they have different bars:

| Destination | Verdict |
|---|---|
| **Public GitHub repository, with a release to download** | ready — the steps left are in [LAUNCH.md](LAUNCH.md) |
| **Elgato Marketplace** | **not pursued**, by decision on 2026-11-02 — one blocker, and it is not the licence |

The store was set aside because of [the borrowed application identity](#1-blocks-the-store--the-borrowed-application-identity):
there is no public way for an independent developer to register one of their own, and the
only known pair belongs to Home Assistant. Everything else a store release would need is
listed under [If the store comes back](#if-the-store-comes-back), so the work is not lost.

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

**No proprietary code is linked in.** The Stream Deck SDK is MIT, and the plugin runs as a
separate process talking over a WebSocket.

**The name is not a trademark of somebody else's.** "Tua Casa" carries no vendor's mark.
Compatibility is *declared* — "works with Tuya-compatible devices" — and both READMEs and
[docs/TUYA.md](TUYA.md) carry an explicit non-affiliation notice.

**Nothing needs a terminal.** The release is one `.streamDeckPlugin` file to double-click,
and it carries its own Python, so the person installing it needs nothing else. Pairing
happens inside the Stream Deck panel: [docs/PAIRING.md](PAIRING.md).

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
- **DRM is not optional.** TranscriTranslator, by the same author, went through the store in
  October 2026: Marketplace builds are encrypted, and the store demands SDK 3, Stream Deck
  7.1+ and Node 24 for it. GPLv3 §6 bars a *licensee* from shipping a GPL binary the
  recipient cannot modify and run. It does not bind the *copyright holder*: as long as every
  line of GPL code in the plugin is the author's own — and today it is, since every
  dependency is permissive — the author can ship an encrypted store build of their own work
  while the source stays public here.

That second point is what an outside contribution would change. Once someone else's code is
merged under the GPL, an encrypted store build needs their permission too. If the store is
ever back on the table, ask contributors to agree to it **before** merging, not after.

## Open items

### 1. Blocks the store — the borrowed application identity

The QR pairing uses a `client_id` and `schema` registered by the **Home Assistant**
project, not by this one
([`worker/tuacasa.py:68`](../streamdeck-plugin/com.felipedrummond.tuacasa.sdPlugin/worker/tuacasa.py#L68)).
Users of this plugin authenticate as if they were Home Assistant, and the vendor can
revoke it at any moment, breaking every install at once.

For an **open-source repository** this is common practice among community tools, and it is
disclosed rather than hidden — see
[LIMITS.md](../LIMITS.md#blocking-issue-for-a-store-release). It does not block a GitHub
release.

For a **store submission** it must be replaced. Researched on 2026-11-02:

- Tuya publishes no self-service way to obtain a `client_id` for this QR flow. The one Home
  Assistant uses came out of Tuya's own work on that integration.
- The other open libraries that do this flow use the same pair. open-tuya's README says
  plainly that it is "the only pair known to work".
- The legitimate alternatives are to **ask Tuya** for an identity of this plugin's own, or
  to have each user create a free cloud project on Tuya's developer site and paste its
  Access ID and Secret into the panel — about ten steps on Tuya's site, a free trial to
  renew every few months, and a weaker cloud fallback.

### 2. Settled — the one borrowed drawing

The table lamp, the one piece of artwork not drawn for this plugin, is the `lamp` glyph
from **Phosphor Icons**, MIT. Verified against Phosphor's own `LICENSE` and by comparing
the path: same 256-unit grid, same vertices. Its copyright notice is reproduced in
[THIRD-PARTY.md](../THIRD-PARTY.md#artwork), which is what MIT requires. Nothing else in
`imgs/` came from outside.

### 3. Settled — installation without a terminal

`npm run pack` builds `dist/com.felipedrummond.tuacasa.streamDeckPlugin` with the Windows
embeddable Python inside it ([CONTRIBUTING.md](../CONTRIBUTING.md#building-the-release-package)).
Checked on 2026-11-02: the worker started on the bundled Python in an environment with no
Python on the PATH, and on the author's Stream Deck it brought up 45 loads and the cloud
session (MQTT included) on the bundled runtime alone. The price is size: about 19 MB, where
the plugin itself is under 1 MB.

### 4. Not blocking — decisions worth a second look

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

## If the store comes back

Everything below was learned getting TranscriTranslator onto the Marketplace, and applies
here unchanged. None of it is done, on purpose: it is work only the store asks for.

- [ ] Item 1 above, replaced — without it, nothing else on this list matters
- [ ] SDK 3: `@elgato/streamdeck` 3.x, `SDKVersion: 3`, `Software.MinimumVersion: "7.1"`,
      `Nodejs.Version: "24"`. SDK 3 refuses to connect below 7.1, and it stops firing
      `onDidReceiveSettings` for changes the plugin makes itself
- [ ] Action-list icons (`imgs/action/*`, `imgs/plugin/category.svg`) white `#FFFFFF` on
      transparent, no colour and no background — today they are amber and blue
- [ ] Listing art at the store's sizes: app icon 288×288, thumbnail and 3 to 10 gallery
      images at 1920×960, all PNG. `npm run promo` already draws from the real keys; it
      needs those sizes added
- [ ] Description of 250 to 1,500 characters in English, the first 250 as running text
- [ ] A demonstration video: the reviewer has no Tuya devices, so a video of real keys
      driving real devices is the only proof they will have. MP4, 1920×1080, under 50 MB
- [ ] First submission with *Publish after review* unticked; download the protected build
      from the Versions tab and install that before publishing
