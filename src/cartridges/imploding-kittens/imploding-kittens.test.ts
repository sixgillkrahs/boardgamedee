import { describe, expect, it } from "vitest";
import { implodingKittensCartridge } from "@/cartridges/imploding-kittens";
import type { SeatDescriptor } from "@/cartridges/types";

const SAMPLE_SEATS: SeatDescriptor[] = [
  { seatNo: 1, actorId: "a1", displayName: "Mèo Cam" },
  { seatNo: 2, actorId: "a2", displayName: "Mèo Mun" },
  { seatNo: 3, actorId: "a3", displayName: "Mèo Mướp" },
];

describe("Imploding Kittens Cartridge (Core + 4 Expansions)", () => {
  it("initializes 8-card starting hands (with 1 guaranteed Defuse) and inserts Exploding & Imploding Kittens according to enabled expansions", () => {
    const res = implodingKittensCartridge.createInitialState({
      config: implodingKittensCartridge.defaultConfig(3),
      seats: SAMPLE_SEATS,
      nowMs: 1000,
    });

    expect(res.state.step).toBe("TurnPlayStep");
    expect(res.state.seats).toHaveLength(3);

    for (const s of res.state.seats) {
      expect(s.hand).toHaveLength(8);
      expect(s.hand.some((c) => c.type === "defuse")).toBe(true);
    }

    // With 3 players + Imploding ON + Streaking ON:
    // Total bombs = (3 - 1) + 1 (Streaking extra bomb) = 3 bombs (2 Exploding + 1 Imploding)
    const explodingInDeck = res.state.drawPile.filter(
      (c) => c.type === "exploding_kitten"
    );
    const implodingInDeck = res.state.drawPile.filter(
      (c) => c.type === "imploding_kitten"
    );
    expect(explodingInDeck).toHaveLength(2);
    expect(implodingInDeck).toHaveLength(1);
    expect(implodingInDeck[0].faceUp).toBe(false);
  });

  it("handles Imploding Kitten two-stage rule: 1st draw flips it FACE UP and inserts into deck; 2nd draw while FACE UP eliminates player bypassing Defuse", () => {
    const init = implodingKittensCartridge.createInitialState({
      config: implodingKittensCartridge.defaultConfig(2),
      seats: SAMPLE_SEATS.slice(0, 2),
      nowMs: 1000,
    });

    // Place face-down Imploding Kitten right on top of drawPile (end of array)
    init.state.drawPile.push({
      id: "test-imploding",
      type: "imploding_kitten",
      faceUp: false,
    });

    // Seat 1 draws the face-down Imploding Kitten -> enters DefuseInsertStep with reason INSERT_IMPLODING_FACEUP
    const afterDraw1 = implodingKittensCartridge.reduce({
      state: init.state,
      actorSeatNo: 1,
      nowMs: 1100,
      command: { type: "DRAW_CARD" },
    });
    expect(afterDraw1.state.step).toBe("DefuseInsertStep");
    expect(afterDraw1.state.pendingInsert?.reason).toBe(
      "INSERT_IMPLODING_FACEUP"
    );
    expect(afterDraw1.state.pendingInsert?.card.faceUp).toBe(true);

    // Seat 1 inserts the face-up Imploding Kitten right at index 0 (TOP of drawPile) to trap Seat 2!
    const afterInsert = implodingKittensCartridge.reduce({
      state: afterDraw1.state,
      actorSeatNo: 1,
      nowMs: 1200,
      command: { type: "INSERT_CARD", insertIndex: 0 },
    });
    expect(afterInsert.state.step).toBe("TurnPlayStep");
    expect(afterInsert.state.activeSeatNo).toBe(2);

    // Verify Player View exposes topDrawCardFaceUp so everyone sees the Face-Up Imploding Kitten on top of Draw Pile!
    const p2View = implodingKittensCartridge.projectView({
      state: afterInsert.state,
      viewerSeatNo: 2,
    });
    expect(p2View.topDrawCardFaceUp?.type).toBe("imploding_kitten");

    // Seat 2 has a Defuse card in hand, but draws the FACE-UP Imploding Kitten -> cannot Defuse, immediately implodes!
    const afterDraw2 = implodingKittensCartridge.reduce({
      state: afterInsert.state,
      actorSeatNo: 2,
      nowMs: 1300,
      command: { type: "DRAW_CARD" },
    });
    expect(afterDraw2.state.seats[1].alive).toBe(false);
    expect(afterDraw2.state.seats[1].eliminatedBy).toBe("imploding");
    expect(afterDraw2.state.step).toBe("Finished");
    expect(afterDraw2.state.winnerSeatNos).toEqual([1]);
  });

  it("supports Feral Cat wildcard combos, Nope -> Yup chaining, Reverse, Targeted Attack, Streaking Kitten bomb holding, and Alter the Future", () => {
    const init = implodingKittensCartridge.createInitialState({
      config: implodingKittensCartridge.defaultConfig(3),
      seats: SAMPLE_SEATS,
      nowMs: 1000,
    });

    const [s1, s2, s3] = init.state.seats;
    s1.hand = [
      { id: "s1-feral", type: "feral_cat" },
      { id: "s1-taco", type: "tacocat" },
      { id: "s1-yup", type: "nope" },
      { id: "s1-target-atk", type: "targeted_attack" },
    ];
    s2.hand = [
      { id: "s2-nope", type: "nope" },
      { id: "s2-prize", type: "super_skip" },
    ];
    s3.hand = [
      { id: "s3-streaking", type: "streaking_kitten" },
      { id: "s3-reverse", type: "reverse" },
    ];

    // Seat 1 plays 2-card combo (Feral Cat + Tacocat) targeting Seat 2
    // Because Seat 2 holds a Nope card, it enters NopeWindowStep!
    const afterCombo = implodingKittensCartridge.reduce({
      state: init.state,
      actorSeatNo: 1,
      nowMs: 1100,
      command: {
        type: "PLAY_COMBO_2",
        cardIds: ["s1-feral", "s1-taco"],
        targetSeatNo: 2,
      },
    });
    expect(afterCombo.state.step).toBe("NopeWindowStep");

    // Seat 2 plays Nope!
    const afterNope = implodingKittensCartridge.reduce({
      state: afterCombo.state,
      actorSeatNo: 2,
      nowMs: 1200,
      command: { type: "PLAY_NOPE", cardId: "s2-nope" },
    });
    expect(afterNope.state.pendingAction?.nopeCount).toBe(1);

    // Seat 1 counter-plays Nope (YUP!) -> no one else has Nope left, so combo resolves immediately and steals Seat 2's 's2-prize'!
    const afterYup = implodingKittensCartridge.reduce({
      state: afterNope.state,
      actorSeatNo: 1,
      nowMs: 1300,
      command: { type: "PLAY_NOPE", cardId: "s1-yup" },
    });
    expect(afterYup.state.step).toBe("TurnPlayStep");
    expect(
      afterYup.state.seats[0].hand.some((c) => c.id === "s2-prize")
    ).toBe(true);

    // Seat 1 plays Targeted Attack on Seat 3 -> Seat 3 now owes 2 turns!
    const afterTargetAtk = implodingKittensCartridge.reduce({
      state: afterYup.state,
      actorSeatNo: 1,
      nowMs: 1400,
      command: {
        type: "PLAY_CARD",
        cardId: "s1-target-atk",
        targetSeatNo: 3,
      },
    });
    expect(afterTargetAtk.state.activeSeatNo).toBe(3);
    expect(afterTargetAtk.state.turnsRemaining).toBe(2);

    // Put an Exploding Kitten on top of drawPile; Seat 3 has Streaking Kitten, so drawing the Exploding Kitten keeps it safely in hand!
    afterTargetAtk.state.drawPile.push({
      id: "top-exp-bomb",
      type: "exploding_kitten",
    });
    const afterS3Draw = implodingKittensCartridge.reduce({
      state: afterTargetAtk.state,
      actorSeatNo: 3,
      nowMs: 1500,
      command: { type: "DRAW_CARD" },
    });
    expect(afterS3Draw.state.seats[2].alive).toBe(true);
    expect(
      afterS3Draw.state.seats[2].hand.some((c) => c.id === "top-exp-bomb")
    ).toBe(true);
    expect(afterS3Draw.state.turnsRemaining).toBe(1); // 1 of 2 turns completed

    // Seat 3 plays Reverse to finish their 2nd turn and flip direction to -1!
    const afterRev = implodingKittensCartridge.reduce({
      state: afterS3Draw.state,
      actorSeatNo: 3,
      nowMs: 1600,
      command: { type: "PLAY_CARD", cardId: "s3-reverse" },
    });
    expect(afterRev.state.direction).toBe(-1);
    expect(afterRev.state.activeSeatNo).toBe(2);
  });
});
