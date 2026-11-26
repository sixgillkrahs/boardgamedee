export type OnuwRoleId =
  | "doppelganger"
  | "werewolf"
  | "minion"
  | "mason"
  | "seer"
  | "robber"
  | "troublemaker"
  | "drunk"
  | "insomniac"
  | "villager"
  | "hunter"
  | "tanner";

export type OnuwFaction = "village" | "werewolf" | "tanner";

export interface OnuwRoleMeta {
  id: OnuwRoleId;
  nameVi: string;
  nameEn: string;
  faction: OnuwFaction;
  maxCount: number;
  /** Official Bezier Games night wake order (null = never wakes at night) */
  wakeOrder: number | null;
  icon: string;
  accent: string;
  bgColor: string;
  shortDescVi: string;
  nightInstructionVi: string;
}

export const ONUW_ROLE_META: Record<OnuwRoleId, OnuwRoleMeta> = {
  doppelganger: {
    id: "doppelganger",
    nameVi: "Nhân Bản",
    nameEn: "Doppelgänger",
    faction: "village",
    maxCount: 1,
    wakeOrder: 1,
    icon: "🎭",
    accent: "#c084fc",
    bgColor: "#2e1065",
    shortDescVi: "Xem bài 1 người chơi khác và sao chép hoàn toàn vai trò & phe của họ.",
    nightInstructionVi:
      "Chọn 1 người chơi khác để xem bài và sao chép vai trò của họ. Nếu vai đó có năng lực hành động, bạn thực hiện ngay lập tức.",
  },
  werewolf: {
    id: "werewolf",
    nameVi: "Ma Sói",
    nameEn: "Werewolf",
    faction: "werewolf",
    maxCount: 2,
    wakeOrder: 2,
    icon: "🐺",
    accent: "#f87171",
    bgColor: "#450a0a",
    shortDescVi: "Nhận diện đồng bọn Ma Sói. Nếu là Sói đơn độc, được xem 1 lá ở giữa bàn.",
    nightInstructionVi:
      "Nhận diện các Ma Sói khác. Nếu bạn là Ma Sói duy nhất trên bàn, hãy chọn 1 lá bài ở giữa bàn để xem.",
  },
  minion: {
    id: "minion",
    nameVi: "Tay Sai",
    nameEn: "Minion",
    faction: "werewolf",
    maxCount: 1,
    wakeOrder: 3,
    icon: "🗡️",
    accent: "#fb923c",
    bgColor: "#431407",
    shortDescVi: "Biết ai là Ma Sói (Sói không biết bạn). Thắng cùng phe Ma Sói.",
    nightInstructionVi:
      "Quan sát xem ai đang là Ma Sói. Bảo vệ họ khỏi bị treo cổ (kể cả bạn phải hy sinh).",
  },
  mason: {
    id: "mason",
    nameVi: "Thợ Xây",
    nameEn: "Mason",
    faction: "village",
    maxCount: 2,
    wakeOrder: 4,
    icon: "⚒️",
    accent: "#38bdf8",
    bgColor: "#082f49",
    shortDescVi: "Hai Thợ Xây mở mắt nhận diện nhau để làm đồng minh tin cậy.",
    nightInstructionVi:
      "Quan sát xem ai là Thợ Xây còn lại (nếu không thấy ai, lá Thợ Xây thứ 2 đang ở giữa bàn).",
  },
  seer: {
    id: "seer",
    nameVi: "Tiên Tri",
    nameEn: "Seer",
    faction: "village",
    maxCount: 1,
    wakeOrder: 5,
    icon: "🔮",
    accent: "#818cf8",
    bgColor: "#1e1b4b",
    shortDescVi: "Xem bài của 1 người chơi khác HOẶC xem 2 lá bài ở giữa bàn.",
    nightInstructionVi:
      "Chọn xem bài của 1 người chơi khác, HOẶC chọn 2 lá bài ở giữa bàn.",
  },
  robber: {
    id: "robber",
    nameVi: "Đạo Chích",
    nameEn: "Robber",
    faction: "village",
    maxCount: 1,
    wakeOrder: 6,
    icon: "🦊",
    accent: "#34d399",
    bgColor: "#064e3b",
    shortDescVi: "Đổi bài của mình với 1 người chơi khác rồi xem lá bài mới của bạn.",
    nightInstructionVi:
      "Chọn 1 người chơi khác để tráo bài với họ và xem vai trò mới của bạn (hoặc bỏ qua).",
  },
  troublemaker: {
    id: "troublemaker",
    nameVi: "Kẻ Phá Rối",
    nameEn: "Troublemaker",
    faction: "village",
    maxCount: 1,
    wakeOrder: 7,
    icon: "🃏",
    accent: "#f472b6",
    bgColor: "#500724",
    shortDescVi: "Tráo đổi bài giữa 2 người chơi khác (không được xem bài của họ).",
    nightInstructionVi:
      "Chọn 2 người chơi khác để hoán đổi bài của họ trong bí mật (hoặc bỏ qua).",
  },
  drunk: {
    id: "drunk",
    nameVi: "Kẻ Say Rượu",
    nameEn: "Drunk",
    faction: "village",
    maxCount: 1,
    wakeOrder: 8,
    icon: "🍺",
    accent: "#fbbf24",
    bgColor: "#451a03",
    shortDescVi: "Bắt buộc đổi bài mình với 1 lá ở giữa bàn mà không được xem.",
    nightInstructionVi:
      "Bắt buộc chọn 1 trong 3 lá bài ở giữa bàn để đổi với bài của bạn (bạn sẽ không biết bài mới là gì).",
  },
  insomniac: {
    id: "insomniac",
    nameVi: "Kẻ Mất Ngủ",
    nameEn: "Insomniac",
    faction: "village",
    maxCount: 1,
    wakeOrder: 9,
    icon: "👁️",
    accent: "#2dd4bf",
    bgColor: "#042f2e",
    shortDescVi: "Thức dậy cuối cùng trong đêm để xem lại lá bài hiện tại trước mặt mình.",
    nightInstructionVi:
      "Kiểm tra xem lá bài hiện tại trước mặt bạn có bị ai tráo đổi trong đêm không.",
  },
  villager: {
    id: "villager",
    nameVi: "Dân Làng",
    nameEn: "Villager",
    faction: "village",
    maxCount: 3,
    wakeOrder: null,
    icon: "🏡",
    accent: "#60a5fa",
    bgColor: "#172554",
    shortDescVi: "Không có năng lực ban đêm. Dựa vào suy luận để tìm ra Ma Sói.",
    nightInstructionVi: "Ngủ yên suốt đêm và chờ trời sáng để thảo luận.",
  },
  hunter: {
    id: "hunter",
    nameVi: "Thợ Săn",
    nameEn: "Hunter",
    faction: "village",
    maxCount: 1,
    wakeOrder: null,
    icon: "🏹",
    accent: "#a3e635",
    bgColor: "#1a2e05",
    shortDescVi: "Nếu bị treo cổ, người mà Thợ Săn đang bỏ phiếu vào cũng chết theo ngay lập tức!",
    nightInstructionVi: "Ngủ yên suốt đêm. Cẩn trọng chọn mục tiêu bỏ phiếu ban ngày.",
  },
  tanner: {
    id: "tanner",
    nameVi: "Thợ Thuộc Da",
    nameEn: "Tanner",
    faction: "tanner",
    maxCount: 1,
    wakeOrder: null,
    icon: "🪓",
    accent: "#eab308",
    bgColor: "#422006",
    shortDescVi: "Phe độc lập: chán đời và CHỈ THẮNG nếu bị làng bỏ phiếu treo cổ!",
    nightInstructionVi: "Ngủ yên suốt đêm. Hãy tỏ ra khả nghi để làng treo cổ bạn!",
  },
};

export const ALL_ONUW_ROLE_IDS: OnuwRoleId[] = [
  "doppelganger",
  "werewolf",
  "minion",
  "mason",
  "seer",
  "robber",
  "troublemaker",
  "drunk",
  "insomniac",
  "villager",
  "hunter",
  "tanner",
];

/** Roles that wake up in sequence during the Night Phase */
export const NIGHT_WAKE_ORDER: OnuwRoleId[] = [
  "doppelganger",
  "werewolf",
  "minion",
  "mason",
  "seer",
  "robber",
  "troublemaker",
  "drunk",
  "insomniac",
];

/** Roles whose power triggers immediately during Doppelgänger's turn */
export const DOPPELGANGER_IMMEDIATE_ROLES: OnuwRoleId[] = [
  "seer",
  "robber",
  "troublemaker",
  "drunk",
];

export const ONUW_FACTION_META: Record<
  OnuwFaction,
  { nameVi: string; accent: string; bg: string }
> = {
  village: { nameVi: "Phe Dân Làng", accent: "#38bdf8", bg: "#0c4a6e" },
  werewolf: { nameVi: "Phe Ma Sói", accent: "#f87171", bg: "#7f1d1d" },
  tanner: { nameVi: "Thợ Thuộc Da", accent: "#facc15", bg: "#713f12" },
};

/** Official Bezier Games balanced role sets (always seatCount + 3 cards) */
export function defaultRolesForSeatCount(seatCount: number): OnuwRoleId[] {
  const n = Math.max(3, Math.min(10, seatCount));
  switch (n) {
    case 3:
      return ["werewolf", "werewolf", "seer", "robber", "troublemaker", "villager"];
    case 4:
      return [
        "werewolf",
        "werewolf",
        "seer",
        "robber",
        "troublemaker",
        "drunk",
        "villager",
      ];
    case 5:
      return [
        "werewolf",
        "werewolf",
        "minion",
        "seer",
        "robber",
        "troublemaker",
        "drunk",
        "insomniac",
      ];
    case 6:
      return [
        "werewolf",
        "werewolf",
        "minion",
        "mason",
        "mason",
        "seer",
        "robber",
        "troublemaker",
        "insomniac",
      ];
    case 7:
      return [
        "werewolf",
        "werewolf",
        "minion",
        "mason",
        "mason",
        "seer",
        "robber",
        "troublemaker",
        "drunk",
        "insomniac",
      ];
    case 8:
      return [
        "doppelganger",
        "werewolf",
        "werewolf",
        "minion",
        "mason",
        "mason",
        "seer",
        "robber",
        "troublemaker",
        "drunk",
        "insomniac",
      ];
    case 9:
      return [
        "doppelganger",
        "werewolf",
        "werewolf",
        "minion",
        "mason",
        "mason",
        "seer",
        "robber",
        "troublemaker",
        "drunk",
        "insomniac",
        "tanner",
      ];
    default:
      return [
        "doppelganger",
        "werewolf",
        "werewolf",
        "minion",
        "mason",
        "mason",
        "seer",
        "robber",
        "troublemaker",
        "drunk",
        "insomniac",
        "tanner",
        "hunter",
      ];
  }
}

export function countRoles(roles: OnuwRoleId[]): Record<OnuwRoleId, number> {
  const counts = {} as Record<OnuwRoleId, number>;
  for (const id of ALL_ONUW_ROLE_IDS) counts[id] = 0;
  for (const r of roles) {
    if (r in counts) counts[r] += 1;
  }
  return counts;
}
