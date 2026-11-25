import { lerp } from "@/canvas/engine";
import { drawHeatCard2D } from "@/canvas/heat-art";
import type { HeatCard } from "@/cartridges/heat";

export type HeatParticleKind = "smoke" | "flame" | "spark" | "frost" | "wind" | "confetti";

export interface HeatParticle {
  kind: HeatParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  growRate: number;
  color: string;
  rot: number;
  vrot: number;
  life: number;
  maxLife: number;
}

export interface MovingCarAnim {
  seatNo: number;
  fromProgress: number;
  toProgress: number;
  startMs: number;
  durationMs: number;
  spinOut?: boolean;
}

export interface FlyingHeatCardFx {
  card: HeatCard | null;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startMs: number;
  durationMs: number;
  w: number;
  h: number;
}

export class HeatFxEngine {
  particles: HeatParticle[] = [];
  movingCars = new Map<number, MovingCarAnim>();
  flyingCards: FlyingHeatCardFx[] = [];
  shake = { endMs: 0, durationMs: 1, intensity: 0 };

  triggerShake(nowMs: number, intensity: number, durationMs: number) {
    if (intensity >= this.shake.intensity || nowMs >= this.shake.endMs) {
      this.shake = { endMs: nowMs + durationMs, durationMs, intensity };
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

  startCarMove(
    seatNo: number,
    fromProgress: number,
    toProgress: number,
    nowMs: number,
    durationMs = 680,
    spinOut = false
  ) {
    this.movingCars.set(seatNo, {
      seatNo,
      fromProgress,
      toProgress,
      startMs: nowMs,
      durationMs,
      spinOut,
    });
  }

  getInterpolatedCarProgress(
    seatNo: number,
    actualProgress: number,
    nowMs: number
  ): { progress: number; isMoving: boolean; spinAngleOffset: number } {
    const anim = this.movingCars.get(seatNo);
    if (!anim) {
      return { progress: actualProgress, isMoving: false, spinAngleOffset: 0 };
    }
    const p = (nowMs - anim.startMs) / anim.durationMs;
    if (p >= 1) {
      this.movingCars.delete(seatNo);
      return { progress: actualProgress, isMoving: false, spinAngleOffset: 0 };
    }
    const u = Math.max(0, p);
    const ease = 1 - Math.pow(1 - u, 3);
    const spinAngleOffset = anim.spinOut ? Math.sin(u * Math.PI * 3) * 1.8 : 0;
    return {
      progress: lerp(anim.fromProgress, anim.toProgress, ease),
      isMoving: true,
      spinAngleOffset,
    };
  }

  spawnExhaustBurst(x: number, y: number, count = 18) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 25 + Math.random() * 80;
      this.particles.push({
        kind: i % 2 === 0 ? "flame" : "smoke",
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        radius: i % 2 === 0 ? 4 + Math.random() * 4 : 5 + Math.random() * 6,
        growRate: 12,
        color:
          i % 3 === 0
            ? "#fef08a"
            : i % 3 === 1
              ? "#f97316"
              : "rgba(148, 163, 184, 0.7)",
        rot: ang,
        vrot: (Math.random() - 0.5) * 3,
        life: 0.45 + Math.random() * 0.35,
        maxLife: 0.8,
      });
    }
  }

  spawnSpinOutSmoke(x: number, y: number, count = 28) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 30 + Math.random() * 95;
      this.particles.push({
        kind: i % 3 === 0 ? "spark" : "smoke",
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        radius: i % 3 === 0 ? 2.5 : 7 + Math.random() * 8,
        growRate: i % 3 === 0 ? 0 : 18,
        color:
          i % 3 === 0
            ? "#ef4444"
            : i % 2 === 0
              ? "rgba(226, 232, 240, 0.8)"
              : "rgba(71, 85, 105, 0.8)",
        rot: ang,
        vrot: (Math.random() - 0.5) * 5,
        life: 0.65 + Math.random() * 0.5,
        maxLife: 1.15,
      });
    }
  }

  spawnCooldownFrost(x: number, y: number, count = 20) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 20 + Math.random() * 65;
      this.particles.push({
        kind: "frost",
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 20,
        radius: 3 + Math.random() * 4,
        growRate: 4,
        color: i % 2 === 0 ? "#7dd3fc" : "#e0f2fe",
        rot: ang,
        vrot: 2,
        life: 0.55 + Math.random() * 0.4,
        maxLife: 0.95,
      });
    }
  }

  spawnSlipstreamWind(x: number, y: number, count = 20) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 35 + Math.random() * 90;
      this.particles.push({
        kind: "wind",
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        radius: 3 + Math.random() * 3,
        growRate: 6,
        color: i % 2 === 0 ? "#38bdf8" : "#bae6fd",
        rot: ang,
        vrot: 0,
        life: 0.45 + Math.random() * 0.35,
        maxLife: 0.8,
      });
    }
  }

  spawnFinishConfetti(x: number, y: number, count = 36) {
    const colors = ["#fde047", "#ef4444", "#38bdf8", "#4ade80", "#f8fafc"];
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 140;
      this.particles.push({
        kind: "confetti",
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 40,
        radius: 4 + Math.random() * 3,
        growRate: 0,
        color: colors[i % colors.length],
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 10,
        life: 0.9 + Math.random() * 0.6,
        maxLife: 1.5,
      });
    }
  }

  updateAndDraw(ctx: CanvasRenderingContext2D, dt: number, now: number) {
    // 1. Flying cards
    this.flyingCards = this.flyingCards.filter((fc) => {
      const p = (now - fc.startMs) / fc.durationMs;
      if (p < 0) return true;
      if (p >= 1) return false;
      const ease = 1 - Math.pow(1 - p, 3);
      const lift = Math.sin(p * Math.PI) * 32;
      const x = lerp(fc.fromX, fc.toX, ease);
      const y = lerp(fc.fromY, fc.toY, ease) - lift;
      ctx.save();
      ctx.translate(x, y);
      drawHeatCard2D(ctx, -fc.w / 2, -fc.h / 2, fc.w, fc.h, fc.card, {
        selected: true,
      });
      ctx.restore();
      return true;
    });

    // 2. Particles
    this.particles = this.particles.filter((pt) => {
      pt.life -= dt;
      if (pt.life <= 0) return false;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= Math.pow(0.93, dt * 60);
      pt.vy *= Math.pow(0.93, dt * 60);
      pt.radius += pt.growRate * dt;
      pt.rot += pt.vrot * dt;

      const alpha = Math.max(0, Math.min(1, pt.life / pt.maxLife));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.color;
      if (pt.kind === "confetti") {
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rot);
        ctx.fillRect(-pt.radius, -pt.radius * 0.5, pt.radius * 2, pt.radius);
      } else {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(0.5, pt.radius), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return true;
    });
  }
}
