import { describe, expect, it } from "vitest";
import {
  implodingKittensCartridge,
  type IkMatchState,
} from "@/cartridges/imploding-kittens";
import type {
  CartridgeTransitionResult,
  SeatDescriptor,
} from "@/cartridges/types";

function settleNopeWindow(
  res: CartridgeTransitionResult<IkMatchState>,
  nowMs: number
): CartridgeTransitionResult<IkMatchState> {
  if (res.state.step !== "NopeWindowStep") return res;
  return implodingKittensCartridge.onPhaseTimeout({
    state: res.state,
    nowMs: nowMs + 3000,
  });
}

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

    // Verify starting player is picked randomly via rng (not hardcoded to Seat 1!)
    const startS1 = implodingKittensCartridge.createInitialState({
      config: implodingKittensCartridge.defaultConfig(3),
      seats: SAMPLE_SEATS,
      nowMs: 1000,
      rng: () => 0.0,
    });
    const startS2 = implodingKittensCartridge.createInitialState({
      config: implodingKittensCartridge.defaultConfig(3),
      seats: SAMPLE_SEATS,
      nowMs: 1000,
      rng: () => 0.5,
    });
    const startS3 = implodingKittensCartridge.createInitialState({
      config: implodingKittensCartridge.defaultConfig(3),
      seats: SAMPLE_SEATS,
      nowMs: 1000,
      rng: () => 0.99,
    });
    expect(startS1.state.activeSeatNo).toBe(1);
    expect(startS2.state.activeSeatNo).toBe(2);
    expect(startS3.state.activeSeatNo).toBe(3);
  });

  it("handles Imploding Kitten two-stage rule: 1st draw flips it FACE UP and inserts into deck; 2nd draw while FACE UP eliminates player bypassing Defuse", () => {
    const init = implodingKittensCartridge.createInitialState({
      config: implodingKittensCartridge.defaultConfig(2),
      seats: SAMPLE_SEATS.slice(0, 2),
      nowMs: 1000,
      rng: () => 0,
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
      rng: () => 0,
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

    // Seat 1 counter-plays Nope (YUP!) -> no opponent holds Nope anymore, so resolves IMMEDIATELY into Combo2PickStep!
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
    // Verify COMBO_STEAL privacy: thief (Seat 1) and victim (Seat 2) both see the stolen card, while Seat 3 does NOT!
    expect(
      implodingKittensCartridge.projectView({
        state: afterPick.state,
        viewerSeatNo: 1,
      }).lastAnim?.card?.id
    ).toBe("s2-prize");
    expect(
      implodingKittensCartridge.projectView({
        state: afterPick.state,
        viewerSeatNo: 2,
      }).lastAnim?.card?.id
    ).toBe("s2-prize");
    expect(
      implodingKittensCartridge.projectView({
        state: afterPick.state,
        viewerSeatNo: 3,
      }).lastAnim?.card
    ).toBeUndefined();

    // Seat 1 plays Targeted Attack on Seat 3 -> Seat 3 now owes 2 turns!
    const afterTargetAtk = settleNopeWindow(
      implodingKittensCartridge.reduce({
        state: afterPick.state,
        actorSeatNo: 1,
        nowMs: 1400,
        command: {
          type: "PLAY_CARD",
          cardId: "s1-target-atk",
          targetSeatNo: 3,
        },
      }),
      1400
    );
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
    const afterRev = settleNopeWindow(
      implodingKittensCartridge.reduce({
        state: afterS3Draw.state,
        actorSeatNo: 3,
        nowMs: 1600,
        command: { type: "PLAY_CARD", cardId: "s3-reverse" },
      }),
      1600
    );
    expect(afterRev.state.direction).toBe(-1);
    expect(afterRev.state.activeSeatNo).toBe(2);
  });

  it("supports Barking Kittens Tower of Power: 6 stash cards intercept steals (Favor/Combo 2) and holder can claim 1 card + shuffle rest into deck", () => {
    const init = implodingKittensCartridge.createInitialState({
      config: implodingKittensCartridge.defaultConfig(2),
      seats: SAMPLE_SEATS.slice(0, 2),
      nowMs: 1000,
      rng: () => 0,
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
    const afterTower = settleNopeWindow(
      implodingKittensCartridge.reduce({
        state: init.state,
        actorSeatNo: 1,
        nowMs: 1100,
        command: { type: "PLAY_CARD", cardId: "s1-tower" },
      }),
      1100
    );
    expect(afterTower.state.towerHolderSeatNo).toBe(1);
    expect(afterTower.state.towerStashCards).toHaveLength(6);

    const afterSkip1 = settleNopeWindow(
      implodingKittensCartridge.reduce({
        state: afterTower.state,
        actorSeatNo: 1,
        nowMs: 1200,
        command: { type: "PLAY_CARD", cardId: "s1-skip" },
      }),
      1200
    );
    expect(afterSkip1.state.activeSeatNo).toBe(2);

    // Seat 2 plays Favor on Seat 1 -> intercepted by Tower! Seat 1's hand is untouched, stash drops 6 -> 5
    const afterFavor = settleNopeWindow(
      implodingKittensCartridge.reduce({
        state: afterSkip1.state,
        actorSeatNo: 2,
        nowMs: 1300,
        command: { type: "PLAY_CARD", cardId: "s2-favor", targetSeatNo: 1 },
      }),
      1300
    );
    expect(afterFavor.state.step).toBe("TurnPlayStep");
    expect(afterFavor.state.towerStashCards).toHaveLength(5);
    expect(afterFavor.state.seats[0].hand.map((c) => c.id)).toEqual([
      "s1-secret-defuse",
    ]);

    // Seat 2 plays Combo 2 on Seat 1 -> intercepted again! Stash drops 5 -> 4
    const afterCombo2 = settleNopeWindow(
      implodingKittensCartridge.reduce({
        state: afterFavor.state,
        actorSeatNo: 2,
        nowMs: 1400,
        command: {
          type: "PLAY_COMBO_2",
          cardIds: ["s2-cat1", "s2-cat2"],
          targetSeatNo: 1,
        },
      }),
      1400
    );
    expect(afterCombo2.state.towerStashCards).toHaveLength(4);
    expect(afterCombo2.state.seats[0].hand.map((c) => c.id)).toEqual([
      "s1-secret-defuse",
    ]);

    // Seat 2 skips back to Seat 1; Seat 1 claims 1 card from Tower and shuffles the remaining 3 into drawPile!
    const afterSkip2 = settleNopeWindow(
      implodingKittensCartridge.reduce({
        state: afterCombo2.state,
        actorSeatNo: 2,
        nowMs: 1500,
        command: { type: "PLAY_CARD", cardId: "s2-skip" },
      }),
      1500
    );
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
      rng: () => 0,
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
    const afterReveal = settleNopeWindow(
      implodingKittensCartridge.reduce({
        state: init.state,
        actorSeatNo: 1,
        nowMs: 1050,
        command: { type: "PLAY_CARD", cardId: "s1-reveal" },
      }),
      1050
    );
    expect(afterReveal.state.step).toBe("TurnPlayStep");
    expect(afterReveal.state.seats[0].privateVision?.cards).toHaveLength(3);
    expect(afterReveal.state.seats[1].privateVision?.cards).toHaveLength(3);
    expect(afterReveal.state.seats[2].privateVision?.cards).toHaveLength(3);

    // 2. Seat 1 plays Armageddon targeting Seat 2 -> enters ArmageddonStep (ACTOR_PLACE)
    const afterArmPlay = settleNopeWindow(
      implodingKittensCartridge.reduce({
        state: afterReveal.state,
        actorSeatNo: 1,
        nowMs: 1100,
        command: { type: "PLAY_CARD", cardId: "s1-arm1", targetSeatNo: 2 },
      }),
      1100
    );
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
    const afterGodcatShuffle = settleNopeWindow(
      implodingKittensCartridge.reduce({
        state: afterDecide.state,
        actorSeatNo: 2,
        nowMs: 1300,
        command: {
          type: "PLAY_CARD",
          cardId: s2Godcat.id,
          mimicCardType: "shuffle",
        },
      }),
      1300
    );
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
    const afterHeckPlay = settleNopeWindow(
      implodingKittensCartridge.reduce({
        state: afterGodcatShuffle.state,
        actorSeatNo: 2,
        nowMs: 1350,
        command: { type: "PLAY_CARD", cardId: "s2-heck" },
      }),
      1350
    );
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
      rng: () => 0,
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
    const afterCombo5 = settleNopeWindow(
      implodingKittensCartridge.reduce({
        state: init.state,
        actorSeatNo: 1,
        nowMs: 1150,
        command: {
          type: "PLAY_COMBO_5",
          cardIds: ["c1", "c2", "c3", "c4", "c5"],
          discardCardId: "buried-defuse",
        },
      }),
      1150
    );
    expect(
      afterCombo5.state.seats[0].hand.some((c) => c.id === "buried-defuse")
    ).toBe(true);
    expect(
      afterCombo5.state.discardPile.some((c) => c.id === "buried-defuse")
    ).toBe(false);
  });

  it("allows the room host to customize the number of Exploding Kittens and validates bounds", () => {
    const baseCfg = implodingKittensCartridge.defaultConfig(3);

    expect(
      implodingKittensCartridge.validateConfig(
        { ...baseCfg, explodingKittenCount: 0 },
        3
      ).valid
    ).toBe(false);
    expect(
      implodingKittensCartridge.validateConfig(
        { ...baseCfg, explodingKittenCount: 16 },
        3
      ).valid
    ).toBe(false);
    expect(
      implodingKittensCartridge.validateConfig(
        { ...baseCfg, explodingKittenCount: 7 },
        3
      ).valid
    ).toBe(true);

    const customInit = implodingKittensCartridge.createInitialState({
      config: { ...baseCfg, explodingKittenCount: 7 },
      seats: SAMPLE_SEATS,
      nowMs: 1000,
    });
    const explodingInDeck = customInit.state.drawPile.filter(
      (c) => c.type === "exploding_kitten"
    );
    const implodingInDeck = customInit.state.drawPile.filter(
      (c) => c.type === "imploding_kitten"
    );
    expect(explodingInDeck).toHaveLength(7);
    expect(implodingInDeck).toHaveLength(1);
    expect(customInit.state.config.explodingKittenCount).toBe(7);
  });

  it("opens a 3-second Nope window ONLY when an eligible opponent holds Nope/Super Nope and resolves immediately otherwise", () => {
    const init = implodingKittensCartridge.createInitialState({
      config: implodingKittensCartridge.defaultConfig(3),
      seats: SAMPLE_SEATS,
      nowMs: 1000,
      rng: () => 0,
    });
    expect(init.state.config.timers.nopeSeconds).toBe(3);

    // Case 1: NO opponent holds Nope (only actor & drawPile have Nope) -> resolves IMMEDIATELY (0ms, no lag!)
    init.state.seats[0].hand = [
      { id: "s1-skip", type: "skip" },
      { id: "s1-nope", type: "nope" },
    ];
    init.state.seats[1].hand = [{ id: "s2-skip", type: "skip" }];
    init.state.seats[2].hand = [{ id: "s3-skip", type: "skip" }];
    init.state.drawPile = [{ id: "deck-nope", type: "nope" }];

    const afterSkipNoOppNope = implodingKittensCartridge.reduce({
      state: init.state,
      actorSeatNo: 1,
      nowMs: 2000,
      command: { type: "PLAY_CARD", cardId: "s1-skip" },
    });
    expect(afterSkipNoOppNope.state.step).toBe("TurnPlayStep");
    expect(afterSkipNoOppNope.state.activeSeatNo).toBe(2);

    // Case 2: Seat 3 holds Nope -> opens 3-second NopeWindowStep, ONLY Seat 3 sees canViewerNope=true!
    afterSkipNoOppNope.state.seats[2].hand.push({ id: "s3-nope", type: "nope" });

    const afterS2Skip = implodingKittensCartridge.reduce({
      state: afterSkipNoOppNope.state,
      actorSeatNo: 2,
      nowMs: 6000,
      command: { type: "PLAY_CARD", cardId: "s2-skip" },
    });
    expect(afterS2Skip.state.step).toBe("NopeWindowStep");
    expect(afterS2Skip.phaseDeadlineMs).toBe(9000); // exact 3000ms
    expect(
      implodingKittensCartridge.projectView({
        state: afterS2Skip.state,
        viewerSeatNo: 3,
      }).pendingAction?.canViewerNope
    ).toBe(true);
    expect(
      implodingKittensCartridge.projectView({
        state: afterS2Skip.state,
        viewerSeatNo: 2,
      }).pendingAction?.canViewerNope
    ).toBe(false);

    // When Seat 3 (the only opponent holding Nope besides Seat 1 who also holds Nope) passes,
    // window stays open for Seat 1 until Seat 1 also passes -> then resolves immediately!
    const afterS3Pass = implodingKittensCartridge.reduce({
      state: afterS2Skip.state,
      actorSeatNo: 3,
      nowMs: 6500,
      command: { type: "PASS_NOPE" },
    });
    expect(afterS3Pass.state.step).toBe("NopeWindowStep");

    const afterS1Pass = implodingKittensCartridge.reduce({
      state: afterS3Pass.state,
      actorSeatNo: 1,
      nowMs: 6600,
      command: { type: "PASS_NOPE" },
    });
    expect(afterS1Pass.state.step).toBe("TurnPlayStep");
    expect(afterS1Pass.state.activeSeatNo).toBe(3);
  });

  it("includes 2 Shuffle NOW cards in Zombie Kittens expansion and allows playing Shuffle NOW out of turn without stealing activeSeatNo", () => {
    const init = implodingKittensCartridge.createInitialState({
      config: implodingKittensCartridge.defaultConfig(3),
      seats: SAMPLE_SEATS,
      nowMs: 1000,
      rng: () => 0.25,
    });

    const allCards = [
      ...init.state.drawPile,
      ...init.state.towerStashCards,
      ...init.state.seats.flatMap((s) => s.hand),
    ];
    expect(allCards.filter((c) => c.type === "shuffle_now")).toHaveLength(2);

    // Seat 1 is active (and holds Nope), Seat 2 holds Shuffle NOW and plays it OUT OF TURN!
    init.state.activeSeatNo = 1;
    init.state.seats[0].hand.push({ id: "s1-nope-check", type: "nope" });
    init.state.seats[1].hand.push({ id: "s2-shuffle-now", type: "shuffle_now" });
    init.state.seats[0].privateVision = {
      titleVi: "Soi 3 lá",
      cards: [{ labelVi: "Bỏ Lượt", emoji: "", colorHex: "#38bdf8", cardId: "v1", cardType: "skip" }],
    };

    const afterNowPending = implodingKittensCartridge.reduce({
      state: init.state,
      actorSeatNo: 2,
      nowMs: 2000,
      command: { type: "PLAY_CARD", cardId: "s2-shuffle-now" },
    });
    // Still enters uniform 3s NopeWindowStep (can be Noped!)
    expect(afterNowPending.state.step).toBe("NopeWindowStep");
    expect(afterNowPending.state.activeSeatNo).toBe(1);

    const afterNowResolved = settleNopeWindow(afterNowPending, 2000);
    expect(afterNowResolved.state.step).toBe("TurnPlayStep");
    // Active turn remains Seat 1, while Seat 1's stale privateVision is cleared after shuffle!
    expect(afterNowResolved.state.activeSeatNo).toBe(1);
    expect(afterNowResolved.state.seats[0].privateVision).toBeNull();
    expect(
      afterNowResolved.state.discardPile.some((c) => c.id === "s2-shuffle-now")
    ).toBe(true);

    // Seat 3 also plays Clairvoyance NOW out of turn while Seat 1 is still active!
    afterNowResolved.state.seats[2].hand.push({
      id: "s3-clairvoyance-now",
      type: "clairvoyance",
    });
    const afterClairNow = settleNopeWindow(
      implodingKittensCartridge.reduce({
        state: afterNowResolved.state,
        actorSeatNo: 3,
        nowMs: 6000,
        command: { type: "PLAY_CARD", cardId: "s3-clairvoyance-now" },
      }),
      6000
    );
    expect(afterClairNow.state.activeSeatNo).toBe(1);
    expect(afterClairNow.state.seats[2].privateVision).not.toBeNull();

    // Seat 2 plays Feed the Dead NOW out of turn while Seat 3 is dead -> opens GarbagePickStep without changing activeSeatNo!
    afterClairNow.state.seats[2].alive = false;
    afterClairNow.state.seats[1].hand.push({
      id: "s2-feed-now",
      type: "feed_the_dead",
    });
    const afterFeedNow = settleNopeWindow(
      implodingKittensCartridge.reduce({
        state: afterClairNow.state,
        actorSeatNo: 2,
        nowMs: 10000,
        command: { type: "PLAY_CARD", cardId: "s2-feed-now" },
      }),
      10000
    );
    expect(afterFeedNow.state.activeSeatNo).toBe(1);
    expect(afterFeedNow.state.step).toBe("GarbagePickStep");
    expect(afterFeedNow.state.pendingGroupSubmit?.mode).toBe("FEED_THE_DEAD");
  });

  it("hides real card types in projectView when blinded (Curse of the Cat Butt) and handles blind plays without leaking errors", () => {
    const init = implodingKittensCartridge.createInitialState({
      config: implodingKittensCartridge.defaultConfig(3),
      seats: SAMPLE_SEATS,
      nowMs: 1000,
      rng: () => 0,
    });

    init.state.activeSeatNo = 1;
    init.state.seats[0].isBlind = true;
    init.state.seats[0].hand = [
      { id: "blind-defuse", type: "defuse" },
      { id: "blind-skip", type: "skip" },
      { id: "blind-nope", type: "nope" },
    ];

    // Anti-cheat projection: blinded player's hand MUST mask every real card type!
    const blindView = implodingKittensCartridge.projectView({
      state: init.state,
      viewerSeatNo: 1,
    });
    expect(blindView.myIsBlind).toBe(true);
    expect(blindView.myHand.every((c) => c.type === "tacocat")).toBe(true);

    // Blind play of a non-standalone card (Defuse) wastes it to discardPile without throwing an error!
    const afterWaste = implodingKittensCartridge.reduce({
      state: init.state,
      actorSeatNo: 1,
      nowMs: 1200,
      command: { type: "PLAY_CARD", cardId: "blind-defuse" },
    });
    expect(afterWaste.state.step).toBe("TurnPlayStep");
    expect(afterWaste.state.activeSeatNo).toBe(1);
    expect(
      afterWaste.state.discardPile.some((c) => c.id === "blind-defuse")
    ).toBe(true);

    // Blind play of a valid action card (Skip) executes normally after the 3s window!
    const afterBlindSkip = settleNopeWindow(
      implodingKittensCartridge.reduce({
        state: afterWaste.state,
        actorSeatNo: 1,
        nowMs: 1300,
        command: { type: "PLAY_CARD", cardId: "blind-skip" },
      }),
      1300
    );
    expect(afterBlindSkip.state.activeSeatNo).toBe(2);
  });

  it("supports Pokepri Expansion: Super Nope cancels an action immediately and cannot be Noped on top", () => {
    const init = implodingKittensCartridge.createInitialState({
      config: implodingKittensCartridge.defaultConfig(3),
      seats: SAMPLE_SEATS,
      nowMs: 1000,
      rng: () => 0.1,
    });

    const allCards = [
      ...init.state.drawPile,
      ...init.state.towerStashCards,
      ...init.state.seats.flatMap((s) => s.hand),
    ];
    expect(allCards.filter((c) => c.type === "super_nope")).toHaveLength(2);

    // Seat 1 plays Skip (and holds a regular Nope ready to counter-Yup!)
    // Seat 2 holds Super Nope!
    init.state.activeSeatNo = 1;
    init.state.seats[0].hand = [
      { id: "s1-skip", type: "skip" },
      { id: "s1-nope", type: "nope" },
    ];
    init.state.seats[1].hand = [{ id: "s2-super-nope", type: "super_nope" }];
    init.state.seats[2].hand = [{ id: "s3-nope", type: "nope" }];

    const afterSkip = implodingKittensCartridge.reduce({
      state: init.state,
      actorSeatNo: 1,
      nowMs: 2000,
      command: { type: "PLAY_CARD", cardId: "s1-skip" },
    });
    expect(afterSkip.state.step).toBe("NopeWindowStep");
    expect(
      implodingKittensCartridge.projectView({
        state: afterSkip.state,
        viewerSeatNo: 2,
      }).pendingAction?.canViewerSuperNope
    ).toBe(true);

    // Seat 2 plays SUPER NOPE -> cancels Seat 1's Skip IMMEDIATELY (bypasses any further Nope window even though Seat 1 & Seat 3 hold Nope!)
    const afterSuperNope = implodingKittensCartridge.reduce({
      state: afterSkip.state,
      actorSeatNo: 2,
      nowMs: 2500,
      command: { type: "PLAY_SUPER_NOPE", cardId: "s2-super-nope" },
    });
    expect(afterSuperNope.state.step).toBe("TurnPlayStep");
    expect(afterSuperNope.state.activeSeatNo).toBe(1); // Skip was canceled -> still Seat 1's turn!
    expect(
      afterSuperNope.state.discardPile.some((c) => c.id === "s2-super-nope")
    ).toBe(true);
  });

  it("supports all 5 additional Pokepri Expansion cards (Black Hole, Back From The Dead, Copycat, Fossil Restoration, Purrfect Boost)", () => {
    const init = implodingKittensCartridge.createInitialState({
      config: implodingKittensCartridge.defaultConfig(3),
      seats: SAMPLE_SEATS,
      nowMs: 1000,
      rng: () => 0.15,
    });

    const allCards = [
      ...init.state.drawPile,
      ...init.state.towerStashCards,
      ...init.state.seats.flatMap((s) => s.hand),
    ];
    expect(allCards.filter((c) => c.type === "black_hole")).toHaveLength(1);
    expect(allCards.filter((c) => c.type === "back_from_the_dead")).toHaveLength(2);
    expect(allCards.filter((c) => c.type === "copycat")).toHaveLength(2);
    expect(allCards.filter((c) => c.type === "fossil_restoration")).toHaveLength(2);
    expect(allCards.filter((c) => c.type === "purrfect_boost")).toHaveLength(2);

    // 1. BLACK HOLE: face-down -> INSERT_BLACK_HOLE_FACEUP; then face-up -> shuffles entire hand into drawPile & survives!
    init.state.activeSeatNo = 1;
    init.state.seats[0].hand = [
      { id: "s1-h1", type: "skip" },
      { id: "s1-h2", type: "tacocat" },
    ];
    init.state.seats[1].hand = [
      { id: "s2-h1", type: "skip" },
      { id: "s2-h2", type: "favor" },
      { id: "s2-h3", type: "shuffle" },
    ];
    init.state.seats[2].hand = [
      { id: "s3-bftd", type: "back_from_the_dead" },
      { id: "s3-boost", type: "purrfect_boost" },
      { id: "s3-atk", type: "attack" },
      { id: "s3-copy", type: "copycat" },
      { id: "s3-fossil", type: "fossil_restoration" },
    ];
    init.state.drawPile = [
      { id: "d-safe", type: "tacocat" },
      { id: "d-bh", type: "black_hole", faceUp: false },
    ];
    init.state.discardPile = [];

    const afterBhFirst = implodingKittensCartridge.reduce({
      state: init.state,
      actorSeatNo: 1,
      nowMs: 2000,
      command: { type: "DRAW_CARD" },
    });
    expect(afterBhFirst.state.step).toBe("DefuseInsertStep");
    expect(afterBhFirst.state.pendingInsert?.reason).toBe(
      "INSERT_BLACK_HOLE_FACEUP"
    );
    expect(afterBhFirst.state.pendingInsert?.card.faceUp).toBe(true);

    // Seat 1 puts Black Hole face-up at top (#0) for Seat 2!
    const afterBhInsert = implodingKittensCartridge.reduce({
      state: afterBhFirst.state,
      actorSeatNo: 1,
      nowMs: 2100,
      command: { type: "INSERT_CARD", insertIndex: 0 },
    });
    expect(afterBhInsert.state.activeSeatNo).toBe(2);

    // Seat 2 draws face-up Black Hole -> stays alive with 0 cards; all 3 cards shuffled into drawPile!
    const afterBhSuck = implodingKittensCartridge.reduce({
      state: afterBhInsert.state,
      actorSeatNo: 2,
      nowMs: 2200,
      command: { type: "DRAW_CARD" },
    });
    expect(afterBhSuck.state.seats[1].alive).toBe(true);
    expect(afterBhSuck.state.seats[1].hand).toHaveLength(0);
    expect(afterBhSuck.state.drawPile.length).toBe(4); // d-safe + 3 sucked cards
    expect(
      afterBhSuck.state.discardPile.some((c) => c.id === "d-bh")
    ).toBe(true);

    // 2. BACK FROM THE DEAD (+ Purrfect Boost = draw 3 cards off exploded player!)
    // Simulate Seat 1 exploding while holding 3 cards
    afterBhSuck.state.activeSeatNo = 1;
    afterBhSuck.state.seats[0].hand = [
      { id: "dead-c1", type: "skip" },
      { id: "dead-c2", type: "favor" },
      { id: "dead-c3", type: "shuffle" },
    ];
    afterBhSuck.state.drawPile.push({ id: "boom-1", type: "exploding_kitten" });
    const afterS1Boom = implodingKittensCartridge.reduce({
      state: afterBhSuck.state,
      actorSeatNo: 1,
      nowMs: 2500,
      command: { type: "DRAW_CARD" },
    });
    expect(afterS1Boom.state.seats[0].alive).toBe(false);
    expect(afterS1Boom.state.lastExplodedSeatNo).toBe(1);
    expect(afterS1Boom.state.lastExplodedStash).toHaveLength(3);

    // Seat 3 plays Back From The Dead + Purrfect Boost -> draws all 3 cards from Seat 1!
    afterS1Boom.state.activeSeatNo = 3;
    const afterBoostedBftd = settleNopeWindow(
      implodingKittensCartridge.reduce({
        state: afterS1Boom.state,
        actorSeatNo: 3,
        nowMs: 3000,
        command: {
          type: "PLAY_BOOSTED_CARD",
          boostCardId: "s3-boost",
          targetCardId: "s3-bftd",
        },
      }),
      3000
    );
    const s3Ids = afterBoostedBftd.state.seats[2].hand.map((c) => c.id);
    expect(s3Ids).toContain("dead-c1");
    expect(s3Ids).toContain("dead-c2");
    expect(s3Ids).toContain("dead-c3");

    // 3. COPYCAT: rejects copying Cat card, copies last Action card (Skip)!
    afterBoostedBftd.state.discardPile.push({ id: "top-cat", type: "tacocat" });
    expect(() =>
      implodingKittensCartridge.reduce({
        state: afterBoostedBftd.state,
        actorSeatNo: 3,
        nowMs: 7000,
        command: { type: "PLAY_CARD", cardId: "s3-copy" },
      })
    ).toThrow(/Copycat/);

    afterBoostedBftd.state.discardPile.push({ id: "top-see3", type: "see_future_3" });
    const afterCopycat = settleNopeWindow(
      implodingKittensCartridge.reduce({
        state: afterBoostedBftd.state,
        actorSeatNo: 3,
        nowMs: 7100,
        command: { type: "PLAY_CARD", cardId: "s3-copy" },
      }),
      7100
    );
    expect(afterCopycat.state.seats[2].privateVision).not.toBeNull();

    // 4. FOSSIL RESTORATION: shuffles chosen non-kitten card from discardPile into drawPile & ends turn!
    const deckCountBeforeFossil = afterCopycat.state.drawPile.length;
    const afterFossil = settleNopeWindow(
      implodingKittensCartridge.reduce({
        state: afterCopycat.state,
        actorSeatNo: 3,
        nowMs: 11000,
        command: {
          type: "PLAY_CARD",
          cardId: "s3-fossil",
          discardCardId: "top-see3",
        },
      }),
      11000
    );
    expect(afterFossil.state.drawPile.length).toBe(deckCountBeforeFossil + 1);
    expect(
      afterFossil.state.drawPile.some((c) => c.id === "top-see3")
    ).toBe(true);
    expect(
      afterFossil.state.discardPile.some((c) => c.id === "top-see3")
    ).toBe(false);
    expect(afterFossil.state.activeSeatNo).toBe(2); // Turn ended without drawing!

    // 5. PURRFECT BOOST + ATTACK = +3 turns (instead of 2)!
    afterFossil.state.seats[1].hand = [
      { id: "s2-atk", type: "attack" },
      { id: "s2-boost", type: "purrfect_boost" },
    ];
    const afterBoostedAtk = settleNopeWindow(
      implodingKittensCartridge.reduce({
        state: afterFossil.state,
        actorSeatNo: 2,
        nowMs: 15000,
        command: {
          type: "PLAY_BOOSTED_CARD",
          boostCardId: "s2-boost",
          targetCardId: "s2-atk",
        },
      }),
      15000
    );
    expect(afterBoostedAtk.state.activeSeatNo).toBe(3);
    expect(afterBoostedAtk.state.turnsRemaining).toBe(3);
  });

  it("supports Pokepri Last Resort (un-nopeable & blocks Attack stacking) and Sneak Peek (private random 3/4 card peek)", () => {
    const init = implodingKittensCartridge.createInitialState({
      config: implodingKittensCartridge.defaultConfig(3),
      seats: SAMPLE_SEATS,
      nowMs: 1000,
      rng: () => 0.2,
    });

    const allCards = [
      ...init.state.drawPile,
      ...init.state.towerStashCards,
      ...init.state.seats.flatMap((s) => s.hand),
    ];
    expect(allCards.filter((c) => c.type === "last_resort")).toHaveLength(2);
    expect(allCards.filter((c) => c.type === "sneak_peek")).toHaveLength(2);

    // Setup: Seat 1 has Sneak Peek + Purrfect Boost + Last Resort; Seat 2 & Seat 3 hold Nope/Super Nope & Attacks!
    init.state.activeSeatNo = 1;
    init.state.seats[0].hand = [
      { id: "s1-peek", type: "sneak_peek" },
      { id: "s1-boost", type: "purrfect_boost" },
      { id: "s1-lr", type: "last_resort" },
    ];
    init.state.seats[1].hand = [
      { id: "s2-c1", type: "defuse" },
      { id: "s2-c2", type: "tacocat" },
      { id: "s2-c3", type: "skip" },
      { id: "s2-c4", type: "super_nope" },
      { id: "s2-atk", type: "attack" },
    ];
    init.state.seats[2].hand = [
      { id: "s3-nope", type: "nope" },
      { id: "s3-atk", type: "targeted_attack" },
      { id: "s3-sskip", type: "super_skip" },
    ];
    init.state.drawPile = [
      { id: "d1", type: "tacocat" },
      { id: "d2", type: "catermelon" },
    ];

    // 1. SNEAK PEEK + PURRFECT BOOST -> privately reveals 4 random cards from Seat 2's hand ONLY to Seat 1!
    const afterPeek = settleNopeWindow(
      implodingKittensCartridge.reduce({
        state: init.state,
        actorSeatNo: 1,
        nowMs: 2000,
        command: {
          type: "PLAY_BOOSTED_CARD",
          boostCardId: "s1-boost",
          targetCardId: "s1-peek",
          targetSeatNo: 2,
        },
      }),
      2000
    );
    expect(afterPeek.state.activeSeatNo).toBe(1); // Does not end turn
    expect(afterPeek.state.seats[0].privateVision?.cards).toHaveLength(4);
    expect(afterPeek.state.seats[1].hand).toHaveLength(5); // Target's hand untouched
    expect(
      implodingKittensCartridge.projectView({
        state: afterPeek.state,
        viewerSeatNo: 3,
      }).myPrivateVision
    ).toBeNull();

    // 2. LAST RESORT targeting Seat 3 -> resolves IMMEDIATELY (bypasses NopeWindowStep even though Seat 2 has Super Nope & Seat 3 has Nope!)
    const afterLr = implodingKittensCartridge.reduce({
      state: afterPeek.state,
      actorSeatNo: 1,
      nowMs: 6000,
      command: {
        type: "PLAY_CARD",
        cardId: "s1-lr",
        targetSeatNo: 3,
      },
    });
    expect(afterLr.state.step).toBe("TurnPlayStep");
    expect(afterLr.state.activeSeatNo).toBe(3);
    expect(afterLr.state.turnsRemaining).toBe(2);
    expect(afterLr.state.attackLocked).toBe(true);

    // Seat 3 CANNOT stack an Attack on top of Last Resort!
    expect(() =>
      implodingKittensCartridge.reduce({
        state: afterLr.state,
        actorSeatNo: 3,
        nowMs: 6100,
        command: {
          type: "PLAY_CARD",
          cardId: "s3-atk",
          targetSeatNo: 1,
        },
      })
    ).toThrow(/Last Resort/);

    // Seat 3 CAN escape with Super Skip, which passes the turn to Seat 1 and clears attackLocked!
    const afterEscape = settleNopeWindow(
      implodingKittensCartridge.reduce({
        state: afterLr.state,
        actorSeatNo: 3,
        nowMs: 6200,
        command: { type: "PLAY_CARD", cardId: "s3-sskip" },
      }),
      6200
    );
    expect(afterEscape.state.activeSeatNo).toBe(1);
    expect(afterEscape.state.attackLocked).toBe(false);

    // 3. FAVOR + PURRFECT BOOST -> requires target to give 2 cards in sequence (remainingCount: 2 -> 1 -> done)!
    afterEscape.state.seats[0].hand = [
      { id: "s1-favor", type: "favor" },
      { id: "s1-boost-favor", type: "purrfect_boost" },
    ];
    afterEscape.state.seats[1].hand = [
      { id: "s2-give-1", type: "tacocat" },
      { id: "s2-give-2", type: "beard_cat" },
      { id: "s2-keep-3", type: "defuse" },
    ];

    const afterBoostedFavor = settleNopeWindow(
      implodingKittensCartridge.reduce({
        state: afterEscape.state,
        actorSeatNo: 1,
        nowMs: 10000,
        command: {
          type: "PLAY_BOOSTED_CARD",
          boostCardId: "s1-boost-favor",
          targetCardId: "s1-favor",
          targetSeatNo: 2,
        },
      }),
      10000
    );
    expect(afterBoostedFavor.state.step).toBe("FavorGiveStep");
    expect(afterBoostedFavor.state.pendingFavor).toEqual({
      fromSeatNo: 2,
      toSeatNo: 1,
      remainingCount: 2,
    });

    const afterGive1 = implodingKittensCartridge.reduce({
      state: afterBoostedFavor.state,
      actorSeatNo: 2,
      nowMs: 14000,
      command: { type: "GIVE_FAVOR_CARD", cardId: "s2-give-1" },
    });
    expect(afterGive1.state.step).toBe("FavorGiveStep");
    expect(afterGive1.state.pendingFavor?.remainingCount).toBe(1);
    expect(afterGive1.state.seats[0].hand.map((c) => c.id)).toEqual([
      "s2-give-1",
    ]);

    const afterGive2 = implodingKittensCartridge.reduce({
      state: afterGive1.state,
      actorSeatNo: 2,
      nowMs: 14500,
      command: { type: "GIVE_FAVOR_CARD", cardId: "s2-give-2" },
    });
    expect(afterGive2.state.step).toBe("TurnPlayStep");
    expect(afterGive2.state.pendingFavor).toBeNull();
    expect(afterGive2.state.seats[0].hand.map((c) => c.id)).toEqual([
      "s2-give-1",
      "s2-give-2",
    ]);
    expect(afterGive2.state.seats[1].hand.map((c) => c.id)).toEqual([
      "s2-keep-3",
    ]);
  });
});
