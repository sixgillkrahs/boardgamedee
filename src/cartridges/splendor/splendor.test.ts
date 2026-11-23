import { describe, expect, it } from "vitest";
import {
  buildOfficialSplendorDecks,
  buildOfficialSplendorNobles,
  computeCardPayment,
  countTokens,
  splendorCartridge,
  type SplendorMatchState,
} from "./index";

function makeSeats(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    seatNo: i + 1,
    actorId: `actor-${i + 1}`,
    displayName: `Player ${i + 1}`,
  }));
}

describe("Splendor Cartridge - Official Rules State Machine", () => {
  it("builds 90 official development cards (40/30/20) and 10 nobles, and configures token supply per player count", () => {
    const decks = buildOfficialSplendorDecks();
    expect(decks[1].length).toBe(40);
    expect(decks[2].length).toBe(30);
    expect(decks[3].length).toBe(20);
    expect(buildOfficialSplendorNobles().length).toBe(10);

    for (const [count, expectedGems, expectedNobles] of [
      [2, 4, 3],
      [3, 5, 4],
      [4, 7, 5],
    ] as const) {
      const init = splendorCartridge.createInitialState({
        config: splendorCartridge.defaultConfig(count),
        seats: makeSeats(count),
        nowMs: 1000,
      });
      expect(init.state.supply.white).toBe(expectedGems);
      expect(init.state.supply.blue).toBe(expectedGems);
      expect(init.state.supply.green).toBe(expectedGems);
      expect(init.state.supply.red).toBe(expectedGems);
      expect(init.state.supply.black).toBe(expectedGems);
      expect(init.state.supply.gold).toBe(5);
      expect(init.state.nobles.length).toBe(expectedNobles);
      expect(init.state.market[1].filter(Boolean).length).toBe(4);
      expect(init.state.market[2].filter(Boolean).length).toBe(4);
      expect(init.state.market[3].filter(Boolean).length).toBe(4);
    }
  });

  it("enforces gem taking rules (3 distinct vs 2 same requiring >= 4 in supply) and 10-token discard limit", () => {
    const init = splendorCartridge.createInitialState({
      config: splendorCartridge.defaultConfig(2),
      seats: makeSeats(2),
      nowMs: 1000,
    });
    let state = init.state;

    // Seat 1 takes 2 white (supply has 4 -> allowed, drops supply to 2)
    state = splendorCartridge.reduce({
      state,
      actorSeatNo: 1,
      command: { type: "TAKE_GEMS", gems: ["white", "white"] },
      nowMs: 2000,
    }).state;
    expect(state.supply.white).toBe(2);
    expect(state.seats[0].tokens.white).toBe(2);
    expect(state.activeSeatNo).toBe(2);

    // Seat 2 tries to take 2 white when supply only has 2 -> must throw!
    expect(() =>
      splendorCartridge.reduce({
        state,
        actorSeatNo: 2,
        command: { type: "TAKE_GEMS", gems: ["white", "white"] },
        nowMs: 3000,
      })
    ).toThrow();

    // Give Seat 2 9 tokens and take 3 distinct -> enters DiscardTokensStep (12 tokens -> must return 2)
    state = {
      ...state,
      seats: state.seats.map((s) =>
        s.seatNo === 2
          ? {
              ...s,
              tokens: {
                white: 2,
                blue: 2,
                green: 2,
                red: 2,
                black: 1,
                gold: 0,
              },
            }
          : s
      ),
    };
    state = splendorCartridge.reduce({
      state,
      actorSeatNo: 2,
      command: { type: "TAKE_GEMS", gems: ["blue", "green", "red"] },
      nowMs: 4000,
    }).state;
    expect(state.step).toBe("DiscardTokensStep");
    expect(countTokens(state.seats[1].tokens)).toBe(12);

    // Returning only 1 token throws; returning 2 resolves back to Seat 1's turn
    expect(() =>
      splendorCartridge.reduce({
        state,
        actorSeatNo: 2,
        command: { type: "DISCARD_TOKENS", tokens: { blue: 1 } },
        nowMs: 5000,
      })
    ).toThrow();

    state = splendorCartridge.reduce({
      state,
      actorSeatNo: 2,
      command: { type: "DISCARD_TOKENS", tokens: { blue: 1, green: 1 } },
      nowMs: 6000,
    }).state;
    expect(state.step).toBe("TurnActionStep");
    expect(countTokens(state.seats[1].tokens)).toBe(10);
    expect(state.activeSeatNo).toBe(1);
  });

  it("supports reserving cards (+1 gold, max 3), purchasing with permanent bonuses + gold jokers, and Noble visits (max 1 per turn)", () => {
    const init = splendorCartridge.createInitialState({
      config: splendorCartridge.defaultConfig(2),
      seats: makeSeats(2),
      nowMs: 1000,
    });
    let state: SplendorMatchState = init.state;

    // Seat 1 reserves market tier 1 slot 0 and receives 1 gold
    const reservedCard = state.market[1][0]!;
    state = splendorCartridge.reduce({
      state,
      actorSeatNo: 1,
      command: { type: "RESERVE_MARKET", tier: 1, slotIndex: 0 },
      nowMs: 2000,
    }).state;
    expect(state.seats[0].reservedCards.length).toBe(1);
    expect(state.seats[0].reservedCards[0].card.id).toBe(reservedCard.id);
    expect(state.seats[0].tokens.gold).toBe(1);
    expect(state.supply.gold).toBe(4);
    expect(state.market[1][0]).not.toBeNull(); // Refilled from Tier 1 deck

    // Advance Seat 2 so it's Seat 1's turn again
    state = splendorCartridge.reduce({
      state,
      actorSeatNo: 2,
      command: { type: "TAKE_GEMS", gems: ["white", "blue", "green"] },
      nowMs: 3000,
    }).state;

    // Give Seat 1 enough bonuses to trigger TWO nobles after buying their reserved card
    const nobles = buildOfficialSplendorNobles().slice(0, 2);
    state = {
      ...state,
      nobles,
      seats: state.seats.map((s) =>
        s.seatNo === 1
          ? {
              ...s,
              bonuses: { white: 4, blue: 4, green: 4, red: 4, black: 4 },
            }
          : s
      ),
    };
    const payCheck = computeCardPayment(state.seats[0], reservedCard);
    expect(payCheck.affordable).toBe(true);

    // Buying reserved card -> qualifies for both nobles -> enters NoblePickStep
    state = splendorCartridge.reduce({
      state,
      actorSeatNo: 1,
      command: { type: "BUY_RESERVED", reservedIndex: 0 },
      nowMs: 4000,
    }).state;
    expect(state.step).toBe("NoblePickStep");
    expect(state.eligibleNobleIds.length).toBe(2);

    // Seat 1 picks 1 noble -> receives +3 pts and only 1 noble visits on this turn
    state = splendorCartridge.reduce({
      state,
      actorSeatNo: 1,
      command: { type: "PICK_NOBLE", nobleId: nobles[0].id },
      nowMs: 5000,
    }).state;
    expect(state.seats[0].nobles.length).toBe(1);
    expect(state.nobles.length).toBe(1);
    expect(state.step).toBe("TurnActionStep");
    expect(state.activeSeatNo).toBe(2);
  });

  it("triggers Final Round at >= 15 points, finishes the round evenly, and breaks ties by fewest purchased development cards", () => {
    const init = splendorCartridge.createInitialState({
      config: splendorCartridge.defaultConfig(2),
      seats: makeSeats(2),
      nowMs: 1000,
    });

    const cardA = init.state.market[1][0]!;
    const cardB = init.state.market[1][1]!;
    // Seat 1 has 14 pts (5 purchased cards); Seat 2 has 15 pts (3 purchased cards)
    let state: SplendorMatchState = {
      ...init.state,
      nobles: [],
      seats: [
        {
          ...init.state.seats[0],
          points: 15,
          bonuses: { white: 5, blue: 5, green: 5, red: 5, black: 5 },
          purchasedCards: [cardA, cardA, cardA, cardA, cardA],
        },
        {
          ...init.state.seats[1],
          points: 15,
          bonuses: { white: 5, blue: 5, green: 5, red: 5, black: 5 },
          purchasedCards: [cardB, cardB, cardB],
        },
      ],
    };

    // Seat 1 takes gems -> already at 15 pts -> triggers Final Round, Seat 2 STILL gets their turn!
    state = splendorCartridge.reduce({
      state,
      actorSeatNo: 1,
      command: { type: "TAKE_GEMS", gems: ["white", "blue", "green"] },
      nowMs: 2000,
    }).state;
    expect(state.finalRoundTriggered).toBe(true);
    expect(state.step).toBe("TurnActionStep");
    expect(state.activeSeatNo).toBe(2);

    // Seat 2 finishes the round -> both tied at 15 pts -> Seat 2 wins tiebreaker with 3 cards < 5 cards!
    state = splendorCartridge.reduce({
      state,
      actorSeatNo: 2,
      command: { type: "TAKE_GEMS", gems: ["white", "blue", "green"] },
      nowMs: 3000,
    }).state;
    expect(state.step).toBe("Finished");
    expect(state.winnerSeatNos).toEqual([2]);
  });
});
