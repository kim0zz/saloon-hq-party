import type { Tables } from "@/integrations/supabase/types";

export type Team = Tables<"teams">;
export type Match = Tables<"tournament_matches">;

export type Standing = {
  team_id: string;
  played: number;
  wins: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
};

export function computeStandings(teams: Team[], matches: Match[], group?: string): Standing[] {
  const filtered = matches.filter(
    (m) => m.phase === "group" && m.status === "finished" && (!group || m.group_name === group),
  );
  const bag = new Map<string, Standing>();
  for (const t of teams) {
    bag.set(t.id, {
      team_id: t.id, played: 0, wins: 0, losses: 0,
      goals_for: 0, goals_against: 0, goal_diff: 0, points: 0,
    });
  }
  for (const m of filtered) {
    if (!m.team_a_id || !m.team_b_id) continue;
    const a = bag.get(m.team_a_id); const b = bag.get(m.team_b_id);
    if (!a || !b) continue;
    a.played++; b.played++;
    a.goals_for += m.score_a; a.goals_against += m.score_b;
    b.goals_for += m.score_b; b.goals_against += m.score_a;
    if (m.score_a > m.score_b) { a.wins++; b.losses++; a.points += 3; }
    else if (m.score_b > m.score_a) { b.wins++; a.losses++; b.points += 3; }
    else { a.points += 1; b.points += 1; }
  }
  for (const s of bag.values()) s.goal_diff = s.goals_for - s.goals_against;
  return [...bag.values()].sort(
    (x, y) => y.points - x.points || y.goal_diff - x.goal_diff || y.goals_for - x.goals_for || y.wins - x.wins,
  );
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Round-robin pairings for a group
export function roundRobinPairs<T extends { id: string }>(items: T[]): Array<[T, T]> {
  const out: Array<[T, T]> = [];
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) out.push([items[i], items[j]]);
  return out;
}
