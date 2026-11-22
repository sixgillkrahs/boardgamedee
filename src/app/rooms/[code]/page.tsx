"use client";

import React, { Suspense, use, useEffect, useRef, useState } from "react";
import { WerewolfCanvas } from "@/components/werewolf-canvas";
import { CoupActionIconCanvas, CoupCanvas } from "@/components/coup-canvas";
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
  const pv: WerewolfPlayerView | null =
    !isCoup && snapshot?.playerView ? snapshot.playerView : null;
  const coupView: CoupPlayerView | null =
    isCoup && snapshot?.playerView ? snapshot.playerView : null;
  const isLobby =
    !snapshot ||
    snapshot.room.status === "lobby" ||
    (!pv && !coupView);

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
            className="rounded-lg border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-2.5 py-1.5 text-xs font-bold text-amber-300 transition cursor-pointer flex items-center gap-1.5"
            title="Mở Kênh Chat & Nhật Ký"
          >
            <span>💬</span>
            <span className="hidden sm:inline">Chat & Nhật Ký</span>
          </button>

          {/* Info 'i' Button for Viewing Game Rules */}
          <button
            type="button"
            onClick={() => setRulesModalOpen(true)}
            className="rounded-lg border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 w-8 h-8 flex items-center justify-center font-serif italic font-extrabold text-sm text-sky-300 transition cursor-pointer"
            title="Xem luật chơi"
            aria-label="Xem luật chơi"
          >
            i
          </button>

          {/* Gear Icon Button for Configuration */}
          <button
            type="button"
            onClick={() => setConfigModalOpen(true)}
            className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 p-2 text-sm text-slate-200 transition cursor-pointer"
            title="Cấu hình vai trò & thời gian"
            aria-label="Cấu hình vai trò & thời gian"
          >
            ⚙️
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2 sm:px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-700 transition cursor-pointer"
            title="Bật/Tắt âm thanh"
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
            className="hidden sm:inline-flex rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-700 transition cursor-pointer"
            title="Toàn màn hình"
          >
            ⛶
          </button>

          {actor && (
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-800/90 border border-slate-700 px-2.5 py-1">
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
          {isCoup ? (
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
                  {isCoup
                    ? `Coup: Đảo Chính (${snapshot?.seats.length ?? 0}/6 người chơi)`
                    : `Làng Ma Sói (${snapshot?.seats.length ?? 0}/16 người chơi)`}
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {snapshot?.configValidation.valid
                    ? "✓ Đã đủ số lượng người chơi hợp lệ, sẵn sàng bắt đầu ván đấu!"
                    : snapshot?.configValidation.error ??
                      (isCoup
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
              {isCoup ? (
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
                    {isCoup
                      ? "Luật Chơi Coup: Đảo Chính (3–6 Người Chơi)"
                      : "Luật Chơi Làng Ma Sói (4–16 Người Chơi)"}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {isCoup
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
              {isCoup ? (
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
