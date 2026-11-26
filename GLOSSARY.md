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

### Heat Cartridge

**Gear**:
A race car's active transmission setting (`1` through `4`), determining the exact number of cards a Seat must play face-down during the simultaneous planning step and the base Cooldown available in the React step.
_Avoid_: Speed level, tier, dice count

**Engine Spot**:
The dedicated reserve on a driver's mat holding available **Heat** cards that can be spent to shift two gears at once, Boost, or cross a **Corner Line** above its speed limit.
_Avoid_: Mana pool, energy bank, fuel tank

**Cooldown**:
An ability during the React step (granted by 1st Gear, 2nd Gear, or Adrenaline) that transfers a **Heat** card out of the driver's hand back into their **Engine Spot**.
_Avoid_: Vent, heal, discard heat

**Slipstream**:
An optional +2 space movement bonus triggered when a car ends its move alongside or immediately behind another car, without increasing the car's speed for **Corner Line** checks.
_Avoid_: Draft, tow, free boost

**Spin Out**:
The penalty suffered when a car crosses a **Corner Line** above the speed limit without enough **Heat** in its **Engine Spot** to pay the difference, forcing the car back before the corner, resetting its **Gear** to `1`, and adding penalty **Stress** cards to the driver's hand.
_Avoid_: Crash, bust, elimination

### Imploding Kittens Cartridge

**Imploding Kitten**:
The two-stage singularity bomb card that, when drawn face-down for the first time, is secretly reinserted into the Draw Pile **face-up**, and when subsequently drawn while face-up, immediately eliminates the drawer bypassing any **Defuse** or **Streaking Kitten**.
_Avoid_: Black cat, super bomb, second bomb

**Streaking Kitten**:
A passive expansion card that allows a Seat to safely hold one **Exploding Kitten** in their hand without exploding for as long as the **Streaking Kitten** remains in their hand.
_Avoid_: Shield card, second defuse, bomb holder

### Sky Team Cartridge

**Pilot / Co-pilot**:
The two asymmetric cooperative roles in a Sky Team Match—the **Pilot** (Blue dice; controls Landing Gear, Brakes, 1 Radio, left Axis/Engine) and the **Co-pilot** (Orange dice; controls Flaps, 2 Radios, right Axis/Engine).
_Avoid_: Driver, captain, player 1/2

**Radio Silence**:
The communication restriction enforced during `PlacementStep` after dice are rolled, locking the Cockpit Channel to read-only until all 8 dice are placed and the round descends.
_Avoid_: Mute phase, quiet turn, chat ban

**Approach Track**:
The sequence of airspace sectors leading to the destination Airport runway, populated with airplane traffic tokens that must be cleared via Radio before advancing past them.
_Avoid_: Runway map, flight path, distance bar

**Axis**:
The aircraft's roll/tilt state (`-2` to `+2`, with `0` being level) updated whenever both Axis dice are placed; reaching `±3` causes an immediate crash, and it must be `0` to land safely at `0 ft`.
_Avoid_: Balance meter, tilt bar, wing angle

### Carcassonne Cartridge

**Land Tile**:
A square medieval terrain tile (72 base tiles + optional 12 River tiles) with matching cardinal edges (`city`, `road`, `field`, `river`), optional Coat of Arms Pennants, Monasteries, and C3 Flower Gardens.
_Avoid_: Card, square, map piece

**Meeple**:
A player's wooden follower (7 standard Meeples per Seat) deployed onto a newly placed Land Tile as a **Knight** (city), **Highwayman** (road), **Monk** (monastery), or lying-down **Farmer** (field) to claim majority scoring.
_Avoid_: Pawn, token, worker

**Abbot**:
The special C3 follower (1 per Seat) that may be placed in a **Monastery** or **Flower Garden** and optionally recalled early during `PlaceMeepleStep` to immediately score 1–9 points based on surrounding tiles.
_Avoid_: Priest, bishop, super meeple

### One Night Ultimate Werewolf Cartridge

**Center Cards**:
The three face-down role cards placed in the middle of the table during every One Night Ultimate Werewolf Match (`seatCount + 3` cards total), which may be peeked or swapped during the single Night Phase.
_Avoid_: Middle pile, extra deck, leftover cards

**Wake Order**:
The fixed Bezier Games sequence (`Doppelgänger` → `Werewolf` → `Minion` → `Mason` → `Seer` → `Robber` → `Troublemaker` → `Drunk` → `Insomniac`) in which roles present in the Match's card set wake during `NightStep`.
_Avoid_: Turn order, night script, call list

**Lone Wolf**:
A single `Werewolf` Seat on the table (when the second `Werewolf` card is among the **Center Cards**) who is permitted to peek at one Center Card during the Werewolf night phase.
_Avoid_: Solo wolf, alpha wolf


