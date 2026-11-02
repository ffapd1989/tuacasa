*Idioma: [English](CONTRIBUTING.md) · **Português***

# Contribuindo

Relatos de bug e patches são bem-vindos. Leia o [LIMITS.pt-BR.md](LIMITS.pt-BR.md) antes —
boa metade do que parece bug é limite documentado da plataforma, e o arquivo existe para
que a mesma issue não seja aberta duas vezes.

## Colocando para rodar

Você precisa de Windows, Node 20+, Python 3.14 (`py -3.14`) e o app do Stream Deck.

```powershell
pip install -r requirements.txt
cd streamdeck-plugin
npm install
npm run build
npx streamdeck link "com.felipedrummond.tuacasa.sdPlugin"
npx streamdeck restart com.felipedrummond.tuacasa
```

Um plugin linkado roda o worker no seu próprio Python. Depois que o `npm run python` ou o
`npm run pack` rodou, ele passa a usar o Python embutido em
`com.felipedrummond.tuacasa.sdPlugin/python/` — apague essa pasta para voltar ao seu.

## Gerando o pacote de distribuição

```powershell
cd streamdeck-plugin
npx streamdeck stop com.felipedrummond.tuacasa    # só se estiver linkado: o Windows trava o python.exe em uso
npm run pack
npx streamdeck restart com.felipedrummond.tuacasa
```

Isso compila o bundle, baixa o Python embutível do Windows (versão fixa, conferida contra o
SHA-256 publicado pelo python.org), instala o `requirements.txt` dentro dele, confere que todo
pacote importa e grava `dist/com.felipedrummond.tuacasa.streamDeckPlugin`. É esse pacote que
vai numa release do GitHub; tem cerca de 19 MB, quase tudo Python e `cryptography`. A CLI da
Elgato deixa `*.log` de fora, então a pasta `logs/` nunca sai junto.

O `npm run promo` redesenha os PNGs do ícone do plugin e os cartões de divulgação em
`docs/img/social-preview-*.png` a partir das funções reais da tecla.

Duas coisas que ajudam antes de mexer no plugin:

```powershell
python tools/probe.py list          # inventário e alcance, sem o plugin
npm run keys                        # desenha todos os estados em docs/keys-<idioma>.html
```

O `probe.py` deliberadamente nunca toca na sessão da nuvem — dois processos segurando a
mesma sessão disputam a renovação e queimam o refresh token um do outro. O `npm run keys`
desenha as folhas de contato com as **mesmas funções que a tecla física usa**, então se uma
tecla parece errada no navegador, ela está errada no Deck.

## Regras da casa

**Código, comentário, mensagem de commit e nome de arquivo em inglês.** A interface é outra
história — veja abaixo.

**A interface é pt · en · es**, e os textos moram numa tabela por idioma, nunca soltos na
lógica. Três tabelas, porque são três leitores com três espaços diferentes: o
[`src/i18n.ts`](streamdeck-plugin/src/i18n.ts) é o que cabe numa tecla de 72 px, o objeto
`I18N` do
[`ui/inspector.html`](streamdeck-plugin/com.felipedrummond.tuacasa.sdPlugin/ui/inspector.html)
é o painel de configuração, e um não empresta do outro. Texto novo significa três entradas,
não uma. O inglês é o último recurso, nunca o português.

**Nada de uma casa real entra.** Nenhum nome de aparelho da sua casa, nenhum endereço,
nenhum MAC, nenhuma chave local — nem em código, nem em docstring, nem em exemplo, nem em
captura de tela. Só nomes inventados. O `.gitignore` barra os arquivos de estado por nome,
mas não pega um exemplo que você digitou.

**Mudança mínima e cirúrgica.** Toque no que o conserto precisa e em mais nada. Sem
refatorar código que funciona no caminho, sem abstração especulativa, sem
configurabilidade que ninguém pediu.

**Sem comentário explicando o que o código faz.** A exceção é o comentário que governa um
comportamento invisível, que quem editar aquela linha não teria como descobrir de outro
jeito — a armadilha do `colorama` em
[`worker/tuacasa.py:58`](streamdeck-plugin/com.felipedrummond.tuacasa.sdPlugin/worker/tuacasa.py#L58)
é o modelo.

## Duas armadilhas que vale conhecer antes de perder uma noite nelas

**SVG na tecla é rasterizado pelo QtSvg**, que segue o perfil SVG Tiny e ignora
silenciosamente listas e aspas em `font-family`. `'Segoe UI',Arial,sans-serif` cai na fonte
padrão sem avisar. Use **uma família só, sem aspas**. O Chrome mascara isso, então testar a
folha de contato no navegador não pega.

**Uma ação do Stream Deck nunca expõe as configurações de forma síncrona.** Não existe
propriedade `.settings`, por mais que um cast para `any` deixe você escrever — só existe
`getSettings()`, que é promise. Qualquer coisa que repinte fora de um evento precisa manter
a própria cópia, ou a tecla congela em silêncio no desenho que tinha. Tem mais dessas no
[LIMITS.pt-BR.md](LIMITS.pt-BR.md).

## Antes de abrir um pull request

- [ ] `npx tsc --noEmit` a partir de `streamdeck-plugin/` está limpo
- [ ] `npm run build` passa
- [ ] `npm run keys` ainda renderiza, e você **olhou** a folha — typecheck não é prova
      visual
- [ ] Se mexeu no painel ou numa tecla, você viu num Stream Deck de verdade
- [ ] Nenhum dado pessoal no diff, inclusive em capturas de tela

## Licença da sua contribuição

Este projeto é **GPL-3.0-or-later** ([LICENSE](LICENSE)). Abrir um pull request significa
que a sua contribuição entra sob os mesmos termos. Mantenha o cabeçalho SPDX no topo de
todo arquivo-fonte novo:

```
// SPDX-FileCopyrightText: <ano> <seu nome>
// SPDX-License-Identifier: GPL-3.0-or-later
```

Se um patch trouxer dependência nova, acrescente-a ao
[THIRD-PARTY.pt-BR.md](THIRD-PARTY.pt-BR.md) com versão, licença e autoria — e confira se a
licença é compatível com a GPL **antes** de escrever o código, não depois. A tabela de
compatibilidade no fim daquele arquivo é a resposta curta.

## Relatando um bug

Diga o que você fez, o que a tecla mostrou e o que o painel de **Atividade** disse. Se
houver um aparelho envolvido, `python tools/probe.py read "<nome>"` dá o estado bruto com
os tempos — cole isso, trocando o nome do aparelho se quiser. O log do plugin fica em
`com.felipedrummond.tuacasa.sdPlugin/logs/`; ele não carrega chaves nem tokens, mas carrega
os nomes dos seus aparelhos.

Problemas de segurança não vão para o rastreador de issues — veja o
[SECURITY.pt-BR.md](SECURITY.pt-BR.md).

A conduta neste projeto é regida pelo [Código de Conduta](CODE_OF_CONDUCT.pt-BR.md).
