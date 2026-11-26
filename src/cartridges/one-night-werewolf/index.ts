import type {
  CartridgeTransitionResult,
  ChannelPermission,
  GameCartridge,
  MatchEventRecord,
} from "@/cartridges/types";
import {
  ALL_ONUW_ROLE_IDS,
  DOPPELGANGER_IMMEDIATE_ROLES,
  NIGHT_WAKE_ORDER,
  ONUW_ROLE_META,
  countRoles,
  defaultRolesForSeatCount,
  type OnuwFaction,
  type OnuwRoleId,
} from "./roles";

export * from "./roles";

export interface OnuwConfig {
  roles: OnuwRoleId[];
  roleRevealSeconds: number;
  nightStepSeconds: number;
  dayDiscussionSeconds: number;
  dayVoteSeconds: number;
  allowLoneWolfPeek: boolean;
}

export type OnuwStep =
  | "RoleRevealStep"
  | "NightStep"
  | "DayDiscussionStep"
  | "DayVotingStep"
  | "MatchOver";

export type OnuwNightPhase =
  | "doppelganger"
  | "doppelganger_action"
  | "werewolf"
  | "minion"
  | "mason"
  | "seer"
  | "robber"
  | "troublemaker"
  | "drunk"
  | "insomniac"
  | "doppelganger_insomniac";

export interface OnuwPrivateInfo {
  /** Role copied by Doppelgänger (if this seat started as Doppelgänger) */
  doppelgangerCopiedSeatNo?: number;
  doppelgangerCopiedRole?: OnuwRoleId;
  /** Other Werewolf seats seen during Werewolf or Minion phase */
  seenWerewolfSeats?: number[];
  /** Other Mason seats seen during Mason phase */
  seenMasonSeats?: number[];
  /** Player cards peeked (e.g. Seer, Robber new card, Insomniac final check) */
  peekedPlayers: Array<{ seatNo: number; role: OnuwRoleId; note: string }>;
  /** Center cards peeked (index 0 | 1 | 2) */
  peekedCenter: Array<{ centerIdx: number; role: OnuwRoleId; note: string }>;
  /** Action summary lines private to this seat */
  actionNotes: string[];
}

export interface OnuwNightLogEntry {
  phase: OnuwNightPhase;
  actorSeatNo: number;
  summaryVi: string;
  /** Optional visual swap hint for end-of-game timeline */
  swap?:
    | { kind: "players"; seatA: number; seatB: number }
    | { kind: "center"; seatNo: number; centerIdx: number };
}

export interface OnuwPlayerState {
  seatNo: number;
  actorId: string;
  displayName: string;
  initialRole: OnuwRoleId;
  currentRole: OnuwRoleId;
  privateInfo: OnuwPrivateInfo;
}

export interface OnuwState {
  step: OnuwStep;
  config: OnuwConfig;
  players: OnuwPlayerState[];
  /** 3 face-down center cards (index 0, 1, 2) */
  centerCards: [OnuwRoleId, OnuwRoleId, OnuwRoleId];
  initialCenterCards: [OnuwRoleId, OnuwRoleId, OnuwRoleId];
  /** The role copied by the Doppelgänger (travels with the Doppelgänger card if swapped!) */
  doppelgangerCopiedRole: OnuwRoleId | null;
  doppelgangerSeatNo: number | null;
  /** Active night wake queue and current index */
  nightQueue: OnuwNightPhase[];
  nightQueueIndex: number;
  /** Seats that have confirmed/acted in the current step or night phase */
  actedSeatNos: number[];
  /** Seats ready to advance from RoleRevealStep or DayDiscussionStep */
  readySeatNos: number[];
  /** DayVotingStep secret votes: voterSeatNo -> targetSeatNo */
  votes: Record<number, number>;
  /** Full night action history (revealed only at MatchOver) */
  nightHistory: OnuwNightLogEntry[];
  /** Resolution results (populated at MatchOver) */
  eliminatedSeatNos: number[];
  hunterKillSeatNos: number[];
  winningFactions: OnuwFaction[];
  winnerSeatNos: number[];
  winReasonVi: string | null;
  phaseDeadlineMs: number | null;
  actionSeq: number;
}

export type OnuwCommand =
  | { type: "CONFIRM_REVEAL" }
  | { type: "DOPPELGANGER_COPY"; targetSeatNo: number }
  | { type: "WEREWOLF_CONFIRM" }
  | { type: "WEREWOLF_PEEK_CENTER"; centerIdx: 0 | 1 | 2 }
  | { type: "MINION_CONFIRM" }
  | { type: "MASON_CONFIRM" }
  | { type: "SEER_PEEK_PLAYER"; targetSeatNo: number }
  | { type: "SEER_PEEK_CENTER"; centerIndices: [number, number] }
  | { type: "SEER_SKIP" }
  | { type: "ROBBER_SWAP"; targetSeatNo: number }
  | { type: "ROBBER_SKIP" }
  | { type: "TROUBLEMAKER_SWAP"; seatA: number; seatB: number }
  | { type: "TROUBLEMAKER_SKIP" }
  | { type: "DRUNK_SWAP_CENTER"; centerIdx: 0 | 1 | 2 }
  | { type: "INSOMNIAC_CONFIRM" }
  | { type: "READY_TO_VOTE" }
  | { type: "CAST_VOTE"; targetSeatNo: number };

export interface OnuwPlayerView {
  step: OnuwStep;
  viewerSeatNo: number | null;
  rolesInPlay: OnuwRoleId[];
  allowLoneWolfPeek: boolean;
  phaseDeadlineMs: number | null;
  actionSeq: number;
  players: Array<{
    seatNo: number;
    displayName: string;
    isReady: boolean;
    hasVoted: boolean;
    /** Revealed only to self (initialRole) or everyone at MatchOver */
    initialRole: OnuwRoleId | null;
    /** Revealed only at MatchOver */
    currentRole: OnuwRoleId | null;
    /** Effective final role (resolving Doppelgänger) — revealed at MatchOver */
    effectiveFinalRole: OnuwRoleId | null;
    isEliminated: boolean;
    isHunterKill: boolean;
    isWinner: boolean;
    /** Vote target revealed only at MatchOver (or self's own vote during DayVotingStep) */
    votedForSeatNo: number | null;
  }>;
  centerCards: Array<{
    index: number;
    /** Revealed if viewer peeked it, or at MatchOver */
    role: OnuwRoleId | null;
    initialRole: OnuwRoleId | null;
  }>;
  /** Night step info */
  night: {
    activePhase: OnuwNightPhase | null;
    wakeOrderPhases: OnuwNightPhase[];
    phaseIndex: number;
    isViewerAwake: boolean;
    hasViewerActed: boolean;
    isLoneWolf: boolean;
    doppelgangerActionRole: OnuwRoleId | null;
  };
  /** Private discoveries for the viewer */
  privateInfo: OnuwPrivateInfo | null;
  /** Full timeline revealed only at MatchOver */
  nightHistory: OnuwNightLogEntry[] | null;
  doppelgangerCopiedRole: OnuwRoleId | null;
  eliminatedSeatNos: number[];
  hunterKillSeatNos: number[];
  winningFactions: OnuwFaction[];
  winnerSeatNos: number[];
  winReasonVi: string | null;
}

const CENTER_COUNT = 3;

function shuffle<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getPlayer(state: OnuwState, seatNo: number): OnuwPlayerState {
  const p = state.players.find((pl) => pl.seatNo === seatNo);
  if (!p) throw new Error(`Không tìm thấy người chơi ghế #${seatNo}`);
  return p;
}

function cloneState(state: OnuwState): OnuwState {
  return {
    ...state,
    config: { ...state.config, roles: [...state.config.roles] },
    players: state.players.map((p) => ({
      ...p,
      privateInfo: {
        ...p.privateInfo,
        seenWerewolfSeats: p.privateInfo.seenWerewolfSeats
          ? [...p.privateInfo.seenWerewolfSeats]
          : undefined,
        seenMasonSeats: p.privateInfo.seenMasonSeats
          ? [...p.privateInfo.seenMasonSeats]
          : undefined,
        peekedPlayers: p.privateInfo.peekedPlayers.map((x) => ({ ...x })),
        peekedCenter: p.privateInfo.peekedCenter.map((x) => ({ ...x })),
        actionNotes: [...p.privateInfo.actionNotes],
      },
    })),
    centerCards: [...state.centerCards] as [OnuwRoleId, OnuwRoleId, OnuwRoleId],
    initialCenterCards: [...state.initialCenterCards] as [
      OnuwRoleId,
      OnuwRoleId,
      OnuwRoleId,
    ],
    nightQueue: [...state.nightQueue],
    actedSeatNos: [...state.actedSeatNos],
    readySeatNos: [...state.readySeatNos],
    votes: { ...state.votes },
    nightHistory: state.nightHistory.map((h) => ({ ...h })),
    eliminatedSeatNos: [...state.eliminatedSeatNos],
    hunterKillSeatNos: [...state.hunterKillSeatNos],
    winningFactions: [...state.winningFactions],
    winnerSeatNos: [...state.winnerSeatNos],
  };
}

function buildNightQueue(roles: OnuwRoleId[]): OnuwNightPhase[] {
  const present = new Set<OnuwRoleId>(roles);
  const queue: OnuwNightPhase[] = [];
  for (const role of NIGHT_WAKE_ORDER) {
    if (present.has(role)) {
      queue.push(role as OnuwNightPhase);
    }
  }
  // If both Doppelgänger and Insomniac are in the role set, add the dedicated final check
  if (present.has("doppelganger") && present.has("insomniac")) {
    queue.push("doppelganger_insomniac");
  }
  return queue;
}

/** Which seats are awake during a given night phase */
export function getAwakeSeatsForPhase(
  state: OnuwState,
  phase: OnuwNightPhase
): number[] {
  switch (phase) {
    case "doppelganger":
      return state.players
        .filter((p) => p.initialRole === "doppelganger")
        .map((p) => p.seatNo);
    case "doppelganger_action":
      if (
        state.doppelgangerSeatNo !== null &&
        state.doppelgangerCopiedRole !== null &&
        DOPPELGANGER_IMMEDIATE_ROLES.includes(state.doppelgangerCopiedRole)
      ) {
        return [state.doppelgangerSeatNo];
      }
      return [];
    case "werewolf":
      return state.players
        .filter(
          (p) =>
            p.initialRole === "werewolf" ||
            (p.initialRole === "doppelganger" &&
              state.doppelgangerCopiedRole === "werewolf")
        )
        .map((p) => p.seatNo);
    case "minion":
      return state.players
        .filter(
          (p) =>
            p.initialRole === "minion" ||
            (p.initialRole === "doppelganger" &&
              state.doppelgangerCopiedRole === "minion")
        )
        .map((p) => p.seatNo);
    case "mason":
      return state.players
        .filter(
          (p) =>
            p.initialRole === "mason" ||
            (p.initialRole === "doppelganger" &&
              state.doppelgangerCopiedRole === "mason")
        )
        .map((p) => p.seatNo);
    case "seer":
      return state.players
        .filter((p) => p.initialRole === "seer")
        .map((p) => p.seatNo);
    case "robber":
      return state.players
        .filter((p) => p.initialRole === "robber")
        .map((p) => p.seatNo);
    case "troublemaker":
      return state.players
        .filter((p) => p.initialRole === "troublemaker")
        .map((p) => p.seatNo);
    case "drunk":
      return state.players
        .filter((p) => p.initialRole === "drunk")
        .map((p) => p.seatNo);
    case "insomniac":
      return state.players
        .filter((p) => p.initialRole === "insomniac")
        .map((p) => p.seatNo);
    case "doppelganger_insomniac":
      if (
        state.doppelgangerSeatNo !== null &&
        state.doppelgangerCopiedRole === "insomniac"
      ) {
        return [state.doppelgangerSeatNo];
      }
      return [];
  }
}

/** Populate passive sight information when entering a night phase (Werewolf, Minion, Mason, Insomniac) */
function populatePassivePhaseInfo(state: OnuwState, phase: OnuwNightPhase): void {
  const awake = getAwakeSeatsForPhase(state, phase);
  if (awake.length === 0) return;

  if (phase === "werewolf") {
    for (const seatNo of awake) {
      const p = getPlayer(state, seatNo);
      const others = awake.filter((s) => s !== seatNo);
      p.privateInfo.seenWerewolfSeats = others;
      if (others.length > 0) {
        const names = others
          .map((s) => getPlayer(state, s).displayName)
          .join(", ");
        p.privateInfo.actionNotes.push(`Đồng bọn Ma Sói của bạn: ${names}.`);
      } else {
        p.privateInfo.actionNotes.push(
          state.config.allowLoneWolfPeek
            ? "Bạn là Ma Sói đơn độc! Bạn được xem 1 lá bài ở giữa bàn."
            : "Bạn là Ma Sói duy nhất trên bàn."
        );
      }
    }
  } else if (phase === "minion") {
    const wolves = getAwakeSeatsForPhase(state, "werewolf");
    for (const seatNo of awake) {
      const p = getPlayer(state, seatNo);
      p.privateInfo.seenWerewolfSeats = wolves;
      if (wolves.length > 0) {
        const names = wolves
          .map((s) => getPlayer(state, s).displayName)
          .join(", ");
        p.privateInfo.actionNotes.push(`Bạn thấy Ma Sói là: ${names}.`);
      } else {
        p.privateInfo.actionNotes.push(
          "Không có Ma Sói nào trên bàn (cả 2 lá ở giữa)! Bạn thắng nếu 1 người chơi khác bị treo cổ."
        );
      }
    }
  } else if (phase === "mason") {
    for (const seatNo of awake) {
      const p = getPlayer(state, seatNo);
      const others = awake.filter((s) => s !== seatNo);
      p.privateInfo.seenMasonSeats = others;
      if (others.length > 0) {
        const names = others
          .map((s) => getPlayer(state, s).displayName)
          .join(", ");
        p.privateInfo.actionNotes.push(`Thợ Xây đồng hành cùng bạn: ${names}.`);
      } else {
        p.privateInfo.actionNotes.push(
          "Không thấy Thợ Xây nào khác (lá còn lại đang ở giữa bàn)."
        );
      }
    }
  } else if (phase === "insomniac" || phase === "doppelganger_insomniac") {
    for (const seatNo of awake) {
      const p = getPlayer(state, seatNo);
      const currentMeta = ONUW_ROLE_META[p.currentRole];
      p.privateInfo.peekedPlayers.push({
        seatNo: p.seatNo,
        role: p.currentRole,
        note: `Cuối đêm, bài trước mặt bạn là ${currentMeta.nameVi}`,
      });
      p.privateInfo.actionNotes.push(
        `Cuối đêm bạn kiểm tra bài mình: hiện đang là ${currentMeta.nameVi}.`
      );
    }
  }
}

function enterNightPhase(
  state: OnuwState,
  phaseIndex: number,
  nowMs: number
): CartridgeTransitionResult<OnuwState> {
  if (phaseIndex >= state.nightQueue.length) {
    // Dawn breaks -> DayDiscussionStep
    state.step = "DayDiscussionStep";
    state.actedSeatNos = [];
    state.readySeatNos = [];
    state.phaseDeadlineMs = nowMs + state.config.dayDiscussionSeconds * 1000;
    return {
      state,
      events: [],
      phaseDeadlineMs: state.phaseDeadlineMs,
    };
  }

  state.step = "NightStep";
  state.nightQueueIndex = phaseIndex;
  state.actedSeatNos = [];
  const phase = state.nightQueue[phaseIndex];
  const awake = getAwakeSeatsForPhase(state, phase);
  populatePassivePhaseInfo(state, phase);

  // If no player holds this role (it's in the center), use a brief 4s phantom timer
  // so players cannot immediately deduce from timing alone which role is in the center.
  const durationSec =
    awake.length === 0 ? 4 : Math.max(8, state.config.nightStepSeconds);
  state.phaseDeadlineMs = nowMs + durationSec * 1000;

  return {
    state,
    events: [],
    phaseDeadlineMs: state.phaseDeadlineMs,
  };
}

function advanceNightIfPhaseComplete(
  state: OnuwState,
  nowMs: number
): CartridgeTransitionResult<OnuwState> {
  const phase = state.nightQueue[state.nightQueueIndex];
  if (!phase) {
    return enterNightPhase(state, state.nightQueue.length, nowMs);
  }
  const awake = getAwakeSeatsForPhase(state, phase);
  const allDone = awake.every((s) => state.actedSeatNos.includes(s));
  if (allDone) {
    return enterNightPhase(state, state.nightQueueIndex + 1, nowMs);
  }
  return {
    state,
    events: [],
    phaseDeadlineMs: state.phaseDeadlineMs,
  };
}

export function getEffectiveFinalRole(
  state: OnuwState,
  role: OnuwRoleId
): OnuwRoleId {
  if (role === "doppelganger") {
    return state.doppelgangerCopiedRole ?? "villager";
  }
  return role;
}

function resolveVotesAndMatchOver(
  state: OnuwState
): CartridgeTransitionResult<OnuwState> {
  // Fill in default votes for any player who timed out without voting (point to next seat)
  const seatNos = state.players.map((p) => p.seatNo);
  for (let i = 0; i < seatNos.length; i++) {
    const voter = seatNos[i];
    if (state.votes[voter] === undefined) {
      state.votes[voter] = seatNos[(i + 1) % seatNos.length];
    }
  }

  const voteCounts = new Map<number, number>();
  for (const s of seatNos) voteCounts.set(s, 0);
  for (const target of Object.values(state.votes)) {
    voteCounts.set(target, (voteCounts.get(target) ?? 0) + 1);
  }

  let maxVotes = 0;
  for (const count of voteCounts.values()) {
    if (count > maxVotes) maxVotes = count;
  }

  // Official ONUW rule: if nobody receives at least 2 votes (everyone gets 1 vote), NO ONE dies!
  const eliminated = new Set<number>();
  if (maxVotes >= 2) {
    for (const [seatNo, count] of voteCounts.entries()) {
      if (count === maxVotes) {
        eliminated.add(seatNo);
      }
    }
  }

  // Official Hunter rule: if a Hunter dies, whoever the Hunter pointed at also dies!
  const hunterKills = new Set<number>();
  const processedHunters = new Set<number>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const seatNo of Array.from(eliminated)) {
      if (processedHunters.has(seatNo)) continue;
      const p = getPlayer(state, seatNo);
      const effRole = getEffectiveFinalRole(state, p.currentRole);
      if (effRole === "hunter") {
        processedHunters.add(seatNo);
        const target = state.votes[seatNo];
        if (target !== undefined && !eliminated.has(target)) {
          eliminated.add(target);
          hunterKills.add(target);
          changed = true;
        }
      }
    }
  }

  state.eliminatedSeatNos = Array.from(eliminated).sort((a, b) => a - b);
  state.hunterKillSeatNos = Array.from(hunterKills).sort((a, b) => a - b);

  // Determine factions and win conditions based on FINAL roles (Golden Rule of ONUW)
  const werewolfSeats: number[] = [];
  const minionSeats: number[] = [];
  const tannerSeats: number[] = [];

  for (const p of state.players) {
    const eff = getEffectiveFinalRole(state, p.currentRole);
    if (eff === "werewolf") werewolfSeats.push(p.seatNo);
    else if (eff === "minion") minionSeats.push(p.seatNo);
    else if (eff === "tanner") tannerSeats.push(p.seatNo);
  }

  const anyWerewolfDied = werewolfSeats.some((s) => eliminated.has(s));
  const anyTannerDied = tannerSeats.some((s) => eliminated.has(s));

  const winningFactions: OnuwFaction[] = [];
  const reasons: string[] = [];

  // 1. Tanner wins if Tanner dies
  if (anyTannerDied) {
    winningFactions.push("tanner");
    reasons.push("Thợ Thuộc Da bị treo cổ và chiến thắng!");
  }

  // 2. Village wins if:
  //    - At least 1 Werewolf is in play AND at least 1 Werewolf dies (even if Tanner also died)
  //    - OR NO Werewolf is in play AND NO ONE dies
  const villageWins =
    werewolfSeats.length > 0
      ? anyWerewolfDied
      : state.eliminatedSeatNos.length === 0;

  if (villageWins) {
    winningFactions.push("village");
    if (werewolfSeats.length > 0) {
      reasons.push("Dân Làng đã tiêu diệt được Ma Sói!");
    } else {
      reasons.push("Không có Ma Sói trên bàn và không ai bị treo cổ — Dân Làng thắng!");
    }
  }

  // 3. Werewolf / Minion team wins if:
  //    - Tanner did NOT die
  //    - AND if Werewolves in play: NO Werewolf died
  //    - OR if NO Werewolves in play and Minion is in play: at least 1 non-Minion player died
  let werewolfTeamWins = false;
  if (!anyTannerDied) {
    if (werewolfSeats.length > 0 && !anyWerewolfDied) {
      werewolfTeamWins = true;
      reasons.push("Không Ma Sói nào bị treo cổ — Phe Ma Sói chiến thắng!");
    } else if (
      werewolfSeats.length === 0 &&
      minionSeats.length > 0 &&
      state.eliminatedSeatNos.some((s) => !minionSeats.includes(s))
    ) {
      werewolfTeamWins = true;
      reasons.push(
        "Không có Ma Sói trên bàn nhưng Dân Làng tự treo cổ nhau — Tay Sai chiến thắng!"
      );
    }
  }

  if (werewolfTeamWins) {
    winningFactions.push("werewolf");
  }

  const winnerSeatNos: number[] = [];
  for (const p of state.players) {
    const eff = getEffectiveFinalRole(state, p.currentRole);
    const faction = ONUW_ROLE_META[eff].faction;
    if (winningFactions.includes(faction)) {
      winnerSeatNos.push(p.seatNo);
    }
  }

  state.winningFactions = winningFactions;
  state.winnerSeatNos = winnerSeatNos;
  state.winReasonVi =
    reasons.length > 0
      ? reasons.join(" ")
      : "Không phe nào đạt điều kiện chiến thắng!";
  state.step = "MatchOver";
  state.phaseDeadlineMs = null;

  return {
    state,
    events: [],
    phaseDeadlineMs: null,
  };
}

function applySeerAction(
  state: OnuwState,
  actorSeatNo: number,
  command:
    | { type: "SEER_PEEK_PLAYER"; targetSeatNo: number }
    | { type: "SEER_PEEK_CENTER"; centerIndices: [number, number] }
    | { type: "SEER_SKIP" },
  phase: OnuwNightPhase
): void {
  const actor = getPlayer(state, actorSeatNo);
  if (command.type === "SEER_PEEK_PLAYER") {
    if (command.targetSeatNo === actorSeatNo) {
      throw new Error("Tiên Tri không thể tự xem bài của chính mình.");
    }
    const target = getPlayer(state, command.targetSeatNo);
    const meta = ONUW_ROLE_META[target.currentRole];
    actor.privateInfo.peekedPlayers.push({
      seatNo: target.seatNo,
      role: target.currentRole,
      note: `Tiên Tri soi thấy ${target.displayName} là ${meta.nameVi}`,
    });
    actor.privateInfo.actionNotes.push(
      `Bạn đã soi bài của ${target.displayName}: ${meta.nameVi}.`
    );
    state.nightHistory.push({
      phase,
      actorSeatNo,
      summaryVi: `${actor.displayName} (Tiên Tri) soi bài của ${target.displayName} → ${meta.nameVi}.`,
    });
  } else if (command.type === "SEER_PEEK_CENTER") {
    const [a, b] = command.centerIndices;
    if (
      a === b ||
      a < 0 ||
      a >= CENTER_COUNT ||
      b < 0 ||
      b >= CENTER_COUNT
    ) {
      throw new Error("Hãy chọn 2 lá bài giữa bàn khác nhau (1–3).");
    }
    const roleA = state.centerCards[a];
    const roleB = state.centerCards[b];
    const metaA = ONUW_ROLE_META[roleA];
    const metaB = ONUW_ROLE_META[roleB];
    actor.privateInfo.peekedCenter.push(
      { centerIdx: a, role: roleA, note: `Giữa #${a + 1}: ${metaA.nameVi}` },
      { centerIdx: b, role: roleB, note: `Giữa #${b + 1}: ${metaB.nameVi}` }
    );
    actor.privateInfo.actionNotes.push(
      `Bạn đã soi 2 lá giữa bàn: Lá #${a + 1} (${metaA.nameVi}) và Lá #${b + 1} (${metaB.nameVi}).`
    );
    state.nightHistory.push({
      phase,
      actorSeatNo,
      summaryVi: `${actor.displayName} (Tiên Tri) soi 2 lá giữa #${a + 1} (${metaA.nameVi}) & #${b + 1} (${metaB.nameVi}).`,
    });
  } else {
    actor.privateInfo.actionNotes.push("Bạn chọn không soi lá bài nào.");
    state.nightHistory.push({
      phase,
      actorSeatNo,
      summaryVi: `${actor.displayName} (Tiên Tri) chọn không soi bài.`,
    });
  }
}

function applyRobberAction(
  state: OnuwState,
  actorSeatNo: number,
  command: { type: "ROBBER_SWAP"; targetSeatNo: number } | { type: "ROBBER_SKIP" },
  phase: OnuwNightPhase
): void {
  const actor = getPlayer(state, actorSeatNo);
  if (command.type === "ROBBER_SWAP") {
    if (command.targetSeatNo === actorSeatNo) {
      throw new Error("Đạo Chích không thể đổi bài với chính mình.");
    }
    const target = getPlayer(state, command.targetSeatNo);
    const stolenRole = target.currentRole;
    target.currentRole = actor.currentRole;
    actor.currentRole = stolenRole;
    const meta = ONUW_ROLE_META[stolenRole];
    actor.privateInfo.peekedPlayers.push({
      seatNo: actor.seatNo,
      role: stolenRole,
      note: `Bạn đã tráo bài với ${target.displayName} và trở thành ${meta.nameVi}`,
    });
    actor.privateInfo.actionNotes.push(
      `Bạn đã cướp bài của ${target.displayName}! Vai trò mới của bạn là ${meta.nameVi}.`
    );
    state.nightHistory.push({
      phase,
      actorSeatNo,
      summaryVi: `${actor.displayName} (Đạo Chích) tráo bài với ${target.displayName} → nhận ${meta.nameVi}.`,
      swap: { kind: "players", seatA: actorSeatNo, seatB: target.seatNo },
    });
  } else {
    actor.privateInfo.actionNotes.push("Bạn chọn giữ nguyên bài của mình.");
    state.nightHistory.push({
      phase,
      actorSeatNo,
      summaryVi: `${actor.displayName} (Đạo Chích) chọn không tráo bài.`,
    });
  }
}

function applyTroublemakerAction(
  state: OnuwState,
  actorSeatNo: number,
  command:
    | { type: "TROUBLEMAKER_SWAP"; seatA: number; seatB: number }
    | { type: "TROUBLEMAKER_SKIP" },
  phase: OnuwNightPhase
): void {
  const actor = getPlayer(state, actorSeatNo);
  if (command.type === "TROUBLEMAKER_SWAP") {
    if (
      command.seatA === command.seatB ||
      command.seatA === actorSeatNo ||
      command.seatB === actorSeatNo
    ) {
      throw new Error("Kẻ Phá Rối phải chọn 2 người chơi khác nhau (không gồm bản thân).");
    }
    const pA = getPlayer(state, command.seatA);
    const pB = getPlayer(state, command.seatB);
    const tmp = pA.currentRole;
    pA.currentRole = pB.currentRole;
    pB.currentRole = tmp;
    actor.privateInfo.actionNotes.push(
      `Bạn đã bí mật tráo bài giữa ${pA.displayName} và ${pB.displayName}.`
    );
    state.nightHistory.push({
      phase,
      actorSeatNo,
      summaryVi: `${actor.displayName} (Kẻ Phá Rối) tráo bài của ${pA.displayName} và ${pB.displayName}.`,
      swap: { kind: "players", seatA: pA.seatNo, seatB: pB.seatNo },
    });
  } else {
    actor.privateInfo.actionNotes.push("Bạn chọn không tráo bài ai.");
    state.nightHistory.push({
      phase,
      actorSeatNo,
      summaryVi: `${actor.displayName} (Kẻ Phá Rối) chọn không tráo bài.`,
    });
  }
}

function applyDrunkAction(
  state: OnuwState,
  actorSeatNo: number,
  centerIdx: 0 | 1 | 2,
  phase: OnuwNightPhase
): void {
  if (centerIdx < 0 || centerIdx >= CENTER_COUNT) {
    throw new Error("Lá bài giữa bàn không hợp lệ.");
  }
  const actor = getPlayer(state, actorSeatNo);
  const oldCenter = state.centerCards[centerIdx];
  state.centerCards[centerIdx] = actor.currentRole;
  actor.currentRole = oldCenter;
  actor.privateInfo.actionNotes.push(
    `Bạn đã đổi bài mình với Lá giữa #${centerIdx + 1} (không được xem).`
  );
  state.nightHistory.push({
    phase,
    actorSeatNo,
    summaryVi: `${actor.displayName} (Kẻ Say Rượu) đổi bài với Lá giữa #${centerIdx + 1}.`,
    swap: { kind: "center", seatNo: actorSeatNo, centerIdx },
  });
}

export const oneNightWerewolfCartridge: GameCartridge<
  OnuwConfig,
  OnuwState,
  OnuwCommand,
  OnuwPlayerView
> = {
  cartridgeId: "one-night-werewolf",
  title: "One Night Ultimate Werewolf",
  subtitle: "Ma Sói Một Đêm • 16 Vai Trò Gốc Bezier Games",
  description:
    "Chỉ 1 đêm duy nhất, 3 lá bài ẩn giữa bàn và hàng loạt cú tráo bài nghẹt thở! Thảo luận trong 5 phút và đồng loạt chỉ tay tìm ra Ma Sói.",
  minSeats: 3,
  maxSeats: 10,
  available: true,

  defaultConfig(seatCount: number): OnuwConfig {
    return {
      roles: defaultRolesForSeatCount(seatCount),
      roleRevealSeconds: 10,
      nightStepSeconds: 25,
      dayDiscussionSeconds: 300,
      dayVoteSeconds: 30,
      allowLoneWolfPeek: true,
    };
  },

  validateConfig(config: OnuwConfig, seatCount: number) {
    if (seatCount < 3 || seatCount > 10) {
      return {
        valid: false,
        error: "One Night Ultimate Werewolf cần từ 3 đến 10 người chơi.",
      };
    }
    const requiredCards = seatCount + CENTER_COUNT;
    if (!Array.isArray(config.roles) || config.roles.length !== requiredCards) {
      return {
        valid: false,
        error: `Cần chọn đúng ${requiredCards} lá vai trò (${seatCount} người chơi + 3 lá giữa bàn). Hiện có ${config.roles?.length ?? 0} lá.`,
      };
    }
    const counts = countRoles(config.roles);
    for (const id of ALL_ONUW_ROLE_IDS) {
      if (counts[id] > ONUW_ROLE_META[id].maxCount) {
        return {
          valid: false,
          error: `Vai ${ONUW_ROLE_META[id].nameVi} tối đa ${ONUW_ROLE_META[id].maxCount} lá.`,
        };
      }
    }
    return { valid: true };
  },

  createInitialState({ config, seats, nowMs, rng = Math.random }) {
    const deck = shuffle(config.roles, rng);
    const players: OnuwPlayerState[] = seats.map((seat, idx) => {
      const role = deck[idx];
      return {
        seatNo: seat.seatNo,
        actorId: seat.actorId,
        displayName: seat.displayName,
        initialRole: role,
        currentRole: role,
        privateInfo: {
          peekedPlayers: [],
          peekedCenter: [],
          actionNotes: [],
        },
      };
    });

    const centerCards: [OnuwRoleId, OnuwRoleId, OnuwRoleId] = [
      deck[seats.length],
      deck[seats.length + 1],
      deck[seats.length + 2],
    ];

    const doppelPlayer = players.find((p) => p.initialRole === "doppelganger");
    const nightQueue = buildNightQueue(config.roles);
    const phaseDeadlineMs = nowMs + config.roleRevealSeconds * 1000;

    const state: OnuwState = {
      step: "RoleRevealStep",
      config: { ...config, roles: [...config.roles] },
      players,
      centerCards: [...centerCards] as [OnuwRoleId, OnuwRoleId, OnuwRoleId],
      initialCenterCards: [...centerCards] as [
        OnuwRoleId,
        OnuwRoleId,
        OnuwRoleId,
      ],
      doppelgangerCopiedRole: null,
      doppelgangerSeatNo: doppelPlayer ? doppelPlayer.seatNo : null,
      nightQueue,
      nightQueueIndex: 0,
      actedSeatNos: [],
      readySeatNos: [],
      votes: {},
      nightHistory: [],
      eliminatedSeatNos: [],
      hunterKillSeatNos: [],
      winningFactions: [],
      winnerSeatNos: [],
      winReasonVi: null,
      phaseDeadlineMs,
      actionSeq: 1,
    };

    return { state, events: [], phaseDeadlineMs };
  },

  reduce({ state, command, actorSeatNo, nowMs }) {
    const next = cloneState(state);
    next.actionSeq += 1;

    if (next.step === "MatchOver") {
      throw new Error("Ván đấu đã kết thúc.");
    }

    if (next.step === "RoleRevealStep") {
      if (command.type !== "CONFIRM_REVEAL") {
        throw new Error("Đang trong bước xem vai trò đầu trận.");
      }
      if (!next.readySeatNos.includes(actorSeatNo)) {
        next.readySeatNos.push(actorSeatNo);
      }
      if (next.readySeatNos.length >= next.players.length) {
        return enterNightPhase(next, 0, nowMs);
      }
      return { state: next, events: [], phaseDeadlineMs: next.phaseDeadlineMs };
    }

    if (next.step === "NightStep") {
      const phase = next.nightQueue[next.nightQueueIndex];
      if (!phase) {
        return enterNightPhase(next, next.nightQueue.length, nowMs);
      }
      const awake = getAwakeSeatsForPhase(next, phase);
      if (!awake.includes(actorSeatNo)) {
        throw new Error("Hiện chưa phải lượt thức dậy của bạn.");
      }
      if (next.actedSeatNos.includes(actorSeatNo)) {
        throw new Error("Bạn đã hoàn thành hành động trong lượt này.");
      }

      if (phase === "doppelganger") {
        if (command.type !== "DOPPELGANGER_COPY") {
          throw new Error("Nhân Bản cần chọn 1 người chơi khác để sao chép.");
        }
        if (command.targetSeatNo === actorSeatNo) {
          throw new Error("Nhân Bản không thể tự sao chép chính mình.");
        }
        const actor = getPlayer(next, actorSeatNo);
        const target = getPlayer(next, command.targetSeatNo);
        const copied = target.currentRole;
        const meta = ONUW_ROLE_META[copied];
        next.doppelgangerCopiedRole = copied;
        actor.privateInfo.doppelgangerCopiedSeatNo = target.seatNo;
        actor.privateInfo.doppelgangerCopiedRole = copied;
        actor.privateInfo.peekedPlayers.push({
          seatNo: target.seatNo,
          role: copied,
          note: `Sao chép ${target.displayName} → ${meta.nameVi}`,
        });
        actor.privateInfo.actionNotes.push(
          `Bạn đã sao chép ${target.displayName} và trở thành ${meta.nameVi}!`
        );
        next.nightHistory.push({
          phase,
          actorSeatNo,
          summaryVi: `${actor.displayName} (Nhân Bản) sao chép ${target.displayName} → trở thành ${meta.nameVi}.`,
        });
        next.actedSeatNos.push(actorSeatNo);

        // If copied role has immediate night action, insert doppelganger_action right next!
        if (DOPPELGANGER_IMMEDIATE_ROLES.includes(copied)) {
          next.nightQueue.splice(
            next.nightQueueIndex + 1,
            0,
            "doppelganger_action"
          );
        }
        return advanceNightIfPhaseComplete(next, nowMs);
      }

      if (phase === "doppelganger_action") {
        const copied = next.doppelgangerCopiedRole;
        if (copied === "seer") {
          if (
            command.type !== "SEER_PEEK_PLAYER" &&
            command.type !== "SEER_PEEK_CENTER" &&
            command.type !== "SEER_SKIP"
          ) {
            throw new Error("Nhân Bản (Tiên Tri) cần thực hiện hành động soi bài.");
          }
          applySeerAction(next, actorSeatNo, command, phase);
        } else if (copied === "robber") {
          if (command.type !== "ROBBER_SWAP" && command.type !== "ROBBER_SKIP") {
            throw new Error("Nhân Bản (Đạo Chích) cần chọn tráo bài hoặc bỏ qua.");
          }
          applyRobberAction(next, actorSeatNo, command, phase);
        } else if (copied === "troublemaker") {
          if (
            command.type !== "TROUBLEMAKER_SWAP" &&
            command.type !== "TROUBLEMAKER_SKIP"
          ) {
            throw new Error("Nhân Bản (Kẻ Phá Rối) cần chọn tráo 2 người hoặc bỏ qua.");
          }
          applyTroublemakerAction(next, actorSeatNo, command, phase);
        } else if (copied === "drunk") {
          if (command.type !== "DRUNK_SWAP_CENTER") {
            throw new Error("Nhân Bản (Kẻ Say Rượu) bắt buộc đổi 1 lá giữa bàn.");
          }
          applyDrunkAction(next, actorSeatNo, command.centerIdx, phase);
        } else {
          throw new Error("Nhân Bản không có hành động tức thì.");
        }
        next.actedSeatNos.push(actorSeatNo);
        return advanceNightIfPhaseComplete(next, nowMs);
      }

      if (phase === "werewolf") {
        const isLoneWolf = awake.length === 1;
        if (command.type === "WEREWOLF_PEEK_CENTER") {
          if (!isLoneWolf || !next.config.allowLoneWolfPeek) {
            throw new Error("Chỉ Ma Sói đơn độc mới được xem 1 lá bài ở giữa bàn.");
          }
          const idx = command.centerIdx;
          if (idx < 0 || idx >= CENTER_COUNT) {
            throw new Error("Lá giữa bàn không hợp lệ.");
          }
          const actor = getPlayer(next, actorSeatNo);
          const role = next.centerCards[idx];
          const meta = ONUW_ROLE_META[role];
          actor.privateInfo.peekedCenter.push({
            centerIdx: idx,
            role,
            note: `Sói đơn độc soi Giữa #${idx + 1}: ${meta.nameVi}`,
          });
          actor.privateInfo.actionNotes.push(
            `Bạn soi Lá giữa #${idx + 1}: ${meta.nameVi}.`
          );
          next.nightHistory.push({
            phase,
            actorSeatNo,
            summaryVi: `${actor.displayName} (Sói đơn độc) soi Lá giữa #${idx + 1} → ${meta.nameVi}.`,
          });
        } else if (command.type === "WEREWOLF_CONFIRM") {
          // Confirmed seeing teammates (or skipped lone wolf peek)
        } else {
          throw new Error("Hành động không hợp lệ cho lượt Ma Sói.");
        }
        next.actedSeatNos.push(actorSeatNo);
        return advanceNightIfPhaseComplete(next, nowMs);
      }

      if (phase === "minion") {
        if (command.type !== "MINION_CONFIRM") {
          throw new Error("Hành động không hợp lệ cho lượt Tay Sai.");
        }
        next.actedSeatNos.push(actorSeatNo);
        return advanceNightIfPhaseComplete(next, nowMs);
      }

      if (phase === "mason") {
        if (command.type !== "MASON_CONFIRM") {
          throw new Error("Hành động không hợp lệ cho lượt Thợ Xây.");
        }
        next.actedSeatNos.push(actorSeatNo);
        return advanceNightIfPhaseComplete(next, nowMs);
      }

      if (phase === "seer") {
        if (
          command.type !== "SEER_PEEK_PLAYER" &&
          command.type !== "SEER_PEEK_CENTER" &&
          command.type !== "SEER_SKIP"
        ) {
          throw new Error("Tiên Tri chỉ có thể soi 1 người chơi, 2 lá giữa hoặc bỏ qua.");
        }
        applySeerAction(next, actorSeatNo, command, phase);
        next.actedSeatNos.push(actorSeatNo);
        return advanceNightIfPhaseComplete(next, nowMs);
      }

      if (phase === "robber") {
        if (command.type !== "ROBBER_SWAP" && command.type !== "ROBBER_SKIP") {
          throw new Error("Đạo Chích chỉ có thể tráo bài với 1 người khác hoặc bỏ qua.");
        }
        applyRobberAction(next, actorSeatNo, command, phase);
        next.actedSeatNos.push(actorSeatNo);
        return advanceNightIfPhaseComplete(next, nowMs);
      }

      if (phase === "troublemaker") {
        if (
          command.type !== "TROUBLEMAKER_SWAP" &&
          command.type !== "TROUBLEMAKER_SKIP"
        ) {
          throw new Error("Kẻ Phá Rối chỉ có thể tráo 2 người khác hoặc bỏ qua.");
        }
        applyTroublemakerAction(next, actorSeatNo, command, phase);
        next.actedSeatNos.push(actorSeatNo);
        return advanceNightIfPhaseComplete(next, nowMs);
      }

      if (phase === "drunk") {
        if (command.type !== "DRUNK_SWAP_CENTER") {
          throw new Error("Kẻ Say Rượu bắt buộc đổi bài với 1 lá giữa bàn.");
        }
        applyDrunkAction(next, actorSeatNo, command.centerIdx, phase);
        next.actedSeatNos.push(actorSeatNo);
        return advanceNightIfPhaseComplete(next, nowMs);
      }

      if (phase === "insomniac" || phase === "doppelganger_insomniac") {
        if (command.type !== "INSOMNIAC_CONFIRM") {
          throw new Error("Hãy xác nhận đã xem bài cuối đêm.");
        }
        next.actedSeatNos.push(actorSeatNo);
        return advanceNightIfPhaseComplete(next, nowMs);
      }
    }

    if (next.step === "DayDiscussionStep") {
      if (command.type !== "READY_TO_VOTE") {
        throw new Error("Đang trong giai đoạn thảo luận ban ngày.");
      }
      if (!next.readySeatNos.includes(actorSeatNo)) {
        next.readySeatNos.push(actorSeatNo);
      }
      if (next.readySeatNos.length >= next.players.length) {
        next.step = "DayVotingStep";
        next.votes = {};
        next.phaseDeadlineMs = nowMs + next.config.dayVoteSeconds * 1000;
      }
      return { state: next, events: [], phaseDeadlineMs: next.phaseDeadlineMs };
    }

    if (next.step === "DayVotingStep") {
      if (command.type !== "CAST_VOTE") {
        throw new Error("Đang trong giai đoạn bỏ phiếu.");
      }
      if (command.targetSeatNo === actorSeatNo) {
        throw new Error("Bạn không thể tự bỏ phiếu cho chính mình!");
      }
      getPlayer(next, command.targetSeatNo); // validate seat exists
      next.votes[actorSeatNo] = command.targetSeatNo;

      if (Object.keys(next.votes).length >= next.players.length) {
        return resolveVotesAndMatchOver(next);
      }
      return { state: next, events: [], phaseDeadlineMs: next.phaseDeadlineMs };
    }

    throw new Error("Lệnh không hợp lệ.");
  },

  onPhaseTimeout({ state, nowMs }) {
    const next = cloneState(state);
    next.actionSeq += 1;

    if (next.step === "RoleRevealStep") {
      return enterNightPhase(next, 0, nowMs);
    }

    if (next.step === "NightStep") {
      const phase = next.nightQueue[next.nightQueueIndex];
      if (phase) {
        const awake = getAwakeSeatsForPhase(next, phase);
        for (const seatNo of awake) {
          if (next.actedSeatNos.includes(seatNo)) continue;
          // Mandatory actions get a deterministic fallback on timeout
          if (phase === "doppelganger") {
            const other = next.players.find((p) => p.seatNo !== seatNo);
            if (other) {
              const res = this.reduce({
                state: next,
                command: { type: "DOPPELGANGER_COPY", targetSeatNo: other.seatNo },
                actorSeatNo: seatNo,
                nowMs,
              });
              return res;
            }
          } else if (
            phase === "drunk" ||
            (phase === "doppelganger_action" &&
              next.doppelgangerCopiedRole === "drunk")
          ) {
            applyDrunkAction(next, seatNo, 0, phase);
          }
          next.actedSeatNos.push(seatNo);
        }
      }
      return enterNightPhase(next, next.nightQueueIndex + 1, nowMs);
    }

    if (next.step === "DayDiscussionStep") {
      next.step = "DayVotingStep";
      next.votes = {};
      next.phaseDeadlineMs = nowMs + next.config.dayVoteSeconds * 1000;
      return { state: next, events: [], phaseDeadlineMs: next.phaseDeadlineMs };
    }

    if (next.step === "DayVotingStep") {
      return resolveVotesAndMatchOver(next);
    }

    return { state: next, events: [], phaseDeadlineMs: null };
  },

  autoActBots({ current, botSeatNos, nowMs }) {
    if (botSeatNos.length === 0) return current;
    const botSet = new Set(botSeatNos);
    let result = current;
    const collectedEvents: MatchEventRecord[] = [...current.events];
    let guard = 0;

    while (guard < 40) {
      guard += 1;
      const st = result.state;
      if (st.step === "MatchOver") break;

      if (st.step === "RoleRevealStep") {
        const pendingBot = st.players.find(
          (p) => botSet.has(p.seatNo) && !st.readySeatNos.includes(p.seatNo)
        );
        if (!pendingBot) break;
        result = this.reduce({
          state: st,
          command: { type: "CONFIRM_REVEAL" },
          actorSeatNo: pendingBot.seatNo,
          nowMs,
        });
        collectedEvents.push(...result.events);
        continue;
      }

      if (st.step === "NightStep") {
        const phase = st.nightQueue[st.nightQueueIndex];
        if (!phase) break;
        const awake = getAwakeSeatsForPhase(st, phase);
        const pendingBot = awake.find(
          (s) => botSet.has(s) && !st.actedSeatNos.includes(s)
        );
        if (pendingBot === undefined) break;

        const others = st.players
          .map((p) => p.seatNo)
          .filter((s) => s !== pendingBot);
        let cmd: OnuwCommand;

        const effectivePhase =
          phase === "doppelganger_action"
            ? st.doppelgangerCopiedRole
            : phase;

        if (effectivePhase === "doppelganger") {
          cmd = {
            type: "DOPPELGANGER_COPY",
            targetSeatNo: others[Math.floor(Math.random() * others.length)],
          };
        } else if (effectivePhase === "werewolf") {
          if (awake.length === 1 && st.config.allowLoneWolfPeek) {
            cmd = {
              type: "WEREWOLF_PEEK_CENTER",
              centerIdx: Math.floor(Math.random() * 3) as 0 | 1 | 2,
            };
          } else {
            cmd = { type: "WEREWOLF_CONFIRM" };
          }
        } else if (effectivePhase === "minion") {
          cmd = { type: "MINION_CONFIRM" };
        } else if (effectivePhase === "mason") {
          cmd = { type: "MASON_CONFIRM" };
        } else if (effectivePhase === "seer") {
          if (Math.random() < 0.65 && others.length > 0) {
            cmd = {
              type: "SEER_PEEK_PLAYER",
              targetSeatNo: others[Math.floor(Math.random() * others.length)],
            };
          } else {
            const pair: [number, number] = [0, 1];
            cmd = { type: "SEER_PEEK_CENTER", centerIndices: pair };
          }
        } else if (effectivePhase === "robber") {
          cmd = {
            type: "ROBBER_SWAP",
            targetSeatNo: others[Math.floor(Math.random() * others.length)],
          };
        } else if (effectivePhase === "troublemaker") {
          if (others.length >= 2) {
            const shuffled = shuffle(others, Math.random);
            cmd = {
              type: "TROUBLEMAKER_SWAP",
              seatA: shuffled[0],
              seatB: shuffled[1],
            };
          } else {
            cmd = { type: "TROUBLEMAKER_SKIP" };
          }
        } else if (effectivePhase === "drunk") {
          cmd = {
            type: "DRUNK_SWAP_CENTER",
            centerIdx: Math.floor(Math.random() * 3) as 0 | 1 | 2,
          };
        } else {
          cmd = { type: "INSOMNIAC_CONFIRM" };
        }

        result = this.reduce({
          state: st,
          command: cmd,
          actorSeatNo: pendingBot,
          nowMs,
        });
        collectedEvents.push(...result.events);
        continue;
      }

      if (st.step === "DayDiscussionStep") {
        // Bots auto-ready only once all human players are ready (so humans have full discussion time)
        const humans = st.players.filter((p) => !botSet.has(p.seatNo));
        const allHumansReady = humans.every((h) =>
          st.readySeatNos.includes(h.seatNo)
        );
        if (!allHumansReady) break;
        const pendingBot = st.players.find(
          (p) => botSet.has(p.seatNo) && !st.readySeatNos.includes(p.seatNo)
        );
        if (!pendingBot) break;
        result = this.reduce({
          state: st,
          command: { type: "READY_TO_VOTE" },
          actorSeatNo: pendingBot.seatNo,
          nowMs,
        });
        collectedEvents.push(...result.events);
        continue;
      }

      if (st.step === "DayVotingStep") {
        const pendingBot = st.players.find(
          (p) => botSet.has(p.seatNo) && st.votes[p.seatNo] === undefined
        );
        if (!pendingBot) break;

        const candidates = st.players
          .map((p) => p.seatNo)
          .filter((s) => s !== pendingBot.seatNo);
        const info = pendingBot.privateInfo;
        let target: number | null = null;

        // Smart heuristics based on private night knowledge
        const seenWolfBySeer = info.peekedPlayers.find(
          (pk) => pk.seatNo !== pendingBot.seatNo && pk.role === "werewolf"
        );
        if (
          seenWolfBySeer &&
          pendingBot.initialRole !== "werewolf" &&
          pendingBot.initialRole !== "minion"
        ) {
          target = seenWolfBySeer.seatNo;
        } else if (
          pendingBot.initialRole === "werewolf" ||
          pendingBot.initialRole === "minion"
        ) {
          const nonWolves = candidates.filter(
            (s) => !(info.seenWerewolfSeats ?? []).includes(s)
          );
          if (nonWolves.length > 0) {
            target = nonWolves[Math.floor(Math.random() * nonWolves.length)];
          }
        } else if (pendingBot.initialRole === "mason") {
          const nonMasons = candidates.filter(
            (s) => !(info.seenMasonSeats ?? []).includes(s)
          );
          if (nonMasons.length > 0) {
            target = nonMasons[Math.floor(Math.random() * nonMasons.length)];
          }
        }

        if (target === null) {
          target = candidates[Math.floor(Math.random() * candidates.length)];
        }

        result = this.reduce({
          state: st,
          command: { type: "CAST_VOTE", targetSeatNo: target },
          actorSeatNo: pendingBot.seatNo,
          nowMs,
        });
        collectedEvents.push(...result.events);
        continue;
      }

      break;
    }

    return {
      state: result.state,
      events: collectedEvents,
      phaseDeadlineMs: result.phaseDeadlineMs,
    };
  },

  projectView({ state, viewerSeatNo }): OnuwPlayerView {
    const isOver = state.step === "MatchOver";
    const viewer =
      viewerSeatNo !== null
        ? state.players.find((p) => p.seatNo === viewerSeatNo) ?? null
        : null;

    const activePhase =
      state.step === "NightStep"
        ? state.nightQueue[state.nightQueueIndex] ?? null
        : null;
    const awakeSeats = activePhase
      ? getAwakeSeatsForPhase(state, activePhase)
      : [];
    const isViewerAwake =
      viewerSeatNo !== null && awakeSeats.includes(viewerSeatNo);
    const hasViewerActed =
      viewerSeatNo !== null && state.actedSeatNos.includes(viewerSeatNo);

    // Filter out internal doppelganger_action from public wake order bar unless viewer is Doppelgänger
    const wakeOrderPhases = state.nightQueue.filter(
      (ph) => ph !== "doppelganger_action" || isViewerAwake
    );

    const peekedCenterMap = new Map<number, OnuwRoleId>();
    if (viewer) {
      for (const pk of viewer.privateInfo.peekedCenter) {
        peekedCenterMap.set(pk.centerIdx, pk.role);
      }
    }

    return {
      step: state.step,
      viewerSeatNo,
      rolesInPlay: [...state.config.roles],
      allowLoneWolfPeek: state.config.allowLoneWolfPeek,
      phaseDeadlineMs: state.phaseDeadlineMs,
      actionSeq: state.actionSeq,
      players: state.players.map((p) => {
        const isSelf = viewerSeatNo === p.seatNo;
        const votedFor =
          isOver || (state.step === "DayVotingStep" && isSelf)
            ? state.votes[p.seatNo] ?? null
            : null;
        return {
          seatNo: p.seatNo,
          displayName: p.displayName,
          isReady: state.readySeatNos.includes(p.seatNo),
          hasVoted: state.votes[p.seatNo] !== undefined,
          initialRole: isOver || isSelf ? p.initialRole : null,
          currentRole: isOver ? p.currentRole : null,
          effectiveFinalRole: isOver
            ? getEffectiveFinalRole(state, p.currentRole)
            : null,
          isEliminated: state.eliminatedSeatNos.includes(p.seatNo),
          isHunterKill: state.hunterKillSeatNos.includes(p.seatNo),
          isWinner: state.winnerSeatNos.includes(p.seatNo),
          votedForSeatNo: votedFor,
        };
      }),
      centerCards: state.centerCards.map((role, idx) => ({
        index: idx,
        role: isOver ? role : peekedCenterMap.get(idx) ?? null,
        initialRole: isOver ? state.initialCenterCards[idx] : null,
      })),
      night: {
        activePhase:
          activePhase === "doppelganger_action" && !isViewerAwake
            ? "doppelganger"
            : activePhase,
        wakeOrderPhases,
        phaseIndex: state.nightQueueIndex,
        isViewerAwake,
        hasViewerActed,
        isLoneWolf:
          activePhase === "werewolf" &&
          isViewerAwake &&
          awakeSeats.length === 1,
        doppelgangerActionRole:
          activePhase === "doppelganger_action" && isViewerAwake
            ? state.doppelgangerCopiedRole
            : null,
      },
      privateInfo: viewer ? viewer.privateInfo : null,
      nightHistory: isOver ? state.nightHistory : null,
      doppelgangerCopiedRole:
        isOver ||
        (viewer !== null && viewer.initialRole === "doppelganger")
          ? state.doppelgangerCopiedRole
          : null,
      eliminatedSeatNos: state.eliminatedSeatNos,
      hunterKillSeatNos: state.hunterKillSeatNos,
      winningFactions: state.winningFactions,
      winnerSeatNos: state.winnerSeatNos,
      winReasonVi: state.winReasonVi,
    };
  },

  resolveChannels({ state, viewerSeatNo }): ChannelPermission[] {
    const canWriteVillage =
      viewerSeatNo !== null &&
      (state.step === "DayDiscussionStep" ||
        state.step === "DayVotingStep" ||
        state.step === "MatchOver");
    return [
      {
        channelId: "village",
        label: "Làng Thảo Luận",
        canRead: true,
        canWrite: canWriteVillage,
      },
    ];
  },

  isMatchOver(state) {
    return state.step === "MatchOver";
  },

  getWinningFaction(state) {
    if (state.step !== "MatchOver" || state.winningFactions.length === 0) {
      return null;
    }
    return state.winningFactions.join("+");
  },
};
