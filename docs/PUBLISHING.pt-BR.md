*Idioma: [English](PUBLISHING.md) · **Português***

# Prontidão para publicação

O que está resolvido, o que não está, e o que cada pendência realmente bloqueia. Dois
destinos são avaliados separadamente, porque a régua deles é diferente:

| Destino | Veredito |
|---|---|
| **Repositório público no GitHub** | pronto — nada encontrado que precise sair antes |
| **Loja da Elgato (Marketplace)** | bloqueado, por um item, e não é a licença |

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

**O onboarding não exige terminal.** O pareamento acontece dentro do painel do Stream
Deck: [docs/PAIRING.pt-BR.md](PAIRING.pt-BR.md). A instalação ainda exige — veja a
pendência aberta abaixo.

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

Duas ressalvas, declaradas como ressalvas porque não foram verificáveis de fora:

- **O Maker Agreement é o texto vinculante, e ele é privado** — mora dentro do Maker
  Console, nas Settings da organização. Leia antes de submeter. É lá que estaria uma
  cláusula incompatível com a GPL, se existir.
- **DRM.** O Marketplace oferece aos plugins cifragem de arquivo e verificação de
  integridade. Esse é o ponto clássico de atrito entre a GPL e uma loja de aplicativos — o
  §6 da GPLv3 e a proibição de impor "restrições adicionais" conflitam com distribuir um
  binário GPL que o destinatário não pode modificar e executar. O material público
  descreve os plugins como *elegíveis a* DRM, o que sugere adesão opcional; **não foi
  possível confirmar se é recusável.** Se for, recuse e o conflito não acontece.

Nenhuma das duas é o que bloqueia uma submissão hoje.

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

Para uma **submissão à loja** tem de ser substituído por uma credencial registrada para
este plugin. Trate como feature com custo, não como polimento.

### 2. Não bloqueia — resolvido

O abajur, a única arte não desenhada para este plugin, é o glifo `lamp` do **Phosphor
Icons**, MIT. Verificado contra o `LICENSE` do próprio Phosphor e pela comparação do path:
mesma grade de 256 unidades, mesmos vértices. O aviso de copyright dele está reproduzido no
[THIRD-PARTY.pt-BR.md](../THIRD-PARTY.pt-BR.md#arte), que é o que a MIT exige. Nada mais em
`imgs/` veio de fora.

### 3. Não bloqueia — a instalação ainda pede terminal

O pareamento está no painel, mas colocar o plugin na máquina ainda é `pip install`,
`npm install`, `npm run build`, `streamdeck link`
([LEIA-ME](../README.pt-BR.md#instalar)). Isso serve para um público de GitHub e é
errado para um público de loja, que espera um arquivo `.streamDeckPlugin` para dar dois
cliques. Empacotar um é o passo natural seguinte, e ele vai expor a dependência de Python
como o obstáculo real: o plugin precisa de Python no PATH, e o usuário de loja não terá.

### 4. Não bloqueia — decisões que merecem uma segunda olhada

- **O `bin/plugin.js` não é versionado.** Muitos plugins de Stream Deck commitam o bundle
  para que o repositório seja clonável-e-linkável sem passo de build. Este não, porque
  bundle desatualizado num diff é ruído que ninguém revisa. Reverter é uma linha do
  `.gitignore`.
- **Só Windows.** Nada no desenho é específico de Windows além do lançador de Python e do
  diretório de estado, mas nada foi testado em outro lugar, e o manifest declara Windows
  sozinho.
- **Cor e brilho são lidos mas não expostos.** Está no
  [LIMITS.pt-BR.md](../LIMITS.pt-BR.md) para ninguém abrir a mesma issue duas vezes.

## Antes do primeiro push

- [ ] Ler o Maker Agreement se a loja for destino algum dia (pendência 1 e a ressalva de
      DRM acima)
- [ ] Decidir público ou privado no GitHub — hoje o repositório é privado
- [ ] Ligar o **relato privado de vulnerabilidade** nas configurações do repositório. O
      [SECURITY.pt-BR.md](../SECURITY.pt-BR.md) manda as pessoas para esse botão, e sem
      ativar a opção o botão não existe — o que deixa uma issue pública como única rota
      para um relato que jamais deveria ser público
- [ ] Instalar do zero numa pasta limpa, seguindo só o README, numa máquina que não seja a
      do autor. É a checagem que pega o que todas as outras deixam passar: um passo que só
      funciona porque a máquina do autor já tinha algo instalado.
