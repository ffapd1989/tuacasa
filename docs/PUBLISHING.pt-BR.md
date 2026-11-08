*Idioma: [English](PUBLISHING.md) · **Português***

# Publicação

Onde o Tua Casa é distribuído, e o que cada destino exige dele.

| Destino | Situação |
|---|---|
| **Versão no GitHub** | no ar desde a v1.0.0 — os passos e os textos estão no [LAUNCH.pt-BR.md](LAUNCH.pt-BR.md) |
| **Loja da Elgato (Marketplace)** | em preparação — listagem, arte e o checklist antes de submeter estão em [marketplace/LISTING.pt-BR.md](marketplace/LISTING.pt-BR.md) |

## Resolvido

**Nada pessoal está versionado.** Todo arquivo rastreado foi varrido em busca de nomes,
endereços, faixas de rede, caminhos locais, endereços MAC e segredos longos. As únicas
ocorrências são a identidade do próprio produto — `com.felipedrummond.tuacasa` como UUID
do plugin e `Felipe Drummond` como `Author` no manifest —, que é exatamente para isso que
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

**Um desenho veio de fora.** O abajur é o glifo `lamp` do **Phosphor Icons**, MIT.
Verificado contra o `LICENSE` do próprio Phosphor e pela comparação do path: mesma grade de
256 unidades, mesmos vértices. O aviso de copyright dele está reproduzido no
[THIRD-PARTY.pt-BR.md](../THIRD-PARTY.pt-BR.md#arte), que é o que a MIT exige. Nada mais em
`imgs/` veio de fora.

**Nenhum código proprietário é vinculado.** O SDK do Stream Deck é MIT, e o plugin roda
como processo separado conversando por WebSocket.

**O nome não carrega marca alheia.** "Tua Casa" não traz a marca de nenhum fabricante. A
compatibilidade é *declarada* — "funciona com aparelhos compatíveis com Tuya" — e os dois
READMEs e o [docs/TUYA.pt-BR.md](TUYA.pt-BR.md) trazem aviso explícito de não afiliação.

**Nada exige terminal.** O `npm run pack` gera um arquivo `.streamDeckPlugin` com o Python
embutível do Windows dentro dele
([CONTRIBUTING.pt-BR.md](../CONTRIBUTING.pt-BR.md#gerando-o-pacote-de-distribuição)), então
quem instala não precisa de mais nada. Conferido em 02/11/2026: o worker subiu no Python
embutido num ambiente sem Python no PATH, e no Stream Deck do autor levantou 45 cargas e a
sessão da nuvem (MQTT incluído) só com o runtime embutido. O preço é o tamanho: cerca de
19 MB, quando o plugin em si tem menos de 1 MB. O pareamento acontece dentro do painel do
Stream Deck: [docs/PAIRING.pt-BR.md](PAIRING.pt-BR.md).

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
- **Os builds da loja são protegidos.** A loja cifra e confere a integridade do que
  distribui. O §6 da GPLv3 proíbe o *licenciado* de distribuir um binário GPL que o
  destinatário não possa modificar e executar. Ele não amarra o *titular* do direito
  autoral: enquanto toda linha de código GPL do plugin for do próprio autor — e hoje é,
  porque toda dependência é permissiva —, o autor pode distribuir um build protegido da
  própria obra na loja, com o código-fonte aberto aqui.

É esse segundo ponto que uma contribuição de fora mudaria. Depois que o código de outra
pessoa entra sob a GPL, o build protegido da loja precisa da permissão dela também. Peça a
concordância de quem contribui **antes** do merge, não depois.

## O build da loja

O mesmo código gera os dois destinos. O que a loja pede, e como este plugin atende:

- **SDK 3.** `@elgato/streamdeck` 3.x, `SDKVersion: 3`, Stream Deck 7.1 ou mais novo e
  Node 24. O SDK 3 se recusa a conectar abaixo do 7.1.
- **Os arquivos são imutáveis depois de instalados.** As
  [regras de DRM](https://docs.elgato.com/streamdeck/sdk/introduction/distribution/) da
  Elgato proíbem alterar os arquivos que o plugin distribui e ler o `manifest.json` em
  execução. Por isso o worker roda o Python com `-B` e nunca grava bytecode ao lado dos
  pacotes embutidos, o pacote não leva `__pycache__`, e nada lê o manifest. O estado mora em
  `%LOCALAPPDATA%\streamdeck-tuacasa\`, fora do plugin.
- **Os ícones da lista de ações são brancos em fundo transparente.** `imgs/action/*` e
  `imgs/plugin/category.svg` são `#FFFFFF`, sem cor e sem fundo.
- **Uma tecla só é redesenhada quando a imagem dela muda.** As diretrizes limitam as
  atualizações programáticas a 10 por segundo, e um worker que informa o estado de cada
  aparelho redesenharia todas as teclas a cada informe.
- **Um toque que falha chama o `showAlert`** na tecla que o enviou.

A listagem descreve o pareamento do mesmo jeito que o [LIMITS.pt-BR.md](../LIMITS.pt-BR.md).

## Decisões que merecem uma segunda olhada

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
