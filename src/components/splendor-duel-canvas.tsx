"use client";

import React, { useEffect, useRef } from "react";
import {
  canvasFont,
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
  DUEL_CARD_ATLAS_RECTS,
  getDuelCardPixelAtlas,
  getDuelTokenPixelAtlas,
} from "@/canvas/splendor-duel-atlas";
import {
  SPLENDOR_GEMS,
  type SplendorCardTier,
  type SplendorGemColor,
} from "@/cartridges/splendor";
import {
  boardIdx,
  computeDuelCardPayment,
  DUEL_SPIRAL_ORDER,
  DUEL_TOKEN_COLORS,
  DUEL_TOKEN_META,
  type DuelCommand,
  type DuelJewelCard,
  type DuelPlayerView,
  type DuelTokenColor,
  type DuelVisualEffect,
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

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, size, size);
      drawDuelPixelTokenIcon2D(ctx, size * 0.5, size * 0.5, size * 0.88, color);
      ctx.restore();
    };

    draw();
    getDuelTokenPixelAtlas(draw);
  }, [color, size]);

  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size, imageRendering: "pixelated" }}
      className={`inline-block shrink-0 ${className}`}
    />
  );
}

/**
 * High-resolution 2D Canvas preview of a selected Splendor Duel Jewel Card
 * (renders the full official-style 2D illustration, pennant, power badge & cost tokens).
 */
export function DuelCardPreviewCanvas({
  card,
  width = 96,
  height = 145,
  affordable = false,
  className = "",
}: {
  card: DuelJewelCard;
  width?: number;
  height?: number;
  affordable?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, width, height);
      drawDuelPixelCard2D(ctx, 2, 2, width - 6, height - 6, card, {
        affordable,
        selected: true,
      });
      ctx.restore();
    };

    draw();
    getDuelCardPixelAtlas(draw);
  }, [card, width, height, affordable]);

  return (
    <canvas
      ref={ref}
      style={{ width, height, imageRendering: "pixelated" }}
      className={`shrink-0 ${className}`}
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

interface FlyingSprite {
  kind: "token" | "card" | "scroll";
  tokenColor?: DuelTokenColor;
  atlasKey?: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  arcLift: number;
  startMs: number;
  durationMs: number;
  baseSize: number; // radius for token, width for card, height for scroll
  peakScale: number;
  endScale: number;
  burstColor: string;
  landed: boolean;
  targetSeatNo?: number;
}

interface Shockwave {
  x: number;
  y: number;
  maxR: number;
  color: string;
  startMs: number;
  durationMs: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  startMs: number;
  durationMs: number;
}

interface DuelAnimStore {
  lastSeq: number;
  hoveredHitId: string | null;
  flyingSprites: FlyingSprite[];
  shockwaves: Shockwave[];
  floatingTexts: FloatingText[];
  spiralWave: { startMs: number; durationMs: number; lastIdx: number } | null;
  lineFlash: { cells: [number, number][]; startMs: number; durationMs: number } | null;
  banner: { text: string; startMs: number; durationMs: number } | null;
  seatPulse: Record<number, { startMs: number; color: string }>;
}

function createAnimStore(): DuelAnimStore {
  return {
    lastSeq: 0,
    hoveredHitId: null,
    flyingSprites: [],
    shockwaves: [],
    floatingTexts: [],
    spiralWave: null,
    lineFlash: null,
    banner: null,
    seatPulse: {},
  };
}

function emitPixelBurst(
  particles: ParticleSystem,
  x: number,
  y: number,
  count: number,
  color: string,
  speed = 95
) {
  for (let i = 0; i < count; i++) {
    const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
    const spd = speed * (0.45 + Math.random() * 0.75);
    particles.spawn({
      x,
      y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - 14,
      radius: 1.8 + Math.random() * 1.8,
      color,
      life: 0.45 + Math.random() * 0.35,
      maxLife: 0.8,
    });
  }
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
  const animStoreRef = useRef<DuelAnimStore>(createAnimStore());

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
        drawDuelMatchScene(
          ctx,
          width,
          height,
          st,
          regions,
          now,
          particlesRef.current,
          animStoreRef.current
        );
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

      // Instant tactile click ripple on canvas
      animStoreRef.current.shockwaves.push({
        x: px,
        y: py,
        maxR: 26,
        color: "#fde047",
        startMs: performance.now(),
        durationMs: 280,
      });

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
      animStoreRef.current.hoveredHitId = hit ? hit.id : null;
    };

    const handleMouseLeave = () => {
      animStoreRef.current.hoveredHitId = null;
    };

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
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

  // Title Banner (VT323 16-bit Pixel Font with full Vietnamese support)
  ctx.fillStyle = "#fef08a";
  ctx.font = canvasFont(400, compact ? 22 : 30, "pixel");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SPLENDOR DUEL — 1v1", width / 2, height * 0.14);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = canvasFont(600, compact ? 11.5 : 13.5, "sans");
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

  // 3 Standing Sculpted Privilege Scroll Figurines in center (like official tabletop!)
  const scrollW = compact ? 26 : 34;
  const scrollH = compact ? 32 : 42;
  for (let i = 0; i < 3; i++) {
    drawDuelPixelPrivilegeScroll2D(
      ctx,
      width / 2 - (3 * (scrollW + 4) - 4) / 2 + i * (scrollW + 4),
      height * 0.43 + (i === 1 ? 4 : 0),
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
    ctx.font = canvasFont(700, compact ? 10 : 12, "sans");
    ctx.textAlign = "center";
    ctx.fillText(
      idx === 0 ? "GHẾ 1 • ĐI TRƯỚC" : "GHẾ 2 • +1 ĐẶC QUYỀN 📜",
      bx + boxW / 2,
      boxY + 22
    );

    ctx.fillStyle = seat ? "#f8fafc" : "#64748b";
    ctx.font = canvasFont(700, compact ? 13 : 16, "sans");
    ctx.fillText(
      seat ? `${seat.displayName}${isMe ? " (Bạn)" : ""}` : "Đang chờ đối thủ...",
      bx + boxW / 2,
      boxY + boxH * 0.58
    );

    ctx.fillStyle = "#94a3b8";
    ctx.font = canvasFont(500, 11.5, "sans");
    ctx.fillText(
      seat ? "Sẵn sàng đối kháng" : "Mời bạn hoặc thêm Bot",
      bx + boxW / 2,
      boxY + boxH - 18
    );
  });

  // VS badge between seats
  ctx.fillStyle = "#fde047";
  ctx.font = canvasFont(400, compact ? 18 : 24, "pixel");
  ctx.textAlign = "center";
  ctx.fillText("VS", width / 2, boxY + boxH / 2);

  // Victory reminder footer
  ctx.fillStyle = "#94a3b8";
  ctx.font = canvasFont(600, compact ? 10.5 : 12.5, "sans");
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
  particles: ParticleSystem,
  anim: DuelAnimStore
) {
  const pv = st.playerView;
  if (!pv) return;

  const compact = width < 720;
  const isMyTurn = st.viewerSeatNo === pv.activeSeatNo;
  const viewerSeat =
    pv.seats.find((s) => s.seatNo === st.viewerSeatNo) ?? null;

  // =========================================================================
  // 1. TOP BAR: 4 Royal Cards + Privilege Supply & Timer
  // =========================================================================
  const topY = 8;
  const topH = compact ? 64 : 74;

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
  ctx.font = canvasFont(700, compact ? 10 : 11, "sans");
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`ĐẶC QUYỀN (${pv.privilegeSupply})`, rightHudX + 8, topY + 15);

  for (let i = 0; i < 3; i++) {
    const sx = rightHudX + 10 + i * 26;
    const sy = topY + 21;
    if (i < pv.privilegeSupply) {
      drawDuelPixelPrivilegeScroll2D(ctx, sx, sy, 22, 26, false);
    } else {
      drawRoundedRect(ctx, sx + 3, sy + 2, 16, 22, 4);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.28)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  ctx.fillStyle = "#cbd5e1";
  ctx.font = canvasFont(700, compact ? 10 : 11.5, "sans");
  ctx.fillText(`🎒 Túi: ${pv.bagCount}`, rightHudX + 8, topY + 57);

  if (pv.phaseDeadlineMs && pv.step !== "Finished") {
    const secLeft = Math.max(0, Math.ceil((pv.phaseDeadlineMs - Date.now()) / 1000));
    ctx.fillStyle = secLeft <= 15 ? "#f87171" : "#38bdf8";
    ctx.font = canvasFont(400, compact ? 14 : 16, "pixel");
    ctx.textAlign = "right";
    ctx.fillText(`⏱ ${secLeft}s`, rightHudX + rightHudW - 10, topY + 57);
  }

  // Top-left/center: 4 Royal Cards (clickable in RoyalPickStep)
  const royalAreaX = 14;
  const royalAreaW = Math.max(80, rightHudX - royalAreaX - 12);
  const royalCount = Math.max(1, pv.royals.length);
  const royalGap = 8;
  const royalH = topH - 4;
  const maxRoyalW = (royalAreaW - royalGap * (royalCount - 1)) / Math.max(4, royalCount);
  const royalW = Math.min(maxRoyalW, Math.round(royalH * 0.662));
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
  const boardSize = Math.floor(Math.min(maxBoardW - 16, midH - 12));
  const boardX = 16;
  const boardY = midTop + Math.floor((midH - boardSize) / 2);

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

  // Active mode hint only when in special pick state (no static "BÀN XOẮN ỐC 5x5" text)
  const activeBoardHint = st.privilegeMode
    ? "📜 CHỌN 1 ĐÁ QUÝ (KHÔNG PHẢI VÀNG)"
    : goldHighlightMode
      ? "🪙 CHỌN 1 XU VÀNG ĐỂ ĐẶT CỌC"
      : highlightMatchColor
        ? `➕ CHỌN 1 VIÊN ${DUEL_TOKEN_META[highlightMatchColor].shortVi.toUpperCase()}`
        : null;
  if (activeBoardHint) {
    ctx.fillStyle = st.privilegeMode ? "#fde047" : "#fbbf24";
    ctx.font = canvasFont(700, compact ? 10 : 11.5, "sans");
    ctx.textAlign = "center";
    ctx.fillText(activeBoardHint, boardX + boardSize / 2, boardY - 10);
  }

  // Register 25 clickable hit regions on the 5x5 board + crisp hover highlight
  const cellS = boardSize / 5;
  const cellCenter = (r: number, c: number) => ({
    x: boardX + c * cellS + cellS / 2,
    y: boardY + r * cellS + cellS / 2,
  });

  if (
    isMyTurn &&
    (pv.step === "TurnActionStep" || pv.step === "TakeMatchingStep")
  ) {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const tok = pv.board[boardIdx(r, c)];
        if (!tok) continue;
        const hitId = `board-${r}-${c}`;
        if (anim.hoveredHitId === hitId) {
          const pt = cellCenter(r, c);
          ctx.save();
          ctx.strokeStyle = "rgba(254, 240, 138, 0.9)";
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, cellS * 0.43, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        regions.push({
          id: hitId,
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
  const rowGap = 6;
  const cardGap = compact ? 5 : 8;
  const rowH = Math.floor((midH - rowGap * 2) / 3);
  // Fit 1 deck + 5 cards horizontally using exact 90:136 (0.662) pixel-art aspect ratio
  const maxCardW = Math.floor((pyrW - cardGap * 5) / 6);
  const cardW = Math.max(40, Math.min(maxCardW, Math.floor(rowH * 0.662)));
  const cardH = Math.max(60, Math.min(rowH, Math.floor(cardW * 1.511)));

  const deckAnchorMap: Record<number, { x: number; y: number }> = {};
  const pyramidAnchorMap: Record<string, { x: number; y: number }> = {};

  const tiers: SplendorCardTier[] = [3, 2, 1];
  tiers.forEach((tier, rowIdx) => {
    const ry = midTop + rowIdx * (rowH + rowGap) + Math.floor((rowH - cardH) / 2);

    // Tier Deck on left of row
    const deckX = pyrX;
    deckAnchorMap[tier] = { x: deckX + cardW / 2, y: ry + cardH / 2 };
    const deckCount = pv.deckCounts[tier];
    const deckSelected =
      st.selection?.kind === "deck" && st.selection.tier === tier;
    const deckHovered = anim.hoveredHitId === `duel-deck-${tier}`;
    drawSplendorPixelDeck2D(
      ctx,
      deckX,
      ry - (deckHovered ? 4 : 0),
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
      pyramidAnchorMap[`${tier}-${slotIdx}`] = {
        x: cx + cardW / 2,
        y: ry + cardH / 2,
      };
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
      const cardHovered = anim.hoveredHitId === `duel-card-${tier}-${slotIdx}`;
      const liftY = selected ? -4 : cardHovered ? -5 : 0;

      drawDuelPixelCard2D(ctx, cx, ry + liftY, cardW, cardH, card, {
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
  const seatAnchorMap: Record<number, { x: number; y: number }> = {};

  pv.seats.forEach((seat, idx) => {
    const sx = 10 + idx * (seatW + seatGap);
    seatAnchorMap[seat.seatNo] = { x: sx + seatW / 2, y: botY + botH * 0.45 };
    const isActive = seat.seatNo === pv.activeSeatNo && pv.step !== "Finished";
    const isMe = seat.seatNo === st.viewerSeatNo;
    const isWinner = seat.seatNo === pv.winnerSeatNo;
    const pulse = anim.seatPulse[seat.seatNo];
    const pulseT = pulse ? Math.max(0, 1 - (nowMs - pulse.startMs) / 520) : 0;

    drawRoundedRect(ctx, sx, botY, seatW, botH, 10);
    ctx.fillStyle = isWinner
      ? "rgba(113, 63, 18, 0.65)"
      : isMe
        ? "rgba(15, 23, 42, 0.9)"
        : "rgba(15, 18, 34, 0.82)";
    ctx.fill();
    if (pulseT > 0 && pulse) {
      ctx.save();
      ctx.globalAlpha = pulseT * 0.25;
      ctx.fillStyle = pulse.color;
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle =
      pulseT > 0 && pulse
        ? pulse.color
        : isWinner
          ? "#fde047"
          : isActive
            ? "#fbbf24"
            : isMe
              ? "#38bdf8"
              : "#334155";
    ctx.lineWidth = pulseT > 0 ? 3.2 : isActive || isWinner ? 2.4 : 1.4;
    ctx.stroke();

    // Header Row: Player Name + 3 Victory Progress Counters + Privileges
    ctx.fillStyle = isActive ? "#fde047" : "#f8fafc";
    ctx.font = canvasFont(700, compact ? 11.5 : 13.5, "sans");
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
    ctx.font = canvasFont(700, compact ? 9.5 : 11.5, "mono");
    ctx.fillStyle = seat.points >= 20 ? "#4ade80" : "#fde047";
    const statsText = `★${seat.points}/20  👑${seat.crowns}/10  💎${seat.maxSingleColorPoints}/10`;
    ctx.fillText(statsText, sx + seatW - 10, botY + 16);

    // Second Row: Privileges + Bag/Token Total + Purchased + Royals
    ctx.textAlign = "left";
    ctx.fillStyle = "#cbd5e1";
    ctx.font = canvasFont(600, compact ? 9.5 : 10.5, "sans");
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
      ctx.font = canvasFont(800, compact ? 10.5 : 12.5, "mono");
      ctx.textAlign = "center";
      ctx.fillText(String(tokQty), cx, colStartY + 30);

      // Bonus & Color Points underneath (for standard gems)
      if (isStandard) {
        ctx.fillStyle = bonus > 0 ? "#4ade80" : "#475569";
        ctx.font = canvasFont(700, compact ? 8.5 : 9.5, "mono");
        ctx.fillText(
          colPts > 0 ? `+${bonus} ★${colPts}` : `+${bonus}`,
          cx,
          colStartY + 44
        );
      } else {
        ctx.fillStyle = col === "pearl" ? "#f9a8d4" : "#fde047";
        ctx.font = canvasFont(700, compact ? 8.5 : 9.5, "sans");
        ctx.fillText(col === "pearl" ? "Trai" : "Vàng", cx, colStartY + 44);
      }
    });

    // Bottom Strip inside workbench: Reserved Cards pills (clickable for viewer)
    const resY = botY + 104;
    ctx.textAlign = "left";
    ctx.fillStyle = "#94a3b8";
    ctx.font = canvasFont(700, compact ? 9.5 : 10.5, "sans");
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
      ctx.font = canvasFont(700, compact ? 8.5 : 9.5, "mono");
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
      ctx.font = canvasFont(700, 10.5, "sans");
      ctx.textAlign = "center";
      ctx.fillText(DUEL_TOKEN_META[gem].shortVi, bx + btnW / 2, by + 56);
      ctx.fillStyle = "#fde047";
      ctx.font = canvasFont(700, 10, "mono");
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
        ctx.font = canvasFont(700, 11.5, "mono");
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
    const rw = compact ? 70 : 88;
    const rh = compact ? 106 : 133;
    const gap = 12;
    const totalW = pv.royals.length * rw + Math.max(0, pv.royals.length - 1) * gap;
    const startX = width / 2 - totalW / 2;
    const ry = height / 2 - rh / 2 + 10;

    pv.royals.forEach((royal, i) => {
      const rx = startX + i * (rw + gap);
      drawDuelPixelRoyalCard2D(ctx, rx, ry, rw, rh, royal, true);
      ctx.fillStyle = "#fef08a";
      ctx.font = canvasFont(700, 10.5, "sans");
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
    ctx.font = canvasFont(400, compact ? 19 : 24, "pixel");
    ctx.textAlign = "center";
    ctx.fillText(
      `🏆 ${winner?.displayName ?? "Người chiến thắng"} CHIẾN THẮNG!`,
      width / 2,
      by + 36
    );
    ctx.fillStyle = "#e2e8f0";
    ctx.font = canvasFont(600, compact ? 11.5 : 13.5, "sans");
    ctx.fillText(pv.winReasonVi ?? "", width / 2, by + 68, boxW - 24);
  }

  // =========================================================================
  // 5. ACTION ANIMATION CHOREOGRAPHY ENGINE (60fps Flying Coins, Cards, Waves)
  // =========================================================================
  if (pv.lastVisualEffect && pv.lastVisualEffect.seq !== anim.lastSeq) {
    const isFirstSync = anim.lastSeq === 0 && pv.turnNumber > 1;
    anim.lastSeq = pv.lastVisualEffect.seq;
    if (!isFirstSync) {
      triggerDuelVisualEffect(
        pv.lastVisualEffect,
        pv,
        {
          cellCenter,
          pyramidAnchorMap,
          deckAnchorMap,
          seatAnchorMap,
          privilegePos: { x: rightHudX + 46, y: topY + 34 },
          bagPos: { x: rightHudX + 36, y: topY + 57 },
          royalCenter: { x: royalAreaX + royalAreaW / 2, y: topY + topH / 2 },
          tokenR: Math.max(11, cellS * 0.37),
          cardW,
        },
        nowMs,
        particles,
        anim
      );
    }
  }

  // 5a. Golden Line Flash Beam (TAKE_LINE)
  if (anim.lineFlash) {
    const lf = anim.lineFlash;
    const t = (nowMs - lf.startMs) / lf.durationMs;
    if (t >= 1) {
      anim.lineFlash = null;
    } else if (lf.cells.length >= 1) {
      const sorted = [...lf.cells].sort((a, b) =>
        a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]
      );
      const p0 = cellCenter(sorted[0][0], sorted[0][1]);
      const pEnd = cellCenter(
        sorted[sorted.length - 1][0],
        sorted[sorted.length - 1][1]
      );
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t);
      ctx.strokeStyle = "#fef08a";
      ctx.lineWidth = 6 * (1 - t * 0.5);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(pEnd.x, pEnd.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 5b. Outward Golden Spiral Comet Wave (REPLENISH_BOARD)
  if (anim.spiralWave) {
    const sw = anim.spiralWave;
    const t = (nowMs - sw.startMs) / sw.durationMs;
    if (t >= 1) {
      anim.spiralWave = null;
    } else {
      const headFloat = t * (DUEL_SPIRAL_ORDER.length - 1);
      const headIdx = Math.min(DUEL_SPIRAL_ORDER.length - 1, Math.floor(headFloat));
      if (headIdx > sw.lastIdx) {
        sw.lastIdx = headIdx;
        const [sr, sc] = DUEL_SPIRAL_ORDER[headIdx];
        const sp = cellCenter(sr, sc);
        emitPixelBurst(particles, sp.x, sp.y, 4, "#fde047", 55);
      }
      ctx.save();
      ctx.strokeStyle = `rgba(253, 224, 71, ${0.9 * (1 - t * 0.4)})`;
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      const tailStart = Math.max(0, headIdx - 8);
      for (let i = tailStart; i <= headIdx; i++) {
        const [r, c] = DUEL_SPIRAL_ORDER[i];
        const pt = cellCenter(r, c);
        if (i === tailStart) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      const [hr, hc] = DUEL_SPIRAL_ORDER[headIdx];
      const hpt = cellCenter(hr, hc);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(hpt.x, hpt.y, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 5c. Expanding Radiant Shockwaves
  anim.shockwaves = anim.shockwaves.filter((sw) => {
    const t = (nowMs - sw.startMs) / sw.durationMs;
    if (t < 0) return true;
    if (t >= 1) return false;
    const eased = 1 - Math.pow(1 - t, 3);
    ctx.save();
    ctx.globalAlpha = (1 - t) * 0.85;
    ctx.strokeStyle = sw.color;
    ctx.lineWidth = 3 * (1 - t * 0.6);
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.maxR * eased, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return true;
  });

  // 5d. Flying 16-bit Pixel Art Coins, Cards & Standing Privilege Scrolls
  const cardAtlas = getDuelCardPixelAtlas();
  anim.flyingSprites = anim.flyingSprites.filter((sp) => {
    const rawT = (nowMs - sp.startMs) / sp.durationMs;
    if (rawT < 0) return true; // staggered start waiting
    if (rawT >= 1) {
      if (!sp.landed) {
        sp.landed = true;
        emitPixelBurst(particles, sp.toX, sp.toY, 10, sp.burstColor, 90);
        anim.shockwaves.push({
          x: sp.toX,
          y: sp.toY,
          maxR: sp.kind === "card" ? 44 : 26,
          color: sp.burstColor,
          startMs: nowMs,
          durationMs: 360,
        });
        if (sp.targetSeatNo !== undefined) {
          anim.seatPulse[sp.targetSeatNo] = {
            startMs: nowMs,
            color: sp.burstColor,
          };
        }
      }
      return false;
    }

    // Smooth easeInOutCubic along parabolic arc
    const t =
      rawT < 0.5
        ? 4 * rawT * rawT * rawT
        : 1 - Math.pow(-2 * rawT + 2, 3) / 2;
    const curX = sp.fromX + (sp.toX - sp.fromX) * t;
    const arcY = -4 * sp.arcLift * t * (1 - t);
    const curY = sp.fromY + (sp.toY - sp.fromY) * t + arcY;
    const scale =
      t < 0.5
        ? 1 + (sp.peakScale - 1) * (t * 2)
        : sp.peakScale + (sp.endScale - sp.peakScale) * ((t - 0.5) * 2);

    // Subtle sparkle trail while flying
    if (Math.random() < 0.45) {
      particles.spawn({
        x: curX + (Math.random() - 0.5) * 8,
        y: curY + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.5) * 18,
        radius: 1.8,
        color: sp.burstColor,
        life: 0.28,
        maxLife: 0.28,
      });
    }

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (sp.kind === "token" && sp.tokenColor) {
      drawDuelPixelTokenChip2D(
        ctx,
        curX,
        curY,
        sp.baseSize * scale,
        sp.tokenColor,
        true
      );
    } else if (sp.kind === "scroll") {
      const sh = sp.baseSize * scale;
      const sw = sh * 0.85;
      drawDuelPixelPrivilegeScroll2D(ctx, curX - sw / 2, curY - sh / 2, sw, sh, true);
    } else if (sp.kind === "card" && sp.atlasKey && cardAtlas) {
      const rect = DUEL_CARD_ATLAS_RECTS[sp.atlasKey];
      if (rect) {
        const cw = sp.baseSize * scale;
        const ch = cw * 1.511;
        // Shadow + golden glow
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        drawRoundedRect(ctx, curX - cw / 2 + 4, curY - ch / 2 + 6, cw, ch, 6);
        ctx.fill();
        ctx.save();
        drawRoundedRect(ctx, curX - cw / 2, curY - ch / 2, cw, ch, 6);
        ctx.clip();
        ctx.drawImage(
          cardAtlas,
          rect.sx,
          rect.sy,
          rect.sw,
          rect.sh,
          Math.round(curX - cw / 2),
          Math.round(curY - ch / 2),
          Math.round(cw),
          Math.round(ch)
        );
        ctx.restore();
        drawRoundedRect(ctx, curX - cw / 2, curY - ch / 2, cw, ch, 6);
        ctx.strokeStyle = "#fde047";
        ctx.lineWidth = 2.6;
        ctx.stroke();
      }
    }
    ctx.restore();
    return true;
  });

  // 5e. Floating Pixel Score & Action Popups (+2 ★, +1 👑, 🎯 CƯỚP ĐÁ!)
  anim.floatingTexts = anim.floatingTexts.filter((ft) => {
    const t = (nowMs - ft.startMs) / ft.durationMs;
    if (t < 0) return true;
    if (t >= 1) return false;
    const easeOut = 1 - Math.pow(1 - t, 2);
    const alpha = t > 0.72 ? (1 - t) / 0.28 : 1;
    const fy = ft.y - easeOut * 44;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.font = canvasFont(400, ft.size, "pixel");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#090d16";
    ctx.strokeText(ft.text, ft.x, fy);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, fy);
    ctx.restore();
    return true;
  });

  // 5f. Victory Confetti Fountain
  if (pv.step === "Finished" && Math.random() < 0.26) {
    const confColors = ["#fde047", "#4ade80", "#38bdf8", "#f472b6", "#f87171"];
    particles.spawn({
      x: width * (0.2 + Math.random() * 0.6),
      y: midTop + 10,
      vx: (Math.random() - 0.5) * 70,
      vy: 35 + Math.random() * 65,
      radius: 2.5 + Math.random() * 1.8,
      color: confColors[Math.floor(Math.random() * confColors.length)],
      life: 1.4,
      maxLife: 1.4,
    });
  }

  // 5g. Smooth Slide-In / Fade-Out Action Toast Banner
  if (anim.banner) {
    const b = anim.banner;
    const elapsed = nowMs - b.startMs;
    if (elapsed >= b.durationMs) {
      anim.banner = null;
    } else {
      const enterT = Math.min(1, elapsed / 200);
      const exitT =
        elapsed > b.durationMs - 450
          ? Math.max(0, (b.durationMs - elapsed) / 450)
          : 1;
      const slideOffset = (1 - Math.pow(1 - enterT, 3)) * 0 + (1 - enterT) * -14;

      const bw = Math.min(360, width - 40);
      const bx = width / 2 - bw / 2;
      const by = midTop - 2 + slideOffset;
      ctx.save();
      ctx.globalAlpha = enterT * exitT;
      drawRoundedRect(ctx, bx, by, bw, 25, 12);
      ctx.fillStyle = "rgba(10, 14, 28, 0.92)";
      ctx.fill();
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#fef08a";
      ctx.font = canvasFont(700, 11.5, "sans");
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(b.text, width / 2, by + 12.5, bw - 16);
      ctx.restore();
    }
  }
}

function triggerDuelVisualEffect(
  fx: DuelVisualEffect,
  pv: DuelPlayerView,
  anchors: {
    cellCenter: (r: number, c: number) => { x: number; y: number };
    pyramidAnchorMap: Record<string, { x: number; y: number }>;
    deckAnchorMap: Record<number, { x: number; y: number }>;
    seatAnchorMap: Record<number, { x: number; y: number }>;
    privilegePos: { x: number; y: number };
    bagPos: { x: number; y: number };
    royalCenter: { x: number; y: number };
    tokenR: number;
    cardW: number;
  },
  nowMs: number,
  particles: ParticleSystem,
  anim: DuelAnimStore
) {
  const actorPt = anchors.seatAnchorMap[fx.seatNo] ?? { x: 200, y: 500 };
  const oppSeat = pv.seats.find((s) => s.seatNo !== fx.seatNo);
  const oppPt = oppSeat ? anchors.seatAnchorMap[oppSeat.seatNo] : null;

  if (fx.bannerVi) {
    anim.banner = { text: fx.bannerVi, startMs: nowMs, durationMs: 2500 };
  }

  // 1. TAKE_LINE / Take Matching: Golden line flash + staggered flying pixel coins!
  if (fx.kind === "TAKE_LINE" && fx.cells?.length) {
    anim.lineFlash = { cells: fx.cells, startMs: nowMs, durationMs: 420 };
    fx.cells.forEach(([r, c], idx) => {
      const from = anchors.cellCenter(r, c);
      const tok = fx.cellTokens?.[idx] ?? "white";
      const burstCol = DUEL_TOKEN_META[tok].hex;
      emitPixelBurst(particles, from.x, from.y, 10, burstCol, 85);
      anim.shockwaves.push({
        x: from.x,
        y: from.y,
        maxR: 28,
        color: burstCol,
        startMs: nowMs + idx * 70,
        durationMs: 360,
      });
      anim.flyingSprites.push({
        kind: "token",
        tokenColor: tok,
        fromX: from.x,
        fromY: from.y,
        toX: actorPt.x + (idx - 1) * 26,
        toY: actorPt.y,
        arcLift: 68,
        startMs: nowMs + idx * 80,
        durationMs: 520,
        baseSize: anchors.tokenR,
        peakScale: 1.32,
        endScale: 0.78,
        burstColor: burstCol,
        landed: false,
        targetSeatNo: fx.seatNo,
      });
    });

    if (fx.grantedOppPrivilege && oppPt && oppSeat) {
      anim.flyingSprites.push({
        kind: "scroll",
        fromX: anchors.privilegePos.x,
        fromY: anchors.privilegePos.y,
        toX: oppPt.x,
        toY: oppPt.y,
        arcLift: 55,
        startMs: nowMs + 220,
        durationMs: 620,
        baseSize: 32,
        peakScale: 1.3,
        endScale: 0.85,
        burstColor: "#fde047",
        landed: false,
        targetSeatNo: oppSeat.seatNo,
      });
      anim.floatingTexts.push({
        x: oppPt.x,
        y: oppPt.y - 16,
        text: "📜 +1 ĐẶC QUYỀN",
        color: "#fde047",
        size: 16,
        startMs: nowMs + 500,
        durationMs: 1100,
      });
    }
    return;
  }

  // 2. SPEND_PRIVILEGE: Ivory Scroll flies to supply + chosen coin leaps to player!
  if (fx.kind === "SPEND_PRIVILEGE") {
    anim.flyingSprites.push({
      kind: "scroll",
      fromX: actorPt.x,
      fromY: actorPt.y,
      toX: anchors.privilegePos.x,
      toY: anchors.privilegePos.y,
      arcLift: 70,
      startMs: nowMs,
      durationMs: 480,
      baseSize: 32,
      peakScale: 1.25,
      endScale: 0.8,
      burstColor: "#fde047",
      landed: false,
    });
    const cell = fx.cells?.[0];
    const tok = fx.cellTokens?.[0];
    if (cell && tok) {
      const from = anchors.cellCenter(cell[0], cell[1]);
      const burstCol = DUEL_TOKEN_META[tok].hex;
      emitPixelBurst(particles, from.x, from.y, 12, "#fde047", 90);
      anim.flyingSprites.push({
        kind: "token",
        tokenColor: tok,
        fromX: from.x,
        fromY: from.y,
        toX: actorPt.x,
        toY: actorPt.y,
        arcLift: 72,
        startMs: nowMs + 140,
        durationMs: 520,
        baseSize: anchors.tokenR,
        peakScale: 1.35,
        endScale: 0.8,
        burstColor: burstCol,
        landed: false,
        targetSeatNo: fx.seatNo,
      });
    }
    return;
  }

  // 3. REPLENISH_BOARD: Golden Spiral Comet Wave + Privilege Scroll to opponent!
  if (fx.kind === "REPLENISH_BOARD") {
    anim.spiralWave = { startMs: nowMs, durationMs: 760, lastIdx: -1 };
    const center = anchors.cellCenter(2, 2);
    anim.shockwaves.push({
      x: center.x,
      y: center.y,
      maxR: anchors.tokenR * 5.2,
      color: "#fde047",
      startMs: nowMs,
      durationMs: 650,
    });
    if (oppPt && oppSeat) {
      anim.flyingSprites.push({
        kind: "scroll",
        fromX: anchors.privilegePos.x,
        fromY: anchors.privilegePos.y,
        toX: oppPt.x,
        toY: oppPt.y,
        arcLift: 58,
        startMs: nowMs + 180,
        durationMs: 600,
        baseSize: 32,
        peakScale: 1.3,
        endScale: 0.85,
        burstColor: "#fde047",
        landed: false,
        targetSeatNo: oppSeat.seatNo,
      });
      anim.floatingTexts.push({
        x: oppPt.x,
        y: oppPt.y - 16,
        text: "📜 +1 ĐẶC QUYỀN",
        color: "#fde047",
        size: 16,
        startMs: nowMs + 420,
        durationMs: 1100,
      });
    }
    return;
  }

  // 4. BUY_CARD: Paid coins fly to Bag + Jewel Card flies to buyer + Score/Crown popups!
  if (fx.kind === "BUY_CARD") {
    let coinIdx = 0;
    if (fx.tokens) {
      for (const col of DUEL_TOKEN_COLORS) {
        const qty = fx.tokens[col] ?? 0;
        for (let k = 0; k < Math.min(qty, 4); k++) {
          anim.flyingSprites.push({
            kind: "token",
            tokenColor: col,
            fromX: actorPt.x + (coinIdx - 2) * 14,
            fromY: actorPt.y,
            toX: anchors.bagPos.x,
            toY: anchors.bagPos.y,
            arcLift: 60,
            startMs: nowMs + coinIdx * 45,
            durationMs: 420,
            baseSize: anchors.tokenR * 0.82,
            peakScale: 1.15,
            endScale: 0.65,
            burstColor: DUEL_TOKEN_META[col].hex,
            landed: false,
          });
          coinIdx++;
        }
      }
    }

    const fromCard =
      fx.tier !== undefined && fx.slotIndex !== undefined
        ? anchors.pyramidAnchorMap[`${fx.tier}-${fx.slotIndex}`] ?? actorPt
        : { x: actorPt.x, y: actorPt.y - 40 };

    if (fx.cardId) {
      anim.shockwaves.push({
        x: fromCard.x,
        y: fromCard.y,
        maxR: 48,
        color: "#4ade80",
        startMs: nowMs + 80,
        durationMs: 420,
      });
      anim.flyingSprites.push({
        kind: "card",
        atlasKey: fx.cardId,
        fromX: fromCard.x,
        fromY: fromCard.y,
        toX: actorPt.x,
        toY: actorPt.y,
        arcLift: 85,
        startMs: nowMs + 100,
        durationMs: 620,
        baseSize: anchors.cardW,
        peakScale: 1.32,
        endScale: 0.68,
        burstColor: "#4ade80",
        landed: false,
        targetSeatNo: fx.seatNo,
      });
    }

    if ((fx.pointsGained ?? 0) > 0) {
      anim.floatingTexts.push({
        x: actorPt.x - 28,
        y: actorPt.y - 18,
        text: `+${fx.pointsGained} ★`,
        color: "#fde047",
        size: 20,
        startMs: nowMs + 420,
        durationMs: 1200,
      });
    }
    if ((fx.crownsGained ?? 0) > 0) {
      anim.floatingTexts.push({
        x: actorPt.x + 34,
        y: actorPt.y - 18,
        text: `+${fx.crownsGained} 👑`,
        color: "#fbbf24",
        size: 20,
        startMs: nowMs + 500,
        durationMs: 1200,
      });
    }
    return;
  }

  // 5. RESERVE_CARD: Gold Coin flies from board + Card (or Deck Back) flies to player!
  if (fx.kind === "RESERVE_CARD") {
    const gCell = fx.cells?.[0];
    if (gCell) {
      const gPt = anchors.cellCenter(gCell[0], gCell[1]);
      emitPixelBurst(particles, gPt.x, gPt.y, 14, "#facc15", 100);
      anim.flyingSprites.push({
        kind: "token",
        tokenColor: "gold",
        fromX: gPt.x,
        fromY: gPt.y,
        toX: actorPt.x - 20,
        toY: actorPt.y,
        arcLift: 74,
        startMs: nowMs,
        durationMs: 540,
        baseSize: anchors.tokenR,
        peakScale: 1.38,
        endScale: 0.8,
        burstColor: "#facc15",
        landed: false,
        targetSeatNo: fx.seatNo,
      });
    }

    const fromSlot = fx.fromDeck
      ? fx.tier !== undefined
        ? anchors.deckAnchorMap[fx.tier]
        : null
      : fx.tier !== undefined && fx.slotIndex !== undefined
        ? anchors.pyramidAnchorMap[`${fx.tier}-${fx.slotIndex}`]
        : null;
    const atlasKey = fx.fromDeck
      ? `deck-${fx.tier ?? 1}`
      : fx.cardId ?? `deck-${fx.tier ?? 1}`;

    if (fromSlot) {
      anim.flyingSprites.push({
        kind: "card",
        atlasKey,
        fromX: fromSlot.x,
        fromY: fromSlot.y,
        toX: actorPt.x + 28,
        toY: actorPt.y + 18,
        arcLift: 72,
        startMs: nowMs + 100,
        durationMs: 580,
        baseSize: anchors.cardW * 0.92,
        peakScale: 1.18,
        endScale: 0.6,
        burstColor: "#fbbf24",
        landed: false,
        targetSeatNo: fx.seatNo,
      });
    }
    return;
  }

  // 6. STEAL_TOKEN: Crimson target shockwave + stolen coin rockets across workbenches!
  if (fx.kind === "STEAL_TOKEN" && oppPt) {
    const stolenCol = DUEL_TOKEN_COLORS.find((c) => (fx.tokens?.[c] ?? 0) > 0) ?? "pearl";
    anim.shockwaves.push({
      x: oppPt.x,
      y: oppPt.y,
      maxR: 46,
      color: "#fb7185",
      startMs: nowMs,
      durationMs: 420,
    });
    emitPixelBurst(particles, oppPt.x, oppPt.y, 14, "#fb7185", 100);
    anim.flyingSprites.push({
      kind: "token",
      tokenColor: stolenCol,
      fromX: oppPt.x,
      fromY: oppPt.y,
      toX: actorPt.x,
      toY: actorPt.y,
      arcLift: 90,
      startMs: nowMs + 60,
      durationMs: 560,
      baseSize: anchors.tokenR * 1.05,
      peakScale: 1.4,
      endScale: 0.85,
      burstColor: "#fb7185",
      landed: false,
      targetSeatNo: fx.seatNo,
    });
    anim.floatingTexts.push({
      x: actorPt.x,
      y: actorPt.y - 22,
      text: "🎯 CƯỚP ĐÁ!",
      color: "#fda4af",
      size: 18,
      startMs: nowMs + 340,
      durationMs: 1100,
    });
    return;
  }

  // 7. CLAIM_ROYAL: Royal Portrait glides down in golden sunburst!
  if (fx.kind === "CLAIM_ROYAL") {
    anim.shockwaves.push({
      x: anchors.royalCenter.x,
      y: anchors.royalCenter.y,
      maxR: 64,
      color: "#fde047",
      startMs: nowMs,
      durationMs: 560,
    });
    emitPixelBurst(particles, anchors.royalCenter.x, anchors.royalCenter.y, 20, "#fde047", 120);
    if (fx.royalId) {
      anim.flyingSprites.push({
        kind: "card",
        atlasKey: fx.royalId,
        fromX: anchors.royalCenter.x,
        fromY: anchors.royalCenter.y,
        toX: actorPt.x,
        toY: actorPt.y,
        arcLift: 55,
        startMs: nowMs + 40,
        durationMs: 700,
        baseSize: anchors.cardW * 1.05,
        peakScale: 1.38,
        endScale: 0.72,
        burstColor: "#fde047",
        landed: false,
        targetSeatNo: fx.seatNo,
      });
    }
    anim.floatingTexts.push({
      x: actorPt.x,
      y: actorPt.y - 24,
      text: `👑 +${fx.pointsGained ?? 2} ★`,
      color: "#fde047",
      size: 22,
      startMs: nowMs + 420,
      durationMs: 1300,
    });
    return;
  }

  // 8. EXTRA_TURN: Cyan-gold double shockwave + bold pixel floating banner!
  if (fx.kind === "EXTRA_TURN") {
    anim.shockwaves.push({
      x: actorPt.x,
      y: actorPt.y,
      maxR: 72,
      color: "#38bdf8",
      startMs: nowMs,
      durationMs: 560,
    });
    anim.shockwaves.push({
      x: actorPt.x,
      y: actorPt.y,
      maxR: 52,
      color: "#fde047",
      startMs: nowMs + 140,
      durationMs: 500,
    });
    emitPixelBurst(particles, actorPt.x, actorPt.y, 18, "#38bdf8", 110);
    anim.seatPulse[fx.seatNo] = { startMs: nowMs, color: "#38bdf8" };
    anim.floatingTexts.push({
      x: actorPt.x,
      y: actorPt.y - 24,
      text: "🔄 ĐI THÊM LƯỢT!",
      color: "#7dd3fc",
      size: 21,
      startMs: nowMs + 40,
      durationMs: 1350,
    });
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
  ctx.font = canvasFont(700, 14.5, "sans");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, width / 2, py + 28, panelW - 20);
}
