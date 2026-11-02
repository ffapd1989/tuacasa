# Tua Casa — working notes for agents

Publishable project: code, commits and docs in English. Every user-facing document exists
twice, `X.md` (canonical) and `X.pt-BR.md`, and both change in the same commit. The panel
and the keys speak pt · en · es, from tables per language (`src/i18n.ts`, `I18N` in
`ui/inspector.html`).

How to run, build and package: [CONTRIBUTING.md](CONTRIBUTING.md). Why it ships on GitHub
and not the Marketplace: [docs/PUBLISHING.md](docs/PUBLISHING.md). Platform traps:
[LIMITS.md](LIMITS.md).

## Verify

There is no automated test suite. Before a commit, from `streamdeck-plugin/`:

| Change | Check |
|---|---|
| Plugin code (`streamdeck-plugin/src`) | `npm run build`, then `npx streamdeck restart com.felipedrummond.tuacasa` and read the newest file in `com.felipedrummond.tuacasa.sdPlugin/logs/` |
| Key drawing | `npm run keys`, open `docs/keys-<locale>.html` and look at it |
| Worker or `requirements.txt` | `npm run pack` (it imports every package on the bundled Python), then restart the plugin and wait for `cloud connected` in the log |
| Promo art or plugin icon | `npm run promo`, look at the PNGs |

## Rules

- Nothing about a real house in the repository: names, addresses, device ids, local keys.
  Invented names in every example and picture.
- Never run a second worker or `tools/probe.py` against `%LOCALAPPDATA%\streamdeck-tuacasa`
  while the plugin runs: two processes renewing the same session burn its one-use refresh
  token. Point `TUACASA_STATE_DIR` at an empty folder for experiments.
- `com.felipedrummond.tuacasa.sdPlugin/python/` wins over the system Python when present.
  Delete it to run the linked plugin on your own Python.
- Key SVGs use one `font-family`, unquoted: QtSvg ignores lists and quotes.
- Store-only work (SDK 3, white list icons, listing art) waits for the credential blocker in
  [docs/PUBLISHING.md](docs/PUBLISHING.md#if-the-store-comes-back).
- Release steps and the texts to paste: [docs/LAUNCH.md](docs/LAUNCH.md).
