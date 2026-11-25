import type {
  CartridgeTransitionResult,
  ChannelPermission,
  GameCartridge,
  MatchEventRecord,
  SeatDescriptor,
} from "@/cartridges/types";

export type HeatTrackId = "usa" | "south-africa" | "deutschland";

export const HEAT_TRACK_IDS: HeatTrackId[] = [
  "usa",
  "south-africa",
  "deutschland",
];

export type HeatCarColorId =
  | "red"
  | "blue"
  | "yellow"
  | "green"
  | "black"
  | "silver";

export const HEAT_CAR_COLORS: {
  id: HeatCarColorId;
  nameVi: string;
  primaryHex: string;
  accentHex: string;
  number: number;
}[] = [
  {
    id: "red",
    nameVi: "Đỏ Ferrari",
    primaryHex: "#ef4444",
    accentHex: "#fef08a",
    number: 1,
  },
  {
    id: "blue",
    nameVi: "Xanh Bugatti",
    primaryHex: "#3b82f6",
    accentHex: "#e0f2fe",
    number: 2,
  },
  {
    id: "yellow",
    nameVi: "Vàng Lotus",
    primaryHex: "#eab308",
    accentHex: "#1e293b",
    number: 3,
  },
  {
    id: "green",
    nameVi: "Xanh Aston",
    primaryHex: "#10b981",
    accentHex: "#ecfdf5",
    number: 4,
  },
  {
    id: "black",
    nameVi: "Đen Brabham",
    primaryHex: "#334155",
    accentHex: "#f59e0b",
    number: 5,
  },
  {
    id: "silver",
    nameVi: "Bạc Mercedes",
    primaryHex: "#cbd5e1",
    accentHex: "#dc2626",
    number: 6,
  },
];

export interface HeatCornerSpec {
  id: string;
  nameVi: string;
  /** Space index (0..totalSpaces-1) immediately BEFORE the corner line */
  afterSpaceIndex: number;
  speedLimit: number;
  /** Number of spaces before the corner where the Legends Line sits */
  legendsDistance: number;
  isChicane?: boolean;
  hasChevron?: boolean;
}

export interface HeatTrackSpec {
  id: HeatTrackId;
  nameVi: string;
  shortNameVi: string;
  countryCode: string;
  subtitleVi: string;
  descriptionVi: string;
  totalSpaces: number;
  defaultLaps: number;
  startingHeat: number;
  startingStress: number;
  corners: HeatCornerSpec[];
  /** Set of space indices (0..totalSpaces-1) covered by Gravel (South Africa hazard: costs 1 Heat if ending turn on it) */
  gravelSpaces: number[];
  accentColor: string;
  spriteUrl: string;
}

export const HEAT_TRACKS: Record<HeatTrackId, HeatTrackSpec> = {
  usa: {
    id: "usa",
    nameVi: "USA • Grand Prix Sa Mạc",
    shortNameVi: "USA",
    countryCode: "USA",
    subtitleVi: "69 Ô • 2 Vòng • 4 Góc Cua (7, 3, 3, 2) • 6 Heat / 3 Stress",
    descriptionVi:
      "Đường đua tốc độ cao xuyên hẻm núi sa mạc với những đoạn thẳng dài và 4 khúc cua tiêu chuẩn.",
    totalSpaces: 69,
    defaultLaps: 2,
    startingHeat: 6,
    startingStress: 3,
    corners: [
      {
        id: "usa-c1",
        nameVi: "Khúc Cua Đông Nam (#1)",
        afterSpaceIndex: 10,
        speedLimit: 7,
        legendsDistance: 5,
      },
      {
        id: "usa-c2",
        nameVi: "Khúc Cua Nhà Máy (#2)",
        afterSpaceIndex: 31,
        speedLimit: 3,
        legendsDistance: 5,
      },
      {
        id: "usa-c3",
        nameVi: "Đỉnh Đồi UFO (#3)",
        afterSpaceIndex: 46,
        speedLimit: 3,
        legendsDistance: 5,
      },
      {
        id: "usa-c4",
        nameVi: "Cua Tay Áo Hẻm Núi (#4)",
        afterSpaceIndex: 54,
        speedLimit: 2,
        legendsDistance: 4,
      },
    ],
    gravelSpaces: [],
    accentColor: "#f59e0b",
    spriteUrl: "/sprites/heat-track-usa.jpg",
  },
  "south-africa": {
    id: "south-africa",
    nameVi: "South Africa • Rocky Roads",
    shortNameVi: "South Africa",
    countryCode: "ZAF",
    subtitleVi:
      "71 Ô • 2 Vòng • 7 Góc Cua + Bẫy Sỏi Đá (Gravel) • 7 Heat / 3 Stress",
    descriptionVi:
      "Đường đua kỹ thuật gồm 7 khúc cua liên hoàn và các bãi Sỏi Đá (Gravel): dừng xe trên ô sỏi cuối lượt sẽ làm nóng máy tốn thêm 1 Heat!",
    totalSpaces: 71,
    defaultLaps: 2,
    startingHeat: 7,
    startingStress: 3,
    corners: [
      {
        id: "zaf-c1",
        nameVi: "Cua Thảo Nguyên (#1)",
        afterSpaceIndex: 6,
        speedLimit: 4,
        legendsDistance: 4,
      },
      {
        id: "zaf-c2",
        nameVi: "Cua Hoa Protea (#2)",
        afterSpaceIndex: 13,
        speedLimit: 3,
        legendsDistance: 4,
      },
      {
        id: "zaf-c3",
        nameVi: "Cua Gắt Thung Lũng (#3)",
        afterSpaceIndex: 21,
        speedLimit: 2,
        legendsDistance: 4,
      },
      {
        id: "zaf-c4",
        nameVi: "Vòng Cung Bắc (#4)",
        afterSpaceIndex: 32,
        speedLimit: 6,
        legendsDistance: 5,
      },
      {
        id: "zaf-c5",
        nameVi: "Khúc Cua Trạm Xăng (#5)",
        afterSpaceIndex: 45,
        speedLimit: 5,
        legendsDistance: 5,
      },
      {
        id: "zaf-c6",
        nameVi: "Đỉnh Đồi Sỏi Đỏ (#6)",
        afterSpaceIndex: 55,
        speedLimit: 2,
        legendsDistance: 4,
      },
      {
        id: "zaf-c7",
        nameVi: "Cua Về Đích (#7)",
        afterSpaceIndex: 64,
        speedLimit: 4,
        legendsDistance: 5,
      },
    ],
    gravelSpaces: [
      4, 5, 6, 10, 11, 12, 13, 15, 16, 19, 20, 21, 46, 47, 51, 52, 53, 54, 55,
      56, 57,
    ],
    accentColor: "#ea580c",
    spriteUrl: "/sprites/heat-track-south-africa.jpg",
  },
  deutschland: {
    id: "deutschland",
    nameVi: "Deutschland • Chicane Rừng Đen",
    shortNameVi: "Deutschland",
    countryCode: "DEU",
    subtitleVi:
      "62 Ô • 2 Vòng • 6 Góc Cua + Cua Kép Chicane (2-2) • 5 Heat / 3 Stress",
    descriptionVi:
      "Đường đua nước Đức với cụm cua kép Chicane gờ xanh-trắng (2 vạch giới hạn tốc độ 2 liên tiếp) và động cơ chỉ có 5 lá Heat khởi đầu!",
    totalSpaces: 62,
    defaultLaps: 2,
    startingHeat: 5,
    startingStress: 3,
    corners: [
      {
        id: "deu-c1",
        nameVi: "Khúc Cua Rừng Thông (#1)",
        afterSpaceIndex: 9,
        speedLimit: 5,
        legendsDistance: 5,
      },
      {
        id: "deu-c2",
        nameVi: "Chicane Vào (#2A)",
        afterSpaceIndex: 21,
        speedLimit: 2,
        legendsDistance: 5,
        isChicane: true,
        hasChevron: true,
      },
      {
        id: "deu-c3",
        nameVi: "Chicane Ra (#2B)",
        afterSpaceIndex: 23,
        speedLimit: 2,
        legendsDistance: 2,
        isChicane: true,
      },
      {
        id: "deu-c4",
        nameVi: "Vòng Cung Sông Rhine (#4)",
        afterSpaceIndex: 39,
        speedLimit: 6,
        legendsDistance: 5,
      },
      {
        id: "deu-c5",
        nameVi: "Cua Nam Khán Đài (#5)",
        afterSpaceIndex: 46,
        speedLimit: 4,
        legendsDistance: 4,
      },
      {
        id: "deu-c6",
        nameVi: "Cua Tay Áo Arena (#6)",
        afterSpaceIndex: 53,
        speedLimit: 4,
        legendsDistance: 4,
      },
    ],
    gravelSpaces: [],
    accentColor: "#38bdf8",
    spriteUrl: "/sprites/heat-track-deutschland.jpg",
  },
};

export type HeatCardKind = "speed" | "upgrade_0" | "upgrade_5" | "stress" | "heat";

export interface HeatCard {
  id: string;
  kind: HeatCardKind;
  /** Numeric speed value for 'speed' (1..4), 'upgrade_0' (0), 'upgrade_5' (5); null for 'stress' (+) and 'heat' */
  value: number | null;
  labelVi: string;
}

export type HeatStep =
  | "GearAndCardsStep"
  | "ReactAndSlipstreamStep"
  | "Finished";

export interface HeatConfig {
  trackId: HeatTrackId;
  laps: number;
  timers: {
    planSeconds: number;
    reactSeconds: number;
  };
}

export interface HeatSeatState {
  seatNo: number;
  actorId: string;
  displayName: string;
  avatarSeed: string;
  colorId: HeatCarColorId;
  gear: 1 | 2 | 3 | 4;
  /** Cumulative linear track progress (-3..-1 on starting grid; 0 is first space after Start/Finish line) */
  progress: number;
  /** 0 = Race Line (inner/priority lane), 1 = Outer Lane */
  lane: 0 | 1;
  hand: HeatCard[];
  drawPile: HeatCard[];
  discardPile: HeatCard[];
  enginePile: HeatCard[];
  /** Planned target gear and cards during simultaneous GearAndCardsStep */
  plannedGear: (1 | 2 | 3 | 4) | null;
  plannedCards: HeatCard[];
  /** Cards revealed on table for the active round */
  playedCards: HeatCard[];
  /** Current round speed (played cards + Stress flips + Boost + Adrenaline +1; excludes Slipstream) */
  turnSpeed: number;
  /** Progress at the start of the active car's turn in the current round */
  turnStartProgress: number;
  hasAdrenaline: boolean;
  usedAdrenalineSpeed: boolean;
  usedBoost: boolean;
  usedSlipstream: boolean;
  cooldownRemaining: number;
  finishedRound: number | null;
  finishRank: number | null;
  lastSpinOutRound: number | null;
}

export interface HeatCornerCheckPreview {
  cornerId: string;
  nameVi: string;
  speedLimit: number;
  cornerProgress: number;
  excessSpeed: number;
  willSpinOut: boolean;
  isChicane?: boolean;
}

export interface HeatLastAnim {
  id: number;
  kind:
    | "SHIFT_PLAN"
    | "REVEAL_MOVE"
    | "BOOST"
    | "COOLDOWN"
    | "ADRENALINE"
    | "SLIPSTREAM"
    | "CORNER_PASS"
    | "SPIN_OUT"
    | "FINISH_CROSS";
  actorSeatNo: number;
  fromProgress?: number;
  toProgress?: number;
  speed?: number;
  gear?: number;
  heatPaid?: number;
  stressAdded?: number;
  card?: HeatCard;
  atMs: number;
}

export interface HeatMatchState {
  config: HeatConfig;
  roundNumber: number;
  step: HeatStep;
  /** Ordered queue of seatNos to execute Steps 3..9 sequentially in current round */
  turnQueue: number[];
  activeSeatNo: number | null;
  seats: HeatSeatState[];
  nextFinishRank: number;
  nextStressCardSeq: number;
  animSeq: number;
  lastAnim: HeatLastAnim | null;
  winnerSeatNos: number[];
  winReasonVi: string | null;
  phaseDeadlineMs: number | null;
}

export type HeatCommand =
  | {
      type: "PLAN_TURN";
      targetGear: 1 | 2 | 3 | 4;
      cardIds: string[];
    }
  | {
      type: "USE_COOLDOWN";
      cardId?: string;
    }
  | {
      type: "USE_BOOST";
    }
  | {
      type: "USE_ADRENALINE_SPEED";
    }
  | {
      type: "USE_SLIPSTREAM";
    }
  | {
      type: "END_TURN";
      discardCardIds?: string[];
    };

export interface HeatSeatView {
  seatNo: number;
  actorId: string;
  displayName: string;
  avatarSeed: string;
  colorId: HeatCarColorId;
  gear: 1 | 2 | 3 | 4;
  progress: number;
  spaceIndex: number;
  lap: number;
  lane: 0 | 1;
  raceRank: number;
  handCount: number;
  drawPileCount: number;
  discardPileCount: number;
  discardTopCard: HeatCard | null;
  engineHeatCount: number;
  hasPlanned: boolean;
  playedCards: HeatCard[];
  turnSpeed: number;
  turnStartProgress: number;
  hasAdrenaline: boolean;
  usedAdrenalineSpeed: boolean;
  usedBoost: boolean;
  usedSlipstream: boolean;
  cooldownRemaining: number;
  finishedRound: number | null;
  finishRank: number | null;
  lastSpinOutRound: number | null;
  onGravel: boolean;
}

export interface HeatPlayerView {
  cartridgeId: "heat";
  roundNumber: number;
  step: HeatStep;
  turnQueue: number[];
  activeSeatNo: number | null;
  viewerSeatNo: number | null;
  track: HeatTrackSpec;
  totalLaps: number;
  finishProgress: number;
  seats: HeatSeatView[];
  myHand: HeatCard[];
  myPlannedGear: (1 | 2 | 3 | 4) | null;
  myPlannedCardIds: string[];
  canSlipstream: boolean;
  canBoost: boolean;
  canCooldown: boolean;
  canAdrenalineSpeed: boolean;
  crossedCornersPreview: HeatCornerCheckPreview[];
  lastAnim: HeatLastAnim | null;
  winnerSeatNos: number[];
  winReasonVi: string | null;
  phaseDeadlineMs: number | null;
  config: HeatConfig;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getHeatTrack(trackId?: string): HeatTrackSpec {
  if (trackId && trackId in HEAT_TRACKS) {
    return HEAT_TRACKS[trackId as HeatTrackId];
  }
  return HEAT_TRACKS.usa;
}

export function progressToSpaceIndex(
  progress: number,
  totalSpaces: number
): number {
  return ((progress % totalSpaces) + totalSpaces) % totalSpaces;
}

export function progressToLap(
  progress: number,
  totalSpaces: number,
  totalLaps: number
): number {
  if (progress < 0) return 1;
  return Math.min(totalLaps, Math.floor(progress / totalSpaces) + 1);
}

/**
 * Builds a driver's official 18-card starting deck (12 Basic Speed + 3 Starting Upgrades + N Stress)
 * and initial Engine Heat pile (M Heat cards).
 */
export function buildDriverDecks(
  seatNo: number,
  startingHeat: number,
  startingStress: number,
  rng: () => number
): {
  drawPile: HeatCard[];
  enginePile: HeatCard[];
} {
  const cards: HeatCard[] = [];
  // 12 Basic Speed cards: 3x 1, 3x 2, 3x 3, 3x 4
  for (const val of [1, 2, 3, 4]) {
    for (let copy = 1; copy <= 3; copy++) {
      cards.push({
        id: `s${seatNo}-spd-${val}-${copy}`,
        kind: "speed",
        value: val,
        labelVi: `Tốc Độ ${val}`,
      });
    }
  }
  // 3 Starting Upgrades: 0 Speed, 5 Speed, 1 Garage Heat
  cards.push({
    id: `s${seatNo}-upg-0`,
    kind: "upgrade_0",
    value: 0,
    labelVi: "Phanh Gấp (0)",
  });
  cards.push({
    id: `s${seatNo}-upg-5`,
    kind: "upgrade_5",
    value: 5,
    labelVi: "Tăng Áp (5)",
  });
  cards.push({
    id: `s${seatNo}-upg-heat`,
    kind: "heat",
    value: null,
    labelVi: "Nhiệt Độ (Upgrade)",
  });

  // Starting Stress cards
  for (let i = 1; i <= startingStress; i++) {
    cards.push({
      id: `s${seatNo}-stress-${i}`,
      kind: "stress",
      value: null,
      labelVi: "Áp Lực (+)",
    });
  }

  const enginePile: HeatCard[] = [];
  for (let i = 1; i <= startingHeat; i++) {
    enginePile.push({
      id: `s${seatNo}-heat-${i}`,
      kind: "heat",
      value: null,
      labelVi: "Nhiệt Động Cơ (Heat)",
    });
  }

  return {
    drawPile: shuffle(cards, rng),
    enginePile,
  };
}

function cloneState(state: HeatMatchState): HeatMatchState {
  return {
    ...state,
    turnQueue: [...state.turnQueue],
    seats: state.seats.map((s) => ({
      ...s,
      hand: [...s.hand],
      drawPile: [...s.drawPile],
      discardPile: [...s.discardPile],
      enginePile: [...s.enginePile],
      plannedCards: [...s.plannedCards],
      playedCards: [...s.playedCards],
    })),
    winnerSeatNos: [...state.winnerSeatNos],
  };
}

function getSeat(state: HeatMatchState, seatNo: number): HeatSeatState {
  const seat = state.seats.find((s) => s.seatNo === seatNo);
  if (!seat) throw new Error("Không tìm thấy xe đua của ghế này.");
  return seat;
}

function setAnim(
  state: HeatMatchState,
  anim: Omit<HeatLastAnim, "id" | "atMs">,
  nowMs: number
) {
  state.animSeq += 1;
  state.lastAnim = {
    ...anim,
    id: state.animSeq,
    atMs: nowMs,
  };
}

/**
 * Sorts seats by official Race Order:
 * 1. Already finished cars ordered by finishRank ascending.
 * 2. Active cars ordered by highest `progress` first; tie-breaker: `lane === 0` (Race Line) before `lane === 1`.
 */
export function getRaceStandings(seats: HeatSeatState[]): HeatSeatState[] {
  return [...seats].sort((a, b) => {
    if (a.finishRank !== null && b.finishRank !== null) {
      return a.finishRank - b.finishRank;
    }
    if (a.finishRank !== null) return -1;
    if (b.finishRank !== null) return 1;
    if (b.progress !== a.progress) return b.progress - a.progress;
    if (a.lane !== b.lane) return a.lane - b.lane;
    return a.seatNo - b.seatNo;
  });
}

/**
 * Draws up to `count` cards from `seat.drawPile`, reshuffling `seat.discardPile` when empty.
 */
function drawCardsForSeat(
  seat: HeatSeatState,
  count: number,
  rng: () => number = Math.random
): HeatCard[] {
  const drawn: HeatCard[] = [];
  for (let i = 0; i < count; i++) {
    if (seat.drawPile.length === 0) {
      if (seat.discardPile.length === 0) break;
      seat.drawPile = shuffle(seat.discardPile, rng);
      seat.discardPile = [];
    }
    const card = seat.drawPile.pop();
    if (card) drawn.push(card);
  }
  return drawn;
}

/**
 * Flips cards from top of `seat.drawPile` (reshuffling discard if needed) until a Basic Speed card ('speed', 1..4) is found.
 * All non-basic cards revealed along the way go straight into `seat.discardPile`.
 */
function flipUntilBasicSpeedCard(
  seat: HeatSeatState,
  rng: () => number = Math.random
): HeatCard {
  for (let guard = 0; guard < 40; guard++) {
    const [card] = drawCardsForSeat(seat, 1, rng);
    if (!card) break;
    if (card.kind === "speed" && card.value !== null) {
      return card;
    }
    seat.discardPile.push(card);
  }
  // Fallback if deck somehow had zero basic speed cards left
  return {
    id: `fallback-spd-2`,
    kind: "speed",
    value: 2,
    labelVi: "Tốc Độ 2",
  };
}

/**
 * Places `seat` at `desiredProgress` (or backs up to the nearest space with < 2 other cars if blocked).
 * Prefers `lane: 0` (Race Line) if unoccupied; otherwise takes `lane: 1`.
 */
function placeCarAtProgress(
  state: HeatMatchState,
  seat: HeatSeatState,
  desiredProgress: number
): void {
  const track = getHeatTrack(state.config.trackId);
  const finishProgress = state.config.laps * track.totalSpaces;

  // Cars past the finish line don't get blocked by cars on earlier laps
  let candidate = desiredProgress;
  for (let back = 0; back < track.totalSpaces; back++) {
    const probe = desiredProgress - back;
    const probeSpace = progressToSpaceIndex(probe, track.totalSpaces);
    const isPastFinish = probe >= finishProgress;

    const occupants = state.seats.filter((other) => {
      if (other.seatNo === seat.seatNo) return false;
      if (isPastFinish) {
        return other.progress === probe;
      }
      // On the active track, two cars occupy the same physical board space if their spaceIndex matches and neither has finished
      return (
        other.finishRank === null &&
        progressToSpaceIndex(other.progress, track.totalSpaces) === probeSpace
      );
    });

    if (occupants.length === 0) {
      candidate = probe;
      seat.progress = candidate;
      seat.lane = 0;
      return;
    }
    if (occupants.length === 1) {
      candidate = probe;
      seat.progress = candidate;
      seat.lane = occupants[0].lane === 0 ? 1 : 0;
      return;
    }
  }

  seat.progress = desiredProgress;
  seat.lane = 0;
}

/**
 * Checks whether `seat` currently qualifies for a +2 Slipstream:
 * - Has not already used Slipstream this turn.
 * - Has not already crossed the Finish Line, and +2 spaces would not cross the Finish Line (official rule: cannot Slipstream across Finish Line!).
 * - Another unfinished car is either on the SAME physical space (`spaceIndex`) or 1 space ahead (`(spaceIndex + 1) % totalSpaces`).
 */
export function canSeatSlipstream(
  state: HeatMatchState,
  seat: HeatSeatState
): boolean {
  if (seat.usedSlipstream || seat.finishRank !== null) return false;
  const track = getHeatTrack(state.config.trackId);
  const finishProgress = state.config.laps * track.totalSpaces;
  if (seat.progress >= finishProgress) return false;
  if (seat.progress + 2 >= finishProgress) return false;

  const mySpace = progressToSpaceIndex(seat.progress, track.totalSpaces);
  const aheadSpace = (mySpace + 1) % track.totalSpaces;

  return state.seats.some((other) => {
    if (other.seatNo === seat.seatNo || other.finishRank !== null) return false;
    const otherSpace = progressToSpaceIndex(other.progress, track.totalSpaces);
    return otherSpace === mySpace || otherSpace === aheadSpace;
  });
}

/**
 * Computes the ordered list of corners that `seat` has crossed during its current turn
 * (`fromProgress = seat.turnStartProgress` to `toProgress = Math.min(seat.progress, finishProgress)`).
 */
export function getCrossedCornersForTurn(
  state: HeatMatchState,
  seat: HeatSeatState
): HeatCornerCheckPreview[] {
  const track = getHeatTrack(state.config.trackId);
  const finishProgress = state.config.laps * track.totalSpaces;
  const cappedEnd = Math.min(seat.progress, finishProgress);

  const crossed: HeatCornerCheckPreview[] = [];
  let simulatedEngineHeat = seat.enginePile.length;

  for (let p = seat.turnStartProgress; p < cappedEnd; p++) {
    if (p < 0) continue; // Crossing the Start line at the beginning of Lap 1 is not a corner
    const sIdx = progressToSpaceIndex(p, track.totalSpaces);
    const corner = track.corners.find((c) => c.afterSpaceIndex === sIdx);
    if (corner) {
      const excess = Math.max(0, seat.turnSpeed - corner.speedLimit);
      const willSpinOut = excess > simulatedEngineHeat;
      simulatedEngineHeat = Math.max(0, simulatedEngineHeat - excess);
      crossed.push({
        cornerId: corner.id,
        nameVi: corner.nameVi,
        speedLimit: corner.speedLimit,
        cornerProgress: p,
        excessSpeed: excess,
        willSpinOut,
        isChicane: corner.isChicane,
      });
    }
  }

  return crossed;
}

export function computeBaseGearCooldown(
  gear: 1 | 2 | 3 | 4,
  hasAdrenaline: boolean
): number {
  const base = gear === 1 ? 3 : gear === 2 ? 1 : 0;
  return base + (hasAdrenaline ? 1 : 0);
}

/**
 * Executes Step 3 (Reveal & Move) for the newly active seat at the front of `state.turnQueue`.
 */
function beginActiveSeatSequentialTurn(
  state: HeatMatchState,
  events: MatchEventRecord[],
  nowMs: number
): void {
  while (state.turnQueue.length > 0) {
    const nextSeatNo = state.turnQueue[0];
    const seat = getSeat(state, nextSeatNo);
    if (seat.finishRank !== null) {
      state.turnQueue.shift();
      continue;
    }

    state.activeSeatNo = seat.seatNo;
    seat.turnStartProgress = seat.progress;
    seat.usedAdrenalineSpeed = false;
    seat.usedBoost = false;
    seat.usedSlipstream = false;
    seat.cooldownRemaining = computeBaseGearCooldown(
      seat.gear,
      seat.hasAdrenaline
    );

    // Step 3: Reveal played cards (and draw replacement cards if Cluttered Hand had fewer than seat.gear cards)
    const revealed: HeatCard[] = [...seat.plannedCards];
    seat.plannedCards = [];
    seat.plannedGear = null;

    while (revealed.length < seat.gear) {
      const [extra] = drawCardsForSeat(seat, 1);
      if (!extra) break;
      if (extra.kind === "heat") {
        seat.discardPile.push(extra);
      } else {
        revealed.push(extra);
      }
    }

    const finalPlayed: HeatCard[] = [];
    let totalSpeed = 0;
    const stressNotes: string[] = [];

    for (const card of revealed) {
      if (card.kind === "stress") {
        const flipped = flipUntilBasicSpeedCard(seat);
        finalPlayed.push(flipped);
        totalSpeed += flipped.value ?? 0;
        // The played Stress card goes to discard pile when turn ends; store it in discard now so finalPlayed shows the speed card
        seat.discardPile.push(card);
        stressNotes.push(`Áp lực (+) → +${flipped.value}`);
      } else {
        finalPlayed.push(card);
        totalSpeed += card.value ?? 0;
      }
    }

    seat.playedCards = finalPlayed;
    seat.turnSpeed = totalSpeed;

    const fromProgress = seat.progress;
    placeCarAtProgress(state, seat, fromProgress + totalSpeed);

    setAnim(
      state,
      {
        kind: "REVEAL_MOVE",
        actorSeatNo: seat.seatNo,
        fromProgress,
        toProgress: seat.progress,
        speed: totalSpeed,
        gear: seat.gear,
      },
      nowMs
    );

    const stressSuffix =
      stressNotes.length > 0 ? ` (${stressNotes.join(", ")})` : "";
    events.push({
      eventType: "HEAT_REVEAL_MOVE",
      message: `🏎️ ${seat.displayName} (Số ${seat.gear}) lật bài đạt tốc độ ${totalSpeed}${stressSuffix} — tiến lên ô #${seat.progress + 1}${seat.hasAdrenaline ? " ⚡ [Có Adrenaline cuối đoàn!]" : ""}.`,
      visibleToSeatNos: "all",
    });

    state.step = "ReactAndSlipstreamStep";
    state.phaseDeadlineMs = nowMs + state.config.timers.reactSeconds * 1000;
    return;
  }

  // All cars in turnQueue have completed Steps 3..9 for this round!
  finishRoundAndCheckVictory(state, events, nowMs);
}

/**
 * Completes Steps 7 (Check Corner + Gravel hazard), 8 (Optional Discard), and 9 (Replenish Hand to 7)
 * for the current `activeSeatNo`, then advances to the next car in `turnQueue`.
 */
function completeActiveSeatTurn(
  state: HeatMatchState,
  seat: HeatSeatState,
  discardCardIds: string[],
  events: MatchEventRecord[],
  nowMs: number
): void {
  const track = getHeatTrack(state.config.trackId);
  const finishProgress = state.config.laps * track.totalSpaces;

  // Step 7: Check Corners in exact chronological order crossed
  const crossedCorners = getCrossedCornersForTurn(state, seat);
  let spunOut = false;

  for (const corner of crossedCorners) {
    const excess = Math.max(0, seat.turnSpeed - corner.speedLimit);
    if (excess === 0) {
      events.push({
        eventType: "HEAT_CORNER_CLEAN",
        message: `🟢 ${seat.displayName} ôm gọn ${corner.nameVi} (Tốc độ ${seat.turnSpeed}/${corner.speedLimit}).`,
        visibleToSeatNos: "all",
      });
      continue;
    }

    if (seat.enginePile.length >= excess) {
      // Pay excess Heat from Engine to Discard Pile
      for (let i = 0; i < excess; i++) {
        const h = seat.enginePile.pop();
        if (h) seat.discardPile.push(h);
      }
      setAnim(
        state,
        {
          kind: "CORNER_PASS",
          actorSeatNo: seat.seatNo,
          speed: seat.turnSpeed,
          heatPaid: excess,
        },
        nowMs
      );
      events.push({
        eventType: "HEAT_CORNER_OVERSPEED",
        message: `🔥 ${seat.displayName} vượt tốc qua ${corner.nameVi} (${seat.turnSpeed}/${corner.speedLimit}) — đốt ${excess} Heat từ Động cơ!`,
        visibleToSeatNos: "all",
      });
    } else {
      // SPIN OUT!
      spunOut = true;
      const paidAll = seat.enginePile.length;
      while (seat.enginePile.length > 0) {
        const h = seat.enginePile.pop();
        if (h) seat.discardPile.push(h);
      }

      const oldGear = seat.gear;
      const penaltyStressCount = oldGear >= 3 ? 2 : 1;
      for (let i = 0; i < penaltyStressCount; i++) {
        state.nextStressCardSeq += 1;
        seat.hand.push({
          id: `s${seat.seatNo}-spin-stress-${state.nextStressCardSeq}`,
          kind: "stress",
          value: null,
          labelVi: "Áp Lực (+)",
        });
      }

      // Move car back to first available space before the corner line that caused the spin out
      const prevProgress = seat.progress;
      placeCarAtProgress(state, seat, corner.cornerProgress);
      seat.gear = 1;
      seat.lastSpinOutRound = state.roundNumber;

      setAnim(
        state,
        {
          kind: "SPIN_OUT",
          actorSeatNo: seat.seatNo,
          fromProgress: prevProgress,
          toProgress: seat.progress,
          heatPaid: paidAll,
          stressAdded: penaltyStressCount,
        },
        nowMs
      );

      events.push({
        eventType: "HEAT_SPIN_OUT",
        message: `💥 VĂNG XE (SPIN OUT)! ${seat.displayName} quá nhiệt tại ${corner.nameVi} (Tốc độ ${seat.turnSpeed}/${corner.speedLimit}, chỉ còn ${paidAll} Heat) — lùi về trước vạch cua, về Số 1 và nhận +${penaltyStressCount} lá Áp Lực!`,
        visibleToSeatNos: "all",
      });
      break;
    }
  }

  // South Africa Gravel Hazard check (Step 8/9): if car ends its turn on a gravel space, pay 1 Heat from Engine if available
  const finalSpaceIdx = progressToSpaceIndex(seat.progress, track.totalSpaces);
  if (
    !spunOut &&
    seat.progress < finishProgress &&
    track.gravelSpaces.includes(finalSpaceIdx) &&
    seat.enginePile.length > 0
  ) {
    const gravelHeat = seat.enginePile.pop();
    if (gravelHeat) seat.discardPile.push(gravelHeat);
    events.push({
      eventType: "HEAT_GRAVEL_PENALTY",
      message: `🪨 Bẫy Sỏi Đá (Gravel)! ${seat.displayName} dừng xe trên mặt đường sỏi — tốn 1 Heat từ Động cơ.`,
      visibleToSeatNos: "all",
    });
  }

  // Check if car crossed the Finish Line at the end of its turn!
  if (!spunOut && seat.progress >= finishProgress && seat.finishRank === null) {
    seat.finishedRound = state.roundNumber;
    setAnim(
      state,
      {
        kind: "FINISH_CROSS",
        actorSeatNo: seat.seatNo,
        toProgress: seat.progress,
        speed: seat.turnSpeed,
      },
      nowMs
    );
    events.push({
      eventType: "HEAT_FINISH_CROSSED",
      message: `🏁 ${seat.displayName} đã cán Vạch Đích (vượt vạch +${seat.progress - finishProgress} ô)!`,
      visibleToSeatNos: "all",
    });
  }

  // Step 8: Move played cards to Discard Pile, plus any optional discardable cards from hand (never Heat or Stress!)
  for (const c of seat.playedCards) {
    seat.discardPile.push(c);
  }
  seat.playedCards = [];

  if (discardCardIds.length > 0) {
    const discardSet = new Set(discardCardIds);
    const keptHand: HeatCard[] = [];
    let discardedCount = 0;
    for (const c of seat.hand) {
      if (
        discardSet.has(c.id) &&
        c.kind !== "heat" &&
        c.kind !== "stress"
      ) {
        seat.discardPile.push(c);
        discardedCount += 1;
      } else {
        keptHand.push(c);
      }
    }
    seat.hand = keptHand;
    if (discardedCount > 0) {
      events.push({
        eventType: "HEAT_OPTIONAL_DISCARD",
        message: `🗑️ ${seat.displayName} chủ động bỏ ${discardedCount} lá bài trên tay để lọc bài mới.`,
        visibleToSeatNos: "all",
      });
    }
  }

  // Step 9: Replenish hand back up to 7 cards
  const needCards = Math.max(0, 7 - seat.hand.length);
  if (needCards > 0) {
    const drawn = drawCardsForSeat(seat, needCards);
    seat.hand.push(...drawn);
  }

  // Remove completed seat from turnQueue and advance to the next car
  state.turnQueue.shift();
  beginActiveSeatSequentialTurn(state, events, nowMs);
}

/**
 * At the end of a round (after all cars in turnQueue have completed Steps 3..9):
 * - Assigns official `finishRank` to any cars that crossed the Finish Line this round (ordered by furthest `progress` past the line, then `lane === 0`).
 * - If at least one car has crossed the Finish Line, concludes the Grand Prix and crowns the podium winners!
 * - Otherwise starts the next round at `GearAndCardsStep`.
 */
function finishRoundAndCheckVictory(
  state: HeatMatchState,
  events: MatchEventRecord[],
  nowMs: number
): void {
  const newlyFinished = state.seats
    .filter((s) => s.finishedRound === state.roundNumber && s.finishRank === null)
    .sort((a, b) => {
      if (b.progress !== a.progress) return b.progress - a.progress;
      return a.lane - b.lane;
    });

  for (const car of newlyFinished) {
    car.finishRank = state.nextFinishRank;
    state.nextFinishRank += 1;
  }

  const anyFinished = state.seats.some((s) => s.finishRank !== null);
  if (anyFinished) {
    // Assign final standings to all remaining cars by current Race Order
    const standings = getRaceStandings(state.seats);
    standings.forEach((car, idx) => {
      car.finishRank = idx + 1;
    });

    const champion = standings[0];
    state.step = "Finished";
    state.activeSeatNo = null;
    state.turnQueue = [];
    state.phaseDeadlineMs = null;
    state.winnerSeatNos = [champion.seatNo];

    const track = getHeatTrack(state.config.trackId);
    const finishProgress = state.config.laps * track.totalSpaces;
    const extraSpaces = Math.max(0, champion.progress - finishProgress);
    state.winReasonVi = `🏆 ${champion.displayName} vô địch chặng đua ${track.shortNameVi} sau ${state.roundNumber} vòng lượt (vượt đích +${extraSpaces} ô)!`;

    events.push({
      eventType: "HEAT_MATCH_FINISHED",
      message: state.winReasonVi,
      visibleToSeatNos: "all",
    });
    return;
  }

  // Start next round!
  state.roundNumber += 1;
  state.step = "GearAndCardsStep";
  state.activeSeatNo = null;
  state.turnQueue = [];
  for (const s of state.seats) {
    s.plannedGear = null;
    s.plannedCards = [];
    s.hasAdrenaline = false;
    s.turnSpeed = 0;
  }
  state.phaseDeadlineMs = nowMs + state.config.timers.planSeconds * 1000;
}

/**
 * Checks if all unfinished seats have submitted their `plannedGear` and `plannedCards`.
 * If so, computes the round's Race Order `turnQueue`, awards Step 4 Adrenaline to trailing cars,
 * and begins sequential Step 3 resolution!
 */
function checkAllPlannedAndStartSequential(
  state: HeatMatchState,
  events: MatchEventRecord[],
  nowMs: number
): void {
  const allReady = state.seats.every(
    (s) => s.finishRank !== null || s.plannedGear !== null
  );
  if (!allReady) return;

  // Apply gear shifts and Heat costs for ±2 gear changes
  for (const s of state.seats) {
    if (s.finishRank !== null || s.plannedGear === null) continue;
    const diff = Math.abs(s.plannedGear - s.gear);
    if (diff === 2 && s.enginePile.length > 0) {
      const heatCard = s.enginePile.pop();
      if (heatCard) s.discardPile.push(heatCard);
      events.push({
        eventType: "HEAT_GEAR_OVERDRIVE",
        message: `⚙️🔥 ${s.displayName} ép số từ Số ${s.gear} → Số ${s.plannedGear} (đốt 1 Heat từ Động cơ).`,
        visibleToSeatNos: "all",
      });
    }
    s.gear = s.plannedGear;
  }

  // Sort unfinished cars in Race Order (1st place to last place)
  const activeStandings = getRaceStandings(
    state.seats.filter((s) => s.finishRank === null)
  );
  state.turnQueue = activeStandings.map((s) => s.seatNo);

  // Official Step 4 Adrenaline rule: last 1 car in <=4 car races, last 2 cars in 5-6 car races
  const adrenalineSlots = activeStandings.length >= 5 ? 2 : 1;
  activeStandings.forEach((car, idx) => {
    car.hasAdrenaline =
      activeStandings.length > 1 &&
      idx >= activeStandings.length - adrenalineSlots;
  });

  beginActiveSeatSequentialTurn(state, events, nowMs);
}

/**
 * Legends-inspired smart Bot planner for Step 1 & 2 (`PLAN_TURN`):
 * Looks ahead at the next corner's distance and speed limit, picks an optimal legal gear (avoiding spin out),
 * and selects the best combination of playable cards from hand.
 */
function chooseBotPlanCommand(
  state: HeatMatchState,
  seat: HeatSeatState
): HeatCommand {
  const track = getHeatTrack(state.config.trackId);
  const playable = seat.hand.filter((c) => c.kind !== "heat");

  // Find distance and speed limit of the next corner ahead
  let distToCorner = 20;
  let nextLimit = 7;
  for (let d = 0; d < track.totalSpaces; d++) {
    const p = seat.progress + d;
    if (p < 0) continue;
    const sIdx = progressToSpaceIndex(p, track.totalSpaces);
    const c = track.corners.find((corner) => corner.afterSpaceIndex === sIdx);
    if (c) {
      distToCorner = d + 1;
      nextLimit = c.speedLimit;
      break;
    }
  }

  // Safe maximum speed this turn if the bot might cross the upcoming corner
  const maxSafeSpeedIfCrossing = nextLimit + Math.max(0, seat.enginePile.length - 1);

  // Candidate legal gears (diff <= 1 for free, diff == 2 if engineHeat >= 2 and far from corner)
  const candidateGears: (1 | 2 | 3 | 4)[] = ([1, 2, 3, 4] as const).filter(
    (g) => {
      const diff = Math.abs(g - seat.gear);
      if (diff <= 1) return true;
      if (diff === 2 && seat.enginePile.length >= 2) return true;
      return false;
    }
  );

  const heatInHand = seat.hand.filter((c) => c.kind === "heat").length;

  // Sort playable cards by estimated speed (stress estimated as 2.5)
  const sortedAsc = [...playable].sort(
    (a, b) => (a.value ?? 2.5) - (b.value ?? 2.5)
  );
  const sortedDesc = [...playable].sort(
    (a, b) => (b.value ?? 2.5) - (a.value ?? 2.5)
  );

  let bestGear: 1 | 2 | 3 | 4 = candidateGears[0] ?? 1;
  let bestCards: HeatCard[] = sortedAsc.slice(0, bestGear);
  let bestUtility = -999;

  for (const g of candidateGears) {
    const diff = Math.abs(g - seat.gear);
    // Try both a conservative hand and an aggressive hand for gear `g`
    const options = [sortedAsc.slice(0, g), sortedDesc.slice(0, g)];
    for (const pick of options) {
      const estSpeed = pick.reduce((sum, c) => sum + (c.value ?? 3), 0);
      const crossesCorner = estSpeed >= distToCorner;
      let utility = estSpeed * 2.2;

      if (crossesCorner) {
        const excess = Math.max(0, estSpeed - nextLimit);
        if (excess > seat.enginePile.length - (diff === 2 ? 1 : 0)) {
          // Would spin out! Heavy penalty
          utility -= 100;
        } else {
          utility -= excess * 3.5;
        }
      } else {
        // Getting close to the corner without crossing it is great positioning
        utility += Math.min(estSpeed, distToCorner - 1) * 0.8;
      }

      // Reward shifting to Gear 1 or 2 when hand is cluttered with Heat cards
      if (heatInHand >= 2 && (g === 1 || g === 2)) {
        utility += heatInHand * (g === 1 ? 3.5 : 2.0);
      }
      if (diff === 2) {
        utility -= 3.5;
      }

      if (utility > bestUtility) {
        bestUtility = utility;
        bestGear = g;
        bestCards = pick;
      }
    }
  }

  return {
    type: "PLAN_TURN",
    targetGear: bestGear,
    cardIds: bestCards.map((c) => c.id),
  };
}

/**
 * Smart Bot decision maker for sequential `ReactAndSlipstreamStep`:
 * 1. Always uses available Cooldown to return Heat cards from hand to Engine.
 * 2. Uses Slipstream (+2 spaces without adding speed!) if it won't cause a spin-out on a newly crossed corner.
 * 3. Uses Adrenaline +1 speed if safe.
 * 4. Ends turn cleanly.
 */
function chooseBotReactCommand(
  state: HeatMatchState,
  seat: HeatSeatState
): HeatCommand {
  // 1. Cooldown any Heat cards sitting in hand!
  const heatCardInHand = seat.hand.find((c) => c.kind === "heat");
  if (seat.cooldownRemaining > 0 && heatCardInHand) {
    return { type: "USE_COOLDOWN", cardId: heatCardInHand.id };
  }

  // 2. Slipstream if eligible and safe!
  if (canSeatSlipstream(state, seat)) {
    const track = getHeatTrack(state.config.trackId);
    // Check if +2 spaces crosses a corner whose limit < seat.turnSpeed - engineHeat
    let safeToSlip = true;
    for (let p = seat.progress; p < seat.progress + 2; p++) {
      if (p < 0) continue;
      const sIdx = progressToSpaceIndex(p, track.totalSpaces);
      const corner = track.corners.find((c) => c.afterSpaceIndex === sIdx);
      if (corner) {
        const excess = Math.max(0, seat.turnSpeed - corner.speedLimit);
        if (excess > seat.enginePile.length) {
          safeToSlip = false;
        }
      }
    }
    if (safeToSlip) {
      return { type: "USE_SLIPSTREAM" };
    }
  }

  // 3. Adrenaline +1 space if eligible and doesn't cause overspeed
  if (seat.hasAdrenaline && !seat.usedAdrenalineSpeed) {
    const crossed = getCrossedCornersForTurn(state, seat);
    const wouldOverspeed = crossed.some(
      (c) => seat.turnSpeed + 1 > c.speedLimit
    );
    if (!wouldOverspeed && crossed.length === 0) {
      return { type: "USE_ADRENALINE_SPEED" };
    }
  }

  return { type: "END_TURN" };
}

export const heatCartridge: GameCartridge<
  HeatConfig,
  HeatMatchState,
  HeatCommand,
  HeatPlayerView
> = {
  cartridgeId: "heat",
  title: "Heat: Pedal to the Metal",
  subtitle: "Đua xe F1 thập niên 60 • Sang số, Quá nhiệt & Núp gió • 2–6 tay đua",
  description:
    "Điều khiển hộp số 4 cấp, quản lý nhiệt động cơ (Heat), ôm cua tốc độ cao và núp gió (Slipstream) trên 3 bản đồ USA, South Africa & Deutschland.",
  minSeats: 2,
  maxSeats: 6,
  available: true,

  defaultConfig(): HeatConfig {
    return {
      trackId: "usa",
      laps: 2,
      timers: {
        planSeconds: 45,
        reactSeconds: 40,
      },
    };
  },

  validateConfig(config: HeatConfig, seatCount: number) {
    if (seatCount < 2 || seatCount > 6) {
      return {
        valid: false,
        error: "Heat: Pedal to the Metal cần từ 2 đến 6 tay đua (có thể thêm Bot).",
      };
    }
    if (config?.trackId && !(config.trackId in HEAT_TRACKS)) {
      return {
        valid: false,
        error: "Bản đồ đường đua không hợp lệ.",
      };
    }
    return { valid: true };
  },

  createInitialState({ config, seats, nowMs, rng = Math.random }) {
    const rawTrackId: HeatTrackId =
      config?.trackId && config.trackId in HEAT_TRACKS ? config.trackId : "usa";
    const track = getHeatTrack(rawTrackId);
    const normalizedConfig: HeatConfig = {
      trackId: rawTrackId,
      laps: Math.max(1, Math.min(4, Number(config?.laps ?? track.defaultLaps))),
      timers: {
        planSeconds: config?.timers?.planSeconds ?? 45,
        reactSeconds: config?.timers?.reactSeconds ?? 40,
      },
    };

    const seatStates: HeatSeatState[] = seats.map((s, idx) => {
      const colorSpec = HEAT_CAR_COLORS[idx % HEAT_CAR_COLORS.length];
      const { drawPile, enginePile } = buildDriverDecks(
        s.seatNo,
        track.startingHeat,
        track.startingStress,
        rng
      );
      // Grid placement: Row 0 (Grid 1 & 2) at progress -1, Row 1 (Grid 3 & 4) at progress -2, Row 2 (Grid 5 & 6) at progress -3
      const gridRow = Math.floor(idx / 2);
      const progress = -(gridRow + 1);
      const lane: 0 | 1 = idx % 2 === 0 ? 0 : 1;

      // Draw initial 7-card hand
      const hand = drawPile.splice(drawPile.length - 7, 7);

      return {
        seatNo: s.seatNo,
        actorId: s.actorId,
        displayName: s.displayName,
        avatarSeed: s.avatarSeed ?? `heat-${s.seatNo}`,
        colorId: colorSpec.id,
        gear: 1,
        progress,
        lane,
        hand,
        drawPile,
        discardPile: [],
        enginePile,
        plannedGear: null,
        plannedCards: [],
        playedCards: [],
        turnSpeed: 0,
        turnStartProgress: progress,
        hasAdrenaline: false,
        usedAdrenalineSpeed: false,
        usedBoost: false,
        usedSlipstream: false,
        cooldownRemaining: 0,
        finishedRound: null,
        finishRank: null,
        lastSpinOutRound: null,
      };
    });

    const state: HeatMatchState = {
      config: normalizedConfig,
      roundNumber: 1,
      step: "GearAndCardsStep",
      turnQueue: [],
      activeSeatNo: null,
      seats: seatStates,
      nextFinishRank: 1,
      nextStressCardSeq: 100,
      animSeq: 1,
      lastAnim: null,
      winnerSeatNos: [],
      winReasonVi: null,
      phaseDeadlineMs: nowMs + normalizedConfig.timers.planSeconds * 1000,
    };

    const events: MatchEventRecord[] = [
      {
        eventType: "HEAT_MATCH_STARTED",
        message: `🏁 Xuất phát Grand Prix ${track.nameVi} (${normalizedConfig.laps} vòng • ${track.totalSpaces} ô/vòng • ${track.startingHeat} Heat trong Động cơ)! Tất cả tay đua hãy chọn Số (Gear) và đánh bài úp.`,
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
      throw new Error("Chặng đua đã kết thúc.");
    }

    const state = cloneState(prevState);
    const events: MatchEventRecord[] = [];
    const actor = getSeat(state, actorSeatNo);

    if (state.step === "GearAndCardsStep") {
      if (command.type !== "PLAN_TURN") {
        throw new Error("Đang ở pha Sang Số & Chọn Bài đồng thời.");
      }
      if (actor.finishRank !== null) {
        throw new Error("Xe của bạn đã hoàn thành cuộc đua.");
      }
      if (actor.plannedGear !== null) {
        throw new Error("Bạn đã xác nhận Số và bài cho vòng này rồi.");
      }

      const targetGear = command.targetGear;
      if (![1, 2, 3, 4].includes(targetGear)) {
        throw new Error("Số (Gear) phải từ 1 đến 4.");
      }

      const gearDiff = Math.abs(targetGear - actor.gear);
      if (gearDiff > 2) {
        throw new Error("Chỉ được chuyển tối đa ±2 số trong một vòng.");
      }
      if (gearDiff === 2 && actor.enginePile.length < 1) {
        throw new Error(
          "Động cơ không còn lá Heat nào để ép chuyển ±2 số cùng lúc."
        );
      }

      const playableInHand = actor.hand.filter((c) => c.kind !== "heat");
      const requiredCount = Math.min(targetGear, playableInHand.length);

      if (
        command.cardIds.length !== requiredCount ||
        new Set(command.cardIds).size !== command.cardIds.length
      ) {
        throw new Error(
          `Số ${targetGear} yêu cầu chọn đúng ${requiredCount} lá bài hợp lệ trên tay.`
        );
      }

      const selectedCards: HeatCard[] = [];
      const remainingHand: HeatCard[] = [...actor.hand];

      for (const cid of command.cardIds) {
        const idx = remainingHand.findIndex((c) => c.id === cid);
        if (idx === -1) {
          throw new Error("Lá bài đã chọn không nằm trên tay bạn.");
        }
        const picked = remainingHand[idx];
        if (picked.kind === "heat") {
          throw new Error(
            "Không được đánh lá Heat từ trên tay (chỉ có thể cất về Động cơ bằng Làm Mát / Cooldown)."
          );
        }
        selectedCards.push(picked);
        remainingHand.splice(idx, 1);
      }

      actor.hand = remainingHand;
      actor.plannedGear = targetGear;
      actor.plannedCards = selectedCards;

      setAnim(
        state,
        {
          kind: "SHIFT_PLAN",
          actorSeatNo: actor.seatNo,
          gear: targetGear,
        },
        nowMs
      );

      events.push({
        eventType: "HEAT_TURN_PLANNED",
        message: `⚙️ ${actor.displayName} đã chốt hộp số và úp bài cho Vòng ${state.roundNumber}.`,
        visibleToSeatNos: "all",
      });

      checkAllPlannedAndStartSequential(state, events, nowMs);

      return {
        state,
        events,
        phaseDeadlineMs: state.phaseDeadlineMs,
      };
    }

    // Sequential step: ReactAndSlipstreamStep
    if (state.activeSeatNo !== actorSeatNo) {
      throw new Error("Chưa đến lượt xử lý xe của bạn.");
    }

    switch (command.type) {
      case "USE_COOLDOWN": {
        if (actor.cooldownRemaining <= 0) {
          throw new Error("Bạn không còn điểm Làm Mát (Cooldown) trong lượt này.");
        }
        const heatIdx = command.cardId
          ? actor.hand.findIndex(
              (c) => c.id === command.cardId && c.kind === "heat"
            )
          : actor.hand.findIndex((c) => c.kind === "heat");

        if (heatIdx === -1) {
          throw new Error("Trên tay bạn không có lá Heat nào cần làm mát.");
        }

        const [cooledCard] = actor.hand.splice(heatIdx, 1);
        actor.enginePile.push(cooledCard);
        actor.cooldownRemaining -= 1;

        setAnim(
          state,
          {
            kind: "COOLDOWN",
            actorSeatNo: actor.seatNo,
            card: cooledCard,
          },
          nowMs
        );

        events.push({
          eventType: "HEAT_COOLDOWN",
          message: `❄️ ${actor.displayName} làm mát động cơ: chuyển 1 lá Heat từ tay về lại Engine (Engine: ${actor.enginePile.length} Heat).`,
          visibleToSeatNos: "all",
        });
        break;
      }

      case "USE_ADRENALINE_SPEED": {
        if (!actor.hasAdrenaline || actor.usedAdrenalineSpeed) {
          throw new Error("Bạn không có quyền tăng tốc Adrenaline lúc này.");
        }
        actor.usedAdrenalineSpeed = true;
        actor.turnSpeed += 1;
        const fromProgress = actor.progress;
        placeCarAtProgress(state, actor, fromProgress + 1);

        setAnim(
          state,
          {
            kind: "ADRENALINE",
            actorSeatNo: actor.seatNo,
            fromProgress,
            toProgress: actor.progress,
            speed: actor.turnSpeed,
          },
          nowMs
        );

        events.push({
          eventType: "HEAT_ADRENALINE_SPEED",
          message: `⚡ Adrenaline! ${actor.displayName} bứt tốc thêm +1 ô (Tốc độ lượt: ${actor.turnSpeed}).`,
          visibleToSeatNos: "all",
        });
        break;
      }

      case "USE_BOOST": {
        if (actor.usedBoost) {
          throw new Error("Mỗi lượt chỉ được Boost tối đa 1 lần.");
        }
        if (actor.enginePile.length < 1) {
          throw new Error("Động cơ không còn lá Heat nào để kích hoạt Boost.");
        }

        const heatPaid = actor.enginePile.pop()!;
        actor.discardPile.push(heatPaid);
        actor.usedBoost = true;

        const boostCard = flipUntilBasicSpeedCard(actor);
        const boostVal = boostCard.value ?? 1;
        actor.playedCards.push(boostCard);
        actor.turnSpeed += boostVal;

        const fromProgress = actor.progress;
        placeCarAtProgress(state, actor, fromProgress + boostVal);

        setAnim(
          state,
          {
            kind: "BOOST",
            actorSeatNo: actor.seatNo,
            fromProgress,
            toProgress: actor.progress,
            speed: actor.turnSpeed,
            card: boostCard,
            heatPaid: 1,
          },
          nowMs
        );

        events.push({
          eventType: "HEAT_BOOST",
          message: `🚀 BOOST! ${actor.displayName} đốt 1 Heat, lật được lá Tốc Độ +${boostVal} — vọt lên ô #${actor.progress + 1} (Tổng tốc độ lượt: ${actor.turnSpeed})!`,
          visibleToSeatNos: "all",
        });
        break;
      }

      case "USE_SLIPSTREAM": {
        if (!canSeatSlipstream(state, actor)) {
          throw new Error(
            "Xe của bạn hiện không đủ điều kiện Núp Gió (cần đứng ngang hàng hoặc ngay sát sau 1 xe khác và chưa qua vạch đích)."
          );
        }

        actor.usedSlipstream = true;
        const fromProgress = actor.progress;
        placeCarAtProgress(state, actor, fromProgress + 2);

        setAnim(
          state,
          {
            kind: "SLIPSTREAM",
            actorSeatNo: actor.seatNo,
            fromProgress,
            toProgress: actor.progress,
            speed: actor.turnSpeed,
          },
          nowMs
        );

        events.push({
          eventType: "HEAT_SLIPSTREAM",
          message: `💨 NÚP GIÓ (SLIPSTREAM)! ${actor.displayName} lướt thêm +2 ô miễn phí lên ô #${actor.progress + 1} mà không tăng tốc độ qua cua!`,
          visibleToSeatNos: "all",
        });
        break;
      }

      case "END_TURN": {
        completeActiveSeatTurn(
          state,
          actor,
          command.discardCardIds ?? [],
          events,
          nowMs
        );
        break;
      }

      default:
        throw new Error("Lệnh không hợp lệ ở pha Phản Ứng & Núp Gió.");
    }

    if (state.step !== "Finished") {
      state.phaseDeadlineMs = nowMs + state.config.timers.reactSeconds * 1000;
    }

    return {
      state,
      events,
      phaseDeadlineMs: state.phaseDeadlineMs,
    };
  },

  onPhaseTimeout({ state: prevState, nowMs }) {
    if (prevState.step === "Finished") {
      return { state: prevState, events: [], phaseDeadlineMs: null };
    }

    if (prevState.step === "GearAndCardsStep") {
      let current: CartridgeTransitionResult<HeatMatchState> = {
        state: prevState,
        events: [],
        phaseDeadlineMs: prevState.phaseDeadlineMs,
      };
      for (const s of prevState.seats) {
        if (s.finishRank === null && s.plannedGear === null) {
          const autoCmd = chooseBotPlanCommand(current.state, s);
          const next = this.reduce({
            state: current.state,
            command: autoCmd,
            actorSeatNo: s.seatNo,
            nowMs,
          });
          current = {
            state: next.state,
            events: [...current.events, ...next.events],
            phaseDeadlineMs: next.phaseDeadlineMs,
          };
        }
      }
      return current;
    }

    if (prevState.activeSeatNo !== null) {
      return this.reduce({
        state: prevState,
        command: { type: "END_TURN" },
        actorSeatNo: prevState.activeSeatNo,
        nowMs,
      });
    }

    return { state: prevState, events: [], phaseDeadlineMs: null };
  },

  autoActBots({ current, botSeatNos, nowMs }) {
    const botSet = new Set(botSeatNos);
    let result = current;
    let guard = 0;

    while (result.state.step !== "Finished" && guard < 48) {
      guard += 1;

      if (result.state.step === "GearAndCardsStep") {
        const pendingBot = result.state.seats.find(
          (s) =>
            botSet.has(s.seatNo) &&
            s.finishRank === null &&
            s.plannedGear === null
        );
        if (!pendingBot) break;

        const cmd = chooseBotPlanCommand(result.state, pendingBot);
        const next = this.reduce({
          state: result.state,
          command: cmd,
          actorSeatNo: pendingBot.seatNo,
          nowMs,
        });
        result = {
          state: next.state,
          events: [...result.events, ...next.events],
          phaseDeadlineMs: next.phaseDeadlineMs,
        };
        continue;
      }

      if (
        result.state.step === "ReactAndSlipstreamStep" &&
        result.state.activeSeatNo !== null &&
        botSet.has(result.state.activeSeatNo)
      ) {
        const activeBot = getSeat(result.state, result.state.activeSeatNo);
        const cmd = chooseBotReactCommand(result.state, activeBot);
        const next = this.reduce({
          state: result.state,
          command: cmd,
          actorSeatNo: activeBot.seatNo,
          nowMs,
        });
        result = {
          state: next.state,
          events: [...result.events, ...next.events],
          phaseDeadlineMs: next.phaseDeadlineMs,
        };
        continue;
      }

      break;
    }

    return result;
  },

  projectView({ state, viewerSeatNo }): HeatPlayerView {
    const track = getHeatTrack(state.config.trackId);
    const finishProgress = state.config.laps * track.totalSpaces;
    const standings = getRaceStandings(state.seats);
    const rankBySeatNo = new Map<number, number>();
    standings.forEach((s, idx) => rankBySeatNo.set(s.seatNo, idx + 1));

    const mySeat =
      viewerSeatNo !== null
        ? state.seats.find((s) => s.seatNo === viewerSeatNo) ?? null
        : null;

    const activeSeat =
      state.activeSeatNo !== null
        ? state.seats.find((s) => s.seatNo === state.activeSeatNo) ?? null
        : null;

    const crossedCornersPreview = activeSeat
      ? getCrossedCornersForTurn(state, activeSeat)
      : [];

    return {
      cartridgeId: "heat",
      roundNumber: state.roundNumber,
      step: state.step,
      turnQueue: state.turnQueue,
      activeSeatNo: state.activeSeatNo,
      viewerSeatNo,
      track,
      totalLaps: state.config.laps,
      finishProgress,
      seats: state.seats.map((s) => {
        const sIdx = progressToSpaceIndex(s.progress, track.totalSpaces);
        return {
          seatNo: s.seatNo,
          actorId: s.actorId,
          displayName: s.displayName,
          avatarSeed: s.avatarSeed,
          colorId: s.colorId,
          gear: s.gear,
          progress: s.progress,
          spaceIndex: sIdx,
          lap: progressToLap(s.progress, track.totalSpaces, state.config.laps),
          lane: s.lane,
          raceRank: rankBySeatNo.get(s.seatNo) ?? s.seatNo,
          handCount: s.hand.length,
          drawPileCount: s.drawPile.length,
          discardPileCount: s.discardPile.length,
          discardTopCard:
            s.discardPile.length > 0
              ? s.discardPile[s.discardPile.length - 1]
              : null,
          engineHeatCount: s.enginePile.length,
          hasPlanned: s.plannedGear !== null,
          playedCards: s.playedCards,
          turnSpeed: s.turnSpeed,
          turnStartProgress: s.turnStartProgress,
          hasAdrenaline: s.hasAdrenaline,
          usedAdrenalineSpeed: s.usedAdrenalineSpeed,
          usedBoost: s.usedBoost,
          usedSlipstream: s.usedSlipstream,
          cooldownRemaining: s.cooldownRemaining,
          finishedRound: s.finishedRound,
          finishRank: s.finishRank,
          lastSpinOutRound: s.lastSpinOutRound,
          onGravel:
            s.progress >= 0 &&
            s.progress < finishProgress &&
            track.gravelSpaces.includes(sIdx),
        };
      }),
      myHand: mySeat ? mySeat.hand : [],
      myPlannedGear: mySeat ? mySeat.plannedGear : null,
      myPlannedCardIds: mySeat ? mySeat.plannedCards.map((c) => c.id) : [],
      canSlipstream: activeSeat ? canSeatSlipstream(state, activeSeat) : false,
      canBoost: activeSeat
        ? !activeSeat.usedBoost && activeSeat.enginePile.length > 0
        : false,
      canCooldown: activeSeat
        ? activeSeat.cooldownRemaining > 0 &&
          activeSeat.hand.some((c) => c.kind === "heat")
        : false,
      canAdrenalineSpeed: activeSeat
        ? activeSeat.hasAdrenaline && !activeSeat.usedAdrenalineSpeed
        : false,
      crossedCornersPreview,
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
        label: "Radio Đường Đua",
        canRead: true,
        canWrite: viewerSeatNo !== null,
      },
    ];
  },

  isMatchOver(state) {
    return state.step === "Finished";
  },

  getWinningFaction(state) {
    if (state.step !== "Finished" || state.winnerSeatNos.length === 0) {
      return null;
    }
    return `SEAT_${state.winnerSeatNos.join("_")}`;
  },
};
