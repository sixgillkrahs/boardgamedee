import "dotenv/config";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  actors,
  channelMessages,
  matches,
  rooms,
  seats,
} from "@/db/schema";
import { getCartridge } from "@/cartridges/registry";
import type {
  ChannelId,
  ChannelPermission,
  SeatDescriptor,
} from "@/cartridges/types";
import { publishRoomUpdate } from "@/platform/event-bus";

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const BOT_NAMES = [
  "Sói Xám (Bot)",
  "Già Làng (Bot)",
  "Thợ Rèn (Bot)",
  "Mục Đồng (Bot)",
  "Thầy Thuốc (Bot)",
  "Tiểu Thương (Bot)",
  "Đạo Sĩ (Bot)",
  "Lính Gác (Bot)",
  "Tiều Phu (Bot)",
  "Học Giả (Bot)",
];

function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

function generateAvatarSeed(): string {
  return Math.random().toString(36).substring(2, 10);
}

export async function findRoomByCode(code: string) {
  const normalizedCode = code.trim().toUpperCase();
  const [room] = await db
    .select()
    .from(rooms)
    .where(eq(rooms.code, normalizedCode))
    .limit(1);
  return room ?? null;
}

export async function getRoomSyncMeta(code: string) {
  const normalizedCode = code.trim().toUpperCase();
  const [row] = await db
    .select({
      roomStatus: rooms.status,
      roomUpdatedAt: rooms.updatedAt,
      activeMatchId: rooms.activeMatchId,
      matchStatus: matches.status,
      matchVersion: matches.version,
      phaseDeadlineAt: matches.phaseDeadlineAt,
    })
    .from(rooms)
    .leftJoin(matches, eq(rooms.activeMatchId, matches.id))
    .where(eq(rooms.code, normalizedCode))
    .limit(1);
  return row ?? null;
}

export async function getActorById(actorId: string) {
  const rows = await db
    .select()
    .from(actors)
    .where(eq(actors.id, actorId))
    .limit(1);
  return rows[0] ?? null;
}

export async function createOrUpdateGuestActor(input: {
  actorId?: string | null;
  displayName: string;
}) {
  const cleanName = input.displayName.trim().slice(0, 28) || "Khách Chơi";

  if (input.actorId) {
    const existing = await getActorById(input.actorId);
    if (existing) {
      const [updated] = await db
        .update(actors)
        .set({
          displayName: cleanName,
          updatedAt: new Date(),
        })
        .where(eq(actors.id, existing.id))
        .returning();

      await db
        .update(seats)
        .set({ displayName: cleanName })
        .where(eq(seats.actorId, existing.id));

      return updated;
    }
  }

  const [created] = await db
    .insert(actors)
    .values({
      displayName: cleanName,
      avatarSeed: generateAvatarSeed(),
      isGuest: true,
    })
    .returning();

  return created;
}

export async function upgradeOrSignInGoogleActor(input: {
  currentActorId?: string | null;
  googleSub: string;
  email: string;
  displayName: string;
}) {
  const cleanName = input.displayName.trim().slice(0, 28) || "Người Chơi";

  const existingGoogle = await db
    .select()
    .from(actors)
    .where(eq(actors.googleSub, input.googleSub))
    .limit(1);

  if (existingGoogle[0]) {
    const [updated] = await db
      .update(actors)
      .set({
        displayName: cleanName,
        email: input.email,
        isGuest: false,
        updatedAt: new Date(),
      })
      .where(eq(actors.id, existingGoogle[0].id))
      .returning();
    return updated;
  }

  if (input.currentActorId) {
    const current = await getActorById(input.currentActorId);
    if (current && current.isGuest) {
      const [upgraded] = await db
        .update(actors)
        .set({
          displayName: cleanName,
          googleSub: input.googleSub,
          email: input.email,
          isGuest: false,
          updatedAt: new Date(),
        })
        .where(eq(actors.id, current.id))
        .returning();

      await db
        .update(seats)
        .set({ displayName: cleanName })
        .where(eq(seats.actorId, current.id));

      return upgraded;
    }
  }

  const [created] = await db
    .insert(actors)
    .values({
      displayName: cleanName,
      avatarSeed: generateAvatarSeed(),
      isGuest: false,
      googleSub: input.googleSub,
      email: input.email,
    })
    .returning();

  return created;
}

export async function createRoom(input: {
  hostActorId: string;
  cartridgeId?: string;
}) {
  const cartridgeId = input.cartridgeId ?? "werewolf";
  const cartridge = getCartridge(cartridgeId);
  if (!cartridge || !cartridge.available) {
    throw new Error("Tựa game này chưa mở hoặc không tồn tại.");
  }

  const host = await getActorById(input.hostActorId);
  if (!host) {
    throw new Error("Không tìm thấy thông tin người chơi.");
  }

  const code = generateRoomCode();
  const initialConfig = cartridge.defaultConfig(4);

  const [room] = await db
    .insert(rooms)
    .values({
      code,
      hostActorId: host.id,
      cartridgeId,
      status: "lobby",
      config: initialConfig,
    })
    .returning();

  await db.insert(seats).values({
    roomId: room.id,
    seatNo: 1,
    actorId: host.id,
    displayName: host.displayName,
    avatarSeed: host.avatarSeed,
    isBot: false,
    connected: true,
  });

  publishRoomUpdate(code);
  return room;
}

async function allocateNextSeat(
  room: typeof rooms.$inferSelect,
  actor: typeof actors.$inferSelect,
  isBot: boolean
) {
  const existingSeats = await db
    .select()
    .from(seats)
    .where(eq(seats.roomId, room.id))
    .orderBy(asc(seats.seatNo));

  const cartridge = getCartridge(room.cartridgeId);
  const maxSeats = cartridge?.maxSeats ?? 16;

  if (existingSeats.length >= maxSeats) {
    throw new Error("Phòng chơi đã đầy ghế.");
  }

  const occupiedNumbers = new Set(existingSeats.map((s) => s.seatNo));
  let nextSeatNo = 1;
  while (occupiedNumbers.has(nextSeatNo)) {
    nextSeatNo++;
  }

  const [newSeat] = await db
    .insert(seats)
    .values({
      roomId: room.id,
      seatNo: nextSeatNo,
      actorId: actor.id,
      displayName: actor.displayName,
      avatarSeed: actor.avatarSeed,
      isBot,
      connected: true,
    })
    .returning();

  const newCount = existingSeats.length + 1;
  const nextRoomUpdate: Partial<typeof rooms.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (
    cartridge &&
    newCount >= cartridge.minSeats &&
    !cartridge.validateConfig(room.config, newCount).valid
  ) {
    nextRoomUpdate.config = cartridge.defaultConfig(newCount);
  }
  await db
    .update(rooms)
    .set(nextRoomUpdate)
    .where(eq(rooms.id, room.id));

  publishRoomUpdate(room.code);
  return newSeat;
}

export async function joinRoom(input: { code: string; actorId: string }) {
  const [room, actor] = await Promise.all([
    findRoomByCode(input.code),
    getActorById(input.actorId),
  ]);
  if (!room) {
    throw new Error("Không tìm thấy phòng chơi với mã này.");
  }
  if (!actor) {
    throw new Error("Không tìm thấy thông tin người chơi.");
  }

  const existingSeats = await db
    .select()
    .from(seats)
    .where(eq(seats.roomId, room.id))
    .orderBy(asc(seats.seatNo));

  const myExistingSeat = existingSeats.find((s) => s.actorId === actor.id);
  if (myExistingSeat) {
    // Tránh ghi DB lặp lại khi SSE reconnect mà ghế vẫn đang connected và tên không đổi
    if (
      myExistingSeat.connected &&
      myExistingSeat.displayName === actor.displayName
    ) {
      return { room, seat: myExistingSeat };
    }

    const [reconnected] = await db
      .update(seats)
      .set({
        connected: true,
        displayName: actor.displayName,
        lastSeenAt: new Date(),
      })
      .where(eq(seats.id, myExistingSeat.id))
      .returning();

    await db
      .update(rooms)
      .set({ updatedAt: new Date() })
      .where(eq(rooms.id, room.id));

    publishRoomUpdate(room.code);
    return { room, seat: reconnected };
  }

  if (room.status !== "lobby") {
    throw new Error("Phòng đang trong trận đấu, không thể thêm người chơi mới.");
  }

  const newSeat = await allocateNextSeat(room, actor, false);
  return { room, seat: newSeat };
}

export async function addBotSeat(input: { code: string; hostActorId: string }) {
  const room = await findRoomByCode(input.code);
  if (!room) throw new Error("Không tìm thấy phòng chơi.");
  if (room.hostActorId !== input.hostActorId) {
    throw new Error("Chỉ Chủ phòng mới được thêm Bot.");
  }
  if (room.status !== "lobby") {
    throw new Error("Chỉ có thể thêm Bot khi trước trận đấu.");
  }

  const existingSeats = await db
    .select()
    .from(seats)
    .where(eq(seats.roomId, room.id));

  const botName =
    BOT_NAMES[existingSeats.length % BOT_NAMES.length] ??
    `Dân Làng Bot #${existingSeats.length + 1}`;
  const botActor = await createOrUpdateGuestActor({ displayName: botName });

  return allocateNextSeat(room, botActor, true);
}

export async function leaveRoom(input: { code: string; actorId: string }) {
  const room = await findRoomByCode(input.code);
  if (!room) return;

  if (room.status !== "lobby") {
    await db
      .update(seats)
      .set({ connected: false, lastSeenAt: new Date() })
      .where(and(eq(seats.roomId, room.id), eq(seats.actorId, input.actorId)));
    publishRoomUpdate(room.code);
    return;
  }

  await db
    .delete(seats)
    .where(and(eq(seats.roomId, room.id), eq(seats.actorId, input.actorId)));

  const remaining = await db
    .select()
    .from(seats)
    .where(eq(seats.roomId, room.id))
    .orderBy(asc(seats.seatNo));

  for (let idx = 0; idx < remaining.length; idx++) {
    const desiredNo = idx + 1;
    if (remaining[idx].seatNo !== desiredNo) {
      await db
        .update(seats)
        .set({ seatNo: desiredNo })
        .where(eq(seats.id, remaining[idx].id));
    }
  }

  const cartridge = getCartridge(room.cartridgeId);
  const nextHostActorId =
    room.hostActorId === input.actorId && remaining.length > 0
      ? (remaining.find((s) => !s.isBot) ?? remaining[0]).actorId
      : room.hostActorId;

  const updatedFields: Partial<typeof rooms.$inferInsert> = {
    hostActorId: nextHostActorId,
    updatedAt: new Date(),
  };
  if (
    cartridge &&
    remaining.length >= cartridge.minSeats &&
    !cartridge.validateConfig(room.config, remaining.length).valid
  ) {
    updatedFields.config = cartridge.defaultConfig(remaining.length);
  }

  await db.update(rooms).set(updatedFields).where(eq(rooms.id, room.id));
  publishRoomUpdate(room.code);
}

export async function removeSeatFromRoom(input: {
  code: string;
  hostActorId: string;
  targetSeatNo: number;
}) {
  const room = await findRoomByCode(input.code);
  if (!room) throw new Error("Không tìm thấy phòng chơi.");
  if (room.hostActorId !== input.hostActorId) {
    throw new Error("Chỉ Chủ phòng mới có quyền xóa Bot hoặc kick người chơi.");
  }
  if (room.status !== "lobby") {
    throw new Error(
      "Chỉ có thể xóa Bot hoặc kick người chơi khi đang ở sảnh chờ."
    );
  }

  const roomSeats = await db
    .select()
    .from(seats)
    .where(eq(seats.roomId, room.id))
    .orderBy(asc(seats.seatNo));

  const targetSeat = roomSeats.find((s) => s.seatNo === input.targetSeatNo);
  if (!targetSeat) {
    throw new Error("Không tìm thấy ghế này trong bàn chơi.");
  }
  if (targetSeat.actorId === input.hostActorId) {
    throw new Error("Chủ phòng không thể tự kick chính mình khỏi bàn.");
  }

  await db.delete(seats).where(eq(seats.id, targetSeat.id));

  const remaining = roomSeats.filter((s) => s.id !== targetSeat.id);
  for (let idx = 0; idx < remaining.length; idx++) {
    const desiredNo = idx + 1;
    if (remaining[idx].seatNo !== desiredNo) {
      await db
        .update(seats)
        .set({ seatNo: desiredNo })
        .where(eq(seats.id, remaining[idx].id));
    }
  }

  const cartridge = getCartridge(room.cartridgeId);
  const updatedFields: Partial<typeof rooms.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (
    cartridge &&
    remaining.length >= cartridge.minSeats &&
    !cartridge.validateConfig(room.config, remaining.length).valid
  ) {
    updatedFields.config = cartridge.defaultConfig(remaining.length);
  }

  await db.update(rooms).set(updatedFields).where(eq(rooms.id, room.id));
  publishRoomUpdate(room.code);
  return { removedSeat: targetSeat };
}

export async function updateRoomConfig(input: {
  code: string;
  actorId: string;
  config: unknown;
}) {
  const room = await findRoomByCode(input.code);
  if (!room) throw new Error("Không tìm thấy phòng chơi.");
  if (room.hostActorId !== input.actorId) {
    throw new Error("Chỉ Chủ phòng mới có quyền thay đổi cấu hình.");
  }
  if (room.status !== "lobby") {
    throw new Error("Không thể chỉnh cấu hình khi trận đấu đang diễn ra.");
  }

  const [updated] = await db
    .update(rooms)
    .set({ config: input.config, updatedAt: new Date() })
    .where(eq(rooms.id, room.id))
    .returning();

  publishRoomUpdate(room.code);
  return updated;
}

export async function startMatch(input: {
  code: string;
  actorId: string;
  rng?: () => number;
}) {
  const room = await findRoomByCode(input.code);
  if (!room) throw new Error("Không tìm thấy phòng chơi.");
  if (room.hostActorId !== input.actorId) {
    throw new Error("Chỉ Chủ phòng mới có quyền bắt đầu ván đấu.");
  }

  const roomSeats = await db
    .select()
    .from(seats)
    .where(eq(seats.roomId, room.id))
    .orderBy(asc(seats.seatNo));

  const cartridge = getCartridge(room.cartridgeId);
  if (!cartridge) throw new Error("Không tìm thấy Game Cartridge.");

  const validation = cartridge.validateConfig(room.config, roomSeats.length);
  if (!validation.valid) {
    throw new Error(validation.error ?? "Cấu hình ván đấu chưa hợp lệ.");
  }

  const seatDescriptors: SeatDescriptor[] = roomSeats.map((s) => ({
    seatNo: s.seatNo,
    actorId: s.actorId,
    displayName: s.displayName,
    avatarSeed: s.avatarSeed,
    connected: s.connected,
  }));

  const nowMs = Date.now();
  const initial = cartridge.createInitialState({
    config: room.config,
    seats: seatDescriptors,
    nowMs,
    rng: input.rng,
  });

  const [match] = await db
    .insert(matches)
    .values({
      roomId: room.id,
      cartridgeId: room.cartridgeId,
      status: "active",
      version: 1,
      state: initial.state,
      phaseDeadlineAt: initial.phaseDeadlineMs
        ? new Date(initial.phaseDeadlineMs)
        : null,
    })
    .returning();

  await db
    .update(rooms)
    .set({
      status: "in_match",
      activeMatchId: match.id,
      updatedAt: new Date(),
    })
    .where(eq(rooms.id, room.id));

  publishRoomUpdate(room.code);
  return match;
}

async function executeMatchCommandCore(input: {
  code: string;
  actorId: string;
  command: unknown;
  preloadedRoom?: typeof rooms.$inferSelect | null;
  includeMessages?: boolean;
}) {
  const room =
    input.preloadedRoom !== undefined
      ? input.preloadedRoom
      : await findRoomByCode(input.code);
  if (!room || !room.activeMatchId) {
    throw new Error("Phòng chưa có trận đấu đang diễn ra.");
  }

  const [[match], roomSeats, allMessages] = await Promise.all([
    db
      .select()
      .from(matches)
      .where(eq(matches.id, room.activeMatchId))
      .limit(1),
    db
      .select()
      .from(seats)
      .where(eq(seats.roomId, room.id))
      .orderBy(asc(seats.seatNo)),
    input.includeMessages
      ? db
          .select()
          .from(channelMessages)
          .where(eq(channelMessages.matchId, room.activeMatchId))
          .orderBy(asc(channelMessages.id))
      : Promise.resolve([]),
  ]);

  if (!match || match.status !== "active") {
    throw new Error("Ván đấu đã kết thúc.");
  }

  const actorSeat = roomSeats.find((s) => s.actorId === input.actorId);
  if (!actorSeat) {
    throw new Error("Bạn không ngồi ở ghế nào trong ván đấu này.");
  }

  const cartridge = getCartridge(match.cartridgeId);
  if (!cartridge) throw new Error("Không tìm thấy Game Cartridge.");

  const nowMs = Date.now();
  let transition = cartridge.reduce({
    state: match.state,
    command: input.command,
    actorSeatNo: actorSeat.seatNo,
    nowMs,
  });

  const botSeatNos = roomSeats.filter((s) => s.isBot).map((s) => s.seatNo);
  if (cartridge.autoActBots && botSeatNos.length > 0) {
    transition = cartridge.autoActBots({
      current: transition,
      botSeatNos,
      nowMs,
    });
  }

  const nextVersion = match.version + 1;
  const isOver = cartridge.isMatchOver(transition.state);
  const winningFaction = cartridge.getWinningFaction(transition.state);

  const updatedRows = await db
    .update(matches)
    .set({
      version: nextVersion,
      state: transition.state,
      status: isOver ? "finished" : "active",
      phaseDeadlineAt: transition.phaseDeadlineMs
        ? new Date(transition.phaseDeadlineMs)
        : null,
      winningFaction,
      finishedAt: isOver ? new Date() : null,
    })
    .where(and(eq(matches.id, match.id), eq(matches.version, match.version)))
    .returning();

  if (updatedRows.length === 0) {
    throw new Error("Trạng thái bàn chơi vừa thay đổi, vui lòng thử lại.");
  }

  return {
    room,
    roomSeats,
    updatedMatch: updatedRows[0],
    allMessages,
  };
}

export async function submitMatchCommand(input: {
  code: string;
  actorId: string;
  command: unknown;
}) {
  const { room, updatedMatch } = await executeMatchCommandCore(input);
  publishRoomUpdate(room.code);
  return updatedMatch;
}

export async function submitMatchCommandAndGetSnapshot(input: {
  code: string;
  actorId: string;
  command: unknown;
  preloadedRoom?: typeof rooms.$inferSelect | null;
}): Promise<RoomSnapshotForActor> {
  const { room, roomSeats, updatedMatch, allMessages } =
    await executeMatchCommandCore({
      ...input,
      includeMessages: true,
    });

  publishRoomUpdate(room.code);

  return buildRoomSnapshotFromData({
    room,
    roomSeats,
    match: updatedMatch,
    allMessages,
    actorId: input.actorId,
  });
}

export async function checkAndAdvanceExpiredMatch(input: {
  code: string;
  forceExpireForTest?: boolean;
}) {
  const normalizedCode = input.code.trim().toUpperCase();
  const [joined] = await db
    .select({
      room: rooms,
      match: matches,
    })
    .from(rooms)
    .leftJoin(matches, eq(rooms.activeMatchId, matches.id))
    .where(eq(rooms.code, normalizedCode))
    .limit(1);

  if (!joined || !joined.match || joined.match.status !== "active") {
    return false;
  }

  const { room, match } = joined;
  const nowMs = Date.now();
  const deadlineMs = match.phaseDeadlineAt
    ? match.phaseDeadlineAt.getTime()
    : null;

  if (
    !input.forceExpireForTest &&
    (deadlineMs === null || nowMs < deadlineMs)
  ) {
    return false;
  }

  const cartridge = getCartridge(match.cartridgeId);
  if (!cartridge) return false;

  let transition = cartridge.onPhaseTimeout({
    state: match.state,
    nowMs,
  });

  const roomSeats = await db
    .select()
    .from(seats)
    .where(eq(seats.roomId, room.id))
    .orderBy(asc(seats.seatNo));
  const botSeatNos = roomSeats.filter((s) => s.isBot).map((s) => s.seatNo);
  if (cartridge.autoActBots && botSeatNos.length > 0) {
    transition = cartridge.autoActBots({
      current: transition,
      botSeatNos,
      nowMs,
    });
  }

  const nextVersion = match.version + 1;
  const isOver = cartridge.isMatchOver(transition.state);
  const winningFaction = cartridge.getWinningFaction(transition.state);

  const updated = await db
    .update(matches)
    .set({
      version: nextVersion,
      state: transition.state,
      status: isOver ? "finished" : "active",
      phaseDeadlineAt: transition.phaseDeadlineMs
        ? new Date(transition.phaseDeadlineMs)
        : null,
      winningFaction,
      finishedAt: isOver ? new Date() : null,
    })
    .where(and(eq(matches.id, match.id), eq(matches.version, match.version)))
    .returning();

  if (updated.length > 0) {
    publishRoomUpdate(room.code);
    return true;
  }

  return false;
}

export async function postChannelMessage(input: {
  code: string;
  actorId: string;
  channelId: ChannelId;
  content: string;
}) {
  const cleanContent = input.content.trim().slice(0, 400);
  if (!cleanContent) {
    throw new Error("Nội dung tin nhắn không được để trống.");
  }

  const room = await findRoomByCode(input.code);
  if (!room || !room.activeMatchId) {
    throw new Error("Phòng chưa bắt đầu trận đấu.");
  }

  const [[match], roomSeats] = await Promise.all([
    db
      .select()
      .from(matches)
      .where(eq(matches.id, room.activeMatchId))
      .limit(1),
    db.select().from(seats).where(eq(seats.roomId, room.id)),
  ]);

  if (!match) {
    throw new Error("Không tìm thấy trận đấu.");
  }

  const senderSeat = roomSeats.find((s) => s.actorId === input.actorId);
  if (!senderSeat) {
    throw new Error("Bạn không có ghế trong phòng chơi này.");
  }

  const cartridge = getCartridge(match.cartridgeId);
  if (!cartridge) throw new Error("Không tìm thấy Game Cartridge.");

  const permissions = cartridge.resolveChannels({
    state: match.state,
    viewerSeatNo: senderSeat.seatNo,
  });

  const channelPerm = permissions.find(
    (c) => c.channelId === input.channelId
  );
  if (!channelPerm || !channelPerm.canWrite) {
    throw new Error(
      "Bạn không có quyền gửi tin nhắn vào kênh này ở pha hiện tại."
    );
  }

  const [[msg]] = await Promise.all([
    db
      .insert(channelMessages)
      .values({
        matchId: match.id,
        channelId: input.channelId,
        senderSeatNo: senderSeat.seatNo,
        senderName: senderSeat.displayName,
        content: cleanContent,
      })
      .returning(),
    db
      .update(rooms)
      .set({ updatedAt: new Date() })
      .where(eq(rooms.id, room.id)),
  ]);

  publishRoomUpdate(room.code);
  return msg;
}

export async function returnRoomToLobby(input: {
  code: string;
  actorId: string;
}) {
  const room = await findRoomByCode(input.code);
  if (!room) throw new Error("Không tìm thấy phòng chơi.");
  if (room.hostActorId !== input.actorId) {
    throw new Error("Chỉ Chủ phòng mới có thể mở ván đấu mới.");
  }

  const [updated] = await db
    .update(rooms)
    .set({
      status: "lobby",
      activeMatchId: null,
      updatedAt: new Date(),
    })
    .where(eq(rooms.id, room.id))
    .returning();

  publishRoomUpdate(room.code);
  return updated;
}

export interface RoomSnapshotForActor {
  room: {
    id: string;
    code: string;
    hostActorId: string;
    cartridgeId: string;
    status: string;
    config: any;
    activeMatchId: string | null;
  };
  configValidation: {
    valid: boolean;
    error?: string;
  };
  seats: {
    seatNo: number;
    actorId: string;
    displayName: string;
    avatarSeed: string;
    isBot: boolean;
    connected: boolean;
  }[];
  viewerSeatNo: number | null;
  isHost: boolean;
  matchVersion: number | null;
  playerView: any | null;
  channels: ChannelPermission[];
  messages: {
    id: number;
    channelId: string;
    senderSeatNo: number;
    senderName: string;
    content: string;
    createdAt: string;
  }[];
  events: {
    id: number;
    version: number;
    eventType: string;
    message: string;
    createdAt: string;
  }[];
}

function buildRoomSnapshotFromData(input: {
  room: typeof rooms.$inferSelect;
  roomSeats: (typeof seats.$inferSelect)[];
  match: typeof matches.$inferSelect | null;
  allMessages: (typeof channelMessages.$inferSelect)[];
  actorId: string | null;
}): RoomSnapshotForActor {
  const { room, roomSeats, match, allMessages, actorId } = input;
  const viewerSeat =
    actorId !== null
      ? roomSeats.find((s) => s.actorId === actorId) ?? null
      : null;
  const viewerSeatNo = viewerSeat?.seatNo ?? null;

  const cartridge = getCartridge(room.cartridgeId);
  const configValidation = cartridge
    ? cartridge.validateConfig(room.config, roomSeats.length)
    : { valid: false, error: "Không tìm thấy Game Cartridge." };

  let matchVersion: number | null = null;
  let playerView: any | null = null;
  let channels: ChannelPermission[] = [];
  let visibleMessages: RoomSnapshotForActor["messages"] = [];

  if (match && cartridge) {
    matchVersion = match.version;
    playerView = cartridge.projectView({
      state: match.state,
      viewerSeatNo,
    });
    channels = cartridge.resolveChannels({
      state: match.state,
      viewerSeatNo,
    });

    const readableChannelIds = new Set(
      channels.filter((c) => c.canRead).map((c) => c.channelId)
    );

    visibleMessages = allMessages
      .filter((m) => readableChannelIds.has(m.channelId))
      .map((m) => ({
        id: m.id,
        channelId: m.channelId,
        senderSeatNo: m.senderSeatNo,
        senderName: m.senderName,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      }));
  }

  return {
    room: {
      id: room.id,
      code: room.code,
      hostActorId: room.hostActorId,
      cartridgeId: room.cartridgeId,
      status: room.status,
      config: room.config,
      activeMatchId: room.activeMatchId,
    },
    configValidation,
    seats: roomSeats.map((s) => ({
      seatNo: s.seatNo,
      actorId: s.actorId,
      displayName: s.displayName,
      avatarSeed: s.avatarSeed,
      isBot: s.isBot,
      connected: s.connected,
    })),
    viewerSeatNo,
    isHost: actorId !== null && room.hostActorId === actorId,
    matchVersion,
    playerView,
    channels,
    messages: visibleMessages,
    events: [],
  };
}

export async function getRoomSnapshotForActor(input: {
  code: string;
  actorId: string | null;
  skipExpiryCheck?: boolean;
}): Promise<RoomSnapshotForActor> {
  const normalizedCode = input.code.trim().toUpperCase();

  // Round-trip 1: Đọc room + match hiện tại trong 1 câu JOIN duy nhất
  const [joined] = await db
    .select({
      room: rooms,
      match: matches,
    })
    .from(rooms)
    .leftJoin(matches, eq(rooms.activeMatchId, matches.id))
    .where(eq(rooms.code, normalizedCode))
    .limit(1);

  if (!joined) {
    throw new Error("Không tìm thấy phòng chơi.");
  }

  let { room, match } = joined;

  // Chỉ gọi checkAndAdvanceExpiredMatch khi thực sự có phaseDeadlineAt đã quá hạn
  if (
    !input.skipExpiryCheck &&
    match &&
    match.status === "active" &&
    match.phaseDeadlineAt &&
    Date.now() >= match.phaseDeadlineAt.getTime()
  ) {
    const advanced = await checkAndAdvanceExpiredMatch({
      code: normalizedCode,
    });
    if (advanced && room.activeMatchId) {
      const [refetched] = await db
        .select()
        .from(matches)
        .where(eq(matches.id, room.activeMatchId))
        .limit(1);
      match = refetched ?? match;
    }
  }

  // Round-trip 2: Đọc seats + messages song song (Promise.all)
  const [roomSeats, allMessages] = await Promise.all([
    db
      .select()
      .from(seats)
      .where(eq(seats.roomId, room.id))
      .orderBy(asc(seats.seatNo)),
    match
      ? db
          .select()
          .from(channelMessages)
          .where(eq(channelMessages.matchId, match.id))
          .orderBy(asc(channelMessages.id))
      : Promise.resolve([]),
  ]);

  return buildRoomSnapshotFromData({
    room,
    roomSeats,
    match,
    allMessages,
    actorId: input.actorId,
  });
}
