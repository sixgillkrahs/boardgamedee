import { drawRoundedRect, getCanvasFontFamilies } from "@/canvas/engine";
import {
  KOT_BUZZ_TILE_DEFS,
  KOT_MONSTERS,
  KOT_WIN_TRACK_POS,
  type KotBuzzKind,
  type KotBuzzTileId,
  type KotDieFace,
  type KotMonsterId,
  type KotPlacedBuzzTile,
  type KotTrackType,
} from "@/cartridges/king-of-tokyo-duel";

export const KOT_MONSTER_ATLAS_URL = "/sprites/kot-duel-monsters-pixel.png";
export const KOT_BOARD_ATLAS_URL = "/sprites/kot-duel-boards-pixel.png";
export const KOT_GAME_BOARD_URL = "/sprites/kot-duel-board-map-pixel.png";
export const KOT_TOKENS_ATLAS_URL = "/sprites/kot-duel-tokens-pixel.png";
export const KOT_ICONS_ATLAS_URL = "/sprites/kot-duel-icons-pixel.png";
export const KOT_POWER_CARDS_ATLAS_URL = "/sprites/kot-duel-power-cards-vi.webp";
export const KOT_CARD_BACK_URL = "/sprites/kot-duel-card-back-pixel.png";
export const KOT_HP_DIALS_ATLAS_URL = "/sprites/kot-duel-hp-dials-pixel.png";
export const KOT_ENERGY_CUBE_URL = "/sprites/kot-duel-energy-cube-pixel.png";
export const KOT_BUZZ_MEDALS_URL = "/sprites/kot-duel-buzz-medallions-pixel.png";
export const KOT_BUZZ_TILES_URL = "/sprites/kot-duel-buzz-tiles-pixel.png";
export const KOT_LOBBY_BG_URL = "/sprites/kot-duel-lobby-bg.webp";
export const KOT_DICE_ATLAS_URL = "/sprites/kot-duel-dice-pixel.png";

/** Grid coordinates (col 0..9, row 0..4, each 200x280 exact 5:7 Vietnamese localized card) in kot-duel-power-cards-vi.webp. */
export const KOT_POWER_CARD_COORDS: Record<string, { col: number; row: number }> = {
  "kot-titan-claws": { col: 0, row: 0 }, // #0 Acid Attack
  "kot-vamp": { col: 3, row: 0 },        // #3 Antimatter Pellets
  "kot-armor": { col: 4, row: 0 },       // #4 Armor Plating
  "kot-idol": { col: 5, row: 0 },        // #5 Breaking News
  "kot-extra-die": { col: 1, row: 1 },   // #11 Extra Head
  "kot-reactor": { col: 2, row: 1 },     // #12 Eye of the Storm
  "kot-jetpack": { col: 5, row: 1 },     // #15 Giant Brain
  "kot-meltdown": { col: 0, row: 2 },    // #20 Jets Scrambled
  "kot-shockwave": { col: 1, row: 2 },   // #21 Kaijutsu
  "kot-discount": { col: 3, row: 2 },    // #23 Made in a Lab
  "kot-overcharge": { col: 4, row: 2 },  // #24 Moment of Respite
  "kot-dual-strike": { col: 6, row: 2 }, // #26 Monumental
  "kot-media-storm": { col: 9, row: 2 }, // #29 Photoshoot
  "kot-regen": { col: 1, row: 3 },       // #31 Regeneration
  "kot-quake": { col: 4, row: 3 },       // #34 Seismic Test
  "kot-nuke-heal": { col: 6, row: 3 },   // #36 Snack Time
  "kot-siege": { col: 7, row: 3 },       // #37 Spiked Tail
  "kot-live-tv": { col: 1, row: 4 },     // #41 Thermonuclear Cooking
  "kot-beam": { col: 4, row: 4 },        // #44 Too Cute
  "kot-alien-metab": { col: 2, row: 0 }, // #2 Alien Metabolism (Anubis Buzz)
  "kot-elec-aura": { col: 9, row: 0 },   // #9 Electrical Aura (Cat Zap Buzz)
  "kot-party-over": { col: 0, row: 4 },  // #40 The Party's Over! (Cat Pink Buzz)
};

export type KotIconName =
  | "heart"
  | "energy"
  | "dice"
  | "star"
  | "building"
  | "burst"
  | "skull"
  | "claw";

export const KOT_ICON_RECTS: Record<
  KotIconName,
  { sx: number; sy: number; sw: number; sh: number }
> = {
  heart: { sx: 0, sy: 0, sw: 64, sh: 64 },
  energy: { sx: 64, sy: 0, sw: 64, sh: 64 },
  dice: { sx: 128, sy: 0, sw: 64, sh: 64 },
  star: { sx: 192, sy: 0, sw: 64, sh: 64 },
  building: { sx: 256, sy: 0, sw: 64, sh: 64 },
  burst: { sx: 320, sy: 0, sw: 64, sh: 64 },
  skull: { sx: 384, sy: 0, sw: 64, sh: 64 },
  claw: { sx: 448, sy: 0, sw: 64, sh: 64 },
};

export const KOT_BOARD_RECTS: Record<
  KotMonsterId,
  { sx: number; sy: number; sw: number; sh: number }
> = {
  gigazaur: { sx: 0, sy: 0, sw: 440, sh: 336 },
  cyber_kitty: { sx: 440, sy: 0, sw: 440, sh: 336 },
  the_king: { sx: 880, sy: 0, sw: 440, sh: 336 },
  space_penguin: { sx: 1320, sy: 0, sw: 440, sh: 336 },
  meka_dragon: { sx: 1760, sy: 0, sw: 440, sh: 336 },
  alienoid: { sx: 2200, sy: 0, sw: 440, sh: 336 },
};

/** Monsters whose board slot contains the 100% untouched original official card (including HP badge & nameplate). */
export const OFFICIAL_FULL_BOARD_MONSTERS = new Set<KotMonsterId>([
  "gigazaur",
  "cyber_kitty",
  "the_king",
  "space_penguin",
  "meka_dragon",
  "alienoid",
]);

export const KOT_MONSTER_RECTS: Record<
  KotMonsterId,
  { sx: number; sy: number; sw: number; sh: number }
> = {
  gigazaur: { sx: 0, sy: 0, sw: 128, sh: 128 },
  cyber_kitty: { sx: 128, sy: 0, sw: 128, sh: 128 },
  the_king: { sx: 256, sy: 0, sw: 128, sh: 128 },
  space_penguin: { sx: 384, sy: 0, sw: 128, sh: 128 },
  meka_dragon: { sx: 512, sy: 0, sw: 128, sh: 128 },
  alienoid: { sx: 640, sy: 0, sw: 128, sh: 128 },
};

export const KOT_DICE_RECTS: Record<
  KotDieFace,
  { sx: number; sy: number; sw: number; sh: number }
> = {
  claw: { sx: 0, sy: 0, sw: 64, sh: 64 },
  heal: { sx: 64, sy: 0, sw: 64, sh: 64 },
  energy: { sx: 128, sy: 0, sw: 64, sh: 64 },
  star: { sx: 192, sy: 0, sw: 64, sh: 64 },
  building: { sx: 256, sy: 0, sw: 64, sh: 64 },
  special: { sx: 320, sy: 0, sw: 64, sh: 64 },
};

let cachedMonsterImg: HTMLImageElement | null = null;
let monsterLoaded = false;
const monsterListeners = new Set<() => void>();

export function getKotMonsterAtlas(onLoad?: () => void): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (monsterLoaded && cachedMonsterImg) return cachedMonsterImg;
  if (onLoad) monsterListeners.add(onLoad);
  if (!cachedMonsterImg) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      monsterLoaded = true;
      monsterListeners.forEach((fn) => fn());
      monsterListeners.clear();
    };
    img.src = KOT_MONSTER_ATLAS_URL;
    cachedMonsterImg = img;
  }
  return monsterLoaded ? cachedMonsterImg : null;
}

let cachedBoardImg: HTMLImageElement | null = null;
let boardLoaded = false;
const boardListeners = new Set<() => void>();

export function getKotBoardAtlas(onLoad?: () => void): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (boardLoaded && cachedBoardImg) return cachedBoardImg;
  if (onLoad) boardListeners.add(onLoad);
  if (!cachedBoardImg) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      boardLoaded = true;
      boardListeners.forEach((fn) => fn());
      boardListeners.clear();
    };
    img.src = KOT_BOARD_ATLAS_URL;
    cachedBoardImg = img;
  }
  return boardLoaded ? cachedBoardImg : null;
}

let cachedGameBoardImg: HTMLImageElement | null = null;
let gameBoardLoaded = false;
const gameBoardListeners = new Set<() => void>();

export function getKotGameBoardImage(onLoad?: () => void): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (gameBoardLoaded && cachedGameBoardImg) return cachedGameBoardImg;
  if (onLoad) gameBoardListeners.add(onLoad);
  if (!cachedGameBoardImg) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      gameBoardLoaded = true;
      gameBoardListeners.forEach((fn) => fn());
      gameBoardListeners.clear();
    };
    img.src = KOT_GAME_BOARD_URL;
    cachedGameBoardImg = img;
  }
  return gameBoardLoaded ? cachedGameBoardImg : null;
}

let cachedTokensImg: HTMLImageElement | null = null;
let tokensLoaded = false;
const tokensListeners = new Set<() => void>();

export function getKotTokensAtlas(onLoad?: () => void): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (tokensLoaded && cachedTokensImg) return cachedTokensImg;
  if (onLoad) tokensListeners.add(onLoad);
  if (!cachedTokensImg) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      tokensLoaded = true;
      tokensListeners.forEach((fn) => fn());
      tokensListeners.clear();
    };
    img.src = KOT_TOKENS_ATLAS_URL;
    cachedTokensImg = img;
  }
  return tokensLoaded ? cachedTokensImg : null;
}

let cachedIconsImg: HTMLImageElement | null = null;
let iconsLoaded = false;
const iconsListeners = new Set<() => void>();

export function getKotIconsAtlas(onLoad?: () => void): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (iconsLoaded && cachedIconsImg) return cachedIconsImg;
  if (onLoad) iconsListeners.add(onLoad);
  if (!cachedIconsImg) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      iconsLoaded = true;
      iconsListeners.forEach((fn) => fn());
      iconsListeners.clear();
    };
    img.src = KOT_ICONS_ATLAS_URL;
    cachedIconsImg = img;
  }
  return iconsLoaded ? cachedIconsImg : null;
}

/**
 * Draws one of the 8 official 16-bit King of Tokyo: Duel icons centered at `(cx, cy)`.
 */
export function drawKotIcon2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  icon: KotIconName
) {
  const atlas = getKotIconsAtlas();
  if (!atlas) return;
  const r = KOT_ICON_RECTS[icon];
  ctx.save();
  ctx.imageSmoothingEnabled = size < 24;
  if (ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    atlas,
    r.sx,
    r.sy,
    r.sw,
    r.sh,
    Math.round(cx - size / 2),
    Math.round(cy - size / 2),
    size,
    size
  );
  ctx.restore();
}

type KotRichInlineToken =
  | "special_die"
  | "star"
  | "building"
  | "energy"
  | "heart"
  | "claw"
  | "dice";

const KOT_INLINE_SYMBOL_RE = /(\[!\]|⭐|🏢|⚡|❤️|♥|🐾|🎲)/g;

function mapInlineToken(raw: string): KotRichInlineToken | null {
  switch (raw) {
    case "[!]":
      return "special_die";
    case "⭐":
      return "star";
    case "🏢":
      return "building";
    case "⚡":
      return "energy";
    case "❤️":
    case "♥":
      return "heart";
    case "🐾":
      return "claw";
    case "🎲":
      return "dice";
    default:
      return null;
  }
}

/**
 * Draws wrapped Vietnamese Kaiju power/card text with crisp inline 16-bit official icons
 * (Red `[!]` Special Die sprite, Fame Star, Destruction Building, Energy Bolt, Heart, Claw, Bonus Die)
 * instead of raw `[!]` text or plain Unicode emojis!
 */
export function drawKotRichText2D(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  opts: {
    font: string;
    color: string;
    lineHeight: number;
    iconSize: number;
    maxLines?: number;
  }
) {
  ctx.save();
  ctx.font = opts.font;
  ctx.fillStyle = opts.color;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  type Segment =
    | { kind: "text"; text: string; w: number }
    | { kind: "icon"; token: KotRichInlineToken; w: number };

  const spaceW = ctx.measureText(" ").width;
  const iconAdvance = opts.iconSize + 2;

  const parseWord = (word: string): { segs: Segment[]; width: number } => {
    const parts = word.split(KOT_INLINE_SYMBOL_RE).filter(Boolean);
    const segs: Segment[] = [];
    let width = 0;
    for (const part of parts) {
      const tok = mapInlineToken(part);
      if (tok) {
        segs.push({ kind: "icon", token: tok, w: iconAdvance });
        width += iconAdvance;
      } else {
        const w = ctx.measureText(part).width;
        segs.push({ kind: "text", text: part, w });
        width += w;
      }
    }
    return { segs, width };
  };

  const words = text.trim().split(/\s+/).filter(Boolean).map(parseWord);
  const lines: Array<Array<{ segs: Segment[]; width: number }>> = [];
  let curLine: Array<{ segs: Segment[]; width: number }> = [];
  let curW = 0;

  for (const w of words) {
    const added = curLine.length === 0 ? w.width : spaceW + w.width;
    if (curLine.length > 0 && curW + added > maxWidth) {
      lines.push(curLine);
      curLine = [w];
      curW = w.width;
    } else {
      curLine.push(w);
      curW += added;
    }
  }
  if (curLine.length > 0) lines.push(curLine);

  const visibleLines =
    opts.maxLines !== undefined ? lines.slice(0, opts.maxLines) : lines;
  const diceAtlas = getKotDiceAtlas();

  visibleLines.forEach((lineWords, li) => {
    const cy = y + li * opts.lineHeight;
    let cx = x;
    lineWords.forEach((w, wi) => {
      if (wi > 0) cx += spaceW;
      for (const seg of w.segs) {
        if (seg.kind === "text") {
          ctx.fillStyle = opts.color;
          ctx.fillText(seg.text, cx, cy);
        } else if (seg.token === "special_die") {
          const sz = opts.iconSize;
          const ix = Math.round(cx + 1);
          const iy = Math.round(cy - sz / 2);
          if (diceAtlas) {
            const r = KOT_DICE_RECTS.special;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(diceAtlas, r.sx, 64, r.sw, r.sh, ix, iy, sz, sz);
          } else {
            drawRoundedRect(ctx, ix, iy, sz, sz, 3);
            ctx.fillStyle = "#e2505a";
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.fillText("!", ix + sz / 2, cy);
            ctx.textAlign = "left";
          }
        } else {
          drawKotIcon2D(
            ctx,
            cx + seg.w / 2,
            cy,
            opts.iconSize,
            seg.token
          );
        }
        cx += seg.w;
      }
    });
  });

  ctx.restore();
}

let cachedPowerCardsImg: HTMLImageElement | null = null;
let powerCardsLoaded = false;
const powerCardsListeners = new Set<() => void>();

export function getKotPowerCardsAtlas(
  onLoad?: () => void
): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (powerCardsLoaded && cachedPowerCardsImg) return cachedPowerCardsImg;
  if (onLoad) powerCardsListeners.add(onLoad);
  if (!cachedPowerCardsImg) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      powerCardsLoaded = true;
      powerCardsListeners.forEach((fn) => fn());
      powerCardsListeners.clear();
    };
    img.src = KOT_POWER_CARDS_ATLAS_URL;
    cachedPowerCardsImg = img;
  }
  return powerCardsLoaded ? cachedPowerCardsImg : null;
}

/**
 * Draws the official full-color illustrated Power Card artwork for `cardId` at `(x, y, w, h)`
 * with vintage comic frame and optional live effective cost badge cleanly covering the top-left corner!
 */
export function drawKotPowerCardArt2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cardId: string,
  opts: {
    effCost?: number;
    highlighted?: boolean;
    radius?: number;
  } = {}
) {
  ctx.save();
  const r = opts.radius ?? Math.max(6, Math.round(Math.min(w, h) * 0.1));
  const coord = KOT_POWER_CARD_COORDS[cardId] ?? { col: 0, row: 0 };

  drawRoundedRect(ctx, x, y, w, h, r);
  ctx.save();
  ctx.clip();

  const atlas = getKotPowerCardsAtlas();
  if (atlas) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      atlas,
      coord.col * 200,
      coord.row * 280,
      200,
      280,
      x,
      y,
      w,
      h
    );
  } else {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x, y, w, h);
  }

  // Optional cost badge override (only drawn when caller passes effCost to reflect live game price/discounts)
  if (opts.effCost !== undefined) {
    const bw = Math.max(24, Math.min(46, Math.round(w * 0.28)));
    const bh = Math.max(16, Math.min(28, Math.round(h * 0.13)));
    drawRoundedRect(ctx, x - 2, y - 2, bw + 2, bh + 2, 7);
    ctx.fillStyle = "#f5ebd6";
    ctx.fill();
    ctx.strokeStyle = "#1c1917";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    const fonts = getCanvasFontFamilies();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#0f172a";
    ctx.font = `900 ${Math.max(10, Math.round(bh * 0.68))}px ${fonts.mono}`;
    ctx.fillText(`${opts.effCost}`, x + 3, y + bh * 0.52);
    drawKotIcon2D(
      ctx,
      x + bw - Math.round(bh * 0.42),
      y + bh * 0.5,
      Math.max(10, Math.round(bh * 0.72)),
      "energy"
    );
  }

  ctx.restore();

  drawRoundedRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = opts.highlighted ? "#fde047" : "#f5ebd6";
  ctx.lineWidth = opts.highlighted ? 2.2 : 1.4;
  ctx.stroke();
  ctx.restore();
}

let cachedCardBackImg: HTMLImageElement | null = null;
let cardBackLoaded = false;
const cardBackListeners = new Set<() => void>();

export function getKotCardBackImage(onLoad?: () => void): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (cardBackLoaded && cachedCardBackImg) return cachedCardBackImg;
  if (onLoad) cardBackListeners.add(onLoad);
  if (!cachedCardBackImg) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      cardBackLoaded = true;
      cardBackListeners.forEach((fn) => fn());
      cardBackListeners.clear();
    };
    img.src = KOT_CARD_BACK_URL;
    cachedCardBackImg = img;
  }
  return cardBackLoaded ? cachedCardBackImg : null;
}

/**
 * Draws the official King of Tokyo: Duel Power Deck card back (official spotlight-to-magma lightning bolt)
 * with stacked deck depth and remaining card count badge!
 */
export function drawKotDeckBack2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  deckCount: number,
  opts: { canFlush?: boolean; hovered?: boolean } = {}
) {
  ctx.save();
  const r = Math.max(8, Math.round(Math.min(w, h) * 0.08));
  const fonts = getCanvasFontFamilies();

  ctx.shadowColor = opts.hovered && opts.canFlush ? "rgba(56, 189, 248, 0.75)" : "rgba(0, 0, 0, 0.65)";
  ctx.shadowBlur = opts.hovered && opts.canFlush ? 16 : 12;
  ctx.shadowOffsetY = 4;

  // Stacked physical deck edge layers
  if (deckCount > 8) {
    drawRoundedRect(ctx, x + 4, y + 4, w, h, r);
    ctx.fillStyle = "#1e293b";
    ctx.fill();
  }
  if (deckCount > 3) {
    drawRoundedRect(ctx, x + 2, y + 2, w, h, r);
    ctx.fillStyle = "#334155";
    ctx.fill();
  }

  drawRoundedRect(ctx, x, y, w, h, r);
  ctx.fillStyle = "#0f172a";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Official Power Card back illustration!
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, r);
  ctx.clip();
  const backImg = getKotCardBackImage();
  if (backImg) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(backImg, x, y, w, h);
  } else {
    const bg = ctx.createLinearGradient(x, y, x + w, y + h);
    bg.addColorStop(0, "#334155");
    bg.addColorStop(1, "#0f172a");
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();

  // Outer border
  drawRoundedRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = opts.canFlush
    ? opts.hovered
      ? "#38bdf8"
      : "#7dd3fc"
    : "#0f172a";
  ctx.lineWidth = opts.canFlush ? 2.2 : 1.8;
  ctx.stroke();

  // Bottom remaining deck count pill (and Flush hint when clickable)
  const pillH = 20;
  const pillW = Math.min(w - 10, opts.canFlush ? w - 8 : 54);
  drawRoundedRect(ctx, x + (w - pillW) / 2, y + h - pillH - 6, pillW, pillH, 999);
  ctx.fillStyle = opts.canFlush ? "rgba(2, 132, 199, 0.92)" : "rgba(15, 23, 42, 0.88)";
  ctx.fill();
  ctx.strokeStyle = opts.canFlush ? "#bae6fd" : "rgba(148, 163, 184, 0.45)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f8fafc";
  ctx.font = `800 9.5px ${fonts.sans}`;
  ctx.fillText(
    opts.canFlush ? `🔄 Đổi (-2⚡)` : `${deckCount} lá`,
    x + w / 2,
    y + h - pillH / 2 - 5.5,
    pillW - 8
  );

  ctx.restore();
}

let cachedBuzzMedalsImg: HTMLImageElement | null = null;
let buzzMedalsLoaded = false;
const buzzMedalsListeners = new Set<() => void>();

export function getKotBuzzMedalsAtlas(
  onLoad?: () => void
): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (buzzMedalsLoaded && cachedBuzzMedalsImg) return cachedBuzzMedalsImg;
  if (onLoad) buzzMedalsListeners.add(onLoad);
  if (!cachedBuzzMedalsImg) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      buzzMedalsLoaded = true;
      buzzMedalsListeners.forEach((fn) => fn());
      buzzMedalsListeners.clear();
    };
    img.src = KOT_BUZZ_MEDALS_URL;
    cachedBuzzMedalsImg = img;
  }
  return buzzMedalsLoaded ? cachedBuzzMedalsImg : null;
}

const BUZZ_MEDAL_SX: Record<KotBuzzKind, number> = {
  ENERGY_2: 0,
  HEAL_2: 64,
  DMG_1: 128,
  BONUS_DIE: 192,
  PULL_1: 256,
};

let cachedBuzzTilesImg: HTMLImageElement | null = null;
let buzzTilesLoaded = false;
const buzzTilesListeners = new Set<() => void>();

export function getKotBuzzTilesAtlas(
  onLoad?: () => void
): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (buzzTilesLoaded && cachedBuzzTilesImg) return cachedBuzzTilesImg;
  if (onLoad) buzzTilesListeners.add(onLoad);
  if (!cachedBuzzTilesImg) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      buzzTilesLoaded = true;
      buzzTilesListeners.forEach((fn) => fn());
      buzzTilesListeners.clear();
    };
    img.src = KOT_BUZZ_TILES_URL;
    cachedBuzzTilesImg = img;
  }
  return buzzTilesLoaded ? cachedBuzzTilesImg : null;
}

/**
 * Draws a standalone crisp preview thumbnail of a shaped 2-space or 3-space Buzz Tile
 * inside bounding box `(x, y, w, h)` (used in the top placement prompt banner).
 */
export function drawKotBuzzTilePreview2D(
  ctx: CanvasRenderingContext2D,
  tileId: KotBuzzTileId,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const atlas = getKotBuzzTilesAtlas();
  if (!atlas) return;
  const def = KOT_BUZZ_TILE_DEFS[tileId];
  const col = def.spriteIndex % 4;
  const row = Math.floor(def.spriteIndex / 4);
  const sx = col * 192;
  const sy = row * 160;
  const aspect = 192 / 160;
  let dw = w;
  let dh = dw / aspect;
  if (dh > h) {
    dh = h;
    dw = dh * aspect;
  }
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(atlas, sx, sy, 192, 160, dx, dy, dw, dh);
  ctx.restore();
}

let cachedLobbyBgImg: HTMLImageElement | null = null;
let lobbyBgLoaded = false;
const lobbyBgListeners = new Set<() => void>();

export function getKotLobbyBgImage(
  onLoad?: () => void
): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (lobbyBgLoaded && cachedLobbyBgImg) return cachedLobbyBgImg;
  if (onLoad) lobbyBgListeners.add(onLoad);
  if (!cachedLobbyBgImg) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      lobbyBgLoaded = true;
      lobbyBgListeners.forEach((fn) => fn());
      lobbyBgListeners.clear();
    };
    img.src = KOT_LOBBY_BG_URL;
    cachedLobbyBgImg = img;
  }
  return lobbyBgLoaded ? cachedLobbyBgImg : null;
}

/**
 * Draws the official 1920x1080 Meka Dragon vs Gigazaur Tokyo Clash cover artwork
 * as a full-bleed aspect-preserving lobby background with subtle cinematic breathing
 * zoom, floating embers, and top/bottom contrast scrims so UI overlays stay crisp.
 */
export function drawKotLobbyBackground2D(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  nowMs: number
) {
  const img = getKotLobbyBgImage();
  if (!img) {
    drawKotTokyoBackground2D(ctx, width, height, nowMs);
    return;
  }

  ctx.save();
  const imgAspect = img.naturalWidth / Math.max(1, img.naturalHeight);
  const viewAspect = width / Math.max(1, height);

  // Subtle cinematic breathing scale (1.01 .. 1.03)
  const zoom = 1.02 + Math.sin(nowMs / 4600) * 0.01;
  let drawW = width * zoom;
  let drawH = drawW / imgAspect;
  if (viewAspect < imgAspect) {
    drawH = height * zoom;
    drawW = drawH * imgAspect;
  }
  const dx = (width - drawW) / 2;
  const dy = (height - drawH) / 2;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, dx, dy, drawW, drawH);

  // Soft top & bottom gradient scrims so title + seat cards pop cleanly while keeping center art vibrant!
  const topScrim = ctx.createLinearGradient(0, 0, 0, height * 0.3);
  topScrim.addColorStop(0, "rgba(6, 10, 22, 0.72)");
  topScrim.addColorStop(1, "rgba(6, 10, 22, 0)");
  ctx.fillStyle = topScrim;
  ctx.fillRect(0, 0, width, height * 0.3);

  const botScrim = ctx.createLinearGradient(0, height * 0.56, 0, height);
  botScrim.addColorStop(0, "rgba(6, 10, 22, 0)");
  botScrim.addColorStop(0.55, "rgba(6, 10, 22, 0.56)");
  botScrim.addColorStop(1, "rgba(4, 7, 16, 0.88)");
  ctx.fillStyle = botScrim;
  ctx.fillRect(0, height * 0.56, width, height * 0.44);

  // Subtle floating fiery embers drifting up from burning Tokyo
  for (let i = 0; i < 18; i++) {
    const t = ((nowMs * (0.018 + (i % 5) * 0.005) + i * 97) % (height + 40));
    const ey = height + 20 - t;
    const ex = ((i * 137.5 + Math.sin(nowMs / 900 + i) * 26) % width + width) % width;
    const r = 1.2 + (i % 3) * 0.8;
    const alpha = Math.max(0, Math.min(0.75, (ey / height) * 0.75));
    ctx.fillStyle = i % 2 === 0
      ? `rgba(253, 224, 71, ${alpha})`
      : `rgba(251, 146, 60, ${alpha})`;
    ctx.beginPath();
    ctx.arc(ex, ey, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

let cachedHpDialsImg: HTMLImageElement | null = null;
let hpDialsLoaded = false;
const hpDialsListeners = new Set<() => void>();

export function getKotHpDialsAtlas(onLoad?: () => void): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (hpDialsLoaded && cachedHpDialsImg) return cachedHpDialsImg;
  if (onLoad) hpDialsListeners.add(onLoad);
  if (!cachedHpDialsImg) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      hpDialsLoaded = true;
      hpDialsListeners.forEach((fn) => fn());
      hpDialsListeners.clear();
    };
    img.src = KOT_HP_DIALS_ATLAS_URL;
    cachedHpDialsImg = img;
  }
  return hpDialsLoaded ? cachedHpDialsImg : null;
}

// Exact measured angular position (degrees CW from 12 o'clock) of each HP value 0 (💀) .. 20 on the pink number wheel!
const HP_WHEEL_ANGLES_DEG = [
  336.5, // 0 (💀)
  320.5, // 1
  304.0, // 2
  288.0, // 3
  272.5, // 4
  257.0, // 5
  240.0, // 6
  224.5, // 7
  209.0, // 8
  192.5, // 9
  175.0, // 10
  158.5, // 11
  140.8, // 12
  123.8, // 13
  106.8, // 14
  89.3,  // 15
  72.0,  // 16
  55.5,  // 17
  38.8,  // 18
  21.5,  // 19
  1.5,   // 20
];

function getHpWheelAngleDeg(smoothHp: number): number {
  const clamped = Math.max(0, Math.min(20, smoothHp));
  const lo = Math.floor(clamped);
  const hi = Math.ceil(clamped);
  if (lo === hi) return HP_WHEEL_ANGLES_DEG[lo];
  const t = clamped - lo;
  return HP_WHEEL_ANGLES_DEG[lo] * (1 - t) + HP_WHEEL_ANGLES_DEG[hi] * t;
}

/**
 * Draws the official physical two-layer King of Tokyo: Duel Health Dial:
 * - Bottom rotating pink HP number wheel (`💀, 1..20`) spinning smoothly to `smoothHp`
 * - Top Red (Opponent) or Blue (Player) Kaiju Blueprint Dial Cover with U-shaped top readout notch!
 */
export function drawKotHealthDial2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  hp: number,
  maxHp: number,
  tone: "red" | "blue",
  smoothHp?: number
) {
  ctx.save();
  const dialsAtlas = getKotHpDialsAtlas();
  const displayHp = smoothHp ?? hp;
  const diameter = radius * 2;

  // Tabletop drop shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.58)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = tone === "red" ? "#4c121b" : "#0e2642";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  if (dialsAtlas) {
    // 1. Rotating Pink HP Number Wheel underneath (slot 0: sx=0, sy=0, 250x250)
    const wheelDeg = getHpWheelAngleDeg(displayHp);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((-wheelDeg * Math.PI) / 180);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    // Slightly inset wheel by ~2% so pink edge never pokes out behind the vintage cream cover rim
    const wDiam = diameter * 0.985;
    ctx.drawImage(
      dialsAtlas,
      0,
      0,
      250,
      250,
      -wDiam / 2,
      -wDiam / 2,
      wDiam,
      wDiam
    );
    ctx.restore();

    // 2. Official Red (slot 1: sx=250) or Blue (slot 2: sx=500) Blueprint Cover with U-shaped cutout notch!
    const coverSx = tone === "red" ? 250 : 500;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      dialsAtlas,
      coverSx,
      0,
      250,
      250,
      cx - radius,
      cy - radius,
      diameter,
      diameter
    );
  } else {
    // Crisp fallback before atlas finishes loading
    const fonts = getCanvasFontFamilies();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
    ctx.fillStyle = tone === "red" ? "#9f2b3b" : "#1e4b7a";
    ctx.fill();
    ctx.strokeStyle = "#f5ebd6";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = `900 ${Math.round(radius * 0.55)}px ${fonts.mono}`;
    ctx.fillText(`${hp}/${maxHp}`, cx, cy);
  }

  ctx.restore();
}

let cachedEnergyCubeImg: HTMLImageElement | null = null;
let energyCubeLoaded = false;
const energyCubeListeners = new Set<() => void>();

export function getKotEnergyCubeImage(onLoad?: () => void): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (energyCubeLoaded && cachedEnergyCubeImg) return cachedEnergyCubeImg;
  if (onLoad) energyCubeListeners.add(onLoad);
  if (!cachedEnergyCubeImg) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      energyCubeLoaded = true;
      energyCubeListeners.forEach((fn) => fn());
      energyCubeListeners.clear();
    };
    img.src = KOT_ENERGY_CUBE_URL;
    cachedEnergyCubeImg = img;
  }
  return energyCubeLoaded ? cachedEnergyCubeImg : null;
}

/**
 * Draws a single 16-bit translucent emerald-green Energy Cube centered at `(cx, cy)`.
 */
export function drawKotEnergyCube2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) {
  const img = getKotEnergyCubeImage();
  if (!img) return;
  ctx.save();
  ctx.shadowColor = "rgba(132, 204, 22, 0.55)";
  ctx.shadowBlur = 6;
  ctx.imageSmoothingEnabled = size < 24;
  if (ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    Math.round(cx - size / 2),
    Math.round(cy - size / 2),
    size,
    size
  );
  ctx.restore();
}

/**
 * Draws a player's tabletop Energy Stash inside `(x, y, w, h)`:
 * physical stacked translucent green 16-bit Energy Cubes + crisp `×N` badge!
 */
export function drawKotEnergyStash2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  energy: number
) {
  ctx.save();
  const fonts = getCanvasFontFamilies();
  drawRoundedRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
  ctx.fill();
  ctx.strokeStyle =
    energy > 0 ? "rgba(163, 230, 53, 0.55)" : "rgba(100, 116, 139, 0.35)";
  ctx.lineWidth = energy > 0 ? 1.5 : 1.1;
  ctx.stroke();

  if (energy <= 0) {
    ctx.globalAlpha = 0.35;
    drawKotEnergyCube2D(ctx, x + w / 2, y + h * 0.38, Math.min(28, Math.round(w * 0.42)));
    ctx.globalAlpha = 1;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#64748b";
    ctx.font = `900 14px ${fonts.mono}`;
    ctx.fillText("0", x + w / 2, y + h * 0.78);
  } else {
    // Draw a neat tabletop pile of physical green Energy Cubes (up to 6 visible cubes!)
    const shown = Math.min(6, energy);
    const cubeSz = Math.max(15, Math.min(24, Math.round(w * (shown <= 2 ? 0.38 : 0.28))));
    const topZoneH = h * 0.62;
    const cols = shown <= 2 ? shown : 3;
    const rows = Math.ceil(shown / cols);
    const stepX = cubeSz * 0.88;
    const stepY = cubeSz * 0.72;
    const gridH = (rows - 1) * stepY + cubeSz;
    const startY = y + 4 + Math.max(0, (topZoneH - gridH) / 2) + cubeSz / 2;

    for (let i = 0; i < shown; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const itemsInRow = Math.min(cols, shown - r * cols);
      const rowW = (itemsInRow - 1) * stepX;
      const cx = x + w / 2 - rowW / 2 + c * stepX;
      const cy = startY + r * stepY;
      drawKotEnergyCube2D(ctx, cx, cy, cubeSz);
    }

    // Bottom crisp count badge (`×N`) with tiny lime lightning bolt
    const lblY = y + h * 0.81;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#bef264";
    ctx.font = `900 14px ${fonts.mono}`;
    ctx.fillText(`×${energy}`, x + w / 2 + 6, lblY);
    const tw = ctx.measureText(`×${energy}`).width;
    drawKotIcon2D(ctx, x + w / 2 - tw / 2 - 2, lblY, 13, "energy");
  }

  ctx.restore();
}

let cachedDiceImg: HTMLImageElement | null = null;
let diceLoaded = false;
const diceListeners = new Set<() => void>();

export function getKotDiceAtlas(onLoad?: () => void): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (diceLoaded && cachedDiceImg) return cachedDiceImg;
  if (onLoad) diceListeners.add(onLoad);
  if (!cachedDiceImg) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      diceLoaded = true;
      diceListeners.forEach((fn) => fn());
      diceListeners.clear();
    };
    img.src = KOT_DICE_ATLAS_URL;
    cachedDiceImg = img;
  }
  return diceLoaded ? cachedDiceImg : null;
}

/**
 * Draws a vibrant 16-bit neon-cyberpunk Tokyo Night Skyline Arena background
 * with sweeping searchlights, glowing Tokyo Tower, skyscrapers, and tactical arena grid.
 */
export function drawKotTokyoBackground2D(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  nowMs: number
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // 1. Deep neon-dusk Tokyo sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#0c0a24");
  sky.addColorStop(0.45, "#23103b");
  sky.addColorStop(0.75, "#3b1332");
  sky.addColorStop(1, "#090b16");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // 2. Sweeping Tokyo spotlight searchlights
  const cx = width * 0.5;
  const horizonY = height * 0.62;
  for (let i = 0; i < 2; i++) {
    const baseX = i === 0 ? width * 0.16 : width * 0.84;
    const sweep = Math.sin(nowMs / 1800 + i * 2.4) * 0.32;
    const ang = -Math.PI / 2 + (i === 0 ? 0.25 : -0.25) + sweep;
    ctx.save();
    ctx.translate(baseX, horizonY);
    ctx.rotate(ang);
    const beam = ctx.createLinearGradient(0, 0, height * 0.9, 0);
    beam.addColorStop(0, "rgba(250, 204, 21, 0.14)");
    beam.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(height * 0.95, -52);
    ctx.lineTo(height * 0.95, 52);
    ctx.lineTo(0, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 3. Distant glowing Tokyo Tower silhouette at center horizon
  ctx.save();
  ctx.fillStyle = "rgba(185, 28, 28, 0.35)";
  ctx.beginPath();
  ctx.moveTo(cx - 28, horizonY);
  ctx.lineTo(cx - 5, horizonY - 145);
  ctx.lineTo(cx + 5, horizonY - 145);
  ctx.lineTo(cx + 28, horizonY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(254, 240, 138, 0.4)";
  ctx.fillRect(cx - 14, horizonY - 76, 28, 5);
  ctx.fillRect(cx - 9, horizonY - 112, 18, 4);
  ctx.restore();

  // 4. Pixelated Tokyo Skyscrapers along the horizon
  const bCount = Math.ceil(width / 54);
  for (let i = 0; i < bCount; i++) {
    const bx = i * 54;
    const bh = 55 + ((i * 73) % 95);
    const bw = 46;
    const by = horizonY - bh;
    ctx.fillStyle = i % 2 === 0 ? "rgba(12, 15, 30, 0.84)" : "rgba(17, 21, 40, 0.84)";
    ctx.fillRect(bx, by, bw, bh + (height - horizonY));

    // Tiny glowing neon skyscraper windows
    ctx.fillStyle =
      i % 3 === 0
        ? "rgba(250, 204, 21, 0.25)"
        : i % 3 === 1
          ? "rgba(56, 189, 248, 0.22)"
          : "rgba(244, 114, 182, 0.22)";
    for (let wy = by + 8; wy < horizonY - 6; wy += 12) {
      for (let wx = bx + 6; wx < bx + bw - 8; wx += 10) {
        if ((wx + wy + i) % 3 !== 0) {
          ctx.fillRect(wx, wy, 4, 5);
        }
      }
    }
  }

  // 5. Dark tactical asphalt battleground floor below horizon
  const floorGrad = ctx.createLinearGradient(0, horizonY, 0, height);
  floorGrad.addColorStop(0, "rgba(10, 14, 26, 0.88)");
  floorGrad.addColorStop(1, "rgba(4, 6, 14, 0.96)");
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, horizonY, width, height - horizonY);

  // Subtle neon perspective horizon line
  ctx.strokeStyle = "rgba(244, 114, 182, 0.28)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  ctx.lineTo(width, horizonY);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a crisp 16-bit Kaiju Monster portrait sprite at `(x, y, size, size)`.
 */
export function drawKotMonsterPortrait2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  monsterId: KotMonsterId,
  highlighted = false
) {
  ctx.save();
  const radius = Math.max(8, Math.round(size * 0.14));
  const meta = KOT_MONSTERS[monsterId];

  if (highlighted) {
    ctx.shadowColor = meta.accentColor;
    ctx.shadowBlur = 16;
  }

  drawRoundedRect(ctx, x, y, size, size, radius);
  ctx.save();
  ctx.clip();

  const atlas = getKotMonsterAtlas();
  if (atlas) {
    const r = KOT_MONSTER_RECTS[monsterId];
    ctx.imageSmoothingEnabled = size < 72;
    if (ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality = "high";
    ctx.drawImage(atlas, r.sx, r.sy, r.sw, r.sh, x, y, size, size);
  } else {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x, y, size, size);
    ctx.font = `bold ${Math.round(size * 0.45)}px ${getCanvasFontFamilies().sans}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(meta.emoji, x + size / 2, y + size / 2);
  }

  ctx.restore();

  drawRoundedRect(ctx, x, y, size, size, radius);
  ctx.strokeStyle = highlighted ? "#fde047" : meta.accentColor;
  ctx.lineWidth = highlighted ? 3 : 2;
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws a full-art wide landscape 16-bit Kaiju Monster Board (220x168 native)
 * with authentic vintage cream-paper outer trim, bold top-right HP heart badge, and monster name banner!
 */
export function drawKotMonsterBoard2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  monsterId: KotMonsterId,
  opts: {
    selected?: boolean;
    hovered?: boolean;
    takenBy?: string;
  } = {}
) {
  ctx.save();
  const radius = Math.max(10, Math.round(Math.min(w, h) * 0.08));
  const meta = KOT_MONSTERS[monsterId];
  const fonts = getCanvasFontFamilies();

  // Drop shadow & selection glow
  if (opts.selected) {
    ctx.shadowColor = "#fde047";
    ctx.shadowBlur = 20;
  } else if (opts.hovered) {
    ctx.shadowColor = meta.accentColor;
    ctx.shadowBlur = 14;
  } else {
    ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
  }

  const isOfficialFullCard = OFFICIAL_FULL_BOARD_MONSTERS.has(monsterId);

  // Outer card surface (for non-official pixel boards, add vintage cream comic border; official cards already have their own authentic border!)
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.fillStyle = opts.selected ? "#fef08a" : "#f5ebd6";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Inner clipped artwork
  const pad = isOfficialFullCard ? 0 : Math.max(3, Math.round(Math.min(w, h) * 0.028));
  const ix = x + pad;
  const iy = y + pad;
  const iw = w - pad * 2;
  const ih = h - pad * 2;

  ctx.save();
  drawRoundedRect(ctx, ix, iy, iw, ih, isOfficialFullCard ? radius : Math.max(6, radius - 2));
  ctx.clip();

  const boardAtlas = getKotBoardAtlas();
  if (boardAtlas) {
    const r = KOT_BOARD_RECTS[monsterId];
    if (isOfficialFullCard) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    } else {
      ctx.imageSmoothingEnabled = false;
    }
    ctx.drawImage(boardAtlas, r.sx, r.sy, r.sw, r.sh, ix, iy, iw, ih);
  } else {
    drawKotMonsterPortrait2D(ctx, ix, iy, Math.min(iw, ih), monsterId, opts.selected);
  }

  if (!isOfficialFullCard) {
    // Subtle dark gradient along bottom for crisp comic monster nameplate
    const grad = ctx.createLinearGradient(0, iy + ih * 0.62, 0, iy + ih);
    grad.addColorStop(0, "rgba(6, 10, 20, 0)");
    grad.addColorStop(1, "rgba(6, 10, 20, 0.88)");
    ctx.fillStyle = grad;
    ctx.fillRect(ix, iy + ih * 0.6, iw, ih * 0.4);

    // Official-style bold comic HP badge top-right (e.g. "14 ♥")
    const badgeW = Math.max(46, Math.round(w * 0.24));
    const badgeH = Math.max(24, Math.round(h * 0.17));
    drawRoundedRect(ctx, ix + iw - badgeW + 4, iy - 4, badgeW + 2, badgeH + 2, 10);
    ctx.fillStyle = "#f5ebd6";
    ctx.fill();
    ctx.strokeStyle = "#1c1917";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${Math.max(12, Math.round(badgeH * 0.64))}px ${fonts.mono}`;
    ctx.fillStyle = "#111827";
    ctx.fillText(
      `${meta.maxHp}`,
      ix + iw - badgeW * 0.62,
      iy + badgeH * 0.48
    );
    ctx.fillStyle = "#f43f5e";
    ctx.font = `900 ${Math.max(12, Math.round(badgeH * 0.6))}px ${fonts.sans}`;
    ctx.fillText("♥", ix + iw - badgeW * 0.24, iy + badgeH * 0.48);

    // Bold Monster Nameplate bottom-left
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    const namePx = Math.max(13, Math.min(20, Math.round(w * 0.088)));
    ctx.font = `900 ${namePx}px ${fonts.sans}`;
    ctx.lineJoin = "round";
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = "#090d16";
    const nx = ix + 10;
    const ny = iy + ih - 8;
    ctx.strokeText(meta.name.toUpperCase(), nx, ny, iw - 20);
    ctx.fillStyle = meta.accentColor;
    ctx.fillText(meta.name.toUpperCase(), nx, ny, iw - 20);
  }

  // Taken dim stamp if already picked by opponent
  if (opts.takenBy) {
    ctx.fillStyle = "rgba(2, 6, 23, 0.58)";
    ctx.fillRect(ix, iy, iw, ih);
    drawRoundedRect(ctx, ix + iw * 0.14, iy + ih * 0.38, iw * 0.72, 28, 10);
    ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
    ctx.fill();
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fde047";
    ctx.font = `800 11px ${fonts.sans}`;
    ctx.fillText(`✓ ĐÃ CHỌN: ${opts.takenBy}`, ix + iw / 2, iy + ih * 0.38 + 14, iw * 0.66);
  }

  ctx.restore(); // end clip

  // Outer selection ring
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.strokeStyle = opts.selected
    ? "#fde047"
    : opts.hovered
      ? meta.accentColor
      : "#1e293b";
  ctx.lineWidth = opts.selected ? 3.4 : opts.hovered ? 2.4 : 1.5;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a crisp 16-bit Kaiju Die at `(x, y, size, size)` — official Coral-Red for the 6 core dice
 * and Ivory/White for the 2 bonus extra dice (`isBonus = true`), with golden lock ring, padlock badge,
 * and optional 3D tumble / jump / squash-and-stretch landing animation!
 */
export function drawKotDie2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  face: KotDieFace,
  locked: boolean,
  hovered = false,
  isBonus = false,
  anim?: {
    angle?: number;
    scaleX?: number;
    scaleY?: number;
    jumpY?: number;
    flash?: number;
  }
) {
  ctx.save();
  const lift = locked ? -4 : hovered ? -2.5 : 0;
  const jumpY = anim?.jumpY ?? 0;
  const angle = anim?.angle ?? 0;
  const scaleX = anim?.scaleX ?? 1;
  const scaleY = anim?.scaleY ?? 1;
  const flash = anim?.flash ?? 0;
  const dy = y + lift + jumpY;

  // Grounded drop shadow (shrinks & softens as the die leaps higher into the air!)
  const airFrac = Math.min(1, Math.abs(jumpY) / 30);
  const shadScale = 1 - airFrac * 0.28;
  ctx.save();
  ctx.globalAlpha = 0.55 - airFrac * 0.25;
  ctx.fillStyle = "#000000";
  const sw = size * shadScale;
  const sh = size * shadScale;
  drawRoundedRect(
    ctx,
    x + (size - sw) / 2 + 2,
    y + (size - sh) / 2 + 5,
    sw,
    sh,
    Math.round(sw * 0.18)
  );
  ctx.fill();
  ctx.restore();

  // Apply 3D-feel spin & squash-stretch around die center
  const cx = x + size / 2;
  const cy = dy + size / 2;
  ctx.translate(cx, cy);
  if (angle !== 0) ctx.rotate(angle);
  if (scaleX !== 1 || scaleY !== 1) ctx.scale(scaleX, scaleY);

  const lx = -size / 2;
  const ly = -size / 2;

  if (locked) {
    ctx.shadowColor = "rgba(250, 204, 21, 0.85)";
    ctx.shadowBlur = 14;
  } else if (flash > 0.02) {
    ctx.shadowColor = `rgba(253, 224, 71, ${flash * 0.9})`;
    ctx.shadowBlur = 16 * flash;
  }

  const atlas = getKotDiceAtlas();
  if (atlas) {
    const r = KOT_DICE_RECTS[face];
    // Official King of Tokyo: Duel dice: 6 Red core dice (row 1: sy=64) + 2 White/Cream bonus dice (row 0: sy=0)
    const sy = isBonus ? 0 : 64;
    ctx.imageSmoothingEnabled = size < 44 || angle !== 0;
    if (ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality = "high";
    ctx.drawImage(atlas, r.sx, sy, r.sw, r.sh, lx, ly, size, size);
  } else {
    drawRoundedRect(ctx, lx, ly, size, size, 10);
    ctx.fillStyle = isBonus ? "#f4e0ba" : "#e2505a";
    ctx.fill();
  }

  ctx.shadowBlur = 0;

  // Brief bright impact sheen right when the die lands!
  if (flash > 0.02) {
    drawRoundedRect(ctx, lx, ly, size, size, Math.round(size * 0.18));
    ctx.fillStyle = `rgba(255, 255, 255, ${flash * 0.42})`;
    ctx.fill();
  }

  // Golden lock border & padlock mini badge when Kept!
  if (locked || hovered) {
    drawRoundedRect(ctx, lx, ly, size, size, Math.round(size * 0.18));
    ctx.strokeStyle = locked ? "#facc15" : "rgba(255, 255, 255, 0.65)";
    ctx.lineWidth = locked ? 2.8 : 1.8;
    ctx.stroke();
  }

  if (locked) {
    const bx = lx + size - 7;
    const by = ly + 7;
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(bx, by, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#0f172a";
    ctx.font = `900 9px ${getCanvasFontFamilies().sans}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🔒", bx, by + 0.5);
  }

  ctx.restore();
}

// Exact normalized coordinates of the 15 zigzag circular spaces (-7..0..+7) on the 512x325 16-bit Tokyo board!
const BOARD_STEP_NX = [256, 288, 320, 353, 385, 417, 450, 483].map((v) => v / 512);
const BOARD_FAME_NY = [112, 85, 112, 85, 112, 85, 112, 85].map((v) => v / 325);
const BOARD_DEST_NY = [217, 243, 217, 243, 217, 243, 217, 243].map((v) => v / 325);

function getDiscreteTrackNorm(
  track: "fame" | "destruction",
  step: number
): { nx: number; ny: number } {
  const clamped = Math.max(-KOT_WIN_TRACK_POS, Math.min(KOT_WIN_TRACK_POS, step));
  const abs = Math.abs(clamped);
  const dx = BOARD_STEP_NX[abs] - 0.5;
  const nx = clamped >= 0 ? 0.5 + dx : 0.5 - dx;
  const ny = track === "fame" ? BOARD_FAME_NY[abs] : BOARD_DEST_NY[abs];
  return { nx, ny };
}

/**
 * Returns the exact normalized `(nx, ny)` board coordinate along the official zigzag track,
 * smoothly interpolating along segments for continuous animated positions!
 */
export function getKotTrackNodeNorm(
  track: "fame" | "destruction",
  orientedPos: number
): { nx: number; ny: number } {
  const clamped = Math.max(
    -KOT_WIN_TRACK_POS,
    Math.min(KOT_WIN_TRACK_POS, orientedPos)
  );
  const lo = Math.floor(clamped);
  const hi = Math.ceil(clamped);
  if (lo === hi) return getDiscreteTrackNorm(track, lo);
  const t = clamped - lo;
  const a = getDiscreteTrackNorm(track, lo);
  const b = getDiscreteTrackNorm(track, hi);
  return {
    nx: a.nx + (b.nx - a.nx) * t,
    ny: a.ny + (b.ny - a.ny) * t,
  };
}

const BUZZ_SHORT_LABEL: Record<KotBuzzKind, string> = {
  ENERGY_2: "+2",
  HEAL_2: "+2",
  DMG_1: "1",
  BONUS_DIE: "+1",
  PULL_1: "+1",
};

const BUZZ_ICON: Record<KotBuzzKind, KotIconName> = {
  ENERGY_2: "energy",
  HEAL_2: "heart",
  DMG_1: "claw",
  BONUS_DIE: "dice",
  PULL_1: "burst",
};

/**
 * Returns the exact board pixel center of a 2-space or 3-space Buzz Tile placement
 * so clickable hit targets align directly with the tile center on the zigzag track.
 */
export function getKotBuzzPlacementAnchorPx(
  boardX: number,
  boardY: number,
  boardW: number,
  boardH: number,
  track: KotTrackType,
  startPos: number,
  span: 2 | 3,
  sign: -1 | 1
): { cx: number; cy: number } {
  if (span === 3) {
    const pMid = getKotTrackNodeNorm(track, (startPos + 1) * sign);
    return {
      cx: boardX + pMid.nx * boardW,
      cy: boardY + pMid.ny * boardH,
    };
  }
  const p0 = getKotTrackNodeNorm(track, startPos * sign);
  const p1 = getKotTrackNodeNorm(track, (startPos + 1) * sign);
  return {
    cx: boardX + ((p0.nx + p1.nx) / 2) * boardW,
    cy: boardY + ((p0.ny + p1.ny) / 2) * boardH,
  };
}

/**
 * Draws an official shaped 2-space or 3-space Buzz Tile snapped concentrically
 * onto its exact 2 or 3 zigzag track circles on the Tokyo board!
 */
export function drawKotPlacedBuzzTileOnBoard2D(
  ctx: CanvasRenderingContext2D,
  boardX: number,
  boardY: number,
  boardW: number,
  boardH: number,
  tileId: KotBuzzTileId,
  track: KotTrackType,
  startPos: number,
  sign: -1 | 1,
  opts: { ghost?: boolean; highlighted?: boolean; nowMs?: number } = {}
) {
  const atlas = getKotBuzzTilesAtlas();
  if (!atlas) return;

  const def = KOT_BUZZ_TILE_DEFS[tileId];
  const col = def.spriteIndex % 4;
  const row = Math.floor(def.spriteIndex / 4);
  const sx = col * 192;
  const sy = row * 160;

  ctx.save();
  if (opts.ghost) {
    ctx.globalAlpha = 0.88;
    ctx.shadowColor = "rgba(52, 211, 153, 0.95)";
    ctx.shadowBlur = 16;
  } else if (opts.highlighted) {
    const pulse = 0.5 + 0.5 * Math.sin((opts.nowMs ?? 0) / 260);
    ctx.shadowColor = "rgba(250, 204, 21, 0.9)";
    ctx.shadowBlur = 8 + pulse * 8;
  } else {
    ctx.shadowColor = "rgba(2, 6, 23, 0.72)";
    ctx.shadowBlur = 7;
    ctx.shadowOffsetY = 3;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (def.span === 3) {
    const n0 = getKotTrackNodeNorm(track, startPos * sign);
    const n1 = getKotTrackNodeNorm(track, (startPos + 1) * sign);
    const n2 = getKotTrackNodeNorm(track, (startPos + 2) * sign);
    const x0 = boardX + n0.nx * boardW;
    const y0 = boardY + n0.ny * boardH;
    const x1 = boardX + n1.nx * boardW;
    const y1 = boardY + n1.ny * boardH;
    const x2 = boardX + n2.nx * boardW;
    const y2 = boardY + n2.ny * boardH;

    // In 192x160 cell: left=(47,82), mid=(96,47), right=(145,82) -> spanX=98, dy=-35
    const ax = (x0 + x2) / 2;
    const ay = (y0 + y2) / 2;
    const scaleX = Math.max(0.1, Math.abs(x2 - x0) / 98);
    const scaleY = Math.max(0.1, Math.abs(y1 - y0) / 35);
    const flipY = y1 < y0 ? 1 : -1;

    ctx.translate(ax, ay);
    ctx.scale(scaleX, scaleY * flipY);
    ctx.drawImage(atlas, sx, sy, 192, 160, -96, -82, 192, 160);
  } else {
    const n0 = getKotTrackNodeNorm(track, startPos * sign);
    const n1 = getKotTrackNodeNorm(track, (startPos + 1) * sign);
    const x0 = boardX + n0.nx * boardW;
    const y0 = boardY + n0.ny * boardH;
    const x1 = boardX + n1.nx * boardW;
    const y1 = boardY + n1.ny * boardH;

    // In 192x160 cell: left=(52,83), right=(140,83) -> mid=(96,83), dist=88
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    const dist = Math.max(10, Math.hypot(x1 - x0, y1 - y0));
    const sc = dist / 88;
    // Keep chibi mascot upright for both Seat 1 (mirrored X) and Seat 2!
    const mirrored = x1 < x0;
    const ang = mirrored
      ? Math.atan2(y0 - y1, x0 - x1)
      : Math.atan2(y1 - y0, x1 - x0);

    ctx.translate(mx, my);
    ctx.rotate(ang);
    ctx.scale(mirrored ? -sc : sc, sc);
    ctx.drawImage(atlas, sx, sy, 192, 160, -96, -83, 192, 160);
  }

  ctx.restore();
}

/**
 * Draws the detailed 2D 16-bit Pixel Art Tokyo Duel Game Board with live shaped Buzz Tiles
 * and smoothly gliding Fame (⭐) & Destruction (🏢) markers!
 */
export function drawKotGameBoard2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: {
    nowMs: number;
    smoothFame: number;
    smoothDest: number;
    sign: -1 | 1;
    placedBuzzTiles?: KotPlacedBuzzTile[];
    pendingPlacement?: {
      tileId: KotBuzzTileId;
      validSpots: Array<{ track: KotTrackType; startPos: number }>;
      hoveredSpot: { track: KotTrackType; startPos: number } | null;
    } | null;
    buzzTokens: Array<{
      id: string;
      track: "fame" | "destruction";
      orientedPos: number;
      kind: KotBuzzKind;
    }>;
  }
) {
  ctx.save();
  const radius = Math.max(10, Math.round(Math.min(w, h) * 0.036));
  const fonts = getCanvasFontFamilies();

  ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 5;
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.fillStyle = "#0b1120";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.clip();

  const boardImg = getKotGameBoardImage();
  if (boardImg) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(boardImg, x, y, w, h);
  } else {
    ctx.fillStyle = "#111827";
    ctx.fillRect(x, y, w, h);
  }

  // Orientation pills (LEFT = Opponent Win | RIGHT = YOUR Win)
  const pillH = Math.max(18, Math.round(h * 0.068));
  const pillFont = Math.max(9, Math.min(11, Math.round(h * 0.033)));

  const leftPillW = Math.max(82, Math.round(w * 0.165));
  drawRoundedRect(ctx, x + 8, y + h - pillH - 8, leftPillW, pillH, 999);
  ctx.fillStyle = "rgba(15, 23, 42, 0.86)";
  ctx.fill();
  ctx.strokeStyle = "rgba(248, 113, 113, 0.85)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fca5a5";
  ctx.font = `900 ${pillFont}px ${fonts.sans}`;
  ctx.fillText("◀ ĐỐI THỦ", x + 8 + leftPillW / 2, y + h - pillH / 2 - 7.5);

  const rightPillW = Math.max(90, Math.round(w * 0.18));
  drawRoundedRect(ctx, x + w - rightPillW - 8, y + h - pillH - 8, rightPillW, pillH, 999);
  ctx.fillStyle = "rgba(15, 23, 42, 0.86)";
  ctx.fill();
  ctx.strokeStyle = "rgba(52, 211, 153, 0.9)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = "#6ee7b7";
  ctx.fillText("BẠN THẮNG ▶", x + w - rightPillW / 2 - 8, y + h - pillH / 2 - 7.5);

  // 1. Official Shaped 2-Space & 3-Space Buzz Tiles snapped onto their exact zigzag track circles!
  const pulse = 0.5 + 0.5 * Math.sin(opts.nowMs / 340);
  if (opts.placedBuzzTiles && opts.placedBuzzTiles.length > 0) {
    for (const placed of opts.placedBuzzTiles) {
      const isMovingThis =
        opts.pendingPlacement?.tileId === placed.tileId;
      ctx.save();
      if (isMovingThis) ctx.globalAlpha = 0.35;
      drawKotPlacedBuzzTileOnBoard2D(
        ctx,
        x,
        y,
        w,
        h,
        placed.tileId,
        placed.track,
        placed.startPos,
        opts.sign,
        { nowMs: opts.nowMs }
      );
      ctx.restore();
    }
  }

  // 2. Interactive Placement Targets & Live Ghost Preview during PlaceBuzzStep!
  if (opts.pendingPlacement) {
    const { tileId, validSpots, hoveredSpot } = opts.pendingPlacement;
    const def = KOT_BUZZ_TILE_DEFS[tileId];
    const dotR = Math.max(8, Math.min(14, Math.round(w * 0.02)));

    for (const spot of validSpots) {
      const isHov =
        hoveredSpot?.track === spot.track &&
        hoveredSpot?.startPos === spot.startPos;
      const { cx, cy } = getKotBuzzPlacementAnchorPx(
        x,
        y,
        w,
        h,
        spot.track,
        spot.startPos,
        def.span,
        opts.sign
      );

      ctx.save();
      ctx.shadowColor = isHov
        ? "rgba(52, 211, 153, 0.95)"
        : "rgba(250, 204, 21, 0.8)";
      ctx.shadowBlur = isHov ? 14 : 6 + pulse * 5;
      ctx.fillStyle = isHov
        ? "rgba(16, 185, 129, 0.42)"
        : "rgba(250, 204, 21, 0.24)";
      ctx.beginPath();
      ctx.arc(cx, cy, dotR + (isHov ? 3 : 0), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isHov ? "#34d399" : "#fde047";
      ctx.lineWidth = isHov ? 2.8 : 1.8;
      ctx.stroke();

      // Tiny crosshair / "+" inside target ring
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isHov ? "#ecfdf5" : "#fef9c3";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy);
      ctx.lineTo(cx + 4, cy);
      ctx.moveTo(cx, cy - 4);
      ctx.lineTo(cx, cy + 4);
      ctx.stroke();
      ctx.restore();
    }

    if (hoveredSpot) {
      drawKotPlacedBuzzTileOnBoard2D(
        ctx,
        x,
        y,
        w,
        h,
        tileId,
        hoveredSpot.track,
        hoveredSpot.startPos,
        opts.sign,
        { ghost: true, nowMs: opts.nowMs }
      );
    }
  }

  // 3. Legacy single-circle Buzz Token medallions (if any present)
  const buzzAtlas = getKotBuzzMedalsAtlas();
  const tokenR = Math.max(10, Math.min(18, Math.round(w * 0.0255)));

  for (const bz of opts.buzzTokens) {
    const pt = getKotTrackNodeNorm(bz.track, bz.orientedPos);
    const bx = x + pt.nx * w;
    const by = y + pt.ny * h;

    ctx.save();
    if (buzzAtlas) {
      const diam = Math.round(tokenR * 2.45);
      const half = diam / 2;
      const sx = BUZZ_MEDAL_SX[bz.kind];

      ctx.shadowColor = "rgba(250, 204, 21, 0.58)";
      ctx.shadowBlur = 5 + pulse * 5;
      ctx.shadowOffsetY = 2;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        buzzAtlas,
        sx,
        0,
        64,
        64,
        Math.round(bx - half),
        Math.round(by - half),
        diam,
        diam
      );
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Crisp micro-quantity badge for +2 bonuses (ENERGY_2 / HEAL_2) & +1 pull
      if (bz.kind === "ENERGY_2" || bz.kind === "HEAL_2" || bz.kind === "PULL_1") {
        const badgeR = Math.max(6, Math.round(tokenR * 0.44));
        const bdx = bx + half * 0.66;
        const bdy = by + half * 0.62;
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(bdx, bdy, badgeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fde047";
        ctx.lineWidth = 1.3;
        ctx.stroke();
        ctx.fillStyle = "#fef08a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `900 ${Math.max(7, Math.round(badgeR * 1.15))}px ${fonts.mono}`;
        ctx.fillText(BUZZ_SHORT_LABEL[bz.kind], bdx, bdy + 0.5);
      }
    } else {
      ctx.shadowColor = "rgba(250, 204, 21, 0.8)";
      ctx.shadowBlur = 6 + pulse * 5;
      ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
      ctx.beginPath();
      ctx.arc(bx, by, tokenR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fde047";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const icSize = Math.max(10, Math.round(tokenR * 1.05));
      drawKotIcon2D(ctx, bx + tokenR * 0.28, by, icSize, BUZZ_ICON[bz.kind]);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fef08a";
      ctx.font = `900 ${Math.max(8, Math.round(tokenR * 0.66))}px ${fonts.mono}`;
      ctx.fillText(BUZZ_SHORT_LABEL[bz.kind], bx - 1, by + 0.5);
    }
    ctx.restore();
  }

  // Sculpted 3D 16-bit wooden meeple markers (Fame Star Trophy / Destruction Crumbling Building)
  const tokensAtlas = getKotTokensAtlas();
  const drawTrackToken = (
    track: "fame" | "destruction",
    smoothPos: number,
    emoji: string,
    fillCore: string,
    rimColor: string,
    glowColor: string
  ) => {
    const pt = getKotTrackNodeNorm(track, smoothPos);
    const mx = x + pt.nx * w;
    const my = y + pt.ny * h;
    // Slight lively hop while gliding between zigzag spaces!
    const frac = Math.abs(smoothPos - Math.round(smoothPos));
    const glideHop = Math.sin(frac * Math.PI) * Math.max(5, Math.round(h * 0.032));
    const idleBob = Math.sin(opts.nowMs / 480 + (track === "fame" ? 0 : 1.7)) * 1.5;

    ctx.save();
    if (tokensAtlas) {
      const spriteSize = Math.max(46, Math.min(96, Math.round(w * 0.125)));
      const sx = track === "fame" ? 0 : 128;

      // Grounded elliptical tabletop drop shadow right inside the circular track space
      ctx.fillStyle = "rgba(2, 6, 23, 0.58)";
      ctx.beginPath();
      ctx.ellipse(
        mx,
        my + spriteSize * 0.12,
        spriteSize * 0.34,
        spriteSize * 0.13,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Subtle glowing halo behind the wooden meeple so it stands out on bright spotlight beams!
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 12 + pulse * 6;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      // Anchor pedestal bottom cleanly into the circle center!
      const drawX = Math.round(mx - spriteSize * 0.5);
      const drawY = Math.round(my - spriteSize * 0.78 - glideHop - idleBob);
      ctx.drawImage(tokensAtlas, sx, 0, 128, 128, drawX, drawY, spriteSize, spriteSize);
    } else {
      const puckR = Math.max(12, Math.min(22, Math.round(w * 0.031)));
      ctx.fillStyle = "rgba(2, 6, 23, 0.72)";
      ctx.beginPath();
      ctx.arc(mx, my + 4, puckR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 14 + pulse * 6;
      ctx.fillStyle = fillCore;
      ctx.beginPath();
      ctx.arc(mx, my, puckR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = rimColor;
      ctx.lineWidth = 2.6;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `900 ${Math.round(puckR * 1.05)}px ${fonts.sans}`;
      ctx.fillText(emoji, mx, my + 1);
    }
    ctx.restore();
  };

  drawTrackToken("fame", opts.smoothFame, "⭐", "#06b6d4", "#fef08a", "#22d3ee");
  drawTrackToken(
    "destruction",
    opts.smoothDest,
    "🏢",
    "#ef4444",
    "#fde047",
    "#f97316"
  );

  ctx.restore();

  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.strokeStyle = "rgba(250, 204, 21, 0.62)";
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.restore();
}
