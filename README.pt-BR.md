*Idioma: [English](README.md) · **Português***

# Tua Casa — a sua casa no Stream Deck

[![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-3B6FD4)](LICENSE)
![Plataforma](https://img.shields.io/badge/plataforma-Windows%2010%20%2F%2011-0078D4)
![Stream Deck](https://img.shields.io/badge/Stream%20Deck-6.5%2B-101014)
![Interface](https://img.shields.io/badge/interface-pt%20%C2%B7%20en%20%C2%B7%20es-2E7D74)
![Marketplace](https://img.shields.io/badge/Elgato%20Marketplace-ainda%20n%C3%A3o-8a8a90)

Transforma teclas do Stream Deck nos interruptores, persianas e cenas da sua casa. As teclas
**mostram o estado ao vivo** — acesas quando a luz está acesa, com o consumo real quando a
tomada mede — e se atualizam sozinhas quando alguém mexe pelo celular.

Os comandos vão **direto pela sua rede**, sem passar pela internet: cerca de **100 ms** por
toque. Aparelhos que recusam conexão local caem automaticamente para a sessão da conta, e a
tecla os marca com um pontinho azul.

> **O pareamento acontece dentro do Stream Deck.** Você digita o código de usuário do seu app,
> escaneia o QR que aparece no painel, e pronto. Sem terminal, sem arquivo de configuração, sem
> conta de desenvolvedor.

## O que uma tecla faz

| Ação | O que faz |
|---|---|
| **Luz / tomada** | Liga e desliga um dispositivo. Mostra aceso/apagado, sem contato, e watts quando houver |
| **Persiana** | Abre, fecha, para, ou move a posição por uma fração que você escolhe |
| **Cena** | Roda uma cena que você já criou no seu app, ou grava e reaplica uma sua |
| **Apagar tudo** | Segure para apagar tudo o que ele alcança. Um toque curto não faz nada, de propósito |

**Uma tecla do Deck comanda uma tecla da parede.** Um interruptor de 4 teclas é um aparelho só,
mas aparece como quatro entradas independentes — porque é assim que você realmente monta no
Deck. Cada uma pode ser nomeada.

**O rótulo é seu.** Enter quebra a linha e nome comprido quebra sozinho; fonte, tamanho,
negrito e caixa são por tecla, então as que você procura no escuro podem gritar. Quando o
rótulo quer a tecla inteira, o ícone sai de cena e deixa a cor dele numa barra — a tecla
continua dizendo se a luz está acesa.

**O desenho e a cor também.** Toda tecla escolhe da mesma galeria — lâmpada, abajur, spot de
teto, tomada, interruptor, ventoinha, persiana, quadro, estrela, ZzZ, escrivaninha, serão,
noite, liga-desliga — e entre nove cores de acento. O desenho continua carregando o estado: o
spot só joga facho quando está aceso, o interruptor vira, a persiana desce até onde ela
realmente está.

## Requisitos

- Windows 10/11 e Stream Deck 6.5+
- **Python 3.10+** no PATH (o plugin roda um worker local pequeno)
- Aparelhos já funcionando no app do celular
- O PC na **mesma rede** dos aparelhos

```powershell
pip install -r requirements.txt
```

## Instalar

```powershell
cd streamdeck-plugin
npm install
npm run build
streamdeck link "com.felipedrummond.tuacasa.sdPlugin"
streamdeck restart com.felipedrummond.tuacasa
```

Depois arraste qualquer ação **Tua Casa** para uma tecla e siga o painel: ele pede o seu
**código de usuário** (no app: *Eu → ⚙ → Conta e segurança → Código de usuário*), mostra um QR,
e você escaneia com o mesmo app. A partir daí o painel lista tudo o que encontrou.

## Como funciona

```
Stream Deck
   │  SDK v2 (WebSocket)
   ▼
Plugin (TypeScript)          ← processo residente, desenha as teclas
   │  spawn + stdin/stdout, JSONL
   ▼
Worker (Python)              ← processo filho, dono das conexões
   ├── LAN: TCP 6668 + AES, uma conexão persistente por aparelho
   └── nuvem: sessão da conta + MQTT, para quem recusa conexão local
```

Segurar a conexão aberta é o truque inteiro. Medido numa casa real:

| | mediana |
|---|---|
| conexão nova a cada comando | 404 ms |
| **conexão persistente** | **101 ms** |
| tocar e confirmar, ponta a ponta | 206 ms |
| pela nuvem de reserva | ~250 ms |

Os dois caminhos falam a mesma língua para fora — os **códigos de estado** do próprio aparelho.
Só o protocolo da LAN usa data points numéricos, e essa conversão sai de um mapa que a própria
API fornece; nunca é adivinhada.

O estado não é consultado em laço. Cada aparelho empurra a mudança quando ela acontece, então
uma lâmpada acesa pelo celular repinta a tecla em segundos.

## Os seus dados

Chaves, tokens e o inventário ficam em `%LOCALAPPDATA%\streamdeck-tuacasa\`, **fora deste
repositório**. Nada é enviado a lugar nenhum além dos seus próprios aparelhos e, no caminho de
reserva, ao mesmo serviço com que o app do seu celular já conversa. Não há telemetria nem
servidor nosso — veja [PRIVACY.pt-BR.md](PRIVACY.pt-BR.md).

## Nomear as teclas de um interruptor

A API **não** fornece o nome de cada canal, então eles ficam num arquivo que você edita:

```
%LOCALAPPDATA%\streamdeck-tuacasa\channel-names.json
```

```json
{
  "bf1234....switch_1": "Teto",
  "# bf1234....switch_1": "Interruptor do corredor — tecla 1"
}
```

Chaves começando com `#` são comentários de referência, para você saber qual é qual. Sem nome,
a lista cai em `Aparelho — 1`, `Aparelho — 2`. Reinicie o plugin depois de editar.

## Quando algo não responde

```powershell
python tools/probe.py list          # inventário e alcance
python tools/probe.py read "<nome>" # estado cru, com tempo
python tools/probe.py scan          # quem se anuncia na rede
```

Aparelho que responde ao `scan` mas falha no `read` quase sempre está com a **chave local
vencida** — repareie no app e aperte *Reescanear rede* no painel. Erro `914` significa que a
chave ou a versão de protocolo foi rejeitada; `901`/`905` significam que o pacote não chegou.

Log do plugin: `com.felipedrummond.tuacasa.sdPlugin/logs/`.

Limitações conhecidas: [LIMITS.pt-BR.md](LIMITS.pt-BR.md).

## Créditos

Este plugin se apoia em trabalho de outras pessoas, tudo sob licença permissiva:

| Projeto | Autoria | Licença |
|---|---|---|
| [tinytuya](https://github.com/jasonacox/tinytuya) | Jason A. Cox | MIT |
| [tuya-device-sharing-sdk](https://github.com/tuya/tuya-device-sharing-sdk) | Tuya Inc. | MIT |
| [python-qrcode](https://github.com/lincolnloop/python-qrcode) | Lincoln Loop | BSD |
| [@elgato/streamdeck](https://github.com/elgatosf/streamdeck) | Elgato | MIT |

O fluxo de pareamento por QR é o que a integração Tuya do Home Assistant estabeleceu. Veja
[LIMITS.pt-BR.md](LIMITS.pt-BR.md) para uma nota honesta sobre a identidade de aplicação de que
ele depende.

## Marcas

Tuya® e Smart Life® são marcas de seus respectivos donos. Este projeto **não é afiliado,
endossado nem patrocinado** por eles. Os nomes aparecem apenas para dizer com quais aparelhos
este plugin conversa.

## Licença

MIT — veja [LICENSE](LICENSE).
