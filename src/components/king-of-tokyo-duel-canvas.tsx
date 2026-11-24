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
  drawKotBuzzTilePreview2D,
  drawKotDeckBack2D,
  drawKotDie2D,
  drawKotEnergyStash2D,
  drawKotGameBoard2D,
  drawKotHealthDial2D,
  drawKotIcon2D,
  drawKotLobbyBackground2D,
  drawKotMonsterBoard2D,
  drawKotMonsterPortrait2D,
  drawKotPowerCardArt2D,
  drawKotRichText2D,
  drawKotTokyoBackground2D,
  getKotBoardAtlas,
  getKotBuzzMedalsAtlas,
  getKotBuzzPlacementAnchorPx,
  getKotBuzzTilesAtlas,
  getKotCardBackImage,
  getKotDiceAtlas,
  getKotEnergyCubeImage,
  getKotGameBoardImage,
  getKotHpDialsAtlas,
  getKotIconsAtlas,
  getKotLobbyBgImage,
  getKotMatchBgImage,
  getKotMonsterAtlas,
  getKotPowerCardsAtlas,
  getKotTokensAtlas,
} from "@/canvas/king-of-tokyo-duel-art";
import {
  getEffectiveCardCost,
  getValidBuzzPlacements,
  KOT_BUZZ_TILE_DEFS,
  KOT_DIE_FACES,
  KOT_MONSTER_IDS,
  KOT_MONSTERS,
  type KotCommand,
  type KotDieFace,
  type KotMonsterId,
  type KotPlayerView,
  type KotTrackType,
} from "@/cartridges/king-of-tokyo-duel";
import type { LobbySeatItem } from "@/components/werewolf-canvas";

interface KotBannerFx {
  text: string;
  color: string;
  x: number;
  y: number;
  startMs: number;
  durationMs: number;
}

interface KotSlashFx {
  x: number;
  y: number;
  startMs: number;
  durationMs: number;
}

interface KingOfTokyoDuelCanvasProps {
  mode: "lobby" | "match";
  lobbySeats: LobbySeatItem[];
  viewerSeatNo: number | null;
  playerView: KotPlayerView | null;
  onDispatchCommand: (cmd: KotCommand) => void;
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function KingOfTokyoDuelCanvas({
  mode,
  lobbySeats,
  viewerSeatNo,
  playerView,
  onDispatchCommand,
}: KingOfTokyoDuelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hitRegionsRef = useRef<HitRegion[]>([]);
  const hoveredIdRef = useRef<string | null>(null);
  const inspectedMonsterRef = useRef<KotMonsterId>("gigazaur");
  const particlesRef = useRef<ParticleSystem>(new ParticleSystem());
  const bannersRef = useRef<KotBannerFx[]>([]);
  const slashesRef = useRef<KotSlashFx[]>([]);
  const rollStartMsRef = useRef<number>(0);
  const rollSeedRef = useRef<number>(1);
  const landedDiceRef = useRef<Set<number>>(new Set());
  const rollingIndicesRef = useRef<Set<number> | null>(null);
  const lastRollKeyRef = useRef<string>("");
  const lastRollTurnRef = useRef<string>("");
  const lastDiceLenRef = useRef<number>(0);
  const screenShakeEndRef = useRef<number>(0);
  const screenShakeMagRef = useRef<number>(0);
  const lastAnimIdRef = useRef<number>(0);
  const smoothFameRef = useRef<number>(0);
  const smoothDestRef = useRef<number>(0);
  const smoothMyHpRef = useRef<number | null>(null);
  const smoothOppHpRef = useRef<number | null>(null);
  const anchorsRef = useRef<{
    topY: number;
    botY: number;
    midX: number;
    midY: number;
  }>({ topY: 70, botY: 500, midX: 450, midY: 280 });

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

    // Trigger simultaneous launch + staggered landing 3D dice animation on fresh turn, reroll, or White Bonus Die!
    if (mode === "match" && playerView && playerView.step === "RollDiceStep") {
      const turnRollKey = `${playerView.turnNumber}-${playerView.activeSeatNo}-${playerView.rollsLeft}`;
      const rollKey = `${turnRollKey}-${playerView.dice.length}`;
      if (rollKey !== lastRollKeyRef.current) {
        const addedOnlyBonusDie =
          turnRollKey === lastRollTurnRef.current &&
          playerView.dice.length > lastDiceLenRef.current;
        const prevLen = lastDiceLenRef.current;
        lastRollKeyRef.current = rollKey;
        lastRollTurnRef.current = turnRollKey;
        lastDiceLenRef.current = playerView.dice.length;

        const nowMs = performance.now();
        if (addedOnlyBonusDie) {
          // Only tumble the newly added White Bonus Die(s)!
          const addedSet = new Set<number>();
          for (let i = prevLen; i < playerView.dice.length; i++) addedSet.add(i);
          rollingIndicesRef.current = addedSet;
          rollStartMsRef.current = nowMs;
          rollSeedRef.current = Math.floor(Math.random() * 10000) + 1;
          landedDiceRef.current = new Set();
        } else {
          // If user click already started rolling within the last 280ms, keep spinning seamlessly into server result!
          const alreadyOptimisticRolling =
            rollStartMsRef.current > 0 && nowMs - rollStartMsRef.current < 280;
          if (!alreadyOptimisticRolling) {
            rollingIndicesRef.current = null;
            rollStartMsRef.current = nowMs;
            rollSeedRef.current = Math.floor(Math.random() * 10000) + 1;
            landedDiceRef.current = new Set();
          }
        }
      }
    }

    const anim = playerView?.lastAnim;
    if (mode === "match" && anim && anim.id !== lastAnimIdRef.current) {
      lastAnimIdRef.current = anim.id;
      const now = performance.now();
      const { topY, botY, midX, midY } = anchorsRef.current;
      const particles = particlesRef.current;
      const viewerSeat = viewerSeatNo ?? playerView?.seats[0]?.seatNo ?? 1;
      const actorY = anim.actorSeatNo === viewerSeat ? botY : topY;
      const targetY = anim.targetSeatNo === viewerSeat ? botY : topY;

      if (anim.kind === "ROLL") {
        const alreadyRolling =
          rollStartMsRef.current > 0 && now - rollStartMsRef.current < 280;
        if (!alreadyRolling) {
          rollingIndicesRef.current = null;
          rollStartMsRef.current = now;
          rollSeedRef.current = anim.id * 37 + 13;
          landedDiceRef.current = new Set();
        }
      }

      if ((anim.damage ?? 0) > 0) {
        screenShakeEndRef.current = now + 360;
        screenShakeMagRef.current = Math.min(12, 4 + (anim.damage ?? 1) * 2);
        slashesRef.current.push({
          x: midX,
          y: targetY,
          startMs: now,
          durationMs: 480,
        });
        for (let i = 0; i < 28; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 65 + Math.random() * 145;
          particles.spawn({
            x: midX + (Math.random() - 0.5) * 80,
            y: targetY,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            radius: 2 + Math.random() * 2.8,
            color: i % 2 === 0 ? "#ef4444" : "#fde047",
            life: 0.65,
            maxLife: 0.65,
          });
        }
        bannersRef.current.push({
          text: `-${anim.damage} HP`,
          color: "#fca5a5",
          x: midX,
          y: targetY,
          startMs: now,
          durationMs: 1350,
        });
      }

      if ((anim.heal ?? 0) > 0) {
        for (let i = 0; i < 18; i++) {
          particles.spawn({
            x: midX + (Math.random() - 0.5) * 140,
            y: actorY + 12,
            vx: (Math.random() - 0.5) * 35,
            vy: -45 - Math.random() * 55,
            radius: 2.2 + Math.random() * 2,
            color: "#34d399",
            life: 0.85,
            maxLife: 0.85,
          });
        }
        bannersRef.current.push({
          text: `+${anim.heal} HP`,
          color: "#6ee7b7",
          x: midX - 95,
          y: actorY - 10,
          startMs: now + 80,
          durationMs: 1200,
        });
      }

      if ((anim.energyGain ?? 0) > 0) {
        for (let i = 0; i < 14; i++) {
          particles.spawn({
            x: midX + (Math.random() - 0.5) * 140,
            y: actorY,
            vx: (Math.random() - 0.5) * 70,
            vy: -35 - Math.random() * 50,
            radius: 2,
            color: "#a3e635",
            life: 0.65,
            maxLife: 0.65,
          });
        }
        bannersRef.current.push({
          text: `+${anim.energyGain} NL`,
          color: "#bef264",
          x: midX + 95,
          y: actorY - 10,
          startMs: now + 100,
          durationMs: 1200,
        });
      }

      if ((anim.kind === "BUY_CARD" || anim.kind === "BUZZ") && anim.labelVi) {
        bannersRef.current.push({
          text: anim.labelVi,
          color: anim.kind === "BUZZ" ? "#6ee7b7" : "#fde047",
          x: midX,
          y: midY - 10,
          startMs: now,
          durationMs: 1400,
        });
      }
    }
  }, [mode, lobbySeats, viewerSeatNo, playerView, onDispatchCommand]);

  useEffect(() => {
    getKotMonsterAtlas();
    getKotBoardAtlas();
    getKotGameBoardImage();
    getKotTokensAtlas();
    getKotIconsAtlas();
    getKotPowerCardsAtlas();
    getKotCardBackImage();
    getKotHpDialsAtlas();
    getKotEnergyCubeImage();
    getKotBuzzMedalsAtlas();
    getKotBuzzTilesAtlas();
    getKotLobbyBgImage();
    getKotMatchBgImage();
    getKotDiceAtlas();

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
      canvas.height = Math.max(420, Math.floor(rect.height * dpr));
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

      if (now < screenShakeEndRef.current) {
        const rem = (screenShakeEndRef.current - now) / 360;
        const mag = screenShakeMagRef.current * rem;
        ctx.translate(
          (Math.random() - 0.5) * 2 * mag,
          (Math.random() - 0.5) * 2 * mag
        );
      }

      if (curMode === "lobby" || !pv) {
        drawKotLobbyBackground2D(ctx, width, height, now);
      } else {
        drawKotTokyoBackground2D(ctx, width, height, now);
      }

      const newHitRegions: HitRegion[] = [];
      const particles = particlesRef.current;

      if (curMode === "lobby" || !pv) {
        // --- LOBBY: FULL-BLEED OFFICIAL 1920x1080 MEKA DRAGON VS GIGAZAUR COVER ART + TOP TITLE ---
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const titleSize = Math.min(32, Math.max(18, Math.round(width * 0.044)));
        ctx.font = `900 ${titleSize}px ${fonts.pixel}`;
        ctx.lineJoin = "round";
        ctx.lineWidth = 5;
        ctx.strokeStyle = "rgba(6, 10, 22, 0.92)";
        ctx.strokeText("KING OF TOKYO: DUEL", width * 0.5, height * 0.09);
        ctx.fillStyle = "#fde047";
        ctx.fillText("KING OF TOKYO: DUEL", width * 0.5, height * 0.09);

        const subText = "Đại Chiến 1v1 • 6 Quái Vật Kaiju • Kéo Co Danh Vọng & Phá Hủy";
        ctx.font = `700 12px ${fonts.sans}`;
        const subW = Math.min(width - 32, ctx.measureText(subText).width + 28);
        drawRoundedRect(ctx, width * 0.5 - subW / 2, height * 0.15 - 12, subW, 24, 999);
        ctx.fillStyle = "rgba(6, 10, 22, 0.68)";
        ctx.fill();
        ctx.strokeStyle = "rgba(253, 224, 71, 0.35)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "#fef9c3";
        ctx.fillText(subText, width * 0.5, height * 0.15 + 0.5, subW - 16);
      } else if (pv.step === "MonsterPickStep") {
        // --- INTERACTIVE 2D MONSTER SELECT SCREEN: LEFT POWER INSPECTOR + RIGHT BIG FULL-ART ROSTER ---
        const isMyPick = pv.activeSeatNo === curViewer;
        const activeSeat = pv.seats.find((s) => s.seatNo === pv.activeSeatNo);
        const takenMap = new Map<string, string>();
        pv.seats.forEach((s) => {
          if (s.monsterId) takenMap.set(s.monsterId, s.displayName);
        });

        const selId = inspectedMonsterRef.current;
        const selMeta = KOT_MONSTERS[selId];
        const selTakenBy = takenMap.get(selId);

        // Header bar
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fde047";
        ctx.font = `900 ${Math.min(20, Math.round(width * 0.03))}px ${fonts.sans}`;
        ctx.fillText(
          isMyPick
            ? "CHỌN QUÁI VẬT KAIJU CỦA BẠN"
            : `Đang chờ ${activeSeat?.displayName ?? "..."} chọn Quái Vật...`,
          width * 0.5,
          24
        );
        ctx.fillStyle = "#94a3b8";
        ctx.font = `600 11px ${fonts.sans}`;
        ctx.fillText(
          "Bấm vào Quái Vật bên phải để xem toàn cảnh & Năng Lực chi tiết bên trái",
          width * 0.5,
          43
        );

        const pad = 14;
        const splitGap = 16;
        const topY = 56;
        const contentH = Math.max(260, height - topY - 12);

        // Left Power Inspector Panel (~33-36% width)
        const leftW = Math.max(220, Math.min(340, Math.floor(width * 0.34)));
        const leftX = pad;
        const leftY = topY;
        const leftH = contentH;

        drawRoundedRect(ctx, leftX, leftY, leftW, leftH, 16);
        const panelGrad = ctx.createLinearGradient(leftX, leftY, leftX, leftY + leftH);
        panelGrad.addColorStop(0, "rgba(15, 23, 42, 0.94)");
        panelGrad.addColorStop(1, "rgba(9, 13, 28, 0.97)");
        ctx.fillStyle = panelGrad;
        ctx.fill();
        ctx.strokeStyle = selMeta.accentColor;
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Top section of Left Inspector: Large Hero Monster Board
        const innerPad = 12;
        const innerW = leftW - innerPad * 2;
        const boardAspect = 220 / 168;
        const maxHeroH = Math.floor(leftH * 0.42);
        const heroW = Math.min(innerW, Math.floor(maxHeroH * boardAspect));
        const heroH = Math.round(heroW / boardAspect);
        const heroX = leftX + (leftW - heroW) / 2;
        const heroY = leftY + 12;

        drawKotMonsterBoard2D(ctx, heroX, heroY, heroW, heroH, selId, {
          selected: true,
          takenBy: selTakenBy,
        });

        // Subtitle & Max HP badge
        let curY = heroY + heroH + 14;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = selMeta.accentColor;
        ctx.font = `800 13px ${fonts.sans}`;
        ctx.fillText(selMeta.titleVi, leftX + innerPad, curY, innerW - 76);

        // HP pill on right of subtitle row
        const hpPillW = 70;
        const hpPillH = 22;
        drawRoundedRect(
          ctx,
          leftX + leftW - innerPad - hpPillW,
          curY - hpPillH / 2,
          hpPillW,
          hpPillH,
          999
        );
        ctx.fillStyle = "rgba(244, 63, 94, 0.18)";
        ctx.fill();
        ctx.strokeStyle = "#fb7185";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        drawKotIcon2D(
          ctx,
          leftX + leftW - innerPad - hpPillW + 16,
          curY,
          15,
          "heart"
        );
        ctx.textAlign = "left";
        ctx.fillStyle = "#fecdd3";
        ctx.font = `800 11px ${fonts.mono}`;
        ctx.fillText(
          `${selMeta.maxHp} HP`,
          leftX + leftW - innerPad - hpPillW + 27,
          curY + 0.5
        );

        // Official-style Cream Comic Power Box ("NĂNG LỰC QUÁI VẬT")
        const btnH = 44;
        const btnY = leftY + leftH - innerPad - btnH;
        const powerBoxY = curY + 18;
        const powerBoxH = Math.max(92, btnY - powerBoxY - 12);

        drawRoundedRect(ctx, leftX + innerPad, powerBoxY, innerW, powerBoxH, 12);
        ctx.fillStyle = "#f5ebd6";
        ctx.fill();
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Dark comic header ribbon inside Power Box
        const ribbonH = 24;
        drawRoundedRect(ctx, leftX + innerPad, powerBoxY, innerW, ribbonH, 10);
        ctx.fillStyle = "#0f172a";
        ctx.fill();
        drawKotIcon2D(
          ctx,
          leftX + innerPad + 16,
          powerBoxY + ribbonH / 2,
          15,
          "energy"
        );
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fde047";
        ctx.font = `900 11px ${fonts.sans}`;
        ctx.fillText(
          "NĂNG LỰC QUÁI VẬT",
          leftX + innerPad + 28,
          powerBoxY + ribbonH / 2 + 0.5
        );

        // Power Name + official 16-bit Red Special [!] Die sprite (matching official card!)
        const pContentX = leftX + innerPad + 10;
        const pContentW = innerW - 20;
        const badgeY = powerBoxY + ribbonH + 9;
        drawKotDie2D(ctx, pContentX, badgeY, 22, "special", false, false, false);

        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#0f172a";
        ctx.font = `900 13px ${fonts.sans}`;
        ctx.fillText(selMeta.powerNameVi, pContentX + 29, badgeY + 11.5, pContentW - 29);

        // Wrapped Vietnamese Power Description with crisp inline official icons (no raw "[!]" text!)
        const descFontSize = leftW < 255 ? 11 : 12;
        const lineH = descFontSize + 7;
        const descStartY = badgeY + 34;
        const maxLines = Math.max(
          2,
          Math.floor((powerBoxY + powerBoxH - 8 - descStartY) / lineH) + 1
        );
        drawKotRichText2D(ctx, selMeta.powerDescVi, pContentX, descStartY, pContentW, {
          font: `700 ${descFontSize}px ${fonts.sans}`,
          color: "#1e293b",
          lineHeight: lineH,
          iconSize: descFontSize + 4,
          maxLines,
        });

        // Bottom Confirm Button inside Left Inspector
        const confirmId = `confirm-monster-${selId}`;
        const confirmHov = hoveredIdRef.current === confirmId;
        const canConfirm = isMyPick && !selTakenBy;

        if (canConfirm) {
          newHitRegions.push({
            id: confirmId,
            shape: "rect",
            x: leftX + innerPad,
            y: btnY,
            width: innerW,
            height: btnH,
            cursor: "pointer",
            data: { type: "confirm-monster", monsterId: selId },
          });
        }

        drawRoundedRect(ctx, leftX + innerPad, btnY, innerW, btnH, 12);
        if (canConfirm) {
          const btnGrad = ctx.createLinearGradient(
            leftX + innerPad,
            btnY,
            leftX + innerPad,
            btnY + btnH
          );
          btnGrad.addColorStop(0, confirmHov ? "#fde047" : "#f59e0b");
          btnGrad.addColorStop(1, confirmHov ? "#f97316" : "#ea580c");
          ctx.fillStyle = btnGrad;
          ctx.fill();
          ctx.strokeStyle = "#fef08a";
          ctx.lineWidth = confirmHov ? 2.6 : 1.6;
          ctx.stroke();
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#0f172a";
          ctx.font = `900 13px ${fonts.sans}`;
          ctx.fillText(
            `CHỌN ${selMeta.name.toUpperCase()}`,
            leftX + leftW / 2,
            btnY + btnH / 2 + 0.5,
            innerW - 14
          );
        } else {
          ctx.fillStyle = "rgba(30, 41, 59, 0.85)";
          ctx.fill();
          ctx.strokeStyle = selTakenBy ? "#fbbf24" : "#475569";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = selTakenBy ? "#fde047" : "#94a3b8";
          ctx.font = `800 12px ${fonts.sans}`;
          ctx.fillText(
            selTakenBy
              ? `ĐÃ CHỌN: ${selTakenBy}`
              : `Đang chờ ${activeSeat?.displayName ?? "..."}`,
            leftX + leftW / 2,
            btnY + btnH / 2 + 0.5,
            innerW - 14
          );
        }

        // Right Big Full-Art Kaiju Roster Grid (choose 2x3 or 3x2 — whichever maximizes big board size!)
        const rightX = leftX + leftW + splitGap;
        const rightY = topY;
        const rightW = Math.max(220, width - rightX - pad);
        const rightH = contentH;
        const gridGap = 14;

        const calcLayout = (cols: number, rows: number) => {
          const maxW = (rightW - (cols - 1) * gridGap) / cols;
          const maxH = (rightH - (rows - 1) * gridGap) / rows;
          const cw = Math.max(80, Math.min(maxW, maxH * boardAspect));
          const ch = cw / boardAspect;
          return { cols, rows, cw, ch, area: cw * ch };
        };
        const layout3x2 = calcLayout(3, 2);
        const layout2x3 = calcLayout(2, 3);
        const chosen = layout3x2.area >= layout2x3.area ? layout3x2 : layout2x3;

        const gridW = chosen.cols * chosen.cw + (chosen.cols - 1) * gridGap;
        const gridH = chosen.rows * chosen.ch + (chosen.rows - 1) * gridGap;
        const gx0 = rightX + (rightW - gridW) / 2;
        const gy0 = rightY + (rightH - gridH) / 2;

        KOT_MONSTER_IDS.forEach((mid, idx) => {
          const r = Math.floor(idx / chosen.cols);
          const c = idx % chosen.cols;
          const x = gx0 + c * (chosen.cw + gridGap);
          const y = gy0 + r * (chosen.ch + gridGap);
          const takenBy = takenMap.get(mid);
          const isSelected = selId === mid;
          const regionId = `inspect-monster-${mid}`;
          const hov = hoveredIdRef.current === regionId;

          newHitRegions.push({
            id: regionId,
            shape: "rect",
            x,
            y,
            width: chosen.cw,
            height: chosen.ch,
            cursor: "pointer",
            data: { type: "inspect-monster", monsterId: mid },
          });

          const lift = isSelected ? 4 : hov ? 2 : 0;
          drawKotMonsterBoard2D(ctx, x, y - lift, chosen.cw, chosen.ch, mid, {
            selected: isSelected,
            hovered: hov,
            takenBy,
          });

          if (isSelected) {
            const tagW = 74;
            const tagH = 19;
            drawRoundedRect(ctx, x + 8, y - lift + 8, tagW, tagH, 999);
            ctx.fillStyle = "#fde047";
            ctx.fill();
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#0f172a";
            ctx.font = `900 10px ${fonts.sans}`;
            ctx.fillText("◀ ĐANG XEM", x + 8 + tagW / 2, y - lift + 8 + tagH / 2 + 0.5);
          }
        });
      } else {
        // --- ACTIVE 1v1 TOKYO DUEL ARENA (OFFICIAL TABLETOP LAYOUT: TOP DICE BAR + SIDE KAIJU BOARDS + CENTER BOARD WITH TOP 3 MARKET SLOTS!) ---
        const isMyTurn =
          pv.activeSeatNo === curViewer && pv.step !== "Finished";
        const mySeat =
          pv.seats.find((s) => s.seatNo === curViewer) ?? pv.seats[0];
        const oppSeat =
          pv.seats.find((s) => s.seatNo !== mySeat.seatNo) ?? pv.seats[1];
        const viewerIsSeat1 = mySeat.seatNo === pv.seats[0]?.seatNo;
        const trackSign: -1 | 1 = viewerIsSeat1 ? -1 : 1;
        // Orient tracks so Opponent Win Zone = LEFT (-7) and YOUR Win Zone = RIGHT (+7)!
        const orient = (rawPos: number) => rawPos * trackSign;
        const placedBuzzTiles = pv.placedBuzzTiles ?? [];
        const activePendingBuzzId =
          isMyTurn && pv.step === "PlaceBuzzStep" && pv.pendingBuzzTileId
            ? pv.pendingBuzzTileId
            : null;
        const validBuzzSpots = activePendingBuzzId
          ? getValidBuzzPlacements(placedBuzzTiles, activePendingBuzzId, {
              famePos: pv.famePos,
              destructionPos: pv.destructionPos,
            })
          : [];

        const registerBuzzPlacementHitRegions = (
          bx: number,
          by: number,
          bw: number,
          bh: number
        ): { track: KotTrackType; startPos: number } | null => {
          if (!activePendingBuzzId) return null;
          const def = KOT_BUZZ_TILE_DEFS[activePendingBuzzId];
          const hitR = Math.max(12, Math.min(20, Math.round(bw * 0.028)));
          let hoveredSpot: { track: KotTrackType; startPos: number } | null = null;
          for (const spot of validBuzzSpots) {
            const id = `kot-place-buzz-${spot.track}-${spot.startPos}`;
            const { cx, cy } = getKotBuzzPlacementAnchorPx(
              bx,
              by,
              bw,
              bh,
              spot.track,
              spot.startPos,
              def.span,
              trackSign
            );
            newHitRegions.push({
              id,
              shape: "circle",
              x: cx,
              y: cy,
              radius: hitR,
              cursor: "pointer",
              data: {
                type: "place-buzz",
                track: spot.track,
                startPos: spot.startPos,
              },
            });
            if (hoveredIdRef.current === id) {
              hoveredSpot = spot;
            }
          }
          return hoveredSpot;
        };
        const targetFame = orient(pv.famePos);
        const targetDest = orient(pv.destructionPos);
        smoothFameRef.current += (targetFame - smoothFameRef.current) * Math.min(1, dt * 10);
        smoothDestRef.current += (targetDest - smoothDestRef.current) * Math.min(1, dt * 10);
        if (smoothMyHpRef.current === null) smoothMyHpRef.current = mySeat.hp;
        else smoothMyHpRef.current += (mySeat.hp - smoothMyHpRef.current) * Math.min(1, dt * 7);
        if (smoothOppHpRef.current === null) smoothOppHpRef.current = oppSeat.hp;
        else smoothOppHpRef.current += (oppSeat.hp - smoothOppHpRef.current) * Math.min(1, dt * 7);

        const boardAspect = 1024 / 650;
        const orientedBuzz = pv.buzzTokens.map((b) => ({
          id: b.id,
          track: b.track,
          orientedPos: orient(b.pos),
          kind: b.kind,
        }));

        // Computes simultaneous launch + staggered landing 3D tumble, face cycling, impact bounce & sparks!
        // All rolling dice begin spinning IMMEDIATELY at t=0 (never flashing their final result first!),
        // then land one by one from left to right to reveal each final face at impact.
        const computeDieRollState = (
          idx: number,
          die: (typeof pv.dice)[number],
          dx: number,
          dy: number,
          dieSize: number
        ): {
          displayFace: KotDieFace;
          offsetX: number;
          anim?: {
            angle: number;
            scaleX: number;
            scaleY: number;
            jumpY: number;
            flash: number;
          };
        } => {
          if (die.locked || rollStartMsRef.current === 0) {
            return { displayFace: die.face, offsetX: 0 };
          }
          if (rollingIndicesRef.current && !rollingIndicesRef.current.has(idx)) {
            return { displayFace: die.face, offsetX: 0 };
          }

          // Clamp negative rAF clock skew to 0 so a die NEVER leaks its final face on frame 0!
          const elapsed = Math.max(0, now - rollStartMsRef.current);
          const staggerRank = rollingIndicesRef.current ? 0 : idx;
          const airDur = 360 + staggerRank * 52;
          const settleDur = 175;
          const totalDur = airDur + settleDur;

          if (elapsed >= totalDur) {
            return { displayFace: die.face, offsetX: 0 };
          }

          const dir = idx % 2 === 0 ? 1 : -1;

          if (elapsed < airDur) {
            const air = elapsed / airDur; // 0..1 airborne arc
            const jumpY = -Math.sin(air * Math.PI) * 22;
            const offsetX = Math.sin(air * Math.PI * 3 + idx) * (1 - air) * 5;
            const angle = (1 - air) * (1 - air) * dir * Math.PI * 2.8;
            const flipWave = Math.abs(Math.cos(air * Math.PI * 4.5 + idx * 0.7));
            const scaleX = 0.56 + 0.44 * flipWave;
            const scaleY = 1.04 + 0.14 * Math.sin(air * Math.PI);
            const cycleStep = Math.floor(elapsed / 58);
            const faceIdx =
              (rollSeedRef.current + idx * 5 + cycleStep) % KOT_DIE_FACES.length;
            return {
              displayFace: KOT_DIE_FACES[faceIdx],
              offsetX,
              anim: { angle, scaleX, scaleY, jumpY, flash: 0 },
            };
          } else {
            // Impact landing + elastic squash-stretch + secondary bounce + golden spark burst!
            if (!landedDiceRef.current.has(idx)) {
              landedDiceRef.current.add(idx);
              for (let s = 0; s < 6; s++) {
                const ang = (Math.PI * 2 * s) / 6 + Math.random() * 0.4;
                const spd = 28 + Math.random() * 48;
                particles.spawn({
                  x: dx + dieSize / 2,
                  y: dy + dieSize / 2,
                  vx: Math.cos(ang) * spd,
                  vy: Math.sin(ang) * spd - 14,
                  radius: 1.6 + Math.random() * 1.4,
                  color: s % 2 === 0 ? "#fde047" : "#f8fafc",
                  life: 0.34,
                  maxLife: 0.34,
                });
              }
            }
            const bp = (elapsed - airDur) / settleDur; // 0..1 settle
            const jumpY = -Math.abs(Math.sin(bp * Math.PI)) * 5 * (1 - bp);
            const squash = Math.sin(bp * Math.PI) * (1 - bp) * 0.16;
            const scaleX = 1 + squash;
            const scaleY = 1 - squash;
            const angle = Math.sin(bp * Math.PI * 2) * (1 - bp) * 0.12 * dir;
            const flash = Math.max(0, 1 - bp * 2.4);
            return {
              displayFace: die.face,
              offsetX: 0,
              anim: { angle, scaleX, scaleY, jumpY, flash },
            };
          }
        };

        // Shared helper: Draws the 100% official 5:7 Vietnamese-localized HD Power Card cleanly!
        const drawVerticalMarketCard = (
          cx: number,
          cy: number,
          cw: number,
          ch: number,
          card: (typeof pv.market)[number],
          effCost: number,
          canBuy: boolean,
          hov: boolean,
          isDiscountSlot: boolean
        ) => {
          const lift = hov ? 7 : 0;
          const dy = cy - lift;
          const rad = Math.max(7, Math.round(cw * 0.065));

          ctx.save();
          ctx.shadowColor = canBuy
            ? hov
              ? "rgba(250, 204, 21, 0.9)"
              : "rgba(245, 158, 11, 0.5)"
            : "rgba(0, 0, 0, 0.7)";
          ctx.shadowBlur = hov ? 20 : 12;
          ctx.shadowOffsetY = hov ? 7 : 3;

          drawKotPowerCardArt2D(ctx, cx, dy, cw, ch, card.id, {
            effCost: effCost !== card.cost ? effCost : undefined,
            highlighted: canBuy || hov,
            radius: rad,
          });
          ctx.shadowBlur = 0;
          ctx.shadowOffsetY = 0;

          // Subtle buyable / discount ring around the official card
          if (canBuy || hov || isDiscountSlot) {
            drawRoundedRect(ctx, cx, dy, cw, ch, rad);
            ctx.strokeStyle = canBuy
              ? hov
                ? "#fde047"
                : "#f59e0b"
              : hov
                ? "#e2e8f0"
                : "rgba(132, 204, 22, 0.7)";
            ctx.lineWidth = canBuy ? (hov ? 3 : 2.2) : hov ? 2 : 1.4;
            ctx.stroke();
          }
          ctx.restore();
        };

        // Shared Hover Full-Art Zoom Card renderer (for Market Cards & Owned Keep Cards!)
        let zoomedCardInfo: {
          card: (typeof pv.market)[number];
          effCost?: number;
          canBuy?: boolean;
          statusText: string;
          anchorX: number;
          anchorY: number;
        } | null = null;

        const isDesktopTable = width >= 820 && height >= 460;

        if (isDesktopTable) {
          // =================================================================
          // 1. TOP DICE & ACTION BAR (Ultra-slim centered glass bar so the Tokyo Board gets maximum height!)
          // =================================================================
          const topBarH = 46;
          const topBarY = 4;
          const diceCount = pv.dice.length;
          const dieSize = 36;
          const dieGap = 6;
          const diceRowW = diceCount * dieSize + Math.max(0, diceCount - 1) * dieGap;
          const canUseDiceToken =
            isMyTurn &&
            pv.step === "RollDiceStep" &&
            mySeat.bonusDiceNextTurn > 0 &&
            pv.dice.length < 8;
          const actionsW =
            isMyTurn && pv.step === "PlaceBuzzStep"
              ? 430
              : isMyTurn && pv.step === "RollDiceStep"
                ? canUseDiceToken
                  ? 344
                  : 236
                : isMyTurn && pv.step === "BuyCardsStep"
                  ? 236
                  : 186;
          const barInnerW =
            isMyTurn && pv.step === "PlaceBuzzStep"
              ? actionsW
              : diceRowW + 14 + actionsW;
          const barW = Math.min(width - 16, barInnerW + 24);
          const barX = Math.round((width - barW) / 2);

          drawRoundedRect(ctx, barX, topBarY, barW, topBarH, 14);
          ctx.fillStyle =
            isMyTurn && pv.step === "PlaceBuzzStep"
              ? "rgba(6, 46, 38, 0.96)"
              : "rgba(10, 15, 30, 0.92)";
          ctx.fill();
          ctx.strokeStyle =
            isMyTurn && pv.step === "PlaceBuzzStep"
              ? "#34d399"
              : isMyTurn
                ? "rgba(250, 204, 21, 0.6)"
                : "rgba(148, 163, 184, 0.3)";
          ctx.lineWidth = isMyTurn ? 2 : 1.2;
          ctx.stroke();

          const contentStartX = barX + Math.max(12, Math.round((barW - barInnerW) / 2));
          const dieY = topBarY + Math.round((topBarH - dieSize) / 2);
          const baseDiceCount = pv.turnNumber === 1 ? 5 : 6;

          if (isMyTurn && pv.step === "PlaceBuzzStep" && activePendingBuzzId) {
            const bDef = KOT_BUZZ_TILE_DEFS[activePendingBuzzId];
            const isMoving = placedBuzzTiles.some((t) => t.tileId === activePendingBuzzId);
            drawKotBuzzTilePreview2D(ctx, activePendingBuzzId, contentStartX, topBarY + 3, 52, topBarH - 6);
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#6ee7b7";
            ctx.font = `900 12px ${fonts.sans}`;
            ctx.fillText(
              `${isMoving ? "DI CHUYỂN" : "ĐẶT"} BUZZ ${bDef.nameVi.toUpperCase()} (${bDef.span} Ô)`,
              contentStartX + 60,
              topBarY + 15,
              actionsW - 140
            );
            ctx.fillStyle = "#d1fae5";
            ctx.font = `700 10.5px ${fonts.sans}`;
            ctx.fillText(
              `${bDef.summaryVi} • Bấm vào dấu (+) trên bàn chơi!`,
              contentStartX + 60,
              topBarY + 32,
              actionsW - 140
            );
            const skipW = 70;
            const skipX = contentStartX + actionsW - skipW;
            const skipY = topBarY + Math.round((topBarH - 28) / 2);
            const skipId = "kot-btn-skip-buzz";
            const skipHov = hoveredIdRef.current === skipId;
            newHitRegions.push({
              id: skipId,
              shape: "rect",
              x: skipX,
              y: skipY,
              width: skipW,
              height: 28,
              cursor: "pointer",
              data: { type: "skip-buzz" },
            });
            drawRoundedRect(ctx, skipX, skipY, skipW, 28, 8);
            ctx.fillStyle = skipHov ? "rgba(148, 163, 184, 0.35)" : "rgba(15, 23, 42, 0.65)";
            ctx.fill();
            ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.textAlign = "center";
            ctx.fillStyle = "#e2e8f0";
            ctx.font = `800 10.5px ${fonts.sans}`;
            ctx.fillText("Bỏ qua", skipX + skipW / 2, skipY + 14.5);
          } else {
            pv.dice.forEach((die, idx) => {
              const dx = contentStartX + idx * (dieSize + dieGap);
              const rId = `kot-die-${idx}`;
              const hov = hoveredIdRef.current === rId;
              const canToggle = isMyTurn && pv.step === "RollDiceStep" && pv.rollsLeft > 0;

              if (canToggle) {
                newHitRegions.push({
                  id: rId,
                  shape: "rect",
                  x: dx,
                  y: dieY - 4,
                  width: dieSize,
                  height: dieSize + 8,
                  cursor: "pointer",
                  data: { type: "toggle-die", dieIndex: idx },
                });
              }

              const rollAnim = computeDieRollState(idx, die, dx, dieY, dieSize);
              drawKotDie2D(
                ctx,
                dx + rollAnim.offsetX,
                dieY,
                dieSize,
                rollAnim.displayFace,
                die.locked,
                canToggle && hov,
                idx >= baseDiceCount,
                rollAnim.anim
              );
            });

            // Action buttons right beside dice in Top Bar
            const actX = contentStartX + diceRowW + 14;
            const actBtnH = 30;
            const actBtnY = topBarY + Math.round((topBarH - actBtnH) / 2);

            if (isMyTurn && pv.step === "RollDiceStep") {
              const canReroll = pv.rollsLeft > 0 && pv.dice.some((d) => !d.locked);
              const w1 = 114;
              const w2 = 114;
              const wTok = 100;
              let cursorX = actX;

              if (canUseDiceToken) {
                const tokId = "kot-btn-use-dice-token";
                const tokHov = hoveredIdRef.current === tokId;
                newHitRegions.push({
                  id: tokId,
                  shape: "rect",
                  x: cursorX,
                  y: actBtnY,
                  width: wTok,
                  height: actBtnH,
                  cursor: "pointer",
                  data: { type: "use-dice-token" },
                });
                drawRoundedRect(ctx, cursorX, actBtnY, wTok, actBtnH, 10);
                ctx.fillStyle = tokHov ? "#fef3c7" : "#f4e0ba";
                ctx.fill();
                ctx.strokeStyle = "#fde047";
                ctx.lineWidth = 1.6;
                ctx.stroke();
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#1c1917";
                ctx.font = `900 10.5px ${fonts.sans}`;
                ctx.fillText(
                  `+1 Trắng (${mySeat.bonusDiceNextTurn})`,
                  cursorX + wTok / 2,
                  actBtnY + actBtnH / 2 + 0.5
                );
                cursorX += wTok + 8;
              }

              if (canReroll) {
                const id = "kot-btn-reroll";
                const hov = hoveredIdRef.current === id;
                newHitRegions.push({
                  id,
                  shape: "rect",
                  x: cursorX,
                  y: actBtnY,
                  width: w1,
                  height: actBtnH,
                  cursor: "pointer",
                  data: { type: "reroll" },
                });
                drawRoundedRect(ctx, cursorX, actBtnY, w1, actBtnH, 10);
                ctx.fillStyle = hov ? "#38bdf8" : "#0284c7";
                ctx.fill();
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#ffffff";
                ctx.font = `900 11px ${fonts.sans}`;
                ctx.fillText(`Tung lại (${pv.rollsLeft})`, cursorX + w1 / 2, actBtnY + actBtnH / 2 + 0.5);
              }
              const resX = canReroll ? cursorX + w1 + 8 : cursorX;
              const resW = canReroll ? w2 : w1 + w2 + 8;
              const resId = "kot-btn-resolve";
              const resHov = hoveredIdRef.current === resId;
              newHitRegions.push({
                id: resId,
                shape: "rect",
                x: resX,
                y: actBtnY,
                width: resW,
                height: actBtnH,
                cursor: "pointer",
                data: { type: "resolve" },
              });
              drawRoundedRect(ctx, resX, actBtnY, resW, actBtnH, 10);
              ctx.fillStyle = resHov ? "#fbbf24" : "#f59e0b";
              ctx.fill();
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = "#0f172a";
              ctx.font = `900 11px ${fonts.sans}`;
              ctx.fillText("Chốt xúc xắc", resX + resW / 2, actBtnY + actBtnH / 2 + 0.5);
            } else if (isMyTurn && pv.step === "BuyCardsStep") {
              const w1 = 114;
              const w2 = 114;
              const canFlush = mySeat.energy >= 2 && pv.deckCount > 0;
              const flId = "kot-btn-flush";
              const flHov = hoveredIdRef.current === flId;
              if (canFlush) {
                newHitRegions.push({
                  id: flId,
                  shape: "rect",
                  x: actX,
                  y: actBtnY,
                  width: w1,
                  height: actBtnH,
                  cursor: "pointer",
                  data: { type: "flush-market" },
                });
              }
              drawRoundedRect(ctx, actX, actBtnY, w1, actBtnH, 10);
              ctx.fillStyle = canFlush
                ? flHov
                  ? "rgba(56, 189, 248, 0.35)"
                  : "rgba(14, 165, 233, 0.22)"
                : "rgba(30, 41, 59, 0.5)";
              ctx.fill();
              ctx.strokeStyle = canFlush ? "#38bdf8" : "#475569";
              ctx.lineWidth = 1.2;
              ctx.stroke();
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = canFlush ? "#bae6fd" : "#64748b";
              ctx.font = `800 10.5px ${fonts.sans}`;
              ctx.fillText("Đổi 3 thẻ (-2 NL)", actX + w1 / 2, actBtnY + actBtnH / 2 + 0.5);

              const endX = actX + w1 + 8;
              const endId = "kot-btn-end";
              const endHov = hoveredIdRef.current === endId;
              newHitRegions.push({
                id: endId,
                shape: "rect",
                x: endX,
                y: actBtnY,
                width: w2,
                height: actBtnH,
                cursor: "pointer",
                data: { type: "end-turn" },
              });
              drawRoundedRect(ctx, endX, actBtnY, w2, actBtnH, 10);
              ctx.fillStyle = endHov ? "#34d399" : "#10b981";
              ctx.fill();
              ctx.fillStyle = "#022c22";
              ctx.font = `900 11px ${fonts.sans}`;
              ctx.fillText("Xong lượt", endX + w2 / 2, actBtnY + actBtnH / 2 + 0.5);
            } else {
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = pv.step === "Finished" ? "#fde047" : "#94a3b8";
              ctx.font = `800 11.5px ${fonts.sans}`;
              ctx.fillText(
                pv.step === "Finished"
                  ? "TRẬN ĐẤU KẾT THÚC"
                  : pv.step === "PlaceBuzzStep"
                    ? `${oppSeat.displayName} đang đặt Token Buzz...`
                    : `Lượt của ${oppSeat.displayName}...`,
                actX + actionsW / 2,
                topBarY + topBarH / 2 + 0.5,
                actionsW
              );
            }
          }

          // =================================================================
          // 2. THREE-COLUMN TABLETOP: SLEEK SIDE KAIJU PANELS + MASSIVE CENTER TOKYO BOARD!
          // =================================================================
          const bodyTop = topBarY + topBarH + 5;
          const bodyH = Math.max(320, height - bodyTop - 4);
          const padEdge = 6;
          const colGap = 8;
          const sideW = Math.max(166, Math.min(222, Math.round(width * 0.168)));
          const leftColX = padEdge;
          const rightColX = width - padEdge - sideW;
          const centerColX = leftColX + sideW + colGap;
          const centerColW = Math.max(400, rightColX - colGap - centerColX);

          // Update FX anchors to hit Opponent Board (Left) and Your Board (Right)!
          anchorsRef.current = {
            topY: bodyTop + 95,
            botY: bodyTop + 95,
            midX: centerColX + centerColW / 2,
            midY: bodyTop + bodyH * 0.55,
          };

          // Helper: Draw a full vertical Side Kaiju Column (Monster Board + Health Dial + Energy + Owned Keep Cards!)
          const drawSideKaijuColumn = (
            seat: typeof mySeat,
            colX: number,
            isViewer: boolean
          ) => {
            const active = seat.seatNo === pv.activeSeatNo && pv.step !== "Finished";
            const winner = pv.winnerSeatNo === seat.seatNo;
            const mId = seat.monsterId ?? "gigazaur";
            const meta = KOT_MONSTERS[mId];

            drawRoundedRect(ctx, colX, bodyTop, sideW, bodyH, 16);
            ctx.fillStyle = winner
              ? "rgba(120, 53, 15, 0.55)"
              : active
                ? "rgba(22, 32, 54, 0.92)"
                : "rgba(10, 15, 30, 0.84)";
            ctx.fill();
            ctx.strokeStyle = winner
              ? "#fde047"
              : active
                ? "#facc15"
                : "rgba(148, 163, 184, 0.24)";
            ctx.lineWidth = active || winner ? 2.4 : 1.2;
            ctx.stroke();

            // Player name header
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = active ? "#fde047" : isViewer ? "#6ee7b7" : "#fca5a5";
            ctx.font = `900 12px ${fonts.sans}`;
            ctx.fillText(
              `${active ? "▶ " : ""}${seat.displayName}${isViewer ? " (BẠN)" : ""}`,
              colX + sideW / 2,
              bodyTop + 16,
              sideW - 16
            );

            // Official Full-Art Kaiju Monster Board (440:336 ratio)
            const mbPad = 10;
            const mbW = sideW - mbPad * 2;
            const mbH = Math.round(mbW * (336 / 440));
            const mbX = colX + mbPad;
            const mbY = bodyTop + 30;
            drawKotMonsterBoard2D(ctx, mbX, mbY, mbW, mbH, mId, {
              selected: active,
            });

            // Official Rotating Two-Layer Health Dial + Energy Counter right beneath Monster Board!
            const dialR = Math.max(36, Math.min(48, Math.round(sideW * 0.19)));
            const dialY = mbY + mbH + dialR + 10;
            const dialX = colX + Math.round(sideW * 0.34);
            drawKotHealthDial2D(
              ctx,
              dialX,
              dialY,
              dialR,
              seat.hp,
              seat.maxHp,
              isViewer ? "blue" : "red",
              isViewer ? (smoothMyHpRef.current ?? seat.hp) : (smoothOppHpRef.current ?? seat.hp)
            );

            // Tabletop Translucent Green Energy Cubes Stash on the right half next to Health Dial!
            const enBoxX = colX + Math.round(sideW * 0.59);
            const enBoxW = sideW - Math.round(sideW * 0.59) - 8;
            const enBoxH = Math.round(dialR * 1.85);
            const enBoxY = dialY - enBoxH / 2;
            drawKotEnergyStash2D(ctx, enBoxX, enBoxY, enBoxW, enBoxH, seat.energy);

            // Held Dice Tokens badge (up to 2 White Bonus Dice tokens — clickable during your RollDiceStep!)
            let curRowY = dialY + dialR + 14;
            if (seat.bonusDiceNextTurn > 0) {
              const canClickBadge =
                isViewer && isMyTurn && pv.step === "RollDiceStep" && pv.dice.length < 8;
              const bId = `kot-side-dice-tok-${seat.seatNo}`;
              const bHov = hoveredIdRef.current === bId;
              if (canClickBadge) {
                newHitRegions.push({
                  id: bId,
                  shape: "rect",
                  x: colX + 12,
                  y: curRowY,
                  width: sideW - 24,
                  height: 24,
                  cursor: "pointer",
                  data: { type: "use-dice-token" },
                });
              }
              drawRoundedRect(ctx, colX + 12, curRowY, sideW - 24, 24, 8);
              ctx.fillStyle = canClickBadge && bHov
                ? "rgba(254, 243, 199, 0.34)"
                : "rgba(244, 224, 186, 0.18)";
              ctx.fill();
              ctx.strokeStyle = canClickBadge ? "#fde047" : "#f4e0ba";
              ctx.lineWidth = canClickBadge ? 1.6 : 1.2;
              ctx.stroke();
              drawKotIcon2D(ctx, colX + 27, curRowY + 12, 16, "dice");
              ctx.textAlign = "left";
              ctx.fillStyle = "#fef3c7";
              ctx.font = `800 10.5px ${fonts.sans}`;
              ctx.fillText(
                canClickBadge
                  ? `Dùng Token Xúc Xắc (${seat.bonusDiceNextTurn}/2)`
                  : `${seat.bonusDiceNextTurn}/2 Token Xúc Xắc Trắng`,
                colX + 39,
                curRowY + 12.5,
                sideW - 52
              );
              curRowY += 30;
            }

            // Owned Keep Power Cards Grid (mini illustrated cards — hover to zoom!)
            const keepAvailH = bodyTop + bodyH - curRowY - 10;
            if (keepAvailH >= 48) {
              ctx.textAlign = "left";
              ctx.fillStyle = "#94a3b8";
              ctx.font = `800 9.5px ${fonts.sans}`;
              ctx.fillText(
                seat.keepCards.length > 0
                  ? `THẺ ĐANG GIỮ (${seat.keepCards.length})`
                  : meta.powerNameVi,
                colX + 12,
                curRowY + 6,
                sideW - 24
              );

              if (seat.keepCards.length === 0) {
                drawKotRichText2D(
                  ctx,
                  meta.powerDescVi,
                  colX + 12,
                  curRowY + 22,
                  sideW - 24,
                  {
                    font: `600 9.5px ${fonts.sans}`,
                    color: "#94a3b8",
                    lineHeight: 15,
                    iconSize: 13,
                    maxLines: 4,
                  }
                );
              } else {
                const kCols = 3;
                const kGap = 6;
                const kW = Math.floor((sideW - 24 - (kCols - 1) * kGap) / kCols);
                const kH = Math.min(Math.round(kW * 1.38), keepAvailH - 18);
                seat.keepCards.slice(0, 6).forEach((kc, ki) => {
                  const kr = Math.floor(ki / kCols);
                  const kcIdx = ki % kCols;
                  const kx = colX + 12 + kcIdx * (kW + kGap);
                  const ky = curRowY + 16 + kr * (kH + kGap);
                  if (ky + kH > bodyTop + bodyH - 6) return;
                  const kRegId = `kot-keep-${seat.seatNo}-${kc.id}`;
                  const kHov = hoveredIdRef.current === kRegId;
                  newHitRegions.push({
                    id: kRegId,
                    shape: "rect",
                    x: kx,
                    y: ky,
                    width: kW,
                    height: kH,
                    cursor: "help",
                    data: { type: "noop" },
                  });
                  drawKotPowerCardArt2D(ctx, kx, ky - (kHov ? 3 : 0), kW, kH, kc.id, {
                    highlighted: kHov,
                    radius: 6,
                  });
                  if (kHov) {
                    zoomedCardInfo = {
                      card: kc,
                      statusText: `Thẻ GIỮ của ${seat.displayName}`,
                      anchorX: isViewer ? colX - 14 : colX + sideW + 14,
                      anchorY: ky + kH / 2,
                    };
                  }
                });
              }
            }
          };

          drawSideKaijuColumn(oppSeat, leftColX, false);
          drawSideKaijuColumn(mySeat, rightColX, true);

          // =================================================================
          // 3. CENTER TABLETOP: MASSIVE HD TOKYO BOARD + EXACT 5:7 VIETNAMESE POWER CARDS IN TOP 3 GREEN SLOTS!
          // =================================================================
          const cardWRatio = 0.209; // fits snugly edge-to-edge inside each of the 3 green board trays!
          const cardAspect = 1.40;  // EXACT 5:7 (200x280) official card aspect ratio — zero stretching!
          const overlapRatio = 0.052; // bottom edge rests flush inside the 3 green board slots
          const deckLeftProtrude = 0.112; // deck back nestled cleanly beside Slot 0
          const totalHRatio = 1 + cardWRatio * cardAspect * boardAspect - overlapRatio;
          const totalWRatio = 1 + deckLeftProtrude;

          const maxBoardHByH = bodyH / totalHRatio;
          const maxBoardHByW = centerColW / (totalWRatio * boardAspect);
          const boardH = Math.max(190, Math.floor(Math.min(maxBoardHByH, maxBoardHByW)));
          const boardW = Math.round(boardH * boardAspect);

          const mCardW = Math.round(boardW * cardWRatio);
          const mCardH = Math.round(mCardW * cardAspect);
          const overlapPx = Math.round(boardH * overlapRatio);
          const deckOffsetLeft = Math.round(boardW * deckLeftProtrude);

          const groupTotalW = boardW + deckOffsetLeft;
          const groupTotalH = boardH + mCardH - overlapPx;
          const groupX = centerColX + Math.round((centerColW - groupTotalW) / 2);
          const groupY = bodyTop + Math.round((bodyH - groupTotalH) / 2);

          const boardX = groupX + deckOffsetLeft;
          const boardY = groupY + mCardH - overlapPx;

          // A. Draw the HUGE 1024x650 HD Tokyo Board FIRST (so the 3 top cards tuck cleanly onto its top 3 green slots!)
          const hoveredBuzzSpot = registerBuzzPlacementHitRegions(
            boardX,
            boardY,
            boardW,
            boardH
          );
          drawKotGameBoard2D(ctx, boardX, boardY, boardW, boardH, {
            nowMs: now,
            smoothFame: smoothFameRef.current,
            smoothDest: smoothDestRef.current,
            sign: trackSign,
            placedBuzzTiles,
            pendingPlacement: activePendingBuzzId
              ? {
                  tileId: activePendingBuzzId,
                  validSpots: validBuzzSpots,
                  hoveredSpot: hoveredBuzzSpot,
                }
              : null,
            buzzTokens: orientedBuzz,
          });

          // B. Draw Lightning-Bolt Power Deck Back right to the left of Slot 0!
          const slotCentersNx = [0.228, 0.476, 0.726];
          const slot0X = boardX + Math.round(slotCentersNx[0] * boardW - mCardW / 2);
          const deckBackX = Math.max(centerColX, slot0X - mCardW - Math.max(8, Math.round(boardW * 0.018)));
          const marketRowY = groupY;
          const canFlushDeck =
            isMyTurn &&
            pv.step === "BuyCardsStep" &&
            mySeat.energy >= 2 &&
            pv.deckCount > 0;
          const deckHitId = "kot-deck-flush";
          const deckHov = hoveredIdRef.current === deckHitId;
          if (canFlushDeck) {
            newHitRegions.push({
              id: deckHitId,
              shape: "rect",
              x: deckBackX,
              y: marketRowY,
              width: mCardW,
              height: mCardH,
              cursor: "pointer",
              data: { type: "flush-market" },
            });
          }
          drawKotDeckBack2D(
            ctx,
            deckBackX,
            marketRowY,
            mCardW,
            mCardH,
            pv.deckCount,
            { canFlush: canFlushDeck, hovered: deckHov }
          );

          // C. Draw the 3 Official Market Power Cards tucked directly into the 3 green board slots!
          pv.market.slice(0, 3).forEach((card, ci) => {
            const cx = boardX + Math.round(slotCentersNx[ci] * boardW - mCardW / 2);
            const cy = marketRowY;
            const effCost = getEffectiveCardCost(mySeat, card);
            const canBuy =
              isMyTurn &&
              pv.step === "BuyCardsStep" &&
              mySeat.energy >= effCost;
            const cId = `kot-market-${card.id}`;
            const hov = hoveredIdRef.current === cId;

            newHitRegions.push({
              id: cId,
              shape: "rect",
              x: cx,
              y: cy - 6,
              width: mCardW,
              height: mCardH + 6,
              cursor: canBuy ? "pointer" : "help",
              data: canBuy ? { type: "buy-card", cardId: card.id } : { type: "noop" },
            });

            drawVerticalMarketCard(
              cx,
              cy,
              mCardW,
              mCardH,
              card,
              effCost,
              canBuy,
              hov,
              ci === 2
            );

            if (hov) {
              const buzzTag = card.buzzTileId
                ? ` • Buzz ${KOT_BUZZ_TILE_DEFS[card.buzzTileId].nameVi}`
                : "";
              zoomedCardInfo = {
                card,
                effCost,
                canBuy,
                statusText: canBuy
                  ? `BẤM MUA NGAY${buzzTag}`
                  : pv.step === "PlaceBuzzStep"
                    ? "Hãy đặt Token Buzz trên bàn trước!"
                    : pv.step !== "BuyCardsStep"
                      ? `Chốt xúc xắc để mua${buzzTag}`
                      : `Thiếu ${Math.max(0, effCost - mySeat.energy)} năng lượng${buzzTag}`,
                anchorX: cx + mCardW / 2,
                anchorY: cy + mCardH + 14,
              };
            }
          });

          // D. Render Full-Art Exact 5:7 Vietnamese-Localized Zoomed Card on hover!
          if (zoomedCardInfo) {
            const zi = zoomedCardInfo as {
              card: (typeof pv.market)[number];
              effCost?: number;
              canBuy?: boolean;
              statusText: string;
              anchorX: number;
              anchorY: number;
            };
            const zW = 230;
            const zCardH = Math.round(zW * 1.4); // 230 x 322 exact 5:7 official card!
            const zFootH = 26;
            const zH = zCardH + zFootH + 6;
            let zX = Math.round(zi.anchorX - zW / 2);
            let zY = Math.round(zi.anchorY);
            if (zX < 10) zX = 10;
            if (zX + zW > width - 10) zX = width - zW - 10;
            if (zY + zH > height - 10) zY = height - zH - 10;
            if (zY < bodyTop) zY = bodyTop;

            ctx.save();
            ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
            ctx.shadowBlur = 28;
            ctx.shadowOffsetY = 10;
            drawKotPowerCardArt2D(ctx, zX, zY, zW, zCardH, zi.card.id, {
              effCost:
                zi.effCost !== undefined && zi.effCost !== zi.card.cost
                  ? zi.effCost
                  : undefined,
              highlighted: zi.canBuy,
              radius: 13,
            });
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            // Crisp floating status pill directly beneath the full Vietnamese card
            const pillY = zY + zCardH + 6;
            drawRoundedRect(ctx, zX + 6, pillY, zW - 12, zFootH, 8);
            ctx.fillStyle = zi.canBuy ? "#f59e0b" : "rgba(15, 23, 42, 0.94)";
            ctx.fill();
            ctx.strokeStyle = zi.canBuy ? "#fde047" : "rgba(148, 163, 184, 0.45)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = zi.canBuy ? "#0f172a" : "#e2e8f0";
            ctx.font = `900 10.5px ${fonts.sans}`;
            ctx.fillText(zi.statusText, zX + zW / 2, pillY + zFootH / 2 + 0.5);
            ctx.restore();
          }
        } else {
          // =================================================================
          // NARROW / MOBILE STACKED FALLBACK (Compact HUDs + Board + Top Market + Dice)
          // =================================================================
          const hudH = 62;
          const padX = 10;
          const hudW = width - padX * 2;
          const topHudY = 6;
          const botHudY = height - hudH - 6;

          const drawCompactHud = (seat: typeof mySeat, yPos: number, isViewer: boolean) => {
            const active = seat.seatNo === pv.activeSeatNo && pv.step !== "Finished";
            const mId = seat.monsterId ?? "gigazaur";
            const meta = KOT_MONSTERS[mId];
            drawRoundedRect(ctx, padX, yPos, hudW, hudH, 12);
            ctx.fillStyle = active ? "rgba(24, 34, 54, 0.94)" : "rgba(12, 18, 32, 0.88)";
            ctx.fill();
            ctx.strokeStyle = active ? "#facc15" : "rgba(148, 163, 184, 0.28)";
            ctx.lineWidth = active ? 2 : 1;
            ctx.stroke();

            const pSize = hudH - 12;
            drawKotMonsterPortrait2D(ctx, padX + 8, yPos + 6, pSize, mId, active);
            const ix = padX + pSize + 16;
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillStyle = active ? "#fde047" : "#f8fafc";
            ctx.font = `900 12px ${fonts.sans}`;
            ctx.fillText(`${seat.displayName} — ${meta.name}${isViewer ? " (BẠN)" : ""}`, ix, yPos + 18, hudW - pSize - 80);

            drawKotIcon2D(ctx, ix + 8, yPos + 40, 14, seat.hp <= 0 ? "skull" : "heart");
            ctx.fillStyle = "#f8fafc";
            ctx.font = `800 11px ${fonts.mono}`;
            ctx.fillText(`${seat.hp}/${seat.maxHp} HP`, ix + 19, yPos + 40.5);

            ctx.textAlign = "right";
            ctx.fillStyle = "#bef264";
            ctx.font = `900 13px ${fonts.mono}`;
            ctx.fillText(`${seat.energy}`, padX + hudW - 12, yPos + 31);
            const ew = ctx.measureText(`${seat.energy}`).width;
            drawKotIcon2D(ctx, padX + hudW - 22 - ew, yPos + 31, 15, "energy");
          };

          drawCompactHud(oppSeat, topHudY, false);
          drawCompactHud(mySeat, botHudY, true);

          const midTop = topHudY + hudH + 8;
          const midBot = botHudY - 8;
          const midH = Math.max(180, midBot - midTop);
          const diceStripAreaH = isMyTurn ? 84 : 52;
          const availBoardH = Math.max(120, midH - diceStripAreaH - 6);
          const boardW = Math.min(hudW, Math.round(availBoardH * boardAspect));
          const boardH = Math.round(boardW / boardAspect);
          const boardX = padX + Math.round((hudW - boardW) / 2);
          const boardY = midTop;

          const compactHoveredBuzz = registerBuzzPlacementHitRegions(
            boardX,
            boardY,
            boardW,
            boardH
          );
          drawKotGameBoard2D(ctx, boardX, boardY, boardW, boardH, {
            nowMs: now,
            smoothFame: smoothFameRef.current,
            smoothDest: smoothDestRef.current,
            sign: trackSign,
            placedBuzzTiles,
            pendingPlacement: activePendingBuzzId
              ? {
                  tileId: activePendingBuzzId,
                  validSpots: validBuzzSpots,
                  hoveredSpot: compactHoveredBuzz,
                }
              : null,
            buzzTokens: orientedBuzz,
          });

          const diceZoneTop = boardY + boardH + 6;
          const diceCount = pv.dice.length;
          const dieGap = 6;
          const dieSize = Math.max(34, Math.min(46, Math.floor((hudW - 12 - Math.max(0, diceCount - 1) * dieGap) / Math.max(6, diceCount))));
          const diceStripW = diceCount * dieSize + Math.max(0, diceCount - 1) * dieGap;
          const diceStartX = width * 0.5 - diceStripW / 2;
          const dieY = diceZoneTop;
          const baseDiceCount = pv.turnNumber === 1 ? 5 : 6;

          pv.dice.forEach((die, idx) => {
            const dx = diceStartX + idx * (dieSize + dieGap);
            const rId = `kot-die-${idx}`;
            const hov = hoveredIdRef.current === rId;
            const canToggle = isMyTurn && pv.step === "RollDiceStep" && pv.rollsLeft > 0;
            if (canToggle) {
              newHitRegions.push({
                id: rId,
                shape: "rect",
                x: dx,
                y: dieY - 4,
                width: dieSize,
                height: dieSize + 8,
                cursor: "pointer",
                data: { type: "toggle-die", dieIndex: idx },
              });
            }
            const rollAnim = computeDieRollState(idx, die, dx, dieY, dieSize);
            drawKotDie2D(
              ctx,
              dx + rollAnim.offsetX,
              dieY,
              dieSize,
              rollAnim.displayFace,
              die.locked,
              canToggle && hov,
              idx >= baseDiceCount,
              rollAnim.anim
            );
          });

          const btnY = dieY + dieSize + 6;
          const btnH = 26;
          if (isMyTurn && btnY + btnH <= midBot + 6) {
            if (pv.step === "RollDiceStep") {
              const canReroll = pv.rollsLeft > 0 && pv.dice.some((d) => !d.locked);
              const rerollW = 136;
              const resolveW = 136;
              const gapB = 10;
              const bx0 = width * 0.5 - ((canReroll ? rerollW + gapB : 0) + resolveW) / 2;
              if (canReroll) {
                const id = "kot-btn-reroll";
                const hov = hoveredIdRef.current === id;
                newHitRegions.push({ id, shape: "rect", x: bx0, y: btnY, width: rerollW, height: btnH, cursor: "pointer", data: { type: "reroll" } });
                drawRoundedRect(ctx, bx0, btnY, rerollW, btnH, 8);
                ctx.fillStyle = hov ? "#38bdf8" : "#0284c7";
                ctx.fill();
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#ffffff";
                ctx.font = `900 10px ${fonts.sans}`;
                ctx.fillText(`Tung lại (${pv.rollsLeft})`, bx0 + rerollW / 2, btnY + btnH / 2);
              }
              const resX = canReroll ? bx0 + rerollW + gapB : bx0;
              const resId = "kot-btn-resolve";
              const resHov = hoveredIdRef.current === resId;
              newHitRegions.push({ id: resId, shape: "rect", x: resX, y: btnY, width: resolveW, height: btnH, cursor: "pointer", data: { type: "resolve" } });
              drawRoundedRect(ctx, resX, btnY, resolveW, btnH, 8);
              ctx.fillStyle = resHov ? "#fbbf24" : "#f59e0b";
              ctx.fill();
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = "#0f172a";
              ctx.font = `900 10px ${fonts.sans}`;
              ctx.fillText("Chốt xúc xắc", resX + resolveW / 2, btnY + btnH / 2);
            } else if (pv.step === "BuyCardsStep") {
              const endW = 160;
              const ex = width * 0.5 - endW / 2;
              const endId = "kot-btn-end";
              const hov = hoveredIdRef.current === endId;
              newHitRegions.push({ id: endId, shape: "rect", x: ex, y: btnY, width: endW, height: btnH, cursor: "pointer", data: { type: "end-turn" } });
              drawRoundedRect(ctx, ex, btnY, endW, btnH, 8);
              ctx.fillStyle = hov ? "#34d399" : "#10b981";
              ctx.fill();
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = "#022c22";
              ctx.font = `900 10px ${fonts.sans}`;
              ctx.fillText("Xong lượt", ex + endW / 2, btnY + btnH / 2);
            }
          }
        }

        // Victory confetti
        if (pv.step === "Finished" && Math.random() < 0.35) {
          particles.spawn({
            x: Math.random() * width,
            y: -6,
            vx: (Math.random() - 0.5) * 45,
            vy: 50 + Math.random() * 70,
            radius: 2.5 + Math.random() * 2.5,
            color: ["#fde047", "#38bdf8", "#f43f5e", "#34d399"][
              Math.floor(Math.random() * 4)
            ],
            life: 2.4,
            maxLife: 2.4,
          });
        }
      }

      // Render Kaiju Claw Slash FX
      slashesRef.current = slashesRef.current.filter((sl) => {
        const p = (now - sl.startMs) / sl.durationMs;
        if (p < 0) return true;
        if (p >= 1) return false;
        const fade = 1 - p;
        ctx.save();
        ctx.translate(sl.x, sl.y);
        ctx.globalAlpha = fade;
        ctx.strokeStyle = "#ef4444";
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 14;
        ctx.lineCap = "round";
        for (const off of [-22, 0, 22]) {
          ctx.lineWidth = 7 * fade;
          ctx.beginPath();
          ctx.moveTo(-55 + off, -32);
          ctx.lineTo(55 + off, 32);
          ctx.stroke();
        }
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
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `900 15px ${fonts.sans}`;
        ctx.fillStyle = "rgba(2, 6, 23, 0.92)";
        ctx.fillText(bn.text, bn.x + 1.5, bn.y - p * 26 + 1.5);
        ctx.fillStyle = bn.color;
        ctx.fillText(bn.text, bn.x, bn.y - p * 26);
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

    if (data.type === "inspect-monster") {
      inspectedMonsterRef.current = data.monsterId as KotMonsterId;
    } else if (data.type === "confirm-monster" || data.type === "pick-monster") {
      dispatch({ type: "PICK_MONSTER", monsterId: data.monsterId });
    } else if (data.type === "toggle-die") {
      dispatch({ type: "TOGGLE_DIE", dieIndex: data.dieIndex });
    } else if (data.type === "use-dice-token") {
      dispatch({ type: "USE_DICE_TOKEN" });
    } else if (data.type === "reroll") {
      rollingIndicesRef.current = null;
      rollStartMsRef.current = performance.now();
      rollSeedRef.current = Math.floor(Math.random() * 10000) + 1;
      landedDiceRef.current = new Set();
      dispatch({ type: "REROLL" });
    } else if (data.type === "resolve") {
      dispatch({ type: "RESOLVE_DICE" });
    } else if (data.type === "buy-card") {
      dispatch({ type: "BUY_CARD", cardId: data.cardId });
    } else if (data.type === "place-buzz") {
      dispatch({
        type: "PLACE_BUZZ",
        track: data.track as KotTrackType,
        startPos: Number(data.startPos),
      });
    } else if (data.type === "skip-buzz") {
      dispatch({ type: "SKIP_BUZZ" });
    } else if (data.type === "flush-market") {
      dispatch({ type: "FLUSH_MARKET" });
    } else if (data.type === "end-turn") {
      dispatch({ type: "END_TURN" });
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
