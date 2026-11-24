"use client";

import React, { Suspense, use, useEffect, useState } from "react";
import type { RoomSnapshotForActor } from "@/platform/coordinator";
import { RoomChatDrawer } from "@/components/rooms/room-chat-drawer";
import {
  KingOfTokyoDuelConfigContent,
  KingOfTokyoDuelRoom,
  KingOfTokyoDuelRulesContent,
} from "@/components/rooms/king-of-tokyo-duel-room";
import {
  DeadMansDrawConfigContent,
  DeadMansDrawRoom,
  DeadMansDrawRulesContent,
} from "@/components/rooms/dead-mans-draw-room";
import {
  SplendorDuelConfigContent,
  SplendorDuelRoom,
  SplendorDuelRulesContent,
} from "@/components/rooms/splendor-duel-room";
import {
  SplendorConfigContent,
  SplendorRoom,
  SplendorRulesContent,
} from "@/components/rooms/splendor-room";
import {
  CoupConfigContent,
  CoupRoom,
  CoupRulesContent,
} from "@/components/rooms/coup-room";
import {
  WerewolfConfigContent,
  WerewolfRoom,
  WerewolfRulesContent,
} from "@/components/rooms/werewolf-room";
import type { GameRoomModuleProps } from "@/components/rooms/types";

const RULES_MODAL_META: Record<string, { title: string; subtitle: string }> = {
  "king-of-tokyo-duel": {
    title: "Luật Chơi King of Tokyo: Duel (Đối Kháng 1v1)",
    subtitle:
      "Đối kháng 1v1 • 6 Xúc Xắc Đỏ + 2 Xúc Xắc Trắng • Kéo co Danh Vọng & Phá Hủy + Token Buzz",
  },
  "dead-mans-draw": {
    title: "Luật Chơi Dead Man's Draw (2–4 Hải Tặc)",
    subtitle:
      "60 lá kho báu • 10 kỹ năng liên hoàn • Cược may rủi hoặc Cháy bài mất trắng",
  },
  "splendor-duel": {
    title: "Luật Chơi Splendor Duel (Đối Kháng 1v1)",
    subtitle:
      "Luật chuẩn Marc André & Bruno Cathala • Bàn 5×5, Ngọc Trai, Đặc Quyền & 3 Cách Thắng",
  },
  splendor: {
    title: "Luật Chơi Splendor: Thương Nhân Đá Quý (2–4 Người Chơi)",
    subtitle:
      "Luật chuẩn Space Cowboys • Thu thập đá quý, đầu tư mỏ & mời Quý Tộc",
  },
  coup: {
    title: "Luật Chơi Coup: Đảo Chính (3–6 Người Chơi)",
    subtitle: "Bảng tham chiếu hành động (Play) • Nói dối, Bắt bài & Chặn",
  },
  werewolf: {
    title: "Luật Chơi Làng Ma Sói (4–16 Người Chơi)",
    subtitle: "Các vai trò, quy trình Đêm/Ngày và điều kiện thắng",
  },
};

export default function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center text-sm">
          Đang tải bàn chơi...
        </div>
      }
    >
      <RoomPageContent params={params} />
    </Suspense>
  );
}

function RoomPageContent({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const normalizedCode = code.toUpperCase();

  const [snapshot, setSnapshot] = useState<RoomSnapshotForActor | null>(null);
  const [actor, setActor] = useState<{
    id: string;
    displayName: string;
    isGuest: boolean;
    email?: string | null;
  } | null>(null);
  const [, setConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"chat" | "events">("chat");
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  // Connect to Real-Time SSE stream
  useEffect(() => {
    const es = new EventSource(`/api/rooms/${normalizedCode}/stream`);

    es.onopen = () => {
      setConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          setErrorMsg(data.error);
          return;
        }
        if (data.snapshot) {
          setSnapshot(data.snapshot);
        }
        if (data.actor) {
          setActor(data.actor);
        }
      } catch {
        // ignore malformed frame
      }
    };

    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      es.close();
    };
  }, [normalizedCode]);

  const sendRoomAction = async (payload: Record<string, unknown>) => {
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/rooms/${normalizedCode}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Thao tác thất bại");
      }
      if (data.snapshot) setSnapshot(data.snapshot);
      if (data.actor) setActor(data.actor);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openDrawer = (tab: "chat" | "events") => {
    setDrawerTab(tab);
    setDrawerOpen(true);
  };

  const cartridgeId = snapshot?.room.cartridgeId ?? "werewolf";
  const isLobby =
    !snapshot || snapshot.room.status === "lobby" || !snapshot.playerView;

  const roomProps: GameRoomModuleProps = {
    snapshot,
    normalizedCode,
    isLobby,
    busy,
    sendRoomAction,
    setErrorMsg,
    onOpenDrawer: openDrawer,
  };

  const rulesMeta =
    RULES_MODAL_META[cartridgeId] ?? RULES_MODAL_META.werewolf;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-x-hidden">
      {/* Top Platform Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/85 backdrop-blur px-2.5 py-2 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 z-30">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={async () => {
              await sendRoomAction({ type: "LEAVE" });
              window.location.href = "/";
            }}
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
          >
            ← <span className="hidden xs:inline">Rời Phòng</span>
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="hidden md:inline text-xs uppercase tracking-wider text-slate-400">
              Mã phòng:
            </span>
            <span className="rounded-lg bg-amber-500/15 border border-amber-500/40 px-2 py-1 font-mono text-xs sm:text-sm font-bold text-amber-300">
              {normalizedCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2 sm:px-2.5 py-1 text-xs font-medium text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              {copied ? "✓ Đã chép" : "Sao chép link"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
          {/* Quick Buttons to Open Chat & Event Log Drawer separately */}
          <button
            type="button"
            onClick={() => openDrawer("chat")}
            className="h-8 rounded-lg border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-2.5 text-xs font-bold text-amber-300 transition cursor-pointer inline-flex items-center gap-1.5"
            title="Mở Kênh Chat"
          >
            <span>💬</span>
            <span className="hidden sm:inline">Chat</span>
            {(snapshot?.messages.length ?? 0) > 0 && (
              <span className="rounded bg-amber-500/25 px-1.5 py-0.5 text-[10px] font-mono leading-none">
                {snapshot?.messages.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => openDrawer("events")}
            className="h-8 rounded-lg border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-2.5 text-xs font-bold text-emerald-300 transition cursor-pointer inline-flex items-center gap-1.5"
            title="Mở Nhật Ký Trận Đấu"
          >
            <span>📜</span>
            <span className="hidden sm:inline">Nhật Ký</span>
            {(snapshot?.events.length ?? 0) > 0 && (
              <span className="rounded bg-emerald-500/25 px-1.5 py-0.5 text-[10px] font-mono leading-none">
                {snapshot?.events.length}
              </span>
            )}
          </button>

          {/* Info 'i' Button for Viewing Game Rules */}
          <button
            type="button"
            onClick={() => setRulesModalOpen(true)}
            className="w-8 h-8 rounded-lg border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 inline-flex items-center justify-center font-serif italic font-extrabold text-sm text-sky-300 transition cursor-pointer"
            title="Xem luật chơi"
            aria-label="Xem luật chơi"
          >
            i
          </button>

          {/* Gear Icon Button for Configuration */}
          <button
            type="button"
            onClick={() => setConfigModalOpen(true)}
            className="w-8 h-8 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 inline-flex items-center justify-center text-xs text-slate-200 transition cursor-pointer"
            title="Cấu hình vai trò & thời gian"
            aria-label="Cấu hình vai trò & thời gian"
          >
            ⚙️
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            className="w-8 h-8 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 inline-flex items-center justify-center text-xs text-slate-200 transition cursor-pointer"
            title="Bật/Tắt âm thanh"
            aria-label="Bật/Tắt âm thanh"
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>

          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                void document.documentElement
                  .requestFullscreen()
                  .catch(() => {});
              } else {
                void document.exitFullscreen().catch(() => {});
              }
            }}
            className="hidden sm:inline-flex w-8 h-8 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 items-center justify-center text-xs text-slate-200 transition cursor-pointer"
            title="Toàn màn hình"
            aria-label="Toàn màn hình"
          >
            ⛶
          </button>

          {actor && (
            <div className="hidden sm:flex h-8 items-center gap-2 rounded-lg bg-slate-800/90 border border-slate-700 px-2.5">
              <span className="font-semibold text-sky-300 max-w-28 truncate">
                {actor.displayName}
              </span>
              <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">
                {actor.isGuest ? "Guest" : "Google"}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Error Toast */}
      {errorMsg && (
        <div className="mx-3 mt-2 rounded-xl border border-rose-500/40 bg-rose-950/70 px-3.5 py-2 text-xs font-medium text-rose-200 flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-300 hover:text-white font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Active Game Room Module */}
      {cartridgeId === "king-of-tokyo-duel" ? (
        <KingOfTokyoDuelRoom {...roomProps} />
      ) : cartridgeId === "dead-mans-draw" ? (
        <DeadMansDrawRoom {...roomProps} />
      ) : cartridgeId === "splendor-duel" ? (
        <SplendorDuelRoom {...roomProps} />
      ) : cartridgeId === "splendor" ? (
        <SplendorRoom {...roomProps} />
      ) : cartridgeId === "coup" ? (
        <CoupRoom {...roomProps} />
      ) : (
        <WerewolfRoom {...roomProps} />
      )}

      {/* Slide-Over Right Drawer: Chat & Event Log */}
      <RoomChatDrawer
        open={drawerOpen}
        tab={drawerTab}
        onChangeTab={setDrawerTab}
        onClose={() => setDrawerOpen(false)}
        snapshot={snapshot}
        isLobby={isLobby}
        busy={busy}
        sendRoomAction={sendRoomAction}
      />

      {/* Gear Icon Configuration Modal */}
      {configModalOpen && (
        <div
          onClick={() => setConfigModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[85vh] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-base">⚙️</span>
                <span className="font-bold text-sm text-white">
                  Cấu Hình Vai Trò & Thời Gian ({snapshot?.seats.length ?? 0}{" "}
                  người chơi)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    snapshot?.configValidation.valid
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-rose-500/20 text-rose-300"
                  }`}
                >
                  {snapshot?.configValidation.valid ? "Hợp lệ" : "Chưa khớp"}
                </span>
                <button
                  type="button"
                  onClick={() => setConfigModalOpen(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 font-bold text-slate-300 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartridgeId === "king-of-tokyo-duel" ? (
                <KingOfTokyoDuelConfigContent
                  snapshot={snapshot}
                  isLobby={isLobby}
                  busy={busy}
                  sendRoomAction={sendRoomAction}
                />
              ) : cartridgeId === "dead-mans-draw" ? (
                <DeadMansDrawConfigContent
                  snapshot={snapshot}
                  isLobby={isLobby}
                  busy={busy}
                  sendRoomAction={sendRoomAction}
                />
              ) : cartridgeId === "splendor-duel" ? (
                <SplendorDuelConfigContent />
              ) : cartridgeId === "splendor" ? (
                <SplendorConfigContent
                  snapshot={snapshot}
                  isLobby={isLobby}
                  busy={busy}
                  sendRoomAction={sendRoomAction}
                />
              ) : cartridgeId === "coup" ? (
                <CoupConfigContent />
              ) : (
                <WerewolfConfigContent
                  snapshot={snapshot}
                  isLobby={isLobby}
                  busy={busy}
                  sendRoomAction={sendRoomAction}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info 'i' Game Rules Modal */}
      {rulesModalOpen && (
        <div
          onClick={() => setRulesModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[88vh] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/75 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg border border-sky-500/40 bg-sky-500/15 flex items-center justify-center font-serif italic font-extrabold text-sm text-sky-300">
                  i
                </span>
                <div>
                  <h2 className="font-bold text-sm text-white">
                    {rulesMeta.title}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {rulesMeta.subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRulesModalOpen(false)}
                className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 font-bold text-slate-300 cursor-pointer"
              >
                Đóng ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cartridgeId === "king-of-tokyo-duel" ? (
                <KingOfTokyoDuelRulesContent />
              ) : cartridgeId === "dead-mans-draw" ? (
                <DeadMansDrawRulesContent />
              ) : cartridgeId === "splendor-duel" ? (
                <SplendorDuelRulesContent />
              ) : cartridgeId === "splendor" ? (
                <SplendorRulesContent />
              ) : cartridgeId === "coup" ? (
                <CoupRulesContent />
              ) : (
                <WerewolfRulesContent />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
