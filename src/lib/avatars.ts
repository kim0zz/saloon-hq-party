// Preset western avatars — emoji + color combos, no AI images.
export type Preset = { id: string; label: string; emoji: string; bg: string };

export const AVATAR_PRESETS: Preset[] = [
  { id: "cowboy", label: "Kowboj", emoji: "🤠", bg: "#c48a4f" },
  { id: "sheriff", label: "Szeryf", emoji: "🌟", bg: "#8a5a2b" },
  { id: "bandit", label: "Bandyta", emoji: "🦹", bg: "#5a3928" },
  { id: "bartender", label: "Barman saloonu", emoji: "🍺", bg: "#a06a2c" },
  { id: "horse", label: "Koń", emoji: "🐴", bg: "#7a4a25" },
  { id: "cactus", label: "Kaktus", emoji: "🌵", bg: "#4a6b3a" },
  { id: "revolver", label: "Rewolwerowiec", emoji: "🔫", bg: "#402515" },
  { id: "wanderer", label: "Włóczęga pustyni", emoji: "🏜️", bg: "#b88a4a" },
  { id: "hero", label: "Kartunowy heros", emoji: "🎬", bg: "#733d1a" },
  { id: "eastwood", label: "Gunslinger z Zachodu", emoji: "🥷", bg: "#2a1a10" },
  { id: "luke", label: "Szybki kartunowy kowboj", emoji: "⚡", bg: "#e5b34a" },
  { id: "native", label: "Rdzenny mieszkaniec prerii", emoji: "🪶", bg: "#7c3a1e" },
  { id: "cowgirl", label: "Kowgirl", emoji: "👒", bg: "#c85a45" },
  { id: "prospector", label: "Stary poszukiwacz złota", emoji: "⛏️", bg: "#8a6a2b" },
  { id: "gringo", label: "Gringo", emoji: "🎩", bg: "#3a2a1a" },
  { id: "pianist", label: "Pianista saloonu", emoji: "🎹", bg: "#2a2018" },
];

export function findPreset(id?: string | null): Preset | undefined {
  if (!id) return undefined;
  return AVATAR_PRESETS.find((p) => p.id === id);
}
