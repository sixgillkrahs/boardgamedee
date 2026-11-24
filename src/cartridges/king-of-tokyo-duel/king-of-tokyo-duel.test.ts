import { describe, expect, it } from "vitest";
import {
  kingOfTokyoDuelCartridge,
  KOT_MONSTERS,
  KOT_POWER_DECK_TEMPLATE,
  type KotMatchState,
} from "./index";

const SEATS = [
  { seatNo: 1, actorId: "p1", displayName: "Kaiju 1" },
  { seatNo: 2, actorId: "p2", displayName: "Kaiju 2" },
];

describe("King of Tokyo: Duel Cartridge", () => {
  it("runs MonsterPickStep and starts Turn 1 with 5 dice (official first-player balance)", () => {
    const init = kingOfTokyoDuelCartridge.createInitialState({
      config: kingOfTokyoDuelCartridge.defaultConfig(2),
      seats: SEATS,
      nowMs: 1000,
    });
    expect(init.state.step).toBe("MonsterPickStep");
    expect(init.state.market).toHaveLength(3);
    expect(init.state.placedBuzzTiles).toHaveLength(0);

    const p1Pick = kingOfTokyoDuelCartridge.reduce({
      state: init.state,
      command: { type: "PICK_MONSTER", monsterId: "gigazaur" },
      actorSeatNo: 1,
      nowMs: 2000,
    });
    expect(p1Pick.state.activeSeatNo).toBe(2);
    expect(p1Pick.state.seats[0].hp).toBe(KOT_MONSTERS.gigazaur.maxHp);

    // Duplicate monster rejected
    expect(() =>
      kingOfTokyoDuelCartridge.reduce({
        state: p1Pick.state,
        command: { type: "PICK_MONSTER", monsterId: "gigazaur" },
        actorSeatNo: 2,
        nowMs: 2500,
      })
    ).toThrow(/đã được đối thủ chọn/);

    const p2Pick = kingOfTokyoDuelCartridge.reduce({
      state: p1Pick.state,
      command: { type: "PICK_MONSTER", monsterId: "meka_dragon" },
      actorSeatNo: 2,
      nowMs: 3000,
    });
    expect(p2Pick.state.step).toBe("RollDiceStep");
    expect(p2Pick.state.activeSeatNo).toBe(1);
    expect(p2Pick.state.dice).toHaveLength(5); // Turn 1 official 5-dice rule!
  });

  it("resolves Claws, Meka Dragon Nuclear Breath, Fame/Destruction pulls, and Buzz Tokens", () => {
    const init = kingOfTokyoDuelCartridge.createInitialState({
      config: kingOfTokyoDuelCartridge.defaultConfig(2),
      seats: SEATS,
      nowMs: 1000,
    });
    const r1 = kingOfTokyoDuelCartridge.reduce({
      state: init.state,
      command: { type: "PICK_MONSTER", monsterId: "meka_dragon" },
      actorSeatNo: 1,
      nowMs: 2000,
    });
    const r2 = kingOfTokyoDuelCartridge.reduce({
      state: r1.state,
      command: { type: "PICK_MONSTER", monsterId: "the_king" },
      actorSeatNo: 2,
      nowMs: 3000,
    });

    // Place Anubis 2-space Buzz Tile ([ENERGY_1, HEAL_1]) at Fame startPos=-2 (covers -2 and -1)
    // Rig 6 dice: 4 stars (pulls Fame 0 -> -2, crossing -1 HEAL_1 & -2 ENERGY_1) + 2 special (Meka Dragon +2 dmg!)
    const rigged: KotMatchState = {
      ...r2.state,
      placedBuzzTiles: [{ tileId: "anubis", track: "fame", startPos: -2 }],
      dice: [
        { id: 0, face: "star", locked: true },
        { id: 1, face: "star", locked: true },
        { id: 2, face: "star", locked: true },
        { id: 3, face: "star", locked: true },
        { id: 4, face: "special", locked: true },
        { id: 5, face: "special", locked: true },
      ],
    };

    const resolved = kingOfTokyoDuelCartridge.reduce({
      state: rigged,
      command: { type: "RESOLVE_DICE" },
      actorSeatNo: 1,
      nowMs: 4000,
    });

    // 4 stars -> pulls Fame from 0 to -2, triggering Anubis slot 0 (ENERGY_1) & keeping the Buzz tile on board!
    expect(resolved.state.famePos).toBe(-2);
    expect(resolved.state.seats[0].energy).toBe(1);
    expect(resolved.state.placedBuzzTiles).toHaveLength(1);
    // Meka Dragon 2 '!' -> +2 damage to Seat 2 (15 -> 13 HP)
    expect(resolved.state.seats[1].hp).toBe(13);
    expect(resolved.state.step).toBe("BuyCardsStep");
  });

  it("places a new Buzz Tile on card purchase and lets either player relocate it when buying a matching Buzz card", () => {
    const init = kingOfTokyoDuelCartridge.createInitialState({
      config: kingOfTokyoDuelCartridge.defaultConfig(2),
      seats: SEATS,
      nowMs: 1000,
    });
    const r1 = kingOfTokyoDuelCartridge.reduce({
      state: init.state,
      command: { type: "PICK_MONSTER", monsterId: "gigazaur" },
      actorSeatNo: 1,
      nowMs: 2000,
    });
    const r2 = kingOfTokyoDuelCartridge.reduce({
      state: r1.state,
      command: { type: "PICK_MONSTER", monsterId: "cyber_kitty" },
      actorSeatNo: 2,
      nowMs: 3000,
    });

    const anubisCard = KOT_POWER_DECK_TEMPLATE.find(
      (c) => c.buzzTileId === "anubis"
    )!;
    const krakenCard1 = KOT_POWER_DECK_TEMPLATE.find(
      (c) => c.id === "kot-media-storm"
    )!;
    const krakenCard2 = KOT_POWER_DECK_TEMPLATE.find(
      (c) => c.id === "kot-beam"
    )!;

    // Seat 1 in BuyCardsStep buys a Kraken Buzz card -> enters PlaceBuzzStep!
    const buyReady: KotMatchState = {
      ...r2.state,
      step: "BuyCardsStep",
      seats: r2.state.seats.map((s) => ({ ...s, energy: 10 })),
      market: [krakenCard1, krakenCard2, anubisCard],
    };

    const bought1 = kingOfTokyoDuelCartridge.reduce({
      state: buyReady,
      command: { type: "BUY_CARD", cardId: krakenCard1.id },
      actorSeatNo: 1,
      nowMs: 4000,
    });
    expect(bought1.state.step).toBe("PlaceBuzzStep");
    expect(bought1.state.pendingBuzzTileId).toBe("kraken");

    // Seat 1 places Kraken 3-space Buzz Tile on Fame at startPos = -3 (occupies -3, -2, -1)
    const placed1 = kingOfTokyoDuelCartridge.reduce({
      state: bought1.state,
      command: { type: "PLACE_BUZZ", track: "fame", startPos: -3 },
      actorSeatNo: 1,
      nowMs: 4500,
    });
    expect(placed1.state.step).toBe("BuyCardsStep");
    expect(placed1.state.placedBuzzTiles).toEqual([
      { tileId: "kraken", track: "fame", startPos: -3 },
    ]);

    // End Seat 1's turn -> Seat 2's turn -> Seat 2 buys another Kraken Buzz card and MOVES the same tile!
    const p2Ready: KotMatchState = {
      ...placed1.state,
      activeSeatNo: 2,
      step: "BuyCardsStep",
      market: [krakenCard2, anubisCard],
    };
    const bought2 = kingOfTokyoDuelCartridge.reduce({
      state: p2Ready,
      command: { type: "BUY_CARD", cardId: krakenCard2.id },
      actorSeatNo: 2,
      nowMs: 5000,
    });
    expect(bought2.state.step).toBe("PlaceBuzzStep");
    expect(bought2.state.pendingBuzzTileId).toBe("kraken");

    const moved2 = kingOfTokyoDuelCartridge.reduce({
      state: bought2.state,
      command: { type: "PLACE_BUZZ", track: "destruction", startPos: 2 },
      actorSeatNo: 2,
      nowMs: 5500,
    });
    expect(moved2.state.step).toBe("BuyCardsStep");
    // Same Kraken tile was relocated (still 1 tile total, now on destruction at startPos 2!)
    expect(moved2.state.placedBuzzTiles).toEqual([
      { tileId: "kraken", track: "destruction", startPos: 2 },
    ]);
  });

  it("detects Double Spotlight Victory when both markers enter a player's Spotlight Zone", () => {
    const init = kingOfTokyoDuelCartridge.createInitialState({
      config: kingOfTokyoDuelCartridge.defaultConfig(2),
      seats: SEATS,
      nowMs: 1000,
    });
    const r1 = kingOfTokyoDuelCartridge.reduce({
      state: init.state,
      command: { type: "PICK_MONSTER", monsterId: "gigazaur" },
      actorSeatNo: 1,
      nowMs: 2000,
    });
    const r2 = kingOfTokyoDuelCartridge.reduce({
      state: r1.state,
      command: { type: "PICK_MONSTER", monsterId: "cyber_kitty" },
      actorSeatNo: 2,
      nowMs: 3000,
    });

    // Seat 1 already has Fame at -3 (Spotlight) and Destruction at -2; Gigazaur with 2 buildings + 1 '!' pulls Destruction to -3 -> Double Spotlight Win!
    const rigged: KotMatchState = {
      ...r2.state,
      famePos: -3,
      destructionPos: -2,
      dice: [
        { id: 0, face: "building", locked: true },
        { id: 1, face: "building", locked: true },
        { id: 2, face: "special", locked: true },
        { id: 3, face: "energy", locked: true },
        { id: 4, face: "heal", locked: true },
      ],
    };

    const res = kingOfTokyoDuelCartridge.reduce({
      state: rigged,
      command: { type: "RESOLVE_DICE" },
      actorSeatNo: 1,
      nowMs: 4000,
    });
    expect(res.state.step).toBe("Finished");
    expect(res.state.winnerSeatNo).toBe(1);
    expect(res.state.winReasonVi).toMatch(/SPOTLIGHT/);
  });

  it("completes a full Bot-vs-Bot 1v1 Kaiju duel to Finished cleanly", () => {
    let cur = kingOfTokyoDuelCartridge.createInitialState({
      config: kingOfTokyoDuelCartridge.defaultConfig(2),
      seats: SEATS,
      nowMs: 1000,
    });

    let safety = 0;
    while (!kingOfTokyoDuelCartridge.isMatchOver(cur.state) && safety < 160) {
      safety += 1;
      cur = kingOfTokyoDuelCartridge.autoActBots!({
        current: cur,
        botSeatNos: [1, 2],
        nowMs: 1000 + safety * 1000,
      });
    }

    expect(kingOfTokyoDuelCartridge.isMatchOver(cur.state)).toBe(true);
    expect(cur.state.winnerSeatNo).not.toBeNull();
  });
});
