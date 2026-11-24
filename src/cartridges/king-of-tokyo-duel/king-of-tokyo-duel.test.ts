import { describe, expect, it } from "vitest";
import {
  kingOfTokyoDuelCartridge,
  KOT_MONSTERS,
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
    expect(init.state.buzzTokens.length).toBeGreaterThanOrEqual(4);

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

    // Rig 6 dice: 2 claws + 2 special (Meka Dragon +2 dmg = 4 total) + 3 stars? Let's rig 4 stars + 2 special = +2 fame steps (lands on Buzz -2 -> +2 Energy!)
    const rigged: KotMatchState = {
      ...r2.state,
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

    // 4 stars -> pulls Fame from 0 to -2 (triggers buzz-f-n2: +2 Energy!)
    expect(resolved.state.famePos).toBe(-2);
    expect(resolved.state.seats[0].energy).toBe(2);
    // Meka Dragon 2 '!' -> +2 damage to Seat 2 (15 -> 13 HP)
    expect(resolved.state.seats[1].hp).toBe(13);
    expect(resolved.state.step).toBe("BuyCardsStep");
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
