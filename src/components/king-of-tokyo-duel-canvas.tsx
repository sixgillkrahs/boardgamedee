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
  drawKotDie2D,
  drawKotGameBoard2D,
  drawKotIcon2D,
  drawKotMonsterBoard2D,
  drawKotMonsterPortrait2D,
  drawKotTokyoBackground2D,
  getKotBoardAtlas,
  getKotDiceAtlas,
  getKotGameBoardImage,
  getKotIconsAtlas,
  getKotMonsterAtlas,
  getKotTokensAtlas,
} from "@/canvas/king-of-tokyo-duel-art";
import {
  KOT_MONSTER_IDS,
  KOT_MONSTERS,
  type KotCommand,
  type KotMonsterId,
  type KotPlayerView,
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
  const rollShakeEndRef = useRef<number>(0);
  const screenShakeEndRef = useRef<number>(0);
  const screenShakeMagRef = useRef<number>(0);
  const lastAnimIdRef = useRef<number>(0);
  const smoothFameRef = useRef<number>(0);
  const smoothDestRef = useRef<number>(0);
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
        rollShakeEndRef.current = now + 380;
        for (let i = 0; i < 14; i++) {
          particles.spawn({
            x: midX + (Math.random() - 0.5) * 260,
            y: midY + 95,
            vx: (Math.random() - 0.5) * 90,
            vy: -30 - Math.random() * 60,
            radius: 2 + Math.random() * 2,
            color: i % 2 === 0 ? "#fde047" : "#38bdf8",
            life: 0.45,
            maxLife: 0.45,
          });
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
          text: `🐾 -${anim.damage} HP!`,
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
          text: `❤️ +${anim.heal} HP`,
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
          text: `⚡ +${anim.energyGain}`,
          color: "#bef264",
          x: midX + 95,
          y: actorY - 10,
          startMs: now + 100,
          durationMs: 1200,
        });
      }

      if (anim.kind === "BUY_CARD" && anim.labelVi) {
        bannersRef.current.push({
          text: anim.labelVi,
          color: "#fde047",
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

      drawKotTokyoBackground2D(ctx, width, height, now);

      const newHitRegions: HitRegion[] = [];
      const particles = particlesRef.current;

      if (curMode === "lobby" || !pv) {
        // --- LOBBY PREVIEW ---
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fde047";
        ctx.font = `900 ${Math.min(28, Math.round(width * 0.048))}px ${fonts.pixel}`;
        ctx.fillText("🦖 KING OF TOKYO: DUEL", width * 0.5, height * 0.11);

        ctx.fillStyle = "#cbd5e1";
        ctx.font = `600 12px ${fonts.sans}`;
        ctx.fillText(
          "Đại Chiến 1v1 • 6 Quái Vật Kaiju • Kéo Co Danh Vọng & Phá Hủy",
          width * 0.5,
          height * 0.17
        );

        const lCols = 3;
        const lRows = 2;
        const lGap = 12;
        const lMaxW = Math.min(200, (width - 64 - (lCols - 1) * lGap) / lCols);
        const lMaxH = Math.min(152, (height * 0.52 - (lRows - 1) * lGap) / lRows);
        const lAspect = 220 / 168;
        const lCardW = Math.max(88, Math.min(lMaxW, lMaxH * lAspect));
        const lCardH = lCardW / lAspect;
        const lGridW = lCols * lCardW + (lCols - 1) * lGap;
        const lGridH = lRows * lCardH + (lRows - 1) * lGap;
        const lsx = (width - lGridW) / 2;
        const lsy = height * 0.22 + Math.max(0, (height * 0.5 - lGridH) / 2);
        KOT_MONSTER_IDS.forEach((mid, i) => {
          const r = Math.floor(i / lCols);
          const c = i % lCols;
          const bob = Math.sin(now / 620 + i * 0.9) * 3;
          drawKotMonsterBoard2D(
            ctx,
            lsx + c * (lCardW + lGap),
            lsy + r * (lCardH + lGap) + bob,
            lCardW,
            lCardH,
            mid
          );
        });

        const count = Math.max(1, curLobby.length);
        const pillW = Math.min(180, Math.floor((width - 48) / count) - 10);
        const psx = width * 0.5 - ((pillW + 10) * curLobby.length - 10) / 2;
        curLobby.forEach((s, idx) => {
          const px = psx + idx * (pillW + 10);
          const py = height * 0.79;
          drawRoundedRect(ctx, px, py, pillW, 48, 12);
          ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
          ctx.fill();
          ctx.strokeStyle = s.seatNo === curViewer ? "#facc15" : "#475569";
          ctx.lineWidth = s.seatNo === curViewer ? 2 : 1.2;
          ctx.stroke();

          ctx.fillStyle = "#f8fafc";
          ctx.font = `800 12px ${fonts.sans}`;
          ctx.fillText(s.displayName, px + pillW / 2, py + 18, pillW - 14);
          ctx.fillStyle = s.isBot ? "#38bdf8" : "#fde047";
          ctx.font = `600 10px ${fonts.sans}`;
          ctx.fillText(
            s.isBot ? "🤖 Kaiju Bot" : `Người chơi #${s.seatNo}`,
            px + pillW / 2,
            py + 35
          );
        });
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
            ? "🦖 CHỌN QUÁI VẬT KAIJU CỦA BẠN!"
            : `⏳ Đang chờ ${activeSeat?.displayName ?? "..."} chọn Quái Vật...`,
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
        ctx.fillText(`${selMeta.emoji} ${selMeta.titleVi}`, leftX + innerPad, curY, innerW - 76);

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
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fde047";
        ctx.font = `900 11px ${fonts.sans}`;
        ctx.fillText(
          "⚡ NĂNG LỰC QUÁI VẬT",
          leftX + innerPad + 10,
          powerBoxY + ribbonH / 2 + 0.5
        );

        // Power Name + stylized red [!] badge icons (matching official card!)
        const pContentX = leftX + innerPad + 10;
        const pContentW = innerW - 20;
        const badgeY = powerBoxY + ribbonH + 10;
        drawRoundedRect(ctx, pContentX, badgeY, 20, 20, 4);
        ctx.fillStyle = "#dc2626";
        ctx.fill();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        ctx.font = `900 14px ${fonts.sans}`;
        ctx.fillText("!", pContentX + 10, badgeY + 10.5);

        ctx.textAlign = "left";
        ctx.fillStyle = "#0f172a";
        ctx.font = `900 13px ${fonts.sans}`;
        ctx.fillText(selMeta.powerNameVi, pContentX + 27, badgeY + 10.5, pContentW - 27);

        // Wrapped Vietnamese Power Description
        ctx.fillStyle = "#1e293b";
        const descFontSize = leftW < 255 ? 11 : 12;
        ctx.font = `700 ${descFontSize}px ${fonts.sans}`;
        const descLines = wrapCanvasText(ctx, selMeta.powerDescVi, pContentW);
        const lineH = descFontSize + 5;
        const descStartY = badgeY + 30;
        const maxLines = Math.max(
          2,
          Math.floor((powerBoxY + powerBoxH - 8 - descStartY) / lineH) + 1
        );
        descLines.slice(0, maxLines).forEach((line, li) => {
          ctx.fillText(line, pContentX, descStartY + li * lineH);
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
            `🦖 CHỌN ${selMeta.name.toUpperCase()}!`,
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
              ? `✓ ĐÃ CHỌN: ${selTakenBy}`
              : `⏳ Đang chờ ${activeSeat?.displayName ?? "..."}`,
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
        // --- ACTIVE 1v1 TOKYO DUEL ARENA ---
        const isMyTurn =
          pv.activeSeatNo === curViewer && pv.step !== "Finished";
        const mySeat =
          pv.seats.find((s) => s.seatNo === curViewer) ?? pv.seats[0];
        const oppSeat =
          pv.seats.find((s) => s.seatNo !== mySeat.seatNo) ?? pv.seats[1];
        const viewerIsSeat1 = mySeat.seatNo === pv.seats[0]?.seatNo;
        // Orient tracks so YOUR Win Zone & Spotlight Zone are ALWAYS on the RIGHT (+6) and Opponent on LEFT (-6)!
        const orient = (rawPos: number) => (viewerIsSeat1 ? -rawPos : rawPos);
        const targetFame = orient(pv.famePos);
        const targetDest = orient(pv.destructionPos);
        smoothFameRef.current += (targetFame - smoothFameRef.current) * Math.min(1, dt * 10);
        smoothDestRef.current += (targetDest - smoothDestRef.current) * Math.min(1, dt * 10);

        const hudH = Math.max(70, Math.min(82, Math.round(height * 0.135)));
        const padX = 12;
        const hudW = width - padX * 2;
        const topHudY = 8;
        const botHudY = height - hudH - 8;

        anchorsRef.current = {
          topY: topHudY + hudH / 2,
          botY: botHudY + hudH / 2,
          midX: width * 0.5,
          midY: height * 0.5,
        };

        // Helper to render Monster HUD Banner (Opponent Top / Viewer Bottom)
        const drawMonsterHud = (
          seat: typeof mySeat,
          yPos: number,
          isViewer: boolean
        ) => {
          const active = seat.seatNo === pv.activeSeatNo && pv.step !== "Finished";
          const winner = pv.winnerSeatNo === seat.seatNo;
          const mId = seat.monsterId ?? "gigazaur";
          const meta = KOT_MONSTERS[mId];

          drawRoundedRect(ctx, padX, yPos, hudW, hudH, 16);
          ctx.fillStyle = winner
            ? "rgba(120, 53, 15, 0.75)"
            : active
              ? "rgba(24, 34, 54, 0.94)"
              : "rgba(12, 18, 32, 0.88)";
          ctx.fill();
          ctx.strokeStyle = winner
            ? "#facc15"
            : active
              ? meta.accentColor
              : "rgba(148, 163, 184, 0.28)";
          ctx.lineWidth = active || winner ? 2.6 : 1.3;
          ctx.stroke();

          const pSize = hudH - 16;
          drawKotMonsterPortrait2D(ctx, padX + 10, yPos + 8, pSize, mId, active);

          const infoX = padX + pSize + 22;
          const infoW = hudW - pSize - 34;

          // Name + Monster + Active badge
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillStyle = active ? "#fde047" : "#f8fafc";
          ctx.font = `900 13px ${fonts.sans}`;
          ctx.fillText(
            `${active ? "▶ " : ""}${seat.displayName} — ${meta.name}${isViewer ? " (BẠN)" : ""}`,
            infoX,
            yPos + 19,
            infoW - 95
          );

          // Energy pill top-right with official 16-bit lime Energy Bolt icon!
          ctx.textAlign = "right";
          ctx.fillStyle = "#bef264";
          ctx.font = `900 14px ${fonts.mono}`;
          ctx.fillText(`${seat.energy}`, padX + hudW - 14, yPos + 19);
          const eWidth = ctx.measureText(`${seat.energy}`).width;
          drawKotIcon2D(ctx, padX + hudW - 24 - eWidth, yPos + 18.5, 16, "energy");

          // HP Bar
          const barY = yPos + 31;
          const barW = Math.min(260, infoW - 10);
          const barH = 16;
          drawRoundedRect(ctx, infoX, barY, barW, barH, 8);
          ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
          ctx.fill();
          const hpFrac = Math.max(0, Math.min(1, seat.hp / Math.max(1, seat.maxHp)));
          if (hpFrac > 0) {
            drawRoundedRect(ctx, infoX, barY, Math.max(12, barW * hpFrac), barH, 8);
            ctx.fillStyle =
              hpFrac > 0.5 ? "#10b981" : hpFrac > 0.25 ? "#f59e0b" : "#ef4444";
            ctx.fill();
          }
          ctx.strokeStyle = "rgba(255,255,255,0.2)";
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, infoX, barY, barW, barH, 8);
          ctx.stroke();

          drawKotIcon2D(ctx, infoX + 12, barY + barH / 2, 13, seat.hp <= 0 ? "skull" : "heart");
          ctx.textAlign = "center";
          ctx.fillStyle = "#ffffff";
          ctx.font = `800 10.5px ${fonts.mono}`;
          ctx.fillText(
            `${seat.hp} / ${seat.maxHp} HP`,
            infoX + barW / 2 + 5,
            barY + barH / 2 + 0.5
          );

          // Permanent Keep Cards & Bonus Dice badges on row 3
          ctx.textAlign = "left";
          ctx.fillStyle = "#cbd5e1";
          ctx.font = `600 10.5px ${fonts.sans}`;
          const keepSummary =
            seat.keepCards.length > 0
              ? seat.keepCards.map((c) => `${c.emoji}${c.nameVi}`).join(" • ")
              : `${meta.emoji} ${meta.powerNameVi}`;
          const extraDiceTag =
            seat.bonusDiceNextTurn > 0 ? ` [+${seat.bonusDiceNextTurn}🎲]` : "";
          ctx.fillText(
            `${keepSummary}${extraDiceTag}`,
            infoX,
            yPos + hudH - 15,
            infoW
          );
        };

        drawMonsterHud(oppSeat, topHudY, false);
        drawMonsterHud(mySeat, botHudY, true);

        // --- CENTER: HERO 16-BIT TOKYO DUEL GAME BOARD + KAIJU DICE DECK ---
        const midTop = topHudY + hudH + 10;
        const midBot = botHudY - 10;
        const midH = Math.max(210, midBot - midTop);
        const boardAspect = 512 / 325;
        const isRolling = now < rollShakeEndRef.current;
        const orientedBuzz = pv.buzzTokens.map((b) => ({
          id: b.id,
          track: b.track,
          orientedPos: orient(b.pos),
          kind: b.kind,
        }));

        const isWideArena = width >= 760 && midH >= 240;

        if (isWideArena) {
          // WIDE SPLIT: Huge unobstructed 16-bit Tokyo Board on LEFT (~65%), Dice & Actions Panel on RIGHT (~33%)
          const gapMid = 14;
          const deckW = Math.max(216, Math.min(276, Math.round(hudW * 0.31)));
          const boardMaxW = hudW - deckW - gapMid;
          const boardW = Math.min(boardMaxW, Math.round(midH * boardAspect));
          const boardH = Math.round(boardW / boardAspect);
          const totalGroupW = boardW + gapMid + deckW;
          const groupX0 = padX + Math.max(0, Math.round((hudW - totalGroupW) / 2));
          const boardX = groupX0;
          const boardY = midTop + Math.round((midH - boardH) / 2);

          drawKotGameBoard2D(ctx, boardX, boardY, boardW, boardH, {
            nowMs: now,
            smoothFame: smoothFameRef.current,
            smoothDest: smoothDestRef.current,
            buzzTokens: orientedBuzz,
          });

          // Right Tactical Dice & Action Deck
          const deckX = boardX + boardW + gapMid;
          const deckY = boardY;
          const deckH = boardH;

          drawRoundedRect(ctx, deckX, deckY, deckW, deckH, 16);
          ctx.fillStyle = "rgba(10, 15, 30, 0.9)";
          ctx.fill();
          ctx.strokeStyle = isMyTurn
            ? "rgba(250, 204, 21, 0.52)"
            : "rgba(148, 163, 184, 0.25)";
          ctx.lineWidth = isMyTurn ? 1.8 : 1.2;
          ctx.stroke();

          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = isMyTurn ? "#fde047" : "#94a3b8";
          ctx.font = `900 11.5px ${fonts.sans}`;
          const deckTitle =
            pv.step === "Finished"
              ? "🏆 TRẬN ĐẤU KẾT THÚC"
              : pv.step === "BuyCardsStep"
                ? "🛒 MUA THẺ NĂNG LỰC"
                : `🎲 XÚC XẮC KAIJU (${pv.rollsLeft} lượt tung)`;
          ctx.fillText(deckTitle, deckX + deckW / 2, deckY + 18, deckW - 16);

          // Dice grid (3 cols x 2 rows, or 4x2 if 7-8 bonus dice!)
          const diceCount = pv.dice.length;
          const dCols = diceCount > 6 ? 4 : 3;
          const dRows = Math.ceil(diceCount / dCols);
          const dGap = 10;
          const btnsAreaH = isMyTurn ? (pv.step === "RollDiceStep" ? 84 : 44) : 26;
          const diceAvailH = Math.max(96, deckH - 36 - btnsAreaH - 12);
          const dieSize = Math.max(
            38,
            Math.min(
              62,
              Math.floor((deckW - 24 - (dCols - 1) * dGap) / dCols),
              Math.floor((diceAvailH - (dRows - 1) * dGap) / dRows)
            )
          );
          const dGridH = dRows * dieSize + (dRows - 1) * dGap;
          const dGridY0 = deckY + 32 + Math.max(0, Math.round((diceAvailH - dGridH) / 2));

          pv.dice.forEach((die, idx) => {
            const r = Math.floor(idx / dCols);
            const c = idx % dCols;
            const rowItems = Math.min(dCols, diceCount - r * dCols);
            const rowW = rowItems * dieSize + (rowItems - 1) * dGap;
            const dx = deckX + (deckW - rowW) / 2 + c * (dieSize + dGap);
            const dy = dGridY0 + r * (dieSize + dGap);
            const wobbleX = isRolling && !die.locked ? (Math.random() - 0.5) * 6 : 0;
            const wobbleY =
              isRolling && !die.locked ? -Math.abs(Math.sin(now / 45 + idx)) * 9 : 0;
            const rId = `kot-die-${idx}`;
            const hov = hoveredIdRef.current === rId;
            const canToggle = isMyTurn && pv.step === "RollDiceStep" && pv.rollsLeft > 0;

            if (canToggle) {
              newHitRegions.push({
                id: rId,
                shape: "rect",
                x: dx,
                y: dy - 6,
                width: dieSize,
                height: dieSize + 10,
                cursor: "pointer",
                data: { type: "toggle-die", dieIndex: idx },
              });
            }

            drawKotDie2D(
              ctx,
              dx + wobbleX,
              dy + wobbleY,
              dieSize,
              die.face,
              die.locked,
              canToggle && hov
            );
          });

          // Stacked full-width Action Buttons pinned neatly to bottom of Right Deck
          const bPad = 12;
          const bW = deckW - bPad * 2;
          const bH = 34;
          const bBottom = deckY + deckH - 12;

          if (isMyTurn) {
            if (pv.step === "RollDiceStep") {
              const canReroll = pv.rollsLeft > 0 && pv.dice.some((d) => !d.locked);
              const resY = bBottom - bH;

              if (canReroll) {
                const rrY = resY - bH - 8;
                const id = "kot-btn-reroll";
                const hov = hoveredIdRef.current === id;
                newHitRegions.push({
                  id,
                  shape: "rect",
                  x: deckX + bPad,
                  y: rrY,
                  width: bW,
                  height: bH,
                  cursor: "pointer",
                  data: { type: "reroll" },
                });
                drawRoundedRect(ctx, deckX + bPad, rrY, bW, bH, 10);
                ctx.fillStyle = hov ? "#38bdf8" : "#0284c7";
                ctx.fill();
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#ffffff";
                ctx.font = `900 11.5px ${fonts.sans}`;
                ctx.fillText(
                  `🎲 TUNG LẠI (Còn ${pv.rollsLeft})`,
                  deckX + deckW / 2,
                  rrY + bH / 2 + 0.5
                );
              }

              const resId = "kot-btn-resolve";
              const resHov = hoveredIdRef.current === resId;
              newHitRegions.push({
                id: resId,
                shape: "rect",
                x: deckX + bPad,
                y: resY,
                width: bW,
                height: bH,
                cursor: "pointer",
                data: { type: "resolve" },
              });
              drawRoundedRect(ctx, deckX + bPad, resY, bW, bH, 10);
              ctx.fillStyle = resHov ? "#fbbf24" : "#f59e0b";
              ctx.fill();
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = "#0f172a";
              ctx.font = `900 11.5px ${fonts.sans}`;
              ctx.fillText(
                "✅ CHỐT XÚC XẮC",
                deckX + deckW / 2,
                resY + bH / 2 + 0.5
              );
            } else if (pv.step === "BuyCardsStep") {
              const endY = bBottom - bH;
              const endId = "kot-btn-end";
              const hov = hoveredIdRef.current === endId;
              newHitRegions.push({
                id: endId,
                shape: "rect",
                x: deckX + bPad,
                y: endY,
                width: bW,
                height: bH,
                cursor: "pointer",
                data: { type: "end-turn" },
              });
              drawRoundedRect(ctx, deckX + bPad, endY, bW, bH, 10);
              ctx.fillStyle = hov ? "#34d399" : "#10b981";
              ctx.fill();
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = "#022c22";
              ctx.font = `900 11.5px ${fonts.sans}`;
              ctx.fillText(
                "⏭ KẾT THÚC LƯỢT",
                deckX + deckW / 2,
                endY + bH / 2 + 0.5
              );
            }
          } else if (pv.step !== "Finished") {
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#94a3b8";
            ctx.font = `700 11px ${fonts.sans}`;
            ctx.fillText(
              `⏳ Đang chờ ${oppSeat.displayName}...`,
              deckX + deckW / 2,
              bBottom - 10,
              bW
            );
          }
        } else {
          // NARROW STACKED: 16-bit Tokyo Board on TOP (~64%) + Horizontal Dice & Action Strip BELOW
          const diceStripAreaH = isMyTurn ? 96 : 64;
          const availBoardH = Math.max(130, midH - diceStripAreaH - 8);
          const boardW = Math.min(hudW, Math.round(availBoardH * boardAspect));
          const boardH = Math.round(boardW / boardAspect);
          const boardX = padX + Math.round((hudW - boardW) / 2);
          const boardY = midTop;

          drawKotGameBoard2D(ctx, boardX, boardY, boardW, boardH, {
            nowMs: now,
            smoothFame: smoothFameRef.current,
            smoothDest: smoothDestRef.current,
            buzzTokens: orientedBuzz,
          });

          const diceZoneTop = boardY + boardH + 8;
          const diceCount = pv.dice.length;
          const dieGap = 8;
          const dieSize = Math.max(
            38,
            Math.min(
              54,
              Math.floor((hudW - 16 - Math.max(0, diceCount - 1) * dieGap) / Math.max(6, diceCount))
            )
          );
          const diceStripW = diceCount * dieSize + Math.max(0, diceCount - 1) * dieGap;
          const diceStartX = width * 0.5 - diceStripW / 2;
          const dieY = diceZoneTop + 2;

          pv.dice.forEach((die, idx) => {
            const dx = diceStartX + idx * (dieSize + dieGap);
            const wobbleX = isRolling && !die.locked ? (Math.random() - 0.5) * 6 : 0;
            const wobbleY =
              isRolling && !die.locked ? -Math.abs(Math.sin(now / 45 + idx)) * 8 : 0;
            const rId = `kot-die-${idx}`;
            const hov = hoveredIdRef.current === rId;
            const canToggle = isMyTurn && pv.step === "RollDiceStep" && pv.rollsLeft > 0;

            if (canToggle) {
              newHitRegions.push({
                id: rId,
                shape: "rect",
                x: dx,
                y: dieY - 6,
                width: dieSize,
                height: dieSize + 10,
                cursor: "pointer",
                data: { type: "toggle-die", dieIndex: idx },
              });
            }

            drawKotDie2D(
              ctx,
              dx + wobbleX,
              dieY + wobbleY,
              dieSize,
              die.face,
              die.locked,
              canToggle && hov
            );
          });

          const btnY = dieY + dieSize + 8;
          const btnH = 28;
          if (isMyTurn && btnY + btnH <= midBot + 6) {
            if (pv.step === "RollDiceStep") {
              const canReroll = pv.rollsLeft > 0 && pv.dice.some((d) => !d.locked);
              const rerollW = 148;
              const resolveW = 148;
              const gapB = 10;
              const bx0 =
                width * 0.5 -
                ((canReroll ? rerollW + gapB : 0) + resolveW) / 2;

              if (canReroll) {
                const id = "kot-btn-reroll";
                const hov = hoveredIdRef.current === id;
                newHitRegions.push({
                  id,
                  shape: "rect",
                  x: bx0,
                  y: btnY,
                  width: rerollW,
                  height: btnH,
                  cursor: "pointer",
                  data: { type: "reroll" },
                });
                drawRoundedRect(ctx, bx0, btnY, rerollW, btnH, 9);
                ctx.fillStyle = hov ? "#38bdf8" : "#0284c7";
                ctx.fill();
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#ffffff";
                ctx.font = `900 10.5px ${fonts.sans}`;
                ctx.fillText(
                  `🎲 TUNG LẠI (${pv.rollsLeft})`,
                  bx0 + rerollW / 2,
                  btnY + btnH / 2
                );
              }

              const resX = canReroll ? bx0 + rerollW + gapB : bx0;
              const resId = "kot-btn-resolve";
              const resHov = hoveredIdRef.current === resId;
              newHitRegions.push({
                id: resId,
                shape: "rect",
                x: resX,
                y: btnY,
                width: resolveW,
                height: btnH,
                cursor: "pointer",
                data: { type: "resolve" },
              });
              drawRoundedRect(ctx, resX, btnY, resolveW, btnH, 9);
              ctx.fillStyle = resHov ? "#fbbf24" : "#f59e0b";
              ctx.fill();
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = "#0f172a";
              ctx.font = `900 10.5px ${fonts.sans}`;
              ctx.fillText(
                "✅ CHỐT XÚC XẮC",
                resX + resolveW / 2,
                btnY + btnH / 2
              );
            } else if (pv.step === "BuyCardsStep") {
              const endW = 192;
              const ex = width * 0.5 - endW / 2;
              const endId = "kot-btn-end";
              const hov = hoveredIdRef.current === endId;
              newHitRegions.push({
                id: endId,
                shape: "rect",
                x: ex,
                y: btnY,
                width: endW,
                height: btnH,
                cursor: "pointer",
                data: { type: "end-turn" },
              });
              drawRoundedRect(ctx, ex, btnY, endW, btnH, 9);
              ctx.fillStyle = hov ? "#34d399" : "#10b981";
              ctx.fill();
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = "#022c22";
              ctx.font = `900 10.5px ${fonts.sans}`;
              ctx.fillText(
                "⏭ KẾT THÚC LƯỢT",
                ex + endW / 2,
                btnY + btnH / 2
              );
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
    } else if (data.type === "reroll") {
      dispatch({ type: "REROLL" });
    } else if (data.type === "resolve") {
      dispatch({ type: "RESOLVE_DICE" });
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
