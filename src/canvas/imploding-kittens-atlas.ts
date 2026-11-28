// Auto-generated 2D Cel-Shaded Per-Pack Sprite Atlases for Imploding Kittens (Core + 5 Expansions)
// 6 lightweight WebP sheets (200x280 per card) for lazy per-pack loading & Lobby preloading
import type { IkCardType, IkExpansionId } from "@/cartridges/imploding-kittens";

export type IkAtlasPackId = "core" | IkExpansionId;

export interface IkAtlasPackMeta {
  url: string;
  cols: number;
  rows: number;
  tileW: number;
  tileH: number;
}

export const IK_ATLAS_PACK_META: Record<IkAtlasPackId, IkAtlasPackMeta> = {
  core: {"url": "/sprites/ik-atlas-core.webp", "cols": 8, "rows": 6, "tileW": 200, "tileH": 280},
  imploding: {"url": "/sprites/ik-atlas-imploding.webp", "cols": 5, "rows": 3, "tileW": 200, "tileH": 280},
  streaking: {"url": "/sprites/ik-atlas-streaking.webp", "cols": 5, "rows": 2, "tileW": 200, "tileH": 280},
  barking: {"url": "/sprites/ik-atlas-barking.webp", "cols": 5, "rows": 4, "tileW": 200, "tileH": 280},
  zombie: {"url": "/sprites/ik-atlas-zombie.webp", "cols": 6, "rows": 5, "tileW": 200, "tileH": 280},
  good_vs_evil: {"url": "/sprites/ik-atlas-good-vs-evil.webp", "cols": 5, "rows": 3, "tileW": 200, "tileH": 280},
  pokepri: {"url": "/sprites/ik-atlas-pokepri.webp", "cols": 4, "rows": 2, "tileW": 200, "tileH": 280},
};

export interface IkCardAtlasSlot {
  pack: IkAtlasPackId;
  col: number;
  row: number;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export const IK_CARD_BACK_SLOT: IkCardAtlasSlot = {"pack": "core", "col": 0, "row": 0, "sx": 0, "sy": 0, "sw": 200, "sh": 280};

export const IK_CARD_ATLAS_SLOTS: Record<IkCardType, IkCardAtlasSlot[]> = {
  tacocat: [{"pack": "core", "col": 1, "row": 0, "sx": 200, "sy": 0, "sw": 200, "sh": 280}],
  rainbow_cat: [{"pack": "core", "col": 2, "row": 0, "sx": 400, "sy": 0, "sw": 200, "sh": 280}],
  hairy_potato_cat: [{"pack": "core", "col": 3, "row": 0, "sx": 600, "sy": 0, "sw": 200, "sh": 280}],
  catermelon: [{"pack": "core", "col": 4, "row": 0, "sx": 800, "sy": 0, "sw": 200, "sh": 280}],
  beard_cat: [{"pack": "core", "col": 5, "row": 0, "sx": 1000, "sy": 0, "sw": 200, "sh": 280}],
  skip: [{"pack": "core", "col": 6, "row": 0, "sx": 1200, "sy": 0, "sw": 200, "sh": 280}, {"pack": "core", "col": 7, "row": 0, "sx": 1400, "sy": 0, "sw": 200, "sh": 280}, {"pack": "core", "col": 0, "row": 1, "sx": 0, "sy": 280, "sw": 200, "sh": 280}, {"pack": "core", "col": 1, "row": 1, "sx": 200, "sy": 280, "sw": 200, "sh": 280}],
  shuffle: [{"pack": "core", "col": 2, "row": 1, "sx": 400, "sy": 280, "sw": 200, "sh": 280}, {"pack": "core", "col": 3, "row": 1, "sx": 600, "sy": 280, "sw": 200, "sh": 280}, {"pack": "core", "col": 4, "row": 1, "sx": 800, "sy": 280, "sw": 200, "sh": 280}, {"pack": "core", "col": 5, "row": 1, "sx": 1000, "sy": 280, "sw": 200, "sh": 280}],
  defuse: [{"pack": "core", "col": 6, "row": 1, "sx": 1200, "sy": 280, "sw": 200, "sh": 280}, {"pack": "core", "col": 7, "row": 1, "sx": 1400, "sy": 280, "sw": 200, "sh": 280}, {"pack": "core", "col": 0, "row": 2, "sx": 0, "sy": 560, "sw": 200, "sh": 280}, {"pack": "core", "col": 1, "row": 2, "sx": 200, "sy": 560, "sw": 200, "sh": 280}, {"pack": "core", "col": 2, "row": 2, "sx": 400, "sy": 560, "sw": 200, "sh": 280}],
  see_future_3: [{"pack": "core", "col": 3, "row": 2, "sx": 600, "sy": 560, "sw": 200, "sh": 280}, {"pack": "core", "col": 4, "row": 2, "sx": 800, "sy": 560, "sw": 200, "sh": 280}, {"pack": "core", "col": 5, "row": 2, "sx": 1000, "sy": 560, "sw": 200, "sh": 280}, {"pack": "core", "col": 6, "row": 2, "sx": 1200, "sy": 560, "sw": 200, "sh": 280}, {"pack": "core", "col": 7, "row": 2, "sx": 1400, "sy": 560, "sw": 200, "sh": 280}],
  nope: [{"pack": "core", "col": 0, "row": 3, "sx": 0, "sy": 840, "sw": 200, "sh": 280}, {"pack": "core", "col": 1, "row": 3, "sx": 200, "sy": 840, "sw": 200, "sh": 280}, {"pack": "core", "col": 2, "row": 3, "sx": 400, "sy": 840, "sw": 200, "sh": 280}, {"pack": "core", "col": 3, "row": 3, "sx": 600, "sy": 840, "sw": 200, "sh": 280}],
  favor: [{"pack": "core", "col": 4, "row": 3, "sx": 800, "sy": 840, "sw": 200, "sh": 280}, {"pack": "core", "col": 5, "row": 3, "sx": 1000, "sy": 840, "sw": 200, "sh": 280}, {"pack": "core", "col": 6, "row": 3, "sx": 1200, "sy": 840, "sw": 200, "sh": 280}, {"pack": "core", "col": 7, "row": 3, "sx": 1400, "sy": 840, "sw": 200, "sh": 280}],
  attack: [{"pack": "core", "col": 0, "row": 4, "sx": 0, "sy": 1120, "sw": 200, "sh": 280}, {"pack": "core", "col": 1, "row": 4, "sx": 200, "sy": 1120, "sw": 200, "sh": 280}, {"pack": "core", "col": 2, "row": 4, "sx": 400, "sy": 1120, "sw": 200, "sh": 280}, {"pack": "core", "col": 3, "row": 4, "sx": 600, "sy": 1120, "sw": 200, "sh": 280}, {"pack": "core", "col": 4, "row": 4, "sx": 800, "sy": 1120, "sw": 200, "sh": 280}],
  exploding_kitten: [{"pack": "core", "col": 5, "row": 4, "sx": 1000, "sy": 1120, "sw": 200, "sh": 280}, {"pack": "core", "col": 6, "row": 4, "sx": 1200, "sy": 1120, "sw": 200, "sh": 280}, {"pack": "core", "col": 7, "row": 4, "sx": 1400, "sy": 1120, "sw": 200, "sh": 280}, {"pack": "core", "col": 0, "row": 5, "sx": 0, "sy": 1400, "sw": 200, "sh": 280}, {"pack": "core", "col": 1, "row": 5, "sx": 200, "sy": 1400, "sw": 200, "sh": 280}],
  dig_deeper: [{"pack": "zombie", "col": 0, "row": 0, "sx": 0, "sy": 0, "sw": 200, "sh": 280}, {"pack": "zombie", "col": 1, "row": 0, "sx": 200, "sy": 0, "sw": 200, "sh": 280}, {"pack": "zombie", "col": 2, "row": 0, "sx": 400, "sy": 0, "sw": 200, "sh": 280}, {"pack": "zombie", "col": 3, "row": 0, "sx": 600, "sy": 0, "sw": 200, "sh": 280}],
  zombie_kitten: [{"pack": "zombie", "col": 4, "row": 0, "sx": 800, "sy": 0, "sw": 200, "sh": 280}, {"pack": "zombie", "col": 5, "row": 0, "sx": 1000, "sy": 0, "sw": 200, "sh": 280}, {"pack": "zombie", "col": 0, "row": 1, "sx": 0, "sy": 280, "sw": 200, "sh": 280}, {"pack": "zombie", "col": 1, "row": 1, "sx": 200, "sy": 280, "sw": 200, "sh": 280}, {"pack": "zombie", "col": 2, "row": 1, "sx": 400, "sy": 280, "sw": 200, "sh": 280}],
  attack_of_the_dead: [{"pack": "zombie", "col": 3, "row": 1, "sx": 600, "sy": 280, "sw": 200, "sh": 280}, {"pack": "zombie", "col": 4, "row": 1, "sx": 800, "sy": 280, "sw": 200, "sh": 280}, {"pack": "zombie", "col": 5, "row": 1, "sx": 1000, "sy": 280, "sw": 200, "sh": 280}],
  clairvoyance: [{"pack": "zombie", "col": 0, "row": 2, "sx": 0, "sy": 560, "sw": 200, "sh": 280}, {"pack": "zombie", "col": 1, "row": 2, "sx": 200, "sy": 560, "sw": 200, "sh": 280}],
  clone: [{"pack": "zombie", "col": 2, "row": 2, "sx": 400, "sy": 560, "sw": 200, "sh": 280}, {"pack": "zombie", "col": 3, "row": 2, "sx": 600, "sy": 560, "sw": 200, "sh": 280}, {"pack": "zombie", "col": 4, "row": 2, "sx": 800, "sy": 560, "sw": 200, "sh": 280}],
  feed_the_dead: [{"pack": "zombie", "col": 5, "row": 2, "sx": 1000, "sy": 560, "sw": 200, "sh": 280}, {"pack": "zombie", "col": 0, "row": 3, "sx": 0, "sy": 840, "sw": 200, "sh": 280}],
  grave_robber: [{"pack": "zombie", "col": 1, "row": 3, "sx": 200, "sy": 840, "sw": 200, "sh": 280}],
  de_cat_ipated: [{"pack": "zombie", "col": 2, "row": 3, "sx": 400, "sy": 840, "sw": 200, "sh": 280}],
  vampire_cat: [{"pack": "zombie", "col": 3, "row": 3, "sx": 600, "sy": 840, "sw": 200, "sh": 280}],
  zombie_cat: [{"pack": "zombie", "col": 4, "row": 3, "sx": 800, "sy": 840, "sw": 200, "sh": 280}],
  shuffle_now: [{"pack": "zombie", "col": 5, "row": 3, "sx": 1000, "sy": 840, "sw": 200, "sh": 280}, {"pack": "zombie", "col": 0, "row": 4, "sx": 0, "sy": 1120, "sw": 200, "sh": 280}],
  bury: [{"pack": "barking", "col": 0, "row": 0, "sx": 0, "sy": 0, "sw": 200, "sh": 280}, {"pack": "barking", "col": 1, "row": 0, "sx": 200, "sy": 0, "sw": 200, "sh": 280}],
  barking_kitten: [{"pack": "barking", "col": 2, "row": 0, "sx": 400, "sy": 0, "sw": 200, "sh": 280}, {"pack": "barking", "col": 3, "row": 0, "sx": 600, "sy": 0, "sw": 200, "sh": 280}],
  ill_take_that: [{"pack": "barking", "col": 4, "row": 0, "sx": 800, "sy": 0, "sw": 200, "sh": 280}, {"pack": "barking", "col": 0, "row": 1, "sx": 0, "sy": 280, "sw": 200, "sh": 280}, {"pack": "barking", "col": 1, "row": 1, "sx": 200, "sy": 280, "sw": 200, "sh": 280}, {"pack": "barking", "col": 2, "row": 1, "sx": 400, "sy": 280, "sw": 200, "sh": 280}],
  potluck: [{"pack": "barking", "col": 3, "row": 1, "sx": 600, "sy": 280, "sw": 200, "sh": 280}, {"pack": "barking", "col": 4, "row": 1, "sx": 800, "sy": 280, "sw": 200, "sh": 280}],
  personal_attack: [{"pack": "barking", "col": 0, "row": 2, "sx": 0, "sy": 560, "sw": 200, "sh": 280}, {"pack": "barking", "col": 1, "row": 2, "sx": 200, "sy": 560, "sw": 200, "sh": 280}, {"pack": "barking", "col": 2, "row": 2, "sx": 400, "sy": 560, "sw": 200, "sh": 280}, {"pack": "barking", "col": 3, "row": 2, "sx": 600, "sy": 560, "sw": 200, "sh": 280}],
  share_future_3: [{"pack": "barking", "col": 4, "row": 2, "sx": 800, "sy": 560, "sw": 200, "sh": 280}, {"pack": "barking", "col": 0, "row": 3, "sx": 0, "sy": 840, "sw": 200, "sh": 280}],
  tower_of_power: [{"pack": "barking", "col": 1, "row": 3, "sx": 200, "sy": 840, "sw": 200, "sh": 280}],
  streaking_kitten: [{"pack": "streaking", "col": 0, "row": 0, "sx": 0, "sy": 0, "sw": 200, "sh": 280}],
  super_skip: [{"pack": "streaking", "col": 1, "row": 0, "sx": 200, "sy": 0, "sw": 200, "sh": 280}],
  see_future_5: [{"pack": "streaking", "col": 2, "row": 0, "sx": 400, "sy": 0, "sw": 200, "sh": 280}],
  alter_future_5: [{"pack": "streaking", "col": 3, "row": 0, "sx": 600, "sy": 0, "sw": 200, "sh": 280}],
  swap_top_bottom: [{"pack": "streaking", "col": 4, "row": 0, "sx": 800, "sy": 0, "sw": 200, "sh": 280}],
  garbage_collection: [{"pack": "streaking", "col": 0, "row": 1, "sx": 0, "sy": 280, "sw": 200, "sh": 280}],
  catomic_bomb: [{"pack": "streaking", "col": 1, "row": 1, "sx": 200, "sy": 280, "sw": 200, "sh": 280}],
  curse_cat_butt: [{"pack": "streaking", "col": 2, "row": 1, "sx": 400, "sy": 280, "sw": 200, "sh": 280}, {"pack": "streaking", "col": 3, "row": 1, "sx": 600, "sy": 280, "sw": 200, "sh": 280}],
  mark: [{"pack": "streaking", "col": 4, "row": 1, "sx": 800, "sy": 280, "sw": 200, "sh": 280}],
  imploding_kitten: [{"pack": "imploding", "col": 0, "row": 0, "sx": 0, "sy": 0, "sw": 200, "sh": 280}],
  feral_cat: [{"pack": "imploding", "col": 1, "row": 0, "sx": 200, "sy": 0, "sw": 200, "sh": 280}],
  reverse: [{"pack": "imploding", "col": 2, "row": 0, "sx": 400, "sy": 0, "sw": 200, "sh": 280}, {"pack": "imploding", "col": 3, "row": 0, "sx": 600, "sy": 0, "sw": 200, "sh": 280}, {"pack": "imploding", "col": 4, "row": 0, "sx": 800, "sy": 0, "sw": 200, "sh": 280}, {"pack": "imploding", "col": 0, "row": 1, "sx": 0, "sy": 280, "sw": 200, "sh": 280}],
  draw_bottom: [{"pack": "imploding", "col": 1, "row": 1, "sx": 200, "sy": 280, "sw": 200, "sh": 280}],
  alter_future_3: [{"pack": "imploding", "col": 2, "row": 1, "sx": 400, "sy": 280, "sw": 200, "sh": 280}, {"pack": "imploding", "col": 3, "row": 1, "sx": 600, "sy": 280, "sw": 200, "sh": 280}, {"pack": "imploding", "col": 4, "row": 1, "sx": 800, "sy": 280, "sw": 200, "sh": 280}, {"pack": "imploding", "col": 0, "row": 2, "sx": 0, "sy": 560, "sw": 200, "sh": 280}],
  targeted_attack: [{"pack": "imploding", "col": 1, "row": 2, "sx": 200, "sy": 560, "sw": 200, "sh": 280}, {"pack": "imploding", "col": 2, "row": 2, "sx": 400, "sy": 560, "sw": 200, "sh": 280}, {"pack": "imploding", "col": 3, "row": 2, "sx": 600, "sy": 560, "sw": 200, "sh": 280}],
  armageddon: [{"pack": "good_vs_evil", "col": 0, "row": 0, "sx": 0, "sy": 0, "sw": 200, "sh": 280}, {"pack": "good_vs_evil", "col": 1, "row": 0, "sx": 200, "sy": 0, "sw": 200, "sh": 280}, {"pack": "good_vs_evil", "col": 2, "row": 0, "sx": 400, "sy": 0, "sw": 200, "sh": 280}],
  godcat: [{"pack": "good_vs_evil", "col": 3, "row": 0, "sx": 600, "sy": 0, "sw": 200, "sh": 280}],
  devilcat: [{"pack": "good_vs_evil", "col": 4, "row": 0, "sx": 800, "sy": 0, "sw": 200, "sh": 280}],
  raising_heck: [{"pack": "good_vs_evil", "col": 0, "row": 1, "sx": 0, "sy": 280, "sw": 200, "sh": 280}, {"pack": "good_vs_evil", "col": 1, "row": 1, "sx": 200, "sy": 280, "sw": 200, "sh": 280}],
  reveal_future_3: [{"pack": "good_vs_evil", "col": 2, "row": 1, "sx": 400, "sy": 280, "sw": 200, "sh": 280}, {"pack": "good_vs_evil", "col": 3, "row": 1, "sx": 600, "sy": 280, "sw": 200, "sh": 280}, {"pack": "good_vs_evil", "col": 4, "row": 1, "sx": 800, "sy": 280, "sw": 200, "sh": 280}],
  horse_cat: [{"pack": "good_vs_evil", "col": 0, "row": 2, "sx": 0, "sy": 560, "sw": 200, "sh": 280}],
  knight_cat: [{"pack": "good_vs_evil", "col": 1, "row": 2, "sx": 200, "sy": 560, "sw": 200, "sh": 280}],
  mercat: [{"pack": "good_vs_evil", "col": 2, "row": 2, "sx": 400, "sy": 560, "sw": 200, "sh": 280}],
  troll_cat: [{"pack": "good_vs_evil", "col": 3, "row": 2, "sx": 600, "sy": 560, "sw": 200, "sh": 280}],
  super_nope: [{"pack": "pokepri", "col": 0, "row": 0, "sx": 0, "sy": 0, "sw": 200, "sh": 280}],
  black_hole: [{"pack": "pokepri", "col": 1, "row": 0, "sx": 200, "sy": 0, "sw": 200, "sh": 280}],
  back_from_the_dead: [{"pack": "pokepri", "col": 2, "row": 0, "sx": 400, "sy": 0, "sw": 200, "sh": 280}],
  copycat: [{"pack": "pokepri", "col": 3, "row": 0, "sx": 600, "sy": 0, "sw": 200, "sh": 280}],
  fossil_restoration: [{"pack": "pokepri", "col": 0, "row": 1, "sx": 0, "sy": 280, "sw": 200, "sh": 280}],
  purrfect_boost: [{"pack": "pokepri", "col": 1, "row": 1, "sx": 200, "sy": 280, "sw": 200, "sh": 280}],
  last_resort: [{"pack": "pokepri", "col": 2, "row": 1, "sx": 400, "sy": 280, "sw": 200, "sh": 280}],
  sneak_peek: [{"pack": "pokepri", "col": 3, "row": 1, "sx": 600, "sy": 280, "sw": 200, "sh": 280}],
};

const cachedPackImgs = new Map<IkAtlasPackId, HTMLImageElement>();
const loadedPacks = new Set<IkAtlasPackId>();

export function getIkCardAtlasImageForPack(
  pack: IkAtlasPackId
): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (loadedPacks.has(pack)) {
    return cachedPackImgs.get(pack) ?? null;
  }
  if (!cachedPackImgs.has(pack)) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      loadedPacks.add(pack);
    };
    img.src = IK_ATLAS_PACK_META[pack].url;
    cachedPackImgs.set(pack, img);
  }
  return null;
}

/**
 * Preloads Core + all enabled expansion pack atlases in parallel (call while waiting in Lobby!).
 */
export function preloadIkCardAtlases(
  expansions?: Partial<Record<IkExpansionId, boolean>>
): void {
  if (typeof window === "undefined") return;
  getIkCardAtlasImageForPack("core");
  const expansionIds: IkExpansionId[] = ["imploding", "streaking", "barking", "zombie", "good_vs_evil", "pokepri"];
  for (const expId of expansionIds) {
    if (expansions ? expansions[expId] !== false : true) {
      getIkCardAtlasImageForPack(expId);
    }
  }
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
  const meta = IK_ATLAS_PACK_META[slot.pack];
  const xPct = meta.cols > 1 ? (slot.col / (meta.cols - 1)) * 100 : 0;
  const yPct = meta.rows > 1 ? (slot.row / (meta.rows - 1)) * 100 : 0;
  return {
    backgroundImage: `url(${meta.url})`,
    backgroundSize: `${meta.cols * 100}% ${meta.rows * 100}%`,
    backgroundPosition: `${xPct}% ${yPct}%`,
    backgroundRepeat: "no-repeat" as const,
  };
}
