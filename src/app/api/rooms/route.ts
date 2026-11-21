import { NextResponse } from "next/server";
import {
  createOrUpdateGuestActor,
  createRoom,
  joinRoom,
} from "@/platform/coordinator";
import {
  getCurrentActor,
  setActorCookie,
} from "@/platform/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const displayName = String(body.displayName ?? "").trim();

    let actor = await getCurrentActor();
    if (!actor || (displayName && displayName !== actor.displayName)) {
      actor = await createOrUpdateGuestActor({
        actorId: actor?.id ?? null,
        displayName: displayName || actor?.displayName || "Lữ Khách",
      });
      await setActorCookie(actor.id);
    }

    if (body.action === "join") {
      const code = String(body.code ?? "").trim().toUpperCase();
      if (!code) {
        return NextResponse.json(
          { error: "Vui lòng nhập mã phòng." },
          { status: 400 }
        );
      }
      const { room } = await joinRoom({ code, actorId: actor.id });
      return NextResponse.json({ code: room.code, actor });
    }

    const cartridgeId = String(body.cartridgeId ?? "werewolf");
    const room = await createRoom({
      hostActorId: actor.id,
      cartridgeId,
    });
    return NextResponse.json({ code: room.code, actor });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Không thể xử lý yêu cầu phòng chơi." },
      { status: 400 }
    );
  }
}
