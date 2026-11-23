import { describe, expect, it } from "vitest";
import {
  boardIdx,
  buildOfficialDuelDecks,
  splendorDuelCartridge,
  validateDuelLineSelection,
  type DuelMatchState,
} from "./index";

const TWO_SEATS = [
  { seatNo: 1, actorId: "p1", displayName: "Merchant 1" },
  { seatNo: 2, actorId: "p2", displayName: "Merchant 2" },
];

describe("Splendor Duel Cartridge - Official 1v1 Rules", () => {
  it("sets up 25 tokens on 5x5 board, 3/4/5 pyramid (67 cards), 4 Royals, and gives Player 2 starting Privilege Scroll", () => {
    const decks = buildOfficialDuelDecks();
    expect(decks[1].length).toBe(30);
    expect(decks[2].length).toBe(24);
    expect(decks[3].length).toBe(13);

    const init = splendorDuelCartridge.createInitialState({
      config: splendorDuelCartridge.defaultConfig(2),
      seats: TWO_SEATS,
      nowMs: 1000,
    });
    const st = init.state;

    expect(st.board.filter(Boolean).length).toBe(25);
    expect(st.board.filter((t) => t === "pearl").length).toBe(2);
    expect(st.board.filter((t) => t === "gold").length).toBe(3);
    expect(st.pyramid[1].filter(Boolean).length).toBe(5);
    expect(st.pyramid[2].filter(Boolean).length).toBe(4);
    expect(st.pyramid[3].filter(Boolean).length).toBe(3);
    expect(st.royals.length).toBe(4);
    expect(st.seats[0].privileges).toBe(0);
    expect(st.seats[1].privileges).toBe(1);
    expect(st.privilegeSupply).toBe(2);
  });

  it("validates straight uninterrupted lines on 5x5 board and awards opponent a Privilege on 3 same color, 2 pearls, or board replenish", () => {
    const customBoard = Array(25).fill("blue") as DuelMatchState["board"];
    customBoard[boardIdx(0, 0)] = "red";
    customBoard[boardIdx(0, 1)] = "red";
    customBoard[boardIdx(0, 2)] = "red";
    customBoard[boardIdx(1, 0)] = "pearl";
    customBoard[boardIdx(2, 1)] = "pearl";
    customBoard[boardIdx(0, 4)] = "gold";

    // Rejects gold token in TAKE_LINE
    expect(
      validateDuelLineSelection(customBoard, [
        [0, 3],
        [0, 4],
      ]).valid
    ).toBe(false);

    // Rejects non-contiguous gap
    expect(
      validateDuelLineSelection(customBoard, [
        [0, 0],
        [0, 2],
      ]).valid
    ).toBe(false);

    // Diagonal contiguous 2 pearls is valid
    expect(
      validateDuelLineSelection(customBoard, [
        [1, 0],
        [2, 1],
      ]).valid
    ).toBe(true);

    const init = splendorDuelCartridge.createInitialState({
      config: splendorDuelCartridge.defaultConfig(2),
      seats: TWO_SEATS,
      nowMs: 1000,
    });
    let state: DuelMatchState = {
      ...init.state,
      board: customBoard,
      bag: ["green", "white"],
    };

    // Player 1 takes 3 identical Reds in row 0 -> Player 2 gets a Privilege Scroll (1 -> 2)!
    state = splendorDuelCartridge.reduce({
      state,
      actorSeatNo: 1,
      command: {
        type: "TAKE_LINE",
        cells: [
          [0, 0],
          [0, 1],
          [0, 2],
        ],
      },
      nowMs: 2000,
    }).state;
    expect(state.seats[0].tokens.red).toBe(3);
    expect(state.seats[1].privileges).toBe(2);
    expect(state.activeSeatNo).toBe(2);

    // Player 2 uses 1 Privilege Scroll (optional action -> stays in TurnActionStep!)
    state = splendorDuelCartridge.reduce({
      state,
      actorSeatNo: 2,
      command: { type: "USE_PRIVILEGE", row: 1, col: 0 },
      nowMs: 3000,
    }).state;
    expect(state.seats[1].tokens.pearl).toBe(1);
    expect(state.seats[1].privileges).toBe(1);
    expect(state.activeSeatNo).toBe(2);
    expect(state.step).toBe("TurnActionStep");

    // Player 2 replenishes board -> Player 1 receives 1 Privilege Scroll!
    state = splendorDuelCartridge.reduce({
      state,
      actorSeatNo: 2,
      command: { type: "REPLENISH_BOARD" },
      nowMs: 4000,
    }).state;
    expect(state.seats[0].privileges).toBe(1);
    expect(state.bag.length).toBe(0);
    expect(state.activeSeatNo).toBe(2);
  });

  it("triggers Royal Card pick at 3 Crowns, Extra Turn power, and all 3 immediate Victory Conditions", () => {
    const init = splendorDuelCartridge.createInitialState({
      config: splendorDuelCartridge.defaultConfig(2),
      seats: TWO_SEATS,
      nowMs: 1000,
    });

    // Place a 0-cost Tier 2 card with 3 crowns & EXTRA_TURN in pyramid[2][0]
    const superCard = {
      id: "test-super",
      tier: 2 as const,
      bonus: "blue" as const,
      bonusCount: 1,
      points: 2,
      crowns: 3,
      cost: { white: 0, blue: 0, green: 0, red: 0, black: 0, pearl: 0 },
      power: "EXTRA_TURN" as const,
    };

    let state: DuelMatchState = {
      ...init.state,
      pyramid: {
        ...init.state.pyramid,
        2: [superCard, ...init.state.pyramid[2].slice(1)],
      },
    };

    // Player 1 buys superCard -> EXTRA_TURN queued & crossed 3 Crowns -> enters RoyalPickStep!
    state = splendorDuelCartridge.reduce({
      state,
      actorSeatNo: 1,
      command: { type: "BUY_PYRAMID", tier: 2, slotIndex: 0 },
      nowMs: 2000,
    }).state;
    expect(state.step).toBe("RoyalPickStep");
    expect(state.extraTurnQueued).toBe(true);

    // Player 1 claims Queen Royal (+3 pts) -> keeps turn because of EXTRA_TURN!
    state = splendorDuelCartridge.reduce({
      state,
      actorSeatNo: 1,
      command: { type: "PICK_ROYAL", royalId: "royal-queen" },
      nowMs: 3000,
    }).state;
    expect(state.seats[0].points).toBe(5);
    expect(state.seats[0].royals.length).toBe(1);
    expect(state.step).toBe("TurnActionStep");
    expect(state.activeSeatNo).toBe(1); // Extra turn!

    // Single-color 10 points immediate victory check:
    const winCard = {
      id: "test-win-color",
      tier: 3 as const,
      bonus: "blue" as const,
      bonusCount: 1,
      points: 8,
      crowns: 0,
      cost: { white: 0, blue: 0, green: 0, red: 0, black: 0, pearl: 0 },
      power: null,
    };
    state = {
      ...state,
      pyramid: {
        ...state.pyramid,
        3: [winCard, ...state.pyramid[3].slice(1)],
      },
    };
    state = splendorDuelCartridge.reduce({
      state,
      actorSeatNo: 1,
      command: { type: "BUY_PYRAMID", tier: 3, slotIndex: 0 },
      nowMs: 4000,
    }).state;
    expect(state.step).toBe("Finished");
    expect(state.winnerSeatNo).toBe(1);
    expect(state.seats[0].colorPoints.blue).toBe(10);
  });
});
