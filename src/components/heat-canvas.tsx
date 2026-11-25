"use client";

import React, { useEffect, useRef } from "react";
import {
  drawRoundedRect,
  findHitRegionAtPoint,
  getCanvasFontFamilies,
  type HitRegion,
} from "@/canvas/engine";
import {
  drawGearPawn2D,
  drawHeatCar2D,
  drawHeatCard2D,
  getHeatCardAtlasImage,
  getHeatPlayerMatImage,
  getHeatTrackImage,
  HEAT_MAT_LAYOUT,
  HEAT_TRACK_WAYPOINTS,
  sampleTrackPose,
} from "@/canvas/heat-art";
import { HeatFxEngine } from "@/canvas/heat-fx";
import {
  HEAT_CAR_COLORS,
  HEAT_TRACKS,
  type HeatCommand,
  type HeatPlayerView,
  type HeatTrackId,
} from "@/cartridges/heat";
import type { LobbySeatItem } from "@/components/werewolf-canvas";

interface FloatingBanner {
  text: string;
  color: string;
  x: number;
  y: number;
  startMs: number;
  durationMs: number;
}

export interface HeatCanvasProps {
  mode: "lobby" | "match";
  lobbySeats: LobbySeatItem[];
  lobbyTrackId: HeatTrackId;
  viewerSeatNo: number | null;
  isHost?: boolean;
  busy?: boolean;
  playerView: HeatPlayerView | null;
  selectedGear: 1 | 2 | 3 | 4;
  selectedCardIds: string[];
  discardCardIds: string[];
  onSelectGear: (gear: 1 | 2 | 3 | 4) => void;
  onToggleCard: (cardId: string) => void;
  onToggleDiscardCard: (cardId: string) => void;
  onDispatchCommand: (cmd: HeatCommand) => void;
  onRematch?: () => void;
}

export function HeatCanvas({
  mode,
  lobbySeats,
  lobbyTrackId,
  viewerSeatNo,
  isHost = false,
  busy = false,
  playerView,
  selectedGear,
  selectedCardIds,
  discardCardIds,
  onSelectGear,
  onToggleCard,
  onToggleDiscardCard,
  onDispatchCommand,
  onRematch,
}: HeatCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hitRegionsRef = useRef<HitRegion[]>([]);
  const hoveredIdRef = useRef<string | null>(null);
  const fxRef = useRef<HeatFxEngine>(new HeatFxEngine());
  const bannersRef = useRef<FloatingBanner[]>([]);
  const lastAnimIdRef = useRef<number>(0);
  const boardRectRef = useRef({ x: 16, y: 12, w: 640, h: 420 });

  const stateRef = useRef({
    mode,
    lobbySeats,
    lobbyTrackId,
    viewerSeatNo,
    isHost,
    busy,
    playerView,
    selectedGear,
    selectedCardIds,
    discardCardIds,
    onSelectGear,
    onToggleCard,
    onToggleDiscardCard,
    onDispatchCommand,
    onRematch,
  });

  useEffect(() => {
    stateRef.current = {
      mode,
      lobbySeats,
      lobbyTrackId,
      viewerSeatNo,
      isHost,
      busy,
      playerView,
      selectedGear,
      selectedCardIds,
      discardCardIds,
      onSelectGear,
      onToggleCard,
      onToggleDiscardCard,
      onDispatchCommand,
      onRematch,
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
      const fx = fxRef.current;
      const br = boardRectRef.current;
      const actorSeat = playerView.seats.find(
        (s) => s.seatNo === anim.actorSeatNo
      );
      const pose = sampleTrackPose(
        playerView.track.id,
        anim.toProgress ?? actorSeat?.progress ?? 0,
        actorSeat?.lane ?? 0,
        br.x,
        br.y,
        br.w,
        br.h
      );

      if (
        anim.kind === "REVEAL_MOVE" ||
        anim.kind === "BOOST" ||
        anim.kind === "ADRENALINE" ||
        anim.kind === "SLIPSTREAM"
      ) {
        if (
          anim.fromProgress !== undefined &&
          anim.toProgress !== undefined
        ) {
          fx.startCarMove(
            anim.actorSeatNo,
            anim.fromProgress,
            anim.toProgress,
            now,
            anim.kind === "REVEAL_MOVE" ? 720 : 480,
            false
          );
        }
        if (anim.kind === "BOOST") {
          fx.triggerShake(now, 6, 260);
          fx.spawnExhaustBurst(pose.x, pose.y, 24);
          bannersRef.current.push({
            text: `🚀 BOOST! TỐC ĐỘ ${anim.speed ?? ""}!`,
            color: "#fb923c",
            x: pose.x,
            y: pose.y - 26,
            startMs: now,
            durationMs: 1350,
          });
        } else if (anim.kind === "SLIPSTREAM") {
          fx.spawnSlipstreamWind(pose.x, pose.y, 22);
          bannersRef.current.push({
            text: "💨 NÚP GIÓ +2 Ô!",
            color: "#38bdf8",
            x: pose.x,
            y: pose.y - 26,
            startMs: now,
            durationMs: 1350,
          });
        } else if (anim.kind === "ADRENALINE") {
          fx.spawnExhaustBurst(pose.x, pose.y, 16);
          bannersRef.current.push({
            text: "⚡ ADRENALINE +1 Ô!",
            color: "#fde047",
            x: pose.x,
            y: pose.y - 26,
            startMs: now,
            durationMs: 1200,
          });
        } else {
          fx.spawnExhaustBurst(pose.x, pose.y, 12);
        }
      } else if (anim.kind === "COOLDOWN") {
        fx.spawnCooldownFrost(br.x + br.w * 0.25, br.y + br.h + 45, 22);
        bannersRef.current.push({
          text: "❄️ LÀM MÁT ĐỘNG CƠ (-1 HEAT TRÊN TAY)",
          color: "#7dd3fc",
          x: br.x + br.w * 0.35,
          y: br.y + br.h - 14,
          startMs: now,
          durationMs: 1300,
        });
      } else if (anim.kind === "CORNER_PASS") {
        fx.triggerShake(now, 4, 200);
        fx.spawnExhaustBurst(pose.x, pose.y, 18);
        bannersRef.current.push({
          text: `🔥 VƯỢT TỐC QUA CUA (-${anim.heatPaid ?? 1} HEAT)`,
          color: "#f97316",
          x: pose.x,
          y: pose.y - 26,
          startMs: now,
          durationMs: 1400,
        });
      } else if (anim.kind === "SPIN_OUT") {
        if (
          anim.fromProgress !== undefined &&
          anim.toProgress !== undefined
        ) {
          fx.startCarMove(
            anim.actorSeatNo,
            anim.fromProgress,
            anim.toProgress,
            now,
            750,
            true
          );
        }
        fx.triggerShake(now, 12, 480);
        fx.spawnSpinOutSmoke(pose.x, pose.y, 34);
        bannersRef.current.push({
          text: `💥 VĂNG XE! VỀ SỐ 1 (+${anim.stressAdded ?? 1} STRESS)`,
          color: "#fda4af",
          x: pose.x,
          y: pose.y - 30,
          startMs: now,
          durationMs: 1800,
        });
      } else if (anim.kind === "FINISH_CROSS") {
        fx.spawnFinishConfetti(pose.x, pose.y, 40);
        bannersRef.current.push({
          text: "🏁 CÁN VẠCH ĐÍCH!",
          color: "#fde047",
          x: pose.x,
          y: pose.y - 30,
          startMs: now,
          durationMs: 1800,
        });
      }
    }
  }, [
    mode,
    lobbySeats,
    lobbyTrackId,
    viewerSeatNo,
    isHost,
    busy,
    playerView,
    selectedGear,
    selectedCardIds,
    discardCardIds,
    onSelectGear,
    onToggleCard,
    onToggleDiscardCard,
    onDispatchCommand,
    onRematch,
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
        lobbySeats: curLobbySeats,
        lobbyTrackId: curLobbyTrackId,
        viewerSeatNo: curViewer,
        isHost: curIsHost,
        busy: curBusy,
        playerView: pv,
        selectedGear: curGear,
        selectedCardIds: curSelectedCards,
        discardCardIds: curDiscardCards,
      } = stateRef.current;

      const activeTrackId: HeatTrackId =
        curMode === "match" && pv ? pv.track.id : curLobbyTrackId;
      const trackSpec = HEAT_TRACKS[activeTrackId] ?? HEAT_TRACKS.usa;
      const trackImg = getHeatTrackImage(activeTrackId);
      getHeatCardAtlasImage();

      ctx.save();
      ctx.scale(dpr, dpr);

      const shake = fxRef.current.getShakeOffset(now);
      if (shake.dx !== 0 || shake.dy !== 0) {
        ctx.translate(shake.dx, shake.dy);
      }

      // Dark racing pit asphalt background
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.38,
        40,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.82
      );
      bgGrad.addColorStop(0, "#1e293b");
      bgGrad.addColorStop(1, "#090d16");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const newHitRegions: HitRegion[] = [];

      // Stacked Match Layout:
      // 1) Top: Wide Track Board
      // 2) Middle: 7-Card Hand Tray + Action Console
      // 3) Bottom (below the cards): Giant Official Player Mat (Cockpit + 3 Card Slots + 4-Gear Shifter)
      const isMatchMode = curMode === "match" && !!pv;
      const handRowH = isMatchMode ? 184 : 0;
      const matRowH = isMatchMode
        ? Math.max(430, Math.min(540, Math.round(height * 0.4)))
        : 0;
      const dockH = handRowH + matRowH + (isMatchMode ? 14 : 0);
      const availBoardW = width - 16;
      const availBoardH = height - dockH - (dockH > 0 ? 16 : 12);

      const targetAspect = 1.48;
      let boardW = availBoardW;
      let boardH = Math.round(boardW / targetAspect);
      if (boardH > availBoardH) {
        boardH = availBoardH;
        boardW = Math.round(boardH * targetAspect);
      }
      const boardX = Math.round((width - boardW) * 0.5);
      const boardY = Math.round(4 + (availBoardH - boardH) * 0.5);
      boardRectRef.current = { x: boardX, y: boardY, w: boardW, h: boardH };

      // Draw Track Board Frame
      ctx.save();
      drawRoundedRect(ctx, boardX - 3, boardY - 3, boardW + 6, boardH + 6, 14);
      ctx.fillStyle = "#0f172a";
      ctx.fill();
      ctx.strokeStyle = trackSpec.accentColor;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      drawRoundedRect(ctx, boardX, boardY, boardW, boardH, 12);
      ctx.clip();

      if (trackImg) {
        ctx.drawImage(trackImg, boardX, boardY, boardW, boardH);
      } else {
        ctx.fillStyle =
          activeTrackId === "deutschland" ? "#143322" : "#9a4b26";
        ctx.fillRect(boardX, boardY, boardW, boardH);

        const wps = HEAT_TRACK_WAYPOINTS[activeTrackId];
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 28;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        wps.forEach((wp, i) => {
          const px = boardX + wp.u * boardW;
          const py = boardY + wp.v * boardH;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.stroke();
      }

      // Highlight Corner Lines & Speed Limits clearly on the board
      for (const corner of trackSpec.corners) {
        const cPose = sampleTrackPose(
          activeTrackId,
          corner.afterSpaceIndex + 0.5,
          0,
          boardX,
          boardY,
          boardW,
          boardH,
          0
        );
        const badgeX = cPose.x + cPose.nx * 24;
        const badgeY = cPose.y + cPose.ny * 24;

        ctx.save();
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, 12, 0, Math.PI * 2);
        ctx.fillStyle = corner.isChicane ? "#0284c7" : "#0f172a";
        ctx.fill();
        ctx.strokeStyle = corner.isChicane ? "#e0f2fe" : "#facc15";
        ctx.lineWidth = 2.2;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `900 11.5px ${fonts.mono}`;
        ctx.fillText(String(corner.speedLimit), badgeX, badgeY + 0.5);
        ctx.restore();
      }

      // Compact Race Standings & Track HUD Strip inside board (bottom-left on Deutschland to avoid top-left Corner 1; top-left on USA & South Africa)
      if (pv) {
        const standW = Math.min(350, Math.round(boardW * 0.42));
        const standH = 26 + pv.seats.length * 19;
        const standX = boardX + 10;
        const standY =
          activeTrackId === "deutschland"
            ? boardY + boardH - standH - 10
            : boardY + 10;

        drawRoundedRect(ctx, standX, standY, standW, standH, 10);
        ctx.fillStyle = "rgba(9, 13, 22, 0.84)";
        ctx.fill();
        ctx.strokeStyle = "rgba(248, 250, 252, 0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fde047";
        ctx.font = `800 10.5px ${fonts.sans}`;
        ctx.fillText(
          `🏁 ${trackSpec.shortNameVi} • Vòng lượt #${pv.roundNumber} (${pv.totalLaps} Laps)`,
          standX + 8,
          standY + 11
        );

        const sortedStandings = [...pv.seats].sort(
          (a, b) => a.raceRank - b.raceRank
        );
        sortedStandings.forEach((car, idx) => {
          const ry = standY + 28 + idx * 18;
          const cSpec =
            HEAT_CAR_COLORS.find((c) => c.id === car.colorId) ??
            HEAT_CAR_COLORS[0];
          const isAct = car.seatNo === pv.activeSeatNo;

          if (isAct) {
            drawRoundedRect(ctx, standX + 4, ry - 8, standW - 8, 16, 4);
            ctx.fillStyle = "rgba(245, 158, 11, 0.24)";
            ctx.fill();
          }

          ctx.fillStyle = "#fde047";
          ctx.font = `800 10px ${fonts.mono}`;
          ctx.fillText(`#${car.raceRank}`, standX + 8, ry);

          ctx.fillStyle = cSpec.primaryHex;
          ctx.beginPath();
          ctx.arc(standX + 30, ry, 4.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = car.seatNo === curViewer ? "#38bdf8" : "#f8fafc";
          ctx.font = `700 10.5px ${fonts.sans}`;
          ctx.fillText(car.displayName, standX + 40, ry, standW - 165);

          ctx.textAlign = "right";
          ctx.fillStyle = "#cbd5e1";
          ctx.font = `700 9.5px ${fonts.mono}`;
          ctx.fillText(
            `Số ${car.gear} | 🔥${car.engineHeatCount} | L${car.lap}/${pv.totalLaps}`,
            standX + standW - 8,
            ry
          );
          ctx.textAlign = "left";
        });
      }

      // Top-right Active Driver's Revealed Played Cards Tray during ReactAndSlipstreamStep
      if (
        pv &&
        pv.step === "ReactAndSlipstreamStep" &&
        pv.activeSeatNo !== null
      ) {
        const actSeat = pv.seats.find((s) => s.seatNo === pv.activeSeatNo);
        if (actSeat && actSeat.playedCards.length > 0) {
          const pCardH = 76;
          const pCardW = 50;
          const pGap = 6;
          const trayW = 18 + actSeat.playedCards.length * (pCardW + pGap) + 84;
          const trayX = boardX + boardW - trayW - 10;
          const trayY = boardY + 10;

          drawRoundedRect(ctx, trayX, trayY, trayW, pCardH + 22, 10);
          ctx.fillStyle = "rgba(9, 13, 22, 0.9)";
          ctx.fill();
          ctx.strokeStyle = "rgba(250, 204, 21, 0.55)";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = "#fde047";
          ctx.textAlign = "left";
          ctx.font = `800 10px ${fonts.sans}`;
          ctx.fillText(
            `🏎️ ${actSeat.displayName}`,
            trayX + 10,
            trayY + 24,
            76
          );
          ctx.fillStyle = "#ffffff";
          ctx.font = `900 15px ${fonts.mono}`;
          ctx.fillText(
            `Tốc ${actSeat.turnSpeed}`,
            trayX + 10,
            trayY + 48,
            76
          );

          actSeat.playedCards.forEach((c, idx) => {
            drawHeatCard2D(
              ctx,
              trayX + 88 + idx * (pCardW + pGap),
              trayY + 11,
              pCardW,
              pCardH,
              c,
              { colorId: actSeat.colorId }
            );
          });
        }
      }

      // Draw Cars on the Track!
      const carScale = Math.max(0.85, Math.min(1.25, boardW / 740));
      const laneOffsetPx = Math.max(8, Math.round(boardW * 0.0125));

      if (curMode === "lobby" || !pv) {
        curLobbySeats.forEach((seat, idx) => {
          const colorSpec = HEAT_CAR_COLORS[idx % HEAT_CAR_COLORS.length];
          const gridRow = Math.floor(idx / 2);
          const progress = -(gridRow + 1);
          const lane: 0 | 1 = idx % 2 === 0 ? 0 : 1;
          const pose = sampleTrackPose(
            activeTrackId,
            progress,
            lane,
            boardX,
            boardY,
            boardW,
            boardH,
            laneOffsetPx
          );
          drawHeatCar2D(ctx, pose.x, pose.y, pose.angle, colorSpec.id, {
            scale: carScale,
            isViewer: seat.seatNo === curViewer,
          });
        });
      } else {
        const mySeat = pv.seats.find((s) => s.seatNo === curViewer);
        if (
          pv.step === "GearAndCardsStep" &&
          mySeat &&
          !mySeat.hasPlanned &&
          curSelectedCards.length > 0
        ) {
          const estSpeed = pv.myHand
            .filter((c) => curSelectedCards.includes(c.id))
            .reduce((sum, c) => sum + (c.value ?? 2.5), 0);
          const ghostPose = sampleTrackPose(
            activeTrackId,
            mySeat.progress + Math.round(estSpeed),
            0,
            boardX,
            boardY,
            boardW,
            boardH,
            laneOffsetPx
          );
          ctx.save();
          ctx.strokeStyle = "#fde047";
          ctx.lineWidth = 2.4;
          ctx.setLineDash([5, 3]);
          ctx.beginPath();
          ctx.arc(ghostPose.x, ghostPose.y, 14 * carScale, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        const orderedCars = [...pv.seats].sort((a, b) => {
          if (a.seatNo === pv.activeSeatNo) return 1;
          if (b.seatNo === pv.activeSeatNo) return -1;
          return a.seatNo - b.seatNo;
        });

        for (const car of orderedCars) {
          const interp = fxRef.current.getInterpolatedCarProgress(
            car.seatNo,
            car.progress,
            now
          );
          const pose = sampleTrackPose(
            activeTrackId,
            interp.progress,
            car.lane,
            boardX,
            boardY,
            boardW,
            boardH,
            laneOffsetPx
          );
          drawHeatCar2D(ctx, pose.x, pose.y, pose.angle, car.colorId, {
            scale: carScale,
            isViewer: car.seatNo === curViewer,
            isActive: car.seatNo === pv.activeSeatNo,
            flameIntensity:
              interp.isMoving || car.seatNo === pv.activeSeatNo ? 0.95 : 0,
            spinAngleOffset: interp.spinAngleOffset,
            gear: car.gear,
          });
        }
      }

      ctx.restore(); // End board clip

      // Render FX particles & flying cards above the board
      fxRef.current.updateAndDraw(ctx, dt, now);

      // Render floating banners
      bannersRef.current = bannersRef.current.filter((b) => {
        const p = (now - b.startMs) / b.durationMs;
        if (p < 0) return true;
        if (p >= 1) return false;
        const alpha = p > 0.7 ? (1 - p) / 0.3 : 1;
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.font = `900 13px ${fonts.sans}`;
        const tw = ctx.measureText(b.text).width;
        const bx = Math.max(
          tw / 2 + 16,
          Math.min(width - tw / 2 - 16, b.x)
        );
        const by = Math.max(28, b.y - p * 22);
        drawRoundedRect(ctx, bx - tw / 2 - 10, by - 13, tw + 20, 26, 8);
        ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
        ctx.fill();
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = b.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(b.text, bx, by);
        ctx.restore();
        return true;
      });

      // --- STACKED BOTTOM COCKPIT (ROW 1: 7-CARD HAND + ACTION CONSOLE, ROW 2 BELOW CARDS: GIANT OFFICIAL PLAYER MAT) ---
      if (curMode === "match" && pv && dockH > 0) {
        const dockY = height - dockH - 4;
        const handBarY = dockY;
        const matBarY = dockY + handRowH + 10;

        // Background container for Row 1 (Hand Cards + Action Console)
        drawRoundedRect(ctx, 8, handBarY, width - 16, handRowH, 14);
        ctx.fillStyle = "rgba(9, 13, 22, 0.95)";
        ctx.fill();
        ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
        ctx.lineWidth = 1.3;
        ctx.stroke();

        // Background container for Row 2 (Giant Official Player Mat below the cards)
        drawRoundedRect(ctx, 8, matBarY, width - 16, matRowH, 16);
        ctx.fillStyle = "rgba(9, 13, 22, 0.96)";
        ctx.fill();
        ctx.strokeStyle = "rgba(245, 158, 11, 0.32)";
        ctx.lineWidth = 1.4;
        ctx.stroke();

        const mySeat =
          pv.seats.find((s) => s.seatNo === curViewer) ?? pv.seats[0];
        const myColorSpec =
          HEAT_CAR_COLORS.find((c) => c.id === mySeat.colorId) ??
          HEAT_CAR_COLORS[0];
        const isMyReactTurn =
          pv.step === "ReactAndSlipstreamStep" &&
          pv.activeSeatNo === curViewer;
        const canPlanNow =
          pv.step === "GearAndCardsStep" &&
          curViewer !== null &&
          !mySeat.hasPlanned &&
          mySeat.finishRank === null;

        // --- ROW 1 (TOP): 7-CARD HAND TRAY (LEFT/CENTER) + INTERACTIVE ACTION CONSOLE (RIGHT) ---
        const consoleW = Math.min(280, Math.max(210, Math.round(width * 0.25)));
        const consoleX = width - consoleW - 16;
        const consoleY = handBarY + 8;
        const consoleH = handRowH - 16;

        drawRoundedRect(ctx, consoleX, consoleY, consoleW, consoleH, 12);
        ctx.fillStyle = "#0f172a";
        ctx.fill();
        ctx.strokeStyle = "rgba(245, 158, 11, 0.38)";
        ctx.lineWidth = 1.3;
        ctx.stroke();

        const playableInHand = pv.myHand.filter((c) => c.kind !== "heat");
        const requiredCount = Math.min(curGear, playableInHand.length);

        const drawCanvasButton = (
          id: string,
          bx: number,
          by: number,
          bw: number,
          bh: number,
          label: string,
          bgHex: string,
          textHex: string,
          borderHex: string,
          enabled: boolean,
          data: Record<string, any>
        ) => {
          const hovered = hoveredIdRef.current === id;
          if (enabled && !curBusy) {
            newHitRegions.push({
              id,
              shape: "rect",
              x: bx,
              y: by,
              width: bw,
              height: bh,
              cursor: "pointer",
              data,
            });
          }
          drawRoundedRect(ctx, bx, by, bw, bh, 8);
          ctx.fillStyle = enabled ? bgHex : "rgba(30, 41, 59, 0.5)";
          ctx.fill();
          ctx.strokeStyle =
            enabled && hovered ? "#ffffff" : enabled ? borderHex : "#334155";
          ctx.lineWidth = enabled && hovered ? 2 : 1.2;
          ctx.stroke();

          ctx.fillStyle = enabled ? textHex : "#64748b";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = `800 11px ${fonts.sans}`;
          ctx.fillText(label, bx + bw * 0.5, by + bh * 0.5, bw - 12);
        };

        if (pv.step === "GearAndCardsStep") {
          ctx.fillStyle = "#fde047";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = `800 11px ${fonts.sans}`;
          ctx.fillText(
            `⚙️ BƯỚC 1–2: SANG SỐ & ĐÁNH BÀI`,
            consoleX + consoleW * 0.5,
            consoleY + 18,
            consoleW - 14
          );

          if (mySeat.hasPlanned) {
            ctx.fillStyle = "#4ade80";
            ctx.font = `800 11.5px ${fonts.sans}`;
            ctx.fillText(
              "✓ Đã chốt Số & bài úp!",
              consoleX + consoleW * 0.5,
              consoleY + consoleH * 0.46
            );
            ctx.fillStyle = "#94a3b8";
            ctx.font = `600 10px ${fonts.sans}`;
            ctx.fillText(
              "Đang chờ các tay đua khác...",
              consoleX + consoleW * 0.5,
              consoleY + consoleH * 0.62
            );
          } else {
            const gW = Math.floor((consoleW - 26) / 4);
            ([1, 2, 3, 4] as const).forEach((g, idx) => {
              const diff = Math.abs(g - mySeat.gear);
              const legal =
                diff <= 1 || (diff === 2 && mySeat.engineHeatCount >= 1);
              const gx = consoleX + 10 + idx * (gW + 2);
              drawCanvasButton(
                `console-gear-${g}`,
                gx,
                consoleY + 32,
                gW,
                28,
                diff === 2 ? `Số ${g}🔥` : `Số ${g}`,
                curGear === g ? "#f59e0b" : "#1e293b",
                curGear === g ? "#090d16" : "#f8fafc",
                curGear === g ? "#fef08a" : "#475569",
                canPlanNow && legal,
                { type: "select_gear", gear: g }
              );
            });

            ctx.fillStyle = "#cbd5e1";
            ctx.font = `700 10.5px ${fonts.sans}`;
            ctx.fillText(
              `Đã chọn ${curSelectedCards.length}/${requiredCount} lá cho Số ${curGear}`,
              consoleX + consoleW * 0.5,
              consoleY + 78
            );

            const readyToConfirm =
              canPlanNow && curSelectedCards.length === requiredCount;
            drawCanvasButton(
              "btn-confirm-plan",
              consoleX + 10,
              consoleY + consoleH - 46,
              consoleW - 20,
              36,
              `🔥 XÁC NHẬN SỐ ${curGear} & ĐÁNH BÀI`,
              "#f59e0b",
              "#090d16",
              "#fef08a",
              readyToConfirm,
              { type: "confirm_plan" }
            );
          }
        } else if (pv.step === "ReactAndSlipstreamStep") {
          const actSeat = pv.seats.find((s) => s.seatNo === pv.activeSeatNo);
          ctx.fillStyle = isMyReactTurn ? "#4ade80" : "#fde047";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = `800 11px ${fonts.sans}`;
          ctx.fillText(
            isMyReactTurn
              ? `🏎️ LƯỢT CỦA BẠN (TỐC ĐỘ ${actSeat?.turnSpeed ?? 0})`
              : `⏳ LƯỢT: ${actSeat?.displayName ?? "..."}`,
            consoleX + consoleW * 0.5,
            consoleY + 15,
            consoleW - 14
          );

          const cornerNote =
            pv.crossedCornersPreview.length === 0
              ? "✓ Chưa qua vạch cua nào"
              : pv.crossedCornersPreview.some((c) => c.willSpinOut)
                ? "💥 QUÁ TỐC: SẼ VĂNG XE!"
                : pv.crossedCornersPreview.some((c) => c.excessSpeed > 0)
                  ? `🔥 Qua cua tốn ${pv.crossedCornersPreview.reduce((s, c) => s + c.excessSpeed, 0)} Heat`
                  : "🟢 Ôm cua an toàn (0 Heat)";
          ctx.fillStyle = "#cbd5e1";
          ctx.font = `700 9.5px ${fonts.sans}`;
          ctx.fillText(
            cornerNote,
            consoleX + consoleW * 0.5,
            consoleY + 30,
            consoleW - 12
          );

          if (isMyReactTurn) {
            let btnY = consoleY + 40;
            const btnH = 24;
            const gap = 3;

            if (pv.canCooldown) {
              drawCanvasButton(
                "btn-cooldown",
                consoleX + 10,
                btnY,
                consoleW - 20,
                btnH,
                `❄️ Làm Mát: Cất 1 Heat (Còn ${actSeat?.cooldownRemaining ?? 0})`,
                "#0284c7",
                "#f0f9ff",
                "#38bdf8",
                true,
                { type: "cmd_cooldown" }
              );
              btnY += btnH + gap;
            }

            if (pv.canSlipstream) {
              drawCanvasButton(
                "btn-slipstream",
                consoleX + 10,
                btnY,
                consoleW - 20,
                btnH,
                "💨 Núp Gió: +2 Ô Miễn Phí",
                "#0ea5e9",
                "#090d16",
                "#bae6fd",
                true,
                { type: "cmd_slipstream" }
              );
              btnY += btnH + gap;
            }

            if (pv.canBoost) {
              drawCanvasButton(
                "btn-boost",
                consoleX + 10,
                btnY,
                consoleW - 20,
                btnH,
                "🚀 Boost: Đốt 1 Heat (+1..4 Ô)",
                "#ea580c",
                "#fff7ed",
                "#fb923c",
                true,
                { type: "cmd_boost" }
              );
              btnY += btnH + gap;
            }

            if (pv.canAdrenalineSpeed) {
              drawCanvasButton(
                "btn-adrenaline",
                consoleX + 10,
                btnY,
                consoleW - 20,
                btnH,
                "⚡ Adrenaline: +1 Ô Tốc Độ",
                "#ca8a04",
                "#fefce8",
                "#fde047",
                true,
                { type: "cmd_adrenaline" }
              );
              btnY += btnH + gap;
            }

            drawCanvasButton(
              "btn-end-turn",
              consoleX + 10,
              consoleY + consoleH - 34,
              consoleW - 20,
              28,
              curDiscardCards.length > 0
                ? `🏁 KẾT THÚC & BỎ ${curDiscardCards.length} LÁ`
                : "🏁 KẾT THÚC LƯỢT & RÚT BÀI",
              "#10b981",
              "#090d16",
              "#6ee7b7",
              true,
              { type: "cmd_end_turn" }
            );
          }
        } else if (pv.step === "Finished") {
          ctx.fillStyle = "#fde047";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = `800 11.5px ${fonts.sans}`;
          ctx.fillText(
            "🏆 KẾT THÚC CHẶNG ĐUA!",
            consoleX + consoleW * 0.5,
            consoleY + 24
          );
          ctx.fillStyle = "#e2e8f0";
          ctx.font = `700 10px ${fonts.sans}`;
          ctx.fillText(
            pv.winReasonVi ?? "",
            consoleX + consoleW * 0.5,
            consoleY + 54,
            consoleW - 18
          );
          if (curIsHost) {
            drawCanvasButton(
              "btn-rematch",
              consoleX + 10,
              consoleY + consoleH - 42,
              consoleW - 20,
              32,
              "🔁 ĐUA CHẶNG MỚI (VỀ SẢNH)",
              "#f59e0b",
              "#090d16",
              "#fef08a",
              true,
              { type: "rematch" }
            );
          }
        }

        // 7-Card Hand Tray on the Left/Center of Row 1 (directly ABOVE the Player Mat!)
        const handLeft = 20;
        const handRight = consoleX - 16;
        const handAvailW = Math.max(200, handRight - handLeft);
        const handCards = pv.myHand;
        const cCount = Math.max(1, handCards.length);
        const cardH = Math.min(handRowH - 22, 160);
        const cardW = Math.round(cardH * 0.65);
        const stepX =
          cCount > 1
            ? Math.min(
                cardW + 12,
                Math.floor((handAvailW - cardW) / (cCount - 1))
              )
            : cardW;
        const totalRowW = cardW + (cCount - 1) * stepX;
        const startCardX = Math.round(
          handLeft + (handAvailW - totalRowW) * 0.5
        );

        handCards.forEach((card, idx) => {
          const isSelectedPlan = curSelectedCards.includes(card.id);
          const isSelectedDiscard = curDiscardCards.includes(card.id);
          const isCooldownClickable =
            isMyReactTurn &&
            mySeat.cooldownRemaining > 0 &&
            card.kind === "heat";
          const isDiscardClickable =
            isMyReactTurn &&
            card.kind !== "heat" &&
            card.kind !== "stress";
          const isPlanClickable = canPlanNow && card.kind !== "heat";

          const regionId = `hand-card-${card.id}`;
          const hovered = hoveredIdRef.current === regionId;
          const liftY =
            isSelectedPlan || isSelectedDiscard
              ? -10
              : hovered
                ? -5
                : 0;
          const cx = startCardX + idx * stepX;
          const cy = handBarY + Math.round((handRowH - cardH) * 0.5) + liftY;

          if (isPlanClickable) {
            newHitRegions.push({
              id: regionId,
              shape: "rect",
              x: cx,
              y: cy,
              width: cardW,
              height: cardH,
              cursor: "pointer",
              data: { type: "toggle_plan_card", cardId: card.id },
            });
          } else if (isCooldownClickable) {
            newHitRegions.push({
              id: regionId,
              shape: "rect",
              x: cx,
              y: cy,
              width: cardW,
              height: cardH,
              cursor: "pointer",
              data: { type: "cooldown_card", cardId: card.id },
            });
          } else if (isDiscardClickable) {
            newHitRegions.push({
              id: regionId,
              shape: "rect",
              x: cx,
              y: cy,
              width: cardW,
              height: cardH,
              cursor: "pointer",
              data: { type: "toggle_discard_card", cardId: card.id },
            });
          }

          drawHeatCard2D(ctx, cx, cy, cardW, cardH, card, {
            colorId: mySeat.colorId,
            selected: isSelectedPlan,
            hovered,
            cooldownBadge: isCooldownClickable,
            discardBadge: isSelectedDiscard,
          });
        });

        // --- ROW 2 (BELOW THE CARDS): GIANT OFFICIAL PLAYER MAT ---
        const matImg = getHeatPlayerMatImage();
        let matH = matRowH - 16;
        let matW = Math.round(matH * HEAT_MAT_LAYOUT.aspectRatio);
        if (matW > width - 36) {
          matW = width - 36;
          matH = Math.round(matW / HEAT_MAT_LAYOUT.aspectRatio);
        }
        const matX = Math.round((width - matW) * 0.5);
        const matY = matBarY + Math.round((matRowH - matH) * 0.5);

        ctx.save();
        drawRoundedRect(ctx, matX - 3, matY - 3, matW + 6, matH + 6, 14);
        ctx.fillStyle = "#090d16";
        ctx.fill();
        ctx.strokeStyle = myColorSpec.primaryHex;
        ctx.lineWidth = 2.6;
        ctx.stroke();

        drawRoundedRect(ctx, matX, matY, matW, matH, 12);
        ctx.clip();

        if (matImg) {
          ctx.drawImage(matImg, matX, matY, matW, matH);
        } else {
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(matX, matY, matW, matH);
        }

        // Highlight active step gauge(s) on top curved dashboard arc!
        const activeGauges =
          pv.step === "GearAndCardsStep"
            ? [HEAT_MAT_LAYOUT.gauges.step1, HEAT_MAT_LAYOUT.gauges.step2]
            : [
                HEAT_MAT_LAYOUT.gauges.step3,
                HEAT_MAT_LAYOUT.gauges.step5,
                HEAT_MAT_LAYOUT.gauges.step6,
                HEAT_MAT_LAYOUT.gauges.step7,
              ];
        const pulse = 0.65 + 0.35 * Math.sin(now / 220);
        for (const g of activeGauges) {
          const gx = matX + g.u * matW;
          const gy = matY + g.v * matH;
          const gr = g.r * matW;
          ctx.save();
          ctx.strokeStyle = `rgba(250, 204, 21, ${pulse})`;
          ctx.lineWidth = 3.2;
          ctx.shadowColor = "#facc15";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(gx, gy, gr, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // (A) Left Slot: Draw Deck
        const dSlot = HEAT_MAT_LAYOUT.drawSlot;
        const dsX = matX + dSlot.u * matW;
        const dsY = matY + dSlot.v * matH;
        const dsW = dSlot.uw * matW;
        const dsH = dSlot.vh * matH;
        if (mySeat.drawPileCount > 0) {
          drawHeatCard2D(
            ctx,
            dsX + dsW * 0.08,
            dsY + dsH * 0.05,
            dsW * 0.84,
            dsH * 0.8,
            null
          );
        }
        drawRoundedRect(ctx, dsX + 6, dsY + dsH - 24, dsW - 12, 20, 6);
        ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
        ctx.fill();
        ctx.fillStyle = "#f8fafc";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `800 11.5px ${fonts.mono}`;
        ctx.fillText(
          `🃏 BỘ BÀI RÚT: ${mySeat.drawPileCount} LÁ`,
          dsX + dsW * 0.5,
          dsY + dsH - 14
        );

        // (B) Center Slot: Engine Heat Pile
        const eSlot = HEAT_MAT_LAYOUT.engineSlot;
        const esX = matX + eSlot.u * matW;
        const esY = matY + eSlot.v * matH;
        const esW = eSlot.uw * matW;
        const esH = eSlot.vh * matH;
        if (mySeat.engineHeatCount > 0) {
          const stackCount = Math.min(5, mySeat.engineHeatCount);
          for (let i = 0; i < stackCount; i++) {
            drawHeatCard2D(
              ctx,
              esX + esW * 0.1 + i * 3,
              esY + esH * 0.05 - i * 2.5,
              esW * 0.78,
              esH * 0.78,
              {
                id: "engine-heat",
                kind: "heat",
                value: null,
                labelVi: `${mySeat.engineHeatCount} HEAT`,
              }
            );
          }
        }
        drawRoundedRect(ctx, esX + 6, esY + esH - 24, esW - 12, 20, 6);
        ctx.fillStyle =
          mySeat.engineHeatCount > 0
            ? "rgba(127, 29, 29, 0.94)"
            : "rgba(15, 23, 42, 0.9)";
        ctx.fill();
        ctx.fillStyle = mySeat.engineHeatCount > 0 ? "#fecaca" : "#94a3b8";
        ctx.font = `900 11.5px ${fonts.mono}`;
        ctx.fillText(
          `🔥 ĐỘNG CƠ: ${mySeat.engineHeatCount} HEAT`,
          esX + esW * 0.5,
          esY + esH - 14
        );

        // (C) Right Slot: Discard Pile
        const cSlot = HEAT_MAT_LAYOUT.discardSlot;
        const csX = matX + cSlot.u * matW;
        const csY = matY + cSlot.v * matH;
        const csW = cSlot.uw * matW;
        const csH = cSlot.vh * matH;
        if (mySeat.discardTopCard) {
          drawHeatCard2D(
            ctx,
            csX + csW * 0.08,
            csY + csH * 0.05,
            csW * 0.84,
            csH * 0.8,
            mySeat.discardTopCard,
            { colorId: mySeat.colorId }
          );
        }
        drawRoundedRect(ctx, csX + 6, csY + csH - 24, csW - 12, 20, 6);
        ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
        ctx.fill();
        ctx.fillStyle = "#cbd5e1";
        ctx.font = `800 11.5px ${fonts.mono}`;
        ctx.fillText(
          `🗑️ CHỒNG BÀI BỎ: ${mySeat.discardPileCount} LÁ`,
          csX + csW * 0.5,
          csY + csH - 14
        );

        // (D) Far-Right Vertical 4-Gear Shifter Track (Gears 4, 3, 2, 1)
        ([1, 2, 3, 4] as const).forEach((g) => {
          const gSpec = HEAT_MAT_LAYOUT.gears[g];
          const gx = matX + gSpec.u * matW;
          const gy = matY + gSpec.v * matH;
          const gr = Math.max(18, gSpec.r * matW);
          const diff = Math.abs(g - mySeat.gear);
          const legal =
            diff <= 1 || (diff === 2 && mySeat.engineHeatCount >= 1);
          const regionId = `gear-btn-${g}`;

          if (canPlanNow && legal) {
            newHitRegions.push({
              id: regionId,
              shape: "circle",
              x: gx,
              y: gy,
              radius: gr * 1.18,
              cursor: "pointer",
              data: { type: "select_gear", gear: g },
            });
          }

          if (canPlanNow && legal) {
            ctx.save();
            ctx.strokeStyle =
              curGear === g
                ? "#fde047"
                : diff === 2
                  ? "rgba(249, 115, 22, 0.85)"
                  : "rgba(56, 189, 248, 0.75)";
            ctx.lineWidth = curGear === g ? 3.5 : 2.2;
            ctx.beginPath();
            ctx.arc(gx, gy, gr, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          if (canPlanNow && mySeat.gear === g && curGear !== g) {
            ctx.save();
            ctx.globalAlpha = 0.42;
            drawGearPawn2D(
              ctx,
              gx,
              gy,
              gr * 0.9,
              myColorSpec.primaryHex,
              g,
              false
            );
            ctx.restore();
          }

          const activePawnHere = canPlanNow
            ? curGear === g
            : mySeat.gear === g;
          if (activePawnHere) {
            drawGearPawn2D(
              ctx,
              gx,
              gy,
              gr * 0.95,
              myColorSpec.primaryHex,
              g,
              canPlanNow && curGear !== mySeat.gear
            );
          }
        });

        ctx.restore(); // End Player Mat clip
      }

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

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e);
    if (!pt) return;
    const hit = findHitRegionAtPoint(hitRegionsRef.current, pt.x, pt.y);
    hoveredIdRef.current = hit ? hit.id : null;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = hit?.cursor ?? "default";
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e);
    if (!pt) return;
    const hit = findHitRegionAtPoint(hitRegionsRef.current, pt.x, pt.y);
    if (!hit || !hit.data) return;

    const d = hit.data;
    const s = stateRef.current;
    if (d.type === "select_gear") {
      s.onSelectGear(d.gear);
    } else if (d.type === "toggle_plan_card") {
      s.onToggleCard(d.cardId);
    } else if (d.type === "cooldown_card") {
      s.onDispatchCommand({
        type: "USE_COOLDOWN",
        cardId: d.cardId,
      });
    } else if (d.type === "toggle_discard_card") {
      s.onToggleDiscardCard(d.cardId);
    } else if (d.type === "confirm_plan") {
      s.onDispatchCommand({
        type: "PLAN_TURN",
        targetGear: s.selectedGear,
        cardIds: s.selectedCardIds,
      });
    } else if (d.type === "cmd_cooldown") {
      s.onDispatchCommand({ type: "USE_COOLDOWN" });
    } else if (d.type === "cmd_slipstream") {
      s.onDispatchCommand({ type: "USE_SLIPSTREAM" });
    } else if (d.type === "cmd_boost") {
      s.onDispatchCommand({ type: "USE_BOOST" });
    } else if (d.type === "cmd_adrenaline") {
      s.onDispatchCommand({ type: "USE_ADRENALINE_SPEED" });
    } else if (d.type === "cmd_end_turn") {
      s.onDispatchCommand({
        type: "END_TURN",
        discardCardIds: s.discardCardIds,
      });
    } else if (d.type === "rematch") {
      s.onRematch?.();
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        className="w-full h-full block touch-none select-none"
      />
    </div>
  );
}
