import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: posts }, { data: logs }, { data: linkedin }, { data: settings }] = await Promise.all([
      supabase
        .from("posts")
        .select("id,status,topic,content,scheduled_for,published_at,linkedin_post_url,type,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("linkedin_accounts").select("linkedin_name,linkedin_picture").eq("user_id", userId).maybeSingle(),
      supabase.from("agent_settings").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    const all = posts ?? [];
    const stats = {
      total: all.length,
      scheduled: all.filter((p) => p.status === "scheduled").length,
      published: all.filter((p) => p.status === "published").length,
      failed: all.filter((p) => p.status === "failed").length,
      drafts: all.filter((p) => p.status === "draft").length,
    };
    return { posts: all, logs: logs ?? [], linkedin, settings, stats };
  });
