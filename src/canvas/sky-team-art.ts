import { drawRoundedRect } from "@/canvas/engine";
import type { SkyTeamRole } from "@/cartridges/sky-team";

let skyTeamDiceImg: HTMLImageElement | null = null;

export function getSkyTeamDiceImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!skyTeamDiceImg) {
    const img = new Image();
    img.src = "/sprites/sky-team-dice.png";
    skyTeamDiceImg = img;
  }
  return skyTeamDiceImg.complete && skyTeamDiceImg.naturalWidth > 0
    ? skyTeamDiceImg
    : null;
}

/**
 * Draws a crisp Sky Team glossy beveled numbered die (Royal Blue = Pilot,
 * Fiery Orange = Co-pilot) using the official 6x3 dice sprite atlas.
 */
export function drawSkyTeamDie(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  value: number | null,
  role: SkyTeamRole,
  options?: {
    selected?: boolean;
    hovered?: boolean;
    modified?: boolean;
    alpha?: number;
  }
): void {
  const isPilot = role === "pilot";
  const r = Math.max(5, size * 0.18);

  ctx.save();
  if (options?.alpha !== undefined) ctx.globalAlpha = options.alpha;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Selection / drop shadow
  ctx.shadowColor = options?.selected
    ? "rgba(253, 224, 71, 0.8)"
    : "rgba(2, 6, 23, 0.5)";
  ctx.shadowBlur = options?.selected ? 14 : 6;
  ctx.shadowOffsetY = 2;

  const atlas = getSkyTeamDiceImage();
  if (atlas && value !== null && value >= 1 && value <= 6) {
    const cellW = atlas.naturalWidth / 6;
    const cellH = atlas.naturalHeight / 3;
    const col = value - 1;
    const row = isPilot ? 0 : 1;

    // Draw sprite die cleanly
    ctx.drawImage(
      atlas,
      col * cellW + 0.5,
      row * cellH + 0.5,
      cellW - 1,
      cellH - 1,
      x,
      y,
      size,
      size
    );
  } else {
    // Glossy beveled fallback (also used for hidden partner '?' dice)
    const grad = ctx.createLinearGradient(x, y, x, y + size);
    if (isPilot) {
      grad.addColorStop(0, "#4f6fd8");
      grad.addColorStop(0.25, "#2b45a8");
      grad.addColorStop(1, "#1e3080");
    } else {
      grad.addColorStop(0, "#ff9947");
      grad.addColorStop(0.25, "#eb5e17");
      grad.addColorStop(1, "#b83b0a");
    }
    drawRoundedRect(ctx, x, y, size, size, r);
    ctx.fillStyle = grad;
    ctx.fill();

    // Top glossy specular bar
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    const shineGrad = ctx.createLinearGradient(x, y + 2, x, y + size * 0.34);
    shineGrad.addColorStop(0, "rgba(255,255,255,0.48)");
    shineGrad.addColorStop(1, "rgba(255,255,255,0)");
    drawRoundedRect(ctx, x + size * 0.1, y + 2, size * 0.8, size * 0.3, r * 0.6);
    ctx.fillStyle = shineGrad;
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = `900 ${Math.round(size * 0.62)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      value === null ? "?" : String(value),
      x + size / 2,
      y + size / 2 + size * 0.03
    );
  }

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Highlight ring when selected or hovered
  if (options?.selected || options?.hovered) {
    drawRoundedRect(ctx, x, y, size, size, r);
    ctx.lineWidth = options.selected ? 2.8 : 2;
    ctx.strokeStyle = options.selected ? "#fde047" : "#ffffff";
    ctx.stroke();
  }

  // Coffee-modified dot badge
  if (options?.modified) {
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.arc(x + size - 5, y + 5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#0f172a";
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws the official Sky Team rotating Axis aircraft + top pointer triangle disc
 * (sky-team-axis-plane.png) directly on top of the board's printed Artificial Horizon!
 */
export function drawAxisHorizonDial(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  smoothAxis: number
): void {
  const axisImg = getSkyTeamAxisImage();
  // Board's printed notches are ~24 deg apart: 0, ±24°, ±48°, and red X at ±72° (±3)
  const angleRad = (smoothAxis * 24 * Math.PI) / 180;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (axisImg) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleRad);
    ctx.shadowColor = "rgba(2, 6, 23, 0.55)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 1.5;
    const discSize = radius * 1.98;
    ctx.drawImage(axisImg, -discSize / 2, -discSize / 2, discSize, discSize);
    ctx.restore();
  } else {
    // Fallback miniature aircraft silhouette
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleRad);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-radius * 0.72, 0);
    ctx.lineTo(radius * 0.72, 0);
    ctx.stroke();
    ctx.restore();
  }

  // Subtle numeric tilt badge at bottom rim so exact value is unmistakable
  const rounded = Math.round(smoothAxis);
  const label =
    rounded === 0 ? "0° CÂN BẰNG" : `${rounded > 0 ? "+" : ""}${rounded}`;
  drawRoundedRect(ctx, cx - 32, cy + radius - 16, 64, 16, 6);
  ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
  ctx.fill();
  ctx.fillStyle =
    rounded === 0 ? "#4ade80" : Math.abs(rounded) >= 2 ? "#f87171" : "#fbbf24";
  ctx.font = "800 9.5px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, cy + radius - 8);

  ctx.restore();
}

/**
 * Draws a stylized mini airplane silhouette (used for traffic & player plane).
 */
export function drawMiniPlaneIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  color: string,
  pointingRight = true
): void {
  ctx.save();
  ctx.translate(cx, cy);
  if (!pointingRight) ctx.scale(-1, 1);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(3, -2.5);
  ctx.lineTo(-2, -9);
  ctx.lineTo(-4.5, -9);
  ctx.lineTo(-1.5, -2.2);
  ctx.lineTo(-7, -2);
  ctx.lineTo(-9.5, -5.5);
  ctx.lineTo(-11, -5.5);
  ctx.lineTo(-9.5, 0);
  ctx.lineTo(-11, 5.5);
  ctx.lineTo(-9.5, 5.5);
  ctx.lineTo(-7, 2);
  ctx.lineTo(-1.5, 2.2);
  ctx.lineTo(-4.5, 9);
  ctx.lineTo(-2, 9);
  ctx.lineTo(3, 2.5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

let skyTeamBgImg: HTMLImageElement | null = null;
let skyTeamPilotRoleImg: HTMLImageElement | null = null;
let skyTeamCopilotRoleImg: HTMLImageElement | null = null;
let skyTeamBoardImg: HTMLImageElement | null = null;
let skyTeamAirportsImg: HTMLImageElement | null = null;
let skyTeamTokensImg: HTMLImageElement | null = null;
let skyTeamMarkersImg: HTMLImageElement | null = null;
let skyTeamAltitudeImg: HTMLImageElement | null = null;
let skyTeamSwitchImg: HTMLImageElement | null = null;
let skyTeamAxisImg: HTMLImageElement | null = null;
let skyTeamWindImg: HTMLImageElement | null = null;
let skyTeamWindPlaneImg: HTMLImageElement | null = null;
let skyTeamInternImg: HTMLImageElement | null = null;
let skyTeamFuelImg: HTMLImageElement | null = null;
let skyTeamInternMarkerImg: HTMLImageElement | null = null;
let skyTeamFuelMarkerImg: HTMLImageElement | null = null;
let skyTeamInternBadgesImg: HTMLImageElement | null = null;

export function getSkyTeamInternBadgesImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!skyTeamInternBadgesImg) {
    const img = new Image();
    img.src = "/sprites/sky-team-intern-badges.png";
    skyTeamInternBadgesImg = img;
  }
  return skyTeamInternBadgesImg.complete &&
    skyTeamInternBadgesImg.naturalWidth > 0
    ? skyTeamInternBadgesImg
    : null;
}

export function getSkyTeamFuelMarkerImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!skyTeamFuelMarkerImg) {
    const img = new Image();
    img.src = "/sprites/sky-team-fuel-marker.png";
    skyTeamFuelMarkerImg = img;
  }
  return skyTeamFuelMarkerImg.complete && skyTeamFuelMarkerImg.naturalWidth > 0
    ? skyTeamFuelMarkerImg
    : null;
}

export function getSkyTeamInternMarkerImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!skyTeamInternMarkerImg) {
    const img = new Image();
    img.src = "/sprites/sky-team-intern-marker.png";
    skyTeamInternMarkerImg = img;
  }
  return skyTeamInternMarkerImg.complete &&
    skyTeamInternMarkerImg.naturalWidth > 0
    ? skyTeamInternMarkerImg
    : null;
}

export function getSkyTeamFuelImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!skyTeamFuelImg) {
    const img = new Image();
    img.src = "/sprites/sky-team-fuel.png";
    skyTeamFuelImg = img;
  }
  return skyTeamFuelImg.complete && skyTeamFuelImg.naturalWidth > 0
    ? skyTeamFuelImg
    : null;
}

export function getSkyTeamInternImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!skyTeamInternImg) {
    const img = new Image();
    img.src = "/sprites/sky-team-intern.png";
    skyTeamInternImg = img;
  }
  return skyTeamInternImg.complete && skyTeamInternImg.naturalWidth > 0
    ? skyTeamInternImg
    : null;
}

export function getSkyTeamWindImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!skyTeamWindImg) {
    const img = new Image();
    img.src = "/sprites/sky-team-wind.png";
    skyTeamWindImg = img;
  }
  return skyTeamWindImg.complete && skyTeamWindImg.naturalWidth > 0
    ? skyTeamWindImg
    : null;
}

export function getSkyTeamWindPlaneImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!skyTeamWindPlaneImg) {
    const img = new Image();
    img.src = "/sprites/sky-team-wind-plane.png";
    skyTeamWindPlaneImg = img;
  }
  return skyTeamWindPlaneImg.complete && skyTeamWindPlaneImg.naturalWidth > 0
    ? skyTeamWindPlaneImg
    : null;
}

export function getSkyTeamAxisImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!skyTeamAxisImg) {
    const img = new Image();
    img.src = "/sprites/sky-team-axis-plane.png";
    skyTeamAxisImg = img;
  }
  return skyTeamAxisImg.complete && skyTeamAxisImg.naturalWidth > 0
    ? skyTeamAxisImg
    : null;
}

export function getSkyTeamSwitchImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!skyTeamSwitchImg) {
    const img = new Image();
    img.src = "/sprites/sky-team-switch.png";
    skyTeamSwitchImg = img;
  }
  return skyTeamSwitchImg.complete && skyTeamSwitchImg.naturalWidth > 0
    ? skyTeamSwitchImg
    : null;
}

export function getSkyTeamAltitudeImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!skyTeamAltitudeImg) {
    const img = new Image();
    img.src = "/sprites/sky-team-altitude.png";
    skyTeamAltitudeImg = img;
  }
  return skyTeamAltitudeImg.complete && skyTeamAltitudeImg.naturalWidth > 0
    ? skyTeamAltitudeImg
    : null;
}

export function getSkyTeamMarkersImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!skyTeamMarkersImg) {
    const img = new Image();
    img.src = "/sprites/sky-team-markers.png";
    skyTeamMarkersImg = img;
  }
  return skyTeamMarkersImg.complete && skyTeamMarkersImg.naturalWidth > 0
    ? skyTeamMarkersImg
    : null;
}

export function getSkyTeamTokensImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!skyTeamTokensImg) {
    const img = new Image();
    img.src = "/sprites/sky-team-tokens.png";
    skyTeamTokensImg = img;
  }
  return skyTeamTokensImg.complete && skyTeamTokensImg.naturalWidth > 0
    ? skyTeamTokensImg
    : null;
}

export function getSkyTeamAirportsImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!skyTeamAirportsImg) {
    const img = new Image();
    img.src = "/sprites/sky-team-airports.png";
    skyTeamAirportsImg = img;
  }
  return skyTeamAirportsImg.complete && skyTeamAirportsImg.naturalWidth > 0
    ? skyTeamAirportsImg
    : null;
}

export function getSkyTeamBoardImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!skyTeamBoardImg) {
    const img = new Image();
    img.src = "/sprites/sky-team-board.png";
    skyTeamBoardImg = img;
  }
  return skyTeamBoardImg.complete && skyTeamBoardImg.naturalWidth > 0
    ? skyTeamBoardImg
    : null;
}

export function getSkyTeamBgImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!skyTeamBgImg) {
    const img = new Image();
    img.src = "/sprites/sky-team-bg.jpg";
    skyTeamBgImg = img;
  }
  return skyTeamBgImg.complete && skyTeamBgImg.naturalWidth > 0
    ? skyTeamBgImg
    : null;
}

export function getSkyTeamRoleImage(
  role: SkyTeamRole
): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (role === "pilot") {
    if (!skyTeamPilotRoleImg) {
      const img = new Image();
      img.src = "/sprites/sky-team-role-pilot.png";
      skyTeamPilotRoleImg = img;
    }
    return skyTeamPilotRoleImg.complete && skyTeamPilotRoleImg.naturalWidth > 0
      ? skyTeamPilotRoleImg
      : null;
  }
  if (!skyTeamCopilotRoleImg) {
    const img = new Image();
    img.src = "/sprites/sky-team-role-copilot.png";
    skyTeamCopilotRoleImg = img;
  }
  return skyTeamCopilotRoleImg.complete &&
    skyTeamCopilotRoleImg.naturalWidth > 0
    ? skyTeamCopilotRoleImg
    : null;
}

/**
 * Draws the Sky Team sky-and-clouds background with gentle horizontal cloud drift
 * and a light contrast glaze so cockpit instruments stay sharp and readable.
 */
export function drawCockpitBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  altitude: number,
  nowMs: number
): void {
  const bgImg = getSkyTeamBgImage();

  if (bgImg) {
    // Scale image to cover height while preserving aspect ratio, and tile horizontally with slow drift
    const scale = Math.max(h / bgImg.naturalHeight, w / bgImg.naturalWidth);
    const tileW = bgImg.naturalWidth * scale;
    const tileH = bgImg.naturalHeight * scale;
    const offsetY = (h - tileH) / 2;
    const drift = ((nowMs * 0.012) % tileW);

    ctx.save();
    for (let x = -drift; x < w; x += tileW) {
      ctx.drawImage(bgImg, x, offsetY, tileW + 1, tileH);
    }

    // Subtle atmospheric glaze: airy sky in normal flight, warm golden tint at 0 ft landing
    const glaze = ctx.createLinearGradient(0, 0, 0, h);
    if (altitude === 0) {
      glaze.addColorStop(0, "rgba(15, 23, 42, 0.28)");
      glaze.addColorStop(0.55, "rgba(30, 27, 75, 0.34)");
      glaze.addColorStop(1, "rgba(15, 23, 42, 0.52)");
    } else {
      glaze.addColorStop(0, "rgba(12, 74, 110, 0.14)");
      glaze.addColorStop(0.55, "rgba(15, 23, 42, 0.24)");
      glaze.addColorStop(1, "rgba(2, 6, 23, 0.42)");
    }
    ctx.fillStyle = glaze;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    return;
  }

  // Fallback gradient while image loads
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#7dd3fc");
  bg.addColorStop(0.5, "#38bdf8");
  bg.addColorStop(1, "#0c4a6e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
}

export interface RoleScreenOverlay {
  playerName: string | null;
  isViewer: boolean;
  hovered: boolean;
  canSwap: boolean;
}

function drawRoleSpriteCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  nowMs: number,
  role: SkyTeamRole,
  overlay: RoleScreenOverlay
): void {
  const isPilot = role === "pilot";
  const img = getSkyTeamRoleImage(role);

  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, 16);
  ctx.clip();

  if (img) {
    // Cover-fit while anchoring slightly higher so the "SKY TEAM" header and aircraft stay centered above the bottom plate
    const zoom = overlay.hovered ? 1.035 : 1.0 + Math.sin(nowMs * 0.0014 + (isPilot ? 0 : 1.5)) * 0.008;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) * 0.28;
    ctx.drawImage(img, dx, dy, dw, dh);

    // Subtle cel-shaded diagonal glossy sheen on hover
    if (overlay.hovered) {
      const sheenX = x + ((nowMs * 0.18) % (w + 180)) - 90;
      const sheenGrad = ctx.createLinearGradient(sheenX - 45, y, sheenX + 45, y + h);
      sheenGrad.addColorStop(0, "rgba(255,255,255,0)");
      sheenGrad.addColorStop(0.5, "rgba(255,255,255,0.16)");
      sheenGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sheenGrad;
      ctx.fillRect(x, y, w, h);
    }
  } else {
    // Clean cel-shaded fallback while sprite loads
    ctx.fillStyle = isPilot ? "#0284c7" : "#f59e0b";
    ctx.fillRect(x, y, w, h);
  }

  // Bottom Role Plate Overlay
  drawRoleBottomPlate(ctx, x, y, w, h, role, overlay);

  ctx.restore();

  // Crisp cel-shaded outer border
  drawRoundedRect(ctx, x, y, w, h, 16);
  ctx.lineWidth = overlay.hovered ? 3.5 : 2.5;
  ctx.strokeStyle = overlay.hovered
    ? "#fde047"
    : isPilot
      ? "#38bdf8"
      : "#fb923c";
  ctx.stroke();
}

/**
 * Draws the high-detail 2D cel-shaded PILOT (Blue) role selection screen.
 */
export function drawCelShadedPilotScreen(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  nowMs: number,
  overlay: RoleScreenOverlay
): void {
  drawRoleSpriteCard(ctx, x, y, w, h, nowMs, "pilot", overlay);
}

/**
 * Draws the high-detail 2D cel-shaded CO-PILOT (Orange) role selection screen.
 */
export function drawCelShadedCopilotScreen(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  nowMs: number,
  overlay: RoleScreenOverlay
): void {
  drawRoleSpriteCard(ctx, x, y, w, h, nowMs, "copilot", overlay);
}

function drawRoleBottomPlate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  role: SkyTeamRole,
  overlay: RoleScreenOverlay
) {
  const isPilot = role === "pilot";
  const plateH = Math.max(66, Math.min(82, h * 0.25));
  const plateY = y + h - plateH;

  const grad = ctx.createLinearGradient(x, plateY - 14, x, y + h);
  grad.addColorStop(0, "rgba(2, 6, 23, 0)");
  grad.addColorStop(0.25, "rgba(2, 6, 23, 0.82)");
  grad.addColorStop(1, "rgba(2, 6, 23, 0.94)");
  ctx.fillStyle = grad;
  ctx.fillRect(x, plateY - 14, w, plateH + 14);

  const cx = x + w / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Role Pill
  ctx.fillStyle = isPilot ? "#38bdf8" : "#fb923c";
  ctx.font = "900 11px system-ui, sans-serif";
  ctx.fillText(
    isPilot ? "👨‍✈️ CƠ TRƯỞNG • PILOT (XANH)" : "👩‍✈️ CƠ PHÓ • CO-PILOT (CAM)",
    cx,
    plateY + 16
  );

  // Player Name
  ctx.fillStyle = overlay.playerName ? "#ffffff" : "#94a3b8";
  ctx.font = "800 15px system-ui, sans-serif";
  ctx.fillText(
    overlay.playerName
      ? `${overlay.playerName}${overlay.isViewer ? " (Bạn)" : ""}`
      : "Đang chờ phi công...",
    cx,
    plateY + 38
  );

  // Abilities + swap hint
  ctx.fillStyle = overlay.hovered && overlay.canSwap ? "#fde047" : "#cbd5e1";
  ctx.font = "700 10px system-ui, sans-serif";
  ctx.fillText(
    overlay.hovered && overlay.canSwap
      ? "⇄ Bấm để đổi vai Cơ trưởng / Cơ phó"
      : isPilot
        ? "4 Xúc xắc Xanh • Càng Hạ Cánh & Phanh"
        : "4 Xúc xắc Cam • Cánh Tà & 2 Radio",
    cx,
    plateY + plateH - 12
  );
}

/**
 * Draws the official Sky Team white 3x3-dot sliding switch knob directly on
 * top of the board's printed switch rail with smooth animated slideProgress (0 = OFF right, 1 = ON left).
 */
export function drawCockpitSwitchOverlay(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  isOnOrProgress: boolean | number
): void {
  const knobImg = getSkyTeamSwitchImage();
  const knobSize = Math.max(h * 1.06, w * 0.48);
  const progress =
    typeof isOnOrProgress === "number"
      ? Math.max(0, Math.min(1, isOnOrProgress))
      : isOnOrProgress
        ? 1
        : 0;
  // Slide smoothly from RIGHT (progress 0 = OFF, covering green LED) to LEFT (progress 1 = ON, revealing green LED)
  const knobCx = cx + w * (0.25 - 0.5 * progress);

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (progress > 0.15) {
    // Smoothly blooming green glow over the revealed green LED on the right
    ctx.beginPath();
    ctx.arc(cx + w * 0.25, cy, h * 0.36, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(74, 222, 128, ${(0.34 * progress).toFixed(3)})`;
    ctx.shadowColor = "#4ade80";
    ctx.shadowBlur = 10 * progress;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.shadowColor = "rgba(2, 6, 23, 0.65)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 1.5;

  if (knobImg) {
    ctx.drawImage(
      knobImg,
      knobCx - knobSize / 2,
      cy - knobSize / 2,
      knobSize,
      knobSize
    );
  } else {
    drawRoundedRect(
      ctx,
      knobCx - knobSize / 2,
      cy - knobSize / 2,
      knobSize,
      knobSize,
      knobSize * 0.22
    );
    ctx.fillStyle = "#f1f5f9";
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "#475569";
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws the official Sky Team Reroll token (cell 0 of sky-team-tokens.png)
 * inside the top-left Reroll pocket of the cockpit board.
 */
export function drawRerollToken(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  count: number
): void {
  if (count <= 0) return;
  const atlas = getSkyTeamTokensImage();
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.shadowColor = "rgba(2, 6, 23, 0.55)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;

  if (atlas) {
    const cellW = atlas.naturalWidth / 3;
    ctx.drawImage(
      atlas,
      0,
      0,
      cellW,
      atlas.naturalHeight,
      cx - size / 2,
      cy - size / 2,
      size,
      size
    );
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = "#1e293b";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#38bdf8";
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  if (count > 1) {
    const br = Math.max(8, size * 0.22);
    const bx = cx + size * 0.34;
    const by = cy + size * 0.34;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fillStyle = "#f59e0b";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#0f172a";
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#0f172a";
    ctx.font = `900 ${Math.max(8.5, Math.round(br * 1.15))}px system-ui, sans-serif`;
    ctx.fillText(`×${count}`, bx, by + 0.5);
  }
  ctx.restore();
}

/**
 * Draws the official Sky Team Coffee mug token (cell 1 of sky-team-tokens.png)
 * inside the cockpit ±1 cup holders.
 */
export function drawCoffeeToken(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
): void {
  const atlas = getSkyTeamTokensImage();
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.shadowColor = "rgba(2, 6, 23, 0.65)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;

  if (atlas) {
    const cellW = atlas.naturalWidth / 3;
    const size = r * 2.15;
    ctx.drawImage(
      atlas,
      cellW,
      0,
      cellW,
      atlas.naturalHeight,
      cx - size / 2,
      cy - size / 2,
      size,
      size
    );
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#f8fafc";
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draws one of the 3 official Sky Team pointer markers (blue = aerodynamics low,
 * orange = aerodynamics high, red = brakes) from sky-team-markers.png, rotated
 * to align radially with the curved track arc.
 */
export function drawArcPointerMarker(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  height: number,
  kind: "blue" | "orange" | "red",
  angleRad: number
): void {
  const atlas = getSkyTeamMarkersImage();
  const col = kind === "blue" ? 0 : kind === "orange" ? 1 : 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angleRad);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.shadowColor = "rgba(2, 6, 23, 0.72)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 1.5;

  if (atlas) {
    const cellW = atlas.naturalWidth / 3;
    const cellH = atlas.naturalHeight;
    const drawW = height * (cellW / cellH);
    ctx.drawImage(
      atlas,
      col * cellW,
      0,
      cellW,
      cellH,
      -drawW / 2,
      -height / 2,
      drawW,
      height
    );
  } else {
    ctx.fillStyle =
      kind === "blue" ? "#2563eb" : kind === "orange" ? "#f97316" : "#dc2626";
    ctx.beginPath();
    ctx.arc(0, 0, height * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draws the official Sky Team white wooden Airplane Traffic token
 * (cell 2 of sky-team-tokens.png).
 */
export function drawTrafficPlaneToken(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  angleRad = 0
): void {
  const atlas = getSkyTeamTokensImage();
  ctx.save();
  ctx.translate(cx, cy);
  if (angleRad !== 0) ctx.rotate(angleRad);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.shadowColor = "rgba(2, 6, 23, 0.7)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 1.5;

  if (atlas) {
    const cellW = atlas.naturalWidth / 3;
    ctx.drawImage(
      atlas,
      cellW * 2,
      0,
      cellW,
      atlas.naturalHeight,
      -size / 2,
      -size / 2,
      size,
      size
    );
  } else {
    drawMiniPlaneIcon(ctx, 0, 0, size * 0.04, "#ffffff", false);
  }
  ctx.restore();
}

const AIRPORTS_COLS = 13;
const AIRPORTS_HEADER_H_1X = 22;
const AIRPORTS_CELL_H_1X = 43.7;

/**
 * Draws the live sliding section of the official 2D Airport Approach Strip
 * inside the cockpit board's top-left Approach cutout window.
 */
export function drawAirportWindowSlice(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  stripIndex: number,
  totalSpaces: number,
  smoothPos: number,
  trafficCount: number,
  airportCode: string
): void {
  const img = getSkyTeamAirportsImage();
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  drawRoundedRect(ctx, x, y, w, h, 8);
  ctx.clip();

  if (img) {
    const scaleY = img.naturalHeight / 372;
    const colW = img.naturalWidth / AIRPORTS_COLS;
    const sx = stripIndex * colW + 2;
    const sw = colW - 4;
    const cellH = AIRPORTS_CELL_H_1X * scaleY;
    const headerH = AIRPORTS_HEADER_H_1X * scaleY;

    // Preserve exact aspect ratio of the strip (sw / sh === w / h) so zero distortion!
    const sh = sw * (h / w);
    const rowFromTop = Math.max(0, totalSpaces - 1 - smoothPos);
    const cellCenterY =
      rowFromTop < 0.05
        ? (headerH + cellH) * 0.5
        : headerH + (rowFromTop + 0.5) * cellH;
    const maxStripY = headerH + totalSpaces * cellH;
    const sy = Math.max(0, Math.min(maxStripY - sh, cellCenterY - sh / 2));

    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);

    // Light bottom gradient so live traffic icons pop crisply
    const grad = ctx.createLinearGradient(x, y + h * 0.5, x, y + h);
    grad.addColorStop(0, "rgba(2, 6, 23, 0)");
    grad.addColorStop(1, "rgba(2, 6, 23, 0.52)");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  } else {
    ctx.fillStyle = "#0c4a6e";
    ctx.fillRect(x, y, w, h);
  }

  // Live remaining traffic planes overlaid in the window (official white wooden airplane tokens!)
  if (trafficCount > 0) {
    const planeSize = Math.max(18, Math.min(30, h * 0.44));
    const sp = Math.min(planeSize * 1.05, (w - planeSize) / Math.max(1, trafficCount));
    const sx0 = x + w / 2 - ((trafficCount - 1) * sp) / 2;
    for (let t = 0; t < trafficCount; t++) {
      drawTrafficPlaneToken(ctx, sx0 + t * sp, y + h * 0.66, planeSize, -Math.PI / 2);
    }
  } else {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#4ade80";
    ctx.font = `900 ${Math.max(8.5, Math.round(w * 0.085))}px system-ui, sans-serif`;
    ctx.fillText(
      smoothPos >= totalSpaces - 1.05 ? `✓ ${airportCode} SẠCH` : "✓ SẠCH",
      x + w / 2,
      y + h * 0.8
    );
  }

  ctx.restore();
}

/**
 * Draws the complete vertical 2D Airport Approach Strip on the left flank at
 * its EXACT natural aspect ratio (no stretching!) with R1..R6 badges on the
 * left and live remaining traffic badges on the right.
 */
export function drawFullAirportStrip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  stripIndex: number,
  traffic: number[],
  approachPos: number
): void {
  const img = getSkyTeamAirportsImage();
  const totalSpaces = traffic.length;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  drawRoundedRect(ctx, x, y, w, h, 14);
  ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
  ctx.fill();
  ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const innerPad = 8;
  const maxH = h - innerPad * 2;
  const sideMargin = 32; // space on left for R1..R6 and right for traffic badges
  const maxW = Math.max(48, w - sideMargin * 2);

  // Exact natural dimensions of this strip in 1x pixels: width ~78.77, height = header + cells + footer
  const natW = 1024 / AIRPORTS_COLS - 2;
  const natH = AIRPORTS_HEADER_H_1X + totalSpaces * AIRPORTS_CELL_H_1X + 4;
  const natAspect = natW / natH;

  let drawH = maxH;
  let drawW = drawH * natAspect;
  if (drawW > maxW) {
    drawW = maxW;
    drawH = drawW / natAspect;
  }

  const dx = Math.round(x + (w - drawW) / 2);
  const dy = Math.round(y + (h - drawH) / 2);

  if (img) {
    const scaleY = img.naturalHeight / 372;
    const colW = img.naturalWidth / AIRPORTS_COLS;
    const sx = stripIndex * colW + 1;
    const sw = colW - 2;
    const sh = Math.min(img.naturalHeight, natH * scaleY);

    ctx.save();
    drawRoundedRect(ctx, dx, dy, drawW, drawH, 7);
    ctx.clip();
    ctx.drawImage(img, sx, 0, sw, sh, dx, dy, drawW, drawH);
    ctx.restore();
  }

  // Overlay crisp sector indicators aligned to exact strip cells
  const headerFrac = AIRPORTS_HEADER_H_1X / natH;
  const topOffset = dy + drawH * headerFrac;
  const cellsH = drawH * ((totalSpaces * AIRPORTS_CELL_H_1X) / natH);
  const rowH = cellsH / totalSpaces;

  for (let pos = 0; pos < totalSpaces; pos++) {
    const rowFromTop = totalSpaces - 1 - pos;
    const ry = topOffset + rowFromTop * rowH;
    const isCur = pos === approachPos;
    const rDist = pos - approachPos + 1;
    const planes = traffic[pos];

    if (isCur) {
      drawRoundedRect(ctx, dx - 1, ry + 0.5, drawW + 2, rowH - 1, 5);
      ctx.strokeStyle = "#fde047";
      ctx.lineWidth = 2.4;
      ctx.stroke();
      drawMiniPlaneIcon(ctx, dx + drawW / 2, ry + rowH / 2, 0.62, "#38bdf8", true);
    }

    // Radio distance tag (R1..R6) neatly in the left margin (not covering strip art!)
    if (rDist >= 1 && rDist <= 6) {
      const rx = Math.max(x + 4, dx - 26);
      drawRoundedRect(ctx, rx, ry + rowH / 2 - 7, 22, 14, 4);
      ctx.fillStyle = isCur ? "#fde047" : "rgba(30, 41, 59, 0.92)";
      ctx.fill();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isCur ? "#0f172a" : "#7dd3fc";
      ctx.font = "900 8.5px system-ui, sans-serif";
      ctx.fillText(`R${rDist}`, rx + 11, ry + rowH / 2);
    }

    // Live remaining planes overlaid on the strip + count badge neatly in the right margin
    const bxRight = Math.min(x + w - 28, dx + drawW + 4);
    if (planes > 0) {
      const pSize = Math.max(12, Math.min(18, rowH * 0.52));
      const pGap = Math.min(pSize * 0.85, (drawW - pSize) / Math.max(1, planes));
      const pStart = dx + drawW / 2 - ((planes - 1) * pGap) / 2;
      for (let t = 0; t < planes; t++) {
        drawTrafficPlaneToken(
          ctx,
          pStart + t * pGap,
          ry + rowH * 0.56,
          pSize,
          -Math.PI / 2
        );
      }

      drawRoundedRect(ctx, bxRight, ry + rowH / 2 - 7.5, 24, 15, 4);
      ctx.fillStyle = "rgba(127, 29, 29, 0.92)";
      ctx.fill();
      ctx.strokeStyle = "#f87171";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fecaca";
      ctx.font = "900 8.5px system-ui, sans-serif";
      ctx.fillText(`×${planes}`, bxRight + 12, ry + rowH / 2);
    } else if (pos >= approachPos) {
      drawRoundedRect(ctx, bxRight + 4, ry + rowH / 2 - 6.5, 15, 13, 4);
      ctx.fillStyle = "rgba(20, 83, 45, 0.9)";
      ctx.fill();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#4ade80";
      ctx.font = "900 8.5px system-ui, sans-serif";
      ctx.fillText("✓", bxRight + 11.5, ry + rowH / 2);
    }
  }

  ctx.restore();
}

const ALT_HEADER_FRAC = 36 / 720;
const ALT_CELL_FRAC = 94.3 / 720;

/**
 * Draws the live sliding section of the official 2D Altitude Strip inside
 * the cockpit board's top-right Altitude cutout window at exact aspect ratio.
 */
export function drawAltitudeWindowSlice(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  altitude: number,
  hardMode: boolean
): void {
  const img = getSkyTeamAltitudeImage();
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  drawRoundedRect(ctx, x, y, w, h, 8);
  ctx.clip();

  if (img) {
    const colW = img.naturalWidth / 2;
    const sx = (hardMode ? 1 : 0) * colW + 2;
    const sw = colW - 4;
    // Exact aspect ratio match so zero distortion
    const sh = sw * (h / w);
    // altitude 0 = row 0 (top Landing box), altitude 6 = row 6 (bottom 6000 box)
    const rowIdx = Math.max(0, Math.min(6, altitude));
    const cellCenterY =
      (ALT_HEADER_FRAC + (rowIdx + 0.5) * ALT_CELL_FRAC) * img.naturalHeight;
    const sy = Math.max(
      0,
      Math.min(img.naturalHeight - sh, cellCenterY - sh / 2)
    );

    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  } else {
    ctx.fillStyle = altitude === 0 ? "#14532d" : "#0369a1";
    ctx.fillRect(x, y, w, h);
  }

  ctx.restore();
}

/**
 * Draws the complete vertical 2D Altitude Strip on the right flank at its
 * EXACT natural aspect ratio with a golden highlight frame on the current altitude.
 */
export function drawFullAltitudeStrip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  altitude: number,
  hardMode: boolean
): void {
  const img = getSkyTeamAltitudeImage();
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  drawRoundedRect(ctx, x, y, w, h, 14);
  ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
  ctx.fill();
  ctx.strokeStyle = "rgba(251, 146, 60, 0.5)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const pad = 8;
  const maxH = h - pad * 2;
  const maxW = w - pad * 2;
  const natAspect = 173 / 720;

  let drawH = maxH;
  let drawW = drawH * natAspect;
  if (drawW > maxW) {
    drawW = maxW;
    drawH = drawW / natAspect;
  }

  const dx = Math.round(x + (w - drawW) / 2);
  const dy = Math.round(y + (h - drawH) / 2);

  if (img) {
    const colW = img.naturalWidth / 2;
    const sx = (hardMode ? 1 : 0) * colW + 1;
    const sw = colW - 2;
    ctx.save();
    drawRoundedRect(ctx, dx, dy, drawW, drawH, 8);
    ctx.clip();
    ctx.drawImage(img, sx, 0, sw, img.naturalHeight, dx, dy, drawW, drawH);
    ctx.restore();
  }

  // Highlight active altitude box with crisp glowing gold frame
  const rowIdx = Math.max(0, Math.min(6, altitude));
  const ry = dy + drawH * (ALT_HEADER_FRAC + rowIdx * ALT_CELL_FRAC);
  const rh = drawH * ALT_CELL_FRAC;
  drawRoundedRect(ctx, dx - 2, ry + 1, drawW + 4, rh - 2, 6);
  ctx.strokeStyle = altitude === 0 ? "#4ade80" : "#fde047";
  ctx.lineWidth = 2.6;
  ctx.stroke();

  // Small active pointer arrow on the left of the active altitude
  ctx.fillStyle = altitude === 0 ? "#4ade80" : "#fde047";
  ctx.beginPath();
  ctx.moveTo(dx - 5, ry + rh / 2);
  ctx.lineTo(dx - 13, ry + rh / 2 - 5);
  ctx.lineTo(dx - 13, ry + rh / 2 + 5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Draws the official Sky Team Wind Module (sky-team-wind.png) with an inner
 * rotating aircraft compass pointing to the active wind segment (0..19 -> +3..-3).
 */
export function drawWindModuleWidget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  windIndex: number,
  windModifier: number
): void {
  const windImg = getSkyTeamWindImage();
  const planeDiscImg = getSkyTeamWindPlaneImage();
  const cx = x + size * 0.505;
  const cy = y + size * 0.495;
  const innerR = size * 0.335;
  const angleRad = ((windIndex * 18) * Math.PI) / 180;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // 1. Official rotating inner blue Airplane Compass Disc inside the Wind Module hole!
  // Raw sprite nose points DOWN (6 o'clock), so rotate by PI + angleRad so nose points UP (+3 Tailwind) at index 0.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, innerR + 1, 0, Math.PI * 2);
  ctx.clip();
  if (planeDiscImg) {
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI + angleRad);
    const discSize = innerR * 2.06;
    ctx.drawImage(
      planeDiscImg,
      -discSize / 2,
      -discSize / 2,
      discSize,
      discSize
    );
  } else {
    ctx.fillStyle = "#1d4ed8";
    ctx.fillRect(cx - innerR, cy - innerR, innerR * 2, innerR * 2);
  }
  ctx.restore();

  // 2. Official Wind Module outer ring sprite on top (cleanly frames the rotating plane disc!)
  ctx.save();
  ctx.shadowColor = "rgba(2, 6, 23, 0.55)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  if (windImg) {
    ctx.drawImage(windImg, x, y, size, size);
  } else {
    drawRoundedRect(ctx, x, y, size, size, 12);
    ctx.fillStyle = "#64748b";
    ctx.fill();
  }
  ctx.restore();

  // 3. Crisp glowing pointer triangle at the nose pointing to the active wind notch
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angleRad);
  ctx.fillStyle =
    windModifier > 0 ? "#fb923c" : windModifier < 0 ? "#38bdf8" : "#ffffff";
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -innerR + 1);
  ctx.lineTo(-5, -innerR + 10);
  ctx.lineTo(5, -innerR + 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 4. Compact wind modifier badge (+3, +2, 0, -2, -3)
  const label = windModifier > 0 ? `+${windModifier}` : String(windModifier);
  drawRoundedRect(ctx, cx - 18, cy + innerR - 13, 36, 15, 5);
  ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
  ctx.fill();
  ctx.strokeStyle =
    windModifier > 0 ? "#fb923c" : windModifier < 0 ? "#38bdf8" : "#94a3b8";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle =
    windModifier > 0 ? "#fdba74" : windModifier < 0 ? "#7dd3fc" : "#e2e8f0";
  ctx.font = "900 9.5px system-ui, sans-serif";
  ctx.fillText(label, cx, cy + innerR - 5.5);

  ctx.restore();
}

/**
 * Draws the official Sky Team Intern Module bar (sky-team-intern.png) clipped
 * right below the bottom edge of the cockpit board, showing 6 green checkmark
 * slots (covered by dark numbered tiles until trained) and returning the exact
 * rects for the Pilot (left) and Co-pilot (right) Intern dice slots.
 */
export function drawInternModuleBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  internTrained: boolean[]
): {
  pilotSlot: { x: number; y: number; size: number };
  copilotSlot: { x: number; y: number; size: number };
} {
  const img = getSkyTeamInternImage();

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.shadowColor = "rgba(2, 6, 23, 0.55)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;

  if (img) {
    ctx.drawImage(img, x, y, w, h);
  } else {
    drawRoundedRect(ctx, x, y, w, h, 8);
    ctx.fillStyle = "#64748b";
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Cover untrained green checkmarks with the official 1..6 green lanyard Intern badges!
  const badgesImg = getSkyTeamInternBadgesImage();
  const markerImg = getSkyTeamInternMarkerImage();
  const checkPositionsX = [0.202, 0.324, 0.445, 0.557, 0.678, 0.799];
  const checkW = w * 0.082;
  const checkH = h * 0.84;
  const checkY = y + h * 0.06;

  for (let i = 0; i < 6; i++) {
    const trained = Boolean(internTrained[i]);
    if (!trained) {
      const cx = x + checkPositionsX[i] * w;
      if (badgesImg) {
        const cellW = badgesImg.naturalWidth / 6;
        const cellH = badgesImg.naturalHeight;
        const drawH = checkH;
        const drawW = drawH * (cellW / cellH);
        ctx.save();
        ctx.shadowColor = "rgba(2, 6, 23, 0.5)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 1.5;
        ctx.drawImage(
          badgesImg,
          i * cellW,
          0,
          cellW,
          cellH,
          cx - drawW / 2,
          checkY,
          drawW,
          drawH
        );
        ctx.restore();
      } else if (markerImg) {
        const natAspect = markerImg.naturalWidth / markerImg.naturalHeight;
        const drawH = checkH;
        const drawW = Math.min(checkW * 1.15, drawH * natAspect);
        ctx.drawImage(markerImg, cx - drawW / 2, checkY, drawW, drawH);
      } else {
        drawRoundedRect(ctx, cx - checkW / 2, checkY + h * 0.09, checkW, h * 0.66, 4);
        ctx.fillStyle = "#84cc16";
        ctx.fill();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#1e293b";
        ctx.font = `900 ${Math.max(9, Math.round(checkH * 0.38))}px system-ui, sans-serif`;
        ctx.fillText(String(i + 1), cx, checkY + h * 0.42);
      }
    }
  }

  ctx.restore();

  const slotSize = Math.min(h * 0.72, w * 0.1);
  return {
    pilotSlot: {
      x: x + w * 0.077 - slotSize / 2,
      y: y + h * 0.5 - slotSize / 2,
      size: slotSize,
    },
    copilotSlot: {
      x: x + w * 0.923 - slotSize / 2,
      y: y + h * 0.5 - slotSize / 2,
      size: slotSize,
    },
  };
}

/**
 * Draws the official Sky Team Kerosene (Fuel Leak) vertical module strip
 * (sky-team-fuel.png) clipped to the left edge of the cockpit board, with a
 * glowing horizontal marker indicating current fuel (20..0) and returning
 * the interactive rect for the top '-6' fuel_leak dice slot.
 */
export function drawFuelModuleStrip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fuelLevel: number
): { fuelSlot: { x: number; y: number; size: number } } {
  const img = getSkyTeamFuelImage();

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.shadowColor = "rgba(2, 6, 23, 0.55)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;

  if (img) {
    ctx.drawImage(img, x, y, w, h);
  } else {
    drawRoundedRect(ctx, x, y, w, h, 8);
    ctx.fillStyle = "#64748b";
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Draw the official white '◄' sliding Fuel Marker pointing left at the current fuel number (20..0..X)
  const clamped = Math.max(-1, Math.min(20, fuelLevel));
  const t = (20 - clamped) / 21; // 0 = 20, ~0.95 = 0, 1.0 = red X
  const markerY = y + h * (0.205 + t * 0.705);
  const fuelMarkerImg = getSkyTeamFuelMarkerImage();

  if (fuelMarkerImg) {
    const natAspect = fuelMarkerImg.naturalWidth / fuelMarkerImg.naturalHeight;
    const drawW = w * 0.36;
    const drawH = drawW / natAspect;
    const drawX = x + w * 0.44;
    ctx.save();
    ctx.shadowColor = "rgba(2, 6, 23, 0.55)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 1.5;
    ctx.drawImage(fuelMarkerImg, drawX, markerY - drawH / 2, drawW, drawH);
    ctx.restore();
  } else {
    const markerH = Math.max(6, h * 0.022);
    drawRoundedRect(ctx, x + w * 0.42, markerY - markerH / 2, w * 0.42, markerH, 3);
    ctx.fillStyle = "#f1f5f9";
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = "#0f172a";
    ctx.stroke();
  }

  ctx.restore();

  const slotSize = Math.min(w * 0.56, h * 0.11);
  return {
    fuelSlot: {
      x: x + w * 0.505 - slotSize / 2,
      y: y + h * 0.088 - slotSize / 2,
      size: slotSize,
    },
  };
}
