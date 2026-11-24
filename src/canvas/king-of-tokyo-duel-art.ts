import { drawRoundedRect, getCanvasFontFamilies } from "@/canvas/engine";
import {
  KOT_MONSTERS,
  KOT_WIN_TRACK_POS,
  type KotBuzzKind,
  type KotDieFace,
  type KotMonsterId,
} from "@/cartridges/king-of-tokyo-duel";

export const KOT_MONSTER_ATLAS_URL = "/sprites/kot-duel-monsters-pixel.png";
export const KOT_BOARD_ATLAS_URL = "/sprites/kot-duel-boards-pixel.png";
export const KOT_GAME_BOARD_URL = "/sprites/kot-duel-board-map-pixel.png";
export const KOT_TOKENS_ATLAS_URL = "/sprites/kot-duel-tokens-pixel.png";
export const KOT_ICONS_ATLAS_URL = "/sprites/kot-duel-icons-pixel.png";
export const KOT_POWER_CARDS_ATLAS_URL = "/sprites/kot-duel-power-cards-pixel.png";
export const KOT_CARD_BACK_URL = "/sprites/kot-duel-card-back-pixel.png";
export const KOT_DICE_ATLAS_URL = "/sprites/kot-duel-dice-pixel.png";

/** Grid coordinates (col 0..9, row 0..4, each 100x140) in kot-duel-power-cards-pixel.png for every Power Card ID. */
export const KOT_POWER_CARD_COORDS: Record<string, { col: number; row: number }> = {
  "kot-beam": { col: 0, row: 2 },
  "kot-nuke-heal": { col: 5, row: 0 },
  "kot-media-storm": { col: 6, row: 2 },
  "kot-quake": { col: 9, row: 0 },
  "kot-shockwave": { col: 7, row: 1 },
  "kot-live-tv": { col: 6, row: 1 },
  "kot-meltdown": { col: 7, row: 0 },
  "kot-dual-strike": { col: 1, row: 1 },
  "kot-overcharge": { col: 2, row: 0 },
  "kot-titan-claws": { col: 0, row: 0 },
  "kot-armor": { col: 3, row: 2 },
  "kot-reactor": { col: 7, row: 2 },
  "kot-extra-die": { col: 1, row: 3 },
  "kot-regen": { col: 2, row: 3 },
  "kot-jetpack": { col: 5, row: 4 },
  "kot-siege": { col: 4, row: 4 },
  "kot-idol": { col: 3, row: 4 },
  "kot-vamp": { col: 2, row: 2 },
  "kot-discount": { col: 8, row: 0 },
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
      coord.col * 100,
      coord.row * 140,
      100,
      140,
      x,
      y,
      w,
      h
    );
  } else {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x, y, w, h);
  }

  // Official-style cream cost badge top-left cleanly covering source corner cost!
  if (opts.effCost !== undefined) {
    const bw = Math.max(26, Math.min(44, Math.round(w * 0.38)));
    const bh = Math.max(16, Math.min(26, Math.round(h * 0.22)));
    drawRoundedRect(ctx, x - 2, y - 2, bw + 2, bh + 2, 6);
    ctx.fillStyle = "#f5ebd6";
    ctx.fill();
    ctx.strokeStyle = "#1c1917";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    const fonts = getCanvasFontFamilies();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#0f172a";
    ctx.font = `900 ${Math.max(10, Math.round(bh * 0.65))}px ${fonts.mono}`;
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

/**
 * Draws a sculpted circular Kaiju Health Dial (matching the official red/blue King of Tokyo HP wheel!)
 */
export function drawKotHealthDial2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  hp: number,
  maxHp: number,
  tone: "red" | "blue"
) {
  ctx.save();
  const fonts = getCanvasFontFamilies();
  const mainCol = tone === "red" ? "#9f2b3b" : "#1e4b7a";
  const ringCol = tone === "red" ? "#e15b6d" : "#4b9ce2";
  const darkCol = tone === "red" ? "#4c121b" : "#0e2642";

  // Drop shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = darkCol;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Inner patterned dial face
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 3, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(cx, cy - radius * 0.25, radius * 0.1, cx, cy, radius);
  g.addColorStop(0, ringCol);
  g.addColorStop(0.75, mainCol);
  g.addColorStop(1, darkCol);
  ctx.fillStyle = g;
  ctx.fill();

  // HP progress arc around rim
  const frac = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
  ctx.strokeStyle = frac > 0.45 ? "#fde047" : "#fb7185";
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.stroke();

  // Top cutout HP number window (authentic physical board game dial notch!)
  const winW = Math.max(30, Math.round(radius * 0.72));
  const winH = Math.max(18, Math.round(radius * 0.42));
  drawRoundedRect(ctx, cx - winW / 2, cy - radius + 5, winW, winH, 6);
  ctx.fillStyle = "#f5ebd6";
  ctx.fill();
  ctx.strokeStyle = "#1c1917";
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = hp <= 3 ? "#dc2626" : "#0f172a";
  ctx.font = `900 ${Math.max(12, Math.round(winH * 0.72))}px ${fonts.mono}`;
  ctx.fillText(`${hp}`, cx, cy - radius + 5 + winH / 2 + 0.5);

  // Center official Heart (or Skull when KO!) + max HP label
  drawKotIcon2D(ctx, cx, cy + radius * 0.12, Math.round(radius * 0.78), hp <= 0 ? "skull" : "heart");
  ctx.fillStyle = "rgba(248, 250, 252, 0.85)";
  ctx.font = `800 ${Math.max(9, Math.round(radius * 0.24))}px ${fonts.mono}`;
  ctx.fillText(`/${maxHp}`, cx, cy + radius * 0.66);

  // Outer crisp rim
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "#f5ebd6";
  ctx.lineWidth = 2;
  ctx.stroke();
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
 * Draws a crisp 16-bit Kaiju Die at `(x, y, size, size)` — Ivory/Cream for standard dice,
 * Coral-Red for bonus extra dice (`isBonus = true`), with golden lock ring, padlock badge,
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
    const sy = isBonus ? 64 : r.sy;
    ctx.imageSmoothingEnabled = size < 44 || angle !== 0;
    if (ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality = "high";
    ctx.drawImage(atlas, r.sx, sy, r.sw, r.sh, lx, ly, size, size);
  } else {
    drawRoundedRect(ctx, lx, ly, size, size, 10);
    ctx.fillStyle = isBonus ? "#e2505a" : "#f4e0ba";
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
 * Draws the detailed 2D 16-bit Pixel Art Tokyo Duel Game Board with live zigzag Buzz Tokens
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

  // Live Buzz Tokens sitting inside their exact zigzag track circles!
  const tokenR = Math.max(10, Math.min(18, Math.round(w * 0.0255)));
  const pulse = 0.5 + 0.5 * Math.sin(opts.nowMs / 340);

  for (const bz of opts.buzzTokens) {
    const pt = getKotTrackNodeNorm(bz.track, bz.orientedPos);
    const bx = x + pt.nx * w;
    const by = y + pt.ny * h;

    ctx.save();
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
