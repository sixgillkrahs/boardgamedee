# Multi-Board-Game Platform & Werewolf Cartridge Specification

Status: ready-for-agent

## Problem Statement

Groups of friends who want to play hidden-information social deduction and tabletop board games (starting with Werewolf / Ma Sói) either need one person to sacrifice their seat to act as a human moderator or must use rigid single-game apps that require tedious account sign-ups, leak hidden role information, stall when a player disconnects, and cannot be extended to host other board games.

## Solution

We will build a real-time, multi-device board game platform on Next.js and PostgreSQL with an automated Game Master and an interactive HTML5 2D `<canvas>` board renderer (`Canvas Scene`) paired with a Vietnamese-friendly HTML `HUD Overlay`. The architecture separates a game-agnostic **Platform Core** (unified Guest/Google `Actor` identity, `Room` and `Seat` management, versioned `JSONB` `Match` persistence, server-authoritative `Phase Timer`, gated `Channel` chat, and Server-Sent Events real-time synchronization) from pluggable **Game Cartridges**. The inaugural **Werewolf Cartridge** implements the 6 classic Roles (`Werewolf`, `Villager`, `Seer`, `Bodyguard`, `Witch`, `Hunter`), strict server-side `Player View` secret projection, and an animated 60fps `Canvas Scene` depicting the village table across `Night Phase`, `Day Phase`, and `HunterRevengeStep`.

## User Stories

1. As a new visitor, I want to enter a display nickname and play immediately as a Guest `Actor`, so that I can join my friends' game in seconds without registration friction.
2. As a Guest `Actor`, I want to sign in with my Google account at any time and have my existing Guest profile upgraded in-place, so that I keep my current `Seat` and match history.
3. As a returning `Actor` with a Google account, I want to sign in via Google OAuth, so that my identity persists across devices and browsers.
4. As an `Actor` on the home screen, I want to browse the catalog of available `Game Cartridges` (with Werewolf active and upcoming board games previewed), so that I can choose which board game to host.
5. As an `Actor`, I want to create a new `Room` for a selected `Game Cartridge` and receive a short alphanumeric `Room` code and shareable link, so that I can invite friends easily.
6. As an `Actor`, I want to join an existing `Room` by entering its short code or opening its invite link, so that I can sit at the virtual table with my group.
7. As an `Actor` joining a `Room`, I want to automatically claim an available `Seat` (or reclaim my previous `Seat` if I reconnect), so that my position at the table is preserved.
8. As an `Actor` whose browser refreshes or temporarily loses network connectivity during a `Match`, I want my device to automatically reconnect to the SSE stream and restore my exact `Seat` and `Player View`, so that I can continue playing seamlessly.
9. As the `Host` of a `Room`, I want to configure the `Game Cartridge` settings before a `Match` starts (such as the count of each `Role`, `Phase Timer` durations, and `revealRoleOnDeath`), so that we can tailor the game to our group size and preferences.
10. As the `Host` of a `Room`, I want the system to validate that the total configured `Role` count matches the number of occupied `Seats` and includes at least one `Werewolf` and enough villagers before allowing the `Match` to start, so that we never launch an invalid game.
11. As an `Actor` in a `Room`, I want `Host` authority to automatically transfer to another occupied `Seat` if the current `Host` leaves the `Room` while in the lobby, so that the table does not become orphaned.
12. As the `Host`, I want to start the `Match` once enough `Seats` are occupied, so that the system deals `Roles` and transitions everyone into `Cycle` 1 (`Night Phase`).
13. As a seated `Actor` in a `Match`, I want to receive only my own `Player View` from the server with other players' secret `Roles` and private night actions stripped out, so that no one can cheat by inspecting network payloads.
14. As a seated `Actor`, I want to see the interactive game board rendered on an HTML5 2D `Canvas Scene` with smooth Day/Night lighting transitions, campfire/moonlight particles, circular `Seat` portraits, and an animated central `Phase Timer`, so that the game feels alive and immersive.
15. As a seated `Actor`, I want to tap or click on my secret `Role` card on the `Canvas Scene` (press-and-hold or toggle) to inspect my `Role` and `Faction` privately, so that people sitting near me physically cannot easily peek at my screen.
16. As a `Seat` assigned the `Werewolf` `Role`, I want to see who my fellow `Werewolf` teammates are during the `Night Phase` (`NightActionStep`), communicate with them in the private `Werewolf` `Channel`, and click a living target `Seat` on the `Canvas Scene` to vote on whom to attack, so that the pack can coordinate a kill.
17. As a `Seat` assigned the `Seer` `Role`, I want to select one living `Seat` on the `Canvas Scene` during `NightActionStep` and immediately learn whether that `Seat` belongs to the `Werewolf Faction` or `Village Faction`, so that I can gather intelligence for the village.
18. As a `Seat` assigned the `Bodyguard` `Role`, I want to select one living `Seat` on the `Canvas Scene` during `NightActionStep` to protect from a `Werewolf` attack—with the rule machine preventing me from protecting the exact same `Seat` on two consecutive nights—so that I can defend key villagers.
19. As a `Seat` in `NightActionStep`, I want the step to advance automatically as soon as all active roles (`Werewolf`, `Seer`, `Bodyguard`) have locked in their choices or when the `Phase Timer` expires, so that the night moves briskly.
20. As a `Seat` assigned the `Witch` `Role`, I want `WitchStep` to begin after `NightActionStep` resolves the pack's target, showing me which `Seat` is about to die from the `Werewolf` bite (if my Heal potion is still unused) and allowing me to use my single-use Heal potion (including on myself) and/or my single-use Poison potion on any living `Seat`, so that I can save a life or eliminate a suspect.
21. As a `Seat` in a `Match` that includes a `Witch`, I want dawn resolution to keep the `Werewolf` victim alive if they were protected by the `Bodyguard` OR healed by the `Witch`, while always killing any target hit by the `Witch`'s Poison potion regardless of `Bodyguard` protection, so that night interactions follow canonical Werewolf rules.
22. As a `Seat` assigned the `Hunter` `Role`, I want `HunterRevengeStep` to trigger immediately whenever I die from any cause (night `Werewolf` attack, `Witch` poison, or day execution), giving me a timed window on the `Canvas Scene` to shoot one living `Seat` (or skip shooting), so that my death carries tactical consequence.
23. As a seated `Actor`, I want to see a clear dawn announcement on the `Canvas Scene` and in the `Match Event` log showing which `Seats` died overnight (and their `Role` if `revealRoleOnDeath` is enabled), so that the village can analyze what happened.
24. As a living `Seat` during `DayDiscussionStep`, I want to discuss suspicions in the public `Village` `Channel` using the HTML `HUD Overlay` with full Vietnamese IME support and optionally click "Ready to Vote", so that we can debate and move to voting when ready.
25. As a living `Seat` during `DayVotingStep`, I want to click a living `Seat` on the `Canvas Scene` to vote for their execution or choose `Abstain`, and see real-time vote indicators on the `Canvas Scene`, so that the village can conduct a transparent trial.
26. As a seated `Actor` at the end of `DayVotingStep`, I want the `Seat` with the strict plurality of votes to be executed, while a tie for top votes or a top vote for `Abstain` results in no execution, so that ties are resolved cleanly without endless runoff loops.
27. As an eliminated (dead) `Seat`, I want my `Seat` on the `Canvas Scene` to show a gravestone state, lose write access to the `Village` and `Werewolf` `Channels`, and gain read/write access to the `Graveyard` `Channel`, so that dead players cannot influence living players but stay entertained talking with other ghosts.
28. As a seated `Actor` when any `Phase Timer` reaches zero, I want the server to automatically apply the `Game Cartridge`'s default fallback action (such as `Abstain` or skipping an unsubmitted night action) and advance the `Match`, so that an AFK or disconnected player never freezes the game.
29. As a seated `Actor`, I want the `Match` to conclude immediately after any death resolution (including after `HunterRevengeStep` finishes) as soon as `aliveWerewolves === 0` (`Village Faction` victory) or `aliveWerewolves >= aliveVillagers` (`Werewolf Faction` victory), displaying a celebratory end-of-match screen on the `Canvas Scene` with the full `Role` reveal and `Match Event` timeline, so that everyone sees who won and how the game unfolded.
30. As the `Host` after a `Match` concludes, I want to click "Rematch / Play Again" inside the same `Room`, so that everyone at the table can start a fresh `Match` immediately without sharing a new `Room` code.
31. As a platform developer adding a second board game in the future, I want to register a new `Game Cartridge` module implementing the standard cartridge interface and `Canvas Scene` renderer without altering any PostgreSQL table or `Platform Core` room/transport logic, so that the platform scales to multiple board games effortlessly.

## Implementation Decisions

### 1. Strict Seam Between `Platform Core` and `Game Cartridge`
- **Cartridge Registry & Contract**: Every board game registers a `GameCartridge<TConfig, TState, TCommand, TPlayerView, TPublicEvent>` object under a unique `cartridgeId` (starting with `"werewolf"`).
- **Pure State Machine Interface**:
  - `defaultConfig(seatCount: number): TConfig`
  - `validateConfig(config: TConfig, seatCount: number): { valid: boolean; error?: string }`
  - `createInitialState(input: { config: TConfig; seats: SeatDescriptor[]; rngSeed?: string }): { state: TState; events: TPublicEvent[]; phaseDeadlineMs: number | null }`
  - `reduce(input: { state: TState; command: TCommand; actorSeatNo: number; nowMs: number }): { state: TState; events: TPublicEvent[]; phaseDeadlineMs: number | null }`
  - `onPhaseTimeout(input: { state: TState; nowMs: number }): { state: TState; events: TPublicEvent[]; phaseDeadlineMs: number | null }`
  - `projectView(input: { state: TState; viewerSeatNo: number | null }): TPlayerView`
  - `resolveChannels(input: { state: TState; viewerSeatNo: number | null }): ChannelPermission[]`
  - `isMatchOver(state: TState): boolean`
- All rule transitions in a `Game Cartridge` are pure, deterministic functions of their inputs. They never import database drivers, HTTP objects, or UI frameworks.

### 2. Unified `Actor` Identity (Guest Mode + Google OAuth Upgrade)
- Every visitor receives an encrypted/signed HTTP-only session cookie identifying their `Actor` record in PostgreSQL.
- **Guest Flow**: Entering a nickname creates or updates an `Actor` row with `isGuest = true` and `googleSub = null`.
- **Google OAuth Flow**: Standard OAuth 2.0 authorization code flow (with a development/local mock toggle when Google client credentials are not configured in `.env`, plus full Google OAuth endpoint support when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set). If the browser session already holds a Guest `Actor`, signing in with Google links the Google identity (`googleSub`, `email`, `avatarUrl`, `isGuest = false`) directly onto that existing `Actor` record (or merges `Seat` ownership) so active `Room` seats and match histories are uninterrupted.

### 3. PostgreSQL Schema (`Platform Core` Persistence)
- `actors`: `id` (UUID PK), `displayName`, `avatarSeed`, `isGuest` (boolean), `googleSub` (unique nullable text), `email` (nullable text), `createdAt`, `updatedAt`.
- `rooms`: `id` (UUID PK), `code` (unique 6-char uppercase code), `hostActorId` (FK to `actors`), `cartridgeId` (text, e.g. `"werewolf"`), `status` (`"lobby" | "in_match" | "closed"`), `config` (`jsonb`), `activeMatchId` (nullable UUID), `createdAt`, `updatedAt`.
- `seats`: `id` (UUID PK), `roomId` (FK to `rooms`), `seatNo` (integer `1..N`), `actorId` (FK to `actors`), `displayName` (snapshot), `connected` (boolean), `lastSeenAt` (timestamp), unique constraint on `(roomId, seatNo)` and `(roomId, actorId)`.
- `matches`: `id` (UUID PK), `roomId` (FK to `rooms`), `cartridgeId` (text), `status` (`"active" | "finished"`), `version` (integer for optimistic concurrency control), `state` (`jsonb`), `phaseDeadlineAt` (nullable timestamp), `winningFaction` (nullable text), `createdAt`, `finishedAt`.
- `match_events`: `id` (bigserial PK), `matchId` (FK to `matches`), `version` (integer), `eventType` (text), `payload` (`jsonb`), `createdAt`.
- `channel_messages`: `id` (bigserial PK), `matchId` (FK to `matches`), `channelId` (text: `"village" | "werewolf" | "graveyard"`), `senderSeatNo` (integer), `senderName` (text), `content` (text), `createdAt`.

### 4. Real-Time SSE Transport & Server-Authoritative `Phase Timer`
- **SSE Endpoint (`/api/rooms/[code]/stream`)**: Authenticates the `Actor`, marks their `Seat` as `connected = true`, immediately emits an initial snapshot containing the room's `Seat` list, the viewer's filtered `Player View`, allowed `Channels` + visible `channel_messages`, and visible `match_events`.
- **In-Process Pub/Sub Event Bus**: When a command, chat message, seat change, or timer expiration commits to PostgreSQL with an incremented `matches.version`, the coordinator publishes a room notification so every connected SSE stream immediately computes and pushes each subscriber's personalized `Player View` and accessible `Channel` messages.
- **Lazy & Heartbeat `Phase Timer` Enforcement**: The server checks `matches.phaseDeadlineAt` both on a 1-second server heartbeat for active rooms and lazily on any incoming request; if `now >= phaseDeadlineAt`, the coordinator invokes `cartridge.onPhaseTimeout` inside an optimistic-concurrency update (`WHERE id = $matchId AND version = $expectedVersion`) so timeout transitions happen reliably even if all players are idle.

### 5. `Werewolf Cartridge` State Machine Rules
- **Roles & Factions**:
  - `Werewolf Faction`: `Werewolf`
  - `Village Faction`: `Villager`, `Seer`, `Bodyguard`, `Witch`, `Hunter`
- **Step State Machine**:
  - `NightActionStep`: Living `Werewolf` seats vote on a victim (ties broken deterministically by earliest leading target or no kill if no werewolf votes); living `Bodyguard` selects one living `Seat` different from their previous night's protected `Seat`; living `Seer` selects one living `Seat` and immediately receives their alignment in their private `Player View`. Advances to `WitchStep` (if a `Witch` exists in the match's role setup) or directly to Dawn Resolution once all living active roles have acted or the `Phase Timer` expires.
  - `WitchStep`: If the `Witch` is alive, they see the pack's targeted `Seat` (while their Heal potion remains available) and may use their single-use Heal potion (including self-heal) and/or single-use Poison potion on any living `Seat`.
  - **Dawn Resolution**: Computes overnight deaths: the `Werewolf` target dies unless protected by `Bodyguard` OR healed by `Witch`; the `Witch` poison target always dies. Applies deaths, checks if a dead `Seat` is the `Hunter` (transitioning to `HunterRevengeStep` with `nextStepAfterHunter = "DayDiscussionStep"`), or checks win conditions and enters `DayDiscussionStep`.
  - `DayDiscussionStep`: Living `Seats` converse in the `Village` `Channel` and may toggle `readyToVote`. When all living `Seats` mark ready or the `Phase Timer` expires, transitions to `DayVotingStep`.
  - `DayVotingStep`: Living `Seats` cast a vote for a living `Seat` or `"abstain"`. When all living `Seats` have voted or the `Phase Timer` expires, tallies votes (unvoted seats count as `"abstain"`). If a single `Seat` has strictly more votes than any other choice (including `"abstain"`), that `Seat` is executed; on a tie or `"abstain"` plurality, no one is executed. If the executed `Seat` is the `Hunter`, transitions to `HunterRevengeStep` with `nextStepAfterHunter = "NightActionStep"` (incrementing `Cycle`); otherwise checks win conditions and starts the next `Cycle`'s `NightActionStep`.
  - `HunterRevengeStep`: The newly dead `Hunter` may shoot one living `Seat` or skip; on timeout, defaults to skip. After resolving the shot, checks win conditions and resumes `nextStepAfterHunter`.
- **Win Condition Evaluation**: Evaluated after every mortality resolution (and only after any triggered `HunterRevengeStep` completes):
  - If `aliveWerewolves === 0` -> `Village Faction` wins (`"village"`).
  - Else if `aliveWerewolves >= aliveVillagers` -> `Werewolf Faction` wins (`"werewolf"`).

### 6. Interactive 2D `Canvas Scene` Engine & HTML `HUD Overlay`
- **Shared 2D Canvas Primitives (`Platform Core`)**:
  - HiDPI-aware canvas controller (`devicePixelRatio` scaling, resize observer, 60fps `requestAnimationFrame` loop).
  - Reusable 2D primitives: smooth color/position interpolation (`lerp`), particle emitter (sparks, embers, fireflies, fog, starlight), circular progress ring for `Phase Timer`, hit-region registry for pointer/touch hover and click dispatch (`HitRegion`).
- **Werewolf `Canvas Scene` Renderer**:
  - Draws a dynamic sky & village clearing backdrop that smoothly transitions between deep midnight blue with moon/fireflies (`Night Phase`), crimson danger pulse (`HunterRevengeStep`), and warm dawn/daylight (`Day Phase`).
  - Renders the central campfire / trial plaza with the animated `Phase Timer` ring and phase banner.
  - Arranges all `Seats` radially around the village plaza with avatar badges, seat numbers, connection status dots, animated target selection beams/crosshairs, live vote counters during `DayVotingStep`, and tombstones/ghost auras for dead `Seats`.
  - Renders an interactive bottom-left/floating Role Card on the canvas that flips open on click/hold to reveal the player's secret `Role` artwork and ability description.
- **HTML `HUD Overlay`**:
  - Floating/docked panel for `Channel` tabs (`Village`, `Werewolf`, `Graveyard`) with native HTML `<input>` for seamless Vietnamese IME text entry, plus the `Match Event` timeline, sound/fullscreen toggles, and `Host` lobby/rematch controls.

## Testing Decisions

- **Philosophy**: Tests must verify observable behavior across module interfaces, never internal implementation details or private helpers.
- **Seam 1 — `GameCartridge` Interface (Pure Unit & Property Tests)**:
  - The entire `Werewolf Cartridge` (and any future `Game Cartridge`) will be tested through its public `GameCartridge` interface (`validateConfig`, `createInitialState`, `reduce`, `onPhaseTimeout`, `projectView`, `resolveChannels`).
  - Tests will cover full multi-cycle games: role distribution invariants, secret masking in `projectView` (verifying a Villager cannot see Werewolf teammates or Seer results, while Werewolves see each other and Seer sees inspected alignments), `Bodyguard` consecutive-target restriction, `Bodyguard` + `Witch` heal overlap, `Witch` self-heal and dual-potion usage, `Witch` poison bypassing `Bodyguard`, `Hunter` revenge trigger on night kill / poison / day execution, `Hunter` shooting the last `Werewolf` to secure a `Village Faction` comeback win, day voting ties and `Abstain` pluralities, and `Phase Timer` fallback behavior.
- **Seam 2 — `Platform Core` Match & Room Coordinator**:
  - Tests will verify `Actor` creation and Guest-to-Google account upgrade preserving `Seat` ownership, `Room` creation and `Seat` claiming/reconnection, optimistic-concurrency `Match` state transitions, `Channel` read/write enforcement (rejecting unauthorized writes such as dead players posting in `Village` or villagers posting in `Werewolf`), and automated `Phase Timer` expiration recovery.

## Out of Scope

- Native WebRTC voice or video chat inside the platform.
- Native mobile apps (iOS/Android wrappers); the web app targets mobile and desktop browsers directly.
- Matchmaking queues with random strangers (players join via `Room` codes/links or a local room browser).
- Custom role deck builders with user-authored script logic.

## Further Notes

- All domain terminology in code, database columns, and tests must strictly follow `GLOSSARY.md`.
- All user-facing text on the `Canvas Scene` and `HUD Overlay` will be presented in natural Vietnamese.
