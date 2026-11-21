import { NextResponse } from "next/server";
import { upgradeOrSignInGoogleActor } from "@/platform/coordinator";
import { getCurrentActor, setActorCookie } from "@/platform/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnTo = url.searchParams.get("state") || "/";
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!code || !clientId || !clientSecret) {
    return NextResponse.redirect(new URL(returnTo, url.origin));
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${url.origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error("Failed to obtain Google access token");
    }

    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );
    const profile = await profileRes.json();

    const current = await getCurrentActor();
    const actor = await upgradeOrSignInGoogleActor({
      currentActorId: current?.id ?? null,
      googleSub: String(profile.sub),
      email: String(profile.email ?? ""),
      displayName: String(profile.name ?? profile.email ?? "Google Player"),
    });

    await setActorCookie(actor.id);
    return NextResponse.redirect(new URL(returnTo, url.origin));
  } catch {
    return NextResponse.redirect(new URL(returnTo, url.origin));
  }
}
