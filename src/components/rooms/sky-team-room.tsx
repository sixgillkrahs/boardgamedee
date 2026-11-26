"use client";

import React, { useState } from "react";
import { SkyTeamCanvas } from "@/components/sky-team-canvas";
import {
  SKY_TEAM_AIRPORT_IDS,
  SKY_TEAM_AIRPORTS,
  type SkyTeamAirportId,
  type SkyTeamConfig,
  type SkyTeamPlayerView,
} from "@/cartridges/sky-team";
import {
  SharedLobbySidebar,
  SidebarDrawerButtons,
} from "./shared-lobby-sidebar";
import type { GameConfigModalProps, GameRoomModuleProps } from "./types";

export function SkyTeamRoom({
  snapshot,
  isLobby,
  busy,
  soundEnabled,
  isExpanded,
  sendRoomAction,
  onOpenDrawer,
}: GameRoomModuleProps) {
  const skyView: SkyTeamPlayerView | null = snapshot?.playerView
    ? (snapshot.playerView as SkyTeamPlayerView)
    : null;

  const lobbyCfg = (snapshot?.room.config ?? {}) as Partial<SkyTeamConfig>;
  const lobbyAirportId: SkyTeamAirportId =
    lobbyCfg.airportId && SKY_TEAM_AIRPORTS[lobbyCfg.airportId]
      ? lobbyCfg.airportId
      : "montreal";
  const lobbySwapRoles = Boolean(lobbyCfg.swapRoles);

  const actionKey = `${skyView?.actionSeq ?? 0}-${skyView?.roundNumber ?? 0}-${skyView?.step ?? ""}`;
  const [selectionState, setSelectionState] = useState<{
    key: string;
    selectedDieIndex: number | null;
    rerollMode: boolean;
    rerollIndices: number[];
  }>({
    key: actionKey,
    selectedDieIndex: null,
    rerollMode: false,
    rerollIndices: [],
  });

  const isSameKey = selectionState.key === actionKey;
  const selectedDieIndex = isSameKey ? selectionState.selectedDieIndex : null;
  const rerollMode = isSameKey ? selectionState.rerollMode : false;
  const rerollIndices = isSameKey ? selectionState.rerollIndices : [];

  const setSelectedDieIndex = (idx: number | null) =>
    setSelectionState({
      key: actionKey,
      selectedDieIndex: idx,
      rerollMode: false,
      rerollIndices: [],
    });

  const setRerollMode = (active: boolean) =>
    setSelectionState({
      key: actionKey,
      selectedDieIndex: null,
      rerollMode: active,
      rerollIndices: [],
    });

  const setRerollIndices = (updater: number[] | ((prev: number[]) => number[])) =>
    setSelectionState((prev) => {
      const current = prev.key === actionKey ? prev.rerollIndices : [];
      const next = typeof updater === "function" ? updater(current) : updater;
      return {
        key: actionKey,
        selectedDieIndex: null,
        rerollMode: true,
        rerollIndices: next,
      };
    });

  const toggleRerollDie = (idx: number) => {
    setRerollIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleConfirmReroll = () => {
    if (rerollIndices.length === 0) return;
    void sendRoomAction({
      type: "MATCH_COMMAND",
      command: { type: "USE_REROLL", dieIndices: rerollIndices },
    });
    setRerollMode(false);
    setRerollIndices([]);
  };

  const showLobbySidebar = isLobby || !skyView;

  return (
    <main
      className={`relative flex-1 min-h-0 flex flex-col lg:flex-row w-full gap-2 ${
        isExpanded ? "p-0" : "p-1.5 sm:p-2"
      }`}
    >
      <div
        className={`flex-1 relative min-h-[380px] ${
          isExpanded
            ? "h-full"
            : showLobbySidebar
              ? "h-[58vh] sm:h-[64vh] lg:h-[calc(100vh-62px)] lg:min-h-[600px]"
              : "h-[calc(100dvh-54px)] min-h-[540px]"
        }`}
      >
        <SkyTeamCanvas
          mode={isLobby ? "lobby" : "match"}
          lobbySeats={snapshot?.seats ?? []}
          lobbyAirportId={lobbyAirportId}
          lobbySwapRoles={lobbySwapRoles}
          isHost={Boolean(snapshot?.isHost)}
          viewerSeatNo={snapshot?.viewerSeatNo ?? null}
          playerView={skyView}
          selectedDieIndex={selectedDieIndex}
          rerollMode={rerollMode}
          rerollSelectedIndices={rerollIndices}
          soundEnabled={soundEnabled}
          onSelectDie={setSelectedDieIndex}
          onToggleRerollDie={toggleRerollDie}
          onStartRerollMode={() => {
            setSelectedDieIndex(null);
            setRerollMode(true);
            setRerollIndices([]);
          }}
          onCancelRerollMode={() => {
            setRerollMode(false);
            setRerollIndices([]);
          }}
          onConfirmReroll={handleConfirmReroll}
          onRematch={() => {
            if (!snapshot?.isHost || busy) return;
            void sendRoomAction({ type: "REMATCH" });
          }}
          onSwapRoles={() => {
            if (!snapshot?.isHost || !isLobby || busy) return;
            void sendRoomAction({
              type: "UPDATE_CONFIG",
              config: {
                airportId: lobbyAirportId,
                swapRoles: !lobbySwapRoles,
              },
            });
          }}
          onDispatchCommand={(cmd) =>
            void sendRoomAction({ type: "MATCH_COMMAND", command: cmd })
          }
        />
      </div>

      {showLobbySidebar && (
        <aside className="w-full lg:w-76 xl:w-84 lg:max-h-[calc(100vh-62px)] lg:overflow-y-auto shrink-0 rounded-2xl border border-slate-800 bg-slate-900/95 p-3 sm:p-4 shadow-xl flex flex-col justify-between gap-3">
          <SharedLobbySidebar
            snapshot={snapshot}
            busy={busy}
            title={`Sky Team (${snapshot?.seats.length ?? 0}/2 phi công)`}
            defaultRequirementHint="Cần đúng 2 người chơi (hoặc thêm 1 Bot làm đồng đội) để cất cánh."
            sendRoomAction={sendRoomAction}
          />
          <SidebarDrawerButtons
            messagesCount={snapshot?.messages.length ?? 0}
            onOpenDrawer={onOpenDrawer}
          />
        </aside>
      )}
    </main>
  );
}

export function SkyTeamConfigContent({
  snapshot,
  isLobby,
  busy,
  sendRoomAction,
}: GameConfigModalProps) {
  const cfg = (snapshot?.room.config ?? {
    airportId: "montreal",
    swapRoles: false,
  }) as SkyTeamConfig;

  const canEdit = Boolean(snapshot?.isHost && isLobby);

  const updateConfig = (patch: Partial<SkyTeamConfig>) => {
    if (!canEdit || busy) return;
    void sendRoomAction({
      type: "UPDATE_CONFIG",
      config: { ...cfg, ...patch },
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-bold text-white text-xs">
          Chọn Sân Bay & Độ Khó
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SKY_TEAM_AIRPORT_IDS.map((id) => {
            const ap = SKY_TEAM_AIRPORTS[id];
            const active = cfg.airportId === id;
            return (
              <button
                key={id}
                type="button"
                disabled={!canEdit || busy}
                onClick={() => updateConfig({ airportId: id })}
                className={`text-left rounded-xl border p-3 transition ${
                  active
                    ? "border-sky-400 bg-sky-500/15"
                    : "border-slate-800 bg-slate-950/70 hover:border-slate-700"
                } ${canEdit ? "cursor-pointer" : "opacity-75 cursor-default"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-white">
                    {ap.code} • {ap.nameVi}
                  </span>
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: `${ap.accentColor}26`,
                      color: ap.accentColor,
                    }}
                  >
                    {ap.difficultyVi}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400 leading-snug">
                  {ap.descriptionVi}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 flex items-center justify-between gap-3">
        <div>
          <div className="font-bold text-white text-xs">
            Đổi ghế Cơ trưởng / Cơ phó
          </div>
          <p className="text-[11px] text-slate-400">
            Mặc định Ghế #1 là Cơ trưởng (Xanh), Ghế #2 là Cơ phó (Cam).
          </p>
        </div>
        <button
          type="button"
          disabled={!canEdit || busy}
          onClick={() => updateConfig({ swapRoles: !cfg.swapRoles })}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition ${
            cfg.swapRoles
              ? "border-amber-400 bg-amber-500/20 text-amber-200"
              : "border-slate-700 bg-slate-800 text-slate-300"
          } ${canEdit ? "cursor-pointer" : "opacity-60"}`}
        >
          {cfg.swapRoles ? "Đã đảo ghế" : "Mặc định"}
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 flex items-center justify-between gap-3">
        <div>
          <div className="font-bold text-white text-xs">
            🌬️ Module Gió (Wind Module)
          </div>
          <p className="text-[11px] text-slate-400">
            Cộng/trừ tốc độ Động Cơ (+3 đến -3) theo hướng gió; vòng gió xoay
            theo độ nghiêng Trục Cánh mỗi vòng!
          </p>
        </div>
        <button
          type="button"
          disabled={!canEdit || busy}
          onClick={() =>
            updateConfig({ enableWindModule: !cfg.enableWindModule })
          }
          className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition ${
            cfg.enableWindModule
              ? "border-sky-400 bg-sky-500/20 text-sky-200"
              : "border-slate-700 bg-slate-800 text-slate-300"
          } ${canEdit ? "cursor-pointer" : "opacity-60"}`}
        >
          {cfg.enableWindModule ? "Đang bật" : "Tắt"}
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 flex items-center justify-between gap-3">
        <div>
          <div className="font-bold text-white text-xs">
            🎓 Module Thực Tập Sinh (Intern)
          </div>
          <p className="text-[11px] text-slate-400">
            Gắn thanh Thực Tập Sinh dưới đáy bàn chơi — phải huấn luyện đủ 6 dấu
            ✓ xanh trước khi hạ cánh!
          </p>
        </div>
        <button
          type="button"
          disabled={!canEdit || busy}
          onClick={() =>
            updateConfig({ enableInternModule: !cfg.enableInternModule })
          }
          className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition ${
            cfg.enableInternModule
              ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
              : "border-slate-700 bg-slate-800 text-slate-300"
          } ${canEdit ? "cursor-pointer" : "opacity-60"}`}
        >
          {cfg.enableInternModule ? "Đang bật" : "Tắt"}
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 flex items-center justify-between gap-3">
        <div>
          <div className="font-bold text-white text-xs">
            ⛽ Module Nhiên Liệu (Kerosene)
          </div>
          <p className="text-[11px] text-slate-400">
            Bắt đầu với 20 nhiên liệu; cuối mỗi vòng trừ theo số xúc xắc đặt vào
            ô xe bồn (nếu bỏ trống bị rò rỉ -6)!
          </p>
        </div>
        <button
          type="button"
          disabled={!canEdit || busy}
          onClick={() =>
            updateConfig({ enableFuelModule: !cfg.enableFuelModule })
          }
          className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition ${
            cfg.enableFuelModule
              ? "border-amber-400 bg-amber-500/20 text-amber-200"
              : "border-slate-700 bg-slate-800 text-slate-300"
          } ${canEdit ? "cursor-pointer" : "opacity-60"}`}
        >
          {cfg.enableFuelModule ? "Đang bật" : "Tắt"}
        </button>
      </div>
    </div>
  );
}

export function SkyTeamRulesContent() {
  return (
    <div className="space-y-4 text-slate-200 leading-relaxed">
      <section className="space-y-1.5">
        <h3 className="font-extrabold text-sky-300 text-sm">
          1. Mục tiêu Hợp tác (Co-op 2 Người)
        </h3>
        <p>
          Hai người chơi vào vai <strong>Cơ trưởng (Xanh dương)</strong> và{" "}
          <strong>Cơ phó (Cam)</strong> cùng phối hợp điều khiển một chuyến bay
          thương mại hạ độ cao qua <strong>7 vòng (6000 ft → 0 ft)</strong> để
          hạ cánh an toàn xuống đường băng. Hai bạn cùng thắng hoặc cùng thua!
        </p>
      </section>

      <section className="space-y-1.5">
        <h3 className="font-extrabold text-amber-300 text-sm">
          2. Quy trình mỗi vòng & Im Lặng Vô Tuyến
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Thảo luận chiến thuật:</strong> Trước khi tung xúc xắc, hai
            người được chat tự do để thống nhất kế hoạch (ví dụ: ưu tiên dọn
            máy bay, mở Càng/Cánh tà, hay tiến 1 ô).
          </li>
          <li>
            <strong>Tung xúc xắc bí mật & Im lặng vô tuyến:</strong> Mỗi người
            tung 4 viên xúc xắc sau vách ngăn (đồng đội không thấy số của bạn).
            Kênh chat bị khóa trong suốt pha đặt xúc xắc!
          </li>
          <li>
            <strong>Luân phiên đặt xúc xắc:</strong> Lần lượt từng người đặt 1
            viên xúc xắc lên bảng điều khiển cho đến khi hết 8 viên. Vòng lẻ Cơ
            trưởng đi trước, vòng chẵn Cơ phó đi trước.
          </li>
        </ul>
      </section>

      <section className="space-y-1.5">
        <h3 className="font-extrabold text-emerald-300 text-sm">
          3. Các khu vực trên Buồng Lái
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Trục Cánh (Bắt buộc mỗi vòng):</strong> Khi cả 2 đặt xong,
            máy bay nghiêng theo hiệu số giữa 2 xúc xắc. Nếu nghiêng tới{" "}
            <strong>±3</strong> → lật cánh và thua ngay!
          </li>
          <li>
            <strong>Động Cơ (Bắt buộc mỗi vòng):</strong> Tổng 2 xúc xắc quyết
            định số ô tiến trên Đường Tiếp Cận: <code>≤ Ngưỡng Xanh</code> tiến
            0 ô; <code>Ngưỡng Xanh &lt; Tổng ≤ Ngưỡng Cam</code> tiến 1 ô;{" "}
            <code>&gt; Ngưỡng Cam</code> tiến 2 ô. Nếu tiến qua ô còn máy bay
            hoặc bay lố sân bay → thua ngay!
          </li>
          <li>
            <strong>Radio (Cơ trưởng 1 ô, Cơ phó 2 ô):</strong> Xóa 1 máy bay ở
            ô cách vị trí hiện tại đúng <code>(giá trị xúc xắc - 1)</code> ô (số
            1 dọn ngay ô hiện tại).
          </li>
          <li>
            <strong>Càng Hạ Cánh (Cơ trưởng):</strong> 3 công tắc{" "}
            <code>1–2</code>, <code>3–4</code>, <code>5–6</code> (bật thứ tự bất
            kỳ). Mỗi công tắc tăng Ngưỡng Xanh +1.
          </li>
          <li>
            <strong>Cánh Tà (Cơ phó):</strong> 4 công tắc{" "}
            <code>1–2 → 2–3 → 4–5 → 5–6</code> (<strong>bắt buộc theo thứ tự</strong>
            ). Mỗi công tắc tăng Ngưỡng Cam +1.
          </li>
          <li>
            <strong>Phanh (Cơ trưởng):</strong> 3 công tắc{" "}
            <code>2 → 4 → 6</code> (<strong>bắt buộc theo thứ tự</strong>) nâng
            lực phanh khi chạm đất.
          </li>
          <li>
            <strong>Cà Phê (Dùng chung):</strong> Đặt bất kỳ xúc xắc nào để lấy
            +1 ☕ (tối đa 3). Có thể tiêu ☕ để chỉnh số xúc xắc lên/xuống ±1 mỗi
            ly khi đặt.
          </li>
        </ul>
      </section>

      <section className="space-y-1.5">
        <h3 className="font-extrabold text-emerald-400 text-sm">
          4. Điều kiện Hạ Cánh An Toàn (Vòng 7 — 0 FT)
        </h3>
        <p>Để chiến thắng khi kết thúc vòng 0 ft, cả 5 điều kiện phải đạt:</p>
        <ol className="list-decimal pl-5 space-y-0.5">
          <li>Máy bay đang ở đúng ô Sân bay và không còn máy bay cản đường.</li>
          <li>Trục Cánh cân bằng hoàn hảo (<strong>0°</strong>).</li>
          <li>Đã mở đủ cả <strong>3 Càng Hạ Cánh</strong>.</li>
          <li>Đã mở đủ cả <strong>4 Cánh Tà</strong>.</li>
          <li>
            Tổng 2 xúc xắc Động Cơ ở vòng 0 ft <strong>≤ Lực Phanh</strong>.
          </li>
        </ol>
      </section>
    </div>
  );
}
