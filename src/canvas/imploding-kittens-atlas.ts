// Auto-generated 2D Cel-Shaded Sprite Atlas for all Imploding Kittens cards (Core + 5 Expansions)
// Single 3360x3920 WebP spritesheet (12x10 grid, 280x392 per card, 120 tiles)
import type { IkCardType } from "@/cartridges/imploding-kittens";

export const IK_CARD_ATLAS_URL = "/sprites/ik-cards-atlas-2d.webp";
export const IK_CARD_ATLAS_COLS = 12;
export const IK_CARD_ATLAS_ROWS = 10;
export const IK_CARD_TILE_W = 280;
export const IK_CARD_TILE_H = 392;

export interface IkCardAtlasSlot {
  col: number;
  row: number;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export const IK_CARD_BACK_SLOT: IkCardAtlasSlot = {"col": 0, "row": 0, "sx": 0, "sy": 0, "sw": 280, "sh": 392};

export const IK_CARD_ATLAS_SLOTS: Record<IkCardType, IkCardAtlasSlot[]> = {
  tacocat: [{"col": 1, "row": 0, "sx": 280, "sy": 0, "sw": 280, "sh": 392}],
  rainbow_cat: [{"col": 2, "row": 0, "sx": 560, "sy": 0, "sw": 280, "sh": 392}],
  hairy_potato_cat: [{"col": 3, "row": 0, "sx": 840, "sy": 0, "sw": 280, "sh": 392}],
  catermelon: [{"col": 4, "row": 0, "sx": 1120, "sy": 0, "sw": 280, "sh": 392}],
  beard_cat: [{"col": 5, "row": 0, "sx": 1400, "sy": 0, "sw": 280, "sh": 392}],
  skip: [{"col": 6, "row": 0, "sx": 1680, "sy": 0, "sw": 280, "sh": 392}, {"col": 7, "row": 0, "sx": 1960, "sy": 0, "sw": 280, "sh": 392}, {"col": 8, "row": 0, "sx": 2240, "sy": 0, "sw": 280, "sh": 392}, {"col": 9, "row": 0, "sx": 2520, "sy": 0, "sw": 280, "sh": 392}],
  shuffle: [{"col": 10, "row": 0, "sx": 2800, "sy": 0, "sw": 280, "sh": 392}, {"col": 11, "row": 0, "sx": 3080, "sy": 0, "sw": 280, "sh": 392}, {"col": 0, "row": 1, "sx": 0, "sy": 392, "sw": 280, "sh": 392}, {"col": 1, "row": 1, "sx": 280, "sy": 392, "sw": 280, "sh": 392}],
  defuse: [{"col": 2, "row": 1, "sx": 560, "sy": 392, "sw": 280, "sh": 392}, {"col": 3, "row": 1, "sx": 840, "sy": 392, "sw": 280, "sh": 392}, {"col": 4, "row": 1, "sx": 1120, "sy": 392, "sw": 280, "sh": 392}, {"col": 5, "row": 1, "sx": 1400, "sy": 392, "sw": 280, "sh": 392}, {"col": 6, "row": 1, "sx": 1680, "sy": 392, "sw": 280, "sh": 392}],
  see_future_3: [{"col": 7, "row": 1, "sx": 1960, "sy": 392, "sw": 280, "sh": 392}, {"col": 8, "row": 1, "sx": 2240, "sy": 392, "sw": 280, "sh": 392}, {"col": 9, "row": 1, "sx": 2520, "sy": 392, "sw": 280, "sh": 392}, {"col": 10, "row": 1, "sx": 2800, "sy": 392, "sw": 280, "sh": 392}, {"col": 11, "row": 1, "sx": 3080, "sy": 392, "sw": 280, "sh": 392}],
  nope: [{"col": 0, "row": 2, "sx": 0, "sy": 784, "sw": 280, "sh": 392}, {"col": 1, "row": 2, "sx": 280, "sy": 784, "sw": 280, "sh": 392}, {"col": 2, "row": 2, "sx": 560, "sy": 784, "sw": 280, "sh": 392}, {"col": 3, "row": 2, "sx": 840, "sy": 784, "sw": 280, "sh": 392}],
  favor: [{"col": 4, "row": 2, "sx": 1120, "sy": 784, "sw": 280, "sh": 392}, {"col": 5, "row": 2, "sx": 1400, "sy": 784, "sw": 280, "sh": 392}, {"col": 6, "row": 2, "sx": 1680, "sy": 784, "sw": 280, "sh": 392}, {"col": 7, "row": 2, "sx": 1960, "sy": 784, "sw": 280, "sh": 392}],
  attack: [{"col": 8, "row": 2, "sx": 2240, "sy": 784, "sw": 280, "sh": 392}, {"col": 9, "row": 2, "sx": 2520, "sy": 784, "sw": 280, "sh": 392}, {"col": 10, "row": 2, "sx": 2800, "sy": 784, "sw": 280, "sh": 392}, {"col": 11, "row": 2, "sx": 3080, "sy": 784, "sw": 280, "sh": 392}, {"col": 0, "row": 3, "sx": 0, "sy": 1176, "sw": 280, "sh": 392}],
  exploding_kitten: [{"col": 1, "row": 3, "sx": 280, "sy": 1176, "sw": 280, "sh": 392}, {"col": 2, "row": 3, "sx": 560, "sy": 1176, "sw": 280, "sh": 392}, {"col": 3, "row": 3, "sx": 840, "sy": 1176, "sw": 280, "sh": 392}, {"col": 4, "row": 3, "sx": 1120, "sy": 1176, "sw": 280, "sh": 392}, {"col": 5, "row": 3, "sx": 1400, "sy": 1176, "sw": 280, "sh": 392}],
  dig_deeper: [{"col": 6, "row": 3, "sx": 1680, "sy": 1176, "sw": 280, "sh": 392}, {"col": 7, "row": 3, "sx": 1960, "sy": 1176, "sw": 280, "sh": 392}, {"col": 8, "row": 3, "sx": 2240, "sy": 1176, "sw": 280, "sh": 392}, {"col": 9, "row": 3, "sx": 2520, "sy": 1176, "sw": 280, "sh": 392}],
  zombie_kitten: [{"col": 10, "row": 3, "sx": 2800, "sy": 1176, "sw": 280, "sh": 392}, {"col": 11, "row": 3, "sx": 3080, "sy": 1176, "sw": 280, "sh": 392}, {"col": 0, "row": 4, "sx": 0, "sy": 1568, "sw": 280, "sh": 392}, {"col": 1, "row": 4, "sx": 280, "sy": 1568, "sw": 280, "sh": 392}, {"col": 2, "row": 4, "sx": 560, "sy": 1568, "sw": 280, "sh": 392}],
  attack_of_the_dead: [{"col": 3, "row": 4, "sx": 840, "sy": 1568, "sw": 280, "sh": 392}, {"col": 4, "row": 4, "sx": 1120, "sy": 1568, "sw": 280, "sh": 392}, {"col": 5, "row": 4, "sx": 1400, "sy": 1568, "sw": 280, "sh": 392}],
  clairvoyance: [{"col": 6, "row": 4, "sx": 1680, "sy": 1568, "sw": 280, "sh": 392}, {"col": 7, "row": 4, "sx": 1960, "sy": 1568, "sw": 280, "sh": 392}],
  clone: [{"col": 8, "row": 4, "sx": 2240, "sy": 1568, "sw": 280, "sh": 392}, {"col": 9, "row": 4, "sx": 2520, "sy": 1568, "sw": 280, "sh": 392}, {"col": 10, "row": 4, "sx": 2800, "sy": 1568, "sw": 280, "sh": 392}],
  feed_the_dead: [{"col": 11, "row": 4, "sx": 3080, "sy": 1568, "sw": 280, "sh": 392}, {"col": 0, "row": 5, "sx": 0, "sy": 1960, "sw": 280, "sh": 392}],
  grave_robber: [{"col": 1, "row": 5, "sx": 280, "sy": 1960, "sw": 280, "sh": 392}],
  de_cat_ipated: [{"col": 2, "row": 5, "sx": 560, "sy": 1960, "sw": 280, "sh": 392}],
  vampire_cat: [{"col": 3, "row": 5, "sx": 840, "sy": 1960, "sw": 280, "sh": 392}],
  zombie_cat: [{"col": 4, "row": 5, "sx": 1120, "sy": 1960, "sw": 280, "sh": 392}],
  bury: [{"col": 5, "row": 5, "sx": 1400, "sy": 1960, "sw": 280, "sh": 392}, {"col": 6, "row": 5, "sx": 1680, "sy": 1960, "sw": 280, "sh": 392}],
  barking_kitten: [{"col": 7, "row": 5, "sx": 1960, "sy": 1960, "sw": 280, "sh": 392}, {"col": 8, "row": 5, "sx": 2240, "sy": 1960, "sw": 280, "sh": 392}],
  ill_take_that: [{"col": 9, "row": 5, "sx": 2520, "sy": 1960, "sw": 280, "sh": 392}, {"col": 10, "row": 5, "sx": 2800, "sy": 1960, "sw": 280, "sh": 392}, {"col": 11, "row": 5, "sx": 3080, "sy": 1960, "sw": 280, "sh": 392}, {"col": 0, "row": 6, "sx": 0, "sy": 2352, "sw": 280, "sh": 392}],
  potluck: [{"col": 1, "row": 6, "sx": 280, "sy": 2352, "sw": 280, "sh": 392}, {"col": 2, "row": 6, "sx": 560, "sy": 2352, "sw": 280, "sh": 392}],
  personal_attack: [{"col": 3, "row": 6, "sx": 840, "sy": 2352, "sw": 280, "sh": 392}, {"col": 4, "row": 6, "sx": 1120, "sy": 2352, "sw": 280, "sh": 392}, {"col": 5, "row": 6, "sx": 1400, "sy": 2352, "sw": 280, "sh": 392}, {"col": 6, "row": 6, "sx": 1680, "sy": 2352, "sw": 280, "sh": 392}],
  share_future_3: [{"col": 7, "row": 6, "sx": 1960, "sy": 2352, "sw": 280, "sh": 392}, {"col": 8, "row": 6, "sx": 2240, "sy": 2352, "sw": 280, "sh": 392}],
  tower_of_power: [{"col": 9, "row": 6, "sx": 2520, "sy": 2352, "sw": 280, "sh": 392}],
  streaking_kitten: [{"col": 10, "row": 6, "sx": 2800, "sy": 2352, "sw": 280, "sh": 392}],
  super_skip: [{"col": 11, "row": 6, "sx": 3080, "sy": 2352, "sw": 280, "sh": 392}],
  see_future_5: [{"col": 0, "row": 7, "sx": 0, "sy": 2744, "sw": 280, "sh": 392}],
  alter_future_5: [{"col": 1, "row": 7, "sx": 280, "sy": 2744, "sw": 280, "sh": 392}],
  swap_top_bottom: [{"col": 2, "row": 7, "sx": 560, "sy": 2744, "sw": 280, "sh": 392}],
  garbage_collection: [{"col": 3, "row": 7, "sx": 840, "sy": 2744, "sw": 280, "sh": 392}],
  catomic_bomb: [{"col": 4, "row": 7, "sx": 1120, "sy": 2744, "sw": 280, "sh": 392}],
  curse_cat_butt: [{"col": 5, "row": 7, "sx": 1400, "sy": 2744, "sw": 280, "sh": 392}, {"col": 6, "row": 7, "sx": 1680, "sy": 2744, "sw": 280, "sh": 392}],
  mark: [{"col": 7, "row": 7, "sx": 1960, "sy": 2744, "sw": 280, "sh": 392}],
  imploding_kitten: [{"col": 8, "row": 7, "sx": 2240, "sy": 2744, "sw": 280, "sh": 392}],
  feral_cat: [{"col": 9, "row": 7, "sx": 2520, "sy": 2744, "sw": 280, "sh": 392}],
  reverse: [{"col": 10, "row": 7, "sx": 2800, "sy": 2744, "sw": 280, "sh": 392}, {"col": 11, "row": 7, "sx": 3080, "sy": 2744, "sw": 280, "sh": 392}, {"col": 0, "row": 8, "sx": 0, "sy": 3136, "sw": 280, "sh": 392}, {"col": 1, "row": 8, "sx": 280, "sy": 3136, "sw": 280, "sh": 392}],
  draw_bottom: [{"col": 2, "row": 8, "sx": 560, "sy": 3136, "sw": 280, "sh": 392}],
  alter_future_3: [{"col": 3, "row": 8, "sx": 840, "sy": 3136, "sw": 280, "sh": 392}, {"col": 4, "row": 8, "sx": 1120, "sy": 3136, "sw": 280, "sh": 392}, {"col": 5, "row": 8, "sx": 1400, "sy": 3136, "sw": 280, "sh": 392}, {"col": 6, "row": 8, "sx": 1680, "sy": 3136, "sw": 280, "sh": 392}],
  targeted_attack: [{"col": 7, "row": 8, "sx": 1960, "sy": 3136, "sw": 280, "sh": 392}, {"col": 8, "row": 8, "sx": 2240, "sy": 3136, "sw": 280, "sh": 392}, {"col": 9, "row": 8, "sx": 2520, "sy": 3136, "sw": 280, "sh": 392}],
  armageddon: [{"col": 10, "row": 8, "sx": 2800, "sy": 3136, "sw": 280, "sh": 392}, {"col": 11, "row": 8, "sx": 3080, "sy": 3136, "sw": 280, "sh": 392}, {"col": 0, "row": 9, "sx": 0, "sy": 3528, "sw": 280, "sh": 392}],
  godcat: [{"col": 1, "row": 9, "sx": 280, "sy": 3528, "sw": 280, "sh": 392}],
  devilcat: [{"col": 2, "row": 9, "sx": 560, "sy": 3528, "sw": 280, "sh": 392}],
  raising_heck: [{"col": 3, "row": 9, "sx": 840, "sy": 3528, "sw": 280, "sh": 392}, {"col": 4, "row": 9, "sx": 1120, "sy": 3528, "sw": 280, "sh": 392}],
  reveal_future_3: [{"col": 5, "row": 9, "sx": 1400, "sy": 3528, "sw": 280, "sh": 392}, {"col": 6, "row": 9, "sx": 1680, "sy": 3528, "sw": 280, "sh": 392}, {"col": 7, "row": 9, "sx": 1960, "sy": 3528, "sw": 280, "sh": 392}],
  horse_cat: [{"col": 8, "row": 9, "sx": 2240, "sy": 3528, "sw": 280, "sh": 392}],
  knight_cat: [{"col": 9, "row": 9, "sx": 2520, "sy": 3528, "sw": 280, "sh": 392}],
  mercat: [{"col": 10, "row": 9, "sx": 2800, "sy": 3528, "sw": 280, "sh": 392}],
  troll_cat: [{"col": 11, "row": 9, "sx": 3080, "sy": 3528, "sw": 280, "sh": 392}],
};

let cachedAtlasImg: HTMLImageElement | null = null;
let atlasLoaded = false;

export function getIkCardAtlasImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (atlasLoaded && cachedAtlasImg) return cachedAtlasImg;
  if (!cachedAtlasImg) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      atlasLoaded = true;
    };
    img.src = IK_CARD_ATLAS_URL;
    cachedAtlasImg = img;
  }
  return null;
}

function hashCardIdToVariantIndex(cardId: string, count: number): number {
  if (count <= 1) return 0;
  let h = 0;
  for (let i = 0; i < cardId.length; i++) {
    h = (h * 31 + cardId.charCodeAt(i)) >>> 0;
  }
  return h % count;
}

export function getIkCardAtlasSlot(type: IkCardType | "back", cardId = "0"): IkCardAtlasSlot {
  if (type === "back") return IK_CARD_BACK_SLOT;
  const slots = IK_CARD_ATLAS_SLOTS[type];
  if (!slots || slots.length === 0) return IK_CARD_BACK_SLOT;
  return slots[hashCardIdToVariantIndex(cardId, slots.length)];
}

export function getIkCardSpriteBgStyle(
  type: IkCardType | "back",
  cardId = "0"
) {
  const slot = getIkCardAtlasSlot(type, cardId);
  const xPct = IK_CARD_ATLAS_COLS > 1 ? (slot.col / (IK_CARD_ATLAS_COLS - 1)) * 100 : 0;
  const yPct = IK_CARD_ATLAS_ROWS > 1 ? (slot.row / (IK_CARD_ATLAS_ROWS - 1)) * 100 : 0;
  return {
    backgroundImage: `url(${IK_CARD_ATLAS_URL})`,
    backgroundSize: `${IK_CARD_ATLAS_COLS * 100}% ${IK_CARD_ATLAS_ROWS * 100}%`,
    backgroundPosition: `${xPct}% ${yPct}%`,
    backgroundRepeat: "no-repeat" as const,
  };
}
