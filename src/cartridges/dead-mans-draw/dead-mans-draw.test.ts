import { describe, expect, it } from "vitest";
import {
  buildOfficialDmdDeck,
  computeBankScore,
  deadMansDrawCartridge,
  type DmdCard,
  type DmdMatchState,
} from "./index";

const SEATS = [
  { seatNo: 1, actorId: "a1", displayName: "Thuyền Trưởng A" },
  { seatNo: 2, actorId: "a2", displayName: "Hải Tặc B" },
];

describe("Dead Man's Draw Cartridge", () => {
  it("sets up the official 60-card deck (50 in Draw Pile, 10 lowest in Discard Pile)", () => {
    const { initialDrawPile, initialDiscardPile } = buildOfficialDmdDeck();
    expect(initialDrawPile).toHaveLength(50);
    expect(initialDiscardPile).toHaveLength(10);

    const mermaidDiscard = initialDiscardPile.find((c) => c.suit === "Mermaid");
    expect(mermaidDiscard?.value).toBe(4);
    for (const c of initialDiscardPile) {
      if (c.suit !== "Mermaid") expect(c.value).toBe(2);
    }

    const res = deadMansDrawCartridge.createInitialState({
      config: deadMansDrawCartridge.defaultConfig(2),
      seats: SEATS,
      nowMs: 1000,
    });
    expect(res.state.drawPile).toHaveLength(50);
    expect(res.state.discardPile).toHaveLength(10);
    expect(res.state.step).toBe("DrawOrBankStep");
    expect(res.state.activeSeatNo).toBe(1);
  });

  it("protects pre-Anchor cards on Bust while discarding Anchor and later cards", () => {
    const init = deadMansDrawCartridge.createInitialState({
      config: deadMansDrawCartridge.defaultConfig(2),
      seats: SEATS,
      nowMs: 1000,
    });

    // Rig top of draw pile (pop pops from end): Mermaid 9 -> Anchor 5 -> Mermaid 7 (Bust!)
    const state: DmdMatchState = {
      ...init.state,
      drawPile: [
        { id: "key-3", suit: "Key", value: 3 },
        { id: "mermaid-7", suit: "Mermaid", value: 7 },
        { id: "anchor-5", suit: "Anchor", value: 5 },
        { id: "mermaid-9", suit: "Mermaid", value: 9 },
      ],
      discardPile: [],
    };

    const r1 = deadMansDrawCartridge.reduce({
      state,
      command: { type: "DRAW" },
      actorSeatNo: 1,
      nowMs: 2000,
    });
    const r2 = deadMansDrawCartridge.reduce({
      state: r1.state,
      command: { type: "DRAW" },
      actorSeatNo: 1,
      nowMs: 3000,
    });
    expect(r2.state.playArea.map((c) => c.id)).toEqual([
      "mermaid-9",
      "anchor-5",
    ]);

    // 3rd draw busts on Mermaid -> Mermaid 9 saved by Anchor, Anchor 5 + Mermaid 7 discarded!
    const r3 = deadMansDrawCartridge.reduce({
      state: r2.state,
      command: { type: "DRAW" },
      actorSeatNo: 1,
      nowMs: 4000,
    });
    expect(r3.state.activeSeatNo).toBe(2);
    expect(r3.state.playArea).toHaveLength(0);
    expect(r3.state.seats[0].bank.Mermaid.map((c) => c.value)).toEqual([9]);
    expect(r3.state.seats[0].bank.Anchor).toHaveLength(0);
    expect(r3.state.discardPile.map((c) => c.id).sort()).toEqual([
      "anchor-5",
      "mermaid-7",
    ]);
  });

  it("triggers Key + Chest bonus, Kraken forced draws, and private Oracle peek", () => {
    const init = deadMansDrawCartridge.createInitialState({
      config: deadMansDrawCartridge.defaultConfig(2),
      seats: SEATS,
      nowMs: 1000,
    });

    const state: DmdMatchState = {
      ...init.state,
      drawPile: [
        { id: "sword-4", suit: "Sword", value: 4 },
        { id: "mermaid-8", suit: "Mermaid", value: 8 },
        { id: "chest-6", suit: "Chest", value: 6 },
        { id: "key-5", suit: "Key", value: 5 },
        { id: "kraken-3", suit: "Kraken", value: 3 },
        { id: "oracle-4", suit: "Oracle", value: 4 },
      ],
      discardPile: [
        { id: "cannon-2", suit: "Cannon", value: 2 },
        { id: "map-2", suit: "Map", value: 2 },
        { id: "hook-2", suit: "Hook", value: 2 },
        { id: "anchor-2", suit: "Anchor", value: 2 },
      ],
    };

    // Draw Oracle -> privately reveals Kraken 3 to seat 1 only
    const r1 = deadMansDrawCartridge.reduce({
      state,
      command: { type: "DRAW" },
      actorSeatNo: 1,
      nowMs: 2000,
    });
    const view1 = deadMansDrawCartridge.projectView({
      state: r1.state,
      viewerSeatNo: 1,
    });
    const view2 = deadMansDrawCartridge.projectView({
      state: r1.state,
      viewerSeatNo: 2,
    });
    expect(view1.oraclePeekedCard?.id).toBe("kraken-3");
    expect(view2.oraclePeekedCard).toBeNull();

    // Draw Kraken -> forcedDrawsRemaining = 2, cannot BANK
    const r2 = deadMansDrawCartridge.reduce({
      state: r1.state,
      command: { type: "DRAW" },
      actorSeatNo: 1,
      nowMs: 3000,
    });
    expect(r2.state.forcedDrawsRemaining).toBe(2);
    expect(() =>
      deadMansDrawCartridge.reduce({
        state: r2.state,
        command: { type: "BANK" },
        actorSeatNo: 1,
        nowMs: 3500,
      })
    ).toThrow(/Kraken/);

    // Complete 2 forced draws (Key 5, Chest 6) then BANK -> triggers Key + Chest bonus (4 cards!)
    const r3 = deadMansDrawCartridge.reduce({
      state: r2.state,
      command: { type: "DRAW" },
      actorSeatNo: 1,
      nowMs: 4000,
    });
    const r4 = deadMansDrawCartridge.reduce({
      state: r3.state,
      command: { type: "DRAW" },
      actorSeatNo: 1,
      nowMs: 5000,
    });
    expect(r4.state.forcedDrawsRemaining).toBe(0);

    const r5 = deadMansDrawCartridge.reduce({
      state: r4.state,
      command: { type: "BANK" },
      actorSeatNo: 1,
      nowMs: 6000,
    });
    // Seat 1 banked 4 playArea cards + 4 bonus cards from discardPile = 8 cards total!
    const totalCards = Object.values(r5.state.seats[0].bank).reduce(
      (sum, arr) => sum + arr.length,
      0
    );
    expect(totalCards).toBe(8);
    expect(r5.state.discardPile).toHaveLength(0);
  });

  it("resolves Cannon, Sword steal, Hook replay, and Map pick cleanly", () => {
    const init = deadMansDrawCartridge.createInitialState({
      config: deadMansDrawCartridge.defaultConfig(2),
      seats: SEATS,
      nowMs: 1000,
    });

    const state: DmdMatchState = {
      ...init.state,
      drawPile: [
        { id: "key-7", suit: "Key", value: 7 },
        { id: "map-5", suit: "Map", value: 5 },
        { id: "hook-4", suit: "Hook", value: 4 },
        { id: "sword-6", suit: "Sword", value: 6 },
        { id: "cannon-5", suit: "Cannon", value: 5 },
      ],
      discardPile: [
        { id: "anchor-2", suit: "Anchor", value: 2 },
        { id: "mermaid-4", suit: "Mermaid", value: 4 },
      ],
    };
    state.seats[0].bank.Chest = [{ id: "chest-5", suit: "Chest", value: 5 }];
    state.seats[1].bank.Mermaid = [
      { id: "mermaid-6", suit: "Mermaid", value: 6 },
      { id: "mermaid-9", suit: "Mermaid", value: 9 },
    ];

    // 1. Draw Cannon -> destroy Seat 2's Mermaid 9
    const r1 = deadMansDrawCartridge.reduce({
      state,
      command: { type: "DRAW" },
      actorSeatNo: 1,
      nowMs: 2000,
    });
    expect(r1.state.step).toBe("CannonTargetStep");
    const r2 = deadMansDrawCartridge.reduce({
      state: r1.state,
      command: { type: "CANNON_TARGET", targetSeatNo: 2, suit: "Mermaid" },
      actorSeatNo: 1,
      nowMs: 2500,
    });
    expect(r2.state.seats[1].bank.Mermaid.map((c) => c.value)).toEqual([6]);

    // 2. Draw Sword -> steal Seat 2's Mermaid 6 into Play Area
    const r3 = deadMansDrawCartridge.reduce({
      state: r2.state,
      command: { type: "DRAW" },
      actorSeatNo: 1,
      nowMs: 3000,
    });
    expect(r3.state.step).toBe("SwordTargetStep");
    const r4 = deadMansDrawCartridge.reduce({
      state: r3.state,
      command: { type: "SWORD_TARGET", targetSeatNo: 2, suit: "Mermaid" },
      actorSeatNo: 1,
      nowMs: 3500,
    });
    expect(r4.state.playArea.some((c) => c.id === "mermaid-6")).toBe(true);

    // 3. Draw Hook -> pull own Chest 5 into Play Area
    const r5 = deadMansDrawCartridge.reduce({
      state: r4.state,
      command: { type: "DRAW" },
      actorSeatNo: 1,
      nowMs: 4000,
    });
    expect(r5.state.step).toBe("HookPickStep");
    const r6 = deadMansDrawCartridge.reduce({
      state: r5.state,
      command: { type: "HOOK_PICK", suit: "Chest" },
      actorSeatNo: 1,
      nowMs: 4500,
    });
    expect(r6.state.playArea.some((c) => c.id === "chest-5")).toBe(true);

    // 4. Draw Map -> pick Anchor 2 from discard pile
    const r7 = deadMansDrawCartridge.reduce({
      state: r6.state,
      command: { type: "DRAW" },
      actorSeatNo: 1,
      nowMs: 5000,
    });
    expect(r7.state.step).toBe("MapPickStep");
    const r8 = deadMansDrawCartridge.reduce({
      state: r7.state,
      command: { type: "MAP_PICK", cardId: "anchor-2" },
      actorSeatNo: 1,
      nowMs: 5500,
    });
    expect(r8.state.playArea.some((c) => c.id === "anchor-2")).toBe(true);
    expect(r8.state.step).toBe("DrawOrBankStep");
  });

  it("plays a complete bot-vs-bot match to Finished and scores highest card per suit", () => {
    let cur = deadMansDrawCartridge.createInitialState({
      config: deadMansDrawCartridge.defaultConfig(2),
      seats: SEATS,
      nowMs: 1000,
      rng: () => 0.37,
    });

    let safety = 0;
    while (!deadMansDrawCartridge.isMatchOver(cur.state) && safety < 200) {
      safety += 1;
      cur = deadMansDrawCartridge.autoActBots!({
        current: cur,
        botSeatNos: [1, 2],
        nowMs: 1000 + safety * 1000,
      });
    }

    expect(deadMansDrawCartridge.isMatchOver(cur.state)).toBe(true);
    expect(cur.state.drawPile).toHaveLength(0);
    expect(cur.state.winnerSeatNos.length).toBeGreaterThanOrEqual(1);
    const s1Score = computeBankScore(cur.state.seats[0].bank);
    const s2Score = computeBankScore(cur.state.seats[1].bank);
    expect(s1Score + s2Score).toBeGreaterThan(0);
  });
});
