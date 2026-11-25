"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  drawRoundedRect,
  findHitRegionAtPoint,
  getCanvasFontFamilies,
  lerp,
  type HitRegion,
} from "@/canvas/engine";
import {
  drawIkBackground2D,
  drawIkCard2D,
  getIkPixelCardUrl,
} from "@/canvas/imploding-kittens-art";
import {
  ImplodingKittensFxEngine,
  type IkTableAnchors,
} from "@/canvas/imploding-kittens-fx";
import {
  IK_CARD_META,
  IK_EXPANSION_META,
  type IkCard,
  type IkCardCategory,
  type IkCommand,
  type IkPlayerView,
} from "@/cartridges/imploding-kittens";
import type { LobbySeatItem } from "@/components/werewolf-canvas";

const HOLD_INSPECT_DURATION_MS = 1000;

const CATEGORY_LABEL_VI: Record<IkCardCategory, string> = {
  bomb: "Bom Nguy Hiểm",
  defense: "Phòng Thủ / Phản Đòn",
  action: "Lá Hành Động",
  cat: "Lá Mèo (Ghép Combo)",
  wildcard_cat: "Lá Mèo Wildcard",
  passive: "Nội Tại (Giữ Trên Tay)",
};

interface ActiveHoldState {
  pointerId: number;
  card: IkCard | null;
  hitData: Record<string, any>;
  startX: number;
  startY: number;
  startMs: number;
  triggered: boolean;
  timerId: number | null;
}

interface HandCardSpring {
  x: number;
  y: number;
  scale: number;
  rot: number;
}

export interface ImplodingKittensCanvasProps {
  mode: "lobby" | "match";
  lobbySeats: LobbySeatItem[];
  viewerSeatNo: number | null;
  playerView: IkPlayerView | null;
  selectedCardIds: string[];
  selectedTargetSeatNo: number | null;
  onToggleCard: (cardId: string) => void;
  onSelectTargetSeat: (seatNo: number) => void;
  onDispatchCommand: (cmd: IkCommand) => void;
}

export function ImplodingKittensCanvas({
  mode,
  lobbySeats,
  viewerSeatNo,
  playerView,
  selectedCardIds,
  selectedTargetSeatNo,
  onToggleCard,
  onSelectTargetSeat,
  onDispatchCommand,
}: ImplodingKittensCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hitRegionsRef = useRef<HitRegion[]>([]);
  const hoveredIdRef = useRef<string | null>(null);
  const fxRef = useRef<ImplodingKittensFxEngine>(
    new ImplodingKittensFxEngine()
  );
  const handSpringsRef = useRef<Map<string, HandCardSpring>>(new Map());
  const anchorsRef = useRef<IkTableAnchors | null>(null);
  const lastAnimIdRef = useRef<number>(0);
  const lastConfettiMsRef = useRef<number>(0);
  const holdStateRef = useRef<ActiveHoldState | null>(null);
  const [inspectedCard, setInspectedCard] = useState<IkCard | null>(null);

  const clearHoldTimer = () => {
    const h = holdStateRef.current;
    if (h?.timerId !== null && h?.timerId !== undefined) {
      window.clearTimeout(h.timerId);
    }
    holdStateRef.current = null;
  };

  useEffect(() => {
    return () => {
      clearHoldTimer();
    };
  }, []);

  useEffect(() => {
    if (!inspectedCard) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInspectedCard(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [inspectedCard]);

  const stateRef = useRef({
    mode,
    lobbySeats,
    viewerSeatNo,
    playerView,
    selectedCardIds,
    selectedTargetSeatNo,
    onToggleCard,
    onSelectTargetSeat,
    onDispatchCommand,
  });

  useEffect(() => {
    stateRef.current = {
      mode,
      lobbySeats,
      viewerSeatNo,
      playerView,
      selectedCardIds,
      selectedTargetSeatNo,
      onToggleCard,
      onSelectTargetSeat,
      onDispatchCommand,
    };

    const anim = playerView?.lastAnim;
    if (
      mode === "match" &&
      anim &&
      anim.id !== lastAnimIdRef.current &&
      playerView
    ) {
      lastAnimIdRef.current = anim.id;
      const now = performance.now();
      const anchors = anchorsRef.current ?? {
        width: 900,
        height: 600,
        drawPile: { x: 250, y: 190, w: 100, h: 144 },
        discardPile: { x: 550, y: 190, w: 100, h: 144 },
        center: { x: 450, y: 260 },
        seatPositions: new Map<number, { x: number; y: number }>(),
      };
      fxRef.current.triggerFromGameEvent(
        anim,
        anchors,
        now,
        playerView.direction,
        viewerSeatNo
      );
    }
  }, [
    mode,
    lobbySeats,
    viewerSeatNo,
    playerView,
    selectedCardIds,
    selectedTargetSeatNo,
    onToggleCard,
    onSelectTargetSeat,
    onDispatchCommand,
  ]);

  useEffect(() => {
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
      const nextW = Math.max(320, Math.floor(rect.width * dpr));
      const nextH = Math.max(240, Math.floor(rect.height * dpr));
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    window.addEventListener("resize", resize);
    document.addEventListener("fullscreenchange", resize);
    document.addEventListener("webkitfullscreenchange", resize);

    const renderFrame = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      // Luôn tự đồng bộ kích thước Canvas theo khung cha mỗi frame (tránh lệch kích thước khi bật/tắt Fullscreen)
      resize();

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const fonts = getCanvasFontFamilies();
      const fx = fxRef.current;

      const {
        mode: curMode,
        lobbySeats: curLobbySeats,
        viewerSeatNo: curViewer,
        playerView: pv,
        selectedCardIds: curSelectedCards,
        selectedTargetSeatNo: curTargetSeatNo,
      } = stateRef.current;

      ctx.save();
      ctx.scale(dpr, dpr);

      const shakeOff = fx.getShakeOffset(now);
      if (shakeOff.dx !== 0 || shakeOff.dy !== 0) {
        ctx.translate(shakeOff.dx, shakeOff.dy);
      }

      drawIkBackground2D(
        ctx,
        width,
        height,
        now,
        pv?.direction ?? 1,
        Boolean(pv?.faceUpImplodingInDeck)
      );

      const newHitRegions: HitRegion[] = [];
      const isShort = height < 520;

      if (curMode === "lobby" || !pv) {
        fx.activeFavorPaw = null;
        // Lobby Preview Tabletop with gentle card levitation & subtle shimmer
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fde047";
        ctx.font = `900 ${isShort ? Math.min(20, Math.round(height * 0.06)) : Math.min(30, Math.round(width * 0.045))}px ${fonts.sans}`;
        ctx.fillText(
          "💣🕳️ IMPLODING KITTENS",
          width * 0.5,
          isShort ? height * 0.09 : height * 0.16
        );
        if (!isShort) {
          ctx.fillStyle = "#cbd5e1";
          ctx.font = `600 12px ${fonts.sans}`;
          ctx.fillText(
            "Mèo Nổ + 4 Bản Mở Rộng (Imploding • Streaking • Barking • Zombie Kittens)",
            width * 0.5,
            height * 0.22
          );
        }

        const sampleTypes = [
          "tacocat",
          "rainbow_cat",
          "defuse",
          "exploding_kitten",
          "nope",
          "attack",
          "see_future_3",
        ] as const;
        const cardW = isShort
          ? Math.min(54, Math.max(38, Math.round(height * 0.14)))
          : Math.min(92, Math.round(width * 0.11));
        const cardH = Math.round(cardW * 1.44);

        sampleTypes.forEach((t, i) => {
          const off = i - 3;
          const waveY = Math.sin(now / 480 + i * 0.75) * (isShort ? 3 : 6);
          const waveRot = Math.cos(now / 720 + i * 0.6) * 0.025;
          ctx.save();
          ctx.translate(
            width * 0.5 + off * (cardW * 0.74),
            (isShort ? height * 0.28 : height * 0.44) +
              Math.abs(off) * (isShort ? 3 : 7) +
              waveY
          );
          ctx.rotate(off * 0.08 + waveRot);
          drawIkCard2D(
            ctx,
            -cardW / 2,
            -cardH / 2,
            cardW,
            cardH,
            {
              id: `sample-${t}-${i}`,
              type: t,
            },
            { now }
          );
          ctx.restore();
        });

        // Lobby seated players strip (only on tall screens; short landscape uses the floating lobby panel)
        if (!isShort) {
          const count = Math.max(1, curLobbySeats.length);
          const pillW = Math.min(165, Math.floor((width - 40) / count) - 8);
          const startX =
            width * 0.5 - ((pillW + 8) * curLobbySeats.length - 8) / 2;
          curLobbySeats.forEach((s, idx) => {
            const px = startX + idx * (pillW + 8);
            const py = height * 0.66 + Math.sin(now / 600 + idx) * 2;
            drawRoundedRect(ctx, px, py, pillW, 44, 11);
            ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
            ctx.fill();
            ctx.strokeStyle =
              s.seatNo === curViewer ? "#facc15" : "rgba(148, 163, 184, 0.4)";
            ctx.lineWidth = s.seatNo === curViewer ? 2 : 1.2;
            ctx.stroke();

            ctx.fillStyle = "#f8fafc";
            ctx.font = `700 11.5px ${fonts.sans}`;
            ctx.fillText(s.displayName, px + pillW / 2, py + 16, pillW - 12);
            ctx.fillStyle = s.isBot ? "#38bdf8" : "#fde047";
            ctx.font = `600 10px ${fonts.sans}`;
            ctx.fillText(
              s.isBot ? "🤖 Mèo Máy Bot" : `Ghế #${s.seatNo}`,
              px + pillW / 2,
              py + 32
            );
          });
        }
      } else {
        // --- ACTIVE MATCH TABLETOP ---
        const mySeat =
          pv.seats.find((s) => s.seatNo === curViewer) ?? pv.seats[0];
        const opponents = pv.seats.filter((s) => s.seatNo !== mySeat.seatNo);
        const isMyTurn =
          pv.activeSeatNo === curViewer && pv.step === "TurnPlayStep";

        const seatPositions = new Map<number, { x: number; y: number }>();

        // 1. TOP ROW: Opponents around the table (clickable as targets!)
        const oppCount = Math.max(1, opponents.length);
        const oppGap = isShort ? 6 : 10;
        const oppW = Math.min(
          isShort ? 210 : 235,
          Math.floor((width - (isShort ? 16 : 28) - oppGap * (oppCount - 1)) / oppCount)
        );
        const oppY = isShort ? 6 : 12;
        const oppH = isShort
          ? Math.max(46, Math.min(58, Math.round(height * 0.15)))
          : 112;
        const oppStartX =
          width * 0.5 - (oppW * oppCount + oppGap * (oppCount - 1)) / 2;

        opponents.forEach((opp, idx) => {
          const ox = oppStartX + idx * (oppW + oppGap);
          const oy = oppY;
          const isTarget = curTargetSeatNo === opp.seatNo;
          const isActing = pv.activeSeatNo === opp.seatNo;
          const regId = `opp-seat-${opp.seatNo}`;

          seatPositions.set(opp.seatNo, {
            x: ox + oppW * 0.5,
            y: oy + oppH * 0.65,
          });

          if (opp.alive) {
            newHitRegions.push({
              id: regId,
              shape: "rect",
              x: ox,
              y: oy,
              width: oppW,
              height: oppH,
              cursor: "pointer",
              data: { type: "select_target", seatNo: opp.seatNo },
            });
          }

          // Animated breathing spotlight halo on acting opponent or targeted opponent
          if (opp.alive && (isActing || isTarget)) {
            const pulse = 0.5 + 0.5 * Math.sin(now / 260);
            ctx.save();
            ctx.shadowColor = isTarget ? "#f43f5e" : "#facc15";
            ctx.shadowBlur = 10 + pulse * 14;
            drawRoundedRect(ctx, ox, oy, oppW, oppH, 12);
            ctx.strokeStyle = isTarget
              ? "rgba(244, 63, 94, 0.85)"
              : "rgba(250, 204, 21, 0.85)";
            ctx.lineWidth = 2.6;
            ctx.stroke();
            ctx.restore();
          }

          drawRoundedRect(ctx, ox, oy, oppW, oppH, 12);
          ctx.fillStyle = !opp.alive
            ? "rgba(15, 23, 42, 0.55)"
            : isActing
              ? "rgba(69, 26, 3, 0.88)"
              : "rgba(15, 23, 42, 0.88)";
          ctx.fill();
          ctx.strokeStyle = isTarget
            ? "#f43f5e"
            : isActing
              ? "#facc15"
              : "rgba(148, 163, 184, 0.32)";
          ctx.lineWidth = isTarget || isActing ? 2.4 : 1.2;
          ctx.stroke();

          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillStyle = opp.alive ? "#f8fafc" : "#64748b";
          ctx.font = `800 12px ${fonts.sans}`;
          ctx.fillText(
            `${isTarget ? "🎯 " : ""}${opp.displayName}`,
            ox + 10,
            oy + 18,
            oppW - 78
          );

          ctx.textAlign = "right";
          ctx.fillStyle = !opp.alive
            ? "#f87171"
            : isActing
              ? "#fde047"
              : "#38bdf8";
          ctx.font = `800 10.5px ${fonts.mono}`;
          ctx.fillText(
            !opp.alive
              ? opp.eliminatedBy === "imploding"
                ? "🕳️ SẬP HỐ"
                : "💥 ĐÃ NỔ"
              : isActing
                ? `👑 ${pv.turnsRemaining} LƯỢT`
                : `🃏 ${opp.handCount} LÁ`,
            ox + oppW - 10,
            oy + 18
          );

          const badges: string[] = [];
          if (pv.towerHolderSeatNo === opp.seatNo && pv.towerStashCount > 0) {
            badges.push(`👑 Tháp (${pv.towerStashCount})`);
          }
          if (opp.isBlind) badges.push("🍑 Mù Bài");
          if (opp.barkingPlayedFaceUp) badges.push("🐶 Mèo Sủa");
          if (opp.illTakeThatFromSeatNo !== null)
            badges.push("🪝 Cướp Rút");
          if (oppH < 82 && opp.markedCards.length > 0) {
            badges.push(
              `🎯 ${opp.markedCards.map((mc) => IK_CARD_META[mc.type].shortVi).join(", ")}`
            );
          }
          if (badges.length > 0) {
            ctx.textAlign = "left";
            ctx.fillStyle = "#fda4af";
            ctx.font = `700 9.5px ${fonts.sans}`;
            ctx.fillText(
              badges.join(" • "),
              ox + 10,
              oy + (oppH < 82 ? 36 : 36),
              oppW - 20
            );
          } else if (oppH < 82 && opp.alive) {
            ctx.textAlign = "left";
            ctx.fillStyle = "#94a3b8";
            ctx.font = `600 9.5px ${fonts.sans}`;
            ctx.fillText(
              isTarget ? "Đang chọn làm mục tiêu" : "Bấm chọn làm mục tiêu",
              ox + 10,
              oy + 36,
              oppW - 20
            );
          }

          if (opp.alive && oppH >= 82) {
            const miniW = 28;
            const miniH = 40;
            const showCount = Math.min(7, opp.handCount);
            const stepMini = Math.min(
              22,
              Math.floor((oppW - 36) / Math.max(1, showCount))
            );
            for (let cIdx = 0; cIdx < showCount; cIdx++) {
              const markedCard = opp.markedCards[cIdx] ?? null;
              const idleBob = isActing
                ? Math.sin(now / 260 + cIdx * 0.6) * 2.5
                : 0;
              drawIkCard2D(
                ctx,
                ox + 12 + cIdx * stepMini,
                oy + 52 + idleBob,
                miniW,
                miniH,
                markedCard,
                { now }
              );
            }
          }
        });

        // 2. CENTER ARENA & BOTTOM DOCK — Responsive for BOTH Desktop & Short Phone Landscape!
        const dockH = isShort
          ? Math.max(104, Math.min(140, Math.round(height * 0.35)))
          : Math.max(176, Math.min(220, Math.round(height * 0.28)));
        const dockY = height - dockH - (isShort ? 4 : 6);

        const oppBottom = oppY + oppH + (isShort ? 6 : 12);
        const arenaAvailH = Math.max(82, dockY - oppBottom - (isShort ? 26 : 34));
        const arenaY = oppBottom + arenaAvailH * 0.5;
        const maxPileHBySpace = Math.max(
          64,
          Math.min(168, arenaAvailH - (isShort ? 6 : 12))
        );
        const pileH = isShort
          ? Math.round(maxPileHBySpace)
          : Math.round(
              Math.min(
                maxPileHBySpace,
                Math.min(116, Math.max(88, width * 0.1)) * 1.44
              )
            );
        const pileW = Math.round(pileH / 1.44);
        const pileGap = isShort
          ? Math.max(54, Math.min(96, Math.round(width * 0.11)))
          : 88;

        const drawX = Math.round(width * 0.5 - pileW - pileGap);
        const drawY = Math.round(arenaY - pileH * 0.5);
        const discardX = Math.round(width * 0.5 + pileGap);
        const discardY = drawY;

        seatPositions.set(mySeat.seatNo, {
          x: width * 0.5,
          y: dockY + dockH * 0.48,
        });

        // Update live anchors for FX engine
        anchorsRef.current = {
          width,
          height,
          drawPile: { x: drawX, y: drawY, w: pileW, h: pileH },
          discardPile: { x: discardX, y: discardY, w: pileW, h: pileH },
          center: { x: width * 0.5, y: arenaY },
          seatPositions,
        };

        // Keep the Favor begging cat paw visible throughout NopeWindow(favor) & FavorGiveStep!
        const activeFavorActorSeatNo =
          pv.step === "FavorGiveStep" && pv.pendingFavor
            ? pv.pendingFavor.toSeatNo
            : pv.step === "NopeWindowStep" &&
                pv.pendingAction?.effectiveType === "favor" &&
                !pv.pendingAction.isCanceledByNope
              ? pv.pendingAction.actorSeatNo
              : null;
        fx.syncActiveFavorPaw(
          activeFavorActorSeatNo,
          anchorsRef.current,
          curViewer,
          now
        );

        // Animated rotating orbital direction ring in center arena
        ctx.save();
        ctx.translate(width * 0.5, arenaY);
        const orbitAngle = (now / 2600) * pv.direction;
        ctx.rotate(orbitAngle);
        ctx.strokeStyle = pv.faceUpImplodingInDeck
          ? "rgba(216, 180, 254, 0.34)"
          : "rgba(250, 204, 21, 0.22)";
        ctx.lineWidth = 2;
        ctx.setLineDash([12, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, 58, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        // Two little direction arrowheads on the orbit ring
        for (let k = 0; k < 2; k++) {
          const a = k * Math.PI;
          const ax = Math.cos(a) * 58;
          const ay = Math.sin(a) * 58;
          ctx.save();
          ctx.translate(ax, ay);
          ctx.rotate(a + (pv.direction === 1 ? Math.PI * 0.5 : -Math.PI * 0.5));
          ctx.fillStyle = pv.faceUpImplodingInDeck ? "#e879f9" : "#facc15";
          ctx.beginPath();
          ctx.moveTo(6, 0);
          ctx.lineTo(-4, -4);
          ctx.lineTo(-4, 4);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();

        // Reverse spin vortex overlay if active
        fx.drawReverseSwirl(ctx, width * 0.5, arenaY, now);

        // Draw Pile (Clickable when isMyTurn to end 1 turn by drawing; hold 1s on face-up Imploding Kitten to inspect)
        if (isMyTurn && pv.drawPileCount > 0) {
          newHitRegions.push({
            id: "ik-draw-pile",
            shape: "rect",
            x: drawX - 6,
            y: drawY - 6,
            width: pileW + 12,
            height: pileH + 12,
            cursor: "pointer",
            data: { type: "draw_card", card: pv.topDrawCardFaceUp },
          });
        } else if (pv.topDrawCardFaceUp) {
          newHitRegions.push({
            id: "ik-draw-pile-inspect",
            shape: "rect",
            x: drawX,
            y: drawY,
            width: pileW,
            height: pileH,
            cursor: "help",
            data: { type: "inspect_card", card: pv.topDrawCardFaceUp },
          });
        }

        // Golden beckoning aura around Draw Pile when it's your turn!
        if (isMyTurn && pv.drawPileCount > 0) {
          const pulse = 0.5 + 0.5 * Math.sin(now / 260);
          ctx.save();
          ctx.shadowColor = pv.topDrawCardFaceUp ? "#e879f9" : "#4ade80";
          ctx.shadowBlur = 14 + pulse * 18;
          drawRoundedRect(
            ctx,
            drawX - 4,
            drawY - 4,
            pileW + 8,
            pileH + 8,
            12
          );
          ctx.strokeStyle = pv.topDrawCardFaceUp
            ? "rgba(232, 121, 249, 0.9)"
            : `rgba(74, 222, 128, ${0.5 + pulse * 0.45})`;
          ctx.lineWidth = 2.6;
          ctx.stroke();
          ctx.restore();
        }

        // If top card is a FACE-UP Imploding Kitten, pulse warning rings!
        if (pv.topDrawCardFaceUp) {
          const pulseR = 16 + ((now / 18) % 34);
          ctx.save();
          ctx.strokeStyle = "rgba(216, 180, 254, 0.75)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(
            drawX + pileW * 0.5,
            drawY + pileH * 0.5,
            pileW * 0.55 + pulseR,
            0,
            Math.PI * 2
          );
          ctx.stroke();
          ctx.restore();
        }

        // Check if Shuffle Riffle animation is actively fanning the Draw Pile
        const isShuffling = fx.drawShuffleRiffleOverlay(
          ctx,
          { x: drawX, y: drawY, w: pileW, h: pileH },
          now
        );

        if (!isShuffling) {
          const drawHovered = hoveredIdRef.current === "ik-draw-pile";
          const topLift = drawHovered && isMyTurn ? -6 : 0;
          for (let s = Math.min(4, pv.drawPileCount - 1); s >= 1; s--) {
            drawIkCard2D(ctx, drawX - s * 2, drawY + s * 2, pileW, pileH, null, {
              now,
            });
          }
          drawIkCard2D(
            ctx,
            drawX,
            drawY + topLift,
            pileW,
            pileH,
            pv.topDrawCardFaceUp,
            {
              hovered: drawHovered,
              now,
            }
          );
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = pv.topDrawCardFaceUp ? "#f0abfc" : "#fde047";
        ctx.font = `900 11px ${fonts.sans}`;
        ctx.fillText(
          pv.topDrawCardFaceUp
            ? `🕳️ MÈO HỐ ĐEN NGỬA TRÊN ĐỈNH! (${pv.drawPileCount} lá)`
            : `🃏 BỘ BÀI RÚT (${pv.drawPileCount} LÁ)`,
          drawX + pileW * 0.5,
          drawY + pileH + 16
        );
        if (isMyTurn) {
          const arrowBob = Math.sin(now / 220) * 3;
          ctx.fillStyle = "#4ade80";
          ctx.font = `800 10px ${fonts.sans}`;
          ctx.fillText(
            "👆 Bấm để Rút Bài Kết Thúc Lượt",
            drawX + pileW * 0.5,
            drawY + pileH + 31 + arrowBob
          );
        }

        // Center Cone of Shame Direction & Active Turn Indicator
        const actSeat = pv.seats.find((s) => s.seatNo === pv.activeSeatNo);
        ctx.fillStyle = "#f8fafc";
        ctx.font = `900 13px ${fonts.sans}`;
        ctx.fillText(
          pv.direction === 1 ? "↻ Chiều Kim Đồng Hồ" : "↺ Ngược Kim Đồng Hồ",
          width * 0.5,
          arenaY - 18
        );
        ctx.fillStyle = "#fde047";
        ctx.font = `800 11.5px ${fonts.sans}`;
        ctx.fillText(
          `Lượt: ${actSeat?.displayName ?? "..."} (${pv.turnsRemaining} lượt)`,
          width * 0.5,
          arenaY + 4
        );
        if (pv.faceUpImplodingInDeck) {
          ctx.fillStyle = "#e879f9";
          ctx.font = `800 10px ${fonts.sans}`;
          ctx.fillText(
            "🕳️ Cảnh báo: Đang có Mèo Hố Đen LẬT NGỬA trong Bộ bài!",
            width * 0.5,
            arenaY + 24
          );
        }

        // Discard Pile (Right-Center) with impact scale-bounce on landing!
        drawRoundedRect(ctx, discardX, discardY, pileW, pileH, 10);
        ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
        ctx.lineWidth = 1.4;
        ctx.stroke();

        if (pv.discardTopCard) {
          newHitRegions.push({
            id: "ik-discard-pile",
            shape: "rect",
            x: discardX,
            y: discardY,
            width: pileW,
            height: pileH,
            cursor: "help",
            data: { type: "inspect_card", card: pv.discardTopCard },
          });
          const popScale = fx.getDiscardPopScale(now);
          ctx.save();
          ctx.translate(discardX + pileW * 0.5, discardY + pileH * 0.5);
          ctx.scale(popScale, popScale);
          drawIkCard2D(
            ctx,
            -pileW * 0.5,
            -pileH * 0.5,
            pileW,
            pileH,
            pv.discardTopCard,
            { now }
          );
          ctx.restore();
        } else {
          ctx.fillStyle = "#64748b";
          ctx.font = `700 11px ${fonts.sans}`;
          ctx.fillText(
            "MỘ BÀI TRỐNG",
            discardX + pileW * 0.5,
            discardY + pileH * 0.5
          );
        }
        ctx.fillStyle = "#cbd5e1";
        ctx.font = `800 11px ${fonts.sans}`;
        ctx.fillText(
          `🗑️ CHỒNG BÀI BỎ (${pv.discardPileCount} LÁ)`,
          discardX + pileW * 0.5,
          discardY + pileH + 16
        );

        // 3. BOTTOM PLAYER HAND DOCK WITH SMOOTH SPRING PHYSICS
        drawRoundedRect(ctx, 10, dockY, width - 20, dockH, 16);
        ctx.fillStyle = "rgba(9, 13, 22, 0.94)";
        ctx.fill();
        ctx.strokeStyle = isMyTurn
          ? "rgba(250, 204, 21, 0.65)"
          : "rgba(148, 163, 184, 0.28)";
        ctx.lineWidth = isMyTurn ? 2.2 : 1.2;
        ctx.stroke();

        ctx.textAlign = "left";
        ctx.fillStyle = isMyTurn ? "#fde047" : "#f8fafc";
        ctx.font = `800 11.5px ${fonts.sans}`;
        ctx.fillText(
          `${mySeat.displayName} (${pv.myHand.length} lá trên tay)${pv.towerHolderSeatNo === mySeat.seatNo && pv.towerStashCount > 0 ? ` • 👑 ĐANG ĐỘI THÁP QUYỀN LỰC (${pv.towerStashCount} lá dự trữ)` : ""}${pv.myIsBlind ? " • 🍑 ĐANG BỊ ÚP MÙ BÀI!" : ""}${!mySeat.alive ? " • 💀 ĐÃ BỊ LOẠI" : ""}`,
          24,
          dockY + 16
        );
        if (width >= 540) {
          ctx.textAlign = "right";
          ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
          ctx.font = `600 10.5px ${fonts.sans}`;
          ctx.fillText(
            "💡 Giữ 1s vào lá bài để xem chức năng",
            width - 24,
            dockY + 16
          );
        }

        const handCards = pv.myHand;
        const cCount = Math.max(1, handCards.length);
        const cardH = isShort
          ? Math.min(dockH - 24, 112)
          : Math.min(dockH - 36, 156);
        const cardW = Math.round(cardH * 0.69);
        const availHandW = width - (isShort ? 32 : 56);
        const stepX =
          cCount > 1
            ? Math.min(
                cardW + (isShort ? 6 : 10),
                Math.floor((availHandW - cardW) / (cCount - 1))
              )
            : cardW;
        const totalRowW = cardW + (cCount - 1) * stepX;
        const startCardX = Math.round((width - totalRowW) * 0.5);

        // Prune removed cards from spring map
        const activeIds = new Set(handCards.map((c) => c.id));
        for (const k of handSpringsRef.current.keys()) {
          if (!activeIds.has(k)) handSpringsRef.current.delete(k);
        }

        const smoothFactor = 1 - Math.exp(-15 * dt);
        const renderQueue: {
          card: (typeof handCards)[number];
          idx: number;
          spring: HandCardSpring;
          isSelected: boolean;
          hovered: boolean;
        }[] = [];

        handCards.forEach((card, idx) => {
          const isSelected = curSelectedCards.includes(card.id);
          const regId = `my-card-${card.id}`;
          const hovered = hoveredIdRef.current === regId;
          const liftY = isSelected
            ? isShort
              ? -12
              : -20
            : hovered
              ? isShort
                ? -8
                : -15
              : 0;
          const targetX = startCardX + idx * stepX;
          const targetY = dockY + (isShort ? 21 : 28) + liftY;
          const targetScale = isSelected ? 1.07 : hovered ? 1.08 : 1.0;
          const centerNorm =
            cCount > 1 ? (idx / (cCount - 1)) * 2 - 1 : 0;
          const targetRot =
            isSelected || hovered ? 0 : centerNorm * 0.032;

          let sp = handSpringsRef.current.get(card.id);
          if (!sp) {
            // New cards smoothly glide in from the Draw Pile!
            sp = {
              x: drawX,
              y: drawY,
              scale: 0.72,
              rot: -0.15,
            };
            handSpringsRef.current.set(card.id, sp);
          } else {
            sp.x = lerp(sp.x, targetX, smoothFactor);
            sp.y = lerp(sp.y, targetY, smoothFactor);
            sp.scale = lerp(sp.scale, targetScale, smoothFactor);
            sp.rot = lerp(sp.rot, targetRot, smoothFactor);
          }

          if (mySeat.alive) {
            newHitRegions.push({
              id: regId,
              shape: "rect",
              x: targetX,
              y: targetY,
              width: cardW,
              height: cardH,
              cursor: "pointer",
              data: {
                type: "toggle_hand_card",
                cardId: card.id,
                card: pv.myIsBlind ? null : card,
              },
            });
          } else if (!pv.myIsBlind) {
            newHitRegions.push({
              id: regId,
              shape: "rect",
              x: targetX,
              y: targetY,
              width: cardW,
              height: cardH,
              cursor: "help",
              data: { type: "inspect_card", card },
            });
          }

          renderQueue.push({ card, idx, spring: sp, isSelected, hovered });
        });

        // Draw non-hovered cards first, then draw hovered card on top so it's never occluded!
        const orderedQueue = [
          ...renderQueue.filter((item) => !item.hovered),
          ...renderQueue.filter((item) => item.hovered),
        ];

        for (const item of orderedQueue) {
          const { card, idx, spring, isSelected, hovered } = item;
          ctx.save();
          ctx.translate(
            spring.x + cardW * 0.5,
            spring.y + cardH * 0.5
          );
          ctx.rotate(spring.rot);
          ctx.scale(spring.scale, spring.scale);
          if (isSelected || hovered) {
            ctx.shadowColor = isSelected ? "#fde047" : "#38bdf8";
            ctx.shadowBlur = isSelected ? 18 : 14;
          }
          drawIkCard2D(ctx, -cardW * 0.5, -cardH * 0.5, cardW, cardH, card, {
            selected: isSelected,
            hovered,
            blinded: pv.myIsBlind,
            blindIndex: idx,
            now,
          });
          ctx.restore();
        }

        // Continuous Victory Confetti celebration when match is finished!
        if (pv.step === "Finished" && now - lastConfettiMsRef.current > 420) {
          lastConfettiMsRef.current = now;
          fx.spawnVictoryConfetti(width, height, 10);
        }
      }

      // Update & draw full 2D FX layer (flying cards, beams, shockwaves, particles, flashes, stamps!)
      fx.update(dt);
      fx.drawAllOverlays(ctx, width, height, now);

      // Draw circular 1s press-and-hold charge ring when holding on an inspectable card
      const activeHold = holdStateRef.current;
      if (activeHold && activeHold.card && !activeHold.triggered) {
        const elapsed = performance.now() - activeHold.startMs;
        if (elapsed > 140) {
          const prog = Math.min(1, elapsed / HOLD_INSPECT_DURATION_MS);
          const hx = activeHold.startX;
          const hy = Math.max(46, activeHold.startY - 26);
          const ringR = 20;

          ctx.save();
          ctx.fillStyle = "rgba(9, 13, 22, 0.86)";
          ctx.beginPath();
          ctx.arc(hx, hy, ringR + 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(hx, hy, ringR, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = "#fde047";
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 10;
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.arc(
            hx,
            hy,
            ringR,
            -Math.PI * 0.5,
            -Math.PI * 0.5 + prog * Math.PI * 2
          );
          ctx.stroke();

          ctx.shadowBlur = 0;
          ctx.fillStyle = "#fef08a";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = `800 10px ${fonts.sans}`;
          ctx.fillText("?", hx, hy + 0.5);
          ctx.restore();
        }
      }

      hitRegionsRef.current = newHitRegions;
      ctx.restore();

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("fullscreenchange", resize);
      document.removeEventListener("webkitfullscreenchange", resize);
    };
  }, []);

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const executeTapAction = (d: Record<string, any>) => {
    const s = stateRef.current;
    if (d.type === "toggle_hand_card") {
      s.onToggleCard(d.cardId);
    } else if (d.type === "select_target") {
      s.onSelectTargetSeat(d.seatNo);
    } else if (d.type === "draw_card") {
      s.onDispatchCommand({ type: "DRAW_CARD" });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e);
    if (!pt) return;
    const hit = findHitRegionAtPoint(hitRegionsRef.current, pt.x, pt.y);
    hoveredIdRef.current = hit ? hit.id : null;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = hit?.cursor ?? "default";
    }

    const activeHold = holdStateRef.current;
    if (
      activeHold &&
      activeHold.pointerId === e.pointerId &&
      !activeHold.triggered
    ) {
      const dist = Math.hypot(
        pt.x - activeHold.startX,
        pt.y - activeHold.startY
      );
      if (dist > 16) {
        clearHoldTimer();
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const pt = getCanvasPoint(e);
    if (!pt) return;
    const hit = findHitRegionAtPoint(hitRegionsRef.current, pt.x, pt.y);
    if (!hit || !hit.data) return;

    const d = hit.data;
    const inspectableCard = (d.card as IkCard | null | undefined) ?? null;

    if (inspectableCard) {
      clearHoldTimer();
      const holdObj: ActiveHoldState = {
        pointerId: e.pointerId,
        card: inspectableCard,
        hitData: d,
        startX: pt.x,
        startY: pt.y,
        startMs: performance.now(),
        triggered: false,
        timerId: null,
      };
      holdObj.timerId = window.setTimeout(() => {
        if (holdStateRef.current === holdObj) {
          holdObj.triggered = true;
          holdObj.timerId = null;
          setInspectedCard(inspectableCard);
        }
      }, HOLD_INSPECT_DURATION_MS);
      holdStateRef.current = holdObj;
      return;
    }

    executeTapAction(d);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const activeHold = holdStateRef.current;
    if (!activeHold || activeHold.pointerId !== e.pointerId) return;
    const wasTriggered = activeHold.triggered;
    const hitData = activeHold.hitData;
    clearHoldTimer();
    if (!wasTriggered) {
      executeTapAction(hitData);
    }
  };

  const handlePointerCancelOrLeave = () => {
    clearHoldTimer();
  };

  const inspectedMeta = inspectedCard ? IK_CARD_META[inspectedCard.type] : null;
  const inspectedImgUrl = inspectedCard
    ? getIkPixelCardUrl(inspectedCard.type, inspectedCard.id)
    : null;
  const inspectedPackLabel =
    inspectedMeta && inspectedMeta.pack !== "core"
      ? IK_EXPANSION_META[inspectedMeta.pack].nameVi
      : "Bộ Cơ Bản (Core)";

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancelOrLeave}
        onPointerLeave={handlePointerCancelOrLeave}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full block touch-none select-none"
      />

      {/* 1s Hold Vietnamese Card Info Overlay */}
      {inspectedCard && inspectedMeta && (
        <div
          onClick={() => setInspectedCard(null)}
          className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl border border-amber-400/50 bg-slate-900/95 p-3.5 sm:p-5 shadow-2xl flex flex-row items-start gap-3.5 sm:gap-4"
          >
            {/* Enlarged Card Preview */}
            <div className="shrink-0 w-24 [@media(min-height:500px)]:w-36 sm:w-44 aspect-[5/7] rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-950 shadow-xl flex items-center justify-center">
              {inspectedImgUrl ? (
                <img
                  src={inspectedImgUrl}
                  alt={inspectedMeta.nameVi}
                  className="w-full h-full object-cover"
                  style={{ imageRendering: "pixelated" }}
                />
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center p-3 text-center gap-2"
                  style={{
                    background: `linear-gradient(155deg, ${inspectedMeta.colorHex}, ${inspectedMeta.secondaryHex})`,
                  }}
                >
                  <span className="text-4xl">{inspectedMeta.emoji}</span>
                  <span className="text-xs font-extrabold uppercase tracking-wide text-white">
                    {inspectedMeta.shortVi}
                  </span>
                </div>
              )}
            </div>

            {/* Vietnamese Rule Dossier */}
            <div className="flex-1 min-w-0 space-y-2.5 text-left">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-amber-300 leading-snug">
                    {inspectedMeta.nameVi}
                  </h3>
                  <p className="text-xs font-semibold text-slate-300 mt-0.5">
                    {inspectedMeta.subtitleVi}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedCard(null)}
                  className="shrink-0 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold text-white"
                  style={{ backgroundColor: inspectedMeta.colorHex }}
                >
                  {CATEGORY_LABEL_VI[inspectedMeta.category]}
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-800/90 px-2.5 py-0.5 text-[10.5px] font-bold text-slate-300">
                  {inspectedPackLabel}
                </span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/85 p-3 space-y-1.5">
                <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-sky-400">
                  Chức Năng Lá Bài
                </p>
                <p className="text-xs sm:text-[13px] text-slate-100 leading-relaxed">
                  {inspectedMeta.ruleVi}
                </p>
              </div>

              {inspectedMeta.needsTargetSeat && (
                <p className="text-[11px] font-semibold text-amber-300/90">
                  Lưu ý: Bấm chọn 1 đối thủ ở hàng trên cùng làm mục tiêu trước
                  khi đánh lá này.
                </p>
              )}
              {inspectedCard.type === "imploding_kitten" &&
                inspectedCard.faceUp && (
                  <p className="text-[11px] font-extrabold text-fuchsia-300">
                    Cảnh báo: Mèo Hố Đen đang ở trạng thái LẬT NGỬA — rút phải
                    sẽ nổ ngay lập tức, không thể Tháo Ngòi!
                  </p>
                )}

              <p className="text-[10.5px] text-slate-500 pt-0.5">
                Bấm ra ngoài hoặc nhấn ESC để đóng.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
