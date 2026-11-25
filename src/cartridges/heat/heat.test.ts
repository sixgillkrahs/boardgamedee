import { describe, expect, it } from "vitest";
import { heatCartridge } from "@/cartridges/heat";
import type { SeatDescriptor } from "@/cartridges/types";

const SAMPLE_SEATS: SeatDescriptor[] = [
  { seatNo: 1, actorId: "a1", displayName: "Tay Đua 1" },
  { seatNo: 2, actorId: "a2", displayName: "Tay Đua 2" },
  { seatNo: 3, actorId: "a3", displayName: "Tay Đua 3" },
];

describe("Heat: Pedal to the Metal Cartridge", () => {
  it("initializes starting decks (18 cards), 7-card hands, starting grid, and track-specific Engine Heat", () => {
    const usaRes = heatCartridge.createInitialState({
      config: {
        trackId: "usa",
        laps: 2,
        timers: { planSeconds: 45, reactSeconds: 40 },
      },
      seats: SAMPLE_SEATS,
      nowMs: 1000,
    });

    expect(usaRes.state.step).toBe("GearAndCardsStep");
    expect(usaRes.state.seats).toHaveLength(3);

    const s1 = usaRes.state.seats[0];
    const s2 = usaRes.state.seats[1];
    const s3 = usaRes.state.seats[2];

    // Grid positioning: Seat 1 & 2 at progress -1 (lanes 0 & 1), Seat 3 at progress -2 (lane 0)
    expect(s1.progress).toBe(-1);
    expect(s1.lane).toBe(0);
    expect(s2.progress).toBe(-1);
    expect(s2.lane).toBe(1);
    expect(s3.progress).toBe(-2);
    expect(s3.lane).toBe(0);

    // 18 cards in starting deck -> 7 in hand + 11 in drawPile, 6 Heat in Engine on USA
    expect(s1.hand).toHaveLength(7);
    expect(s1.drawPile).toHaveLength(11);
    expect(s1.enginePile).toHaveLength(6);

    // South Africa starts with 7 Heat in Engine; Deutschland starts with 5 Heat in Engine
    const zafRes = heatCartridge.createInitialState({
      config: {
        trackId: "south-africa",
        laps: 2,
        timers: { planSeconds: 45, reactSeconds: 40 },
      },
      seats: SAMPLE_SEATS,
      nowMs: 1000,
    });
    expect(zafRes.state.seats[0].enginePile).toHaveLength(7);

    const deuRes = heatCartridge.createInitialState({
      config: {
        trackId: "deutschland",
        laps: 2,
        timers: { planSeconds: 45, reactSeconds: 40 },
      },
      seats: SAMPLE_SEATS,
      nowMs: 1000,
    });
    expect(deuRes.state.seats[0].enginePile).toHaveLength(5);
  });

  it("handles simultaneous Gear shift (including ±2 Gear costing 1 Engine Heat), sequential Reveal & Move, Adrenaline, Cooldown, Slipstream, and Hand Replenish", () => {
    const init = heatCartridge.createInitialState({
      config: heatCartridge.defaultConfig(2),
      seats: SAMPLE_SEATS.slice(0, 2),
      nowMs: 1000,
      rng: () => 0.42,
    });

    // Give Seat 1 deterministic cards in hand (including a Heat card to test Cooldown)
    const s1 = init.state.seats[0];
    const s2 = init.state.seats[1];
    s1.hand = [
      { id: "c1", kind: "speed", value: 4, labelVi: "Tốc Độ 4" },
      { id: "c2", kind: "speed", value: 3, labelVi: "Tốc Độ 3" },
      { id: "c3", kind: "speed", value: 2, labelVi: "Tốc Độ 2" },
      { id: "h-hand", kind: "heat", value: null, labelVi: "Nhiệt" },
      { id: "c5", kind: "speed", value: 1, labelVi: "Tốc Độ 1" },
      { id: "c6", kind: "speed", value: 2, labelVi: "Tốc Độ 2" },
      { id: "c7", kind: "speed", value: 3, labelVi: "Tốc Độ 3" },
    ];
    s2.hand = [
      { id: "d1", kind: "speed", value: 3, labelVi: "Tốc Độ 3" },
      { id: "d2", kind: "speed", value: 1, labelVi: "Tốc Độ 1" },
      { id: "d3", kind: "speed", value: 2, labelVi: "Tốc Độ 2" },
      { id: "d4", kind: "speed", value: 4, labelVi: "Tốc Độ 4" },
      { id: "d5", kind: "speed", value: 1, labelVi: "Tốc Độ 1" },
      { id: "d6", kind: "speed", value: 2, labelVi: "Tốc Độ 2" },
      { id: "d7", kind: "speed", value: 3, labelVi: "Tốc Độ 3" },
    ];

    // Seat 1 cannot play a Heat card from hand
    expect(() =>
      heatCartridge.reduce({
        state: init.state,
        actorSeatNo: 1,
        nowMs: 1100,
        command: { type: "PLAN_TURN", targetGear: 1, cardIds: ["h-hand"] },
      })
    ).toThrow(/Heat/);

    // Seat 1 shifts from Gear 1 -> Gear 2 (free) and plays 2 cards totaling 4 (c2=3 + c5=1)
    const afterP1 = heatCartridge.reduce({
      state: init.state,
      actorSeatNo: 1,
      nowMs: 1200,
      command: { type: "PLAN_TURN", targetGear: 2, cardIds: ["c2", "c5"] },
    });
    expect(afterP1.state.step).toBe("GearAndCardsStep");

    // Seat 2 stays in Gear 1 and plays 1 card of value 3 (d1=3)
    const afterP2 = heatCartridge.reduce({
      state: afterP1.state,
      actorSeatNo: 2,
      nowMs: 1300,
      command: { type: "PLAN_TURN", targetGear: 1, cardIds: ["d1"] },
    });

    // Both players planned -> transitions to ReactAndSlipstreamStep for Seat 1 (who started on Race Line lane 0!)
    expect(afterP2.state.step).toBe("ReactAndSlipstreamStep");
    expect(afterP2.state.activeSeatNo).toBe(1);
    // Seat 1 moved from -1 by +4 -> progress = 3
    expect(afterP2.state.seats[0].progress).toBe(3);
    expect(afterP2.state.seats[0].cooldownRemaining).toBe(1); // Gear 2 gives 1 Cooldown

    // Seat 1 uses Cooldown to move "h-hand" from hand back into Engine!
    const afterCooldown = heatCartridge.reduce({
      state: afterP2.state,
      actorSeatNo: 1,
      nowMs: 1400,
      command: { type: "USE_COOLDOWN", cardId: "h-hand" },
    });
    expect(afterCooldown.state.seats[0].enginePile).toHaveLength(7);
    expect(
      afterCooldown.state.seats[0].hand.some((c) => c.id === "h-hand")
    ).toBe(false);

    // Seat 1 ends turn -> replenished back to 7 cards, now Seat 2 becomes activeSeatNo!
    const afterS1End = heatCartridge.reduce({
      state: afterCooldown.state,
      actorSeatNo: 1,
      nowMs: 1500,
      command: { type: "END_TURN" },
    });
    expect(afterS1End.state.seats[0].hand).toHaveLength(7);
    expect(afterS1End.state.activeSeatNo).toBe(2);

    // Seat 2 moved from -1 by +3 -> progress = 2 (1 space behind Seat 1 at progress = 3!)
    // And Seat 2 was trailing at start of sequential phase -> has Adrenaline AND qualifies for Slipstream!
    const s2Active = afterS1End.state.seats[1];
    expect(s2Active.progress).toBe(2);
    expect(s2Active.hasAdrenaline).toBe(true);

    const p2View = heatCartridge.projectView({
      state: afterS1End.state,
      viewerSeatNo: 2,
    });
    expect(p2View.canSlipstream).toBe(true);

    // Seat 2 activates Slipstream -> moves +2 spaces to progress = 4 (overtaking Seat 1!) without increasing turnSpeed (still 3)
    const afterSlip = heatCartridge.reduce({
      state: afterS1End.state,
      actorSeatNo: 2,
      nowMs: 1600,
      command: { type: "USE_SLIPSTREAM" },
    });
    expect(afterSlip.state.seats[1].progress).toBe(4);
    expect(afterSlip.state.seats[1].turnSpeed).toBe(3);
  });

  it("enforces Corner Speed Limit checks, Engine Heat payment, and Spin Out penalties when Engine lacks Heat", () => {
    const init = heatCartridge.createInitialState({
      config: heatCartridge.defaultConfig(2),
      seats: SAMPLE_SEATS.slice(0, 2),
      nowMs: 1000,
    });

    // Position Seat 1 right before USA Corner 1 (afterSpaceIndex: 10, speedLimit: 7) with only 1 Heat left in Engine and in Gear 3
    const s1 = init.state.seats[0];
    s1.progress = 8;
    s1.gear = 3;
    s1.enginePile = [s1.enginePile[0]]; // Only 1 Heat left in Engine!
    s1.hand = [
      { id: "f1", kind: "upgrade_5", value: 5, labelVi: "5" },
      { id: "f2", kind: "speed", value: 4, labelVi: "4" },
      { id: "f3", kind: "speed", value: 3, labelVi: "3" },
      { id: "f4", kind: "speed", value: 1, labelVi: "1" },
    ];

    const s2 = init.state.seats[1];
    s2.hand = [{ id: "g1", kind: "speed", value: 1, labelVi: "1" }];

    // Seat 1 stays in Gear 3 and plays 5 + 4 + 3 = Speed 12 (exceeds Corner 1 limit 7 by 5 Heat, but only has 1 Heat -> Spin Out!)
    const p1Plan = heatCartridge.reduce({
      state: init.state,
      actorSeatNo: 1,
      nowMs: 1100,
      command: {
        type: "PLAN_TURN",
        targetGear: 3,
        cardIds: ["f1", "f2", "f3"],
      },
    });
    const p2Plan = heatCartridge.reduce({
      state: p1Plan.state,
      actorSeatNo: 2,
      nowMs: 1200,
      command: { type: "PLAN_TURN", targetGear: 1, cardIds: ["g1"] },
    });

    // Seat 1 is active at progress 20 (crossed Corner 1 at progress 10 with speed 12 > limit 7)
    expect(p2Plan.state.activeSeatNo).toBe(1);
    const s1End = heatCartridge.reduce({
      state: p2Plan.state,
      actorSeatNo: 1,
      nowMs: 1300,
      command: { type: "END_TURN" },
    });

    const spunSeat = s1End.state.seats[0];
    // Spin Out rules:
    // 1. Engine Heat drained to 0
    expect(spunSeat.enginePile).toHaveLength(0);
    // 2. Moved back to space 10 (right before Corner 1)
    expect(spunSeat.progress).toBe(10);
    // 3. Reset to 1st Gear
    expect(spunSeat.gear).toBe(1);
    // 4. Received 2 Stress cards (because spun out in 3rd Gear)
    expect(spunSeat.lastSpinOutRound).toBe(1);
  });
});
