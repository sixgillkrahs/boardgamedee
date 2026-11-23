"use client";

import React, { Suspense, use, useEffect, useRef, useState } from "react";
import { WerewolfCanvas } from "@/components/werewolf-canvas";
import { CoupActionIconCanvas, CoupCanvas } from "@/components/coup-canvas";
import {
  SplendorCanvas,
  SplendorGemIconCanvas,
  type SplendorSelection,
} from "@/components/splendor-canvas";
import {
  DuelCardPreviewCanvas,
  DuelTokenIconCanvas,
  SplendorDuelCanvas,
  type DuelSelection,
} from "@/components/splendor-duel-canvas";
import {
  ROLE_META,
  WEREWOLF_ROLES,
  type WerewolfPlayerView,
  type WerewolfRole,
} from "@/cartridges/werewolf";
import {
  ACTION_LABEL_VI,
  COUP_CHARACTER_META,
  COUP_CHARACTERS,
  type CoupPlayerView,
} from "@/cartridges/coup";
import {
  computeCardPayment,
  emptyTokenBag,
  SPLENDOR_GEM_META,
  SPLENDOR_GEMS,
  SPLENDOR_TOKEN_COLORS,
  type SplendorGemColor,
  type SplendorPlayerView,
  type TokenBag,
} from "@/cartridges/splendor";
import {
  boardIdx,
  computeDuelCardPayment,
  DUEL_TOKEN_COLORS,
  DUEL_TOKEN_META,
  emptyDuelTokenBag,
  validateDuelLineSelection,
  type DuelPlayerView,
  type DuelTokenBag,
} from "@/cartridges/splendor-duel";
import type { RoomSnapshotForActor } from "@/platform/coordinator";
import type { ChannelId } from "@/cartridges/types";

export default function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center text-sm">
          Đang tải bàn chơi...
        </div>
      }
    >
      <RoomPageContent params={params} />
    </Suspense>
  );
}

function RoomPageContent({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const normalizedCode = code.toUpperCase();

  const [snapshot, setSnapshot] = useState<RoomSnapshotForActor | null>(null);
  const [actor, setActor] = useState<{
    id: string;
    displayName: string;
    isGuest: boolean;
    email?: string | null;
  } | null>(null);
  const [connected, setConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // Canvas interaction state
  const [selectedTargetSeatNo, setSelectedTargetSeatNo] = useState<
    number | null
  >(null);
  const [roleCardRevealed, setRoleCardRevealed] = useState(true);
  const [witchWantHeal, setWitchWantHeal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Splendor interactive state (gem picker, card/deck selection, discard token bag)
  const [splendorSelectedGems, setSplendorSelectedGems] = useState<
    SplendorGemColor[]
  >([]);
  const [splendorSelection, setSplendorSelection] =
    useState<SplendorSelection>(null);
  const [splendorDiscardBag, setSplendorDiscardBag] =
    useState<TokenBag>(emptyTokenBag);

  // Splendor Duel interactive state (5x5 board cells, gold cell, privilege mode, pyramid/deck selection)
  const [duelSelectedCells, setDuelSelectedCells] = useState<
    [number, number][]
  >([]);
  const [duelSelection, setDuelSelection] = useState<DuelSelection>(null);
  const [duelGoldCell, setDuelGoldCell] = useState<[number, number] | null>(
    null
  );
  const [duelPrivilegeMode, setDuelPrivilegeMode] = useState(false);
  const [duelDiscardBag, setDuelDiscardBag] =
    useState<DuelTokenBag>(emptyDuelTokenBag);

  // Right Slide-over Drawer (Chat & Events) + Header Gear Config Modal + Info 'i' Rules Modal
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"chat" | "events">("chat");
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  const [activeChannelId, setActiveChannelId] =
    useState<ChannelId>("village");
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Connect to Real-Time SSE stream
  useEffect(() => {
    const es = new EventSource(`/api/rooms/${normalizedCode}/stream`);

    es.onopen = () => {
      setConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          setErrorMsg(data.error);
          return;
        }
        if (data.snapshot) {
          setSnapshot(data.snapshot);
        }
        if (data.actor) {
          setActor(data.actor);
        }
      } catch {
        // ignore malformed frame
      }
    };

    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      es.close();
    };
  }, [normalizedCode]);

  // Automatically pick a writable channel when phase changes (e.g. Werewolf night chat)
  useEffect(() => {
    if (!snapshot?.channels?.length) return;
    const writable = snapshot.channels.find((c) => c.canWrite);
    const currentStillReadable = snapshot.channels.some(
      (c) => c.channelId === activeChannelId && c.canRead
    );
    if (
      writable &&
      snapshot.playerView?.phase === "NightPhase" &&
      writable.channelId === "werewolf"
    ) {
      setActiveChannelId("werewolf");
    } else if (!currentStillReadable) {
      setActiveChannelId(snapshot.channels[0].channelId);
    }
  }, [
    snapshot?.playerView?.phase,
    snapshot?.playerView?.step,
    snapshot?.channels,
    activeChannelId,
  ]);

  // Clear selected target seat when step changes
  useEffect(() => {
    setSelectedTargetSeatNo(null);
    setWitchWantHeal(false);
  }, [snapshot?.playerView?.cycle, snapshot?.playerView?.step]);

  useEffect(() => {
    if (drawerOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [drawerOpen, snapshot?.messages?.length, snapshot?.events?.length]);

  const sendRoomAction = async (payload: Record<string, unknown>) => {
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/rooms/${normalizedCode}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Thao tác thất bại");
      }
      if (data.snapshot) setSnapshot(data.snapshot);
      if (data.actor) setActor(data.actor);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRoleCountDelta = (role: WerewolfRole, delta: number) => {
    if (!snapshot) return;
    const currentConfig = snapshot.room.config;
    const curVal = currentConfig?.roleCounts?.[role] ?? 0;
    const nextVal = Math.max(0, curVal + delta);
    const nextConfig = {
      ...currentConfig,
      roleCounts: {
        ...currentConfig.roleCounts,
        [role]: nextVal,
      },
    };
    void sendRoomAction({ type: "UPDATE_CONFIG", config: nextConfig });
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput;
    setChatInput("");
    await sendRoomAction({
      type: "SEND_MESSAGE",
      channelId: activeChannelId,
      content: text,
    });
  };

  const isCoup = snapshot?.room.cartridgeId === "coup";
  const isSplendor = snapshot?.room.cartridgeId === "splendor";
  const isDuel = snapshot?.room.cartridgeId === "splendor-duel";
  const pv: WerewolfPlayerView | null =
    !isCoup && !isSplendor && !isDuel && snapshot?.playerView
      ? snapshot.playerView
      : null;
  const coupView: CoupPlayerView | null =
    isCoup && snapshot?.playerView ? snapshot.playerView : null;
  const splendorView: SplendorPlayerView | null =
    isSplendor && snapshot?.playerView ? snapshot.playerView : null;
  const duelView: DuelPlayerView | null =
    isDuel && snapshot?.playerView ? snapshot.playerView : null;
  const isLobby =
    !snapshot ||
    snapshot.room.status === "lobby" ||
    (!pv && !coupView && !splendorView && !duelView);

  // Clear local Splendor selections when turn/step changes
  useEffect(() => {
    setSplendorSelectedGems([]);
    setSplendorSelection(null);
    setSplendorDiscardBag(emptyTokenBag());
  }, [splendorView?.turnNumber, splendorView?.step]);

  // Clear local Splendor Duel selections when turn/step changes
  useEffect(() => {
    setDuelSelectedCells([]);
    setDuelSelection(null);
    setDuelGoldCell(null);
    setDuelPrivilegeMode(false);
    setDuelDiscardBag(emptyDuelTokenBag());
  }, [duelView?.turnNumber, duelView?.step]);

  const handleClickDuelBoardCell = (row: number, col: number) => {
    if (!duelView || duelView.activeSeatNo !== snapshot?.viewerSeatNo) return;
    const tok = duelView.board[boardIdx(row, col)];
    if (!tok) return;

    // 1. TakeMatchingStep: clicking a matching color token immediately takes it
    if (duelView.step === "TakeMatchingStep") {
      if (tok === duelView.pendingMatchColor) {
        void sendRoomAction({
          type: "MATCH_COMMAND",
          command: { type: "TAKE_MATCHING_CELL", row, col },
        });
      }
      return;
    }

    if (duelView.step !== "TurnActionStep") return;

    // 2. Privilege Mode: clicking any non-gold token immediately spends 1 Privilege
    if (duelPrivilegeMode) {
      if (tok === "gold") {
        setErrorMsg("Cuộn Đặc Quyền không thể lấy xu Vàng.");
        return;
      }
      setDuelPrivilegeMode(false);
      void sendRoomAction({
        type: "MATCH_COMMAND",
        command: { type: "USE_PRIVILEGE", row, col },
      });
      return;
    }

    // 3. Clicking a Gold token selects it as the goldCell for Reserve
    if (tok === "gold") {
      setDuelSelectedCells([]);
      setDuelGoldCell((prev) =>
        prev && prev[0] === row && prev[1] === col ? null : [row, col]
      );
      return;
    }

    // 4. Normal mode: toggle 1..3 non-gold cells in a straight line
    setDuelSelection(null);
    setDuelGoldCell(null);
    setDuelSelectedCells((prev) => {
      const existsIdx = prev.findIndex(([r, c]) => r === row && c === col);
      if (existsIdx >= 0) {
        return prev.filter((_, i) => i !== existsIdx);
      }
      if (prev.length >= 3) {
        return [[row, col]];
      }
      const candidate: [number, number][] = [...prev, [row, col]];
      const check = validateDuelLineSelection(duelView.board, candidate);
      if (!check.valid) {
        // Start a fresh line from the clicked cell so UX stays effortless
        return [[row, col]];
      }
      return candidate;
    });
  };

  const handleClickSplendorGem = (gem: SplendorGemColor) => {
    if (!splendorView || splendorView.step !== "TurnActionStep") return;
    if (splendorView.activeSeatNo !== snapshot?.viewerSeatNo) return;
    const supplyQty = splendorView.supply[gem];
    if (supplyQty <= 0) return;

    setSplendorSelection(null);
    setSplendorSelectedGems((prev) => {
      // If 2 of the same color are already selected and user clicks it again -> clear
      if (prev.length === 2 && prev[0] === gem && prev[1] === gem) {
        return [];
      }
      // If exactly 1 gem of this same color is selected: clicking it again selects 2-of-same (if supply >= 4), else deselects
      if (prev.length === 1 && prev[0] === gem) {
        return supplyQty >= 4 ? [gem, gem] : [];
      }
      // If gem is already in a multi-distinct selection -> remove it
      if (prev.includes(gem)) {
        return prev.filter((g) => g !== gem);
      }
      // If currently holding a double-same selection -> switch to this single gem
      if (prev.length === 2 && prev[0] === prev[1]) {
        return [gem];
      }
      // Otherwise add up to 3 distinct colors
      if (prev.length >= 3) {
        return [...prev.slice(1), gem];
      }
      return [...prev, gem];
    });
  };

  const targetSeatObj =
    selectedTargetSeatNo !== null
      ? pv?.seats.find((s) => s.seatNo === selectedTargetSeatNo) ??
        coupView?.seats.find((s) => s.seatNo === selectedTargetSeatNo) ??
        snapshot?.seats.find((s) => s.seatNo === selectedTargetSeatNo) ??
        null
      : null;

  const witchVictimObj =
    pv?.witchState?.pendingWolfVictimSeatNo !== null &&
    pv?.witchState?.pendingWolfVictimSeatNo !== undefined
      ? pv.seats.find(
          (s) => s.seatNo === pv.witchState?.pendingWolfVictimSeatNo
        ) ?? null
      : null;

  const activeChannelPerm = snapshot?.channels.find(
    (c) => c.channelId === activeChannelId
  );
  const channelMessages =
    snapshot?.messages.filter((m) => m.channelId === activeChannelId) ?? [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-x-hidden">
      {/* Top Platform Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/85 backdrop-blur px-2.5 py-2 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 z-30">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={async () => {
              await sendRoomAction({ type: "LEAVE" });
              window.location.href = "/";
            }}
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
          >
            ← <span className="hidden xs:inline">Rời Phòng</span>
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="hidden md:inline text-xs uppercase tracking-wider text-slate-400">
              Mã phòng:
            </span>
            <span className="rounded-lg bg-amber-500/15 border border-amber-500/40 px-2 py-1 font-mono text-xs sm:text-sm font-bold text-amber-300">
              {normalizedCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2 sm:px-2.5 py-1 text-xs font-medium text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              {copied ? "✓ Đã chép" : "Sao chép link"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
          {/* Quick Button to Open Chat & Event Log Drawer */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="h-8 rounded-lg border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-2.5 text-xs font-bold text-amber-300 transition cursor-pointer inline-flex items-center gap-1.5"
            title="Mở Kênh Chat & Nhật Ký"
          >
            <span>💬</span>
            <span className="hidden sm:inline">Chat & Nhật Ký</span>
          </button>

          {/* Info 'i' Button for Viewing Game Rules */}
          <button
            type="button"
            onClick={() => setRulesModalOpen(true)}
            className="w-8 h-8 rounded-lg border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 inline-flex items-center justify-center font-serif italic font-extrabold text-sm text-sky-300 transition cursor-pointer"
            title="Xem luật chơi"
            aria-label="Xem luật chơi"
          >
            i
          </button>

          {/* Gear Icon Button for Configuration */}
          <button
            type="button"
            onClick={() => setConfigModalOpen(true)}
            className="w-8 h-8 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 inline-flex items-center justify-center text-xs text-slate-200 transition cursor-pointer"
            title="Cấu hình vai trò & thời gian"
            aria-label="Cấu hình vai trò & thời gian"
          >
            ⚙️
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            className="w-8 h-8 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 inline-flex items-center justify-center text-xs text-slate-200 transition cursor-pointer"
            title="Bật/Tắt âm thanh"
            aria-label="Bật/Tắt âm thanh"
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                void document.documentElement
                  .requestFullscreen()
                  .catch(() => {});
              } else {
                void document.exitFullscreen().catch(() => {});
              }
            }}
            className="hidden sm:inline-flex w-8 h-8 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 items-center justify-center text-xs text-slate-200 transition cursor-pointer"
            title="Toàn màn hình"
            aria-label="Toàn màn hình"
          >
            ⛶
          </button>

          {actor && (
            <div className="hidden sm:flex h-8 items-center gap-2 rounded-lg bg-slate-800/90 border border-slate-700 px-2.5">
              <span className="font-semibold text-sky-300 max-w-28 truncate">
                {actor.displayName}
              </span>
              <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">
                {actor.isGuest ? "Guest" : "Google"}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Error Toast if any */}
      {errorMsg && (
        <div className="mx-3 mt-2 rounded-xl border border-rose-500/40 bg-rose-950/70 px-3.5 py-2 text-xs font-medium text-rose-200 flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-300 hover:text-white font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Full-Width Interactive 2D Canvas Tabletop (Left) + Action Selection Sidebar (Right) */}
      <main className="relative flex-1 flex flex-col lg:flex-row gap-2 sm:gap-2.5 p-2 sm:p-2.5 w-full">
        <div className="flex-1 h-[54vh] min-h-[380px] sm:h-[62vh] sm:min-h-[500px] lg:h-[calc(100vh-62px)] lg:min-h-[620px] relative">
          {isDuel ? (
            <SplendorDuelCanvas
              mode={isLobby ? "lobby" : "match"}
              lobbySeats={snapshot?.seats ?? []}
              viewerSeatNo={snapshot?.viewerSeatNo ?? null}
              playerView={duelView}
              selectedCells={duelSelectedCells}
              selectedGoldCell={duelGoldCell}
              privilegeMode={duelPrivilegeMode}
              selection={duelSelection}
              onClickBoardCell={handleClickDuelBoardCell}
              onSelectCardOrDeck={(sel) => {
                setDuelSelectedCells([]);
                setDuelPrivilegeMode(false);
                setDuelSelection((prev) =>
                  prev && sel && JSON.stringify(prev) === JSON.stringify(sel)
                    ? null
                    : sel
                );
              }}
              onDispatchCommand={(cmd) =>
                void sendRoomAction({ type: "MATCH_COMMAND", command: cmd })
              }
            />
          ) : isSplendor ? (
            <SplendorCanvas
              mode={isLobby ? "lobby" : "match"}
              lobbySeats={snapshot?.seats ?? []}
              viewerSeatNo={snapshot?.viewerSeatNo ?? null}
              playerView={splendorView}
              selectedGems={splendorSelectedGems}
              onClickGemSupply={handleClickSplendorGem}
              selection={splendorSelection}
              onSelectCardOrDeck={(sel) => {
                setSplendorSelectedGems([]);
                setSplendorSelection((prev) =>
                  prev && sel && JSON.stringify(prev) === JSON.stringify(sel)
                    ? null
                    : sel
                );
              }}
              onDispatchCommand={(cmd) =>
                void sendRoomAction({ type: "MATCH_COMMAND", command: cmd })
              }
            />
          ) : isCoup ? (
            <CoupCanvas
              mode={isLobby ? "lobby" : "match"}
              lobbySeats={snapshot?.seats ?? []}
              viewerSeatNo={snapshot?.viewerSeatNo ?? null}
              playerView={coupView}
              selectedTargetSeatNo={selectedTargetSeatNo}
              onSelectSeat={(seatNo) => setSelectedTargetSeatNo(seatNo)}
              cardsRevealed={roleCardRevealed}
              onToggleCardsRevealed={() =>
                setRoleCardRevealed((prev) => !prev)
              }
              onDispatchCommand={(cmd) =>
                void sendRoomAction({ type: "MATCH_COMMAND", command: cmd })
              }
            />
          ) : (
            <WerewolfCanvas
              mode={isLobby ? "lobby" : "match"}
              lobbySeats={snapshot?.seats ?? []}
              viewerSeatNo={snapshot?.viewerSeatNo ?? null}
              playerView={pv}
              selectedTargetSeatNo={selectedTargetSeatNo}
              onSelectSeat={(seatNo) => {
                setSelectedTargetSeatNo(seatNo);
                if (!pv || !pv.myAlive) return;
                const targetSeat = pv.seats.find((s) => s.seatNo === seatNo);
                if (!targetSeat?.alive) return;

                if (pv.step === "NightActionStep" && pv.myRole === "Werewolf") {
                  void fetch(`/api/rooms/${normalizedCode}/action`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      type: "MATCH_COMMAND",
                      command: {
                        type: "WEREWOLF_VOTE",
                        targetSeatNo: seatNo,
                        lock: false,
                      },
                    }),
                  }).catch(() => {});
                }

                if (pv.step === "DayVotingStep") {
                  void fetch(`/api/rooms/${normalizedCode}/action`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      type: "MATCH_COMMAND",
                      command: {
                        type: "DAY_VOTE",
                        targetSeatNo: seatNo,
                        lock: false,
                      },
                    }),
                  }).catch(() => {});
                }
              }}
              roleCardRevealed={roleCardRevealed}
              onToggleRoleCard={() => setRoleCardRevealed((prev) => !prev)}
            />
          )}
        </div>

        {/* Right-Side Action Selection Panel */}
        <aside className="w-full lg:w-76 xl:w-84 lg:max-h-[calc(100vh-62px)] lg:overflow-y-auto shrink-0 rounded-2xl border border-slate-800 bg-slate-900/95 p-3 sm:p-4 shadow-xl flex flex-col justify-between gap-3 sm:gap-4">
          {isLobby ? (
            <div className="flex flex-col gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  Bảng Điều Khiển Sảnh Chờ
                </span>
                <h2 className="text-sm font-bold text-slate-100 mt-1">
                  {isDuel
                    ? `Splendor Duel (${snapshot?.seats.length ?? 0}/2 người chơi)`
                    : isSplendor
                      ? `Splendor (${snapshot?.seats.length ?? 0}/4 người chơi)`
                      : isCoup
                        ? `Coup: Đảo Chính (${snapshot?.seats.length ?? 0}/6 người chơi)`
                        : `Làng Ma Sói (${snapshot?.seats.length ?? 0}/16 người chơi)`}
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {snapshot?.configValidation.valid
                    ? "✓ Đã đủ số lượng người chơi hợp lệ, sẵn sàng bắt đầu ván đấu!"
                    : snapshot?.configValidation.error ??
                      (isDuel
                        ? "Cần đúng 2 người chơi (hoặc thêm 1 Bot) để bắt đầu Splendor Duel."
                        : isSplendor
                          ? "Cần từ 2 đến 4 người chơi (hoặc thêm Bot) để bắt đầu Splendor."
                          : isCoup
                            ? "Cần từ 3 đến 6 người chơi (hoặc thêm Bot) để bắt đầu Coup."
                            : "Cần tối thiểu 4 người chơi (hoặc thêm Bot) để bắt đầu.")}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                {snapshot?.isHost && (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => sendRoomAction({ type: "ADD_BOT" })}
                      className="w-full rounded-xl border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 px-3.5 py-2.5 text-xs font-semibold text-sky-200 transition cursor-pointer disabled:opacity-50"
                    >
                      🤖 + Thêm Bot Vào Bàn
                    </button>
                    <button
                      type="button"
                      disabled={busy || !snapshot?.configValidation.valid}
                      onClick={() => sendRoomAction({ type: "START_MATCH" })}
                      className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg transition cursor-pointer disabled:opacity-40"
                    >
                      🔥 BẮT ĐẦU VÁN ĐẤU
                    </button>
                  </>
                )}
                {!snapshot?.isHost && (
                  <span className="text-xs text-slate-400 italic">
                    Đang chờ Chủ phòng bắt đầu ván đấu...
                  </span>
                )}
              </div>
            </div>
          ) : isDuel && duelView ? (
            /* Splendor Duel Right-Side Action Selection Panel */
            (() => {
              const mySeat = duelView.seats.find(
                (s) => s.seatNo === snapshot?.viewerSeatNo
              );
              const oppSeat = duelView.seats.find(
                (s) => s.seatNo !== snapshot?.viewerSeatNo
              );
              const activeSeat = duelView.seats.find(
                (s) => s.seatNo === duelView.activeSeatNo
              );
              const isMyTurn =
                duelView.activeSeatNo === snapshot?.viewerSeatNo;

              const lineCheck =
                duelSelectedCells.length > 0
                  ? validateDuelLineSelection(duelView.board, duelSelectedCells)
                  : { valid: false, tokens: [] };

              const lineGivesOppPrivilege =
                lineCheck.valid &&
                ((lineCheck.tokens.length === 3 &&
                  lineCheck.tokens[0] === lineCheck.tokens[1] &&
                  lineCheck.tokens[1] === lineCheck.tokens[2]) ||
                  lineCheck.tokens.filter((t) => t === "pearl").length >= 2);

              // Find first available Gold cell on board so Reserve works smoothly in 1 click
              let firstGoldCell: [number, number] | null = null;
              for (let r = 0; r < 5 && !firstGoldCell; r++) {
                for (let c = 0; c < 5 && !firstGoldCell; c++) {
                  if (duelView.board[boardIdx(r, c)] === "gold") {
                    firstGoldCell = [r, c];
                  }
                }
              }
              const effectiveGoldCell =
                duelGoldCell &&
                duelView.board[boardIdx(duelGoldCell[0], duelGoldCell[1])] ===
                  "gold"
                  ? duelGoldCell
                  : firstGoldCell;

              const selectedCard =
                duelSelection?.kind === "pyramid"
                  ? duelView.pyramid[duelSelection.tier]?.[
                      duelSelection.slotIndex
                    ] ?? null
                  : duelSelection?.kind === "reserved"
                    ? mySeat?.reservedCards[duelSelection.reservedIndex]
                        ?.card ?? null
                    : null;
              const selectedCardPay =
                selectedCard && mySeat
                  ? computeDuelCardPayment(mySeat, selectedCard)
                  : null;

              const excessTokens = mySeat
                ? Math.max(0, mySeat.totalTokens - 10)
                : 0;
              const discardSum = DUEL_TOKEN_COLORS.reduce(
                (acc, c) => acc + (duelDiscardBag[c] ?? 0),
                0
              );

              return (
                <div className="flex flex-col gap-3">
                  {/* Turn & 3-Victory Progress Header */}
                  <div className="space-y-1.5 border-b border-slate-800 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-pink-300">
                        {duelView.step === "Finished"
                          ? "Kết thúc ván đấu"
                          : `Lượt ${duelView.turnNumber} • Splendor Duel`}
                      </span>
                      {duelView.extraTurnQueued && (
                        <span className="rounded-md bg-sky-500/20 border border-sky-400/50 px-1.5 py-0.5 text-[10px] font-bold text-sky-200">
                          🔄 Thêm lượt
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-extrabold text-white">
                      {duelView.step === "Finished"
                        ? `🏆 ${
                            duelView.seats.find(
                              (s) => s.seatNo === duelView.winnerSeatNo
                            )?.displayName ?? "Người thắng"
                          }`
                        : isMyTurn
                          ? "Đến lượt bạn hành động!"
                          : `Đang chờ ${activeSeat?.displayName ?? "..."}`}
                    </h3>
                    {mySeat && (
                      <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] font-mono">
                        <div className="rounded-lg bg-slate-950/80 border border-slate-800 px-2 py-1 text-center">
                          <span className="text-amber-300 font-bold">
                            ★ {mySeat.points}/20
                          </span>
                        </div>
                        <div className="rounded-lg bg-slate-950/80 border border-slate-800 px-2 py-1 text-center">
                          <span className="text-yellow-300 font-bold">
                            👑 {mySeat.crowns}/10
                          </span>
                        </div>
                        <div className="rounded-lg bg-slate-950/80 border border-slate-800 px-2 py-1 text-center">
                          <span className="text-emerald-300 font-bold">
                            💎 {mySeat.maxSingleColorPoints}/10
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 1: TurnActionStep (Optional + Mandatory Actions) */}
                  {duelView.step === "TurnActionStep" && isMyTurn && mySeat && (
                    <div className="space-y-3">
                      {/* Optional Actions */}
                      <div className="rounded-xl border border-amber-500/30 bg-amber-950/15 p-2.5 space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                          Hành động Phụ (Tùy chọn trước hành động chính)
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            disabled={busy || mySeat.privileges < 1}
                            onClick={() => {
                              setDuelSelectedCells([]);
                              setDuelSelection(null);
                              setDuelPrivilegeMode((v) => !v);
                            }}
                            className={`rounded-lg border px-2 py-2 text-[11px] font-bold transition cursor-pointer disabled:opacity-40 ${
                              duelPrivilegeMode
                                ? "border-amber-300 bg-amber-500 text-slate-950"
                                : "border-amber-500/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25"
                            }`}
                          >
                            📜 Đặc Quyền ({mySeat.privileges})
                          </button>
                          <button
                            type="button"
                            disabled={busy || duelView.bagCount < 1}
                            onClick={() =>
                              sendRoomAction({
                                type: "MATCH_COMMAND",
                                command: { type: "REPLENISH_BOARD" },
                              })
                            }
                            className="rounded-lg border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 px-2 py-2 text-[11px] font-bold text-sky-200 transition cursor-pointer disabled:opacity-40"
                            title="Nạp đầy bàn 5×5 từ túi (đối thủ nhận 1 Cuộn Đặc Quyền)"
                          >
                            🌀 Nạp Bàn ({duelView.bagCount})
                          </button>
                        </div>
                        {duelPrivilegeMode && (
                          <p className="text-[11px] text-amber-200 leading-snug">
                            👉 Hãy bấm trực tiếp vào 1 viên Đá quý hoặc Ngọc
                            Trai bất kỳ trên bàn 5×5 (không chọn xu Vàng).
                          </p>
                        )}
                      </div>

                      {/* Mandatory Action 1: Take 1-3 Contiguous Line Tokens */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950/65 p-2.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                            1. Lấy 1–3 Đá Quý Thẳng Hàng
                          </span>
                          {duelSelectedCells.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setDuelSelectedCells([])}
                              className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                            >
                              Xóa chọn
                            </button>
                          )}
                        </div>
                        {duelSelectedCells.length === 0 ? (
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Bấm chọn 1–3 viên liền kề (ngang/dọc/chéo) trên bàn
                            5×5. Không chọn xu Vàng.
                          </p>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {lineCheck.tokens.map((tok, i) => (
                              <span
                                key={`${tok}-${i}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-bold text-slate-100"
                              >
                                <DuelTokenIconCanvas color={tok} size={15} />
                                {DUEL_TOKEN_META[tok].shortVi}
                              </span>
                            ))}
                          </div>
                        )}
                        {lineGivesOppPrivilege && (
                          <p className="text-[10px] text-amber-300 leading-snug">
                            ⚠️ Lấy 3 viên cùng màu hoặc 2 Ngọc Trai sẽ tặng đối
                            thủ 1 Cuộn Đặc Quyền!
                          </p>
                        )}
                        <button
                          type="button"
                          disabled={busy || !lineCheck.valid}
                          onClick={() =>
                            sendRoomAction({
                              type: "MATCH_COMMAND",
                              command: {
                                type: "TAKE_LINE",
                                cells: duelSelectedCells,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3 py-2 text-xs font-extrabold text-slate-950 transition cursor-pointer disabled:opacity-40"
                        >
                          ✓ Xác Nhận Lấy {duelSelectedCells.length} Viên
                        </button>
                      </div>

                      {/* Mandatory Action 2 & 3: Buy / Reserve Selected Card or Deck */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950/65 p-2.5 space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
                          2. Mua Hoặc Đặt Cọc Thẻ Trang Sức
                        </span>
                        {!duelSelection ? (
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Bấm vào 1 thẻ trên Kim tự tháp (5/4/3), 1 chồng bài
                            úp, hoặc thẻ đã đặt cọc của bạn.
                          </p>
                        ) : duelSelection.kind === "deck" ? (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-200 font-semibold">
                              Đang chọn: Chồng bài úp Cấp {duelSelection.tier}
                            </p>
                            {!effectiveGoldCell && (
                              <p className="text-[11px] text-rose-300">
                                ⚠️ Cần có ít nhất 1 xu Vàng trên bàn 5×5 để đặt
                                cọc thẻ trong Splendor Duel!
                              </p>
                            )}
                            <button
                              type="button"
                              disabled={
                                busy ||
                                !effectiveGoldCell ||
                                mySeat.reservedCards.length >= 3
                              }
                              onClick={() => {
                                if (!effectiveGoldCell) return;
                                void sendRoomAction({
                                  type: "MATCH_COMMAND",
                                  command: {
                                    type: "RESERVE_DECK",
                                    tier: duelSelection.tier,
                                    goldCell: effectiveGoldCell,
                                  },
                                });
                              }}
                              className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-2 text-xs font-extrabold text-slate-950 transition cursor-pointer disabled:opacity-40"
                            >
                              🪙 Đặt Cọc Úp Cấp {duelSelection.tier} (+1 Vàng)
                            </button>
                          </div>
                        ) : selectedCard ? (
                          <div className="space-y-2">
                            <div className="flex items-start gap-2.5">
                              <DuelCardPreviewCanvas
                                card={selectedCard}
                                width={96}
                                height={145}
                                affordable={!!selectedCardPay?.affordable}
                              />
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="text-xs font-bold text-white">
                                  Thẻ Cấp {selectedCard.tier} • ★
                                  {selectedCard.points}
                                  {selectedCard.crowns > 0
                                    ? ` • 👑×${selectedCard.crowns}`
                                    : ""}
                                </div>
                                <div className="text-[11px] text-amber-300 font-semibold">
                                  {selectedCard.bonus === "wild"
                                    ? "🌈 Thẻ Đa Sắc"
                                    : selectedCard.bonus
                                      ? `+${selectedCard.bonusCount} ${DUEL_TOKEN_META[selectedCard.bonus].shortVi}`
                                      : "Điểm Thuần (Không màu)"}
                                </div>
                                {selectedCard.power && (
                                  <div className="text-[10px] font-bold text-purple-300">
                                    {selectedCard.power === "EXTRA_TURN"
                                      ? "🔄 Đi thêm 1 lượt"
                                      : selectedCard.power === "TAKE_MATCHING"
                                        ? "➕ Lấy thêm 1 đá cùng màu"
                                        : selectedCard.power === "PRIVILEGE"
                                          ? "📜 Nhận 1 Cuộn Đặc Quyền"
                                          : "🎯 Cướp 1 đá từ đối thủ"}
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {(
                                    [
                                      ...SPLENDOR_GEMS,
                                      "pearl",
                                    ] as (SplendorGemColor | "pearl")[]
                                  )
                                    .filter((c) => selectedCard.cost[c] > 0)
                                    .map((c) => (
                                      <span
                                        key={c}
                                        className="inline-flex items-center gap-1 rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-200"
                                      >
                                        <DuelTokenIconCanvas
                                          color={c}
                                          size={13}
                                        />
                                        {selectedCard.cost[c]}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <button
                                type="button"
                                disabled={busy || !selectedCardPay?.affordable}
                                onClick={() => {
                                  if (duelSelection.kind === "pyramid") {
                                    void sendRoomAction({
                                      type: "MATCH_COMMAND",
                                      command: {
                                        type: "BUY_PYRAMID",
                                        tier: duelSelection.tier,
                                        slotIndex: duelSelection.slotIndex,
                                      },
                                    });
                                  } else if (
                                    duelSelection.kind === "reserved"
                                  ) {
                                    void sendRoomAction({
                                      type: "MATCH_COMMAND",
                                      command: {
                                        type: "BUY_RESERVED",
                                        reservedIndex:
                                          duelSelection.reservedIndex,
                                      },
                                    });
                                  }
                                }}
                                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3 py-2 text-xs font-extrabold text-slate-950 transition cursor-pointer disabled:opacity-40"
                              >
                                {selectedCardPay?.affordable
                                  ? `💎 Mua Thẻ Này${
                                      selectedCardPay.goldNeeded > 0
                                        ? ` (dùng ${selectedCardPay.goldNeeded} Vàng)`
                                        : ""
                                    }`
                                  : "Chưa đủ đá quý để mua"}
                              </button>
                              {duelSelection.kind === "pyramid" && (
                                <button
                                  type="button"
                                  disabled={
                                    busy ||
                                    !effectiveGoldCell ||
                                    mySeat.reservedCards.length >= 3
                                  }
                                  onClick={() => {
                                    if (!effectiveGoldCell) return;
                                    void sendRoomAction({
                                      type: "MATCH_COMMAND",
                                      command: {
                                        type: "RESERVE_PYRAMID",
                                        tier: duelSelection.tier,
                                        slotIndex: duelSelection.slotIndex,
                                        goldCell: effectiveGoldCell,
                                      },
                                    });
                                  }}
                                  className="w-full rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-3 py-2 text-xs font-bold text-amber-200 transition cursor-pointer disabled:opacity-40"
                                >
                                  {effectiveGoldCell
                                    ? "🪙 Đặt Cọc Thẻ Này (+1 Xu Vàng)"
                                    : "Hết xu Vàng trên bàn để đặt cọc"}
                                </button>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {/* Step 2: WildColorPickStep */}
                  {duelView.step === "WildColorPickStep" &&
                    isMyTurn &&
                    mySeat && (
                      <div className="space-y-2 rounded-xl border border-fuchsia-500/40 bg-fuchsia-950/20 p-3">
                        <p className="text-xs font-bold text-fuchsia-200">
                          🌈 Chọn 1 màu đá quý để gắn thẻ Đa Sắc:
                        </p>
                        <div className="grid grid-cols-1 gap-1.5">
                          {SPLENDOR_GEMS.map((gem) => (
                            <button
                              key={gem}
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                sendRoomAction({
                                  type: "MATCH_COMMAND",
                                  command: {
                                    type: "PICK_WILD_COLOR",
                                    color: gem,
                                  },
                                })
                              }
                              className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 hover:border-fuchsia-400 px-3 py-2 text-xs font-bold text-slate-100 transition cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <DuelTokenIconCanvas color={gem} size={18} />
                                {DUEL_TOKEN_META[gem].nameVi}
                              </span>
                              <span className="font-mono text-amber-300">
                                +{mySeat.bonuses[gem]} • ★
                                {mySeat.colorPoints[gem]}/10
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Step 3: TakeMatchingStep */}
                  {duelView.step === "TakeMatchingStep" && isMyTurn && (
                    <div className="space-y-2 rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-3">
                      <p className="text-xs font-bold text-emerald-200">
                        ➕ Kỹ năng Lấy Thêm Đá Cùng Màu
                      </p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Bấm vào 1 viên{" "}
                        <strong>
                          {duelView.pendingMatchColor
                            ? DUEL_TOKEN_META[duelView.pendingMatchColor].nameVi
                            : "đá quý"}
                        </strong>{" "}
                        đang phát sáng trên bàn 5×5 để lấy miễn phí!
                      </p>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          sendRoomAction({
                            type: "MATCH_COMMAND",
                            command: { type: "SKIP_TAKE_MATCHING" },
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-bold text-slate-200 transition cursor-pointer"
                      >
                        Bỏ qua
                      </button>
                    </div>
                  )}

                  {/* Step 4: StealTokenStep */}
                  {duelView.step === "StealTokenStep" &&
                    isMyTurn &&
                    oppSeat && (
                      <div className="space-y-2 rounded-xl border border-rose-500/40 bg-rose-950/20 p-3">
                        <p className="text-xs font-bold text-rose-200">
                          🎯 Cướp 1 viên đá quý từ {oppSeat.displayName}:
                        </p>
                        <div className="grid grid-cols-1 gap-1.5">
                          {(
                            [
                              ...SPLENDOR_GEMS,
                              "pearl",
                            ] as (SplendorGemColor | "pearl")[]
                          )
                            .filter((c) => oppSeat.tokens[c] > 0)
                            .map((col) => (
                              <button
                                key={col}
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  sendRoomAction({
                                    type: "MATCH_COMMAND",
                                    command: {
                                      type: "STEAL_TOKEN",
                                      color: col,
                                    },
                                  })
                                }
                                className="flex items-center justify-between rounded-lg border border-rose-500/40 bg-slate-900 hover:bg-rose-950/50 px-3 py-2 text-xs font-bold text-slate-100 transition cursor-pointer"
                              >
                                <span className="flex items-center gap-2">
                                  <DuelTokenIconCanvas color={col} size={18} />
                                  {DUEL_TOKEN_META[col].nameVi}
                                </span>
                                <span className="font-mono text-rose-300">
                                  ×{oppSeat.tokens[col]}
                                </span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                  {/* Step 5: DiscardTokensStep (>10 tokens) */}
                  {duelView.step === "DiscardTokensStep" &&
                    isMyTurn &&
                    mySeat && (
                      <div className="space-y-2.5 rounded-xl border border-amber-500/40 bg-amber-950/20 p-3">
                        <p className="text-xs text-amber-200 font-semibold">
                          Bạn đang giữ {mySeat.totalTokens}/10 xu. Hãy trả vào
                          túi đúng {excessTokens} xu ({discardSum}/
                          {excessTokens}):
                        </p>
                        <div className="space-y-1.5">
                          {DUEL_TOKEN_COLORS.filter(
                            (c) => mySeat.tokens[c] > 0
                          ).map((col) => {
                            const held = mySeat.tokens[col];
                            const drop = duelDiscardBag[col] ?? 0;
                            return (
                              <div
                                key={col}
                                className="flex items-center justify-between text-xs bg-slate-900/90 rounded-lg px-2.5 py-1.5 border border-slate-800"
                              >
                                <div className="flex items-center gap-2">
                                  <DuelTokenIconCanvas color={col} size={18} />
                                  <span className="font-semibold text-slate-200">
                                    {DUEL_TOKEN_META[col].shortVi} ({held})
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDuelDiscardBag((b) => ({
                                        ...b,
                                        [col]: Math.max(0, (b[col] ?? 0) - 1),
                                      }))
                                    }
                                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 font-bold cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="w-5 text-center font-mono font-bold text-amber-300">
                                    {drop}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDuelDiscardBag((b) => ({
                                        ...b,
                                        [col]: Math.min(
                                          held,
                                          (b[col] ?? 0) + 1
                                        ),
                                      }))
                                    }
                                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 font-bold cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          disabled={busy || discardSum !== excessTokens}
                          onClick={() =>
                            sendRoomAction({
                              type: "MATCH_COMMAND",
                              command: {
                                type: "DISCARD_TOKENS",
                                tokens: duelDiscardBag,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-2 text-xs font-extrabold text-slate-950 transition cursor-pointer disabled:opacity-40"
                        >
                          Xác nhận trả {discardSum}/{excessTokens} xu vào túi
                        </button>
                      </div>
                    )}

                  {/* Step 6: RoyalPickStep */}
                  {duelView.step === "RoyalPickStep" && isMyTurn && (
                    <div className="space-y-2 rounded-xl border border-amber-500/40 bg-amber-950/20 p-3">
                      <p className="text-xs text-amber-200 font-bold">
                        👑 Chạm mốc Vương Miện! Chọn 1 Thẻ Hoàng Gia:
                      </p>
                      {duelView.royals.map((royal) => (
                        <button
                          key={royal.id}
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            sendRoomAction({
                              type: "MATCH_COMMAND",
                              command: {
                                type: "PICK_ROYAL",
                                royalId: royal.id,
                              },
                            })
                          }
                          className="w-full flex items-center justify-between rounded-xl border border-amber-500/40 bg-slate-900 hover:bg-amber-950/40 px-3 py-2 text-xs font-bold text-amber-100 transition cursor-pointer"
                        >
                          <span>👑 {royal.nameVi}</span>
                          <span className="font-mono text-amber-300">
                            +{royal.points}đ{" "}
                            {royal.power === "EXTRA_TURN"
                              ? "🔄"
                              : royal.power === "PRIVILEGE"
                                ? "📜"
                                : royal.power === "STEAL"
                                  ? "🎯"
                                  : ""}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Step 7: Finished Rematch */}
                  {duelView.step === "Finished" && (
                    <div className="space-y-2.5 rounded-xl border border-amber-500/40 bg-amber-950/20 p-3">
                      <p className="text-xs text-amber-200 font-semibold leading-relaxed">
                        {duelView.winReasonVi}
                      </p>
                      {snapshot?.isHost && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => sendRoomAction({ type: "REMATCH" })}
                          className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-2.5 text-xs font-extrabold text-slate-950 transition cursor-pointer"
                        >
                          🔁 Chơi Ván Mới (Về Sảnh)
                        </button>
                      )}
                    </div>
                  )}

                  {!isMyTurn && duelView.step !== "Finished" && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400 leading-relaxed">
                      ⏳ Đang chờ{" "}
                      <strong className="text-slate-200">
                        {activeSeat?.displayName}
                      </strong>{" "}
                      thực hiện nước đi trên bàn 5×5...
                    </div>
                  )}
                </div>
              );
            })()
          ) : isSplendor && splendorView ? (
            /* Splendor Right-Side Action Selection Panel */
            (() => {
              const mySeat = splendorView.seats.find(
                (s) => s.seatNo === snapshot?.viewerSeatNo
              );
              const activeSeat = splendorView.seats.find(
                (s) => s.seatNo === splendorView.activeSeatNo
              );
              const isMyTurn =
                splendorView.activeSeatNo === snapshot?.viewerSeatNo;

              const availGemColors = SPLENDOR_GEMS.filter(
                (g) => splendorView.supply[g] > 0
              );
              const expectedDistinct = Math.min(3, availGemColors.length);
              const isValidDouble =
                splendorSelectedGems.length === 2 &&
                splendorSelectedGems[0] === splendorSelectedGems[1] &&
                splendorView.supply[splendorSelectedGems[0]] >= 4;
              const isValidDistinct =
                splendorSelectedGems.length > 0 &&
                splendorSelectedGems.length === expectedDistinct &&
                new Set(splendorSelectedGems).size ===
                  splendorSelectedGems.length;
              const canConfirmTakeGems = isValidDouble || isValidDistinct;

              // Resolve selected card from market or reserved
              const selectedCard =
                splendorSelection?.kind === "market"
                  ? splendorView.market[splendorSelection.tier]?.[
                      splendorSelection.slotIndex
                    ] ?? null
                  : splendorSelection?.kind === "reserved"
                    ? mySeat?.reservedCards[splendorSelection.reservedIndex]
                        ?.card ?? null
                    : null;
              const selectedCardPay =
                selectedCard && mySeat
                  ? computeCardPayment(mySeat, selectedCard)
                  : null;

              const excessTokens = mySeat
                ? Math.max(0, mySeat.totalTokens - 10)
                : 0;
              const discardSum = SPLENDOR_TOKEN_COLORS.reduce(
                (acc, c) => acc + (splendorDiscardBag[c] ?? 0),
                0
              );

              return (
                <div className="flex flex-col gap-3">
                  {/* Turn & Points Header */}
                  <div className="space-y-1.5 border-b border-slate-800 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                        {splendorView.step === "Finished"
                          ? "Kết thúc ván đấu"
                          : splendorView.step === "DiscardTokensStep"
                            ? isMyTurn
                              ? `⚠️ Trả lại ${excessTokens} xu thừa`
                              : "Đối thủ đang trả xu thừa"
                            : splendorView.step === "NoblePickStep"
                              ? isMyTurn
                                ? "👑 Chọn 1 Quý Tộc ghé thăm"
                                : "Đối thủ đang chọn Quý Tộc"
                              : isMyTurn
                                ? "💎 Lượt của bạn"
                                : `Lượt: ${activeSeat?.displayName ?? ""}`}
                      </span>
                      {mySeat && (
                        <span className="rounded-md bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 text-xs font-bold text-amber-300 font-mono">
                          ★ {mySeat.points}/{splendorView.targetPoints}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {splendorView.step === "Finished"
                        ? splendorView.winReasonVi
                        : splendorView.finalRoundTriggered
                          ? "🔔 VÒNG CUỐI ĐANG DIỄN RA! Hoàn tất lượt cho mọi người chơi."
                          : isMyTurn
                            ? "Chạm đá quý bên phải bàn để lấy xu, hoặc chạm thẻ bài trên bàn để Mua / Đặt cọc."
                            : "Đang chờ thương nhân khác hoàn thành lượt..."}
                    </p>
                  </div>

                  {/* Step 1: TurnActionStep Controls */}
                  {splendorView.step === "TurnActionStep" && isMyTurn && mySeat && (
                    <div className="flex flex-col gap-2.5">
                      {/* A. Take Gems Picker */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950/65 p-2.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            1. Lấy Đá Quý (3 khác / 2 cùng màu)
                          </span>
                          {splendorSelectedGems.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSplendorSelectedGems([])}
                              className="text-[10px] text-rose-300 hover:text-rose-200 cursor-pointer"
                            >
                              Xoá chọn
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {SPLENDOR_GEMS.map((gem) => {
                            const qty = splendorView.supply[gem];
                            const cnt = splendorSelectedGems.filter(
                              (g) => g === gem
                            ).length;
                            return (
                              <button
                                key={gem}
                                type="button"
                                disabled={busy || qty <= 0}
                                onClick={() => handleClickSplendorGem(gem)}
                                className={`flex flex-col items-center gap-0.5 rounded-lg border py-1.5 px-1 transition cursor-pointer disabled:opacity-35 ${
                                  cnt > 0
                                    ? "border-amber-400 bg-amber-500/20"
                                    : "border-slate-700 bg-slate-900 hover:bg-slate-800"
                                }`}
                                title={`${SPLENDOR_GEM_META[gem].nameVi} (còn ${qty})`}
                              >
                                <SplendorGemIconCanvas color={gem} size={20} />
                                <span className="text-[10px] font-mono font-bold text-slate-200">
                                  {cnt > 0 ? `+${cnt}` : qty}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          disabled={busy || !canConfirmTakeGems}
                          onClick={() =>
                            sendRoomAction({
                              type: "MATCH_COMMAND",
                              command: {
                                type: "TAKE_GEMS",
                                gems: splendorSelectedGems,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition cursor-pointer disabled:opacity-40"
                        >
                          {isValidDouble
                            ? `💎 Lấy 2 xu ${SPLENDOR_GEM_META[splendorSelectedGems[0]].nameVi}`
                            : isValidDistinct
                              ? `💎 Lấy ${splendorSelectedGems.length} xu đã chọn`
                              : `Chọn ${expectedDistinct} màu khác nhau (hoặc bấm đúp 1 màu ≥ 4 xu)`}
                        </button>
                      </div>

                      {/* B. Selected Card or Deck Action Box (Buy / Reserve) */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950/65 p-2.5 space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                          2. Mua / Đặt Cọc Thẻ Đang Chọn
                        </span>

                        {splendorSelection?.kind === "deck" ? (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-200">
                              Đang chọn rút úp <strong>Chồng Cấp {splendorSelection.tier}</strong>{" "}
                              (còn {splendorView.deckCounts[splendorSelection.tier]} lá).
                            </p>
                            <button
                              type="button"
                              disabled={
                                busy ||
                                mySeat.reservedCards.length >= 3 ||
                                splendorView.deckCounts[splendorSelection.tier] <= 0
                              }
                              onClick={() =>
                                sendRoomAction({
                                  type: "MATCH_COMMAND",
                                  command: {
                                    type: "RESERVE_DECK",
                                    tier: splendorSelection.tier,
                                  },
                                })
                              }
                              className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-2 text-xs font-bold text-slate-950 transition cursor-pointer disabled:opacity-40"
                            >
                              🔒 Rút úp Đặt Cọc Cấp {splendorSelection.tier}
                              {splendorView.supply.gold > 0 ? " (+1 Vàng)" : ""}
                            </button>
                          </div>
                        ) : selectedCard && selectedCardPay ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs bg-slate-900/90 rounded-lg px-2.5 py-1.5 border border-slate-800">
                              <div className="flex items-center gap-1.5">
                                <SplendorGemIconCanvas
                                  color={selectedCard.bonus}
                                  size={18}
                                />
                                <span className="font-bold text-slate-100">
                                  Cấp {selectedCard.tier} •{" "}
                                  {SPLENDOR_GEM_META[selectedCard.bonus].nameVi}
                                </span>
                              </div>
                              <span className="font-mono font-extrabold text-amber-300">
                                +{selectedCard.points}đ
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5 text-[11px]">
                              {SPLENDOR_GEMS.filter(
                                (g) => selectedCard.cost[g] > 0
                              ).map((g) => (
                                <span
                                  key={g}
                                  className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono"
                                >
                                  <SplendorGemIconCanvas color={g} size={14} />
                                  {selectedCard.cost[g]}
                                </span>
                              ))}
                              {selectedCardPay.affordable &&
                                selectedCardPay.goldNeeded > 0 && (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 text-amber-300 font-mono">
                                    Dùng {selectedCardPay.goldNeeded} Vàng
                                  </span>
                                )}
                            </div>

                            <button
                              type="button"
                              disabled={busy || !selectedCardPay.affordable}
                              onClick={() => {
                                if (splendorSelection?.kind === "market") {
                                  void sendRoomAction({
                                    type: "MATCH_COMMAND",
                                    command: {
                                      type: "BUY_MARKET",
                                      tier: splendorSelection.tier,
                                      slotIndex: splendorSelection.slotIndex,
                                    },
                                  });
                                } else if (
                                  splendorSelection?.kind === "reserved"
                                ) {
                                  void sendRoomAction({
                                    type: "MATCH_COMMAND",
                                    command: {
                                      type: "BUY_RESERVED",
                                      reservedIndex:
                                        splendorSelection.reservedIndex,
                                    },
                                  });
                                }
                              }}
                              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-3 py-2 text-xs font-extrabold text-slate-950 transition cursor-pointer disabled:opacity-40"
                            >
                              {selectedCardPay.affordable
                                ? "✨ MUA THẺ NÀY"
                                : "Chưa đủ đá quý để mua"}
                            </button>

                            {splendorSelection?.kind === "market" && (
                              <button
                                type="button"
                                disabled={
                                  busy || mySeat.reservedCards.length >= 3
                                }
                                onClick={() =>
                                  sendRoomAction({
                                    type: "MATCH_COMMAND",
                                    command: {
                                      type: "RESERVE_MARKET",
                                      tier: splendorSelection.tier,
                                      slotIndex: splendorSelection.slotIndex,
                                    },
                                  })
                                }
                                className="w-full rounded-xl border border-amber-500/50 bg-amber-500/15 hover:bg-amber-500/25 px-3 py-2 text-xs font-bold text-amber-200 transition cursor-pointer disabled:opacity-40"
                              >
                                🔒 Đặt Cọc ({mySeat.reservedCards.length}/3)
                                {splendorView.supply.gold > 0
                                  ? " + 1 Vàng Joker"
                                  : ""}
                              </button>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Chạm vào 1 lá bài (viền xanh là đã đủ tiền mua) hoặc
                            chồng bài I/II/III trên bàn Canvas để Mua hoặc Đặt
                            cọc.
                          </p>
                        )}
                      </div>

                      {/* C. Viewer's Reserved Cards Quick List */}
                      {mySeat.reservedCards.length > 0 && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/65 p-2.5 space-y-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 block">
                            Thẻ Đã Đặt Cọc ({mySeat.reservedCards.length}/3)
                          </span>
                          {mySeat.reservedCards.map((slot, rIdx) => {
                            const c = slot.card;
                            if (!c) return null;
                            const ok = computeCardPayment(mySeat, c).affordable;
                            const isSel =
                              splendorSelection?.kind === "reserved" &&
                              splendorSelection.reservedIndex === rIdx;
                            return (
                              <button
                                key={`${c.id}-${rIdx}`}
                                type="button"
                                onClick={() => {
                                  setSplendorSelectedGems([]);
                                  setSplendorSelection({
                                    kind: "reserved",
                                    reservedIndex: rIdx,
                                  });
                                }}
                                className={`w-full flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs transition cursor-pointer ${
                                  isSel
                                    ? "border-amber-400 bg-amber-500/20"
                                    : ok
                                      ? "border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-900/40"
                                      : "border-slate-800 bg-slate-900 hover:bg-slate-800"
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <SplendorGemIconCanvas
                                    color={c.bonus}
                                    size={16}
                                  />
                                  <span className="font-bold text-slate-100">
                                    Cấp {c.tier} (+{c.points}đ)
                                  </span>
                                </div>
                                <span
                                  className={`text-[10px] font-bold ${
                                    ok ? "text-emerald-300" : "text-slate-400"
                                  }`}
                                >
                                  {ok ? "✓ Mua được" : "Xem giá"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: DiscardTokensStep (When viewer holds > 10 tokens) */}
                  {splendorView.step === "DiscardTokensStep" &&
                    isMyTurn &&
                    mySeat && (
                      <div className="rounded-xl border border-amber-500/50 bg-amber-950/30 p-3 space-y-2.5">
                        <p className="text-xs font-bold text-amber-200">
                          Bạn đang cầm {mySeat.totalTokens}/10 xu. Chọn trả lại
                          đúng {excessTokens} xu ({discardSum}/{excessTokens}):
                        </p>
                        <div className="space-y-1.5">
                          {SPLENDOR_TOKEN_COLORS.filter(
                            (c) => mySeat.tokens[c] > 0
                          ).map((col) => {
                            const held = mySeat.tokens[col];
                            const drop = splendorDiscardBag[col] ?? 0;
                            return (
                              <div
                                key={col}
                                className="flex items-center justify-between text-xs bg-slate-900/90 rounded-lg px-2.5 py-1.5 border border-slate-800"
                              >
                                <div className="flex items-center gap-2">
                                  <SplendorGemIconCanvas
                                    color={col}
                                    size={18}
                                  />
                                  <span className="font-semibold text-slate-200">
                                    {SPLENDOR_GEM_META[col].nameVi} (có {held})
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSplendorDiscardBag((b) => ({
                                        ...b,
                                        [col]: Math.max(0, (b[col] ?? 0) - 1),
                                      }))
                                    }
                                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 font-bold cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="w-5 text-center font-mono font-bold text-amber-300">
                                    {drop}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSplendorDiscardBag((b) => ({
                                        ...b,
                                        [col]: Math.min(
                                          held,
                                          (b[col] ?? 0) + 1
                                        ),
                                      }))
                                    }
                                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 font-bold cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          disabled={busy || discardSum !== excessTokens}
                          onClick={() =>
                            sendRoomAction({
                              type: "MATCH_COMMAND",
                              command: {
                                type: "DISCARD_TOKENS",
                                tokens: splendorDiscardBag,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-2 text-xs font-extrabold text-slate-950 transition cursor-pointer disabled:opacity-40"
                        >
                          Xác nhận trả {discardSum}/{excessTokens} xu thừa
                        </button>
                      </div>
                    )}

                  {/* Step 3: NoblePickStep */}
                  {splendorView.step === "NoblePickStep" && isMyTurn && (
                    <div className="space-y-2">
                      <p className="text-xs text-amber-200 font-semibold">
                        Chọn 1 Quý Tộc ghé thăm (+3 điểm Uy Tín):
                      </p>
                      {splendorView.nobles
                        .filter((n) =>
                          splendorView.eligibleNobleIds.includes(n.id)
                        )
                        .map((noble) => (
                          <button
                            key={noble.id}
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              sendRoomAction({
                                type: "MATCH_COMMAND",
                                command: {
                                  type: "PICK_NOBLE",
                                  nobleId: noble.id,
                                },
                              })
                            }
                            className="w-full rounded-xl border border-amber-400/60 bg-amber-500/20 hover:bg-amber-500/35 px-3 py-2.5 text-xs font-bold text-amber-100 transition cursor-pointer"
                          >
                            👑 Mời {noble.nameVi} (+3 điểm)
                          </button>
                        ))}
                    </div>
                  )}

                  {/* Step 4: Finished / Rematch */}
                  {splendorView.step === "Finished" && snapshot?.isHost && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => sendRoomAction({ type: "REMATCH" })}
                      className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg transition cursor-pointer"
                    >
                      🔄 Chơi Ván Mới (Về Sảnh Chờ)
                    </button>
                  )}
                </div>
              );
            })()
          ) : isCoup && coupView ? (
            /* Coup: Đảo Chính Right-Side Action & Reaction Controls */
            (() => {
              const mySeat = coupView.seats.find(
                (s) => s.seatNo === snapshot?.viewerSeatNo
              );
              const myAlive = mySeat?.alive ?? false;
              const myCoins = mySeat?.coins ?? 0;
              const isMyTurn = coupView.activeSeatNo === snapshot?.viewerSeatNo;
              const mustCoup = myCoins >= 10;
              const pending = coupView.pendingAction;
              const block = coupView.pendingBlock;

              return (
                <div className="flex flex-col gap-3">
                  <div className="space-y-1.5 border-b border-slate-800 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                        {coupView.step === "Finished"
                          ? "Kết thúc ván đấu"
                          : coupView.step === "TurnActionStep"
                            ? isMyTurn
                              ? "👑 Lượt của bạn"
                              : "Đang chờ lượt"
                            : coupView.step === "ReactionWindowStep"
                              ? "⚡ Cửa sổ Phản ứng"
                              : coupView.step === "BlockChallengeStep"
                                ? "🛡️ Phản ứng cú Chặn"
                                : coupView.step === "LoseInfluenceStep"
                                  ? "💔 Lật bỏ 1 lá bài"
                                  : "🔄 Đại Sứ đổi bài"}
                      </span>
                      {mySeat && (
                        <span className="rounded-md bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 text-xs font-bold text-amber-300">
                          {myCoins} ISK
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {coupView.lastChallengeBannerVi ??
                        (targetSeatObj
                          ? `🎯 Mục tiêu đang chọn: ${targetSeatObj.displayName}`
                          : "Chạm trực tiếp vào đối thủ trên bàn Canvas bên trái để chọn mục tiêu.")}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Chọn Hành Động
                    </span>

                    {/* 1. TurnActionStep Buttons for Active Player */}
                    {coupView.step === "TurnActionStep" &&
                      myAlive &&
                      isMyTurn && (
                        <>
                          {!mustCoup && (
                            <>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    sendRoomAction({
                                      type: "MATCH_COMMAND",
                                      command: {
                                        type: "DECLARE_ACTION",
                                        action: "INCOME",
                                      },
                                    })
                                  }
                                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2.5 text-xs font-bold text-slate-100 transition cursor-pointer"
                                >
                                  <CoupActionIconCanvas kind="INCOME" size={20} />
                                  <span>+1 Thu Nhập</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    sendRoomAction({
                                      type: "MATCH_COMMAND",
                                      command: {
                                        type: "DECLARE_ACTION",
                                        action: "FOREIGN_AID",
                                      },
                                    })
                                  }
                                  className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-3 py-2.5 text-xs font-bold text-amber-200 transition cursor-pointer"
                                >
                                  <CoupActionIconCanvas
                                    kind="FOREIGN_AID"
                                    size={22}
                                  />
                                  <span>+2 Viện Trợ</span>
                                </button>
                              </div>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  sendRoomAction({
                                    type: "MATCH_COMMAND",
                                    command: {
                                      type: "DECLARE_ACTION",
                                      action: "TAX",
                                    },
                                  })
                                }
                                className="w-full flex items-center gap-2.5 text-left rounded-xl border border-pink-500/50 bg-pink-600/20 hover:bg-pink-600/35 px-3 py-2.5 text-xs font-bold text-pink-100 transition cursor-pointer"
                              >
                                <CoupActionIconCanvas kind="Duke" size={22} />
                                <span>Duke: Thu Thuế (+3 xu)</span>
                              </button>
                              <button
                                type="button"
                                disabled={
                                  busy ||
                                  myCoins < 3 ||
                                  !targetSeatObj ||
                                  targetSeatObj.seatNo === snapshot?.viewerSeatNo
                                }
                                onClick={() =>
                                  sendRoomAction({
                                    type: "MATCH_COMMAND",
                                    command: {
                                      type: "DECLARE_ACTION",
                                      action: "ASSASSINATE",
                                      targetSeatNo: selectedTargetSeatNo,
                                    },
                                  })
                                }
                                className="w-full flex items-center gap-2.5 text-left rounded-xl border border-slate-500/60 bg-slate-800/90 hover:bg-slate-700 px-3 py-2.5 text-xs font-bold text-slate-100 transition cursor-pointer disabled:opacity-40"
                              >
                                <CoupActionIconCanvas
                                  kind="Assassin"
                                  size={22}
                                />
                                <span>Assassin: Ám Sát (-3 xu)</span>
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  sendRoomAction({
                                    type: "MATCH_COMMAND",
                                    command: {
                                      type: "DECLARE_ACTION",
                                      action: "EXCHANGE",
                                    },
                                  })
                                }
                                className="w-full flex items-center gap-2.5 text-left rounded-xl border border-lime-500/50 bg-lime-600/20 hover:bg-lime-600/35 px-3 py-2.5 text-xs font-bold text-lime-100 transition cursor-pointer"
                              >
                                <CoupActionIconCanvas
                                  kind="Ambassador"
                                  size={22}
                                />
                                <span>Ambassador: Đổi Bài</span>
                              </button>
                              <button
                                type="button"
                                disabled={
                                  busy ||
                                  !targetSeatObj ||
                                  targetSeatObj.seatNo === snapshot?.viewerSeatNo
                                }
                                onClick={() =>
                                  sendRoomAction({
                                    type: "MATCH_COMMAND",
                                    command: {
                                      type: "DECLARE_ACTION",
                                      action: "STEAL",
                                      targetSeatNo: selectedTargetSeatNo,
                                    },
                                  })
                                }
                                className="w-full flex items-center gap-2.5 text-left rounded-xl border border-sky-500/50 bg-sky-600/20 hover:bg-sky-600/35 px-3 py-2.5 text-xs font-bold text-sky-100 transition cursor-pointer disabled:opacity-40"
                              >
                                <CoupActionIconCanvas
                                  kind="Captain"
                                  size={22}
                                />
                                <span>Captain: Cướp (+2 xu)</span>
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            disabled={
                              busy ||
                              myCoins < 7 ||
                              !targetSeatObj ||
                              targetSeatObj.seatNo === snapshot?.viewerSeatNo
                            }
                            onClick={() =>
                              sendRoomAction({
                                type: "MATCH_COMMAND",
                                command: {
                                  type: "DECLARE_ACTION",
                                  action: "COUP",
                                  targetSeatNo: selectedTargetSeatNo,
                                },
                              })
                            }
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow transition cursor-pointer disabled:opacity-40"
                          >
                            <CoupActionIconCanvas kind="COUP" size={20} />
                            <span>
                              Đảo Chính (-7 xu)
                              {targetSeatObj
                                ? ` → ${targetSeatObj.displayName}`
                                : ""}
                            </span>
                          </button>
                        </>
                      )}

                    {coupView.step === "TurnActionStep" &&
                      (!myAlive || !isMyTurn) && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
                          {myAlive
                            ? "Đang chờ người chơi có lượt chọn hành động..."
                            : "Bạn đã mất hết quyền lực và đang theo dõi ván đấu."}
                        </div>
                      )}

                    {/* 2. ReactionWindowStep Buttons for Non-Acting Living Players */}
                    {coupView.step === "ReactionWindowStep" &&
                      myAlive &&
                      pending &&
                      pending.actorSeatNo !== snapshot?.viewerSeatNo && (
                        <>
                          {pending.claimedCharacter && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                sendRoomAction({
                                  type: "MATCH_COMMAND",
                                  command: { type: "CHALLENGE" },
                                })
                              }
                              className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-3.5 py-2.5 text-xs font-bold text-white transition cursor-pointer"
                            >
                              <CoupActionIconCanvas
                                kind="CHALLENGE"
                                size={20}
                              />
                              <span>
                                Bắt Bài (Không tin có{" "}
                                {
                                  COUP_CHARACTER_META[pending.claimedCharacter]
                                    .titleVi
                                }
                                !)
                              </span>
                            </button>
                          )}

                          {pending.type === "FOREIGN_AID" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                sendRoomAction({
                                  type: "MATCH_COMMAND",
                                  command: {
                                    type: "BLOCK",
                                    character: "Duke",
                                  },
                                })
                              }
                              className="w-full flex items-center gap-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 px-3.5 py-2.5 text-xs font-bold text-white transition cursor-pointer"
                            >
                              <CoupActionIconCanvas kind="Duke" size={22} />
                              <span>Chặn Viện Trợ (Nhận là Duke)</span>
                            </button>
                          )}

                          {pending.type === "ASSASSINATE" &&
                            pending.targetSeatNo === snapshot?.viewerSeatNo && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  sendRoomAction({
                                    type: "MATCH_COMMAND",
                                    command: {
                                      type: "BLOCK",
                                      character: "Contessa",
                                    },
                                  })
                                }
                                className="w-full flex items-center gap-2.5 rounded-xl bg-red-600 hover:bg-red-500 px-3.5 py-2.5 text-xs font-bold text-white transition cursor-pointer"
                              >
                                <CoupActionIconCanvas
                                  kind="Contessa"
                                  size={22}
                                />
                                <span>Chặn Ám Sát (Nhận là Contessa)</span>
                              </button>
                            )}

                          {pending.type === "STEAL" &&
                            pending.targetSeatNo === snapshot?.viewerSeatNo && (
                              <>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    sendRoomAction({
                                      type: "MATCH_COMMAND",
                                      command: {
                                        type: "BLOCK",
                                        character: "Captain",
                                      },
                                    })
                                  }
                                  className="w-full flex items-center gap-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 px-3 py-2.5 text-xs font-bold text-white transition cursor-pointer"
                                >
                                  <CoupActionIconCanvas
                                    kind="Captain"
                                    size={22}
                                  />
                                  <span>Chặn Cướp (Captain)</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    sendRoomAction({
                                      type: "MATCH_COMMAND",
                                      command: {
                                        type: "BLOCK",
                                        character: "Ambassador",
                                      },
                                    })
                                  }
                                  className="w-full flex items-center gap-2.5 rounded-xl bg-lime-600 hover:bg-lime-500 px-3 py-2.5 text-xs font-bold text-slate-950 transition cursor-pointer"
                                >
                                  <CoupActionIconCanvas
                                    kind="Ambassador"
                                    size={22}
                                  />
                                  <span>Chặn Cướp (Ambassador)</span>
                                </button>
                              </>
                            )}

                          <button
                            type="button"
                            disabled={busy || mySeat?.hasPassedReaction}
                            onClick={() =>
                              sendRoomAction({
                                type: "MATCH_COMMAND",
                                command: { type: "PASS" },
                              })
                            }
                            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition cursor-pointer disabled:opacity-50"
                          >
                            <CoupActionIconCanvas kind="PASS" size={18} />
                            <span>
                              {mySeat?.hasPassedReaction
                                ? "Đã cho qua"
                                : "Cho Qua"}
                            </span>
                          </button>
                        </>
                      )}

                    {/* 3. BlockChallengeStep Buttons */}
                    {coupView.step === "BlockChallengeStep" &&
                      myAlive &&
                      block &&
                      block.blockerSeatNo !== snapshot?.viewerSeatNo && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              sendRoomAction({
                                type: "MATCH_COMMAND",
                                command: { type: "CHALLENGE" },
                              })
                            }
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-3.5 py-2.5 text-xs font-bold text-white transition cursor-pointer"
                          >
                            <CoupActionIconCanvas kind="CHALLENGE" size={20} />
                            <span>
                              Bắt Bài Cú Chặn (Không tin có{" "}
                              {
                                COUP_CHARACTER_META[block.claimedCharacter]
                                  .titleVi
                              }
                              !)
                            </span>
                          </button>
                          <button
                            type="button"
                            disabled={busy || mySeat?.hasPassedReaction}
                            onClick={() =>
                              sendRoomAction({
                                type: "MATCH_COMMAND",
                                command: { type: "PASS" },
                              })
                            }
                            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition cursor-pointer disabled:opacity-50"
                          >
                            <CoupActionIconCanvas kind="PASS" size={18} />
                            <span>
                              {mySeat?.hasPassedReaction
                                ? "Đã chấp nhận"
                                : "Chấp nhận bị Chặn"}
                            </span>
                          </button>
                        </>
                      )}

                    {/* 4. Finished / Rematch Button */}
                    {coupView.step === "Finished" && snapshot?.isHost && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => sendRoomAction({ type: "REMATCH" })}
                        className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg transition cursor-pointer"
                      >
                        🔄 Chơi Ván Mới (Về Sảnh Chờ)
                      </button>
                    )}
                  </div>
                </div>
              );
            })()
          ) : pv ? (
            <div className="flex flex-col gap-3">
              <div className="space-y-1.5 border-b border-slate-800 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    {pv.phase === "Finished"
                      ? "Kết quả chung cuộc"
                      : pv.step === "NightActionStep"
                        ? "Bước Đêm 1: Hành động"
                        : pv.step === "WitchStep"
                          ? "Bước Đêm 2: Phù Thủy"
                          : pv.step === "HunterRevengeStep"
                            ? "Phát súng Thợ Săn"
                            : pv.step === "DayDiscussionStep"
                              ? "Ban Ngày: Thảo luận"
                              : "Ban Ngày: Bỏ phiếu"}
                  </span>
                  {pv.myRole && (
                    <span className="rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs font-semibold text-sky-300">
                      {ROLE_META[pv.myRole].nameVi}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {pv.phase === "Finished"
                    ? pv.winReasonVi
                    : targetSeatObj
                      ? `🎯 Đang chọn: ${targetSeatObj.displayName}`
                      : "Chạm trực tiếp vào thẻ người chơi trên bàn Canvas bên trái để chọn mục tiêu."}
                </p>
              </div>

              {/* Role & Phase Specific Buttons */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Chọn Hành Động
                </span>

                {pv.step === "NightActionStep" &&
                  pv.myAlive &&
                  pv.myRole === "Werewolf" && (
                    <button
                      type="button"
                      disabled={busy || !targetSeatObj}
                      onClick={() =>
                        sendRoomAction({
                          type: "MATCH_COMMAND",
                          command: {
                            type: "WEREWOLF_VOTE",
                            targetSeatNo: selectedTargetSeatNo,
                            lock: true,
                          },
                        })
                      }
                      className="w-full rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2.5 text-xs font-bold text-white shadow transition cursor-pointer disabled:opacity-40"
                    >
                      🐺{" "}
                      {targetSeatObj
                        ? `Chốt cắn ${targetSeatObj.displayName}`
                        : "Chọn 1 người trên Canvas để cắn"}
                    </button>
                  )}

                {pv.step === "NightActionStep" &&
                  pv.myAlive &&
                  pv.myRole === "Seer" &&
                  !pv.hasSubmittedCurrentStep && (
                    <button
                      type="button"
                      disabled={busy || !targetSeatObj}
                      onClick={() =>
                        sendRoomAction({
                          type: "MATCH_COMMAND",
                          command: {
                            type: "SEER_INSPECT",
                            targetSeatNo: selectedTargetSeatNo,
                          },
                        })
                      }
                      className="w-full rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2.5 text-xs font-bold text-white shadow transition cursor-pointer disabled:opacity-40"
                    >
                      🔮{" "}
                      {targetSeatObj
                        ? `Soi danh tính ${targetSeatObj.displayName}`
                        : "Chọn 1 người trên Canvas để soi"}
                    </button>
                  )}

                {pv.step === "NightActionStep" &&
                  pv.myAlive &&
                  pv.myRole === "Bodyguard" &&
                  !pv.hasSubmittedCurrentStep && (
                    <button
                      type="button"
                      disabled={busy || !targetSeatObj}
                      onClick={() =>
                        sendRoomAction({
                          type: "MATCH_COMMAND",
                          command: {
                            type: "BODYGUARD_PROTECT",
                            targetSeatNo: selectedTargetSeatNo,
                          },
                        })
                      }
                      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow transition cursor-pointer disabled:opacity-40"
                    >
                      🛡️{" "}
                      {targetSeatObj
                        ? `Bảo vệ ${targetSeatObj.displayName}`
                        : "Chọn 1 người trên Canvas để bảo vệ"}
                    </button>
                  )}

                {pv.step === "WitchStep" &&
                  pv.myAlive &&
                  pv.myRole === "Witch" &&
                  !pv.hasSubmittedCurrentStep && (
                    <>
                      {pv.witchState?.healAvailable && witchVictimObj && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setWitchWantHeal((v) => !v)}
                          className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-bold transition cursor-pointer border ${
                            witchWantHeal
                              ? "bg-emerald-600 text-white border-emerald-400"
                              : "bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60"
                          }`}
                        >
                          {witchWantHeal ? "✓ " : "💚 "}
                          Cứu {witchVictimObj.displayName}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          sendRoomAction({
                            type: "MATCH_COMMAND",
                            command: {
                              type: "WITCH_ACT",
                              useHeal: witchWantHeal,
                              poisonTargetSeatNo:
                                pv.witchState?.poisonAvailable
                                  ? selectedTargetSeatNo
                                  : null,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white transition cursor-pointer"
                      >
                        🧪 Xác nhận Phù Thủy (
                        {witchWantHeal ? "Có Cứu" : "Không Cứu"}
                        {pv.witchState?.poisonAvailable && targetSeatObj
                          ? ` + Độc ${targetSeatObj.displayName}`
                          : ""}
                        )
                      </button>
                    </>
                  )}

                {pv.step === "HunterRevengeStep" &&
                  pv.activeHunterSeatNo === snapshot?.viewerSeatNo && (
                    <>
                      <button
                        type="button"
                        disabled={busy || !targetSeatObj}
                        onClick={() =>
                          sendRoomAction({
                            type: "MATCH_COMMAND",
                            command: {
                              type: "HUNTER_SHOOT",
                              targetSeatNo: selectedTargetSeatNo,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition cursor-pointer disabled:opacity-40"
                      >
                        🏹{" "}
                        {targetSeatObj
                          ? `Nổ súng bắn ${targetSeatObj.displayName}!`
                          : "Chọn người trên Canvas để bắn"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          sendRoomAction({
                            type: "MATCH_COMMAND",
                            command: {
                              type: "HUNTER_SHOOT",
                              targetSeatNo: null,
                            },
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition cursor-pointer"
                      >
                        Không nổ súng
                      </button>
                    </>
                  )}

                {pv.step === "DayDiscussionStep" && pv.myAlive && (
                  <button
                    type="button"
                    disabled={busy || pv.hasSubmittedCurrentStep}
                    onClick={() =>
                      sendRoomAction({
                        type: "MATCH_COMMAND",
                        command: { type: "DAY_READY_TO_VOTE" },
                      })
                    }
                    className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition cursor-pointer disabled:opacity-50"
                  >
                    {pv.hasSubmittedCurrentStep
                      ? "✓ Đã sẵn sàng bỏ phiếu"
                      : "🗳️ Sẵn sàng chuyển sang Bỏ phiếu"}
                  </button>
                )}

                {pv.step === "DayVotingStep" && pv.myAlive && (
                  <>
                    <button
                      type="button"
                      disabled={busy || !targetSeatObj}
                      onClick={() =>
                        sendRoomAction({
                          type: "MATCH_COMMAND",
                          command: {
                            type: "DAY_VOTE",
                            targetSeatNo: selectedTargetSeatNo,
                            lock: true,
                          },
                        })
                      }
                      className="w-full rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2.5 text-xs font-bold text-white transition cursor-pointer disabled:opacity-40"
                    >
                      ⚖️{" "}
                      {targetSeatObj
                        ? `Chốt treo cổ ${targetSeatObj.displayName}`
                        : "Chọn 1 người trên Canvas để bỏ phiếu"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        sendRoomAction({
                          type: "MATCH_COMMAND",
                          command: {
                            type: "DAY_VOTE",
                            targetSeatNo: "abstain",
                            lock: true,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition cursor-pointer"
                    >
                      🏳️ Bỏ phiếu trắng (Abstain)
                    </button>
                  </>
                )}

                {pv.phase === "Finished" && snapshot?.isHost && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => sendRoomAction({ type: "REMATCH" })}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg transition cursor-pointer"
                  >
                    🔄 Chơi Ván Mới (Về Sảnh Chờ)
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {/* Bottom quick button inside Right Action Sidebar to open Chat & Event Log */}
          <div className="border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="w-full rounded-xl border border-amber-500/30 bg-slate-950/70 hover:bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-amber-300 flex items-center justify-between transition cursor-pointer"
            >
              <span>💬 Kênh Chat & Nhật Ký</span>
              <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px]">
                {(snapshot?.messages.length ?? 0) +
                  (snapshot?.events.length ?? 0)}
              </span>
            </button>
          </div>
        </aside>
      </main>

      {/* Slide-Over Right Drawer: Kênh Chat & Nhật Ký */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-[1px] z-40"
        />
      )}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 border-l border-slate-800 bg-slate-900/95 backdrop-blur-md shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setDrawerTab("chat")}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                drawerTab === "chat"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              💬 Kênh Chat ({snapshot?.messages.length ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab("events")}
              className={`rounded-lg px-3 py-1.5 transition cursor-pointer ${
                drawerTab === "events"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📜 Nhật Ký ({snapshot?.events.length ?? 0})
            </button>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-300 cursor-pointer"
          >
            Đóng ✕
          </button>
        </div>

        {drawerTab === "chat" ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-800/80 bg-slate-950/30 overflow-x-auto">
              {(snapshot?.channels.length
                ? snapshot.channels
                : [
                    {
                      channelId: "village" as ChannelId,
                      label: "Làng (Công khai)",
                      canRead: true,
                      canWrite: false,
                    },
                  ]
              ).map((ch) => (
                <button
                  key={ch.channelId}
                  type="button"
                  onClick={() => setActiveChannelId(ch.channelId)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    activeChannelId === ch.channelId
                      ? ch.channelId === "werewolf"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : ch.channelId === "graveyard"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-slate-800/70 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {ch.channelId === "werewolf"
                    ? "🐺 "
                    : ch.channelId === "graveyard"
                      ? "🪦 "
                      : "🏡 "}
                  {ch.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 text-xs">
              {channelMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 px-4">
                  <p className="font-medium">
                    Chưa có tin nhắn trong kênh này.
                  </p>
                  <p className="text-[11px] mt-1">
                    {isLobby
                      ? "Bắt đầu ván đấu để mở kênh thảo luận theo pha Ngày/Đêm."
                      : activeChannelPerm?.canWrite
                        ? "Hãy gửi tin nhắn đầu tiên để thảo luận!"
                        : "Kênh này hiện đang khoá ghi ở pha hiện tại."}
                  </p>
                </div>
              ) : (
                channelMessages.map((msg) => {
                  const isMine = msg.senderSeatNo === snapshot?.viewerSeatNo;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isMine ? "items-end" : "items-start"
                      }`}
                    >
                      <span className="text-[10px] text-slate-400 mb-0.5 px-1">
                        {msg.senderName}
                      </span>
                      <div
                        className={`rounded-xl px-3 py-2 max-w-[85%] break-words ${
                          isMine
                            ? "bg-amber-500/20 border border-amber-500/30 text-amber-100"
                            : "bg-slate-800 border border-slate-700 text-slate-100"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form
              onSubmit={handleSendChat}
              className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={!activeChannelPerm?.canWrite || busy}
                placeholder={
                  activeChannelPerm?.canWrite
                    ? `Nhập tin nhắn vào kênh ${activeChannelPerm.label}...`
                    : "Kênh chat đang khoá ở pha này..."
                }
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={
                  !activeChannelPerm?.canWrite || !chatInput.trim() || busy
                }
                className="rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-bold text-slate-950 transition cursor-pointer disabled:opacity-40"
              >
                Gửi
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2 text-xs">
            {!snapshot?.events.length ? (
              <p className="text-slate-500 text-center py-12">
                Nhật ký sự kiện của ván đấu sẽ hiển thị tại đây.
              </p>
            ) : (
              snapshot.events.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-slate-200"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-mono text-amber-400/90">
                      {ev.eventType}
                    </span>
                    <span>
                      {new Date(ev.createdAt).toLocaleTimeString("vi-VN")}
                    </span>
                  </div>
                  <p className="leading-relaxed">{ev.message}</p>
                </div>
              ))
            )}
          </div>
        )}
      </aside>

      {/* Gear Icon Configuration Modal */}
      {configModalOpen && (
        <div
          onClick={() => setConfigModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[85vh] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-base">⚙️</span>
                <span className="font-bold text-sm text-white">
                  Cấu Hình Vai Trò & Thời Gian ({snapshot?.seats.length ?? 0}{" "}
                  người chơi)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    snapshot?.configValidation.valid
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-rose-500/20 text-rose-300"
                  }`}
                >
                  {snapshot?.configValidation.valid ? "Hợp lệ" : "Chưa khớp"}
                </span>
                <button
                  type="button"
                  onClick={() => setConfigModalOpen(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 font-bold text-slate-300 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isDuel ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-pink-500/30 bg-slate-950/60 p-3 space-y-1.5 text-slate-300">
                    <p className="font-bold text-pink-300">
                      Thiết lập chuẩn Splendor Duel (Đối kháng 1v1)
                    </p>
                    <p>
                      • <strong>Bàn Xoắn Ốc 5×5 (25 xu)</strong>: 5 màu đá quý ×
                      4 viên, 2 Ngọc Trai (Pearl) và 3 xu Vàng (Gold).
                    </p>
                    <p>
                      • <strong>67 Thẻ Trang Sức (Kim tự tháp 5 / 4 / 3)</strong>
                      : Cấp I (30 lá • 5 ô), Cấp II (24 lá • 4 ô), Cấp III (13
                      lá • 3 ô).
                    </p>
                    <p>
                      • <strong>3 Cuộn Đặc Quyền & 4 Thẻ Hoàng Gia</strong>: Ghế
                      2 bắt đầu với 1 Cuộn Đặc Quyền để cân bằng lượt đi sau.
                    </p>
                    <p>
                      • <strong>3 Điều Kiện Thắng Tức Thì</strong>: ≥ 20 Điểm Uy
                      Tín, HOẶC ≥ 10 Vương Miện, HOẶC ≥ 10 Điểm cùng 1 màu đá
                      quý.
                    </p>
                  </div>
                </div>
              ) : isSplendor ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-amber-300">
                        Điểm Uy Tín Mục Tiêu (Kích hoạt Vòng Cuối)
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Chuẩn Space Cowboys là 15 điểm (có thể chỉnh 10–30 điểm)
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isLobby && snapshot?.isHost && (
                        <button
                          type="button"
                          onClick={() =>
                            sendRoomAction({
                              type: "UPDATE_CONFIG",
                              config: {
                                ...snapshot.room.config,
                                targetPoints: Math.max(
                                  10,
                                  (snapshot.room.config?.targetPoints ?? 15) - 1
                                ),
                              },
                            })
                          }
                          className="h-7 w-7 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold text-slate-200 cursor-pointer"
                        >
                          -
                        </button>
                      )}
                      <span className="w-8 text-center font-mono text-sm font-bold text-amber-300">
                        {snapshot?.room.config?.targetPoints ?? 15}
                      </span>
                      {isLobby && snapshot?.isHost && (
                        <button
                          type="button"
                          onClick={() =>
                            sendRoomAction({
                              type: "UPDATE_CONFIG",
                              config: {
                                ...snapshot.room.config,
                                targetPoints: Math.min(
                                  30,
                                  (snapshot.room.config?.targetPoints ?? 15) + 1
                                ),
                              },
                            })
                          }
                          className="h-7 w-7 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold text-slate-200 cursor-pointer"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1.5 text-slate-300">
                    <p className="font-bold text-emerald-300">
                      Thiết lập tự động theo số người chơi (2–4 người)
                    </p>
                    <p>• 2 người: 4 xu mỗi màu + 5 xu Vàng • 3 Quý Tộc</p>
                    <p>• 3 người: 5 xu mỗi màu + 5 xu Vàng • 4 Quý Tộc</p>
                    <p>• 4 người: 7 xu mỗi màu + 5 xu Vàng • 5 Quý Tộc</p>
                  </div>
                </div>
              ) : isCoup ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                    <p className="font-bold text-amber-300">
                      Bộ Bài Triều Đình (15 Lá • 5 Nhân vật x 3)
                    </p>
                    {COUP_CHARACTERS.map((ch) => {
                      const meta = COUP_CHARACTER_META[ch];
                      return (
                        <div
                          key={ch}
                          className="rounded-lg border border-slate-800/80 bg-slate-900/70 p-2 flex items-center justify-between gap-2"
                        >
                          <div>
                            <p className="font-bold text-slate-100">
                              {meta.nameVi}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Chủ động: {meta.actionVi} • Chặn: {meta.blockVi}
                            </p>
                          </div>
                          <span className="font-mono font-bold text-amber-300">
                            3 lá
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {WEREWOLF_ROLES.map((role) => {
                  const meta = ROLE_META[role];
                  const count =
                    snapshot?.room.config?.roleCounts?.[role] ?? 0;
                  const canEdit = isLobby && snapshot?.isHost;

                  return (
                    <div
                      key={role}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <span>{meta.nameVi}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              meta.faction === "WerewolfFaction"
                                ? "bg-rose-500/20 text-rose-300"
                                : "bg-sky-500/20 text-sky-300"
                            }`}
                          >
                            {meta.factionNameVi}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {meta.shortDescriptionVi}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleRoleCountDelta(role, -1)}
                            className="h-7 w-7 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold text-slate-200 cursor-pointer"
                          >
                            -
                          </button>
                        )}
                        <span className="w-6 text-center font-mono text-sm font-bold text-amber-300">
                          {count}
                        </span>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleRoleCountDelta(role, 1)}
                            className="h-7 w-7 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold text-slate-200 cursor-pointer"
                          >
                            +
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {snapshot?.room.config && (
                <div className="space-y-2.5">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-200">
                        Lật bài công khai khi chết
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Hiển thị vai trò của người bị Sói cắn hoặc bị treo cổ
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!isLobby || !snapshot.isHost}
                      onClick={() =>
                        sendRoomAction({
                          type: "UPDATE_CONFIG",
                          config: {
                            ...snapshot.room.config,
                            revealRoleOnDeath:
                              !snapshot.room.config.revealRoleOnDeath,
                          },
                        })
                      }
                      className={`rounded-lg px-3 py-1.5 font-bold transition cursor-pointer disabled:opacity-50 ${
                        snapshot.room.config.revealRoleOnDeath
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {snapshot.room.config.revealRoleOnDeath
                        ? "Đang Bật"
                        : "Đang Tắt"}
                    </button>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                    <p className="font-semibold text-slate-200">
                      Thời gian mỗi pha (`Phase Timer`)
                    </p>
                    {(
                      [
                        ["nightActionSeconds", "Đêm 1 (Sói/Tiên Tri/Bảo Vệ)"],
                        ["witchSeconds", "Đêm 2 (Phù Thủy)"],
                        ["dayDiscussionSeconds", "Thảo luận Ban Ngày"],
                        ["dayVotingSeconds", "Bỏ phiếu Treo Cổ"],
                        ["hunterRevengeSeconds", "Thợ Săn Bắn"],
                      ] as const
                    ).map(([key, label]) => {
                      const val = snapshot.room.config.timers?.[key] ?? 30;
                      const canEdit = isLobby && snapshot.isHost;
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between text-[11px]"
                        >
                          <span className="text-slate-300">{label}</span>
                          <div className="flex items-center gap-1.5">
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() =>
                                  sendRoomAction({
                                    type: "UPDATE_CONFIG",
                                    config: {
                                      ...snapshot.room.config,
                                      timers: {
                                        ...snapshot.room.config.timers,
                                        [key]: Math.max(10, val - 5),
                                      },
                                    },
                                  })
                                }
                                className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 font-bold text-slate-200 cursor-pointer"
                              >
                                -
                              </button>
                            )}
                            <span className="w-10 text-center font-mono font-bold text-amber-300">
                              {val}s
                            </span>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() =>
                                  sendRoomAction({
                                    type: "UPDATE_CONFIG",
                                    config: {
                                      ...snapshot.room.config,
                                      timers: {
                                        ...snapshot.room.config.timers,
                                        [key]: Math.min(300, val + 5),
                                      },
                                    },
                                  })
                                }
                                className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 font-bold text-slate-200 cursor-pointer"
                              >
                                +
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info 'i' Game Rules Modal */}
      {rulesModalOpen && (
        <div
          onClick={() => setRulesModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[88vh] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/75 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg border border-sky-500/40 bg-sky-500/15 flex items-center justify-center font-serif italic font-extrabold text-sm text-sky-300">
                  i
                </span>
                <div>
                  <h2 className="font-bold text-sm text-white">
                    {isDuel
                      ? "Luật Chơi Splendor Duel (Đối Kháng 1v1)"
                      : isSplendor
                        ? "Luật Chơi Splendor: Thương Nhân Đá Quý (2–4 Người Chơi)"
                        : isCoup
                          ? "Luật Chơi Coup: Đảo Chính (3–6 Người Chơi)"
                          : "Luật Chơi Làng Ma Sói (4–16 Người Chơi)"}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {isDuel
                      ? "Luật chuẩn Marc André & Bruno Cathala • Bàn 5×5, Ngọc Trai, Đặc Quyền & 3 Cách Thắng"
                      : isSplendor
                        ? "Luật chuẩn Space Cowboys • Thu thập đá quý, đầu tư mỏ & mời Quý Tộc"
                        : isCoup
                          ? "Bảng tham chiếu hành động (Play) • Nói dối, Bắt bài & Chặn"
                          : "Các vai trò, quy trình Đêm/Ngày và điều kiện thắng"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRulesModalOpen(false)}
                className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 font-bold text-slate-300 cursor-pointer"
              >
                Đóng ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isDuel ? (
                <>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 leading-relaxed text-slate-300">
                    <p className="font-bold text-pink-300 text-xs">
                      1. Thành Phần & Bàn Đá Quý Xoắn Ốc 5×5 (Độc quyền 1v1)
                    </p>
                    <div className="flex flex-wrap gap-2 py-1">
                      {DUEL_TOKEN_COLORS.map((col) => (
                        <span
                          key={col}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] font-semibold text-slate-200"
                        >
                          <DuelTokenIconCanvas color={col} size={16} />
                          <span>{DUEL_TOKEN_META[col].nameVi}</span>
                        </span>
                      ))}
                    </div>
                    <p>
                      • <strong>25 Xu trên bàn 5×5</strong>: 4 viên mỗi màu Đá
                      quý (5 màu), <strong>2 Ngọc Trai (Pearl)</strong> quý hiếm
                      (không có thẻ giảm giá) và <strong>3 xu Vàng</strong>.
                    </p>
                    <p>
                      • <strong>Kim tự tháp 67 Thẻ Trang Sức</strong>: Cấp I (5
                      thẻ mở), Cấp II (4 thẻ mở), Cấp III (3 thẻ mở).{" "}
                      <strong>Người đi sau (Ghế 2)</strong> khởi đầu với{" "}
                      <strong>1 Cuộn Đặc Quyền (📜)</strong>.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 leading-relaxed text-slate-300">
                    <p className="font-bold text-amber-300 text-xs">
                      2. Hành Động Phụ (Tùy chọn trước khi đi hành động chính)
                    </p>
                    <p>
                      • <strong>📜 Dùng Cuộn Đặc Quyền</strong>: Trả 1 Cuộn Đặc
                      Quyền về kho để lấy ngay <strong>1 viên Đá quý hoặc Ngọc Trai</strong>{" "}
                      bất kỳ trên bàn 5×5 (không lấy xu Vàng).
                    </p>
                    <p>
                      • <strong>🌀 Nạp Lại Bàn 5×5</strong>: Đổ các xu từ Túi
                      vào các ô trống theo chiều xoắn ốc từ tâm ra ngoài. Khi
                      bạn nạp bàn, <strong>đối thủ nhận ngay 1 Cuộn Đặc Quyền</strong>!
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 leading-relaxed text-slate-300">
                    <p className="font-bold text-emerald-300 text-xs">
                      3. Ba Hành Động Chính (Bắt buộc chọn 1 hành động mỗi lượt)
                    </p>
                    <p>
                      • <strong>Lấy 1–3 viên thẳng hàng</strong> (ngang, dọc
                      hoặc chéo liền kề, không ô trống, không chứa xu Vàng).{" "}
                      <em>Lưu ý</em>: Nếu bạn lấy <strong>3 viên cùng màu</strong>{" "}
                      hoặc <strong>2 viên Ngọc Trai</strong> trong cùng 1 lần,
                      đối thủ nhận ngay 1 Cuộn Đặc Quyền!
                    </p>
                    <p>
                      • <strong>Đặt cọc (Reserve) 1 thẻ + Lấy 1 xu Vàng</strong>
                      : Bắt buộc phải lấy được 1 xu Vàng đang nằm trên bàn 5×5
                      (tối đa giữ 3 thẻ đặt cọc).
                    </p>
                    <p>
                      • <strong>Mua 1 Thẻ Trang Sức</strong> (từ Kim tự tháp
                      hoặc kho đặt cọc). Xu đã chi sẽ quay về <strong>Túi</strong>{" "}
                      (không tự xếp lại lên bàn).
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 leading-relaxed text-slate-300">
                    <p className="font-bold text-sky-300 text-xs">
                      4. Kỹ Năng Thẻ, Hoàng Gia & 3 Điều Kiện Thắng Tức Thì
                    </p>
                    <p>
                      • <strong>Kỹ năng đặc biệt trên thẻ</strong>: 🔄{" "}
                      <em>Đi thêm 1 lượt</em> • 📜 <em>Nhận 1 Đặc Quyền</em> • 🎯{" "}
                      <em>Cướp 1 đá quý (không cướp Vàng) của đối thủ</em> • ➕{" "}
                      <em>Lấy thêm 1 đá cùng màu trên bàn</em> • 🌈{" "}
                      <em>Thẻ Đa Sắc gắn vào bất kỳ màu đá nào</em>.
                    </p>
                    <p>
                      • <strong>Thẻ Hoàng Gia (👑)</strong>: Ngay khi đạt mốc{" "}
                      <strong>3 Vương Miện</strong> và{" "}
                      <strong>6 Vương Miện</strong>, bạn được chọn miễn phí 1
                      trong 4 Thẻ Hoàng Gia (+điểm & kỹ năng).
                    </p>
                    <p>
                      • <strong>Chiến Thắng Ngay Lập Tức (Không có vòng cuối)</strong>
                      : Ván đấu kết thúc ngay lập tức khi có người đạt{" "}
                      <strong>1 trong 3 điều kiện</strong>: (1) Tổng{" "}
                      <strong>≥ 20 Điểm Uy Tín</strong>, HOẶC (2) Tổng{" "}
                      <strong>≥ 10 Vương Miện</strong>, HOẶC (3){" "}
                      <strong>≥ 10 Điểm Uy Tín trên cùng 1 màu đá quý</strong>!
                    </p>
                  </div>
                </>
              ) : isSplendor ? (
                <>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 leading-relaxed text-slate-300">
                    <p className="font-bold text-amber-300 text-xs">
                      1. Thành phần & Thiết lập bàn chơi (2–4 người)
                    </p>
                    <div className="flex flex-wrap gap-2 py-1">
                      {SPLENDOR_TOKEN_COLORS.map((col) => (
                        <span
                          key={col}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] font-semibold text-slate-200"
                        >
                          <SplendorGemIconCanvas color={col} size={16} />
                          <span>{SPLENDOR_GEM_META[col].nameVi}</span>
                        </span>
                      ))}
                    </div>
                    <p>
                      • <strong>Số xu Đá quý khởi đầu</strong>: 2 người (4 xu/màu),
                      3 người (5 xu/màu), 4 người (7 xu/màu) và luôn có{" "}
                      <strong>5 xu Vàng (Joker)</strong>.
                    </p>
                    <p>
                      • <strong>90 Thẻ Phát Triển (3 Cấp)</strong>: Cấp I (40
                      lá), Cấp II (30 lá), Cấp III (20 lá) — luôn lật ngửa 4 lá
                      mỗi cấp. Mỗi lá đã mua mang lại{" "}
                      <strong>1 đá quý thưởng vĩnh viễn</strong> (giảm giá trực
                      tiếp cho mọi lần mua sau) và Điểm Uy Tín.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 leading-relaxed text-slate-300">
                    <p className="font-bold text-amber-300 text-xs">
                      2. Bốn Hành Động Trong Lượt (Chọn 1 hành động mỗi lượt)
                    </p>
                    <p>
                      • <strong>Lấy 3 xu đá quý khác màu</strong> (không lấy xu
                      Vàng; nếu kho còn dưới 3 màu thì lấy tối đa các màu còn
                      lại).
                    </p>
                    <p>
                      • <strong>Lấy 2 xu đá quý cùng màu</strong> (chỉ hợp lệ khi
                      chồng màu đó trên bàn còn từ <strong>4 xu trở lên</strong>
                      ).
                    </p>
                    <p>
                      • <strong>Đặt cọc (Reserve) 1 thẻ + nhận 1 xu Vàng</strong>
                      : Chọn 1 thẻ đang mở trên bàn hoặc rút úp 1 thẻ trên đỉnh
                      chồng I/II/III. Mỗi người giữ tối đa{" "}
                      <strong>3 thẻ đặt cọc</strong> (nếu kho hết xu Vàng vẫn
                      được đặt cọc).
                    </p>
                    <p>
                      • <strong>Mua 1 thẻ Phát Triển</strong> (từ bàn hoặc từ
                      kho thẻ đã đặt cọc của bạn) bằng Điểm thưởng cố định + Xu
                      đá quý + Xu Vàng (thay thế bất kỳ màu nào).
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 leading-relaxed text-slate-300">
                    <p className="font-bold text-amber-300 text-xs">
                      3. Giới Hạn 10 Xu, Quý Tộc & Phân Định Thắng Thua
                    </p>
                    <p>
                      • <strong>Giới hạn 10 xu</strong>: Cuối lượt nếu cầm quá{" "}
                      <strong>10 xu</strong> (tính cả xu Vàng), bạn phải trả lại
                      xu thừa về kho cho đến khi còn đúng 10 xu.
                    </p>
                    <p>
                      • <strong>Quý Tộc ghé thăm (+3 điểm)</strong>: Cuối lượt,
                      nếu số <em>thẻ thưởng vĩnh viễn</em> của bạn đủ điều kiện
                      của Quý Tộc, Quý Tộc tự động ghé thăm (không tính là hành
                      động, tối đa <strong>1 Quý Tộc/lượt</strong> — nếu đủ điều
                      kiện nhiều Quý Tộc cùng lúc thì bạn chọn 1).
                    </p>
                    <p>
                      • <strong>Chạm mốc 15 điểm & Luật Hòa (Tie-breaker)</strong>
                      : Khi có người đạt <strong>≥ 15 điểm Uy Tín</strong>, ván
                      đấu chạy nốt hết vòng hiện tại để mọi người có số lượt
                      bằng nhau. Ai nhiều điểm nhất thắng; nếu bằng điểm, người
                      mua <strong>ít thẻ Phát Triển hơn</strong> sẽ thắng!
                    </p>
                  </div>
                </>
              ) : isCoup ? (
                <>
                  {/* 1. Overview & Setup */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1.5 leading-relaxed text-slate-300">
                    <p className="font-bold text-amber-300 text-xs">
                      1. Mục tiêu & Khởi đầu ván đấu
                    </p>
                    <p>
                      • Bộ bài Triều đình gồm <strong>15 lá bài</strong> (5 Nhân
                      vật × 3 lá mỗi nhân vật). Khi bắt đầu, mỗi người chơi nhận{" "}
                      <strong>2 lá bài úp</strong> (Quyền lực / Influence) và{" "}
                      <strong>2 đồng xu `1 ISK`</strong>.
                    </p>
                    <p>
                      • Mỗi khi mất 1 Quyền lực, bạn phải chọn{" "}
                      <strong>lật ngửa 1 lá bài</strong>. Ai mất cả 2 lá bài sẽ
                      bị loại. Người cuối cùng còn lá bài úp trên bàn là người
                      chiến thắng!
                    </p>
                  </div>

                  {/* 2. Official PLAY Action Reference Table */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/75 overflow-hidden">
                    <div className="bg-slate-900/90 px-3.5 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-1">
                      <span className="font-extrabold text-amber-300 uppercase tracking-wider">
                        2. Bảng Tham Chiếu Hành Động (PLAY — Take One Action)
                      </span>
                      <span className="text-[11px] text-rose-300 font-semibold">
                        * Có từ 10+ xu bắt buộc phải Đảo Chính (Coup)
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <div className="min-w-[520px] divide-y divide-slate-800/80">
                        <div className="grid grid-cols-12 gap-2 px-3.5 py-2 bg-slate-900/40 font-bold text-[11px] uppercase tracking-wider text-slate-400">
                          <div className="col-span-3">Nhân vật</div>
                          <div className="col-span-3">Hành động</div>
                          <div className="col-span-3">Hiệu ứng</div>
                          <div className="col-span-3">Chặn (Counter)</div>
                        </div>

                        {/* 3 General Actions */}
                        {(
                          [
                            {
                              icon: "INCOME" as const,
                              action: "Income (Thu Nhập)",
                              effect: "Lấy +1 xu từ Kho Bạc",
                              counter: "✕ Không thể chặn / bắt bài",
                            },
                            {
                              icon: "FOREIGN_AID" as const,
                              action: "Foreign Aid (Viện Trợ)",
                              effect: "Lấy +2 xu từ Kho Bạc",
                              counter: "Bị chặn bởi Duke",
                            },
                            {
                              icon: "COUP" as const,
                              action: "Coup (Đảo Chính)",
                              effect:
                                "Trả 7 xu • Chọn 1 người mất ngay 1 lá bài",
                              counter: "✕ Không thể chặn / bắt bài",
                            },
                          ] as const
                        ).map((g) => (
                          <div
                            key={g.action}
                            className="grid grid-cols-12 gap-2 px-3.5 py-2.5 items-center text-slate-200"
                          >
                            <div className="col-span-3 flex items-center gap-2 text-slate-400 font-mono">
                              <CoupActionIconCanvas kind={g.icon} size={20} />
                              <span>— Chung —</span>
                            </div>
                            <div className="col-span-3 font-bold text-slate-100">
                              {g.action}
                            </div>
                            <div className="col-span-3 text-slate-300">
                              {g.effect}
                            </div>
                            <div className="col-span-3 text-slate-400">
                              {g.counter}
                            </div>
                          </div>
                        ))}

                        {/* 5 Character Actions */}
                        {(
                          [
                            {
                              char: "Duke" as const,
                              badgeBg:
                                "bg-pink-700/85 border-pink-500/60 text-white",
                              action: "Tax (Thu Thuế)",
                              effect: "Lấy +3 xu từ Kho Bạc",
                              counter: "Chặn Foreign Aid (Viện Trợ)",
                            },
                            {
                              char: "Assassin" as const,
                              badgeBg:
                                "bg-slate-700/90 border-slate-500/60 text-white",
                              action: "Assassinate (Ám Sát)",
                              effect:
                                "Trả 3 xu • Chọn 1 người mất 1 lá bài",
                              counter: "✕ Không có kỹ năng chặn",
                            },
                            {
                              char: "Ambassador" as const,
                              badgeBg:
                                "bg-lime-500/85 border-lime-300/70 text-slate-950",
                              action: "Exchange (Đổi Bài)",
                              effect:
                                "Rút 2 lá từ Bộ bài, chọn lá giữ lại rồi trả 2 lá về Bộ bài",
                              counter: "Chặn Steal (Cướp Xu)",
                            },
                            {
                              char: "Captain" as const,
                              badgeBg:
                                "bg-sky-600/85 border-sky-400/60 text-white",
                              action: "Steal (Cướp Xu)",
                              effect: "Cướp tối đa 2 xu từ 1 người chơi khác",
                              counter: "Chặn Steal (Cướp Xu)",
                            },
                            {
                              char: "Contessa" as const,
                              badgeBg:
                                "bg-red-700/85 border-red-500/60 text-white",
                              action: "✕ Không có",
                              effect: "✕",
                              counter: "Chặn Assassinate (Ám Sát)",
                            },
                          ] as const
                        ).map((row) => (
                          <div
                            key={row.char}
                            className="grid grid-cols-12 gap-2 px-3.5 py-2.5 items-center"
                          >
                            <div className="col-span-3">
                              <div
                                className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 font-extrabold ${row.badgeBg}`}
                              >
                                <CoupActionIconCanvas kind={row.char} size={20} />
                                <span>{row.char}</span>
                              </div>
                            </div>
                            <div className="col-span-3 font-bold text-slate-100">
                              {row.action}
                            </div>
                            <div className="col-span-3 text-slate-300">
                              {row.effect}
                            </div>
                            <div className="col-span-3 text-amber-200 font-medium">
                              {row.counter}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3. Bluffing, Challenge & Double Loss Rules */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 leading-relaxed text-slate-300">
                    <p className="font-bold text-amber-300 text-xs">
                      3. Luật Nói Dối (Bluff), Bắt Bài (Challenge) & Mất 2 Lá Cùng Lúc
                    </p>
                    <p>
                      • <strong>Quyền nói dối</strong>: Bạn có thể tuyên bố thực
                      hiện hành động hoặc chặn bằng bất kỳ Nhân vật nào dù trên
                      tay có thật hay không.
                    </p>
                    <p>
                      • <strong>Bắt bài (Challenge)</strong>: Khi một người
                      tuyên bố Nhân vật (để hành động hoặc chặn), bất kỳ người
                      chơi nào khác cũng có thể bấm <strong>Bắt Bài</strong>:
                    </p>
                    <p className="pl-3">
                      – Nếu người bị bắt bài <strong>nói dối</strong> (không có
                      lá đó): Người nói dối mất 1 lá bài và hành động/cú chặn bị
                      huỷ ngay lập tức.
                    </p>
                    <p className="pl-3">
                      – Nếu người bị bắt bài <strong>có thật</strong> lá đó:
                      Người bắt bài sai phải mất 1 lá bài! Người có thật sẽ trả
                      lá bài vừa lộ về Bộ bài, rút 1 lá mới và hành động/cú chặn
                      vẫn được thực thi.
                    </p>
                    <p>
                      • <strong>Nguy cơ mất 2 lá bài cùng lúc</strong>: Nếu bạn
                      bị Sát Thủ Ám Sát mà cố tình{" "}
                      <strong>Bắt bài sai</strong> (họ có Sát Thủ thật) hoặc{" "}
                      <strong>Nói dối có Contessa để chặn rồi bị lật tẩy</strong>
                      , bạn sẽ mất 1 lá vì thua Bắt bài + 1 lá vì đòn Ám Sát vẫn
                      giáng xuống (tổng cộng mất cả 2 lá bài)!
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Werewolf Rules */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 leading-relaxed text-slate-300">
                    <p className="font-bold text-amber-300 text-xs">
                      1. Phe Phái & Điều Kiện Chiến Thắng
                    </p>
                    <p>
                      • <strong>Phe Dân Làng (Village Faction)</strong>: Thắng
                      khi tiêu diệt toàn bộ Ma Sói trong làng.
                    </p>
                    <p>
                      • <strong>Phe Ma Sói (Werewolf Faction)</strong>: Thắng
                      khi số lượng Ma Sói còn sống{" "}
                      <strong>bằng hoặc nhiều hơn</strong> số lượng Dân Làng còn
                      sống (`Sói ≥ Dân`).
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 leading-relaxed text-slate-300">
                    <p className="font-bold text-amber-300 text-xs">
                      2. Quy Trình Ban Đêm & Ban Ngày
                    </p>
                    <p>
                      • <strong>Đêm 1 (Hành động bí mật)</strong>:
                    </p>
                    <p className="pl-3">
                      – <strong>Ma Sói</strong>: Thảo luận trong kênh Sói và bỏ
                      phiếu chọn con mồi. Nếu phiếu bầu giữa các Sói bị hòa
                      (không thống nhất được 1 mục tiêu duy nhất) thì đêm đó{" "}
                      <strong>Sói không cắn được ai</strong>.
                    </p>
                    <p className="pl-3">
                      – <strong>Tiên Tri (Seer)</strong>: Chọn soi 1 người mỗi
                      đêm để biết người đó thuộc phe Sói hay phe Dân.
                    </p>
                    <p className="pl-3">
                      – <strong>Bảo Vệ (Bodyguard)</strong>: Chọn bảo vệ 1 người
                      khỏi đòn cắn của Sói (không được bảo vệ trùng 1 người ở 2
                      đêm liên tiếp).
                    </p>
                    <p>
                      • <strong>Đêm 2 (Lượt của Phù Thủy)</strong>: Phù Thủy có{" "}
                      <strong>1 bình Cứu</strong> và{" "}
                      <strong>1 bình Độc</strong> cho cả ván đấu, có thể dùng
                      trong cùng 1 đêm.
                    </p>
                    <p>
                      • <strong>Thợ Săn (Hunter)</strong>: Nếu bị Sói cắn chết
                      hoặc bị treo cổ (trừ khi bị Phù Thủy đầu độc), Thợ Săn
                      được nổ súng kéo theo 1 người trước khi gục.
                    </p>
                    <p>
                      • <strong>Ban Ngày (Thảo luận & Bỏ phiếu Treo Cổ)</strong>
                      : Ai nhận <strong>nhiều phiếu bầu nhất</strong> sẽ bị treo
                      cổ. Nếu số phiếu cao nhất bị <strong>hòa nhau</strong> thì
                      ngày hôm đó không ai bị treo cổ.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
