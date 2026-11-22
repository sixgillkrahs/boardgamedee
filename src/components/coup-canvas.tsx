"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  computeRadialSeatPosition,
  drawRoundedRect,
  findHitRegionAtPoint,
  lerp,
  ParticleSystem,
  type HitRegion,
} from "@/canvas/engine";
import {
  drawCoupActionIcon2D,
  drawCoupCard2D,
  drawCoupCenterTreasuryAndDeck2D,
  drawCoupCoin2D,
  drawCoupCoinStack2D,
  drawCoupDystopianBackgroundAndTable2D,
  type CoupIconKind,
} from "@/canvas/coup-cards";
import { computeCardDealProgress } from "@/canvas/role-cards";
import {
  ACTION_LABEL_VI,
  COUP_CHARACTER_META,
  type CoupCommand,
  type CoupPlayerView,
} from "@/cartridges/coup";
import type { LobbySeatItem } from "@/components/werewolf-canvas";

export function CoupActionIconCanvas({
  kind,
  size = 24,
  className = "",
}: {
  kind: CoupIconKind;
  size?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);
    drawCoupActionIcon2D(ctx, size * 0.5, size * 0.5, size * 0.9, kind);
    ctx.restore();
  }, [kind, size]);

  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size }}
      className={`inline-block shrink-0 ${className}`}
    />
  );
}

interface CoupCanvasProps {
  mode: "lobby" | "match";
  lobbySeats: LobbySeatItem[];
  viewerSeatNo: number | null;
  playerView: CoupPlayerView | null;
  selectedTargetSeatNo: number | null;
  onSelectSeat: (seatNo: number) => void;
  cardsRevealed: boolean;
  onToggleCardsRevealed: () => void;
  onDispatchCommand: (cmd: CoupCommand) => void;
}

export function CoupCanvas({
  mode,
  lobbySeats,
  viewerSeatNo,
  playerView,
  selectedTargetSeatNo,
  onSelectSeat,
  cardsRevealed,
  onToggleCardsRevealed,
  onDispatchCommand,
}: CoupCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hitRegionsRef = useRef<HitRegion[]>([]);
  const hoveredRegionIdRef = useRef<string | null>(null);
  const particlesRef = useRef<ParticleSystem>(new ParticleSystem());

  // Dealing animation timer at start of match
  const dealStartRef = useRef<number | null>(null);
  const lastMatchKeyRef = useRef<string>("");

  // Coin transfer animation timer
  const transferStartRef = useRef<number | null>(null);
  const lastTransferKeyRef = useRef<string>("");

  // Card exchange animation timer (tabletop flight & Court Deck shuffle)
  const exchangeStartRef = useRef<number | null>(null);
  const lastExchangeKeyRef = useRef<string>("");

  // Ambassador 2D modal open & card-flip animation timer + smooth per-card lift values
  const exchangeModalStartRef = useRef<number | null>(null);
  const wasInExchangeStepRef = useRef<boolean>(false);
  const cardLiftProgressRef = useRef<number[]>([1, 1, 0, 0]);

  // Ambassador Exchange selected indices (on 2D Canvas)
  const [exchangeSelected, setExchangeSelected] = useState<number[]>([0, 1]);

  useEffect(() => {
    if (
      playerView?.step === "ExchangePickStep" &&
      playerView.exchangeKeepCount > 0
    ) {
      setExchangeSelected(
        Array.from({ length: playerView.exchangeKeepCount }, (_, i) => i)
      );
    }
  }, [playerView?.step, playerView?.turnNumber, playerView?.exchangeKeepCount]);

  const stateRef = useRef({
    mode,
    lobbySeats,
    viewerSeatNo,
    playerView,
    selectedTargetSeatNo,
    onSelectSeat,
    cardsRevealed,
    onToggleCardsRevealed,
    onDispatchCommand,
    exchangeSelected,
    setExchangeSelected,
  });

  useEffect(() => {
    stateRef.current = {
      mode,
      lobbySeats,
      viewerSeatNo,
      playerView,
      selectedTargetSeatNo,
      onSelectSeat,
      cardsRevealed,
      onToggleCardsRevealed,
      onDispatchCommand,
      exchangeSelected,
      setExchangeSelected,
    };

    if (mode === "match" && playerView) {
      const mKey = `coup-${playerView.seats.length}`;
      if (lastMatchKeyRef.current !== mKey) {
        lastMatchKeyRef.current = mKey;
        dealStartRef.current = performance.now();
      }

      if (playerView.lastTransfer) {
        const t = playerView.lastTransfer;
        const tKey = `${t.atTurn}-${t.action}-${t.from}-${t.to}-${t.amount}`;
        if (lastTransferKeyRef.current !== tKey) {
          lastTransferKeyRef.current = tKey;
          transferStartRef.current = performance.now();
        }
      }

      if (playerView.lastCardExchange) {
        const ex = playerView.lastCardExchange;
        const exKey = `${ex.atTurn}-${ex.seatNo}-${ex.phase}-${ex.count}-${ex.revealedCharacter ?? ""}`;
        if (lastExchangeKeyRef.current !== exKey) {
          lastExchangeKeyRef.current = exKey;
          exchangeStartRef.current = performance.now();
        }
      }

      const inExchangeStep = playerView.step === "ExchangePickStep";
      if (inExchangeStep && !wasInExchangeStepRef.current) {
        wasInExchangeStepRef.current = true;
        exchangeModalStartRef.current = performance.now();
      } else if (!inExchangeStep) {
        wasInExchangeStepRef.current = false;
      }
    } else {
      lastMatchKeyRef.current = "";
      dealStartRef.current = null;
      lastTransferKeyRef.current = "";
      transferStartRef.current = null;
      lastExchangeKeyRef.current = "";
      exchangeStartRef.current = null;
      wasInExchangeStepRef.current = false;
      exchangeModalStartRef.current = null;
    }
  }, [
    mode,
    lobbySeats,
    viewerSeatNo,
    playerView,
    selectedTargetSeatNo,
    onSelectSeat,
    cardsRevealed,
    onToggleCardsRevealed,
    onDispatchCommand,
    exchangeSelected,
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
      canvas.width = Math.max(320, Math.floor(rect.width * dpr));
      canvas.height = Math.max(460, Math.floor(rect.height * dpr));
    };

    resize();
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) {
      observer.observe(canvas.parentElement);
    }

    const renderFrame = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      const {
        mode: curMode,
        lobbySeats: curLobbySeats,
        viewerSeatNo: curViewerSeatNo,
        playerView: pv,
        selectedTargetSeatNo: curTarget,
        cardsRevealed: isCardsOpen,
        exchangeSelected: curExchangeSel,
      } = stateRef.current;

      ctx.save();
      ctx.scale(dpr, dpr);

      const centerX = width * 0.5;
      const centerY = height * 0.47;
      const tableRx = Math.min(width * 0.39, 510);
      const tableRy = Math.min(height * 0.36, 330);

      // 1 & 2. 2D Dystopian Universe Megacity Skyline Backdrop & High-Council Command Table
      drawCoupDystopianBackgroundAndTable2D(
        ctx,
        width,
        height,
        centerX,
        centerY,
        tableRx,
        tableRy,
        now
      );

      // 3. Ambient Gold Spark Particles
      const particles = particlesRef.current;
      if (Math.random() < 0.28) {
        particles.spawn({
          x: centerX + (Math.random() - 0.5) * tableRx * 1.6,
          y: centerY + (Math.random() - 0.5) * tableRy * 1.4,
          vx: (Math.random() - 0.5) * 14,
          vy: -12 - Math.random() * 16,
          radius: 1.3 + Math.random() * 1.6,
          color: Math.random() > 0.4 ? "#fde047" : "#c084fc",
          life: 1.4 + Math.random() * 1.0,
          maxLife: 2.4,
        });
      }
      particles.update(dt);
      particles.draw(ctx);

      // 4. Central 2D Court Deck, 2D Treasury Gold Coins & Phase Timer Ring
      drawCoupCenterTreasuryAndDeck2D(
        ctx,
        centerX,
        centerY,
        pv?.courtDeckCount ?? 15,
        now
      );

      // Central Phase Timer Ring
      const timerR = 42;
      ctx.save();
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.beginPath();
      ctx.arc(centerX, centerY, timerR, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(148, 163, 184, 0.22)";
      ctx.beginPath();
      ctx.arc(centerX, centerY, timerR, 0, Math.PI * 2);
      ctx.stroke();

      let remSec: number | null = null;
      if (curMode === "match" && pv?.phaseDeadlineMs) {
        const diffMs = Math.max(0, pv.phaseDeadlineMs - Date.now());
        remSec = Math.ceil(diffMs / 1000);
        const totalSec =
          pv.step === "TurnActionStep"
            ? pv.config.timers.turnActionSeconds
            : pv.step === "ReactionWindowStep" ||
                pv.step === "BlockChallengeStep"
              ? pv.config.timers.reactionWindowSeconds
              : pv.step === "LoseInfluenceStep"
                ? pv.config.timers.loseInfluenceSeconds
                : pv.config.timers.exchangeSeconds;
        const prog = Math.max(0, Math.min(1, diffMs / (totalSec * 1000)));
        ctx.strokeStyle = remSec <= 4 ? "#ef4444" : "#f59e0b";
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY,
          timerR,
          -Math.PI / 2,
          -Math.PI / 2 + prog * Math.PI * 2
        );
        ctx.stroke();
      } else {
        ctx.strokeStyle = "#a855f7";
        ctx.beginPath();
        ctx.arc(centerX, centerY, timerR, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (curMode === "lobby") {
        ctx.fillStyle = "#fde047";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("COUP", centerX, centerY - 6);
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "600 10px sans-serif";
        ctx.fillText("SẢNH CHỜ", centerX, centerY + 10);
      } else if (pv?.step === "Finished") {
        ctx.fillStyle = "#fde047";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("THẮNG LỢI", centerX, centerY);
      } else {
        ctx.fillStyle = remSec !== null && remSec <= 4 ? "#fca5a5" : "#f8fafc";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText(
          remSec !== null ? `${remSec}s` : "--",
          centerX,
          centerY - 5
        );
        ctx.fillStyle = "#c084fc";
        ctx.font = "bold 9.5px sans-serif";
        ctx.fillText(`LƯỢT ${pv?.turnNumber ?? 1}`, centerX, centerY + 15);
      }
      ctx.restore();

      // 5. Top Status Banner on 2D Canvas
      const activeSeatObj = pv?.seats.find(
        (s) => s.seatNo === pv.activeSeatNo
      );
      const pendingActorObj = pv?.pendingAction
        ? pv.seats.find((s) => s.seatNo === pv.pendingAction?.actorSeatNo)
        : null;
      const pendingTargetObj = pv?.pendingAction?.targetSeatNo
        ? pv.seats.find((s) => s.seatNo === pv.pendingAction?.targetSeatNo)
        : null;
      const blockerObj = pv?.pendingBlock
        ? pv.seats.find((s) => s.seatNo === pv.pendingBlock?.blockerSeatNo)
        : null;

      let bannerText = `Coup: Đảo Chính • Đang chờ người chơi (${curLobbySeats.length}/6)`;
      if (curMode === "match" && pv) {
        if (pv.step === "Finished") {
          bannerText = pv.winReasonVi ?? "Ván đấu đã kết thúc!";
        } else if (pv.step === "TurnActionStep") {
          bannerText = `Lượt của ${activeSeatObj?.displayName ?? ""} • Chọn hành động hoặc tuyên bố Nhân vật`;
        } else if (pv.step === "ReactionWindowStep" && pv.pendingAction) {
          const tStr = pendingTargetObj
            ? ` → ${pendingTargetObj.displayName}`
            : "";
          bannerText = `${pendingActorObj?.displayName ?? ""} dùng ${ACTION_LABEL_VI[pv.pendingAction.type]}${tStr} • Bắt bài hay Chặn?`;
        } else if (pv.step === "BlockChallengeStep" && pv.pendingBlock) {
          bannerText = `${blockerObj?.displayName ?? ""} nhận là ${COUP_CHARACTER_META[pv.pendingBlock.claimedCharacter].nameVi} để CHẶN! Bắt bài hay Cho qua?`;
        } else if (pv.step === "LoseInfluenceStep" && pv.activeLossTarget) {
          const loser = pv.seats.find(
            (s) => s.seatNo === pv.activeLossTarget?.seatNo
          );
          bannerText = `${loser?.displayName ?? ""} phải chọn lật bỏ 1 lá bài (${pv.activeLossTarget.reasonVi})`;
        } else if (pv.step === "ExchangePickStep") {
          bannerText = `Đại Sứ ${activeSeatObj?.displayName ?? ""} đang chọn bài giữ lại từ Bộ bài Triều đình`;
        }
      }

      ctx.save();
      const bannerW = Math.min(width - 24, 580);
      const bannerX = (width - bannerW) / 2;
      drawRoundedRect(ctx, bannerX, 12, bannerW, 36, 18);
      ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
      ctx.fill();
      ctx.strokeStyle = "rgba(192, 132, 252, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = "#f8fafc";
      ctx.font = "600 12.5px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(bannerText, width / 2, 30);
      ctx.restore();

      // 6. Seats around the Table (Each with two 2D Influence Cards + 2D Gold Coin Stack)
      const newHitRegions: HitRegion[] = [];
      const seatsToRender =
        curMode === "match" && pv
          ? pv.seats
          : curLobbySeats.map((s) => ({
              seatNo: s.seatNo,
              actorId: s.actorId,
              displayName: s.displayName,
              coins: 2,
              alive: true,
              cards: [
                { character: null, revealed: false },
                { character: null, revealed: false },
              ],
              hasPassedReaction: false,
            }));

      const seatPositions = new Map<number, { x: number; y: number }>();
      seatsToRender.forEach((seat, idx) => {
        const pos = computeRadialSeatPosition(
          idx,
          seatsToRender.length,
          centerX,
          centerY,
          tableRx,
          tableRy
        );
        seatPositions.set(seat.seatNo, pos);
      });

      // Draw Target Action Vector Line (when a target is selected or pendingAction has a target)
      const visualTargetNo =
        pv?.pendingAction?.targetSeatNo ?? curTarget ?? null;
      const visualOriginNo =
        pv?.pendingAction?.actorSeatNo ??
        pv?.activeSeatNo ??
        curViewerSeatNo ??
        null;

      if (
        visualTargetNo !== null &&
        visualOriginNo !== null &&
        visualTargetNo !== visualOriginNo &&
        seatPositions.has(visualTargetNo) &&
        seatPositions.has(visualOriginNo)
      ) {
        const fromP = seatPositions.get(visualOriginNo)!;
        const toP = seatPositions.get(visualTargetNo)!;
        ctx.save();
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -(now / 24);
        ctx.beginPath();
        ctx.moveTo(fromP.x, fromP.y);
        ctx.lineTo(toP.x, toP.y);
        ctx.stroke();
        ctx.restore();
      }

      const dealElapsedSec =
        dealStartRef.current !== null
          ? (now - dealStartRef.current) / 1000
          : 999;

      const cardW = width < 560 ? 46 : width < 960 ? 58 : 68;
      const cardH = width < 560 ? 64 : width < 960 ? 82 : 96;
      const deckOriginX = centerX - 88;
      const deckOriginY = centerY;
      const treasOriginX = centerX + 86;
      const treasOriginY = centerY;

      seatsToRender.forEach((seat, seatIdx) => {
        const pos = seatPositions.get(seat.seatNo)!;
        const isMe = seat.seatNo === curViewerSeatNo;
        const isActiveTurn =
          curMode === "match" && pv?.activeSeatNo === seat.seatNo;
        const isSelected = seat.seatNo === curTarget;
        const isPendingTarget =
          curMode === "match" &&
          pv?.pendingAction?.targetSeatNo === seat.seatNo;

        const stationW = cardW * 2 + 54;
        const stationH = cardH + 36;

        newHitRegions.push({
          id: `seat-${seat.seatNo}`,
          shape: "rect",
          x: pos.x - stationW / 2,
          y: pos.y - cardH / 2 - 10,
          width: stationW,
          height: stationH,
          cursor: seat.alive && !isMe ? "pointer" : "default",
          data: {
            type: isMe ? "toggle-my-cards" : "seat",
            seatNo: seat.seatNo,
            disabled: !seat.alive || isMe,
          },
        });

        ctx.save();

        // Active Turn or Selected Target Halo
        if (isActiveTurn || isSelected || isPendingTarget) {
          const pulse = 1 + Math.sin(now / 180) * 0.05;
          drawRoundedRect(
            ctx,
            pos.x - (stationW * 0.52) * pulse,
            pos.y - (cardH * 0.6) * pulse,
            stationW * 1.04 * pulse,
            (cardH + 40) * pulse,
            14
          );
          ctx.strokeStyle = isPendingTarget
            ? "#ef4444"
            : isSelected
              ? "#38bdf8"
              : "#fde047";
          ctx.lineWidth = 2.6;
          ctx.stroke();
        }

        // Draw the 2 Influence Cards in 2D (with initial flight from Court Deck)
        for (let cIdx = 0; cIdx < 2; cIdx++) {
          const cardObj = seat.cards[cIdx] ?? {
            character: null,
            revealed: false,
          };
          const targetCardX =
            pos.x - cardW - 14 + cIdx * (cardW + 6);
          const targetCardY = pos.y - cardH / 2;

          let drawX = targetCardX;
          let drawY = targetCardY;
          if (curMode === "match") {
            const deal = computeCardDealProgress(
              dealElapsedSec,
              seatIdx * 2 + cIdx,
              seatsToRender.length * 2
            );
            drawX = lerp(deckOriginX, targetCardX, deal.flightT);
            drawY = lerp(deckOriginY, targetCardY, deal.flightT);
          }

          const visibleChar =
            cardObj.revealed ||
            pv?.step === "Finished" ||
            (isMe && isCardsOpen)
              ? cardObj.character
              : null;

          drawCoupCard2D(
            ctx,
            drawX,
            drawY,
            cardW,
            cardH,
            visibleChar,
            cardObj.revealed,
            isSelected
          );
        }

        // Draw the Seat's 2D Gold Coin Stack right beside their 2 Influence Cards
        const coinStackX = pos.x + cardW + 20;
        const coinStackY = pos.y + 6;
        drawCoupCoinStack2D(ctx, coinStackX, coinStackY, seat.coins, 12);

        // Name Plate below the 2 cards
        const nameText = isMe
          ? `${seat.displayName} (Bạn)`
          : seat.displayName;
        const plateW = Math.max(96, Math.min(156, nameText.length * 6.8 + 20));
        const plateX = pos.x - plateW / 2;
        const plateY = pos.y + cardH / 2 + 8;

        drawRoundedRect(ctx, plateX, plateY, plateW, 21, 7);
        ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
        ctx.fill();
        ctx.strokeStyle = isActiveTurn
          ? "#fde047"
          : isMe
            ? "#38bdf8"
            : "#334155";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = !seat.alive
          ? "#64748b"
          : isActiveTurn
            ? "#fde047"
            : isMe
              ? "#7dd3fc"
              : "#f8fafc";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          nameText.length > 18 ? `${nameText.slice(0, 17)}…` : nameText,
          pos.x,
          plateY + 10.5
        );

        // Floating 2D Action / Block Faction Emblem Medallion above the acting or blocking seat
        const seatClaimIcon: CoupIconKind | null =
          curMode === "match" && pv
            ? pv.pendingBlock?.blockerSeatNo === seat.seatNo
              ? pv.pendingBlock.claimedCharacter
              : pv.pendingAction?.actorSeatNo === seat.seatNo
                ? (pv.pendingAction.claimedCharacter ?? pv.pendingAction.type)
                : null
            : null;

        if (seatClaimIcon) {
          const emCx = pos.x - 10;
          const emCy = pos.y - cardH / 2 - 20;
          ctx.save();
          ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
          ctx.strokeStyle = "#fde047";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(emCx, emCy, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          drawCoupActionIcon2D(ctx, emCx, emCy, 22, seatClaimIcon);
          ctx.restore();
        }

        // Sub-status tag (e.g. "ĐANG ĐẾN LƯỢT", "✓ Đã cho qua", "Đã bị loại")
        let subTag: string | null = null;
        let subCol = "#94a3b8";
        if (!seat.alive) {
          subTag = "Đã mất hết quyền lực";
          subCol = "#ef4444";
        } else if (isActiveTurn && pv?.step === "TurnActionStep") {
          subTag = "👑 Đang đến lượt";
          subCol = "#fde047";
        } else if (
          (pv?.step === "ReactionWindowStep" ||
            pv?.step === "BlockChallengeStep") &&
          seat.hasPassedReaction
        ) {
          subTag = "✓ Cho qua";
          subCol = "#34d399";
        } else if (isMe && curMode === "match") {
          subTag = isCardsOpen ? "Chạm bài để úp kín" : "Chạm bài để xem";
          subCol = "#38bdf8";
        }

        if (subTag) {
          ctx.fillStyle = subCol;
          ctx.font = "bold 10px sans-serif";
          ctx.fillText(subTag, pos.x, plateY + 30);
        }

        ctx.restore();
      });

      // 7. Animated 2D Flying Gold Coins on Coin Transfer (`lastTransfer`)
      const transferElapsed =
        transferStartRef.current !== null
          ? (now - transferStartRef.current) / 1000
          : 999;

      if (curMode === "match" && pv?.lastTransfer && transferElapsed < 1.1) {
        const tr = pv.lastTransfer;
        const fromPos =
          tr.from === "treasury"
            ? { x: treasOriginX, y: treasOriginY }
            : seatPositions.get(tr.from) ?? { x: centerX, y: centerY };
        const toPos =
          tr.to === "treasury"
            ? { x: treasOriginX, y: treasOriginY }
            : seatPositions.get(tr.to) ?? { x: centerX, y: centerY };

        const coinCount = Math.min(7, Math.max(1, tr.amount));
        for (let c = 0; c < coinCount; c++) {
          const stagger = c * 0.08;
          const t = Math.max(
            0,
            Math.min(1, (transferElapsed - stagger) / 0.65)
          );
          if (t <= 0 || t >= 1) continue;
          const ease = 1 - Math.pow(1 - t, 3);
          const arcLift = Math.sin(ease * Math.PI) * 38;
          const cx = lerp(fromPos.x, toPos.x, ease);
          const cy = lerp(fromPos.y, toPos.y, ease) - arcLift;
          drawCoupCoin2D(ctx, cx, cy, 11);
        }
      }

      // 7.2. Animated 2D Card Exchange Effect (Court Deck <-> Ambassador Seat / Challenge Swap)
      const exchangeElapsed =
        exchangeStartRef.current !== null
          ? (now - exchangeStartRef.current) / 1000
          : 999;

      // 7.2a. Live Orbiting Mini-Cards & Dual Exchange Arc while Ambassador is in `ExchangePickStep`
      if (curMode === "match" && pv?.step === "ExchangePickStep") {
        const ambPos = seatPositions.get(pv.activeSeatNo);
        if (ambPos) {
          ctx.save();
          // Dual glowing chartreuse-lime exchange arcs between Court Deck and Ambassador's seat
          ctx.strokeStyle = "rgba(181, 219, 24, 0.65)";
          ctx.lineWidth = 2.2;
          ctx.setLineDash([7, 6]);
          ctx.lineDashOffset = -(now / 20);
          const midX = (deckOriginX + ambPos.x) * 0.5;
          const midY = (deckOriginY + ambPos.y) * 0.5;
          const dx = ambPos.x - deckOriginX;
          const dy = ambPos.y - deckOriginY;
          const len = Math.max(1, Math.hypot(dx, dy));
          const nx = -dy / len;
          const ny = dx / len;

          ctx.beginPath();
          ctx.moveTo(deckOriginX, deckOriginY);
          ctx.quadraticCurveTo(
            midX + nx * 36,
            midY + ny * 36,
            ambPos.x,
            ambPos.y
          );
          ctx.stroke();

          ctx.strokeStyle = "rgba(250, 204, 21, 0.55)";
          ctx.lineDashOffset = now / 20;
          ctx.beginPath();
          ctx.moveTo(ambPos.x, ambPos.y);
          ctx.quadraticCurveTo(
            midX - nx * 36,
            midY - ny * 36,
            deckOriginX,
            deckOriginY
          );
          ctx.stroke();
          ctx.setLineDash([]);

          // 2 Orbiting miniature 2D cards hovering around the Ambassador's seat
          for (let i = 0; i < 2; i++) {
            const ang = now / 340 + i * Math.PI;
            const ox = ambPos.x + Math.cos(ang) * 42;
            const oy = ambPos.y - 36 + Math.sin(ang) * 12;
            ctx.save();
            ctx.translate(ox, oy);
            ctx.rotate(Math.sin(ang) * 0.22);
            drawCoupCard2D(ctx, -13, -18, 26, 36, null, false, true);
            ctx.restore();
          }
          ctx.restore();
        }
      }

      // 7.2b. Triggered Card Flight & Central Court Deck Rifle-Shuffle Burst (`lastCardExchange`)
      if (
        curMode === "match" &&
        pv?.lastCardExchange &&
        exchangeElapsed < 1.65
      ) {
        const ex = pv.lastCardExchange;
        const seatPos = seatPositions.get(ex.seatNo) ?? {
          x: centerX,
          y: centerY,
        };
        const flyW = 40;
        const flyH = 56;
        const dx = seatPos.x - deckOriginX;
        const dy = seatPos.y - deckOriginY;
        const len = Math.max(1, Math.hypot(dx, dy));
        const nx = -dy / len;
        const ny = dx / len;

        ctx.save();

        if (ex.phase === "DRAW") {
          // 2 Cards flying out from Central Court Deck -> Ambassador's Seat
          const count = Math.max(1, ex.count);
          for (let i = 0; i < count; i++) {
            const stagger = i * 0.14;
            const t = Math.max(
              0,
              Math.min(1, (exchangeElapsed - stagger) / 0.72)
            );
            if (t <= 0 || t >= 1) continue;
            const ease = 1 - Math.pow(1 - t, 3);
            const curve = Math.sin(ease * Math.PI) * (36 + i * 14);
            const cx = lerp(deckOriginX, seatPos.x, ease) + nx * curve;
            const cy = lerp(deckOriginY, seatPos.y, ease) + ny * curve;
            const rot = (1 - ease) * (i % 2 === 0 ? -0.45 : 0.45);

            // Glowing chartreuse wake ring behind the flying card
            ctx.strokeStyle = `rgba(181, 219, 24, ${(1 - ease) * 0.75})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, 24 + ease * 10, 0, Math.PI * 2);
            ctx.stroke();

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rot);
            drawCoupCard2D(
              ctx,
              -flyW / 2,
              -flyH / 2,
              flyW,
              flyH,
              null,
              false,
              true
            );
            ctx.restore();
          }
        } else if (ex.phase === "RETURN") {
          // Full Round-Trip / Return Card Swap + Central Court Deck Rifle-Shuffle Fan Burst!
          const count = Math.max(1, ex.count);
          for (let i = 0; i < count; i++) {
            const stagger = i * 0.11;
            const t = Math.max(
              0,
              Math.min(1, (exchangeElapsed - stagger) / 0.76)
            );
            if (t > 0 && t < 1) {
              const ease = 1 - Math.pow(1 - t, 3);
              const curve = Math.sin(ease * Math.PI) * (40 + i * 12);

              // Outgoing card arc (Seat -> Court Deck)
              const retX = lerp(seatPos.x, deckOriginX, ease) - nx * curve;
              const retY = lerp(seatPos.y, deckOriginY, ease) - ny * curve;
              const rot = Math.sin(ease * Math.PI * 2) * 0.35;

              // Trail line
              ctx.strokeStyle = `rgba(181, 219, 24, ${(1 - ease) * 0.7})`;
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              ctx.moveTo(seatPos.x, seatPos.y);
              ctx.quadraticCurveTo(
                (seatPos.x + deckOriginX) * 0.5 - nx * curve,
                (seatPos.y + deckOriginY) * 0.5 - ny * curve,
                retX,
                retY
              );
              ctx.stroke();

              ctx.save();
              ctx.translate(retX, retY);
              ctx.rotate(rot);
              drawCoupCard2D(
                ctx,
                -flyW / 2,
                -flyH / 2,
                flyW,
                flyH,
                null,
                false,
                true
              );
              ctx.restore();

              // Simultaneous counter-arc card (Court Deck -> Seat) during first 0.65s so even quick Bot exchanges show a 2-way swap
              const drawX = lerp(deckOriginX, seatPos.x, ease) + nx * curve;
              const drawY = lerp(deckOriginY, seatPos.y, ease) + ny * curve;
              ctx.save();
              ctx.translate(drawX, drawY);
              ctx.rotate(-rot);
              drawCoupCard2D(
                ctx,
                -flyW / 2,
                -flyH / 2,
                flyW,
                flyH,
                null,
                false,
                true
              );
              ctx.restore();
            }
          }

          // Stage 2 (0.60s -> 1.65s): Central Court Deck 2D Rifle-Shuffle Fan & Shockwave Ring
          if (exchangeElapsed > 0.58) {
            const shufT = Math.min(1, (exchangeElapsed - 0.58) / 1.02);
            const fanSpread = Math.sin(shufT * Math.PI * 2) * (1 - shufT) * 28;

            // Expanding chartreuse-gold shockwave ring around the Court Deck
            ctx.strokeStyle = `rgba(181, 219, 24, ${(1 - shufT) * 0.85})`;
            ctx.lineWidth = 2.8 * (1 - shufT * 0.5);
            ctx.beginPath();
            ctx.arc(deckOriginX, deckOriginY, 22 + shufT * 58, 0, Math.PI * 2);
            ctx.stroke();

            // 3 Fanned 2D Cards shuffling in place on top of the Court Deck
            for (const dir of [-1, 0, 1]) {
              ctx.save();
              ctx.translate(deckOriginX + dir * fanSpread, deckOriginY);
              ctx.rotate(dir * (fanSpread / 72));
              drawCoupCard2D(
                ctx,
                -24,
                -33,
                48,
                66,
                null,
                false,
                dir === 0
              );
              ctx.restore();
            }

            // Floating 2D Banner above the Court Deck
            const badgeAlpha = Math.min(1, (1 - shufT) * 2.2);
            ctx.save();
            ctx.globalAlpha = badgeAlpha;
            const badgeY = deckOriginY - 52 - shufT * 14;
            drawRoundedRect(ctx, deckOriginX - 74, badgeY - 12, 148, 24, 12);
            ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
            ctx.fill();
            ctx.strokeStyle = "#b5db18";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = "#d9f99d";
            ctx.font = "bold 10.5px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🔄 ĐÃ TRÁO BÀI ĐẠI SỨ", deckOriginX, badgeY);
            ctx.restore();
          }
        } else if (ex.phase === "CHALLENGE_SWAP") {
          // Stage 1 (0.0s -> 0.78s): Proven face-up card flies from truthful player's seat to Court Deck
          // Stage 2 (0.78s -> 1.65s): Court Deck shuffles and deals a new secret card back to the player's seat
          if (exchangeElapsed < 0.78) {
            const t = exchangeElapsed / 0.78;
            const ease = 1 - Math.pow(1 - t, 3);
            const curve = Math.sin(ease * Math.PI) * 38;
            const cx = lerp(seatPos.x, deckOriginX, ease) - nx * curve;
            const cy = lerp(seatPos.y, deckOriginY, ease) - ny * curve;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate((1 - ease) * 0.25);
            drawCoupCard2D(
              ctx,
              -flyW / 2,
              -flyH / 2,
              flyW,
              flyH,
              ex.revealedCharacter ?? null,
              false,
              true
            );
            ctx.restore();
          } else {
            const t = Math.min(1, (exchangeElapsed - 0.78) / 0.85);
            const ease = 1 - Math.pow(1 - t, 3);
            const curve = Math.sin(ease * Math.PI) * 38;
            const cx = lerp(deckOriginX, seatPos.x, ease) + nx * curve;
            const cy = lerp(deckOriginY, seatPos.y, ease) + ny * curve;

            // Deck shuffle ring
            ctx.strokeStyle = `rgba(250, 204, 21, ${(1 - t) * 0.85})`;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(deckOriginX, deckOriginY, 22 + t * 50, 0, Math.PI * 2);
            ctx.stroke();

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate((1 - ease) * -0.3);
            drawCoupCard2D(
              ctx,
              -flyW / 2,
              -flyH / 2,
              flyW,
              flyH,
              null,
              false,
              true
            );
            ctx.restore();
          }
        }

        ctx.restore();
      }

      // 7.5. Bottom-Left Large 2D Hand Dock (Shows Viewer's 2 Influence Cards in High Detail)
      if (curMode === "match" && pv && curViewerSeatNo !== null) {
        const mySeat = pv.seats.find((s) => s.seatNo === curViewerSeatNo);
        if (mySeat) {
          const bigW = width < 560 ? 74 : 98;
          const bigH = width < 560 ? 104 : 138;
          const dockPad = 10;
          const dockW = bigW * 2 + dockPad * 3;
          const dockH = bigH + 34;
          const dockX = 14;
          const dockY = height - dockH - 14;

          newHitRegions.push({
            id: "my-hand-dock",
            shape: "rect",
            x: dockX,
            y: dockY,
            width: dockW,
            height: dockH,
            cursor: "pointer",
            data: { type: "toggle-my-cards" },
          });

          ctx.save();
          drawRoundedRect(ctx, dockX, dockY, dockW, dockH, 16);
          ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
          ctx.fill();
          ctx.strokeStyle = "rgba(192, 132, 252, 0.45)";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = "#e2e8f0";
          ctx.font = "bold 10.5px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            isCardsOpen
              ? "2 LÁ BÀI CỦA BẠN (Chạm để úp)"
              : "2 LÁ BÀI BÍ MẬT (Chạm để xem)",
            dockX + dockW / 2,
            dockY + 14
          );

          mySeat.cards.forEach((c, idx) => {
            const cxCard = dockX + dockPad + idx * (bigW + dockPad);
            const cyCard = dockY + 26;
            const charToDraw =
              c.revealed || isCardsOpen ? c.character : null;
            drawCoupCard2D(
              ctx,
              cxCard,
              cyCard,
              bigW,
              bigH,
              charToDraw,
              c.revealed,
              false
            );
          });
          ctx.restore();
        }
      }

      // 8. Interactive 2D Canvas Overlay for `LoseInfluenceStep` (When YOU must pick a card to lose)
      if (
        curMode === "match" &&
        pv?.step === "LoseInfluenceStep" &&
        pv.activeLossTarget?.seatNo === curViewerSeatNo
      ) {
        const mySeat = pv.seats.find((s) => s.seatNo === curViewerSeatNo);
        if (mySeat) {
          ctx.save();
          ctx.fillStyle = "rgba(2, 6, 23, 0.82)";
          ctx.fillRect(0, 0, width, height);

          const modalW = Math.min(width - 24, 380);
          const modalH = 290;
          const modalX = (width - modalW) / 2;
          const modalY = (height - modalH) / 2;

          drawRoundedRect(ctx, modalX, modalY, modalW, modalH, 22);
          ctx.fillStyle = "#0f172a";
          ctx.fill();
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#fca5a5";
          ctx.font = "bold 13px sans-serif";
          ctx.fillText(
            "CHỌN 1 LÁ BÀI QUYỀN LỰC ĐỂ LẬT BỎ",
            centerX,
            modalY + 28
          );

          ctx.fillStyle = "#cbd5e1";
          ctx.font = "11.5px sans-serif";
          ctx.fillText(
            pv.activeLossTarget.reasonVi,
            centerX,
            modalY + 50
          );

          const bigW = 104;
          const bigH = 144;
          const gap = 28;
          const startX = centerX - (bigW * 2 + gap) / 2;
          const cardY = modalY + 74;

          mySeat.cards.forEach((card, idx) => {
            const cxCard = startX + idx * (bigW + gap);
            const canPick = !card.revealed;

            if (canPick) {
              newHitRegions.push({
                id: `lose-card-${idx}`,
                shape: "rect",
                x: cxCard,
                y: cardY,
                width: bigW,
                height: bigH,
                cursor: "pointer",
                data: { type: "lose-card", cardIndex: idx },
              });
            }

            drawCoupCard2D(
              ctx,
              cxCard,
              cardY,
              bigW,
              bigH,
              card.character,
              card.revealed,
              canPick
            );

            ctx.fillStyle = canPick ? "#fde047" : "#64748b";
            ctx.font = "bold 11px sans-serif";
            ctx.fillText(
              canPick ? "Chạm để bỏ lá này" : "Đã mất",
              cxCard + bigW / 2,
              cardY + bigH + 22
            );
          });

          ctx.restore();
        }
      }

      // 9. Interactive 2D Canvas Overlay for `ExchangePickStep` (Ambassador chooses cards on 2D Canvas)
      if (
        curMode === "match" &&
        pv?.step === "ExchangePickStep" &&
        pv.activeSeatNo === curViewerSeatNo &&
        pv.exchangePool.length > 0
      ) {
        ctx.save();
        ctx.fillStyle = "rgba(2, 6, 23, 0.84)";
        ctx.fillRect(0, 0, width, height);

        const pool = pv.exchangePool;
        const keepCount = pv.exchangeKeepCount;
        const modalW = Math.min(width - 20, 510);
        const modalH = 336;
        const modalX = (width - modalW) / 2;
        const modalY = (height - modalH) / 2;

        const modalElapsed =
          exchangeModalStartRef.current !== null
            ? (now - exchangeModalStartRef.current) / 1000
            : 999;

        drawRoundedRect(ctx, modalX, modalY, modalW, modalH, 22);
        ctx.fillStyle = "#0f172a";
        ctx.fill();
        ctx.strokeStyle = "#b5db18";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#d9f99d";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(
          `🔄 ĐẠI SỨ ĐỔI BÀI • CHỌN GIỮ LẠI ĐÚNG ${keepCount} LÁ BÀI`,
          centerX,
          modalY + 26
        );

        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px sans-serif";
        ctx.fillText(
          "Chạm vào lá bài để chuyển đổi giữa [Giữ trên tay] và [Trả về Bộ bài]",
          centerX,
          modalY + 45
        );

        const cW = width < 520 ? 74 : 92;
        const cH = width < 520 ? 106 : 128;
        const gap = 16;
        const totalRowW = pool.length * cW + (pool.length - 1) * gap;
        const startX = centerX - totalRowW / 2;
        const baseCardY = modalY + 76;

        // Origin point at top-center of modal for initial card deal & flip
        const dealFromX = centerX - cW / 2;
        const dealFromY = modalY + 14;

        pool.forEach((ch, idx) => {
          const targetX = startX + idx * (cW + gap);
          const isPicked = curExchangeSel.includes(idx);

          // Smoothly interpolate per-card lift progress (0 = return to deck, 1 = keep in hand)
          const curLift = cardLiftProgressRef.current[idx] ?? (isPicked ? 1 : 0);
          const nextLift = lerp(
            curLift,
            isPicked ? 1 : 0,
            Math.min(1, dt * 12)
          );
          cardLiftProgressRef.current[idx] = nextLift;

          // Staggered deal & 2D horizontal card-flip animation when modal opens
          const stagger = idx * 0.1;
          const dealT = Math.max(
            0,
            Math.min(1, (modalElapsed - stagger) / 0.52)
          );
          const dealEase = 1 - Math.pow(1 - dealT, 3);

          const liftOffsetY = lerp(8, -14, nextLift);
          const cxCard = lerp(dealFromX, targetX, dealEase);
          const cyCard = lerp(dealFromY, baseCardY + liftOffsetY, dealEase);

          // 2D horizontal flip from royal card back (cos < 0) to face-up portrait (cos >= 0)
          const flipAngle = (1 - dealEase) * Math.PI;
          const flipScaleX = Math.max(0.08, Math.abs(Math.cos(flipAngle)));
          const showFront = dealEase >= 0.5;
          const cardScale = lerp(0.96, 1.04, nextLift);

          newHitRegions.push({
            id: `exchange-card-${idx}`,
            shape: "rect",
            x: targetX,
            y: baseCardY - 16,
            width: cW,
            height: cH + 46,
            cursor: "pointer",
            data: { type: "toggle-exchange-card", index: idx, keepCount },
          });

          ctx.save();
          // Pulsing chartreuse-lime glow behind cards selected to keep
          if (nextLift > 0.2) {
            ctx.shadowColor = "rgba(181, 219, 24, 0.65)";
            ctx.shadowBlur = 16 * nextLift;
          }

          ctx.translate(cxCard + cW / 2, cyCard + cH / 2);
          ctx.scale(flipScaleX * cardScale, cardScale);
          ctx.globalAlpha = lerp(0.76, 1, nextLift);

          drawCoupCard2D(
            ctx,
            -cW / 2,
            -cH / 2,
            cW,
            cH,
            showFront ? ch : null,
            false,
            isPicked
          );
          ctx.restore();

          // 2D Selection Badge below each card
          const badgeY = cyCard + cH + 8;
          drawRoundedRect(
            ctx,
            targetX + cW * 0.06,
            badgeY,
            cW * 0.88,
            21,
            10
          );
          ctx.fillStyle = isPicked ? "#65a30d" : "#1e293b";
          ctx.fill();
          ctx.strokeStyle = isPicked ? "#d9f99d" : "#475569";
          ctx.lineWidth = 1.1;
          ctx.stroke();

          ctx.fillStyle = isPicked ? "#ffffff" : "#94a3b8";
          ctx.font = "bold 10px sans-serif";
          ctx.fillText(
            isPicked ? "⬆ GIỮ LẠI" : "↩ Trả bộ bài",
            targetX + cW / 2,
            badgeY + 10.5
          );
        });

        // 2D Confirm Exchange Button on Canvas
        const btnW = 230;
        const btnH = 40;
        const btnX = centerX - btnW / 2;
        const btnY = modalY + modalH - 54;
        const canSubmit = curExchangeSel.length === keepCount;

        if (canSubmit) {
          newHitRegions.push({
            id: "confirm-exchange-btn",
            shape: "rect",
            x: btnX,
            y: btnY,
            width: btnW,
            height: btnH,
            cursor: "pointer",
            data: { type: "submit-exchange" },
          });
        }

        drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 12);
        ctx.fillStyle = canSubmit ? "#b5db18" : "#334155";
        ctx.fill();
        ctx.fillStyle = canSubmit ? "#1a2e05" : "#94a3b8";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(
          `🔄 XÁC NHẬN ĐỔI BÀI (${curExchangeSel.length}/${keepCount} LÁ)`,
          centerX,
          btnY + btnH / 2
        );

        ctx.restore();
      }

      ctx.restore();
      hitRegionsRef.current = newHitRegions;
      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  const getLogicalCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getLogicalCoords(e);
    const region = findHitRegionAtPoint(hitRegionsRef.current, x, y);
    hoveredRegionIdRef.current = region?.id ?? null;
    canvas.style.cursor = region?.cursor ?? "default";
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getLogicalCoords(e);
    const region = findHitRegionAtPoint(hitRegionsRef.current, x, y);
    if (!region || !region.data) return;

    const d = region.data;
    if (d.type === "seat") {
      if (d.disabled) return;
      stateRef.current.onSelectSeat(d.seatNo);
    } else if (d.type === "toggle-my-cards") {
      stateRef.current.onToggleCardsRevealed();
    } else if (d.type === "lose-card") {
      stateRef.current.onDispatchCommand({
        type: "LOSE_INFLUENCE",
        cardIndex: d.cardIndex,
      });
    } else if (d.type === "toggle-exchange-card") {
      const idx = d.index as number;
      const keepCount = d.keepCount as number;
      stateRef.current.setExchangeSelected((prev) => {
        if (prev.includes(idx)) {
          return prev.filter((item) => item !== idx);
        }
        if (prev.length >= keepCount) {
          return [...prev.slice(1), idx];
        }
        return [...prev, idx];
      });
    } else if (d.type === "submit-exchange") {
      stateRef.current.onDispatchCommand({
        type: "EXCHANGE_KEEP",
        keepIndices: stateRef.current.exchangeSelected,
      });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[640px] select-none overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="block w-full h-full"
      />
    </div>
  );
}
