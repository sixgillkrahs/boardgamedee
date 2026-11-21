"use client";

import React, { useEffect, useRef } from "react";
import {
  computeRadialSeatPosition,
  drawRoundedRect,
  findHitRegionAtPoint,
  lerp,
  lerpHexColor,
  ParticleSystem,
  type HitRegion,
} from "@/canvas/engine";
import {
  ROLE_META,
  type WerewolfPlayerView,
  type WerewolfRole,
} from "@/cartridges/werewolf";

export interface LobbySeatItem {
  seatNo: number;
  actorId: string;
  displayName: string;
  avatarSeed: string;
  isBot: boolean;
  connected: boolean;
}

interface WerewolfCanvasProps {
  mode: "lobby" | "match";
  lobbySeats: LobbySeatItem[];
  viewerSeatNo: number | null;
  playerView: WerewolfPlayerView | null;
  selectedTargetSeatNo: number | null;
  onSelectSeat: (seatNo: number) => void;
  roleCardRevealed: boolean;
  onToggleRoleCard: () => void;
}

const ROLE_COLORS: Record<WerewolfRole, string> = {
  Werewolf: "#ef4444",
  Seer: "#38bdf8",
  Bodyguard: "#10b981",
  Witch: "#a855f7",
  Hunter: "#f59e0b",
  Villager: "#94a3b8",
};

const ROLE_ICONS: Record<WerewolfRole, string> = {
  Werewolf: "🐺",
  Seer: "🔮",
  Bodyguard: "🛡️",
  Witch: "🧪",
  Hunter: "🏹",
  Villager: "🌾",
};

export function WerewolfCanvas({
  mode,
  lobbySeats,
  viewerSeatNo,
  playerView,
  selectedTargetSeatNo,
  onSelectSeat,
  roleCardRevealed,
  onToggleRoleCard,
}: WerewolfCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hitRegionsRef = useRef<HitRegion[]>([]);
  const hoveredRegionIdRef = useRef<string | null>(null);
  const particlesRef = useRef<ParticleSystem>(new ParticleSystem());
  const dayMixRef = useRef<number>(0); // 0 = Night, 1 = Day

  // Keep latest props in a ref so the 60fps loop always reads fresh state without re-creating the RAF loop
  const stateRef = useRef({
    mode,
    lobbySeats,
    viewerSeatNo,
    playerView,
    selectedTargetSeatNo,
    onSelectSeat,
    roleCardRevealed,
    onToggleRoleCard,
  });

  useEffect(() => {
    stateRef.current = {
      mode,
      lobbySeats,
      viewerSeatNo,
      playerView,
      selectedTargetSeatNo,
      onSelectSeat,
      roleCardRevealed,
      onToggleRoleCard,
    };
  }, [
    mode,
    lobbySeats,
    viewerSeatNo,
    playerView,
    selectedTargetSeatNo,
    onSelectSeat,
    roleCardRevealed,
    onToggleRoleCard,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
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
        roleCardRevealed: isRoleOpen,
      } = stateRef.current;

      const isDay =
        curMode === "match" &&
        (pv?.phase === "DayPhase" ||
          (pv?.phase === "Finished" &&
            pv?.winningFaction === "VillageFaction"));
      const targetDayMix = isDay ? 1 : 0;
      dayMixRef.current = lerp(dayMixRef.current, targetDayMix, dt * 3.2);
      const dayMix = dayMixRef.current;

      const isHunterStep =
        curMode === "match" && pv?.step === "HunterRevengeStep";

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Sky & Clearing Background Gradient
      const topSky = isHunterStep
        ? "#450a0a"
        : lerpHexColor("#060b19", "#1e3a5f", dayMix);
      const bottomSky = isHunterStep
        ? "#1c0910"
        : lerpHexColor("#0f172a", "#475569", dayMix);

      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, topSky);
      bgGrad.addColorStop(1, bottomSky);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const centerX = width * 0.5;
      const centerY = height * 0.47;

      // 2. Celestial body (Moon at night / Sun in day)
      const moonAlpha = 1 - dayMix;
      if (moonAlpha > 0.05) {
        ctx.save();
        ctx.globalAlpha = moonAlpha * 0.85;
        const moonX = width * 0.84;
        const moonY = height * 0.14;
        const moonGlow = ctx.createRadialGradient(
          moonX,
          moonY,
          8,
          moonX,
          moonY,
          75
        );
        moonGlow.addColorStop(
          0,
          isHunterStep ? "rgba(239,68,68,0.8)" : "rgba(253,224,71,0.45)"
        );
        moonGlow.addColorStop(1, "rgba(253,224,71,0)");
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 75, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isHunterStep ? "#fca5a5" : "#fef9c3";
        ctx.beginPath();
        ctx.arc(moonX, moonY, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (dayMix > 0.05) {
        ctx.save();
        ctx.globalAlpha = dayMix * 0.85;
        const sunX = width * 0.16;
        const sunY = height * 0.14;
        const sunGlow = ctx.createRadialGradient(
          sunX,
          sunY,
          10,
          sunX,
          sunY,
          95
        );
        sunGlow.addColorStop(0, "rgba(251,191,36,0.55)");
        sunGlow.addColorStop(1, "rgba(251,191,36,0)");
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 95, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#fde68a";
        ctx.beginPath();
        ctx.arc(sunX, sunY, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. Village Plaza Table Ring
      const tableRx = Math.min(width * 0.37, 290);
      const tableRy = Math.min(height * 0.32, 210);

      const plazaGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        15,
        centerX,
        centerY,
        Math.max(tableRx, tableRy) * 1.1
      );
      plazaGrad.addColorStop(
        0,
        isHunterStep ? "rgba(220,38,38,0.26)" : "rgba(245,158,11,0.22)"
      );
      plazaGrad.addColorStop(0.6, "rgba(15,23,42,0.55)");
      plazaGrad.addColorStop(1, "rgba(15,23,42,0)");
      ctx.fillStyle = plazaGrad;
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY,
        tableRx * 1.05,
        tableRy * 1.05,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.strokeStyle = isHunterStep
        ? "rgba(248,113,113,0.35)"
        : dayMix > 0.5
          ? "rgba(251,191,36,0.35)"
          : "rgba(148,163,184,0.22)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, tableRx, tableRy, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Spawn & Update Ambient / Campfire Particles
      const particles = particlesRef.current;
      if (Math.random() < 0.45) {
        // Campfire embers rising from center
        particles.spawn({
          x: centerX + (Math.random() - 0.5) * 28,
          y: centerY + (Math.random() - 0.5) * 14,
          vx: (Math.random() - 0.5) * 18,
          vy: -22 - Math.random() * 28,
          radius: 1.5 + Math.random() * 2.2,
          color: isHunterStep
            ? "#f87171"
            : Math.random() > 0.4
              ? "#fb923c"
              : "#fde047",
          life: 1.1 + Math.random() * 0.9,
          maxLife: 2.0,
        });
      }
      if (dayMix < 0.5 && Math.random() < 0.18) {
        // Night fireflies
        particles.spawn({
          x: Math.random() * width,
          y: Math.random() * height * 0.85,
          vx: (Math.random() - 0.5) * 14,
          vy: (Math.random() - 0.5) * 10,
          radius: 1.4 + Math.random() * 1.5,
          color: "#a5f3fc",
          life: 1.8 + Math.random() * 1.2,
          maxLife: 3.0,
        });
      }
      particles.update(dt);
      particles.draw(ctx);

      // 5. Central Campfire & Phase Timer Ring
      const timerRadius = 56;
      ctx.save();
      ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
      ctx.beginPath();
      ctx.arc(centerX, centerY, timerRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
      ctx.beginPath();
      ctx.arc(centerX, centerY, timerRadius, 0, Math.PI * 2);
      ctx.stroke();

      let remainingSeconds: number | null = null;
      let progress = 1;
      if (curMode === "match" && pv?.phaseDeadlineMs) {
        const diffMs = Math.max(0, pv.phaseDeadlineMs - Date.now());
        remainingSeconds = Math.ceil(diffMs / 1000);
        const totalSec =
          pv.step === "NightActionStep"
            ? pv.config.timers.nightActionSeconds
            : pv.step === "WitchStep"
              ? pv.config.timers.witchSeconds
              : pv.step === "DayDiscussionStep"
                ? pv.config.timers.dayDiscussionSeconds
                : pv.step === "DayVotingStep"
                  ? pv.config.timers.dayVotingSeconds
                  : pv.config.timers.hunterRevengeSeconds;
        progress = Math.max(0, Math.min(1, diffMs / (totalSec * 1000)));

        ctx.strokeStyle =
          remainingSeconds <= 5
            ? "#ef4444"
            : isDay
              ? "#f59e0b"
              : "#38bdf8";
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY,
          timerRadius,
          -Math.PI / 2,
          -Math.PI / 2 + progress * Math.PI * 2
        );
        ctx.stroke();
      } else {
        ctx.strokeStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(centerX, centerY, timerRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Central Icon / Countdown Text
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (curMode === "lobby") {
        ctx.font = "24px sans-serif";
        ctx.fillText("🔥", centerX, centerY - 12);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText("SẢNH CHỜ", centerX, centerY + 14);
      } else if (pv?.phase === "Finished") {
        ctx.font = "26px sans-serif";
        ctx.fillText(
          pv.winningFaction === "VillageFaction" ? "🏆" : "🐺",
          centerX,
          centerY - 10
        );
        ctx.fillStyle = "#fde047";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("KẾT THÚC", centerX, centerY + 16);
      } else {
        ctx.fillStyle =
          remainingSeconds !== null && remainingSeconds <= 5
            ? "#fca5a5"
            : "#f8fafc";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText(
          remainingSeconds !== null ? `${remainingSeconds}s` : "--",
          centerX,
          centerY - 6
        );
        ctx.fillStyle = "#94a3b8";
        ctx.font = "600 11px sans-serif";
        ctx.fillText(`VÒNG ${pv?.cycle ?? 1}`, centerX, centerY + 18);
      }
      ctx.restore();

      // 6. Top Phase Banner on Canvas
      const bannerTitle =
        curMode === "lobby"
          ? `Làng Ma Sói • Đang chờ người chơi (${curLobbySeats.length} ghế)`
          : pv?.phase === "Finished"
            ? pv.winReasonVi ?? "Ván đấu đã kết thúc!"
            : pv?.step === "NightActionStep"
              ? `Đêm thứ ${pv.cycle} • Ma Sói, Tiên Tri & Bảo Vệ đang hành động`
              : pv?.step === "WitchStep"
                ? `Đêm thứ ${pv.cycle} • Phù Thủy đang chọn bình thuốc`
                : pv?.step === "HunterRevengeStep"
                  ? "Khẩn cấp • Thợ Săn đang nhắm bắn phát đạn cuối cùng!"
                  : pv?.step === "DayDiscussionStep"
                    ? `Ngày thứ ${pv?.cycle} • Thảo luận tìm ra Ma Sói`
                    : `Ngày thứ ${pv?.cycle} • Bỏ phiếu biểu quyết treo cổ`;

      ctx.save();
      const bannerW = Math.min(width - 28, 520);
      const bannerX = (width - bannerW) / 2;
      const bannerY = 14;
      drawRoundedRect(ctx, bannerX, bannerY, bannerW, 38, 19);
      ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = isHunterStep
        ? "rgba(239, 68, 68, 0.6)"
        : "rgba(255, 255, 255, 0.14)";
      ctx.stroke();

      ctx.fillStyle = "#f8fafc";
      ctx.font = "600 13px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(bannerTitle, width / 2, bannerY + 19);
      ctx.restore();

      // 7. Seats around the table + HitRegions
      const newHitRegions: HitRegion[] = [];
      const seatsToRender =
        curMode === "match" && pv
          ? pv.seats.map((s) => {
              const lobbyMeta = curLobbySeats.find(
                (ls) => ls.seatNo === s.seatNo
              );
              return {
                seatNo: s.seatNo,
                displayName: s.displayName,
                alive: s.alive,
                role: s.role,
                readyToVote: s.readyToVote,
                dayVoteTarget: s.dayVoteTarget,
                werewolfVoteTarget: s.werewolfVoteTarget,
                isBot: lobbyMeta?.isBot ?? false,
                connected: lobbyMeta?.connected ?? true,
              };
            })
          : curLobbySeats.map((s) => ({
              seatNo: s.seatNo,
              displayName: s.displayName,
              alive: true,
              role: null as WerewolfRole | null,
              readyToVote: false,
              dayVoteTarget: null as number | "abstain" | "voted" | null,
              werewolfVoteTarget: null as number | null,
              isBot: s.isBot,
              connected: s.connected,
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

      // Draw targeting beam if a target Seat is selected
      if (curTarget !== null && seatPositions.has(curTarget)) {
        const targetPos = seatPositions.get(curTarget)!;
        const originPos =
          curViewerSeatNo && seatPositions.has(curViewerSeatNo)
            ? seatPositions.get(curViewerSeatNo)!
            : { x: centerX, y: centerY };

        const beamColor =
          pv?.myRole && pv.phase === "NightPhase"
            ? ROLE_COLORS[pv.myRole]
            : "#f59e0b";

        ctx.save();
        ctx.strokeStyle = beamColor;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -(now / 25);
        ctx.beginPath();
        ctx.moveTo(originPos.x, originPos.y);
        ctx.lineTo(targetPos.x, targetPos.y);
        ctx.stroke();
        ctx.restore();
      }

      // Compute vote counts against each seat during DayVotingStep
      const dayVoteCounts = new Map<number, number>();
      if (curMode === "match" && pv) {
        for (const s of pv.seats) {
          if (typeof s.dayVoteTarget === "number") {
            dayVoteCounts.set(
              s.dayVoteTarget,
              (dayVoteCounts.get(s.dayVoteTarget) ?? 0) + 1
            );
          }
        }
      }

      const seerMap = new Map<number, "WerewolfFaction" | "VillageFaction">();
      if (pv?.seerInspections) {
        for (const item of pv.seerInspections) {
          seerMap.set(item.targetSeatNo, item.faction);
        }
      }

      const seatRadius = width < 520 ? 29 : 35;

      seatsToRender.forEach((seat) => {
        const pos = seatPositions.get(seat.seatNo)!;
        const isMe = seat.seatNo === curViewerSeatNo;
        const isSelected = seat.seatNo === curTarget;
        const isHovered = hoveredRegionIdRef.current === `seat-${seat.seatNo}`;
        const isWolfVictimForWitch =
          pv?.step === "WitchStep" &&
          pv?.witchState?.pendingWolfVictimSeatNo === seat.seatNo;

        newHitRegions.push({
          id: `seat-${seat.seatNo}`,
          shape: "circle",
          x: pos.x,
          y: pos.y,
          radius: seatRadius + 8,
          cursor: "pointer",
          data: { type: "seat", seatNo: seat.seatNo },
        });

        ctx.save();

        // Outer halo for viewer / selected / witch victim
        if (isSelected || isWolfVictimForWitch) {
          const pulse = 1 + Math.sin(now / 160) * 0.12;
          ctx.strokeStyle = isWolfVictimForWitch ? "#ef4444" : "#fbbf24";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, (seatRadius + 7) * pulse, 0, Math.PI * 2);
          ctx.stroke();
        } else if (isMe) {
          ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, seatRadius + 5, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Medallion circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, seatRadius, 0, Math.PI * 2);
        ctx.fillStyle = !seat.alive
          ? "rgba(30, 41, 59, 0.85)"
          : isHovered
            ? "#1e293b"
            : "#0f172a";
        ctx.fill();

        const roleBorderColor =
          seat.role && ( !isMe || isRoleOpen || pv?.phase === "Finished")
            ? ROLE_COLORS[seat.role]
            : isMe
              ? "#38bdf8"
              : "#475569";

        ctx.lineWidth = isSelected ? 3.5 : 2.5;
        ctx.strokeStyle = !seat.alive ? "#475569" : roleBorderColor;
        ctx.stroke();

        // Seat Avatar Icon / Gravestone
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${Math.round(seatRadius * 0.78)}px sans-serif`;
        if (!seat.alive) {
          ctx.fillText("🪦", pos.x, pos.y - 2);
        } else if (
          seat.role &&
          (!isMe || isRoleOpen || pv?.phase === "Finished")
        ) {
          ctx.fillText(ROLE_ICONS[seat.role], pos.x, pos.y - 2);
        } else {
          ctx.fillText(seat.isBot ? "🤖" : "🧑", pos.x, pos.y - 2);
        }

        // Seat Number pill (top-left of medallion)
        const badgeX = pos.x - seatRadius * 0.72;
        const badgeY = pos.y - seatRadius * 0.72;
        ctx.fillStyle = isMe ? "#0284c7" : "#334155";
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f8fafc";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText(`#${seat.seatNo}`, badgeX, badgeY + 0.5);

        // Connection status dot (bottom-left of medallion)
        const connX = pos.x - seatRadius * 0.72;
        const connY = pos.y + seatRadius * 0.68;
        ctx.fillStyle = seat.connected ? "#10b981" : "#64748b";
        ctx.beginPath();
        ctx.arc(connX, connY, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Vote tally badge (top-right of medallion)
        const votesAgainst = dayVoteCounts.get(seat.seatNo) ?? 0;
        if (votesAgainst > 0) {
          const vX = pos.x + seatRadius * 0.75;
          const vY = pos.y - seatRadius * 0.72;
          ctx.fillStyle = "#dc2626";
          ctx.beginPath();
          ctx.arc(vX, vY, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 11px sans-serif";
          ctx.fillText(`${votesAgainst}`, vX, vY + 0.5);
        }

        // Seer private inspection badge
        const seerResult = seerMap.get(seat.seatNo);
        if (seerResult) {
          const sX = pos.x + seatRadius * 0.75;
          const sY = pos.y + seatRadius * 0.65;
          drawRoundedRect(ctx, sX - 18, sY - 9, 36, 18, 9);
          ctx.fillStyle =
            seerResult === "WerewolfFaction" ? "#dc2626" : "#059669";
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 9px sans-serif";
          ctx.fillText(
            seerResult === "WerewolfFaction" ? "SÓI" : "DÂN",
            sX,
            sY
          );
        }

        // Name Plate under medallion
        const labelText = isMe
          ? `${seat.displayName} (Bạn)`
          : seat.displayName;
        const plateW = Math.max(84, Math.min(132, labelText.length * 6.8 + 18));
        const plateX = pos.x - plateW / 2;
        const plateY = pos.y + seatRadius + 6;

        drawRoundedRect(ctx, plateX, plateY, plateW, 22, 7);
        ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
        ctx.fill();
        ctx.fillStyle = !seat.alive
          ? "#64748b"
          : isMe
            ? "#7dd3fc"
            : "#f1f5f9";
        ctx.font = "600 11px sans-serif";
        ctx.fillText(
          labelText.length > 16 ? `${labelText.slice(0, 15)}…` : labelText,
          pos.x,
          plateY + 11
        );

        // Status subtitle (Role name when revealed, or Ready status, or Wolf victim warning)
        let subLabel: string | null = null;
        let subColor = "#94a3b8";
        if (isWolfVictimForWitch) {
          subLabel = "⚠️ Bị Sói cắn!";
          subColor = "#fca5a5";
        } else if (
          seat.role &&
          (!isMe || isRoleOpen || pv?.phase === "Finished")
        ) {
          subLabel = ROLE_META[seat.role].nameVi;
          subColor = ROLE_COLORS[seat.role];
        } else if (
          curMode === "match" &&
          pv?.step === "DayDiscussionStep" &&
          seat.readyToVote
        ) {
          subLabel = "✓ Sẵn sàng bầu";
          subColor = "#34d399";
        } else if (!seat.alive) {
          subLabel = "Đã chết";
          subColor = "#64748b";
        }

        if (subLabel) {
          ctx.fillStyle = subColor;
          ctx.font = "bold 10px sans-serif";
          ctx.fillText(subLabel, pos.x, plateY + 31);
        }

        ctx.restore();
      });

      // 8. Interactive Role Card on Canvas (Bottom-Left) during a Match
      if (curMode === "match" && pv?.myRole) {
        const cardW = width < 520 ? 195 : 236;
        const cardH = width < 520 ? 86 : 96;
        const cardX = 14;
        const cardY = height - cardH - 14;

        newHitRegions.push({
          id: "my-role-card",
          shape: "rect",
          x: cardX,
          y: cardY,
          width: cardW,
          height: cardH,
          cursor: "pointer",
          data: { type: "role-card" },
        });

        const roleInfo = ROLE_META[pv.myRole];
        const accent = ROLE_COLORS[pv.myRole];

        ctx.save();
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 14);
        ctx.fillStyle = isRoleOpen
          ? "rgba(15, 23, 42, 0.94)"
          : "rgba(30, 41, 59, 0.92)";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = isRoleOpen ? accent : "rgba(148, 163, 184, 0.4)";
        ctx.stroke();

        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        if (isRoleOpen) {
          ctx.font = "28px sans-serif";
          ctx.fillText(ROLE_ICONS[pv.myRole], cardX + 12, cardY + 30);

          ctx.fillStyle = accent;
          ctx.font = "bold 13px sans-serif";
          ctx.fillText(roleInfo.nameVi.toUpperCase(), cardX + 48, cardY + 21);

          ctx.fillStyle = "#cbd5e1";
          ctx.font = "600 10px sans-serif";
          ctx.fillText(roleInfo.factionNameVi, cardX + 48, cardY + 37);

          const desc = roleInfo.shortDescriptionVi;
          ctx.fillStyle = "#94a3b8";
          ctx.font = "10px sans-serif";
          ctx.fillText(desc.slice(0, 34), cardX + 14, cardY + 58);
          if (desc.length > 34) {
            ctx.fillText(
              desc.length > 68 ? `${desc.slice(34, 67)}…` : desc.slice(34),
              cardX + 14,
              cardY + 72
            );
          }
        } else {
          ctx.font = "26px sans-serif";
          ctx.fillText("🎴", cardX + 14, cardY + cardH / 2);

          ctx.fillStyle = "#f8fafc";
          ctx.font = "bold 12px sans-serif";
          ctx.fillText("THẺ VAI TRÒ BÍ MẬT", cardX + 48, cardY + 32);

          ctx.fillStyle = "#38bdf8";
          ctx.font = "600 11px sans-serif";
          ctx.fillText("Chạm để lật xem bài", cardX + 48, cardY + 54);
        }
        ctx.restore();
      }

      ctx.restore();
      hitRegionsRef.current = newHitRegions;
      animationFrameId = requestAnimationFrame(renderFrame);
    };

    animationFrameId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, []);

  const getCanvasLogicalCoords = (
    e: React.MouseEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
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
    const { x, y } = getCanvasLogicalCoords(e);
    const region = findHitRegionAtPoint(hitRegionsRef.current, x, y);
    hoveredRegionIdRef.current = region?.id ?? null;
    canvas.style.cursor = region?.cursor ?? "default";
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasLogicalCoords(e);
    const region = findHitRegionAtPoint(hitRegionsRef.current, x, y);
    if (!region || !region.data) return;

    if (region.data.type === "seat") {
      stateRef.current.onSelectSeat(region.data.seatNo);
    } else if (region.data.type === "role-card") {
      stateRef.current.onToggleRoleCard();
    }
  };

  return (
    <div className="relative w-full h-full min-h-[440px] select-none overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="block w-full h-full"
      />
    </div>
  );
}
