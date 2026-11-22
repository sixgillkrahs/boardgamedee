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
 * Draws the detailed 2D illustration for the Coup "Duke" card matching the reference artwork:
 * - Blue-grey sky + ornate white baroque throne arch with 7 diamond-tipped spikes
 * - Top-right neon magenta star-in-ring emblem (outer 5-point star + ring + inner 5-point star)
 * - Shaved head with black crown tuft, hammered golden forehead medallion pendant, calculating eyes & soul patch
 * - Massive ribbed plum-magenta torus neck collar
 * - Segmented indigo-violet shoulder pauldrons with golden fringe epaulettes & brocade purple robe
 * - Bottom-left futuristic hot-pink cyber-chevron HUD glyph + "Duke" + "Take 3 coins / Blocks Foreign Aid"
 */
export function drawDukeCard2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  ctx.translate(x, y);

  // 1. Atmospheric Slate-Blue Sky / Wall Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, "#75879e");
  skyGrad.addColorStop(0.55, "#63687a");
  skyGrad.addColorStop(1, "#1e0b24");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  const cx = w * 0.48;
  const headCy = h * 0.35;

  // 2. Ornate White/Ivory Baroque Throne Back & Halo Arch with 7 Diamond Spikes
  ctx.save();
  // Left & Right carved ivory throne wings
  const wingGrad = ctx.createLinearGradient(0, h * 0.2, w, h * 0.8);
  wingGrad.addColorStop(0, "#f5f0e6");
  wingGrad.addColorStop(0.5, "#e2d9c8");
  wingGrad.addColorStop(1, "#b8ad99");
  ctx.fillStyle = wingGrad;
  ctx.strokeStyle = "#8c8270";
  ctx.lineWidth = Math.max(0.8, w * 0.01);

  // Left baroque wing
  ctx.beginPath();
  ctx.moveTo(0, h * 0.27);
  ctx.quadraticCurveTo(w * 0.14, h * 0.32, w * 0.18, h * 0.48);
  ctx.lineTo(w * 0.12, h * 0.68);
  ctx.lineTo(0, h * 0.68);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right baroque wing
  ctx.beginPath();
  ctx.moveTo(w, h * 0.18);
  ctx.quadraticCurveTo(w * 0.82, h * 0.25, w * 0.78, h * 0.48);
  ctx.lineTo(w * 0.86, h * 0.75);
  ctx.lineTo(w, h * 0.75);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Baroque scrollwork curls inside the throne wings
  ctx.strokeStyle = "rgba(120, 108, 92, 0.55)";
  ctx.lineWidth = Math.max(0.8, w * 0.012);
  for (const [sx, sy, sr] of [
    [0.08, 0.42, 0.045],
    [0.07, 0.53, 0.04],
    [0.9, 0.36, 0.05],
    [0.91, 0.49, 0.048],
    [0.9, 0.62, 0.042],
  ] as const) {
    ctx.beginPath();
    ctx.arc(w * sx, h * sy, w * sr, 0, Math.PI * 1.65);
    ctx.stroke();
  }

  // Filigree Arch behind the Duke's head
  const archR = w * 0.34;
  const archCy = h * 0.31;
  ctx.strokeStyle = "#ebe4d8";
  ctx.lineWidth = Math.max(1.5, w * 0.026);
  ctx.beginPath();
  ctx.arc(cx, archCy, archR, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();

  // 7 Radiating Diamond-Tipped Finial Spikes along the top of the Throne Arch
  ctx.fillStyle = "#f5f0e6";
  ctx.strokeStyle = "#948a78";
  ctx.lineWidth = Math.max(0.6, w * 0.008);
  for (let i = 0; i < 7; i++) {
    const ang = Math.PI * (1.14 + (i / 6) * 0.72);
    const baseR = archR + w * 0.01;
    const midR = archR + w * 0.065;
    const tipR = archR + w * 0.135;
    const perp = ang + Math.PI / 2;
    const halfW = w * 0.022;

    const bx = cx + Math.cos(ang) * baseR;
    const by = archCy + Math.sin(ang) * baseR;
    const mx = cx + Math.cos(ang) * midR;
    const my = archCy + Math.sin(ang) * midR;
    const tx = cx + Math.cos(ang) * tipR;
    const ty = archCy + Math.sin(ang) * tipR;

    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(mx + Math.cos(perp) * halfW, my + Math.sin(perp) * halfW);
    ctx.lineTo(tx, ty);
    ctx.lineTo(mx - Math.cos(perp) * halfW, my - Math.sin(perp) * halfW);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // 3. Top-Right Hot-Pink / Neon Magenta Star-in-Ring Emblem
  const drawFivePointStar = (
    sx: number,
    sy: number,
    outerR: number,
    innerR: number
  ) => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      const px = sx + Math.cos(ang) * r;
      const py = sy + Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  };

  ctx.save();
  const starCx = w * 0.75;
  const starCy = h * 0.165;
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = Math.max(2, w * 0.03);

  // Outer magenta ring
  ctx.strokeStyle = "#ec1c8c";
  ctx.lineWidth = Math.max(1.5, w * 0.028);
  ctx.beginPath();
  ctx.arc(starCx, starCy, w * 0.095, 0, Math.PI * 2);
  ctx.stroke();

  // Outer 5-point star with circular cutout
  ctx.fillStyle = "#ec1c8c";
  drawFivePointStar(starCx, starCy, w * 0.145, w * 0.058);
  ctx.fill();

  // Inner circle cutout + smaller inner 5-point magenta star
  ctx.fillStyle = "#6c788a";
  ctx.beginPath();
  ctx.arc(starCx, starCy, w * 0.048, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ec1c8c";
  drawFivePointStar(starCx, starCy, w * 0.044, w * 0.018);
  ctx.fill();
  ctx.restore();

  // 4. Lower Robe, Indigo-Violet Segmented Pauldrons & Golden Fringe Epaulettes
  ctx.save();
  // Main purple-magenta brocade robe body
  const robeGrad = ctx.createLinearGradient(0, h * 0.52, 0, h);
  robeGrad.addColorStop(0, "#7b286d");
  robeGrad.addColorStop(0.5, "#4c1349");
  robeGrad.addColorStop(1, "#17051a");
  ctx.fillStyle = robeGrad;
  ctx.beginPath();
  ctx.moveTo(-w * 0.05, h);
  ctx.lineTo(w * 0.04, h * 0.58);
  ctx.quadraticCurveTo(cx, h * 0.5, w * 0.96, h * 0.58);
  ctx.lineTo(w * 1.05, h);
  ctx.closePath();
  ctx.fill();

  // Center golden-olive vest placket & dark navy-slate vertical lapels
  ctx.fillStyle = "#6e562c";
  ctx.fillRect(cx - w * 0.045, h * 0.62, w * 0.09, h * 0.38);

  ctx.fillStyle = "#25213d";
  ctx.fillRect(cx - w * 0.09, h * 0.62, w * 0.045, h * 0.38);
  ctx.fillRect(cx + w * 0.045, h * 0.62, w * 0.045, h * 0.38);

  // Delicate brocade floral motifs on the purple robe
  ctx.strokeStyle = "rgba(192, 132, 252, 0.26)";
  ctx.lineWidth = Math.max(0.7, w * 0.008);
  for (const [fx, fy] of [
    [0.32, 0.71],
    [0.36, 0.81],
    [0.63, 0.7],
    [0.66, 0.82],
  ] as const) {
    ctx.beginPath();
    ctx.arc(w * fx, h * fy, w * 0.032, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Golden Bullion Fringe Epaulettes under both shoulders
  for (const side of [-1, 1]) {
    const shX = cx + side * w * 0.38;
    const shY = h * 0.6;
    ctx.strokeStyle = "#eab308";
    ctx.lineWidth = Math.max(1.2, w * 0.018);
    for (let f = 0; f < 6; f++) {
      const tx = shX + side * (f - 2.5) * w * 0.032;
      const ty = shY + f * h * 0.008;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - side * w * 0.015, ty + h * 0.065);
      ctx.stroke();
    }

    // Segmented Indigo-Violet Armored Pauldron on each shoulder
    ctx.save();
    ctx.translate(shX, shY - h * 0.03);
    ctx.rotate(side * 0.42);
    const pauldronGrad = ctx.createRadialGradient(
      -w * 0.02,
      -h * 0.02,
      w * 0.01,
      0,
      0,
      w * 0.16
    );
    pauldronGrad.addColorStop(0, "#7c73c9");
    pauldronGrad.addColorStop(0.6, "#433a82");
    pauldronGrad.addColorStop(1, "#1e1a42");
    ctx.fillStyle = pauldronGrad;
    ctx.strokeStyle = "#171336";
    ctx.lineWidth = Math.max(1, w * 0.012);
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.155, h * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Segment lines across pauldron
    ctx.beginPath();
    ctx.moveTo(-w * 0.05, -h * 0.05);
    ctx.quadraticCurveTo(-w * 0.03, 0, -w * 0.05, h * 0.05);
    ctx.moveTo(w * 0.05, -h * 0.05);
    ctx.quadraticCurveTo(w * 0.03, 0, w * 0.05, h * 0.05);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // 5. Massive Padded Ribbed Plum-Magenta Torus Collar wrapping the Neck
  ctx.save();
  const collarCy = h * 0.47;
  const collarGrad = ctx.createRadialGradient(
    cx - w * 0.08,
    collarCy,
    w * 0.05,
    cx,
    collarCy,
    w * 0.34
  );
  collarGrad.addColorStop(0, "#a2387d");
  collarGrad.addColorStop(0.55, "#631d53");
  collarGrad.addColorStop(1, "#2a0926");
  ctx.fillStyle = collarGrad;
  ctx.strokeStyle = "#230720";
  ctx.lineWidth = Math.max(1, w * 0.014);

  // Outer collar torus
  ctx.beginPath();
  ctx.ellipse(cx, collarCy, w * 0.31, h * 0.165, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner overlapping collar fold under chin
  ctx.beginPath();
  ctx.ellipse(cx, collarCy - h * 0.01, w * 0.24, h * 0.115, 0, 0, Math.PI);
  ctx.stroke();

  // Radial pinkish-lavender woven stripe ribs around the padded collar
  ctx.strokeStyle = "rgba(216, 114, 178, 0.35)";
  ctx.lineWidth = Math.max(1.5, w * 0.025);
  for (let a = 0.15; a <= 0.85; a += 0.14) {
    const ang = a * Math.PI;
    ctx.beginPath();
    ctx.moveTo(
      cx + Math.cos(ang) * w * 0.18,
      collarCy + Math.sin(ang) * h * 0.08
    );
    ctx.lineTo(
      cx + Math.cos(ang) * w * 0.3,
      collarCy + Math.sin(ang) * h * 0.16
    );
    ctx.stroke();
  }
  ctx.restore();

  // 6. The Duke's Head, Shaved Cranium + Black Hair Tuft, Golden Forehead Medallion & Face
  ctx.save();
  // Ears
  ctx.fillStyle = "#d6a984";
  ctx.strokeStyle = "#7c5538";
  ctx.lineWidth = Math.max(0.8, w * 0.01);
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(
      cx + dir * w * 0.195,
      headCy + h * 0.01,
      w * 0.028,
      h * 0.042,
      dir * -0.18,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();
  }

  // Head & Cranium shape (lit from left, warm shadow on right)
  const skinGrad = ctx.createRadialGradient(
    cx - w * 0.07,
    headCy - h * 0.02,
    w * 0.02,
    cx,
    headCy,
    w * 0.23
  );
  skinGrad.addColorStop(0, "#fff5eb");
  skinGrad.addColorStop(0.55, "#e7be9a");
  skinGrad.addColorStop(1, "#9c704f");
  ctx.fillStyle = skinGrad;
  ctx.strokeStyle = "#5c3d28";
  ctx.lineWidth = Math.max(0.9, w * 0.01);

  ctx.beginPath();
  ctx.ellipse(cx, headCy, w * 0.19, h * 0.135, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Shaved side-scalp bluish-grey stubble tint
  const scalpGrad = ctx.createLinearGradient(
    cx - w * 0.18,
    headCy - h * 0.12,
    cx + w * 0.18,
    headCy - h * 0.03
  );
  scalpGrad.addColorStop(0, "rgba(148, 163, 184, 0.45)");
  scalpGrad.addColorStop(0.5, "rgba(148, 163, 184, 0)");
  scalpGrad.addColorStop(1, "rgba(71, 85, 105, 0.35)");
  ctx.fillStyle = scalpGrad;
  ctx.beginPath();
  ctx.ellipse(
    cx,
    headCy - h * 0.03,
    w * 0.18,
    h * 0.1,
    0,
    Math.PI,
    0,
    false
  );
  ctx.fill();

  // Short Black Center Hair Tuft at top crown of head
  ctx.fillStyle = "#181c24";
  ctx.beginPath();
  ctx.ellipse(
    cx - w * 0.005,
    headCy - h * 0.132,
    w * 0.068,
    h * 0.022,
    0.05,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Iconic Hammered Golden Forehead Medallion Pendant (Ring Loop + Gold Disk)
  const medX = cx + w * 0.012;
  const medY = headCy - h * 0.042;
  const medR = w * 0.054;

  // Top hanging ring loop on forehead
  ctx.strokeStyle = "#eab308";
  ctx.lineWidth = Math.max(1.2, w * 0.016);
  ctx.beginPath();
  ctx.arc(medX - w * 0.004, medY - medR * 1.25, medR * 0.36, 0, Math.PI * 2);
  ctx.stroke();

  // Golden Forehead Disk
  const medGrad = ctx.createRadialGradient(
    medX - medR * 0.3,
    medY - medR * 0.3,
    medR * 0.1,
    medX,
    medY,
    medR
  );
  medGrad.addColorStop(0, "#fef08a");
  medGrad.addColorStop(0.6, "#f59e0b");
  medGrad.addColorStop(1, "#b45309");
  ctx.fillStyle = medGrad;
  ctx.strokeStyle = "#78350f";
  ctx.lineWidth = Math.max(0.8, w * 0.009);
  ctx.beginPath();
  ctx.arc(medX, medY, medR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eyebrows & Narrow Calculating Eyes
  ctx.strokeStyle = "#29201b";
  ctx.lineWidth = Math.max(1.1, w * 0.016);
  ctx.lineCap = "round";
  // Left eyebrow
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.115, headCy - h * 0.005);
  ctx.quadraticCurveTo(
    cx - w * 0.075,
    headCy - h * 0.016,
    cx - w * 0.04,
    headCy - h * 0.002
  );
  // Right eyebrow
  ctx.moveTo(cx + w * 0.045, headCy - h * 0.002);
  ctx.quadraticCurveTo(
    cx + w * 0.085,
    headCy - h * 0.016,
    cx + w * 0.125,
    headCy - h * 0.004
  );
  ctx.stroke();

  // Eyes
  ctx.fillStyle = "#1c1613";
  for (const [ex, ey] of [
    [cx - w * 0.078, headCy + h * 0.013],
    [cx + w * 0.082, headCy + h * 0.013],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(ex, ey, w * 0.028, h * 0.008, 0, 0, Math.PI * 2);
    ctx.fill();
    // White pupil catchlight
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ex - w * 0.006, ey - h * 0.002, w * 0.006, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1c1613";
  }

  // Nose bridge & nostrils
  ctx.strokeStyle = "#8c5e3c";
  ctx.lineWidth = Math.max(0.9, w * 0.011);
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.015, headCy + h * 0.01);
  ctx.lineTo(cx + w * 0.022, headCy + h * 0.055);
  ctx.quadraticCurveTo(cx, headCy + h * 0.065, cx - w * 0.022, headCy + h * 0.055);
  ctx.stroke();

  // Pursed Lips
  ctx.fillStyle = "#a84438";
  ctx.beginPath();
  ctx.ellipse(
    cx - w * 0.002,
    headCy + h * 0.088,
    w * 0.038,
    h * 0.011,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Signature Dark Soul-Patch Beard Tuft under the lower lip
  ctx.fillStyle = "#221e1d";
  ctx.beginPath();
  ctx.ellipse(
    cx - w * 0.002,
    headCy + h * 0.106,
    w * 0.015,
    h * 0.011,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();

  // 7. Bottom-Left Cyberpunk Hot-Pink HUD Glyph + "Duke" + Ability Text (matches reference card layout)
  ctx.save();
  // Dark bottom vignette for crisp text readability
  const botGrad = ctx.createLinearGradient(0, h * 0.72, 0, h);
  botGrad.addColorStop(0, "rgba(9, 5, 15, 0)");
  botGrad.addColorStop(0.45, "rgba(9, 5, 15, 0.68)");
  botGrad.addColorStop(1, "rgba(9, 5, 15, 0.92)");
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);

  // "Duke" Title at lower-left
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.max(9, Math.round(w * 0.135))}px sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("Duke", w * 0.18, h * 0.825);

  // Hot-Pink Futuristic Angular Cyber-Chevron Glyph under "Duke"
  ctx.fillStyle = "#ec1c8c";
  ctx.strokeStyle = "#ec1c8c";
  ctx.lineWidth = Math.max(1, w * 0.015);

  ctx.beginPath();
  ctx.moveTo(w * 0.03, h * 0.84);
  ctx.lineTo(w * 0.38, h * 0.84);
  ctx.lineTo(w * 0.27, h * 0.935);
  ctx.lineTo(w * 0.23, h * 0.91);
  ctx.lineTo(w * 0.14, h * 0.91);
  ctx.lineTo(w * 0.18, h * 0.88);
  ctx.lineTo(w * 0.3, h * 0.88);
  ctx.lineTo(w * 0.33, h * 0.855);
  ctx.lineTo(w * 0.05, h * 0.855);
  ctx.closePath();
  ctx.fill();

  // Diagonal hatch bars inside the pink glyph
  if (w >= 64) {
    ctx.lineWidth = Math.max(0.8, w * 0.01);
    for (let k = 0; k < 6; k++) {
      const hx = w * (0.11 + k * 0.032);
      ctx.beginPath();
      ctx.moveTo(hx, h * 0.872);
      ctx.lineTo(hx + w * 0.018, h * 0.855);
      ctx.stroke();
    }

    // Two-line ability text on the bottom-right of the pink glyph
    ctx.fillStyle = "#f8fafc";
    ctx.font = `600 ${Math.max(7, Math.round(w * 0.068))}px sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Take 3 coins from Treasury.", w * 0.38, h * 0.855);
    ctx.fillText("Blocks Foreign Aid.", w * 0.38, h * 0.91);
  }
  ctx.restore();

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
    drawDukeCard2D(ctx, x, y, w, h);
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

    // For non-Duke cards (or small thumbnail Duke cards), draw the compact title ribbon if needed
    if (character !== "Duke" || w < 64) {
      const meta = COUP_CHARACTER_META[character];
      const bannerH = Math.max(15, h * 0.22);
      ctx.fillStyle = "rgba(9, 9, 11, 0.86)";
      ctx.fillRect(x, y + h - bannerH, w, bannerH);

      ctx.strokeStyle = meta.accentColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y + h - bannerH);
      ctx.lineTo(x + w, y + h - bannerH);
      ctx.stroke();

      ctx.fillStyle = "#fef3c7";
      ctx.font = `bold ${Math.max(7.5, Math.round(w * 0.14))}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        meta.titleVi,
        x + w * 0.5,
        y + h - bannerH * 0.5
      );
    }
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
