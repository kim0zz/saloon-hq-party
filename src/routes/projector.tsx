import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/projector")({ component: Projector });

const AUTO_SCREENS = ["current_match", "next_match", "last_result", "standings", "bracket", "announcement", "wall"] as const;

function Projector() {
  const [state, setState] = useState<any>(null);
  const [autoIdx, setAutoIdx] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastCallRef = useRef<string | null>(null);

  const { data: matches = [] } = useQuery({
    queryKey: ["p_matches"],
    queryFn: async () => (await supabase.from("tournament_matches").select("*, team_a:teams!tournament_matches_team_a_id_fkey(name), team_b:teams!tournament_matches_team_b_id_fkey(name)").order("scheduled_order")).data ?? [],
    refetchInterval: 3000,
  });
  const { data: teams = [] } = useQuery({
    queryKey: ["p_teams"],
    queryFn: async () => (await supabase.from("teams").select("*")).data ?? [],
    refetchInterval: 5000,
  });
  const { data: announcements = [] } = useQuery({
    queryKey: ["p_ann"],
    queryFn: async () => (await supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false })).data ?? [],
    refetchInterval: 5000,
  });
  const { data: wall = [] } = useQuery({
    queryKey: ["p_wall"],
    queryFn: async () => (await supabase.from("wall_posts").select("*, guest:guests(display_name)").eq("is_hidden", false).order("created_at", { ascending: false }).limit(5)).data ?? [],
    refetchInterval: 8000,
  });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("projector_state").select("*").limit(1).maybeSingle();
      setState(data);
    };
    load();
    const ch = supabase.channel("projector").on("postgres_changes",
      { event: "*", schema: "public", table: "projector_state" },
      (payload: any) => setState(payload.new)).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Auto rotation
  useEffect(() => {
    if (!state || state.mode !== "automatic") return;
    const t = setInterval(() => setAutoIdx((i) => (i + 1) % AUTO_SCREENS.length),
      (state.rotation_interval_seconds || 15) * 1000);
    return () => clearInterval(t);
  }, [state?.mode, state?.rotation_interval_seconds]);

  // Play bell on new call to table
  useEffect(() => {
    if (!state?.last_call_to_table_match_id) return;
    if (lastCallRef.current === state.last_call_to_table_match_id) return;
    lastCallRef.current = state.last_call_to_table_match_id;
    if (state.sound_enabled) audioRef.current?.play().catch(() => {});
  }, [state?.last_call_to_table_match_id]);

  if (!state) return <div className="min-h-screen wood-panel" />;

  const screen = state.mode === "manual" ? state.current_screen : AUTO_SCREENS[autoIdx];
  const current = matches.find((m: any) => m.status === "in_progress" || m.status === "called");
  const next = matches.find((m: any) => m.status === "scheduled");
  const last = [...matches].reverse().find((m: any) => m.status === "finished");
  const callMatch = matches.find((m: any) => m.id === state.last_call_to_table_match_id);
  const selectedAnn = announcements.find((a) => a.id === state.selected_announcement_id) ?? announcements[0];

  return (
    <div className="min-h-screen w-full wood-panel flex flex-col items-center justify-center p-8 text-parchment">
      <audio ref={audioRef} src="/sounds/bell.mp3" preload="auto" />
      <Screen screen={screen} current={current} next={next} last={last}
        callMatch={callMatch} announcement={selectedAnn} wall={wall} teams={teams} matches={matches} />
      <div className="absolute top-4 right-4 text-xs opacity-40 font-display uppercase">
        {state.mode === "automatic" ? "Auto" : "Manual"}
      </div>
    </div>
  );
}

function Screen({ screen, current, next, last, callMatch, announcement, wall, teams, matches }: any) {
  const teamName = (id: string | null) => teams.find((t: any) => t.id === id)?.name ?? "?";
  const bigTitle = "font-display text-6xl md:text-8xl text-gold tracking-widest text-center drop-shadow";
  const teamRow = "font-display text-5xl md:text-7xl mt-6 text-center";

  if (screen === "call_to_table" && callMatch) {
    return (
      <div className="text-center animate-in fade-in duration-500">
        <div className={bigTitle}>DO STOŁU, KOWBOJE!</div>
        <div className="mt-4 italic text-2xl md:text-3xl opacity-80">Pojedynek zaraz się zaczyna</div>
        <div className={teamRow}>{teamName(callMatch.team_a_id)} <span className="text-blood">vs</span> {teamName(callMatch.team_b_id)}</div>
        <div className="mt-6 text-xl md:text-2xl opacity-80">Macie 2 minuty, zanim szeryf wpisze walkower.</div>
      </div>
    );
  }
  if (screen === "current_match") {
    return current ? (
      <div className="text-center">
        <div className={bigTitle}>AKTUALNY POJEDYNEK</div>
        <div className={teamRow}>{teamName(current.team_a_id)} <span className="text-blood">vs</span> {teamName(current.team_b_id)}</div>
        <div className="mt-6 font-display text-8xl md:text-9xl">{current.score_a} : {current.score_b}</div>
        {current.group_name && <div className="mt-4 text-xl opacity-70">grupa {current.group_name}</div>}
      </div>
    ) : <Empty title="Cisza przy stole" text="Turniej jeszcze śpi pod stołem." />;
  }
  if (screen === "next_match") {
    return next ? (
      <div className="text-center">
        <div className={bigTitle}>NASTĘPNI DO STOŁU</div>
        <div className={teamRow}>{teamName(next.team_a_id)} <span className="text-blood">vs</span> {teamName(next.team_b_id)}</div>
        <div className="mt-6 text-2xl opacity-80">Przygotujcie kapelusze.</div>
      </div>
    ) : <Empty title="Nikt nie czeka" text="Kolejki brak." />;
  }
  if (screen === "last_result") {
    return last ? (
      <div className="text-center">
        <div className={bigTitle}>POJEDYNEK ZAKOŃCZONY</div>
        <div className={teamRow}>
          <span className={last.score_a > last.score_b ? "text-gold" : ""}>{teamName(last.team_a_id)}</span>{" "}
          {last.score_a} - {last.score_b}{" "}
          <span className={last.score_b > last.score_a ? "text-gold" : ""}>{teamName(last.team_b_id)}</span>
        </div>
        <div className="mt-6 italic text-2xl opacity-80">Saloon widział wszystko.</div>
      </div>
    ) : <Empty title="Nikt jeszcze nie strzelił" text="" />;
  }
  if (screen === "standings") {
    const groups = [...new Set(matches.filter((m: any) => m.group_name).map((m: any) => m.group_name))];
    if (groups.length === 0) return <Empty title="Brak grup" text="" />;
    const g = groups[0] as string;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { computeStandings } = require("@/lib/tournament");
    const st = computeStandings(teams, matches, g);
    return (
      <div className="text-center w-full max-w-4xl">
        <div className={bigTitle}>TABLICA BANDYTÓW — {g}</div>
        <table className="w-full mt-8 text-3xl">
          <thead className="text-gold"><tr><th className="text-left">Bandy</th><th>M</th><th>W</th><th>+/-</th><th>Pkt</th></tr></thead>
          <tbody>{st.map((s: any) => (
            <tr key={s.team_id} className="border-t border-parchment/30">
              <td className="text-left py-2">{teamName(s.team_id)}</td>
              <td>{s.played}</td><td>{s.wins}</td><td>{s.goal_diff}</td>
              <td className="font-bold text-gold">{s.points}</td>
            </tr>))}
          </tbody>
        </table>
      </div>
    );
  }
  if (screen === "bracket") {
    const semis = matches.filter((m: any) => m.phase === "semifinal");
    const final = matches.find((m: any) => m.phase === "final");
    return (
      <div className="text-center">
        <div className={bigTitle}>DROGA DO FINAŁU</div>
        <div className="mt-8 grid grid-cols-2 gap-8 text-3xl">
          <div>
            <div className="font-display text-gold mb-3">Półfinały</div>
            {semis.length === 0 ? <div className="italic opacity-60">brak</div> :
              semis.map((m: any) => <div key={m.id} className="mb-2">{teamName(m.team_a_id)} vs {teamName(m.team_b_id)} <span className="opacity-70">{m.status === "finished" ? `(${m.score_a}:${m.score_b})` : ""}</span></div>)}
          </div>
          <div>
            <div className="font-display text-gold mb-3">Finał</div>
            {final ? <div>{teamName(final.team_a_id)} vs {teamName(final.team_b_id)} {final.status === "finished" ? `(${final.score_a}:${final.score_b})` : ""}</div> : <div className="italic opacity-60">brak</div>}
          </div>
        </div>
      </div>
    );
  }
  if (screen === "announcement") {
    return announcement ? (
      <div className="text-center max-w-4xl">
        <div className={bigTitle}>OGŁOSZENIE SZERYFA</div>
        <div className="mt-8 parchment rounded-xl p-10 text-ink">
          <div className="font-display text-5xl">{announcement.title}</div>
          <div className="mt-4 text-2xl whitespace-pre-wrap">{announcement.content}</div>
        </div>
      </div>
    ) : <Empty title="Cisza szeryfa" text="Brak ogłoszeń." />;
  }
  if (screen === "wall") {
    return (
      <div className="text-center w-full max-w-4xl">
        <div className={bigTitle}>GŁOSY Z SALOONU</div>
        {wall.length === 0 ? <div className="mt-6 italic opacity-70 text-2xl">Na tablicy cisza jak na prerii.</div> :
          <ul className="mt-8 space-y-4 text-2xl">
            {wall.slice(0, 5).map((p: any) => (
              <li key={p.id} className="parchment rounded p-4 text-ink text-left">
                <div className="font-display text-blood">{p.guest?.display_name ?? "?"}</div>
                <div>{p.content}</div>
              </li>
            ))}
          </ul>}
      </div>
    );
  }
  return <Empty title="Saloon Party HQ" text="" />;
}

function Empty({ title, text }: { title: string; text: string }) {
  return <div className="text-center"><div className="font-display text-6xl text-gold">{title}</div><div className="mt-4 text-2xl italic opacity-80">{text}</div></div>;
}
