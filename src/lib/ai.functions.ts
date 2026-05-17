import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway";

const TopicsInput = z.object({
  niche: z.string().max(500).optional(),
  count: z.number().int().min(3).max(10).default(6),
});

export const suggestTopics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => TopicsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured");

    const { data: profile } = await supabase
      .from("profiles")
      .select("niche, target_audience, brand_voice")
      .eq("id", userId)
      .maybeSingle();

    const niche = data.niche ?? profile?.niche ?? "AI and startups";
    const gateway = createLovableAiGatewayProvider(key);

    const { experimental_output } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      experimental_output: Output.object({
        schema: z.object({
          topics: z
            .array(
              z.object({
                title: z.string(),
                angle: z.string(),
                why_it_works: z.string(),
              }),
            )
            .min(3),
        }),
      }),
      prompt: `You are a senior LinkedIn content strategist. Generate ${data.count} fresh, high-engagement LinkedIn post ideas for someone in this niche: "${niche}". Audience: ${profile?.target_audience ?? "professionals"}. Brand voice: ${profile?.brand_voice ?? "professional, conversational"}.

Mix categories: personal stories, contrarian takes, tactical how-tos, industry trend commentary, lessons learned. Avoid clichés. Each title should sound human, not AI.`,
    });

    return experimental_output;
  });

const GenerateInput = z.object({
  topic: z.string().min(2).max(500),
  type: z.enum(["text", "image", "carousel"]).default("text"),
  pillar: z.string().max(80).optional(),
  extra: z.string().max(1000).optional(),
});

export const generatePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => GenerateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured");

    const [{ data: profile }, { data: settings }] = await Promise.all([
      supabase.from("profiles").select("brand_voice,target_audience,niche").eq("id", userId).maybeSingle(),
      supabase.from("agent_settings").select("preferred_hashtags,ai_extra_instructions").eq("user_id", userId).maybeSingle(),
    ]);

    const gateway = createLovableAiGatewayProvider(key);

    const isCarousel = data.type === "carousel";
    const sysPrompt = `You are a world-class LinkedIn ghostwriter.

WRITER'S VOICE: ${profile?.brand_voice ?? "professional, conversational"}
TARGET AUDIENCE: ${profile?.target_audience ?? "professionals"}
NICHE: ${profile?.niche ?? "general"}
${settings?.ai_extra_instructions ? `EXTRA: ${settings.ai_extra_instructions}` : ""}

RULES:
- Write like a thoughtful human, not a corporate AI
- Strong scroll-stopping hook on line 1 (no "In today's world...")
- Short paragraphs, generous line breaks, easy mobile scan
- No emojis at the start of lines unless meaningful
- End with a sharp CTA question
- Never use em-dashes, "delve", "tapestry", "in the realm of", "leverage"
- Sound specific, not generic`;

    const { experimental_output } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      experimental_output: Output.object({
        schema: z.object({
          hook: z.string(),
          content: z.string().describe("Full LinkedIn post body, ready to publish, with line breaks"),
          hashtags: z.array(z.string()).min(3).max(8),
          image_prompt: z.string().optional().describe("If type is image, a vivid prompt for an accompanying visual"),
          slides: z
            .array(z.object({ title: z.string(), body: z.string() }))
            .optional()
            .describe("If carousel, 5-8 slide outlines"),
        }),
      }),
      system: sysPrompt,
      prompt: `Write a LinkedIn ${data.type} post about: "${data.topic}".
${data.pillar ? `Content pillar: ${data.pillar}.` : ""}
${data.extra ? `Additional notes: ${data.extra}` : ""}
${isCarousel ? "Also produce 5-8 short slide outlines for a carousel." : ""}
Suggested house hashtags to consider: ${(settings?.preferred_hashtags ?? []).join(", ")}.`,
    });

    return experimental_output;
  });

const ImageInput = z.object({
  prompt: z.string().min(3).max(1000),
});

export const generateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ImageInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: data.prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Image generation failed: ${res.status} ${t}`);
    }
    const json = await res.json();
    const imgUrl = json?.choices?.[0]?.message?.images?.[0]?.image_url?.url as string | undefined;
    if (!imgUrl) throw new Error("No image returned");
    return { dataUrl: imgUrl };
  });

// Analyze a video (via sampled frames extracted on the client) + user
// requirements, and draft a LinkedIn post grounded in what's visible.
const AnalyzeFramesInput = z.object({
  frames: z.array(z.string().startsWith("data:image/")).min(1).max(8),
  requirements: z.string().min(2).max(2000),
  type: z.enum(["text", "image", "carousel"]).default("text"),
});

export const analyzeFromFrames = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => AnalyzeFramesInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured");

    const [{ data: profile }, { data: settings }] = await Promise.all([
      supabase.from("profiles").select("brand_voice,target_audience,niche").eq("id", userId).maybeSingle(),
      supabase.from("agent_settings").select("preferred_hashtags,ai_extra_instructions").eq("user_id", userId).maybeSingle(),
    ]);

    const system = `You are a world-class LinkedIn ghostwriter.
VOICE: ${profile?.brand_voice ?? "professional, conversational"}
AUDIENCE: ${profile?.target_audience ?? "professionals"}
NICHE: ${profile?.niche ?? "general"}
${settings?.ai_extra_instructions ?? ""}
You will be shown several frames sampled from a user's video. Use what's visibly in them, combined with the user's stated requirements, to write the post. Be concrete: reference what's actually shown. Strong scroll-stopping hook. Short paragraphs. End with a sharp CTA question. No em-dashes, no "delve", no "leverage".`;

    const userContent: any[] = [
      {
        type: "text",
        text: `Requirements / angle: ${data.requirements}\nPost type: ${data.type}\nSuggested hashtags pool: ${(settings?.preferred_hashtags ?? []).join(", ")}\n\nReturn STRICT JSON: {"hook": string, "content": string, "hashtags": string[], "video_summary": string${data.type === "carousel" ? ', "slides": [{"title":string,"body":string}]' : ""}}`,
      },
      ...data.frames.map((url) => ({ type: "image_url", image_url: { url } })),
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Video analysis failed: ${res.status} ${t}`);
    }
    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content as string | undefined;
    if (!text) throw new Error("No analysis returned");
    try {
      return JSON.parse(text) as {
        hook: string;
        content: string;
        hashtags: string[];
        video_summary: string;
        slides?: { title: string; body: string }[];
      };
    } catch {
      throw new Error("Model did not return valid JSON");
    }
  });
