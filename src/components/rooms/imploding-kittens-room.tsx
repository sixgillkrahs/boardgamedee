"use client";

import React, { useEffect, useState } from "react";
import { getIkPixelCardUrl } from "@/canvas/imploding-kittens-art";
import { ImplodingKittensCanvas } from "@/components/imploding-kittens-canvas";
import {
  IK_CARD_META,
  IK_EXPANSION_IDS,
  IK_EXPANSION_META,
  validateFiveCardCombo,
  validateMatchingComboCards,
  type IkCardType,
  type IkExpansionId,
  type IkPlayerView,
} from "@/cartridges/imploding-kittens";
import type { GameConfigModalProps, GameRoomModuleProps } from "./types";

const STEALABLE_CARD_TYPES: IkCardType[] = [
  "defuse",
  "nope",
  "super_skip",
  "targeted_attack",
  "attack",
  "skip",
  "reverse",
  "draw_bottom",
  "catomic_bomb",
  "streaking_kitten",
  "alter_future_5",
  "alter_future_3",
  "see_future_5",
  "see_future_3",
  "favor",
  "tower_of_power",
  "shuffle",
  "feral_cat",
  "tacocat",
  "catermelon",
  "hairy_potato_cat",
  "beard_cat",
  "rainbow_cat",
];

export function ImplodingKittensRoom({
  snapshot,
  isLobby,
  busy,
  sendRoomAction,
}: GameRoomModuleProps) {
  const ikView: IkPlayerView | null =
    snapshot?.playerView ? (snapshot.playerView as IkPlayerView) : null;

  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [selectedTargetSeatNo, setSelectedTargetSeatNo] = useState<
    number | null
  >(null);
  const [wantedCardType, setWantedCardType] = useState<IkCardType>("defuse");
  const [wantedDiscardId, setWantedDiscardId] = useState<string>("");
  const [alterOrderIds, setAlterOrderIds] = useState<string[]>([]);
  const [insertIndex, setInsertIndex] = useState<number>(0);

  // Sync default target opponent and Alter Future order
  useEffect(() => {
    if (!ikView) return;
    setSelectedCardIds([]);
    const firstOpp = ikView.seats.find(
      (s) => s.alive && s.seatNo !== snapshot?.viewerSeatNo
    );
    if (
      selectedTargetSeatNo === null ||
      !ikView.seats.find(
        (s) => s.seatNo === selectedTargetSeatNo && s.alive
      )
    ) {
      setSelectedTargetSeatNo(firstOpp?.seatNo ?? null);
    }
    if (ikView.discardPileCards.length > 0) {
      setWantedDiscardId(
        ikView.discardPileCards[ikView.discardPileCards.length - 1].id
      );
    }
  }, [ikView?.turnNumber, ikView?.step]);

  useEffect(() => {
    if (
      ikView?.step === "AlterFutureStep" &&
      ikView.pendingAlterFuture &&
      ikView.pendingAlterFuture.cards.length > 0
    ) {
      setAlterOrderIds(ikView.pendingAlterFuture.cards.map((c) => c.id));
    }
  }, [ikView?.step, ikView?.pendingAlterFuture?.seatNo]);

  useEffect(() => {
    if (ikView?.step === "DefuseInsertStep" && ikView.pendingInsert) {
      setInsertIndex(0);
    }
  }, [ikView?.step, ikView?.pendingInsert?.card.id]);

  const handleToggleCard = (cardId: string) => {
    if (!ikView) return;

    // Direct one-click handler during FavorGiveStep or GarbagePickStep
    if (
      ikView.step === "FavorGiveStep" &&
      ikView.pendingFavor?.fromSeatNo === snapshot?.viewerSeatNo
    ) {
      void sendRoomAction({
        type: "MATCH_COMMAND",
        command: { type: "GIVE_FAVOR_CARD", cardId },
      });
      return;
    }
    if (
      ikView.step === "GarbagePickStep" &&
      ikView.pendingGroupSubmit?.needsViewerCard
    ) {
      void sendRoomAction({
        type: "MATCH_COMMAND",
        command: { type: "SUBMIT_GROUP_CARD", cardId },
      });
      return;
    }

    setSelectedCardIds((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : prev.length >= 5
          ? [...prev.slice(1), cardId]
          : [...prev, cardId]
    );
  };

  const selectedCards =
    ikView?.myHand.filter((c) => selectedCardIds.includes(c.id)) ?? [];
  const isMyTurn =
    !!ikView &&
    ikView.step === "TurnPlayStep" &&
    ikView.activeSeatNo === snapshot?.viewerSeatNo;

  const canPlaySingle =
    isMyTurn &&
    selectedCards.length === 1 &&
    !["defuse", "nope", "streaking_kitten", "exploding_kitten", "imploding_kitten"].includes(
      selectedCards[0].type
    ) &&
    IK_CARD_META[selectedCards[0].type].category !== "cat" &&
    IK_CARD_META[selectedCards[0].type].category !== "wildcard_cat";

  const canPlayCombo2 =
    isMyTurn &&
    selectedCards.length === 2 &&
    selectedTargetSeatNo !== null &&
    validateMatchingComboCards(selectedCards);

  const canPlayCombo3 =
    isMyTurn &&
    selectedCards.length === 3 &&
    selectedTargetSeatNo !== null &&
    validateMatchingComboCards(selectedCards);

  const canPlayCombo5 =
    isMyTurn &&
    selectedCards.length === 5 &&
    ikView.discardPileCards.length > 0 &&
    validateFiveCardCombo(selectedCards);

  const swapAlterPos = (idxA: number, idxB: number) => {
    setAlterOrderIds((prev) => {
      const copy = [...prev];
      [copy[idxA], copy[idxB]] = [copy[idxB], copy[idxA]];
      return copy;
    });
  };

  const expansionsConfig: Record<IkExpansionId, boolean> = {
    imploding: snapshot?.room.config?.expansions?.imploding ?? true,
    streaking: snapshot?.room.config?.expansions?.streaking ?? true,
    barking: snapshot?.room.config?.expansions?.barking ?? true,
    zombie: snapshot?.room.config?.expansions?.zombie ?? true,
  };

  return (
    <main className="relative flex-1 flex flex-col w-full p-1 sm:p-1.5">
      <div className="flex-1 relative w-full h-[calc(100vh-52px)] min-h-[580px]">
        <ImplodingKittensCanvas
          mode={isLobby ? "lobby" : "match"}
          lobbySeats={snapshot?.seats ?? []}
          viewerSeatNo={snapshot?.viewerSeatNo ?? null}
          playerView={ikView}
          selectedCardIds={selectedCardIds}
          selectedTargetSeatNo={selectedTargetSeatNo}
          onToggleCard={handleToggleCard}
          onSelectTargetSeat={setSelectedTargetSeatNo}
          onDispatchCommand={(cmd) =>
            void sendRoomAction({ type: "MATCH_COMMAND", command: cmd })
          }
        />

        {/* 1. LOBBY FLOATING OVERLAY WITH EXPANSION PACK TOGGLES */}
        {(isLobby || !ikView) && snapshot && (
          <div className="absolute inset-x-0 bottom-3 sm:bottom-5 z-20 flex flex-col items-center pointer-events-none px-3">
            <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-purple-500/45 bg-slate-950/90 backdrop-blur-md p-3.5 shadow-2xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-purple-300">
                    💣🕳️ Sảnh Chờ Imploding Kittens ({snapshot.seats.length}/6
                    Người Chơi)
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Chủ phòng có thể bật/tắt 4 Gói Mở Rộng bên dưới trước khi
                    bắt đầu!
                  </p>
                </div>
              </div>

              {/* 4 Expansion Toggles right in Lobby */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {IK_EXPANSION_IDS.map((expId) => {
                  const meta = IK_EXPANSION_META[expId];
                  const enabled = expansionsConfig[expId];
                  return (
                    <button
                      key={expId}
                      type="button"
                      disabled={busy || !snapshot.isHost}
                      onClick={() =>
                        sendRoomAction({
                          type: "UPDATE_CONFIG",
                          config: {
                            ...snapshot.room.config,
                            expansions: {
                              ...expansionsConfig,
                              [expId]: !enabled,
                            },
                          },
                        })
                      }
                      className={`rounded-xl border p-2 text-left transition ${
                        enabled
                          ? "border-purple-400/70 bg-purple-950/50 text-white shadow"
                          : "border-slate-800 bg-slate-900/60 text-slate-500"
                      } ${snapshot.isHost ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-extrabold">
                        <span>{meta.shortVi}</span>
                        <span>{enabled ? "✓ BẬT" : "TẮT"}</span>
                      </div>
                      <p className="text-[9.5px] text-slate-400 truncate mt-0.5">
                        {meta.badgeVi}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Seated Players Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {snapshot.seats.map((seat) => {
                  const isRoomHost = seat.actorId === snapshot.room.hostActorId;
                  const canRemove = snapshot.isHost && !isRoomHost;
                  return (
                    <div
                      key={seat.seatNo}
                      className="flex items-center justify-between gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-2.5 py-1.5"
                    >
                      <span className="text-xs font-bold text-slate-100 truncate">
                        #{seat.seatNo} {seat.displayName}{" "}
                        {isRoomHost ? "👑" : seat.isBot ? "🤖" : ""}
                      </span>
                      {canRemove && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            sendRoomAction({
                              type: "REMOVE_SEAT",
                              targetSeatNo: seat.seatNo,
                            })
                          }
                          className="shrink-0 rounded bg-slate-800 hover:bg-rose-500/25 border border-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-slate-300 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                {snapshot.isHost ? (
                  <>
                    {snapshot.seats.length < 6 && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => sendRoomAction({ type: "ADD_BOT" })}
                        className="rounded-xl border border-sky-500/45 bg-sky-500/15 hover:bg-sky-500/25 px-3.5 py-2 text-xs font-bold text-sky-200 transition cursor-pointer"
                      >
                        🤖 + Thêm Bot
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy || !snapshot.configValidation.valid}
                      onClick={() => sendRoomAction({ type: "START_MATCH" })}
                      className="rounded-xl bg-gradient-to-r from-purple-500 to-rose-500 hover:from-purple-400 hover:to-rose-400 px-5 py-2 text-xs font-extrabold text-white shadow-lg transition cursor-pointer disabled:opacity-40"
                    >
                      💣 BẮT ĐẦU VÁN ĐẤU
                    </button>
                  </>
                ) : snapshot.viewerSeatNo === null ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => sendRoomAction({ type: "JOIN" })}
                    className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-extrabold text-slate-950 transition cursor-pointer"
                  >
                    🪑 Ngồi Vào Bàn
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Đang chờ Chủ phòng bắt đầu ván đấu...
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. FLOATING ACTION BAR WHEN PLAYER SELECTS CARDS ON THEIR TURN */}
        {!isLobby && ikView && isMyTurn && (
          <div className="absolute inset-x-0 bottom-[210px] z-20 flex justify-center pointer-events-none px-3">
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-amber-400/50 bg-slate-950/92 backdrop-blur-md px-3.5 py-2 shadow-2xl">
              {canPlaySingle && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void sendRoomAction({
                      type: "MATCH_COMMAND",
                      command: {
                        type: "PLAY_CARD",
                        cardId: selectedCards[0].id,
                        targetSeatNo: selectedTargetSeatNo ?? undefined,
                      },
                    });
                    setSelectedCardIds([]);
                  }}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-4 py-2 text-xs font-extrabold text-slate-950 shadow cursor-pointer"
                >
                  ⚡ Đánh Lá [{IK_CARD_META[selectedCards[0].type].nameVi}]
                </button>
              )}

              {canPlayCombo2 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void sendRoomAction({
                      type: "MATCH_COMMAND",
                      command: {
                        type: "PLAY_COMBO_2",
                        cardIds: [selectedCards[0].id, selectedCards[1].id],
                        targetSeatNo: selectedTargetSeatNo!,
                      },
                    });
                    setSelectedCardIds([]);
                  }}
                  className="rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2 text-xs font-extrabold text-slate-950 shadow cursor-pointer"
                >
                  🐾 Đánh Combo 2 Lá (Chọn Rút 1 Lá Từ Mục Tiêu 🎯)
                </button>
              )}

              {canPlayCombo3 && (
                <div className="flex items-center gap-1.5">
                  <select
                    value={wantedCardType}
                    onChange={(e) =>
                      setWantedCardType(e.target.value as IkCardType)
                    }
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs font-bold text-amber-300"
                  >
                    {STEALABLE_CARD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {IK_CARD_META[t].emoji} {IK_CARD_META[t].nameVi}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      void sendRoomAction({
                        type: "MATCH_COMMAND",
                        command: {
                          type: "PLAY_COMBO_3",
                          cardIds: [
                            selectedCards[0].id,
                            selectedCards[1].id,
                            selectedCards[2].id,
                          ],
                          targetSeatNo: selectedTargetSeatNo!,
                          wantedCardType,
                        },
                      });
                      setSelectedCardIds([]);
                    }}
                    className="rounded-xl bg-purple-500 hover:bg-purple-400 px-3.5 py-2 text-xs font-extrabold text-white shadow cursor-pointer"
                  >
                    🎯 Đánh Combo 3 Lá (Chỉ Định Tên Bài)
                  </button>
                </div>
              )}

              {canPlayCombo5 && (
                <div className="flex items-center gap-1.5">
                  <select
                    value={wantedDiscardId}
                    onChange={(e) => setWantedDiscardId(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs font-bold text-emerald-300"
                  >
                    {ikView.discardPileCards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {IK_CARD_META[c.type].emoji}{" "}
                        {IK_CARD_META[c.type].nameVi}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      void sendRoomAction({
                        type: "MATCH_COMMAND",
                        command: {
                          type: "PLAY_COMBO_5",
                          cardIds: [
                            selectedCards[0].id,
                            selectedCards[1].id,
                            selectedCards[2].id,
                            selectedCards[3].id,
                            selectedCards[4].id,
                          ],
                          discardCardId: wantedDiscardId,
                        },
                      });
                      setSelectedCardIds([]);
                    }}
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3.5 py-2 text-xs font-extrabold text-slate-950 shadow cursor-pointer"
                  >
                    🌟 Combo 5 Lá Khác Nhau (Trục Vớt Từ Mộ)
                  </button>
                </div>
              )}

              {ikView.towerHolderSeatNo === snapshot?.viewerSeatNo &&
                ikView.towerStashCount > 0 && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      sendRoomAction({
                        type: "MATCH_COMMAND",
                        command: { type: "CLAIM_TOWER_STASH" },
                      })
                    }
                    className="rounded-xl border border-amber-400/70 bg-amber-500/20 hover:bg-amber-500/35 px-3.5 py-2 text-xs font-extrabold text-amber-200 shadow cursor-pointer"
                  >
                    👑 Rút 1 Lá Từ Tháp Quyền Lực (Còn {ikView.towerStashCount}{" "}
                    lá)
                  </button>
                )}

              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  sendRoomAction({
                    type: "MATCH_COMMAND",
                    command: { type: "DRAW_CARD" },
                  })
                }
                className="rounded-xl border border-emerald-500/50 bg-emerald-500/20 hover:bg-emerald-500/30 px-3.5 py-2 text-xs font-extrabold text-emerald-200 cursor-pointer"
              >
                🃏 Rút Bài Kết Thúc Lượt
              </button>
            </div>
          </div>
        )}

        {/* 3. PRIVATE VISION BANNER (See the Future / Clairvoyance / Share the Future) */}
        {!isLobby && ikView?.myPrivateVision && (
          <div className="absolute top-32 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-3">
            <div className="rounded-2xl border border-purple-400/60 bg-slate-950/95 p-3.5 shadow-2xl space-y-2">
              <p className="text-xs font-extrabold text-purple-300">
                {ikView.myPrivateVision.titleVi}
              </p>
              <div className="flex flex-wrap gap-2">
                {ikView.myPrivateVision.cards.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
                  >
                    <span>{item.emoji}</span> <span>{item.labelVi}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. NOPE! WINDOW OVERLAY */}
        {!isLobby &&
          ikView?.step === "NopeWindowStep" &&
          ikView.pendingAction && (
            <div className="absolute top-32 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-3">
              <div className="rounded-2xl border border-rose-500/70 bg-slate-950/95 p-4 shadow-2xl space-y-3 text-center">
                <p className="text-xs font-extrabold uppercase tracking-wider text-rose-300">
                  {ikView.pendingAction.isCanceledByNope
                    ? `🚫 ĐÃ BỊ NOPE (${ikView.pendingAction.nopeCount} lần) — Ai có Nope để đánh YUP không?`
                    : "⚡ CỬA SỔ PHỦ QUYẾT (NOPE!)"}
                </p>
                <p className="text-xs text-slate-200">
                  Hành động đang chờ:{" "}
                  <strong className="text-amber-300">
                    {ikView.pendingAction.cards
                      .map((c) => IK_CARD_META[c.type].nameVi)
                      .join(" + ")}
                  </strong>
                </p>
                <div className="flex items-center justify-center gap-2">
                  {ikView.pendingAction.canViewerNope && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        sendRoomAction({
                          type: "MATCH_COMMAND",
                          command: { type: "PLAY_NOPE" },
                        })
                      }
                      className="rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-extrabold text-white shadow-lg cursor-pointer"
                    >
                      {ikView.pendingAction.isCanceledByNope
                        ? "🔥 ĐÁNH YUP! (Phản Nope)"
                        : "🚫 ĐÁNH NOPE! (Hủy Bỏ)"}
                    </button>
                  )}
                  {!ikView.pendingAction.hasViewerPassedNope && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        sendRoomAction({
                          type: "MATCH_COMMAND",
                          command: { type: "PASS_NOPE" },
                        })
                      }
                      className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-slate-200 cursor-pointer"
                    >
                      ✓ Cho Qua (Không Nope)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        {/* 5. DEFUSE / IMPLODING FACE-UP / BURY INSERT MODAL WITH DEPTH SLIDER */}
        {!isLobby &&
          ikView?.step === "DefuseInsertStep" &&
          ikView.pendingInsert &&
          ikView.pendingInsert.seatNo === snapshot?.viewerSeatNo &&
          (() => {
            const pi = ikView.pendingInsert!;
            const maxIdx = Math.max(0, pi.maxInsertIndex);
            const clampedIdx = Math.max(0, Math.min(maxIdx, insertIndex));
            const pct = maxIdx > 0 ? (clampedIdx / maxIdx) * 100 : 0;
            const isImploding = pi.reason === "INSERT_IMPLODING_FACEUP";
            const isBury = pi.reason === "BURY_CARD";
            const cardImgUrl = getIkPixelCardUrl(pi.card.type, pi.card.id);
            const cardMeta = IK_CARD_META[pi.card.type];
            const accentBorder = isImploding
              ? "border-purple-500/70"
              : isBury
                ? "border-amber-500/70"
                : "border-rose-500/70";
            const accentTitle = isImploding
              ? "text-purple-300"
              : isBury
                ? "text-amber-300"
                : "text-rose-300";
            const accentBadgeBg = isImploding
              ? "bg-purple-500/20 border-purple-400/50 text-purple-200"
              : isBury
                ? "bg-amber-500/20 border-amber-400/50 text-amber-200"
                : "bg-rose-500/20 border-rose-400/50 text-rose-200";
            const accentMarker = isImploding
              ? "bg-purple-400 shadow-purple-500/80"
              : isBury
                ? "bg-amber-400 shadow-amber-500/80"
                : "bg-rose-500 shadow-rose-500/80";

            const posDesc =
              clampedIdx === 0
                ? "Ngay trên ĐỈNH (#1) — người rút tiếp theo sẽ bốc trúng ngay!"
                : clampedIdx === maxIdx
                  ? `Dưới ĐÁY CÙNG (#${maxIdx + 1}) — sau toàn bộ ${maxIdx} lá trong bộ bài`
                  : `Vị trí #${clampedIdx + 1} từ đỉnh — nằm dưới ${clampedIdx} lá bài`;

            return (
              <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div
                  className={`w-full max-w-md rounded-2xl border ${accentBorder} bg-slate-900/95 p-5 shadow-2xl space-y-4`}
                >
                  {/* Header with mini pixel card preview */}
                  <div className="flex items-center gap-3">
                    {cardImgUrl && (
                      <div className="shrink-0 w-12 aspect-[5/7] rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shadow">
                        <img
                          src={cardImgUrl}
                          alt={cardMeta.nameVi}
                          className="w-full h-full object-cover"
                          style={{ imageRendering: "pixelated" }}
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className={`text-sm font-extrabold ${accentTitle}`}>
                        {isImploding
                          ? "🕳️ Cài Mèo Hố Đen (LẬT NGỬA) Vào Bộ Bài"
                          : isBury
                            ? `🪏 Chôn Giấu [${cardMeta.shortVi}] Vào Bộ Bài`
                            : "🛠️ Tháo Ngòi Thành Công! Gài Lại Mèo Nổ"}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Kéo thanh bên dưới để chọn chính xác vị trí giấu lá bài
                        trong chồng {maxIdx} lá hiện tại.
                      </p>
                    </div>
                  </div>

                  {/* Live Position Readout */}
                  <div
                    className={`rounded-xl border px-3 py-2 text-center ${accentBadgeBg}`}
                  >
                    <p className="text-base font-black tracking-tight">
                      Vị trí #{clampedIdx + 1}{" "}
                      <span className="text-xs font-bold opacity-80">
                        / {maxIdx + 1}
                      </span>
                    </p>
                    <p className="text-[11px] font-semibold opacity-90 mt-0.5">
                      {posDesc}
                    </p>
                  </div>

                  {/* Visual Deck Depth Bar + Range Slider */}
                  <div className="space-y-2.5">
                    {/* Deck Depth Visualization */}
                    <div className="relative h-7 rounded-xl border border-slate-700/80 bg-slate-950/90 px-2 flex items-center overflow-hidden">
                      <div className="w-full h-2.5 rounded-full bg-gradient-to-r from-rose-500/35 via-amber-500/25 to-emerald-500/30" />
                      {/* Sliding Bomb Indicator */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-75 flex flex-col items-center pointer-events-none"
                        style={{
                          left: `calc(14px + (100% - 28px) * ${pct / 100})`,
                        }}
                      >
                        <span
                          className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${accentMarker}`}
                        />
                      </div>
                    </div>

                    {/* Interactive Slider with -1 / +1 fine-tune */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={busy || clampedIdx <= 0}
                        onClick={() =>
                          setInsertIndex(Math.max(0, clampedIdx - 1))
                        }
                        className="shrink-0 w-8 h-8 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm font-black text-white disabled:opacity-35 cursor-pointer"
                        title="Lùi lên gần Đỉnh hơn 1 lá"
                      >
                        −
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={maxIdx}
                        step={1}
                        value={clampedIdx}
                        onChange={(e) => setInsertIndex(Number(e.target.value))}
                        className="w-full h-2.5 rounded-lg appearance-none bg-slate-800 accent-rose-500 cursor-pointer"
                      />
                      <button
                        type="button"
                        disabled={busy || clampedIdx >= maxIdx}
                        onClick={() =>
                          setInsertIndex(Math.min(maxIdx, clampedIdx + 1))
                        }
                        className="shrink-0 w-8 h-8 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm font-black text-white disabled:opacity-35 cursor-pointer"
                        title="Đẩy sâu về Đáy hơn 1 lá"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-400 px-1">
                      <span className="text-rose-300">🔥 Đỉnh (#1)</span>
                      <span>Giữa (#{Math.floor(maxIdx / 2) + 1})</span>
                      <span className="text-emerald-300">
                        ⏬ Đáy (#{maxIdx + 1})
                      </span>
                    </div>
                  </div>

                  {/* Quick Snap Shortcuts */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setInsertIndex(0)}
                      className="rounded-lg border border-slate-700 bg-slate-800/90 hover:border-rose-400 px-2 py-1.5 text-[11px] font-bold text-slate-200 cursor-pointer"
                    >
                      Đỉnh #1
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setInsertIndex(Math.floor(maxIdx / 2))}
                      className="rounded-lg border border-slate-700 bg-slate-800/90 hover:border-amber-400 px-2 py-1.5 text-[11px] font-bold text-slate-200 cursor-pointer"
                    >
                      Giữa
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setInsertIndex(maxIdx)}
                      className="rounded-lg border border-slate-700 bg-slate-800/90 hover:border-emerald-400 px-2 py-1.5 text-[11px] font-bold text-slate-200 cursor-pointer"
                    >
                      Đáy
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        setInsertIndex(Math.floor(Math.random() * (maxIdx + 1)))
                      }
                      className="rounded-lg border border-slate-700 bg-slate-800/90 hover:border-sky-400 px-2 py-1.5 text-[11px] font-bold text-sky-200 cursor-pointer"
                    >
                      🎲 Ngẫu nhiên
                    </button>
                  </div>

                  {/* Confirm Insert Button */}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      sendRoomAction({
                        type: "MATCH_COMMAND",
                        command: {
                          type: "INSERT_CARD",
                          insertIndex: clampedIdx,
                        },
                      })
                    }
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg transition cursor-pointer disabled:opacity-45"
                  >
                    ✓ Xác Nhận Đặt Vào Vị Trí #{clampedIdx + 1}
                  </button>
                </div>
              </div>
            );
          })()}

        {/* 6. ALTER / SHARE THE FUTURE MODAL */}
        {!isLobby &&
          ikView?.step === "AlterFutureStep" &&
          ikView.pendingAlterFuture &&
          ikView.pendingAlterFuture.seatNo === snapshot?.viewerSeatNo && (
            <div className="absolute inset-0 z-30 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-lg rounded-2xl border border-indigo-500/60 bg-slate-900 p-4 shadow-2xl space-y-3">
                <p className="text-sm font-extrabold text-indigo-300">
                  🪄 Sắp Xếp Lại {ikView.pendingAlterFuture.count} Lá Đầu Bộ Bài
                  Rút (#1 Là Lá Trên Đỉnh Sẽ Rút Đầu Tiên)
                </p>
                <div className="space-y-2">
                  {alterOrderIds.map((cid, idx) => {
                    const card = ikView.pendingAlterFuture?.cards.find(
                      (c) => c.id === cid
                    );
                    if (!card) return null;
                    const meta = IK_CARD_META[card.type];
                    return (
                      <div
                        key={cid}
                        className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                      >
                        <span className="text-xs font-extrabold text-white">
                          #{idx + 1} {idx === 0 ? "(ĐỈNH)" : ""}: {meta.emoji}{" "}
                          {meta.nameVi}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => swapAlterPos(idx, idx - 1)}
                            className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-xs font-bold text-slate-200 disabled:opacity-30 cursor-pointer"
                          >
                            ▲ Lên
                          </button>
                          <button
                            type="button"
                            disabled={idx === alterOrderIds.length - 1}
                            onClick={() => swapAlterPos(idx, idx + 1)}
                            className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-xs font-bold text-slate-200 disabled:opacity-30 cursor-pointer"
                          >
                            ▼ Xuống
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    sendRoomAction({
                      type: "MATCH_COMMAND",
                      command: {
                        type: "COMMIT_ALTER_FUTURE",
                        orderedCardIds: alterOrderIds,
                      },
                    })
                  }
                  className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 px-4 py-2.5 text-xs font-extrabold text-white shadow cursor-pointer"
                >
                  ✓ Xác Nhận Thứ Tự Tương Lai Mới
                </button>
              </div>
            </div>
          )}

        {/* 7. DIG DEEPER MODAL */}
        {!isLobby &&
          ikView?.step === "DigDeeperStep" &&
          ikView.pendingDigDeeper &&
          ikView.pendingDigDeeper.seatNo === snapshot?.viewerSeatNo &&
          ikView.pendingDigDeeper.topCard && (
            <div className="absolute inset-0 z-30 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-md rounded-2xl border border-amber-500/60 bg-slate-900 p-4 shadow-2xl space-y-3 text-center">
                <p className="text-sm font-extrabold text-amber-300">
                  ⛏️ Đào Sâu Hơn (Dig Deeper)
                </p>
                <p className="text-xs text-slate-200">
                  Lá trên cùng (#1) đang là:{" "}
                  <strong className="text-white">
                    {IK_CARD_META[ikView.pendingDigDeeper.topCard.type].emoji}{" "}
                    {IK_CARD_META[ikView.pendingDigDeeper.topCard.type].nameVi}
                  </strong>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      sendRoomAction({
                        type: "MATCH_COMMAND",
                        command: {
                          type: "DIG_DEEPER_DECIDE",
                          keepFirst: true,
                        },
                      })
                    }
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3 py-2.5 text-xs font-extrabold text-slate-950 cursor-pointer"
                  >
                    ✓ Lấy Lá #1 Này
                  </button>
                  {ikView.pendingDigDeeper.hasSecondCard && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        sendRoomAction({
                          type: "MATCH_COMMAND",
                          command: {
                            type: "DIG_DEEPER_DECIDE",
                            keepFirst: false,
                          },
                        })
                      }
                      className="rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-2.5 text-xs font-extrabold text-slate-950 cursor-pointer"
                    >
                      ⛏️ Bỏ Qua & Đào Lá #2 Bên Dưới!
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        {/* 7.5. COMBO 2 OPPONENT CARD PICKER MODAL */}
        {!isLobby &&
          ikView?.step === "Combo2PickStep" &&
          ikView.pendingCombo2Pick &&
          (ikView.pendingCombo2Pick.actorSeatNo === snapshot?.viewerSeatNo ? (
            <div className="absolute inset-0 z-30 bg-slate-950/78 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-2xl rounded-2xl border border-sky-400/60 bg-slate-900/95 p-5 shadow-2xl space-y-4 text-center">
                <div className="space-y-1">
                  <p className="text-sm sm:text-base font-extrabold text-sky-300">
                    🐾 Combo 2 Lá — Chọn 1 Lá Bài Của{" "}
                    <span className="text-amber-300">
                      {ikView.pendingCombo2Pick.targetDisplayName}
                    </span>{" "}
                    Để Rút!
                  </p>
                  <p className="text-xs text-slate-400">
                    Các lá bài của đối thủ đã được xáo trộn ngẫu nhiên — bấm
                    chọn 1 lá để rút (lá bị Đánh Dấu sẽ lật ngửa).
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 py-2 max-h-[55vh] overflow-y-auto">
                  {ikView.pendingCombo2Pick.slots.map((markedCard, idx) => {
                    const markedMeta = markedCard
                      ? IK_CARD_META[markedCard.type]
                      : null;
                    const cardImgUrl = markedCard
                      ? getIkPixelCardUrl(markedCard.type, markedCard.id)
                      : "/sprites/ik-card-back-pixel.png";

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          sendRoomAction({
                            type: "MATCH_COMMAND",
                            command: {
                              type: "PICK_COMBO_2_CARD",
                              cardIndex: idx,
                            },
                          })
                        }
                        className="group relative w-20 sm:w-24 aspect-[5/7] rounded-xl overflow-hidden border-2 border-slate-700 hover:border-amber-400 bg-slate-950 shadow-lg hover:shadow-amber-500/30 transition-all duration-150 hover:-translate-y-2.5 cursor-pointer disabled:opacity-50"
                      >
                        {cardImgUrl ? (
                          <img
                            src={cardImgUrl}
                            alt={
                              markedMeta
                                ? markedMeta.nameVi
                                : `Lá úp #${idx + 1}`
                            }
                            className="w-full h-full object-cover"
                            style={{ imageRendering: "pixelated" }}
                          />
                        ) : (
                          <div
                            className="w-full h-full flex flex-col items-center justify-center p-1.5 text-center gap-1"
                            style={{
                              background: markedMeta
                                ? `linear-gradient(155deg, ${markedMeta.colorHex}, ${markedMeta.secondaryHex})`
                                : undefined,
                            }}
                          >
                            <span className="text-2xl">
                              {markedMeta?.emoji ?? "🃏"}
                            </span>
                            <span className="text-[10px] font-extrabold text-white leading-tight">
                              {markedMeta?.shortVi ?? `#${idx + 1}`}
                            </span>
                          </div>
                        )}
                        <span className="absolute bottom-1 inset-x-1 rounded bg-slate-950/85 px-1 py-0.5 text-[10px] font-extrabold text-amber-300 group-hover:bg-amber-400 group-hover:text-slate-950 transition">
                          {markedMeta
                            ? `🎯 ${markedMeta.shortVi}`
                            : `Rút #${idx + 1}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute top-32 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-3">
              <div className="rounded-2xl border border-sky-400/60 bg-slate-950/95 p-3.5 shadow-2xl text-center">
                <p className="text-xs font-extrabold text-sky-300">
                  🐾 Đang chờ{" "}
                  {ikView.seats.find(
                    (s) => s.seatNo === ikView.pendingCombo2Pick?.actorSeatNo
                  )?.displayName ?? "đối thủ"}{" "}
                  chọn rút 1 lá bài từ tay{" "}
                  {ikView.pendingCombo2Pick.targetDisplayName}...
                </p>
              </div>
            </div>
          ))}

        {/* 8. FAVOR / GARBAGE COLLECTION PROMPT BANNER */}
        {!isLobby &&
          ikView &&
          ((ikView.step === "FavorGiveStep" &&
            ikView.pendingFavor?.fromSeatNo === snapshot?.viewerSeatNo) ||
            (ikView.step === "GarbagePickStep" &&
              ikView.pendingGroupSubmit?.needsViewerCard)) && (
            <div className="absolute top-32 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-3">
              <div className="rounded-2xl border border-amber-400/70 bg-slate-950/95 p-3.5 shadow-2xl text-center">
                <p className="text-xs font-extrabold text-amber-300">
                  {ikView.step === "FavorGiveStep"
                    ? "🤲 Hãy bấm chọn 1 lá bài trên tay bạn ở dưới đáy màn hình để đưa cho đối thủ (Favor)!"
                    : ikView.pendingGroupSubmit?.mode === "GARBAGE_COLLECTION"
                      ? "🗑️ Thu Gom Rác: Hãy bấm chọn 1 lá bài trên tay bạn để trả vào Bộ bài rút!"
                      : "🍲 Góp Bài (Potluck): Hãy bấm chọn 1 lá bài trên tay bạn để đặt lên Đỉnh Bộ bài rút!"}
                </p>
              </div>
            </div>
          )}

        {/* 9. FINISHED REMATCH OVERLAY */}
        {!isLobby && ikView?.step === "Finished" && (
          <div className="absolute top-32 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-3">
            <div className="rounded-2xl border border-amber-400/70 bg-slate-950/95 p-4 shadow-2xl space-y-3 text-center">
              <p className="text-sm font-extrabold text-amber-300">
                {ikView.winReasonVi}
              </p>
              {snapshot?.isHost && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => sendRoomAction({ type: "REMATCH" })}
                  className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 cursor-pointer"
                >
                  🔁 Chơi Ván Mới (Về Sảnh)
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export function ImplodingKittensConfigContent({
  snapshot,
  isLobby,
  busy,
  sendRoomAction,
}: GameConfigModalProps) {
  const expansions: Record<IkExpansionId, boolean> = {
    imploding: snapshot?.room.config?.expansions?.imploding ?? true,
    streaking: snapshot?.room.config?.expansions?.streaking ?? true,
    barking: snapshot?.room.config?.expansions?.barking ?? true,
    zombie: snapshot?.room.config?.expansions?.zombie ?? true,
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-purple-500/35 bg-slate-950/70 p-3 space-y-2">
        <p className="font-bold text-purple-300">
          Các Gói Bài Mở Rộng (Chủ Phòng Tùy Chọn Bật/Tắt)
        </p>
        <div className="space-y-2">
          {IK_EXPANSION_IDS.map((expId) => {
            const meta = IK_EXPANSION_META[expId];
            const enabled = expansions[expId];
            return (
              <button
                key={expId}
                type="button"
                disabled={!isLobby || !snapshot?.isHost || busy}
                onClick={() =>
                  sendRoomAction({
                    type: "UPDATE_CONFIG",
                    config: {
                      ...snapshot?.room.config,
                      expansions: {
                        ...expansions,
                        [expId]: !enabled,
                      },
                    },
                  })
                }
                className={`w-full rounded-xl border p-3 text-left transition ${
                  enabled
                    ? "border-purple-400 bg-purple-500/15 text-white"
                    : "border-slate-800 bg-slate-900/80 text-slate-400"
                } ${isLobby && snapshot?.isHost ? "cursor-pointer" : "cursor-default"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-white">
                    {enabled ? "✓ ĐANG BẬT: " : "○ ĐANG TẮT: "}
                    {meta.nameVi}
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-purple-300">
                    {meta.badgeVi}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {meta.descriptionVi}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ImplodingKittensRulesContent() {
  return (
    <div className="space-y-3 text-slate-300 leading-relaxed">
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
        <p className="font-bold text-purple-300 text-xs">
          1. Mèo Nổ (Exploding Kitten) vs Mèo Hố Đen (Imploding Kitten)
        </p>
        <p>
          • <strong>💣 Mèo Nổ (Exploding Kitten)</strong>: Rút phải sẽ bị nổ tung
          trừ khi dùng 1 lá <strong>🛠️ Tháo Ngòi (Defuse)</strong> để bí mật cài
          lại vào Bộ bài rút (hoặc giữ kín trên tay nếu bạn đang cầm lá{" "}
          <strong>🏃 Mèo Chạy Rông / Streaking Kitten</strong>).
        </p>
        <p>
          • <strong>🕳️ Mèo Hố Đen (Imploding Kitten)</strong>:
          <br />- <strong>Lần 1 rút phải (đang Úp)</strong>: Chưa nổ! Bạn được bí
          mật chọn vị trí bất kỳ trong Bộ bài rút để nhét nó vào ở trạng thái{" "}
          <strong className="text-purple-300">LẬT NGỬA</strong>.
          <br />- <strong>Lần 2 rút phải (khi đã Lật Ngửa)</strong>:{" "}
          <strong className="text-rose-400">
            KHÔNG THỂ DÙNG DEFUSE HAY STREAKING KITTEN
          </strong>{" "}
          — bạn bị sập hố đen và bị loại ngay lập tức!
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
        <p className="font-bold text-amber-300 text-xs">
          2. Ba Đòn Combo Đặc Biệt & Mèo Hoang (Feral Cat)
        </p>
        <p>
          • <strong>🐾 Combo 2 Lá Cùng Loại</strong> (hoặc Lá Mèo +{" "}
          <strong>😼 Mèo Hoang</strong>): Cướp ngẫu nhiên 1 lá bài từ tay đối
          thủ.
        </p>
        <p>
          • <strong>🎯 Combo 3 Lá Cùng Loại</strong>: Chỉ định tên 1 loại lá bài
          (VD: <em>Defuse, Super Skip, Catomic Bomb...</em>) để tịch thu từ tay
          đối thủ nếu họ có.
        </p>
        <p>
          • <strong>🌟 Combo 5 Lá Khác Nhau</strong>: Chọn lấy lại bất kỳ 1 lá
          bài nào từ Chồng bài bỏ (Discard Pile) về tay.
        </p>
      </div>
    </div>
  );
}
