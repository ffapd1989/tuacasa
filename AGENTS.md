# Tua Casa — working notes for agents

Publishable project: code, commits and docs in English. Every user-facing document exists
twice, `X.md` (canonical) and `X.pt-BR.md`, and both change in the same commit. The panel
and the keys speak pt · en · es, from tables per language (`src/i18n.ts`, `I18N` in
`ui/inspector.html`).

How to run, build and package: [CONTRIBUTING.md](CONTRIBUTING.md). Where it ships (GitHub
and the Elgato Marketplace) and what each asks for: [docs/PUBLISHING.md](docs/PUBLISHING.md).
Platform traps: [LIMITS.md](LIMITS.md).

## Verify

There is no automated test suite. Before a commit, from `streamdeck-plugin/`:

| Change | Check |
|---|---|
| Plugin code (`streamdeck-plugin/src`) | `npm run build`, then `npx streamdeck restart com.felipedrummond.tuacasa` and read the newest file in `com.felipedrummond.tuacasa.sdPlugin/logs/` |
| Key drawing | `npm run keys`, open `docs/keys-<locale>.html` and look at it |
| Worker or `requirements.txt` | `npm run pack` (it imports every package on the bundled Python), then restart the plugin and wait for `cloud connected` in the log |
| Promo art, Marketplace art or plugin icon | `npm run promo`, look at the PNGs |
| `manifest.json` | `npx streamdeck validate com.felipedrummond.tuacasa.sdPlugin` |

## Rules

- Nothing about a real house in the repository: names, addresses, device ids, local keys.
  Invented names in every example and picture.
- Never run a second worker or `tools/probe.py` against `%LOCALAPPDATA%\streamdeck-tuacasa`
  while the plugin runs: two processes renewing the same session burn its one-use refresh
  token. Point `TUACASA_STATE_DIR` at an empty folder for experiments.
- `com.felipedrummond.tuacasa.sdPlugin/python/` wins over the system Python when present.
  Delete it to run the linked plugin on your own Python.
- Key SVGs use one `font-family`, unquoted: QtSvg ignores lists and quotes.
- The Marketplace build is DRM-protected, and its files must not change once installed:
  nothing writes inside the plugin folder (the worker runs Python with `-B`) and nothing
  reads `manifest.json` at runtime.
- Keys are drawn through `draw()` in `src/plugin.ts`, which skips an unchanged picture.
  Calling `setImage` directly bypasses it and can leave a key stuck on a temporary picture.
- Release steps and the texts to paste: [docs/LAUNCH.md](docs/LAUNCH.md). Marketplace
  listing, art and submission checklist: [docs/marketplace/LISTING.md](docs/marketplace/LISTING.md).
