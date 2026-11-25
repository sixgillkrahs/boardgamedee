"use client";

import React, { useEffect, useState } from "react";
import { HeatCanvas } from "@/components/heat-canvas";
import {
  HEAT_CAR_COLORS,
  HEAT_TRACK_IDS,
  HEAT_TRACKS,
  type HeatPlayerView,
  type HeatTrackId,
} from "@/cartridges/heat";
import type { GameConfigModalProps, GameRoomModuleProps } from "./types";

export function HeatRoom({
  snapshot,
  isLobby,
  busy,
  isExpanded,
  sendRoomAction,
}: GameRoomModuleProps) {
  const heatView: HeatPlayerView | null =
    snapshot?.playerView ? (snapshot.playerView as HeatPlayerView) : null;

  const mySeat = heatView?.seats.find(
    (s) => s.seatNo === snapshot?.viewerSeatNo
  );

  const [selectedGear, setSelectedGear] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [discardCardIds, setDiscardCardIds] = useState<string[]>([]);

  // Sync default selectedGear with player's actual gear whenever a new round starts
  useEffect(() => {
    if (mySeat) {
      setSelectedGear(mySeat.gear);
      setSelectedCardIds([]);
      setDiscardCardIds([]);
    }
  }, [heatView?.roundNumber, heatView?.step, mySeat?.gear]);

  const lobbyTrackId: HeatTrackId =
    snapshot?.room.config?.trackId &&
    snapshot.room.config.trackId in HEAT_TRACKS
      ? (snapshot.room.config.trackId as HeatTrackId)
      : "usa";

  const playableHandCards =
    heatView?.myHand.filter((c) => c.kind !== "heat") ?? [];

  const handleSelectGear = (gear: 1 | 2 | 3 | 4) => {
    setSelectedGear(gear);
    const maxAllow = Math.min(gear, playableHandCards.length);
    if (selectedCardIds.length > maxAllow) {
      setSelectedCardIds((prev) => prev.slice(0, maxAllow));
    }
  };

  const handleTogglePlanCard = (cardId: string) => {
    setSelectedCardIds((prev) => {
      if (prev.includes(cardId)) {
        return prev.filter((id) => id !== cardId);
      }
      const maxAllow = Math.min(selectedGear, playableHandCards.length);
      if (prev.length >= maxAllow) {
        return [...prev.slice(1), cardId];
      }
      return [...prev, cardId];
    });
  };

  const handleToggleDiscardCard = (cardId: string) => {
    setDiscardCardIds((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    );
  };

  return (
    <main className="relative flex-1 flex flex-col w-full p-1 sm:p-1.5">
      <div
        className={`relative w-full ${
          isLobby || !heatView
            ? `${isExpanded ? "h-[calc(100dvh-8px)]" : "h-[calc(100dvh-52px)]"} min-h-[280px]`
            : "h-[1260px] sm:h-[1340px]"
        }`}
      >
        <HeatCanvas
          mode={isLobby ? "lobby" : "match"}
          lobbySeats={snapshot?.seats ?? []}
          lobbyTrackId={lobbyTrackId}
          viewerSeatNo={snapshot?.viewerSeatNo ?? null}
          isHost={Boolean(snapshot?.isHost)}
          busy={busy}
          playerView={heatView}
          selectedGear={selectedGear}
          selectedCardIds={selectedCardIds}
          discardCardIds={discardCardIds}
          onSelectGear={handleSelectGear}
          onToggleCard={handleTogglePlanCard}
          onToggleDiscardCard={handleToggleDiscardCard}
          onDispatchCommand={(cmd) =>
            void sendRoomAction({ type: "MATCH_COMMAND", command: cmd })
          }
          onRematch={() => void sendRoomAction({ type: "REMATCH" })}
        />

        {/* Floating Compact Lobby Overlay (disappears once Match starts so Track + Player Mat get 100% of screen!) */}
        {(isLobby || !heatView) && snapshot && (
          <div className="absolute inset-x-0 bottom-3 sm:bottom-5 z-20 flex flex-col items-center pointer-events-none px-3">
            <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-amber-400/45 bg-slate-950/88 backdrop-blur-md p-3.5 shadow-2xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                    🏁 Sảnh Chờ Heat: Pedal to the Metal ({snapshot.seats.length}
                    /6 Tay Đua)
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {snapshot.configValidation.valid
                      ? "✓ Đã đủ tay đua, Chủ phòng có thể chọn bản đồ và bấm Bắt đầu!"
                      : snapshot.configValidation.error}
                  </p>
                </div>

                {/* Quick Track Pills for Host */}
                <div className="flex items-center gap-1.5">
                  {HEAT_TRACK_IDS.map((tId) => {
                    const t = HEAT_TRACKS[tId];
                    const active = lobbyTrackId === tId;
                    return (
                      <button
                        key={tId}
                        type="button"
                        disabled={busy || !snapshot.isHost}
                        onClick={() =>
                          sendRoomAction({
                            type: "UPDATE_CONFIG",
                            config: {
                              ...snapshot.room.config,
                              trackId: tId,
                            },
                          })
                        }
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-extrabold transition ${
                          active
                            ? "border-amber-400 bg-amber-500 text-slate-950 shadow"
                            : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                        } ${snapshot.isHost ? "cursor-pointer" : "cursor-default"}`}
                      >
                        {t.shortNameVi} (🔥{t.startingHeat})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seated Drivers Grid with Remove Bot / Kick controls */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {snapshot.seats.map((seat, idx) => {
                  const colorSpec =
                    HEAT_CAR_COLORS[idx % HEAT_CAR_COLORS.length];
                  const isRoomHost = seat.actorId === snapshot.room.hostActorId;
                  const canRemove = snapshot.isHost && !isRoomHost;
                  return (
                    <div
                      key={seat.seatNo}
                      className="flex items-center justify-between gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-2.5 py-1.5"
                    >
                      <div className="min-w-0 flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: colorSpec.primaryHex }}
                        />
                        <span className="text-xs font-bold text-slate-100 truncate">
                          {seat.displayName}
                        </span>
                        {isRoomHost && (
                          <span className="text-[10px] text-amber-300">👑</span>
                        )}
                      </div>
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
                          className="shrink-0 rounded bg-slate-800 hover:bg-rose-500/25 border border-slate-700 hover:border-rose-500/50 px-1.5 py-0.5 text-[10px] font-bold text-slate-300 hover:text-rose-200 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Lobby Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                {snapshot.isHost ? (
                  <>
                    {snapshot.seats.length < 6 && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => sendRoomAction({ type: "ADD_BOT" })}
                        className="rounded-xl border border-sky-500/45 bg-sky-500/15 hover:bg-sky-500/25 px-3.5 py-2 text-xs font-bold text-sky-200 transition cursor-pointer disabled:opacity-40"
                      >
                        🤖 + Thêm Tay Đua Bot
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy || !snapshot.configValidation.valid}
                      onClick={() => sendRoomAction({ type: "START_MATCH" })}
                      className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-5 py-2 text-xs font-extrabold text-slate-950 shadow-lg transition cursor-pointer disabled:opacity-40"
                    >
                      🔥 BẮT ĐẦU CHẶNG ĐUA
                    </button>
                  </>
                ) : snapshot.viewerSeatNo === null ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => sendRoomAction({ type: "JOIN" })}
                    className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-extrabold text-slate-950 transition cursor-pointer"
                  >
                    🪑 Ngồi Vào Xe Đua
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Đang chờ Chủ phòng phát lệnh xuất phát...
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export function HeatConfigContent({
  snapshot,
  isLobby,
  busy,
  sendRoomAction,
}: GameConfigModalProps) {
  const currentTrackId: HeatTrackId =
    snapshot?.room.config?.trackId &&
    snapshot.room.config.trackId in HEAT_TRACKS
      ? (snapshot.room.config.trackId as HeatTrackId)
      : "usa";
  const currentLaps = Number(snapshot?.room.config?.laps ?? 2);

  return (
    <div className="space-y-3">
      {/* Track Selector */}
      <div className="rounded-xl border border-amber-500/35 bg-slate-950/70 p-3 space-y-2">
        <p className="font-bold text-amber-300">
          1. Chọn Bản Đồ Đường Đua (Host Configurable)
        </p>
        <div className="space-y-2">
          {HEAT_TRACK_IDS.map((tId) => {
            const t = HEAT_TRACKS[tId];
            const selected = currentTrackId === tId;
            return (
              <button
                key={tId}
                type="button"
                disabled={!isLobby || !snapshot?.isHost || busy}
                onClick={() =>
                  sendRoomAction({
                    type: "UPDATE_CONFIG",
                    config: {
                      ...snapshot?.room.config,
                      trackId: tId,
                    },
                  })
                }
                className={`w-full rounded-xl border p-3 text-left transition ${
                  selected
                    ? "border-amber-400 bg-amber-500/15 text-white"
                    : "border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700"
                } ${isLobby && snapshot?.isHost ? "cursor-pointer" : "cursor-default"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-white">
                    {selected ? "✓ " : ""}
                    {t.nameVi}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-amber-300">
                    {t.totalSpaces} Ô • {t.corners.length} Cua • 🔥
                    {t.startingHeat} Heat
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {t.descriptionVi}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Number of Laps */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-bold text-sky-300">2. Số Vòng Đua (Laps)</p>
          <p className="text-[11px] text-slate-400">
            Mặc định 2 vòng theo luật chuẩn (có thể chọn 1–3 vòng)
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((lapOpt) => (
            <button
              key={lapOpt}
              type="button"
              disabled={!isLobby || !snapshot?.isHost || busy}
              onClick={() =>
                sendRoomAction({
                  type: "UPDATE_CONFIG",
                  config: {
                    ...snapshot?.room.config,
                    laps: lapOpt,
                  },
                })
              }
              className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-extrabold transition ${
                currentLaps === lapOpt
                  ? "border-sky-400 bg-sky-500 text-slate-950"
                  : "border-slate-700 bg-slate-900 text-slate-300"
              } ${isLobby && snapshot?.isHost ? "cursor-pointer" : "cursor-default"}`}
            >
              {lapOpt} Vòng
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HeatRulesContent() {
  return (
    <div className="space-y-3 text-slate-300 leading-relaxed">
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
        <p className="font-bold text-amber-300 text-xs">
          1. Hộp Số 4 Cấp, Động Cơ (Engine Heat) & Bộ Bài 7 Lá
        </p>
        <p>
          • <strong>Sang số (Bước 1)</strong>: Giữ nguyên số hoặc chuyển{" "}
          <strong>±1 số miễn phí</strong>. Chuyển nhảy cóc{" "}
          <strong>±2 số</strong> phải đốt <strong>1 lá Heat từ Động cơ</strong>{" "}
          sang chồng bài bỏ (Discard).
        </p>
        <p>
          • <strong>Đánh bài (Bước 2)</strong>: Đánh úp số lá bài trên tay đúng
          bằng Số (Gear 1–4) vừa chọn.{" "}
          <strong className="text-rose-400">
            Lá Heat khi bị rút lên tay sẽ làm kẹt tay bài
          </strong>{" "}
          — không thể đánh ra làm tốc độ và không thể tự bỏ ở bước Discard!
        </p>
        <p>
          • <strong>Lá Áp Lực (Stress +?)</strong>: Khi lật bài, mỗi lá Stress sẽ
          lật bài từ đỉnh Bộ bài rút cho đến khi trúng 1 lá Tốc độ cơ bản (1–4)
          để cộng vào tốc độ lượt đó.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
        <p className="font-bold text-sky-300 text-xs">
          2. Làm Mát (Cooldown), Tăng Tốc (Boost), Adrenaline & Núp Gió
          (Slipstream)
        </p>
        <p>
          • <strong>❄️ Làm Mát (Cooldown)</strong>: Ở <strong>Số 1</strong> bạn
          có <strong>3 điểm Làm Mát</strong>, ở <strong>Số 2</strong> có{" "}
          <strong>1 điểm Làm Mát</strong>. Mỗi điểm cho phép cất 1 lá Heat đang
          kẹt trên tay quay về lại Động cơ!
        </p>
        <p>
          • <strong>🚀 Boost (1 lần/lượt)</strong>: Đốt 1 Heat từ Động cơ để lật
          Bộ bài rút lấy thêm +1..+4 ô tốc độ (lưu ý: tốc độ Boost{" "}
          <strong>có cộng vào tốc độ kiểm tra góc cua</strong>).
        </p>
        <p>
          • <strong>⚡ Adrenaline</strong>: Xe đứng cuối đoàn đầu lượt được
          quyền đi thêm <strong>+1 ô</strong> và nhận thêm{" "}
          <strong>+1 điểm Làm Mát</strong>.
        </p>
        <p>
          • <strong>💨 Núp Gió (Slipstream)</strong>: Nếu kết thúc di chuyển ở
          ngang hàng (cùng ô) hoặc ngay sát sau đuôi (1 ô) một xe khác, bạn được
          lướt thêm <strong>+2 ô miễn phí</strong> mà{" "}
          <strong className="text-emerald-300">
            KHÔNG làm tăng tốc độ khi kiểm tra góc cua
          </strong>
          !
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
        <p className="font-bold text-rose-300 text-xs">
          3. Kiểm Tra Góc Cua (Corner Check), Văng Xe (Spin Out) & 3 Bản Đồ
        </p>
        <p>
          • Khi đi qua một <strong>Vạch Góc Cua</strong>, nếu{" "}
          <code>Tốc độ lượt &gt; Giới hạn góc cua</code>, bạn phải đốt số lá{" "}
          <strong>Heat từ Động cơ</strong> bằng phần tốc độ vượt quá.
        </p>
        <p>
          • <strong>💥 Văng Xe (Spin Out)</strong>: Nếu Động cơ không đủ Heat để
          trả khi vượt tốc qua cua, xe bị văng: mất hết Heat còn lại trong Động
          cơ, lùi xe về ngay trước vạch cua đó, tụt về <strong>Số 1</strong>, và
          nhận phạt <strong>+1 lá Stress</strong> (nếu đang Số 1–2) hoặc{" "}
          <strong>+2 lá Stress</strong> (nếu đang Số 3–4) thẳng lên tay!
        </p>
        <p>
          • <strong>3 Bản đồ tùy chọn</strong>: <strong>USA</strong> (69 ô, 4
          cua, 6 Heat), <strong>South Africa</strong> (71 ô, 7 cua, 7 Heat, dừng
          trên <strong>ô Sỏi Đá / Gravel</strong> cuối lượt tốn 1 Heat), và{" "}
          <strong>Deutschland</strong> (62 ô, 6 cua với cụm{" "}
          <strong>Cua Kép Chicane 2–2</strong> gờ xanh-trắng, 5 Heat).
        </p>
      </div>
    </div>
  );
}
