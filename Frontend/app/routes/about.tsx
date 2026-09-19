import { BookOpen, Database, ShieldAlert, ShieldCheck } from "lucide-react";
import PageShell from "~/components/layout/PageShell";

export const meta = () => {
  return [
    { title: "Sobre HIKARI" },
    { name: "description", content: "Qué es HIKARI, cómo funciona, sus fuentes jurídicas y sus límites." },
  ];
};

export default function About() {
  return (
    <PageShell>
      {(isDayMode) => (
        <div className="max-w-3xl mx-auto px-6 py-14">
          <h1
            className={`text-4xl font-bold mb-6 ${isDayMode ? "text-black" : "text-white"}`}
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Sobre HIKARI
          </h1>

          <section className="mb-10">
            <h2
              className={`flex items-center gap-2 text-xl font-bold mb-2 ${isDayMode ? "text-black" : "text-white"}`}
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              Qué es HIKARI
            </h2>
            <p className={isDayMode ? "text-gray-700" : "text-gray-300"}>
              HIKARI es un asistente de orientación jurídica especializado <strong>exclusivamente</strong> en
              derecho laboral colombiano: despidos, salarios, prestaciones, vacaciones, acoso laboral y
              cambios de condiciones de trabajo. No cubre otras áreas del derecho (civil, penal, familia,
              consumo, etc.).
            </p>
          </section>

          <section className="mb-10">
            <h2
              className={`flex items-center gap-2 text-xl font-bold mb-2 ${isDayMode ? "text-black" : "text-white"}`}
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              <Database className="w-5 h-5" aria-hidden="true" />
              Cómo funciona
            </h2>
            <ol className={`list-decimal pl-5 space-y-2 ${isDayMode ? "text-gray-700" : "text-gray-300"}`}>
              <li>Analiza si tu consulta es realmente de derecho laboral colombiano.</li>
              <li>
                Busca en un corpus jurídico real (Código Sustantivo del Trabajo y Ley 1010 de 2006 sobre
                acoso laboral) los fragmentos más relevantes para tu caso.
              </li>
              <li>
                Genera una orientación redactada a partir de esos fragmentos, sin inventar normas ni fuentes.
              </li>
              <li>Verifica que la respuesta tenga la estructura y el disclaimer correctos antes de mostrártela.</li>
            </ol>
          </section>

          <section className="mb-10">
            <h2
              className={`flex items-center gap-2 text-xl font-bold mb-2 ${isDayMode ? "text-black" : "text-white"}`}
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              <BookOpen className="w-5 h-5" aria-hidden="true" />
              Fuentes jurídicas
            </h2>
            <ul className={`list-disc pl-5 space-y-1 ${isDayMode ? "text-gray-700" : "text-gray-300"}`}>
              <li>Código Sustantivo del Trabajo (artículos 22, 61, 62, 64, 186 y 249).</li>
              <li>Ley 1010 de 2006, sobre acoso laboral (artículos 2, 7 y 10).</li>
            </ul>
            <p className={`mt-2 text-sm ${isDayMode ? "text-gray-500" : "text-gray-400"}`}>
              Cada respuesta de HIKARI muestra la norma, el artículo y la fuente exacta usada para
              construirla.
            </p>
          </section>

          <section
            className={`border-2 p-6 ${isDayMode ? "border-black bg-gray-50" : "border-white bg-gray-900"}`}
            style={{ borderRadius: "2px" }}
          >
            <h2
              className={`flex items-center gap-2 text-xl font-bold mb-2 ${isDayMode ? "text-black" : "text-white"}`}
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              <ShieldAlert className="w-5 h-5" aria-hidden="true" />
              Límites de HIKARI
            </h2>
            <ul className={`list-disc pl-5 space-y-1 ${isDayMode ? "text-gray-700" : "text-gray-300"}`}>
              <li>Solo orienta sobre derecho laboral colombiano; nada más.</li>
              <li>No garantiza resultados ni reemplaza un análisis caso a caso de un abogado.</li>
              <li>Cuando falta información importante, lo indica en lugar de asumir datos.</li>
            </ul>
            <p className={`mt-4 text-sm font-semibold ${isDayMode ? "text-black" : "text-white"}`}>
              HIKARI ofrece orientación general y no sustituye el consejo de un abogado. Verifica siempre con
              un profesional.
            </p>
          </section>
        </div>
      )}
    </PageShell>
  );
}
