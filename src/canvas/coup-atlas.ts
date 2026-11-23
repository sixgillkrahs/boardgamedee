import type { CoupCharacter } from "@/cartridges/coup";

// 16-bit Pixel Art Sprite Atlas for all 6 Coup cards (Duke, Assassin, Contessa, Ambassador, Captain, Back)
// Native resolution: 120x176 crisp 16-bit pixel art per card (720x176 total atlas)
export const COUP_CARD_ATLAS_URL = "/sprites/coup-cards-pixel.png";
export const COUP_CARD_TILE_W = 120;
export const COUP_CARD_TILE_H = 176;

export type CoupCardSpriteKey = CoupCharacter | "back";

export interface CoupSpriteRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export const COUP_CARD_ATLAS_RECTS: Record<CoupCardSpriteKey, CoupSpriteRect> = {
  Duke: { sx: 0, sy: 0, sw: 120, sh: 176 },
  Assassin: { sx: 120, sy: 0, sw: 120, sh: 176 },
  Contessa: { sx: 240, sy: 0, sw: 120, sh: 176 },
  Ambassador: { sx: 360, sy: 0, sw: 120, sh: 176 },
  Captain: { sx: 480, sy: 0, sw: 120, sh: 176 },
  back: { sx: 600, sy: 0, sw: 120, sh: 176 },
};

let cachedCardImg: HTMLImageElement | null = null;
let cardAtlasLoaded = false;
const cardListeners = new Set<() => void>();

export function getCoupCardPixelAtlas(
  onLoad?: () => void
): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (cardAtlasLoaded && cachedCardImg) return cachedCardImg;
  if (onLoad) cardListeners.add(onLoad);
  if (!cachedCardImg) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      cardAtlasLoaded = true;
      cardListeners.forEach((fn) => fn());
      cardListeners.clear();
    };
    img.src = COUP_CARD_ATLAS_URL;
    cachedCardImg = img;
  }
  return cardAtlasLoaded ? cachedCardImg : null;
}

// High-detail 64x64 16-bit Pixel Art Official Octagonal '1 ISK' Metal Coin
export const COUP_COIN_SPRITE_URL = "/sprites/coup-coin-pixel.png";
export const COUP_COIN_SPRITE_SIZE = 64;

let cachedCoinImg: HTMLImageElement | null = null;
let coinLoaded = false;
const coinListeners = new Set<() => void>();

export function getCoupCoinPixelSprite(
  onLoad?: () => void
): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (coinLoaded && cachedCoinImg) return cachedCoinImg;
  if (onLoad) coinListeners.add(onLoad);
  if (!cachedCoinImg) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      coinLoaded = true;
      coinListeners.forEach((fn) => fn());
      coinListeners.clear();
    };
    img.src = COUP_COIN_SPRITE_URL;
    cachedCoinImg = img;
  }
  return coinLoaded ? cachedCoinImg : null;
}
