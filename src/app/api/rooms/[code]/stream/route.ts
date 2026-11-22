import {
  checkAndAdvanceExpiredMatch,
  getRoomSnapshotForActor,
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

      const sendSnapshot = async () => {
        if (closed) return;
        try {
          const snapshot = await getRoomSnapshotForActor({
            code: normalizedCode,
            actorId: actor.id,
          });
          const payload = JSON.stringify({ snapshot, actor });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch (err: any) {
          const errPayload = JSON.stringify({
            error: err?.message ?? "Lỗi đồng bộ phòng chơi",
          });
          controller.enqueue(encoder.encode(`data: ${errPayload}\n\n`));
        }
      };

      await sendSnapshot();

      const unsubscribe = subscribeToRoom(normalizedCode, () => {
        void sendSnapshot();
      });

      const timerInterval = setInterval(async () => {
        if (closed) return;
        try {
          const advanced = await checkAndAdvanceExpiredMatch({
            code: normalizedCode,
          });
          if (!advanced) {
            // Send lightweight heartbeat comment to keep connection alive
            controller.enqueue(encoder.encode(`: heartbeat\n\n`));
          }
        } catch {
          // ignore timer check error
        }
      }, 1000);

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
