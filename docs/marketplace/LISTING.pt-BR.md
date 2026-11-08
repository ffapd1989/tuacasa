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

Entre 250 e 1.500 caracteres; os primeiros 250 têm de ser texto corrido, porque viram o
trecho que aparece na busca. O texto para colar é o bloco do
[LISTING.md](LISTING.md#description) (1.420 caracteres). O que ele diz, em português:

- O primeiro parágrafo apresenta o plugin: luzes, tomadas, interruptores de parede,
  persianas e cenas de aparelhos compatíveis com Tuya, os mesmos do app Smart Life ou Tuya
  Smart, comandados pela sua rede em cerca de 100 ms.
- "What it does" lista o que cada ação faz, os 14 ícones, as 9 cores e os três idiomas do
  painel.
- "Setup" são os três passos do pareamento dentro do painel.
- "Requirements": Windows 10 ou 11, Stream Deck 7.1 ou mais novo, aparelhos já no app e o
  PC na mesma rede.
- Uma frase diz que o pareamento entra com a identidade de aplicativo da integração Tuya do
  Home Assistant, e que, se a Tuya mudá-la, o pareamento para até sair uma atualização,
  enquanto os aparelhos da rede continuam funcionando — o mesmo que o
  [LIMITS.pt-BR.md](../../LIMITS.pt-BR.md) diz.
- Fecha com a não afiliação e o link do repositório.

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

O número da versão é o `Version` do manifest no momento em que o pacote é gerado. O texto
para colar está no [LISTING.md](LISTING.md#release-notes--the-first-marketplace-version).

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
