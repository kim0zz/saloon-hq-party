import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { getSessionId } from "@/lib/session";
import { uploadAndSign } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/galeria")({ component: Gallery });

function Gallery() {
  const qc = useQueryClient();
  const [sessionId, setSessionId] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  useEffect(() => setSessionId(getSessionId()), []);

  const { data: my } = useQuery({
    queryKey: ["me", sessionId], enabled: !!sessionId,
    queryFn: async () => (await supabase.from("guests").select("*").eq("claimed_by_session_id", sessionId).maybeSingle()).data,
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["photos"],
    queryFn: async () => (await supabase.from("party_photos").select("*, guest:guests(display_name)").eq("is_hidden", false).order("created_at", { ascending: false })).data ?? [],
  });

  const upload = async (file: File) => {
    if (!my) { toast.error("Najpierw wybierz swoją postać"); return; }
    setUploading(true);
    try {
      const url = await uploadAndSign("party-photos", file);
      await supabase.from("party_photos").insert({ guest_id: my.id, file_url: url, caption: caption.trim() || null });
      setCaption("");
      qc.invalidateQueries({ queryKey: ["photos"] });
      toast.success("Zdjęcie w galerii!");
    } catch (e: any) { toast.error(e.message ?? "Nie udało się wgrać"); }
    finally { setUploading(false); }
  };

  return (
    <AppShell>
      <h1 className="font-display text-3xl text-wood-dark mb-3">Galeria z prerii</h1>
      <section className="parchment rounded-lg p-4 mb-4">
        <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)}
          placeholder="Podpis (opcjonalnie)"
          className="w-full rounded border-2 border-wood-dark/40 bg-parchment p-2 text-sm mb-2" />
        <label className="btn-saloon inline-block px-4 py-2 rounded text-sm cursor-pointer">
          {uploading ? "Wgrywam..." : "Wybierz zdjęcie"}
          <input type="file" accept="image/*" className="hidden" disabled={uploading}
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
      </section>
      {photos.length === 0 ? (
        <p className="italic text-muted-foreground text-center">Nikt jeszcze nie wrzucił zdjęć z prerii.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((p: any) => (
            <div key={p.id} className="parchment rounded-lg p-2">
              <img src={p.file_url} alt="" className="w-full h-40 object-cover rounded" loading="lazy" />
              {p.caption && <div className="text-xs mt-1 italic">{p.caption}</div>}
              <div className="text-[10px] text-muted-foreground font-display">{p.guest?.display_name ?? "?"}</div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
