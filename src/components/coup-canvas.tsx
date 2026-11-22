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
  drawCoupCard2D,
  drawCoupCenterTreasuryAndDeck2D,
  drawCoupCoin2D,
  drawCoupCoinStack2D,
} from "@/canvas/coup-cards";
import { computeCardDealProgress } from "@/canvas/role-cards";
import {
  ACTION_LABEL_VI,
  COUP_CHARACTER_META,
  type CoupCommand,
  type CoupPlayerView,
} from "@/cartridges/coup";
import type { LobbySeatItem } from "@/components/werewolf-canvas";

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
    } else {
      lastMatchKeyRef.current = "";
      dealStartRef.current = null;
      lastTransferKeyRef.current = "";
      transferStartRef.current = null;
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

      // 1. Royal Court Background Gradient
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.46,
        30,
        width * 0.5,
        height * 0.46,
        Math.max(width, height) * 0.78
      );
      bgGrad.addColorStop(0, "#1e1b4b");
      bgGrad.addColorStop(0.55, "#0f172a");
      bgGrad.addColorStop(1, "#020617");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const centerX = width * 0.5;
      const centerY = height * 0.47;
      const tableRx = Math.min(width * 0.36, 305);
      const tableRy = Math.min(height * 0.32, 210);

      // 2. Royal Velvet Table Oval & Double Gold Filigree Rim
      const tableGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        15,
        centerX,
        centerY,
        Math.max(tableRx, tableRy)
      );
      tableGrad.addColorStop(0, "rgba(88, 28, 135, 0.34)");
      tableGrad.addColorStop(0.75, "rgba(15, 23, 42, 0.72)");
      tableGrad.addColorStop(1, "rgba(15, 23, 42, 0)");
      ctx.fillStyle = tableGrad;
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY,
        tableRx * 1.04,
        tableRy * 1.04,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.strokeStyle = "rgba(245, 158, 11, 0.36)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, tableRx, tableRy, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(251, 191, 36, 0.16)";
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY,
        tableRx * 0.86,
        tableRy * 0.86,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.setLineDash([]);

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

      const cardW = width < 560 ? 38 : 46;
      const cardH = width < 560 ? 54 : 64;
      const deckOriginX = centerX - 72;
      const deckOriginY = centerY;
      const treasOriginX = centerX + 74;
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
        const coinStackX = pos.x + cardW + 16;
        const coinStackY = pos.y + 4;
        drawCoupCoinStack2D(ctx, coinStackX, coinStackY, seat.coins, 10);

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

      // 7.5. Bottom-Left Large 2D Hand Dock (Shows Viewer's 2 Influence Cards in High Detail)
      if (curMode === "match" && pv && curViewerSeatNo !== null) {
        const mySeat = pv.seats.find((s) => s.seatNo === curViewerSeatNo);
        if (mySeat) {
          const bigW = width < 560 ? 64 : 84;
          const bigH = width < 560 ? 92 : 120;
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
        const modalW = Math.min(width - 20, 490);
        const modalH = 310;
        const modalX = (width - modalW) / 2;
        const modalY = (height - modalH) / 2;

        drawRoundedRect(ctx, modalX, modalY, modalW, modalH, 22);
        ctx.fillStyle = "#0f172a";
        ctx.fill();
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#6ee7b7";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(
          `ĐẠI SỨ ĐỔI BÀI • CHỌN GIỮ LẠI ĐÚNG ${keepCount} LÁ BÀI`,
          centerX,
          modalY + 28
        );

        const cW = width < 520 ? 74 : 92;
        const cH = width < 520 ? 106 : 128;
        const gap = 14;
        const totalRowW = pool.length * cW + (pool.length - 1) * gap;
        const startX = centerX - totalRowW / 2;
        const cardY = modalY + 58;

        pool.forEach((ch, idx) => {
          const cxCard = startX + idx * (cW + gap);
          const isPicked = curExchangeSel.includes(idx);

          newHitRegions.push({
            id: `exchange-card-${idx}`,
            shape: "rect",
            x: cxCard,
            y: cardY,
            width: cW,
            height: cH,
            cursor: "pointer",
            data: { type: "toggle-exchange-card", index: idx, keepCount },
          });

          drawCoupCard2D(
            ctx,
            cxCard,
            cardY,
            cW,
            cH,
            ch,
            false,
            isPicked
          );

          // 2D Selection Badge below each card
          drawRoundedRect(
            ctx,
            cxCard + cW * 0.1,
            cardY + cH + 8,
            cW * 0.8,
            20,
            10
          );
          ctx.fillStyle = isPicked ? "#059669" : "#1e293b";
          ctx.fill();
          ctx.fillStyle = isPicked ? "#ffffff" : "#94a3b8";
          ctx.font = "bold 10px sans-serif";
          ctx.fillText(
            isPicked ? "✓ GIỮ LẠI" : "Trả về bộ bài",
            cxCard + cW / 2,
            cardY + cH + 18
          );
        });

        // 2D Confirm Exchange Button on Canvas
        const btnW = 210;
        const btnH = 38;
        const btnX = centerX - btnW / 2;
        const btnY = modalY + modalH - 52;
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
        ctx.fillStyle = canSubmit ? "#10b981" : "#334155";
        ctx.fill();
        ctx.fillStyle = canSubmit ? "#022c22" : "#94a3b8";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(
          `XÁC NHẬN GIỮ ${curExchangeSel.length}/${keepCount} LÁ`,
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
    <div className="relative w-full h-full min-h-[500px] select-none overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="block w-full h-full"
      />
    </div>
  );
}
