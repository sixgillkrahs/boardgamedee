import { drawRoundedRect, getCanvasFontFamilies } from "@/canvas/engine";
import {
  KOT_MONSTERS,
  type KotDieFace,
  type KotMonsterId,
} from "@/cartridges/king-of-tokyo-duel";

export const KOT_MONSTER_ATLAS_URL = "/sprites/kot-duel-monsters-pixel.png";
export const KOT_BOARD_ATLAS_URL = "/sprites/kot-duel-boards-pixel.png";
export const KOT_DICE_ATLAS_URL = "/sprites/kot-duel-dice-pixel.png";

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
 * Draws a crisp 16-bit Black Kaiju Die at `(x, y, size, size)` with lock ring & tumbling wobble!
 */
export function drawKotDie2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  face: KotDieFace,
  locked: boolean,
  hovered = false
) {
  ctx.save();
  const lift = locked ? -5 : hovered ? -3 : 0;
  const dy = y + lift;

  // Grounded drop shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  drawRoundedRect(ctx, x + 2, y + 5, size, size, Math.round(size * 0.18));
  ctx.fill();

  if (locked) {
    ctx.shadowColor = "rgba(250, 204, 21, 0.85)";
    ctx.shadowBlur = 14;
  }

  const atlas = getKotDiceAtlas();
  if (atlas) {
    const r = KOT_DICE_RECTS[face];
    ctx.imageSmoothingEnabled = size < 44;
    if (ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality = "high";
    ctx.drawImage(atlas, r.sx, r.sy, r.sw, r.sh, x, dy, size, size);
  } else {
    drawRoundedRect(ctx, x, dy, size, size, 10);
    ctx.fillStyle = "#18181b";
    ctx.fill();
  }

  ctx.shadowBlur = 0;

  // Golden lock border & padlock mini badge when Kept!
  if (locked || hovered) {
    drawRoundedRect(ctx, x, dy, size, size, Math.round(size * 0.18));
    ctx.strokeStyle = locked ? "#facc15" : "rgba(255, 255, 255, 0.65)";
    ctx.lineWidth = locked ? 2.8 : 1.8;
    ctx.stroke();
  }

  if (locked) {
    const bx = x + size - 7;
    const by = dy + 7;
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
