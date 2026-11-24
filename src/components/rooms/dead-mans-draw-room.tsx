"use client";

import React from "react";
import { DeadMansDrawCanvas } from "@/components/dead-mans-draw-canvas";
import {
  DMD_SUITS,
  DMD_SUIT_META,
  type DmdPlayerView,
} from "@/cartridges/dead-mans-draw";
import {
  SharedLobbySidebar,
  SidebarDrawerButtons,
} from "./shared-lobby-sidebar";
import type { GameConfigModalProps, GameRoomModuleProps } from "./types";

export function DeadMansDrawRoom({
  snapshot,
  isLobby,
  busy,
  sendRoomAction,
  onOpenDrawer,
}: GameRoomModuleProps) {
  const dmdView: DmdPlayerView | null =
    snapshot?.playerView ? (snapshot.playerView as DmdPlayerView) : null;

  const mySeat = dmdView?.seats.find(
    (s) => s.seatNo === snapshot?.viewerSeatNo
  );
  const activeSeat = dmdView?.seats.find(
    (s) => s.seatNo === dmdView.activeSeatNo
  );
  const isMyTurn =
    !!dmdView &&
    dmdView.activeSeatNo === snapshot?.viewerSeatNo &&
    dmdView.step !== "Finished";
  const suitsInPlay = new Set(dmdView?.playArea.map((c) => c.suit) ?? []);
  const opponents =
    dmdView?.seats.filter((s) => s.seatNo !== snapshot?.viewerSeatNo) ?? [];

  return (
    <main className="relative flex-1 flex flex-col lg:flex-row w-full gap-2 sm:gap-2.5 p-2 sm:p-2.5">
      <div className="flex-1 relative h-[54vh] min-h-[380px] sm:h-[62vh] sm:min-h-[500px] lg:h-[calc(100vh-62px)] lg:min-h-[620px]">
        <DeadMansDrawCanvas
          mode={isLobby ? "lobby" : "match"}
          lobbySeats={snapshot?.seats ?? []}
          viewerSeatNo={snapshot?.viewerSeatNo ?? null}
          playerView={dmdView}
          onDispatchCommand={(cmd) =>
            void sendRoomAction({ type: "MATCH_COMMAND", command: cmd })
          }
        />
      </div>

      <aside className="w-full lg:w-76 xl:w-84 lg:max-h-[calc(100vh-62px)] lg:overflow-y-auto shrink-0 rounded-2xl border border-slate-800 bg-slate-900/95 p-3 sm:p-4 shadow-xl flex flex-col justify-between gap-3 sm:gap-4">
        {isLobby || !dmdView ? (
          <SharedLobbySidebar
            snapshot={snapshot}
            busy={busy}
            title={`Dead Man's Draw (${snapshot?.seats.length ?? 0}/4 Hải Tặc)`}
            defaultRequirementHint="Cần từ 2 đến 4 người chơi (hoặc thêm Bot) để bắt đầu Dead Man's Draw."
            sendRoomAction={sendRoomAction}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {/* Turn & Deck Header */}
            <div className="rounded-xl border border-amber-500/30 bg-slate-950/75 p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  {dmdView.step === "Finished"
                    ? "🏆 KẾT THÚC VÁN ĐẤU"
                    : `Lượt ${dmdView.turnNumber} • Dead Man's Draw`}
                </span>
                <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-300">
                  🃏 {dmdView.drawPileCount} | ☠ {dmdView.discardPileCount}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-100">
                {dmdView.step === "Finished"
                  ? dmdView.winReasonVi
                  : isMyTurn
                    ? "🏴‍☠️ Đến lượt của bạn!"
                    : `⏳ Lượt của ${activeSeat?.displayName ?? "..."}`}
              </p>
              {dmdView.forcedDrawsRemaining > 0 && (
                <div className="rounded-lg bg-rose-950/80 border border-rose-500/50 px-2.5 py-1.5 text-[11px] font-bold text-rose-200">
                  🐙 Lời nguyền Kraken: Bắt buộc rút thêm{" "}
                  {dmdView.forcedDrawsRemaining} lá!
                </div>
              )}
              {dmdView.hasKeyAndChestInPlay && (
                <div className="rounded-lg bg-amber-950/80 border border-amber-500/50 px-2.5 py-1.5 text-[11px] font-bold text-amber-200">
                  🗝️🧰 Đang có Chìa Khóa + Rương Báu! Thu kho sẽ rút thưởng{" "}
                  {Math.min(dmdView.playArea.length, dmdView.discardPileCount)}{" "}
                  lá từ Mộ bài!
                </div>
              )}
              {dmdView.anchorProtectedCount > 0 && (
                <div className="rounded-lg bg-sky-950/70 border border-sky-500/40 px-2.5 py-1 text-[11px] font-semibold text-sky-200">
                  ⚓ Mỏ Neo đang bảo vệ {dmdView.anchorProtectedCount} lá rút
                  trước nó!
                </div>
              )}
            </div>

            {/* Secret Oracle Peek Box */}
            {dmdView.oraclePeekedCard && (
              <div className="rounded-xl border border-purple-500/50 bg-purple-950/40 p-2.5 space-y-1">
                <p className="text-[11px] font-bold text-purple-300">
                  🔮 Tiên Tri soi thấy lá trên cùng Bộ bài:
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white">
                    {DMD_SUIT_META[dmdView.oraclePeekedCard.suit].emoji}{" "}
                    {DMD_SUIT_META[dmdView.oraclePeekedCard.suit].nameVi} (
                    {dmdView.oraclePeekedCard.value})
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      suitsInPlay.has(dmdView.oraclePeekedCard.suit)
                        ? "bg-rose-500/25 text-rose-200 border border-rose-500/50"
                        : "bg-emerald-500/25 text-emerald-200 border border-emerald-500/50"
                    }`}
                  >
                    {suitsInPlay.has(dmdView.oraclePeekedCard.suit)
                      ? "💥 SẼ CHÁY BÀI!"
                      : "✓ AN TOÀN"}
                  </span>
                </div>
              </div>
            )}

            {/* Step 1: Draw or Bank */}
            {dmdView.step === "DrawOrBankStep" && isMyTurn && (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={busy || dmdView.drawPileCount === 0}
                  onClick={() =>
                    sendRoomAction({
                      type: "MATCH_COMMAND",
                      command: { type: "DRAW" },
                    })
                  }
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-3 py-3 text-xs font-extrabold text-slate-950 shadow-lg transition cursor-pointer disabled:opacity-40"
                >
                  {dmdView.forcedDrawsRemaining > 0
                    ? `🐙 Bắt Buộc Rút (${dmdView.forcedDrawsRemaining} lá còn lại)`
                    : dmdView.playArea.length === 0
                      ? "🃏 Rút Lá Đầu Tiên"
                      : `🃏 Rút Tiếp (Đang có ${dmdView.playArea.length} lá trên bàn)`}
                </button>

                <button
                  type="button"
                  disabled={busy || !dmdView.canBank}
                  onClick={() =>
                    sendRoomAction({
                      type: "MATCH_COMMAND",
                      command: { type: "BANK" },
                    })
                  }
                  className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3 py-2.5 text-xs font-extrabold text-slate-950 transition cursor-pointer disabled:opacity-35"
                >
                  💰 Dừng & Thu Kho Báu ({dmdView.playArea.length} lá)
                </button>
              </div>
            )}

            {/* Step 2: Cannon Target */}
            {dmdView.step === "CannonTargetStep" && isMyTurn && (
              <div className="rounded-xl border border-orange-500/50 bg-orange-950/30 p-3 space-y-2">
                <p className="text-xs font-bold text-orange-300">
                  💣 Đại Bác — Chọn 1 lá kho báu đối thủ để bắn hủy:
                </p>
                {opponents.map((opp) => {
                  const owned = DMD_SUITS.filter(
                    (s) => opp.bank[s].length > 0
                  );
                  if (owned.length === 0) return null;
                  return (
                    <div key={opp.seatNo} className="space-y-1">
                      <p className="text-[11px] font-semibold text-slate-300">
                        {opp.displayName} (★ {opp.score}):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {owned.map((suit) => {
                          const top =
                            opp.bank[suit][opp.bank[suit].length - 1];
                          return (
                            <button
                              key={suit}
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                sendRoomAction({
                                  type: "MATCH_COMMAND",
                                  command: {
                                    type: "CANNON_TARGET",
                                    targetSeatNo: opp.seatNo,
                                    suit,
                                  },
                                })
                              }
                              className="rounded-lg border border-orange-500/40 bg-slate-900 hover:bg-orange-500/20 px-2 py-1 text-[11px] font-bold text-slate-100 transition cursor-pointer"
                            >
                              {DMD_SUIT_META[suit].emoji}{" "}
                              {DMD_SUIT_META[suit].shortVi} {top.value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 3: Sword Steal Target */}
            {dmdView.step === "SwordTargetStep" && isMyTurn && (
              <div className="rounded-xl border border-sky-500/50 bg-sky-950/30 p-3 space-y-2">
                <p className="text-xs font-bold text-sky-300">
                  ⚔️ Kiếm Hải Tặc — Chọn 1 lá kho báu đối thủ để cướp lên bàn:
                </p>
                {opponents.map((opp) => {
                  const owned = DMD_SUITS.filter(
                    (s) => opp.bank[s].length > 0
                  );
                  if (owned.length === 0) return null;
                  return (
                    <div key={opp.seatNo} className="space-y-1">
                      <p className="text-[11px] font-semibold text-slate-300">
                        {opp.displayName}:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {owned.map((suit) => {
                          const top =
                            opp.bank[suit][opp.bank[suit].length - 1];
                          const bust = suitsInPlay.has(suit);
                          return (
                            <button
                              key={suit}
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                sendRoomAction({
                                  type: "MATCH_COMMAND",
                                  command: {
                                    type: "SWORD_TARGET",
                                    targetSeatNo: opp.seatNo,
                                    suit,
                                  },
                                })
                              }
                              className={`rounded-lg border px-2 py-1 text-[11px] font-bold transition cursor-pointer ${
                                bust
                                  ? "border-rose-500/60 bg-rose-950/60 text-rose-200 hover:bg-rose-900/60"
                                  : "border-sky-500/40 bg-slate-900 text-slate-100 hover:bg-sky-500/20"
                              }`}
                            >
                              {DMD_SUIT_META[suit].emoji}{" "}
                              {DMD_SUIT_META[suit].shortVi} {top.value}
                              {bust ? " 💥" : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 4: Hook Own Bank Pick */}
            {dmdView.step === "HookPickStep" && isMyTurn && mySeat && (
              <div className="rounded-xl border border-slate-500/50 bg-slate-800/40 p-3 space-y-2">
                <p className="text-xs font-bold text-slate-200">
                  🪝 Móc Sắt — Chọn 1 lá từ Kho Báu của bạn để kéo ra bàn:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {DMD_SUITS.filter((s) => mySeat.bank[s].length > 0).map(
                    (suit) => {
                      const top =
                        mySeat.bank[suit][mySeat.bank[suit].length - 1];
                      const bust = suitsInPlay.has(suit);
                      return (
                        <button
                          key={suit}
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            sendRoomAction({
                              type: "MATCH_COMMAND",
                              command: { type: "HOOK_PICK", suit },
                            })
                          }
                          className={`rounded-lg border px-2 py-1 text-[11px] font-bold transition cursor-pointer ${
                            bust
                              ? "border-rose-500/60 bg-rose-950/60 text-rose-200"
                              : "border-amber-500/40 bg-slate-900 text-slate-100 hover:bg-amber-500/20"
                          }`}
                        >
                          {DMD_SUIT_META[suit].emoji}{" "}
                          {DMD_SUIT_META[suit].shortVi} {top.value}
                          {bust ? " 💥" : ""}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Map Pick */}
            {dmdView.step === "MapPickStep" &&
              isMyTurn &&
              dmdView.mapChoices.length > 0 && (
                <div className="rounded-xl border border-amber-500/50 bg-amber-950/30 p-3 space-y-2">
                  <p className="text-xs font-bold text-amber-300">
                    🗺️ Bản Đồ — Chọn 1 lá từ Mộ bài:
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {dmdView.mapChoices.map((card) => {
                      const bust = suitsInPlay.has(card.suit);
                      return (
                        <button
                          key={card.id}
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            sendRoomAction({
                              type: "MATCH_COMMAND",
                              command: { type: "MAP_PICK", cardId: card.id },
                            })
                          }
                          className={`w-full rounded-lg border px-2.5 py-2 text-left text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                            bust
                              ? "border-rose-500/60 bg-rose-950/60 text-rose-200"
                              : "border-emerald-500/50 bg-slate-900 text-slate-100 hover:bg-emerald-950/50"
                          }`}
                        >
                          <span>
                            {DMD_SUIT_META[card.suit].emoji}{" "}
                            {DMD_SUIT_META[card.suit].nameVi} ({card.value})
                          </span>
                          <span className="text-[10px]">
                            {bust ? "💥 Cháy bài" : "✓ Đánh ngay"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Step 6: Finished Rematch */}
            {dmdView.step === "Finished" && (
              <div className="space-y-2.5 rounded-xl border border-amber-500/40 bg-amber-950/25 p-3">
                <p className="text-xs text-amber-200 font-semibold leading-relaxed">
                  {dmdView.winReasonVi}
                </p>
                <div className="space-y-1">
                  {[...dmdView.seats]
                    .sort((a, b) => b.score - a.score)
                    .map((s) => (
                      <div
                        key={s.seatNo}
                        className="flex items-center justify-between text-[11px] text-slate-200"
                      >
                        <span>
                          {dmdView.winnerSeatNos.includes(s.seatNo)
                            ? "👑 "
                            : "• "}
                          {s.displayName}
                        </span>
                        <span className="font-mono font-bold text-amber-300">
                          {s.score} điểm ({s.totalBankedCards} lá)
                        </span>
                      </div>
                    ))}
                </div>
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

            {/* Compact 10-Suit Ability Reference */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Bảng Tra Nhanh 10 Nhóm Kho Báu
              </p>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300">
                {DMD_SUITS.map((suit) => (
                  <div
                    key={suit}
                    title={DMD_SUIT_META[suit].abilityVi}
                    className="rounded-md bg-slate-900/90 border border-slate-800/80 px-1.5 py-1 truncate"
                  >
                    <span>{DMD_SUIT_META[suit].emoji}</span>{" "}
                    <span className="font-bold text-slate-100">
                      {DMD_SUIT_META[suit].shortVi}
                    </span>
                  </div>
                ))}
              </div>
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

export function DeadMansDrawConfigContent({
  snapshot,
  isLobby,
  sendRoomAction,
}: GameConfigModalProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-amber-500/30 bg-slate-950/60 p-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-bold text-amber-300">Thời Gian Mỗi Lượt Chơi</p>
          <p className="text-[11px] text-slate-400">
            Hết giờ hệ thống tự động dừng thu bài hoặc rút bài (15–180 giây)
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
                    timers: {
                      turnSeconds: Math.max(
                        15,
                        (snapshot.room.config?.timers?.turnSeconds ?? 45) - 15
                      ),
                    },
                  },
                })
              }
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold text-white cursor-pointer"
            >
              −
            </button>
          )}
          <span className="font-mono font-bold text-amber-300 w-10 text-center">
            {snapshot?.room.config?.timers?.turnSeconds ?? 45}s
          </span>
          {isLobby && snapshot?.isHost && (
            <button
              type="button"
              onClick={() =>
                sendRoomAction({
                  type: "UPDATE_CONFIG",
                  config: {
                    ...snapshot.room.config,
                    timers: {
                      turnSeconds: Math.min(
                        180,
                        (snapshot.room.config?.timers?.turnSeconds ?? 45) + 15
                      ),
                    },
                  },
                })
              }
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold text-white cursor-pointer"
            >
              +
            </button>
          )}
        </div>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1.5 text-slate-300">
        <p className="font-bold text-amber-300">
          Thiết lập chuẩn Dead Man&apos;s Draw (2–4 Hải Tặc)
        </p>
        <p>
          • <strong>60 Lá Kho Báu (10 nhóm × 6 lá)</strong>: 50 lá trộn vào Bộ
          bài rút, 10 lá nhỏ nhất (9 lá số 2 và 1 Tiên Cá số 4) đặt sẵn vào Mộ
          bài.
        </p>
        <p>
          • <strong>Tính điểm cuối trận</strong>: Chỉ tính{" "}
          <strong>lá có giá trị cao nhất</strong> trong mỗi nhóm kho báu bạn giữ
          được.
        </p>
      </div>
    </div>
  );
}

export function DeadMansDrawRulesContent() {
  return (
    <>
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 leading-relaxed text-slate-300">
        <p className="font-bold text-amber-300 text-xs">
          1. Luật Cốt Lõi: Cược May Rủi & Cháy Bài (Bust)
        </p>
        <p>
          • Bộ bài gồm <strong>60 lá thuộc 10 nhóm kho báu</strong> (9 nhóm giá
          trị 2–7, riêng <strong>Tiên Cá</strong> giá trị 4–9). 10 lá thấp nhất
          khởi đầu nằm sẵn trong <strong>Mộ bài (Discard Pile)</strong>, 50 lá
          còn lại nằm trong <strong>Bộ bài rút</strong>.
        </p>
        <p>
          • Trong lượt của mình, bạn lần lượt <strong>Rút bài</strong> lên Khu
          Vực Lật Bài. Nếu lá mới rút <strong>KHÁC nhóm</strong> với các lá đang
          có, kỹ năng của nó lập tức kích hoạt! Bạn có thể tiếp tục rút hoặc bấm{" "}
          <strong>Thu Kho Báu</strong> để cất toàn bộ vào kho an toàn.
        </p>
        <p>
          • Nếu rút (hoặc cướp/kéo/đào) phải lá <strong>TRÙNG nhóm</strong> đã
          có trên bàn, bạn bị{" "}
          <strong className="text-rose-400">CHÁY BÀI (Bust)</strong>: mất toàn
          bộ bài trên bàn xuống Mộ bài và mất lượt (trừ các lá rút trước{" "}
          <strong>⚓ Mỏ Neo</strong>).
        </p>
        <p>
          • Khi Bộ bài rút cạn sạch, ván đấu kết thúc. Mỗi người cộng{" "}
          <strong>duy nhất lá cao nhất trong từng nhóm</strong> tại Kho Báu — ai
          tổng điểm cao nhất thắng!
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
        <p className="font-bold text-sky-300 text-xs">
          2. Chi Tiết Kỹ Năng 10 Nhóm Kho Báu
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DMD_SUITS.map((suit) => {
            const m = DMD_SUIT_META[suit];
            return (
              <div
                key={suit}
                className="rounded-lg border border-slate-800 bg-slate-900/80 p-2 space-y-0.5"
              >
                <p className="font-bold text-slate-100">
                  {m.emoji} {m.nameVi}{" "}
                  <span className="text-[10px] text-amber-300 font-mono">
                    ({m.minVal}–{m.maxVal})
                  </span>
                </p>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {m.abilityVi}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
