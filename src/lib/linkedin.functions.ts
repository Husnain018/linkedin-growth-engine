import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildAuthUrl, publishUgcPost } from "./linkedin.server";

function getRedirectUri(origin: string) {
  return `${origin}/api/linkedin/callback`;
}

export const startLinkedInOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { origin: string }) =>
    z.object({ origin: z.string().url() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    // state encodes the user id; LinkedIn returns it on callback
    const state = `${userId}.${crypto.randomUUID()}`;
    const url = buildAuthUrl(getRedirectUri(data.origin), state);
    return { url };
  });

export const disconnectLinkedIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await supabase.from("linkedin_accounts").delete().eq("user_id", userId);
    return { ok: true };
  });

const PublishInput = z.object({ post_id: z.string().uuid() });

export const publishNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => PublishInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: post, error: pErr } = await supabase
      .from("posts")
      .select("*")
      .eq("id", data.post_id)
      .eq("user_id", userId)
      .single();
    if (pErr || !post) throw new Error("Post not found");

    const { data: acct, error: aErr } = await supabase
      .from("linkedin_accounts")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (aErr || !acct) throw new Error("LinkedIn not connected");

    const personUrn = `urn:li:person:${acct.linkedin_urn}`;
    const fullText =
      post.content + (post.hashtags?.length ? `\n\n${post.hashtags.join(" ")}` : "");

    try {
      await supabase.from("posts").update({ status: "publishing" }).eq("id", post.id);
      const { urn, url } = await publishUgcPost({
        accessToken: acct.access_token,
        personUrn,
        text: fullText,
        imageDataUrls: (post.media_urls ?? []).filter((u: string) => u.startsWith("data:")),
      });
      await supabase
        .from("posts")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          linkedin_post_urn: urn,
          linkedin_post_url: url,
          error_message: null,
        })
        .eq("id", post.id);
      await supabase.from("activity_logs").insert({
        user_id: userId,
        action: "publish",
        level: "info",
        message: "Published to LinkedIn",
        meta: { post_id: post.id, urn },
      });
      return { ok: true, url };
    } catch (e: any) {
      await supabase
        .from("posts")
        .update({
          status: "failed",
          error_message: String(e?.message ?? e),
          retry_count: (post.retry_count ?? 0) + 1,
        })
        .eq("id", post.id);
      await supabase.from("activity_logs").insert({
        user_id: userId,
        action: "publish",
        level: "error",
        message: String(e?.message ?? e),
        meta: { post_id: post.id },
      });
      throw e;
    }
  });
