import { AlertTriangle, BookOpen, CheckCircle2, HelpCircle, Scale, ScrollText } from "lucide-react";
import type { ConsultationResponse } from "~/types/hikari";

interface ConsultationResultProps {
  isDayMode: boolean;
  result: ConsultationResponse;
}

function Section({
  isDayMode,
  icon,
  title,
  children,
}: {
  isDayMode: boolean;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h3
        className={`flex items-center gap-2 text-lg font-bold mb-3 ${isDayMode ? "text-black" : "text-white"}`}
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function ConsultationResult({ isDayMode, result }: ConsultationResultProps) {
  if (result.scope === "fuera_de_dominio") {
    return (
      <div
        role="status"
        className={`border-2 p-6 ${isDayMode ? "border-black bg-gray-50" : "border-white bg-gray-900"}`}
        style={{ borderRadius: "2px" }}
      >
        <h2
          className={`flex items-center gap-2 text-xl font-bold mb-2 ${isDayMode ? "text-black" : "text-white"}`}
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          <AlertTriangle className="w-6 h-6" aria-hidden="true" />
          Este caso parece estar fuera del ámbito laboral de HIKARI
        </h2>
        <p className={isDayMode ? "text-gray-700" : "text-gray-300"}>
          HIKARI orienta exclusivamente sobre derecho laboral colombiano (despidos, salarios,
          acoso laboral, vacaciones, contratos de trabajo, etc.). Tu consulta no parece
          corresponder a ese ámbito, así que no podemos ofrecerte un análisis jurídico aquí.
        </p>
        <p className={`mt-4 text-sm italic ${isDayMode ? "text-gray-500" : "text-gray-400"}`}>
          {result.disclaimer}
        </p>
      </div>
    );
  }

  const showAmbiguousNotice = result.scope === "ambiguo";

  return (
    <div>
      {showAmbiguousNotice && (
        <div
          className={`mb-6 border-2 p-4 text-sm ${
            isDayMode ? "border-gray-400 text-gray-700" : "border-gray-600 text-gray-300"
          }`}
          style={{ borderRadius: "2px" }}
        >
          No fue posible confirmar con certeza que este caso sea laboral. La orientación de abajo
          es preliminar; entre más detalles des, más precisa será.
        </div>
      )}

      {result.summary && (
        <Section isDayMode={isDayMode} icon={<ScrollText className="w-5 h-5" aria-hidden="true" />} title="Qué está pasando">
          <p className={`whitespace-pre-wrap ${isDayMode ? "text-gray-800" : "text-gray-200"}`}>{result.summary}</p>
        </Section>
      )}

      {result.legal_analysis && (
        <Section isDayMode={isDayMode} icon={<Scale className="w-5 h-5" aria-hidden="true" />} title="Análisis">
          <p className={`whitespace-pre-wrap leading-relaxed ${isDayMode ? "text-gray-800" : "text-gray-200"}`}>
            {result.legal_analysis}
          </p>
        </Section>
      )}

      {result.norms.length > 0 && (
        <Section isDayMode={isDayMode} icon={<BookOpen className="w-5 h-5" aria-hidden="true" />} title="Normas aplicables">
          <ul className="space-y-3">
            {result.norms.map((norm, i) => (
              <li
                key={i}
                className={`border-l-2 pl-4 ${isDayMode ? "border-black" : "border-white"}`}
              >
                <p className={`font-semibold ${isDayMode ? "text-black" : "text-white"}`}>
                  {norm.code}
                  {norm.article ? ` · ${norm.article}` : ""}
                </p>
                {norm.description && (
                  <p className={`text-sm ${isDayMode ? "text-gray-600" : "text-gray-400"}`}>{norm.description}</p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {result.actions.length > 0 && (
        <Section isDayMode={isDayMode} icon={<CheckCircle2 className="w-5 h-5" aria-hidden="true" />} title="Qué puedes hacer">
          <ul className="space-y-2">
            {result.actions.map((action, i) => (
              <li key={i} className={`flex gap-2 ${isDayMode ? "text-gray-800" : "text-gray-200"}`}>
                <span aria-hidden="true">→</span>
                <span>
                  {action.description}
                  {action.priority && (
                    <span className={`ml-2 text-xs uppercase tracking-wide ${isDayMode ? "text-gray-500" : "text-gray-500"}`}>
                      ({action.priority})
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {result.missing_information.length > 0 && (
        <Section isDayMode={isDayMode} icon={<HelpCircle className="w-5 h-5" aria-hidden="true" />} title="Información que falta">
          <ul className="space-y-3">
            {result.missing_information.map((item, i) => (
              <li key={i}>
                <p className={isDayMode ? "text-gray-800" : "text-gray-200"}>{item.question}</p>
                {item.reason && (
                  <p className={`text-sm ${isDayMode ? "text-gray-500" : "text-gray-400"}`}>{item.reason}</p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {result.citations.length > 0 && (
        <Section isDayMode={isDayMode} icon={<BookOpen className="w-5 h-5" aria-hidden="true" />} title="Fuentes">
          <ul className="space-y-3">
            {result.citations.map((citation, i) => (
              <li key={i} className="text-sm">
                <p className={`font-semibold ${isDayMode ? "text-black" : "text-white"}`}>{citation.source}</p>
                {citation.excerpt && (
                  <p className={`italic ${isDayMode ? "text-gray-600" : "text-gray-400"}`}>&ldquo;{citation.excerpt}&rdquo;</p>
                )}
                {citation.url && (
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`underline underline-offset-2 ${isDayMode ? "text-black" : "text-white"}`}
                  >
                    Ver fuente
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <p className={`text-sm italic border-t pt-4 ${isDayMode ? "text-gray-500 border-gray-200" : "text-gray-400 border-gray-800"}`}>
        {result.disclaimer}
      </p>
    </div>
  );
}
