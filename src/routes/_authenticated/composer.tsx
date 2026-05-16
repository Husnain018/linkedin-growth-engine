import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generatePost, suggestTopics, generateImage } from "@/lib/ai.functions";
import { upsertPost } from "@/lib/posts.functions";
import { publishNow } from "@/lib/linkedin.functions";
import { toast } from "sonner";
import { Sparkles, Loader2, ImageIcon, Send, CalendarClock, Lightbulb } from "lucide-react";

export const Route = createFileRoute("/_authenticated/composer")({
  component: Composer,
  head: () => ({ meta: [{ title: "AI Composer — Pulseline" }] }),
});

function Composer() {
  const nav = useNavigate();
  const generateFn = useServerFn(generatePost);
  const topicsFn = useServerFn(suggestTopics);
  const imageFn = useServerFn(generateImage);
  const saveFn = useServerFn(upsertPost);
  const publishFn = useServerFn(publishNow);

  const [topic, setTopic] = useState("");
  const [type, setType] = useState<"text" | "image" | "carousel">("text");
  const [pillar, setPillar] = useState("");
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [scheduledFor, setScheduledFor] = useState("");

  const topics = useQuery({
    queryKey: ["topics"],
    queryFn: () => topicsFn({ data: { count: 6 } }),
    staleTime: 5 * 60_000,
  });

  const gen = useMutation({
    mutationFn: () => generateFn({ data: { topic, type, pillar: pillar || undefined } }),
    onSuccess: (res) => {
      setContent(res.content);
      setHashtags(res.hashtags);
      if (res.image_prompt && type === "image") {
        img.mutate(res.image_prompt);
      }
      toast.success("Draft generated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const img = useMutation({
    mutationFn: (prompt: string) => imageFn({ data: { prompt } }),
    onSuccess: (r) => setImageDataUrl(r.dataUrl),
    onError: (e: any) => toast.error("Image: " + e.message),
  });

  const save = useMutation({
    mutationFn: (status: "draft" | "scheduled") =>
      saveFn({
        data: {
          type,
          topic,
          content,
          hashtags,
          status,
          media_urls: imageDataUrl ? [imageDataUrl] : [],
          scheduled_for: status === "scheduled" && scheduledFor ? new Date(scheduledFor).toISOString() : null,
        },
      }),
    onSuccess: (_, status) => {
      toast.success(status === "scheduled" ? "Post scheduled" : "Draft saved");
      nav({ to: status === "scheduled" ? "/queue" : "/history" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const publish = useMutation({
    mutationFn: async () => {
      const r = await saveFn({
        data: {
          type,
          topic,
          content,
          hashtags,
          status: "draft",
          media_urls: imageDataUrl ? [imageDataUrl] : [],
        },
      });
      return publishFn({ data: { post_id: r.id } });
    },
    onSuccess: (r: any) => {
      toast.success("Published to LinkedIn!");
      if (r?.url) window.open(r.url, "_blank");
      nav({ to: "/history" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold">AI Composer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pick a topic or let the agent suggest one. Generate. Refine. Schedule.
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold flex items-center gap-2">
                <Lightbulb className="size-4 text-primary-glow" /> Topic ideas
              </h2>
              <button
                onClick={() => topics.refetch()}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Refresh
              </button>
            </div>
            {topics.isLoading ? (
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="size-3 animate-spin" /> Brainstorming…
              </div>
            ) : (
              <div className="space-y-2">
                {topics.data?.topics?.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setTopic(t.title)}
                    className="w-full text-left p-3 rounded-lg bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border transition text-sm"
                  >
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.angle}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-3">
            <label className="block text-xs uppercase tracking-wider text-muted-foreground">Topic</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Why most B2B AI demos fail"
              className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="grid grid-cols-3 gap-2">
              {(["text", "image", "carousel"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`py-2 rounded-lg text-xs capitalize border transition ${
                    type === t
                      ? "bg-primary text-primary-foreground border-primary shadow-glow"
                      : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              value={pillar}
              onChange={(e) => setPillar(e.target.value)}
              placeholder="Pillar (optional): Education, Story, Tactic, Hot take…"
              className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={() => gen.mutate()}
              disabled={!topic || gen.isPending}
              className="w-full py-2.5 rounded-lg bg-gradient-primary text-primary-foreground font-medium shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {gen.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Generate draft
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Post content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              placeholder="Your post will appear here. You can edit freely."
              className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring font-sans whitespace-pre-wrap"
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {hashtags.map((h, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-primary-glow">
                  {h}
                </span>
              ))}
            </div>
            {type === "image" && (
              <div className="mt-4">
                {imageDataUrl ? (
                  <img src={imageDataUrl} alt="" className="rounded-lg border border-border max-h-72 object-contain" />
                ) : (
                  <button
                    onClick={() => topic && img.mutate(`A clean, brand-forward visual for a LinkedIn post about: ${topic}`)}
                    disabled={img.isPending || !topic}
                    className="w-full py-6 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:bg-secondary/30 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {img.isPending ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
                    Generate image
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-3">
            <label className="block text-xs uppercase tracking-wider text-muted-foreground">
              Schedule (optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                disabled={!content || save.isPending}
                onClick={() => save.mutate("draft")}
                className="py-2.5 rounded-lg border border-border text-sm hover:bg-secondary disabled:opacity-50"
              >
                Save draft
              </button>
              <button
                disabled={!content || !scheduledFor || save.isPending}
                onClick={() => save.mutate("scheduled")}
                className="py-2.5 rounded-lg border border-border text-sm hover:bg-secondary disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <CalendarClock className="size-4" /> Schedule
              </button>
              <button
                disabled={!content || publish.isPending}
                onClick={() => publish.mutate()}
                className="py-2.5 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium shadow-glow disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {publish.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Publish
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
