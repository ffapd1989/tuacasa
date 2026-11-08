*Idioma: [English](THIRD-PARTY.md) · **Português***

# Software de terceiros

Tudo sobre o que o Tua Casa é construído, quem escreveu e sob qual licença. Creditar é
obrigação dessas licenças, não cortesia.

O Tua Casa é **GPL-3.0-or-later** ([LICENSE](LICENSE)). Toda dependência abaixo é
compatível com isso, inclusive as duas que vêm com licença dupla — a escolha que este
projeto faz está declarada na tabela.

As versões são as que estão dentro do pacote da versão 1.0.0. Para reconferir depois de
uma atualização, veja [Reconferindo](#reconferindo) no fim.

## Execução — o Python e os pacotes do worker

O pacote de distribuição (`.streamDeckPlugin`) **redistribui** tudo isto: o `npm run pack`
põe o Python embutível do Windows na pasta `python/` do plugin e instala o
`requirements.txt` dentro dele, então quem instala o plugin não precisa de Python próprio. Os
textos das licenças vão junto, dentro do pacote: `python/LICENSE.txt` e cada
`python/Lib/site-packages/*.dist-info/`.

| Componente | Versão | Licença | Autoria |
|---|---|---|---|
| [CPython](https://www.python.org/) (pacote embutível do Windows) | 3.14.6 | PSF-2.0 | Python Software Foundation |

O `LICENSE.txt` do CPython cobre também o que ele traz dentro de si — OpenSSL (Apache-2.0),
libffi, bzip2, zlib, SQLite e o resto —, cada um com o seu aviso naquele arquivo.

| Pacote | Versão | Licença | Autor |
|---|---|---|---|
| [tinytuya](https://github.com/jasonacox/tinytuya) | 1.20.0 | MIT | Jason A. Cox |
| [tuya-device-sharing-sdk](https://github.com/tuya/tuya-device-sharing-sdk) | 0.2.15 | MIT | Tuya Inc. |
| [qrcode](https://github.com/lincolnloop/python-qrcode) | 8.2 | BSD-3-Clause | Lincoln Loop |

Trazidas transitivamente por essas três:

| Pacote | Versão | Licença | Observação |
|---|---|---|---|
| certifi | 2026.10.23 | MPL-2.0 | copyleft fraco, por arquivo; compatível com GPL pela cláusula de licenças secundárias. Vai como fonte sem modificação, que é o que a MPL pede |
| cffi | 2.1.1 | MIT | |
| charset-normalizer | 3.5.2 | MIT | |
| colorama | 0.4.6 | BSD-3-Clause | |
| cryptography | 50.0.2 | Apache-2.0 **OU** BSD-3-Clause | **este projeto adota a Apache-2.0**; o wheel traz o próprio OpenSSL |
| idna | 3.20 | BSD-3-Clause | |
| paho-mqtt | 2.1.0 | EPL-2.0 **OU** BSD-3-Clause | **este projeto adota a BSD-3-Clause** — veja abaixo |
| pycparser | 3.12 | BSD-3-Clause | |
| requests | 2.34.2 | Apache-2.0 | |
| urllib3 | 2.8.0 | MIT | |

> **Por que a escolha no `paho-mqtt` importa.** EPL-2.0 e GPL não são compatíveis. O
> pacote é oferecido sob qualquer uma das duas, então este projeto adota o braço
> BSD-3-Clause e o conflito nunca acontece. Quem bifurcar sob outra licença deve fazer a
> própria escolha de forma deliberada, e não herdar esta por acidente.

## Execução — plugin do Stream Deck

Instaladas por `npm install` e empacotadas em `bin/plugin.js` pelo `npm run build`. O build
também grava os textos das licenças delas no `THIRD-PARTY-NOTICES.txt`, ao lado do
`manifest.json`, a partir do que o esbuild de fato empacotou — então uma dependência nova não
tem como ficar de fora.

| Pacote | Versão | Licença | Autor |
|---|---|---|---|
| [@elgato/streamdeck](https://github.com/elgatosf/streamdeck) | 3.0.4 | MIT | Elgato |
| @elgato/schemas | 0.6.0 | MIT | Elgato |
| @elgato/utils | 0.6.2 | MIT | Elgato |
| [ws](https://github.com/websockets/ws) | 8.21.3 | MIT | Einar Otto Stangvik |
| [zod](https://github.com/colinhacks/zod) | 3.25.76 | MIT | Colin McDonnell |

**Nenhum código proprietário é vinculado.** O SDK do Stream Deck é MIT, e o plugin
conversa com o programa da Elgato por WebSocket, como processo separado — não há
vinculação a nada da Elgato além dessa biblioteca MIT.

## Só para compilar — não distribuídas

Presentes em `node_modules` e usadas para produzir o bundle; nada disso vai para o arquivo
entregue.

| Pacote | Versão | Licença |
|---|---|---|
| @elgato/cli | 1.10.4 | MIT |
| esbuild + @esbuild/win32-x64 | 0.24.2 | MIT |
| typescript + @typescript/typescript-win32-x64 | 7.0.2 | Apache-2.0 |
| @types/node | 26.4.0 | MIT |
| undici-types | 8.3.0 | MIT |

## Precedente, não código

O fluxo de pareamento por QR — código de usuário, token de login, QR, espera pela
aprovação — é o que a integração Tuya do **Home Assistant** estabeleceu. Nenhum código do
Home Assistant é usado aqui; o fluxo é reimplementado sobre o SDK da própria Tuya.

O login usa a identidade de aplicativo que a Tuya emitiu para essa integração. **Isso é uma
credencial, não uma licença**: nenhum código nem cláusula de licença vem com ela. O que isso
significa para quem usa está no
[LIMITS.pt-BR.md](LIMITS.pt-BR.md#o-pareamento-depende-da-identidade-de-aplicativo-do-home-assistant).

## Arte

Todo ícone em `imgs/` e todo desenho de tecla foi feito para este plugin, no espaço 72×72
dele mesmo, **menos um**.

| Ícone | Origem | Licença |
|---|---|---|
| Abajur | [Phosphor Icons](https://github.com/phosphor-icons/core) — o glifo `lamp` | MIT |

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

O aviso está reproduzido porque a MIT exige — isso é a obrigação, não a cortesia. O path é
mantido na grade de 256 unidades do Phosphor e escalado para dentro da tecla, e é por isso
que ele é a única arte em [`src/icons.ts`](streamdeck-plugin/src/icons.ts) com coordenadas
de três dígitos. A cúpula é preenchida com a cor de estado da tecla em vez do cinza chapado
do original, então o abajur fica âmbar junto com o resto.

## Compatibilidade de licenças, numa tabela

Por que cada uma delas pode ficar dentro de um projeto GPL-3.0-or-later:

| Licença | Compatível com GPL-3.0 | Por quê |
|---|---|---|
| MIT, BSD-3-Clause, ISC | sim | permissivas; os termos da GPL podem ser sobrepostos |
| Apache-2.0 | sim, com GPLv3+ | a cláusula de patentes é compatível com a v3, **não** com a v2 |
| PSF-2.0 | sim | permissiva; a FSF a lista como compatível com a GPL |
| MPL-2.0 | sim | o §3.3 permite explicitamente a combinação com a GPL |
| EPL-2.0 | **não** | evitada adotando o braço BSD do `paho-mqtt` |

Nada aqui obriga o Tua Casa a ser permissivo, e nada aqui proíbe a GPL. A contaminação
corre no outro sentido: código permissivo pode entrar num projeto GPL, não o contrário.

## Reconferindo

Depois de trocar uma dependência, regenere estas tabelas em vez de editá-las na mão:

```powershell
python -c "import importlib.metadata as m; d=m.metadata('tinytuya'); print(d.get('License-Expression') or d.get('License'))"
node -e "console.log(require('./streamdeck-plugin/node_modules/ws/package.json').license)"
```

Pacote cujo campo `License` está vazio costuma trazer a resposta em `License-Expression`
(PEP 639) ou no arquivo `LICENSE` que ele empacota. Não tome o classifier do PyPI como
resposta sozinho — o `qrcode` declara tanto um classifier BSD quanto um
`Other/Proprietary License`, e o arquivo `LICENSE` dele é BSD-3-Clause puro.
