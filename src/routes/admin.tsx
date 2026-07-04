import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isAdminUnlocked, lockAdmin, tryAdminPin } from "@/lib/admin";
import { AVATAR_PRESETS } from "@/lib/avatars";
import { randomWanted, WANTED_SUGGESTIONS } from "@/lib/wanted";
import { computeStandings, roundRobinPairs, shuffle } from "@/lib/tournament";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({ component: Admin });

type Tab = "goscie" | "turniej" | "projektor" | "tablica" | "galeria" | "ustawienia";

function Admin() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [tab, setTab] = useState<Tab>("goscie");
  useEffect(() => setUnlocked(isAdminUnlocked()), []);

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="parchment rounded-lg p-6 max-w-sm w-full text-center">
          <div className="font-display text-3xl text-wood-dark">Panel Szeryfa</div>
          <p className="text-sm italic mt-1">Wpisz PIN, kowboju.</p>
          <input value={pin} onChange={(e) => setPin(e.target.value)} type="password" inputMode="numeric"
            className="mt-4 w-full text-center text-2xl tracking-widest border-2 border-wood-dark/50 bg-parchment rounded p-2" />
          <button onClick={async () => {
            if (await tryAdminPin(pin)) setUnlocked(true); else toast.error("Zły PIN");
          }} className="btn-saloon mt-3 w-full py-2 rounded">Wchodzę</button>
          <Link to="/" className="block mt-4 text-xs opacity-70">← wracam do saloonu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="wood-panel px-4 py-3 flex flex-wrap gap-2 items-center">
        <div className="font-display text-2xl text-gold mr-auto">Panel Szeryfa</div>
        <button onClick={() => { lockAdmin(); setUnlocked(false); }} className="text-xs font-display uppercase text-parchment/80">Wyloguj</button>
        <Link to="/projector" target="_blank" className="text-xs font-display uppercase text-gold">Otwórz projektor ↗</Link>
      </header>
      <div className="max-w-4xl mx-auto p-3">
        <nav className="flex flex-wrap gap-2 mb-4">
          {(["goscie", "turniej", "projektor", "tablica", "galeria", "ustawienia"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={"px-3 py-1 rounded font-display text-xs uppercase border-2 " +
                (tab === t ? "bg-wood-dark text-parchment border-wood-dark" : "bg-parchment border-wood-dark/40")}>
              {t}
            </button>
          ))}
        </nav>
        {tab === "goscie" && <GuestsAdmin />}
        {tab === "turniej" && <TourneyAdmin />}
        {tab === "projektor" && <ProjectorAdmin />}
        {tab === "tablica" && <BoardAdmin />}
        {tab === "galeria" && <GalleryAdmin />}
        {tab === "ustawienia" && <SettingsAdmin />}
      </div>
    </div>
  );
}

/* -------------------- GUESTS -------------------- */
function GuestsAdmin() {
  const qc = useQueryClient();
  const { data: guests = [] } = useQuery({
    queryKey: ["admin_guests"],
    queryFn: async () => (await supabase.from("guests").select("*").order("display_name")).data ?? [],
  });
  const [name, setName] = useState("");
  const [wanted, setWanted] = useState("");
  const [preset, setPreset] = useState(AVATAR_PRESETS[0].id);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin_guests"] });

  const create = async () => {
    if (!name.trim()) return;
    await supabase.from("guests").insert({
      display_name: name.trim(), wanted_for: wanted || randomWanted(),
      avatar_type: "preset", avatar_url: preset,
    });
    setName(""); setWanted("");
    refresh();
  };
  const del = async (id: string) => {
    if (!confirm("Usunąć postać?")) return;
    await supabase.from("guests").delete().eq("id", id); refresh();
  };
  const release = async (id: string) => {
    await supabase.from("guests").update({ claimed_by_session_id: null, claimed_at: null }).eq("id", id); refresh();
  };
  const toggleTourney = async (id: string, v: boolean) => {
    await supabase.from("guests").update({ is_tournament_player: v }).eq("id", id); refresh();
  };

  return (
    <div className="space-y-4">
      <section className="parchment rounded-lg p-4">
        <h2 className="font-display text-xl mb-2">Nowy desperado</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ksywa"
          className="w-full border-2 border-wood-dark/40 rounded p-2 mb-2" />
        <input value={wanted} onChange={(e) => setWanted(e.target.value)} placeholder="Wanted for (opcjonalnie)"
          className="w-full border-2 border-wood-dark/40 rounded p-2 mb-2" />
        <div className="flex flex-wrap gap-1 mb-2">
          {WANTED_SUGGESTIONS.slice(0, 5).map((s) => (
            <button key={s} onClick={() => setWanted(s)} className="text-[10px] px-2 py-0.5 rounded bg-wood-dark/10 border border-wood-dark/30">{s}</button>
          ))}
        </div>
        <select value={preset} onChange={(e) => setPreset(e.target.value)}
          className="w-full border-2 border-wood-dark/40 rounded p-2 mb-2 bg-parchment">
          {AVATAR_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.label}</option>)}
        </select>
        <button onClick={create} className="btn-saloon px-4 py-2 rounded">Dodaj</button>
      </section>

      <section className="parchment rounded-lg p-4">
        <h2 className="font-display text-xl mb-2">Wszyscy ({guests.length})</h2>
        <ul className="divide-y divide-wood-dark/20">
          {guests.map((g) => (
            <li key={g.id} className="py-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-display flex-1">{g.display_name}</span>
              <label className="text-xs flex items-center gap-1">
                <input type="checkbox" checked={g.is_tournament_player}
                  onChange={(e) => toggleTourney(g.id, e.target.checked)} /> turniej
              </label>
              {g.claimed_by_session_id ? (
                <button onClick={() => release(g.id)} className="text-xs px-2 py-1 bg-wood-dark/10 rounded border">zwolnij</button>
              ) : <span className="text-xs opacity-60">wolny</span>}
              <button onClick={() => del(g.id)} className="text-xs px-2 py-1 bg-blood text-parchment rounded">usuń</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* -------------------- TOURNAMENT -------------------- */
function TourneyAdmin() {
  const qc = useQueryClient();
  const { data: guests = [] } = useQuery({
    queryKey: ["t_guests"],
    queryFn: async () => (await supabase.from("guests").select("*")).data ?? [],
  });
  const { data: teams = [] } = useQuery({
    queryKey: ["t_teams"],
    queryFn: async () => (await supabase.from("teams").select("*, p1:guests!teams_player_1_guest_id_fkey(display_name), p2:guests!teams_player_2_guest_id_fkey(display_name)")).data ?? [],
  });
  const { data: matches = [] } = useQuery({
    queryKey: ["t_matches"],
    queryFn: async () => (await supabase.from("tournament_matches").select("*").order("scheduled_order")).data ?? [],
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["t_teams"] });
    qc.invalidateQueries({ queryKey: ["t_matches"] });
  };

  const players = guests.filter((g) => g.is_tournament_player);
  const teamName = (id: string | null) => (teams.find((t: any) => t.id === id) as any)?.name ?? "?";

  const generateTeams = async () => {
    if (players.length < 2) { toast.error("Za mało graczy"); return; }
    if (!confirm("Usunie obecne bandy i mecze. Kontynuować?")) return;
    await supabase.from("tournament_matches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("teams").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const shuf = shuffle(players);
    const inserts: any[] = [];
    for (let i = 0; i < shuf.length - 1; i += 2) {
      inserts.push({
        name: `${shuf[i].display_name.split(" ")[0]} & ${shuf[i + 1].display_name.split(" ")[0]}`,
        player_1_guest_id: shuf[i].id, player_2_guest_id: shuf[i + 1].id,
      });
    }
    if (shuf.length % 2 === 1) toast.warning(`Rezerwowy: ${shuf[shuf.length - 1].display_name}`);
    await supabase.from("teams").insert(inserts);
    refresh();
    toast.success(`Zwołano ${inserts.length} band`);
  };

  const [numGroups, setNumGroups] = useState(2);
  const generateGroups = async () => {
    if (teams.length < 2) { toast.error("Najpierw stwórz bandy"); return; }
    if (!confirm("Wygenerujemy nowy plan meczów. Usunąć obecne?")) return;
    await supabase.from("tournament_matches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const shuffled = shuffle(teams);
    const groups: Record<string, any[]> = {};
    shuffled.forEach((t: any, i: number) => {
      const g = String.fromCharCode(65 + (i % numGroups));
      (groups[g] ||= []).push(t);
    });
    const inserts: any[] = [];
    let order = 0;
    for (const [g, ts] of Object.entries(groups)) {
      for (const [a, b] of roundRobinPairs(ts)) {
        inserts.push({ phase: "group", group_name: g, team_a_id: a.id, team_b_id: b.id, scheduled_order: order++ });
      }
    }
    if (inserts.length) await supabase.from("tournament_matches").insert(inserts);
    refresh(); toast.success(`${inserts.length} pojedynków w grupach`);
  };

  const setScore = async (id: string, a: number, b: number) => {
    await supabase.from("tournament_matches").update({ score_a: a, score_b: b }).eq("id", id);
    refresh();
  };
  const setStatus = async (id: string, status: string) => {
    const upd: any = { status };
    if (status === "finished") {
      const m = matches.find((x) => x.id === id);
      if (m) upd.winner_team_id = m.score_a > m.score_b ? m.team_a_id : m.score_b > m.score_a ? m.team_b_id : null;
    }
    await supabase.from("tournament_matches").update(upd).eq("id", id);
    refresh();
  };

  const callToTable = async (id: string) => {
    await supabase.from("tournament_matches").update({ status: "called" }).eq("id", id);
    await supabase.from("projector_state").update({
      current_screen: "call_to_table",
      last_call_to_table_match_id: id,
      selected_match_id: id,
    }).neq("id", "00000000-0000-0000-0000-000000000000");
    toast.success("Do stołu!");
    refresh();
  };

  const generatePlayoff = async () => {
    const groups = [...new Set(matches.filter((m) => m.phase === "group" && m.group_name).map((m) => m.group_name!))];
    if (groups.length === 0) { toast.error("Brak grup"); return; }
    const advanced: string[] = [];
    for (const g of groups) {
      const st = computeStandings(teams as any, matches as any, g);
      st.slice(0, 2).forEach((s) => advanced.push(s.team_id));
    }
    if (advanced.length < 2) { toast.error("Zbyt mało band"); return; }
    // simple bracket: pair first from A with second from B etc.
    await supabase.from("tournament_matches").delete().neq("phase", "group");
    let order = 1000;
    const inserts: any[] = [];
    if (advanced.length === 4) {
      inserts.push({ phase: "semifinal", team_a_id: advanced[0], team_b_id: advanced[3], scheduled_order: order++ });
      inserts.push({ phase: "semifinal", team_a_id: advanced[1], team_b_id: advanced[2], scheduled_order: order++ });
      inserts.push({ phase: "final", scheduled_order: order + 10 });
    } else {
      for (let i = 0; i < advanced.length; i += 2) {
        if (advanced[i + 1]) inserts.push({ phase: "knockout", team_a_id: advanced[i], team_b_id: advanced[i + 1], scheduled_order: order++ });
      }
    }
    await supabase.from("tournament_matches").insert(inserts);
    refresh(); toast.success("Bracket gotowy");
  };

  const resetAll = async () => {
    if (!confirm("Reset całego turnieju?")) return;
    await supabase.from("tournament_matches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("teams").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    refresh(); toast.success("Reset");
  };

  return (
    <div className="space-y-4">
      <section className="parchment rounded-lg p-4">
        <h2 className="font-display text-xl mb-2">Gracze turnieju ({players.length})</h2>
        <div className="text-xs text-muted-foreground mb-2">Zaznacz graczy w zakładce Goście.</div>
        <ul className="text-sm mb-3">{players.map((p) => <li key={p.id}>• {p.display_name}</li>)}</ul>
        <button onClick={generateTeams} className="btn-saloon px-4 py-2 rounded mr-2">Losuj bandy 2-osobowe</button>
      </section>

      <section className="parchment rounded-lg p-4">
        <h2 className="font-display text-xl mb-2">Bandy ({teams.length})</h2>
        <ul className="text-sm">{teams.map((t: any) => <li key={t.id}>• <b>{t.name}</b> — {t.p1?.display_name ?? "?"} & {t.p2?.display_name ?? "?"}</li>)}</ul>
        <div className="mt-3 flex gap-2 items-center flex-wrap">
          <label className="text-sm">Liczba grup:</label>
          <input type="number" min={1} max={4} value={numGroups} onChange={(e) => setNumGroups(+e.target.value)}
            className="w-16 border rounded p-1" />
          <button onClick={generateGroups} className="btn-saloon px-3 py-1 rounded text-sm">Generuj grupy + terminarz</button>
          <button onClick={generatePlayoff} className="btn-saloon px-3 py-1 rounded text-sm">Playoff z grup</button>
          <button onClick={resetAll} className="bg-blood text-parchment px-3 py-1 rounded text-sm font-display">Reset turnieju</button>
        </div>
      </section>

      <section className="parchment rounded-lg p-4">
        <h2 className="font-display text-xl mb-2">Mecze</h2>
        {matches.length === 0 && <p className="italic text-muted-foreground">Brak.</p>}
        <ul className="space-y-2">
          {matches.map((m) => (
            <li key={m.id} className="border border-wood-dark/30 rounded p-2 text-sm">
              <div className="font-display">
                {m.phase === "group" ? `[${m.group_name}] ` : `[${m.phase}] `}
                {teamName(m.team_a_id)} vs {teamName(m.team_b_id)}
              </div>
              <div className="flex flex-wrap gap-2 mt-1 items-center">
                <input type="number" value={m.score_a} onChange={(e) => setScore(m.id, +e.target.value, m.score_b)} className="w-14 border rounded p-1" />
                <span>:</span>
                <input type="number" value={m.score_b} onChange={(e) => setScore(m.id, m.score_a, +e.target.value)} className="w-14 border rounded p-1" />
                <select value={m.status} onChange={(e) => setStatus(m.id, e.target.value)} className="border rounded p-1">
                  <option value="scheduled">scheduled</option>
                  <option value="called">called</option>
                  <option value="in_progress">in_progress</option>
                  <option value="finished">finished</option>
                </select>
                <button onClick={() => callToTable(m.id)} className="btn-saloon px-2 py-1 rounded text-xs">CALL TO TABLE</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* -------------------- PROJECTOR CONTROL -------------------- */
function ProjectorAdmin() {
  const qc = useQueryClient();
  const { data: state, refetch } = useQuery({
    queryKey: ["proj_state"],
    queryFn: async () => (await supabase.from("projector_state").select("*").limit(1).maybeSingle()).data,
  });
  const { data: matches = [] } = useQuery({
    queryKey: ["proj_matches"],
    queryFn: async () => (await supabase.from("tournament_matches").select("*, team_a:teams!tournament_matches_team_a_id_fkey(name), team_b:teams!tournament_matches_team_b_id_fkey(name)").order("scheduled_order")).data ?? [],
  });
  const { data: announcements = [] } = useQuery({
    queryKey: ["proj_ann"],
    queryFn: async () => (await supabase.from("announcements").select("id, title")).data ?? [],
  });

  const update = async (patch: any) => {
    if (!state) return;
    await supabase.from("projector_state").update(patch).eq("id", state.id);
    refetch();
    qc.invalidateQueries();
  };

  if (!state) return <p>Wczytywanie...</p>;

  return (
    <div className="space-y-4">
      <section className="parchment rounded-lg p-4">
        <h2 className="font-display text-xl mb-2">Tryb</h2>
        <div className="flex gap-2">
          {(["manual", "automatic"] as const).map((m) => (
            <button key={m} onClick={() => update({ mode: m })}
              className={"px-4 py-2 rounded font-display uppercase " + (state.mode === m ? "bg-wood-dark text-parchment" : "bg-parchment border-2 border-wood-dark/40")}>{m}</button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3 text-sm">
          <label>Rotacja (sek):
            <input type="number" min={5} max={60} value={state.rotation_interval_seconds}
              onChange={(e) => update({ rotation_interval_seconds: +e.target.value })}
              className="ml-2 w-16 border rounded p-1" />
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={state.sound_enabled}
              onChange={(e) => update({ sound_enabled: e.target.checked })} /> Dźwięk
          </label>
        </div>
      </section>

      <section className="parchment rounded-lg p-4">
        <h2 className="font-display text-xl mb-2">Ekran (manual)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {["current_match", "next_match", "call_to_table", "last_result", "standings", "bracket", "announcement", "wall"].map((s) => (
            <button key={s} onClick={() => update({ current_screen: s })}
              className={"px-2 py-2 rounded text-xs font-display uppercase " + (state.current_screen === s ? "bg-blood text-parchment" : "bg-wood-dark/10 border")}>{s}</button>
          ))}
        </div>
      </section>

      <section className="parchment rounded-lg p-4">
        <h2 className="font-display text-xl mb-2">Call to Table</h2>
        <ul className="space-y-1 text-sm">
          {matches.map((m: any) => (
            <li key={m.id} className="flex justify-between items-center border-b border-wood-dark/20 py-1">
              <span>{m.team_a?.name} vs {m.team_b?.name} <span className="opacity-60">({m.status})</span></span>
              <button onClick={async () => {
                await update({ current_screen: "call_to_table", last_call_to_table_match_id: m.id, selected_match_id: m.id });
                await supabase.from("tournament_matches").update({ status: "called" }).eq("id", m.id);
                toast.success("Do stołu!");
              }} className="btn-saloon px-2 py-1 rounded text-xs">CALL</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="parchment rounded-lg p-4">
        <h2 className="font-display text-xl mb-2">Wybrane ogłoszenie</h2>
        <select value={state.selected_announcement_id ?? ""} onChange={(e) => update({ selected_announcement_id: e.target.value || null })}
          className="w-full border-2 border-wood-dark/40 rounded p-2 bg-parchment">
          <option value="">(najnowsze)</option>
          {announcements.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
        </select>
      </section>
    </div>
  );
}

/* -------------------- BOARD -------------------- */
function BoardAdmin() {
  const qc = useQueryClient();
  const { data: announcements = [] } = useQuery({
    queryKey: ["a_ann"],
    queryFn: async () => (await supabase.from("announcements").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: posts = [] } = useQuery({
    queryKey: ["a_wall"],
    queryFn: async () => (await supabase.from("wall_posts").select("*, guest:guests(display_name)").order("created_at", { ascending: false })).data ?? [],
  });
  const [title, setTitle] = useState(""); const [content, setContent] = useState("");
  const refresh = () => qc.invalidateQueries();
  const create = async () => {
    if (!title.trim()) return;
    await supabase.from("announcements").insert({ title, content });
    setTitle(""); setContent(""); refresh();
  };
  return (
    <div className="space-y-4">
      <section className="parchment rounded-lg p-4">
        <h2 className="font-display text-xl mb-2">Nowe ogłoszenie</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tytuł" className="w-full border-2 border-wood-dark/40 rounded p-2 mb-2" />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Treść" rows={3} className="w-full border-2 border-wood-dark/40 rounded p-2 mb-2" />
        <button onClick={create} className="btn-saloon px-4 py-2 rounded">Dodaj</button>
      </section>
      <section className="parchment rounded-lg p-4">
        <h2 className="font-display text-xl mb-2">Ogłoszenia</h2>
        <ul className="divide-y divide-wood-dark/20">
          {announcements.map((a) => (
            <li key={a.id} className="py-2 text-sm">
              <div className="flex justify-between items-center">
                <b className="font-display">{a.title}</b>
                <div className="flex gap-1">
                  <button onClick={async () => { await supabase.from("announcements").update({ pinned: !a.pinned }).eq("id", a.id); refresh(); }} className="text-xs px-2 py-1 border rounded">{a.pinned ? "odepnij" : "przypnij"}</button>
                  <button onClick={async () => { await supabase.from("announcements").delete().eq("id", a.id); refresh(); }} className="text-xs px-2 py-1 bg-blood text-parchment rounded">usuń</button>
                </div>
              </div>
              <div className="opacity-80">{a.content}</div>
            </li>
          ))}
        </ul>
      </section>
      <section className="parchment rounded-lg p-4">
        <h2 className="font-display text-xl mb-2">Wpisy z tablicy</h2>
        <ul className="divide-y divide-wood-dark/20">
          {posts.map((p: any) => (
            <li key={p.id} className="py-2 text-sm flex justify-between gap-2">
              <div><b>{p.guest?.display_name ?? "?"}:</b> {p.content} {p.is_hidden && <span className="italic opacity-60">(ukryte)</span>}</div>
              <div className="flex gap-1 shrink-0">
                <button onClick={async () => { await supabase.from("wall_posts").update({ is_hidden: !p.is_hidden }).eq("id", p.id); refresh(); }} className="text-xs px-2 py-1 border rounded">{p.is_hidden ? "pokaż" : "ukryj"}</button>
                <button onClick={async () => { await supabase.from("wall_posts").delete().eq("id", p.id); refresh(); }} className="text-xs px-2 py-1 bg-blood text-parchment rounded">usuń</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* -------------------- GALLERY -------------------- */
function GalleryAdmin() {
  const qc = useQueryClient();
  const { data: photos = [] } = useQuery({
    queryKey: ["a_photos"],
    queryFn: async () => (await supabase.from("party_photos").select("*, guest:guests(display_name)").order("created_at", { ascending: false })).data ?? [],
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["a_photos"] });
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {photos.map((p: any) => (
        <div key={p.id} className="parchment rounded-lg p-2">
          <img src={p.file_url} alt="" className="w-full h-32 object-cover rounded" />
          <div className="text-xs mt-1">{p.guest?.display_name ?? "?"} {p.is_hidden && "(ukryte)"}</div>
          <div className="flex gap-1 mt-1">
            <button onClick={async () => { await supabase.from("party_photos").update({ is_hidden: !p.is_hidden }).eq("id", p.id); refresh(); }} className="text-[10px] px-2 py-1 border rounded flex-1">{p.is_hidden ? "pokaż" : "ukryj"}</button>
            <button onClick={async () => { await supabase.from("party_photos").delete().eq("id", p.id); refresh(); }} className="text-[10px] px-2 py-1 bg-blood text-parchment rounded flex-1">usuń</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------- SETTINGS -------------------- */
function SettingsAdmin() {
  const { data: pinRow, refetch } = useQuery({
    queryKey: ["pin_row"],
    queryFn: async () => (await supabase.from("app_settings").select("*").eq("key", "admin_pin").maybeSingle()).data,
  });
  const [pin, setPin] = useState("");
  useEffect(() => { if (pinRow) setPin(pinRow.value); }, [pinRow?.value]);

  return (
    <section className="parchment rounded-lg p-4 max-w-md">
      <h2 className="font-display text-xl mb-2">PIN szeryfa</h2>
      <input value={pin} onChange={(e) => setPin(e.target.value)} className="w-full border-2 border-wood-dark/40 rounded p-2 mb-2" />
      <button onClick={async () => {
        await supabase.from("app_settings").update({ value: pin }).eq("key", "admin_pin");
        toast.success("PIN zmieniony");
        refetch();
      }} className="btn-saloon px-4 py-2 rounded">Zapisz</button>
    </section>
  );
}
