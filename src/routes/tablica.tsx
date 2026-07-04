import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { AvatarBubble } from "@/components/WantedPoster";
import { getSessionId } from "@/lib/session";
import { toast } from "sonner";

export const Route = createFileRoute("/tablica")({ component: Wall });

function Wall() {
  const qc = useQueryClient();
  const [sessionId, setSessionId] = useState("");
  const [text, setText] = useState("");
  useEffect(() => setSessionId(getSessionId()), []);

  const { data: my } = useQuery({
    queryKey: ["me", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data } = await supabase.from("guests").select("*").eq("claimed_by_session_id", sessionId).maybeSingle();
      return data;
    },
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["wall"],
    queryFn: async () => (await supabase.from("wall_posts").select("*, guest:guests(*)").eq("is_hidden", false).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements_all"],
    queryFn: async () => (await supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false })).data ?? [],
  });

  const send = async () => {
    if (!text.trim()) return;
    if (!my) { toast.error("Najpierw wybierz swoją postać"); return; }
    const { error } = await supabase.from("wall_posts").insert({ guest_id: my.id, content: text.trim() });
    if (error) toast.error(error.message);
    else { setText(""); qc.invalidateQueries({ queryKey: ["wall"] }); }
  };

  return (
    <AppShell>
      <h1 className="font-display text-3xl text-wood-dark mb-3">Tablica Saloonu</h1>

      <section className="parchment rounded-lg p-4 mb-4">
        <h2 className="font-display text-xl mb-2">Ogłoszenia Szeryfa</h2>
        {announcements.length === 0 ? (
          <p className="italic text-muted-foreground">Szeryf nie dodał jeszcze ogłoszeń.</p>
        ) : (
          <ul className="space-y-3">
            {announcements.map((a) => (
              <li key={a.id} className="border-l-4 border-blood pl-3">
                <div className="font-display text-lg">{a.pinned && "📌 "}{a.title}</div>
                <div className="text-sm whitespace-pre-wrap">{a.content}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="parchment rounded-lg p-4 mb-4">
        <h2 className="font-display text-xl mb-2">Co słychać na prerii?</h2>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2}
          placeholder="Dodaj wiadomość na tablicy..."
          className="w-full rounded border-2 border-wood-dark/40 bg-parchment p-2 text-sm" />
        <button onClick={send} className="btn-saloon active:btn-saloon-active mt-2 px-4 py-2 rounded text-sm">
          Wyślij do saloonu
        </button>
      </section>

      {posts.length === 0 ? (
        <p className="italic text-muted-foreground text-center">Na tablicy cisza jak na prerii.</p>
      ) : (
        <ul className="space-y-3">
          {posts.map((p: any) => (
            <li key={p.id} className="parchment rounded-lg p-3 flex gap-3">
              {p.guest ? <AvatarBubble guest={p.guest} size={48} /> :
                <div className="w-12 h-12 rounded-full bg-wood-dark/30" />}
              <div className="flex-1">
                <div className="font-display text-wood-dark">{p.guest?.display_name ?? "Nieznajomy"}</div>
                <div className="text-sm whitespace-pre-wrap">{p.content}</div>
                <div className="text-xs text-muted-foreground mt-1">{new Date(p.created_at).toLocaleString("pl-PL")}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
