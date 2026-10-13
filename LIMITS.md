*Language: **English** · [Português](LIMITS.pt-BR.md)*

# Limits, and things that will bite you

Written to save you the debugging. Everything here is known, reproduced, and either
unsolved or unsolvable.

## Blocking issue for a store release

**The QR pairing uses an application identity that is not ours.** The `client_id` and `schema`
in `worker/tuacasa.py` belong to the **Home Assistant** project, which registered them with the
device vendor. Their code is open source; that identity is not a license, it is an operational
credential.

What that means in practice:

- Users of this plugin authenticate as if they were Home Assistant.
- The vendor can revoke it at any moment, breaking every install at once.
- Shipping it in a paid or store-distributed product is borrowing someone else's identity.

For an open-source repository this is common practice among community tools, and it is
disclosed here rather than hidden. **For a Marketplace submission it must be replaced** with a
credential registered for this plugin.

## What does not work, and why

**Devices that reject the local key.** Some devices answer on port 6668, are correctly
identified, and still refuse the key the account hands out — error `914`. Re-pairing the device
in the phone app and rescanning usually fixes it. When it does not, and the device is online,
the plugin falls back to the cloud path automatically.

**Devices that announce an unreachable address.** A device can broadcast an IP that does not
answer ARP or ping — the packet never leaves the machine. This is a network topology problem
(often a mesh node bridging broadcast but not unicast), not something the plugin can work
around. Such devices are unusable locally and, if online, are driven through the cloud.

**Devices that declare no local support.** Locks and some infrared bridges report
`supportsLocal: false`. The vendor does not allow local control on them, by design. Nothing to
do.

**Sub-devices behind a gateway.** Zigbee and Bluetooth devices reach the network through a
gateway, not on their own. They are listed only when the account reports them online, and they
always go through the cloud path.

**Colour and brightness are not implemented.** The data model is read and stored, but no action
exposes them yet. Only on/off and blind position are wired up.

## Things that cost time to discover

**The session token lasts two hours and the refresh token is single use.** The SDK renews it
on its own, but only tells a listener — a renewal that is not written to disk breaks the chain,
and the next start replays a spent token for an unhelpful `sign invalid`. Two processes holding
the same session also race to renew and burn each other's token, so run one worker at a time:
the diagnostics in `tools/probe.py` deliberately never touch the cloud session.

**The refresh token also expires when nobody uses it.** The worker can only keep the session
alive while it runs. Measured on a real install: the session came back after 15 hours with the
computer off, and was dead after 46 — the refresh endpoint answers `1010 token is expired`,
which the SDK swallows, so the log shows the `sign invalid` of the next call instead. There is
no recovering it. LAN keys keep working; cloud keys and app scenes show *reconnect* under a
warning mark, and the panel asks for the QR again without touching the inventory.

**A Stream Deck action never exposes its settings synchronously.** `Action` offers only
`getSettings()`, a promise — there is no `.settings` property, whatever an editor's `any` cast
lets you write. Anything that repaints outside an event (a device pushing a new state, for
instance) must therefore keep its own copy of the settings, or it silently paints nothing and
the key freezes on the picture it had when it appeared. That failure looks exactly like a
device that never answers.

**Nothing in the plugin can measure text.** QtSvg rasterises elsewhere, so the line wrap
estimates glyph widths as a fraction of the font size, per family. The table errs wide on
purpose: breaking a line early is a blemish, running off the key is a lost word.

**One TCP connection per device, ever.** The worker holds it. Your phone app keeps working
because it goes through the cloud, but another local controller (Home Assistant, for instance)
will fight for the same channel.

**A stale local key looks exactly like a wrong IP, which looks exactly like a wrong protocol
version** — all three produce a timeout. Use the error code to tell them apart: `914` means the
TCP handshake succeeded and the *key* was rejected; `901` and `905` are network failures.

**Device ids embed the MAC address.** An id ending in `a4b1c2d3e4f5` is the device at
`a4:b1:c2:d3:e4:f5`. Cross-referencing with `arp -a` identifies a device you cannot authenticate
against.

**Re-pairing a device invalidates its local key.** Press *Rescan network* afterwards.

**Windows console encoding will kill the worker if you are not careful.** `tinytuya` imports
`colorama`, which wraps stdout and raises on any accented character — a device named `Café` is
enough. Every entry point here calls `colorama.deinit()` and forces UTF-8 right after importing
it.

**Never let `receive()` run with the command timeout.** It waits for a whole packet, so a
fragmented one pins the thread and user clicks sit in the queue until it gives up. The worker
drops the socket timeout to 0.4s just for that read.

## Platform

Windows only for now. Nothing in the design is Windows-specific except the Python launcher
choice and the state directory, but nothing has been tested elsewhere.
