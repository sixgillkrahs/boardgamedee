"use client";

import React, { useEffect, useState } from "react";
import { WerewolfCanvas } from "@/components/werewolf-canvas";
import {
  ROLE_META,
  WEREWOLF_ROLES,
  type WerewolfPlayerView,
  type WerewolfRole,
} from "@/cartridges/werewolf";
import {
  SharedLobbySidebar,
  SidebarDrawerButtons,
} from "./shared-lobby-sidebar";
import type { GameConfigModalProps, GameRoomModuleProps } from "./types";

export function WerewolfRoom({
  snapshot,
  normalizedCode,
  isLobby,
  busy,
  sendRoomAction,
  onOpenDrawer,
}: GameRoomModuleProps) {
  const pv: WerewolfPlayerView | null =
    snapshot?.playerView ? (snapshot.playerView as WerewolfPlayerView) : null;

  const [selectedTargetSeatNo, setSelectedTargetSeatNo] = useState<
    number | null
  >(null);
  const [roleCardRevealed, setRoleCardRevealed] = useState(true);
  const [witchWantHeal, setWitchWantHeal] = useState(false);

  useEffect(() => {
    setSelectedTargetSeatNo(null);
    setWitchWantHeal(false);
  }, [pv?.cycle, pv?.step]);

  const targetSeatObj =
    selectedTargetSeatNo !== null
      ? pv?.seats.find((s) => s.seatNo === selectedTargetSeatNo) ??
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

  return (
    <main className="relative flex-1 flex flex-col lg:flex-row w-full gap-2 sm:gap-2.5 p-2 sm:p-2.5">
      <div className="flex-1 relative h-[54vh] min-h-[380px] sm:h-[62vh] sm:min-h-[500px] lg:h-[calc(100vh-62px)] lg:min-h-[620px]">
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
      </div>

      <aside className="w-full lg:w-76 xl:w-84 lg:max-h-[calc(100vh-62px)] lg:overflow-y-auto shrink-0 rounded-2xl border border-slate-800 bg-slate-900/95 p-3 sm:p-4 shadow-xl flex flex-col justify-between gap-3 sm:gap-4">
        {isLobby || !pv ? (
          <SharedLobbySidebar
            snapshot={snapshot}
            busy={busy}
            title={`Làng Ma Sói (${snapshot?.seats.length ?? 0}/16 người chơi)`}
            defaultRequirementHint="Cần tối thiểu 4 người chơi (hoặc thêm Bot) để bắt đầu."
            sendRoomAction={sendRoomAction}
          />
        ) : (
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
                            poisonTargetSeatNo: pv.witchState?.poisonAvailable
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
        )}

        <SidebarDrawerButtons
          messagesCount={snapshot?.messages.length ?? 0}
          eventsCount={snapshot?.events.length ?? 0}
          onOpenDrawer={onOpenDrawer}
        />
      </aside>
    </main>
  );
}

export function WerewolfConfigContent({
  snapshot,
  isLobby,
  sendRoomAction,
}: GameConfigModalProps) {
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

  return (
    <>
      <div className="space-y-2">
        {WEREWOLF_ROLES.map((role) => {
          const meta = ROLE_META[role];
          const count = snapshot?.room.config?.roleCounts?.[role] ?? 0;
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
                    revealRoleOnDeath: !snapshot.room.config.revealRoleOnDeath,
                  },
                })
              }
              className={`rounded-lg px-3 py-1.5 font-bold transition cursor-pointer disabled:opacity-50 ${
                snapshot.room.config.revealRoleOnDeath
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              {snapshot.room.config.revealRoleOnDeath ? "Đang Bật" : "Đang Tắt"}
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
            <p className="font-semibold text-slate-200">
              Thời gian mỗi pha (Phase Timer)
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
  );
}

export function WerewolfRulesContent() {
  return (
    <>
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 leading-relaxed text-slate-300">
        <p className="font-bold text-amber-300 text-xs">
          1. Phe Phái & Điều Kiện Chiến Thắng
        </p>
        <p>
          • <strong>Phe Dân Làng (Village Faction)</strong>: Thắng khi tiêu diệt
          toàn bộ Ma Sói trong làng.
        </p>
        <p>
          • <strong>Phe Ma Sói (Werewolf Faction)</strong>: Thắng khi số lượng
          Ma Sói còn sống <strong>bằng hoặc nhiều hơn</strong> số lượng Dân Làng
          còn sống (Sói ≥ Dân).
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
          – <strong>Ma Sói</strong>: Thảo luận trong kênh Sói và bỏ phiếu chọn
          con mồi. Nếu phiếu bầu giữa các Sói bị hòa (không thống nhất được 1
          mục tiêu duy nhất) thì đêm đó <strong>Sói không cắn được ai</strong>.
        </p>
        <p className="pl-3">
          – <strong>Tiên Tri (Seer)</strong>: Chọn soi 1 người mỗi đêm để biết
          người đó thuộc phe Sói hay phe Dân.
        </p>
        <p className="pl-3">
          – <strong>Bảo Vệ (Bodyguard)</strong>: Chọn bảo vệ 1 người khỏi đòn
          cắn của Sói (không được bảo vệ trùng 1 người ở 2 đêm liên tiếp).
        </p>
        <p>
          • <strong>Đêm 2 (Lượt của Phù Thủy)</strong>: Phù Thủy có{" "}
          <strong>1 bình Cứu</strong> và <strong>1 bình Độc</strong> cho cả ván
          đấu, có thể dùng trong cùng 1 đêm.
        </p>
        <p>
          • <strong>Thợ Săn (Hunter)</strong>: Nếu bị Sói cắn chết hoặc bị treo
          cổ (trừ khi bị Phù Thủy đầu độc), Thợ Săn được nổ súng kéo theo 1
          người trước khi gục.
        </p>
        <p>
          • <strong>Ban Ngày (Thảo luận & Bỏ phiếu Treo Cổ)</strong>: Ai nhận{" "}
          <strong>nhiều phiếu bầu nhất</strong> sẽ bị treo cổ. Nếu số phiếu cao
          nhất bị <strong>hòa nhau</strong> thì ngày hôm đó không ai bị treo cổ.
        </p>
      </div>
    </>
  );
}
