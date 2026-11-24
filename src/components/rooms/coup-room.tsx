"use client";

import React, { useEffect, useState } from "react";
import { CoupActionIconCanvas, CoupCanvas } from "@/components/coup-canvas";
import {
  COUP_CHARACTER_META,
  COUP_CHARACTERS,
  type CoupPlayerView,
} from "@/cartridges/coup";
import {
  SharedLobbySidebar,
  SidebarDrawerButtons,
} from "./shared-lobby-sidebar";
import type { GameRoomModuleProps } from "./types";

export function CoupRoom({
  snapshot,
  isLobby,
  busy,
  sendRoomAction,
  onOpenDrawer,
}: GameRoomModuleProps) {
  const coupView: CoupPlayerView | null =
    snapshot?.playerView ? (snapshot.playerView as CoupPlayerView) : null;

  const [selectedTargetSeatNo, setSelectedTargetSeatNo] = useState<
    number | null
  >(null);
  const [roleCardRevealed, setRoleCardRevealed] = useState(true);

  useEffect(() => {
    setSelectedTargetSeatNo(null);
  }, [coupView?.turnNumber, coupView?.step]);

  const targetSeatObj =
    selectedTargetSeatNo !== null
      ? coupView?.seats.find((s) => s.seatNo === selectedTargetSeatNo) ??
        snapshot?.seats.find((s) => s.seatNo === selectedTargetSeatNo) ??
        null
      : null;

  return (
    <main className="relative flex-1 flex flex-col lg:flex-row w-full gap-2 sm:gap-2.5 p-2 sm:p-2.5">
      <div className="flex-1 relative h-[54vh] min-h-[380px] sm:h-[62vh] sm:min-h-[500px] lg:h-[calc(100vh-62px)] lg:min-h-[620px]">
        <CoupCanvas
          mode={isLobby ? "lobby" : "match"}
          lobbySeats={snapshot?.seats ?? []}
          viewerSeatNo={snapshot?.viewerSeatNo ?? null}
          playerView={coupView}
          selectedTargetSeatNo={selectedTargetSeatNo}
          onSelectSeat={(seatNo) => setSelectedTargetSeatNo(seatNo)}
          cardsRevealed={roleCardRevealed}
          onToggleCardsRevealed={() => setRoleCardRevealed((prev) => !prev)}
          onDispatchCommand={(cmd) =>
            void sendRoomAction({ type: "MATCH_COMMAND", command: cmd })
          }
        />
      </div>

      <aside className="w-full lg:w-76 xl:w-84 lg:max-h-[calc(100vh-62px)] lg:overflow-y-auto shrink-0 rounded-2xl border border-slate-800 bg-slate-900/95 p-3 sm:p-4 shadow-xl flex flex-col justify-between gap-3 sm:gap-4">
        {isLobby || !coupView ? (
          <SharedLobbySidebar
            snapshot={snapshot}
            busy={busy}
            title={`Coup: Đảo Chính (${snapshot?.seats.length ?? 0}/6 người chơi)`}
            defaultRequirementHint="Cần từ 3 đến 6 người chơi (hoặc thêm Bot) để bắt đầu Coup."
            sendRoomAction={sendRoomAction}
          />
        ) : (
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

                  {/* 1. TurnActionStep */}
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
                              <CoupActionIconCanvas kind="Assassin" size={22} />
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
                              <CoupActionIconCanvas kind="Captain" size={22} />
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

                  {/* 2. ReactionWindowStep */}
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
                            <CoupActionIconCanvas kind="CHALLENGE" size={20} />
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
                              <CoupActionIconCanvas kind="Contessa" size={22} />
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
                                className="w-full flex items-center gap-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 px-3.5 py-2.5 text-xs font-bold text-white transition cursor-pointer"
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
                                className="w-full flex items-center gap-2.5 rounded-xl bg-lime-600 hover:bg-lime-500 px-3.5 py-2.5 text-xs font-bold text-slate-950 transition cursor-pointer"
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

                  {/* 3. BlockChallengeStep */}
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

                  {/* 4. Finished / Rematch */}
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

export function CoupConfigContent() {
  return (
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
                <p className="font-bold text-slate-100">{meta.nameVi}</p>
                <p className="text-[11px] text-slate-400">
                  Chủ động: {meta.actionVi} • Chặn: {meta.blockVi}
                </p>
              </div>
              <span className="font-mono font-bold text-amber-300">3 lá</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CoupRulesContent() {
  return (
    <>
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1.5 leading-relaxed text-slate-300">
        <p className="font-bold text-amber-300 text-xs">
          1. Mục tiêu & Khởi đầu ván đấu
        </p>
        <p>
          • Bộ bài Triều đình gồm <strong>15 lá bài</strong> (5 Nhân vật × 3 lá
          mỗi nhân vật). Khi bắt đầu, mỗi người chơi nhận{" "}
          <strong>2 lá bài úp</strong> (Quyền lực / Influence) và{" "}
          <strong>2 đồng xu 1 ISK</strong>.
        </p>
        <p>
          • Mỗi khi mất 1 Quyền lực, bạn phải chọn{" "}
          <strong>lật ngửa 1 lá bài</strong>. Ai mất cả 2 lá bài sẽ bị loại.
          Người cuối cùng còn lá bài úp trên bàn là người chiến thắng!
        </p>
      </div>

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
                  effect: "Trả 7 xu • Chọn 1 người mất ngay 1 lá bài",
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
                <div className="col-span-3 text-slate-300">{g.effect}</div>
                <div className="col-span-3 text-slate-400">{g.counter}</div>
              </div>
            ))}

            {(
              [
                {
                  char: "Duke" as const,
                  badgeBg: "bg-pink-700/85 border-pink-500/60 text-white",
                  action: "Tax (Thu Thuế)",
                  effect: "Lấy +3 xu từ Kho Bạc",
                  counter: "Chặn Foreign Aid (Viện Trợ)",
                },
                {
                  char: "Assassin" as const,
                  badgeBg: "bg-slate-700/90 border-slate-500/60 text-white",
                  action: "Assassinate (Ám Sát)",
                  effect: "Trả 3 xu • Chọn 1 người mất 1 lá bài",
                  counter: "✕ Không có kỹ năng chặn",
                },
                {
                  char: "Ambassador" as const,
                  badgeBg: "bg-lime-500/85 border-lime-300/70 text-slate-950",
                  action: "Exchange (Đổi Bài)",
                  effect:
                    "Rút 2 lá từ Bộ bài, chọn lá giữ lại rồi trả 2 lá về Bộ bài",
                  counter: "Chặn Steal (Cướp Xu)",
                },
                {
                  char: "Captain" as const,
                  badgeBg: "bg-sky-600/85 border-sky-400/60 text-white",
                  action: "Steal (Cướp Xu)",
                  effect: "Cướp tối đa 2 xu từ 1 người chơi khác",
                  counter: "Chặn Steal (Cướp Xu)",
                },
                {
                  char: "Contessa" as const,
                  badgeBg: "bg-red-700/85 border-red-500/60 text-white",
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
                <div className="col-span-3 text-slate-300">{row.effect}</div>
                <div className="col-span-3 text-amber-200 font-medium">
                  {row.counter}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 leading-relaxed text-slate-300">
        <p className="font-bold text-amber-300 text-xs">
          3. Luật Nói Dối (Bluff), Bắt Bài (Challenge) & Mất 2 Lá Cùng Lúc
        </p>
        <p>
          • <strong>Quyền nói dối</strong>: Bạn có thể tuyên bố thực hiện hành
          động hoặc chặn bằng bất kỳ Nhân vật nào dù trên tay có thật hay không.
        </p>
        <p>
          • <strong>Bắt bài (Challenge)</strong>: Khi một người tuyên bố Nhân
          vật (để hành động hoặc chặn), bất kỳ người chơi nào khác cũng có thể
          bấm <strong>Bắt Bài</strong>:
        </p>
        <p className="pl-3">
          – Nếu người bị bắt bài <strong>nói dối</strong> (không có lá đó):
          Người nói dối mất 1 lá bài và hành động/cú chặn bị huỷ ngay lập tức.
        </p>
        <p className="pl-3">
          – Nếu người bị bắt bài <strong>có thật</strong> lá đó: Người bắt bài
          sai phải mất 1 lá bài! Người có thật sẽ trả lá bài vừa lộ về Bộ bài,
          rút 1 lá mới và hành động/cú chặn vẫn được thực thi.
        </p>
        <p>
          • <strong>Nguy cơ mất 2 lá bài cùng lúc</strong>: Nếu bạn bị Sát Thủ
          Ám Sát mà cố tình <strong>Bắt bài sai</strong> (họ có Sát Thủ thật)
          hoặc <strong>Nói dối có Contessa để chặn rồi bị lật tẩy</strong>, bạn
          sẽ mất 1 lá vì thua Bắt bài + 1 lá vì đòn Ám Sát vẫn giáng xuống (tổng
          cộng mất cả 2 lá bài)!
        </p>
      </div>
    </>
  );
}
