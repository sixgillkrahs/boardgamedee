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
  drawIkLobbyBackground2D,
  getIkCardSpriteBgStyle,
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
  type IkCardType,
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
  const lastCssLayoutRef = useRef<{ dockH: number; oppBottom: number }>({
    dockH: -1,
    oppBottom: -1,
  });
  const lastAnimIdRef = useRef<number>(0);
  const lastConfettiMsRef = useRef<number>(0);
  const holdStateRef = useRef<ActiveHoldState | null>(null);
  const [inspectedCard, setInspectedCard] = useState<IkCard | null>(null);
  const [stealNotice, setStealNotice] = useState<{
    id: number;
    role: "victim" | "thief";
    fromTower: boolean;
    otherName: string;
    card: IkCard | null;
  } | null>(null);
  const [comboNotice, setComboNotice] = useState<{
    id: number;
    comboKind: "COMBO_2" | "COMBO_3" | "COMBO_5" | "BOOST";
    actorName: string;
    targetName: string | null;
    wantedCardType?: IkCardType;
    cards: IkCard[];
  } | null>(null);

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
    if (!stealNotice) return;
    const tid = window.setTimeout(() => {
      setStealNotice((cur) => (cur?.id === stealNotice.id ? null : cur));
    }, 4800);
    return () => window.clearTimeout(tid);
  }, [stealNotice]);

  useEffect(() => {
    if (!comboNotice) return;
    const tid = window.setTimeout(() => {
      setComboNotice((cur) => (cur?.id === comboNotice.id ? null : cur));
    }, 3800);
    return () => window.clearTimeout(tid);
  }, [comboNotice]);

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

      if (
        anim.kind === "PLAY_CARD" &&
        anim.comboKind &&
        anim.cards &&
        anim.cards.length >= 2
      ) {
        const actorName =
          playerView.seats.find((s) => s.seatNo === anim.actorSeatNo)
            ?.displayName ?? "Người chơi";
        const targetName =
          anim.targetSeatNo !== undefined
            ? playerView.seats.find((s) => s.seatNo === anim.targetSeatNo)
                ?.displayName ?? null
            : null;
        setComboNotice({
          id: anim.id,
          comboKind: anim.comboKind,
          actorName,
          targetName,
          wantedCardType: anim.wantedCardType,
          cards: anim.cards,
        });
      }

      if (anim.kind === "COMBO_STEAL" && viewerSeatNo !== null) {
        if (anim.targetSeatNo === viewerSeatNo) {
          const thiefName =
            playerView.seats.find((s) => s.seatNo === anim.actorSeatNo)
              ?.displayName ?? "Đối thủ";
          setStealNotice({
            id: anim.id,
            role: "victim",
            fromTower: Boolean(anim.fromTower),
            otherName: thiefName,
            card: anim.card ?? null,
          });
        } else if (anim.actorSeatNo === viewerSeatNo && anim.card) {
          const victimName =
            playerView.seats.find((s) => s.seatNo === anim.targetSeatNo)
              ?.displayName ?? "Đối thủ";
          setStealNotice({
            id: anim.id,
            role: "thief",
            fromTower: Boolean(anim.fromTower),
            otherName: victimName,
            card: anim.card,
          });
        }
      }
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
    window.addEventListener("orientationchange", resize);
    window.visualViewport?.addEventListener("resize", resize);
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

      const newHitRegions: HitRegion[] = [];
      const isShort = height < 520;
      const isPortrait = height > width && width < 700;
      const isCompactW = width < 640;

      const syncCssLayoutVars = (dockFromBottomPx: number, oppBottomPx: number) => {
        const roundedDock = Math.round(dockFromBottomPx);
        const roundedOpp = Math.round(oppBottomPx);
        if (
          lastCssLayoutRef.current.dockH === roundedDock &&
          lastCssLayoutRef.current.oppBottom === roundedOpp
        ) {
          return;
        }
        lastCssLayoutRef.current = {
          dockH: roundedDock,
          oppBottom: roundedOpp,
        };
        const roomWrap = canvas.parentElement?.parentElement;
        if (roomWrap) {
          roomWrap.style.setProperty("--ik-dock-h", `${roundedDock}px`);
          roomWrap.style.setProperty("--ik-opp-bottom", `${roundedOpp}px`);
        }
      };

      if (curMode === "lobby" || !pv) {
        fx.activeFavorPaw = null;
        drawIkLobbyBackground2D(ctx, width, height, now);

        // Bold 2D comic header title floating cleanly above the screaming black cat artwork
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const titleSize = isShort
          ? Math.min(20, Math.round(height * 0.062))
          : isPortrait
            ? Math.min(28, Math.max(19, Math.round(width * 0.068)))
            : Math.min(34, Math.max(22, Math.round(width * 0.036)));
        const titleY = isShort
          ? Math.max(16, height * 0.065)
          : Math.min(44, Math.max(24, height * 0.065));
        ctx.font = `900 ${titleSize}px ${fonts.sans}`;
        ctx.lineJoin = "round";
        ctx.lineWidth = Math.max(4, titleSize * 0.2);
        ctx.strokeStyle = "rgba(15, 5, 10, 0.92)";
        ctx.strokeText("IMPLODING KITTENS", width * 0.5, titleY, width - 24);
        ctx.fillStyle = "#fde047";
        ctx.fillText("IMPLODING KITTENS", width * 0.5, titleY, width - 24);

        if (!isShort) {
          const subY = titleY + titleSize * 0.85;
          ctx.font = `700 ${isPortrait ? 10.5 : 12}px ${fonts.sans}`;
          ctx.lineWidth = 3.2;
          ctx.strokeStyle = "rgba(15, 5, 10, 0.88)";
          const subText = isPortrait
            ? "Mèo Nổ • 5 Bản Mở Rộng Tùy Chọn"
            : "Mèo Nổ • Trọn Bộ 5 Bản Mở Rộng (Imploding • Streaking • Barking • Zombie • Good vs. Evil)";
          ctx.strokeText(subText, width * 0.5, subY, width - 24);
          ctx.fillStyle = "#f8fafc";
          ctx.fillText(subText, width * 0.5, subY, width - 24);
        }
        ctx.restore();
      } else {
        drawIkBackground2D(
          ctx,
          width,
          height,
          now,
          pv?.direction ?? 1,
          Boolean(pv?.faceUpImplodingInDeck)
        );
        // --- ACTIVE MATCH TABLETOP ---
        const mySeat =
          pv.seats.find((s) => s.seatNo === curViewer) ?? pv.seats[0];
        const opponents = pv.seats.filter((s) => s.seatNo !== mySeat.seatNo);
        const isMyTurn =
          pv.activeSeatNo === curViewer && pv.step === "TurnPlayStep";

        const seatPositions = new Map<number, { x: number; y: number }>();

        // 1. TOP OPPONENTS GRID — Auto-wraps to 2 rows on narrow portrait phones with 4+ opponents!
        const oppCount = Math.max(1, opponents.length);
        const oppPadX = isShort || isPortrait ? 12 : 28;
        const oppGap = isShort || isPortrait ? 6 : 10;
        const singleRowW = Math.floor(
          (width - oppPadX - oppGap * (oppCount - 1)) / oppCount
        );
        const useTwoOppRows =
          !isShort &&
          opponents.length >= 4 &&
          (isPortrait || singleRowW < 108);
        const oppRowGap = 5;
        const oppTopY = isShort ? 5 : isPortrait ? 8 : 12;
        const oppH = isShort
          ? Math.max(42, Math.min(54, Math.round(height * 0.145)))
          : useTwoOppRows
            ? 50
            : isPortrait
              ? 64
              : width < 820
                ? 88
                : 112;

        const topRowCount = useTwoOppRows
          ? Math.ceil(opponents.length / 2)
          : opponents.length;

        let maxOppBottom = oppTopY + oppH;

        opponents.forEach((opp, idx) => {
          const rowIdx = useTwoOppRows && idx >= topRowCount ? 1 : 0;
          const colIdx = rowIdx === 0 ? idx : idx - topRowCount;
          const colsInRow =
            rowIdx === 0
              ? Math.max(1, topRowCount)
              : Math.max(1, opponents.length - topRowCount);
          const oppW = Math.min(
            isShort ? 210 : isPortrait ? 190 : 235,
            Math.floor((width - oppPadX - oppGap * (colsInRow - 1)) / colsInRow)
          );
          const rowTotalW = oppW * colsInRow + oppGap * (colsInRow - 1);
          const ox = Math.round(width * 0.5 - rowTotalW * 0.5 + colIdx * (oppW + oppGap));
          const oy = oppTopY + rowIdx * (oppH + oppRowGap);
          maxOppBottom = Math.max(maxOppBottom, oy + oppH);

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

          const cardRadius = oppH < 60 ? 10 : 12;

          // Animated breathing spotlight halo on acting opponent or targeted opponent
          if (opp.alive && (isActing || isTarget)) {
            const pulse = 0.5 + 0.5 * Math.sin(now / 260);
            ctx.save();
            ctx.shadowColor = isTarget ? "#f43f5e" : "#facc15";
            ctx.shadowBlur = 9 + pulse * 12;
            drawRoundedRect(ctx, ox, oy, oppW, oppH, cardRadius);
            ctx.strokeStyle = isTarget
              ? "rgba(244, 63, 94, 0.85)"
              : "rgba(250, 204, 21, 0.85)";
            ctx.lineWidth = 2.4;
            ctx.stroke();
            ctx.restore();
          }

          drawRoundedRect(ctx, ox, oy, oppW, oppH, cardRadius);
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
          ctx.lineWidth = isTarget || isActing ? 2.2 : 1.2;
          ctx.stroke();

          const compactOpp = oppH < 72 || oppW < 130;
          const padIn = compactOpp ? 7 : 10;
          const headerY = oy + (oppH < 54 ? 15 : 18);
          const statusRightReserve = compactOpp ? 48 : 66;
          const nameMaxW = Math.max(24, oppW - padIn * 2 - statusRightReserve);

          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillStyle = opp.alive ? "#f8fafc" : "#64748b";
          ctx.font = `800 ${compactOpp ? 10.5 : 12}px ${fonts.sans}`;
          ctx.fillText(
            `${isTarget ? "▸ " : ""}${opp.displayName}`,
            ox + padIn,
            headerY,
            nameMaxW
          );

          ctx.textAlign = "right";
          ctx.fillStyle = !opp.alive
            ? "#f87171"
            : isActing
              ? "#fde047"
              : "#38bdf8";
          ctx.font = `800 ${compactOpp ? 9.5 : 10.5}px ${fonts.mono}`;
          ctx.fillText(
            !opp.alive
              ? opp.eliminatedBy === "imploding"
                ? "SẬP HỐ"
                : opp.eliminatedBy === "devilcat"
                  ? "MÈO QUỶ"
                  : "ĐÃ NỔ"
              : isActing
                ? `${pv.turnsRemaining} LƯỢT`
                : `${opp.handCount} LÁ`,
            ox + oppW - padIn,
            headerY,
            statusRightReserve + 6
          );

          const badges: string[] = [];
          if (opp.hasGodcat) {
            badges.push("Mèo Thần");
          }
          if (pv.towerHolderSeatNo === opp.seatNo && pv.towerStashCount > 0) {
            badges.push(`Tháp(${pv.towerStashCount})`);
          }
          if (opp.isBlind) badges.push("Mù");
          if (opp.barkingPlayedFaceUp) badges.push("Mèo Sủa");
          if (opp.illTakeThatFromSeatNo !== null)
            badges.push("Cướp Rút");
          if (oppH < 82 && opp.markedCards.length > 0) {
            badges.push(
              `${opp.markedCards.map((mc) => IK_CARD_META[mc.type].shortVi).join(", ")}`
            );
          }
          const subLineY = oy + (oppH < 54 ? 33 : 36);
          if (badges.length > 0) {
            ctx.textAlign = "left";
            ctx.fillStyle = "#fda4af";
            ctx.font = `700 ${compactOpp ? 8.5 : 9.5}px ${fonts.sans}`;
            ctx.fillText(
              badges.join(" • "),
              ox + padIn,
              subLineY,
              Math.max(24, oppW - padIn * 2)
            );
          } else if (oppH < 82 && opp.alive) {
            ctx.textAlign = "left";
            ctx.fillStyle = isTarget ? "#fda4af" : "#94a3b8";
            ctx.font = `600 ${compactOpp ? 8.5 : 9.5}px ${fonts.sans}`;
            ctx.fillText(
              isTarget ? "Đang chọn mục tiêu" : "Chạm chọn mục tiêu",
              ox + padIn,
              subLineY,
              Math.max(24, oppW - padIn * 2)
            );
          }

          if (opp.alive && oppH >= 82) {
            const miniW = oppH < 96 ? 22 : 28;
            const miniH = Math.round(miniW * 1.43);
            const showCount = Math.min(7, opp.handCount);
            const stepMini = Math.min(
              miniW - 6,
              Math.floor((oppW - padIn * 2 - miniW) / Math.max(1, showCount - 1))
            );
            for (let cIdx = 0; cIdx < showCount; cIdx++) {
              const markedCard = opp.markedCards[cIdx] ?? null;
              const idleBob = isActing
                ? Math.sin(now / 260 + cIdx * 0.6) * 2.5
                : 0;
              drawIkCard2D(
                ctx,
                ox + padIn + cIdx * (showCount > 1 ? Math.max(8, stepMini) : 0),
                oy + (oppH < 96 ? 48 : 52) + idleBob,
                miniW,
                miniH,
                markedCard,
                { now }
              );
            }
          }
        });

        // 2. BOTTOM HAND DOCK DIMENSIONS (Computed before Arena so Arena gets exact free space!)
        const handCards = pv.myHand;
        const useTwoHandRows = isPortrait && handCards.length >= 7;
        const dockMarginBottom = isShort ? 4 : 6;
        const dockH = isShort
          ? Math.max(96, Math.min(130, Math.round(height * 0.34)))
          : isPortrait
            ? useTwoHandRows
              ? Math.max(182, Math.min(248, Math.round(height * 0.33)))
              : Math.max(138, Math.min(182, Math.round(height * 0.24)))
            : Math.max(176, Math.min(220, Math.round(height * 0.28)));
        const dockY = height - dockH - dockMarginBottom;

        const oppBottom = maxOppBottom + (isShort ? 4 : 8);
        syncCssLayoutVars(height - dockY, oppBottom);

        // 3. CENTER ARENA — Separate clean layout for Portrait/Narrow vs Landscape/Desktop!
        const actionBarReserve = isMyTurn ? (isShort ? 40 : 48) : isShort ? 12 : 16;
        const arenaTop = oppBottom;
        const arenaBottom = Math.max(arenaTop + 84, dockY - actionBarReserve);
        const arenaAvailH = arenaBottom - arenaTop;

        let pileW = 92;
        let pileH = 132;
        let drawX = 0;
        let drawY = 0;
        let discardX = 0;
        let discardY = 0;
        let arenaCenterY = arenaTop + arenaAvailH * 0.5;
        let orbitRadius = 56;

        const actSeat = pv.seats.find((s) => s.seatNo === pv.activeSeatNo);
        const hasSecondaryStatus =
          Boolean(pv.faceUpImplodingInDeck) ||
          Boolean(pv.config.expansions.good_vs_evil);

        if (isCompactW) {
          // PORTRAIT / NARROW LAYOUT: Status Pill on top, Draw & Discard Piles cleanly side-by-side below!
          const statusBoxH = hasSecondaryStatus ? 44 : 28;
          const statusY = arenaTop + statusBoxH * 0.5 + 2;
          const pilesTop = arenaTop + statusBoxH + 10;
          const pilesAvailH = Math.max(76, arenaBottom - pilesTop - 22);
          const pairGap = Math.max(18, Math.min(36, Math.round(width * 0.065)));
          const maxPileWByW = Math.floor((width - 34 - pairGap) * 0.5);
          const maxPileHByH = Math.max(74, Math.min(168, pilesAvailH));
          pileH = Math.round(Math.min(maxPileHByH, maxPileWByW * 1.44));
          pileW = Math.round(pileH / 1.44);

          arenaCenterY = pilesTop + pilesAvailH * 0.5;
          drawX = Math.round(width * 0.5 - pileW - pairGap * 0.5);
          discardX = Math.round(width * 0.5 + pairGap * 0.5);
          drawY = Math.round(arenaCenterY - pileH * 0.5);
          discardY = drawY;
          orbitRadius = Math.max(26, Math.min(44, pileW * 0.42));

          // Centered Status Pill above the 2 piles (Zero collision with cards!)
          const pillW = Math.min(width - 20, 380);
          drawRoundedRect(
            ctx,
            width * 0.5 - pillW * 0.5,
            statusY - statusBoxH * 0.5,
            pillW,
            statusBoxH,
            10
          );
          ctx.fillStyle = "rgba(9, 13, 22, 0.78)";
          ctx.fill();
          ctx.strokeStyle = pv.faceUpImplodingInDeck
            ? "rgba(216, 180, 254, 0.65)"
            : "rgba(250, 204, 21, 0.35)";
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#fde047";
          ctx.font = `800 11px ${fonts.sans}`;
          const dirSymbol = pv.direction === 1 ? "↻" : "↺";
          ctx.fillText(
            `${dirSymbol} Lượt: ${actSeat?.displayName ?? "..."} (${pv.turnsRemaining} lượt)`,
            width * 0.5,
            hasSecondaryStatus ? statusY - 8 : statusY,
            pillW - 16
          );
          if (pv.faceUpImplodingInDeck) {
            ctx.fillStyle = "#e879f9";
            ctx.font = `800 9.5px ${fonts.sans}`;
            ctx.fillText(
              "Cảnh báo: Có Mèo Hố Đen LẬT NGỬA trong Bộ bài!",
              width * 0.5,
              statusY + 10,
              pillW - 16
            );
          } else if (pv.config.expansions.good_vs_evil) {
            const godcatHolder = pv.seats.find((s) => s.hasGodcat);
            ctx.fillStyle = pv.godcatOnPlaymat ? "#fde047" : "#fb923c";
            ctx.font = `700 9.5px ${fonts.sans}`;
            ctx.fillText(
              pv.godcatOnPlaymat
                ? "Thảm Thiện & Ác: Mèo Thần + Mèo Quỷ (Sẵn sàng)"
                : `Mèo Thần đang trong tay ${godcatHolder?.displayName ?? "..."}`,
              width * 0.5,
              statusY + 10,
              pillW - 16
            );
          }
        } else {
          // LANDSCAPE / TABLET / DESKTOP 3-COLUMN ARENA: Draw Pile | Center Status | Discard Pile
          const labelReserve = isShort ? 18 : 30;
          const maxPileHBySpace = Math.max(
            60,
            Math.min(168, arenaAvailH - labelReserve)
          );
          pileH = isShort
            ? Math.round(maxPileHBySpace)
            : Math.round(
                Math.min(
                  maxPileHBySpace,
                  Math.min(116, Math.max(88, width * 0.1)) * 1.44
                )
              );
          pileW = Math.round(pileH / 1.44);
          const centerHalfGap = isShort
            ? Math.max(66, Math.min(102, Math.round(width * 0.13)))
            : Math.max(82, Math.min(112, Math.round(width * 0.11)));

          arenaCenterY = arenaTop + (arenaAvailH - labelReserve * 0.45) * 0.5;
          drawX = Math.round(width * 0.5 - pileW - centerHalfGap);
          discardX = Math.round(width * 0.5 + centerHalfGap);
          drawY = Math.round(arenaCenterY - pileH * 0.5);
          discardY = drawY;
          orbitRadius = Math.max(30, Math.min(58, centerHalfGap * 0.56, arenaAvailH * 0.36));

          // Animated rotating orbital direction ring in center arena
          ctx.save();
          ctx.translate(width * 0.5, arenaCenterY);
          const orbitAngle = (now / 2600) * pv.direction;
          ctx.rotate(orbitAngle);
          ctx.strokeStyle = pv.faceUpImplodingInDeck
            ? "rgba(216, 180, 254, 0.34)"
            : "rgba(250, 204, 21, 0.22)";
          ctx.lineWidth = 2;
          ctx.setLineDash([10, 8]);
          ctx.beginPath();
          ctx.arc(0, 0, orbitRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          for (let k = 0; k < 2; k++) {
            const a = k * Math.PI;
            const ax = Math.cos(a) * orbitRadius;
            const ay = Math.sin(a) * orbitRadius;
            ctx.save();
            ctx.translate(ax, ay);
            ctx.rotate(
              a + (pv.direction === 1 ? Math.PI * 0.5 : -Math.PI * 0.5)
            );
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

          // Center Cone of Shame Direction & Active Turn Indicator (clamped cleanly between piles!)
          const centerMaxTextW = Math.max(96, centerHalfGap * 1.88);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#f8fafc";
          ctx.font = `900 ${isShort ? 11 : 13}px ${fonts.sans}`;
          ctx.fillText(
            pv.direction === 1 ? "↻ Chiều Kim Đồng Hồ" : "↺ Ngược Kim Đồng Hồ",
            width * 0.5,
            arenaCenterY - (isShort ? 15 : 18),
            centerMaxTextW
          );
          ctx.fillStyle = "#fde047";
          ctx.font = `800 ${isShort ? 10.5 : 11.5}px ${fonts.sans}`;
          ctx.fillText(
            `Lượt: ${actSeat?.displayName ?? "..."} (${pv.turnsRemaining})`,
            width * 0.5,
            arenaCenterY + (isShort ? 2 : 4),
            centerMaxTextW
          );
          if (pv.faceUpImplodingInDeck) {
            ctx.fillStyle = "#e879f9";
            ctx.font = `800 ${isShort ? 8.5 : 10}px ${fonts.sans}`;
            ctx.fillText(
              "Có Mèo Hố Đen LẬT NGỬA!",
              width * 0.5,
              arenaCenterY + (isShort ? 18 : 24),
              centerMaxTextW
            );
          }
          if (pv.config.expansions.good_vs_evil) {
            const godcatHolder = pv.seats.find((s) => s.hasGodcat);
            ctx.fillStyle = pv.godcatOnPlaymat ? "#fde047" : "#fb923c";
            ctx.font = `800 ${isShort ? 8.5 : 9.5}px ${fonts.sans}`;
            ctx.fillText(
              pv.godcatOnPlaymat
                ? "Thảm: Mèo Thần + Mèo Quỷ"
                : `Mèo Thần: ${godcatHolder?.displayName ?? "..."}`,
              width * 0.5,
              arenaCenterY +
                (pv.faceUpImplodingInDeck
                  ? isShort
                    ? 30
                    : 40
                  : isShort
                    ? 18
                    : 24),
              centerMaxTextW
            );
          }
        }

        seatPositions.set(mySeat.seatNo, {
          x: width * 0.5,
          y: dockY + dockH * 0.48,
        });

        // Update live anchors for FX engine (including exact dockTopY & oppBottomY!)
        anchorsRef.current = {
          width,
          height,
          drawPile: { x: drawX, y: drawY, w: pileW, h: pileH },
          discardPile: { x: discardX, y: discardY, w: pileW, h: pileH },
          center: { x: width * 0.5, y: arenaCenterY },
          seatPositions,
          dockTopY: dockY,
          oppBottomY: oppBottom,
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

        // Reverse spin vortex overlay if active
        fx.drawReverseSwirl(ctx, width * 0.5, arenaCenterY, now);

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
          ctx.shadowBlur = 12 + pulse * 16;
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
          const pulseR = 12 + ((now / 18) % 28);
          ctx.save();
          ctx.strokeStyle = "rgba(216, 180, 254, 0.75)";
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.arc(
            drawX + pileW * 0.5,
            drawY + pileH * 0.5,
            pileW * 0.5 + pulseR,
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

        const pileLabelMaxW = Math.max(pileW + 34, isCompactW ? width * 0.44 : 180);
        const pileLabelY = drawY + pileH + (isShort ? 12 : 15);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = pv.topDrawCardFaceUp ? "#f0abfc" : "#fde047";
        ctx.font = `900 ${isShort || isCompactW ? 10 : 11}px ${fonts.sans}`;
        ctx.fillText(
          pv.topDrawCardFaceUp
            ? `HỐ ĐEN NGỬA! (${pv.drawPileCount})`
            : `BỘ BÀI RÚT (${pv.drawPileCount})`,
          drawX + pileW * 0.5,
          pileLabelY,
          pileLabelMaxW
        );
        if (isMyTurn && !isShort) {
          const arrowBob = Math.sin(now / 220) * 2.5;
          ctx.fillStyle = "#4ade80";
          ctx.font = `800 ${isCompactW ? 9 : 10}px ${fonts.sans}`;
          ctx.fillText(
            "Chạm rút bài",
            drawX + pileW * 0.5,
            pileLabelY + 14 + arrowBob,
            pileLabelMaxW
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
          ctx.font = `700 ${isShort || isCompactW ? 9.5 : 11}px ${fonts.sans}`;
          ctx.fillText(
            "MỘ TRỐNG",
            discardX + pileW * 0.5,
            discardY + pileH * 0.5,
            pileW - 8
          );
        }
        ctx.fillStyle = "#cbd5e1";
        ctx.font = `800 ${isShort || isCompactW ? 10 : 11}px ${fonts.sans}`;
        ctx.fillText(
          `CHỒNG BỎ (${pv.discardPileCount})`,
          discardX + pileW * 0.5,
          pileLabelY,
          pileLabelMaxW
        );

        // 4. BOTTOM PLAYER HAND DOCK WITH SMOOTH SPRING PHYSICS (1-row OR 2-row on Portrait!)
        const dockSidePad = isPortrait || isShort ? 6 : 10;
        drawRoundedRect(ctx, dockSidePad, dockY, width - dockSidePad * 2, dockH, isShort ? 12 : 16);
        ctx.fillStyle = "rgba(9, 13, 22, 0.94)";
        ctx.fill();
        ctx.strokeStyle = isMyTurn
          ? "rgba(250, 204, 21, 0.65)"
          : "rgba(148, 163, 184, 0.28)";
        ctx.lineWidth = isMyTurn ? 2.2 : 1.2;
        ctx.stroke();

        const dockHeaderY = dockY + (isShort ? 13 : 16);
        const showRightHint = width >= 560;
        const leftHeaderMaxW = showRightHint
          ? width - 220
          : width - dockSidePad * 2 - 20;

        ctx.textAlign = "left";
        ctx.fillStyle = isMyTurn ? "#fde047" : "#f8fafc";
        ctx.font = `800 ${isShort || isPortrait ? 10.5 : 11.5}px ${fonts.sans}`;
        ctx.fillText(
          `${mySeat.displayName} (${pv.myHand.length} lá)${mySeat.hasGodcat ? " • MÈO THẦN" : ""}${pv.towerHolderSeatNo === mySeat.seatNo && pv.towerStashCount > 0 ? ` • THÁP (${pv.towerStashCount})` : ""}${pv.myIsBlind ? " • MÙ BÀI!" : ""}${!mySeat.alive ? " • ĐÃ LOẠI" : ""}`,
          dockSidePad + 12,
          dockHeaderY,
          Math.max(80, leftHeaderMaxW)
        );
        if (showRightHint) {
          ctx.textAlign = "right";
          ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
          ctx.font = `600 10px ${fonts.sans}`;
          ctx.fillText(
            "Giữ 1s vào lá bài để xem chức năng",
            width - dockSidePad - 12,
            dockHeaderY
          );
        }

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
          cardW: number;
          cardH: number;
          isSelected: boolean;
          hovered: boolean;
          row: number;
        }[] = [];

        if (useTwoHandRows) {
          // 2-ROW PORTRAIT HAND LAYOUT: Keeps cards big & comfortably tappable when holding 7+ cards!
          const topCount = Math.ceil(handCards.length / 2);
          const availDockH = dockH - 28;
          const rowOverlap = 18;
          const cardH = Math.max(
            74,
            Math.min(116, Math.floor((availDockH + rowOverlap) * 0.5))
          );
          const cardW = Math.round(cardH * 0.69);
          const availHandW = width - dockSidePad * 2 - 20;

          handCards.forEach((card, idx) => {
            const row = idx < topCount ? 0 : 1;
            const col = row === 0 ? idx : idx - topCount;
            const rowCount = row === 0 ? topCount : handCards.length - topCount;
            const stepX =
              rowCount > 1
                ? Math.min(
                    cardW + 6,
                    Math.max(22, Math.floor((availHandW - cardW) / (rowCount - 1)))
                  )
                : cardW;
            const totalRowW = cardW + Math.max(0, rowCount - 1) * stepX;
            const startX = Math.round((width - totalRowW) * 0.5);

            const isSelected = curSelectedCards.includes(card.id);
            const regId = `my-card-${card.id}`;
            const hovered = hoveredIdRef.current === regId;
            const liftY = isSelected ? -14 : hovered ? -8 : 0;
            const targetX = startX + col * stepX;
            const rowBaseY =
              dockY + 24 + row * Math.max(cardH - rowOverlap, Math.floor(availDockH * 0.48));
            const targetY = Math.min(dockY + dockH - cardH - 4, rowBaseY) + liftY;
            const targetScale = isSelected ? 1.08 : hovered ? 1.06 : 1.0;
            const centerNorm = rowCount > 1 ? (col / (rowCount - 1)) * 2 - 1 : 0;
            const targetRot = isSelected || hovered ? 0 : centerNorm * 0.025;

            let sp = handSpringsRef.current.get(card.id);
            if (!sp) {
              sp = { x: drawX, y: drawY, scale: 0.72, rot: -0.15 };
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

            renderQueue.push({
              card,
              idx,
              spring: sp,
              cardW,
              cardH,
              isSelected,
              hovered,
              row,
            });
          });
        } else {
          // SINGLE-ROW HAND FAN (Desktop, Tablet, Phone Landscape, or Portrait with <= 6 cards)
          const cCount = Math.max(1, handCards.length);
          const cardH = isShort
            ? Math.max(66, Math.min(dockH - 22, 108))
            : isPortrait
              ? Math.max(88, Math.min(dockH - 30, 140))
              : Math.min(dockH - 36, 156);
          const cardW = Math.round(cardH * 0.69);
          const availHandW = width - (isShort || isPortrait ? 28 : 56);
          const stepX =
            cCount > 1
              ? Math.min(
                  cardW + (isShort || isPortrait ? 6 : 10),
                  Math.max(18, Math.floor((availHandW - cardW) / (cCount - 1)))
                )
              : cardW;
          const totalRowW = cardW + (cCount - 1) * stepX;
          const startCardX = Math.round((width - totalRowW) * 0.5);

          handCards.forEach((card, idx) => {
            const isSelected = curSelectedCards.includes(card.id);
            const regId = `my-card-${card.id}`;
            const hovered = hoveredIdRef.current === regId;
            const liftY = isSelected
              ? isShort
                ? -11
                : -18
              : hovered
                ? isShort
                  ? -7
                  : -14
                : 0;
            const targetX = startCardX + idx * stepX;
            const targetY = dockY + (isShort ? 21 : 28) + liftY;
            const targetScale = isSelected ? 1.07 : hovered ? 1.08 : 1.0;
            const centerNorm = cCount > 1 ? (idx / (cCount - 1)) * 2 - 1 : 0;
            const targetRot = isSelected || hovered ? 0 : centerNorm * 0.032;

            let sp = handSpringsRef.current.get(card.id);
            if (!sp) {
              sp = { x: drawX, y: drawY, scale: 0.72, rot: -0.15 };
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

            renderQueue.push({
              card,
              idx,
              spring: sp,
              cardW,
              cardH,
              isSelected,
              hovered,
              row: 0,
            });
          });
        }

        // Draw non-hovered/non-selected cards first, then selected/hovered on top so they're never occluded!
        const orderedQueue = [
          ...renderQueue.filter((item) => !item.hovered && !item.isSelected),
          ...renderQueue.filter((item) => item.isSelected && !item.hovered),
          ...renderQueue.filter((item) => item.hovered),
        ];

        for (const item of orderedQueue) {
          const { card, idx, spring, cardW, cardH, isSelected, hovered } = item;
          ctx.save();
          ctx.translate(spring.x + cardW * 0.5, spring.y + cardH * 0.5);
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
      window.removeEventListener("orientationchange", resize);
      window.visualViewport?.removeEventListener("resize", resize);
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
  const inspectedSpriteStyle = inspectedCard
    ? getIkCardSpriteBgStyle(inspectedCard.type, inspectedCard.id)
    : null;
  const inspectedPackLabel =
    inspectedMeta && inspectedMeta.pack !== "core"
      ? IK_EXPANSION_META[inspectedMeta.pack].nameVi
      : "Bộ Cơ Bản (Core)";

  return (
    <div className="relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
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

      {/* Multi-Card Combo / Purrfect Boost Showcase Banner (shows ALL played cards to everyone) */}
      {comboNotice && !stealNotice && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[min(94vw,460px)] pointer-events-none">
          <div
            className={`pointer-events-auto rounded-2xl border backdrop-blur-md p-2.5 sm:p-3 shadow-2xl space-y-2 ${
              comboNotice.comboKind === "COMBO_5"
                ? "border-emerald-400/85 bg-emerald-950/92 text-emerald-50"
                : comboNotice.comboKind === "COMBO_3"
                  ? "border-purple-400/85 bg-purple-950/92 text-purple-50"
                  : comboNotice.comboKind === "BOOST"
                    ? "border-amber-400/85 bg-amber-950/92 text-amber-50"
                    : "border-sky-400/85 bg-slate-900/94 text-sky-50"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 text-left">
                <p
                  className={`text-[10.5px] font-black uppercase tracking-wider ${
                    comboNotice.comboKind === "COMBO_5"
                      ? "text-emerald-300"
                      : comboNotice.comboKind === "COMBO_3"
                        ? "text-purple-300"
                        : comboNotice.comboKind === "BOOST"
                          ? "text-amber-300"
                          : "text-sky-300"
                  }`}
                >
                  {comboNotice.comboKind === "COMBO_5"
                    ? "COMBO 5 LÁ KHÁC NHAU (TRỤC VỚT TỪ MỘ)"
                    : comboNotice.comboKind === "COMBO_3"
                      ? `COMBO 3 LÁ${
                          comboNotice.wantedCardType
                            ? ` — ĐÒI [${IK_CARD_META[comboNotice.wantedCardType].shortVi.toUpperCase()}]`
                            : ""
                        }`
                      : comboNotice.comboKind === "BOOST"
                        ? "PURRFECT BOOST (+1 HIỆU ỨNG)"
                        : "COMBO 2 LÁ (CƯỚP 1 LÁ NGẪU NHIÊN)"}
                </p>
                <p className="text-xs font-extrabold text-white leading-snug">
                  <span className="text-amber-300">
                    {comboNotice.actorName}
                  </span>{" "}
                  vừa đánh {comboNotice.cards.length} lá
                  {comboNotice.targetName ? (
                    <>
                      {" "}
                      nhắm vào{" "}
                      <span className="text-rose-300">
                        {comboNotice.targetName}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setComboNotice(null)}
                className="shrink-0 rounded-lg border border-white/15 bg-black/30 hover:bg-black/50 px-2 py-0.5 text-[11px] font-bold text-slate-200 cursor-pointer"
                aria-label="Đóng thông báo Combo"
              >
                ✕
              </button>
            </div>

            <div className="flex items-start justify-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5">
              {comboNotice.cards.map((c, idx) => {
                const cMeta = IK_CARD_META[c.type];
                const mid = (comboNotice.cards.length - 1) / 2;
                const tiltDeg = (idx - mid) * 3;
                return (
                  <div
                    key={`${c.id}-${idx}`}
                    className="shrink-0 w-14 sm:w-16 flex flex-col items-center gap-1"
                    style={{ transform: `rotate(${tiltDeg}deg)` }}
                  >
                    <div className="w-full aspect-[5/7] rounded-lg overflow-hidden border border-white/30 bg-slate-950 shadow-lg">
                      <div
                        role="img"
                        aria-label={cMeta.nameVi}
                        className="w-full h-full"
                        style={getIkCardSpriteBgStyle(c.type, c.id)}
                      />
                    </div>
                    <span className="w-full text-center text-[9.5px] font-bold text-slate-100 leading-tight truncate">
                      {cMeta.shortVi}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Stolen Card Alert Toast (shows exact card stolen from you or taken by you) */}
      {stealNotice && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[min(92vw,380px)] pointer-events-auto">
          <div
            className={`rounded-2xl border backdrop-blur-md p-2.5 sm:p-3 shadow-2xl flex items-center gap-3 ${
              stealNotice.role === "victim"
                ? stealNotice.fromTower
                  ? "border-amber-400/80 bg-amber-950/92 text-amber-50"
                  : "border-rose-500/85 bg-rose-950/92 text-rose-50"
                : "border-sky-400/80 bg-slate-900/94 text-slate-50"
            }`}
          >
            {stealNotice.card ? (
              <div className="shrink-0 w-12 sm:w-14 aspect-[5/7] rounded-lg overflow-hidden border border-white/25 bg-slate-950 shadow-lg">
                <div
                  role="img"
                  aria-label={IK_CARD_META[stealNotice.card.type].nameVi}
                  className="w-full h-full"
                  style={getIkCardSpriteBgStyle(
                    stealNotice.card.type,
                    stealNotice.card.id
                  )}
                />
              </div>
            ) : (
              <div className="shrink-0 w-12 sm:w-14 aspect-[5/7] rounded-lg overflow-hidden border border-amber-400/50 bg-slate-950 shadow-lg">
                <div
                  role="img"
                  aria-label="Lá trong Tháp Quyền Lực"
                  className="w-full h-full"
                  style={getIkCardSpriteBgStyle("back")}
                />
              </div>
            )}

            <div className="flex-1 min-w-0 text-left space-y-0.5">
              <p
                className={`text-[10.5px] font-black uppercase tracking-wider ${
                  stealNotice.role === "victim"
                    ? stealNotice.fromTower
                      ? "text-amber-300"
                      : "text-rose-300"
                    : "text-sky-300"
                }`}
              >
                {stealNotice.role === "victim"
                  ? stealNotice.fromTower
                    ? "Tháp Quyền Lực Đã Chắn Đòn"
                    : "Bạn Vừa Bị Cướp Bài"
                  : "Cướp Bài Thành Công"}
              </p>
              <p className="text-xs font-extrabold leading-snug text-white">
                {stealNotice.role === "victim" ? (
                  stealNotice.fromTower ? (
                    <>
                      <span className="text-amber-300">
                        {stealNotice.otherName}
                      </span>{" "}
                      phải rút mù 1 lá từ đỉnh Tháp thay vì lấy bài trên tay
                      bạn.
                    </>
                  ) : (
                    <>
                      <span className="text-amber-300">
                        {stealNotice.otherName}
                      </span>{" "}
                      đã lấy lá{" "}
                      <span className="text-rose-200 underline decoration-rose-400/70">
                        {stealNotice.card
                          ? IK_CARD_META[stealNotice.card.type].nameVi
                          : "1 lá bài"}
                      </span>{" "}
                      từ tay bạn!
                    </>
                  )
                ) : (
                  <>
                    Bạn vừa lấy lá{" "}
                    <span className="text-amber-300">
                      {stealNotice.card
                        ? IK_CARD_META[stealNotice.card.type].nameVi
                        : "1 lá bài"}
                    </span>{" "}
                    từ {stealNotice.otherName}!
                  </>
                )}
              </p>
              {stealNotice.card && (
                <p className="text-[10.5px] text-slate-300/90 truncate">
                  {IK_CARD_META[stealNotice.card.type].subtitleVi}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setStealNotice(null)}
              className="shrink-0 self-start rounded-lg border border-white/15 bg-black/30 hover:bg-black/50 px-2 py-0.5 text-[11px] font-bold text-slate-200 cursor-pointer"
              aria-label="Đóng thông báo"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 1s Hold Vietnamese Card Info Overlay */}
      {inspectedCard && inspectedMeta && (
        <div
          onClick={() => setInspectedCard(null)}
          className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl border border-amber-400/50 bg-slate-900/95 p-3 sm:p-5 shadow-2xl flex flex-col [@media(min-width:440px)]:flex-row items-center [@media(min-width:440px)]:items-start gap-3 sm:gap-4"
          >
            {/* Enlarged Card Preview */}
            <div className="shrink-0 w-28 [@media(max-height:460px)]:w-24 sm:w-40 aspect-[5/7] rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-950 shadow-xl flex items-center justify-center">
              {inspectedSpriteStyle ? (
                <div
                  role="img"
                  aria-label={inspectedMeta.nameVi}
                  className="w-full h-full"
                  style={inspectedSpriteStyle}
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
