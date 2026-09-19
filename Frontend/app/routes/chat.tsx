import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Download, RotateCcw } from "lucide-react";

import ConsultationForm from "~/components/hikari/ConsultationForm";
import ConsultationResult from "~/components/hikari/ConsultationResult";
import HistoryPanel from "~/components/hikari/HistoryPanel";
import PageShell from "~/components/layout/PageShell";
import { createConsultation, HikariApiError } from "~/lib/hikariApi";
import { addGuestHistoryItem, loadGuestHistory } from "~/lib/guestHistory";
import type { ConsultationHistoryItem, ConsultationResponse } from "~/types/hikari";

export const meta = () => {
  return [
    { title: "Consultar — HIKARI" },
    { name: "description", content: "Cuéntale a HIKARI tu situación laboral y recibe una orientación jurídica clara." },
  ];
};

export default function Chat() {
  const [result, setResult] = useState<ConsultationResponse | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<ConsultationHistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);

  useEffect(() => {
    // Guest history is per-browser (localStorage), not tied to any account.
    setHistory(loadGuestHistory());
  }, []);

  async function handleSubmit(message: string) {
    if (loading) return;
    setLoading(true);
    setError(null);
    setSelectedHistoryId(null);
    try {
      const response = await createConsultation(message);
      setResult(response);
      setQuestion(message);
      const item = addGuestHistoryItem(message, response);
      setHistory((prev) => [item, ...prev]);
    } catch (err) {
      setResult(null);
      setError(
        err instanceof HikariApiError
          ? err.message
          : "Ocurrió un problema inesperado. Inténtalo de nuevo en unos minutos."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSelectHistory(item: ConsultationHistoryItem) {
    setResult(item.response);
    setQuestion(item.question);
    setError(null);
    setSelectedHistoryId(item.id);
  }

  function handleNewConsultation() {
    setResult(null);
    setQuestion(null);
    setError(null);
    setSelectedHistoryId(null);
  }

  function handleDownloadPdf() {
    window.print();
  }

  return (
    <PageShell>
      {(isDayMode) => (
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between gap-4 mb-8">
            <h1
              className={`text-3xl md:text-4xl font-bold ${isDayMode ? "text-black" : "text-white"}`}
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Consultar
            </h1>
            {(result || error) && (
              <button
                type="button"
                onClick={handleNewConsultation}
                className={`print:hidden flex items-center gap-2 text-sm px-3 py-2 border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isDayMode
                    ? "border-gray-400 text-gray-700 hover:border-black hover:text-black focus-visible:ring-black"
                    : "border-gray-600 text-gray-300 hover:border-white hover:text-white focus-visible:ring-white"
                }`}
                style={{ borderRadius: "2px" }}
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                Nueva consulta
              </button>
            )}
          </div>

          <div
            className={`print:hidden border-2 p-6 md:p-8 mb-10 ${isDayMode ? "border-black" : "border-white"}`}
            style={{ borderRadius: "2px" }}
          >
            <ConsultationForm isDayMode={isDayMode} loading={loading} onSubmit={handleSubmit} />
          </div>

          {error && (
            <div
              role="alert"
              className={`mb-10 border-2 border-red-600 p-4 flex items-start gap-3 ${
                isDayMode ? "bg-red-50" : "bg-red-950"
              }`}
              style={{ borderRadius: "2px" }}
            >
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
              <p className={isDayMode ? "text-red-800" : "text-red-300"}>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-10">
            <div className="print-area">
              {result && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                  <div className="hidden print:block mb-6">
                    <h1 className="text-2xl font-bold" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                      HIKARI
                    </h1>
                    <p className="italic">Orientación laboral</p>
                    {question && (
                      <p className="mt-3">
                        <strong>Situación:</strong> {question}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className={`print:hidden mb-6 flex items-center gap-2 text-sm px-3 py-2 border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      isDayMode
                        ? "border-black text-black hover:bg-black hover:text-white focus-visible:ring-black"
                        : "border-white text-white hover:bg-white hover:text-black focus-visible:ring-white"
                    }`}
                    style={{ borderRadius: "2px" }}
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                    Descargar PDF
                  </button>

                  <ConsultationResult isDayMode={isDayMode} result={result} />
                </motion.div>
              )}

              {!result && !error && !loading && (
                <p className={`text-sm ${isDayMode ? "text-gray-400" : "text-gray-500"}`}>
                  Escribe tu situación arriba o elige un ejemplo rápido para ver cómo responde HIKARI.
                </p>
              )}
            </div>

            <div className="print:hidden">
              <HistoryPanel
                isDayMode={isDayMode}
                history={history}
                loading={false}
                selectedId={selectedHistoryId}
                onSelect={handleSelectHistory}
              />
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
