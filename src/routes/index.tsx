import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { WantedPoster } from "@/components/WantedPoster";
import { getSessionId } from "@/lib/session";
import { randomWanted } from "@/lib/wanted";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [sessionId, setSessionId] = useState("");
  useEffect(() => { setSessionId(getSessionId()); }, []);

  const { data: guests = [], refetch } = useQuery({
    queryKey: ["guests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("guests").select("*").order("created_at");
      if (error) throw error; return data;
    },
  });
  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data } = await supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(3);
      return data ?? [];
    },
  });
  const { data: matches = [] } = useQuery({
    queryKey: ["matches"],
    queryFn: async () => {
      const { data } = await supabase.from("tournament_matches").select("*, team_a:teams!tournament_matches_team_a_id_fkey(name), team_b:teams!tournament_matches_team_b_id_fkey(name)").order("scheduled_order");
      return data ?? [];
    },
  });
  const { data: wall = [] } = useQuery({
    queryKey: ["wall_home"],
    queryFn: async () => {
      const { data } = await supabase.from("wall_posts").select("*, guest:guests(display_name, avatar_type, avatar_url)").eq("is_hidden", false).order("created_at", { ascending: false }).limit(3);
      return data ?? [];
    },
  });

  const my = guests.find((g) => g.claimed_by_session_id === sessionId);
  const unclaimed = guests.filter((g) => !g.claimed_by_session_id);
  const current = matches.find((m: any) => m.status === "in_progress" || m.status === "called");
  const next = matches.find((m: any) => m.status === "scheduled");

  const claim = async (id: string) => {
    const { error } = await supabase.from("guests").update({
      claimed_by_session_id: sessionId, claimed_at: new Date().toISOString(),
      wanted_for: guests.find(g => g.id === id)?.wanted_for || randomWanted(),
    }).eq("id", id).is("claimed_by_session_id", null);
    if (error) { toast.error("Ktoś już zajął tę postać"); refetch(); return; }
    toast.success("Meldujesz się w saloonie!");
    refetch();
  };

  return (
    <AppShell>
      {!my ? (
        <section className="parchment rounded-lg p-5 text-center">
          <h1 className="font-display text-3xl text-wood-dark">Witaj w Saloonie</h1>
          <p className="mt-2 text-ink/80 italic">Wybierz swoją kartę WANTED, kowboju.</p>
          {guests.length === 0 && (
            <p className="mt-6 italic text-muted-foreground">
              Saloon jeszcze pusty. Poproś szeryfa o dodanie postaci.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {guests.map((g) => (
              <WantedPoster key={g.id} guest={g} taken={!!g.claimed_by_session_id}
                onClaim={g.claimed_by_session_id ? undefined : () => claim(g.id)} compact />
            ))}
          </div>
        </section>
      ) : (
        <div className="space-y-4">
          <section className="parchment rounded-lg p-4">
            <h2 className="font-display text-xl text-wood-dark mb-2">Twój Wanted</h2>
            <WantedPoster guest={my} compact />
            <Link to="/moja-postac" className="btn-saloon inline-block mt-3 px-3 py-2 rounded text-sm">Edytuj postać</Link>
          </section>

          <section className="parchment rounded-lg p-4">
            <h2 className="font-display text-xl text-wood-dark">Ogłoszenia szeryfa</h2>
            {announcements.length === 0 ? (
              <p className="italic text-muted-foreground mt-2">Szeryf nie dodał jeszcze ogłoszeń.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {announcements.map((a) => (
                  <li key={a.id} className="border-l-4 border-blood pl-3">
                    <div className="font-display text-lg">{a.pinned && "📌 "}{a.title}</div>
                    <div className="text-sm">{a.content}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="parchment rounded-lg p-4">
            <h2 className="font-display text-xl text-wood-dark">Pojedynek</h2>
            {current ? (
              <div className="mt-2">
                <div className="text-xs uppercase text-blood font-display">Aktualny</div>
                <div className="font-display text-2xl">{(current as any).team_a?.name} vs {(current as any).team_b?.name}</div>
              </div>
            ) : (
              <p className="italic text-muted-foreground">Turniej jeszcze śpi pod stołem.</p>
            )}
            {next && (
              <div className="mt-3">
                <div className="text-xs uppercase text-wood-dark font-display">Następni do stołu</div>
                <div className="font-display text-lg">{(next as any).team_a?.name} vs {(next as any).team_b?.name}</div>
              </div>
            )}
            <Link to="/turniej" className="btn-saloon inline-block mt-3 px-3 py-2 rounded text-sm">Otwórz turniej</Link>
          </section>

          <section className="parchment rounded-lg p-4">
            <h2 className="font-display text-xl text-wood-dark">Głosy z saloonu</h2>
            {wall.length === 0 ? (
              <p className="italic text-muted-foreground mt-2">Na tablicy cisza jak na prerii.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {wall.map((p: any) => (
                  <li key={p.id} className="text-sm">
                    <span className="font-display text-wood-dark">{p.guest?.display_name ?? "Nieznajomy"}:</span>{" "}
                    {p.content}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}
