import { drawRoundedRect, lerp } from "@/canvas/engine";
import {
  COUP_CHARACTER_META,
  type CoupCharacter,
} from "@/cartridges/coup";

/**
 * Draws a single 2D metallic gold coin at (cx, cy) with radius `r` using pure 2D Canvas primitives.
 */
export function drawCoupCoin2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Drop shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.beginPath();
  ctx.arc(1, 2, r, 0, Math.PI * 2);
  ctx.fill();

  // Outer bevelled metallic gold rim
  const rimGrad = ctx.createLinearGradient(-r, -r, r, r);
  rimGrad.addColorStop(0, "#fef08a");
  rimGrad.addColorStop(0.5, "#eab308");
  rimGrad.addColorStop(1, "#a16207");
  ctx.fillStyle = rimGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#713f12";
  ctx.lineWidth = Math.max(1, r * 0.1);
  ctx.stroke();

  // Inner recessed coin face
  const faceR = r * 0.76;
  const faceGrad = ctx.createRadialGradient(
    -faceR * 0.25,
    -faceR * 0.25,
    faceR * 0.1,
    0,
    0,
    faceR
  );
  faceGrad.addColorStop(0, "#fde047");
  faceGrad.addColorStop(0.7, "#ca8a04");
  faceGrad.addColorStop(1, "#854d0e");
  ctx.fillStyle = faceGrad;
  ctx.beginPath();
  ctx.arc(0, 0, faceR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(254, 240, 138, 0.65)";
  ctx.lineWidth = Math.max(0.8, r * 0.07);
  ctx.stroke();

  // Embossed 4-pointed royal diamond star in the center of the coin
  const starR = r * 0.44;
  const innerR = r * 0.16;
  ctx.fillStyle = "#fef9c3";
  ctx.strokeStyle = "#713f12";
  ctx.lineWidth = Math.max(0.7, r * 0.06);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4 - Math.PI / 2;
    const rad = i % 2 === 0 ? starR : innerR;
    const px = Math.cos(ang) * rad;
    const py = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a player's 2D gold coin stack and numeric badge at (x, y).
 */
export function drawCoupCoinStack2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  coins: number,
  coinRadius = 11
) {
  ctx.save();

  const visibleCoins = Math.min(coins, 10);
  for (let i = 0; i < visibleCoins; i++) {
    const col = Math.floor(i / 5);
    const row = i % 5;
    const offsetX = (col - (coins > 5 ? 0.5 : 0)) * (coinRadius * 1.45);
    const offsetY = -row * (coinRadius * 0.42);
    drawCoupCoin2D(ctx, cx + offsetX, cy + offsetY, coinRadius);
  }

  if (coins === 0) {
    // Empty coin ring outline
    ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(cx, cy, coinRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Crisp 2D numeric coin count pill below stack
  const pillW = 42;
  const pillH = 18;
  drawRoundedRect(
    ctx,
    cx - pillW / 2,
    cy + coinRadius + 4,
    pillW,
    pillH,
    9
  );
  ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
  ctx.fill();
  ctx.strokeStyle = coins >= 10 ? "#ef4444" : "#f59e0b";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = coins >= 10 ? "#fca5a5" : "#fde047";
  ctx.font = "bold 10.5px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${coins} xu`, cx, cy + coinRadius + 13);

  ctx.restore();
}

/**
 * Draws the 2D vector illustration for one of the 5 Coup Characters inside a card frame.
 */
function drawCoupCharacterArt2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  character: CoupCharacter
) {
  const cx = x + w * 0.5;
  const cy = y + h * 0.44;
  const s = Math.min(w, h);

  ctx.save();

  if (character === "Duke") {
    // Imperial Purple & Royal Velvet Gradient
    const bg = ctx.createRadialGradient(cx, cy, s * 0.05, cx, cy, s * 0.75);
    bg.addColorStop(0, "#6b21a8");
    bg.addColorStop(0.65, "#3b0764");
    bg.addColorStop(1, "#1e1b4b");
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);

    // Subtle golden sun-rays behind the Ducal Crown
    ctx.strokeStyle = "rgba(250, 204, 21, 0.2)";
    ctx.lineWidth = Math.max(1.5, s * 0.025);
    for (let r = 0; r < 12; r++) {
      const ang = (r * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * s * 0.5, cy + Math.sin(ang) * s * 0.5);
      ctx.stroke();
    }

    // Crimson velvet cushion inside the crown
    ctx.fillStyle = "#991b1b";
    ctx.beginPath();
    ctx.ellipse(cx, cy - s * 0.05, s * 0.25, s * 0.16, 0, Math.PI, 0, false);
    ctx.fill();

    // 3-Pointed Golden Ducal Crown
    const crownGrad = ctx.createLinearGradient(
      cx - s * 0.28,
      cy - s * 0.24,
      cx + s * 0.28,
      cy + s * 0.12
    );
    crownGrad.addColorStop(0, "#fef08a");
    crownGrad.addColorStop(0.5, "#eab308");
    crownGrad.addColorStop(1, "#a16207");
    ctx.fillStyle = crownGrad;
    ctx.strokeStyle = "#422006";
    ctx.lineWidth = Math.max(1.5, s * 0.022);

    ctx.beginPath();
    ctx.moveTo(cx - s * 0.24, cy + s * 0.06);
    ctx.lineTo(cx - s * 0.28, cy - s * 0.18);
    ctx.lineTo(cx - s * 0.12, cy - s * 0.06);
    ctx.lineTo(cx, cy - s * 0.25);
    ctx.lineTo(cx + s * 0.12, cy - s * 0.06);
    ctx.lineTo(cx + s * 0.28, cy - s * 0.18);
    ctx.lineTo(cx + s * 0.24, cy + s * 0.06);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crown jewels (Ruby & Emeralds)
    const jewels: [number, number, string][] = [
      [0, -0.02, "#dc2626"],
      [-0.14, 0.0, "#10b981"],
      [0.14, 0.0, "#10b981"],
    ];
    for (const [jx, jy, col] of jewels) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(cx + jx * s, cy + jy * s, s * 0.032, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Three 2D Gold Coins below the crown (symbolizing +3 Coin Tax)
    drawCoupCoin2D(ctx, cx - s * 0.17, cy + s * 0.22, s * 0.085);
    drawCoupCoin2D(ctx, cx + s * 0.17, cy + s * 0.22, s * 0.085);
    drawCoupCoin2D(ctx, cx, cy + s * 0.24, s * 0.095);
  } else if (character === "Assassin") {
    // Deep Blood-Crimson & Shadow Black Backdrop
    const bg = ctx.createRadialGradient(cx, cy, s * 0.05, cx, cy, s * 0.75);
    bg.addColorStop(0, "#7f1d1d");
    bg.addColorStop(0.6, "#270909");
    bg.addColorStop(1, "#09090b");
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);

    // Dark Hooded Cowl Silhouette
    ctx.fillStyle = "#09090b";
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = Math.max(1.2, s * 0.018);
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.28);
    ctx.quadraticCurveTo(cx + s * 0.28, cy - s * 0.1, cx + s * 0.26, cy + s * 0.18);
    ctx.lineTo(cx - s * 0.26, cy + s * 0.18);
    ctx.quadraticCurveTo(cx - s * 0.28, cy - s * 0.1, cx, cy - s * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing Crimson Eyes inside the Hood
    ctx.fillStyle = "#ef4444";
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + dir * s * 0.04, cy - s * 0.06);
      ctx.lineTo(cx + dir * s * 0.13, cy - s * 0.09);
      ctx.lineTo(cx + dir * s * 0.09, cy - s * 0.04);
      ctx.closePath();
      ctx.fill();
    }

    // Crossed Silver Daggers in the foreground
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.translate(cx, cy + s * 0.1);
      ctx.rotate(dir * 0.68);

      // Steel blade
      const bladeGrad = ctx.createLinearGradient(-s * 0.04, 0, s * 0.04, 0);
      bladeGrad.addColorStop(0, "#f8fafc");
      bladeGrad.addColorStop(0.5, "#94a3b8");
      bladeGrad.addColorStop(1, "#475569");
      ctx.fillStyle = bladeGrad;
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = Math.max(1, s * 0.014);
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.3);
      ctx.lineTo(s * 0.045, s * 0.06);
      ctx.lineTo(-s * 0.045, s * 0.06);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Crimson blood tip on blade
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.3);
      ctx.lineTo(s * 0.02, -s * 0.18);
      ctx.lineTo(-s * 0.02, -s * 0.18);
      ctx.closePath();
      ctx.fill();

      // Golden crossguard & hilt
      ctx.fillStyle = "#eab308";
      drawRoundedRect(ctx, -s * 0.09, s * 0.05, s * 0.18, s * 0.035, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#7f1d1d";
      drawRoundedRect(ctx, -s * 0.026, s * 0.085, s * 0.052, s * 0.12, 3);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  } else if (character === "Captain") {
    // Deep Maritime Navy-Cyan Backdrop
    const bg = ctx.createRadialGradient(cx, cy, s * 0.05, cx, cy, s * 0.75);
    bg.addColorStop(0, "#0284c7");
    bg.addColorStop(0.65, "#0c4a6e");
    bg.addColorStop(1, "#082f49");
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);

    // Ship's Wheel / Naval Helm spokes in 2D
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = Math.max(2, s * 0.035);
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(cx, cy + s * 0.04);
      ctx.lineTo(
        cx + Math.cos(ang) * s * 0.28,
        cy + s * 0.04 + Math.sin(ang) * s * 0.28
      );
      ctx.stroke();
    }

    // Helm outer & inner brass rings
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = Math.max(3, s * 0.05);
    ctx.beginPath();
    ctx.arc(cx, cy + s * 0.04, s * 0.2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(cx, cy + s * 0.04, s * 0.075, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Captain's Tricorn Hat at top of helm
    ctx.fillStyle = "#0f172a";
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = Math.max(1.5, s * 0.022);
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.28, cy - s * 0.12);
    ctx.quadraticCurveTo(cx, cy - s * 0.34, cx + s * 0.28, cy - s * 0.12);
    ctx.quadraticCurveTo(cx, cy - s * 0.06, cx - s * 0.28, cy - s * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (character === "Ambassador") {
    // Diplomatic Emerald-Jade Court Backdrop
    const bg = ctx.createRadialGradient(cx, cy, s * 0.05, cx, cy, s * 0.75);
    bg.addColorStop(0, "#059669");
    bg.addColorStop(0.65, "#064e3b");
    bg.addColorStop(1, "#022c22");
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);

    // Two overlapping miniature 2D cards being exchanged
    for (const [dx, dy, rot, col] of [
      [-0.08, -0.04, -0.18, "#fde68a"],
      [0.08, 0.02, 0.18, "#a7f3d0"],
    ] as const) {
      ctx.save();
      ctx.translate(cx + dx * s, cy + dy * s);
      ctx.rotate(rot);
      drawRoundedRect(ctx, -s * 0.14, -s * 0.2, s * 0.28, s * 0.38, 6);
      ctx.fillStyle = "#fef3c7";
      ctx.fill();
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = Math.max(1.5, s * 0.02);
      ctx.stroke();

      // Crimson wax seal in center of scroll card
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.065, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // Circular Golden Exchange Arrows around the two cards
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = Math.max(2, s * 0.032);
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.28, -Math.PI * 0.8, -Math.PI * 0.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.28, Math.PI * 0.2, Math.PI * 0.85);
    ctx.stroke();
  } else {
    // Contessa: Baroque Amber-Burgundy & Venetian Golden Mask + Shield
    const bg = ctx.createRadialGradient(cx, cy, s * 0.05, cx, cy, s * 0.75);
    bg.addColorStop(0, "#b45309");
    bg.addColorStop(0.6, "#7c2d12");
    bg.addColorStop(1, "#270a04");
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);

    // Golden Protective Shield behind the mask
    ctx.fillStyle = "rgba(251, 191, 36, 0.22)";
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = Math.max(2, s * 0.026);
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.26);
    ctx.lineTo(cx + s * 0.24, cy - s * 0.16);
    ctx.quadraticCurveTo(cx + s * 0.24, cy + s * 0.14, cx, cy + s * 0.28);
    ctx.quadraticCurveTo(
      cx - s * 0.24,
      cy + s * 0.14,
      cx - s * 0.24,
      cy - s * 0.16
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Venetian Masquerade Mask in Ivory & Gold
    ctx.fillStyle = "#fef3c7";
    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = Math.max(1.5, s * 0.022);
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.22, cy - s * 0.04);
    ctx.quadraticCurveTo(cx - s * 0.12, cy - s * 0.16, cx, cy - s * 0.08);
    ctx.quadraticCurveTo(
      cx + s * 0.12,
      cy - s * 0.16,
      cx + s * 0.22,
      cy - s * 0.04
    );
    ctx.quadraticCurveTo(
      cx + s * 0.14,
      cy + s * 0.1,
      cx + s * 0.04,
      cy + s * 0.04
    );
    ctx.lineTo(cx, cy + s * 0.08);
    ctx.lineTo(cx - s * 0.04, cy + s * 0.04);
    ctx.quadraticCurveTo(
      cx - s * 0.14,
      cy + s * 0.1,
      cx - s * 0.22,
      cy - s * 0.04
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cat-eye mask openings
    ctx.fillStyle = "#1c1917";
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(
        cx + dir * s * 0.1,
        cy - s * 0.03,
        s * 0.048,
        s * 0.022,
        dir * -0.2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Draws a 2D Coup Character Card (or Royal Card Back if `character` is null)
 * at `(x, y)` with dimensions `(w, h)`.
 */
export function drawCoupCard2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  character: CoupCharacter | null,
  revealed = false,
  highlighted = false
) {
  ctx.save();
  const radius = Math.max(5, Math.min(w, h) * 0.1);

  // Drop shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  drawRoundedRect(ctx, x + 2, y + 3, w, h, radius);
  ctx.fill();

  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.clip();

  if (character === null) {
    // Royal Coup Card Back (2D Filigree & Crown Emblem)
    const backGrad = ctx.createLinearGradient(x, y, x + w, y + h);
    backGrad.addColorStop(0, "#1e1b4b");
    backGrad.addColorStop(0.5, "#31102f");
    backGrad.addColorStop(1, "#0f172a");
    ctx.fillStyle = backGrad;
    ctx.fillRect(x, y, w, h);

    // Inner gold filigree border
    const pad = Math.max(4, w * 0.09);
    ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
    ctx.lineWidth = 1.4;
    drawRoundedRect(ctx, x + pad, y + pad, w - pad * 2, h - pad * 2, radius * 0.6);
    ctx.stroke();

    // Central 2D geometric crown medallion on card back
    const cx = x + w * 0.5;
    const cy = y + h * 0.5;
    const r = Math.min(w, h) * 0.25;
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Mini 2D crown vector inside the back medallion
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.55, cy + r * 0.35);
    ctx.lineTo(cx - r * 0.65, cy - r * 0.3);
    ctx.lineTo(cx - r * 0.25, cy);
    ctx.lineTo(cx, cy - r * 0.5);
    ctx.lineTo(cx + r * 0.25, cy);
    ctx.lineTo(cx + r * 0.65, cy - r * 0.3);
    ctx.lineTo(cx + r * 0.55, cy + r * 0.35);
    ctx.closePath();
    ctx.fill();
  } else {
    drawCoupCharacterArt2D(ctx, x, y, w, h, character);

    // Bottom Character Name Banner
    const meta = COUP_CHARACTER_META[character];
    const bannerH = Math.max(18, h * 0.24);
    ctx.fillStyle = "rgba(9, 9, 11, 0.88)";
    ctx.fillRect(x, y + h - bannerH, w, bannerH);

    ctx.strokeStyle = meta.accentColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y + h - bannerH);
    ctx.lineTo(x + w, y + h - bannerH);
    ctx.stroke();

    ctx.fillStyle = "#fef3c7";
    ctx.font = `bold ${Math.max(8, Math.round(w * 0.145))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      meta.titleVi,
      x + w * 0.5,
      y + h - bannerH * 0.5
    );
  }

  // If the card has been revealed (lost Influence), draw a dark crimson wash and 2D diagonal slash stamp
  if (revealed) {
    ctx.fillStyle = "rgba(15, 10, 15, 0.58)";
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = Math.max(2.5, w * 0.06);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.15, y + h * 0.15);
    ctx.lineTo(x + w * 0.85, y + h * 0.78);
    ctx.moveTo(x + w * 0.85, y + h * 0.15);
    ctx.lineTo(x + w * 0.15, y + h * 0.78);
    ctx.stroke();
  }

  // Card Outer Frame Border
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.strokeStyle = highlighted
    ? "#fde047"
    : revealed
      ? "#dc2626"
      : character
        ? COUP_CHARACTER_META[character].accentColor
        : "#475569";
  ctx.lineWidth = highlighted ? 3.5 : 2.2;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws the central Court Deck stack and Treasury gold coins in 2D at the center of the table.
 */
export function drawCoupCenterTreasuryAndDeck2D(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  courtDeckCount: number,
  nowMs: number
) {
  ctx.save();

  // 1. Left of center: Stacked 2D Court Deck
  const deckW = 48;
  const deckH = 66;
  const deckX = centerX - 96;
  const deckY = centerY - deckH / 2;

  for (let layer = 2; layer >= 0; layer--) {
    drawCoupCard2D(
      ctx,
      deckX - layer * 2.5,
      deckY - layer * 2.5,
      deckW,
      deckH,
      null,
      false,
      false
    );
  }

  // Deck count pill
  drawRoundedRect(ctx, deckX - 8, deckY + deckH + 5, deckW + 16, 18, 9);
  ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
  ctx.fill();
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#e0f2fe";
  ctx.font = "bold 9.5px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`Bộ bài: ${courtDeckCount}`, deckX + deckW / 2, deckY + deckH + 14);

  // 2. Right of center: Central Treasury 2D Gold Coin Pile
  const treasX = centerX + 74;
  const treasY = centerY + 6;
  const coinOffsets: [number, number][] = [
    [-14, 6],
    [12, 8],
    [0, 4],
    [-10, -2],
    [10, -1],
    [0, -6],
    [-4, -13],
    [6, -12],
  ];
  for (const [ox, oy] of coinOffsets) {
    drawCoupCoin2D(ctx, treasX + ox, treasY + oy, 11);
  }

  // Subtle shimmer pulse on top coin
  const pulse = 0.5 + 0.5 * Math.sin(nowMs / 260);
  ctx.fillStyle = `rgba(254, 249, 195, ${0.25 * pulse})`;
  ctx.beginPath();
  ctx.arc(treasX, treasY - 8, 16, 0, Math.PI * 2);
  ctx.fill();

  drawRoundedRect(ctx, treasX - 34, deckY + deckH + 5, 68, 18, 9);
  ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
  ctx.fill();
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#fde047";
  ctx.font = "bold 9.5px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Kho Bạc", treasX, deckY + deckH + 14);

  ctx.restore();
}
