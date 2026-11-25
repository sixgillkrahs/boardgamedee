import { drawRoundedRect, getCanvasFontFamilies, lerp } from "@/canvas/engine";
import {
  HEAT_CAR_COLORS,
  HEAT_TRACKS,
  type HeatCarColorId,
  type HeatCard,
  type HeatTrackId,
} from "@/cartridges/heat";

export interface TrackWaypoint {
  /** Space index along the track loop (can reach totalSpaces at loop closure) */
  s: number;
  /** Normalized horizontal coordinate (0..1) on the board image */
  u: number;
  /** Normalized vertical coordinate (0..1) on the board image */
  v: number;
}

/**
 * High-precision waypoints traced directly along the asphalt centerline of the 3 official board images.
 * Every corner's `afterSpaceIndex + 0.5` is anchored to its printed white corner line on the board!
 */
export const HEAT_TRACK_WAYPOINTS: Record<HeatTrackId, TrackWaypoint[]> = {
  usa: [
    { s: 0, u: 0.765, v: 0.195 },
    { s: 3, u: 0.848, v: 0.228 },
    { s: 6, u: 0.902, v: 0.345 },
    { s: 8, u: 0.928, v: 0.54 },
    { s: 10.5, u: 0.935, v: 0.835 }, // Corner 1 (Limit 7)
    { s: 12, u: 0.892, v: 0.912 },
    { s: 16, u: 0.76, v: 0.916 },
    { s: 21, u: 0.56, v: 0.916 },
    { s: 26, u: 0.35, v: 0.918 },
    { s: 30, u: 0.165, v: 0.92 },
    { s: 31.5, u: 0.095, v: 0.892 }, // Corner 2 (Limit 3)
    { s: 33, u: 0.076, v: 0.8 },
    { s: 35, u: 0.115, v: 0.722 },
    { s: 37, u: 0.215, v: 0.655 },
    { s: 40, u: 0.278, v: 0.49 },
    { s: 43, u: 0.34, v: 0.295 },
    { s: 45, u: 0.398, v: 0.135 },
    { s: 46.5, u: 0.466, v: 0.094 }, // Corner 3 (Limit 3)
    { s: 48, u: 0.512, v: 0.145 },
    { s: 50, u: 0.486, v: 0.265 },
    { s: 52, u: 0.425, v: 0.42 },
    { s: 54.5, u: 0.368, v: 0.585 }, // Corner 4 (Limit 2)
    { s: 56, u: 0.415, v: 0.612 },
    { s: 58, u: 0.478, v: 0.505 },
    { s: 61, u: 0.558, v: 0.345 },
    { s: 64, u: 0.635, v: 0.218 },
    { s: 66.5, u: 0.705, v: 0.19 },
    { s: 69, u: 0.765, v: 0.195 },
  ],
  "south-africa": [
    { s: 0, u: 0.525, v: 0.905 },
    { s: 3, u: 0.34, v: 0.912 },
    { s: 5, u: 0.17, v: 0.914 },
    { s: 6.5, u: 0.074, v: 0.83 }, // Corner 1 (Limit 4)
    { s: 8.5, u: 0.056, v: 0.69 },
    { s: 11, u: 0.068, v: 0.52 },
    { s: 13.5, u: 0.198, v: 0.432 }, // Corner 2 (Limit 3)
    { s: 16, u: 0.278, v: 0.54 },
    { s: 19, u: 0.358, v: 0.7 },
    { s: 21.5, u: 0.436, v: 0.682 }, // Corner 3 (Limit 2)
    { s: 24, u: 0.398, v: 0.555 },
    { s: 27, u: 0.295, v: 0.39 },
    { s: 30, u: 0.272, v: 0.2 },
    { s: 32.5, u: 0.385, v: 0.09 }, // Corner 4 (Limit 6)
    { s: 35, u: 0.505, v: 0.128 },
    { s: 38, u: 0.566, v: 0.29 },
    { s: 41, u: 0.542, v: 0.5 },
    { s: 43.5, u: 0.542, v: 0.69 },
    { s: 45.5, u: 0.608, v: 0.772 }, // Corner 5 (Limit 5)
    { s: 48, u: 0.682, v: 0.66 },
    { s: 51, u: 0.705, v: 0.45 },
    { s: 53.5, u: 0.768, v: 0.29 },
    { s: 55.5, u: 0.868, v: 0.278 }, // Corner 6 (Limit 2)
    { s: 58, u: 0.892, v: 0.41 },
    { s: 61, u: 0.892, v: 0.59 },
    { s: 64.5, u: 0.94, v: 0.825 }, // Corner 7 (Limit 4)
    { s: 66.5, u: 0.865, v: 0.915 },
    { s: 69, u: 0.68, v: 0.908 },
    { s: 71, u: 0.525, v: 0.905 },
  ],
  deutschland: [
    { s: 0, u: 0.455, v: 0.468 },
    { s: 3, u: 0.31, v: 0.465 },
    { s: 6, u: 0.175, v: 0.41 },
    { s: 8, u: 0.098, v: 0.3 },
    { s: 9.5, u: 0.082, v: 0.195 }, // Corner 1 (Limit 5)
    { s: 12, u: 0.145, v: 0.082 },
    { s: 15, u: 0.28, v: 0.072 },
    { s: 18, u: 0.43, v: 0.112 },
    { s: 21.5, u: 0.578, v: 0.158 }, // Corner 2 (Chicane Entry Limit 2)
    { s: 23.5, u: 0.615, v: 0.152 }, // Corner 3 (Chicane Exit Limit 2)
    { s: 27, u: 0.705, v: 0.255 },
    { s: 31, u: 0.805, v: 0.395 },
    { s: 35, u: 0.885, v: 0.56 },
    { s: 37.5, u: 0.91, v: 0.72 },
    { s: 39.5, u: 0.882, v: 0.842 }, // Corner 4 (Limit 6)
    { s: 42, u: 0.78, v: 0.91 },
    { s: 44.5, u: 0.63, v: 0.912 },
    { s: 46.5, u: 0.542, v: 0.848 }, // Corner 5 (Limit 4)
    { s: 48.5, u: 0.555, v: 0.735 },
    { s: 51, u: 0.685, v: 0.742 },
    { s: 53.5, u: 0.818, v: 0.712 }, // Corner 6 (Limit 4)
    { s: 56, u: 0.815, v: 0.585 },
    { s: 58.5, u: 0.7, v: 0.488 },
    { s: 60.5, u: 0.565, v: 0.468 },
    { s: 62, u: 0.455, v: 0.468 },
  ],
};

const cachedTrackImages = new Map<HeatTrackId, HTMLImageElement>();
const loadedTracks = new Set<HeatTrackId>();

let cachedPlayerMatImg: HTMLImageElement | null = null;
let playerMatLoaded = false;

let cachedCardAtlasImg: HTMLImageElement | null = null;
let cardAtlasLoaded = false;

export function getHeatCardAtlasImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (cardAtlasLoaded && cachedCardAtlasImg) return cachedCardAtlasImg;
  if (!cachedCardAtlasImg) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      cardAtlasLoaded = true;
    };
    img.src = "/sprites/heat-cards-atlas.jpg";
    cachedCardAtlasImg = img;
  }
  return null;
}

export const HEAT_COLOR_ATLAS_ROW: Record<HeatCarColorId, number> = {
  black: 0,
  blue: 1,
  green: 2,
  red: 3,
  silver: 4,
  yellow: 5,
};

/**
 * Resolves the exact (col, row) in the 7x7 `heat-cards-atlas.jpg` (635x1024) for any card & driver color.
 */
export function getHeatCardAtlasCell(
  card: HeatCard | null,
  colorId: HeatCarColorId = "red"
): { col: number; row: number } {
  if (!card) {
    // Checkered flag with glowing embers card back
    return { col: 2, row: 6 };
  }
  const colorRow = HEAT_COLOR_ATLAS_ROW[colorId] ?? 3;
  if (card.kind === "upgrade_0") {
    return { col: 0, row: colorRow };
  }
  if (card.kind === "upgrade_5") {
    return { col: 5, row: colorRow };
  }
  if (card.kind === "speed") {
    const v = Math.max(1, Math.min(4, card.value ?? 1));
    return { col: v, row: colorRow };
  }
  if (card.kind === "stress") {
    return { col: 0, row: 6 };
  }
  // Heat card: check if it's the player-colored Starting Upgrade Heat card or standard Engine Heat card
  if (card.id.includes("upg-heat")) {
    return { col: 6, row: colorRow };
  }
  return { col: 1, row: 6 };
}

export function getHeatPlayerMatImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (playerMatLoaded && cachedPlayerMatImg) return cachedPlayerMatImg;
  if (!cachedPlayerMatImg) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      playerMatLoaded = true;
    };
    img.src = "/sprites/heat-player-mat.jpg";
    cachedPlayerMatImg = img;
  }
  return null;
}

/**
 * Normalized coordinates on `heat-player-mat.jpg` for interactive slots & gauges:
 * - Left slot: Draw Deck (checkered background)
 * - Center slot: Engine Heat stack (over Spin-Out diagram & pedals)
 * - Right slot: Discard Pile (trash can watermark)
 * - Far-right vertical strip: Gears 4 (top), 3, 2, 1 (bottom)
 */
export const HEAT_MAT_LAYOUT = {
  aspectRatio: 1.54, // width / height of official player mat
  drawSlot: { u: 0.024, v: 0.358, uw: 0.226, vh: 0.525 },
  engineSlot: { u: 0.316, v: 0.358, uw: 0.228, vh: 0.525 },
  discardSlot: { u: 0.608, v: 0.358, uw: 0.228, vh: 0.525 },
  gears: {
    4: { u: 0.922, v: 0.415, r: 0.056 },
    3: { u: 0.922, v: 0.575, r: 0.056 },
    2: { u: 0.922, v: 0.735, r: 0.056 },
    1: { u: 0.922, v: 0.895, r: 0.056 },
  } as Record<1 | 2 | 3 | 4, { u: number; v: number; r: number }>,
  gauges: {
    step1: { u: 0.082, v: 0.205, r: 0.068 },
    step2: { u: 0.168, v: 0.175, r: 0.054 },
    step3: { u: 0.292, v: 0.165, r: 0.064 },
    step4: { u: 0.415, v: 0.155, r: 0.064 },
    step5: { u: 0.534, v: 0.155, r: 0.064 },
    step6: { u: 0.664, v: 0.165, r: 0.064 },
    step7: { u: 0.788, v: 0.185, r: 0.064 },
    step8: { u: 0.882, v: 0.155, r: 0.042 },
    step9: { u: 0.938, v: 0.235, r: 0.044 },
  },
};

/**
 * Draws a 3D top-down Gear Shifter Pawn (Cần số) sitting on the player mat's vertical gear track.
 */
export function drawGearPawn2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  colorHex: string,
  gearNum: 1 | 2 | 3 | 4,
  isPlannedPreview = false
) {
  const fonts = getCanvasFontFamilies();
  ctx.save();
  ctx.translate(cx, cy);

  // Drop shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.beginPath();
  ctx.arc(2, 3, radius * 1.05, 0, Math.PI * 2);
  ctx.fill();

  // Outer metallic chrome ring
  const ringGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
  ringGrad.addColorStop(0, "#f8fafc");
  ringGrad.addColorStop(0.5, isPlannedPreview ? "#fde047" : "#94a3b8");
  ringGrad.addColorStop(1, "#334155");
  ctx.fillStyle = ringGrad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Colored inner knob dome
  const domeGrad = ctx.createRadialGradient(
    -radius * 0.28,
    -radius * 0.28,
    radius * 0.1,
    0,
    0,
    radius * 0.82
  );
  domeGrad.addColorStop(0, "#ffffff");
  domeGrad.addColorStop(0.25, colorHex);
  domeGrad.addColorStop(1, "#0f172a");
  ctx.fillStyle = domeGrad;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Gear number engraved on knob cap
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.max(10, Math.round(radius * 0.95))}px ${fonts.mono}`;
  ctx.fillText(String(gearNum), 0, 0.5);

  ctx.restore();
}

export function getHeatTrackImage(trackId: HeatTrackId): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (loadedTracks.has(trackId)) {
    return cachedTrackImages.get(trackId) ?? null;
  }
  if (!cachedTrackImages.has(trackId)) {
    const spec = HEAT_TRACKS[trackId] ?? HEAT_TRACKS.usa;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      loadedTracks.add(trackId);
    };
    img.src = spec.spriteUrl;
    cachedTrackImages.set(trackId, img);
  }
  return null;
}

export interface SampledTrackPose {
  x: number;
  y: number;
  angle: number;
  nx: number;
  ny: number;
}

/**
 * Evaluates the exact pixel position `(x, y)` and heading `angle` on the board rectangle `(boardX, boardY, boardW, boardH)`
 * for any fractional track progress `progress` (including negative starting grid positions) and `lane` (0 = Race Line, 1 = Outer).
 */
export function sampleTrackPose(
  trackId: HeatTrackId,
  progress: number,
  lane: 0 | 1,
  boardX: number,
  boardY: number,
  boardW: number,
  boardH: number,
  laneOffsetPx = 9
): SampledTrackPose {
  const spec = HEAT_TRACKS[trackId] ?? HEAT_TRACKS.usa;
  const total = spec.totalSpaces;
  const waypoints = HEAT_TRACK_WAYPOINTS[trackId] ?? HEAT_TRACK_WAYPOINTS.usa;

  // Wrap progress into [0, total)
  const wrapped = ((progress % total) + total) % total;

  // Find enclosing waypoint segment
  let segIdx = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    if (wrapped >= waypoints[i].s && wrapped <= waypoints[i + 1].s) {
      segIdx = i;
      break;
    }
  }

  const w0 = waypoints[segIdx];
  const w1 = waypoints[segIdx + 1] ?? waypoints[0];
  const span = Math.max(0.001, w1.s - w0.s);
  const t = Math.max(0, Math.min(1, (wrapped - w0.s) / span));

  const u = lerp(w0.u, w1.u, t);
  const v = lerp(w0.v, w1.v, t);

  const dx = (w1.u - w0.u) * boardW;
  const dy = (w1.v - w0.v) * boardH;
  const len = Math.max(0.001, Math.hypot(dx, dy));
  const tx = dx / len;
  const ty = dy / len;
  // Normal perpendicular to forward vector
  const nx = -ty;
  const ny = tx;

  const side = lane === 0 ? -0.55 : 0.55;
  const x = boardX + u * boardW + nx * side * laneOffsetPx;
  const y = boardY + v * boardH + ny * side * laneOffsetPx;

  return {
    x,
    y,
    angle: Math.atan2(ty, tx),
    nx,
    ny,
  };
}

/**
 * Draws a top-down 1960s Formula 1 Cigar Race Car with exposed wheels, wishbone suspension,
 * driver helmet, racing number roundel, and optional animated exhaust flames.
 */
export function drawHeatCar2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  colorId: HeatCarColorId,
  options?: {
    scale?: number;
    isViewer?: boolean;
    isActive?: boolean;
    flameIntensity?: number;
    spinAngleOffset?: number;
    gear?: number;
  }
) {
  const colorSpec =
    HEAT_CAR_COLORS.find((c) => c.id === colorId) ?? HEAT_CAR_COLORS[0];
  const scale = options?.scale ?? 1;
  const spinOff = options?.spinAngleOffset ?? 0;
  const fonts = getCanvasFontFamilies();

  ctx.save();
  ctx.translate(x, y);

  // Viewer or active turn selection halo under car
  if (options?.isActive || options?.isViewer) {
    ctx.save();
    ctx.strokeStyle = options.isActive ? "#fde047" : "#38bdf8";
    ctx.lineWidth = options.isActive ? 2.4 : 1.6;
    ctx.shadowColor = options.isActive ? "#facc15" : "#38bdf8";
    ctx.shadowBlur = options.isActive ? 12 : 6;
    ctx.beginPath();
    ctx.arc(0, 0, 17 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.rotate(angle + spinOff);
  ctx.scale(scale, scale);

  // Drop shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
  ctx.beginPath();
  ctx.ellipse(1, 2, 15, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Animated twin exhaust flames when moving / boosting
  const flame = options?.flameIntensity ?? 0;
  if (flame > 0.05) {
    const fLen = (8 + Math.random() * 8) * flame;
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.moveTo(-13, -2.5);
    ctx.lineTo(-13 - fLen, 0);
    ctx.lineTo(-13, 2.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.moveTo(-13, -1.2);
    ctx.lineTo(-13 - fLen * 0.6, 0);
    ctx.lineTo(-13, 1.2);
    ctx.closePath();
    ctx.fill();
  }

  // Silver dual tailpipes
  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(-14.5, -2.6, 3.5, 1.6);
  ctx.fillRect(-14.5, 1.0, 3.5, 1.6);

  // Exposed chrome suspension wishbones
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  // Rear axle
  ctx.moveTo(-8, -7);
  ctx.lineTo(-8, 7);
  // Front axle
  ctx.moveTo(8, -6.5);
  ctx.lineTo(8, 6.5);
  ctx.stroke();

  // 4 Open-Wheel F1 Tires (rear tires slightly wider)
  ctx.fillStyle = "#090d16";
  drawRoundedRect(ctx, -11.5, -9.2, 6.6, 3.6, 1.4);
  ctx.fill();
  drawRoundedRect(ctx, -11.5, 5.6, 6.6, 3.6, 1.4);
  ctx.fill();
  drawRoundedRect(ctx, 5.2, -8.5, 5.8, 3.2, 1.3);
  ctx.fill();
  drawRoundedRect(ctx, 5.2, 5.3, 5.8, 3.2, 1.3);
  ctx.fill();

  // Sleek 1960s Cigar F1 Bodywork
  ctx.fillStyle = colorSpec.primaryHex;
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(14.5, 0); // Nose cone tip
  ctx.quadraticCurveTo(12, -4.8, 2, -5.2);
  ctx.lineTo(-9, -4.4);
  ctx.quadraticCurveTo(-13.5, -3.2, -13.5, 0);
  ctx.quadraticCurveTo(-13.5, 3.2, -9, 4.4);
  ctx.lineTo(2, 5.2);
  ctx.quadraticCurveTo(12, 4.8, 14.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Racing nose stripe
  ctx.fillStyle = colorSpec.accentHex;
  ctx.fillRect(4, -1.3, 9, 2.6);

  // White number roundel on nose/hood
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(6.5, 0, 3.3, 0, Math.PI * 2);
  ctx.fill();

  // Cockpit & Golden Windscreen + Driver Helmet
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.ellipse(-1.5, 0, 4.2, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Amber tinted windscreen arc
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(-0.5, 0, 3.2, -Math.PI * 0.45, Math.PI * 0.45);
  ctx.stroke();

  // Driver helmet
  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  ctx.arc(-2.2, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colorSpec.primaryHex;
  ctx.fillRect(-2.5, -2.1, 1.5, 4.2);

  ctx.restore();

  // Upright car number badge so it's always readable regardless of car heading
  ctx.save();
  ctx.translate(x, y - 13 * scale);
  drawRoundedRect(ctx, -8, -6, 16, 11, 3);
  ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
  ctx.fill();
  ctx.strokeStyle = colorSpec.primaryHex;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 8.5px ${fonts.mono}`;
  ctx.fillText(`#${colorSpec.number}`, 0, -0.5);
  ctx.restore();
}

/**
 * Draws a detailed 2D Heat card faithful to the official artwork:
 * - Uses the 7x7 `heat-cards-atlas.jpg` sprite sheet per driver color (`black`, `blue`, `green`, `red`, `silver`, `yellow`)
 * - Renders full procedural 2D vector illustration fallback & crisp vector overlays (brushed side banners, chevrons,
 *   top-center speedometer gauge on 1..4, crossed trash icon on Heat/Stress, Cooldown thermometer-to-engine icon on Heat,
 *   and progressive camera-zoom F1 car art from 0 to 5).
 */
export function drawHeatCard2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  card: HeatCard | null,
  options?: {
    colorId?: HeatCarColorId;
    selected?: boolean;
    hovered?: boolean;
    disabled?: boolean;
    cooldownBadge?: boolean;
    discardBadge?: boolean;
  }
) {
  const fonts = getCanvasFontFamilies();
  const colorId: HeatCarColorId = options?.colorId ?? "red";
  const colorSpec =
    HEAT_CAR_COLORS.find((c) => c.id === colorId) ?? HEAT_CAR_COLORS[0];
  const r = Math.max(5, Math.round(w * 0.095));
  const atlasImg = getHeatCardAtlasImage();

  ctx.save();

  // Card drop shadow
  ctx.fillStyle = options?.selected
    ? "rgba(250, 204, 21, 0.42)"
    : "rgba(0, 0, 0, 0.5)";
  drawRoundedRect(ctx, x + 2, y + 3, w, h, r);
  ctx.fill();

  // Clip to rounded card rectangle
  drawRoundedRect(ctx, x, y, w, h, r);
  ctx.save();
  ctx.clip();

  if (atlasImg) {
    const cell = getHeatCardAtlasCell(card, colorId);
    const cellW = atlasImg.naturalWidth / 7;
    const cellH = atlasImg.naturalHeight / 7;
    const insetX = 1.2;
    const insetY = 1.2;
    ctx.drawImage(
      atlasImg,
      cell.col * cellW + insetX,
      cell.row * cellH + insetY,
      cellW - insetX * 2,
      cellH - insetY * 2,
      x,
      y,
      w,
      h
    );
  } else if (!card) {
    // Procedural 2D Card Back: Waving diagonal checkered racing flag with glowing orange embers
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x, y, w, h);
    const cols = 6;
    const rows = 9;
    const cw = w / cols;
    const ch = h / rows;
    for (let rIdx = 0; rIdx < rows; rIdx++) {
      for (let cIdx = 0; cIdx < cols; cIdx++) {
        const isLight = (rIdx + cIdx) % 2 === 0;
        ctx.fillStyle = isLight ? "#e2e8f0" : "#090d16";
        ctx.fillRect(x + cIdx * cw, y + rIdx * ch, cw + 0.5, ch + 0.5);
      }
    }
    // Glowing orange racing embers at bottom right
    const emberGrad = ctx.createRadialGradient(
      x + w * 0.75,
      y + h * 0.82,
      2,
      x + w * 0.65,
      y + h * 0.75,
      w * 0.8
    );
    emberGrad.addColorStop(0, "rgba(249, 115, 22, 0.55)");
    emberGrad.addColorStop(1, "rgba(249, 115, 22, 0)");
    ctx.fillStyle = emberGrad;
    ctx.fillRect(x, y, w, h);
  } else {
    // Procedural 2D Vector Card Art matching the 7 columns of the official card sheet
    const isHeat = card.kind === "heat";
    const isStress = card.kind === "stress";
    const isUpgrade =
      card.kind === "upgrade_0" ||
      card.kind === "upgrade_5" ||
      card.id.includes("upg-heat");
    const bannerColor =
      isHeat && !card.id.includes("upg-heat")
        ? "#7f1d1d"
        : isStress
          ? "#3b0764"
          : colorSpec.primaryHex;

    // 1. Scenic track or engine background
    const skyGrad = ctx.createLinearGradient(x, y, x, y + h);
    if (isHeat) {
      skyGrad.addColorStop(0, "#facc15");
      skyGrad.addColorStop(0.35, "#ea580c");
      skyGrad.addColorStop(0.8, "#7f1d1d");
      skyGrad.addColorStop(1, "#1c1917");
    } else if (isStress) {
      skyGrad.addColorStop(0, "#f8fafc");
      skyGrad.addColorStop(0.35, "#a3e635");
      skyGrad.addColorStop(0.65, "#475569");
      skyGrad.addColorStop(1, "#0f172a");
    } else {
      skyGrad.addColorStop(0, "#bae6fd");
      skyGrad.addColorStop(0.35, "#65a30d");
      skyGrad.addColorStop(0.55, "#475569");
      skyGrad.addColorStop(1, "#334155");
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(x, y, w, h);

    // 2. Center 2D artwork: Overheated glowing engine block (Heat), Steering wheel POV (Stress), or F1 Car zooming closer from 0..5
    const cx = x + w * 0.5;
    const cy = y + h * 0.58;
    if (isHeat) {
      // Glowing red-orange V8 engine block with exhaust pipes
      ctx.fillStyle = "#dc2626";
      ctx.strokeStyle = "#7f1d1d";
      ctx.lineWidth = 1.5;
      drawRoundedRect(ctx, cx - w * 0.28, cy - h * 0.2, w * 0.56, h * 0.36, 5);
      ctx.fill();
      ctx.stroke();

      // Bottom Cooldown rule icon: [❄️ Thermometer] [Card -> Engine]
      drawRoundedRect(ctx, x + w * 0.14, y + h - 20, w * 0.72, 15, 4);
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fill();
      ctx.fillStyle = "#38bdf8";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `800 ${Math.max(7, Math.round(w * 0.12))}px ${fonts.sans}`;
      ctx.fillText("❄️ : ✋➔🔥", cx, y + h - 12.5);
    } else if (isStress) {
      // First-person cockpit steering wheel & driver gloves
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = Math.max(2, w * 0.045);
      ctx.beginPath();
      ctx.arc(cx, cy + h * 0.08, w * 0.24, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // F1 Car scaled progressively larger from Speed 0 (far) to Speed 5 (close-up hood)
      const v = card.value ?? 1;
      const carZoom = 0.65 + v * 0.15;
      drawHeatCar2D(ctx, cx, cy, -Math.PI * 0.6, colorId, {
        scale: (w / 70) * carZoom,
      });

      // Top-center Speedometer Gauge on Basic Speed 1..4
      if (card.kind === "speed") {
        const gx = cx;
        const gy = y + h * 0.12;
        const gr = w * 0.13;
        ctx.fillStyle = "rgba(248, 250, 252, 0.92)";
        ctx.beginPath();
        ctx.arc(gx, gy, gr, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = bannerColor;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        const needleAng = Math.PI + (v / 4.5) * Math.PI;
        ctx.strokeStyle = "#dc2626";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(
          gx + Math.cos(needleAng) * gr * 0.82,
          gy + Math.sin(needleAng) * gr * 0.82
        );
        ctx.stroke();
      }
    }

    // 3. Left & Right Vertical Brushed Ribbons at top corners (exact Heat card layout!)
    const ribW = Math.max(11, Math.round(w * 0.2));
    const ribH = Math.round(h * 0.42);
    for (const sideX of [x, x + w - ribW]) {
      ctx.fillStyle = bannerColor;
      ctx.fillRect(sideX, y, ribW, ribH);

      // Chevron stripes on Upgrade cards (0, 5, upg-heat) or yellow hazard stripes on Stress
      if (isUpgrade || isStress) {
        ctx.strokeStyle = isStress ? "#facc15" : "rgba(255,255,255,0.45)";
        ctx.lineWidth = 1.5;
        for (let c = 0; c < 3; c++) {
          const cyRib = y + ribH * 0.52 + c * 6;
          ctx.beginPath();
          ctx.moveTo(sideX + 2, cyRib - 3);
          ctx.lineTo(sideX + ribW * 0.5, cyRib + 2);
          ctx.lineTo(sideX + ribW - 2, cyRib - 3);
          ctx.stroke();
        }
      }

      // Top corner symbol (0..5, +, or crossed-out trash can for Heat)
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `900 ${Math.max(10, Math.round(w * 0.19))}px ${fonts.mono}`;
      const sym = isHeat
        ? "🗑️"
        : isStress
          ? "+"
          : String(card.value ?? 0);
      ctx.fillText(sym, sideX + ribW * 0.5, y + ribH * 0.26);
    }
  }

  ctx.restore(); // End inner clip

  // Outer card border (gold when selected, bright white when hovered, subtle metallic otherwise)
  drawRoundedRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = options?.selected
    ? "#fde047"
    : options?.hovered
      ? "#f8fafc"
      : "rgba(226, 232, 240, 0.35)";
  ctx.lineWidth = options?.selected ? 2.6 : options?.hovered ? 2 : 1.2;
  ctx.stroke();

  // Action badge overlays (Cooldown / Discard / Selected)
  if (options?.cooldownBadge) {
    drawRoundedRect(ctx, x + 4, y + h - 20, w - 8, 16, 4);
    ctx.fillStyle = "rgba(2, 132, 199, 0.94)";
    ctx.fill();
    ctx.fillStyle = "#e0f2fe";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 9px ${fonts.sans}`;
    ctx.fillText("❄️ LÀM MÁT", x + w * 0.5, y + h - 12);
  } else if (options?.discardBadge) {
    drawRoundedRect(ctx, x + 4, y + h - 20, w - 8, 16, 4);
    ctx.fillStyle = "rgba(225, 29, 72, 0.94)";
    ctx.fill();
    ctx.fillStyle = "#ffe4e6";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 9px ${fonts.sans}`;
    ctx.fillText("🗑️ BỎ BÀI", x + w * 0.5, y + h - 12);
  } else if (options?.selected) {
    drawRoundedRect(ctx, x + 4, y + h - 20, w - 8, 16, 4);
    ctx.fillStyle = "rgba(234, 179, 8, 0.95)";
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 9px ${fonts.sans}`;
    ctx.fillText("✓ ĐÃ CHỌN", x + w * 0.5, y + h - 12);
  }

  ctx.restore();
}
