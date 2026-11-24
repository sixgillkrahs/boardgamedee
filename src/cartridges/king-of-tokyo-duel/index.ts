import type {
  CartridgeTransitionResult,
  ChannelPermission,
  GameCartridge,
  MatchEventRecord,
  SeatDescriptor,
} from "@/cartridges/types";

export type KotMonsterId =
  | "gigazaur"
  | "cyber_kitty"
  | "the_king"
  | "space_penguin"
  | "meka_dragon"
  | "alienoid";

export interface KotMonsterMeta {
  id: KotMonsterId;
  name: string;
  titleVi: string;
  maxHp: number;
  powerNameVi: string;
  powerDescVi: string;
  accentColor: string;
  emoji: string;
}

export const KOT_MONSTER_IDS: KotMonsterId[] = [
  "gigazaur",
  "cyber_kitty",
  "the_king",
  "space_penguin",
  "meka_dragon",
  "alienoid",
];

export const KOT_MONSTERS: Record<KotMonsterId, KotMonsterMeta> = {
  gigazaur: {
    id: "gigazaur",
    name: "Gigazaur",
    titleVi: "Khủng Long Nguyên Tử",
    maxHp: 14,
    powerNameVi: "Bom Tấn (Blockbuster)",
    powerDescVi:
      "Có ≥ 1 [!] thì chỉ cần 2 ⭐ hoặc 2 🏢 để kéo thanh (thay vì 3); có ≥ 2 [!] kéo thêm +1 bước thanh yếu hơn.",
    accentColor: "#22c55e",
    emoji: "🦖",
  },
  cyber_kitty: {
    id: "cyber_kitty",
    name: "Cyber Kitty",
    titleVi: "Mèo Siêu Năng Lượng",
    maxHp: 13,
    powerNameVi: "Cơn Bão Năng Lượng",
    powerDescVi: "Ra 2 [!] nhận +2 ⚡ Năng Lượng; ra ≥ 3 [!] nhận ngay +4 ⚡!",
    accentColor: "#ec4899",
    emoji: "🐱",
  },
  the_king: {
    id: "the_king",
    name: "The King",
    titleVi: "Vua Khỉ Đột Tokyo",
    maxHp: 15,
    powerNameVi: "Lãnh Thổ Độc Tôn",
    powerDescVi:
      "Máu tối đa 15 HP; ra ≥ 2 [!] thả Token Buzz (+1 bước kéo về phía bạn) lên thanh Danh Vọng/Phá Hủy!",
    accentColor: "#f59e0b",
    emoji: "🦍",
  },
  space_penguin: {
    id: "space_penguin",
    name: "Space Penguin",
    titleVi: "Cánh Cụt Vũ Trụ",
    maxHp: 13,
    powerNameVi: "Thiết Bị Đông Lạnh",
    powerDescVi:
      "Ra ≥ 2 [!] nhận +1 Xúc Xắc thưởng cho lượt kế tiếp (tối đa +2) & hồi +1 ❤️!",
    accentColor: "#38bdf8",
    emoji: "🐧",
  },
  meka_dragon: {
    id: "meka_dragon",
    name: "Meka Dragon",
    titleVi: "Rồng Cơ Khí Hủy Diệt",
    maxHp: 12,
    powerNameVi: "Hơi Thở Hạt Nhân",
    powerDescVi:
      "Ra 2 [!] gây thêm +2 sát thương; ra ≥ 3 [!] gây thêm +4 sát thương trực tiếp lên đối thủ!",
    accentColor: "#ef4444",
    emoji: "🐉",
  },
  alienoid: {
    id: "alienoid",
    name: "Alienoid",
    titleVi: "Sinh Vật Ngoài Hành Tinh",
    maxHp: 14,
    powerNameVi: "Công Nghệ Vũ Trụ",
    powerDescVi:
      "Ra ≥ 2 [!] nhận đồng thời +1 ⚡ Năng Lượng, +1 ❤️ Hồi Máu và gây +1 sát thương 🐾!",
    accentColor: "#84cc16",
    emoji: "👽",
  },
};

export type KotDieFace =
  | "claw"
  | "heal"
  | "energy"
  | "star"
  | "building"
  | "special";

export const KOT_DIE_FACES: KotDieFace[] = [
  "claw",
  "heal",
  "energy",
  "star",
  "building",
  "special",
];

export const KOT_DIE_META: Record<
  KotDieFace,
  { nameVi: string; shortVi: string; emoji: string; color: string }
> = {
  claw: { nameVi: "Cào (Sát thương)", shortVi: "Cào", emoji: "🐾", color: "#ef4444" },
  heal: { nameVi: "Hồi Máu", shortVi: "Hồi HP", emoji: "❤️", color: "#34d399" },
  energy: { nameVi: "Năng Lượng", shortVi: "Năng lượng", emoji: "⚡", color: "#a3e635" },
  star: { nameVi: "Danh Vọng (3+ kéo)", shortVi: "Danh Vọng", emoji: "⭐", color: "#facc15" },
  building: { nameVi: "Phá Hủy (3+ kéo)", shortVi: "Phá Hủy", emoji: "🏢", color: "#f97316" },
  special: { nameVi: "Kỹ Năng Quái Vật (!)", shortVi: "Đặc Biệt !", emoji: "❗", color: "#e879f9" },
};

export interface KotDieState {
  id: number;
  face: KotDieFace;
  locked: boolean;
}

export type KotTrackType = "fame" | "destruction";

export type KotBuzzKind = "ENERGY_2" | "HEAL_2" | "DMG_1" | "BONUS_DIE" | "PULL_1";

export interface KotBuzzToken {
  id: string;
  track: KotTrackType;
  /** Position on track from -5 to +5 (Seat 1 pulls toward -6, Seat 2 pulls toward +6) */
  pos: number;
  kind: KotBuzzKind;
  labelVi: string;
}

export type KotPowerCardKind = "DISCARD" | "KEEP";

export type KotPowerEffectId =
  | "DMG_3"
  | "HEAL_4"
  | "FAME_2"
  | "DESTRUCT_2"
  | "DMG_2_DESTRUCT_1"
  | "FAME_2_HEAL_1"
  | "DMG_4_SELF_1"
  | "BOTH_TRACKS_1"
  | "ENERGY_3_HEAL_2"
  | "BONUS_CLAW_1"
  | "ARMOR_1"
  | "TURN_ENERGY_1"
  | "EXTRA_DIE_1"
  | "TURN_HEAL_1"
  | "EXTRA_ROLL_1"
  | "BOOST_DESTRUCT_1"
  | "BOOST_FAME_1"
  | "LIFESTEAL_1"
  | "DISCOUNT_1";

export interface KotPowerCard {
  id: string;
  nameVi: string;
  cost: number;
  kind: KotPowerCardKind;
  effectId: KotPowerEffectId;
  descVi: string;
  emoji: string;
}

export const KOT_POWER_DECK_TEMPLATE: KotPowerCard[] = [
  // DISCARD (Instant tactical spikes!)
  {
    id: "kot-beam",
    nameVi: "Tia Hủy Diệt",
    cost: 4,
    kind: "DISCARD",
    effectId: "DMG_3",
    descVi: "Gây ngay 3 sát thương trực tiếp cho đối thủ!",
    emoji: "🔥",
  },
  {
    id: "kot-nuke-heal",
    nameVi: "Nạp Nguyên Tử",
    cost: 4,
    kind: "DISCARD",
    effectId: "HEAL_4",
    descVi: "Hồi ngay +4 ❤️ Máu (không vượt tối đa).",
    emoji: "💚",
  },
  {
    id: "kot-media-storm",
    nameVi: "Bão Truyền Thông",
    cost: 4,
    kind: "DISCARD",
    effectId: "FAME_2",
    descVi: "Kéo thanh Danh Vọng ⭐ về phía bạn +2 bước!",
    emoji: "📺",
  },
  {
    id: "kot-quake",
    nameVi: "Động Đất Tokyo",
    cost: 4,
    kind: "DISCARD",
    effectId: "DESTRUCT_2",
    descVi: "Kéo thanh Phá Hủy 🏢 về phía bạn +2 bước!",
    emoji: "🌋",
  },
  {
    id: "kot-shockwave",
    nameVi: "Sóng Xung Kích",
    cost: 5,
    kind: "DISCARD",
    effectId: "DMG_2_DESTRUCT_1",
    descVi: "Gây 2 sát thương & kéo Phá Hủy 🏢 +1 bước.",
    emoji: "💥",
  },
  {
    id: "kot-live-tv",
    nameVi: "Lên Sóng Trực Tiếp",
    cost: 5,
    kind: "DISCARD",
    effectId: "FAME_2_HEAL_1",
    descVi: "Kéo Danh Vọng ⭐ +2 bước & hồi +1 ❤️ Máu.",
    emoji: "🎬",
  },
  {
    id: "kot-meltdown",
    nameVi: "Quá Tải Lò Hạt Nhân",
    cost: 5,
    kind: "DISCARD",
    effectId: "DMG_4_SELF_1",
    descVi: "Gây 4 sát thương cho đối thủ (bạn chịu 1 sát thương).",
    emoji: "☢️",
  },
  {
    id: "kot-dual-strike",
    nameVi: "Bệ Phóng Kép",
    cost: 5,
    kind: "DISCARD",
    effectId: "BOTH_TRACKS_1",
    descVi: "Kéo CẢ Danh Vọng ⭐ +1 và Phá Hủy 🏢 +1 bước!",
    emoji: "🚀",
  },
  {
    id: "kot-overcharge",
    nameVi: "Bình Sạc Khẩn Cấp",
    cost: 2,
    kind: "DISCARD",
    effectId: "ENERGY_3_HEAL_2",
    descVi: "Nhận +3 ⚡ Năng Lượng & hồi +2 ❤️ Máu.",
    emoji: "🔋",
  },
  // KEEP (Permanent Kaiju Evolutions!)
  {
    id: "kot-titan-claws",
    nameVi: "Móng Vuốt Titan",
    cost: 5,
    kind: "KEEP",
    effectId: "BONUS_CLAW_1",
    descVi: "Vĩnh viễn: Mỗi lượt có ít nhất 1 🐾 gây thêm +1 sát thương.",
    emoji: "⚔️",
  },
  {
    id: "kot-armor",
    nameVi: "Giáp Hợp Kim Tokyo",
    cost: 5,
    kind: "KEEP",
    effectId: "ARMOR_1",
    descVi: "Vĩnh viễn: Giảm 1 sát thương mỗi khi bị đánh ≥ 2 sát thương.",
    emoji: "🛡️",
  },
  {
    id: "kot-reactor",
    nameVi: "Lò Năng Lượng Mini",
    cost: 4,
    kind: "KEEP",
    effectId: "TURN_ENERGY_1",
    descVi: "Vĩnh viễn: Đầu mỗi lượt tự động nhận +1 ⚡ Năng Lượng.",
    emoji: "⚡",
  },
  {
    id: "kot-extra-die",
    nameVi: "Xúc Xắc Bổ Trợ",
    cost: 6,
    kind: "KEEP",
    effectId: "EXTRA_DIE_1",
    descVi: "Vĩnh viễn: Tung thêm +1 Xúc Xắc mỗi lượt!",
    emoji: "🎲",
  },
  {
    id: "kot-regen",
    nameVi: "Tái Tạo Tế Bào",
    cost: 5,
    kind: "KEEP",
    effectId: "TURN_HEAL_1",
    descVi: "Vĩnh viễn: Đầu mỗi lượt tự động hồi +1 ❤️ Máu.",
    emoji: "🧬",
  },
  {
    id: "kot-jetpack",
    nameVi: "Cánh Phản Lực",
    cost: 4,
    kind: "KEEP",
    effectId: "EXTRA_ROLL_1",
    descVi: "Vĩnh viễn: Được tung xúc xắc tối đa 4 lần/lượt (thay vì 3).",
    emoji: "🪽",
  },
  {
    id: "kot-siege",
    nameVi: "Đầu Đạn Công Phá",
    cost: 5,
    kind: "KEEP",
    effectId: "BOOST_DESTRUCT_1",
    descVi: "Vĩnh viễn: Mỗi khi kéo Phá Hủy 🏢 bằng xúc xắc, kéo thêm +1 bước!",
    emoji: "💣",
  },
  {
    id: "kot-idol",
    nameVi: "Ngôi Sao Điện Ảnh",
    cost: 5,
    kind: "KEEP",
    effectId: "BOOST_FAME_1",
    descVi: "Vĩnh viễn: Mỗi khi kéo Danh Vọng ⭐ bằng xúc xắc, kéo thêm +1 bước!",
    emoji: "🌟",
  },
  {
    id: "kot-vamp",
    nameVi: "Hút Sinh Lực Kaiju",
    cost: 5,
    kind: "KEEP",
    effectId: "LIFESTEAL_1",
    descVi: "Vĩnh viễn: Khi gây ≥ 3 sát thương bằng xúc xắc, hồi +1 ❤️ Máu.",
    emoji: "🩸",
  },
  {
    id: "kot-discount",
    nameVi: "Chợ Đen Shibuya",
    cost: 3,
    kind: "KEEP",
    effectId: "DISCOUNT_1",
    descVi: "Vĩnh viễn: Giảm 1 ⚡ giá mua mọi Thẻ Sức Mạnh (tối thiểu 1 ⚡).",
    emoji: "🏷️",
  },
];

export type KotStep =
  | "MonsterPickStep"
  | "RollDiceStep"
  | "BuyCardsStep"
  | "Finished";

export interface KotConfig {
  timers: {
    turnSeconds: number;
  };
}

export interface KotSeatState {
  seatNo: number;
  actorId: string;
  displayName: string;
  avatarSeed: string;
  monsterId: KotMonsterId | null;
  hp: number;
  maxHp: number;
  energy: number;
  bonusDiceNextTurn: number;
  keepCards: KotPowerCard[];
}

export interface KotLastAnim {
  id: number;
  kind:
    | "ROLL"
    | "RESOLVE"
    | "ATTACK"
    | "HEAL"
    | "BUY_CARD"
    | "FLUSH"
    | "BUZZ"
    | "MONSTER_POWER"
    | "VICTORY";
  actorSeatNo: number;
  targetSeatNo?: number;
  damage?: number;
  heal?: number;
  energyGain?: number;
  fameDelta?: number;
  destructionDelta?: number;
  labelVi?: string;
  atMs: number;
}

export interface KotMatchState {
  config: KotConfig;
  turnNumber: number;
  step: KotStep;
  activeSeatNo: number;
  seats: KotSeatState[];
  /** Fame tug-of-war: -6 (Seat 1 Win) .. 0 (Center) .. +6 (Seat 2 Win); Spotlight Zones: -3..-5 (Seat 1), +3..+5 (Seat 2) */
  famePos: number;
  /** Destruction tug-of-war: -6 (Seat 1 Win) .. 0 (Center) .. +6 (Seat 2 Win) */
  destructionPos: number;
  buzzTokens: KotBuzzToken[];
  dice: KotDieState[];
  rollsLeft: number;
  maxRollsThisTurn: number;
  market: KotPowerCard[];
  deck: KotPowerCard[];
  animSeq: number;
  lastAnim: KotLastAnim | null;
  winnerSeatNo: number | null;
  winReasonVi: string | null;
  phaseDeadlineMs: number | null;
}

export type KotCommand =
  | { type: "PICK_MONSTER"; monsterId: KotMonsterId }
  | { type: "TOGGLE_DIE"; dieIndex: number }
  | { type: "REROLL" }
  | { type: "RESOLVE_DICE" }
  | { type: "BUY_CARD"; cardId: string }
  | { type: "FLUSH_MARKET" }
  | { type: "END_TURN" };

export interface KotPlayerView {
  cartridgeId: "king-of-tokyo-duel";
  turnNumber: number;
  step: KotStep;
  activeSeatNo: number;
  viewerSeatNo: number | null;
  seats: KotSeatState[];
  famePos: number;
  destructionPos: number;
  buzzTokens: KotBuzzToken[];
  dice: KotDieState[];
  rollsLeft: number;
  maxRollsThisTurn: number;
  market: KotPowerCard[];
  deckCount: number;
  lastAnim: KotLastAnim | null;
  winnerSeatNo: number | null;
  winReasonVi: string | null;
  phaseDeadlineMs: number | null;
  config: KotConfig;
}

export const KOT_SPOTLIGHT_THRESHOLD = 3;
export const KOT_WIN_TRACK_POS = 7;

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function rollRandomFace(rng: () => number): KotDieFace {
  return KOT_DIE_FACES[Math.floor(rng() * KOT_DIE_FACES.length)];
}

function hasKeepEffect(seat: KotSeatState, effectId: KotPowerEffectId): boolean {
  return seat.keepCards.some((c) => c.effectId === effectId);
}

export function getEffectiveCardCost(
  seat: KotSeatState,
  card: KotPowerCard
): number {
  const discount = hasKeepEffect(seat, "DISCOUNT_1") ? 1 : 0;
  return Math.max(1, card.cost - discount);
}

function cloneState(state: KotMatchState): KotMatchState {
  return {
    ...state,
    seats: state.seats.map((s) => ({
      ...s,
      keepCards: [...s.keepCards],
    })),
    buzzTokens: state.buzzTokens.map((b) => ({ ...b })),
    dice: state.dice.map((d) => ({ ...d })),
    market: [...state.market],
    deck: [...state.deck],
  };
}

function getSeat(state: KotMatchState, seatNo: number): KotSeatState {
  const seat = state.seats.find((s) => s.seatNo === seatNo);
  if (!seat) throw new Error("Không tìm thấy ghế người chơi.");
  return seat;
}

function getOpponent(state: KotMatchState, seatNo: number): KotSeatState {
  const opp = state.seats.find((s) => s.seatNo !== seatNo);
  if (!opp) throw new Error("Không tìm thấy đối thủ.");
  return opp;
}

/** Pull direction on both tracks: Seat 1 pulls toward -6 (-1), Seat 2 pulls toward +6 (+1) */
function pullDirForSeat(state: KotMatchState, seatNo: number): -1 | 1 {
  return state.seats[0]?.seatNo === seatNo ? -1 : 1;
}

function setAnim(
  state: KotMatchState,
  anim: Omit<KotLastAnim, "id" | "atMs">,
  nowMs: number
) {
  state.animSeq += 1;
  state.lastAnim = {
    ...anim,
    id: state.animSeq,
    atMs: nowMs,
  };
}

function makeDeadline(state: KotMatchState, nowMs: number): number {
  return nowMs + state.config.timers.turnSeconds * 1000;
}

function checkVictory(
  state: KotMatchState,
  events: MatchEventRecord[],
  nowMs: number
): boolean {
  const [s1, s2] = state.seats;
  if (!s1 || !s2) return false;

  let winner: KotSeatState | null = null;
  let reason: string | null = null;

  if (s2.hp <= 0 && s1.hp > 0) {
    winner = s1;
    reason = `💀 HẠ GỤC KO! ${s1.displayName} đánh gục ${s2.displayName} về 0 HP!`;
  } else if (s1.hp <= 0 && s2.hp > 0) {
    winner = s2;
    reason = `💀 HẠ GỤC KO! ${s2.displayName} đánh gục ${s1.displayName} về 0 HP!`;
  } else if (s1.hp <= 0 && s2.hp <= 0) {
    winner = getSeat(state, state.activeSeatNo);
    reason = `💀 ĐÒN QUYẾT TỬ! ${winner.displayName} tung đòn kết liễu cuối cùng!`;
  } else if (state.famePos <= -KOT_WIN_TRACK_POS) {
    winner = s1;
    reason = `⭐ THỐNG TRỊ DANH VỌNG! ${s1.displayName} kéo chạm đỉnh Danh Vọng Tokyo!`;
  } else if (state.famePos >= KOT_WIN_TRACK_POS) {
    winner = s2;
    reason = `⭐ THỐNG TRỊ DANH VỌNG! ${s2.displayName} kéo chạm đỉnh Danh Vọng Tokyo!`;
  } else if (state.destructionPos <= -KOT_WIN_TRACK_POS) {
    winner = s1;
    reason = `🏢 THỐNG TRỊ PHÁ HỦY! ${s1.displayName} san phẳng toàn bộ Tokyo!`;
  } else if (state.destructionPos >= KOT_WIN_TRACK_POS) {
    winner = s2;
    reason = `🏢 THỐNG TRỊ PHÁ HỦY! ${s2.displayName} san phẳng toàn bộ Tokyo!`;
  } else if (
    state.famePos <= -KOT_SPOTLIGHT_THRESHOLD &&
    state.destructionPos <= -KOT_SPOTLIGHT_THRESHOLD
  ) {
    winner = s1;
    reason = `🔦 CHIẾN THẮNG SPOTLIGHT KÉP! ${s1.displayName} đưa cả Danh Vọng & Phá Hủy vào vùng Spotlight!`;
  } else if (
    state.famePos >= KOT_SPOTLIGHT_THRESHOLD &&
    state.destructionPos >= KOT_SPOTLIGHT_THRESHOLD
  ) {
    winner = s2;
    reason = `🔦 CHIẾN THẮNG SPOTLIGHT KÉP! ${s2.displayName} đưa cả Danh Vọng & Phá Hủy vào vùng Spotlight!`;
  }

  if (winner && reason) {
    state.step = "Finished";
    state.winnerSeatNo = winner.seatNo;
    state.winReasonVi = reason;
    state.phaseDeadlineMs = null;
    setAnim(
      state,
      {
        kind: "VICTORY",
        actorSeatNo: winner.seatNo,
        labelVi: reason,
      },
      nowMs
    );
    events.push({
      eventType: "KOT_VICTORY",
      message: `👑 ${reason}`,
      visibleToSeatNos: "all",
    });
    return true;
  }

  return false;
}

function applyDamage(
  target: KotSeatState,
  rawDamage: number,
  ignoreArmor = false
): number {
  if (rawDamage <= 0) return 0;
  let dmg = rawDamage;
  if (!ignoreArmor && dmg >= 2 && hasKeepEffect(target, "ARMOR_1")) {
    dmg = Math.max(1, dmg - 1);
  }
  target.hp = Math.max(0, target.hp - dmg);
  return dmg;
}

function applyHeal(seat: KotSeatState, amount: number): number {
  if (amount <= 0) return 0;
  const before = seat.hp;
  seat.hp = Math.min(seat.maxHp, seat.hp + amount);
  return seat.hp - before;
}

function pullTrack(
  state: KotMatchState,
  actorSeatNo: number,
  track: KotTrackType,
  steps: number,
  events: MatchEventRecord[]
): number {
  if (steps <= 0) return 0;
  const dir = pullDirForSeat(state, actorSeatNo);
  const actor = getSeat(state, actorSeatNo);
  const opp = getOpponent(state, actorSeatNo);
  let moved = 0;

  for (let i = 0; i < steps; i++) {
    const cur = track === "fame" ? state.famePos : state.destructionPos;
    const next = Math.max(
      -KOT_WIN_TRACK_POS,
      Math.min(KOT_WIN_TRACK_POS, cur + dir)
    );
    if (next === cur) break;

    if (track === "fame") state.famePos = next;
    else state.destructionPos = next;
    moved += 1;

    // Trigger & consume any Buzz Token landed on!
    const buzzIdx = state.buzzTokens.findIndex(
      (b) => b.track === track && b.pos === next
    );
    if (buzzIdx >= 0) {
      const [buzz] = state.buzzTokens.splice(buzzIdx, 1);
      if (buzz.kind === "ENERGY_2") {
        actor.energy += 2;
      } else if (buzz.kind === "HEAL_2") {
        applyHeal(actor, 2);
      } else if (buzz.kind === "DMG_1") {
        applyDamage(opp, 1, true);
      } else if (buzz.kind === "BONUS_DIE") {
        actor.bonusDiceNextTurn = Math.min(2, actor.bonusDiceNextTurn + 1);
      } else if (buzz.kind === "PULL_1") {
        const extra = Math.max(
          -KOT_WIN_TRACK_POS,
          Math.min(KOT_WIN_TRACK_POS, next + dir)
        );
        if (track === "fame") state.famePos = extra;
        else state.destructionPos = extra;
      }
      events.push({
        eventType: "KOT_BUZZ_TRIGGERED",
        message: `✨ Token Buzz kích hoạt! ${actor.displayName} nhận thưởng: ${buzz.labelVi}`,
        visibleToSeatNos: "all",
      });
    }
  }

  return moved;
}

function beginTurnRoll(
  state: KotMatchState,
  events: MatchEventRecord[],
  nowMs: number,
  rng: () => number
) {
  const actor = getSeat(state, state.activeSeatNo);

  // Start-of-turn Keep card triggers
  if (hasKeepEffect(actor, "TURN_ENERGY_1")) {
    actor.energy += 1;
  }
  if (hasKeepEffect(actor, "TURN_HEAL_1")) {
    applyHeal(actor, 1);
  }

  // Official first-turn balancing: Seat 1 rolls 5 dice on Turn 1; standard turns roll 6 dice!
  const baseDice = state.turnNumber === 1 ? 5 : 6;
  const keepExtra = hasKeepEffect(actor, "EXTRA_DIE_1") ? 1 : 0;
  const totalDice = Math.min(8, baseDice + keepExtra + actor.bonusDiceNextTurn);
  actor.bonusDiceNextTurn = 0;

  const maxRolls = hasKeepEffect(actor, "EXTRA_ROLL_1") ? 4 : 3;
  state.maxRollsThisTurn = maxRolls;
  state.rollsLeft = maxRolls - 1; // Initial roll consumes 1st roll!
  state.dice = Array.from({ length: totalDice }, (_, id) => ({
    id,
    face: rollRandomFace(rng),
    locked: false,
  }));
  state.step = "RollDiceStep";
  state.phaseDeadlineMs = makeDeadline(state, nowMs);

  setAnim(
    state,
    {
      kind: "ROLL",
      actorSeatNo: actor.seatNo,
      labelVi: `${actor.displayName} tung ${totalDice} xúc xắc!`,
    },
    nowMs
  );

  events.push({
    eventType: "KOT_TURN_START",
    message: `🎲 Lượt ${state.turnNumber}: ${actor.displayName} tung ${totalDice} xúc xắc Kaiju!`,
    visibleToSeatNos: "all",
  });
}

function refillMarketSlot(state: KotMatchState) {
  while (state.market.length < 3 && state.deck.length > 0) {
    const next = state.deck.pop();
    if (next) state.market.push(next);
  }
}

function createInitialBuzzTokens(): KotBuzzToken[] {
  return [
    { id: "buzz-f-n2", track: "fame", pos: -2, kind: "ENERGY_2", labelVi: "+2 ⚡ Năng Lượng" },
    { id: "buzz-f-p2", track: "fame", pos: 2, kind: "ENERGY_2", labelVi: "+2 ⚡ Năng Lượng" },
    { id: "buzz-d-n2", track: "destruction", pos: -2, kind: "HEAL_2", labelVi: "+2 ❤️ Hồi Máu" },
    { id: "buzz-d-p2", track: "destruction", pos: 2, kind: "HEAL_2", labelVi: "+2 ❤️ Hồi Máu" },
    { id: "buzz-f-n4", track: "fame", pos: -4, kind: "BONUS_DIE", labelVi: "+1 🎲 Xúc Xắc lượt sau" },
    { id: "buzz-f-p4", track: "fame", pos: 4, kind: "BONUS_DIE", labelVi: "+1 🎲 Xúc Xắc lượt sau" },
    { id: "buzz-d-n4", track: "destruction", pos: -4, kind: "DMG_1", labelVi: "Gây ngay 1 🐾 sát thương" },
    { id: "buzz-d-p4", track: "destruction", pos: 4, kind: "DMG_1", labelVi: "Gây ngay 1 🐾 sát thương" },
  ];
}

function chooseBotCommand(state: KotMatchState): KotCommand {
  const actor = getSeat(state, state.activeSeatNo);
  const opp = getOpponent(state, state.activeSeatNo);
  const dir = pullDirForSeat(state, actor.seatNo);

  if (state.step === "MonsterPickStep") {
    const taken = new Set(
      state.seats.map((s) => s.monsterId).filter(Boolean) as KotMonsterId[]
    );
    const available = KOT_MONSTER_IDS.filter((id) => !taken.has(id));
    return { type: "PICK_MONSTER", monsterId: available[0] ?? "gigazaur" };
  }

  if (state.step === "RollDiceStep") {
    if (state.rollsLeft <= 0) {
      return { type: "RESOLVE_DICE" };
    }
    const counts: Record<KotDieFace, number> = {
      claw: 0,
      heal: 0,
      energy: 0,
      star: 0,
      building: 0,
      special: 0,
    };
    for (const d of state.dice) counts[d.face] += 1;

    // Decide which faces are worth keeping
    const lowHp = actor.hp <= 6;
    const oppLowHp = opp.hp <= 5;
    const nearFame = dir * state.famePos >= 2;
    const nearDest = dir * state.destructionPos >= 2;

    const wantLock = (face: KotDieFace): boolean => {
      if (face === "claw") return oppLowHp || counts.claw >= 2;
      if (face === "heal") return lowHp && actor.hp < actor.maxHp;
      if (face === "star") return counts.star >= 2 || nearFame;
      if (face === "building") return counts.building >= 2 || nearDest;
      if (face === "special") return counts.special >= 2;
      if (face === "energy") return actor.energy < 4 && counts.energy >= 2;
      return false;
    };

    // Toggle first die whose lock state differs from desired
    for (let i = 0; i < state.dice.length; i++) {
      const d = state.dice[i];
      const desired = wantLock(d.face);
      if (d.locked !== desired) {
        return { type: "TOGGLE_DIE", dieIndex: i };
      }
    }

    // If all dice are locked, resolve immediately; otherwise reroll!
    if (state.dice.every((d) => d.locked)) {
      return { type: "RESOLVE_DICE" };
    }
    return { type: "REROLL" };
  }

  // BuyCardsStep: buy best affordable card, then END_TURN
  const affordable = state.market
    .filter((c) => getEffectiveCardCost(actor, c) <= actor.energy)
    .sort((a, b) => b.cost - a.cost);
  if (affordable.length > 0) {
    return { type: "BUY_CARD", cardId: affordable[0].id };
  }
  return { type: "END_TURN" };
}

export const kingOfTokyoDuelCartridge: GameCartridge<
  KotConfig,
  KotMatchState,
  KotCommand,
  KotPlayerView
> = {
  cartridgeId: "king-of-tokyo-duel",
  title: "King of Tokyo: Duel",
  subtitle: "Đại Chiến Kaiju 1v1 • Xúc Xắc & Kéo Co Tokyo",
  description:
    "Chọn 1 trong 6 siêu quái vật Kaiju, tung 6 xúc xắc Tokyo và kéo co 2 thanh Danh Vọng & Phá Hủy. Hạ gục đối thủ về 0 HP, chạm đỉnh 1 thanh hoặc chiếm cả 2 vùng Spotlight để xưng Vương Tokyo!",
  minSeats: 2,
  maxSeats: 2,
  available: true,

  defaultConfig(): KotConfig {
    return {
      timers: {
        turnSeconds: 60,
      },
    };
  },

  validateConfig(config: KotConfig, seatCount: number) {
    if (seatCount !== 2) {
      return {
        valid: false,
        error: "King of Tokyo: Duel là game đối kháng đúng 2 người chơi (1v1).",
      };
    }
    const sec = config?.timers?.turnSeconds ?? 60;
    if (sec < 20 || sec > 180) {
      return {
        valid: false,
        error: "Thời gian mỗi lượt phải trong khoảng 20–180 giây.",
      };
    }
    return { valid: true };
  },

  createInitialState({ config, seats, nowMs, rng = Math.random }) {
    const shuffledDeck = shuffle(KOT_POWER_DECK_TEMPLATE, rng);
    const market = shuffledDeck.splice(0, 3);

    const kotSeats: KotSeatState[] = seats.map((s) => ({
      seatNo: s.seatNo,
      actorId: s.actorId,
      displayName: s.displayName,
      avatarSeed: s.avatarSeed ?? s.displayName,
      monsterId: null,
      hp: 14,
      maxHp: 14,
      energy: 0,
      bonusDiceNextTurn: 0,
      keepCards: [],
    }));

    const firstSeatNo = kotSeats[0]?.seatNo ?? 1;
    const state: KotMatchState = {
      config: {
        timers: {
          turnSeconds: config?.timers?.turnSeconds ?? 60,
        },
      },
      turnNumber: 1,
      step: "MonsterPickStep",
      activeSeatNo: firstSeatNo,
      seats: kotSeats,
      famePos: 0,
      destructionPos: 0,
      buzzTokens: createInitialBuzzTokens(),
      dice: [],
      rollsLeft: 0,
      maxRollsThisTurn: 3,
      market,
      deck: shuffledDeck,
      animSeq: 0,
      lastAnim: null,
      winnerSeatNo: null,
      winReasonVi: null,
      phaseDeadlineMs: nowMs + (config?.timers?.turnSeconds ?? 60) * 1000,
    };

    const events: MatchEventRecord[] = [
      {
        eventType: "KOT_MATCH_STARTED",
        message: `🦖 Đại Chiến King of Tokyo: Duel bắt đầu! ${kotSeats[0]?.displayName} hãy chọn Quái Vật Kaiju của mình trước!`,
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
    const opp = getOpponent(state, actorSeatNo);
    const events: MatchEventRecord[] = [];
    const rng = Math.random;

    switch (command.type) {
      case "PICK_MONSTER": {
        if (state.step !== "MonsterPickStep") {
          throw new Error("Đã qua giai đoạn chọn Quái Vật.");
        }
        const meta = KOT_MONSTERS[command.monsterId];
        if (!meta) throw new Error("Quái Vật không hợp lệ.");
        if (state.seats.some((s) => s.monsterId === command.monsterId)) {
          throw new Error("Quái Vật này đã được đối thủ chọn rồi.");
        }

        actor.monsterId = meta.id;
        actor.maxHp = meta.maxHp;
        actor.hp = meta.maxHp;

        events.push({
          eventType: "KOT_MONSTER_PICKED",
          message: `${meta.emoji} ${actor.displayName} đã chọn **${meta.name}** (${meta.maxHp} HP — ${meta.powerNameVi})!`,
          visibleToSeatNos: "all",
        });

        const nextUnpicked = state.seats.find((s) => s.monsterId === null);
        if (nextUnpicked) {
          state.activeSeatNo = nextUnpicked.seatNo;
          state.phaseDeadlineMs = makeDeadline(state, nowMs);
        } else {
          // Both monsters picked -> Seat 1 begins Turn 1 Roll (5 dice balancing rule!)
          state.activeSeatNo = state.seats[0].seatNo;
          state.turnNumber = 1;
          beginTurnRoll(state, events, nowMs, rng);
        }
        break;
      }

      case "TOGGLE_DIE": {
        if (state.step !== "RollDiceStep") {
          throw new Error("Hiện không ở bước tung xúc xắc.");
        }
        const die = state.dice[command.dieIndex];
        if (!die) throw new Error("Xúc xắc không hợp lệ.");
        die.locked = !die.locked;
        break;
      }

      case "REROLL": {
        if (state.step !== "RollDiceStep") {
          throw new Error("Hiện không ở bước tung xúc xắc.");
        }
        if (state.rollsLeft <= 0) {
          throw new Error("Bạn đã hết lượt tung lại xúc xắc.");
        }
        const hasUnlocked = state.dice.some((d) => !d.locked);
        if (!hasUnlocked) {
          throw new Error("Hãy mở khóa ít nhất 1 xúc xắc để tung lại.");
        }

        for (const d of state.dice) {
          if (!d.locked) {
            d.face = rollRandomFace(rng);
          }
        }
        state.rollsLeft -= 1;
        state.phaseDeadlineMs = makeDeadline(state, nowMs);

        setAnim(
          state,
          {
            kind: "ROLL",
            actorSeatNo: actor.seatNo,
            labelVi: `Tung lại! (Còn ${state.rollsLeft} lần)`,
          },
          nowMs
        );
        break;
      }

      case "RESOLVE_DICE": {
        if (state.step !== "RollDiceStep") {
          throw new Error("Hiện không ở bước chốt xúc xắc.");
        }

        const counts: Record<KotDieFace, number> = {
          claw: 0,
          heal: 0,
          energy: 0,
          star: 0,
          building: 0,
          special: 0,
        };
        for (const d of state.dice) counts[d.face] += 1;

        let totalRawDamage = counts.claw;
        if (counts.claw > 0 && hasKeepEffect(actor, "BONUS_CLAW_1")) {
          totalRawDamage += 1;
        }
        let totalHeal = counts.heal;
        let totalEnergy = counts.energy;

        // Track pull thresholds (Gigazaur Blockbuster: needs only 2 if rolling >= 1 '!')
        const threshold =
          actor.monsterId === "gigazaur" && counts.special >= 1 ? 2 : 3;
        let fameSteps =
          counts.star >= threshold ? counts.star - (threshold - 1) : 0;
        let destructSteps =
          counts.building >= threshold ? counts.building - (threshold - 1) : 0;

        if (fameSteps > 0 && hasKeepEffect(actor, "BOOST_FAME_1")) {
          fameSteps += 1;
        }
        if (destructSteps > 0 && hasKeepEffect(actor, "BOOST_DESTRUCT_1")) {
          destructSteps += 1;
        }

        // Resolve Monster Special Power from '!' dice!
        let monsterPowerMsg: string | null = null;
        if (actor.monsterId === "gigazaur" && counts.special >= 2) {
          // Pull whichever track is less favorable by +1
          const dir = pullDirForSeat(state, actor.seatNo);
          if (dir * state.famePos <= dir * state.destructionPos) {
            fameSteps += 1;
          } else {
            destructSteps += 1;
          }
          monsterPowerMsg = "🦖 Bom Tấn Gigazaur: +1 bước kéo thanh!";
        } else if (actor.monsterId === "cyber_kitty" && counts.special >= 2) {
          const bonusE = counts.special >= 3 ? 4 : 2;
          totalEnergy += bonusE;
          monsterPowerMsg = `🐱 Cyber Kitty: +${bonusE} ⚡ Năng Lượng!`;
        } else if (actor.monsterId === "the_king" && counts.special >= 2) {
          // Place a PULL_1 Buzz Token right ahead on the track toward The King!
          const dir = pullDirForSeat(state, actor.seatNo);
          const targetTrack: KotTrackType =
            dir * state.famePos >= dir * state.destructionPos
              ? "fame"
              : "destruction";
          const curPos =
            targetTrack === "fame" ? state.famePos : state.destructionPos;
          const placePos = Math.max(-5, Math.min(5, curPos + dir));
          if (
            !state.buzzTokens.some(
              (b) => b.track === targetTrack && b.pos === placePos
            )
          ) {
            state.buzzTokens.push({
              id: `king-buzz-${state.turnNumber}-${placePos}`,
              track: targetTrack,
              pos: placePos,
              kind: "PULL_1",
              labelVi: "+1 bước kéo Lãnh Thổ!",
            });
          } else {
            totalHeal += 1;
          }
          monsterPowerMsg = "🦍 The King đặt Token Buzz Lãnh Thổ!";
        } else if (actor.monsterId === "space_penguin" && counts.special >= 2) {
          actor.bonusDiceNextTurn = Math.min(2, actor.bonusDiceNextTurn + 1);
          totalHeal += 1;
          monsterPowerMsg = "🐧 Space Penguin: +1 🎲 lượt sau & +1 ❤️!";
        } else if (actor.monsterId === "meka_dragon" && counts.special >= 2) {
          const bonusDmg = counts.special >= 3 ? 4 : 2;
          totalRawDamage += bonusDmg;
          monsterPowerMsg = `🐉 Hơi Thở Hạt Nhân: +${bonusDmg} sát thương!`;
        } else if (actor.monsterId === "alienoid" && counts.special >= 2) {
          totalEnergy += 1;
          totalHeal += 1;
          totalRawDamage += 1;
          monsterPowerMsg = "👽 Alienoid: +1 ⚡, +1 ❤️, +1 🐾!";
        }

        // Apply Energy, Heal, Damage, Lifesteal, and Track Pulls!
        actor.energy += totalEnergy;
        const actualDmg = applyDamage(opp, totalRawDamage);
        if (actualDmg >= 3 && hasKeepEffect(actor, "LIFESTEAL_1")) {
          totalHeal += 1;
        }
        const actualHeal = applyHeal(actor, totalHeal);
        const fameMoved = pullTrack(state, actor.seatNo, "fame", fameSteps, events);
        const destMoved = pullTrack(
          state,
          actor.seatNo,
          "destruction",
          destructSteps,
          events
        );

        const parts: string[] = [];
        if (actualDmg > 0) parts.push(`-${actualDmg} HP đối thủ`);
        if (actualHeal > 0) parts.push(`+${actualHeal} ❤️`);
        if (totalEnergy > 0) parts.push(`+${totalEnergy} ⚡`);
        if (fameMoved > 0) parts.push(`⭐ kéo +${fameMoved}`);
        if (destMoved > 0) parts.push(`🏢 kéo +${destMoved}`);

        events.push({
          eventType: "KOT_DICE_RESOLVED",
          message: `🎲 ${actor.displayName} chốt xúc xắc: ${parts.length > 0 ? parts.join(" • ") : "không kích hoạt hiệu ứng"}${monsterPowerMsg ? ` (${monsterPowerMsg})` : ""}`,
          visibleToSeatNos: "all",
        });

        setAnim(
          state,
          {
            kind: actualDmg > 0 ? "ATTACK" : actualHeal > 0 ? "HEAL" : "RESOLVE",
            actorSeatNo: actor.seatNo,
            targetSeatNo: opp.seatNo,
            damage: actualDmg,
            heal: actualHeal,
            energyGain: totalEnergy,
            fameDelta: fameMoved,
            destructionDelta: destMoved,
            labelVi: monsterPowerMsg ?? (parts.join(" • ") || "Chốt xúc xắc"),
          },
          nowMs
        );

        if (checkVictory(state, events, nowMs)) {
          break;
        }

        state.step = "BuyCardsStep";
        state.phaseDeadlineMs = makeDeadline(state, nowMs);
        break;
      }

      case "BUY_CARD": {
        if (state.step !== "BuyCardsStep") {
          throw new Error("Chỉ có thể mua thẻ sau khi chốt xúc xắc.");
        }
        const cardIdx = state.market.findIndex((c) => c.id === command.cardId);
        if (cardIdx < 0) throw new Error("Không tìm thấy thẻ sức mạnh này.");
        const card = state.market[cardIdx];
        const cost = getEffectiveCardCost(actor, card);
        if (actor.energy < cost) {
          throw new Error(
            `Không đủ Năng Lượng (cần ${cost} ⚡, bạn đang có ${actor.energy} ⚡).`
          );
        }

        actor.energy -= cost;
        state.market.splice(cardIdx, 1);
        refillMarketSlot(state);

        let dmg = 0;
        let heal = 0;
        let fameMoved = 0;
        let destMoved = 0;

        if (card.kind === "KEEP") {
          actor.keepCards.push(card);
        } else {
          // Resolve instant DISCARD card!
          switch (card.effectId) {
            case "DMG_3":
              dmg = applyDamage(opp, 3);
              break;
            case "HEAL_4":
              heal = applyHeal(actor, 4);
              break;
            case "FAME_2":
              fameMoved = pullTrack(state, actor.seatNo, "fame", 2, events);
              break;
            case "DESTRUCT_2":
              destMoved = pullTrack(state, actor.seatNo, "destruction", 2, events);
              break;
            case "DMG_2_DESTRUCT_1":
              dmg = applyDamage(opp, 2);
              destMoved = pullTrack(state, actor.seatNo, "destruction", 1, events);
              break;
            case "FAME_2_HEAL_1":
              fameMoved = pullTrack(state, actor.seatNo, "fame", 2, events);
              heal = applyHeal(actor, 1);
              break;
            case "DMG_4_SELF_1":
              dmg = applyDamage(opp, 4);
              applyDamage(actor, 1, true);
              break;
            case "BOTH_TRACKS_1":
              fameMoved = pullTrack(state, actor.seatNo, "fame", 1, events);
              destMoved = pullTrack(state, actor.seatNo, "destruction", 1, events);
              break;
            case "ENERGY_3_HEAL_2":
              actor.energy += 3;
              heal = applyHeal(actor, 2);
              break;
          }
        }

        events.push({
          eventType: "KOT_CARD_BOUGHT",
          message: `${card.emoji} ${actor.displayName} mua thẻ **${card.nameVi}** (${cost} ⚡) — ${card.descVi}`,
          visibleToSeatNos: "all",
        });

        setAnim(
          state,
          {
            kind: "BUY_CARD",
            actorSeatNo: actor.seatNo,
            targetSeatNo: opp.seatNo,
            damage: dmg,
            heal,
            fameDelta: fameMoved,
            destructionDelta: destMoved,
            labelVi: `${card.emoji} ${card.nameVi}!`,
          },
          nowMs
        );

        if (checkVictory(state, events, nowMs)) {
          break;
        }
        state.phaseDeadlineMs = makeDeadline(state, nowMs);
        break;
      }

      case "FLUSH_MARKET": {
        if (state.step !== "BuyCardsStep") {
          throw new Error("Chỉ có thể đổi chợ thẻ sau khi chốt xúc xắc.");
        }
        if (actor.energy < 2) {
          throw new Error("Cần 2 ⚡ Năng Lượng để làm mới 3 thẻ sức mạnh.");
        }
        if (state.deck.length === 0) {
          throw new Error("Bộ bài sức mạnh đã hết.");
        }
        actor.energy -= 2;
        state.market = [];
        refillMarketSlot(state);
        setAnim(
          state,
          {
            kind: "FLUSH",
            actorSeatNo: actor.seatNo,
            labelVi: "🔄 Đổi 3 thẻ mới (-2 ⚡)",
          },
          nowMs
        );
        events.push({
          eventType: "KOT_MARKET_FLUSHED",
          message: `🔄 ${actor.displayName} trả 2 ⚡ làm mới 3 Thẻ Sức Mạnh trên chợ!`,
          visibleToSeatNos: "all",
        });
        state.phaseDeadlineMs = makeDeadline(state, nowMs);
        break;
      }

      case "END_TURN": {
        if (state.step !== "BuyCardsStep") {
          throw new Error("Hãy chốt xúc xắc trước khi kết thúc lượt.");
        }
        state.activeSeatNo = opp.seatNo;
        state.turnNumber += 1;
        beginTurnRoll(state, events, nowMs, rng);
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
    if (state.step === "MonsterPickStep") {
      return this.reduce({
        state,
        command: chooseBotCommand(state),
        actorSeatNo: state.activeSeatNo,
        nowMs,
      });
    }
    if (state.step === "RollDiceStep") {
      return this.reduce({
        state,
        command: { type: "RESOLVE_DICE" },
        actorSeatNo: state.activeSeatNo,
        nowMs,
      });
    }
    return this.reduce({
      state,
      command: { type: "END_TURN" },
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
      guard < 28
    ) {
      guard += 1;
      const cmd = chooseBotCommand(state);
      const next = this.reduce({
        state,
        command: cmd,
        actorSeatNo: state.activeSeatNo,
        nowMs: nowMs + guard * 40,
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

  projectView({ state, viewerSeatNo }): KotPlayerView {
    return {
      cartridgeId: "king-of-tokyo-duel",
      turnNumber: state.turnNumber,
      step: state.step,
      activeSeatNo: state.activeSeatNo,
      viewerSeatNo,
      seats: state.seats,
      famePos: state.famePos,
      destructionPos: state.destructionPos,
      buzzTokens: state.buzzTokens,
      dice: state.dice,
      rollsLeft: state.rollsLeft,
      maxRollsThisTurn: state.maxRollsThisTurn,
      market: state.market,
      deckCount: state.deck.length,
      lastAnim: state.lastAnim,
      winnerSeatNo: state.winnerSeatNo,
      winReasonVi: state.winReasonVi,
      phaseDeadlineMs: state.phaseDeadlineMs,
      config: state.config,
    };
  },

  resolveChannels({ viewerSeatNo }): ChannelPermission[] {
    return [
      {
        channelId: "arena",
        label: "Đấu Trường Tokyo",
        canRead: true,
        canWrite: viewerSeatNo !== null,
      },
    ];
  },

  isMatchOver(state: KotMatchState): boolean {
    return state.step === "Finished";
  },

  getWinningFaction(state: KotMatchState): string | null {
    if (state.step !== "Finished" || state.winnerSeatNo === null) return null;
    return (
      state.seats.find((s) => s.seatNo === state.winnerSeatNo)?.displayName ??
      null
    );
  },
};
