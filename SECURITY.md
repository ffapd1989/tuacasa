*Language: **English** · [Português](SECURITY.pt-BR.md)*

# Security

## Reporting a vulnerability

**Do not open a public issue.** Use GitHub's private vulnerability reporting on this
repository — the **Report a vulnerability** button under *Security* — which reaches the
maintainer without the report becoming public.

Tell us what you found, how to reproduce it, and what an attacker gets out of it. If a
proof of concept touches real devices, describe it rather than attaching captures: a packet
dump of a working session contains local keys.

This is a spare-time project with one maintainer. Expect an acknowledgement in days, not
hours, and no bounty.

## What is in scope

- Anything that leaks the contents of `%LOCALAPPDATA%\streamdeck-tuacasa\` — that folder
  holds the account session and every device's local key
- A path that lets a process on the same machine, or a page in the Property Inspector,
  command devices it should not
- Sending credentials anywhere other than the account service the phone app already uses
- Keys or tokens appearing in the plugin log, which users are asked to paste into bug
  reports

## What is not a vulnerability here

**The state folder is readable by your own user account.** By design: the worker has to
read it. It is a credential store on a single-user desktop, not a vault. Anyone who can
read your files can already control your devices — the folder is kept outside the
repository so it is never committed, not so it is secret from you.

**Device local keys are stored in plain text.** They arrive from the account and have to be
usable without a passphrase prompt on every keypress. Encrypting them under a key kept
beside them on the same disk would be theatre.

**The plugin listens on a local WebSocket.** That is the Stream Deck SDK's own protocol,
on `127.0.0.1`, established by Elgato's software — not something this plugin opens.

**Devices are commanded over a protocol with known weaknesses.** The AES scheme, the
key distribution and the discovery broadcast are the vendor's, shared by every Tuya
device on the market. Weaknesses there are worth reporting upstream to
[tinytuya](https://github.com/jasonacox/tinytuya) or the vendor; this plugin cannot
fix them.

**Pairing uses the app identity of Home Assistant's Tuya integration.** Documented in
[LIMITS.md](LIMITS.md#pairing-relies-on-home-assistants-app-identity). It is not a
vulnerability.

## Supported versions

The latest commit on `main`. There are no release branches and no backports.

## What the plugin does with your data

Nothing leaves your machine except to your own devices and to the account service your
phone app already talks to. No telemetry, no analytics, no crash reporting, no update
check. The full account is in [PRIVACY.md](PRIVACY.md).
