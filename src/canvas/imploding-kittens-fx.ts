import { drawRoundedRect, getCanvasFontFamilies, lerp } from "@/canvas/engine";
import { drawIkCard2D } from "@/canvas/imploding-kittens-art";
import {
  IK_CARD_META,
  type IkCard,
  type IkLastAnim,
} from "@/cartridges/imploding-kittens";

export interface IkTableAnchors {
  width: number;
  height: number;
  drawPile: { x: number; y: number; w: number; h: number };
  discardPile: { x: number; y: number; w: number; h: number };
  center: { x: number; y: number };
  seatPositions: Map<number, { x: number; y: number }>;
}

export type IkParticleKind =
  | "fire"
  | "smoke"
  | "spark"
  | "star"
  | "vortex"
  | "confetti"
  | "heart";

export interface IkParticle {
  kind: IkParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX?: number;
  targetY?: number;
  radius: number;
  growRate: number;
  color: string;
  rot: number;
  vrot: number;
  life: number;
  maxLife: number;
}

export interface FlyingIkCardFx {
  card: IkCard | null;
  fromX: number;
  fromY: number;
  ctrlX: number;
  ctrlY: number;
  toX: number;
  toY: number;
  w: number;
  h: number;
  startMs: number;
  durationMs: number;
  startRot: number;
  endRot: number;
  peakScale: number;
  flip3D?: boolean;
  glowColor?: string;
}

export interface ShockwaveRingFx {
  x: number;
  y: number;
  startR: number;
  endR: number;
  color: string;
  lineWidth: number;
  startMs: number;
  durationMs: number;
}

export interface BeamFx {
  kind: "lightning" | "laser" | "tether";
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  startMs: number;
  durationMs: number;
  seed: number;
}

export interface ComicStampFx {
  title: string;
  subtitle?: string;
  color: string;
  bgHex: string;
  x: number;
  y: number;
  tiltRad: number;
  startMs: number;
  durationMs: number;
}

export interface ScreenFlashFx {
  color: string;
  maxAlpha: number;
  startMs: number;
  durationMs: number;
}

export interface ShuffleRiffleFx {
  startMs: number;
  durationMs: number;
}

export interface ReverseSwirlFx {
  direction: 1 | -1;
  startMs: number;
  durationMs: number;
}

export interface FavorCatPawFx {
  actorSeatNo: number;
  fromBottom: boolean;
  anchorX: number;
  baseY: number;
  peakY: number;
  startMs: number;
  retractStartMs: number | null;
  lastHeartMs: number;
}

export class ImplodingKittensFxEngine {
  particles: IkParticle[] = [];
  flyingCards: FlyingIkCardFx[] = [];
  rings: ShockwaveRingFx[] = [];
  beams: BeamFx[] = [];
  activeFavorPaw: FavorCatPawFx | null = null;
  stamps: ComicStampFx[] = [];
  flashes: ScreenFlashFx[] = [];
  shuffleRiffle: ShuffleRiffleFx | null = null;
  reverseSwirl: ReverseSwirlFx | null = null;
  discardPopUntilMs = 0;
  discardPopStartMs = 0;
  shake = { endMs: 0, durationMs: 1, intensity: 0 };

  triggerShake(nowMs: number, intensity: number, durationMs: number) {
    if (intensity >= this.shake.intensity || nowMs >= this.shake.endMs) {
      this.shake = { endMs: nowMs + durationMs, durationMs, intensity };
    }
  }

  getShakeOffset(nowMs: number): { dx: number; dy: number } {
    if (nowMs >= this.shake.endMs) return { dx: 0, dy: 0 };
    const rem = Math.max(0, (this.shake.endMs - nowMs) / this.shake.durationMs);
    const mag = this.shake.intensity * rem * rem;
    return {
      dx: (Math.random() - 0.5) * 2 * mag,
      dy: (Math.random() - 0.5) * 2 * mag,
    };
  }

  getDiscardPopScale(nowMs: number): number {
    if (nowMs >= this.discardPopUntilMs || this.discardPopUntilMs <= this.discardPopStartMs) {
      return 1;
    }
    const p = (nowMs - this.discardPopStartMs) / (this.discardPopUntilMs - this.discardPopStartMs);
    return 1 + Math.sin(p * Math.PI) * 0.16;
  }

  triggerDiscardPop(nowMs: number, delayMs = 260) {
    this.discardPopStartMs = nowMs + delayMs;
    this.discardPopUntilMs = nowMs + delayMs + 280;
  }

  spawnFlash(nowMs: number, color: string, maxAlpha = 0.42, durationMs = 380) {
    this.flashes.push({ color, maxAlpha, startMs: nowMs, durationMs });
  }

  spawnRing(
    nowMs: number,
    x: number,
    y: number,
    startR: number,
    endR: number,
    color: string,
    lineWidth = 4,
    durationMs = 560
  ) {
    this.rings.push({
      x,
      y,
      startR,
      endR,
      color,
      lineWidth,
      startMs: nowMs,
      durationMs,
    });
  }

  spawnStamp(
    nowMs: number,
    title: string,
    color: string,
    x: number,
    y: number,
    options?: {
      subtitle?: string;
      bgHex?: string;
      tiltRad?: number;
      durationMs?: number;
    }
  ) {
    // Keep at most 2 active stamps so center never gets cluttered
    if (this.stamps.length >= 2) {
      this.stamps.shift();
    }
    this.stamps.push({
      title,
      subtitle: options?.subtitle,
      color,
      bgHex: options?.bgHex ?? "rgba(9, 13, 22, 0.94)",
      x,
      y,
      tiltRad: options?.tiltRad ?? (Math.random() - 0.5) * 0.14,
      startMs: nowMs,
      durationMs: options?.durationMs ?? 1550,
    });
  }

  spawnFlyingCard(fx: FlyingIkCardFx) {
    this.flyingCards.push(fx);
  }

  spawnBeam(
    nowMs: number,
    kind: "lightning" | "laser" | "tether",
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    durationMs = 640
  ) {
    this.beams.push({
      kind,
      fromX,
      fromY,
      toX,
      toY,
      color,
      startMs: nowMs,
      durationMs,
      seed: Math.floor(Math.random() * 10000),
    });
  }

  syncActiveFavorPaw(
    favorActorSeatNo: number | null,
    anchors: IkTableAnchors,
    viewerSeatNo: number | null,
    nowMs: number
  ) {
    if (favorActorSeatNo === null) {
      if (this.activeFavorPaw && this.activeFavorPaw.retractStartMs === null) {
        this.activeFavorPaw.retractStartMs = nowMs;
      }
      return;
    }

    const isViewerBegging = favorActorSeatNo === viewerSeatNo;
    const dockTopY =
      anchors.height -
      Math.max(176, Math.min(220, Math.round(anchors.height * 0.28))) -
      6;
    const actorPos =
      anchors.seatPositions.get(favorActorSeatNo) ?? anchors.center;
    const anchorX = isViewerBegging
      ? anchors.center.x
      : Math.max(120, Math.min(anchors.width - 120, actorPos.x));
    const baseY = isViewerBegging ? dockTopY + 6 : 122;
    // Short stubby forearm: palm sits ~94px out from the dock/panel edge!
    const peakY = isViewerBegging ? baseY - 94 : baseY + 94;

    if (
      !this.activeFavorPaw ||
      this.activeFavorPaw.actorSeatNo !== favorActorSeatNo ||
      this.activeFavorPaw.retractStartMs !== null
    ) {
      this.activeFavorPaw = {
        actorSeatNo: favorActorSeatNo,
        fromBottom: isViewerBegging,
        anchorX,
        baseY,
        peakY,
        startMs: nowMs,
        retractStartMs: null,
        lastHeartMs: nowMs,
      };
      this.spawnHearts(anchorX, peakY - (isViewerBegging ? 16 : -16), 10);
    } else {
      // Keep position responsive on window resize and emit periodic pleading hearts!
      this.activeFavorPaw.fromBottom = isViewerBegging;
      this.activeFavorPaw.anchorX = anchorX;
      this.activeFavorPaw.baseY = baseY;
      this.activeFavorPaw.peakY = peakY;
      if (nowMs - this.activeFavorPaw.lastHeartMs > 680) {
        this.activeFavorPaw.lastHeartMs = nowMs;
        this.spawnHearts(anchorX, peakY - (isViewerBegging ? 18 : -18), 3);
      }
    }
  }

  spawnHearts(x: number, y: number, count = 12) {
    const colors = ["#f472b6", "#fb7185", "#fda4af", "#fbcfe8"];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        kind: "heart",
        x: x + (Math.random() - 0.5) * 64,
        y: y + (Math.random() - 0.5) * 32,
        vx: (Math.random() - 0.5) * 42,
        vy: -40 - Math.random() * 65,
        radius: 5 + Math.random() * 4.5,
        growRate: 0.6,
        color: colors[i % colors.length],
        rot: (Math.random() - 0.5) * 0.4,
        vrot: (Math.random() - 0.5) * 1.4,
        life: 0.9 + Math.random() * 0.7,
        maxLife: 1.6,
      });
    }
  }

  spawnExplosion(x: number, y: number, count = 64) {
    const firePalette = ["#fef08a", "#fb923c", "#ef4444", "#dc2626", "#ffffff"];
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 45 + Math.random() * 240;
      const isSmoke = i % 4 === 0;
      const isSpark = i % 3 === 0;
      this.particles.push({
        kind: isSmoke ? "smoke" : isSpark ? "spark" : "fire",
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - (isSmoke ? 25 : 0),
        radius: isSmoke ? 9 + Math.random() * 10 : isSpark ? 2.5 + Math.random() * 2.5 : 5 + Math.random() * 7,
        growRate: isSmoke ? 22 : isSpark ? -2 : 8,
        color: isSmoke
          ? "rgba(71, 85, 105, 0.78)"
          : firePalette[i % firePalette.length],
        rot: ang,
        vrot: (Math.random() - 0.5) * 6,
        life: isSmoke ? 0.85 + Math.random() * 0.5 : 0.45 + Math.random() * 0.5,
        maxLife: isSmoke ? 1.35 : 0.95,
      });
    }
  }

  spawnBlackHoleImplosion(x: number, y: number, count = 65) {
    const palette = ["#f0abfc", "#c084fc", "#a855f7", "#6b21a8", "#ffffff"];
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const dist = 110 + Math.random() * 145;
      const px = x + Math.cos(ang) * dist;
      const py = y + Math.sin(ang) * dist;
      this.particles.push({
        kind: "vortex",
        x: px,
        y: py,
        vx: -Math.sin(ang) * 165,
        vy: Math.cos(ang) * 165,
        targetX: x,
        targetY: y,
        radius: 3 + Math.random() * 4.5,
        growRate: -1.5,
        color: palette[i % palette.length],
        rot: ang,
        vrot: 6,
        life: 0.7 + Math.random() * 0.45,
        maxLife: 1.15,
      });
    }
  }

  spawnSparkles(x: number, y: number, colors: string[], count = 26, speed = 135) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 25 + Math.random() * speed;
      this.particles.push({
        kind: i % 2 === 0 ? "star" : "spark",
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        radius: 3.5 + Math.random() * 4.5,
        growRate: -1.5,
        color: colors[i % colors.length],
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 8,
        life: 0.48 + Math.random() * 0.42,
        maxLife: 0.9,
      });
    }
  }

  spawnVictoryConfetti(width: number, height: number, count = 16) {
    const colors = [
      "#fde047",
      "#f43f5e",
      "#38bdf8",
      "#4ade80",
      "#c084fc",
      "#fb923c",
    ];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        kind: "confetti",
        x: Math.random() * width,
        y: -12 - Math.random() * 30,
        vx: (Math.random() - 0.5) * 70,
        vy: 75 + Math.random() * 110,
        radius: 5 + Math.random() * 4,
        growRate: 0,
        color: colors[i % colors.length],
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 10,
        life: 2.2 + Math.random() * 1.4,
        maxLife: 3.6,
      });
    }
  }

  /**
   * Central dispatcher translating game engine `lastAnim` events into synchronized
   * flying cards, shockwaves, lightning/laser beams, comic stamps, and screen shake!
   */
  triggerFromGameEvent(
    anim: IkLastAnim,
    anchors: IkTableAnchors,
    nowMs: number,
    direction: 1 | -1,
    viewerSeatNo: number | null
  ) {
    const actorPos =
      anchors.seatPositions.get(anim.actorSeatNo) ?? anchors.center;
    const targetPos =
      anim.targetSeatNo !== undefined
        ? anchors.seatPositions.get(anim.targetSeatNo) ?? anchors.center
        : anchors.center;
    const drawCenter = {
      x: anchors.drawPile.x + anchors.drawPile.w * 0.5,
      y: anchors.drawPile.y + anchors.drawPile.h * 0.5,
    };
    const discardCenter = {
      x: anchors.discardPile.x + anchors.discardPile.w * 0.5,
      y: anchors.discardPile.y + anchors.discardPile.h * 0.5,
    };
    const cardW = anchors.discardPile.w;
    const cardH = anchors.discardPile.h;
    const cardType = anim.card?.type;
    const meta = cardType ? IK_CARD_META[cardType] : null;

    switch (anim.kind) {
      case "EXPLODE_DEATH": {
        this.triggerShake(nowMs, 18, 680);
        this.spawnFlash(nowMs, "#fb923c", 0.55, 480);
        this.spawnExplosion(actorPos.x, actorPos.y, 72);
        this.spawnExplosion(anchors.center.x, anchors.center.y, 44);
        this.spawnRing(nowMs, actorPos.x, actorPos.y, 16, 220, "#ef4444", 6, 650);
        this.spawnRing(nowMs + 80, actorPos.x, actorPos.y, 12, 165, "#fde047", 4, 540);
        if (anim.card) {
          this.spawnFlyingCard({
            card: anim.card,
            fromX: drawCenter.x,
            fromY: drawCenter.y,
            ctrlX: anchors.center.x,
            ctrlY: anchors.center.y - 75,
            toX: actorPos.x,
            toY: actorPos.y,
            w: cardW,
            h: cardH,
            startMs: nowMs,
            durationMs: 520,
            startRot: -0.25,
            endRot: 0.14,
            peakScale: 1.45,
            flip3D: true,
            glowColor: "#ef4444",
          });
        }
        this.spawnStamp(
          nowMs,
          "💥 BÙM! MÈO NỔ!",
          "#fca5a5",
          anchors.center.x,
          anchors.center.y - 36,
          {
            subtitle: anim.messageVi ?? "Không có Tháo Ngòi — Đã bay màu!",
            bgHex: "rgba(69, 10, 10, 0.95)",
            durationMs: 2000,
          }
        );
        break;
      }

      case "IMPLODE_DEATH": {
        this.triggerShake(nowMs, 20, 760);
        this.spawnFlash(nowMs, "#a855f7", 0.58, 560);
        this.spawnBlackHoleImplosion(actorPos.x, actorPos.y, 80);
        this.spawnRing(nowMs, actorPos.x, actorPos.y, 240, 8, "#d8b4fe", 6, 680);
        this.spawnRing(nowMs + 110, actorPos.x, actorPos.y, 180, 6, "#a855f7", 4, 560);
        if (anim.card) {
          this.spawnFlyingCard({
            card: anim.card,
            fromX: drawCenter.x,
            fromY: drawCenter.y,
            ctrlX: anchors.center.x,
            ctrlY: anchors.center.y - 70,
            toX: actorPos.x,
            toY: actorPos.y,
            w: cardW,
            h: cardH,
            startMs: nowMs,
            durationMs: 540,
            startRot: 0,
            endRot: Math.PI * 0.5,
            peakScale: 1.42,
            glowColor: "#c084fc",
          });
        }
        this.spawnStamp(
          nowMs,
          "🕳️💀 SẬP HỐ ĐEN!",
          "#e879f9",
          anchors.center.x,
          anchors.center.y - 36,
          {
            subtitle: "Mèo Hố Đen Lật Ngửa — Không thể Defuse!",
            bgHex: "rgba(59, 7, 100, 0.96)",
            durationMs: 2100,
          }
        );
        break;
      }

      case "IMPLODING_FACEUP": {
        this.triggerShake(nowMs, 11, 460);
        this.spawnFlash(nowMs, "#c084fc", 0.35, 420);
        this.spawnBlackHoleImplosion(drawCenter.x, drawCenter.y, 52);
        this.spawnRing(nowMs, drawCenter.x, drawCenter.y, 175, 16, "#e879f9", 4.5, 620);
        this.spawnRing(nowMs + 90, drawCenter.x, drawCenter.y, 20, 170, "#a855f7", 3.5, 580);
        this.spawnStamp(
          nowMs,
          "🕳️😱 MÈO HỐ ĐEN LẬT NGỬA!",
          "#f0abfc",
          anchors.center.x,
          anchors.center.y - 34,
          {
            subtitle: "Cẩn thận! Lần rút kế tiếp sẽ nổ ngay lập tức!",
            bgHex: "rgba(59, 7, 100, 0.94)",
            durationMs: 1950,
          }
        );
        break;
      }

      case "CATOMIC_BOMB": {
        this.triggerShake(nowMs, 16, 650);
        this.spawnFlash(nowMs, "#facc15", 0.48, 480);
        this.spawnExplosion(drawCenter.x, drawCenter.y, 56);
        this.spawnRing(nowMs, drawCenter.x, drawCenter.y, 14, 210, "#fde047", 5, 680);
        this.spawnRing(nowMs + 100, drawCenter.x, drawCenter.y, 10, 160, "#ef4444", 4, 580);
        this.shuffleRiffle = { startMs: nowMs, durationMs: 750 };
        this.spawnStamp(
          nowMs,
          "☢️ BOM NGUYÊN TỬ!",
          "#fde047",
          anchors.center.x,
          anchors.center.y - 36,
          {
            subtitle: "Tất cả Mèo Nổ đã bị đẩy lên ĐỈNH bộ bài!",
            bgHex: "rgba(66, 32, 6, 0.95)",
            durationMs: 2050,
          }
        );
        break;
      }

      case "DEFUSE": {
        this.triggerShake(nowMs, 7, 300);
        this.spawnFlash(nowMs, "#22c55e", 0.3, 360);
        this.spawnBeam(
          nowMs,
          "laser",
          actorPos.x,
          actorPos.y,
          drawCenter.x,
          drawCenter.y,
          "#4ade80",
          680
        );
        this.spawnSparkles(
          actorPos.x,
          actorPos.y,
          ["#4ade80", "#86efac", "#fde047", "#ffffff"],
          36,
          155
        );
        this.spawnRing(nowMs, actorPos.x, actorPos.y, 14, 150, "#4ade80", 4.5, 580);
        if (anim.card) {
          this.spawnFlyingCard({
            card: anim.card,
            fromX: actorPos.x,
            fromY: actorPos.y,
            ctrlX: (actorPos.x + discardCenter.x) * 0.5,
            ctrlY: Math.min(actorPos.y, discardCenter.y) - 65,
            toX: discardCenter.x,
            toY: discardCenter.y,
            w: cardW,
            h: cardH,
            startMs: nowMs,
            durationMs: 440,
            startRot: -0.18,
            endRot: 0.05,
            peakScale: 1.24,
            glowColor: "#22c55e",
          });
          this.triggerDiscardPop(nowMs, 400);
        }
        this.spawnStamp(
          nowMs,
          "🛠️ ĐÃ THÁO NGÒI!",
          "#4ade80",
          anchors.center.x,
          anchors.center.y - 32,
          {
            subtitle: "Hóa giải Mèo Nổ thành công!",
            bgHex: "rgba(5, 46, 22, 0.94)",
            durationMs: 1650,
          }
        );
        break;
      }

      case "NOPE":
      case "YUP": {
        const isYup = anim.kind === "YUP";
        const accent = isYup ? "#fde047" : "#f87171";
        this.triggerShake(nowMs, isYup ? 11 : 9, 340);
        this.spawnFlash(nowMs, isYup ? "#eab308" : "#dc2626", 0.34, 340);
        this.spawnRing(nowMs, discardCenter.x, discardCenter.y, 16, 175, accent, 5, 540);
        this.spawnSparkles(
          discardCenter.x,
          discardCenter.y,
          isYup ? ["#fde047", "#fb923c", "#ffffff"] : ["#ef4444", "#fca5a5", "#ffffff"],
          32,
          170
        );
        if (anim.card) {
          this.spawnFlyingCard({
            card: anim.card,
            fromX: actorPos.x,
            fromY: actorPos.y,
            ctrlX: anchors.center.x,
            ctrlY: anchors.center.y - 80,
            toX: discardCenter.x,
            toY: discardCenter.y,
            w: cardW,
            h: cardH,
            startMs: nowMs,
            durationMs: 360,
            startRot: -0.3,
            endRot: (Math.random() - 0.5) * 0.14,
            peakScale: 1.32,
            glowColor: accent,
          });
          this.triggerDiscardPop(nowMs, 330);
        }
        this.spawnStamp(
          nowMs,
          isYup ? "🔥 YUP! PHẢN ĐÒN!" : "🚫 NOPE! HỦY BỎ!",
          accent,
          anchors.center.x,
          anchors.center.y - 32,
          {
            subtitle: isYup ? "Chặn ngược Nope — Hành động tiếp tục!" : "Vô hiệu hóa lá vừa đánh!",
            bgHex: isYup ? "rgba(66, 32, 6, 0.95)" : "rgba(69, 10, 10, 0.95)",
            tiltRad: isYup ? -0.07 : 0.08,
            durationMs: 1550,
          }
        );
        break;
      }

      case "REVERSE": {
        this.reverseSwirl = { direction, startMs: nowMs, durationMs: 880 };
        this.spawnRing(nowMs, anchors.center.x, anchors.center.y, 24, 155, "#a78bfa", 4, 600);
        this.spawnSparkles(
          anchors.center.x,
          anchors.center.y,
          ["#c084fc", "#818cf8", "#ffffff"],
          28,
          150
        );
        this.spawnStamp(
          nowMs,
          direction === 1 ? "↻ ĐẢO CHIỀU KIM ĐỒNG HỒ!" : "↺ ĐẢO NGƯỢC CHIỀU!",
          "#c4b5fd",
          anchors.center.x,
          anchors.center.y - 34,
          {
            bgHex: "rgba(46, 16, 101, 0.94)",
            durationMs: 1450,
          }
        );
        break;
      }

      case "COMBO_STEAL": {
        this.spawnBeam(
          nowMs,
          "tether",
          targetPos.x,
          targetPos.y,
          actorPos.x,
          actorPos.y,
          "#38bdf8",
          680
        );
        this.spawnFlyingCard({
          card: null,
          fromX: targetPos.x,
          fromY: targetPos.y,
          ctrlX: (targetPos.x + actorPos.x) * 0.5,
          ctrlY: Math.min(targetPos.y, actorPos.y) - 65,
          toX: actorPos.x,
          toY: actorPos.y,
          w: Math.round(cardW * 0.72),
          h: Math.round(cardH * 0.72),
          startMs: nowMs,
          durationMs: 520,
          startRot: -0.25,
          endRot: 0.25,
          peakScale: 1.15,
          glowColor: "#38bdf8",
        });
        this.spawnSparkles(
          actorPos.x,
          actorPos.y,
          ["#38bdf8", "#fde047", "#ffffff"],
          24,
          130
        );
        this.spawnStamp(
          nowMs,
          "🐾 CƯỚP BÀI THÀNH CÔNG!",
          "#38bdf8",
          anchors.center.x,
          anchors.center.y - 30,
          {
            bgHex: "rgba(12, 74, 110, 0.94)",
            durationMs: 1350,
          }
        );
        break;
      }

      case "DRAW_SAFE": {
        const isViewer = anim.actorSeatNo === viewerSeatNo;
        this.spawnFlyingCard({
          card: null,
          fromX: drawCenter.x,
          fromY: drawCenter.y,
          ctrlX: (drawCenter.x + actorPos.x) * 0.5 + (isViewer ? -24 : 24),
          ctrlY: Math.min(drawCenter.y, actorPos.y) - 42,
          toX: actorPos.x,
          toY: actorPos.y,
          w: Math.round(cardW * 0.78),
          h: Math.round(cardH * 0.78),
          startMs: nowMs,
          durationMs: 390,
          startRot: 0,
          endRot: isViewer ? 0.04 : -0.14,
          peakScale: 1.12,
          glowColor: "#fde047",
        });
        this.spawnSparkles(
          drawCenter.x,
          drawCenter.y,
          ["#fde047", "#38bdf8", "#ffffff"],
          12,
          85
        );
        break;
      }

      case "PLAY_CARD": {
        const glowColor = meta?.colorHex ?? "#fde047";
        if (anim.card) {
          this.spawnFlyingCard({
            card: anim.card,
            fromX: actorPos.x,
            fromY: actorPos.y,
            ctrlX: (actorPos.x + discardCenter.x) * 0.5,
            ctrlY: Math.min(actorPos.y, discardCenter.y) - 64,
            toX: discardCenter.x,
            toY: discardCenter.y,
            w: cardW,
            h: cardH,
            startMs: nowMs,
            durationMs: 380,
            startRot: -0.18,
            endRot: (Math.random() - 0.5) * 0.12,
            peakScale: 1.22,
            glowColor,
          });
          this.triggerDiscardPop(nowMs, 350);
        }
        this.spawnRing(
          nowMs + 280,
          discardCenter.x,
          discardCenter.y,
          14,
          110,
          glowColor,
          3.2,
          420
        );

        // Card-specific signature VFX!
        if (cardType === "shuffle") {
          this.shuffleRiffle = { startMs: nowMs + 140, durationMs: 780 };
          this.spawnSparkles(
            drawCenter.x,
            drawCenter.y,
            ["#f59e0b", "#fde047", "#ffffff"],
            24,
            135
          );
          this.spawnStamp(
            nowMs,
            "🔀 TRÁO BÀI!",
            "#fdba74",
            anchors.center.x,
            anchors.center.y - 32,
            { bgHex: "rgba(67, 20, 7, 0.92)", durationMs: 1200 }
          );
        } else if (
          cardType === "attack" ||
          cardType === "targeted_attack" ||
          cardType === "attack_of_the_dead" ||
          cardType === "personal_attack"
        ) {
          this.triggerShake(nowMs, 8, 280);
          const boltTarget =
            anim.targetSeatNo !== undefined ? targetPos : anchors.center;
          this.spawnBeam(
            nowMs,
            "lightning",
            actorPos.x,
            actorPos.y,
            boltTarget.x,
            boltTarget.y,
            "#fb923c",
            580
          );
          this.spawnSparkles(
            boltTarget.x,
            boltTarget.y,
            ["#f97316", "#fde047", "#ef4444"],
            28,
            150
          );
          this.spawnStamp(
            nowMs,
            cardType === "attack_of_the_dead"
              ? "🧟 TẤN CÔNG 3X!"
              : cardType === "personal_attack"
                ? "🪃 TỰ ĐÁNH 3X!"
                : "⚡ TẤN CÔNG 2X!",
            "#fb923c",
            anchors.center.x,
            anchors.center.y - 32,
            { bgHex: "rgba(67, 20, 7, 0.94)", durationMs: 1350 }
          );
        } else if (
          cardType === "see_future_3" ||
          cardType === "see_future_5" ||
          cardType === "alter_future_3" ||
          cardType === "alter_future_5" ||
          cardType === "share_future_3" ||
          cardType === "clairvoyance"
        ) {
          this.spawnRing(nowMs, drawCenter.x, drawCenter.y, 12, 145, "#f472b6", 3.5, 580);
          this.spawnRing(nowMs + 140, drawCenter.x, drawCenter.y, 12, 115, "#e879f9", 2.5, 520);
          this.spawnSparkles(
            drawCenter.x,
            drawCenter.y,
            ["#f472b6", "#e879f9", "#ffffff"],
            22,
            110
          );
          this.spawnStamp(
            nowMs,
            cardType.startsWith("alter_")
              ? "🪄 ĐỔI TƯƠNG LAI!"
              : "🔮 XEM TƯƠNG LAI!",
            "#f472b6",
            anchors.center.x,
            anchors.center.y - 32,
            { bgHex: "rgba(80, 7, 36, 0.93)", durationMs: 1250 }
          );
        } else if (cardType === "skip" || cardType === "super_skip") {
          this.spawnSparkles(
            actorPos.x,
            actorPos.y,
            ["#38bdf8", "#60a5fa", "#ffffff"],
            22,
            125
          );
          this.spawnStamp(
            nowMs,
            cardType === "super_skip" ? "🚀 SIÊU BỎ LƯỢT!" : "👟 BỎ LƯỢT!",
            "#60a5fa",
            anchors.center.x,
            anchors.center.y - 30,
            { bgHex: "rgba(23, 37, 84, 0.93)", durationMs: 1150 }
          );
        } else if (cardType === "favor") {
          this.spawnBeam(
            nowMs,
            "tether",
            actorPos.x,
            actorPos.y,
            targetPos.x,
            targetPos.y,
            "#f472b6",
            720
          );
          this.syncActiveFavorPaw(anim.actorSeatNo, anchors, viewerSeatNo, nowMs);
        } else {
          this.spawnSparkles(
            discardCenter.x,
            discardCenter.y,
            [glowColor, "#fde047", "#ffffff"],
            16,
            95
          );
        }
        break;
      }
    }
  }

  update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      if (p.kind === "vortex" && p.targetX !== undefined && p.targetY !== undefined) {
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.max(8, Math.hypot(dx, dy));
        const pull = 390;
        p.vx += (dx / dist) * pull * dt;
        p.vy += (dy / dist) * pull * dt;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      } else if (p.kind === "confetti") {
        p.vx += Math.sin(p.life * 8 + p.rot) * 40 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      } else if (p.kind === "heart") {
        p.x += (p.vx + Math.sin(p.life * 6 + p.rot) * 18) * dt;
        p.y += p.vy * dt;
        p.vy *= 0.985;
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94;
        p.vy *= 0.94;
        if (p.kind === "spark") {
          p.vy += 120 * dt;
        }
      }
      p.radius = Math.max(0.8, p.radius + p.growRate * dt);
      p.rot += p.vrot * dt;
    }
  }

  drawShuffleRiffleOverlay(
    ctx: CanvasRenderingContext2D,
    drawPile: { x: number; y: number; w: number; h: number },
    nowMs: number
  ): boolean {
    if (!this.shuffleRiffle) return false;
    const p = (nowMs - this.shuffleRiffle.startMs) / this.shuffleRiffle.durationMs;
    if (p < 0) return false;
    if (p >= 1) {
      this.shuffleRiffle = null;
      return false;
    }
    // 3 rapid riffle pulses fanning left & right halves of the deck!
    const wave = Math.sin(p * Math.PI * 6);
    const envelope = Math.sin(p * Math.PI);
    const spread = Math.abs(wave) * 34 * envelope;

    for (let i = 0; i < 4; i++) {
      const dir = i % 2 === 0 ? -1 : 1;
      const ox = dir * spread * (0.55 + i * 0.14);
      const oy = Math.sin(p * Math.PI * 6 + i) * 7 * envelope;
      const rot = dir * 0.14 * Math.abs(wave) * envelope;
      ctx.save();
      ctx.translate(
        drawPile.x + drawPile.w * 0.5 + ox,
        drawPile.y + drawPile.h * 0.5 + oy
      );
      ctx.rotate(rot);
      drawIkCard2D(
        ctx,
        -drawPile.w * 0.5,
        -drawPile.h * 0.5,
        drawPile.w,
        drawPile.h,
        null,
        { now: nowMs }
      );
      ctx.restore();
    }
    return true;
  }

  drawReverseSwirl(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    nowMs: number
  ) {
    if (!this.reverseSwirl) return;
    const p = (nowMs - this.reverseSwirl.startMs) / this.reverseSwirl.durationMs;
    if (p < 0) return;
    if (p >= 1) {
      this.reverseSwirl = null;
      return;
    }
    const alpha = Math.sin(p * Math.PI);
    const rot = p * Math.PI * 3.5 * this.reverseSwirl.direction;
    const r = 46 + p * 74;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha * 0.9;
    ctx.strokeStyle = "#c084fc";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";

    for (let a = 0; a < 2; a++) {
      ctx.beginPath();
      ctx.arc(0, 0, r, a * Math.PI, a * Math.PI + Math.PI * 0.65);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawAllOverlays(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    nowMs: number
  ) {
    const fonts = getCanvasFontFamilies();

    // 1. Shockwave rings
    this.rings = this.rings.filter((r) => {
      const p = (nowMs - r.startMs) / r.durationMs;
      if (p < 0) return true;
      if (p >= 1) return false;
      const ease = 1 - Math.pow(1 - p, 3);
      const curR = Math.max(2, lerp(r.startR, r.endR, ease));
      ctx.save();
      ctx.globalAlpha = (1 - p) * 0.88;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = Math.max(1, r.lineWidth * (1 - p * 0.65));
      ctx.beginPath();
      ctx.arc(r.x, r.y, curR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return true;
    });

    // 2. Beams (Lightning / Laser / Theft Tether)
    this.beams = this.beams.filter((b) => {
      const p = (nowMs - b.startMs) / b.durationMs;
      if (p < 0) return true;
      if (p >= 1) return false;
      const alpha = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85;

      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      if (b.kind === "lightning") {
        const segs = 9;
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i <= segs; i++) {
          const t = i / segs;
          let x = lerp(b.fromX, b.toX, t);
          let y = lerp(b.fromY, b.toY, t);
          if (i > 0 && i < segs) {
            const jitter = Math.sin(nowMs * 0.06 + i * 3.7 + b.seed) * 18;
            x += jitter;
            y += Math.cos(nowMs * 0.05 + i * 2.9 + b.seed) * 14;
          }
          pts.push({ x, y });
        }
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        pts.forEach((pt, idx) =>
          idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)
        );
        ctx.stroke();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.4;
        ctx.stroke();
      } else if (b.kind === "laser") {
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(b.fromX, b.fromY);
        ctx.lineTo(b.toX, b.toY);
        ctx.stroke();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Glowing laser dot sweeping along beam
        const dotX = lerp(b.fromX, b.toX, Math.min(1, p * 1.3));
        const dotY = lerp(b.fromY, b.toY, Math.min(1, p * 1.3));
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(dotX, dotY, 7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Curved theft tether with flowing orbs
        const midX = (b.fromX + b.toX) * 0.5;
        const midY = Math.min(b.fromY, b.toY) - 55;
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 3.5;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -nowMs * 0.08;
        ctx.beginPath();
        ctx.moveTo(b.fromX, b.fromY);
        ctx.quadraticCurveTo(midX, midY, b.toX, b.toY);
        ctx.stroke();
      }
      ctx.restore();
      return true;
    });

    // 3. Flying cards with 3D flip + scale punch + glow halo
    this.flyingCards = this.flyingCards.filter((fc) => {
      const p = (nowMs - fc.startMs) / fc.durationMs;
      if (p < 0) return true;
      if (p >= 1) return false;
      const ease = 1 - Math.pow(1 - p, 3);
      const inv = 1 - ease;
      const x =
        inv * inv * fc.fromX + 2 * inv * ease * fc.ctrlX + ease * ease * fc.toX;
      const y =
        inv * inv * fc.fromY + 2 * inv * ease * fc.ctrlY + ease * ease * fc.toY;
      const rot = lerp(fc.startRot, fc.endRot, ease);
      const scale = 1 + Math.sin(ease * Math.PI) * (fc.peakScale - 1);

      let flipScaleX = 1;
      let renderCard: IkCard | null = fc.card;
      if (fc.flip3D) {
        const cosVal = Math.cos(ease * Math.PI);
        flipScaleX = Math.max(0.06, Math.abs(cosVal));
        if (ease < 0.5) {
          renderCard = null; // card back during first half of flip
        }
      }

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(scale * flipScaleX, scale);

      if (fc.glowColor) {
        ctx.shadowColor = fc.glowColor;
        ctx.shadowBlur = 18;
      }

      drawIkCard2D(ctx, -fc.w * 0.5, -fc.h * 0.5, fc.w, fc.h, renderCard, {
        now: nowMs,
      });
      ctx.restore();
      return true;
    });

    // 3b. Persistent Favor Begging Cat Paw (Tay mèo ngắn, chỉ ẩn khi hoàn thành lá FAVOR!)
    if (this.activeFavorPaw) {
      const fp = this.activeFavorPaw;
      const enterDur = 340;
      const retractDur = 340;

      let reach = 1;
      let begDipY = 0;
      let cupScaleX = 1;
      let cupScaleY = 1;
      let alpha = 1;
      let isBegging = false;

      if (fp.retractStartMs !== null) {
        const u = (nowMs - fp.retractStartMs) / retractDur;
        if (u >= 1) {
          this.activeFavorPaw = null;
        } else {
          const cl = Math.max(0, u);
          reach = 1 - cl * cl;
          alpha = 1 - cl;
        }
      } else {
        const enterU = (nowMs - fp.startMs) / enterDur;
        if (enterU < 1) {
          const u = Math.max(0, enterU);
          const c1 = 1.70158;
          const c3 = c1 + 1;
          reach = 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
        } else {
          isBegging = true;
          const t = (nowMs - fp.startMs - enterDur) / 1000;
          const wave = Math.sin(t * Math.PI * 3.2);
          begDipY = -Math.abs(Math.sin(t * Math.PI * 1.6)) * 11;
          cupScaleX = 1 + wave * 0.032;
          cupScaleY = 1 - wave * 0.032;
        }
      }

      if (this.activeFavorPaw) {
        const dirY = fp.fromBottom ? 1 : -1;
        const pawCenterY =
          lerp(fp.baseY + dirY * 56, fp.peakY, reach) + dirY * begDipY;
        const armHeight = Math.max(18, Math.abs(fp.baseY - pawCenterY));

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

        // Clip cleanly at the dock/panel edge so the short arm emerges seamlessly
        ctx.beginPath();
        if (fp.fromBottom) {
          ctx.rect(0, 0, width, fp.baseY);
        } else {
          ctx.rect(0, fp.baseY, width, height - fp.baseY);
        }
        ctx.clip();

        ctx.translate(fp.anchorX, pawCenterY);
        if (!fp.fromBottom) {
          ctx.scale(1, -1);
        }
        ctx.scale(cupScaleX, cupScaleY);

        ctx.shadowColor = "rgba(244, 114, 182, 0.45)";
        ctx.shadowBlur = 20;

        // 1. Short, stubby, chubby vertical furry forearm
        const wristHalfW = 48;
        const baseHalfW = 52;
        const armLen = armHeight + 28;

        ctx.fillStyle = "#f8fafc";
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.moveTo(-wristHalfW, 34);
        ctx.lineTo(-baseHalfW, 34 + armLen);
        ctx.lineTo(baseHalfW, 34 + armLen);
        ctx.lineTo(wristHalfW, 34);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.stroke();

        // Side shading & tabby stripes on the short wrist
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(wristHalfW - 14, 38, 12, armLen);
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        for (let sy = 56; sy < Math.min(108, 30 + armLen); sy += 22) {
          ctx.beginPath();
          ctx.moveTo(-wristHalfW + 6, sy);
          ctx.lineTo(-wristHalfW + 24, sy + 3);
          ctx.moveTo(wristHalfW - 6, sy);
          ctx.lineTo(wristHalfW - 24, sy + 3);
          ctx.stroke();
        }

        // 2. Giant wide rounded cat paw palm with 4 scalloped furry toes across the top!
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 4.4;
        ctx.beginPath();
        ctx.moveTo(-48, 42);
        ctx.bezierCurveTo(-76, 34, -84, 4, -76, -24);
        ctx.bezierCurveTo(-74, -50, -44, -56, -34, -36);
        ctx.bezierCurveTo(-26, -58, -4, -60, 0, -38);
        ctx.bezierCurveTo(4, -60, 26, -58, 34, -36);
        ctx.bezierCurveTo(44, -56, 74, -50, 76, -24);
        ctx.bezierCurveTo(84, 4, 76, 34, 48, 42);
        ctx.quadraticCurveTo(0, 50, -48, 42);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Soft bottom cup shadow inside the palm
        ctx.fillStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.ellipse(0, 30, 54, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        // Subtle upturned palm-cup crease arc right under the 4 toes
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(-64, -14);
        ctx.quadraticCurveTo(0, -24, 64, -14);
        ctx.stroke();

        // 3. Four plump rosy-pink oval toe beans along the 4 top toes!
        const toeBeans = [
          { x: -54, y: -30, rx: 11.5, ry: 8.5, rot: -0.22 },
          { x: -18, y: -38, rx: 12, ry: 9, rot: -0.06 },
          { x: 18, y: -38, rx: 12, ry: 9, rot: 0.06 },
          { x: 54, y: -30, rx: 11.5, ry: 8.5, rot: 0.22 },
        ];
        for (const tb of toeBeans) {
          ctx.fillStyle = "#fb7185";
          ctx.strokeStyle = "#be185d";
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.ellipse(tb.x, tb.y, tb.rx, tb.ry, tb.rot, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffe4e6";
          ctx.beginPath();
          ctx.ellipse(tb.x - 3, tb.y - 2.5, 4, 2.2, tb.rot, 0, Math.PI * 2);
          ctx.fill();
        }

        // 4. BIG rosy-pink HEART-SHAPED main palm pad right in the center!
        ctx.save();
        ctx.translate(0, 8);
        const hs = 25;
        ctx.fillStyle = "#f472b6";
        ctx.strokeStyle = "#be185d";
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(0, hs * 0.85);
        ctx.bezierCurveTo(-hs * 1.35, hs * 0.1, -hs * 1.25, -hs * 0.95, 0, -hs * 0.28);
        ctx.bezierCurveTo(hs * 1.25, -hs * 0.95, hs * 1.35, hs * 0.1, 0, hs * 0.85);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#fbcfe8";
        ctx.beginPath();
        ctx.ellipse(-hs * 0.42, -hs * 0.25, 6.5, 3.6, -0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 5. Continuous golden sparkle lines while begging
        if (isBegging) {
          const pulse = Math.abs(Math.sin(((nowMs - fp.startMs) / 310) * Math.PI));
          ctx.strokeStyle = `rgba(253, 224, 71, ${0.45 + pulse * 0.55})`;
          ctx.lineWidth = 3.2;
          ctx.lineCap = "round";
          for (let m = -1; m <= 1; m++) {
            const mx = m * 36;
            const my = -64 - pulse * 7;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(mx + m * 6, my - 11);
            ctx.stroke();
          }
        }

        ctx.restore();

        // 6. Cute comic pleading bubble right above/below the begging cat paw
        if (reach > 0.65) {
          const bText = "🐾 Cho xin 1 lá đi mà! 🥺";
          ctx.font = `900 12.5px ${fonts.sans}`;
          const bw = ctx.measureText(bText).width + 26;
          const bh = 28;
          const bx = Math.max(
            bw * 0.5 + 10,
            Math.min(width - bw * 0.5 - 10, fp.anchorX)
          );
          const by = fp.fromBottom
            ? Math.max(26, pawCenterY - 82)
            : Math.min(height - 26, pawCenterY + 82);

          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
          drawRoundedRect(ctx, bx - bw * 0.5, by - bh * 0.5, bw, bh, 12);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
          ctx.strokeStyle = "#0f172a";
          ctx.lineWidth = 2.4;
          ctx.stroke();

          ctx.fillStyle = "#0f172a";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(bText, bx, by);
          ctx.restore();
        }
      }
    }

    // 4. Particles (fire, smoke, spark, star, vortex, confetti)
    for (const p of this.particles) {
      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;

      if (p.kind === "confetti") {
        ctx.fillRect(-p.radius, -p.radius * 0.45, p.radius * 2, p.radius * 0.9);
      } else if (p.kind === "heart") {
        const s = p.radius;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.75);
        ctx.bezierCurveTo(-s * 1.15, s * 0.1, -s * 1.15, -s * 0.85, 0, -s * 0.25);
        ctx.bezierCurveTo(s * 1.15, -s * 0.85, s * 1.15, s * 0.1, 0, s * 0.75);
        ctx.closePath();
        ctx.fill();
      } else if (p.kind === "star") {
        ctx.beginPath();
        for (let s = 0; s < 4; s++) {
          const a = (s * Math.PI) / 2;
          ctx.lineTo(Math.cos(a) * p.radius * 1.4, Math.sin(a) * p.radius * 1.4);
          ctx.lineTo(
            Math.cos(a + Math.PI / 4) * p.radius * 0.45,
            Math.sin(a + Math.PI / 4) * p.radius * 0.45
          );
        }
        ctx.closePath();
        ctx.fill();
      } else if (p.kind === "spark") {
        ctx.fillRect(-p.radius * 1.4, -p.radius * 0.4, p.radius * 2.8, p.radius * 0.8);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 5. Screen flash overlays
    this.flashes = this.flashes.filter((f) => {
      const p = (nowMs - f.startMs) / f.durationMs;
      if (p < 0) return true;
      if (p >= 1) return false;
      const alpha = f.maxAlpha * Math.pow(1 - p, 2);
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = f.color;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      return true;
    });

    // 6. Elastic Comic Impact Stamps
    this.stamps = this.stamps.filter((st) => {
      const p = (nowMs - st.startMs) / st.durationMs;
      if (p < 0) return true;
      if (p >= 1) return false;

      // Elastic slam-in during first 18%, steady hold, smooth rise & fade in last 28%
      let scale = 1;
      if (p < 0.14) {
        const u = p / 0.14;
        scale = lerp(2.15, 0.92, u * u);
      } else if (p < 0.24) {
        const u = (p - 0.14) / 0.1;
        scale = lerp(0.92, 1.0, u);
      }
      const alpha = p > 0.72 ? (1 - p) / 0.28 : 1;
      const floatY = p > 0.72 ? -((p - 0.72) / 0.28) * 26 : 0;

      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.translate(st.x, st.y + floatY);
      ctx.rotate(st.tiltRad);
      ctx.scale(scale, scale);

      ctx.font = `900 17px ${fonts.sans}`;
      const titleW = ctx.measureText(st.title).width;
      ctx.font = `700 10.5px ${fonts.sans}`;
      const subW = st.subtitle ? ctx.measureText(st.subtitle).width : 0;
      const boxW = Math.max(titleW, subW) + 34;
      const boxH = st.subtitle ? 52 : 36;

      ctx.shadowColor = st.color;
      ctx.shadowBlur = 18;
      drawRoundedRect(ctx, -boxW * 0.5, -boxH * 0.5, boxW, boxH, 12);
      ctx.fillStyle = st.bgHex;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = st.color;
      ctx.lineWidth = 2.4;
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = st.color;
      ctx.font = `900 16px ${fonts.sans}`;
      ctx.fillText(st.title, 0, st.subtitle ? -8 : 0);

      if (st.subtitle) {
        ctx.fillStyle = "#f8fafc";
        ctx.font = `700 10.5px ${fonts.sans}`;
        ctx.fillText(st.subtitle, 0, 12);
      }

      ctx.restore();
      return true;
    });
  }
}
