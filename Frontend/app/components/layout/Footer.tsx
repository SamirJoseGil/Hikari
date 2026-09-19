import { Link } from "@remix-run/react";

export default function Footer({ isDayMode }: { isDayMode: boolean }) {
  return (
    <footer className={`border-t mt-16 ${isDayMode ? "border-gray-200 text-gray-500" : "border-gray-800 text-gray-400"}`}>
      <div className="max-w-5xl mx-auto px-6 py-6 text-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>
          <strong className={isDayMode ? "text-black" : "text-white"}>HIKARI</strong> · Orientación en derecho
          laboral colombiano
        </p>
        <Link
          to="/about"
          className={`underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-offset-2 rounded ${
            isDayMode ? "focus-visible:ring-black" : "focus-visible:ring-white"
          }`}
        >
          Sobre HIKARI
        </Link>
      </div>
      <div className="max-w-5xl mx-auto px-6 pb-6 text-xs">
        HIKARI ofrece orientación general y no sustituye el consejo de un abogado. Verifica siempre con un
        profesional.
      </div>
    </footer>
  );
}
