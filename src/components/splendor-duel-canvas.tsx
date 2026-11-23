"use client";

import React, { useEffect, useRef } from "react";
import {
  drawRoundedRect,
  findHitRegionAtPoint,
  ParticleSystem,
  type HitRegion,
} from "@/canvas/engine";
import { drawSplendorPixelDeck2D } from "@/canvas/splendor-art";
import {
  drawDuelPixelBackground2D,
  drawDuelPixelCard2D,
  drawDuelPixelPrivilegeScroll2D,
  drawDuelPixelRoyalCard2D,
  drawDuelPixelTokenChip2D,
  drawDuelPixelTokenIcon2D,
  drawDuelSpiralBoard2D,
} from "@/canvas/splendor-duel-art";
import {
  SPLENDOR_GEMS,
  type SplendorCardTier,
  type SplendorGemColor,
} from "@/cartridges/splendor";
import {
  boardIdx,
  computeDuelCardPayment,
  DUEL_TOKEN_COLORS,
  DUEL_TOKEN_META,
  type DuelCommand,
  type DuelPlayerView,
  type DuelTokenColor,
} from "@/cartridges/splendor-duel";
import type { LobbySeatItem } from "@/components/werewolf-canvas";

export type DuelSelection =
  | { kind: "pyramid"; tier: SplendorCardTier; slotIndex: number }
  | { kind: "deck"; tier: SplendorCardTier }
  | { kind: "reserved"; reservedIndex: number }
  | null;

export function DuelTokenIconCanvas({
  color,
  size = 20,
  className = "",
}: {
  color: DuelTokenColor;
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
    drawDuelPixelTokenIcon2D(ctx, size * 0.5, size * 0.5, size * 0.9, color);
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

interface SplendorDuelCanvasProps {
  mode: "lobby" | "match";
  lobbySeats: LobbySeatItem[];
  viewerSeatNo: number | null;
  playerView: DuelPlayerView | null;
  selectedCells: [number, number][];
  selectedGoldCell: [number, number] | null;
  privilegeMode: boolean;
  selection: DuelSelection;
  onClickBoardCell: (row: number, col: number) => void;
  onSelectCardOrDeck: (sel: DuelSelection) => void;
  onDispatchCommand: (cmd: DuelCommand) => void;
}

export function SplendorDuelCanvas({
  mode,
  lobbySeats,
  viewerSeatNo,
  playerView,
  selectedCells,
  selectedGoldCell,
  privilegeMode,
  selection,
  onClickBoardCell,
  onSelectCardOrDeck,
  onDispatchCommand,
}: SplendorDuelCanvasProps) {
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
    selectedCells,
    selectedGoldCell,
    privilegeMode,
    selection,
    onClickBoardCell,
    onSelectCardOrDeck,
    onDispatchCommand,
  });

  useEffect(() => {
    stateRef.current = {
      mode,
      lobbySeats,
      viewerSeatNo,
      playerView,
      selectedCells,
      selectedGoldCell,
      privilegeMode,
      selection,
      onClickBoardCell,
      onSelectCardOrDeck,
      onDispatchCommand,
    };

    if (
      playerView?.lastVisualEffect &&
      playerView.lastVisualEffect.seq !== lastEffectSeqRef.current
    ) {
      lastEffectSeqRef.current = playerView.lastVisualEffect.seq;
      effectStartRef.current = performance.now();
    }
  }, [
    mode,
    lobbySeats,
    viewerSeatNo,
    playerView,
    selectedCells,
    selectedGoldCell,
    privilegeMode,
    selection,
    onClickBoardCell,
    onSelectCardOrDeck,
    onDispatchCommand,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let lastTs = performance.now();

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const st = stateRef.current;
      const regions: HitRegion[] = [];

      // 1. 16-bit Pixel-Art Royal Duelling Vault Background
      drawDuelPixelBackground2D(ctx, width, height, now);

      if (st.mode === "lobby" || !st.playerView) {
        drawDuelLobbyScene(ctx, width, height, st.lobbySeats, st.viewerSeatNo, now);
      } else {
        drawDuelMatchScene(ctx, width, height, st, regions, now, particlesRef.current);
      }

      // Sparkle particles
      particlesRef.current.update(dt);
      particlesRef.current.draw(ctx);

      hitRegionsRef.current = regions;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      const hit = findHitRegionAtPoint(hitRegionsRef.current, px, py);
      if (!hit) return;

      const st = stateRef.current;
      const d = hit.data as Record<string, any> | undefined;
      if (!d) return;

      const kind = d.kind as string;
      if (kind === "duel-board-cell") {
        st.onClickBoardCell(d.row as number, d.col as number);
      } else if (kind === "duel-pyramid-card") {
        const tier = d.tier as SplendorCardTier;
        const slotIndex = d.slotIndex as number;
        if (
          st.selection?.kind === "pyramid" &&
          st.selection.tier === tier &&
          st.selection.slotIndex === slotIndex
        ) {
          st.onSelectCardOrDeck(null);
        } else {
          st.onSelectCardOrDeck({ kind: "pyramid", tier, slotIndex });
        }
      } else if (kind === "duel-deck") {
        const tier = d.tier as SplendorCardTier;
        if (st.selection?.kind === "deck" && st.selection.tier === tier) {
          st.onSelectCardOrDeck(null);
        } else {
          st.onSelectCardOrDeck({ kind: "deck", tier });
        }
      } else if (kind === "duel-reserved") {
        const reservedIndex = d.reservedIndex as number;
        if (
          st.selection?.kind === "reserved" &&
          st.selection.reservedIndex === reservedIndex
        ) {
          st.onSelectCardOrDeck(null);
        } else {
          st.onSelectCardOrDeck({ kind: "reserved", reservedIndex });
        }
      } else if (kind === "duel-royal-pick") {
        st.onDispatchCommand({
          type: "PICK_ROYAL",
          royalId: d.royalId as string,
        });
      } else if (kind === "duel-wild-pick") {
        st.onDispatchCommand({
          type: "PICK_WILD_COLOR",
          color: d.color as SplendorGemColor,
        });
      } else if (kind === "duel-steal-pick") {
        st.onDispatchCommand({
          type: "STEAL_TOKEN",
          color: d.color as SplendorGemColor | "pearl",
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const hit = findHitRegionAtPoint(hitRegionsRef.current, px, py);
      canvas.style.cursor = hit ? "pointer" : "default";
    };

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-full min-h-[380px] w-full rounded-xl sm:min-h-[500px] lg:min-h-[620px]"
    />
  );
}

function drawDuelLobbyScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  lobbySeats: LobbySeatItem[],
  viewerSeatNo: number | null,
  nowMs: number
) {
  ctx.save();
  const compact = width < 580;

  // Title Banner
  ctx.fillStyle = "#fef08a";
  ctx.font = `900 ${compact ? 18 : 26}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SPLENDOR DUEL — 1v1", width / 2, height * 0.14);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = `600 ${compact ? 11 : 13}px sans-serif`;
  ctx.fillText(
    "Bàn Đá Quý Xoắn Ốc 5×5 • 3 Điều Kiện Chiến Thắng Tức Thì",
    width / 2,
    height * 0.21
  );

  // Decorative 7 pixel tokens showcase (5 Gems + Pearl + Gold)
  const spacing = Math.min(54, (width - 60) / 7);
  const startX = width / 2 - ((DUEL_TOKEN_COLORS.length - 1) * spacing) / 2;
  const tokY = height * 0.34;
  const tokR = compact ? 15 : 21;
  DUEL_TOKEN_COLORS.forEach((col, i) => {
    const bob = Math.sin(nowMs / 420 + i * 0.7) * 3.5;
    drawDuelPixelTokenChip2D(ctx, startX + i * spacing, tokY + bob, tokR, col);
  });

  // 3 Privilege Scrolls in center
  const scrollW = compact ? 28 : 36;
  const scrollH = compact ? 16 : 20;
  for (let i = 0; i < 3; i++) {
    drawDuelPixelPrivilegeScroll2D(
      ctx,
      width / 2 - (3 * (scrollW + 10) - 10) / 2 + i * (scrollW + 10),
      height * 0.45,
      scrollW,
      scrollH,
      i === 1
    );
  }

  // 2 Duelling Seat Slots (Seat 1 vs Seat 2)
  const boxW = Math.min(240, (width - 72) / 2);
  const boxH = compact ? 92 : 112;
  const boxY = height * 0.57;
  const gap = compact ? 16 : 36;

  [1, 2].forEach((seatNum, idx) => {
    const seat = lobbySeats.find((s) => s.seatNo === seatNum) ?? lobbySeats[idx];
    const bx =
      idx === 0
        ? width / 2 - gap / 2 - boxW
        : width / 2 + gap / 2;
    const isMe = seat && seat.seatNo === viewerSeatNo;

    drawRoundedRect(ctx, bx, boxY, boxW, boxH, 12);
    ctx.fillStyle = seat
      ? idx === 0
        ? "rgba(127, 29, 29, 0.55)"
        : "rgba(30, 58, 138, 0.55)"
      : "rgba(15, 23, 42, 0.6)";
    ctx.fill();
    ctx.strokeStyle = isMe ? "#fde047" : seat ? "#eab308" : "#475569";
    ctx.lineWidth = isMe ? 2.6 : 1.6;
    ctx.stroke();

    ctx.fillStyle = idx === 0 ? "#fca5a5" : "#93c5fd";
    ctx.font = `800 ${compact ? 10 : 12}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(
      idx === 0 ? "GHẾ 1 • ĐI TRƯỚC" : "GHẾ 2 • +1 ĐẶC QUYỀN 📜",
      bx + boxW / 2,
      boxY + 22
    );

    ctx.fillStyle = seat ? "#f8fafc" : "#64748b";
    ctx.font = `700 ${compact ? 13 : 16}px sans-serif`;
    ctx.fillText(
      seat ? `${seat.displayName}${isMe ? " (Bạn)" : ""}` : "Đang chờ đối thủ...",
      bx + boxW / 2,
      boxY + boxH * 0.58
    );

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px sans-serif";
    ctx.fillText(
      seat ? "Sẵn sàng đối kháng" : "Mời bạn hoặc thêm Bot",
      bx + boxW / 2,
      boxY + boxH - 18
    );
  });

  // VS badge between seats
  ctx.fillStyle = "#fde047";
  ctx.font = `900 ${compact ? 14 : 20}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText("VS", width / 2, boxY + boxH / 2);

  // Victory reminder footer
  ctx.fillStyle = "#94a3b8";
  ctx.font = `600 ${compact ? 10 : 12}px sans-serif`;
  ctx.fillText(
    "Thắng ngay lập tức khi đạt: ★ 20 Điểm  |  👑 10 Vương Miện  |  💎 10 Điểm cùng 1 Màu",
    width / 2,
    height * 0.87
  );

  ctx.restore();
}

function drawDuelMatchScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  st: {
    viewerSeatNo: number | null;
    playerView: DuelPlayerView | null;
    selectedCells: [number, number][];
    selectedGoldCell: [number, number] | null;
    privilegeMode: boolean;
    selection: DuelSelection;
  },
  regions: HitRegion[],
  nowMs: number,
  particles: ParticleSystem
) {
  const pv = st.playerView;
  if (!pv) return;

  const compact = width < 720;
  const isMyTurn = st.viewerSeatNo === pv.activeSeatNo;
  const viewerSeat =
    pv.seats.find((s) => s.seatNo === st.viewerSeatNo) ?? null;

  // =========================================================================
  // 1. TOP HUD BAR: 3-Goal Banner | 4 Royal Cards | Privilege Supply & Timer
  // =========================================================================
  const topY = 8;
  const topH = compact ? 64 : 74;

  // Top-left: Turn & 3-Victory Goals compact pill
  const leftHudW = compact ? Math.min(185, width * 0.34) : 230;
  drawRoundedRect(ctx, 10, topY, leftHudW, topH, 10);
  ctx.fillStyle = "rgba(10, 12, 26, 0.84)";
  ctx.fill();
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const activeSeat = pv.seats.find((s) => s.seatNo === pv.activeSeatNo);
  ctx.fillStyle = isMyTurn ? "#fde047" : "#e2e8f0";
  ctx.font = `800 ${compact ? 10 : 12}px sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(
    pv.step === "Finished"
      ? "🏆 KẾT THÚC"
      : `Lượt ${pv.turnNumber} • ${activeSeat?.displayName ?? "?"}${pv.extraTurnQueued ? " 🔄" : ""}`,
    18,
    topY + 18
  );

  ctx.fillStyle = "#94a3b8";
  ctx.font = `700 ${compact ? 9 : 10}px monospace`;
  ctx.fillText("THẮNG NGAY: ★20 | 👑10 | 💎10/MÀU", 18, topY + 38);

  const stepLabel =
    pv.step === "TurnActionStep"
      ? isMyTurn
        ? st.privilegeMode
          ? "📜 Chọn 1 đá quý (không phải Vàng)"
          : "Chọn 1–3 đá thẳng hàng hoặc thẻ"
        : "Đang chờ đối thủ..."
      : pv.step === "WildColorPickStep"
        ? "🌈 Chọn màu cho thẻ Đa Sắc"
        : pv.step === "TakeMatchingStep"
          ? "➕ Chọn 1 viên đá cùng màu trên bàn"
          : pv.step === "StealTokenStep"
            ? "🎯 Chọn 1 viên đá để cướp từ đối thủ"
            : pv.step === "DiscardTokensStep"
              ? "🎒 Trả bớt xu thừa về túi (≤ 10)"
              : pv.step === "RoyalPickStep"
                ? "👑 Chọn 1 Thẻ Hoàng Gia"
                : pv.winReasonVi ?? "Trận đấu kết thúc";

  ctx.fillStyle = isMyTurn ? "#4ade80" : "#cbd5e1";
  ctx.font = `600 ${compact ? 9 : 10}px sans-serif`;
  ctx.fillText(stepLabel, 18, topY + 56, leftHudW - 16);

  // Top-right: Privilege Supply + Bag Count + Countdown Timer
  const rightHudW = compact ? Math.min(165, width * 0.3) : 205;
  const rightHudX = width - rightHudW - 10;
  drawRoundedRect(ctx, rightHudX, topY, rightHudW, topH, 10);
  ctx.fillStyle = "rgba(10, 12, 26, 0.84)";
  ctx.fill();
  ctx.strokeStyle = "#ca8a04";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = "#fde68a";
  ctx.font = `800 ${compact ? 9 : 10}px monospace`;
  ctx.textAlign = "left";
  ctx.fillText(`ĐẶC QUYỀN (${pv.privilegeSupply})`, rightHudX + 8, topY + 16);

  for (let i = 0; i < 3; i++) {
    const sx = rightHudX + 10 + i * 28;
    const sy = topY + 26;
    if (i < pv.privilegeSupply) {
      drawDuelPixelPrivilegeScroll2D(ctx, sx, sy, 22, 14, true);
    } else {
      drawRoundedRect(ctx, sx, sy, 22, 14, 3);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  ctx.fillStyle = "#cbd5e1";
  ctx.font = `700 ${compact ? 9 : 11}px monospace`;
  ctx.fillText(`🎒 Túi: ${pv.bagCount}`, rightHudX + 8, topY + 56);

  if (pv.phaseDeadlineMs && pv.step !== "Finished") {
    const secLeft = Math.max(0, Math.ceil((pv.phaseDeadlineMs - Date.now()) / 1000));
    ctx.fillStyle = secLeft <= 15 ? "#f87171" : "#38bdf8";
    ctx.font = `900 ${compact ? 11 : 13}px monospace`;
    ctx.textAlign = "right";
    ctx.fillText(`⏱ ${secLeft}s`, rightHudX + rightHudW - 10, topY + 56);
  }

  // Top-center: 4 Royal Cards (clickable in RoyalPickStep)
  const royalAreaX = leftHudW + 18;
  const royalAreaW = Math.max(80, rightHudX - royalAreaX - 8);
  const royalCount = Math.max(1, pv.royals.length);
  const royalGap = 6;
  const royalW = Math.min(62, (royalAreaW - royalGap * (royalCount - 1)) / Math.max(4, royalCount));
  const royalH = topH - 6;
  const totalRoyalW = pv.royals.length * royalW + Math.max(0, pv.royals.length - 1) * royalGap;
  const royalStartX = royalAreaX + (royalAreaW - totalRoyalW) / 2;

  pv.royals.forEach((royal, idx) => {
    const rx = royalStartX + idx * (royalW + royalGap);
    const ry = topY + 3;
    const canPickRoyal = isMyTurn && pv.step === "RoyalPickStep";
    drawDuelPixelRoyalCard2D(ctx, rx, ry, royalW, royalH, royal, canPickRoyal);
    if (canPickRoyal) {
      regions.push({
        id: `royal-${royal.id}`,
        shape: "rect",
        x: rx,
        y: ry,
        width: royalW,
        height: royalH,
        data: { kind: "duel-royal-pick", royalId: royal.id },
      });
    }
  });

  // =========================================================================
  // 2. MIDDLE TABLETOP: Left 5x5 Spiral Board + Right 3-Tier Pyramid (3/4/5)
  // =========================================================================
  const botH = compact ? 132 : 148;
  const midTop = topY + topH + 10;
  const midBot = height - botH - 10;
  const midH = Math.max(180, midBot - midTop);

  // Left: 5x5 Spiral Gem Board
  const maxBoardW = compact ? width * 0.42 : width * 0.37;
  const boardSize = Math.floor(Math.min(maxBoardW - 20, midH - 22));
  const boardX = 16;
  const boardY = midTop + Math.floor((midH - boardSize) / 2) + 4;

  const goldHighlightMode =
    isMyTurn &&
    pv.step === "TurnActionStep" &&
    !st.privilegeMode &&
    (st.selection?.kind === "pyramid" || st.selection?.kind === "deck");

  const highlightMatchColor =
    isMyTurn && pv.step === "TakeMatchingStep" ? pv.pendingMatchColor : null;

  const effectiveSelectedCells: [number, number][] =
    st.selectedGoldCell && goldHighlightMode
      ? [st.selectedGoldCell]
      : st.selectedCells;

  drawDuelSpiralBoard2D(
    ctx,
    boardX,
    boardY,
    boardSize,
    pv.board,
    effectiveSelectedCells,
    highlightMatchColor,
    goldHighlightMode
  );

  // Board caption above 5x5 grid
  ctx.fillStyle = st.privilegeMode
    ? "#fde047"
    : goldHighlightMode
      ? "#fbbf24"
      : "#94a3b8";
  ctx.font = `700 ${compact ? 9 : 11}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText(
    st.privilegeMode
      ? "📜 CHẾ ĐỘ ĐẶC QUYỀN: BẤM 1 ĐÁ QUÝ"
      : goldHighlightMode
        ? "🪙 CHỌN 1 XU VÀNG ĐỂ ĐẶT CỌC"
        : highlightMatchColor
          ? `➕ CHỌN 1 VIÊN ${DUEL_TOKEN_META[highlightMatchColor].shortVi.toUpperCase()}`
          : "BÀN XOẮN ỐC 5×5",
    boardX + boardSize / 2,
    boardY - 11
  );

  // Register 25 clickable hit regions on the 5x5 board
  const cellS = boardSize / 5;
  if (
    isMyTurn &&
    (pv.step === "TurnActionStep" || pv.step === "TakeMatchingStep")
  ) {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const tok = pv.board[boardIdx(r, c)];
        if (!tok) continue;
        regions.push({
          id: `board-${r}-${c}`,
          shape: "rect",
          x: boardX + c * cellS,
          y: boardY + r * cellS,
          width: cellS,
          height: cellS,
          data: { kind: "duel-board-cell", row: r, col: c, token: tok },
        });
      }
    }
  }

  // Right: 3-Tier Jewel Card Pyramid (Tier 3 = 3 cards, Tier 2 = 4 cards, Tier 1 = 5 cards)
  const pyrX = boardX + boardSize + 18;
  const pyrW = Math.max(160, width - pyrX - 14);
  const rowGap = 7;
  const cardGap = compact ? 5 : 8;
  const rowH = Math.floor((midH - rowGap * 2) / 3);
  // Fit 1 deck + 5 cards horizontally in Tier 1
  const maxCardW = Math.floor((pyrW - cardGap * 5) / 6);
  const cardW = Math.max(38, Math.min(maxCardW, Math.floor(rowH * 0.78)));
  const cardH = Math.max(54, Math.min(rowH, Math.floor(cardW * 1.32)));

  const tiers: SplendorCardTier[] = [3, 2, 1];
  tiers.forEach((tier, rowIdx) => {
    const ry = midTop + rowIdx * (rowH + rowGap) + Math.floor((rowH - cardH) / 2);

    // Tier Deck on left of row
    const deckX = pyrX;
    const deckCount = pv.deckCounts[tier];
    const deckSelected =
      st.selection?.kind === "deck" && st.selection.tier === tier;
    drawSplendorPixelDeck2D(
      ctx,
      deckX,
      ry,
      cardW,
      cardH,
      tier,
      deckCount,
      deckSelected
    );
    if (isMyTurn && pv.step === "TurnActionStep" && deckCount > 0) {
      regions.push({
        id: `duel-deck-${tier}`,
        shape: "rect",
        x: deckX,
        y: ry,
        width: cardW,
        height: cardH,
        data: { kind: "duel-deck", tier },
      });
    }

    // Pyramid slots for this tier (Tier 3 = 3, Tier 2 = 4, Tier 1 = 5) centered in remaining width
    const slots = pv.pyramid[tier];
    const cardsAreaX = deckX + cardW + cardGap + 4;
    const cardsAreaW = pyrW - (cardW + cardGap + 4);
    const totalSlotsW = slots.length * cardW + (slots.length - 1) * cardGap;
    const startSlotX = cardsAreaX + Math.max(0, (cardsAreaW - totalSlotsW) / 2);

    slots.forEach((card, slotIdx) => {
      const cx = startSlotX + slotIdx * (cardW + cardGap);
      if (!card) {
        drawRoundedRect(ctx, cx, ry, cardW, cardH, 6);
        ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
        ctx.fill();
        ctx.strokeStyle = "rgba(100, 116, 139, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
        return;
      }

      const affordable = viewerSeat
        ? computeDuelCardPayment(viewerSeat, card).affordable
        : false;
      const selected =
        st.selection?.kind === "pyramid" &&
        st.selection.tier === tier &&
        st.selection.slotIndex === slotIdx;

      drawDuelPixelCard2D(ctx, cx, ry, cardW, cardH, card, {
        affordable: isMyTurn && affordable,
        selected,
      });

      if (isMyTurn && pv.step === "TurnActionStep") {
        regions.push({
          id: `duel-card-${tier}-${slotIdx}`,
          shape: "rect",
          x: cx,
          y: ry,
          width: cardW,
          height: cardH,
          data: { kind: "duel-pyramid-card", tier, slotIndex: slotIdx },
        });
      }
    });
  });

  // =========================================================================
  // 3. BOTTOM STRIP: 2 Duelling Player Workbenches (Seat 1 vs Seat 2)
  // =========================================================================
  const botY = height - botH - 8;
  const seatGap = 10;
  const seatW = (width - 20 - seatGap) / 2;

  pv.seats.forEach((seat, idx) => {
    const sx = 10 + idx * (seatW + seatGap);
    const isActive = seat.seatNo === pv.activeSeatNo && pv.step !== "Finished";
    const isMe = seat.seatNo === st.viewerSeatNo;
    const isWinner = seat.seatNo === pv.winnerSeatNo;

    drawRoundedRect(ctx, sx, botY, seatW, botH, 10);
    ctx.fillStyle = isWinner
      ? "rgba(113, 63, 18, 0.65)"
      : isMe
        ? "rgba(15, 23, 42, 0.9)"
        : "rgba(15, 18, 34, 0.82)";
    ctx.fill();
    ctx.strokeStyle = isWinner
      ? "#fde047"
      : isActive
        ? "#fbbf24"
        : isMe
          ? "#38bdf8"
          : "#334155";
    ctx.lineWidth = isActive || isWinner ? 2.4 : 1.4;
    ctx.stroke();

    // Header Row: Player Name + 3 Victory Progress Counters + Privileges
    ctx.fillStyle = isActive ? "#fde047" : "#f8fafc";
    ctx.font = `800 ${compact ? 11 : 13}px sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${isActive ? "▶ " : ""}${seat.displayName}${isMe ? " (Bạn)" : ""}`,
      sx + 10,
      botY + 16,
      seatW * 0.48
    );

    // 3 Victory Condition Meters on top-right
    ctx.textAlign = "right";
    ctx.font = `800 ${compact ? 9 : 11}px monospace`;
    ctx.fillStyle = seat.points >= 20 ? "#4ade80" : "#fde047";
    const statsText = `★${seat.points}/20  👑${seat.crowns}/10  💎${seat.maxSingleColorPoints}/10`;
    ctx.fillText(statsText, sx + seatW - 10, botY + 16);

    // Second Row: Privileges + Bag/Token Total + Purchased + Royals
    ctx.textAlign = "left";
    ctx.fillStyle = "#cbd5e1";
    ctx.font = `700 ${compact ? 9 : 10}px monospace`;
    ctx.fillText(
      `📜×${seat.privileges}  •  Xu: ${seat.totalTokens}/10  •  Thẻ: ${seat.purchasedCount}  •  Hoàng gia: ${seat.royals.length}`,
      sx + 10,
      botY + 34
    );

    // Third Row: 7 Token Columns (5 standard gems with bonus+colorPts+tokens, + Pearl + Gold)
    const colStartY = botY + 46;
    const colAreaW = seatW - 20;
    const colW = colAreaW / 7;

    DUEL_TOKEN_COLORS.forEach((col, cIdx) => {
      const cx = sx + 10 + cIdx * colW + colW / 2;
      const isStandard = col !== "pearl" && col !== "gold";
      const bonus = isStandard ? seat.bonuses[col as SplendorGemColor] : 0;
      const colPts = isStandard ? seat.colorPoints[col as SplendorGemColor] : 0;
      const tokQty = seat.tokens[col];

      // Subtle slot box
      drawRoundedRect(ctx, sx + 10 + cIdx * colW + 2, colStartY, colW - 4, 52, 6);
      ctx.fillStyle = "rgba(30, 41, 59, 0.55)";
      ctx.fill();

      drawDuelPixelTokenIcon2D(ctx, cx, colStartY + 13, compact ? 13 : 16, col);

      // Held tokens count
      ctx.fillStyle = tokQty > 0 ? "#ffffff" : "#64748b";
      ctx.font = `900 ${compact ? 10 : 12}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(String(tokQty), cx, colStartY + 30);

      // Bonus & Color Points underneath (for standard gems)
      if (isStandard) {
        ctx.fillStyle = bonus > 0 ? "#4ade80" : "#475569";
        ctx.font = `700 ${compact ? 8 : 9}px monospace`;
        ctx.fillText(
          colPts > 0 ? `+${bonus} ★${colPts}` : `+${bonus}`,
          cx,
          colStartY + 44
        );
      } else {
        ctx.fillStyle = col === "pearl" ? "#f9a8d4" : "#fde047";
        ctx.font = `700 ${compact ? 8 : 9}px monospace`;
        ctx.fillText(col === "pearl" ? "Trai" : "Vàng", cx, colStartY + 44);
      }
    });

    // Bottom Strip inside workbench: Reserved Cards pills (clickable for viewer)
    const resY = botY + 104;
    ctx.textAlign = "left";
    ctx.fillStyle = "#94a3b8";
    ctx.font = `700 ${compact ? 9 : 10}px sans-serif`;
    ctx.fillText(`Đặt cọc (${seat.reservedCards.length}/3):`, sx + 10, resY + 11);

    seat.reservedCards.forEach((rc, rIdx) => {
      const rx = sx + (compact ? 82 : 96) + rIdx * (compact ? 58 : 74);
      const rw = compact ? 52 : 68;
      const rh = 22;
      const isSelectedRes =
        isMe &&
        st.selection?.kind === "reserved" &&
        st.selection.reservedIndex === rIdx;
      const canBuyRes =
        isMe &&
        rc.card !== null &&
        computeDuelCardPayment(seat, rc.card).affordable;

      drawRoundedRect(ctx, rx, resY, rw, rh, 5);
      ctx.fillStyle = isSelectedRes
        ? "#854d0e"
        : canBuyRes
          ? "rgba(21, 128, 61, 0.55)"
          : "rgba(30, 41, 59, 0.85)";
      ctx.fill();
      ctx.strokeStyle = isSelectedRes
        ? "#fde047"
        : canBuyRes
          ? "#4ade80"
          : "#64748b";
      ctx.lineWidth = isSelectedRes ? 2 : 1.2;
      ctx.stroke();

      ctx.fillStyle = "#f8fafc";
      ctx.font = `700 ${compact ? 8 : 9}px monospace`;
      ctx.textAlign = "center";
      const label = rc.card
        ? `C${rc.tier} ★${rc.card.points}${rc.card.crowns ? "👑" : ""}`
        : `Úp C${rc.tier}`;
      ctx.fillText(label, rx + rw / 2, resY + rh / 2 + 0.5);

      if (isMe && isActive && pv.step === "TurnActionStep") {
        regions.push({
          id: `duel-res-${rIdx}`,
          shape: "rect",
          x: rx,
          y: resY,
          width: rw,
          height: rh,
          data: { kind: "duel-reserved", reservedIndex: rIdx },
        });
      }
    });
  });

  // =========================================================================
  // 4. INTERACTIVE SUB-STEP CANVAS OVERLAYS (WildColor / Steal / Royal / Win)
  // =========================================================================
  if (isMyTurn && pv.step === "WildColorPickStep" && viewerSeat) {
    drawCanvasModalBackdrop(ctx, width, height, "🌈 Gắn Thẻ Đa Sắc Vào 1 Màu Đá Quý");
    const btnW = compact ? 56 : 74;
    const btnH = 82;
    const gap = 10;
    const totalW = 5 * btnW + 4 * gap;
    const startX = width / 2 - totalW / 2;
    const by = height / 2 - btnH / 2 + 10;

    SPLENDOR_GEMS.forEach((gem, i) => {
      const bx = startX + i * (btnW + gap);
      drawRoundedRect(ctx, bx, by, btnW, btnH, 10);
      ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
      ctx.fill();
      ctx.strokeStyle = DUEL_TOKEN_META[gem].hex;
      ctx.lineWidth = 2.4;
      ctx.stroke();

      drawDuelPixelTokenIcon2D(ctx, bx + btnW / 2, by + 28, 28, gem);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "800 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(DUEL_TOKEN_META[gem].shortVi, bx + btnW / 2, by + 56);
      ctx.fillStyle = "#fde047";
      ctx.font = "700 10px monospace";
      ctx.fillText(
        `+${viewerSeat.bonuses[gem]} ★${viewerSeat.colorPoints[gem]}`,
        bx + btnW / 2,
        by + 71
      );

      regions.push({
        id: `wild-${gem}`,
        shape: "rect",
        x: bx,
        y: by,
        width: btnW,
        height: btnH,
        data: { kind: "duel-wild-pick", color: gem },
      });
    });
  } else if (isMyTurn && pv.step === "StealTokenStep") {
    const opp = pv.seats.find((s) => s.seatNo !== st.viewerSeatNo);
    if (opp) {
      const stealable = ([...SPLENDOR_GEMS, "pearl"] as (SplendorGemColor | "pearl")[]).filter(
        (c) => opp.tokens[c] > 0
      );
      drawCanvasModalBackdrop(
        ctx,
        width,
        height,
        `🎯 Cướp 1 Viên Đá Từ ${opp.displayName}`
      );
      const btnW = 68;
      const btnH = 78;
      const gap = 10;
      const totalW = stealable.length * btnW + Math.max(0, stealable.length - 1) * gap;
      const startX = width / 2 - totalW / 2;
      const by = height / 2 - btnH / 2 + 10;

      stealable.forEach((col, i) => {
        const bx = startX + i * (btnW + gap);
        drawRoundedRect(ctx, bx, by, btnW, btnH, 10);
        ctx.fillStyle = "rgba(30, 15, 25, 0.94)";
        ctx.fill();
        ctx.strokeStyle = "#fb7185";
        ctx.lineWidth = 2.4;
        ctx.stroke();

        drawDuelPixelTokenIcon2D(ctx, bx + btnW / 2, by + 28, 28, col);
        ctx.fillStyle = "#ffffff";
        ctx.font = "800 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`×${opp.tokens[col]}`, bx + btnW / 2, by + 58);

        regions.push({
          id: `steal-${col}`,
          shape: "rect",
          x: bx,
          y: by,
          width: btnW,
          height: btnH,
          data: { kind: "duel-steal-pick", color: col },
        });
      });
    }
  } else if (isMyTurn && pv.step === "RoyalPickStep") {
    drawCanvasModalBackdrop(
      ctx,
      width,
      height,
      "👑 Đạt Mốc Vương Miện! Chọn 1 Thẻ Hoàng Gia"
    );
    const rw = compact ? 74 : 92;
    const rh = compact ? 92 : 112;
    const gap = 12;
    const totalW = pv.royals.length * rw + Math.max(0, pv.royals.length - 1) * gap;
    const startX = width / 2 - totalW / 2;
    const ry = height / 2 - rh / 2 + 10;

    pv.royals.forEach((royal, i) => {
      const rx = startX + i * (rw + gap);
      drawDuelPixelRoyalCard2D(ctx, rx, ry, rw, rh, royal, true);
      ctx.fillStyle = "#fef08a";
      ctx.font = "700 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(royal.nameVi, rx + rw / 2, ry + rh + 14);
      regions.push({
        id: `royal-modal-${royal.id}`,
        shape: "rect",
        x: rx,
        y: ry,
        width: rw,
        height: rh,
        data: { kind: "duel-royal-pick", royalId: royal.id },
      });
    });
  } else if (pv.step === "Finished") {
    const winner = pv.seats.find((s) => s.seatNo === pv.winnerSeatNo);
    const boxW = Math.min(440, width - 36);
    const boxH = 112;
    const bx = width / 2 - boxW / 2;
    const by = midTop + midH / 2 - boxH / 2;

    drawRoundedRect(ctx, bx, by, boxW, boxH, 14);
    ctx.fillStyle = "rgba(10, 12, 26, 0.92)";
    ctx.fill();
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#fde047";
    ctx.font = `900 ${compact ? 16 : 20}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(
      `🏆 ${winner?.displayName ?? "Người chiến thắng"} CHIẾN THẮNG!`,
      width / 2,
      by + 36
    );
    ctx.fillStyle = "#e2e8f0";
    ctx.font = `600 ${compact ? 11 : 13}px sans-serif`;
    ctx.fillText(pv.winReasonVi ?? "", width / 2, by + 68, boxW - 24);
  }

  // =========================================================================
  // 5. TRANSIENT VISUAL EFFECT BANNER & SPARKLES
  // =========================================================================
  if (pv.lastVisualEffect?.bannerVi) {
    // Emit gentle sparkle on fresh effect
    if (Math.random() < 0.08 && pv.step !== "Finished") {
      particles.spawn({
        x: boardX + boardSize / 2 + (Math.random() - 0.5) * 80,
        y: boardY + boardSize / 2,
        vx: (Math.random() - 0.5) * 28,
        vy: -18 - Math.random() * 24,
        radius: 2.2,
        color: "#fde047",
        life: 0.9,
        maxLife: 0.9,
      });
    }
    const bw = Math.min(360, width - 40);
    const bx = width / 2 - bw / 2;
    const by = midTop - 2;
    drawRoundedRect(ctx, bx, by, bw, 24, 12);
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.fill();
    ctx.strokeStyle = "#ca8a04";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = "#fef08a";
    ctx.font = "700 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pv.lastVisualEffect.bannerVi, width / 2, by + 12, bw - 16);
  }
}

function drawCanvasModalBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  title: string
) {
  ctx.fillStyle = "rgba(5, 7, 18, 0.72)";
  ctx.fillRect(0, 0, width, height);

  const panelW = Math.min(480, width - 28);
  const panelH = 180;
  const px = width / 2 - panelW / 2;
  const py = height / 2 - panelH / 2;

  drawRoundedRect(ctx, px, py, panelW, panelH, 14);
  ctx.fillStyle = "rgba(15, 23, 42, 0.96)";
  ctx.fill();
  ctx.strokeStyle = "#eab308";
  ctx.lineWidth = 2.4;
  ctx.stroke();

  ctx.fillStyle = "#fde047";
  ctx.font = "800 14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, width / 2, py + 28, panelW - 20);
}
