import { NextResponse } from "next/server";
import {
  addBotSeat,
  getRoomSnapshotForActor,
  joinRoom,
  leaveRoom,
  postChannelMessage,
  returnRoomToLobby,
  startMatch,
  submitMatchCommand,
  updateRoomConfig,
} from "@/platform/coordinator";
import { ensureCurrentActor, getCurrentActor } from "@/platform/session";
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
      case "MATCH_COMMAND": {
        await submitMatchCommand({
          code,
          actorId: actor.id,
          command: body.command,
        });
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
    });
    return NextResponse.json({ snapshot, actor });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Thao tác không thành công." },
      { status: 400 }
    );
  }
}
