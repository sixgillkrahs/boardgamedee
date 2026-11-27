import type {
  CartridgeTransitionResult,
  ChannelPermission,
  GameCartridge,
  MatchEventRecord,
  SeatDescriptor,
} from "@/cartridges/types";

export type IkExpansionId =
  | "imploding"
  | "streaking"
  | "barking"
  | "zombie"
  | "good_vs_evil";

export const IK_EXPANSION_IDS: IkExpansionId[] = [
  "imploding",
  "streaking",
  "barking",
  "zombie",
  "good_vs_evil",
];

export interface IkExpansionMeta {
  id: IkExpansionId;
  nameVi: string;
  shortVi: string;
  badgeVi: string;
  descriptionVi: string;
  accentColor: string;
}

export const IK_EXPANSION_META: Record<IkExpansionId, IkExpansionMeta> = {
  imploding: {
    id: "imploding",
    nameVi: "Imploding Kittens (Mèo Hố Đen)",
    shortVi: "Imploding",
    badgeVi: "20 Lá Mở Rộng #1",
    descriptionVi:
      "Thêm Mèo Hố Đen (lật ngửa không thể Defuse), Mèo Hoang (Wildcard), Đảo Chiều (Reverse), Rút Từ Đáy, Thay Đổi Tương Lai 3x & Tấn Công Chỉ Định.",
    accentColor: "#a855f7",
  },
  streaking: {
    id: "streaking",
    nameVi: "Streaking Kittens (Mèo Chạy Rông)",
    shortVi: "Streaking",
    badgeVi: "15 Lá Mở Rộng #2",
    descriptionVi:
      "Thêm Mèo Chạy Rông (giữ 1 Mèo Nổ trên tay không chết), Siêu Bỏ Lượt, Bom Nguyên Tử Mèo (Catomic Bomb), Thấu Thị 5x, Đổi Đỉnh/Đáy, Thu Gom Rác, Lời Nguyền Mù Bài & Đánh Dấu.",
    accentColor: "#f97316",
  },
  barking: {
    id: "barking",
    nameVi: "Barking Kittens (Mèo Sủa)",
    shortVi: "Barking",
    badgeVi: "20 Lá Mở Rộng #3",
    descriptionVi:
      "Thêm cặp Mèo Sủa kích nổ từ xa, Tháp Quyền Lực (Tower of Power), Chôn Giấu (Bury), Tự Tấn Công 3x, Chia Sẻ Tương Lai 3x, Góp Bài (Potluck) & Đưa Đây Cho Tôi (I'll Take That).",
    accentColor: "#ec4899",
  },
  zombie: {
    id: "zombie",
    nameVi: "Zombie & Recipes (Xác Sống & Bí Kíp)",
    shortVi: "Zombie",
    badgeVi: "Mở Rộng #4",
    descriptionVi:
      "Thêm Nhân Bản (Clone sao chép bài vừa đánh), Đào Sâu Hơn (Dig Deeper), Đoàn Quân Xác Sống (Attack 3x) & Thấu Tâm (Clairvoyance).",
    accentColor: "#10b981",
  },
  good_vs_evil: {
    id: "good_vs_evil",
    nameVi: "Good vs. Evil (Thiện & Ác)",
    shortVi: "Good vs. Evil",
    badgeVi: "Mở Rộng #5",
    descriptionVi:
      "Thêm Tận Thế (Armageddon đấu trí giành Mèo Thần Godcat & né Mèo Quỷ Devilcat trên Thảm đấu), Quậy Tưng Bừng (Raising Heck), Tiết Lộ Tương Lai 3x & 4 Lá Mèo mới.",
    accentColor: "#f59e0b",
  },
};

export type IkCardType =
  // Core Bombs & Defense
  | "exploding_kitten"
  | "defuse"
  | "nope"
  // Core Actions
  | "attack"
  | "skip"
  | "favor"
  | "shuffle"
  | "see_future_3"
  // Core Cat Cards
  | "tacocat"
  | "catermelon"
  | "hairy_potato_cat"
  | "beard_cat"
  | "rainbow_cat"
  // Imploding Kittens Expansion
  | "imploding_kitten"
  | "feral_cat"
  | "reverse"
  | "draw_bottom"
  | "alter_future_3"
  | "targeted_attack"
  // Streaking Kittens Expansion
  | "streaking_kitten"
  | "super_skip"
  | "see_future_5"
  | "alter_future_5"
  | "swap_top_bottom"
  | "catomic_bomb"
  | "garbage_collection"
  | "curse_cat_butt"
  | "mark"
  // Barking Kittens Expansion
  | "barking_kitten"
  | "tower_of_power"
  | "bury"
  | "personal_attack"
  | "share_future_3"
  | "potluck"
  | "ill_take_that"
  // Zombie / Recipes Expansion
  | "zombie_kitten"
  | "clone"
  | "dig_deeper"
  | "attack_of_the_dead"
  | "clairvoyance"
  | "feed_the_dead"
  | "grave_robber"
  | "de_cat_ipated"
  | "vampire_cat"
  | "zombie_cat"
  // Good vs. Evil Expansion
  | "armageddon"
  | "godcat"
  | "devilcat"
  | "raising_heck"
  | "reveal_future_3"
  | "horse_cat"
  | "knight_cat"
  | "mercat"
  | "troll_cat";

export type IkCardCategory =
  | "bomb"
  | "defense"
  | "action"
  | "cat"
  | "wildcard_cat"
  | "passive";

export interface IkCardMeta {
  type: IkCardType;
  nameVi: string;
  shortVi: string;
  subtitleVi: string;
  ruleVi: string;
  emoji: string;
  colorHex: string;
  secondaryHex: string;
  category: IkCardCategory;
  pack: "core" | IkExpansionId;
  needsTargetSeat?: boolean;
}

export const IK_CARD_META: Record<IkCardType, IkCardMeta> = {
  exploding_kitten: {
    type: "exploding_kitten",
    nameVi: "Mèo Nổ (Exploding Kitten)",
    shortVi: "Mèo Nổ",
    subtitleVi: "Rút phải là BÙM!",
    ruleVi:
      "Phải dùng lá Tháo Ngòi (Defuse) để cài lại vào bộ bài, hoặc giữ bằng Mèo Chạy Rông, nếu không sẽ bị nổ tung!",
    emoji: "",
    colorHex: "#ef4444",
    secondaryHex: "#7f1d1d",
    category: "bomb",
    pack: "core",
  },
  imploding_kitten: {
    type: "imploding_kitten",
    nameVi: "Mèo Hố Đen (Imploding Kitten)",
    shortVi: "Mèo Hố Đen",
    subtitleVi: "Không thể Tháo Ngòi khi đã Ngửa!",
    ruleVi:
      "Lần 1 rút phải (đang Úp): Bí mật cài lại vào bộ bài ở trạng thái LẬT NGỬA. Lần 2 rút phải (khi đã Ngửa): Nổ ngay lập tức, không thể Defuse!",
    emoji: "",
    colorHex: "#a855f7",
    secondaryHex: "#3b0764",
    category: "bomb",
    pack: "imploding",
  },
  defuse: {
    type: "defuse",
    nameVi: "Tháo Ngòi (Defuse)",
    shortVi: "Tháo Ngòi",
    subtitleVi: "Bút laser, bạc hà mèo & gãi bụng",
    ruleVi:
      "Hóa giải Mèo Nổ (hoặc Mèo Sủa) và bí mật cài lại Mèo Nổ vào bất kỳ vị trí nào trong Bộ bài rút.",
    emoji: "",
    colorHex: "#22c55e",
    secondaryHex: "#14532d",
    category: "defense",
    pack: "core",
  },
  zombie_kitten: {
    type: "zombie_kitten",
    nameVi: "Mèo Xác Sống (Zombie Kitten)",
    shortVi: "Zombie Kitten",
    subtitleVi: "Gỡ Mèo Nổ & Hồi sinh 1 người đã chết!",
    ruleVi:
      "Thay vì nổ khi rút phải Mèo Nổ, bí mật cài lại Mèo Nổ vào Bộ bài rút VÀ hồi sinh 1 người chơi đã bị loại quay lại bàn chơi!",
    emoji: "",
    colorHex: "#84cc16",
    secondaryHex: "#365314",
    category: "defense",
    pack: "zombie",
  },
  feed_the_dead: {
    type: "feed_the_dead",
    nameVi: "Cho Người Chết Ăn (Feed the Dead)",
    shortVi: "Feed the Dead",
    subtitleVi: "Mọi người sống đưa 1 lá cho người đã chết",
    ruleVi:
      "Chọn 1 người chơi đã chết. Tất cả người chơi còn sống khác (trừ bạn) phải chọn 1 lá bài trên tay đưa cho người chết đó!",
    emoji: "",
    colorHex: "#ef4444",
    secondaryHex: "#450a0a",
    category: "action",
    pack: "zombie",
  },
  grave_robber: {
    type: "grave_robber",
    nameVi: "Kẻ Trộm Mộ (Grave Robber)",
    shortVi: "Grave Robber",
    subtitleVi: "Lấy 1 lá từ mọi người chết xáo vào Bộ bài",
    ruleVi:
      "Tất cả người chơi đã chết còn bài trên tay phải trả 1 lá bài vào Bộ bài rút rồi xáo trộn lại!",
    emoji: "",
    colorHex: "#65a30d",
    secondaryHex: "#365314",
    category: "action",
    pack: "zombie",
  },
  nope: {
    type: "nope",
    nameVi: "Phủ Quyết (Nope!)",
    shortVi: "Nope!",
    subtitleVi: "Hủy bỏ hành động vừa đánh",
    ruleVi:
      "Chặn bất kỳ lá hành động hoặc Combo nào vừa đánh ra. Đánh chồng Nope lên một Nope khác sẽ tạo thành YUP!",
    emoji: "",
    colorHex: "#dc2626",
    secondaryHex: "#450a0a",
    category: "defense",
    pack: "core",
  },
  attack: {
    type: "attack",
    nameVi: "Tấn Công 2x (Attack)",
    shortVi: "Tấn Công 2x",
    subtitleVi: "Không cần rút • Ép người kế đi +2 lượt",
    ruleVi:
      "Kết thúc ngay lượt của bạn mà không cần rút bài. Người kế tiếp phải đi 2 lượt (hoặc cộng dồn thêm +2 lượt nếu bạn đang bị Attack).",
    emoji: "",
    colorHex: "#f59e0b",
    secondaryHex: "#78350f",
    category: "action",
    pack: "core",
  },
  targeted_attack: {
    type: "targeted_attack",
    nameVi: "Tấn Công Chỉ Định 2x",
    shortVi: "Chỉ Định 2x",
    subtitleVi: "Chọn bất kỳ ai chịu +2 lượt!",
    ruleVi:
      "Kết thúc lượt không cần rút bài và chỉ định BẤT KỲ người chơi nào trên bàn phải lập tức đi 2 lượt (cộng dồn nếu đang bị Attack).",
    emoji: "",
    colorHex: "#f97316",
    secondaryHex: "#7c2d12",
    category: "action",
    pack: "imploding",
    needsTargetSeat: true,
  },
  personal_attack: {
    type: "personal_attack",
    nameVi: "Tự Tấn Công 3x (Personal Attack)",
    shortVi: "Tự Đánh 3x",
    subtitleVi: "Tự đi 3 lượt liên tiếp",
    ruleVi:
      "Thực hiện trên chính bạn: buộc bản thân đi 3 lượt liên tiếp (dùng để gom bài đầu trận hoặc kích hoạt chuỗi bài).",
    emoji: "",
    colorHex: "#d97706",
    secondaryHex: "#451a03",
    category: "action",
    pack: "barking",
  },
  attack_of_the_dead: {
    type: "attack_of_the_dead",
    nameVi: "Đoàn Quân Xác Sống (3x/Người Chết)",
    shortVi: "Xác Sống 3x",
    subtitleVi: "Không rút bài • +3 lượt × số người đã chết",
    ruleVi:
      "Kết thúc ngay lượt của bạn mà không cần rút bài và ép người chơi kế tiếp phải đi 3 lượt cho MỖI người chơi đã chết!",
    emoji: "",
    colorHex: "#84cc16",
    secondaryHex: "#365314",
    category: "action",
    pack: "zombie",
  },
  skip: {
    type: "skip",
    nameVi: "Bỏ Lượt (Skip)",
    shortVi: "Bỏ Lượt",
    subtitleVi: "Kết thúc 1 lượt không cần rút bài",
    ruleVi:
      "Kết thúc ngay 1 lượt hiện tại của bạn mà không phải rút bài (nếu đang nợ 2 lượt từ Attack thì giảm còn 1 lượt).",
    emoji: "",
    colorHex: "#3b82f6",
    secondaryHex: "#1e3a8a",
    category: "action",
    pack: "core",
  },
  super_skip: {
    type: "super_skip",
    nameVi: "Siêu Bỏ Lượt (Super Skip)",
    shortVi: "Siêu Skip",
    subtitleVi: "Xóa sạch MỌI lượt đang nợ!",
    ruleVi:
      "Kết thúc ngay lập tức TẤT CẢ các lượt của bạn (dù đang bị cộng dồn 2, 4 hay 6 lượt Attack) mà không cần rút bài!",
    emoji: "",
    colorHex: "#06b6d4",
    secondaryHex: "#164e63",
    category: "action",
    pack: "streaking",
  },
  reverse: {
    type: "reverse",
    nameVi: "Đảo Chiều (Reverse)",
    shortVi: "Đảo Chiều",
    subtitleVi: "Đổi chiều vòng chơi & Bỏ 1 lượt rút",
    ruleVi:
      "Đảo ngược chiều đánh của bàn chơi (Kim đồng hồ ↔ Ngược kim đồng hồ) và kết thúc 1 lượt hiện tại mà không cần rút bài!",
    emoji: "",
    colorHex: "#8b5cf6",
    secondaryHex: "#2e1065",
    category: "action",
    pack: "imploding",
  },
  draw_bottom: {
    type: "draw_bottom",
    nameVi: "Rút Từ Đáy (Draw Bottom)",
    shortVi: "Rút Đáy",
    subtitleVi: "Rút lá dưới đáy cùng để qua lượt",
    ruleVi:
      "Kết thúc 1 lượt hiện tại bằng cách rút lá dưới ĐÁY CÙNG của Bộ bài rút thay vì lá trên đỉnh (né bom đang nằm trên đỉnh!).",
    emoji: "",
    colorHex: "#ec4899",
    secondaryHex: "#831843",
    category: "action",
    pack: "imploding",
  },
  favor: {
    type: "favor",
    nameVi: "Xin Xỏ (Favor)",
    shortVi: "Xin Xỏ",
    subtitleVi: "Bắt 1 đối thủ cống nạp 1 lá bài",
    ruleVi:
      "Chọn 1 người chơi khác; người đó buộc phải tự chọn 1 lá bài trên tay họ và đưa cho bạn.",
    emoji: "",
    colorHex: "#14b8a6",
    secondaryHex: "#134e4a",
    category: "action",
    pack: "core",
    needsTargetSeat: true,
  },
  shuffle: {
    type: "shuffle",
    nameVi: "Xáo Bài (Shuffle)",
    shortVi: "Xáo Bài",
    subtitleVi: "Trộn tung Bộ bài rút",
    ruleVi:
      "Xáo trộn ngẫu nhiên toàn bộ Bộ bài rút (vẫn giữ trạng thái Lật Ngửa của Mèo Hố Đen nếu nó đã lộ diện).",
    emoji: "",
    colorHex: "#64748b",
    secondaryHex: "#1e293b",
    category: "action",
    pack: "core",
  },
  see_future_3: {
    type: "see_future_3",
    nameVi: "Thấu Thị 3x (See Future)",
    shortVi: "Thấu Thị 3x",
    subtitleVi: "Soi bí mật 3 lá đầu Bộ bài rút",
    ruleVi:
      "Bí mật xem trước 3 lá bài nằm trên đỉnh Bộ bài rút theo đúng thứ tự.",
    emoji: "",
    colorHex: "#d946ef",
    secondaryHex: "#701a75",
    category: "action",
    pack: "core",
  },
  see_future_5: {
    type: "see_future_5",
    nameVi: "Thấu Thị 5x (See Future 5x)",
    shortVi: "Thấu Thị 5x",
    subtitleVi: "Soi bí mật 5 lá đầu Bộ bài rút",
    ruleVi:
      "Bí mật xem trước 5 lá bài nằm trên đỉnh Bộ bài rút theo đúng thứ tự.",
    emoji: "",
    colorHex: "#c026d3",
    secondaryHex: "#4a044e",
    category: "action",
    pack: "streaking",
  },
  alter_future_3: {
    type: "alter_future_3",
    nameVi: "Đổi Tương Lai 3x (Alter 3x)",
    shortVi: "Đổi TL 3x",
    subtitleVi: "Xem & Sắp xếp lại 3 lá đầu Bộ bài",
    ruleVi:
      "Bí mật xem 3 lá trên cùng của Bộ bài rút và tự do thay đổi thứ tự của chúng trước khi úp lại!",
    emoji: "",
    colorHex: "#6366f1",
    secondaryHex: "#312e81",
    category: "action",
    pack: "imploding",
  },
  alter_future_5: {
    type: "alter_future_5",
    nameVi: "Đổi Tương Lai 5x (Alter 5x)",
    shortVi: "Đổi TL 5x",
    subtitleVi: "Xem & Sắp xếp lại 5 lá đầu Bộ bài",
    ruleVi:
      "Bí mật xem 5 lá trên cùng của Bộ bài rút và tự do thay đổi thứ tự của chúng trước khi úp lại!",
    emoji: "",
    colorHex: "#4f46e5",
    secondaryHex: "#1e1b4b",
    category: "action",
    pack: "streaking",
  },
  share_future_3: {
    type: "share_future_3",
    nameVi: "Chia Sẻ Tương Lai 3x",
    shortVi: "Chia Sẻ 3x",
    subtitleVi: "Sắp xếp 3 lá đầu & Cho người kế xem",
    ruleVi:
      "Xem và sắp xếp lại 3 lá trên cùng của Bộ bài rút, sau đó tiết lộ thứ tự 3 lá đó cho người chơi kế tiếp!",
    emoji: "",
    colorHex: "#0ea5e9",
    secondaryHex: "#0c4a6e",
    category: "action",
    pack: "barking",
  },
  swap_top_bottom: {
    type: "swap_top_bottom",
    nameVi: "Đổi Đỉnh & Đáy (Swap)",
    shortVi: "Đổi Đỉnh/Đáy",
    subtitleVi: "Hoán đổi lá đầu và lá cuối Bộ bài",
    ruleVi:
      "Đổi chỗ ngay lập tức lá trên cùng và lá dưới đáy cùng của Bộ bài rút mà không cần nhìn.",
    emoji: "",
    colorHex: "#10b981",
    secondaryHex: "#064e3b",
    category: "action",
    pack: "streaking",
  },
  catomic_bomb: {
    type: "catomic_bomb",
    nameVi: "Bom Nguyên Tử Mèo (Catomic)",
    shortVi: "Catomic Bomb",
    subtitleVi: "Kéo MỌI Mèo Nổ lên đỉnh & Qua lượt!",
    ruleVi:
      "Kéo toàn bộ các lá Mèo Nổ (Exploding Kitten) trong Bộ bài rút ra, xáo phần còn lại rồi đặt tất cả Mèo Nổ lên ĐỈNH Bộ bài rút, đồng thời kết thúc lượt không cần rút!",
    emoji: "",
    colorHex: "#ef4444",
    secondaryHex: "#450a0a",
    category: "action",
    pack: "streaking",
  },
  garbage_collection: {
    type: "garbage_collection",
    nameVi: "Thu Gom Rác (Garbage)",
    shortVi: "Thu Gom Rác",
    subtitleVi: "Mọi người trả 1 lá trên tay vào Bộ bài",
    ruleVi:
      "Tất cả người chơi còn sống mỗi người phải chọn 1 lá bài từ trên tay bỏ vào Bộ bài rút, sau đó xáo trộn lại toàn bộ Bộ bài rút!",
    emoji: "",
    colorHex: "#78716c",
    secondaryHex: "#292524",
    category: "action",
    pack: "streaking",
  },
  curse_cat_butt: {
    type: "curse_cat_butt",
    nameVi: "Lời Nguyền Mông Mèo (Blind)",
    shortVi: "Mù Bài",
    subtitleVi: "Làm đối thủ bị úp mù toàn bộ bài!",
    ruleVi:
      "Chọn 1 người chơi; bài trên tay người đó bị xáo trộn và ÚP MÙ (không thấy mặt bài của chính mình) cho đến khi họ rút thành công 1 lá bài!",
    emoji: "",
    colorHex: "#f43f5e",
    secondaryHex: "#881337",
    category: "action",
    pack: "streaking",
    needsTargetSeat: true,
  },
  mark: {
    type: "mark",
    nameVi: "Đánh Dấu (Mark)",
    shortVi: "Đánh Dấu",
    subtitleVi: "Bắn lộ diện 1 lá bài trên tay đối thủ",
    ruleVi:
      "Chọn 1 người chơi; 1 lá bài ngẫu nhiên trên tay họ bị ĐÁNH DẤU và lật ngửa công khai cho cả bàn nhìn thấy cho tới khi được đánh hoặc bị cướp!",
    emoji: "",
    colorHex: "#eab308",
    secondaryHex: "#713f12",
    category: "action",
    pack: "streaking",
    needsTargetSeat: true,
  },
  bury: {
    type: "bury",
    nameVi: "Chôn Giấu (Bury)",
    shortVi: "Chôn Giấu",
    subtitleVi: "Xem lá đầu, chôn lại & Kết thúc lượt",
    ruleVi:
      "Bí mật rút lá trên cùng của Bộ bài rút để xem (không kích nổ bom!), sau đó nhét nó vào bất kỳ vị trí nào trong Bộ bài rút và kết thúc 1 lượt!",
    emoji: "",
    colorHex: "#a16207",
    secondaryHex: "#422006",
    category: "action",
    pack: "barking",
  },
  potluck: {
    type: "potluck",
    nameVi: "Góp Bài Lên Đỉnh (Potluck)",
    shortVi: "Góp Bài",
    subtitleVi: "Mỗi người đặt 1 lá lên Đỉnh Bộ bài",
    ruleVi:
      "Mỗi người chơi còn sống phải chọn 1 lá bài trên tay đặt úp lên ĐỈNH Bộ bài rút (không xáo bài)!",
    emoji: "",
    colorHex: "#f97316",
    secondaryHex: "#431407",
    category: "action",
    pack: "barking",
  },
  ill_take_that: {
    type: "ill_take_that",
    nameVi: "Đưa Đây Cho Tôi (I'll Take That)",
    shortVi: "Đưa Đây!",
    subtitleVi: "Cướp lá rút tiếp theo của mục tiêu",
    ruleVi:
      "Gài trước mặt 1 đối thủ: ở lần rút bài kết thúc lượt tiếp theo của họ, lá bài họ rút ra sẽ bay thẳng về tay bạn (kể cả nếu là Bom!).",
    emoji: "",
    colorHex: "#38bdf8",
    secondaryHex: "#082f49",
    category: "action",
    pack: "barking",
    needsTargetSeat: true,
  },
  barking_kitten: {
    type: "barking_kitten",
    nameVi: "Mèo Sủa (Barking Kitten)",
    shortVi: "Mèo Sủa",
    subtitleVi: "Kích nổ kẻ giữ Mèo Sủa còn lại!",
    ruleVi:
      "Đánh ra để truy lùng lá Mèo Sủa thứ 2: nếu người chơi khác đang cầm nó trên tay (hoặc đã đặt ra bàn), mục tiêu lập tức bị nổ trừ khi mất 1 lá Defuse!",
    emoji: "",
    colorHex: "#fb7185",
    secondaryHex: "#4c0519",
    category: "action",
    pack: "barking",
  },
  tower_of_power: {
    type: "tower_of_power",
    nameVi: "Tháp Quyền Lực (Tower of Power)",
    shortVi: "Tháp Quyền Lực",
    subtitleVi: "Đội Vương Miện 6 lá dự trữ chống cướp bài",
    ruleVi:
      "Đội Tháp Quyền Lực chứa 6 lá dự trữ bí mật lên đầu. Mỗi khi bị ai cướp bài (Combo 2/3 hoặc Xin Xỏ), họ buộc phải rút mù từ đỉnh Tháp thay vì đụng vào bài trên tay bạn! Bất cứ lúc nào trong lượt, bạn có thể rút 1 lá từ Tháp về tay và xáo phần còn lại vào Bộ bài rút.",
    emoji: "",
    colorHex: "#94a3b8",
    secondaryHex: "#1e293b",
    category: "action",
    pack: "barking",
  },
  clone: {
    type: "clone",
    nameVi: "Nhân Bản (Clone)",
    shortVi: "Nhân Bản",
    subtitleVi: "Sao chép lá vừa đánh dưới Mộ bài",
    ruleVi:
      "Biến thành bản sao của lá bài hành động đang nằm trên cùng của Chồng bài bỏ (Discard Pile) và thực thi ngay hiệu ứng của lá đó!",
    emoji: "",
    colorHex: "#34d399",
    secondaryHex: "#064e3b",
    category: "action",
    pack: "zombie",
  },
  dig_deeper: {
    type: "dig_deeper",
    nameVi: "Đào Sâu Hơn (Dig Deeper)",
    shortVi: "Đào Sâu",
    subtitleVi: "Xem lá #1: Chọn lấy lá #1 hoặc lá #2",
    ruleVi:
      "Bí mật xem lá trên cùng của Bộ bài rút: bạn có thể lấy luôn lá đó để kết thúc lượt, hoặc bỏ qua nó để rút lá thứ 2 ngay bên dưới!",
    emoji: "",
    colorHex: "#fbbf24",
    secondaryHex: "#451a03",
    category: "action",
    pack: "zombie",
  },
  clairvoyance: {
    type: "clairvoyance",
    nameVi: "Thấu Tâm (Clairvoyance)",
    shortVi: "Thấu Tâm",
    subtitleVi: "Soi vị trí mọi quả Bom trong Bộ bài",
    ruleVi:
      "Bí mật soi chính xác vị trí hiện tại của toàn bộ các lá Mèo Nổ và Mèo Hố Đen đang nằm ở lá thứ mấy trong Bộ bài rút!",
    emoji: "",
    colorHex: "#2dd4bf",
    secondaryHex: "#115e59",
    category: "action",
    pack: "zombie",
  },
  streaking_kitten: {
    type: "streaking_kitten",
    nameVi: "Mèo Chạy Rông (Streaking)",
    shortVi: "Mèo Chạy Rông",
    subtitleVi: "Nội tại: Giữ 1 Mèo Nổ trên tay an toàn!",
    ruleVi:
      "Lá nội tại (Passive): Miễn là bạn còn giữ Mèo Chạy Rông trên tay, bạn được phép giữ 1 lá Mèo Nổ (Exploding Kitten) trên tay mà không bị nổ!",
    emoji: "",
    colorHex: "#fb923c",
    secondaryHex: "#7c2d12",
    category: "passive",
    pack: "streaking",
  },
  feral_cat: {
    type: "feral_cat",
    nameVi: "Mèo Hoang (Feral Cat - Wild)",
    shortVi: "Mèo Hoang",
    subtitleVi: "Wildcard: Ghép mọi Combo Mèo 2–3 lá",
    ruleVi:
      "Đóng vai trò Wildcard thay thế cho bất kỳ Lá Mèo nào khi bạn đánh Combo 2 lá (cướp bài ngẫu nhiên) hoặc Combo 3 lá (xin bài chỉ định)!",
    emoji: "",
    colorHex: "#facc15",
    secondaryHex: "#713f12",
    category: "wildcard_cat",
    pack: "imploding",
  },
  tacocat: {
    type: "tacocat",
    nameVi: "Mèo Taco (Tacocat)",
    shortVi: "Tacocat",
    subtitleVi: "Lá Mèo • Ghép đôi / bộ 3 / bộ 5",
    ruleVi:
      "Không có tác dụng đơn lẻ. Ghép 2 lá cùng loại để cướp 1 lá ngẫu nhiên, 3 lá cùng loại để chỉ định tên bài muốn cướp, hoặc 5 lá khác nhau để nhặt bài từ Mộ!",
    emoji: "",
    colorHex: "#eab308",
    secondaryHex: "#422006",
    category: "cat",
    pack: "core",
  },
  catermelon: {
    type: "catermelon",
    nameVi: "Mèo Dưa Hấu (Catermelon)",
    shortVi: "Catermelon",
    subtitleVi: "Lá Mèo • Ghép đôi / bộ 3 / bộ 5",
    ruleVi:
      "Không có tác dụng đơn lẻ. Ghép 2 lá cùng loại để cướp 1 lá ngẫu nhiên, 3 lá cùng loại để chỉ định tên bài muốn cướp, hoặc 5 lá khác nhau để nhặt bài từ Mộ!",
    emoji: "",
    colorHex: "#4ade80",
    secondaryHex: "#14532d",
    category: "cat",
    pack: "core",
  },
  hairy_potato_cat: {
    type: "hairy_potato_cat",
    nameVi: "Mèo Khoai Tây (Potato Cat)",
    shortVi: "Mèo Khoai",
    subtitleVi: "Lá Mèo • Ghép đôi / bộ 3 / bộ 5",
    ruleVi:
      "Không có tác dụng đơn lẻ. Ghép 2 lá cùng loại để cướp 1 lá ngẫu nhiên, 3 lá cùng loại để chỉ định tên bài muốn cướp, hoặc 5 lá khác nhau để nhặt bài từ Mộ!",
    emoji: "",
    colorHex: "#d97706",
    secondaryHex: "#451a03",
    category: "cat",
    pack: "core",
  },
  beard_cat: {
    type: "beard_cat",
    nameVi: "Mèo Râu Xồm (Beard Cat)",
    shortVi: "Mèo Râu",
    subtitleVi: "Lá Mèo • Ghép đôi / bộ 3 / bộ 5",
    ruleVi:
      "Không có tác dụng đơn lẻ. Ghép 2 lá cùng loại để cướp 1 lá ngẫu nhiên, 3 lá cùng loại để chỉ định tên bài muốn cướp, hoặc 5 lá khác nhau để nhặt bài từ Mộ!",
    emoji: "",
    colorHex: "#94a3b8",
    secondaryHex: "#1e293b",
    category: "cat",
    pack: "core",
  },
  rainbow_cat: {
    type: "rainbow_cat",
    nameVi: "Mèo Cầu Vồng (Rainbow Cat)",
    shortVi: "Mèo Cầu Vồng",
    subtitleVi: "Lá Mèo • Ghép đôi / bộ 3 / bộ 5",
    ruleVi:
      "Không có tác dụng đơn lẻ. Ghép 2 lá cùng loại để cướp 1 lá ngẫu nhiên, 3 lá cùng loại để chỉ định tên bài muốn cướp, hoặc 5 lá khác nhau để nhặt bài từ Mộ!",
    emoji: "",
    colorHex: "#38bdf8",
    secondaryHex: "#0c4a6e",
    category: "cat",
    pack: "core",
  },
  de_cat_ipated: {
    type: "de_cat_ipated",
    nameVi: "Mèo Rớt Đầu (De-Cat-Ipated)",
    shortVi: "De-Cat-Ipated",
    subtitleVi: "Lá Mèo Zombie • Ghép đôi / bộ 3 / bộ 5",
    ruleVi:
      "Không có tác dụng đơn lẻ. Ghép 2 lá cùng loại để cướp 1 lá ngẫu nhiên, 3 lá cùng loại để chỉ định tên bài muốn cướp, hoặc 5 lá khác nhau để nhặt bài từ Mộ!",
    emoji: "⬛",
    colorHex: "#94a3b8",
    secondaryHex: "#1e293b",
    category: "cat",
    pack: "zombie",
  },
  vampire_cat: {
    type: "vampire_cat",
    nameVi: "Mèo Ma Cà Rồng (Vampire Cat)",
    shortVi: "Vampire Cat",
    subtitleVi: "Lá Mèo Zombie • Ghép đôi / bộ 3 / bộ 5",
    ruleVi:
      "Không có tác dụng đơn lẻ. Ghép 2 lá cùng loại để cướp 1 lá ngẫu nhiên, 3 lá cùng loại để chỉ định tên bài muốn cướp, hoặc 5 lá khác nhau để nhặt bài từ Mộ!",
    emoji: "",
    colorHex: "#a855f7",
    secondaryHex: "#3b0764",
    category: "cat",
    pack: "zombie",
  },
  zombie_cat: {
    type: "zombie_cat",
    nameVi: "Mèo Xác Sống Ăn Mắt (Zombie Cat)",
    shortVi: "Zombie Cat",
    subtitleVi: "Lá Mèo Zombie • Ghép đôi / bộ 3 / bộ 5",
    ruleVi:
      "Không có tác dụng đơn lẻ. Ghép 2 lá cùng loại để cướp 1 lá ngẫu nhiên, 3 lá cùng loại để chỉ định tên bài muốn cướp, hoặc 5 lá khác nhau để nhặt bài từ Mộ!",
    emoji: "",
    colorHex: "#65a30d",
    secondaryHex: "#1a2e05",
    category: "cat",
    pack: "zombie",
  },
  armageddon: {
    type: "armageddon",
    nameVi: "Tận Thế (Armageddon)",
    shortVi: "Armageddon",
    subtitleVi: "Đấu trí Thiện & Ác: Giành Mèo Thần, đẩy Mèo Quỷ!",
    ruleVi:
      "Chỉ đánh được khi cả Mèo Thần (Godcat) và Mèo Quỷ (Devilcat) đang ở trên Thảm đấu. Bạn bí mật chia úp 2 lá cho mình và 1 đối thủ. Đối thủ phải chọn GIỮ hay ĐỔI mà không được xem: ai nhận Mèo Thần sẽ cầm về tay, ai nhận Mèo Quỷ sẽ NỔ NGAY LẬP TỨC (phải dùng Defuse hoặc bị loại)! Sau đó Mèo Quỷ quay lại Thảm và kết thúc lượt của bạn.",
    emoji: "",
    colorHex: "#dc2626",
    secondaryHex: "#450a0a",
    category: "action",
    pack: "good_vs_evil",
    needsTargetSeat: true,
  },
  godcat: {
    type: "godcat",
    nameVi: "Mèo Thần (Godcat)",
    shortVi: "Mèo Thần",
    subtitleVi: "Vạn Năng: Hóa thành MỌI lá bài (trừ Nope)!",
    ruleVi:
      "Lá bài tối thượng từ Thảm Thiện & Ác! Có thể đánh hóa thân thành BẤT KỲ lá Hành Động nào bạn muốn (Tấn Công, Bỏ Lượt, Đổi Tương Lai, Xin Xỏ, Bom Nguyên Tử...) HOẶC tự động làm lá Tháo Ngòi (Defuse) khi gặp Bom — ngoại trừ KHÔNG thể dùng làm Nope! Sau khi dùng, Mèo Thần quay trở lại Thảm đấu (không vào Mộ hay Bộ bài rút).",
    emoji: "",
    colorHex: "#facc15",
    secondaryHex: "#854d0e",
    category: "action",
    pack: "good_vs_evil",
  },
  devilcat: {
    type: "devilcat",
    nameVi: "Mèo Quỷ (Devilcat)",
    shortVi: "Mèo Quỷ",
    subtitleVi: "Lật phải trong Armageddon là NỔ NGAY!",
    ruleVi:
      "Nằm cố định trên Thảm Thiện & Ác và chỉ xuất hiện trong màn đấu trí Tận Thế (Armageddon). Ai lật trúng Mèo Quỷ lập tức PHÁT NỔ — buộc phải đốt 1 lá Tháo Ngòi (Defuse) hoặc bị loại ngay lập tức! Dù nổ hay gỡ được, Mèo Quỷ luôn quay trở lại Thảm đấu.",
    emoji: "",
    colorHex: "#991b1b",
    secondaryHex: "#2a0606",
    category: "bomb",
    pack: "good_vs_evil",
  },
  raising_heck: {
    type: "raising_heck",
    nameVi: "Quậy Tưng Bừng (Raising Heck)",
    shortVi: "Raising Heck",
    subtitleVi: "Xem lá ĐÁY: Lấy về tay hoặc đặt lên ĐỈNH!",
    ruleVi:
      "Bí mật xem lá bài nằm dưới ĐÁY CÙNG của Bộ bài rút. Bạn được quyền chọn: lấy lá đó về tay HOẶC đặt thẳng nó lên ĐỈNH Bộ bài rút (không kích nổ bom nếu đặt lên đỉnh!). Dù chọn cách nào, lượt của bạn cũng kết thúc ngay.",
    emoji: "",
    colorHex: "#ea580c",
    secondaryHex: "#431407",
    category: "action",
    pack: "good_vs_evil",
  },
  reveal_future_3: {
    type: "reveal_future_3",
    nameVi: "Tiết Lộ Tương Lai 3x (Reveal Future)",
    shortVi: "Tiết Lộ 3x",
    subtitleVi: "Lật công khai 3 lá đầu Bộ bài cho CẢ BÀN xem!",
    ruleVi:
      "Lật mở 3 lá trên cùng của Bộ bài rút cho TẤT CẢ mọi người chơi trên bàn cùng nhìn thấy theo đúng thứ tự, sau đó úp lại nguyên vị trí cũ (không kết thúc lượt).",
    emoji: "",
    colorHex: "#a855f7",
    secondaryHex: "#3b0764",
    category: "action",
    pack: "good_vs_evil",
  },
  horse_cat: {
    type: "horse_cat",
    nameVi: "Mèo Ngựa (Horse Cat)",
    shortVi: "Horse Cat",
    subtitleVi: "Lá Mèo Thiện & Ác • Ghép đôi / bộ 3 / bộ 5",
    ruleVi:
      "Không có tác dụng đơn lẻ. Ghép 2 lá cùng loại để cướp 1 lá ngẫu nhiên, 3 lá cùng loại để chỉ định tên bài muốn cướp, hoặc 5 lá khác nhau để nhặt bài từ Mộ!",
    emoji: "",
    colorHex: "#b45309",
    secondaryHex: "#451a03",
    category: "cat",
    pack: "good_vs_evil",
  },
  knight_cat: {
    type: "knight_cat",
    nameVi: "Mèo Hiệp Sĩ (Knight Cat)",
    shortVi: "Knight Cat",
    subtitleVi: "Lá Mèo Thiện & Ác • Ghép đôi / bộ 3 / bộ 5",
    ruleVi:
      "Không có tác dụng đơn lẻ. Ghép 2 lá cùng loại để cướp 1 lá ngẫu nhiên, 3 lá cùng loại để chỉ định tên bài muốn cướp, hoặc 5 lá khác nhau để nhặt bài từ Mộ!",
    emoji: "",
    colorHex: "#64748b",
    secondaryHex: "#0f172a",
    category: "cat",
    pack: "good_vs_evil",
  },
  mercat: {
    type: "mercat",
    nameVi: "Mèo Tiên Cá (Mercat)",
    shortVi: "Mercat",
    subtitleVi: "Lá Mèo Thiện & Ác • Ghép đôi / bộ 3 / bộ 5",
    ruleVi:
      "Không có tác dụng đơn lẻ. Ghép 2 lá cùng loại để cướp 1 lá ngẫu nhiên, 3 lá cùng loại để chỉ định tên bài muốn cướp, hoặc 5 lá khác nhau để nhặt bài từ Mộ!",
    emoji: "",
    colorHex: "#06b6d4",
    secondaryHex: "#164e63",
    category: "cat",
    pack: "good_vs_evil",
  },
  troll_cat: {
    type: "troll_cat",
    nameVi: "Mèo Cào Phím (Troll Cat)",
    shortVi: "Troll Cat",
    subtitleVi: "Lá Mèo Thiện & Ác • Ghép đôi / bộ 3 / bộ 5",
    ruleVi:
      "Không có tác dụng đơn lẻ. Ghép 2 lá cùng loại để cướp 1 lá ngẫu nhiên, 3 lá cùng loại để chỉ định tên bài muốn cướp, hoặc 5 lá khác nhau để nhặt bài từ Mộ!",
    emoji: "",
    colorHex: "#64748b",
    secondaryHex: "#1e293b",
    category: "cat",
    pack: "good_vs_evil",
  },
};

export const IK_GODCAT_MIMICABLE_TYPES: IkCardType[] = [
  "attack",
  "targeted_attack",
  "skip",
  "super_skip",
  "reverse",
  "draw_bottom",
  "favor",
  "shuffle",
  "see_future_3",
  "see_future_5",
  "alter_future_3",
  "alter_future_5",
  "share_future_3",
  "reveal_future_3",
  "raising_heck",
  "swap_top_bottom",
  "catomic_bomb",
  "garbage_collection",
  "curse_cat_butt",
  "mark",
  "bury",
  "potluck",
  "ill_take_that",
  "personal_attack",
  "dig_deeper",
  "clairvoyance",
  "attack_of_the_dead",
  "feed_the_dead",
  "grave_robber",
];

export const IK_CAT_TYPES: IkCardType[] = [
  "tacocat",
  "catermelon",
  "hairy_potato_cat",
  "beard_cat",
  "rainbow_cat",
];

export const IK_ALL_CAT_TYPES: IkCardType[] = [
  ...IK_CAT_TYPES,
  "de_cat_ipated",
  "vampire_cat",
  "zombie_cat",
  "horse_cat",
  "knight_cat",
  "mercat",
  "troll_cat",
];

export interface IkCard {
  id: string;
  type: IkCardType;
  /** True for Imploding Kitten after it has been drawn once and reinserted FACE UP */
  faceUp?: boolean;
  /** True if hit by a Mark card (visible face-up to all players while in hand) */
  marked?: boolean;
}

export type IkStep =
  | "TurnPlayStep"
  | "NopeWindowStep"
  | "DefuseInsertStep"
  | "AlterFutureStep"
  | "FavorGiveStep"
  | "Combo2PickStep"
  | "DigDeeperStep"
  | "GarbagePickStep"
  | "ArmageddonStep"
  | "RaisingHeckStep"
  | "Finished";

export const IK_MIN_EXPLODING_KITTENS = 1;
export const IK_MAX_EXPLODING_KITTENS = 15;

export interface IkConfig {
  expansions: Record<IkExpansionId, boolean>;
  /**
   * Optional host-configured number of Exploding Kittens (`1..15`).
   * `null` or `undefined` uses the official auto formula based on player count & enabled expansions.
   */
  explodingKittenCount?: number | null;
  timers: {
    turnSeconds: number;
    nopeSeconds: number;
  };
}

export function getDefaultExplodingKittenCount(
  expansions: Record<IkExpansionId, boolean>,
  seatCount: number
): number {
  const safeSeats = Math.max(2, seatCount);
  const useImplodingBomb = Boolean(expansions.imploding);
  const extraStreakingBomb = expansions.streaking ? 1 : 0;
  const totalBombs = Math.max(1, safeSeats - 1 + extraStreakingBomb);
  const implodingCount = useImplodingBomb ? 1 : 0;
  return Math.max(0, totalBombs - implodingCount);
}

export interface IkPendingAction {
  kind: "SINGLE_CARD" | "COMBO_2" | "COMBO_3" | "COMBO_5";
  actorSeatNo: number;
  cards: IkCard[];
  effectiveType?: IkCardType;
  isGodcat?: boolean;
  targetSeatNo?: number;
  wantedCardType?: IkCardType;
  discardCardId?: string;
  nopeCount: number;
  lastNopeBySeatNo: number | null;
  passedSeatNos: number[];
}

export interface IkVisionCardItem {
  labelVi: string;
  emoji: string;
  colorHex: string;
  cardId?: string;
  cardType?: IkCardType;
  positionLabelVi?: string;
  faceUp?: boolean;
}

export interface IkSeatState {
  seatNo: number;
  actorId: string;
  displayName: string;
  avatarSeed: string;
  alive: boolean;
  eliminatedBy: "exploding" | "imploding" | "barking" | "devilcat" | null;
  hand: IkCard[];
  isBlind: boolean;
  barkingPlayedFaceUp: boolean;
  illTakeThatFromSeatNo: number | null;
  /** Private temporary knowledge (See Future / Clairvoyance / Share Future) */
  privateVision: {
    titleVi: string;
    cards: IkVisionCardItem[];
  } | null;
}

export interface IkLastAnim {
  id: number;
  kind:
    | "PLAY_CARD"
    | "DRAW_SAFE"
    | "NOPE"
    | "YUP"
    | "DEFUSE"
    | "IMPLODING_FACEUP"
    | "EXPLODE_DEATH"
    | "IMPLODE_DEATH"
    | "COMBO_STEAL"
    | "CATOMIC_BOMB"
    | "REVERSE";
  actorSeatNo: number;
  targetSeatNo?: number;
  card?: IkCard;
  /** True when Tower of Power intercepted the steal (stash card stays secret from target) */
  fromTower?: boolean;
  messageVi?: string;
  atMs: number;
}

export interface IkMatchState {
  config: IkConfig;
  turnNumber: number;
  step: IkStep;
  activeSeatNo: number;
  /** 1 = Clockwise, -1 = Counter-Clockwise (Cone of Shame direction!) */
  direction: 1 | -1;
  /** Number of turns the current activeSeatNo must complete before play passes */
  turnsRemaining: number;
  seats: IkSeatState[];
  drawPile: IkCard[];
  discardPile: IkCard[];
  /** Barking Kittens: Seat currently wearing the Tower of Power crown */
  towerHolderSeatNo: number | null;
  /** Barking Kittens: Face-down Stash cards (6 cards set aside at match start) protecting the Tower holder */
  towerStashCards: IkCard[];
  /** Good vs. Evil: True when Godcat is currently resting on the Playmat (required to play Armageddon) */
  godcatOnPlaymat: boolean;
  pendingAction: IkPendingAction | null;
  /** Holds the bomb or bury card currently waiting to be inserted into Draw Pile during DefuseInsertStep */
  pendingInsert: {
    seatNo: number;
    card: IkCard;
    reason: "DEFUSE_EXPLODING" | "INSERT_IMPLODING_FACEUP" | "BURY_CARD";
    endsTurnOnInsert: boolean;
  } | null;
  /** Holds the top N cards currently being reordered during AlterFutureStep */
  pendingAlterFuture: {
    seatNo: number;
    count: number;
    shareWithNextSeatNo: number | null;
    cards: IkCard[];
  } | null;
  /** Holds the Favor target waiting to hand over 1 card during FavorGiveStep */
  pendingFavor: {
    fromSeatNo: number;
    toSeatNo: number;
  } | null;
  /** Holds the 2-Card Combo attacker choosing which card slot to draw from target's shuffled hand */
  pendingCombo2Pick: {
    actorSeatNo: number;
    targetSeatNo: number;
    shuffledCardIds: string[];
  } | null;
  /** Holds the Dig Deeper top card choice during DigDeeperStep */
  pendingDigDeeper: {
    seatNo: number;
    topCard: IkCard;
    secondCard: IkCard | null;
  } | null;
  /** Holds Garbage Collection, Potluck, or Feed the Dead pending submissions */
  pendingGroupSubmit: {
    mode: "GARBAGE_COLLECTION" | "POTLUCK" | "FEED_THE_DEAD";
    recipientSeatNo?: number;
    pendingSeatNos: number[];
    collectedCards: { seatNo: number; card: IkCard }[];
  } | null;
  /** Good vs. Evil: Armageddon two-stage Godcat/Devilcat bluff showdown */
  pendingArmageddon: {
    actorSeatNo: number;
    targetSeatNo: number;
    stage: "ACTOR_PLACE" | "TARGET_CHOOSE";
    godcatGivenToTarget: boolean | null;
  } | null;
  /** Good vs. Evil: Raising Heck bottom card peek decision */
  pendingRaisingHeck: {
    seatNo: number;
    bottomCard: IkCard;
  } | null;
  animSeq: number;
  lastAnim: IkLastAnim | null;
  winnerSeatNos: number[];
  winReasonVi: string | null;
  phaseDeadlineMs: number | null;
}

export type IkCommand =
  | {
      type: "PLAY_CARD";
      cardId: string;
      targetSeatNo?: number;
      /** Used when playing Godcat: the action card type Godcat transforms into (cannot be Nope) */
      mimicCardType?: IkCardType;
    }
  | {
      type: "PLAY_COMBO_2";
      cardIds: [string, string];
      targetSeatNo: number;
    }
  | {
      type: "PLAY_COMBO_3";
      cardIds: [string, string, string];
      targetSeatNo: number;
      wantedCardType: IkCardType;
    }
  | {
      type: "PLAY_COMBO_5";
      cardIds: [string, string, string, string, string];
      discardCardId: string;
    }
  | {
      type: "DRAW_CARD";
    }
  | {
      type: "PLAY_NOPE";
      cardId?: string;
    }
  | {
      type: "PASS_NOPE";
    }
  | {
      type: "INSERT_CARD";
      insertIndex: number; // 0 = Top of drawPile (end of array), drawPile.length = Bottom (index 0)
    }
  | {
      type: "COMMIT_ALTER_FUTURE";
      orderedCardIds: string[]; // Ordered from TOP (#1) to deeper (#N)
    }
  | {
      type: "GIVE_FAVOR_CARD";
      cardId: string;
    }
  | {
      type: "PICK_COMBO_2_CARD";
      cardIndex: number;
    }
  | {
      type: "DIG_DEEPER_DECIDE";
      keepFirst: boolean;
    }
  | {
      type: "SUBMIT_GROUP_CARD";
      cardId: string;
    }
  | {
      type: "CLAIM_TOWER_STASH";
    }
  | {
      type: "ARMAGEDDON_PLACE";
      giveGodcatToTarget: boolean;
    }
  | {
      type: "ARMAGEDDON_DECIDE";
      swap: boolean;
    }
  | {
      type: "RAISING_HECK_DECIDE";
      takeToHand: boolean;
    };

export interface IkSeatView {
  seatNo: number;
  actorId: string;
  displayName: string;
  avatarSeed: string;
  alive: boolean;
  eliminatedBy: "exploding" | "imploding" | "barking" | "devilcat" | null;
  handCount: number;
  isBlind: boolean;
  barkingPlayedFaceUp: boolean;
  illTakeThatFromSeatNo: number | null;
  /** Good vs. Evil: True if this seat holds Godcat (has a distinct golden card back visible to all!) */
  hasGodcat: boolean;
  /** Publicly visible Marked cards in this player's hand */
  markedCards: IkCard[];
}

export interface IkPlayerView {
  cartridgeId: "imploding-kittens";
  turnNumber: number;
  step: IkStep;
  activeSeatNo: number;
  viewerSeatNo: number | null;
  direction: 1 | -1;
  turnsRemaining: number;
  seats: IkSeatView[];
  drawPileCount: number;
  /** If the top card of Draw Pile is a FACE-UP Imploding Kitten, everyone sees it! */
  topDrawCardFaceUp: IkCard | null;
  /** Number of known face-up Imploding Kittens currently inside the Draw Pile */
  faceUpImplodingInDeck: boolean;
  discardPileCount: number;
  discardTopCard: IkCard | null;
  /** Recent discard pile cards (for 5-card combo selection & inspection) */
  discardPileCards: IkCard[];
  towerHolderSeatNo: number | null;
  towerStashCount: number;
  godcatOnPlaymat: boolean;
  myHand: IkCard[];
  myIsBlind: boolean;
  myPrivateVision: {
    titleVi: string;
    cards: IkVisionCardItem[];
  } | null;
  pendingAction: {
    kind: IkPendingAction["kind"];
    actorSeatNo: number;
    cards: IkCard[];
    effectiveType?: IkCardType;
    targetSeatNo?: number;
    wantedCardType?: IkCardType;
    nopeCount: number;
    isCanceledByNope: boolean;
    lastNopeBySeatNo: number | null;
    canViewerNope: boolean;
    hasViewerPassedNope: boolean;
  } | null;
  pendingInsert: {
    seatNo: number;
    card: IkCard;
    reason: "DEFUSE_EXPLODING" | "INSERT_IMPLODING_FACEUP" | "BURY_CARD";
    maxInsertIndex: number;
  } | null;
  pendingAlterFuture: {
    seatNo: number;
    count: number;
    cards: IkCard[]; // Only populated for the acting seat
  } | null;
  pendingFavor: {
    fromSeatNo: number;
    toSeatNo: number;
  } | null;
  pendingCombo2Pick: {
    actorSeatNo: number;
    targetSeatNo: number;
    targetDisplayName: string;
    /** Null = face-down card slot; IkCard = publicly Marked card visible face-up */
    slots: (IkCard | null)[];
  } | null;
  pendingDigDeeper: {
    seatNo: number;
    topCard: IkCard | null; // Only populated for acting seat
    hasSecondCard: boolean;
  } | null;
  pendingGroupSubmit: {
    mode: "GARBAGE_COLLECTION" | "POTLUCK" | "FEED_THE_DEAD";
    pendingSeatNos: number[];
    needsViewerCard: boolean;
  } | null;
  pendingArmageddon: {
    actorSeatNo: number;
    actorDisplayName: string;
    targetSeatNo: number;
    targetDisplayName: string;
    stage: "ACTOR_PLACE" | "TARGET_CHOOSE";
    /** Only populated for actorSeatNo; null for targetSeatNo & everyone else! */
    godcatGivenToTarget: boolean | null;
  } | null;
  pendingRaisingHeck: {
    seatNo: number;
    /** Only populated for the acting seat */
    bottomCard: IkCard | null;
  } | null;
  lastAnim: IkLastAnim | null;
  winnerSeatNos: number[];
  winReasonVi: string | null;
  phaseDeadlineMs: number | null;
  config: IkConfig;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function cloneState(state: IkMatchState): IkMatchState {
  return {
    ...state,
    seats: state.seats.map((s) => ({
      ...s,
      hand: s.hand.map((c) => ({ ...c })),
      privateVision: s.privateVision
        ? {
            titleVi: s.privateVision.titleVi,
            cards: [...s.privateVision.cards],
          }
        : null,
    })),
    drawPile: state.drawPile.map((c) => ({ ...c })),
    discardPile: state.discardPile.map((c) => ({ ...c })),
    towerHolderSeatNo: state.towerHolderSeatNo ?? null,
    towerStashCards: (state.towerStashCards ?? []).map((c) => ({ ...c })),
    godcatOnPlaymat: state.godcatOnPlaymat ?? false,
    pendingAction: state.pendingAction
      ? {
          ...state.pendingAction,
          cards: state.pendingAction.cards.map((c) => ({ ...c })),
          passedSeatNos: [...state.pendingAction.passedSeatNos],
        }
      : null,
    pendingInsert: state.pendingInsert
      ? {
          ...state.pendingInsert,
          card: { ...state.pendingInsert.card },
        }
      : null,
    pendingAlterFuture: state.pendingAlterFuture
      ? {
          ...state.pendingAlterFuture,
          cards: state.pendingAlterFuture.cards.map((c) => ({ ...c })),
        }
      : null,
    pendingFavor: state.pendingFavor ? { ...state.pendingFavor } : null,
    pendingCombo2Pick: state.pendingCombo2Pick
      ? {
          ...state.pendingCombo2Pick,
          shuffledCardIds: [...(state.pendingCombo2Pick.shuffledCardIds ?? [])],
        }
      : null,
    pendingDigDeeper: state.pendingDigDeeper
      ? {
          ...state.pendingDigDeeper,
          topCard: { ...state.pendingDigDeeper.topCard },
          secondCard: state.pendingDigDeeper.secondCard
            ? { ...state.pendingDigDeeper.secondCard }
            : null,
        }
      : null,
    pendingGroupSubmit: state.pendingGroupSubmit
      ? {
          ...state.pendingGroupSubmit,
          pendingSeatNos: [...state.pendingGroupSubmit.pendingSeatNos],
          collectedCards: state.pendingGroupSubmit.collectedCards.map((x) => ({
            seatNo: x.seatNo,
            card: { ...x.card },
          })),
        }
      : null,
    pendingArmageddon: state.pendingArmageddon
      ? { ...state.pendingArmageddon }
      : null,
    pendingRaisingHeck: state.pendingRaisingHeck
      ? {
          ...state.pendingRaisingHeck,
          bottomCard: { ...state.pendingRaisingHeck.bottomCard },
        }
      : null,
    winnerSeatNos: [...state.winnerSeatNos],
  };
}

function getSeat(state: IkMatchState, seatNo: number): IkSeatState {
  const seat = state.seats.find((s) => s.seatNo === seatNo);
  if (!seat) throw new Error("Không tìm thấy ghế người chơi.");
  return seat;
}

function getAliveSeats(state: IkMatchState): IkSeatState[] {
  return state.seats.filter((s) => s.alive);
}

function getNextAliveSeatNo(
  state: IkMatchState,
  fromSeatNo: number,
  dir: 1 | -1 = state.direction
): number {
  const total = state.seats.length;
  const startIdx = state.seats.findIndex((s) => s.seatNo === fromSeatNo);
  for (let step = 1; step <= total; step++) {
    const idx = (((startIdx + step * dir) % total) + total) % total;
    if (state.seats[idx].alive) {
      return state.seats[idx].seatNo;
    }
  }
  return fromSeatNo;
}

function setAnim(
  state: IkMatchState,
  anim: Omit<IkLastAnim, "id" | "atMs">,
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
 * Builds the pre-bomb deck according to the Host's selected expansion packs!
 */
export function buildImplodingDeck(
  expansions: Record<IkExpansionId, boolean>,
  seatCount: number
): IkCard[] {
  const deck: IkCard[] = [];
  let seq = 1;
  const add = (type: IkCardType, count: number) => {
    for (let i = 0; i < count; i++) {
      deck.push({ id: `ik-${type}-${seq++}`, type });
    }
  };

  // 1. Core Exploding Kittens Action & Cat Cards
  add("nope", 5);
  add("attack", 4);
  add("skip", 4);
  add("favor", 4);
  add("shuffle", 4);
  add("see_future_3", 5);
  for (const cat of IK_CAT_TYPES) {
    add(cat, 4);
  }
  // Spare Defuses in deck (2 spare defuses)
  add("defuse", 2);

  // 2. Expansion #1: Imploding Kittens (19 non-bomb cards; 1 Imploding Kitten added with bombs)
  if (expansions.imploding) {
    add("feral_cat", 4);
    add("reverse", 4);
    add("draw_bottom", 4);
    add("alter_future_3", 4);
    add("targeted_attack", 3);
  }

  // 3. Expansion #2: Streaking Kittens
  if (expansions.streaking) {
    add("streaking_kitten", 1);
    add("super_skip", 1);
    add("see_future_5", 1);
    add("alter_future_5", 1);
    add("swap_top_bottom", 3);
    add("garbage_collection", 1);
    add("catomic_bomb", 1);
    add("curse_cat_butt", 2);
    add("mark", 3);
  }

  // 4. Expansion #3: Barking Kittens
  if (expansions.barking) {
    add("barking_kitten", 2);
    add("tower_of_power", 1);
    add("bury", 2);
    add("personal_attack", 2);
    add("share_future_3", 2);
    add("potluck", 1);
    add("ill_take_that", 2);
  }

  // 5. Expansion #4: Zombie Kittens & Recipes for Disaster
  if (expansions.zombie) {
    add("zombie_kitten", 4);
    add("clone", 3);
    add("dig_deeper", 4);
    add("attack_of_the_dead", 3);
    add("clairvoyance", 2);
    add("feed_the_dead", 2);
    add("grave_robber", 1);
    add("de_cat_ipated", 4);
    add("vampire_cat", 4);
    add("zombie_cat", 4);
  }

  // 6. Expansion #5: Good vs. Evil (Netflix Series Edition)
  if (expansions.good_vs_evil) {
    add("armageddon", 3);
    add("raising_heck", 2);
    add("reveal_future_3", 3);
    add("horse_cat", 4);
    add("knight_cat", 4);
    add("mercat", 4);
    add("troll_cat", 4);
  }

  return deck;
}

/**
 * Checks if only 1 living player remains -> declares victory!
 */
function checkVictory(
  state: IkMatchState,
  events: MatchEventRecord[],
  nowMs: number
): boolean {
  const alive = getAliveSeats(state);
  if (alive.length > 1) return false;

  const winner = alive[0] ?? state.seats[0];
  state.step = "Finished";
  state.pendingAction = null;
  state.pendingInsert = null;
  state.pendingAlterFuture = null;
  state.pendingFavor = null;
  state.pendingCombo2Pick = null;
  state.pendingDigDeeper = null;
  state.pendingGroupSubmit = null;
  state.pendingArmageddon = null;
  state.pendingRaisingHeck = null;
  state.phaseDeadlineMs = null;
  state.winnerSeatNos = [winner.seatNo];
  state.winReasonVi = `${winner.displayName} là người sống sót cuối cùng trong đại chiến Mèo Nổ & Mèo Hố Đen!`;

  events.push({
    eventType: "IK_MATCH_FINISHED",
    message: state.winReasonVi,
    visibleToSeatNos: "all",
  });
  return true;
}

/**
 * Advances the current turn after a player finishes 1 of their `turnsRemaining`
 * (by drawing safely, defusing, burying, or playing Skip / Reverse / Draw Bottom / Catomic Bomb).
 */
function consumeOneTurnOrAdvanceSeat(
  state: IkMatchState,
  events: MatchEventRecord[],
  nowMs: number
): void {
  if (checkVictory(state, events, nowMs)) return;

  const active = getSeat(state, state.activeSeatNo);
  if (!active.alive) {
    // Eliminated player loses all remaining owed turns; next living player starts with 1 turn
    state.turnsRemaining = 1;
    state.activeSeatNo = getNextAliveSeatNo(state, active.seatNo);
    state.turnNumber += 1;
    state.step = "TurnPlayStep";
    state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
    return;
  }

  if (state.turnsRemaining > 1) {
    state.turnsRemaining -= 1;
    state.step = "TurnPlayStep";
    state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
    events.push({
      eventType: "IK_EXTRA_TURN_REMAINING",
      message: `${active.displayName} hoàn thành 1 lượt — vẫn còn ${state.turnsRemaining} lượt phải đi tiếp!`,
      visibleToSeatNos: "all",
    });
    return;
  }

  state.turnsRemaining = 1;
  state.activeSeatNo = getNextAliveSeatNo(state, active.seatNo);
  state.turnNumber += 1;
  state.step = "TurnPlayStep";
  state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
}

/**
 * Pushes discarded cards to `discardPile`, EXCEPT `godcat` which per official Good vs. Evil rules
 * ALWAYS returns to the Playmat and never enters the Discard or Draw Pile.
 */
function discardCardsRespectingPlaymat(state: IkMatchState, cards: IkCard[]): void {
  for (const c of cards) {
    if (c.type === "godcat") {
      state.godcatOnPlaymat = true;
    } else if (c.type !== "devilcat") {
      state.discardPile.push(c);
    }
  }
}

/**
 * Checks if `seat` is holding an `exploding_kitten` in hand WITHOUT a `streaking_kitten` (e.g. after their Streaking Kitten was stolen or given away!).
 * If so, immediately triggers the Exploding Kitten in their hand!
 */
function checkExposedHandBomb(
  state: IkMatchState,
  seat: IkSeatState,
  events: MatchEventRecord[],
  nowMs: number
): void {
  const bombIdx = seat.hand.findIndex((c) => c.type === "exploding_kitten");
  if (bombIdx === -1) return;
  const hasStreaking = seat.hand.some((c) => c.type === "streaking_kitten");
  if (hasStreaking) return;

  // Their Streaking Kitten is gone while holding an Exploding Kitten!
  const [bomb] = seat.hand.splice(bombIdx, 1);
  let defuseIdx = seat.hand.findIndex((c) => c.type === "defuse");
  if (defuseIdx === -1) {
    defuseIdx = seat.hand.findIndex((c) => c.type === "zombie_kitten");
  }
  if (defuseIdx === -1) {
    defuseIdx = seat.hand.findIndex((c) => c.type === "godcat");
  }
  if (defuseIdx !== -1) {
    const [defuseCard] = seat.hand.splice(defuseIdx, 1);
    discardCardsRespectingPlaymat(state, [defuseCard]);
    // Reinsert bomb at random position in drawPile
    const randPos = Math.floor(Math.random() * (state.drawPile.length + 1));
    state.drawPile.splice(randPos, 0, bomb);
    if (defuseCard.type === "zombie_kitten") {
      const deadSeat = state.seats.find((s) => !s.alive);
      if (deadSeat) {
        deadSeat.alive = true;
        deadSeat.eliminatedBy = null;
        events.push({
          eventType: "IK_ZOMBIE_REVIVE",
          message: `${seat.displayName} dùng Mèo Xác Sống (Zombie Kitten) gỡ bom VÀ HỒI SINH ${deadSeat.displayName} quay lại bàn đấu!`,
          visibleToSeatNos: "all",
        });
      }
    }
    events.push({
      eventType: "IK_STREAKING_LOST_DEFUSED",
      message: `${seat.displayName} bị mất Mèo Chạy Rông khi đang giấu Mèo Nổ trên tay — buộc phải dùng ngay 1 lá ${defuseCard.type === "godcat" ? "Mèo Thần (Godcat — quay về Thảm đấu)" : defuseCard.type === "zombie_kitten" ? "Mèo Xác Sống (Zombie Kitten)" : "Tháo Ngòi (Defuse)"} và nhét lại bom vào bộ bài!`,
      visibleToSeatNos: "all",
    });
  } else {
    seat.alive = false;
    seat.eliminatedBy = "exploding";
    discardCardsRespectingPlaymat(state, [bomb, ...seat.hand]);
    seat.hand = [];
    setAnim(
      state,
      {
        kind: "EXPLODE_DEATH",
        actorSeatNo: seat.seatNo,
        card: bomb,
      },
      nowMs
    );
    events.push({
      eventType: "IK_PLAYER_EXPLODED",
      message: `BÙM! ${seat.displayName} mất Mèo Chạy Rông khi đang ôm Mèo Nổ trên tay và không còn Defuse — bị nổ văng khỏi bàn!`,
      visibleToSeatNos: "all",
    });
    checkVictory(state, events, nowMs);
  }
}

/**
 * Handles a player drawing a specific card (`drawnCard`) from top or bottom of `drawPile`.
 * Accounts for:
 * - `ill_take_that` redirection!
 * - Clearing `isBlind` (Curse of the Cat Butt) on a successful draw!
 * - `exploding_kitten` (Streaking Kitten hold, Defuse insert, or Explosion elimination!)
 * - `imploding_kitten` (Face-down -> insert back Face-Up; Face-up -> instant Implosion elimination!)
 */
function resolveCardDrawnBySeat(
  state: IkMatchState,
  drawerSeat: IkSeatState,
  drawnCard: IkCard,
  fromBottom: boolean,
  events: MatchEventRecord[],
  nowMs: number
): void {
  // Check "I'll Take That" trap on drawerSeat!
  let recipient = drawerSeat;
  if (drawerSeat.illTakeThatFromSeatNo !== null) {
    const thief = state.seats.find(
      (s) => s.seatNo === drawerSeat.illTakeThatFromSeatNo && s.alive
    );
    drawerSeat.illTakeThatFromSeatNo = null;
    if (thief) {
      recipient = thief;
      events.push({
        eventType: "IK_ILL_TAKE_THAT_TRIGGER",
        message: `Đưa Đây Cho Tôi! Lá bài ${drawerSeat.displayName} vừa rút được chuyển thẳng sang tay của ${thief.displayName}!`,
        visibleToSeatNos: "all",
      });
    }
  }

  // Clear Curse of the Cat Butt blindness upon drawing
  if (drawerSeat.isBlind) {
    drawerSeat.isBlind = false;
    events.push({
      eventType: "IK_BLIND_CLEARED",
      message: `${drawerSeat.displayName} đã hóa giải Lời Nguyền Mông Mèo (hết bị mù bài).`,
      visibleToSeatNos: "all",
    });
  }

  // CASE 1: IMPLODING KITTEN
  if (drawnCard.type === "imploding_kitten") {
    if (!drawnCard.faceUp) {
      // First time drawn (face-down): flip it FACE UP and let recipient choose where to insert it!
      drawnCard.faceUp = true;
      state.step = "DefuseInsertStep";
      state.pendingInsert = {
        seatNo: recipient.seatNo,
        card: drawnCard,
        reason: "INSERT_IMPLODING_FACEUP",
        endsTurnOnInsert: true,
      };
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;

      setAnim(
        state,
        {
          kind: "IMPLODING_FACEUP",
          actorSeatNo: recipient.seatNo,
          card: drawnCard,
        },
        nowMs
      );

      events.push({
        eventType: "IK_IMPLODING_DRAWN_FIRST",
        message: `${recipient.displayName} rút phải MÈO HỐ ĐEN (lần đầu)! Chưa nổ, nhưng nó đã LẬT NGỬA và đang được cài lại vào Bộ bài rút!`,
        visibleToSeatNos: "all",
      });
      return;
    } else {
      // Drawn while FACE UP -> CANNOT BE DEFUSED! Instant elimination!
      recipient.alive = false;
      recipient.eliminatedBy = "imploding";
      discardCardsRespectingPlaymat(state, [drawnCard, ...recipient.hand]);
      recipient.hand = [];

      setAnim(
        state,
        {
          kind: "IMPLODE_DEATH",
          actorSeatNo: recipient.seatNo,
          card: drawnCard,
        },
        nowMs
      );

      events.push({
        eventType: "IK_PLAYER_IMPLODED",
        message: `SẬP HỐ ĐEN! ${recipient.displayName} buộc phải rút Mèo Hố Đen đang Lật Ngửa (không thể dùng Defuse) và bị cuốn bay khỏi ván đấu!`,
        visibleToSeatNos: "all",
      });

      consumeOneTurnOrAdvanceSeat(state, events, nowMs);
      return;
    }
  }

  // CASE 2: EXPLODING KITTEN
  if (drawnCard.type === "exploding_kitten") {
    const hasStreaking = recipient.hand.some(
      (c) => c.type === "streaking_kitten"
    );
    const alreadyHoldingBomb = recipient.hand.some(
      (c) => c.type === "exploding_kitten"
    );

    // If holding Streaking Kitten and not already holding an Exploding Kitten in hand, safely keep it in hand!
    if (hasStreaking && !alreadyHoldingBomb) {
      recipient.hand.push(drawnCard);
      setAnim(
        state,
        {
          kind: "DRAW_SAFE",
          actorSeatNo: recipient.seatNo,
        },
        nowMs
      );
      events.push({
        eventType: "IK_STREAKING_SAVED",
        message: `${recipient.displayName} đã rút bài an toàn và kết thúc lượt!`,
        visibleToSeatNos: "all",
      });
      events.push({
        eventType: "IK_STREAKING_SECRET",
        message: `Bạn vừa rút phải Mèo Nổ nhưng nhờ có Mèo Chạy Rông trên tay nên bạn được phép GIẤU KÍN quả bom này trên tay mà không bị nổ!`,
        visibleToSeatNos: [recipient.seatNo],
      });
      consumeOneTurnOrAdvanceSeat(state, events, nowMs);
      return;
    }

    // Prefer Defuse -> Zombie Kitten -> Godcat (official rule: Godcat can act as Defuse and returns to Playmat!)
    let defuseIdx = recipient.hand.findIndex((c) => c.type === "defuse");
    if (defuseIdx === -1) {
      defuseIdx = recipient.hand.findIndex((c) => c.type === "zombie_kitten");
    }
    if (defuseIdx === -1) {
      defuseIdx = recipient.hand.findIndex((c) => c.type === "godcat");
    }
    if (defuseIdx !== -1) {
      // Auto-consume 1 Defuse / Zombie Kitten / Godcat card and enter DefuseInsertStep so player picks where to hide the bomb!
      const [defuseCard] = recipient.hand.splice(defuseIdx, 1);
      discardCardsRespectingPlaymat(state, [defuseCard]);

      let revivedMsg = "";
      if (defuseCard.type === "zombie_kitten") {
        const deadSeat = state.seats.find((s) => !s.alive);
        if (deadSeat) {
          deadSeat.alive = true;
          deadSeat.eliminatedBy = null;
          revivedMsg = ` ĐỒNG THỜI HỒI SINH ${deadSeat.displayName} quay lại bàn đấu!`;
        }
      }

      state.step = "DefuseInsertStep";
      state.pendingInsert = {
        seatNo: recipient.seatNo,
        card: drawnCard,
        reason: "DEFUSE_EXPLODING",
        endsTurnOnInsert: true,
      };
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;

      setAnim(
        state,
        {
          kind: "DEFUSE",
          actorSeatNo: recipient.seatNo,
          card: defuseCard,
        },
        nowMs
      );

      events.push({
        eventType: "IK_EXPLODING_DEFUSED",
        message:
          defuseCard.type === "godcat"
            ? `PHÉP MÀU MÈO THẦN! ${recipient.displayName} hóa Mèo Thần (Godcat) thành Tháo Ngòi gỡ Mèo Nổ (Mèo Thần quay về Thảm đấu) — đang chọn vị trí gài lại bom!`
            : defuseCard.type === "zombie_kitten"
              ? `HÚ HỒN! ${recipient.displayName} rút phải MÈO NỔ nhưng tung lá Mèo Xác Sống (Zombie Kitten) gỡ bom — đang chọn vị trí gài lại bom!${revivedMsg}`
              : `HÚ HỒN! ${recipient.displayName} rút phải MÈO NỔ nhưng kịp tung lá Tháo Ngòi (Defuse) — đang chọn vị trí gài lại bom vào Bộ bài!`,
        visibleToSeatNos: "all",
      });
      return;
    }

    // No Defuse and no Streaking Kitten -> BOOM! Eliminated!
    recipient.alive = false;
    recipient.eliminatedBy = "exploding";
    discardCardsRespectingPlaymat(state, [drawnCard, ...recipient.hand]);
    recipient.hand = [];

    setAnim(
      state,
      {
        kind: "EXPLODE_DEATH",
        actorSeatNo: recipient.seatNo,
        card: drawnCard,
      },
      nowMs
    );

    events.push({
      eventType: "IK_PLAYER_EXPLODED",
      message: `BÙM! ${recipient.displayName} rút phải MÈO NỔ mà không còn lá Tháo Ngòi (Defuse) — chính thức bị nổ tung!`,
      visibleToSeatNos: "all",
    });

    consumeOneTurnOrAdvanceSeat(state, events, nowMs);
    return;
  }

  // CASE 3: SAFE CARD
  recipient.hand.push(drawnCard);
  if (recipient.seatNo !== drawerSeat.seatNo) {
    setAnim(
      state,
      {
        kind: "COMBO_STEAL",
        actorSeatNo: recipient.seatNo,
        targetSeatNo: drawerSeat.seatNo,
        card: drawnCard,
        messageVi: "Đưa Đây Cho Tôi",
      },
      nowMs
    );
  } else {
    setAnim(
      state,
      {
        kind: "DRAW_SAFE",
        actorSeatNo: recipient.seatNo,
      },
      nowMs
    );
  }
  events.push({
    eventType: "IK_CARD_DRAWN",
    message: fromBottom
      ? `${drawerSeat.displayName} rút 1 lá dưới ĐÁY Bộ bài an toàn.`
      : `${drawerSeat.displayName} rút 1 lá từ Bộ bài an toàn.`,
    visibleToSeatNos: "all",
  });

  consumeOneTurnOrAdvanceSeat(state, events, nowMs);
}

/**
 * Resolves a pending action or combo after the Nope Window closes (or immediately if no opponent holds Nope).
 */
function executeResolvedAction(
  state: IkMatchState,
  pending: IkPendingAction,
  events: MatchEventRecord[],
  nowMs: number
): void {
  state.pendingAction = null;
  const actor = getSeat(state, pending.actorSeatNo);

  // If odd number of Nopes were played, the action is CANCELED!
  if (pending.nopeCount % 2 === 1) {
    state.step = "TurnPlayStep";
    state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
    events.push({
      eventType: "IK_ACTION_NOPED_FINAL",
      message: `Hành động của ${actor.displayName} đã bị vô hiệu hóa hoàn toàn bởi Nope!`,
      visibleToSeatNos: "all",
    });
    return;
  }

  // Special Combos:
  if (pending.kind === "COMBO_2") {
    const target = getSeat(state, pending.targetSeatNo!);
    if (
      state.towerHolderSeatNo === target.seatNo &&
      state.towerStashCards.length > 0
    ) {
      const stolen = state.towerStashCards.pop()!;
      stolen.marked = false;
      actor.hand.push(stolen);
      if (state.towerStashCards.length === 0) {
        state.towerHolderSeatNo = null;
      }
      setAnim(
        state,
        {
          kind: "COMBO_STEAL",
          actorSeatNo: actor.seatNo,
          targetSeatNo: target.seatNo,
          card: stolen,
          fromTower: true,
        },
        nowMs
      );
      events.push({
        eventType: "IK_TOWER_INTERCEPT",
        message: `Tháp Quyền Lực chắn đòn! ${actor.displayName} đánh Combo 2 Lá vào ${target.displayName} nhưng buộc phải rút mù 1 lá từ đỉnh Tháp (còn ${state.towerStashCards.length} lá trong Tháp)!`,
        visibleToSeatNos: "all",
      });
      state.step = "TurnPlayStep";
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      return;
    } else if (target.hand.length > 0) {
      // Tráo thứ tự bài của đối thủ khi hiển thị để rút (tránh lộ vị trí lá Defuse luôn nằm đầu tay)
      const shuffledCardIds = shuffle(
        target.hand.map((c) => c.id),
        Math.random
      );
      state.step = "Combo2PickStep";
      state.pendingCombo2Pick = {
        actorSeatNo: actor.seatNo,
        targetSeatNo: target.seatNo,
        shuffledCardIds,
      };
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      events.push({
        eventType: "IK_COMBO_2_PICK_START",
        message: `Combo 2 Lá! ${actor.displayName} đang chọn rút 1 lá bài (đã xáo trộn) từ tay của ${target.displayName}...`,
        visibleToSeatNos: "all",
      });
      return;
    }
    state.step = "TurnPlayStep";
    state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
    return;
  }

  if (pending.kind === "COMBO_3") {
    const target = getSeat(state, pending.targetSeatNo!);
    const wanted = pending.wantedCardType!;
    const wantedMeta = IK_CARD_META[wanted];

    if (
      state.towerHolderSeatNo === target.seatNo &&
      state.towerStashCards.length > 0
    ) {
      const stolen = state.towerStashCards.pop()!;
      stolen.marked = false;
      actor.hand.push(stolen);
      if (state.towerStashCards.length === 0) {
        state.towerHolderSeatNo = null;
      }
      setAnim(
        state,
        {
          kind: "COMBO_STEAL",
          actorSeatNo: actor.seatNo,
          targetSeatNo: target.seatNo,
          card: stolen,
          fromTower: true,
        },
        nowMs
      );
      events.push({
        eventType: "IK_TOWER_INTERCEPT",
        message: `Tháp Quyền Lực chắn đòn Combo 3 Lá! ${actor.displayName} buộc phải rút mù 1 lá từ đỉnh Tháp của ${target.displayName} thay vì lấy bài trên tay (còn ${state.towerStashCards.length} lá)!`,
        visibleToSeatNos: "all",
      });
      state.step = "TurnPlayStep";
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      return;
    }

    const foundIdx = target.hand.findIndex((c) => c.type === wanted);

    if (foundIdx !== -1) {
      const [stolen] = target.hand.splice(foundIdx, 1);
      stolen.marked = false;
      actor.hand.push(stolen);
      setAnim(
        state,
        {
          kind: "COMBO_STEAL",
          actorSeatNo: actor.seatNo,
          targetSeatNo: target.seatNo,
          card: stolen,
        },
        nowMs
      );
      events.push({
        eventType: "IK_COMBO_3_SUCCESS",
        message: `Combo 3 Lá! ${actor.displayName} gọi đúng tên lá [${wantedMeta.shortVi}] và tịch thu nó từ tay ${target.displayName}!`,
        visibleToSeatNos: "all",
      });
      checkExposedHandBomb(state, target, events, nowMs);
    } else {
      events.push({
        eventType: "IK_COMBO_3_MISS",
        message: `Combo 3 Lá! ${actor.displayName} đòi lá [${wantedMeta.shortVi}] nhưng ${target.displayName} không có lá nào trên tay!`,
        visibleToSeatNos: "all",
      });
    }
    state.step = "TurnPlayStep";
    state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
    return;
  }

  if (pending.kind === "COMBO_5") {
    const idx = state.discardPile.findIndex(
      (c) => c.id === pending.discardCardId
    );
    if (idx !== -1) {
      const [recovered] = state.discardPile.splice(idx, 1);
      actor.hand.push(recovered);
      events.push({
        eventType: "IK_COMBO_5_SUCCESS",
        message: `Combo 5 Lá Khác Nhau! ${actor.displayName} trục vớt thành công 1 lá bài từ Chồng bài bỏ về tay!`,
        visibleToSeatNos: "all",
      });
    }
    state.step = "TurnPlayStep";
    state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
    return;
  }

  // SINGLE ACTION CARD
  const effType = pending.effectiveType ?? pending.cards[0].type;

  switch (effType) {
    case "skip": {
      events.push({
        eventType: "IK_SKIP",
        message: `${actor.displayName} đánh Bỏ Lượt (Skip) — kết thúc 1 lượt mà không cần rút bài!`,
        visibleToSeatNos: "all",
      });
      consumeOneTurnOrAdvanceSeat(state, events, nowMs);
      return;
    }

    case "super_skip": {
      state.turnsRemaining = 1;
      events.push({
        eventType: "IK_SUPER_SKIP",
        message: `${actor.displayName} tung Siêu Bỏ Lượt (Super Skip) — xóa sạch toàn bộ các lượt đang nợ mà không cần rút bài!`,
        visibleToSeatNos: "all",
      });
      consumeOneTurnOrAdvanceSeat(state, events, nowMs);
      return;
    }

    case "reverse": {
      state.direction = state.direction === 1 ? -1 : 1;
      setAnim(
        state,
        {
          kind: "REVERSE",
          actorSeatNo: actor.seatNo,
        },
        nowMs
      );
      events.push({
        eventType: "IK_REVERSE",
        message: `${actor.displayName} đánh Đảo Chiều (Reverse) — vòng chơi đổi sang ${state.direction === 1 ? "Chiều Kim Đồng Hồ ↻" : "Ngược Kim Đồng Hồ ↺"} và kết thúc 1 lượt không cần rút bài!`,
        visibleToSeatNos: "all",
      });
      consumeOneTurnOrAdvanceSeat(state, events, nowMs);
      return;
    }

    case "attack":
    case "targeted_attack":
    case "attack_of_the_dead": {
      const deadCount = state.seats.filter((s) => !s.alive).length;
      const addedTurns =
        effType === "attack_of_the_dead"
          ? deadCount > 0
            ? deadCount * 3
            : 1
          : 2;
      const carriedOver = state.turnsRemaining > 1 ? state.turnsRemaining : 0;
      const nextTurns = carriedOver + addedTurns;
      const nextSeatNo =
        effType === "targeted_attack" && pending.targetSeatNo
          ? pending.targetSeatNo
          : getNextAliveSeatNo(state, actor.seatNo);
      const target = getSeat(state, nextSeatNo);

      state.activeSeatNo = target.seatNo;
      state.turnsRemaining = nextTurns;
      state.turnNumber += 1;
      state.step = "TurnPlayStep";
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;

      events.push({
        eventType: "IK_ATTACK_RESOLVED",
        message: `${actor.displayName} tung ${IK_CARD_META[effType].nameVi} vào ${target.displayName} — ép ${target.displayName} phải đi liên tiếp ${nextTurns} lượt!`,
        visibleToSeatNos: "all",
      });
      return;
    }

    case "personal_attack": {
      const extra = (state.turnsRemaining > 1 ? state.turnsRemaining - 1 : 0) + 3;
      state.turnsRemaining = extra;
      state.step = "TurnPlayStep";
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      events.push({
        eventType: "IK_PERSONAL_ATTACK",
        message: `${actor.displayName} đánh Tự Tấn Công 3x — tự nhận đi ${state.turnsRemaining} lượt liên tiếp!`,
        visibleToSeatNos: "all",
      });
      return;
    }

    case "draw_bottom": {
      if (state.drawPile.length === 0) {
        consumeOneTurnOrAdvanceSeat(state, events, nowMs);
        return;
      }
      // Index 0 of drawPile is the BOTTOM card; end of drawPile is the TOP card!
      const bottomCard = state.drawPile.shift()!;
      resolveCardDrawnBySeat(state, actor, bottomCard, true, events, nowMs);
      return;
    }

    case "shuffle": {
      state.drawPile = shuffle(state.drawPile, Math.random);
      state.step = "TurnPlayStep";
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      events.push({
        eventType: "IK_SHUFFLE",
        message: `${actor.displayName} xáo trộn tung toàn bộ Bộ bài rút!`,
        visibleToSeatNos: "all",
      });
      return;
    }

    case "swap_top_bottom": {
      if (state.drawPile.length >= 2) {
        const topIdx = state.drawPile.length - 1;
        const temp = state.drawPile[topIdx];
        state.drawPile[topIdx] = state.drawPile[0];
        state.drawPile[0] = temp;
      }
      state.step = "TurnPlayStep";
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      events.push({
        eventType: "IK_SWAP_TOP_BOTTOM",
        message: `${actor.displayName} hoán đổi vị trí lá trên Đỉnh và lá dưới Đáy của Bộ bài rút!`,
        visibleToSeatNos: "all",
      });
      return;
    }

    case "see_future_3":
    case "see_future_5": {
      const count = effType === "see_future_5" ? 5 : 3;
      const topCards: IkCard[] = [];
      for (
        let i = state.drawPile.length - 1;
        i >= Math.max(0, state.drawPile.length - count);
        i--
      ) {
        topCards.push(state.drawPile[i]);
      }
      actor.privateVision = {
        titleVi: `Thấu Thị ${topCards.length} lá đầu Bộ bài rút (từ Đỉnh xuống):`,
        cards: topCards.map((c, idx) => ({
          labelVi: `#${idx + 1}: ${IK_CARD_META[c.type].shortVi}${c.faceUp ? " (NGỬA)" : ""}`,
          emoji: IK_CARD_META[c.type].emoji,
          colorHex: IK_CARD_META[c.type].colorHex,
          cardId: c.id,
          cardType: c.type,
          positionLabelVi: idx === 0 ? "#1 (ĐỈNH)" : `#${idx + 1}`,
          faceUp: c.faceUp,
        })),
      };
      state.step = "TurnPlayStep";
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      events.push({
        eventType: "IK_SEE_FUTURE",
        message: `${actor.displayName} dùng ${IK_CARD_META[effType].shortVi} soi bí mật ${topCards.length} lá đầu Bộ bài rút.`,
        visibleToSeatNos: "all",
      });
      return;
    }

    case "clairvoyance": {
      const bombLocations: IkVisionCardItem[] = [];
      for (let i = state.drawPile.length - 1; i >= 0; i--) {
        const c = state.drawPile[i];
        const posFromTop = state.drawPile.length - i;
        if (c.type === "exploding_kitten" || c.type === "imploding_kitten") {
          bombLocations.push({
            labelVi: `Lá #${posFromTop} từ đỉnh: ${IK_CARD_META[c.type].shortVi}`,
            emoji: IK_CARD_META[c.type].emoji,
            colorHex: IK_CARD_META[c.type].colorHex,
            cardId: c.id,
            cardType: c.type,
            positionLabelVi:
              posFromTop === 1 ? "#1 (ĐỈNH)" : `Lá #${posFromTop} từ đỉnh`,
            faceUp: c.faceUp,
          });
        }
      }
      actor.privateVision = {
        titleVi: "Thấu Tâm — Tọa độ toàn bộ Bom trong Bộ bài rút:",
        cards:
          bombLocations.length > 0
            ? bombLocations
            : [
                {
                  labelVi: "Không có quả bom nào trong Bộ bài rút!",
                  emoji: "",
                  colorHex: "#4ade80",
                },
              ],
      };
      state.step = "TurnPlayStep";
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      events.push({
        eventType: "IK_CLAIRVOYANCE",
        message: `${actor.displayName} dùng Thấu Tâm (Clairvoyance) quét vị trí mọi quả Bom trong Bộ bài rút!`,
        visibleToSeatNos: "all",
      });
      return;
    }

    case "alter_future_3":
    case "alter_future_5":
    case "share_future_3": {
      const wantCount = effType === "alter_future_5" ? 5 : 3;
      const count = Math.min(wantCount, state.drawPile.length);
      if (count <= 1) {
        state.step = "TurnPlayStep";
        state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
        return;
      }
      // Slice top `count` cards ordered from TOP (#1 = last element) to deeper (#N)
      const topCards: IkCard[] = [];
      for (let i = 0; i < count; i++) {
        topCards.push(state.drawPile[state.drawPile.length - 1 - i]);
      }
      state.step = "AlterFutureStep";
      state.pendingAlterFuture = {
        seatNo: actor.seatNo,
        count,
        shareWithNextSeatNo:
          effType === "share_future_3"
            ? getNextAliveSeatNo(state, actor.seatNo)
            : null,
        cards: topCards,
      };
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      events.push({
        eventType: "IK_ALTER_FUTURE_START",
        message: `${actor.displayName} đang xem và sắp xếp lại ${count} lá đầu của Bộ bài rút...`,
        visibleToSeatNos: "all",
      });
      return;
    }

    case "favor": {
      const target = getSeat(state, pending.targetSeatNo!);
      if (
        target.alive &&
        state.towerHolderSeatNo === target.seatNo &&
        state.towerStashCards.length > 0
      ) {
        const stolen = state.towerStashCards.pop()!;
        stolen.marked = false;
        actor.hand.push(stolen);
        if (state.towerStashCards.length === 0) {
          state.towerHolderSeatNo = null;
        }
        setAnim(
          state,
          {
            kind: "COMBO_STEAL",
            actorSeatNo: actor.seatNo,
            targetSeatNo: target.seatNo,
            card: stolen,
            fromTower: true,
          },
          nowMs
        );
        state.step = "TurnPlayStep";
        state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
        events.push({
          eventType: "IK_TOWER_INTERCEPT",
          message: `Tháp Quyền Lực chắn đòn Xin Xỏ (Favor)! ${actor.displayName} buộc phải rút mù 1 lá từ đỉnh Tháp của ${target.displayName} (còn ${state.towerStashCards.length} lá)!`,
          visibleToSeatNos: "all",
        });
        return;
      }
      if (!target.alive || target.hand.length === 0) {
        state.step = "TurnPlayStep";
        state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
        return;
      }
      state.step = "FavorGiveStep";
      state.pendingFavor = {
        fromSeatNo: target.seatNo,
        toSeatNo: actor.seatNo,
      };
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      events.push({
        eventType: "IK_FAVOR_ASKED",
        message: `${actor.displayName} dùng Xin Xỏ (Favor) yêu cầu ${target.displayName} tự chọn 1 lá bài trên tay cống nạp!`,
        visibleToSeatNos: "all",
      });
      return;
    }

    case "tower_of_power": {
      // Nếu kho dự trữ chưa có lá (ví dụ khi Clone lại sau khi Tháp đã cạn), rút tạm tối đa 6 lá thường từ Bộ bài rút
      if (state.towerStashCards.length === 0) {
        for (let i = state.drawPile.length - 1; i >= 0 && state.towerStashCards.length < 6; i--) {
          const c = state.drawPile[i];
          if (c.type !== "exploding_kitten" && c.type !== "imploding_kitten") {
            state.drawPile.splice(i, 1);
            state.towerStashCards.push(c);
          }
        }
      }
      state.towerHolderSeatNo =
        state.towerStashCards.length > 0 ? actor.seatNo : null;
      state.step = "TurnPlayStep";
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      events.push({
        eventType: "IK_TOWER_OF_POWER",
        message: `${actor.displayName} đội Tháp Quyền Lực (Tower of Power) chứa ${state.towerStashCards.length} lá dự trữ lên đầu! Ai cướp bài đều phải rút mù từ đỉnh Tháp!`,
        visibleToSeatNos: "all",
      });
      return;
    }

    case "catomic_bomb": {
      const bombs: IkCard[] = [];
      const rest: IkCard[] = [];
      for (const c of state.drawPile) {
        if (c.type === "exploding_kitten") {
          bombs.push(c);
        } else {
          rest.push(c);
        }
      }
      const shuffledRest = shuffle(rest, Math.random);
      // Put all Exploding Kittens at the TOP of drawPile (end of array)
      state.drawPile = [...shuffledRest, ...bombs];
      setAnim(
        state,
        {
          kind: "CATOMIC_BOMB",
          actorSeatNo: actor.seatNo,
        },
        nowMs
      );
      events.push({
        eventType: "IK_CATOMIC_BOMB",
        message: `BOM NGUYÊN TỬ MÈO! ${actor.displayName} kéo toàn bộ ${bombs.length} lá Mèo Nổ đặt thẳng lên ĐỈNH Bộ bài rút và kết thúc lượt không cần rút!`,
        visibleToSeatNos: "all",
      });
      consumeOneTurnOrAdvanceSeat(state, events, nowMs);
      return;
    }

    case "bury": {
      if (state.drawPile.length === 0) {
        consumeOneTurnOrAdvanceSeat(state, events, nowMs);
        return;
      }
      const topCard = state.drawPile.pop()!;
      state.step = "DefuseInsertStep";
      state.pendingInsert = {
        seatNo: actor.seatNo,
        card: topCard,
        reason: "BURY_CARD",
        endsTurnOnInsert: true,
      };
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      events.push({
        eventType: "IK_BURY_START",
        message: `${actor.displayName} dùng Chôn Giấu (Bury): bí mật xem lá đầu Bộ bài và đang chọn vị trí chôn nó xuống...`,
        visibleToSeatNos: "all",
      });
      return;
    }

    case "dig_deeper": {
      if (state.drawPile.length === 0) {
        consumeOneTurnOrAdvanceSeat(state, events, nowMs);
        return;
      }
      const topCard = state.drawPile[state.drawPile.length - 1];
      const secondCard =
        state.drawPile.length >= 2
          ? state.drawPile[state.drawPile.length - 2]
          : null;
      state.step = "DigDeeperStep";
      state.pendingDigDeeper = {
        seatNo: actor.seatNo,
        topCard,
        secondCard,
      };
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      events.push({
        eventType: "IK_DIG_DEEPER_START",
        message: `${actor.displayName} dùng Đào Sâu Hơn (Dig Deeper): đang xem lá đầu tiên để quyết định lấy lá #1 hay đào lá #2...`,
        visibleToSeatNos: "all",
      });
      return;
    }

    case "garbage_collection":
    case "potluck": {
      const eligible = getAliveSeats(state)
        .filter((s) => s.hand.length > 0)
        .map((s) => s.seatNo);
      if (eligible.length === 0) {
        state.step = "TurnPlayStep";
        state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
        return;
      }
      state.step = "GarbagePickStep";
      state.pendingGroupSubmit = {
        mode:
          effType === "garbage_collection" ? "GARBAGE_COLLECTION" : "POTLUCK",
        pendingSeatNos: eligible,
        collectedCards: [],
      };
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      events.push({
        eventType: "IK_GROUP_SUBMIT_START",
        message:
          effType === "garbage_collection"
            ? `Thu Gom Rác! Mọi người chơi phải chọn 1 lá bài trên tay trả vào Bộ bài rút để xáo lại!`
            : `Góp Bài (Potluck)! Mọi người chơi phải chọn 1 lá bài trên tay đặt úp lên Đỉnh Bộ bài rút!`,
        visibleToSeatNos: "all",
      });
      return;
    }

    case "feed_the_dead": {
      const deadSeat = state.seats.find((s) => !s.alive);
      if (!deadSeat) {
        state.step = "TurnPlayStep";
        state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
        events.push({
          eventType: "IK_FEED_DEAD_NO_TARGET",
          message: `${actor.displayName} đánh Feed the Dead nhưng chưa có người chơi nào chết trên bàn!`,
          visibleToSeatNos: "all",
        });
        return;
      }
      const eligible = getAliveSeats(state)
        .filter((s) => s.seatNo !== actor.seatNo && s.hand.length > 0)
        .map((s) => s.seatNo);
      if (eligible.length === 0) {
        state.step = "TurnPlayStep";
        state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
        return;
      }
      state.step = "GarbagePickStep";
      state.pendingGroupSubmit = {
        mode: "FEED_THE_DEAD",
        recipientSeatNo: deadSeat.seatNo,
        pendingSeatNos: eligible,
        collectedCards: [],
      };
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      events.push({
        eventType: "IK_GROUP_SUBMIT_START",
        message: `Feed the Dead! Tất cả người sống khác (trừ ${actor.displayName}) phải chọn 1 lá bài trên tay cống nạp cho người đã chết ${deadSeat.displayName}!`,
        visibleToSeatNos: "all",
      });
      return;
    }

    case "grave_robber": {
      const deadWithCards = state.seats.filter(
        (s) => !s.alive && s.hand.length > 0
      );
      let takenCount = 0;
      for (const ds of deadWithCards) {
        const randIdx = Math.floor(Math.random() * ds.hand.length);
        const [card] = ds.hand.splice(randIdx, 1);
        card.marked = false;
        state.drawPile.push(card);
        takenCount += 1;
      }
      if (takenCount > 0) {
        state.drawPile = shuffle(state.drawPile, Math.random);
      }
      state.step = "TurnPlayStep";
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      events.push({
        eventType: "IK_GRAVE_ROBBER",
        message:
          takenCount > 0
            ? `Kẻ Trộm Mộ (Grave Robber)! ${actor.displayName} thu ${takenCount} lá từ các người chơi đã chết và xáo trộn vào Bộ bài rút!`
            : `${actor.displayName} đánh Kẻ Trộm Mộ (Grave Robber) nhưng không có người chết nào còn bài trên tay!`,
        visibleToSeatNos: "all",
      });
      return;
    }

    case "curse_cat_butt": {
      const target = getSeat(state, pending.targetSeatNo!);
      target.isBlind = true;
      target.hand = shuffle(target.hand, Math.random);
      state.step = "TurnPlayStep";
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      events.push({
        eventType: "IK_CURSE_CAT_BUTT",
        message: `Lời Nguyền Mông Mèo! Bài trên tay của ${target.displayName} đã bị xáo trộn và ÚP MÙ cho đến khi rút bài thành công!`,
        visibleToSeatNos: "all",
      });
      return;
    }

    case "mark": {
      const target = getSeat(state, pending.targetSeatNo!);
      const unmarked = target.hand.filter((c) => !c.marked);
      const pool = unmarked.length > 0 ? unmarked : target.hand;
      if (pool.length > 0) {
        const picked = pool[Math.floor(Math.random() * pool.length)];
        picked.marked = true;
        const meta = IK_CARD_META[picked.type];
        events.push({
          eventType: "IK_MARK_REVEALED",
          message: `Đánh Dấu! ${actor.displayName} bắn lộ diện 1 lá bài trên tay của ${target.displayName}: đó là [${meta.nameVi}]!`,
          visibleToSeatNos: "all",
        });
      }
      state.step = "TurnPlayStep";
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      return;
    }

    case "ill_take_that": {
      const target = getSeat(state, pending.targetSeatNo!);
      target.illTakeThatFromSeatNo = actor.seatNo;
      state.step = "TurnPlayStep";
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      events.push({
        eventType: "IK_ILL_TAKE_THAT_SET",
        message: `${actor.displayName} gài lá [Đưa Đây Cho Tôi] trước mặt ${target.displayName} — lá bài rút tiếp theo của ${target.displayName} sẽ thuộc về ${actor.displayName}!`,
        visibleToSeatNos: "all",
      });
      return;
    }

    case "barking_kitten": {
      // Look for another living player holding or having played the other barking_kitten
      let victim: IkSeatState | null = null;
      let victimCardIdx = -1;
      for (const s of state.seats) {
        if (!s.alive || s.seatNo === actor.seatNo) continue;
        const idx = s.hand.findIndex((c) => c.type === "barking_kitten");
        if (idx !== -1 || s.barkingPlayedFaceUp) {
          victim = s;
          victimCardIdx = idx;
          break;
        }
      }

      if (!victim) {
        actor.barkingPlayedFaceUp = true;
        events.push({
          eventType: "IK_BARKING_WAITING",
          message: `${actor.displayName} thả Mèo Sủa ra bàn trực chờ — ai giữ lá Mèo Sủa còn lại hãy coi chừng!`,
          visibleToSeatNos: "all",
        });
      } else {
        if (victimCardIdx !== -1) {
          const [otherBark] = victim.hand.splice(victimCardIdx, 1);
          state.discardPile.push(otherBark);
        }
        victim.barkingPlayedFaceUp = false;
        actor.barkingPlayedFaceUp = false;

        const defuseIdx =
          victim.hand.findIndex((c) => c.type === "defuse") !== -1
            ? victim.hand.findIndex((c) => c.type === "defuse")
            : victim.hand.findIndex((c) => c.type === "godcat");
        if (defuseIdx !== -1) {
          const [defCard] = victim.hand.splice(defuseIdx, 1);
          discardCardsRespectingPlaymat(state, [defCard]);
          setAnim(
            state,
            {
              kind: "DEFUSE",
              actorSeatNo: victim.seatNo,
              card: defCard,
            },
            nowMs
          );
          events.push({
            eventType: "IK_BARKING_DEFUSED",
            message: `MÈO SỦA KÍCH NỔ! ${victim.displayName} bị ${actor.displayName} kích nổ Mèo Sủa và buộc phải dùng 1 lá ${defCard.type === "godcat" ? "Mèo Thần (Godcat)" : "Tháo Ngòi (Defuse)"} để thoát chết!`,
            visibleToSeatNos: "all",
          });
        } else {
          victim.alive = false;
          victim.eliminatedBy = "barking";
          discardCardsRespectingPlaymat(state, [...victim.hand]);
          victim.hand = [];
          setAnim(
            state,
            {
              kind: "EXPLODE_DEATH",
              actorSeatNo: victim.seatNo,
            },
            nowMs
          );
          events.push({
            eventType: "IK_BARKING_KILLED",
            message: `MÈO SỦA ĐOẠT MẠNG! ${victim.displayName} bị kích nổ Mèo Sủa khi không có Defuse và bị loại khỏi cuộc chơi!`,
            visibleToSeatNos: "all",
          });
          checkVictory(state, events, nowMs);
        }
      }
      if (state.step !== "Finished") {
        state.step = "TurnPlayStep";
        state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      }
      return;
    }

    case "armageddon": {
      const target = getSeat(state, pending.targetSeatNo!);
      if (!state.godcatOnPlaymat || !target.alive) {
        state.step = "TurnPlayStep";
        state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
        return;
      }
      state.step = "ArmageddonStep";
      state.pendingArmageddon = {
        actorSeatNo: actor.seatNo,
        targetSeatNo: target.seatNo,
        stage: "ACTOR_PLACE",
        godcatGivenToTarget: null,
      };
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      events.push({
        eventType: "IK_ARMAGEDDON_START",
        message: `TẬN THẾ (ARMAGEDDON)! ${actor.displayName} cầm Mèo Thần & Mèo Quỷ lên và thách đấu tâm lý với ${target.displayName}!`,
        visibleToSeatNos: "all",
      });
      return;
    }

    case "raising_heck": {
      if (state.drawPile.length === 0) {
        consumeOneTurnOrAdvanceSeat(state, events, nowMs);
        return;
      }
      const bottomCard = state.drawPile[0];
      state.step = "RaisingHeckStep";
      state.pendingRaisingHeck = {
        seatNo: actor.seatNo,
        bottomCard,
      };
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      events.push({
        eventType: "IK_RAISING_HECK_START",
        message: `${actor.displayName} đánh Quậy Tưng Bừng (Raising Heck) — đang bí mật xem lá dưới ĐÁY Bộ bài để chọn lấy về tay hay đặt lên ĐỈNH!`,
        visibleToSeatNos: "all",
      });
      return;
    }

    case "reveal_future_3": {
      const topCards: IkCard[] = [];
      for (
        let i = state.drawPile.length - 1;
        i >= Math.max(0, state.drawPile.length - 3);
        i--
      ) {
        topCards.push(state.drawPile[i]);
      }
      const visionPayload = {
        titleVi: `Tiết Lộ Tương Lai 3x (${actor.displayName} lật công khai cho CẢ BÀN):`,
        cards: topCards.map((c, idx) => ({
          labelVi: `#${idx + 1}: ${IK_CARD_META[c.type].shortVi}${c.faceUp ? " (NGỬA)" : ""}`,
          emoji: IK_CARD_META[c.type].emoji,
          colorHex: IK_CARD_META[c.type].colorHex,
          cardId: c.id,
          cardType: c.type,
          positionLabelVi: idx === 0 ? "#1 (ĐỈNH)" : `#${idx + 1}`,
          faceUp: c.faceUp,
        })),
      };
      for (const s of state.seats) {
        if (s.alive) {
          s.privateVision = {
            titleVi: visionPayload.titleVi,
            cards: [...visionPayload.cards],
          };
        }
      }
      state.step = "TurnPlayStep";
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      events.push({
        eventType: "IK_REVEAL_FUTURE",
        message: `${actor.displayName} đánh Tiết Lộ Tương Lai 3x — lật mở công khai ${topCards.length} lá đầu Bộ bài rút cho TẤT CẢ mọi người cùng thấy!`,
        visibleToSeatNos: "all",
      });
      return;
    }

    default: {
      state.step = "TurnPlayStep";
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
    }
  }
}

/**
 * Either opens `NopeWindowStep` if at least one OTHER living player holds a `nope` card in hand,
 * OR resolves `pending` immediately in 0ms when no opponent has a `nope` card!
 */
function maybeOpenNopeWindowOrExecute(
  state: IkMatchState,
  pending: IkPendingAction,
  events: MatchEventRecord[],
  nowMs: number
): void {
  // Barking Kitten cannot be Noped per official rules
  if (pending.effectiveType === "barking_kitten") {
    executeResolvedAction(state, pending, events, nowMs);
    return;
  }

  const opponentsWithNope = state.seats.filter(
    (s) =>
      s.alive &&
      s.seatNo !== pending.actorSeatNo &&
      s.hand.some((c) => c.type === "nope")
  );

  if (opponentsWithNope.length === 0) {
    executeResolvedAction(state, pending, events, nowMs);
    return;
  }

  state.step = "NopeWindowStep";
  state.pendingAction = pending;
  state.phaseDeadlineMs = nowMs + state.config.timers.nopeSeconds * 1000;
}

/**
 * Validates whether 2 or 3 cards form a legal matching pair/triplet (accounting for `feral_cat` wildcard!).
 */
export function validateMatchingComboCards(cards: IkCard[]): boolean {
  if (cards.length < 2 || cards.length > 3) return false;
  const nonFeral = cards.filter((c) => c.type !== "feral_cat");
  if (nonFeral.length === 0) return true; // All feral cats!
  const firstType = nonFeral[0].type;
  // If mixed with feral_cat, nonFeral cards must be Cat cards of the same type
  if (nonFeral.length < cards.length) {
    const meta = IK_CARD_META[firstType];
    if (meta.category !== "cat" && meta.category !== "wildcard_cat") {
      return false;
    }
  }
  return nonFeral.every((c) => c.type === firstType);
}

/**
 * Validates whether 5 cards have 5 distinct card types for the 5-Card Combo.
 */
export function validateFiveCardCombo(cards: IkCard[]): boolean {
  if (cards.length !== 5) return false;
  const types = new Set(cards.map((c) => c.type));
  return types.size === 5;
}

/**
 * Smart AI Bot decision engine for every step of Imploding Kittens!
 */
function chooseBotCommand(
  state: IkMatchState,
  botSeatNo: number
): IkCommand | null {
  const bot = getSeat(state, botSeatNo);

  if (state.step === "NopeWindowStep" && state.pendingAction) {
    const pa = state.pendingAction;
    const isCanceled = pa.nopeCount % 2 === 1;
    const botHasNope = bot.hand.find((c) => c.type === "nope");
    if (!botHasNope || pa.passedSeatNos.includes(botSeatNo)) {
      return null;
    }
    // Bot plays Nope if it is the target of an Attack/Favor/Steal/Curse and action is not yet canceled
    const isTargetingBot = pa.targetSeatNo === botSeatNo;
    const isAttackOnBot =
      (pa.effectiveType === "attack" ||
        pa.effectiveType === "attack_of_the_dead") &&
      getNextAliveSeatNo(state, pa.actorSeatNo) === botSeatNo;

    if (!isCanceled && (isTargetingBot || isAttackOnBot)) {
      return { type: "PLAY_NOPE", cardId: botHasNope.id };
    }
    return { type: "PASS_NOPE" };
  }

  if (
    state.step === "DefuseInsertStep" &&
    state.pendingInsert?.seatNo === botSeatNo
  ) {
    // Insert bomb near the top (0 or 1) to trap the next player!
    const idx = Math.min(state.drawPile.length, Math.random() < 0.65 ? 0 : 1);
    return { type: "INSERT_CARD", insertIndex: idx };
  }

  if (
    state.step === "Combo2PickStep" &&
    state.pendingCombo2Pick?.actorSeatNo === botSeatNo
  ) {
    const target = getSeat(state, state.pendingCombo2Pick.targetSeatNo);
    const handById = new Map(target.hand.map((c) => [c.id, c]));
    const orderedCards = (
      state.pendingCombo2Pick.shuffledCardIds ?? target.hand.map((c) => c.id)
    )
      .map((id) => handById.get(id))
      .filter((c): c is IkCard => Boolean(c));

    if (orderedCards.length > 0) {
      // Ưu tiên chọn lá đang bị Đánh Dấu (Marked) có giá trị cao, không thì chọn ngẫu nhiên 1 vị trí
      const markedDefuseIdx = orderedCards.findIndex(
        (c) =>
          c.marked &&
          (c.type === "defuse" || c.type === "zombie_kitten" || c.type === "nope")
      );
      const anyMarkedIdx = orderedCards.findIndex((c) => c.marked);
      const pickIdx =
        markedDefuseIdx !== -1
          ? markedDefuseIdx
          : anyMarkedIdx !== -1
            ? anyMarkedIdx
            : Math.floor(Math.random() * orderedCards.length);
      return { type: "PICK_COMBO_2_CARD", cardIndex: pickIdx };
    }
  }

  if (
    state.step === "AlterFutureStep" &&
    state.pendingAlterFuture?.seatNo === botSeatNo
  ) {
    // Put non-bombs on top (#1) and bombs deeper so bot can safely draw the top card!
    const sorted = [...state.pendingAlterFuture.cards].sort((a, b) => {
      const aBomb =
        a.type === "exploding_kitten" || a.type === "imploding_kitten" ? 1 : 0;
      const bBomb =
        b.type === "exploding_kitten" || b.type === "imploding_kitten" ? 1 : 0;
      return aBomb - bBomb;
    });
    return {
      type: "COMMIT_ALTER_FUTURE",
      orderedCardIds: sorted.map((c) => c.id),
    };
  }

  if (
    state.step === "FavorGiveStep" &&
    state.pendingFavor?.fromSeatNo === botSeatNo
  ) {
    // Give away least valuable card (Cat card first, never Defuse/Streaking unless forced)
    const sorted = [...bot.hand].sort((a, b) => {
      const score = (c: IkCard) =>
        c.type === "defuse"
          ? 100
          : c.type === "streaking_kitten"
            ? 90
            : c.type === "exploding_kitten"
              ? 95
              : IK_CARD_META[c.type].category === "cat"
                ? 1
                : 10;
      return score(a) - score(b);
    });
    return { type: "GIVE_FAVOR_CARD", cardId: sorted[0].id };
  }

  if (
    state.step === "DigDeeperStep" &&
    state.pendingDigDeeper?.seatNo === botSeatNo
  ) {
    const top = state.pendingDigDeeper.topCard;
    const isTopBomb =
      top.type === "exploding_kitten" || top.type === "imploding_kitten";
    return {
      type: "DIG_DEEPER_DECIDE",
      keepFirst: !isTopBomb || !state.pendingDigDeeper.secondCard,
    };
  }

  if (
    state.step === "GarbagePickStep" &&
    state.pendingGroupSubmit?.pendingSeatNos.includes(botSeatNo)
  ) {
    const sorted = [...bot.hand].sort((a, b) => {
      const score = (c: IkCard) =>
        c.type === "godcat"
          ? 120
          : c.type === "defuse"
            ? 100
            : c.type === "streaking_kitten"
              ? 90
              : 5;
      return score(a) - score(b);
    });
    return { type: "SUBMIT_GROUP_CARD", cardId: sorted[0].id };
  }

  if (state.step === "ArmageddonStep" && state.pendingArmageddon) {
    const pa = state.pendingArmageddon;
    if (pa.stage === "ACTOR_PLACE" && pa.actorSeatNo === botSeatNo) {
      return {
        type: "ARMAGEDDON_PLACE",
        giveGodcatToTarget: Math.random() < 0.5,
      };
    }
    if (pa.stage === "TARGET_CHOOSE" && pa.targetSeatNo === botSeatNo) {
      return {
        type: "ARMAGEDDON_DECIDE",
        swap: Math.random() < 0.5,
      };
    }
  }

  if (
    state.step === "RaisingHeckStep" &&
    state.pendingRaisingHeck?.seatNo === botSeatNo
  ) {
    const bottom = state.pendingRaisingHeck.bottomCard;
    const isBottomBomb =
      bottom.type === "exploding_kitten" || bottom.type === "imploding_kitten";
    return {
      type: "RAISING_HECK_DECIDE",
      takeToHand: !isBottomBomb,
    };
  }

  if (state.step === "TurnPlayStep" && state.activeSeatNo === botSeatNo) {
    const topCard =
      state.drawPile.length > 0
        ? state.drawPile[state.drawPile.length - 1]
        : null;
    const topIsVisibleImploding =
      topCard?.type === "imploding_kitten" && Boolean(topCard.faceUp);

    const opponents = state.seats.filter(
      (s) => s.alive && s.seatNo !== botSeatNo && s.hand.length > 0
    );
    const richestOpp =
      [...opponents].sort((a, b) => b.hand.length - a.hand.length)[0] ??
      state.seats.find((s) => s.alive && s.seatNo !== botSeatNo);

    // If top card is a visible FACE-UP Imploding Kitten (or deck is very thin), try to avoid drawing from top!
    if (topIsVisibleImploding || state.turnsRemaining > 1) {
      const avoidTypes: IkCardType[] = [
        "super_skip",
        "targeted_attack",
        "attack",
        "attack_of_the_dead",
        "skip",
        "reverse",
        "draw_bottom",
        "raising_heck",
        "swap_top_bottom",
        "shuffle",
        "bury",
        "catomic_bomb",
      ];
      for (const t of avoidTypes) {
        const card = bot.hand.find((c) => c.type === t);
        if (card) {
          return {
            type: "PLAY_CARD",
            cardId: card.id,
            targetSeatNo: IK_CARD_META[t].needsTargetSeat
              ? richestOpp?.seatNo
              : undefined,
          };
        }
      }
      // Bot can use Godcat as Super Skip to escape danger!
      const godcatCard = bot.hand.find((c) => c.type === "godcat");
      if (godcatCard) {
        return {
          type: "PLAY_CARD",
          cardId: godcatCard.id,
          mimicCardType: "super_skip",
        };
      }
    }

    // Try playing a 2-card Cat Combo if holding a pair and an opponent has cards
    if (richestOpp && richestOpp.hand.length > 0) {
      for (const catType of IK_ALL_CAT_TYPES) {
        const matches = bot.hand.filter(
          (c) => c.type === catType || c.type === "feral_cat"
        );
        if (matches.length >= 2) {
          return {
            type: "PLAY_COMBO_2",
            cardIds: [matches[0].id, matches[1].id],
            targetSeatNo: richestOpp.seatNo,
          };
        }
      }
    }

    // Claim Tower of Power stash when low on cards or down to last stash card
    if (
      state.towerHolderSeatNo === botSeatNo &&
      state.towerStashCards.length > 0 &&
      (bot.hand.length <= 2 || state.towerStashCards.length === 1)
    ) {
      return { type: "CLAIM_TOWER_STASH" };
    }

    // Play Armageddon if Playmat has Godcat and Bot has a Defuse or feels bold
    const armageddonCard = bot.hand.find((c) => c.type === "armageddon");
    if (
      armageddonCard &&
      state.godcatOnPlaymat &&
      richestOpp &&
      (bot.hand.some((c) => c.type === "defuse") || Math.random() < 0.35)
    ) {
      return {
        type: "PLAY_CARD",
        cardId: armageddonCard.id,
        targetSeatNo: richestOpp.seatNo,
      };
    }

    // Occasionally use Godcat offensively as Targeted Attack
    const godcatCard = bot.hand.find((c) => c.type === "godcat");
    if (godcatCard && richestOpp && Math.random() < 0.45) {
      return {
        type: "PLAY_CARD",
        cardId: godcatCard.id,
        mimicCardType: "targeted_attack",
        targetSeatNo: richestOpp.seatNo,
      };
    }

    // Occasionally play utility/attack cards from hand
    const utilityCard = bot.hand.find((c) =>
      [
        "tower_of_power",
        "favor",
        "mark",
        "curse_cat_butt",
        "ill_take_that",
        "barking_kitten",
        "see_future_3",
        "see_future_5",
        "reveal_future_3",
        "clairvoyance",
      ].includes(c.type)
    );
    if (utilityCard && richestOpp) {
      return {
        type: "PLAY_CARD",
        cardId: utilityCard.id,
        targetSeatNo: IK_CARD_META[utilityCard.type].needsTargetSeat
          ? richestOpp.seatNo
          : undefined,
      };
    }

    return { type: "DRAW_CARD" };
  }

  return null;
}

export const implodingKittensCartridge: GameCartridge<
  IkConfig,
  IkMatchState,
  IkCommand,
  IkPlayerView
> = {
  cartridgeId: "imploding-kittens",
  title: "Imploding Kittens",
  subtitle:
    "Mèo Nổ & Mèo Hố Đen (Full 5 Bản Mở Rộng) • Phủ quyết, Thấu thị, Thiện & Ác • 2–6 người chơi",
  description:
    "Phiên bản đại chiến Mèo Nổ tích hợp trọn bộ 5 bản mở rộng tùy chọn (Imploding, Streaking, Barking, Zombie & Good vs. Evil) với Mèo Hố Đen và đấu trí Mèo Thần / Mèo Quỷ!",
  minSeats: 2,
  maxSeats: 6,
  available: true,

  defaultConfig(): IkConfig {
    return {
      expansions: {
        imploding: true,
        streaking: true,
        barking: true,
        zombie: true,
        good_vs_evil: true,
      },
      explodingKittenCount: null,
      timers: {
        turnSeconds: 45,
        nopeSeconds: 7,
      },
    };
  },

  validateConfig(config: IkConfig, seatCount: number) {
    if (seatCount < 2 || seatCount > 6) {
      return {
        valid: false,
        error:
          "Imploding Kittens cần từ 2 đến 6 người chơi (có thể thêm Bot).",
      };
    }
    const customCount = config?.explodingKittenCount;
    if (customCount !== null && customCount !== undefined) {
      if (
        typeof customCount !== "number" ||
        !Number.isInteger(customCount) ||
        customCount < IK_MIN_EXPLODING_KITTENS ||
        customCount > IK_MAX_EXPLODING_KITTENS
      ) {
        return {
          valid: false,
          error: `Số lá Mèo Nổ tùy chỉnh phải từ ${IK_MIN_EXPLODING_KITTENS} đến ${IK_MAX_EXPLODING_KITTENS} lá.`,
        };
      }
    }
    return { valid: true };
  },

  createInitialState({ config, seats, nowMs, rng = Math.random }) {
    const rawCustomBombs = config?.explodingKittenCount;
    const normalizedCustomBombs =
      typeof rawCustomBombs === "number" && Number.isInteger(rawCustomBombs)
        ? Math.max(
            IK_MIN_EXPLODING_KITTENS,
            Math.min(IK_MAX_EXPLODING_KITTENS, rawCustomBombs)
          )
        : null;

    const normalizedConfig: IkConfig = {
      expansions: {
        imploding: config?.expansions?.imploding ?? true,
        streaking: config?.expansions?.streaking ?? true,
        barking: config?.expansions?.barking ?? true,
        zombie: config?.expansions?.zombie ?? true,
        good_vs_evil: config?.expansions?.good_vs_evil ?? true,
      },
      explodingKittenCount: normalizedCustomBombs,
      timers: {
        turnSeconds: config?.timers?.turnSeconds ?? 45,
        nopeSeconds: config?.timers?.nopeSeconds ?? 7,
      },
    };

    // 1. Build pre-bomb deck and shuffle
    let preBombDeck = shuffle(
      buildImplodingDeck(normalizedConfig.expansions, seats.length),
      rng
    );

    // 2. Deal 7 cards + 1 guaranteed Defuse (= 8 starting cards) to each seat
    let defuseSeq = 1;
    const seatStates: IkSeatState[] = seats.map((s) => {
      const dealt = preBombDeck.splice(preBombDeck.length - 7, 7);
      const startDefuse: IkCard = {
        id: `ik-start-defuse-${defuseSeq++}`,
        type: "defuse",
      };
      return {
        seatNo: s.seatNo,
        actorId: s.actorId,
        displayName: s.displayName,
        avatarSeed: s.avatarSeed ?? `ik-${s.seatNo}`,
        alive: true,
        eliminatedBy: null,
        hand: [startDefuse, ...dealt],
        isBlind: false,
        barkingPlayedFaceUp: false,
        illTakeThatFromSeatNo: null,
        privateVision: null,
      };
    });

    // 2.5. Barking Kittens: Set aside 6 random non-bomb Stash cards for the Tower of Power
    const towerStashCards: IkCard[] = [];
    if (normalizedConfig.expansions.barking) {
      for (let i = preBombDeck.length - 1; i >= 0 && towerStashCards.length < 6; i--) {
        if (preBombDeck[i].type !== "tower_of_power") {
          towerStashCards.push(preBombDeck.splice(i, 1)[0]);
        }
      }
    }

    // 3. Insert Bombs into Draw Pile:
    // Standard rule: (N - 1) total bombs. If Imploding pack is ON, 1 of those is the Imploding Kitten and (N - 2) are Exploding Kittens.
    // If Streaking pack is ON (which includes Streaking Kitten allowing 1 bomb in hand), add +1 extra Exploding Kitten!
    // If the Host set a custom `explodingKittenCount` (`1..15`), insert that exact number of Exploding Kittens!
    const useImplodingBomb = normalizedConfig.expansions.imploding;
    const implodingCount = useImplodingBomb ? 1 : 0;
    const explodingCount =
      normalizedConfig.explodingKittenCount !== null &&
      normalizedConfig.explodingKittenCount !== undefined
        ? normalizedConfig.explodingKittenCount
        : getDefaultExplodingKittenCount(
            normalizedConfig.expansions,
            seats.length
          );

    for (let i = 1; i <= explodingCount; i++) {
      preBombDeck.push({
        id: `ik-bomb-exploding-${i}`,
        type: "exploding_kitten",
      });
    }
    if (implodingCount > 0) {
      preBombDeck.push({
        id: `ik-bomb-imploding-1`,
        type: "imploding_kitten",
        faceUp: false,
      });
    }

    const drawPile = shuffle(preBombDeck, rng);
    const startingSeat =
      seats[Math.floor(rng() * seats.length)] ?? seats[0];

    const state: IkMatchState = {
      config: normalizedConfig,
      turnNumber: 1,
      step: "TurnPlayStep",
      activeSeatNo: startingSeat.seatNo,
      direction: 1,
      turnsRemaining: 1,
      seats: seatStates,
      drawPile,
      discardPile: [],
      towerHolderSeatNo: null,
      towerStashCards,
      godcatOnPlaymat: normalizedConfig.expansions.good_vs_evil,
      pendingAction: null,
      pendingInsert: null,
      pendingAlterFuture: null,
      pendingFavor: null,
      pendingCombo2Pick: null,
      pendingDigDeeper: null,
      pendingGroupSubmit: null,
      pendingArmageddon: null,
      pendingRaisingHeck: null,
      animSeq: 1,
      lastAnim: null,
      winnerSeatNos: [],
      winReasonVi: null,
      phaseDeadlineMs: nowMs + normalizedConfig.timers.turnSeconds * 1000,
    };

    const enabledNames = IK_EXPANSION_IDS.filter(
      (id) => normalizedConfig.expansions[id]
    )
      .map((id) => IK_EXPANSION_META[id].shortVi)
      .join(", ");

    const events: MatchEventRecord[] = [
      {
        eventType: "IK_MATCH_STARTED",
        message: `Đại chiến Imploding Kittens bắt đầu (${seats.length} người chơi • ${startingSeat.displayName} đi trước • Mở rộng: ${enabledNames || "Cơ bản"} • ${explodingCount} Mèo Nổ + ${implodingCount} Mèo Hố Đen trong Bộ bài rút)!`,
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
      throw new Error("Ván đấu đã kết thúc.");
    }

    const state = cloneState(prevState);
    const events: MatchEventRecord[] = [];
    const actor = getSeat(state, actorSeatNo);

    if (!actor.alive) {
      throw new Error("Bạn đã bị nổ khỏi ván đấu.");
    }

    // Clear privateVision once the player takes their next action
    if (actor.privateVision && command.type !== "PASS_NOPE") {
      actor.privateVision = null;
    }

    // --- STEP: NOPE WINDOW ---
    if (state.step === "NopeWindowStep" && state.pendingAction) {
      const pa = state.pendingAction;

      if (command.type === "PLAY_NOPE") {
        const nopeIdx = command.cardId
          ? actor.hand.findIndex(
              (c) => c.id === command.cardId && c.type === "nope"
            )
          : actor.hand.findIndex((c) => c.type === "nope");
        if (nopeIdx === -1) {
          throw new Error("Bạn không có lá Nope trên tay.");
        }

        const [nopeCard] = actor.hand.splice(nopeIdx, 1);
        nopeCard.marked = false;
        state.discardPile.push(nopeCard);

        pa.nopeCount += 1;
        pa.lastNopeBySeatNo = actor.seatNo;
        pa.passedSeatNos = [];

        const isYup = pa.nopeCount % 2 === 0;
        setAnim(
          state,
          {
            kind: isYup ? "YUP" : "NOPE",
            actorSeatNo: actor.seatNo,
            card: nopeCard,
          },
          nowMs
        );

        events.push({
          eventType: isYup ? "IK_YUP_PLAYED" : "IK_NOPE_PLAYED",
          message: isYup
            ? `YUP! ${actor.displayName} đánh chồng Nope thứ ${pa.nopeCount} — khôi phục lại hiệu lực hành động!`
            : `NOPE! ${actor.displayName} tung lá Phủ Quyết chặn đứng hành động vừa đánh!`,
          visibleToSeatNos: "all",
        });

        // Check if anyone still holds another Nope card to counter-Nope; if not, resolve immediately!
        const anyoneElseHasNope = state.seats.some(
          (s) =>
            s.alive &&
            s.seatNo !== actor.seatNo &&
            s.hand.some((c) => c.type === "nope")
        );
        if (!anyoneElseHasNope) {
          executeResolvedAction(state, pa, events, nowMs);
        } else {
          state.phaseDeadlineMs =
            nowMs + state.config.timers.nopeSeconds * 1000;
        }

        return { state, events, phaseDeadlineMs: state.phaseDeadlineMs };
      }

      if (command.type === "PASS_NOPE") {
        if (!pa.passedSeatNos.includes(actor.seatNo)) {
          pa.passedSeatNos.push(actor.seatNo);
        }
        // Check if every living player holding a Nope card (other than the one who wants the current state to stand) has passed
        const waitingOnAnyone = state.seats.some(
          (s) =>
            s.alive &&
            s.seatNo !==
              (pa.nopeCount % 2 === 0 ? pa.actorSeatNo : pa.lastNopeBySeatNo) &&
            s.hand.some((c) => c.type === "nope") &&
            !pa.passedSeatNos.includes(s.seatNo)
        );

        if (!waitingOnAnyone) {
          executeResolvedAction(state, pa, events, nowMs);
        }

        return { state, events, phaseDeadlineMs: state.phaseDeadlineMs };
      }

      throw new Error("Đang trong cửa sổ Phủ Quyết (Nope!).");
    }

    // --- STEP: DEFUSE / IMPLODING FACE-UP / BURY INSERT ---
    if (state.step === "DefuseInsertStep" && state.pendingInsert) {
      if (
        command.type !== "INSERT_CARD" ||
        state.pendingInsert.seatNo !== actor.seatNo
      ) {
        throw new Error(
          "Đang chờ người chơi chọn vị trí cài lá bài vào Bộ bài rút."
        );
      }

      const clampedFromTop = Math.max(
        0,
        Math.min(state.drawPile.length, Math.floor(command.insertIndex))
      );
      // In `state.drawPile`, the end of the array (`length`) is the TOP (0 from top) and `0` is the BOTTOM (`length` from top)
      const arrayIdx = state.drawPile.length - clampedFromTop;
      const inserted = state.pendingInsert.card;
      const reason = state.pendingInsert.reason;
      const endsTurn = state.pendingInsert.endsTurnOnInsert;

      state.drawPile.splice(arrayIdx, 0, inserted);
      state.pendingInsert = null;

      const posLabel =
        clampedFromTop === 0
          ? "ngay trên ĐỈNH (#1)"
          : clampedFromTop === state.drawPile.length - 1
            ? "dưới ĐÁY CÙNG"
            : `ở vị trí #${clampedFromTop + 1} từ đỉnh`;

      events.push({
        eventType: "IK_CARD_INSERTED",
        message:
          reason === "INSERT_IMPLODING_FACEUP"
            ? `${actor.displayName} đã cài Mèo Hố Đen (LẬT NGỬA) trở lại vào Bộ bài rút!`
            : reason === "BURY_CARD"
              ? `${actor.displayName} đã chôn giấu lá bài trở lại vào Bộ bài rút!`
              : `${actor.displayName} đã bí mật gài lại Mèo Nổ vào Bộ bài rút!`,
        visibleToSeatNos: "all",
      });

      events.push({
        eventType: "IK_CARD_INSERTED_SECRET",
        message: `Bạn đã cài [$${IK_CARD_META[inserted.type].shortVi}] ${posLabel} của Bộ bài rút.`,
        visibleToSeatNos: [actor.seatNo],
      });

      if (endsTurn) {
        consumeOneTurnOrAdvanceSeat(state, events, nowMs);
      } else {
        state.step = "TurnPlayStep";
        state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      }

      return { state, events, phaseDeadlineMs: state.phaseDeadlineMs };
    }

    // --- STEP: ALTER / SHARE THE FUTURE ---
    if (state.step === "AlterFutureStep" && state.pendingAlterFuture) {
      if (
        command.type !== "COMMIT_ALTER_FUTURE" ||
        state.pendingAlterFuture.seatNo !== actor.seatNo
      ) {
        throw new Error("Đang chờ sắp xếp thứ tự các lá tương lai.");
      }

      const pf = state.pendingAlterFuture;
      if (
        command.orderedCardIds.length !== pf.cards.length ||
        new Set(command.orderedCardIds).size !== pf.cards.length
      ) {
        throw new Error("Thứ tự các lá bài sắp xếp không hợp lệ.");
      }

      const byId = new Map(pf.cards.map((c) => [c.id, c]));
      const orderedFromTop: IkCard[] = [];
      for (const cid of command.orderedCardIds) {
        const found = byId.get(cid);
        if (!found) throw new Error("Lá bài không khớp với danh sách tương lai.");
        orderedFromTop.push(found);
      }

      // Replace top `pf.count` cards of `state.drawPile` (where last element is TOP #1)
      for (let i = 0; i < pf.count; i++) {
        state.drawPile[state.drawPile.length - 1 - i] = orderedFromTop[i];
      }

      if (pf.shareWithNextSeatNo !== null) {
        const nextSeat = getSeat(state, pf.shareWithNextSeatNo);
        nextSeat.privateVision = {
          titleVi: `${actor.displayName} chia sẻ 3 lá đầu Bộ bài rút vừa sắp xếp (từ Đỉnh xuống):`,
          cards: orderedFromTop.map((c, idx) => ({
            labelVi: `#${idx + 1}: ${IK_CARD_META[c.type].shortVi}`,
            emoji: IK_CARD_META[c.type].emoji,
            colorHex: IK_CARD_META[c.type].colorHex,
            cardId: c.id,
            cardType: c.type,
            positionLabelVi: idx === 0 ? "#1 (ĐỈNH)" : `#${idx + 1}`,
            faceUp: c.faceUp,
          })),
        };
      }

      state.pendingAlterFuture = null;
      state.step = "TurnPlayStep";
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;

      events.push({
        eventType: "IK_ALTER_FUTURE_DONE",
        message:
          pf.shareWithNextSeatNo !== null
            ? `${actor.displayName} đã sắp xếp lại ${pf.count} lá đầu Bộ bài rút và chia sẻ cho người kế tiếp!`
            : `${actor.displayName} đã thay đổi thứ tự ${pf.count} lá đầu của Bộ bài rút!`,
        visibleToSeatNos: "all",
      });

      return { state, events, phaseDeadlineMs: state.phaseDeadlineMs };
    }

    // --- STEP: FAVOR GIVE CARD ---
    if (state.step === "FavorGiveStep" && state.pendingFavor) {
      if (
        command.type !== "GIVE_FAVOR_CARD" ||
        state.pendingFavor.fromSeatNo !== actor.seatNo
      ) {
        throw new Error("Đang chờ mục tiêu chọn 1 lá bài để cống nạp (Favor).");
      }

      const idx = actor.hand.findIndex((c) => c.id === command.cardId);
      if (idx === -1) {
        throw new Error("Lá bài chọn không có trên tay bạn.");
      }

      const [given] = actor.hand.splice(idx, 1);
      given.marked = false;
      const recipient = getSeat(state, state.pendingFavor.toSeatNo);
      recipient.hand.push(given);

      state.pendingFavor = null;
      state.step = "TurnPlayStep";
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;

      setAnim(
        state,
        {
          kind: "COMBO_STEAL",
          actorSeatNo: recipient.seatNo,
          targetSeatNo: actor.seatNo,
          card: given,
        },
        nowMs
      );

      events.push({
        eventType: "IK_FAVOR_GIVEN",
        message: `${actor.displayName} đã đưa 1 lá bài trên tay cho ${recipient.displayName}.`,
        visibleToSeatNos: "all",
      });

      checkExposedHandBomb(state, actor, events, nowMs);
      return { state, events, phaseDeadlineMs: state.phaseDeadlineMs };
    }

    // --- STEP: COMBO 2 PICK OPPONENT CARD ---
    if (state.step === "Combo2PickStep" && state.pendingCombo2Pick) {
      if (command.type !== "PICK_COMBO_2_CARD") {
        throw new Error("Đang chờ chọn 1 lá bài từ tay đối thủ.");
      }
      const p = state.pendingCombo2Pick;
      if (p.actorSeatNo !== actor.seatNo) {
        throw new Error("Không phải lượt của bạn chọn rút bài.");
      }
      const target = getSeat(state, p.targetSeatNo);
      if (target.hand.length === 0) {
        state.pendingCombo2Pick = null;
        state.step = "TurnPlayStep";
        state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
        return { state, events, phaseDeadlineMs: state.phaseDeadlineMs };
      }
      const handById = new Map(target.hand.map((c) => [c.id, c]));
      const orderedIds = (p.shuffledCardIds ?? target.hand.map((c) => c.id)).filter(
        (id) => handById.has(id)
      );
      const safeSlotIdx = Math.max(
        0,
        Math.min(orderedIds.length - 1, Math.floor(command.cardIndex))
      );
      const chosenId = orderedIds[safeSlotIdx];
      const realHandIdx = chosenId
        ? target.hand.findIndex((c) => c.id === chosenId)
        : safeSlotIdx;
      const [stolen] = target.hand.splice(
        realHandIdx !== -1 ? realHandIdx : 0,
        1
      );
      stolen.marked = false;
      actor.hand.push(stolen);
      state.pendingCombo2Pick = null;

      setAnim(
        state,
        {
          kind: "COMBO_STEAL",
          actorSeatNo: actor.seatNo,
          targetSeatNo: target.seatNo,
          card: stolen,
        },
        nowMs
      );

      events.push({
        eventType: "IK_COMBO_2_RESOLVED",
        message: `Combo 2 Lá! ${actor.displayName} đã chọn rút lá #${safeSlotIdx + 1} từ tay của ${target.displayName}!`,
        visibleToSeatNos: "all",
      });
      checkExposedHandBomb(state, target, events, nowMs);

      if (state.step === "Combo2PickStep") {
        state.step = "TurnPlayStep";
        state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      }
      return { state, events, phaseDeadlineMs: state.phaseDeadlineMs };
    }

    // --- STEP: DIG DEEPER ---
    if (state.step === "DigDeeperStep" && state.pendingDigDeeper) {
      if (
        command.type !== "DIG_DEEPER_DECIDE" ||
        state.pendingDigDeeper.seatNo !== actor.seatNo
      ) {
        throw new Error("Đang chờ quyết định Đào Sâu Hơn (Dig Deeper).");
      }

      state.pendingDigDeeper = null;
      if (command.keepFirst || state.drawPile.length < 2) {
        const topCard = state.drawPile.pop()!;
        resolveCardDrawnBySeat(state, actor, topCard, false, events, nowMs);
      } else {
        // Draw the 2nd card from top, leaving the 1st card on top!
        const topCard = state.drawPile.pop()!;
        const secondCard = state.drawPile.pop()!;
        state.drawPile.push(topCard);
        events.push({
          eventType: "IK_DIG_DEEPER_SECOND",
          message: `${actor.displayName} bỏ qua lá đầu tiên và đào lấy lá thứ 2 bên dưới (trả lá đầu tiên lên lại Đỉnh Bộ bài)!`,
          visibleToSeatNos: "all",
        });
        resolveCardDrawnBySeat(state, actor, secondCard, false, events, nowMs);
      }

      return { state, events, phaseDeadlineMs: state.phaseDeadlineMs };
    }

    // --- STEP: GARBAGE COLLECTION / POTLUCK ---
    if (state.step === "GarbagePickStep" && state.pendingGroupSubmit) {
      if (command.type !== "SUBMIT_GROUP_CARD") {
        throw new Error("Mọi người chơi đang chọn 1 lá bài từ tay.");
      }
      const pg = state.pendingGroupSubmit;
      if (!pg.pendingSeatNos.includes(actor.seatNo)) {
        throw new Error("Bạn đã nộp bài cho lượt này rồi.");
      }
      const idx = actor.hand.findIndex((c) => c.id === command.cardId);
      if (idx === -1) {
        throw new Error("Lá bài không có trên tay bạn.");
      }

      const [picked] = actor.hand.splice(idx, 1);
      picked.marked = false;
      pg.collectedCards.push({ seatNo: actor.seatNo, card: picked });
      pg.pendingSeatNos = pg.pendingSeatNos.filter((s) => s !== actor.seatNo);

      checkExposedHandBomb(state, actor, events, nowMs);

      if (pg.pendingSeatNos.length === 0) {
        if (pg.mode === "GARBAGE_COLLECTION") {
          for (const item of pg.collectedCards) {
            if (item.card.type === "godcat") {
              state.godcatOnPlaymat = true;
            } else {
              state.drawPile.push(item.card);
            }
          }
          state.drawPile = shuffle(state.drawPile, Math.random);
          events.push({
            eventType: "IK_GARBAGE_DONE",
            message: `Đã thu gom ${pg.collectedCards.length} lá bài từ mọi người chơi và xáo trộn lại toàn bộ Bộ bài rút!`,
            visibleToSeatNos: "all",
          });
        } else if (pg.mode === "FEED_THE_DEAD" && pg.recipientSeatNo) {
          const deadRecipient = getSeat(state, pg.recipientSeatNo);
          for (const item of pg.collectedCards) {
            if (item.card.type === "godcat") {
              state.godcatOnPlaymat = true;
            } else {
              deadRecipient.hand.push(item.card);
            }
          }
          events.push({
            eventType: "IK_FEED_DEAD_DONE",
            message: `${deadRecipient.displayName} đã nhận ${pg.collectedCards.length} lá bài cống nạp từ những người chơi còn sống!`,
            visibleToSeatNos: "all",
          });
        } else {
          // Potluck: place collected cards on TOP of drawPile in turn order without shuffling
          for (const item of pg.collectedCards) {
            if (item.card.type === "godcat") {
              state.godcatOnPlaymat = true;
            } else {
              state.drawPile.push(item.card);
            }
          }
          events.push({
            eventType: "IK_POTLUCK_DONE",
            message: `Đã xếp ${pg.collectedCards.length} lá bài góp từ mọi người chơi thẳng lên Đỉnh Bộ bài rút!`,
            visibleToSeatNos: "all",
          });
        }
        state.pendingGroupSubmit = null;
        state.step = "TurnPlayStep";
        state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
      }

      return { state, events, phaseDeadlineMs: state.phaseDeadlineMs };
    }

    // --- STEP: ARMAGEDDON (GOOD VS. EVIL SHOWDOWN) ---
    if (state.step === "ArmageddonStep" && state.pendingArmageddon) {
      const pa = state.pendingArmageddon;

      if (pa.stage === "ACTOR_PLACE") {
        if (
          command.type !== "ARMAGEDDON_PLACE" ||
          pa.actorSeatNo !== actor.seatNo
        ) {
          throw new Error(
            "Đang chờ người kích hoạt Tận Thế đặt úp Mèo Thần & Mèo Quỷ."
          );
        }
        pa.godcatGivenToTarget = Boolean(command.giveGodcatToTarget);
        pa.stage = "TARGET_CHOOSE";
        state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;
        const target = getSeat(state, pa.targetSeatNo);
        events.push({
          eventType: "IK_ARMAGEDDON_PLACED",
          message: `${actor.displayName} đã đặt úp 2 lá bài! Đến lượt ${target.displayName} quyết định GIỮ hay ĐỔI mà không được xem!`,
          visibleToSeatNos: "all",
        });
        return { state, events, phaseDeadlineMs: state.phaseDeadlineMs };
      }

      if (pa.stage === "TARGET_CHOOSE") {
        if (
          command.type !== "ARMAGEDDON_DECIDE" ||
          pa.targetSeatNo !== actor.seatNo
        ) {
          throw new Error(
            "Đang chờ đối thủ chọn GIỮ hoặc ĐỔI lá bài trong màn đấu trí Tận Thế."
          );
        }
        const armActor = getSeat(state, pa.actorSeatNo);
        const armTarget = getSeat(state, pa.targetSeatNo);
        const targetInitiallyHadGodcat = Boolean(pa.godcatGivenToTarget);
        const targetGetsGodcat = command.swap
          ? !targetInitiallyHadGodcat
          : targetInitiallyHadGodcat;

        const godcatWinner = targetGetsGodcat ? armTarget : armActor;
        const devilcatVictim = targetGetsGodcat ? armActor : armTarget;

        state.pendingArmageddon = null;

        // 1. Winner receives Godcat into hand (removed from Playmat)
        state.godcatOnPlaymat = false;
        const godcatCard: IkCard = {
          id: `ik-godcat-${state.turnNumber}-${nowMs}`,
          type: "godcat",
        };
        godcatWinner.hand.push(godcatCard);

        // 2. Victim flips Devilcat -> immediately explodes unless Defused (or Zombie Kitten)!
        // Note: Devilcat ALWAYS returns to Playmat; victim cannot use Godcat since godcatWinner has it.
        let defuseIdx = devilcatVictim.hand.findIndex(
          (c) => c.type === "defuse"
        );
        if (defuseIdx === -1) {
          defuseIdx = devilcatVictim.hand.findIndex(
            (c) => c.type === "zombie_kitten"
          );
        }

        const swapText = command.swap ? "chọn ĐỔI BÀI" : "chọn GIỮ BÀI";

        if (defuseIdx !== -1) {
          const [defCard] = devilcatVictim.hand.splice(defuseIdx, 1);
          state.discardPile.push(defCard);
          let revivedMsg = "";
          if (defCard.type === "zombie_kitten") {
            const deadSeat = state.seats.find((s) => !s.alive);
            if (deadSeat) {
              deadSeat.alive = true;
              deadSeat.eliminatedBy = null;
              revivedMsg = ` đồng thời hồi sinh ${deadSeat.displayName}!`;
            }
          }
          const outcomeMsg = `${armTarget.displayName} ${swapText}! ${godcatWinner.displayName} đoạt MÈO THẦN (Godcat) • ${devilcatVictim.displayName} lật phải MÈO QUỶ nhưng kịp đốt ${defCard.type === "zombie_kitten" ? "Zombie Kitten" : "Defuse"} thoát chết!${revivedMsg}`;
          setAnim(
            state,
            {
              kind: "DEFUSE",
              actorSeatNo: devilcatVictim.seatNo,
              targetSeatNo: godcatWinner.seatNo,
              card: { id: "ik-devilcat-playmat", type: "devilcat" },
              messageVi: outcomeMsg,
            },
            nowMs
          );
          events.push({
            eventType: "IK_ARMAGEDDON_RESOLVED",
            message: outcomeMsg,
            visibleToSeatNos: "all",
          });
        } else {
          devilcatVictim.alive = false;
          devilcatVictim.eliminatedBy = "devilcat";
          discardCardsRespectingPlaymat(state, [...devilcatVictim.hand]);
          devilcatVictim.hand = [];
          const outcomeMsg = `${armTarget.displayName} ${swapText}! ${godcatWinner.displayName} đoạt MÈO THẦN (Godcat) • ${devilcatVictim.displayName} lật phải MÈO QUỶ (Devilcat) khi không còn Defuse — NỔ TUNG NGAY LẬP TỨC!`;
          setAnim(
            state,
            {
              kind: "EXPLODE_DEATH",
              actorSeatNo: devilcatVictim.seatNo,
              targetSeatNo: godcatWinner.seatNo,
              card: { id: "ik-devilcat-playmat", type: "devilcat" },
              messageVi: outcomeMsg,
            },
            nowMs
          );
          events.push({
            eventType: "IK_ARMAGEDDON_KILLED",
            message: outcomeMsg,
            visibleToSeatNos: "all",
          });
        }

        // Playing Armageddon ends the actor's turn without drawing a card!
        consumeOneTurnOrAdvanceSeat(state, events, nowMs);
        return { state, events, phaseDeadlineMs: state.phaseDeadlineMs };
      }
    }

    // --- STEP: RAISING HECK (GOOD VS. EVIL BOTTOM CARD DECISION) ---
    if (state.step === "RaisingHeckStep" && state.pendingRaisingHeck) {
      if (
        command.type !== "RAISING_HECK_DECIDE" ||
        state.pendingRaisingHeck.seatNo !== actor.seatNo
      ) {
        throw new Error(
          "Đang chờ người chơi quyết định Quậy Tưng Bừng (Raising Heck)."
        );
      }

      state.pendingRaisingHeck = null;
      if (state.drawPile.length === 0) {
        consumeOneTurnOrAdvanceSeat(state, events, nowMs);
        return { state, events, phaseDeadlineMs: state.phaseDeadlineMs };
      }

      const bottomCard = state.drawPile.shift()!;
      if (command.takeToHand) {
        resolveCardDrawnBySeat(state, actor, bottomCard, true, events, nowMs);
      } else {
        // Put the bottom card directly on TOP of Draw Pile without exploding, and end 1 turn!
        state.drawPile.push(bottomCard);
        events.push({
          eventType: "IK_RAISING_HECK_TOP",
          message: `${actor.displayName} xem lá dưới Đáy rồi đặt thẳng nó lên ĐỈNH Bộ bài rút và kết thúc lượt!`,
          visibleToSeatNos: "all",
        });
        consumeOneTurnOrAdvanceSeat(state, events, nowMs);
      }

      return { state, events, phaseDeadlineMs: state.phaseDeadlineMs };
    }

    // --- STEP: NORMAL TURN PLAY OR DRAW ---
    if (state.activeSeatNo !== actor.seatNo) {
      throw new Error("Chưa đến lượt của bạn.");
    }

    if (command.type === "CLAIM_TOWER_STASH") {
      if (
        state.towerHolderSeatNo !== actor.seatNo ||
        state.towerStashCards.length === 0
      ) {
        throw new Error("Bạn hiện không đội Tháp Quyền Lực hoặc Tháp đã hết bài.");
      }
      const taken = state.towerStashCards.pop()!;
      taken.marked = false;
      actor.hand.push(taken);

      const remainingCount = state.towerStashCards.length;
      if (remainingCount > 0) {
        state.drawPile.push(...state.towerStashCards);
        state.drawPile = shuffle(state.drawPile, Math.random);
      }
      state.towerStashCards = [];
      state.towerHolderSeatNo = null;
      state.phaseDeadlineMs = nowMs + state.config.timers.turnSeconds * 1000;

      events.push({
        eventType: "IK_TOWER_CLAIMED",
        message:
          remainingCount > 0
            ? `${actor.displayName} tháo Tháp Quyền Lực: rút 1 lá bí mật về tay và xáo ${remainingCount} lá còn lại vào Bộ bài rút!`
            : `${actor.displayName} rút lá cuối cùng từ Tháp Quyền Lực về tay!`,
        visibleToSeatNos: "all",
      });
      return { state, events, phaseDeadlineMs: state.phaseDeadlineMs };
    }

    if (command.type === "DRAW_CARD") {
      if (state.drawPile.length === 0) {
        consumeOneTurnOrAdvanceSeat(state, events, nowMs);
        return { state, events, phaseDeadlineMs: state.phaseDeadlineMs };
      }
      const topCard = state.drawPile.pop()!;
      resolveCardDrawnBySeat(state, actor, topCard, false, events, nowMs);
      return { state, events, phaseDeadlineMs: state.phaseDeadlineMs };
    }

    if (command.type === "PLAY_CARD") {
      const idx = actor.hand.findIndex((c) => c.id === command.cardId);
      if (idx === -1) {
        throw new Error("Lá bài không có trên tay bạn.");
      }
      const card = actor.hand[idx];
      const meta = IK_CARD_META[card.type];

      if (
        card.type === "defuse" ||
        card.type === "zombie_kitten" ||
        card.type === "nope" ||
        card.type === "streaking_kitten" ||
        card.type === "exploding_kitten" ||
        card.type === "imploding_kitten" ||
        card.type === "devilcat"
      ) {
        throw new Error(
          `Lá [${meta.shortVi}] không thể đánh đơn lẻ trong lượt thông thường.`
        );
      }
      if (meta.category === "cat" || meta.category === "wildcard_cat") {
        throw new Error(
          "Lá Mèo cần được đánh theo Combo 2 lá (cướp bài), 3 lá (xin chỉ định), hoặc 5 lá khác nhau!"
        );
      }

      let effectiveType: IkCardType = card.type;
      let isGodcatPlay = false;

      if (card.type === "godcat") {
        const mimic = command.mimicCardType;
        if (!mimic || !IK_GODCAT_MIMICABLE_TYPES.includes(mimic)) {
          throw new Error(
            "Hãy chọn 1 lá Hành Động hợp lệ để Mèo Thần (Godcat) hóa thân (không thể hóa thành Nope)!"
          );
        }
        effectiveType = mimic;
        isGodcatPlay = true;
      } else if (card.type === "clone") {
        const topDiscard =
          state.discardPile.length > 0
            ? state.discardPile[state.discardPile.length - 1]
            : null;
        if (
          !topDiscard ||
          topDiscard.type === "clone" ||
          topDiscard.type === "godcat" ||
          IK_CARD_META[topDiscard.type].category !== "action"
        ) {
          throw new Error(
            "Chỉ có thể đánh Nhân Bản (Clone) khi lá trên cùng của Chồng bài bỏ là 1 lá Hành Động!"
          );
        }
        effectiveType = topDiscard.type;
      }

      if (effectiveType === "armageddon" && !state.godcatOnPlaymat) {
        throw new Error(
          "Chỉ có thể đánh Tận Thế (Armageddon) khi Mèo Thần (Godcat) đang nằm trên Thảm đấu!"
        );
      }

      const effMeta = IK_CARD_META[effectiveType];
      if (effMeta.needsTargetSeat) {
        if (
          !command.targetSeatNo ||
          command.targetSeatNo === actor.seatNo ||
          !getSeat(state, command.targetSeatNo).alive
        ) {
          throw new Error(
            `Lá [${effMeta.shortVi}] yêu cầu chọn 1 đối thủ còn sống làm mục tiêu.`
          );
        }
      }

      // Remove card from hand; Godcat ALWAYS returns to Playmat (never Discard Pile!)
      actor.hand.splice(idx, 1);
      card.marked = false;
      if (isGodcatPlay) {
        state.godcatOnPlaymat = true;
      } else {
        state.discardPile.push(card);
      }

      setAnim(
        state,
        {
          kind: "PLAY_CARD",
          actorSeatNo: actor.seatNo,
          targetSeatNo: command.targetSeatNo,
          card,
        },
        nowMs
      );

      const targetName = command.targetSeatNo
        ? ` nhắm vào ${getSeat(state, command.targetSeatNo).displayName}`
        : "";
      events.push({
        eventType: "IK_CARD_PLAYED",
        message: isGodcatPlay
          ? `${actor.displayName} tung Mèo Thần (Godcat) hóa thân thành [${effMeta.nameVi}]${targetName} (Mèo Thần quay về Thảm đấu)!`
          : card.type === "clone"
            ? `${actor.displayName} đánh Nhân Bản (Clone) sao chép lá [${effMeta.nameVi}]${targetName}!`
            : `${actor.displayName} đánh lá [${meta.nameVi}]${targetName}!`,
        visibleToSeatNos: "all",
      });

      maybeOpenNopeWindowOrExecute(
        state,
        {
          kind: "SINGLE_CARD",
          actorSeatNo: actor.seatNo,
          cards: [card],
          effectiveType,
          isGodcat: isGodcatPlay,
          targetSeatNo: command.targetSeatNo,
          nopeCount: 0,
          lastNopeBySeatNo: null,
          passedSeatNos: [],
        },
        events,
        nowMs
      );

      return { state, events, phaseDeadlineMs: state.phaseDeadlineMs };
    }

    if (
      command.type === "PLAY_COMBO_2" ||
      command.type === "PLAY_COMBO_3" ||
      command.type === "PLAY_COMBO_5"
    ) {
      const ids = command.cardIds;
      if (new Set(ids).size !== ids.length) {
        throw new Error("Các lá bài trong Combo không được trùng ID.");
      }
      const cards: IkCard[] = [];
      for (const cid of ids) {
        const found = actor.hand.find((c) => c.id === cid);
        if (!found) throw new Error("Lá bài trong Combo không nằm trên tay bạn.");
        if (
          found.type === "exploding_kitten" ||
          found.type === "imploding_kitten" ||
          found.type === "devilcat" ||
          found.type === "godcat"
        ) {
          throw new Error(
            found.type === "godcat"
              ? "Không thể đốt Mèo Thần (Godcat) trong Combo — hãy đánh trực tiếp để biến hóa thành mọi lá Hành Động!"
              : "Không thể dùng lá Bom để ghép Combo."
          );
        }
        cards.push(found);
      }

      if (command.type === "PLAY_COMBO_2" || command.type === "PLAY_COMBO_3") {
        if (!validateMatchingComboCards(cards)) {
          throw new Error(
            "Combo 2 hoặc 3 lá yêu cầu các lá bài phải CÙNG LOẠI (hoặc Lá Mèo ghép cùng Mèo Hoang Feral Cat)."
          );
        }
        const target = getSeat(state, command.targetSeatNo);
        if (!target.alive || target.seatNo === actor.seatNo) {
          throw new Error("Mục tiêu cướp bài không hợp lệ.");
        }
      } else {
        if (!validateFiveCardCombo(cards)) {
          throw new Error(
            "Combo 5 lá yêu cầu 5 lá bài phải hoàn toàn KHÁC LOẠI nhau."
          );
        }
        const targetDiscard = state.discardPile.find(
          (c) => c.id === command.discardCardId
        );
        if (!targetDiscard) {
          throw new Error("Lá bài muốn lấy không có trong Chồng bài bỏ.");
        }
        if (
          targetDiscard.type === "exploding_kitten" ||
          targetDiscard.type === "imploding_kitten" ||
          targetDiscard.type === "devilcat"
        ) {
          throw new Error("Không thể trục vớt lá Bom từ Chồng bài bỏ.");
        }
      }

      // Remove combo cards from hand & push to discardPile
      const idSet = new Set(ids);
      actor.hand = actor.hand.filter((c) => !idSet.has(c.id));
      for (const c of cards) {
        c.marked = false;
        state.discardPile.push(c);
      }

      setAnim(
        state,
        {
          kind: "PLAY_CARD",
          actorSeatNo: actor.seatNo,
          targetSeatNo:
            command.type !== "PLAY_COMBO_5" ? command.targetSeatNo : undefined,
          card: cards[0],
        },
        nowMs
      );

      events.push({
        eventType: "IK_COMBO_PLAYED",
        message:
          command.type === "PLAY_COMBO_2"
            ? `${actor.displayName} đánh Combo 2 Lá nhắm vào ${getSeat(state, command.targetSeatNo).displayName}!`
            : command.type === "PLAY_COMBO_3"
              ? `${actor.displayName} đánh Combo 3 Lá đòi lá [${IK_CARD_META[command.wantedCardType].shortVi}] từ ${getSeat(state, command.targetSeatNo).displayName}!`
              : `${actor.displayName} đánh Combo 5 Lá Khác Nhau để trục vớt 1 lá bài từ Chồng bài bỏ!`,
        visibleToSeatNos: "all",
      });

      checkExposedHandBomb(state, actor, events, nowMs);

      maybeOpenNopeWindowOrExecute(
        state,
        {
          kind:
            command.type === "PLAY_COMBO_2"
              ? "COMBO_2"
              : command.type === "PLAY_COMBO_3"
                ? "COMBO_3"
                : "COMBO_5",
          actorSeatNo: actor.seatNo,
          cards,
          targetSeatNo:
            command.type !== "PLAY_COMBO_5" ? command.targetSeatNo : undefined,
          wantedCardType:
            command.type === "PLAY_COMBO_3"
              ? command.wantedCardType
              : undefined,
          discardCardId:
            command.type === "PLAY_COMBO_5" ? command.discardCardId : undefined,
          nopeCount: 0,
          lastNopeBySeatNo: null,
          passedSeatNos: [],
        },
        events,
        nowMs
      );

      return { state, events, phaseDeadlineMs: state.phaseDeadlineMs };
    }

    throw new Error("Lệnh không hợp lệ.");
  },

  onPhaseTimeout({ state: prevState, nowMs }) {
    if (prevState.step === "Finished") {
      return { state: prevState, events: [], phaseDeadlineMs: null };
    }

    if (prevState.step === "NopeWindowStep" && prevState.pendingAction) {
      const state = cloneState(prevState);
      const events: MatchEventRecord[] = [];
      executeResolvedAction(state, state.pendingAction!, events, nowMs);
      return { state, events, phaseDeadlineMs: state.phaseDeadlineMs };
    }

    if (prevState.step === "DefuseInsertStep" && prevState.pendingInsert) {
      return this.reduce({
        state: prevState,
        actorSeatNo: prevState.pendingInsert.seatNo,
        nowMs,
        command: { type: "INSERT_CARD", insertIndex: 0 },
      });
    }

    if (prevState.step === "AlterFutureStep" && prevState.pendingAlterFuture) {
      return this.reduce({
        state: prevState,
        actorSeatNo: prevState.pendingAlterFuture.seatNo,
        nowMs,
        command: {
          type: "COMMIT_ALTER_FUTURE",
          orderedCardIds: prevState.pendingAlterFuture.cards.map((c) => c.id),
        },
      });
    }

    if (prevState.step === "FavorGiveStep" && prevState.pendingFavor) {
      const fromSeat = getSeat(prevState, prevState.pendingFavor.fromSeatNo);
      if (fromSeat.hand.length > 0) {
        return this.reduce({
          state: prevState,
          actorSeatNo: fromSeat.seatNo,
          nowMs,
          command: { type: "GIVE_FAVOR_CARD", cardId: fromSeat.hand[0].id },
        });
      }
    }

    if (prevState.step === "Combo2PickStep" && prevState.pendingCombo2Pick) {
      const target = getSeat(prevState, prevState.pendingCombo2Pick.targetSeatNo);
      const randIdx =
        target.hand.length > 0
          ? Math.floor(Math.random() * target.hand.length)
          : 0;
      return this.reduce({
        state: prevState,
        actorSeatNo: prevState.pendingCombo2Pick.actorSeatNo,
        nowMs,
        command: { type: "PICK_COMBO_2_CARD", cardIndex: randIdx },
      });
    }

    if (prevState.step === "DigDeeperStep" && prevState.pendingDigDeeper) {
      return this.reduce({
        state: prevState,
        actorSeatNo: prevState.pendingDigDeeper.seatNo,
        nowMs,
        command: { type: "DIG_DEEPER_DECIDE", keepFirst: true },
      });
    }

    if (prevState.step === "GarbagePickStep" && prevState.pendingGroupSubmit) {
      let current: CartridgeTransitionResult<IkMatchState> = {
        state: prevState,
        events: [],
        phaseDeadlineMs: prevState.phaseDeadlineMs,
      };
      for (const seatNo of [...prevState.pendingGroupSubmit.pendingSeatNos]) {
        const s = getSeat(current.state, seatNo);
        if (s.hand.length > 0) {
          const next = this.reduce({
            state: current.state,
            actorSeatNo: seatNo,
            nowMs,
            command: { type: "SUBMIT_GROUP_CARD", cardId: s.hand[0].id },
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

    if (prevState.step === "ArmageddonStep" && prevState.pendingArmageddon) {
      const pa = prevState.pendingArmageddon;
      if (pa.stage === "ACTOR_PLACE") {
        return this.reduce({
          state: prevState,
          actorSeatNo: pa.actorSeatNo,
          nowMs,
          command: {
            type: "ARMAGEDDON_PLACE",
            giveGodcatToTarget: Math.random() < 0.5,
          },
        });
      }
      return this.reduce({
        state: prevState,
        actorSeatNo: pa.targetSeatNo,
        nowMs,
        command: {
          type: "ARMAGEDDON_DECIDE",
          swap: Math.random() < 0.5,
        },
      });
    }

    if (prevState.step === "RaisingHeckStep" && prevState.pendingRaisingHeck) {
      const bottom = prevState.pendingRaisingHeck.bottomCard;
      const isBomb =
        bottom.type === "exploding_kitten" ||
        bottom.type === "imploding_kitten";
      return this.reduce({
        state: prevState,
        actorSeatNo: prevState.pendingRaisingHeck.seatNo,
        nowMs,
        command: { type: "RAISING_HECK_DECIDE", takeToHand: !isBomb },
      });
    }

    return this.reduce({
      state: prevState,
      actorSeatNo: prevState.activeSeatNo,
      nowMs,
      command: { type: "DRAW_CARD" },
    });
  },

  autoActBots({ current, botSeatNos, nowMs }) {
    const botSet = new Set(botSeatNos);
    let result = current;
    let guard = 0;

    while (result.state.step !== "Finished" && guard < 40) {
      guard += 1;
      const st = result.state;
      let acted = false;

      if (st.step === "NopeWindowStep" && st.pendingAction) {
        for (const bSeatNo of botSeatNos) {
          const bSeat = st.seats.find((s) => s.seatNo === bSeatNo && s.alive);
          if (!bSeat) continue;
          if (st.pendingAction.passedSeatNos.includes(bSeatNo)) continue;
          if (!bSeat.hand.some((c) => c.type === "nope")) continue;

          const cmd = chooseBotCommand(st, bSeatNo);
          if (cmd) {
            const next = this.reduce({
              state: st,
              actorSeatNo: bSeatNo,
              nowMs,
              command: cmd,
            });
            result = {
              state: next.state,
              events: [...result.events, ...next.events],
              phaseDeadlineMs: next.phaseDeadlineMs,
            };
            acted = true;
            break;
          }
        }
        if (acted) continue;
        break;
      }

      if (st.step === "GarbagePickStep" && st.pendingGroupSubmit) {
        const pendingBot = st.pendingGroupSubmit.pendingSeatNos.find((sNo) =>
          botSet.has(sNo)
        );
        if (pendingBot !== undefined) {
          const cmd = chooseBotCommand(st, pendingBot);
          if (cmd) {
            const next = this.reduce({
              state: st,
              actorSeatNo: pendingBot,
              nowMs,
              command: cmd,
            });
            result = {
              state: next.state,
              events: [...result.events, ...next.events],
              phaseDeadlineMs: next.phaseDeadlineMs,
            };
            continue;
          }
        }
        break;
      }

      // Check if an interactive sub-step belongs to a Bot
      const actingSeatNo =
        st.step === "DefuseInsertStep"
          ? st.pendingInsert?.seatNo
          : st.step === "AlterFutureStep"
            ? st.pendingAlterFuture?.seatNo
            : st.step === "FavorGiveStep"
              ? st.pendingFavor?.fromSeatNo
              : st.step === "Combo2PickStep"
                ? st.pendingCombo2Pick?.actorSeatNo
                : st.step === "DigDeeperStep"
                  ? st.pendingDigDeeper?.seatNo
                  : st.step === "ArmageddonStep"
                    ? st.pendingArmageddon?.stage === "ACTOR_PLACE"
                      ? st.pendingArmageddon.actorSeatNo
                      : st.pendingArmageddon?.targetSeatNo
                    : st.step === "RaisingHeckStep"
                      ? st.pendingRaisingHeck?.seatNo
                      : st.activeSeatNo;

      if (actingSeatNo !== undefined && botSet.has(actingSeatNo)) {
        const cmd = chooseBotCommand(st, actingSeatNo);
        if (cmd) {
          const next = this.reduce({
            state: st,
            actorSeatNo: actingSeatNo,
            nowMs,
            command: cmd,
          });
          result = {
            state: next.state,
            events: [...result.events, ...next.events],
            phaseDeadlineMs: next.phaseDeadlineMs,
          };
          continue;
        }
      }

      break;
    }

    return result;
  },

  projectView({ state, viewerSeatNo }): IkPlayerView {
    const mySeat =
      viewerSeatNo !== null
        ? state.seats.find((s) => s.seatNo === viewerSeatNo) ?? null
        : null;

    const topDraw =
      state.drawPile.length > 0
        ? state.drawPile[state.drawPile.length - 1]
        : null;
    const topDrawCardFaceUp =
      topDraw && topDraw.faceUp ? { ...topDraw } : null;

    const faceUpImplodingInDeck = state.drawPile.some(
      (c) => c.type === "imploding_kitten" && Boolean(c.faceUp)
    );

    const pa = state.pendingAction;
    const viewerHasNope = Boolean(
      mySeat?.alive && mySeat.hand.some((c) => c.type === "nope")
    );

    return {
      cartridgeId: "imploding-kittens",
      turnNumber: state.turnNumber,
      step: state.step,
      activeSeatNo: state.activeSeatNo,
      viewerSeatNo,
      direction: state.direction,
      turnsRemaining: state.turnsRemaining,
      seats: state.seats.map((s) => ({
        seatNo: s.seatNo,
        actorId: s.actorId,
        displayName: s.displayName,
        avatarSeed: s.avatarSeed,
        alive: s.alive,
        eliminatedBy: s.eliminatedBy,
        handCount: s.hand.length,
        isBlind: s.isBlind,
        barkingPlayedFaceUp: s.barkingPlayedFaceUp,
        illTakeThatFromSeatNo: s.illTakeThatFromSeatNo,
        hasGodcat: s.hand.some((c) => c.type === "godcat"),
        markedCards: s.hand.filter((c) => Boolean(c.marked)),
      })),
      drawPileCount: state.drawPile.length,
      topDrawCardFaceUp,
      faceUpImplodingInDeck,
      discardPileCount: state.discardPile.length,
      discardTopCard:
        state.discardPile.length > 0
          ? state.discardPile[state.discardPile.length - 1]
          : null,
      discardPileCards: state.discardPile.filter(
        (c) =>
          c.type !== "exploding_kitten" &&
          c.type !== "imploding_kitten" &&
          c.type !== "devilcat"
      ),
      towerHolderSeatNo: state.towerHolderSeatNo ?? null,
      towerStashCount: (state.towerStashCards ?? []).length,
      godcatOnPlaymat: Boolean(state.godcatOnPlaymat),
      myHand: mySeat ? mySeat.hand : [],
      myIsBlind: Boolean(mySeat?.isBlind),
      myPrivateVision: mySeat?.privateVision ?? null,
      pendingAction: pa
        ? {
            kind: pa.kind,
            actorSeatNo: pa.actorSeatNo,
            cards: pa.cards,
            effectiveType: pa.effectiveType,
            targetSeatNo: pa.targetSeatNo,
            wantedCardType: pa.wantedCardType,
            nopeCount: pa.nopeCount,
            isCanceledByNope: pa.nopeCount % 2 === 1,
            lastNopeBySeatNo: pa.lastNopeBySeatNo,
            canViewerNope: viewerHasNope,
            hasViewerPassedNope:
              viewerSeatNo !== null && pa.passedSeatNos.includes(viewerSeatNo),
          }
        : null,
      pendingInsert: state.pendingInsert
        ? {
            seatNo: state.pendingInsert.seatNo,
            card:
              state.pendingInsert.seatNo === viewerSeatNo ||
              state.pendingInsert.reason === "INSERT_IMPLODING_FACEUP"
                ? state.pendingInsert.card
                : { id: "hidden-insert", type: "exploding_kitten" },
            reason: state.pendingInsert.reason,
            maxInsertIndex: state.drawPile.length,
          }
        : null,
      pendingAlterFuture: state.pendingAlterFuture
        ? {
            seatNo: state.pendingAlterFuture.seatNo,
            count: state.pendingAlterFuture.count,
            cards:
              state.pendingAlterFuture.seatNo === viewerSeatNo
                ? state.pendingAlterFuture.cards
                : [],
          }
        : null,
      pendingFavor: state.pendingFavor,
      pendingCombo2Pick: state.pendingCombo2Pick
        ? (() => {
            const target = getSeat(state, state.pendingCombo2Pick!.targetSeatNo);
            const handById = new Map(target.hand.map((c) => [c.id, c]));
            const orderedIds =
              state.pendingCombo2Pick!.shuffledCardIds ??
              target.hand.map((c) => c.id);
            const slots = orderedIds
              .map((id) => handById.get(id))
              .filter((c): c is IkCard => Boolean(c))
              .map((c) => (c.marked ? c : null));
            return {
              actorSeatNo: state.pendingCombo2Pick!.actorSeatNo,
              targetSeatNo: target.seatNo,
              targetDisplayName: target.displayName,
              // Chỉ lộ lá nào đã bị Mark công khai theo thứ tự đã xáo; mọi lá thường trả về null (úp mặt chống gian lận)
              slots,
            };
          })()
        : null,
      pendingDigDeeper: state.pendingDigDeeper
        ? {
            seatNo: state.pendingDigDeeper.seatNo,
            topCard:
              state.pendingDigDeeper.seatNo === viewerSeatNo
                ? state.pendingDigDeeper.topCard
                : null,
            hasSecondCard: state.pendingDigDeeper.secondCard !== null,
          }
        : null,
      pendingGroupSubmit: state.pendingGroupSubmit
        ? {
            mode: state.pendingGroupSubmit.mode,
            pendingSeatNos: state.pendingGroupSubmit.pendingSeatNos,
            needsViewerCard:
              viewerSeatNo !== null &&
              state.pendingGroupSubmit.pendingSeatNos.includes(viewerSeatNo),
          }
        : null,
      pendingArmageddon: state.pendingArmageddon
        ? {
            actorSeatNo: state.pendingArmageddon.actorSeatNo,
            actorDisplayName: getSeat(
              state,
              state.pendingArmageddon.actorSeatNo
            ).displayName,
            targetSeatNo: state.pendingArmageddon.targetSeatNo,
            targetDisplayName: getSeat(
              state,
              state.pendingArmageddon.targetSeatNo
            ).displayName,
            stage: state.pendingArmageddon.stage,
            // Anti-cheat: chỉ người đặt bài mới biết đã đặt Mèo Thần cho ai; đối thủ & người khác luôn thấy null!
            godcatGivenToTarget:
              state.pendingArmageddon.actorSeatNo === viewerSeatNo
                ? state.pendingArmageddon.godcatGivenToTarget
                : null,
          }
        : null,
      pendingRaisingHeck: state.pendingRaisingHeck
        ? {
            seatNo: state.pendingRaisingHeck.seatNo,
            bottomCard:
              state.pendingRaisingHeck.seatNo === viewerSeatNo
                ? state.pendingRaisingHeck.bottomCard
                : null,
          }
        : null,
      lastAnim: state.lastAnim
        ? state.lastAnim.kind === "COMBO_STEAL"
          ? (() => {
              const isActor = state.lastAnim!.actorSeatNo === viewerSeatNo;
              const isTarget = state.lastAnim!.targetSeatNo === viewerSeatNo;
              const canSeeStolenCard = state.lastAnim!.fromTower
                ? isActor
                : isActor || isTarget;
              return {
                ...state.lastAnim!,
                card: canSeeStolenCard ? state.lastAnim!.card : undefined,
              };
            })()
          : state.lastAnim
        : null,
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
        label: "Bàn Chơi Mèo Nổ",
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
