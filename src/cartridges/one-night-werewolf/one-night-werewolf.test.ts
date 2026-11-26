import { describe, expect, it } from "vitest";
import {
  oneNightWerewolfCartridge,
  type OnuwConfig,
  type OnuwRoleId,
  type OnuwState,
} from "./index";
import type { SeatDescriptor } from "@/cartridges/types";

function makeSeats(n: number): SeatDescriptor[] {
  return Array.from({ length: n }, (_, i) => ({
    seatNo: i + 1,
    actorId: `actor-${i + 1}`,
    displayName: `Player ${i + 1}`,
  }));
}

/** Deterministic state factory with explicit role assignment (players + 3 center) */
function createFixedState(
  playerRoles: OnuwRoleId[],
  centerRoles: [OnuwRoleId, OnuwRoleId, OnuwRoleId]
): OnuwState {
  const allRoles: OnuwRoleId[] = [...playerRoles, ...centerRoles];
  const seats = makeSeats(playerRoles.length);
  const config: OnuwConfig = {
    ...oneNightWerewolfCartridge.defaultConfig(playerRoles.length),
    roles: allRoles,
  };
  const { state } = oneNightWerewolfCartridge.createInitialState({
    config,
    seats,
    nowMs: 1_000,
  });

  // Override shuffled roles deterministically
  state.players.forEach((p, idx) => {
    p.initialRole = playerRoles[idx];
    p.currentRole = playerRoles[idx];
  });
  state.centerCards = [...centerRoles] as [OnuwRoleId, OnuwRoleId, OnuwRoleId];
  state.initialCenterCards = [...centerRoles] as [
    OnuwRoleId,
    OnuwRoleId,
    OnuwRoleId,
  ];
  const doppel = state.players.find((p) => p.initialRole === "doppelganger");
  state.doppelgangerSeatNo = doppel ? doppel.seatNo : null;
  return state;
}

function advanceThroughReveal(state: OnuwState): OnuwState {
  let st = state;
  for (const p of st.players) {
    st = oneNightWerewolfCartridge.reduce({
      state: st,
      command: { type: "CONFIRM_REVEAL" },
      actorSeatNo: p.seatNo,
      nowMs: 2_000,
    }).state;
  }
  return st;
}

describe("One Night Ultimate Werewolf Cartridge", () => {
  it("validates exact card count (seatCount + 3) and base game role caps", () => {
    const cfg4 = oneNightWerewolfCartridge.defaultConfig(4);
    expect(cfg4.roles.length).toBe(7);
    expect(oneNightWerewolfCartridge.validateConfig(cfg4, 4).valid).toBe(true);
    expect(oneNightWerewolfCartridge.validateConfig(cfg4, 5).valid).toBe(false);

    const tooManyWolves: OnuwConfig = {
      ...cfg4,
      roles: [
        "werewolf",
        "werewolf",
        "werewolf",
        "seer",
        "robber",
        "troublemaker",
        "villager",
      ],
    };
    expect(
      oneNightWerewolfCartridge.validateConfig(tooManyWolves, 4).valid
    ).toBe(false);
  });

  it("runs official wake order: Lone Wolf peek, Seer, Robber, Troublemaker, Drunk, Insomniac", () => {
    // 5 players: 1=Werewolf (lone), 2=Seer, 3=Robber, 4=Troublemaker, 5=Insomniac
    // Center: [werewolf, drunk, villager]
    let st = createFixedState(
      ["werewolf", "seer", "robber", "troublemaker", "insomniac"],
      ["werewolf", "drunk", "villager"]
    );
    st = advanceThroughReveal(st);
    expect(st.step).toBe("NightStep");
    expect(st.nightQueue[st.nightQueueIndex]).toBe("werewolf");

    // Seat 1 (Lone Wolf) peeks Center #1 (werewolf)
    st = oneNightWerewolfCartridge.reduce({
      state: st,
      command: { type: "WEREWOLF_PEEK_CENTER", centerIdx: 0 },
      actorSeatNo: 1,
      nowMs: 3_000,
    }).state;
    expect(st.players[0].privateInfo.peekedCenter[0].role).toBe("werewolf");

    // Next: Seer (Seat 2) peeks Seat 1
    expect(st.nightQueue[st.nightQueueIndex]).toBe("seer");
    st = oneNightWerewolfCartridge.reduce({
      state: st,
      command: { type: "SEER_PEEK_PLAYER", targetSeatNo: 1 },
      actorSeatNo: 2,
      nowMs: 4_000,
    }).state;
    expect(st.players[1].privateInfo.peekedPlayers[0].role).toBe("werewolf");

    // Next: Robber (Seat 3) swaps with Seat 1 (steals Werewolf!)
    expect(st.nightQueue[st.nightQueueIndex]).toBe("robber");
    st = oneNightWerewolfCartridge.reduce({
      state: st,
      command: { type: "ROBBER_SWAP", targetSeatNo: 1 },
      actorSeatNo: 3,
      nowMs: 5_000,
    }).state;
    expect(st.players[2].currentRole).toBe("werewolf");
    expect(st.players[0].currentRole).toBe("robber");

    // Next: Troublemaker (Seat 4) swaps Seat 3 (now werewolf) and Seat 5 (insomniac)
    expect(st.nightQueue[st.nightQueueIndex]).toBe("troublemaker");
    st = oneNightWerewolfCartridge.reduce({
      state: st,
      command: { type: "TROUBLEMAKER_SWAP", seatA: 3, seatB: 5 },
      actorSeatNo: 4,
      nowMs: 6_000,
    }).state;
    expect(st.players[4].currentRole).toBe("werewolf");
    expect(st.players[2].currentRole).toBe("insomniac");

    // Next: Drunk (in center!) -> timeout advances cleanly
    expect(st.nightQueue[st.nightQueueIndex]).toBe("drunk");
    st = oneNightWerewolfCartridge.onPhaseTimeout({
      state: st,
      nowMs: 10_000,
    }).state;

    // Next: Insomniac (Seat 5) wakes and sees their current card is now WEREWOLF!
    expect(st.nightQueue[st.nightQueueIndex]).toBe("insomniac");
    expect(st.players[4].privateInfo.peekedPlayers[0].role).toBe("werewolf");
    st = oneNightWerewolfCartridge.reduce({
      state: st,
      command: { type: "INSOMNIAC_CONFIRM" },
      actorSeatNo: 5,
      nowMs: 11_000,
    }).state;

    // Dawn breaks!
    expect(st.step).toBe("DayDiscussionStep");
  });

  it("enforces Golden Rule + Circle 1-Vote Tie (No One Dies -> Village wins when no Werewolves in play)", () => {
    // 4 players: NO werewolves in play (both in center!)
    let st = createFixedState(
      ["villager", "villager", "hunter", "tanner"],
      ["werewolf", "werewolf", "villager"]
    );
    st = advanceThroughReveal(st);
    // Werewolf phase is in queue but both in center -> timeout to DayDiscussion
    st = oneNightWerewolfCartridge.onPhaseTimeout({ state: st, nowMs: 5_000 }).state;
    expect(st.step).toBe("DayDiscussionStep");

    // Move to voting
    st = oneNightWerewolfCartridge.onPhaseTimeout({ state: st, nowMs: 6_000 }).state;
    expect(st.step).toBe("DayVotingStep");

    // Everyone votes in a circle (each gets exactly 1 vote -> NOBODY dies!)
    const circleVotes: Array<[number, number]> = [
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 1],
    ];
    for (const [voter, target] of circleVotes) {
      st = oneNightWerewolfCartridge.reduce({
        state: st,
        command: { type: "CAST_VOTE", targetSeatNo: target },
        actorSeatNo: voter,
        nowMs: 7_000,
      }).state;
    }

    expect(st.step).toBe("MatchOver");
    expect(st.eliminatedSeatNos).toEqual([]);
    expect(st.winningFactions).toEqual(["village"]);
    expect(st.winnerSeatNos).toEqual([1, 2, 3]); // Tanner (4) loses
  });

  it("triggers Hunter vote-kill and handles simultaneous Tanner + Werewolf death (both Tanner & Village win)", () => {
    // 4 players: 1=Hunter, 2=Tanner, 3=Werewolf, 4=Villager
    let st = createFixedState(
      ["hunter", "tanner", "werewolf", "villager"],
      ["werewolf", "villager", "villager"]
    );
    st = advanceThroughReveal(st);
    // Lone werewolf (seat 3) confirms
    st = oneNightWerewolfCartridge.reduce({
      state: st,
      command: { type: "WEREWOLF_CONFIRM" },
      actorSeatNo: 3,
      nowMs: 3_000,
    }).state;
    // Skip discussion to voting
    st = oneNightWerewolfCartridge.onPhaseTimeout({ state: st, nowMs: 4_000 }).state;

    // Votes: Seat 1 (Hunter) points at Seat 3 (Werewolf).
    // Seat 2 (Tanner) & Seat 3 (Werewolf) vote Seat 1 (Hunter -> 2 votes, dies!).
    // Seat 4 votes Seat 2 (Tanner -> 1 vote). Wait: let's tie Hunter (1) and Tanner (2) at 2 votes each!
    // Seat 1 -> 3 (Werewolf), Seat 2 -> 1, Seat 3 -> 1 (Hunter=2), Seat 4 -> 2... wait only 4 voters!
    // Use 4 voters: 1->3 (Hunter shoots Werewolf!), 2->1, 3->1 (Hunter=2), 4->2 (Tanner=1).
    // Better: 1->2 (Hunter shoots Tanner!), 2->3, 3->1, 4->3 (Werewolf=2, dies).
    // Let's test Hunter dying and shooting Werewolf while Tanner also tied: use 5 players!
    st = createFixedState(
      ["hunter", "tanner", "werewolf", "villager", "villager"],
      ["werewolf", "villager", "villager"]
    );
    st = advanceThroughReveal(st);
    st = oneNightWerewolfCartridge.reduce({
      state: st,
      command: { type: "WEREWOLF_CONFIRM" },
      actorSeatNo: 3,
      nowMs: 3_000,
    }).state;
    st = oneNightWerewolfCartridge.onPhaseTimeout({ state: st, nowMs: 4_000 }).state;

    // Seat 1 (Hunter) votes Seat 3 (Werewolf) -> if Hunter dies, Werewolf dies too!
    // Seat 2 (Tanner) gets 2 votes (from 3, 4)
    // Seat 1 (Hunter) gets 2 votes (from 2, 5)
    // Tie at 2 votes: Hunter (1) & Tanner (2) die -> Hunter kills Werewolf (3)!
    const votes: Array<[number, number]> = [
      [1, 3],
      [2, 1],
      [3, 2],
      [4, 2],
      [5, 1],
    ];
    for (const [voter, target] of votes) {
      st = oneNightWerewolfCartridge.reduce({
        state: st,
        command: { type: "CAST_VOTE", targetSeatNo: target },
        actorSeatNo: voter,
        nowMs: 5_000,
      }).state;
    }

    expect(st.step).toBe("MatchOver");
    expect(st.eliminatedSeatNos).toEqual([1, 2, 3]);
    expect(st.hunterKillSeatNos).toEqual([3]);
    expect(st.winningFactions).toContain("tanner");
    expect(st.winningFactions).toContain("village");
    expect(st.winningFactions).not.toContain("werewolf");
  });

  it("handles Doppelgänger copying Robber immediately and auto-acts bots through a full match", () => {
    // Seat 1=Doppelgänger, Seat 2=Robber, Seat 3=Werewolf, Seat 4=Villager
    let st = createFixedState(
      ["doppelganger", "robber", "werewolf", "villager"],
      ["werewolf", "villager", "villager"]
    );
    st = advanceThroughReveal(st);
    expect(st.nightQueue[st.nightQueueIndex]).toBe("doppelganger");

    // Doppelgänger copies Seat 2 (Robber) -> inserts doppelganger_action right next!
    st = oneNightWerewolfCartridge.reduce({
      state: st,
      command: { type: "DOPPELGANGER_COPY", targetSeatNo: 2 },
      actorSeatNo: 1,
      nowMs: 3_000,
    }).state;
    expect(st.nightQueue[st.nightQueueIndex]).toBe("doppelganger_action");
    expect(st.doppelgangerCopiedRole).toBe("robber");

    // Doppelgänger immediately uses Robber power to steal Seat 3 (Werewolf)!
    st = oneNightWerewolfCartridge.reduce({
      state: st,
      command: { type: "ROBBER_SWAP", targetSeatNo: 3 },
      actorSeatNo: 1,
      nowMs: 4_000,
    }).state;
    expect(st.players[0].currentRole).toBe("werewolf");
    expect(st.players[2].currentRole).toBe("doppelganger");

    // Let bots finish the rest of the match automatically
    const botRes = oneNightWerewolfCartridge.autoActBots!({
      current: { state: st, events: [], phaseDeadlineMs: st.phaseDeadlineMs },
      botSeatNos: [1, 2, 3, 4],
      nowMs: 5_000,
    });
    expect(botRes.state.step).toBe("MatchOver");
    expect(botRes.state.winningFactions.length).toBeGreaterThan(0);
  });
});
