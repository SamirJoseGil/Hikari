import { Link, NavLink } from "@remix-run/react";
import { Moon, Scale, Sun } from "lucide-react";

interface HeaderProps {
  isDayMode: boolean;
  onToggleDayMode: () => void;
}

const NAV_LINKS = [
  { to: "/", label: "Inicio" },
  { to: "/chat", label: "Consultar" },
  { to: "/about", label: "Sobre HIKARI" },
  { to: "/profile", label: "Perfil" },
];

export default function Header({ isDayMode, onToggleDayMode }: HeaderProps) {
  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-sm ${
        isDayMode ? "bg-white/90 border-gray-200" : "bg-black/90 border-gray-800"
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link
          to="/"
          className={`flex items-center gap-2 font-bold text-lg uppercase tracking-wide focus-visible:ring-2 focus-visible:ring-offset-2 rounded ${
            isDayMode ? "text-black focus-visible:ring-black" : "text-white focus-visible:ring-white"
          }`}
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          <Scale className="w-5 h-5" aria-hidden="true" />
          HIKARI
        </Link>

        <nav aria-label="Navegación principal" className="flex items-center gap-1 sm:gap-3 text-sm">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `px-2 py-1 rounded transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isActive
                    ? isDayMode
                      ? "text-black font-semibold underline underline-offset-4"
                      : "text-white font-semibold underline underline-offset-4"
                    : isDayMode
                      ? "text-gray-600 hover:text-black focus-visible:ring-black"
                      : "text-gray-400 hover:text-white focus-visible:ring-white"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}

          <button
            type="button"
            onClick={onToggleDayMode}
            aria-label={isDayMode ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
            className={`p-2 border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 ${
              isDayMode
                ? "border-black text-black hover:bg-black hover:text-white focus-visible:ring-black"
                : "border-white text-white hover:bg-white hover:text-black focus-visible:ring-white"
            }`}
            style={{ borderRadius: "2px" }}
          >
            {isDayMode ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
          </button>
        </nav>
      </div>
    </header>
  );
}
