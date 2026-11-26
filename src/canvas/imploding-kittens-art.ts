import { drawRoundedRect, getCanvasFontFamilies } from "@/canvas/engine";
import {
  IK_CARD_ATLAS_SLOTS,
  IK_CARD_BACK_SLOT,
  getIkCardAtlasImage,
  getIkCardAtlasSlot,
  getIkCardSpriteBgStyle,
} from "@/canvas/imploding-kittens-atlas";
import {
  IK_CARD_META,
  type IkCard,
  type IkCardType,
} from "@/cartridges/imploding-kittens";

export { getIkCardAtlasImage, getIkCardAtlasSlot, getIkCardSpriteBgStyle };

let cachedIkLogoImg: HTMLImageElement | null = null;
let ikLogoLoaded = false;

export const IK_LOBBY_BG_URL = "/sprites/ik-lobby-bg.webp";
let cachedIkLobbyBgImg: HTMLImageElement | null = null;
let ikLobbyBgLoaded = false;

export function getIkLobbyBgImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (ikLobbyBgLoaded && cachedIkLobbyBgImg) return cachedIkLobbyBgImg;
  if (!cachedIkLobbyBgImg) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      ikLobbyBgLoaded = true;
    };
    img.src = IK_LOBBY_BG_URL;
    cachedIkLobbyBgImg = img;
  }
  return null;
}

/**
 * Renders the vibrant 2D cel-shaded Imploding Kittens lobby splash illustration
 * (screaming black cat hugging the exploding Earth) with subtle breathing camera zoom,
 * rising 2D comic embers, and top/bottom readability vignettes.
 */
export function drawIkLobbyBackground2D(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  now: number
) {
  ctx.save();

  // Deep crimson fallback backdrop before WebP finishes decoding
  const fallbackGrad = ctx.createRadialGradient(
    width * 0.5,
    height * 0.42,
    24,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.78
  );
  fallbackGrad.addColorStop(0, "#991b1b");
  fallbackGrad.addColorStop(0.55, "#5c0b12");
  fallbackGrad.addColorStop(1, "#1e050a");
  ctx.fillStyle = fallbackGrad;
  ctx.fillRect(0, 0, width, height);

  const bgImg = getIkLobbyBgImage();
  if (bgImg && bgImg.naturalWidth > 0 && bgImg.naturalHeight > 0) {
    const imgRatio = bgImg.naturalWidth / bgImg.naturalHeight;
    const canvasRatio = width / Math.max(1, height);
    const breathe = 1.015 + Math.sin(now / 2800) * 0.014;

    let drawW: number;
    let drawH: number;
    if (canvasRatio > imgRatio) {
      drawW = width * breathe;
      drawH = drawW / imgRatio;
    } else {
      drawH = height * breathe;
      drawW = drawH * imgRatio;
    }

    const dx = (width - drawW) * 0.5;
    // Frame slightly toward upper-center so the screaming cat & Earth stay clearly visible above the Lobby card
    const dy = (height - drawH) * 0.32;

    const prevSmooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(bgImg, dx, dy, drawW, drawH);
    ctx.imageSmoothingEnabled = prevSmooth;
  }

  // Subtle animated 2D comic embers drifting upward around the explosion
  for (let i = 0; i < 18; i++) {
    const speed = 0.025 + (i % 5) * 0.009;
    const prog = ((now * speed) / 100 + i * 0.19) % 1;
    const ex =
      ((i * 173.3) % width) + Math.sin(now / 700 + i * 1.4) * 18;
    const ey = height * (0.95 - prog * 0.92);
    const alpha = Math.sin(prog * Math.PI) * 0.72;
    const r = 1.8 + (i % 3) * 1.1;
    ctx.fillStyle =
      i % 3 === 0
        ? `rgba(254, 240, 138, ${alpha})`
        : i % 3 === 1
          ? `rgba(251, 146, 60, ${alpha})`
          : `rgba(255, 255, 255, ${alpha * 0.85})`;
    ctx.beginPath();
    ctx.arc(ex, ey, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft top vignette for crisp title contrast
  const topVig = ctx.createLinearGradient(0, 0, 0, Math.min(140, height * 0.28));
  topVig.addColorStop(0, "rgba(15, 5, 10, 0.72)");
  topVig.addColorStop(1, "rgba(15, 5, 10, 0)");
  ctx.fillStyle = topVig;
  ctx.fillRect(0, 0, width, Math.min(140, height * 0.28));

  // Soft bottom vignette so the floating Lobby panel sits cleanly over the art
  const botStart = height * 0.56;
  const botVig = ctx.createLinearGradient(0, botStart, 0, height);
  botVig.addColorStop(0, "rgba(10, 6, 14, 0)");
  botVig.addColorStop(0.6, "rgba(10, 6, 14, 0.55)");
  botVig.addColorStop(1, "rgba(9, 10, 18, 0.88)");
  ctx.fillStyle = botVig;
  ctx.fillRect(0, botStart, width, height - botStart);

  ctx.restore();
}

/**
 * Pure 2D Pixel-Grid procedural fallback renderer for TACOCAT matching the official card layout:
 * - Off-white card base with rounded grey border
 * - Top-left & upside-down bottom-right navy medallion + golden Taco-Cat silhouette + "TACOCAT"
 * - Pixel speech bubble: "I AM A PALINDROME!"
 * - Pixel golden-orange Taco shell body with pointy cat ears, shredded green lettuce & brown beef on the left,
 *   derpy shining eyes, triangle nose/mouth, U-shaped front paws, dangling feet, and floor shadow!
 */
export function drawTacocatPixelCardFallback2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const fonts = getCanvasFontFamilies();
  const r = Math.max(6, Math.round(w * 0.08));

  ctx.save();
  // Card white/off-white background
  drawRoundedRect(ctx, x, y, w, h, r);
  ctx.fillStyle = "#e5e7eb";
  ctx.fill();

  // Inner light grey border frame
  drawRoundedRect(
    ctx,
    x + w * 0.055,
    y + h * 0.04,
    w * 0.89,
    h * 0.92,
    Math.max(4, r - 2)
  );
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = Math.max(1.5, w * 0.022);
  ctx.stroke();

  // Helper to draw the corner Taco-Cat badge + "TACOCAT" text (used at top-left and rotated 180deg at bottom-right)
  const drawCornerBadge = () => {
    const br = w * 0.072;
    const bx = w * 0.155;
    const by = h * 0.115;
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();

    // Mini golden taco-cat inside circle
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(bx, by + br * 0.25, br * 0.72, Math.PI * 1.05, Math.PI * 1.95);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${Math.max(8, Math.round(w * 0.105))}px ${fonts.pixel}`;
    ctx.fillText("TACOCAT", bx + br + w * 0.03, by + 1);
  };

  ctx.save();
  ctx.translate(x, y);
  drawCornerBadge();
  ctx.restore();

  ctx.save();
  ctx.translate(x + w, y + h);
  ctx.rotate(Math.PI);
  drawCornerBadge();
  ctx.restore();

  // Speech bubble: "I AM A PALINDROME!"
  const sbx = x + w * 0.53;
  const sby = y + h * 0.275;
  const sbw = w * 0.31;
  const sbh = h * 0.095;
  ctx.fillStyle = "#f8fafc";
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = Math.max(1.2, w * 0.015);
  ctx.beginPath();
  ctx.ellipse(sbx, sby, sbw, sbh, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#0f172a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.max(6, Math.round(w * 0.068))}px ${fonts.mono}`;
  ctx.fillText("I AM A", sbx + w * 0.03, sby - sbh * 0.38);
  ctx.font = `900 ${Math.max(7, Math.round(w * 0.088))}px ${fonts.sans}`;
  ctx.fillText("PALINDROME!", sbx + w * 0.02, sby + sbh * 0.24);

  // Floor shadow under Tacocat
  ctx.fillStyle = "rgba(148, 163, 184, 0.55)";
  ctx.beginPath();
  ctx.ellipse(
    x + w * 0.54,
    y + h * 0.75,
    w * 0.33,
    h * 0.055,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Left shredded green lettuce & brown beef filling peeking from taco shell
  const tx = x + w * 0.49;
  const ty = y + h * 0.67;
  const tr = w * 0.34;

  // Brown taco meat pixels on left edge
  ctx.fillStyle = "#78350f";
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = Math.max(1.2, w * 0.016);
  ctx.beginPath();
  ctx.arc(tx - w * 0.03, ty, tr * 0.96, Math.PI * 1.02, Math.PI * 1.48);
  ctx.fill();
  ctx.stroke();

  // Spiky bright green lettuce pixels
  ctx.fillStyle = "#a3e635";
  for (const ang of [1.06, 1.22, 1.38]) {
    const lx = tx + Math.cos(Math.PI * ang) * tr * 0.98;
    const ly = ty + Math.sin(Math.PI * ang) * tr * 0.95;
    ctx.beginPath();
    ctx.arc(lx, ly, w * 0.045, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Main Golden-Orange Taco Shell Dome with pixel-style gradient
  const shellGrad = ctx.createRadialGradient(
    tx + tr * 0.15,
    ty - tr * 0.45,
    tr * 0.1,
    tx,
    ty - tr * 0.2,
    tr * 1.05
  );
  shellGrad.addColorStop(0, "#fde047");
  shellGrad.addColorStop(0.55, "#f59e0b");
  shellGrad.addColorStop(1, "#ea580c");

  ctx.fillStyle = shellGrad;
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = Math.max(1.6, w * 0.02);
  ctx.beginPath();
  ctx.arc(tx, ty, tr, Math.PI * 1.02, Math.PI * 1.98);
  ctx.quadraticCurveTo(tx, ty - h * 0.02, tx - tr, ty);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Two pointy cat ears on top of the taco shell
  const earY = ty - tr * 0.92;
  ctx.fillStyle = "#f59e0b";
  // Left ear
  ctx.beginPath();
  ctx.moveTo(tx - tr * 0.36, earY + 4);
  ctx.lineTo(tx - tr * 0.42, earY - h * 0.045);
  ctx.lineTo(tx - tr * 0.22, earY + 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Right ear
  ctx.beginPath();
  ctx.moveTo(tx + tr * 0.1, earY + 1);
  ctx.lineTo(tx + tr * 0.16, earY - h * 0.048);
  ctx.lineTo(tx + tr * 0.24, earY + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cute derpy eyes with white shine dots
  const eyeY = ty - tr * 0.72;
  const eyeR = Math.max(2.2, w * 0.028);
  for (const ex of [tx - tr * 0.22, tx + tr * 0.14]) {
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ex - eyeR * 0.32, eyeY - eyeR * 0.2, eyeR * 0.38, 0, Math.PI * 2);
    ctx.fill();
  }

  // Triangle nose & happy open mouth
  const noseX = tx - tr * 0.04;
  const noseY = eyeY + eyeR * 1.1;
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.moveTo(noseX - eyeR * 0.6, noseY - eyeR * 0.4);
  ctx.lineTo(noseX + eyeR * 0.6, noseY - eyeR * 0.4);
  ctx.lineTo(noseX, noseY + eyeR * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(noseX, noseY + eyeR * 1.1, eyeR * 0.85, 0, Math.PI);
  ctx.fill();

  // Two U-shaped front paws on belly & two dangling bottom feet
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = Math.max(1.4, w * 0.018);
  for (const px of [tx - tr * 0.45, tx + tr * 0.52]) {
    ctx.beginPath();
    ctx.arc(px, ty - tr * 0.36, eyeR * 0.75, 0, Math.PI);
    ctx.stroke();
  }
  for (const fx of [tx - tr * 0.58, tx + tr * 0.68]) {
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.ellipse(fx, ty + h * 0.022, eyeR * 0.7, h * 0.032, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

export function getIkLogoImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (ikLogoLoaded && cachedIkLogoImg) return cachedIkLogoImg;
  if (!cachedIkLogoImg) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      ikLogoLoaded = true;
    };
    img.src = "/sprites/imploding-kittens-logo.jpg";
    cachedIkLogoImg = img;
  }
  return null;
}

/**
 * Hand-crafted 2D vector renderer for the signature Oatmeal-style Grey Kitten biting a hand grenade pin!
 */
export function drawGrenadeKitten2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale = 1
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Soft crimson glow behind the kitten
  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 42);
  glow.addColorStop(0, "rgba(239, 68, 68, 0.38)");
  glow.addColorStop(1, "rgba(239, 68, 68, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 42, 0, Math.PI * 2);
  ctx.fill();

  // Curled cat tail on the right
  ctx.strokeStyle = "#090d16";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(16, 8);
  ctx.bezierCurveTo(25, 2, 22, -16, 28, -20);
  ctx.stroke();
  ctx.strokeStyle = "#4b5563";
  ctx.lineWidth = 3.8;
  ctx.stroke();

  // Loaf cat body
  ctx.fillStyle = "#4b5563";
  ctx.strokeStyle = "#090d16";
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.ellipse(3, 5, 19, 13, 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cat head with two pointy ears
  ctx.fillStyle = "#52525b";
  ctx.beginPath();
  ctx.arc(-8, -3, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Left ear & right ear
  ctx.beginPath();
  ctx.moveTo(-17, -9);
  ctx.lineTo(-10, -21);
  ctx.lineTo(-4, -13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-3, -12);
  ctx.lineTo(7, -15);
  ctx.lineTo(2, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Big derpy white cartoon eyes with black pupils
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-14, -4, 4.2, 0, Math.PI * 2);
  ctx.arc(-5, -3.5, 4.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#090d16";
  ctx.beginPath();
  ctx.arc(-14.5, -4, 2, 0, Math.PI * 2);
  ctx.arc(-5.5, -3.5, 2.1, 0, Math.PI * 2);
  ctx.fill();

  // Little white fangs biting the grenade pull-ring!
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-13, 2.5, 6, 3);
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(-12, 6, 3.2, 0, Math.PI * 2);
  ctx.stroke();

  // Segmented pineapple hand grenade held between paws
  ctx.fillStyle = "#3f3f46";
  ctx.strokeStyle = "#090d16";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(-4, 15, 10, 8, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Grenade waffle grid ribs
  ctx.strokeStyle = "#18181b";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-12, 13);
  ctx.lineTo(4, 13);
  ctx.moveTo(-12, 17);
  ctx.lineTo(4, 17);
  ctx.moveTo(-7, 8);
  ctx.lineTo(-7, 22);
  ctx.moveTo(-1, 8);
  ctx.lineTo(-1, 22);
  ctx.stroke();

  // Front paws hugging the grenade
  ctx.fillStyle = "#52525b";
  ctx.strokeStyle = "#090d16";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(-14, 12, 4, 3, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(4, 11, 4.5, 3, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws the flaming "EXPLODING KITTENS" 2D vector typography matching the uploaded cover art.
 */
export function drawExplodingKittensTitle2D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale = 1,
  subtitle = "KITTENS"
) {
  const fonts = getCanvasFontFamilies();
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Flame tongues rising from top of "EXPLODING"
  ctx.fillStyle = "#f97316";
  for (let i = -5; i <= 5; i++) {
    const fx = i * 16;
    ctx.beginPath();
    ctx.moveTo(fx - 5, -18);
    ctx.quadraticCurveTo(fx + 2, -32 - (Math.abs(i) % 3) * 4, fx + 6, -18);
    ctx.closePath();
    ctx.fill();
  }

  // Gold-to-crimson vertical gradient for "EXPLODING"
  const expGrad = ctx.createLinearGradient(0, -26, 0, 2);
  expGrad.addColorStop(0, "#fde047");
  expGrad.addColorStop(0.55, "#f97316");
  expGrad.addColorStop(1, "#dc2626");
  ctx.fillStyle = expGrad;
  ctx.font = `900 26px ${fonts.sans}`;
  ctx.fillText("EXPLODING", 0, -10);

  // Crisp white bold "KITTENS" below
  ctx.fillStyle = "#f8fafc";
  ctx.font = `900 31px ${fonts.sans}`;
  ctx.fillText(subtitle, 0, 18);

  ctx.restore();
}

/**
 * Draws the 2D tabletop arena background for Imploding Kittens,
 * matching the deep crimson radial cover texture with subtle cat-icon pattern,
 * rotating Cone of Shame direction ring, and black-hole warning aura when Imploding Kitten is face-up.
 */
export function drawIkBackground2D(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  now: number,
  direction: 1 | -1,
  faceUpImplodingInDeck: boolean
) {
  getIkLogoImage();
  const cx = width * 0.5;
  const cy = height * 0.43;

  // Deep crimson radial felt matching the uploaded cover wallpaper!
  const bg = ctx.createRadialGradient(
    cx,
    cy,
    24,
    cx,
    cy,
    Math.max(width, height) * 0.78
  );
  if (faceUpImplodingInDeck) {
    bg.addColorStop(0, "#4c1d95");
    bg.addColorStop(0.55, "#2e1065");
    bg.addColorStop(1, "#090414");
  } else {
    bg.addColorStop(0, "#991b1b");
    bg.addColorStop(0.52, "#65090d");
    bg.addColorStop(1, "#260205");
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Subtle tiled wallpaper pattern of faint cat & bomb silhouettes (just like the uploaded crimson background!)
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
  const tileStep = 44;
  for (let py = 20; py < height; py += tileStep) {
    for (let px = 20; px < width; px += tileStep) {
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // Rotating Cone of Shame Direction Ring around center arena
  const ringR = Math.min(width * 0.28, height * 0.22, 168);
  const rotSpeed = (now / 2600) * direction;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotSpeed);

  ctx.strokeStyle = faceUpImplodingInDeck
    ? "rgba(216, 180, 254, 0.35)"
    : "rgba(253, 186, 116, 0.3)";
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 12]);
  ctx.beginPath();
  ctx.arc(0, 0, ringR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 4 Directional arrowheads along the ring
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.save();
    ctx.rotate(a);
    ctx.translate(0, -ringR);
    ctx.fillStyle = faceUpImplodingInDeck
      ? "rgba(216, 180, 254, 0.65)"
      : "rgba(253, 186, 116, 0.6)";
    ctx.beginPath();
    if (direction === 1) {
      ctx.moveTo(8, 0);
      ctx.lineTo(-5, -5);
      ctx.lineTo(-5, 5);
    } else {
      ctx.moveTo(-8, 0);
      ctx.lineTo(5, -5);
      ctx.lineTo(5, 5);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draws a detailed 2D Oatmeal-style cartoon illustration inside an Imploding Kittens card face.
 */
function drawCardCenterIllustration(
  ctx: CanvasRenderingContext2D,
  type: IkCardType,
  cx: number,
  cy: number,
  r: number,
  now: number
) {
  const meta = IK_CARD_META[type];
  ctx.save();
  ctx.translate(cx, cy);

  // Cream/warm comic illustration medallion disk
  const diskGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 2, 0, 0, r);
  if (type === "imploding_kitten") {
    diskGrad.addColorStop(0, "#3b0764");
    diskGrad.addColorStop(1, "#090414");
  } else if (type === "exploding_kitten" || type === "catomic_bomb") {
    diskGrad.addColorStop(0, "#7f1d1d");
    diskGrad.addColorStop(1, "#1c0406");
  } else {
    diskGrad.addColorStop(0, "rgba(255, 251, 235, 0.22)");
    diskGrad.addColorStop(1, "rgba(15, 23, 42, 0.72)");
  }
  ctx.fillStyle = diskGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = meta.colorHex;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  if (type === "exploding_kitten") {
    // Draw the signature Grey Kitten biting the hand grenade right inside the Exploding Kitten card!
    drawGrenadeKitten2D(ctx, 2, 1, r / 30);
    ctx.restore();
    return;
  }

  if (type === "imploding_kitten") {
    // Swirling violet-black singularity vortex pulling a wide-eyed cat inward!
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate((now / 420) * (i % 2 === 0 ? 1 : -1) + i);
      ctx.strokeStyle = i === 0 ? "#f0abfc" : "#a855f7";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.38 + i * 0.2), 0, Math.PI * 1.4);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = "#030008";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
    ctx.fill();
    // Cat eyes inside black hole
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-r * 0.12, -2, r * 0.1, 0, Math.PI * 2);
    ctx.arc(r * 0.12, -2, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c084fc";
    ctx.beginPath();
    ctx.arc(-r * 0.12, -2, r * 0.04, 0, Math.PI * 2);
    ctx.arc(r * 0.12, -2, r * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (type === "catomic_bomb") {
    // Nuclear mushroom cloud with pointy cat ears & glowing eyes!
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(0, -r * 0.2, r * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-r * 0.18, -r * 0.1, r * 0.36, r * 0.55);
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.arc(-r * 0.16, -r * 0.22, r * 0.09, 0, Math.PI * 2);
    ctx.arc(r * 0.16, -r * 0.22, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // Draw derpy cartoon cat ears silhouette behind the card's signature emoji emblem
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.beginPath();
  ctx.arc(0, 2, r * 0.52, 0, Math.PI * 2);
  ctx.moveTo(-r * 0.45, -r * 0.1);
  ctx.lineTo(-r * 0.52, -r * 0.68);
  ctx.lineTo(-r * 0.1, -r * 0.42);
  ctx.moveTo(r * 0.45, -r * 0.1);
  ctx.lineTo(r * 0.52, -r * 0.68);
  ctx.lineTo(r * 0.1, -r * 0.42);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.round(r * 1.12)}px sans-serif`;
  ctx.fillText(meta.emoji, 0, 2);

  ctx.restore();
}

/**
 * Draws a 2D Imploding Kittens card:
 * - Card Back (`card === null`) features the authentic crimson Exploding Kittens logo + Grenade-Biting Kitten!
 * - Face-up cards feature bold comic borders, corner type badges, and custom 2D cartoon cat illustrations.
 */
export function drawIkCard2D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  card: IkCard | null,
  options?: {
    selected?: boolean;
    hovered?: boolean;
    blinded?: boolean;
    blindIndex?: number;
    now?: number;
  }
) {
  const fonts = getCanvasFontFamilies();
  const r = Math.max(7, Math.round(w * 0.1));
  const now = options?.now ?? 0;

  ctx.save();

  // Drop shadow
  ctx.fillStyle = options?.selected
    ? "rgba(250, 204, 21, 0.45)"
    : "rgba(0, 0, 0, 0.5)";
  drawRoundedRect(ctx, x + 2, y + 3, w, h, r);
  ctx.fill();

  if (!card || options?.blinded) {
    const isBlind = Boolean(options?.blinded);
    const atlasImg = getIkCardAtlasImage();
    const cx = x + w * 0.5;

    if (atlasImg) {
      drawRoundedRect(ctx, x, y, w, h, r);
      ctx.save();
      ctx.clip();
      const prevSmooth = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        atlasImg,
        IK_CARD_BACK_SLOT.sx,
        IK_CARD_BACK_SLOT.sy,
        IK_CARD_BACK_SLOT.sw,
        IK_CARD_BACK_SLOT.sh,
        x,
        y,
        w,
        h
      );
      ctx.imageSmoothingEnabled = prevSmooth;
      if (isBlind) {
        ctx.fillStyle = "rgba(190, 18, 60, 0.25)";
        ctx.fillRect(x, y, w, h);
      }
      ctx.restore();

      drawRoundedRect(ctx, x, y, w, h, r);
      ctx.strokeStyle = options?.selected
        ? "#fde047"
        : isBlind
          ? "#fb7185"
          : options?.hovered
            ? "#fde047"
            : "#fca5a5";
      ctx.lineWidth = options?.selected ? 2.8 : options?.hovered ? 2.2 : 1.4;
      ctx.stroke();
    } else {
      const bg = ctx.createRadialGradient(
        x + w * 0.5,
        y + h * 0.48,
        4,
        x + w * 0.5,
        y + h * 0.5,
        Math.max(w, h) * 0.72
      );
      if (isBlind) {
        bg.addColorStop(0, "#be123c");
        bg.addColorStop(1, "#4c0519");
      } else {
        bg.addColorStop(0, "#b91c1c");
        bg.addColorStop(0.6, "#7f1d1d");
        bg.addColorStop(1, "#3b0508");
      }

      drawRoundedRect(ctx, x, y, w, h, r);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = options?.selected
        ? "#fde047"
        : isBlind
          ? "#fb7185"
          : "#f97316";
      ctx.lineWidth = options?.selected ? 2.6 : 1.6;
      ctx.stroke();

      // Inner crimson frame
      drawRoundedRect(ctx, x + 4, y + 4, w - 8, h - 8, Math.max(4, r - 2));
      ctx.strokeStyle = "rgba(253, 186, 116, 0.28)";
      ctx.lineWidth = 1;
      ctx.stroke();

      if (w >= 48) {
        drawExplodingKittensTitle2D(ctx, cx, y + h * 0.3, w / 215);
        drawGrenadeKitten2D(ctx, cx + 2, y + h * 0.68, w / 108);
      } else {
        drawGrenadeKitten2D(ctx, cx, y + h * 0.52, w / 68);
      }
    }

    if (isBlind) {
      drawRoundedRect(ctx, x + 4, y + h - 18, w - 8, 14, 4);
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.fill();
      ctx.fillStyle = "#fda4af";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `900 8.5px ${fonts.sans}`;
      ctx.fillText(
        `🍑 MÙ #${(options?.blindIndex ?? 0) + 1}`,
        cx,
        y + h - 11
      );
    }

    ctx.restore();
    return;
  }

  const meta = IK_CARD_META[card.type];
  const isFaceUpImploding =
    card.type === "imploding_kitten" && Boolean(card.faceUp);

  // Special 16-bit Pixel Art full-card rendering from the single unified Sprite Atlas!
  if (card.type in IK_CARD_ATLAS_SLOTS) {
    const atlasImg = getIkCardAtlasImage();
    const slot = getIkCardAtlasSlot(card.type, card.id);
    if (atlasImg) {
      drawRoundedRect(ctx, x, y, w, h, r);
      ctx.save();
      ctx.clip();
      const prevSmooth = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        atlasImg,
        slot.sx,
        slot.sy,
        slot.sw,
        slot.sh,
        x,
        y,
        w,
        h
      );
      ctx.imageSmoothingEnabled = prevSmooth;
      ctx.restore();

      drawRoundedRect(ctx, x, y, w, h, r);
      ctx.strokeStyle = options?.selected
        ? "#fde047"
        : options?.hovered
          ? meta.colorHex
          : "#cbd5e1";
      ctx.lineWidth = options?.selected ? 3 : options?.hovered ? 2.2 : 1.4;
      ctx.stroke();

      if (card.marked) {
        drawRoundedRect(ctx, x + 5, y + 24, w - 10, 14, 4);
        ctx.fillStyle = "rgba(234, 179, 8, 0.94)";
        ctx.fill();
        ctx.fillStyle = "#090d16";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `900 8px ${fonts.sans}`;
        ctx.fillText("🎯 ĐÃ BỊ LỘ", x + w * 0.5, y + 31);
      }

      if (options?.selected) {
        drawRoundedRect(ctx, x + 5, y + h - 18, w - 10, 14, 4);
        ctx.fillStyle = "#fde047";
        ctx.fill();
        ctx.fillStyle = "#090d16";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `900 8.5px ${fonts.sans}`;
        ctx.fillText("✓ ĐÃ CHỌN", x + w * 0.5, y + h - 11);
      }

      ctx.restore();
      return;
    }
  }

  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, meta.secondaryHex);
  grad.addColorStop(1, "#090d16");

  drawRoundedRect(ctx, x, y, w, h, r);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = options?.selected
    ? "#fde047"
    : isFaceUpImploding
      ? "#ffffff"
      : options?.hovered
        ? "#f8fafc"
        : meta.colorHex;
  ctx.lineWidth =
    options?.selected || isFaceUpImploding
      ? 3
      : options?.hovered
        ? 2.2
        : 1.5;
  ctx.stroke();

  // Top Corner Header Ribbon
  drawRoundedRect(
    ctx,
    x + 4,
    y + 4,
    w - 8,
    Math.round(h * 0.2),
    Math.max(4, r - 2)
  );
  ctx.fillStyle = isFaceUpImploding
    ? "#f8fafc"
    : "rgba(15, 23, 42, 0.82)";
  ctx.fill();

  ctx.fillStyle = isFaceUpImploding ? "#581c87" : meta.colorHex;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.max(8.5, Math.round(w * 0.135))}px ${fonts.sans}`;
  ctx.fillText(
    isFaceUpImploding ? "🕳️ ĐÃ LẬT NGỬA!" : meta.shortVi.toUpperCase(),
    x + w * 0.5,
    y + h * 0.14,
    w - 12
  );

  // Center 2D Cartoon Cat Illustration
  drawCardCenterIllustration(
    ctx,
    card.type,
    x + w * 0.5,
    y + h * 0.5,
    Math.min(w, h) * 0.26,
    now
  );

  // Bottom Rule Summary Strip
  drawRoundedRect(
    ctx,
    x + 4,
    y + h * 0.76,
    w - 8,
    h * 0.2,
    Math.max(3, r - 3)
  );
  ctx.fillStyle = "rgba(9, 13, 22, 0.84)";
  ctx.fill();

  ctx.fillStyle = "#e2e8f0";
  ctx.font = `700 ${Math.max(7.5, Math.round(w * 0.11))}px ${fonts.sans}`;
  ctx.fillText(meta.subtitleVi, x + w * 0.5, y + h * 0.86, w - 12);

  if (card.marked) {
    drawRoundedRect(ctx, x + 5, y + 24, w - 10, 14, 4);
    ctx.fillStyle = "rgba(234, 179, 8, 0.94)";
    ctx.fill();
    ctx.fillStyle = "#090d16";
    ctx.font = `900 8px ${fonts.sans}`;
    ctx.fillText("🎯 ĐÃ BỊ LỘ", x + w * 0.5, y + 31);
  }

  if (options?.selected) {
    drawRoundedRect(ctx, x + 5, y + h - 18, w - 10, 14, 4);
    ctx.fillStyle = "#fde047";
    ctx.fill();
    ctx.fillStyle = "#090d16";
    ctx.font = `900 8.5px ${fonts.sans}`;
    ctx.fillText("✓ ĐÃ CHỌN", x + w * 0.5, y + h - 11);
  }

  ctx.restore();
}
