"use client";

import React, { useEffect, useRef } from "react";
import {
  drawRoundedRect,
  findHitRegionAtPoint,
  ParticleSystem,
  type HitRegion,
} from "@/canvas/engine";
import {
  drawAirportWindowSlice,
  drawAltitudeWindowSlice,
  drawArcPointerMarker,
  drawAxisHorizonDial,
  drawCelShadedCopilotScreen,
  drawCelShadedPilotScreen,
  drawCockpitBackground,
  drawCockpitSwitchOverlay,
  drawCoffeeToken,
  drawFuelModuleStrip,
  drawFullAirportStrip,
  drawFullAltitudeStrip,
  drawInternModuleBar,
  drawRerollToken,
  drawSkyTeamDie,
  drawWindModuleWidget,
  getSkyTeamBoardImage,
} from "@/canvas/sky-team-art";
import { playSkyTeamSfx } from "@/canvas/sky-team-fx";
import {
  canPlaceDieOnSlot,
  findBestCoffeeDeltaForSlot,
  SKY_TEAM_AIRPORTS,
  type SkyTeamAirportId,
  type SkyTeamCommand,
  type SkyTeamPlayerView,
  type SkyTeamSlotId,
} from "@/cartridges/sky-team";
import type { LobbySeatItem } from "@/components/werewolf-canvas";

export interface SkyTeamCanvasProps {
  mode: "lobby" | "match";
  lobbySeats: LobbySeatItem[];
  lobbyAirportId: SkyTeamAirportId;
  lobbySwapRoles: boolean;
  isHost?: boolean;
  viewerSeatNo: number | null;
  playerView: SkyTeamPlayerView | null;
  selectedDieIndex: number | null;
  rerollMode: boolean;
  rerollSelectedIndices: number[];
  soundEnabled?: boolean;
  onSelectDie: (dieIndex: number | null) => void;
  onToggleRerollDie: (dieIndex: number) => void;
  onStartRerollMode?: () => void;
  onCancelRerollMode?: () => void;
  onConfirmReroll?: () => void;
  onRematch?: () => void;
  onSwapRoles?: () => void;
  onDispatchCommand: (cmd: SkyTeamCommand) => void;
}

export function SkyTeamCanvas({
  mode,
  lobbySeats,
  lobbyAirportId,
  lobbySwapRoles,
  isHost = false,
  viewerSeatNo,
  playerView,
  selectedDieIndex,
  rerollMode,
  rerollSelectedIndices,
  soundEnabled = true,
  onSelectDie,
  onToggleRerollDie,
  onStartRerollMode,
  onCancelRerollMode,
  onConfirmReroll,
  onRematch,
  onSwapRoles,
  onDispatchCommand,
}: SkyTeamCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hitRegionsRef = useRef<HitRegion[]>([]);
  const hoveredIdRef = useRef<string | null>(null);
  const particlesRef = useRef<ParticleSystem>(new ParticleSystem());
  const smoothAxisRef = useRef<number>(0);
  const smoothPosRef = useRef<number>(0);
  const smoothAltRef = useRef<number>(6);
  const smoothBlueRef = useRef<number>(4);
  const smoothOrangeRef = useRef<number>(8);
  const smoothBrakeRef = useRef<number>(0);
  const smoothWindRef = useRef<number>(0);
  const smoothFuelRef = useRef<number>(20);
  const smoothSwitchesRef = useRef<Record<string, number>>({});
  const slotPopMsRef = useRef<Partial<Record<SkyTeamSlotId, number>>>({});
  const prevPlacementsRef = useRef<Partial<Record<SkyTeamSlotId, boolean>>>({});
  const floatingFxRef = useRef<
    Array<{
      text: string;
      color: string;
      startMs: number;
      durMs: number;
      nx: number;
      ny: number;
    }>
  >([]);
  const shakeStartMsRef = useRef<number>(0);
  const lastActionSeqRef = useRef<number>(0);
  const rollStartMsRef = useRef<number>(0);
  const rollSeedRef = useRef<number>(1);
  const rollingTargetRef = useRef<"all" | "pilot" | "copilot" | null>(null);

  const propsRef = useRef({
    mode,
    lobbySeats,
    lobbyAirportId,
    lobbySwapRoles,
    isHost,
    viewerSeatNo,
    playerView,
    selectedDieIndex,
    rerollMode,
    rerollSelectedIndices,
    soundEnabled,
    onSelectDie,
    onToggleRerollDie,
    onStartRerollMode,
    onCancelRerollMode,
    onConfirmReroll,
    onRematch,
    onSwapRoles,
    onDispatchCommand,
  });

  useEffect(() => {
    propsRef.current = {
      mode,
      lobbySeats,
      lobbyAirportId,
      lobbySwapRoles,
      isHost,
      viewerSeatNo,
      playerView,
      selectedDieIndex,
      rerollMode,
      rerollSelectedIndices,
      soundEnabled,
      onSelectDie,
      onToggleRerollDie,
      onStartRerollMode,
      onCancelRerollMode,
      onConfirmReroll,
      onRematch,
      onSwapRoles,
      onDispatchCommand,
    };
  });

  // Trigger SFX, pop-ins, floating callouts, screen shake & particles on state updates
  useEffect(() => {
    if (!playerView) return;
    if (playerView.actionSeq === lastActionSeqRef.current) return;
    lastActionSeqRef.current = playerView.actionSeq;

    const nowMs = performance.now();
    const pushFloat = (text: string, color: string, nx = 0.5, ny = 0.42) => {
      floatingFxRef.current.push({
        text,
        color,
        startMs: nowMs,
        durMs: 1350,
        nx,
        ny,
      });
      if (floatingFxRef.current.length > 8) {
        floatingFxRef.current.shift();
      }
    };

    // Detect newly placed dice for elastic pop-in animation
    const prevMap = prevPlacementsRef.current;
    const nextMap: Partial<Record<SkyTeamSlotId, boolean>> = {};
    (Object.keys(playerView.roundPlacements) as SkyTeamSlotId[]).forEach(
      (sid) => {
        if (playerView.roundPlacements[sid]) {
          nextMap[sid] = true;
          if (!prevMap[sid]) {
            slotPopMsRef.current[sid] = nowMs;
          }
        }
      }
    );
    prevPlacementsRef.current = nextMap;

    const msg = playerView.lastActionSummaryVi;

    if (playerView.step === "MatchOver") {
      const spawnBurst = (color: string, count: number, speed: number) => {
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count + (i % 3) * 0.15;
          const mag = speed * (0.45 + ((i * 17) % 10) * 0.06);
          particlesRef.current.spawn({
            x: 400,
            y: 260,
            vx: Math.cos(angle) * mag,
            vy: Math.sin(angle) * mag,
            radius: 3 + (i % 3),
            color,
            life: 0.9,
            maxLife: 0.9,
          });
        }
      };
      if (playerView.outcome === "victory") {
        playSkyTeamSfx("victory", soundEnabled);
        spawnBurst("#4ade80", 30, 160);
        spawnBurst("#38bdf8", 22, 140);
        pushFloat("🛬 HẠ CÁNH AN TOÀN!", "#4ade80", 0.5, 0.35);
      } else {
        playSkyTeamSfx("crash", soundEnabled);
        shakeStartMsRef.current = nowMs;
        spawnBurst("#ef4444", 32, 170);
        pushFloat("💥 SỰ CỐ HẠ CÁNH!", "#f87171", 0.5, 0.35);
      }
    } else if (msg.includes("Đã tung xúc xắc")) {
      playSkyTeamSfx("dice_roll", soundEnabled);
      rollStartMsRef.current = nowMs;
      rollSeedRef.current =
        (rollSeedRef.current * 1664525 + playerView.actionSeq + 1013904223) >>>
        0;
      rollingTargetRef.current = "all";
      pushFloat(`🎲 VÒNG ${playerView.roundNumber} • TUNG XÚC XẮC!`, "#fde047", 0.5, 0.36);
    } else if (msg.includes("dùng 1 token Tung Lại")) {
      playSkyTeamSfx("dice_roll", soundEnabled);
      rollStartMsRef.current = nowMs;
      rollSeedRef.current =
        (rollSeedRef.current * 1664525 + playerView.actionSeq + 1013904223) >>>
        0;
      const activeObj = playerView.seats.find(
        (s) => s.seatNo === playerView.activeSeatNo
      );
      rollingTargetRef.current = activeObj?.role ?? "all";
      pushFloat("🎲 TUNG LẠI XÚC XẮC!", "#38bdf8", 0.5, 0.4);
    } else if (msg.includes("Hạ độ cao xuống")) {
      playSkyTeamSfx("engine_hum", soundEnabled);
      pushFloat(
        playerView.altitude === 0
          ? "🛬 0 FT — VÒNG HẠ CÁNH!"
          : `📉 HẠ ĐỘ CAO → ${playerView.altitude * 1000} FT`,
        playerView.altitude === 0 ? "#4ade80" : "#fde047",
        0.5,
        0.32
      );
    } else if (msg.includes("dọn 1 máy bay")) {
      playSkyTeamSfx("radio_beep", soundEnabled);
      pushFloat("📡 DỌN -1 MÁY BAY!", "#7dd3fc", 0.42, 0.22);
    } else if (msg.includes("☕")) {
      playSkyTeamSfx("coffee_sip", soundEnabled);
      pushFloat("☕ +1 CÀ PHÊ!", "#fbbf24", 0.5, 0.78);
    } else if (msg.includes("ngưỡng tốc độ Xanh")) {
      playSkyTeamSfx("switch_flip", soundEnabled);
      pushFloat(`✓ CÀNG HẠ CÁNH • XANH → ${playerView.blueMarker}`, "#4ade80", 0.36, 0.48);
    } else if (msg.includes("ngưỡng tốc độ Cam")) {
      playSkyTeamSfx("switch_flip", soundEnabled);
      pushFloat(`✓ CÁNH TÀ • CAM → ${playerView.orangeMarker}`, "#fb923c", 0.64, 0.48);
    } else if (msg.includes("lực Phanh")) {
      playSkyTeamSfx("switch_flip", soundEnabled);
      pushFloat(`✓ PHANH → ${playerView.brakeLevel}`, "#f87171", 0.5, 0.68);
    } else if (msg.includes("Thực Tập Sinh")) {
      playSkyTeamSfx("switch_flip", soundEnabled);
      pushFloat("🎓 HUẤN LUYỆN THỰC TẬP SINH ✓", "#86efac", 0.5, 0.85);
    } else if (msg.includes("Động cơ tổng")) {
      playSkyTeamSfx("engine_hum", soundEnabled);
      pushFloat("⚡ ĐỘNG CƠ KÍCH HOẠT!", "#fde047", 0.5, 0.52);
    } else {
      playSkyTeamSfx("place_die", soundEnabled);
    }

    // Subtle cockpit tremor if plane tilts dangerously to ±2
    if (Math.abs(playerView.axis) >= 2 && playerView.step !== "MatchOver") {
      shakeStartMsRef.current = nowMs;
    }
  }, [playerView, soundEnabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(320, Math.floor(rect.height));
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const p = propsRef.current;
      const regions: HitRegion[] = [];

      if (p.mode === "lobby" || !p.playerView) {
        drawLobbyScene(
          ctx,
          w,
          h,
          now,
          p.lobbySeats,
          p.lobbyAirportId,
          p.lobbySwapRoles,
          p.viewerSeatNo,
          p.isHost,
          hoveredIdRef.current,
          regions
        );
      } else {
        const view = p.playerView;
        const k = Math.min(1, dt * 8.5);
        smoothAxisRef.current += (view.axis - smoothAxisRef.current) * k;
        smoothPosRef.current += (view.approachPos - smoothPosRef.current) * k;
        smoothAltRef.current += (view.altitude - smoothAltRef.current) * k;
        smoothBlueRef.current += (view.blueMarker - smoothBlueRef.current) * k;
        smoothOrangeRef.current += (view.orangeMarker - smoothOrangeRef.current) * k;
        smoothBrakeRef.current += (view.brakeLevel - smoothBrakeRef.current) * k;
        smoothFuelRef.current += (view.fuelLevel - smoothFuelRef.current) * k;

        // Shortest-path angular interpolation for 20-step Wind ring
        let windDiff = view.windIndex - smoothWindRef.current;
        if (windDiff > 10) windDiff -= 20;
        if (windDiff < -10) windDiff += 20;
        smoothWindRef.current =
          (((smoothWindRef.current + windDiff * k) % 20) + 20) % 20;

        // Smooth 0..1 interpolation for all 10 sliding cockpit switches
        const swMap = smoothSwitchesRef.current;
        (Object.keys(view.switches) as (keyof SkyTeamPlayerView["switches"])[]).forEach(
          (key) => {
            const target = view.switches[key] ? 1 : 0;
            const prev = swMap[key] ?? target;
            swMap[key] = prev + (target - prev) * Math.min(1, dt * 11);
          }
        );

        // Optional cockpit tremor / shake on crash or ±2 tilt warning
        const shakeElapsed = now - shakeStartMsRef.current;
        if (shakeElapsed >= 0 && shakeElapsed < 360) {
          const decay = 1 - shakeElapsed / 360;
          const sxShake = Math.sin(shakeElapsed * 0.06) * 5 * decay;
          const syShake = Math.cos(shakeElapsed * 0.08) * 3.5 * decay;
          ctx.translate(sxShake, syShake);
        }

        drawMatchScene(
          ctx,
          w,
          h,
          now,
          view,
          p.isHost,
          smoothAxisRef.current,
          smoothPosRef.current,
          smoothAltRef.current,
          smoothBlueRef.current,
          smoothOrangeRef.current,
          smoothBrakeRef.current,
          smoothWindRef.current,
          smoothFuelRef.current,
          swMap,
          slotPopMsRef.current,
          rollStartMsRef.current,
          rollSeedRef.current,
          rollingTargetRef.current,
          p.selectedDieIndex,
          p.rerollMode,
          p.rerollSelectedIndices,
          hoveredIdRef.current,
          regions
        );

        // Render rising floating callout FX pills on top
        floatingFxRef.current = floatingFxRef.current.filter((fx) => {
          const age = now - fx.startMs;
          if (age < 0 || age > fx.durMs) return false;
          const t = age / fx.durMs;
          const alpha = t < 0.15 ? t / 0.15 : t > 0.72 ? (1 - t) / 0.28 : 1;
          const riseY = fx.ny * h - t * 44;
          const fxX = fx.nx * w;

          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
          ctx.font = "900 12.5px system-ui, sans-serif";
          const tw = ctx.measureText(fx.text).width + 24;
          drawRoundedRect(ctx, fxX - tw / 2, riseY - 14, tw, 28, 14);
          ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
          ctx.fill();
          ctx.lineWidth = 1.6;
          ctx.strokeStyle = fx.color;
          ctx.stroke();
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = fx.color;
          ctx.fillText(fx.text, fxX, riseY);
          ctx.restore();
          return true;
        });
      }

      particlesRef.current.update(dt);
      particlesRef.current.draw(ctx);

      hitRegionsRef.current = regions;
      ctx.restore();

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    const getLocalPoint = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const onPointerMove = (e: PointerEvent) => {
      const pt = getLocalPoint(e);
      const hit = findHitRegionAtPoint(hitRegionsRef.current, pt.x, pt.y);
      hoveredIdRef.current = hit ? hit.id : null;
      canvas.style.cursor = hit ? "pointer" : "default";
    };

    const onPointerDown = (e: PointerEvent) => {
      const pt = getLocalPoint(e);
      const hit = findHitRegionAtPoint(hitRegionsRef.current, pt.x, pt.y);
      if (!hit) return;

      const p = propsRef.current;
      if (hit.id === "lobby_swap_roles") {
        p.onSwapRoles?.();
        return;
      }
      if (hit.id === "btn_ready") {
        p.onDispatchCommand({ type: "READY_TO_ROLL" });
        return;
      }
      if (hit.id === "btn_reroll_start") {
        p.onStartRerollMode?.();
        return;
      }
      if (hit.id === "btn_reroll_confirm") {
        p.onConfirmReroll?.();
        return;
      }
      if (hit.id === "btn_reroll_cancel") {
        p.onCancelRerollMode?.();
        return;
      }
      if (hit.id === "btn_rematch") {
        p.onRematch?.();
        return;
      }

      if (hit.id.startsWith("my_die:")) {
        const idx = Number(hit.id.split(":")[1]);
        if (p.rerollMode) {
          p.onToggleRerollDie(idx);
        } else {
          p.onSelectDie(p.selectedDieIndex === idx ? null : idx);
        }
        return;
      }

      if (hit.id.startsWith("slot:")) {
        const slotId = hit.id.slice(5) as SkyTeamSlotId;
        const view = p.playerView;
        if (!view || p.selectedDieIndex === null || p.viewerSeatNo === null) return;
        const mySeat = view.seats.find((s) => s.seatNo === p.viewerSeatNo);
        if (!mySeat) return;
        const rawVal = mySeat.dice[p.selectedDieIndex];
        if (typeof rawVal !== "number") return;

        const delta = findBestCoffeeDeltaForSlot(
          rawVal,
          slotId,
          view.coffeeTokens
        );
        if (delta === null) return;

        p.onDispatchCommand({
          type: "PLACE_DIE",
          dieIndex: p.selectedDieIndex,
          slotId,
          coffeeDelta: delta,
        });
        p.onSelectDie(null);
      }
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl select-none">
      <canvas ref={canvasRef} className="w-full h-full block touch-none" />
    </div>
  );
}

function drawLobbyScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  now: number,
  lobbySeats: LobbySeatItem[],
  airportId: SkyTeamAirportId,
  swapRoles: boolean,
  viewerSeatNo: number | null,
  isHost: boolean,
  hoveredId: string | null,
  regions: HitRegion[]
) {
  drawCockpitBackground(ctx, w, h, 4, now);

  const airport = SKY_TEAM_AIRPORTS[airportId] ?? SKY_TEAM_AIRPORTS.montreal;
  const cx = w / 2;

  // Compact centered 2D cel-shaded Pilot (Left) & Co-pilot (Right) role cards
  const gap = Math.max(14, Math.min(26, w * 0.03));
  const maxCardW = Math.min(310, (w - 48 - gap) / 2);
  const maxCardH = Math.min(260, h * 0.56);
  // Keep natural ~5:4 sprite proportion
  const cardW = Math.max(150, Math.min(maxCardW, maxCardH * 1.24));
  const cardH = Math.max(130, Math.min(maxCardH, cardW / 1.24));

  const totalW = cardW * 2 + gap;
  const leftX = cx - totalW / 2;
  const rightX = leftX + cardW + gap;
  const topY = Math.max(66, (h - cardH) / 2 + 12);

  // High-contrast Title Pill above the cards (warm gold text on deep navy pill)
  const headerText = `CHỌN VAI TRÒ PHI HÀNH ĐOÀN • ${airport.code} (${airport.nameVi})`;
  ctx.font = "900 12px system-ui, sans-serif";
  const textW = ctx.measureText(headerText).width;
  const pillW = Math.min(w - 28, textW + 32);
  const pillH = 30;
  const pillX = cx - pillW / 2;
  const pillY = Math.max(16, topY - pillH - 18);

  drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 15);
  ctx.fillStyle = "rgba(15, 23, 42, 0.86)";
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(251, 191, 36, 0.7)";
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fde047";
  ctx.fillText(headerText, cx, pillY + pillH / 2);

  const pilotSeat = lobbySeats[swapRoles ? 1 : 0] ?? null;
  const copilotSeat = lobbySeats[swapRoles ? 0 : 1] ?? null;
  const swapHovered = hoveredId === "lobby_swap_roles";

  drawCelShadedPilotScreen(ctx, leftX, topY, cardW, cardH, now, {
    playerName: pilotSeat?.displayName ?? null,
    isViewer: pilotSeat !== null && pilotSeat.seatNo === viewerSeatNo,
    hovered: isHost && swapHovered,
    canSwap: isHost,
  });

  drawCelShadedCopilotScreen(ctx, rightX, topY, cardW, cardH, now, {
    playerName: copilotSeat?.displayName ?? null,
    isViewer: copilotSeat !== null && copilotSeat.seatNo === viewerSeatNo,
    hovered: isHost && swapHovered,
    canSwap: isHost,
  });

  // Central Swap Role Pill Button below the cards (Host clickable)
  if (isHost) {
    const swW = 126;
    const swH = 32;
    const swX = cx - swW / 2;
    const swY = Math.min(h - swH - 14, topY + cardH + 16);
    drawRoundedRect(ctx, swX, swY, swW, swH, 16);
    ctx.fillStyle = swapHovered ? "#fde047" : "rgba(15, 23, 42, 0.9)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = swapHovered ? "#ffffff" : "#fbbf24";
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = swapHovered ? "#0f172a" : "#fde047";
    ctx.font = "900 11.5px system-ui, sans-serif";
    ctx.fillText("⇄ ĐỔI VAI TRÒ", cx, swY + swH / 2);

    regions.push({
      id: "lobby_swap_roles",
      shape: "rect",
      x: leftX,
      y: topY,
      width: totalW,
      height: cardH,
    });
    regions.push({
      id: "lobby_swap_roles",
      shape: "rect",
      x: swX,
      y: swY,
      width: swW,
      height: swH,
    });
  }
}

const BOARD_ASPECT = 607 / 850;

/** Normalized (cx, cy) centers of the 20 base dice slots on sky-team-board.png */
const BOARD_SLOT_COORDS: Partial<Record<SkyTeamSlotId, { cx: number; cy: number }>> = {
  radio_pilot: { cx: 0.083, cy: 0.172 },
  axis_pilot: { cx: 0.240, cy: 0.187 },
  axis_copilot: { cx: 0.761, cy: 0.187 },
  radio_copilot_1: { cx: 0.919, cy: 0.066 },
  radio_copilot_2: { cx: 0.919, cy: 0.172 },
  gear_12: { cx: 0.083, cy: 0.398 },
  gear_34: { cx: 0.083, cy: 0.556 },
  gear_56: { cx: 0.083, cy: 0.715 },
  flap_12: { cx: 0.919, cy: 0.398 },
  flap_23: { cx: 0.919, cy: 0.556 },
  flap_45: { cx: 0.919, cy: 0.715 },
  flap_56: { cx: 0.919, cy: 0.876 },
  engine_pilot: { cx: 0.346, cy: 0.543 },
  engine_copilot: { cx: 0.656, cy: 0.543 },
  brake_2: { cx: 0.349, cy: 0.755 },
  brake_4: { cx: 0.501, cy: 0.755 },
  brake_6: { cx: 0.654, cy: 0.755 },
  coffee_1: { cx: 0.349, cy: 0.931 },
  coffee_2: { cx: 0.501, cy: 0.931 },
  coffee_3: { cx: 0.654, cy: 0.931 },
};

const BOARD_SWITCH_COORDS: Array<{
  key: keyof SkyTeamPlayerView["switches"];
  cx: number;
  cy: number;
}> = [
  { key: "gear_12", cx: 0.083, cy: 0.474 },
  { key: "gear_34", cx: 0.083, cy: 0.631 },
  { key: "gear_56", cx: 0.083, cy: 0.790 },
  { key: "flap_12", cx: 0.919, cy: 0.474 },
  { key: "flap_23", cx: 0.919, cy: 0.631 },
  { key: "flap_45", cx: 0.919, cy: 0.790 },
  { key: "flap_56", cx: 0.919, cy: 0.951 },
  { key: "brake_2", cx: 0.349, cy: 0.829 },
  { key: "brake_4", cx: 0.501, cy: 0.829 },
  { key: "brake_6", cx: 0.654, cy: 0.829 },
];

const COFFEE_HOLDER_COORDS: Array<{ cx: number; cy: number }> = [
  { cx: 0.120, cy: 0.874 },
  { cx: 0.120, cy: 0.944 },
  { cx: 0.222, cy: 0.944 },
];

/** Approximate normalized positions along the curved 2..12 speed arc */
const SPEED_ARC_MARKERS: Record<number, { cx: number; cy: number }> = {
  4: { cx: 0.317, cy: 0.439 },
  5: { cx: 0.382, cy: 0.468 },
  6: { cx: 0.456, cy: 0.483 },
  7: { cx: 0.542, cy: 0.483 },
  8: { cx: 0.618, cy: 0.468 },
  9: { cx: 0.684, cy: 0.439 },
  10: { cx: 0.736, cy: 0.395 },
  11: { cx: 0.770, cy: 0.336 },
  12: { cx: 0.786, cy: 0.275 },
};

/** Approximate normalized positions along the curved 2..6 brake arc */
const BRAKE_ARC_MARKERS: Record<number, { cx: number; cy: number }> = {
  0: { cx: 0.318, cy: 0.635 },
  2: { cx: 0.388, cy: 0.668 },
  4: { cx: 0.538, cy: 0.681 },
  6: { cx: 0.678, cy: 0.635 },
};

function interpolateArcCoord(
  table: Record<number, { cx: number; cy: number }>,
  val: number,
  keys: number[]
): { cx: number; cy: number } | undefined {
  if (keys.length === 0) return undefined;
  const clamped = Math.max(keys[0], Math.min(keys[keys.length - 1], val));
  for (let i = 0; i < keys.length - 1; i++) {
    const k0 = keys[i];
    const k1 = keys[i + 1];
    if (clamped >= k0 && clamped <= k1) {
      const t = k1 === k0 ? 0 : (clamped - k0) / (k1 - k0);
      const p0 = table[k0];
      const p1 = table[k1];
      return {
        cx: p0.cx + (p1.cx - p0.cx) * t,
        cy: p0.cy + (p1.cy - p0.cy) * t,
      };
    }
  }
  return table[keys[keys.length - 1]];
}

const SPEED_ARC_KEYS = [4, 5, 6, 7, 8, 9, 10, 11, 12];
const BRAKE_ARC_KEYS = [0, 2, 4, 6];

function drawMatchScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  now: number,
  view: SkyTeamPlayerView,
  isHost: boolean,
  smoothAxis: number,
  smoothPos: number,
  smoothAlt: number,
  smoothBlue: number,
  smoothOrange: number,
  smoothBrake: number,
  smoothWind: number,
  smoothFuel: number,
  smoothSwitches: Record<string, number>,
  slotPopMs: Partial<Record<SkyTeamSlotId, number>>,
  rollStartMs: number,
  rollSeed: number,
  rollingTarget: "all" | "pilot" | "copilot" | null,
  selectedDieIndex: number | null,
  rerollMode: boolean,
  rerollSelectedIndices: number[],
  hoveredId: string | null,
  regions: HitRegion[]
) {
  drawCockpitBackground(ctx, w, h, view.altitude, now);

  const pad = 10;
  const wideLayout = w >= 720;

  // Compute centered cockpit board rect (reserve sleek strip underneath if Intern Module enabled)
  const internGap = view.internEnabled ? 4 : 0;
  const internRatio = view.internEnabled ? 0.145 : 0;
  let boardH: number;
  let boardW: number;
  let boardX: number;
  let boardY: number;

  if (wideLayout) {
    const availH = Math.max(320, h - pad * 2 - internGap);
    boardH = availH / (1 + internRatio * BOARD_ASPECT);
    boardW = boardH * BOARD_ASPECT;
    const maxBoardW = w - 340;
    if (boardW > maxBoardW) {
      boardW = Math.max(260, maxBoardW);
      boardH = boardW / BOARD_ASPECT;
    }
    const totalCenterH = boardH + internGap + boardW * internRatio;
    boardX = (w - boardW) / 2;
    boardY = (h - totalCenterH) / 2;
  } else {
    const bottomTrayH = 90;
    const availH = Math.max(250, h - bottomTrayH - pad * 3 - internGap);
    boardH = availH / (1 + internRatio * BOARD_ASPECT);
    boardW = Math.min(w - pad * 2, boardH * BOARD_ASPECT);
    boardH = boardW / BOARD_ASPECT;
    boardX = (w - boardW) / 2;
    boardY = pad;
  }

  const bx = (nx: number) => boardX + nx * boardW;
  const by = (ny: number) => boardY + ny * boardH;

  // =========================================================================
  // 1. LIVE APPROACH & ALTITUDE WINDOWS (drawn right behind the top cutouts!)
  // =========================================================================
  // Left cutout: Sliding 2D Official Airport Strip inside Approach Window
  const appX = bx(0.175);
  const appY = by(0.0);
  const appW = boardW * 0.273;
  const appH = boardH * 0.118;
  const curTraffic = view.traffic[view.approachPos] ?? 0;

  drawAirportWindowSlice(
    ctx,
    appX,
    appY,
    appW,
    appH,
    view.airport.stripIndex,
    view.traffic.length,
    smoothPos,
    curTraffic,
    view.airport.code
  );

  // Right cutout: Official Sliding 2D Altitude Strip inside Altitude Window
  const altX = bx(0.552);
  const altY = by(0.0);
  const altW = boardW * 0.273;
  const altH = boardH * 0.118;
  const hardAltitudeStrip = !view.airport.rerollAltitudes.includes(2);

  drawAltitudeWindowSlice(
    ctx,
    altX,
    altY,
    altW,
    altH,
    smoothAlt,
    hardAltitudeStrip
  );

  // =========================================================================
  // 2. DRAW THE DETAILED 2D SKY TEAM COCKPIT BOARD SPRITE
  // =========================================================================
  const boardImg = getSkyTeamBoardImage();
  ctx.save();
  ctx.shadowColor = "rgba(2, 6, 23, 0.55)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 6;
  if (boardImg) {
    ctx.drawImage(boardImg, boardX, boardY, boardW, boardH);
  } else {
    drawRoundedRect(ctx, boardX, boardY, boardW, boardH, 16);
    ctx.fillStyle = "#94a3b8";
    ctx.fill();
  }
  ctx.restore();

  // =========================================================================
  // 3. LIVE COCKPIT INSTRUMENTS ON TOP OF THE BOARD
  // =========================================================================
  // 3A. Rotating Artificial Horizon Dial (center circle)
  drawAxisHorizonDial(
    ctx,
    bx(0.501),
    by(0.270),
    boardW * 0.178,
    smoothAxis
  );

  // 3B. Official Reroll Token inside top-left Reroll pocket (clickable when it's your turn!)
  if (view.rerollTokens > 0) {
    const rSize = boardW * 0.105;
    const rCx = bx(0.088);
    const rCy = by(0.068);
    drawRerollToken(ctx, rCx, rCy, rSize, view.rerollTokens);
    if (
      view.step === "PlacementStep" &&
      view.viewerSeatNo !== null &&
      view.activeSeatNo === view.viewerSeatNo &&
      !rerollMode
    ) {
      regions.push({
        id: "btn_reroll_start",
        shape: "rect",
        x: rCx - rSize / 2,
        y: rCy - rSize / 2,
        width: rSize,
        height: rSize,
      });
    }
  }

  // 3C. Official Pointer Markers (Blue & Orange on 2..12 Arc + Red on 2..6 Brake Arc)
  const dialCx = bx(0.501);
  const dialCy = by(0.270);
  const markerH = Math.max(15, boardW * 0.044);

  const drawArcMarker = (
    pos: { cx: number; cy: number } | undefined,
    kind: "blue" | "orange" | "red",
    centerRefX: number,
    centerRefY: number
  ) => {
    if (!pos) return;
    const mx = bx(pos.cx);
    const my = by(pos.cy);
    // Point marker arrow tangentially along the arc toward the right / higher numbers!
    const angleRad = Math.atan2(centerRefY - my, centerRefX - mx) + Math.PI / 2;
    drawArcPointerMarker(ctx, mx, my, markerH, kind, angleRad);
  };

  drawArcMarker(
    interpolateArcCoord(SPEED_ARC_MARKERS, smoothBlue, SPEED_ARC_KEYS),
    "blue",
    dialCx,
    dialCy
  );
  drawArcMarker(
    interpolateArcCoord(SPEED_ARC_MARKERS, smoothOrange, SPEED_ARC_KEYS),
    "orange",
    dialCx,
    dialCy
  );
  drawArcMarker(
    interpolateArcCoord(BRAKE_ARC_MARKERS, smoothBrake, BRAKE_ARC_KEYS),
    "red",
    bx(0.501),
    by(0.455)
  );

  // 3D. Live Sliding Toggle Switches (smooth 0..1 knob slide!)
  const swW = boardW * 0.105;
  const swH = boardH * 0.031;
  for (const sw of BOARD_SWITCH_COORDS) {
    const prog = smoothSwitches[sw.key] ?? (view.switches[sw.key] ? 1 : 0);
    drawCockpitSwitchOverlay(
      ctx,
      bx(sw.cx),
      by(sw.cy),
      swW,
      swH,
      prog
    );
  }

  // 3E. Live Coffee Tokens in the 3 ±1 cup holders
  for (let i = 0; i < view.coffeeTokens && i < COFFEE_HOLDER_COORDS.length; i++) {
    const pos = COFFEE_HOLDER_COORDS[i];
    drawCoffeeToken(ctx, bx(pos.cx), by(pos.cy), Math.max(10, boardW * 0.032));
  }

  // =========================================================================
  // 4. INTERACTIVE DICE SLOTS (Highlights + Placed Dice)
  // =========================================================================
  const mySeat =
    view.viewerSeatNo !== null
      ? view.seats.find((s) => s.seatNo === view.viewerSeatNo) ?? null
      : null;
  const isMyTurn =
    view.step === "PlacementStep" &&
    view.viewerSeatNo !== null &&
    view.activeSeatNo === view.viewerSeatNo;

  const getSlotHint = (
    slotId: SkyTeamSlotId
  ): { playable: boolean; coffeeDelta: number } => {
    if (!isMyTurn || selectedDieIndex === null || !mySeat) {
      return { playable: false, coffeeDelta: 0 };
    }
    const rawVal = mySeat.dice[selectedDieIndex];
    if (typeof rawVal !== "number") return { playable: false, coffeeDelta: 0 };
    const delta = findBestCoffeeDeltaForSlot(rawVal, slotId, view.coffeeTokens);
    if (delta === null) return { playable: false, coffeeDelta: 0 };
    const check = canPlaceDieOnSlot({
      state: {
        step: view.step,
        activeSeatNo: view.activeSeatNo,
        roundPlacements: view.roundPlacements,
        switches: view.switches,
        coffeeTokens: view.coffeeTokens,
        internEnabled: view.internEnabled,
        internTrained: view.internTrained,
        fuelEnabled: view.fuelEnabled,
        seats: view.seats.map((s) => ({
          seatNo: s.seatNo,
          actorId: s.actorId,
          displayName: s.displayName,
          role: s.role,
          dice: s.dice.filter((d): d is number => typeof d === "number"),
          readyForRoll: s.readyForRoll,
        })),
      },
      seatNo: mySeat.seatNo,
      dieIndex: selectedDieIndex,
      slotId,
      coffeeDelta: delta,
    });
    return { playable: check.valid, coffeeDelta: delta };
  };

  const slotSize = boardW * 0.105;

  const renderInteractiveSlot = (
    slotId: SkyTeamSlotId,
    sx: number,
    sy: number,
    size: number
  ) => {
    const placed = view.roundPlacements[slotId];
    const hint = getSlotHint(slotId);
    const hitId = `slot:${slotId}`;
    const isHovered = hoveredId === hitId;

    if (hint.playable) {
      const pulse = 0.35 + 0.2 * Math.sin(now * 0.009);
      ctx.save();
      drawRoundedRect(ctx, sx - 2, sy - 2, size + 4, size + 4, 8);
      ctx.fillStyle = isHovered
        ? "rgba(250, 204, 21, 0.55)"
        : `rgba(74, 222, 128, ${pulse})`;
      ctx.fill();
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = isHovered ? "#ffffff" : "#4ade80";
      ctx.stroke();
      ctx.restore();

      regions.push({
        id: hitId,
        shape: "rect",
        x: sx - 3,
        y: sy - 3,
        width: size + 6,
        height: size + 6,
      });

      if (hint.coffeeDelta !== 0) {
        const badge = `☕${hint.coffeeDelta > 0 ? `+${hint.coffeeDelta}` : hint.coffeeDelta}`;
        ctx.save();
        drawRoundedRect(ctx, sx + size - 26, sy - 8, 30, 14, 5);
        ctx.fillStyle = "#f59e0b";
        ctx.fill();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#0f172a";
        ctx.font = "900 8.5px system-ui, sans-serif";
        ctx.fillText(badge, sx + size - 11, sy - 1);
        ctx.restore();
      }
    }

    if (placed) {
      const popStart = slotPopMs[slotId] ?? 0;
      const popAge = now - popStart;
      if (popAge >= 0 && popAge < 320) {
        const pt = popAge / 320;
        // Elastic pop-in scale: 1.32 -> 0.96 -> 1.0
        const scale =
          pt < 0.55
            ? 1.32 - (pt / 0.55) * 0.36
            : 0.96 + ((pt - 0.55) / 0.45) * 0.04;
        const dcx = sx + size / 2;
        const dcy = sy + size / 2;
        ctx.save();
        ctx.translate(dcx, dcy);
        ctx.scale(scale, scale);
        drawSkyTeamDie(ctx, -size / 2, -size / 2, size, placed.value, placed.role, {
          modified: placed.coffeeUsed > 0,
        });
        ctx.restore();

        // Radiating placement shockwave ring
        ctx.save();
        ctx.globalAlpha = (1 - pt) * 0.85;
        ctx.strokeStyle = placed.role === "pilot" ? "#38bdf8" : "#fb923c";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(dcx, dcy, size * (0.5 + pt * 0.45), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        drawSkyTeamDie(ctx, sx, sy, size, placed.value, placed.role, {
          modified: placed.coffeeUsed > 0,
        });
      }
    }
  };

  (Object.keys(BOARD_SLOT_COORDS) as SkyTeamSlotId[]).forEach((slotId) => {
    const pos = BOARD_SLOT_COORDS[slotId];
    if (!pos) return;
    renderInteractiveSlot(
      slotId,
      bx(pos.cx) - slotSize / 2,
      by(pos.cy) - slotSize / 2,
      slotSize
    );
  });

  // 4B. Official Intern Module Bar clipped beneath the cockpit board (when enabled!)
  if (view.internEnabled) {
    const internBarH = boardW * internRatio;
    const internSlots = drawInternModuleBar(
      ctx,
      boardX,
      boardY + boardH + internGap,
      boardW,
      internBarH,
      view.internTrained
    );
    renderInteractiveSlot(
      "intern_pilot",
      internSlots.pilotSlot.x,
      internSlots.pilotSlot.y,
      internSlots.pilotSlot.size
    );
    renderInteractiveSlot(
      "intern_copilot",
      internSlots.copilotSlot.x,
      internSlots.copilotSlot.y,
      internSlots.copilotSlot.size
    );
  }

  // 4C. Official Kerosene Fuel Module Strip clipped to the LEFT edge of the cockpit board!
  if (view.fuelEnabled) {
    const fuelH = boardH * 0.62;
    const fuelW = fuelH * (169 / 633);
    const fuelX = Math.max(4, boardX - fuelW - 3);
    const fuelY = boardY + boardH * 0.36;
    const { fuelSlot } = drawFuelModuleStrip(
      ctx,
      fuelX,
      fuelY,
      fuelW,
      fuelH,
      smoothFuel
    );
    renderInteractiveSlot(
      "fuel_leak",
      fuelSlot.x,
      fuelSlot.y,
      fuelSlot.size
    );
  }

  // =========================================================================
  // 5. SIDE PANELS (WIDE) OR BOTTOM TRAYS (COMPACT): DICE & TRACK OVERVIEW
  // =========================================================================
  const pilotSeat = view.seats.find((s) => s.role === "pilot") ?? view.seats[0];
  const copilotSeat = view.seats.find((s) => s.role === "copilot") ?? view.seats[1];

  const drawSeatTray = (
    seat: SkyTeamPlayerView["seats"][number],
    tx: number,
    ty: number,
    tw: number,
    th: number,
    verticalDice: boolean
  ) => {
    const isPilot = seat.role === "pilot";
    const isViewer = seat.seatNo === view.viewerSeatNo;
    const isActive =
      view.step === "PlacementStep" && view.activeSeatNo === seat.seatNo;

    drawRoundedRect(ctx, tx, ty, tw, th, 14);
    ctx.fillStyle = isActive
      ? isPilot
        ? "rgba(2, 132, 199, 0.82)"
        : "rgba(194, 65, 12, 0.82)"
      : "rgba(15, 23, 42, 0.86)";
    ctx.fill();
    ctx.strokeStyle = isActive
      ? "#fde047"
      : isPilot
        ? "#38bdf8"
        : "#fb923c";
    ctx.lineWidth = isActive ? 2.5 : 1.5;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = isPilot ? "#bae6fd" : "#fed7aa";
    ctx.font = "900 10.5px system-ui, sans-serif";
    ctx.fillText(
      isPilot ? "👨‍✈️ CƠ TRƯỞNG" : "👩‍✈️ CƠ PHÓ",
      tx + tw / 2,
      ty + 15
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 12px system-ui, sans-serif";
    const nameStr = `${seat.displayName}${isViewer ? " (Bạn)" : ""}`;
    ctx.fillText(
      nameStr.length > 18 ? `${nameStr.slice(0, 17)}…` : nameStr,
      tx + tw / 2,
      ty + 31
    );

    if (isActive) {
      ctx.fillStyle = "#fde047";
      ctx.font = "900 9.5px system-ui, sans-serif";
      ctx.fillText("● TỚI LƯỢT ĐẶT", tx + tw / 2, ty + 45);
    }

    if (view.step === "BriefingStep") {
      ctx.fillStyle = seat.readyForRoll ? "#4ade80" : "#cbd5e1";
      ctx.font = "700 11px system-ui, sans-serif";
      ctx.fillText(
        seat.readyForRoll ? "✓ Đã sẵn sàng" : "Đang thảo luận...",
        tx + tw / 2,
        ty + th * 0.65
      );
      return;
    }

    if (seat.dice.length === 0) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "700 10.5px system-ui, sans-serif";
      ctx.fillText("Hết xúc xắc vòng này", tx + tw / 2, ty + th * 0.65);
      return;
    }

    const drawAnimatedTrayDie = (
      dx: number,
      dy: number,
      dieSize: number,
      val: number | null,
      idx: number
    ) => {
      const hitId = isViewer ? `my_die:${idx}` : `opp_die:${idx}`;
      const isSelected =
        isViewer &&
        (rerollMode
          ? rerollSelectedIndices.includes(idx)
          : selectedDieIndex === idx);

      const isRollingSeat =
        rollingTarget === "all" || rollingTarget === seat.role;
      const elapsed = isRollingSeat ? now - rollStartMs : 9999;
      const dieDur = 540 + idx * 75;
      const isRolling = elapsed >= 0 && elapsed < dieDur;

      if (isRolling) {
        const t = Math.min(1, elapsed / dieDur);
        const easeOut = 1 - Math.pow(1 - t, 3);
        // Parabolic multi-bounce hop + squash/stretch + fast spin settling to 0
        const hopY = -Math.abs(Math.sin(t * Math.PI * 2.5)) * (1 - t) * 20;
        const jitterX = Math.sin(t * Math.PI * 5 + idx * 2.1) * (1 - t) * 7;
        const spin =
          (1 - easeOut) * (idx % 2 === 0 ? 1 : -1) * Math.PI * 2.4;
        const scale = 1 + Math.sin(t * Math.PI * 3) * 0.14 * (1 - t);

        // Rapidly cycle visible faces while airborne, snap to real face at t >= 0.82
        const shownVal =
          val === null
            ? null
            : t < 0.82
              ? (((rollSeed + idx * 13 + Math.floor(elapsed / 55)) % 6) + 6) %
                  6 +
                1
              : val;

        const dcx = dx + dieSize / 2 + jitterX;
        const dcy = dy + dieSize / 2 + hopY;

        ctx.save();
        ctx.translate(dcx, dcy);
        ctx.rotate(spin);
        ctx.scale(scale, scale);
        drawSkyTeamDie(
          ctx,
          -dieSize / 2,
          -dieSize / 2,
          dieSize,
          shownVal,
          seat.role,
          { selected: false, hovered: false }
        );
        ctx.restore();

        // Crisp landing impact ring right as the die settles (0.82..1.0)
        if (t >= 0.82) {
          const lt = (t - 0.82) / 0.18;
          ctx.save();
          ctx.globalAlpha = (1 - lt) * 0.75;
          ctx.strokeStyle = isPilot ? "#7dd3fc" : "#fdba74";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(
            dx + dieSize / 2,
            dy + dieSize / 2,
            dieSize * (0.48 + lt * 0.34),
            0,
            Math.PI * 2
          );
          ctx.stroke();
          ctx.restore();
        }
        return;
      }

      drawSkyTeamDie(ctx, dx, dy, dieSize, val, seat.role, {
        selected: isSelected,
        hovered: hoveredId === hitId && isViewer && isActive,
      });
      if (isViewer && isActive && typeof val === "number") {
        regions.push({
          id: hitId,
          shape: "rect",
          x: dx,
          y: dy,
          width: dieSize,
          height: dieSize,
        });
      }
    };

    if (verticalDice) {
      // 2x2 grid for side column
      const dieSize = Math.min(48, (tw - 34) / 2);
      const gap = 10;
      const gridW = dieSize * 2 + gap;
      const startX = tx + (tw - gridW) / 2;
      const startY = ty + 58;
      seat.dice.forEach((val, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        drawAnimatedTrayDie(
          startX + col * (dieSize + gap),
          startY + row * (dieSize + gap),
          dieSize,
          val,
          idx
        );
      });
    } else {
      const dieSize = Math.min(38, (tw - 28) / 4);
      const gap = 6;
      const totalW =
        seat.dice.length * dieSize + Math.max(0, seat.dice.length - 1) * gap;
      const startX = tx + (tw - totalW) / 2;
      const dy = ty + th - dieSize - 8;
      seat.dice.forEach((val, idx) => {
        drawAnimatedTrayDie(startX + idx * (dieSize + gap), dy, dieSize, val, idx);
      });
    }
  };

  if (wideLayout) {
    const fuelExtra = view.fuelEnabled ? Math.round(boardH * 0.62 * (169 / 633)) + 8 : 0;
    const leftAvail = Math.max(130, boardX - fuelExtra - pad * 2);
    const rightAvail = Math.max(130, w - (boardX + boardW) - pad * 2);
    const sideW = Math.min(185, leftAvail, rightAvail);
    const trayH = 180;
    const leftX = Math.max(pad, boardX - fuelExtra - sideW - pad);
    const rightX = boardX + boardW + pad;

    // Left top: Full Official 2D Airport Strip (with R1..R6 & live traffic)
    const stripH = Math.min(h - trayH - pad * 3, 340);
    drawFullAirportStrip(
      ctx,
      leftX,
      pad,
      sideW,
      stripH,
      view.airport.stripIndex,
      view.traffic,
      view.approachPos
    );

    // Left bottom: Pilot Dice Tray
    drawSeatTray(pilotSeat, leftX, h - trayH - pad, sideW, trayH, true);

    // Right top: Official 2D Altitude Strip + Wind Module (if enabled!)
    if (view.windEnabled) {
      const windSize = Math.min(sideW, Math.max(106, stripH * 0.44));
      const altStripH = Math.max(120, stripH - windSize - 8);
      drawFullAltitudeStrip(
        ctx,
        rightX,
        pad,
        sideW,
        altStripH,
        smoothAlt,
        hardAltitudeStrip
      );
      drawWindModuleWidget(
        ctx,
        rightX + (sideW - windSize) / 2,
        pad + altStripH + 8,
        windSize,
        smoothWind,
        view.windModifier
      );
    } else {
      drawFullAltitudeStrip(
        ctx,
        rightX,
        pad,
        sideW,
        stripH,
        smoothAlt,
        hardAltitudeStrip
      );
    }

    // Right bottom: Co-pilot Dice Tray
    drawSeatTray(copilotSeat, rightX, h - trayH - pad, sideW, trayH, true);

    // =========================================================================
    // 5B. IN-CANVAS LANDING CRITERIA + REROLL + STATUS HUD (NO RIGHT SIDEBAR!)
    // =========================================================================
    const airportIdx = view.traffic.length - 1;
    const atAirport = view.approachPos === airportIdx;
    const runwayClear = view.traffic[airportIdx] === 0;
    const gearsCount = [
      view.switches.gear_12,
      view.switches.gear_34,
      view.switches.gear_56,
    ].filter(Boolean).length;
    const flapsCount = [
      view.switches.flap_12,
      view.switches.flap_23,
      view.switches.flap_45,
      view.switches.flap_56,
    ].filter(Boolean).length;

    const checklistItems: Array<{ ok: boolean; label: string }> = [
      {
        ok: atAirport && runwayClear,
        label: atAirport
          ? runwayClear
            ? `Đường băng ${view.airport.code} sạch`
            : `Còn ${view.traffic[airportIdx]} máy bay ở sân bay`
          : `Cách ${view.airport.code}: ${airportIdx - view.approachPos} ô`,
      },
      {
        ok: view.axis === 0,
        label:
          view.axis === 0
            ? "Trục Cánh cân bằng (0°)"
            : `Cánh nghiêng (${view.axis > 0 ? `+${view.axis}` : view.axis})`,
      },
      {
        ok: gearsCount === 3,
        label: `Càng Hạ Cánh: ${gearsCount}/3`,
      },
      {
        ok: flapsCount === 4,
        label: `Cánh Tà: ${flapsCount}/4`,
      },
      {
        ok: view.brakeLevel >= 4,
        label: `Lực Phanh: ${view.brakeLevel} (Động cơ ≤ Phanh)`,
      },
    ];
    if (view.internEnabled) {
      const done = view.internTrained.filter(Boolean).length;
      checklistItems.push({
        ok: done === 6,
        label: `Thực Tập Sinh: ${done}/6 ✓`,
      });
    }
    if (view.fuelEnabled) {
      checklistItems.push({
        ok: view.fuelLevel >= 0,
        label: `Nhiên liệu Kerosene: ${view.fuelLevel}/20`,
      });
    }

    // Place Landing Criteria card in the outer-right margin if space exists, else outer-left margin!
    const outerRightX = rightX + sideW + pad;
    const outerRightW = w - outerRightX - pad;
    const outerLeftW = leftX - pad * 2;

    const hudW =
      outerRightW >= 185
        ? Math.min(250, outerRightW)
        : outerLeftW >= 185
          ? Math.min(250, outerLeftW)
          : 0;

    if (hudW > 0) {
      const hudX = outerRightW >= 185 ? outerRightX : pad;
      const itemH = 22;
      const cardH = 56 + checklistItems.length * itemH + 14;
      const hudY = pad;

      // Card 1: Landing Criteria Checklist
      drawRoundedRect(ctx, hudX, hudY, hudW, cardH, 14);
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.fill();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#38bdf8";
      ctx.font = "900 11px system-ui, sans-serif";
      ctx.fillText(
        `✈️ ${view.airport.code} • VÒNG ${view.roundNumber}/7`,
        hudX + 12,
        hudY + 18
      );
      ctx.fillStyle = "#94a3b8";
      ctx.font = "800 9.5px system-ui, sans-serif";
      ctx.fillText("TIÊU CHÍ HẠ CÁNH (0 FT)", hudX + 12, hudY + 37);

      checklistItems.forEach((it, i) => {
        const iy = hudY + 56 + i * itemH;
        ctx.fillStyle = it.ok ? "#4ade80" : "#e2e8f0";
        ctx.font = "700 11px system-ui, sans-serif";
        const txt = `${it.ok ? "✅" : "⬜"} ${it.label}`;
        ctx.fillText(
          txt.length > 30 ? `${txt.slice(0, 29)}…` : txt,
          hudX + 12,
          iy
        );
      });

      // Card 2: Turn / Reroll / Latest Log below checklist
      const card2Y = hudY + cardH + 10;
      const card2H = Math.min(185, h - card2Y - pad);
      if (card2H >= 84) {
        drawRoundedRect(ctx, hudX, card2Y, hudW, card2H, 14);
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.fill();
        ctx.strokeStyle = isMyTurn
          ? "rgba(251, 191, 36, 0.65)"
          : "rgba(148, 163, 184, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const activeSeatObj = view.seats.find(
          (s) => s.seatNo === view.activeSeatNo
        );
        ctx.fillStyle = isMyTurn ? "#fde047" : "#cbd5e1";
        ctx.font = "800 11px system-ui, sans-serif";
        ctx.fillText(
          view.step === "BriefingStep"
            ? "💬 Pha thảo luận chiến thuật"
            : view.step === "MatchOver"
              ? view.outcome === "victory"
                ? "🛬 Hạ cánh thành công!"
                : "💥 Hạ cánh thất bại!"
              : isMyTurn
                ? "⚡ Tới lượt bạn đặt xúc xắc!"
                : `⏳ Chờ ${activeSeatObj?.displayName ?? "đồng đội"}...`,
          hudX + 12,
          card2Y + 18
        );

        // Silence indicator during placement
        if (view.step === "PlacementStep") {
          ctx.fillStyle = "#fda4af";
          ctx.font = "700 10px system-ui, sans-serif";
          ctx.fillText("🔇 Im lặng vô tuyến (Khóa Chat)", hudX + 12, card2Y + 35);
        }

        // Interactive Reroll button if it's my turn and rerollTokens > 0
        let logTopY = card2Y + 52;
        if (isMyTurn && mySeat && view.rerollTokens > 0 && mySeat.dice.length > 0) {
          if (!rerollMode) {
            const btnX = hudX + 10;
            const btnY = card2Y + 46;
            const btnW = hudW - 20;
            const btnH = 28;
            const hov = hoveredId === "btn_reroll_start";
            drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 8);
            ctx.fillStyle = hov
              ? "rgba(56, 189, 248, 0.35)"
              : "rgba(56, 189, 248, 0.18)";
            ctx.fill();
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 1.3;
            ctx.stroke();
            ctx.textAlign = "center";
            ctx.fillStyle = "#bae6fd";
            ctx.font = "800 11px system-ui, sans-serif";
            ctx.fillText(
              `🎲 Dùng Token Tung Lại (${view.rerollTokens})`,
              btnX + btnW / 2,
              btnY + btnH / 2
            );
            ctx.textAlign = "left";
            regions.push({
              id: "btn_reroll_start",
              shape: "rect",
              x: btnX,
              y: btnY,
              width: btnW,
              height: btnH,
            });
            logTopY = btnY + btnH + 12;
          } else {
            const btnY = card2Y + 46;
            const btnH = 28;
            const cfmW = (hudW - 26) * 0.65;
            const cnlW = (hudW - 26) * 0.35;
            const cfmX = hudX + 10;
            const cnlX = cfmX + cfmW + 6;
            drawRoundedRect(ctx, cfmX, btnY, cfmW, btnH, 8);
            ctx.fillStyle =
              rerollSelectedIndices.length > 0 ? "#f59e0b" : "#334155";
            ctx.fill();
            ctx.textAlign = "center";
            ctx.fillStyle =
              rerollSelectedIndices.length > 0 ? "#0f172a" : "#94a3b8";
            ctx.font = "900 10.5px system-ui, sans-serif";
            ctx.fillText(
              `Tung lại (${rerollSelectedIndices.length})`,
              cfmX + cfmW / 2,
              btnY + btnH / 2
            );
            if (rerollSelectedIndices.length > 0) {
              regions.push({
                id: "btn_reroll_confirm",
                shape: "rect",
                x: cfmX,
                y: btnY,
                width: cfmW,
                height: btnH,
              });
            }

            drawRoundedRect(ctx, cnlX, btnY, cnlW, btnH, 8);
            ctx.fillStyle = "#1e293b";
            ctx.fill();
            ctx.strokeStyle = "#475569";
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = "#cbd5e1";
            ctx.fillText("Huỷ", cnlX + cnlW / 2, btnY + btnH / 2);
            ctx.textAlign = "left";
            regions.push({
              id: "btn_reroll_cancel",
              shape: "rect",
              x: cnlX,
              y: btnY,
              width: cnlW,
              height: btnH,
            });
            logTopY = btnY + btnH + 12;
          }
        }

        // Wrapped latest action summary
        const maxChars = Math.max(22, Math.floor((hudW - 24) / 6.2));
        const words = view.lastActionSummaryVi.split(/\s+/);
        const lines: string[] = [];
        let cur = "";
        for (const wd of words) {
          const next = cur ? `${cur} ${wd}` : wd;
          if (next.length <= maxChars || !cur) {
            cur = next;
          } else {
            lines.push(cur);
            cur = wd;
          }
        }
        if (cur) lines.push(cur);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "600 10.5px system-ui, sans-serif";
        lines.slice(0, 4).forEach((ln, idx) => {
          const ly = logTopY + idx * 14;
          if (ly < card2Y + card2H - 8) {
            ctx.fillText(ln, hudX + 12, ly);
          }
        });
      }
    }
  } else {
    const trayH = 86;
    const trayW = (w - pad * 3) / 2;
    const ty = h - trayH - pad;
    drawSeatTray(pilotSeat, pad, ty, trayW, trayH, false);
    drawSeatTray(copilotSeat, pad * 2 + trayW, ty, trayW, trayH, false);
  }

  // =========================================================================
  // 6. BRIEFING / MATCH-OVER OVERLAY BANNER
  // =========================================================================
  if (view.step === "BriefingStep") {
    const bw = Math.min(410, w - 32);
    const bh = 112;
    const bx0 = (w - bw) / 2;
    const by0 = (h - bh) / 2;

    drawRoundedRect(ctx, bx0, by0, bw, bh, 16);
    ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
    ctx.fill();
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#fde047";
    ctx.font = "900 13px system-ui, sans-serif";
    ctx.fillText(
      `THẢO LUẬN CHIẾN THUẬT • VÒNG ${view.roundNumber} (${view.altitude * 1000} FT)`,
      w / 2,
      by0 + 24
    );
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "600 11px system-ui, sans-serif";
    ctx.fillText(
      "Trao đổi kế hoạch qua Chat — khi tung xúc xắc sẽ im lặng vô tuyến!",
      w / 2,
      by0 + 48
    );

    const viewerReady = mySeat?.readyForRoll ?? false;
    if (mySeat && !viewerReady) {
      const btnW = 210;
      const btnH = 34;
      const btnX = w / 2 - btnW / 2;
      const btnY = by0 + 66;
      const isHov = hoveredId === "btn_ready";
      drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 10);
      ctx.fillStyle = isHov ? "#38bdf8" : "#0284c7";
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 12px system-ui, sans-serif";
      ctx.fillText("🎲 Sẵn Sàng Tung Xúc Xắc", w / 2, btnY + btnH / 2);
      regions.push({
        id: "btn_ready",
        shape: "rect",
        x: btnX,
        y: btnY,
        width: btnW,
        height: btnH,
      });
    } else {
      ctx.fillStyle = "#4ade80";
      ctx.font = "800 12px system-ui, sans-serif";
      ctx.fillText("✓ Đang chờ đồng đội xác nhận...", w / 2, by0 + 84);
    }
  } else if (view.step === "MatchOver") {
    const isWin = view.outcome === "victory";
    const bw = Math.min(460, w - 32);
    const bh = isHost ? 148 : 114;
    const bx0 = (w - bw) / 2;
    const by0 = (h - bh) / 2;

    drawRoundedRect(ctx, bx0, by0, bw, bh, 18);
    ctx.fillStyle = isWin
      ? "rgba(6, 78, 59, 0.96)"
      : "rgba(127, 29, 29, 0.96)";
    ctx.fill();
    ctx.strokeStyle = isWin ? "#4ade80" : "#f87171";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = isWin ? "#86efac" : "#fca5a5";
    ctx.font = "900 19px system-ui, sans-serif";
    ctx.fillText(
      isWin ? "🛬 HẠ CÁNH AN TOÀN! CHIẾN THẮNG!" : "💥 CHUYẾN BAY THẤT BẠI!",
      w / 2,
      by0 + 34
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = "600 12px system-ui, sans-serif";
    const reason = view.outcomeReasonVi ?? "";
    ctx.fillText(
      reason.length > 74 ? `${reason.slice(0, 72)}…` : reason,
      w / 2,
      by0 + 70
    );

    if (isHost) {
      const btnW = 190;
      const btnH = 34;
      const btnX = w / 2 - btnW / 2;
      const btnY = by0 + 98;
      const isHov = hoveredId === "btn_rematch";
      drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 10);
      ctx.fillStyle = isHov ? "#fde047" : "#f59e0b";
      ctx.fill();
      ctx.fillStyle = "#0f172a";
      ctx.font = "900 12px system-ui, sans-serif";
      ctx.fillText("🔄 Bay Lại Ván Mới", w / 2, btnY + btnH / 2);
      regions.push({
        id: "btn_rematch",
        shape: "rect",
        x: btnX,
        y: btnY,
        width: btnW,
        height: btnH,
      });
    }
  }
}
