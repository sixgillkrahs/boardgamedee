"use client";

import React, { useEffect, useRef } from "react";
import {
  drawRoundedRect,
  findHitRegionAtPoint,
  getCanvasFontFamilies,
  ParticleSystem,
  type HitRegion,
} from "@/canvas/engine";
import {
  drawDmdCard2D,
  drawDmdPirateBackground2D,
  getDmdCardPixelAtlas,
} from "@/canvas/dead-mans-draw-art";
import { DmdFxEngine } from "@/canvas/dead-mans-draw-fx";
import {
  DMD_SUITS,
  type DmdCard,
  type DmdCommand,
  type DmdPlayerView,
  type DmdSuit,
} from "@/cartridges/dead-mans-draw";
import type { LobbySeatItem } from "@/components/werewolf-canvas";

interface FloatingBannerFx {
  text: string;
  color: string;
  x: number;
  y: number;
  startMs: number;
  durationMs: number;
}

interface DeadMansDrawCanvasProps {
  mode: "lobby" | "match";
  lobbySeats: LobbySeatItem[];
  viewerSeatNo: number | null;
  playerView: DmdPlayerView | null;
  onDispatchCommand: (cmd: DmdCommand) => void;
}

export function DeadMansDrawCanvas({
  mode,
  lobbySeats,
  viewerSeatNo,
  playerView,
  onDispatchCommand,
}: DeadMansDrawCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hitRegionsRef = useRef<HitRegion[]>([]);
  const hoveredIdRef = useRef<string | null>(null);
  const particlesRef = useRef<ParticleSystem>(new ParticleSystem());
  const fxRef = useRef<DmdFxEngine>(new DmdFxEngine());
  const bannersRef = useRef<FloatingBannerFx[]>([]);
  const inFlightCardRef = useRef<{ cardId: string; untilMs: number } | null>(
    null
  );
  const pointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const oppSlideRef = useRef<number>(0);
  const mySlideRef = useRef<number>(0);
  const lastAnimIdRef = useRef<number>(0);
  const layoutAnchorsRef = useRef<{
    deckX: number;
    deckY: number;
    discardX: number;
    discardY: number;
    playLeft: number;
    stepX: number;
    playLeftX: number;
    playCenterX: number;
    playCenterY: number;
    cardW: number;
    cardH: number;
    seatPos: Record<number, { x: number; y: number }>;
  }>({
    deckX: 160,
    deckY: 260,
    discardX: 740,
    discardY: 260,
    playLeft: 214,
    stepX: 60,
    playLeftX: 250,
    playCenterX: 450,
    playCenterY: 260,
    cardW: 72,
    cardH: 102,
    seatPos: {},
  });

  const stateRef = useRef({
    mode,
    lobbySeats,
    viewerSeatNo,
    playerView,
    onDispatchCommand,
  });

  useEffect(() => {
    stateRef.current = {
      mode,
      lobbySeats,
      viewerSeatNo,
      playerView,
      onDispatchCommand,
    };

    // Trigger realistic 60fps 2D physics & suit FX whenever a new match action arrives
    const anim = playerView?.lastAnim;
    if (mode === "match" && anim && anim.id !== lastAnimIdRef.current) {
      lastAnimIdRef.current = anim.id;
      const now = performance.now();
      const anchors = layoutAnchorsRef.current;
      const fx = fxRef.current;

      // Compute the EXACT target slot center from the NEW playerView.playArea (never stale previous-frame slot!)
      const foundIdx =
        anim.card && playerView?.playArea
          ? playerView.playArea.findIndex((c) => c.id === anim.card?.id)
          : -1;
      const landedIdx =
        foundIdx >= 0
          ? foundIdx
          : Math.max(0, (playerView?.playArea.length ?? 1) - 1);
      const landedX =
        anchors.playLeft + landedIdx * anchors.stepX + anchors.cardW / 2;
      const landedY = anchors.playCenterY;

      const actorPt = anchors.seatPos[anim.actorSeatNo] ?? {
        x: landedX,
        y: landedY + 140,
      };
      const targetPt =
        anim.targetSeatNo !== undefined
          ? anchors.seatPos[anim.targetSeatNo] ?? {
              x: landedX,
              y: landedY - 140,
            }
          : actorPt;

      // Helper: trigger suit-specific signature realistic effect when a card lands in Play Area
      const triggerLandedSuitFx = (card: DmdCard | undefined, landDelayMs: number) => {
        if (!card) return;
        const lx = landedX;
        const ly = landedY;
        const t = now + landDelayMs;

        if (card.suit === "Anchor") {
          fx.triggerShake(t, 4.5, 190);
          fx.spawnWaterSplash(lx, ly + 22, 22, "#7dd3fc");
          fx.specials.push({
            kind: "anchor_drop",
            fromX: lx,
            fromY: ly,
            toX: lx,
            toY: ly,
            extraX: anchors.playLeftX,
            startMs: t,
            durationMs: 760,
          });
          bannersRef.current.push({
            text: "⚓ MỎ NEO BẢO VỆ!",
            color: "#7dd3fc",
            x: lx,
            y: ly - 58,
            startMs: t,
            durationMs: 1200,
          });
        } else if (card.suit === "Mermaid") {
          fx.spawnPearlBubbles(lx, ly, 22);
          fx.spawnWaterSplash(lx, ly + 18, 16, "#5eead4");
          fx.specials.push({
            kind: "mermaid_wave",
            fromX: lx,
            fromY: ly,
            toX: lx,
            toY: ly,
            startMs: t,
            durationMs: 820,
          });
        } else if (card.suit === "Chest" || card.suit === "Key") {
          fx.spawnParchmentDust(lx, ly, 18, "#fde047");
          if (playerView?.hasKeyAndChestInPlay) {
            fx.specials.push({
              kind: "chest_key_unlock",
              fromX: lx,
              fromY: ly,
              toX: lx,
              toY: ly,
              startMs: t,
              durationMs: 700,
            });
          }
        } else if (card.suit === "Kraken") {
          fx.triggerShake(t, 9, 420);
          fx.spawnWaterSplash(lx, ly + 16, 30, "#fb7185");
          fx.spawnWaterSplash(anchors.deckX, anchors.deckY + 14, 22, "#67e8f9");
          fx.specials.push({
            kind: "kraken_tentacles",
            fromX: anchors.deckX,
            fromY: anchors.deckY,
            toX: lx,
            toY: ly,
            startMs: t,
            durationMs: 1100,
          });
          bannersRef.current.push({
            text: `🐙 KRAKEN! RÚT TIẾP ${anim.count ?? 2} LÁ!`,
            color: "#fda4af",
            x: lx,
            y: ly - 64,
            startMs: t,
            durationMs: 1500,
          });
        } else if (card.suit === "Oracle") {
          fx.spawnParchmentDust(anchors.deckX, anchors.deckY, 22, "#d8b4fe");
          fx.specials.push({
            kind: "oracle_vision",
            fromX: lx,
            fromY: ly,
            toX: anchors.deckX,
            toY: anchors.deckY,
            startMs: t,
            durationMs: 950,
          });
          bannersRef.current.push({
            text: "🔮 TIÊN TRI SOI BÀI!",
            color: "#e9d5ff",
            x: anchors.deckX + 36,
            y: anchors.deckY - 68,
            startMs: t,
            durationMs: 1250,
          });
        } else {
          fx.spawnParchmentDust(lx, ly, 10, "#fde68a");
        }
      };

      if (anim.kind === "DRAW" || anim.kind === "ORACLE" || anim.kind === "KRAKEN") {
        // True 3D flip from Draw Pile card back -> exact new Play Area slot!
        if (anim.card) {
          inFlightCardRef.current = {
            cardId: anim.card.id,
            untilMs: now + 390,
          };
        }
        fx.flyingCards.push({
          card: anim.card ?? null,
          fromX: anchors.deckX,
          fromY: anchors.deckY,
          toX: landedX,
          toY: landedY,
          startMs: now,
          durationMs: 400,
          w: anchors.cardW,
          h: anchors.cardH,
          flipFromBack: true,
          arcHeight: 46,
        });
        triggerLandedSuitFx(anim.card, 260);
      } else if (anim.kind === "BANK" || anim.kind === "CHEST_KEY") {
        const count = Math.min(anim.count ?? 3, 7);
        for (let i = 0; i < count; i++) {
          fx.flyingCards.push({
            card: null,
            fromX: anchors.playLeft + i * anchors.stepX + anchors.cardW / 2,
            fromY: landedY,
            toX: actorPt.x,
            toY: actorPt.y,
            startMs: now + i * 55,
            durationMs: 420,
            w: 58,
            h: 82,
            arcHeight: 34,
          });
        }
        // Real gravity-arcing spinning gold pirate doubloons!
        fx.spawnGoldCoins(
          anchors.playCenterX,
          landedY,
          actorPt.x,
          actorPt.y,
          anim.kind === "CHEST_KEY" ? 28 : 14
        );
        if (anim.kind === "CHEST_KEY") {
          fx.triggerShake(now, 5, 240);
          fx.specials.push({
            kind: "chest_key_unlock",
            fromX: anchors.discardX,
            fromY: anchors.discardY,
            toX: actorPt.x,
            toY: actorPt.y,
            startMs: now,
            durationMs: 920,
          });
          fx.spawnGoldCoins(
            anchors.discardX,
            anchors.discardY,
            actorPt.x,
            actorPt.y,
            18
          );
        }
        bannersRef.current.push({
          text:
            anim.kind === "CHEST_KEY"
              ? `🗝️🧰 COMBO MỞ RƯƠNG! +${anim.bonusCount ?? 0} LÁ THƯỞNG!`
              : `💰 THU ${anim.count ?? 1} LÁ VÀO KHO!`,
          color: "#fde047",
          x: actorPt.x,
          y: actorPt.y - 38,
          startMs: now,
          durationMs: 1550,
        });
      } else if (anim.kind === "BUST") {
        const bustIdx = Math.min(9, Math.max(0, (anim.count ?? 1) - 1));
        const bustX = anchors.playLeft + bustIdx * anchors.stepX + anchors.cardW / 2;
        fx.triggerShake(now, 12, 460);
        fx.spawnFireExplosion(bustX, landedY, 34);
        fx.specials.push({
          kind: "bust_vignette",
          fromX: bustX,
          fromY: landedY,
          toX: bustX,
          toY: landedY,
          startMs: now,
          durationMs: 900,
        });
        // Tumbling shattered bust card flying into Discard Pile
        fx.flyingCards.push({
          card: anim.card ?? null,
          fromX: bustX,
          fromY: landedY,
          toX: anchors.discardX,
          toY: anchors.discardY,
          startMs: now + 60,
          durationMs: 560,
          w: anchors.cardW,
          h: anchors.cardH,
          tumble: true,
          arcHeight: 62,
        });
        if ((anim.savedCount ?? 0) > 0) {
          // Anchor rescued earlier cards with golden-cyan shield sweep into vault!
          fx.spawnWaterSplash(anchors.playLeftX + 20, landedY, 20, "#38bdf8");
          fx.spawnGoldCoins(
            anchors.playLeftX + 24,
            landedY,
            actorPt.x,
            actorPt.y,
            12
          );
        }
        bannersRef.current.push({
          text:
            (anim.savedCount ?? 0) > 0
              ? `💥 CHÁY BÀI! ⚓ MỎ NEO CỨU ${anim.savedCount} LÁ!`
              : "💥 CHÁY BÀI! MẤT TRẮNG!",
          color: (anim.savedCount ?? 0) > 0 ? "#7dd3fc" : "#fca5a5",
          x: bustX,
          y: landedY - 58,
          startMs: now,
          durationMs: 1700,
        });
      } else if (anim.kind === "CANNON") {
        // Black-powder smoke cloud at launch + arcing heavy iron cannonball + impact detonation!
        fx.spawnSmokeCloud(landedX, landedY, 12, 42, false);
        fx.specials.push({
          kind: "cannon_shot",
          fromX: landedX,
          fromY: landedY,
          toX: targetPt.x,
          toY: targetPt.y,
          startMs: now,
          durationMs: 820,
        });
        // Destroyed opponent card blasts tumbling into Discard Pile right after cannonball hits!
        fx.flyingCards.push({
          card: anim.card ?? null,
          fromX: targetPt.x,
          fromY: targetPt.y,
          toX: anchors.discardX,
          toY: anchors.discardY,
          startMs: now + 390,
          durationMs: 520,
          w: 62,
          h: 88,
          tumble: true,
          arcHeight: 56,
        });
        bannersRef.current.push({
          text: "💣 BÙM! ĐẠI BÁC PHÁ KHO!",
          color: "#fdba74",
          x: targetPt.x,
          y: targetPt.y + 34,
          startMs: now + 350,
          durationMs: 1400,
        });
      } else if (anim.kind === "SWORD") {
        // Gleaming curved steel cutlass slash across opponent vault + stolen card arcs to exact slot!
        if (anim.card) {
          inFlightCardRef.current = {
            cardId: anim.card.id,
            untilMs: now + 540,
          };
        }
        fx.specials.push({
          kind: "sword_slash",
          fromX: landedX,
          fromY: landedY,
          toX: targetPt.x,
          toY: targetPt.y,
          startMs: now,
          durationMs: 580,
        });
        fx.flyingCards.push({
          card: anim.card ?? null,
          fromX: targetPt.x,
          fromY: targetPt.y,
          toX: landedX,
          toY: landedY,
          startMs: now + 130,
          durationMs: 420,
          w: anchors.cardW,
          h: anchors.cardH,
          arcHeight: 44,
        });
        triggerLandedSuitFx(anim.card, 480);
        bannersRef.current.push({
          text: "⚔️ KIẾM CƯỚP KHO BÁU!",
          color: "#93c5fd",
          x: targetPt.x,
          y: targetPt.y + 30,
          startMs: now + 80,
          durationMs: 1250,
        });
      } else if (anim.kind === "HOOK") {
        // Iron chain & grappling hook shoots into player's vault, clinks, and reels card to exact slot!
        if (anim.card) {
          inFlightCardRef.current = {
            cardId: anim.card.id,
            untilMs: now + 640,
          };
        }
        fx.specials.push({
          kind: "hook_grapple",
          fromX: landedX,
          fromY: landedY,
          toX: actorPt.x,
          toY: actorPt.y,
          startMs: now,
          durationMs: 680,
        });
        fx.flyingCards.push({
          card: anim.card ?? null,
          fromX: actorPt.x,
          fromY: actorPt.y,
          toX: landedX,
          toY: landedY,
          startMs: now + 240,
          durationMs: 410,
          w: anchors.cardW,
          h: anchors.cardH,
          arcHeight: 20,
        });
        triggerLandedSuitFx(anim.card, 620);
        bannersRef.current.push({
          text: "🪝 MÓC SẮT KÉO BÀI!",
          color: "#e2e8f0",
          x: landedX,
          y: landedY - 58,
          startMs: now + 220,
          durationMs: 1250,
        });
      } else if (anim.kind === "MAP") {
        // Glowing red dotted treasure map trail from Discard Pile -> exact new Play Area slot!
        if (anim.card) {
          inFlightCardRef.current = {
            cardId: anim.card.id,
            untilMs: now + 540,
          };
        }
        fx.spawnParchmentDust(anchors.discardX, anchors.discardY, 18, "#fde68a");
        fx.specials.push({
          kind: "map_trail",
          fromX: anchors.discardX,
          fromY: anchors.discardY,
          toX: landedX,
          toY: landedY,
          startMs: now,
          durationMs: 780,
        });
        fx.flyingCards.push({
          card: anim.card ?? null,
          fromX: anchors.discardX,
          fromY: anchors.discardY,
          toX: landedX,
          toY: landedY,
          startMs: now + 110,
          durationMs: 440,
          w: anchors.cardW,
          h: anchors.cardH,
          arcHeight: 48,
        });
        triggerLandedSuitFx(anim.card, 500);
        bannersRef.current.push({
          text: "🗺️ ĐÀO KHO TỪ MỘ BÀI!",
          color: "#fde68a",
          x: landedX,
          y: landedY - 58,
          startMs: now + 100,
          durationMs: 1250,
        });
      }
    }
  }, [mode, lobbySeats, viewerSeatNo, playerView, onDispatchCommand]);

  useEffect(() => {
    // Pre-warm sprite atlas
    getDmdCardPixelAtlas();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(320, Math.floor(rect.width * dpr));
      canvas.height = Math.max(400, Math.floor(rect.height * dpr));
    };

    resize();
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    const renderFrame = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const fonts = getCanvasFontFamilies();

      const {
        mode: curMode,
        lobbySeats: curLobby,
        viewerSeatNo: curViewer,
        playerView: pv,
      } = stateRef.current;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Subtle tactile camera screen-shake on Cannon blasts, Kraken slams, Anchor drops & Busts
      const shakeOff = fxRef.current.getShakeOffset(now);
      if (shakeOff.dx !== 0 || shakeOff.dy !== 0) {
        ctx.translate(shakeOff.dx, shakeOff.dy);
      }

      // 1. Pirate Galleon 16-bit Pixel Background
      drawDmdPirateBackground2D(ctx, width, height, now);

      const newHitRegions: HitRegion[] = [];

      // Ambient drifting ship-lantern embers
      const particles = particlesRef.current;
      if (Math.random() < 0.22) {
        particles.spawn({
          x: Math.random() * width,
          y: height + 4,
          vx: (Math.random() - 0.5) * 16,
          vy: -14 - Math.random() * 18,
          radius: 1.2 + Math.random() * 1.6,
          color: Math.random() > 0.35 ? "#fbbf24" : "#38bdf8",
          life: 1.8 + Math.random() * 1.2,
          maxLife: 3.0,
        });
      }

      if (curMode === "lobby" || !pv) {
        // --- LOBBY VIEW ---
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fde047";
        ctx.font = `900 ${Math.min(28, Math.round(width * 0.048))}px ${fonts.pixel}`;
        ctx.fillText("🏴‍☠️ DEAD MAN'S DRAW", width * 0.5, height * 0.24);

        ctx.fillStyle = "#cbd5e1";
        ctx.font = `600 12px ${fonts.sans}`;
        ctx.fillText(
          "2–4 Hải Tặc • 60 Lá Kho Báu • Cược May Rủi & Kích Hoạt Chuỗi Kỹ Năng",
          width * 0.5,
          height * 0.3
        );

        // Decorative fanned pirate card backs at table center
        const cardW = Math.min(72, Math.round(width * 0.095));
        const cardH = Math.round(cardW * 1.42);
        const sampleSuits: DmdCard[] = [
          { id: "p1", suit: "Anchor", value: 6 },
          { id: "p2", suit: "Cannon", value: 5 },
          { id: "p3", suit: "Mermaid", value: 9 },
          { id: "p4", suit: "Kraken", value: 7 },
          { id: "p5", suit: "Chest", value: 6 },
        ];
        sampleSuits.forEach((c, i) => {
          const offset = i - 2;
          ctx.save();
          ctx.translate(
            width * 0.5 + offset * (cardW * 0.62),
            height * 0.5 + Math.abs(offset) * 8 + Math.sin(now / 650 + i) * 3
          );
          ctx.rotate(offset * 0.11);
          drawDmdCard2D(ctx, -cardW / 2, -cardH / 2, cardW, cardH, c);
          ctx.restore();
        });

        // Seated players strip at bottom
        const count = Math.max(1, curLobby.length);
        const pillW = Math.min(165, Math.floor((width - 40) / count) - 10);
        const startX = width * 0.5 - ((pillW + 10) * curLobby.length - 10) / 2;
        curLobby.forEach((s, idx) => {
          const px = startX + idx * (pillW + 10);
          const py = height * 0.78;
          drawRoundedRect(ctx, px, py, pillW, 46, 12);
          ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
          ctx.fill();
          ctx.strokeStyle =
            s.seatNo === curViewer ? "#facc15" : "rgba(148, 163, 184, 0.45)";
          ctx.lineWidth = s.seatNo === curViewer ? 2 : 1.2;
          ctx.stroke();

          ctx.fillStyle = "#f8fafc";
          ctx.font = `700 12px ${fonts.sans}`;
          ctx.fillText(s.displayName, px + pillW / 2, py + 17, pillW - 14);
          ctx.fillStyle = s.isBot ? "#38bdf8" : "#fde047";
          ctx.font = `600 10px ${fonts.sans}`;
          ctx.fillText(
            s.isBot ? "🤖 Hải Tặc Bot" : `Ghế #${s.seatNo}`,
            px + pillW / 2,
            py + 34
          );
        });
      } else {
        // --- ACTIVE MATCH TABLETOP ---
        const isMyTurn =
          pv.activeSeatNo === curViewer && pv.step !== "Finished";
        const mySeat =
          pv.seats.find((s) => s.seatNo === curViewer) ?? pv.seats[0];
        const opponents = pv.seats.filter((s) => s.seatNo !== mySeat.seatNo);
        const suitsInPlay = new Set(pv.playArea.map((c) => c.suit));

        const isOppTargetStep =
          isMyTurn &&
          (pv.step === "CannonTargetStep" || pv.step === "SwordTargetStep");
        const isHookStep = isMyTurn && pv.step === "HookPickStep";

        // 1. Vault Tray Dimensions & Smooth 70% Tucked <-> 100% Extended Slide Animation
        const oppH = Math.max(122, Math.min(148, Math.round(height * 0.23)));
        const bottomH = Math.max(134, Math.min(162, Math.round(height * 0.25)));
        const oppVisibleTucked = Math.round(oppH * 0.7);
        const botVisibleTucked = Math.round(bottomH * 0.7);

        const ptr = pointerPosRef.current;
        const hoveringOppZone =
          ptr !== null && ptr.y <= (oppSlideRef.current > 0.3 ? oppH + 14 : oppVisibleTucked + 6);
        const hoveringMyZone =
          ptr !== null &&
          ptr.y >= height - (mySlideRef.current > 0.3 ? bottomH + 14 : botVisibleTucked + 6);

        const targetOppSlide = isOppTargetStep || hoveringOppZone ? 1 : 0;
        const targetMySlide = isHookStep || hoveringMyZone ? 1 : 0;
        const slideRate = Math.min(1, dt * 11);
        oppSlideRef.current += (targetOppSlide - oppSlideRef.current) * slideRate;
        mySlideRef.current += (targetMySlide - mySlideRef.current) * slideRate;

        const oppSlide = oppSlideRef.current;
        const mySlide = mySlideRef.current;

        const oppGap = 10;
        const oppCount = Math.max(1, opponents.length);
        const oppW = Math.min(
          420,
          Math.floor((width - 24 - oppGap * (oppCount - 1)) / oppCount)
        );
        const oppStartX =
          width * 0.5 - (oppW * oppCount + oppGap * (oppCount - 1)) / 2;
        const oppY = Math.round(
          -oppH * 0.3 * (1 - oppSlide) + 8 * oppSlide
        );

        const botX = 12;
        const botW = width - 24;
        const botY = Math.round(
          (height - botVisibleTucked) * (1 - mySlide) +
            (height - bottomH - 8) * mySlide
        );

        // Anchor seat coordinates for Cannon/Sword/Hook/Bank FX
        const seatAnchors: Record<number, { x: number; y: number }> = {};
        opponents.forEach((opp, idx) => {
          const ox = oppStartX + idx * (oppW + oppGap);
          seatAnchors[opp.seatNo] = {
            x: ox + oppW * 0.5,
            y: Math.max(26, oppY + oppH * 0.55),
          };
        });
        seatAnchors[mySeat.seatNo] = {
          x: botX + botW * 0.5,
          y: Math.min(height - 32, botY + bottomH * 0.5),
        };

        // 2. CENTER ARENA: Anchored cleanly between the 70%-tucked top & bottom vaults (NEVER shifts when vaults slide!)
        const arenaTop = oppVisibleTucked + 10;
        const arenaBottom = height - botVisibleTucked - 10;
        const arenaH = Math.max(150, arenaBottom - arenaTop);
        const arenaMidY = arenaTop + arenaH * 0.48;

        const pileW = Math.max(58, Math.min(82, Math.round(width * 0.088)));
        const pileH = Math.round(pileW * 1.42);
        const deckX = Math.max(16, Math.round(width * 0.075));
        const deckY = Math.round(arenaMidY - pileH / 2);
        const discardX = Math.min(
          width - pileW - 16,
          Math.round(width * 0.925 - pileW)
        );
        const discardY = deckY;

        // Fixed left-anchored Play Area geometry so drawn cards NEVER shift horizontally!
        const playLeft = deckX + pileW + 26;
        const playRight = discardX - 20;
        const playAvailW = Math.max(140, playRight - playLeft);
        const playMidX = (playLeft + playRight) / 2;
        const fixedCardH = Math.min(
          Math.round(arenaH * 0.62),
          Math.round(Math.min(84, Math.max(54, width * 0.088)) * 1.42)
        );
        const fixedCardW = Math.max(50, Math.round(fixedCardH / 1.42));
        // Reserve room for up to all 10 suits left-to-right without ever shifting earlier cards
        const fixedStepX = Math.min(
          fixedCardW + 8,
          Math.max(26, Math.floor((playAvailW - fixedCardW) / 9))
        );
        const playCardY = arenaMidY - fixedCardH / 2 - 4;
        const nextSlotIdx = Math.min(9, Math.max(0, pv.playArea.length - 1));
        const activeSlotCenterX =
          playLeft + nextSlotIdx * fixedStepX + fixedCardW / 2;

        layoutAnchorsRef.current = {
          deckX: deckX + pileW / 2,
          deckY: deckY + pileH / 2,
          discardX: discardX + pileW / 2,
          discardY: discardY + pileH / 2,
          playLeft,
          stepX: fixedStepX,
          playLeftX: playLeft + fixedCardW / 2,
          playCenterX: activeSlotCenterX,
          playCenterY: playCardY + fixedCardH / 2,
          cardW: fixedCardW,
          cardH: fixedCardH,
          seatPos: seatAnchors,
        };

        // --- LEFT: DRAW PILE ---
        const canDrawNow =
          isMyTurn &&
          pv.step === "DrawOrBankStep" &&
          pv.drawPileCount > 0;
        const deckRegionId = "dmd-draw-pile";
        const deckHovered = hoveredIdRef.current === deckRegionId;

        if (canDrawNow) {
          newHitRegions.push({
            id: deckRegionId,
            shape: "rect",
            x: deckX - 6,
            y: deckY - 6,
            width: pileW + 12,
            height: pileH + 12,
            cursor: "pointer",
            data: { type: "draw" },
          });
        }

        // Live Kraken pulsing crimson abyssal warning ripples around Draw Pile while cursed!
        if (pv.forcedDrawsRemaining > 0 && pv.drawPileCount > 0) {
          const rCycle = (now % 1100) / 1100;
          ctx.save();
          ctx.strokeStyle = `rgba(244, 63, 94, ${(1 - rCycle) * 0.72})`;
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.arc(
            deckX + pileW / 2,
            deckY + pileH / 2,
            pileW * 0.45 + rCycle * pileW * 0.55,
            0,
            Math.PI * 2
          );
          ctx.stroke();
          ctx.restore();
        }

        const deckLayers = Math.min(3, Math.ceil(pv.drawPileCount / 16));
        for (let l = deckLayers; l >= 1; l--) {
          drawDmdCard2D(
            ctx,
            deckX - l * 2,
            deckY - l * 2,
            pileW,
            pileH,
            null,
            {
              highlighted: l === 1 && canDrawNow && (deckHovered || Math.sin(now / 320) > 0.2),
            }
          );
        }

        if (pv.drawPileCount > 0) {
          // Place remaining card count directly inside the central circular medallion on the card back
          const topX = deckX - 2;
          const topY = deckY - 2;
          const medCx = topX + pileW * 0.5;
          const medCy = topY + pileH * 0.495;
          const medR = Math.max(12, Math.round(pileW * 0.215));

          ctx.save();
          ctx.fillStyle = "rgba(18, 13, 8, 0.94)";
          ctx.beginPath();
          ctx.arc(medCx, medCy, medR, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = canDrawNow && deckHovered ? "#fde047" : "#c89b44";
          ctx.lineWidth = Math.max(1.4, pileW * 0.022);
          ctx.stroke();

          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = `900 ${Math.max(13, Math.round(medR * 1.18))}px ${fonts.mono}`;
          ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
          ctx.fillText(String(pv.drawPileCount), medCx + 1, medCy + 1.5);
          ctx.fillStyle = canDrawNow ? "#fef08a" : "#e5c878";
          ctx.fillText(String(pv.drawPileCount), medCx, medCy + 0.5);
          ctx.restore();
        } else {
          drawRoundedRect(ctx, deckX, deckY, pileW, pileH, 8);
          ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#64748b";
          ctx.font = `800 14px ${fonts.mono}`;
          ctx.fillText("0", deckX + pileW / 2, deckY + pileH / 2);
        }

        // Private ORACLE PEEK floating card peeking right off the top of the Draw Pile (never shifts Play Area!)
        if (pv.oraclePeekedCard) {
          const pw = Math.round(pileW * 0.72);
          const ph = Math.round(pw * 1.42);
          const px = deckX + Math.round(pileW * 0.36);
          const py = deckY - 14 + Math.sin(now / 280) * 2.5;
          const oracleBust = suitsInPlay.has(pv.oraclePeekedCard.suit);

          drawDmdCard2D(ctx, px, py, pw, ph, pv.oraclePeekedCard, {
            highlighted: true,
            bustRisk: oracleBust,
            badgeText: oracleBust ? "🔮 TRÙNG!" : "🔮 AN TOÀN",
          });
        }

        // --- RIGHT: DISCARD PILE ---
        if (pv.discardPileCount > 0) {
          drawDmdCard2D(
            ctx,
            discardX,
            discardY,
            pileW,
            pileH,
            pv.discardTopCard,
            { dimmed: pv.step !== "MapPickStep" }
          );
        } else {
          drawRoundedRect(ctx, discardX, discardY, pileW, pileH, 8);
          ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        drawRoundedRect(
          ctx,
          discardX - 4,
          discardY + pileH + 6,
          pileW + 8,
          20,
          10
        );
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.fill();
        ctx.strokeStyle = "#64748b";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "#cbd5e1";
        ctx.font = `700 10px ${fonts.sans}`;
        ctx.fillText(
          `☠ Mộ bài: ${pv.discardPileCount}`,
          discardX + pileW / 2,
          discardY + pileH + 16
        );

        // --- CENTER: ACTIVE PLAY AREA (fixed left-to-right slots, no center re-shifting) ---
        // Top contextual status banner above Play Area
        const statusText =
          pv.step === "Finished"
            ? pv.winReasonVi ?? "Trận đấu kết thúc!"
            : pv.step === "CannonTargetStep"
              ? isMyTurn
                ? "💣 ĐẠI BÁC: Chạm 1 chồng kho báu ĐỐI THỦ phía trên để bắn hủy!"
                : "💣 Đối thủ đang ngắm bắn Đại Bác..."
              : pv.step === "SwordTargetStep"
                ? isMyTurn
                  ? "⚔️ KIẾM HẢI TẶC: Chạm 1 chồng kho báu ĐỐI THỦ phía trên để cướp!"
                  : "⚔️ Đối thủ đang chọn mục tiêu cướp kho báu..."
                : pv.step === "HookPickStep"
                  ? isMyTurn
                    ? "🪝 MÓC SẮT: Chạm 1 chồng kho báu CỦA BẠN phía dưới để kéo ra bàn!"
                    : "🪝 Đối thủ đang kéo bài từ kho báu..."
                  : pv.step === "MapPickStep"
                    ? isMyTurn
                      ? "🗺️ BẢN ĐỒ: Chọn 1 lá từ Mộ bài để đánh ngay lên bàn!"
                      : "🗺️ Đối thủ đang chọn kho báu từ Mộ bài..."
                    : pv.forcedDrawsRemaining > 0
                      ? `🐙 LỜI NGUYỀN KRAKEN: Bắt buộc rút thêm ${pv.forcedDrawsRemaining} lá!`
                      : pv.hasKeyAndChestInPlay
                        ? "🗝️🧰 COMBO CHÌA KHÓA + RƯƠNG ĐANG SẴN SÀNG! Dừng để nhận bài thưởng!"
                        : isMyTurn
                          ? pv.playArea.length === 0
                            ? "🏴‍☠️ Lượt của bạn! Chạm Bộ bài rút bên trái để lật lá đầu tiên"
                            : "⚖️ Rút tiếp để ăn lớn, hoặc bấm THU KHO BÁU để giữ an toàn!"
                          : `⏳ Đang chờ ${pv.seats.find((s) => s.seatNo === pv.activeSeatNo)?.displayName ?? ""}...`;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle =
          pv.forcedDrawsRemaining > 0
            ? "#fda4af"
            : pv.hasKeyAndChestInPlay
              ? "#fde047"
              : "#e2e8f0";
        ctx.font = `800 ${Math.min(12.5, Math.max(10, Math.round(width * 0.015)))}px ${fonts.sans}`;
        ctx.fillText(statusText, playMidX, arenaTop + 14, playAvailW + 60);

        if (pv.playArea.length === 0) {
          // Empty slot-0 hint frame anchored at playLeft (exact spot where first drawn card lands)
          drawRoundedRect(
            ctx,
            playLeft,
            playCardY,
            fixedCardW,
            fixedCardH,
            10
          );
          ctx.strokeStyle = "rgba(251, 191, 36, 0.26)";
          ctx.lineWidth = 1.6;
          ctx.setLineDash([6, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "rgba(251, 191, 36, 0.5)";
          ctx.font = `700 11px ${fonts.sans}`;
          ctx.fillText(
            "Khu Vực",
            playLeft + fixedCardW / 2,
            playCardY + fixedCardH / 2 - 8
          );
          ctx.fillText(
            "Lật Bài",
            playLeft + fixedCardW / 2,
            playCardY + fixedCardH / 2 + 8
          );
        } else {
          // Live shimmering cyan iron chain linking Anchor to all earlier protected cards
          if (pv.anchorProtectedCount > 0) {
            const chainLeft = playLeft + fixedCardW * 0.5;
            const chainRight =
              playLeft + pv.anchorProtectedCount * fixedStepX + fixedCardW * 0.5;
            const chainY = playCardY + fixedCardH + 7;
            ctx.save();
            ctx.strokeStyle = "rgba(56, 189, 248, 0.55)";
            ctx.lineWidth = 2.5;
            ctx.setLineDash([7, 4]);
            ctx.lineDashOffset = -(now / 35) % 11;
            ctx.beginPath();
            ctx.moveTo(chainLeft, chainY);
            ctx.lineTo(chainRight, chainY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
          }

          const inFlight = inFlightCardRef.current;
          pv.playArea.forEach((card, idx) => {
            // Hide the static copy of the newly arrived card until its 3D flying animation lands on this exact slot!
            if (inFlight && inFlight.cardId === card.id && now < inFlight.untilMs) {
              return;
            }
            const cxCard = playLeft + idx * fixedStepX;
            const isProtected = idx < pv.anchorProtectedCount;
            drawDmdCard2D(ctx, cxCard, playCardY, fixedCardW, fixedCardH, card, {
              protectedByAnchor: isProtected,
              highlighted:
                pv.hasKeyAndChestInPlay &&
                (card.suit === "Key" || card.suit === "Chest"),
            });
          });
        }

        // Quick On-Canvas Action Pill Buttons (Rút tiếp / Thu Kho Báu) when it's your turn!
        if (isMyTurn && pv.step === "DrawOrBankStep") {
          const btnH = 30;
          const btnY = arenaBottom - btnH - 2;
          const drawBtnW = 112;
          const bankBtnW = 136;
          const gapBtns = 10;
          const totalBtnW = pv.canBank
            ? drawBtnW + bankBtnW + gapBtns
            : drawBtnW;
          const bx0 = playMidX - totalBtnW / 2;

          // Draw Button
          if (pv.drawPileCount > 0) {
            const drawId = "dmd-btn-draw";
            const hov = hoveredIdRef.current === drawId;
            newHitRegions.push({
              id: drawId,
              shape: "rect",
              x: bx0,
              y: btnY,
              width: drawBtnW,
              height: btnH,
              cursor: "pointer",
              data: { type: "draw" },
            });
            drawRoundedRect(ctx, bx0, btnY, drawBtnW, btnH, 10);
            ctx.fillStyle = hov ? "#fbbf24" : "#f59e0b";
            ctx.fill();
            ctx.fillStyle = "#0f172a";
            ctx.font = `900 11px ${fonts.sans}`;
            ctx.fillText(
              pv.forcedDrawsRemaining > 0
                ? `🐙 RÚT (${pv.forcedDrawsRemaining})`
                : "🃏 RÚT BÀI",
              bx0 + drawBtnW / 2,
              btnY + btnH / 2
            );
          }

          // Bank Button
          if (pv.canBank) {
            const bankId = "dmd-btn-bank";
            const bankX = bx0 + drawBtnW + gapBtns;
            const hov = hoveredIdRef.current === bankId;
            newHitRegions.push({
              id: bankId,
              shape: "rect",
              x: bankX,
              y: btnY,
              width: bankBtnW,
              height: btnH,
              cursor: "pointer",
              data: { type: "bank" },
            });
            drawRoundedRect(ctx, bankX, btnY, bankBtnW, btnH, 10);
            ctx.fillStyle = hov ? "#34d399" : "#10b981";
            ctx.fill();
            ctx.fillStyle = "#022c22";
            ctx.font = `900 11px ${fonts.sans}`;
            ctx.fillText(
              `💰 THU KHO (${pv.playArea.length})`,
              bankX + bankBtnW / 2,
              btnY + btnH / 2
            );
          }
        }

        // 3. TOP & BOTTOM SLIDE-OUT VAULT TRAYS (Drawn above arena edge so 100% slide-out feels crisp & layered!)
        // Soft spotlight dim only during active Cannon / Sword / Hook targeting so target tray pops out clearly
        if (isOppTargetStep || isHookStep) {
          ctx.save();
          ctx.fillStyle = "rgba(2, 6, 23, 0.42)";
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }

        // --- 3A. TOP OPPONENT VAULT TRAYS (70% tucked normally -> 100% slid out when targeting or hovering!) ---
        opponents.forEach((opp, idx) => {
          const ox = oppStartX + idx * (oppW + oppGap);
          const oy = oppY;
          const isActive =
            opp.seatNo === pv.activeSeatNo && pv.step !== "Finished";
          const isWinner = pv.winnerSeatNos.includes(opp.seatNo);
          const isCannon = pv.step === "CannonTargetStep";
          const isSword = pv.step === "SwordTargetStep";

          ctx.save();
          if (oppSlide > 0.2) {
            ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
            ctx.shadowBlur = 18 * oppSlide;
            ctx.shadowOffsetY = 6 * oppSlide;
          }
          drawRoundedRect(ctx, ox, oy, oppW, oppH, 16);
          ctx.fillStyle = isWinner
            ? "rgba(120, 53, 15, 0.72)"
            : isOppTargetStep
              ? "rgba(22, 18, 16, 0.96)"
              : isActive
                ? "rgba(26, 36, 54, 0.94)"
                : "rgba(15, 23, 42, 0.9)";
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.strokeStyle = isWinner
            ? "#facc15"
            : isOppTargetStep
              ? isCannon
                ? "#f97316"
                : "#38bdf8"
              : isActive
                ? "#fbbf24"
                : "rgba(148, 163, 184, 0.32)";
          ctx.lineWidth = isActive || isWinner || isOppTargetStep ? 2.4 : 1.3;
          ctx.stroke();
          ctx.restore();

          // Opponent Banked Suit Cards (upper body of tray -> 70% visible tucked, 100% visible slid out!)
          const ownedSuits = DMD_SUITS.filter((s) => opp.bank[s].length > 0);
          if (ownedSuits.length === 0) {
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#64748b";
            ctx.font = `600 11px ${fonts.sans}`;
            ctx.fillText(
              "Kho báu đang trống",
              ox + oppW * 0.5,
              oy + oppH * 0.48
            );
          } else {
            const availW = oppW - 22;
            const gap = 6;
            const cardW = Math.max(
              38,
              Math.min(
                62,
                Math.floor((availW - (ownedSuits.length - 1) * gap) / ownedSuits.length)
              )
            );
            const cardH = Math.min(oppH - 38, Math.round(cardW * 1.42));
            const stripW = ownedSuits.length * cardW + (ownedSuits.length - 1) * gap;
            const sx0 = ox + (oppW - stripW) / 2;
            const sy0 = oy + 8;

            ownedSuits.forEach((suit, sIdx) => {
              const stack = opp.bank[suit];
              const topCard = stack[stack.length - 1];
              const cxCard = sx0 + sIdx * (cardW + gap);
              const regionId = `opp-bank-${opp.seatNo}-${suit}`;
              const hovered = hoveredIdRef.current === regionId;
              const willBust = isOppTargetStep && isSword && suitsInPlay.has(suit);

              if (isOppTargetStep) {
                newHitRegions.push({
                  id: regionId,
                  shape: "rect",
                  x: cxCard,
                  y: sy0,
                  width: cardW,
                  height: cardH,
                  cursor: "pointer",
                  data: {
                    type: isCannon ? "cannon-target" : "sword-target",
                    targetSeatNo: opp.seatNo,
                    suit,
                  },
                });
              }

              drawDmdCard2D(
                ctx,
                cxCard,
                sy0 + (hovered && isOppTargetStep ? 5 : 0),
                cardW,
                cardH,
                topCard,
                {
                  highlighted: isOppTargetStep,
                  bustRisk: willBust,
                  stackCount: stack.length,
                  badgeText:
                    isOppTargetStep && hovered
                      ? isCannon
                        ? "💣 BẮN"
                        : willBust
                          ? "💥 TRÙNG!"
                          : "⚔️ CƯỚP"
                      : undefined,
                }
              );
            });
          }

          // Bottom Lip of Opponent Tray (ALWAYS visible even when 70% tucked!): Name + Score + Card Count
          const lipY = oy + oppH - 16;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillStyle = isActive ? "#fde047" : "#f1f5f9";
          ctx.font = `800 12px ${fonts.sans}`;
          ctx.fillText(
            `${isActive ? "▶ " : ""}${opp.displayName}`,
            ox + 14,
            lipY,
            oppW - 120
          );

          ctx.textAlign = "right";
          ctx.fillStyle = "#fde68a";
          ctx.font = `900 12.5px ${fonts.mono}`;
          ctx.fillText(
            `★ ${opp.score} (${opp.totalBankedCards} lá)`,
            ox + oppW - 14,
            lipY
          );
        });

        // --- 3B. BOTTOM VIEWER VAULT TRAY (70% tucked normally -> 100% slid out on HookPickStep or hover!) ---
        const myActive =
          mySeat.seatNo === pv.activeSeatNo && pv.step !== "Finished";
        const myWinner = pv.winnerSeatNos.includes(mySeat.seatNo);

        ctx.save();
        if (mySlide > 0.2) {
          ctx.shadowColor = "rgba(0, 0, 0, 0.68)";
          ctx.shadowBlur = 18 * mySlide;
          ctx.shadowOffsetY = -6 * mySlide;
        }
        drawRoundedRect(ctx, botX, botY, botW, bottomH, 16);
        ctx.fillStyle = myWinner
          ? "rgba(120, 53, 15, 0.72)"
          : isHookStep
            ? "rgba(18, 28, 44, 0.96)"
            : myActive
              ? "rgba(22, 33, 52, 0.94)"
              : "rgba(15, 23, 42, 0.9)";
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = myWinner
          ? "#facc15"
          : isHookStep
            ? "#38bdf8"
            : myActive
              ? "#fbbf24"
              : "rgba(148, 163, 184, 0.32)";
        ctx.lineWidth = myActive || myWinner || isHookStep ? 2.4 : 1.4;
        ctx.stroke();
        ctx.restore();

        // Top Lip of Your Vault (ALWAYS visible even when 70% tucked!)
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = myActive ? "#fde047" : "#f8fafc";
        ctx.font = `800 13px ${fonts.sans}`;
        ctx.fillText(
          isHookStep
            ? `🪝 MÓC SẮT — CHỌN 1 LÁ TRONG KHO BÁU CỦA BẠN`
            : `🏴‍☠️ KHO BÁU CỦA BẠN — ${mySeat.displayName}`,
          botX + 14,
          botY + 19
        );

        ctx.textAlign = "right";
        ctx.fillStyle = "#fde68a";
        ctx.font = `900 14px ${fonts.mono}`;
        ctx.fillText(
          `★ ${mySeat.score} điểm (${mySeat.totalBankedCards} lá)`,
          botX + botW - 14,
          botY + 19
        );

        const myOwned = DMD_SUITS.filter((s) => mySeat.bank[s].length > 0);
        if (myOwned.length === 0) {
          ctx.textAlign = "center";
          ctx.fillStyle = "#64748b";
          ctx.font = `600 12px ${fonts.sans}`;
          ctx.fillText(
            "Chưa có kho báu nào — Hãy rút bài và bấm THU KHO để ghi điểm (tính lá cao nhất mỗi nhóm)!",
            botX + botW * 0.5,
            botY + bottomH * 0.52
          );
        } else {
          const availW = botW - 28;
          const gap = 8;
          const cardW = Math.max(
            44,
            Math.min(
              74,
              Math.floor((availW - (myOwned.length - 1) * gap) / myOwned.length)
            )
          );
          const cardH = Math.min(bottomH - 42, Math.round(cardW * 1.42));
          const stripW = myOwned.length * cardW + (myOwned.length - 1) * gap;
          const sx0 = botX + (botW - stripW) / 2;
          const sy0 = botY + 34;

          myOwned.forEach((suit, idx) => {
            const stack = mySeat.bank[suit];
            const topCard = stack[stack.length - 1];
            const cxCard = sx0 + idx * (cardW + gap);
            const regionId = `my-bank-${suit}`;
            const hov = hoveredIdRef.current === regionId;
            const willBust = isHookStep && suitsInPlay.has(suit);

            if (isHookStep) {
              newHitRegions.push({
                id: regionId,
                shape: "rect",
                x: cxCard,
                y: sy0,
                width: cardW,
                height: cardH,
                cursor: "pointer",
                data: { type: "hook-pick", suit },
              });
            }

            drawDmdCard2D(
              ctx,
              cxCard,
              sy0 - (hov && isHookStep ? 6 : 0),
              cardW,
              cardH,
              topCard,
              {
                highlighted: isHookStep,
                bustRisk: willBust,
                stackCount: stack.length,
                badgeText:
                  isHookStep && hov
                    ? willBust
                      ? "💥 TRÙNG!"
                      : "🪝 KÉO LÊN"
                    : undefined,
              }
            );
          });
        }

        // 4. INTERACTIVE 2D MAP MODAL OVERLAY (MapPickStep)
        if (isMyTurn && pv.step === "MapPickStep" && pv.mapChoices.length > 0) {
          ctx.save();
          ctx.fillStyle = "rgba(2, 6, 23, 0.82)";
          ctx.fillRect(0, 0, width, height);

          const modalW = Math.min(width - 24, 440);
          const modalH = Math.min(height - 28, 290);
          const mx = (width - modalW) / 2;
          const my = (height - modalH) / 2;

          drawRoundedRect(ctx, mx, my, modalW, modalH, 20);
          ctx.fillStyle = "#17120e";
          ctx.fill();
          ctx.strokeStyle = "#eab308";
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#fde047";
          ctx.font = `900 14px ${fonts.sans}`;
          ctx.fillText(
            "🗺️ BẢN ĐỒ KHO BÁU — CHỌN 1 LÁ TỪ MỘ BÀI",
            width * 0.5,
            my + 28
          );
          ctx.fillStyle = "#cbd5e1";
          ctx.font = `600 11px ${fonts.sans}`;
          ctx.fillText(
            "Lá được chọn sẽ đánh ngay lên Bàn chơi và kích hoạt kỹ năng!",
            width * 0.5,
            my + 48
          );

          const n = pv.mapChoices.length;
          const cW = Math.min(96, Math.floor((modalW - 56 - (n - 1) * 16) / n));
          const cH = Math.round(cW * 1.42);
          const gap = 18;
          const sx = width * 0.5 - (n * cW + (n - 1) * gap) / 2;
          const cy = my + 72;

          pv.mapChoices.forEach((card, i) => {
            const cxCard = sx + i * (cW + gap);
            const rId = `map-choice-${card.id}`;
            const hov = hoveredIdRef.current === rId;
            const willBust = suitsInPlay.has(card.suit);

            newHitRegions.push({
              id: rId,
              shape: "rect",
              x: cxCard,
              y: cy,
              width: cW,
              height: cH + 26,
              cursor: "pointer",
              data: { type: "map-pick", cardId: card.id },
            });

            drawDmdCard2D(
              ctx,
              cxCard,
              cy - (hov ? 6 : 0),
              cW,
              cH,
              card,
              {
                highlighted: true,
                bustRisk: willBust,
                badgeText: willBust ? "💥 TRÙNG!" : "✓ CHỌN LÁ NÀY",
              }
            );
          });

          ctx.restore();
        }

        // Victory confetti celebration
        if (pv.step === "Finished" && Math.random() < 0.35) {
          particles.spawn({
            x: Math.random() * width,
            y: -6,
            vx: (Math.random() - 0.5) * 40,
            vy: 45 + Math.random() * 65,
            radius: 2.5 + Math.random() * 2.5,
            color: ["#fde047", "#38bdf8", "#f43f5e", "#34d399"][
              Math.floor(Math.random() * 4)
            ],
            life: 2.6,
            maxLife: 2.6,
          });
        }
      }

      // 5. Render Realistic 60fps Suit FX, 3D Flipping Cards, Physics Particles & Floating Banners
      particles.update(dt);
      particles.draw(ctx);
      fxRef.current.updateAndDraw(ctx, dt, now, width, height);

      bannersRef.current = bannersRef.current.filter((bn) => {
        const p = (now - bn.startMs) / bn.durationMs;
        if (p < 0) return true;
        if (p >= 1) return false;
        const alpha = p < 0.15 ? p / 0.15 : p > 0.7 ? (1 - p) / 0.3 : 1;
        const rise = p * 28;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `900 15px ${fonts.sans}`;
        ctx.fillStyle = "rgba(2, 6, 23, 0.92)";
        ctx.fillText(bn.text, bn.x + 1.5, bn.y - rise + 1.5);
        ctx.fillStyle = bn.color;
        ctx.fillText(bn.text, bn.x, bn.y - rise);
        ctx.restore();
        return true;
      });

      hitRegionsRef.current = newHitRegions;
      ctx.restore();

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  const getPointerCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getPointerCoords(e);
    pointerPosRef.current = pt;
    const hit = findHitRegionAtPoint(hitRegionsRef.current, pt.x, pt.y);
    hoveredIdRef.current = hit?.id ?? null;
    e.currentTarget.style.cursor = hit?.cursor ?? "default";
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getPointerCoords(e);
    const hit = findHitRegionAtPoint(hitRegionsRef.current, pt.x, pt.y);
    if (!hit?.data) return;

    const data = hit.data as Record<string, any>;
    const dispatch = stateRef.current.onDispatchCommand;

    if (data.type === "draw") {
      dispatch({ type: "DRAW" });
    } else if (data.type === "bank") {
      dispatch({ type: "BANK" });
    } else if (data.type === "cannon-target") {
      dispatch({
        type: "CANNON_TARGET",
        targetSeatNo: data.targetSeatNo,
        suit: data.suit as DmdSuit,
      });
    } else if (data.type === "sword-target") {
      dispatch({
        type: "SWORD_TARGET",
        targetSeatNo: data.targetSeatNo,
        suit: data.suit as DmdSuit,
      });
    } else if (data.type === "hook-pick") {
      dispatch({
        type: "HOOK_PICK",
        suit: data.suit as DmdSuit,
      });
    } else if (data.type === "map-pick") {
      dispatch({
        type: "MAP_PICK",
        cardId: data.cardId,
      });
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onMouseLeave={() => {
        hoveredIdRef.current = null;
        pointerPosRef.current = null;
      }}
      className="w-full h-full block select-none"
    />
  );
}
