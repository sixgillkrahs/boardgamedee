"use client";

import React, { useEffect, useRef } from "react";
import {
  drawRoundedRect,
  findHitRegionAtPoint,
  lerp,
  ParticleSystem,
  type HitRegion,
} from "@/canvas/engine";
import {
  drawSplendorPixelBackground2D,
  drawSplendorPixelCard2D,
  drawSplendorPixelDeck2D,
  drawSplendorPixelGemIcon2D,
  drawSplendorPixelGemToken2D,
  drawSplendorPixelNoble2D,
} from "@/canvas/splendor-art";
import {
  computeCardPayment,
  SPLENDOR_GEM_META,
  SPLENDOR_GEMS,
  SPLENDOR_TOKEN_COLORS,
  type SplendorCardTier,
  type SplendorCommand,
  type SplendorGemColor,
  type SplendorPlayerView,
  type SplendorTokenColor,
} from "@/cartridges/splendor";
import type { LobbySeatItem } from "@/components/werewolf-canvas";

export type SplendorSelection =
  | { kind: "market"; tier: SplendorCardTier; slotIndex: number }
  | { kind: "deck"; tier: SplendorCardTier }
  | { kind: "reserved"; reservedIndex: number }
  | null;

export function SplendorGemIconCanvas({
  color,
  size = 20,
  className = "",
}: {
  color: SplendorTokenColor;
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
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, size, size);
    drawSplendorPixelGemIcon2D(ctx, size * 0.5, size * 0.5, size * 0.9, color);
    ctx.restore();
  }, [color, size]);

  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size }}
      className={`inline-block shrink-0 ${className}`}
    />
  );
}

interface SplendorCanvasProps {
  mode: "lobby" | "match";
  lobbySeats: LobbySeatItem[];
  viewerSeatNo: number | null;
  playerView: SplendorPlayerView | null;
  selectedGems: SplendorGemColor[];
  onClickGemSupply: (gem: SplendorGemColor) => void;
  selection: SplendorSelection;
  onSelectCardOrDeck: (sel: SplendorSelection) => void;
  onDispatchCommand: (cmd: SplendorCommand) => void;
}

export function SplendorCanvas({
  mode,
  lobbySeats,
  viewerSeatNo,
  playerView,
  selectedGems,
  onClickGemSupply,
  selection,
  onSelectCardOrDeck,
  onDispatchCommand,
}: SplendorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hitRegionsRef = useRef<HitRegion[]>([]);
  const particlesRef = useRef<ParticleSystem>(new ParticleSystem());

  const lastEffectSeqRef = useRef<number>(0);
  const effectStartRef = useRef<number | null>(null);

  const stateRef = useRef({
    mode,
    lobbySeats,
    viewerSeatNo,
    playerView,
    selectedGems,
    onClickGemSupply,
    selection,
    onSelectCardOrDeck,
    onDispatchCommand,
  });

  useEffect(() => {
    stateRef.current = {
      mode,
      lobbySeats,
      viewerSeatNo,
      playerView,
      selectedGems,
      onClickGemSupply,
      selection,
      onSelectCardOrDeck,
      onDispatchCommand,
    };

    if (
      mode === "match" &&
      playerView?.lastVisualEffect &&
      playerView.lastVisualEffect.seq !== lastEffectSeqRef.current
    ) {
      lastEffectSeqRef.current = playerView.lastVisualEffect.seq;
      effectStartRef.current = performance.now();
    } else if (mode !== "match") {
      lastEffectSeqRef.current = 0;
      effectStartRef.current = null;
    }
  }, [
    mode,
    lobbySeats,
    viewerSeatNo,
    playerView,
    selectedGems,
    onClickGemSupply,
    selection,
    onSelectCardOrDeck,
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
      canvas.width = Math.max(300, Math.floor(rect.width * dpr));
      canvas.height = Math.max(380, Math.floor(rect.height * dpr));
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
        selectedGems: curSelectedGems,
        selection: curSel,
      } = stateRef.current;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false;

      // 1. 16-Bit Pixel Art Renaissance Guildhall & Emerald Velvet Workbench Background
      drawSplendorPixelBackground2D(ctx, width, height, now);

      // Ambient shimmering gold pixel motes
      const particles = particlesRef.current;
      if (Math.random() < 0.22) {
        particles.spawn({
          x: Math.random() * width,
          y: height * 0.25 + Math.random() * height * 0.65,
          vx: (Math.random() - 0.5) * 10,
          vy: -8 - Math.random() * 12,
          radius: 1.5,
          color: Math.random() > 0.35 ? "#fde047" : "#6ee7b7",
          life: 1.2 + Math.random() * 1.1,
          maxLife: 2.3,
        });
      }
      particles.update(dt);
      particles.draw(ctx);

      const newHitRegions: HitRegion[] = [];

      // 2. Lobby Mode Display
      if (curMode === "lobby" || !pv) {
        const boxW = Math.min(width - 28, 480);
        const boxH = Math.min(height - 40, 260);
        const boxX = (width - boxW) / 2;
        const boxY = (height - boxH) / 2 + 12;

        drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 16);
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.fill();
        ctx.strokeStyle = "#eab308";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fde047";
        ctx.font = `900 ${width < 480 ? 15 : 18}px monospace`;
        ctx.fillText(
          `SẢNH CHỜ SPLENDOR (${curLobbySeats.length}/4)`,
          width / 2,
          boxY + 34
        );

        // Draw the 6 Pixel-Art Gem Tokens across the lobby showcase
        const tokenR = width < 480 ? 16 : 22;
        const gap = width < 480 ? 44 : 62;
        const startTx = width / 2 - ((SPLENDOR_TOKEN_COLORS.length - 1) * gap) / 2;
        SPLENDOR_TOKEN_COLORS.forEach((col, i) => {
          drawSplendorPixelGemToken2D(
            ctx,
            startTx + i * gap,
            boxY + 94,
            tokenR,
            col
          );
        });

        // List seated merchants
        const seatStartY = boxY + 148;
        curLobbySeats.forEach((s, idx) => {
          const sy = seatStartY + idx * 24;
          if (sy > boxY + boxH - 14) return;
          ctx.fillStyle = s.seatNo === curViewerSeatNo ? "#6ee7b7" : "#e2e8f0";
          ctx.font = "bold 12px monospace";
          ctx.fillText(
            `${s.displayName}${s.seatNo === curViewerSeatNo ? " (Bạn)" : ""}`,
            width / 2,
            sy
          );
        });

        ctx.restore();
        hitRegionsRef.current = newHitRegions;
        rafId = requestAnimationFrame(renderFrame);
        return;
      }

      // 3. Match Mode Responsive Layout Metrics
      const isCompact = width < 640;
      const mySeat =
        pv.seats.find((s) => s.seatNo === curViewerSeatNo) ?? null;
      const isMyTurn =
        pv.step === "TurnActionStep" && pv.activeSeatNo === curViewerSeatNo;

      const padX = isCompact ? 10 : 18;
      const topNobleY = isCompact ? 12 : 16;
      const nobleSize = Math.max(
        48,
        Math.min(72, Math.floor((height * 0.125)))
      );

      // Reserve bottom strip for player benches (2-4 seats)
      const benchH = isCompact ? 92 : 112;
      const benchY = height - benchH - 8;

      // Supply column on right side of canvas
      const supplyColW = isCompact ? 56 : 76;
      const supplyCenterX = width - padX - supplyColW / 2;

      // Market grid area (between nobles and player benches, left of supply column)
      const marketTopY = topNobleY + nobleSize + (isCompact ? 10 : 14);
      const marketAvailH = Math.max(150, benchY - marketTopY - 10);
      const marketAvailW = Math.max(200, width - padX * 2 - supplyColW - 12);

      const rowGap = isCompact ? 6 : 10;
      const colGap = isCompact ? 6 : 10;
      const cardH = Math.max(
        56,
        Math.min(118, Math.floor((marketAvailH - rowGap * 2) / 3))
      );
      const cardW = Math.max(
        44,
        Math.min(
          Math.round(cardH * 0.74),
          Math.floor((marketAvailW - colGap * 4) / 5)
        )
      );
      const gridTotalW = cardW * 5 + colGap * 4;
      const gridStartX =
        padX + Math.max(0, Math.floor((marketAvailW - gridTotalW) / 2));

      // 4. Top Row: Noble Tiles + Timer / Round Status Pill
      const noblesGap = isCompact ? 8 : 14;
      const noblesTotalW =
        pv.nobles.length * nobleSize +
        Math.max(0, pv.nobles.length - 1) * noblesGap;
      const noblesStartX =
        gridStartX + Math.max(0, (gridTotalW - noblesTotalW) / 2);

      pv.nobles.forEach((noble, idx) => {
        const nx = noblesStartX + idx * (nobleSize + noblesGap);
        const ny = topNobleY;
        const isEligible = pv.eligibleNobleIds.includes(noble.id);

        if (pv.step === "NoblePickStep" && isEligible) {
          newHitRegions.push({
            id: `noble-${noble.id}`,
            shape: "rect",
            x: nx,
            y: ny,
            width: nobleSize,
            height: nobleSize,
            cursor: "pointer",
            data: { type: "pick-noble", nobleId: noble.id },
          });
        }

        drawSplendorPixelNoble2D(ctx, nx, ny, nobleSize, noble, isEligible);
      });

      // Top-Right Compact Round & Countdown Pill
      let remSec: number | null = null;
      if (pv.phaseDeadlineMs) {
        remSec = Math.max(
          0,
          Math.ceil((pv.phaseDeadlineMs - Date.now()) / 1000)
        );
      }
      const badgeW = isCompact ? 68 : 82;
      const badgeH = isCompact ? 42 : 48;
      const badgeX = width - padX - badgeW;
      const badgeY = topNobleY + 4;
      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 10);
      ctx.fillStyle = pv.finalRoundTriggered
        ? "rgba(127, 29, 29, 0.92)"
        : "rgba(15, 23, 42, 0.9)";
      ctx.fill();
      ctx.strokeStyle = pv.finalRoundTriggered ? "#ef4444" : "#eab308";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = pv.finalRoundTriggered ? "#fca5a5" : "#fde047";
      ctx.font = `bold ${isCompact ? 9 : 10}px monospace`;
      ctx.fillText(
        pv.finalRoundTriggered ? "VÒNG CUỐI!" : `VÒNG ${pv.roundNumber}`,
        badgeX + badgeW / 2,
        badgeY + 14
      );
      ctx.fillStyle =
        remSec !== null && remSec <= 5 ? "#fca5a5" : "#f8fafc";
      ctx.font = `900 ${isCompact ? 14 : 16}px monospace`;
      ctx.fillText(
        pv.step === "Finished" ? "XONG" : remSec !== null ? `${remSec}s` : "--",
        badgeX + badgeW / 2,
        badgeY + badgeH - 15
      );

      // 5. Center Market Grid: 3 Rows (Tier 3 Top, Tier 2 Mid, Tier 1 Bottom)
      const tiers: SplendorCardTier[] = [3, 2, 1];
      const marketSlotCenters = new Map<string, { x: number; y: number }>();

      tiers.forEach((tier, rowIdx) => {
        const ry = marketTopY + rowIdx * (cardH + rowGap);

        // Column 0: Tier Deck Stack (clickable to blind-reserve)
        const deckX = gridStartX;
        const deckSelected = curSel?.kind === "deck" && curSel.tier === tier;
        const canReserveDeck =
          isMyTurn &&
          pv.deckCounts[tier] > 0 &&
          (mySeat?.reservedCards.length ?? 0) < 3;

        if (canReserveDeck) {
          newHitRegions.push({
            id: `deck-${tier}`,
            shape: "rect",
            x: deckX,
            y: ry,
            width: cardW,
            height: cardH,
            cursor: "pointer",
            data: { type: "select-deck", tier },
          });
        }

        drawSplendorPixelDeck2D(
          ctx,
          deckX,
          ry,
          cardW,
          cardH,
          tier,
          pv.deckCounts[tier],
          deckSelected
        );

        // Columns 1..4: 4 Face-Up Development Cards
        pv.market[tier].forEach((card, slotIdx) => {
          const cxCard = gridStartX + (slotIdx + 1) * (cardW + colGap);
          marketSlotCenters.set(`${tier}-${slotIdx}`, {
            x: cxCard + cardW / 2,
            y: ry + cardH / 2,
          });

          if (!card) {
            drawRoundedRect(ctx, cxCard, ry, cardW, cardH, 6);
            ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
            ctx.lineWidth = 1;
            ctx.stroke();
            return;
          }

          const affordable =
            mySeat !== null && computeCardPayment(mySeat, card).affordable;
          const isSelected =
            curSel?.kind === "market" &&
            curSel.tier === tier &&
            curSel.slotIndex === slotIdx;

          if (isMyTurn) {
            newHitRegions.push({
              id: `market-${tier}-${slotIdx}`,
              shape: "rect",
              x: cxCard,
              y: ry,
              width: cardW,
              height: cardH,
              cursor: "pointer",
              data: { type: "select-market", tier, slotIndex: slotIdx },
            });
          }

          drawSplendorPixelCard2D(ctx, cxCard, ry, cardW, cardH, card, {
            affordable: isMyTurn && affordable,
            selected: isSelected,
          });
        });
      });

      // 6. Right Supply Column: 6 Pixel-Art Gem Token Stacks (White, Blue, Green, Red, Black, Gold)
      const tokenPositions = new Map<
        SplendorTokenColor,
        { x: number; y: number }
      >();
      const supplyTopY = marketTopY + 12;
      const supplySpanH = Math.max(180, marketAvailH - 18);
      const tokenStepY = supplySpanH / 6;
      const tokenR = Math.max(
        13,
        Math.min(23, Math.floor(Math.min(supplyColW * 0.36, tokenStepY * 0.42)))
      );

      SPLENDOR_TOKEN_COLORS.forEach((col, idx) => {
        const ty = supplyTopY + idx * tokenStepY + tokenStepY * 0.35;
        tokenPositions.set(col, { x: supplyCenterX, y: ty });
        const qty = pv.supply[col];
        const isGold = col === "gold";
        const selCount = isGold
          ? 0
          : curSelectedGems.filter((g) => g === col).length;

        if (isMyTurn && !isGold && qty > 0) {
          newHitRegions.push({
            id: `supply-${col}`,
            shape: "circle",
            x: supplyCenterX,
            y: ty,
            radius: tokenR + 6,
            cursor: "pointer",
            data: { type: "click-gem", gem: col },
          });
        }

        drawSplendorPixelGemToken2D(
          ctx,
          supplyCenterX,
          ty,
          tokenR,
          col,
          qty,
          selCount > 0,
          qty <= 0
        );

        // Selected quantity indicator badge (`+1` or `+2`) above selected token stack
        if (selCount > 0) {
          drawRoundedRect(
            ctx,
            supplyCenterX - tokenR - 6,
            ty - tokenR - 4,
            24,
            16,
            8
          );
          ctx.fillStyle = "#fde047";
          ctx.fill();
          ctx.fillStyle = "#0f172a";
          ctx.font = "900 10px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`+${selCount}`, supplyCenterX - tokenR + 6, ty - tokenR + 4);
        }
      });

      // 7. Bottom Strip: Player Workbenches (2–4 Players)
      const seatCount = pv.seats.length;
      const benchGap = isCompact ? 6 : 10;
      const singleBenchW = Math.floor(
        (width - padX * 2 - benchGap * (seatCount - 1)) / Math.max(1, seatCount)
      );
      const seatCenters = new Map<number, { x: number; y: number }>();

      pv.seats.forEach((seat, idx) => {
        const bx = padX + idx * (singleBenchW + benchGap);
        const by = benchY;
        seatCenters.set(seat.seatNo, {
          x: bx + singleBenchW / 2,
          y: by + benchH / 2,
        });

        const isMe = seat.seatNo === curViewerSeatNo;
        const isActive = seat.seatNo === pv.activeSeatNo && pv.step !== "Finished";
        const isWinner = pv.winnerSeatNos.includes(seat.seatNo);

        drawRoundedRect(ctx, bx, by, singleBenchW, benchH, 12);
        ctx.fillStyle = isWinner
          ? "rgba(113, 63, 18, 0.85)"
          : isActive
            ? "rgba(30, 41, 59, 0.96)"
            : "rgba(15, 23, 42, 0.88)";
        ctx.fill();
        ctx.strokeStyle = isWinner
          ? "#fde047"
          : isActive
            ? "#f59e0b"
            : isMe
              ? "#38bdf8"
              : "#334155";
        ctx.lineWidth = isActive || isWinner ? 2.4 : 1.3;
        ctx.stroke();

        // Top row of bench: Name + Prestige Points (`★ 12/15`) + Token count (`6/10`)
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isActive
          ? "#fde047"
          : isMe
            ? "#7dd3fc"
            : "#f8fafc";
        ctx.font = `bold ${isCompact ? 10 : 11.5}px sans-serif`;
        const label = isMe ? `${seat.displayName} (Bạn)` : seat.displayName;
        ctx.fillText(
          label.length > 14 ? `${label.slice(0, 13)}…` : label,
          bx + 8,
          by + 15
        );

        ctx.textAlign = "right";
        ctx.fillStyle = "#fde047";
        ctx.font = `900 ${isCompact ? 11 : 13}px monospace`;
        ctx.fillText(
          `★${seat.points}/${pv.targetPoints}`,
          bx + singleBenchW - 8,
          by + 15
        );

        // Middle row: Permanent Bonuses (colored squares) + Held Tokens (colored circles)
        const colStep = Math.min(34, (singleBenchW - 18) / 6);
        SPLENDOR_TOKEN_COLORS.forEach((col, cIdx) => {
          const cxItem = bx + 12 + cIdx * colStep + colStep * 0.3;
          const gMeta = SPLENDOR_GEM_META[col];
          const tokQty = seat.tokens[col];
          const bonusQty = col === "gold" ? 0 : seat.bonuses[col];

          // Top mini-square = permanent bonus card count
          if (col !== "gold") {
            const sqS = isCompact ? 13 : 16;
            ctx.fillStyle = bonusQty > 0 ? gMeta.hex : "rgba(30, 41, 59, 0.7)";
            ctx.strokeStyle = bonusQty > 0 ? "#ffffff" : "#475569";
            ctx.lineWidth = 1;
            ctx.fillRect(
              Math.round(cxItem - sqS / 2),
              Math.round(by + 27),
              sqS,
              sqS
            );
            ctx.strokeRect(
              Math.round(cxItem - sqS / 2),
              Math.round(by + 27),
              sqS,
              sqS
            );
            ctx.fillStyle = bonusQty > 0 ? gMeta.textHex : "#64748b";
            ctx.font = `900 ${isCompact ? 9 : 10}px monospace`;
            ctx.textAlign = "center";
            ctx.fillText(
              String(bonusQty),
              cxItem,
              by + 27 + sqS / 2 + 0.5
            );
          }

          // Bottom mini-circle = held token count
          const cr = isCompact ? 6.5 : 8;
          const cyTok = by + (isCompact ? 55 : 60);
          ctx.fillStyle = tokQty > 0 ? gMeta.hex : "rgba(15, 23, 42, 0.7)";
          ctx.strokeStyle = tokQty > 0 ? "#fde047" : "#334155";
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.arc(cxItem, cyTok, cr, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = tokQty > 0 ? gMeta.textHex : "#475569";
          ctx.font = `900 ${isCompact ? 8.5 : 10}px monospace`;
          ctx.textAlign = "center";
          ctx.fillText(String(tokQty), cxItem, cyTok + 0.5);
        });

        // Bottom row of bench: Token total, Nobles count & Clickable Reserved Cards badges
        ctx.textAlign = "left";
        ctx.fillStyle = seat.totalTokens > 10 ? "#fca5a5" : "#94a3b8";
        ctx.font = `bold ${isCompact ? 8.5 : 10}px monospace`;
        ctx.fillText(
          `Xu:${seat.totalTokens}/10 • Thẻ:${seat.purchasedCount} • 👑${seat.nobles.length}`,
          bx + 8,
          by + benchH - 13
        );

        // Mini reserved card pills on bottom-right of bench
        if (seat.reservedCards.length > 0) {
          const pillW = isCompact ? 16 : 20;
          const pillH = isCompact ? 20 : 24;
          seat.reservedCards.forEach((rc, rIdx) => {
            const rx =
              bx +
              singleBenchW -
              8 -
              (seat.reservedCards.length - rIdx) * (pillW + 4);
            const ry = by + benchH - pillH - 5;
            const isResSel =
              isMe && curSel?.kind === "reserved" && curSel.reservedIndex === rIdx;
            const canBuyRes =
              isMe &&
              rc.card !== null &&
              mySeat !== null &&
              computeCardPayment(mySeat, rc.card).affordable;

            if (isMe && isMyTurn) {
              newHitRegions.push({
                id: `reserved-${rIdx}`,
                shape: "rect",
                x: rx,
                y: ry,
                width: pillW,
                height: pillH,
                cursor: "pointer",
                data: { type: "select-reserved", reservedIndex: rIdx },
              });
            }

            drawRoundedRect(ctx, rx, ry, pillW, pillH, 4);
            ctx.fillStyle = rc.card
              ? SPLENDOR_GEM_META[rc.card.bonus].hex
              : "#334155";
            ctx.fill();
            ctx.strokeStyle = isResSel
              ? "#fde047"
              : canBuyRes
                ? "#4ade80"
                : "#eab308";
            ctx.lineWidth = isResSel || canBuyRes ? 2 : 1.2;
            ctx.stroke();

            ctx.fillStyle = rc.card
              ? SPLENDOR_GEM_META[rc.card.bonus].textHex
              : "#e2e8f0";
            ctx.font = "900 9px monospace";
            ctx.textAlign = "center";
            ctx.fillText(
              rc.card ? `${rc.card.points}` : "?",
              rx + pillW / 2,
              ry + pillH / 2 + 0.5
            );
          });
        }
      });

      // 8. Animated 2D Pixel Effects (`lastVisualEffect`: Flying Gems, Card Buy/Reserve, Noble Visit)
      const fxElapsed =
        effectStartRef.current !== null
          ? (now - effectStartRef.current) / 1000
          : 999;

      if (pv.lastVisualEffect && fxElapsed < 1.35) {
        const fx = pv.lastVisualEffect;
        const targetSeatPos = seatCenters.get(fx.seatNo) ?? {
          x: width / 2,
          y: benchY,
        };

        if (fx.gems && fxElapsed < 0.95) {
          const isOutgoing =
            fx.kind === "BUY_CARD" || fx.kind === "DISCARD_GEMS";
          let idx = 0;
          for (const col of SPLENDOR_TOKEN_COLORS) {
            const qty = fx.gems[col] ?? 0;
            const supPos = tokenPositions.get(col) ?? {
              x: supplyCenterX,
              y: height / 2,
            };
            for (let k = 0; k < Math.min(4, qty); k++) {
              const stagger = idx * 0.06;
              const t = Math.max(0, Math.min(1, (fxElapsed - stagger) / 0.58));
              idx++;
              if (t <= 0 || t >= 1) continue;
              const ease = 1 - Math.pow(1 - t, 3);
              const from = isOutgoing ? targetSeatPos : supPos;
              const to = isOutgoing ? supPos : targetSeatPos;
              const arc = Math.sin(ease * Math.PI) * 34;
              const px = lerp(from.x, to.x, ease);
              const py = lerp(from.y, to.y, ease) - arc;
              drawSplendorPixelGemToken2D(ctx, px, py, 12, col);
            }
          }
        }

        if (fx.kind === "NOBLE_VISIT") {
          const alpha = Math.min(1, (1.35 - fxElapsed) * 1.5);
          ctx.save();
          ctx.globalAlpha = alpha;
          const by = height * 0.38 - fxElapsed * 16;
          drawRoundedRect(ctx, width / 2 - 140, by - 18, 280, 36, 12);
          ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
          ctx.fill();
          ctx.strokeStyle = "#fde047";
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = "#fde047";
          ctx.font = "900 13px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("👑 QUÝ TỘC GHÉ THĂM! +3 ĐIỂM", width / 2, by);
          ctx.restore();
        }
      }

      // 9. Interactive 2D Overlay for `NoblePickStep` (When viewer qualifies for 2+ Nobles)
      if (
        pv.step === "NoblePickStep" &&
        pv.activeSeatNo === curViewerSeatNo &&
        pv.eligibleNobleIds.length > 0
      ) {
        ctx.save();
        ctx.fillStyle = "rgba(2, 6, 23, 0.82)";
        ctx.fillRect(0, 0, width, height);

        const eligibleNobles = pv.nobles.filter((n) =>
          pv.eligibleNobleIds.includes(n.id)
        );
        const modalW = Math.min(width - 20, 440);
        const modalH = 220;
        const modalX = (width - modalW) / 2;
        const modalY = (height - modalH) / 2;

        drawRoundedRect(ctx, modalX, modalY, modalW, modalH, 18);
        ctx.fillStyle = "#0f172a";
        ctx.fill();
        ctx.strokeStyle = "#fde047";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fde047";
        ctx.font = "900 13px monospace";
        ctx.fillText(
          "👑 CHỌN 1 QUÝ TỘC GHÉ THĂM (+3 ĐIỂM)",
          width / 2,
          modalY + 28
        );

        const nSize = Math.min(96, Math.floor((modalW - 48) / eligibleNobles.length) - 12);
        const gap = 16;
        const totalW =
          eligibleNobles.length * nSize + (eligibleNobles.length - 1) * gap;
        const startX = width / 2 - totalW / 2;
        const ny = modalY + 58;

        eligibleNobles.forEach((n, idx) => {
          const nx = startX + idx * (nSize + gap);
          newHitRegions.push({
            id: `modal-noble-${n.id}`,
            shape: "rect",
            x: nx,
            y: ny,
            width: nSize,
            height: nSize,
            cursor: "pointer",
            data: { type: "pick-noble", nobleId: n.id },
          });
          drawSplendorPixelNoble2D(ctx, nx, ny, nSize, n, true);
          ctx.fillStyle = "#e2e8f0";
          ctx.font = "bold 10px sans-serif";
          ctx.fillText(n.nameVi, nx + nSize / 2, ny + nSize + 18);
        });

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
    canvas.style.cursor = region?.cursor ?? "default";
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getLogicalCoords(e);
    const region = findHitRegionAtPoint(hitRegionsRef.current, x, y);
    if (!region || !region.data) return;

    const d = region.data;
    if (d.type === "click-gem") {
      stateRef.current.onClickGemSupply(d.gem as SplendorGemColor);
    } else if (d.type === "select-market") {
      stateRef.current.onSelectCardOrDeck({
        kind: "market",
        tier: d.tier as SplendorCardTier,
        slotIndex: d.slotIndex as number,
      });
    } else if (d.type === "select-deck") {
      stateRef.current.onSelectCardOrDeck({
        kind: "deck",
        tier: d.tier as SplendorCardTier,
      });
    } else if (d.type === "select-reserved") {
      stateRef.current.onSelectCardOrDeck({
        kind: "reserved",
        reservedIndex: d.reservedIndex as number,
      });
    } else if (d.type === "pick-noble") {
      stateRef.current.onDispatchCommand({
        type: "PICK_NOBLE",
        nobleId: d.nobleId as string,
      });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[380px] sm:min-h-[500px] lg:min-h-[620px] select-none overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="block w-full h-full"
      />
    </div>
  );
}
