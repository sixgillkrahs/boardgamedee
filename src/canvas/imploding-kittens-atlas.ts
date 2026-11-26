// Auto-generated 16-bit Pixel Art Sprite Atlas for all Imploding Kittens cards (Core + 5 Expansions)
// Single 3120x3640 WebP spritesheet (12x10 grid, 260x364 per card, 120 tiles)
import type { IkCardType } from "@/cartridges/imploding-kittens";

export const IK_CARD_ATLAS_URL = "/sprites/ik-cards-atlas-pixel.webp";
export const IK_CARD_ATLAS_COLS = 12;
export const IK_CARD_ATLAS_ROWS = 10;
export const IK_CARD_TILE_W = 260;
export const IK_CARD_TILE_H = 364;

export interface IkCardAtlasSlot {
  col: number;
  row: number;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export const IK_CARD_BACK_SLOT: IkCardAtlasSlot = {"col": 0, "row": 0, "sx": 0, "sy": 0, "sw": 260, "sh": 364};

export const IK_CARD_ATLAS_SLOTS: Record<IkCardType, IkCardAtlasSlot[]> = {
  tacocat: [{"col": 1, "row": 0, "sx": 260, "sy": 0, "sw": 260, "sh": 364}],
  rainbow_cat: [{"col": 2, "row": 0, "sx": 520, "sy": 0, "sw": 260, "sh": 364}],
  hairy_potato_cat: [{"col": 3, "row": 0, "sx": 780, "sy": 0, "sw": 260, "sh": 364}],
  catermelon: [{"col": 4, "row": 0, "sx": 1040, "sy": 0, "sw": 260, "sh": 364}],
  beard_cat: [{"col": 5, "row": 0, "sx": 1300, "sy": 0, "sw": 260, "sh": 364}],
  skip: [{"col": 6, "row": 0, "sx": 1560, "sy": 0, "sw": 260, "sh": 364}, {"col": 7, "row": 0, "sx": 1820, "sy": 0, "sw": 260, "sh": 364}, {"col": 8, "row": 0, "sx": 2080, "sy": 0, "sw": 260, "sh": 364}, {"col": 9, "row": 0, "sx": 2340, "sy": 0, "sw": 260, "sh": 364}],
  shuffle: [{"col": 10, "row": 0, "sx": 2600, "sy": 0, "sw": 260, "sh": 364}, {"col": 11, "row": 0, "sx": 2860, "sy": 0, "sw": 260, "sh": 364}, {"col": 0, "row": 1, "sx": 0, "sy": 364, "sw": 260, "sh": 364}, {"col": 1, "row": 1, "sx": 260, "sy": 364, "sw": 260, "sh": 364}],
  defuse: [{"col": 2, "row": 1, "sx": 520, "sy": 364, "sw": 260, "sh": 364}, {"col": 3, "row": 1, "sx": 780, "sy": 364, "sw": 260, "sh": 364}, {"col": 4, "row": 1, "sx": 1040, "sy": 364, "sw": 260, "sh": 364}, {"col": 5, "row": 1, "sx": 1300, "sy": 364, "sw": 260, "sh": 364}, {"col": 6, "row": 1, "sx": 1560, "sy": 364, "sw": 260, "sh": 364}],
  see_future_3: [{"col": 7, "row": 1, "sx": 1820, "sy": 364, "sw": 260, "sh": 364}, {"col": 8, "row": 1, "sx": 2080, "sy": 364, "sw": 260, "sh": 364}, {"col": 9, "row": 1, "sx": 2340, "sy": 364, "sw": 260, "sh": 364}, {"col": 10, "row": 1, "sx": 2600, "sy": 364, "sw": 260, "sh": 364}, {"col": 11, "row": 1, "sx": 2860, "sy": 364, "sw": 260, "sh": 364}],
  nope: [{"col": 0, "row": 2, "sx": 0, "sy": 728, "sw": 260, "sh": 364}, {"col": 1, "row": 2, "sx": 260, "sy": 728, "sw": 260, "sh": 364}, {"col": 2, "row": 2, "sx": 520, "sy": 728, "sw": 260, "sh": 364}, {"col": 3, "row": 2, "sx": 780, "sy": 728, "sw": 260, "sh": 364}],
  favor: [{"col": 4, "row": 2, "sx": 1040, "sy": 728, "sw": 260, "sh": 364}, {"col": 5, "row": 2, "sx": 1300, "sy": 728, "sw": 260, "sh": 364}, {"col": 6, "row": 2, "sx": 1560, "sy": 728, "sw": 260, "sh": 364}, {"col": 7, "row": 2, "sx": 1820, "sy": 728, "sw": 260, "sh": 364}],
  attack: [{"col": 8, "row": 2, "sx": 2080, "sy": 728, "sw": 260, "sh": 364}, {"col": 9, "row": 2, "sx": 2340, "sy": 728, "sw": 260, "sh": 364}, {"col": 10, "row": 2, "sx": 2600, "sy": 728, "sw": 260, "sh": 364}, {"col": 11, "row": 2, "sx": 2860, "sy": 728, "sw": 260, "sh": 364}, {"col": 0, "row": 3, "sx": 0, "sy": 1092, "sw": 260, "sh": 364}],
  exploding_kitten: [{"col": 1, "row": 3, "sx": 260, "sy": 1092, "sw": 260, "sh": 364}, {"col": 2, "row": 3, "sx": 520, "sy": 1092, "sw": 260, "sh": 364}, {"col": 3, "row": 3, "sx": 780, "sy": 1092, "sw": 260, "sh": 364}, {"col": 4, "row": 3, "sx": 1040, "sy": 1092, "sw": 260, "sh": 364}, {"col": 5, "row": 3, "sx": 1300, "sy": 1092, "sw": 260, "sh": 364}],
  dig_deeper: [{"col": 6, "row": 3, "sx": 1560, "sy": 1092, "sw": 260, "sh": 364}, {"col": 7, "row": 3, "sx": 1820, "sy": 1092, "sw": 260, "sh": 364}, {"col": 8, "row": 3, "sx": 2080, "sy": 1092, "sw": 260, "sh": 364}, {"col": 9, "row": 3, "sx": 2340, "sy": 1092, "sw": 260, "sh": 364}],
  zombie_kitten: [{"col": 10, "row": 3, "sx": 2600, "sy": 1092, "sw": 260, "sh": 364}, {"col": 11, "row": 3, "sx": 2860, "sy": 1092, "sw": 260, "sh": 364}, {"col": 0, "row": 4, "sx": 0, "sy": 1456, "sw": 260, "sh": 364}, {"col": 1, "row": 4, "sx": 260, "sy": 1456, "sw": 260, "sh": 364}, {"col": 2, "row": 4, "sx": 520, "sy": 1456, "sw": 260, "sh": 364}],
  attack_of_the_dead: [{"col": 3, "row": 4, "sx": 780, "sy": 1456, "sw": 260, "sh": 364}, {"col": 4, "row": 4, "sx": 1040, "sy": 1456, "sw": 260, "sh": 364}, {"col": 5, "row": 4, "sx": 1300, "sy": 1456, "sw": 260, "sh": 364}],
  clairvoyance: [{"col": 6, "row": 4, "sx": 1560, "sy": 1456, "sw": 260, "sh": 364}, {"col": 7, "row": 4, "sx": 1820, "sy": 1456, "sw": 260, "sh": 364}],
  clone: [{"col": 8, "row": 4, "sx": 2080, "sy": 1456, "sw": 260, "sh": 364}, {"col": 9, "row": 4, "sx": 2340, "sy": 1456, "sw": 260, "sh": 364}, {"col": 10, "row": 4, "sx": 2600, "sy": 1456, "sw": 260, "sh": 364}],
  feed_the_dead: [{"col": 11, "row": 4, "sx": 2860, "sy": 1456, "sw": 260, "sh": 364}, {"col": 0, "row": 5, "sx": 0, "sy": 1820, "sw": 260, "sh": 364}],
  grave_robber: [{"col": 1, "row": 5, "sx": 260, "sy": 1820, "sw": 260, "sh": 364}],
  de_cat_ipated: [{"col": 2, "row": 5, "sx": 520, "sy": 1820, "sw": 260, "sh": 364}],
  vampire_cat: [{"col": 3, "row": 5, "sx": 780, "sy": 1820, "sw": 260, "sh": 364}],
  zombie_cat: [{"col": 4, "row": 5, "sx": 1040, "sy": 1820, "sw": 260, "sh": 364}],
  bury: [{"col": 5, "row": 5, "sx": 1300, "sy": 1820, "sw": 260, "sh": 364}, {"col": 6, "row": 5, "sx": 1560, "sy": 1820, "sw": 260, "sh": 364}],
  barking_kitten: [{"col": 7, "row": 5, "sx": 1820, "sy": 1820, "sw": 260, "sh": 364}, {"col": 8, "row": 5, "sx": 2080, "sy": 1820, "sw": 260, "sh": 364}],
  ill_take_that: [{"col": 9, "row": 5, "sx": 2340, "sy": 1820, "sw": 260, "sh": 364}, {"col": 10, "row": 5, "sx": 2600, "sy": 1820, "sw": 260, "sh": 364}, {"col": 11, "row": 5, "sx": 2860, "sy": 1820, "sw": 260, "sh": 364}, {"col": 0, "row": 6, "sx": 0, "sy": 2184, "sw": 260, "sh": 364}],
  potluck: [{"col": 1, "row": 6, "sx": 260, "sy": 2184, "sw": 260, "sh": 364}, {"col": 2, "row": 6, "sx": 520, "sy": 2184, "sw": 260, "sh": 364}],
  personal_attack: [{"col": 3, "row": 6, "sx": 780, "sy": 2184, "sw": 260, "sh": 364}, {"col": 4, "row": 6, "sx": 1040, "sy": 2184, "sw": 260, "sh": 364}, {"col": 5, "row": 6, "sx": 1300, "sy": 2184, "sw": 260, "sh": 364}, {"col": 6, "row": 6, "sx": 1560, "sy": 2184, "sw": 260, "sh": 364}],
  share_future_3: [{"col": 7, "row": 6, "sx": 1820, "sy": 2184, "sw": 260, "sh": 364}, {"col": 8, "row": 6, "sx": 2080, "sy": 2184, "sw": 260, "sh": 364}],
  tower_of_power: [{"col": 9, "row": 6, "sx": 2340, "sy": 2184, "sw": 260, "sh": 364}],
  streaking_kitten: [{"col": 10, "row": 6, "sx": 2600, "sy": 2184, "sw": 260, "sh": 364}],
  super_skip: [{"col": 11, "row": 6, "sx": 2860, "sy": 2184, "sw": 260, "sh": 364}],
  see_future_5: [{"col": 0, "row": 7, "sx": 0, "sy": 2548, "sw": 260, "sh": 364}],
  alter_future_5: [{"col": 1, "row": 7, "sx": 260, "sy": 2548, "sw": 260, "sh": 364}],
  swap_top_bottom: [{"col": 2, "row": 7, "sx": 520, "sy": 2548, "sw": 260, "sh": 364}],
  garbage_collection: [{"col": 3, "row": 7, "sx": 780, "sy": 2548, "sw": 260, "sh": 364}],
  catomic_bomb: [{"col": 4, "row": 7, "sx": 1040, "sy": 2548, "sw": 260, "sh": 364}],
  curse_cat_butt: [{"col": 5, "row": 7, "sx": 1300, "sy": 2548, "sw": 260, "sh": 364}, {"col": 6, "row": 7, "sx": 1560, "sy": 2548, "sw": 260, "sh": 364}],
  mark: [{"col": 7, "row": 7, "sx": 1820, "sy": 2548, "sw": 260, "sh": 364}],
  imploding_kitten: [{"col": 8, "row": 7, "sx": 2080, "sy": 2548, "sw": 260, "sh": 364}],
  feral_cat: [{"col": 9, "row": 7, "sx": 2340, "sy": 2548, "sw": 260, "sh": 364}],
  reverse: [{"col": 10, "row": 7, "sx": 2600, "sy": 2548, "sw": 260, "sh": 364}, {"col": 11, "row": 7, "sx": 2860, "sy": 2548, "sw": 260, "sh": 364}, {"col": 0, "row": 8, "sx": 0, "sy": 2912, "sw": 260, "sh": 364}, {"col": 1, "row": 8, "sx": 260, "sy": 2912, "sw": 260, "sh": 364}],
  draw_bottom: [{"col": 2, "row": 8, "sx": 520, "sy": 2912, "sw": 260, "sh": 364}],
  alter_future_3: [{"col": 3, "row": 8, "sx": 780, "sy": 2912, "sw": 260, "sh": 364}, {"col": 4, "row": 8, "sx": 1040, "sy": 2912, "sw": 260, "sh": 364}, {"col": 5, "row": 8, "sx": 1300, "sy": 2912, "sw": 260, "sh": 364}, {"col": 6, "row": 8, "sx": 1560, "sy": 2912, "sw": 260, "sh": 364}],
  targeted_attack: [{"col": 7, "row": 8, "sx": 1820, "sy": 2912, "sw": 260, "sh": 364}, {"col": 8, "row": 8, "sx": 2080, "sy": 2912, "sw": 260, "sh": 364}, {"col": 9, "row": 8, "sx": 2340, "sy": 2912, "sw": 260, "sh": 364}],
  armageddon: [{"col": 10, "row": 8, "sx": 2600, "sy": 2912, "sw": 260, "sh": 364}, {"col": 11, "row": 8, "sx": 2860, "sy": 2912, "sw": 260, "sh": 364}, {"col": 0, "row": 9, "sx": 0, "sy": 3276, "sw": 260, "sh": 364}],
  godcat: [{"col": 1, "row": 9, "sx": 260, "sy": 3276, "sw": 260, "sh": 364}],
  devilcat: [{"col": 2, "row": 9, "sx": 520, "sy": 3276, "sw": 260, "sh": 364}],
  raising_heck: [{"col": 3, "row": 9, "sx": 780, "sy": 3276, "sw": 260, "sh": 364}, {"col": 4, "row": 9, "sx": 1040, "sy": 3276, "sw": 260, "sh": 364}],
  reveal_future_3: [{"col": 5, "row": 9, "sx": 1300, "sy": 3276, "sw": 260, "sh": 364}, {"col": 6, "row": 9, "sx": 1560, "sy": 3276, "sw": 260, "sh": 364}, {"col": 7, "row": 9, "sx": 1820, "sy": 3276, "sw": 260, "sh": 364}],
  horse_cat: [{"col": 8, "row": 9, "sx": 2080, "sy": 3276, "sw": 260, "sh": 364}],
  knight_cat: [{"col": 9, "row": 9, "sx": 2340, "sy": 3276, "sw": 260, "sh": 364}],
  mercat: [{"col": 10, "row": 9, "sx": 2600, "sy": 3276, "sw": 260, "sh": 364}],
  troll_cat: [{"col": 11, "row": 9, "sx": 2860, "sy": 3276, "sw": 260, "sh": 364}],
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
    imageRendering: "pixelated" as const,
  };
}
