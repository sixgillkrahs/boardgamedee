"use client";

import React from "react";
import { KingOfTokyoDuelCanvas } from "@/components/king-of-tokyo-duel-canvas";
import {
  KOT_MONSTER_IDS,
  KOT_MONSTERS,
  type KotPlayerView,
} from "@/cartridges/king-of-tokyo-duel";
import type { GameConfigModalProps, GameRoomModuleProps } from "./types";

const KOT_HTML_INLINE_RE = /(\[!\]|⭐|🏢|⚡|❤️|♥|🐾|🎲)/g;

const KOT_HTML_ICON_SPRITE: Record<
  string,
  { url: string; bgPos: string; bgSize: string; label: string }
> = {
  "[!]": {
    url: "/sprites/kot-duel-dice-pixel.png",
    bgPos: "100% 100%",
    bgSize: "600% 200%",
    label: "Mặt Đặc Biệt",
  },
  "❤️": {
    url: "/sprites/kot-duel-icons-pixel.png",
    bgPos: "0% 0%",
    bgSize: "800% 100%",
    label: "Hồi Máu",
  },
  "♥": {
    url: "/sprites/kot-duel-icons-pixel.png",
    bgPos: "0% 0%",
    bgSize: "800% 100%",
    label: "Máu",
  },
  "⚡": {
    url: "/sprites/kot-duel-icons-pixel.png",
    bgPos: "14.2857% 0%",
    bgSize: "800% 100%",
    label: "Năng Lượng",
  },
  "🎲": {
    url: "/sprites/kot-duel-icons-pixel.png",
    bgPos: "28.5714% 0%",
    bgSize: "800% 100%",
    label: "Xúc Xắc",
  },
  "⭐": {
    url: "/sprites/kot-duel-icons-pixel.png",
    bgPos: "42.8571% 0%",
    bgSize: "800% 100%",
    label: "Danh Vọng",
  },
  "🏢": {
    url: "/sprites/kot-duel-icons-pixel.png",
    bgPos: "57.1429% 0%",
    bgSize: "800% 100%",
    label: "Phá Hủy",
  },
  "🐾": {
    url: "/sprites/kot-duel-icons-pixel.png",
    bgPos: "100% 0%",
    bgSize: "800% 100%",
    label: "Sát Thương",
  },
};

export function renderKotRichText(text: string): React.ReactNode {
  const parts = text.split(KOT_HTML_INLINE_RE);
  return parts.map((part, idx) => {
    const sp = KOT_HTML_ICON_SPRITE[part];
    if (!sp) return <React.Fragment key={idx}>{part}</React.Fragment>;
    return (
      <span
        key={idx}
        role="img"
        aria-label={sp.label}
        title={sp.label}
        className="inline-block align-middle mx-0.5 w-4 h-4 bg-no-repeat"
        style={{
          backgroundImage: `url(${sp.url})`,
          backgroundPosition: sp.bgPos,
          backgroundSize: sp.bgSize,
        }}
      />
    );
  });
}

export function KingOfTokyoDuelRoom({
  snapshot,
  isLobby,
  busy,
  soundEnabled,
  isExpanded,
  sendRoomAction,
}: GameRoomModuleProps) {
  const kotView: KotPlayerView | null =
    snapshot?.playerView ? (snapshot.playerView as KotPlayerView) : null;

  return (
    <main
      className={`relative flex-1 min-h-0 flex flex-col lg:flex-row w-full gap-1 ${
        isExpanded ? "p-0" : "p-1 sm:p-1.5"
      }`}
    >
      <div
        className={`flex-1 relative min-h-[280px] ${
          isExpanded
            ? "h-full"
            : "h-[calc(100dvh-50px)] [@media(max-height:500px)]:h-[calc(100dvh-44px)]"
        }`}
      >
        <KingOfTokyoDuelCanvas
          mode={isLobby ? "lobby" : "match"}
          lobbySeats={snapshot?.seats ?? []}
          viewerSeatNo={snapshot?.viewerSeatNo ?? null}
          playerView={kotView}
          soundEnabled={soundEnabled}
          onDispatchCommand={(cmd) =>
            void sendRoomAction({ type: "MATCH_COMMAND", command: cmd })
          }
        />

        {isLobby && snapshot && (
          <div className="absolute inset-x-0 bottom-5 sm:bottom-8 z-20 flex flex-col items-center pointer-events-none px-4">
            <div className="pointer-events-auto w-full max-w-md flex flex-col gap-3">
              {/* Single Player Roster Card with inline Remove Bot & Kick Player controls */}
              <div className="rounded-2xl border border-amber-400/45 bg-slate-950/82 backdrop-blur-md p-3.5 shadow-2xl space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                    Danh Sách Người Chơi
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold font-mono border ${
                      snapshot.seats.length >= 2
                        ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-300"
                        : "border-amber-400/50 bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    {snapshot.seats.length}/2
                  </span>
                </div>

                <div className="space-y-2">
                  {[0, 1].map((slotIdx) => {
                    const seat = snapshot.seats[slotIdx];
                    if (!seat) {
                      return (
                        <div
                          key={`empty-${slotIdx}`}
                          className="flex items-center gap-3 rounded-xl border border-dashed border-slate-700/70 bg-slate-900/50 px-3 py-2.5 text-xs text-slate-400"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 font-mono text-[11px] font-bold text-slate-500">
                            #{slotIdx + 1}
                          </span>
                          <span className="italic">
                            Đang chờ đối thủ vào phòng (hoặc thêm Bot)...
                          </span>
                        </div>
                      );
                    }

                    const isRoomHost =
                      seat.actorId === snapshot.room.hostActorId;
                    const isMe = seat.seatNo === snapshot.viewerSeatNo;
                    const canRemove = snapshot.isHost && !isRoomHost;

                    return (
                      <div
                        key={seat.seatNo}
                        className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 transition ${
                          isMe
                            ? "border-amber-400/60 bg-amber-500/12"
                            : "border-slate-700/70 bg-slate-900/80"
                        }`}
                      >
                        <div className="min-w-0 flex items-center gap-2.5">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-extrabold ${
                              isMe
                                ? "bg-amber-400 text-slate-950"
                                : seat.isBot
                                  ? "bg-sky-600 text-white"
                                  : "bg-slate-700 text-slate-100"
                            }`}
                          >
                            #{seat.seatNo}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-xs font-extrabold truncate ${
                                  isMe ? "text-amber-200" : "text-slate-100"
                                }`}
                              >
                                {seat.displayName}
                                {isMe ? " (BẠN)" : ""}
                              </span>
                              {isRoomHost ? (
                                <span className="shrink-0 rounded bg-amber-500/20 border border-amber-400/45 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                                  Chủ phòng
                                </span>
                              ) : seat.isBot ? (
                                <span className="shrink-0 rounded bg-sky-500/20 border border-sky-400/40 px-1.5 py-0.5 text-[9px] font-bold text-sky-300">
                                  Bot
                                </span>
                              ) : (
                                <span
                                  className={`h-2 w-2 rounded-full shrink-0 ${
                                    seat.connected
                                      ? "bg-emerald-400"
                                      : "bg-slate-500"
                                  }`}
                                  title={
                                    seat.connected ? "Trực tuyến" : "Mất kết nối"
                                  }
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        {canRemove ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              sendRoomAction({
                                type: "REMOVE_SEAT",
                                targetSeatNo: seat.seatNo,
                              })
                            }
                            className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-extrabold transition cursor-pointer disabled:opacity-40 ${
                              seat.isBot
                                ? "border border-amber-500/45 bg-amber-500/15 hover:bg-amber-500/30 text-amber-200"
                                : "border border-rose-500/50 bg-rose-500/20 hover:bg-rose-500/35 text-rose-200"
                            }`}
                          >
                            {seat.isBot ? "Xóa Bot" : "Kick"}
                          </button>
                        ) : (
                          <span className="shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            Sẵn sàng
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons directly below the Player Roster Card */}
              {snapshot.isHost ? (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={busy || snapshot.seats.length >= 2}
                    onClick={() => sendRoomAction({ type: "ADD_BOT" })}
                    className="flex-1 rounded-xl border border-sky-400/55 bg-slate-950/85 hover:bg-sky-950/90 backdrop-blur-md px-4 py-3 text-xs font-extrabold text-sky-200 shadow-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    + Thêm Bot
                  </button>
                  <button
                    type="button"
                    disabled={busy || !snapshot.configValidation.valid}
                    onClick={() => sendRoomAction({ type: "START_MATCH" })}
                    className="flex-[1.35] rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-5 py-3 text-xs font-black tracking-wide text-slate-950 shadow-xl shadow-orange-500/25 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    BẮT ĐẦU GAME
                  </button>
                </div>
              ) : snapshot.viewerSeatNo === null ? (
                <button
                  type="button"
                  disabled={busy || snapshot.seats.length >= 2}
                  onClick={() => sendRoomAction({ type: "JOIN" })}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-5 py-3 text-xs font-black text-slate-950 shadow-xl transition cursor-pointer disabled:opacity-40"
                >
                  Ngồi Vào Bàn
                </button>
              ) : (
                <div className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-700/60 bg-slate-950/80 backdrop-blur-md px-3.5 py-2.5 shadow-xl">
                  <span className="text-xs font-medium text-slate-300 italic">
                    Đang chờ Chủ phòng bắt đầu game...
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => sendRoomAction({ type: "LEAVE" })}
                    className="shrink-0 rounded-lg border border-slate-600 bg-slate-800/90 hover:bg-slate-700 px-3 py-1.5 text-[11px] font-bold text-slate-200 transition cursor-pointer disabled:opacity-40"
                  >
                    Rời Bàn
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {!isLobby && kotView?.step === "Finished" && (
          <div className="absolute inset-x-0 bottom-20 z-20 flex justify-center pointer-events-none px-4">
            <div className="pointer-events-auto max-w-md w-full rounded-2xl border border-amber-400/60 bg-slate-950/92 backdrop-blur-md p-4 shadow-2xl text-center space-y-2.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                VUA TOKYO MỚI
              </div>
              <p className="text-sm font-bold text-slate-100 leading-snug">
                {kotView.winReasonVi}
              </p>
              {snapshot?.isHost && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => sendRoomAction({ type: "REMATCH" })}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg transition cursor-pointer disabled:opacity-40"
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

export function KingOfTokyoDuelConfigContent({
  snapshot,
  isLobby,
  sendRoomAction,
}: GameConfigModalProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-orange-500/30 bg-slate-950/60 p-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-bold text-orange-300">Thời Gian Mỗi Lượt Kaiju</p>
          <p className="text-[11px] text-slate-400">
            Hết giờ hệ thống tự chốt xúc xắc hoặc kết thúc lượt (20–180 giây)
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
                        20,
                        (snapshot.room.config?.timers?.turnSeconds ?? 60) - 15
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
          <span className="font-mono font-bold text-orange-300 w-10 text-center">
            {snapshot?.room.config?.timers?.turnSeconds ?? 60}s
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
                        (snapshot.room.config?.timers?.turnSeconds ?? 60) + 15
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
        <p className="font-bold text-orange-300">
          Thiết lập chuẩn King of Tokyo: Duel (1v1)
        </p>
        <p>
          • <strong>6 Quái Vật Kaiju bất đối xứng</strong> (12–15 HP) với kỹ
          năng riêng kích hoạt bằng mặt xúc xắc {renderKotRichText("[!]")}.
        </p>
        <p>
          • <strong>Cân bằng lượt đi đầu</strong>: Người đi đầu tung 5 Xúc Xắc
          Đỏ ở Lượt 1; từ Lượt 2 trở đi mỗi bên tung 6 Xúc Xắc Đỏ + tối đa 2 Xúc
          Xắc Trắng (tối đa 3 lần tung/lượt).
        </p>
        <p>
          • <strong>2 Thanh Kéo Co + Token Buzz</strong>: Danh Vọng{" "}
          {renderKotRichText("⭐")} và Phá Hủy {renderKotRichText("🏢")} (-7 đến
          +7) cùng vùng Spotlight (ô 3–6).
        </p>
      </div>
    </div>
  );
}

export function KingOfTokyoDuelRulesContent() {
  return (
    <>
      {/* 1. 3 Cách Chiến Thắng */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/65 p-3.5 space-y-2.5 leading-relaxed text-slate-300">
        <p className="font-extrabold text-orange-300 text-xs uppercase tracking-wider">
          1. Mục Tiêu — 3 Cách Chiến Thắng Tức Thì
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="rounded-lg border border-rose-500/30 bg-slate-900/85 p-2.5 space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-5 h-5 shrink-0 bg-no-repeat"
                style={{
                  backgroundImage: "url(/sprites/kot-duel-icons-pixel.png)",
                  backgroundPosition: "85.7143% 0%",
                  backgroundSize: "800% 100%",
                }}
              />
              <strong className="text-rose-300 text-xs">Hạ Gục KO</strong>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Đánh tụt Máu (HP) đối thủ về <strong>0</strong>.
            </p>
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-slate-900/85 p-2.5 space-y-1">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block w-5 h-5 shrink-0 bg-no-repeat"
                style={{
                  backgroundImage: "url(/sprites/kot-duel-icons-pixel.png)",
                  backgroundPosition: "42.8571% 0%",
                  backgroundSize: "800% 100%",
                }}
              />
              <span
                className="inline-block w-5 h-5 shrink-0 bg-no-repeat"
                style={{
                  backgroundImage: "url(/sprites/kot-duel-icons-pixel.png)",
                  backgroundPosition: "57.1429% 0%",
                  backgroundSize: "800% 100%",
                }}
              />
              <strong className="text-amber-300 text-xs">
                Chạm Ô Đích (Ô 7)
              </strong>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Kéo dấu mốc <strong>Danh Vọng</strong> hoặc{" "}
              <strong>Phá Hủy</strong> chạm ô cuối cùng (ô số 7) về phía bạn.
            </p>
          </div>

          <div className="rounded-lg border border-emerald-500/30 bg-slate-900/85 p-2.5 space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-5 h-5 shrink-0 bg-no-repeat"
                style={{
                  backgroundImage: "url(/sprites/kot-duel-icons-pixel.png)",
                  backgroundPosition: "71.4286% 0%",
                  backgroundSize: "800% 100%",
                }}
              />
              <strong className="text-emerald-300 text-xs">
                Spotlight Kép
              </strong>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Đưa <strong>cả hai</strong> dấu mốc Danh Vọng và Phá Hủy cùng vào{" "}
              <strong>Vùng Spotlight (ô 3–6)</strong> bên phía bạn.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Diễn Biến 1 Lượt Chơi */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/65 p-3.5 space-y-2 leading-relaxed text-slate-300">
        <p className="font-extrabold text-sky-300 text-xs uppercase tracking-wider">
          2. Trình Tự 1 Lượt Chơi (3 Bước)
        </p>
        <ol className="space-y-1.5 text-[11.5px]">
          <li>
            <strong className="text-slate-100">Bước 1 — Tung Xúc Xắc:</strong>{" "}
            Lượt đầu tiên người đi trước tung <strong>5 Xúc Xắc Đỏ</strong>; mọi
            lượt sau tung <strong>6 Xúc Xắc Đỏ</strong>. Mỗi lượt được tung tối
            đa <strong>3 lần</strong> (bấm vào từng viên để khóa/mở khóa trước
            khi tung lại). Nếu có <strong>Token Xúc Xắc</strong> (giữ tối đa 2),
            bạn có thể bấm dùng để tung thêm <strong>Xúc Xắc Trắng</strong> (tối
            đa 8 viên/lượt).
          </li>
          <li>
            <strong className="text-slate-100">Bước 2 — Chốt Kết Quả:</strong>{" "}
            Bấm <strong>Chốt xúc xắc</strong> để thực thi toàn bộ sát thương,
            hồi máu, thu{" "}
            <img
              src="/sprites/kot-duel-energy-cube-pixel.png"
              alt="Năng lượng"
              className="inline-block w-3.5 h-3.5 align-middle mx-0.5"
            />
            <strong>Năng Lượng</strong>, kéo thanh Danh Vọng / Phá Hủy và kích
            hoạt kỹ năng Kaiju.
          </li>
          <li>
            <strong className="text-slate-100">
              Bước 3 — Mua Thẻ Sức Mạnh & Kết Thúc Lượt:
            </strong>{" "}
            Dùng{" "}
            <img
              src="/sprites/kot-duel-energy-cube-pixel.png"
              alt="Năng lượng"
              className="inline-block w-3.5 h-3.5 align-middle mx-0.5"
            />
            <strong>Năng Lượng</strong> mua thẻ trên 3 ô chợ (hoặc trả{" "}
            <strong>2 Năng Lượng</strong> để đổi 3 thẻ mới). Thẻ{" "}
            <strong>Bỏ Đi</strong> có tác dụng ngay; thẻ <strong>Giữ</strong>{" "}
            cho hiệu ứng vĩnh viễn suốt trận.
          </li>
        </ol>
      </div>

      {/* 3. Ý Nghĩa 6 Mặt Xúc Xắc */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/65 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="font-extrabold text-rose-300 text-xs uppercase tracking-wider">
            3. Ý Nghĩa 6 Mặt Xúc Xắc
          </p>
          <span className="text-[10px] text-slate-400">
            6 viên Đỏ (chính) + tối đa 2 viên Trắng (thêm)
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            {
              face: "claw",
              bgPos: "0% 100%",
              title: "Vuốt (Sát Thương)",
              desc: "Mỗi mặt gây 1 sát thương trực tiếp lên đối thủ.",
            },
            {
              face: "heal",
              bgPos: "20% 100%",
              title: "Trái Tim (Hồi Máu)",
              desc: "Mỗi mặt hồi 1 HP (không vượt quá máu tối đa).",
            },
            {
              face: "energy",
              bgPos: "40% 100%",
              title: "Năng Lượng",
              desc: "Mỗi mặt nhận 1 khối Năng Lượng xanh để mua thẻ.",
            },
            {
              face: "star",
              bgPos: "60% 100%",
              title: "Danh Vọng",
              desc: "Cần từ 3 mặt kéo 1 bước; mỗi mặt dư thêm +1 bước.",
            },
            {
              face: "building",
              bgPos: "80% 100%",
              title: "Phá Hủy",
              desc: "Cần từ 3 mặt kéo 1 bước; mỗi mặt dư thêm +1 bước.",
            },
            {
              face: "special",
              bgPos: "100% 100%",
              title: "Kỹ Năng Đặc Biệt",
              desc: "Kích hoạt năng lực riêng của Quái Vật bạn đang cầm.",
            },
          ].map((item) => (
            <div
              key={item.face}
              className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-900/85 p-2"
            >
              <span
                className="inline-block w-7 h-7 shrink-0 rounded bg-no-repeat mt-0.5"
                style={{
                  backgroundImage: "url(/sprites/kot-duel-dice-pixel.png)",
                  backgroundPosition: item.bgPos,
                  backgroundSize: "600% 200%",
                }}
              />
              <div className="min-w-0">
                <div className="font-bold text-slate-100 text-[11.5px]">
                  {item.title}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Cơ Chế Token Buzz */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/65 p-3.5 space-y-2 leading-relaxed text-slate-300">
        <div className="flex items-center justify-between gap-2">
          <p className="font-extrabold text-emerald-300 text-xs uppercase tracking-wider">
            4. Cơ Chế Token Buzz Trên Bàn Đấu
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="inline-block w-11 h-7 bg-no-repeat"
              style={{
                backgroundImage: "url(/sprites/kot-duel-buzz-tiles-pixel.png)",
                backgroundPosition: "33.333% 0%",
                backgroundSize: "400% 300%",
              }}
            />
            <span
              className="inline-block w-11 h-7 bg-no-repeat"
              style={{
                backgroundImage: "url(/sprites/kot-duel-buzz-tiles-pixel.png)",
                backgroundPosition: "100% 0%",
                backgroundSize: "400% 300%",
              }}
            />
          </div>
        </div>
        <ul className="space-y-1 text-[11.5px] list-disc pl-4">
          <li>
            Nhiều Thẻ Sức Mạnh có <strong>biểu tượng linh vật Buzz</strong> ở
            góc trên bên trái. Khi mua thẻ đó, nếu miếng Token Buzz tương ứng
            chưa ở trên bàn, bạn được{" "}
            <strong>đặt mới miếng Buzz (2 ô hoặc 3 ô)</strong> lên thanh Danh
            Vọng hoặc Phá Hủy.
          </li>
          <li>
            Nếu miếng Token Buzz đó <strong>đã nằm trên bàn</strong> (dù do bạn
            hay đối thủ đặt trước đó), người vừa mua thẻ có quyền{" "}
            <strong>nhấc và di chuyển</strong> sang vị trí mới —{" "}
            <strong>ngoại trừ</strong> khi quân cờ <strong>Danh Vọng</strong>{" "}
            hoặc <strong>Phá Hủy</strong> đang đứng đè lên bất kỳ ô nào của
            miếng Buzz đó (lúc này miếng Buzz bị <strong>khóa cố định</strong>,
            không thể di chuyển).
          </li>
          <li>
            Chỉ được đặt Token Buzz lên các <strong>ô trống</strong> (không
            chồng lên Buzz khác, không đè lên ô đang có quân cờ đứng và không
            che 2 ô đích thắng). Miếng Buzz nằm <strong>bền vững</strong>: mỗi
            khi quân cờ bước qua ô có biểu tượng, người đi lượt lập tức nhận
            thưởng {renderKotRichText("🐾 / ❤️ / ⚡ / 🎲")} tương ứng.
          </li>
        </ul>
      </div>

      {/* 5. 6 Quái Vật Kaiju */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/65 p-3.5 space-y-2.5">
        <p className="font-extrabold text-amber-300 text-xs uppercase tracking-wider">
          5. 6 Quái Vật Kaiju & Kỹ Năng Độc Quyền (Kích hoạt bằng{" "}
          {renderKotRichText("[!]")})
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {KOT_MONSTER_IDS.map((mid, idx) => {
            const m = KOT_MONSTERS[mid];
            const bgX = `${(idx / 5) * 100}%`;
            return (
              <div
                key={mid}
                className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-slate-900/85 p-2"
              >
                <span
                  className="inline-block w-11 h-11 shrink-0 rounded-lg border border-slate-700 bg-no-repeat"
                  style={{
                    backgroundImage:
                      "url(/sprites/kot-duel-monsters-pixel.png)",
                    backgroundPosition: `${bgX} 0%`,
                    backgroundSize: "600% 100%",
                  }}
                />
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-bold text-slate-100 text-xs truncate">
                      {m.name}
                    </span>
                    <span className="inline-flex items-center gap-0.5 shrink-0 text-[10px] text-rose-300 font-mono font-bold">
                      {renderKotRichText("❤️")}
                      {m.maxHp}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    <strong className="text-amber-300">{m.powerNameVi}:</strong>{" "}
                    {renderKotRichText(m.powerDescVi)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
