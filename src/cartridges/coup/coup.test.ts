import { describe, expect, it } from "vitest";
import { coupCartridge } from "@/cartridges/coup";
import type { SeatDescriptor } from "@/cartridges/types";

const makeSeats = (count: number): SeatDescriptor[] =>
  Array.from({ length: count }, (_, idx) => ({
    seatNo: idx + 1,
    actorId: `actor-${idx + 1}`,
    displayName: `Quý Tộc ${idx + 1}`,
    connected: true,
  }));

// With rng = () => 0.999, Fisher-Yates leaves the 15-card deck in its initial creation order:
// [Duke, Duke, Duke, Assassin, Assassin, Assassin, Captain, Captain, Captain, Ambassador, Ambassador, Ambassador, Contessa, Contessa, Contessa]
// Dealt 2 per seat for 3 seats (popped or taken in order):
// Seat 1: [Duke, Duke]
// Seat 2: [Duke, Assassin]
// Seat 3: [Assassin, Assassin]
// Remaining Court Deck (9 cards): [Captain x3, Ambassador x3, Contessa x3]

describe("Coup Cartridge - Seam 1 (GameCartridge Interface)", () => {
  it("enforces 3 to 6 players, deals 2 Influence cards and 2 Coins per Seat, and masks other players' live cards in projectView", () => {
    const cfg = coupCartridge.defaultConfig(3);
    expect(coupCartridge.validateConfig(cfg, 2).valid).toBe(false);
    expect(coupCartridge.validateConfig(cfg, 3).valid).toBe(true);
    expect(coupCartridge.validateConfig(cfg, 6).valid).toBe(true);
    expect(coupCartridge.validateConfig(cfg, 7).valid).toBe(false);

    const { state } = coupCartridge.createInitialState({
      config: cfg,
      seats: makeSeats(3),
      nowMs: 1_000,
      rng: () => 0.999,
    });

    expect(state.seats).toHaveLength(3);
    expect(state.courtDeck).toHaveLength(9);
    expect(state.activeSeatNo).toBe(1);
    expect(state.step).toBe("TurnActionStep");

    const seat1View = coupCartridge.projectView({ state, viewerSeatNo: 1 });
    expect(seat1View.seats[0].coins).toBe(2);
    expect(seat1View.seats[0].cards.map((c) => c.character)).toEqual([
      "Duke",
      "Duke",
    ]);
    // Seat 1 must NOT see Seat 2's or Seat 3's unrevealed cards
    expect(seat1View.seats[1].cards.map((c) => c.character)).toEqual([
      null,
      null,
    ]);
  });

  it("handles Income (+1 coin) and Foreign Aid blocked by Duke", () => {
    const cfg = coupCartridge.defaultConfig(3);
    const { state: s0 } = coupCartridge.createInitialState({
      config: cfg,
      seats: makeSeats(3),
      nowMs: 1_000,
      rng: () => 0.999,
    });

    // Turn 1 (Seat 1): Income -> +1 coin (now 3 coins), advances to Seat 2
    const { state: s1 } = coupCartridge.reduce({
      state: s0,
      actorSeatNo: 1,
      command: { type: "DECLARE_ACTION", action: "INCOME" },
      nowMs: 2_000,
    });
    expect(s1.seats.find((s) => s.seatNo === 1)?.coins).toBe(3);
    expect(s1.activeSeatNo).toBe(2);

    // Turn 2 (Seat 2): Foreign Aid -> opens ReactionWindowStep
    const { state: s2 } = coupCartridge.reduce({
      state: s1,
      actorSeatNo: 2,
      command: { type: "DECLARE_ACTION", action: "FOREIGN_AID" },
      nowMs: 3_000,
    });
    expect(s2.step).toBe("ReactionWindowStep");

    // Seat 1 blocks Foreign Aid claiming Duke -> enters BlockChallengeStep
    const { state: s3 } = coupCartridge.reduce({
      state: s2,
      actorSeatNo: 1,
      command: { type: "BLOCK", character: "Duke" },
      nowMs: 3_500,
    });
    expect(s3.step).toBe("BlockChallengeStep");

    // Seat 2 and Seat 3 pass on challenging the block -> Foreign Aid is cancelled, Seat 2 stays at 2 coins, turn moves to Seat 3
    const { state: s4 } = coupCartridge.reduce({
      state: s3,
      actorSeatNo: 2,
      command: { type: "PASS" },
      nowMs: 4_000,
    });
    const { state: s5 } = coupCartridge.reduce({
      state: s4,
      actorSeatNo: 3,
      command: { type: "PASS" },
      nowMs: 4_200,
    });
    expect(s5.seats.find((s) => s.seatNo === 2)?.coins).toBe(2);
    expect(s5.activeSeatNo).toBe(3);
    expect(s5.step).toBe("TurnActionStep");
  });

  it("punishes a bluff Challenge and executes the double-Influence loss when a target wrongly challenges a real Assassin", () => {
    const cfg = coupCartridge.defaultConfig(3);
    const { state: s0 } = coupCartridge.createInitialState({
      config: cfg,
      seats: makeSeats(3),
      nowMs: 1_000,
      rng: () => 0.999,
    });
    // Seat 2 holds [Duke, Assassin]; give Seat 2 3 coins and make it Seat 2's turn
    const sReady = {
      ...s0,
      activeSeatNo: 2,
      seats: s0.seats.map((s) =>
        s.seatNo === 2 ? { ...s, coins: 3 } : s
      ),
    };

    // Seat 2 declares ASSASSINATE on Seat 3 (costs 3 coins immediately -> 0 coins)
    const { state: s1 } = coupCartridge.reduce({
      state: sReady,
      actorSeatNo: 2,
      command: {
        type: "DECLARE_ACTION",
        action: "ASSASSINATE",
        targetSeatNo: 3,
      },
      nowMs: 2_000,
    });
    expect(s1.seats.find((s) => s.seatNo === 2)?.coins).toBe(0);
    expect(s1.step).toBe("ReactionWindowStep");

    // Seat 3 wrongly challenges Seat 2's Assassin!
    // Seat 2 truly holds Assassin -> Seat 3 loses 1st Influence from failed Challenge AND then 2nd Influence from the Assassination!
    // Because Seat 3 loses 1 card first ( enters LoseInfluenceStep to choose which of their 2 cards to reveal), then after choosing, their last remaining card is auto-revealed for the Assassination!
    const { state: s2 } = coupCartridge.reduce({
      state: s1,
      actorSeatNo: 3,
      command: { type: "CHALLENGE" },
      nowMs: 2_500,
    });
    expect(s2.step).toBe("LoseInfluenceStep");

    // Seat 3 chooses card index 0 to reveal for the failed Challenge -> the queued Assassination loss then auto-reveals Seat 3's last remaining card!
    const { state: s3 } = coupCartridge.reduce({
      state: s2,
      actorSeatNo: 3,
      command: { type: "LOSE_INFLUENCE", cardIndex: 0 },
      nowMs: 3_000,
    });

    const seat3After = s3.seats.find((s) => s.seatNo === 3)!;
    expect(seat3After.alive).toBe(false);
    expect(seat3After.cards.every((c) => c.revealed)).toBe(true);
  });

  it("supports Ambassador Exchange (draw 2 from Court Deck and pick which cards to keep) and enforces mandatory Coup at 10+ coins", () => {
    const cfg = coupCartridge.defaultConfig(3);
    const { state: s0 } = coupCartridge.createInitialState({
      config: cfg,
      seats: makeSeats(3),
      nowMs: 1_000,
      rng: () => 0.999,
    });

    // Seat 1 declares EXCHANGE (claiming Ambassador)
    const { state: s1 } = coupCartridge.reduce({
      state: s0,
      actorSeatNo: 1,
      command: { type: "DECLARE_ACTION", action: "EXCHANGE" },
      nowMs: 2_000,
    });
    // Seat 2 and Seat 3 pass
    const { state: s2 } = coupCartridge.reduce({
      state: s1,
      actorSeatNo: 2,
      command: { type: "PASS" },
      nowMs: 2_200,
    });
    const { state: s3 } = coupCartridge.reduce({
      state: s2,
      actorSeatNo: 3,
      command: { type: "PASS" },
      nowMs: 2_400,
    });

    expect(s3.step).toBe("ExchangePickStep");
    const view1 = coupCartridge.projectView({ state: s3, viewerSeatNo: 1 });
    expect(view1.exchangePool).toHaveLength(4); // 2 alive cards + 2 drawn from Court Deck

    // Seat 1 picks indices [2, 3] (the two newly drawn cards)
    const { state: s4 } = coupCartridge.reduce({
      state: s3,
      actorSeatNo: 1,
      command: { type: "EXCHANGE_KEEP", keepIndices: [2, 3] },
      nowMs: 3_000,
    });
    expect(s4.step).toBe("TurnActionStep");
    expect(s4.activeSeatNo).toBe(2);
    expect(s4.courtDeck).toHaveLength(9);

    // Mandatory Coup at 10+ coins: give Seat 2 10 coins
    const sTenCoins = {
      ...s4,
      seats: s4.seats.map((s) =>
        s.seatNo === 2 ? { ...s, coins: 10 } : s
      ),
    };
    expect(() =>
      coupCartridge.reduce({
        state: sTenCoins,
        actorSeatNo: 2,
        command: { type: "DECLARE_ACTION", action: "INCOME" },
        nowMs: 4_000,
      })
    ).toThrow(/10 xu/);
  });
});
