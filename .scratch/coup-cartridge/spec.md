# Coup: Đảo Chính (Coup Cartridge) Specification

Status: ready-for-agent

## Problem Statement

To prove and utilize the multi-board-game platform's `Platform Core` + `Game Cartridge` architecture, players need a second complete, real-time hidden-information tabletop game—**Coup: Đảo Chính** (for 3–6 players)—rendered entirely on the 2D `<canvas>` (including 2D vector character cards, 2D gold coins, card-dealing animations, and interactive Challenge/Block/Exchange flows) without modifying any PostgreSQL tables or SSE transport infrastructure.

## Solution

We will implement and register `coupCartridge` (`cartridgeId: "coup"`, `minSeats: 3`, `maxSeats: 6`) adhering to the shared `GameCartridge` interface, paired with a dedicated 2D `<canvas>` renderer (`CoupCanvas` and `src/canvas/coup-cards.ts`) that draws all 5 Character cards (`Duke`, `Assassin`, `Captain`, `Ambassador`, `Contessa`), the `Court Deck`, embossed 2D gold `Coins` in the `Treasury` and at each `Seat`, and interactive 2D canvas hit-targets for actions, reactions (`Challenge` / `Block` / `Pass`), `LoseInfluenceStep` card selection, and `Ambassador` `ExchangePickStep` card selection.

## User Stories

1. As an `Actor` on the Home page, I want to click the **Coup: Đảo Chính (3–6 người chơi)** card to create a new Coup `Room`, so that I can host a Coup match immediately.
2. As the `Host` of a Coup `Room`, I want to add friends or AI Bots (3 to 6 seats) and start the `Match`, so that each `Seat` is dealt 2 face-down `Influence` cards from the 15-card `Court Deck` and 2 gold `Coins` from the `Treasury`.
3. As a seated `Actor` in a Coup `Match`, I want `projectView` on the server to reveal my own live `Influence` cards (and my temporary drawn cards during an `Ambassador` exchange) while masking all other players' unrevealed `Influence` cards and the `Court Deck`, so that hidden information cannot be leaked over the network.
4. As the active turn `Seat`, I want to declare `Income` (+1 coin), `Foreign Aid` (+2 coins), `Coup` (-7 coins, targeting a living `Seat`), `Tax` (`Duke`, +3 coins), `Assassinate` (`Assassin`, -3 coins, targeting a living `Seat`), `Steal` (`Captain`, targeting a living `Seat` with coins), or `Exchange` (`Ambassador`, draw 2 from `Court Deck`), so that I can execute my turn strategy.
5. As the active turn `Seat` holding 10 or more `Coins` at the start of my turn, I want the rule engine to require me to perform a `Coup` (-7 coins), so that the canonical 10-coin Coup rule is enforced.
6. As a non-acting living `Seat` during `ReactionWindowStep`, I want to either `Pass`, `Challenge` a character action (`Tax`, `Assassinate`, `Steal`, `Exchange`), or `Block` (`Duke` blocks `Foreign Aid`; target claims `Contessa` to block `Assassinate`; target claims `Captain` or `Ambassador` to block `Steal`), so that bluffing and counter-play work in real time.
7. As a living `Seat` during `BlockChallengeStep` (after someone declares a `Block`), I want to either `Challenge` the blocker or `Pass` (accepting the block), so that false blocks can be punished.
8. As a `Seat` that wins a `Challenge` (because I genuinely held the claimed `Character`), I want my revealed card to be automatically shuffled back into the `Court Deck` and replaced with a newly drawn card while the challenger enters `LoseInfluenceStep`, so that my remaining hand stays secret.
9. As a `Seat` that loses a `Challenge` or is hit by `Coup` or `Assassinate`, I want to select which of my live `Influence` cards to flip face-up in `LoseInfluenceStep` (or have my last remaining card flipped automatically if I only have 1 left), so that I control which identity to sacrifice.
10. As a target of `Assassinate` who wrongly challenges a real `Assassin` (or bluffs `Contessa` and gets caught), I want the rule engine to process both my `Challenge` penalty loss AND the pending `Assassinate` loss in sequence, eliminating both of my `Influence` cards as in canonical Coup rules.
11. As a `Seat` resolving `Ambassador` `Exchange`, I want `ExchangePickStep` to let me inspect my live `Influence` cards plus 2 cards drawn from the `Court Deck` on the 2D `<canvas>` and pick which cards to keep (matching my current live `Influence` count), returning the rest shuffled into the `Court Deck`.
12. As a player viewing the Coup 2D `Canvas Scene`, I want every visual element—the royal tabletop, central `Court Deck`, `Treasury` 2D gold coins, dealing animation, all 5 painted 2D `Character` cards, coin transfer animations, and action/reaction overlays—drawn purely with the HTML5 2D Canvas API.

## Implementation Decisions

- **`CoupCartridge` State Machine (`src/cartridges/coup/index.ts`)**:
  - Characters: `"Duke" | "Assassin" | "Captain" | "Ambassador" | "Contessa"` (3 copies each = 15 cards in `Court Deck`).
  - Steps:
    - `"TurnActionStep"`: Active seat declares an action (`INCOME`, `FOREIGN_AID`, `COUP`, `TAX`, `ASSASSINATE`, `STEAL`, `EXCHANGE`).
    - `"ReactionWindowStep"`: Opened for challengeable/blockable actions (`FOREIGN_AID`, `TAX`, `ASSASSINATE`, `STEAL`, `EXCHANGE`). Tracks `passedSeatNos`. Advances when all eligible reactors pass or timer expires, or branches immediately on `CHALLENGE` or `BLOCK`.
    - `"BlockChallengeStep"`: Opened when a `Seat` declares a `BLOCK` (`claimingCharacter`). Tracks `passedSeatNos`. Advances to cancel the action if all pass/timeout, or resolves a `CHALLENGE` against the blocker.
    - `"LoseInfluenceStep"`: Queues one or more pending influence losses (`pendingLosses: { seatNo: number; reasonVi: string }[]`) followed by a `afterLossContinuation` (`"NEXT_TURN" | "EXECUTE_PENDING_ACTION"`). If a seat in `pendingLosses` has only 1 alive card left, it auto-reveals immediately!
    - `"ExchangePickStep"`: Active seat holds `exchangePool: CoupCharacter[]` (current alive cards + 2 drawn cards) and submits `EXCHANGE_KEEP` with the indices of cards to keep (`keepCount === aliveCardsCount`).
    - `"Finished"`: Reached when only 1 seat has `cards.some(c => !c.revealed)`.

## Testing Decisions

- **Seam 1 (`GameCartridge` Interface for `coupCartridge`)**:
  - Pure TDD unit tests in `src/cartridges/coup/coup.test.ts` verifying initial 15-card deck distribution, secret masking in `projectView`, mandatory 10-coin `Coup`, `Foreign Aid` block by `Duke`, truthful vs bluff `Challenge` with deck redraw, `Assassin` double-influence kill on failed challenge or failed `Contessa` block bluff, `Captain` steal + block, `Ambassador` 2-card draw & exchange, and victory detection.
