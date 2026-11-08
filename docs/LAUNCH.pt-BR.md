*Idioma: [English](LAUNCH.md) · **Português***

# Kit de lançamento

Tudo o que vai para o GitHub e para fora numa versão, pronto para colar: a vitrine do
repositório, a versão para baixar e os posts que levam gente até ela. A listagem da loja da
Elgato tem arquivo próprio, o [marketplace/LISTING.pt-BR.md](marketplace/LISTING.pt-BR.md).

Os textos que vão para o GitHub e para o Reddit ficam em inglês, porque é a língua do
repositório; eles estão no [LAUNCH.md](LAUNCH.md) e não se repetem aqui. Este arquivo explica
o que cada um é e traz o que é em português: o post do LinkedIn.

As imagens são geradas, não feitas à mão: o `npm run promo` (em `streamdeck-plugin/`)
redesenha tudo a partir das mesmas funções que desenham a tecla física. Mudaram as teclas,
rode de novo.

## Configurações do repositório

| Campo | Valor |
|---|---|
| Visibilidade | Público |
| Descrição | o bloco em inglês do [LAUNCH.md](LAUNCH.md#repository-settings) — 242 dos 350 caracteres que o GitHub permite |
| Site | `https://github.com/ffapd1989/tuacasa/releases/latest` |
| Tópicos | `stream-deck` `streamdeck-plugin` `elgato` `tuya` `smart-life` `smart-home` `home-automation` `local-control` `windows` |
| Prévia social | [img/social-preview-en.png](img/social-preview-en.png) — 1280×640 |
| Issues | ligadas |
| Relato privado de vulnerabilidade | ligado — o [SECURITY.pt-BR.md](../SECURITY.pt-BR.md) manda as pessoas para esse botão, e ele não existe até a opção ser ativada |

A descrição diz, em português: plugin do Stream Deck para aparelhos compatíveis com Tuya
(Smart Life, Tuya Smart) — luzes, tomadas, interruptores de parede, persianas e cenas,
comandados pela sua própria rede em cerca de 100 ms, com o estado ao vivo em cada tecla.
Windows, pt/en/es, GPL-3.0.

A prévia social só sobe à mão: *Settings → General → Social preview → Edit*. O resto da
tabela sai pelos comandos do [LAUNCH.md](LAUNCH.md#repository-settings).

A versão em português da prévia, [img/social-preview-pt.png](img/social-preview-pt.png),
não vai para o GitHub (ele aceita uma só). Ela serve para o post em português.

## A versão

| Campo | Valor |
|---|---|
| Tag | `v1.0.0` |
| Título | `Tua Casa 1.0.0` |
| Arquivo | `dist/com.felipedrummond.tuacasa.streamDeckPlugin`, gerado pelo `npm run pack` no commit da tag |

O número da tag tem de bater com o `Version` do manifest (`1.0.0.0` — o Stream Deck quer
quatro dígitos).

As notas da versão estão em inglês no [LAUNCH.md](LAUNCH.md#the-release). Dizem: primeira
versão pública; como instalar (baixar, dois cliques, Python já vem dentro); as quatro ações;
a rota local de ~100 ms com a nuvem de reserva; ícones, cores e rótulo por tecla; painel em
três idiomas; requisitos; link para o LIMITS; e o aviso de não afiliação.

## Posts de divulgação

Leia as regras de autopromoção de cada comunidade antes de postar; algumas pedem flair,
outras uma proporção de outras participações. Anexe a prévia social ou, melhor, o vídeo de
demonstração.

Os dois posts do Reddit — r/StreamDeck e r/homeautomation (ou r/smarthome) — estão em
inglês no [LAUNCH.md](LAUNCH.md#announcement-posts). O primeiro fala com quem tem Stream
Deck; o segundo, com quem entende de automação residencial, e por isso traz as medições.

**LinkedIn**, com a [prévia em português](img/social-preview-pt.png):

```text
Coloquei a minha casa no Stream Deck.

Interruptores, tomadas e motores de persiana baratos, desses que funcionam pelo app Smart Life, agora respondem a uma tecla. E a tecla responde de volta: acende quando a luz está acesa, mostra quantos watts a tomada puxa e se atualiza sozinha quando alguém mexe pelo celular.

O Tua Casa conversa com os aparelhos direto pela rede de casa, sem dar a volta pela internet: cerca de 100 ms por toque. O que não aceita conexão local cai sozinho para a conta, sem ninguém precisar escolher.

O pareamento acontece dentro do próprio Stream Deck: você digita o código de usuário do app e escaneia um QR. Sem terminal, sem conta de desenvolvedor, sem instalar Python — vai tudo dentro de um arquivo só.

É gratuito e de código aberto (GPL-3.0), para Windows, com interface em português, inglês e espanhol.

https://github.com/ffapd1989/tuacasa
```

## Vídeo de demonstração

É o que faz um post funcionar, e a listagem da loja usa a mesma filmagem
([marketplace/LISTING.pt-BR.md](marketplace/LISTING.pt-BR.md#vídeo-de-demonstração)). Uma
tecla de verdade comandando um aparelho de verdade é a única coisa que as imagens geradas não
mostram.

- De 30 a 60 segundos, MP4, 1920×1080, ou um GIF de menos de 10 MB para o README
- O Deck e o cômodo no mesmo quadro, para que o toque e a luz acendendo sejam um evento só
  na tela

As tomadas, em ordem:

1. Um toque numa tecla **Luz**: o abajur do cômodo acende e a tecla acende junto.
2. O mesmo abajur apagado **pelo celular**: a tecla apaga sozinha, segundos depois.
3. Uma tecla **Persiana** tocada duas vezes: a persiana desce, e o desenho na tecla
   acompanha.
4. **Apagar tudo** segurado: tudo apaga.
5. O painel, rapidamente: a lista de aparelhos e a galeria de ícones.

O que uma gravação não pode mostrar: o código de usuário, o QR, ids de aparelho ou chaves
locais na Atividade, e nada na tela que diga onde fica a casa.

## Antes de anunciar

- [ ] Todo commit da versão enviado para a `main`
- [ ] Repositório público, com descrição, site e tópicos, e o relato privado de
      vulnerabilidade ligado (os comandos do [LAUNCH.md](LAUNCH.md#repository-settings))
- [ ] Prévia social enviada à mão
- [ ] `npm run pack` no commit da tag, e a versão criada com esse arquivo
- [ ] Instalado a partir da versão numa máquina que não seja a do autor, sem Python e sem
      Node, seguindo só o README: baixar, dois cliques, parear, tocar uma tecla. É a
      checagem que pega o passo que só funciona porque a máquina do autor já tinha algo
- [ ] O selo de download do README resolve (ele lê a versão mais recente, então só funciona
      depois que o repositório fica público)
