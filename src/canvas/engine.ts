export type HitRegion =
  | {
      id: string;
      shape: "circle";
      x: number;
      y: number;
      radius: number;
      cursor?: string;
      data?: Record<string, any>;
    }
  | {
      id: string;
      shape: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      cursor?: string;
      data?: Record<string, any>;
    };

export function lerp(a: number, b: number, t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return a + (b - a) * clamped;
}

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function toHexByte(n: number): string {
  return Math.round(Math.max(0, Math.min(255, n)))
    .toString(16)
    .padStart(2, "0");
}

export function lerpHexColor(fromHex: string, toHex: string, t: number): string {
  const [r1, g1, b1] = parseHex(fromHex);
  const [r2, g2, b2] = parseHex(toHex);
  return `#${toHexByte(lerp(r1, r2, t))}${toHexByte(lerp(g1, g2, t))}${toHexByte(lerp(b1, b2, t))}`;
}

export function computeRadialSeatPosition(
  index: number,
  total: number,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number
): { x: number; y: number; angle: number } {
  const safeTotal = Math.max(1, total);
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / safeTotal;
  return {
    x: centerX + Math.cos(angle) * radiusX,
    y: centerY + Math.sin(angle) * radiusY,
    angle,
  };
}

export function findHitRegionAtPoint(
  regions: HitRegion[],
  px: number,
  py: number
): HitRegion | null {
  // Iterate in reverse (top-most drawn region first)
  for (let i = regions.length - 1; i >= 0; i--) {
    const r = regions[i];
    if (r.shape === "circle") {
      const dx = px - r.x;
      const dy = py - r.y;
      if (dx * dx + dy * dy <= r.radius * r.radius) {
        return r;
      }
    } else {
      if (
        px >= r.x &&
        px <= r.x + r.width &&
        py >= r.y &&
        py <= r.y + r.height
      ) {
        return r;
      }
    }
  }
  return null;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  particles: Particle[] = [];

  spawn(p: Particle) {
    if (this.particles.length > 160) {
      this.particles.shift();
    }
    this.particles.push(p);
  }

  update(dtSeconds: number) {
    const next: Particle[] = [];
    for (const p of this.particles) {
      const remaining = p.life - dtSeconds;
      if (remaining > 0) {
        next.push({
          ...p,
          x: p.x + p.vx * dtSeconds,
          y: p.y + p.vy * dtSeconds,
          life: remaining,
        });
      }
    }
    this.particles = next;
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.save();
      ctx.globalAlpha = alpha * 0.85;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export type CanvasFontKind = "sans" | "pixel" | "mono";

let cachedCanvasFonts: Record<CanvasFontKind, string> | null = null;

/**
 * Resolves the real Next.js-loaded Vietnamese-capable 2D game webfonts
 * (Chakra Petch for crisp 2D UI, VT323 for retro 16-bit Pixel Art titles/HUD,
 * JetBrains Mono for aligned counters/codes) for use in `ctx.font`.
 */
export function getCanvasFontFamilies(): Record<CanvasFontKind, string> {
  if (cachedCanvasFonts) return cachedCanvasFonts;
  if (typeof window === "undefined") {
    return {
      sans: '"Chakra Petch", sans-serif',
      pixel: '"VT323", "Chakra Petch", monospace',
      mono: '"JetBrains Mono", "Chakra Petch", monospace',
    };
  }
  const style = window.getComputedStyle(document.documentElement);
  const sansVar = style.getPropertyValue("--font-game-sans").trim();
  const pixelVar = style.getPropertyValue("--font-game-pixel").trim();
  const monoVar = style.getPropertyValue("--font-game-mono").trim();
  const resolved: Record<CanvasFontKind, string> = {
    sans: sansVar ? `${sansVar}, "Chakra Petch", sans-serif` : '"Chakra Petch", sans-serif',
    pixel: pixelVar ? `${pixelVar}, "VT323", "Chakra Petch", monospace` : '"VT323", "Chakra Petch", monospace',
    mono: monoVar ? `${monoVar}, "JetBrains Mono", monospace` : '"JetBrains Mono", monospace',
  };
  if (sansVar || pixelVar || monoVar) {
    cachedCanvasFonts = resolved;
  }
  return resolved;
}

/**
 * Builds a `ctx.font` string using our Vietnamese-ready 2D game fonts.
 * For `"pixel"` (VT323), scales size slightly (~1.3x) to match visual x-height.
 */
export function canvasFont(
  weight: string | number,
  sizePx: number,
  kind: CanvasFontKind = "sans"
): string {
  const fams = getCanvasFontFamilies();
  if (kind === "pixel") {
    return `400 ${Math.round(sizePx * 1.32)}px ${fams.pixel}`;
  }
  return `${weight} ${Math.round(sizePx)}px ${fams[kind]}`;
}
