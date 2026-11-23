import type {
  CartridgeTransitionResult,
  ChannelPermission,
  GameCartridge,
  MatchEventRecord,
} from "@/cartridges/types";

export const SPLENDOR_GEMS = [
  "white",
  "blue",
  "green",
  "red",
  "black",
] as const;

export type SplendorGemColor = (typeof SPLENDOR_GEMS)[number];
export type SplendorTokenColor = SplendorGemColor | "gold";
export type SplendorCardTier = 1 | 2 | 3;

export const SPLENDOR_TOKEN_COLORS: readonly SplendorTokenColor[] = [
  "white",
  "blue",
  "green",
  "red",
  "black",
  "gold",
];

export const SPLENDOR_GEM_META: Record<
  SplendorTokenColor,
  {
    nameVi: string;
    shortVi: string;
    hex: string;
    highlightHex: string;
    darkHex: string;
    textHex: string;
  }
> = {
  white: {
    nameVi: "Kim Cương",
    shortVi: "Trắng",
    hex: "#e2e8f0",
    highlightHex: "#ffffff",
    darkHex: "#64748b",
    textHex: "#0f172a",
  },
  blue: {
    nameVi: "Sapphire",
    shortVi: "Xanh dương",
    hex: "#2563eb",
    highlightHex: "#93c5fd",
    darkHex: "#1e3a8a",
    textHex: "#ffffff",
  },
  green: {
    nameVi: "Lục Bảo",
    shortVi: "Xanh lá",
    hex: "#16a34a",
    highlightHex: "#86efac",
    darkHex: "#14532d",
    textHex: "#ffffff",
  },
  red: {
    nameVi: "Hồng Ngọc",
    shortVi: "Đỏ",
    hex: "#dc2626",
    highlightHex: "#fca5a5",
    darkHex: "#7f1d1d",
    textHex: "#ffffff",
  },
  black: {
    nameVi: "Mã Não (Onyx)",
    shortVi: "Đen",
    hex: "#334155",
    highlightHex: "#94a3b8",
    darkHex: "#090d16",
    textHex: "#f8fafc",
  },
  gold: {
    nameVi: "Vàng (Joker)",
    shortVi: "Vàng",
    hex: "#eab308",
    highlightHex: "#fef08a",
    darkHex: "#854d0e",
    textHex: "#1c1917",
  },
};

export type GemCostMap = Record<SplendorGemColor, number>;
export type TokenBag = Record<SplendorTokenColor, number>;

export interface SplendorDevCard {
  id: string;
  tier: SplendorCardTier;
  bonus: SplendorGemColor;
  points: number;
  cost: GemCostMap;
  artVariant: number;
}

export interface SplendorNobleTile {
  id: string;
  nameVi: string;
  points: number;
  requirement: GemCostMap;
  portraitVariant: number;
}

export interface SplendorConfig {
  targetPoints: number;
  timers: {
    turnActionSeconds: number;
    discardSeconds: number;
    noblePickSeconds: number;
  };
}

export type SplendorStep =
  | "TurnActionStep"
  | "DiscardTokensStep"
  | "NoblePickStep"
  | "Finished";

export interface SplendorSeatState {
  seatNo: number;
  actorId: string;
  displayName: string;
  avatarSeed?: string;
  tokens: TokenBag;
  bonuses: GemCostMap;
  purchasedCards: SplendorDevCard[];
  reservedCards: { card: SplendorDevCard; fromDeck: boolean }[];
  nobles: SplendorNobleTile[];
  points: number;
}

export interface SplendorVisualEffect {
  seq: number;
  kind: "TAKE_GEMS" | "BUY_CARD" | "RESERVE_CARD" | "DISCARD_GEMS" | "NOBLE_VISIT";
  seatNo: number;
  gems?: Partial<TokenBag>;
  tier?: SplendorCardTier;
  slotIndex?: number;
  nobleId?: string;
  cardBonus?: SplendorGemColor;
}

export interface SplendorMatchState {
  config: SplendorConfig;
  roundNumber: number;
  turnNumber: number;
  firstSeatNo: number;
  activeSeatNo: number;
  step: SplendorStep;
  phaseDeadlineMs: number | null;
  finalRoundTriggered: boolean;
  finalRoundTriggerSeatNo: number | null;

  supply: TokenBag;
  decks: Record<SplendorCardTier, SplendorDevCard[]>;
  market: Record<SplendorCardTier, (SplendorDevCard | null)[]>;
  nobles: SplendorNobleTile[];
  eligibleNobleIds: string[];

  seats: SplendorSeatState[];
  lastVisualEffect: SplendorVisualEffect | null;
  winnerSeatNos: number[];
  winReasonVi: string | null;
}

export type SplendorCommand =
  | { type: "TAKE_GEMS"; gems: SplendorGemColor[] }
  | { type: "RESERVE_MARKET"; tier: SplendorCardTier; slotIndex: number }
  | { type: "RESERVE_DECK"; tier: SplendorCardTier }
  | { type: "BUY_MARKET"; tier: SplendorCardTier; slotIndex: number }
  | { type: "BUY_RESERVED"; reservedIndex: number }
  | { type: "DISCARD_TOKENS"; tokens: Partial<TokenBag> }
  | { type: "PICK_NOBLE"; nobleId: string };

export interface SplendorProjectedReservedCard {
  card: SplendorDevCard | null;
  fromDeck: boolean;
  tier: SplendorCardTier;
}

export interface SplendorProjectedSeat {
  seatNo: number;
  actorId: string;
  displayName: string;
  avatarSeed?: string;
  tokens: TokenBag;
  totalTokens: number;
  bonuses: GemCostMap;
  purchasedCount: number;
  reservedCards: SplendorProjectedReservedCard[];
  nobles: SplendorNobleTile[];
  points: number;
}

export interface SplendorPlayerView {
  cartridgeId: "splendor";
  roundNumber: number;
  turnNumber: number;
  activeSeatNo: number;
  step: SplendorStep;
  phaseDeadlineMs: number | null;
  viewerSeatNo: number | null;
  finalRoundTriggered: boolean;
  targetPoints: number;

  supply: TokenBag;
  deckCounts: Record<SplendorCardTier, number>;
  market: Record<SplendorCardTier, (SplendorDevCard | null)[]>;
  nobles: SplendorNobleTile[];
  eligibleNobleIds: string[];
  seats: SplendorProjectedSeat[];

  lastVisualEffect: SplendorVisualEffect | null;
  winnerSeatNos: number[];
  winReasonVi: string | null;
  config: SplendorConfig;
}

export function emptyGemCost(): GemCostMap {
  return { white: 0, blue: 0, green: 0, red: 0, black: 0 };
}

export function emptyTokenBag(): TokenBag {
  return { white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 0 };
}

export function countTokens(bag: TokenBag): number {
  return (
    bag.white + bag.blue + bag.green + bag.red + bag.black + bag.gold
  );
}

/**
 * Checks whether a seat can afford a development card (using permanent bonuses + gem tokens + gold jokers)
 * and returns the exact token payment breakdown if affordable.
 */
export function computeCardPayment(
  seat: Pick<SplendorSeatState, "tokens" | "bonuses">,
  card: SplendorDevCard
): { affordable: boolean; payment: TokenBag; goldNeeded: number } {
  const payment = emptyTokenBag();
  let goldNeeded = 0;

  for (const gem of SPLENDOR_GEMS) {
    const netCost = Math.max(0, card.cost[gem] - seat.bonuses[gem]);
    const payFromGem = Math.min(seat.tokens[gem], netCost);
    payment[gem] = payFromGem;
    goldNeeded += netCost - payFromGem;
  }

  if (goldNeeded > seat.tokens.gold) {
    return { affordable: false, payment: emptyTokenBag(), goldNeeded };
  }

  payment.gold = goldNeeded;
  return { affordable: true, payment, goldNeeded };
}

function makeCost(
  pairs: Partial<Record<SplendorGemColor, number>>
): GemCostMap {
  return {
    white: pairs.white ?? 0,
    blue: pairs.blue ?? 0,
    green: pairs.green ?? 0,
    red: pairs.red ?? 0,
    black: pairs.black ?? 0,
  };
}

/**
 * Generates the authentic 90 Space Cowboys Splendor Development Cards
 * (40 Tier 1, 30 Tier 2, 20 Tier 3) symmetrically balanced across all 5 gem colors.
 */
export function buildOfficialSplendorDecks(): Record<
  SplendorCardTier,
  SplendorDevCard[]
> {
  const tier1: SplendorDevCard[] = [];
  const tier2: SplendorDevCard[] = [];
  const tier3: SplendorDevCard[] = [];

  SPLENDOR_GEMS.forEach((bonus, i) => {
    const c0 = SPLENDOR_GEMS[i];
    const c1 = SPLENDOR_GEMS[(i + 1) % 5];
    const c2 = SPLENDOR_GEMS[(i + 2) % 5];
    const c3 = SPLENDOR_GEMS[(i + 3) % 5];
    const c4 = SPLENDOR_GEMS[(i + 4) % 5];

    // 8 Tier-1 Cards per color (40 total)
    const t1Specs: { points: number; cost: GemCostMap }[] = [
      { points: 0, cost: makeCost({ [c1]: 3 }) },
      { points: 0, cost: makeCost({ [c1]: 2, [c2]: 1 }) },
      { points: 0, cost: makeCost({ [c2]: 2, [c3]: 2 }) },
      { points: 0, cost: makeCost({ [c1]: 1, [c2]: 1, [c3]: 1, [c4]: 1 }) },
      { points: 0, cost: makeCost({ [c1]: 2, [c2]: 1, [c3]: 1, [c4]: 1 }) },
      { points: 0, cost: makeCost({ [c0]: 1, [c1]: 3, [c2]: 1 }) },
      { points: 0, cost: makeCost({ [c1]: 2, [c3]: 1, [c4]: 2 }) },
      { points: 1, cost: makeCost({ [c2]: 4 }) },
    ];
    t1Specs.forEach((spec, idx) => {
      tier1.push({
        id: `t1-${bonus}-${idx}`,
        tier: 1,
        bonus,
        points: spec.points,
        cost: spec.cost,
        artVariant: idx % 4,
      });
    });

    // 6 Tier-2 Cards per color (30 total)
    const t2Specs: { points: number; cost: GemCostMap }[] = [
      { points: 1, cost: makeCost({ [c1]: 3, [c2]: 2, [c3]: 2 }) },
      { points: 1, cost: makeCost({ [c0]: 2, [c1]: 3, [c4]: 3 }) },
      { points: 2, cost: makeCost({ [c1]: 5 }) },
      { points: 2, cost: makeCost({ [c2]: 5, [c3]: 3 }) },
      { points: 2, cost: makeCost({ [c1]: 4, [c2]: 2, [c4]: 1 }) },
      { points: 3, cost: makeCost({ [c0]: 6 }) },
    ];
    t2Specs.forEach((spec, idx) => {
      tier2.push({
        id: `t2-${bonus}-${idx}`,
        tier: 2,
        bonus,
        points: spec.points,
        cost: spec.cost,
        artVariant: idx % 4,
      });
    });

    // 4 Tier-3 Cards per color (20 total)
    const t3Specs: { points: number; cost: GemCostMap }[] = [
      { points: 3, cost: makeCost({ [c1]: 3, [c2]: 3, [c3]: 5, [c4]: 3 }) },
      { points: 4, cost: makeCost({ [c4]: 7 }) },
      { points: 4, cost: makeCost({ [c0]: 3, [c3]: 3, [c4]: 6 }) },
      { points: 5, cost: makeCost({ [c0]: 3, [c4]: 7 }) },
    ];
    t3Specs.forEach((spec, idx) => {
      tier3.push({
        id: `t3-${bonus}-${idx}`,
        tier: 3,
        bonus,
        points: spec.points,
        cost: spec.cost,
        artVariant: idx % 4,
      });
    });
  });

  return { 1: tier1, 2: tier2, 3: tier3 };
}

/**
 * Generates the official 10 Space Cowboys Splendor Noble Tiles (each worth 3 Prestige Points).
 */
export function buildOfficialSplendorNobles(): SplendorNobleTile[] {
  return [
    {
      id: "noble-isabella",
      nameVi: "Nữ Hoàng Isabella",
      points: 3,
      requirement: makeCost({ black: 4, white: 4 }),
      portraitVariant: 0,
    },
    {
      id: "noble-medici",
      nameVi: "Công Tước Medici",
      points: 3,
      requirement: makeCost({ blue: 4, white: 4 }),
      portraitVariant: 1,
    },
    {
      id: "noble-charles",
      nameVi: "Hoàng Đế Charles V",
      points: 3,
      requirement: makeCost({ green: 4, blue: 4 }),
      portraitVariant: 2,
    },
    {
      id: "noble-suleiman",
      nameVi: "Quốc Vương Suleiman",
      points: 3,
      requirement: makeCost({ red: 4, green: 4 }),
      portraitVariant: 3,
    },
    {
      id: "noble-francis",
      nameVi: "Vua Francis I",
      points: 3,
      requirement: makeCost({ black: 4, red: 4 }),
      portraitVariant: 4,
    },
    {
      id: "noble-mary",
      nameVi: "Nữ Vương Mary Stuart",
      points: 3,
      requirement: makeCost({ white: 3, blue: 3, green: 3 }),
      portraitVariant: 5,
    },
    {
      id: "noble-henry",
      nameVi: "Vua Henry VIII",
      points: 3,
      requirement: makeCost({ blue: 3, green: 3, red: 3 }),
      portraitVariant: 6,
    },
    {
      id: "noble-catherine",
      nameVi: "Hoàng Hậu Catherine",
      points: 3,
      requirement: makeCost({ green: 3, red: 3, black: 3 }),
      portraitVariant: 7,
    },
    {
      id: "noble-borgia",
      nameVi: "Công Tước Borgia",
      points: 3,
      requirement: makeCost({ red: 3, black: 3, white: 3 }),
      portraitVariant: 8,
    },
    {
      id: "noble-anne",
      nameVi: "Nữ Công Tước Anne",
      points: 3,
      requirement: makeCost({ black: 3, white: 3, blue: 3 }),
      portraitVariant: 9,
    },
  ];
}

function shuffleArray<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function nextEffectSeq(state: SplendorMatchState): number {
  return (state.lastVisualEffect?.seq ?? 0) + 1;
}

function findEligibleNobles(
  seat: SplendorSeatState,
  nobles: SplendorNobleTile[]
): SplendorNobleTile[] {
  return nobles.filter((n) =>
    SPLENDOR_GEMS.every((g) => seat.bonuses[g] >= n.requirement[g])
  );
}

/**
 * Resolves end-of-turn checks:
 * 1) Token limit (> 10 tokens -> DiscardTokensStep)
 * 2) Noble visits (1 eligible -> automatic visit; 2+ eligible -> NoblePickStep)
 * 3) 15-point Final Round trigger & completion + tie-breaker (fewest purchased cards)
 */
function finalizeTurnOrPrompt(
  state: SplendorMatchState,
  nowMs: number,
  events: MatchEventRecord[],
  skipTokenCheck = false
): CartridgeTransitionResult<SplendorMatchState> {
  const activeSeat = state.seats.find((s) => s.seatNo === state.activeSeatNo)!;

  // 1. Strict 10-Token Limit Check
  if (!skipTokenCheck && countTokens(activeSeat.tokens) > 10) {
    const excess = countTokens(activeSeat.tokens) - 10;
    const deadline = nowMs + state.config.timers.discardSeconds * 1000;
    return {
      state: {
        ...state,
        step: "DiscardTokensStep",
        phaseDeadlineMs: deadline,
      },
      events: [
        ...events,
        {
          eventType: "TOKENS_OVER_LIMIT",
          message: `${activeSeat.displayName} đang cầm ${countTokens(activeSeat.tokens)} xu (tối đa 10 xu) — cần trả lại ${excess} xu thừa.`,
          visibleToSeatNos: "all",
        },
      ],
      phaseDeadlineMs: deadline,
    };
  }

  // 2. Noble Visit Check (only once per turn)
  if (state.step !== "NoblePickStep") {
    const eligible = findEligibleNobles(activeSeat, state.nobles);
    if (eligible.length === 1) {
      const noble = eligible[0];
      const updatedSeats = state.seats.map((s) =>
        s.seatNo === activeSeat.seatNo
          ? {
              ...s,
              nobles: [...s.nobles, noble],
              points: s.points + noble.points,
            }
          : s
      );
      const remainingNobles = state.nobles.filter((n) => n.id !== noble.id);
      const nextState: SplendorMatchState = {
        ...state,
        seats: updatedSeats,
        nobles: remainingNobles,
        eligibleNobleIds: [],
        lastVisualEffect: {
          seq: nextEffectSeq(state),
          kind: "NOBLE_VISIT",
          seatNo: activeSeat.seatNo,
          nobleId: noble.id,
        },
      };
      return advanceToNextSeatOrFinish(nextState, nowMs, [
        ...events,
        {
          eventType: "NOBLE_VISITED",
          message: `👑 ${noble.nameVi} (+${noble.points} điểm Uy Tín) đã ghé thăm xưởng đá quý của ${activeSeat.displayName}!`,
          visibleToSeatNos: "all",
        },
      ]);
    } else if (eligible.length > 1) {
      const deadline = nowMs + state.config.timers.noblePickSeconds * 1000;
      return {
        state: {
          ...state,
          step: "NoblePickStep",
          eligibleNobleIds: eligible.map((n) => n.id),
          phaseDeadlineMs: deadline,
        },
        events: [
          ...events,
          {
            eventType: "NOBLE_CHOICE_REQUIRED",
            message: `👑 ${activeSeat.displayName} đủ điều kiện mời ${eligible.length} Quý Tộc! Vui lòng chọn 1 Quý Tộc ghé thăm.`,
            visibleToSeatNos: "all",
          },
        ],
        phaseDeadlineMs: deadline,
      };
    }
  }

  return advanceToNextSeatOrFinish(state, nowMs, events);
}

function advanceToNextSeatOrFinish(
  state: SplendorMatchState,
  nowMs: number,
  priorEvents: MatchEventRecord[]
): CartridgeTransitionResult<SplendorMatchState> {
  const events = [...priorEvents];
  const activeSeat = state.seats.find((s) => s.seatNo === state.activeSeatNo)!;

  let finalRoundTriggered = state.finalRoundTriggered;
  let finalRoundTriggerSeatNo = state.finalRoundTriggerSeatNo;

  if (!finalRoundTriggered && activeSeat.points >= state.config.targetPoints) {
    finalRoundTriggered = true;
    finalRoundTriggerSeatNo = activeSeat.seatNo;
    events.push({
      eventType: "FINAL_ROUND_TRIGGERED",
      message: `🔔 ${activeSeat.displayName} đã chạm mốc ${activeSeat.points} điểm Uy Tín! Hoàn tất nốt vòng cuối để phân định ngôi vị!`,
      visibleToSeatNos: "all",
    });
  }

  const sortedNos = state.seats.map((s) => s.seatNo).sort((a, b) => a - b);
  const curIdx = sortedNos.indexOf(state.activeSeatNo);
  const isEndOfRound = curIdx === sortedNos.length - 1;

  if (finalRoundTriggered && isEndOfRound) {
    // Official Splendor Victory & Tiebreaker:
    // 1) Highest Prestige Points
    // 2) Fewest Purchased Development Cards
    const maxPoints = Math.max(...state.seats.map((s) => s.points));
    const topByPoints = state.seats.filter((s) => s.points === maxPoints);
    const minCards = Math.min(
      ...topByPoints.map((s) => s.purchasedCards.length)
    );
    const winners = topByPoints.filter(
      (s) => s.purchasedCards.length === minCards
    );
    const winnerNames = winners.map((w) => w.displayName).join(" & ");
    const winReasonVi =
      winners.length === 1
        ? `🏆 ${winnerNames} giành chiến thắng Splendor với ${maxPoints} điểm Uy Tín (${minCards} thẻ Phát Triển)!`
        : `🏆 Đồng chiến thắng: ${winnerNames} cùng đạt ${maxPoints} điểm Uy Tín và ${minCards} thẻ Phát Triển!`;

    const finishedState: SplendorMatchState = {
      ...state,
      finalRoundTriggered,
      finalRoundTriggerSeatNo,
      step: "Finished",
      phaseDeadlineMs: null,
      eligibleNobleIds: [],
      winnerSeatNos: winners.map((w) => w.seatNo),
      winReasonVi,
    };

    events.push({
      eventType: "MATCH_FINISHED",
      message: winReasonVi,
      visibleToSeatNos: "all",
    });

    return {
      state: finishedState,
      events,
      phaseDeadlineMs: null,
    };
  }

  const nextSeatNo = sortedNos[(curIdx + 1) % sortedNos.length];
  const nextRound = isEndOfRound ? state.roundNumber + 1 : state.roundNumber;
  const deadline = nowMs + state.config.timers.turnActionSeconds * 1000;
  const nextSeat = state.seats.find((s) => s.seatNo === nextSeatNo)!;

  const nextState: SplendorMatchState = {
    ...state,
    roundNumber: nextRound,
    turnNumber: state.turnNumber + 1,
    activeSeatNo: nextSeatNo,
    step: "TurnActionStep",
    phaseDeadlineMs: deadline,
    finalRoundTriggered,
    finalRoundTriggerSeatNo,
    eligibleNobleIds: [],
  };

  events.push({
    eventType: "TURN_STARTED",
    message: `Vòng ${nextRound} • Lượt của ${nextSeat.displayName}.`,
    visibleToSeatNos: "all",
  });

  return {
    state: nextState,
    events,
    phaseDeadlineMs: deadline,
  };
}

export const splendorCartridge: GameCartridge<
  SplendorConfig,
  SplendorMatchState,
  SplendorCommand,
  SplendorPlayerView
> = {
  cartridgeId: "splendor",
  title: "Splendor: Thương Nhân Đá Quý",
  subtitle: "Xây dựng động cơ • Thu thập đá quý • 2–4 người chơi",
  description:
    "Hóa thân thành thương nhân thời Phục Hưng, thu thập đá quý, đầu tư mỏ quặng và chinh phục các Quý Tộc để chạm mốc 15 điểm Uy Tín.",
  minSeats: 2,
  maxSeats: 4,
  available: true,

  defaultConfig(_seatCount: number): SplendorConfig {
    return {
      targetPoints: 15,
      timers: {
        turnActionSeconds: 45,
        discardSeconds: 20,
        noblePickSeconds: 20,
      },
    };
  },

  validateConfig(config: SplendorConfig, seatCount: number) {
    if (seatCount < this.minSeats || seatCount > this.maxSeats) {
      return {
        valid: false,
        error: `Splendor yêu cầu từ ${this.minSeats} đến ${this.maxSeats} người chơi (hiện có ${seatCount}).`,
      };
    }
    if (config.targetPoints < 10 || config.targetPoints > 30) {
      return {
        valid: false,
        error: "Điểm mục tiêu Splendor phải từ 10 đến 30 điểm.",
      };
    }
    return { valid: true };
  },

  createInitialState({ config, seats, nowMs, rng = Math.random }) {
    const validation = this.validateConfig(config, seats.length);
    if (!validation.valid) {
      throw new Error(validation.error ?? "Invalid Splendor config");
    }

    const gemPerColor =
      seats.length === 2 ? 4 : seats.length === 3 ? 5 : 7;
    const supply: TokenBag = {
      white: gemPerColor,
      blue: gemPerColor,
      green: gemPerColor,
      red: gemPerColor,
      black: gemPerColor,
      gold: 5,
    };

    const rawDecks = buildOfficialSplendorDecks();
    const deck1 = shuffleArray(rawDecks[1], rng);
    const deck2 = shuffleArray(rawDecks[2], rng);
    const deck3 = shuffleArray(rawDecks[3], rng);

    const market: Record<SplendorCardTier, (SplendorDevCard | null)[]> = {
      1: [
        deck1.shift() ?? null,
        deck1.shift() ?? null,
        deck1.shift() ?? null,
        deck1.shift() ?? null,
      ],
      2: [
        deck2.shift() ?? null,
        deck2.shift() ?? null,
        deck2.shift() ?? null,
        deck2.shift() ?? null,
      ],
      3: [
        deck3.shift() ?? null,
        deck3.shift() ?? null,
        deck3.shift() ?? null,
        deck3.shift() ?? null,
      ],
    };

    const shuffledNobles = shuffleArray(buildOfficialSplendorNobles(), rng);
    const nobles = shuffledNobles.slice(0, seats.length + 1);

    const sortedSeats = [...seats].sort((a, b) => a.seatNo - b.seatNo);
    const matchSeats: SplendorSeatState[] = sortedSeats.map((s) => ({
      seatNo: s.seatNo,
      actorId: s.actorId,
      displayName: s.displayName,
      avatarSeed: s.avatarSeed,
      tokens: emptyTokenBag(),
      bonuses: emptyGemCost(),
      purchasedCards: [],
      reservedCards: [],
      nobles: [],
      points: 0,
    }));

    const firstSeatNo = matchSeats[0].seatNo;
    const deadline = nowMs + config.timers.turnActionSeconds * 1000;

    const state: SplendorMatchState = {
      config,
      roundNumber: 1,
      turnNumber: 1,
      firstSeatNo,
      activeSeatNo: firstSeatNo,
      step: "TurnActionStep",
      phaseDeadlineMs: deadline,
      finalRoundTriggered: false,
      finalRoundTriggerSeatNo: null,
      supply,
      decks: { 1: deck1, 2: deck2, 3: deck3 },
      market,
      nobles,
      eligibleNobleIds: [],
      seats: matchSeats,
      lastVisualEffect: null,
      winnerSeatNos: [],
      winReasonVi: null,
    };

    return {
      state,
      events: [
        {
          eventType: "MATCH_STARTED",
          message: `💎 Ván đấu Splendor bắt đầu (${matchSeats.length} người chơi, ${gemPerColor} xu/màu, ${nobles.length} Quý Tộc, mục tiêu ${config.targetPoints} điểm)! Lượt đầu thuộc về ${matchSeats[0].displayName}.`,
          visibleToSeatNos: "all",
        },
      ],
      phaseDeadlineMs: deadline,
    };
  },

  reduce({ state, command, actorSeatNo, nowMs }) {
    if (state.step === "Finished") {
      throw new Error("Ván đấu Splendor đã kết thúc.");
    }
    if (actorSeatNo !== state.activeSeatNo) {
      throw new Error("Chưa đến lượt đi của bạn.");
    }

    const actor = state.seats.find((s) => s.seatNo === actorSeatNo);
    if (!actor) {
      throw new Error("Không tìm thấy chỗ ngồi của bạn trong ván đấu.");
    }

    // 1. DiscardTokensStep (Player holds > 10 tokens)
    if (state.step === "DiscardTokensStep") {
      if (command.type !== "DISCARD_TOKENS") {
        throw new Error(
          "Bạn đang cầm quá 10 xu. Vui lòng chọn xu thừa để trả về kho."
        );
      }
      const excess = countTokens(actor.tokens) - 10;
      let discardTotal = 0;
      const newSeatTokens = { ...actor.tokens };
      const newSupply = { ...state.supply };

      for (const col of SPLENDOR_TOKEN_COLORS) {
        const qty = Math.floor(command.tokens[col] ?? 0);
        if (qty < 0) throw new Error("Số lượng xu trả lại không hợp lệ.");
        if (qty > newSeatTokens[col]) {
          throw new Error(
            `Bạn không đủ xu ${SPLENDOR_GEM_META[col].nameVi} để trả lại.`
          );
        }
        newSeatTokens[col] -= qty;
        newSupply[col] += qty;
        discardTotal += qty;
      }

      if (discardTotal !== excess) {
        throw new Error(
          `Vui lòng trả lại đúng ${excess} xu để còn lại tối đa 10 xu.`
        );
      }

      const updatedSeats = state.seats.map((s) =>
        s.seatNo === actorSeatNo ? { ...s, tokens: newSeatTokens } : s
      );

      const nextState: SplendorMatchState = {
        ...state,
        seats: updatedSeats,
        supply: newSupply,
        lastVisualEffect: {
          seq: nextEffectSeq(state),
          kind: "DISCARD_GEMS",
          seatNo: actorSeatNo,
          gems: command.tokens,
        },
      };

      return finalizeTurnOrPrompt(
        nextState,
        nowMs,
        [
          {
            eventType: "TOKENS_DISCARDED",
            message: `${actor.displayName} đã trả lại ${discardTotal} xu thừa về kho.`,
            visibleToSeatNos: "all",
          },
        ],
        true
      );
    }

    // 2. NoblePickStep (Player qualified for 2+ Nobles simultaneously)
    if (state.step === "NoblePickStep") {
      if (command.type !== "PICK_NOBLE") {
        throw new Error("Vui lòng chọn 1 thẻ Quý Tộc để ghé thăm.");
      }
      if (!state.eligibleNobleIds.includes(command.nobleId)) {
        throw new Error("Thẻ Quý Tộc bạn chọn không hợp lệ.");
      }
      const noble = state.nobles.find((n) => n.id === command.nobleId);
      if (!noble) {
        throw new Error("Thẻ Quý Tộc này không còn trên bàn.");
      }

      const updatedSeats = state.seats.map((s) =>
        s.seatNo === actorSeatNo
          ? {
              ...s,
              nobles: [...s.nobles, noble],
              points: s.points + noble.points,
            }
          : s
      );
      const remainingNobles = state.nobles.filter((n) => n.id !== noble.id);
      const nextState: SplendorMatchState = {
        ...state,
        seats: updatedSeats,
        nobles: remainingNobles,
        eligibleNobleIds: [],
        lastVisualEffect: {
          seq: nextEffectSeq(state),
          kind: "NOBLE_VISIT",
          seatNo: actorSeatNo,
          nobleId: noble.id,
        },
      };

      return advanceToNextSeatOrFinish(nextState, nowMs, [
        {
          eventType: "NOBLE_VISITED",
          message: `👑 ${noble.nameVi} (+${noble.points} điểm Uy Tín) đã ghé thăm ${actor.displayName}!`,
          visibleToSeatNos: "all",
        },
      ]);
    }

    // 3. TurnActionStep: Choose 1 of the 4 official Splendor actions
    if (state.step !== "TurnActionStep") {
      throw new Error("Không thể thực hiện hành động này ở bước hiện tại.");
    }

    if (command.type === "TAKE_GEMS") {
      const gems = command.gems;
      if (gems.length === 0 || gems.length > 3) {
        throw new Error("Bạn chỉ có thể lấy 3 xu khác màu hoặc 2 xu cùng màu.");
      }

      // Check: 2 of the same color (requires >= 4 in supply)
      if (gems.length === 2 && gems[0] === gems[1]) {
        const col = gems[0];
        if (state.supply[col] < 4) {
          throw new Error(
            `Chỉ được lấy 2 xu ${SPLENDOR_GEM_META[col].nameVi} cùng màu khi kho còn từ 4 xu trở lên (hiện còn ${state.supply[col]}).`
          );
        }
        const newSupply = { ...state.supply, [col]: state.supply[col] - 2 };
        const newSeatTokens = {
          ...actor.tokens,
          [col]: actor.tokens[col] + 2,
        };
        const updatedSeats = state.seats.map((s) =>
          s.seatNo === actorSeatNo ? { ...s, tokens: newSeatTokens } : s
        );

        return finalizeTurnOrPrompt(
          {
            ...state,
            supply: newSupply,
            seats: updatedSeats,
            lastVisualEffect: {
              seq: nextEffectSeq(state),
              kind: "TAKE_GEMS",
              seatNo: actorSeatNo,
              gems: { [col]: 2 },
            },
          },
          nowMs,
          [
            {
              eventType: "GEMS_TAKEN",
              message: `💎 ${actor.displayName} lấy 2 xu ${SPLENDOR_GEM_META[col].nameVi}.`,
              visibleToSeatNos: "all",
            },
          ]
        );
      }

      // Otherwise: distinct colors (up to 3; fewer than 3 allowed only if fewer than 3 colors exist in supply)
      const uniqueGems = Array.from(new Set(gems));
      if (uniqueGems.length !== gems.length) {
        throw new Error("Khi lấy 3 xu, các viên đá quý phải khác màu nhau.");
      }
      const availableColorsCount = SPLENDOR_GEMS.filter(
        (g) => state.supply[g] > 0
      ).length;
      const expectedTake = Math.min(3, availableColorsCount);
      if (availableColorsCount === 0) {
        throw new Error("Kho đá quý trên bàn đã hết.");
      }
      if (uniqueGems.length !== expectedTake) {
        throw new Error(
          `Vui lòng chọn đúng ${expectedTake} màu đá quý khác nhau.`
        );
      }

      const newSupply = { ...state.supply };
      const newSeatTokens = { ...actor.tokens };
      const takenBag: Partial<TokenBag> = {};
      for (const col of uniqueGems) {
        if (newSupply[col] < 1) {
          throw new Error(`Kho đã hết xu ${SPLENDOR_GEM_META[col].nameVi}.`);
        }
        newSupply[col] -= 1;
        newSeatTokens[col] += 1;
        takenBag[col] = 1;
      }

      const updatedSeats = state.seats.map((s) =>
        s.seatNo === actorSeatNo ? { ...s, tokens: newSeatTokens } : s
      );
      const gemNames = uniqueGems
        .map((g) => SPLENDOR_GEM_META[g].nameVi)
        .join(", ");

      return finalizeTurnOrPrompt(
        {
          ...state,
          supply: newSupply,
          seats: updatedSeats,
          lastVisualEffect: {
            seq: nextEffectSeq(state),
            kind: "TAKE_GEMS",
            seatNo: actorSeatNo,
            gems: takenBag,
          },
        },
        nowMs,
        [
          {
            eventType: "GEMS_TAKEN",
            message: `💎 ${actor.displayName} lấy ${uniqueGems.length} xu khác màu: ${gemNames}.`,
            visibleToSeatNos: "all",
          },
        ]
      );
    }

    if (command.type === "RESERVE_MARKET") {
      if (actor.reservedCards.length >= 3) {
        throw new Error("Bạn chỉ được đặt cọc tối đa 3 thẻ bài cùng lúc.");
      }
      const row = state.market[command.tier];
      const card = row?.[command.slotIndex];
      if (!card) {
        throw new Error("Ô thẻ bài này đang trống.");
      }

      const deckCopy = [...state.decks[command.tier]];
      const replacement = deckCopy.shift() ?? null;
      const newRow = row.map((c, idx) =>
        idx === command.slotIndex ? replacement : c
      );

      const gotGold = state.supply.gold > 0 ? 1 : 0;
      const newSupply = {
        ...state.supply,
        gold: state.supply.gold - gotGold,
      };
      const updatedSeats = state.seats.map((s) =>
        s.seatNo === actorSeatNo
          ? {
              ...s,
              tokens: { ...s.tokens, gold: s.tokens.gold + gotGold },
              reservedCards: [...s.reservedCards, { card, fromDeck: false }],
            }
          : s
      );

      return finalizeTurnOrPrompt(
        {
          ...state,
          supply: newSupply,
          decks: { ...state.decks, [command.tier]: deckCopy },
          market: { ...state.market, [command.tier]: newRow },
          seats: updatedSeats,
          lastVisualEffect: {
            seq: nextEffectSeq(state),
            kind: "RESERVE_CARD",
            seatNo: actorSeatNo,
            tier: command.tier,
            slotIndex: command.slotIndex,
            cardBonus: card.bonus,
            gems: gotGold ? { gold: 1 } : undefined,
          },
        },
        nowMs,
        [
          {
            eventType: "CARD_RESERVED",
            message: `🔒 ${actor.displayName} đặt cọc 1 thẻ Cấp ${command.tier} (${SPLENDOR_GEM_META[card.bonus].nameVi}, ${card.points}đ)${gotGold ? " và nhận 1 xu Vàng Joker" : ""}.`,
            visibleToSeatNos: "all",
          },
        ]
      );
    }

    if (command.type === "RESERVE_DECK") {
      if (actor.reservedCards.length >= 3) {
        throw new Error("Bạn chỉ được đặt cọc tối đa 3 thẻ bài cùng lúc.");
      }
      const deckCopy = [...state.decks[command.tier]];
      const card = deckCopy.shift();
      if (!card) {
        throw new Error(`Chồng bài Cấp ${command.tier} đã hết.`);
      }

      const gotGold = state.supply.gold > 0 ? 1 : 0;
      const newSupply = {
        ...state.supply,
        gold: state.supply.gold - gotGold,
      };
      const updatedSeats = state.seats.map((s) =>
        s.seatNo === actorSeatNo
          ? {
              ...s,
              tokens: { ...s.tokens, gold: s.tokens.gold + gotGold },
              reservedCards: [...s.reservedCards, { card, fromDeck: true }],
            }
          : s
      );

      return finalizeTurnOrPrompt(
        {
          ...state,
          supply: newSupply,
          decks: { ...state.decks, [command.tier]: deckCopy },
          seats: updatedSeats,
          lastVisualEffect: {
            seq: nextEffectSeq(state),
            kind: "RESERVE_CARD",
            seatNo: actorSeatNo,
            tier: command.tier,
            gems: gotGold ? { gold: 1 } : undefined,
          },
        },
        nowMs,
        [
          {
            eventType: "CARD_RESERVED_BLIND",
            message: `🔒 ${actor.displayName} rút úp đặt cọc 1 thẻ từ chồng Cấp ${command.tier}${gotGold ? " và nhận 1 xu Vàng Joker" : ""}.`,
            visibleToSeatNos: "all",
          },
        ]
      );
    }

    if (command.type === "BUY_MARKET") {
      const row = state.market[command.tier];
      const card = row?.[command.slotIndex];
      if (!card) {
        throw new Error("Ô thẻ bài này đang trống.");
      }

      const check = computeCardPayment(actor, card);
      if (!check.affordable) {
        throw new Error("Bạn chưa đủ đá quý và điểm thưởng để mua thẻ này.");
      }

      const newSupply = { ...state.supply };
      const newSeatTokens = { ...actor.tokens };
      for (const col of SPLENDOR_TOKEN_COLORS) {
        newSeatTokens[col] -= check.payment[col];
        newSupply[col] += check.payment[col];
      }

      const deckCopy = [...state.decks[command.tier]];
      const replacement = deckCopy.shift() ?? null;
      const newRow = row.map((c, idx) =>
        idx === command.slotIndex ? replacement : c
      );

      const updatedSeats = state.seats.map((s) =>
        s.seatNo === actorSeatNo
          ? {
              ...s,
              tokens: newSeatTokens,
              bonuses: {
                ...s.bonuses,
                [card.bonus]: s.bonuses[card.bonus] + 1,
              },
              purchasedCards: [...s.purchasedCards, card],
              points: s.points + card.points,
            }
          : s
      );

      return finalizeTurnOrPrompt(
        {
          ...state,
          supply: newSupply,
          decks: { ...state.decks, [command.tier]: deckCopy },
          market: { ...state.market, [command.tier]: newRow },
          seats: updatedSeats,
          lastVisualEffect: {
            seq: nextEffectSeq(state),
            kind: "BUY_CARD",
            seatNo: actorSeatNo,
            tier: command.tier,
            slotIndex: command.slotIndex,
            cardBonus: card.bonus,
            gems: check.payment,
          },
        },
        nowMs,
        [
          {
            eventType: "CARD_PURCHASED",
            message: `✨ ${actor.displayName} mua thẻ Cấp ${command.tier} (+1 ${SPLENDOR_GEM_META[card.bonus].nameVi}${card.points > 0 ? `, +${card.points} điểm Uy Tín` : ""})!`,
            visibleToSeatNos: "all",
          },
        ]
      );
    }

    if (command.type === "BUY_RESERVED") {
      const slot = actor.reservedCards[command.reservedIndex];
      if (!slot) {
        throw new Error("Không tìm thấy thẻ đặt cọc này.");
      }
      const card = slot.card;
      const check = computeCardPayment(actor, card);
      if (!check.affordable) {
        throw new Error(
          "Bạn chưa đủ đá quý và điểm thưởng để mua thẻ đặt cọc này."
        );
      }

      const newSupply = { ...state.supply };
      const newSeatTokens = { ...actor.tokens };
      for (const col of SPLENDOR_TOKEN_COLORS) {
        newSeatTokens[col] -= check.payment[col];
        newSupply[col] += check.payment[col];
      }

      const remainingReserved = actor.reservedCards.filter(
        (_, i) => i !== command.reservedIndex
      );
      const updatedSeats = state.seats.map((s) =>
        s.seatNo === actorSeatNo
          ? {
              ...s,
              tokens: newSeatTokens,
              bonuses: {
                ...s.bonuses,
                [card.bonus]: s.bonuses[card.bonus] + 1,
              },
              purchasedCards: [...s.purchasedCards, card],
              reservedCards: remainingReserved,
              points: s.points + card.points,
            }
          : s
      );

      return finalizeTurnOrPrompt(
        {
          ...state,
          supply: newSupply,
          seats: updatedSeats,
          lastVisualEffect: {
            seq: nextEffectSeq(state),
            kind: "BUY_CARD",
            seatNo: actorSeatNo,
            tier: card.tier,
            cardBonus: card.bonus,
            gems: check.payment,
          },
        },
        nowMs,
        [
          {
            eventType: "RESERVED_CARD_PURCHASED",
            message: `✨ ${actor.displayName} mua thẻ đã đặt cọc (+1 ${SPLENDOR_GEM_META[card.bonus].nameVi}${card.points > 0 ? `, +${card.points} điểm Uy Tín` : ""})!`,
            visibleToSeatNos: "all",
          },
        ]
      );
    }

    throw new Error("Lệnh không hợp lệ.");
  },

  onPhaseTimeout({ state, nowMs }) {
    if (state.step === "Finished") {
      return { state, events: [], phaseDeadlineMs: null };
    }

    const active = state.seats.find((s) => s.seatNo === state.activeSeatNo)!;

    if (state.step === "DiscardTokensStep") {
      let toDrop = countTokens(active.tokens) - 10;
      const tokensToReturn: Partial<TokenBag> = {};
      for (const col of SPLENDOR_TOKEN_COLORS) {
        if (toDrop <= 0) break;
        const drop = Math.min(active.tokens[col], toDrop);
        if (drop > 0) {
          tokensToReturn[col] = drop;
          toDrop -= drop;
        }
      }
      return this.reduce({
        state,
        actorSeatNo: active.seatNo,
        command: { type: "DISCARD_TOKENS", tokens: tokensToReturn },
        nowMs,
      });
    }

    if (state.step === "NoblePickStep") {
      const nobleId = state.eligibleNobleIds[0] ?? state.nobles[0]?.id;
      if (nobleId) {
        return this.reduce({
          state,
          actorSeatNo: active.seatNo,
          command: { type: "PICK_NOBLE", nobleId },
          nowMs,
        });
      }
    }

    // TurnActionStep timeout -> take available gems or reserve
    const avail = SPLENDOR_GEMS.filter((g) => state.supply[g] > 0);
    if (avail.length > 0) {
      return this.reduce({
        state,
        actorSeatNo: active.seatNo,
        command: { type: "TAKE_GEMS", gems: avail.slice(0, 3) },
        nowMs,
      });
    }

    return advanceToNextSeatOrFinish(state, nowMs, [
      {
        eventType: "PHASE_TIMEOUT",
        message: `Hết giờ! ${active.displayName} bỏ qua lượt.`,
        visibleToSeatNos: "all",
      },
    ]);
  },

  autoActBots({ current, botSeatNos, nowMs }) {
    const botSet = new Set(botSeatNos);
    if (botSet.size === 0) return current;

    let state = current.state;
    const events = [...current.events];
    let phaseDeadlineMs = current.phaseDeadlineMs;

    for (let guard = 0; guard < 12; guard++) {
      if (state.step === "Finished") break;
      if (!botSet.has(state.activeSeatNo)) break;

      const bot = state.seats.find((s) => s.seatNo === state.activeSeatNo)!;
      let cmd: SplendorCommand | null = null;

      if (state.step === "DiscardTokensStep") {
        let excess = countTokens(bot.tokens) - 10;
        const ret: Partial<TokenBag> = {};
        // Drop gems with highest counts first (keep gold last)
        const order = [...SPLENDOR_GEMS].sort(
          (a, b) => bot.tokens[b] - bot.tokens[a]
        );
        for (const col of [...order, "gold" as const]) {
          if (excess <= 0) break;
          const drop = Math.min(bot.tokens[col], excess);
          if (drop > 0) {
            ret[col] = drop;
            excess -= drop;
          }
        }
        cmd = { type: "DISCARD_TOKENS", tokens: ret };
      } else if (state.step === "NoblePickStep") {
        cmd = { type: "PICK_NOBLE", nobleId: state.eligibleNobleIds[0] };
      } else if (state.step === "TurnActionStep") {
        // 1. Check if Bot can buy a reserved card (highest points first)
        let bestReservedIdx = -1;
        let bestReservedPts = -1;
        bot.reservedCards.forEach((slot, idx) => {
          if (
            computeCardPayment(bot, slot.card).affordable &&
            slot.card.points > bestReservedPts
          ) {
            bestReservedPts = slot.card.points;
            bestReservedIdx = idx;
          }
        });

        // 2. Check if Bot can buy a market card (highest points, then highest tier)
        let bestMarket: {
          tier: SplendorCardTier;
          slotIndex: number;
          points: number;
        } | null = null;
        for (const tier of [3, 2, 1] as SplendorCardTier[]) {
          state.market[tier].forEach((card, slotIndex) => {
            if (!card) return;
            if (!computeCardPayment(bot, card).affordable) return;
            if (
              !bestMarket ||
              card.points > bestMarket.points ||
              (card.points === bestMarket.points && tier > bestMarket.tier)
            ) {
              bestMarket = { tier, slotIndex, points: card.points };
            }
          });
        }

        if (
          bestReservedIdx !== -1 &&
          (!bestMarket || bestReservedPts >= (bestMarket as { points: number }).points)
        ) {
          cmd = { type: "BUY_RESERVED", reservedIndex: bestReservedIdx };
        } else if (bestMarket) {
          const bm = bestMarket as {
            tier: SplendorCardTier;
            slotIndex: number;
          };
          cmd = {
            type: "BUY_MARKET",
            tier: bm.tier,
            slotIndex: bm.slotIndex,
          };
        } else {
          // 3. Pick gems strategically toward the cheapest Tier 1/2 card
          const allVisible: SplendorDevCard[] = [
            ...state.market[1].filter((c): c is SplendorDevCard => Boolean(c)),
            ...state.market[2].filter((c): c is SplendorDevCard => Boolean(c)),
          ];
          const neededScores: Record<SplendorGemColor, number> = {
            white: 0,
            blue: 0,
            green: 0,
            red: 0,
            black: 0,
          };
          for (const card of allVisible) {
            for (const g of SPLENDOR_GEMS) {
              const deficit = Math.max(
                0,
                card.cost[g] - bot.bonuses[g] - bot.tokens[g]
              );
              if (deficit > 0) neededScores[g] += deficit;
            }
          }

          const avail = SPLENDOR_GEMS.filter((g) => state.supply[g] > 0).sort(
            (a, b) => neededScores[b] - neededScores[a]
          );

          if (avail.length >= 3 && countTokens(bot.tokens) <= 8) {
            cmd = { type: "TAKE_GEMS", gems: avail.slice(0, 3) };
          } else {
            const doubleCand = avail.find((g) => state.supply[g] >= 4);
            if (doubleCand && countTokens(bot.tokens) <= 8) {
              cmd = { type: "TAKE_GEMS", gems: [doubleCand, doubleCand] };
            } else if (avail.length > 0) {
              cmd = {
                type: "TAKE_GEMS",
                gems: avail.slice(0, Math.min(3, avail.length)),
              };
            } else if (bot.reservedCards.length < 3) {
              // Reserve an available market card if gems are empty
              for (const tier of [2, 1, 3] as SplendorCardTier[]) {
                const idx = state.market[tier].findIndex((c) => c !== null);
                if (idx !== -1) {
                  cmd = { type: "RESERVE_MARKET", tier, slotIndex: idx };
                  break;
                }
              }
            }
          }
        }
      }

      if (!cmd) break;

      const res = this.reduce({
        state,
        actorSeatNo: bot.seatNo,
        command: cmd,
        nowMs,
      });
      state = res.state;
      events.push(...res.events);
      phaseDeadlineMs = res.phaseDeadlineMs;
    }

    return { state, events, phaseDeadlineMs };
  },

  projectView({ state, viewerSeatNo }): SplendorPlayerView {
    const isFinished = state.step === "Finished";

    const seats: SplendorProjectedSeat[] = state.seats.map((s) => ({
      seatNo: s.seatNo,
      actorId: s.actorId,
      displayName: s.displayName,
      avatarSeed: s.avatarSeed,
      tokens: s.tokens,
      totalTokens: countTokens(s.tokens),
      bonuses: s.bonuses,
      purchasedCount: s.purchasedCards.length,
      reservedCards: s.reservedCards.map((r) => ({
        fromDeck: r.fromDeck,
        tier: r.card.tier,
        // Cards reserved face-up from the market are public; blind deck reserves are hidden from opponents until bought/finished
        card:
          !r.fromDeck || isFinished || s.seatNo === viewerSeatNo
            ? r.card
            : null,
      })),
      nobles: s.nobles,
      points: s.points,
    }));

    return {
      cartridgeId: "splendor",
      roundNumber: state.roundNumber,
      turnNumber: state.turnNumber,
      activeSeatNo: state.activeSeatNo,
      step: state.step,
      phaseDeadlineMs: state.phaseDeadlineMs,
      viewerSeatNo,
      finalRoundTriggered: state.finalRoundTriggered,
      targetPoints: state.config.targetPoints,
      supply: state.supply,
      deckCounts: {
        1: state.decks[1].length,
        2: state.decks[2].length,
        3: state.decks[3].length,
      },
      market: state.market,
      nobles: state.nobles,
      eligibleNobleIds:
        state.activeSeatNo === viewerSeatNo ? state.eligibleNobleIds : [],
      seats,
      lastVisualEffect: state.lastVisualEffect,
      winnerSeatNos: state.winnerSeatNos,
      winReasonVi: state.winReasonVi,
      config: state.config,
    };
  },

  resolveChannels(): ChannelPermission[] {
    return [
      {
        channelId: "village",
        label: "Hội Thương Nhân (Công khai)",
        canRead: true,
        canWrite: true,
      },
    ];
  },

  isMatchOver(state) {
    return state.step === "Finished";
  },

  getWinningFaction(state) {
    if (state.winnerSeatNos.length === 0) return null;
    return state.winnerSeatNos
      .map(
        (no) =>
          state.seats.find((s) => s.seatNo === no)?.displayName ?? `Seat #${no}`
      )
      .join(" & ");
  },
};
