import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Saloon", icon: "🏚️" },
  { to: "/goscie", label: "Goście", icon: "🤠" },
  { to: "/turniej", label: "Turniej", icon: "⚔️" },
  { to: "/tablica", label: "Tablica", icon: "📜" },
  { to: "/galeria", label: "Galeria", icon: "📷" },
  { to: "/moja-postac", label: "Ja", icon: "⭐" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  return (
    <div className="min-h-screen flex flex-col pb-20">
      <header className="wood-panel px-4 py-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="font-display text-2xl tracking-wider text-gold">
            🌵 Saloon Party HQ
          </Link>
          <Link to="/admin" className="text-xs opacity-70 hover:opacity-100 font-display uppercase">
            Szeryf
          </Link>
        </div>
      </header>
      <main className="flex-1 w-full max-w-2xl mx-auto px-3 py-4">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 wood-panel border-t-4 border-gold/60 z-40">
        <div className="max-w-2xl mx-auto grid grid-cols-6">
          {NAV.map((n) => {
            const active = n.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={
                  "flex flex-col items-center py-2 text-[10px] font-display uppercase tracking-wider " +
                  (active ? "text-gold" : "text-parchment/70")
                }
              >
                <span className="text-xl leading-none">{n.icon}</span>
                <span className="mt-1">{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
