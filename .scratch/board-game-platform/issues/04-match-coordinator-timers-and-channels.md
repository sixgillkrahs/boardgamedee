# 04: Match Coordinator, Server-Authoritative Phase Timer, and Gated Channel Chat

**What to build:** Coordinate the full `Match` lifecycle inside a `Room` using versioned `JSONB` state and `match_events` in PostgreSQL, process player commands with optimistic locking, enforce dynamic `Channel` read/write permissions (`Village`, `Werewolf`, `Graveyard`), automatically trigger `Phase Timer` fallback transitions on expiration, and support in-room Rematch.

**Blocked by:** 01, 03

**Status:** resolved

- [x] PostgreSQL schema defines `matches`, `match_events`, and `channel_messages`.
- [x] `Host` can start a `Match` when the `Game Cartridge` configuration is valid for the occupied `Seats` (and can also add fill bots in dev/solo testing mode or play with multiple connected devices).
- [x] Each connected `Seat` receives only its own `Player View` and permitted `Channel` messages over the SSE stream.
- [x] Submitting a command updates `matches.state` with optimistic concurrency (`version`), appends `match_events`, and broadcasts updated `Player Views`.
- [x] `Channel` message submission enforces `resolveChannels` write permissions for `Village`, `Werewolf`, and `Graveyard`.
- [x] Expired `Phase Timers` automatically invoke `onPhaseTimeout` on the server and advance the `Match`.
- [x] `Host` can trigger a Rematch / Return to Lobby inside the same `Room` after a `Match` finishes.
