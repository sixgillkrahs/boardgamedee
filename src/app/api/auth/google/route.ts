import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") || "/";

  if (!clientId) {
    return NextResponse.redirect(
      new URL(`/?googlePrompt=1&returnTo=${encodeURIComponent(returnTo)}`, url.origin)
    );
  }

  const redirectUri = `${url.origin}/api/auth/google/callback`;
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", returnTo);

  return NextResponse.redirect(authUrl);
}
