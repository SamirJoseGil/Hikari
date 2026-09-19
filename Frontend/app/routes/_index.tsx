import { motion } from "framer-motion";
import { Link } from "@remix-run/react";
import { ArrowRight, MessageCircle, Scale, ShieldCheck } from "lucide-react";
import PageShell from "~/components/layout/PageShell";

export const meta = () => {
  return [
    { title: "HIKARI — Orientación en derecho laboral colombiano" },
    {
      name: "description",
      content:
        "Cuéntale tu situación laboral a HIKARI y recibe una orientación jurídica clara, basada en la ley laboral colombiana.",
    },
  ];
};

const EXAMPLES = [
  "Me despidieron sin justa causa",
  "Mi jefe me grita frente a todos",
  "No me han pagado mi salario",
];

const STEPS = [
  {
    icon: MessageCircle,
    title: "Cuéntanos tu caso",
    text: "Describe tu situación laboral en lenguaje cotidiano, sin tecnicismos.",
  },
  {
    icon: Scale,
    title: "HIKARI analiza",
    text: "Consulta un corpus real de derecho laboral colombiano y genera una orientación fundamentada.",
  },
  {
    icon: ShieldCheck,
    title: "Recibe claridad",
    text: "Normas, acciones concretas, información que falta y las fuentes exactas usadas.",
  },
];

export default function Index() {
  return (
    <PageShell>
      {(isDayMode) => (
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className={`inline-flex items-center gap-2 mb-4 justify-center ${isDayMode ? "text-black" : "text-white"}`}>
              <Scale className="w-8 h-8" aria-hidden="true" />
              <h1
                className="text-5xl md:text-6xl font-bold uppercase tracking-wide"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                HIKARI
              </h1>
            </div>
            <p
              className={`text-lg md:text-xl italic max-w-2xl mx-auto ${isDayMode ? "text-gray-700" : "text-gray-300"}`}
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Orientación clara e inmediata en derecho laboral colombiano.
            </p>
            <p className={`mt-4 max-w-2xl mx-auto ${isDayMode ? "text-gray-600" : "text-gray-400"}`}>
              HIKARI está especializado <strong>exclusivamente</strong> en situaciones laborales: despidos,
              salarios, prestaciones, vacaciones, acoso laboral y cambios de condiciones de trabajo. No
              atiende otras áreas del derecho ni sustituye la asesoría de un abogado.
            </p>

            <Link to="/chat" prefetch="intent">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`mt-8 inline-flex items-center gap-3 px-10 py-5 border-2 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isDayMode
                    ? "bg-black text-white border-black hover:bg-white hover:text-black focus-visible:ring-black"
                    : "bg-white text-black border-white hover:bg-black hover:text-white focus-visible:ring-white"
                }`}
                style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "0.08em" }}
              >
                CONSULTAR AHORA
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </motion.button>
            </Link>

            <p className={`mt-3 text-xs ${isDayMode ? "text-gray-400" : "text-gray-500"}`}>
              No necesitas crear una cuenta para usar HIKARI.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 flex flex-wrap justify-center gap-3"
          >
            {EXAMPLES.map((example) => (
              <span
                key={example}
                className={`text-sm px-3 py-1.5 border ${
                  isDayMode ? "border-gray-300 text-gray-700" : "border-gray-700 text-gray-300"
                }`}
                style={{ borderRadius: "999px" }}
              >
                {example}
              </span>
            ))}
          </motion.div>

          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`border-2 p-6 ${isDayMode ? "border-black" : "border-white"}`}
                style={{ borderRadius: "2px" }}
              >
                <step.icon className={`w-6 h-6 mb-3 ${isDayMode ? "text-black" : "text-white"}`} aria-hidden="true" />
                <h2
                  className={`font-bold mb-2 ${isDayMode ? "text-black" : "text-white"}`}
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  {step.title}
                </h2>
                <p className={`text-sm ${isDayMode ? "text-gray-600" : "text-gray-400"}`}>{step.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={`mt-16 text-xs ${isDayMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Hecho por{" "}
            <a
              href="https://sglabs.site"
              target="_blank"
              rel="noreferrer"
              className={`underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-offset-2 rounded ${
                isDayMode ? "hover:text-black focus-visible:ring-black" : "hover:text-white focus-visible:ring-white"
              }`}
            >
              SG Labs
            </a>
            . Conoce al desarrollador en{" "}
            <a
              href="https://portfolio.sglabs.site"
              target="_blank"
              rel="noreferrer"
              className={`underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-offset-2 rounded ${
                isDayMode ? "hover:text-black focus-visible:ring-black" : "hover:text-white focus-visible:ring-white"
              }`}
            >
              portfolio.sglabs.site
            </a>
            .
          </motion.p>
        </div>
      )}
    </PageShell>
  );
}

