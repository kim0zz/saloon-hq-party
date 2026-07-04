import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { computeStandings } from "@/lib/tournament";
import { useMemo } from "react";

export const Route = createFileRoute("/turniej")({ component: TournamentView });

function TournamentView() {
  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => (await supabase.from("teams").select("*, p1:guests!teams_player_1_guest_id_fkey(display_name), p2:guests!teams_player_2_guest_id_fkey(display_name)")).data ?? [],
  });
  const { data: matches = [] } = useQuery({
    queryKey: ["matches_full"],
    queryFn: async () => (await supabase.from("tournament_matches").select("*, team_a:teams!tournament_matches_team_a_id_fkey(name), team_b:teams!tournament_matches_team_b_id_fkey(name)").order("scheduled_order")).data ?? [],
  });

  const teamName = (id: string | null) => teams.find((t: any) => t.id === id)?.name ?? "?";
  const current = matches.find((m: any) => m.status === "in_progress" || m.status === "called");
  const next = matches.find((m: any) => m.status === "scheduled");
  const finished = matches.filter((m: any) => m.status === "finished");
  const groups = useMemo(() => {
    const set = new Set(matches.filter((m: any) => m.phase === "group" && m.group_name).map((m: any) => m.group_name));
    return [...set] as string[];
  }, [matches]);

  const stats = useMemo(() => {
    if (finished.length === 0) return null;
    const wins = new Map<string, number>();
    let biggest = finished[0] as any, smallest = finished[0] as any, topGoals = 0, topGoalsTeam = "";
    for (const m of finished as any[]) {
      const w = m.score_a > m.score_b ? m.team_a_id : m.score_b > m.score_a ? m.team_b_id : null;
      if (w) wins.set(w, (wins.get(w) ?? 0) + 1);
      const diff = Math.abs(m.score_a - m.score_b);
      if (diff > Math.abs(biggest.score_a - biggest.score_b)) biggest = m;
      if (diff < Math.abs(smallest.score_a - smallest.score_b)) smallest = m;
      if (m.score_a > topGoals) { topGoals = m.score_a; topGoalsTeam = teamName(m.team_a_id); }
      if (m.score_b > topGoals) { topGoals = m.score_b; topGoalsTeam = teamName(m.team_b_id); }
    }
    const [bandit] = [...wins.entries()].sort((a, b) => b[1] - a[1]);
    return { bandit: bandit ? teamName(bandit[0]) : "-", biggest, smallest, topGoalsTeam, topGoals };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, teams]);

  return (
    <AppShell>
      <h1 className="font-display text-3xl text-wood-dark mb-3">Pojedynki przy stole</h1>

      <section className="parchment rounded-lg p-4 mb-4">
        <h2 className="font-display text-xl">Aktualny pojedynek</h2>
        {current ? (
          <div className="mt-2 text-center">
            <div className="font-display text-2xl">{teamName(current.team_a_id)} vs {teamName(current.team_b_id)}</div>
            <div className="text-3xl font-display mt-1">{current.score_a} : {current.score_b}</div>
          </div>
        ) : <p className="italic text-muted-foreground">Turniej jeszcze śpi pod stołem.</p>}
        {next && (
          <div className="mt-3 border-t border-wood-dark/30 pt-3">
            <div className="text-xs uppercase font-display text-blood">Następni do stołu</div>
            <div className="font-display text-lg">{teamName(next.team_a_id)} vs {teamName(next.team_b_id)}</div>
            <div className="text-xs italic">Przygotujcie kapelusze.</div>
          </div>
        )}
      </section>

      <section className="parchment rounded-lg p-4 mb-4">
        <h2 className="font-display text-xl mb-2">Bandy</h2>
        {teams.length === 0 ? <p className="italic text-muted-foreground">Szeryf jeszcze nie zwołał band.</p> : (
          <ul className="space-y-1">
            {teams.map((t: any) => (
              <li key={t.id} className="text-sm">
                <span className="font-display text-wood-dark">{t.name}</span>
                <span className="text-muted-foreground"> — {t.p1?.display_name ?? "?"} & {t.p2?.display_name ?? "?"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {groups.map((g) => {
        const st = computeStandings(teams as any, matches as any, g);
        return (
          <section key={g} className="parchment rounded-lg p-4 mb-4 overflow-x-auto">
            <h2 className="font-display text-xl mb-2">Tablica bandytów — grupa {g}</h2>
            <table className="w-full text-sm">
              <thead className="font-display text-xs uppercase">
                <tr><th className="text-left">Bandy</th><th>M</th><th>W</th><th>P</th><th>+/-</th><th>Pkt</th></tr>
              </thead>
              <tbody>
                {st.map((s) => (
                  <tr key={s.team_id} className="border-t border-wood-dark/20">
                    <td className="py-1 text-left">{teamName(s.team_id)}</td>
                    <td className="text-center">{s.played}</td>
                    <td className="text-center">{s.wins}</td>
                    <td className="text-center">{s.losses}</td>
                    <td className="text-center">{s.goal_diff}</td>
                    <td className="text-center font-bold">{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}

      <section className="parchment rounded-lg p-4 mb-4">
        <h2 className="font-display text-xl mb-2">Wszystkie pojedynki</h2>
        {matches.length === 0 ? <p className="italic text-muted-foreground">Brak zaplanowanych pojedynków.</p> : (
          <ul className="space-y-1 text-sm">
            {matches.map((m: any) => (
              <li key={m.id} className="flex justify-between border-b border-wood-dark/10 py-1">
                <span>{m.group_name ? `[${m.group_name}] ` : ""}{teamName(m.team_a_id)} vs {teamName(m.team_b_id)}</span>
                <span className="font-display">{m.status === "finished" ? `${m.score_a}:${m.score_b}` : m.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {stats && (
        <section className="parchment rounded-lg p-4">
          <h2 className="font-display text-xl mb-2">Kroniki saloonu</h2>
          <ul className="text-sm space-y-1">
            <li>🏆 Największy bandyta turnieju: <b>{stats.bandit}</b></li>
            <li>💥 Największy pogrom: {teamName(stats.biggest.team_a_id)} {stats.biggest.score_a}:{stats.biggest.score_b} {teamName(stats.biggest.team_b_id)}</li>
            <li>🥊 Najbardziej dramatyczny pojedynek: {teamName(stats.smallest.team_a_id)} {stats.smallest.score_a}:{stats.smallest.score_b} {teamName(stats.smallest.team_b_id)}</li>
            <li>🎯 Najwięcej goli w meczu: {stats.topGoalsTeam} ({stats.topGoals})</li>
          </ul>
        </section>
      )}
    </AppShell>
  );
}
