"use client";

import React, { useEffect, useState } from "react";
import {
  SplendorCanvas,
  SplendorGemIconCanvas,
  type SplendorSelection,
} from "@/components/splendor-canvas";
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
  SharedLobbySidebar,
  SidebarDrawerButtons,
} from "./shared-lobby-sidebar";
import type { GameConfigModalProps, GameRoomModuleProps } from "./types";

export function SplendorRoom({
  snapshot,
  isLobby,
  busy,
  sendRoomAction,
  onOpenDrawer,
}: GameRoomModuleProps) {
  const splendorView: SplendorPlayerView | null =
    snapshot?.playerView ? (snapshot.playerView as SplendorPlayerView) : null;

  const [splendorSelectedGems, setSplendorSelectedGems] = useState<
    SplendorGemColor[]
  >([]);
  const [splendorSelection, setSplendorSelection] =
    useState<SplendorSelection>(null);
  const [splendorDiscardBag, setSplendorDiscardBag] =
    useState<TokenBag>(emptyTokenBag);

  useEffect(() => {
    setSplendorSelectedGems([]);
    setSplendorSelection(null);
    setSplendorDiscardBag(emptyTokenBag());
  }, [splendorView?.turnNumber, splendorView?.step]);

  const handleClickSplendorGem = (gem: SplendorGemColor) => {
    if (!splendorView || splendorView.step !== "TurnActionStep") return;
    if (splendorView.activeSeatNo !== snapshot?.viewerSeatNo) return;
    const supplyQty = splendorView.supply[gem];
    if (supplyQty <= 0) return;

    setSplendorSelection(null);
    setSplendorSelectedGems((prev) => {
      if (prev.length === 2 && prev[0] === gem && prev[1] === gem) {
        return [];
      }
      if (prev.length === 1 && prev[0] === gem) {
        return supplyQty >= 4 ? [gem, gem] : [];
      }
      if (prev.includes(gem)) {
        return prev.filter((g) => g !== gem);
      }
      if (prev.length === 2 && prev[0] === prev[1]) {
        return [gem];
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), gem];
      }
      return [...prev, gem];
    });
  };

  return (
    <main className="relative flex-1 flex flex-col lg:flex-row w-full gap-2 sm:gap-2.5 p-2 sm:p-2.5">
      <div className="flex-1 relative h-[54vh] min-h-[380px] sm:h-[62vh] sm:min-h-[500px] lg:h-[calc(100vh-62px)] lg:min-h-[620px]">
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
      </div>

      <aside className="w-full lg:w-76 xl:w-84 lg:max-h-[calc(100vh-62px)] lg:overflow-y-auto shrink-0 rounded-2xl border border-slate-800 bg-slate-900/95 p-3 sm:p-4 shadow-xl flex flex-col justify-between gap-3 sm:gap-4">
        {isLobby || !splendorView ? (
          <SharedLobbySidebar
            snapshot={snapshot}
            busy={busy}
            title={`Splendor (${snapshot?.seats.length ?? 0}/4 người chơi)`}
            defaultRequirementHint="Cần từ 2 đến 4 người chơi (hoặc thêm Bot) để bắt đầu Splendor."
            sendRoomAction={sendRoomAction}
          />
        ) : (
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
                {splendorView.step === "TurnActionStep" &&
                  isMyTurn &&
                  mySeat && (
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

                      {/* B. Selected Card or Deck Action Box */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950/65 p-2.5 space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                          2. Mua / Đặt Cọc Thẻ Đang Chọn
                        </span>

                        {splendorSelection?.kind === "deck" ? (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-200">
                              Đang chọn rút úp{" "}
                              <strong>
                                Chồng Cấp {splendorSelection.tier}
                              </strong>{" "}
                              (còn{" "}
                              {splendorView.deckCounts[splendorSelection.tier]}{" "}
                              lá).
                            </p>
                            <button
                              type="button"
                              disabled={
                                busy ||
                                mySeat.reservedCards.length >= 3 ||
                                splendorView.deckCounts[
                                  splendorSelection.tier
                                ] <= 0
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

                {/* Step 2: DiscardTokensStep */}
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
                                <SplendorGemIconCanvas color={col} size={18} />
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
                                      [col]: Math.min(held, (b[col] ?? 0) + 1),
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

export function SplendorConfigContent({
  snapshot,
  isLobby,
  sendRoomAction,
}: GameConfigModalProps) {
  return (
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
  );
}

export function SplendorRulesContent() {
  return (
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
          • <strong>Số xu Đá quý khởi đầu</strong>: 2 người (4 xu/màu), 3 người
          (5 xu/màu), 4 người (7 xu/màu) và luôn có{" "}
          <strong>5 xu Vàng (Joker)</strong>.
        </p>
        <p>
          • <strong>90 Thẻ Phát Triển (3 Cấp)</strong>: Cấp I (40 lá), Cấp II
          (30 lá), Cấp III (20 lá) — luôn lật ngửa 4 lá mỗi cấp. Mỗi lá đã mua
          mang lại <strong>1 đá quý thưởng vĩnh viễn</strong> (giảm giá trực
          tiếp cho mọi lần mua sau) và Điểm Uy Tín.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 leading-relaxed text-slate-300">
        <p className="font-bold text-amber-300 text-xs">
          2. Bốn Hành Động Trong Lượt (Chọn 1 hành động mỗi lượt)
        </p>
        <p>
          • <strong>Lấy 3 xu đá quý khác màu</strong> (không lấy xu Vàng; nếu
          kho còn dưới 3 màu thì lấy tối đa các màu còn lại).
        </p>
        <p>
          • <strong>Lấy 2 xu đá quý cùng màu</strong> (chỉ hợp lệ khi chồng màu
          đó trên bàn còn từ <strong>4 xu trở lên</strong>).
        </p>
        <p>
          • <strong>Đặt cọc (Reserve) 1 thẻ + nhận 1 xu Vàng</strong>: Chọn 1
          thẻ đang mở trên bàn hoặc rút úp 1 thẻ trên đỉnh chồng I/II/III. Mỗi
          người giữ tối đa <strong>3 thẻ đặt cọc</strong> (nếu kho hết xu Vàng
          vẫn được đặt cọc).
        </p>
        <p>
          • <strong>Mua 1 thẻ Phát Triển</strong> (từ bàn hoặc từ kho thẻ đã đặt
          cọc của bạn) bằng Điểm thưởng cố định + Xu đá quý + Xu Vàng (thay thế
          bất kỳ màu nào).
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 leading-relaxed text-slate-300">
        <p className="font-bold text-amber-300 text-xs">
          3. Giới Hạn 10 Xu, Quý Tộc & Phân Định Thắng Thua
        </p>
        <p>
          • <strong>Giới hạn 10 xu</strong>: Cuối lượt nếu cầm quá{" "}
          <strong>10 xu</strong> (tính cả xu Vàng), bạn phải trả lại xu thừa về
          kho cho đến khi còn đúng 10 xu.
        </p>
        <p>
          • <strong>Quý Tộc ghé thăm (+3 điểm)</strong>: Cuối lượt, nếu số{" "}
          <em>thẻ thưởng vĩnh viễn</em> của bạn đủ điều kiện của Quý Tộc, Quý
          Tộc tự động ghé thăm (không tính là hành động, tối đa{" "}
          <strong>1 Quý Tộc/lượt</strong> — nếu đủ điều kiện nhiều Quý Tộc cùng
          lúc thì bạn chọn 1).
        </p>
        <p>
          • <strong>Chạm mốc 15 điểm & Luật Hòa (Tie-breaker)</strong>: Khi có
          người đạt <strong>≥ 15 điểm Uy Tín</strong>, ván đấu chạy nốt hết vòng
          hiện tại để mọi người có số lượt bằng nhau. Ai nhiều điểm nhất thắng;
          nếu bằng điểm, người mua <strong>ít thẻ Phát Triển hơn</strong> sẽ
          thắng!
        </p>
      </div>
    </>
  );
}
