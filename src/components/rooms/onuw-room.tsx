"use client";

import React from "react";
import { OnuwCanvas } from "@/components/onuw-canvas";
import {
  ALL_ONUW_ROLE_IDS,
  ONUW_FACTION_META,
  ONUW_ROLE_META,
  countRoles,
  defaultRolesForSeatCount,
  type OnuwConfig,
  type OnuwPlayerView,
  type OnuwRoleId,
} from "@/cartridges/one-night-werewolf";
import type { GameConfigModalProps, GameRoomModuleProps } from "./types";

export function OnuwRoom({
  snapshot,
  isLobby,
  busy,
  soundEnabled,
  isExpanded,
  sendRoomAction,
  onOpenDrawer,
}: GameRoomModuleProps) {
  const onuwView: OnuwPlayerView | null = snapshot?.playerView
    ? (snapshot.playerView as OnuwPlayerView)
    : null;

  const showLobbyOverlay = isLobby || !onuwView;
  const seats = snapshot?.seats ?? [];
  const cfg = (snapshot?.room.config ?? null) as OnuwConfig | null;
  const requiredCards = seats.length + 3;
  const currentCards = cfg?.roles?.length ?? 0;

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
        <OnuwCanvas
          mode={showLobbyOverlay ? "lobby" : "match"}
          lobbySeats={seats}
          isHost={Boolean(snapshot?.isHost)}
          viewerSeatNo={snapshot?.viewerSeatNo ?? null}
          playerView={onuwView}
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
            {/* Compact Role Deck Preview Pills */}
            {cfg?.roles && cfg.roles.length > 0 && (
              <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 max-w-4xl rounded-xl border border-indigo-400/30 bg-slate-950/80 backdrop-blur-md px-3 py-1.5">
                <span className="text-[10px] font-bold text-slate-400 mr-1">
                  Bộ bài ({currentCards}/{requiredCards}):
                </span>
                {cfg.roles.map((r, idx) => {
                  const meta = ONUW_ROLE_META[r];
                  return (
                    <span
                      key={`${r}-${idx}`}
                      style={{ borderColor: meta.accent }}
                      className="rounded-md border bg-slate-900/90 px-1.5 py-0.5 text-[10px] font-bold text-slate-100"
                    >
                      {meta.icon} {meta.nameVi}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Compact Player Seat Cards with Host Remove/Kick */}
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 max-w-4xl">
              {seats.map((seat) => {
                const isRoomHost = seat.actorId === snapshot.room.hostActorId;
                const canRemove = snapshot.isHost && !isRoomHost;
                return (
                  <div
                    key={seat.seatNo}
                    className="flex items-center gap-2 rounded-xl border border-amber-400/35 bg-slate-950/85 backdrop-blur-md px-3 py-2 shadow-lg"
                  >
                    <span className="text-[10px] font-mono font-bold text-amber-300">
                      #{seat.seatNo}
                    </span>
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
                {seats.length}/10 người chơi
              </span>

              {snapshot.isHost && (
                <>
                  <button
                    type="button"
                    disabled={busy || seats.length >= 10}
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
                    🌙 BẮT ĐẦU ĐÊM SÓI
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

export function OnuwConfigContent({
  snapshot,
  isLobby,
  busy,
  sendRoomAction,
}: GameConfigModalProps) {
  const seatCount = Math.max(3, snapshot?.seats.length ?? 3);
  const required = seatCount + 3;
  const cfg = (snapshot?.room.config ?? {
    roles: defaultRolesForSeatCount(seatCount),
    roleRevealSeconds: 10,
    nightStepSeconds: 25,
    dayDiscussionSeconds: 300,
    dayVoteSeconds: 30,
    allowLoneWolfPeek: true,
  }) as OnuwConfig;

  const canEdit = Boolean(snapshot?.isHost && isLobby);
  const counts = countRoles(cfg.roles ?? []);

  const updateConfig = (next: OnuwConfig) => {
    if (!canEdit || busy) return;
    void sendRoomAction({ type: "UPDATE_CONFIG", config: next });
  };

  const adjustRole = (roleId: OnuwRoleId, delta: 1 | -1) => {
    const meta = ONUW_ROLE_META[roleId];
    const current = counts[roleId];
    const target = current + delta;
    if (target < 0 || target > meta.maxCount) return;

    const nextRoles = [...(cfg.roles ?? [])];
    if (delta === 1) {
      nextRoles.push(roleId);
    } else {
      const idx = nextRoles.lastIndexOf(roleId);
      if (idx >= 0) nextRoles.splice(idx, 1);
    }
    updateConfig({ ...cfg, roles: nextRoles });
  };

  const applyDefault = () => {
    updateConfig({ ...cfg, roles: defaultRolesForSeatCount(seatCount) });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-bold text-white text-xs">
            Số lá vai trò: {cfg.roles.length} / {required} lá
          </div>
          <p className="text-[11px] text-slate-400">
            Luôn cần đúng {seatCount} người chơi + 3 lá ẩn ở giữa bàn.
          </p>
        </div>
        <button
          type="button"
          disabled={!canEdit || busy}
          onClick={applyDefault}
          className="rounded-lg border border-amber-400/50 bg-amber-500/20 hover:bg-amber-500/35 px-3 py-1.5 text-xs font-bold text-amber-200 cursor-pointer disabled:opacity-40"
        >
          ✨ Bộ Chuẩn ({required} lá)
        </button>
      </div>

      {/* Role Picker Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ALL_ONUW_ROLE_IDS.map((roleId) => {
          const meta = ONUW_ROLE_META[roleId];
          const fMeta = ONUW_FACTION_META[meta.faction];
          const qty = counts[roleId];
          return (
            <div
              key={roleId}
              className={`rounded-xl border p-2.5 flex items-center justify-between gap-2 transition ${
                qty > 0
                  ? "border-amber-400/45 bg-slate-900/90"
                  : "border-slate-800 bg-slate-950/60 opacity-75"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span>{meta.icon}</span>
                  <span className="font-bold text-white text-xs truncate">
                    {meta.nameVi}
                  </span>
                  <span
                    style={{ color: fMeta.accent }}
                    className="text-[9px] font-bold uppercase"
                  >
                    ({meta.faction === "werewolf" ? "Sói" : meta.faction === "tanner" ? "Độc lập" : "Dân"})
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                  {meta.shortDescVi}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={!canEdit || busy || qty <= 0}
                  onClick={() => adjustRole(roleId, -1)}
                  className="w-6 h-6 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 font-bold text-slate-200 cursor-pointer disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-4 text-center font-mono font-bold text-amber-300">
                  {qty}
                </span>
                <button
                  type="button"
                  disabled={!canEdit || busy || qty >= meta.maxCount}
                  onClick={() => adjustRole(roleId, 1)}
                  className="w-6 h-6 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 font-bold text-slate-200 cursor-pointer disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lone Wolf toggle & Discussion timer */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 flex items-center justify-between gap-3">
        <div>
          <div className="font-bold text-white text-xs">
            🐺 Luật Sói Đơn Độc (Lone Wolf)
          </div>
          <p className="text-[11px] text-slate-400">
            Nếu chỉ có 1 Ma Sói trên bàn, Sói đó được soi 1 lá ở giữa bàn.
          </p>
        </div>
        <button
          type="button"
          disabled={!canEdit || busy}
          onClick={() =>
            updateConfig({
              ...cfg,
              allowLoneWolfPeek: !cfg.allowLoneWolfPeek,
            })
          }
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold border transition ${
            cfg.allowLoneWolfPeek
              ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
              : "border-slate-700 bg-slate-800 text-slate-300"
          } ${canEdit ? "cursor-pointer" : "opacity-60"}`}
        >
          {cfg.allowLoneWolfPeek ? "Đang bật" : "Tắt"}
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 flex items-center justify-between gap-3">
        <div className="font-bold text-white text-xs">
          ⏱ Thời gian thảo luận ban ngày
        </div>
        <div className="flex items-center gap-1.5">
          {[180, 300, 420].map((sec) => (
            <button
              key={sec}
              type="button"
              disabled={!canEdit || busy}
              onClick={() => updateConfig({ ...cfg, dayDiscussionSeconds: sec })}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold border cursor-pointer disabled:opacity-50 ${
                cfg.dayDiscussionSeconds === sec
                  ? "border-amber-400 bg-amber-500/20 text-amber-200"
                  : "border-slate-700 bg-slate-800 text-slate-300"
              }`}
            >
              {sec / 60} phút
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OnuwRulesContent() {
  return (
    <div className="space-y-4 text-slate-200 leading-relaxed">
      <section className="space-y-1.5">
        <h3 className="font-extrabold text-amber-300 text-sm">
          1. Tổng quan & Luật Vàng (Bezier Games)
        </h3>
        <p>
          <strong>One Night Ultimate Werewolf</strong> (3–10 người chơi) chỉ có{" "}
          <strong>1 Đêm duy nhất</strong> và <strong>1 lần Bỏ Phiếu duy nhất</strong>.
          Bộ bài luôn gồm <strong>số người chơi + 3 lá úp ở giữa bàn</strong>.
        </p>
        <p className="text-amber-200 font-semibold">
          ⭐ Luật Vàng: Phe và điều kiện thắng của bạn được quyết định bởi{" "}
          <u>lá bài trước mặt bạn lúc KẾT THÚC VÁN</u> — ngay cả khi nó đã bị
          tráo đổi trong đêm!
        </p>
      </section>

      <section className="space-y-1.5">
        <h3 className="font-extrabold text-sky-300 text-sm">
          2. Thứ Tự Thức Đêm Chính Thức (1 → 9)
        </h3>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            <strong>🎭 Nhân Bản (Doppelgänger):</strong> Xem bài 1 người chơi
            khác và sao chép vai trò đó (nếu copy Tiên Tri / Đạo Chích / Kẻ Phá
            Rối / Kẻ Say Rượu thì thực hiện ngay lập tức).
          </li>
          <li>
            <strong>🐺 Ma Sói (×2):</strong> Nhận diện nhau. Nếu chỉ có 1 Sói
            trên bàn (Sói đơn độc), được soi 1 lá ở giữa bàn.
          </li>
          <li>
            <strong>🗡️ Tay Sai (Minion):</strong> Biết ai là Ma Sói (nhưng Sói
            không biết Tay Sai).
          </li>
          <li>
            <strong>⚒️ Thợ Xây (×2):</strong> Hai Thợ Xây nhận diện nhau.
          </li>
          <li>
            <strong>🔮 Tiên Tri (Seer):</strong> Soi bài 1 người chơi khác{" "}
            <em>hoặc</em> soi 2 lá bài ở giữa bàn.
          </li>
          <li>
            <strong>🦊 Đạo Chích (Robber):</strong> Tráo bài mình với 1 người
            khác rồi xem lá bài mới của mình.
          </li>
          <li>
            <strong>🃏 Kẻ Phá Rối (Troublemaker):</strong> Bí mật tráo bài
            giữa 2 người chơi khác (không xem).
          </li>
          <li>
            <strong>🍺 Kẻ Say Rượu (Drunk):</strong> Bắt buộc đổi bài mình với
            1 lá ở giữa bàn mà không được xem.
          </li>
          <li>
            <strong>👁️ Kẻ Mất Ngủ (Insomniac):</strong> Xem lại lá bài hiện
            tại trước mặt mình vào cuối đêm.
          </li>
        </ol>
        <p className="text-slate-400 text-[11px]">
          * Dân Làng (×3), Thợ Săn (🏹) và Thợ Thuộc Da (🪓) ngủ yên suốt đêm.
        </p>
      </section>

      <section className="space-y-1.5">
        <h3 className="font-extrabold text-emerald-300 text-sm">
          3. Bỏ Phiếu & Điều Kiện Chiến Thắng
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Chỉ tay đồng loạt:</strong> Mọi người bỏ phiếu vào 1 người
            chơi khác. Ai nhiều phiếu nhất bị treo cổ (hòa phiếu cao nhất →{" "}
            <strong>tất cả người hòa đều bị loại</strong>).
          </li>
          <li>
            <strong>Ngoại lệ Hòa 1 Phiếu:</strong> Nếu{" "}
            <strong>không ai có từ 2 phiếu trở lên</strong> (mỗi người chỉ nhận
            1 phiếu) → <strong>KHÔNG AI CHẾT</strong>!
          </li>
          <li>
            <strong>🏹 Thợ Săn:</strong> Nếu Thợ Săn chết, người mà Thợ Săn đang
            bỏ phiếu vào cũng chết theo ngay lập tức.
          </li>
          <li>
            <strong>🛡️ Phe Dân Làng thắng:</strong> Có ít nhất 1 Ma Sói bị loại;
            HOẶC nếu cả 2 Ma Sói đều nằm ở giữa bàn thì <em>không ai bị loại</em>.
          </li>
          <li>
            <strong>🐺 Phe Ma Sói thắng:</strong> Không Ma Sói nào bị loại (và
            Thợ Thuộc Da không chết). Nếu không có Sói trên bàn, Tay Sai thắng
            khi có ít nhất 1 người chơi khác bị loại.
          </li>
          <li>
            <strong>🪓 Thợ Thuộc Da thắng:</strong> Chỉ thắng khi chính Thợ
            Thuộc Da bị treo cổ! (Nếu hòa khiến cả Thợ Thuộc Da lẫn Ma Sói cùng
            chết thì cả Thợ Thuộc Da và Dân Làng cùng thắng.)
          </li>
        </ul>
      </section>
    </div>
  );
}
