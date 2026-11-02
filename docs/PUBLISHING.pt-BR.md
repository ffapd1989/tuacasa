*Idioma: [English](PUBLISHING.md) · **Português***

# Prontidão para publicação

O que está resolvido, o que não está, e o que cada pendência realmente bloqueia. Dois
destinos são avaliados separadamente, porque a régua deles é diferente:

| Destino | Veredito |
|---|---|
| **Repositório público no GitHub, com versão para baixar** | pronto — os passos que faltam estão no [LAUNCH.pt-BR.md](LAUNCH.pt-BR.md) |
| **Loja da Elgato (Marketplace)** | **fora dos planos**, por decisão de 02/11/2026 — um bloqueio, e não é a licença |

A loja ficou de lado por causa da [identidade de aplicativo emprestada](#1-bloqueia-a-loja--a-identidade-de-aplicativo-emprestada):
não existe caminho público para um desenvolvedor independente registrar uma própria, e o
único par conhecido é o do Home Assistant. Todo o resto que uma versão de loja exigiria está
em [Se a loja voltar](#se-a-loja-voltar), para o trabalho não se perder.

## Resolvido

**Nada pessoal está versionado.** Todo arquivo rastreado foi varrido em busca de nomes,
endereços, faixas de rede, caminhos locais, endereços MAC e segredos longos. As únicas
ocorrências são a identidade do próprio produto — `com.felipedrummond.tuacasa` como UUID
do plugin e `Felipe Drummond` como `Author` no manifest — que é exatamente para isso que
serve um UUID em reverse-DNS, e que é permanente depois de publicado.

Chaves, tokens e o inventário de aparelhos não entram no repositório em nenhuma hipótese:
moram em `%LOCALAPPDATA%\streamdeck-tuacasa\`, e o `.gitignore` ainda os barra por nome
caso alguma mudança futura passe a gravar um deles localmente. A pasta `logs/` do plugin —
que carrega nomes de aparelhos e dados da máquina — é ignorada como diretório inteiro, e o
`git check-ignore` confirma.

**As licenças estão inventariadas e creditadas.** Toda dependência de execução e de
compilação, com versão, licença e autor: [THIRD-PARTY.pt-BR.md](../THIRD-PARTY.pt-BR.md).
Duas vêm com licença dupla, e a escolha deste projeto está declarada em vez de ficar ao
acaso — `paho-mqtt` sob BSD-3-Clause e não EPL-2.0, que é o que a mantém compatível com a
GPL.

**Nenhum código proprietário é vinculado.** O SDK do Stream Deck é MIT, e o plugin roda
como processo separado conversando por WebSocket.

**O nome não carrega marca alheia.** "Tua Casa" não traz a marca de nenhum fabricante. A
compatibilidade é *declarada* — "funciona com aparelhos compatíveis com Tuya" — e os dois
READMEs e o [docs/TUYA.pt-BR.md](TUYA.pt-BR.md) trazem aviso explícito de não afiliação.

**Nada exige terminal.** A versão publicada é um arquivo `.streamDeckPlugin` para dar dois
cliques, e ele leva o próprio Python, então quem instala não precisa de mais nada. O
pareamento acontece dentro do painel do Stream Deck: [docs/PAIRING.pt-BR.md](PAIRING.pt-BR.md).

## A licença: o que a GPL-3.0 faz e o que ela não faz

A licença é a **GPL-3.0-or-later** ([LICENSE](../LICENSE)).

O que ela garante:

- Quem receber o programa, modificado ou não, tem de poder obter o **código-fonte
  completo** sob a mesma licença.
- Ninguém pode pegar este código, fechá-lo e lançar um produto proprietário a partir dele.
- Um fork continua livre, e um fork do fork também.

O que ela **não** garante, e vale dizer com todas as letras: **a GPL não obriga o software
a ser gratuito.** Ela obriga a liberdade, não o preço. Alguém pode legalmente vender
cópias — inclusive numa loja — desde que entregue o código-fonte sob a GPL. Na prática o
preço desaba para zero, porque quem compra uma cópia tem o direito de redistribuí-la de
graça, e nada o impede.

Se o objetivo for literalmente "sempre gratuito, mesmo modificado", nenhuma licença de
código aberto entrega isso; só uma cláusula não-comercial entrega, e ela tiraria o projeto
do código aberto, faria o GitHub marcá-lo como proprietário e fecharia a porta da loja.
Este projeto escolheu a GPL em vez dessa troca.

## A GPL e a loja da Elgato

**Nada nas diretrizes públicas da Elgato proíbe um plugin GPL.** As
[Plugin Guidelines](https://docs.elgato.com/guidelines/stream-deck/plugins/) não dizem uma
palavra sobre licença de software, e as
[Product Guidelines](https://docs.elgato.com/guidelines/products/) exigem apenas que você
*detenha os direitos sobre o que publica* — o que licenciar a própria obra sob GPL não
afeta, já que a titularidade do direito autoral continua sua de qualquer jeito. Produtos
podem ser listados como gratuitos ou pagos.

Duas ressalvas:

- **O Maker Agreement é o texto vinculante, e ele é privado** — mora dentro do Maker
  Console, nas Settings da organização. Leia antes de submeter. É lá que estaria uma
  cláusula incompatível com a GPL, se existir.
- **O DRM não é opcional.** O TranscriTranslator, do mesmo autor, passou pela loja em
  outubro de 2026: os builds da loja são cifrados, e para isso a loja exige SDK 3, Stream
  Deck 7.1+ e Node 24. O §6 da GPLv3 proíbe o *licenciado* de distribuir um binário GPL que
  o destinatário não possa modificar e executar. Ele não amarra o *titular* do direito
  autoral: enquanto toda linha de código GPL do plugin for do próprio autor — e hoje é,
  porque toda dependência é permissiva —, o autor pode distribuir um build cifrado da
  própria obra na loja, com o código-fonte aberto aqui.

É esse segundo ponto que uma contribuição de fora mudaria. Depois que o código de outra
pessoa entra sob a GPL, um build cifrado para a loja precisa da permissão dela também. Se a
loja voltar à mesa um dia, peça a concordância de quem contribui **antes** do merge, não
depois.

## Pendências

### 1. Bloqueia a loja — a identidade de aplicativo emprestada

O pareamento por QR usa um `client_id` e um `schema` registrados pelo projeto **Home
Assistant**, não por este
([`worker/tuacasa.py:68`](../streamdeck-plugin/com.felipedrummond.tuacasa.sdPlugin/worker/tuacasa.py#L68)).
Os usuários deste plugin se autenticam como se fossem o Home Assistant, e o fabricante
pode revogar isso a qualquer momento, quebrando todas as instalações de uma vez.

Para um **repositório de código aberto** isso é prática comum entre ferramentas de
comunidade, e está declarado em vez de escondido — veja o
[LIMITS.pt-BR.md](../LIMITS.pt-BR.md). Não bloqueia a publicação no GitHub.

Para uma **submissão à loja** tem de ser substituído. Pesquisado em 02/11/2026:

- A Tuya não publica nenhum caminho de autoatendimento para obter um `client_id` deste
  fluxo de QR. O que o Home Assistant usa saiu do trabalho da própria Tuya naquela
  integração.
- As outras bibliotecas abertas que fazem esse fluxo usam o mesmo par. O README do
  open-tuya diz com todas as letras que é "o único par conhecido que funciona".
- As alternativas legítimas são **pedir à Tuya** uma identidade própria deste plugin, ou
  fazer cada usuário criar um projeto de nuvem gratuito no site de desenvolvedor da Tuya e
  colar o Access ID e o Secret no painel — uns dez passos no site da Tuya, um período de
  teste a renovar de tempos em tempos e um caminho de nuvem mais fraco.

### 2. Resolvido — o único desenho emprestado

O abajur, a única arte não desenhada para este plugin, é o glifo `lamp` do **Phosphor
Icons**, MIT. Verificado contra o `LICENSE` do próprio Phosphor e pela comparação do path:
mesma grade de 256 unidades, mesmos vértices. O aviso de copyright dele está reproduzido no
[THIRD-PARTY.pt-BR.md](../THIRD-PARTY.pt-BR.md#arte), que é o que a MIT exige. Nada mais em
`imgs/` veio de fora.

### 3. Resolvido — instalar sem terminal

O `npm run pack` gera o `dist/com.felipedrummond.tuacasa.streamDeckPlugin` com o Python
embutível do Windows dentro dele
([CONTRIBUTING.pt-BR.md](../CONTRIBUTING.pt-BR.md#gerando-o-pacote-de-distribuição)).
Conferido em 02/11/2026: o worker subiu no Python embutido num ambiente sem Python no PATH, e
no Stream Deck do autor levantou 45 cargas e a sessão da nuvem (MQTT incluído) só com o
runtime embutido. O preço é o tamanho: cerca de 19 MB, quando o plugin em si tem menos de
1 MB.

### 4. Não bloqueia — decisões que merecem uma segunda olhada

- **O `bin/plugin.js` não é versionado.** Muitos plugins de Stream Deck commitam o bundle
  para que o repositório seja clonável-e-linkável sem passo de build. Este não, porque
  bundle desatualizado num diff é ruído que ninguém revisa. Reverter é uma linha do
  `.gitignore`.
- **Só Windows.** Nada no desenho é específico de Windows além do runtime de Python e do
  diretório de estado, mas nada foi testado em outro lugar, e o manifest declara Windows
  sozinho.
- **Cor e brilho são lidos mas não expostos.** Está no
  [LIMITS.pt-BR.md](../LIMITS.pt-BR.md) para ninguém abrir a mesma issue duas vezes.
- **Nomear as teclas de um interruptor de várias teclas ainda é editar um JSON.** O rótulo
  da própria tecla cobre o caso do dia a dia, então isso só afeta os nomes na lista de
  aparelhos.

## Se a loja voltar

Tudo abaixo foi aprendido levando o TranscriTranslator para a Marketplace, e vale aqui sem
mudança. Nada disso está feito, de propósito: é trabalho que só a loja pede.

- [ ] A pendência 1, substituída — sem ela, nada mais desta lista importa
- [ ] SDK 3: `@elgato/streamdeck` 3.x, `SDKVersion: 3`, `Software.MinimumVersion: "7.1"`,
      `Nodejs.Version: "24"`. O SDK 3 se recusa a conectar abaixo do 7.1, e deixa de disparar
      `onDidReceiveSettings` para mudanças que o próprio plugin faz
- [ ] Ícones da lista de ações (`imgs/action/*`, `imgs/plugin/category.svg`) brancos
      `#FFFFFF` em fundo transparente, sem cor e sem fundo — hoje são âmbar e azul
- [ ] Arte da listagem nos tamanhos da loja: ícone do app 288×288, thumbnail e de 3 a 10
      imagens de galeria em 1920×960, tudo PNG. O `npm run promo` já desenha a partir das
      teclas reais; falta acrescentar esses tamanhos
- [ ] Descrição de 250 a 1.500 caracteres em inglês, os primeiros 250 em texto corrido
- [ ] Um vídeo de demonstração: o revisor não tem aparelhos Tuya, então um vídeo de teclas
      reais comandando aparelhos reais é a única prova que ele terá. MP4, 1920×1080, menos
      de 50 MB
- [ ] Primeira submissão com *Publish after review* desmarcado; baixar o build protegido da
      aba Versions e instalá-lo antes de publicar
