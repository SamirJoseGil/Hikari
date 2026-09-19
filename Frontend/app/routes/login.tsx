import { Link } from "@remix-run/react";
import { Info } from "lucide-react";
import PageShell from "~/components/layout/PageShell";

export const meta = () => [{ title: "Iniciar sesión — HIKARI" }];

export default function Login() {
  return (
    <PageShell>
      {(isDayMode) => (
        <div className="max-w-md mx-auto px-6 py-16">
          <h1
            className={`text-3xl font-bold mb-4 ${isDayMode ? "text-black" : "text-white"}`}
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Iniciar sesión
          </h1>

          <div
            role="status"
            className={`mb-6 border-2 p-4 flex gap-3 text-sm ${
              isDayMode ? "border-gray-400 text-gray-700" : "border-gray-600 text-gray-300"
            }`}
            style={{ borderRadius: "2px" }}
          >
            <Info className="w-5 h-5 shrink-0" aria-hidden="true" />
            <p>
              El inicio de sesión todavía no está disponible: HIKARI funciona hoy en modo invitado, sin
              necesidad de cuenta.{" "}
              <Link to="/chat" className="underline underline-offset-4">
                Continúa como invitado
              </Link>
              .
            </p>
          </div>

          <form
            className="space-y-4 opacity-60"
            onSubmit={(e) => e.preventDefault()}
            aria-disabled="true"
          >
            <div>
              <label htmlFor="login-email" className={`block text-sm mb-1 ${isDayMode ? "text-gray-700" : "text-gray-300"}`}>
                Correo electrónico
              </label>
              <input
                id="login-email"
                type="email"
                disabled
                className={`w-full p-3 border-2 ${isDayMode ? "bg-white border-black" : "bg-black border-white"}`}
                style={{ borderRadius: "2px" }}
              />
            </div>
            <div>
              <label htmlFor="login-password" className={`block text-sm mb-1 ${isDayMode ? "text-gray-700" : "text-gray-300"}`}>
                Contraseña
              </label>
              <input
                id="login-password"
                type="password"
                disabled
                className={`w-full p-3 border-2 ${isDayMode ? "bg-white border-black" : "bg-black border-white"}`}
                style={{ borderRadius: "2px" }}
              />
            </div>
            <button
              type="submit"
              disabled
              className={`w-full px-6 py-3 border-2 cursor-not-allowed ${
                isDayMode ? "bg-black text-white border-black" : "bg-white text-black border-white"
              }`}
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "0.08em" }}
            >
              INGRESAR (próximamente)
            </button>
          </form>

          <p className={`mt-6 text-sm ${isDayMode ? "text-gray-500" : "text-gray-400"}`}>
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="underline underline-offset-4">
              Regístrate
            </Link>
            .
          </p>
        </div>
      )}
    </PageShell>
  );
}
