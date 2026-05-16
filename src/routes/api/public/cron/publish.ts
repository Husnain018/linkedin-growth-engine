import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { publishUgcPost } from "@/lib/linkedin.server";

export const Route = createFileRoute("/api/public/cron/publish")({
  server: {
    handlers: {
      POST: async () => {
        const now = new Date().toISOString();
        const { data: due, error } = await supabaseAdmin
          .from("posts")
          .select("*")
          .eq("status", "scheduled")
          .lte("scheduled_for", now)
          .limit(20);

        if (error) {
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }
        if (!due?.length) return Response.json({ ok: true, published: 0 });

        let success = 0;
        let fail = 0;
        for (const post of due) {
          try {
            await supabaseAdmin.from("posts").update({ status: "publishing" }).eq("id", post.id);

            const { data: acct } = await supabaseAdmin
              .from("linkedin_accounts")
              .select("*")
              .eq("user_id", post.user_id)
              .single();
            if (!acct) throw new Error("LinkedIn not connected");

            const personUrn = `urn:li:person:${acct.linkedin_urn}`;
            const text =
              post.content + (post.hashtags?.length ? `\n\n${post.hashtags.join(" ")}` : "");

            const { urn, url } = await publishUgcPost({
              accessToken: acct.access_token,
              personUrn,
              text,
              imageDataUrls: (post.media_urls ?? []).filter((u: string) => u.startsWith("data:")),
            });

            await supabaseAdmin
              .from("posts")
              .update({
                status: "published",
                published_at: new Date().toISOString(),
                linkedin_post_urn: urn,
                linkedin_post_url: url,
                error_message: null,
              })
              .eq("id", post.id);

            await supabaseAdmin.from("activity_logs").insert({
              user_id: post.user_id,
              action: "cron_publish",
              level: "info",
              message: "Auto-published scheduled post",
              meta: { post_id: post.id, url },
            });
            success++;
          } catch (e: any) {
            const msg = String(e?.message ?? e);
            await supabaseAdmin
              .from("posts")
              .update({
                status: "failed",
                error_message: msg,
                retry_count: (post.retry_count ?? 0) + 1,
              })
              .eq("id", post.id);
            await supabaseAdmin.from("activity_logs").insert({
              user_id: post.user_id,
              action: "cron_publish",
              level: "error",
              message: msg,
              meta: { post_id: post.id },
            });
            fail++;
          }
        }
        return Response.json({ ok: true, published: success, failed: fail });
      },
    },
  },
});
