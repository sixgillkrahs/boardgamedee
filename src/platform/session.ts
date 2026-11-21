import crypto from "node:crypto";
import { cookies } from "next/headers";
import {
  createOrUpdateGuestActor,
  getActorById,
} from "@/platform/coordinator";

export const ACTOR_COOKIE_NAME = "bg_actor_id";

function getCookieSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.DATABASE_URL ||
    "werewolf-platform-default-hmac-secret"
  );
}

export function signActorId(actorId: string): string {
  const sig = crypto
    .createHmac("sha256", getCookieSecret())
    .update(actorId)
    .digest("base64url");
  return `${actorId}.${sig}`;
}

export function verifySignedActorId(rawCookie: string): string | null {
  const parts = rawCookie.split(".");
  if (parts.length !== 2) return null;
  const [actorId, providedSig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", getCookieSecret())
    .update(actorId)
    .digest("base64url");
  if (providedSig.length !== expectedSig.length) return null;
  const valid = crypto.timingSafeEqual(
    Buffer.from(providedSig),
    Buffer.from(expectedSig)
  );
  return valid ? actorId : null;
}

export async function getCurrentActor() {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(ACTOR_COOKIE_NAME)?.value;
  if (!rawValue) return null;
  const actorId = verifySignedActorId(rawValue);
  if (!actorId) return null;
  return getActorById(actorId);
}

export async function ensureCurrentActor(fallbackName = "Lữ Khách") {
  const existing = await getCurrentActor();
  if (existing) return existing;

  const created = await createOrUpdateGuestActor({
    displayName: fallbackName,
  });
  await setActorCookie(created.id);
  return created;
}

export async function setActorCookie(actorId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTOR_COOKIE_NAME, signActorId(actorId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
