import { drawRoundedRect, lerp } from "@/canvas/engine";
import {
  COUP_CHARACTER_META,
  type CoupCharacter,
} from "@/cartridges/coup";

/**
 * Draws the official Coup octagonal brushed-silver/pewter "1 ISK" metal coin at (cx, cy) with radius `r`
 * using pure 2D Canvas primitives:
 * - Regular octagon with flat Top/Bottom/Left/Right edges and brushed steel gradient
 * - 4 cardinal sets of 3 recessed dark-pewter notches (top, bottom, left, right)
 * - Central engraved ring with 3 small circular nodes (9h, 3h, 6h) and a larger 12h medallion containing "1"
 * - Engraved "ƗSK" sci-fi currency lettering across the center
 */
export function drawCoupCoin2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
) {
  ctx.save();
  ctx.translate(cx, cy);

  const defineOctagonPath = (rad: number) => {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      // Rotate by 22.5 deg (PI/8) so Top, Right, Bottom, Left are flat edges
      const ang = (i * Math.PI) / 4 + Math.PI / 8;
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  };

  // 1. Drop shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.save();
  ctx.translate(1.2, 2.2);
  defineOctagonPath(r);
  ctx.fill();
  ctx.restore();

  // 2. Outer Dark Pewter Bevel & Brushed Silver-Steel Octagon Body
  defineOctagonPath(r);
  const metalGrad = ctx.createLinearGradient(-r, -r, r, r);
  metalGrad.addColorStop(0, "#eef0f2");
  metalGrad.addColorStop(0.35, "#c8ccd0");
  metalGrad.addColorStop(0.7, "#999ea4");
  metalGrad.addColorStop(1, "#5f6368");
  ctx.fillStyle = metalGrad;
  ctx.fill();

  ctx.strokeStyle = "#272a2e";
  ctx.lineWidth = Math.max(1, r * 0.09);
  ctx.stroke();

  // Clip inside the octagon for brushed-metal texture lines and edge notches
  ctx.save();
  defineOctagonPath(r * 0.96);
  ctx.clip();

  // Subtle diagonal brushed-metal scratch lines
  if (r >= 9) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = Math.max(0.5, r * 0.03);
    for (let s = -4; s <= 4; s++) {
      const offset = s * r * 0.24;
      ctx.beginPath();
      ctx.moveTo(-r + offset, -r);
      ctx.lineTo(r + offset, r);
      ctx.stroke();
    }
  }

  // 3. Four Sets of 3 Recessed Dark-Pewter Notches along the Top, Right, Bottom, Left flat edges
  for (let side = 0; side < 4; side++) {
    ctx.save();
    ctx.rotate((side * Math.PI) / 2);

    const notchOffsets = [-0.24, 0, 0.24];
    const notchW = r * 0.14;
    const notchTopY = -r * 0.92;
    const notchBotY = -r * 0.62;

    for (const nx of notchOffsets) {
      const centerX = nx * r;
      ctx.fillStyle = "#484b50";
      ctx.strokeStyle = "#26282b";
      ctx.lineWidth = Math.max(0.6, r * 0.045);

      ctx.beginPath();
      ctx.moveTo(centerX - notchW * 0.55, notchTopY);
      ctx.lineTo(centerX + notchW * 0.55, notchTopY);
      ctx.lineTo(centerX + notchW * 0.44, notchBotY);
      ctx.lineTo(centerX - notchW * 0.44, notchBotY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4. Central Engraved Ring (radius ~ 0.45 * r) with 3 Small Circular Nodes (left, right, bottom)
  const ringR = r * 0.44;
  const ringCy = r * 0.04;
  ctx.strokeStyle = "#36393d";
  ctx.lineWidth = Math.max(0.9, r * 0.065);
  ctx.beginPath();
  ctx.arc(0, ringCy, ringR, 0, Math.PI * 2);
  ctx.stroke();

  // 3 small circular nodes at Left (PI), Right (0), and Bottom (PI/2) of the central ring
  for (const [nx, ny, nr] of [
    [-ringR, ringCy, r * 0.075],
    [ringR, ringCy, r * 0.075],
    [0, ringCy + ringR, r * 0.09],
  ] as const) {
    ctx.fillStyle = "#b8bcc2";
    ctx.strokeStyle = "#36393d";
    ctx.lineWidth = Math.max(0.8, r * 0.055);
    ctx.beginPath();
    ctx.arc(nx, ny, nr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 5. Top 12-o'clock Medallion Circle containing the engraved numeral "1"
  const topMedY = ringCy - ringR * 0.78;
  const topMedR = r * 0.21;
  ctx.fillStyle = "#c2c6cc";
  ctx.strokeStyle = "#2f3236";
  ctx.lineWidth = Math.max(0.9, r * 0.06);
  ctx.beginPath();
  ctx.arc(0, topMedY, topMedR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Vertical flanking hatch lines inside the top "1" medallion
  if (r >= 10) {
    ctx.strokeStyle = "#484b50";
    ctx.lineWidth = Math.max(0.6, r * 0.04);
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * topMedR * 0.56, topMedY - topMedR * 0.7);
      ctx.lineTo(dir * topMedR * 0.56, topMedY + topMedR * 0.7);
      ctx.stroke();
    }
  }

  // Engraved "1" inside the top medallion
  ctx.fillStyle = "#323539";
  ctx.font = `900 ${Math.max(5, Math.round(r * 0.27))}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("1", 0, topMedY + r * 0.01);

  // 6. Engraved "ƗSK" Currency Text across the middle of the central circle
  if (r >= 8) {
    ctx.fillStyle = "#3a3d42";
    ctx.font = `900 ${Math.max(5, Math.round(r * 0.28))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ISK", r * 0.02, ringCy + r * 0.08);

    // Horizontal crossbar protruding left from the "I" in "ISK" (matching the "ƗSK" glyph)
    ctx.strokeStyle = "#3a3d42";
    ctx.lineWidth = Math.max(0.9, r * 0.065);
    ctx.beginPath();
    ctx.moveTo(-r * 0.29, ringCy + r * 0.07);
    ctx.lineTo(-r * 0.14, ringCy + r * 0.07);
    ctx.stroke();
  }

  ctx.restore(); // end octagon clip

  // Subtle top-left metallic highlight edge
  ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
  ctx.lineWidth = Math.max(0.7, r * 0.045);
  ctx.beginPath();
  for (let i = 4; i <= 7; i++) {
    const ang = (i * Math.PI) / 4 + Math.PI / 8;
    const px = Math.cos(ang) * (r * 0.94);
    const py = Math.sin(ang) * (r * 0.94);
    if (i === 4) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
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

  // Crisp 2D numeric ISK coin count pill below stack
  const pillW = 46;
  const pillH = 18;
  drawRoundedRect(
    ctx,
    cx - pillW / 2,
    cy + coinRadius + 5,
    pillW,
    pillH,
    9
  );
  ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
  ctx.fill();
  ctx.strokeStyle = coins >= 10 ? "#ef4444" : "#94a3b8";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = coins >= 10 ? "#fca5a5" : "#e2e8f0";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${coins} ISK`, cx, cy + coinRadius + 14);

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

  ctx.restore();
}

/**
 * Draws the detailed 2D illustration for the Coup "Assassin" card matching the reference artwork
 * (without any text on the card):
 * - Circular cathedral/atrium window backdrop with dark teal-slate vertical columns & misty light shafts
 * - Top-right dark gunmetal skull faction emblem with an 'X' forehead cutout and 4 jagged bottom fangs
 * - Blonde female assassin with black-cord-wrapped high ponytail, straight blunt bangs,
 *   ice-blue splatter war-paint across the eyes, black ear stud + crescent claw earring, and dark plum lips
 * - High flared black collar lined in electric cyan, rectangular cyan gem, 3D silver skull brooch
 *   with glowing blue eyes, cyan-piped lapels, and vertical cyan ladder-segmented chest strip
 */
export function drawAssassinCard2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  ctx.translate(x, y);

  // 1. Misty Silver-Grey Outer Wall & Circular Cathedral Atrium Window Backdrop
  const wallGrad = ctx.createLinearGradient(0, 0, 0, h);
  wallGrad.addColorStop(0, "#9ca3af");
  wallGrad.addColorStop(0.55, "#e2e8f0");
  wallGrad.addColorStop(1, "#090d16");
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, w, h);

  // Large Circular Window Portal behind the Assassin's upper body
  const portalCx = w * 0.5;
  const portalCy = h * 0.25;
  const portalR = w * 0.54;

  ctx.save();
  ctx.beginPath();
  ctx.arc(portalCx, portalCy, portalR, 0, Math.PI * 2);
  ctx.clip();

  const portalBg = ctx.createLinearGradient(0, 0, w, 0);
  portalBg.addColorStop(0, "#3b5254");
  portalBg.addColorStop(0.25, "#94a3a6");
  portalBg.addColorStop(0.36, "#f1f5f9");
  portalBg.addColorStop(0.5, "#1f3a3d");
  portalBg.addColorStop(0.66, "#f1f5f9");
  portalBg.addColorStop(0.78, "#94a3a6");
  portalBg.addColorStop(1, "#3b5254");
  ctx.fillStyle = portalBg;
  ctx.fillRect(0, 0, w, h * 0.65);

  // Vertical Gothic/Sci-Fi Atrium Ribs inside the circular window
  ctx.strokeStyle = "rgba(30, 48, 50, 0.55)";
  ctx.lineWidth = Math.max(0.8, w * 0.01);
  for (const vx of [0.14, 0.24, 0.34, 0.68, 0.78, 0.88]) {
    ctx.beginPath();
    ctx.moveTo(w * vx, 0);
    ctx.lineTo(w * vx, h * 0.6);
    ctx.stroke();
  }
  ctx.restore();

  // Subtle rim around the circular window
  ctx.strokeStyle = "rgba(100, 116, 139, 0.45)";
  ctx.lineWidth = Math.max(1, w * 0.012);
  ctx.beginPath();
  ctx.arc(portalCx, portalCy, portalR, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Top-Right Gunmetal Skull Faction Emblem (with 'X' Forehead Cutout & 4 Jagged Fangs)
  ctx.save();
  const skX = w * 0.76;
  const skY = h * 0.175;
  const skS = w * 0.22;

  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = Math.max(2, w * 0.03);

  const skullGrad = ctx.createLinearGradient(
    skX - skS * 0.5,
    skY - skS * 0.5,
    skX + skS * 0.5,
    skY + skS * 0.5
  );
  skullGrad.addColorStop(0, "#52565c");
  skullGrad.addColorStop(0.5, "#383b40");
  skullGrad.addColorStop(1, "#1f2124");
  ctx.fillStyle = skullGrad;
  ctx.strokeStyle = "#181a1c";
  ctx.lineWidth = Math.max(0.9, w * 0.01);

  ctx.beginPath();
  // Top flat cranium
  ctx.moveTo(skX - skS * 0.25, skY - skS * 0.44);
  ctx.lineTo(skX + skS * 0.25, skY - skS * 0.44);
  // Upper-right chamfer
  ctx.lineTo(skX + skS * 0.46, skY - skS * 0.14);
  ctx.lineTo(skX + skS * 0.42, skY + skS * 0.04);
  // Cheekbone flare out & in
  ctx.lineTo(skX + skS * 0.5, skY + skS * 0.12);
  ctx.lineTo(skX + skS * 0.36, skY + skS * 0.26);
  ctx.lineTo(skX + skS * 0.26, skY + skS * 0.26);
  // 4 Jagged Bottom Fang Prongs (right to left)
  ctx.lineTo(skX + skS * 0.22, skY + skS * 0.48);
  ctx.lineTo(skX + skS * 0.13, skY + skS * 0.28);
  ctx.lineTo(skX + skS * 0.09, skY + skS * 0.52);
  ctx.lineTo(skX + skS * 0.02, skY + skS * 0.28);
  ctx.lineTo(skX - skS * 0.02, skY + skS * 0.28);
  ctx.lineTo(skX - skS * 0.09, skY + skS * 0.52);
  ctx.lineTo(skX - skS * 0.13, skY + skS * 0.28);
  ctx.lineTo(skX - skS * 0.22, skY + skS * 0.48);
  // Left cheek & cranium
  ctx.lineTo(skX - skS * 0.26, skY + skS * 0.26);
  ctx.lineTo(skX - skS * 0.36, skY + skS * 0.26);
  ctx.lineTo(skX - skS * 0.5, skY + skS * 0.12);
  ctx.lineTo(skX - skS * 0.42, skY + skS * 0.04);
  ctx.lineTo(skX - skS * 0.46, skY - skS * 0.14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;

  // 'X' Cutout on the Skull Emblem's Forehead
  ctx.strokeStyle = "#b8c4c8";
  ctx.lineWidth = Math.max(1.5, skS * 0.095);
  ctx.lineCap = "butt";
  const xCy = skY - skS * 0.18;
  const xR = skS * 0.12;
  ctx.beginPath();
  ctx.moveTo(skX - xR, xCy - xR);
  ctx.lineTo(skX + xR, xCy + xR);
  ctx.moveTo(skX + xR, xCy - xR);
  ctx.lineTo(skX - xR, xCy + xR);
  ctx.stroke();

  // Angular Eye Sockets & Nasal Triangle on the Skull Emblem
  ctx.fillStyle = "#94a3a8";
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(skX + dir * skS * 0.1, skY + skS * 0.06);
    ctx.lineTo(skX + dir * skS * 0.34, skY + skS * 0.06);
    ctx.lineTo(skX + dir * skS * 0.26, skY + skS * 0.16);
    ctx.lineTo(skX + dir * skS * 0.14, skY + skS * 0.16);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(skX, skY + skS * 0.15);
  ctx.lineTo(skX + skS * 0.06, skY + skS * 0.24);
  ctx.lineTo(skX - skS * 0.06, skY + skS * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 3. Lower Black Cloak, High Flared Electric-Cyan-Lined Collar, Silver Skull Clasp & Cyan Ladder Chest
  ctx.save();
  const neckCx = w * 0.49;

  // Back of the High Flared Collar (Electric-Cyan Inner Lining)
  const cyanGrad = ctx.createLinearGradient(
    w * 0.28,
    h * 0.44,
    w * 0.68,
    h * 0.58
  );
  cyanGrad.addColorStop(0, "#0284c7");
  cyanGrad.addColorStop(0.5, "#38bdf8");
  cyanGrad.addColorStop(1, "#0369a1");
  ctx.fillStyle = cyanGrad;
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = Math.max(1.2, w * 0.014);

  ctx.beginPath();
  ctx.moveTo(w * 0.34, h * 0.56);
  ctx.quadraticCurveTo(w * 0.26, h * 0.48, w * 0.31, h * 0.44);
  ctx.quadraticCurveTo(w * 0.48, h * 0.46, w * 0.66, h * 0.51);
  ctx.quadraticCurveTo(w * 0.68, h * 0.55, w * 0.6, h * 0.58);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Sweeping Black Cloak Shoulders & Body
  const cloakGrad = ctx.createLinearGradient(0, h * 0.55, w, h);
  cloakGrad.addColorStop(0, "#090c14");
  cloakGrad.addColorStop(0.5, "#111726");
  cloakGrad.addColorStop(1, "#05070b");
  ctx.fillStyle = cloakGrad;
  ctx.beginPath();
  ctx.moveTo(-w * 0.04, h);
  ctx.quadraticCurveTo(w * 0.04, h * 0.66, w * 0.33, h * 0.6);
  ctx.lineTo(w * 0.34, h * 0.54);
  ctx.quadraticCurveTo(neckCx, h * 0.61, w * 0.61, h * 0.56);
  ctx.lineTo(w * 0.63, h * 0.6);
  ctx.quadraticCurveTo(w * 0.94, h * 0.66, w * 1.04, h);
  ctx.closePath();
  ctx.fill();

  // Cyan-piped Black Collar Neckband & Triangular Lapels
  ctx.fillStyle = "#0e131f";
  ctx.strokeStyle = "#0ea5e9";
  ctx.lineWidth = Math.max(1, w * 0.012);

  // Left triangular lapel
  ctx.beginPath();
  ctx.moveTo(neckCx - w * 0.01, h * 0.63);
  ctx.lineTo(w * 0.34, h * 0.59);
  ctx.lineTo(w * 0.27, h * 0.71);
  ctx.lineTo(w * 0.39, h * 0.82);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right triangular lapel
  ctx.beginPath();
  ctx.moveTo(neckCx + w * 0.01, h * 0.63);
  ctx.lineTo(w * 0.61, h * 0.6);
  ctx.lineTo(w * 0.71, h * 0.73);
  ctx.lineTo(w * 0.58, h * 0.83);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Vertical Cyan Ladder Panel down the center of the bodice
  const ladderW = w * 0.042;
  const ladderX = neckCx - ladderW * 0.5;
  for (let rung = 0; rung < 5; rung++) {
    const ry = h * (0.73 + rung * 0.025);
    ctx.fillStyle = rung % 2 === 0 ? "#38bdf8" : "#0284c7";
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = Math.max(0.7, w * 0.008);
    ctx.fillRect(ladderX, ry, ladderW, h * 0.022);
    ctx.strokeRect(ladderX, ry, ladderW, h * 0.022);
  }

  // Rectangular White-Rimmed Electric-Blue Gem at the throat
  ctx.fillStyle = "#0284c7";
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = Math.max(1, w * 0.011);
  ctx.fillRect(neckCx - w * 0.015, h * 0.625, w * 0.03, h * 0.052);
  ctx.strokeRect(neckCx - w * 0.015, h * 0.625, w * 0.03, h * 0.052);

  // 3D Silver Skull Brooch below the throat gem (with glowing cyan eyes)
  const broochY = h * 0.708;
  const broochR = w * 0.032;
  ctx.fillStyle = "#e2e8f0";
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = Math.max(0.8, w * 0.008);
  ctx.beginPath();
  ctx.arc(neckCx, broochY, broochR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Glowing cyan eyes on the silver skull brooch
  ctx.fillStyle = "#0ea5e9";
  ctx.beginPath();
  ctx.arc(
    neckCx - broochR * 0.38,
    broochY - broochR * 0.05,
    broochR * 0.24,
    0,
    Math.PI * 2
  );
  ctx.arc(
    neckCx + broochR * 0.38,
    broochY - broochR * 0.05,
    broochR * 0.24,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();

  // 4. The Assassin's Neck, Head, Blonde Ponytail, Blunt Bangs & Ice-Blue War-Paint Mask
  ctx.save();
  const faceCx = w * 0.51;
  const faceCy = h * 0.39;

  // Slender porcelain neck
  const neckGrad = ctx.createLinearGradient(
    w * 0.36,
    h * 0.45,
    w * 0.6,
    h * 0.58
  );
  neckGrad.addColorStop(0, "#ebd3c3");
  neckGrad.addColorStop(0.6, "#f7e7dc");
  neckGrad.addColorStop(1, "#b89c8d");
  ctx.fillStyle = neckGrad;
  ctx.beginPath();
  ctx.moveTo(w * 0.37, h * 0.45);
  ctx.lineTo(w * 0.37, h * 0.57);
  ctx.quadraticCurveTo(neckCx, h * 0.61, w * 0.58, h * 0.56);
  ctx.lineTo(w * 0.59, h * 0.48);
  ctx.closePath();
  ctx.fill();

  // High Blonde Ponytail & Black Leather Cord Wrap at top of head
  // Curled golden-blonde ponytail plume sweeping left
  const ponyGrad = ctx.createRadialGradient(
    w * 0.37,
    h * 0.16,
    w * 0.02,
    w * 0.4,
    h * 0.16,
    w * 0.14
  );
  ponyGrad.addColorStop(0, "#fef3c7");
  ponyGrad.addColorStop(0.55, "#d6ab72");
  ponyGrad.addColorStop(1, "#7c582c");
  ctx.fillStyle = ponyGrad;
  ctx.strokeStyle = "#6b4c24";
  ctx.lineWidth = Math.max(0.8, w * 0.009);
  ctx.beginPath();
  ctx.moveTo(w * 0.46, h * 0.17);
  ctx.bezierCurveTo(
    w * 0.38,
    h * 0.1,
    w * 0.27,
    h * 0.12,
    w * 0.29,
    h * 0.19
  );
  ctx.bezierCurveTo(
    w * 0.31,
    h * 0.24,
    w * 0.42,
    h * 0.22,
    w * 0.48,
    h * 0.18
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tall Black Cord Hair Wrap binding the ponytail base
  ctx.save();
  ctx.translate(w * 0.475, h * 0.192);
  ctx.rotate(-0.14);
  ctx.fillStyle = "#181a20";
  ctx.strokeStyle = "#3f3f46";
  ctx.lineWidth = Math.max(0.7, w * 0.008);
  drawRoundedRect(ctx, -w * 0.024, -h * 0.032, w * 0.048, h * 0.064, 3);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Right Ear (on viewer's left) + Black Gauge Stud + Black Crescent Claw Earring
  ctx.fillStyle = "#ebd0bf";
  ctx.strokeStyle = "#a38372";
  ctx.lineWidth = Math.max(0.8, w * 0.009);
  ctx.beginPath();
  ctx.ellipse(
    w * 0.335,
    h * 0.405,
    w * 0.028,
    h * 0.042,
    -0.2,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  // Black round ear stud
  ctx.fillStyle = "#090b10";
  ctx.beginPath();
  ctx.arc(w * 0.362, h * 0.438, w * 0.013, 0, Math.PI * 2);
  ctx.fill();

  // Curved black crescent talon earring hanging below ear
  ctx.beginPath();
  ctx.moveTo(w * 0.348, h * 0.445);
  ctx.quadraticCurveTo(w * 0.328, h * 0.472, w * 0.365, h * 0.49);
  ctx.quadraticCurveTo(w * 0.345, h * 0.468, w * 0.358, h * 0.445);
  ctx.closePath();
  ctx.fill();

  // Porcelain-Ivory Face & Jawline Contour
  const faceGrad = ctx.createRadialGradient(
    faceCx - w * 0.03,
    faceCy,
    w * 0.02,
    faceCx,
    faceCy,
    w * 0.22
  );
  faceGrad.addColorStop(0, "#fff8f2");
  faceGrad.addColorStop(0.65, "#ecd3c4");
  faceGrad.addColorStop(1, "#b8998a");
  ctx.fillStyle = faceGrad;
  ctx.strokeStyle = "#9c7e70";
  ctx.lineWidth = Math.max(0.8, w * 0.009);

  ctx.beginPath();
  ctx.moveTo(w * 0.34, h * 0.35);
  // Left cheek down to jawline & chin (tilted three-quarter right)
  ctx.quadraticCurveTo(w * 0.35, h * 0.49, w * 0.56, h * 0.535);
  // Chin rounding up to right cheek
  ctx.quadraticCurveTo(w * 0.65, h * 0.54, w * 0.68, h * 0.43);
  ctx.quadraticCurveTo(w * 0.71, h * 0.35, w * 0.67, h * 0.27);
  // Top of crown back to left temple
  ctx.quadraticCurveTo(w * 0.5, h * 0.21, w * 0.34, h * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Pulled-up Golden-Blonde Hair on Crown & Left Temple
  const hairGrad = ctx.createLinearGradient(
    w * 0.33,
    h * 0.22,
    w * 0.7,
    h * 0.36
  );
  hairGrad.addColorStop(0, "#d4ac76");
  hairGrad.addColorStop(0.5, "#fbe6b2");
  hairGrad.addColorStop(1, "#b5854b");
  ctx.fillStyle = hairGrad;
  ctx.beginPath();
  ctx.moveTo(w * 0.335, h * 0.365);
  ctx.quadraticCurveTo(w * 0.33, h * 0.24, w * 0.48, h * 0.22);
  ctx.quadraticCurveTo(w * 0.66, h * 0.22, w * 0.71, h * 0.34);
  ctx.lineTo(w * 0.43, h * 0.32);
  ctx.closePath();
  ctx.fill();

  // Ice-Blue & White Splatter Eye War-Paint Mask across both eyes and left cheek
  ctx.fillStyle = "rgba(104, 156, 194, 0.75)";
  ctx.beginPath();
  ctx.moveTo(w * 0.39, h * 0.41);
  ctx.quadraticCurveTo(w * 0.42, h * 0.355, w * 0.58, h * 0.365);
  ctx.quadraticCurveTo(w * 0.69, h * 0.38, w * 0.695, h * 0.435);
  ctx.quadraticCurveTo(w * 0.64, h * 0.42, w * 0.56, h * 0.395);
  ctx.quadraticCurveTo(w * 0.47, h * 0.42, w * 0.39, h * 0.41);
  ctx.closePath();
  ctx.fill();

  // Paint-splatter droplets extending left toward the ear
  for (const [dx, dy, dr] of [
    [0.41, 0.405, 0.022],
    [0.43, 0.422, 0.016],
    [0.395, 0.424, 0.012],
    [0.455, 0.395, 0.018],
  ] as const) {
    ctx.beginPath();
    ctx.arc(w * dx, h * dy, w * dr, 0, Math.PI * 2);
    ctx.fill();
  }

  // White inner war-paint highlight around the eyelids
  ctx.fillStyle = "rgba(240, 249, 255, 0.85)";
  ctx.beginPath();
  ctx.ellipse(
    w * 0.52,
    h * 0.375,
    w * 0.055,
    h * 0.016,
    0.1,
    0,
    Math.PI * 2
  );
  ctx.ellipse(
    w * 0.655,
    h * 0.395,
    w * 0.036,
    h * 0.014,
    0.25,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Icy Blue Eyes looking down-right
  for (const [ex, ey, ew] of [
    [w * 0.53, h * 0.376, w * 0.026],
    [w * 0.662, h * 0.4, w * 0.02],
  ] as const) {
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.ellipse(ex, ey, ew, h * 0.008, 0.14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(ex, ey, ew * 0.48, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ex - ew * 0.2, ey - h * 0.002, ew * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }

  // Razor-Straight Blunt Golden-Blonde Bangs (Fringe) cut cleanly across the forehead
  const bangsGrad = ctx.createLinearGradient(
    w * 0.43,
    h * 0.26,
    w * 0.72,
    h * 0.38
  );
  bangsGrad.addColorStop(0, "#fdf2d0");
  bangsGrad.addColorStop(0.5, "#e0b375");
  bangsGrad.addColorStop(1, "#ead09c");
  ctx.fillStyle = bangsGrad;
  ctx.strokeStyle = "#a1743c";
  ctx.lineWidth = Math.max(0.7, w * 0.008);

  ctx.beginPath();
  ctx.moveTo(w * 0.445, h * 0.345);
  ctx.quadraticCurveTo(w * 0.48, h * 0.25, w * 0.6, h * 0.255);
  ctx.quadraticCurveTo(w * 0.71, h * 0.27, w * 0.725, h * 0.382);
  // Razor-straight blunt cut edge across the brow
  ctx.lineTo(w * 0.445, h * 0.345);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Sculpted Nose & Nostrils
  ctx.strokeStyle = "#9c7a69";
  ctx.lineWidth = Math.max(0.9, w * 0.011);
  ctx.beginPath();
  ctx.moveTo(w * 0.615, h * 0.375);
  ctx.lineTo(w * 0.648, h * 0.43);
  ctx.quadraticCurveTo(w * 0.625, h * 0.445, w * 0.595, h * 0.435);
  ctx.stroke();

  // Dark Plum-Purple Parted Lips
  ctx.fillStyle = "#3b0a2e";
  ctx.strokeStyle = "#1f0418";
  ctx.lineWidth = Math.max(0.7, w * 0.008);
  ctx.beginPath();
  ctx.moveTo(w * 0.555, h * 0.48);
  ctx.quadraticCurveTo(w * 0.595, h * 0.462, w * 0.62, h * 0.472);
  ctx.quadraticCurveTo(w * 0.64, h * 0.464, w * 0.652, h * 0.486);
  ctx.quadraticCurveTo(w * 0.605, h * 0.504, w * 0.555, h * 0.48);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tiny white teeth glint inside parted plum lips
  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  ctx.ellipse(
    w * 0.61,
    h * 0.482,
    w * 0.018,
    h * 0.004,
    0.08,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

/**
 * Draws the detailed 2D illustration for the Coup "Contessa" card matching the reference artwork
 * (without any text on the card):
 * - Warm golden-orange dusk sky with upper-left sun/moon disk, futuristic skyline (left cylindrical
 *   skyscraper topped with a glowing golden ribbed dome, right sleek white diagonal spire), and flying speeders
 * - Top-right crimson-red pentagonal diamond shield emblem with a 3-merlon castle tower cutout & twin slits
 * - Voluminous curly auburn-copper upswept hair studded with luminous silver-white pearls
 * - Aristocratic face with white vertical forehead line & ring glyph, red nose-chain across cheeks & nose bridge
 *   with 6 hanging pearl drops, and long crimson needle earrings
 * - Massive dramatic high flared crimson-red calla-lily collar with 5 diagonal raised ribs on each wing,
 *   exposed collarbones/décolletage, and deep crimson brocade bodice with off-shoulder sleeve cuffs
 */
export function drawContessaCard2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  ctx.translate(x, y);

  // 1. Golden-Orange Futuristic Dusk Sky & Horizon Cityscape Backdrop
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, "#d8640b");
  skyGrad.addColorStop(0.24, "#f49f38");
  skyGrad.addColorStop(0.5, "#f5deb3");
  skyGrad.addColorStop(0.68, "#a17c47");
  skyGrad.addColorStop(1, "#2a0808");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Faint Sun / Planet Orb in Upper-Left Sky
  const sunGrad = ctx.createRadialGradient(
    w * 0.1,
    h * 0.088,
    w * 0.01,
    w * 0.1,
    h * 0.088,
    w * 0.085
  );
  sunGrad.addColorStop(0, "rgba(253, 186, 116, 0.55)");
  sunGrad.addColorStop(0.75, "rgba(234, 88, 12, 0.35)");
  sunGrad.addColorStop(1, "rgba(234, 88, 12, 0)");
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(w * 0.1, h * 0.088, w * 0.085, 0, Math.PI * 2);
  ctx.fill();

  // Far-left hazy background skyscraper
  ctx.fillStyle = "rgba(120, 96, 72, 0.55)";
  ctx.fillRect(0, h * 0.25, w * 0.038, h * 0.42);

  // Left Cylindrical High-Rise Tower with Glowing Golden Ribbed Dome
  const towX = w * 0.055;
  const towW = w * 0.165;
  const towTopY = h * 0.335;
  const towBotY = h * 0.72;

  const towBodyGrad = ctx.createLinearGradient(towX, 0, towX + towW, 0);
  towBodyGrad.addColorStop(0, "#382c1e");
  towBodyGrad.addColorStop(0.45, "#786242");
  towBodyGrad.addColorStop(0.75, "#9c8259");
  towBodyGrad.addColorStop(1, "#2e2317");
  ctx.fillStyle = towBodyGrad;
  ctx.fillRect(towX, towTopY, towW, towBotY - towTopY);

  // Window grid lines on the cylindrical tower body
  ctx.strokeStyle = "rgba(253, 224, 71, 0.32)";
  ctx.lineWidth = Math.max(0.6, w * 0.006);
  for (let row = 0; row < 14; row++) {
    const wy = towTopY + (row + 0.5) * ((towBotY - towTopY) / 15);
    ctx.beginPath();
    ctx.moveTo(towX + towW * 0.08, wy);
    ctx.lineTo(towX + towW * 0.92, wy);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(25, 19, 12, 0.65)";
  for (let col = 1; col <= 4; col++) {
    const wx = towX + (col / 5) * towW;
    ctx.beginPath();
    ctx.moveTo(wx, towTopY);
    ctx.lineTo(wx, towBotY);
    ctx.stroke();
  }

  // Glowing Golden Ribbed Dome atop the left cylindrical tower
  const domeCx = towX + towW * 0.5;
  const domeGrad = ctx.createRadialGradient(
    domeCx + towW * 0.14,
    towTopY - h * 0.025,
    towW * 0.04,
    domeCx,
    towTopY,
    towW * 0.58
  );
  domeGrad.addColorStop(0, "#fef08a");
  domeGrad.addColorStop(0.45, "#f59e0b");
  domeGrad.addColorStop(0.85, "#92400e");
  domeGrad.addColorStop(1, "#451a03");
  ctx.fillStyle = domeGrad;
  ctx.beginPath();
  ctx.arc(domeCx, towTopY, towW * 0.5, Math.PI, 0);
  ctx.closePath();
  ctx.fill();

  // Golden dome vertical meridian ribs
  ctx.strokeStyle = "rgba(69, 26, 3, 0.55)";
  ctx.lineWidth = Math.max(0.6, w * 0.006);
  for (const rx of [-0.28, -0.1, 0.1, 0.28]) {
    ctx.beginPath();
    ctx.moveTo(domeCx + rx * towW * 0.4, towTopY - h * 0.052);
    ctx.quadraticCurveTo(
      domeCx + rx * towW * 0.95,
      towTopY - h * 0.025,
      domeCx + rx * towW * 0.85,
      towTopY
    );
    ctx.stroke();
  }

  // Right Sleek White/Silver Angled Spire Skyscraper
  const spireX = w * 0.875;
  const spireGrad = ctx.createLinearGradient(spireX, 0, spireX + w * 0.09, 0);
  spireGrad.addColorStop(0, "#94a3b8");
  spireGrad.addColorStop(0.35, "#f8fafc");
  spireGrad.addColorStop(1, "#cbd5e1");
  ctx.fillStyle = spireGrad;
  ctx.beginPath();
  ctx.moveTo(spireX, h * 0.46);
  ctx.lineTo(spireX, h * 0.25);
  ctx.lineTo(spireX + w * 0.024, h * 0.25);
  ctx.lineTo(spireX + w * 0.024, h * 0.182);
  ctx.lineTo(spireX + w * 0.052, h * 0.182);
  ctx.lineTo(spireX + w * 0.052, h * 0.285);
  ctx.lineTo(spireX + w * 0.088, h * 0.322);
  ctx.lineTo(spireX + w * 0.088, h * 0.5);
  ctx.closePath();
  ctx.fill();

  // Dark vertical window slots on the right white spire
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = Math.max(0.7, w * 0.008);
  ctx.beginPath();
  ctx.moveTo(spireX + w * 0.036, h * 0.205);
  ctx.lineTo(spireX + w * 0.036, h * 0.43);
  ctx.moveTo(spireX + w * 0.064, h * 0.32);
  ctx.lineTo(spireX + w * 0.064, h * 0.45);
  ctx.stroke();

  // Flying Sci-Fi Shuttle Speeder on Upper Left (above golden dome) + Faint Contrail
  ctx.strokeStyle = "rgba(254, 243, 199, 0.38)";
  ctx.lineWidth = Math.max(0.8, w * 0.008);
  ctx.beginPath();
  ctx.moveTo(w * 0.05, h * 0.205);
  ctx.lineTo(w * 0.15, h * 0.208);
  ctx.stroke();

  ctx.fillStyle = "#292524";
  ctx.strokeStyle = "#d6d3d1";
  ctx.lineWidth = Math.max(0.5, w * 0.005);
  ctx.beginPath();
  ctx.moveTo(w * 0.225, h * 0.21);
  ctx.lineTo(w * 0.162, h * 0.197);
  ctx.lineTo(w * 0.145, h * 0.205);
  ctx.lineTo(w * 0.118, h * 0.214);
  ctx.lineTo(w * 0.154, h * 0.214);
  ctx.lineTo(w * 0.158, h * 0.224);
  ctx.lineTo(w * 0.18, h * 0.213);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Smaller distant flying speeder near top center-right
  ctx.fillStyle = "#57412d";
  ctx.beginPath();
  ctx.moveTo(w * 0.608, h * 0.138);
  ctx.lineTo(w * 0.578, h * 0.134);
  ctx.lineTo(w * 0.565, h * 0.143);
  ctx.closePath();
  ctx.fill();

  // 2. Top-Right Crimson Diamond-Shield Castle-Tower Faction Emblem
  ctx.save();
  const emX = w * 0.744;
  const emY = h * 0.16;
  const emW = w * 0.27;
  const emH = h * 0.144;

  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = Math.max(2, w * 0.025);

  const emGrad = ctx.createLinearGradient(
    emX - emW * 0.5,
    emY - emH * 0.5,
    emX + emW * 0.5,
    emY + emH * 0.5
  );
  emGrad.addColorStop(0, "#ff2a32");
  emGrad.addColorStop(0.55, "#e1161e");
  emGrad.addColorStop(1, "#a60b11");
  ctx.fillStyle = emGrad;
  ctx.strokeStyle = "#8a080d";
  ctx.lineWidth = Math.max(0.8, w * 0.009);

  // Left half of diamond shield + central vertical spine + right half of diamond shield
  // (Leaving the castle battlement tower & two vertical slits cut out to show the golden sky)
  ctx.beginPath();
  // Outer pentagonal diamond shield contour (clockwise)
  ctx.moveTo(emX - emW * 0.34, emY - emH * 0.47);
  ctx.lineTo(emX + emW * 0.34, emY - emH * 0.47);
  ctx.lineTo(emX + emW * 0.5, emY - emH * 0.2);
  ctx.lineTo(emX + emW * 0.06, emY + emH * 0.47);
  // Up the right slit into the right tower battlement
  ctx.lineTo(emX + emW * 0.06, emY - emH * 0.04);
  ctx.lineTo(emX + emW * 0.14, emY - emH * 0.12);
  ctx.lineTo(emX + emW * 0.22, emY - emH * 0.12);
  ctx.lineTo(emX + emW * 0.22, emY - emH * 0.34);
  // 3 Crenelated Merlons across the top of the castle cutout (right to left)
  ctx.lineTo(emX + emW * 0.13, emY - emH * 0.34);
  ctx.lineTo(emX + emW * 0.13, emY - emH * 0.25);
  ctx.lineTo(emX + emW * 0.05, emY - emH * 0.25);
  ctx.lineTo(emX + emW * 0.05, emY - emH * 0.34);
  ctx.lineTo(emX - emW * 0.05, emY - emH * 0.34);
  ctx.lineTo(emX - emW * 0.05, emY - emH * 0.25);
  ctx.lineTo(emX - emW * 0.13, emY - emH * 0.25);
  ctx.lineTo(emX - emW * 0.13, emY - emH * 0.34);
  ctx.lineTo(emX - emW * 0.22, emY - emH * 0.34);
  // Down left side of castle tower cutout
  ctx.lineTo(emX - emW * 0.22, emY - emH * 0.12);
  ctx.lineTo(emX - emW * 0.14, emY - emH * 0.12);
  ctx.lineTo(emX - emW * 0.06, emY - emH * 0.04);
  ctx.lineTo(emX - emW * 0.06, emY + emH * 0.47);
  // Back up the left diagonal edge of the diamond shield
  ctx.lineTo(emX - emW * 0.5, emY - emH * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Central red vertical pillar/spine between the two bottom castle slits
  ctx.beginPath();
  ctx.moveTo(emX - emW * 0.025, emY - emH * 0.08);
  ctx.lineTo(emX + emW * 0.025, emY - emH * 0.08);
  ctx.lineTo(emX + emW * 0.025, emY + emH * 0.48);
  ctx.lineTo(emX, emY + emH * 0.53);
  ctx.lineTo(emX - emW * 0.025, emY + emH * 0.48);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 3. Back Wall of the Massive High Flared Crimson Collar (behind neck & shoulders)
  ctx.save();
  const innerCollarGrad = ctx.createLinearGradient(0, h * 0.4, w, h * 0.78);
  innerCollarGrad.addColorStop(0, "#7f0909");
  innerCollarGrad.addColorStop(0.5, "#450404");
  innerCollarGrad.addColorStop(1, "#990f0f");
  ctx.fillStyle = innerCollarGrad;
  ctx.beginPath();
  ctx.moveTo(w * 0.11, h * 0.43);
  ctx.quadraticCurveTo(w * 0.22, h * 0.39, w * 0.35, h * 0.51);
  ctx.lineTo(w * 0.67, h * 0.51);
  ctx.quadraticCurveTo(w * 0.82, h * 0.38, w * 0.91, h * 0.41);
  ctx.quadraticCurveTo(w * 0.96, h * 0.56, w * 0.78, h * 0.78);
  ctx.lineTo(w * 0.22, h * 0.78);
  ctx.quadraticCurveTo(w * 0.08, h * 0.58, w * 0.11, h * 0.43);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 4. Bare Shoulders, Neck, Collarbones (Clavicles) & Broad Square Décolletage
  ctx.save();
  const skinChestGrad = ctx.createRadialGradient(
    w * 0.5,
    h * 0.68,
    w * 0.04,
    w * 0.5,
    h * 0.66,
    w * 0.36
  );
  skinChestGrad.addColorStop(0, "#fff0e5");
  skinChestGrad.addColorStop(0.55, "#f0bfa3");
  skinChestGrad.addColorStop(1, "#b87a5b");
  ctx.fillStyle = skinChestGrad;
  ctx.beginPath();
  // Neck down to wide bare shoulders and chest
  ctx.moveTo(w * 0.395, h * 0.52);
  ctx.lineTo(w * 0.39, h * 0.665);
  ctx.quadraticCurveTo(w * 0.14, h * 0.69, w * 0.04, h * 0.79);
  ctx.lineTo(w * 0.96, h * 0.82);
  ctx.quadraticCurveTo(w * 0.86, h * 0.69, w * 0.64, h * 0.67);
  ctx.lineTo(w * 0.625, h * 0.52);
  ctx.closePath();
  ctx.fill();

  // Realistic collarbone (clavicle) shadows & highlights
  ctx.strokeStyle = "rgba(161, 98, 72, 0.55)";
  ctx.lineWidth = Math.max(1, w * 0.012);
  ctx.beginPath();
  ctx.moveTo(w * 0.33, h * 0.68);
  ctx.quadraticCurveTo(w * 0.42, h * 0.7, w * 0.468, h * 0.73);
  ctx.moveTo(w * 0.68, h * 0.69);
  ctx.quadraticCurveTo(w * 0.57, h * 0.708, w * 0.505, h * 0.732);
  ctx.stroke();

  // Neck tendon shadow lines
  ctx.strokeStyle = "rgba(161, 98, 72, 0.38)";
  ctx.beginPath();
  ctx.moveTo(w * 0.42, h * 0.575);
  ctx.lineTo(w * 0.465, h * 0.715);
  ctx.moveTo(w * 0.59, h * 0.585);
  ctx.lineTo(w * 0.52, h * 0.715);
  ctx.stroke();
  ctx.restore();

  // 5. Front Wings of the Dramatic High Flared Crimson Collar (with 5 Diagonal Raised Ribs) & Brocade Gown
  ctx.save();
  const leftWingGrad = ctx.createLinearGradient(
    w * 0.09,
    h * 0.42,
    w * 0.35,
    h * 0.8
  );
  leftWingGrad.addColorStop(0, "#c81616");
  leftWingGrad.addColorStop(0.55, "#990b0b");
  leftWingGrad.addColorStop(1, "#5c0404");
  ctx.fillStyle = leftWingGrad;
  ctx.strokeStyle = "#ef2323";
  ctx.lineWidth = Math.max(1.1, w * 0.012);

  // Left High Flared Collar Wing
  ctx.beginPath();
  ctx.moveTo(w * 0.11, h * 0.43);
  ctx.quadraticCurveTo(w * 0.21, h * 0.39, w * 0.32, h * 0.51);
  ctx.quadraticCurveTo(w * 0.365, h * 0.64, w * 0.325, h * 0.775);
  ctx.lineTo(w * 0.125, h * 0.805);
  ctx.quadraticCurveTo(w * 0.095, h * 0.61, w * 0.11, h * 0.43);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 5 Diagonal Raised Crimson Pleats/Ribs on the Left Collar Wing
  ctx.strokeStyle = "#ef2b2b";
  ctx.lineWidth = Math.max(1.3, w * 0.014);
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    ctx.beginPath();
    ctx.moveTo(lerp(w * 0.11, w * 0.125, t), lerp(h * 0.595, h * 0.735, t));
    ctx.lineTo(lerp(w * 0.34, w * 0.255, t), lerp(h * 0.71, h * 0.79, t));
    ctx.stroke();
  }

  // Right High Flared Collar Wing
  const rightWingGrad = ctx.createLinearGradient(
    w * 0.94,
    h * 0.41,
    w * 0.65,
    h * 0.82
  );
  rightWingGrad.addColorStop(0, "#d91818");
  rightWingGrad.addColorStop(0.55, "#9e0c0c");
  rightWingGrad.addColorStop(1, "#610505");
  ctx.fillStyle = rightWingGrad;
  ctx.strokeStyle = "#ef2323";
  ctx.lineWidth = Math.max(1.1, w * 0.012);

  ctx.beginPath();
  ctx.moveTo(w * 0.91, h * 0.41);
  ctx.quadraticCurveTo(w * 0.81, h * 0.39, w * 0.71, h * 0.54);
  ctx.quadraticCurveTo(w * 0.655, h * 0.66, w * 0.7, h * 0.815);
  ctx.lineTo(w * 0.835, h * 0.835);
  ctx.quadraticCurveTo(w * 0.96, h * 0.61, w * 0.91, h * 0.41);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 5 Diagonal Raised Crimson Pleats/Ribs on the Right Collar Wing
  ctx.strokeStyle = "#ef2b2b";
  ctx.lineWidth = Math.max(1.3, w * 0.014);
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    ctx.beginPath();
    ctx.moveTo(lerp(w * 0.825, w * 0.84, t), lerp(h * 0.595, h * 0.745, t));
    ctx.lineTo(lerp(w * 0.68, w * 0.715, t), lerp(h * 0.725, h * 0.825, t));
    ctx.stroke();
  }

  // Deep Crimson Brocade Square-Neck Bodice & Off-Shoulder Crimson Sleeve Cuffs
  const bodiceGrad = ctx.createLinearGradient(0, h * 0.77, 0, h);
  bodiceGrad.addColorStop(0, "#8f0d0d");
  bodiceGrad.addColorStop(0.45, "#5c0505");
  bodiceGrad.addColorStop(1, "#290101");
  ctx.fillStyle = bodiceGrad;
  ctx.beginPath();
  // Left off-shoulder cuff + square bodice top + right off-shoulder cuff
  ctx.moveTo(-w * 0.02, h);
  ctx.lineTo(-w * 0.02, h * 0.82);
  ctx.quadraticCurveTo(w * 0.06, h * 0.74, w * 0.13, h * 0.8);
  ctx.lineTo(w * 0.25, h * 0.775);
  ctx.quadraticCurveTo(w * 0.48, h * 0.79, w * 0.715, h * 0.825);
  ctx.lineTo(w * 0.82, h * 0.835);
  ctx.quadraticCurveTo(w * 0.885, h * 0.735, w * 1.02, h * 0.86);
  ctx.lineTo(w * 1.02, h);
  ctx.closePath();
  ctx.fill();

  // Beaded Crimson Trim along the Square Bodice Neckline & Sleeve Edges
  ctx.strokeStyle = "#d91c1c";
  ctx.lineWidth = Math.max(1.2, w * 0.014);
  ctx.beginPath();
  ctx.moveTo(w * 0.23, h * 0.778);
  ctx.quadraticCurveTo(w * 0.48, h * 0.792, w * 0.73, h * 0.828);
  ctx.stroke();

  // Embossed Dark-Crimson Brocade Scrollwork on the Bodice
  ctx.strokeStyle = "rgba(185, 28, 28, 0.35)";
  ctx.lineWidth = Math.max(0.8, w * 0.009);
  for (const bx of [0.35, 0.48, 0.61]) {
    ctx.beginPath();
    ctx.arc(w * bx, h * 0.9, w * 0.055, 0, Math.PI * 1.6);
    ctx.stroke();
  }
  ctx.restore();

  // 6. Contessa's Voluminous Pearl-Studded Curly Auburn Hair, Portrait, Forehead Glyph & Nose-Chain
  ctx.save();
  const faceCx = w * 0.485;
  const faceCy = h * 0.445;

  // Back & Upper Crown Clusters of Curly Auburn-Copper Hair
  const hairClouds: [number, number, number, string][] = [
    [0.31, 0.33, 0.085, "#6e3112"],
    [0.68, 0.34, 0.085, "#6e3112"],
    [0.72, 0.39, 0.068, "#7c3a16"],
    [0.29, 0.39, 0.068, "#5e270c"],
    [0.36, 0.245, 0.092, "#9a4d21"],
    [0.61, 0.255, 0.092, "#8c421a"],
    [0.48, 0.225, 0.105, "#b35e2a"],
    [0.41, 0.275, 0.082, "#c26c35"],
    [0.55, 0.27, 0.082, "#a35223"],
  ];
  for (const [hx, hy, hr, col] of hairClouds) {
    const cg = ctx.createRadialGradient(
      w * (hx - hr * 0.2),
      h * (hy - hr * 0.2),
      w * hr * 0.1,
      w * hx,
      h * hy,
      w * hr
    );
    cg.addColorStop(0, "#d9864e");
    cg.addColorStop(0.55, col);
    cg.addColorStop(1, "#451a07");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(w * hx, h * hy, w * hr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Left & Right Ears + Long Thin Crimson Needle Earrings with Silver Tips
  ctx.fillStyle = "#e6ae91";
  ctx.strokeStyle = "#a66d51";
  ctx.lineWidth = Math.max(0.7, w * 0.008);
  // Viewer's left ear
  ctx.beginPath();
  ctx.ellipse(
    w * 0.322,
    h * 0.468,
    w * 0.022,
    h * 0.042,
    -0.18,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();
  // Viewer's right ear
  ctx.beginPath();
  ctx.ellipse(
    w * 0.678,
    h * 0.468,
    w * 0.028,
    h * 0.046,
    0.22,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  // Long Crimson Needle Drop Earrings on Both Ears
  for (const ex of [w * 0.346, w * 0.659]) {
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = Math.max(1.1, w * 0.012);
    ctx.beginPath();
    ctx.moveTo(ex, h * 0.505);
    ctx.lineTo(ex, h * 0.562);
    ctx.stroke();

    // Tiny silver needle tip at bottom of earring
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(ex - w * 0.006, h * 0.562);
    ctx.lineTo(ex + w * 0.006, h * 0.562);
    ctx.lineTo(ex, h * 0.58);
    ctx.closePath();
    ctx.fill();
  }

  // Sculpted Aristocratic Peach-Ivory Face & Chin
  const faceGrad = ctx.createRadialGradient(
    faceCx + w * 0.02,
    faceCy - h * 0.02,
    w * 0.02,
    faceCx,
    faceCy,
    w * 0.21
  );
  faceGrad.addColorStop(0, "#fff2e8");
  faceGrad.addColorStop(0.58, "#f0bea2");
  faceGrad.addColorStop(1, "#bd7d5e");
  ctx.fillStyle = faceGrad;
  ctx.strokeStyle = "#9e6347";
  ctx.lineWidth = Math.max(0.8, w * 0.009);

  ctx.beginPath();
  ctx.moveTo(w * 0.325, h * 0.385);
  // Left cheek down to poised chin
  ctx.quadraticCurveTo(w * 0.33, h * 0.535, w * 0.472, h * 0.582);
  // Chin up to right jawline & temple
  ctx.quadraticCurveTo(w * 0.635, h * 0.545, w * 0.655, h * 0.395);
  // Forehead hairline arch
  ctx.quadraticCurveTo(w * 0.62, h * 0.285, w * 0.485, h * 0.285);
  ctx.quadraticCurveTo(w * 0.35, h * 0.295, w * 0.325, h * 0.385);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Soft front auburn curl waves framing upper temples
  ctx.fillStyle = "#8c421a";
  ctx.beginPath();
  ctx.moveTo(w * 0.315, h * 0.41);
  ctx.quadraticCurveTo(w * 0.36, h * 0.32, w * 0.47, h * 0.285);
  ctx.quadraticCurveTo(w * 0.35, h * 0.265, w * 0.305, h * 0.36);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(w * 0.485, h * 0.285);
  ctx.quadraticCurveTo(w * 0.61, h * 0.305, w * 0.665, h * 0.415);
  ctx.quadraticCurveTo(w * 0.675, h * 0.33, w * 0.58, h * 0.275);
  ctx.closePath();
  ctx.fill();

  // Scattered Luminous Silver-White Pearls nestled in her Auburn Curls
  const hairPearls: [number, number][] = [
    [0.302, 0.328],
    [0.353, 0.275],
    [0.298, 0.388],
    [0.573, 0.227],
    [0.625, 0.282],
    [0.646, 0.29],
    [0.68, 0.331],
    [0.713, 0.344],
    [0.703, 0.391],
  ];
  for (const [px, py] of hairPearls) {
    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.arc(w * px, h * py, w * 0.011, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(w * px - w * 0.003, h * py - h * 0.002, w * 0.005, 0, Math.PI * 2);
    ctx.fill();
  }

  // White/Silver Vertical Forehead Stem & Open Circle Glyph
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = Math.max(1.2, w * 0.013);
  ctx.beginPath();
  ctx.moveTo(w * 0.468, h * 0.295);
  ctx.lineTo(w * 0.467, h * 0.342);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(w * 0.467, h * 0.352, w * 0.011, 0, Math.PI * 2);
  ctx.stroke();

  // High-Arched Thin Auburn Eyebrows
  ctx.strokeStyle = "#7c3a16";
  ctx.lineWidth = Math.max(0.9, w * 0.011);
  ctx.beginPath();
  ctx.moveTo(w * 0.345, h * 0.398);
  ctx.quadraticCurveTo(w * 0.392, h * 0.375, w * 0.442, h * 0.398);
  ctx.moveTo(w * 0.505, h * 0.396);
  ctx.quadraticCurveTo(w * 0.558, h * 0.372, w * 0.612, h * 0.398);
  ctx.stroke();

  // Warm Hazel-Amber Eyes
  for (const [ex, ey] of [
    [w * 0.398, h * 0.422],
    [w * 0.555, h * 0.421],
  ] as const) {
    // Sclera
    ctx.fillStyle = "#fdf8f5";
    ctx.beginPath();
    ctx.ellipse(ex, ey, w * 0.032, h * 0.011, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hazel-amber iris
    ctx.fillStyle = "#8c6224";
    ctx.beginPath();
    ctx.arc(ex + w * 0.003, ey, w * 0.014, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = "#1c1917";
    ctx.beginPath();
    ctx.arc(ex + w * 0.003, ey, w * 0.006, 0, Math.PI * 2);
    ctx.fill();

    // Catchlight
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ex - w * 0.002, ey - h * 0.003, w * 0.0035, 0, Math.PI * 2);
    ctx.fill();

    // Upper eyelid lash line
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = Math.max(0.9, w * 0.01);
    ctx.beginPath();
    ctx.arc(ex, ey + h * 0.004, w * 0.032, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }

  // Sculpted Nose Bridge & Nostrils
  ctx.strokeStyle = "#a86c4f";
  ctx.lineWidth = Math.max(0.9, w * 0.01);
  ctx.beginPath();
  ctx.moveTo(w * 0.468, h * 0.41);
  ctx.lineTo(w * 0.456, h * 0.472);
  ctx.quadraticCurveTo(w * 0.472, h * 0.486, w * 0.495, h * 0.474);
  ctx.stroke();

  // Signature Crimson-Red Thread Nose-Chain Draped Across Cheeks & Over Nose Bridge
  ctx.strokeStyle = "#b91c1c";
  ctx.lineWidth = Math.max(1.1, w * 0.012);
  ctx.beginPath();
  ctx.moveTo(w * 0.322, h * 0.452);
  ctx.quadraticCurveTo(w * 0.382, h * 0.475, w * 0.442, h * 0.448);
  // Arch over the nose bridge
  ctx.quadraticCurveTo(w * 0.464, h * 0.432, w * 0.488, h * 0.448);
  // Swoop across right cheek to right ear
  ctx.quadraticCurveTo(w * 0.565, h * 0.482, w * 0.658, h * 0.45);
  ctx.stroke();

  // 6 Luminous Silver-White Pearl Droplets Hanging from the Red Nose-Chain (3 left, 3 right)
  const chainPearls: [number, number][] = [
    [0.332, 0.463],
    [0.354, 0.47],
    [0.391, 0.475],
    [0.514, 0.471],
    [0.562, 0.479],
    [0.614, 0.472],
  ];
  for (const [px, py] of chainPearls) {
    ctx.fillStyle = "#94a3b8";
    ctx.beginPath();
    ctx.arc(w * px, h * py, w * 0.0125, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(
      w * px - w * 0.002,
      h * py - h * 0.001,
      w * 0.0095,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Tiny blue-silver center lustre dot
    ctx.fillStyle = "#64748b";
    ctx.beginPath();
    ctx.arc(w * px + w * 0.002, h * py + h * 0.001, w * 0.003, 0, Math.PI * 2);
    ctx.fill();
  }

  // Full Sculpted Peach-Terracotta Lips
  // Upper lip with sharp Cupid's bow
  ctx.fillStyle = "#c96a4b";
  ctx.beginPath();
  ctx.moveTo(w * 0.426, h * 0.52);
  ctx.quadraticCurveTo(w * 0.45, h * 0.504, w * 0.468, h * 0.512);
  ctx.quadraticCurveTo(w * 0.486, h * 0.504, w * 0.516, h * 0.522);
  ctx.quadraticCurveTo(w * 0.47, h * 0.524, w * 0.426, h * 0.52);
  ctx.closePath();
  ctx.fill();

  // Full lower lip
  ctx.fillStyle = "#e69577";
  ctx.beginPath();
  ctx.moveTo(w * 0.428, h * 0.521);
  ctx.quadraticCurveTo(w * 0.47, h * 0.546, w * 0.514, h * 0.522);
  ctx.quadraticCurveTo(w * 0.47, h * 0.524, w * 0.428, h * 0.521);
  ctx.closePath();
  ctx.fill();

  // Lower lip gloss highlight
  ctx.fillStyle = "rgba(255, 247, 237, 0.55)";
  ctx.beginPath();
  ctx.ellipse(w * 0.468, h * 0.53, w * 0.02, h * 0.004, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

/**
 * Draws the detailed 2D illustration for the Coup "Ambassador" card matching the reference artwork
 * (without any text on the card):
 * - Warm dusty ochre/olive-gold sky, hazy horizon cityscape, elevated concrete landing sky-pads
 *   (left pad with 2 tiny dark standing silhouettes conversing, right pad with a parked golden-bronze
 *   sci-fi speeder/shuttle), and flying speeders (including one on the upper-right with twin blue thrusters)
 * - Top-right chartreuse/lime-green geometric emblem: central hollow diamond flanked by inward-pointing
 *   Top, Left, Right triangles and 2 stacked upward-pointing Bottom triangles
 * - Mature diplomatic portrait with a richly pleated saffron-orange wrapped turban (pagri),
 *   furrowed brow, shrewd dark eyes with crow's-feet, and a thick drooping dark mustache
 * - Ornate black/orange/gold patterned silk cravat tucked into an olive-green coat with gold-piped
 *   botanical leaf-brocade lapels
 */
export function drawAmbassadorCard2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  ctx.translate(x, y);

  // 1. Dusty Ochre / Olive-Gold Sky, Distant City Horizon & Elevated Landing Sky-Pads
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, "#bda758");
  skyGrad.addColorStop(0.28, "#cfba6d");
  skyGrad.addColorStop(0.47, "#e2d49e");
  skyGrad.addColorStop(0.62, "#b59d5c");
  skyGrad.addColorStop(1, "#1e2210");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Distant hazy city buildings along the mid-horizon (between y = 0.45*h and 0.68*h)
  ctx.fillStyle = "rgba(148, 126, 74, 0.55)";
  for (const [bx, by, bw, bh] of [
    [0.02, 0.45, 0.08, 0.2],
    [0.12, 0.46, 0.14, 0.2],
    [0.64, 0.45, 0.12, 0.22],
    [0.78, 0.44, 0.18, 0.22],
  ] as const) {
    ctx.fillRect(w * bx, h * by, w * bw, h * bh);
  }

  // Elevated Concrete Sky-Pads / Landing Platforms (Left & Right)
  // Right sky-pad pedestal & platform
  ctx.fillStyle = "#5c5d4e";
  ctx.beginPath();
  ctx.moveTo(w * 0.61, h * 0.505);
  ctx.lineTo(w, h * 0.495);
  ctx.lineTo(w, h * 0.675);
  ctx.lineTo(w * 0.91, h * 0.675);
  ctx.quadraticCurveTo(w * 0.91, h * 0.545, w * 0.75, h * 0.54);
  ctx.lineTo(w * 0.61, h * 0.53);
  ctx.closePath();
  ctx.fill();

  // Right sky-pad sunlit concrete top deck
  ctx.fillStyle = "#d9d1b8";
  ctx.beginPath();
  ctx.moveTo(w * 0.61, h * 0.505);
  ctx.quadraticCurveTo(w * 0.75, h * 0.48, w, h * 0.485);
  ctx.lineTo(w, h * 0.515);
  ctx.quadraticCurveTo(w * 0.78, h * 0.52, w * 0.61, h * 0.508);
  ctx.closePath();
  ctx.fill();

  // Left sky-pad underside & sunlit top deck
  ctx.fillStyle = "#535243";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.555);
  ctx.lineTo(w * 0.31, h * 0.535);
  ctx.lineTo(w * 0.31, h * 0.575);
  ctx.lineTo(w * 0.12, h * 0.65);
  ctx.lineTo(0, h * 0.67);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#e0d8c0";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.508);
  ctx.quadraticCurveTo(w * 0.16, h * 0.5, w * 0.31, h * 0.535);
  ctx.lineTo(w * 0.16, h * 0.575);
  ctx.lineTo(0, h * 0.56);
  ctx.closePath();
  ctx.fill();

  // Two tiny dark standing silhouettes conversing on the Left Sky-Pad
  ctx.fillStyle = "#26281e";
  for (const [px, py, ph] of [
    [0.104, 0.478, 0.064],
    [0.142, 0.474, 0.068],
  ] as const) {
    // Head
    ctx.beginPath();
    ctx.arc(w * px, h * py, w * 0.009, 0, Math.PI * 2);
    ctx.fill();
    // Torso & coat
    ctx.fillRect(w * (px - 0.011), h * (py + 0.008), w * 0.022, h * ph * 0.55);
    // Legs
    ctx.fillRect(
      w * (px - 0.009),
      h * (py + 0.008 + ph * 0.55),
      w * 0.007,
      h * ph * 0.42
    );
    ctx.fillRect(
      w * (px + 0.002),
      h * (py + 0.008 + ph * 0.55),
      w * 0.007,
      h * ph * 0.42
    );
  }

  // Parked Golden-Bronze Sci-Fi Shuttle/Speeder on the Right Sky-Pad
  ctx.save();
  ctx.fillStyle = "#a1712c";
  ctx.strokeStyle = "#3f2b12";
  ctx.lineWidth = Math.max(0.6, w * 0.007);
  ctx.beginPath();
  ctx.moveTo(w * 0.76, h * 0.484);
  ctx.lineTo(w * 0.785, h * 0.452);
  ctx.lineTo(w * 0.875, h * 0.462);
  ctx.lineTo(w * 0.952, h * 0.482);
  ctx.lineTo(w * 0.845, h * 0.495);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Shuttle cockpit canopy highlight
  ctx.fillStyle = "#fef3c7";
  ctx.beginPath();
  ctx.moveTo(w * 0.855, h * 0.464);
  ctx.lineTo(w * 0.922, h * 0.477);
  ctx.lineTo(w * 0.865, h * 0.479);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Flying Speeders in the Sky (Upper-Right Speeder with Twin Glowing Blue Engine Thrusters)
  ctx.fillStyle = "#8a5a24";
  ctx.beginPath();
  ctx.moveTo(w * 0.805, h * 0.238);
  ctx.lineTo(w * 0.865, h * 0.222);
  ctx.lineTo(w * 0.915, h * 0.236);
  ctx.lineTo(w * 0.855, h * 0.244);
  ctx.closePath();
  ctx.fill();

  // Twin glowing blue rear engine thrusters on the upper-right speeder
  for (const tx of [w * 0.872, w * 0.896]) {
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(tx, h * 0.235, w * 0.01, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e0f2fe";
    ctx.beginPath();
    ctx.arc(tx, h * 0.235, w * 0.005, 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant smaller flying craft silhouettes on upper-left & top-center
  ctx.fillStyle = "rgba(138, 92, 36, 0.72)";
  for (const [fx, fy, fw] of [
    [0.18, 0.232, 0.065],
    [0.105, 0.278, 0.025],
    [0.578, 0.142, 0.032],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(w * (fx - fw * 0.5), h * fy);
    ctx.lineTo(w * fx, h * (fy - 0.008));
    ctx.lineTo(w * (fx + fw * 0.5), h * fy);
    ctx.closePath();
    ctx.fill();
  }

  // 2. Top-Right Chartreuse / Lime-Green Geometric Emblem (Hollow Diamond + 3 Inward Triangles + 2 Stacked Bottom Triangles)
  ctx.save();
  const emCx = w * 0.756;
  const emCy = h * 0.165;
  const emS = w * 0.22;

  ctx.shadowColor = "rgba(0, 0, 0, 0.38)";
  ctx.shadowBlur = Math.max(2, w * 0.022);

  const limeGrad = ctx.createLinearGradient(
    emCx - emS * 0.5,
    emCy - emS * 0.5,
    emCx + emS * 0.5,
    emCy + emS * 0.5
  );
  limeGrad.addColorStop(0, "#d9f928");
  limeGrad.addColorStop(0.55, "#b5db18");
  limeGrad.addColorStop(1, "#84a80c");
  ctx.fillStyle = limeGrad;
  ctx.strokeStyle = "#6d8c08";
  ctx.lineWidth = Math.max(0.7, w * 0.008);

  // Central Hollow Diamond (outer diamond CW + inner diamond cutout CCW)
  const dOut = emS * 0.24;
  const dIn = emS * 0.1;
  ctx.beginPath();
  ctx.moveTo(emCx, emCy - dOut);
  ctx.lineTo(emCx + dOut, emCy);
  ctx.lineTo(emCx, emCy + dOut);
  ctx.lineTo(emCx - dOut, emCy);
  ctx.closePath();
  // Inner diamond hole (counter-clockwise)
  ctx.moveTo(emCx, emCy - dIn);
  ctx.lineTo(emCx - dIn, emCy);
  ctx.lineTo(emCx, emCy + dIn);
  ctx.lineTo(emCx + dIn, emCy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Top triangle pointing DOWN toward top vertex
  const triW = emS * 0.165;
  const triH = emS * 0.125;
  ctx.beginPath();
  ctx.moveTo(emCx - triW, emCy - dOut - emS * 0.19);
  ctx.lineTo(emCx + triW, emCy - dOut - emS * 0.19);
  ctx.lineTo(emCx, emCy - dOut - emS * 0.19 + triH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Left triangle pointing RIGHT toward left vertex
  ctx.beginPath();
  ctx.moveTo(emCx - dOut - emS * 0.26, emCy - triW);
  ctx.lineTo(emCx - dOut - emS * 0.26, emCy + triW);
  ctx.lineTo(emCx - dOut - emS * 0.26 + triH, emCy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right triangle pointing LEFT toward right vertex
  ctx.beginPath();
  ctx.moveTo(emCx + dOut + emS * 0.26, emCy - triW);
  ctx.lineTo(emCx + dOut + emS * 0.26, emCy + triW);
  ctx.lineTo(emCx + dOut + emS * 0.26 - triH, emCy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bottom TWO stacked triangles pointing UP toward bottom vertex
  for (const offset of [0.06, 0.19]) {
    const tipY = emCy + dOut + emS * offset;
    ctx.beginPath();
    ctx.moveTo(emCx, tipY);
    ctx.lineTo(emCx + triW, tipY + triH);
    ctx.lineTo(emCx - triW, tipY + triH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // 3. Olive-Green Diplomatic Coat, Gold-Piped Botanical Brocade Lapels & Ornate Silk Cravat
  ctx.save();
  // Outer Olive-Khaki Coat Shoulders & Sleeves
  const coatGrad = ctx.createLinearGradient(0, h * 0.56, w, h);
  coatGrad.addColorStop(0, "#757548");
  coatGrad.addColorStop(0.5, "#4a4c29");
  coatGrad.addColorStop(1, "#1e200e");
  ctx.fillStyle = coatGrad;
  ctx.beginPath();
  ctx.moveTo(-w * 0.02, h);
  ctx.lineTo(w * 0.08, h * 0.675);
  ctx.quadraticCurveTo(w * 0.2, h * 0.625, w * 0.31, h * 0.6);
  ctx.lineTo(w * 0.67, h * 0.585);
  ctx.quadraticCurveTo(w * 0.85, h * 0.63, w * 0.93, h * 0.675);
  ctx.lineTo(w * 1.03, h);
  ctx.closePath();
  ctx.fill();

  // Inner Emerald-Olive Waistcoat / Vest
  const vestGrad = ctx.createLinearGradient(0, h * 0.68, 0, h);
  vestGrad.addColorStop(0, "#4e6e32");
  vestGrad.addColorStop(1, "#1b2910");
  ctx.fillStyle = vestGrad;
  ctx.beginPath();
  ctx.moveTo(w * 0.24, h);
  ctx.lineTo(w * 0.31, h * 0.68);
  ctx.lineTo(w * 0.64, h * 0.68);
  ctx.lineTo(w * 0.71, h);
  ctx.closePath();
  ctx.fill();

  // Dark crimson waistcoat button near bottom center
  ctx.fillStyle = "#450a0a";
  ctx.beginPath();
  ctx.arc(w * 0.386, h * 0.945, w * 0.018, 0, Math.PI * 2);
  ctx.fill();

  // Wide Botanical Leaf-Brocade Lapels Edged with Bright Gold Piping
  const lapelGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
  lapelGrad.addColorStop(0, "#557538");
  lapelGrad.addColorStop(0.6, "#374f21");
  lapelGrad.addColorStop(1, "#1a280e");
  ctx.fillStyle = lapelGrad;
  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = Math.max(1.2, w * 0.013);

  // Left notched brocade lapel
  ctx.beginPath();
  ctx.moveTo(w * 0.3, h * 0.62);
  ctx.lineTo(w * 0.145, h * 0.765);
  ctx.lineTo(w * 0.22, h * 0.82);
  ctx.lineTo(w * 0.15, h);
  ctx.lineTo(w * 0.26, h);
  ctx.lineTo(w * 0.33, h * 0.78);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right notched brocade lapel
  ctx.beginPath();
  ctx.moveTo(w * 0.675, h * 0.59);
  ctx.lineTo(w * 0.685, h * 0.695);
  ctx.lineTo(w * 0.778, h * 0.785);
  ctx.lineTo(w * 0.72, h * 0.84);
  ctx.lineTo(w * 0.74, h);
  ctx.lineTo(w * 0.51, h);
  ctx.lineTo(w * 0.585, h * 0.695);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Botanical Leaf & Vine Brocade Embroidery on the Right & Left Lapels
  ctx.strokeStyle = "rgba(180, 198, 108, 0.55)";
  ctx.fillStyle = "rgba(163, 184, 88, 0.45)";
  ctx.lineWidth = Math.max(0.7, w * 0.008);
  for (const [lx, ly] of [
    [0.22, 0.73],
    [0.25, 0.78],
    [0.64, 0.71],
    [0.68, 0.76],
    [0.62, 0.81],
    [0.66, 0.86],
    [0.61, 0.91],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(w * lx, h * ly, w * 0.026, h * 0.011, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // White Shirt Collar Peeking Under the Chin
  ctx.fillStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.moveTo(w * 0.34, h * 0.585);
  ctx.lineTo(w * 0.44, h * 0.635);
  ctx.lineTo(w * 0.57, h * 0.585);
  ctx.lineTo(w * 0.6, h * 0.52);
  ctx.lineTo(w * 0.34, h * 0.55);
  ctx.closePath();
  ctx.fill();

  // Ornate Black, Saffron-Orange & Gold Patterned Silk Cravat / Ascot Scarf
  const cravatGrad = ctx.createLinearGradient(
    w * 0.29,
    h * 0.53,
    w * 0.67,
    h * 0.84
  );
  cravatGrad.addColorStop(0, "#451a03");
  cravatGrad.addColorStop(0.5, "#1c120c");
  cravatGrad.addColorStop(1, "#291509");
  ctx.fillStyle = cravatGrad;
  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = Math.max(0.9, w * 0.01);

  ctx.beginPath();
  ctx.moveTo(w * 0.31, h * 0.555);
  ctx.quadraticCurveTo(w * 0.45, h * 0.65, w * 0.605, h * 0.51);
  ctx.quadraticCurveTo(w * 0.675, h * 0.575, w * 0.645, h * 0.645);
  ctx.quadraticCurveTo(w * 0.54, h * 0.72, w * 0.445, h * 0.75);
  ctx.lineTo(w * 0.39, h * 0.855);
  ctx.lineTo(w * 0.32, h * 0.74);
  ctx.quadraticCurveTo(w * 0.285, h * 0.64, w * 0.31, h * 0.555);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glowing Saffron-Orange & Gold Paisley Scroll Motifs across the Silk Cravat
  for (const [px, py, pr] of [
    [0.37, 0.62, 0.022],
    [0.45, 0.64, 0.025],
    [0.54, 0.625, 0.024],
    [0.6, 0.585, 0.02],
    [0.38, 0.7, 0.026],
    [0.42, 0.745, 0.024],
    [0.39, 0.795, 0.018],
  ] as const) {
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = Math.max(1.2, w * 0.014);
    ctx.beginPath();
    ctx.arc(w * px, h * py, w * pr, 0, Math.PI * 1.75);
    ctx.stroke();

    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(w * px, h * py, w * pr * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 4. The Ambassador's Mature Portrait, Bushy Mustache & Saffron-Orange Wrapped Turban
  ctx.save();
  const faceCx = w * 0.43;
  const faceCy = h * 0.435;

  // Right Ear (on viewer's right, below turban edge)
  ctx.fillStyle = "#a36c52";
  ctx.strokeStyle = "#6e422e";
  ctx.lineWidth = Math.max(0.8, w * 0.009);
  ctx.beginPath();
  ctx.ellipse(
    w * 0.612,
    h * 0.458,
    w * 0.026,
    h * 0.042,
    0.18,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  // Ruddy-Tan / Olive-Brown Face, Cheeks & Double Chin
  const faceGrad = ctx.createRadialGradient(
    faceCx - w * 0.02,
    faceCy - h * 0.02,
    w * 0.02,
    faceCx,
    faceCy,
    w * 0.22
  );
  faceGrad.addColorStop(0, "#e0a889");
  faceGrad.addColorStop(0.55, "#bf8162");
  faceGrad.addColorStop(1, "#784732");
  ctx.fillStyle = faceGrad;
  ctx.strokeStyle = "#5e3422";
  ctx.lineWidth = Math.max(0.8, w * 0.009);

  ctx.beginPath();
  ctx.moveTo(w * 0.258, h * 0.375);
  // Left cheek down to rounded jowl and chin
  ctx.quadraticCurveTo(w * 0.265, h * 0.54, w * 0.375, h * 0.585);
  ctx.quadraticCurveTo(w * 0.475, h * 0.605, w * 0.598, h * 0.515);
  ctx.lineTo(w * 0.61, h * 0.425);
  ctx.lineTo(w * 0.41, h * 0.31);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Grey sideburn hair temple tuft next to right ear
  ctx.fillStyle = "#4b4846";
  ctx.beginPath();
  ctx.moveTo(w * 0.565, h * 0.405);
  ctx.lineTo(w * 0.608, h * 0.44);
  ctx.lineTo(w * 0.585, h * 0.455);
  ctx.closePath();
  ctx.fill();

  // Furrowed Forehead & Brow Crease Lines
  ctx.strokeStyle = "rgba(92, 48, 32, 0.65)";
  ctx.lineWidth = Math.max(0.8, w * 0.009);
  ctx.beginPath();
  ctx.moveTo(w * 0.32, h * 0.362);
  ctx.quadraticCurveTo(w * 0.37, h * 0.355, w * 0.43, h * 0.364);
  // Vertical frown lines between eyebrows
  ctx.moveTo(w * 0.348, h * 0.368);
  ctx.lineTo(w * 0.352, h * 0.392);
  ctx.moveTo(w * 0.372, h * 0.366);
  ctx.lineTo(w * 0.372, h * 0.392);
  ctx.stroke();

  // Thick Dark Salt-and-Pepper Eyebrows
  ctx.strokeStyle = "#292524";
  ctx.lineWidth = Math.max(1.6, w * 0.018);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(w * 0.268, h * 0.398);
  ctx.quadraticCurveTo(w * 0.305, h * 0.382, w * 0.345, h * 0.395);
  ctx.moveTo(w * 0.388, h * 0.392);
  ctx.quadraticCurveTo(w * 0.438, h * 0.372, w * 0.488, h * 0.392);
  ctx.stroke();

  // Shrewd Dark Eyes with Crow's-Feet Wrinkles
  for (const [ex, ey, ew] of [
    [w * 0.312, h * 0.414, w * 0.025],
    [w * 0.435, h * 0.408, w * 0.028],
  ] as const) {
    // Eye white
    ctx.fillStyle = "#f1e9e4";
    ctx.beginPath();
    ctx.ellipse(ex, ey, ew, h * 0.009, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark brown-black iris & pupil
    ctx.fillStyle = "#1c1917";
    ctx.beginPath();
    ctx.arc(ex - w * 0.003, ey, ew * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Sharp white eye glint
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ex - w * 0.006, ey - h * 0.002, ew * 0.17, 0, Math.PI * 2);
    ctx.fill();

    // Upper eyelid fold
    ctx.strokeStyle = "#3b1f14";
    ctx.lineWidth = Math.max(0.9, w * 0.01);
    ctx.beginPath();
    ctx.arc(ex, ey + h * 0.003, ew, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
  }

  // Crow's-feet & under-eye pouch creases
  ctx.strokeStyle = "rgba(92, 48, 32, 0.55)";
  ctx.lineWidth = Math.max(0.7, w * 0.008);
  ctx.beginPath();
  ctx.moveTo(w * 0.468, h * 0.408);
  ctx.lineTo(w * 0.508, h * 0.415);
  ctx.moveTo(w * 0.465, h * 0.414);
  ctx.lineTo(w * 0.498, h * 0.426);
  ctx.stroke();

  // Broad Sculpted Nose & Nostrils
  ctx.fillStyle = "rgba(110, 62, 42, 0.42)";
  ctx.beginPath();
  ctx.moveTo(w * 0.355, h * 0.398);
  ctx.lineTo(w * 0.322, h * 0.458);
  ctx.quadraticCurveTo(w * 0.358, h * 0.48, w * 0.405, h * 0.465);
  ctx.lineTo(w * 0.375, h * 0.4);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#5c3120";
  ctx.lineWidth = Math.max(1, w * 0.011);
  ctx.beginPath();
  ctx.moveTo(w * 0.355, h * 0.4);
  ctx.lineTo(w * 0.324, h * 0.458);
  ctx.quadraticCurveTo(w * 0.36, h * 0.476, w * 0.402, h * 0.462);
  ctx.stroke();

  // Signature Bushy Dark Salt-and-Pepper Drooping Mustache
  ctx.fillStyle = "#262322";
  ctx.strokeStyle = "#44403c";
  ctx.lineWidth = Math.max(0.8, w * 0.009);
  ctx.beginPath();
  // Center philtrum dip
  ctx.moveTo(w * 0.362, h * 0.49);
  // Left drooping mustache tip
  ctx.quadraticCurveTo(w * 0.305, h * 0.485, w * 0.28, h * 0.522);
  ctx.quadraticCurveTo(w * 0.292, h * 0.532, w * 0.315, h * 0.512);
  ctx.quadraticCurveTo(w * 0.34, h * 0.502, w * 0.362, h * 0.504);
  // Right drooping mustache tip
  ctx.quadraticCurveTo(w * 0.405, h * 0.502, w * 0.448, h * 0.538);
  ctx.quadraticCurveTo(w * 0.465, h * 0.525, w * 0.445, h * 0.495);
  ctx.quadraticCurveTo(w * 0.405, h * 0.482, w * 0.362, h * 0.49);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Lower Lip & Chin Shadow under the Mustache
  ctx.fillStyle = "#96604c";
  ctx.beginPath();
  ctx.ellipse(w * 0.366, h * 0.515, w * 0.042, h * 0.009, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(87, 46, 31, 0.6)";
  ctx.lineWidth = Math.max(0.9, w * 0.01);
  ctx.beginPath();
  ctx.arc(w * 0.375, h * 0.542, w * 0.055, Math.PI * 0.18, Math.PI * 0.82);
  ctx.stroke();

  // 5. Large Richly Pleated Saffron-Orange Wrapped Turban (Pagri)
  const turbGrad = ctx.createRadialGradient(
    w * 0.46,
    h * 0.24,
    w * 0.04,
    w * 0.47,
    h * 0.29,
    w * 0.3
  );
  turbGrad.addColorStop(0, "#fdb849");
  turbGrad.addColorStop(0.5, "#f27d16");
  turbGrad.addColorStop(0.85, "#c24e08");
  turbGrad.addColorStop(1, "#7c2d05");
  ctx.fillStyle = turbGrad;
  ctx.strokeStyle = "#8c3306";
  ctx.lineWidth = Math.max(0.9, w * 0.01);

  ctx.beginPath();
  // Bottom-left brow edge of turban
  ctx.moveTo(w * 0.248, h * 0.388);
  ctx.quadraticCurveTo(w * 0.195, h * 0.33, w * 0.228, h * 0.27);
  // Left upper swell to high rounded saffron crown
  ctx.quadraticCurveTo(w * 0.29, h * 0.205, w * 0.475, h * 0.172);
  // Right upper slope down to wide right turban side
  ctx.quadraticCurveTo(w * 0.695, h * 0.23, w * 0.72, h * 0.312);
  ctx.quadraticCurveTo(w * 0.71, h * 0.39, w * 0.625, h * 0.44);
  // Diagonal inner turban fold sweeping from right ear up-left across the forehead
  ctx.quadraticCurveTo(w * 0.51, h * 0.355, w * 0.365, h * 0.312);
  // Left overlapping brow band fold
  ctx.quadraticCurveTo(w * 0.295, h * 0.34, w * 0.248, h * 0.388);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Overlapping Diagonal Cloth Pleat Creases Across the Saffron Turban
  ctx.strokeStyle = "rgba(124, 45, 18, 0.62)";
  ctx.lineWidth = Math.max(1, w * 0.011);
  for (const [x1, y1, cx1, cy1, x2, y2] of [
    [0.24, 0.27, 0.46, 0.295, 0.695, 0.375],
    [0.275, 0.238, 0.49, 0.26, 0.71, 0.34],
    [0.335, 0.205, 0.53, 0.23, 0.712, 0.305],
    [0.23, 0.305, 0.42, 0.33, 0.655, 0.412],
    [0.225, 0.345, 0.295, 0.325, 0.365, 0.312],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(w * x1, h * y1);
    ctx.quadraticCurveTo(w * cx1, h * cy1, w * x2, h * y2);
    ctx.stroke();
  }

  // Sunlit golden-orange highlight ridges along the top turban pleats
  ctx.strokeStyle = "rgba(254, 215, 102, 0.55)";
  ctx.lineWidth = Math.max(1, w * 0.011);
  for (const [x1, y1, cx1, cy1, x2, y2] of [
    [0.31, 0.22, 0.48, 0.238, 0.66, 0.295],
    [0.265, 0.254, 0.46, 0.275, 0.65, 0.335],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(w * x1, h * y1);
    ctx.quadraticCurveTo(w * cx1, h * cy1, w * x2, h * y2);
    ctx.stroke();
  }

  ctx.restore();
  ctx.restore();
}

/**
 * Draws the detailed 2D illustration for the Coup "Captain" card matching the reference artwork
 * (without any text on the card):
 * - Cool slate-blue orbital lunar/planetary surface backdrop with white tactical HUD telemetry
 *   reticles, left radar tick ring, upper targeting box, and lower-right dashed trajectory waypoints
 * - Top-right electric sky-blue naval insignia: upward arrow rising from a winged chevron above
 *   two nested V-chevrons
 * - Fierce Captain portrait with shaved sides, dark mohawk crest with vibrant electric-cyan highlights,
 *   a jagged diagonal battle scar cutting from inside the mohawk down through the right eyebrow & cheek,
 *   piercing icy-blue eyes, upward-curled handlebar mustache, and full chin goatee
 * - High-collared Prussian-teal naval greatcoat with an asymmetric diagonal chest plastron fastened by
 *   two ornate silver twin-prong shoulder buckles and lavish raised 3D gold baroque scrollwork embroidery
 */
export function drawCaptainCard2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  ctx.translate(x, y);

  // 1. Slate-Blue Outer Sky & Orbital Cratered Lunar/Planetary Globe Backdrop
  ctx.fillStyle = "#6287a2";
  ctx.fillRect(0, 0, w, h);

  // Large Orbital Lunar/Planetary Globe occupying the upper & middle backdrop
  const globeCx = w * 0.62;
  const globeCy = h * 0.16;
  const globeR = w * 0.72;

  ctx.save();
  ctx.beginPath();
  ctx.arc(globeCx, globeCy, globeR, 0, Math.PI * 2);
  ctx.clip();

  const globeGrad = ctx.createRadialGradient(
    w * 0.18,
    h * 0.06,
    w * 0.05,
    w * 0.55,
    h * 0.3,
    w * 0.85
  );
  globeGrad.addColorStop(0, "#b8d2e3");
  globeGrad.addColorStop(0.42, "#7ca0b8");
  globeGrad.addColorStop(0.75, "#4c6c80");
  globeGrad.addColorStop(1, "#233745");
  ctx.fillStyle = globeGrad;
  ctx.fillRect(0, 0, w, h * 0.75);

  // Subtle Lunar Crater Rings & Surface Texture patches on the planet globe
  for (const [cx, cy, cr, alpha] of [
    [0.84, 0.29, 0.065, 0.22],
    [0.74, 0.36, 0.048, 0.18],
    [0.91, 0.42, 0.055, 0.2],
    [0.21, 0.21, 0.04, 0.16],
    [0.32, 0.14, 0.05, 0.14],
    [0.65, 0.08, 0.07, 0.16],
  ] as const) {
    ctx.fillStyle = `rgba(30, 49, 61, ${alpha})`;
    ctx.beginPath();
    ctx.arc(w * cx, h * cy, w * cr, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(186, 214, 232, ${alpha * 0.9})`;
    ctx.lineWidth = Math.max(0.6, w * 0.007);
    ctx.beginPath();
    ctx.arc(w * cx, h * cy, w * cr, -Math.PI * 0.85, Math.PI * 0.15);
    ctx.stroke();
  }
  ctx.restore();

  // 2. White Tactical Sci-Fi HUD & Orbital Telemetry Overlay Graphics
  ctx.save();
  // Upper-left circular target reticle + outer dashed arc + diagonal callout line
  const retX = w * 0.188;
  const retY = h * 0.205;
  const retR = w * 0.082;
  ctx.strokeStyle = "rgba(241, 245, 249, 0.75)";
  ctx.lineWidth = Math.max(0.8, w * 0.009);
  ctx.beginPath();
  ctx.arc(retX, retY, retR, 0, Math.PI * 2);
  ctx.stroke();

  // Outer dashed arc around upper-left reticle
  ctx.save();
  ctx.setLineDash([Math.max(2, w * 0.025), Math.max(2, w * 0.02)]);
  ctx.beginPath();
  ctx.arc(retX, retY, retR * 1.48, -Math.PI * 0.68, -Math.PI * 0.12);
  ctx.stroke();
  ctx.restore();

  // Diagonal callout line up to telemetry header bar
  ctx.beginPath();
  ctx.moveTo(retX + retR * 0.65, retY - retR * 0.65);
  ctx.lineTo(w * 0.34, h * 0.075);
  ctx.lineTo(w * 0.62, h * 0.075);
  ctx.stroke();

  // Far-left circular radar compass ring with tick marks
  const radX = w * 0.042;
  const radY = h * 0.382;
  const radR = w * 0.095;
  ctx.strokeStyle = "rgba(226, 232, 240, 0.55)";
  ctx.lineWidth = Math.max(0.7, w * 0.008);
  ctx.beginPath();
  ctx.arc(radX, radY, radR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(radX, radY, radR * 0.82, 0, Math.PI * 2);
  ctx.stroke();

  // Radar degree tick marks around the ring
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12;
    ctx.beginPath();
    ctx.moveTo(radX + Math.cos(a) * radR * 0.82, radY + Math.sin(a) * radR * 0.82);
    ctx.lineTo(radX + Math.cos(a) * radR, radY + Math.sin(a) * radR);
    ctx.stroke();
  }

  // White rectangular HUD framing box behind the top-right Captain emblem
  ctx.strokeStyle = "rgba(248, 250, 252, 0.88)";
  ctx.lineWidth = Math.max(1.5, w * 0.018);
  ctx.beginPath();
  ctx.moveTo(w * 0.505, h * 0.155);
  ctx.lineTo(w * 0.505, h * 0.118);
  ctx.lineTo(w * 0.675, h * 0.118);
  ctx.moveTo(w * 0.64, h * 0.232);
  ctx.lineTo(w * 0.805, h * 0.232);
  ctx.lineTo(w * 0.805, h * 0.195);
  ctx.stroke();

  // Thin outer HUD frame lines around the top-right box
  ctx.strokeStyle = "rgba(226, 232, 240, 0.5)";
  ctx.lineWidth = Math.max(0.6, w * 0.007);
  ctx.strokeRect(w * 0.53, h * 0.105, w * 0.315, h * 0.155);

  // Dashed white orbital trajectory path & glowing bullseye waypoint nodes (left & right of head)
  ctx.save();
  ctx.strokeStyle = "rgba(248, 250, 252, 0.85)";
  ctx.lineWidth = Math.max(1, w * 0.011);
  ctx.setLineDash([Math.max(2.5, w * 0.025), Math.max(2, w * 0.02)]);
  ctx.beginPath();
  ctx.moveTo(w * 0.18, h * 0.365);
  ctx.lineTo(w * 0.28, h * 0.398);
  ctx.moveTo(w * 0.64, h * 0.482);
  ctx.lineTo(w * 0.788, h * 0.514);
  ctx.lineTo(w * 0.99, h * 0.452);
  ctx.stroke();
  ctx.restore();

  // Prominent glowing bullseye waypoint node at (0.788 * w, 0.514 * h)
  const wpX = w * 0.788;
  const wpY = h * 0.514;
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = Math.max(1.2, w * 0.014);
  ctx.beginPath();
  ctx.arc(wpX, wpY, w * 0.026, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(wpX, wpY, w * 0.008, 0, Math.PI * 2);
  ctx.fill();

  // Secondary smaller waypoint node above at (0.775 * w, 0.392 * h)
  ctx.lineWidth = Math.max(0.8, w * 0.009);
  ctx.beginPath();
  ctx.arc(w * 0.775, h * 0.392, w * 0.016, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w * 0.775, h * 0.392, w * 0.005, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. Top-Right Sky-Blue Naval Chevron & Upward Arrow Anchor Insignia
  ctx.save();
  const emX = w * 0.752;
  const emY = h * 0.172;
  const emS = w * 0.24;

  ctx.shadowColor = "rgba(0, 0, 0, 0.42)";
  ctx.shadowBlur = Math.max(2, w * 0.024);

  const blueEmGrad = ctx.createLinearGradient(
    emX - emS * 0.5,
    emY - emS * 0.45,
    emX + emS * 0.5,
    emY + emS * 0.45
  );
  blueEmGrad.addColorStop(0, "#67d4ff");
  blueEmGrad.addColorStop(0.5, "#38bdf8");
  blueEmGrad.addColorStop(1, "#0284c7");
  ctx.fillStyle = blueEmGrad;
  ctx.strokeStyle = "#0369a1";
  ctx.lineWidth = Math.max(0.7, w * 0.008);

  // Upper Piece: Central Upward Arrow Rising from a V-Winged Anchor Base
  ctx.beginPath();
  // Top arrow tip
  ctx.moveTo(emX, emY - emS * 0.45);
  ctx.lineTo(emX + emS * 0.14, emY - emS * 0.25);
  ctx.lineTo(emX + emS * 0.055, emY - emS * 0.25);
  // Down central shaft to right diagonal wing
  ctx.lineTo(emX + emS * 0.055, emY - emS * 0.04);
  ctx.lineTo(emX + emS * 0.23, emY - emS * 0.21);
  ctx.lineTo(emX + emS * 0.37, emY - emS * 0.21);
  ctx.lineTo(emX + emS * 0.1, emY + emS * 0.06);
  ctx.lineTo(emX - emS * 0.1, emY + emS * 0.06);
  // Left diagonal wing
  ctx.lineTo(emX - emS * 0.37, emY - emS * 0.21);
  ctx.lineTo(emX - emS * 0.23, emY - emS * 0.21);
  ctx.lineTo(emX - emS * 0.055, emY - emS * 0.04);
  // Up central shaft to left arrow barb
  ctx.lineTo(emX - emS * 0.055, emY - emS * 0.25);
  ctx.lineTo(emX - emS * 0.14, emY - emS * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Middle Nested V-Chevron Ribbon
  ctx.beginPath();
  ctx.moveTo(emX - emS * 0.28, emY - emS * 0.02);
  ctx.lineTo(emX - emS * 0.22, emY - emS * 0.07);
  ctx.lineTo(emX, emY + emS * 0.15);
  ctx.lineTo(emX + emS * 0.22, emY - emS * 0.07);
  ctx.lineTo(emX + emS * 0.28, emY - emS * 0.02);
  ctx.lineTo(emX, emY + emS * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Outer Bottom V-Chevron Ribbon
  ctx.beginPath();
  ctx.moveTo(emX - emS * 0.51, emY - emS * 0.04);
  ctx.lineTo(emX - emS * 0.42, emY - emS * 0.11);
  ctx.lineTo(emX, emY + emS * 0.3);
  ctx.lineTo(emX + emS * 0.42, emY - emS * 0.11);
  ctx.lineTo(emX + emS * 0.51, emY - emS * 0.04);
  ctx.lineTo(emX, emY + emS * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 4. Prussian-Teal Naval Greatcoat, High Upturned Collar, Twin Silver Shoulder Buckles & Gold-Filigree Plastron
  ctx.save();
  // High Upturned Prussian-Teal Collar Behind the Jaw & Goatee
  const collarGrad = ctx.createLinearGradient(
    w * 0.28,
    h * 0.44,
    w * 0.66,
    h * 0.62
  );
  collarGrad.addColorStop(0, "#0b5e8a");
  collarGrad.addColorStop(0.5, "#032033");
  collarGrad.addColorStop(1, "#094e73");
  ctx.fillStyle = collarGrad;
  ctx.strokeStyle = "#0ea5e9";
  ctx.lineWidth = Math.max(1, w * 0.011);

  ctx.beginPath();
  ctx.moveTo(w * 0.305, h * 0.445);
  ctx.lineTo(w * 0.35, h * 0.592);
  ctx.lineTo(w * 0.485, h * 0.61);
  ctx.lineTo(w * 0.62, h * 0.555);
  ctx.lineTo(w * 0.652, h * 0.452);
  ctx.lineTo(w * 0.305, h * 0.445);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Outer Prussian-Teal Naval Greatcoat Shoulders, Epaulets & Ribbed Sleeves
  const coatGrad = ctx.createLinearGradient(0, h * 0.54, w, h);
  coatGrad.addColorStop(0, "#0b5880");
  coatGrad.addColorStop(0.45, "#053652");
  coatGrad.addColorStop(1, "#02101c");
  ctx.fillStyle = coatGrad;
  ctx.beginPath();
  ctx.moveTo(-w * 0.03, h);
  ctx.lineTo(-w * 0.02, h * 0.66);
  ctx.quadraticCurveTo(w * 0.14, h * 0.58, w * 0.335, h * 0.53);
  ctx.lineTo(w * 0.635, h * 0.515);
  ctx.quadraticCurveTo(w * 0.82, h * 0.57, w * 1.03, h * 0.68);
  ctx.lineTo(w * 1.03, h);
  ctx.closePath();
  ctx.fill();

  // Ribbed Sleeve Stripes on Left & Right Outer Arms
  ctx.strokeStyle = "rgba(56, 189, 248, 0.38)";
  ctx.lineWidth = Math.max(1.2, w * 0.014);
  for (const sx of [0.02, 0.06, 0.89, 0.94, 0.98]) {
    ctx.beginPath();
    ctx.moveTo(w * sx, h * 0.72);
    ctx.lineTo(w * (sx + (sx < 0.5 ? -0.03 : 0.04)), h);
    ctx.stroke();
  }

  // Silver-Gold Piped Left & Right Shoulder Epaulet Flaps
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = Math.max(1.2, w * 0.013);
  ctx.beginPath();
  // Left shoulder seam
  ctx.moveTo(w * 0.072, h * 0.605);
  ctx.quadraticCurveTo(w * 0.16, h * 0.75, w * 0.33, h * 0.81);
  // Right shoulder strap panel holding the plastron buckles
  ctx.moveTo(w * 0.668, h * 0.518);
  ctx.lineTo(w * 0.585, h * 0.625);
  ctx.lineTo(w * 0.825, h * 0.775);
  ctx.lineTo(w * 0.92, h * 0.625);
  ctx.stroke();

  // Asymmetric Diagonal Prussian-Blue Plastron / Chest Shield Edged in Braided Antique Gold
  const plastronGrad = ctx.createLinearGradient(
    w * 0.25,
    h * 0.6,
    w * 0.78,
    h
  );
  plastronGrad.addColorStop(0, "#0b5c87");
  plastronGrad.addColorStop(0.5, "#053654");
  plastronGrad.addColorStop(1, "#021626");
  ctx.fillStyle = plastronGrad;
  ctx.strokeStyle = "#e2c15a";
  ctx.lineWidth = Math.max(1.8, w * 0.02);

  ctx.beginPath();
  ctx.moveTo(w * 0.535, h * 0.605);
  ctx.lineTo(w * 0.795, h * 0.728);
  ctx.lineTo(w * 0.63, h);
  ctx.lineTo(w * 0.22, h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Two Ornate Silver/Brass Twin-Prong Metal Buckles Fastening the Plastron at Upper-Right
  for (const [bx, by] of [
    [0.642, 0.618],
    [0.735, 0.668],
  ] as const) {
    ctx.save();
    ctx.translate(w * bx, h * by);
    ctx.rotate(0.52);
    ctx.fillStyle = "#f1f5f9";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = Math.max(0.7, w * 0.008);
    drawRoundedRect(ctx, -w * 0.022, -h * 0.022, w * 0.044, h * 0.044, 2);
    ctx.fill();
    ctx.stroke();

    // Dark buckle center notch
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(-w * 0.01, -h * 0.009, w * 0.02, h * 0.018);
    ctx.restore();
  }

  // Lavish Raised 3D Antique-Gold Baroque Scrollwork & Arabesque Embroidery on the Plastron
  ctx.save();
  ctx.translate(w * 0.53, h * 0.82);
  ctx.rotate(0.46);

  ctx.strokeStyle = "#eab308";
  ctx.fillStyle = "#fef08a";
  ctx.lineWidth = Math.max(1.3, w * 0.015);

  // Symmetrical Baroque Gold Filigree C-Scrolls & Fleur-de-Lis Crest along the Plastron Axis
  for (const dir of [-1, 1]) {
    // Upper C-scroll & gold bead
    ctx.beginPath();
    ctx.arc(dir * w * 0.075, -h * 0.12, w * 0.045, 0, Math.PI * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(dir * w * 0.1, -h * 0.14, w * 0.016, 0, Math.PI * 2);
    ctx.fill();

    // Middle flourishing S-scroll
    ctx.beginPath();
    ctx.moveTo(dir * w * 0.02, -h * 0.07);
    ctx.bezierCurveTo(
      dir * w * 0.14,
      -h * 0.05,
      dir * w * 0.15,
      h * 0.04,
      dir * w * 0.03,
      h * 0.05
    );
    ctx.stroke();

    // Lower baroque scroll loop
    ctx.beginPath();
    ctx.arc(dir * w * 0.065, h * 0.1, w * 0.048, -Math.PI * 0.3, Math.PI * 1.2);
    ctx.stroke();
  }

  // Central golden spine & diamond filigree nodes
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.16);
  ctx.lineTo(0, h * 0.16);
  ctx.stroke();
  for (const cyOff of [-0.11, -0.03, 0.05, 0.12]) {
    ctx.beginPath();
    ctx.arc(0, h * cyOff, w * 0.018, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();

  // 5. The Captain's Portrait: Shaved Sides, Cyan-Highlight Mohawk, Diagonal Scar, Piercing Icy Eyes, Handlebar Mustache & Goatee
  ctx.save();
  const faceCx = w * 0.482;
  const faceCy = h * 0.395;

  // Left & Right Ears
  ctx.fillStyle = "#c9b097";
  ctx.strokeStyle = "#6e5a47";
  ctx.lineWidth = Math.max(0.8, w * 0.009);
  for (const [ex, rot] of [
    [w * 0.312, -0.14],
    [w * 0.654, 0.14],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(ex, h * 0.382, w * 0.02, h * 0.044, rot, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Shaved Head Sides & Rugged Pale-Weathered Face Contour
  const headGrad = ctx.createRadialGradient(
    faceCx - w * 0.02,
    h * 0.33,
    w * 0.02,
    faceCx,
    faceCy,
    w * 0.24
  );
  headGrad.addColorStop(0, "#fdf6ec");
  headGrad.addColorStop(0.55, "#dec7ad");
  headGrad.addColorStop(0.85, "#9c856d");
  headGrad.addColorStop(1, "#5c4d3e");
  ctx.fillStyle = headGrad;
  ctx.strokeStyle = "#4f4134";
  ctx.lineWidth = Math.max(0.9, w * 0.01);

  ctx.beginPath();
  ctx.moveTo(w * 0.318, h * 0.335);
  // Left temple & hollow cheekbone down to chin goatee
  ctx.quadraticCurveTo(w * 0.318, h * 0.47, w * 0.405, h * 0.555);
  ctx.quadraticCurveTo(w * 0.485, h * 0.6, w * 0.562, h * 0.555);
  // Right jawline up to right temple
  ctx.quadraticCurveTo(w * 0.648, h * 0.47, w * 0.648, h * 0.335);
  // Shaved cranium dome
  ctx.quadraticCurveTo(w * 0.64, h * 0.195, w * 0.482, h * 0.19);
  ctx.quadraticCurveTo(w * 0.325, h * 0.195, w * 0.318, h * 0.335);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Grey-brown shaved stubble shading on left and right upper temples
  ctx.fillStyle = "rgba(71, 68, 64, 0.35)";
  ctx.beginPath();
  ctx.moveTo(w * 0.32, h * 0.32);
  ctx.quadraticCurveTo(w * 0.33, h * 0.22, w * 0.41, h * 0.21);
  ctx.lineTo(w * 0.38, h * 0.31);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(w * 0.645, h * 0.32);
  ctx.quadraticCurveTo(w * 0.635, h * 0.22, w * 0.56, h * 0.21);
  ctx.lineTo(w * 0.585, h * 0.31);
  ctx.closePath();
  ctx.fill();

  // Thick Dark Mohawk Crest with Electric-Cyan Top Sheen
  const mohawkGrad = ctx.createRadialGradient(
    w * 0.46,
    h * 0.165,
    w * 0.015,
    w * 0.485,
    h * 0.22,
    w * 0.14
  );
  mohawkGrad.addColorStop(0, "#38bdf8");
  mohawkGrad.addColorStop(0.32, "#0284c7");
  mohawkGrad.addColorStop(0.6, "#091526");
  mohawkGrad.addColorStop(1, "#05070c");
  ctx.fillStyle = mohawkGrad;

  ctx.beginPath();
  ctx.moveTo(w * 0.372, h * 0.225);
  ctx.quadraticCurveTo(w * 0.39, h * 0.14, w * 0.485, h * 0.142);
  ctx.quadraticCurveTo(w * 0.59, h * 0.145, w * 0.608, h * 0.235);
  ctx.quadraticCurveTo(w * 0.565, h * 0.295, w * 0.485, h * 0.285);
  ctx.quadraticCurveTo(w * 0.405, h * 0.29, w * 0.372, h * 0.225);
  ctx.closePath();
  ctx.fill();

  // Signature Jagged Diagonal Battle Scar (Starting Inside the Mohawk, Cutting Across Forehead, Right Eyebrow & Right Cheek)
  // Upper white-cyan scar part-line cutting through the dark mohawk hair
  ctx.strokeStyle = "#bae6fd";
  ctx.lineWidth = Math.max(1.3, w * 0.015);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(w * 0.415, h * 0.215);
  ctx.quadraticCurveTo(w * 0.485, h * 0.23, w * 0.525, h * 0.278);
  ctx.stroke();

  // Lower skin scar seam across forehead, splitting right eyebrow and running down right cheek
  ctx.strokeStyle = "rgba(148, 108, 94, 0.78)";
  ctx.lineWidth = Math.max(1.6, w * 0.018);
  ctx.beginPath();
  ctx.moveTo(w * 0.525, h * 0.278);
  ctx.lineTo(w * 0.565, h * 0.325);
  ctx.lineTo(w * 0.608, h * 0.365);
  ctx.lineTo(w * 0.588, h * 0.418);
  ctx.lineTo(w * 0.608, h * 0.465);
  ctx.stroke();

  // Pale scar ridge highlight right next to the skin scar seam
  ctx.strokeStyle = "rgba(254, 242, 242, 0.85)";
  ctx.lineWidth = Math.max(0.9, w * 0.01);
  ctx.beginPath();
  ctx.moveTo(w * 0.521, h * 0.278);
  ctx.lineTo(w * 0.561, h * 0.325);
  ctx.lineTo(w * 0.604, h * 0.365);
  ctx.lineTo(w * 0.584, h * 0.418);
  ctx.lineTo(w * 0.604, h * 0.465);
  ctx.stroke();

  // Deep Menacing Eye Socket Shadows & Furrowed Glabella Scowl Lines
  ctx.fillStyle = "rgba(74, 65, 52, 0.48)";
  ctx.beginPath();
  ctx.ellipse(w * 0.41, h * 0.382, w * 0.052, h * 0.018, 0.12, 0, Math.PI * 2);
  ctx.ellipse(
    w * 0.555,
    h * 0.382,
    w * 0.052,
    h * 0.018,
    -0.12,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Low-Angled Scowling Dark Eyebrows (Right eyebrow split by the diagonal battle scar)
  ctx.strokeStyle = "#171717";
  ctx.lineWidth = Math.max(1.6, w * 0.018);
  ctx.beginPath();
  // Viewer's left eyebrow
  ctx.moveTo(w * 0.348, h * 0.358);
  ctx.lineTo(w * 0.455, h * 0.376);
  // Viewer's right eyebrow (inner segment + outer segment split by the scar at x = 0.60)
  ctx.moveTo(w * 0.508, h * 0.376);
  ctx.lineTo(w * 0.588, h * 0.356);
  ctx.moveTo(w * 0.608, h * 0.354);
  ctx.lineTo(w * 0.625, h * 0.362);
  ctx.stroke();

  // Piercing Icy Pale-Blue Eyes with Pinpoint Pupils
  for (const [ex, ey] of [
    [w * 0.415, h * 0.382],
    [w * 0.552, h * 0.382],
  ] as const) {
    // Crisp sclera
    ctx.fillStyle = "#f1f5f9";
    ctx.beginPath();
    ctx.ellipse(ex, ey, w * 0.028, h * 0.0085, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing ice-blue iris
    ctx.fillStyle = "#7dd3fc";
    ctx.beginPath();
    ctx.arc(ex, ey, w * 0.011, 0, Math.PI * 2);
    ctx.fill();

    // Pinpoint black pupil
    ctx.fillStyle = "#090d16";
    ctx.beginPath();
    ctx.arc(ex, ey, w * 0.0045, 0, Math.PI * 2);
    ctx.fill();

    // Dark upper lash outline
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = Math.max(0.8, w * 0.009);
    ctx.beginPath();
    ctx.ellipse(ex, ey, w * 0.029, h * 0.0085, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
  }

  // Sharp Straight Nose Bridge & Flared Nostrils
  ctx.fillStyle = "rgba(120, 98, 79, 0.38)";
  ctx.beginPath();
  ctx.moveTo(w * 0.472, h * 0.378);
  ctx.lineTo(w * 0.448, h * 0.452);
  ctx.lineTo(w * 0.482, h * 0.468);
  ctx.lineTo(w * 0.516, h * 0.452);
  ctx.lineTo(w * 0.492, h * 0.378);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#6e5644";
  ctx.lineWidth = Math.max(0.9, w * 0.01);
  ctx.beginPath();
  ctx.moveTo(w * 0.45, h * 0.454);
  ctx.quadraticCurveTo(w * 0.482, h * 0.472, w * 0.514, h * 0.454);
  ctx.stroke();

  // Signature Upward-Curled Handlebar Mustache
  ctx.fillStyle = "#141210";
  ctx.strokeStyle = "#292524";
  ctx.lineWidth = Math.max(0.8, w * 0.009);
  ctx.beginPath();
  // Center top indentation under nose
  ctx.moveTo(w * 0.482, h * 0.484);
  // Left wing sweeping down and curling UP into a handlebar hook
  ctx.quadraticCurveTo(w * 0.435, h * 0.475, w * 0.405, h * 0.498);
  ctx.quadraticCurveTo(w * 0.375, h * 0.505, w * 0.378, h * 0.478);
  ctx.quadraticCurveTo(w * 0.385, h * 0.515, w * 0.42, h * 0.508);
  ctx.quadraticCurveTo(w * 0.455, h * 0.496, w * 0.482, h * 0.498);
  // Right wing sweeping down and curling UP into a handlebar hook
  ctx.quadraticCurveTo(w * 0.51, h * 0.496, w * 0.545, h * 0.508);
  ctx.quadraticCurveTo(w * 0.58, h * 0.515, w * 0.586, h * 0.478);
  ctx.quadraticCurveTo(w * 0.59, h * 0.505, w * 0.558, h * 0.498);
  ctx.quadraticCurveTo(w * 0.528, h * 0.475, w * 0.482, h * 0.484);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Firm Lower Lip Below the Handlebar Mustache
  ctx.fillStyle = "#b58378";
  ctx.beginPath();
  ctx.ellipse(w * 0.482, h * 0.51, w * 0.036, h * 0.0085, 0, 0, Math.PI * 2);
  ctx.fill();

  // Full Trim Dark Chin Goatee Beard
  ctx.fillStyle = "#121110";
  ctx.beginPath();
  ctx.moveTo(w * 0.455, h * 0.518);
  ctx.lineTo(w * 0.51, h * 0.518);
  ctx.lineTo(w * 0.535, h * 0.508);
  ctx.lineTo(w * 0.562, h * 0.515);
  ctx.quadraticCurveTo(w * 0.558, h * 0.585, w * 0.482, h * 0.598);
  ctx.quadraticCurveTo(w * 0.405, h * 0.585, w * 0.402, h * 0.515);
  ctx.lineTo(w * 0.43, h * 0.508);
  ctx.closePath();
  ctx.fill();

  // Fine beard hair strand highlights on the chin goatee
  ctx.strokeStyle = "rgba(148, 134, 120, 0.38)";
  ctx.lineWidth = Math.max(0.6, w * 0.007);
  for (const bx of [0.435, 0.46, 0.482, 0.505, 0.53]) {
    ctx.beginPath();
    ctx.moveTo(w * bx, h * 0.53);
    ctx.lineTo(w * bx, h * 0.585);
    ctx.stroke();
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
  ctx.save();

  if (character === "Duke") {
    drawDukeCard2D(ctx, x, y, w, h);
  } else if (character === "Assassin") {
    drawAssassinCard2D(ctx, x, y, w, h);
  } else if (character === "Captain") {
    drawCaptainCard2D(ctx, x, y, w, h);
  } else if (character === "Ambassador") {
    drawAmbassadorCard2D(ctx, x, y, w, h);
  } else {
    drawContessaCard2D(ctx, x, y, w, h);
  }

  ctx.restore();
}

/**
 * Draws the official 2D Coup Card Back matching the reference artwork:
 * - Crisp pure-white outer border with an ornate scalloped/stepped top & bottom inner cartouche
 * - Cool silver-grey inner panel with horizontal sinusoidal wavy moiré damask bands
 * - 180° rotationally symmetric top & bottom white baroque spiral scrollwork friezes,
 *   double horizontal bars with curled volute ends, central interlocking white rings,
 *   and vertical black stiletto daggers piercing through the top and bottom medallions
 * - 180° symmetric 3D beveled black geometric sci-fi "akhoup" ambigram wordmarks
 */
export function drawCoupCardBack2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  ctx.translate(x, y);

  // 1. Crisp Pure-White Outer Card Border Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  // Define the symmetric scalloped inner cartouche path
  const defineInnerCartouche = () => {
    const xL = w * 0.105;
    const xR = w * 0.895;
    ctx.beginPath();
    // Top central plateau
    ctx.moveTo(w * 0.28, h * 0.082);
    ctx.lineTo(w * 0.72, h * 0.082);
    // Top-right scalloped step down to right shoulder
    ctx.bezierCurveTo(
      w * 0.755,
      h * 0.082,
      w * 0.775,
      h * 0.128,
      w * 0.825,
      h * 0.132
    );
    ctx.quadraticCurveTo(xR, h * 0.134, xR, h * 0.175);
    // Right vertical edge
    ctx.lineTo(xR, h * 0.825);
    // Bottom-right shoulder & scalloped step to bottom plateau
    ctx.quadraticCurveTo(xR, h * 0.866, w * 0.825, h * 0.868);
    ctx.bezierCurveTo(
      w * 0.775,
      h * 0.872,
      w * 0.755,
      h * 0.918,
      w * 0.72,
      h * 0.918
    );
    // Bottom central plateau
    ctx.lineTo(w * 0.28, h * 0.918);
    // Bottom-left scalloped step up to left shoulder
    ctx.bezierCurveTo(
      w * 0.245,
      h * 0.918,
      w * 0.225,
      h * 0.872,
      w * 0.175,
      h * 0.868
    );
    ctx.quadraticCurveTo(xL, h * 0.866, xL, h * 0.825);
    // Left vertical edge
    ctx.lineTo(xL, h * 0.175);
    // Top-left shoulder & step up to top plateau
    ctx.quadraticCurveTo(xL, h * 0.134, w * 0.175, h * 0.132);
    ctx.bezierCurveTo(
      w * 0.225,
      h * 0.128,
      w * 0.245,
      h * 0.082,
      w * 0.28,
      h * 0.082
    );
    ctx.closePath();
  };

  // 2. Clipped Silver-Grey Inner Field with Horizontal Wavy Moiré Damask Texture
  ctx.save();
  defineInnerCartouche();
  ctx.clip();

  const greyGrad = ctx.createLinearGradient(0, 0, w, h);
  greyGrad.addColorStop(0, "#8f9194");
  greyGrad.addColorStop(0.5, "#9c9ea1");
  greyGrad.addColorStop(1, "#86888b");
  ctx.fillStyle = greyGrad;
  ctx.fillRect(0, 0, w, h);

  // Horizontal sinusoidal wavy moiré stripes across the grey panel
  const waveRows = Math.max(14, Math.min(30, Math.floor(h * 0.24)));
  const waveAmp = h * 0.0075;
  ctx.lineWidth = Math.max(1, (h * 0.84) / (waveRows * 2.1));
  for (let r = 0; r < waveRows; r++) {
    const baseY = h * 0.08 + (r / waveRows) * (h * 0.84);
    ctx.strokeStyle =
      r % 2 === 0
        ? "rgba(112, 114, 117, 0.45)"
        : "rgba(168, 170, 173, 0.36)";
    ctx.beginPath();
    const steps = 16;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const wx = w * 0.1 + t * (w * 0.8);
      const wy = baseY + Math.sin(t * Math.PI * 9) * waveAmp;
      if (s === 0) ctx.moveTo(wx, wy);
      else ctx.lineTo(wx, wy);
    }
    ctx.stroke();
  }

  // Helper that draws ONE rotational half (top baroque white frieze + bottom-right "akhoup" wordmark)
  const drawRotationalHalfInside = () => {
    // A. White Baroque Scrollwork Frieze & Double Horizontal Bars at Top
    ctx.strokeStyle = "#ffffff";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Double parallel horizontal white lines across the frieze base
    ctx.lineWidth = Math.max(0.9, w * 0.013);
    ctx.beginPath();
    ctx.moveTo(w * 0.105, h * 0.182);
    ctx.lineTo(w * 0.895, h * 0.182);
    ctx.moveTo(w * 0.105, h * 0.194);
    ctx.lineTo(w * 0.895, h * 0.194);
    ctx.stroke();

    // Central White Ring + Flanking Interlocking Loops
    ctx.lineWidth = Math.max(1.2, w * 0.022);
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.175, w * 0.048, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = Math.max(1, w * 0.016);
    for (const dir of [-1, 1]) {
      // Interlocking side loop next to central ring
      ctx.beginPath();
      ctx.arc(
        w * (0.5 + dir * 0.056),
        h * 0.188,
        w * 0.036,
        dir === -1 ? Math.PI * 0.15 : -Math.PI * 0.15,
        dir === -1 ? Math.PI * 1.15 : Math.PI * 0.85
      );
      ctx.stroke();

      // Underside outer spiral volute curl at x = 0.5 ± 0.355
      const vx = w * (0.5 + dir * 0.352);
      const vy = h * 0.206;
      ctx.beginPath();
      ctx.moveTo(w * (0.5 + dir * 0.39), h * 0.194);
      ctx.quadraticCurveTo(
        w * (0.5 + dir * 0.382),
        vy + h * 0.015,
        vx,
        vy + h * 0.014
      );
      ctx.quadraticCurveTo(
        vx - dir * w * 0.022,
        vy + h * 0.012,
        vx - dir * w * 0.018,
        vy - h * 0.004
      );
      ctx.quadraticCurveTo(
        vx - dir * w * 0.01,
        vy - h * 0.012,
        vx + dir * w * 0.004,
        vy - h * 0.003
      );
      ctx.stroke();

      // Inner baroque S-scroll spiral above the horizontal bar (x = 0.5 ± 0.165)
      const sx = w * (0.5 + dir * 0.168);
      const sy = h * 0.142;
      ctx.lineWidth = Math.max(1.1, w * 0.02);
      ctx.beginPath();
      ctx.arc(sx, sy, w * 0.036, 0, Math.PI * 1.65);
      ctx.stroke();

      // Upper scroll flourish arching from central medallion to inner spiral
      ctx.beginPath();
      ctx.moveTo(w * (0.5 + dir * 0.06), h * 0.125);
      ctx.quadraticCurveTo(
        w * (0.5 + dir * 0.11),
        h * 0.16,
        w * (0.5 + dir * 0.132),
        h * 0.088
      );
      ctx.stroke();

      // Outer C-scroll arcs toward shoulder corners
      ctx.beginPath();
      ctx.arc(
        w * (0.5 + dir * 0.275),
        h * 0.115,
        w * 0.044,
        Math.PI * 0.1,
        Math.PI * 0.9
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(
        w * (0.5 + dir * 0.375),
        h * 0.132,
        w * 0.044,
        Math.PI * 0.15,
        Math.PI * 0.85
      );
      ctx.stroke();
    }

    // B. 3D Beveled Metallic Black Geometric Sci-Fi "akhoup" Wordmark (Bottom-Right in default orientation)
    const wx0 = w * 0.328;
    const wy0 = h * 0.708;
    const ww = w * 0.474;
    const wh = h * 0.044;

    const strokeWordmark = (ox: number, oy: number, color: string) => {
      ctx.save();
      ctx.translate(wx0 + ox, wy0 + oy);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.1, w * 0.017);
      ctx.lineCap = "square";
      ctx.lineJoin = "miter";

      const cw = ww / 6.3;
      const gap = cw * 0.24;
      const step = cw + gap;

      ctx.beginPath();
      // 1. 'a' (squared sci-fi lower-case 'a')
      let lx = 0;
      ctx.moveTo(lx + cw * 0.1, 0);
      ctx.lineTo(lx + cw, 0);
      ctx.lineTo(lx + cw, wh);
      ctx.lineTo(lx, wh);
      ctx.lineTo(lx, wh * 0.48);
      ctx.lineTo(lx + cw, wh * 0.48);

      // 2. 'k' (tall stem from -wh*0.35 to wh + angular chevron arms)
      lx = step;
      ctx.moveTo(lx, -wh * 0.36);
      ctx.lineTo(lx, wh);
      ctx.moveTo(lx + cw * 0.95, 0);
      ctx.lineTo(lx + cw * 0.2, wh * 0.5);
      ctx.lineTo(lx + cw, wh);

      // 3. 'h' (tall stem from -wh*0.36 to wh + squared arch)
      lx = step * 2;
      ctx.moveTo(lx, -wh * 0.36);
      ctx.lineTo(lx, wh);
      ctx.moveTo(lx, wh * 0.05);
      ctx.lineTo(lx + cw, wh * 0.05);
      ctx.lineTo(lx + cw, wh);

      // 4. 'o' (squared geometric box)
      lx = step * 3;
      ctx.rect(lx, 0, cw, wh);

      // 5. 'u' (open-top squared U)
      lx = step * 4;
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, wh);
      ctx.lineTo(lx + cw, wh);
      ctx.lineTo(lx + cw, 0);

      // 6. 'p' (descender stem down to wh*1.36 + squared bowl)
      lx = step * 5;
      ctx.moveTo(lx, wh * 1.36);
      ctx.lineTo(lx, 0);
      ctx.lineTo(lx + cw, 0);
      ctx.lineTo(lx + cw, wh);
      ctx.lineTo(lx, wh);

      ctx.stroke();
      ctx.restore();
    };

    // 3D drop shadow, metallic bevel highlight, and charcoal-black core
    strokeWordmark(w * 0.005, h * 0.004, "rgba(0, 0, 0, 0.42)");
    strokeWordmark(-w * 0.003, -h * 0.002, "#686a6e");
    strokeWordmark(0, 0, "#141618");
  };

  // Draw top half normally, then rotate 180° around card center (w/2, h/2) for exact rotational symmetry
  drawRotationalHalfInside();
  ctx.save();
  ctx.translate(w, h);
  ctx.rotate(Math.PI);
  drawRotationalHalfInside();
  ctx.restore();

  ctx.restore(); // End inner cartouche clip

  // 3. Vertical Black Stiletto Daggers Piercing Top & Bottom Medallions (extending slightly beyond cartouche edge)
  const drawVerticalBlackDagger = () => {
    ctx.fillStyle = "#111315";
    // Round pommel knob at bottom of hilt
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.207, w * 0.011, h * 0.005, 0, 0, Math.PI * 2);
    ctx.fill();

    // Grip & Crossguard + Long Tapered Stiletto Blade pointing straight UP to y = 0.063*h
    ctx.beginPath();
    ctx.moveTo(w * 0.494, h * 0.205);
    ctx.lineTo(w * 0.494, h * 0.188);
    // Left crossguard quillon
    ctx.lineTo(w * 0.484, h * 0.186);
    ctx.lineTo(w * 0.484, h * 0.181);
    ctx.lineTo(w * 0.494, h * 0.181);
    // Left blade edge tapering to needle tip
    ctx.quadraticCurveTo(w * 0.489, h * 0.125, w * 0.5, h * 0.063);
    // Right blade edge
    ctx.quadraticCurveTo(w * 0.511, h * 0.125, w * 0.506, h * 0.181);
    // Right crossguard quillon
    ctx.lineTo(w * 0.516, h * 0.181);
    ctx.lineTo(w * 0.516, h * 0.186);
    ctx.lineTo(w * 0.506, h * 0.188);
    ctx.lineTo(w * 0.506, h * 0.205);
    ctx.closePath();
    ctx.fill();
  };

  drawVerticalBlackDagger();
  ctx.save();
  ctx.translate(w, h);
  ctx.rotate(Math.PI);
  drawVerticalBlackDagger();
  ctx.restore();

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
    drawCoupCardBack2D(ctx, x, y, w, h);
  } else {
    drawCoupCharacterArt2D(ctx, x, y, w, h, character);
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
  const deckW = 58;
  const deckH = 80;
  const deckX = centerX - 114;
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
  const treasX = centerX + 86;
  const treasY = centerY + 6;
  const coinOffsets: [number, number][] = [
    [-16, 7],
    [14, 9],
    [0, 5],
    [-12, -2],
    [12, -1],
    [0, -7],
    [-5, -15],
    [7, -14],
  ];
  for (const [ox, oy] of coinOffsets) {
    drawCoupCoin2D(ctx, treasX + ox, treasY + oy, 13);
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

export type CoupIconKind =
  | CoupCharacter
  | "INCOME"
  | "FOREIGN_AID"
  | "COUP"
  | "TAX"
  | "ASSASSINATE"
  | "EXCHANGE"
  | "STEAL"
  | "CHALLENGE"
  | "PASS";

/**
 * Draws the official 2D Coup Faction / Action Icon at center `(cx, cy)` with bounding diameter `size`,
 * matching the official Coup Play Summary reference card:
 * - Duke / TAX: Neon-magenta 5-pointed star overlapping a circular ring with an inner 5-pointed star
 * - Assassin / ASSASSINATE: Dark gunmetal skull with 'X' forehead cutout, angular eyes & 4 bottom fangs
 * - Ambassador / EXCHANGE: Chartreuse hollow diamond + 3 inward triangles (Top/Left/Right) + 2 stacked Bottom triangles
 * - Captain / STEAL: Sky-blue upward arrow with V-wings above 2 nested V-chevrons
 * - Contessa: Crimson-red pentagonal diamond shield with 3-merlon castle tower cutout & twin vertical slits
 * - INCOME / FOREIGN_AID / COUP / CHALLENGE / PASS: 2D octagonal ISK coin(s) & tactical emblems
 */
export function drawCoupActionIcon2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  kind: CoupIconKind
) {
  ctx.save();
  const s = size;

  if (kind === "Duke" || kind === "TAX") {
    const outerR = s * 0.46;
    const innerR = outerR * 0.38;

    const grad = ctx.createLinearGradient(
      cx - outerR,
      cy - outerR,
      cx + outerR,
      cy + outerR
    );
    grad.addColorStop(0, "#ff2e93");
    grad.addColorStop(0.55, "#e11d84");
    grad.addColorStop(1, "#9d0b58");

    // Circular ring behind the 5 star points
    ctx.strokeStyle = grad;
    ctx.lineWidth = Math.max(1.8, s * 0.11);
    ctx.beginPath();
    ctx.arc(cx, cy + s * 0.02, outerR * 0.62, 0, Math.PI * 2);
    ctx.stroke();

    // Outer 5-pointed star with center pentagon hole (even-odd)
    ctx.fillStyle = grad;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    const holeR = innerR * 0.72;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + Math.PI / 5 + (i * Math.PI * 2) / 5;
      const px = cx + Math.cos(a) * holeR;
      const py = cy + Math.sin(a) * holeR;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill("evenodd");

    // Inner small 5-pointed star
    const smOut = holeR * 0.86;
    const smIn = smOut * 0.4;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? smOut : smIn;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (kind === "Assassin" || kind === "ASSASSINATE") {
    const skS = s * 0.88;
    const grad = ctx.createLinearGradient(
      cx - skS * 0.5,
      cy - skS * 0.5,
      cx + skS * 0.5,
      cy + skS * 0.5
    );
    grad.addColorStop(0, "#4b5057");
    grad.addColorStop(0.5, "#2d3136");
    grad.addColorStop(1, "#16181a");
    ctx.fillStyle = grad;
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = Math.max(0.8, s * 0.035);

    ctx.beginPath();
    ctx.moveTo(cx - skS * 0.25, cy - skS * 0.44);
    ctx.lineTo(cx + skS * 0.25, cy - skS * 0.44);
    ctx.lineTo(cx + skS * 0.46, cy - skS * 0.14);
    ctx.lineTo(cx + skS * 0.42, cy + skS * 0.04);
    ctx.lineTo(cx + skS * 0.5, cy + skS * 0.12);
    ctx.lineTo(cx + skS * 0.36, cy + skS * 0.26);
    ctx.lineTo(cx + skS * 0.26, cy + skS * 0.26);
    // 4 Jagged Bottom Fangs
    ctx.lineTo(cx + skS * 0.22, cy + skS * 0.48);
    ctx.lineTo(cx + skS * 0.13, cy + skS * 0.28);
    ctx.lineTo(cx + skS * 0.09, cy + skS * 0.52);
    ctx.lineTo(cx + skS * 0.02, cy + skS * 0.28);
    ctx.lineTo(cx - skS * 0.02, cy + skS * 0.28);
    ctx.lineTo(cx - skS * 0.09, cy + skS * 0.52);
    ctx.lineTo(cx - skS * 0.13, cy + skS * 0.28);
    ctx.lineTo(cx - skS * 0.22, cy + skS * 0.48);
    ctx.lineTo(cx - skS * 0.26, cy + skS * 0.26);
    ctx.lineTo(cx - skS * 0.36, cy + skS * 0.26);
    ctx.lineTo(cx - skS * 0.5, cy + skS * 0.12);
    ctx.lineTo(cx - skS * 0.42, cy + skS * 0.04);
    ctx.lineTo(cx - skS * 0.46, cy - skS * 0.14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 'X' Forehead Cutout
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = Math.max(1.4, skS * 0.095);
    const xCy = cy - skS * 0.18;
    const xR = skS * 0.115;
    ctx.beginPath();
    ctx.moveTo(cx - xR, xCy - xR);
    ctx.lineTo(cx + xR, xCy + xR);
    ctx.moveTo(cx + xR, xCy - xR);
    ctx.lineTo(cx - xR, xCy + xR);
    ctx.stroke();

    // Eye Sockets & Nasal Triangle
    ctx.fillStyle = "#cbd5e1";
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + dir * skS * 0.1, cy + skS * 0.06);
      ctx.lineTo(cx + dir * skS * 0.33, cy + skS * 0.06);
      ctx.lineTo(cx + dir * skS * 0.25, cy + skS * 0.16);
      ctx.lineTo(cx + dir * skS * 0.14, cy + skS * 0.16);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(cx, cy + skS * 0.14);
    ctx.lineTo(cx + skS * 0.055, cy + skS * 0.24);
    ctx.lineTo(cx - skS * 0.055, cy + skS * 0.24);
    ctx.closePath();
    ctx.fill();
  } else if (kind === "Ambassador" || kind === "EXCHANGE") {
    const emS = s * 0.88;
    const grad = ctx.createLinearGradient(
      cx - emS * 0.5,
      cy - emS * 0.5,
      cx + emS * 0.5,
      cy + emS * 0.5
    );
    grad.addColorStop(0, "#d9f928");
    grad.addColorStop(0.55, "#b5db18");
    grad.addColorStop(1, "#7c9e09");
    ctx.fillStyle = grad;
    ctx.strokeStyle = "#4d6304";
    ctx.lineWidth = Math.max(0.7, s * 0.03);

    const dOut = emS * 0.22;
    const dIn = emS * 0.09;
    // Central Hollow Diamond
    ctx.beginPath();
    ctx.moveTo(cx, cy - dOut);
    ctx.lineTo(cx + dOut, cy);
    ctx.lineTo(cx, cy + dOut);
    ctx.lineTo(cx - dOut, cy);
    ctx.closePath();
    ctx.moveTo(cx, cy - dIn);
    ctx.lineTo(cx - dIn, cy);
    ctx.lineTo(cx, cy + dIn);
    ctx.lineTo(cx + dIn, cy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const triW = emS * 0.15;
    const triH = emS * 0.115;
    // Top triangle pointing DOWN
    ctx.beginPath();
    ctx.moveTo(cx - triW, cy - dOut - emS * 0.2);
    ctx.lineTo(cx + triW, cy - dOut - emS * 0.2);
    ctx.lineTo(cx, cy - dOut - emS * 0.2 + triH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Left triangle pointing RIGHT
    ctx.beginPath();
    ctx.moveTo(cx - dOut - emS * 0.24, cy - triW);
    ctx.lineTo(cx - dOut - emS * 0.24, cy + triW);
    ctx.lineTo(cx - dOut - emS * 0.24 + triH, cy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right triangle pointing LEFT
    ctx.beginPath();
    ctx.moveTo(cx + dOut + emS * 0.24, cy - triW);
    ctx.lineTo(cx + dOut + emS * 0.24, cy + triW);
    ctx.lineTo(cx + dOut + emS * 0.24 - triH, cy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bottom TWO stacked triangles pointing UP
    for (const offset of [0.05, 0.175]) {
      const tipY = cy + dOut + emS * offset;
      ctx.beginPath();
      ctx.moveTo(cx, tipY);
      ctx.lineTo(cx + triW, tipY + triH);
      ctx.lineTo(cx - triW, tipY + triH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (kind === "Captain" || kind === "STEAL") {
    const emS = s * 0.88;
    const grad = ctx.createLinearGradient(
      cx - emS * 0.5,
      cy - emS * 0.45,
      cx + emS * 0.5,
      cy + emS * 0.45
    );
    grad.addColorStop(0, "#7dd3fc");
    grad.addColorStop(0.5, "#38bdf8");
    grad.addColorStop(1, "#0284c7");
    ctx.fillStyle = grad;
    ctx.strokeStyle = "#0369a1";
    ctx.lineWidth = Math.max(0.7, s * 0.03);

    // Upper Arrow + V-Wing Anchor Base
    ctx.beginPath();
    ctx.moveTo(cx, cy - emS * 0.45);
    ctx.lineTo(cx + emS * 0.15, cy - emS * 0.25);
    ctx.lineTo(cx + emS * 0.06, cy - emS * 0.25);
    ctx.lineTo(cx + emS * 0.06, cy - emS * 0.04);
    ctx.lineTo(cx + emS * 0.23, cy - emS * 0.21);
    ctx.lineTo(cx + emS * 0.37, cy - emS * 0.21);
    ctx.lineTo(cx + emS * 0.1, cy + emS * 0.06);
    ctx.lineTo(cx - emS * 0.1, cy + emS * 0.06);
    ctx.lineTo(cx - emS * 0.37, cy - emS * 0.21);
    ctx.lineTo(cx - emS * 0.23, cy - emS * 0.21);
    ctx.lineTo(cx - emS * 0.06, cy - emS * 0.04);
    ctx.lineTo(cx - emS * 0.06, cy - emS * 0.25);
    ctx.lineTo(cx - emS * 0.15, cy - emS * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Middle Nested V-Chevron
    ctx.beginPath();
    ctx.moveTo(cx - emS * 0.28, cy - emS * 0.02);
    ctx.lineTo(cx - emS * 0.22, cy - emS * 0.07);
    ctx.lineTo(cx, cy + emS * 0.15);
    ctx.lineTo(cx + emS * 0.22, cy - emS * 0.07);
    ctx.lineTo(cx + emS * 0.28, cy - emS * 0.02);
    ctx.lineTo(cx, cy + emS * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Outer Bottom V-Chevron
    ctx.beginPath();
    ctx.moveTo(cx - emS * 0.5, cy - emS * 0.04);
    ctx.lineTo(cx - emS * 0.41, cy - emS * 0.11);
    ctx.lineTo(cx, cy + emS * 0.3);
    ctx.lineTo(cx + emS * 0.41, cy - emS * 0.11);
    ctx.lineTo(cx + emS * 0.5, cy - emS * 0.04);
    ctx.lineTo(cx, cy + emS * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (kind === "Contessa") {
    const emW = s * 0.9;
    const emH = s * 0.78;
    const grad = ctx.createLinearGradient(
      cx - emW * 0.5,
      cy - emH * 0.5,
      cx + emW * 0.5,
      cy + emH * 0.5
    );
    grad.addColorStop(0, "#ff333b");
    grad.addColorStop(0.55, "#e1161e");
    grad.addColorStop(1, "#9e0910");
    ctx.fillStyle = grad;
    ctx.strokeStyle = "#7f060b";
    ctx.lineWidth = Math.max(0.7, s * 0.03);

    ctx.beginPath();
    ctx.moveTo(cx - emW * 0.34, cy - emH * 0.46);
    ctx.lineTo(cx + emW * 0.34, cy - emH * 0.46);
    ctx.lineTo(cx + emW * 0.5, cy - emH * 0.18);
    ctx.lineTo(cx + emW * 0.07, cy + emH * 0.46);
    ctx.lineTo(cx + emW * 0.07, cy - emH * 0.04);
    ctx.lineTo(cx + emW * 0.15, cy - emH * 0.12);
    ctx.lineTo(cx + emW * 0.22, cy - emH * 0.12);
    ctx.lineTo(cx + emW * 0.22, cy - emH * 0.33);
    // 3 Castle Merlons
    ctx.lineTo(cx + emW * 0.13, cy - emH * 0.33);
    ctx.lineTo(cx + emW * 0.13, cy - emH * 0.23);
    ctx.lineTo(cx + emW * 0.05, cy - emH * 0.23);
    ctx.lineTo(cx + emW * 0.05, cy - emH * 0.33);
    ctx.lineTo(cx - emW * 0.05, cy - emH * 0.33);
    ctx.lineTo(cx - emW * 0.05, cy - emH * 0.23);
    ctx.lineTo(cx - emW * 0.13, cy - emH * 0.23);
    ctx.lineTo(cx - emW * 0.13, cy - emH * 0.33);
    ctx.lineTo(cx - emW * 0.22, cy - emH * 0.33);
    ctx.lineTo(cx - emW * 0.22, cy - emH * 0.12);
    ctx.lineTo(cx - emW * 0.15, cy - emH * 0.12);
    ctx.lineTo(cx - emW * 0.07, cy - emH * 0.04);
    ctx.lineTo(cx - emW * 0.07, cy + emH * 0.46);
    ctx.lineTo(cx - emW * 0.5, cy - emH * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Central red vertical spine between the two bottom castle slits
    ctx.beginPath();
    ctx.moveTo(cx - emW * 0.026, cy - emH * 0.08);
    ctx.lineTo(cx + emW * 0.026, cy - emH * 0.08);
    ctx.lineTo(cx + emW * 0.026, cy + emH * 0.48);
    ctx.lineTo(cx, cy + emH * 0.53);
    ctx.lineTo(cx - emW * 0.026, cy + emH * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (kind === "INCOME") {
    drawCoupCoin2D(ctx, cx, cy, s * 0.42);
  } else if (kind === "FOREIGN_AID") {
    drawCoupCoin2D(ctx, cx - s * 0.13, cy + s * 0.06, s * 0.34);
    drawCoupCoin2D(ctx, cx + s * 0.13, cy - s * 0.06, s * 0.34);
  } else if (kind === "COUP") {
    // Crimson-gold target crosshair + stiletto dagger emblem
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = Math.max(1.5, s * 0.09);
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.36, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.46);
    ctx.lineTo(cx + s * 0.11, cy + s * 0.08);
    ctx.lineTo(cx, cy + s * 0.46);
    ctx.lineTo(cx - s * 0.11, cy + s * 0.08);
    ctx.closePath();
    ctx.fill();
  } else if (kind === "CHALLENGE") {
    // Tactical interrogation reticle
    ctx.strokeStyle = "#fb7185";
    ctx.lineWidth = Math.max(1.5, s * 0.09);
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.34, 0, Math.PI * 2);
    ctx.moveTo(cx - s * 0.46, cy);
    ctx.lineTo(cx - s * 0.2, cy);
    ctx.moveTo(cx + s * 0.2, cy);
    ctx.lineTo(cx + s * 0.46, cy);
    ctx.moveTo(cx, cy - s * 0.46);
    ctx.lineTo(cx, cy - s * 0.2);
    ctx.moveTo(cx, cy + s * 0.2);
    ctx.lineTo(cx, cy + s * 0.46);
    ctx.stroke();
  } else if (kind === "PASS") {
    ctx.strokeStyle = "#34d399";
    ctx.lineWidth = Math.max(1.8, s * 0.11);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.26, cy + s * 0.02);
    ctx.lineTo(cx - s * 0.06, cy + s * 0.22);
    ctx.lineTo(cx + s * 0.28, cy - s * 0.18);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws the full 2D Dystopian Universe (Indie Boards & Cards Coup) background and High-Council Command Table:
 * - Twilight megacity sky with upper-right orbital lunar globe & tactical HUD radar rings (Captain theme)
 *   and upper-left warm amber sun-haze orb (Contessa/Ambassador theme)
 * - 2D futuristic megacity skyline along the horizon featuring the Golden-Domed Cylindrical Tower,
 *   Angled Silver Spire, Elevated Sky-Pads, Neo-Baroque Senate Arch, and animated flying sci-fi shuttles
 * - Left & right 45° sci-fi circuit-board trace borders (matching the Coup PLAY reference card)
 * - Central 2D Brushed-Steel & Obsidian High-Council Command Table with wavy moiré damask surface,
 *   tactical telemetry ring, and 5 glowing Faction Inlay Medallions (Duke, Assassin, Ambassador, Captain, Contessa)
 */
export function drawCoupDystopianBackgroundAndTable2D(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  tableRx: number,
  tableRy: number,
  nowMs: number
) {
  ctx.save();

  // 1. Dystopian Megacity Twilight Sky & Senate Floor Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, "#071120");
  skyGrad.addColorStop(0.22, "#12263a");
  skyGrad.addColorStop(0.42, "#382433");
  skyGrad.addColorStop(0.54, "#542d26");
  skyGrad.addColorStop(0.7, "#111624");
  skyGrad.addColorStop(1, "#04070e");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Upper-Left Warm Amber Dystopian Sun Haze Orb (Contessa / Ambassador motif)
  const sunX = width * 0.14;
  const sunY = height * 0.16;
  const sunR = Math.min(width, height) * 0.16;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, sunR);
  sunGrad.addColorStop(0, "rgba(251, 146, 60, 0.32)");
  sunGrad.addColorStop(0.55, "rgba(234, 88, 12, 0.14)");
  sunGrad.addColorStop(1, "rgba(234, 88, 12, 0)");
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // Upper-Right Orbital Lunar Globe & Tactical HUD Telemetry Rings (Captain motif)
  const moonX = width * 0.84;
  const moonY = height * 0.17;
  const moonR = Math.min(width, height) * 0.15;
  const moonGrad = ctx.createRadialGradient(
    moonX - moonR * 0.3,
    moonY - moonR * 0.3,
    4,
    moonX,
    moonY,
    moonR
  );
  moonGrad.addColorStop(0, "rgba(186, 230, 253, 0.24)");
  moonGrad.addColorStop(0.65, "rgba(56, 189, 248, 0.1)");
  moonGrad.addColorStop(1, "rgba(14, 165, 233, 0)");
  ctx.fillStyle = moonGrad;
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
  ctx.fill();

  // Dashed orbital telemetry rings around upper-right moon
  ctx.save();
  ctx.strokeStyle = "rgba(125, 211, 252, 0.22)";
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonR * 1.18, -Math.PI * 0.85, Math.PI * 0.35);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonR * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 2. Futuristic Dystopian Megacity Skyline Silhouette along the Mid-Horizon
  const horizonY = height * 0.43;

  // Distant city blocks & megastructure towers
  ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
  const towers: [number, number, number][] = [
    [0.01, 0.035, 0.18],
    [0.05, 0.04, 0.13],
    [0.16, 0.045, 0.15],
    [0.22, 0.038, 0.11],
    [0.27, 0.05, 0.16],
    [0.68, 0.048, 0.15],
    [0.74, 0.036, 0.12],
    [0.79, 0.052, 0.17],
    [0.93, 0.045, 0.16],
  ];
  for (const [tx, tw, th] of towers) {
    ctx.fillRect(width * tx, horizonY - height * th, width * tw, height * th);
  }

  // Iconic Left Cylindrical Skyscraper with Glowing Golden Ribbed Dome (Contessa card landmark)
  const domTowX = width * 0.095;
  const domTowW = width * 0.055;
  const domTowTop = horizonY - height * 0.21;
  const domGrad = ctx.createLinearGradient(domTowX, 0, domTowX + domTowW, 0);
  domGrad.addColorStop(0, "#1e1b24");
  domGrad.addColorStop(0.5, "#3b2f26");
  domGrad.addColorStop(1, "#17161f");
  ctx.fillStyle = domGrad;
  ctx.fillRect(domTowX, domTowTop, domTowW, horizonY - domTowTop);

  // Golden dome roof on the left cylindrical skyscraper
  const domeRoofGrad = ctx.createRadialGradient(
    domTowX + domTowW * 0.4,
    domTowTop - 4,
    2,
    domTowX + domTowW * 0.5,
    domTowTop,
    domTowW * 0.55
  );
  domeRoofGrad.addColorStop(0, "rgba(254, 240, 138, 0.75)");
  domeRoofGrad.addColorStop(0.6, "rgba(217, 119, 6, 0.65)");
  domeRoofGrad.addColorStop(1, "rgba(120, 53, 15, 0.5)");
  ctx.fillStyle = domeRoofGrad;
  ctx.beginPath();
  ctx.arc(
    domTowX + domTowW * 0.5,
    domTowTop,
    domTowW * 0.5,
    Math.PI,
    0
  );
  ctx.closePath();
  ctx.fill();

  // Tiny warm lit window grid on the cylindrical tower
  ctx.strokeStyle = "rgba(253, 224, 71, 0.22)";
  ctx.lineWidth = 1;
  for (let r = 1; r <= 7; r++) {
    const wy = domTowTop + r * ((horizonY - domTowTop) / 8);
    ctx.beginPath();
    ctx.moveTo(domTowX + 4, wy);
    ctx.lineTo(domTowX + domTowW - 4, wy);
    ctx.stroke();
  }

  // Iconic Right Angled Silver-White Spire Skyscraper (Contessa card landmark)
  const spX = width * 0.865;
  const spW = width * 0.044;
  const spTop = horizonY - height * 0.24;
  ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
  ctx.beginPath();
  ctx.moveTo(spX, horizonY);
  ctx.lineTo(spX, spTop + height * 0.04);
  ctx.lineTo(spX + spW * 0.35, spTop);
  ctx.lineTo(spX + spW * 0.65, spTop);
  ctx.lineTo(spX + spW, spTop + height * 0.08);
  ctx.lineTo(spX + spW, horizonY);
  ctx.closePath();
  ctx.fill();

  // Central Neo-Baroque Spiked Senate Arch Silhouette behind the High-Council Table (Duke card landmark)
  ctx.save();
  ctx.strokeStyle = "rgba(226, 232, 240, 0.14)";
  ctx.lineWidth = 2;
  const archR = Math.min(tableRx * 0.58, 210);
  const archCy = horizonY - 6;
  ctx.beginPath();
  ctx.arc(centerX, archCy, archR, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();

  // 7 Diamond Finial Spikes radiating from the central Senate Arch
  ctx.fillStyle = "rgba(226, 232, 240, 0.15)";
  for (let i = -3; i <= 3; i++) {
    const a = -Math.PI / 2 + i * 0.22;
    const bx = centerX + Math.cos(a) * (archR + 4);
    const by = archCy + Math.sin(a) * (archR + 4);
    const tx = centerX + Math.cos(a) * (archR + 24);
    const ty = archCy + Math.sin(a) * (archR + 24);
    const px = -Math.sin(a) * 4;
    const py = Math.cos(a) * 4;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo((bx + tx) * 0.5 + px, (by + ty) * 0.5 + py);
    ctx.lineTo(tx, ty);
    ctx.lineTo((bx + tx) * 0.5 - px, (by + ty) * 0.5 - py);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Animated Flying Sci-Fi Shuttles / Speeders gliding across the Dystopian Sky
  for (const [speed, yFrac, dir, scale] of [
    [0.018, 0.18, 1, 1],
    [0.012, 0.25, -1, 0.8],
  ] as const) {
    const rawT = ((nowMs * 0.001 * speed) % 1.2) - 0.1;
    const sx = dir === 1 ? width * rawT : width * (1 - rawT);
    const sy = height * yFrac;

    ctx.save();
    ctx.translate(sx, sy);
    if (dir === -1) ctx.scale(-1, 1);
    ctx.scale(scale, scale);

    // Glowing cyan contrail
    const trailGrad = ctx.createLinearGradient(-34, 0, 0, 0);
    trailGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
    trailGrad.addColorStop(1, "rgba(56, 189, 248, 0.55)");
    ctx.strokeStyle = trailGrad;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-34, 0);
    ctx.lineTo(-4, 0);
    ctx.stroke();

    // Delta-wing shuttle body
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-4, -4);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing blue thruster dot
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(-6, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. Left & Right 45° Sci-Fi Circuit-Board Trace Borders (Matching the Coup PLAY Summary Card)
  ctx.save();
  ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
  ctx.fillStyle = "rgba(56, 189, 248, 0.28)";
  ctx.lineWidth = 1.2;
  for (const side of [-1, 1]) {
    const edgeX = side === -1 ? 10 : width - 10;
    const in1 = edgeX - side * 12;
    const in2 = edgeX - side * 24;

    ctx.beginPath();
    ctx.moveTo(edgeX, height * 0.12);
    ctx.lineTo(edgeX, height * 0.28);
    ctx.lineTo(in1, height * 0.28 + 12);
    ctx.lineTo(in1, height * 0.52);
    ctx.lineTo(in2, height * 0.52 + 12);
    ctx.lineTo(in2, height * 0.72);
    ctx.lineTo(in1, height * 0.72 + 12);
    ctx.lineTo(in1, height * 0.88);
    ctx.stroke();

    // Circuit trace terminal nodes
    for (const ny of [0.28, 0.52, 0.72]) {
      ctx.beginPath();
      ctx.arc(in1, height * ny + 12, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // 4. Central 2D Dystopian High-Council Command Table
  // Outer dark metallic table shadow & bevelled steel rim
  ctx.save();
  ctx.fillStyle = "rgba(2, 6, 23, 0.75)";
  ctx.beginPath();
  ctx.ellipse(
    centerX,
    centerY + 8,
    tableRx * 1.07,
    tableRy * 1.07,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Outer brushed-gunmetal rim
  const rimGrad = ctx.createLinearGradient(
    centerX - tableRx,
    centerY - tableRy,
    centerX + tableRx,
    centerY + tableRy
  );
  rimGrad.addColorStop(0, "#334155");
  rimGrad.addColorStop(0.5, "#1e293b");
  rimGrad.addColorStop(1, "#0f172a");
  ctx.fillStyle = rimGrad;
  ctx.strokeStyle = "rgba(148, 163, 184, 0.42)";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(
    centerX,
    centerY,
    tableRx * 1.04,
    tableRy * 1.04,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  // Inner Command Table Surface (clipped for moiré damask texture & holographic faction grid)
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(
    centerX,
    centerY,
    tableRx * 0.985,
    tableRy * 0.985,
    0,
    0,
    Math.PI * 2
  );
  ctx.clip();

  const surfaceGrad = ctx.createRadialGradient(
    centerX,
    centerY,
    18,
    centerX,
    centerY,
    Math.max(tableRx, tableRy)
  );
  surfaceGrad.addColorStop(0, "#172036");
  surfaceGrad.addColorStop(0.62, "#0d1424");
  surfaceGrad.addColorStop(1, "#070b14");
  ctx.fillStyle = surfaceGrad;
  ctx.fillRect(
    centerX - tableRx,
    centerY - tableRy,
    tableRx * 2,
    tableRy * 2
  );

  // Subtle Wavy Moiré Damask Texture across the Table Surface (matching the Coup Card Back!)
  ctx.strokeStyle = "rgba(148, 163, 184, 0.055)";
  ctx.lineWidth = 1.4;
  const waveStepY = 14;
  for (
    let wy = centerY - tableRy;
    wy <= centerY + tableRy;
    wy += waveStepY
  ) {
    ctx.beginPath();
    for (let wx = centerX - tableRx; wx <= centerX + tableRx; wx += 18) {
      const sy = wy + Math.sin((wx - centerX) * 0.045) * 3.2;
      if (wx === centerX - tableRx) ctx.moveTo(wx, sy);
      else ctx.lineTo(wx, sy);
    }
    ctx.stroke();
  }

  // 5 Translucent Faction Emblem Inlays Embedded in a Ring around the Command Table
  const factionRing: CoupCharacter[] = [
    "Duke",
    "Assassin",
    "Ambassador",
    "Captain",
    "Contessa",
  ];
  factionRing.forEach((ch, idx) => {
    const ang = -Math.PI / 2 + (idx * Math.PI * 2) / 5;
    const fx = centerX + Math.cos(ang) * (tableRx * 0.62);
    const fy = centerY + Math.sin(ang) * (tableRy * 0.62);

    ctx.save();
    ctx.globalAlpha = 0.22;
    drawCoupActionIcon2D(ctx, fx, fy, 34, ch);
    ctx.restore();
  });

  ctx.restore(); // End inner table clip

  // Golden & Cyan Tactical Inner Filigree Rings on the Command Table
  ctx.strokeStyle = "rgba(245, 158, 11, 0.42)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(
    centerX,
    centerY,
    tableRx * 0.985,
    tableRy * 0.985,
    0,
    0,
    Math.PI * 2
  );
  ctx.stroke();

  ctx.strokeStyle = "rgba(56, 189, 248, 0.22)";
  ctx.lineWidth = 1.1;
  ctx.setLineDash([10, 7]);
  ctx.beginPath();
  ctx.ellipse(
    centerX,
    centerY,
    tableRx * 0.78,
    tableRy * 0.78,
    0,
    0,
    Math.PI * 2
  );
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
  ctx.restore();
}
