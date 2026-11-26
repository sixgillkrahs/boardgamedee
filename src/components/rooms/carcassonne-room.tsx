"use client";

import React from "react";
import { CarcassonneCanvas } from "@/components/carcassonne-canvas";
import {
  CARCASSONNE_COLOR_META,
  CARCASSONNE_COLORS,
  type CarcassonneConfig,
  type CarcassonnePlayerView,
} from "@/cartridges/carcassonne";
import type { GameConfigModalProps, GameRoomModuleProps } from "./types";

export function CarcassonneRoom({
  snapshot,
  isLobby,
  busy,
  soundEnabled,
  isExpanded,
  sendRoomAction,
  onOpenDrawer,
}: GameRoomModuleProps) {
  const carcView: CarcassonnePlayerView | null = snapshot?.playerView
    ? (snapshot.playerView as CarcassonnePlayerView)
    : null;

  const showLobbyOverlay = isLobby || !carcView;
  const seats = snapshot?.seats ?? [];

  return (
    <main
      className={`relative flex-1 min-h-0 flex flex-col w-full overflow-hidden ${
        isExpanded ? "p-0" : "p-1.5 sm:p-2"
      }`}
    >
      <div
        className={`relative w-full ${
          isExpanded
            ? "flex-1 h-full min-h-0"
            : "h-[calc(100dvh-78px)] min-h-[320px]"
        }`}
      >
        <CarcassonneCanvas
          mode={showLobbyOverlay ? "lobby" : "match"}
          lobbySeats={seats}
          isHost={Boolean(snapshot?.isHost)}
          viewerSeatNo={snapshot?.viewerSeatNo ?? null}
          playerView={carcView}
          soundEnabled={soundEnabled}
          onRematch={() => {
            if (!snapshot?.isHost || busy) return;
            void sendRoomAction({ type: "REMATCH" });
          }}
          onDispatchCommand={(cmd) =>
            void sendRoomAction({ type: "MATCH_COMMAND", command: cmd })
          }
        />

        {showLobbyOverlay && snapshot && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-2.5 px-3 pb-3 sm:px-5 sm:pb-5">
            {/* Compact Player Seat Cards with Host Remove/Kick */}
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 max-w-4xl">
              {seats.map((seat, idx) => {
                const color =
                  CARCASSONNE_COLORS[idx % CARCASSONNE_COLORS.length];
                const meta = CARCASSONNE_COLOR_META[color];
                const isRoomHost = seat.actorId === snapshot.room.hostActorId;
                const canRemove = snapshot.isHost && !isRoomHost;
                return (
                  <div
                    key={seat.seatNo}
                    style={{ borderColor: meta.light }}
                    className="flex items-center gap-2 rounded-xl border bg-slate-950/85 backdrop-blur-md px-3 py-2 shadow-lg"
                  >
                    <span
                      style={{ backgroundColor: meta.fill }}
                      className="h-3 w-3 rounded-full ring-2 ring-white/60 shrink-0"
                    />
                    <span className="text-xs font-bold text-white max-w-[110px] truncate">
                      {seat.displayName}
                    </span>
                    {isRoomHost ? (
                      <span className="rounded bg-amber-500/20 border border-amber-400/40 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                        👑 Chủ
                      </span>
                    ) : seat.isBot ? (
                      <span className="rounded bg-sky-500/20 border border-sky-400/40 px-1.5 py-0.5 text-[9px] font-bold text-sky-300">
                        🤖 Bot
                      </span>
                    ) : (
                      <span
                        className={`h-2 w-2 rounded-full ${
                          seat.connected ? "bg-emerald-400" : "bg-slate-500"
                        }`}
                      />
                    )}
                    {canRemove && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void sendRoomAction({
                            type: "REMOVE_SEAT",
                            targetSeatNo: seat.seatNo,
                          })
                        }
                        title={
                          seat.isBot
                            ? `Xóa ${seat.displayName}`
                            : `Kick ${seat.displayName}`
                        }
                        className="ml-0.5 rounded-md bg-rose-500/20 hover:bg-rose-500/40 border border-rose-400/40 px-1.5 py-0.5 text-[10px] font-bold text-rose-200 transition cursor-pointer disabled:opacity-40"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Floating Glassmorphic Lobby Action Bar */}
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-slate-950/85 backdrop-blur-md px-3 py-2.5 shadow-2xl">
              <span className="px-2 text-[11px] font-bold text-slate-300">
                {seats.length}/5 người chơi
              </span>

              {snapshot.isHost && (
                <>
                  <button
                    type="button"
                    disabled={busy || seats.length >= 5}
                    onClick={() => void sendRoomAction({ type: "ADD_BOT" })}
                    className="rounded-xl border border-sky-400/45 bg-sky-500/20 hover:bg-sky-500/35 px-3.5 py-2 text-xs font-bold text-sky-100 transition cursor-pointer disabled:opacity-40"
                  >
                    🤖 + Thêm Bot
                  </button>
                  <button
                    type="button"
                    disabled={busy || !snapshot.configValidation.valid}
                    onClick={() => void sendRoomAction({ type: "START_MATCH" })}
                    className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 px-5 py-2 text-xs font-extrabold text-slate-950 shadow-lg transition cursor-pointer disabled:opacity-40"
                  >
                    🔥 BẮT ĐẦU VÁN ĐẤU
                  </button>
                </>
              )}

              {!snapshot.isHost && snapshot.viewerSeatNo === null && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void sendRoomAction({ type: "JOIN" })}
                  className="rounded-xl bg-amber-400 hover:bg-amber-300 px-4 py-2 text-xs font-extrabold text-slate-950 transition cursor-pointer disabled:opacity-40"
                >
                  🪑 Ngồi Vào Bàn
                </button>
              )}

              {!snapshot.isHost && snapshot.viewerSeatNo !== null && (
                <>
                  <span className="text-xs text-amber-200/90 italic px-1">
                    Chờ Chủ phòng bắt đầu…
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void sendRoomAction({ type: "LEAVE" })}
                    className="rounded-xl border border-slate-600 bg-slate-800/80 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition cursor-pointer disabled:opacity-40"
                  >
                    🚪 Rời Bàn
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => onOpenDrawer()}
                className="rounded-xl border border-amber-400/35 bg-slate-900/90 hover:bg-slate-800 px-3 py-2 text-xs font-bold text-amber-300 flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>💬 Chat</span>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-mono">
                  {snapshot.messages.length}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export function CarcassonneConfigContent({
  snapshot,
  isLobby,
  busy,
  sendRoomAction,
}: GameConfigModalProps) {
  const cfg = (snapshot?.room.config ?? {
    enableRiver: true,
    enableAbbot: true,
    enableFarmers: true,
  }) as CarcassonneConfig;

  const canEdit = Boolean(snapshot?.isHost && isLobby);

  const toggle = (key: keyof CarcassonneConfig) => {
    if (!canEdit || busy) return;
    void sendRoomAction({
      type: "UPDATE_CONFIG",
      config: { ...cfg, [key]: !cfg[key] },
    });
  };

  const rows: Array<{
    key: keyof CarcassonneConfig;
    title: string;
    desc: string;
    accent: string;
  }> = [
    {
      key: "enableRiver",
      title: "🌊 Bản mở rộng Sông (The River — 12 mảnh)",
      desc: "Bắt đầu ván đấu bằng 12 mảnh Sông (Đầu nguồn → Hồ cuối sông) trước khi rút 71 mảnh đất chính.",
      accent: "sky",
    },
    {
      key: "enableAbbot",
      title: "⛪ Tu viện trưởng & Vườn hoa (The Abbot)",
      desc: "Mỗi người thêm 1 Tu viện trưởng có thể đặt vào Tu viện hoặc Vườn hoa, và thu hồi sớm để ghi điểm ngay.",
      accent: "emerald",
    },
    {
      key: "enableFarmers",
      title: "🌾 Luật Nông dân (Fields / Farmers)",
      desc: "Đặt Meeple nằm ngang trên đồng cỏ để ghi +3 điểm cho mỗi Thành hoàn thành tiếp giáp cuối trận.",
      accent: "amber",
    },
  ];

  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const active = Boolean(cfg[r.key]);
        return (
          <div
            key={r.key}
            className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 flex items-center justify-between gap-3"
          >
            <div>
              <div className="font-bold text-white text-xs">{r.title}</div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                {r.desc}
              </p>
            </div>
            <button
              type="button"
              disabled={!canEdit || busy}
              onClick={() => toggle(r.key)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold border transition ${
                active
                  ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                  : "border-slate-700 bg-slate-800 text-slate-300"
              } ${canEdit ? "cursor-pointer" : "opacity-60"}`}
            >
              {active ? "Đang bật" : "Tắt"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function CarcassonneRulesContent() {
  return (
    <div className="space-y-4 text-slate-200 leading-relaxed">
      <section className="space-y-1.5">
        <h3 className="font-extrabold text-amber-300 text-sm">
          1. Tổng quan Carcassonne (Bản C3 • 2021)
        </h3>
        <p>
          2–5 người chơi lần lượt rút và ghép <strong>72 mảnh đất</strong> (kèm{" "}
          <strong>12 mảnh Sông</strong> và <strong>Tu viện trưởng</strong>) để
          kiến tạo vùng đất trung cổ miền Nam nước Pháp. Mỗi người có{" "}
          <strong>7 Meeple thường</strong> và <strong>1 Tu viện trưởng</strong>.
        </p>
      </section>

      <section className="space-y-1.5">
        <h3 className="font-extrabold text-sky-300 text-sm">
          2. Trình tự mỗi lượt chơi
        </h3>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            <strong>Đặt mảnh đất:</strong> Ghép mảnh vừa rút cạnh một mảnh đã
            có sao cho khớp 100% các cạnh (Thành nối Thành, Đường nối Đường,
            Đồng nối Đồng, Sông nối Sông và không ngoặt chữ U). Nhấn{" "}
            <code>R</code> / chuột phải hoặc nút <em>Xoay 90°</em> để xoay.
          </li>
          <li>
            <strong>Đặt Meeple (tùy chọn):</strong> Có thể đặt 1 Meeple vào khu
            vực trên mảnh vừa đặt nếu khu vực liên thông đó chưa có Meeple nào.
            Hoặc <strong>thu hồi Tu viện trưởng</strong> đang đứng trên bản đồ
            để ghi điểm ngay.
          </li>
          <li>
            <strong>Tính điểm công trình hoàn thành:</strong> Ngay khi Đường,
            Thành, Tu viện hoặc Vườn hoa hoàn thành, người có nhiều Meeple nhất
            (hòa cùng nhận trọn điểm) được cộng điểm và nhận lại Meeple về tay.
          </li>
        </ol>
      </section>

      <section className="space-y-1.5">
        <h3 className="font-extrabold text-emerald-300 text-sm">
          3. Bảng tính điểm chuẩn
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>🛣 Đường (Cướp đường):</strong> <strong>1 điểm/mảnh</strong>{" "}
            (cả khi hoàn thành lẫn cuối trận).
          </li>
          <li>
            <strong>🏰 Thành (Hiệp sĩ):</strong> Hoàn thành:{" "}
            <strong>2 điểm/mảnh + 2 điểm/Khiên</strong>. Cuối trận (chưa khép
            kín): <strong>1 điểm/mảnh + 1 điểm/Khiên</strong>.
          </li>
          <li>
            <strong>⛪ Tu viện & 🌸 Vườn hoa:</strong> Bao quanh đủ 8 ô xung
            quanh (3×3) = <strong>9 điểm</strong>. Cuối trận (hoặc khi thu hồi
            Tu viện trưởng) = <strong>1 + số ô kề xung quanh</strong> (1–9 điểm).
          </li>
          <li>
            <strong>🌾 Đồng cỏ (Nông dân — nằm ngang):</strong> Ở lại đến hết
            ván; cuối trận ghi <strong>+3 điểm cho mỗi Thành ĐÃ HOÀN THÀNH</strong>{" "}
            tiếp giáp với cánh đồng đó!
          </li>
        </ul>
      </section>
    </div>
  );
}
