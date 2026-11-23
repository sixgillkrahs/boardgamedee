import { drawRoundedRect } from "@/canvas/engine";
import { drawSplendorPixelGemIcon2D } from "@/canvas/splendor-art";
import {
  DUEL_SPIRAL_ORDER,
  DUEL_TOKEN_META,
  type DuelCardPower,
  type DuelJewelCard,
  type DuelRoyalCard,
  type DuelTokenColor,
} from "@/cartridges/splendor-duel";
import {
  SPLENDOR_GEMS,
  type SplendorGemColor,
} from "@/cartridges/splendor";

/**
 * Draws a crisp 16-bit 2D Pixel-Art Royal Duelling Vault background for Splendor Duel (`P = 4`).
 */
export function drawDuelPixelBackground2D(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  nowMs: number
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const P = 4;
  const cols = Math.ceil(width / P);
  const rows = Math.ceil(height / P);
  const topWallRows = Math.floor((height * 0.16) / P);

  const fillPx = (gx: number, gy: number, gw = 1, gh = 1, col?: string) => {
    if (col) ctx.fillStyle = col;
    ctx.fillRect(gx * P, gy * P, gw * P, gh * P);
  };

  // 1. Upper Obsidian-Plum Stone Duelling Gallery Wall
  fillPx(0, 0, cols, topWallRows, "#130d1d");
  for (let r = 0; r < topWallRows; r += 3) {
    const off = (Math.floor(r / 3) % 2) * 4;
    for (let c = -off; c < cols; c += 8) {
      fillPx(c, r, 7, 2, "#1c132b");
      fillPx(c, r, 7, 1, "#271b3b");
    }
  }

  // Twin Duelling Tapestry Banners on Left & Right Walls (Crimson vs Royal Sapphire)
  const flameFrame = Math.floor(nowMs / 170) % 3;
  for (const [frac, bannerCol, trimCol] of [
    [0.08, "#7f1d1d", "#fbbf24"],
    [0.92, "#1e3a8a", "#fbbf24"],
  ] as const) {
    const bx = Math.floor((width * frac) / P);
    fillPx(bx - 4, 1, 9, Math.max(6, topWallRows - 2), bannerCol);
    fillPx(bx - 3, 2, 7, 1, trimCol);
    fillPx(bx - 1, 4, 3, 3, trimCol);
    // Flickering pixel torch sconce next to each banner
    const tx = frac < 0.5 ? bx + 7 : bx - 8;
    const ty = Math.max(4, topWallRows - 4);
    fillPx(tx, ty, 1, 3, "#a16207");
    fillPx(tx, ty - 1, 1, 1, flameFrame === 0 ? "#f97316" : "#fde047");
    fillPx(tx, ty - 2 - (flameFrame === 1 ? 1 : 0), 1, 1, "#fef08a");
  }

  // Gold & Obsidian Divider Trim
  fillPx(0, topWallRows, cols, 2, "#3b1d2e");
  fillPx(0, topWallRows, cols, 1, "#ca8a04");
  for (let c = 2; c < cols; c += 6) {
    fillPx(c, topWallRows, 2, 1, "#fef08a");
  }

  // 2. Deep Royal Indigo-Velvet Duelling Table Mat with Pixel Dithered Weave
  const matStart = topWallRows + 2;
  fillPx(0, matStart, cols, rows - matStart, "#0e1024");
  for (let r = matStart; r < rows; r += 2) {
    ctx.fillStyle =
      r < matStart + 5 ? "#161936" : r > rows - 7 ? "#090a17" : "#12152e";
    ctx.fillRect(0, r * P, width, P);
    if (r % 4 === 0) {
      ctx.fillStyle = "#1b1f42";
      for (let c = (r / 2) % 2 === 0 ? 0 : 2; c < cols; c += 4) {
        ctx.fillRect(c * P, r * P, P * 2, P);
      }
    }
  }

  // Outer Pixel Gold Filigree Table Frame
  const pad = 2;
  const topR = matStart + 1;
  const botR = rows - 2;
  if (botR > topR + 4) {
    fillPx(pad, topR, cols - pad * 2, 1, "#ca8a04");
    fillPx(pad, botR, cols - pad * 2, 1, "#ca8a04");
    fillPx(pad, topR, 1, botR - topR + 1, "#ca8a04");
    fillPx(cols - pad - 1, topR, 1, botR - topR + 1, "#ca8a04");

    for (const [cx, cy] of [
      [pad, topR],
      [cols - pad - 1, topR],
      [pad, botR],
      [cols - pad - 1, botR],
    ] as const) {
      fillPx(cx - 1, cy - 1, 3, 3, "#eab308");
      fillPx(cx, cy, 1, 1, "#fef08a");
    }
  }

  ctx.restore();
}

/**
 * Draws a 16-bit Pixel-Art Token Icon for Splendor Duel (5 Gems + Opalescent Pink Pearl + Gold).
 */
export function drawDuelPixelTokenIcon2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: DuelTokenColor
) {
  if (color !== "pearl") {
    drawSplendorPixelGemIcon2D(ctx, cx, cy, size, color);
    return;
  }

  // Opalescent 16-bit Pixel-Art Pink Pearl Sphere
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const u = Math.max(1.2, size / 10);
  const ox = Math.round(cx - u * 5);
  const oy = Math.round(cy - u * 5);
  const px = (gx: number, gy: number, gw: number, gh: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.fillRect(
      Math.round(ox + gx * u),
      Math.round(oy + gy * u),
      Math.max(1, Math.round(gw * u)),
      Math.max(1, Math.round(gh * u))
    );
  };

  // Dark rose outline
  px(3, 1, 4, 8, "#500724");
  px(1, 3, 8, 4, "#500724");
  px(2, 2, 6, 6, "#500724");
  // Rose-pink pearl sphere body
  px(3, 2, 4, 6, "#f472b6");
  px(2, 3, 6, 4, "#f472b6");
  // Soft opalescent inner glow
  px(3, 2, 3, 3, "#fbcfe8");
  px(2, 3, 2, 2, "#fdf2f8");
  // Crisp pure-white pixel specular glint
  px(3, 3, 1, 1, "#ffffff");
  // Deep rose lower rim shadow
  px(5, 6, 2, 1, "#be185d");

  ctx.restore();
}

/**
 * Draws a 16-bit Pixel-Art Token Chip sitting inside a 5x5 Spiral Board cell.
 */
export function drawDuelPixelTokenChip2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: DuelTokenColor,
  selected = false,
  matchingHighlight = false
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const meta = DUEL_TOKEN_META[color];

  if (selected || matchingHighlight) {
    ctx.strokeStyle = selected ? "#fde047" : "#4ade80";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 3.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Pixel drop shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.beginPath();
  ctx.arc(cx + 1.5, cy + 2.5, r, 0, Math.PI * 2);
  ctx.fill();

  // Chip outer rim
  ctx.fillStyle =
    color === "gold"
      ? "#eab308"
      : color === "pearl"
        ? "#fbcfe8"
        : "#cbd5e1";
  ctx.strokeStyle = "#090d16";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 4 pixel accents on rim
  ctx.fillStyle = meta.hex;
  for (const ang of [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]) {
    ctx.fillRect(
      Math.round(cx + Math.cos(ang) * r * 0.78 - 1.5),
      Math.round(cy + Math.sin(ang) * r * 0.78 - 1.5),
      3,
      3
    );
  }

  // Recessed center bezel
  ctx.fillStyle = color === "white" ? "#334155" : "#0f172a";
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2);
  ctx.fill();

  drawDuelPixelTokenIcon2D(ctx, cx, cy, r * 1.15, color);
  ctx.restore();
}

/**
 * Draws a 16-bit Pixel-Art Privilege Scroll (`📜`).
 */
export function drawDuelPixelPrivilegeScroll2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  active = false
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  drawRoundedRect(ctx, x, y, w, h, 4);
  ctx.fillStyle = active ? "#fef3c7" : "#d6c5a3";
  ctx.fill();
  ctx.strokeStyle = active ? "#fde047" : "#78350f";
  ctx.lineWidth = active ? 2.2 : 1.4;
  ctx.stroke();

  // Wooden scroll rollers on left & right ends
  ctx.fillStyle = "#92400e";
  ctx.fillRect(Math.round(x - 2), Math.round(y + 1), 4, Math.round(h - 2));
  ctx.fillRect(Math.round(x + w - 2), Math.round(y + 1), 4, Math.round(h - 2));

  // Crimson wax ribbon & golden seal in center
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(Math.round(x + w * 0.42), Math.round(y + 1), Math.max(3, Math.round(w * 0.16)), Math.round(h - 2));
  ctx.fillStyle = "#facc15";
  ctx.fillRect(Math.round(x + w * 0.44), Math.round(y + h * 0.36), Math.max(3, Math.round(w * 0.12)), Math.max(3, Math.round(h * 0.28)));

  ctx.restore();
}

/**
 * Draws the iconic 5x5 Spiral Gem Board of Splendor Duel with golden spiral refill lines,
 * 25 recessed gem sockets, pixel tokens, and live straight-line selection beam.
 */
export function drawDuelSpiralBoard2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  boardSize: number,
  board: (DuelTokenColor | null)[],
  selectedCells: [number, number][],
  highlightColor: SplendorGemColor | null,
  goldHighlightMode: boolean
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Outer Walnut & Gold Beveled Board Frame
  drawRoundedRect(ctx, x - 6, y - 6, boardSize + 12, boardSize + 12, 14);
  ctx.fillStyle = "#1c1310";
  ctx.fill();
  ctx.strokeStyle = "#ca8a04";
  ctx.lineWidth = 2.6;
  ctx.stroke();

  drawRoundedRect(ctx, x, y, boardSize, boardSize, 10);
  ctx.fillStyle = "#0b1020";
  ctx.fill();
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  const cellS = boardSize / 5;
  const centerOf = (r: number, c: number) => ({
    x: x + c * cellS + cellS / 2,
    y: y + r * cellS + cellS / 2,
  });

  // 1. Outward Golden Spiral Refill Track connecting all 25 slots from center (2,2)
  ctx.strokeStyle = "rgba(234, 179, 8, 0.28)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  DUEL_SPIRAL_ORDER.forEach(([r, c], idx) => {
    const pt = centerOf(r, c);
    if (idx === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();

  // 2. 25 Recessed Sockets + Tokens
  const selectedSet = new Set(selectedCells.map(([r, c]) => `${r},${c}`));
  const tokenR = Math.max(10, cellS * 0.37);

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const pt = centerOf(r, c);
      const isCenter = r === 2 && c === 2;

      // Recessed socket
      ctx.fillStyle = isCenter ? "rgba(234, 179, 8, 0.14)" : "rgba(30, 41, 59, 0.55)";
      ctx.strokeStyle = isCenter ? "rgba(250, 204, 21, 0.45)" : "rgba(71, 85, 105, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, tokenR * 0.88, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const tok = board[r * 5 + c];
      if (tok) {
        const isSel = selectedSet.has(`${r},${c}`);
        const isMatch =
          (highlightColor !== null && tok === highlightColor) ||
          (goldHighlightMode && tok === "gold");
        drawDuelPixelTokenChip2D(ctx, pt.x, pt.y, tokenR, tok, isSel, isMatch);
      }
    }
  }

  // 3. Glowing Golden Line Beam connecting selected contiguous tokens
  if (selectedCells.length >= 2) {
    const sorted = [...selectedCells].sort((a, b) =>
      a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]
    );
    const p0 = centerOf(sorted[0][0], sorted[0][1]);
    const pLast = centerOf(
      sorted[sorted.length - 1][0],
      sorted[sorted.length - 1][1]
    );
    ctx.strokeStyle = "rgba(253, 224, 71, 0.85)";
    ctx.lineWidth = 3.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(pLast.x, pLast.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

function powerBadgeLabel(power: DuelCardPower): { text: string; bg: string } | null {
  if (power === "EXTRA_TURN") return { text: "🔄+1", bg: "#0284c7" };
  if (power === "PRIVILEGE") return { text: "📜", bg: "#b45309" };
  if (power === "STEAL") return { text: "🎯", bg: "#be123c" };
  if (power === "TAKE_MATCHING") return { text: "➕", bg: "#15803d" };
  return null;
}

/**
 * Draws a 16-bit Pixel-Art Splendor Duel Jewel Card with Points, Crowns, Bonus (x1 / x2 / Wild),
 * Special Power Icon, and Cost Circles (including Pearl).
 */
export function drawDuelPixelCard2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  card: DuelJewelCard,
  options?: { affordable?: boolean; selected?: boolean }
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const radius = Math.max(4, Math.min(w, h) * 0.08);

  // Drop shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.52)";
  drawRoundedRect(ctx, x + 2, y + 3, w, h, radius);
  ctx.fill();

  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.clip();

  // Tier-themed dark jewel craft backdrop
  const bgTop =
    card.tier === 1 ? "#1b2824" : card.tier === 2 ? "#1e293b" : "#2e1042";
  const bgBot =
    card.tier === 1 ? "#0c1412" : card.tier === 2 ? "#0f172a" : "#150721";
  ctx.fillStyle = bgTop;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = bgBot;
  ctx.fillRect(x, y + h * 0.55, w, h * 0.45);

  // Subtle pixel jewel-craft motif on right half of card
  const accentCol =
    card.bonus && card.bonus !== "wild"
      ? DUEL_TOKEN_META[card.bonus].hex
      : card.bonus === "wild"
        ? "#e879f9"
        : "#fbbf24";
  ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
  ctx.fillRect(Math.round(x + w * 0.45), Math.round(y + h * 0.34), Math.round(w * 0.44), Math.round(h * 0.48));
  ctx.fillStyle = accentCol;
  ctx.globalAlpha = 0.25;
  ctx.fillRect(Math.round(x + w * 0.54), Math.round(y + h * 0.44), Math.round(w * 0.26), Math.round(h * 0.26));
  ctx.globalAlpha = 1;

  // Top Header Strip: Points (Left) + Crowns (Center) + Bonus Gem (Right)
  const headerH = Math.max(17, Math.round(h * 0.27));
  ctx.fillStyle = "rgba(248, 250, 252, 0.9)";
  ctx.fillRect(x, y, w, headerH);
  ctx.fillStyle = accentCol;
  ctx.fillRect(x, y + headerH - 2, w, 2);

  if (card.points > 0) {
    ctx.fillStyle = "#0f172a";
    ctx.font = `900 ${Math.max(11, Math.round(headerH * 0.72))}px monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(String(card.points), x + 4, y + headerH * 0.5);
  }

  // Crowns in top-center (if card.crowns > 0)
  if (card.crowns > 0) {
    ctx.fillStyle = "#b45309";
    ctx.font = `bold ${Math.max(8, Math.round(headerH * 0.48))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      card.crowns === 1 ? "👑" : `👑×${card.crowns}`,
      x + w * 0.48,
      y + headerH * 0.5
    );
  }

  // Top-Right Bonus Gem (`x1`, `x2`, or Rainbow `Wild`)
  const gemR = headerH * 0.7;
  if (card.bonus === "wild") {
    const gx = x + w - 11;
    const gy = y + headerH * 0.5;
    const cols = ["#f8fafc", "#3b82f6", "#22c55e", "#ef4444"];
    cols.forEach((c, idx) => {
      ctx.fillStyle = c;
      ctx.fillRect(
        Math.round(gx - 5 + (idx % 2) * 5),
        Math.round(gy - 5 + Math.floor(idx / 2) * 5),
        5,
        5
      );
    });
  } else if (card.bonus !== null) {
    drawDuelPixelTokenIcon2D(
      ctx,
      x + w - Math.max(10, headerH * 0.46),
      y + headerH * 0.5,
      gemR,
      card.bonus
    );
    if (card.bonusCount >= 2) {
      ctx.fillStyle = "#0f172a";
      ctx.font = "900 8px monospace";
      ctx.textAlign = "right";
      ctx.fillText("×2", x + w - 2, y + headerH - 4);
    }
  }

  // Special Power Badge (if any) on upper-right below header
  const pBadge = powerBadgeLabel(card.power);
  if (pBadge) {
    const bw = Math.max(20, w * 0.36);
    const bh = 15;
    drawRoundedRect(ctx, x + w - bw - 3, y + headerH + 3, bw, bh, 5);
    ctx.fillStyle = pBadge.bg;
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pBadge.text, x + w - bw / 2 - 3, y + headerH + 3 + bh / 2);
  }

  // Bottom-Left Cost Circles Column (5 Gems + Pearl)
  const costCols = (
    [...SPLENDOR_GEMS, "pearl"] as (SplendorGemColor | "pearl")[]
  ).filter((g) => card.cost[g] > 0);
  const circleR = Math.max(5.5, Math.min(8.5, w * 0.125));
  const rowStep = circleR * 2 + 2;
  const botY = y + h - circleR - 4;

  costCols.forEach((col, idx) => {
    const cyCost = botY - idx * rowStep;
    const cxCost = x + circleR + 4;
    const meta = DUEL_TOKEN_META[col];

    ctx.fillStyle = meta.hex;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cxCost, cyCost, circleR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = meta.textHex;
    ctx.font = `900 ${Math.max(8, Math.round(circleR * 1.25))}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(card.cost[col]), cxCost, cyCost + 0.5);
  });

  ctx.restore(); // End clip

  // Outer Frame Border
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.strokeStyle = options?.selected
    ? "#fde047"
    : options?.affordable
      ? "#4ade80"
      : "#64748b";
  ctx.lineWidth = options?.selected ? 3 : options?.affordable ? 2.4 : 1.5;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a 16-bit Pixel-Art Splendor Duel Royal Card (claimed at 3 or 6 Crowns).
 */
export function drawDuelPixelRoyalCard2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  royal: DuelRoyalCard,
  selectable = false
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const radius = 8;

  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.fillStyle = "#291829";
  ctx.fill();
  ctx.strokeStyle = selectable ? "#fde047" : "#ca8a04";
  ctx.lineWidth = selectable ? 3 : 1.8;
  ctx.stroke();

  // Top gold prestige crest + power badge
  ctx.fillStyle = "#fde047";
  ctx.font = `900 ${Math.max(12, Math.round(w * 0.28))}px monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`${royal.points}`, x + 6, y + 14);

  const pBadge = powerBadgeLabel(royal.power);
  if (pBadge) {
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(pBadge.text, x + w - 5, y + 14);
  }

  // Mini 16-bit Pixel Crown Portrait in center
  const cx = Math.round(x + w / 2);
  const cy = Math.round(y + h * 0.56);
  const robePalette = ["#991b1b", "#1e40af", "#6b21a8", "#0f766e"];
  const robe = robePalette[royal.portraitVariant % robePalette.length];
  ctx.fillStyle = robe;
  ctx.fillRect(cx - 10, cy + 2, 20, 12);
  ctx.fillStyle = "#f5cba7";
  ctx.fillRect(cx - 6, cy - 8, 12, 10);
  ctx.fillStyle = "#eab308";
  ctx.fillRect(cx - 7, cy - 12, 14, 4);
  ctx.fillStyle = "#fef08a";
  ctx.fillRect(cx - 7, cy - 14, 3, 2);
  ctx.fillRect(cx - 1, cy - 14, 3, 2);
  ctx.fillRect(cx + 5, cy - 14, 3, 2);

  ctx.restore();
}
