import { drawRoundedRect, getCanvasFontFamilies } from "@/canvas/engine";
import {
  DMD_SUIT_META,
  type DmdCard,
  type DmdSuit,
} from "@/cartridges/dead-mans-draw";

export const DMD_CARD_ATLAS_URL = "/sprites/dead-mans-draw-cards-pixel.png";
export const DMD_CARD_TILE_W = 120;
export const DMD_CARD_TILE_H = 170;

export type DmdSpriteKey = DmdSuit | "Back";

export interface DmdAtlasRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export const DMD_CARD_ATLAS_RECTS: Record<DmdSpriteKey, DmdAtlasRect> = {
  Anchor: { sx: 0, sy: 0, sw: 120, sh: 170 },
  Cannon: { sx: 120, sy: 0, sw: 120, sh: 170 },
  Chest: { sx: 240, sy: 0, sw: 120, sh: 170 },
  Hook: { sx: 360, sy: 0, sw: 120, sh: 170 },
  Key: { sx: 480, sy: 0, sw: 120, sh: 170 },
  Map: { sx: 600, sy: 0, sw: 120, sh: 170 },
  Mermaid: { sx: 720, sy: 0, sw: 120, sh: 170 },
  Oracle: { sx: 840, sy: 0, sw: 120, sh: 170 },
  Sword: { sx: 960, sy: 0, sw: 120, sh: 170 },
  Kraken: { sx: 1080, sy: 0, sw: 120, sh: 170 },
  Back: { sx: 1200, sy: 0, sw: 120, sh: 170 },
};

/** Official woodcut corner-digit ink colors matching the printed Dead Man's Draw deck */
const DMD_INK_COLOR: Record<DmdSuit, string> = {
  Anchor: "#f8fafc",
  Cannon: "#dc2626",
  Chest: "#f59e0b",
  Hook: "#5eead4",
  Key: "#facc15",
  Map: "#9a7348",
  Mermaid: "#84cc16",
  Oracle: "#c084fc",
  Sword: "#60a5fa",
  Kraken: "#94a3b8",
};

let cachedDmdAtlas: HTMLImageElement | null = null;
let dmdAtlasLoaded = false;
const dmdAtlasListeners = new Set<() => void>();

export function getDmdCardPixelAtlas(
  onLoad?: () => void
): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (dmdAtlasLoaded && cachedDmdAtlas) return cachedDmdAtlas;
  if (onLoad) dmdAtlasListeners.add(onLoad);
  if (!cachedDmdAtlas) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      dmdAtlasLoaded = true;
      dmdAtlasListeners.forEach((fn) => fn());
      dmdAtlasListeners.clear();
    };
    img.src = DMD_CARD_ATLAS_URL;
    cachedDmdAtlas = img;
  }
  return dmdAtlasLoaded ? cachedDmdAtlas : null;
}

/**
 * Draws a rich 16-bit 2D pixel-art Pirate Galleon Captain's Table background:
 * weathered oak planks, brass compass rose inlay, warm flickering lantern glow, and abyssal vignette.
 */
export function drawDmdPirateBackground2D(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  nowMs: number
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // 1. Deep dark weathered pirate oak planks (pixelated horizontal boards)
  const P = 4;
  const plankH = 44;
  ctx.fillStyle = "#16100c";
  ctx.fillRect(0, 0, width, height);

  for (let py = 0; py < height; py += plankH) {
    const idx = Math.floor(py / plankH);
    const shade = idx % 2 === 0 ? "#1f1610" : "#1a120d";
    ctx.fillStyle = shade;
    ctx.fillRect(0, py, width, plankH - P);

    // Subtle pixel wood grain lines
    ctx.fillStyle = "rgba(180, 128, 68, 0.055)";
    ctx.fillRect(0, py + P * 2, width, P);
    ctx.fillRect(0, py + plankH - P * 3, width, P);

    // Plank dark caulking seam
    ctx.fillStyle = "#0c0806";
    ctx.fillRect(0, py + plankH - P, width, P);

    // Occasional vertical plank joint with brass nail studs
    const jointX = Math.floor(((idx * 237 + 110) % Math.max(240, width)) / P) * P;
    ctx.fillStyle = "#0c0806";
    ctx.fillRect(jointX, py, P, plankH);
    ctx.fillStyle = "#78532a";
    ctx.fillRect(jointX - P * 2, py + P * 2, P, P);
    ctx.fillRect(jointX + P * 2, py + P * 2, P, P);
    ctx.fillRect(jointX - P * 2, py + plankH - P * 4, P, P);
    ctx.fillRect(jointX + P * 2, py + plankH - P * 4, P, P);
  }

  // 2. Subtle sunken green-teal captain's chart mat in center arena
  const matX = Math.round(width * 0.06);
  const matY = Math.round(height * 0.24);
  const matW = Math.round(width * 0.88);
  const matH = Math.round(height * 0.44);
  drawRoundedRect(ctx, matX, matY, matW, matH, 18);
  ctx.fillStyle = "rgba(11, 29, 36, 0.68)";
  ctx.fill();
  ctx.strokeStyle = "rgba(217, 169, 72, 0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner brass nautical compass rose watermark at table center
  const cx = width * 0.5;
  const cy = matY + matH * 0.5;
  const compR = Math.min(matW, matH) * 0.34;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = "rgba(234, 179, 8, 0.11)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, compR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, compR * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const len = i % 2 === 0 ? compR * 1.08 : compR * 0.76;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Warm flickering ship-lantern candlelight radial glow from top-center & corners
  const flicker = 0.92 + 0.08 * Math.sin(nowMs / 180) * Math.cos(nowMs / 310);
  const glow = ctx.createRadialGradient(
    cx,
    height * 0.44,
    20,
    cx,
    height * 0.44,
    Math.max(width, height) * 0.65
  );
  glow.addColorStop(0, `rgba(251, 191, 36, ${0.09 * flicker})`);
  glow.addColorStop(0.55, "rgba(15, 23, 42, 0.08)");
  glow.addColorStop(1, "rgba(3, 6, 12, 0.62)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

export interface DmdCardDrawOpts {
  highlighted?: boolean;
  protectedByAnchor?: boolean;
  bustRisk?: boolean;
  dimmed?: boolean;
  stackCount?: number;
  badgeText?: string;
}

/**
 * Draws a crisp 16-bit pixel-art Dead Man's Draw loot card (or Pirate Card Back if `card === null`).
 */
export function drawDmdCard2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  card: DmdCard | null,
  opts: DmdCardDrawOpts = {}
) {
  ctx.save();
  const radius = Math.max(5, Math.min(w, h) * 0.09);

  // Drop shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.52)";
  drawRoundedRect(ctx, x + 2, y + 4, w, h, radius);
  ctx.fill();

  if (opts.highlighted) {
    ctx.save();
    ctx.shadowColor = opts.bustRisk
      ? "rgba(244, 63, 94, 0.85)"
      : "rgba(250, 204, 21, 0.85)";
    ctx.shadowBlur = 14;
    drawRoundedRect(ctx, x, y, w, h, radius);
    ctx.fillStyle = opts.bustRisk ? "#f43f5e" : "#facc15";
    ctx.fill();
    ctx.restore();
  }

  // Clip card interior
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.clip();

  const atlas = getDmdCardPixelAtlas();
  const key: DmdSpriteKey = card ? card.suit : "Back";
  if (atlas) {
    const rect = DMD_CARD_ATLAS_RECTS[key];
    ctx.imageSmoothingEnabled = w < 54;
    if (ctx.imageSmoothingEnabled) {
      ctx.imageSmoothingQuality = "high";
    }
    ctx.drawImage(atlas, rect.sx, rect.sy, rect.sw, rect.sh, x, y, w, h);
  } else {
    // Clean fallback while sprite atlas loads
    ctx.fillStyle = card ? "#1e293b" : "#1c1512";
    ctx.fillRect(x, y, w, h);
    if (card) {
      ctx.fillStyle = DMD_SUIT_META[card.suit].color;
      ctx.font = `bold ${Math.round(w * 0.36)}px ${getCanvasFontFamilies().sans}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(DMD_SUIT_META[card.suit].emoji, x + w * 0.5, y + h * 0.45);
    }
  }

  if (card) {
    const fonts = getCanvasFontFamilies();
    const inkColor = DMD_INK_COLOR[card.suit];
    const numFontPx = Math.max(12, Math.round(w * 0.255));
    const drawCornerDigit = (cx: number, cy: number, rotated: boolean) => {
      ctx.save();
      ctx.translate(cx, cy);
      if (rotated) ctx.rotate(Math.PI);
      ctx.font = `900 ${numFontPx}px ${fonts.sans}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // Deep woodcut dark-brown ink outline matching the printed card art
      ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(2.2, numFontPx * 0.2);
      ctx.strokeStyle = "#1c130b";
      ctx.strokeText(String(card.value), 0, 0);
      ctx.fillStyle = inkColor;
      ctx.fillText(String(card.value), 0, 0);
      ctx.restore();
    };

    // Top-left & Bottom-right inverted official pirate card numbers (aligned right above/below the mini suit icons!)
    drawCornerDigit(x + w * 0.125, y + h * 0.105, false);
    if (w >= 46) {
      drawCornerDigit(x + w * 0.875, y + h * 0.895, true);
    }
  }

  if (opts.dimmed) {
    ctx.fillStyle = "rgba(2, 6, 23, 0.48)";
    ctx.fillRect(x, y, w, h);
  }

  ctx.restore(); // end clip

  // Card outer border
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.strokeStyle = opts.bustRisk
    ? "#fb7185"
    : opts.highlighted
      ? "#fde047"
      : opts.protectedByAnchor
        ? "#38bdf8"
        : card
          ? DMD_SUIT_META[card.suit].color
          : "#b45309";
  ctx.lineWidth = opts.highlighted ? 2.8 : opts.protectedByAnchor ? 2.4 : 1.7;
  ctx.stroke();

  // Anchor protection mini shield pill at top-right
  if (opts.protectedByAnchor && w >= 46) {
    const px = x + w - 11;
    const py = y + 11;
    ctx.fillStyle = "rgba(12, 74, 110, 0.95)";
    ctx.beginPath();
    ctx.arc(px, py, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#7dd3fc";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = "#e0f2fe";
    ctx.font = `bold 9px ${getCanvasFontFamilies().sans}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⚓", px, py + 0.5);
  }

  // Stack count badge (e.g. x2, x3) for banked suit piles
  if (opts.stackCount && opts.stackCount > 1) {
    const bx = x + w - 4;
    const by = y + h - 4;
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(bx - 5, by - 5, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = "#fde68a";
    ctx.font = `800 8.5px ${getCanvasFontFamilies().mono}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`×${opts.stackCount}`, bx - 5, by - 4.5);
  }

  // Optional status pill badge below/above card (e.g. Map safe/bust)
  if (opts.badgeText) {
    const bw = Math.max(w * 0.94, 62);
    const bh = 18;
    const bx = x + (w - bw) / 2;
    const by = y + h + 6;
    drawRoundedRect(ctx, bx, by, bw, bh, 9);
    ctx.fillStyle = opts.bustRisk
      ? "rgba(159, 18, 57, 0.95)"
      : "rgba(6, 95, 70, 0.95)";
    ctx.fill();
    ctx.strokeStyle = opts.bustRisk ? "#fda4af" : "#6ee7b7";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 9.5px ${getCanvasFontFamilies().sans}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(opts.badgeText, bx + bw / 2, by + bh / 2);
  }

  ctx.restore();
}
