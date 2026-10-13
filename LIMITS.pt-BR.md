*Idioma: [English](LIMITS.md) · **Português***

# Limitações, e o que vai te morder

Escrito para te poupar a depuração. Tudo aqui é conhecido, reproduzido, e ou não resolvido ou
insolúvel.

## Impedimento para publicar na loja

**O pareamento por QR usa uma identidade de aplicação que não é nossa.** O `client_id` e o
`schema` em `worker/tuacasa.py` pertencem ao projeto **Home Assistant**, que os registrou junto
ao fabricante. O código deles é aberto; essa identidade não é licença, é credencial
operacional.

Na prática:

- Quem usar este plugin se autentica como se fosse o Home Assistant.
- O fabricante pode revogá-la a qualquer momento, derrubando todas as instalações de uma vez.
- Distribuir isso num produto pago ou de loja é usar identidade alheia.

Para um repositório aberto isso é prática comum entre ferramentas da comunidade, e está
declarado aqui em vez de escondido. **Para submeter à Marketplace, precisa ser substituído** por
uma credencial registrada para este plugin.

## O que não funciona, e por quê

**Aparelhos que rejeitam a chave local.** Alguns respondem na porta 6668, são corretamente
identificados, e mesmo assim recusam a chave que a conta entrega — erro `914`. Reparear o
aparelho no app do celular e reescanear costuma resolver. Quando não resolve e o aparelho está
online, o plugin cai sozinho para o caminho de nuvem.

**Aparelhos que anunciam um endereço inalcançável.** Um aparelho pode anunciar um IP que não
responde a ARP nem a ping — o pacote nem sai da máquina. Isso é problema de topologia de rede
(em geral um nó de mesh que repassa broadcast mas não unicast), não algo que o plugin possa
contornar. Esses ficam inutilizáveis localmente e, se online, são comandados pela nuvem.

**Aparelhos que declaram não ter suporte local.** Fechaduras e algumas pontes de infravermelho
reportam `supportsLocal: false`. O fabricante não permite controle local neles, por desenho. Não
há o que fazer.

**Subdispositivos atrás de gateway.** Aparelhos Zigbee e Bluetooth chegam à rede pelo gateway,
não sozinhos. Só aparecem quando a conta os reporta online, e sempre vão pelo caminho de nuvem.

**Cor e brilho não estão implementados.** O modelo de dados é lido e guardado, mas nenhuma ação
os expõe ainda. Só liga/desliga e posição de persiana estão ligados.

## O que custou tempo para descobrir

**O token da sessão dura duas horas e o refresh token é de uso único.** A SDK o renova
sozinha, mas só avisa um listener — uma renovação que não seja gravada em disco quebra a
cadeia, e a próxima execução repete um token já gasto, recebendo um `sign invalid` nada
explicativo. Dois processos com a mesma sessão também disputam a renovação e queimam o token um
do outro, então rode um worker por vez: o diagnóstico em `tools/probe.py` de propósito nunca
toca na sessão de nuvem.

**O refresh token também vence quando ninguém o usa.** O worker só mantém a sessão viva
enquanto está rodando. Medido numa casa real: a sessão voltou depois de 15 horas com o
computador desligado, e estava morta depois de 46 — o endpoint de renovação responde
`1010 token is expired`, que a SDK engole, então o log mostra o `sign invalid` da chamada
seguinte. Não há como recuperar. As teclas da rede local continuam funcionando; as da nuvem e
as cenas do app mostram *reconectar* sob um sinal de alerta, e o painel pede o QR de novo sem
mexer no inventário.

**Uma action do Stream Deck nunca expõe as próprias settings de forma síncrona.** A `Action`
só oferece `getSettings()`, que é promise — não existe propriedade `.settings`, por mais que um
cast `any` deixe você escrever isso. Então tudo que repinta fora de um evento (um aparelho
empurrando estado novo, por exemplo) precisa guardar a própria cópia das settings, senão pinta
nada em silêncio e a tecla congela na imagem que tinha ao aparecer. Esse defeito é idêntico, na
tela, a um aparelho que nunca responde.

**Nada no plugin consegue medir texto.** Quem rasteriza é o QtSvg, em outro processo, então a
quebra de linha estima a largura dos glifos como fração do tamanho da fonte, por família. A
tabela erra para mais de propósito: quebrar cedo é feiúra, passar da tecla é palavra perdida.

**Uma conexão TCP por aparelho, e só.** O worker a segura. O app do celular continua
funcionando porque passa pela nuvem, mas outro controlador local (o Home Assistant, por exemplo)
vai brigar pelo mesmo canal.

**Chave local vencida parece IP errado, que parece versão de protocolo errada** — os três dão
timeout. Use o código do erro para separar: `914` quer dizer que o handshake TCP funcionou e a
*chave* foi rejeitada; `901` e `905` são falha de rede.

**Os ids de aparelho embutem o endereço MAC.** Um id terminado em `a4b1c2d3e4f5` é o aparelho em
`a4:b1:c2:d3:e4:f5`. Cruzar com `arp -a` identifica um aparelho contra o qual você não consegue
autenticar.

**Reparear um aparelho invalida a chave local dele.** Aperte *Reescanear rede* depois.

**O encoding do console do Windows mata o worker se você bobear.** O `tinytuya` importa
`colorama`, que envolve o stdout e estoura em qualquer caractere acentuado — um aparelho chamado
`Café` basta. Todo ponto de entrada aqui chama `colorama.deinit()` e força UTF-8 logo depois
de importá-lo.

**Nunca deixe o `receive()` rodar com o timeout dos comandos.** Ele espera um pacote inteiro,
então um pacote picado prende a thread e os cliques ficam parados na fila até ele desistir. O
worker baixa o timeout do socket para 0,4s só para essa leitura.

## Plataforma

Só Windows, por ora. Nada no desenho é específico de Windows além da escolha do lançador do
Python e do diretório de estado, mas nada foi testado fora dele.
