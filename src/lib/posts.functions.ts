import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { status?: string } = {}) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (data?.status) q = q.eq("status", data.status as any);
    const { data: posts, error } = await q;
    if (error) throw new Error(error.message);
    return { posts: posts ?? [] };
  });

const SaveInput = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(["text", "image", "carousel", "article"]).default("text"),
  topic: z.string().max(300).optional(),
  hook: z.string().max(500).optional(),
  content: z.string().min(1).max(8000),
  hashtags: z.array(z.string().max(60)).max(15).default([]),
  media_urls: z.array(z.string().url()).max(10).default([]),
  scheduled_for: z.string().datetime().optional().nullable(),
  status: z.enum(["draft", "scheduled"]).default("draft"),
});

export const upsertPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SaveInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const hash = await sha256(data.content);
    const row = {
      ...data,
      user_id: userId,
      content_hash: hash,
      scheduled_for: data.scheduled_for ?? null,
    };
    if (data.id) {
      const { error } = await supabase.from("posts").update(row).eq("id", data.id).eq("user_id", userId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: ins, error } = await supabase.from("posts").insert(row).select("id").single();
    if (error) throw new Error(error.message);
    return { id: ins.id };
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("posts").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cancelSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("posts")
      .update({ status: "draft", scheduled_for: null })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
