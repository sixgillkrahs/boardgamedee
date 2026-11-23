import { drawRoundedRect } from "@/canvas/engine";
import {
  DUEL_CARD_ATLAS_RECTS,
  DUEL_TOKEN_ATLAS_RECTS,
  getDuelCardPixelAtlas,
  getDuelTokenPixelAtlas,
} from "@/canvas/splendor-duel-atlas";
import {
  SPLENDOR_GEM_META,
  SPLENDOR_GEMS,
  type SplendorCardTier,
  type SplendorDevCard,
  type SplendorGemColor,
  type SplendorNobleTile,
  type SplendorTokenColor,
} from "@/cartridges/splendor";

/**
 * Draws a crisp 16-bit 2D Pixel-Art Renaissance Guildhall & Jeweler's Workbench background
 * snapped to a 4x4 pixel grid (`P = 4`), matching the retro pixel-art aesthetic.
 */
export function drawSplendorPixelBackground2D(
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
  const wallBottomRow = Math.floor((height * 0.24) / P);

  const fillPx = (gx: number, gy: number, gw = 1, gh = 1, col?: string) => {
    if (col) ctx.fillStyle = col;
    ctx.fillRect(gx * P, gy * P, gw * P, gh * P);
  };

  // 1. Upper Renaissance Guildhall Dark Walnut & Stone Ashlar Wall
  fillPx(0, 0, cols, wallBottomRow, "#191114");
  for (let r = 0; r < wallBottomRow; r += 3) {
    const shift = (Math.floor(r / 3) % 2) * 4;
    for (let c = -shift; c < cols; c += 8) {
      fillPx(c, r, 7, 2, "#24191c");
      fillPx(c, r, 7, 1, "#2f2125");
    }
  }

  // Two Pixel-Art Gothic Arched Windows overlooking a Renaissance Starry Twilight Sky
  const blinkTick = Math.floor(nowMs / 480);
  for (const winCenterFrac of [0.18, 0.82]) {
    const wCx = Math.floor((width * winCenterFrac) / P);
    const wHalf = Math.max(8, Math.floor((width * 0.065) / P));
    const wTop = 2;
    const wBot = Math.max(wTop + 8, wallBottomRow - 2);

    // Arched stone frame & starry indigo night sky inside window
    for (let gy = wTop; gy <= wBot; gy++) {
      const archProgress = Math.max(0, (wTop + 6 - gy) / 6);
      const span = Math.max(
        2,
        Math.floor(wHalf * Math.sqrt(Math.max(0, 1 - archProgress * archProgress)))
      );
      fillPx(wCx - span - 1, gy, span * 2 + 3, 1, "#4a3630");
      const skyCol = gy < wTop + 6 ? "#091026" : gy < wBot - 3 ? "#152142" : "#2e2442";
      fillPx(wCx - span, gy, span * 2 + 1, 1, skyCol);
    }
    // Stained-glass lead mullion crossbars
    fillPx(wCx, wTop + 1, 1, wBot - wTop, "#3d2d28");
    fillPx(wCx - wHalf + 1, Math.floor((wTop + wBot) / 2), wHalf * 2 - 1, 1, "#3d2d28");
    // Twinkling pixel stars through window
    fillPx(
      wCx - 3,
      wTop + 4,
      1,
      1,
      blinkTick % 2 === 0 ? "#fef08a" : "#93c5fd"
    );
    fillPx(
      wCx + 4,
      wTop + 6,
      1,
      1,
      blinkTick % 3 === 0 ? "#ffffff" : "#fde047"
    );
  }

  // Flickering 16-Bit Pixel-Art Golden Wall Candelabras flanking the center
  const flameFrame = Math.floor(nowMs / 160) % 3;
  for (const candFrac of [0.35, 0.65]) {
    const cx = Math.floor((width * candFrac) / P);
    const cy = Math.max(8, wallBottomRow - 5);
    // Warm pixel halo glow
    fillPx(cx - 4, cy - 5, 9, 7, "rgba(251, 191, 36, 0.12)");
    fillPx(cx - 2, cy - 4, 5, 5, "rgba(254, 240, 138, 0.18)");
    // Brass sconce bracket
    fillPx(cx, cy, 1, 4, "#b45309");
    fillPx(cx - 2, cy, 5, 1, "#eab308");
    // Two wax candles & flickering pixel flames
    for (const dx of [-2, 2]) {
      fillPx(cx + dx, cy - 2, 1, 2, "#fef3c7");
      fillPx(cx + dx, cy - 3, 1, 1, flameFrame === 0 ? "#f97316" : "#fde047");
      fillPx(cx + dx, cy - 4 - (flameFrame === 1 ? 1 : 0), 1, 1, "#fef08a");
    }
  }

  // Carved Walnut & Gold Molding Divider between Wall and Velvet Jeweler's Workbench
  fillPx(0, wallBottomRow, cols, 2, "#452719");
  fillPx(0, wallBottomRow, cols, 1, "#b45309");
  for (let c = 2; c < cols; c += 6) {
    fillPx(c, wallBottomRow, 2, 1, "#fde047");
  }

  // 2. Royal Emerald-Teal 16-Bit Pixel-Art Velvet Jeweler's Workbench Surface
  const deskStart = wallBottomRow + 2;
  fillPx(0, deskStart, cols, rows - deskStart, "#0a2420");

  // Checkerboard subtle velvet weave & pixel dithering
  for (let r = deskStart; r < rows; r += 2) {
    const rowShade =
      r < deskStart + 6
        ? "#0e302a"
        : r > rows - 8
          ? "#061714"
          : "#0c2b26";
    ctx.fillStyle = rowShade;
    ctx.fillRect(0, r * P, width, P);

    if (r % 4 === 0) {
      ctx.fillStyle = "#113831";
      for (let c = (r / 2) % 2 === 0 ? 0 : 2; c < cols; c += 4) {
        ctx.fillRect(c * P, r * P, P * 2, P);
      }
    }
  }

  // Outer Gold Filigree Pixel Frame around the Jeweler's Velvet Mat
  const padC = 2;
  const topR = deskStart + 1;
  const botR = rows - 2;
  if (botR > topR + 4) {
    fillPx(padC, topR, cols - padC * 2, 1, "#a16207");
    fillPx(padC, botR, cols - padC * 2, 1, "#a16207");
    fillPx(padC, topR, 1, botR - topR + 1, "#a16207");
    fillPx(cols - padC - 1, topR, 1, botR - topR + 1, "#a16207");

    // Corner gold diamond studs
    for (const [cx, cy] of [
      [padC, topR],
      [cols - padC - 1, topR],
      [padC, botR],
      [cols - padC - 1, botR],
    ] as const) {
      fillPx(cx - 1, cy - 1, 3, 3, "#eab308");
      fillPx(cx, cy, 1, 1, "#fef08a");
    }
  }

  ctx.restore();
}

/**
 * Draws a crisp 16-bit Pixel-Art Gem Sprite centered at `(cx, cy)` with size `s`.
 * Each of the 6 Splendor gem types has its own iconic cut/silhouette:
 * - white (Diamond): Octahedral diamond cut
 * - blue (Sapphire): Oval faceted teardrop/oval cut
 * - green (Emerald): Stepped rectangular emerald cut
 * - red (Ruby): Cushion / heart-faceted ruby cut
 * - black (Onyx): Smooth hexagonal dark onyx cut
 * - gold (Gold Joker): Stacked golden bullion ingot bars
 */
export function drawSplendorPixelGemIcon2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: SplendorTokenColor
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const meta = SPLENDOR_GEM_META[color];
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

  if (color === "white") {
    // Diamond: Brilliant faceted diamond silhouette
    px(2, 1, 6, 1, "#0f172a");
    px(1, 2, 8, 2, "#0f172a");
    px(2, 4, 6, 2, "#0f172a");
    px(3, 6, 4, 2, "#0f172a");
    px(4, 8, 2, 1, "#0f172a");

    px(3, 2, 4, 1, meta.highlightHex);
    px(2, 3, 6, 1, meta.hex);
    px(3, 4, 4, 2, "#cbd5e1");
    px(4, 6, 2, 2, meta.darkHex);
    px(3, 2, 2, 2, "#ffffff");
  } else if (color === "blue") {
    // Sapphire: Tall faceted royal oval gem
    px(3, 1, 4, 1, "#0f172a");
    px(2, 2, 6, 6, "#0f172a");
    px(3, 8, 4, 1, "#0f172a");

    px(3, 2, 4, 6, meta.hex);
    px(3, 2, 2, 3, meta.highlightHex);
    px(5, 5, 2, 3, meta.darkHex);
    px(3, 2, 1, 2, "#eff6ff");
  } else if (color === "green") {
    // Emerald: Classic rectangular stepped emerald cut
    px(2, 1, 6, 8, "#052e16");
    px(1, 2, 8, 6, "#052e16");

    px(2, 2, 6, 6, meta.hex);
    px(3, 3, 4, 4, "#22c55e");
    px(2, 2, 3, 2, meta.highlightHex);
    px(5, 6, 3, 2, meta.darkHex);
    px(3, 2, 1, 1, "#f0fdf4");
  } else if (color === "red") {
    // Ruby: Faceted cushion / octagonal crimson gem
    px(3, 1, 4, 8, "#450a0a");
    px(1, 3, 8, 4, "#450a0a");
    px(2, 2, 6, 6, "#450a0a");

    px(3, 2, 4, 6, meta.hex);
    px(2, 3, 6, 4, meta.hex);
    px(3, 2, 2, 2, meta.highlightHex);
    px(5, 5, 2, 2, meta.darkHex);
    px(2, 3, 1, 1, "#fff1f2");
  } else if (color === "black") {
    // Onyx: Sleek dark hexagonal gemstone with silver specular gleam
    px(3, 1, 4, 8, "#020617");
    px(2, 2, 6, 6, "#020617");

    px(3, 2, 4, 6, meta.hex);
    px(2, 3, 6, 4, "#1e293b");
    px(3, 2, 2, 2, meta.highlightHex);
    px(3, 2, 1, 1, "#f8fafc");
    px(5, 5, 2, 2, meta.darkHex);
  } else {
    // Gold: Stacked 16-bit golden bullion bars (Joker)
    px(1, 5, 8, 4, "#422006");
    px(2, 2, 6, 4, "#422006");

    px(2, 6, 6, 2, meta.hex);
    px(2, 6, 4, 1, meta.highlightHex);
    px(3, 3, 4, 2, "#facc15");
    px(3, 3, 2, 1, "#fef9c3");
    px(6, 7, 2, 1, meta.darkHex);
  }

  ctx.restore();
}

/**
 * Draws a 16-bit Pixel-Art Splendor Gem Poker Chip / Token Stack at `(cx, cy)` with radius `r`.
 */
export function drawSplendorPixelGemToken2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: SplendorTokenColor,
  count?: number,
  selected = false,
  disabled = false
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const meta = SPLENDOR_GEM_META[color];

  if (disabled) {
    ctx.globalAlpha = 0.4;
  }

  // Pixel-art drop shadow & stacked chip edge
  const stackLayers = count !== undefined ? Math.min(3, Math.max(0, count - 1)) : 1;
  for (let l = stackLayers; l >= 1; l--) {
    ctx.fillStyle = "#090d16";
    ctx.beginPath();
    ctx.arc(cx, cy + l * 3 + 2, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = meta.darkHex;
    ctx.beginPath();
    ctx.arc(cx, cy + l * 3, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Selection pulsing pixel halo
  if (selected) {
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Prefer high-detail 48x48 16-bit Pixel Art Coin Sprite from token atlas
  const tokenAtlas = getDuelTokenPixelAtlas();
  if (tokenAtlas) {
    const rect = DUEL_TOKEN_ATLAS_RECTS[color];
    const drawS = Math.round(r * 2.38);
    ctx.drawImage(
      tokenAtlas,
      rect.sx,
      rect.sy,
      rect.sw,
      rect.sh,
      Math.round(cx - drawS / 2),
      Math.round(cy - drawS / 2 + r * 0.08),
      drawS,
      drawS
    );
  } else {
    // Fallback procedural chip
    ctx.fillStyle = color === "gold" ? "#ca8a04" : "#d6d3d1";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = meta.hex;
    for (const ang of [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]) {
      const sx = cx + Math.cos(ang) * (r * 0.8);
      const sy = cy + Math.sin(ang) * (r * 0.8);
      ctx.fillRect(Math.round(sx - 2), Math.round(sy - 2), 4, 4);
    }

    ctx.fillStyle = color === "white" ? "#334155" : "#111827";
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.74, 0, Math.PI * 2);
    ctx.fill();

    drawSplendorPixelGemIcon2D(ctx, cx, cy, r * 1.15, color);
  }

  // Supply count badge in bottom-right corner
  if (count !== undefined) {
    const bx = cx + r * 0.72;
    const by = cy + r * 0.65;
    const br = Math.max(8, r * 0.44);
    ctx.fillStyle = count > 0 ? "#0f172a" : "#450a0a";
    ctx.strokeStyle = selected ? "#fde047" : "#f59e0b";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = count > 0 ? "#fef08a" : "#fca5a5";
    ctx.font = `bold ${Math.max(9, Math.round(br * 1.15))}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(count), bx, by + 0.5);
  }

  ctx.restore();
}

/**
 * Draws a 16-bit Pixel-Art Splendor Development Card at `(x, y, w, h)`.
 */
export function drawSplendorPixelCard2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  card: SplendorDevCard,
  options?: {
    affordable?: boolean;
    selected?: boolean;
    dimmed?: boolean;
  }
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const bonusMeta = SPLENDOR_GEM_META[card.bonus];
  const radius = Math.max(4, Math.min(w, h) * 0.08);

  if (options?.dimmed) {
    ctx.globalAlpha = 0.55;
  }

  // Pixel drop shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  drawRoundedRect(ctx, x + 3, y + 4, w, h, radius);
  ctx.fill();

  // Clip inside card
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.clip();

  // 1. 16-Bit Pixel-Art Renaissance Scene Background tailored by Tier (Mine / Ship / Palace)
  const bgTop =
    card.tier === 1
      ? "#1b2824"
      : card.tier === 2
        ? "#1e293b"
        : "#2a1b3d";
  const bgBot =
    card.tier === 1
      ? "#0d1412"
      : card.tier === 2
        ? "#0f172a"
        : "#120b1f";
  ctx.fillStyle = bgTop;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = bgBot;
  ctx.fillRect(x, y + h * 0.52, w, h * 0.48);

  const p = Math.max(2, Math.floor(w / 24));
  const px = (gx: number, gy: number, gw: number, gh: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(
      Math.round(x + gx * p),
      Math.round(y + gy * p),
      Math.round(gw * p),
      Math.round(gh * p)
    );
  };

  if (card.tier === 1) {
    // Tier 1: Subterranean Gem Mine Tunnel + Glowing Ore Cart
    px(4, 9, 16, 12, "#291d16");
    px(6, 11, 12, 10, "#120d0a");
    // Timber support beams
    px(5, 9, 2, 12, "#78350f");
    px(17, 9, 2, 12, "#78350f");
    px(4, 9, 16, 2, "#92400e");
    // Glowing gems embedded in cavern rock
    px(9, 13, 2, 2, bonusMeta.hex);
    px(13, 12, 2, 2, bonusMeta.highlightHex);
    px(15, 16, 2, 2, bonusMeta.hex);
    // Mine cart in lower right
    px(11, 19, 8, 4, "#475569");
    px(12, 17, 6, 2, bonusMeta.hex);
    px(13, 16, 3, 1, bonusMeta.highlightHex);
    px(12, 23, 2, 2, "#94a3b8");
    px(16, 23, 2, 2, "#94a3b8");
  } else if (card.tier === 2) {
    // Tier 2: Renaissance Merchant Caravel Ship & Jeweler's Guildhall
    px(0, 18, 26, 8, "#0c4a6e");
    px(2, 20, 6, 1, "#38bdf8");
    px(14, 22, 7, 1, "#38bdf8");
    // Hull & mast
    px(9, 17, 11, 4, "#78350f");
    px(10, 19, 9, 2, "#451a03");
    px(14, 9, 1, 8, "#d97706");
    // Billowing Renaissance sail with gem crest
    px(11, 10, 7, 6, "#fef3c7");
    px(13, 12, 3, 3, bonusMeta.hex);
    px(14, 12, 1, 1, bonusMeta.highlightHex);
  } else {
    // Tier 3: Grand Renaissance Royal Palace & Stained Glass Dome
    px(7, 10, 14, 15, "#3b2f2f");
    px(8, 12, 12, 13, "#4b3b3b");
    // Golden Renaissance dome
    px(10, 7, 8, 3, "#d97706");
    px(12, 5, 4, 2, "#fde047");
    // Three glowing royal arched windows
    for (const wx of [9, 13, 17]) {
      px(wx, 14, 2, 5, bonusMeta.hex);
      px(wx, 14, 1, 2, bonusMeta.highlightHex);
    }
    // Marble entrance steps
    px(9, 22, 10, 3, "#cbd5e1");
  }

  // 2. Top Translucent Header Band (Prestige Points Left + Permanent Gem Bonus Right)
  const headerH = Math.max(18, Math.round(h * 0.25));
  ctx.fillStyle = "rgba(248, 250, 252, 0.86)";
  ctx.fillRect(x, y, w, headerH);
  ctx.fillStyle = bonusMeta.hex;
  ctx.fillRect(x, y + headerH - 2, w, 2);

  if (card.points > 0) {
    ctx.fillStyle = "#0f172a";
    ctx.font = `900 ${Math.max(13, Math.round(headerH * 0.78))}px monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(String(card.points), x + Math.max(5, w * 0.1), y + headerH * 0.52);
  }

  // Top-Right Permanent Gem Bonus Sprite
  drawSplendorPixelGemIcon2D(
    ctx,
    x + w - Math.max(11, headerH * 0.52),
    y + headerH * 0.5,
    headerH * 0.78,
    card.bonus
  );

  // 3. Bottom-Left Gem Cost Circles Column
  const costEntries = SPLENDOR_GEMS.filter((g) => card.cost[g] > 0);
  const circleR = Math.max(6.5, Math.min(10, w * 0.125));
  const rowStep = circleR * 2 + 2.5;
  const bottomY = y + h - circleR - 5;

  costEntries.forEach((gem, idx) => {
    const cyCost = bottomY - idx * rowStep;
    const cxCost = x + circleR + 5;
    const gMeta = SPLENDOR_GEM_META[gem];

    ctx.fillStyle = gMeta.hex;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cxCost, cyCost, circleR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = gMeta.textHex;
    ctx.font = `900 ${Math.max(8.5, Math.round(circleR * 1.25))}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(card.cost[gem]), cxCost, cyCost + 0.5);
  });

  // Tiny tier dots in bottom-right corner
  const tierDotCol =
    card.tier === 1 ? "#4ade80" : card.tier === 2 ? "#facc15" : "#60a5fa";
  for (let d = 0; d < card.tier; d++) {
    ctx.fillStyle = tierDotCol;
    ctx.fillRect(Math.round(x + w - 7 - d * 5), Math.round(y + h - 7), 3, 3);
  }

  ctx.restore(); // End clip

  // 4. Outer Card Frame Border (Pulsing Emerald if Affordable, Bright Gold if Selected)
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.strokeStyle = options?.selected
    ? "#fde047"
    : options?.affordable
      ? "#4ade80"
      : "#64748b";
  ctx.lineWidth = options?.selected ? 3 : options?.affordable ? 2.4 : 1.6;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a 16-bit Pixel-Art Development Deck Stack (Tier 1 Green, Tier 2 Gold, Tier 3 Blue).
 */
export function drawSplendorPixelDeck2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tier: SplendorCardTier,
  count: number,
  selected = false
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const radius = Math.max(4, Math.min(w, h) * 0.08);
  const bg =
    tier === 1 ? "#14532d" : tier === 2 ? "#78350f" : "#1e3a8a";
  const border =
    tier === 1 ? "#4ade80" : tier === 2 ? "#facc15" : "#60a5fa";

  // Empty deck slot outline
  if (count <= 0) {
    drawRoundedRect(ctx, x, y, w, h, radius);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    return;
  }

  // Stacked depth offset
  const layers = Math.min(3, Math.ceil(count / 8));
  for (let l = layers; l >= 1; l--) {
    drawRoundedRect(ctx, x - l * 2, y + l * 2, w, h, radius);
    ctx.fillStyle = "#090d16";
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Prefer high-detail 90x136 16-bit Pixel Art Card Back from atlas (`deck-1`, `deck-2`, `deck-3`)
  const cardAtlas = getDuelCardPixelAtlas();
  const backRect = DUEL_CARD_ATLAS_RECTS[`deck-${tier}`];
  if (cardAtlas && backRect) {
    const rx = Math.round(x);
    const ry = Math.round(y);
    const rw = Math.round(w);
    const rh = Math.round(h);

    ctx.save();
    drawRoundedRect(ctx, rx, ry, rw, rh, radius);
    ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      cardAtlas,
      backRect.sx,
      backRect.sy,
      backRect.sw,
      backRect.sh,
      rx,
      ry,
      rw,
      rh
    );
    ctx.restore();

    drawRoundedRect(ctx, rx, ry, rw, rh, radius);
    ctx.strokeStyle = selected ? "#fde047" : "#0f172a";
    ctx.lineWidth = selected ? 3 : 1.6;
    ctx.stroke();

    // Crisp remaining card count pill in bottom-right corner
    const badgeW = Math.max(20, Math.round(rw * 0.42));
    const badgeH = Math.max(13, Math.round(rh * 0.16));
    const bx = rx + rw - badgeW - 3;
    const by = ry + rh - badgeH - 3;
    drawRoundedRect(ctx, bx, by, badgeW, badgeH, 4);
    ctx.fillStyle = "rgba(9, 13, 24, 0.88)";
    ctx.fill();
    ctx.strokeStyle = selected ? "#fde047" : border;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = "#fef08a";
    ctx.font = `900 ${Math.max(9, Math.round(badgeH * 0.72))}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(count), bx + badgeW / 2, by + badgeH / 2 + 0.5);

    ctx.restore();
    return;
  }

  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = selected ? "#fde047" : border;
  ctx.lineWidth = selected ? 3 : 2;
  ctx.stroke();

  // Inner pixel filigree frame
  drawRoundedRect(ctx, x + 5, y + 5, w - 10, h - 10, Math.max(2, radius - 3));
  ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Tier Roman numeral / dots + remaining count
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fef08a";
  ctx.font = `900 ${Math.max(12, Math.round(w * 0.24))}px monospace`;
  ctx.fillText(
    tier === 1 ? "I" : tier === 2 ? "II" : "III",
    x + w / 2,
    y + h * 0.36
  );

  // Pixel tier dots
  const dotGap = 8;
  const startDotX = x + w / 2 - ((tier - 1) * dotGap) / 2;
  for (let i = 0; i < tier; i++) {
    ctx.fillStyle = border;
    ctx.fillRect(Math.round(startDotX + i * dotGap - 2), Math.round(y + h * 0.56), 4, 4);
  }

  ctx.fillStyle = "#e2e8f0";
  ctx.font = `bold ${Math.max(9.5, Math.round(w * 0.16))}px monospace`;
  ctx.fillText(`${count} lá`, x + w / 2, y + h * 0.78);

  ctx.restore();
}

/**
 * Draws a square 16-bit Pixel-Art Renaissance Noble Tile at `(x, y, size, size)`.
 */
export function drawSplendorPixelNoble2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  noble: SplendorNobleTile,
  eligible = false
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const radius = Math.max(5, size * 0.1);

  // Drop shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  drawRoundedRect(ctx, x + 2, y + 3, size, size, radius);
  ctx.fill();

  ctx.save();
  drawRoundedRect(ctx, x, y, size, size, radius);
  ctx.clip();

  // Renaissance Velvet Portrait Backdrop (varies per Noble portraitVariant)
  const robeColors = [
    "#7f1d1d",
    "#1e3a8a",
    "#581c87",
    "#14532d",
    "#78350f",
    "#831843",
    "#0f172a",
    "#7c2d12",
    "#312e81",
    "#134e4a",
  ];
  const robeCol = robeColors[noble.portraitVariant % robeColors.length];
  ctx.fillStyle = "#1c1917";
  ctx.fillRect(x, y, size, size);

  // Right-side 16-bit Pixel-Art Renaissance Noble Portrait
  const p = Math.max(2, Math.floor(size / 22));
  const px = (gx: number, gy: number, gw: number, gh: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(
      Math.round(x + gx * p),
      Math.round(y + gy * p),
      Math.round(gw * p),
      Math.round(gh * p)
    );
  };

  // Golden tapestry wall behind portrait
  px(8, 0, 15, 22, "#29201a");
  px(10, 2, 11, 18, "#382a20");
  // Royal robe shoulders
  px(9, 14, 12, 9, robeCol);
  px(11, 14, 8, 9, "#eab308"); // Gold brocade trim
  px(12, 15, 6, 8, robeCol);
  // White pleated Renaissance ruff collar
  px(10, 12, 10, 2, "#f8fafc");
  // Face
  px(12, 6, 6, 6, "#f5cba7");
  px(13, 8, 1, 1, "#1c1917"); // Left eye
  px(16, 8, 1, 1, "#1c1917"); // Right eye
  px(14, 10, 2, 1, "#b45309"); // Mouth
  // Golden Royal Crown / Renaissance Velvet Beret
  px(11, 3, 8, 3, "#eab308");
  px(11, 2, 2, 1, "#fef08a");
  px(14, 2, 2, 1, "#fef08a");
  px(17, 2, 2, 1, "#fef08a");
  px(14, 4, 2, 1, "#ef4444"); // Ruby crown jewel

  // Left Vertical Cream Banner for Prestige `3` + Permanent Bonus Requirements
  const stripW = Math.round(size * 0.36);
  ctx.fillStyle = "rgba(248, 250, 252, 0.9)";
  ctx.fillRect(x, y, stripW, size);

  // Prestige Points `3` at top-left
  ctx.fillStyle = "#0f172a";
  ctx.font = `900 ${Math.max(12, Math.round(size * 0.26))}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(noble.points), x + stripW / 2, y + size * 0.19);

  // Required permanent bonus gem squares stacked below `3`
  const reqs = SPLENDOR_GEMS.filter((g) => noble.requirement[g] > 0);
  const boxS = Math.max(10, Math.min(14, Math.floor((size * 0.62) / Math.max(2, reqs.length)) - 2));
  reqs.forEach((gem, idx) => {
    const bx = x + (stripW - boxS) / 2;
    const by = y + size - (idx + 1) * (boxS + 2) - 3;
    const gMeta = SPLENDOR_GEM_META[gem];

    ctx.fillStyle = gMeta.hex;
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1;
    ctx.fillRect(Math.round(bx), Math.round(by), boxS, boxS);
    ctx.strokeRect(Math.round(bx), Math.round(by), boxS, boxS);

    ctx.fillStyle = gMeta.textHex;
    ctx.font = `900 ${Math.max(8, Math.round(boxS * 0.78))}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      String(noble.requirement[gem]),
      bx + boxS / 2,
      by + boxS / 2 + 0.5
    );
  });

  ctx.restore(); // End clip

  // Outer Frame Border (Bright Gold if Eligible!)
  drawRoundedRect(ctx, x, y, size, size, radius);
  ctx.strokeStyle = eligible ? "#fde047" : "#d97706";
  ctx.lineWidth = eligible ? 3.2 : 1.8;
  ctx.stroke();

  ctx.restore();
}
