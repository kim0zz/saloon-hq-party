import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { WantedPoster } from "@/components/WantedPoster";
import { getSessionId } from "@/lib/session";
import { toast } from "sonner";

export const Route = createFileRoute("/goscie")({ component: GuestList });

type Filter = "all" | "in" | "out" | "tournament";

function GuestList() {
  const [sessionId, setSessionId] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  useEffect(() => setSessionId(getSessionId()), []);

  const { data: guests = [], refetch } = useQuery({
    queryKey: ["guests"],
    queryFn: async () => {
      const { data } = await supabase.from("guests").select("*").order("display_name");
      return data ?? [];
    },
  });

  const filtered = guests.filter((g) => {
    if (filter === "in") return !!g.claimed_by_session_id;
    if (filter === "out") return !g.claimed_by_session_id;
    if (filter === "tournament") return g.is_tournament_player;
    return true;
  });

  const claim = async (id: string) => {
    const { error } = await supabase.from("guests").update({
      claimed_by_session_id: sessionId, claimed_at: new Date().toISOString(),
    }).eq("id", id).is("claimed_by_session_id", null);
    if (error) toast.error("Ta postać jest już zajęta");
    else toast.success("Meldujesz się w saloonie!");
    refetch();
  };

  return (
    <AppShell>
      <h1 className="font-display text-3xl text-wood-dark mb-3">Goście saloonu</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        {([["all","Wszyscy"],["in","W saloonie"],["out","Jeszcze na prerii"],["tournament","Gracze turnieju"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={"px-3 py-1 rounded font-display text-xs uppercase tracking-wider border-2 " +
              (filter === k ? "bg-wood-dark text-parchment border-wood-dark" : "bg-parchment border-wood-dark/40")}>
            {l}
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="italic text-muted-foreground text-center py-10">Nikogo tu jeszcze nie ma.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((g) => (
          <WantedPoster key={g.id} guest={g}
            taken={!!g.claimed_by_session_id}
            onClaim={g.claimed_by_session_id ? undefined : () => claim(g.id)}
            compact />
        ))}
      </div>
    </AppShell>
  );
}
