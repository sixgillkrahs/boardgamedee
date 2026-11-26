import { describe, expect, it } from "vitest";
import {
  BASE_TILE_TEMPLATES,
  buildCarcassonneDeck,
  canPlaceTileAt,
  carcassonneCartridge,
  coordKey,
  RIVER_TILE_TEMPLATES,
  type CarcassonneState,
} from "./index";

const SEATS = [
  { seatNo: 0, actorId: "p1", displayName: "An" },
  { seatNo: 1, actorId: "p2", displayName: "Bình" },
];

describe("carcassonneCartridge", () => {
  it("contains exactly 72 base land tiles and 12 river tiles", () => {
    const baseCount = BASE_TILE_TEMPLATES.reduce((acc, t) => acc + t.count, 0);
    const riverCount = RIVER_TILE_TEMPLATES.reduce((acc, t) => acc + t.count, 0);
    expect(baseCount).toBe(72);
    expect(riverCount).toBe(12);

    const noRiver = buildCarcassonneDeck(
      { enableRiver: false, enableAbbot: true, enableFarmers: true },
      123
    );
    expect(noRiver.startTile.templateCode).toBe("D");
    expect(noRiver.deck.length).toBe(71);

    const withRiver = buildCarcassonneDeck(
      { enableRiver: true, enableAbbot: true, enableFarmers: true },
      123
    );
    expect(withRiver.startTile.templateCode).toBe("RV_SPRING");
    expect(withRiver.deck[10].templateCode).toBe("RV_LAKE");
    expect(withRiver.deck.length).toBe(11 + 71);
  });

  it("validates edge matching & scores completed City (2 pts/tile + 2/pennant) and returns Meeple", () => {
    const init = carcassonneCartridge.createInitialState({
      config: { enableRiver: false, enableAbbot: true, enableFarmers: true },
      seats: SEATS,
      nowMs: 1000,
      rng: () => 0.3,
    });
    // Start tile at (0,0) is D: City N, Road E-W
    // First test DRAW_TILE transition from DrawTileStep -> PlaceTileStep
    expect(init.state.step).toBe("DrawTileStep");
    const drawn = carcassonneCartridge.reduce({
      state: init.state,
      command: { type: "DRAW_TILE" },
      actorSeatNo: 0,
      nowMs: 1000,
    }).state;
    expect(drawn.step).toBe("PlaceTileStep");
    expect(drawn.currentTile).not.toBeNull();

    // Place tile E (City N) rotated 180 deg (City S) at (0, -1) -> completes a 2-tile City!
    let state: CarcassonneState = {
      ...drawn,
      step: "PlaceTileStep",
      currentTile: { templateCode: "E", hasGarden: false },
    };

    // Rotation 0 (City N, Field S) does NOT match City N of (0,0)
    expect(
      canPlaceTileAt(state.board, state.currentTile!, 0, -1, 0)
    ).toBe(false);
    // Rotation 2 (City S) DOES match City N of (0,0)
    expect(
      canPlaceTileAt(state.board, state.currentTile!, 0, -1, 2)
    ).toBe(true);

    state = carcassonneCartridge.reduce({
      state,
      command: { type: "PLACE_TILE", x: 0, y: -1, rotation: 2 },
      actorSeatNo: 0,
      nowMs: 1001,
    }).state;
    expect(state.step).toBe("PlaceMeepleStep");

    // Seat 0 places Knight on City c0 -> immediately completes 2-tile city -> +4 points and Meeple returns!
    state = carcassonneCartridge.reduce({
      state,
      command: { type: "PLACE_MEEPLE", featureId: "c0", meepleType: "standard" },
      actorSeatNo: 0,
      nowMs: 1002,
    }).state;

    expect(state.seats[0].score).toBe(4);
    expect(state.seats[0].scoreBreakdown.cities).toBe(4);
    expect(state.seats[0].meeplesLeft).toBe(7); // returned!
    expect(state.board[coordKey(0, -1)].meeples.length).toBe(0);
    expect(state.activeSeatNo).toBe(1);
  });

  it("supports Abbot placement on Garden and mid-game Recall Abbot scoring", () => {
    const init = carcassonneCartridge.createInitialState({
      config: { enableRiver: false, enableAbbot: true, enableFarmers: true },
      seats: SEATS,
      nowMs: 1000,
      rng: () => 0.4,
    });

    // Give Seat 0 a tile E with a Flower Garden, place at (0, 1) (Field N matches Field S of D)
    let state: CarcassonneState = {
      ...init.state,
      step: "PlaceTileStep",
      currentTile: { templateCode: "E", hasGarden: true },
    };

    // Rotate 180 deg -> Field N, City S -> matches Field S of (0,0)
    state = carcassonneCartridge.reduce({
      state,
      command: { type: "PLACE_TILE", x: 0, y: 1, rotation: 2 },
      actorSeatNo: 0,
      nowMs: 1001,
    }).state;

    // Place Abbot on Garden g0
    state = carcassonneCartridge.reduce({
      state,
      command: { type: "PLACE_MEEPLE", featureId: "g0", meepleType: "abbot" },
      actorSeatNo: 0,
      nowMs: 1002,
    }).state;
    expect(state.seats[0].abbotAvailable).toBe(false);

    // Seat 1 places a tile (B) at (1, 1) adjacent to both (0,0) and (0,1), skips meeple
    state = { ...state, step: "PlaceTileStep", currentTile: { templateCode: "B", hasGarden: false } };
    state = carcassonneCartridge.reduce({
      state,
      command: { type: "PLACE_TILE", x: 1, y: 1, rotation: 0 },
      actorSeatNo: 1,
      nowMs: 1003,
    }).state;
    state = carcassonneCartridge.reduce({
      state,
      command: { type: "SKIP_MEEPLE" },
      actorSeatNo: 1,
      nowMs: 1004,
    }).state;

    // Seat 0 places B at (-1, 1) and RECALLS Abbot (now surrounded by (0,0), (0,1), (1,1), (-1,1) = 4 tiles -> +4 pts!)
    state = { ...state, step: "PlaceTileStep", currentTile: { templateCode: "B", hasGarden: false } };
    state = carcassonneCartridge.reduce({
      state,
      command: { type: "PLACE_TILE", x: -1, y: 1, rotation: 0 },
      actorSeatNo: 0,
      nowMs: 1005,
    }).state;
    state = carcassonneCartridge.reduce({
      state,
      command: { type: "RECALL_ABBOT" },
      actorSeatNo: 0,
      nowMs: 1006,
    }).state;

    expect(state.seats[0].abbotAvailable).toBe(true);
    expect(state.seats[0].score).toBe(4);
    expect(state.seats[0].scoreBreakdown.gardens).toBe(4);
  });

  it("scores Farmers at end-game (3 pts per completed adjacent city)", () => {
    const init = carcassonneCartridge.createInitialState({
      config: { enableRiver: false, enableAbbot: false, enableFarmers: true },
      seats: SEATS,
      nowMs: 1000,
      rng: () => 0.5,
    });
    // Start tile D at (0,0) has City N (c0) and Field f0 touching c0.
    // Put tile E (rot 2: City S) as the LAST tile in the game at (0, -1), place Farmer on its field f0 (which touches completed city c0!)
    let state: CarcassonneState = {
      ...init.state,
      step: "PlaceTileStep",
      deck: [],
      currentTile: { templateCode: "E", hasGarden: false },
    };

    state = carcassonneCartridge.reduce({
      state,
      command: { type: "PLACE_TILE", x: 0, y: -1, rotation: 2 },
      actorSeatNo: 0,
      nowMs: 1001,
    }).state;

    // Place Farmer on field f0 -> ends match -> end-game scores 1 completed city * 3 = 3 pts!
    state = carcassonneCartridge.reduce({
      state,
      command: { type: "PLACE_MEEPLE", featureId: "f0", meepleType: "standard" },
      actorSeatNo: 0,
      nowMs: 1002,
    }).state;

    expect(state.step).toBe("MatchOver");
    expect(state.seats[0].scoreBreakdown.farmers).toBe(3);
    expect(state.seats[0].score).toBe(3);
  });

  it("autoActBots plays multiple turns cleanly", () => {
    const init = carcassonneCartridge.createInitialState({
      config: carcassonneCartridge.defaultConfig(2),
      seats: SEATS,
      nowMs: 1000,
      rng: () => 0.77,
    });

    const res = carcassonneCartridge.autoActBots!({
      current: init,
      botSeatNos: [0, 1],
      nowMs: 1100,
    });

    expect(res.state.turnNumber).toBeGreaterThan(4);
    expect(Object.keys(res.state.board).length).toBeGreaterThan(4);
  });
});
