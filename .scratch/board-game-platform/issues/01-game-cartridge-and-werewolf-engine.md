# 01: Game Cartridge Contract & Werewolf Cartridge Pure State Machine

**What to build:** Define the game-agnostic `GameCartridge` interface at the seam between `Platform Core` and individual board games, configure the Vitest test runner, and implement the complete `Werewolf Cartridge` pure state machine (`Werewolf`, `Villager`, `Seer`, `Bodyguard`, `Witch`, `Hunter`) with server-side `Player View` projection and dynamic `Channel` permission resolution.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Vitest is configured and runs via `npm test`.
- [x] `GameCartridge` contract and registry support registering and retrieving board game cartridges by `cartridgeId`.
- [x] `Werewolf Cartridge` validates configuration against occupied `Seat` count and distributes all 6 `Roles` (`Werewolf`, `Villager`, `Seer`, `Bodyguard`, `Witch`, `Hunter`).
- [x] `NightActionStep` handles simultaneous `Werewolf` target votes, `Bodyguard` protection (disallowing consecutive protection of the same `Seat`), and `Seer` alignment inspection.
- [x] `WitchStep` exposes the pack's pending victim while the Heal potion is available and allows single-use Heal (including self-heal) and/or single-use Poison in the same night.
- [x] Dawn resolution keeps a `Werewolf` victim alive if protected by `Bodyguard` OR healed by `Witch`, while always killing a `Witch` poison target.
- [x] `HunterRevengeStep` triggers whenever a `Hunter` dies from any cause (night bite, poison, or day execution) before win conditions are evaluated.
- [x] `DayDiscussionStep` and `DayVotingStep` support ready-to-vote, execution voting, `Abstain`, and no-execution on ties or `Abstain` plurality.
- [x] `projectView` strips all other players' secret `Roles` and night actions while exposing teammates to living/dead `Werewolves`, inspection results to `Seer`, and full roles when the `Match` finishes or when `revealRoleOnDeath` is active for dead seats.
- [x] `resolveChannels` dynamically grants read/write access to `Village`, `Werewolf`, and `Graveyard` `Channels` based on phase, role, and alive status.
