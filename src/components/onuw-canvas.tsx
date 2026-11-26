"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ONUW_FACTION_META,
  ONUW_ROLE_META,
  type OnuwCommand,
  type OnuwNightPhase,
  type OnuwPlayerView,
  type OnuwRoleId,
} from "@/cartridges/one-night-werewolf";
import {
  drawOnuwBackdrop2D,
  drawOnuwCardBack2D,
  drawOnuwRoleCard2D,
  drawOnuwTable2D,
  drawVoteArrow2D,
  roundRectPath,
} from "@/canvas/onuw-art";
import { playOnuwSfx } from "@/canvas/onuw-fx";

interface LobbySeat {
  seatNo: number;
  displayName: string;
  connected?: boolean;
  isBot?: boolean;
}

interface OnuwCanvasProps {
  mode: "lobby" | "match";
  lobbySeats: LobbySeat[];
  isHost: boolean;
  viewerSeatNo: number | null;
  playerView: OnuwPlayerView | null;
  soundEnabled: boolean;
  onRematch: () => void;
  onDispatchCommand: (cmd: OnuwCommand) => void;
}

interface HitBox {
  kind: "seat" | "center";
  id: number; // seatNo or centerIdx (0..2)
  x: number;
  y: number;
  w: number;
  h: number;
}

function phaseLabelVi(phase: OnuwNightPhase): string {
  switch (phase) {
    case "doppelganger":
      return "🎭 Nhân Bản";
    case "doppelganger_action":
      return "🎭 Nhân Bản (Hành động)";
    case "werewolf":
      return "🐺 Ma Sói";
    case "minion":
      return "🗡️ Tay Sai";
    case "mason":
      return "⚒️ Thợ Xây";
    case "seer":
      return "🔮 Tiên Tri";
    case "robber":
      return "🦊 Đạo Chích";
    case "troublemaker":
      return "🃏 Kẻ Phá Rối";
    case "drunk":
      return "🍺 Kẻ Say Rượu";
    case "insomniac":
      return "👁️ Kẻ Mất Ngủ";
    case "doppelganger_insomniac":
      return "🎭👁️ Nhân Bản (Mất Ngủ)";
  }
}

export function OnuwCanvas({
  mode,
  lobbySeats,
  isHost,
  viewerSeatNo,
  playerView,
  soundEnabled,
  onRematch,
  onDispatchCommand,
}: OnuwCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hitBoxesRef = useRef<HitBox[]>([]);
  const hoveredRef = useRef<{ kind: "seat" | "center"; id: number } | null>(
    null
  );

  // Multi-select state for Seer (2 center cards) and Troublemaker (2 seats)
  const [selectedCenters, setSelectedCenters] = useState<number[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const prevStepRef = useRef<string | null>(null);
  const prevPhaseRef = useRef<string | null>(null);

  // Live countdown ticker
  useEffect(() => {
    const t = window.setInterval(() => setNowMs(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);

  // Reset multi-selections & trigger SFX on step/phase transitions
  useEffect(() => {
    if (!playerView) return;
    const stepChanged = prevStepRef.current !== playerView.step;
    const phaseKey = `${playerView.step}:${playerView.night.activePhase ?? ""}`;
    const phaseChanged = prevPhaseRef.current !== phaseKey;

    if (phaseChanged) {
      setSelectedCenters([]);
      setSelectedSeats([]);
      prevPhaseRef.current = phaseKey;
    }

    if (stepChanged) {
      if (playerView.step === "NightStep") {
        playOnuwSfx("night_start", soundEnabled);
      } else if (playerView.step === "DayDiscussionStep") {
        playOnuwSfx("dawn_chime", soundEnabled);
      } else if (playerView.step === "MatchOver") {
        playOnuwSfx("fanfare", soundEnabled);
      }
      prevStepRef.current = playerView.step;
    }
  }, [playerView, soundEnabled]);

  const effectiveNightAction = useMemo(() => {
    if (!playerView || playerView.step !== "NightStep") return null;
    if (!playerView.night.isViewerAwake || playerView.night.hasViewerActed) {
      return null;
    }
    const ph = playerView.night.activePhase;
    if (ph === "doppelganger_action") {
      return playerView.night.doppelgangerActionRole;
    }
    return ph;
  }, [playerView]);

  const canClickSeat = useCallback(
    (seatNo: number): boolean => {
      if (!playerView || viewerSeatNo === null) return false;
      if (seatNo === viewerSeatNo) return false;
      if (playerView.step === "DayVotingStep") return true;
      if (playerView.step === "NightStep" && effectiveNightAction) {
        return (
          effectiveNightAction === "doppelganger" ||
          effectiveNightAction === "seer" ||
          effectiveNightAction === "robber" ||
          effectiveNightAction === "troublemaker"
        );
      }
      return false;
    },
    [playerView, viewerSeatNo, effectiveNightAction]
  );

  const canClickCenter = useCallback((): boolean => {
    if (!playerView || viewerSeatNo === null) return false;
    if (playerView.step !== "NightStep" || !effectiveNightAction) return false;
    if (effectiveNightAction === "werewolf") {
      return playerView.night.isLoneWolf && playerView.allowLoneWolfPeek;
    }
    return effectiveNightAction === "seer" || effectiveNightAction === "drunk";
  }, [playerView, viewerSeatNo, effectiveNightAction]);

  const handleTargetClick = (hit: { kind: "seat" | "center"; id: number }) => {
    if (!playerView || viewerSeatNo === null) return;

    if (playerView.step === "DayVotingStep" && hit.kind === "seat") {
      if (hit.id === viewerSeatNo) return;
      playOnuwSfx("vote_click", soundEnabled);
      onDispatchCommand({ type: "CAST_VOTE", targetSeatNo: hit.id });
      return;
    }

    if (playerView.step !== "NightStep" || !effectiveNightAction) return;

    if (effectiveNightAction === "doppelganger" && hit.kind === "seat") {
      if (hit.id === viewerSeatNo) return;
      playOnuwSfx("card_flip", soundEnabled);
      onDispatchCommand({ type: "DOPPELGANGER_COPY", targetSeatNo: hit.id });
      return;
    }

    if (
      effectiveNightAction === "werewolf" &&
      playerView.night.isLoneWolf &&
      playerView.allowLoneWolfPeek &&
      hit.kind === "center"
    ) {
      playOnuwSfx("card_flip", soundEnabled);
      onDispatchCommand({
        type: "WEREWOLF_PEEK_CENTER",
        centerIdx: hit.id as 0 | 1 | 2,
      });
      return;
    }

    if (effectiveNightAction === "seer") {
      if (hit.kind === "seat" && hit.id !== viewerSeatNo) {
        playOnuwSfx("card_flip", soundEnabled);
        onDispatchCommand({ type: "SEER_PEEK_PLAYER", targetSeatNo: hit.id });
        return;
      }
      if (hit.kind === "center") {
        setSelectedCenters((prev) => {
          if (prev.includes(hit.id)) return prev.filter((c) => c !== hit.id);
          const next = [...prev, hit.id];
          if (next.length === 2) {
            playOnuwSfx("card_flip", soundEnabled);
            onDispatchCommand({
              type: "SEER_PEEK_CENTER",
              centerIndices: [next[0], next[1]],
            });
            return [];
          }
          return next;
        });
        return;
      }
    }

    if (effectiveNightAction === "robber" && hit.kind === "seat") {
      if (hit.id === viewerSeatNo) return;
      playOnuwSfx("card_swap", soundEnabled);
      onDispatchCommand({ type: "ROBBER_SWAP", targetSeatNo: hit.id });
      return;
    }

    if (effectiveNightAction === "troublemaker" && hit.kind === "seat") {
      if (hit.id === viewerSeatNo) return;
      setSelectedSeats((prev) => {
        if (prev.includes(hit.id)) return prev.filter((s) => s !== hit.id);
        const next = [...prev, hit.id];
        if (next.length === 2) {
          playOnuwSfx("card_swap", soundEnabled);
          onDispatchCommand({
            type: "TROUBLEMAKER_SWAP",
            seatA: next[0],
            seatB: next[1],
          });
          return [];
        }
        return next;
      });
      return;
    }

    if (effectiveNightAction === "drunk" && hit.kind === "center") {
      playOnuwSfx("card_swap", soundEnabled);
      onDispatchCommand({
        type: "DRUNK_SWAP_CENTER",
        centerIdx: hit.id as 0 | 1 | 2,
      });
    }
  };

  // Main 60fps Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;

    const render = (ts: number) => {
      const timeSec = ts / 1000;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(260, Math.floor(rect.height));

      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const hitBoxes: HitBox[] = [];

      const step = mode === "lobby" || !playerView ? "Lobby" : playerView.step;
      drawOnuwBackdrop2D(ctx, w, h, step, timeSec);

      const cx = w * 0.5;
      const cy = mode === "lobby" ? h * 0.44 : h * 0.49;
      const minDim = Math.min(w, h);
      const tableR = Math.max(112, Math.min(minDim * 0.29, 196));

      drawOnuwTable2D(ctx, cx, cy, tableR, step, timeSec);

      if (mode === "lobby" || !playerView) {
        // Lobby: 3 mysterious cards on the table + title banner
        const cardW = Math.max(68, Math.min(104, Math.round(tableR * 0.54)));
        const cardH = Math.round(cardW * 1.42);
        const gap = Math.round(cardW * 0.18);
        const startX = cx - (cardW * 3 + gap * 2) / 2;
        for (let i = 0; i < 3; i++) {
          const floatY = Math.sin(timeSec * 1.8 + i * 1.1) * 3.5;
          drawOnuwCardBack2D(
            ctx,
            startX + i * (cardW + gap),
            cy - cardH / 2 + floatY,
            cardW,
            cardH,
            `#${i + 1}`,
            { highlighted: true, timeSec }
          );
        }

        // Title header
        ctx.save();
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
        ctx.shadowBlur = 18;
        ctx.fillStyle = "#fde68a";
        ctx.font = `900 ${Math.max(20, Math.min(36, Math.round(w * 0.036)))}px Georgia, serif`;
        ctx.fillText("ONE NIGHT ULTIMATE WEREWOLF", cx, Math.max(44, h * 0.1));
        ctx.fillStyle = "rgba(203, 213, 225, 0.9)";
        ctx.font = `600 ${Math.max(11, Math.min(15, Math.round(w * 0.015)))}px system-ui, sans-serif`;
        ctx.fillText(
          `Ma Sói Một Đêm • 16 Vai Trò Gốc Bezier Games • ${lobbySeats.length}/10 người chơi`,
          cx,
          Math.max(66, h * 0.1 + 24)
        );
        ctx.restore();

        hitBoxesRef.current = hitBoxes;
        rafId = requestAnimationFrame(render);
        return;
      }

      // === MATCH SCENE ===
      const players = playerView.players;
      const n = players.length;

      // Rotate ring so viewerSeatNo is always at bottom (PI/2)
      const viewerIdx =
        viewerSeatNo !== null
          ? Math.max(
              0,
              players.findIndex((p) => p.seatNo === viewerSeatNo)
            )
          : 0;

      const ringRx = Math.min(w * 0.41, tableR + Math.max(126, minDim * 0.22));
      const ringRy = Math.min(h * 0.35, tableR + Math.max(96, minDim * 0.17));

      const crowdScale = n >= 9 ? 0.84 : n >= 7 ? 0.92 : 1.0;
      const cardW = Math.round(
        Math.max(76, Math.min(112, Math.round(minDim * 0.145))) * crowdScale
      );
      const cardH = Math.round(cardW * 1.42);

      // 1. Center 3 cards on the wooden table
      const cCardW = Math.max(66, Math.min(92, Math.round(tableR * 0.49)));
      const cCardH = Math.round(cCardW * 1.42);
      const cGap = Math.round(cCardW * 0.14);
      const cStartX = cx - (cCardW * 3 + cGap * 2) / 2;
      const cY = cy - cCardH / 2;

      ctx.save();
      ctx.fillStyle = "rgba(253, 230, 138, 0.75)";
      ctx.font = "700 10px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("3 LÁ GIỮA BÀN", cx, cY - 10);
      ctx.restore();

      const centerClickable = canClickCenter();
      for (let i = 0; i < 3; i++) {
        const x = cStartX + i * (cCardW + cGap);
        const cData = playerView.centerCards[i];
        const isSel = selectedCenters.includes(i);
        const isHov =
          hoveredRef.current?.kind === "center" && hoveredRef.current.id === i;

        if (cData?.role) {
          drawOnuwRoleCard2D(ctx, x, cY, cCardW, cCardH, cData.role, {
            highlighted: centerClickable,
            selected: isSel,
            badge:
              playerView.step === "MatchOver" &&
              cData.initialRole &&
              cData.initialRole !== cData.role
                ? "ĐÃ ĐỔI"
                : undefined,
          });
        } else {
          drawOnuwCardBack2D(ctx, x, cY, cCardW, cCardH, `Giữa #${i + 1}`, {
            highlighted: centerClickable,
            selected: isSel,
            hovered: isHov,
            timeSec,
          });
        }

        hitBoxes.push({
          kind: "center",
          id: i,
          x,
          y: cY,
          w: cCardW,
          h: cCardH,
        });
      }

      // 2. Compute seat positions around the table
      const seatCoords = new Map<number, { x: number; y: number }>();
      for (let i = 0; i < n; i++) {
        const rel = (i - viewerIdx + n) % n;
        const angle = Math.PI / 2 + (rel * Math.PI * 2) / n;
        const sx = cx + Math.cos(angle) * ringRx;
        const sy = cy + Math.sin(angle) * ringRy;
        seatCoords.set(players[i].seatNo, { x: sx, y: sy });
      }

      // 3. Draw voting arrows (own vote during voting; all votes at MatchOver)
      if (
        playerView.step === "DayVotingStep" ||
        playerView.step === "MatchOver"
      ) {
        for (const p of players) {
          if (p.votedForSeatNo === null) continue;
          const from = seatCoords.get(p.seatNo);
          const to = seatCoords.get(p.votedForSeatNo);
          if (!from || !to) continue;
          const isHunterShot =
            playerView.step === "MatchOver" &&
            p.isEliminated &&
            p.effectiveFinalRole === "hunter";
          drawVoteArrow2D(
            ctx,
            from.x,
            from.y,
            to.x,
            to.y,
            isHunterShot
              ? "#a3e635"
              : p.seatNo === viewerSeatNo
                ? "#facc15"
                : "rgba(248, 113, 113, 0.78)",
            playerView.step === "DayVotingStep"
          );
        }
      }

      // 4. Draw each player seat & card
      const peekedPlayerMap = new Map<number, OnuwRoleId>();
      if (playerView.privateInfo) {
        for (const pk of playerView.privateInfo.peekedPlayers) {
          peekedPlayerMap.set(pk.seatNo, pk.role);
        }
      }
      const seenWolves = new Set(
        playerView.privateInfo?.seenWerewolfSeats ?? []
      );
      const seenMasons = new Set(playerView.privateInfo?.seenMasonSeats ?? []);

      for (const p of players) {
        const pos = seatCoords.get(p.seatNo);
        if (!pos) continue;
        const isSelf = p.seatNo === viewerSeatNo;
        const clickable = canClickSeat(p.seatNo);
        const isSel =
          selectedSeats.includes(p.seatNo) ||
          (playerView.step === "DayVotingStep" &&
            viewerSeatNo !== null &&
            players.find((x) => x.seatNo === viewerSeatNo)?.votedForSeatNo ===
              p.seatNo);
        const isHov =
          hoveredRef.current?.kind === "seat" &&
          hoveredRef.current.id === p.seatNo;

        const seatCardW = isSelf ? Math.round(cardW * 1.12) : cardW;
        const seatCardH = isSelf ? Math.round(cardH * 1.12) : cardH;
        const cxCard = pos.x - seatCardW / 2;
        const cyCard = pos.y - seatCardH / 2;

        // Determine which role card face to display for this seat
        let displayRole: OnuwRoleId | null = null;
        let cardBadge: string | undefined;

        if (playerView.step === "MatchOver" && p.currentRole) {
          displayRole = p.currentRole;
          if (p.initialRole && p.initialRole !== p.currentRole) {
            cardBadge = `Đầu: ${ONUW_ROLE_META[p.initialRole].icon}`;
          }
        } else if (isSelf) {
          // Viewer sees their latest known card (Robber/Insomniac) or initialRole
          displayRole = peekedPlayerMap.get(p.seatNo) ?? p.initialRole;
          if (
            peekedPlayerMap.has(p.seatNo) &&
            peekedPlayerMap.get(p.seatNo) !== p.initialRole
          ) {
            cardBadge = "MỚI";
          }
        } else if (peekedPlayerMap.has(p.seatNo)) {
          displayRole = peekedPlayerMap.get(p.seatNo) ?? null;
          cardBadge = "ĐÃ SOI";
        }

        if (displayRole) {
          drawOnuwRoleCard2D(ctx, cxCard, cyCard, seatCardW, seatCardH, displayRole, {
            highlighted: clickable || (isSelf && playerView.night.isViewerAwake),
            selected: isSel,
            badge: cardBadge,
            dimmed: playerView.step === "MatchOver" && p.isEliminated,
          });
        } else {
          drawOnuwCardBack2D(
            ctx,
            cxCard,
            cyCard,
            seatCardW,
            seatCardH,
            `#${p.seatNo}`,
            {
              highlighted: clickable,
              selected: isSel,
              hovered: isHov,
              timeSec,
            }
          );
        }

        // Known teammate badges during game (Werewolf / Minion / Mason sight)
        if (playerView.step !== "MatchOver" && !isSelf) {
          if (seenWolves.has(p.seatNo)) {
            ctx.save();
            roundRectPath(ctx, cxCard + 4, cyCard - 10, seatCardW - 8, 16, 6);
            ctx.fillStyle = "#dc2626";
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.font = "800 9px system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🐺 MA SÓI", pos.x, cyCard - 2);
            ctx.restore();
          } else if (seenMasons.has(p.seatNo)) {
            ctx.save();
            roundRectPath(ctx, cxCard + 4, cyCard - 10, seatCardW - 8, 16, 6);
            ctx.fillStyle = "#0284c7";
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.font = "800 9px system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("⚒️ THỢ XÂY", pos.x, cyCard - 2);
            ctx.restore();
          }
        }

        // MatchOver Eliminated / Winner stamps
        if (playerView.step === "MatchOver") {
          if (p.isEliminated) {
            ctx.save();
            roundRectPath(ctx, cxCard - 4, cyCard + seatCardH * 0.36, seatCardW + 8, 20, 6);
            ctx.fillStyle = "rgba(185, 28, 28, 0.92)";
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.font = "900 10px system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
              p.isHunterKill ? "🏹 BỊ BẮN" : "☠️ BỊ LOẠI",
              pos.x,
              cyCard + seatCardH * 0.36 + 10
            );
            ctx.restore();
          }
          if (p.isWinner) {
            ctx.save();
            roundRectPath(ctx, cxCard + 2, cyCard - 13, seatCardW - 4, 17, 6);
            ctx.fillStyle = "#eab308";
            ctx.fill();
            ctx.fillStyle = "#0f172a";
            ctx.font = "900 9px system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("👑 THẮNG", pos.x, cyCard - 4.5);
            ctx.restore();
          }
        }

        // Nameplate pill below card
        const pillW = Math.max(seatCardW + 20, 96);
        const pillH = 22;
        const pillX = pos.x - pillW / 2;
        const pillY = cyCard + seatCardH + 5;
        ctx.save();
        roundRectPath(ctx, pillX, pillY, pillW, pillH, 8);
        ctx.fillStyle = isSelf
          ? "rgba(251, 191, 36, 0.22)"
          : "rgba(15, 23, 42, 0.88)";
        ctx.fill();
        ctx.strokeStyle = isSelf
          ? "rgba(251, 191, 36, 0.7)"
          : p.hasVoted && playerView.step === "DayVotingStep"
            ? "rgba(52, 211, 153, 0.75)"
            : "rgba(148, 163, 184, 0.35)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = isSelf ? "#fde68a" : "#f1f5f9";
        ctx.font = "700 11px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const statusDot =
          playerView.step === "DayVotingStep"
            ? p.hasVoted
              ? " ✓"
              : " …"
            : playerView.step === "RoleRevealStep" ||
                playerView.step === "DayDiscussionStep"
              ? p.isReady
                ? " ✓"
                : ""
              : "";
        ctx.fillText(
          `${p.displayName}${statusDot}`,
          pos.x,
          pillY + pillH / 2,
          pillW - 10
        );
        ctx.restore();

        hitBoxes.push({
          kind: "seat",
          id: p.seatNo,
          x: cxCard - 6,
          y: cyCard - 6,
          w: seatCardW + 12,
          h: seatCardH + 34,
        });
      }

      hitBoxesRef.current = hitBoxes;
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [
    mode,
    lobbySeats,
    playerView,
    viewerSeatNo,
    selectedCenters,
    selectedSeats,
    canClickCenter,
    canClickSeat,
  ]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = hitBoxesRef.current.find(
      (b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h
    );
    hoveredRef.current = hit ? { kind: hit.kind, id: hit.id } : null;
    if (hit) {
      const clickable =
        hit.kind === "seat" ? canClickSeat(hit.id) : canClickCenter();
      canvas.style.cursor = clickable ? "pointer" : "default";
    } else {
      canvas.style.cursor = "default";
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = hitBoxesRef.current.find(
      (b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h
    );
    if (hit) {
      handleTargetClick({ kind: hit.kind, id: hit.id });
    }
  };

  const remainingSec = playerView?.phaseDeadlineMs
    ? Math.max(0, Math.ceil((playerView.phaseDeadlineMs - nowMs) / 1000))
    : null;

  const formatSec = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const viewerPlayer =
    playerView && viewerSeatNo !== null
      ? playerView.players.find((p) => p.seatNo === viewerSeatNo) ?? null
      : null;

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800/90 bg-slate-950 shadow-2xl select-none">
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        className="w-full h-full block touch-none"
      />

      {/* Top Match HUD: Phase Banner + Timer + Night Wake Order Bar */}
      {mode === "match" && playerView && (
        <div className="pointer-events-none absolute top-2.5 inset-x-3 z-10 flex flex-col items-center gap-1.5">
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 shadow-xl text-xs">
            <span className="font-extrabold text-amber-300">
              {playerView.step === "RoleRevealStep"
                ? "🃏 Xem Vai Trò Gốc"
                : playerView.step === "NightStep"
                  ? `🌙 Ban Đêm • ${
                      playerView.night.activePhase
                        ? phaseLabelVi(playerView.night.activePhase)
                        : ""
                    }`
                  : playerView.step === "DayDiscussionStep"
                    ? "☀️ Trời Sáng • Thảo Luận"
                    : playerView.step === "DayVotingStep"
                      ? "👆 Bỏ Phiếu Treo Cổ (Chỉ Tay)"
                      : "🏆 Kết Quả Ván Đấu"}
            </span>
            {remainingSec !== null && (
              <span
                className={`rounded-lg px-2 py-0.5 font-mono font-bold text-xs ${
                  remainingSec <= 10
                    ? "bg-rose-500/25 text-rose-200 border border-rose-500/40"
                    : "bg-slate-800 text-sky-300 border border-slate-700"
                }`}
              >
                ⏱ {formatSec(remainingSec)}
              </span>
            )}
          </div>

          {/* Night Wake Order Strip */}
          {playerView.step === "NightStep" &&
            playerView.night.wakeOrderPhases.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-1 max-w-3xl">
                {playerView.night.wakeOrderPhases.map((ph, idx) => {
                  const isCurrent = ph === playerView.night.activePhase;
                  return (
                    <span
                      key={`${ph}-${idx}`}
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-bold border transition ${
                        isCurrent
                          ? "border-amber-400 bg-amber-500/25 text-amber-200 shadow"
                          : "border-slate-800 bg-slate-950/75 text-slate-400"
                      }`}
                    >
                      {phaseLabelVi(ph)}
                    </span>
                  );
                })}
              </div>
            )}
        </div>
      )}

      {/* Private Notes Drawer (top-left compact card during match) */}
      {mode === "match" &&
        playerView &&
        playerView.step !== "MatchOver" &&
        playerView.privateInfo &&
        playerView.privateInfo.actionNotes.length > 0 && (
          <div className="pointer-events-auto absolute top-14 left-2.5 z-10 max-w-[260px] rounded-xl border border-indigo-400/35 bg-slate-950/85 backdrop-blur-md p-2.5 text-[11px] text-slate-200 shadow-xl hidden sm:block">
            <div className="font-extrabold text-indigo-300 mb-1">
              📜 Ghi Chú Bí Mật Của Bạn
            </div>
            <ul className="space-y-1 text-slate-300 leading-snug">
              {playerView.privateInfo.actionNotes.map((note, idx) => (
                <li key={idx}>• {note}</li>
              ))}
            </ul>
          </div>
        )}

      {/* Bottom Interactive Action Bar (Match) */}
      {mode === "match" && playerView && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2.5 z-10 flex flex-col items-center px-3">
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2.5 rounded-2xl border border-slate-700/80 bg-slate-950/90 backdrop-blur-md px-4 py-2.5 shadow-2xl max-w-3xl text-xs">
            {playerView.step === "RoleRevealStep" && viewerPlayer && (
              <>
                <span className="text-slate-200">
                  Vai trò ban đầu của bạn:{" "}
                  <strong className="text-amber-300">
                    {viewerPlayer.initialRole
                      ? `${ONUW_ROLE_META[viewerPlayer.initialRole].icon} ${ONUW_ROLE_META[viewerPlayer.initialRole].nameVi}`
                      : "Đang chia bài..."}
                  </strong>
                </span>
                <button
                  type="button"
                  disabled={viewerPlayer.isReady}
                  onClick={() => {
                    playOnuwSfx("card_flip", soundEnabled);
                    onDispatchCommand({ type: "CONFIRM_REVEAL" });
                  }}
                  className="rounded-xl bg-amber-400 hover:bg-amber-300 px-4 py-1.5 font-extrabold text-slate-950 transition cursor-pointer disabled:opacity-50"
                >
                  {viewerPlayer.isReady
                    ? "✓ Đã sẵn sàng (chờ người khác)"
                    : "✓ Đã nhớ bài — Bắt đầu Đêm"}
                </button>
              </>
            )}

            {playerView.step === "NightStep" && (
              <>
                {!playerView.night.isViewerAwake ? (
                  <span className="text-slate-300 italic">
                    😴 Bạn đang nhắm mắt... Quản trò đang gọi{" "}
                    <strong className="text-amber-300">
                      {playerView.night.activePhase
                        ? phaseLabelVi(playerView.night.activePhase)
                        : "..."}
                    </strong>
                  </span>
                ) : playerView.night.hasViewerActed ? (
                  <span className="text-emerald-300 font-semibold">
                    ✓ Bạn đã hoàn tất hành động đêm — chờ các người chơi khác…
                  </span>
                ) : effectiveNightAction === "doppelganger" ? (
                  <span className="text-purple-200 font-semibold">
                    🎭 Hãy <strong>bấm vào lá bài của 1 người chơi khác</strong>{" "}
                    trên bàn để sao chép vai trò của họ!
                  </span>
                ) : effectiveNightAction === "werewolf" ? (
                  <>
                    <span className="text-rose-200 font-semibold">
                      {playerView.night.isLoneWolf &&
                      playerView.allowLoneWolfPeek
                        ? "🐺 Bạn là Sói đơn độc! Bấm 1 trong 3 lá giữa bàn để soi, hoặc bỏ qua."
                        : "🐺 Hãy ghi nhớ đồng bọn Ma Sói của bạn (đã đánh dấu đỏ)."}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onDispatchCommand({ type: "WEREWOLF_CONFIRM" })
                      }
                      className="rounded-xl bg-rose-500 hover:bg-rose-400 px-4 py-1.5 font-extrabold text-white cursor-pointer"
                    >
                      ✓ Xác nhận & Nhắm mắt
                    </button>
                  </>
                ) : effectiveNightAction === "minion" ? (
                  <>
                    <span className="text-orange-200 font-semibold">
                      🗡️ Ghi nhớ danh sách Ma Sói (đánh dấu đỏ) để bảo vệ họ!
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onDispatchCommand({ type: "MINION_CONFIRM" })
                      }
                      className="rounded-xl bg-orange-500 hover:bg-orange-400 px-4 py-1.5 font-extrabold text-slate-950 cursor-pointer"
                    >
                      ✓ Xác nhận & Nhắm mắt
                    </button>
                  </>
                ) : effectiveNightAction === "mason" ? (
                  <>
                    <span className="text-sky-200 font-semibold">
                      ⚒️ Ghi nhớ đồng đội Thợ Xây của bạn (đánh dấu xanh).
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onDispatchCommand({ type: "MASON_CONFIRM" })
                      }
                      className="rounded-xl bg-sky-400 hover:bg-sky-300 px-4 py-1.5 font-extrabold text-slate-950 cursor-pointer"
                    >
                      ✓ Xác nhận & Nhắm mắt
                    </button>
                  </>
                ) : effectiveNightAction === "seer" ? (
                  <>
                    <span className="text-indigo-200 font-semibold">
                      🔮 Bấm <strong>1 người chơi khác</strong> HOẶC chọn{" "}
                      <strong>2 lá giữa bàn</strong> ({selectedCenters.length}
                      /2).
                    </span>
                    <button
                      type="button"
                      onClick={() => onDispatchCommand({ type: "SEER_SKIP" })}
                      className="rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 font-bold text-slate-200 cursor-pointer"
                    >
                      Bỏ qua
                    </button>
                  </>
                ) : effectiveNightAction === "robber" ? (
                  <>
                    <span className="text-emerald-200 font-semibold">
                      🦊 Bấm <strong>1 người chơi khác</strong> để tráo bài và
                      xem vai trò mới của bạn.
                    </span>
                    <button
                      type="button"
                      onClick={() => onDispatchCommand({ type: "ROBBER_SKIP" })}
                      className="rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 font-bold text-slate-200 cursor-pointer"
                    >
                      Không tráo
                    </button>
                  </>
                ) : effectiveNightAction === "troublemaker" ? (
                  <>
                    <span className="text-pink-200 font-semibold">
                      🃏 Bấm chọn <strong>2 người chơi khác</strong> để tráo bài
                      của họ ({selectedSeats.length}/2).
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onDispatchCommand({ type: "TROUBLEMAKER_SKIP" })
                      }
                      className="rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 font-bold text-slate-200 cursor-pointer"
                    >
                      Không tráo
                    </button>
                  </>
                ) : effectiveNightAction === "drunk" ? (
                  <span className="text-amber-200 font-semibold">
                    🍺 Bắt buộc bấm chọn <strong>1 trong 3 lá giữa bàn</strong>{" "}
                    để đổi bài (không được xem).
                  </span>
                ) : (
                  <>
                    <span className="text-teal-200 font-semibold">
                      👁️ Hãy xem lá bài hiện tại trước mặt bạn để biết mình có
                      bị tráo không.
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onDispatchCommand({ type: "INSOMNIAC_CONFIRM" })
                      }
                      className="rounded-xl bg-teal-400 hover:bg-teal-300 px-4 py-1.5 font-extrabold text-slate-950 cursor-pointer"
                    >
                      ✓ Xác nhận & Kết thúc Đêm
                    </button>
                  </>
                )}
              </>
            )}

            {playerView.step === "DayDiscussionStep" && (
              <>
                <span className="text-amber-100">
                  ☀️ Thảo luận qua Chat hoặc thoại để tìm Ma Sói! (Lưu ý: bài có
                  thể đã bị tráo trong đêm)
                </span>
                {viewerPlayer && (
                  <button
                    type="button"
                    disabled={viewerPlayer.isReady}
                    onClick={() =>
                      onDispatchCommand({ type: "READY_TO_VOTE" })
                    }
                    className="rounded-xl bg-amber-400 hover:bg-amber-300 px-4 py-1.5 font-extrabold text-slate-950 transition cursor-pointer disabled:opacity-50"
                  >
                    {viewerPlayer.isReady
                      ? `✓ Đã sẵn sàng (${playerView.players.filter((p) => p.isReady).length}/${playerView.players.length})`
                      : "👆 Sẵn sàng Bỏ Phiếu"}
                  </button>
                )}
              </>
            )}

            {playerView.step === "DayVotingStep" && (
              <span className="text-rose-200 font-semibold">
                👆 Bấm trực tiếp vào <strong>1 người chơi khác</strong> trên bàn
                để chỉ tay treo cổ!{" "}
                <span className="text-slate-400 font-normal">
                  (Đã bỏ phiếu:{" "}
                  {playerView.players.filter((p) => p.hasVoted).length}/
                  {playerView.players.length})
                </span>
              </span>
            )}

            {playerView.step === "MatchOver" && (
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  {playerView.winningFactions.map((f) => (
                    <span
                      key={f}
                      style={{
                        backgroundColor: ONUW_FACTION_META[f].bg,
                        color: ONUW_FACTION_META[f].accent,
                        borderColor: ONUW_FACTION_META[f].accent,
                      }}
                      className="rounded-lg border px-2.5 py-1 font-extrabold text-xs"
                    >
                      🏆 {ONUW_FACTION_META[f].nameVi} THẮNG
                    </span>
                  ))}
                </div>
                {playerView.winReasonVi && (
                  <span className="text-slate-200 font-medium">
                    {playerView.winReasonVi}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="rounded-xl border border-indigo-400/50 bg-indigo-500/20 hover:bg-indigo-500/35 px-3 py-1.5 font-bold text-indigo-200 cursor-pointer"
                >
                  📜 Diễn Biến Đêm
                </button>
                {isHost && (
                  <button
                    type="button"
                    onClick={onRematch}
                    className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 px-4 py-1.5 font-extrabold text-slate-950 cursor-pointer shadow"
                  >
                    🔁 Ván Mới
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Night History Timeline Modal (MatchOver) */}
      {showHistoryModal && playerView?.nightHistory && (
        <div
          onClick={() => setShowHistoryModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[80vh] rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col overflow-hidden text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-950/70">
              <span className="font-extrabold text-amber-300 text-sm">
                📜 Toàn Bộ Diễn Biến Trong Đêm
              </span>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 font-bold text-slate-200 cursor-pointer"
              >
                Đóng ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 text-slate-200">
              {playerView.nightHistory.length === 0 ? (
                <p className="text-slate-400 italic">
                  Không có hành động đặc biệt nào diễn ra trong đêm.
                </p>
              ) : (
                playerView.nightHistory.map((h, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2"
                  >
                    <span className="text-[10px] font-bold text-amber-400 uppercase mr-2">
                      #{idx + 1} {phaseLabelVi(h.phase)}
                    </span>
                    <p className="mt-0.5 text-slate-200">{h.summaryVi}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
