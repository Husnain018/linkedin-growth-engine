import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { exchangeCode, fetchUserinfo } from "@/lib/linkedin.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/linkedin/callback")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) return redirectTo(`/settings?li=error&msg=${encodeURIComponent(error)}`);
        if (!code || !state) return redirectTo("/settings?li=error&msg=missing_code");

        const userId = state.split(".")[0];
        if (!userId) return redirectTo("/settings?li=error&msg=bad_state");

        const redirectUri = `${url.origin}/api/linkedin/callback`;

        try {
          const tok = await exchangeCode(code, redirectUri);
          const info = await fetchUserinfo(tok.access_token);
          const expiresAt = new Date(Date.now() + tok.expires_in * 1000).toISOString();

          await supabaseAdmin.from("linkedin_accounts").upsert(
            {
              user_id: userId,
              linkedin_urn: info.sub,
              linkedin_name: info.name ?? null,
              linkedin_picture: info.picture ?? null,
              access_token: tok.access_token,
              refresh_token: tok.refresh_token ?? null,
              expires_at: expiresAt,
              scope: tok.scope ?? null,
            },
            { onConflict: "user_id" },
          );

          await supabaseAdmin.from("activity_logs").insert({
            user_id: userId,
            action: "linkedin_connect",
            level: "info",
            message: "Connected LinkedIn account",
            meta: { name: info.name },
          });

          return redirectTo("/settings?li=ok");
        } catch (e: any) {
          return redirectTo(`/settings?li=error&msg=${encodeURIComponent(String(e?.message ?? e))}`);
        }
      },
    },
  },
});

function redirectTo(path: string) {
  return new Response(null, { status: 302, headers: { Location: path } });
}
