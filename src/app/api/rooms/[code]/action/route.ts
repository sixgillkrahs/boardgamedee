import { NextResponse } from "next/server";
import {
  addBotSeat,
  findRoomByCode,
  getActorById,
  getRoomSnapshotForActor,
  joinRoom,
  leaveRoom,
  postChannelMessage,
  removeSeatFromRoom,
  returnRoomToLobby,
  startMatch,
  submitMatchCommandAndGetSnapshot,
  updateRoomConfig,
} from "@/platform/coordinator";
import {
  ensureCurrentActor,
  getCurrentActor,
  getVerifiedActorIdFromCookie,
} from "@/platform/session";
import type { ChannelId } from "@/cartridges/types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const actor = await getCurrentActor();
    const snapshot = await getRoomSnapshotForActor({
      code,
      actorId: actor?.id ?? null,
    });
    return NextResponse.json({ snapshot, actor });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Không tìm thấy phòng chơi." },
      { status: 404 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const body = await request.json();

    // Đường đi nhanh cho MATCH_COMMAND: song song hóa đọc actor + room và dựng snapshot không query lại
    if (body.type === "MATCH_COMMAND") {
      const cookieActorId = await getVerifiedActorIdFromCookie();
      let actor = null;
      let preloadedRoom = undefined;

      if (cookieActorId) {
        const [foundActor, foundRoom] = await Promise.all([
          getActorById(cookieActorId),
          findRoomByCode(code),
        ]);
        actor = foundActor;
        preloadedRoom = foundRoom;
      }

      if (!actor) {
        actor = await ensureCurrentActor(body.displayName || "Lữ Khách");
      }

      const snapshot = await submitMatchCommandAndGetSnapshot({
        code,
        actorId: actor.id,
        command: body.command,
        preloadedRoom,
      });
      return NextResponse.json({ snapshot, actor });
    }

    const actor = await ensureCurrentActor(body.displayName || "Lữ Khách");

    switch (body.type) {
      case "JOIN": {
        await joinRoom({ code, actorId: actor.id });
        break;
      }
      case "ADD_BOT": {
        await addBotSeat({ code, hostActorId: actor.id });
        break;
      }
      case "REMOVE_SEAT":
      case "KICK_SEAT": {
        await removeSeatFromRoom({
          code,
          hostActorId: actor.id,
          targetSeatNo: Number(body.targetSeatNo),
        });
        break;
      }
      case "LEAVE": {
        await leaveRoom({ code, actorId: actor.id });
        break;
      }
      case "UPDATE_CONFIG": {
        await updateRoomConfig({
          code,
          actorId: actor.id,
          config: body.config,
        });
        break;
      }
      case "START_MATCH": {
        await startMatch({ code, actorId: actor.id });
        break;
      }
      case "SEND_MESSAGE": {
        await postChannelMessage({
          code,
          actorId: actor.id,
          channelId: body.channelId as ChannelId,
          content: String(body.content ?? ""),
        });
        break;
      }
      case "REMATCH": {
        await returnRoomToLobby({ code, actorId: actor.id });
        break;
      }
      default:
        return NextResponse.json(
          { error: "Loại hành động không được hỗ trợ." },
          { status: 400 }
        );
    }

    const snapshot = await getRoomSnapshotForActor({
      code,
      actorId: actor.id,
      skipExpiryCheck: true,
    });
    return NextResponse.json({ snapshot, actor });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Thao tác không thành công." },
      { status: 400 }
    );
  }
}
