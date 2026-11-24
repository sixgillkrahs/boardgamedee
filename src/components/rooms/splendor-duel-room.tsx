"use client";

import React, { useEffect, useState } from "react";
import {
  DuelCardPreviewCanvas,
  DuelTokenIconCanvas,
  SplendorDuelCanvas,
  type DuelSelection,
} from "@/components/splendor-duel-canvas";
import {
  SPLENDOR_GEMS,
  type SplendorGemColor,
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
import {
  SharedLobbySidebar,
  SidebarDrawerButtons,
} from "./shared-lobby-sidebar";
import type { GameRoomModuleProps } from "./types";

export function SplendorDuelRoom({
  snapshot,
  isLobby,
  busy,
  sendRoomAction,
  setErrorMsg,
  onOpenDrawer,
}: GameRoomModuleProps) {
  const duelView: DuelPlayerView | null =
    snapshot?.playerView ? (snapshot.playerView as DuelPlayerView) : null;

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

    if (tok === "gold") {
      setDuelSelectedCells([]);
      setDuelGoldCell((prev) =>
        prev && prev[0] === row && prev[1] === col ? null : [row, col]
      );
      return;
    }

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
        return [[row, col]];
      }
      return candidate;
    });
  };

  return (
    <main className="relative flex-1 flex flex-col lg:flex-row w-full gap-2 sm:gap-2.5 p-2 sm:p-2.5">
      <div className="flex-1 relative h-[54vh] min-h-[380px] sm:h-[62vh] sm:min-h-[500px] lg:h-[calc(100vh-62px)] lg:min-h-[620px]">
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
      </div>

      <aside className="w-full lg:w-76 xl:w-84 lg:max-h-[calc(100vh-62px)] lg:overflow-y-auto shrink-0 rounded-2xl border border-slate-800 bg-slate-900/95 p-3 sm:p-4 shadow-xl flex flex-col justify-between gap-3 sm:gap-4">
        {isLobby || !duelView ? (
          <SharedLobbySidebar
            snapshot={snapshot}
            busy={busy}
            title={`Splendor Duel (${snapshot?.seats.length ?? 0}/2 người chơi)`}
            defaultRequirementHint="Cần đúng 2 người chơi (hoặc thêm 1 Bot) để bắt đầu Splendor Duel."
            sendRoomAction={sendRoomAction}
          />
        ) : (
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
            const isMyTurn = duelView.activeSeatNo === snapshot?.viewerSeatNo;

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
                  ? mySeat?.reservedCards[duelSelection.reservedIndex]?.card ??
                    null
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

                {/* Step 1: TurnActionStep */}
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
                          👉 Hãy bấm trực tiếp vào 1 viên Đá quý hoặc Ngọc Trai
                          bất kỳ trên bàn 5×5 (không chọn xu Vàng).
                        </p>
                      )}
                    </div>

                    {/* Mandatory Action 1: Take Line */}
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

                    {/* Mandatory Action 2 & 3: Buy / Reserve */}
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
                {duelView.step === "StealTokenStep" && isMyTurn && oppSeat && (
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

                {/* Step 5: DiscardTokensStep */}
                {duelView.step === "DiscardTokensStep" &&
                  isMyTurn &&
                  mySeat && (
                    <div className="space-y-2.5 rounded-xl border border-amber-500/40 bg-amber-950/20 p-3">
                      <p className="text-xs text-amber-200 font-semibold">
                        Bạn đang giữ {mySeat.totalTokens}/10 xu. Hãy trả vào túi
                        đúng {excessTokens} xu ({discardSum}/{excessTokens}):
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

export function SplendorDuelConfigContent() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-pink-500/30 bg-slate-950/60 p-3 space-y-1.5 text-slate-300">
        <p className="font-bold text-pink-300">
          Thiết lập chuẩn Splendor Duel (Đối kháng 1v1)
        </p>
        <p>
          • <strong>Bàn Xoắn Ốc 5×5 (25 xu)</strong>: 5 màu đá quý × 4 viên, 2
          Ngọc Trai (Pearl) và 3 xu Vàng (Gold).
        </p>
        <p>
          • <strong>67 Thẻ Trang Sức (Kim tự tháp 5 / 4 / 3)</strong>: Cấp I (30
          lá • 5 ô), Cấp II (24 lá • 4 ô), Cấp III (13 lá • 3 ô).
        </p>
        <p>
          • <strong>3 Cuộn Đặc Quyền & 4 Thẻ Hoàng Gia</strong>: Ghế 2 bắt đầu
          với 1 Cuộn Đặc Quyền để cân bằng lượt đi sau.
        </p>
        <p>
          • <strong>3 Điều Kiện Thắng Tức Thì</strong>: ≥ 20 Điểm Uy Tín, HOẶC ≥
          10 Vương Miện, HOẶC ≥ 10 Điểm cùng 1 màu đá quý.
        </p>
      </div>
    </div>
  );
}

export function SplendorDuelRulesContent() {
  return (
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
          • <strong>25 Xu trên bàn 5×5</strong>: 4 viên mỗi màu Đá quý (5 màu),{" "}
          <strong>2 Ngọc Trai (Pearl)</strong> quý hiếm (không có thẻ giảm giá)
          và <strong>3 xu Vàng</strong>.
        </p>
        <p>
          • <strong>Kim tự tháp 67 Thẻ Trang Sức</strong>: Cấp I (5 thẻ mở), Cấp
          II (4 thẻ mở), Cấp III (3 thẻ mở).{" "}
          <strong>Người đi sau (Ghế 2)</strong> khởi đầu với{" "}
          <strong>1 Cuộn Đặc Quyền (📜)</strong>.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 leading-relaxed text-slate-300">
        <p className="font-bold text-amber-300 text-xs">
          2. Hành Động Phụ (Tùy chọn trước khi đi hành động chính)
        </p>
        <p>
          • <strong>📜 Dùng Cuộn Đặc Quyền</strong>: Trả 1 Cuộn Đặc Quyền về kho
          để lấy ngay <strong>1 viên Đá quý hoặc Ngọc Trai</strong> bất kỳ trên
          bàn 5×5 (không lấy xu Vàng).
        </p>
        <p>
          • <strong>🌀 Nạp Lại Bàn 5×5</strong>: Đổ các xu từ Túi vào các ô
          trống theo chiều xoắn ốc từ tâm ra ngoài. Khi bạn nạp bàn,{" "}
          <strong>đối thủ nhận ngay 1 Cuộn Đặc Quyền</strong>!
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 leading-relaxed text-slate-300">
        <p className="font-bold text-emerald-300 text-xs">
          3. Ba Hành Động Chính (Bắt buộc chọn 1 hành động mỗi lượt)
        </p>
        <p>
          • <strong>Lấy 1–3 viên thẳng hàng</strong> (ngang, dọc hoặc chéo liền
          kề, không ô trống, không chứa xu Vàng). <em>Lưu ý</em>: Nếu bạn lấy{" "}
          <strong>3 viên cùng màu</strong> hoặc <strong>2 viên Ngọc Trai</strong>{" "}
          trong cùng 1 lần, đối thủ nhận ngay 1 Cuộn Đặc Quyền!
        </p>
        <p>
          • <strong>Đặt cọc (Reserve) 1 thẻ + Lấy 1 xu Vàng</strong>: Bắt buộc
          phải lấy được 1 xu Vàng đang nằm trên bàn 5×5 (tối đa giữ 3 thẻ đặt
          cọc).
        </p>
        <p>
          • <strong>Mua 1 Thẻ Trang Sức</strong> (từ Kim tự tháp hoặc kho đặt
          cọc). Xu đã chi sẽ quay về <strong>Túi</strong> (không tự xếp lại lên
          bàn).
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
          <strong>3 Vương Miện</strong> và <strong>6 Vương Miện</strong>, bạn
          được chọn miễn phí 1 trong 4 Thẻ Hoàng Gia (+điểm & kỹ năng).
        </p>
        <p>
          • <strong>Chiến Thắng Ngay Lập Tức (Không có vòng cuối)</strong>: Ván
          đấu kết thúc ngay lập tức khi có người đạt{" "}
          <strong>1 trong 3 điều kiện</strong>: (1) Tổng{" "}
          <strong>≥ 20 Điểm Uy Tín</strong>, HOẶC (2) Tổng{" "}
          <strong>≥ 10 Vương Miện</strong>, HOẶC (3){" "}
          <strong>≥ 10 Điểm Uy Tín trên cùng 1 màu đá quý</strong>!
        </p>
      </div>
    </>
  );
}
