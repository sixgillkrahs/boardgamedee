import {
  checkAndAdvanceExpiredMatch,
  getRoomSnapshotForActor,
  getRoomSyncMeta,
  joinRoom,
} from "@/platform/coordinator";
import { subscribeToRoom } from "@/platform/event-bus";
import { ensureCurrentActor } from "@/platform/session";

const HEARTBEAT_INTERVAL_MS = 10_000;
const SYNC_POLL_INTERVAL_MS = 2_500;

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
      let checkingMeta = false;
      let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
      let timerInterval: ReturnType<typeof setInterval> | null = null;
      let unsubscribe: (() => void) | null = null;

      const closeStream = (closeController = true) => {
        if (closed) return;
        closed = true;
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
        if (closeController) {
          try {
            controller.close();
          } catch {
            // already closed
          }
        }
      };

      cleanup = () => closeStream(false);

      const safeEnqueue = (chunk: string) => {
        if (closed) return false;
        try {
          controller.enqueue(encoder.encode(chunk));
          return true;
        } catch {
          closeStream(false);
          return false;
        }
      };

      // Flush SSE preamble immediately so Nginx/Cloudways sees instant upstream bytes
      safeEnqueue("retry: 2000\n: connected\n\n");

      // Dedicated keep-alive heartbeat decoupled from DB queries so Nginx proxy_read_timeout never fires
      heartbeatInterval = setInterval(() => {
        safeEnqueue(": heartbeat\n\n");
      }, HEARTBEAT_INTERVAL_MS);

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
          safeEnqueue(`data: ${payload}\n\n`);
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Lỗi đồng bộ phòng chơi";
          const isNotFound = /không tìm thấy phòng/i.test(message);
          const errPayload = JSON.stringify({
            error: message,
            ...(isNotFound ? { fatal: true } : {}),
          });
          safeEnqueue(`data: ${errPayload}\n\n`);
          if (isNotFound) {
            closeStream(true);
            return;
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
      if (closed) return;

      unsubscribe = subscribeToRoom(normalizedCode, () => {
        void sendSnapshot();
      });

      let lastMetaKey = "";

      // Kiểm tra đồng bộ nhẹ (1 câu JOIN duy nhất mỗi 2.5s) để:
      // 1. Tự chuyển phase khi hết giờ (phaseDeadlineAt)
      // 2. Đồng bộ đa process/worker nếu không chung bộ nhớ event-bus
      timerInterval = setInterval(async () => {
        if (closed || sending || checkingMeta) return;
        checkingMeta = true;
        try {
          const meta = await getRoomSyncMeta(normalizedCode);
          if (closed) return;
          if (!meta) {
            safeEnqueue(
              `data: ${JSON.stringify({
                error: "Phòng chơi không còn tồn tại",
                fatal: true,
              })}\n\n`
            );
            closeStream(true);
            return;
          }

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
        } catch {
          // ignore transient timer check error; heartbeat interval keeps stream alive
        } finally {
          checkingMeta = false;
        }
      }, SYNC_POLL_INTERVAL_MS);

      request.signal.addEventListener(
        "abort",
        () => {
          closeStream(false);
        },
        { once: true }
      );
    },
    cancel() {
      if (cleanup) cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store, no-transform, must-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
