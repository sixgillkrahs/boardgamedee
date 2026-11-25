"use client";

import React, { useEffect, useRef, useState } from "react";
import type { ChannelId } from "@/cartridges/types";
import type { RoomSnapshotForActor } from "@/platform/coordinator";
import type { SendRoomAction } from "./types";

interface RoomChatDrawerProps {
  open: boolean;
  onClose: () => void;
  snapshot: RoomSnapshotForActor | null;
  isLobby: boolean;
  busy: boolean;
  sendRoomAction: SendRoomAction;
}

export function RoomChatDrawer({
  open,
  onClose,
  snapshot,
  isLobby,
  busy,
  sendRoomAction,
}: RoomChatDrawerProps) {
  const [activeChannelId, setActiveChannelId] =
    useState<ChannelId>("village");
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Automatically pick a writable channel when phase changes (e.g. Werewolf night chat)
  useEffect(() => {
    if (!snapshot?.channels?.length) return;
    const current = snapshot.channels.find(
      (c) => c.channelId === activeChannelId
    );
    if (!current || !current.canWrite) {
      const writable = snapshot.channels.find((c) => c.canWrite);
      if (writable) {
        setActiveChannelId(writable.channelId);
      } else if (!current) {
        setActiveChannelId(snapshot.channels[0].channelId);
      }
    }
  }, [snapshot?.channels, activeChannelId]);

  useEffect(() => {
    if (open) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, snapshot?.messages?.length]);

  const activeChannelPerm = snapshot?.channels.find(
    (c) => c.channelId === activeChannelId
  );
  const channelMessages = (snapshot?.messages ?? []).filter(
    (m) => m.channelId === activeChannelId
  );

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput;
    setChatInput("");
    await sendRoomAction({
      type: "SEND_MESSAGE",
      channelId: activeChannelId,
      content: text,
    });
  };

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-[1px] z-40"
        />
      )}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 border-l border-slate-800 bg-slate-900/95 backdrop-blur-md shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <span>💬 Kênh Chat ({snapshot?.messages.length ?? 0})</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-300 cursor-pointer"
          >
            Đóng ✕
          </button>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-800/80 bg-slate-950/30 overflow-x-auto">
              {(snapshot?.channels.length
                ? snapshot.channels
                : [
                    {
                      channelId: "village" as ChannelId,
                      label: "Làng (Công khai)",
                      canRead: true,
                      canWrite: false,
                    },
                  ]
              ).map((ch) => (
                <button
                  key={ch.channelId}
                  type="button"
                  onClick={() => setActiveChannelId(ch.channelId)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                    activeChannelId === ch.channelId
                      ? ch.channelId === "werewolf"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : ch.channelId === "graveyard"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-slate-800/70 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {ch.channelId === "werewolf"
                    ? "🐺 "
                    : ch.channelId === "graveyard"
                      ? "🪦 "
                      : "🏡 "}
                  {ch.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 text-xs">
              {channelMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 px-4">
                  <p className="font-medium">
                    Chưa có tin nhắn trong kênh này.
                  </p>
                  <p className="text-[11px] mt-1">
                    {isLobby
                      ? "Bắt đầu ván đấu để mở kênh thảo luận theo pha Ngày/Đêm."
                      : activeChannelPerm?.canWrite
                        ? "Hãy gửi tin nhắn đầu tiên để thảo luận!"
                        : "Kênh này hiện đang khoá ghi ở pha hiện tại."}
                  </p>
                </div>
              ) : (
                channelMessages.map((msg) => {
                  const isMine = msg.senderSeatNo === snapshot?.viewerSeatNo;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isMine ? "items-end" : "items-start"
                      }`}
                    >
                      <span className="text-[10px] text-slate-400 mb-0.5 px-1">
                        {msg.senderName}
                      </span>
                      <div
                        className={`rounded-xl px-3 py-2 max-w-[85%] break-words ${
                          isMine
                            ? "bg-amber-500/20 border border-amber-500/30 text-amber-100"
                            : "bg-slate-800 border border-slate-700 text-slate-100"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form
              onSubmit={handleSendChat}
              className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={!activeChannelPerm?.canWrite || busy}
                placeholder={
                  activeChannelPerm?.canWrite
                    ? `Nhập tin nhắn vào kênh ${activeChannelPerm.label}...`
                    : "Kênh chat đang khoá ở pha này..."
                }
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={
                  !activeChannelPerm?.canWrite || !chatInput.trim() || busy
                }
                className="rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-bold text-slate-950 transition cursor-pointer disabled:opacity-40"
              >
                Gửi
              </button>
            </form>
          </div>
      </aside>
    </>
  );
}
