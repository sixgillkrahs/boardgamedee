# 03: Room & Seat Lobby Lifecycle with Real-Time SSE Stream

**What to build:** Enable Actors to create a `Room` with a 6-character code, join via code or URL, automatically claim and reconnect to `Seats`, transfer `Host` authority if the `Host` leaves in the lobby, configure `Game Cartridge` settings with live validation, and receive real-time lobby state updates over Server-Sent Events (`/api/rooms/[code]/stream`).

**Blocked by:** 01, 02

**Status:** resolved

- [x] PostgreSQL schema defines `rooms` and `seats` with unique constraints on `(roomId, seatNo)` and `(roomId, actorId)`.
- [x] Actors can create a `Room` for a chosen `Game Cartridge` and join an existing `Room` by its 6-character code.
- [x] Joining a `Room` claims a `Seat` (or reconnects to the Actor's existing `Seat`) and broadcasts updates over SSE.
- [x] Leaving the lobby vacates the `Seat` and transfers `Host` authority to the lowest occupied `Seat` if the `Host` leaves.
- [x] `Host` can edit `Werewolf Cartridge` configuration (role counts, phase timers, `revealRoleOnDeath`) with live validation feedback.
