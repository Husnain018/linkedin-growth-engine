// Server-only LinkedIn API helpers (called by server functions and server routes)
const AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
const UGC_URL = "https://api.linkedin.com/v2/ugcPosts";
const ASSETS_URL = "https://api.linkedin.com/v2/assets?action=registerUpload";

export const LINKEDIN_SCOPES = "openid profile email w_member_social";

export function buildAuthUrl(redirectUri: string, state: string) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) throw new Error("LINKEDIN_CLIENT_ID not configured");
  const u = new URL(AUTH_URL);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("scope", LINKEDIN_SCOPES);
  u.searchParams.set("state", state);
  return u.toString();
}

export async function exchangeCode(code: string, redirectUri: string) {
  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope?: string;
  };
}

export async function fetchUserinfo(accessToken: string) {
  const res = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Userinfo failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as { sub: string; name?: string; picture?: string; email?: string };
}

async function dataUrlToBytes(dataUrl: string): Promise<{ bytes: Uint8Array; contentType: string }> {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error("Invalid data URL");
  const contentType = m[1];
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, contentType };
}

async function uploadImage(accessToken: string, ownerUrn: string, imageDataUrl: string): Promise<string> {
  const reg = await fetch(ASSETS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: ownerUrn,
        serviceRelationships: [
          { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" },
        ],
      },
    }),
  });
  if (!reg.ok) throw new Error(`registerUpload failed: ${reg.status} ${await reg.text()}`);
  const regJson: any = await reg.json();
  const uploadUrl =
    regJson.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
  const asset = regJson.value.asset as string;

  const { bytes, contentType } = await dataUrlToBytes(imageDataUrl);
  const up = await fetch(uploadUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": contentType },
    body: bytes,
  });
  if (!up.ok && up.status !== 201) throw new Error(`upload failed: ${up.status} ${await up.text()}`);
  return asset;
}

export async function publishUgcPost(opts: {
  accessToken: string;
  personUrn: string; // urn:li:person:{sub}
  text: string;
  imageDataUrls?: string[];
}): Promise<{ urn: string; url: string }> {
  const { accessToken, personUrn, text, imageDataUrls = [] } = opts;

  let media: any[] = [];
  for (const dataUrl of imageDataUrls.slice(0, 9)) {
    const asset = await uploadImage(accessToken, personUrn, dataUrl);
    media.push({
      status: "READY",
      description: { text: "" },
      media: asset,
      title: { text: "" },
    });
  }

  const body = {
    author: personUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: media.length ? "IMAGE" : "NONE",
        media: media.length ? media : undefined,
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  const res = await fetch(UGC_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`ugcPosts failed: ${res.status} ${await res.text()}`);
  const json: any = await res.json();
  const urn = json.id as string;
  const id = urn.split(":").pop();
  return { urn, url: `https://www.linkedin.com/feed/update/${urn}` };
}
