"use client";

import React, { useEffect, useRef } from "react";
import {
  drawRoundedRect,
  findHitRegionAtPoint,
  ParticleSystem,
  type HitRegion,
} from "@/canvas/engine";
import {
  drawCarcassonneDrawPile2D,
  drawCarcassonneMeeple2D,
  drawCarcassonneTile2D,
  drawCarcassonneTileBack2D,
  getCarcassonneLobbyBgImage,
} from "@/canvas/carcassonne-art";
import { playCarcassonneSfx } from "@/canvas/carcassonne-fx";
import {
  ALL_TILE_TEMPLATES,
  canPlaceTileAt,
  CARCASSONNE_COLOR_META,
  coordKey,
  getAllValidTilePlacements,
  type CarcassonneCommand,
  type CarcassonnePlayerView,
  type MeepleType,
} from "@/cartridges/carcassonne";
import type { LobbySeatItem } from "@/components/werewolf-canvas";

function findValidRotationsAt(
  view: CarcassonnePlayerView,
  gx: number,
  gy: number,
  startRot: number
): number[] {
  if (!view.currentTile) return [];
  const valid: number[] = [];
  const base = startRot & 3;
  for (let step = 0; step < 4; step++) {
    const r = (base + step) & 3;
    if (
      canPlaceTileAt(view.board, view.currentTile, gx, gy, r, view.lastRiverDir)
    ) {
      valid.push(r);
    }
  }
  return valid;
}

export interface CarcassonneCanvasProps {
  mode: "lobby" | "match";
  lobbySeats: LobbySeatItem[];
  isHost?: boolean;
  viewerSeatNo: number | null;
  playerView: CarcassonnePlayerView | null;
  soundEnabled?: boolean;
  onRematch?: () => void;
  onDispatchCommand: (cmd: CarcassonneCommand) => void;
}

export function CarcassonneCanvas({
  mode,
  lobbySeats,
  isHost = false,
  viewerSeatNo,
  playerView,
  soundEnabled = true,
  onRematch,
  onDispatchCommand,
}: CarcassonneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hitRegionsRef = useRef<HitRegion[]>([]);
  const hoveredIdRef = useRef<string | null>(null);
  const particlesRef = useRef<ParticleSystem>(new ParticleSystem());

  // Camera pan/zoom state (world units = tile grid coordinates)
  const camRef = useRef({ x: 0, y: 0, tileSize: 82 });
  const dragRef = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    startY: number;
    origCamX: number;
    origCamY: number;
  }>({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    origCamX: 0,
    origCamY: 0,
  });

  // Current tile rotation, movable draft placement, & preferred meeple type
  const rotationRef = useRef<number>(0);
  const draftPlacementRef = useRef<{
    x: number;
    y: number;
    rotation: number;
  } | null>(null);
  const preferredMeepleRef = useRef<MeepleType>("standard");
  const lastActionSeqRef = useRef<number>(0);
  const lastTilePopRef = useRef<{ key: string; startMs: number } | null>(null);
  const drawFlightRef = useRef<{
    startMs: number;
    durMs: number;
    card: NonNullable<CarcassonnePlayerView["currentTile"]>;
  } | null>(null);
  const completionRingsRef = useRef<
    Array<{
      x: number;
      y: number;
      color: string;
      startMs: number;
      durMs: number;
      delayMs: number;
    }>
  >([]);
  const completedFeatureFxRef = useRef<
    Array<{
      kind: "city" | "road" | "monastery" | "garden";
      tiles: Array<{ x: number; y: number }>;
      center: { x: number; y: number };
      color: string;
      startMs: number;
      durMs: number;
    }>
  >([]);
  const celebrationBannerRef = useRef<{
    title: string;
    subtitle: string;
    color: string;
    startMs: number;
    durMs: number;
  } | null>(null);
  const activePopupsRef = useRef<
    Array<{
      x: number;
      y: number;
      text: string;
      color: string;
      startMs: number;
      durMs: number;
    }>
  >([]);

  const propsRef = useRef({
    mode,
    lobbySeats,
    isHost,
    viewerSeatNo,
    playerView,
    soundEnabled,
    onRematch,
    onDispatchCommand,
  });

  useEffect(() => {
    propsRef.current = {
      mode,
      lobbySeats,
      isHost,
      viewerSeatNo,
      playerView,
      soundEnabled,
      onRematch,
      onDispatchCommand,
    };
  });

  // React to state transitions: SFX, tile drop animation, score popups, auto-rotate to valid orientation
  useEffect(() => {
    if (!playerView) return;
    if (
      playerView.step !== "PlaceTileStep" ||
      playerView.activeSeatNo !== viewerSeatNo
    ) {
      draftPlacementRef.current = null;
    }
    if (playerView.actionSeq === lastActionSeqRef.current) return;
    lastActionSeqRef.current = playerView.actionSeq;
    draftPlacementRef.current = null;

    const nowMs = performance.now();

    if (playerView.lastPlacedCoord) {
      const k = coordKey(
        playerView.lastPlacedCoord.x,
        playerView.lastPlacedCoord.y
      );
      lastTilePopRef.current = { key: k, startMs: nowMs };
      playCarcassonneSfx("tile_place", soundEnabled);

      // Spawn warm tabletop dust puffs & subtle golden sparkles around the 4 edges on touchdown
      const canvas = canvasRef.current;
      const cw = canvas ? canvas.clientWidth : 900;
      const ch = canvas ? canvas.clientHeight : 600;
      const ts = Math.round(camRef.current.tileSize);
      const originX = Math.round(cw / 2 - camRef.current.x * ts - ts / 2);
      const originY = Math.round(ch / 2 - camRef.current.y * ts - ts / 2);
      const cx = originX + playerView.lastPlacedCoord.x * ts + ts / 2;
      const cy = originY + playerView.lastPlacedCoord.y * ts + ts / 2;
      const dustColors = ["#fde68a", "#fef3c7", "#d6c7ab", "#ffffff"];
      for (let i = 0; i < 14; i++) {
        const ang = (Math.PI * 2 * i) / 14 + (i % 2) * 0.15;
        const edgeDist = ts * 0.42;
        const speed = 34 + (i % 4) * 18;
        particlesRef.current.spawn({
          x: cx + Math.cos(ang) * edgeDist,
          y: cy + Math.sin(ang) * edgeDist,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          radius: 2 + (i % 3) * 0.9,
          color: dustColors[i % dustColors.length],
          life: 0.36 + (i % 3) * 0.1,
          maxLife: 0.56,
        });
      }
    }

    if (playerView.scorePopups.length > 0) {
      const hasCity = playerView.scorePopups.some((sp) =>
        sp.labelVi.toLowerCase().includes("thành")
      );
      playCarcassonneSfx(
        hasCity ? "complete_city" : "score_chime",
        soundEnabled
      );

      const canvas = canvasRef.current;
      const cw = canvas ? canvas.clientWidth : 900;
      const ch = canvas ? canvas.clientHeight : 600;
      const ts = Math.round(camRef.current.tileSize);
      const originX = Math.round(cw / 2 - camRef.current.x * ts - ts / 2);
      const originY = Math.round(ch / 2 - camRef.current.y * ts - ts / 2);

      for (const sp of playerView.scorePopups) {
        const col = CARCASSONNE_COLOR_META[sp.color].light;
        activePopupsRef.current.push({
          x: sp.x,
          y: sp.y,
          text: `+${sp.points} ${sp.labelVi.split("(")[0].trim()}`,
          color: col,
          startMs: nowMs,
          durMs: 1900,
        });
        // Register full-feature perimeter / sanctuary highlight animation
        const inferredKind: "city" | "road" | "monastery" | "garden" =
          sp.kind ??
          (sp.labelVi.toLowerCase().includes("thành")
            ? "city"
            : sp.labelVi.toLowerCase().includes("tu viện")
              ? "monastery"
              : sp.labelVi.toLowerCase().includes("vườn")
                ? "garden"
                : "road");
        const fxTiles =
          sp.tileCoords && sp.tileCoords.length > 0
            ? sp.tileCoords
            : [{ x: sp.x, y: sp.y }];
        completedFeatureFxRef.current.push({
          kind: inferredKind,
          tiles: fxTiles,
          center: { x: sp.x, y: sp.y },
          color: col,
          startMs: nowMs,
          durMs: inferredKind === "city" || inferredKind === "monastery" ? 1850 : 1400,
        });

        // Two concentric expanding golden shockwave rings around the completed feature
        completionRingsRef.current.push(
          { x: sp.x, y: sp.y, color: "#fde047", startMs: nowMs, durMs: 950, delayMs: 0 },
          { x: sp.x, y: sp.y, color: col, startMs: nowMs, durMs: 1050, delayMs: 160 }
        );

        // Festive confetti/sparkle particle bursts across the completed feature tiles
        const burstTargets =
          inferredKind === "city" ? fxTiles.slice(0, 6) : [{ x: sp.x, y: sp.y }];
        const perTileCount = Math.max(8, Math.floor(26 / burstTargets.length));
        const burstColors = ["#fde047", "#ffffff", col, "#38bdf8", "#4ade80"];
        for (const bt of burstTargets) {
          const sx = originX + bt.x * ts + ts / 2;
          const sy = originY + bt.y * ts + ts / 2;
          for (let i = 0; i < perTileCount; i++) {
            const ang = (Math.PI * 2 * i) / perTileCount + (i % 3) * 0.12;
            const speed = 55 + (i % 5) * 30;
            particlesRef.current.spawn({
              x: sx,
              y: sy,
              vx: Math.cos(ang) * speed,
              vy: Math.sin(ang) * speed - 22,
              radius: 2.5 + (i % 3) * 1.1,
              color: burstColors[i % burstColors.length],
              life: 0.75 + (i % 4) * 0.16,
              maxLife: 1.25,
            });
          }
        }
      }

      // Celebratory top-center completion banner
      const topPopup = [...playerView.scorePopups].sort(
        (a, b) => b.points - a.points
      )[0];
      const lbl = topPopup.labelVi.toLowerCase();
      const icon = lbl.includes("thành")
        ? "🏰"
        : lbl.includes("đường")
          ? "🛣"
          : lbl.includes("tu viện")
            ? "⛪"
            : lbl.includes("vườn")
              ? "🌸"
              : "✨";
      const seat = playerView.seats.find((s) => s.seatNo === topPopup.seatNo);
      celebrationBannerRef.current = {
        title: `${icon} HOÀN THÀNH ${topPopup.labelVi.split("(")[0].trim().toUpperCase()}!`,
        subtitle: `${seat?.displayName ?? "Người chơi"} nhận +${topPopup.points} điểm`,
        color: CARCASSONNE_COLOR_META[topPopup.color].light,
        startMs: nowMs,
        durMs: 2300,
      };
    }

    if (playerView.step === "MatchOver") {
      playCarcassonneSfx("fanfare", soundEnabled);
    }

    // Trigger 3D draw-and-flip flight animation when entering PlaceTileStep with a newly drawn tile
    if (playerView.step === "PlaceTileStep" && playerView.currentTile) {
      drawFlightRef.current = {
        startMs: nowMs,
        durMs: 540,
        card: playerView.currentTile,
      };
      playCarcassonneSfx("tile_draw", soundEnabled);
      const allValid = getAllValidTilePlacements(
        playerView.board,
        playerView.currentTile,
        playerView.lastRiverDir
      );
      const hasCurRot = allValid.some(
        (m) => m.rotation === (rotationRef.current & 3)
      );
      if (!hasCurRot && allValid.length > 0) {
        rotationRef.current = allValid[0].rotation;
      }
    }
  }, [playerView, soundEnabled, viewerSeatNo]);

  // Keyboard shortcuts: R / Space to rotate, Enter to confirm draft, Escape to cancel draft
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const pv = propsRef.current.playerView;
      if (!pv || pv.activeSeatNo !== propsRef.current.viewerSeatNo) {
        return;
      }
      if (pv.step === "DrawTileStep") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          propsRef.current.onDispatchCommand({ type: "DRAW_TILE" });
        }
        return;
      }
      if (pv.step !== "PlaceTileStep") {
        return;
      }
      if (e.key === "r" || e.key === "R" || e.key === " ") {
        e.preventDefault();
        const draft = draftPlacementRef.current;
        if (draft && pv.currentTile) {
          const validRots = findValidRotationsAt(
            pv,
            draft.x,
            draft.y,
            draft.rotation + 1
          );
          if (validRots.length > 0 && validRots[0] !== draft.rotation) {
            const nextDraft = { ...draft, rotation: validRots[0] };
            draftPlacementRef.current = nextDraft;
            rotationRef.current = validRots[0];
            propsRef.current.onDispatchCommand({
              type: "STAGE_TILE",
              x: nextDraft.x,
              y: nextDraft.y,
              rotation: nextDraft.rotation,
            });
            playCarcassonneSfx("tile_rotate", propsRef.current.soundEnabled);
          }
        } else {
          rotationRef.current = (rotationRef.current + 1) & 3;
          playCarcassonneSfx("tile_rotate", propsRef.current.soundEnabled);
        }
      } else if (e.key === "Enter" && draftPlacementRef.current) {
        e.preventDefault();
        const draft = draftPlacementRef.current;
        draftPlacementRef.current = null;
        propsRef.current.onDispatchCommand({
          type: "PLACE_TILE",
          x: draft.x,
          y: draft.y,
          rotation: draft.rotation & 3,
        });
      } else if (e.key === "Escape" && draftPlacementRef.current) {
        e.preventDefault();
        draftPlacementRef.current = null;
        propsRef.current.onDispatchCommand({ type: "CLEAR_DRAFT" });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
      if (
        canvas.width !== Math.floor(w * dpr) ||
        canvas.height !== Math.floor(h * dpr)
      ) {
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
        drawCarcassonneLobby(ctx, w, h, now);
      } else {
        drawCarcassonneMatch(
          ctx,
          w,
          h,
          now,
          p.playerView,
          p.isHost,
          camRef.current,
          rotationRef.current,
          draftPlacementRef.current,
          preferredMeepleRef.current,
          lastTilePopRef.current,
          drawFlightRef.current,
          completionRingsRef.current,
          completedFeatureFxRef.current,
          celebrationBannerRef.current,
          activePopupsRef.current,
          hoveredIdRef.current,
          regions
        );
        // Clean expired popups & completion animations
        activePopupsRef.current = activePopupsRef.current.filter(
          (pp) => now - pp.startMs <= pp.durMs
        );
        completionRingsRef.current = completionRingsRef.current.filter(
          (rr) => now - rr.startMs <= rr.durMs + rr.delayMs
        );
        completedFeatureFxRef.current = completedFeatureFxRef.current.filter(
          (fx) => now - fx.startMs <= fx.durMs
        );
        if (
          celebrationBannerRef.current &&
          now - celebrationBannerRef.current.startMs >
            celebrationBannerRef.current.durMs
        ) {
          celebrationBannerRef.current = null;
        }
        if (
          drawFlightRef.current &&
          now - drawFlightRef.current.startMs > drawFlightRef.current.durMs
        ) {
          drawFlightRef.current = null;
        }
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
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button === 2) return; // handled by contextmenu (rotate)
      const pt = getLocalPoint(e);
      dragRef.current = {
        active: true,
        moved: false,
        startX: pt.x,
        startY: pt.y,
        origCamX: camRef.current.x,
        origCamY: camRef.current.y,
      };
    };

    const onPointerMove = (e: PointerEvent) => {
      const pt = getLocalPoint(e);
      if (dragRef.current.active) {
        const dx = pt.x - dragRef.current.startX;
        const dy = pt.y - dragRef.current.startY;
        if (Math.hypot(dx, dy) > 6) {
          dragRef.current.moved = true;
          camRef.current.x = dragRef.current.origCamX - dx / camRef.current.tileSize;
          camRef.current.y = dragRef.current.origCamY - dy / camRef.current.tileSize;
          canvas.style.cursor = "grabbing";
          return;
        }
      }
      const hit = findHitRegionAtPoint(hitRegionsRef.current, pt.x, pt.y);
      hoveredIdRef.current = hit ? hit.id : null;
      canvas.style.cursor = hit ? "pointer" : "grab";
    };

    const onPointerUp = (e: PointerEvent) => {
      const wasDragged = dragRef.current.moved;
      dragRef.current.active = false;
      dragRef.current.moved = false;
      if (wasDragged) return;

      const pt = getLocalPoint(e);
      const hit = findHitRegionAtPoint(hitRegionsRef.current, pt.x, pt.y);
      if (!hit) return;

      const p = propsRef.current;

      if (hit.id === "btn_draw_tile") {
        p.onDispatchCommand({ type: "DRAW_TILE" });
        return;
      }
      if (hit.id === "dock_tile_preview") {
        const draft = draftPlacementRef.current;
        const pv = p.playerView;
        if (draft && pv?.currentTile) {
          const validRots = findValidRotationsAt(
            pv,
            draft.x,
            draft.y,
            draft.rotation + 1
          );
          if (validRots.length > 0 && validRots[0] !== draft.rotation) {
            const nextDraft = { ...draft, rotation: validRots[0] };
            draftPlacementRef.current = nextDraft;
            rotationRef.current = validRots[0];
            p.onDispatchCommand({
              type: "STAGE_TILE",
              x: nextDraft.x,
              y: nextDraft.y,
              rotation: nextDraft.rotation,
            });
            playCarcassonneSfx("tile_rotate", p.soundEnabled);
          }
        } else {
          rotationRef.current = (rotationRef.current + 1) & 3;
          playCarcassonneSfx("tile_rotate", p.soundEnabled);
        }
        return;
      }
      if (hit.id === "btn_confirm_tile") {
        const draft = draftPlacementRef.current ?? p.playerView?.draftPlacement ?? null;
        if (!draft) return;
        draftPlacementRef.current = null;
        p.onDispatchCommand({
          type: "PLACE_TILE",
          x: draft.x,
          y: draft.y,
          rotation: draft.rotation & 3,
        });
        return;
      }
      if (hit.id === "btn_cancel_draft") {
        draftPlacementRef.current = null;
        p.onDispatchCommand({ type: "CLEAR_DRAFT" });
        return;
      }
      if (hit.id === "draft_tile") {
        const draft = draftPlacementRef.current ?? p.playerView?.draftPlacement ?? null;
        const pv = p.playerView;
        if (!draft || !pv?.currentTile) return;
        // Cycle to the next valid rotation at this exact cell
        for (let step = 1; step <= 3; step++) {
          const tryRot = (draft.rotation + step) & 3;
          if (
            canPlaceTileAt(
              pv.board,
              pv.currentTile,
              draft.x,
              draft.y,
              tryRot,
              pv.lastRiverDir
            )
          ) {
            const nextDraft = { ...draft, rotation: tryRot };
            draftPlacementRef.current = nextDraft;
            rotationRef.current = tryRot;
            p.onDispatchCommand({
              type: "STAGE_TILE",
              x: nextDraft.x,
              y: nextDraft.y,
              rotation: nextDraft.rotation,
            });
            playCarcassonneSfx("tile_rotate", p.soundEnabled);
            break;
          }
        }
        return;
      }
      if (hit.id === "btn_zoom_in") {
        camRef.current.tileSize = Math.min(132, camRef.current.tileSize + 14);
        return;
      }
      if (hit.id === "btn_zoom_out") {
        camRef.current.tileSize = Math.max(44, camRef.current.tileSize - 14);
        return;
      }
      if (hit.id === "btn_center") {
        camRef.current.x = 0;
        camRef.current.y = 0;
        camRef.current.tileSize = 82;
        return;
      }
      if (hit.id === "btn_skip_meeple") {
        p.onDispatchCommand({ type: "SKIP_MEEPLE" });
        return;
      }
      if (hit.id === "btn_recall_abbot") {
        p.onDispatchCommand({ type: "RECALL_ABBOT" });
        return;
      }
      if (hit.id === "btn_toggle_meeple_type") {
        preferredMeepleRef.current =
          preferredMeepleRef.current === "abbot" ? "standard" : "abbot";
        return;
      }
      if (hit.id === "btn_rematch") {
        p.onRematch?.();
        return;
      }

      if (hit.id.startsWith("place_cell:")) {
        const pv = p.playerView;
        if (!pv?.currentTile) return;
        const [, xs, ys] = hit.id.split(":");
        const gx = Number(xs);
        const gy = Number(ys);
        const validRots = findValidRotationsAt(pv, gx, gy, rotationRef.current);
        if (validRots.length === 0) return;
        const bestRot = validRots[0];
        rotationRef.current = bestRot;
        draftPlacementRef.current = {
          x: gx,
          y: gy,
          rotation: bestRot,
        };
        p.onDispatchCommand({
          type: "STAGE_TILE",
          x: gx,
          y: gy,
          rotation: bestRot,
        });
        playCarcassonneSfx("tile_place", p.soundEnabled);
        return;
      }

      if (hit.id.startsWith("meeple_opt:")) {
        const featureId = hit.id.slice("meeple_opt:".length);
        const pv = p.playerView;
        const opt = pv?.validMeepleOptions.find(
          (o) => o.featureId === featureId
        );
        if (!opt) return;
        const chosenType: MeepleType = opt.meepleTypes.includes(
          preferredMeepleRef.current
        )
          ? preferredMeepleRef.current
          : opt.meepleTypes[0];
        playCarcassonneSfx("meeple_place", p.soundEnabled);
        p.onDispatchCommand({
          type: "PLACE_MEEPLE",
          featureId,
          meepleType: chosenType,
        });
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const pv = propsRef.current.playerView;
      if (
        pv &&
        pv.step === "PlaceTileStep" &&
        pv.activeSeatNo === propsRef.current.viewerSeatNo
      ) {
        const draft = draftPlacementRef.current;
        if (draft && pv.currentTile) {
          const validRots = findValidRotationsAt(
            pv,
            draft.x,
            draft.y,
            draft.rotation + 1
          );
          if (validRots.length > 0 && validRots[0] !== draft.rotation) {
            const nextDraft = { ...draft, rotation: validRots[0] };
            draftPlacementRef.current = nextDraft;
            rotationRef.current = validRots[0];
            propsRef.current.onDispatchCommand({
              type: "STAGE_TILE",
              x: nextDraft.x,
              y: nextDraft.y,
              rotation: nextDraft.rotation,
            });
            playCarcassonneSfx("tile_rotate", propsRef.current.soundEnabled);
          }
        } else {
          rotationRef.current = (rotationRef.current + 1) & 3;
          playCarcassonneSfx("tile_rotate", propsRef.current.soundEnabled);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -8 : 8;
      camRef.current.tileSize = Math.max(
        44,
        Math.min(136, camRef.current.tileSize + delta)
      );
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("contextmenu", onContextMenu);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("contextmenu", onContextMenu);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 bg-stone-950 shadow-2xl select-none">
      <canvas ref={canvasRef} className="w-full h-full block touch-none" />
    </div>
  );
}

function drawWoodTableBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
) {
  const grad = ctx.createRadialGradient(
    w * 0.5,
    h * 0.48,
    40,
    w * 0.5,
    h * 0.5,
    Math.max(w, h) * 0.75
  );
  grad.addColorStop(0, "#2c221b");
  grad.addColorStop(1, "#16110e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawCarcassonneLobby(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  now: number
) {
  const bg = getCarcassonneLobbyBgImage();
  if (bg) {
    // Full-bleed aspect-preserving cover crop with subtle gentle breathing motion
    const scaleBase = Math.max(w / bg.naturalWidth, h / bg.naturalHeight);
    const zoom = scaleBase * (1.03 + 0.012 * Math.sin(now * 0.0005));
    const dw = bg.naturalWidth * zoom;
    const dh = bg.naturalHeight * zoom;
    const panX = Math.sin(now * 0.00035) * 10;
    const dx = (w - dw) / 2 + panX;
    const dy = (h - dh) / 2;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bg, dx, dy, dw, dh);

    // Subtle top & bottom gradient scrims so title & player cards stay super crisp
    const topGrad = ctx.createLinearGradient(0, 0, 0, h * 0.32);
    topGrad.addColorStop(0, "rgba(15, 23, 42, 0.72)");
    topGrad.addColorStop(0.65, "rgba(15, 23, 42, 0.25)");
    topGrad.addColorStop(1, "rgba(15, 23, 42, 0)");
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, h * 0.32);

    const botGrad = ctx.createLinearGradient(0, h * 0.62, 0, h);
    botGrad.addColorStop(0, "rgba(15, 23, 42, 0)");
    botGrad.addColorStop(0.5, "rgba(15, 23, 42, 0.45)");
    botGrad.addColorStop(1, "rgba(15, 23, 42, 0.85)");
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
    ctx.restore();
  } else {
    drawWoodTableBackground(ctx, w, h);
  }

  const cx = w / 2;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(15, 23, 42, 0.85)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = "#fde047";
  ctx.font = "900 11px system-ui, sans-serif";
  ctx.fillText(
    "PHIÊN BẢN C3 (2021) • 72 MẢNH ĐẤT • SÔNG & TU VIỆN TRƯỞNG",
    cx,
    Math.max(30, h * 0.08)
  );

  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${Math.min(48, Math.max(28, w * 0.058))}px Georgia, serif`;
  ctx.fillText("CARCASSONNE", cx, Math.max(66, h * 0.16));
  ctx.restore();
}

function drawCarcassonneMatch(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  now: number,
  view: CarcassonnePlayerView,
  isHost: boolean,
  cam: { x: number; y: number; tileSize: number },
  rotation: number,
  draftPlacement: { x: number; y: number; rotation: number } | null,
  preferredMeeple: MeepleType,
  lastTilePop: { key: string; startMs: number } | null,
  drawFlight: {
    startMs: number;
    durMs: number;
    card: NonNullable<CarcassonnePlayerView["currentTile"]>;
  } | null,
  completionRings: Array<{
    x: number;
    y: number;
    color: string;
    startMs: number;
    durMs: number;
    delayMs: number;
  }>,
  completedFeatureFx: Array<{
    kind: "city" | "road" | "monastery" | "garden";
    tiles: Array<{ x: number; y: number }>;
    center: { x: number; y: number };
    color: string;
    startMs: number;
    durMs: number;
  }>,
  celebrationBanner: {
    title: string;
    subtitle: string;
    color: string;
    startMs: number;
    durMs: number;
  } | null,
  activePopups: Array<{
    x: number;
    y: number;
    text: string;
    color: string;
    startMs: number;
    durMs: number;
  }>,
  hoveredId: string | null,
  regions: HitRegion[]
) {
  drawWoodTableBackground(ctx, w, h);

  // Subtle tabletop touchdown micro-shake (damped vertical thump when tile snaps down)
  let shakeY = 0;
  if (lastTilePop) {
    const impactAge = now - lastTilePop.startMs - 115;
    if (impactAge >= 0 && impactAge < 120) {
      const st = impactAge / 120;
      shakeY = Math.sin(st * Math.PI * 2.5) * (1 - st) * 2.4;
    }
  }

  const ts = Math.round(cam.tileSize);
  const originX = Math.round(w / 2 - cam.x * ts - ts / 2);
  const originY = Math.round(h / 2 - cam.y * ts - ts / 2 + shakeY);
  const worldToScreen = (gx: number, gy: number) => ({
    sx: originX + gx * ts,
    sy: originY + gy * ts,
  });

  // Subtle grid dots on tabletop
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  const minGx = Math.floor(cam.x - w / (2 * ts) - 1);
  const maxGx = Math.ceil(cam.x + w / (2 * ts) + 1);
  const minGy = Math.floor(cam.y - h / (2 * ts) - 1);
  const maxGy = Math.ceil(cam.y + h / (2 * ts) + 1);
  for (let gx = minGx; gx <= maxGx; gx++) {
    for (let gy = minGy; gy <= maxGy; gy++) {
      const { sx, sy } = worldToScreen(gx, gy);
      ctx.fillRect(sx - 1, sy - 1, 2, 2);
    }
  }
  ctx.restore();

  const isMyTurn =
    view.viewerSeatNo !== null && view.activeSeatNo === view.viewerSeatNo;

  // 1. Draw all placed tiles on the map (defer active dropping tile so it renders above neighbors!)
  let droppingTile: {
    tile: CarcassonnePlayerView["board"][string];
    sx: number;
    sy: number;
    age: number;
    isLast: boolean;
  } | null = null;

  for (const tile of Object.values(view.board)) {
    const { sx, sy } = worldToScreen(tile.x, tile.y);
    if (sx + ts < -20 || sx > w + 20 || sy + ts < -20 || sy > h + 20) continue;

    const k = coordKey(tile.x, tile.y);
    const isLast =
      view.lastPlacedCoord?.x === tile.x && view.lastPlacedCoord?.y === tile.y;

    if (lastTilePop && lastTilePop.key === k) {
      const age = now - lastTilePop.startMs;
      if (age >= 0 && age < 460) {
        droppingTile = { tile, sx, sy, age, isLast };
        continue;
      }
    }

    drawCarcassonneTile2D(
      ctx,
      sx,
      sy,
      ts,
      { templateCode: tile.templateCode, hasGarden: tile.hasGarden },
      tile.rotation,
      {
        highlightBorder: isLast ? "#fde047" : undefined,
        meeples: tile.meeples,
      }
    );
  }

  // 1b. Render newly placed tile with 3D elevated drop-in, tightening shadow, elastic snap & golden seam flash
  if (droppingTile) {
    const { tile, sx, sy, age, isLast } = droppingTile;
    const dropDur = 210;
    const settleDur = 150;

    let scale = 1;
    let liftY = 0;
    let shadowBlur = 0;
    let shadowOffsetY = 0;

    if (age < dropDur) {
      const t = age / dropDur;
      const easeIn = t * t;
      scale = 1.24 - 0.28 * easeIn; // 1.24 -> 0.96 squash at impact
      liftY = -24 * (1 - easeIn);
      shadowBlur = 22 * (1 - easeIn) + 4;
      shadowOffsetY = 14 * (1 - easeIn) + 2;
    } else if (age < dropDur + settleDur) {
      const t = (age - dropDur) / settleDur;
      // Elastic rebound from 0.96 -> 1.03 -> 1.0
      scale = 1 - 0.04 * Math.cos(t * Math.PI * 1.5) * (1 - t);
    }

    // Expanding golden snap-flash border right after touchdown
    if (age >= 100 && age < 460) {
      const ft = (age - 100) / 360;
      const easeOut = 1 - Math.pow(1 - ft, 3);
      const padGlow = easeOut * 14;
      ctx.save();
      ctx.globalAlpha = Math.max(0, (1 - ft) * 0.9);
      drawRoundedRect(
        ctx,
        sx - padGlow,
        sy - padGlow,
        ts + padGlow * 2,
        ts + padGlow * 2,
        8 + easeOut * 4
      );
      ctx.lineWidth = Math.max(1.5, (1 - ft) * 4.5);
      ctx.strokeStyle = "#fde047";
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    if (shadowBlur > 0) {
      ctx.shadowColor = "rgba(2, 6, 23, 0.65)";
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetY = shadowOffsetY;
    }
    ctx.translate(sx + ts / 2, sy + ts / 2 + liftY);
    ctx.scale(scale, scale);
    ctx.translate(-(sx + ts / 2), -(sy + ts / 2));
    drawCarcassonneTile2D(
      ctx,
      sx,
      sy,
      ts,
      { templateCode: tile.templateCode, hasGarden: tile.hasGarden },
      tile.rotation,
      {
        highlightBorder: isLast ? "#fde047" : "#fef08a",
        meeples: tile.meeples,
      }
    );
    ctx.restore();
  }

  // 2. Valid placement ghost cells during PlaceTileStep on viewer's turn
  if (isMyTurn && view.step === "PlaceTileStep" && view.currentTile) {
    const candidates = new Set<string>();
    for (const tile of Object.values(view.board)) {
      const dirs = [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ];
      for (const [dx, dy] of dirs) {
        const nk = coordKey(tile.x + dx, tile.y + dy);
        if (!view.board[nk]) candidates.add(nk);
      }
    }

    const pulse = 0.25 + 0.15 * Math.sin(now * 0.007);
    for (const nk of candidates) {
      const [xs, ys] = nk.split(",");
      const gx = Number(xs);
      const gy = Number(ys);
      const validRots = findValidRotationsAt(view, gx, gy, rotation);
      if (validRots.length === 0) continue;

      const isDraftCell =
        draftPlacement !== null &&
        draftPlacement.x === gx &&
        draftPlacement.y === gy;
      if (isDraftCell) continue;

      const { sx, sy } = worldToScreen(gx, gy);
      const hitId = `place_cell:${gx}:${gy}`;
      const isHov = hoveredId === hitId;

      if (isHov) {
        drawCarcassonneTile2D(
          ctx,
          sx,
          sy,
          ts,
          view.currentTile,
          validRots[0],
          { alpha: 0.85, highlightBorder: "#fde047" }
        );
      } else {
        drawRoundedRect(ctx, sx + 2, sy + 2, ts - 4, ts - 4, 6);
        ctx.fillStyle = `rgba(74, 222, 128, ${pulse})`;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#4ade80";
        ctx.stroke();
      }

      regions.push({
        id: hitId,
        shape: "rect",
        x: sx,
        y: sy,
        width: ts,
        height: ts,
      });
    }

    // 2b. Draw the currently staged (movable) draft tile + rotate indicator + floating Confirm pill (for active player)
    const activeDraft = draftPlacement ?? view.draftPlacement;
    if (activeDraft) {
      const { sx, sy } = worldToScreen(activeDraft.x, activeDraft.y);
      const glow = 0.72 + 0.28 * Math.sin(now * 0.008);
      const draftValidRots = findValidRotationsAt(
        view,
        activeDraft.x,
        activeDraft.y,
        activeDraft.rotation
      );

      ctx.save();
      ctx.shadowColor = `rgba(56, 189, 248, ${glow})`;
      ctx.shadowBlur = 14;
      drawCarcassonneTile2D(
        ctx,
        sx,
        sy,
        ts,
        view.currentTile,
        activeDraft.rotation & 3,
        { highlightBorder: "#38bdf8" }
      );
      ctx.restore();

      // Dashed inner highlight to indicate it can still be moved/rotated before confirming
      ctx.save();
      ctx.setLineDash([5, 4]);
      drawRoundedRect(ctx, sx + 3, sy + 3, ts - 6, ts - 6, 5);
      ctx.strokeStyle = "#fde047";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Small rotate badge on top-right corner when multiple rotations fit this cell
      if (draftValidRots.length > 1) {
        const br = 11;
        const bx = sx + ts - br - 3;
        const by = sy + br + 3;
        ctx.save();
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fillStyle =
          hoveredId === "draft_tile"
            ? "#0284c7"
            : "rgba(15, 23, 42, 0.88)";
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#fde047";
        ctx.stroke();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 12px system-ui, sans-serif";
        ctx.fillText("↻", bx, by + 0.5);
        ctx.restore();
      }

      regions.push({
        id: "draft_tile",
        shape: "rect",
        x: sx,
        y: sy,
        width: ts,
        height: ts,
      });

      // Floating Confirm pill right under the draft tile
      const pillW = Math.max(84, Math.min(112, ts + 18));
      const pillH = 26;
      const pillX = Math.round(sx + (ts - pillW) / 2);
      const pillY = Math.round(sy + ts + 6);
      const isConfirmHov = hoveredId === "btn_confirm_tile";

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;
      drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 13);
      ctx.fillStyle = isConfirmHov ? "#22c55e" : "#16a34a";
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = "#bbf7d0";
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 11px system-ui, sans-serif";
      ctx.fillText("✓ Xác nhận", pillX + pillW / 2, pillY + pillH / 2 + 0.5);
      ctx.restore();

      regions.push({
        id: "btn_confirm_tile",
        shape: "rect",
        x: pillX,
        y: pillY,
        width: pillW,
        height: pillH,
      });
    }
  } else if (
    !isMyTurn &&
    view.step === "PlaceTileStep" &&
    view.currentTile &&
    view.draftPlacement
  ) {
    // 2c. Live preview of opponent's unconfirmed staged tile so ALL players see it in real time!
    const oppDraft = view.draftPlacement;
    const { sx, sy } = worldToScreen(oppDraft.x, oppDraft.y);
    const actSeat = view.seats.find((s) => s.seatNo === view.activeSeatNo);
    const actColor = actSeat
      ? CARCASSONNE_COLOR_META[actSeat.color].light
      : "#38bdf8";
    const glow = 0.65 + 0.35 * Math.sin(now * 0.008);

    ctx.save();
    ctx.shadowColor = actColor;
    ctx.shadowBlur = 12 * glow;
    drawCarcassonneTile2D(
      ctx,
      sx,
      sy,
      ts,
      view.currentTile,
      oppDraft.rotation & 3,
      { alpha: 0.9, highlightBorder: actColor }
    );
    ctx.restore();

    ctx.save();
    ctx.setLineDash([5, 4]);
    drawRoundedRect(ctx, sx + 3, sy + 3, ts - 6, ts - 6, 5);
    ctx.strokeStyle = actColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Floating tag showing who is staging this tile
    const tagTxt = `${actSeat?.displayName ?? "Đối thủ"} đang thử…`;
    ctx.save();
    ctx.font = "800 10px system-ui, sans-serif";
    const tagW = Math.min(150, ctx.measureText(tagTxt).width + 16);
    const tagH = 22;
    const tagX = Math.round(sx + (ts - tagW) / 2);
    const tagY = Math.round(sy + ts + 5);
    drawRoundedRect(ctx, tagX, tagY, tagW, tagH, 11);
    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = actColor;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = actColor;
    ctx.fillText(tagTxt, tagX + tagW / 2, tagY + tagH / 2 + 0.5);
    ctx.restore();
  }

  // 3. Interactive Meeple / Abbot placement pins on newly placed tile
  if (
    isMyTurn &&
    view.step === "PlaceMeepleStep" &&
    view.lastPlacedCoord &&
    view.validMeepleOptions.length > 0
  ) {
    const { sx, sy } = worldToScreen(
      view.lastPlacedCoord.x,
      view.lastPlacedCoord.y
    );
    const mySeat = view.seats.find((s) => s.seatNo === view.viewerSeatNo);
    const myColor = mySeat ? CARCASSONNE_COLOR_META[mySeat.color] : null;
    const pinR = Math.max(10, ts * 0.14);

    for (const opt of view.validMeepleOptions) {
      const px = sx + opt.anchor[0] * ts;
      const py = sy + opt.anchor[1] * ts;
      const hitId = `meeple_opt:${opt.featureId}`;
      const isHov = hoveredId === hitId;

      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, isHov ? pinR * 1.18 : pinR, 0, Math.PI * 2);
      ctx.fillStyle = isHov
        ? "#fde047"
        : myColor?.fill ?? "rgba(56, 189, 248, 0.9)";
      ctx.fill();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isHov ? "#0f172a" : "#ffffff";
      ctx.font = `900 ${Math.max(9, Math.round(pinR * 0.95))}px system-ui, sans-serif`;
      const icon =
        opt.featureKind === "city"
          ? "🏰"
          : opt.featureKind === "road"
            ? "🛣"
            : opt.featureKind === "monastery"
              ? "⛪"
              : opt.featureKind === "garden"
                ? "🌸"
                : "🌾";
      ctx.fillText(icon, px, py + 0.5);
      ctx.restore();

      regions.push({
        id: hitId,
        shape: "circle",
        x: px,
        y: py,
        radius: pinR + 4,
      });
    }
  }

  // 3a. Completed City Perimeter Border Animation & Monastery 3x3 Sacred Sunbeam Halo
  for (const fx of completedFeatureFx) {
    const age = now - fx.startMs;
    if (age < 0 || age > fx.durMs) continue;
    const t = age / fx.durMs;
    const fadeIn = Math.min(1, t / 0.14);
    const fadeOut = t > 0.72 ? Math.max(0, (1 - t) / 0.28) : 1;
    const alpha = fadeIn * fadeOut;
    const pulse = 0.7 + 0.3 * Math.sin(now * 0.015);

    const tileSet = new Set(fx.tiles.map((c) => coordKey(c.x, c.y)));

    ctx.save();
    if (fx.kind === "city") {
      // 1. Soft golden wash pulsing over every tile belonging to the completed city
      ctx.globalAlpha = alpha * (0.18 + 0.1 * pulse);
      ctx.fillStyle = "#fde047";
      for (const tc of fx.tiles) {
        const { sx, sy } = worldToScreen(tc.x, tc.y);
        drawRoundedRect(ctx, sx + 1, sy + 1, ts - 2, ts - 2, 4);
        ctx.fill();
      }

      // 2. Trace the EXACT outer perimeter boundary segments of the completed city!
      const segments: Array<[number, number, number, number]> = [];
      for (const tc of fx.tiles) {
        const { sx, sy } = worldToScreen(tc.x, tc.y);
        if (!tileSet.has(coordKey(tc.x, tc.y - 1))) {
          segments.push([sx, sy, sx + ts, sy]); // North outer edge
        }
        if (!tileSet.has(coordKey(tc.x + 1, tc.y))) {
          segments.push([sx + ts, sy, sx + ts, sy + ts]); // East outer edge
        }
        if (!tileSet.has(coordKey(tc.x, tc.y + 1))) {
          segments.push([sx + ts, sy + ts, sx, sy + ts]); // South outer edge
        }
        if (!tileSet.has(coordKey(tc.x - 1, tc.y))) {
          segments.push([sx, sy + ts, sx, sy]); // West outer edge
        }
      }

      // Outer golden bloom glow along city perimeter
      ctx.globalAlpha = alpha * 0.95;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 16;
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      for (const [x1, y1, x2, y2] of segments) {
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.stroke();

      // Animated marching bright gold-white energy dashes gliding around the city border!
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#fef08a";
      ctx.strokeStyle = "#fef9c3";
      ctx.lineWidth = 2.8;
      ctx.setLineDash([14, 10]);
      ctx.lineDashOffset = -now * 0.085;
      ctx.beginPath();
      for (const [x1, y1, x2, y2] of segments) {
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (fx.kind === "monastery" || fx.kind === "garden") {
      // Sacred 3x3 Sanctuary Frame + Rotating Golden Sunbeams radiating from center Abbey/Garden!
      const { sx: cx0, sy: cy0 } = worldToScreen(fx.center.x, fx.center.y);
      const centerPx = cx0 + ts / 2;
      const centerPy = cy0 + ts / 2;
      const boxX = cx0 - ts;
      const boxY = cy0 - ts;
      const boxSize = ts * 3;
      const isGarden = fx.kind === "garden";
      const mainCol = isGarden ? "#f472b6" : "#fde047";
      const glowCol = isGarden ? "#ec4899" : "#f59e0b";

      // Rotating sunbeams from center Monastery/Garden
      ctx.save();
      ctx.translate(centerPx, centerPy);
      ctx.rotate(now * 0.0012);
      ctx.globalAlpha = alpha * 0.34;
      const rayCount = 8;
      const rayLen = ts * (1.25 + 0.35 * pulse);
      for (let i = 0; i < rayCount; i++) {
        ctx.rotate((Math.PI * 2) / rayCount);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(rayLen, -ts * 0.14);
        ctx.lineTo(rayLen, ts * 0.14);
        ctx.closePath();
        ctx.fillStyle = mainCol;
        ctx.fill();
      }
      ctx.restore();

      // Glowing 3x3 sanctuary perimeter frame
      ctx.globalAlpha = alpha * 0.95;
      ctx.shadowColor = glowCol;
      ctx.shadowBlur = 18;
      drawRoundedRect(ctx, boxX + 2, boxY + 2, boxSize - 4, boxSize - 4, 10);
      ctx.strokeStyle = glowCol;
      ctx.lineWidth = 4.5;
      ctx.stroke();

      // Animated marching highlight dashes around the 3x3 frame
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([12, 10]);
      ctx.lineDashOffset = -now * 0.07;
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner bright halo on the Monastery/Garden tile itself
      ctx.shadowBlur = 12;
      drawRoundedRect(ctx, cx0 + 2, cy0 + 2, ts - 4, ts - 4, 6);
      ctx.strokeStyle = mainCol;
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      // Completed Road shimmer highlight across road tiles
      ctx.globalAlpha = alpha * 0.35;
      ctx.fillStyle = fx.color;
      for (const tc of fx.tiles) {
        const { sx, sy } = worldToScreen(tc.x, tc.y);
        drawRoundedRect(ctx, sx + 2, sy + 2, ts - 4, ts - 4, 5);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // 3b. Expanding golden shockwave rings on newly completed Cities / Roads / Monasteries / Gardens
  for (const ring of completionRings) {
    const age = now - ring.startMs - ring.delayMs;
    if (age < 0 || age > ring.durMs) continue;
    const t = age / ring.durMs;
    const ease = 1 - Math.pow(1 - t, 3);
    const { sx, sy } = worldToScreen(ring.x, ring.y);
    const r = ts * (0.35 + ease * 1.15);
    ctx.save();
    ctx.globalAlpha = Math.max(0, (1 - t) * 0.9);
    ctx.beginPath();
    ctx.arc(sx + ts / 2, sy + ts / 2, r, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(1.5, (1 - t) * 5.5);
    ctx.strokeStyle = ring.color;
    ctx.stroke();
    ctx.restore();
  }

  // 4. Floating score popups over scored tiles
  for (const sp of activePopups) {
    const age = now - sp.startMs;
    if (age < 0 || age > sp.durMs) continue;
    const t = age / sp.durMs;
    const alpha = t < 0.15 ? t / 0.15 : t > 0.7 ? (1 - t) / 0.3 : 1;
    const { sx, sy } = worldToScreen(sp.x, sp.y);
    const fx = sx + ts / 2;
    const fy = sy + ts * 0.25 - t * 42;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.font = "900 13px system-ui, sans-serif";
    const tw = ctx.measureText(sp.text).width + 20;
    drawRoundedRect(ctx, fx - tw / 2, fy - 13, tw, 26, 13);
    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.fill();
    ctx.strokeStyle = sp.color;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = sp.color;
    ctx.fillText(sp.text, fx, fy);
    ctx.restore();
  }

  // =========================================================================
  // 5. COMPACT TOP-LEFT SCOREBOARD BAR + TOP-RIGHT 3D TILE DRAW PILE
  // =========================================================================
  const pad = 10;
  const topBarH = 52;
  const pileSize = 84;
  const pileX = w - pad - pileSize - 6;
  const pileY = pad + 6;

  // Compact scoreboard bar wrapping tightly around player cards (leaves top-right free for Draw Pile)
  const maxScoreBarW = Math.max(140, pileX - pad - 18);
  const seatGap = 6;
  const seatCount = Math.max(1, view.seats.length);
  const seatCardW = Math.max(
    96,
    Math.min(
      142,
      Math.floor((maxScoreBarW - 14 - (seatCount - 1) * seatGap) / seatCount)
    )
  );
  const scoreBarW = Math.min(
    maxScoreBarW,
    seatCount * seatCardW + (seatCount - 1) * seatGap + 14
  );

  drawRoundedRect(ctx, pad, pad, scoreBarW, topBarH, 13);
  ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
  ctx.fill();
  ctx.strokeStyle = "rgba(251, 191, 36, 0.38)";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  view.seats.forEach((seat, idx) => {
    const sx = pad + 7 + idx * (seatCardW + seatGap);
    const isAct =
      view.step !== "MatchOver" && view.activeSeatNo === seat.seatNo;
    const meta = CARCASSONNE_COLOR_META[seat.color];

    drawRoundedRect(ctx, sx, pad + 6, seatCardW, 40, 10);
    ctx.fillStyle = isAct ? "rgba(251, 191, 36, 0.18)" : "rgba(30, 41, 59, 0.72)";
    ctx.fill();
    ctx.lineWidth = isAct ? 2 : 1;
    ctx.strokeStyle = isAct ? "#fde047" : meta.light;
    ctx.stroke();

    drawCarcassonneMeeple2D(ctx, sx + 15, pad + 26, 18, seat.color, "standard");

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 11px system-ui, sans-serif";
    const maxNameLen = seatCardW < 120 ? 7 : 9;
    const nm =
      seat.displayName.length > maxNameLen
        ? `${seat.displayName.slice(0, maxNameLen - 1)}…`
        : seat.displayName;
    ctx.fillText(nm, sx + 28, pad + 19);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "700 9.5px system-ui, sans-serif";
    ctx.fillText(
      `♟${seat.meeplesLeft}${view.config.enableAbbot ? (seat.abbotAvailable ? " ⛪1" : " ⛪0") : ""}`,
      sx + 28,
      pad + 35
    );

    ctx.textAlign = "right";
    ctx.fillStyle = "#fde047";
    ctx.font = "900 15px system-ui, sans-serif";
    ctx.fillText(String(seat.score), sx + seatCardW - 8, pad + 26);
  });

  // =========================================================================
  // 5b. 3D STACKED TILE DRAW PILE (Top-right corner — clickable in DrawTileStep!)
  // =========================================================================
  const currentTpl = view.currentTile
    ? ALL_TILE_TEMPLATES[view.currentTile.templateCode]
    : null;
  const canDrawNow =
    isMyTurn && view.step === "DrawTileStep" && view.tilesRemaining > 0;
  const drawPulse = 0.5 + 0.5 * Math.sin(now * 0.008);
  drawCarcassonneDrawPile2D(ctx, pileX, pileY, pileSize, view.tilesRemaining, {
    isRiverPhase: Boolean(currentTpl?.riverRole || view.lastRiverDir !== null),
    canDraw: canDrawNow,
    isHovered: hoveredId === "btn_draw_tile",
    pulsePhase: drawPulse,
  });
  if (canDrawNow) {
    regions.push({
      id: "btn_draw_tile",
      shape: "rect",
      x: pileX - 6,
      y: pileY - 6,
      width: pileSize + 12,
      height: pileSize + 34,
    });
  }

  // =========================================================================
  // 6. BOTTOM-LEFT ZOOM/CENTER CONTROLS
  // =========================================================================
  const zBtns = [
    { id: "btn_zoom_in", label: "+" },
    { id: "btn_zoom_out", label: "−" },
    { id: "btn_center", label: "⌖" },
  ];
  zBtns.forEach((b, i) => {
    const bx = pad + i * 38;
    const by = h - pad - 34;
    const hov = hoveredId === b.id;
    drawRoundedRect(ctx, bx, by, 32, 32, 9);
    ctx.fillStyle = hov ? "#334155" : "rgba(15, 23, 42, 0.88)";
    ctx.fill();
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "900 15px system-ui, sans-serif";
    ctx.fillText(b.label, bx + 16, by + 16);
    regions.push({ id: b.id, shape: "rect", x: bx, y: by, width: 32, height: 32 });
  });

  // =========================================================================
  // 7. BOTTOM-RIGHT ACTION DOCK (Draw Prompt OR Your Tile OR Meeple Controls)
  // =========================================================================
  let dockPreviewPos: { x: number; y: number; size: number } | null = null;

  if (view.step === "DrawTileStep") {
    const dockW = 204;
    const dockH = isMyTurn ? 96 : 68;
    const dx = w - pad - dockW;
    const dy = h - pad - dockH;
    drawRoundedRect(ctx, dx, dy, dockW, dockH, 16);
    ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
    ctx.fill();
    ctx.strokeStyle = isMyTurn ? "#fde047" : "#475569";
    ctx.lineWidth = isMyTurn ? 2 : 1.2;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (isMyTurn) {
      ctx.fillStyle = "#fde047";
      ctx.font = "900 11px system-ui, sans-serif";
      ctx.fillText("LƯỢT CỦA BẠN", dx + dockW / 2, dy + 20);

      const bX = dx + 14;
      const bY = dy + 38;
      const bW = dockW - 28;
      const bH = 38;
      drawRoundedRect(ctx, bX, bY, bW, bH, 10);
      ctx.fillStyle =
        hoveredId === "btn_draw_tile" ? "#fde047" : "#f59e0b";
      ctx.fill();
      ctx.fillStyle = "#0f172a";
      ctx.font = "900 12.5px system-ui, sans-serif";
      ctx.fillText("🃏 Rút Mảnh Đất", dx + dockW / 2, bY + bH / 2);
      regions.push({
        id: "btn_draw_tile",
        shape: "rect",
        x: bX,
        y: bY,
        width: bW,
        height: bH,
      });
    } else {
      const actSeat = view.seats.find((s) => s.seatNo === view.activeSeatNo);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "800 10.5px system-ui, sans-serif";
      ctx.fillText("ĐANG CHỜ RÚT MẢNH", dx + dockW / 2, dy + 22);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "700 11.5px system-ui, sans-serif";
      ctx.fillText(
        `Lượt của ${actSeat?.displayName ?? "đối thủ"}…`,
        dx + dockW / 2,
        dy + 44
      );
    }
  } else if (view.step === "PlaceTileStep" && view.currentTile) {
    const hasDraft = isMyTurn && draftPlacement !== null;
    const dockW = hasDraft ? 212 : 176;
    const dockH = hasDraft ? 196 : 136;
    const dx = w - pad - dockW;
    const dy = h - pad - dockH;
    drawRoundedRect(ctx, dx, dy, dockW, dockH, 16);
    ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
    ctx.fill();
    ctx.strokeStyle = hasDraft
      ? "#38bdf8"
      : isMyTurn
        ? "#fde047"
        : "#475569";
    ctx.lineWidth = isMyTurn ? 2 : 1.2;
    ctx.stroke();

    const tpl = ALL_TILE_TEMPLATES[view.currentTile.templateCode];
    const actSeat = view.seats.find((s) => s.seatNo === view.activeSeatNo);
    const actLabel = actSeat
      ? actSeat.displayName.length > 12
        ? `${actSeat.displayName.slice(0, 11)}…`
        : actSeat.displayName
      : "ĐỐI THỦ";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = hasDraft ? "#38bdf8" : isMyTurn ? "#fde047" : "#e2e8f0";
    ctx.font = "800 10.5px system-ui, sans-serif";
    ctx.fillText(
      hasDraft
        ? "ĐẶT THỬ • BẤM Ô KHÁC ĐỂ ĐỔI"
        : isMyTurn
          ? "MẢNH ĐẤT CỦA BẠN"
          : `MẢNH CỦA ${actLabel.toUpperCase()}`,
      dx + dockW / 2,
      dy + 16
    );

    const previewSize = 84;
    const prevX = dx + (dockW - previewSize) / 2;
    const prevY = dy + 28;
    dockPreviewPos = { x: prevX, y: prevY, size: previewSize };

    const flightActive =
      drawFlight !== null && now - drawFlight.startMs < drawFlight.durMs * 0.92;

    if (!flightActive) {
      drawCarcassonneTile2D(
        ctx,
        prevX,
        prevY,
        previewSize,
        view.currentTile,
        rotation & 3,
        {
          highlightBorder:
            isMyTurn && hoveredId === "dock_tile_preview" ? "#38bdf8" : undefined,
        }
      );
      if (isMyTurn) {
        regions.push({
          id: "dock_tile_preview",
          shape: "rect",
          x: prevX,
          y: prevY,
          width: previewSize,
          height: previewSize,
        });
      }
    } else {
      // Subtle empty target slot while tile flies in from the Draw Pile
      drawRoundedRect(ctx, prevX, prevY, previewSize, previewSize, 6);
      ctx.fillStyle = "rgba(30, 41, 59, 0.55)";
      ctx.fill();
    }

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "600 9.5px system-ui, sans-serif";
    ctx.fillText(
      tpl?.nameVi ?? view.currentTile.templateCode,
      dx + dockW / 2,
      dy + 122
    );

    if (hasDraft) {
      const cX = dx + 12;
      const cY = dy + 132;
      const cW = dockW - 24;
      const cH = 30;
      drawRoundedRect(ctx, cX, cY, cW, cH, 9);
      ctx.fillStyle =
        hoveredId === "btn_confirm_tile" ? "#22c55e" : "#16a34a";
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 11.5px system-ui, sans-serif";
      ctx.fillText("✓ Xác Nhận Đặt (Enter)", dx + dockW / 2, cY + cH / 2);
      regions.push({
        id: "btn_confirm_tile",
        shape: "rect",
        x: cX,
        y: cY,
        width: cW,
        height: cH,
      });

      const cancelY = dy + 167;
      const cancelH = 22;
      drawRoundedRect(ctx, cX, cancelY, cW, cancelH, 7);
      ctx.fillStyle =
        hoveredId === "btn_cancel_draft" ? "#475569" : "#334155";
      ctx.fill();
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "800 10px system-ui, sans-serif";
      ctx.fillText("✕ Chọn lại vị trí", dx + dockW / 2, cancelY + cancelH / 2);
      regions.push({
        id: "btn_cancel_draft",
        shape: "rect",
        x: cX,
        y: cancelY,
        width: cW,
        height: cancelH,
      });
    }
  } else if (isMyTurn && view.step === "PlaceMeepleStep") {
    const hasMonasteryBoth = view.validMeepleOptions.some(
      (o) =>
        o.meepleTypes.includes("standard") && o.meepleTypes.includes("abbot")
    );
    const dockW = 224;
    const dockH =
      88 + (view.canRecallAbbot ? 34 : 0) + (hasMonasteryBoth ? 32 : 0);
    const dx = w - pad - dockW;
    const dy = h - pad - dockH;
    drawRoundedRect(ctx, dx, dy, dockW, dockH, 16);
    ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
    ctx.fill();
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#fde047";
    ctx.font = "900 11px system-ui, sans-serif";
    ctx.fillText("ĐẶT MEEPLE HOẶC BỎ QUA", dx + dockW / 2, dy + 18);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "600 10px system-ui, sans-serif";
    ctx.fillText(
      "Bấm biểu tượng trên mảnh vừa đặt",
      dx + dockW / 2,
      dy + 34
    );

    let curY = dy + 46;

    if (hasMonasteryBoth) {
      const btnW = dockW - 24;
      drawRoundedRect(ctx, dx + 12, curY, btnW, 26, 8);
      ctx.fillStyle = "rgba(168, 85, 247, 0.25)";
      ctx.fill();
      ctx.strokeStyle = "#c084fc";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = "#e9d5ff";
      ctx.font = "800 10.5px system-ui, sans-serif";
      ctx.fillText(
        preferredMeeple === "abbot"
          ? "Đang chọn: ⛪ Tu viện trưởng (Đổi)"
          : "Đang chọn: ♟ Meeple thường (Đổi)",
        dx + dockW / 2,
        curY + 13
      );
      regions.push({
        id: "btn_toggle_meeple_type",
        shape: "rect",
        x: dx + 12,
        y: curY,
        width: btnW,
        height: 26,
      });
      curY += 32;
    }

    if (view.canRecallAbbot) {
      const btnW = dockW - 24;
      drawRoundedRect(ctx, dx + 12, curY, btnW, 28, 8);
      ctx.fillStyle =
        hoveredId === "btn_recall_abbot" ? "#10b981" : "#059669";
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 10.5px system-ui, sans-serif";
      ctx.fillText(
        `↩ Thu hồi Tu viện trưởng (+${view.abbotRecallPoints}đ)`,
        dx + dockW / 2,
        curY + 14
      );
      regions.push({
        id: "btn_recall_abbot",
        shape: "rect",
        x: dx + 12,
        y: curY,
        width: btnW,
        height: 28,
      });
      curY += 34;
    }

    const skipW = dockW - 24;
    drawRoundedRect(ctx, dx + 12, curY, skipW, 28, 8);
    ctx.fillStyle = hoveredId === "btn_skip_meeple" ? "#475569" : "#334155";
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 11px system-ui, sans-serif";
    ctx.fillText("Bỏ Qua (Không Đặt) →", dx + dockW / 2, curY + 14);
    regions.push({
      id: "btn_skip_meeple",
      shape: "rect",
      x: dx + 12,
      y: curY,
      width: skipW,
      height: 28,
    });
  } else if (view.step === "PlaceMeepleStep") {
    const actSeat = view.seats.find((s) => s.seatNo === view.activeSeatNo);
    const actMeta = actSeat ? CARCASSONNE_COLOR_META[actSeat.color] : null;
    const dockW = 214;
    const dockH = 68;
    const dx = w - pad - dockW;
    const dy = h - pad - dockH;
    drawRoundedRect(ctx, dx, dy, dockW, dockH, 16);
    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.fill();
    ctx.strokeStyle = actMeta?.light ?? "#475569";
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = actMeta?.light ?? "#cbd5e1";
    ctx.font = "800 10.5px system-ui, sans-serif";
    ctx.fillText("GIAI ĐOẠN ĐẶT MEEPLE", dx + dockW / 2, dy + 22);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 11.5px system-ui, sans-serif";
    ctx.fillText(
      `${actSeat?.displayName ?? "Đối thủ"} đang chọn vị trí…`,
      dx + dockW / 2,
      dy + 44
    );
  }

  // =========================================================================
  // 7b. 3D TILE DRAW & FLIP FLIGHT ANIMATION (Draw Pile -> Your Tile Dock)
  // =========================================================================
  if (drawFlight && dockPreviewPos) {
    const age = now - drawFlight.startMs;
    if (age >= 0 && age <= drawFlight.durMs) {
      const t = age / drawFlight.durMs;
      const ease = 1 - Math.pow(1 - t, 3);
      const startCx = pileX + pileSize / 2;
      const startCy = pileY + pileSize / 2;
      const endCx = dockPreviewPos.x + dockPreviewPos.size / 2;
      const endCy = dockPreviewPos.y + dockPreviewPos.size / 2;

      // Graceful curved arc lifting toward center-right before landing in dock
      const arcX = Math.sin(t * Math.PI) * -42;
      const curCx = startCx + (endCx - startCx) * ease + arcX;
      const curCy = startCy + (endCy - startCy) * ease;
      const curSize =
        pileSize +
        (dockPreviewPos.size - pileSize) * ease +
        Math.sin(t * Math.PI) * 16;

      // 3D horizontal card flip: 0..0.5 shows Gothic "C" back, 0.5..1 shows drawn front tile!
      const cosFlip = Math.cos(t * Math.PI);
      const scaleX = Math.max(0.05, Math.abs(cosFlip));
      const showingBack = t < 0.5;

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;
      ctx.translate(curCx, curCy);
      ctx.scale(scaleX, 1);
      if (showingBack) {
        drawCarcassonneTileBack2D(ctx, -curSize / 2, -curSize / 2, curSize);
      } else {
        drawCarcassonneTile2D(
          ctx,
          -curSize / 2,
          -curSize / 2,
          curSize,
          drawFlight.card,
          rotation & 3,
          { highlightBorder: "#fde047" }
        );
      }
      ctx.restore();
    }
  }

  // =========================================================================
  // 7c. TOP-CENTER COMPLETION CELEBRATION BANNER (City / Road / Monastery / Garden)
  // =========================================================================
  if (celebrationBanner) {
    const age = now - celebrationBanner.startMs;
    if (age >= 0 && age <= celebrationBanner.durMs) {
      const t = age / celebrationBanner.durMs;
      const enter = t < 0.14 ? t / 0.14 : 1;
      const exit = t > 0.8 ? (1 - t) / 0.2 : 1;
      const alpha = Math.max(0, Math.min(1, enter * exit));
      const popScale =
        t < 0.14 ? 0.82 + 0.22 * Math.sin((t / 0.14) * Math.PI * 0.65) : 1;

      const bw = Math.min(340, w - 40);
      const bh = 48;
      const bx = w / 2;
      const by = pad + topBarH + 34 - (1 - enter) * 14;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(bx, by);
      ctx.scale(popScale, popScale);

      ctx.shadowColor = "rgba(250, 204, 21, 0.45)";
      ctx.shadowBlur = 18;
      drawRoundedRect(ctx, -bw / 2, -bh / 2, bw, bh, 14);
      ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#fde047";
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fde047";
      ctx.font = "900 12.5px system-ui, sans-serif";
      ctx.fillText(celebrationBanner.title, 0, -8);

      ctx.fillStyle = celebrationBanner.color;
      ctx.font = "800 11px system-ui, sans-serif";
      ctx.fillText(celebrationBanner.subtitle, 0, 10);
      ctx.restore();
    }
  }

  // =========================================================================
  // 8. MATCH-OVER SCORE BREAKDOWN OVERLAY
  // =========================================================================
  if (view.step === "MatchOver") {
    const sorted = [...view.seats].sort((a, b) => b.score - a.score);
    const bw = Math.min(480, w - 32);
    const bh = 110 + sorted.length * 32 + (isHost ? 44 : 0);
    const bx0 = (w - bw) / 2;
    const by0 = (h - bh) / 2;

    drawRoundedRect(ctx, bx0, by0, bw, bh, 18);
    ctx.fillStyle = "rgba(15, 23, 42, 0.96)";
    ctx.fill();
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#fde047";
    ctx.font = "900 18px Georgia, serif";
    ctx.fillText("🏆 TỔNG KẾT CARCASSONNE", w / 2, by0 + 30);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "700 10.5px system-ui, sans-serif";
    ctx.fillText("Thành • Đường • Tu viện • Vườn • Nông dân", w / 2, by0 + 52);

    sorted.forEach((s, idx) => {
      const ry = by0 + 78 + idx * 32;
      const isWin = view.winnerSeatNos.includes(s.seatNo);
      drawRoundedRect(ctx, bx0 + 16, ry - 12, bw - 32, 26, 8);
      ctx.fillStyle = isWin
        ? "rgba(251, 191, 36, 0.16)"
        : "rgba(30, 41, 59, 0.65)";
      ctx.fill();

      drawCarcassonneMeeple2D(ctx, bx0 + 32, ry + 1, 16, s.color, "standard");

      ctx.textAlign = "left";
      ctx.fillStyle = isWin ? "#fde047" : "#ffffff";
      ctx.font = "800 11.5px system-ui, sans-serif";
      ctx.fillText(
        `${isWin ? "👑 " : ""}${s.displayName}`,
        bx0 + 48,
        ry + 1
      );

      ctx.textAlign = "right";
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "600 10px system-ui, sans-serif";
      const b = s.scoreBreakdown;
      ctx.fillText(
        `🏰${b.cities} 🛣${b.roads} ⛪${b.monasteries} 🌸${b.gardens} 🌾${b.farmers}`,
        bx0 + bw - 68,
        ry + 1
      );

      ctx.fillStyle = "#fde047";
      ctx.font = "900 13px system-ui, sans-serif";
      ctx.fillText(`${s.score}đ`, bx0 + bw - 24, ry + 1);
    });

    if (isHost) {
      const btnW = 190;
      const btnH = 34;
      const btnX = w / 2 - btnW / 2;
      const btnY = by0 + bh - 46;
      drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 10);
      ctx.fillStyle = hoveredId === "btn_rematch" ? "#fde047" : "#f59e0b";
      ctx.fill();
      ctx.textAlign = "center";
      ctx.fillStyle = "#0f172a";
      ctx.font = "900 12px system-ui, sans-serif";
      ctx.fillText("🔄 Chơi Lại Ván Mới", w / 2, btnY + btnH / 2);
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
