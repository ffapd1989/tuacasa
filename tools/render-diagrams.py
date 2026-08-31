#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Felipe Drummond
# SPDX-License-Identifier: GPL-3.0-or-later
"""Draws the documentation diagrams, one drawing per language.

    python tools/render-diagrams.py

Writes docs/img/<name>-<locale>.svg. The drawing lives here once and the words
live in a table per language, so a fix to the picture cannot reach one README
and miss the other. Only the two README languages: the panel speaks three, the
documentation two.
"""

from pathlib import Path

PAPER = "#16181d"
LANE = "#1c1f26"
EDGE = "#2a2e37"
INK = "#e8eaed"
DIM = "#9aa0aa"
AMBER = "#ffb02e"
BLUE = "#5aa9e6"
GREEN = "#7fd1a6"
FONT = "Segoe UI, Ubuntu, system-ui, sans-serif"
MONO = "Consolas, DejaVu Sans Mono, monospace"

PAIRING = {
    "en": {
        "title": "Pairing: where each step happens",
        "lanes": ["Your phone", "The Stream Deck panel", "Worker + account service"],
        "sub": ["Smart Life or Tuya Smart", "runs inside the Stream Deck", "on your PC, and the vendor"],
        "steps": [
            ("Me → ⚙ → Account and\nSecurity → User Code", "a", None),
            ("Type the code, press\nConnect", "b", "a→b"),
            ("Asks the service for a\nlogin token", "c", "b→c"),
            ("Draws the token as a QR\ncode on screen", "b", "c→b"),
            ("Scan the panel with the\nsame app, approve", "a", "b→a"),
            ("Session written to disk,\nnetwork scanned", "c", "a→c"),
        ],
        "note": "Nothing here asks for your password, and no developer account is involved. The "
                "user code identifies your account; the QR proves you approved this PC.",
        "out": "Result: the device list appears in the panel. Keys and tokens stay in "
               "%LOCALAPPDATA%\\streamdeck-tuacasa\\.",
    },
    "pt": {
        "title": "Pareamento: onde cada passo acontece",
        "lanes": ["No seu celular", "No painel do Stream Deck", "Worker + serviço da conta"],
        "sub": ["Smart Life ou Tuya Smart", "dentro do próprio Stream Deck", "no seu PC, e o fabricante"],
        "steps": [
            ("Eu → ⚙ → Conta e segurança\n→ Código de usuário", "a", None),
            ("Digite o código e clique\nem Conectar", "b", "a→b"),
            ("Pede ao serviço um token\nde login", "c", "b→c"),
            ("Desenha o token como QR\nna tela", "b", "c→b"),
            ("Aponte o mesmo app para\no painel e aprove", "a", "b→a"),
            ("Sessão gravada em disco,\nrede varrida", "c", "a→c"),
        ],
        "note": "Nada aqui pede sua senha, e não existe conta de desenvolvedor no caminho. O "
                "código de usuário identifica a conta; o QR prova que você autorizou este PC.",
        "out": "Resultado: a lista de aparelhos aparece no painel. Chaves e tokens ficam em "
               "%LOCALAPPDATA%\\streamdeck-tuacasa\\.",
    },
}

ROUTES = {
    "en": {
        "title": "Two routes out, one language inward",
        "deck": "Stream Deck",
        "plugin": "Plugin (TypeScript)",
        "plugin_sub": "resident process · draws the keys",
        "worker": "Worker (Python)",
        "worker_sub": "child process · owns the connections",
        "lan": "Your network",
        "lan_sub": "TCP 6668 + AES, one connection held open per device",
        "cloud": "Account service",
        "cloud_sub": "session + MQTT, only for devices that refuse local",
        "lan_ms": "101 ms median",
        "cloud_ms": "~250 ms median",
        "bus": "SDK v2 (WebSocket)",
        "pipe": "spawn + stdin/stdout, JSONL",
        "note": "Both routes report the device's own status codes. Only the LAN protocol uses "
                "numeric data points, and that map comes from the API, never guessed.",
    },
    "pt": {
        "title": "Duas rotas para fora, uma língua para dentro",
        "deck": "Stream Deck",
        "plugin": "Plugin (TypeScript)",
        "plugin_sub": "processo residente · desenha as teclas",
        "worker": "Worker (Python)",
        "worker_sub": "processo filho · dono das conexões",
        "lan": "Sua rede",
        "lan_sub": "TCP 6668 + AES, uma conexão aberta por aparelho",
        "cloud": "Serviço da conta",
        "cloud_sub": "sessão + MQTT, só para quem recusa conexão local",
        "lan_ms": "101 ms de mediana",
        "cloud_ms": "~250 ms de mediana",
        "bus": "SDK v2 (WebSocket)",
        "pipe": "spawn + stdin/stdout, JSONL",
        "note": "As duas rotas devolvem os status codes do próprio aparelho. Só o protocolo "
                "local usa data points numéricos, e esse mapa vem da API — nunca é adivinhado.",
    },
}


def escape(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def lines(text, x, y, size, colour, gap=15, weight="400", anchor="start", family=FONT):
    drawn = []
    for step, piece in enumerate(text.split("\n")):
        drawn.append(f'<text x="{x}" y="{y + step * gap}" font-family="{family}" '
                     f'font-size="{size}" font-weight="{weight}" fill="{colour}" '
                     f'text-anchor="{anchor}">{escape(piece)}</text>')
    return "\n".join(drawn)


def wrap(text, width):
    rows, row = [], ""
    for word in text.split():
        if len(row) + len(word) + 1 > width:
            rows.append(row)
            row = word
        else:
            row = f"{row} {word}".strip()
    rows.append(row)
    return rows


def pairing_svg(words):
    lane_w, gap = 288, 20
    columns = [24, 24 + lane_w + gap, 24 + 2 * (lane_w + gap)]
    top, body, row_h, box_h = 62, 112, 74, 58
    lane_h = body - top + (len(words["steps"]) - 1) * row_h + box_h + 16
    width, height = 940, top + lane_h + 106
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" '
        f'width="{width}" height="{height}" role="img" aria-label="{escape(words["title"])}">',
        f'<defs><marker id="tip" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" '
        f'markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" '
        f'fill="{BLUE}"/></marker></defs>',
        f'<rect width="{width}" height="{height}" rx="10" fill="{PAPER}"/>',
        lines(words["title"], 24, 36, 19, INK, weight="600"),
    ]
    for index, left in enumerate(columns):
        parts.append(f'<rect x="{left}" y="{top}" width="{lane_w}" height="{lane_h}" '
                     f'rx="8" fill="{LANE}" stroke="{EDGE}"/>')
        parts.append(lines(words["lanes"][index], left + 16, top + 25, 13.5, INK, weight="600"))
        parts.append(lines(words["sub"][index], left + 16, top + 42, 11.5, DIM))

    where = {"a": 0, "b": 1, "c": 2}
    for step, (text, lane, arrow) in enumerate(words["steps"]):
        y = body + step * row_h
        left = columns[where[lane]]
        parts.append(f'<rect x="{left + 12}" y="{y}" width="{lane_w - 24}" height="{box_h}" '
                     f'rx="6" fill="#22262e" stroke="{EDGE}"/>')
        parts.append(f'<circle cx="{left + 30}" cy="{y + 19}" r="10" fill="{AMBER}"/>')
        parts.append(lines(str(step + 1), left + 30, y + 23, 12, PAPER, weight="700", anchor="middle"))
        parts.append(lines(text, left + 48, y + 23, 12, INK, gap=15))
        if arrow:
            start, end = where[arrow[0]], where[arrow[-1]]
            y_arrow = y - 8
            x1 = columns[start] + (lane_w - 12 if end > start else 12)
            x2 = columns[end] + (12 if end > start else lane_w - 12)
            parts.append(f'<path d="M{x1} {y_arrow} L{x2} {y_arrow}" stroke="{BLUE}" '
                         f'stroke-width="1.6" marker-end="url(#tip)" stroke-dasharray="4 3"/>')

    foot = height - 84
    parts.append(f'<rect x="24" y="{foot}" width="{width - 48}" height="30" rx="6" '
                 f'fill="#1b2a22" stroke="{GREEN}" stroke-opacity="0.4"/>')
    parts.append(lines(words["out"], 38, foot + 19, 12, GREEN))
    for row, piece in enumerate(wrap(words["note"], 118)):
        parts.append(lines(piece, 24, foot + 50 + row * 14, 11.5, DIM))
    parts.append("</svg>")
    return "\n".join(parts)


def routes_svg(words):
    width, height = 940, 470
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" '
        f'width="{width}" height="{height}" role="img" aria-label="{escape(words["title"])}">',
        f'<defs><marker id="tip" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" '
        f'markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" '
        f'fill="{DIM}"/></marker></defs>',
        f'<rect width="{width}" height="{height}" rx="10" fill="{PAPER}"/>',
        lines(words["title"], 24, 36, 19, INK, weight="600"),
    ]

    def block(x, y, w, h, title, sub, accent):
        drawn = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="{LANE}" '
                 f'stroke="{accent}" stroke-opacity="0.55"/>',
                 lines(title, x + 16, y + 27, 14, INK, weight="600")]
        for row, piece in enumerate(wrap(sub, 44)):
            drawn.append(lines(piece, x + 16, y + 46 + row * 14, 11.5, DIM))
        return "\n".join(drawn)

    parts.append(block(330, 62, 280, 42, words["deck"], "", INK))
    parts.append(f'<path d="M470 104 L470 140" stroke="{DIM}" stroke-width="1.6" marker-end="url(#tip)"/>')
    parts.append(lines(words["bus"], 482, 126, 11, DIM, family=MONO))
    parts.append(block(330, 140, 280, 70, words["plugin"], words["plugin_sub"], BLUE))
    parts.append(f'<path d="M470 210 L470 246" stroke="{DIM}" stroke-width="1.6" marker-end="url(#tip)"/>')
    parts.append(lines(words["pipe"], 482, 232, 11, DIM, family=MONO))
    parts.append(block(330, 246, 280, 70, words["worker"], words["worker_sub"], BLUE))

    parts.append(f'<path d="M330 281 L188 281 L188 334" stroke="{AMBER}" stroke-width="1.8" '
                 f'fill="none" marker-end="url(#tip)"/>')
    parts.append(f'<path d="M610 281 L752 281 L752 334" stroke="{DIM}" stroke-width="1.8" '
                 f'fill="none" stroke-dasharray="5 4" marker-end="url(#tip)"/>')
    parts.append(block(24, 334, 328, 80, words["lan"], words["lan_sub"], AMBER))
    parts.append(block(588, 334, 328, 80, words["cloud"], words["cloud_sub"], DIM))
    parts.append(lines(words["lan_ms"], 318, 274, 12, AMBER, anchor="end", weight="600"))
    parts.append(lines(words["cloud_ms"], 622, 274, 12, DIM, weight="600"))

    for row, piece in enumerate(wrap(words["note"], 118)):
        parts.append(lines(piece, 24, 438 + row * 14, 11.5, DIM))
    parts.append("</svg>")
    return "\n".join(parts)


def write(path, svg):
    # newline="\n" or Python rewrites these CRLF on Windows and every regeneration
    # shows up as a whole-file diff.
    path.write_text(svg, encoding="utf-8", newline="\n")


def main():
    folder = Path(__file__).resolve().parent.parent / "docs" / "img"
    folder.mkdir(parents=True, exist_ok=True)
    for locale in PAIRING:
        write(folder / f"pairing-flow-{locale}.svg", pairing_svg(PAIRING[locale]))
        write(folder / f"routes-{locale}.svg", routes_svg(ROUTES[locale]))
        print(f"wrote pairing-flow-{locale}.svg and routes-{locale}.svg")


if __name__ == "__main__":
    main()
