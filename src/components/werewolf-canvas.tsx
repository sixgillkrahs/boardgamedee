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
  computeCardDealProgress,
  drawRoleSquareCard,
} from "@/canvas/role-cards";
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
  const dayMixRef = useRef<number>(0);

  // Track when the current Match started / entered Cycle 1 so we play the Card Dealing animation
  const dealStartTimeRef = useRef<number | null>(null);
  const lastMatchKeyRef = useRef<string>("");
  const showcaseDismissedRef = useRef<boolean>(false);

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

    if (mode === "match" && playerView) {
      const matchKey = `${playerView.seats.length}-${playerView.myRole ?? "spec"}`;
      if (lastMatchKeyRef.current !== matchKey) {
        lastMatchKeyRef.current = matchKey;
        dealStartTimeRef.current = performance.now();
        showcaseDismissedRef.current = false;
      }
    } else {
      lastMatchKeyRef.current = "";
      dealStartTimeRef.current = null;
    }
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
      canvas.height = Math.max(440, Math.floor(rect.height * dpr));
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
      const centerY = height * 0.46;

      // 2. Celestial body (Moon at night / Sun in day)
      const moonAlpha = 1 - dayMix;
      if (moonAlpha > 0.05) {
        ctx.save();
        ctx.globalAlpha = moonAlpha * 0.85;
        const moonX = width * 0.85;
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
        const sunX = width * 0.15;
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
      const tableRx = Math.min(width * 0.36, 285);
      const tableRy = Math.min(height * 0.31, 200);

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

      // 4. Particles (Campfire embers & Night fireflies)
      const particles = particlesRef.current;
      if (Math.random() < 0.45) {
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
      const timerRadius = 54;
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

      // 6. Top Phase Banner
      const dealElapsedSec =
        dealStartTimeRef.current !== null
          ? (now - dealStartTimeRef.current) / 1000
          : 999;

      const bannerTitle =
        curMode === "lobby"
          ? `Làng Ma Sói • Đang chờ người chơi (${curLobbySeats.length} ghế)`
          : dealElapsedSec < 1.8
            ? "🎴 Quản trò đang chia thẻ bài vai trò cho từng người chơi..."
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
      const bannerW = Math.min(width - 28, 540);
      const bannerX = (width - bannerW) / 2;
      const bannerY = 14;
      drawRoundedRect(ctx, bannerX, bannerY, bannerW, 38, 19);
      ctx.fillStyle = "rgba(15, 23, 42, 0.84)";
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

      // 7. Seats around the table + Dealt Role Cards
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
                dayVoteLocked: s.dayVoteLocked,
                werewolfVoteTarget: s.werewolfVoteTarget,
                werewolfVoteLocked: s.werewolfVoteLocked,
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
              dayVoteTarget: null as number | "abstain" | null,
              dayVoteLocked: false,
              werewolfVoteTarget: null as number | null,
              werewolfVoteLocked: false,
              isBot: s.isBot,
              connected: s.connected,
            }));

      const seatPositions = new Map<number, { x: number; y: number }>();
      const seatNamesByNo = new Map<number, string>();
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
        seatNamesByNo.set(seat.seatNo, seat.displayName);
      });

      // Targeting beam if a target Seat is selected locally
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

      // Compute Day votes & Night Werewolf Pack votes against each Seat, and draw live vote arrows between Seats!
      const dayVoteCounts = new Map<number, number>();
      const dayVotersByTarget = new Map<number, number[]>();
      const wolfVotersByTarget = new Map<number, number[]>();

      const drawVoteArrow = (
        fromSeatNo: number,
        toSeatNo: number,
        color: string
      ) => {
        if (fromSeatNo === toSeatNo) return;
        const fromPos = seatPositions.get(fromSeatNo);
        const toPos = seatPositions.get(toSeatNo);
        if (!fromPos || !toPos) return;

        const dx = toPos.x - fromPos.x;
        const dy = toPos.y - fromPos.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 40) return;

        const ux = dx / dist;
        const uy = dy / dist;
        const startX = fromPos.x + ux * 36;
        const startY = fromPos.y + uy * 36;
        const endX = toPos.x - ux * 42;
        const endY = toPos.y - uy * 42;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2.2;
        ctx.setLineDash([6, 4]);
        ctx.lineDashOffset = -(now / 30);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrowhead at endX, endY
        const angle = Math.atan2(dy, dx);
        const headLen = 9;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headLen * Math.cos(angle - Math.PI / 6),
          endY - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          endX - headLen * Math.cos(angle + Math.PI / 6),
          endY - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };

      if (curMode === "match" && pv) {
        for (const s of pv.seats) {
          // 1. Day Voting arrows & tallies (visible to everyone during DayVotingStep)
          if (typeof s.dayVoteTarget === "number") {
            dayVoteCounts.set(
              s.dayVoteTarget,
              (dayVoteCounts.get(s.dayVoteTarget) ?? 0) + 1
            );
            const list = dayVotersByTarget.get(s.dayVoteTarget) ?? [];
            list.push(s.seatNo);
            dayVotersByTarget.set(s.dayVoteTarget, list);

            if (pv.step === "DayVotingStep") {
              drawVoteArrow(s.seatNo, s.dayVoteTarget, "rgba(245, 158, 11, 0.78)");
            }
          }

          // 2. Night Werewolf Pack votes (projectView only populates werewolfVoteTarget for fellow Werewolves!)
          if (
            pv.phase === "NightPhase" &&
            typeof s.werewolfVoteTarget === "number"
          ) {
            const wList = wolfVotersByTarget.get(s.werewolfVoteTarget) ?? [];
            wList.push(s.seatNo);
            wolfVotersByTarget.set(s.werewolfVoteTarget, wList);
            drawVoteArrow(
              s.seatNo,
              s.werewolfVoteTarget,
              "rgba(239, 68, 68, 0.85)"
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

      const cardSize = width < 520 ? 54 : 66;
      let allCardsDealt = true;

      seatsToRender.forEach((seat, seatIdx) => {
        const pos = seatPositions.get(seat.seatNo)!;
        const isMe = seat.seatNo === curViewerSeatNo;
        const isSelected = seat.seatNo === curTarget;
        const isHovered = hoveredRegionIdRef.current === `seat-${seat.seatNo}`;
        const isWolfVictimForWitch =
          pv?.step === "WitchStep" &&
          pv?.witchState?.pendingWolfVictimSeatNo === seat.seatNo;

        newHitRegions.push({
          id: `seat-${seat.seatNo}`,
          shape: "rect",
          x: pos.x - cardSize * 0.6,
          y: pos.y - cardSize * 0.6,
          width: cardSize * 1.2,
          height: cardSize * 1.4,
          cursor: "pointer",
          data: { type: "seat", seatNo: seat.seatNo },
        });

        ctx.save();

        // Determine dealt card position (flying from center deck to Seat during initial deal)
        let cardCenterX = pos.x;
        let cardCenterY = pos.y;
        let cardRot = 0;
        let cardScale = 1;

        if (curMode === "match") {
          const deal = computeCardDealProgress(
            dealElapsedSec,
            seatIdx,
            seatsToRender.length
          );
          if (!deal.allDealt) {
            allCardsDealt = false;
          }
          cardCenterX = lerp(centerX, pos.x, deal.flightT);
          cardCenterY = lerp(centerY, pos.y, deal.flightT);
          cardRot = deal.rotationRad;
          cardScale = deal.scale;
        }

        // Outer halo for viewer / selected / witch victim
        if (isSelected || isWolfVictimForWitch) {
          const pulse = 1 + Math.sin(now / 160) * 0.1;
          ctx.strokeStyle = isWolfVictimForWitch ? "#ef4444" : "#fbbf24";
          ctx.lineWidth = 3;
          drawRoundedRect(
            ctx,
            pos.x - (cardSize * 0.56) * pulse,
            pos.y - (cardSize * 0.56) * pulse,
            cardSize * 1.12 * pulse,
            cardSize * 1.12 * pulse,
            10
          );
          ctx.stroke();
        } else if (isMe) {
          ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
          ctx.lineWidth = 2.5;
          drawRoundedRect(
            ctx,
            pos.x - cardSize * 0.55,
            pos.y - cardSize * 0.55,
            cardSize * 1.1,
            cardSize * 1.1,
            10
          );
          ctx.stroke();
        }

        // Draw the Seat's Square Role Card (or Lobby Avatar Slot)
        if (curMode === "match") {
          const visibleRoleForCard: WerewolfRole | null =
            seat.role && (!isMe || isRoleOpen || pv?.phase === "Finished")
              ? seat.role
              : null;

          ctx.save();
          ctx.translate(cardCenterX, cardCenterY);
          ctx.rotate(cardRot);
          ctx.scale(cardScale, cardScale);
          if (!seat.alive) {
            ctx.globalAlpha = 0.45;
          }
          drawRoleSquareCard(
            ctx,
            -cardSize / 2,
            -cardSize / 2,
            cardSize,
            visibleRoleForCard,
            false
          );
          ctx.restore();

          if (!seat.alive) {
            ctx.font = `${Math.round(cardSize * 0.48)}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🪦", pos.x, pos.y);
          }
        } else {
          // Lobby Seat Box
          drawRoundedRect(
            ctx,
            pos.x - cardSize / 2,
            pos.y - cardSize / 2,
            cardSize,
            cardSize,
            12
          );
          ctx.fillStyle = isHovered ? "#1e293b" : "#0f172a";
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = isMe ? "#38bdf8" : "#475569";
          ctx.stroke();

          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = `${Math.round(cardSize * 0.45)}px sans-serif`;
          ctx.fillText(seat.isBot ? "🤖" : "🧑", pos.x, pos.y);
        }

        // Connection status dot (bottom-left of card)
        const connX = pos.x - cardSize * 0.46;
        const connY = pos.y + cardSize * 0.46;
        ctx.fillStyle = seat.connected ? "#10b981" : "#64748b";
        ctx.beginPath();
        ctx.arc(connX, connY, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Vote tally badge (top-right of card: Day votes OR Night Werewolf Pack votes)
        const votesAgainst = dayVoteCounts.get(seat.seatNo) ?? 0;
        const dayVoters = dayVotersByTarget.get(seat.seatNo) ?? [];
        const wolfVoters = wolfVotersByTarget.get(seat.seatNo) ?? [];

        const formatVoterNames = (voterNos: number[]) =>
          voterNos
            .map((no) => (seatNamesByNo.get(no) ?? "").slice(0, 8))
            .filter(Boolean)
            .join(", ");

        if (votesAgainst > 0) {
          const vX = pos.x + cardSize * 0.46;
          const vY = pos.y - cardSize * 0.46;
          ctx.fillStyle = "#dc2626";
          ctx.beginPath();
          ctx.arc(vX, vY, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 11px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${votesAgainst}`, vX, vY + 0.5);

          // Voter list tag above the card by player names
          const tagText = `⬅ ${formatVoterNames(dayVoters)}`;
          const tagW = Math.max(48, Math.min(136, tagText.length * 6.2 + 12));
          drawRoundedRect(
            ctx,
            pos.x - tagW / 2,
            pos.y - cardSize * 0.5 - 22,
            tagW,
            17,
            8
          );
          ctx.fillStyle = "rgba(220, 38, 38, 0.92)";
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 9.5px sans-serif";
          ctx.fillText(
            tagText.length > 20 ? `${tagText.slice(0, 19)}…` : tagText,
            pos.x,
            pos.y - cardSize * 0.5 - 13.5
          );
        } else if (wolfVoters.length > 0) {
          // Werewolf Pack Vote Badge visible to all Werewolves during NightPhase
          const wText = `🐺 ← ${formatVoterNames(wolfVoters)}`;
          const wTagW = Math.max(58, Math.min(142, wText.length * 6.4 + 12));
          drawRoundedRect(
            ctx,
            pos.x - wTagW / 2,
            pos.y - cardSize * 0.5 - 23,
            wTagW,
            18,
            9
          );
          ctx.fillStyle = "rgba(185, 28, 28, 0.95)";
          ctx.fill();
          ctx.strokeStyle = "#fca5a5";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = "#fef2f2";
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            wText.length > 20 ? `${wText.slice(0, 19)}…` : wText,
            pos.x,
            pos.y - cardSize * 0.5 - 14
          );
        }

        // Seer private inspection badge (bottom-right of card)
        const seerResult = seerMap.get(seat.seatNo);
        if (seerResult) {
          const sX = pos.x + cardSize * 0.36;
          const sY = pos.y + cardSize * 0.44;
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

        // Name Plate under card
        const labelText = isMe
          ? `${seat.displayName} (Bạn)`
          : seat.displayName;
        const plateW = Math.max(86, Math.min(136, labelText.length * 6.8 + 18));
        const plateX = pos.x - plateW / 2;
        const plateY = pos.y + cardSize * 0.5 + 6;

        drawRoundedRect(ctx, plateX, plateY, plateW, 21, 7);
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
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
          plateY + 10.5
        );

        // Status subtitle (includes live Werewolf teammate vote & Day vote choice!)
        let subLabel: string | null = null;
        let subColor = "#94a3b8";
        if (isWolfVictimForWitch) {
          subLabel = "⚠️ Bị Sói cắn!";
          subColor = "#fca5a5";
        } else if (
          curMode === "match" &&
          pv?.phase === "NightPhase" &&
          typeof seat.werewolfVoteTarget === "number"
        ) {
          const targetName = (
            seatNamesByNo.get(seat.werewolfVoteTarget) ?? ""
          ).slice(0, 10);
          subLabel = seat.werewolfVoteLocked
            ? `🐺 ✓ ${targetName}`
            : `🐺 → ${targetName}`;
          subColor = seat.werewolfVoteLocked ? "#ef4444" : "#fca5a5";
        } else if (
          curMode === "match" &&
          pv?.step === "DayVotingStep" &&
          seat.dayVoteTarget !== null
        ) {
          const lockMark = seat.dayVoteLocked ? "✓ " : "";
          const targetName =
            typeof seat.dayVoteTarget === "number"
              ? (seatNamesByNo.get(seat.dayVoteTarget) ?? "").slice(0, 10)
              : "";
          subLabel =
            seat.dayVoteTarget === "abstain"
              ? `🏳️ ${lockMark}Phiếu trắng`
              : `🗳️ ${lockMark}${targetName}`;
          subColor =
            seat.dayVoteTarget === "abstain" ? "#cbd5e1" : "#fbbf24";
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
          ctx.fillText(subLabel, pos.x, plateY + 30);
        }

        ctx.restore();
      });

      // 8. Bottom-Left Docked Square Role Card + Button to Re-Deal / Inspect Card
      if (curMode === "match" && pv?.myRole) {
        const dockW = width < 520 ? 220 : 264;
        const dockH = width < 520 ? 88 : 98;
        const dockX = 14;
        const dockY = height - dockH - 14;

        newHitRegions.push({
          id: "my-role-card",
          shape: "rect",
          x: dockX,
          y: dockY,
          width: dockW,
          height: dockH,
          cursor: "pointer",
          data: { type: "role-card" },
        });

        const roleInfo = ROLE_META[pv.myRole];
        const accent = ROLE_COLORS[pv.myRole];

        ctx.save();
        drawRoundedRect(ctx, dockX, dockY, dockW, dockH, 14);
        ctx.fillStyle = isRoleOpen
          ? "rgba(15, 23, 42, 0.95)"
          : "rgba(30, 41, 59, 0.94)";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = isRoleOpen ? accent : "rgba(148, 163, 184, 0.4)";
        ctx.stroke();

        // Draw miniature square Thiercelieux card inside the left side of the dock
        const thumbSize = dockH - 16;
        drawRoleSquareCard(
          ctx,
          dockX + 8,
          dockY + 8,
          thumbSize,
          isRoleOpen ? pv.myRole : null,
          false
        );

        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const textX = dockX + thumbSize + 16;

        if (isRoleOpen) {
          ctx.fillStyle = accent;
          ctx.font = "bold 13px sans-serif";
          ctx.fillText(roleInfo.nameVi.toUpperCase(), textX, dockY + 21);

          ctx.fillStyle = "#cbd5e1";
          ctx.font = "600 10px sans-serif";
          ctx.fillText(roleInfo.factionNameVi, textX, dockY + 36);

          const desc = roleInfo.shortDescriptionVi;
          ctx.fillStyle = "#94a3b8";
          ctx.font = "10px sans-serif";
          ctx.fillText(desc.slice(0, 26), textX, dockY + 56);
          if (desc.length > 26) {
            ctx.fillText(
              desc.length > 52 ? `${desc.slice(26, 51)}…` : desc.slice(26),
              textX,
              dockY + 70
            );
          }
        } else {
          ctx.fillStyle = "#f8fafc";
          ctx.font = "bold 12px sans-serif";
          ctx.fillText("THẺ VAI TRÒ BÍ MẬT", textX, dockY + 34);

          ctx.fillStyle = "#38bdf8";
          ctx.font = "600 11px sans-serif";
          ctx.fillText("Chạm để lật xem thẻ", textX, dockY + 54);
        }
        ctx.restore();

        // 9. Post-Deal Center Card Reveal Modal (shows automatically for 4s right after cards are dealt)
        const showCenterReveal =
          allCardsDealt &&
          dealElapsedSec < 5.2 &&
          !showcaseDismissedRef.current &&
          isRoleOpen;

        if (showCenterReveal) {
          ctx.save();
          ctx.fillStyle = "rgba(2, 6, 23, 0.72)";
          ctx.fillRect(0, 0, width, height);

          const modalW = 270;
          const modalH = 340;
          const modalX = (width - modalW) / 2;
          const modalY = (height - modalH) / 2;

          newHitRegions.push({
            id: "dismiss-reveal-modal",
            shape: "rect",
            x: modalX,
            y: modalY,
            width: modalW,
            height: modalH,
            cursor: "pointer",
            data: { type: "dismiss-showcase" },
          });

          drawRoundedRect(ctx, modalX, modalY, modalW, modalH, 20);
          ctx.fillStyle = "#0f172a";
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = accent;
          ctx.stroke();

          ctx.fillStyle = "#fde047";
          ctx.font = "bold 12px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(
            "THẺ VAI TRÒ CỦA BẠN",
            centerX,
            modalY + 24
          );

          // Big 190x190 Thiercelieux Square Card Art!
          const bigCardSize = 190;
          drawRoleSquareCard(
            ctx,
            centerX - bigCardSize / 2,
            modalY + 42,
            bigCardSize,
            pv.myRole,
            true
          );

          ctx.fillStyle = "#f8fafc";
          ctx.font = "bold 15px sans-serif";
          ctx.fillText(
            `${roleInfo.nameVi} • ${roleInfo.factionNameVi}`,
            centerX,
            modalY + 255
          );

          ctx.fillStyle = "#94a3b8";
          ctx.font = "11px sans-serif";
          const line1 = roleInfo.shortDescriptionVi.slice(0, 42);
          const line2 = roleInfo.shortDescriptionVi.slice(42, 88);
          ctx.fillText(line1, centerX, modalY + 278);
          if (line2) {
            ctx.fillText(line2, centerX, modalY + 294);
          }

          ctx.fillStyle = "#38bdf8";
          ctx.font = "bold 11px sans-serif";
          ctx.fillText(
            "Chạm vào thẻ để thu về góc bàn",
            centerX,
            modalY + 320
          );
          ctx.restore();
        }
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

    if (region.data.type === "dismiss-showcase") {
      showcaseDismissedRef.current = true;
    } else if (region.data.type === "seat") {
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
