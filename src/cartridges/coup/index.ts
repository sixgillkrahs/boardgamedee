import type {
  CartridgeTransitionResult,
  ChannelPermission,
  GameCartridge,
  MatchEventRecord,
  SeatDescriptor,
} from "@/cartridges/types";

export type CoupCharacter =
  | "Duke"
  | "Assassin"
  | "Captain"
  | "Ambassador"
  | "Contessa";

export const COUP_CHARACTERS: CoupCharacter[] = [
  "Duke",
  "Assassin",
  "Captain",
  "Ambassador",
  "Contessa",
];

export const COUP_CHARACTER_META: Record<
  CoupCharacter,
  {
    nameVi: string;
    titleVi: string;
    actionVi: string;
    blockVi: string;
    accentColor: string;
  }
> = {
  Duke: {
    nameVi: "Công Tước (Duke)",
    titleVi: "CÔNG TƯỚC",
    actionVi: "Thu Thuế (+3 xu)",
    blockVi: "Chặn Viện Trợ (2 xu)",
    accentColor: "#e11d84",
  },
  Assassin: {
    nameVi: "Sát Thủ (Assassin)",
    titleVi: "SÁT THỦ",
    actionVi: "Ám Sát (-3 xu, diệt 1 lá)",
    blockVi: "Không có kỹ năng chặn",
    accentColor: "#64748b",
  },
  Captain: {
    nameVi: "Thuyền Trưởng (Captain)",
    titleVi: "THUYỀN TRƯỞNG",
    actionVi: "Cướp Xu (+2 xu từ 1 người)",
    blockVi: "Chặn Cướp Xu",
    accentColor: "#38bdf8",
  },
  Ambassador: {
    nameVi: "Đại Sứ (Ambassador)",
    titleVi: "ĐẠI SỨ",
    actionVi: "Đổi Bài (rút 2 lá từ Bộ bài)",
    blockVi: "Chặn Cướp Xu",
    accentColor: "#10b981",
  },
  Contessa: {
    nameVi: "Bá Tước Phu Nhân (Contessa)",
    titleVi: "PHU NHÂN",
    actionVi: "Không có hành động chủ động",
    blockVi: "Chặn Ám Sát của Sát Thủ",
    accentColor: "#ef232a",
  },
};

export type CoupActionType =
  | "INCOME"
  | "FOREIGN_AID"
  | "COUP"
  | "TAX"
  | "ASSASSINATE"
  | "STEAL"
  | "EXCHANGE";

export type CoupStep =
  | "TurnActionStep"
  | "ReactionWindowStep"
  | "BlockChallengeStep"
  | "LoseInfluenceStep"
  | "ExchangePickStep"
  | "Finished";

export interface CoupConfig {
  timers: {
    turnActionSeconds: number;
    reactionWindowSeconds: number;
    loseInfluenceSeconds: number;
    exchangeSeconds: number;
  };
  startingCoins: number;
}

export interface CoupInfluenceCard {
  character: CoupCharacter;
  revealed: boolean;
}

export interface CoupSeatState {
  seatNo: number;
  actorId: string;
  displayName: string;
  avatarSeed?: string;
  coins: number;
  cards: CoupInfluenceCard[];
  alive: boolean;
}

export interface PendingCoupAction {
  type: CoupActionType;
  actorSeatNo: number;
  targetSeatNo: number | null;
  claimedCharacter: CoupCharacter | null;
}

export interface PendingCoupBlock {
  blockerSeatNo: number;
  claimedCharacter: CoupCharacter;
}

export interface PendingInfluenceLoss {
  seatNo: number;
  reasonVi: string;
}

export interface CoupMatchState {
  config: CoupConfig;
  turnNumber: number;
  activeSeatNo: number;
  step: CoupStep;
  phaseDeadlineMs: number | null;
  seats: CoupSeatState[];
  courtDeck: CoupCharacter[];

  pendingAction: PendingCoupAction | null;
  pendingBlock: PendingCoupBlock | null;
  passedSeatNos: number[];

  pendingLosses: PendingInfluenceLoss[];
  afterLossContinuation: "NEXT_TURN" | "EXECUTE_ACTION" | null;

  exchangePool: CoupCharacter[];

  lastTransfer: {
    from: "treasury" | number;
    to: "treasury" | number;
    amount: number;
    action: CoupActionType;
    atTurn: number;
  } | null;

  lastChallengeBannerVi: string | null;
  winnerSeatNo: number | null;
  winReasonVi: string | null;
}

export type CoupCommand =
  | {
      type: "DECLARE_ACTION";
      action: CoupActionType;
      targetSeatNo?: number | null;
    }
  | { type: "PASS" }
  | { type: "CHALLENGE" }
  | { type: "BLOCK"; character: CoupCharacter }
  | { type: "LOSE_INFLUENCE"; cardIndex: number }
  | { type: "EXCHANGE_KEEP"; keepIndices: number[] };

export interface CoupProjectedCard {
  character: CoupCharacter | null;
  revealed: boolean;
}

export interface CoupProjectedSeat {
  seatNo: number;
  actorId: string;
  displayName: string;
  avatarSeed?: string;
  coins: number;
  alive: boolean;
  cards: CoupProjectedCard[];
  hasPassedReaction: boolean;
}

export interface CoupPlayerView {
  cartridgeId: "coup";
  turnNumber: number;
  activeSeatNo: number;
  step: CoupStep;
  phaseDeadlineMs: number | null;
  viewerSeatNo: number | null;
  courtDeckCount: number;
  seats: CoupProjectedSeat[];
  pendingAction: PendingCoupAction | null;
  pendingBlock: PendingCoupBlock | null;
  activeLossTarget: PendingInfluenceLoss | null;
  exchangePool: CoupCharacter[];
  exchangeKeepCount: number;
  lastTransfer: CoupMatchState["lastTransfer"];
  lastChallengeBannerVi: string | null;
  winnerSeatNo: number | null;
  winReasonVi: string | null;
  config: CoupConfig;
}

const ACTION_CLAIMED_CHARACTER: Record<CoupActionType, CoupCharacter | null> = {
  INCOME: null,
  FOREIGN_AID: null,
  COUP: null,
  TAX: "Duke",
  ASSASSINATE: "Assassin",
  STEAL: "Captain",
  EXCHANGE: "Ambassador",
};

export const ACTION_LABEL_VI: Record<CoupActionType, string> = {
  INCOME: "Thu Nhập (+1 xu)",
  FOREIGN_AID: "Viện Trợ (+2 xu)",
  COUP: "Đảo Chính (-7 xu)",
  TAX: "Thu Thuế - Công Tước (+3 xu)",
  ASSASSINATE: "Ám Sát - Sát Thủ (-3 xu)",
  STEAL: "Cướp Xu - Thuyền Trưởng (+2 xu)",
  EXCHANGE: "Đổi Bài - Đại Sứ",
};

function getLivingSeats(state: CoupMatchState): CoupSeatState[] {
  return state.seats.filter((s) => s.alive);
}

function getAliveCardCount(seat: CoupSeatState): number {
  return seat.cards.filter((c) => !c.revealed).length;
}

function checkWinner(state: CoupMatchState): {
  winnerSeatNo: number | null;
  winReasonVi: string | null;
} {
  const living = getLivingSeats(state);
  if (living.length === 1) {
    return {
      winnerSeatNo: living[0].seatNo,
      winReasonVi: `${living[0].displayName} là người cuối cùng trụ lại triều đình và giành chiến thắng tuyệt đối!`,
    };
  }
  return { winnerSeatNo: null, winReasonVi: null };
}

function advanceToNextTurn(
  state: CoupMatchState,
  nowMs: number,
  events: MatchEventRecord[]
): CartridgeTransitionResult<CoupMatchState> {
  const win = checkWinner(state);
  if (win.winnerSeatNo !== null) {
    const finished: CoupMatchState = {
      ...state,
      step: "Finished",
      phaseDeadlineMs: null,
      pendingAction: null,
      pendingBlock: null,
      passedSeatNos: [],
      pendingLosses: [],
      afterLossContinuation: null,
      exchangePool: [],
      winnerSeatNo: win.winnerSeatNo,
      winReasonVi: win.winReasonVi,
    };
    return {
      state: finished,
      events: [
        ...events,
        {
          eventType: "MATCH_FINISHED",
          message: win.winReasonVi ?? "Ván đấu đã kết thúc!",
          visibleToSeatNos: "all",
          payload: { winnerSeatNo: win.winnerSeatNo },
        },
      ],
      phaseDeadlineMs: null,
    };
  }

  const living = getLivingSeats(state);
  const sortedNos = living.map((s) => s.seatNo).sort((a, b) => a - b);
  let nextSeatNo = sortedNos[0];
  for (const no of sortedNos) {
    if (no > state.activeSeatNo) {
      nextSeatNo = no;
      break;
    }
  }

  const deadline = nowMs + state.config.timers.turnActionSeconds * 1000;
  const nextSeat = state.seats.find((s) => s.seatNo === nextSeatNo);
  const nextState: CoupMatchState = {
    ...state,
    turnNumber: state.turnNumber + 1,
    activeSeatNo: nextSeatNo,
    step: "TurnActionStep",
    phaseDeadlineMs: deadline,
    pendingAction: null,
    pendingBlock: null,
    passedSeatNos: [],
    pendingLosses: [],
    afterLossContinuation: null,
    exchangePool: [],
  };

  return {
    state: nextState,
    events: [
      ...events,
      {
        eventType: "TURN_STARTED",
        message: `Lượt thứ ${nextState.turnNumber}: Đến lượt của ${nextSeat?.displayName ?? ""}!`,
        visibleToSeatNos: "all",
        payload: { activeSeatNo: nextSeatNo, turnNumber: nextState.turnNumber },
      },
    ],
    phaseDeadlineMs: deadline,
  };
}

/**
 * Queues or processes pending Influence losses.
 * If the next seat in `pendingLosses` only has 1 unrevealed card left (or 0),
 * it automatically reveals that card immediately so the player doesn't have to click a single forced card!
 */
function processPendingLossesOrContinue(
  state: CoupMatchState,
  nowMs: number,
  priorEvents: MatchEventRecord[]
): CartridgeTransitionResult<CoupMatchState> {
  let curState = { ...state };
  const events = [...priorEvents];

  while (curState.pendingLosses.length > 0) {
    const [headLoss, ...restLosses] = curState.pendingLosses;
    const seat = curState.seats.find((s) => s.seatNo === headLoss.seatNo);
    if (!seat || !seat.alive) {
      curState = { ...curState, pendingLosses: restLosses };
      continue;
    }

    const aliveIndices = seat.cards
      .map((c, idx) => (!c.revealed ? idx : -1))
      .filter((idx) => idx !== -1);

    if (aliveIndices.length === 0) {
      curState = { ...curState, pendingLosses: restLosses };
      continue;
    }

    if (aliveIndices.length === 1) {
      // Automatically reveal their last remaining card!
      const autoIdx = aliveIndices[0];
      const lostChar = seat.cards[autoIdx].character;
      const updatedSeats = curState.seats.map((s) => {
        if (s.seatNo !== seat.seatNo) return s;
        const newCards = s.cards.map((c, i) =>
          i === autoIdx ? { ...c, revealed: true } : c
        );
        return {
          ...s,
          cards: newCards,
          alive: newCards.some((c) => !c.revealed),
        };
      });

      events.push({
        eventType: "INFLUENCE_LOST",
        message: `${seat.displayName} mất lá bài cuối cùng: ${COUP_CHARACTER_META[lostChar].nameVi} (${headLoss.reasonVi}) và bị loại khỏi cuộc chơi!`,
        visibleToSeatNos: "all",
        payload: { seatNo: seat.seatNo, character: lostChar },
      });

      curState = {
        ...curState,
        seats: updatedSeats,
        pendingLosses: restLosses,
      };

      const win = checkWinner(curState);
      if (win.winnerSeatNo !== null) {
        return advanceToNextTurn(curState, nowMs, events);
      }
      continue;
    }

    // Seat has 2 unrevealed cards -> stop and let them pick which card to lose in LoseInfluenceStep!
    const deadline =
      nowMs + curState.config.timers.loseInfluenceSeconds * 1000;
    return {
      state: {
        ...curState,
        step: "LoseInfluenceStep",
        phaseDeadlineMs: deadline,
      },
      events,
      phaseDeadlineMs: deadline,
    };
  }

  // All pending losses resolved! Check if someone won
  const win = checkWinner(curState);
  if (win.winnerSeatNo !== null) {
    return advanceToNextTurn(curState, nowMs, events);
  }

  // Check continuation: either execute the pending action or move to next turn
  if (
    curState.afterLossContinuation === "EXECUTE_ACTION" &&
    curState.pendingAction
  ) {
    const cleanState: CoupMatchState = {
      ...curState,
      afterLossContinuation: null,
    };
    return executeApprovedAction(cleanState, nowMs, events);
  }

  return advanceToNextTurn(curState, nowMs, events);
}

function executeApprovedAction(
  state: CoupMatchState,
  nowMs: number,
  priorEvents: MatchEventRecord[]
): CartridgeTransitionResult<CoupMatchState> {
  const action = state.pendingAction;
  if (!action) {
    return advanceToNextTurn(state, nowMs, priorEvents);
  }

  const actor = state.seats.find((s) => s.seatNo === action.actorSeatNo);
  if (!actor || !actor.alive) {
    return advanceToNextTurn(state, nowMs, priorEvents);
  }

  const events = [...priorEvents];

  if (action.type === "FOREIGN_AID") {
    const updatedSeats = state.seats.map((s) =>
      s.seatNo === actor.seatNo ? { ...s, coins: s.coins + 2 } : s
    );
    events.push({
      eventType: "FOREIGN_AID_RESOLVED",
      message: `${actor.displayName} nhận 2 xu Viện Trợ từ Kho Bạc.`,
      visibleToSeatNos: "all",
    });
    return advanceToNextTurn(
      {
        ...state,
        seats: updatedSeats,
        lastTransfer: {
          from: "treasury",
          to: actor.seatNo,
          amount: 2,
          action: "FOREIGN_AID",
          atTurn: state.turnNumber,
        },
      },
      nowMs,
      events
    );
  }

  if (action.type === "TAX") {
    const updatedSeats = state.seats.map((s) =>
      s.seatNo === actor.seatNo ? { ...s, coins: s.coins + 3 } : s
    );
    events.push({
      eventType: "TAX_RESOLVED",
      message: `Công Tước ${actor.displayName} thu thuế +3 xu từ Kho Bạc.`,
      visibleToSeatNos: "all",
    });
    return advanceToNextTurn(
      {
        ...state,
        seats: updatedSeats,
        lastTransfer: {
          from: "treasury",
          to: actor.seatNo,
          amount: 3,
          action: "TAX",
          atTurn: state.turnNumber,
        },
      },
      nowMs,
      events
    );
  }

  if (action.type === "STEAL") {
    const target = state.seats.find((s) => s.seatNo === action.targetSeatNo);
    if (!target || !target.alive) {
      return advanceToNextTurn(state, nowMs, events);
    }
    const stolen = Math.min(2, target.coins);
    const updatedSeats = state.seats.map((s) => {
      if (s.seatNo === actor.seatNo) return { ...s, coins: s.coins + stolen };
      if (s.seatNo === target.seatNo) return { ...s, coins: s.coins - stolen };
      return s;
    });
    events.push({
      eventType: "STEAL_RESOLVED",
      message: `Thuyền Trưởng ${actor.displayName} đã cướp ${stolen} xu từ ${target.displayName}!`,
      visibleToSeatNos: "all",
    });
    return advanceToNextTurn(
      {
        ...state,
        seats: updatedSeats,
        lastTransfer: {
          from: target.seatNo,
          to: actor.seatNo,
          amount: stolen,
          action: "STEAL",
          atTurn: state.turnNumber,
        },
      },
      nowMs,
      events
    );
  }

  if (action.type === "ASSASSINATE") {
    const target = state.seats.find((s) => s.seatNo === action.targetSeatNo);
    if (!target || !target.alive) {
      return advanceToNextTurn(state, nowMs, events);
    }
    events.push({
      eventType: "ASSASSINATE_RESOLVED",
      message: `Sát Thủ ${actor.displayName} ra đòn Ám Sát buộc ${target.displayName} mất 1 lá bài!`,
      visibleToSeatNos: "all",
    });
    const nextState: CoupMatchState = {
      ...state,
      pendingLosses: [
        ...state.pendingLosses,
        {
          seatNo: target.seatNo,
          reasonVi: `Bị Sát Thủ ${actor.displayName} ám sát`,
        },
      ],
      afterLossContinuation: "NEXT_TURN",
    };
    return processPendingLossesOrContinue(nextState, nowMs, events);
  }

  if (action.type === "EXCHANGE") {
    const deckCopy = [...state.courtDeck];
    const drawn: CoupCharacter[] = [];
    for (let i = 0; i < 2 && deckCopy.length > 0; i++) {
      drawn.push(deckCopy.shift()!);
    }
    const aliveChars = actor.cards
      .filter((c) => !c.revealed)
      .map((c) => c.character);
    const pool = [...aliveChars, ...drawn];
    const deadline = nowMs + state.config.timers.exchangeSeconds * 1000;

    events.push({
      eventType: "EXCHANGE_STARTED",
      message: `Đại Sứ ${actor.displayName} rút 2 lá bài từ Bộ bài Triều đình để chọn đổi bài...`,
      visibleToSeatNos: "all",
    });

    return {
      state: {
        ...state,
        step: "ExchangePickStep",
        phaseDeadlineMs: deadline,
        courtDeck: deckCopy,
        exchangePool: pool,
      },
      events,
      phaseDeadlineMs: deadline,
    };
  }

  return advanceToNextTurn(state, nowMs, events);
}

function replaceRevealedTruthfulCard(
  state: CoupMatchState,
  holderSeatNo: number,
  claimedCharacter: CoupCharacter
): CoupMatchState {
  const holder = state.seats.find((s) => s.seatNo === holderSeatNo);
  if (!holder) return state;

  const cardIdx = holder.cards.findIndex(
    (c) => !c.revealed && c.character === claimedCharacter
  );
  if (cardIdx === -1) return state;

  const newDeck = [...state.courtDeck, claimedCharacter];
  // Deterministic or simple rotation shuffle of the returned card into the Court Deck
  const replacement = newDeck.shift()!;

  const updatedSeats = state.seats.map((s) => {
    if (s.seatNo !== holderSeatNo) return s;
    const newCards = s.cards.map((c, idx) =>
      idx === cardIdx ? { character: replacement, revealed: false } : c
    );
    return { ...s, cards: newCards };
  });

  return {
    ...state,
    seats: updatedSeats,
    courtDeck: newDeck,
  };
}

export const coupCartridge: GameCartridge<
  CoupConfig,
  CoupMatchState,
  CoupCommand,
  CoupPlayerView
> = {
  cartridgeId: "coup",
  title: "Coup: Đảo Chính",
  subtitle: "Đấu trí • Thao túng quyền lực • 3–6 người chơi",
  description:
    "Dùng mưu mẹo, nói dối và lật tẩy đối phương trong cuộc chiến giành quyền kiểm soát triều đình.",
  minSeats: 3,
  maxSeats: 6,
  available: true,

  defaultConfig(_seatCount: number): CoupConfig {
    return {
      timers: {
        turnActionSeconds: 30,
        reactionWindowSeconds: 12,
        loseInfluenceSeconds: 15,
        exchangeSeconds: 20,
      },
      startingCoins: 2,
    };
  },

  validateConfig(_config: CoupConfig, seatCount: number) {
    if (seatCount < this.minSeats || seatCount > this.maxSeats) {
      return {
        valid: false,
        error: `Coup: Đảo Chính yêu cầu từ ${this.minSeats} đến ${this.maxSeats} người chơi (hiện có ${seatCount}).`,
      };
    }
    return { valid: true };
  },

  createInitialState({ config, seats, nowMs, rng = Math.random }) {
    const validation = this.validateConfig(config, seats.length);
    if (!validation.valid) {
      throw new Error(validation.error ?? "Invalid Coup config");
    }

    // Build 15-card Court Deck (3 of each of the 5 Characters)
    const deck: CoupCharacter[] = [];
    for (const ch of COUP_CHARACTERS) {
      deck.push(ch, ch, ch);
    }

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = deck[i];
      deck[i] = deck[j];
      deck[j] = tmp;
    }

    const sortedSeats = [...seats].sort((a, b) => a.seatNo - b.seatNo);
    const matchSeats: CoupSeatState[] = sortedSeats.map((s) => {
      const c1 = deck.shift()!;
      const c2 = deck.shift()!;
      return {
        seatNo: s.seatNo,
        actorId: s.actorId,
        displayName: s.displayName,
        avatarSeed: s.avatarSeed,
        coins: config.startingCoins ?? 2,
        cards: [
          { character: c1, revealed: false },
          { character: c2, revealed: false },
        ],
        alive: true,
      };
    });

    const firstSeatNo = matchSeats[0].seatNo;
    const deadline = nowMs + config.timers.turnActionSeconds * 1000;

    const state: CoupMatchState = {
      config,
      turnNumber: 1,
      activeSeatNo: firstSeatNo,
      step: "TurnActionStep",
      phaseDeadlineMs: deadline,
      seats: matchSeats,
      courtDeck: deck,
      pendingAction: null,
      pendingBlock: null,
      passedSeatNos: [],
      pendingLosses: [],
      afterLossContinuation: null,
      exchangePool: [],
      lastTransfer: null,
      lastChallengeBannerVi: null,
      winnerSeatNo: null,
      winReasonVi: null,
    };

    return {
      state,
      events: [
        {
          eventType: "MATCH_STARTED",
          message: `Ván đấu Coup: Đảo Chính bắt đầu! Mỗi người chơi nhận 2 lá bài Nhân vật và 2 xu vàng. Lượt đầu tiên thuộc về ${matchSeats[0].displayName}.`,
          visibleToSeatNos: "all",
        },
      ],
      phaseDeadlineMs: deadline,
    };
  },

  reduce({ state, command, actorSeatNo, nowMs }) {
    if (state.step === "Finished") {
      throw new Error("Ván đấu đã kết thúc.");
    }

    const actor = state.seats.find((s) => s.seatNo === actorSeatNo);
    if (!actor || !actor.alive) {
      throw new Error("Bạn không còn lá bài quyền lực nào trong ván đấu.");
    }

    // 1. TurnActionStep: Active player declares their turn action
    if (state.step === "TurnActionStep") {
      if (actorSeatNo !== state.activeSeatNo) {
        throw new Error("Chưa đến lượt đi của bạn.");
      }
      if (command.type !== "DECLARE_ACTION") {
        throw new Error("Vui lòng chọn hành động trong lượt của bạn.");
      }

      if (actor.coins >= 10 && command.action !== "COUP") {
        throw new Error(
          "Bạn đang có từ 10 xu trở lên nên bắt buộc phải phát động Đảo Chính (Coup)!"
        );
      }

      const actionType = command.action;
      const targetSeatNo = command.targetSeatNo ?? null;

      if (actionType === "INCOME") {
        const updatedSeats = state.seats.map((s) =>
          s.seatNo === actorSeatNo ? { ...s, coins: s.coins + 1 } : s
        );
        return advanceToNextTurn(
          {
            ...state,
            seats: updatedSeats,
            lastChallengeBannerVi: null,
            lastTransfer: {
              from: "treasury",
              to: actorSeatNo,
              amount: 1,
              action: "INCOME",
              atTurn: state.turnNumber,
            },
          },
          nowMs,
          [
            {
              eventType: "ACTION_INCOME",
              message: `${actor.displayName} chọn Thu Nhập (+1 xu).`,
              visibleToSeatNos: "all",
            },
          ]
        );
      }

      if (actionType === "COUP") {
        if (actor.coins < 7) {
          throw new Error("Cần ít nhất 7 xu để phát động Đảo Chính (Coup).");
        }
        const target = state.seats.find(
          (s) => s.seatNo === targetSeatNo && s.alive && s.seatNo !== actorSeatNo
        );
        if (!target) {
          throw new Error("Vui lòng chọn một đối thủ còn sống để Đảo Chính.");
        }

        const updatedSeats = state.seats.map((s) =>
          s.seatNo === actorSeatNo ? { ...s, coins: s.coins - 7 } : s
        );
        const nextState: CoupMatchState = {
          ...state,
          seats: updatedSeats,
          lastChallengeBannerVi: `${actor.displayName} chi 7 xu phát động ĐẢO CHÍNH nhắm vào ${target.displayName}!`,
          lastTransfer: {
            from: actorSeatNo,
            to: "treasury",
            amount: 7,
            action: "COUP",
            atTurn: state.turnNumber,
          },
          pendingLosses: [
            {
              seatNo: target.seatNo,
              reasonVi: `Bị ${actor.displayName} Đảo Chính (Coup)`,
            },
          ],
          afterLossContinuation: "NEXT_TURN",
        };
        return processPendingLossesOrContinue(nextState, nowMs, [
          {
            eventType: "ACTION_COUP",
            message: `⚡ ${actor.displayName} chi 7 xu phát động ĐẢO CHÍNH nhắm vào ${target.displayName}!`,
            visibleToSeatNos: "all",
          },
        ]);
      }

      // Actions that open ReactionWindowStep: FOREIGN_AID, TAX, ASSASSINATE, STEAL, EXCHANGE
      let updatedSeats = state.seats;
      let targetSeat: CoupSeatState | undefined;

      if (actionType === "ASSASSINATE") {
        if (actor.coins < 3) {
          throw new Error("Cần ít nhất 3 xu để thuê Sát Thủ Ám Sát.");
        }
        targetSeat = state.seats.find(
          (s) => s.seatNo === targetSeatNo && s.alive && s.seatNo !== actorSeatNo
        );
        if (!targetSeat) {
          throw new Error("Vui lòng chọn một đối thủ còn sống để Ám Sát.");
        }
        // Deduct 3 coins upon declaration
        updatedSeats = state.seats.map((s) =>
          s.seatNo === actorSeatNo ? { ...s, coins: s.coins - 3 } : s
        );
      } else if (actionType === "STEAL") {
        targetSeat = state.seats.find(
          (s) => s.seatNo === targetSeatNo && s.alive && s.seatNo !== actorSeatNo
        );
        if (!targetSeat) {
          throw new Error("Vui lòng chọn một đối thủ còn sống để Cướp Xu.");
        }
      }

      const claimedCharacter = ACTION_CLAIMED_CHARACTER[actionType];
      const deadline =
        nowMs + state.config.timers.reactionWindowSeconds * 1000;

      const targetPart = targetSeat ? ` nhắm vào ${targetSeat.displayName}` : "";
      const claimPart = claimedCharacter
        ? ` (tuyên bố là ${COUP_CHARACTER_META[claimedCharacter].nameVi})`
        : "";

      const nextState: CoupMatchState = {
        ...state,
        seats: updatedSeats,
        step: "ReactionWindowStep",
        phaseDeadlineMs: deadline,
        pendingAction: {
          type: actionType,
          actorSeatNo,
          targetSeatNo: targetSeat?.seatNo ?? null,
          claimedCharacter,
        },
        pendingBlock: null,
        passedSeatNos: [],
        lastChallengeBannerVi: null,
      };

      return {
        state: nextState,
        events: [
          {
            eventType: "ACTION_DECLARED",
            message: `📢 ${actor.displayName} thực hiện ${ACTION_LABEL_VI[actionType]}${targetPart}${claimPart}. Đang chờ phản ứng (Bắt bài / Chặn)...`,
            visibleToSeatNos: "all",
          },
        ],
        phaseDeadlineMs: deadline,
      };
    }

    // 2. ReactionWindowStep: Other living players can PASS, CHALLENGE, or BLOCK
    if (state.step === "ReactionWindowStep" && state.pendingAction) {
      const pending = state.pendingAction;
      if (actorSeatNo === pending.actorSeatNo) {
        throw new Error("Đang chờ những người chơi khác phản ứng với hành động của bạn.");
      }

      const actionActor = state.seats.find(
        (s) => s.seatNo === pending.actorSeatNo
      )!;

      if (command.type === "PASS") {
        const passed = Array.from(
          new Set([...state.passedSeatNos, actorSeatNo])
        );
        const otherLiving = getLivingSeats(state).filter(
          (s) => s.seatNo !== pending.actorSeatNo
        );
        const allPassed = otherLiving.every((s) => passed.includes(s.seatNo));

        if (allPassed) {
          return executeApprovedAction(
            { ...state, passedSeatNos: passed },
            nowMs,
            []
          );
        }

        return {
          state: { ...state, passedSeatNos: passed },
          events: [],
          phaseDeadlineMs: state.phaseDeadlineMs,
        };
      }

      if (command.type === "CHALLENGE") {
        if (!pending.claimedCharacter) {
          throw new Error("Hành động này không tuyên bố Nhân vật nên không thể Bắt bài.");
        }

        const claimed = pending.claimedCharacter;
        const actorHasCard = actionActor.cards.some(
          (c) => !c.revealed && c.character === claimed
        );

        if (actorHasCard) {
          // Actor told the TRUTH! Swap their card with Court Deck, Challenger loses 1 Influence, then action still executes!
          const swappedState = replaceRevealedTruthfulCard(
            state,
            actionActor.seatNo,
            claimed
          );
          const banner = `🔍 ${actor.displayName} BẮT BÀI SAI! ${actionActor.displayName} thật sự có ${COUP_CHARACTER_META[claimed].nameVi} (đã rút lá mới). ${actor.displayName} mất 1 lá bài và hành động vẫn tiếp tục!`;

          const afterTruth: CoupMatchState = {
            ...swappedState,
            lastChallengeBannerVi: banner,
            pendingLosses: [
              {
                seatNo: actorSeatNo,
                reasonVi: `Bắt bài sai ${actionActor.displayName} (${COUP_CHARACTER_META[claimed].nameVi})`,
              },
            ],
            afterLossContinuation: "EXECUTE_ACTION",
          };

          return processPendingLossesOrContinue(afterTruth, nowMs, [
            {
              eventType: "CHALLENGE_FAILED",
              message: banner,
              visibleToSeatNos: "all",
            },
          ]);
        } else {
          // Actor BLUFFED! Refund 3 coins if ASSASSINATE was bluffed and caught immediately
          const refundedSeats =
            pending.type === "ASSASSINATE"
              ? state.seats.map((s) =>
                  s.seatNo === actionActor.seatNo
                    ? { ...s, coins: s.coins + 3 }
                    : s
                )
              : state.seats;

          const banner = `💥 ${actor.displayName} LẬT TẨY THÀNH CÔNG! ${actionActor.displayName} không có ${COUP_CHARACTER_META[claimed].nameVi}! Hành động bị huỷ và ${actionActor.displayName} mất 1 lá bài!`;

          const afterBluffCaught: CoupMatchState = {
            ...state,
            seats: refundedSeats,
            lastChallengeBannerVi: banner,
            pendingAction: null,
            pendingLosses: [
              {
                seatNo: actionActor.seatNo,
                reasonVi: `Bị ${actor.displayName} lật tẩy nói dối ${COUP_CHARACTER_META[claimed].nameVi}`,
              },
            ],
            afterLossContinuation: "NEXT_TURN",
          };

          return processPendingLossesOrContinue(afterBluffCaught, nowMs, [
            {
              eventType: "CHALLENGE_SUCCEEDED",
              message: banner,
              visibleToSeatNos: "all",
            },
          ]);
        }
      }

      if (command.type === "BLOCK") {
        const blockChar = command.character;
        if (pending.type === "FOREIGN_AID") {
          if (blockChar !== "Duke") {
            throw new Error("Chỉ Công Tước (Duke) mới chặn được Viện Trợ.");
          }
        } else if (pending.type === "ASSASSINATE") {
          if (actorSeatNo !== pending.targetSeatNo) {
            throw new Error("Chỉ mục tiêu bị Ám Sát mới được tuyên bố chặn.");
          }
          if (blockChar !== "Contessa") {
            throw new Error("Chỉ Bá Tước Phu Nhân (Contessa) mới chặn được Ám Sát.");
          }
        } else if (pending.type === "STEAL") {
          if (actorSeatNo !== pending.targetSeatNo) {
            throw new Error("Chỉ mục tiêu bị Cướp Xu mới được tuyên bố chặn.");
          }
          if (blockChar !== "Captain" && blockChar !== "Ambassador") {
            throw new Error(
              "Chỉ Thuyền Trưởng hoặc Đại Sứ mới chặn được Cướp Xu."
            );
          }
        } else {
          throw new Error("Hành động này không thể bị Chặn.");
        }

        const deadline =
          nowMs + state.config.timers.reactionWindowSeconds * 1000;
        const nextState: CoupMatchState = {
          ...state,
          step: "BlockChallengeStep",
          phaseDeadlineMs: deadline,
          pendingBlock: {
            blockerSeatNo: actorSeatNo,
            claimedCharacter: blockChar,
          },
          passedSeatNos: [],
        };

        return {
          state: nextState,
          events: [
            {
              eventType: "BLOCK_DECLARED",
              message: `🛡️ ${actor.displayName} tuyên bố có ${COUP_CHARACTER_META[blockChar].nameVi} để CHẶN ${actionActor.displayName}! Ai muốn Bắt bài cú chặn này?`,
              visibleToSeatNos: "all",
            },
          ],
          phaseDeadlineMs: deadline,
        };
      }
    }

    // 3. BlockChallengeStep: Anyone other than the blocker can PASS or CHALLENGE the block
    if (
      state.step === "BlockChallengeStep" &&
      state.pendingAction &&
      state.pendingBlock
    ) {
      const pending = state.pendingAction;
      const block = state.pendingBlock;

      if (actorSeatNo === block.blockerSeatNo) {
        throw new Error("Đang chờ đối phương phản ứng với tuyên bố Chặn của bạn.");
      }

      const blocker = state.seats.find(
        (s) => s.seatNo === block.blockerSeatNo
      )!;
      const actionActor = state.seats.find(
        (s) => s.seatNo === pending.actorSeatNo
      )!;

      if (command.type === "PASS") {
        const passed = Array.from(
          new Set([...state.passedSeatNos, actorSeatNo])
        );
        const otherLiving = getLivingSeats(state).filter(
          (s) => s.seatNo !== block.blockerSeatNo
        );
        const allPassed = otherLiving.every((s) => passed.includes(s.seatNo));

        if (allPassed) {
          const msg = `🛡️ Cú chặn bằng ${COUP_CHARACTER_META[block.claimedCharacter].nameVi} của ${blocker.displayName} thành công! Hành động của ${actionActor.displayName} bị vô hiệu hoá.`;
          return advanceToNextTurn(
            {
              ...state,
              lastChallengeBannerVi: msg,
            },
            nowMs,
            [
              {
                eventType: "BLOCK_SUCCEEDED",
                message: msg,
                visibleToSeatNos: "all",
              },
            ]
          );
        }

        return {
          state: { ...state, passedSeatNos: passed },
          events: [],
          phaseDeadlineMs: state.phaseDeadlineMs,
        };
      }

      if (command.type === "CHALLENGE") {
        const claimed = block.claimedCharacter;
        const blockerHasCard = blocker.cards.some(
          (c) => !c.revealed && c.character === claimed
        );

        if (blockerHasCard) {
          // Blocker told the TRUTH! Blocker swaps card, Challenger loses 1 Influence, and Block succeeds (action is cancelled -> NEXT_TURN)!
          const swappedState = replaceRevealedTruthfulCard(
            state,
            blocker.seatNo,
            claimed
          );
          const banner = `🔍 ${actor.displayName} BẮT BÀI CÚ CHẶN SAI! ${blocker.displayName} thật sự có ${COUP_CHARACTER_META[claimed].nameVi}. Cú chặn thành công và ${actor.displayName} mất 1 lá bài!`;

          const afterTruth: CoupMatchState = {
            ...swappedState,
            lastChallengeBannerVi: banner,
            pendingAction: null,
            pendingBlock: null,
            pendingLosses: [
              {
                seatNo: actorSeatNo,
                reasonVi: `Bắt bài sai cú chặn của ${blocker.displayName} (${COUP_CHARACTER_META[claimed].nameVi})`,
              },
            ],
            afterLossContinuation: "NEXT_TURN",
          };

          return processPendingLossesOrContinue(afterTruth, nowMs, [
            {
              eventType: "BLOCK_CHALLENGE_FAILED",
              message: banner,
              visibleToSeatNos: "all",
            },
          ]);
        } else {
          // Blocker BLUFFED! Blocker loses 1 Influence AND the original action still executes!
          const banner = `💥 ${actor.displayName} LẬT TẨY CÚ CHẶN THÀNH CÔNG! ${blocker.displayName} nói dối có ${COUP_CHARACTER_META[claimed].nameVi}! ${blocker.displayName} mất 1 lá bài và đòn của ${actionActor.displayName} vẫn giáng xuống!`;

          const afterBluffBlock: CoupMatchState = {
            ...state,
            lastChallengeBannerVi: banner,
            pendingBlock: null,
            pendingLosses: [
              {
                seatNo: blocker.seatNo,
                reasonVi: `Nói dối có ${COUP_CHARACTER_META[claimed].nameVi} để chặn`,
              },
            ],
            afterLossContinuation: "EXECUTE_ACTION",
          };

          return processPendingLossesOrContinue(afterBluffBlock, nowMs, [
            {
              eventType: "BLOCK_CHALLENGE_SUCCEEDED",
              message: banner,
              visibleToSeatNos: "all",
            },
          ]);
        }
      }
    }

    // 4. LoseInfluenceStep: The seat at pendingLosses[0] chooses which unrevealed card to flip face-up
    if (state.step === "LoseInfluenceStep") {
      const currentLoss = state.pendingLosses[0];
      if (!currentLoss || currentLoss.seatNo !== actorSeatNo) {
        throw new Error("Không phải lượt chọn bỏ bài của bạn.");
      }
      if (command.type !== "LOSE_INFLUENCE") {
        throw new Error("Vui lòng chọn 1 lá bài trên tay để lật bỏ.");
      }

      const targetCard = actor.cards[command.cardIndex];
      if (!targetCard || targetCard.revealed) {
        throw new Error("Lá bài bạn chọn không hợp lệ hoặc đã bị lật trước đó.");
      }

      const updatedSeats = state.seats.map((s) => {
        if (s.seatNo !== actorSeatNo) return s;
        const newCards = s.cards.map((c, idx) =>
          idx === command.cardIndex ? { ...c, revealed: true } : c
        );
        return {
          ...s,
          cards: newCards,
          alive: newCards.some((c) => !c.revealed),
        };
      });

      const restLosses = state.pendingLosses.slice(1);
      const nextState: CoupMatchState = {
        ...state,
        seats: updatedSeats,
        pendingLosses: restLosses,
      };

      return processPendingLossesOrContinue(nextState, nowMs, [
        {
          eventType: "INFLUENCE_LOST",
          message: `💔 ${actor.displayName} đã lật bỏ lá ${COUP_CHARACTER_META[targetCard.character].nameVi} (${currentLoss.reasonVi}).`,
          visibleToSeatNos: "all",
          payload: { seatNo: actorSeatNo, character: targetCard.character },
        },
      ]);
    }

    // 5. ExchangePickStep: Ambassador chooses which cards from exchangePool to keep
    if (state.step === "ExchangePickStep") {
      if (actorSeatNo !== state.activeSeatNo || command.type !== "EXCHANGE_KEEP") {
        throw new Error("Chỉ Đại Sứ đang thực hiện Đổi Bài mới có thể chọn bài giữ lại.");
      }

      const requiredKeep = getAliveCardCount(actor);
      const uniqueIndices = Array.from(new Set(command.keepIndices));
      if (
        uniqueIndices.length !== requiredKeep ||
        uniqueIndices.some((i) => i < 0 || i >= state.exchangePool.length)
      ) {
        throw new Error(
          `Vui lòng chọn giữ lại đúng ${requiredKeep} lá bài.`
        );
      }

      const keptChars = uniqueIndices.map((i) => state.exchangePool[i]);
      const returnedChars = state.exchangePool.filter(
        (_, i) => !uniqueIndices.includes(i)
      );

      let keptCursor = 0;
      const updatedCards = actor.cards.map((c) => {
        if (c.revealed) return c;
        const nextChar = keptChars[keptCursor++];
        return { character: nextChar, revealed: false };
      });

      const updatedSeats = state.seats.map((s) =>
        s.seatNo === actorSeatNo ? { ...s, cards: updatedCards } : s
      );

      return advanceToNextTurn(
        {
          ...state,
          seats: updatedSeats,
          courtDeck: [...state.courtDeck, ...returnedChars],
          exchangePool: [],
        },
        nowMs,
        [
          {
            eventType: "EXCHANGE_COMPLETED",
            message: `🔄 Đại Sứ ${actor.displayName} đã hoàn tất đổi bài với Bộ bài Triều đình.`,
            visibleToSeatNos: "all",
          },
        ]
      );
    }

    throw new Error("Lệnh không hợp lệ ở bước hiện tại.");
  },

  onPhaseTimeout({ state, nowMs }) {
    if (state.step === "Finished") {
      return { state, events: [], phaseDeadlineMs: null };
    }

    const timeoutEvent: MatchEventRecord = {
      eventType: "PHASE_TIMEOUT",
      message: "Hết thời gian đếm ngược, hệ thống tự động xử lý bước hiện tại.",
      visibleToSeatNos: "all",
    };

    if (state.step === "TurnActionStep") {
      const actor = state.seats.find((s) => s.seatNo === state.activeSeatNo);
      if (actor && actor.coins >= 10) {
        const target = getLivingSeats(state).find(
          (s) => s.seatNo !== actor.seatNo
        );
        if (target) {
          return this.reduce({
            state,
            actorSeatNo: actor.seatNo,
            command: {
              type: "DECLARE_ACTION",
              action: "COUP",
              targetSeatNo: target.seatNo,
            },
            nowMs,
          });
        }
      }
      return this.reduce({
        state,
        actorSeatNo: state.activeSeatNo,
        command: { type: "DECLARE_ACTION", action: "INCOME" },
        nowMs,
      });
    }

    if (state.step === "ReactionWindowStep") {
      return executeApprovedAction(state, nowMs, [timeoutEvent]);
    }

    if (state.step === "BlockChallengeStep") {
      return advanceToNextTurn(state, nowMs, [
        timeoutEvent,
        {
          eventType: "BLOCK_SUCCEEDED",
          message: "Hết thời gian bắt bài! Cú chặn đã thành công.",
          visibleToSeatNos: "all",
        },
      ]);
    }

    if (state.step === "LoseInfluenceStep") {
      const currentLoss = state.pendingLosses[0];
      if (!currentLoss) {
        return advanceToNextTurn(state, nowMs, [timeoutEvent]);
      }
      const seat = state.seats.find((s) => s.seatNo === currentLoss.seatNo);
      const firstAliveIdx =
        seat?.cards.findIndex((c) => !c.revealed) ?? 0;
      return this.reduce({
        state,
        actorSeatNo: currentLoss.seatNo,
        command: {
          type: "LOSE_INFLUENCE",
          cardIndex: Math.max(0, firstAliveIdx),
        },
        nowMs,
      });
    }

    if (state.step === "ExchangePickStep") {
      const actor = state.seats.find((s) => s.seatNo === state.activeSeatNo);
      const keepCount = actor ? getAliveCardCount(actor) : 1;
      const keepIndices = Array.from({ length: keepCount }, (_, i) => i);
      return this.reduce({
        state,
        actorSeatNo: state.activeSeatNo,
        command: { type: "EXCHANGE_KEEP", keepIndices },
        nowMs,
      });
    }

    return { state, events: [], phaseDeadlineMs: state.phaseDeadlineMs };
  },

  autoActBots({ current, botSeatNos, nowMs }) {
    const botSet = new Set(botSeatNos);
    if (botSet.size === 0) return current;

    let state = current.state;
    const events = [...current.events];
    let phaseDeadlineMs = current.phaseDeadlineMs;

    for (let guard = 0; guard < 10; guard++) {
      if (state.step === "Finished") break;

      let acted = false;
      const livingSeats = getLivingSeats(state);

      if (
        state.step === "TurnActionStep" &&
        botSet.has(state.activeSeatNo)
      ) {
        const bot = state.seats.find((s) => s.seatNo === state.activeSeatNo)!;
        const targets = livingSeats.filter((s) => s.seatNo !== bot.seatNo);
        const target = targets[0];

        let cmd: CoupCommand = { type: "DECLARE_ACTION", action: "INCOME" };
        if (bot.coins >= 7 && target) {
          cmd = {
            type: "DECLARE_ACTION",
            action: "COUP",
            targetSeatNo: target.seatNo,
          };
        } else if (
          bot.cards.some((c) => !c.revealed && c.character === "Duke")
        ) {
          cmd = { type: "DECLARE_ACTION", action: "TAX" };
        } else if (
          bot.coins >= 3 &&
          target &&
          bot.cards.some((c) => !c.revealed && c.character === "Assassin")
        ) {
          cmd = {
            type: "DECLARE_ACTION",
            action: "ASSASSINATE",
            targetSeatNo: target.seatNo,
          };
        } else if (
          target &&
          target.coins > 0 &&
          bot.cards.some((c) => !c.revealed && c.character === "Captain")
        ) {
          cmd = {
            type: "DECLARE_ACTION",
            action: "STEAL",
            targetSeatNo: target.seatNo,
          };
        } else {
          cmd = { type: "DECLARE_ACTION", action: "FOREIGN_AID" };
        }

        const res = this.reduce({
          state,
          actorSeatNo: bot.seatNo,
          command: cmd,
          nowMs,
        });
        state = res.state;
        events.push(...res.events);
        phaseDeadlineMs = res.phaseDeadlineMs;
        acted = true;
      } else if (state.step === "ReactionWindowStep" && state.pendingAction) {
        const pending = state.pendingAction;
        const unpassedBots = livingSeats.filter(
          (s) =>
            botSet.has(s.seatNo) &&
            s.seatNo !== pending.actorSeatNo &&
            !state.passedSeatNos.includes(s.seatNo)
        );
        if (unpassedBots.length > 0) {
          const bot = unpassedBots[0];
          // If the bot is targeted by ASSASSINATE and actually holds Contessa, block!
          if (
            pending.type === "ASSASSINATE" &&
            pending.targetSeatNo === bot.seatNo &&
            bot.cards.some((c) => !c.revealed && c.character === "Contessa")
          ) {
            const res = this.reduce({
              state,
              actorSeatNo: bot.seatNo,
              command: { type: "BLOCK", character: "Contessa" },
              nowMs,
            });
            state = res.state;
            events.push(...res.events);
            phaseDeadlineMs = res.phaseDeadlineMs;
            acted = true;
          } else if (
            pending.type === "STEAL" &&
            pending.targetSeatNo === bot.seatNo &&
            bot.cards.some(
              (c) =>
                !c.revealed &&
                (c.character === "Captain" || c.character === "Ambassador")
            )
          ) {
            const blockerChar = bot.cards.find(
              (c) =>
                !c.revealed &&
                (c.character === "Captain" || c.character === "Ambassador")
            )!.character;
            const res = this.reduce({
              state,
              actorSeatNo: bot.seatNo,
              command: { type: "BLOCK", character: blockerChar },
              nowMs,
            });
            state = res.state;
            events.push(...res.events);
            phaseDeadlineMs = res.phaseDeadlineMs;
            acted = true;
          } else {
            const res = this.reduce({
              state,
              actorSeatNo: bot.seatNo,
              command: { type: "PASS" },
              nowMs,
            });
            state = res.state;
            events.push(...res.events);
            phaseDeadlineMs = res.phaseDeadlineMs;
            acted = true;
          }
        }
      } else if (state.step === "BlockChallengeStep" && state.pendingBlock) {
        const blockerNo = state.pendingBlock.blockerSeatNo;
        const unpassedBots = livingSeats.filter(
          (s) =>
            botSet.has(s.seatNo) &&
            s.seatNo !== blockerNo &&
            !state.passedSeatNos.includes(s.seatNo)
        );
        if (unpassedBots.length > 0) {
          const res = this.reduce({
            state,
            actorSeatNo: unpassedBots[0].seatNo,
            command: { type: "PASS" },
            nowMs,
          });
          state = res.state;
          events.push(...res.events);
          phaseDeadlineMs = res.phaseDeadlineMs;
          acted = true;
        }
      } else if (state.step === "LoseInfluenceStep") {
        const currentLoss = state.pendingLosses[0];
        if (currentLoss && botSet.has(currentLoss.seatNo)) {
          const bot = state.seats.find((s) => s.seatNo === currentLoss.seatNo)!;
          const idx = bot.cards.findIndex((c) => !c.revealed);
          const res = this.reduce({
            state,
            actorSeatNo: bot.seatNo,
            command: {
              type: "LOSE_INFLUENCE",
              cardIndex: Math.max(0, idx),
            },
            nowMs,
          });
          state = res.state;
          events.push(...res.events);
          phaseDeadlineMs = res.phaseDeadlineMs;
          acted = true;
        }
      } else if (
        state.step === "ExchangePickStep" &&
        botSet.has(state.activeSeatNo)
      ) {
        const bot = state.seats.find((s) => s.seatNo === state.activeSeatNo)!;
        const keepCount = getAliveCardCount(bot);
        const keepIndices = Array.from({ length: keepCount }, (_, i) => i);
        const res = this.reduce({
          state,
          actorSeatNo: bot.seatNo,
          command: { type: "EXCHANGE_KEEP", keepIndices },
          nowMs,
        });
        state = res.state;
        events.push(...res.events);
        phaseDeadlineMs = res.phaseDeadlineMs;
        acted = true;
      }

      if (!acted) break;
    }

    return { state, events, phaseDeadlineMs };
  },

  projectView({ state, viewerSeatNo }): CoupPlayerView {
    const isFinished = state.step === "Finished";
    const seats: CoupProjectedSeat[] = state.seats.map((s) => ({
      seatNo: s.seatNo,
      actorId: s.actorId,
      displayName: s.displayName,
      avatarSeed: s.avatarSeed,
      coins: s.coins,
      alive: s.alive,
      cards: s.cards.map((c) => ({
        revealed: c.revealed,
        character:
          c.revealed || isFinished || s.seatNo === viewerSeatNo
            ? c.character
            : null,
      })),
      hasPassedReaction: state.passedSeatNos.includes(s.seatNo),
    }));

    const viewerSeat =
      viewerSeatNo !== null
        ? state.seats.find((s) => s.seatNo === viewerSeatNo) ?? null
        : null;

    const exchangePool =
      state.step === "ExchangePickStep" && state.activeSeatNo === viewerSeatNo
        ? state.exchangePool
        : [];
    const exchangeKeepCount = viewerSeat ? getAliveCardCount(viewerSeat) : 0;

    return {
      cartridgeId: "coup",
      turnNumber: state.turnNumber,
      activeSeatNo: state.activeSeatNo,
      step: state.step,
      phaseDeadlineMs: state.phaseDeadlineMs,
      viewerSeatNo,
      courtDeckCount: state.courtDeck.length,
      seats,
      pendingAction: state.pendingAction,
      pendingBlock: state.pendingBlock,
      activeLossTarget: state.pendingLosses[0] ?? null,
      exchangePool,
      exchangeKeepCount,
      lastTransfer: state.lastTransfer,
      lastChallengeBannerVi: state.lastChallengeBannerVi,
      winnerSeatNo: state.winnerSeatNo,
      winReasonVi: state.winReasonVi,
      config: state.config,
    };
  },

  resolveChannels({ state, viewerSeatNo }): ChannelPermission[] {
    const viewerSeat =
      viewerSeatNo !== null
        ? state.seats.find((s) => s.seatNo === viewerSeatNo) ?? null
        : null;
    const isAlive = viewerSeat?.alive ?? false;
    const isFinished = state.step === "Finished";

    const channels: ChannelPermission[] = [
      {
        channelId: "village",
        label: "Triều Đình (Công khai)",
        canRead: true,
        canWrite: isAlive || isFinished,
      },
    ];

    if (!isAlive || isFinished) {
      channels.push({
        channelId: "graveyard",
        label: "Khán Đài (Đã bị loại)",
        canRead: !isAlive || isFinished,
        canWrite: viewerSeat !== null && !isAlive && !isFinished,
      });
    }

    return channels;
  },

  isMatchOver(state) {
    return state.step === "Finished";
  },

  getWinningFaction(state) {
    if (state.winnerSeatNo === null) return null;
    const winner = state.seats.find((s) => s.seatNo === state.winnerSeatNo);
    return winner?.displayName ?? `Seat #${state.winnerSeatNo}`;
  },
};
