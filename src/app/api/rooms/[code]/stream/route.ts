import {
  checkAndAdvanceExpiredMatch,
  getRoomSnapshotForActor,
  getRoomSyncMeta,
  joinRoom,
} from "@/platform/coordinator";
import { subscribeToRoom } from "@/platform/event-bus";
import { ensureCurrentActor } from "@/platform/session";

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const normalizedCode = code.trim().toUpperCase();
  const actor = await ensureCurrentActor();

  // Ensure the actor claims or reconnects to their seat if possible
  try {
    await joinRoom({ code: normalizedCode, actorId: actor.id });
  } catch {
    // Spectator or match already in progress
  }

  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let sending = false;
      let pendingSend = false;

      const sendSnapshot = async () => {
        if (closed) return;
        if (sending) {
          pendingSend = true;
          return;
        }
        sending = true;
        try {
          const snapshot = await getRoomSnapshotForActor({
            code: normalizedCode,
            actorId: actor.id,
          });
          const payload = JSON.stringify({ snapshot, actor });
          if (!closed) {
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          }
        } catch (err: any) {
          const errPayload = JSON.stringify({
            error: err?.message ?? "Lỗi đồng bộ phòng chơi",
          });
          if (!closed) {
            controller.enqueue(encoder.encode(`data: ${errPayload}\n\n`));
          }
        } finally {
          sending = false;
          if (pendingSend && !closed) {
            pendingSend = false;
            void sendSnapshot();
          }
        }
      };

      await sendSnapshot();

      const unsubscribe = subscribeToRoom(normalizedCode, () => {
        void sendSnapshot();
      });

      let lastMetaKey = "";

      // Kiểm tra đồng bộ nhẹ (1 câu JOIN duy nhất mỗi 2.5s) để:
      // 1. Không xả 2 query/giây khi game không có timer
      // 2. Vẫn đồng bộ đa người chơi giữa các Vercel Serverless Lambda khác nhau
      const timerInterval = setInterval(async () => {
        if (closed || sending) return;
        try {
          const meta = await getRoomSyncMeta(normalizedCode);
          if (!meta || closed) return;

          if (
            meta.matchStatus === "active" &&
            meta.phaseDeadlineAt &&
            Date.now() >= meta.phaseDeadlineAt.getTime()
          ) {
            const advanced = await checkAndAdvanceExpiredMatch({
              code: normalizedCode,
            });
            if (advanced) {
              lastMetaKey = "";
              return;
            }
          }

          const metaKey = `${meta.roomStatus}|${meta.roomUpdatedAt.getTime()}|${meta.activeMatchId ?? ""}|${meta.matchVersion ?? ""}`;
          if (lastMetaKey && metaKey !== lastMetaKey) {
            lastMetaKey = metaKey;
            await sendSnapshot();
            return;
          }
          lastMetaKey = metaKey;

          // Keep-alive heartbeat
          if (!closed) {
            controller.enqueue(encoder.encode(`: heartbeat\n\n`));
          }
        } catch {
          // ignore timer check error
        }
      }, 2500);

      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(timerInterval);
        unsubscribe();
      };

      request.signal.addEventListener("abort", () => {
        if (cleanup) cleanup();
      });
    },
    cancel() {
      if (cleanup) cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
