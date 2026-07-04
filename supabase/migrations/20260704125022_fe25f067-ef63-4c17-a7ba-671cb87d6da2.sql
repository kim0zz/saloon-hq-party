
-- Guests / characters
CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  avatar_type TEXT NOT NULL DEFAULT 'preset',
  avatar_url TEXT,
  wanted_for TEXT NOT NULL DEFAULT '',
  attendance_status TEXT NOT NULL DEFAULT 'attending',
  is_tournament_player BOOLEAN NOT NULL DEFAULT false,
  claimed_by_session_id TEXT,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Teams
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  player_1_guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  player_2_guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tournament matches
CREATE TABLE public.tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase TEXT NOT NULL DEFAULT 'group',
  group_name TEXT,
  team_a_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  team_b_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  score_a INT NOT NULL DEFAULT 0,
  score_b INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled',
  winner_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  next_match_id UUID,
  scheduled_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Announcements
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_by_admin BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.announcement_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wall
CREATE TABLE public.wall_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Photos
CREATE TABLE public.party_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  caption TEXT,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projector state (single row)
CREATE TABLE public.projector_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL DEFAULT 'automatic',
  current_screen TEXT NOT NULL DEFAULT 'current_match',
  selected_match_id UUID,
  selected_announcement_id UUID,
  last_call_to_table_match_id UUID,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  rotation_interval_seconds INT NOT NULL DEFAULT 15,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.projector_state (mode, current_screen) VALUES ('automatic', 'current_match');

-- App settings (PIN etc)
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.app_settings (key, value) VALUES ('admin_pin', '1234');

-- Grants (no auth for this private party app; anon has full access)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guests TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_matches TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcement_comments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wall_posts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.party_photos TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projector_state TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.guests, public.teams, public.tournament_matches, public.announcements, public.announcement_comments, public.wall_posts, public.party_photos, public.projector_state, public.app_settings TO service_role;

-- RLS: enable + permissive (party app, no auth, session-based identity)
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wall_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projector_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "party_all" ON public.guests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "party_all" ON public.teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "party_all" ON public.tournament_matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "party_all" ON public.announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "party_all" ON public.announcement_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "party_all" ON public.wall_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "party_all" ON public.party_photos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "party_all" ON public.projector_state FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "party_all" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.projector_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wall_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.guests;

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_guests_updated BEFORE UPDATE ON public.guests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_matches_updated BEFORE UPDATE ON public.tournament_matches FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_announcements_updated BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_wall_updated BEFORE UPDATE ON public.wall_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_projector_updated BEFORE UPDATE ON public.projector_state FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
