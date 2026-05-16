import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getProfileAndSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: settings }, { data: linkedin }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("agent_settings").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("linkedin_accounts")
        .select("linkedin_urn,linkedin_name,linkedin_picture,expires_at")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    return { profile, settings, linkedin };
  });

const ProfileInput = z.object({
  full_name: z.string().max(120).optional(),
  brand_voice: z.string().max(2000).optional(),
  target_audience: z.string().max(2000).optional(),
  niche: z.string().max(500).optional(),
});

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ProfileInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").update(data).eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const SettingsInput = z.object({
  autopilot_enabled: z.boolean().optional(),
  daily_post_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  timezone: z.string().max(80).optional(),
  posts_per_week: z.number().int().min(1).max(14).optional(),
  content_pillars: z.array(z.string().max(80)).max(20).optional(),
  preferred_hashtags: z.array(z.string().max(60)).max(20).optional(),
  notify_email: z.boolean().optional(),
  ai_extra_instructions: z.string().max(2000).optional(),
});

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SettingsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("agent_settings")
      .upsert({ user_id: userId, ...data }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
