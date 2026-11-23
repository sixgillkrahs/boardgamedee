import { lerp } from "@/canvas/engine";
import { drawDmdCard2D } from "@/canvas/dead-mans-draw-art";
import type { DmdCard } from "@/cartridges/dead-mans-draw";

export type PhysicsParticleKind =
  | "smoke"
  | "fire"
  | "spark"
  | "water"
  | "coin"
  | "bubble"
  | "dust"
  | "splinter";

export interface PhysicsParticle {
  kind: PhysicsParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  drag: number;
  radius: number;
  growRate: number;
  color: string;
  secondaryColor?: string;
  rot: number;
  vrot: number;
  life: number;
  maxLife: number;
}

export interface RealisticFlyingCardFx {
  card: DmdCard | null;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startMs: number;
  durationMs: number;
  w: number;
  h: number;
  flipFromBack?: boolean;
  tumble?: boolean;
  arcHeight?: number;
}

export interface SuitSpecialFx {
  kind:
    | "cannon_shot"
    | "sword_slash"
    | "hook_grapple"
    | "kraken_tentacles"
    | "anchor_drop"
    | "oracle_vision"
    | "map_trail"
    | "mermaid_wave"
    | "chest_key_unlock"
    | "bust_vignette";
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startMs: number;
  durationMs: number;
  extraX?: number;
  extraCount?: number;
  impactSpawned?: boolean;
}

export interface ScreenShakeState {
  endMs: number;
  durationMs: number;
  intensity: number;
}

export class DmdFxEngine {
  particles: PhysicsParticle[] = [];
  flyingCards: RealisticFlyingCardFx[] = [];
  specials: SuitSpecialFx[] = [];
  shake: ScreenShakeState = { endMs: 0, durationMs: 1, intensity: 0 };

  triggerShake(nowMs: number, intensity: number, durationMs: number) {
    if (intensity >= this.shake.intensity || nowMs >= this.shake.endMs) {
      this.shake = {
        endMs: nowMs + durationMs,
        durationMs,
        intensity,
      };
    }
  }

  getShakeOffset(nowMs: number): { dx: number; dy: number } {
    if (nowMs >= this.shake.endMs) return { dx: 0, dy: 0 };
    const rem = (this.shake.endMs - nowMs) / this.shake.durationMs;
    const mag = this.shake.intensity * rem * rem;
    return {
      dx: (Math.random() - 0.5) * 2 * mag,
      dy: (Math.random() - 0.5) * 2 * mag,
    };
  }

  spawnSmokeCloud(x: number, y: number, count: number, spread = 45, dark = false) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 12 + Math.random() * spread;
      this.particles.push({
        kind: "smoke",
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 22 - Math.random() * 18,
        gravity: -18,
        drag: 0.94,
        radius: 6 + Math.random() * 8,
        growRate: 18 + Math.random() * 14,
        color: dark
          ? i % 2 === 0
            ? "#27272a"
            : "#3f3f46"
          : i % 2 === 0
            ? "#94a3b8"
            : "#cbd5e1",
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 1.4,
        life: 0.65 + Math.random() * 0.55,
        maxLife: 1.2,
      });
    }
  }

  spawnFireExplosion(x: number, y: number, count = 26) {
    this.spawnSmokeCloud(x, y, Math.round(count * 0.5), 65, true);
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 55 + Math.random() * 170;
      const isSpark = i % 3 === 0;
      this.particles.push({
        kind: isSpark ? "spark" : "fire",
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 25,
        gravity: isSpark ? 260 : -40,
        drag: isSpark ? 0.96 : 0.91,
        radius: isSpark ? 2.4 : 4 + Math.random() * 6,
        growRate: isSpark ? 0 : 10,
        color:
          i % 4 === 0
            ? "#fef08a"
            : i % 4 === 1
              ? "#fb923c"
              : i % 4 === 2
                ? "#ef4444"
                : "#fde047",
        rot: ang,
        vrot: 0,
        life: 0.35 + Math.random() * 0.45,
        maxLife: 0.8,
      });
    }
    // Wood splinters
    for (let i = 0; i < 8; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 80 + Math.random() * 130;
      this.particles.push({
        kind: "splinter",
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 70,
        gravity: 340,
        drag: 0.98,
        radius: 5 + Math.random() * 4,
        growRate: 0,
        color: i % 2 === 0 ? "#92400e" : "#b45309",
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 14,
        life: 0.6 + Math.random() * 0.35,
        maxLife: 0.95,
      });
    }
  }

  spawnSteelSparks(x: number, y: number, count = 20, tint = "#7dd3fc") {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 80 + Math.random() * 190;
      this.particles.push({
        kind: "spark",
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 30,
        gravity: 240,
        drag: 0.95,
        radius: 2 + Math.random() * 2,
        growRate: 0,
        color: i % 2 === 0 ? "#ffffff" : tint,
        rot: ang,
        vrot: 0,
        life: 0.28 + Math.random() * 0.32,
        maxLife: 0.6,
      });
    }
  }

  spawnWaterSplash(x: number, y: number, count = 24, tint = "#67e8f9") {
    for (let i = 0; i < count; i++) {
      const ang = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7;
      const spd = 70 + Math.random() * 150;
      this.particles.push({
        kind: "water",
        x: x + (Math.random() - 0.5) * 28,
        y: y + (Math.random() - 0.5) * 12,
        vx: Math.cos(ang) * spd + (Math.random() - 0.5) * 45,
        vy: Math.sin(ang) * spd,
        gravity: 340,
        drag: 0.985,
        radius: 2.2 + Math.random() * 3.2,
        growRate: 0,
        color: i % 3 === 0 ? "#f0fdfa" : tint,
        rot: 0,
        vrot: 0,
        life: 0.55 + Math.random() * 0.45,
        maxLife: 1.0,
      });
    }
  }

  spawnPearlBubbles(x: number, y: number, count = 18) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        kind: "bubble",
        x: x + (Math.random() - 0.5) * 76,
        y: y + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 26,
        vy: -32 - Math.random() * 48,
        gravity: -12,
        drag: 0.98,
        radius: 3 + Math.random() * 4.5,
        growRate: 1.5,
        color: i % 2 === 0 ? "#99f6e4" : "#5eead4",
        secondaryColor: "#ffffff",
        rot: Math.random() * Math.PI * 2,
        vrot: 1.5,
        life: 0.9 + Math.random() * 0.7,
        maxLife: 1.6,
      });
    }
  }

  spawnGoldCoins(fromX: number, fromY: number, toX: number, toY: number, count = 18) {
    for (let i = 0; i < count; i++) {
      const spreadX = (Math.random() - 0.5) * 85;
      const dx = toX - fromX + spreadX;
      const dy = toY - fromY;
      const t = 0.55 + Math.random() * 0.35;
      const g = 420;
      const vx = dx / t;
      const vy = (dy - 0.5 * g * t * t) / t - 35 - Math.random() * 55;
      this.particles.push({
        kind: "coin",
        x: fromX + (Math.random() - 0.5) * 26,
        y: fromY + (Math.random() - 0.5) * 18,
        vx,
        vy,
        gravity: g,
        drag: 0.995,
        radius: 4.5 + Math.random() * 2.5,
        growRate: 0,
        color: i % 3 === 0 ? "#fef08a" : "#f59e0b",
        secondaryColor: "#b45309",
        rot: Math.random() * Math.PI * 2,
        vrot: 10 + Math.random() * 8,
        life: t + 0.15,
        maxLife: t + 0.15,
      });
    }
  }

  spawnParchmentDust(x: number, y: number, count = 16, color = "#fde68a") {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 20 + Math.random() * 65;
      this.particles.push({
        kind: "dust",
        x: x + (Math.random() - 0.5) * 24,
        y: y + (Math.random() - 0.5) * 24,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 16,
        gravity: -8,
        drag: 0.95,
        radius: 1.8 + Math.random() * 2.4,
        growRate: 0,
        color,
        rot: 0,
        vrot: 0,
        life: 0.55 + Math.random() * 0.5,
        maxLife: 1.05,
      });
    }
  }

  updateAndDraw(
    ctx: CanvasRenderingContext2D,
    dt: number,
    now: number,
    width: number,
    height: number
  ) {
    // 1. Update & draw Special Suit FX
    this.specials = this.specials.filter((fx) => {
      const p = (now - fx.startMs) / fx.durationMs;
      if (p < 0) return true;
      if (p >= 1) return false;

      if (fx.kind === "cannon_shot") {
        // Phase 1 (0..0.48): Iron cannonball arcing across table trailing smoke & fire sparks
        if (p < 0.48) {
          const u = p / 0.48;
          const bx = lerp(fx.fromX, fx.toX, u);
          const by = lerp(fx.fromY, fx.toY, u) - Math.sin(u * Math.PI) * 78;

          // Muzzle blast flash at launch
          if (u < 0.25) {
            const mf = 1 - u / 0.25;
            ctx.save();
            const mg = ctx.createRadialGradient(fx.fromX, fx.fromY, 2, fx.fromX, fx.fromY, 46 * mf);
            mg.addColorStop(0, `rgba(255, 250, 210, ${mf})`);
            mg.addColorStop(0.5, `rgba(249, 115, 22, ${mf * 0.75})`);
            mg.addColorStop(1, "rgba(249, 115, 22, 0)");
            ctx.fillStyle = mg;
            ctx.beginPath();
            ctx.arc(fx.fromX, fx.fromY, 46 * mf, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Continuous gunpowder smoke trail behind cannonball
          if (Math.random() < 0.85) {
            this.particles.push({
              kind: "smoke",
              x: bx,
              y: by,
              vx: (Math.random() - 0.5) * 18,
              vy: -14 - Math.random() * 14,
              gravity: -12,
              drag: 0.94,
              radius: 5 + Math.random() * 4,
              growRate: 14,
              color: "#64748b",
              rot: 0,
              vrot: 0,
              life: 0.45,
              maxLife: 0.45,
            });
          }
          if (Math.random() < 0.65) {
            this.particles.push({
              kind: "spark",
              x: bx,
              y: by,
              vx: (Math.random() - 0.5) * 45,
              vy: (Math.random() - 0.5) * 45,
              gravity: 120,
              drag: 0.95,
              radius: 2,
              growRate: 0,
              color: "#fb923c",
              rot: 0,
              vrot: 0,
              life: 0.22,
              maxLife: 0.22,
            });
          }

          // Heavy iron cannonball sphere with metallic glint & shadow
          ctx.save();
          ctx.fillStyle = "rgba(0,0,0,0.4)";
          ctx.beginPath();
          ctx.ellipse(bx, lerp(fx.fromY, fx.toY, u) + 12, 11, 5, 0, 0, Math.PI * 2);
          ctx.fill();

          const cg = ctx.createRadialGradient(bx - 4, by - 4, 2, bx, by, 12);
          cg.addColorStop(0, "#cbd5e1");
          cg.addColorStop(0.35, "#334155");
          cg.addColorStop(1, "#090d16");
          ctx.fillStyle = cg;
          ctx.beginPath();
          ctx.arc(bx, by, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#f97316";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        } else {
          // Impact detonation!
          if (!fx.impactSpawned) {
            fx.impactSpawned = true;
            this.triggerShake(now, 11, 360);
            this.spawnFireExplosion(fx.toX, fx.toY, 32);
          }
          const e = (p - 0.48) / 0.52;
          ctx.save();
          // Expanding fiery blast ring + bright flash
          const flashR = 85 * Math.sin(Math.min(1, e * 1.4) * Math.PI * 0.5);
          const fg = ctx.createRadialGradient(fx.toX, fx.toY, 2, fx.toX, fx.toY, Math.max(4, flashR));
          fg.addColorStop(0, `rgba(255, 255, 230, ${(1 - e) * 0.95})`);
          fg.addColorStop(0.45, `rgba(249, 115, 22, ${(1 - e) * 0.7})`);
          fg.addColorStop(1, "rgba(220, 38, 38, 0)");
          ctx.fillStyle = fg;
          ctx.beginPath();
          ctx.arc(fx.toX, fx.toY, flashR, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = `rgba(253, 186, 116, ${(1 - e) * 0.85})`;
          ctx.lineWidth = Math.max(1.5, 6 * (1 - e));
          ctx.beginPath();
          ctx.arc(fx.toX, fx.toY, 18 + e * 96, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      } else if (fx.kind === "sword_slash") {
        // Curved gleaming steel cutlass crescent slash across target vault!
        const slashP = Math.min(1, p / 0.65);
        const fade = p > 0.5 ? 1 - (p - 0.5) / 0.5 : 1;
        if (p >= 0.22 && !fx.impactSpawned) {
          fx.impactSpawned = true;
          this.triggerShake(now, 6, 220);
          this.spawnSteelSparks(fx.toX, fx.toY, 24, "#38bdf8");
        }
        ctx.save();
        ctx.translate(fx.toX, fx.toY);
        ctx.rotate(-0.45);
        ctx.globalAlpha = Math.max(0, fade);

        const startA = -Math.PI * 0.78;
        const endA = lerp(startA + 0.1, Math.PI * 0.58, 1 - Math.pow(1 - slashP, 3));
        const rOuter = 68;

        // Outer glowing cyan-steel blade trail
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 14 * fade;
        ctx.lineCap = "round";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(0, 0, rOuter, startA, endA);
        ctx.stroke();

        // Razor white-hot blade core
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 5 * fade;
        ctx.beginPath();
        ctx.arc(0, 0, rOuter, Math.max(startA, endA - 0.9), endA);
        ctx.stroke();

        // Diagonal cross-cut flash line at impact center
        if (slashP > 0.35) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${fade * 0.9})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-42, -16);
          ctx.lineTo(42, 16);
          ctx.stroke();
        }
        ctx.restore();
      } else if (fx.kind === "hook_grapple") {
        // Phase 1 (0..0.38): Iron chain + steel grappling hook shoots down to player's vault
        // Phase 2 (0.38..1.0): Reels back straight up to Play Area!
        const reach =
          p < 0.38
            ? 1 - Math.pow(1 - p / 0.38, 2)
            : 1 - Math.pow((p - 0.38) / 0.62, 1.8);
        if (p >= 0.36 && !fx.impactSpawned) {
          fx.impactSpawned = true;
          this.spawnSteelSparks(fx.toX, fx.toY, 16, "#e2e8f0");
        }
        const hx = lerp(fx.fromX, fx.toX, reach);
        const hy = lerp(fx.fromY, fx.toY, reach);
        const alpha = p > 0.85 ? (1 - p) / 0.15 : 1;

        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        // Draw realistic iron chain links from Play Area to grappling hook tip
        const dist = Math.hypot(hx - fx.fromX, hy - fx.fromY);
        const links = Math.max(2, Math.floor(dist / 12));
        const ang = Math.atan2(hy - fx.fromY, hx - fx.fromX);
        for (let i = 0; i <= links; i++) {
          const t = i / links;
          const lx = lerp(fx.fromX, hx, t);
          const ly = lerp(fx.fromY, hy, t);
          ctx.save();
          ctx.translate(lx, ly);
          ctx.rotate(ang);
          ctx.strokeStyle = i % 2 === 0 ? "#cbd5e1" : "#64748b";
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.ellipse(0, 0, 6, i % 2 === 0 ? 3.5 : 2.2, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Curved steel grappling hook claw at tip
        ctx.save();
        ctx.translate(hx, hy);
        ctx.rotate(ang - Math.PI / 2);
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, 8, 12, -Math.PI * 0.2, Math.PI * 1.1);
        ctx.stroke();
        ctx.strokeStyle = "#f1f5f9";
        ctx.lineWidth = 3.6;
        ctx.beginPath();
        ctx.arc(0, 8, 12, -Math.PI * 0.2, Math.PI * 1.1);
        ctx.stroke();
        ctx.restore();
        ctx.restore();
      } else if (fx.kind === "kraken_tentacles") {
        // 3 writhing abyssal crimson-black tentacles erupting around Draw Pile & Play Area!
        const rise = p < 0.25 ? p / 0.25 : p > 0.72 ? (1 - p) / 0.28 : 1;
        ctx.save();
        ctx.globalAlpha = Math.max(0, rise);

        // Dark abyssal whirlpool rings under the Play Area & Draw Pile
        for (let r = 0; r < 2; r++) {
          const rx = r === 0 ? fx.fromX : fx.toX;
          const ry = r === 0 ? fx.fromY : fx.toY;
          ctx.strokeStyle = `rgba(244, 63, 94, ${0.55 * rise})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(rx, ry, 24 + p * 85, p * 4, p * 4 + Math.PI * 1.45);
          ctx.stroke();
        }

        // Draw 3 animated undulating tentacles with suction cups
        const bases = [
          { x: fx.fromX - 24, y: fx.fromY + 58, dir: 1, len: 118, phase: 0 },
          { x: fx.fromX + 34, y: fx.fromY + 62, dir: -1, len: 105, phase: 1.7 },
          { x: fx.toX + 18, y: fx.toY + 64, dir: -1, len: 122, phase: 3.1 },
        ];
        for (const b of bases) {
          const segs = 14;
          const pts: { x: number; y: number }[] = [];
          for (let s = 0; s <= segs; s++) {
            const frac = s / segs;
            const curLen = b.len * rise * frac;
            const sway =
              Math.sin(now / 130 + b.phase + frac * 4.2) * (16 * frac) +
              b.dir * frac * frac * 34;
            pts.push({ x: b.x + sway, y: b.y - curLen });
          }

          // Tapered dark outline + crimson tentacle flesh + peach suction cups
          for (let s = 0; s < segs; s++) {
            const frac = s / segs;
            const wSeg = (1 - frac * 0.78) * 14;
            ctx.strokeStyle = "#180814";
            ctx.lineWidth = wSeg + 4;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(pts[s].x, pts[s].y);
            ctx.lineTo(pts[s + 1].x, pts[s + 1].y);
            ctx.stroke();

            ctx.strokeStyle = s % 2 === 0 ? "#be123c" : "#e11d48";
            ctx.lineWidth = wSeg;
            ctx.beginPath();
            ctx.moveTo(pts[s].x, pts[s].y);
            ctx.lineTo(pts[s + 1].x, pts[s + 1].y);
            ctx.stroke();

            if (s > 1 && s < segs - 1 && s % 2 === 0) {
              ctx.fillStyle = "#fdba74";
              ctx.beginPath();
              ctx.arc(pts[s].x + b.dir * (wSeg * 0.35), pts[s].y, Math.max(1.8, wSeg * 0.22), 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        ctx.restore();
      } else if (fx.kind === "anchor_drop") {
        // Heavy iron anchor chain sweeping back over protected cards + glowing cyan shield aura!
        const fade = p > 0.65 ? 1 - (p - 0.65) / 0.35 : 1;
        const sweep = Math.min(1, p / 0.45);
        ctx.save();
        ctx.globalAlpha = Math.max(0, fade);

        // Shield impact ring around the Anchor card itself
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 4 * fade;
        ctx.beginPath();
        ctx.arc(fx.toX, fx.toY, 16 + p * 74, 0, Math.PI * 2);
        ctx.stroke();

        // Heavy glowing cyan-iron chain sweeping backward from Anchor to earlier protected cards
        if (fx.extraX !== undefined && fx.toX > fx.extraX + 8) {
          const curLeft = lerp(fx.toX, fx.extraX, sweep);
          const links = Math.max(3, Math.floor((fx.toX - curLeft) / 14));
          for (let i = 0; i <= links; i++) {
            const lx = lerp(fx.toX, curLeft, i / links);
            const ly = fx.toY + Math.sin(i * 0.9 + now / 120) * 4;
            ctx.strokeStyle = i % 2 === 0 ? "#7dd3fc" : "#e0f2fe";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(lx, ly, 7, 4, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        ctx.restore();
      } else if (fx.kind === "oracle_vision") {
        // Rotating mystical violet-gold astrolabe rune rings + scanning eye beam!
        const fade = p < 0.2 ? p / 0.2 : p > 0.72 ? (1 - p) / 0.28 : 1;
        ctx.save();
        ctx.translate(fx.toX, fx.toY);
        ctx.globalAlpha = Math.max(0, fade);

        // Outer rotating arcane violet ring
        ctx.rotate(p * Math.PI * 1.8);
        ctx.strokeStyle = "#c084fc";
        ctx.lineWidth = 2.6;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, 44 + p * 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Counter-rotating inner golden astrolabe diamond
        ctx.rotate(-p * Math.PI * 3.4);
        ctx.strokeStyle = "#fde047";
        ctx.lineWidth = 1.8;
        const dr = 30 + p * 8;
        ctx.beginPath();
        ctx.moveTo(0, -dr);
        ctx.lineTo(dr, 0);
        ctx.lineTo(0, dr);
        ctx.lineTo(-dr, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      } else if (fx.kind === "map_trail") {
        // Animated red dotted treasure map trail from Discard Pile -> Play Area + bold crimson X!
        const march = Math.min(1, p / 0.55);
        const fade = p > 0.68 ? 1 - (p - 0.68) / 0.32 : 1;
        ctx.save();
        ctx.globalAlpha = Math.max(0, fade);
        const dots = 12;
        for (let i = 0; i <= Math.floor(dots * march); i++) {
          const t = i / dots;
          const dx = lerp(fx.fromX, fx.toX, t);
          const dy = lerp(fx.fromY, fx.toY, t) - Math.sin(t * Math.PI) * 32;
          ctx.fillStyle = "#dc2626";
          ctx.beginPath();
          ctx.arc(dx, dy, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#fef08a";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        // Bold flashing crimson 'X' marks the treasure spot!
        if (march >= 0.85) {
          const xs = 20 * (0.8 + 0.2 * Math.sin(p * 18));
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 5;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(fx.toX - xs, fx.toY - xs);
          ctx.lineTo(fx.toX + xs, fx.toY + xs);
          ctx.moveTo(fx.toX + xs, fx.toY - xs);
          ctx.lineTo(fx.toX - xs, fx.toY + xs);
          ctx.stroke();
        }
        ctx.restore();
      } else if (fx.kind === "mermaid_wave") {
        // Shimmering emerald-turquoise moonlit ocean wave sweeping under the Mermaid!
        const fade = p < 0.2 ? p / 0.2 : p > 0.65 ? (1 - p) / 0.35 : 1;
        ctx.save();
        ctx.globalAlpha = Math.max(0, fade * 0.9);
        for (let w = 0; w < 2; w++) {
          const rad = 22 + p * 68 + w * 14;
          ctx.strokeStyle = w === 0 ? "#5eead4" : "#ccfbf1";
          ctx.lineWidth = (4 - w * 1.5) * fade;
          ctx.beginPath();
          ctx.arc(fx.toX, fx.toY + 18, rad, Math.PI * 1.1, Math.PI * 1.9);
          ctx.stroke();
        }
        ctx.restore();
      } else if (fx.kind === "chest_key_unlock") {
        // Radiant rotating golden sunbeams bursting from Key+Chest unlock!
        const fade = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85;
        ctx.save();
        ctx.translate(fx.toX, fx.toY);
        ctx.rotate(p * 1.4);
        ctx.globalAlpha = Math.max(0, fade * 0.85);
        for (let i = 0; i < 10; i++) {
          const a = (i * Math.PI * 2) / 10;
          ctx.fillStyle = i % 2 === 0 ? "#fde047" : "#f59e0b";
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a - 0.11) * (95 + p * 45), Math.sin(a - 0.11) * (95 + p * 45));
          ctx.lineTo(Math.cos(a + 0.11) * (95 + p * 45), Math.sin(a + 0.11) * (95 + p * 45));
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      } else if (fx.kind === "bust_vignette") {
        // Dramatic crimson edge flash + skull shockwave when player Busts!
        const fade = Math.max(0, 1 - p);
        ctx.save();
        const vg = ctx.createRadialGradient(
          width * 0.5,
          height * 0.5,
          Math.min(width, height) * 0.25,
          width * 0.5,
          height * 0.5,
          Math.max(width, height) * 0.65
        );
        vg.addColorStop(0, "rgba(220, 38, 38, 0)");
        vg.addColorStop(1, `rgba(185, 28, 28, ${fade * 0.58})`);
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, width, height);

        // Expanding fiery red shatter ring at bust card
        ctx.strokeStyle = `rgba(248, 113, 113, ${fade * 0.9})`;
        ctx.lineWidth = Math.max(2, 7 * fade);
        ctx.beginPath();
        ctx.arc(fx.toX, fx.toY, 20 + p * 140, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      return true;
    });

    // 2. Render Realistic 3D Flipping / Tumbling Flying Cards
    this.flyingCards = this.flyingCards.filter((fc) => {
      const p = (now - fc.startMs) / fc.durationMs;
      if (p < 0) return true;
      if (p >= 1) return false;

      const ease = 1 - Math.pow(1 - p, 3);
      const lift = Math.sin(p * Math.PI);
      const arcH = fc.arcHeight ?? 42;
      const x = lerp(fc.fromX, fc.toX, ease);
      const y = lerp(fc.fromY, fc.toY, ease) - lift * arcH;

      // Dynamic floor shadow that drifts away & softens as card rises into the air
      ctx.save();
      ctx.translate(x + lift * 10, y + lift * (arcH * 0.75) + 6);
      ctx.fillStyle = `rgba(0, 0, 0, ${0.38 * (1 - lift * 0.45)})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, fc.w * 0.48, fc.h * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(x, y);
      const scale = 1 + lift * 0.14;
      if (fc.tumble) {
        ctx.rotate(p * Math.PI * 2.1);
        ctx.scale(scale, scale);
        drawDmdCard2D(ctx, -fc.w / 2, -fc.h / 2, fc.w, fc.h, fc.card, {
          bustRisk: true,
        });
      } else if (fc.flipFromBack) {
        // True 3D card flip: card back for p < 0.5, revealed treasure face for p >= 0.5!
        const flipCos = Math.cos(p * Math.PI);
        const scaleX = Math.max(0.06, Math.abs(flipCos));
        const showFace = p >= 0.5;
        ctx.rotate((1 - ease) * -0.18);
        ctx.scale(scale * scaleX, scale);
        drawDmdCard2D(
          ctx,
          -fc.w / 2,
          -fc.h / 2,
          fc.w,
          fc.h,
          showFace ? fc.card : null,
          { highlighted: showFace }
        );
      } else {
        ctx.rotate((1 - ease) * 0.22);
        ctx.scale(scale, scale);
        drawDmdCard2D(ctx, -fc.w / 2, -fc.h / 2, fc.w, fc.h, fc.card, {
          highlighted: true,
        });
      }
      ctx.restore();
      return true;
    });

    // 3. Update & Draw Physics Particles (Smoke, Fire, Sparks, Water, Spinning Gold Coins, Bubbles, Splinters)
    this.particles = this.particles.filter((pt) => {
      pt.life -= dt;
      if (pt.life <= 0) return false;
      pt.vy += pt.gravity * dt;
      pt.vx *= Math.pow(pt.drag, dt * 60);
      pt.vy *= Math.pow(pt.drag, dt * 60);
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.radius = Math.max(0.5, pt.radius + pt.growRate * dt);
      pt.rot += pt.vrot * dt;

      const alpha = Math.max(0, Math.min(1, pt.life / pt.maxLife));
      ctx.save();
      ctx.globalAlpha = pt.kind === "smoke" ? alpha * 0.45 : alpha;

      if (pt.kind === "smoke") {
        const sg = ctx.createRadialGradient(pt.x, pt.y, 1, pt.x, pt.y, pt.radius);
        sg.addColorStop(0, pt.color);
        sg.addColorStop(1, "rgba(15, 23, 42, 0)");
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (pt.kind === "fire") {
        const fg = ctx.createRadialGradient(pt.x, pt.y, 0.5, pt.x, pt.y, pt.radius);
        fg.addColorStop(0, "#ffffff");
        fg.addColorStop(0.45, pt.color);
        fg.addColorStop(1, "rgba(220, 38, 38, 0)");
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (pt.kind === "spark") {
        // Velocity-aligned metallic spark streak
        ctx.strokeStyle = pt.color;
        ctx.lineWidth = pt.radius;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(pt.x - pt.vx * 0.045, pt.y - pt.vy * 0.045);
        ctx.stroke();
      } else if (pt.kind === "water") {
        // Teardrop water droplet
        const a = Math.atan2(pt.vy, pt.vx);
        ctx.translate(pt.x, pt.y);
        ctx.rotate(a);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, pt.radius * 1.45, pt.radius * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (pt.kind === "coin") {
        // 3D spinning gold pirate doubloon!
        ctx.translate(pt.x, pt.y);
        const spinW = Math.max(0.2, Math.abs(Math.cos(pt.rot)));
        ctx.scale(spinW, 1);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(0, 0, pt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = pt.secondaryColor ?? "#92400e";
        ctx.lineWidth = 1.4;
        ctx.stroke();
        // Specular gold glint
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(-pt.radius * 0.3, -pt.radius * 0.3, pt.radius * 0.25, 0, Math.PI * 2);
        ctx.fill();
      } else if (pt.kind === "bubble") {
        ctx.strokeStyle = pt.color;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.beginPath();
        ctx.arc(
          pt.x - pt.radius * 0.32,
          pt.y - pt.radius * 0.32,
          pt.radius * 0.28,
          0,
          Math.PI * 2
        );
        ctx.fill();
      } else if (pt.kind === "splinter") {
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rot);
        ctx.fillStyle = pt.color;
        ctx.fillRect(-pt.radius, -1.6, pt.radius * 2, 3.2);
      } else {
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      return true;
    });
  }
}
