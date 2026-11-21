import { describe, expect, it } from "vitest";
import {
  addBotSeat,
  checkAndAdvanceExpiredMatch,
  createOrUpdateGuestActor,
  createRoom,
  getRoomSnapshotForActor,
  joinRoom,
  leaveRoom,
  postChannelMessage,
  returnRoomToLobby,
  startMatch,
  submitMatchCommand,
  upgradeOrSignInGoogleActor,
} from "@/platform/coordinator";

describe("Platform Core Coordinator - Seam 2 (PostgreSQL Integration)", () => {
  it("creates a Guest Actor and upgrades in-place to a Google-authenticated Actor keeping the same Actor ID", async () => {
    const guest = await createOrUpdateGuestActor({
      displayName: "Minh Khách",
    });
    expect(guest.isGuest).toBe(true);
    expect(guest.displayName).toBe("Minh Khách");

    const googleSub = `google-sub-${Date.now()}-${Math.random()}`;
    const upgraded = await upgradeOrSignInGoogleActor({
      currentActorId: guest.id,
      googleSub,
      email: "minh@example.com",
      displayName: "Minh Google",
    });

    expect(upgraded.id).toBe(guest.id);
    expect(upgraded.isGuest).toBe(false);
    expect(upgraded.googleSub).toBe(googleSub);
    expect(upgraded.email).toBe("minh@example.com");
  });

  it("manages Room creation, Seat claiming/reconnection, Host transfer on leave, Match lifecycle, Channel permissions, and Phase Timer expiration", async () => {
    const host = await createOrUpdateGuestActor({ displayName: "Chủ Phòng" });
    const p2 = await createOrUpdateGuestActor({ displayName: "Người Chơi 2" });

    const room = await createRoom({
      hostActorId: host.id,
      cartridgeId: "werewolf",
    });
    expect(room.code).toHaveLength(6);
    expect(room.hostActorId).toBe(host.id);

    // P2 joins the room -> Seat 2
    const joinRes = await joinRoom({
      code: room.code,
      actorId: p2.id,
    });
    expect(joinRes.seat.seatNo).toBe(2);

    // Re-joining with P2 reconnects to Seat 2 instead of creating Seat 3
    const rejoinRes = await joinRoom({
      code: room.code,
      actorId: p2.id,
    });
    expect(rejoinRes.seat.seatNo).toBe(2);

    // Add 2 bots so we have 4 seated players (minimum for Werewolf)
    await addBotSeat({ code: room.code, hostActorId: host.id });
    await addBotSeat({ code: room.code, hostActorId: host.id });

    // Start the Match with deterministic RNG so Seat 1 is Werewolf, Seat 2 is Villager, Seat 3 is Villager, Seat 4 is Seer
    await startMatch({
      code: room.code,
      actorId: host.id,
      rng: () => 0.999,
    });

    const hostSnap = await getRoomSnapshotForActor({
      code: room.code,
      actorId: host.id,
    });
    const p2Snap = await getRoomSnapshotForActor({
      code: room.code,
      actorId: p2.id,
    });

    expect(hostSnap.room.status).toBe("in_match");
    expect(hostSnap.playerView?.myRole).toBe("Werewolf");
    expect(p2Snap.playerView?.myRole).toBe("Villager");
    // P2's Player View must NOT reveal Seat 1's Werewolf role
    expect(
      p2Snap.playerView?.seats.find((s: { seatNo: number }) => s.seatNo === 1)
        ?.role
    ).toBeNull();

    // During NightPhase: Seat 1 (Werewolf) can post to 'werewolf' channel, Seat 2 (Villager) cannot!
    await postChannelMessage({
      code: room.code,
      actorId: host.id,
      channelId: "werewolf",
      content: "Đêm nay cắn ghế số 2 nhé!",
    });

    await expect(
      postChannelMessage({
        code: room.code,
        actorId: p2.id,
        channelId: "werewolf",
        content: "Tôi muốn nghe lén",
      })
    ).rejects.toThrow(/quyền/);

    // Seat 2 (Villager) must not see werewolf channel messages in their snapshot
    const p2AfterWolfChat = await getRoomSnapshotForActor({
      code: room.code,
      actorId: p2.id,
    });
    expect(
      p2AfterWolfChat.messages.some((m) => m.channelId === "werewolf")
    ).toBe(false);

    // Seat 1 (Werewolf) submits night bite on Seat 2; Bot Seer (Seat 4) auto-acts, completing NightActionStep -> DayDiscussionStep
    await submitMatchCommand({
      code: room.code,
      actorId: host.id,
      command: { type: "WEREWOLF_VOTE", targetSeatNo: 2 },
    });

    const daySnap = await getRoomSnapshotForActor({
      code: room.code,
      actorId: host.id,
    });
    expect(daySnap.playerView?.phase).toBe("DayPhase");
    expect(daySnap.playerView?.step).toBe("DayDiscussionStep");
    expect(daySnap.playerView?.lastDawnDeaths).toEqual([2]);

    // Simulate Phase Timer expiration to advance DayDiscussionStep -> DayVotingStep
    await checkAndAdvanceExpiredMatch({
      code: room.code,
      forceExpireForTest: true,
    });

    const votingSnap = await getRoomSnapshotForActor({
      code: room.code,
      actorId: host.id,
    });
    expect(votingSnap.playerView?.step).toBe("DayVotingStep");

    // Dead player (Seat 2) cannot write in Village channel, but CAN write in Graveyard channel
    await expect(
      postChannelMessage({
        code: room.code,
        actorId: p2.id,
        channelId: "village",
        content: "Sói là số 1!",
      })
    ).rejects.toThrow(/quyền/);

    await postChannelMessage({
      code: room.code,
      actorId: p2.id,
      channelId: "graveyard",
      content: "Chào các linh hồn dưới nghĩa địa!",
    });

    // Return to lobby for a Rematch and test Host transfer when Host leaves
    await returnRoomToLobby({
      code: room.code,
      actorId: host.id,
    });
    await leaveRoom({
      code: room.code,
      actorId: host.id,
    });

    const afterHostLeave = await getRoomSnapshotForActor({
      code: room.code,
      actorId: p2.id,
    });
    expect(afterHostLeave.room.hostActorId).toBe(p2.id);
  });
});
