# Multi-Board-Game Platform (Werewolf & Beyond)

A real-time, multi-device board game platform where the system acts as an automated Game Master, designed to host hidden-information social deduction and tabletop games starting with Werewolf.

## Language

### Platform Core

**Platform Core**:
The game-agnostic foundation that manages identity, rooms, seats, match lifecycle, timers, gated chat channels, shared 2D canvas rendering primitives, and real-time synchronization across devices.
_Avoid_: Base app, lobby service, framework, wrapper

**Game Cartridge**:
A self-contained board game specification (such as Werewolf) that defines a game's rules, hidden-information projection, channel visibility rules, and canvas board scene.
_Avoid_: Game plugin, game module, ruleset, mini-game

**Canvas Scene**:
The interactive HTML5 2D `<canvas>` viewport rendered by a Game Cartridge to display the game board, seats, animations, particles, and direct pointer/touch targets at 60fps.
_Avoid_: Board component, game view, stage

**HUD Overlay**:
The thin HTML layer positioned around or over the Canvas Scene that handles IME-dependent Vietnamese text input (such as Channel chat and Room codes) and platform navigation controls.
_Avoid_: Sidebar, chrome, UI wrapper

**Actor**:
A person using the platform, represented by a unified identity that begins as a Guest or a Google-authenticated user and can be upgraded from Guest to Google in-place.
_Avoid_: Visitor, client, account, member

**Room**:
A virtual table identified by a short join code where Actors gather, occupy Seats, configure a Game Cartridge, and play one or more consecutive Matches.
_Avoid_: Lobby, table, party, game session

**Host**:
The Actor in a Room who holds authority to choose the Game Cartridge, configure Match settings, start a Match, or initiate a rematch.
_Avoid_: Room owner, admin, moderator, creator

**Seat**:
A numbered participant slot within a Room held by an Actor, binding their identity to an in-game participant across device reconnections.
_Avoid_: Slot, chair, position, player slot

**Match**:
A single play-through of a Game Cartridge inside a Room, running from initial setup and role assignment to victory resolution.
_Avoid_: Game instance, session, round, play

**Match Event**:
An immutable record of a domain transition emitted by a Game Cartridge during a Match, ordered sequentially to form the match history and log.
_Avoid_: Log entry, audit row, action log

**Player View**:
A filtered projection of a Match's state scoped to a single Seat, containing only public facts and the secret information that Seat is entitled to know.
_Avoid_: Client state, masked state, public state

**Channel**:
A text communication stream inside a Match whose read and write access for each Seat is dynamically controlled by the active Game Cartridge state.
_Avoid_: Chat room, thread, message feed

**Phase Timer**:
A server-authoritative deadline on the active Match step that automatically triggers the cartridge's default fallback action when time expires.
_Avoid_: Countdown, timeout, clock

### Werewolf Cartridge

**Faction**:
An alignment group in Werewolf that shares a collective win condition—either the **Village Faction** or the **Werewolf Faction**.
_Avoid_: Team, side, camp, alliance

**Role**:
The secret character identity assigned to a Seat for a Werewolf Match (`Werewolf`, `Villager`, `Seer`, `Bodyguard`, `Witch`, `Hunter`), determining Faction and special abilities.
_Avoid_: Card, class, character, job

**Cycle**:
A numbered full rotation of a Werewolf Match consisting of a **Night Phase** followed by a **Day Phase**.
_Avoid_: Round, turn

**Night Phase**:
The hidden-action portion of a Cycle split into `NightActionStep` (simultaneous Werewolf target selection, Bodyguard protection, and Seer inspection) followed by `WitchStep` (Witch heal and/or poison decision).
_Avoid_: Dark turn, night round

**Day Phase**:
The public portion of a Cycle split into `DayDiscussionStep` (open Village Channel debate after dawn deaths are announced) followed by `DayVotingStep` (public execution vote or `Abstain`).
_Avoid_: Light turn, day round

**HunterRevengeStep**:
An interrupt step triggered immediately whenever a Seat holding the `Hunter` Role dies from any cause, allowing that Seat to shoot one living Seat before play proceeds.
_Avoid_: Hunter passive, death trigger, last shot

**Abstain**:
An explicit vote choice during `DayVotingStep` (or the automatic fallback when the Phase Timer expires) indicating that no Seat should be executed.
_Avoid_: Skip vote, blank vote, pass

### Coup Cartridge

**Character**:
One of the five royal court identities in Coup (`Duke`, `Assassin`, `Captain`, `Ambassador`, `Contessa`), each granting specific active powers and counter-actions.
_Avoid_: Role, hero, class, job

**Influence**:
A player's political standing in a Coup Match, represented by their two dealt Character cards; a Seat is eliminated when both of its Influence cards are revealed face-up.
_Avoid_: Life, health, HP, hand

**Court Deck**:
The central draw pile of remaining un-dealt Character cards used for Ambassador exchanges and redrawing after a successfully defended Challenge.
_Avoid_: Draw pile, stock, library

**Treasury**:
The central bank of unlimited gold Coins from which Income, Foreign Aid, and Tax are drawn and to which Coup and Assassinate costs are paid.
_Avoid_: Bank, pot, pool

**Challenge**:
A declaration by any living Seat accusing the acting or blocking Seat of not actually holding the Character card they claimed; whoever is wrong immediately loses one Influence.
_Avoid_: Call bluff, doubt, accuse

**Block**:
A counter-claim by a Seat declaring they hold a specific Character (`Duke`, `Contessa`, `Captain`, or `Ambassador`) to prevent `Foreign Aid`, `Assassinate`, or `Steal`.
_Avoid_: Counter, cancel, shield
