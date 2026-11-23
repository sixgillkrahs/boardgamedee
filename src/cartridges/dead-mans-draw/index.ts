import type {
  CartridgeTransitionResult,
  ChannelPermission,
  GameCartridge,
  MatchEventRecord,
  SeatDescriptor,
} from "@/cartridges/types";

export type DmdSuit =
  | "Anchor"
  | "Cannon"
  | "Chest"
  | "Hook"
  | "Key"
  | "Map"
  | "Mermaid"
  | "Oracle"
  | "Sword"
  | "Kraken";

export const DMD_SUITS: DmdSuit[] = [
  "Anchor",
  "Cannon",
  "Chest",
  "Hook",
  "Key",
  "Map",
  "Mermaid",
  "Oracle",
  "Sword",
  "Kraken",
];

export interface DmdSuitMeta {
  suit: DmdSuit;
  nameVi: string;
  shortVi: string;
  abilityVi: string;
  color: string;
  emoji: string;
  minVal: number;
  maxVal: number;
}

export const DMD_SUIT_META: Record<DmdSuit, DmdSuitMeta> = {
  Anchor: {
    suit: "Anchor",
    nameVi: "Mỏ Neo",
    shortVi: "Mỏ Neo",
    abilityVi: "Bảo vệ mọi lá rút TRƯỚC nó nếu bị Cháy bài (Bust).",
    color: "#38bdf8",
    emoji: "⚓",
    minVal: 2,
    maxVal: 7,
  },
  Cannon: {
    suit: "Cannon",
    nameVi: "Đại Bác",
    shortVi: "Đại Bác",
    abilityVi: "Bắn hủy lá cao nhất 1 chồng kho báu của đối thủ.",
    color: "#f97316",
    emoji: "💣",
    minVal: 2,
    maxVal: 7,
  },
  Chest: {
    suit: "Chest",
    nameVi: "Rương Báu",
    shortVi: "Rương",
    abilityVi: "Thu cùng Chìa Khóa sẽ rút thưởng thêm bài từ Mộ bài!",
    color: "#eab308",
    emoji: "🧰",
    minVal: 2,
    maxVal: 7,
  },
  Hook: {
    suit: "Hook",
    nameVi: "Móc Sắt",
    shortVi: "Móc Sắt",
    abilityVi: "Kéo lá cao nhất từ 1 chồng của mình ra Bàn & kích hoạt lại kỹ năng.",
    color: "#cbd5e1",
    emoji: "🪝",
    minVal: 2,
    maxVal: 7,
  },
  Key: {
    suit: "Key",
    nameVi: "Chìa Khóa",
    shortVi: "Chìa Khóa",
    abilityVi: "Thu cùng Rương Báu sẽ mở kho báu thưởng từ Mộ bài!",
    color: "#facc15",
    emoji: "🗝️",
    minVal: 2,
    maxVal: 7,
  },
  Map: {
    suit: "Map",
    nameVi: "Bản Đồ",
    shortVi: "Bản Đồ",
    abilityVi: "Xem 3 lá trên cùng Mộ bài, chọn 1 lá đánh ngay lên Bàn.",
    color: "#d6b370",
    emoji: "🗺️",
    minVal: 2,
    maxVal: 7,
  },
  Mermaid: {
    suit: "Mermaid",
    nameVi: "Tiên Cá",
    shortVi: "Tiên Cá",
    abilityVi: "Không kỹ năng đặc biệt, nhưng điểm số cao nhất (4–9 điểm).",
    color: "#2dd4bf",
    emoji: "🧜",
    minVal: 4,
    maxVal: 9,
  },
  Oracle: {
    suit: "Oracle",
    nameVi: "Tiên Tri",
    shortVi: "Tiên Tri",
    abilityVi: "Soi bí mật lá trên cùng Bộ bài rút trước khi quyết định.",
    color: "#c084fc",
    emoji: "🔮",
    minVal: 2,
    maxVal: 7,
  },
  Sword: {
    suit: "Sword",
    nameVi: "Kiếm Hải Tặc",
    shortVi: "Kiếm",
    abilityVi: "Cướp lá cao nhất 1 chồng kho báu đối thủ ra Bàn & kích hoạt kỹ năng.",
    color: "#60a5fa",
    emoji: "⚔️",
    minVal: 2,
    maxVal: 7,
  },
  Kraken: {
    suit: "Kraken",
    nameVi: "Kraken",
    shortVi: "Kraken",
    abilityVi: "Bắt buộc rút tiếp 2 lá từ Bộ bài rút (không thể dừng ngay)!",
    color: "#f43f5e",
    emoji: "🐙",
    minVal: 2,
    maxVal: 7,
  },
};

export interface DmdCard {
  id: string;
  suit: DmdSuit;
  value: number;
}

export type DmdStep =
  | "DrawOrBankStep"
  | "CannonTargetStep"
  | "SwordTargetStep"
  | "HookPickStep"
  | "MapPickStep"
  | "Finished";

export interface DmdConfig {
  timers: {
    turnSeconds: number;
  };
}

export interface DmdSeatState {
  seatNo: number;
  actorId: string;
  displayName: string;
  avatarSeed: string;
  /** Banked loot cards grouped by suit; each array is sorted ascending so last element is highest value */
  bank: Record<DmdSuit, DmdCard[]>;
}

export interface DmdLastAnim {
  id: number;
  kind:
    | "DRAW"
    | "BANK"
    | "BUST"
    | "CANNON"
    | "SWORD"
    | "HOOK"
    | "MAP"
    | "ORACLE"
    | "KRAKEN"
    | "CHEST_KEY";
  actorSeatNo: number;
  targetSeatNo?: number;
  card?: DmdCard;
  count?: number;
  savedCount?: number;
  bonusCount?: number;
  atMs: number;
}

export interface DmdMatchState {
  config: DmdConfig;
  turnNumber: number;
  step: DmdStep;
  activeSeatNo: number;
  seats: DmdSeatState[];
  drawPile: DmdCard[];
  discardPile: DmdCard[];
  playArea: DmdCard[];
  forcedDrawsRemaining: number;
  oraclePeekedCard: DmdCard | null;
  mapChoices: DmdCard[];
  animSeq: number;
  lastAnim: DmdLastAnim | null;
  winnerSeatNos: number[];
  winReasonVi: string | null;
  phaseDeadlineMs: number | null;
}

export type DmdCommand =
  | { type: "DRAW" }
  | { type: "BANK" }
  | { type: "CANNON_TARGET"; targetSeatNo: number; suit: DmdSuit }
  | { type: "SWORD_TARGET"; targetSeatNo: number; suit: DmdSuit }
  | { type: "HOOK_PICK"; suit: DmdSuit }
  | { type: "MAP_PICK"; cardId: string };

export interface DmdSeatView {
  seatNo: number;
  actorId: string;
  displayName: string;
  avatarSeed: string;
  bank: Record<DmdSuit, DmdCard[]>;
  score: number;
  totalBankedCards: number;
}

export interface DmdPlayerView {
  cartridgeId: "dead-mans-draw";
  turnNumber: number;
  step: DmdStep;
  activeSeatNo: number;
  viewerSeatNo: number | null;
  seats: DmdSeatView[];
  drawPileCount: number;
  discardPileCount: number;
  discardTopCard: DmdCard | null;
  playArea: DmdCard[];
  anchorProtectedCount: number;
  hasKeyAndChestInPlay: boolean;
  forcedDrawsRemaining: number;
  canBank: boolean;
  oraclePeekedCard: DmdCard | null;
  mapChoices: DmdCard[];
  lastAnim: DmdLastAnim | null;
  winnerSeatNos: number[];
  winReasonVi: string | null;
  phaseDeadlineMs: number | null;
  config: DmdConfig;
}

function createEmptyBank(): Record<DmdSuit, DmdCard[]> {
  return {
    Anchor: [],
    Cannon: [],
    Chest: [],
    Hook: [],
    Key: [],
    Map: [],
    Mermaid: [],
    Oracle: [],
    Sword: [],
    Kraken: [],
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildOfficialDmdDeck(): {
  initialDrawPile: DmdCard[];
  initialDiscardPile: DmdCard[];
} {
  const draw: DmdCard[] = [];
  const discard: DmdCard[] = [];
  for (const suit of DMD_SUITS) {
    const meta = DMD_SUIT_META[suit];
    for (let v = meta.minVal; v <= meta.maxVal; v++) {
      const card: DmdCard = {
        id: `${suit.toLowerCase()}-${v}`,
        suit,
        value: v,
      };
      // Official rule: lowest card of each suit (2, or 4 for Mermaid) starts in Discard Pile
      if (v === meta.minVal) {
        discard.push(card);
      } else {
        draw.push(card);
      }
    }
  }
  return { initialDrawPile: draw, initialDiscardPile: discard };
}

export function computeBankScore(bank: Record<DmdSuit, DmdCard[]>): number {
  let total = 0;
  for (const suit of DMD_SUITS) {
    const stack = bank[suit];
    if (stack.length > 0) {
      total += stack[stack.length - 1].value;
    }
  }
  return total;
}

export function countBankCards(bank: Record<DmdSuit, DmdCard[]>): number {
  let total = 0;
  for (const suit of DMD_SUITS) {
    total += bank[suit].length;
  }
  return total;
}

function addCardToBank(bank: Record<DmdSuit, DmdCard[]>, card: DmdCard): void {
  const stack = bank[card.suit];
  stack.push(card);
  stack.sort((a, b) => a.value - b.value);
}

function cloneState(state: DmdMatchState): DmdMatchState {
  return {
    ...state,
    seats: state.seats.map((s) => ({
      ...s,
      bank: DMD_SUITS.reduce(
        (acc, suit) => {
          acc[suit] = [...s.bank[suit]];
          return acc;
        },
        {} as Record<DmdSuit, DmdCard[]>
      ),
    })),
    drawPile: [...state.drawPile],
    discardPile: [...state.discardPile],
    playArea: [...state.playArea],
    mapChoices: [...state.mapChoices],
    winnerSeatNos: [...state.winnerSeatNos],
  };
}

function getSeat(state: DmdMatchState, seatNo: number): DmdSeatState {
  const seat = state.seats.find((s) => s.seatNo === seatNo);
  if (!seat) throw new Error("Không tìm thấy ghế người chơi.");
  return seat;
}

function getNextSeatNo(state: DmdMatchState, currentSeatNo: number): number {
  const idx = state.seats.findIndex((s) => s.seatNo === currentSeatNo);
  const nextIdx = (idx + 1) % state.seats.length;
  return state.seats[nextIdx].seatNo;
}

function hasAnyOpponentBankCards(
  state: DmdMatchState,
  actorSeatNo: number
): boolean {
  return state.seats.some(
    (s) => s.seatNo !== actorSeatNo && countBankCards(s.bank) > 0
  );
}

function makeDeadline(state: DmdMatchState, nowMs: number): number {
  return nowMs + state.config.timers.turnSeconds * 1000;
}

function setAnim(
  state: DmdMatchState,
  anim: Omit<DmdLastAnim, "id" | "atMs">,
  nowMs: number
) {
  state.animSeq += 1;
  state.lastAnim = {
    ...anim,
    id: state.animSeq,
    atMs: nowMs,
  };
}

function finalizeMatchIfDeckEmpty(
  state: DmdMatchState,
  events: MatchEventRecord[],
  nowMs: number
): boolean {
  if (state.drawPile.length > 0) return false;

  // If active player still has cards in Play Area when deck runs dry, bank them!
  if (state.playArea.length > 0) {
    bankCardsIntoSeat(state, state.activeSeatNo, state.playArea, events, nowMs);
    state.playArea = [];
  }

  state.step = "Finished";
  state.forcedDrawsRemaining = 0;
  state.oraclePeekedCard = null;
  state.mapChoices = [];
  state.phaseDeadlineMs = null;

  // Compute scores & tie-breakers (score -> total cards -> highest single card)
  const standings = state.seats.map((s) => {
    const score = computeBankScore(s.bank);
    const cardCount = countBankCards(s.bank);
    const highestCard = DMD_SUITS.reduce(
      (mx, suit) =>
        s.bank[suit].length > 0
          ? Math.max(mx, s.bank[suit][s.bank[suit].length - 1].value)
          : mx,
      0
    );
    return { seat: s, score, cardCount, highestCard };
  });

  standings.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.cardCount !== a.cardCount) return b.cardCount - a.cardCount;
    return b.highestCard - a.highestCard;
  });

  const top = standings[0];
  const winners = standings.filter(
    (st) =>
      st.score === top.score &&
      st.cardCount === top.cardCount &&
      st.highestCard === top.highestCard
  );

  state.winnerSeatNos = winners.map((w) => w.seat.seatNo);
  const winnerNames = winners.map((w) => w.seat.displayName).join(" & ");
  state.winReasonVi =
    winners.length > 1
      ? `🏆 Hòa kho báu! ${winnerNames} cùng đạt ${top.score} điểm.`
      : `🏴‍☠️ ${winnerNames} chiến thắng với kho báu ${top.score} điểm (${top.cardCount} lá)!`;

  events.push({
    eventType: "DMD_MATCH_FINISHED",
    message: state.winReasonVi,
    visibleToSeatNos: "all",
  });

  return true;
}

function advanceTurn(
  state: DmdMatchState,
  events: MatchEventRecord[],
  nowMs: number
) {
  state.playArea = [];
  state.forcedDrawsRemaining = 0;
  state.oraclePeekedCard = null;
  state.mapChoices = [];

  if (finalizeMatchIfDeckEmpty(state, events, nowMs)) {
    return;
  }

  state.activeSeatNo = getNextSeatNo(state, state.activeSeatNo);
  state.turnNumber += 1;
  state.step = "DrawOrBankStep";
  state.phaseDeadlineMs = makeDeadline(state, nowMs);
}

/**
 * Banks `cards` into `seatNo`'s vault and resolves the official Key + Chest bonus combo!
 */
function bankCardsIntoSeat(
  state: DmdMatchState,
  seatNo: number,
  cards: DmdCard[],
  events: MatchEventRecord[],
  nowMs: number
): { bonusCount: number } {
  const seat = getSeat(state, seatNo);
  const hasKey = cards.some((c) => c.suit === "Key");
  const hasChest = cards.some((c) => c.suit === "Chest");

  for (const c of cards) {
    addCardToBank(seat.bank, c);
  }

  let bonusCount = 0;
  if (hasKey && hasChest && state.discardPile.length > 0) {
    // Official rule: draw random cards from discard pile equal to number of cards banked this turn
    const want = Math.min(cards.length, state.discardPile.length);
    const bonusCards: DmdCard[] = [];
    for (let i = 0; i < want; i++) {
      const idx = Math.floor(Math.random() * state.discardPile.length);
      const [picked] = state.discardPile.splice(idx, 1);
      addCardToBank(seat.bank, picked);
      bonusCards.push(picked);
    }
    bonusCount = bonusCards.length;
    const summary = bonusCards
      .map((c) => `${DMD_SUIT_META[c.suit].emoji}${c.value}`)
      .join(" ");
    events.push({
      eventType: "DMD_CHEST_KEY_BONUS",
      message: `🗝️🧰 Combo Chìa Khóa + Rương Báu! ${seat.displayName} mở Mộ bài nhận thêm ${bonusCount} lá kho báu: ${summary}`,
      visibleToSeatNos: "all",
    });
    setAnim(
      state,
      {
        kind: "CHEST_KEY",
        actorSeatNo: seatNo,
        count: cards.length,
        bonusCount,
      },
      nowMs
    );
  }

  return { bonusCount };
}

/**
 * Plays a newly acquired card (from Draw Pile, Sword steal, Hook replay, or Map search)
 * into the active Play Area: checks for Bust (and Anchor protection!), otherwise triggers suit ability!
 */
function resolveCardPlayedIntoArea(
  state: DmdMatchState,
  card: DmdCard,
  source: "DRAW" | "SWORD" | "HOOK" | "MAP",
  events: MatchEventRecord[],
  nowMs: number,
  targetSeatNo?: number
) {
  const actor = getSeat(state, state.activeSeatNo);
  const meta = DMD_SUIT_META[card.suit];

  // Check for BUST (duplicate suit already in Play Area)
  const isBust = state.playArea.some((c) => c.suit === card.suit);
  if (isBust) {
    // Check Anchor protection: all cards drawn strictly BEFORE the Anchor are safely banked!
    const anchorIdx = state.playArea.findIndex((c) => c.suit === "Anchor");
    const protectedCards =
      anchorIdx > 0 ? state.playArea.slice(0, anchorIdx) : [];
    const lostCards =
      anchorIdx > 0
        ? [...state.playArea.slice(anchorIdx), card]
        : [...state.playArea, card];

    // Send lost cards to discard pile
    for (const lc of lostCards) {
      state.discardPile.push(lc);
    }

    let bonusCount = 0;
    if (protectedCards.length > 0) {
      const res = bankCardsIntoSeat(
        state,
        actor.seatNo,
        protectedCards,
        events,
        nowMs
      );
      bonusCount = res.bonusCount;
    }

    setAnim(
      state,
      {
        kind: "BUST",
        actorSeatNo: actor.seatNo,
        card,
        count: lostCards.length,
        savedCount: protectedCards.length,
        bonusCount,
      },
      nowMs
    );

    events.push({
      eventType: "DMD_BUST",
      message:
        protectedCards.length > 0
          ? `💥 CHÁY BÀI! ${actor.displayName} trùng lá ${meta.emoji} ${meta.nameVi} ${card.value} — mất ${lostCards.length} lá, nhưng ⚓ Mỏ Neo kịp cứu ${protectedCards.length} lá về kho!`
          : `💥 CHÁY BÀI! ${actor.displayName} trùng lá ${meta.emoji} ${meta.nameVi} ${card.value} — toàn bộ ${lostCards.length} lá trên bàn rơi xuống Mộ bài!`,
      visibleToSeatNos: "all",
    });

    advanceTurn(state, events, nowMs);
    return;
  }

  // Safe play! Add card to Play Area
  state.playArea.push(card);

  // Set default card animation (may be upgraded by Oracle/Kraken/Sword/etc.)
  setAnim(
    state,
    {
      kind: source,
      actorSeatNo: actor.seatNo,
      targetSeatNo,
      card,
    },
    nowMs
  );

  // Immediately resolve the card's Suit Ability!
  switch (card.suit) {
    case "Anchor":
    case "Chest":
    case "Key":
    case "Mermaid": {
      state.step = "DrawOrBankStep";
      break;
    }

    case "Kraken": {
      const mustDraw = Math.min(2, state.drawPile.length);
      state.forcedDrawsRemaining += mustDraw;
      state.step = "DrawOrBankStep";
      setAnim(
        state,
        {
          kind: "KRAKEN",
          actorSeatNo: actor.seatNo,
          card,
          count: state.forcedDrawsRemaining,
        },
        nowMs
      );
      if (mustDraw > 0) {
        events.push({
          eventType: "DMD_KRAKEN",
          message: `🐙 Kraken trỗi dậy! ${actor.displayName} bắt buộc rút tiếp ${state.forcedDrawsRemaining} lá!`,
          visibleToSeatNos: "all",
        });
      }
      break;
    }

    case "Oracle": {
      if (state.drawPile.length > 0) {
        state.oraclePeekedCard = state.drawPile[state.drawPile.length - 1];
        setAnim(
          state,
          {
            kind: "ORACLE",
            actorSeatNo: actor.seatNo,
            card,
          },
          nowMs
        );
        events.push({
          eventType: "DMD_ORACLE",
          message: `🔮 ${actor.displayName} dùng Tiên Tri soi bí mật lá tiếp theo của Bộ bài rút.`,
          visibleToSeatNos: "all",
        });
      }
      state.step = "DrawOrBankStep";
      break;
    }

    case "Cannon": {
      if (hasAnyOpponentBankCards(state, actor.seatNo)) {
        state.step = "CannonTargetStep";
      } else {
        events.push({
          eventType: "DMD_ABILITY_SKIP",
          message: `💣 Đại Bác không có mục tiêu vì kho báu đối thủ đang trống.`,
          visibleToSeatNos: "all",
        });
        state.step = "DrawOrBankStep";
      }
      break;
    }

    case "Sword": {
      if (hasAnyOpponentBankCards(state, actor.seatNo)) {
        state.step = "SwordTargetStep";
      } else {
        events.push({
          eventType: "DMD_ABILITY_SKIP",
          message: `⚔️ Kiếm Hải Tặc không có mục tiêu vì kho báu đối thủ đang trống.`,
          visibleToSeatNos: "all",
        });
        state.step = "DrawOrBankStep";
      }
      break;
    }

    case "Hook": {
      if (countBankCards(actor.bank) > 0) {
        state.step = "HookPickStep";
      } else {
        events.push({
          eventType: "DMD_ABILITY_SKIP",
          message: `🪝 Móc Sắt không kéo được gì vì kho báu của ${actor.displayName} đang trống.`,
          visibleToSeatNos: "all",
        });
        state.step = "DrawOrBankStep";
      }
      break;
    }

    case "Map": {
      if (state.discardPile.length > 0) {
        const takeCount = Math.min(3, state.discardPile.length);
        // Take top N cards from discardPile (end of array is top)
        const choices: DmdCard[] = [];
        for (let i = 0; i < takeCount; i++) {
          const popped = state.discardPile.pop();
          if (popped) choices.push(popped);
        }
        state.mapChoices = choices;
        state.step = "MapPickStep";
      } else {
        events.push({
          eventType: "DMD_ABILITY_SKIP",
          message: `🗺️ Bản Đồ không tìm thấy lá nào vì Mộ bài đang trống.`,
          visibleToSeatNos: "all",
        });
        state.step = "DrawOrBankStep";
      }
      break;
    }
  }

  // If the draw pile is now empty and we are back on DrawOrBankStep with no interactive sub-step pending,
  // check if forcedDrawsRemaining is now impossible -> end game & bank playArea!
  if (state.step === "DrawOrBankStep" && state.drawPile.length === 0) {
    finalizeMatchIfDeckEmpty(state, events, nowMs);
    return;
  }

  state.phaseDeadlineMs = makeDeadline(state, nowMs);
}

function chooseBotCommand(state: DmdMatchState): DmdCommand {
  const actor = getSeat(state, state.activeSeatNo);
  const suitsInPlay = new Set(state.playArea.map((c) => c.suit));

  if (state.step === "CannonTargetStep") {
    // Destroy highest-value opponent top card
    let best: { targetSeatNo: number; suit: DmdSuit; val: number } | null = null;
    for (const s of state.seats) {
      if (s.seatNo === actor.seatNo) continue;
      for (const suit of DMD_SUITS) {
        const stack = s.bank[suit];
        if (stack.length === 0) continue;
        const topVal = stack[stack.length - 1].value;
        if (!best || topVal > best.val) {
          best = { targetSeatNo: s.seatNo, suit, val: topVal };
        }
      }
    }
    if (best) {
      return {
        type: "CANNON_TARGET",
        targetSeatNo: best.targetSeatNo,
        suit: best.suit,
      };
    }
  }

  if (state.step === "SwordTargetStep") {
    // Steal highest-value non-busting opponent top card; fallback to lowest-value bust if forced
    let bestSafe: { targetSeatNo: number; suit: DmdSuit; val: number } | null =
      null;
    let fallback: { targetSeatNo: number; suit: DmdSuit; val: number } | null =
      null;
    for (const s of state.seats) {
      if (s.seatNo === actor.seatNo) continue;
      for (const suit of DMD_SUITS) {
        const stack = s.bank[suit];
        if (stack.length === 0) continue;
        const topVal = stack[stack.length - 1].value;
        if (!suitsInPlay.has(suit)) {
          if (!bestSafe || topVal > bestSafe.val) {
            bestSafe = { targetSeatNo: s.seatNo, suit, val: topVal };
          }
        } else if (!fallback || topVal < fallback.val) {
          fallback = { targetSeatNo: s.seatNo, suit, val: topVal };
        }
      }
    }
    const pick = bestSafe ?? fallback!;
    return {
      type: "SWORD_TARGET",
      targetSeatNo: pick.targetSeatNo,
      suit: pick.suit,
    };
  }

  if (state.step === "HookPickStep") {
    // Prefer safe card with helpful passive/value (Mermaid/Chest/Key/Anchor/Oracle), avoid Kraken if risky
    let bestSafe: { suit: DmdSuit; score: number } | null = null;
    let fallback: { suit: DmdSuit; val: number } | null = null;
    for (const suit of DMD_SUITS) {
      const stack = actor.bank[suit];
      if (stack.length === 0) continue;
      const topVal = stack[stack.length - 1].value;
      if (!suitsInPlay.has(suit)) {
        const bonus =
          suit === "Anchor" || suit === "Oracle" || suit === "Mermaid"
            ? 4
            : suit === "Kraken"
              ? -5
              : 1;
        const sc = topVal + bonus;
        if (!bestSafe || sc > bestSafe.score) {
          bestSafe = { suit, score: sc };
        }
      } else if (!fallback || topVal < fallback.val) {
        fallback = { suit, val: topVal };
      }
    }
    return { type: "HOOK_PICK", suit: (bestSafe ?? fallback!).suit };
  }

  if (state.step === "MapPickStep") {
    // Pick highest-value safe card from mapChoices
    const safe = state.mapChoices
      .filter((c) => !suitsInPlay.has(c.suit))
      .sort((a, b) => b.value - a.value);
    const pick = safe[0] ?? state.mapChoices[0];
    return { type: "MAP_PICK", cardId: pick.id };
  }

  // DrawOrBankStep: smart push-your-luck bot!
  if (state.playArea.length === 0 || state.forcedDrawsRemaining > 0) {
    return { type: "DRAW" };
  }

  // If Oracle peeked the next card, decide with 100% foresight!
  if (state.oraclePeekedCard) {
    if (suitsInPlay.has(state.oraclePeekedCard.suit)) {
      return { type: "BANK" };
    }
    if (
      state.oraclePeekedCard.suit !== "Kraken" ||
      state.playArea.length <= 3
    ) {
      return { type: "DRAW" };
    }
    return { type: "BANK" };
  }

  // If we already have Key + Chest in play, bank immediately if >= 3 cards!
  const hasKey = suitsInPlay.has("Key");
  const hasChest = suitsInPlay.has("Chest");
  if (hasKey && hasChest && state.playArea.length >= 3) {
    return { type: "BANK" };
  }

  // Anchor right at the end of playArea makes next draw zero-risk for prior cards!
  const lastCard = state.playArea[state.playArea.length - 1];
  if (lastCard?.suit === "Anchor" && state.playArea.length <= 5) {
    return { type: "DRAW" };
  }

  // Push luck up to 3–4 cards depending on count
  const riskThreshold = state.playArea.some((c) => c.suit === "Anchor") ? 5 : 3;
  if (state.playArea.length < riskThreshold) {
    return { type: "DRAW" };
  }

  return { type: "BANK" };
}

export const deadMansDrawCartridge: GameCartridge<
  DmdConfig,
  DmdMatchState,
  DmdCommand,
  DmdPlayerView
> = {
  cartridgeId: "dead-mans-draw",
  title: "Dead Man's Draw",
  subtitle: "Cược May Rủi • Kho Báu Hải Tặc • 2–4 người chơi",
  description:
    "Lật từng lá kho báu hải tặc để kích hoạt chuỗi kỹ năng Đại Bác, Kiếm, Móc Sắt, Bản Đồ, Tiên Tri, Kraken... Dừng đúng lúc để gom kho báu hoặc tham lam và Cháy bài mất trắng!",
  minSeats: 2,
  maxSeats: 4,
  available: true,

  defaultConfig(): DmdConfig {
    return {
      timers: {
        turnSeconds: 45,
      },
    };
  },

  validateConfig(config: DmdConfig, seatCount: number) {
    if (seatCount < 2 || seatCount > 4) {
      return {
        valid: false,
        error: "Dead Man's Draw cần từ 2 đến 4 người chơi.",
      };
    }
    const turnSec = config?.timers?.turnSeconds ?? 45;
    if (turnSec < 15 || turnSec > 180) {
      return {
        valid: false,
        error: "Thời gian mỗi lượt phải nằm trong khoảng 15–180 giây.",
      };
    }
    return { valid: true };
  },

  createInitialState({ config, seats, nowMs, rng = Math.random }) {
    const { initialDrawPile, initialDiscardPile } = buildOfficialDmdDeck();
    const drawPile = shuffle(initialDrawPile, rng);
    const discardPile = shuffle(initialDiscardPile, rng);

    const dmdSeats: DmdSeatState[] = seats.map((s) => ({
      seatNo: s.seatNo,
      actorId: s.actorId,
      displayName: s.displayName,
      avatarSeed: s.avatarSeed ?? s.displayName,
      bank: createEmptyBank(),
    }));

    const firstSeatNo = dmdSeats[0]?.seatNo ?? 1;
    const state: DmdMatchState = {
      config: {
        timers: {
          turnSeconds: config?.timers?.turnSeconds ?? 45,
        },
      },
      turnNumber: 1,
      step: "DrawOrBankStep",
      activeSeatNo: firstSeatNo,
      seats: dmdSeats,
      drawPile,
      discardPile,
      playArea: [],
      forcedDrawsRemaining: 0,
      oraclePeekedCard: null,
      mapChoices: [],
      animSeq: 0,
      lastAnim: null,
      winnerSeatNos: [],
      winReasonVi: null,
      phaseDeadlineMs: nowMs + (config?.timers?.turnSeconds ?? 45) * 1000,
    };

    const events: MatchEventRecord[] = [
      {
        eventType: "DMD_MATCH_STARTED",
        message: `🏴‍☠️ Cuộc săn kho báu Dead Man's Draw bắt đầu! 50 lá trên Bộ bài rút, 10 lá thấp nhất đặt sẵn vào Mộ bài. Lượt của ${dmdSeats[0]?.displayName}.`,
        visibleToSeatNos: "all",
      },
    ];

    return {
      state,
      events,
      phaseDeadlineMs: state.phaseDeadlineMs,
    };
  },

  reduce({ state: prevState, command, actorSeatNo, nowMs }) {
    if (prevState.step === "Finished") {
      throw new Error("Trận đấu đã kết thúc.");
    }
    if (actorSeatNo !== prevState.activeSeatNo) {
      throw new Error("Chưa đến lượt của bạn.");
    }

    const state = cloneState(prevState);
    const actor = getSeat(state, actorSeatNo);
    const events: MatchEventRecord[] = [];

    switch (command.type) {
      case "DRAW": {
        if (state.step !== "DrawOrBankStep") {
          throw new Error("Bạn cần hoàn tất kỹ năng lá bài hiện tại trước.");
        }
        if (state.drawPile.length === 0) {
          finalizeMatchIfDeckEmpty(state, events, nowMs);
          break;
        }

        const drawn = state.drawPile.pop()!;
        state.oraclePeekedCard = null;
        if (state.forcedDrawsRemaining > 0) {
          state.forcedDrawsRemaining -= 1;
        }

        const meta = DMD_SUIT_META[drawn.suit];
        events.push({
          eventType: "DMD_DRAW",
          message: `🃏 ${actor.displayName} rút lá ${meta.emoji} ${meta.nameVi} (${drawn.value}).`,
          visibleToSeatNos: "all",
        });

        resolveCardPlayedIntoArea(state, drawn, "DRAW", events, nowMs);
        break;
      }

      case "BANK": {
        if (state.step !== "DrawOrBankStep") {
          throw new Error("Hãy giải quyết kỹ năng hiện tại trước khi thu kho báu.");
        }
        if (state.playArea.length === 0) {
          throw new Error("Bạn phải rút ít nhất 1 lá trước khi dừng.");
        }
        if (state.forcedDrawsRemaining > 0) {
          throw new Error(
            `🐙 Lời nguyền Kraken! Bạn bắt buộc phải rút tiếp ${state.forcedDrawsRemaining} lá nữa.`
          );
        }

        const collectedCount = state.playArea.length;
        const collectedSummary = state.playArea
          .map((c) => `${DMD_SUIT_META[c.suit].emoji}${c.value}`)
          .join(" ");

        const { bonusCount } = bankCardsIntoSeat(
          state,
          actor.seatNo,
          state.playArea,
          events,
          nowMs
        );

        if (bonusCount === 0) {
          setAnim(
            state,
            {
              kind: "BANK",
              actorSeatNo: actor.seatNo,
              count: collectedCount,
            },
            nowMs
          );
        }

        events.push({
          eventType: "DMD_BANK",
          message: `💰 ${actor.displayName} dừng đúng lúc, thu ${collectedCount} lá vào kho báu (${collectedSummary}). Tổng điểm: ${computeBankScore(actor.bank)}!`,
          visibleToSeatNos: "all",
        });

        advanceTurn(state, events, nowMs);
        break;
      }

      case "CANNON_TARGET": {
        if (state.step !== "CannonTargetStep") {
          throw new Error("Hiện không phải bước bắn Đại Bác.");
        }
        if (command.targetSeatNo === actor.seatNo) {
          throw new Error("Không thể bắn Đại Bác vào kho báu của chính mình.");
        }
        const target = getSeat(state, command.targetSeatNo);
        const stack = target.bank[command.suit];
        if (!stack || stack.length === 0) {
          throw new Error("Chồng kho báu đối thủ này đang trống.");
        }
        const destroyed = stack.pop()!;
        state.discardPile.push(destroyed);

        setAnim(
          state,
          {
            kind: "CANNON",
            actorSeatNo: actor.seatNo,
            targetSeatNo: target.seatNo,
            card: destroyed,
          },
          nowMs
        );

        const meta = DMD_SUIT_META[destroyed.suit];
        events.push({
          eventType: "DMD_CANNON_HIT",
          message: `💣 BÙM! ${actor.displayName} bắn nát lá ${meta.emoji} ${meta.nameVi} (${destroyed.value}) của ${target.displayName} xuống Mộ bài!`,
          visibleToSeatNos: "all",
        });

        state.step = "DrawOrBankStep";
        if (state.drawPile.length === 0) {
          finalizeMatchIfDeckEmpty(state, events, nowMs);
        } else {
          state.phaseDeadlineMs = makeDeadline(state, nowMs);
        }
        break;
      }

      case "SWORD_TARGET": {
        if (state.step !== "SwordTargetStep") {
          throw new Error("Hiện không phải bước cướp bằng Kiếm Hải Tặc.");
        }
        if (command.targetSeatNo === actor.seatNo) {
          throw new Error("Không thể dùng Kiếm cướp bài của chính mình.");
        }
        const target = getSeat(state, command.targetSeatNo);
        const stack = target.bank[command.suit];
        if (!stack || stack.length === 0) {
          throw new Error("Chồng kho báu đối thủ này đang trống.");
        }
        const stolen = stack.pop()!;
        const meta = DMD_SUIT_META[stolen.suit];
        events.push({
          eventType: "DMD_SWORD_STEAL",
          message: `⚔️ ${actor.displayName} cướp lá ${meta.emoji} ${meta.nameVi} (${stolen.value}) từ kho báu của ${target.displayName}!`,
          visibleToSeatNos: "all",
        });

        resolveCardPlayedIntoArea(
          state,
          stolen,
          "SWORD",
          events,
          nowMs,
          target.seatNo
        );
        break;
      }

      case "HOOK_PICK": {
        if (state.step !== "HookPickStep") {
          throw new Error("Hiện không phải bước kéo Móc Sắt.");
        }
        const stack = actor.bank[command.suit];
        if (!stack || stack.length === 0) {
          throw new Error("Bạn không có lá nào thuộc nhóm này trong kho báu.");
        }
        const hooked = stack.pop()!;
        const meta = DMD_SUIT_META[hooked.suit];
        events.push({
          eventType: "DMD_HOOK_PLAY",
          message: `🪝 ${actor.displayName} dùng Móc Sắt kéo lá ${meta.emoji} ${meta.nameVi} (${hooked.value}) từ kho báu ra bàn!`,
          visibleToSeatNos: "all",
        });

        resolveCardPlayedIntoArea(state, hooked, "HOOK", events, nowMs);
        break;
      }

      case "MAP_PICK": {
        if (state.step !== "MapPickStep") {
          throw new Error("Hiện không phải bước chọn Bản Đồ.");
        }
        const idx = state.mapChoices.findIndex((c) => c.id === command.cardId);
        if (idx < 0) {
          throw new Error("Lá bài Bản Đồ không hợp lệ.");
        }
        const [picked] = state.mapChoices.splice(idx, 1);
        // Return the unchosen cards back to Discard Pile
        for (const rem of state.mapChoices) {
          state.discardPile.push(rem);
        }
        state.mapChoices = [];

        const meta = DMD_SUIT_META[picked.suit];
        events.push({
          eventType: "DMD_MAP_PICK",
          message: `🗺️ ${actor.displayName} dùng Bản Đồ đào được lá ${meta.emoji} ${meta.nameVi} (${picked.value}) từ Mộ bài!`,
          visibleToSeatNos: "all",
        });

        resolveCardPlayedIntoArea(state, picked, "MAP", events, nowMs);
        break;
      }
    }

    return {
      state,
      events,
      phaseDeadlineMs: state.phaseDeadlineMs,
    };
  },

  onPhaseTimeout({ state, nowMs }) {
    if (state.step === "Finished") {
      return { state, events: [], phaseDeadlineMs: null };
    }
    const autoCmd = chooseBotCommand(state);
    return this.reduce({
      state,
      command: autoCmd,
      actorSeatNo: state.activeSeatNo,
      nowMs,
    });
  },

  autoActBots({ current, botSeatNos, nowMs }) {
    const botSet = new Set(botSeatNos);
    let state = current.state;
    const events = [...current.events];
    let guard = 0;

    while (
      state.step !== "Finished" &&
      botSet.has(state.activeSeatNo) &&
      guard < 30
    ) {
      guard += 1;
      const cmd = chooseBotCommand(state);
      const next = this.reduce({
        state,
        command: cmd,
        actorSeatNo: state.activeSeatNo,
        nowMs: nowMs + guard * 50,
      });
      state = next.state;
      events.push(...next.events);
    }

    return {
      state,
      events,
      phaseDeadlineMs: state.phaseDeadlineMs,
    };
  },

  projectView({ state, viewerSeatNo }): DmdPlayerView {
    const isActiveViewer = viewerSeatNo === state.activeSeatNo;
    const anchorIdx = state.playArea.findIndex((c) => c.suit === "Anchor");
    const hasKey = state.playArea.some((c) => c.suit === "Key");
    const hasChest = state.playArea.some((c) => c.suit === "Chest");

    return {
      cartridgeId: "dead-mans-draw",
      turnNumber: state.turnNumber,
      step: state.step,
      activeSeatNo: state.activeSeatNo,
      viewerSeatNo,
      seats: state.seats.map((s) => ({
        seatNo: s.seatNo,
        actorId: s.actorId,
        displayName: s.displayName,
        avatarSeed: s.avatarSeed,
        bank: s.bank,
        score: computeBankScore(s.bank),
        totalBankedCards: countBankCards(s.bank),
      })),
      drawPileCount: state.drawPile.length,
      discardPileCount: state.discardPile.length,
      discardTopCard:
        state.discardPile.length > 0
          ? state.discardPile[state.discardPile.length - 1]
          : null,
      playArea: state.playArea,
      anchorProtectedCount: anchorIdx > 0 ? anchorIdx : 0,
      hasKeyAndChestInPlay: hasKey && hasChest,
      forcedDrawsRemaining: state.forcedDrawsRemaining,
      canBank:
        state.step === "DrawOrBankStep" &&
        state.playArea.length > 0 &&
        state.forcedDrawsRemaining === 0,
      oraclePeekedCard: isActiveViewer ? state.oraclePeekedCard : null,
      mapChoices: isActiveViewer ? state.mapChoices : [],
      lastAnim: state.lastAnim,
      winnerSeatNos: state.winnerSeatNos,
      winReasonVi: state.winReasonVi,
      phaseDeadlineMs: state.phaseDeadlineMs,
      config: state.config,
    };
  },

  resolveChannels({ viewerSeatNo }): ChannelPermission[] {
    return [
      {
        channelId: "table",
        label: "Bàn Hải Tặc",
        canRead: true,
        canWrite: viewerSeatNo !== null,
      },
    ];
  },

  isMatchOver(state: DmdMatchState): boolean {
    return state.step === "Finished";
  },

  getWinningFaction(state: DmdMatchState): string | null {
    if (state.step !== "Finished" || state.winnerSeatNos.length === 0) {
      return null;
    }
    return state.winnerSeatNos
      .map((no) => state.seats.find((s) => s.seatNo === no)?.displayName ?? `#${no}`)
      .join(", ");
  },
};
