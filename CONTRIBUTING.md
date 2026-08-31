*Language: **English** · [Português](CONTRIBUTING.pt-BR.md)*

# Contributing

Bug reports and patches are welcome. Read [LIMITS.md](LIMITS.md) first — a good half of
what looks like a bug is a documented platform limit, and the file exists so the same
issue is not filed twice.

## Getting it running

```powershell
pip install -r requirements.txt
cd streamdeck-plugin
npm install
npm run build
streamdeck link "com.felipedrummond.tuacasa.sdPlugin"
streamdeck restart com.felipedrummond.tuacasa
```

Two things that help before you touch the plugin:

```powershell
python tools/probe.py list          # inventory and reachability, without the plugin
npm run keys                        # renders every key state to docs/keys-<locale>.html
```

`probe.py` deliberately never touches the cloud session — two processes holding the same
session race to renew it and burn each other's refresh token. `npm run keys` draws the
contact sheets with the **same functions the physical key uses**, so if a key looks wrong
in the browser it looks wrong on the Deck.

## House rules

**Code, comments, commit messages and file names in English.** The interface is a
different matter — see below.

**The interface is pt · en · es**, and the strings live in a table per language, never
loose in the logic. Three tables, because there are three readers with three amounts of
room: [`src/i18n.ts`](streamdeck-plugin/src/i18n.ts) is what fits on a 72-px key, the
`I18N` object in
[`ui/inspector.html`](streamdeck-plugin/com.felipedrummond.tuacasa.sdPlugin/ui/inspector.html)
is the settings panel, and neither borrows from the other. A new string means three
entries, not one. English is the fallback, never Portuguese.

**Nothing about a real house goes in.** No device names from your own home, no addresses,
no MAC addresses, no local keys — not in code, not in a docstring, not in an example, not
in a screenshot. Invented names only. `.gitignore` blocks the state files by name, but it
cannot catch an example you typed.

**Minimal, surgical changes.** Touch what the fix needs and nothing else. No refactoring
of working code on the way past, no speculative abstraction, no configurability nobody
asked for.

**No comments explaining what the code does.** The exception is a comment that governs
invisible behaviour, where whoever edits that line would otherwise never learn it — the
`colorama` trap at
[`worker/tuacasa.py:58`](streamdeck-plugin/com.felipedrummond.tuacasa.sdPlugin/worker/tuacasa.py#L58)
is the model.

## Two traps worth knowing before you spend an evening on them

**SVG on a key is rasterised by QtSvg**, which follows the SVG Tiny profile and silently
ignores font lists and quotes in `font-family`. `'Segoe UI',Arial,sans-serif` falls back to
the default font without a word. Use **one family, unquoted**. Chrome hides this, so
testing the contact sheet in a browser will not catch it.

**A Stream Deck action never exposes its settings synchronously.** There is no `.settings`
property, whatever an `any` cast lets you write — only `getSettings()`, a promise. Anything
that repaints outside an event must keep its own copy, or the key silently freezes on the
picture it had. More of these in [LIMITS.md](LIMITS.md).

## Before opening a pull request

- [ ] `npx tsc --noEmit` from `streamdeck-plugin/` is clean
- [ ] `npm run build` succeeds
- [ ] `npm run keys` still renders, and you **looked at** the sheet — a typecheck is not
      visual proof
- [ ] If you touched the panel or a key, you saw it on a real Stream Deck
- [ ] No personal data in the diff, including in screenshots

## Licence of your contribution

This project is **GPL-3.0-or-later** ([LICENSE](LICENSE)). Opening a pull request means
your contribution goes in under the same terms. Keep the SPDX header at the top of any new
source file:

```
// SPDX-FileCopyrightText: <year> <your name>
// SPDX-License-Identifier: GPL-3.0-or-later
```

If a patch brings a new dependency, add it to [THIRD-PARTY.md](THIRD-PARTY.md) with its
version, licence and author — and check the licence is GPL-compatible before writing the
code, not after. The compatibility table at the bottom of that file is the short answer.

## Reporting a bug

Say what you did, what the key showed, and what the **Activity** panel said. If a device
is involved, `python tools/probe.py read "<name>"` gives the raw state with timings — paste
that, with the device name changed if you like. The plugin log is at
`com.felipedrummond.tuacasa.sdPlugin/logs/`; it carries no keys or tokens, but it does
carry your device names.

Security issues do not go in the issue tracker — see [SECURITY.md](SECURITY.md).

Conduct in this project is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).
