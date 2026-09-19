import { useEffect, useState } from "react";
import { Link } from "@remix-run/react";
import { MessageSquareText, User } from "lucide-react";
import PageShell from "~/components/layout/PageShell";
import { guestHistoryCount } from "~/lib/guestHistory";

export const meta = () => [{ title: "Perfil — HIKARI" }];

export default function Profile() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(guestHistoryCount());
  }, []);

  return (
    <PageShell>
      {(isDayMode) => (
        <div className="max-w-md mx-auto px-6 py-16">
          <h1
            className={`text-3xl font-bold mb-6 ${isDayMode ? "text-black" : "text-white"}`}
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Perfil
          </h1>

          <div className={`border-2 p-6 ${isDayMode ? "border-black" : "border-white"}`} style={{ borderRadius: "2px" }}>
            <div className="flex items-center gap-3 mb-4">
              <User className={`w-8 h-8 ${isDayMode ? "text-black" : "text-white"}`} aria-hidden="true" />
              <div>
                <p className={`font-semibold ${isDayMode ? "text-black" : "text-white"}`}>Invitado</p>
                <p className={`text-sm ${isDayMode ? "text-gray-500" : "text-gray-400"}`}>Sin cuenta iniciada</p>
              </div>
            </div>

            <div className={`flex items-center gap-2 text-sm mb-6 ${isDayMode ? "text-gray-700" : "text-gray-300"}`}>
              <MessageSquareText className="w-4 h-4" aria-hidden="true" />
              <span>
                {count} consulta{count === 1 ? "" : "s"} realizada{count === 1 ? "" : "s"} en este navegador
              </span>
            </div>

            <p className={`text-sm mb-4 ${isDayMode ? "text-gray-600" : "text-gray-400"}`}>
              El inicio de sesión aún no está disponible, así que no existe un historial persistente
              asociado a una cuenta todavía. Tus consultas como invitado se guardan solo en este navegador.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/chat"
                className={`text-center px-4 py-2 border-2 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isDayMode
                    ? "bg-black text-white border-black hover:bg-white hover:text-black focus-visible:ring-black"
                    : "bg-white text-black border-white hover:bg-black hover:text-white focus-visible:ring-white"
                }`}
              >
                Ir a Consultar
              </Link>
              <Link
                to="/login"
                className={`text-center px-4 py-2 border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isDayMode
                    ? "border-gray-400 text-gray-700 hover:border-black focus-visible:ring-black"
                    : "border-gray-600 text-gray-300 hover:border-white focus-visible:ring-white"
                }`}
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
