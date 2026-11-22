import { drawRoundedRect, lerp } from "@/canvas/engine";
import { ROLE_META, type WerewolfRole } from "@/cartridges/werewolf";

/**
 * Computes the progress (0..1) of a card flying from the central deck to a specific Seat index
 * during the role-dealing animation at the start of a Match.
 */
export function computeCardDealProgress(
  elapsedSeconds: number,
  seatIndex: number,
  totalSeats: number
): {
  flightT: number; // 0 = at center deck, 1 = arrived at Seat
  rotationRad: number;
  scale: number;
  allDealt: boolean;
} {
  const staggerPerSeat = 0.14;
  const flightDuration = 0.55;
  const seatStart = seatIndex * staggerPerSeat;
  const raw = (elapsedSeconds - seatStart) / flightDuration;
  const clamped = Math.max(0, Math.min(1, raw));
  // Cubic ease-out
  const flightT = 1 - Math.pow(1 - clamped, 3);
  const rotationRad = (1 - flightT) * Math.PI * 1.5;
  const scale = lerp(0.55, 1, flightT);
  const totalDealDuration =
    Math.max(0, totalSeats - 1) * staggerPerSeat + flightDuration;

  return {
    flightT,
    rotationRad,
    scale,
    allDealt: elapsedSeconds >= totalDealDuration,
  };
}

/**
 * Helper to draw a furry/spiky edge along a cubic Bezier curve or circle in 2D Canvas.
 */
function drawFurryCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  spikes: number,
  spikeLen: number
) {
  ctx.beginPath();
  for (let i = 0; i <= spikes; i++) {
    const angle = (i / spikes) * Math.PI * 2;
    const isPeak = i % 2 === 1;
    const r = radius + (isPeak ? spikeLen : -spikeLen * 0.35);
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws one of the 4 spiraling spiky black werewolf limbs with 4 long curved claws
 * (in local coordinates around (0,0), scaled to `s = cardSize`).
 * Rotating by 0, 90°, 180°, 270° produces the exact 4-corner pinwheel from
 * "Les Loups-Garous de Thiercelieux".
 */
function drawWerewolfSpiralLimb(ctx: CanvasRenderingContext2D, s: number) {
  ctx.save();
  ctx.fillStyle = "#0b0908";
  ctx.strokeStyle = "#0b0908";

  // Main curved furry arm emerging from the left of the central body (-0.18s, 0.04s)
  // and sweeping up toward the top-left corner (-0.28s, -0.22s)
  ctx.beginPath();
  ctx.moveTo(-0.12 * s, 0.08 * s);
  ctx.bezierCurveTo(
    -0.25 * s,
    0.06 * s,
    -0.31 * s,
    -0.06 * s,
    -0.29 * s,
    -0.22 * s
  );
  // Palm width at the top-left
  ctx.lineTo(-0.18 * s, -0.22 * s);
  ctx.bezierCurveTo(
    -0.18 * s,
    -0.1 * s,
    -0.14 * s,
    -0.02 * s,
    -0.06 * s,
    0.01 * s
  );
  ctx.closePath();
  ctx.fill();

  // Spiky fur tufts along the outer curve of the arm
  const tuftCount = 14;
  ctx.beginPath();
  for (let i = 0; i <= tuftCount; i++) {
    const t = i / tuftCount;
    const bx = lerp(-0.19 * s, -0.29 * s, t) - Math.sin(t * Math.PI) * 0.05 * s;
    const by = lerp(0.07 * s, -0.22 * s, t);
    const outX = bx - (i % 2 === 0 ? 0.028 * s : 0.004 * s);
    const outY = by + (i % 2 === 0 ? -0.012 * s : 0.005 * s);
    if (i === 0) ctx.moveTo(bx, by);
    ctx.lineTo(outX, outY);
  }
  ctx.lineTo(-0.22 * s, -0.2 * s);
  ctx.closePath();
  ctx.fill();

  // 4 long curved claws/fingers splaying upward at the end of the paw
  const fingerOffsets = [-0.31, -0.265, -0.22, -0.175];
  const fingerHeights = [-0.44, -0.455, -0.435, -0.39];
  const fingerTipsX = [-0.33, -0.27, -0.21, -0.15];

  for (let f = 0; f < 4; f++) {
    const baseX = fingerOffsets[f] * s;
    const baseY = -0.21 * s;
    const tipX = fingerTipsX[f] * s;
    const tipY = fingerHeights[f] * s;
    const fingerW = 0.032 * s;

    ctx.beginPath();
    ctx.moveTo(baseX - fingerW * 0.5, baseY);
    ctx.quadraticCurveTo(
      baseX - fingerW * 0.85,
      (baseY + tipY) * 0.5,
      tipX,
      tipY
    );
    ctx.quadraticCurveTo(
      baseX + fingerW * 0.75,
      (baseY + tipY) * 0.5,
      baseX + fingerW * 0.5,
      baseY
    );
    ctx.closePath();
    ctx.fill();

    // Small fur barbs on the finger
    for (let b = 1; b <= 3; b++) {
      const bt = b / 4;
      const fx = lerp(baseX, tipX, bt);
      const fy = lerp(baseY, tipY, bt);
      ctx.beginPath();
      ctx.moveTo(fx - fingerW * 0.4, fy);
      ctx.lineTo(fx - fingerW * 0.95, fy - 0.014 * s);
      ctx.lineTo(fx, fy - 0.018 * s);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Draws the iconic "Les Loups-Garous de Thiercelieux" Werewolf square card illustration
 * directly on the HTML5 2D Canvas.
 */
export function drawWerewolfIllustration(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  ctx.translate(x, y);

  // 1. Textured Crimson-Red Background
  const bgGrad = ctx.createRadialGradient(
    size * 0.5,
    size * 0.5,
    size * 0.08,
    size * 0.5,
    size * 0.5,
    size * 0.72
  );
  bgGrad.addColorStop(0, "#b8291d");
  bgGrad.addColorStop(0.65, "#941b12");
  bgGrad.addColorStop(1, "#6b110b");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // Subtle oil-pastel crimson mottling patches
  ctx.fillStyle = "rgba(185, 48, 32, 0.25)";
  for (let i = 0; i < 12; i++) {
    const px = ((i * 67 + 19) % 90) * 0.01 * size;
    const py = ((i * 43 + 11) % 90) * 0.01 * size;
    ctx.beginPath();
    ctx.arc(px, py, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(size * 0.5, size * 0.5);

  // 2. Four Spiraling Black Clawed Limbs reaching to the 4 corners
  for (let arm = 0; arm < 4; arm++) {
    ctx.save();
    ctx.rotate((arm * Math.PI) / 2);
    drawWerewolfSpiralLimb(ctx, size);
    ctx.restore();
  }

  // 3. Central Circular Furry Black Wolf Body
  ctx.fillStyle = "#0b0908";
  drawFurryCircle(ctx, 0, 0, size * 0.245, 64, size * 0.022);

  // 4. Center Bone-Cream Wolf Head & Snout (tilted down-left like the original painting)
  ctx.save();
  ctx.rotate(-0.42); // ~ -24 degrees tilt

  // Warm orange-ochre aura around the cream fur face
  const faceGrad = ctx.createRadialGradient(
    -size * 0.02,
    0,
    size * 0.02,
    0,
    0,
    size * 0.2
  );
  faceGrad.addColorStop(0, "#fdf0d5");
  faceGrad.addColorStop(0.75, "#edd0a4");
  faceGrad.addColorStop(1, "#c98a55");
  ctx.fillStyle = faceGrad;

  // Head + Two Pointed Ears + Tapering Snout silhouette
  ctx.beginPath();
  // Bottom of jaw / neck right
  ctx.moveTo(size * 0.11, size * 0.06);
  // Right cheek curving up to Right Ear
  ctx.quadraticCurveTo(size * 0.16, 0, size * 0.11, -size * 0.08);
  // Right pointed ear tip
  ctx.lineTo(size * 0.13, -size * 0.17);
  ctx.lineTo(size * 0.06, -size * 0.11);
  // Forehead gap between ears
  ctx.lineTo(size * 0.03, -size * 0.11);
  // Left pointed ear tip
  ctx.lineTo(size * 0.01, -size * 0.18);
  ctx.lineTo(-size * 0.03, -size * 0.09);
  // Bridge of nose tapering out to left snout tip
  ctx.quadraticCurveTo(-size * 0.12, -size * 0.05, -size * 0.23, -size * 0.03);
  // Nose tip rounding down to upper jaw
  ctx.quadraticCurveTo(-size * 0.24, 0.01 * size, -size * 0.21, size * 0.02);
  // Open mouth cavity cut-in (back to corner of jaw)
  ctx.lineTo(-size * 0.05, size * 0.03);
  // Lower jaw extending back out to snout bottom
  ctx.lineTo(-size * 0.19, size * 0.065);
  ctx.quadraticCurveTo(
    -size * 0.12,
    size * 0.11,
    size * 0.11,
    size * 0.06
  );
  ctx.closePath();
  ctx.fill();

  // Dark mouth interior behind teeth
  ctx.fillStyle = "#140c0a";
  ctx.beginPath();
  ctx.moveTo(-size * 0.21, size * 0.015);
  ctx.lineTo(-size * 0.03, size * 0.02);
  ctx.lineTo(-size * 0.04, size * 0.07);
  ctx.lineTo(-size * 0.19, size * 0.07);
  ctx.closePath();
  ctx.fill();

  // Sharp white interlocking fangs along the jaw
  ctx.fillStyle = "#fffbeb";
  ctx.strokeStyle = "#1c1917";
  ctx.lineWidth = Math.max(1, size * 0.007);
  const toothCount = 5;
  for (let t = 0; t < toothCount; t++) {
    const tx = lerp(-size * 0.19, -size * 0.06, t / (toothCount - 1));
    // Upper fang pointing down
    ctx.beginPath();
    ctx.moveTo(tx - size * 0.012, size * 0.016);
    ctx.lineTo(tx, size * 0.048);
    ctx.lineTo(tx + size * 0.012, size * 0.016);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lower fang pointing up
    ctx.beginPath();
    ctx.moveTo(tx - size * 0.006, size * 0.072);
    ctx.lineTo(tx + size * 0.006, size * 0.042);
    ctx.lineTo(tx + size * 0.016, size * 0.072);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Glowing Blood-Red Oval Eye with black rim and dark pupil
  const eyeX = size * 0.045;
  const eyeY = -size * 0.018;

  // Reddish-orange pastel smudge around eye
  const eyeGlow = ctx.createRadialGradient(
    eyeX,
    eyeY,
    size * 0.01,
    eyeX,
    eyeY,
    size * 0.065
  );
  eyeGlow.addColorStop(0, "rgba(220, 38, 38, 0.55)");
  eyeGlow.addColorStop(1, "rgba(220, 38, 38, 0)");
  ctx.fillStyle = eyeGlow;
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, size * 0.065, 0, Math.PI * 2);
  ctx.fill();

  // Black outer eye ring
  ctx.fillStyle = "#0b0908";
  ctx.beginPath();
  ctx.ellipse(eyeX, eyeY, size * 0.04, size * 0.025, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Crimson iris
  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  ctx.ellipse(eyeX, eyeY, size * 0.03, size * 0.017, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Dark pupil core
  ctx.fillStyle = "#1c0908";
  ctx.beginPath();
  ctx.ellipse(eyeX, eyeY, size * 0.014, size * 0.007, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Nostril dot at snout tip
  ctx.fillStyle = "#1c0908";
  ctx.beginPath();
  ctx.arc(-size * 0.21, -size * 0.008, size * 0.009, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // end head tilt
  ctx.restore(); // end center translation

  // 5. Bold Black Square Frame Border (matching the physical card border)
  ctx.strokeStyle = "#09090b";
  ctx.lineWidth = Math.max(3, size * 0.045);
  ctx.strokeRect(0, 0, size, size);

  ctx.restore();
}

/**
 * Draws one of the 8 radial villager silhouettes standing around the central spiral circle
 * (in local coordinates where (0, 0) is the card center, and negative Y is outward toward 12 o'clock,
 * with feet at y ≈ -0.175 * s and head at y ≈ -0.43 * s).
 */
function drawVillagerSilhouetteByIndex(
  ctx: CanvasRenderingContext2D,
  index: number,
  s: number
) {
  const isDiagonal = index % 2 === 1;
  ctx.fillStyle = isDiagonal ? "#64261b" : "#b38236";
  ctx.strokeStyle = isDiagonal ? "#64261b" : "#b38236";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (index) {
    case 0: {
      // 12 o'clock (Cardinal Tan): Child jumping/running with arms raised overhead & a small ball
      // Legs (running stride)
      ctx.lineWidth = s * 0.022;
      ctx.beginPath();
      ctx.moveTo(-s * 0.055, -s * 0.21);
      ctx.lineTo(-s * 0.025, -s * 0.24);
      ctx.lineTo(-s * 0.01, -s * 0.27);
      ctx.moveTo(s * 0.025, -s * 0.185);
      ctx.lineTo(s * 0.02, -s * 0.24);
      ctx.lineTo(s * 0.005, -s * 0.27);
      ctx.stroke();

      // Torso
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.305, s * 0.028, s * 0.045, 0.08, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.arc(0, -s * 0.365, s * 0.021, 0, Math.PI * 2);
      ctx.fill();

      // Raised arms reaching up
      ctx.lineWidth = s * 0.014;
      ctx.beginPath();
      ctx.moveTo(-s * 0.02, -s * 0.33);
      ctx.quadraticCurveTo(-s * 0.04, -s * 0.38, -s * 0.015, -s * 0.425);
      ctx.moveTo(s * 0.02, -s * 0.33);
      ctx.quadraticCurveTo(s * 0.045, -s * 0.38, s * 0.035, -s * 0.425);
      ctx.stroke();

      // Small ball above hands
      ctx.beginPath();
      ctx.arc(s * 0.014, -s * 0.435, s * 0.018, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 1: {
      // 1:30 Top-Right (Diagonal Dark Rust): Broad-shouldered stocky villager with hat
      // Sturdy legs & feet
      ctx.lineWidth = s * 0.032;
      ctx.beginPath();
      ctx.moveTo(-s * 0.032, -s * 0.18);
      ctx.lineTo(-s * 0.036, -s * 0.27);
      ctx.moveTo(s * 0.032, -s * 0.18);
      ctx.lineTo(s * 0.036, -s * 0.27);
      ctx.stroke();

      // Broad coat / torso
      ctx.beginPath();
      ctx.moveTo(-s * 0.055, -s * 0.25);
      ctx.lineTo(-s * 0.068, -s * 0.36);
      ctx.quadraticCurveTo(0, -s * 0.385, s * 0.068, -s * 0.36);
      ctx.lineTo(s * 0.055, -s * 0.25);
      ctx.closePath();
      ctx.fill();

      // Curved arms hanging down
      ctx.lineWidth = s * 0.022;
      ctx.beginPath();
      ctx.moveTo(-s * 0.062, -s * 0.355);
      ctx.quadraticCurveTo(-s * 0.095, -s * 0.31, -s * 0.075, -s * 0.255);
      ctx.moveTo(s * 0.062, -s * 0.355);
      ctx.quadraticCurveTo(s * 0.095, -s * 0.31, s * 0.075, -s * 0.255);
      ctx.stroke();

      // Head + flat peasant cap
      ctx.beginPath();
      ctx.arc(0, -s * 0.405, s * 0.028, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.425, s * 0.038, s * 0.015, -0.1, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 2: {
      // 3 o'clock (Cardinal Tan): Elder / Shepherd with curved walking cane
      // Legs
      ctx.lineWidth = s * 0.022;
      ctx.beginPath();
      ctx.moveTo(-s * 0.022, -s * 0.185);
      ctx.lineTo(-s * 0.02, -s * 0.27);
      ctx.moveTo(s * 0.025, -s * 0.195);
      ctx.lineTo(s * 0.018, -s * 0.27);
      ctx.stroke();

      // Tunic torso
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.31, s * 0.038, s * 0.055, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.arc(0, -s * 0.39, s * 0.024, 0, Math.PI * 2);
      ctx.fill();

      // Arms (left arm holding shepherd's crook, right arm curved)
      ctx.lineWidth = s * 0.015;
      ctx.beginPath();
      ctx.moveTo(-s * 0.03, -s * 0.34);
      ctx.quadraticCurveTo(-s * 0.08, -s * 0.33, -s * 0.085, -s * 0.29);
      ctx.moveTo(s * 0.03, -s * 0.34);
      ctx.quadraticCurveTo(s * 0.075, -s * 0.32, s * 0.055, -s * 0.26);
      ctx.stroke();

      // Shepherd's crook / curved cane extending from hand down to central ring
      ctx.lineWidth = s * 0.01;
      ctx.beginPath();
      ctx.moveTo(-s * 0.065, -s * 0.19);
      ctx.lineTo(-s * 0.095, -s * 0.315);
      ctx.arc(-s * 0.098, -s * 0.325, s * 0.014, 0, Math.PI * 1.35, true);
      ctx.stroke();
      break;
    }

    case 3: {
      // 4:30 Bottom-Right (Diagonal Dark Rust): Striding tall villager with wide stance
      // Wide-striding legs
      ctx.lineWidth = s * 0.027;
      ctx.beginPath();
      ctx.moveTo(-s * 0.055, -s * 0.185);
      ctx.lineTo(-s * 0.02, -s * 0.275);
      ctx.moveTo(s * 0.05, -s * 0.195);
      ctx.lineTo(s * 0.02, -s * 0.275);
      ctx.stroke();

      // Coat torso
      ctx.beginPath();
      ctx.moveTo(-s * 0.038, -s * 0.265);
      ctx.lineTo(-s * 0.046, -s * 0.365);
      ctx.lineTo(s * 0.046, -s * 0.365);
      ctx.lineTo(s * 0.038, -s * 0.265);
      ctx.closePath();
      ctx.fill();

      // Swinging arms
      ctx.lineWidth = s * 0.019;
      ctx.beginPath();
      ctx.moveTo(-s * 0.04, -s * 0.35);
      ctx.quadraticCurveTo(-s * 0.09, -s * 0.32, -s * 0.095, -s * 0.26);
      ctx.moveTo(s * 0.04, -s * 0.35);
      ctx.quadraticCurveTo(s * 0.088, -s * 0.32, s * 0.085, -s * 0.27);
      ctx.stroke();

      // Head & cap
      ctx.beginPath();
      ctx.arc(0, -s * 0.405, s * 0.026, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 4: {
      // 6 o'clock (Cardinal Tan): Woman in skirt with arms spread out wide
      // Two small feet at base
      ctx.lineWidth = s * 0.018;
      ctx.beginPath();
      ctx.moveTo(-s * 0.022, -s * 0.175);
      ctx.lineTo(-s * 0.022, -s * 0.215);
      ctx.moveTo(s * 0.022, -s * 0.175);
      ctx.lineTo(s * 0.022, -s * 0.215);
      ctx.stroke();

      // Trapezoid dress / skirt + waist
      ctx.beginPath();
      ctx.moveTo(-s * 0.052, -s * 0.21);
      ctx.lineTo(-s * 0.032, -s * 0.345);
      ctx.lineTo(s * 0.032, -s * 0.345);
      ctx.lineTo(s * 0.052, -s * 0.21);
      ctx.closePath();
      ctx.fill();

      // Outstretched welcoming arms
      ctx.lineWidth = s * 0.015;
      ctx.beginPath();
      ctx.moveTo(-s * 0.028, -s * 0.335);
      ctx.quadraticCurveTo(-s * 0.075, -s * 0.345, -s * 0.115, -s * 0.38);
      ctx.moveTo(s * 0.028, -s * 0.335);
      ctx.quadraticCurveTo(s * 0.075, -s * 0.345, s * 0.115, -s * 0.38);
      ctx.stroke();

      // Head + bonnet
      ctx.beginPath();
      ctx.arc(0, -s * 0.39, s * 0.025, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 5: {
      // 7:30 Bottom-Left (Diagonal Dark Rust): Villager walking in tunic/trousers
      // Legs
      ctx.lineWidth = s * 0.028;
      ctx.beginPath();
      ctx.moveTo(-s * 0.035, -s * 0.185);
      ctx.lineTo(-s * 0.022, -s * 0.275);
      ctx.moveTo(s * 0.03, -s * 0.185);
      ctx.lineTo(s * 0.02, -s * 0.275);
      ctx.stroke();

      // Torso
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.32, s * 0.044, s * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();

      // Arms
      ctx.lineWidth = s * 0.019;
      ctx.beginPath();
      ctx.moveTo(-s * 0.04, -s * 0.35);
      ctx.quadraticCurveTo(-s * 0.08, -s * 0.31, -s * 0.065, -s * 0.255);
      ctx.moveTo(s * 0.04, -s * 0.35);
      ctx.quadraticCurveTo(s * 0.08, -s * 0.31, s * 0.065, -s * 0.255);
      ctx.stroke();

      // Head
      ctx.beginPath();
      ctx.arc(0, -s * 0.405, s * 0.026, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 6: {
      // 9 o'clock (Cardinal Tan): Stout dancing villager in wide tunic
      // Legs
      ctx.lineWidth = s * 0.02;
      ctx.beginPath();
      ctx.moveTo(-s * 0.028, -s * 0.18);
      ctx.lineTo(-s * 0.024, -s * 0.235);
      ctx.moveTo(s * 0.028, -s * 0.18);
      ctx.lineTo(s * 0.024, -s * 0.235);
      ctx.stroke();

      // Rounded billowing tunic body
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.295, s * 0.052, s * 0.068, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dancing curved arms
      ctx.lineWidth = s * 0.016;
      ctx.beginPath();
      ctx.moveTo(-s * 0.04, -s * 0.335);
      ctx.quadraticCurveTo(-s * 0.095, -s * 0.34, -s * 0.105, -s * 0.28);
      ctx.moveTo(s * 0.04, -s * 0.335);
      ctx.quadraticCurveTo(s * 0.095, -s * 0.32, s * 0.08, -s * 0.245);
      ctx.stroke();

      // Head
      ctx.beginPath();
      ctx.arc(0, -s * 0.39, s * 0.025, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    default: {
      // 10:30 Top-Left (Diagonal Dark Rust): Woman in long A-line dress with hair bun
      // Small feet peeking under long dress
      ctx.lineWidth = s * 0.018;
      ctx.beginPath();
      ctx.moveTo(-s * 0.022, -s * 0.175);
      ctx.lineTo(-s * 0.022, -s * 0.21);
      ctx.moveTo(s * 0.022, -s * 0.175);
      ctx.lineTo(s * 0.022, -s * 0.21);
      ctx.stroke();

      // Long flared A-line dress + slender bodice
      ctx.beginPath();
      ctx.moveTo(-s * 0.064, -s * 0.205);
      ctx.lineTo(-s * 0.032, -s * 0.36);
      ctx.lineTo(s * 0.032, -s * 0.36);
      ctx.lineTo(s * 0.064, -s * 0.205);
      ctx.closePath();
      ctx.fill();

      // Slender arms curving down outside the dress
      ctx.lineWidth = s * 0.018;
      ctx.beginPath();
      ctx.moveTo(-s * 0.032, -s * 0.355);
      ctx.quadraticCurveTo(-s * 0.082, -s * 0.31, -s * 0.072, -s * 0.25);
      ctx.moveTo(s * 0.032, -s * 0.355);
      ctx.quadraticCurveTo(s * 0.082, -s * 0.31, s * 0.072, -s * 0.25);
      ctx.stroke();

      // Head + top hair bun
      ctx.beginPath();
      ctx.arc(0, -s * 0.4, s * 0.025, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -s * 0.428, s * 0.014, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
}

/**
 * Draws the iconic "Les Loups-Garous de Thiercelieux" Simple Villageois (Villager)
 * square card illustration directly on the HTML5 2D Canvas.
 */
export function drawVillagerIllustration(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  ctx.translate(x, y);

  // 1. Warm Parchment / Sandy Ochre Mottled Background
  const bgGrad = ctx.createRadialGradient(
    size * 0.5,
    size * 0.5,
    size * 0.08,
    size * 0.5,
    size * 0.5,
    size * 0.72
  );
  bgGrad.addColorStop(0, "#fae19c");
  bgGrad.addColorStop(0.65, "#efc468");
  bgGrad.addColorStop(1, "#dba84a");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // Subtle pastel texture blotches
  ctx.fillStyle = "rgba(255, 236, 179, 0.32)";
  for (let i = 0; i < 14; i++) {
    const px = ((i * 61 + 17) % 90) * 0.01 * size;
    const py = ((i * 47 + 23) % 90) * 0.01 * size;
    ctx.beginPath();
    ctx.arc(px, py, size * 0.11, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(size * 0.5, size * 0.5);

  // 2. Eight Villager Silhouettes standing radially around the central circle
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 4);
    drawVillagerSilhouetteByIndex(ctx, i, size);
    ctx.restore();
  }

  // 3. Central Dark Charcoal-Black Outer Ring
  ctx.fillStyle = "#231b14";
  drawFurryCircle(ctx, 0, 0, size * 0.152, 72, size * 0.004);

  // 4. Inner Golden Sun Disk
  ctx.fillStyle = "#f7c236";
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.128, 0, Math.PI * 2);
  ctx.fill();

  // 5. Archimedean Golden-Brown Spiral in the center of the Sun Disk
  ctx.strokeStyle = "#b87a24";
  ctx.lineWidth = Math.max(1.5, size * 0.018);
  ctx.lineCap = "round";
  ctx.beginPath();
  const maxTheta = Math.PI * 2 * 3.35;
  const maxSpiralR = size * 0.114;
  const steps = 90;
  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    const theta = t * maxTheta;
    const r = t * maxSpiralR;
    const sx = Math.cos(theta) * r;
    const sy = Math.sin(theta) * r;
    if (step === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();

  ctx.restore(); // end center translation

  // 6. Bold Black Square Frame Border
  ctx.strokeStyle = "#09090b";
  ctx.lineWidth = Math.max(3, size * 0.045);
  ctx.strokeRect(0, 0, size, size);

  ctx.restore();
}

/**
 * Helper to draw one of the Hunter's rifles firing a 3-pronged muzzle flash.
 * Drawn in local coordinates around (0, 0) near the top of the card (pointing left);
 * rotating by Math.PI draws the bottom rifle pointing right.
 */
function drawHunterRifle(
  ctx: CanvasRenderingContext2D,
  s: number,
  bodyColor: string
) {
  ctx.save();

  // 1. Radiating background needle dashes in this half
  ctx.strokeStyle =
    bodyColor === "#d8c26b"
      ? "rgba(154, 152, 124, 0.55)"
      : "rgba(130, 152, 160, 0.55)";
  ctx.lineWidth = Math.max(1, s * 0.008);
  ctx.lineCap = "round";
  for (let i = 0; i < 24; i++) {
    const t = i / 23 - 0.5;
    const bx = t * s * 0.92;
    const by = -s * (0.46 - Math.abs(t) * 0.22 - (i % 3) * 0.045);
    const ang = t * 0.85 + (i % 2 === 0 ? 0.15 : -0.15);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(
      bx + Math.cos(ang + Math.PI * 0.5) * s * 0.055,
      by + Math.sin(ang + Math.PI * 0.5) * s * 0.055
    );
    ctx.stroke();
  }

  // 2. Muzzle Flash at the left tip of the barrel (-0.31s, -0.395s)
  ctx.fillStyle = "#fdf2f0";
  ctx.strokeStyle = "#b91c1c";
  ctx.lineWidth = Math.max(1, s * 0.009);
  ctx.beginPath();
  ctx.moveTo(-s * 0.3, -s * 0.395);
  ctx.lineTo(-s * 0.415, -s * 0.425);
  ctx.lineTo(-s * 0.375, -s * 0.398);
  ctx.lineTo(-s * 0.425, -s * 0.392);
  ctx.lineTo(-s * 0.375, -s * 0.382);
  ctx.lineTo(-s * 0.4, -s * 0.362);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner red flame streaks inside the muzzle flash
  ctx.beginPath();
  ctx.moveTo(-s * 0.305, -s * 0.395);
  ctx.lineTo(-s * 0.37, -s * 0.408);
  ctx.moveTo(-s * 0.305, -s * 0.393);
  ctx.lineTo(-s * 0.365, -s * 0.382);
  ctx.stroke();

  // 3. Rifle Barrel, Fore-end, Receiver, Trigger Guard & Angled Buttstock
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = "#1c1917";
  ctx.lineWidth = Math.max(1, s * 0.008);

  ctx.beginPath();
  // Top-left barrel tip
  ctx.moveTo(-s * 0.302, -s * 0.408);
  // Top of barrel running right to receiver
  ctx.lineTo(s * 0.18, -s * 0.408);
  // Slight dip at wrist of stock, then angled down-right to top of buttstock
  ctx.lineTo(s * 0.26, -s * 0.37);
  ctx.lineTo(s * 0.425, -s * 0.34);
  // Buttplate down to bottom of stock
  ctx.lineTo(s * 0.42, -s * 0.255);
  // Bottom edge of buttstock angling up-left back to receiver
  ctx.lineTo(s * 0.22, -s * 0.335);
  // Bottom of fore-end under barrel
  ctx.lineTo(s * 0.16, -s * 0.365);
  ctx.lineTo(-s * 0.07, -s * 0.365);
  ctx.lineTo(-s * 0.08, -s * 0.385);
  ctx.lineTo(-s * 0.302, -s * 0.385);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Hammer Spur & Trigger Guard loop
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = Math.max(1.5, s * 0.015);
  ctx.beginPath();
  // Hammer spur on top of receiver
  ctx.moveTo(s * 0.185, -s * 0.405);
  ctx.lineTo(s * 0.195, -s * 0.428);
  // Trigger guard loop below receiver
  ctx.moveTo(s * 0.155, -s * 0.365);
  ctx.quadraticCurveTo(s * 0.185, -s * 0.325, s * 0.215, -s * 0.345);
  ctx.stroke();

  // Black Fore-end Bar under barrel
  ctx.fillStyle = "#141413";
  drawRoundedRect(
    ctx,
    -s * 0.065,
    -s * 0.398,
    s * 0.23,
    s * 0.024,
    s * 0.008
  );
  ctx.fill();

  // Black Inlay Panel on the Angled Buttstock + Wavy White S-Line
  ctx.beginPath();
  ctx.moveTo(s * 0.285, -s * 0.352);
  ctx.lineTo(s * 0.405, -s * 0.33);
  ctx.lineTo(s * 0.402, -s * 0.275);
  ctx.lineTo(s * 0.275, -s * 0.322);
  ctx.closePath();
  ctx.fillStyle = "#141413";
  ctx.fill();

  ctx.strokeStyle = "#e7e5e4";
  ctx.lineWidth = Math.max(1, s * 0.008);
  ctx.beginPath();
  ctx.moveTo(s * 0.295, -s * 0.332);
  ctx.bezierCurveTo(
    s * 0.33,
    -s * 0.35,
    s * 0.35,
    -s * 0.29,
    s * 0.392,
    -s * 0.305
  );
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws the iconic "Les Loups-Garous de Thiercelieux" Le Chasseur (Hunter)
 * square card illustration directly on the HTML5 2D Canvas.
 */
export function drawHunterIllustration(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  ctx.translate(x, y);

  // 1. Upper Olive-Slate Background & Lower Sandy-Gold Background
  ctx.fillStyle = "#505544";
  ctx.fillRect(0, 0, size, size * 0.52);
  ctx.fillStyle = "#e5c967";
  ctx.fillRect(0, size * 0.48, size, size * 0.52);

  ctx.save();
  ctx.translate(size * 0.5, size * 0.5);

  // 2. Top Rifle (Golden-tan firing left) & Bottom Rifle (Olive-green firing right)
  drawHunterRifle(ctx, size, "#d8c26b");
  ctx.save();
  ctx.rotate(Math.PI);
  drawHunterRifle(ctx, size, "#5f6550");
  ctx.restore();

  // 3. Giant Central Almond Eye / Scope Lens
  const eyeRx = size * 0.47;
  const eyeRy = size * 0.285;
  const defineEyePath = () => {
    ctx.beginPath();
    ctx.moveTo(-eyeRx, 0);
    ctx.bezierCurveTo(
      -eyeRx * 0.55,
      -eyeRy * 1.32,
      eyeRx * 0.55,
      -eyeRy * 1.32,
      eyeRx,
      0
    );
    ctx.bezierCurveTo(
      eyeRx * 0.55,
      eyeRy * 1.32,
      -eyeRx * 0.55,
      eyeRy * 1.32,
      -eyeRx,
      0
    );
    ctx.closePath();
  };

  defineEyePath();
  const eyeGrad = ctx.createRadialGradient(0, 0, size * 0.05, 0, 0, eyeRx);
  eyeGrad.addColorStop(0, "#fae185");
  eyeGrad.addColorStop(0.7, "#f3c762");
  eyeGrad.addColorStop(1, "#e59e3c");
  ctx.fillStyle = eyeGrad;
  ctx.fill();

  // Clip inside the Giant Eye to draw the Blue Human Profile, Black Werewolf Profile & Target Bullseye
  ctx.save();
  defineEyePath();
  ctx.clip();

  // 4. Stippled Icy Sky-Blue Human Head Profile (facing right, behind the Werewolf)
  const defineHumanProfile = () => {
    ctx.beginPath();
    ctx.moveTo(size * 0.04, size * 0.3);
    ctx.lineTo(size * 0.08, -size * 0.12);
    // Top of head & forehead
    ctx.quadraticCurveTo(size * 0.26, -size * 0.15, size * 0.285, -size * 0.05);
    // Brow & nose bridge jutting right
    ctx.lineTo(size * 0.28, -size * 0.01);
    ctx.lineTo(size * 0.312, size * 0.035);
    ctx.lineTo(size * 0.285, size * 0.05);
    // Upper/lower lips & chin
    ctx.lineTo(size * 0.298, size * 0.072);
    ctx.lineTo(size * 0.282, size * 0.09);
    ctx.quadraticCurveTo(size * 0.295, size * 0.135, size * 0.23, size * 0.14);
    // Front of neck going down
    ctx.quadraticCurveTo(size * 0.22, size * 0.21, size * 0.24, size * 0.29);
    ctx.closePath();
  };

  defineHumanProfile();
  ctx.fillStyle = "#91bad6";
  ctx.fill();
  ctx.strokeStyle = "#5b84a1";
  ctx.lineWidth = Math.max(1, size * 0.008);
  ctx.stroke();

  // Stippled pastel dots on the blue human face
  ctx.save();
  defineHumanProfile();
  ctx.clip();
  ctx.fillStyle = "rgba(224, 242, 254, 0.55)";
  for (let i = 0; i < 38; i++) {
    const hx = size * (0.12 + ((i * 37) % 19) * 0.01);
    const hy = size * (-0.12 + ((i * 29) % 38) * 0.01);
    ctx.beginPath();
    ctx.arc(hx, hy, size * 0.007, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Small golden eye on the blue human profile
  ctx.fillStyle = "#eab308";
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = Math.max(0.8, size * 0.005);
  ctx.beginPath();
  ctx.ellipse(
    size * 0.262,
    size * 0.002,
    size * 0.014,
    size * 0.008,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  // 5. Black Furry Werewolf Profile (facing right, overlapping the human profile)
  ctx.fillStyle = "#141210";
  ctx.beginPath();
  // Bottom-left shoulder base inside eye
  ctx.moveTo(-size * 0.37, size * 0.19);
  // Spiky furry back of neck rising up to the head
  const backSteps = 16;
  for (let b = 0; b <= backSteps; b++) {
    const t = b / backSteps;
    const bx = lerp(-size * 0.36, -size * 0.04, t);
    const by = lerp(size * 0.17, -size * 0.15, Math.pow(t, 0.85));
    const spike = b % 2 === 0 ? -size * 0.022 : 0;
    ctx.lineTo(bx + spike * 0.6, by + spike);
  }
  // Two pointed wolf ears on top of head
  ctx.lineTo(size * 0.03, -size * 0.165);
  ctx.lineTo(size * 0.08, -size * 0.19);
  ctx.lineTo(size * 0.055, -size * 0.13);
  ctx.lineTo(size * 0.145, -size * 0.14);
  ctx.lineTo(size * 0.11, -size * 0.085);
  // Snout bridge extending right across the blue human face
  ctx.lineTo(size * 0.258, -size * 0.022);
  ctx.lineTo(size * 0.245, size * 0.015);
  // Open upper jaw mouth roof
  ctx.lineTo(size * 0.085, size * 0.025);
  // Open lower jaw extending out to right
  ctx.lineTo(size * 0.238, size * 0.072);
  ctx.lineTo(size * 0.222, size * 0.098);
  ctx.lineTo(size * 0.065, size * 0.092);
  // Front furry chest curving down to bottom center of eye
  ctx.quadraticCurveTo(size * 0.1, size * 0.19, size * 0.15, size * 0.28);
  ctx.lineTo(-size * 0.37, size * 0.28);
  ctx.closePath();
  ctx.fill();

  // Sharp teeth inside the Werewolf's open jaws (over the blue face)
  ctx.fillStyle = "#e0f2fe";
  for (let f = 0; f < 5; f++) {
    const fx = lerp(size * 0.105, size * 0.215, f / 4);
    // Upper tooth
    ctx.beginPath();
    ctx.moveTo(fx - size * 0.009, size * 0.02);
    ctx.lineTo(fx, size * 0.05);
    ctx.lineTo(fx + size * 0.009, size * 0.02);
    ctx.closePath();
    ctx.fill();
    // Lower tooth
    ctx.beginPath();
    ctx.moveTo(fx - size * 0.006, size * 0.082);
    ctx.lineTo(fx + size * 0.004, size * 0.054);
    ctx.lineTo(fx + size * 0.012, size * 0.082);
    ctx.closePath();
    ctx.fill();
  }

  // 6. Four Concentric Crimson-Red Target Bullseye Rings Centered on the Wolf's Eye
  const bullX = -size * 0.005;
  const bullY = -size * 0.005;
  const ringRadii = [0.232, 0.172, 0.112, 0.052];
  ctx.strokeStyle = "#ad241a";
  ctx.lineWidth = Math.max(2, size * 0.026);
  for (const rFrac of ringRadii) {
    ctx.beginPath();
    ctx.arc(bullX, bullY, size * rFrac, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Wolf's small golden almond eye right in the center of the smallest bullseye ring
  ctx.fillStyle = "#ebd075";
  ctx.beginPath();
  ctx.ellipse(
    bullX - size * 0.006,
    bullY,
    size * 0.016,
    size * 0.008,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.restore(); // end eye clip

  // Dark outline along the Giant Eye contour
  defineEyePath();
  ctx.strokeStyle = "#1c1917";
  ctx.lineWidth = Math.max(1.5, size * 0.012);
  ctx.stroke();

  ctx.restore(); // end center translation

  // 7. Bold Black Square Frame Border
  ctx.strokeStyle = "#09090b";
  ctx.lineWidth = Math.max(3, size * 0.045);
  ctx.strokeRect(0, 0, size, size);

  ctx.restore();
}

/**
 * Helper that draws one symmetric half of the Seer (La Voyante) card around (0, 0):
 * - Top-left mottled golden yellow corner backdrop
 * - Top chin, parted lips, ears & dangling pendulum earrings + collar zig-zag
 * - Bottom-left polka-dotted lavender sleeve, white cuff, and 5-fingered hand with golden eye starburst
 * Calling this at rotation 0 and Math.PI reproduces the exact 180° ambigram symmetry of the card.
 */
function drawSeerSymmetricHalf(ctx: CanvasRenderingContext2D, s: number) {
  ctx.save();

  // 1. Top-Left Golden Yellow Textured Corner Patch
  ctx.beginPath();
  ctx.moveTo(-s * 0.5, -s * 0.5);
  ctx.lineTo(-s * 0.09, -s * 0.5);
  ctx.quadraticCurveTo(-s * 0.07, -s * 0.27, -s * 0.14, -s * 0.25);
  ctx.quadraticCurveTo(-s * 0.34, -s * 0.25, -s * 0.5, -s * 0.14);
  ctx.closePath();
  ctx.fillStyle = "#e5c553";
  ctx.fill();

  // Subtle mottled texture on the golden corner
  ctx.fillStyle = "rgba(180, 145, 35, 0.28)";
  for (let i = 0; i < 8; i++) {
    const gx = -s * (0.45 - (i % 4) * 0.09);
    const gy = -s * (0.44 - Math.floor(i / 4) * 0.11);
    ctx.beginPath();
    ctx.arc(gx, gy, s * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Lavender collar zig-zag shadow under the chin
  ctx.fillStyle = "#916199";
  ctx.beginPath();
  ctx.moveTo(-s * 0.01, -s * 0.35);
  ctx.lineTo(-s * 0.065, -s * 0.34);
  ctx.lineTo(-s * 0.025, -s * 0.315);
  ctx.lineTo(-s * 0.065, -s * 0.305);
  ctx.lineTo(-s * 0.025, -s * 0.285);
  ctx.lineTo(-s * 0.06, -s * 0.275);
  ctx.lineTo(-s * 0.01, -s * 0.25);
  ctx.lineTo(s * 0.015, -s * 0.25);
  ctx.lineTo(s * 0.015, -s * 0.35);
  ctx.closePath();
  ctx.fill();

  // 3. Top Lower-Face (Chin, Jawline, Lips & Dangling Earrings)
  // Dangling Earrings (Left = Dark Red bead, Right = Golden Yellow bead)
  ctx.strokeStyle = "#18181b";
  ctx.lineWidth = Math.max(1, s * 0.008);
  ctx.beginPath();
  ctx.moveTo(-s * 0.105, -s * 0.47);
  ctx.lineTo(-s * 0.105, -s * 0.385);
  ctx.moveTo(s * 0.105, -s * 0.47);
  ctx.lineTo(s * 0.105, -s * 0.385);
  ctx.stroke();

  // Left dark-red earring bead
  ctx.fillStyle = "#6b1d20";
  ctx.beginPath();
  ctx.arc(-s * 0.105, -s * 0.375, s * 0.014, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Right golden earring bead
  ctx.fillStyle = "#eab308";
  ctx.beginPath();
  ctx.arc(s * 0.105, -s * 0.375, s * 0.014, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Small earlobes at top edge
  ctx.fillStyle = "#d97f59";
  ctx.beginPath();
  ctx.arc(-s * 0.102, -s * 0.485, s * 0.016, 0, Math.PI * 2);
  ctx.arc(s * 0.102, -s * 0.485, s * 0.016, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Chin & lower face oval
  ctx.fillStyle = "#d97f59";
  ctx.strokeStyle = "#18181b";
  ctx.lineWidth = Math.max(1.2, s * 0.012);
  ctx.beginPath();
  ctx.moveTo(-s * 0.095, -s * 0.5);
  ctx.bezierCurveTo(
    -s * 0.095,
    -s * 0.31,
    s * 0.095,
    -s * 0.31,
    s * 0.095,
    -s * 0.5
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Pale inner highlight along jawline
  ctx.strokeStyle = "rgba(254, 243, 199, 0.7)";
  ctx.lineWidth = Math.max(1, s * 0.008);
  ctx.beginPath();
  ctx.moveTo(-s * 0.082, -s * 0.48);
  ctx.bezierCurveTo(
    -s * 0.078,
    -s * 0.33,
    s * 0.078,
    -s * 0.33,
    s * 0.082,
    -s * 0.48
  );
  ctx.stroke();

  // Parted Dark Crimson Lips + White Teeth
  ctx.fillStyle = "#5c1c1e";
  ctx.strokeStyle = "#18181b";
  ctx.lineWidth = Math.max(1, s * 0.008);
  ctx.beginPath();
  ctx.moveTo(-s * 0.036, -s * 0.445);
  ctx.quadraticCurveTo(-s * 0.015, -s * 0.462, 0, -s * 0.452);
  ctx.quadraticCurveTo(s * 0.015, -s * 0.462, s * 0.036, -s * 0.445);
  ctx.quadraticCurveTo(0, -s * 0.415, -s * 0.036, -s * 0.445);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#fafaf9";
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.444, s * 0.02, s * 0.007, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. Bottom-Left Polka-Dotted Sleeve + White Cuff + Mystic Hand reaching up
  ctx.save();
  // Sleeve polygon from bottom-left corner up to wrist cuff
  ctx.beginPath();
  ctx.moveTo(-s * 0.5, s * 0.24);
  ctx.lineTo(-s * 0.38, s * 0.13);
  ctx.lineTo(-s * 0.295, s * 0.165);
  ctx.lineTo(-s * 0.31, s * 0.5);
  ctx.lineTo(-s * 0.5, s * 0.5);
  ctx.closePath();
  ctx.fillStyle = "#8a5691";
  ctx.fill();

  // Lilac Polka Dots on sleeve
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "#b88bc0";
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 5; col++) {
      const dx = -s * 0.49 + col * s * 0.045 + (row % 2) * s * 0.02;
      const dy = s * 0.16 + row * s * 0.05;
      ctx.beginPath();
      ctx.arc(dx, dy, s * 0.011, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // White Rounded Wrist Cuff
  ctx.save();
  ctx.translate(-s * 0.338, s * 0.148);
  ctx.rotate(0.38);
  ctx.fillStyle = "#f5f5f4";
  ctx.strokeStyle = "#3f3f46";
  ctx.lineWidth = Math.max(1, s * 0.008);
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.052, s * 0.017, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Terracotta Hand + 5 Long Slender Fingers reaching upward on the left
  ctx.fillStyle = "#dd815b";
  ctx.strokeStyle = "#4b2c20";
  ctx.lineWidth = Math.max(0.8, s * 0.006);

  // Palm base
  ctx.beginPath();
  ctx.moveTo(-s * 0.365, s * 0.13);
  ctx.quadraticCurveTo(-s * 0.39, s * 0.04, -s * 0.37, -s * 0.02);
  ctx.lineTo(-s * 0.295, -s * 0.01);
  ctx.quadraticCurveTo(-s * 0.27, s * 0.07, -s * 0.31, s * 0.15);
  ctx.closePath();
  ctx.fill();

  // Thumb pointing up-left
  ctx.lineCap = "round";
  ctx.strokeStyle = "#dd815b";
  ctx.lineWidth = s * 0.02;
  ctx.beginPath();
  ctx.moveTo(-s * 0.37, s * 0.05);
  ctx.quadraticCurveTo(-s * 0.41, 0, -s * 0.405, -s * 0.055);
  ctx.stroke();

  // 4 long slender fingers curving slightly toward the top-right
  const fStarts = [
    [-0.365, -0.01],
    [-0.345, -0.015],
    [-0.322, -0.012],
    [-0.302, -0.002],
  ];
  const fTips = [
    [-0.335, -0.145],
    [-0.308, -0.165],
    [-0.28, -0.155],
    [-0.258, -0.125],
  ];
  ctx.lineWidth = s * 0.016;
  for (let f = 0; f < 4; f++) {
    const [sx, sy] = fStarts[f];
    const [tx, ty] = fTips[f];
    ctx.beginPath();
    ctx.moveTo(sx * s, sy * s);
    ctx.quadraticCurveTo(
      ((sx + tx) * 0.5 - 0.008) * s,
      ((sy + ty) * 0.5) * s,
      tx * s,
      ty * s
    );
    ctx.stroke();
  }

  // Golden Starburst Eye Tattoo on the back of the hand
  const hx = -s * 0.328;
  const hy = s * 0.058;
  ctx.fillStyle = "#f7dc6f";
  ctx.beginPath();
  const rays = 14;
  for (let r = 0; r <= rays; r++) {
    const ang = (r / rays) * Math.PI * 2;
    const rad = r % 2 === 0 ? s * 0.042 : s * 0.018;
    const rx = hx + Math.cos(ang) * rad * 0.75;
    const ry = hy + Math.sin(ang) * rad * 1.1;
    if (r === 0) ctx.moveTo(rx, ry);
    else ctx.lineTo(rx, ry);
  }
  ctx.closePath();
  ctx.fill();

  // Dark vertical slit eye in the hand starburst
  ctx.fillStyle = "#5c231c";
  ctx.beginPath();
  ctx.ellipse(hx, hy, s * 0.007, s * 0.018, 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

/**
 * Draws the iconic "Les Loups-Garous de Thiercelieux" La Voyante (Seer)
 * square card illustration directly on the HTML5 2D Canvas.
 */
export function drawSeerIllustration(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  ctx.translate(x, y);

  // 1. Deep Mystic Plum-Purple Robe Background
  ctx.fillStyle = "#6c3373";
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(size * 0.5, size * 0.5);

  // 2. Render both 180-degree symmetric halves (Top/Left and Bottom/Right)
  drawSeerSymmetricHalf(ctx, size);
  ctx.save();
  ctx.rotate(Math.PI);
  drawSeerSymmetricHalf(ctx, size);
  ctx.restore();

  // 3. Central Crystal Ball
  const ballR = size * 0.235;

  // Outer black ring + crisp white glass rim
  ctx.fillStyle = "#fafaf9";
  ctx.strokeStyle = "#18181b";
  ctx.lineWidth = Math.max(2, size * 0.016);
  ctx.beginPath();
  ctx.arc(0, 0, ballR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Luminous pale yellow-green crystal sphere interior
  const orbGrad = ctx.createRadialGradient(
    -ballR * 0.2,
    -ballR * 0.2,
    ballR * 0.1,
    0,
    0,
    ballR * 0.92
  );
  orbGrad.addColorStop(0, "#f7f29c");
  orbGrad.addColorStop(0.75, "#ebe173");
  orbGrad.addColorStop(1, "#d5c650");
  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(0, 0, ballR * 0.91, 0, Math.PI * 2);
  ctx.fill();

  // Specular white highlight droplets inside the crystal ball (top-left & bottom-right)
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-ballR * 0.28, -ballR * 0.68, size * 0.013, 0, Math.PI * 2);
  ctx.arc(ballR * 0.42, ballR * 0.58, size * 0.013, 0, Math.PI * 2);
  ctx.fill();

  // 4. All-Seeing Eye inside the Crystal Ball
  // Thick curved upper and lower dark-brown eyelash fringes
  ctx.fillStyle = "#57221b";
  ctx.strokeStyle = "#57221b";
  const lashCount = 15;
  for (let side of [-1, 1]) {
    for (let i = 0; i < lashCount; i++) {
      const t = i / (lashCount - 1) - 0.5; // -0.5 .. 0.5
      const lx = t * ballR * 1.15;
      const baseCurveY =
        side * (ballR * 0.34 - Math.pow(t * 1.4, 2) * ballR * 0.26);
      const tipX = lx + t * ballR * 0.32;
      const tipY = baseCurveY + side * ballR * 0.24;

      ctx.beginPath();
      ctx.moveTo(lx - size * 0.014, baseCurveY);
      ctx.quadraticCurveTo(
        (lx + tipX) * 0.5,
        baseCurveY + side * ballR * 0.15,
        tipX,
        tipY
      );
      ctx.lineTo(lx + size * 0.014, baseCurveY);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Eye almond contour (Sclera)
  const eyeW = ballR * 0.64;
  const eyeH = ballR * 0.36;
  ctx.fillStyle = "#f6f5df";
  ctx.strokeStyle = "#18181b";
  ctx.lineWidth = Math.max(1.5, size * 0.012);
  ctx.beginPath();
  ctx.moveTo(-eyeW, 0);
  ctx.quadraticCurveTo(0, -eyeH * 1.25, eyeW, 0);
  ctx.quadraticCurveTo(0, eyeH * 1.25, -eyeW, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Subtle red capillaries at inner/outer corners of the sclera
  ctx.strokeStyle = "#b91c1c";
  ctx.lineWidth = Math.max(0.8, size * 0.005);
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(dir * eyeW * 0.85, 0);
    ctx.lineTo(dir * eyeW * 0.58, -eyeH * 0.18);
    ctx.moveTo(dir * eyeW * 0.78, dir * eyeH * 0.05);
    ctx.lineTo(dir * eyeW * 0.55, eyeH * 0.18);
    ctx.stroke();
  }

  // Iris outer lavender ring + black outline
  const irisR = ballR * 0.28;
  ctx.fillStyle = "#9c6ca6";
  ctx.strokeStyle = "#18181b";
  ctx.lineWidth = Math.max(1.2, size * 0.01);
  ctx.beginPath();
  ctx.arc(0, 0, irisR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Golden inner pupil disk
  ctx.fillStyle = "#eab308";
  ctx.beginPath();
  ctx.arc(0, 0, irisR * 0.76, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Tiny Dark-Brown 5-Fingered Hand Silhouette inside the Golden Pupil!
  ctx.save();
  ctx.rotate(-0.65);
  ctx.fillStyle = "#57221b";
  ctx.strokeStyle = "#57221b";
  ctx.lineCap = "round";
  // Mini palm
  ctx.beginPath();
  ctx.arc(0, irisR * 0.18, irisR * 0.24, 0, Math.PI * 2);
  ctx.fill();
  // Mini 5 fingers
  ctx.lineWidth = size * 0.009;
  const miniAngles = [-0.7, -0.32, 0, 0.32, 0.68];
  const miniLens = [0.38, 0.48, 0.52, 0.46, 0.36];
  for (let m = 0; m < 5; m++) {
    const a = miniAngles[m];
    const len = irisR * miniLens[m];
    ctx.beginPath();
    ctx.moveTo(Math.sin(a) * irisR * 0.12, 0);
    ctx.lineTo(Math.sin(a) * len, -Math.cos(a) * len);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore(); // end center translation

  // 5. Bold Black Square Frame Border
  ctx.strokeStyle = "#09090b";
  ctx.lineWidth = Math.max(3, size * 0.045);
  ctx.strokeRect(0, 0, size, size);

  ctx.restore();
}

/**
 * Draws the iconic "Les Loups-Garous de Thiercelieux: Nouvelle Lune" Le Salvateur (Bodyguard)
 * square card illustration directly on the HTML5 2D Canvas.
 */
export function drawBodyguardIllustration(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  ctx.translate(x, y);

  // 1. Textured Sandstone / Warm Tan Outer Square Background
  const bgGrad = ctx.createLinearGradient(0, 0, size, size);
  bgGrad.addColorStop(0, "#d4b887");
  bgGrad.addColorStop(0.5, "#c5a673");
  bgGrad.addColorStop(1, "#b2925e");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // Mottled stone texture dabs in the outer corners
  ctx.fillStyle = "rgba(156, 122, 74, 0.25)";
  for (let i = 0; i < 12; i++) {
    const px = ((i * 71 + 13) % 94) * 0.01 * size;
    const py = ((i * 53 + 29) % 94) * 0.01 * size;
    ctx.beginPath();
    ctx.arc(px, py, size * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(size * 0.5, size * 0.5);

  const outerMedallionR = size * 0.44;
  const innerMedallionR = size * 0.375;

  // 2. Clip inside the circular medallion to draw the sky, rainbow arcs, dark hill, and hand
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, innerMedallionR, 0, Math.PI * 2);
  ctx.clip();

  // Upper Golden Sky
  ctx.fillStyle = "#f4d053";
  ctx.fillRect(
    -innerMedallionR,
    -innerMedallionR,
    innerMedallionR * 2,
    innerMedallionR * 2
  );

  // Concentric Turquoise & Orange-Red Protective Aura Arcs across the golden sky
  const arcColors = [
    "#57b2a1",
    "#d8722d",
    "#57b2a1",
    "#d8722d",
    "#57b2a1",
    "#d8722d",
    "#57b2a1",
  ];
  for (let a = 0; a < arcColors.length; a++) {
    const arcR = size * (0.31 + a * 0.042);
    ctx.strokeStyle = arcColors[a];
    ctx.lineWidth = Math.max(1.5, size * 0.014);
    ctx.beginPath();
    ctx.arc(0, size * 0.22, arcR, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }

  // Lower Dark Slate-Charcoal Hill Mound
  ctx.fillStyle = "#2b2d38";
  ctx.beginPath();
  ctx.arc(0, size * 0.44, size * 0.47, 0, Math.PI * 2);
  ctx.fill();

  // Subtle black hill contour line
  ctx.strokeStyle = "#111113";
  ctx.lineWidth = Math.max(2, size * 0.016);
  ctx.beginPath();
  ctx.arc(0, size * 0.44, size * 0.47, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();

  // Black Jagged Leaf/Flame Tufts flanking the base of the wrist
  ctx.fillStyle = "#0c0c0e";
  ctx.beginPath();
  // Left double tuft
  ctx.moveTo(-size * 0.14, size * 0.37);
  ctx.lineTo(-size * 0.27, size * 0.23);
  ctx.lineTo(-size * 0.19, size * 0.26);
  ctx.lineTo(-size * 0.22, size * 0.17);
  ctx.lineTo(-size * 0.12, size * 0.24);
  // Right double tuft
  ctx.lineTo(size * 0.11, size * 0.24);
  ctx.lineTo(size * 0.19, size * 0.16);
  ctx.lineTo(size * 0.17, size * 0.25);
  ctx.lineTo(size * 0.25, size * 0.22);
  ctx.lineTo(size * 0.14, size * 0.37);
  ctx.closePath();
  ctx.fill();

  // 3. Helper to draw each banded finger (with colored stripes, pink tip, purple nail & black outline)
  const drawBandedFinger = (
    cx: number,
    cy: number,
    angleRad: number,
    len: number,
    width: number,
    bands: { startFrac: number; endFrac: number; color: string }[]
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleRad);

    const r = width * 0.5;
    const defineFingerPath = () => {
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.lineTo(-r, -len + r);
      ctx.arc(0, -len + r, r, Math.PI, 0, false);
      ctx.lineTo(r, 0);
      ctx.closePath();
    };

    // Base Rose-Pink fill
    defineFingerPath();
    ctx.fillStyle = "#e797a8";
    ctx.fill();

    // Clip to finger to paint horizontal color bands & fingernail
    ctx.save();
    defineFingerPath();
    ctx.clip();

    for (const b of bands) {
      const yTop = -len * b.endFrac;
      const h = len * (b.endFrac - b.startFrac);
      ctx.fillStyle = b.color;
      ctx.fillRect(-r * 1.3, yTop, width * 1.3, h);

      // Thin black separator line between bands
      ctx.strokeStyle = "#141214";
      ctx.lineWidth = Math.max(1, size * 0.01);
      ctx.beginPath();
      ctx.moveTo(-r * 1.2, yTop);
      ctx.lineTo(r * 1.2, yTop);
      ctx.stroke();
    }

    // Small deep-purple fingernail near the tip
    ctx.fillStyle = "#3f2e6d";
    ctx.beginPath();
    ctx.arc(0, -len + r * 1.05, r * 0.48, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Bold Black Finger Outline
    defineFingerPath();
    ctx.strokeStyle = "#111012";
    ctx.lineWidth = Math.max(2, size * 0.022);
    ctx.stroke();

    ctx.restore();
  };

  // 4. Palm Silhouette (Rose-Pink with Tribal Talisman Patterns clipped inside)
  const definePalmPath = () => {
    ctx.beginPath();
    // Bottom-left wrist
    ctx.moveTo(-size * 0.08, size * 0.34);
    // Left edge curving up to Thumb tip
    ctx.quadraticCurveTo(
      -size * 0.16,
      size * 0.25,
      -size * 0.19,
      size * 0.07
    );
    ctx.lineTo(-size * 0.22, -size * 0.03);
    ctx.quadraticCurveTo(
      -size * 0.16,
      -size * 0.04,
      -size * 0.145,
      size * 0.03
    );
    // Thumb webbing hollow
    ctx.quadraticCurveTo(
      -size * 0.125,
      size * 0.095,
      -size * 0.105,
      size * 0.08
    );
    // Up to base of Index & Middle fingers
    ctx.lineTo(-size * 0.11, -size * 0.02);
    // Across finger bases (with central V-gap dip)
    ctx.lineTo(-size * 0.005, -size * 0.035);
    ctx.quadraticCurveTo(
      size * 0.015,
      -size * 0.005,
      size * 0.045,
      -size * 0.03
    );
    ctx.lineTo(size * 0.15, -size * 0.01);
    // Right outer edge of palm curving down to bottom-right wrist
    ctx.quadraticCurveTo(
      size * 0.16,
      size * 0.22,
      size * 0.08,
      size * 0.34
    );
    ctx.closePath();
  };

  // Draw the 4 Split Fingers ("V" Vulcan blessing pose: 2 left, 2 right)
  const fW = size * 0.058;
  // Index Finger (outer left)
  drawBandedFinger(-size * 0.082, -size * 0.01, -0.15, size * 0.285, fW, [
    { startFrac: 0.0, endFrac: 0.28, color: "#a83a22" },
    { startFrac: 0.28, endFrac: 0.48, color: "#913524" },
    { startFrac: 0.48, endFrac: 0.66, color: "#4da3d8" },
    { startFrac: 0.66, endFrac: 0.82, color: "#bc4427" },
  ]);
  // Middle Finger (inner left, joined with index)
  drawBandedFinger(-size * 0.026, -size * 0.02, -0.13, size * 0.305, fW, [
    { startFrac: 0.0, endFrac: 0.42, color: "#3d2e6e" },
    { startFrac: 0.42, endFrac: 0.64, color: "#913524" },
    { startFrac: 0.64, endFrac: 0.82, color: "#bc4427" },
  ]);
  // Ring Finger (inner right, split by V gap)
  drawBandedFinger(size * 0.072, -size * 0.018, 0.17, size * 0.295, fW, [
    { startFrac: 0.0, endFrac: 0.55, color: "#2d2458" },
    { startFrac: 0.55, endFrac: 0.8, color: "#bc4427" },
  ]);
  // Pinky Finger (outer right, joined with ring)
  drawBandedFinger(size * 0.126, -size * 0.005, 0.19, size * 0.275, fW, [
    { startFrac: 0.0, endFrac: 0.34, color: "#bc4427" },
    { startFrac: 0.34, endFrac: 0.62, color: "#4da3d8" },
    { startFrac: 0.62, endFrac: 0.8, color: "#bc4427" },
  ]);

  // Fill Palm Base
  definePalmPath();
  ctx.fillStyle = "#e797a8";
  ctx.fill();

  // Clip inside Palm to draw the Talisman Markings
  ctx.save();
  definePalmPath();
  ctx.clip();

  // Thumb bands & nail
  ctx.fillStyle = "#3f2e6d";
  ctx.beginPath();
  ctx.arc(-size * 0.195, -size * 0.005, size * 0.016, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#bc4427";
  ctx.lineWidth = size * 0.032;
  ctx.beginPath();
  ctx.moveTo(-size * 0.21, size * 0.055);
  ctx.lineTo(-size * 0.13, size * 0.04);
  ctx.stroke();

  // Lower-left palm yellow & terracotta stripes
  ctx.strokeStyle = "#eab308";
  ctx.lineWidth = size * 0.025;
  ctx.beginPath();
  ctx.moveTo(-size * 0.17, size * 0.19);
  ctx.quadraticCurveTo(-size * 0.1, size * 0.2, -size * 0.04, size * 0.24);
  ctx.stroke();

  ctx.strokeStyle = "#bc4427";
  ctx.lineWidth = size * 0.034;
  ctx.beginPath();
  ctx.moveTo(-size * 0.17, size * 0.225);
  ctx.quadraticCurveTo(-size * 0.1, size * 0.235, -size * 0.04, size * 0.275);
  ctx.stroke();

  // Jagged Indigo-Purple Crown/Starburst in the upper-middle palm
  ctx.fillStyle = "#3d2e6e";
  ctx.beginPath();
  ctx.moveTo(-size * 0.03, size * 0.17);
  ctx.lineTo(-size * 0.08, size * 0.13);
  ctx.lineTo(-size * 0.05, size * 0.11);
  ctx.lineTo(-size * 0.085, size * 0.065);
  ctx.lineTo(-size * 0.02, size * 0.075);
  ctx.lineTo(0, size * 0.02);
  ctx.lineTo(size * 0.045, size * 0.068);
  ctx.lineTo(size * 0.09, size * 0.055);
  ctx.lineTo(size * 0.075, size * 0.13);
  ctx.closePath();
  ctx.fill();

  // Bright Golden Star nested inside the indigo crown
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.arc(size * 0.025, size * 0.118, size * 0.028, 0, Math.PI * 2);
  ctx.fill();

  // Concentric Quarter-Sun / Shield Arch in the lower-right palm
  const archCx = size * 0.11;
  const archCy = size * 0.31;

  // Outer Sky-Blue Arch
  ctx.strokeStyle = "#4ea5d9";
  ctx.lineWidth = size * 0.034;
  ctx.beginPath();
  ctx.arc(archCx, archCy, size * 0.175, Math.PI * 0.95, Math.PI * 1.65);
  ctx.stroke();

  // Indigo Ray Wedges inside the Blue Arch
  ctx.strokeStyle = "#3d2e6e";
  ctx.lineWidth = size * 0.022;
  for (let w = 0; w < 5; w++) {
    const ang = Math.PI * (1.05 + w * 0.13);
    ctx.beginPath();
    ctx.moveTo(
      archCx + Math.cos(ang) * size * 0.09,
      archCy + Math.sin(ang) * size * 0.09
    );
    ctx.lineTo(
      archCx + Math.cos(ang) * size * 0.155,
      archCy + Math.sin(ang) * size * 0.155
    );
    ctx.stroke();
  }

  // Inner Terracotta-Red & Dark Purple Core Rings
  ctx.strokeStyle = "#a83a22";
  ctx.lineWidth = size * 0.026;
  ctx.beginPath();
  ctx.arc(archCx, archCy, size * 0.085, Math.PI * 0.95, Math.PI * 1.65);
  ctx.stroke();

  ctx.fillStyle = "#3d2e6e";
  ctx.beginPath();
  ctx.arc(archCx, archCy, size * 0.065, 0, Math.PI * 2);
  ctx.fill();

  // Small Red Radiating Dash Marks around the upper palm
  ctx.strokeStyle = "#bc4427";
  ctx.lineWidth = Math.max(1.2, size * 0.012);
  const dashes = [
    [-0.11, 0.14, -0.07, 0.16],
    [-0.08, 0.01, -0.06, 0.045],
    [-0.02, -0.01, -0.02, 0.03],
    [0.055, 0.0, 0.04, 0.038],
    [0.105, 0.02, 0.085, 0.055],
  ];
  for (const [x1, y1, x2, y2] of dashes) {
    ctx.beginPath();
    ctx.moveTo(x1 * size, y1 * size);
    ctx.lineTo(x2 * size, y2 * size);
    ctx.stroke();
  }

  ctx.restore(); // end palm clip

  // Bold Black Palm Contour Outline
  definePalmPath();
  ctx.strokeStyle = "#111012";
  ctx.lineWidth = Math.max(2.2, size * 0.024);
  ctx.stroke();

  ctx.restore(); // end inner medallion clip

  // 5. Thick Black Medallion Ring Frame
  ctx.strokeStyle = "#141210";
  ctx.lineWidth = outerMedallionR - innerMedallionR;
  ctx.beginPath();
  ctx.arc(
    0,
    0,
    (outerMedallionR + innerMedallionR) * 0.5,
    0,
    Math.PI * 2
  );
  ctx.stroke();

  ctx.restore(); // end center translation

  // 7. Bold Black Square Frame Border
  ctx.strokeStyle = "#09090b";
  ctx.lineWidth = Math.max(3, size * 0.045);
  ctx.strokeRect(0, 0, size, size);

  ctx.restore();
}

/**
 * Helper to draw one half of the diagonal Witch twin figure around (0, 0)
 * plus the magic bubbles and the boiling cauldron pot in the bottom-left quadrant.
 * Rotating by Math.PI with swapped colors draws the bottom-right Witch half & top-right healing pot.
 */
function drawWitchSymmetricHalf(
  ctx: CanvasRenderingContext2D,
  s: number,
  bodyColor: string,
  armColor: string,
  lineColor: string,
  potType: "snake_poison" | "herb_heal"
) {
  ctx.save();

  // 1. Streaming wavy locks of hair behind the head/neck (extending right from the head)
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = "#2b281e";
  ctx.lineWidth = Math.max(0.8, s * 0.006);
  const hairStarts = [
    [-0.18, -0.37],
    [-0.15, -0.34],
    [-0.13, -0.305],
    [-0.11, -0.27],
    [-0.09, -0.235],
    [-0.07, -0.2],
  ];
  const hairLengths = [0.16, 0.21, 0.23, 0.22, 0.19, 0.14];

  for (let h = 0; h < hairStarts.length; h++) {
    const [hx, hy] = hairStarts[h];
    const len = hairLengths[h];
    ctx.beginPath();
    ctx.moveTo(hx * s, hy * s);
    ctx.bezierCurveTo(
      (hx + len * 0.35) * s,
      (hy - 0.035) * s,
      (hx + len * 0.68) * s,
      (hy + 0.03) * s,
      (hx + len) * s,
      (hy + 0.015) * s
    );
    ctx.bezierCurveTo(
      (hx + len * 0.65) * s,
      (hy + 0.05) * s,
      (hx + len * 0.32) * s,
      (hy - 0.01) * s,
      hx * s,
      (hy + 0.024) * s
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 2. Witch Head, Profile Face, Neck & Upper Torso extending down-right to the diagonal waist (0, 0)
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = "#2b281e";
  ctx.lineWidth = Math.max(1, s * 0.008);

  ctx.beginPath();
  // Waist center-right seam (0.045s, -0.045s)
  ctx.moveTo(s * 0.045, -s * 0.045);
  // Back of torso rising up-left to back of head
  ctx.bezierCurveTo(
    -s * 0.05,
    -s * 0.14,
    -s * 0.1,
    -s * 0.28,
    -s * 0.2,
    -s * 0.4
  );
  // Crown of skull curving around to forehead (top-left)
  ctx.bezierCurveTo(
    -s * 0.28,
    -s * 0.47,
    -s * 0.39,
    -s * 0.43,
    -s * 0.44,
    -s * 0.35
  );
  // Brow & hooked witch nose pointing down-left
  ctx.lineTo(-s * 0.415, -s * 0.28);
  ctx.lineTo(-s * 0.43, -s * 0.245);
  ctx.lineTo(-s * 0.395, -s * 0.235);
  // Lips & pointed chin
  ctx.lineTo(-s * 0.375, -s * 0.205);
  ctx.lineTo(-s * 0.34, -s * 0.195);
  // Throat & front of chest/bust sloping down-right to waist
  ctx.quadraticCurveTo(-s * 0.27, -s * 0.23, -s * 0.25, -s * 0.14);
  // Side bust curve
  ctx.quadraticCurveTo(-s * 0.26, -s * 0.075, -s * 0.17, -s * 0.075);
  // Front ribs down to left side of waist seam (-0.045s, 0.045s)
  ctx.lineTo(-s * 0.045, s * 0.045);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Small dark round areola dot on bust tip
  ctx.fillStyle = "#544c38";
  ctx.beginPath();
  ctx.arc(-s * 0.242, -s * 0.09, s * 0.014, 0, Math.PI * 2);
  ctx.fill();

  // Glowing Pale Blue-White Slanted Witch Eye
  ctx.save();
  ctx.translate(-s * 0.385, -s * 0.295);
  ctx.rotate(-0.55);
  ctx.fillStyle = "#e0f2fe";
  ctx.strokeStyle = "#1c1917";
  ctx.lineWidth = Math.max(0.9, s * 0.007);
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.022, s * 0.009, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Wavy woodcut contour lines across the witch's cheek and scalp
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = Math.max(0.9, s * 0.007);
  for (let w = 0; w < 6; w++) {
    const wy = -s * (0.38 - w * 0.027);
    const wxStart = -s * (0.41 - w * 0.015);
    const wxEnd = -s * (0.24 - w * 0.005);
    ctx.beginPath();
    ctx.moveTo(wxStart, wy);
    ctx.bezierCurveTo(
      lerp(wxStart, wxEnd, 0.33),
      wy + s * 0.016,
      lerp(wxStart, wxEnd, 0.66),
      wy - s * 0.018,
      wxEnd,
      wy - s * 0.008
    );
    ctx.stroke();
  }

  // Jagged comb-tooth / stitch marks along the diagonal waist seam (-0.045s, 0.045s) -> (0.045s, -0.045s)
  ctx.strokeStyle = "#282820";
  ctx.lineWidth = Math.max(0.9, s * 0.007);
  const teeth = 11;
  for (let t = 0; t <= teeth; t++) {
    const frac = t / teeth;
    const sx = lerp(-s * 0.046, s * 0.046, frac);
    const sy = lerp(s * 0.046, -s * 0.046, frac);
    ctx.beginPath();
    ctx.moveTo(sx - s * 0.018, sy - s * 0.018);
    ctx.lineTo(sx + s * 0.018, sy + s * 0.018);
    ctx.stroke();
  }

  // 3. Contrasting Bent Arm & 5-Fingered Spellcasting Hand reaching toward the cauldron
  ctx.fillStyle = armColor;
  ctx.strokeStyle = "#23231c";
  ctx.lineWidth = Math.max(0.9, s * 0.007);

  ctx.beginPath();
  // Rounded shoulder cap (-0.17s, -0.21s)
  ctx.arc(-s * 0.175, -s * 0.2, s * 0.032, Math.PI * 0.7, Math.PI * 1.9);
  // Outer upper arm down to bent elbow (-0.08s, -0.075s)
  ctx.lineTo(-s * 0.075, -s * 0.075);
  // Forearm angled left toward wrist (-0.23s, -0.025s)
  ctx.lineTo(-s * 0.235, -s * 0.015);
  // Inner forearm back to inner elbow (-0.145s, -0.085s)
  ctx.lineTo(-s * 0.245, -s * 0.055);
  ctx.lineTo(-s * 0.138, -s * 0.085);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 5 Splayed Fingers at the end of the casting hand (-0.25s, -0.03s)
  ctx.strokeStyle = armColor;
  ctx.lineCap = "round";
  ctx.lineWidth = s * 0.015;
  const fingerTips = [
    [-0.29, -0.068], // thumb up-left
    [-0.335, -0.02], // index
    [-0.345, 0.012], // middle
    [-0.325, 0.042], // ring
    [-0.295, 0.062], // pinky
  ];
  for (const [fx, fy] of fingerTips) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.24, -s * 0.032);
    ctx.lineTo(fx * s, fy * s);
    ctx.stroke();
  }

  // 4. Floating Effervescent Potion Bubbles around the casting hand
  const bubbles: [number, number, boolean][] = [
    [-0.37, -0.09, false],
    [-0.31, -0.1, true],
    [-0.39, -0.03, false],
    [-0.43, 0.01, true],
    [-0.39, 0.06, false],
    [-0.33, 0.085, true],
    [-0.27, 0.095, true],
    [-0.22, 0.04, true],
    [-0.19, 0.08, false],
    [-0.14, 0.04, true],
    [-0.2, 0.0, true],
  ];
  for (const [bx, by, isGold] of bubbles) {
    ctx.fillStyle = isGold ? "#f6dd74" : "#574c35";
    ctx.strokeStyle = isGold ? "#9a3412" : "#29251c";
    ctx.lineWidth = Math.max(0.8, s * 0.005);
    ctx.beginPath();
    ctx.arc(bx * s, by * s, s * 0.014, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 5. Boiling Black Cauldron Pot + Jagged Flame Starburst in Bottom-Left Quadrant (-0.29s, 0.27s)
  const potX = -s * 0.285;
  const potY = s * 0.265;

  // Bulbous Black Apothecary Cauldron Vase
  ctx.fillStyle = "#17120f";
  ctx.strokeStyle = "#09090b";
  ctx.lineWidth = Math.max(1, s * 0.008);
  ctx.beginPath();
  // Top flared rim
  ctx.moveTo(potX - s * 0.075, potY - s * 0.145);
  ctx.lineTo(potX + s * 0.075, potY - s * 0.145);
  // Neck curving out to wide belly and down to base
  ctx.bezierCurveTo(
    potX + s * 0.06,
    potY - s * 0.08,
    potX + s * 0.135,
    potY + s * 0.04,
    potX + s * 0.09,
    potY + s * 0.13
  );
  ctx.lineTo(potX - s * 0.09, potY + s * 0.13);
  ctx.bezierCurveTo(
    potX - s * 0.135,
    potY + s * 0.04,
    potX - s * 0.06,
    potY - s * 0.08,
    potX - s * 0.075,
    potY - s * 0.145
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (potType === "snake_poison") {
    // Coiled Cream-Yellow Viper Snake inside the Bottom-Left Cauldron
    ctx.strokeStyle = "#f5d77f";
    ctx.lineWidth = s * 0.022;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(potX - s * 0.035, potY + s * 0.055);
    ctx.bezierCurveTo(
      potX + s * 0.065,
      potY + s * 0.055,
      potX + s * 0.065,
      potY - s * 0.005,
      potX,
      potY - s * 0.005
    );
    ctx.bezierCurveTo(
      potX - s * 0.06,
      potY - s * 0.005,
      potX - s * 0.055,
      potY - s * 0.065,
      potX + s * 0.015,
      potY - s * 0.095
    );
    ctx.stroke();

    // Snake Diamond Head + Forked Red Tongue
    ctx.fillStyle = "#f5d77f";
    ctx.beginPath();
    ctx.ellipse(
      potX + s * 0.02,
      potY - s * 0.1,
      s * 0.022,
      s * 0.014,
      -0.5,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Forked red tongue
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = Math.max(1, s * 0.006);
    ctx.beginPath();
    ctx.moveTo(potX + s * 0.035, potY - s * 0.112);
    ctx.lineTo(potX + s * 0.052, potY - s * 0.126);
    ctx.moveTo(potX + s * 0.044, potY - s * 0.12);
    ctx.lineTo(potX + s * 0.055, potY - s * 0.115);
    ctx.stroke();
  } else {
    // Botanical Healing Heart-Root / Mandrake Herb inside the Top-Right Cauldron
    // Dusty sky-blue stem & leaves
    ctx.strokeStyle = "#759291";
    ctx.lineWidth = s * 0.018;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(potX, potY - s * 0.08);
    ctx.lineTo(potX, potY + s * 0.04);
    // Cross branches
    ctx.moveTo(potX - s * 0.055, potY - s * 0.015);
    ctx.quadraticCurveTo(potX, potY - s * 0.03, potX + s * 0.055, potY - s * 0.015);
    ctx.stroke();

    // Golden-orange heart bulb at base of stem
    ctx.fillStyle = "#f5c857";
    ctx.beginPath();
    ctx.arc(potX, potY + s * 0.035, s * 0.034, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d95b24";
    ctx.beginPath();
    ctx.arc(potX, potY + s * 0.035, s * 0.016, 0, Math.PI * 2);
    ctx.fill();

    // Golden tulip petals at top of stem
    ctx.fillStyle = "#f5c857";
    ctx.beginPath();
    ctx.arc(potX, potY - s * 0.09, s * 0.026, 0, Math.PI * 2);
    ctx.fill();
  }

  // Jagged Golden-Yellow & Crimson Flame Burst under the Cauldron Base (potY + 0.13s)
  const fireY = potY + s * 0.135;
  const drawFlameStar = (scaleX: number, scaleY: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    const spikes = 16;
    for (let f = 0; f <= spikes; f++) {
      const ang = (f / spikes) * Math.PI * 2;
      const r = f % 2 === 0 ? s * 0.12 : s * 0.048;
      const fx = potX + Math.cos(ang) * r * scaleX;
      const fy = fireY + Math.sin(ang) * r * scaleY;
      if (f === 0) ctx.moveTo(fx, fy);
      else ctx.lineTo(fx, fy);
    }
    ctx.closePath();
    ctx.fill();
  };

  drawFlameStar(1.0, 0.58, "#f7d464");
  drawFlameStar(0.58, 0.34, "#c93820");

  ctx.restore();
}

/**
 * Draws the iconic "Les Loups-Garous de Thiercelieux" La Sorcière (Witch)
 * square card illustration directly on the HTML5 2D Canvas.
 */
export function drawWitchIllustration(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  ctx.translate(x, y);

  // 1. Vivid Burnt-Orange / Pumpkin Terracotta Background
  const bgGrad = ctx.createRadialGradient(
    size * 0.5,
    size * 0.5,
    size * 0.08,
    size * 0.5,
    size * 0.5,
    size * 0.72
  );
  bgGrad.addColorStop(0, "#e37025");
  bgGrad.addColorStop(1, "#cc5b16");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(size * 0.5, size * 0.5);

  // 2. Top-Left Golden Witch Half + Dark Green Arm + Bottom-Left Snake Poison Cauldron
  drawWitchSymmetricHalf(
    ctx,
    size,
    "#f4d35e",
    "#394534",
    "#574b35",
    "snake_poison"
  );

  // 3. Bottom-Right Dark Green Witch Half + Golden Arm + Top-Right Herb Heal Cauldron (180° rotated)
  ctx.save();
  ctx.rotate(Math.PI);
  drawWitchSymmetricHalf(
    ctx,
    size,
    "#394534",
    "#f4d35e",
    "#b8a55b",
    "herb_heal"
  );
  ctx.restore();

  ctx.restore(); // end center translation

  // 4. Bold Black Square Frame Border
  ctx.strokeStyle = "#09090b";
  ctx.lineWidth = Math.max(3, size * 0.045);
  ctx.strokeRect(0, 0, size, size);

  ctx.restore();
}

/**
 * Draws a Thiercelieux-style square Role Card (or Card Back when `role` is null / hidden)
 * on the 2D Canvas.
 */
export function drawRoleSquareCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  role: WerewolfRole | null,
  showLabel = true
) {
  ctx.save();
  drawRoundedRect(ctx, x, y, size, size, Math.max(4, size * 0.07));
  ctx.clip();

  if (role === null) {
    // Ornate Card Back (Dark Indigo & Crimson Wax Seal with Wolf Claw Crest)
    const backGrad = ctx.createRadialGradient(
      x + size * 0.5,
      y + size * 0.5,
      size * 0.05,
      x + size * 0.5,
      y + size * 0.5,
      size * 0.7
    );
    backGrad.addColorStop(0, "#31102f");
    backGrad.addColorStop(1, "#0f172a");
    ctx.fillStyle = backGrad;
    ctx.fillRect(x, y, size, size);

    ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
    ctx.lineWidth = Math.max(1.5, size * 0.025);
    ctx.strokeRect(
      x + size * 0.08,
      y + size * 0.08,
      size * 0.84,
      size * 0.84
    );

    // Subtle emblem in center of card back
    ctx.beginPath();
    ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.24, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(251, 191, 36, 0.55)";
    ctx.stroke();

    ctx.fillStyle = "#fbbf24";
    ctx.font = `bold ${Math.round(size * 0.28)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🌙", x + size * 0.5, y + size * 0.5);
  } else if (role === "Werewolf") {
    drawWerewolfIllustration(ctx, x, y, size);
  } else if (role === "Villager") {
    drawVillagerIllustration(ctx, x, y, size);
  } else if (role === "Seer") {
    drawSeerIllustration(ctx, x, y, size);
  } else if (role === "Bodyguard") {
    drawBodyguardIllustration(ctx, x, y, size);
  } else if (role === "Hunter") {
    drawHunterIllustration(ctx, x, y, size);
  } else if (role === "Witch") {
    drawWitchIllustration(ctx, x, y, size);
  }

  // Optional bottom title ribbon on larger cards
  if (showLabel && role !== null && size >= 54) {
    const ribbonH = Math.max(16, size * 0.2);
    ctx.fillStyle = "rgba(9, 9, 11, 0.82)";
    ctx.fillRect(x, y + size - ribbonH, size, ribbonH);

    ctx.fillStyle = "#fef3c7";
    ctx.font = `bold ${Math.max(9, Math.round(size * 0.115))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      ROLE_META[role].nameVi.toUpperCase(),
      x + size * 0.5,
      y + size - ribbonH * 0.5
    );
  }

  ctx.restore();
}
