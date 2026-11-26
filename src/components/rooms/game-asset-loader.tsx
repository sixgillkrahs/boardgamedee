"use client";

import React, { useEffect, useState } from "react";

interface AssetItem {
  url: string;
  labelVi: string;
}

interface CartridgeAssetPack {
  titleVi: string;
  assets: AssetItem[];
}

const CARTRIDGE_ASSETS: Record<string, CartridgeAssetPack> = {
  carcassonne: {
    titleVi: "Carcassonne",
    assets: [
      { url: "/sprites/carcassonne-tiles.webp", labelVi: "Bản đồ 84 mảnh đất & sông" },
      { url: "/sprites/carcassonne-meeples.png", labelVi: "Bộ quân Meeple & Tu viện trưởng" },
      { url: "/sprites/carcassonne-tile-back.png", labelVi: "Mặt lưng chồng mảnh đất" },
      { url: "/sprites/carcassonne-lobby-bg.webp", labelVi: "Ảnh nền sảnh Carcassonne" },
    ],
  },
  "one-night-werewolf": {
    titleVi: "One Night Ultimate Werewolf",
    assets: [
      { url: "/sprites/onuw-cards-pixel.png", labelVi: "Bộ 12 vai trò & mặt lưng thẻ" },
      { url: "/covers/one-night-werewolf-cover.jpg", labelVi: "Ảnh bìa Ma Sói Một Đêm" },
    ],
  },
  "sky-team": {
    titleVi: "Sky Team",
    assets: [
      { url: "/sprites/sky-team-board.png", labelVi: "Bảng điều khiển buồng lái" },
      { url: "/sprites/sky-team-airports.png", labelVi: "Bản đồ đường bay & sân bay" },
      { url: "/sprites/sky-team-altitude.png", labelVi: "Thước độ cao hạ cánh" },
      { url: "/sprites/sky-team-dice.png", labelVi: "Bộ xúc xắc Cơ trưởng & Cơ phó" },
      { url: "/sprites/sky-team-role-pilot.png", labelVi: "Bảng vai trò Cơ trưởng" },
      { url: "/sprites/sky-team-role-copilot.png", labelVi: "Bảng vai trò Cơ phó" },
      { url: "/sprites/sky-team-bg.jpg", labelVi: "Nền buồng lái" },
      { url: "/sprites/sky-team-axis-plane.png", labelVi: "Mô hình thăng bằng cánh" },
      { url: "/sprites/sky-team-switch.png", labelVi: "Công tắc hệ thống" },
      { url: "/sprites/sky-team-tokens.png", labelVi: "Token Cà phê & Đổi xúc xắc" },
      { url: "/sprites/sky-team-markers.png", labelVi: "Điểm đánh dấu phanh & cánh tà" },
      { url: "/sprites/sky-team-fuel.png", labelVi: "Module nhiên liệu" },
      { url: "/sprites/sky-team-fuel-marker.png", labelVi: "Kim nhiên liệu" },
      { url: "/sprites/sky-team-wind.png", labelVi: "Module gió ngang" },
      { url: "/sprites/sky-team-wind-plane.png", labelVi: "Biểu tượng hướng gió" },
      { url: "/sprites/sky-team-intern.png", labelVi: "Module thực tập sinh" },
      { url: "/sprites/sky-team-intern-badges.png", labelVi: "Huy hiệu thực tập sinh" },
      { url: "/sprites/sky-team-intern-marker.png", labelVi: "Điểm thực tập sinh" },
    ],
  },
  "king-of-tokyo-duel": {
    titleVi: "King of Tokyo: Duel",
    assets: [
      { url: "/sprites/kot-duel-board-map-pixel.png", labelVi: "Bản đồ Tokyo" },
      { url: "/sprites/kot-duel-boards-pixel.png", labelVi: "Bảng quái thú Kaiju" },
      { url: "/sprites/kot-duel-power-cards-vi.webp", labelVi: "Thẻ sức mạnh Việt hóa" },
      { url: "/sprites/kot-duel-monsters-pixel.png", labelVi: "Nhân vật Kaiju" },
      { url: "/sprites/kot-duel-buzz-tiles-pixel.png", labelVi: "Mảnh Buzz đặc biệt" },
      { url: "/sprites/kot-duel-hp-dials-pixel.png", labelVi: "Đồng hồ máu HP" },
      { url: "/sprites/kot-duel-card-back-pixel.png", labelVi: "Mặt lưng thẻ bài" },
      { url: "/sprites/kot-duel-lobby-bg.webp", labelVi: "Ảnh nền sảnh Tokyo" },
      { url: "/sprites/kot-duel-match-bg.webp", labelVi: "Ảnh nền trận đấu" },
      { url: "/sprites/kot-duel-buzz-medallions-pixel.png", labelVi: "Huy hiệu Buzz" },
      { url: "/sprites/kot-duel-dice-pixel.png", labelVi: "Xúc xắc Đỏ & Trắng" },
      { url: "/sprites/kot-duel-energy-cube-pixel.png", labelVi: "Khối năng lượng" },
      { url: "/sprites/kot-duel-icons-pixel.png", labelVi: "Biểu tượng chiến đấu" },
      { url: "/sprites/kot-duel-tokens-pixel.png", labelVi: "Token đặc biệt" },
    ],
  },
  heat: {
    titleVi: "Heat: Pedal to the Metal",
    assets: [
      { url: "/sprites/heat-cards-atlas.jpg", labelVi: "Bộ bài tốc độ & nhiệt" },
      { url: "/sprites/heat-player-mat.jpg", labelVi: "Bảng điều khiển xe đua" },
      { url: "/sprites/heat-track-usa.jpg", labelVi: "Đường đua USA" },
      { url: "/sprites/heat-track-south-africa.jpg", labelVi: "Đường đua South Africa" },
      { url: "/sprites/heat-track-deutschland.jpg", labelVi: "Đường đua Deutschland" },
    ],
  },
  "imploding-kittens": {
    titleVi: "Imploding Kittens",
    assets: [
      { url: "/sprites/ik-atlas-core.webp", labelVi: "Bộ bài Mèo Nổ gốc" },
      { url: "/sprites/ik-atlas-zombie.webp", labelVi: "Bản mở rộng Zombie" },
      { url: "/sprites/ik-atlas-barking.webp", labelVi: "Bản mở rộng Barking" },
      { url: "/sprites/ik-atlas-good-vs-evil.webp", labelVi: "Bản mở rộng Good vs. Evil" },
      { url: "/sprites/ik-atlas-imploding.webp", labelVi: "Bản mở rộng Imploding" },
      { url: "/sprites/ik-atlas-streaking.webp", labelVi: "Bản mở rộng Streaking" },
      { url: "/sprites/ik-lobby-bg.webp", labelVi: "Ảnh nền sảnh Mèo Nổ" },
      { url: "/sprites/imploding-kittens-logo.jpg", labelVi: "Biểu tượng trò chơi" },
    ],
  },
  "splendor-duel": {
    titleVi: "Splendor Duel",
    assets: [
      { url: "/sprites/splendor-duel-cards-pixel.png", labelVi: "Bộ thẻ đá quý & quý tộc" },
      { url: "/sprites/splendor-duel-tokens-pixel.png", labelVi: "Ngọc trai & token đá quý" },
    ],
  },
  "dead-mans-draw": {
    titleVi: "Dead Man's Draw",
    assets: [
      { url: "/sprites/dead-mans-draw-cards-pixel.png", labelVi: "Bộ 60 lá kho báu hải tặc" },
    ],
  },
  coup: {
    titleVi: "Coup",
    assets: [
      { url: "/sprites/coup-cards-pixel.png", labelVi: "Bộ thẻ nhân vật hoàng gia" },
      { url: "/sprites/coup-coin-pixel.png", labelVi: "Xu vàng kho bạc" },
    ],
  },
  splendor: {
    titleVi: "Splendor",
    assets: [{ url: "/covers/splendor-pixel.png", labelVi: "Tài nguyên Splendor" }],
  },
  werewolf: {
    titleVi: "Làng Ma Sói",
    assets: [{ url: "/covers/werewolf-cover.webp", labelVi: "Tài nguyên Làng Ma Sói" }],
  },
};

/** Session-level cache so re-entering or re-rendering an already loaded game is instant */
const preloadedCartridgeCache = new Set<string>();

function preloadSingleImage(url: string, timeoutMs = 12000): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve();
    };
    const timer = window.setTimeout(finish, timeoutMs);

    const img = new Image();
    img.onload = () => {
      if (typeof img.decode === "function") {
        img.decode().then(finish).catch(finish);
      } else {
        finish();
      }
    };
    img.onerror = finish;
    img.src = url;
  });
}

export interface GameAssetLoaderState {
  ready: boolean;
  percent: number;
  messageVi: string;
  loadedCount: number;
  totalCount: number;
  titleVi: string;
}

export function useGameAssetPreloader(
  cartridgeId: string | null,
  hasSnapshot: boolean
): GameAssetLoaderState {
  const pack = cartridgeId ? CARTRIDGE_ASSETS[cartridgeId] : undefined;
  const alreadyCached = Boolean(
    hasSnapshot && cartridgeId && preloadedCartridgeCache.has(cartridgeId)
  );

  const [state, setState] = useState<{
    cartridgeId: string | null;
    ready: boolean;
    percent: number;
    messageVi: string;
    loadedCount: number;
    totalCount: number;
  }>(() => ({
    cartridgeId,
    ready: alreadyCached,
    percent: alreadyCached ? 100 : 6,
    messageVi: alreadyCached
      ? "Sẵn sàng vào bàn!"
      : "Đang kết nối tới phòng chơi…",
    loadedCount: alreadyCached ? (pack?.assets.length ?? 0) : 0,
    totalCount: pack?.assets.length ?? 0,
  }));

  useEffect(() => {
    if (!hasSnapshot || !cartridgeId) return;
    if (preloadedCartridgeCache.has(cartridgeId)) return;

    let cancelled = false;
    const assets = CARTRIDGE_ASSETS[cartridgeId]?.assets ?? [];
    const total = assets.length;
    let completed = 0;
    let doneTimer: number | null = null;

    if (total === 0) {
      preloadedCartridgeCache.add(cartridgeId);
      doneTimer = window.setTimeout(() => {
        if (cancelled) return;
        setState({
          cartridgeId,
          ready: true,
          percent: 100,
          messageVi: "Sẵn sàng vào bàn!",
          loadedCount: 0,
          totalCount: 0,
        });
      }, 0);
      return () => {
        cancelled = true;
        if (doneTimer !== null) window.clearTimeout(doneTimer);
      };
    }

    Promise.all(
      assets.map((asset) =>
        preloadSingleImage(asset.url).then(() => {
          if (cancelled) return;
          completed += 1;
          const pct = Math.min(99, 12 + Math.round((completed / total) * 87));
          setState({
            cartridgeId,
            ready: false,
            percent: completed >= total ? 100 : pct,
            messageVi:
              completed >= total
                ? "Hoàn tất tải tài nguyên! Đang vào bàn chơi…"
                : `Đã tải ${asset.labelVi} (${completed}/${total})`,
            loadedCount: completed,
            totalCount: total,
          });
        })
      )
    ).then(() => {
      if (cancelled) return;
      preloadedCartridgeCache.add(cartridgeId);
      setState({
        cartridgeId,
        ready: false,
        percent: 100,
        messageVi: "Hoàn tất tải tài nguyên! Đang vào bàn chơi…",
        loadedCount: total,
        totalCount: total,
      });
      doneTimer = window.setTimeout(() => {
        if (cancelled) return;
        setState((prev) => ({ ...prev, ready: true, percent: 100 }));
      }, 220);
    });

    return () => {
      cancelled = true;
      if (doneTimer !== null) window.clearTimeout(doneTimer);
    };
  }, [cartridgeId, hasSnapshot]);

  const isMatched = state.cartridgeId === cartridgeId && hasSnapshot;
  const firstAssetLabel = pack?.assets[0]?.labelVi;
  const defaultPendingMsg =
    hasSnapshot && firstAssetLabel
      ? `Đang tải ${firstAssetLabel}… (0/${pack.assets.length})`
      : "Đang kết nối tới phòng chơi…";
  return {
    ready: alreadyCached || (isMatched && state.ready),
    percent: alreadyCached ? 100 : isMatched ? state.percent : hasSnapshot ? 12 : 6,
    messageVi: alreadyCached
      ? "Sẵn sàng vào bàn!"
      : isMatched
        ? state.messageVi
        : defaultPendingMsg,
    loadedCount: isMatched ? state.loadedCount : 0,
    totalCount: pack?.assets.length ?? state.totalCount,
    titleVi: pack?.titleVi ?? "BoardGameDee",
  };
}

export function GameLoadingOverlay({
  loader,
}: {
  loader: GameAssetLoaderState;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-400/30 bg-slate-900/90 p-6 shadow-2xl text-center space-y-4">
        <div className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
            Đang tải trò chơi
          </div>
          <h2 className="text-lg font-extrabold text-white tracking-wide">
            {loader.titleVi}
          </h2>
          <p className="text-xs text-slate-300 min-h-[18px]">
            {loader.messageVi}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-3 rounded-full bg-slate-800 border border-slate-700/80 overflow-hidden p-0.5">
            <div
              style={{ width: `${Math.max(4, Math.min(100, loader.percent))}%` }}
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 transition-[width] duration-200 ease-out shadow-[0_0_12px_rgba(251,191,36,0.65)]"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">
              {loader.totalCount > 0
                ? `Tài nguyên: ${loader.loadedCount}/${loader.totalCount}`
                : "Đang khởi tạo…"}
            </span>
            <span className="font-extrabold text-amber-300 text-sm">
              {loader.percent}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
