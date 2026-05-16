import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfileAndSettings, updateProfile, updateSettings } from "@/lib/profile.functions";
import { startLinkedInOAuth, disconnectLinkedIn } from "@/lib/linkedin.functions";
import { Linkedin, Save, Loader2, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: Settings,
  head: () => ({ meta: [{ title: "Settings — Pulseline" }] }),
  validateSearch: (s) => ({ li: (s.li as string) || undefined, msg: (s.msg as string) || undefined }),
});

function Settings() {
  const qc = useQueryClient();
  const search = Route.useSearch();
  const fn = useServerFn(getProfileAndSettings);
  const updP = useServerFn(updateProfile);
  const updS = useServerFn(updateSettings);
  const startLi = useServerFn(startLinkedInOAuth);
  const dcLi = useServerFn(disconnectLinkedIn);

  const { data } = useQuery({ queryKey: ["settings"], queryFn: () => fn() });

  const [profile, setProfile] = useState({ full_name: "", brand_voice: "", target_audience: "", niche: "" });
  const [settings, setSettings] = useState({
    autopilot_enabled: false,
    daily_post_time: "09:00",
    timezone: "UTC",
    posts_per_week: 5,
    notify_email: true,
    ai_extra_instructions: "",
    preferred_hashtags: [] as string[],
    content_pillars: [] as string[],
  });

  useEffect(() => {
    if (data?.profile) {
      setProfile({
        full_name: data.profile.full_name ?? "",
        brand_voice: data.profile.brand_voice ?? "",
        target_audience: data.profile.target_audience ?? "",
        niche: data.profile.niche ?? "",
      });
    }
    if (data?.settings) {
      setSettings({
        autopilot_enabled: data.settings.autopilot_enabled,
        daily_post_time: data.settings.daily_post_time?.slice(0, 5) ?? "09:00",
        timezone: data.settings.timezone,
        posts_per_week: data.settings.posts_per_week,
        notify_email: data.settings.notify_email,
        ai_extra_instructions: data.settings.ai_extra_instructions ?? "",
        preferred_hashtags: data.settings.preferred_hashtags ?? [],
        content_pillars: data.settings.content_pillars ?? [],
      });
    }
  }, [data]);

  useEffect(() => {
    if (search.li === "ok") toast.success("LinkedIn connected!");
    if (search.li === "error") toast.error("LinkedIn connection failed: " + (search.msg ?? ""));
  }, [search.li, search.msg]);

  const saveP = useMutation({
    mutationFn: () => updP({ data: profile }),
    onSuccess: () => {
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });
  const saveS = useMutation({
    mutationFn: () => updS({ data: settings as any }),
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  async function connectLinkedIn() {
    const r = await startLi({ data: { origin: window.location.origin } });
    window.location.href = r.url;
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Tune your AI agent's voice, schedule, and connections.</p>
      </header>

      <Card title="LinkedIn account" icon={Linkedin}>
        {data?.linkedin ? (
          <div className="flex items-center gap-3">
            {data.linkedin.linkedin_picture && (
              <img src={data.linkedin.linkedin_picture} alt="" className="size-10 rounded-full" />
            )}
            <div className="flex-1">
              <div className="font-medium flex items-center gap-2">
                {data.linkedin.linkedin_name}
                <CheckCircle2 className="size-4 text-success" />
              </div>
              <div className="text-xs text-muted-foreground">
                Token expires {data.linkedin.expires_at ? new Date(data.linkedin.expires_at).toLocaleDateString() : "soon"}
              </div>
            </div>
            <button
              onClick={async () => {
                await dcLi();
                qc.invalidateQueries({ queryKey: ["settings"] });
                toast.success("Disconnected");
              }}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
            >
              <X className="size-3" /> Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connectLinkedIn}
            className="w-full py-3 rounded-lg bg-[#0A66C2] text-white font-medium hover:opacity-90 flex items-center justify-center gap-2"
          >
            <Linkedin className="size-4" /> Connect LinkedIn
          </button>
        )}
      </Card>

      <Card title="Brand voice">
        <Field label="Full name">
          <input className={inputCls} value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
        </Field>
        <Field label="Niche">
          <input className={inputCls} value={profile.niche} onChange={(e) => setProfile({ ...profile, niche: e.target.value })} />
        </Field>
        <Field label="Target audience">
          <textarea rows={2} className={inputCls} value={profile.target_audience} onChange={(e) => setProfile({ ...profile, target_audience: e.target.value })} />
        </Field>
        <Field label="Brand voice">
          <textarea rows={3} className={inputCls} value={profile.brand_voice} onChange={(e) => setProfile({ ...profile, brand_voice: e.target.value })} />
        </Field>
        <SaveBtn onClick={() => saveP.mutate()} pending={saveP.isPending} />
      </Card>

      <Card title="Posting schedule & autopilot">
        <label className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
          <div>
            <div className="font-medium text-sm">Autopilot</div>
            <div className="text-xs text-muted-foreground">Automatically publish scheduled posts.</div>
          </div>
          <input
            type="checkbox"
            checked={settings.autopilot_enabled}
            onChange={(e) => setSettings({ ...settings, autopilot_enabled: e.target.checked })}
            className="size-5 accent-primary"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Daily post time">
            <input type="time" className={inputCls} value={settings.daily_post_time} onChange={(e) => setSettings({ ...settings, daily_post_time: e.target.value })} />
          </Field>
          <Field label="Posts per week">
            <input type="number" min={1} max={14} className={inputCls} value={settings.posts_per_week} onChange={(e) => setSettings({ ...settings, posts_per_week: +e.target.value })} />
          </Field>
        </div>
        <Field label="Preferred hashtags (comma-separated)">
          <input
            className={inputCls}
            value={settings.preferred_hashtags.join(", ")}
            onChange={(e) => setSettings({ ...settings, preferred_hashtags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
          />
        </Field>
        <Field label="AI extra instructions">
          <textarea rows={3} className={inputCls} value={settings.ai_extra_instructions} onChange={(e) => setSettings({ ...settings, ai_extra_instructions: e.target.value })} />
        </Field>
        <SaveBtn onClick={() => saveS.mutate()} pending={saveS.isPending} />
      </Card>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
      <h2 className="font-display font-semibold flex items-center gap-2">
        {Icon && <Icon className="size-4 text-primary-glow" />}
        {title}
      </h2>
      {children}
    </section>
  );
}

function SaveBtn({ onClick, pending }: { onClick: () => void; pending: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="px-4 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium shadow-glow disabled:opacity-50 inline-flex items-center gap-2"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save changes
    </button>
  );
}
