"use client";

import React, { Suspense, use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { WerewolfCanvas } from "@/components/werewolf-canvas";
import {
  ROLE_META,
  WEREWOLF_ROLES,
  type WerewolfPlayerView,
  type WerewolfRole,
} from "@/cartridges/werewolf";
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

  // HUD Chat & Event Log tabs
  const [activeTab, setActiveTab] = useState<"chat" | "events" | "config">(
    "chat"
  );
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
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [snapshot?.messages?.length, snapshot?.events?.length]);

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

  const pv: WerewolfPlayerView | null = snapshot?.playerView ?? null;
  const isLobby = !snapshot || snapshot.room.status === "lobby" || !pv;
  const targetSeatObj =
    selectedTargetSeatNo !== null
      ? pv?.seats.find((s) => s.seatNo === selectedTargetSeatNo) ??
        snapshot?.seats.find((s) => s.seatNo === selectedTargetSeatNo) ??
        null
      : null;

  const activeChannelPerm = snapshot?.channels.find(
    (c) => c.channelId === activeChannelId
  );
  const channelMessages =
    snapshot?.messages.filter((m) => m.channelId === activeChannelId) ?? [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Platform Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/85 backdrop-blur px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              await sendRoomAction({ type: "LEAVE" });
              window.location.href = "/";
            }}
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
          >
            ← Rời Phòng
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400">
              Mã phòng:
            </span>
            <span className="rounded-lg bg-amber-500/15 border border-amber-500/40 px-2.5 py-1 font-mono text-sm font-bold text-amber-300">
              {normalizedCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              {copied ? "✓ Đã chép link" : "Sao chép link mời"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700 transition cursor-pointer"
            title="Bật/Tắt âm hiệu"
          >
            {soundEnabled ? "🔊 Âm thanh" : "🔇 Tắt tiếng"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                void document.documentElement.requestFullscreen().catch(() => {});
              } else {
                void document.exitFullscreen().catch(() => {});
              }
            }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700 transition cursor-pointer"
            title="Toàn màn hình"
          >
            ⛶ Toàn màn hình
          </button>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
              connected
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            {connected ? "SSE Trực tuyến" : "Đang kết nối..."}
          </span>

          {actor && (
            <div className="flex items-center gap-2 rounded-lg bg-slate-800/90 border border-slate-700 px-3 py-1">
              <span className="font-semibold text-sky-300">
                {actor.displayName}
              </span>
              <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">
                {actor.isGuest ? "Guest" : "Google"}
              </span>
              {snapshot?.viewerSeatNo && (
                <span className="rounded bg-sky-500/20 text-sky-300 px-1.5 py-0.5 font-bold">
                  Ghế #{snapshot.viewerSeatNo}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Error Toast if any */}
      {errorMsg && (
        <div className="mx-4 mt-3 rounded-xl border border-rose-500/40 bg-rose-950/70 px-4 py-2.5 text-xs font-medium text-rose-200 flex items-center justify-between">
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

      {/* Main Split Layout: Interactive 2D Canvas Tabletop (Left/Center) + HUD Overlay Dock (Right) */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-3 md:p-4 max-w-[1600px] w-full mx-auto">
        {/* Left/Center 8 Columns: 2D Canvas Scene + Action Command Dock */}
        <section className="lg:col-span-8 flex flex-col gap-3 min-h-[540px]">
          <div className="flex-1 min-h-[460px] relative">
            <WerewolfCanvas
              mode={isLobby ? "lobby" : "match"}
              lobbySeats={snapshot?.seats ?? []}
              viewerSeatNo={snapshot?.viewerSeatNo ?? null}
              playerView={pv}
              selectedTargetSeatNo={selectedTargetSeatNo}
              onSelectSeat={(seatNo) => setSelectedTargetSeatNo(seatNo)}
              roleCardRevealed={roleCardRevealed}
              onToggleRoleCard={() => setRoleCardRevealed((prev) => !prev)}
            />
          </div>

          {/* Context Action Bar (Lobby or Active Match Step Controls) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5 shadow-xl">
            {isLobby ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-amber-300">
                    Sảnh chờ Làng Ma Sói ({snapshot?.seats.length ?? 0}/16 ghế)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {snapshot?.configValidation.valid
                      ? "✓ Cấu hình vai trò đã hợp lệ, sẵn sàng bắt đầu ván đấu!"
                      : snapshot?.configValidation.error ??
                        "Cần tối thiểu 4 người chơi (hoặc thêm Bot) để bắt đầu."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {snapshot?.isHost && (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => sendRoomAction({ type: "ADD_BOT" })}
                        className="rounded-xl border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 px-3.5 py-2 text-xs font-semibold text-sky-200 transition cursor-pointer disabled:opacity-50"
                      >
                        🤖 + Thêm Bot Làng
                      </button>
                      <button
                        type="button"
                        disabled={busy || !snapshot?.configValidation.valid}
                        onClick={() => sendRoomAction({ type: "START_MATCH" })}
                        className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg transition cursor-pointer disabled:opacity-40"
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
            ) : (
              /* Match Action Controls */
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      {pv.phase === "Finished"
                        ? "Kết quả chung cuộc"
                        : pv.step === "NightActionStep"
                          ? "Bước Đêm 1: Hành động bí mật"
                          : pv.step === "WitchStep"
                            ? "Bước Đêm 2: Lượt của Phù Thủy"
                            : pv.step === "HunterRevengeStep"
                              ? "Phát súng cuối của Thợ Săn"
                              : pv.step === "DayDiscussionStep"
                                ? "Ban Ngày: Thảo luận công khai"
                                : "Ban Ngày: Bỏ phiếu treo cổ"}
                    </span>
                    {pv.myRole && (
                      <span className="rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs font-semibold text-sky-300">
                        Vai của bạn: {ROLE_META[pv.myRole].nameVi}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300">
                    {pv.phase === "Finished"
                      ? pv.winReasonVi
                      : selectedTargetSeatNo !== null && targetSeatObj
                        ? `Đang chọn mục tiêu trên Canvas: Ghế #${selectedTargetSeatNo} (${targetSeatObj.displayName})`
                        : "Chạm trực tiếp vào ghế người chơi trên bàn Canvas để chọn mục tiêu."}
                  </p>
                </div>

                {/* Role & Phase Specific Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* NightActionStep Actions */}
                  {pv.step === "NightActionStep" &&
                    pv.myAlive &&
                    pv.myRole === "Werewolf" && (
                      <button
                        type="button"
                        disabled={busy || selectedTargetSeatNo === null}
                        onClick={() =>
                          sendRoomAction({
                            type: "MATCH_COMMAND",
                            command: {
                              type: "WEREWOLF_VOTE",
                              targetSeatNo: selectedTargetSeatNo,
                            },
                          })
                        }
                        className="rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow transition cursor-pointer disabled:opacity-40"
                      >
                        🐺{" "}
                        {selectedTargetSeatNo
                          ? `Chốt cắn Ghế #${selectedTargetSeatNo}`
                          : "Chọn 1 ghế trên Canvas để cắn"}
                      </button>
                    )}

                  {pv.step === "NightActionStep" &&
                    pv.myAlive &&
                    pv.myRole === "Seer" &&
                    !pv.hasSubmittedCurrentStep && (
                      <button
                        type="button"
                        disabled={busy || selectedTargetSeatNo === null}
                        onClick={() =>
                          sendRoomAction({
                            type: "MATCH_COMMAND",
                            command: {
                              type: "SEER_INSPECT",
                              targetSeatNo: selectedTargetSeatNo,
                            },
                          })
                        }
                        className="rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-bold text-white shadow transition cursor-pointer disabled:opacity-40"
                      >
                        🔮{" "}
                        {selectedTargetSeatNo
                          ? `Soi danh tính Ghế #${selectedTargetSeatNo}`
                          : "Chọn 1 ghế trên Canvas để soi"}
                      </button>
                    )}

                  {pv.step === "NightActionStep" &&
                    pv.myAlive &&
                    pv.myRole === "Bodyguard" &&
                    !pv.hasSubmittedCurrentStep && (
                      <button
                        type="button"
                        disabled={busy || selectedTargetSeatNo === null}
                        onClick={() =>
                          sendRoomAction({
                            type: "MATCH_COMMAND",
                            command: {
                              type: "BODYGUARD_PROTECT",
                              targetSeatNo: selectedTargetSeatNo,
                            },
                          })
                        }
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow transition cursor-pointer disabled:opacity-40"
                      >
                        🛡️{" "}
                        {selectedTargetSeatNo
                          ? `Bảo vệ Ghế #${selectedTargetSeatNo}`
                          : "Chọn 1 ghế trên Canvas để bảo vệ"}
                      </button>
                    )}

                  {/* WitchStep Actions (Supports combining Heal AND Poison in the same night) */}
                  {pv.step === "WitchStep" &&
                    pv.myAlive &&
                    pv.myRole === "Witch" &&
                    !pv.hasSubmittedCurrentStep && (
                      <>
                        {pv.witchState?.healAvailable &&
                          pv.witchState.pendingWolfVictimSeatNo !== null && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setWitchWantHeal((v) => !v)}
                              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer border ${
                                witchWantHeal
                                  ? "bg-emerald-600 text-white border-emerald-400"
                                  : "bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60"
                              }`}
                            >
                              {witchWantHeal ? "✓ " : "💚 "}
                              Cứu Ghế #{pv.witchState.pendingWolfVictimSeatNo}
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
                          className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-xs font-bold text-white transition cursor-pointer"
                        >
                          🧪 Xác nhận Phù Thủy (
                          {witchWantHeal ? "Có Cứu" : "Không Cứu"}
                          {pv.witchState?.poisonAvailable &&
                          selectedTargetSeatNo !== null
                            ? ` + Độc Ghế #${selectedTargetSeatNo}`
                            : ""}
                          )
                        </button>
                      </>
                    )}

                  {/* HunterRevengeStep Actions */}
                  {pv.step === "HunterRevengeStep" &&
                    pv.activeHunterSeatNo === snapshot?.viewerSeatNo && (
                      <>
                        <button
                          type="button"
                          disabled={busy || selectedTargetSeatNo === null}
                          onClick={() =>
                            sendRoomAction({
                              type: "MATCH_COMMAND",
                              command: {
                                type: "HUNTER_SHOOT",
                                targetSeatNo: selectedTargetSeatNo,
                              },
                            })
                          }
                          className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 transition cursor-pointer disabled:opacity-40"
                        >
                          🏹{" "}
                          {selectedTargetSeatNo
                            ? `Nổ súng bắn Ghế #${selectedTargetSeatNo}!`
                            : "Chọn ghế trên Canvas để bắn"}
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
                          className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition cursor-pointer"
                        >
                          Không nổ súng
                        </button>
                      </>
                    )}

                  {/* DayDiscussionStep Actions */}
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
                      className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 transition cursor-pointer disabled:opacity-50"
                    >
                      {pv.hasSubmittedCurrentStep
                        ? "✓ Đã sẵn sàng bỏ phiếu"
                        : "🗳️ Sẵn sàng chuyển sang Bỏ phiếu"}
                    </button>
                  )}

                  {/* DayVotingStep Actions */}
                  {pv.step === "DayVotingStep" && pv.myAlive && (
                    <>
                      <button
                        type="button"
                        disabled={busy || selectedTargetSeatNo === null}
                        onClick={() =>
                          sendRoomAction({
                            type: "MATCH_COMMAND",
                            command: {
                              type: "DAY_VOTE",
                              targetSeatNo: selectedTargetSeatNo,
                            },
                          })
                        }
                        className="rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white transition cursor-pointer disabled:opacity-40"
                      >
                        ⚖️{" "}
                        {selectedTargetSeatNo
                          ? `Bầu treo cổ Ghế #${selectedTargetSeatNo}`
                          : "Chọn 1 ghế trên Canvas để bỏ phiếu"}
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
                            },
                          })
                        }
                        className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition cursor-pointer"
                      >
                        🏳️ Bỏ phiếu trắng (Abstain)
                      </button>
                    </>
                  )}

                  {/* Finished / Rematch Actions */}
                  {pv.phase === "Finished" && snapshot?.isHost && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => sendRoomAction({ type: "REMATCH" })}
                      className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg transition cursor-pointer"
                    >
                      🔄 Chơi Ván Mới (Về Sảnh Chờ)
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right 4 Columns: HTML HUD Overlay for Vietnamese IME Channel Chat, Match Events & Cartridge Config */}
        <aside className="lg:col-span-4 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden h-[560px] lg:h-auto">
          {/* HUD Top Tab Switcher */}
          <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/60 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`py-3 text-center transition cursor-pointer ${
                activeTab === "chat"
                  ? "border-b-2 border-amber-400 text-amber-300 bg-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              💬 Kênh Chat ({snapshot?.messages.length ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("events")}
              className={`py-3 text-center transition cursor-pointer ${
                activeTab === "events"
                  ? "border-b-2 border-amber-400 text-amber-300 bg-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📜 Nhật Ký ({snapshot?.events.length ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("config")}
              className={`py-3 text-center transition cursor-pointer ${
                activeTab === "config"
                  ? "border-b-2 border-amber-400 text-amber-300 bg-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ⚙️ Cấu Hình Vai
            </button>
          </div>

          {/* Tab 1: Dynamic Gated Channel Chat */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Channel selector pills */}
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

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
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
                          Ghế #{msg.senderSeatNo} • {msg.senderName}
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

              {/* Vietnamese IME Native HTML Form */}
              <form
                onSubmit={handleSendChat}
                className="p-2.5 border-t border-slate-800 bg-slate-950/70 flex items-center gap-2"
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
          )}

          {/* Tab 2: Match Events Log */}
          {activeTab === "events" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
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

          {/* Tab 3: Cartridge Role & Rule Configuration */}
          {activeTab === "config" && (
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">
                  Cơ cấu Vai trò ({snapshot?.seats.length ?? 0} ghế)
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    snapshot?.configValidation.valid
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-rose-500/20 text-rose-300"
                  }`}
                >
                  {snapshot?.configValidation.valid ? "Hợp lệ" : "Chưa khớp"}
                </span>
              </div>

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

              {/* Reveal Role on Death Toggle & Phase Timers */}
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

                  {/* Phase Timer Durations */}
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
                      const val =
                        snapshot.room.config.timers?.[key] ?? 30;
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
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
