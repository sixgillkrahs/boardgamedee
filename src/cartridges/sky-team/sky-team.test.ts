import { describe, expect, it } from "vitest";
import {
  canPlaceDieOnSlot,
  skyTeamCartridge,
  type SkyTeamState,
} from "./index";

const SEATS = [
  { seatNo: 0, actorId: "a1", displayName: "Cơ trưởng An" },
  { seatNo: 1, actorId: "a2", displayName: "Cơ phó Bình" },
];

function startPlacementMatch(seed = 0.42): SkyTeamState {
  const init = skyTeamCartridge.createInitialState({
    config: skyTeamCartridge.defaultConfig(2),
    seats: SEATS,
    nowMs: 1000,
    rng: () => seed,
  });
  let state = init.state;
  state = skyTeamCartridge.reduce({
    state,
    command: { type: "READY_TO_ROLL" },
    actorSeatNo: 0,
    nowMs: 1001,
  }).state;
  state = skyTeamCartridge.reduce({
    state,
    command: { type: "READY_TO_ROLL" },
    actorSeatNo: 1,
    nowMs: 1002,
  }).state;
  return state;
}

describe("skyTeamCartridge", () => {
  it("starts in BriefingStep with open chat and locks chat during PlacementStep", () => {
    const init = skyTeamCartridge.createInitialState({
      config: skyTeamCartridge.defaultConfig(2),
      seats: SEATS,
      nowMs: 1000,
      rng: () => 0.25,
    });

    expect(init.state.step).toBe("BriefingStep");
    expect(init.state.altitude).toBe(6);
    expect(init.state.rerollTokens).toBe(1);
    expect(
      skyTeamCartridge.resolveChannels({ state: init.state, viewerSeatNo: 0 })[0]
        .canWrite
    ).toBe(true);

    const placing = startPlacementMatch();
    expect(placing.step).toBe("PlacementStep");
    expect(
      skyTeamCartridge.resolveChannels({ state: placing, viewerSeatNo: 0 })[0]
        .canWrite
    ).toBe(false);

    // Hidden dice projection: viewer 0 sees own 4 dice, partner's 4 dice are null
    const view0 = skyTeamCartridge.projectView({
      state: placing,
      viewerSeatNo: 0,
    });
    expect(view0.seats[0].dice.every((d) => typeof d === "number")).toBe(true);
    expect(view0.seats[1].dice.every((d) => d === null)).toBe(true);
  });

  it("enforces sequential Flaps & Brakes, unordered Landing Gear, and mandatory Axis/Engine slots", () => {
    const base = startPlacementMatch();
    // Inject deterministic dice for testing rules
    let state: SkyTeamState = {
      ...base,
      activeSeatNo: 0,
      seats: [
        { ...base.seats[0], dice: [1, 2, 4, 6] },
        { ...base.seats[1], dice: [1, 2, 3, 5] },
      ],
    };

    // Pilot cannot activate brake_4 before brake_2
    expect(
      canPlaceDieOnSlot({
        state,
        seatNo: 0,
        dieIndex: 2, // value 4
        slotId: "brake_4",
      }).valid
    ).toBe(false);

    // Pilot CAN activate gear_56 first (Landing Gear is unordered)
    state = skyTeamCartridge.reduce({
      state,
      command: { type: "PLACE_DIE", dieIndex: 3, slotId: "gear_56" }, // value 6
      actorSeatNo: 0,
      nowMs: 2000,
    }).state;
    expect(state.switches.gear_56).toBe(true);
    expect(state.blueMarker).toBe(5);
    expect(state.activeSeatNo).toBe(1);

    // Co-pilot cannot activate flap_23 before flap_12
    expect(
      canPlaceDieOnSlot({
        state,
        seatNo: 1,
        dieIndex: 2, // value 3
        slotId: "flap_23",
      }).valid
    ).toBe(false);

    // Co-pilot activates flap_12 with die value 1
    state = skyTeamCartridge.reduce({
      state,
      command: { type: "PLACE_DIE", dieIndex: 0, slotId: "flap_12" },
      actorSeatNo: 1,
      nowMs: 2001,
    }).state;
    expect(state.switches.flap_12).toBe(true);
    expect(state.orangeMarker).toBe(9);

    // Pilot places brake_2 (now has 2 dice left, and both axis_pilot & engine_pilot are still empty!)
    state = skyTeamCartridge.reduce({
      state,
      command: { type: "PLACE_DIE", dieIndex: 1, slotId: "brake_2" }, // value 2
      actorSeatNo: 0,
      nowMs: 2002,
    }).state;
    expect(state.brakeLevel).toBe(2);

    // Co-pilot places coffee_1
    state = skyTeamCartridge.reduce({
      state,
      command: { type: "PLACE_DIE", dieIndex: 0, slotId: "coffee_1" },
      actorSeatNo: 1,
      nowMs: 2003,
    }).state;
    expect(state.coffeeTokens).toBe(1);

    // Now Pilot has 2 dice left and 2 missing mandatory slots (axis_pilot, engine_pilot) -> cannot place on radio_pilot!
    expect(
      canPlaceDieOnSlot({
        state,
        seatNo: 0,
        dieIndex: 0,
        slotId: "radio_pilot",
      }).valid
    ).toBe(false);
    expect(
      canPlaceDieOnSlot({
        state,
        seatNo: 0,
        dieIndex: 0,
        slotId: "axis_pilot",
      }).valid
    ).toBe(true);
  });

  it("supports Coffee adjustment and Reroll token usage", () => {
    const base = startPlacementMatch();
    let state: SkyTeamState = {
      ...base,
      coffeeTokens: 2,
      rerollTokens: 1,
      activeSeatNo: 0,
      seats: [
        { ...base.seats[0], dice: [1, 3, 3, 5] },
        { ...base.seats[1], dice: [2, 3, 4, 5] },
      ],
    };

    // Pilot adjusts die 3 -> 2 using -1 coffee to activate brake_2
    state = skyTeamCartridge.reduce({
      state,
      command: {
        type: "PLACE_DIE",
        dieIndex: 1,
        slotId: "brake_2",
        coffeeDelta: -1,
      },
      actorSeatNo: 0,
      nowMs: 3000,
    }).state;
    expect(state.switches.brake_2).toBe(true);
    expect(state.coffeeTokens).toBe(1);
    expect(state.brakeLevel).toBe(2);

    // Co-pilot uses Reroll token on 2 dice
    state = skyTeamCartridge.reduce({
      state,
      command: { type: "USE_REROLL", dieIndices: [0, 3] },
      actorSeatNo: 1,
      nowMs: 3001,
    }).state;
    expect(state.rerollTokens).toBe(0);
    expect(state.seats[1].dice.length).toBe(4);
  });

  it("triggers immediate defeat on extreme Axis tilt (>= 3)", () => {
    const base = startPlacementMatch();
    let state: SkyTeamState = {
      ...base,
      axis: 0,
      activeSeatNo: 0,
      seats: [
        { ...base.seats[0], dice: [1, 2, 3, 4] },
        { ...base.seats[1], dice: [6, 5, 4, 3] },
      ],
    };

    state = skyTeamCartridge.reduce({
      state,
      command: { type: "PLACE_DIE", dieIndex: 0, slotId: "axis_pilot" }, // 1
      actorSeatNo: 0,
      nowMs: 4000,
    }).state;

    state = skyTeamCartridge.reduce({
      state,
      command: { type: "PLACE_DIE", dieIndex: 0, slotId: "axis_copilot" }, // 6 -> delta +5!
      actorSeatNo: 1,
      nowMs: 4001,
    }).state;

    expect(state.step).toBe("MatchOver");
    expect(state.outcome).toBe("defeat");
    expect(skyTeamCartridge.isMatchOver(state)).toBe(true);
  });

  it("achieves Victory on a clean 0 ft Landing Round", () => {
    const base = startPlacementMatch();
    const airportIdx = base.traffic.length - 1;
    let state: SkyTeamState = {
      ...base,
      roundNumber: 7,
      altitude: 0,
      approachPos: airportIdx,
      traffic: base.traffic.map((_, i) => (i === airportIdx ? 1 : 0)), // 1 plane left on runway
      axis: 0,
      blueMarker: 7,
      orangeMarker: 12,
      brakeLevel: 6,
      switches: {
        gear_12: true,
        gear_34: true,
        gear_56: true,
        flap_12: true,
        flap_23: true,
        flap_45: true,
        flap_56: true,
        brake_2: true,
        brake_4: true,
        brake_6: true,
      },
      activeSeatNo: 0,
      seats: [
        { ...base.seats[0], dice: [1, 2, 3, 4] },
        { ...base.seats[1], dice: [2, 3, 4, 5] },
      ],
    };

    // Turn 1 (Pilot): Radio 1 clears the last plane on the Airport runway
    state = skyTeamCartridge.reduce({
      state,
      command: { type: "PLACE_DIE", dieIndex: 0, slotId: "radio_pilot" }, // 1
      actorSeatNo: 0,
      nowMs: 5000,
    }).state;
    expect(state.traffic[airportIdx]).toBe(0);

    // Turn 2 (Co-pilot): Coffee with 5
    state = skyTeamCartridge.reduce({
      state,
      command: { type: "PLACE_DIE", dieIndex: 3, slotId: "coffee_1" },
      actorSeatNo: 1,
      nowMs: 5001,
    }).state;

    // Turn 3 (Pilot): Coffee with 4
    state = skyTeamCartridge.reduce({
      state,
      command: { type: "PLACE_DIE", dieIndex: 2, slotId: "coffee_2" },
      actorSeatNo: 0,
      nowMs: 5002,
    }).state;

    // Turn 4 (Co-pilot): Coffee with 4
    state = skyTeamCartridge.reduce({
      state,
      command: { type: "PLACE_DIE", dieIndex: 2, slotId: "coffee_3" },
      actorSeatNo: 1,
      nowMs: 5003,
    }).state;

    // Turn 5 (Pilot): Axis 3
    state = skyTeamCartridge.reduce({
      state,
      command: { type: "PLACE_DIE", dieIndex: 1, slotId: "axis_pilot" }, // 3
      actorSeatNo: 0,
      nowMs: 5004,
    }).state;

    // Turn 6 (Co-pilot): Axis 3 -> level 0!
    state = skyTeamCartridge.reduce({
      state,
      command: { type: "PLACE_DIE", dieIndex: 1, slotId: "axis_copilot" }, // 3
      actorSeatNo: 1,
      nowMs: 5005,
    }).state;
    expect(state.axis).toBe(0);

    // Turn 7 (Pilot): Engine 2
    state = skyTeamCartridge.reduce({
      state,
      command: { type: "PLACE_DIE", dieIndex: 0, slotId: "engine_pilot" }, // 2
      actorSeatNo: 0,
      nowMs: 5006,
    }).state;

    // Turn 8 (Co-pilot): Engine 2 -> sum 4 <= brake 6 -> VICTORY!
    state = skyTeamCartridge.reduce({
      state,
      command: { type: "PLACE_DIE", dieIndex: 0, slotId: "engine_copilot" }, // 2
      actorSeatNo: 1,
      nowMs: 5007,
    }).state;

    expect(state.step).toBe("MatchOver");
    expect(state.outcome).toBe("victory");
    expect(skyTeamCartridge.getWinningFaction(state)).toContain("Thắng");
  });

  it("autoActBots plays cleanly for a Bot partner", () => {
    const init = skyTeamCartridge.createInitialState({
      config: skyTeamCartridge.defaultConfig(2),
      seats: SEATS,
      nowMs: 1000,
      rng: () => 0.61,
    });

    // Both bots play automatically from start to finish without throwing
    const res = skyTeamCartridge.autoActBots!({
      current: init,
      botSeatNos: [0, 1],
      nowMs: 1100,
    });

    expect(res.state.actionSeq).toBeGreaterThan(2);
    expect(res.events.length).toBeGreaterThan(1);
  });
});
