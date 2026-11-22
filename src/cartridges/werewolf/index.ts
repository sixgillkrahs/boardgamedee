import type {
  CartridgeTransitionResult,
  ChannelPermission,
  GameCartridge,
  MatchEventRecord,
  SeatDescriptor,
} from "@/cartridges/types";

export type WerewolfRole =
  | "Werewolf"
  | "Villager"
  | "Seer"
  | "Bodyguard"
  | "Witch"
  | "Hunter";

export type WerewolfFaction = "WerewolfFaction" | "VillageFaction";

export type WerewolfPhase = "NightPhase" | "DayPhase" | "Finished";

export type WerewolfStep =
  | "NightActionStep"
  | "WitchStep"
  | "HunterRevengeStep"
  | "DayDiscussionStep"
  | "DayVotingStep"
  | "Finished";

export const WEREWOLF_ROLES: WerewolfRole[] = [
  "Werewolf",
  "Villager",
  "Seer",
  "Bodyguard",
  "Witch",
  "Hunter",
];

export const ROLE_META: Record<
  WerewolfRole,
  {
    nameVi: string;
    faction: WerewolfFaction;
    factionNameVi: string;
    shortDescriptionVi: string;
  }
> = {
  Werewolf: {
    nameVi: "Ma Sói",
    faction: "WerewolfFaction",
    factionNameVi: "Phe Ma Sói",
    shortDescriptionVi:
      "Mỗi đêm thức dậy cùng bầy Sói bàn bạc và chọn cắn 1 người trong làng.",
  },
  Villager: {
    nameVi: "Dân Làng",
    faction: "VillageFaction",
    factionNameVi: "Phe Dân Làng",
    shortDescriptionVi:
      "Không có quyền năng ban đêm. Dùng suy luận và lá phiếu ban ngày để tìm ra Ma Sói.",
  },
  Seer: {
    nameVi: "Tiên Tri",
    faction: "VillageFaction",
    factionNameVi: "Phe Dân Làng",
    shortDescriptionVi:
      "Mỗi đêm chọn soi 1 người còn sống để biết chính xác họ thuộc Phe Ma Sói hay Phe Dân Làng.",
  },
  Bodyguard: {
    nameVi: "Bảo Vệ",
    faction: "VillageFaction",
    factionNameVi: "Phe Dân Làng",
    shortDescriptionVi:
      "Mỗi đêm chọn bảo vệ 1 người khỏi vết cắn của Sói (không được bảo vệ cùng 1 người 2 đêm liên tiếp).",
  },
  Witch: {
    nameVi: "Phù Thủy",
    faction: "VillageFaction",
    factionNameVi: "Phe Dân Làng",
    shortDescriptionVi:
      "Sở hữu 1 bình Thuốc Cứu (cứu nạn nhân bị Sói cắn) và 1 bình Thuốc Độc (tiêu diệt 1 người), mỗi bình dùng 1 lần.",
  },
  Hunter: {
    nameVi: "Thợ Săn",
    faction: "VillageFaction",
    factionNameVi: "Phe Dân Làng",
    shortDescriptionVi:
      "Khi chết vì bất kỳ nguyên nhân nào, được quyền nổ súng kéo theo 1 người còn sống trước khi ngã xuống.",
  },
};

export interface WerewolfConfig {
  roleCounts: Record<WerewolfRole, number>;
  timers: {
    nightActionSeconds: number;
    witchSeconds: number;
    dayDiscussionSeconds: number;
    dayVotingSeconds: number;
    hunterRevengeSeconds: number;
  };
  revealRoleOnDeath: boolean;
}

export interface WerewolfSeatState {
  seatNo: number;
  actorId: string;
  displayName: string;
  avatarSeed?: string;
  role: WerewolfRole;
  alive: boolean;
  deathCause?: "werewolf_bite" | "witch_poison" | "day_execution" | "hunter_shot";
  diedAtCycle?: number;
}

export interface SeerKnowledge {
  cycle: number;
  targetSeatNo: number;
  faction: WerewolfFaction;
}

export interface WerewolfMatchState {
  config: WerewolfConfig;
  cycle: number;
  phase: WerewolfPhase;
  step: WerewolfStep;
  phaseDeadlineMs: number | null;
  seats: WerewolfSeatState[];

  // Night state
  werewolfVotes: Record<number, number>; // wolfSeatNo -> targetSeatNo
  werewolfSubmitted: Record<number, boolean>;
  pendingWolfTargetSeatNo: number | null;

  bodyguardTargetSeatNo: number | null;
  bodyguardSubmitted: boolean;
  lastProtectedSeatNoByBodyguard: Record<number, number | null>;

  seerTargetSeatNo: number | null;
  seerSubmitted: boolean;
  seerKnowledgeBySeat: Record<number, SeerKnowledge[]>;

  // Witch state
  witchPotionsBySeat: Record<
    number,
    { healAvailable: boolean; poisonAvailable: boolean }
  >;
  witchHealUsedTonight: boolean;
  witchPoisonTargetSeatNo: number | null;
  witchSubmitted: boolean;

  // Hunter revenge interrupt queue
  pendingHunterSeatNos: number[];
  activeHunterSeatNo: number | null;
  resumeAfterHunter: {
    phase: WerewolfPhase;
    step: "DayDiscussionStep" | "NightActionStep";
    incrementCycleOnResume: boolean;
  } | null;

  // Day state
  lastDawnDeaths: number[];
  lastExecutedSeatNo: number | null;
  readyToVoteSeatNos: number[];
  dayVotes: Record<number, number | "abstain">; // voterSeatNo -> targetSeatNo | 'abstain'

  // Outcome
  winningFaction: WerewolfFaction | null;
  winReasonVi: string | null;
}

export type WerewolfCommand =
  | { type: "WEREWOLF_VOTE"; targetSeatNo: number; lock?: boolean }
  | { type: "BODYGUARD_PROTECT"; targetSeatNo: number }
  | { type: "SEER_INSPECT"; targetSeatNo: number }
  | {
      type: "WITCH_ACT";
      useHeal?: boolean;
      poisonTargetSeatNo?: number | null;
    }
  | { type: "HUNTER_SHOOT"; targetSeatNo: number | null }
  | { type: "DAY_READY_TO_VOTE" }
  | { type: "DAY_VOTE"; targetSeatNo: number | "abstain" };

export interface WerewolfProjectedSeat {
  seatNo: number;
  actorId: string;
  displayName: string;
  avatarSeed?: string;
  alive: boolean;
  role: WerewolfRole | null;
  deathCause?: WerewolfSeatState["deathCause"];
  diedAtCycle?: number;
  readyToVote: boolean;
  dayVoteTarget: number | "abstain" | "voted" | null;
  werewolfVoteTarget: number | null;
}

export interface WerewolfPlayerView {
  cartridgeId: "werewolf";
  cycle: number;
  phase: WerewolfPhase;
  step: WerewolfStep;
  phaseDeadlineMs: number | null;
  viewerSeatNo: number | null;
  myRole: WerewolfRole | null;
  myFaction: WerewolfFaction | null;
  myAlive: boolean;
  seats: WerewolfProjectedSeat[];
  lastDawnDeaths: number[];
  lastExecutedSeatNo: number | null;
  winningFaction: WerewolfFaction | null;
  winReasonVi: string | null;
  config: WerewolfConfig;

  // Role-specific private knowledge
  seerInspections: SeerKnowledge[];
  lastProtectedSeatNo: number | null;
  witchState: {
    healAvailable: boolean;
    poisonAvailable: boolean;
    pendingWolfVictimSeatNo: number | null;
    witchHealUsedTonight: boolean;
    witchPoisonTargetSeatNo: number | null;
  } | null;
  activeHunterSeatNo: number | null;
  hasSubmittedCurrentStep: boolean;
}

export function getRoleFaction(role: WerewolfRole): WerewolfFaction {
  return ROLE_META[role].faction;
}

function getLivingSeats(state: WerewolfMatchState): WerewolfSeatState[] {
  return state.seats.filter((s) => s.alive);
}

function getLivingSeatsByRole(
  state: WerewolfMatchState,
  role: WerewolfRole
): WerewolfSeatState[] {
  return state.seats.filter((s) => s.alive && s.role === role);
}

function hasRoleInGame(state: WerewolfMatchState, role: WerewolfRole): boolean {
  return state.seats.some((s) => s.role === role);
}

function evaluateWinCondition(state: WerewolfMatchState): {
  winningFaction: WerewolfFaction | null;
  winReasonVi: string | null;
} {
  const living = getLivingSeats(state);
  const aliveWolves = living.filter((s) => s.role === "Werewolf").length;
  const aliveVillagers = living.length - aliveWolves;

  if (aliveWolves === 0) {
    return {
      winningFaction: "VillageFaction",
      winReasonVi:
        "Toàn bộ Ma Sói đã bị tiêu diệt! Phe Dân Làng giành chiến thắng!",
    };
  }

  if (aliveWolves >= aliveVillagers) {
    return {
      winningFaction: "WerewolfFaction",
      winReasonVi:
        "Số lượng Ma Sói đã áp đảo Dân Làng! Phe Ma Sói giành chiến thắng!",
    };
  }

  return { winningFaction: null, winReasonVi: null };
}

function resolvePluralityWolfTarget(
  werewolfVotes: Record<number, number>,
  livingSeats: WerewolfSeatState[]
): number | null {
  const counts = new Map<number, number>();
  const validTargets = new Set(livingSeats.map((s) => s.seatNo));

  for (const target of Object.values(werewolfVotes)) {
    if (validTargets.has(target)) {
      counts.set(target, (counts.get(target) ?? 0) + 1);
    }
  }

  let bestTarget: number | null = null;
  let bestCount = 0;
  for (const [target, count] of counts.entries()) {
    if (count > bestCount) {
      bestCount = count;
      bestTarget = target;
    }
  }
  return bestTarget;
}

function isNightActionStepComplete(state: WerewolfMatchState): boolean {
  const livingWolves = getLivingSeatsByRole(state, "Werewolf");
  const allWolvesDone =
    livingWolves.length === 0 ||
    livingWolves.every((w) => state.werewolfSubmitted[w.seatNo]);

  const livingSeers = getLivingSeatsByRole(state, "Seer");
  const seerDone = livingSeers.length === 0 || state.seerSubmitted;

  const livingBodyguards = getLivingSeatsByRole(state, "Bodyguard");
  const bodyguardDone =
    livingBodyguards.length === 0 || state.bodyguardSubmitted;

  return allWolvesDone && seerDone && bodyguardDone;
}

function enterNightPhase(
  state: WerewolfMatchState,
  cycle: number,
  nowMs: number,
  priorEvents: MatchEventRecord[]
): CartridgeTransitionResult<WerewolfMatchState> {
  const deadline = nowMs + state.config.timers.nightActionSeconds * 1000;
  const nextState: WerewolfMatchState = {
    ...state,
    cycle,
    phase: "NightPhase",
    step: "NightActionStep",
    phaseDeadlineMs: deadline,
    werewolfVotes: {},
    werewolfSubmitted: {},
    pendingWolfTargetSeatNo: null,
    bodyguardTargetSeatNo: null,
    bodyguardSubmitted: false,
    seerTargetSeatNo: null,
    seerSubmitted: false,
    witchHealUsedTonight: false,
    witchPoisonTargetSeatNo: null,
    witchSubmitted: false,
    readyToVoteSeatNos: [],
    dayVotes: {},
  };

  const events: MatchEventRecord[] = [
    ...priorEvents,
    {
      eventType: "NIGHT_STARTED",
      message: `Đêm thứ ${cycle} buông xuống. Cả làng chìm vào giấc ngủ...`,
      visibleToSeatNos: "all",
      payload: { cycle },
    },
  ];

  return {
    state: nextState,
    events,
    phaseDeadlineMs: deadline,
  };
}

function transitionAfterMortality(
  state: WerewolfMatchState,
  newlyDeadHunterSeatNos: number[],
  resumeTarget: {
    phase: WerewolfPhase;
    step: "DayDiscussionStep" | "NightActionStep";
    incrementCycleOnResume: boolean;
  },
  nowMs: number,
  events: MatchEventRecord[]
): CartridgeTransitionResult<WerewolfMatchState> {
  const allPendingHunters = [
    ...state.pendingHunterSeatNos,
    ...newlyDeadHunterSeatNos,
  ];

  if (allPendingHunters.length > 0) {
    const [nextHunter, ...restHunters] = allPendingHunters;
    const hunterSeat = state.seats.find((s) => s.seatNo === nextHunter);
    const deadline = nowMs + state.config.timers.hunterRevengeSeconds * 1000;
    const nextState: WerewolfMatchState = {
      ...state,
      step: "HunterRevengeStep",
      activeHunterSeatNo: nextHunter,
      pendingHunterSeatNos: restHunters,
      resumeAfterHunter: state.resumeAfterHunter ?? resumeTarget,
      phaseDeadlineMs: deadline,
    };

    return {
      state: nextState,
      events: [
        ...events,
        {
          eventType: "HUNTER_TRIGGERED",
          message: `Thợ Săn ${hunterSeat?.displayName ?? `#${nextHunter}`} ngã xuống và đang giương súng chọn mục tiêu cuối cùng!`,
          visibleToSeatNos: "all",
          payload: { hunterSeatNo: nextHunter },
        },
      ],
      phaseDeadlineMs: deadline,
    };
  }

  // All Hunter interrupts resolved -> check Win Condition
  const outcome = evaluateWinCondition(state);
  if (outcome.winningFaction) {
    const finishedState: WerewolfMatchState = {
      ...state,
      phase: "Finished",
      step: "Finished",
      phaseDeadlineMs: null,
      activeHunterSeatNo: null,
      resumeAfterHunter: null,
      winningFaction: outcome.winningFaction,
      winReasonVi: outcome.winReasonVi,
    };
    return {
      state: finishedState,
      events: [
        ...events,
        {
          eventType: "MATCH_FINISHED",
          message: outcome.winReasonVi ?? "Ván đấu đã kết thúc!",
          visibleToSeatNos: "all",
          payload: { winningFaction: outcome.winningFaction },
        },
      ],
      phaseDeadlineMs: null,
    };
  }

  const target = state.resumeAfterHunter ?? resumeTarget;
  const cleanedState: WerewolfMatchState = {
    ...state,
    activeHunterSeatNo: null,
    resumeAfterHunter: null,
  };

  if (target.step === "DayDiscussionStep") {
    const deadline =
      nowMs + cleanedState.config.timers.dayDiscussionSeconds * 1000;
    const dayState: WerewolfMatchState = {
      ...cleanedState,
      phase: "DayPhase",
      step: "DayDiscussionStep",
      phaseDeadlineMs: deadline,
      readyToVoteSeatNos: [],
      dayVotes: {},
    };
    return {
      state: dayState,
      events: [
        ...events,
        {
          eventType: "DAY_DISCUSSION_STARTED",
          message: `Ngày thứ ${dayState.cycle}: Dân làng bắt đầu thảo luận tìm ra Ma Sói.`,
          visibleToSeatNos: "all",
          payload: { cycle: dayState.cycle },
        },
      ],
      phaseDeadlineMs: deadline,
    };
  }

  const nextCycle = target.incrementCycleOnResume
    ? cleanedState.cycle + 1
    : cleanedState.cycle;
  return enterNightPhase(cleanedState, nextCycle, nowMs, events);
}

function resolveDawn(
  state: WerewolfMatchState,
  nowMs: number,
  priorEvents: MatchEventRecord[]
): CartridgeTransitionResult<WerewolfMatchState> {
  const wolfTarget = state.pendingWolfTargetSeatNo;
  const protectedSeat = state.bodyguardTargetSeatNo;
  const healed = state.witchHealUsedTonight;
  const poisonTarget = state.witchPoisonTargetSeatNo;

  // Remember who Bodyguard protected tonight
  const updatedLastProtected = { ...state.lastProtectedSeatNoByBodyguard };
  const livingBodyguards = getLivingSeatsByRole(state, "Bodyguard");
  for (const bg of livingBodyguards) {
    updatedLastProtected[bg.seatNo] = protectedSeat;
  }

  const deaths = new Map<number, WerewolfSeatState["deathCause"]>();

  if (wolfTarget !== null) {
    const isProtected = protectedSeat === wolfTarget;
    if (!isProtected && !healed) {
      deaths.set(wolfTarget, "werewolf_bite");
    }
  }

  if (poisonTarget !== null) {
    // Poison bypasses Bodyguard protection
    deaths.set(poisonTarget, "witch_poison");
  }

  const deadSeatNos = Array.from(deaths.keys()).sort((a, b) => a - b);
  const newlyDeadHunters: number[] = [];

  const updatedSeats = state.seats.map((seat) => {
    const cause = deaths.get(seat.seatNo);
    if (!cause || !seat.alive) return seat;
    if (seat.role === "Hunter") {
      newlyDeadHunters.push(seat.seatNo);
    }
    return {
      ...seat,
      alive: false,
      deathCause: cause,
      diedAtCycle: state.cycle,
    };
  });

  const events: MatchEventRecord[] = [...priorEvents];
  if (deadSeatNos.length === 0) {
    events.push({
      eventType: "DAWN_PEACEFUL",
      message: `Trời sáng rồi! Đêm thứ ${state.cycle} là một đêm bình yên, không ai thiệt mạng.`,
      visibleToSeatNos: "all",
      payload: { cycle: state.cycle, deadSeatNos: [] },
    });
  } else {
    const names = deadSeatNos
      .map((no) => {
        const s = updatedSeats.find((item) => item.seatNo === no);
        if (!s) return `#${no}`;
        const rolePart = state.config.revealRoleOnDeath
          ? ` (${ROLE_META[s.role].nameVi})`
          : "";
        return `${s.displayName}${rolePart}`;
      })
      .join(", ");

    events.push({
      eventType: "DAWN_DEATHS",
      message: `Trời sáng! Đêm qua làng đã mất: ${names}.`,
      visibleToSeatNos: "all",
      payload: { cycle: state.cycle, deadSeatNos },
    });
  }

  const nextState: WerewolfMatchState = {
    ...state,
    phase: "DayPhase",
    seats: updatedSeats,
    lastProtectedSeatNoByBodyguard: updatedLastProtected,
    lastDawnDeaths: deadSeatNos,
    lastExecutedSeatNo: null,
  };

  return transitionAfterMortality(
    nextState,
    newlyDeadHunters,
    {
      phase: "DayPhase",
      step: "DayDiscussionStep",
      incrementCycleOnResume: false,
    },
    nowMs,
    events
  );
}

function advanceFromNightActionStep(
  state: WerewolfMatchState,
  nowMs: number,
  priorEvents: MatchEventRecord[]
): CartridgeTransitionResult<WerewolfMatchState> {
  const wolfTarget = resolvePluralityWolfTarget(
    state.werewolfVotes,
    getLivingSeats(state)
  );
  const withWolfTarget: WerewolfMatchState = {
    ...state,
    pendingWolfTargetSeatNo: wolfTarget,
  };

  // If the match has a living Witch with at least one potion left, go to WitchStep
  const livingWitches = getLivingSeatsByRole(withWolfTarget, "Witch");
  const activeWitch = livingWitches.find((w) => {
    const p = withWolfTarget.witchPotionsBySeat[w.seatNo];
    return p && (p.healAvailable || p.poisonAvailable);
  });

  if (hasRoleInGame(withWolfTarget, "Witch") && activeWitch) {
    const deadline = nowMs + withWolfTarget.config.timers.witchSeconds * 1000;
    const witchState: WerewolfMatchState = {
      ...withWolfTarget,
      step: "WitchStep",
      phaseDeadlineMs: deadline,
      witchSubmitted: false,
    };
    return {
      state: witchState,
      events: [
        ...priorEvents,
        {
          eventType: "WITCH_STEP_STARTED",
          message: "Phù Thủy đang thức dậy kiểm tra các bình thuốc...",
          visibleToSeatNos: "all",
        },
      ],
      phaseDeadlineMs: deadline,
    };
  }

  return resolveDawn(withWolfTarget, nowMs, priorEvents);
}

function resolveDayVoting(
  state: WerewolfMatchState,
  nowMs: number,
  priorEvents: MatchEventRecord[]
): CartridgeTransitionResult<WerewolfMatchState> {
  const living = getLivingSeats(state);
  const tally = new Map<number | "abstain", number>();

  for (const seat of living) {
    const choice = state.dayVotes[seat.seatNo] ?? "abstain";
    tally.set(choice, (tally.get(choice) ?? 0) + 1);
  }

  let topChoice: number | "abstain" = "abstain";
  let topCount = -1;
  let isTie = false;

  for (const [choice, count] of tally.entries()) {
    if (count > topCount) {
      topCount = count;
      topChoice = choice;
      isTie = false;
    } else if (count === topCount) {
      isTie = true;
    }
  }

  const events: MatchEventRecord[] = [...priorEvents];

  if (isTie || topChoice === "abstain") {
    events.push({
      eventType: "DAY_VOTE_NO_EXECUTION",
      message: isTie
        ? "Kết quả bỏ phiếu hòa nhau! Không ai bị treo cổ hôm nay."
        : "Đa số chọn Bỏ phiếu trắng! Không ai bị treo cổ hôm nay.",
      visibleToSeatNos: "all",
      payload: { isTie, topChoice },
    });

    const noExecState: WerewolfMatchState = {
      ...state,
      lastExecutedSeatNo: null,
    };
    return enterNightPhase(noExecState, state.cycle + 1, nowMs, events);
  }

  const executedSeatNo = topChoice;
  const executedSeat = state.seats.find((s) => s.seatNo === executedSeatNo);
  const newlyDeadHunters: number[] = [];

  const updatedSeats = state.seats.map((seat) => {
    if (seat.seatNo !== executedSeatNo) return seat;
    if (seat.role === "Hunter") {
      newlyDeadHunters.push(seat.seatNo);
    }
    return {
      ...seat,
      alive: false,
      deathCause: "day_execution" as const,
      diedAtCycle: state.cycle,
    };
  });

  const roleReveal =
    executedSeat && state.config.revealRoleOnDeath
      ? ` (${ROLE_META[executedSeat.role].nameVi})`
      : "";

  events.push({
    eventType: "DAY_EXECUTION",
    message: `Dân làng đã biểu quyết treo cổ ${executedSeat?.displayName ?? `#${executedSeatNo}`}${roleReveal} với ${topCount} phiếu!`,
    visibleToSeatNos: "all",
    payload: { executedSeatNo, votes: topCount },
  });

  const postVoteState: WerewolfMatchState = {
    ...state,
    seats: updatedSeats,
    lastExecutedSeatNo: executedSeatNo,
  };

  return transitionAfterMortality(
    postVoteState,
    newlyDeadHunters,
    {
      phase: "NightPhase",
      step: "NightActionStep",
      incrementCycleOnResume: true,
    },
    nowMs,
    events
  );
}

export const werewolfCartridge: GameCartridge<
  WerewolfConfig,
  WerewolfMatchState,
  WerewolfCommand,
  WerewolfPlayerView
> = {
  cartridgeId: "werewolf",
  title: "Ma Sói (Werewolf)",
  subtitle: "Suy luận xã hội • Ẩn vai trò • 4–16 người chơi",
  description:
    "Cuộc đấu trí kinh điển giữa Bầy Sói ẩn mình trong bóng tối và Dân Làng cùng các chức năng đặc biệt (Tiên Tri, Bảo Vệ, Phù Thủy, Thợ Săn).",
  minSeats: 4,
  maxSeats: 16,
  available: true,

  defaultConfig(seatCount: number): WerewolfConfig {
    const clampedCount = Math.max(4, Math.min(16, seatCount));
    const wolves = clampedCount >= 12 ? 3 : clampedCount >= 6 ? 2 : 1;
    const seer = 1;
    const bodyguard = clampedCount >= 5 ? 1 : 0;
    const witch = clampedCount >= 6 ? 1 : 0;
    const hunter = clampedCount >= 7 ? 1 : 0;
    const assigned = wolves + seer + bodyguard + witch + hunter;
    const villagers = Math.max(1, clampedCount - assigned);

    return {
      roleCounts: {
        Werewolf: wolves,
        Villager: villagers,
        Seer: seer,
        Bodyguard: bodyguard,
        Witch: witch,
        Hunter: hunter,
      },
      timers: {
        nightActionSeconds: 35,
        witchSeconds: 20,
        dayDiscussionSeconds: 90,
        dayVotingSeconds: 35,
        hunterRevengeSeconds: 20,
      },
      revealRoleOnDeath: true,
    };
  },

  validateConfig(config: WerewolfConfig, seatCount: number) {
    if (seatCount < this.minSeats || seatCount > this.maxSeats) {
      return {
        valid: false,
        error: `Ma Sói yêu cầu từ ${this.minSeats} đến ${this.maxSeats} người chơi (hiện có ${seatCount}).`,
      };
    }

    const counts = config.roleCounts;
    let totalRoles = 0;
    for (const role of WEREWOLF_ROLES) {
      const value = counts[role] ?? 0;
      if (!Number.isInteger(value) || value < 0) {
        return {
          valid: false,
          error: `Số lượng vai trò ${ROLE_META[role].nameVi} không hợp lệ.`,
        };
      }
      totalRoles += value;
    }

    if (totalRoles !== seatCount) {
      return {
        valid: false,
        error: `Tổng số vai trò (${totalRoles}) phải bằng đúng số ghế người chơi (${seatCount}).`,
      };
    }

    const wolves = counts.Werewolf ?? 0;
    const villagers = totalRoles - wolves;
    if (wolves < 1) {
      return {
        valid: false,
        error: "Cần ít nhất 1 Ma Sói để bắt đầu ván đấu.",
      };
    }
    if (wolves >= villagers) {
      return {
        valid: false,
        error: "Số lượng Phe Dân Làng phải nhiều hơn số lượng Ma Sói khi bắt đầu.",
      };
    }

    return { valid: true };
  },

  createInitialState({ config, seats, nowMs, rng = Math.random }) {
    const validation = this.validateConfig(config, seats.length);
    if (!validation.valid) {
      throw new Error(validation.error ?? "Invalid Werewolf config");
    }

    const deck: WerewolfRole[] = [];
    for (const role of WEREWOLF_ROLES) {
      const count = config.roleCounts[role] ?? 0;
      for (let i = 0; i < count; i++) {
        deck.push(role);
      }
    }

    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = deck[i];
      deck[i] = deck[j];
      deck[j] = tmp;
    }

    const sortedSeats = [...seats].sort((a, b) => a.seatNo - b.seatNo);
    const witchPotionsBySeat: WerewolfMatchState["witchPotionsBySeat"] = {};
    const seerKnowledgeBySeat: WerewolfMatchState["seerKnowledgeBySeat"] = {};
    const lastProtectedSeatNoByBodyguard: WerewolfMatchState["lastProtectedSeatNoByBodyguard"] =
      {};

    const matchSeats: WerewolfSeatState[] = sortedSeats.map((s, idx) => {
      const role = deck[idx];
      if (role === "Witch") {
        witchPotionsBySeat[s.seatNo] = {
          healAvailable: true,
          poisonAvailable: true,
        };
      }
      if (role === "Seer") {
        seerKnowledgeBySeat[s.seatNo] = [];
      }
      if (role === "Bodyguard") {
        lastProtectedSeatNoByBodyguard[s.seatNo] = null;
      }
      return {
        seatNo: s.seatNo,
        actorId: s.actorId,
        displayName: s.displayName,
        avatarSeed: s.avatarSeed,
        role,
        alive: true,
      };
    });

    const deadline = nowMs + config.timers.nightActionSeconds * 1000;
    const state: WerewolfMatchState = {
      config,
      cycle: 1,
      phase: "NightPhase",
      step: "NightActionStep",
      phaseDeadlineMs: deadline,
      seats: matchSeats,
      werewolfVotes: {},
      werewolfSubmitted: {},
      pendingWolfTargetSeatNo: null,
      bodyguardTargetSeatNo: null,
      bodyguardSubmitted: false,
      lastProtectedSeatNoByBodyguard,
      seerTargetSeatNo: null,
      seerSubmitted: false,
      seerKnowledgeBySeat,
      witchPotionsBySeat,
      witchHealUsedTonight: false,
      witchPoisonTargetSeatNo: null,
      witchSubmitted: false,
      pendingHunterSeatNos: [],
      activeHunterSeatNo: null,
      resumeAfterHunter: null,
      lastDawnDeaths: [],
      lastExecutedSeatNo: null,
      readyToVoteSeatNos: [],
      dayVotes: {},
      winningFaction: null,
      winReasonVi: null,
    };

    return {
      state,
      events: [
        {
          eventType: "MATCH_STARTED",
          message:
            "Ván đấu Ma Sói bắt đầu! Đêm thứ 1 buông xuống, các vai trò chức năng đang hành động...",
          visibleToSeatNos: "all",
          payload: { cycle: 1 },
        },
      ],
      phaseDeadlineMs: deadline,
    };
  },

  reduce({ state, command, actorSeatNo, nowMs }) {
    if (state.phase === "Finished") {
      throw new Error("Ván đấu đã kết thúc.");
    }

    const actorSeat = state.seats.find((s) => s.seatNo === actorSeatNo);
    if (!actorSeat) {
      throw new Error("Không tìm thấy ghế người chơi.");
    }

    // HunterRevengeStep: the dead Hunter is the only one who acts
    if (state.step === "HunterRevengeStep") {
      if (
        command.type !== "HUNTER_SHOOT" ||
        state.activeHunterSeatNo !== actorSeatNo
      ) {
        throw new Error("Chỉ Thợ Săn vừa ngã xuống mới được nổ súng lúc này.");
      }

      const events: MatchEventRecord[] = [];
      let nextSeats = state.seats;
      const newlyDeadHunters: number[] = [];

      if (command.targetSeatNo !== null) {
        const target = state.seats.find(
          (s) => s.seatNo === command.targetSeatNo && s.alive
        );
        if (!target) {
          throw new Error("Mục tiêu bắn không hợp lệ.");
        }

        nextSeats = state.seats.map((s) => {
          if (s.seatNo !== target.seatNo) return s;
          if (s.role === "Hunter") {
            newlyDeadHunters.push(s.seatNo);
          }
          return {
            ...s,
            alive: false,
            deathCause: "hunter_shot" as const,
            diedAtCycle: state.cycle,
          };
        });

        const roleReveal = state.config.revealRoleOnDeath
          ? ` (${ROLE_META[target.role].nameVi})`
          : "";

        events.push({
          eventType: "HUNTER_SHOT_FIRED",
          message: `Đoàng! Thợ Săn ${actorSeat.displayName} đã nổ súng kéo theo ${target.displayName}${roleReveal}!`,
          visibleToSeatNos: "all",
          payload: {
            hunterSeatNo: actorSeatNo,
            targetSeatNo: target.seatNo,
          },
        });
      } else {
        events.push({
          eventType: "HUNTER_SHOT_SKIPPED",
          message: `Thợ Săn ${actorSeat.displayName} đã chọn không nổ súng.`,
          visibleToSeatNos: "all",
          payload: { hunterSeatNo: actorSeatNo },
        });
      }

      const resume = state.resumeAfterHunter ?? {
        phase: "DayPhase" as const,
        step: "DayDiscussionStep" as const,
        incrementCycleOnResume: false,
      };

      const updatedState: WerewolfMatchState = {
        ...state,
        seats: nextSeats,
      };

      return transitionAfterMortality(
        updatedState,
        newlyDeadHunters,
        resume,
        nowMs,
        events
      );
    }

    // All other commands require the actor seat to be alive
    if (!actorSeat.alive) {
      throw new Error("Người chơi đã chết không thể thực hiện hành động này.");
    }

    if (state.step === "NightActionStep") {
      if (command.type === "WEREWOLF_VOTE") {
        if (actorSeat.role !== "Werewolf") {
          throw new Error("Chỉ Ma Sói mới có thể chọn mục tiêu cắn.");
        }
        const target = state.seats.find(
          (s) => s.seatNo === command.targetSeatNo && s.alive
        );
        if (!target) {
          throw new Error("Mục tiêu không hợp lệ.");
        }

        const shouldLock = command.lock !== false;
        const nextState: WerewolfMatchState = {
          ...state,
          werewolfVotes: {
            ...state.werewolfVotes,
            [actorSeatNo]: target.seatNo,
          },
          werewolfSubmitted: shouldLock
            ? {
                ...state.werewolfSubmitted,
                [actorSeatNo]: true,
              }
            : state.werewolfSubmitted,
        };

        const wolfSeats = state.seats
          .filter((s) => s.role === "Werewolf")
          .map((s) => s.seatNo);
        const voteEvent: MatchEventRecord = {
          eventType: shouldLock
            ? "WEREWOLF_TARGET_LOCKED"
            : "WEREWOLF_TARGET_AIMED",
          message: shouldLock
            ? `${actorSeat.displayName} đã chốt cắn ${target.displayName} (#${target.seatNo}).`
            : `${actorSeat.displayName} đang đề xuất cắn ${target.displayName} (#${target.seatNo}).`,
          visibleToSeatNos: wolfSeats,
          payload: {
            actorSeatNo,
            targetSeatNo: target.seatNo,
            locked: shouldLock,
          },
        };

        if (shouldLock && isNightActionStepComplete(nextState)) {
          return advanceFromNightActionStep(nextState, nowMs, [voteEvent]);
        }

        return {
          state: nextState,
          events: shouldLock ? [voteEvent] : [],
          phaseDeadlineMs: nextState.phaseDeadlineMs,
        };
      }

      if (command.type === "BODYGUARD_PROTECT") {
        if (actorSeat.role !== "Bodyguard") {
          throw new Error("Chỉ Bảo Vệ mới có thể thực hiện hành động này.");
        }
        if (state.bodyguardSubmitted) {
          throw new Error("Bảo Vệ đã chọn người bảo vệ trong đêm nay rồi.");
        }
        const target = state.seats.find(
          (s) => s.seatNo === command.targetSeatNo && s.alive
        );
        if (!target) {
          throw new Error("Mục tiêu bảo vệ không hợp lệ.");
        }
        const lastProtected =
          state.lastProtectedSeatNoByBodyguard[actorSeatNo] ?? null;
        if (lastProtected !== null && lastProtected === target.seatNo) {
          throw new Error(
            "Bảo Vệ không được bảo vệ cùng 1 người trong 2 đêm liên tiếp."
          );
        }

        const nextState: WerewolfMatchState = {
          ...state,
          bodyguardTargetSeatNo: target.seatNo,
          bodyguardSubmitted: true,
        };

        const bgEvent: MatchEventRecord = {
          eventType: "BODYGUARD_PROTECTED",
          message: `Bạn đã chọn bảo vệ ${target.displayName} trong đêm thứ ${state.cycle}.`,
          visibleToSeatNos: [actorSeatNo],
          payload: { targetSeatNo: target.seatNo },
        };

        if (isNightActionStepComplete(nextState)) {
          return advanceFromNightActionStep(nextState, nowMs, [bgEvent]);
        }

        return {
          state: nextState,
          events: [bgEvent],
          phaseDeadlineMs: nextState.phaseDeadlineMs,
        };
      }

      if (command.type === "SEER_INSPECT") {
        if (actorSeat.role !== "Seer") {
          throw new Error("Chỉ Tiên Tri mới có thể soi vai trò.");
        }
        if (state.seerSubmitted) {
          throw new Error("Tiên Tri đã sử dụng lượt soi trong đêm nay rồi.");
        }
        const target = state.seats.find(
          (s) => s.seatNo === command.targetSeatNo && s.alive
        );
        if (!target) {
          throw new Error("Mục tiêu soi không hợp lệ.");
        }

        const targetFaction = getRoleFaction(target.role);
        const existingHistory = state.seerKnowledgeBySeat[actorSeatNo] ?? [];
        const inspection: SeerKnowledge = {
          cycle: state.cycle,
          targetSeatNo: target.seatNo,
          faction: targetFaction,
        };

        const nextState: WerewolfMatchState = {
          ...state,
          seerTargetSeatNo: target.seatNo,
          seerSubmitted: true,
          seerKnowledgeBySeat: {
            ...state.seerKnowledgeBySeat,
            [actorSeatNo]: [...existingHistory, inspection],
          },
        };

        const seerEvent: MatchEventRecord = {
          eventType: "SEER_INSPECTED",
          message: `Kết quả soi ${target.displayName}: ${
            targetFaction === "WerewolfFaction"
              ? "PHE MA SÓI!"
              : "Phe Dân Làng"
          }`,
          visibleToSeatNos: [actorSeatNo],
          payload: { targetSeatNo: target.seatNo, faction: targetFaction },
        };

        if (isNightActionStepComplete(nextState)) {
          return advanceFromNightActionStep(nextState, nowMs, [seerEvent]);
        }

        return {
          state: nextState,
          events: [seerEvent],
          phaseDeadlineMs: nextState.phaseDeadlineMs,
        };
      }

      throw new Error("Hành động không hợp lệ ở bước Đêm 1.");
    }

    if (state.step === "WitchStep") {
      if (command.type !== "WITCH_ACT" || actorSeat.role !== "Witch") {
        throw new Error("Chỉ Phù Thủy mới có thể hành động ở bước này.");
      }

      const potions = state.witchPotionsBySeat[actorSeatNo] ?? {
        healAvailable: false,
        poisonAvailable: false,
      };

      const wantHeal = Boolean(command.useHeal);
      const poisonTarget = command.poisonTargetSeatNo ?? null;

      if (wantHeal) {
        if (!potions.healAvailable) {
          throw new Error("Bình Thuốc Cứu đã được sử dụng ở đêm trước.");
        }
        if (state.pendingWolfTargetSeatNo === null) {
          throw new Error("Đêm nay không có ai bị Sói cắn để cứu.");
        }
      }

      if (poisonTarget !== null) {
        if (!potions.poisonAvailable) {
          throw new Error("Bình Thuốc Độc đã được sử dụng ở đêm trước.");
        }
        const validTarget = state.seats.find(
          (s) => s.seatNo === poisonTarget && s.alive
        );
        if (!validTarget) {
          throw new Error("Mục tiêu dùng Thuốc Độc không hợp lệ.");
        }
      }

      const nextState: WerewolfMatchState = {
        ...state,
        witchHealUsedTonight: wantHeal,
        witchPoisonTargetSeatNo: poisonTarget,
        witchSubmitted: true,
        witchPotionsBySeat: {
          ...state.witchPotionsBySeat,
          [actorSeatNo]: {
            healAvailable: potions.healAvailable && !wantHeal,
            poisonAvailable:
              potions.poisonAvailable && poisonTarget === null,
          },
        },
      };

      const witchEvents: MatchEventRecord[] = [];
      if (wantHeal) {
        witchEvents.push({
          eventType: "WITCH_HEALED",
          message: "Bạn đã sử dụng bình Thuốc Cứu trong đêm nay.",
          visibleToSeatNos: [actorSeatNo],
        });
      }
      if (poisonTarget !== null) {
        const poisonedSeat = state.seats.find((s) => s.seatNo === poisonTarget);
        witchEvents.push({
          eventType: "WITCH_POISONED",
          message: `Bạn đã dùng bình Thuốc Độc lên ${poisonedSeat?.displayName ?? `#${poisonTarget}`}.`,
          visibleToSeatNos: [actorSeatNo],
          payload: { targetSeatNo: poisonTarget },
        });
      }

      return resolveDawn(nextState, nowMs, witchEvents);
    }

    if (state.step === "DayDiscussionStep") {
      if (command.type !== "DAY_READY_TO_VOTE") {
        throw new Error("Đang trong thời gian thảo luận ban ngày.");
      }

      const readySet = new Set(state.readyToVoteSeatNos);
      readySet.add(actorSeatNo);
      const updatedReady = Array.from(readySet).sort((a, b) => a - b);
      const livingSeats = getLivingSeats(state);

      const allReady = livingSeats.every((s) => readySet.has(s.seatNo));
      if (allReady) {
        const deadline = nowMs + state.config.timers.dayVotingSeconds * 1000;
        const votingState: WerewolfMatchState = {
          ...state,
          step: "DayVotingStep",
          phaseDeadlineMs: deadline,
          readyToVoteSeatNos: updatedReady,
          dayVotes: {},
        };
        return {
          state: votingState,
          events: [
            {
              eventType: "DAY_VOTING_STARTED",
              message:
                "Tất cả người chơi đã sẵn sàng! Bước bỏ phiếu treo cổ bắt đầu.",
              visibleToSeatNos: "all",
            },
          ],
          phaseDeadlineMs: deadline,
        };
      }

      return {
        state: {
          ...state,
          readyToVoteSeatNos: updatedReady,
        },
        events: [],
        phaseDeadlineMs: state.phaseDeadlineMs,
      };
    }

    if (state.step === "DayVotingStep") {
      if (command.type !== "DAY_VOTE") {
        throw new Error("Chỉ có thể bỏ phiếu ở bước này.");
      }

      if (command.targetSeatNo !== "abstain") {
        const target = state.seats.find(
          (s) => s.seatNo === command.targetSeatNo && s.alive
        );
        if (!target) {
          throw new Error("Người bị bỏ phiếu phải đang còn sống.");
        }
      }

      const updatedVotes: WerewolfMatchState["dayVotes"] = {
        ...state.dayVotes,
        [actorSeatNo]: command.targetSeatNo,
      };

      const nextState: WerewolfMatchState = {
        ...state,
        dayVotes: updatedVotes,
      };

      const targetLabel =
        command.targetSeatNo === "abstain"
          ? "Bỏ phiếu trắng"
          : state.seats.find((s) => s.seatNo === command.targetSeatNo)
              ?.displayName ?? `#${command.targetSeatNo}`;

      const voteEvent: MatchEventRecord = {
        eventType: "DAY_VOTE_CAST",
        message: `${actorSeat.displayName} đã bỏ phiếu: ${targetLabel}.`,
        visibleToSeatNos: "all",
        payload: {
          voterSeatNo: actorSeatNo,
          targetSeatNo: command.targetSeatNo,
        },
      };

      const living = getLivingSeats(nextState);
      const allVoted = living.every(
        (s) => nextState.dayVotes[s.seatNo] !== undefined
      );

      if (allVoted) {
        return resolveDayVoting(nextState, nowMs, [voteEvent]);
      }

      return {
        state: nextState,
        events: [voteEvent],
        phaseDeadlineMs: nextState.phaseDeadlineMs,
      };
    }

    throw new Error("Trạng thái ván đấu không hỗ trợ hành động này.");
  },

  onPhaseTimeout({ state, nowMs }) {
    if (state.phase === "Finished") {
      return { state, events: [], phaseDeadlineMs: null };
    }

    const timeoutEvent: MatchEventRecord = {
      eventType: "PHASE_TIMEOUT",
      message: "Hết thời gian của bước hiện tại, hệ thống tự động chuyển bước.",
      visibleToSeatNos: "all",
      payload: { step: state.step },
    };

    if (state.step === "NightActionStep") {
      return advanceFromNightActionStep(state, nowMs, [timeoutEvent]);
    }

    if (state.step === "WitchStep") {
      return resolveDawn(state, nowMs, [timeoutEvent]);
    }

    if (state.step === "HunterRevengeStep") {
      const resume = state.resumeAfterHunter ?? {
        phase: "DayPhase" as const,
        step: "DayDiscussionStep" as const,
        incrementCycleOnResume: false,
      };
      return transitionAfterMortality(state, [], resume, nowMs, [
        timeoutEvent,
      ]);
    }

    if (state.step === "DayDiscussionStep") {
      const deadline = nowMs + state.config.timers.dayVotingSeconds * 1000;
      const votingState: WerewolfMatchState = {
        ...state,
        step: "DayVotingStep",
        phaseDeadlineMs: deadline,
        dayVotes: {},
      };
      return {
        state: votingState,
        events: [
          timeoutEvent,
          {
            eventType: "DAY_VOTING_STARTED",
            message: "Hết giờ thảo luận! Chuyển sang bước bỏ phiếu treo cổ.",
            visibleToSeatNos: "all",
          },
        ],
        phaseDeadlineMs: deadline,
      };
    }

    if (state.step === "DayVotingStep") {
      return resolveDayVoting(state, nowMs, [timeoutEvent]);
    }

    return { state, events: [], phaseDeadlineMs: state.phaseDeadlineMs };
  },

  projectView({ state, viewerSeatNo }) {
    const viewerSeat =
      viewerSeatNo !== null
        ? state.seats.find((s) => s.seatNo === viewerSeatNo) ?? null
        : null;

    const myRole = viewerSeat?.role ?? null;
    const myFaction = myRole ? getRoleFaction(myRole) : null;
    const isFinished = state.phase === "Finished";

    const seats: WerewolfProjectedSeat[] = state.seats.map((s) => {
      let visibleRole: WerewolfRole | null = null;

      if (isFinished) {
        visibleRole = s.role;
      } else if (viewerSeatNo === s.seatNo) {
        visibleRole = s.role;
      } else if (!s.alive && state.config.revealRoleOnDeath) {
        visibleRole = s.role;
      } else if (myRole === "Werewolf" && s.role === "Werewolf") {
        // Werewolves always know their fellow pack members
        visibleRole = "Werewolf";
      }

      const dayVoteRaw = state.dayVotes[s.seatNo];
      const dayVoteTarget =
        state.step === "DayVotingStep" || state.phase === "DayPhase"
          ? dayVoteRaw ?? null
          : null;

      const werewolfVoteTarget =
        myRole === "Werewolf" ? state.werewolfVotes[s.seatNo] ?? null : null;

      return {
        seatNo: s.seatNo,
        actorId: s.actorId,
        displayName: s.displayName,
        avatarSeed: s.avatarSeed,
        alive: s.alive,
        role: visibleRole,
        deathCause: s.deathCause,
        diedAtCycle: s.diedAtCycle,
        readyToVote: state.readyToVoteSeatNos.includes(s.seatNo),
        dayVoteTarget,
        werewolfVoteTarget,
      };
    });

    const seerInspections =
      viewerSeatNo !== null && myRole === "Seer"
        ? state.seerKnowledgeBySeat[viewerSeatNo] ?? []
        : [];

    const lastProtectedSeatNo =
      viewerSeatNo !== null && myRole === "Bodyguard"
        ? state.lastProtectedSeatNoByBodyguard[viewerSeatNo] ?? null
        : null;

    let witchState: WerewolfPlayerView["witchState"] = null;
    if (viewerSeatNo !== null && myRole === "Witch") {
      const potions = state.witchPotionsBySeat[viewerSeatNo] ?? {
        healAvailable: false,
        poisonAvailable: false,
      };
      witchState = {
        healAvailable: potions.healAvailable,
        poisonAvailable: potions.poisonAvailable,
        pendingWolfVictimSeatNo:
          state.step === "WitchStep" && potions.healAvailable
            ? state.pendingWolfTargetSeatNo
            : null,
        witchHealUsedTonight: state.witchHealUsedTonight,
        witchPoisonTargetSeatNo: state.witchPoisonTargetSeatNo,
      };
    }

    let hasSubmittedCurrentStep = false;
    if (viewerSeatNo !== null && viewerSeat) {
      if (state.step === "NightActionStep") {
        if (myRole === "Werewolf") {
          hasSubmittedCurrentStep = Boolean(
            state.werewolfSubmitted[viewerSeatNo]
          );
        } else if (myRole === "Bodyguard") {
          hasSubmittedCurrentStep = state.bodyguardSubmitted;
        } else if (myRole === "Seer") {
          hasSubmittedCurrentStep = state.seerSubmitted;
        } else {
          hasSubmittedCurrentStep = true;
        }
      } else if (state.step === "WitchStep") {
        hasSubmittedCurrentStep =
          myRole === "Witch" ? state.witchSubmitted : true;
      } else if (state.step === "HunterRevengeStep") {
        hasSubmittedCurrentStep = state.activeHunterSeatNo !== viewerSeatNo;
      } else if (state.step === "DayDiscussionStep") {
        hasSubmittedCurrentStep =
          state.readyToVoteSeatNos.includes(viewerSeatNo);
      } else if (state.step === "DayVotingStep") {
        hasSubmittedCurrentStep = state.dayVotes[viewerSeatNo] !== undefined;
      }
    }

    return {
      cartridgeId: "werewolf",
      cycle: state.cycle,
      phase: state.phase,
      step: state.step,
      phaseDeadlineMs: state.phaseDeadlineMs,
      viewerSeatNo,
      myRole,
      myFaction,
      myAlive: viewerSeat?.alive ?? false,
      seats,
      lastDawnDeaths: state.lastDawnDeaths,
      lastExecutedSeatNo: state.lastExecutedSeatNo,
      winningFaction: state.winningFaction,
      winReasonVi: state.winReasonVi,
      config: state.config,
      seerInspections,
      lastProtectedSeatNo,
      witchState,
      activeHunterSeatNo: state.activeHunterSeatNo,
      hasSubmittedCurrentStep,
    };
  },

  resolveChannels({ state, viewerSeatNo }): ChannelPermission[] {
    const viewerSeat =
      viewerSeatNo !== null
        ? state.seats.find((s) => s.seatNo === viewerSeatNo) ?? null
        : null;

    const isAlive = viewerSeat?.alive ?? false;
    const isWerewolf = viewerSeat?.role === "Werewolf";
    const isFinished = state.phase === "Finished";
    const isDay = state.phase === "DayPhase";
    const isNight = state.phase === "NightPhase";

    const channels: ChannelPermission[] = [
      {
        channelId: "village",
        label: "Làng (Công khai)",
        canRead: true,
        canWrite: isFinished || (isAlive && isDay),
      },
    ];

    if (isWerewolf || isFinished) {
      channels.push({
        channelId: "werewolf",
        label: "Bầy Sói (Mật)",
        canRead: true,
        canWrite: !isFinished && isAlive && isWerewolf && isNight,
      });
    }

    if (!isAlive || isFinished) {
      channels.push({
        channelId: "graveyard",
        label: "Nghĩa Địa (Linh hồn)",
        canRead: !isAlive || isFinished,
        canWrite: !isFinished && viewerSeat !== null && !isAlive,
      });
    }

    return channels;
  },

  isMatchOver(state) {
    return state.phase === "Finished";
  },

  getWinningFaction(state) {
    return state.winningFaction;
  },

  autoActBots({ current, botSeatNos, nowMs }) {
    const botSet = new Set(botSeatNos);
    if (botSet.size === 0) return current;

    let state = current.state;
    const events = [...current.events];
    let phaseDeadlineMs = current.phaseDeadlineMs;

    for (let guard = 0; guard < 8; guard++) {
      if (state.phase === "Finished") break;

      let botActed = false;
      const livingSeats = state.seats.filter((s) => s.alive);
      const livingBots = livingSeats.filter((s) => botSet.has(s.seatNo));

      if (state.step === "NightActionStep") {
        const humanWolves = livingSeats.filter(
          (s) => s.role === "Werewolf" && !botSet.has(s.seatNo)
        );
        const allHumanWolvesLocked =
          humanWolves.length === 0 ||
          humanWolves.every((hw) => state.werewolfSubmitted[hw.seatNo]);

        for (const bot of livingBots) {
          if (bot.role === "Werewolf") {
            const alreadyAimed = state.werewolfVotes[bot.seatNo] !== undefined;
            const alreadyLocked = Boolean(state.werewolfSubmitted[bot.seatNo]);

            if (!alreadyLocked && (allHumanWolvesLocked || !alreadyAimed)) {
              const targets = livingSeats.filter((s) => s.role !== "Werewolf");
              const target = targets[0] ?? livingSeats[0];
              if (target) {
                const res = this.reduce({
                  state,
                  actorSeatNo: bot.seatNo,
                  command: {
                    type: "WEREWOLF_VOTE",
                    targetSeatNo: target.seatNo,
                    lock: allHumanWolvesLocked,
                  },
                  nowMs,
                });
                state = res.state;
                events.push(...res.events);
                phaseDeadlineMs = res.phaseDeadlineMs;
                botActed = true;
                break;
              }
            }
          }
          if (bot.role === "Seer" && !state.seerSubmitted) {
            const targets = livingSeats.filter((s) => s.seatNo !== bot.seatNo);
            const target = targets[0];
            if (target) {
              const res = this.reduce({
                state,
                actorSeatNo: bot.seatNo,
                command: { type: "SEER_INSPECT", targetSeatNo: target.seatNo },
                nowMs,
              });
              state = res.state;
              events.push(...res.events);
              phaseDeadlineMs = res.phaseDeadlineMs;
              botActed = true;
              break;
            }
          }
          if (bot.role === "Bodyguard" && !state.bodyguardSubmitted) {
            const lastProt = state.lastProtectedSeatNoByBodyguard[bot.seatNo];
            const targets = livingSeats.filter((s) => s.seatNo !== lastProt);
            const target = targets[0];
            if (target) {
              const res = this.reduce({
                state,
                actorSeatNo: bot.seatNo,
                command: {
                  type: "BODYGUARD_PROTECT",
                  targetSeatNo: target.seatNo,
                },
                nowMs,
              });
              state = res.state;
              events.push(...res.events);
              phaseDeadlineMs = res.phaseDeadlineMs;
              botActed = true;
              break;
            }
          }
        }
      } else if (state.step === "WitchStep") {
        const witchBot = livingBots.find((b) => b.role === "Witch");
        if (witchBot && !state.witchSubmitted) {
          const res = this.reduce({
            state,
            actorSeatNo: witchBot.seatNo,
            command: {
              type: "WITCH_ACT",
              useHeal: false,
              poisonTargetSeatNo: null,
            },
            nowMs,
          });
          state = res.state;
          events.push(...res.events);
          phaseDeadlineMs = res.phaseDeadlineMs;
          botActed = true;
        }
      } else if (
        state.step === "HunterRevengeStep" &&
        state.activeHunterSeatNo &&
        botSet.has(state.activeHunterSeatNo)
      ) {
        const target = livingSeats[0];
        const res = this.reduce({
          state,
          actorSeatNo: state.activeHunterSeatNo,
          command: {
            type: "HUNTER_SHOOT",
            targetSeatNo: target ? target.seatNo : null,
          },
          nowMs,
        });
        state = res.state;
        events.push(...res.events);
        phaseDeadlineMs = res.phaseDeadlineMs;
        botActed = true;
      } else if (state.step === "DayDiscussionStep") {
        const humansLiving = livingSeats.filter((s) => !botSet.has(s.seatNo));
        const anyHumanReady =
          humansLiving.length === 0 ||
          humansLiving.some((h) => state.readyToVoteSeatNos.includes(h.seatNo));
        if (anyHumanReady) {
          const unreadyBot = livingBots.find(
            (b) => !state.readyToVoteSeatNos.includes(b.seatNo)
          );
          if (unreadyBot) {
            const res = this.reduce({
              state,
              actorSeatNo: unreadyBot.seatNo,
              command: { type: "DAY_READY_TO_VOTE" },
              nowMs,
            });
            state = res.state;
            events.push(...res.events);
            phaseDeadlineMs = res.phaseDeadlineMs;
            botActed = true;
          }
        }
      } else if (state.step === "DayVotingStep") {
        const humansLiving = livingSeats.filter((s) => !botSet.has(s.seatNo));
        const anyHumanVoted =
          humansLiving.length === 0 ||
          humansLiving.some((h) => state.dayVotes[h.seatNo] !== undefined);
        if (anyHumanVoted) {
          const unvotedBot = livingBots.find(
            (b) => state.dayVotes[b.seatNo] === undefined
          );
          if (unvotedBot) {
            const res = this.reduce({
              state,
              actorSeatNo: unvotedBot.seatNo,
              command: { type: "DAY_VOTE", targetSeatNo: "abstain" },
              nowMs,
            });
            state = res.state;
            events.push(...res.events);
            phaseDeadlineMs = res.phaseDeadlineMs;
            botActed = true;
          }
        }
      }

      if (!botActed) break;
    }

    return { state, events, phaseDeadlineMs };
  },
};
