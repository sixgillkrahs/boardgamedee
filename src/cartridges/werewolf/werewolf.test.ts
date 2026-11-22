import { describe, expect, it } from "vitest";
import { getCartridge, listCartridges } from "@/cartridges/registry";
import {
  werewolfCartridge,
  type WerewolfConfig,
} from "@/cartridges/werewolf";
import type { SeatDescriptor } from "@/cartridges/types";

const makeSeats = (count: number): SeatDescriptor[] =>
  Array.from({ length: count }, (_, idx) => ({
    seatNo: idx + 1,
    actorId: `actor-${idx + 1}`,
    displayName: `Người chơi ${idx + 1}`,
    connected: true,
  }));

const SIX_PLAYER_CONFIG: WerewolfConfig = {
  roleCounts: {
    Werewolf: 1,
    Villager: 1,
    Seer: 1,
    Bodyguard: 1,
    Witch: 1,
    Hunter: 1,
  },
  timers: {
    nightActionSeconds: 30,
    witchSeconds: 20,
    dayDiscussionSeconds: 60,
    dayVotingSeconds: 30,
    hunterRevengeSeconds: 15,
  },
  revealRoleOnDeath: true,
};

// With rng = () => 0.999, Fisher-Yates leaves the deck in its initial WEREWOLF_ROLES order:
// Seat 1: Werewolf
// Seat 2: Villager
// Seat 3: Seer
// Seat 4: Bodyguard
// Seat 5: Witch
// Seat 6: Hunter

describe("Werewolf Cartridge - Seam 1 (GameCartridge Interface)", () => {
  it("registers werewolf in the multi-game cartridge catalog and validates configuration against seat count", () => {
    const catalog = listCartridges();
    expect(
      catalog.some((c) => c.cartridgeId === "werewolf" && c.available)
    ).toBe(true);
    expect(getCartridge("werewolf")?.cartridgeId).toBe("werewolf");

    const defaultCfg = werewolfCartridge.defaultConfig(6);
    expect(werewolfCartridge.validateConfig(defaultCfg, 6)).toEqual({
      valid: true,
    });

    expect(werewolfCartridge.validateConfig(defaultCfg, 7).valid).toBe(false);

    const zeroWolves = {
      ...defaultCfg,
      roleCounts: {
        ...defaultCfg.roleCounts,
        Werewolf: 0,
        Villager:
          defaultCfg.roleCounts.Villager + defaultCfg.roleCounts.Werewolf,
      },
    };
    expect(werewolfCartridge.validateConfig(zeroWolves, 6).valid).toBe(false);
  });

  it("initializes Cycle 1 NightActionStep and filters secret roles per Seat via projectView", () => {
    const seats = makeSeats(6);
    const config: WerewolfConfig = {
      ...SIX_PLAYER_CONFIG,
      roleCounts: {
        Werewolf: 2,
        Villager: 1,
        Seer: 1,
        Bodyguard: 1,
        Witch: 1,
        Hunter: 0,
      },
    };

    const { state, phaseDeadlineMs } = werewolfCartridge.createInitialState({
      config,
      seats,
      nowMs: 1_000,
      rng: () => 0.999,
    });

    expect(state.cycle).toBe(1);
    expect(state.phase).toBe("NightPhase");
    expect(state.step).toBe("NightActionStep");
    expect(phaseDeadlineMs).toBe(31_000);

    // Villager (Seat 3) only sees their own Role
    const villagerView = werewolfCartridge.projectView({
      state,
      viewerSeatNo: 3,
    });
    expect(villagerView.myRole).toBe("Villager");
    expect(villagerView.seats.find((s) => s.seatNo === 3)?.role).toBe(
      "Villager"
    );
    expect(villagerView.seats.find((s) => s.seatNo === 1)?.role).toBeNull();
    expect(villagerView.seats.find((s) => s.seatNo === 2)?.role).toBeNull();

    // Werewolf (Seat 1) sees their fellow Werewolf (Seat 2)
    const wolfView = werewolfCartridge.projectView({
      state,
      viewerSeatNo: 1,
    });
    expect(wolfView.myRole).toBe("Werewolf");
    expect(wolfView.seats.find((s) => s.seatNo === 1)?.role).toBe("Werewolf");
    expect(wolfView.seats.find((s) => s.seatNo === 2)?.role).toBe("Werewolf");
    expect(wolfView.seats.find((s) => s.seatNo === 4)?.role).toBeNull();

    // When Werewolf Seat 1 selects/votes a target (lock: false or lock: true), fellow Werewolf Seat 2 sees Seat 1's vote target in projectView, while Villager Seat 3 does not
    const { state: afterWolf1Aim } = werewolfCartridge.reduce({
      state,
      actorSeatNo: 1,
      command: { type: "WEREWOLF_VOTE", targetSeatNo: 5, lock: false },
      nowMs: 1_500,
    });
    expect(afterWolf1Aim.step).toBe("NightActionStep");
    expect(afterWolf1Aim.werewolfSubmitted[1]).toBeFalsy();

    const wolf2View = werewolfCartridge.projectView({
      state: afterWolf1Aim,
      viewerSeatNo: 2,
    });
    expect(
      wolf2View.seats.find((s) => s.seatNo === 1)?.werewolfVoteTarget
    ).toBe(5);

    const villager3View = werewolfCartridge.projectView({
      state: afterWolf1Aim,
      viewerSeatNo: 3,
    });
    expect(
      villager3View.seats.find((s) => s.seatNo === 1)?.werewolfVoteTarget
    ).toBeNull();
  });

  it("enforces Type A Werewolf pack consensus: tied wolf votes do not end NightActionStep early, result in no kill on timeout, and advance once a wolf switches to break the tie", () => {
    const seats = makeSeats(6);
    const twoWolfConfig: WerewolfConfig = {
      ...SIX_PLAYER_CONFIG,
      roleCounts: {
        Werewolf: 2,
        Villager: 2,
        Seer: 1,
        Bodyguard: 1,
        Witch: 0,
        Hunter: 0,
      },
    };
    // Seat 1: Werewolf, Seat 2: Werewolf, Seat 3: Villager, Seat 4: Villager, Seat 5: Seer, Seat 6: Bodyguard
    const { state: s0 } = werewolfCartridge.createInitialState({
      config: twoWolfConfig,
      seats,
      nowMs: 1_000,
      rng: () => 0.999,
    });

    // Seer (Seat 5) and Bodyguard (Seat 6) finish their night actions
    const { state: s1 } = werewolfCartridge.reduce({
      state: s0,
      actorSeatNo: 5,
      command: { type: "SEER_INSPECT", targetSeatNo: 3 },
      nowMs: 1_500,
    });
    const { state: s2 } = werewolfCartridge.reduce({
      state: s1,
      actorSeatNo: 6,
      command: { type: "BODYGUARD_PROTECT", targetSeatNo: 5 },
      nowMs: 1_800,
    });

    // Werewolf 1 locks Seat 3, Werewolf 2 locks Seat 4 (1-1 tie!)
    const { state: s3 } = werewolfCartridge.reduce({
      state: s2,
      actorSeatNo: 1,
      command: { type: "WEREWOLF_VOTE", targetSeatNo: 3, lock: true },
      nowMs: 2_000,
    });
    const { state: s4 } = werewolfCartridge.reduce({
      state: s3,
      actorSeatNo: 2,
      command: { type: "WEREWOLF_VOTE", targetSeatNo: 4, lock: true },
      nowMs: 2_200,
    });

    // Must NOT advance early because the pack is tied 1-1!
    expect(s4.phase).toBe("NightPhase");
    expect(s4.step).toBe("NightActionStep");

    // Branch A: If Phase Timer expires while still tied 1-1 -> no one is bitten!
    const { state: timeoutDawn } = werewolfCartridge.onPhaseTimeout({
      state: s4,
      nowMs: 35_000,
    });
    expect(timeoutDawn.phase).toBe("DayPhase");
    expect(timeoutDawn.lastDawnDeaths).toEqual([]);

    // Branch B: If Werewolf 2 changes their vote to Seat 3 before timeout -> consensus reached, Seat 3 dies at dawn!
    const { state: consensusDawn } = werewolfCartridge.reduce({
      state: s4,
      actorSeatNo: 2,
      command: { type: "WEREWOLF_VOTE", targetSeatNo: 3, lock: true },
      nowMs: 3_000,
    });
    expect(consensusDawn.phase).toBe("DayPhase");
    expect(consensusDawn.lastDawnDeaths).toEqual([3]);
  });

  it("handles NightActionStep (Werewolf, Seer, Bodyguard) and advances to WitchStep where Witch can self-heal and poison", () => {
    const { state: s0 } = werewolfCartridge.createInitialState({
      config: SIX_PLAYER_CONFIG,
      seats: makeSeats(6),
      nowMs: 1_000,
      rng: () => 0.999,
    });

    // Seat 1 (Werewolf) attacks Seat 5 (Witch)
    const { state: s1 } = werewolfCartridge.reduce({
      state: s0,
      actorSeatNo: 1,
      command: { type: "WEREWOLF_VOTE", targetSeatNo: 5 },
      nowMs: 2_000,
    });
    expect(s1.step).toBe("NightActionStep");

    // Seat 3 (Seer) inspects Seat 1 (Werewolf) -> sees WerewolfFaction in their private view
    const { state: s2 } = werewolfCartridge.reduce({
      state: s1,
      actorSeatNo: 3,
      command: { type: "SEER_INSPECT", targetSeatNo: 1 },
      nowMs: 3_000,
    });
    const seerView = werewolfCartridge.projectView({
      state: s2,
      viewerSeatNo: 3,
    });
    expect(seerView.seerInspections).toEqual([
      { cycle: 1, targetSeatNo: 1, faction: "WerewolfFaction" },
    ]);
    // Villager cannot see Seer inspections
    expect(
      werewolfCartridge.projectView({ state: s2, viewerSeatNo: 2 })
        .seerInspections
    ).toEqual([]);

    // Seat 4 (Bodyguard) protects Seat 2 (Villager) -> completes NightActionStep, moves to WitchStep
    const { state: s3 } = werewolfCartridge.reduce({
      state: s2,
      actorSeatNo: 4,
      command: { type: "BODYGUARD_PROTECT", targetSeatNo: 2 },
      nowMs: 4_000,
    });
    expect(s3.step).toBe("WitchStep");

    // Witch (Seat 5) sees that Seat 5 (themselves!) is the pending wolf victim
    const witchView = werewolfCartridge.projectView({
      state: s3,
      viewerSeatNo: 5,
    });
    expect(witchView.witchState?.pendingWolfVictimSeatNo).toBe(5);
    expect(witchView.witchState?.healAvailable).toBe(true);
    expect(witchView.witchState?.poisonAvailable).toBe(true);

    // Witch uses BOTH Heal (self-heal) AND Poison on Seat 2 (even though Seat 2 was protected by Bodyguard, poison bypasses Bodyguard!)
    const { state: s4 } = werewolfCartridge.reduce({
      state: s3,
      actorSeatNo: 5,
      command: {
        type: "WITCH_ACT",
        useHeal: true,
        poisonTargetSeatNo: 2,
      },
      nowMs: 5_000,
    });

    // Dawn resolves: Seat 5 (Witch) survived via self-heal; Seat 2 (Villager) died from poison despite Bodyguard protection
    expect(s4.phase).toBe("DayPhase");
    expect(s4.step).toBe("DayDiscussionStep");
    expect(s4.lastDawnDeaths).toEqual([2]);
    expect(s4.seats.find((s) => s.seatNo === 5)?.alive).toBe(true);
    expect(s4.seats.find((s) => s.seatNo === 2)?.alive).toBe(false);
    expect(s4.seats.find((s) => s.seatNo === 2)?.deathCause).toBe(
      "witch_poison"
    );
  });

  it("prevents Bodyguard from protecting the same Seat on two consecutive nights and handles Day tie votes", () => {
    const { state: s0 } = werewolfCartridge.createInitialState({
      config: SIX_PLAYER_CONFIG,
      seats: makeSeats(6),
      nowMs: 1_000,
      rng: () => 0.999,
    });

    // Night 1: Wolf bites Seat 3, Bodyguard protects Seat 3 (saves Seat 3!), Seer inspects Seat 2, Witch skips
    const { state: s1 } = werewolfCartridge.reduce({
      state: s0,
      actorSeatNo: 1,
      command: { type: "WEREWOLF_VOTE", targetSeatNo: 3 },
      nowMs: 2_000,
    });
    const { state: s2 } = werewolfCartridge.reduce({
      state: s1,
      actorSeatNo: 3,
      command: { type: "SEER_INSPECT", targetSeatNo: 2 },
      nowMs: 3_000,
    });
    const { state: s3 } = werewolfCartridge.reduce({
      state: s2,
      actorSeatNo: 4,
      command: { type: "BODYGUARD_PROTECT", targetSeatNo: 3 },
      nowMs: 4_000,
    });
    const { state: s4 } = werewolfCartridge.reduce({
      state: s3,
      actorSeatNo: 5,
      command: { type: "WITCH_ACT", useHeal: false, poisonTargetSeatNo: null },
      nowMs: 5_000,
    });

    // Peaceful dawn because Bodyguard protected Seat 3
    expect(s4.phase).toBe("DayPhase");
    expect(s4.step).toBe("DayDiscussionStep");
    expect(s4.lastDawnDeaths).toEqual([]);

    // Timeout DayDiscussionStep -> DayVotingStep
    const { state: s5 } = werewolfCartridge.onPhaseTimeout({
      state: s4,
      nowMs: 65_000,
    });
    expect(s5.step).toBe("DayVotingStep");

    // Live public vote preview (lock: false): Seat 1 points vote at Seat 2 -> every player's projectView sees Seat 1 voting Seat 2 while DayVotingStep stays open
    const { state: s5Aim } = werewolfCartridge.reduce({
      state: s5,
      actorSeatNo: 1,
      command: { type: "DAY_VOTE", targetSeatNo: 2, lock: false },
      nowMs: 65_500,
    });
    expect(s5Aim.step).toBe("DayVotingStep");
    for (const viewer of [1, 2, 3, 4, 5, 6]) {
      const view = werewolfCartridge.projectView({
        state: s5Aim,
        viewerSeatNo: viewer,
      });
      const seat1InView = view.seats.find((s) => s.seatNo === 1);
      expect(seat1InView?.dayVoteTarget).toBe(2);
      expect(seat1InView?.dayVoteLocked).toBe(false);
    }

    // Tie vote: Seat 1 locks Seat 2, Seat 2 locks Seat 1, others abstain -> no one executed, advances to Cycle 2 NightActionStep
    let cur = s5Aim;
    cur = werewolfCartridge.reduce({
      state: cur,
      actorSeatNo: 1,
      command: { type: "DAY_VOTE", targetSeatNo: 2 },
      nowMs: 66_000,
    }).state;
    cur = werewolfCartridge.reduce({
      state: cur,
      actorSeatNo: 2,
      command: { type: "DAY_VOTE", targetSeatNo: 1 },
      nowMs: 66_100,
    }).state;
    for (const seatNo of [3, 4, 5, 6]) {
      cur = werewolfCartridge.reduce({
        state: cur,
        actorSeatNo: seatNo,
        command: { type: "DAY_VOTE", targetSeatNo: "abstain" },
        nowMs: 66_200,
      }).state;
    }

    expect(cur.cycle).toBe(2);
    expect(cur.phase).toBe("NightPhase");
    expect(cur.step).toBe("NightActionStep");
    expect(cur.lastExecutedSeatNo).toBeNull();

    // Plurality execution even when most players abstain: if Seat 1 votes Seat 2 (1 vote) and everyone else abstains, Seat 2 has the most votes and IS executed!
    let execTest = s5;
    execTest = werewolfCartridge.reduce({
      state: execTest,
      actorSeatNo: 1,
      command: { type: "DAY_VOTE", targetSeatNo: 2, lock: true },
      nowMs: 66_000,
    }).state;
    for (const seatNo of [2, 3, 4, 5, 6]) {
      execTest = werewolfCartridge.reduce({
        state: execTest,
        actorSeatNo: seatNo,
        command: { type: "DAY_VOTE", targetSeatNo: "abstain", lock: true },
        nowMs: 66_200,
      }).state;
    }
    expect(execTest.lastExecutedSeatNo).toBe(2);
    expect(execTest.seats.find((s) => s.seatNo === 2)?.alive).toBe(false);
    expect(execTest.seats.find((s) => s.seatNo === 2)?.deathCause).toBe(
      "day_execution"
    );

    // Night 2: Bodyguard (Seat 4) attempts to protect Seat 3 again -> rejected!
    expect(() =>
      werewolfCartridge.reduce({
        state: cur,
        actorSeatNo: 4,
        command: { type: "BODYGUARD_PROTECT", targetSeatNo: 3 },
        nowMs: 67_000,
      })
    ).toThrow(/2 đêm liên tiếp/);
  });

  it("triggers HunterRevengeStep when Hunter dies and allows Hunter to shoot the last Werewolf for a Village victory", () => {
    const fourPlayerConfig: WerewolfConfig = {
      ...SIX_PLAYER_CONFIG,
      roleCounts: {
        Werewolf: 1,
        Villager: 2,
        Seer: 0,
        Bodyguard: 0,
        Witch: 0,
        Hunter: 1,
      },
    };
    // Seat 1: Werewolf, Seat 2: Villager, Seat 3: Villager, Seat 4: Hunter
    const { state: s0 } = werewolfCartridge.createInitialState({
      config: fourPlayerConfig,
      seats: makeSeats(4),
      nowMs: 1_000,
      rng: () => 0.999,
    });

    // Night 1: Werewolf (Seat 1) bites Hunter (Seat 4)
    const { state: s1 } = werewolfCartridge.reduce({
      state: s0,
      actorSeatNo: 1,
      command: { type: "WEREWOLF_VOTE", targetSeatNo: 4 },
      nowMs: 2_000,
    });

    // Because Hunter died at dawn, HunterRevengeStep triggers BEFORE win check or DayDiscussionStep!
    expect(s1.step).toBe("HunterRevengeStep");
    expect(s1.activeHunterSeatNo).toBe(4);

    // Dead Hunter (Seat 4) shoots Werewolf (Seat 1)!
    const { state: s2 } = werewolfCartridge.reduce({
      state: s1,
      actorSeatNo: 4,
      command: { type: "HUNTER_SHOOT", targetSeatNo: 1 },
      nowMs: 3_000,
    });

    expect(s2.phase).toBe("Finished");
    expect(s2.winningFaction).toBe("VillageFaction");
    expect(werewolfCartridge.isMatchOver(s2)).toBe(true);
  });

  it("resolves dynamic Channel permissions for Village, Werewolf, and Graveyard across phases", () => {
    const { state: nightState } = werewolfCartridge.createInitialState({
      config: SIX_PLAYER_CONFIG,
      seats: makeSeats(6),
      nowMs: 1_000,
      rng: () => 0.999,
    });

    // During NightPhase:
    // Seat 1 (Werewolf) can read/write werewolf channel, read-only village channel
    const wolfNightChannels = werewolfCartridge.resolveChannels({
      state: nightState,
      viewerSeatNo: 1,
    });
    expect(
      wolfNightChannels.find((c) => c.channelId === "werewolf")?.canWrite
    ).toBe(true);
    expect(
      wolfNightChannels.find((c) => c.channelId === "village")?.canWrite
    ).toBe(false);

    // Seat 2 (Villager) has no werewolf channel and cannot write in village during NightPhase
    const villagerNightChannels = werewolfCartridge.resolveChannels({
      state: nightState,
      viewerSeatNo: 2,
    });
    expect(
      villagerNightChannels.find((c) => c.channelId === "werewolf")
    ).toBeUndefined();
    expect(
      villagerNightChannels.find((c) => c.channelId === "village")?.canWrite
    ).toBe(false);

    // Advance to DayPhase via timeouts (NightActionStep -> WitchStep -> DayDiscussionStep)
    const { state: witchState } = werewolfCartridge.onPhaseTimeout({
      state: nightState,
      nowMs: 35_000,
    });
    const { state: dayState } = werewolfCartridge.onPhaseTimeout({
      state: witchState,
      nowMs: 60_000,
    });
    expect(dayState.phase).toBe("DayPhase");

    // Living Villager (Seat 2) can write in village channel during DayPhase
    const villagerDayChannels = werewolfCartridge.resolveChannels({
      state: dayState,
      viewerSeatNo: 2,
    });
    expect(
      villagerDayChannels.find((c) => c.channelId === "village")?.canWrite
    ).toBe(true);
  });
});
