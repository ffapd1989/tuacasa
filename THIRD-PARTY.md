*Language: **English** · [Português](THIRD-PARTY.pt-BR.md)*

# Third-party software

Everything Tua Casa is built on, who wrote it, and under what licence. Crediting these is
an obligation of their licences, not a courtesy.

Tua Casa itself is **GPL-3.0-or-later** ([LICENSE](LICENSE)). Every dependency below is
compatible with that, including the two that ship under a choice of licences — the choice
this project makes is stated in the table.

Versions are the ones inside the 1.0.0 release package. To re-check after an upgrade, see
[Re-checking](#re-checking) at the bottom.

## Runtime — Python and the worker's packages

The release package (`.streamDeckPlugin`) **redistributes** all of these: `npm run pack`
puts the Windows embeddable Python in the plugin's `python/` folder and installs
`requirements.txt` into it, so whoever installs the plugin needs no Python of their own. The
licence texts travel with them, inside the package: `python/LICENSE.txt` and every
`python/Lib/site-packages/*.dist-info/`.

| Component | Version | Licence | Author |
|---|---|---|---|
| [CPython](https://www.python.org/) (Windows embeddable package) | 3.14.6 | PSF-2.0 | Python Software Foundation |

CPython's `LICENSE.txt` also covers what it ships inside itself — OpenSSL (Apache-2.0),
libffi, bzip2, zlib, SQLite and the rest — each with its own notice in that file.

| Package | Version | Licence | Author |
|---|---|---|---|
| [tinytuya](https://github.com/jasonacox/tinytuya) | 1.20.0 | MIT | Jason A. Cox |
| [tuya-device-sharing-sdk](https://github.com/tuya/tuya-device-sharing-sdk) | 0.2.15 | MIT | Tuya Inc. |
| [qrcode](https://github.com/lincolnloop/python-qrcode) | 8.2 | BSD-3-Clause | Lincoln Loop |

Pulled in transitively by those three:

| Package | Version | Licence | Note |
|---|---|---|---|
| certifi | 2026.10.23 | MPL-2.0 | weak copyleft, per file; GPL-compatible via its secondary-licence clause. Shipped as unmodified source, which is what MPL asks |
| cffi | 2.1.1 | MIT | |
| charset-normalizer | 3.5.2 | MIT | |
| colorama | 0.4.6 | BSD-3-Clause | |
| cryptography | 50.0.2 | Apache-2.0 **OR** BSD-3-Clause | **this project takes Apache-2.0**; the wheel carries its own OpenSSL |
| idna | 3.20 | BSD-3-Clause | |
| paho-mqtt | 2.1.0 | EPL-2.0 **OR** BSD-3-Clause | **this project takes BSD-3-Clause** — see below |
| pycparser | 3.12 | BSD-3-Clause | |
| requests | 2.34.2 | Apache-2.0 | |
| urllib3 | 2.8.0 | MIT | |

> **Why the choice on `paho-mqtt` matters.** EPL-2.0 and the GPL are not compatible. The
> package is offered under either licence, so this project takes the BSD-3-Clause arm and
> the conflict never arises. Anyone forking under a different licence should make their
> own choice deliberately rather than inherit this one by accident.

## Runtime — Stream Deck plugin

Installed by `npm install`, and bundled into `bin/plugin.js` by `npm run build`. The build
also writes their licence texts to `THIRD-PARTY-NOTICES.txt`, next to `manifest.json`, from
what esbuild actually bundled — so a new dependency cannot be left out of it.

| Package | Version | Licence | Author |
|---|---|---|---|
| [@elgato/streamdeck](https://github.com/elgatosf/streamdeck) | 2.1.2 | MIT | Elgato |
| @elgato/schemas | 0.4.16 | MIT | Elgato |
| @elgato/utils | 0.6.0 | MIT | Elgato |
| [ws](https://github.com/websockets/ws) | 8.21.3 | MIT | Einar Otto Stangvik |
| [zod](https://github.com/colinhacks/zod) | 3.25.76 | MIT | Colin McDonnell |

**No proprietary code is linked in.** The Stream Deck SDK is MIT, and the plugin talks to
the Stream Deck software over a WebSocket as a separate process — it does not link against
anything of Elgato's beyond that MIT library.

## Build only — not distributed

Present in `node_modules` and used to produce the bundle; none of it ends up in the
shipped file.

| Package | Version | Licence |
|---|---|---|
| @elgato/cli | 1.10.4 | MIT |
| esbuild + @esbuild/win32-x64 | 0.24.2 | MIT |
| typescript + @typescript/typescript-win32-x64 | 7.0.2 | Apache-2.0 |
| @types/node | 26.4.0 | MIT |
| undici-types | 8.3.0 | MIT |

## Prior art, not code

The QR pairing flow — user code, login token, QR, poll for approval — is the one the
**Home Assistant** Tuya integration established. No Home Assistant code is used here; the
flow is reimplemented on top of Tuya's own SDK.

Their project registered the application identity that flow needs, and this plugin
currently borrows it. **That is a credential, not a licence**, and it is the one thing
standing between this project and a store release. It is disclosed in full in
[LIMITS.md](LIMITS.md#blocking-issue-for-a-store-release).

## Artwork

Every icon in `imgs/` and every key picture was drawn for this plugin in its own 72×72
space, **except one**.

| Icon | Source | Licence |
|---|---|---|
| Table lamp | [Phosphor Icons](https://github.com/phosphor-icons/core) — the `lamp` glyph | MIT |

```
Copyright (c) 2023 Phosphor Icons

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

That notice is reproduced because MIT requires it — this is the obligation, not the
courtesy. The path is kept on Phosphor's 256-unit grid and scaled into the key, which is
why it is the only artwork in
[`src/icons.ts`](streamdeck-plugin/src/icons.ts) with three-digit coordinates. The shade is
filled with the key's state colour instead of the source's flat grey, so the lamp goes
amber with everything else.

## Licence compatibility, in one table

Why each of these can sit inside a GPL-3.0-or-later project:

| Licence | Compatible with GPL-3.0 | Why |
|---|---|---|
| MIT, BSD-3-Clause, ISC | yes | permissive; the GPL's terms may be layered on top |
| Apache-2.0 | yes, with GPLv3+ | its patent clause is compatible with v3, **not** with v2 |
| PSF-2.0 | yes | permissive; the FSF lists it as GPL-compatible |
| MPL-2.0 | yes | §3.3 explicitly allows combination with GPL |
| EPL-2.0 | **no** | avoided by taking the BSD arm of `paho-mqtt` |

Nothing here obliges Tua Casa to be permissive, and nothing here forbids the GPL. The
direction of contamination runs the other way: permissive code may enter a GPL project,
not the reverse.

## Re-checking

After changing a dependency, regenerate these tables rather than editing them by hand:

```powershell
python -c "import importlib.metadata as m; d=m.metadata('tinytuya'); print(d.get('License-Expression') or d.get('License'))"
node -e "console.log(require('./streamdeck-plugin/node_modules/ws/package.json').license)"
```

A package whose `License` field is empty usually carries the answer in
`License-Expression` (PEP 639) or in its bundled `LICENSE` file. Do not take the trove
classifier alone as the answer — `qrcode` declares both a BSD classifier and an
`Other/Proprietary License` one, and its actual `LICENSE` file is plain BSD-3-Clause.
