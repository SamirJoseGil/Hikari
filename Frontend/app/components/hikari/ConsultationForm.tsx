import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Send } from "lucide-react";

const EXAMPLES = [
  "Me despidieron sin justa causa",
  "Mi jefe me grita frente a todos",
  "No me han pagado mi salario",
];

interface ConsultationFormProps {
  isDayMode: boolean;
  loading: boolean;
  onSubmit: (message: string) => void;
}

export default function ConsultationForm({ isDayMode, loading, onSubmit }: ConsultationFormProps) {
  const [message, setMessage] = useState("");
  const [touched, setTouched] = useState(false);

  const isEmpty = message.trim().length === 0;
  const showEmptyError = touched && isEmpty;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (isEmpty || loading) return;
    onSubmit(message.trim());
  }

  function handleExampleClick(example: string) {
    setMessage(example);
    setTouched(true);
    if (!loading) onSubmit(example);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      <label
        htmlFor="hikari-message"
        className={`block text-sm mb-2 tracking-wide uppercase ${
          isDayMode ? "text-gray-700" : "text-gray-300"
        }`}
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        Cuéntanos tu situación laboral
      </label>

      <textarea
        id="hikari-message"
        name="message"
        rows={5}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder="Ej: Me despidieron sin justa causa después de 3 años de trabajo. ¿Qué me deben pagar?"
        aria-invalid={showEmptyError}
        aria-describedby={showEmptyError ? "hikari-message-error" : undefined}
        className={`w-full p-4 border-2 outline-none transition-colors resize-y focus-visible:ring-2 focus-visible:ring-offset-2 ${
          isDayMode
            ? "bg-white text-black border-black placeholder:text-gray-400 focus-visible:ring-black"
            : "bg-black text-white border-white placeholder:text-gray-500 focus-visible:ring-white"
        }`}
        style={{ borderRadius: "2px" }}
      />

      {showEmptyError && (
        <p id="hikari-message-error" role="alert" className="mt-2 text-sm text-red-600">
          Escribe brevemente tu situación antes de consultar.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => handleExampleClick(example)}
            disabled={loading}
            className={`text-sm px-3 py-1.5 border transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-offset-2 ${
              isDayMode
                ? "border-gray-400 text-gray-700 hover:border-black hover:text-black focus-visible:ring-black"
                : "border-gray-600 text-gray-300 hover:border-white hover:text-white focus-visible:ring-white"
            }`}
            style={{ borderRadius: "999px" }}
          >
            {example}
          </button>
        ))}
      </div>

      <motion.button
        type="submit"
        disabled={loading}
        whileHover={loading ? undefined : { scale: 1.02 }}
        whileTap={loading ? undefined : { scale: 0.98 }}
        className={`mt-6 w-full sm:w-auto px-8 py-4 border-2 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-offset-2 ${
          isDayMode
            ? "bg-black text-white border-black hover:bg-white hover:text-black focus-visible:ring-black"
            : "bg-white text-black border-white hover:bg-black hover:text-white focus-visible:ring-white"
        }`}
        style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "0.08em" }}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            ANALIZANDO...
          </>
        ) : (
          <>
            CONSULTAR
            <Send className="w-4 h-4" aria-hidden="true" />
          </>
        )}
      </motion.button>
    </form>
  );
}
