"use client";

import React, { useEffect, useRef } from "react";
import {
  drawRoundedRect,
  findHitRegionAtPoint,
  getCanvasFontFamilies,
  lerp,
  ParticleSystem,
  type HitRegion,
} from "@/canvas/engine";
import {
  drawDmdCard2D,
  drawDmdPirateBackground2D,
  getDmdCardPixelAtlas,
} from "@/canvas/dead-mans-draw-art";
import {
  DMD_SUITS,
  DMD_SUIT_META,
  type DmdCard,
  type DmdCommand,
  type DmdPlayerView,
  type DmdSuit,
} from "@/cartridges/dead-mans-draw";
import type { LobbySeatItem } from "@/components/werewolf-canvas";

interface FlyingCardFx {
  card: DmdCard | null;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startMs: number;
  durationMs: number;
  w: number;
  h: number;
}

interface FloatingBannerFx {
  text: string;
  color: string;
  x: number;
  y: number;
  startMs: number;
  durationMs: number;
}

interface ShockwaveFx {
  x: number;
  y: number;
  maxR: number;
  color: string;
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
  const flyingCardsRef = useRef<FlyingCardFx[]>([]);
  const bannersRef = useRef<FloatingBannerFx[]>([]);
  const shockwavesRef = useRef<ShockwaveFx[]>([]);
  const lastAnimIdRef = useRef<number>(0);
  const layoutAnchorsRef = useRef<{
    deckX: number;
    deckY: number;
    discardX: number;
    discardY: number;
    playCenterX: number;
    playCenterY: number;
    seatPos: Record<number, { x: number; y: number }>;
  }>({
    deckX: 160,
    deckY: 260,
    discardX: 740,
    discardY: 260,
    playCenterX: 450,
    playCenterY: 260,
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

    // Trigger juicy 60fps 2D pixel animations whenever a new match action arrives
    const anim = playerView?.lastAnim;
    if (mode === "match" && anim && anim.id !== lastAnimIdRef.current) {
      lastAnimIdRef.current = anim.id;
      const now = performance.now();
      const anchors = layoutAnchorsRef.current;
      const actorPt = anchors.seatPos[anim.actorSeatNo] ?? {
        x: anchors.playCenterX,
        y: anchors.playCenterY + 140,
      };
      const targetPt =
        anim.targetSeatNo !== undefined
          ? anchors.seatPos[anim.targetSeatNo] ?? {
              x: anchors.playCenterX,
              y: anchors.playCenterY - 140,
            }
          : actorPt;

      const particles = particlesRef.current;

      if (anim.kind === "DRAW" || anim.kind === "ORACLE" || anim.kind === "KRAKEN") {
        flyingCardsRef.current.push({
          card: anim.card ?? null,
          fromX: anchors.deckX,
          fromY: anchors.deckY,
          toX: anchors.playCenterX,
          toY: anchors.playCenterY,
          startMs: now,
          durationMs: 360,
          w: 72,
          h: 102,
        });
        if (anim.kind === "KRAKEN") {
          shockwavesRef.current.push({
            x: anchors.playCenterX,
            y: anchors.playCenterY,
            maxR: 130,
            color: "#f43f5e",
            startMs: now,
            durationMs: 650,
          });
          bannersRef.current.push({
            text: `🐙 KRAKEN! RÚT TIẾP ${anim.count ?? 2} LÁ!`,
            color: "#fda4af",
            x: anchors.playCenterX,
            y: anchors.playCenterY - 62,
            startMs: now,
            durationMs: 1450,
          });
        } else if (anim.kind === "ORACLE") {
          shockwavesRef.current.push({
            x: anchors.deckX,
            y: anchors.deckY,
            maxR: 95,
            color: "#c084fc",
            startMs: now,
            durationMs: 600,
          });
          bannersRef.current.push({
            text: "🔮 TIÊN TRI SOI BÀI!",
            color: "#e9d5ff",
            x: anchors.deckX + 40,
            y: anchors.deckY - 65,
            startMs: now,
            durationMs: 1200,
          });
        }
      } else if (anim.kind === "BANK" || anim.kind === "CHEST_KEY") {
        const count = Math.min(anim.count ?? 3, 6);
        for (let i = 0; i < count; i++) {
          flyingCardsRef.current.push({
            card: null,
            fromX: anchors.playCenterX + (i - count / 2) * 30,
            fromY: anchors.playCenterY,
            toX: actorPt.x,
            toY: actorPt.y,
            startMs: now + i * 55,
            durationMs: 420,
            w: 58,
            h: 82,
          });
        }
        for (let i = 0; i < (anim.kind === "CHEST_KEY" ? 36 : 20); i++) {
          const ang = (Math.PI * 2 * i) / 20 + Math.random() * 0.3;
          const spd = 45 + Math.random() * 110;
          particles.spawn({
            x: actorPt.x,
            y: actorPt.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 35,
            radius: 2 + Math.random() * 2.5,
            color: i % 2 === 0 ? "#fde047" : "#f59e0b",
            life: 0.9 + Math.random() * 0.5,
            maxLife: 1.4,
          });
        }
        bannersRef.current.push({
          text:
            anim.kind === "CHEST_KEY"
              ? `🗝️🧰 COMBO! +${anim.bonusCount ?? 0} LÁ THƯỞNG!`
              : `💰 THU ${anim.count ?? 1} LÁ VÀO KHO!`,
          color: "#fde047",
          x: actorPt.x,
          y: actorPt.y - 34,
          startMs: now,
          durationMs: 1500,
        });
      } else if (anim.kind === "BUST") {
        shockwavesRef.current.push({
          x: anchors.playCenterX,
          y: anchors.playCenterY,
          maxR: 165,
          color: "#ef4444",
          startMs: now,
          durationMs: 700,
        });
        flyingCardsRef.current.push({
          card: anim.card ?? null,
          fromX: anchors.playCenterX,
          fromY: anchors.playCenterY,
          toX: anchors.discardX,
          toY: anchors.discardY,
          startMs: now,
          durationMs: 480,
          w: 72,
          h: 102,
        });
        for (let i = 0; i < 32; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 60 + Math.random() * 140;
          particles.spawn({
            x: anchors.playCenterX,
            y: anchors.playCenterY,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            radius: 2.2 + Math.random() * 2.8,
            color: i % 3 === 0 ? "#fca5a5" : "#ef4444",
            life: 0.8 + Math.random() * 0.5,
            maxLife: 1.3,
          });
        }
        bannersRef.current.push({
          text:
            (anim.savedCount ?? 0) > 0
              ? `💥 CHÁY BÀI! ⚓ MỎ NEO CỨU ${anim.savedCount} LÁ!`
              : "💥 CHÁY BÀI! MẤT TRẮNG!",
          color: (anim.savedCount ?? 0) > 0 ? "#7dd3fc" : "#fca5a5",
          x: anchors.playCenterX,
          y: anchors.playCenterY - 56,
          startMs: now,
          durationMs: 1650,
        });
      } else if (anim.kind === "CANNON") {
        shockwavesRef.current.push({
          x: targetPt.x,
          y: targetPt.y,
          maxR: 105,
          color: "#f97316",
          startMs: now,
          durationMs: 600,
        });
        flyingCardsRef.current.push({
          card: anim.card ?? null,
          fromX: targetPt.x,
          fromY: targetPt.y,
          toX: anchors.discardX,
          toY: anchors.discardY,
          startMs: now,
          durationMs: 460,
          w: 60,
          h: 84,
        });
        for (let i = 0; i < 24; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 50 + Math.random() * 120;
          particles.spawn({
            x: targetPt.x,
            y: targetPt.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            radius: 2 + Math.random() * 3,
            color: i % 2 === 0 ? "#fb923c" : "#fde047",
            life: 0.7 + Math.random() * 0.4,
            maxLife: 1.1,
          });
        }
        bannersRef.current.push({
          text: "💣 BÙM! ĐẠI BÁC PHÁ KHO!",
          color: "#fdba74",
          x: targetPt.x,
          y: targetPt.y + 30,
          startMs: now,
          durationMs: 1350,
        });
      } else if (anim.kind === "SWORD") {
        flyingCardsRef.current.push({
          card: anim.card ?? null,
          fromX: targetPt.x,
          fromY: targetPt.y,
          toX: anchors.playCenterX,
          toY: anchors.playCenterY,
          startMs: now,
          durationMs: 420,
          w: 66,
          h: 94,
        });
        shockwavesRef.current.push({
          x: targetPt.x,
          y: targetPt.y,
          maxR: 85,
          color: "#38bdf8",
          startMs: now,
          durationMs: 520,
        });
        bannersRef.current.push({
          text: "⚔️ CƯỚP KHO BÁU!",
          color: "#93c5fd",
          x: anchors.playCenterX,
          y: anchors.playCenterY - 58,
          startMs: now,
          durationMs: 1200,
        });
      } else if (anim.kind === "HOOK") {
        flyingCardsRef.current.push({
          card: anim.card ?? null,
          fromX: actorPt.x,
          fromY: actorPt.y,
          toX: anchors.playCenterX,
          toY: anchors.playCenterY,
          startMs: now,
          durationMs: 400,
          w: 66,
          h: 94,
        });
        bannersRef.current.push({
          text: "🪝 MÓC SẮT KÍCH HOẠT!",
          color: "#e2e8f0",
          x: anchors.playCenterX,
          y: anchors.playCenterY - 58,
          startMs: now,
          durationMs: 1200,
        });
      } else if (anim.kind === "MAP") {
        flyingCardsRef.current.push({
          card: anim.card ?? null,
          fromX: anchors.discardX,
          fromY: anchors.discardY,
          toX: anchors.playCenterX,
          toY: anchors.playCenterY,
          startMs: now,
          durationMs: 420,
          w: 66,
          h: 94,
        });
        bannersRef.current.push({
          text: "🗺️ ĐÀO KHO TỪ MỘ BÀI!",
          color: "#fde68a",
          x: anchors.playCenterX,
          y: anchors.playCenterY - 58,
          startMs: now,
          durationMs: 1200,
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

        // 1. TOP ROW: Opponent Vaults
        const topBarY = 12;
        const oppH = Math.max(108, Math.min(132, Math.round(height * 0.21)));
        const oppGap = 10;
        const oppCount = Math.max(1, opponents.length);
        const oppW = Math.min(
          380,
          Math.floor((width - 24 - oppGap * (oppCount - 1)) / oppCount)
        );
        const oppStartX =
          width * 0.5 - (oppW * oppCount + oppGap * (oppCount - 1)) / 2;

        const seatAnchors: Record<number, { x: number; y: number }> = {};

        opponents.forEach((opp, idx) => {
          const ox = oppStartX + idx * (oppW + oppGap);
          const oy = topBarY;
          seatAnchors[opp.seatNo] = { x: ox + oppW * 0.5, y: oy + oppH * 0.6 };

          const isActive =
            opp.seatNo === pv.activeSeatNo && pv.step !== "Finished";
          const isWinner = pv.winnerSeatNos.includes(opp.seatNo);
          const isTargetStep =
            isMyTurn &&
            (pv.step === "CannonTargetStep" || pv.step === "SwordTargetStep");

          drawRoundedRect(ctx, ox, oy, oppW, oppH, 14);
          ctx.fillStyle = isWinner
            ? "rgba(120, 53, 15, 0.55)"
            : isActive
              ? "rgba(30, 41, 59, 0.92)"
              : "rgba(15, 23, 42, 0.82)";
          ctx.fill();
          ctx.strokeStyle = isWinner
            ? "#facc15"
            : isActive
              ? "#fbbf24"
              : isTargetStep
                ? "#f97316"
                : "rgba(148, 163, 184, 0.28)";
          ctx.lineWidth = isActive || isWinner ? 2.4 : 1.3;
          ctx.stroke();

          // Name & Live Score Header
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillStyle = isActive ? "#fde047" : "#f1f5f9";
          ctx.font = `800 12px ${fonts.sans}`;
          ctx.fillText(
            `${isActive ? "▶ " : ""}${opp.displayName}`,
            ox + 12,
            oy + 17,
            oppW - 110
          );

          ctx.textAlign = "right";
          ctx.fillStyle = "#fde68a";
          ctx.font = `900 13px ${fonts.mono}`;
          ctx.fillText(`★ ${opp.score}`, ox + oppW - 12, oy + 17);

          // Opponent Banked Suit Mini-Cards
          const ownedSuits = DMD_SUITS.filter((s) => opp.bank[s].length > 0);
          if (ownedSuits.length === 0) {
            ctx.textAlign = "center";
            ctx.fillStyle = "#64748b";
            ctx.font = `600 11px ${fonts.sans}`;
            ctx.fillText(
              "Kho báu đang trống",
              ox + oppW * 0.5,
              oy + oppH * 0.62
            );
          } else {
            const availW = oppW - 20;
            const miniW = Math.max(
              32,
              Math.min(48, Math.floor((availW - (ownedSuits.length - 1) * 4) / ownedSuits.length))
            );
            const miniH = Math.min(oppH - 36, Math.round(miniW * 1.4));
            const totalStripW =
              ownedSuits.length * miniW + (ownedSuits.length - 1) * 4;
            const sx0 = ox + (oppW - totalStripW) / 2;
            const sy0 = oy + 31;

            ownedSuits.forEach((suit, sIdx) => {
              const stack = opp.bank[suit];
              const topCard = stack[stack.length - 1];
              const cxCard = sx0 + sIdx * (miniW + 4);
              const regionId = `opp-bank-${opp.seatNo}-${suit}`;
              const hovered = hoveredIdRef.current === regionId;
              const willBust =
                pv.step === "SwordTargetStep" && suitsInPlay.has(suit);

              if (isTargetStep) {
                newHitRegions.push({
                  id: regionId,
                  shape: "rect",
                  x: cxCard,
                  y: sy0,
                  width: miniW,
                  height: miniH,
                  cursor: "pointer",
                  data: {
                    type:
                      pv.step === "CannonTargetStep"
                        ? "cannon-target"
                        : "sword-target",
                    targetSeatNo: opp.seatNo,
                    suit,
                  },
                });
              }

              drawDmdCard2D(
                ctx,
                cxCard,
                sy0 - (hovered && isTargetStep ? 4 : 0),
                miniW,
                miniH,
                topCard,
                {
                  highlighted: isTargetStep,
                  bustRisk: willBust,
                  stackCount: stack.length,
                }
              );
            });
          }
        });

        // 2. CENTER ARENA: Draw Pile | Play Area | Discard Pile
        const arenaTop = topBarY + oppH + 14;
        const bottomH = Math.max(122, Math.min(156, Math.round(height * 0.24)));
        const arenaBottom = height - bottomH - 14;
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
          playCenterX: activeSlotCenterX,
          playCenterY: playCardY + fixedCardH / 2,
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
          pv.playArea.forEach((card, idx) => {
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

        // 3. BOTTOM ROW: Viewer's Own Pirate Vault
        const botX = 12;
        const botY = height - bottomH - 10;
        const botW = width - 24;
        seatAnchors[mySeat.seatNo] = {
          x: botX + botW * 0.5,
          y: botY + bottomH * 0.5,
        };

        const myActive =
          mySeat.seatNo === pv.activeSeatNo && pv.step !== "Finished";
        const myWinner = pv.winnerSeatNos.includes(mySeat.seatNo);
        const isHookStep = isMyTurn && pv.step === "HookPickStep";

        drawRoundedRect(ctx, botX, botY, botW, bottomH, 16);
        ctx.fillStyle = myWinner
          ? "rgba(120, 53, 15, 0.55)"
          : myActive
            ? "rgba(22, 33, 52, 0.94)"
            : "rgba(15, 23, 42, 0.86)";
        ctx.fill();
        ctx.strokeStyle = myWinner
          ? "#facc15"
          : isHookStep
            ? "#38bdf8"
            : myActive
              ? "#fbbf24"
              : "rgba(148, 163, 184, 0.32)";
        ctx.lineWidth = myActive || myWinner || isHookStep ? 2.4 : 1.4;
        ctx.stroke();

        // Vault header
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = myActive ? "#fde047" : "#f8fafc";
        ctx.font = `800 13px ${fonts.sans}`;
        ctx.fillText(
          `🏴‍☠️ KHO BÁU CỦA BẠN — ${mySeat.displayName}`,
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
            botY + bottomH * 0.62
          );
        } else {
          const availW = botW - 28;
          const gap = 8;
          const cardW = Math.max(
            44,
            Math.min(
              72,
              Math.floor((availW - (myOwned.length - 1) * gap) / myOwned.length)
            )
          );
          const cardH = Math.min(bottomH - 42, Math.round(cardW * 1.4));
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
              sy0 - (hov && isHookStep ? 5 : 0),
              cardW,
              cardH,
              topCard,
              {
                highlighted: isHookStep,
                bustRisk: willBust,
                stackCount: stack.length,
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

      // 5. Render Active 60fps Action FX (Shockwaves, Flying Cards, Particles, Floating Banners)
      shockwavesRef.current = shockwavesRef.current.filter((sw) => {
        const p = (now - sw.startMs) / sw.durationMs;
        if (p < 0) return true;
        if (p >= 1) return false;
        ctx.save();
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = (1 - p) * 0.85;
        ctx.lineWidth = Math.max(1.5, 6 * (1 - p));
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.maxR * p, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        return true;
      });

      flyingCardsRef.current = flyingCardsRef.current.filter((fc) => {
        const p = (now - fc.startMs) / fc.durationMs;
        if (p < 0) return true;
        if (p >= 1) return false;
        const ease = 1 - Math.pow(1 - p, 3);
        const x = lerp(fc.fromX, fc.toX, ease);
        const y = lerp(fc.fromY, fc.toY, ease) - Math.sin(p * Math.PI) * 34;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((1 - ease) * 0.25);
        drawDmdCard2D(ctx, -fc.w / 2, -fc.h / 2, fc.w, fc.h, fc.card, {
          highlighted: true,
        });
        ctx.restore();
        return true;
      });

      particles.update(dt);
      particles.draw(ctx);

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
      }}
      className="w-full h-full block select-none"
    />
  );
}
