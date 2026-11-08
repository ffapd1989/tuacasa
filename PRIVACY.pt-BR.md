*Idioma: [English](PRIVACY.md) · **Português***

# Privacidade

Versão curta: este plugin não tem servidor, não coleta nada, e não manda nada para lugar nenhum
além dos seus próprios aparelhos e do serviço de conta que você já usa.

## O que é guardado, e onde

Tudo fica na sua máquina, em `%LOCALAPPDATA%\streamdeck-tuacasa\`:

| Arquivo | O que contém |
|---|---|
| `tokens.json` | A sessão criada no pareamento, mais o seu código de usuário |
| `devices.json` | Sua lista de aparelhos: nomes, endereços, chaves locais, capacidades |
| `channel-names.json` | Os nomes que você deu a cada tecla de um interruptor |
| `scenes.json` | As cenas que você gravou pelo plugin |

Esses arquivos contêm **credenciais da sua casa**. Ficam de propósito fora da pasta do projeto,
para nunca irem parar num repositório por engano. Trate-os como um arquivo de senhas: quem os
copiar consegue comandar seus aparelhos.

Para apagar tudo, aperte **Desconectar conta** no painel, ou apague essa pasta.

## O que sai da sua máquina

**No caminho local — nada sai da sua rede.** O worker abre conexão direta com cada aparelho pela
LAN e fala o protocolo do aparelho. A internet não entra nisso.

**Nos caminhos de pareamento e de reserva**, o plugin conversa com o mesmo serviço com que o app
do seu celular já conversa, para: trocar seu código de usuário por uma sessão, listar seus
aparelhos e suas chaves, rodar cenas, e comandar aparelhos que recusam conexão local. Esse
tráfego vai para o fabricante que já opera seus aparelhos — o plugin não acrescenta um terceiro
novo.

**Não há telemetria, análise de uso, relatório de erro nem verificação de atualização.** Nenhum
autor deste plugin vê os nomes dos seus aparelhos, seu uso, nem qualquer outra coisa.

## Logs

O plugin escreve em `com.felipedrummond.tuacasa.sdPlugin/logs/`. Esses logs contêm nomes de
aparelhos e nomes de comandos, úteis para diagnóstico. **Não contêm chaves nem tokens.** Se você
compartilhar um log para relatar um problema, está compartilhando como seus aparelhos se chamam.

## Serviços de terceiros

O pareamento depende de uma identidade de aplicação registrada por outro projeto de código
aberto. Isso está declarado em [LIMITS.pt-BR.md](LIMITS.pt-BR.md) — afeta quem o fabricante
pensa que está perguntando, não o que é compartilhado sobre você.
