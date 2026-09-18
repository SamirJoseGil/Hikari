Los estilos de la pagina son en base a mi repositorio, tiene que seguir los mismos estilos: 


```typescript

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "@remix-run/react";
import Cookies from "js-cookie";
import { ArrowLeft, Sun, Moon } from "lucide-react";
import WhatsAppButton from "~/components/WhatsAppButton";
import AboutSection from "~/components/sections/AboutSection";
import SkillsSection from "~/components/sections/SkillsSection";
import ProjectsSection from "~/components/sections/ProjectsSection";
import EducationSection from "~/components/sections/EducationSection";

export const meta = () => {
  return [
    { title: "Sobre mí - Samir José Osorio Gil" },
    { name: "description", content: "Conoce más sobre mi experiencia, habilidades y trayectoria profesional." },
  ];
};

export default function About() {
  const [isDayMode, setIsDayMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedMode = Cookies.get('isDayMode');
      return savedMode ? JSON.parse(savedMode) : true;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      Cookies.set('isDayMode', JSON.stringify(isDayMode));
    }
  }, [isDayMode]);

  const toggleDayNightMode = () => {
    setIsDayMode(!isDayMode);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      isDayMode ? 'bg-white' : 'bg-black'
    }`}>
      {/* Header Navigation */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 w-full z-50 backdrop-blur-sm border-b transition-colors ${
          isDayMode
            ? 'bg-white/80 border-gray-200'
            : 'bg-black/80 border-gray-800'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" prefetch="intent">
            <motion.button
              whileHover={{ x: -5 }}
              className={`flex items-center gap-2 text-lg ${
                isDayMode ? 'text-black' : 'text-white'
              }`}
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              <ArrowLeft className="w-5 h-5" />
              Volver
            </motion.button>
          </Link>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleDayNightMode}
            className={`p-3 border-2 transition-all duration-300 ${
              isDayMode
                ? 'border-black text-black hover:bg-black hover:text-white'
                : 'border-white text-white hover:bg-white hover:text-black'
            }`}
            style={{ borderRadius: "2px" }}
          >
            {isDayMode ? <Moon size={20} /> : <Sun size={20} />}
          </motion.button>
        </div>
      </motion.header>

      {/* WhatsApp Button */}
      <WhatsAppButton isDayMode={isDayMode} />

      {/* Main Content */}
      <main className="pt-24">
        <AboutSection isDayMode={isDayMode} />
        <SkillsSection isDayMode={isDayMode} />
        <ProjectsSection isDayMode={isDayMode} />
        <EducationSection isDayMode={isDayMode} />

        {/* CTA Footer */}
        <section className={`py-20 border-t ${
          isDayMode ? 'border-gray-200' : 'border-gray-800'
        }`}>
          <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2
                className={`text-4xl md:text-5xl font-bold mb-8 ${
                  isDayMode ? 'text-black' : 'text-white'
                }`}
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                ¿Listo para trabajar juntos?
              </h2>
              
              <Link to="/contact" prefetch="intent">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-10 py-5 border-2 transition-all duration-300 ${
                    isDayMode
                      ? 'bg-black text-white border-black hover:bg-white hover:text-black'
                      : 'bg-white text-black border-white hover:bg-black hover:text-white'
                  }`}
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "1.1rem",
                    letterSpacing: "0.08em"
                  }}
                >
                  INICIAR CONVERSACIÓN
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </section>

        <footer
          className={`border-t ${
            isDayMode ? 'border-gray-200' : 'border-gray-800'
          }`}
        >
          <div className="max-w-7xl mx-auto px-6 py-8 text-center">
            <p
              className={`text-sm tracking-[0.06em] ${
                isDayMode ? 'text-gray-600' : 'text-gray-400'
              }`}
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Copyright (c) {new Date().getFullYear()} Samir Jose Osorio Gil.
              Powered by{' '}
              <a
                href="https://www.sglabs.site/"
                target="_blank"
                rel="noreferrer"
                className={`underline underline-offset-4 transition-colors ${
                  isDayMode
                    ? 'text-black hover:text-gray-700'
                    : 'text-white hover:text-gray-300'
                }`}
              >
                SG Labs
              </a>
              .
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
```

```typescript

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "@remix-run/react";
import Cookies from "js-cookie";
import { Sun, Moon, ArrowRight } from "lucide-react";
import WhatsAppButton from "~/components/WhatsAppButton";

export const meta = () => {
  return [
    { title: "Samir José Osorio Gil - Full Stack Developer & Project Manager" },
    { name: "description", content: "Desarrollador Full Stack colombiano de 18 años, Project Manager y tutor en programación." },
  ];
};

export default function Index() {
  const [isDayMode, setIsDayMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedMode = Cookies.get('isDayMode');
      return savedMode ? JSON.parse(savedMode) : true;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      Cookies.set('isDayMode', JSON.stringify(isDayMode));
    }
  }, [isDayMode]);

  const toggleDayNightMode = () => {
    setIsDayMode(!isDayMode);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      isDayMode ? 'bg-white' : 'bg-black'
    }`}>
      {/* Theme Toggle */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleDayNightMode}
        className={`fixed top-8 right-8 z-50 p-3 border-2 transition-all duration-300 ${
          isDayMode
            ? 'border-black text-black hover:bg-black hover:text-white'
            : 'border-white text-white hover:bg-white hover:text-black'
        }`}
        style={{ borderRadius: "2px" }}
      >
        {isDayMode ? <Moon size={24} /> : <Sun size={24} />}
      </motion.button>

      {/* WhatsApp Button */}
      <WhatsAppButton isDayMode={isDayMode} />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden px-6">
        {/* Subtle Background */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 z-0"
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.03, 0.05, 0.03]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl ${
              isDayMode ? 'bg-gray-900' : 'bg-white'
            }`}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="relative z-10 max-w-5xl mx-auto text-center"
        >
          {/* Editorial Line */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, delay: 0.5 }}
            className={`h-px mb-12 mx-auto ${isDayMode ? 'bg-black' : 'bg-white'}`}
          />

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, letterSpacing: "0.3em" }}
            animate={{ opacity: 1, letterSpacing: "0.08em" }}
            transition={{ duration: 1.2, delay: 0.8 }}
            className={`text-6xl md:text-8xl font-bold mb-8 uppercase ${
              isDayMode ? 'text-black' : 'text-white'
            }`}
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Samir José
            <br />
            Osorio Gil
          </motion.h1>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="mb-12"
          >
            <p
              className={`text-2xl md:text-3xl italic mb-6 ${
                isDayMode ? 'text-gray-700' : 'text-gray-300'
              }`}
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Full Stack Developer | Project Manager
            </p>
            
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "50%" }}
              transition={{ duration: 0.8, delay: 1.5 }}
              className={`h-px mx-auto ${isDayMode ? 'bg-gray-400' : 'bg-gray-600'}`}
            />
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.8 }}
            className={`text-lg md:text-xl mb-16 max-w-3xl mx-auto ${
              isDayMode ? 'text-gray-600' : 'text-gray-400'
            }`}
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Construyo experiencias digitales que combinan estrategia, tecnología y creatividad.
            <br />
            <span className="text-base italic mt-2 block">
              Colombiano de 18 años, apasionado por crear soluciones que aporten valor real.
            </span>
          </motion.p>

          {/* Navigation Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2 }}
            className="flex flex-col sm:flex-row gap-6 items-center justify-center"
          >
            <Link to="/about" prefetch="intent">
              <motion.button
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`group px-10 py-5 border-2 transition-all duration-300 flex items-center gap-3 ${
                  isDayMode
                    ? 'bg-black text-white border-black hover:bg-white hover:text-black'
                    : 'bg-white text-black border-white hover:bg-black hover:text-white'
                }`}
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "1.1rem",
                  letterSpacing: "0.08em"
                }}
              >
                CONOCER MÁS
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>

            <Link to="/contact" prefetch="intent">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-10 py-5 border-2 transition-all duration-300 ${
                  isDayMode
                    ? 'border-gray-400 text-gray-700 hover:border-black hover:text-black'
                    : 'border-gray-600 text-gray-400 hover:border-white hover:text-white'
                }`}
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "1.1rem",
                  letterSpacing: "0.08em"
                }}
              >
                CONTACTO
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <footer
        className={`border-t ${
          isDayMode ? "border-gray-200" : "border-gray-800"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <p
            className={`text-sm tracking-[0.06em] ${
              isDayMode ? "text-gray-600" : "text-gray-400"
            }`}
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Copyright (c) {new Date().getFullYear()} Samir Jose Osorio Gil.
            Powered by{" "}
            <a
              href="https://www.sglabs.site/"
              target="_blank"
              rel="noreferrer"
              className={`underline underline-offset-4 transition-colors ${
                isDayMode
                  ? "text-black hover:text-gray-700"
                  : "text-white hover:text-gray-300"
              }`}
            >
              SG Labs
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}

```