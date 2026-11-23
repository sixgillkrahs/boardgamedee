import { drawRoundedRect } from "@/canvas/engine";
import { drawSplendorPixelGemIcon2D } from "@/canvas/splendor-art";
import {
  DUEL_SPIRAL_ORDER,
  DUEL_TOKEN_META,
  type DuelCardArtVariant,
  type DuelCardBonus,
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

interface CardColorTheme {
  headerTop: string;
  headerBot: string;
  ribbonTop: string;
  ribbonBot: string;
  ribbonBorder: string;
  gemMain: string;
  gemLight: string;
  gemDark: string;
  ring: string;
  bustTint: string;
}

function getCardColorTheme(bonus: DuelCardBonus): CardColorTheme {
  switch (bonus) {
    case "white":
      return {
        headerTop: "#eef2f6",
        headerBot: "#cfd8e3",
        ribbonTop: "#f8fafc",
        ribbonBot: "#cbd5e1",
        ribbonBorder: "#94a3b8",
        gemMain: "#e2e8f0",
        gemLight: "#ffffff",
        gemDark: "#64748b",
        ring: "#94a3b8",
        bustTint: "#eef2f6",
      };
    case "blue":
      return {
        headerTop: "#29a3d6",
        headerBot: "#0e7490",
        ribbonTop: "#0ea5e9",
        ribbonBot: "#0369a1",
        ribbonBorder: "#075985",
        gemMain: "#0284c7",
        gemLight: "#7dd3fc",
        gemDark: "#0c4a6e",
        ring: "#0369a1",
        bustTint: "#e2f0f7",
      };
    case "green":
      return {
        headerTop: "#52b14f",
        headerBot: "#1e7e34",
        ribbonTop: "#22c55e",
        ribbonBot: "#15803d",
        ribbonBorder: "#14532d",
        gemMain: "#16a34a",
        gemLight: "#86efac",
        gemDark: "#064e3b",
        ring: "#15803d",
        bustTint: "#d9ede0",
      };
    case "black":
      return {
        headerTop: "#525866",
        headerBot: "#272c36",
        ribbonTop: "#475569",
        ribbonBot: "#1e293b",
        ribbonBorder: "#0f172a",
        gemMain: "#27303f",
        gemLight: "#94a3b8",
        gemDark: "#020617",
        ring: "#0f172a",
        bustTint: "#e5e7eb",
      };
    case "red":
      return {
        headerTop: "#e36464",
        headerBot: "#b91c1c",
        ribbonTop: "#ef4444",
        ribbonBot: "#991b1b",
        ribbonBorder: "#7f1d1d",
        gemMain: "#dc2626",
        gemLight: "#fca5a5",
        gemDark: "#7f1d1d",
        ring: "#b91c1c",
        bustTint: "#f3e5e0",
      };
    case "wild":
      return {
        headerTop: "#c4cbd4",
        headerBot: "#858f9c",
        ribbonTop: "#9ca3af",
        ribbonBot: "#4b5563",
        ribbonBorder: "#374151",
        gemMain: "#e879f9",
        gemLight: "#f5d0fe",
        gemDark: "#701a75",
        ring: "#64748b",
        bustTint: "#f1f5f9",
      };
    default:
      // Colorless pure prestige (Goldsmith Chalice)
      return {
        headerTop: "#4d5c6c",
        headerBot: "#334155",
        ribbonTop: "#fbbf24",
        ribbonBot: "#d97706",
        ribbonBorder: "#92400e",
        gemMain: "#fbbf24",
        gemLight: "#fef08a",
        gemDark: "#92400e",
        ring: "#ca8a04",
        bustTint: "#fef3c7",
      };
  }
}

/**
 * Draws an official circular purple Splendor Duel Power Badge inside the left pennant.
 */
function drawDuelPowerBadge2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  kind: Exclude<DuelCardPower, null> | "WILD_ATTACH"
) {
  ctx.save();
  // Drop shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.arc(cx, cy + 1, r + 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Outer white rim
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, cy, r + 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Royal purple disc
  ctx.fillStyle = "#5b21b6";
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = Math.max(1.2, r * 0.18);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (kind === "EXTRA_TURN") {
    // Two curved recycling arrows
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.48, -Math.PI * 0.85, -Math.PI * 0.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.48, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    // Tiny arrowheads
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.48, cy - r * 0.28);
    ctx.lineTo(cx + r * 0.25, cy - r * 0.14);
    ctx.lineTo(cx + r * 0.56, cy - r * 0.02);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.48, cy + r * 0.28);
    ctx.lineTo(cx - r * 0.25, cy + r * 0.14);
    ctx.lineTo(cx - r * 0.56, cy + r * 0.02);
    ctx.closePath();
    ctx.fill();
  } else if (kind === "TAKE_MATCHING") {
    // Faceted white pentagon gemstone
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      const px = cx + Math.cos(a) * r * 0.56;
      const py = cy + Math.sin(a) * r * 0.56;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "PRIVILEGE") {
    // Diagonal rolled white scroll with wax seal
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 4);
    drawRoundedRect(ctx, -r * 0.52, -r * 0.24, r * 1.04, r * 0.48, 2);
    ctx.fill();
    ctx.fillStyle = "#5b21b6";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (kind === "STEAL") {
    // Stylized white hand plucking a gem coin
    ctx.beginPath();
    ctx.arc(cx + r * 0.1, cy - r * 0.08, r * 0.42, Math.PI * 0.9, Math.PI * 2.1);
    ctx.lineTo(cx + r * 0.12, cy + r * 0.22);
    ctx.lineTo(cx - r * 0.35, cy + r * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(1, r * 0.13);
    ctx.beginPath();
    ctx.arc(cx - r * 0.22, cy + r * 0.32, r * 0.18, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === "WILD_ATTACH") {
    // 5 tiny white gems arranged in a circle (official Wild card badge)
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.arc(
        cx + Math.cos(a) * r * 0.42,
        cy + Math.sin(a) * r * 0.42,
        Math.max(1.2, r * 0.15),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Draws the official Golden Crown Crest (used on Level 1/2/3 cards with crowns).
 */
function drawDuelCrownBadge2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  crowns: number
) {
  ctx.save();
  const count = Math.min(3, crowns);
  const gap = size * 0.12;
  const totalW = count * size + (count - 1) * gap;
  const startX = cx - totalW / 2 + size / 2;

  for (let i = 0; i < count; i++) {
    const bx = startX + i * (size + gap);
    const half = size * 0.5;

    // Gold arched shield
    ctx.fillStyle = "#f59e0b";
    ctx.strokeStyle = "#fef08a";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx - half, cy + half * 0.85);
    ctx.lineTo(bx - half, cy - half * 0.35);
    ctx.lineTo(bx, cy - half * 0.95);
    ctx.lineTo(bx + half, cy - half * 0.35);
    ctx.lineTo(bx + half, cy + half * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crisp white 3-spire royal crown inside
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(bx - half * 0.62, cy + half * 0.55);
    ctx.lineTo(bx - half * 0.68, cy - half * 0.15);
    ctx.lineTo(bx - half * 0.25, cy + half * 0.12);
    ctx.lineTo(bx, cy - half * 0.4);
    ctx.lineTo(bx + half * 0.25, cy + half * 0.12);
    ctx.lineTo(bx + half * 0.68, cy - half * 0.15);
    ctx.lineTo(bx + half * 0.62, cy + half * 0.55);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Helper to draw a gleaming faceted round/teardrop 2D gemstone in the given theme palette.
 */
function drawFacetedGem2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  theme: CardColorTheme,
  teardrop = false,
  angle = 0
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.beginPath();
  if (teardrop) {
    ctx.moveTo(0, -ry * 1.15);
    ctx.bezierCurveTo(rx * 1.1, -ry * 0.15, rx * 0.95, ry * 0.95, 0, ry);
    ctx.bezierCurveTo(-rx * 0.95, ry * 0.95, -rx * 1.1, -ry * 0.15, 0, -ry * 1.15);
  } else {
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  }
  ctx.closePath();

  const grad = ctx.createRadialGradient(-rx * 0.28, -ry * 0.28, rx * 0.1, 0, 0, Math.max(rx, ry) * 1.15);
  grad.addColorStop(0, theme.gemLight);
  grad.addColorStop(0.45, theme.gemMain);
  grad.addColorStop(1, theme.gemDark);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = theme.gemDark;
  ctx.lineWidth = Math.max(0.8, rx * 0.12);
  ctx.stroke();

  // Inner facet polygon
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.beginPath();
  ctx.moveTo(0, -ry * 0.55);
  ctx.lineTo(rx * 0.45, -ry * 0.05);
  ctx.lineTo(0, ry * 0.35);
  ctx.lineTo(-rx * 0.45, -ry * 0.05);
  ctx.closePath();
  ctx.fill();

  // Crisp specular glint
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(-rx * 0.26, -ry * 0.28, Math.max(1, rx * 0.22), Math.max(0.8, ry * 0.14), -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ============================================================================
// ALL 7 HANDCRAFTED 2D LEVEL-1 CARD ARTWORK SCENES (level1-01 .. level1-30)
// ============================================================================

/** 1. Noblewoman Profile with Golden Sunburst Drop Earring + 3 Pearl Tassels (01, 06, 11, 16, 21) */
function drawDuelArtEarring2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: CardColorTheme
) {
  // Muted cool slate-violet backdrop
  const bg = ctx.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, "#4c5464");
  bg.addColorStop(1, "#333a47");
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);

  // Dark swept-back hair silhouette
  ctx.fillStyle = "#241e22";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.34, y + h * 0.16);
  ctx.quadraticCurveTo(x + w * 0.28, y + h * 0.44, x + w * 0.4, y + h * 0.62);
  ctx.lineTo(x + w * 0.16, y + h * 0.96);
  ctx.lineTo(x + w, y + h * 0.96);
  ctx.lineTo(x + w, y + h * 0.16);
  ctx.closePath();
  ctx.fill();

  // Sage-emerald embroidered high collar
  ctx.fillStyle = "#48615b";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.14, y + h);
  ctx.quadraticCurveTo(x + w * 0.42, y + h * 0.82, x + w * 0.6, y + h * 0.72);
  ctx.lineTo(x + w, y + h * 0.84);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#2b3d39";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Warm rose-beige face profile & neck
  ctx.fillStyle = "#c89b90";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.55, y + h * 0.24);
  ctx.lineTo(x + w, y + h * 0.2);
  ctx.lineTo(x + w, y + h * 0.8);
  ctx.quadraticCurveTo(x + w * 0.64, y + h * 0.7, x + w * 0.56, y + h * 0.56);
  ctx.quadraticCurveTo(x + w * 0.54, y + h * 0.4, x + w * 0.55, y + h * 0.24);
  ctx.closePath();
  ctx.fill();

  // Soft cheek shadow
  ctx.fillStyle = "rgba(110, 68, 68, 0.28)";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.57, y + h * 0.56);
  ctx.quadraticCurveTo(x + w * 0.76, y + h * 0.64, x + w, y + h * 0.74);
  ctx.lineTo(x + w, y + h * 0.82);
  ctx.closePath();
  ctx.fill();

  // Ear
  ctx.fillStyle = "#bf8f83";
  ctx.strokeStyle = "#7a534c";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.46, y + h * 0.47, w * 0.09, h * 0.1, -0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Expressive almond eye + brow
  ctx.strokeStyle = "#2b1e22";
  ctx.lineWidth = Math.max(1.2, w * 0.022);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.71, y + h * 0.3);
  ctx.quadraticCurveTo(x + w * 0.84, y + h * 0.28, x + w * 0.99, y + h * 0.32);
  ctx.stroke();

  ctx.fillStyle = "#f1e8e6";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.84, y + h * 0.42, w * 0.14, h * 0.048, 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3f2e33";
  ctx.beginPath();
  ctx.arc(x + w * 0.84, y + h * 0.42, w * 0.075, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x + w * 0.81, y + h * 0.405, Math.max(1, w * 0.022), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1f1619";
  ctx.lineWidth = Math.max(1.4, w * 0.024);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.68, y + h * 0.4);
  ctx.quadraticCurveTo(x + w * 0.83, y + h * 0.35, x + w * 0.99, y + h * 0.42);
  ctx.stroke();

  // Golden Sunburst Drop Earring + Central Bonus Gem + 3 White Pearl Tassels
  const ex = x + w * 0.51;
  const ey = y + h * 0.69;
  const er = Math.min(w * 0.125, h * 0.09);

  // Ear wire
  ctx.strokeStyle = "#eab308";
  ctx.lineWidth = Math.max(1, w * 0.018);
  ctx.beginPath();
  ctx.moveTo(ex, y + h * 0.56);
  ctx.lineTo(ex, ey - er);
  ctx.stroke();

  // 8-petal gold sunburst setting
  ctx.fillStyle = "#e09f45";
  ctx.strokeStyle = "#7c3f12";
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.arc(ex + Math.cos(a) * er * 0.78, ey + Math.sin(a) * er * 0.78, er * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "#f3be62";
  ctx.beginPath();
  ctx.arc(ex, ey, er * 0.78, 0, Math.PI * 2);
  ctx.fill();

  // Central gem in card's bonus color
  drawFacetedGem2D(ctx, ex, ey, er * 0.58, er * 0.56, theme);

  // 3 Dangling White Pearl Teardrops
  for (const [dx, dy] of [
    [-er * 0.5, er * 1.45],
    [0, er * 1.65],
    [er * 0.5, er * 1.45],
  ] as const) {
    ctx.strokeStyle = "#3b2314";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ex + dx, ey + er * 0.85);
    ctx.lineTo(ex + dx, ey + dy);
    ctx.stroke();

    ctx.fillStyle = "#fdfbf7";
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.ellipse(ex + dx, ey + dy + er * 0.25, er * 0.19, er * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

/** 2. Ornate Golden Diadem / Tiara on Blue Silk & Crimson Velvet Box (02, 07, 12, 17, 22) */
function drawDuelArtTiara2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: CardColorTheme
) {
  // Deep rose-crimson velvet wall
  ctx.fillStyle = "#b35263";
  ctx.fillRect(x, y, w, h);

  // Leather presentation case cushion
  ctx.fillStyle = "#5c433c";
  drawRoundedRect(ctx, x - w * 0.04, y + h * 0.28, w * 1.08, h * 0.62, 12);
  ctx.fill();
  ctx.strokeStyle = "#2b1c18";
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Pale sky-blue folded silk display cloth (diamond V-fold)
  ctx.fillStyle = "#a9cdd7";
  ctx.beginPath();
  ctx.moveTo(x - w * 0.04, y + h * 0.5);
  ctx.lineTo(x + w * 0.5, y + h * 0.36);
  ctx.lineTo(x + w * 1.04, y + h * 0.5);
  ctx.lineTo(x + w * 0.48, y + h * 0.86);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#6c929d";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Golden Tiara Arch Band
  const cx = x + w * 0.5;
  const cy = y + h * 0.54;
  ctx.strokeStyle = "#7c3f12";
  ctx.lineWidth = Math.max(2, w * 0.04);
  ctx.beginPath();
  ctx.ellipse(cx, cy - h * 0.06, w * 0.46, h * 0.16, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#e8ab4f";
  ctx.lineWidth = Math.max(1.2, w * 0.022);
  ctx.stroke();

  // Peaked Gold Filigree Crest Body
  const goldGrad = ctx.createLinearGradient(x, cy - h * 0.2, x, cy + h * 0.14);
  goldGrad.addColorStop(0, "#fde68a");
  goldGrad.addColorStop(0.5, "#e5a33d");
  goldGrad.addColorStop(1, "#9a5b13");
  ctx.fillStyle = goldGrad;
  ctx.strokeStyle = "#5c2e0a";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.06, cy - h * 0.04);
  ctx.quadraticCurveTo(x + w * 0.3, cy - h * 0.08, cx, cy - h * 0.22);
  ctx.quadraticCurveTo(x + w * 0.7, cy - h * 0.08, x + w * 0.94, cy - h * 0.04);
  ctx.quadraticCurveTo(x + w * 0.9, cy + h * 0.12, cx, cy + h * 0.13);
  ctx.quadraticCurveTo(x + w * 0.1, cy + h * 0.12, x + w * 0.06, cy - h * 0.04);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3 Prominent Bonus-Colored Gems (1 Top Round + 2 Tilted Teardrops)
  const gR = Math.min(w * 0.085, h * 0.065);
  drawFacetedGem2D(ctx, cx, cy - h * 0.09, gR, gR, theme);
  drawFacetedGem2D(ctx, cx - w * 0.14, cy + h * 0.025, gR * 0.78, gR * 0.98, theme, true, 0.38);
  drawFacetedGem2D(ctx, cx + w * 0.14, cy + h * 0.025, gR * 0.78, gR * 0.98, theme, true, -0.38);
}

/** 3. Sculpted Display Bust with Gold Chain & Gem Medallion Necklace (03, 08, 13, 18, 23) */
function drawDuelArtNecklace2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: CardColorTheme
) {
  // Deep royal plum-violet velvet backdrop
  const bg = ctx.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, "#4c356e");
  bg.addColorStop(1, "#2a1b42");
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);

  // Ivory Jewelry Display Bust
  const cx = x + w * 0.5;
  const bustGrad = ctx.createLinearGradient(x, y + h * 0.25, x + w, y + h * 0.95);
  bustGrad.addColorStop(0, "#ffffff");
  bustGrad.addColorStop(0.6, theme.bustTint);
  bustGrad.addColorStop(1, "#94a3b8");
  ctx.fillStyle = bustGrad;
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.19, y + h * 0.24);
  ctx.lineTo(cx + w * 0.19, y + h * 0.24);
  ctx.quadraticCurveTo(cx + w * 0.22, y + h * 0.33, x + w * 0.98, y + h * 0.34);
  ctx.quadraticCurveTo(x + w * 0.94, y + h * 0.78, cx + w * 0.35, y + h * 0.93);
  ctx.quadraticCurveTo(cx, y + h * 0.99, cx - w * 0.35, y + h * 0.93);
  ctx.quadraticCurveTo(x + w * 0.06, y + h * 0.78, x + w * 0.02, y + h * 0.34);
  ctx.quadraticCurveTo(cx - w * 0.22, y + h * 0.33, cx - w * 0.19, y + h * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Top oval neck rim
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.24, w * 0.19, h * 0.032, 0, 0, Math.PI * 2);
  ctx.fill();

  // Gold Chain Necklace draping down to pendant
  ctx.strokeStyle = "#92571c";
  ctx.lineWidth = Math.max(2.2, w * 0.042);
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.24, y + h * 0.32);
  ctx.quadraticCurveTo(cx - w * 0.3, y + h * 0.56, cx, y + h * 0.64);
  ctx.quadraticCurveTo(cx + w * 0.3, y + h * 0.56, cx + w * 0.24, y + h * 0.32);
  ctx.stroke();
  ctx.strokeStyle = "#e8b45a";
  ctx.lineWidth = Math.max(1.2, w * 0.022);
  ctx.stroke();

  // Upper rose-pearl clasp
  ctx.fillStyle = "#eab308";
  ctx.beginPath();
  ctx.arc(cx + w * 0.02, y + h * 0.64, w * 0.065, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f5d0c5";
  ctx.beginPath();
  ctx.arc(cx + w * 0.02, y + h * 0.64, w * 0.042, 0, Math.PI * 2);
  ctx.fill();

  // Scalloped Gold Pendant Frame + Large Bonus Gem
  const px = cx + w * 0.02;
  const py = y + h * 0.76;
  const pr = Math.min(w * 0.125, h * 0.095);
  ctx.fillStyle = "#dca042";
  ctx.strokeStyle = "#783f0f";
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.arc(px + Math.cos(a) * pr * 0.8, py + Math.sin(a) * pr * 0.8, pr * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  drawFacetedGem2D(ctx, px, py, pr * 0.7, pr * 0.68, theme);
}

/** 4. Cut Teardrop Gemstone on Tan Chamois Cloth with Jeweler's Awl (04, 09, 14, 19, 24) */
function drawDuelArtTeardropGem2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: CardColorTheme
) {
  // Mahogany wooden bench
  ctx.fillStyle = "#593326";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#361b12";
  ctx.lineWidth = 1.2;
  for (let i = 1; i <= 5; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y + (h * i) / 5);
    ctx.lineTo(x + w, y + (h * (i + 0.6)) / 5);
    ctx.stroke();
  }

  // Tilted warm tan leather chamois cloth
  ctx.fillStyle = "#c9aa97";
  ctx.strokeStyle = "#6e4b3c";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.02, y + h * 0.3);
  ctx.lineTo(x + w * 0.66, y + h * 0.21);
  ctx.lineTo(x + w * 1.04, y + h * 0.29);
  ctx.lineTo(x + w * 1.04, y + h * 0.74);
  ctx.lineTo(x + w * 0.45, y + h * 0.9);
  ctx.lineTo(x - w * 0.02, y + h * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Jeweler's Awl / Setting Tool on right
  ctx.strokeStyle = "rgba(40,20,15,0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.56, y + h * 0.36);
  ctx.lineTo(x + w * 0.96, y + h * 0.44);
  ctx.stroke();

  ctx.strokeStyle = "#475569";
  ctx.lineWidth = Math.max(1.5, w * 0.022);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.58, y + h * 0.32);
  ctx.lineTo(x + w * 0.88, y + h * 0.38);
  ctx.stroke();
  ctx.fillStyle = "#6b2d42";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.94, y + h * 0.39, w * 0.1, h * 0.045, 0.22, 0, Math.PI * 2);
  ctx.fill();

  // Deep shadow under gemstone
  ctx.fillStyle = "rgba(46, 26, 20, 0.52)";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.45, y + h * 0.52, w * 0.18, h * 0.095, -0.58, 0, Math.PI * 2);
  ctx.fill();

  // Giant Brilliantly Faceted Teardrop Gemstone
  drawFacetedGem2D(
    ctx,
    x + w * 0.52,
    y + h * 0.5,
    w * 0.15,
    h * 0.115,
    theme,
    true,
    -2.3
  );
}

/** 5. Ornate Golden Renaissance Rapier Sword Hilt with 3 Gems (05, 10, 15, 20, 25) */
function drawDuelArtRapierHilt2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: CardColorTheme
) {
  // Walnut table backdrop
  ctx.fillStyle = "#5c392b";
  ctx.fillRect(x, y, w, h);

  // Cream parchment scroll mat diagonally placed
  ctx.fillStyle = "#e2cfb5";
  ctx.strokeStyle = "#7a533c";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.05, y + h * 0.4);
  ctx.lineTo(x + w * 0.38, y + h * 0.18);
  ctx.lineTo(x + w * 1.05, y + h * 0.36);
  ctx.lineTo(x + w * 1.05, y + h * 0.8);
  ctx.lineTo(x + w * 0.34, y + h * 0.95);
  ctx.lineTo(x - w * 0.05, y + h * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Steel blade extending to bottom-right corner
  ctx.fillStyle = "#94a3b8";
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.62, y + h * 0.62);
  ctx.lineTo(x + w * 0.74, y + h * 0.56);
  ctx.lineTo(x + w * 1.04, y + h * 0.92);
  ctx.lineTo(x + w * 0.9, y + h * 1.02);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Swept Golden Knuckle-Bow & Basket Guard
  ctx.strokeStyle = "#7c3f12";
  ctx.lineWidth = Math.max(3.5, w * 0.06);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.16, y + h * 0.45);
  ctx.bezierCurveTo(x + w * 0.1, y + h * 0.65, x + w * 0.36, y + h * 0.8, x + w * 0.68, y + h * 0.62);
  ctx.bezierCurveTo(x + w * 0.92, y + h * 0.48, x + w * 0.74, y + h * 0.35, x + w * 0.44, y + h * 0.44);
  ctx.stroke();
  ctx.strokeStyle = "#e8ad4a";
  ctx.lineWidth = Math.max(2, w * 0.036);
  ctx.stroke();

  // Dark Ribbed Leather Grip
  ctx.save();
  ctx.translate(x + w * 0.4, y + h * 0.47);
  ctx.rotate(0.75);
  drawRoundedRect(ctx, -w * 0.24, -w * 0.075, w * 0.44, w * 0.15, 4);
  ctx.fillStyle = "#2b303c";
  ctx.fill();
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Golden Pommel Top-Left
  ctx.fillStyle = "#dca040";
  ctx.strokeStyle = "#6e380e";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x + w * 0.13, y + h * 0.3, w * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Ornate Central Gold Crossguard Shield
  ctx.fillStyle = "#eab34c";
  ctx.strokeStyle = "#783f0f";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.28, y + h * 0.69);
  ctx.quadraticCurveTo(x + w * 0.56, y + h * 0.52, x + w * 0.84, y + h * 0.5);
  ctx.quadraticCurveTo(x + w * 0.86, y + h * 0.72, x + w * 0.66, y + h * 0.76);
  ctx.quadraticCurveTo(x + w * 0.46, y + h * 0.78, x + w * 0.28, y + h * 0.69);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3 Sparkling Bezel-Set Bonus Gems on Guard
  const gr = Math.min(w * 0.06, h * 0.044);
  drawFacetedGem2D(ctx, x + w * 0.16, y + h * 0.45, gr, gr, theme);
  drawFacetedGem2D(ctx, x + w * 0.57, y + h * 0.61, gr, gr, theme);
  drawFacetedGem2D(ctx, x + w * 0.75, y + h * 0.72, gr, gr, theme);
}

/** 6. Master Goldsmith Hands Setting a Ring over Jeweler's Workbench (Wild: 26, 27, 29, 30) */
function drawDuelArtArtisanHands2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Neutral studio wall & dark workbench surface
  ctx.fillStyle = "#8a8274";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#22262e";
  ctx.fillRect(x, y + h * 0.48, w, h * 0.52);

  // Wooden jewelers tray on right with white ring-sketch paper & tiny gems
  ctx.fillStyle = "#5c604d";
  ctx.fillRect(x + w * 0.62, y + h * 0.36, w * 0.38, h * 0.36);
  ctx.fillStyle = "#e8e0d5";
  ctx.fillRect(x + w * 0.7, y + h * 0.43, w * 0.3, h * 0.14);
  ctx.fillStyle = "#b8a282";
  ctx.fillRect(x + w * 0.74, y + h * 0.62, w * 0.26, h * 0.34);
  // Pink-handled mini screwdriver & scattered tiny gems
  ctx.strokeStyle = "#be4c6c";
  ctx.lineWidth = Math.max(2, w * 0.03);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.88, y + h * 0.72);
  ctx.lineTo(x + w, y + h * 0.75);
  ctx.stroke();

  // Pale sky-blue cuff on lower-left
  ctx.fillStyle = "#6eb2cc";
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.62);
  ctx.lineTo(x + w * 0.14, y + h * 0.54);
  ctx.lineTo(x + w * 0.22, y + h * 0.72);
  ctx.lineTo(x, y + h * 0.82);
  ctx.closePath();
  ctx.fill();

  // Left & Right Goldsmith Hands cradling a gleaming gold ring
  ctx.fillStyle = "#c9907e";
  ctx.strokeStyle = "#5c352d";
  ctx.lineWidth = 1.3;
  // Upper hand
  ctx.beginPath();
  ctx.moveTo(x + w * 0.18, y + h * 0.54);
  ctx.quadraticCurveTo(x + w * 0.44, y + h * 0.22, x + w * 0.64, y + h * 0.26);
  ctx.quadraticCurveTo(x + w * 0.72, y + h * 0.36, x + w * 0.62, y + h * 0.44);
  ctx.lineTo(x + w * 0.34, y + h * 0.56);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Delicate golden ring between fingertips
  ctx.strokeStyle = "#fde047";
  ctx.lineWidth = Math.max(2, w * 0.032);
  ctx.beginPath();
  ctx.arc(x + w * 0.56, y + h * 0.4, w * 0.055, 0, Math.PI * 2);
  ctx.stroke();

  // Foreground right hand
  ctx.fillStyle = "#bf8473";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.12, y + h * 0.64);
  ctx.quadraticCurveTo(x + w * 0.4, y + h * 0.42, x + w * 0.68, y + h * 0.4);
  ctx.quadraticCurveTo(x + w * 0.82, y + h * 0.5, x + w * 0.7, y + h * 0.68);
  ctx.lineTo(x + w * 0.2, y + h * 0.74);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** 7. Goldsmith Engraving a Gleaming Golden Chalice (Colorless 3-pt Card: level1-28) */
function drawDuelArtGoldsmithChalice2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Cool steel-slate workshop backdrop
  ctx.fillStyle = "#526273";
  ctx.fillRect(x, y, w, h);

  // Dark anvil top-left
  ctx.fillStyle = "#26282e";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w * 0.62, y);
  ctx.lineTo(x + w * 0.45, y + h * 0.26);
  ctx.lineTo(x, y + h * 0.38);
  ctx.closePath();
  ctx.fill();

  // Wooden bench pin
  ctx.fillStyle = "#946452";
  ctx.strokeStyle = "#3b231c";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.34);
  ctx.lineTo(x + w * 0.24, y + h * 0.22);
  ctx.lineTo(x + w * 0.84, y + h * 0.42);
  ctx.lineTo(x + w * 0.68, y + h * 0.54);
  ctx.lineTo(x, y + h * 0.48);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Gleaming Golden Chalice held sideways
  const cupGrad = ctx.createLinearGradient(x + w * 0.2, y + h * 0.45, x + w * 0.8, y + h * 0.88);
  cupGrad.addColorStop(0, "#fef08a");
  cupGrad.addColorStop(0.35, "#eab308");
  cupGrad.addColorStop(0.75, "#b45309");
  cupGrad.addColorStop(1, "#78350f");
  ctx.fillStyle = cupGrad;
  ctx.strokeStyle = "#5c2e0a";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h * 0.63, w * 0.28, h * 0.16, 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Chalice base & stem
  ctx.beginPath();
  ctx.arc(x + w * 0.6, y + h * 0.86, w * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Left & Right Thumbs gripping the goblet
  ctx.fillStyle = "#c99586";
  ctx.strokeStyle = "#5c352d";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.22, y + h * 0.72, w * 0.16, h * 0.24, -0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x + w * 0.86, y + h * 0.76, w * 0.18, h * 0.25, -0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Metallic Engraving Drill / Burin descending from top-right
  ctx.fillStyle = "#8a5a3c";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.8, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h * 0.22);
  ctx.lineTo(x + w * 0.74, y + h * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#cbd5e1";
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.75, y + h * 0.18);
  ctx.lineTo(x + w * 0.92, y + h * 0.23);
  ctx.lineTo(x + w * 0.84, y + h * 0.37);
  ctx.lineTo(x + w * 0.68, y + h * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Fine engraving bit & spark
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.75, y + h * 0.35);
  ctx.lineTo(x + w * 0.67, y + h * 0.5);
  ctx.stroke();
  ctx.fillStyle = "#fef08a";
  ctx.beginPath();
  ctx.arc(x + w * 0.67, y + h * 0.5, Math.max(2, w * 0.03), 0, Math.PI * 2);
  ctx.fill();
}

// ============================================================================
// ALL 6 HANDCRAFTED 2D LEVEL-2 CARD ARTWORK SCENES (level2-01 .. level2-24)
// ============================================================================

/** L2-1. Silver Filigree Tiara in Crimson Velvet Jewelry Chest (01, 05, 09, 13, 17) */
function drawDuelArtSilverTiaraBox2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: CardColorTheme
) {
  // Dark wood table + mauve-plum runner cloth
  ctx.fillStyle = "#3a2e2e";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#7a6679";
  ctx.beginPath();
  ctx.moveTo(x - w * 0.05, y + h * 0.45);
  ctx.lineTo(x + w * 0.85, y + h * 0.24);
  ctx.lineTo(x + w * 1.05, y + h * 0.36);
  ctx.lineTo(x + w * 1.05, y + h * 0.88);
  ctx.lineTo(x + w * 0.3, y + h);
  ctx.lineTo(x - w * 0.05, y + h * 0.82);
  ctx.closePath();
  ctx.fill();

  // Open Chest Lid (angled back) with crimson tufted velvet & gold border
  ctx.fillStyle = "#5c1726";
  ctx.strokeStyle = "#d99b38";
  ctx.lineWidth = Math.max(2.2, w * 0.032);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.08, y + h * 0.46);
  ctx.lineTo(x + w * 0.16, y + h * 0.22);
  ctx.lineTo(x + w * 0.72, y + h * 0.14);
  ctx.lineTo(x + w * 0.76, y + h * 0.34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tufted lid dots
  ctx.fillStyle = "#3b0a15";
  for (const [tx, ty] of [
    [0.34, 0.25],
    [0.48, 0.23],
    [0.6, 0.22],
    [0.38, 0.34],
    [0.54, 0.32],
  ] as const) {
    ctx.beginPath();
    ctx.arc(x + w * tx, y + h * ty, Math.max(1.2, w * 0.016), 0, Math.PI * 2);
    ctx.fill();
  }

  // Chest Outer Base (ornate silver filigree panels + gold corners)
  ctx.fillStyle = "#8a929e";
  ctx.strokeStyle = "#c98b2e";
  ctx.lineWidth = Math.max(2, w * 0.028);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.08, y + h * 0.48);
  ctx.lineTo(x + w * 0.38, y + h * 0.85);
  ctx.lineTo(x + w * 0.99, y + h * 0.68);
  ctx.lineTo(x + w * 0.99, y + h * 0.54);
  ctx.lineTo(x + w * 0.72, y + h * 0.36);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Crimson Velvet Inner Bed
  ctx.fillStyle = "#7a192a";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.14, y + h * 0.48);
  ctx.lineTo(x + w * 0.42, y + h * 0.72);
  ctx.lineTo(x + w * 0.94, y + h * 0.56);
  ctx.lineTo(x + w * 0.7, y + h * 0.38);
  ctx.closePath();
  ctx.fill();

  // Sparkling Silver Lattice Crown Tiara inside chest
  const tx = x + w * 0.52;
  const ty = y + h * 0.56;
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = Math.max(1.6, w * 0.022);
  ctx.beginPath();
  ctx.ellipse(tx, ty - h * 0.02, w * 0.32, h * 0.12, 0.14, 0, Math.PI * 2);
  ctx.stroke();

  // Silver scalloped tiara spikes along front arc
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(1.8, w * 0.026);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.26, y + h * 0.54);
  ctx.lineTo(x + w * 0.34, y + h * 0.47);
  ctx.lineTo(x + w * 0.4, y + h * 0.59);
  ctx.lineTo(x + w * 0.5, y + h * 0.45);
  ctx.lineTo(x + w * 0.56, y + h * 0.64);
  ctx.lineTo(x + w * 0.66, y + h * 0.52);
  ctx.lineTo(x + w * 0.72, y + h * 0.65);
  ctx.lineTo(x + w * 0.82, y + h * 0.58);
  ctx.stroke();

  // Large Central Teardrop Bonus-Colored Gem in Gold Bezel
  ctx.fillStyle = "#eab308";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.51, y + h * 0.52, w * 0.09, h * 0.075, 0.18, 0, Math.PI * 2);
  ctx.fill();
  drawFacetedGem2D(
    ctx,
    x + w * 0.51,
    y + h * 0.52,
    w * 0.068,
    h * 0.062,
    theme,
    true,
    0.18
  );
}

/** L2-2. Purple-Gloved Thief Hand Reaching Over Shattered Glass Dome to Ring (02, 06, 10, 14, 18) */
function drawDuelArtShatteredGlassRing2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: CardColorTheme
) {
  // Moody violet-taupe shadow gallery + wooden table below
  const bg = ctx.createLinearGradient(x, y, x + w, y + h * 0.75);
  bg.addColorStop(0, "#755d6e");
  bg.addColorStop(1, "#1e1624");
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = "#5c342b";
  ctx.fillRect(x, y + h * 0.74, w, h * 0.26);

  // Display Base Plinth + Royal Blue Velvet Pad
  ctx.fillStyle = "#4b6973";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.52, y + h * 0.78, w * 0.5, h * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2b5b8c";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.52, y + h * 0.74, w * 0.42, h * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Golden Lotus/Sunburst Ring resting on blue pad
  const rx = x + w * 0.52;
  const ry = y + h * 0.72;
  ctx.strokeStyle = "#d99b38";
  ctx.lineWidth = Math.max(2.5, w * 0.042);
  ctx.beginPath();
  ctx.ellipse(rx, ry, w * 0.24, h * 0.055, 0.06, 0, Math.PI * 2);
  ctx.stroke();

  // Golden starburst petals rising behind central gem
  ctx.fillStyle = "#eab34c";
  ctx.strokeStyle = "#783f0f";
  ctx.lineWidth = 1;
  for (const [dx, dy, ang] of [
    [-0.1, -0.05, -0.7],
    [-0.05, -0.1, -0.35],
    [0.01, -0.13, 0.05],
    [0.07, -0.09, 0.45],
    [0.11, -0.03, 0.8],
  ] as const) {
    ctx.save();
    ctx.translate(rx + w * dx, ry + h * dy);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.036, h * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  drawFacetedGem2D(ctx, rx + w * 0.02, ry - h * 0.01, w * 0.065, h * 0.038, theme);

  // Jagged Shattered Pale-Blue Glass Dome Rim around ring
  ctx.fillStyle = "rgba(186, 224, 232, 0.55)";
  ctx.strokeStyle = "#e0f2fe";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.04, y + h * 0.72);
  ctx.lineTo(x + w * 0.04, y + h * 0.56);
  ctx.lineTo(x + w * 0.16, y + h * 0.64);
  ctx.lineTo(x + w * 0.24, y + h * 0.52);
  ctx.lineTo(x + w * 0.48, y + h * 0.48);
  ctx.lineTo(x + w * 0.72, y + h * 0.58);
  ctx.lineTo(x + w * 0.86, y + h * 0.56);
  ctx.lineTo(x + w * 0.96, y + h * 0.68);
  ctx.lineTo(x + w * 0.96, y + h * 0.76);
  ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.9, x + w * 0.04, y + h * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Dramatic Purple-Gloved Thief Hand reaching down from top-right
  const gloveGrad = ctx.createLinearGradient(x + w * 0.3, y + h * 0.2, x + w * 0.95, y + h * 0.55);
  gloveGrad.addColorStop(0, "#8b63a3");
  gloveGrad.addColorStop(0.55, "#4c2c66");
  gloveGrad.addColorStop(1, "#261336");
  ctx.fillStyle = gloveGrad;
  ctx.strokeStyle = "#1b0b29";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.95, y + h * 0.16);
  ctx.lineTo(x + w * 0.56, y + h * 0.22);
  ctx.lineTo(x + w * 0.2, y + h * 0.46); // index finger
  ctx.lineTo(x + w * 0.28, y + h * 0.47);
  ctx.lineTo(x + w * 0.4, y + h * 0.4);
  ctx.lineTo(x + w * 0.36, y + h * 0.5); // middle finger
  ctx.lineTo(x + w * 0.45, y + h * 0.49);
  ctx.lineTo(x + w * 0.54, y + h * 0.42);
  ctx.lineTo(x + w * 0.55, y + h * 0.5); // ring finger
  ctx.lineTo(x + w * 0.63, y + h * 0.46);
  ctx.lineTo(x + w * 0.68, y + h * 0.54); // thumb
  ctx.lineTo(x + w * 0.76, y + h * 0.52);
  ctx.lineTo(x + w * 0.85, y + h * 0.34);
  ctx.lineTo(x + w, y + h * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** L2-3. Heavy Golden 'S' Signet Ring on Parchment Scrolls (03, 07, 11, 15, 19) */
function drawDuelArtSignetRing2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: CardColorTheme
) {
  // Mahogany desk backdrop
  ctx.fillStyle = "#52352c";
  ctx.fillRect(x, y, w, h);

  // Stacked cream parchment folio sheets at bottom
  ctx.fillStyle = "#d9d2cc";
  ctx.strokeStyle = "#5c4d4a";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.04, y + h * 0.55);
  ctx.lineTo(x + w * 0.72, y + h * 0.44);
  ctx.lineTo(x + w * 1.04, y + h * 0.62);
  ctx.lineTo(x + w * 0.44, y + h * 0.89);
  ctx.lineTo(x - w * 0.04, y + h * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Rolled parchment scroll upper-left + slate cord
  ctx.fillStyle = "#c8c0ba";
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.28);
  ctx.lineTo(x + w * 0.85, y + h * 0.16);
  ctx.lineTo(x + w * 0.96, y + h * 0.28);
  ctx.lineTo(x + w * 0.14, y + h * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Heavy Golden Signet Ring Band
  const rx = x + w * 0.62;
  const ry = y + h * 0.49;
  const ringGrad = ctx.createLinearGradient(x + w * 0.25, y + h * 0.34, x + w * 0.98, y + h * 0.66);
  ringGrad.addColorStop(0, "#fef08a");
  ringGrad.addColorStop(0.45, "#e5a33d");
  ringGrad.addColorStop(1, "#7c3f12");
  ctx.fillStyle = ringGrad;
  ctx.strokeStyle = "#4d2308";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(rx, ry, w * 0.36, h * 0.16, 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner dark ring hole
  ctx.fillStyle = "#47220a";
  ctx.beginPath();
  ctx.ellipse(rx + w * 0.04, ry - h * 0.05, w * 0.22, h * 0.065, 0.14, 0, Math.PI * 2);
  ctx.fill();

  // Large Circular Golden Signet Face with Engraved 'S'
  const fx = x + w * 0.47;
  const fy = y + h * 0.53;
  const fr = Math.min(w * 0.23, h * 0.16);
  ctx.fillStyle = "#d99634";
  ctx.strokeStyle = "#4d2308";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(fx, fy, fr * 0.92, fr * 1.04, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Embossed Golden 'S' Monogram
  ctx.strokeStyle = "#fef08a";
  ctx.lineWidth = Math.max(2, fr * 0.2);
  ctx.font = `900 ${Math.max(12, Math.round(fr * 1.35))}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fde68a";
  ctx.fillText("S", fx, fy + 1);

  // Side Oval Bonus-Colored Gemstone set into ring shank
  drawFacetedGem2D(
    ctx,
    x + w * 0.8,
    y + h * 0.56,
    w * 0.062,
    h * 0.036,
    theme,
    false,
    -0.5
  );
}

/** L2-4. Graceful Hand Wearing Two Matching Bonus-Colored Rings (04, 08, 12, 16, 20 — x2 Bonus!) */
function drawDuelArtTwinRingsHand2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: CardColorTheme
) {
  // Soft luminous silver-lavender studio backdrop
  const bg = ctx.createLinearGradient(x, y, x + w, y + h);
  bg.addColorStop(0, "#6c7185");
  bg.addColorStop(0.45, "#b8becf");
  bg.addColorStop(1, "#4d5366");
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);

  // Hand & 4 graceful fingers angled diagonally down-right
  const skin = ctx.createLinearGradient(x + w * 0.1, y + h * 0.2, x + w * 0.85, y + h * 0.85);
  skin.addColorStop(0, "#cf9b86");
  skin.addColorStop(0.6, "#e3b39f");
  skin.addColorStop(1, "#b87f6c");
  ctx.fillStyle = skin;
  ctx.strokeStyle = "#6e4238";
  ctx.lineWidth = 1.2;

  // Wrist & Back of hand
  ctx.beginPath();
  ctx.moveTo(x + w * 0.02, y + h * 0.2);
  ctx.lineTo(x + w * 0.34, y + h * 0.19);
  ctx.quadraticCurveTo(x + w * 0.58, y + h * 0.3, x + w * 0.76, y + h * 0.42);
  ctx.lineTo(x + w * 0.99, y + h * 0.8); // index finger
  ctx.quadraticCurveTo(x + w * 0.94, y + h * 0.86, x + w * 0.87, y + h * 0.8);
  ctx.lineTo(x + w * 0.72, y + h * 0.52);
  ctx.lineTo(x + w * 0.76, y + h * 0.86); // middle finger
  ctx.quadraticCurveTo(x + w * 0.68, y + h * 0.9, x + w * 0.62, y + h * 0.82);
  ctx.lineTo(x + w * 0.55, y + h * 0.48);
  ctx.lineTo(x + w * 0.55, y + h * 0.84); // ring finger
  ctx.quadraticCurveTo(x + w * 0.46, y + h * 0.88, x + w * 0.42, y + h * 0.8);
  ctx.lineTo(x + w * 0.4, y + h * 0.44);
  ctx.lineTo(x + w * 0.38, y + h * 0.74); // pinky
  ctx.quadraticCurveTo(x + w * 0.31, y + h * 0.78, x + w * 0.29, y + h * 0.7);
  ctx.lineTo(x + w * 0.24, y + h * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Ring 1 (Left / Ring Finger): Silver Band with 3 tiny bonus gems
  const r1x = x + w * 0.49;
  const r1y = y + h * 0.53;
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = Math.max(2.6, w * 0.042);
  ctx.beginPath();
  ctx.ellipse(r1x, r1y, w * 0.085, h * 0.024, 0.06, 0, Math.PI * 2);
  ctx.stroke();
  drawFacetedGem2D(ctx, r1x - w * 0.04, r1y - 1, w * 0.025, h * 0.018, theme);
  drawFacetedGem2D(ctx, r1x, r1y - 1.5, w * 0.032, h * 0.022, theme);
  drawFacetedGem2D(ctx, r1x + w * 0.04, r1y - 1, w * 0.025, h * 0.018, theme);

  // Ring 2 (Right / Index Finger): Bold Golden Cushion-Cut Signet Ring
  const r2x = x + w * 0.8;
  const r2y = y + h * 0.51;
  ctx.fillStyle = "#d99b38";
  ctx.strokeStyle = "#5c2e0a";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(r2x, r2y, w * 0.1, h * 0.045, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  drawFacetedGem2D(ctx, r2x + w * 0.015, r2y - h * 0.008, w * 0.055, h * 0.036, theme);
}

/** L2-5. Wooden Ring Clamp Holding Gold Ring Blank + Tools (Wild: 21, 22, 23) */
function drawDuelArtRingClamp2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Planked wood bench + slate-teal jeweler's mat
  ctx.fillStyle = "#6e4636";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#3f5866";
  ctx.beginPath();
  ctx.moveTo(x - w * 0.05, y + h * 0.56);
  ctx.lineTo(x + w * 0.45, y + h * 0.28);
  ctx.lineTo(x + w * 1.05, y + h * 0.62);
  ctx.lineTo(x + w * 0.18, y + h * 0.88);
  ctx.closePath();
  ctx.fill();

  // Steel burnisher tool upper-right
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = Math.max(2.5, w * 0.04);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + h * 0.42);
  ctx.lineTo(x + w * 0.72, y + h * 0.28);
  ctx.stroke();
  ctx.fillStyle = "#8c5642";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.8, y + h * 0.24, w * 0.18, h * 0.08, -0.35, 0, Math.PI * 2);
  ctx.fill();

  // Wooden Cylinder Ring Clamp
  const woodGrad = ctx.createLinearGradient(x, y + h * 0.28, x + w * 0.6, y + h * 0.7);
  woodGrad.addColorStop(0, "#a87765");
  woodGrad.addColorStop(0.5, "#7d5142");
  woodGrad.addColorStop(1, "#4a2c22");
  ctx.fillStyle = woodGrad;
  ctx.strokeStyle = "#331b14";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.2);
  ctx.lineTo(x + w * 0.24, y + h * 0.18);
  ctx.lineTo(x + w * 0.6, y + h * 0.48);
  ctx.quadraticCurveTo(x + w * 0.62, y + h * 0.66, x + w * 0.42, y + h * 0.71);
  ctx.lineTo(x, y + h * 0.52);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Clamp jaw split & Gleaming Gold Ring Blank clamped tightly inside
  ctx.fillStyle = "#26140e";
  ctx.fillRect(x + w * 0.14, y + h * 0.54, w * 0.46, h * 0.045);

  ctx.strokeStyle = "#eab308";
  ctx.lineWidth = Math.max(3, w * 0.05);
  ctx.beginPath();
  ctx.ellipse(x + w * 0.42, y + h * 0.61, w * 0.18, h * 0.06, 0.18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#d99b38";
  ctx.strokeStyle = "#fef08a";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(x + w * 0.5, y + h * 0.63, w * 0.085, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/** L2-6. Polished Golden Yin-Yang Pomander Orb & Wax Seal Stamp (Colorless 5-pt: level2-24) */
function drawDuelArtGoldenOrbSeal2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Deep charcoal-teal gallery background + black plinth
  ctx.fillStyle = "#1b242c";
  ctx.fillRect(x, y, w, h);

  // Soft Mauve-Grey Draped Silk Cloth
  ctx.fillStyle = "#a38d96";
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.28);
  ctx.lineTo(x + w * 0.42, y + h * 0.21);
  ctx.lineTo(x + w, y + h * 0.25);
  ctx.lineTo(x + w, y + h * 0.66);
  ctx.lineTo(x + w * 0.45, y + h * 0.8);
  ctx.lineTo(x, y + h * 0.72);
  ctx.closePath();
  ctx.fill();

  // Cast shadows on cloth
  ctx.fillStyle = "rgba(42, 28, 36, 0.45)";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.58, y + h * 0.44, w * 0.26, h * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();

  // Polished Golden Spherical Orb (Upper Right)
  const ox = x + w * 0.72;
  const oy = y + h * 0.3;
  const or = Math.min(w * 0.24, h * 0.16);
  const orbGrad = ctx.createRadialGradient(ox - or * 0.35, oy - or * 0.35, or * 0.1, ox, oy, or);
  orbGrad.addColorStop(0, "#fef9c3");
  orbGrad.addColorStop(0.45, "#eab308");
  orbGrad.addColorStop(1, "#92400e");
  ctx.fillStyle = orbGrad;
  ctx.strokeStyle = "#5c2e0a";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(ox, oy, or, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Swirling yin-yang engraved groove & recessed circle on orb
  ctx.strokeStyle = "#78350f";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(ox + or * 0.4, oy - or * 0.25, or * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = "#b45309";
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox + or * 0.12, oy - or * 0.9);
  ctx.quadraticCurveTo(ox - or * 0.15, oy, ox + or * 0.38, oy + or * 0.85);
  ctx.stroke();

  // Intricate Golden Wax Seal / Cufflink Stamp lying on left
  ctx.fillStyle = "#dca040";
  ctx.strokeStyle = "#5c2e0a";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.26, y + h * 0.42, w * 0.1, h * 0.11, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + w * 0.08, y + h * 0.49, w * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Small Gold Coin & 3 Tiny Gold Nuggets scattered on cloth
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.68, y + h * 0.5, w * 0.08, h * 0.025, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (const [nx, ny] of [
    [0.42, 0.56],
    [0.56, 0.57],
    [0.6, 0.61],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(x + w * nx, y + h * ny, w * 0.028, h * 0.014, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function resolveArtVariant(card: DuelJewelCard): DuelCardArtVariant {
  if (card.artVariant) return card.artVariant;
  if (card.tier === 2) {
    if (card.bonus === "wild") return "ring_clamp";
    if (card.bonus === null) return "golden_orb_seal";
    if (card.bonusCount >= 2) return "twin_rings_hand";
    if (card.power === "STEAL") return "shattered_glass_ring";
    if (card.power === "PRIVILEGE") return "signet_ring";
    return "silver_tiara_box";
  }
  if (card.bonus === "wild") return "artisan_hands";
  if (card.bonus === null) return "goldsmith_chalice";
  if (card.crowns > 0) return "tiara";
  if (card.power === "EXTRA_TURN") return "necklace";
  if (card.power === "TAKE_MATCHING") return "teardrop_gem";
  if (card.points > 0) return "rapier_hilt";
  return "earring";
}

/**
 * Draws a rich 2D Official-Style Splendor Duel Jewel Card matching `level1-01.png`..`level1-30.png`:
 * - Full-bleed 2D jewel artwork (7 handcrafted motifs tinted to the card's bonus color)
 * - Top colored wave banner + Top-Left vertical pennant with points & purple power medallion
 * - Top-Center Golden Crown Crest (when crowns > 0)
 * - Top-Right Ivory Circular Gem Medallion (or 5-color rainbow Wild ring)
 * - Bottom-Left Gold-Rimmed Cost Medallions with mini gem icons
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
  const radius = Math.max(5, Math.min(w, h) * 0.08);
  const theme = getCardColorTheme(card.bonus);
  const variant = resolveArtVariant(card);

  // Drop shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.52)";
  drawRoundedRect(ctx, x + 2, y + 3, w, h, radius);
  ctx.fill();

  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.clip();

  // 1. Full-Bleed Handcrafted 2D Illustration
  switch (variant) {
    case "earring":
      drawDuelArtEarring2D(ctx, x, y, w, h, theme);
      break;
    case "tiara":
      drawDuelArtTiara2D(ctx, x, y, w, h, theme);
      break;
    case "necklace":
      drawDuelArtNecklace2D(ctx, x, y, w, h, theme);
      break;
    case "teardrop_gem":
      drawDuelArtTeardropGem2D(ctx, x, y, w, h, theme);
      break;
    case "rapier_hilt":
      drawDuelArtRapierHilt2D(ctx, x, y, w, h, theme);
      break;
    case "artisan_hands":
      drawDuelArtArtisanHands2D(ctx, x, y, w, h);
      break;
    case "goldsmith_chalice":
      drawDuelArtGoldsmithChalice2D(ctx, x, y, w, h);
      break;
    case "silver_tiara_box":
      drawDuelArtSilverTiaraBox2D(ctx, x, y, w, h, theme);
      break;
    case "shattered_glass_ring":
      drawDuelArtShatteredGlassRing2D(ctx, x, y, w, h, theme);
      break;
    case "signet_ring":
      drawDuelArtSignetRing2D(ctx, x, y, w, h, theme);
      break;
    case "twin_rings_hand":
      drawDuelArtTwinRingsHand2D(ctx, x, y, w, h, theme);
      break;
    case "ring_clamp":
      drawDuelArtRingClamp2D(ctx, x, y, w, h);
      break;
    case "golden_orb_seal":
      drawDuelArtGoldenOrbSeal2D(ctx, x, y, w, h);
      break;
  }

  // 2. Top Colored Cloth Canopy Wave (for colored & wild cards; colorless chalice keeps open art)
  const topBandH = Math.max(15, h * 0.2);
  if (card.bonus !== null) {
    const hdrGrad = ctx.createLinearGradient(x, y, x, y + topBandH);
    hdrGrad.addColorStop(0, theme.headerTop);
    hdrGrad.addColorStop(1, theme.headerBot);
    ctx.fillStyle = hdrGrad;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + topBandH);
    ctx.quadraticCurveTo(x + w * 0.72, y + topBandH * 0.88, x + w * 0.45, y + topBandH * 0.98);
    ctx.quadraticCurveTo(x + w * 0.2, y + topBandH * 0.86, x, y + topBandH);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.22)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 3. Top-Left Vertical Pennant Ribbon (Points + Purple Power Badge)
  const hasPowerOrWild = card.power !== null || card.bonus === "wild";
  const ribX = x + w * 0.06;
  const ribW = Math.max(15, w * 0.24);
  const ribH = hasPowerOrWild
    ? Math.max(30, h * 0.36)
    : Math.max(18, h * 0.22);

  // Ribbon shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.moveTo(ribX + 1.5, y);
  ctx.lineTo(ribX + ribW + 1.5, y);
  ctx.lineTo(ribX + ribW + 1.5, y + ribH - 4);
  ctx.lineTo(ribX + ribW / 2 + 1.5, y + ribH + 2);
  ctx.lineTo(ribX + 1.5, y + ribH - 4);
  ctx.closePath();
  ctx.fill();

  const ribGrad = ctx.createLinearGradient(ribX, y, ribX + ribW, y);
  ribGrad.addColorStop(0, theme.ribbonBot);
  ribGrad.addColorStop(0.5, theme.ribbonTop);
  ribGrad.addColorStop(1, theme.ribbonBot);
  ctx.fillStyle = ribGrad;
  ctx.beginPath();
  ctx.moveTo(ribX, y);
  ctx.lineTo(ribX + ribW, y);
  ctx.lineTo(ribX + ribW, y + ribH - 5);
  ctx.lineTo(ribX + ribW / 2, y + ribH + 1);
  ctx.lineTo(ribX, y + ribH - 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = theme.ribbonBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Prestige Points inside top of pennant (bold serif white with dark outline)
  if (card.points > 0) {
    const ptFont = Math.max(11, Math.round(ribW * 0.85));
    ctx.font = `900 ${ptFont}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const pyPt = y + Math.max(9, ribW * 0.56);
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = "#1e293b";
    ctx.strokeText(String(card.points), ribX + ribW / 2, pyPt);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(String(card.points), ribX + ribW / 2, pyPt);
  }

  // Purple Circular Power Icon hanging on lower part of pennant
  if (card.power !== null) {
    drawDuelPowerBadge2D(
      ctx,
      ribX + ribW / 2,
      y + ribH - ribW * 0.52,
      Math.max(5.5, ribW * 0.36),
      card.power
    );
  } else if (card.bonus === "wild") {
    drawDuelPowerBadge2D(
      ctx,
      ribX + ribW / 2,
      y + ribH - ribW * 0.52,
      Math.max(5.5, ribW * 0.36),
      "WILD_ATTACH"
    );
  }

  // 4. Top-Center Golden Crown Crest (if card.crowns > 0)
  if (card.crowns > 0) {
    const crownSize = Math.max(10, Math.min(18, w * 0.17));
    drawDuelCrownBadge2D(
      ctx,
      x + w * 0.47,
      y + topBandH * 0.56,
      crownSize,
      card.crowns
    );
  }

  // 5. Top-Right Circular Ivory Bonus Gem Medallion (or 5-Color Wild Rainbow Ring)
  if (card.bonus !== null) {
    const medR = Math.max(8, Math.min(18, w * 0.165));
    const mx = x + w - medR - Math.max(3, w * 0.05);
    const my = y + medR + Math.max(3, h * 0.035);

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.arc(mx + 1, my + 1.5, medR + 1, 0, Math.PI * 2);
    ctx.fill();

    // Ivory inner disc
    ctx.fillStyle = "#f5efe6";
    ctx.beginPath();
    ctx.arc(mx, my, medR, 0, Math.PI * 2);
    ctx.fill();

    if (card.bonus === "wild") {
      // 5-Color Rainbow Ring + 5 Mini Gems inside (matches level1-26/27/29/30!)
      const segColors = ["#111827", "#f8fafc", "#dc2626", "#16a34a", "#0284c7"];
      segColors.forEach((col, i) => {
        ctx.strokeStyle = col;
        ctx.lineWidth = Math.max(2, medR * 0.22);
        ctx.beginPath();
        const a0 = -Math.PI * 0.8 + (i * Math.PI * 2) / 5;
        ctx.arc(mx, my, medR, a0, a0 + (Math.PI * 2) / 5 + 0.04);
        ctx.stroke();

        // Tiny gem dot inside circle
        const ga = a0 + Math.PI / 5;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(
          mx + Math.cos(ga) * medR * 0.48,
          my + Math.sin(ga) * medR * 0.48,
          Math.max(1.5, medR * 0.22),
          0,
          Math.PI * 2
        );
        ctx.fill();
      });
    } else {
      // Draw 1 or 2 Side-by-Side Circular Ivory Bonus Gem Medallions (official Level 2 x2 look!)
      const count = card.bonusCount >= 2 ? 2 : 1;
      const rUse = count === 2 ? medR * 0.92 : medR;
      const centers =
        count === 2
          ? [mx - rUse * 1.82, mx]
          : [mx];

      for (const cxMed of centers) {
        if (cxMed !== mx) {
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.beginPath();
          ctx.arc(cxMed + 1, my + 1.5, rUse + 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#f5efe6";
          ctx.beginPath();
          ctx.arc(cxMed, my, rUse, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = theme.ring;
        ctx.lineWidth = Math.max(1.8, rUse * 0.2);
        ctx.beginPath();
        ctx.arc(cxMed, my, rUse, 0, Math.PI * 2);
        ctx.stroke();

        drawDuelPixelTokenIcon2D(ctx, cxMed, my, rUse * 1.45, card.bonus);
      }
    }
  }

  // 6. Bottom-Left Official Gold-Rimmed Cost Medallions + Mini Gem Silhouettes
  const costCols = (
    [...SPLENDOR_GEMS, "pearl"] as (SplendorGemColor | "pearl")[]
  ).filter((g) => card.cost[g] > 0);
  const circleR = Math.max(6, Math.min(11, w * 0.13));
  const rowStep = circleR * 2 + 2.5;
  const botY = y + h - circleR - Math.max(4, h * 0.035);
  const costX = x + circleR + Math.max(4, w * 0.055);

  // Stack from bottom up (Pearl at very bottom, matching official cards!)
  const orderedCosts = [...costCols].reverse();
  orderedCosts.forEach((col, idx) => {
    const cyCost = botY - idx * rowStep;
    const meta = DUEL_TOKEN_META[col];

    // Drop shadow
    ctx.fillStyle = "rgba(0,0,0,0.48)";
    ctx.beginPath();
    ctx.arc(costX + 1, cyCost + 1.5, circleR + 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Colored fill + Gold/Silver rim
    ctx.fillStyle =
      col === "pearl"
        ? "#e8b4d0"
        : col === "white"
          ? "#f1f5f9"
          : col === "black"
            ? "#3f4652"
            : meta.hex;
    ctx.strokeStyle = col === "pearl" ? "#f9d6ea" : "#eab308";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(costX, cyCost, circleR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bold outlined numeral
    const numFont = Math.max(9, Math.round(circleR * 1.4));
    ctx.font = `900 ${numFont}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = "#0f172a";
    ctx.strokeText(String(card.cost[col]), costX - 0.5, cyCost + 0.5);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(String(card.cost[col]), costX - 0.5, cyCost + 0.5);

    // Tiny matching gem icon tucked on right edge of cost medallion
    const miniR = Math.max(3, circleR * 0.46);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(costX + circleR * 0.85, cyCost + 0.5, miniR + 0.9, 0, Math.PI * 2);
    ctx.fill();
    drawDuelPixelTokenIcon2D(
      ctx,
      costX + circleR * 0.85,
      cyCost + 0.5,
      miniR * 1.9,
      col
    );
  });

  ctx.restore(); // End card clip

  // Outer Card Frame Border (Gold = Selected, Emerald = Affordable)
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.strokeStyle = options?.selected
    ? "#fde047"
    : options?.affordable
      ? "#4ade80"
      : "#1e293b";
  ctx.lineWidth = options?.selected ? 3 : options?.affordable ? 2.4 : 1.5;
  ctx.stroke();

  ctx.restore();
}

// ============================================================================
// ALL 4 HANDCRAFTED 2D OFFICIAL ROYAL PORTRAITS (royal-01 .. royal-04)
// ============================================================================

function drawDuelRoyalPortrait2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  variant: number
) {
  const cx = x + w * 0.52;

  if (variant === 0) {
    // royal-01: Hooded Emerald Spy (STEAL, 2pts)
    ctx.fillStyle = "#6e7368";
    ctx.fillRect(x, y, w, h);

    // Dark emerald cloak shoulders & inner tunic
    ctx.fillStyle = "#1b4942";
    ctx.beginPath();
    ctx.moveTo(x - w * 0.05, y + h);
    ctx.quadraticCurveTo(x + w * 0.08, y + h * 0.52, cx, y + h * 0.45);
    ctx.quadraticCurveTo(x + w * 0.92, y + h * 0.52, x + w * 1.05, y + h);
    ctx.closePath();
    ctx.fill();

    // Inner dark armor & gold clasp
    ctx.fillStyle = "#2b3033";
    ctx.fillRect(cx - w * 0.17, y + h * 0.56, w * 0.34, h * 0.44);
    ctx.strokeStyle = "#eab308";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.1, y + h * 0.66);
    ctx.quadraticCurveTo(cx, y + h * 0.72, cx + w * 0.1, y + h * 0.66);
    ctx.stroke();

    // Face in shadow
    ctx.fillStyle = "#c99e9b";
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.36, w * 0.21, h * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    // Dark tousled bangs + stern right eye
    ctx.fillStyle = "#1a1719";
    ctx.beginPath();
    ctx.arc(cx, y + h * 0.26, w * 0.24, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.ellipse(cx + w * 0.1, y + h * 0.3, w * 0.055, h * 0.02, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.arc(cx + w * 0.1, y + h * 0.3, w * 0.025, 0, Math.PI * 2);
    ctx.fill();

    // Iconic Emerald Hood curving diagonally over left eye
    ctx.fillStyle = "#2e7365";
    ctx.strokeStyle = "#13362f";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.04, y + h * 0.65);
    ctx.quadraticCurveTo(x + w * 0.14, y + h * 0.1, cx, y + h * 0.04);
    ctx.quadraticCurveTo(x + w * 0.84, y + h * 0.06, x + w * 0.86, y + h * 0.45);
    ctx.lineTo(x + w * 0.96, y + h * 0.65);
    ctx.quadraticCurveTo(x + w * 0.72, y + h * 0.6, x + w * 0.66, y + h * 0.34);
    ctx.quadraticCurveTo(x + w * 0.62, y + h * 0.18, cx - w * 0.06, y + h * 0.24);
    ctx.quadraticCurveTo(x + w * 0.32, y + h * 0.36, x + w * 0.26, y + h * 0.36);
    ctx.quadraticCurveTo(x + w * 0.32, y + h * 0.56, x + w * 0.04, y + h * 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (variant === 1) {
    // royal-02: Renaissance Turban Noblewoman (EXTRA_TURN, 2pts)
    ctx.fillStyle = "#d1936b";
    ctx.fillRect(x, y, w, h);

    // Oversized Chestnut-Brown Pleated Balzo Turban
    ctx.fillStyle = "#9e654d";
    ctx.strokeStyle = "#4d2a1e";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.28, w * 0.5, h * 0.24, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Vibrant Teal Headband
    ctx.fillStyle = "#2b7f9e";
    ctx.beginPath();
    ctx.ellipse(cx - w * 0.02, y + h * 0.27, w * 0.26, h * 0.055, -0.12, Math.PI, Math.PI * 2);
    ctx.fill();

    // White Renaissance puffy sleeves & Striped Teal-Slate Doublet
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.ellipse(x + w * 0.88, y + h * 0.84, w * 0.2, h * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#29464f";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.06, y + h);
    ctx.quadraticCurveTo(x + w * 0.2, y + h * 0.58, cx, y + h * 0.56);
    ctx.quadraticCurveTo(x + w * 0.82, y + h * 0.62, x + w * 0.9, y + h);
    ctx.closePath();
    ctx.fill();

    // Gentle face & bright violet-blue eyes
    ctx.fillStyle = "#d8b0a6";
    ctx.beginPath();
    ctx.ellipse(cx + w * 0.02, y + h * 0.42, w * 0.22, h * 0.145, -0.08, 0, Math.PI * 2);
    ctx.fill();
    for (const ex of [cx - w * 0.07, cx + w * 0.11]) {
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.ellipse(ex, y + h * 0.39, w * 0.055, h * 0.022, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4f46e5";
      ctx.beginPath();
      ctx.arc(ex + 1, y + h * 0.39, w * 0.028, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (variant === 2) {
    // royal-03: Bearded Magistrate with Ruff Collar & Scroll (PRIVILEGE, 2pts)
    ctx.fillStyle = "#e2d1a8";
    ctx.fillRect(x, y, w, h);

    // Dark Slate Magistrate Robes & Pale Under-tunic
    ctx.fillStyle = "#293b47";
    ctx.beginPath();
    ctx.moveTo(x - w * 0.05, y + h);
    ctx.quadraticCurveTo(x + w * 0.1, y + h * 0.42, cx, y + h * 0.38);
    ctx.quadraticCurveTo(x + w * 0.92, y + h * 0.42, x + w * 1.05, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.18, y + h * 0.46);
    ctx.lineTo(cx + w * 0.22, y + h * 0.46);
    ctx.lineTo(cx + w * 0.14, y + h);
    ctx.lineTo(cx - w * 0.12, y + h);
    ctx.closePath();
    ctx.fill();

    // Pleated White Elizabethan Ruff Collar
    ctx.fillStyle = "#b8c7d4";
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.39, w * 0.34, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rosy Bearded Face
    ctx.fillStyle = "#dfaeb0";
    ctx.beginPath();
    ctx.ellipse(cx + w * 0.02, y + h * 0.28, w * 0.23, h * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    // Beard & Mustache
    ctx.strokeStyle = "#4a2e28";
    ctx.lineWidth = Math.max(1.5, w * 0.03);
    ctx.beginPath();
    ctx.arc(cx + w * 0.02, y + h * 0.31, w * 0.18, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Dark Teal Flat Beret Hat
    ctx.fillStyle = "#1f424f";
    ctx.strokeStyle = "#0f2229";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.11, w * 0.27, h * 0.09, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Ornate Gold Brooch Pendant
    ctx.fillStyle = "#eab308";
    ctx.beginPath();
    ctx.ellipse(cx + w * 0.04, y + h * 0.62, w * 0.1, h * 0.045, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rolled Brown Parchment Scroll in foreground right
    ctx.fillStyle = "#a6857c";
    ctx.strokeStyle = "#4a332d";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.08, y + h * 0.72);
    ctx.lineTo(cx + w * 0.32, y + h * 0.76);
    ctx.lineTo(cx + w * 0.24, y + h);
    ctx.lineTo(cx + w * 0.02, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // royal-04: Crowned Red-Haired Queen (No power, 3pts)
    ctx.fillStyle = "#dbd4cf";
    ctx.fillRect(x, y, w, h);

    // Grey-white head veil behind auburn hair
    ctx.fillStyle = "#525563";
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.34, w * 0.32, h * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#9c3e44";
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.36, w * 0.26, h * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();

    // Crimson Brocade Gown + Navy Royal Mantle on Right Shoulder
    ctx.fillStyle = "#b85449";
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w * 0.14, y + h * 0.62);
    ctx.lineTo(x + w * 0.86, y + h * 0.62);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#1e3a5f";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.68, y + h * 0.6);
    ctx.lineTo(x + w, y + h * 0.62);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w * 0.56, y + h);
    ctx.closePath();
    ctx.fill();

    // Porcelain face & Double-Strand Gold Necklace
    ctx.fillStyle = "#dfc1be";
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.32, w * 0.21, h * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d99b38";
    ctx.lineWidth = Math.max(1.8, w * 0.032);
    ctx.beginPath();
    ctx.arc(cx, y + h * 0.55, w * 0.14, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, y + h * 0.62, w * 0.16, 0.3, Math.PI - 0.3);
    ctx.stroke();

    // Golden Diadem Crown Band
    ctx.fillStyle = "#e0aa53";
    ctx.strokeStyle = "#783f0f";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, y + h * 0.2, w * 0.24, Math.PI * 1.15, Math.PI * 1.85);
    ctx.lineTo(cx + w * 0.2, y + h * 0.15);
    ctx.quadraticCurveTo(cx, y + h * 0.09, cx - w * 0.2, y + h * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

/**
 * Draws an official-style 2D Splendor Duel Royal Card matching `royal-01.png`..`royal-04.png`:
 * - Full-bleed 2D Renaissance Portrait
 * - Golden top-left ribbon pennant with bold Points (`2` or `3`) + Purple Power Badge
 * - Delicate golden corner filigree frame
 * - Bottom golden `3👑` & `6👑` crown threshold crests
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
  const radius = Math.max(5, Math.min(w, h) * 0.09);

  // Drop shadow
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  drawRoundedRect(ctx, x + 2, y + 3, w, h, radius);
  ctx.fill();

  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.clip();

  // 1. Handcrafted 2D Royal Portrait
  drawDuelRoyalPortrait2D(ctx, x, y, w, h, royal.portraitVariant);

  // 2. Delicate inner gold filigree rectangle
  ctx.strokeStyle = "rgba(250, 204, 21, 0.65)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);

  // 3. Top-Left Golden Pennant Ribbon (Points + Purple Power Icon)
  const ribX = x + w * 0.05;
  const ribW = Math.max(14, w * 0.26);
  const ribH = royal.power ? Math.max(28, h * 0.39) : Math.max(18, h * 0.24);

  const gGrad = ctx.createLinearGradient(ribX, y, ribX + ribW, y);
  gGrad.addColorStop(0, "#d97706");
  gGrad.addColorStop(0.5, "#fde047");
  gGrad.addColorStop(1, "#d97706");
  ctx.fillStyle = gGrad;
  ctx.beginPath();
  ctx.moveTo(ribX, y);
  ctx.lineTo(ribX + ribW, y);
  ctx.lineTo(ribX + ribW, y + ribH - 5);
  ctx.lineTo(ribX + ribW / 2, y + ribH + 1);
  ctx.lineTo(ribX, y + ribH - 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#92400e";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Prestige Points Numeral
  ctx.font = `900 ${Math.max(10, Math.round(ribW * 0.85))}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = "#78350f";
  ctx.strokeText(String(royal.points), ribX + ribW / 2, y + Math.max(9, ribW * 0.55));
  ctx.fillStyle = "#ffffff";
  ctx.fillText(String(royal.points), ribX + ribW / 2, y + Math.max(9, ribW * 0.55));

  if (royal.power) {
    drawDuelPowerBadge2D(
      ctx,
      ribX + ribW / 2,
      y + ribH - ribW * 0.52,
      Math.max(5, ribW * 0.37),
      royal.power
    );
  }

  // 4. Bottom-Left `3👑` & Bottom-Right `6👑` Golden Arch Crests
  const crestW = Math.max(18, w * 0.28);
  const crestH = Math.max(11, h * 0.13);
  const cyBot = y + h - crestH - 2;
  for (const [cxCrest, label] of [
    [x + 3, "3"],
    [x + w - crestW - 3, "6"],
  ] as const) {
    drawRoundedRect(ctx, cxCrest, cyBot, crestW, crestH, 3);
    ctx.fillStyle = "#f59e0b";
    ctx.fill();
    ctx.strokeStyle = "#fef08a";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = `900 ${Math.max(7, Math.round(crestH * 0.72))}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${label}👑`, cxCrest + crestW / 2, cyBot + crestH / 2 + 0.5);
  }

  ctx.restore(); // end clip

  // Outer border
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.strokeStyle = selectable ? "#fde047" : "#ca8a04";
  ctx.lineWidth = selectable ? 3 : 1.6;
  ctx.stroke();

  ctx.restore();
}
