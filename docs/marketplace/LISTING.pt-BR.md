*Idioma: [English](LISTING.md) · **Português***

# Listagem na loja da Elgato

O que vai para o Maker Console, pronto para colar. A loja quer o nome, a descrição e as
mídias em inglês, então os textos para colar ficam em inglês aqui também; este arquivo
explica em português o que vai em cada campo.

As imagens desta pasta são geradas pelo `npm run promo` (em `streamdeck-plugin/`), a partir
das mesmas funções que desenham a tecla física e das imagens do painel em
[../img/](../img/). Mudou as teclas ou o painel, rode de novo.

## Produto

| Campo | Valor |
|---|---|
| Tipo de produto | Stream Deck → Plugin |
| Nome | Tua Casa |
| Preço | Gratuito |
| Ícone do app | [app-icon.png](app-icon.png) — 288×288 |
| Thumbnail | [thumbnail.png](thumbnail.png) — 1920×960 |
| Galeria | [gallery-1-home.png](gallery-1-home.png), [gallery-2-state.png](gallery-2-state.png), [gallery-3-pairing.png](gallery-3-pairing.png), [gallery-4-panel.png](gallery-4-panel.png), [gallery-5-scenes.png](gallery-5-scenes.png) — 1920×960, mais o vídeo de demonstração |
| Pacote | `npm run pack` → `dist/com.felipedrummond.tuacasa.streamDeckPlugin` |

## Descrição

O campo aceita Markdown. Entre 250 e 1.500 caracteres, em inglês; os primeiros 250 têm de
ser texto sem formatação, porque viram o trecho que aparece na busca (as
[diretrizes de produto](https://docs.elgato.com/guidelines/products/) da Elgato). O texto para
colar é o bloco do [LISTING.md](LISTING.md#description) (1.469 caracteres, 1.489 se a loja
contar cada quebra de linha como dois). O que ele diz, em português:

- O primeiro parágrafo, sem formatação, apresenta o plugin: luzes, tomadas, interruptores de
  parede, persianas e cenas de aparelhos da plataforma Tuya ou Smart Life, os mesmos do app
  Smart Life ou Tuya Smart, respondendo em cerca de 100 ms pela sua rede.
- **What it does**, em lista: uma tecla por saída, estado ao vivo com watts, persianas, cenas,
  o All off, a nuvem de reserva, os 14 ícones, as 9 cores e os três idiomas do painel.
- **Setup**, em lista numerada: os três passos do pareamento dentro do painel.
- **Requirements**: Windows 10 ou 11, Stream Deck 7.1 ou mais novo, aparelhos já no app e o PC
  na mesma rede.
- **Good to know**: o pareamento usa a identidade de aplicativo da integração Tuya do Home
  Assistant; se a Tuya mudá-la, o pareamento para até sair uma atualização, e os aparelhos da
  rede continuam funcionando. É o mesmo que o [LIMITS.pt-BR.md](../../LIMITS.pt-BR.md) diz.
- Fecha dizendo que Tuya, Smart Life e Tuya Smart são marcas registradas dos respectivos
  donos e que o plugin não tem vínculo com eles; que o código é aberto, sob GPL-3.0, e se
  apoia em outras bibliotecas abertas, todas creditadas no README; e com o link do
  repositório.

## Tags

O vocabulário de tags só aparece dentro do Maker Console. O que escolher lá:

- **Dispositivos:** todo Stream Deck com teclas — o plugin tem quatro ações de tecla e
  nenhum layout de dial ou de faixa de toque.
- **Sistema operacional:** só Windows.
- **Tema:** smart home, automação residencial, iluminação, IoT.

## Links adicionais

Os mesmos do [LISTING.md](LISTING.md#additional-links): código e documentação, política de
privacidade, suporte (issues) e limitações conhecidas.

## Notas da versão — a primeira na loja

O número da versão é o `Version` do manifest no momento em que o pacote é gerado. Este campo
também aceita Markdown, e o texto para colar está no
[LISTING.md](LISTING.md#release-notes--the-first-marketplace-version): um título em negrito e
quatro itens, que dizem com que aparelhos funciona, a velocidade pela rede com a nuvem de
reserva, o pareamento dentro do painel com o Python embutido e os três idiomas.

## Vídeo de demonstração

O revisor não tem aparelhos Tuya, então um vídeo de teclas reais comandando aparelhos reais
é a única prova que ele terá de que o plugin funciona. O único espaço para vídeo na
submissão é um item da galeria, então ele vai lá, ao lado das imagens. MP4, 1920×1080,
**menos de 50 MB**.

As tomadas são as do [LAUNCH.pt-BR.md](../LAUNCH.pt-BR.md#vídeo-de-demonstração), e a mesma
filmagem serve aos dois. O que a versão da loja acrescenta:

- A galeria é pública, então a narração fala com quem vai instalar, não com o revisor.
- Painel em inglês e legendas em inglês, porque o revisor lê inglês.
- Nada legível que identifique uma conta ou uma casa: sem código de usuário, sem QR, sem IDs
  de aparelho nem chaves locais do log de atividade. Borre na edição.

O vídeo atual tem 1:07 e 8 MB; não é versionado, porque o repositório não é lugar para ele.
Foi gravado ao vivo no app do Stream Deck, no Stream Deck XL do autor, com a narração do
`gpt-4o-mini-tts` da OpenAI. O que ele mostra, na ordem:

1. A abertura.
2. Uma tecla de luz ligada e desligada duas vezes: a tecla acende quando o aparelho responde.
3. Uma persiana fechada, parada e aberta, com a tecla acompanhando o motor.
4. Uma cena do app e depois o All off segurado: toda tecla acesa se apaga.
5. O painel e as telas de pareamento, a partir das imagens da galeria.
6. O encerramento, com o repositório e o aviso de marcas.

## Antes de apertar submit

- [ ] O Maker Agreement lido (Maker Console → Settings da organização), procurando o que
      ele diz sobre serviços de terceiros e sobre licenças
- [ ] O nome "Tua Casa" ainda livre na loja
- [ ] `npx streamdeck validate com.felipedrummond.tuacasa.sdPlugin` e `npm run pack` no
      commit que vai ser enviado; o pacote tem cerca de 19 MB, então confira se cabe no
      limite de upload
- [ ] O primeiro upload vai com *Publish after review* desmarcado
- [ ] O build protegido baixado da aba Versions e instalado no lugar do linkado
      (`npx streamdeck unlink com.felipedrummond.tuacasa` antes). Passa quando o log mostra
      `worker up` e `cloud connected`, uma tecla liga um aparelho e nenhuma pasta
      `__pycache__` aparece dentro do `python/` do plugin
- [ ] O nome não pode ser trocado depois da submissão sem escrever para maker@elgato.com
