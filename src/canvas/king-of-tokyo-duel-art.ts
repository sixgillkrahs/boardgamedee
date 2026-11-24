import { drawRoundedRect, getCanvasFontFamilies } from "@/canvas/engine";
import {
  KOT_MONSTERS,
  type KotDieFace,
  type KotMonsterId,
} from "@/cartridges/king-of-tokyo-duel";

export const KOT_MONSTER_ATLAS_URL = "/sprites/kot-duel-monsters-pixel.png";
export const KOT_DICE_ATLAS_URL = "/sprites/kot-duel-dice-pixel.png";

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
