import { drawRoundedRect } from "@/canvas/engine";
import {
  ALL_TILE_TEMPLATES,
  getTileFeatures,
  rotateAnchor,
  type CarcassonneColor,
  type DeckTileCard,
  type MeepleType,
  type PlacedMeeple,
  type TileTemplate,
} from "@/cartridges/carcassonne";

const EDGE_MID: [number, number][] = [
  [0.5, 0.0], // 0: N
  [1.0, 0.5], // 1: E
  [0.5, 1.0], // 2: S
  [0.0, 0.5], // 3: W
];

/** High-DPI offscreen cache for instant fallback while /sprites/carcassonne-tiles.webp loads. */
const TILE_CACHE_RES = 256;
const tileSpriteCache = new Map<string, HTMLCanvasElement>();

let carcassonneAtlasImg: HTMLImageElement | null = null;
let carcassonneTileBackImg: HTMLImageElement | null = null;
let carcassonneMeeplesImg: HTMLImageElement | null = null;
let carcassonneLobbyBgImg: HTMLImageElement | null = null;

export function getCarcassonneLobbyBgImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!carcassonneLobbyBgImg) {
    const img = new Image();
    img.src = "/sprites/carcassonne-lobby-bg.webp";
    carcassonneLobbyBgImg = img;
  }
  return carcassonneLobbyBgImg.complete &&
    carcassonneLobbyBgImg.naturalWidth > 0
    ? carcassonneLobbyBgImg
    : null;
}

export function getCarcassonneTilesImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!carcassonneAtlasImg) {
    const img = new Image();
    img.src = "/sprites/carcassonne-tiles.webp";
    carcassonneAtlasImg = img;
  }
  return carcassonneAtlasImg.complete && carcassonneAtlasImg.naturalWidth > 0
    ? carcassonneAtlasImg
    : null;
}

export function getCarcassonneTileBackImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!carcassonneTileBackImg) {
    const img = new Image();
    img.src = "/sprites/carcassonne-tile-back.png";
    carcassonneTileBackImg = img;
  }
  return carcassonneTileBackImg.complete &&
    carcassonneTileBackImg.naturalWidth > 0
    ? carcassonneTileBackImg
    : null;
}

export function getCarcassonneMeeplesImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!carcassonneMeeplesImg) {
    const img = new Image();
    img.src = "/sprites/carcassonne-meeples.png";
    carcassonneMeeplesImg = img;
  }
  return carcassonneMeeplesImg.complete &&
    carcassonneMeeplesImg.naturalWidth > 0
    ? carcassonneMeeplesImg
    : null;
}

export function drawCarcassonneTileBack2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  const dx = Math.round(x);
  const dy = Math.round(y);
  const ds = Math.round(size);
  const radius = Math.max(4, ds * 0.08);
  drawSingleTileBackFace(ctx, dx, dy, ds, radius, getCarcassonneTileBackImage());
}

/**
 * Draws a tactile 3D stacked Carcassonne Tile Draw Pile using the ornate
 * Gothic "C" tile back (/sprites/carcassonne-tile-back.png).
 * Stack height dynamically shrinks as tiles are drawn, with a golden callout when it's your turn to draw.
 */
export function drawCarcassonneDrawPile2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileSize: number,
  tilesRemaining: number,
  options?: {
    isRiverPhase?: boolean;
    canDraw?: boolean;
    isHovered?: boolean;
    pulsePhase?: number;
  }
): void {
  const dx = Math.round(x);
  const dy = Math.round(y);
  const ds = Math.round(tileSize);
  const radius = Math.max(4, ds * 0.08);
  const backImg = getCarcassonneTileBackImage();
  const canDraw = Boolean(options?.canDraw && tilesRemaining > 0);
  const pulse = options?.pulsePhase ?? 0.5;

  ctx.save();

  // Golden glowing aura when it's your turn to draw a tile!
  if (canDraw) {
    ctx.save();
    ctx.shadowColor = `rgba(250, 204, 21, ${0.45 + 0.4 * pulse})`;
    ctx.shadowBlur = options?.isHovered ? 24 : 16;
    drawRoundedRect(ctx, dx - 6, dy - 6, ds + 12, ds + 34, 12);
    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.fill();
    ctx.restore();
  }

  // Recessed dark tabletop slot tray underneath the pile
  drawRoundedRect(ctx, dx - 6, dy - 6, ds + 12, ds + 34, 12);
  ctx.fillStyle = canDraw
    ? options?.isHovered
      ? "rgba(30, 41, 59, 0.95)"
      : "rgba(15, 23, 42, 0.9)"
    : "rgba(15, 23, 42, 0.8)";
  ctx.fill();
  ctx.strokeStyle = canDraw
    ? "#fde047"
    : options?.isRiverPhase
      ? "rgba(56, 189, 248, 0.55)"
      : "rgba(251, 191, 36, 0.38)";
  ctx.lineWidth = canDraw ? 2.2 : 1.4;
  ctx.stroke();

  if (tilesRemaining <= 0) {
    ctx.save();
    ctx.setLineDash([4, 4]);
    drawRoundedRect(ctx, dx + 2, dy + 2, ds - 4, ds - 4, radius);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#94a3b8";
    ctx.font = "800 10px system-ui, sans-serif";
    ctx.fillText("HẾT MẢNH", dx + ds / 2, dy + ds / 2);
  } else {
    const layers = Math.max(1, Math.min(12, Math.ceil(tilesRemaining / 6)));
    const stepY = 2.0;
    const baseOffsetY = (layers - 1) * stepY;

    // Soft cast shadow on wooden tray
    ctx.save();
    ctx.fillStyle = "rgba(2, 6, 23, 0.55)";
    drawRoundedRect(ctx, dx + 3, dy + baseOffsetY + 5, ds, ds, radius);
    ctx.fill();
    ctx.restore();

    // Stacked cardboard edge layers from bottom to top
    for (let i = 0; i < layers; i++) {
      const ly = Math.round(dy + baseOffsetY - i * stepY);
      const isTop = i === layers - 1;

      if (!isTop) {
        drawRoundedRect(ctx, dx, ly, ds, ds, radius);
        ctx.fillStyle = i % 2 === 0 ? "#c7b89c" : "#a8987c";
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(30, 22, 14, 0.65)";
        ctx.stroke();
      } else {
        const hoverLift = canDraw && options?.isHovered ? -5 : canDraw ? -2 * pulse : 0;
        drawSingleTileBackFace(ctx, dx, Math.round(ly + hoverLift), ds, radius, backImg);
        if (canDraw) {
          // Crisp golden rim on top drawable tile
          drawRoundedRect(ctx, dx + 0.5, Math.round(ly + hoverLift) + 0.5, ds - 1, ds - 1, radius);
          ctx.lineWidth = 2;
          ctx.strokeStyle = options?.isHovered ? "#fef08a" : "#facc15";
          ctx.stroke();
        }
      }
    }
  }

  // Bottom label + gold count badge
  const labelY = dy + ds + 16;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = canDraw
    ? "#fde047"
    : options?.isRiverPhase
      ? "#7dd3fc"
      : "#cbd5e1";
  ctx.font = "900 9.5px system-ui, sans-serif";
  ctx.fillText(
    canDraw
      ? "👆 RÚT MẢNH"
      : options?.isRiverPhase
        ? "CHỒNG SÔNG"
        : "CHỒNG RÚT",
    dx,
    labelY
  );

  const badgeText = String(tilesRemaining);
  ctx.font = "900 11px system-ui, sans-serif";
  const bw = Math.max(26, ctx.measureText(badgeText).width + 12);
  const bx = dx + ds - bw;
  const by = labelY - 9;
  drawRoundedRect(ctx, bx, by, bw, 18, 9);
  ctx.fillStyle = tilesRemaining > 0 ? "#f59e0b" : "#334155";
  ctx.fill();
  ctx.textAlign = "center";
  ctx.fillStyle = tilesRemaining > 0 ? "#0f172a" : "#94a3b8";
  ctx.fillText(badgeText, bx + bw / 2, labelY + 0.5);

  ctx.restore();
}

function drawSingleTileBackFace(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  radius: number,
  backImg: HTMLImageElement | null
) {
  ctx.save();
  drawRoundedRect(ctx, x, y, size, size, radius);
  ctx.clip();

  if (backImg) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(backImg, x, y, size, size);
  } else {
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = "#334155";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${Math.round(size * 0.55)}px Georgia, serif`;
    ctx.fillText("C", x + size / 2, y + size / 2);
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 1.5, y + size - 1.5);
  ctx.lineTo(x + 1.5, y + 1.5);
  ctx.lineTo(x + size - 1.5, y + 1.5);
  ctx.stroke();

  ctx.restore();

  drawRoundedRect(ctx, x + 0.5, y + 0.5, size - 1, size - 1, radius);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#1e293b";
  ctx.stroke();
}

interface AtlasSpriteSpec {
  col: number;
  row: number;
  /** Extra 90° CW rotation so raw sprite matches template's unrotated [N,E,S,W] edges. */
  spriteRot: number;
  gardenCol?: number;
  gardenRow?: number;
}

/**
 * Verified 16x10 atlas coordinates in /sprites/carcassonne-tiles.webp for all
 * 24 Base Game tiles (A..X), their C3 Garden variants, and all 12 River tiles.
 */
const CARCASSONNE_ATLAS_MAP: Record<string, AtlasSpriteSpec> = {
  A: { col: 1, row: 4, spriteRot: 0 },
  B: { col: 13, row: 3, spriteRot: 0 },
  C: { col: 3, row: 4, spriteRot: 0 },
  D: { col: 3, row: 2, spriteRot: 0 },
  E: { col: 6, row: 1, spriteRot: 0, gardenCol: 5, gardenRow: 1 },
  F: { col: 14, row: 0, spriteRot: 0 },
  G: { col: 13, row: 0, spriteRot: 0 },
  H: { col: 2, row: 1, spriteRot: 1, gardenCol: 4, gardenRow: 1 },
  I: { col: 1, row: 1, spriteRot: 1, gardenCol: 0, gardenRow: 1 },
  J: { col: 13, row: 1, spriteRot: 0 },
  K: { col: 10, row: 1, spriteRot: 0 },
  L: { col: 0, row: 2, spriteRot: 0 },
  M: { col: 7, row: 0, spriteRot: 0 },
  N: { col: 3, row: 0, spriteRot: 0, gardenCol: 4, gardenRow: 0 },
  O: { col: 11, row: 0, spriteRot: 0 },
  P: { col: 8, row: 0, spriteRot: 0 },
  Q: { col: 7, row: 4, spriteRot: 0 },
  R: { col: 5, row: 4, spriteRot: 0, gardenCol: 4, gardenRow: 4 },
  S: { col: 1, row: 0, spriteRot: 0 },
  T: { col: 0, row: 0, spriteRot: 0 },
  U: { col: 8, row: 2, spriteRot: 0, gardenCol: 7, gardenRow: 2 },
  V: { col: 0, row: 3, spriteRot: 0, gardenCol: 7, gardenRow: 3 },
  W: { col: 8, row: 3, spriteRot: 0 },
  X: { col: 12, row: 3, spriteRot: 0 },
  // The River (all 12 official C3 tiles on row 7, cols 2..13)
  RV_SPRING: { col: 2, row: 7, spriteRot: 0 },
  RV_STR: { col: 7, row: 7, spriteRot: 0 },
  RV_STR_BEND: { col: 8, row: 7, spriteRot: 0 },
  RV_CURVE: { col: 4, row: 7, spriteRot: 3, gardenCol: 3, gardenRow: 7 },
  RV_BRIDGE: { col: 12, row: 7, spriteRot: 1 },
  RV_TWO_CITIES: { col: 11, row: 7, spriteRot: 0 },
  RV_CITY_BRIDGE: { col: 10, row: 7, spriteRot: 3 },
  RV_MONASTERY: { col: 5, row: 7, spriteRot: 0 },
  RV_CITY_CORNER: { col: 13, row: 7, spriteRot: 3 },
  RV_CURVE_ROAD: { col: 6, row: 7, spriteRot: 1 },
  RV_LAKE: { col: 9, row: 7, spriteRot: 0 },
};

/** Deterministic pseudo-random generator per tile code so decorations never flicker. */
function makeTileRng(seedStr: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    return h / 0x100000000;
  };
}

/** Per-template custom open-field coordinates for the C3 Flower Garden so it never overlaps roads/cities/rivers. */
const GARDEN_ANCHOR_MAP: Record<string, [number, number]> = {
  E: [0.5, 0.65],
  H: [0.5, 0.5],
  I: [0.3, 0.72],
  N: [0.72, 0.72],
  R: [0.5, 0.84],
  U: [0.22, 0.54],
  V: [0.74, 0.28],
  RV_CURVE: [0.27, 0.73],
};

function getCachedCelTile(card: DeckTileCard): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const key = `${card.templateCode}:${card.hasGarden ? "1" : "0"}`;
  const existing = tileSpriteCache.get(key);
  if (existing) return existing;

  const tpl = ALL_TILE_TEMPLATES[card.templateCode];
  if (!tpl) return null;

  const off = document.createElement("canvas");
  off.width = TILE_CACHE_RES;
  off.height = TILE_CACHE_RES;
  const octx = off.getContext("2d");
  if (!octx) return null;

  renderCelShadedTileSurface(octx, TILE_CACHE_RES, tpl, card);
  tileSpriteCache.set(key, off);
  return off;
}

/**
 * Draws a razor-sharp 2D cel-shaded Carcassonne C3 medieval land tile at (x, y)
 * with pixel size `size` and clockwise rotation `rot` (0..3).
 */
export function drawCarcassonneTile2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  card: DeckTileCard,
  rot: number,
  options?: {
    alpha?: number;
    highlightBorder?: string;
    meeples?: PlacedMeeple[];
  }
): void {
  const tpl = ALL_TILE_TEMPLATES[card.templateCode];
  if (!tpl) return;

  const features = getTileFeatures(card);
  const dx = Math.round(x);
  const dy = Math.round(y);
  const ds = Math.round(size);
  const radius = Math.max(3, ds * 0.055);

  ctx.save();
  if (options?.alpha !== undefined) ctx.globalAlpha = options.alpha;

  // Clip to tile square with soft rounded corners
  drawRoundedRect(ctx, dx, dy, ds, ds, radius);
  ctx.clip();

  const atlas = getCarcassonneTilesImage();
  const spec = CARCASSONNE_ATLAS_MAP[card.templateCode];

  if (atlas && spec) {
    const useGarden =
      card.hasGarden &&
      spec.gardenCol !== undefined &&
      spec.gardenRow !== undefined;
    const col = useGarden ? spec.gardenCol! : spec.col;
    const row = useGarden ? spec.gardenRow! : spec.row;
    const totalRot = (rot + spec.spriteRot) & 3;
    const cellW = atlas.naturalWidth / 16;
    const cellH = atlas.naturalHeight / 10;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.translate(dx + ds / 2, dy + ds / 2);
    ctx.rotate((totalRot * Math.PI) / 2);
    ctx.drawImage(
      atlas,
      col * cellW + 0.25,
      row * cellH + 0.25,
      cellW - 0.5,
      cellH - 0.5,
      -ds / 2,
      -ds / 2,
      ds,
      ds
    );
    ctx.restore();
  } else {
    const cached = getCachedCelTile(card);
    if (cached) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.translate(dx + ds / 2, dy + ds / 2);
      ctx.rotate(((rot & 3) * Math.PI) / 2);
      ctx.drawImage(cached, -ds / 2, -ds / 2, ds, ds);
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(dx + ds / 2, dy + ds / 2);
      ctx.rotate(((rot & 3) * Math.PI) / 2);
      ctx.translate(-ds / 2, -ds / 2);
      renderCelShadedTileSurface(ctx, ds, tpl, card);
      ctx.restore();
    }
  }

  // Subtle top-left bevel highlight for tactile cardboard feel
  ctx.strokeStyle = "rgba(255, 255, 255, 0.24)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(dx + 2, dy + ds - 2);
  ctx.lineTo(dx + 2, dy + 2);
  ctx.lineTo(dx + ds - 2, dy + 2);
  ctx.stroke();

  // Crisp cel-shaded outer tile border
  drawRoundedRect(ctx, dx + 0.5, dy + 0.5, ds - 1, ds - 1, radius);
  ctx.lineWidth = options?.highlightBorder ? 2.8 : 1.3;
  ctx.strokeStyle = options?.highlightBorder ?? "rgba(15, 23, 42, 0.65)";
  ctx.stroke();

  // Draw placed Meeples & Abbots in world-rotated positions (upright, except Farmers lying down!)
  if (options?.meeples && options.meeples.length > 0) {
    for (const m of options.meeples) {
      const feat = features.find((f) => f.id === m.featureId);
      let baseAnchor: [number, number] = feat ? feat.anchor : [0.5, 0.5];
      if (m.featureKind === "garden" && GARDEN_ANCHOR_MAP[card.templateCode]) {
        baseAnchor = GARDEN_ANCHOR_MAP[card.templateCode];
      }
      const [ax, ay] = rotateAnchor(baseAnchor, rot);
      drawCarcassonneMeeple2D(
        ctx,
        dx + ax * ds,
        dy + ay * ds,
        Math.max(13, ds * 0.27),
        m.color,
        m.meepleType,
        m.featureKind === "field"
      );
    }
  }

  ctx.restore();
}

// ============================================================================
// CORE 2D CEL-SHADED C3 TILE SURFACE RENDERER (256x256)
// ============================================================================

function renderCelShadedTileSurface(
  ctx: CanvasRenderingContext2D,
  size: number,
  tpl: TileTemplate,
  card: DeckTileCard
) {
  const rng = makeTileRng(`${card.templateCode}:${card.hasGarden ? "G" : "N"}`);
  const features = getTileFeatures(card);

  // 1. Painterly multi-tone cel-shaded C3 meadow
  drawCelMeadow(ctx, size, rng);

  // 2. River layer (if River expansion tile)
  const riverEdges: number[] = [];
  for (let e = 0; e < 4; e++) {
    if (tpl.edges[e] === "river") riverEdges.push(e);
  }
  const hasRiver = riverEdges.length > 0;
  if (hasRiver) {
    drawCelRiverLayer(ctx, size, riverEdges, tpl.code, tpl.riverRole);
  }

  // 3. Organic meandering cobblestone road layer + arch bridges + crossroads village
  const roadFeatures = features.filter((f) => f.kind === "road");
  if (roadFeatures.length > 0) {
    drawCelRoadsLayer(ctx, size, roadFeatures, hasRiver, tpl.edges, tpl.code);
  }

  // 4. Dense C3 Medieval Cities (3D ashlar stone walls, battlements, turquoise towers, layered houses)
  const cityFeatures = features.filter((f) => f.kind === "city");
  for (const cf of cityFeatures) {
    drawCelCityFeature(ctx, size, cf.edges, Boolean(cf.pennant), tpl.edges, rng);
  }

  // 5. Detailed 30° Isometric C3 Monastery (Abbey)
  const monastery = features.find((f) => f.kind === "monastery");
  if (monastery) {
    drawIsoMonastery(
      ctx,
      monastery.anchor[0] * size,
      monastery.anchor[1] * size,
      size
    );
  }

  // 6. Detailed Isometric C3 Walled Flower Garden
  if (card.hasGarden) {
    const [gx, gy] = GARDEN_ANCHOR_MAP[card.templateCode] ?? [0.72, 0.72];
    drawIsoFlowerGarden(ctx, gx * size, gy * size, size);
  }

  // 7. Ambient cel-shaded C3 farm cottages, haystacks, trees & bushes in safe meadow pockets
  if (cityFeatures.every((c) => c.edges.length < 4)) {
    drawSafeMeadowLandmarks(ctx, size, tpl, card.hasGarden, rng);
  }
}

// ============================================================================
// LUSH CEL-SHADED MEADOW, TREES & RURAL COTTAGES
// ============================================================================

function drawCelMeadow(
  ctx: CanvasRenderingContext2D,
  size: number,
  rng: () => number
) {
  // Rich sunlit European countryside base
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "#94cc44");
  grad.addColorStop(0.5, "#7eb833");
  grad.addColorStop(1, "#69a227");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Layered rolling hill cel-shaded contours
  for (let i = 0; i < 8; i++) {
    const px = (0.08 + rng() * 0.84) * size;
    const py = (0.08 + rng() * 0.84) * size;
    const rx = (0.1 + rng() * 0.14) * size;
    const ry = rx * (0.5 + rng() * 0.35);
    const rot = rng() * Math.PI;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle =
      i % 2 === 0 ? "rgba(187, 232, 98, 0.38)" : "rgba(74, 128, 24, 0.24)";
    ctx.fill();
    ctx.restore();
  }

  // Subtle mowed field stripes & grass blade tufts + wildflowers
  ctx.lineCap = "round";
  for (let i = 0; i < 24; i++) {
    const gx = (0.06 + rng() * 0.88) * size;
    const gy = (0.06 + rng() * 0.88) * size;
    const h = size * (0.017 + rng() * 0.011);
    ctx.strokeStyle = i % 3 === 0 ? "#4d7c1e" : "#5c9122";
    ctx.lineWidth = Math.max(1, size * 0.0065);
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx - h * 0.45, gy - h);
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + h * 0.45, gy - h * 0.85);
    ctx.stroke();

    if (i % 4 === 0) {
      ctx.fillStyle =
        i % 8 === 0 ? "#fef08a" : i % 12 === 0 ? "#fbcfe8" : "#ffffff";
      ctx.beginPath();
      ctx.arc(gx + h * 0.65, gy - h * 0.35, size * 0.0075, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawSafeMeadowLandmarks(
  ctx: CanvasRenderingContext2D,
  size: number,
  tpl: TileTemplate,
  hasGarden: boolean,
  rng: () => number
) {
  const pockets: Array<{ x: number; y: number; e1: number; e2: number }> = [
    { x: 0.23, y: 0.23, e1: 0, e2: 3 }, // NW
    { x: 0.77, y: 0.23, e1: 0, e2: 1 }, // NE
    { x: 0.77, y: 0.77, e1: 1, e2: 2 }, // SE
    { x: 0.23, y: 0.77, e1: 2, e2: 3 }, // SW
  ];
  const gardenAnchor = hasGarden
    ? GARDEN_ANCHOR_MAP[tpl.code] ?? [0.72, 0.72]
    : null;
  const hasMonastery = tpl.features.some((f) => f.kind === "monastery");

  // Specific C3 tiles that feature a charming thatched farm cottage in an open meadow pocket
  const wantsFarmhouse = new Set([
    "U",
    "V",
    "J",
    "K",
    "O",
    "P",
    "D",
    "RV_STR",
    "RV_CURVE",
  ]).has(tpl.code);

  let placedFarm = false;
  let placedTrees = 0;

  for (const p of pockets) {
    if (tpl.edges[p.e1] !== "field" || tpl.edges[p.e2] !== "field") continue;
    if (
      gardenAnchor &&
      Math.hypot(p.x - gardenAnchor[0], p.y - gardenAnchor[1]) < 0.3
    ) {
      continue;
    }
    if (hasMonastery && p.y < 0.52) continue;

    if (wantsFarmhouse && !placedFarm && !hasGarden) {
      drawIsoFarmCottage(ctx, p.x * size, p.y * size, size * 0.13);
      placedFarm = true;
      continue;
    }

    if (placedTrees < 2 && rng() > 0.22) {
      drawCelTreeCluster(ctx, p.x * size, p.y * size, size * 0.056);
      placedTrees++;
    }
  }
}

function drawIsoFarmCottage(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Small fenced dirt yard
  ctx.fillStyle = "rgba(161, 122, 68, 0.55)";
  ctx.beginPath();
  ctx.ellipse(0, s * 0.28, s * 0.78, s * 0.44, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Isometric golden-thatched farm barn
  drawIsoHouse(ctx, -s * 0.06, -s * 0.02, s * 0.96, "thatch", false);

  // Cute golden hay bale beside cottage
  ctx.fillStyle = "#eab308";
  ctx.strokeStyle = "#713f12";
  ctx.lineWidth = Math.max(1, s * 0.055);
  drawRoundedRect(ctx, s * 0.34, s * 0.14, s * 0.28, s * 0.18, 3);
  ctx.fill();
  ctx.stroke();

  // Tiny bush
  drawCelTreeCluster(ctx, -s * 0.52, s * 0.22, s * 0.24);
  ctx.restore();
}

function drawCelTreeCluster(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
) {
  ctx.save();
  ctx.fillStyle = "rgba(28, 56, 10, 0.38)";
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.24, cy + r * 0.54, r * 1.18, r * 0.56, 0, 0, Math.PI * 2);
  ctx.fill();

  const blobs = [
    { dx: -r * 0.46, dy: r * 0.14, rr: r * 0.68 },
    { dx: r * 0.44, dy: r * 0.18, rr: r * 0.62 },
    { dx: 0, dy: -r * 0.22, rr: r * 0.8 },
  ];
  for (const b of blobs) {
    ctx.beginPath();
    ctx.arc(cx + b.dx, cy + b.dy, b.rr, 0, Math.PI * 2);
    ctx.fillStyle = "#2b681d";
    ctx.fill();
    ctx.lineWidth = Math.max(1.2, r * 0.14);
    ctx.strokeStyle = "#16350f";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx + b.dx - b.rr * 0.18, cy + b.dy - b.rr * 0.18, b.rr * 0.65, 0, Math.PI * 2);
    ctx.fillStyle = "#4d9e29";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx + b.dx - b.rr * 0.3, cy + b.dy - b.rr * 0.3, b.rr * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = "#a3e635";
    ctx.fill();
  }
  ctx.restore();
}

// ============================================================================
// RIVER LAYER (C3 CEL-SHADED WATER, ISLETS, RIPPLES, SPRING & LAKE)
// ============================================================================

function drawCelRiverLayer(
  ctx: CanvasRenderingContext2D,
  size: number,
  riverEdges: number[],
  code: string,
  riverRole?: "spring" | "middle" | "lake"
) {
  const bankShadowW = size * 0.295;
  const bankW = size * 0.252;
  const waterDeepW = size * 0.2;
  const waterMidW = size * 0.15;
  const rippleW = size * 0.032;

  const traceRiver = () => {
    ctx.beginPath();
    if (riverEdges.length === 1) {
      const [ex, ey] = EDGE_MID[riverEdges[0]];
      ctx.moveTo(ex * size, ey * size);
      ctx.bezierCurveTo(
        size * 0.44,
        (ey * 0.65 + 0.35 * 0.5) * size,
        size * 0.56,
        (ey * 0.35 + 0.65 * 0.5) * size,
        size * 0.5,
        size * 0.5
      );
    } else if (code === "RV_STR_BEND") {
      // Iconic C3 winding S-curve river from N (0.5, 0) to S (0.5, 1)
      ctx.moveTo(size * 0.5, 0);
      ctx.bezierCurveTo(
        size * 0.12,
        size * 0.28,
        size * 0.88,
        size * 0.72,
        size * 0.5,
        size
      );
    } else if (riverEdges.length >= 2) {
      const [ax, ay] = EDGE_MID[riverEdges[0]];
      const [bx, by] = EDGE_MID[riverEdges[1]];
      ctx.moveTo(ax * size, ay * size);
      if (Math.abs(ax - bx) < 0.01) {
        ctx.bezierCurveTo(
          size * 0.44,
          size * 0.32,
          size * 0.56,
          size * 0.68,
          bx * size,
          by * size
        );
      } else if (Math.abs(ay - by) < 0.01) {
        ctx.bezierCurveTo(
          size * 0.32,
          size * 0.44,
          size * 0.68,
          size * 0.56,
          bx * size,
          by * size
        );
      } else {
        // Curved river corner (e.g., N-E, S-W, N-W)
        const cpx = (ax + bx - 0.5) * 0.28 + 0.5 * 0.72;
        const cpy = (ay + by - 0.5) * 0.28 + 0.5 * 0.72;
        ctx.quadraticCurveTo(cpx * size, cpy * size, bx * size, by * size);
      }
    }
  };

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // 1. Dark mossy grass bank border
  traceRiver();
  ctx.strokeStyle = "#365314";
  ctx.lineWidth = bankShadowW;
  ctx.stroke();

  // 2. Warm sandy stone riverbank
  traceRiver();
  ctx.strokeStyle = "#dfd2b2";
  ctx.lineWidth = bankW;
  ctx.stroke();

  // 3. Deep cerulean riverbed contour
  traceRiver();
  ctx.strokeStyle = "#0369a1";
  ctx.lineWidth = waterDeepW;
  ctx.stroke();

  // 4. Vibrant cel-shaded turquoise river surface
  traceRiver();
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = waterMidW;
  ctx.stroke();

  // 5. Shimmering white-cyan foam streaks
  ctx.save();
  ctx.setLineDash([size * 0.055, size * 0.065]);
  traceRiver();
  ctx.strokeStyle = "rgba(224, 242, 254, 0.9)";
  ctx.lineWidth = rippleW;
  ctx.stroke();
  ctx.restore();

  // Iconic C3 miniature grassy river islet in the middle of straight/curved river tiles
  if (
    code === "RV_STR" ||
    code === "RV_CURVE" ||
    code === "RV_TWO_CITIES" ||
    code === "RV_CURVE_ROAD"
  ) {
    const ix =
      code === "RV_CURVE"
        ? size * 0.66
        : code === "RV_CURVE_ROAD"
          ? size * 0.34
          : size * 0.5;
    const iy =
      code === "RV_CURVE" || code === "RV_CURVE_ROAD" ? size * 0.34 : size * 0.5;
    ctx.save();
    ctx.translate(ix, iy);
    ctx.rotate(code === "RV_TWO_CITIES" ? 0 : 0.6);
    ctx.fillStyle = "#65a30d";
    ctx.strokeStyle = "#365314";
    ctx.lineWidth = size * 0.01;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.042, size * 0.02, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Spring rocky cliff grotto or multi-lobed C3 Lake
  if (riverRole === "spring") {
    const cx = size * 0.5;
    const cy = size * 0.45;
    const r = size * 0.165;

    ctx.beginPath();
    ctx.arc(cx, cy, r + size * 0.032, 0, Math.PI * 2);
    ctx.fillStyle = "#365314";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r + size * 0.016, 0, Math.PI * 2);
    ctx.fillStyle = "#dfd2b2";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#0284c7";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.74, 0, Math.PI * 2);
    ctx.fillStyle = "#38bdf8";
    ctx.fill();

    // Layered cel-shaded mossy cliff boulders above the spring
    const rocks = [
      { dx: -0.75, dy: -0.75, rx: 0.55, ry: 0.38, col: "#78716c" },
      { dx: 0.72, dy: -0.72, rx: 0.52, ry: 0.35, col: "#68625e" },
      { dx: 0, dy: -0.95, rx: 0.78, ry: 0.46, col: "#8a837d" },
    ];
    for (const rk of rocks) {
      ctx.beginPath();
      ctx.ellipse(cx + rk.dx * r, cy + rk.dy * r, rk.rx * r, rk.ry * r, 0, 0, Math.PI * 2);
      ctx.fillStyle = rk.col;
      ctx.fill();
      ctx.lineWidth = size * 0.012;
      ctx.strokeStyle = "#292524";
      ctx.stroke();
      // Moss cap
      ctx.beginPath();
      ctx.ellipse(
        cx + rk.dx * r - rk.rx * r * 0.15,
        cy + rk.dy * r - rk.ry * r * 0.35,
        rk.rx * r * 0.55,
        rk.ry * r * 0.32,
        0,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "#65a30d";
      ctx.fill();
    }

    // Bubbling white spring foam
    ctx.fillStyle = "#e0f2fe";
    ctx.beginPath();
    ctx.arc(cx - r * 0.2, cy - r * 0.15, r * 0.24, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.22, cy + r * 0.05, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (riverRole === "lake") {
    const cx = size * 0.5;
    const cy = size * 0.56;
    const traceLake = (scale: number) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, size * 0.31 * scale, size * 0.27 * scale, 0, 0, Math.PI * 2);
      ctx.moveTo(cx - size * 0.12 * scale, cy + size * 0.12 * scale);
      ctx.arc(cx - size * 0.18 * scale, cy + size * 0.1 * scale, size * 0.15 * scale, 0, Math.PI * 2);
      ctx.moveTo(cx + size * 0.16 * scale, cy - size * 0.06 * scale);
      ctx.arc(cx + size * 0.18 * scale, cy - size * 0.04 * scale, size * 0.14 * scale, 0, Math.PI * 2);
    };

    traceLake(1.13);
    ctx.fillStyle = "#365314";
    ctx.fill();
    traceLake(1.06);
    ctx.fillStyle = "#dfd2b2";
    ctx.fill();
    traceLake(1.0);
    ctx.fillStyle = "#0284c7";
    ctx.fill();
    traceLake(0.84);
    ctx.fillStyle = "#38bdf8";
    ctx.fill();

    // Sparkling water ripples & lush little lake island
    ctx.strokeStyle = "#e0f2fe";
    ctx.lineWidth = size * 0.015;
    ctx.beginPath();
    ctx.arc(cx - size * 0.06, cy - size * 0.04, size * 0.09, 0.3, 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + size * 0.06, cy + size * 0.05, size * 0.07, 3.4, 4.7);
    ctx.stroke();

    // Tiny green islet with bush
    ctx.fillStyle = "#65a30d";
    ctx.strokeStyle = "#365314";
    ctx.lineWidth = size * 0.01;
    ctx.beginPath();
    ctx.ellipse(cx + size * 0.09, cy + size * 0.06, size * 0.055, size * 0.036, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

// ============================================================================
// ORGANIC COBBLESTONE ROADS, BRIDGES & CROSSROADS VILLAGE
// ============================================================================

function drawCelRoadsLayer(
  ctx: CanvasRenderingContext2D,
  size: number,
  roadFeatures: Array<{ edges: number[] }>,
  hasRiver: boolean,
  tileEdges: string[],
  code: string
) {
  const vergeW = size * 0.185;
  const inkW = size * 0.148;
  const curbW = size * 0.122;
  const surfaceW = size * 0.09;
  const isJunction = roadFeatures.length >= 3;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const rf of roadFeatures) {
    const traceRoad = () => {
      ctx.beginPath();
      if (rf.edges.length === 1) {
        const [ex, ey] = EDGE_MID[rf.edges[0]];
        ctx.moveTo(ex * size, ey * size);
        ctx.lineTo(size * 0.5, size * 0.5);
      } else if (rf.edges.length >= 2) {
        const [ax, ay] = EDGE_MID[rf.edges[0]];
        const [bx, by] = EDGE_MID[rf.edges[1]];
        const isOpposite = ((rf.edges[0] + 2) & 3) === rf.edges[1];
        ctx.moveTo(ax * size, ay * size);
        if (isOpposite) {
          // Subtle C3 organic S-meander on straight roads!
          if (Math.abs(ax - bx) < 0.01) {
            ctx.bezierCurveTo(
              size * 0.43,
              size * 0.33,
              size * 0.57,
              size * 0.67,
              bx * size,
              by * size
            );
          } else {
            ctx.bezierCurveTo(
              size * 0.33,
              size * 0.44,
              size * 0.67,
              size * 0.56,
              bx * size,
              by * size
            );
          }
        } else {
          // Graceful quarter-circle sweep toward the shared corner
          const cpx = (ax + bx - 0.5) * 0.42 + 0.5 * 0.58;
          const cpy = (ay + by - 0.5) * 0.42 + 0.5 * 0.58;
          ctx.quadraticCurveTo(cpx * size, cpy * size, bx * size, by * size);
        }
      }
    };

    // 0. Soft earthy grass verge
    traceRoad();
    ctx.strokeStyle = "rgba(63, 98, 18, 0.38)";
    ctx.lineWidth = vergeW;
    ctx.stroke();

    // 1. Crisp cel-shaded dark ink outline
    traceRoad();
    ctx.strokeStyle = "#3f3730";
    ctx.lineWidth = inkW;
    ctx.stroke();

    // 2. Warm stone road kerb
    traceRoad();
    ctx.strokeStyle = "#bfb6a8";
    ctx.lineWidth = curbW;
    ctx.stroke();

    // 3. Sunlit ivory cobblestone road surface
    traceRoad();
    ctx.strokeStyle = "#f7f3e8";
    ctx.lineWidth = surfaceW;
    ctx.stroke();

    // 4. Cobblestone texture dashes
    ctx.save();
    ctx.setLineDash([size * 0.022, size * 0.044]);
    traceRoad();
    ctx.strokeStyle = "rgba(168, 162, 158, 0.55)";
    ctx.lineWidth = size * 0.02;
    ctx.stroke();
    ctx.restore();
  }

  // Detailed cel-shaded stone/wood arch bridge ONLY where a road actually crosses a river
  if (hasRiver) {
    const crossesOpposite = roadFeatures.some(
      (r) => r.edges.length === 2 && ((r.edges[0] + 2) & 3) === r.edges[1]
    );
    const deadEndCrossesRiver =
      roadFeatures.length === 1 && roadFeatures[0].edges.length === 1;
    if (crossesOpposite) {
      const bridgeVertical = tileEdges[0] === "road" && tileEdges[2] === "road";
      drawCelBridge(ctx, size * 0.5, size * 0.5, size * 0.29, size * 0.17, bridgeVertical);
      // Charming bridge-side red-roofed hamlet on RV_BRIDGE (matches C3 (12,7)!)
      if (code === "RV_BRIDGE") {
        drawIsoHouse(ctx, size * 0.78, size * 0.34, size * 0.115, "red", false);
        drawIsoHouse(ctx, size * 0.78, size * 0.66, size * 0.11, "red", true);
      }
    } else if (deadEndCrossesRiver) {
      const roadEdge = roadFeatures[0].edges[0];
      const bridgeVertical = roadEdge === 0 || roadEdge === 2;
      drawCelBridge(ctx, size * 0.5, size * 0.54, size * 0.26, size * 0.16, bridgeVertical);
    }
  }

  // Dense C3 medieval crossroads village at 3-way (L, W) or 4-way (X) road junctions
  if (isJunction) {
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, size * 0.135, 0, Math.PI * 2);
    ctx.fillStyle = "#e8dfd0";
    ctx.fill();
    ctx.lineWidth = size * 0.016;
    ctx.strokeStyle = "#44403c";
    ctx.stroke();

    // Village well in center
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, size * 0.04, 0, Math.PI * 2);
    ctx.fillStyle = "#a8a29e";
    ctx.fill();
    ctx.stroke();

    // 4-house red-roofed hamlet tucked into the junction quadrants
    drawIsoHouse(ctx, size * 0.36, size * 0.37, size * 0.11, "red", false);
    drawIsoHouse(ctx, size * 0.64, size * 0.37, size * 0.105, "red", true);
    drawIsoHouse(ctx, size * 0.36, size * 0.64, size * 0.105, "red", true);
    drawIsoHouse(ctx, size * 0.64, size * 0.64, size * 0.11, "red", false);
  }

  ctx.restore();
}

function drawCelBridge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  vertical: boolean
) {
  ctx.save();
  ctx.translate(cx, cy);
  if (vertical) ctx.rotate(Math.PI / 2);

  // Drop shadow cast onto the water below
  ctx.fillStyle = "rgba(3, 55, 92, 0.45)";
  drawRoundedRect(ctx, -w * 0.5, -h * 0.4 + h * 0.2, w, h, 5);
  ctx.fill();

  // Arched stone/timber bridge deck
  drawRoundedRect(ctx, -w * 0.5, -h * 0.5, w, h, 4);
  ctx.fillStyle = "#d6c8b0";
  ctx.fill();
  ctx.lineWidth = Math.max(1.6, h * 0.085);
  ctx.strokeStyle = "#3e2723";
  ctx.stroke();

  // Plank / stone paving seams
  ctx.strokeStyle = "rgba(69, 26, 3, 0.4)";
  ctx.lineWidth = Math.max(1, h * 0.05);
  for (let i = -2; i <= 2; i++) {
    const px = i * (w * 0.17);
    ctx.beginPath();
    ctx.moveTo(px, -h * 0.42);
    ctx.lineTo(px, h * 0.42);
    ctx.stroke();
  }

  // Raised stone bridge parapets on both sides
  ctx.fillStyle = "#ede0c8";
  ctx.strokeStyle = "#3e2723";
  ctx.lineWidth = Math.max(1.3, h * 0.075);
  drawRoundedRect(ctx, -w * 0.53, -h * 0.58, w * 1.06, h * 0.22, 3);
  ctx.fill();
  ctx.stroke();
  drawRoundedRect(ctx, -w * 0.53, h * 0.36, w * 1.06, h * 0.22, 3);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

// ============================================================================
// DENSE C3 MEDIEVAL CITIES (3D WALLS, MERLONS, TURRETS, LAYERED ISO HOUSES)
// ============================================================================

function drawCelCityFeature(
  ctx: CanvasRenderingContext2D,
  size: number,
  edges: number[],
  pennant: boolean,
  tileEdges: string[],
  rng: () => number
) {
  ctx.save();

  if (edges.length === 4) {
    ctx.beginPath();
    ctx.rect(0, 0, size, size);
    paintDenseCityInterior(
      ctx,
      size,
      [
        [0.16, 0.16],
        [0.44, 0.14],
        [0.74, 0.16],
        [0.86, 0.32],
        [0.24, 0.36],
        [0.54, 0.34],
        [0.16, 0.56],
        [0.46, 0.54],
        [0.78, 0.56],
        [0.24, 0.78],
        [0.54, 0.76],
        [0.82, 0.8],
      ],
      [[0.62, 0.26], [0.38, 0.64]],
      rng
    );
    if (pennant) drawHeraldicShield(ctx, size * 0.2, size * 0.2, size * 0.13);
    ctx.restore();
    return;
  }

  if (edges.length === 3) {
    const missing = [0, 1, 2, 3].find((e) => !edges.includes(e)) ?? 2;
    const hasGateRoad = tileEdges[missing] === "road";
    ctx.translate(size / 2, size / 2);
    ctx.rotate(((missing - 2) * Math.PI) / 2);
    ctx.translate(-size / 2, -size / 2);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size, 0);
    ctx.lineTo(size, size);
    ctx.quadraticCurveTo(size * 0.5, size * 0.56, 0, size);
    ctx.closePath();

    paintDenseCityInterior(
      ctx,
      size,
      [
        [0.18, 0.16],
        [0.46, 0.14],
        [0.76, 0.16],
        [0.22, 0.38],
        [0.52, 0.34],
        [0.8, 0.38],
        [0.16, 0.62],
        [0.48, 0.56],
        [0.84, 0.62],
      ],
      [[0.66, 0.28]],
      rng
    );
    strokeDetailedCastleWall(ctx, size, 0, size, size * 0.5, size * 0.56, size, size);
    if (hasGateRoad) {
      drawCastleGatehouse(ctx, size * 0.5, size * 0.77, size * 0.2);
    } else {
      drawIsoTower(ctx, size * 0.5, size * 0.77, size * 0.058);
    }
    drawIsoTower(ctx, size * 0.18, size * 0.87, size * 0.048);
    drawIsoTower(ctx, size * 0.82, size * 0.87, size * 0.048);
    if (pennant) drawHeraldicShield(ctx, size * 0.22, size * 0.2, size * 0.125);
    ctx.restore();
    return;
  }

  if (edges.length === 2) {
    const [e0, e1] = [...edges].sort((a, b) => a - b);
    if ((e0 === 0 && e1 === 2) || (e0 === 1 && e1 === 3)) {
      // Opposite-edge city bridge (W-E or N-S)
      ctx.translate(size / 2, size / 2);
      if (e0 === 0) ctx.rotate(Math.PI / 2);
      ctx.translate(-size / 2, -size / 2);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(size * 0.5, size * 0.36, size, 0);
      ctx.lineTo(size, size);
      ctx.quadraticCurveTo(size * 0.5, size * 0.64, 0, size);
      ctx.closePath();

      paintDenseCityInterior(
        ctx,
        size,
        [
          [0.14, 0.28],
          [0.16, 0.52],
          [0.14, 0.74],
          [0.38, 0.42],
          [0.52, 0.54],
          [0.68, 0.44],
          [0.86, 0.28],
          [0.84, 0.52],
          [0.86, 0.74],
        ],
        [[0.5, 0.38]],
        rng
      );
      strokeDetailedCastleWall(ctx, size, 0, 0, size * 0.5, size * 0.36, size, 0);
      strokeDetailedCastleWall(ctx, size, 0, size, size * 0.5, size * 0.64, size, size);
      drawIsoTower(ctx, size * 0.5, size * 0.19, size * 0.048);
      drawIsoTower(ctx, size * 0.5, size * 0.81, size * 0.048);
      if (pennant) drawHeraldicShield(ctx, size * 0.2, size * 0.5, size * 0.12);
      ctx.restore();
      return;
    } else {
      // Adjacent corner city (N-E, E-S, S-W, W-N)
      let rot = 0;
      if (e0 === 0 && e1 === 1) rot = 0;
      else if (e0 === 1 && e1 === 2) rot = 1;
      else if (e0 === 2 && e1 === 3) rot = 2;
      else rot = 3;

      ctx.translate(size / 2, size / 2);
      ctx.rotate((rot * Math.PI) / 2);
      ctx.translate(-size / 2, -size / 2);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(size, 0);
      ctx.lineTo(size, size);
      ctx.quadraticCurveTo(size * 0.4, size * 0.6, 0, 0);
      ctx.closePath();

      paintDenseCityInterior(
        ctx,
        size,
        [
          [0.36, 0.14],
          [0.64, 0.14],
          [0.86, 0.18],
          [0.54, 0.32],
          [0.82, 0.38],
          [0.72, 0.56],
          [0.88, 0.72],
        ],
        [[0.66, 0.28]],
        rng
      );
      strokeDetailedCastleWall(ctx, size, 0, 0, size * 0.4, size * 0.6, size, size);
      drawIsoTower(ctx, size * 0.45, size * 0.55, size * 0.054);
      drawIsoTower(ctx, size * 0.2, size * 0.25, size * 0.045);
      drawIsoTower(ctx, size * 0.75, size * 0.8, size * 0.045);
      if (pennant) drawHeraldicShield(ctx, size * 0.78, size * 0.2, size * 0.12);
      ctx.restore();
      return;
    }
  }

  // Single-edge crescent city wall
  const e = edges[0];
  ctx.translate(size / 2, size / 2);
  ctx.rotate((e * Math.PI) / 2);
  ctx.translate(-size / 2, -size / 2);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.quadraticCurveTo(size * 0.5, size * 0.52, 0, 0);
  ctx.closePath();

  paintDenseCityInterior(
    ctx,
    size,
    [
      [0.28, 0.09],
      [0.46, 0.11],
      [0.64, 0.1],
      [0.78, 0.08],
      [0.52, 0.18],
    ],
    [],
    rng
  );
  strokeDetailedCastleWall(ctx, size, 0, 0, size * 0.5, size * 0.52, size, 0);
  drawIsoTower(ctx, size * 0.5, size * 0.26, size * 0.05);
  drawIsoTower(ctx, size * 0.24, size * 0.15, size * 0.042);
  drawIsoTower(ctx, size * 0.76, size * 0.15, size * 0.042);
  if (pennant) drawHeraldicShield(ctx, size * 0.5, size * 0.12, size * 0.105);

  ctx.restore();
}

function paintDenseCityInterior(
  ctx: CanvasRenderingContext2D,
  size: number,
  houseSpots: [number, number][],
  innerTowers: [number, number][],
  rng: () => number
) {
  ctx.save();
  ctx.clip();

  // Warm C3 medieval sandstone & terracotta courtyard
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "#d79e65");
  grad.addColorStop(0.55, "#be8048");
  grad.addColorStop(1, "#9d6131");
  ctx.fillStyle = grad;
  ctx.fill();

  // Subtle cobblestone street texture inside the city
  ctx.strokeStyle = "rgba(69, 26, 3, 0.16)";
  ctx.lineWidth = 1;
  const step = size * 0.065;
  for (let y = 0; y < size; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
  for (let x = 0; x < size; x += step * 1.4) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }

  // Sort houses back-to-front by Y for true 2.5D overlapping depth
  const sorted = [...houseSpots].sort((a, b) => a[1] - b[1]);
  for (let i = 0; i < sorted.length; i++) {
    const [hx, hy] = sorted[i];
    const jx = (rng() - 0.5) * 0.024;
    const jy = (rng() - 0.5) * 0.024;
    drawIsoHouse(
      ctx,
      (hx + jx) * size,
      (hy + jy) * size,
      size * (0.115 + (i % 3) * 0.014),
      i % 5 === 0 ? "orange" : "red",
      i % 2 === 0
    );
  }

  // Tall turquoise-roofed inner keep towers rising above the rooftops
  for (const [tx, ty] of innerTowers) {
    drawIsoTower(ctx, tx * size, ty * size, size * 0.052);
  }

  ctx.restore();
}

function strokeDetailedCastleWall(
  ctx: CanvasRenderingContext2D,
  size: number,
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number
) {
  ctx.save();
  ctx.lineCap = "round";

  // 1. Cast shadow onto the grass outside the wall
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.strokeStyle = "rgba(26, 46, 5, 0.42)";
  ctx.lineWidth = size * 0.1;
  ctx.stroke();

  // 2. Dark cel-shaded ink border
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.strokeStyle = "#3b2316";
  ctx.lineWidth = size * 0.076;
  ctx.stroke();

  // 3. Shaded lower limestone curtain wall face
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.strokeStyle = "#c2b092";
  ctx.lineWidth = size * 0.056;
  ctx.stroke();

  // 4. Sunlit top parapet walkway
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.strokeStyle = "#f2e6cf";
  ctx.lineWidth = size * 0.032;
  ctx.stroke();

  // 5. Individual stepped stone crenellations (merlons) along the curve
  const samples = 14;
  for (let i = 1; i < samples; i++) {
    const t = i / samples;
    const mt = 1 - t;
    const px = mt * mt * x0 + 2 * mt * t * cx + t * t * x1;
    const py = mt * mt * y0 + 2 * mt * t * cy + t * t * y1;
    const tx = 2 * mt * (cx - x0) + 2 * t * (x1 - cx);
    const ty = 2 * mt * (cy - y0) + 2 * t * (y1 - cy);
    const ang = Math.atan2(ty, tx);

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ang);
    ctx.fillStyle = i % 2 === 0 ? "#f7eedc" : "#d8c7ab";
    ctx.strokeStyle = "#3b2316";
    ctx.lineWidth = Math.max(1, size * 0.006);
    ctx.fillRect(-size * 0.016, -size * 0.022, size * 0.032, size * 0.044);
    ctx.strokeRect(-size * 0.016, -size * 0.022, size * 0.032, size * 0.044);
    ctx.restore();
  }

  ctx.restore();
}

function drawIsoTower(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Soft ground shadow
  ctx.fillStyle = "rgba(28, 16, 6, 0.38)";
  ctx.beginPath();
  ctx.ellipse(r * 0.25, r * 0.45, r * 1.05, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cylindrical stone tower body
  ctx.fillStyle = "#e7dbc5";
  ctx.strokeStyle = "#3b2316";
  ctx.lineWidth = Math.max(1.3, r * 0.14);
  ctx.beginPath();
  ctx.roundRect(-r * 0.78, -r * 0.55, r * 1.56, r * 1.05, r * 0.35);
  ctx.fill();
  ctx.stroke();

  // Shaded right half of cylinder
  ctx.fillStyle = "#bda989";
  ctx.beginPath();
  ctx.roundRect(0, -r * 0.55, r * 0.78, r * 1.05, [0, r * 0.35, r * 0.35, 0]);
  ctx.fill();
  ctx.stroke();

  // Tiny dark arrow-slit window
  ctx.fillStyle = "#292524";
  ctx.fillRect(-r * 0.14, -r * 0.18, r * 0.28, r * 0.34);

  // Iconic Carcassonne C3 conical turquoise spire roof
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.55);
  ctx.lineTo(r * 0.92, -r * 0.42);
  ctx.quadraticCurveTo(0, -r * 0.14, -r * 0.92, -r * 0.42);
  ctx.closePath();
  ctx.fillStyle = "#0284c7";
  ctx.fill();
  ctx.stroke();

  // Sunlit left cel facet on spire
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.55);
  ctx.lineTo(-r * 0.06, -r * 0.28);
  ctx.quadraticCurveTo(-r * 0.52, -r * 0.3, -r * 0.92, -r * 0.42);
  ctx.closePath();
  ctx.fillStyle = "#38bdf8";
  ctx.fill();

  // Crisp spire outline & golden finial dot
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.55);
  ctx.lineTo(r * 0.92, -r * 0.42);
  ctx.quadraticCurveTo(0, -r * 0.14, -r * 0.92, -r * 0.42);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = "#fde047";
  ctx.beginPath();
  ctx.arc(0, -r * 1.58, r * 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCastleGatehouse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number
) {
  const h = w * 0.62;
  ctx.save();
  drawRoundedRect(ctx, cx - w / 2, cy - h / 2, w, h, 4);
  ctx.fillStyle = "#e7dbc5";
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, w * 0.065);
  ctx.strokeStyle = "#3b2316";
  ctx.stroke();

  // Dark arched castle portcullis gate
  ctx.beginPath();
  ctx.arc(cx, cy + h * 0.14, w * 0.18, Math.PI, 0);
  ctx.lineTo(cx + w * 0.18, cy + h * 0.5);
  ctx.lineTo(cx - w * 0.18, cy + h * 0.5);
  ctx.closePath();
  ctx.fillStyle = "#292524";
  ctx.fill();

  // Twin turquoise turrets flanking the gatehouse
  drawIsoTower(ctx, cx - w * 0.44, cy - h * 0.05, w * 0.22);
  drawIsoTower(ctx, cx + w * 0.44, cy - h * 0.05, w * 0.22);
  ctx.restore();
}

/**
 * Draws a true 2.5D isometric medieval townhouse or thatched cottage
 * with sunlit/shaded walls, half-timbering, windows, pitched 2-tone roof & chimney.
 */
function drawIsoHouse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  roofStyle: "red" | "orange" | "thatch",
  flip = false
) {
  ctx.save();
  ctx.translate(cx, cy);
  if (flip) ctx.scale(-1, 1);

  const lw = s * 0.48;
  const rw = s * 0.42;
  const wallH = s * 0.36;
  const roofH = s * 0.42;
  const ink = Math.max(1.1, s * 0.062);

  const roofLit =
    roofStyle === "thatch"
      ? "#eab308"
      : roofStyle === "orange"
        ? "#ea580c"
        : "#dc2626";
  const roofDark =
    roofStyle === "thatch"
      ? "#a16207"
      : roofStyle === "orange"
        ? "#9a3412"
        : "#991b1b";

  // 1. Isometric ground shadow
  ctx.fillStyle = "rgba(38, 18, 4, 0.36)";
  ctx.beginPath();
  ctx.moveTo(-lw, wallH * 0.55);
  ctx.lineTo(0, wallH * 0.92);
  ctx.lineTo(rw * 1.18, wallH * 0.55);
  ctx.lineTo(rw * 0.35, wallH * 0.18);
  ctx.closePath();
  ctx.fill();

  ctx.lineWidth = ink;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#3b2316";

  // 2. Left sunlit cream stucco wall
  ctx.beginPath();
  ctx.moveTo(-lw, 0);
  ctx.lineTo(0, wallH * 0.32);
  ctx.lineTo(0, wallH * 0.85);
  ctx.lineTo(-lw, wallH * 0.52);
  ctx.closePath();
  ctx.fillStyle = "#f7eedc";
  ctx.fill();
  ctx.stroke();

  // 3. Right shaded timber-framed wall
  ctx.beginPath();
  ctx.moveTo(0, wallH * 0.32);
  ctx.lineTo(rw, 0);
  ctx.lineTo(rw, wallH * 0.52);
  ctx.lineTo(0, wallH * 0.85);
  ctx.closePath();
  ctx.fillStyle = "#d6c5ab";
  ctx.fill();
  ctx.stroke();

  // Tiny dark windows on both walls
  ctx.fillStyle = "#3b2316";
  ctx.fillRect(-lw * 0.65, wallH * 0.2, lw * 0.24, wallH * 0.25);
  ctx.fillRect(rw * 0.35, wallH * 0.24, rw * 0.24, wallH * 0.26);

  // 4. Steep pitched isometric roof (back-right shaded gable + front-left sunlit slope)
  ctx.beginPath();
  ctx.moveTo(0, wallH * 0.32);
  ctx.lineTo(rw * 1.08, -wallH * 0.04);
  ctx.lineTo(rw * 0.42, -roofH);
  ctx.lineTo(-lw * 0.55, -roofH * 0.72);
  ctx.closePath();
  ctx.fillStyle = roofDark;
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-lw * 1.08, -wallH * 0.04);
  ctx.lineTo(0, wallH * 0.34);
  ctx.lineTo(rw * 0.36, -roofH * 0.92);
  ctx.lineTo(-lw * 0.55, -roofH * 0.72);
  ctx.closePath();
  ctx.fillStyle = roofLit;
  ctx.fill();
  ctx.stroke();

  // Tiny stone chimney on roof ridge
  if (roofStyle !== "thatch") {
    ctx.fillStyle = "#a8a29e";
    ctx.fillRect(rw * 0.04, -roofH * 1.08, s * 0.11, s * 0.18);
    ctx.strokeRect(rw * 0.04, -roofH * 1.08, s * 0.11, s * 0.18);
  }

  ctx.restore();
}

function drawHeraldicShield(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  sr: number
) {
  ctx.save();
  ctx.translate(cx, cy);

  const traceShield = () => {
    ctx.beginPath();
    ctx.moveTo(-sr * 0.78, -sr * 0.82);
    ctx.lineTo(sr * 0.78, -sr * 0.82);
    ctx.lineTo(sr * 0.78, sr * 0.08);
    ctx.quadraticCurveTo(0, sr * 1.04, -sr * 0.78, sr * 0.08);
    ctx.closePath();
  };

  ctx.shadowColor = "rgba(15, 23, 42, 0.55)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;
  traceShield();
  ctx.fillStyle = "#1d4ed8";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.save();
  traceShield();
  ctx.clip();
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(-sr, -sr, sr, sr);
  ctx.fillRect(0, 0, sr, sr);
  ctx.fillStyle = "#0284c7";
  ctx.fillRect(0, -sr, sr, sr);
  ctx.fillRect(-sr, 0, sr, sr);
  // Diagonal glossy cel shine
  ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
  ctx.beginPath();
  ctx.moveTo(-sr, -sr * 0.3);
  ctx.lineTo(sr * 0.3, -sr);
  ctx.lineTo(sr, -sr);
  ctx.lineTo(-sr, sr * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  traceShield();
  ctx.lineWidth = Math.max(1.8, sr * 0.16);
  ctx.strokeStyle = "#f8fafc";
  ctx.stroke();
  ctx.lineWidth = Math.max(1, sr * 0.08);
  ctx.strokeStyle = "#0f172a";
  ctx.stroke();

  ctx.restore();
}

// ============================================================================
// DETAILED 30° ISOMETRIC C3 MONASTERY & WALLED FLOWER GARDEN
// ============================================================================

function drawIsoMonastery(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) {
  const s = size * 0.24;
  ctx.save();
  ctx.translate(cx, cy);

  // 1. Stone abbey courtyard terrace + soft drop shadow
  ctx.fillStyle = "rgba(26, 46, 5, 0.35)";
  ctx.beginPath();
  ctx.ellipse(s * 0.08, s * 0.38, s * 1.28, s * 0.72, -0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#dfd5c3";
  ctx.strokeStyle = "#44403c";
  ctx.lineWidth = Math.max(1.5, size * 0.01);
  ctx.beginPath();
  ctx.ellipse(0, s * 0.26, s * 1.18, s * 0.62, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const ink = Math.max(1.5, size * 0.011);
  ctx.lineWidth = ink;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#3b2316";

  // 2. Isometric main church nave (left sunlit face + right shaded face)
  ctx.beginPath();
  ctx.moveTo(-s * 0.92, -s * 0.08);
  ctx.lineTo(s * 0.08, s * 0.34);
  ctx.lineTo(s * 0.08, s * 0.78);
  ctx.lineTo(-s * 0.92, s * 0.36);
  ctx.closePath();
  ctx.fillStyle = "#f7efe0";
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(s * 0.08, s * 0.34);
  ctx.lineTo(s * 0.9, -s * 0.04);
  ctx.lineTo(s * 0.9, s * 0.4);
  ctx.lineTo(s * 0.08, s * 0.78);
  ctx.closePath();
  ctx.fillStyle = "#d5c4aa";
  ctx.fill();
  ctx.stroke();

  // Arched gothic windows along both abbey walls
  ctx.fillStyle = "#3b2316";
  for (const wx of [-0.7, -0.42, -0.14]) {
    ctx.beginPath();
    ctx.arc(wx * s, (0.34 + (wx + 0.7) * 0.42) * s, s * 0.065, Math.PI, 0);
    ctx.lineTo((wx + 0.065) * s, (0.5 + (wx + 0.7) * 0.42) * s);
    ctx.lineTo((wx - 0.065) * s, (0.5 + (wx + 0.7) * 0.42) * s);
    ctx.closePath();
    ctx.fill();
  }
  for (const wx of [0.32, 0.6]) {
    ctx.beginPath();
    ctx.arc(wx * s, (0.48 - (wx - 0.32) * 0.42) * s, s * 0.065, Math.PI, 0);
    ctx.lineTo((wx + 0.065) * s, (0.64 - (wx - 0.32) * 0.42) * s);
    ctx.lineTo((wx - 0.065) * s, (0.64 - (wx - 0.32) * 0.42) * s);
    ctx.closePath();
    ctx.fill();
  }

  // 3. Steep crimson-red isometric nave roof
  ctx.beginPath();
  ctx.moveTo(-s * 1.0, -s * 0.12);
  ctx.lineTo(s * 0.08, s * 0.34);
  ctx.lineTo(s * 0.38, -s * 0.24);
  ctx.lineTo(-s * 0.56, -s * 0.62);
  ctx.closePath();
  ctx.fillStyle = "#dc2626";
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(s * 0.08, s * 0.34);
  ctx.lineTo(s * 0.98, -s * 0.08);
  ctx.lineTo(s * 0.38, -s * 0.24);
  ctx.closePath();
  ctx.fillStyle = "#991b1b";
  ctx.fill();
  ctx.stroke();

  // 4. Tall square bell tower rising on left-back wing
  ctx.fillStyle = "#f7efe0";
  ctx.fillRect(-s * 0.56, -s * 1.04, s * 0.34, s * 0.68);
  ctx.strokeRect(-s * 0.56, -s * 1.04, s * 0.34, s * 0.68);
  ctx.fillStyle = "#d5c4aa";
  ctx.fillRect(-s * 0.22, -s * 1.04, s * 0.28, s * 0.68);
  ctx.strokeRect(-s * 0.22, -s * 1.04, s * 0.28, s * 0.68);
  // Belfry arch window
  ctx.fillStyle = "#3b2316";
  ctx.fillRect(-s * 0.44, -s * 0.88, s * 0.12, s * 0.22);

  // 5. Pointed red pyramidal bell-tower spire (2-tone cel shaded)
  ctx.beginPath();
  ctx.moveTo(-s * 0.24, -s * 1.66);
  ctx.lineTo(-s * 0.64, -s * 1.02);
  ctx.lineTo(-s * 0.22, -s * 0.96);
  ctx.closePath();
  ctx.fillStyle = "#ef4444";
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-s * 0.24, -s * 1.66);
  ctx.lineTo(s * 0.14, -s * 1.02);
  ctx.lineTo(-s * 0.22, -s * 0.96);
  ctx.closePath();
  ctx.fillStyle = "#991b1b";
  ctx.fill();
  ctx.stroke();

  // Golden cross atop spire
  ctx.strokeStyle = "#fde047";
  ctx.lineWidth = Math.max(1.8, size * 0.013);
  ctx.beginPath();
  ctx.moveTo(-s * 0.24, -s * 1.9);
  ctx.lineTo(-s * 0.24, -s * 1.64);
  ctx.moveTo(-s * 0.36, -s * 1.8);
  ctx.lineTo(-s * 0.12, -s * 1.8);
  ctx.stroke();

  ctx.restore();
}

function drawIsoFlowerGarden(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) {
  const w = size * 0.34;
  const h = size * 0.25;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.18);

  // Drop shadow
  ctx.fillStyle = "rgba(26, 46, 5, 0.38)";
  drawRoundedRect(ctx, -w / 2 + 3, -h / 2 + 4, w, h, 5);
  ctx.fill();

  // Low 3D cream stone garden wall
  drawRoundedRect(ctx, -w / 2, -h / 2, w, h, 5);
  ctx.fillStyle = "#e7dbc5";
  ctx.fill();
  ctx.lineWidth = Math.max(1.6, size * 0.011);
  ctx.strokeStyle = "#4d3319";
  ctx.stroke();

  // Lush hedged soil interior
  drawRoundedRect(ctx, -w * 0.42, -h * 0.38, w * 0.84, h * 0.76, 3);
  ctx.fillStyle = "#4d7c0f";
  ctx.fill();

  // Central stone garden walkway cross
  ctx.fillStyle = "#d6c8b0";
  ctx.fillRect(-w * 0.4, -h * 0.06, w * 0.8, h * 0.12);
  ctx.fillRect(-w * 0.06, -h * 0.36, w * 0.12, h * 0.72);

  // 4 vibrant flowerbeds (lavender, rose, marigold, sky iris)
  const beds = [
    { x: -0.24, y: -0.2, c1: "#a855f7", c2: "#e9d5ff" },
    { x: 0.24, y: -0.2, c1: "#ec4899", c2: "#fbcfe8" },
    { x: -0.24, y: 0.2, c1: "#f59e0b", c2: "#fef08a" },
    { x: 0.24, y: 0.2, c1: "#0ea5e9", c2: "#bae6fd" },
  ];
  for (const b of beds) {
    for (let dx = -1; dx <= 1; dx++) {
      const fx = b.x * w + dx * w * 0.085;
      const fy = b.y * h + (dx % 2) * h * 0.04;
      ctx.fillStyle = b.c1;
      ctx.beginPath();
      ctx.arc(fx, fy, size * 0.022, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = b.c2;
      ctx.beginPath();
      ctx.arc(fx - size * 0.005, fy - size * 0.005, size * 0.01, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// ============================================================================
// 2.5D CHUNKY WOODEN CEL-SHADED MEEPLE & ABBOT PIECES
// ============================================================================

const MEEPLE_CEL_PALETTE: Record<
  CarcassonneColor,
  { front: string; side: string; highlight: string; ink: string; rim: string }
> = {
  blue: {
    front: "#0ea5e9",
    side: "#0369a1",
    highlight: "#bae6fd",
    ink: "#082f49",
    rim: "#e0f2fe",
  },
  green: {
    front: "#22a83c",
    side: "#146b26",
    highlight: "#86efac",
    ink: "#052e16",
    rim: "#dcfce7",
  },
  black: {
    front: "#363b42",
    side: "#15181c",
    highlight: "#94a3b8",
    ink: "#020617",
    rim: "#cbd5e1",
  },
  red: {
    front: "#d12b2b",
    side: "#851616",
    highlight: "#fca5a5",
    ink: "#450a0a",
    rim: "#fee2e2",
  },
  yellow: {
    front: "#facc15",
    side: "#b5850b",
    highlight: "#fef9c3",
    ink: "#422006",
    rim: "#fefce8",
  },
};

function traceChunkyMeeplePath(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.96);
  ctx.bezierCurveTo(s * 0.3, -s * 0.96, s * 0.42, -s * 0.72, s * 0.33, -s * 0.46);
  ctx.bezierCurveTo(s * 0.54, -s * 0.36, s * 0.94, -s * 0.16, s * 0.92, s * 0.04);
  ctx.bezierCurveTo(s * 0.9, s * 0.22, s * 0.66, s * 0.24, s * 0.46, s * 0.2);
  ctx.bezierCurveTo(s * 0.56, s * 0.46, s * 0.74, s * 0.76, s * 0.72, s * 0.88);
  ctx.quadraticCurveTo(s * 0.7, s * 0.96, s * 0.58, s * 0.96);
  ctx.lineTo(s * 0.24, s * 0.96);
  ctx.quadraticCurveTo(s * 0.14, s * 0.96, s * 0.1, s * 0.84);
  ctx.quadraticCurveTo(0, s * 0.56, -s * 0.1, s * 0.84);
  ctx.quadraticCurveTo(-s * 0.14, s * 0.96, -s * 0.24, s * 0.96);
  ctx.lineTo(-s * 0.58, s * 0.96);
  ctx.quadraticCurveTo(-s * 0.7, s * 0.96, -s * 0.72, s * 0.88);
  ctx.bezierCurveTo(-s * 0.74, s * 0.76, -s * 0.56, s * 0.46, -s * 0.46, s * 0.2);
  ctx.bezierCurveTo(-s * 0.66, s * 0.24, -s * 0.9, s * 0.22, -s * 0.92, s * 0.04);
  ctx.bezierCurveTo(-s * 0.94, -s * 0.16, -s * 0.54, -s * 0.36, -s * 0.33, -s * 0.46);
  ctx.bezierCurveTo(-s * 0.42, -s * 0.72, -s * 0.3, -s * 0.96, 0, -s * 0.96);
  ctx.closePath();
}

function traceChunkyAbbotPath(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.moveTo(0, -s * 1.18);
  ctx.quadraticCurveTo(s * 0.36, -s * 0.82, s * 0.42, -s * 0.5);
  ctx.quadraticCurveTo(s * 0.38, -s * 0.36, s * 0.28, -s * 0.3);
  ctx.quadraticCurveTo(s * 0.62, -s * 0.16, s * 0.58, s * 0.06);
  ctx.quadraticCurveTo(s * 0.54, s * 0.18, s * 0.42, s * 0.22);
  ctx.lineTo(s * 0.68, s * 0.88);
  ctx.quadraticCurveTo(s * 0.7, s * 0.98, s * 0.56, s * 0.98);
  ctx.lineTo(-s * 0.56, s * 0.98);
  ctx.quadraticCurveTo(-s * 0.7, s * 0.98, -s * 0.68, s * 0.88);
  ctx.lineTo(-s * 0.42, s * 0.22);
  ctx.quadraticCurveTo(-s * 0.54, s * 0.18, -s * 0.58, s * 0.06);
  ctx.quadraticCurveTo(-s * 0.62, -s * 0.16, -s * 0.28, -s * 0.3);
  ctx.quadraticCurveTo(-s * 0.38, -s * 0.36, -s * 0.42, -s * 0.5);
  ctx.quadraticCurveTo(-s * 0.36, -s * 0.82, 0, -s * 1.18);
  ctx.closePath();
}

const MEEPLE_SPRITE_COL: Record<CarcassonneColor, number> = {
  blue: 0,
  green: 1,
  black: 2,
  red: 3,
  yellow: 4,
};

/**
 * Draws an iconic Carcassonne Meeple (or Abbot) using the official sprite sheet
 * (/sprites/carcassonne-meeples.png) with exact official tabletop posture:
 * - Knight / Highwayman / Monk: standing upright (row 0)
 * - Farmer in Field: lying flat on the grass (row 1, rotated horizontally)
 * - Abbot in Monastery / Garden: standing upright mitre piece (row 2)
 */
export function drawCarcassonneMeeple2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: CarcassonneColor,
  meepleType: MeepleType,
  lyingDown = false
): void {
  const sheet = getCarcassonneMeeplesImage();
  if (sheet) {
    const col = MEEPLE_SPRITE_COL[color] ?? 0;
    const row = meepleType === "abbot" ? 2 : lyingDown ? 1 : 0;
    const cellW = sheet.naturalWidth / 5;
    const cellH = sheet.naturalHeight / 3;
    const drawSize = Math.max(16, size * 1.18);

    ctx.save();
    ctx.translate(Math.round(cx), Math.round(cy));
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    if (lyingDown && meepleType !== "abbot") {
      // Official Farmer posture: lying flat horizontally on the meadow!
      ctx.rotate(Math.PI / 2);
      ctx.scale(1, 0.88);
      ctx.shadowColor = "rgba(2, 6, 23, 0.65)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1.5;
      ctx.shadowOffsetY = 1.5;
    } else {
      // Official standing posture (Knight, Highwayman, Monk, Abbot) with grounded base shadow
      ctx.shadowColor = "rgba(2, 6, 23, 0.72)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;
    }

    ctx.drawImage(
      sheet,
      col * cellW,
      row * cellH,
      cellW,
      cellH,
      -drawSize / 2,
      -drawSize / 2,
      drawSize,
      drawSize
    );
    ctx.restore();
    return;
  }

  // Fallback vector render while /sprites/carcassonne-meeples.png loads
  const pal = MEEPLE_CEL_PALETTE[color];
  const s = size * 0.52;
  const depthX = Math.max(1.8, size * 0.09);
  const depthY = Math.max(2.2, size * 0.12);
  const inkW = Math.max(1.3, size * 0.072);

  const trace =
    meepleType === "abbot"
      ? () => traceChunkyAbbotPath(ctx, s)
      : () => traceChunkyMeeplePath(ctx, s);

  ctx.save();
  ctx.translate(cx, cy);
  if (lyingDown) ctx.rotate(Math.PI / 2);

  // 1. Ground contact shadow beneath the wooden piece
  ctx.save();
  ctx.fillStyle = "rgba(2, 6, 23, 0.42)";
  ctx.beginPath();
  ctx.ellipse(
    depthX * 0.6,
    s * 0.96 + depthY * 0.6,
    s * 0.82,
    s * 0.26,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();

  // 2. Crisp white outer sticker halo
  ctx.save();
  ctx.translate(depthX * 0.5, depthY * 0.5);
  trace();
  ctx.lineWidth = inkW * 2.1;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();

  // 3. Chunky 2.5D extruded wooden side/bottom thickness layer
  const steps = 3;
  for (let i = steps; i >= 1; i--) {
    const f = i / steps;
    ctx.save();
    ctx.translate(depthX * f, depthY * f);
    trace();
    ctx.fillStyle = pal.side;
    ctx.fill();
    if (i === steps) {
      ctx.lineWidth = inkW;
      ctx.strokeStyle = pal.ink;
      ctx.lineJoin = "round";
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4. Main sunlit front wooden face
  ctx.save();
  trace();
  const faceGrad = ctx.createLinearGradient(0, -s, 0, s);
  faceGrad.addColorStop(0, pal.front);
  faceGrad.addColorStop(0.72, pal.front);
  faceGrad.addColorStop(1, pal.side);
  ctx.fillStyle = faceGrad;
  ctx.fill();
  ctx.lineWidth = inkW;
  ctx.strokeStyle = pal.ink;
  ctx.lineJoin = "round";
  ctx.stroke();

  // 5. Crisp 2D cel-shaded specular bevel highlight on upper-left wooden edge
  ctx.clip();
  ctx.strokeStyle = pal.highlight;
  ctx.globalAlpha = 0.65;
  ctx.lineWidth = Math.max(1.5, size * 0.085);
  ctx.lineCap = "round";
  if (meepleType === "abbot") {
    ctx.beginPath();
    ctx.moveTo(-s * 0.04, -s * 1.0);
    ctx.quadraticCurveTo(-s * 0.28, -s * 0.7, -s * 0.3, -s * 0.48);
    ctx.moveTo(-s * 0.44, -s * 0.06);
    ctx.lineTo(-s * 0.56, s * 0.76);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(-s * 0.08, -s * 0.68, s * 0.16, Math.PI * 0.95, Math.PI * 1.65);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.76, -s * 0.04);
    ctx.quadraticCurveTo(-s * 0.48, -s * 0.24, -s * 0.28, -s * 0.34);
    ctx.stroke();
  }
  ctx.restore();

  // 6. Golden cross emblem on Abbot robe
  if (meepleType === "abbot") {
    ctx.save();
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = Math.max(2.2, size * 0.11);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.18);
    ctx.lineTo(0, s * 0.58);
    ctx.moveTo(-s * 0.24, s * 0.1);
    ctx.lineTo(s * 0.24, s * 0.1);
    ctx.stroke();

    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = Math.max(1.3, size * 0.068);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}
