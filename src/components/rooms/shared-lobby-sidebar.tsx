"use client";

import React from "react";
import type { RoomSnapshotForActor } from "@/platform/coordinator";
import type { SendRoomAction } from "./types";

interface SharedLobbySidebarProps {
  snapshot: RoomSnapshotForActor | null;
  busy: boolean;
  title: string;
  defaultRequirementHint: string;
  sendRoomAction: SendRoomAction;
}

export function SharedLobbySidebar({
  snapshot,
  busy,
  title,
  defaultRequirementHint,
  sendRoomAction,
}: SharedLobbySidebarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
          Bảng Điều Khiển Sảnh Chờ
        </span>
        <h2 className="text-sm font-bold text-slate-100 mt-1">{title}</h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          {snapshot?.configValidation.valid
            ? "✓ Đã đủ số lượng người chơi hợp lệ, sẵn sàng bắt đầu ván đấu!"
            : snapshot?.configValidation.error ?? defaultRequirementHint}
        </p>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        {snapshot?.isHost && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => sendRoomAction({ type: "ADD_BOT" })}
              className="w-full rounded-xl border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 px-3.5 py-2.5 text-xs font-semibold text-sky-200 transition cursor-pointer disabled:opacity-50"
            >
              🤖 + Thêm Bot Vào Bàn
            </button>
            <button
              type="button"
              disabled={busy || !snapshot?.configValidation.valid}
              onClick={() => sendRoomAction({ type: "START_MATCH" })}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg transition cursor-pointer disabled:opacity-40"
            >
              🔥 BẮT ĐẦU VÁN ĐẤU
            </button>
          </>
        )}
        {!snapshot?.isHost && snapshot?.viewerSeatNo === null && (
          <div className="space-y-2 rounded-xl border border-rose-500/35 bg-rose-950/30 p-3">
            <p className="text-xs text-rose-200 leading-relaxed">
              Bạn hiện chưa ngồi vào bàn (hoặc đã được Chủ phòng mời ra khỏi
              ghế).
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => sendRoomAction({ type: "JOIN" })}
              className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-2 text-xs font-extrabold text-slate-950 transition cursor-pointer disabled:opacity-50"
            >
              🪑 Ngồi Vào Bàn
            </button>
          </div>
        )}
        {!snapshot?.isHost && snapshot?.viewerSeatNo !== null && (
          <div className="space-y-2">
            <span className="block text-xs text-slate-400 italic">
              Đang chờ Chủ phòng bắt đầu ván đấu...
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => sendRoomAction({ type: "LEAVE" })}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition cursor-pointer disabled:opacity-50"
            >
              🚪 Rời Khỏi Bàn
            </button>
          </div>
        )}
      </div>

      {/* Lobby Seat Roster with Remove Bot & Kick Player Controls for Host */}
      {snapshot && snapshot.seats.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/65 p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Danh Sách Ghế Ngồi ({snapshot.seats.length})
            </span>
            {snapshot.isHost && snapshot.seats.some((s) => s.isBot) && (
              <span className="text-[10px] text-slate-500">Quản lý ghế</span>
            )}
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
            {snapshot.seats.map((seat) => {
              const isRoomHost = seat.actorId === snapshot.room.hostActorId;
              const canRemove = snapshot.isHost && !isRoomHost;
              return (
                <div
                  key={seat.seatNo}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-800/90 bg-slate-900/90 px-2.5 py-1.5"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-500 shrink-0">
                      #{seat.seatNo}
                    </span>
                    <span className="text-xs font-semibold text-slate-100 truncate">
                      {seat.displayName}
                    </span>
                    {isRoomHost ? (
                      <span className="shrink-0 rounded bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                        👑 Chủ
                      </span>
                    ) : seat.isBot ? (
                      <span className="shrink-0 rounded bg-sky-500/15 border border-sky-500/35 px-1.5 py-0.5 text-[9px] font-bold text-sky-300">
                        🤖 Bot
                      </span>
                    ) : (
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          seat.connected ? "bg-emerald-400" : "bg-slate-600"
                        }`}
                        title={seat.connected ? "Trực tuyến" : "Mất kết nối"}
                      />
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
                      title={
                        seat.isBot
                          ? `Xóa ${seat.displayName} khỏi bàn`
                          : `Kick ${seat.displayName} ra khỏi bàn`
                      }
                      className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold transition cursor-pointer disabled:opacity-40 ${
                        seat.isBot
                          ? "border border-slate-700 bg-slate-800 hover:bg-amber-500/20 hover:border-amber-500/50 hover:text-amber-200 text-slate-300"
                          : "border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/30 text-rose-300"
                      }`}
                    >
                      {seat.isBot ? "✕ Xóa" : "Kick"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface SidebarDrawerButtonsProps {
  messagesCount: number;
  eventsCount: number;
  onOpenDrawer: (tab: "chat" | "events") => void;
}

export function SidebarDrawerButtons({
  messagesCount,
  eventsCount,
  onOpenDrawer,
}: SidebarDrawerButtonsProps) {
  return (
    <div className="border-t border-slate-800 pt-3 grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onOpenDrawer("chat")}
        className="rounded-xl border border-amber-500/35 bg-slate-950/70 hover:bg-slate-800 px-3 py-2 text-xs font-bold text-amber-300 flex items-center justify-between gap-1.5 transition cursor-pointer"
      >
        <span>💬 Chat</span>
        <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-mono">
          {messagesCount}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onOpenDrawer("events")}
        className="rounded-xl border border-emerald-500/35 bg-slate-950/70 hover:bg-slate-800 px-3 py-2 text-xs font-bold text-emerald-300 flex items-center justify-between gap-1.5 transition cursor-pointer"
      >
        <span>📜 Nhật Ký</span>
        <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-mono">
          {eventsCount}
        </span>
      </button>
    </div>
  );
}
