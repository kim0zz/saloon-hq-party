import { AVATAR_PRESETS, findPreset } from "@/lib/avatars";
import type { Tables } from "@/integrations/supabase/types";

type Guest = Tables<"guests">;

export function AvatarBubble({ guest, size = 96 }: { guest: Guest; size?: number }) {
  const preset = findPreset(guest.avatar_type === "preset" ? guest.avatar_url : undefined);
  if (guest.avatar_type === "upload" && guest.avatar_url) {
    return (
      <img
        src={guest.avatar_url}
        alt={guest.display_name}
        width={size} height={size}
        className="rounded-full object-cover border-4 border-wood-dark"
        style={{ width: size, height: size }}
      />
    );
  }
  const p = preset ?? AVATAR_PRESETS[0];
  return (
    <div
      className="rounded-full flex items-center justify-center border-4 border-wood-dark shadow-lg"
      style={{ width: size, height: size, background: p.bg, fontSize: size * 0.5 }}
      aria-label={p.label}
    >
      <span>{p.emoji}</span>
    </div>
  );
}

export function WantedPoster({
  guest,
  onClaim,
  taken,
  compact,
  action,
}: {
  guest: Guest;
  onClaim?: () => void;
  taken?: boolean;
  compact?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="wanted-poster p-4 rounded-md relative flex flex-col items-center text-center">
      <div className="text-3xl md:text-4xl font-display tracking-widest text-wood-dark">WANTED</div>
      <div className="w-full h-[2px] bg-wood-dark/60 my-2" />
      <AvatarBubble guest={guest} size={compact ? 72 : 110} />
      <div className="mt-3 font-display text-xl md:text-2xl text-wood-dark uppercase">
        {guest.display_name}
      </div>
      <div className="mt-2 text-sm italic text-ink/80">
        <span className="font-bold not-italic">Wanted for:</span>{" "}
        {guest.wanted_for || "podejrzane zachowanie w saloonie"}
      </div>
      {guest.is_tournament_player && (
        <span className="mt-3 inline-block px-2 py-0.5 bg-wood-dark text-parchment text-xs rounded font-display uppercase">
          Gracz turnieju
        </span>
      )}
      {taken && (
        <span className="mt-2 inline-block px-2 py-0.5 bg-blood text-parchment text-xs rounded uppercase font-display">
          Już w saloonie
        </span>
      )}
      {onClaim && !taken && (
        <button onClick={onClaim} className="btn-saloon active:btn-saloon-active mt-4 px-4 py-2 rounded">
          To ja, szeryfie
        </button>
      )}
      {action && <div className="mt-3 w-full">{action}</div>}
    </div>
  );
}
