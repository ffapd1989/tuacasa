*Language: **English** · [Português](PUBLISHING.pt-BR.md)*

# Publication readiness

What is settled, what is not, and what each remaining item actually blocks. Two
destinations are assessed separately, because they have different bars:

| Destination | Verdict |
|---|---|
| **Public GitHub repository** | ready — nothing found that must be removed first |
| **Elgato Marketplace** | blocked, on one item, and it is not the licence |

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

**Onboarding does not need a terminal.** Pairing happens inside the Stream Deck panel:
[docs/PAIRING.md](PAIRING.md). Installation still does — see the open item below.

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

Two caveats, stated as caveats because they were not verifiable from outside:

- **The Maker Agreement is the binding text, and it is private** — it lives inside Maker
  Console, under the organisation's Settings. Read it before submitting. That is where a
  clause incompatible with the GPL would be, if one exists.
- **DRM.** The Marketplace offers plugins file encryption and integrity checking. That is
  the classic point of friction between the GPL and an app store — GPLv3 §6 and its bar on
  imposing "further restrictions" conflict with shipping a GPL binary the recipient cannot
  modify and run. Public materials describe plugins as *eligible for* DRM, which reads as
  opt-in; **whether it can be declined was not confirmed.** If it can, decline it and the
  conflict never arises.

Neither of these is the thing blocking a submission today.

## Open items

### 1. Blocking for the store — the borrowed application identity

The QR pairing uses a `client_id` and `schema` registered by the **Home Assistant**
project, not by this one
([`worker/tuacasa.py:68`](../streamdeck-plugin/com.felipedrummond.tuacasa.sdPlugin/worker/tuacasa.py#L68)).
Users of this plugin authenticate as if they were Home Assistant, and the vendor can
revoke it at any moment, breaking every install at once.

For an **open-source repository** this is common practice among community tools, and it is
disclosed rather than hidden — see
[LIMITS.md](../LIMITS.md#blocking-issue-for-a-store-release). It does not block a GitHub
release.

For a **store submission** it must be replaced with a credential registered for this
plugin. Treat it as a feature with a cost, not a polish item.

### 2. Not blocking — settled

The table lamp, the one piece of artwork not drawn for this plugin, is the `lamp` glyph
from **Phosphor Icons**, MIT. Verified against Phosphor's own `LICENSE` and by comparing
the path: same 256-unit grid, same vertices. Its copyright notice is reproduced in
[THIRD-PARTY.md](../THIRD-PARTY.md#artwork), which is what MIT requires. Nothing else in
`imgs/` came from outside.

### 3. Not blocking — installation still needs a terminal

Pairing is in the panel, but getting the plugin onto the machine is still
`pip install`, `npm install`, `npm run build`, `streamdeck link`
([README](../README.md#install)). That is fine for a GitHub audience and wrong for a store
audience, who expect a `.streamDeckPlugin` file to double-click. Packaging one is the
natural next step, and it will surface the Python dependency as the real obstacle: the
plugin needs Python on the PATH, and a store user will not have it.

### 4. Not blocking — decisions worth a second look

- **`bin/plugin.js` is not versioned.** Many Stream Deck plugins commit the bundle so the
  repository is clone-and-link with no build step. This one does not, because a stale
  bundle in a diff is unreviewable noise. Reverting is one line of `.gitignore`.
- **Windows only.** Nothing in the design is Windows-specific beyond the Python launcher
  and the state directory, but nothing has been tested elsewhere, and the manifest
  declares Windows alone.
- **Colour and brightness are read but not exposed.** Listed in
  [LIMITS.md](../LIMITS.md) so nobody files it twice.

## Before the first push

- [ ] Read the Maker Agreement if the store is ever the destination (item 1 and the DRM
      caveat above)
- [ ] Decide public or private on GitHub — the repository is currently private
- [ ] Turn on **private vulnerability reporting** in the repository settings.
      [SECURITY.md](../SECURITY.md) sends people to that button, and without it enabled the
      button is not there, which leaves a public issue as the only route for a report that
      should never be public
- [ ] Install from scratch in a clean folder, following only the README, on a machine that
      is not the author's. This is the check that catches what every other check misses:
      a step that works only because the author's machine already had something installed.
