import { NextResponse } from "next/server";
import {
  createOrUpdateGuestActor,
  upgradeOrSignInGoogleActor,
} from "@/platform/coordinator";
import {
  getCurrentActor,
  setActorCookie,
} from "@/platform/session";

export async function GET() {
  try {
    const actor = await getCurrentActor();
    return NextResponse.json({
      actor,
      googleOAuthConfigured: Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Lỗi tải thông tin người chơi" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const current = await getCurrentActor();

    if (body.mode === "google") {
      const email = String(body.email ?? "").trim() || "player@gmail.com";
      const displayName =
        String(body.displayName ?? "").trim() ||
        email.split("@")[0] ||
        "Người Chơi Google";
      const googleSub = `google:${email.toLowerCase()}`;

      const actor = await upgradeOrSignInGoogleActor({
        currentActorId: current?.id ?? null,
        googleSub,
        email,
        displayName,
      });
      await setActorCookie(actor.id);
      return NextResponse.json({ actor });
    }

    const displayName = String(body.displayName ?? "").trim();
    if (!displayName) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên hiển thị của bạn." },
        { status: 400 }
      );
    }

    const actor = await createOrUpdateGuestActor({
      actorId: current?.id ?? null,
      displayName,
    });
    await setActorCookie(actor.id);
    return NextResponse.json({ actor });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Không thể cập nhật danh tính" },
      { status: 400 }
    );
  }
}
