"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { listCartridges, type CatalogEntry } from "@/cartridges/registry";

interface ActorInfo {
  id: string;
  displayName: string;
  isGuest: boolean;
  email?: string | null;
  googleSub?: string | null;
}

export default function HomePage() {
  const router = useRouter();
  const cartridges: CatalogEntry[] = listCartridges();

  const [actor, setActor] = useState<ActorInfo | null>(null);
  const [googleOAuthConfigured, setGoogleOAuthConfigured] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [selectedCartridgeId, setSelectedCartridgeId] = useState("werewolf");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Google account upgrade modal (used when local .env doesn't have Google OAuth credentials yet)
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");

  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    fetch("/api/actor")
      .then((res) => res.json())
      .then((data) => {
        if (data.actor) {
          setActor(data.actor);
          setDisplayName(data.actor.displayName);
          setGoogleName(data.actor.displayName);
        }
        setGoogleOAuthConfigured(Boolean(data.googleOAuthConfigured));
      })
      .catch(() => {});
  }, []);

  // Subtle animated 2D Canvas header background (fireflies & moonlight)
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dots = Array.from({ length: 34 }, (_, i) => ({
      x: (i * 37) % 100,
      y: (i * 53) % 100,
      r: 1.2 + (i % 3),
      speed: 0.25 + (i % 5) * 0.12,
    }));

    const draw = (t: number) => {
      const parent = canvas.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        if (canvas.width !== Math.floor(rect.width)) {
          canvas.width = Math.floor(rect.width);
          canvas.height = Math.floor(rect.height);
        }
      }
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (const d of dots) {
        const px = ((d.x / 100) * w + Math.sin(t / 1200 + d.x) * 18 + w) % w;
        const py = ((d.y / 100) * h - ((t * d.speed) / 40) % h + h) % h;
        ctx.fillStyle = "rgba(251, 191, 36, 0.35)";
        ctx.beginPath();
        ctx.arc(px, py, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleSaveGuestName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg("Vui lòng nhập tên hiển thị của bạn.");
      return;
    }
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/actor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActor(data.actor);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Không thể lưu tên hiển thị.");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignInClick = () => {
    if (googleOAuthConfigured) {
      window.location.href = "/api/auth/google?returnTo=/";
    } else {
      setGoogleName(displayName || actor?.displayName || "");
      setShowGoogleModal(true);
    }
  };

  const handleGoogleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setErrorMsg("Vui lòng nhập email Google để liên kết.");
      return;
    }
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/actor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "google",
          email: googleEmail.trim(),
          displayName: googleName.trim() || displayName.trim() || "Người Chơi",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActor(data.actor);
      setDisplayName(data.actor.displayName);
      setShowGoogleModal(false);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Không thể liên kết tài khoản Google.");
    } finally {
      setBusy(false);
    }
  };

  const handleCreateRoom = async (cartridgeId = selectedCartridgeId) => {
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          cartridgeId,
          displayName: displayName.trim() || actor?.displayName || "Lữ Khách",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/rooms/${data.code}`);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Không thể tạo phòng chơi.");
      setBusy(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setErrorMsg("Vui lòng nhập mã phòng 6 ký tự.");
      return;
    }
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          code: roomCode.trim().toUpperCase(),
          displayName: displayName.trim() || actor?.displayName || "Lữ Khách",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/rooms/${data.code}`);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Không thể tham gia phòng chơi.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Actor Identity Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🐺</span>
            <div>
              <h1 className="text-sm font-extrabold tracking-wide text-amber-400 uppercase">
                BoardGame Arena VN
              </h1>
              <p className="text-[11px] text-slate-400">
                Nền tảng Đa Board Game • HTML5 2D Canvas • Quản trò Tự động
              </p>
            </div>
          </div>

          {/* Unified Actor Bar: Guest Nickname + Google Upgrade */}
          <div className="flex flex-wrap items-center gap-2.5">
            <form
              onSubmit={handleSaveGuestName}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tên hiển thị của bạn..."
                className="w-44 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition cursor-pointer"
              >
                Lưu tên
              </button>
            </form>

            {actor && !actor.isGuest ? (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                <span>✓ Google:</span>
                <span>{actor.email ?? actor.displayName}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignInClick}
                className="rounded-xl border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 px-3.5 py-1.5 text-xs font-semibold text-sky-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>G</span>
                <span>
                  {actor
                    ? "Liên kết Google (Giữ nguyên phiên)"
                    : "Đăng nhập Google"}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {errorMsg && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-950/70 px-4 py-3 text-xs font-medium text-rose-200 flex items-center justify-between">
            <span>⚠️ {errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-rose-300 hover:text-white font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Hero Section with Canvas Background + Create / Join Room Actions */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/95 to-indigo-950/70 p-6 md:p-8 shadow-2xl">
          <canvas
            ref={heroCanvasRef}
            className="pointer-events-none absolute inset-0 w-full h-full"
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">
                ✨ Kiến trúc Platform Core + Game Cartridge
              </span>
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Chơi <span className="text-amber-400">Ma Sói</span> & Board Game
                trực tiếp trên bàn cờ <span className="text-sky-400">Canvas 2D</span>
              </h2>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Không cần người hy sinh làm Quản trò. Mỗi người chơi cầm 1 điện
                thoại hoặc máy tính, hệ thống tự động chia bài mật, điều phối
                pha Đêm/Ngày, lọc thông tin ẩn chống gian lận trên server và vẽ
                bàn chơi động 60fps.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleCreateRoom("werewolf")}
                  className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-xl transition cursor-pointer disabled:opacity-50"
                >
                  🔥 Tạo Phòng Ma Sói Mới
                </button>
              </div>
            </div>

            {/* Quick Join Room Card */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-950/85 p-5 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Vào Phòng Bằng Mã Mời
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Nhập mã phòng 6 ký tự từ bạn bè để ngồi vào bàn ngay lập tức
                </p>
              </div>

              <form onSubmit={handleJoinRoom} className="space-y-3">
                <input
                  type="text"
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="VD: WOLF88"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-center font-mono text-lg font-bold tracking-widest uppercase text-amber-300 placeholder:text-slate-600 focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-xl bg-sky-600 hover:bg-sky-500 py-3 text-xs font-bold uppercase tracking-wider text-white shadow transition cursor-pointer disabled:opacity-50"
                >
                  Tham Gia Phòng Chơi →
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Extensible Multi-Board-Game Cartridge Catalog */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="text-lg font-extrabold text-white">
                Kho Trò Chơi (`Game Cartridges`)
              </h3>
              <p className="text-xs text-slate-400">
                Mỗi tựa game là một module độc lập gắn vào Platform Core mà
                không cần thay đổi cấu trúc Database hay hệ thống phòng chờ.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cartridges.map((item) => {
              const isSelected = selectedCartridgeId === item.cartridgeId;
              return (
                <div
                  key={item.cartridgeId}
                  onClick={() => {
                    if (!item.available || busy) return;
                    setSelectedCartridgeId(item.cartridgeId);
                    void handleCreateRoom(item.cartridgeId);
                  }}
                  className={`rounded-2xl border p-5 transition flex flex-col justify-between gap-3 ${
                    item.available
                      ? isSelected
                        ? "border-amber-500/70 bg-slate-900/95 shadow-lg shadow-amber-500/5 hover:border-amber-400 cursor-pointer"
                        : "border-slate-800 bg-slate-900/70 hover:border-slate-700 cursor-pointer"
                      : "border-slate-800/60 bg-slate-900/40 opacity-65"
                  }`}
                >
                  <div className="space-y-1.5">
                    <h4 className="text-base font-extrabold text-white">
                      {item.title}
                    </h4>
                    <p className="text-xs font-medium text-amber-300/90">
                      {item.genreVi}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-800/80 text-xs text-slate-400 font-medium">
                    👥 {item.minSeats}–{item.maxSeats} người chơi
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Google In-Place Account Upgrade Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Liên kết Tài khoản Google (`Unified Actor`)
              </h3>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tài khoản Guest hiện tại của bạn sẽ được nâng cấp trực tiếp lên
              tài khoản Google mà <strong>không làm mất mã định danh Actor</strong>{" "}
              hay ghế đang ngồi trong phòng chơi.
            </p>
            <form onSubmit={handleGoogleUpgradeSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Google
                </label>
                <input
                  type="email"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="ban@gmail.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-sky-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  required
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="Tên hiển thị trong bàn chơi"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-sky-400 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  Xác nhận Liên kết Google
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
