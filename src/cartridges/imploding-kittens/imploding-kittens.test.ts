import { describe, expect, it } from "vitest";
import { implodingKittensCartridge } from "@/cartridges/imploding-kittens";
import type { SeatDescriptor } from "@/cartridges/types";

const SAMPLE_SEATS: SeatDescriptor[] = [
  { seatNo: 1, actorId: "a1", displayName: "Mèo Cam" },
  { seatNo: 2, actorId: "a2", displayName: "Mèo Mun" },
  { seatNo: 3, actorId: "a3", displayName: "Mèo Mướp" },
];

describe("Imploding Kittens Cartridge (Core + 5 Expansions)", () => {
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
      { id: "s2-hidden", type: "skip" },
      { id: "s2-prize", type: "super_skip", marked: true },
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

    // Seat 1 counter-plays Nope (YUP!) -> no one else has Nope left, so Combo 2 enters Combo2PickStep for Seat 1 to pick a card from Seat 2!
    const afterYup = implodingKittensCartridge.reduce({
      state: afterNope.state,
      actorSeatNo: 1,
      nowMs: 1300,
      command: { type: "PLAY_NOPE", cardId: "s1-yup" },
    });
    expect(afterYup.state.step).toBe("Combo2PickStep");

    // Verify anti-cheat view on shuffled slots: unmarked slot is null (face-down), marked slot exposes 's2-prize'!
    const pickView = implodingKittensCartridge.projectView({
      state: afterYup.state,
      viewerSeatNo: 1,
    });
    const slots = pickView.pendingCombo2Pick?.slots ?? [];
    expect(slots).toHaveLength(2);
    expect(slots.filter((s) => s === null)).toHaveLength(1);
    const markedSlotIdx = slots.findIndex((s) => s?.id === "s2-prize");
    expect(markedSlotIdx).toBeGreaterThanOrEqual(0);

    // Seat 1 picks the exact shuffled slot holding the marked 's2-prize'!
    const afterPick = implodingKittensCartridge.reduce({
      state: afterYup.state,
      actorSeatNo: 1,
      nowMs: 1350,
      command: { type: "PICK_COMBO_2_CARD", cardIndex: markedSlotIdx },
    });
    expect(afterPick.state.step).toBe("TurnPlayStep");
    expect(
      afterPick.state.seats[0].hand.some((c) => c.id === "s2-prize")
    ).toBe(true);

    // Seat 1 plays Targeted Attack on Seat 3 -> Seat 3 now owes 2 turns!
    const afterTargetAtk = implodingKittensCartridge.reduce({
      state: afterPick.state,
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

  it("supports Barking Kittens Tower of Power: 6 stash cards intercept steals (Favor/Combo 2) and holder can claim 1 card + shuffle rest into deck", () => {
    const init = implodingKittensCartridge.createInitialState({
      config: implodingKittensCartridge.defaultConfig(2),
      seats: SAMPLE_SEATS.slice(0, 2),
      nowMs: 1000,
    });

    // Barking expansion is enabled by default -> 6 non-bomb stash cards set aside
    expect(init.state.towerStashCards).toHaveLength(6);
    expect(init.state.towerHolderSeatNo).toBeNull();

    const [s1, s2] = init.state.seats;
    s1.hand = [
      { id: "s1-tower", type: "tower_of_power" },
      { id: "s1-secret-defuse", type: "defuse" },
      { id: "s1-skip", type: "skip" },
    ];
    s2.hand = [
      { id: "s2-favor", type: "favor" },
      { id: "s2-cat1", type: "tacocat" },
      { id: "s2-cat2", type: "tacocat" },
      { id: "s2-skip", type: "skip" },
    ];

    // Seat 1 wears Tower of Power, then skips turn to Seat 2
    const afterTower = implodingKittensCartridge.reduce({
      state: init.state,
      actorSeatNo: 1,
      nowMs: 1100,
      command: { type: "PLAY_CARD", cardId: "s1-tower" },
    });
    expect(afterTower.state.towerHolderSeatNo).toBe(1);
    expect(afterTower.state.towerStashCards).toHaveLength(6);

    const afterSkip1 = implodingKittensCartridge.reduce({
      state: afterTower.state,
      actorSeatNo: 1,
      nowMs: 1200,
      command: { type: "PLAY_CARD", cardId: "s1-skip" },
    });
    expect(afterSkip1.state.activeSeatNo).toBe(2);

    // Seat 2 plays Favor on Seat 1 -> intercepted by Tower! Seat 1's hand is untouched, stash drops 6 -> 5
    const afterFavor = implodingKittensCartridge.reduce({
      state: afterSkip1.state,
      actorSeatNo: 2,
      nowMs: 1300,
      command: { type: "PLAY_CARD", cardId: "s2-favor", targetSeatNo: 1 },
    });
    expect(afterFavor.state.step).toBe("TurnPlayStep");
    expect(afterFavor.state.towerStashCards).toHaveLength(5);
    expect(afterFavor.state.seats[0].hand.map((c) => c.id)).toEqual([
      "s1-secret-defuse",
    ]);

    // Seat 2 plays Combo 2 on Seat 1 -> intercepted again! Stash drops 5 -> 4
    const afterCombo2 = implodingKittensCartridge.reduce({
      state: afterFavor.state,
      actorSeatNo: 2,
      nowMs: 1400,
      command: {
        type: "PLAY_COMBO_2",
        cardIds: ["s2-cat1", "s2-cat2"],
        targetSeatNo: 1,
      },
    });
    expect(afterCombo2.state.towerStashCards).toHaveLength(4);
    expect(afterCombo2.state.seats[0].hand.map((c) => c.id)).toEqual([
      "s1-secret-defuse",
    ]);

    // Seat 2 skips back to Seat 1; Seat 1 claims 1 card from Tower and shuffles the remaining 3 into drawPile!
    const afterSkip2 = implodingKittensCartridge.reduce({
      state: afterCombo2.state,
      actorSeatNo: 2,
      nowMs: 1500,
      command: { type: "PLAY_CARD", cardId: "s2-skip" },
    });
    const deckCountBeforeClaim = afterSkip2.state.drawPile.length;

    const afterClaim = implodingKittensCartridge.reduce({
      state: afterSkip2.state,
      actorSeatNo: 1,
      nowMs: 1600,
      command: { type: "CLAIM_TOWER_STASH" },
    });
    expect(afterClaim.state.towerHolderSeatNo).toBeNull();
    expect(afterClaim.state.towerStashCards).toHaveLength(0);
    expect(afterClaim.state.seats[0].hand).toHaveLength(2); // secret-defuse + 1 card taken from Tower
    expect(afterClaim.state.drawPile).toHaveLength(deckCountBeforeClaim + 3);
  });

  it("supports Good vs. Evil expansion: Armageddon showdown (anti-cheat), Godcat wildcard + emergency Defuse, Raising Heck, and Reveal the Future 3x", () => {
    const init = implodingKittensCartridge.createInitialState({
      config: implodingKittensCartridge.defaultConfig(3),
      seats: SAMPLE_SEATS,
      nowMs: 1000,
    });

    expect(init.state.godcatOnPlaymat).toBe(true);

    const [s1, s2, s3] = init.state.seats;
    s1.hand = [
      { id: "s1-arm1", type: "armageddon" },
      { id: "s1-defuse", type: "defuse" },
      { id: "s1-reveal", type: "reveal_future_3" },
    ];
    s2.hand = [
      { id: "s2-arm2", type: "armageddon" },
      { id: "s2-heck", type: "raising_heck" },
      { id: "s2-horse1", type: "horse_cat" },
      { id: "s2-horse2", type: "horse_cat" },
    ];
    s3.hand = [{ id: "s3-skip", type: "skip" }];

    // 1. Reveal the Future 3x exposes top 3 cards to ALL alive players!
    const afterReveal = implodingKittensCartridge.reduce({
      state: init.state,
      actorSeatNo: 1,
      nowMs: 1050,
      command: { type: "PLAY_CARD", cardId: "s1-reveal" },
    });
    expect(afterReveal.state.step).toBe("TurnPlayStep");
    expect(afterReveal.state.seats[0].privateVision?.cards).toHaveLength(3);
    expect(afterReveal.state.seats[1].privateVision?.cards).toHaveLength(3);
    expect(afterReveal.state.seats[2].privateVision?.cards).toHaveLength(3);

    // 2. Seat 1 plays Armageddon targeting Seat 2 -> enters ArmageddonStep (ACTOR_PLACE)
    const afterArmPlay = implodingKittensCartridge.reduce({
      state: afterReveal.state,
      actorSeatNo: 1,
      nowMs: 1100,
      command: { type: "PLAY_CARD", cardId: "s1-arm1", targetSeatNo: 2 },
    });
    expect(afterArmPlay.state.step).toBe("ArmageddonStep");
    expect(afterArmPlay.state.pendingArmageddon?.stage).toBe("ACTOR_PLACE");

    // Seat 1 secretly places Godcat in front of Seat 1 (giveGodcatToTarget: false) and Devilcat in front of Seat 2
    const afterPlace = implodingKittensCartridge.reduce({
      state: afterArmPlay.state,
      actorSeatNo: 1,
      nowMs: 1150,
      command: { type: "ARMAGEDDON_PLACE", giveGodcatToTarget: false },
    });
    expect(afterPlace.state.pendingArmageddon?.stage).toBe("TARGET_CHOOSE");

    // Anti-cheat check: Seat 2 MUST NOT see `godcatGivenToTarget`, while Seat 1 DOES see it!
    const s2ArmView = implodingKittensCartridge.projectView({
      state: afterPlace.state,
      viewerSeatNo: 2,
    });
    const s1ArmView = implodingKittensCartridge.projectView({
      state: afterPlace.state,
      viewerSeatNo: 1,
    });
    expect(s2ArmView.pendingArmageddon?.godcatGivenToTarget).toBeNull();
    expect(s1ArmView.pendingArmageddon?.godcatGivenToTarget).toBe(false);

    // Seat 2 chooses SWAP (swap: true) -> Seat 2 steals Godcat, Seat 1 gets Devilcat and burns Defuse to survive!
    // Armageddon also ends Seat 1's turn -> activeSeatNo advances to Seat 2!
    const afterDecide = implodingKittensCartridge.reduce({
      state: afterPlace.state,
      actorSeatNo: 2,
      nowMs: 1200,
      command: { type: "ARMAGEDDON_DECIDE", swap: true },
    });
    expect(afterDecide.state.step).toBe("TurnPlayStep");
    expect(afterDecide.state.activeSeatNo).toBe(2);
    expect(afterDecide.state.godcatOnPlaymat).toBe(false);
    expect(afterDecide.state.seats[1].hand.some((c) => c.type === "godcat")).toBe(
      true
    );
    expect(afterDecide.state.seats[0].alive).toBe(true);
    expect(afterDecide.state.seats[0].hand.some((c) => c.type === "defuse")).toBe(
      false
    );

    // 3. While Godcat is off Playmat, Seat 2 CANNOT play Armageddon!
    expect(() =>
      implodingKittensCartridge.reduce({
        state: afterDecide.state,
        actorSeatNo: 2,
        nowMs: 1250,
        command: { type: "PLAY_CARD", cardId: "s2-arm2", targetSeatNo: 1 },
      })
    ).toThrow(/Thảm đấu/);

    // 4. Godcat CANNOT be played as Nope!
    const s2Godcat = afterDecide.state.seats[1].hand.find(
      (c) => c.type === "godcat"
    )!;
    expect(() =>
      implodingKittensCartridge.reduce({
        state: afterDecide.state,
        actorSeatNo: 2,
        nowMs: 1260,
        command: {
          type: "PLAY_CARD",
          cardId: s2Godcat.id,
          mimicCardType: "nope",
        },
      })
    ).toThrow();

    // 5. Seat 2 plays Godcat mimicking `shuffle` -> Godcat returns to Playmat (NOT Discard Pile!)
    const discardBeforeGodcat = afterDecide.state.discardPile.length;
    const afterGodcatShuffle = implodingKittensCartridge.reduce({
      state: afterDecide.state,
      actorSeatNo: 2,
      nowMs: 1300,
      command: {
        type: "PLAY_CARD",
        cardId: s2Godcat.id,
        mimicCardType: "shuffle",
      },
    });
    expect(afterGodcatShuffle.state.godcatOnPlaymat).toBe(true);
    expect(
      afterGodcatShuffle.state.discardPile.some((c) => c.type === "godcat")
    ).toBe(false);
    expect(afterGodcatShuffle.state.discardPile).toHaveLength(
      discardBeforeGodcat
    );

    // 6. Raising Heck: Put an Exploding Kitten at the BOTTOM of drawPile (index 0)
    afterGodcatShuffle.state.drawPile.unshift({
      id: "bottom-bomb-heck",
      type: "exploding_kitten",
    });
    const afterHeckPlay = implodingKittensCartridge.reduce({
      state: afterGodcatShuffle.state,
      actorSeatNo: 2,
      nowMs: 1350,
      command: { type: "PLAY_CARD", cardId: "s2-heck" },
    });
    expect(afterHeckPlay.state.step).toBe("RaisingHeckStep");
    // Anti-cheat: Seat 3 cannot see bottomCard; Seat 2 sees the bomb!
    expect(
      implodingKittensCartridge.projectView({
        state: afterHeckPlay.state,
        viewerSeatNo: 3,
      }).pendingRaisingHeck?.bottomCard
    ).toBeNull();
    expect(
      implodingKittensCartridge.projectView({
        state: afterHeckPlay.state,
        viewerSeatNo: 2,
      }).pendingRaisingHeck?.bottomCard?.id
    ).toBe("bottom-bomb-heck");

    // Seat 2 chooses to put the bottom bomb directly on TOP of drawPile without exploding, ending Seat 2's turn!
    const afterHeckTop = implodingKittensCartridge.reduce({
      state: afterHeckPlay.state,
      actorSeatNo: 2,
      nowMs: 1400,
      command: { type: "RAISING_HECK_DECIDE", takeToHand: false },
    });
    expect(afterHeckTop.state.step).toBe("TurnPlayStep");
    expect(afterHeckTop.state.activeSeatNo).toBe(3);
    expect(
      afterHeckTop.state.drawPile[afterHeckTop.state.drawPile.length - 1].id
    ).toBe("bottom-bomb-heck");

    // 7. Godcat as Emergency Defuse: give Seat 3 Godcat, Seat 3 draws the top Exploding Kitten -> Godcat defuses it and returns to Playmat!
    afterHeckTop.state.godcatOnPlaymat = false;
    afterHeckTop.state.seats[2].hand.push({
      id: "s3-godcat-defuse",
      type: "godcat",
    });
    const afterS3DrawBomb = implodingKittensCartridge.reduce({
      state: afterHeckTop.state,
      actorSeatNo: 3,
      nowMs: 1450,
      command: { type: "DRAW_CARD" },
    });
    expect(afterS3DrawBomb.state.step).toBe("DefuseInsertStep");
    expect(afterS3DrawBomb.state.godcatOnPlaymat).toBe(true);
    expect(
      afterS3DrawBomb.state.seats[2].hand.some((c) => c.type === "godcat")
    ).toBe(false);
    expect(
      afterS3DrawBomb.state.discardPile.some((c) => c.type === "godcat")
    ).toBe(false);
  });

  it("allows Combo 5 to recover a Defuse buried >14 cards deep in discardPile and blocks recovering Bombs", () => {
    const init = implodingKittensCartridge.createInitialState({
      config: implodingKittensCartridge.defaultConfig(2),
      seats: SAMPLE_SEATS.slice(0, 2),
      nowMs: 1000,
    });

    const [s1, s2] = init.state.seats;
    s1.hand = [
      { id: "c1", type: "tacocat" },
      { id: "c2", type: "catermelon" },
      { id: "c3", type: "beard_cat" },
      { id: "c4", type: "rainbow_cat" },
      { id: "c5", type: "skip" },
    ];
    s2.hand = [{ id: "s2-skip", type: "skip" }];

    // Bury a Defuse at index 0 of discardPile under 18 other cards + 1 dead Exploding Kitten
    init.state.discardPile = [
      { id: "buried-defuse", type: "defuse" },
      { id: "dead-bomb", type: "exploding_kitten" },
      ...Array.from({ length: 18 }, (_, i) => ({
        id: `filler-${i}`,
        type: "shuffle" as const,
      })),
    ];

    // View exposes buried-defuse (>14 cards deep) and filters out dead-bomb!
    const view = implodingKittensCartridge.projectView({
      state: init.state,
      viewerSeatNo: 1,
    });
    expect(view.discardPileCards.some((c) => c.id === "buried-defuse")).toBe(
      true
    );
    expect(view.discardPileCards.some((c) => c.id === "dead-bomb")).toBe(false);

    // Rejects picking a Bomb from discardPile
    expect(() =>
      implodingKittensCartridge.reduce({
        state: init.state,
        actorSeatNo: 1,
        nowMs: 1100,
        command: {
          type: "PLAY_COMBO_5",
          cardIds: ["c1", "c2", "c3", "c4", "c5"],
          discardCardId: "dead-bomb",
        },
      })
    ).toThrow(/Bom/);

    // Recovers the buried Defuse cleanly
    const afterCombo5 = implodingKittensCartridge.reduce({
      state: init.state,
      actorSeatNo: 1,
      nowMs: 1150,
      command: {
        type: "PLAY_COMBO_5",
        cardIds: ["c1", "c2", "c3", "c4", "c5"],
        discardCardId: "buried-defuse",
      },
    });
    expect(
      afterCombo5.state.seats[0].hand.some((c) => c.id === "buried-defuse")
    ).toBe(true);
    expect(
      afterCombo5.state.discardPile.some((c) => c.id === "buried-defuse")
    ).toBe(false);
  });
});
