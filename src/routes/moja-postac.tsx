import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { AvatarBubble, WantedPoster } from "@/components/WantedPoster";
import { getSessionId, resetSessionId } from "@/lib/session";
import { AVATAR_PRESETS } from "@/lib/avatars";
import { WANTED_SUGGESTIONS } from "@/lib/wanted";
import { uploadAndSign } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/moja-postac")({ component: Me });

function Me() {
  const qc = useQueryClient();
  const [sessionId, setSessionId] = useState("");
  useEffect(() => setSessionId(getSessionId()), []);

  const { data: my, refetch } = useQuery({
    queryKey: ["me", sessionId], enabled: !!sessionId,
    queryFn: async () => (await supabase.from("guests").select("*").eq("claimed_by_session_id", sessionId).maybeSingle()).data,
  });

  const [name, setName] = useState(""); const [wanted, setWanted] = useState("");
  useEffect(() => { if (my) { setName(my.display_name); setWanted(my.wanted_for); } }, [my?.id]);

  if (!my) {
    return <AppShell>
      <div className="parchment rounded-lg p-6 text-center">
        <p className="italic mb-3">Nie zameldowałeś się jeszcze w saloonie.</p>
        <Link to="/" className="btn-saloon inline-block px-4 py-2 rounded">Wybierz Wanted</Link>
      </div>
    </AppShell>;
  }

  const save = async () => {
    await supabase.from("guests").update({ display_name: name, wanted_for: wanted }).eq("id", my.id);
    toast.success("Zapisano");
    refetch();
  };

  const setPreset = async (id: string) => {
    await supabase.from("guests").update({ avatar_type: "preset", avatar_url: id }).eq("id", my.id);
    refetch();
  };

  const uploadAvatar = async (file: File) => {
    try {
      const url = await uploadAndSign("avatars", file);
      await supabase.from("guests").update({ avatar_type: "upload", avatar_url: url }).eq("id", my.id);
      refetch();
    } catch (e: any) { toast.error(e.message); }
  };

  const release = async () => {
    if (!confirm("Zmieniasz przebranie? Postać wróci do saloonu.")) return;
    await supabase.from("guests").update({ claimed_by_session_id: null, claimed_at: null }).eq("id", my.id);
    resetSessionId();
    qc.clear();
    location.href = "/";
  };

  return (
    <AppShell>
      <h1 className="font-display text-3xl text-wood-dark mb-3">Moja postać</h1>
      <WantedPoster guest={my} compact />

      <section className="parchment rounded-lg p-4 mt-4 space-y-3">
        <div>
          <label className="text-xs font-display uppercase">Ksywa</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded border-2 border-wood-dark/40 bg-parchment p-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-display uppercase">Wanted for</label>
          <input value={wanted} onChange={(e) => setWanted(e.target.value)}
            className="w-full rounded border-2 border-wood-dark/40 bg-parchment p-2 text-sm" />
          <div className="flex flex-wrap gap-1 mt-2">
            {WANTED_SUGGESTIONS.slice(0, 6).map((s) => (
              <button key={s} onClick={() => setWanted(s)} className="text-[10px] px-2 py-0.5 rounded bg-wood-dark/10 border border-wood-dark/30">
                {s}
              </button>
            ))}
          </div>
        </div>
        <button onClick={save} className="btn-saloon px-4 py-2 rounded text-sm">Zapisz</button>
      </section>

      <section className="parchment rounded-lg p-4 mt-4">
        <h2 className="font-display text-xl mb-2">Awatar</h2>
        <div className="grid grid-cols-4 gap-2">
          {AVATAR_PRESETS.map((p) => (
            <button key={p.id} onClick={() => setPreset(p.id)}
              className="flex flex-col items-center p-1 rounded hover:bg-wood-dark/10">
              <div className="rounded-full flex items-center justify-center border-2 border-wood-dark"
                style={{ width: 48, height: 48, background: p.bg, fontSize: 24 }}>
                {p.emoji}
              </div>
              <div className="text-[9px] mt-1 text-center leading-tight">{p.label}</div>
            </button>
          ))}
        </div>
        <label className="btn-saloon inline-block mt-3 px-3 py-2 rounded text-sm cursor-pointer">
          Wgraj własne zdjęcie
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
        </label>
      </section>

      <button onClick={release} className="w-full mt-6 bg-blood text-parchment font-display uppercase tracking-wider py-3 rounded">
        Zmieniam przebranie
      </button>
    </AppShell>
  );
}
