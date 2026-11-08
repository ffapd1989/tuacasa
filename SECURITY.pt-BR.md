*Idioma: [English](SECURITY.md) · **Português***

# Segurança

## Relatando uma vulnerabilidade

**Não abra uma issue pública.** Use o relato privado de vulnerabilidade do GitHub neste
repositório — o botão **Report a vulnerability**, em *Security* — que chega ao mantenedor
sem tornar o relato público.

Diga o que encontrou, como reproduzir e o que um atacante ganha com isso. Se a prova de
conceito envolver aparelhos reais, descreva em vez de anexar capturas: um dump de pacotes
de uma sessão funcionando contém chaves locais.

Este é um projeto de tempo livre com um mantenedor só. Espere uma confirmação em dias, não
em horas, e nenhuma recompensa financeira.

## O que está no escopo

- Qualquer coisa que vaze o conteúdo de `%LOCALAPPDATA%\streamdeck-tuacasa\` — essa pasta
  guarda a sessão da conta e a chave local de cada aparelho
- Um caminho que permita a um processo na mesma máquina, ou a uma página no Property
  Inspector, comandar aparelhos que não deveria
- Envio de credenciais para qualquer lugar além do serviço da conta que o aplicativo do
  celular já usa
- Chaves ou tokens aparecendo no log do plugin, que os usuários são convidados a colar em
  relatos de bug

## O que não é vulnerabilidade aqui

**A pasta de estado é legível pela sua própria conta de usuário.** É por desenho: o worker
precisa lê-la. É um cofre de credenciais num desktop de um usuário só, não um cofre-forte.
Quem consegue ler os seus arquivos já controla os seus aparelhos — a pasta fica fora do
repositório para nunca ser commitada, não para ser secreta de você.

**As chaves locais dos aparelhos ficam em texto puro.** Elas vêm da conta e precisam ser
usáveis sem pedir uma senha a cada toque de tecla. Cifrá-las com uma chave guardada ao lado
delas, no mesmo disco, seria teatro.

**O plugin escuta num WebSocket local.** Esse é o protocolo do próprio SDK do Stream Deck,
em `127.0.0.1`, estabelecido pelo programa da Elgato — não é algo que este plugin abre.

**Os aparelhos são comandados por um protocolo com fraquezas conhecidas.** O esquema AES, a
distribuição de chaves e o broadcast de descoberta são do fabricante, compartilhados por
todo aparelho Tuya do mercado. Fraquezas ali valem um relato rio acima, ao
[tinytuya](https://github.com/jasonacox/tinytuya) ou ao fabricante; este plugin não tem como
consertá-las.

**O pareamento usa a identidade de aplicativo da integração Tuya do Home Assistant.**
Documentado no
[LIMITS.pt-BR.md](LIMITS.pt-BR.md#o-pareamento-depende-da-identidade-de-aplicativo-do-home-assistant).
Não é uma vulnerabilidade.

## Versões suportadas

O último commit da `main`. Não há branches de release nem backports.

## O que o plugin faz com os seus dados

Nada sai da sua máquina além do que vai para os seus próprios aparelhos e para o serviço da
conta com que o aplicativo do celular já conversa. Sem telemetria, sem analytics, sem
relatório de falhas, sem verificação de atualização. A prestação de contas completa está no
[PRIVACY.pt-BR.md](PRIVACY.pt-BR.md).
