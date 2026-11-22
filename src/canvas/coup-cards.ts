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
    drawAssassinCard2D(ctx, x, y, w, h);
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
