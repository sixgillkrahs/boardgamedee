import { getCanvasFontFamilies, type ParticleSystem } from "@/canvas/engine";
import {
  drawKotEnergyCube2D,
  drawKotIcon2D,
  getKotBuzzPlacementAnchorPx,
} from "@/canvas/king-of-tokyo-duel-art";
import {
  KOT_MONSTERS,
  type KotLastAnim,
  type KotMonsterId,
} from "@/cartridges/king-of-tokyo-duel";

export type KotSfxKind =
  | "roll"
  | "smash"
  | "heal"
  | "energy"
  | "buzz"
  | "buy"
  | "power"
  | "victory";

let sharedAudioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedAudioCtx) {
    try {
      sharedAudioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  if (sharedAudioCtx.state === "suspended") {
    void sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Lightweight zero-asset Web Audio synthesizer for crisp arcade Kaiju feedback SFX.
 */
export function playKotSfx(kind: KotSfxKind, enabled: boolean) {
  if (!enabled) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  try {
    const t0 = ctx.currentTime;
    const tone = (
      type: OscillatorType,
      fStart: number,
      fEnd: number,
      startOffset: number,
      dur: number,
      vol: number
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(fStart, t0 + startOffset);
      if (fEnd !== fStart) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(20, fEnd),
          t0 + startOffset + dur
        );
      }
      gain.gain.setValueAtTime(0.0001, t0 + startOffset);
      gain.gain.linearRampToValueAtTime(vol, t0 + startOffset + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + startOffset + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0 + startOffset);
      osc.stop(t0 + startOffset + dur + 0.02);
    };

    const noiseBurst = (startOffset: number, dur: number, vol: number, freq: number) => {
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(freq, t0 + startOffset);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol, t0 + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + startOffset + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(t0 + startOffset);
    };

    switch (kind) {
      case "roll":
        tone("triangle", 320, 190, 0, 0.05, 0.06);
        tone("triangle", 410, 240, 0.055, 0.05, 0.055);
        tone("triangle", 360, 210, 0.11, 0.06, 0.05);
        break;
      case "smash":
        tone("sawtooth", 155, 36, 0, 0.24, 0.14);
        tone("sine", 95, 32, 0.01, 0.26, 0.18);
        noiseBurst(0, 0.18, 0.13, 1200);
        break;
      case "heal":
        tone("sine", 523.25, 523.25, 0, 0.16, 0.08);
        tone("sine", 659.25, 659.25, 0.07, 0.18, 0.08);
        tone("sine", 783.99, 783.99, 0.14, 0.24, 0.09);
        break;
      case "energy":
        tone("triangle", 440, 980, 0, 0.12, 0.08);
        tone("sine", 880, 1320, 0.06, 0.14, 0.06);
        break;
      case "buzz":
        tone("sine", 130, 48, 0, 0.18, 0.14);
        tone("triangle", 740, 1180, 0.04, 0.2, 0.08);
        break;
      case "buy":
        tone("triangle", 520, 780, 0, 0.11, 0.08);
        tone("sine", 780, 1046, 0.08, 0.18, 0.08);
        break;
      case "power":
        tone("sawtooth", 210, 740, 0, 0.22, 0.09);
        tone("triangle", 520, 260, 0.16, 0.26, 0.09);
        noiseBurst(0.06, 0.2, 0.08, 1800);
        break;
      case "victory":
        tone("triangle", 523.25, 523.25, 0, 0.14, 0.11);
        tone("triangle", 659.25, 659.25, 0.13, 0.14, 0.11);
        tone("triangle", 783.99, 783.99, 0.26, 0.16, 0.11);
        tone("triangle", 1046.5, 1046.5, 0.4, 0.45, 0.13);
        break;
    }
  } catch {
    // Ignore audio errors on restricted devices
  }
}

export type KotSide = "left" | "right";

export interface KotFxAnchors {
  leftBoard: { x: number; y: number };
  rightBoard: { x: number; y: number };
  leftDial: { x: number; y: number };
  rightDial: { x: number; y: number };
  leftEnergy: { x: number; y: number };
  rightEnergy: { x: number; y: number };
  diceCenter: { x: number; y: number };
  boardCenter: { x: number; y: number };
  boardRect: { x: number; y: number; w: number; h: number };
}

export interface KotBoardMotion {
  dx: number;
  dy: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  hitFlash: number;
  healGlow: number;
  auraColor: string | null;
  auraAlpha: number;
}

interface BoardMotionEvent {
  side: KotSide;
  kind: "lunge" | "hurt" | "heal" | "power";
  dir: -1 | 1;
  color: string;
  startMs: number;
  durationMs: number;
}

interface SlashFx {
  x: number;
  y: number;
  scale: number;
  startMs: number;
  durationMs: number;
}

interface ShockwaveFx {
  x: number;
  y: number;
  maxR: number;
  color: string;
  lineWidth: number;
  startMs: number;
  durationMs: number;
}

interface FloatingHeartFx {
  x: number;
  y: number;
  driftX: number;
  riseY: number;
  size: number;
  startMs: number;
  durationMs: number;
}

interface FlyingEnergyFx {
  x0: number;
  y0: number;
  cx: number;
  cy: number;
  x1: number;
  y1: number;
  size: number;
  startMs: number;
  durationMs: number;
  arrived: boolean;
}

interface PowerFx {
  monsterId: KotMonsterId;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  boardCenterX: number;
  boardCenterY: number;
  startMs: number;
  durationMs: number;
}

interface BannerFx {
  text: string;
  color: string;
  x: number;
  y: number;
  size: number;
  startMs: number;
  durationMs: number;
}

export class KotFxManager {
  private motions: BoardMotionEvent[] = [];
  private slashes: SlashFx[] = [];
  private shockwaves: ShockwaveFx[] = [];
  private hearts: FloatingHeartFx[] = [];
  private energyCubes: FlyingEnergyFx[] = [];
  private powers: PowerFx[] = [];
  private banners: BannerFx[] = [];
  public screenShakeEndMs = 0;
  public screenShakeMag = 0;

  public triggerAnim(
    anim: KotLastAnim,
    viewerSeatNo: number,
    trackSign: -1 | 1,
    anchors: KotFxAnchors,
    particles: ParticleSystem,
    now: number,
    soundEnabled: boolean
  ) {
    const actorSide: KotSide =
      anim.actorSeatNo === viewerSeatNo ? "right" : "left";
    const targetSide: KotSide =
      anim.targetSeatNo !== undefined
        ? anim.targetSeatNo === viewerSeatNo
          ? "right"
          : "left"
        : actorSide === "right"
          ? "left"
          : "right";

    const actorBoard =
      actorSide === "right" ? anchors.rightBoard : anchors.leftBoard;
    const targetBoard =
      targetSide === "right" ? anchors.rightBoard : anchors.leftBoard;
    const actorDial =
      actorSide === "right" ? anchors.rightDial : anchors.leftDial;
    const actorEnergy =
      actorSide === "right" ? anchors.rightEnergy : anchors.leftEnergy;

    // 1. Kaiju Smash / Damage animation!
    if ((anim.damage ?? 0) > 0) {
      const dmg = anim.damage ?? 1;
      const lungeDir: -1 | 1 = actorSide === "right" ? -1 : 1;
      const knockDir: -1 | 1 = targetSide === "right" ? 1 : -1;

      this.motions.push({
        side: actorSide,
        kind: "lunge",
        dir: lungeDir,
        color: "#f97316",
        startMs: now,
        durationMs: 420,
      });
      this.motions.push({
        side: targetSide,
        kind: "hurt",
        dir: knockDir,
        color: "#ef4444",
        startMs: now + 95,
        durationMs: 480,
      });

      this.screenShakeEndMs = now + 420;
      this.screenShakeMag = Math.min(14, 5 + dmg * 2);

      this.slashes.push({
        x: targetBoard.x,
        y: targetBoard.y,
        scale: Math.min(1.45, 0.92 + dmg * 0.12),
        startMs: now + 80,
        durationMs: 480,
      });
      this.shockwaves.push({
        x: targetBoard.x,
        y: targetBoard.y,
        maxR: 72 + dmg * 12,
        color: "#ef4444",
        lineWidth: 5,
        startMs: now + 95,
        durationMs: 460,
      });
      this.shockwaves.push({
        x: targetBoard.x,
        y: targetBoard.y,
        maxR: 48 + dmg * 8,
        color: "#fde047",
        lineWidth: 3,
        startMs: now + 135,
        durationMs: 380,
      });

      const sparkCount = Math.min(36, 16 + dmg * 5);
      for (let i = 0; i < sparkCount; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 75 + Math.random() * 160;
        particles.spawn({
          x: targetBoard.x + (Math.random() - 0.5) * 44,
          y: targetBoard.y + (Math.random() - 0.5) * 32,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          radius: 2 + Math.random() * 3,
          color: i % 3 === 0 ? "#ef4444" : i % 3 === 1 ? "#f97316" : "#fde047",
          life: 0.68,
          maxLife: 0.68,
        });
      }

      this.banners.push({
        text: `-${dmg} HP`,
        color: "#fca5a5",
        x: targetBoard.x,
        y: targetBoard.y - 26,
        size: 19,
        startMs: now + 95,
        durationMs: 1300,
      });
      playKotSfx("smash", soundEnabled);
    }

    // 2. Healing Wave + Floating 16-bit Heart Icons!
    if ((anim.heal ?? 0) > 0) {
      const heal = anim.heal ?? 1;
      this.motions.push({
        side: actorSide,
        kind: "heal",
        dir: 1,
        color: "#34d399",
        startMs: now + 40,
        durationMs: 650,
      });
      this.shockwaves.push({
        x: actorBoard.x,
        y: actorBoard.y,
        maxR: 78,
        color: "#34d399",
        lineWidth: 3.5,
        startMs: now + 40,
        durationMs: 560,
      });
      this.shockwaves.push({
        x: actorDial.x,
        y: actorDial.y,
        maxR: 54,
        color: "#6ee7b7",
        lineWidth: 2.5,
        startMs: now + 110,
        durationMs: 520,
      });

      const heartCount = Math.min(6, 2 + heal);
      for (let i = 0; i < heartCount; i++) {
        this.hearts.push({
          x: actorBoard.x + (Math.random() - 0.5) * 86,
          y: actorBoard.y + 18 + (Math.random() - 0.5) * 24,
          driftX: (Math.random() - 0.5) * 22,
          riseY: 56 + Math.random() * 34,
          size: 16 + Math.round(Math.random() * 6),
          startMs: now + 50 + i * 75,
          durationMs: 920,
        });
      }
      for (let i = 0; i < 16; i++) {
        particles.spawn({
          x: actorBoard.x + (Math.random() - 0.5) * 90,
          y: actorBoard.y + 20,
          vx: (Math.random() - 0.5) * 32,
          vy: -42 - Math.random() * 58,
          radius: 2 + Math.random() * 2,
          color: i % 2 === 0 ? "#34d399" : "#a7f3d0",
          life: 0.8,
          maxLife: 0.8,
        });
      }

      this.banners.push({
        text: `+${heal} HP`,
        color: "#6ee7b7",
        x: actorBoard.x,
        y: actorBoard.y - 26,
        size: 17,
        startMs: now + 70,
        durationMs: 1250,
      });
      if ((anim.damage ?? 0) === 0) playKotSfx("heal", soundEnabled);
    }

    // 3. Flying 16-bit Green Energy Cubes arcing into the Energy Stash!
    if ((anim.energyGain ?? 0) > 0) {
      const en = anim.energyGain ?? 1;
      const cubesToFly = Math.min(6, en);
      for (let i = 0; i < cubesToFly; i++) {
        const x0 = anchors.diceCenter.x + (Math.random() - 0.5) * 70;
        const y0 = anchors.diceCenter.y + 8;
        const x1 = actorEnergy.x + (Math.random() - 0.5) * 18;
        const y1 = actorEnergy.y + (Math.random() - 0.5) * 18;
        const midX = (x0 + x1) / 2 + (actorSide === "right" ? 30 : -30);
        const midY = Math.min(y0, y1) - 55 - Math.random() * 30;
        this.energyCubes.push({
          x0,
          y0,
          cx: midX,
          cy: midY,
          x1,
          y1,
          size: 19,
          startMs: now + i * 65,
          durationMs: 520,
          arrived: false,
        });
      }
      this.banners.push({
        text: `+${en} NL`,
        color: "#bef264",
        x: actorEnergy.x,
        y: actorEnergy.y - 22,
        size: 15,
        startMs: now + 260,
        durationMs: 1150,
      });
      if ((anim.damage ?? 0) === 0 && (anim.heal ?? 0) === 0) {
        playKotSfx("energy", soundEnabled);
      }
    }

    // 4. Signature Monster Special Power Animation!
    if (anim.monsterPowerId) {
      const meta = KOT_MONSTERS[anim.monsterPowerId];
      this.motions.push({
        side: actorSide,
        kind: "power",
        dir: actorSide === "right" ? -1 : 1,
        color: meta.accentColor,
        startMs: now,
        durationMs: 760,
      });
      this.powers.push({
        monsterId: anim.monsterPowerId,
        fromX: actorBoard.x,
        fromY: actorBoard.y,
        toX: targetBoard.x,
        toY: targetBoard.y,
        boardCenterX: anchors.boardCenter.x,
        boardCenterY: anchors.boardCenter.y,
        startMs: now + 30,
        durationMs: 780,
      });
      this.banners.push({
        text: anim.labelVi ?? meta.powerNameVi,
        color: "#fde047",
        x: anchors.boardCenter.x,
        y: anchors.boardCenter.y - 44,
        size: 16,
        startMs: now + 40,
        durationMs: 1550,
      });
      playKotSfx("power", soundEnabled);
    }

    // 5. Buzz Tile Slam Shockwave right on the placed Tokyo track spot!
    if (anim.buzzTrack && anim.buzzStartPos !== undefined) {
      const br = anchors.boardRect;
      const pt = getKotBuzzPlacementAnchorPx(
        br.x,
        br.y,
        br.w,
        br.h,
        anim.buzzTrack,
        anim.buzzStartPos,
        anim.buzzSpan ?? 2,
        trackSign
      );
      this.shockwaves.push({
        x: pt.cx,
        y: pt.cy,
        maxR: 62,
        color: "#fde047",
        lineWidth: 4,
        startMs: now,
        durationMs: 480,
      });
      this.shockwaves.push({
        x: pt.cx,
        y: pt.cy,
        maxR: 40,
        color: "#34d399",
        lineWidth: 2.5,
        startMs: now + 60,
        durationMs: 420,
      });
      for (let i = 0; i < 16; i++) {
        const ang = (Math.PI * 2 * i) / 16;
        const spd = 45 + Math.random() * 65;
        particles.spawn({
          x: pt.cx,
          y: pt.cy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          radius: 2 + Math.random() * 1.8,
          color: i % 2 === 0 ? "#fde047" : "#6ee7b7",
          life: 0.52,
          maxLife: 0.52,
        });
      }
      if (anim.labelVi) {
        this.banners.push({
          text: anim.labelVi,
          color: "#6ee7b7",
          x: pt.cx,
          y: pt.cy - 20,
          size: 14,
          startMs: now,
          durationMs: 1300,
        });
      }
      playKotSfx("buzz", soundEnabled);
    } else if (anim.kind === "BUY_CARD" && anim.labelVi) {
      this.banners.push({
        text: anim.labelVi,
        color: "#fde047",
        x: anchors.boardCenter.x,
        y: anchors.boardCenter.y - 24,
        size: 15,
        startMs: now,
        durationMs: 1300,
      });
      if ((anim.damage ?? 0) === 0 && (anim.heal ?? 0) === 0) {
        playKotSfx("buy", soundEnabled);
      }
    } else if (anim.kind === "VICTORY") {
      playKotSfx("victory", soundEnabled);
    }
  }

  public getBoardMotion(side: KotSide, now: number): KotBoardMotion {
    let dx = 0;
    let dy = 0;
    let scaleX = 1;
    let scaleY = 1;
    let angle = 0;
    let hitFlash = 0;
    let healGlow = 0;
    let auraColor: string | null = null;
    let auraAlpha = 0;

    this.motions = this.motions.filter((m) => now < m.startMs + m.durationMs);
    for (const m of this.motions) {
      if (m.side !== side || now < m.startMs) continue;
      const p = Math.min(1, (now - m.startMs) / m.durationMs);

      if (m.kind === "lunge") {
        // Anticipation pullback (0..0.18), explosive lunge (0.18..0.46), spring recovery (0.46..1)
        if (p < 0.18) {
          const t = p / 0.18;
          dx -= m.dir * 8 * Math.sin(t * Math.PI * 0.5);
          scaleX *= 1 - 0.05 * t;
          scaleY *= 1 + 0.04 * t;
        } else if (p < 0.46) {
          const t = (p - 0.18) / 0.28;
          const ease = Math.sin(t * Math.PI * 0.5);
          dx += m.dir * 30 * ease;
          dy -= 6 * Math.sin(t * Math.PI);
          scaleX *= 1 + 0.08 * ease;
          scaleY *= 1 - 0.04 * ease;
          angle += m.dir * 0.07 * ease;
        } else {
          const t = (p - 0.46) / 0.54;
          const decay = 1 - t;
          dx += m.dir * 30 * decay * decay;
          angle += m.dir * 0.07 * decay * decay;
        }
      } else if (m.kind === "hurt") {
        const decay = 1 - p;
        const shudder = Math.sin(p * Math.PI * 7) * 7 * decay;
        dx += m.dir * 16 * Math.sin(Math.min(1, p * 2.2) * Math.PI) + shudder;
        dy += Math.cos(p * Math.PI * 5) * 3 * decay;
        angle += m.dir * 0.06 * decay * Math.sin(p * Math.PI * 2);
        hitFlash = Math.max(hitFlash, decay * 0.68);
      } else if (m.kind === "heal") {
        const wave = Math.sin(p * Math.PI);
        dy -= 7 * wave;
        scaleX *= 1 + 0.035 * wave;
        scaleY *= 1 + 0.035 * wave;
        healGlow = Math.max(healGlow, wave * 0.85);
      } else if (m.kind === "power") {
        const wave = Math.sin(p * Math.PI);
        scaleX *= 1 + 0.07 * wave;
        scaleY *= 1 + 0.07 * wave;
        auraColor = m.color;
        auraAlpha = Math.max(auraAlpha, wave);
      }
    }

    return {
      dx,
      dy,
      scaleX,
      scaleY,
      angle,
      hitFlash,
      healGlow,
      auraColor,
      auraAlpha,
    };
  }

  public getDialShake(side: KotSide, now: number): { dx: number; dy: number } {
    let dx = 0;
    let dy = 0;
    for (const m of this.motions) {
      if (m.side !== side || m.kind !== "hurt" || now < m.startMs) continue;
      const p = Math.min(1, (now - m.startMs) / m.durationMs);
      const decay = 1 - p;
      dx += Math.sin(p * Math.PI * 10) * 5 * decay;
      dy += Math.cos(p * Math.PI * 8) * 3 * decay;
    }
    return { dx, dy };
  }

  public render(
    ctx: CanvasRenderingContext2D,
    particles: ParticleSystem,
    now: number
  ) {
    const fonts = getCanvasFontFamilies();

    // 1. Expanding Shockwaves (Smash, Heal, Buzz Slam)
    this.shockwaves = this.shockwaves.filter((sw) => {
      const p = (now - sw.startMs) / sw.durationMs;
      if (p < 0) return true;
      if (p >= 1) return false;
      const ease = 1 - (1 - p) * (1 - p);
      const r = 10 + sw.maxR * ease;
      const alpha = (1 - p) * 0.9;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = sw.color;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 12;
      ctx.lineWidth = Math.max(1, sw.lineWidth * (1 - p * 0.65));
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return true;
    });

    // 2. Signature Monster Power FX (Laser Beam, Freeze Ring, Lightning, Seismic, UFO Beam!)
    this.powers = this.powers.filter((pw) => {
      const p = (now - pw.startMs) / pw.durationMs;
      if (p < 0) return true;
      if (p >= 1) return false;
      this.drawMonsterPowerFx(ctx, pw, p);
      return true;
    });

    // 3. Kaiju Claw Slash FX
    this.slashes = this.slashes.filter((sl) => {
      const p = (now - sl.startMs) / sl.durationMs;
      if (p < 0) return true;
      if (p >= 1) return false;
      const fade = 1 - p;
      const sweep = Math.min(1, p * 3.4);
      ctx.save();
      ctx.translate(sl.x, sl.y);
      ctx.scale(sl.scale, sl.scale);
      ctx.globalAlpha = fade;
      ctx.lineCap = "round";
      for (const off of [-22, 0, 22]) {
        const x0 = -54 + off;
        const y0 = -34;
        const x1 = x0 + 108 * sweep;
        const y1 = y0 + 68 * sweep;
        ctx.strokeStyle = "#ef4444";
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 16;
        ctx.lineWidth = 8.5 * fade;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();

        ctx.strokeStyle = "#fef08a";
        ctx.shadowBlur = 0;
        ctx.lineWidth = 3 * fade;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      ctx.restore();
      return true;
    });

    // 4. Floating 16-bit Heart Icons (Healing!)
    this.hearts = this.hearts.filter((h) => {
      const p = (now - h.startMs) / h.durationMs;
      if (p < 0) return true;
      if (p >= 1) return false;
      const alpha = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;
      const easeY = 1 - (1 - p) * (1 - p);
      const hx = h.x + h.driftX * p + Math.sin(p * Math.PI * 3) * 5;
      const hy = h.y - h.riseY * easeY;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.shadowColor = "rgba(52, 211, 153, 0.8)";
      ctx.shadowBlur = 10;
      drawKotIcon2D(ctx, hx, hy, h.size, "heart");
      ctx.restore();
      return true;
    });

    // 5. Flying 16-bit Green Energy Cubes!
    this.energyCubes = this.energyCubes.filter((ec) => {
      const p = (now - ec.startMs) / ec.durationMs;
      if (p < 0) return true;
      if (p >= 1) {
        if (!ec.arrived) {
          ec.arrived = true;
          for (let i = 0; i < 6; i++) {
            const ang = (Math.PI * 2 * i) / 6;
            particles.spawn({
              x: ec.x1,
              y: ec.y1,
              vx: Math.cos(ang) * 44,
              vy: Math.sin(ang) * 44,
              radius: 2,
              color: "#a3e635",
              life: 0.35,
              maxLife: 0.35,
            });
          }
        }
        return false;
      }
      const u = 1 - p;
      const x = u * u * ec.x0 + 2 * u * p * ec.cx + p * p * ec.x1;
      const y = u * u * ec.y0 + 2 * u * p * ec.cy + p * p * ec.y1;
      const sc = 0.8 + Math.sin(p * Math.PI) * 0.45;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p * Math.PI * 2.2);
      drawKotEnergyCube2D(ctx, 0, 0, Math.round(ec.size * sc));
      ctx.restore();
      return true;
    });

    // 6. Crisp Floating Combat Numbers & Banners
    this.banners = this.banners.filter((bn) => {
      const p = (now - bn.startMs) / bn.durationMs;
      if (p < 0) return true;
      if (p >= 1) return false;
      const alpha = p < 0.14 ? p / 0.14 : p > 0.72 ? (1 - p) / 0.28 : 1;
      const rise = p * 30;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `900 ${bn.size}px ${fonts.sans}`;
      ctx.lineJoin = "round";
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = "rgba(2, 6, 23, 0.94)";
      ctx.strokeText(bn.text, bn.x, bn.y - rise);
      ctx.fillStyle = bn.color;
      ctx.fillText(bn.text, bn.x, bn.y - rise);
      ctx.restore();
      return true;
    });
  }

  private drawMonsterPowerFx(
    ctx: CanvasRenderingContext2D,
    pw: PowerFx,
    p: number
  ) {
    const fade = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, fade));

    switch (pw.monsterId) {
      case "meka_dragon": {
        // Nuclear Breath: Blazing crimson-orange-yellow horizontal laser beam from Meka Dragon to opponent!
        const reach = Math.min(1, p * 3.5);
        const ex = pw.fromX + (pw.toX - pw.fromX) * reach;
        const ey = pw.fromY + (pw.toY - pw.fromY) * reach;
        const beamW = (18 + Math.sin(p * Math.PI * 12) * 5) * fade;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#ef4444";
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 24;
        ctx.lineWidth = beamW * 1.65;
        ctx.beginPath();
        ctx.moveTo(pw.fromX, pw.fromY);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        ctx.strokeStyle = "#fb923c";
        ctx.lineWidth = beamW;
        ctx.beginPath();
        ctx.moveTo(pw.fromX, pw.fromY);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        ctx.strokeStyle = "#fef9c3";
        ctx.shadowBlur = 0;
        ctx.lineWidth = beamW * 0.42;
        ctx.beginPath();
        ctx.moveTo(pw.fromX, pw.fromY);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // Blazing impact fireball at tip
        const rad = (18 + 26 * Math.sin(p * Math.PI)) * fade;
        const grad = ctx.createRadialGradient(ex, ey, 2, ex, ey, Math.max(4, rad));
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.4, "#fde047");
        grad.addColorStop(1, "rgba(239, 68, 68, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ex, ey, Math.max(4, rad), 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case "space_penguin": {
        // Freeze Ray: Translucent cyan frost ring + spinning 6-pointed ice crystals!
        const r = 24 + p * 84;
        ctx.strokeStyle = "#38bdf8";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 16;
        ctx.lineWidth = 4 * fade;
        ctx.beginPath();
        ctx.arc(pw.fromX, pw.fromY, r, 0, Math.PI * 2);
        ctx.stroke();

        for (let i = 0; i < 8; i++) {
          const ang = (Math.PI * 2 * i) / 8 + p * 1.4;
          const cx = pw.fromX + Math.cos(ang) * r;
          const cy = pw.fromY + Math.sin(ang) * r;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(ang + p * 3);
          ctx.strokeStyle = "#e0f2fe";
          ctx.lineWidth = 2;
          for (let k = 0; k < 3; k++) {
            const ka = (Math.PI * k) / 3;
            ctx.beginPath();
            ctx.moveTo(-8 * Math.cos(ka), -8 * Math.sin(ka));
            ctx.lineTo(8 * Math.cos(ka), 8 * Math.sin(ka));
            ctx.stroke();
          }
          ctx.restore();
        }
        break;
      }

      case "cyber_kitty": {
        // Energy Storm: Crackling neon pink & cyan zigzag lightning bolts arcing around Cyber Kitty!
        const jitter = Math.floor(p * 14);
        for (let b = 0; b < 5; b++) {
          const ang = (Math.PI * 2 * b) / 5 + jitter * 0.7;
          ctx.strokeStyle = b % 2 === 0 ? "#ec4899" : "#38bdf8";
          ctx.shadowColor = ctx.strokeStyle;
          ctx.shadowBlur = 14;
          ctx.lineWidth = 3 * fade;
          ctx.beginPath();
          let lx = pw.fromX;
          let ly = pw.fromY;
          ctx.moveTo(lx, ly);
          for (let seg = 1; seg <= 4; seg++) {
            const d = seg * 22;
            const perp = ((seg + b + jitter) % 2 === 0 ? 1 : -1) * 11;
            lx = pw.fromX + Math.cos(ang) * d - Math.sin(ang) * perp;
            ly = pw.fromY + Math.sin(ang) * d + Math.cos(ang) * perp;
            ctx.lineTo(lx, ly);
          }
          ctx.stroke();
        }
        break;
      }

      case "gigazaur": {
        // Blockbuster: Triple concentric emerald seismic shockwaves pulsing across the Tokyo board!
        for (let ring = 0; ring < 3; ring++) {
          const rp = Math.max(0, Math.min(1, p * 1.3 - ring * 0.16));
          if (rp <= 0 || rp >= 1) continue;
          ctx.strokeStyle = ring === 0 ? "#22c55e" : "#86efac";
          ctx.shadowColor = "#22c55e";
          ctx.shadowBlur = 14;
          ctx.lineWidth = (5 - ring) * (1 - rp);
          ctx.beginPath();
          ctx.arc(pw.boardCenterX, pw.boardCenterY, 20 + rp * 185, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
      }

      case "the_king": {
        // Territorial: Heavy golden-amber ground-slam impact ring + radial crack rays!
        const r = 18 + p * 92;
        ctx.strokeStyle = "#f59e0b";
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 18;
        ctx.lineWidth = 5.5 * fade;
        ctx.beginPath();
        ctx.arc(pw.fromX, pw.fromY, r, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 6; i++) {
          const ang = (Math.PI * 2 * i) / 6 + 0.3;
          ctx.strokeStyle = "#fef08a";
          ctx.lineWidth = 2.5 * fade;
          ctx.beginPath();
          ctx.moveTo(pw.fromX + Math.cos(ang) * 16, pw.fromY + Math.sin(ang) * 16);
          ctx.lineTo(pw.fromX + Math.cos(ang) * r, pw.fromY + Math.sin(ang) * r);
          ctx.stroke();
        }
        break;
      }

      case "alienoid": {
        // Cosmic Tech: Translucent lime UFO tractor beam descending over Alienoid!
        const beamTopY = pw.fromY - 120;
        const beamBotY = pw.fromY + 60;
        const grad = ctx.createLinearGradient(0, beamTopY, 0, beamBotY);
        grad.addColorStop(0, "rgba(132, 204, 22, 0.05)");
        grad.addColorStop(0.5, "rgba(163, 230, 53, 0.42)");
        grad.addColorStop(1, "rgba(132, 204, 22, 0.08)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(pw.fromX - 24, beamTopY);
        ctx.lineTo(pw.fromX + 24, beamTopY);
        ctx.lineTo(pw.fromX + 68, beamBotY);
        ctx.lineTo(pw.fromX - 68, beamBotY);
        ctx.closePath();
        ctx.fill();

        for (let i = 0; i < 3; i++) {
          const ry = beamBotY - ((p * 1.8 + i * 0.33) % 1) * (beamBotY - beamTopY);
          const halfW = 24 + ((ry - beamTopY) / (beamBotY - beamTopY)) * 40;
          ctx.strokeStyle = "#bef264";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(pw.fromX, ry, halfW, 7, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
      }
    }

    ctx.restore();
  }
}
