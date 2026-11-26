import {
  ALL_ONUW_ROLE_IDS,
  ONUW_FACTION_META,
  ONUW_ROLE_META,
  type OnuwRoleId,
  type OnuwStep,
} from "@/cartridges/one-night-werewolf";

/** Single 13-cell (1560x170) retro 2D ink/pixel sprite sheet: 12 roles + 1 card back */
const SHEET_CELL_W = 120;
const SHEET_CELL_H = 170;
const CARD_BACK_CELL_INDEX = 12;

let cardSheetImg: HTMLImageElement | null = null;

function getOnuwCardSheet(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!cardSheetImg) {
    cardSheetImg = new Image();
    cardSheetImg.src = "/sprites/onuw-cards-pixel.png";
  }
  return cardSheetImg.complete && cardSheetImg.naturalWidth > 0
    ? cardSheetImg
    : null;
}

function getRoleCellIndex(roleId: OnuwRoleId): number {
  const idx = ALL_ONUW_ROLE_IDS.indexOf(roleId);
  return idx >= 0 ? idx : 0;
}

export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Atmospheric Moonlit / Dawn / Blood-Vote background for ONUW Canvas */
export function drawOnuwBackdrop2D(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  step: OnuwStep | "Lobby",
  timeSec: number
): void {
  const grad = ctx.createRadialGradient(
    w * 0.5,
    h * 0.35,
    Math.min(w, h) * 0.05,
    w * 0.5,
    h * 0.5,
    Math.max(w, h) * 0.85
  );

  if (step === "DayDiscussionStep") {
    grad.addColorStop(0, "#3b2218");
    grad.addColorStop(0.45, "#1f1626");
    grad.addColorStop(1, "#0b0f1c");
  } else if (step === "DayVotingStep") {
    grad.addColorStop(0, "#3f1019");
    grad.addColorStop(0.5, "#1c0d1b");
    grad.addColorStop(1, "#080912");
  } else if (step === "MatchOver") {
    grad.addColorStop(0, "#2b1d3d");
    grad.addColorStop(0.5, "#151329");
    grad.addColorStop(1, "#070914");
  } else {
    // Lobby / RoleReveal / NightStep
    grad.addColorStop(0, "#1c1f45");
    grad.addColorStop(0.5, "#0f1229");
    grad.addColorStop(1, "#050712");
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle twinkling stars
  ctx.save();
  for (let i = 0; i < 42; i++) {
    const sx = ((i * 197.3 + 53) % 1000) / 1000 * w;
    const sy = ((i * 113.7 + 29) % 1000) / 1000 * h * 0.65;
    const twinkle = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(timeSec * 1.4 + i * 1.9));
    ctx.fillStyle = `rgba(226, 232, 240, ${twinkle.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(sx, sy, (i % 3 === 0 ? 1.8 : 1.1), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Glowing moon in upper backdrop
  const moonX = w * 0.84;
  const moonY = h * 0.16;
  const moonR = Math.min(w, h) * 0.075;
  ctx.save();
  const moonGlow = ctx.createRadialGradient(
    moonX,
    moonY,
    moonR * 0.2,
    moonX,
    moonY,
    moonR * 3.1
  );
  if (step === "DayVotingStep") {
    moonGlow.addColorStop(0, "rgba(248, 113, 113, 0.35)");
    moonGlow.addColorStop(1, "rgba(248, 113, 113, 0)");
  } else if (step === "DayDiscussionStep") {
    moonGlow.addColorStop(0, "rgba(251, 191, 36, 0.32)");
    moonGlow.addColorStop(1, "rgba(251, 191, 36, 0)");
  } else {
    moonGlow.addColorStop(0, "rgba(253, 224, 71, 0.28)");
    moonGlow.addColorStop(1, "rgba(129, 140, 248, 0)");
  }
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonR * 3.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle =
    step === "DayVotingStep"
      ? "#fca5a5"
      : step === "DayDiscussionStep"
        ? "#fde68a"
        : "#fef3c7";
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Wooden medieval round table in the center of the village circle */
export function drawOnuwTable2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  step: OnuwStep | "Lobby",
  timeSec: number
): void {
  ctx.save();
  // Soft drop shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 10;

  const woodGrad = ctx.createRadialGradient(
    cx - radius * 0.2,
    cy - radius * 0.2,
    radius * 0.1,
    cx,
    cy,
    radius
  );
  woodGrad.addColorStop(0, "#3b2419");
  woodGrad.addColorStop(0.65, "#261610");
  woodGrad.addColorStop(1, "#160d0a");

  ctx.fillStyle = woodGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Outer brass rim
  ctx.save();
  ctx.strokeStyle =
    step === "DayVotingStep"
      ? "rgba(248, 113, 113, 0.55)"
      : step === "DayDiscussionStep"
        ? "rgba(251, 191, 36, 0.5)"
        : "rgba(148, 163, 184, 0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Inner mystic dashed ring
  ctx.strokeStyle = "rgba(251, 191, 36, 0.18)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.arc(
    cx,
    cy,
    radius * 0.86,
    timeSec * 0.06,
    timeSec * 0.06 + Math.PI * 2
  );
  ctx.stroke();
  ctx.restore();
}

/** Draw an ornate face-down ONUW card */
export function drawOnuwCardBack2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  options?: {
    highlighted?: boolean;
    selected?: boolean;
    hovered?: boolean;
    timeSec?: number;
  }
): void {
  const pulse = options?.timeSec
    ? 0.5 + 0.5 * Math.sin(options.timeSec * 5)
    : 0.5;

  const sheet = getOnuwCardSheet();

  ctx.save();
  if (options?.selected) {
    ctx.shadowColor = "rgba(250, 204, 21, 0.85)";
    ctx.shadowBlur = 18;
  } else if (options?.highlighted) {
    ctx.shadowColor = `rgba(56, 189, 248, ${(0.45 + 0.35 * pulse).toFixed(2)})`;
    ctx.shadowBlur = 14;
  } else {
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
  }

  roundRectPath(ctx, x, y, w, h, 9);
  if (sheet) {
    ctx.save();
    ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      sheet,
      CARD_BACK_CELL_INDEX * SHEET_CELL_W,
      0,
      SHEET_CELL_W,
      SHEET_CELL_H,
      x,
      y,
      w,
      h
    );
    ctx.restore();
  } else {
    const bg = ctx.createLinearGradient(x, y, x + w, y + h);
    bg.addColorStop(0, "#1e1b4b");
    bg.addColorStop(0.5, "#312e81");
    bg.addColorStop(1, "#0f172a");
    ctx.fillStyle = bg;
    ctx.fill();
  }

  ctx.lineWidth = options?.selected ? 3 : options?.highlighted ? 2.4 : 1.5;
  ctx.strokeStyle = options?.selected
    ? "#facc15"
    : options?.highlighted
      ? options?.hovered
        ? "#7dd3fc"
        : "#38bdf8"
      : "rgba(212, 175, 95, 0.55)";
  ctx.stroke();
  ctx.restore();

  if (sheet) {
    // Subtle pill label at bottom of card back (e.g. "Giữa #1" or "#2")
    ctx.save();
    const lw = Math.min(w - 8, 52);
    const lh = 14;
    roundRectPath(ctx, x + (w - lw) / 2, y + h - lh - 4, lw, lh, 5);
    ctx.fillStyle = "rgba(10, 12, 18, 0.82)";
    ctx.fill();
    ctx.fillStyle = "#fde68a";
    ctx.font = `800 ${Math.max(8, Math.round(w * 0.14))}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + w / 2, y + h - lh / 2 - 4);
    ctx.restore();
    return;
  }

  // Inner filigree frame
  ctx.save();
  roundRectPath(ctx, x + 5, y + 5, w - 10, h - 10, 6);
  ctx.strokeStyle = "rgba(251, 191, 36, 0.28)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Crescent moon emblem
  ctx.fillStyle = "rgba(253, 224, 71, 0.85)";
  ctx.font = `700 ${Math.max(14, Math.round(w * 0.36))}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🌙", x + w / 2, y + h * 0.42);

  // Label
  ctx.fillStyle = "#e2e8f0";
  ctx.font = `700 ${Math.max(9, Math.round(w * 0.16))}px system-ui, sans-serif`;
  ctx.fillText(label, x + w / 2, y + h * 0.78);
  ctx.restore();
}

/** Draw a face-up ONUW role card */
export function drawOnuwRoleCard2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  roleId: OnuwRoleId,
  options?: {
    highlighted?: boolean;
    selected?: boolean;
    badge?: string;
    dimmed?: boolean;
  }
): void {
  const meta = ONUW_ROLE_META[roleId];
  const factionMeta = ONUW_FACTION_META[meta.faction];

  const sheet = getOnuwCardSheet();

  ctx.save();
  if (options?.dimmed) ctx.globalAlpha = 0.65;
  if (options?.selected) {
    ctx.shadowColor = "rgba(250, 204, 21, 0.9)";
    ctx.shadowBlur = 18;
  } else if (options?.highlighted) {
    ctx.shadowColor = meta.accent;
    ctx.shadowBlur = 14;
  } else {
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
  }

  roundRectPath(ctx, x, y, w, h, 9);
  if (sheet) {
    ctx.save();
    ctx.clip();
    ctx.imageSmoothingEnabled = false;
    const cellIdx = getRoleCellIndex(roleId);
    ctx.drawImage(
      sheet,
      cellIdx * SHEET_CELL_W,
      0,
      SHEET_CELL_W,
      SHEET_CELL_H,
      x,
      y,
      w,
      h
    );

    // Top subtle vignette + bold Vietnamese title styled like official ONUW cards (no English text)
    const topGrad = ctx.createLinearGradient(x, y, x, y + h * 0.28);
    topGrad.addColorStop(0, "rgba(0, 0, 0, 0.72)");
    topGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = topGrad;
    ctx.fillRect(x, y, w, h * 0.28);

    const fontSize = Math.max(8, Math.round(w * 0.145));
    ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.lineWidth = Math.max(2.5, fontSize * 0.25);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.92)";
    ctx.lineJoin = "round";
    const titleVi = meta.nameVi.toUpperCase();
    ctx.strokeText(titleVi, x + w / 2, y + 4, w - 6);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(titleVi, x + w / 2, y + 4, w - 6);
    ctx.restore();
  } else {
    const bg = ctx.createLinearGradient(x, y, x, y + h);
    bg.addColorStop(0, meta.bgColor);
    bg.addColorStop(1, "#090d18");
    ctx.fillStyle = bg;
    ctx.fill();
  }

  ctx.lineWidth = options?.selected ? 3 : 2;
  ctx.strokeStyle = options?.selected ? "#facc15" : meta.accent;
  ctx.stroke();
  ctx.restore();

  if (sheet) {
    if (options?.badge) {
      ctx.save();
      const bw = Math.min(w - 6, 62);
      const bh = 15;
      roundRectPath(ctx, x + w - bw - 3, y - 7, bw, bh, 6);
      ctx.fillStyle = "#f59e0b";
      ctx.fill();
      ctx.fillStyle = "#0f172a";
      ctx.font = "800 9px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(options.badge, x + w - bw / 2 - 3, y + 0.5);
      ctx.restore();
    }
    return;
  }

  // Top faction strip
  ctx.save();
  roundRectPath(ctx, x + 4, y + 4, w - 8, Math.max(14, h * 0.17), 5);
  ctx.fillStyle = factionMeta.bg;
  ctx.fill();

  ctx.fillStyle = factionMeta.accent;
  ctx.font = `800 ${Math.max(8, Math.round(w * 0.12))}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    meta.faction === "werewolf"
      ? "MA SÓI"
      : meta.faction === "tanner"
        ? "ĐỘC LẬP"
        : "DÂN LÀNG",
    x + w / 2,
    y + 4 + Math.max(14, h * 0.17) / 2
  );

  // Center icon
  ctx.font = `${Math.max(18, Math.round(w * 0.42))}px system-ui, sans-serif`;
  ctx.fillText(meta.icon, x + w / 2, y + h * 0.5);

  // Vietnamese role name (fully localized, no English subtitle)
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${Math.max(9, Math.round(w * 0.15))}px system-ui, sans-serif`;
  ctx.fillText(meta.nameVi.toUpperCase(), x + w / 2, y + h * 0.81, w - 8);

  if (options?.badge) {
    const bw = Math.min(w - 6, 62);
    const bh = 15;
    roundRectPath(ctx, x + w - bw - 3, y - 7, bw, bh, 6);
    ctx.fillStyle = "#f59e0b";
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.font = "800 9px system-ui, sans-serif";
    ctx.fillText(options.badge, x + w - bw / 2 - 3, y + 0.5);
  }
  ctx.restore();
}

/** Draw a curved voting arrow between two points on Canvas */
export function drawVoteArrow2D(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  dashed = false
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 10) return;

  const ux = dx / dist;
  const uy = dy / dist;
  const startX = x1 + ux * 36;
  const startY = y1 + uy * 36;
  const endX = x2 - ux * 42;
  const endY = y2 - uy * 42;

  // Slight curve toward center
  const midX = (startX + endX) / 2 - uy * 18;
  const midY = (startY + endY) / 2 + ux * 18;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.6;
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(midX, midY, endX, endY);
  ctx.stroke();

  // Arrowhead
  const angle = Math.atan2(endY - midY, endX - midX);
  const headLen = 11;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLen * Math.cos(angle - Math.PI / 6),
    endY - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    endX - headLen * Math.cos(angle + Math.PI / 6),
    endY - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
