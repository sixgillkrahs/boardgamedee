import type {
  CartridgeTransitionResult,
  ChannelPermission,
  GameCartridge,
  MatchEventRecord,
} from "@/cartridges/types";
import {
  SPLENDOR_GEM_META,
  SPLENDOR_GEMS,
  type SplendorCardTier,
  type SplendorGemColor,
} from "@/cartridges/splendor";

export type DuelTokenColor = SplendorGemColor | "pearl" | "gold";
export type DuelCardBonus = SplendorGemColor | "wild" | null;
export type DuelCardPower =
  | "EXTRA_TURN"
  | "PRIVILEGE"
  | "STEAL"
  | "TAKE_MATCHING"
  | null;

export const DUEL_TOKEN_COLORS: readonly DuelTokenColor[] = [
  "white",
  "blue",
  "green",
  "red",
  "black",
  "pearl",
  "gold",
];

export const DUEL_TOKEN_META: Record<
  DuelTokenColor,
  {
    nameVi: string;
    shortVi: string;
    hex: string;
    highlightHex: string;
    darkHex: string;
    textHex: string;
  }
> = {
  ...SPLENDOR_GEM_META,
  pearl: {
    nameVi: "Ngọc Trai (Pearl)",
    shortVi: "Ngọc trai",
    hex: "#f472b6",
    highlightHex: "#fdf2f8",
    darkHex: "#9d174d",
    textHex: "#1c1917",
  },
};

export type DuelCostMap = Record<SplendorGemColor | "pearl", number>;
export type DuelTokenBag = Record<DuelTokenColor, number>;
export type DuelColorCounts = Record<SplendorGemColor, number>;

export interface DuelJewelCard {
  id: string;
  tier: SplendorCardTier;
  bonus: DuelCardBonus;
  bonusCount: number; // 1 or 2 (or 0 if bonus is null)
  points: number;
  crowns: number;
  cost: DuelCostMap;
  power: DuelCardPower;
}

export interface DuelRoyalCard {
  id: string;
  nameVi: string;
  points: number;
  power: DuelCardPower;
  portraitVariant: number;
}

export interface DuelConfig {
  timers: {
    turnActionSeconds: number;
    subStepSeconds: number;
  };
}

export type DuelStep =
  | "TurnActionStep"
  | "WildColorPickStep"
  | "TakeMatchingStep"
  | "StealTokenStep"
  | "DiscardTokensStep"
  | "RoyalPickStep"
  | "Finished";

export interface DuelSeatState {
  seatNo: number;
  actorId: string;
  displayName: string;
  avatarSeed?: string;
  tokens: DuelTokenBag;
  bonuses: DuelColorCounts;
  colorPoints: DuelColorCounts;
  points: number;
  crowns: number;
  privileges: number;
  purchasedCards: DuelJewelCard[];
  reservedCards: { card: DuelJewelCard; fromDeck: boolean }[];
  royals: DuelRoyalCard[];
  claimedRoyalThresholds: number[]; // tracks 3 and 6
}

export interface DuelVisualEffect {
  seq: number;
  kind:
    | "TAKE_LINE"
    | "SPEND_PRIVILEGE"
    | "REPLENISH_BOARD"
    | "BUY_CARD"
    | "RESERVE_CARD"
    | "STEAL_TOKEN"
    | "CLAIM_ROYAL"
    | "EXTRA_TURN";
  seatNo: number;
  cells?: [number, number][];
  tokens?: Partial<DuelTokenBag>;
  bannerVi?: string;
}

export interface DuelMatchState {
  config: DuelConfig;
  turnNumber: number;
  activeSeatNo: number;
  step: DuelStep;
  phaseDeadlineMs: number | null;
  usedOptionalReplenish: boolean;
  extraTurnQueued: boolean;
  pendingPowerQueue: {
    power: Exclude<DuelCardPower, null>;
    matchColor?: SplendorGemColor;
  }[];
  pendingWildCard: { points: number; bonusCount: number } | null;

  /** 5x5 board stored as 25 cells (row * 5 + col) */
  board: (DuelTokenColor | null)[];
  bag: DuelTokenColor[];
  privilegeSupply: number;

  decks: Record<SplendorCardTier, DuelJewelCard[]>;
  /** Pyramid rows: Tier 3 = 3 slots, Tier 2 = 4 slots, Tier 1 = 5 slots */
  pyramid: Record<SplendorCardTier, (DuelJewelCard | null)[]>;
  royals: DuelRoyalCard[];

  seats: DuelSeatState[];
  lastVisualEffect: DuelVisualEffect | null;
  winnerSeatNo: number | null;
  winReasonVi: string | null;
}

export type DuelCommand =
  | { type: "USE_PRIVILEGE"; row: number; col: number }
  | { type: "REPLENISH_BOARD" }
  | { type: "TAKE_LINE"; cells: [number, number][] }
  | {
      type: "RESERVE_PYRAMID";
      tier: SplendorCardTier;
      slotIndex: number;
      goldCell: [number, number];
    }
  | { type: "RESERVE_DECK"; tier: SplendorCardTier; goldCell: [number, number] }
  | { type: "BUY_PYRAMID"; tier: SplendorCardTier; slotIndex: number }
  | { type: "BUY_RESERVED"; reservedIndex: number }
  | { type: "PICK_WILD_COLOR"; color: SplendorGemColor }
  | { type: "TAKE_MATCHING_CELL"; row: number; col: number }
  | { type: "SKIP_TAKE_MATCHING" }
  | { type: "STEAL_TOKEN"; color: SplendorGemColor | "pearl" }
  | { type: "DISCARD_TOKENS"; tokens: Partial<DuelTokenBag> }
  | { type: "PICK_ROYAL"; royalId: string };

export interface DuelProjectedReservedCard {
  card: DuelJewelCard | null;
  fromDeck: boolean;
  tier: SplendorCardTier;
}

export interface DuelProjectedSeat {
  seatNo: number;
  actorId: string;
  displayName: string;
  avatarSeed?: string;
  tokens: DuelTokenBag;
  totalTokens: number;
  bonuses: DuelColorCounts;
  colorPoints: DuelColorCounts;
  maxSingleColorPoints: number;
  points: number;
  crowns: number;
  privileges: number;
  purchasedCount: number;
  reservedCards: DuelProjectedReservedCard[];
  royals: DuelRoyalCard[];
}

export interface DuelPlayerView {
  cartridgeId: "splendor-duel";
  turnNumber: number;
  activeSeatNo: number;
  step: DuelStep;
  phaseDeadlineMs: number | null;
  viewerSeatNo: number | null;
  extraTurnQueued: boolean;
  pendingMatchColor: SplendorGemColor | null;

  board: (DuelTokenColor | null)[];
  bagCount: number;
  privilegeSupply: number;
  deckCounts: Record<SplendorCardTier, number>;
  pyramid: Record<SplendorCardTier, (DuelJewelCard | null)[]>;
  royals: DuelRoyalCard[];
  seats: DuelProjectedSeat[];

  lastVisualEffect: DuelVisualEffect | null;
  winnerSeatNo: number | null;
  winReasonVi: string | null;
  config: DuelConfig;
}

/**
 * Official 5x5 outward spiral order starting from the center cell (2,2).
 */
export const DUEL_SPIRAL_ORDER: readonly [number, number][] = [
  [2, 2],
  [2, 3],
  [3, 3],
  [3, 2],
  [3, 1],
  [2, 1],
  [1, 1],
  [1, 2],
  [1, 3],
  [1, 4],
  [2, 4],
  [3, 4],
  [4, 4],
  [4, 3],
  [4, 2],
  [4, 1],
  [4, 0],
  [3, 0],
  [2, 0],
  [1, 0],
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
];

export function emptyDuelTokenBag(): DuelTokenBag {
  return { white: 0, blue: 0, green: 0, red: 0, black: 0, pearl: 0, gold: 0 };
}

export function emptyDuelColorCounts(): DuelColorCounts {
  return { white: 0, blue: 0, green: 0, red: 0, black: 0 };
}

export function countDuelTokens(bag: DuelTokenBag): number {
  return (
    bag.white +
    bag.blue +
    bag.green +
    bag.red +
    bag.black +
    bag.pearl +
    bag.gold
  );
}

export function boardIdx(row: number, col: number): number {
  return row * 5 + col;
}

/**
 * Validates whether 1..3 cells on the 5x5 board form a valid straight, uninterrupted
 * orthogonal or diagonal line of non-empty, non-gold tokens.
 */
export function validateDuelLineSelection(
  board: (DuelTokenColor | null)[],
  cells: [number, number][]
): { valid: boolean; error?: string; tokens: DuelTokenColor[] } {
  if (cells.length < 1 || cells.length > 3) {
    return {
      valid: false,
      error: "Bạn chỉ có thể lấy từ 1 đến 3 viên đá quý thẳng hàng trên bàn 5×5.",
      tokens: [],
    };
  }

  const seen = new Set<string>();
  const tokens: DuelTokenColor[] = [];
  for (const [r, c] of cells) {
    if (r < 0 || r > 4 || c < 0 || c > 4) {
      return { valid: false, error: "Tọa độ ô không hợp lệ.", tokens: [] };
    }
    const key = `${r},${c}`;
    if (seen.has(key)) {
      return { valid: false, error: "Không thể chọn trùng ô.", tokens: [] };
    }
    seen.add(key);

    const tok = board[boardIdx(r, c)];
    if (!tok) {
      return { valid: false, error: "Ô bạn chọn đang trống.", tokens: [] };
    }
    if (tok === "gold") {
      return {
        valid: false,
        error: "Không thể lấy xu Vàng khi lấy đá quý — Vàng chỉ lấy khi Đặt cọc thẻ!",
        tokens: [],
      };
    }
    tokens.push(tok);
  }

  if (cells.length === 1) {
    return { valid: true, tokens };
  }

  // Sort cells lexicographically (row asc, then col asc) to check unit step (dr, dc)
  const sorted = [...cells].sort((a, b) =>
    a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]
  );
  const dr = sorted[1][0] - sorted[0][0];
  const dc = sorted[1][1] - sorted[0][1];

  // Must be directly adjacent horizontally, vertically, or diagonally
  if (Math.abs(dr) > 1 || Math.abs(dc) > 1 || (dr === 0 && dc === 0)) {
    return {
      valid: false,
      error: "Các viên đá quý phải nằm liền kề nhau trên cùng 1 hàng ngang, dọc hoặc chéo (không có ô trống ở giữa).",
      tokens: [],
    };
  }

  if (sorted.length === 3) {
    const dr2 = sorted[2][0] - sorted[1][0];
    const dc2 = sorted[2][1] - sorted[1][1];
    if (dr2 !== dr || dc2 !== dc) {
      return {
        valid: false,
        error: "3 viên đá quý phải tạo thành 1 đường thẳng liên tục (ngang, dọc hoặc chéo).",
        tokens: [],
      };
    }
  }

  return { valid: true, tokens };
}

/**
 * Checks if a player can afford a Jewel Card (using bonuses + gems/pearls + gold jokers).
 */
export function computeDuelCardPayment(
  seat: Pick<DuelSeatState, "tokens" | "bonuses">,
  card: DuelJewelCard
): { affordable: boolean; payment: DuelTokenBag; goldNeeded: number } {
  const payment = emptyDuelTokenBag();
  let goldNeeded = 0;

  for (const gem of SPLENDOR_GEMS) {
    const netCost = Math.max(0, card.cost[gem] - seat.bonuses[gem]);
    const payFromGem = Math.min(seat.tokens[gem], netCost);
    payment[gem] = payFromGem;
    goldNeeded += netCost - payFromGem;
  }

  // Pearl cost has no permanent discount (pearls cannot be card bonuses)
  const pearlNeed = card.cost.pearl;
  const payFromPearl = Math.min(seat.tokens.pearl, pearlNeed);
  payment.pearl = payFromPearl;
  goldNeeded += pearlNeed - payFromPearl;

  if (goldNeeded > seat.tokens.gold) {
    return { affordable: false, payment: emptyDuelTokenBag(), goldNeeded };
  }

  payment.gold = goldNeeded;
  return { affordable: true, payment, goldNeeded };
}

function makeDuelCost(
  pairs: Partial<Record<SplendorGemColor | "pearl", number>>
): DuelCostMap {
  return {
    white: pairs.white ?? 0,
    blue: pairs.blue ?? 0,
    green: pairs.green ?? 0,
    red: pairs.red ?? 0,
    black: pairs.black ?? 0,
    pearl: pairs.pearl ?? 0,
  };
}

/**
 * Builds the 67 official Splendor Duel Jewel Cards (30 Tier 1, 24 Tier 2, 13 Tier 3)
 * with authentic Crowns, Pearl costs, Double-Gem bonuses, Wild-Color cards, and Special Powers.
 */
export function buildOfficialDuelDecks(): Record<
  SplendorCardTier,
  DuelJewelCard[]
> {
  const tier1: DuelJewelCard[] = [];
  const tier2: DuelJewelCard[] = [];
  const tier3: DuelJewelCard[] = [];

  SPLENDOR_GEMS.forEach((bonus, i) => {
    const c0 = SPLENDOR_GEMS[i];
    const c1 = SPLENDOR_GEMS[(i + 1) % 5];
    const c2 = SPLENDOR_GEMS[(i + 2) % 5];
    const c3 = SPLENDOR_GEMS[(i + 3) % 5];
    const c4 = SPLENDOR_GEMS[(i + 4) % 5];

    // 5 colored Tier 1 cards per color (25) + 5 special/wild Tier 1 = 30 Tier 1 cards
    const t1Specs: Omit<DuelJewelCard, "id" | "tier">[] = [
      {
        bonus,
        bonusCount: 1,
        points: 0,
        crowns: 0,
        cost: makeDuelCost({ [c1]: 3 }),
        power: null,
      },
      {
        bonus,
        bonusCount: 1,
        points: 0,
        crowns: 0,
        cost: makeDuelCost({ [c1]: 2, [c2]: 2 }),
        power: "TAKE_MATCHING",
      },
      {
        bonus,
        bonusCount: 1,
        points: 0,
        crowns: 1,
        cost: makeDuelCost({ [c2]: 2, [c3]: 1, pearl: 1 }),
        power: null,
      },
      {
        bonus,
        bonusCount: 1,
        points: 1,
        crowns: 0,
        cost: makeDuelCost({ [c1]: 1, [c2]: 1, [c3]: 1, [c4]: 1 }),
        power: "PRIVILEGE",
      },
      {
        bonus,
        bonusCount: 1,
        points: 1,
        crowns: 0,
        cost: makeDuelCost({ [c3]: 3, [c4]: 2 }),
        power: null,
      },
    ];
    t1Specs.forEach((spec, idx) => {
      tier1.push({ id: `dt1-${bonus}-${idx}`, tier: 1, ...spec });
    });

    // 4 colored Tier 2 cards per color (20) + 4 wild/power Tier 2 = 24 Tier 2 cards
    const t2Specs: Omit<DuelJewelCard, "id" | "tier">[] = [
      {
        bonus,
        bonusCount: 2,
        points: 1,
        crowns: 0,
        cost: makeDuelCost({ [c1]: 4, [c2]: 2, pearl: 1 }),
        power: null,
      },
      {
        bonus,
        bonusCount: 1,
        points: 2,
        crowns: 1,
        cost: makeDuelCost({ [c2]: 4, [c3]: 3 }),
        power: "PRIVILEGE",
      },
      {
        bonus,
        bonusCount: 1,
        points: 2,
        crowns: 1,
        cost: makeDuelCost({ [c0]: 2, [c1]: 3, [c4]: 2 }),
        power: "STEAL",
      },
      {
        bonus,
        bonusCount: 1,
        points: 3,
        crowns: 0,
        cost: makeDuelCost({ [c3]: 5, pearl: 1 }),
        power: "EXTRA_TURN",
      },
    ];
    t2Specs.forEach((spec, idx) => {
      tier2.push({ id: `dt2-${bonus}-${idx}`, tier: 2, ...spec });
    });

    // 2 colored Tier 3 cards per color (10) + 3 special Tier 3 = 13 Tier 3 cards
    const t3Specs: Omit<DuelJewelCard, "id" | "tier">[] = [
      {
        bonus,
        bonusCount: 1,
        points: 4,
        crowns: 2,
        cost: makeDuelCost({ [c1]: 3, [c2]: 3, [c3]: 5, pearl: 1 }),
        power: "STEAL",
      },
      {
        bonus,
        bonusCount: 1,
        points: 5,
        crowns: 2,
        cost: makeDuelCost({ [c0]: 3, [c4]: 6, pearl: 1 }),
        power: "EXTRA_TURN",
      },
    ];
    t3Specs.forEach((spec, idx) => {
      tier3.push({ id: `dt3-${bonus}-${idx}`, tier: 3, ...spec });
    });
  });

  // 5 Extra Tier 1 Special / Wild / Crown cards -> 30 total
  tier1.push(
    {
      id: "dt1-wild-0",
      tier: 1,
      bonus: "wild",
      bonusCount: 1,
      points: 0,
      crowns: 1,
      cost: makeDuelCost({ white: 2, blue: 2, pearl: 1 }),
      power: null,
    },
    {
      id: "dt1-wild-1",
      tier: 1,
      bonus: "wild",
      bonusCount: 1,
      points: 1,
      crowns: 0,
      cost: makeDuelCost({ green: 2, red: 2, pearl: 1 }),
      power: "PRIVILEGE",
    },
    {
      id: "dt1-pure-0",
      tier: 1,
      bonus: null,
      bonusCount: 0,
      points: 3,
      crowns: 0,
      cost: makeDuelCost({ black: 4, white: 1 }),
      power: null,
    },
    {
      id: "dt1-extra-0",
      tier: 1,
      bonus: "blue",
      bonusCount: 1,
      points: 0,
      crowns: 0,
      cost: makeDuelCost({ red: 2, black: 2, green: 1 }),
      power: "EXTRA_TURN",
    },
    {
      id: "dt1-steal-0",
      tier: 1,
      bonus: "red",
      bonusCount: 1,
      points: 0,
      crowns: 1,
      cost: makeDuelCost({ white: 2, green: 2, blue: 1 }),
      power: "STEAL",
    }
  );

  // 4 Extra Tier 2 Wild / High-Crown cards -> 24 total
  tier2.push(
    {
      id: "dt2-wild-0",
      tier: 2,
      bonus: "wild",
      bonusCount: 1,
      points: 2,
      crowns: 1,
      cost: makeDuelCost({ white: 3, black: 3, pearl: 1 }),
      power: "TAKE_MATCHING",
    },
    {
      id: "dt2-wild-1",
      tier: 2,
      bonus: "wild",
      bonusCount: 1,
      points: 2,
      crowns: 2,
      cost: makeDuelCost({ blue: 3, green: 3, pearl: 1 }),
      power: null,
    },
    {
      id: "dt2-crown-0",
      tier: 2,
      bonus: null,
      bonusCount: 0,
      points: 4,
      crowns: 2,
      cost: makeDuelCost({ red: 4, black: 3, pearl: 1 }),
      power: null,
    },
    {
      id: "dt2-extra-0",
      tier: 2,
      bonus: "green",
      bonusCount: 1,
      points: 2,
      crowns: 1,
      cost: makeDuelCost({ white: 3, blue: 3, red: 2 }),
      power: "EXTRA_TURN",
    }
  );

  // 3 Extra Tier 3 Grand Masterwork cards -> 13 total
  tier3.push(
    {
      id: "dt3-wild-0",
      tier: 3,
      bonus: "wild",
      bonusCount: 1,
      points: 4,
      crowns: 3,
      cost: makeDuelCost({ white: 4, blue: 4, green: 3, pearl: 1 }),
      power: "EXTRA_TURN",
    },
    {
      id: "dt3-crown-0",
      tier: 3,
      bonus: null,
      bonusCount: 0,
      points: 6,
      crowns: 3,
      cost: makeDuelCost({ red: 5, black: 5, pearl: 2 }),
      power: null,
    },
    {
      id: "dt3-priv-0",
      tier: 3,
      bonus: "wild",
      bonusCount: 1,
      points: 5,
      crowns: 2,
      cost: makeDuelCost({ green: 4, red: 4, black: 4 }),
      power: "PRIVILEGE",
    }
  );

  return { 1: tier1, 2: tier2, 3: tier3 };
}

/**
 * Builds the 4 official Splendor Duel Royal Cards (claimed at 3 and 6 Crowns).
 */
export function buildOfficialDuelRoyals(): DuelRoyalCard[] {
  return [
    {
      id: "royal-queen",
      nameVi: "Nữ Hoàng Tối Cao",
      points: 3,
      power: null,
      portraitVariant: 0,
    },
    {
      id: "royal-emperor",
      nameVi: "Hoàng Đế Đặc Quyền",
      points: 2,
      power: "PRIVILEGE",
      portraitVariant: 1,
    },
    {
      id: "royal-duke",
      nameVi: "Công Tước Thời Gian",
      points: 2,
      power: "EXTRA_TURN",
      portraitVariant: 2,
    },
    {
      id: "royal-countess",
      nameVi: "Nữ Bá Tước Đạo Chích",
      points: 2,
      power: "STEAL",
      portraitVariant: 3,
    },
  ];
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function nextFxSeq(state: DuelMatchState): number {
  return (state.lastVisualEffect?.seq ?? 0) + 1;
}

function getOpponentSeatNo(state: DuelMatchState, seatNo: number): number {
  const opp = state.seats.find((s) => s.seatNo !== seatNo);
  return opp ? opp.seatNo : seatNo;
}

/**
 * Awards 1 Privilege Scroll to `recipientSeatNo` (taking from supply first,
 * or stealing from the opponent if supply is empty — max 3 total across the game).
 */
function grantPrivilegeScroll(
  state: DuelMatchState,
  recipientSeatNo: number
): { state: DuelMatchState; granted: boolean } {
  const recipient = state.seats.find((s) => s.seatNo === recipientSeatNo);
  if (!recipient || recipient.privileges >= 3) {
    return { state, granted: false };
  }

  if (state.privilegeSupply > 0) {
    return {
      granted: true,
      state: {
        ...state,
        privilegeSupply: state.privilegeSupply - 1,
        seats: state.seats.map((s) =>
          s.seatNo === recipientSeatNo
            ? { ...s, privileges: s.privileges + 1 }
            : s
        ),
      },
    };
  }

  // Steal 1 privilege scroll from opponent if supply is 0
  const oppNo = getOpponentSeatNo(state, recipientSeatNo);
  const opp = state.seats.find((s) => s.seatNo === oppNo);
  if (opp && opp.privileges > 0) {
    return {
      granted: true,
      state: {
        ...state,
        seats: state.seats.map((s) => {
          if (s.seatNo === recipientSeatNo) {
            return { ...s, privileges: s.privileges + 1 };
          }
          if (s.seatNo === oppNo) {
            return { ...s, privileges: s.privileges - 1 };
          }
          return s;
        }),
      },
    };
  }

  return { state, granted: false };
}

/**
 * Refills empty cells on the 5x5 board from the shuffled bag following `DUEL_SPIRAL_ORDER`.
 */
function replenishBoardSpiral(
  board: (DuelTokenColor | null)[],
  bag: DuelTokenColor[],
  rng: () => number = Math.random
): { board: (DuelTokenColor | null)[]; bag: DuelTokenColor[]; placed: number } {
  const shuffledBag = shuffle(bag, rng);
  const nextBoard = [...board];
  let placed = 0;

  for (const [r, c] of DUEL_SPIRAL_ORDER) {
    if (shuffledBag.length === 0) break;
    const idx = boardIdx(r, c);
    if (nextBoard[idx] === null) {
      nextBoard[idx] = shuffledBag.shift()!;
      placed++;
    }
  }

  return { board: nextBoard, bag: shuffledBag, placed };
}

/**
 * Checks the 3 official immediate Victory Conditions of Splendor Duel:
 * 1) >= 20 Prestige Points total
 * 2) >= 10 Crowns total
 * 3) >= 10 Prestige Points in any single gem color
 */
function checkDuelImmediateVictory(
  seat: DuelSeatState
): { won: boolean; reasonVi: string | null } {
  if (seat.points >= 20) {
    return {
      won: true,
      reasonVi: `🏆 ${seat.displayName} chiến thắng Splendor Duel ngay lập tức khi đạt ${seat.points}/20 điểm Uy Tín!`,
    };
  }
  if (seat.crowns >= 10) {
    return {
      won: true,
      reasonVi: `👑 ${seat.displayName} chiến thắng Splendor Duel ngay lập tức khi thu thập đủ ${seat.crowns}/10 Vương Miện!`,
    };
  }
  for (const gem of SPLENDOR_GEMS) {
    if (seat.colorPoints[gem] >= 10) {
      return {
        won: true,
        reasonVi: `💎 ${seat.displayName} chiến thắng Splendor Duel ngay lập tức với ${seat.colorPoints[gem]}/10 điểm đơn sắc ${SPLENDOR_GEM_META[gem].nameVi}!`,
      };
    }
  }
  return { won: false, reasonVi: null };
}

/**
 * Advances through any queued card/royal sub-steps:
 * 1) WildColorPickStep
 * 2) Pending powers (EXTRA_TURN, PRIVILEGE, TAKE_MATCHING, STEAL)
 * 3) DiscardTokensStep (> 10 tokens)
 * 4) RoyalPickStep (crossed 3 or 6 Crowns)
 * 5) Immediate 3-way Victory Check
 * 6) Extra Turn OR Switch Active Player
 */
function continueResolutionPipeline(
  initialState: DuelMatchState,
  nowMs: number,
  priorEvents: MatchEventRecord[]
): CartridgeTransitionResult<DuelMatchState> {
  let state = { ...initialState };
  const events = [...priorEvents];
  const subDeadline = nowMs + state.config.timers.subStepSeconds * 1000;

  // 1. Wild color attachment step
  if (state.pendingWildCard) {
    return {
      state: {
        ...state,
        step: "WildColorPickStep",
        phaseDeadlineMs: subDeadline,
      },
      events,
      phaseDeadlineMs: subDeadline,
    };
  }

  // 2. Process queued immediate powers
  while (state.pendingPowerQueue.length > 0) {
    const [head, ...rest] = state.pendingPowerQueue;
    state = { ...state, pendingPowerQueue: rest };
    const active = state.seats.find((s) => s.seatNo === state.activeSeatNo)!;

    if (head.power === "EXTRA_TURN") {
      state = { ...state, extraTurnQueued: true };
      events.push({
        eventType: "POWER_EXTRA_TURN",
        message: `🔄 Quyền năng kích hoạt: ${active.displayName} được nhận THÊM 1 LƯỢT ĐI ngay sau lượt này!`,
        visibleToSeatNos: "all",
      });
      continue;
    }

    if (head.power === "PRIVILEGE") {
      const granted = grantPrivilegeScroll(state, active.seatNo);
      state = granted.state;
      if (granted.granted) {
        events.push({
          eventType: "POWER_PRIVILEGE",
          message: `📜 Quyền năng kích hoạt: ${active.displayName} nhận thêm 1 Cuộn Đặc Quyền!`,
          visibleToSeatNos: "all",
        });
      }
      continue;
    }

    if (head.power === "TAKE_MATCHING" && head.matchColor) {
      const hasOnBoard = state.board.some((c) => c === head.matchColor);
      if (hasOnBoard) {
        return {
          state: {
            ...state,
            step: "TakeMatchingStep",
            pendingPowerQueue: [head, ...rest], // keep color context at index 0
            phaseDeadlineMs: subDeadline,
          },
          events: [
            ...events,
            {
              eventType: "POWER_TAKE_MATCHING",
              message: `➕ ${active.displayName} được lấy miễn phí 1 viên ${SPLENDOR_GEM_META[head.matchColor].nameVi} trên bàn 5×5!`,
              visibleToSeatNos: "all",
            },
          ],
          phaseDeadlineMs: subDeadline,
        };
      }
      continue;
    }

    if (head.power === "STEAL") {
      const oppNo = getOpponentSeatNo(state, active.seatNo);
      const opp = state.seats.find((s) => s.seatNo === oppNo)!;
      const stealableColors = (
        [...SPLENDOR_GEMS, "pearl"] as (SplendorGemColor | "pearl")[]
      ).filter((c) => opp.tokens[c] > 0);

      if (stealableColors.length === 1) {
        // Auto-steal the only available color
        const col = stealableColors[0];
        state = {
          ...state,
          seats: state.seats.map((s) => {
            if (s.seatNo === active.seatNo) {
              return { ...s, tokens: { ...s.tokens, [col]: s.tokens[col] + 1 } };
            }
            if (s.seatNo === oppNo) {
              return { ...s, tokens: { ...s.tokens, [col]: s.tokens[col] - 1 } };
            }
            return s;
          }),
          lastVisualEffect: {
            seq: nextFxSeq(state),
            kind: "STEAL_TOKEN",
            seatNo: active.seatNo,
            tokens: { [col]: 1 },
            bannerVi: `🎯 Cướp 1 ${DUEL_TOKEN_META[col].nameVi}!`,
          },
        };
        events.push({
          eventType: "POWER_STEAL_RESOLVED",
          message: `🎯 ${active.displayName} cướp 1 ${DUEL_TOKEN_META[col].nameVi} từ ${opp.displayName}!`,
          visibleToSeatNos: "all",
        });
        continue;
      } else if (stealableColors.length > 1) {
        return {
          state: {
            ...state,
            step: "StealTokenStep",
            phaseDeadlineMs: subDeadline,
          },
          events: [
            ...events,
            {
              eventType: "POWER_STEAL_REQUIRED",
              message: `🎯 ${active.displayName} hãy chọn 1 viên đá quý (không phải Vàng) để cướp từ ${opp.displayName}!`,
              visibleToSeatNos: "all",
            },
          ],
          phaseDeadlineMs: subDeadline,
        };
      }
      continue;
    }
  }

  // 3. Check 10-Token Limit
  const activeSeat = state.seats.find((s) => s.seatNo === state.activeSeatNo)!;
  if (countDuelTokens(activeSeat.tokens) > 10) {
    const excess = countDuelTokens(activeSeat.tokens) - 10;
    return {
      state: {
        ...state,
        step: "DiscardTokensStep",
        phaseDeadlineMs: subDeadline,
      },
      events: [
        ...events,
        {
          eventType: "TOKENS_OVER_LIMIT",
          message: `${activeSeat.displayName} đang cầm ${countDuelTokens(activeSeat.tokens)}/10 xu — cần trả lại ${excess} xu vào túi.`,
          visibleToSeatNos: "all",
        },
      ],
      phaseDeadlineMs: subDeadline,
    };
  }

  // 4. Check Royal Card Claim Thresholds (3 Crowns and 6 Crowns)
  const needsRoyal3 =
    activeSeat.crowns >= 3 && !activeSeat.claimedRoyalThresholds.includes(3);
  const needsRoyal6 =
    activeSeat.crowns >= 6 && !activeSeat.claimedRoyalThresholds.includes(6);

  if ((needsRoyal3 || needsRoyal6) && state.royals.length > 0) {
    const threshold = needsRoyal3 ? 3 : 6;
    return {
      state: {
        ...state,
        step: "RoyalPickStep",
        phaseDeadlineMs: subDeadline,
      },
      events: [
        ...events,
        {
          eventType: "ROYAL_THRESHOLD_REACHED",
          message: `👑 ${activeSeat.displayName} chạm mốc ${threshold} Vương Miện! Hãy chọn 1 Thẻ Hoàng Gia!`,
          visibleToSeatNos: "all",
        },
      ],
      phaseDeadlineMs: subDeadline,
    };
  }

  // 5. Check the 3 Immediate Victory Conditions
  const victory = checkDuelImmediateVictory(activeSeat);
  if (victory.won) {
    const finished: DuelMatchState = {
      ...state,
      step: "Finished",
      phaseDeadlineMs: null,
      winnerSeatNo: activeSeat.seatNo,
      winReasonVi: victory.reasonVi,
    };
    return {
      state: finished,
      events: [
        ...events,
        {
          eventType: "MATCH_FINISHED",
          message: victory.reasonVi ?? "Ván đấu đã kết thúc!",
          visibleToSeatNos: "all",
        },
      ],
      phaseDeadlineMs: null,
    };
  }

  // 6. Extra Turn OR Switch Active Player
  const turnDeadline = nowMs + state.config.timers.turnActionSeconds * 1000;
  if (state.extraTurnQueued) {
    const nextState: DuelMatchState = {
      ...state,
      turnNumber: state.turnNumber + 1,
      step: "TurnActionStep",
      usedOptionalReplenish: false,
      extraTurnQueued: false,
      phaseDeadlineMs: turnDeadline,
      lastVisualEffect: {
        seq: nextFxSeq(state),
        kind: "EXTRA_TURN",
        seatNo: activeSeat.seatNo,
        bannerVi: `🔄 ${activeSeat.displayName} ĐI THÊM LƯỢT!`,
      },
    };
    return {
      state: nextState,
      events: [
        ...events,
        {
          eventType: "EXTRA_TURN_STARTED",
          message: `🔄 ${activeSeat.displayName} bắt đầu lượt đi thêm!`,
          visibleToSeatNos: "all",
        },
      ],
      phaseDeadlineMs: turnDeadline,
    };
  }

  const nextSeatNo = getOpponentSeatNo(state, activeSeat.seatNo);
  const nextSeat = state.seats.find((s) => s.seatNo === nextSeatNo)!;
  const nextState: DuelMatchState = {
    ...state,
    turnNumber: state.turnNumber + 1,
    activeSeatNo: nextSeatNo,
    step: "TurnActionStep",
    usedOptionalReplenish: false,
    phaseDeadlineMs: turnDeadline,
  };

  return {
    state: nextState,
    events: [
      ...events,
      {
        eventType: "TURN_STARTED",
        message: `Lượt ${nextState.turnNumber} • Đến lượt ${nextSeat.displayName}.`,
        visibleToSeatNos: "all",
      },
    ],
    phaseDeadlineMs: turnDeadline,
  };
}

export const splendorDuelCartridge: GameCartridge<
  DuelConfig,
  DuelMatchState,
  DuelCommand,
  DuelPlayerView
> = {
  cartridgeId: "splendor-duel",
  title: "Splendor Duel",
  subtitle: "Đối kháng 1v1 • Bàn đá quý 5×5 • 2 người chơi",
  description:
    "Phiên bản đối kháng 2 người đầy kịch tính với bàn đá quý xoắn ốc 5×5, Ngọc Trai, Cuộn Đặc Quyền, Thẻ Hoàng Gia và 3 điều kiện thắng tức thì.",
  minSeats: 2,
  maxSeats: 2,
  available: true,

  defaultConfig(): DuelConfig {
    return {
      timers: {
        turnActionSeconds: 45,
        subStepSeconds: 20,
      },
    };
  },

  validateConfig(_config: DuelConfig, seatCount: number) {
    if (seatCount !== 2) {
      return {
        valid: false,
        error: `Splendor Duel là game đối kháng dành riêng cho đúng 2 người chơi (hiện có ${seatCount}).`,
      };
    }
    return { valid: true };
  },

  createInitialState({ config, seats, nowMs, rng = Math.random }) {
    const validation = this.validateConfig(config, seats.length);
    if (!validation.valid) {
      throw new Error(validation.error ?? "Invalid Splendor Duel config");
    }

    // Build all 25 tokens (4 x 5 gem colors + 2 pearls + 3 gold) and fill 5x5 board spirally
    const allTokens: DuelTokenColor[] = [
      ...SPLENDOR_GEMS.flatMap((g) => [g, g, g, g]),
      "pearl",
      "pearl",
      "gold",
      "gold",
      "gold",
    ];
    const filled = replenishBoardSpiral(Array(25).fill(null), allTokens, rng);

    // Shuffle 67 Jewel Cards into 3 decks & lay out 3/4/5 Pyramid
    const rawDecks = buildOfficialDuelDecks();
    const deck1 = shuffle(rawDecks[1], rng);
    const deck2 = shuffle(rawDecks[2], rng);
    const deck3 = shuffle(rawDecks[3], rng);

    const pyramid: Record<SplendorCardTier, (DuelJewelCard | null)[]> = {
      1: Array.from({ length: 5 }, () => deck1.shift() ?? null),
      2: Array.from({ length: 4 }, () => deck2.shift() ?? null),
      3: Array.from({ length: 3 }, () => deck3.shift() ?? null),
    };

    const sortedSeats = [...seats].sort((a, b) => a.seatNo - b.seatNo);
    const matchSeats: DuelSeatState[] = sortedSeats.map((s, idx) => ({
      seatNo: s.seatNo,
      actorId: s.actorId,
      displayName: s.displayName,
      avatarSeed: s.avatarSeed,
      tokens: emptyDuelTokenBag(),
      bonuses: emptyDuelColorCounts(),
      colorPoints: emptyDuelColorCounts(),
      points: 0,
      crowns: 0,
      // Official Rule: Player 2 starts with 1 Privilege Scroll!
      privileges: idx === 1 ? 1 : 0,
      purchasedCards: [],
      reservedCards: [],
      royals: [],
      claimedRoyalThresholds: [],
    }));

    const deadline = nowMs + config.timers.turnActionSeconds * 1000;
    const state: DuelMatchState = {
      config,
      turnNumber: 1,
      activeSeatNo: matchSeats[0].seatNo,
      step: "TurnActionStep",
      phaseDeadlineMs: deadline,
      usedOptionalReplenish: false,
      extraTurnQueued: false,
      pendingPowerQueue: [],
      pendingWildCard: null,
      board: filled.board,
      bag: filled.bag,
      privilegeSupply: 2, // 1 already given to Player 2
      decks: { 1: deck1, 2: deck2, 3: deck3 },
      pyramid,
      royals: buildOfficialDuelRoyals(),
      seats: matchSeats,
      lastVisualEffect: null,
      winnerSeatNo: null,
      winReasonVi: null,
    };

    return {
      state,
      events: [
        {
          eventType: "MATCH_STARTED",
          message: `⚔️ Trận đối kháng Splendor Duel bắt đầu! ${matchSeats[1].displayName} (đi sau) nhận sẵn 1 Cuộn Đặc Quyền. Lượt đầu thuộc về ${matchSeats[0].displayName}.`,
          visibleToSeatNos: "all",
        },
      ],
      phaseDeadlineMs: deadline,
    };
  },

  reduce({ state, command, actorSeatNo, nowMs }) {
    if (state.step === "Finished") {
      throw new Error("Trận đấu Splendor Duel đã kết thúc.");
    }
    if (actorSeatNo !== state.activeSeatNo) {
      throw new Error("Chưa đến lượt đi của bạn.");
    }

    const actor = state.seats.find((s) => s.seatNo === actorSeatNo)!;
    const oppNo = getOpponentSeatNo(state, actorSeatNo);
    const opp = state.seats.find((s) => s.seatNo === oppNo)!;

    // A. WildColorPickStep: Attach wild bonus card to 1 of the 5 standard gem colors
    if (state.step === "WildColorPickStep") {
      if (command.type !== "PICK_WILD_COLOR" || !state.pendingWildCard) {
        throw new Error("Vui lòng chọn màu đá quý để gắn thẻ Đa Sắc.");
      }
      const { points, bonusCount } = state.pendingWildCard;
      const col = command.color;
      const updatedSeats = state.seats.map((s) =>
        s.seatNo === actorSeatNo
          ? {
              ...s,
              bonuses: { ...s.bonuses, [col]: s.bonuses[col] + bonusCount },
              colorPoints: {
                ...s.colorPoints,
                [col]: s.colorPoints[col] + points,
              },
            }
          : s
      );
      return continueResolutionPipeline(
        {
          ...state,
          seats: updatedSeats,
          pendingWildCard: null,
        },
        nowMs,
        [
          {
            eventType: "WILD_COLOR_ATTACHED",
            message: `🌈 ${actor.displayName} gắn thẻ Đa Sắc vào màu ${SPLENDOR_GEM_META[col].nameVi}!`,
            visibleToSeatNos: "all",
          },
        ]
      );
    }

    // B. TakeMatchingStep: Take 1 gem of the matching color directly from the 5x5 board
    if (state.step === "TakeMatchingStep") {
      const pending = state.pendingPowerQueue[0];
      const matchColor = pending?.matchColor;
      const restQueue = state.pendingPowerQueue.slice(1);

      if (command.type === "SKIP_TAKE_MATCHING") {
        return continueResolutionPipeline(
          { ...state, pendingPowerQueue: restQueue },
          nowMs,
          []
        );
      }

      if (command.type !== "TAKE_MATCHING_CELL" || !matchColor) {
        throw new Error("Vui lòng chọn 1 viên đá quý cùng màu trên bàn 5×5.");
      }

      const idx = boardIdx(command.row, command.col);
      if (state.board[idx] !== matchColor) {
        throw new Error(
          `Ô bạn chọn phải chứa viên ${SPLENDOR_GEM_META[matchColor].nameVi}.`
        );
      }

      const nextBoard = [...state.board];
      nextBoard[idx] = null;
      const updatedSeats = state.seats.map((s) =>
        s.seatNo === actorSeatNo
          ? {
              ...s,
              tokens: {
                ...s.tokens,
                [matchColor]: s.tokens[matchColor] + 1,
              },
            }
          : s
      );

      return continueResolutionPipeline(
        {
          ...state,
          board: nextBoard,
          seats: updatedSeats,
          pendingPowerQueue: restQueue,
          lastVisualEffect: {
            seq: nextFxSeq(state),
            kind: "TAKE_LINE",
            seatNo: actorSeatNo,
            cells: [[command.row, command.col]],
            tokens: { [matchColor]: 1 },
          },
        },
        nowMs,
        [
          {
            eventType: "MATCHING_GEM_TAKEN",
            message: `➕ ${actor.displayName} lấy miễn phí 1 viên ${SPLENDOR_GEM_META[matchColor].nameVi} từ bàn 5×5!`,
            visibleToSeatNos: "all",
          },
        ]
      );
    }

    // C. StealTokenStep: Steal 1 non-gold token from opponent
    if (state.step === "StealTokenStep") {
      if (command.type !== "STEAL_TOKEN") {
        throw new Error("Vui lòng chọn 1 màu đá quý để cướp từ đối thủ.");
      }
      const col = command.color;
      if (opp.tokens[col] < 1) {
        throw new Error("Đối thủ không có viên đá quý màu này.");
      }
      const updatedSeats = state.seats.map((s) => {
        if (s.seatNo === actorSeatNo) {
          return { ...s, tokens: { ...s.tokens, [col]: s.tokens[col] + 1 } };
        }
        if (s.seatNo === oppNo) {
          return { ...s, tokens: { ...s.tokens, [col]: s.tokens[col] - 1 } };
        }
        return s;
      });
      return continueResolutionPipeline(
        {
          ...state,
          seats: updatedSeats,
          lastVisualEffect: {
            seq: nextFxSeq(state),
            kind: "STEAL_TOKEN",
            seatNo: actorSeatNo,
            tokens: { [col]: 1 },
            bannerVi: `🎯 Cướp 1 ${DUEL_TOKEN_META[col].nameVi}!`,
          },
        },
        nowMs,
        [
          {
            eventType: "POWER_STEAL_RESOLVED",
            message: `🎯 ${actor.displayName} cướp 1 ${DUEL_TOKEN_META[col].nameVi} từ ${opp.displayName}!`,
            visibleToSeatNos: "all",
          },
        ]
      );
    }

    // D. DiscardTokensStep (> 10 tokens -> return excess tokens to the bag)
    if (state.step === "DiscardTokensStep") {
      if (command.type !== "DISCARD_TOKENS") {
        throw new Error("Bạn đang cầm quá 10 xu. Hãy trả xu thừa vào túi.");
      }
      const excess = countDuelTokens(actor.tokens) - 10;
      let dropTotal = 0;
      const nextTokens = { ...actor.tokens };
      const returnedToBag: DuelTokenColor[] = [];

      for (const col of DUEL_TOKEN_COLORS) {
        const qty = Math.floor(command.tokens[col] ?? 0);
        if (qty < 0 || qty > nextTokens[col]) {
          throw new Error("Số lượng xu trả lại không hợp lệ.");
        }
        nextTokens[col] -= qty;
        dropTotal += qty;
        for (let k = 0; k < qty; k++) returnedToBag.push(col);
      }
      if (dropTotal !== excess) {
        throw new Error(`Vui lòng trả lại đúng ${excess} xu thừa vào túi.`);
      }

      const updatedSeats = state.seats.map((s) =>
        s.seatNo === actorSeatNo ? { ...s, tokens: nextTokens } : s
      );

      return continueResolutionPipeline(
        {
          ...state,
          seats: updatedSeats,
          bag: [...state.bag, ...returnedToBag],
        },
        nowMs,
        [
          {
            eventType: "TOKENS_DISCARDED",
            message: `${actor.displayName} đã trả ${dropTotal} xu thừa vào túi.`,
            visibleToSeatNos: "all",
          },
        ]
      );
    }

    // E. RoyalPickStep (Claim 1 Royal Card at 3 or 6 Crowns)
    if (state.step === "RoyalPickStep") {
      if (command.type !== "PICK_ROYAL") {
        throw new Error("Vui lòng chọn 1 Thẻ Hoàng Gia.");
      }
      const royal = state.royals.find((r) => r.id === command.royalId);
      if (!royal) {
        throw new Error("Thẻ Hoàng Gia này không còn trên bàn.");
      }
      const threshold =
        actor.crowns >= 3 && !actor.claimedRoyalThresholds.includes(3) ? 3 : 6;

      const updatedSeats = state.seats.map((s) =>
        s.seatNo === actorSeatNo
          ? {
              ...s,
              points: s.points + royal.points,
              royals: [...s.royals, royal],
              claimedRoyalThresholds: [...s.claimedRoyalThresholds, threshold],
            }
          : s
      );
      const nextQueue = royal.power
        ? [...state.pendingPowerQueue, { power: royal.power }]
        : state.pendingPowerQueue;

      return continueResolutionPipeline(
        {
          ...state,
          seats: updatedSeats,
          royals: state.royals.filter((r) => r.id !== royal.id),
          pendingPowerQueue: nextQueue,
          lastVisualEffect: {
            seq: nextFxSeq(state),
            kind: "CLAIM_ROYAL",
            seatNo: actorSeatNo,
            bannerVi: `👑 Chiêu mộ ${royal.nameVi} (+${royal.points}đ)!`,
          },
        },
        nowMs,
        [
          {
            eventType: "ROYAL_CLAIMED",
            message: `👑 ${actor.displayName} chiêu mộ ${royal.nameVi} (+${royal.points} điểm Uy Tín)!`,
            visibleToSeatNos: "all",
          },
        ]
      );
    }

    // F. TurnActionStep: Optional Actions (USE_PRIVILEGE, REPLENISH_BOARD) + Mandatory Actions
    if (state.step !== "TurnActionStep") {
      throw new Error("Không thể thực hiện hành động ở bước hiện tại.");
    }

    // Optional Action 1: Spend 1 Privilege Scroll to take 1 non-gold token anywhere on board
    if (command.type === "USE_PRIVILEGE") {
      if (actor.privileges < 1) {
        throw new Error("Bạn không có Cuộn Đặc Quyền nào để sử dụng.");
      }
      const idx = boardIdx(command.row, command.col);
      const tok = state.board[idx];
      if (!tok || tok === "gold") {
        throw new Error(
          "Cuộn Đặc Quyền chỉ được dùng để lấy 1 viên Đá quý hoặc Ngọc Trai (không được lấy Vàng)."
        );
      }

      const nextBoard = [...state.board];
      nextBoard[idx] = null;
      const updatedSeats = state.seats.map((s) =>
        s.seatNo === actorSeatNo
          ? {
              ...s,
              privileges: s.privileges - 1,
              tokens: { ...s.tokens, [tok]: s.tokens[tok] + 1 },
            }
          : s
      );

      // Stays in TurnActionStep so player still performs their mandatory action!
      return {
        state: {
          ...state,
          board: nextBoard,
          privilegeSupply: state.privilegeSupply + 1,
          seats: updatedSeats,
          lastVisualEffect: {
            seq: nextFxSeq(state),
            kind: "SPEND_PRIVILEGE",
            seatNo: actorSeatNo,
            cells: [[command.row, command.col]],
            tokens: { [tok]: 1 },
            bannerVi: `📜 Dùng Đặc Quyền lấy ${DUEL_TOKEN_META[tok].nameVi}`,
          },
        },
        events: [
          {
            eventType: "PRIVILEGE_USED",
            message: `📜 ${actor.displayName} dùng 1 Cuộn Đặc Quyền lấy ${DUEL_TOKEN_META[tok].nameVi} trên bàn 5×5.`,
            visibleToSeatNos: "all",
          },
        ],
        phaseDeadlineMs: state.phaseDeadlineMs,
      };
    }

    // Optional Action 2: Replenish the 5x5 board from bag (grants opponent 1 Privilege Scroll!)
    if (command.type === "REPLENISH_BOARD") {
      if (state.bag.length === 0) {
        throw new Error("Túi đá quý đang trống, không thể nạp thêm lên bàn.");
      }
      if (state.usedOptionalReplenish) {
        throw new Error("Bạn đã nạp bàn trong lượt này rồi.");
      }

      const filled = replenishBoardSpiral(state.board, state.bag);
      let nextState: DuelMatchState = {
        ...state,
        board: filled.board,
        bag: filled.bag,
        usedOptionalReplenish: true,
        lastVisualEffect: {
          seq: nextFxSeq(state),
          kind: "REPLENISH_BOARD",
          seatNo: actorSeatNo,
          bannerVi: `🌀 Nạp thêm ${filled.placed} viên đá quý!`,
        },
      };

      const granted = grantPrivilegeScroll(nextState, oppNo);
      nextState = granted.state;

      // Stays in TurnActionStep so player still performs their mandatory action!
      return {
        state: nextState,
        events: [
          {
            eventType: "BOARD_REPLENISHED",
            message: `🌀 ${actor.displayName} nạp ${filled.placed} viên đá quý lên bàn 5×5 theo hình xoắn ốc! ${opp.displayName} nhận 1 Cuộn Đặc Quyền.`,
            visibleToSeatNos: "all",
          },
        ],
        phaseDeadlineMs: state.phaseDeadlineMs,
      };
    }

    // Mandatory Action 1: Take 1-3 contiguous non-gold tokens in a straight line
    if (command.type === "TAKE_LINE") {
      const check = validateDuelLineSelection(state.board, command.cells);
      if (!check.valid) {
        throw new Error(check.error ?? "Đường chọn đá quý không hợp lệ.");
      }

      const nextBoard = [...state.board];
      const nextTokens = { ...actor.tokens };
      const takenBag: Partial<DuelTokenBag> = {};
      for (let i = 0; i < command.cells.length; i++) {
        const [r, c] = command.cells[i];
        const tok = check.tokens[i];
        nextBoard[boardIdx(r, c)] = null;
        nextTokens[tok] += 1;
        takenBag[tok] = (takenBag[tok] ?? 0) + 1;
      }

      const tookThreeSame =
        check.tokens.length === 3 &&
        check.tokens[0] === check.tokens[1] &&
        check.tokens[1] === check.tokens[2];
      const tookBothPearls =
        check.tokens.filter((t) => t === "pearl").length === 2;

      let nextState: DuelMatchState = {
        ...state,
        board: nextBoard,
        seats: state.seats.map((s) =>
          s.seatNo === actorSeatNo ? { ...s, tokens: nextTokens } : s
        ),
        lastVisualEffect: {
          seq: nextFxSeq(state),
          kind: "TAKE_LINE",
          seatNo: actorSeatNo,
          cells: command.cells,
          tokens: takenBag,
        },
      };

      const evs: MatchEventRecord[] = [
        {
          eventType: "LINE_TAKEN",
          message: `💎 ${actor.displayName} lấy ${check.tokens.length} viên thẳng hàng: ${check.tokens.map((t) => DUEL_TOKEN_META[t].nameVi).join(", ")}.`,
          visibleToSeatNos: "all",
        },
      ];

      if (tookThreeSame || tookBothPearls) {
        const granted = grantPrivilegeScroll(nextState, oppNo);
        nextState = granted.state;
        evs.push({
          eventType: "OPPONENT_PRIVILEGE_AWARDED",
          message: `📜 Vì ${actor.displayName} lấy ${tookBothPearls ? "cả 2 viên Ngọc Trai" : "3 viên cùng màu"}, ${opp.displayName} được nhận 1 Cuộn Đặc Quyền!`,
          visibleToSeatNos: "all",
        });
      }

      return continueResolutionPipeline(nextState, nowMs, evs);
    }

    // Mandatory Action 2a: Reserve Pyramid Card + Take 1 Gold from 5x5 board
    if (command.type === "RESERVE_PYRAMID") {
      if (actor.reservedCards.length >= 3) {
        throw new Error("Bạn chỉ được đặt cọc tối đa 3 thẻ bài.");
      }
      const [gr, gc] = command.goldCell;
      const gIdx = boardIdx(gr, gc);
      if (state.board[gIdx] !== "gold") {
        throw new Error(
          "Để Đặt cọc thẻ trong Splendor Duel, bạn phải chọn lấy 1 viên Vàng trên bàn 5×5!"
        );
      }
      const row = state.pyramid[command.tier];
      const card = row?.[command.slotIndex];
      if (!card) {
        throw new Error("Ô thẻ bài này đang trống.");
      }

      const nextBoard = [...state.board];
      nextBoard[gIdx] = null;
      const deckCopy = [...state.decks[command.tier]];
      const replacement = deckCopy.shift() ?? null;
      const nextRow = row.map((c, i) =>
        i === command.slotIndex ? replacement : c
      );

      const updatedSeats = state.seats.map((s) =>
        s.seatNo === actorSeatNo
          ? {
              ...s,
              tokens: { ...s.tokens, gold: s.tokens.gold + 1 },
              reservedCards: [...s.reservedCards, { card, fromDeck: false }],
            }
          : s
      );

      return continueResolutionPipeline(
        {
          ...state,
          board: nextBoard,
          decks: { ...state.decks, [command.tier]: deckCopy },
          pyramid: { ...state.pyramid, [command.tier]: nextRow },
          seats: updatedSeats,
          lastVisualEffect: {
            seq: nextFxSeq(state),
            kind: "RESERVE_CARD",
            seatNo: actorSeatNo,
            cells: [command.goldCell],
            tokens: { gold: 1 },
          },
        },
        nowMs,
        [
          {
            eventType: "CARD_RESERVED",
            message: `🔒 ${actor.displayName} lấy 1 viên Vàng trên bàn và đặt cọc 1 thẻ Cấp ${command.tier}.`,
            visibleToSeatNos: "all",
          },
        ]
      );
    }

    // Mandatory Action 2b: Blind Reserve Top of Tier Deck + Take 1 Gold from 5x5 board
    if (command.type === "RESERVE_DECK") {
      if (actor.reservedCards.length >= 3) {
        throw new Error("Bạn chỉ được đặt cọc tối đa 3 thẻ bài.");
      }
      const [gr, gc] = command.goldCell;
      const gIdx = boardIdx(gr, gc);
      if (state.board[gIdx] !== "gold") {
        throw new Error("Bạn phải chọn lấy 1 viên Vàng trên bàn 5×5 để đặt cọc.");
      }
      const deckCopy = [...state.decks[command.tier]];
      const card = deckCopy.shift();
      if (!card) {
        throw new Error(`Chồng bài Cấp ${command.tier} đã hết.`);
      }

      const nextBoard = [...state.board];
      nextBoard[gIdx] = null;
      const updatedSeats = state.seats.map((s) =>
        s.seatNo === actorSeatNo
          ? {
              ...s,
              tokens: { ...s.tokens, gold: s.tokens.gold + 1 },
              reservedCards: [...s.reservedCards, { card, fromDeck: true }],
            }
          : s
      );

      return continueResolutionPipeline(
        {
          ...state,
          board: nextBoard,
          decks: { ...state.decks, [command.tier]: deckCopy },
          seats: updatedSeats,
          lastVisualEffect: {
            seq: nextFxSeq(state),
            kind: "RESERVE_CARD",
            seatNo: actorSeatNo,
            cells: [command.goldCell],
            tokens: { gold: 1 },
          },
        },
        nowMs,
        [
          {
            eventType: "CARD_RESERVED_BLIND",
            message: `🔒 ${actor.displayName} lấy 1 viên Vàng và rút úp đặt cọc 1 thẻ Cấp ${command.tier}.`,
            visibleToSeatNos: "all",
          },
        ]
      );
    }

    // Mandatory Action 3: Buy Pyramid Card or Reserved Card
    if (command.type === "BUY_PYRAMID" || command.type === "BUY_RESERVED") {
      let card: DuelJewelCard | null = null;
      let nextDecks = state.decks;
      let nextPyramid = state.pyramid;
      let nextReserved = actor.reservedCards;

      if (command.type === "BUY_PYRAMID") {
        const row = state.pyramid[command.tier];
        card = row?.[command.slotIndex] ?? null;
        if (!card) throw new Error("Ô thẻ bài này đang trống.");

        const deckCopy = [...state.decks[command.tier]];
        const replacement = deckCopy.shift() ?? null;
        nextDecks = { ...state.decks, [command.tier]: deckCopy };
        nextPyramid = {
          ...state.pyramid,
          [command.tier]: row.map((c, i) =>
            i === command.slotIndex ? replacement : c
          ),
        };
      } else {
        const slot = actor.reservedCards[command.reservedIndex];
        if (!slot) throw new Error("Không tìm thấy thẻ đặt cọc.");
        card = slot.card;
        nextReserved = actor.reservedCards.filter(
          (_, i) => i !== command.reservedIndex
        );
      }

      const pay = computeDuelCardPayment(actor, card);
      if (!pay.affordable) {
        throw new Error("Bạn chưa đủ đá quý và điểm thưởng để mua thẻ này.");
      }

      const nextTokens = { ...actor.tokens };
      const paidToBag: DuelTokenColor[] = [];
      for (const col of DUEL_TOKEN_COLORS) {
        nextTokens[col] -= pay.payment[col];
        for (let k = 0; k < pay.payment[col]; k++) paidToBag.push(col);
      }

      const nextBonuses = { ...actor.bonuses };
      const nextColorPoints = { ...actor.colorPoints };
      let pendingWildCard: DuelMatchState["pendingWildCard"] = null;
      let matchColorForPower: SplendorGemColor | undefined;

      if (card.bonus === "wild") {
        pendingWildCard = { points: card.points, bonusCount: card.bonusCount };
      } else if (card.bonus !== null) {
        nextBonuses[card.bonus] += card.bonusCount;
        nextColorPoints[card.bonus] += card.points;
        matchColorForPower = card.bonus;
      }

      const updatedSeats = state.seats.map((s) =>
        s.seatNo === actorSeatNo
          ? {
              ...s,
              tokens: nextTokens,
              bonuses: nextBonuses,
              colorPoints: nextColorPoints,
              points: s.points + card!.points,
              crowns: s.crowns + card!.crowns,
              purchasedCards: [...s.purchasedCards, card!],
              reservedCards: nextReserved,
            }
          : s
      );

      const nextQueue = card.power
        ? [
            ...state.pendingPowerQueue,
            { power: card.power, matchColor: matchColorForPower },
          ]
        : state.pendingPowerQueue;

      return continueResolutionPipeline(
        {
          ...state,
          bag: [...state.bag, ...paidToBag],
          decks: nextDecks,
          pyramid: nextPyramid,
          seats: updatedSeats,
          pendingWildCard,
          pendingPowerQueue: nextQueue,
          lastVisualEffect: {
            seq: nextFxSeq(state),
            kind: "BUY_CARD",
            seatNo: actorSeatNo,
            tokens: pay.payment,
          },
        },
        nowMs,
        [
          {
            eventType: "CARD_PURCHASED",
            message: `✨ ${actor.displayName} mua thẻ Cấp ${card.tier} (+${card.points}đ${card.crowns > 0 ? `, +${card.crowns} 👑` : ""})!`,
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
    return this.autoActBots!({
      current: { state, events: [], phaseDeadlineMs: state.phaseDeadlineMs },
      botSeatNos: [state.activeSeatNo],
      nowMs,
    });
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
      const opp = state.seats.find((s) => s.seatNo !== bot.seatNo)!;
      let cmd: DuelCommand | null = null;

      if (state.step === "WildColorPickStep") {
        // Attach wild card to the color where bot currently has the highest single-color points
        const bestCol = [...SPLENDOR_GEMS].sort(
          (a, b) => bot.colorPoints[b] - bot.colorPoints[a]
        )[0];
        cmd = { type: "PICK_WILD_COLOR", color: bestCol };
      } else if (state.step === "TakeMatchingStep") {
        const matchColor = state.pendingPowerQueue[0]?.matchColor;
        const foundIdx = matchColor
          ? state.board.findIndex((c) => c === matchColor)
          : -1;
        if (foundIdx !== -1) {
          cmd = {
            type: "TAKE_MATCHING_CELL",
            row: Math.floor(foundIdx / 5),
            col: foundIdx % 5,
          };
        } else {
          cmd = { type: "SKIP_TAKE_MATCHING" };
        }
      } else if (state.step === "StealTokenStep") {
        const stealable = (
          ["pearl", ...SPLENDOR_GEMS] as (SplendorGemColor | "pearl")[]
        ).find((c) => opp.tokens[c] > 0);
        if (stealable) {
          cmd = { type: "STEAL_TOKEN", color: stealable };
        }
      } else if (state.step === "DiscardTokensStep") {
        let excess = countDuelTokens(bot.tokens) - 10;
        const ret: Partial<DuelTokenBag> = {};
        const order = [...SPLENDOR_GEMS].sort(
          (a, b) => bot.tokens[b] - bot.tokens[a]
        );
        for (const col of [...order, "pearl" as const, "gold" as const]) {
          if (excess <= 0) break;
          const drop = Math.min(bot.tokens[col], excess);
          if (drop > 0) {
            ret[col] = drop;
            excess -= drop;
          }
        }
        cmd = { type: "DISCARD_TOKENS", tokens: ret };
      } else if (state.step === "RoyalPickStep") {
        const bestRoyal = [...state.royals].sort((a, b) => b.points - a.points)[0];
        if (bestRoyal) {
          cmd = { type: "PICK_ROYAL", royalId: bestRoyal.id };
        }
      } else if (state.step === "TurnActionStep") {
        // 1. Try buying an affordable reserved or pyramid card (highest points + crowns)
        let bestBuy: DuelCommand | null = null;
        let bestScore = -1;

        bot.reservedCards.forEach((slot, rIdx) => {
          if (computeDuelCardPayment(bot, slot.card).affordable) {
            const sc = slot.card.points * 3 + slot.card.crowns * 4 + 1;
            if (sc > bestScore) {
              bestScore = sc;
              bestBuy = { type: "BUY_RESERVED", reservedIndex: rIdx };
            }
          }
        });

        for (const tier of [3, 2, 1] as SplendorCardTier[]) {
          state.pyramid[tier].forEach((card, slotIndex) => {
            if (!card || !computeDuelCardPayment(bot, card).affordable) return;
            const sc = card.points * 3 + card.crowns * 4 + tier;
            if (sc > bestScore) {
              bestScore = sc;
              bestBuy = { type: "BUY_PYRAMID", tier, slotIndex };
            }
          });
        }

        if (bestBuy) {
          cmd = bestBuy;
        } else {
          // 2. Find the best contiguous 3-cell (or 2-cell / 1-cell) line on the 5x5 board
          // Prefer lines that do NOT give opponent a free Privilege Scroll!
          let bestLine: [number, number][] | null = null;
          let bestLineScore = -999;

          const dirs: [number, number][] = [
            [0, 1],
            [1, 0],
            [1, 1],
            [1, -1],
          ];
          for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
              const t0 = state.board[boardIdx(r, c)];
              if (!t0 || t0 === "gold") continue;

              // Single cell fallback
              const s1 = t0 === "pearl" ? 5 : 2;
              if (s1 > bestLineScore) {
                bestLineScore = s1;
                bestLine = [[r, c]];
              }

              for (const [dr, dc] of dirs) {
                const line: [number, number][] = [[r, c]];
                const toks: DuelTokenColor[] = [t0];
                for (let step = 1; step <= 2; step++) {
                  const nr = r + dr * step;
                  const nc = c + dc * step;
                  if (nr < 0 || nr > 4 || nc < 0 || nc > 4) break;
                  const tk = state.board[boardIdx(nr, nc)];
                  if (!tk || tk === "gold") break;
                  line.push([nr, nc]);
                  toks.push(tk);

                  const isThreeSame =
                    toks.length === 3 &&
                    toks[0] === toks[1] &&
                    toks[1] === toks[2];
                  const isTwoPearls =
                    toks.filter((x) => x === "pearl").length === 2;
                  const penalty = isThreeSame || isTwoPearls ? -4 : 0;
                  const pearlBonus =
                    toks.filter((x) => x === "pearl").length * 3;
                  const sc = toks.length * 4 + pearlBonus + penalty;
                  if (sc > bestLineScore) {
                    bestLineScore = sc;
                    bestLine = [...line];
                  }
                }
              }
            }
          }

          if (bestLine) {
            cmd = { type: "TAKE_LINE", cells: bestLine };
          } else if (state.bag.length > 0 && !state.usedOptionalReplenish) {
            cmd = { type: "REPLENISH_BOARD" };
          } else {
            // Reserve with a Gold token on the board
            const gIdx = state.board.findIndex((t) => t === "gold");
            if (gIdx !== -1 && bot.reservedCards.length < 3) {
              const goldCell: [number, number] = [
                Math.floor(gIdx / 5),
                gIdx % 5,
              ];
              for (const tier of [2, 1, 3] as SplendorCardTier[]) {
                const slotIndex = state.pyramid[tier].findIndex(
                  (c) => c !== null
                );
                if (slotIndex !== -1) {
                  cmd = {
                    type: "RESERVE_PYRAMID",
                    tier,
                    slotIndex,
                    goldCell,
                  };
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

  projectView({ state, viewerSeatNo }): DuelPlayerView {
    const isFinished = state.step === "Finished";

    const seats: DuelProjectedSeat[] = state.seats.map((s) => ({
      seatNo: s.seatNo,
      actorId: s.actorId,
      displayName: s.displayName,
      avatarSeed: s.avatarSeed,
      tokens: s.tokens,
      totalTokens: countDuelTokens(s.tokens),
      bonuses: s.bonuses,
      colorPoints: s.colorPoints,
      maxSingleColorPoints: Math.max(...SPLENDOR_GEMS.map((g) => s.colorPoints[g])),
      points: s.points,
      crowns: s.crowns,
      privileges: s.privileges,
      purchasedCount: s.purchasedCards.length,
      reservedCards: s.reservedCards.map((r) => ({
        fromDeck: r.fromDeck,
        tier: r.card.tier,
        card:
          !r.fromDeck || isFinished || s.seatNo === viewerSeatNo
            ? r.card
            : null,
      })),
      royals: s.royals,
    }));

    return {
      cartridgeId: "splendor-duel",
      turnNumber: state.turnNumber,
      activeSeatNo: state.activeSeatNo,
      step: state.step,
      phaseDeadlineMs: state.phaseDeadlineMs,
      viewerSeatNo,
      extraTurnQueued: state.extraTurnQueued,
      pendingMatchColor:
        state.step === "TakeMatchingStep"
          ? (state.pendingPowerQueue[0]?.matchColor ?? null)
          : null,
      board: state.board,
      bagCount: state.bag.length,
      privilegeSupply: state.privilegeSupply,
      deckCounts: {
        1: state.decks[1].length,
        2: state.decks[2].length,
        3: state.decks[3].length,
      },
      pyramid: state.pyramid,
      royals: state.royals,
      seats,
      lastVisualEffect: state.lastVisualEffect,
      winnerSeatNo: state.winnerSeatNo,
      winReasonVi: state.winReasonVi,
      config: state.config,
    };
  },

  resolveChannels(): ChannelPermission[] {
    return [
      {
        channelId: "village",
        label: "Đấu Trường Đá Quý (1v1)",
        canRead: true,
        canWrite: true,
      },
    ];
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
