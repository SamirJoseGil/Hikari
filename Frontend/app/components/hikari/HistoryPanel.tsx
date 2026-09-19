import { History } from "lucide-react";
import type { ConsultationHistoryItem } from "~/types/hikari";

interface HistoryPanelProps {
  isDayMode: boolean;
  history: ConsultationHistoryItem[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (item: ConsultationHistoryItem) => void;
}

const SCOPE_LABEL: Record<string, string> = {
  laboral: "Laboral",
  fuera_de_dominio: "Fuera de dominio",
  ambiguo: "Ambiguo",
};

export default function HistoryPanel({ isDayMode, history, loading, selectedId, onSelect }: HistoryPanelProps) {
  return (
    <aside aria-label="Historial de consultas">
      <h2
        className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wide mb-4 ${
          isDayMode ? "text-black" : "text-white"
        }`}
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        <History className="w-4 h-4" aria-hidden="true" />
        Tus consultas
      </h2>

      {loading && (
        <p className={`text-sm ${isDayMode ? "text-gray-500" : "text-gray-400"}`}>Cargando historial…</p>
      )}

      {!loading && history.length === 0 && (
        <p className={`text-sm ${isDayMode ? "text-gray-500" : "text-gray-400"}`}>
          Aún no has hecho consultas en este navegador.
        </p>
      )}

      <ul className="space-y-2">
        {history.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              aria-current={selectedId === item.id}
              className={`w-full text-left p-3 border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 ${
                selectedId === item.id
                  ? isDayMode
                    ? "border-black bg-gray-100"
                    : "border-white bg-gray-800"
                  : isDayMode
                    ? "border-gray-300 hover:border-black focus-visible:ring-black"
                    : "border-gray-700 hover:border-white focus-visible:ring-white"
              }`}
              style={{ borderRadius: "2px" }}
            >
              <p className={`text-sm line-clamp-2 ${isDayMode ? "text-gray-800" : "text-gray-200"}`}>
                {item.question}
              </p>
              <p className={`mt-1 text-xs uppercase tracking-wide ${isDayMode ? "text-gray-500" : "text-gray-500"}`}>
                {SCOPE_LABEL[item.scope] ?? item.scope}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
