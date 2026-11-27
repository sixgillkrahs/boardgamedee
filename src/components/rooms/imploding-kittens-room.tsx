"use client";

import React, { useEffect, useState } from "react";
import {
  getIkCardSpriteBgStyle,
  preloadIkCardAtlases,
} from "@/canvas/imploding-kittens-art";
import { ImplodingKittensCanvas } from "@/components/imploding-kittens-canvas";
import {
  getDefaultExplodingKittenCount,
  IK_CARD_META,
  IK_EXPANSION_IDS,
  IK_EXPANSION_META,
  IK_GODCAT_MIMICABLE_TYPES,
  IK_MAX_EXPLODING_KITTENS,
  IK_MIN_EXPLODING_KITTENS,
  validateFiveCardCombo,
  validateMatchingComboCards,
  type IkCardType,
  type IkExpansionId,
  type IkPlayerView,
} from "@/cartridges/imploding-kittens";
import type { GameConfigModalProps, GameRoomModuleProps } from "./types";

const STEALABLE_CARD_TYPES: IkCardType[] = [
  "godcat",
  "defuse",
  "zombie_kitten",
  "nope",
  "armageddon",
  "raising_heck",
  "reveal_future_3",
  "super_skip",
  "targeted_attack",
  "attack",
  "attack_of_the_dead",
  "skip",
  "reverse",
  "draw_bottom",
  "catomic_bomb",
  "streaking_kitten",
  "alter_future_5",
  "alter_future_3",
  "share_future_3",
  "see_future_5",
  "see_future_3",
  "favor",
  "tower_of_power",
  "barking_kitten",
  "bury",
  "ill_take_that",
  "potluck",
  "clone",
  "dig_deeper",
  "clairvoyance",
  "curse_cat_butt",
  "mark",
  "shuffle",
  "feral_cat",
  "tacocat",
  "catermelon",
  "hairy_potato_cat",
  "beard_cat",
  "rainbow_cat",
  "de_cat_ipated",
  "vampire_cat",
  "zombie_cat",
  "horse_cat",
  "knight_cat",
  "mercat",
  "troll_cat",
];

export function ImplodingKittensRoom({
  snapshot,
  isLobby,
  busy,
  isExpanded,
  sendRoomAction,
}: GameRoomModuleProps) {
  const ikView: IkPlayerView | null =
    snapshot?.playerView ? (snapshot.playerView as IkPlayerView) : null;

  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [selectedTargetSeatNo, setSelectedTargetSeatNo] = useState<
    number | null
  >(null);
  const [wantedCardType, setWantedCardType] = useState<IkCardType>("defuse");
  const [godcatMimicType, setGodcatMimicType] =
    useState<IkCardType>("targeted_attack");
  const [wantedDiscardId, setWantedDiscardId] = useState<string>("");
  const [alterOrderIds, setAlterOrderIds] = useState<string[]>([]);
  const [insertIndex, setInsertIndex] = useState<number>(0);
  const [dismissedVisionKey, setDismissedVisionKey] = useState<string | null>(
    null
  );
  const [focusedPreviewType, setFocusedPreviewType] =
    useState<IkCardType | null>(null);

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

  const visionKey = ikView?.myPrivateVision
    ? `${ikView.turnNumber}-${ikView.myPrivateVision.titleVi}-${ikView.myPrivateVision.cards.map((c) => c.cardId ?? c.labelVi).join(",")}`
    : null;

  useEffect(() => {
    setFocusedPreviewType(null);
  }, [visionKey, ikView?.step]);

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

  const isSelectedGodcat =
    isMyTurn &&
    selectedCards.length === 1 &&
    selectedCards[0].type === "godcat";

  const isSelectedArmageddonBlocked =
    isMyTurn &&
    selectedCards.length === 1 &&
    selectedCards[0].type === "armageddon" &&
    !ikView.godcatOnPlaymat;

  const canPlaySingle =
    isMyTurn &&
    selectedCards.length === 1 &&
    !isSelectedGodcat &&
    ![
      "defuse",
      "zombie_kitten",
      "nope",
      "streaking_kitten",
      "exploding_kitten",
      "imploding_kitten",
      "devilcat",
    ].includes(selectedCards[0].type) &&
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
    good_vs_evil: snapshot?.room.config?.expansions?.good_vs_evil ?? true,
  };

  const customExplodingCount: number | null =
    typeof snapshot?.room.config?.explodingKittenCount === "number"
      ? snapshot.room.config.explodingKittenCount
      : null;
  const autoExplodingCount = getDefaultExplodingKittenCount(
    expansionsConfig,
    snapshot?.seats.length ?? 2
  );
  const effectiveExplodingCount = customExplodingCount ?? autoExplodingCount;

  const updateExplodingKittenCount = (nextCount: number | null) => {
    if (!snapshot) return;
    const clamped =
      nextCount === null
        ? null
        : Math.max(
            IK_MIN_EXPLODING_KITTENS,
            Math.min(IK_MAX_EXPLODING_KITTENS, nextCount)
          );
    void sendRoomAction({
      type: "UPDATE_CONFIG",
      config: {
        ...snapshot.room.config,
        expansions: expansionsConfig,
        explodingKittenCount: clamped,
      },
    });
  };

  // Preload Core + enabled expansion pack atlases immediately while waiting in Lobby
  useEffect(() => {
    preloadIkCardAtlases(expansionsConfig);
  }, [
    expansionsConfig.imploding,
    expansionsConfig.streaking,
    expansionsConfig.barking,
    expansionsConfig.zombie,
    expansionsConfig.good_vs_evil,
  ]);

  return (
    <main
      className={`relative flex-1 min-h-0 flex flex-col w-full overflow-hidden ${
        isExpanded ? "p-0" : "p-0.5 sm:p-1.5"
      }`}
    >
      <div className="flex-1 min-h-0 h-full relative w-full">
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
          <div className="absolute inset-x-0 bottom-1.5 sm:bottom-4 z-20 flex flex-col items-center pointer-events-none px-1.5 sm:px-3">
            <div className="pointer-events-auto w-full max-w-2xl max-h-[82dvh] sm:max-h-[76dvh] overflow-y-auto rounded-2xl border border-purple-500/45 bg-slate-950/92 backdrop-blur-md p-2 sm:p-3.5 shadow-2xl space-y-1.5 sm:space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-800 pb-1.5 sm:pb-2">
                <div>
                  <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-purple-300">
                    Sảnh Chờ Imploding Kittens ({snapshot.seats.length}/6
                    Người Chơi)
                  </span>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 [@media(max-height:460px)]:hidden">
                    Chủ phòng có thể bật/tắt 5 Gói Mở Rộng và số lá Mèo Nổ trước
                    khi bắt đầu!
                  </p>
                </div>
              </div>

              {/* 5 Expansion Toggles right in Lobby */}
              <div className="grid grid-cols-2 [@media(min-width:540px)]:grid-cols-5 gap-1.5">
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

              {/* Host Customizable Exploding Kittens Bomb Count */}
              <div className="rounded-xl border border-rose-500/35 bg-rose-950/20 px-2.5 py-2 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-rose-200">
                    <span>💣 Số Lá Mèo Nổ</span>
                    <span className="rounded-md bg-rose-500/20 border border-rose-400/40 px-1.5 py-0.5 text-[10px] font-mono text-rose-200">
                      {effectiveExplodingCount} Mèo Nổ
                      {expansionsConfig.imploding ? " + 1 Hố Đen" : ""}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {customExplodingCount === null
                      ? `Đang dùng mặc định theo số người chơi (${autoExplodingCount} lá Mèo Nổ)`
                      : `Chủ phòng đã tùy chỉnh cố định ${customExplodingCount} lá Mèo Nổ trong bộ bài`}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={busy || !snapshot.isHost || customExplodingCount === null}
                    onClick={() => updateExplodingKittenCount(null)}
                    className={`rounded-lg border px-2 py-1 text-[10px] font-extrabold transition ${
                      customExplodingCount === null
                        ? "border-amber-400/70 bg-amber-500/20 text-amber-200"
                        : "border-slate-700 bg-slate-900/80 text-slate-300 hover:border-amber-400/60"
                    } ${snapshot.isHost && customExplodingCount !== null ? "cursor-pointer" : "cursor-default"}`}
                  >
                    Tự động ({autoExplodingCount})
                  </button>

                  <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900/90 overflow-hidden">
                    <button
                      type="button"
                      aria-label="Giảm số lá Mèo Nổ"
                      disabled={
                        busy ||
                        !snapshot.isHost ||
                        effectiveExplodingCount <= IK_MIN_EXPLODING_KITTENS
                      }
                      onClick={() =>
                        updateExplodingKittenCount(effectiveExplodingCount - 1)
                      }
                      className="px-2.5 py-1 text-xs font-black text-rose-300 hover:bg-rose-500/20 disabled:opacity-35 cursor-pointer"
                    >
                      −
                    </button>
                    <span className="min-w-[30px] text-center text-xs font-mono font-extrabold text-white px-1">
                      {effectiveExplodingCount}
                    </span>
                    <button
                      type="button"
                      aria-label="Tăng số lá Mèo Nổ"
                      disabled={
                        busy ||
                        !snapshot.isHost ||
                        effectiveExplodingCount >= IK_MAX_EXPLODING_KITTENS
                      }
                      onClick={() =>
                        updateExplodingKittenCount(effectiveExplodingCount + 1)
                      }
                      className="px-2.5 py-1 text-xs font-black text-rose-300 hover:bg-rose-500/20 disabled:opacity-35 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
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
                        {isRoomHost ? "(Host)" : seat.isBot ? "(Bot)" : ""}
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
                        + Thêm Bot
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy || !snapshot.configValidation.valid}
                      onClick={() => sendRoomAction({ type: "START_MATCH" })}
                      className="rounded-xl bg-gradient-to-r from-purple-500 to-rose-500 hover:from-purple-400 hover:to-rose-400 px-5 py-2 text-xs font-extrabold text-white shadow-lg transition cursor-pointer disabled:opacity-40"
                    >
                      BẮT ĐẦU VÁN ĐẤU
                    </button>
                  </>
                ) : snapshot.viewerSeatNo === null ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => sendRoomAction({ type: "JOIN" })}
                    className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-extrabold text-slate-950 transition cursor-pointer"
                  >
                    Ngồi Vào Bàn
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
          <div className="absolute inset-x-0 bottom-[calc(var(--ik-dock-h,180px)+6px)] z-20 flex justify-center pointer-events-none px-1.5 sm:px-3">
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1 sm:gap-2 rounded-xl sm:rounded-2xl border border-amber-400/50 bg-slate-950/92 backdrop-blur-md px-2 py-1 sm:px-3.5 sm:py-2 shadow-2xl max-w-[96vw]">
              {canPlaySingle && (
                <button
                  type="button"
                  disabled={busy || isSelectedArmageddonBlocked}
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
                  className="rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-2.5 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-extrabold text-slate-950 shadow cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed max-w-[90vw] truncate"
                >
                  {isSelectedArmageddonBlocked
                    ? "Cần Mèo Thần Trên Thảm"
                    : `Đánh [${IK_CARD_META[selectedCards[0].type].shortVi}]`}
                </button>
              )}

              {isSelectedGodcat && (
                <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
                  <select
                    value={godcatMimicType}
                    onChange={(e) =>
                      setGodcatMimicType(e.target.value as IkCardType)
                    }
                    className="max-w-[44vw] sm:max-w-none rounded-lg border border-yellow-400/60 bg-slate-900 px-1.5 py-1 sm:px-2 sm:py-1.5 text-[11px] sm:text-xs font-bold text-yellow-300"
                  >
                    {IK_GODCAT_MIMICABLE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {IK_CARD_META[t].nameVi}
                        {IK_CARD_META[t].needsTargetSeat ? " (Cần Mục Tiêu)" : ""}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={
                      busy ||
                      (IK_CARD_META[godcatMimicType].needsTargetSeat &&
                        selectedTargetSeatNo === null)
                    }
                    onClick={() => {
                      void sendRoomAction({
                        type: "MATCH_COMMAND",
                        command: {
                          type: "PLAY_CARD",
                          cardId: selectedCards[0].id,
                          mimicCardType: godcatMimicType,
                          targetSeatNo: IK_CARD_META[godcatMimicType]
                            .needsTargetSeat
                            ? (selectedTargetSeatNo ?? undefined)
                            : undefined,
                        },
                      });
                      setSelectedCardIds([]);
                    }}
                    className="rounded-lg sm:rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-extrabold text-slate-950 shadow cursor-pointer disabled:opacity-45"
                  >
                    Hóa Thân ({IK_CARD_META[godcatMimicType].shortVi})
                  </button>
                </div>
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
                  className="rounded-lg sm:rounded-xl bg-sky-500 hover:bg-sky-400 px-2.5 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-extrabold text-slate-950 shadow cursor-pointer"
                >
                  Combo 2 Lá (Cướp Bài)
                </button>
              )}

              {canPlayCombo3 && (
                <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
                  <select
                    value={wantedCardType}
                    onChange={(e) =>
                      setWantedCardType(e.target.value as IkCardType)
                    }
                    className="max-w-[44vw] sm:max-w-none rounded-lg border border-slate-700 bg-slate-900 px-1.5 py-1 sm:px-2 sm:py-1.5 text-[11px] sm:text-xs font-bold text-amber-300"
                  >
                    {STEALABLE_CARD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {IK_CARD_META[t].nameVi}
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
                    className="rounded-lg sm:rounded-xl bg-purple-500 hover:bg-purple-400 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-extrabold text-white shadow cursor-pointer"
                  >
                    Combo 3 Lá
                  </button>
                </div>
              )}

              {canPlayCombo5 && (
                <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
                  <select
                    value={wantedDiscardId}
                    onChange={(e) => setWantedDiscardId(e.target.value)}
                    className="max-w-[44vw] sm:max-w-none rounded-lg border border-slate-700 bg-slate-900 px-1.5 py-1 sm:px-2 sm:py-1.5 text-[11px] sm:text-xs font-bold text-emerald-300"
                  >
                    {ikView.discardPileCards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {" "}
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
                    className="rounded-lg sm:rounded-xl bg-emerald-500 hover:bg-emerald-400 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-extrabold text-slate-950 shadow cursor-pointer"
                  >
                    Combo 5 Lá (Nhặt Mộ)
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
                    className="rounded-lg sm:rounded-xl border border-amber-400/70 bg-amber-500/20 hover:bg-amber-500/35 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-extrabold text-amber-200 shadow cursor-pointer"
                  >
                    Rút Tháp ({ikView.towerStashCount})
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
                className="rounded-lg sm:rounded-xl border border-emerald-500/50 bg-emerald-500/20 hover:bg-emerald-500/30 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-extrabold text-emerald-200 cursor-pointer"
              >
                Rút Bài Kết Thúc Lượt
              </button>
            </div>
          </div>
        )}

        {/* 3. PRIVATE VISION BANNER (See the Future / Clairvoyance / Share the Future) — Full Cards + Vietnamese Functions */}
        {!isLobby &&
          ikView?.myPrivateVision &&
          visionKey !== dismissedVisionKey && (
            <div className="absolute inset-0 z-30 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
              <div className="w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-2xl border border-purple-400/65 bg-slate-900/95 p-3.5 sm:p-5 shadow-2xl space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-purple-300">
                      {ikView.myPrivateVision.titleVi}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Bấm vào từng lá bài để đọc chi tiết chức năng tiếng Việt.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDismissedVisionKey(visionKey)}
                    className="shrink-0 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-200 cursor-pointer"
                  >
                    Đóng ✕
                  </button>
                </div>

                <div className="flex flex-wrap items-start justify-center gap-3">
                  {ikView.myPrivateVision.cards.map((item, idx) => {
                    const meta = item.cardType
                      ? IK_CARD_META[item.cardType]
                      : null;
                    const spriteStyle = item.cardType
                      ? getIkCardSpriteBgStyle(
                          item.cardType,
                          item.cardId ?? String(idx)
                        )
                      : null;
                    const isFocused =
                      meta !== null && focusedPreviewType === meta.type;

                    if (!meta) {
                      return (
                        <div
                          key={idx}
                          className="rounded-xl border border-emerald-500/40 bg-emerald-950/50 px-4 py-3 text-xs font-bold text-emerald-200"
                        >
                          <span>{item.labelVi}</span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setFocusedPreviewType((prev) =>
                            prev === meta.type ? null : meta.type
                          )
                        }
                        className={`w-24 [@media(max-height:480px)]:w-20 sm:w-32 rounded-xl border p-1.5 bg-slate-950/90 flex flex-col items-center gap-1 sm:gap-1.5 text-center transition cursor-pointer ${
                          isFocused
                            ? "border-amber-400 ring-2 ring-amber-400/40 -translate-y-1"
                            : "border-slate-700 hover:border-purple-400 hover:-translate-y-0.5"
                        }`}
                      >
                        <span
                          className={`w-full rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                            idx === 0
                              ? "bg-amber-500/25 text-amber-300"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {item.positionLabelVi ?? `#${idx + 1}`}
                          {item.faceUp ? " • NGỬA" : ""}
                        </span>

                        <div className="w-full aspect-[5/7] rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center">
                          {spriteStyle ? (
                            <div
                              role="img"
                              aria-label={meta.nameVi}
                              className="w-full h-full"
                              style={spriteStyle}
                            />
                          ) : (
                            <div
                              className="w-full h-full flex flex-col items-center justify-center p-2 gap-1"
                              style={{
                                background: `linear-gradient(155deg, ${meta.colorHex}, ${meta.secondaryHex})`,
                              }}
                            >
                              <span className="text-3xl">{meta.emoji}</span>
                              <span className="text-[10px] font-extrabold text-white leading-tight">
                                {meta.shortVi}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="w-full px-0.5 space-y-0.5">
                          <p className="text-[11px] font-extrabold text-white truncate">
                            {meta.shortVi}
                          </p>
                          <p className="text-[9.5px] text-slate-400 leading-tight line-clamp-2">
                            {meta.subtitleVi}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {focusedPreviewType && (
                  <div className="rounded-xl border border-amber-400/45 bg-slate-950/90 p-3 text-left space-y-1">
                    <p className="text-xs font-extrabold text-amber-300">
                      {IK_CARD_META[focusedPreviewType].nameVi}
                    </p>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {IK_CARD_META[focusedPreviewType].ruleVi}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setDismissedVisionKey(visionKey)}
                  className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-xs font-extrabold text-white shadow cursor-pointer"
                >
                  ✓ Đã Xem Xong
                </button>
              </div>
            </div>
          )}

        {/* 4. NOPE! WINDOW OVERLAY */}
        {!isLobby &&
          ikView?.step === "NopeWindowStep" &&
          ikView.pendingAction && (
            <div className="absolute top-[calc(var(--ik-opp-bottom,120px)+6px)] left-1/2 -translate-x-1/2 z-30 w-full max-w-[min(94vw,28rem)] px-2">
              <div className="rounded-2xl border border-rose-500/70 bg-slate-950/95 p-3 sm:p-4 shadow-2xl space-y-2 sm:space-y-3 text-center">
                <p className="text-xs font-extrabold uppercase tracking-wider text-rose-300">
                  {ikView.pendingAction.isCanceledByNope
                    ? `ĐÃ BỊ NOPE (${ikView.pendingAction.nopeCount} lần) — Ai có Nope để đánh YUP không?`
                    : "CỬA SỔ PHỦ QUYẾT (NOPE!)"}
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
                        ? "ĐÁNH YUP! (Phản Nope)"
                        : "ĐÁNH NOPE! (Hủy Bỏ)"}
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
            const cardSpriteStyle = getIkCardSpriteBgStyle(
              pi.card.type,
              pi.card.id
            );
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
              <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
                <div
                  className={`w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-2xl border ${accentBorder} bg-slate-900/95 p-4 sm:p-5 shadow-2xl space-y-3 sm:space-y-4`}
                >
                  {/* Header with mini pixel card preview */}
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-12 aspect-[5/7] rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shadow">
                      <div
                        role="img"
                        aria-label={cardMeta.nameVi}
                        className="w-full h-full"
                        style={cardSpriteStyle}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-extrabold ${accentTitle}`}>
                        {isImploding
                          ? "Cài Mèo Hố Đen (LẬT NGỬA) Vào Bộ Bài"
                          : isBury
                            ? `Chôn Giấu [${cardMeta.shortVi}] Vào Bộ Bài`
                            : "Tháo Ngòi Thành Công! Gài Lại Mèo Nổ"}
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
                      <span className="text-rose-300">Đỉnh (#1)</span>
                      <span>Giữa (#{Math.floor(maxIdx / 2) + 1})</span>
                      <span className="text-emerald-300">
                        Đáy (#{maxIdx + 1})
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
                      Ngẫu nhiên
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

        {/* 6. ALTER / SHARE THE FUTURE MODAL — Visual Pixel Cards + Vietnamese Functions */}
        {!isLobby &&
          ikView?.step === "AlterFutureStep" &&
          ikView.pendingAlterFuture &&
          ikView.pendingAlterFuture.seatNo === snapshot?.viewerSeatNo && (
            <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
              <div className="w-full max-w-3xl max-h-[92dvh] overflow-y-auto rounded-2xl border border-indigo-500/65 bg-slate-900/95 p-3.5 sm:p-5 shadow-2xl space-y-3">
                <div>
                  <p className="text-sm font-extrabold text-indigo-300">
                    Sắp Xếp Lại {ikView.pendingAlterFuture.count} Lá Đầu Bộ
                    Bài Rút (#1 Là Lá Trên Đỉnh Sẽ Rút Đầu Tiên)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Dùng nút ◀ / ▶ dưới mỗi lá để đổi vị trí • Bấm vào lá bài để
                    xem đầy đủ chức năng tiếng Việt.
                  </p>
                </div>

                <div className="flex flex-wrap items-start justify-center gap-2.5 sm:gap-3 max-h-[56vh] overflow-y-auto py-1">
                  {alterOrderIds.map((cid, idx) => {
                    const card = ikView.pendingAlterFuture?.cards.find(
                      (c) => c.id === cid
                    );
                    if (!card) return null;
                    const meta = IK_CARD_META[card.type];
                    const spriteStyle = getIkCardSpriteBgStyle(
                      card.type,
                      card.id
                    );
                    const isFocused = focusedPreviewType === card.type;

                    return (
                      <div
                        key={cid}
                        className={`w-24 [@media(max-height:480px)]:w-20 sm:w-32 rounded-xl border p-1.5 bg-slate-950/90 flex flex-col items-center gap-1 sm:gap-1.5 transition ${
                          isFocused
                            ? "border-amber-400 ring-2 ring-amber-400/35"
                            : "border-slate-700"
                        }`}
                      >
                        <span
                          className={`w-full text-center rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                            idx === 0
                              ? "bg-amber-500/25 text-amber-300"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          #{idx + 1} {idx === 0 ? "(ĐỈNH)" : ""}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setFocusedPreviewType((prev) =>
                              prev === card.type ? null : card.type
                            )
                          }
                          className="w-full aspect-[5/7] rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center cursor-pointer"
                        >
                          <div
                            role="img"
                            aria-label={meta.nameVi}
                            className="w-full h-full"
                            style={spriteStyle}
                          />
                        </button>

                        <div className="w-full text-center px-0.5">
                          <p className="text-[11px] font-extrabold text-white truncate">
                            {meta.shortVi}
                          </p>
                          <p className="text-[9.5px] text-slate-400 leading-tight line-clamp-2">
                            {meta.subtitleVi}
                          </p>
                        </div>

                        <div className="w-full grid grid-cols-2 gap-1 pt-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => swapAlterPos(idx, idx - 1)}
                            className="rounded-lg bg-slate-800 hover:bg-indigo-500/35 border border-slate-700 py-1 text-[11px] font-extrabold text-slate-200 disabled:opacity-30 cursor-pointer"
                            title="Đẩy lên gần Đỉnh hơn"
                          >
                            ◀
                          </button>
                          <button
                            type="button"
                            disabled={idx === alterOrderIds.length - 1}
                            onClick={() => swapAlterPos(idx, idx + 1)}
                            className="rounded-lg bg-slate-800 hover:bg-indigo-500/35 border border-slate-700 py-1 text-[11px] font-extrabold text-slate-200 disabled:opacity-30 cursor-pointer"
                            title="Đẩy sâu xuống hơn"
                          >
                            ▶
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {focusedPreviewType && (
                  <div className="rounded-xl border border-amber-400/45 bg-slate-950/90 p-3 text-left space-y-1">
                    <p className="text-xs font-extrabold text-amber-300">
                      {IK_CARD_META[focusedPreviewType].nameVi}
                    </p>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {IK_CARD_META[focusedPreviewType].ruleVi}
                    </p>
                  </div>
                )}

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

        {/* 7. DIG DEEPER MODAL — Full Pixel Card #1 + Vietnamese Function */}
        {!isLobby &&
          ikView?.step === "DigDeeperStep" &&
          ikView.pendingDigDeeper &&
          ikView.pendingDigDeeper.seatNo === snapshot?.viewerSeatNo &&
          ikView.pendingDigDeeper.topCard &&
          (() => {
            const topCard = ikView.pendingDigDeeper!.topCard!;
            const topMeta = IK_CARD_META[topCard.type];
            const topSpriteStyle = getIkCardSpriteBgStyle(
              topCard.type,
              topCard.id
            );

            return (
              <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
                <div className="w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-2xl border border-amber-500/65 bg-slate-900/95 p-4 sm:p-5 shadow-2xl space-y-3.5">
                  <p className="text-sm font-extrabold text-amber-300 text-center">
                    Đào Sâu Hơn (Dig Deeper) — Lá #1 Trên Đỉnh
                  </p>

                  <div className="flex flex-col [@media(min-width:440px)]:flex-row items-center [@media(min-width:440px)]:items-start gap-3">
                    <div className="shrink-0 w-24 [@media(max-height:460px)]:w-20 sm:w-32 aspect-[5/7] rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-950 shadow-xl flex items-center justify-center">
                      <div
                        role="img"
                        aria-label={topMeta.nameVi}
                        className="w-full h-full"
                        style={topSpriteStyle}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5 text-left">
                      <p className="text-sm font-extrabold text-white">
                        {topMeta.nameVi}
                      </p>
                      <p className="text-[11px] font-semibold text-amber-300/90">
                        {topMeta.subtitleVi}
                      </p>
                      <p className="text-xs text-slate-200 leading-relaxed rounded-lg border border-slate-800 bg-slate-950/80 p-2.5">
                        {topMeta.ruleVi}
                      </p>
                    </div>
                  </div>

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
                    {ikView.pendingDigDeeper!.hasSecondCard && (
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
                        Bỏ Qua & Đào Lá #2!
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

        {/* 7.5. COMBO 2 OPPONENT CARD PICKER MODAL */}
        {!isLobby &&
          ikView?.step === "Combo2PickStep" &&
          ikView.pendingCombo2Pick &&
          (ikView.pendingCombo2Pick.actorSeatNo === snapshot?.viewerSeatNo ? (
            <div className="absolute inset-0 z-30 bg-slate-950/78 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
              <div className="w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-2xl border border-sky-400/60 bg-slate-900/95 p-4 sm:p-5 shadow-2xl space-y-3 text-center">
                <div className="space-y-1">
                  <p className="text-sm sm:text-base font-extrabold text-sky-300">
                    Combo 2 Lá — Chọn 1 Lá Bài Của{" "}
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
                    const cardSpriteStyle = markedCard
                      ? getIkCardSpriteBgStyle(markedCard.type, markedCard.id)
                      : getIkCardSpriteBgStyle("back");

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
                        className="group relative w-16 [@media(min-width:420px)]:w-20 sm:w-24 aspect-[5/7] rounded-xl overflow-hidden border-2 border-slate-700 hover:border-amber-400 bg-slate-950 shadow-lg hover:shadow-amber-500/30 transition-all duration-150 hover:-translate-y-2 cursor-pointer disabled:opacity-50"
                      >
                        <div
                          role="img"
                          aria-label={
                            markedMeta
                              ? markedMeta.nameVi
                              : `Lá úp #${idx + 1}`
                          }
                          className="w-full h-full"
                          style={cardSpriteStyle}
                        />
                        <span className="absolute bottom-1 inset-x-1 rounded bg-slate-950/85 px-1 py-0.5 text-[10px] font-extrabold text-amber-300 group-hover:bg-amber-400 group-hover:text-slate-950 transition">
                          {markedMeta
                            ? `${markedMeta.shortVi}`
                            : `Rút #${idx + 1}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute top-[calc(var(--ik-opp-bottom,120px)+6px)] left-1/2 -translate-x-1/2 z-30 w-full max-w-[min(94vw,28rem)] px-2">
              <div className="rounded-2xl border border-sky-400/60 bg-slate-950/95 p-3.5 shadow-2xl text-center">
                <p className="text-xs font-extrabold text-sky-300">
                  Đang chờ{" "}
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
            <div className="absolute top-[calc(var(--ik-opp-bottom,120px)+6px)] left-1/2 -translate-x-1/2 z-30 w-full max-w-[min(94vw,28rem)] px-2">
              <div className="rounded-2xl border border-amber-400/70 bg-slate-950/95 p-3.5 shadow-2xl text-center">
                <p className="text-xs font-extrabold text-amber-300">
                  {ikView.step === "FavorGiveStep"
                    ? "Hãy bấm chọn 1 lá bài trên tay bạn ở dưới đáy màn hình để đưa cho đối thủ (Favor)!"
                    : ikView.pendingGroupSubmit?.mode === "GARBAGE_COLLECTION"
                      ? "Thu Gom Rác: Hãy bấm chọn 1 lá bài trên tay bạn để trả vào Bộ bài rút!"
                      : "Góp Bài (Potluck): Hãy bấm chọn 1 lá bài trên tay bạn để đặt lên Đỉnh Bộ bài rút!"}
                </p>
              </div>
            </div>
          )}

        {/* 8.5. ARMAGEDDON SHOWDOWN MODAL (GOOD VS. EVIL) */}
        {!isLobby &&
          ikView?.step === "ArmageddonStep" &&
          ikView.pendingArmageddon &&
          (() => {
            const pa = ikView.pendingArmageddon!;
            const isActor = pa.actorSeatNo === snapshot?.viewerSeatNo;
            const isTarget = pa.targetSeatNo === snapshot?.viewerSeatNo;
            const godcatStyle = getIkCardSpriteBgStyle("godcat", "godcat-preview");
            const devilcatStyle = getIkCardSpriteBgStyle(
              "devilcat",
              "devilcat-preview"
            );
            const cardBackStyle = getIkCardSpriteBgStyle("back");

            if (pa.stage === "ACTOR_PLACE" && isActor) {
              return (
                <div className="absolute inset-0 z-30 bg-slate-950/82 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
                  <div className="w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-2xl border border-amber-400/70 bg-slate-900/95 p-4 sm:p-5 shadow-2xl space-y-3.5 text-center">
                    <div>
                      <p className="text-sm sm:text-base font-extrabold text-amber-300">
                        Tận Thế (Armageddon) — Đấu Trí Với{" "}
                        <span className="text-rose-300">
                          {pa.targetDisplayName}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-300 mt-1">
                        Chỉ riêng bạn biết vị trí 2 lá! Hãy đặt úp 1 lá cho mình
                        và 1 lá cho {pa.targetDisplayName} — sau đó đối thủ sẽ
                        đoán để chọn GIỮ hoặc ĐỔI!
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-yellow-400/50 bg-yellow-950/35 p-2.5 flex flex-col items-center gap-1.5">
                        <div className="w-20 sm:w-24 aspect-[5/7] rounded-lg overflow-hidden border border-yellow-400/60 bg-slate-950">
                          <div
                            role="img"
                            aria-label="Godcat"
                            className="w-full h-full"
                            style={godcatStyle}
                          />
                        </div>
                        <p className="text-xs font-extrabold text-yellow-300">
                          Mèo Thần (Godcat)
                        </p>
                        <p className="text-[10px] text-slate-300">
                          Cầm về tay • Hóa mọi lá (trừ Nope)
                        </p>
                      </div>

                      <div className="rounded-xl border border-rose-500/50 bg-rose-950/35 p-2.5 flex flex-col items-center gap-1.5">
                        <div className="w-20 sm:w-24 aspect-[5/7] rounded-lg overflow-hidden border border-rose-500/60 bg-slate-950">
                          <div
                            role="img"
                            aria-label="Devilcat"
                            className="w-full h-full"
                            style={devilcatStyle}
                          />
                        </div>
                        <p className="text-xs font-extrabold text-rose-300">
                          Mèo Quỷ (Devilcat)
                        </p>
                        <p className="text-[10px] text-slate-300">
                          Nổ ngay lập tức (phải Defuse!)
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          sendRoomAction({
                            type: "MATCH_COMMAND",
                            command: {
                              type: "ARMAGEDDON_PLACE",
                              giveGodcatToTarget: false,
                            },
                          })
                        }
                        className="rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 px-3 py-2.5 text-xs font-extrabold text-slate-950 shadow cursor-pointer"
                      >
                        Giữ Mèo Thần • Đẩy Mèo Quỷ cho{" "}
                        {pa.targetDisplayName}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          sendRoomAction({
                            type: "MATCH_COMMAND",
                            command: {
                              type: "ARMAGEDDON_PLACE",
                              giveGodcatToTarget: true,
                            },
                          })
                        }
                        className="rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 px-3 py-2.5 text-xs font-extrabold text-white shadow cursor-pointer"
                      >
                        Cú Lừa Tâm Lý! Đặt Mèo Thần cho{" "}
                        {pa.targetDisplayName}
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            if (pa.stage === "TARGET_CHOOSE" && isTarget) {
              return (
                <div className="absolute inset-0 z-30 bg-slate-950/82 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
                  <div className="w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-2xl border border-rose-500/70 bg-slate-900/95 p-4 sm:p-5 shadow-2xl space-y-3.5 text-center">
                    <div>
                      <p className="text-sm sm:text-base font-extrabold text-rose-300">
                        Tận Thế (Armageddon) — Đến Lượt Bạn Chọn!
                      </p>
                      <p className="text-xs text-slate-300 mt-1">
                        <strong className="text-amber-300">
                          {pa.actorDisplayName}
                        </strong>{" "}
                        đã đặt úp 1 lá trước mặt bạn và 1 lá trước mặt họ (1 lá
                        là Mèo Thần, 1 lá là Mèo Quỷ). Bạn chọn GIỮ hay
                        ĐỔI?
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-6 py-1">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-20 aspect-[5/7] rounded-xl overflow-hidden border-2 border-amber-400/70 bg-slate-950 shadow-lg">
                          <div
                            role="img"
                            aria-label="Lá của bạn"
                            className="w-full h-full"
                            style={cardBackStyle}
                          />
                        </div>
                        <span className="text-[11px] font-extrabold text-amber-300">
                          Lá Trước Mặt Bạn
                        </span>
                      </div>
                      <span className="text-xl font-black text-slate-400">
                        ⇄
                      </span>
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-20 aspect-[5/7] rounded-xl overflow-hidden border-2 border-rose-400/70 bg-slate-950 shadow-lg">
                          <div
                            role="img"
                            aria-label="Lá của đối thủ"
                            className="w-full h-full"
                            style={cardBackStyle}
                          />
                        </div>
                        <span className="text-[11px] font-extrabold text-rose-300">
                          Lá Của {pa.actorDisplayName}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          sendRoomAction({
                            type: "MATCH_COMMAND",
                            command: { type: "ARMAGEDDON_DECIDE", swap: false },
                          })
                        }
                        className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3 py-2.5 text-xs font-extrabold text-slate-950 shadow cursor-pointer"
                      >
                        GIỮ Lá Của Mình
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          sendRoomAction({
                            type: "MATCH_COMMAND",
                            command: { type: "ARMAGEDDON_DECIDE", swap: true },
                          })
                        }
                        className="rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-2.5 text-xs font-extrabold text-slate-950 shadow cursor-pointer"
                      >
                        ĐỔI Với {pa.actorDisplayName}
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="absolute top-[calc(var(--ik-opp-bottom,120px)+6px)] left-1/2 -translate-x-1/2 z-30 w-full max-w-[min(94vw,28rem)] px-2">
                <div className="rounded-2xl border border-amber-400/65 bg-slate-950/95 p-3.5 shadow-2xl text-center">
                  <p className="text-xs font-extrabold text-amber-300">
                    {pa.stage === "ACTOR_PLACE"
                      ? `Tận Thế! Đang chờ ${pa.actorDisplayName} đặt úp Mèo Thần & Mèo Quỷ trước mặt ${pa.targetDisplayName}...`
                      : `Tận Thế! Đang chờ ${pa.targetDisplayName} cân não chọn GIỮ hay ĐỔI bài với ${pa.actorDisplayName}...`}
                  </p>
                </div>
              </div>
            );
          })()}

        {/* 8.6. RAISING HECK MODAL (GOOD VS. EVIL) */}
        {!isLobby &&
          ikView?.step === "RaisingHeckStep" &&
          ikView.pendingRaisingHeck &&
          (ikView.pendingRaisingHeck.seatNo === snapshot?.viewerSeatNo &&
          ikView.pendingRaisingHeck.bottomCard ? (
            (() => {
              const bottomCard = ikView.pendingRaisingHeck!.bottomCard!;
              const bottomMeta = IK_CARD_META[bottomCard.type];
              const bottomSpriteStyle = getIkCardSpriteBgStyle(
                bottomCard.type,
                bottomCard.id
              );
              const isBomb = bottomMeta.category === "bomb";

              return (
                <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
                  <div className="w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-2xl border border-orange-500/70 bg-slate-900/95 p-4 sm:p-5 shadow-2xl space-y-3.5">
                    <p className="text-sm font-extrabold text-orange-300 text-center">
                      Quậy Tưng Bừng (Raising Heck) — Lá Dưới ĐÁY Bộ Bài
                    </p>

                    <div className="flex flex-col [@media(min-width:440px)]:flex-row items-center [@media(min-width:440px)]:items-start gap-3">
                      <div className="shrink-0 w-24 [@media(max-height:460px)]:w-20 sm:w-32 aspect-[5/7] rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-950 shadow-xl flex items-center justify-center">
                        <div
                          role="img"
                          aria-label={bottomMeta.nameVi}
                          className="w-full h-full"
                          style={bottomSpriteStyle}
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5 text-left">
                        <p className="text-sm font-extrabold text-white">
                          {bottomMeta.nameVi}
                        </p>
                        <p className="text-[11px] font-semibold text-orange-300/90">
                          {bottomMeta.subtitleVi}
                        </p>
                        <p className="text-xs text-slate-200 leading-relaxed rounded-lg border border-slate-800 bg-slate-950/80 p-2.5">
                          {bottomMeta.ruleVi}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          sendRoomAction({
                            type: "MATCH_COMMAND",
                            command: {
                              type: "RAISING_HECK_DECIDE",
                              takeToHand: true,
                            },
                          })
                        }
                        className={`rounded-xl px-3 py-2.5 text-xs font-extrabold cursor-pointer ${
                          isBomb
                            ? "bg-rose-600 hover:bg-rose-500 text-white"
                            : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                        }`}
                      >
                        {isBomb
                          ? "Rút Bom Này Về Tay"
                          : "Lấy Lá Này Về Tay"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          sendRoomAction({
                            type: "MATCH_COMMAND",
                            command: {
                              type: "RAISING_HECK_DECIDE",
                              takeToHand: false,
                            },
                          })
                        }
                        className="rounded-xl bg-orange-500 hover:bg-orange-400 px-3 py-2.5 text-xs font-extrabold text-slate-950 cursor-pointer"
                      >
                        Đặt Lên ĐỈNH Bộ Bài!
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="absolute top-[calc(var(--ik-opp-bottom,120px)+6px)] left-1/2 -translate-x-1/2 z-30 w-full max-w-[min(94vw,28rem)] px-2">
              <div className="rounded-2xl border border-orange-500/60 bg-slate-950/95 p-3.5 shadow-2xl text-center">
                <p className="text-xs font-extrabold text-orange-300">
                  Đang chờ{" "}
                  {ikView.seats.find(
                    (s) => s.seatNo === ikView.pendingRaisingHeck?.seatNo
                  )?.displayName ?? "đối thủ"}{" "}
                  xem lá dưới Đáy Bộ bài (Raising Heck)...
                </p>
              </div>
            </div>
          ))}

        {/* 9. FINISHED REMATCH OVERLAY */}
        {!isLobby && ikView?.step === "Finished" && (
          <div className="absolute top-[calc(var(--ik-opp-bottom,120px)+6px)] left-1/2 -translate-x-1/2 z-30 w-full max-w-[min(94vw,28rem)] px-2">
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
                  Chơi Ván Mới (Về Sảnh)
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
    good_vs_evil: snapshot?.room.config?.expansions?.good_vs_evil ?? true,
  };
  const customExplodingCount: number | null =
    typeof snapshot?.room.config?.explodingKittenCount === "number"
      ? snapshot.room.config.explodingKittenCount
      : null;
  const autoExplodingCount = getDefaultExplodingKittenCount(
    expansions,
    snapshot?.seats.length ?? 2
  );
  const effectiveExplodingCount = customExplodingCount ?? autoExplodingCount;
  const canEdit = Boolean(isLobby && snapshot?.isHost && !busy);

  const updateBombCount = (nextCount: number | null) => {
    const clamped =
      nextCount === null
        ? null
        : Math.max(
            IK_MIN_EXPLODING_KITTENS,
            Math.min(IK_MAX_EXPLODING_KITTENS, nextCount)
          );
    void sendRoomAction({
      type: "UPDATE_CONFIG",
      config: {
        ...snapshot?.room.config,
        expansions,
        explodingKittenCount: clamped,
      },
    });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-rose-500/35 bg-rose-950/20 p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-bold text-rose-200 text-xs">
              💣 Số Lá Mèo Nổ (Exploding Kittens)
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Hiện tại: <strong className="text-rose-200">{effectiveExplodingCount} Mèo Nổ</strong>
              {expansions.imploding ? " + 1 Mèo Hố Đen" : ""} (
              {customExplodingCount === null ? "Tự động theo luật chuẩn" : "Chủ phòng tùy chỉnh"})
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={!canEdit || customExplodingCount === null}
              onClick={() => updateBombCount(null)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-extrabold transition ${
                customExplodingCount === null
                  ? "border-amber-400/70 bg-amber-500/20 text-amber-200"
                  : "border-slate-700 bg-slate-900/80 text-slate-300 hover:border-amber-400/60"
              } ${canEdit && customExplodingCount !== null ? "cursor-pointer" : "cursor-default"}`}
            >
              Tự động ({autoExplodingCount})
            </button>
            <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900/90 overflow-hidden">
              <button
                type="button"
                aria-label="Giảm số lá Mèo Nổ"
                disabled={!canEdit || effectiveExplodingCount <= IK_MIN_EXPLODING_KITTENS}
                onClick={() => updateBombCount(effectiveExplodingCount - 1)}
                className="px-2.5 py-1 text-xs font-black text-rose-300 hover:bg-rose-500/20 disabled:opacity-35 cursor-pointer"
              >
                −
              </button>
              <span className="min-w-[32px] text-center text-xs font-mono font-extrabold text-white px-1">
                {effectiveExplodingCount}
              </span>
              <button
                type="button"
                aria-label="Tăng số lá Mèo Nổ"
                disabled={!canEdit || effectiveExplodingCount >= IK_MAX_EXPLODING_KITTENS}
                onClick={() => updateBombCount(effectiveExplodingCount + 1)}
                className="px-2.5 py-1 text-xs font-black text-rose-300 hover:bg-rose-500/20 disabled:opacity-35 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

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
          • <strong>Mèo Nổ (Exploding Kitten)</strong>: Rút phải sẽ bị nổ tung
          trừ khi dùng 1 lá <strong>Tháo Ngòi (Defuse)</strong> để bí mật cài
          lại vào Bộ bài rút (hoặc giữ kín trên tay nếu bạn đang cầm lá{" "}
          <strong>Mèo Chạy Rông / Streaking Kitten</strong>).
        </p>
        <p>
          • <strong>Mèo Hố Đen (Imploding Kitten)</strong>:
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
          • <strong>Combo 2 Lá Cùng Loại</strong> (hoặc Lá Mèo +{" "}
          <strong>Mèo Hoang</strong>): Cướp ngẫu nhiên 1 lá bài từ tay đối
          thủ.
        </p>
        <p>
          • <strong>Combo 3 Lá Cùng Loại</strong>: Chỉ định tên 1 loại lá bài
          (VD: <em>Defuse, Super Skip, Catomic Bomb...</em>) để tịch thu từ tay
          đối thủ nếu họ có.
        </p>
        <p>
          • <strong>Combo 5 Lá Khác Nhau</strong>: Chọn lấy lại bất kỳ 1 lá
          bài nào từ Chồng bài bỏ (Discard Pile) về tay.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
        <p className="font-bold text-yellow-300 text-xs">
          3. Gói Mở Rộng Good vs. Evil (Thiện &amp; Ác)
        </p>
        <p>
          • <strong>Tận Thế (Armageddon)</strong>: Chỉ đánh được khi cả{" "}
          <strong>Mèo Thần (Godcat)</strong> và{" "}
          <strong>Mèo Quỷ (Devilcat)</strong> đang ở trên Thảm đấu. Người
          đánh bí mật đặt úp 2 lá cho mình và 1 đối thủ; đối thủ chọn{" "}
          <strong>GIỮ</strong> hoặc <strong>ĐỔI</strong> rồi lật bài — ai nhận{" "}
          <strong>Mèo Thần</strong> cầm về tay, ai nhận{" "}
          <strong>Mèo Quỷ</strong> phát nổ ngay trừ khi đốt Defuse!
        </p>
        <p>
          • <strong>Mèo Thần (Godcat)</strong>: Biến hóa thành mọi lá Hành
          Động (trừ <em>Nope</em>) hoặc tự động dùng làm <em>Defuse</em> khẩn
          cấp, sau đó quay trở lại Thảm đấu.
        </p>
        <p>
          • <strong>Quậy Tưng Bừng (Raising Heck)</strong>: Xem bí mật lá
          dưới Đáy Bộ bài, chọn lấy về tay hoặc đặt thẳng lên Đỉnh Bộ bài để kết
          thúc lượt.
        </p>
        <p>
          • <strong>Tiết Lộ Tương Lai 3x (Reveal the Future)</strong>: Lật
          công khai 3 lá trên cùng Bộ bài cho cả bàn cùng xem!
        </p>
      </div>
    </div>
  );
}
