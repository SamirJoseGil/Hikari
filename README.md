# HIKARI ⚖️

> Asistente inteligente de orientación en derecho laboral colombiano.

HIKARI es una plataforma especializada diseñada para recibir situaciones cotidianas en lenguaje natural y devolver una orientación jurídica estructurada, confiable y respaldada por normas legales vigentes de Colombia.

---

## Enlaces del Proyecto

*   **Frontend (Aplicación Web):** [hikari.sglabs.site](https://hikari.sglabs.site)
*   **Backend (API & Motor Jurídico):** [hikariapi.sglabs.site](https://hikariapi.sglabs.site)
*   **Presentación del Proyecto:** [portfolio.sglabs.site/presentations](https://portfolio.sglabs.site/presentations)

---

## ¿Qué problema resolvemos?
Muchas personas enfrentan situaciones laborales complejas (despido sin justa causa, acoso, problemas con salarios o vacaciones) y desconocen si cuentan con respaldo legal, cuáles son sus derechos reales o qué pasos seguir. HIKARI acorta la brecha entre el ciudadano y la complejidad del derecho laboral colombiano, ofreciendo respuestas claras, fundamentadas y con límites éticos y legales definidos.

---

## Funcionalidades Principales

1. **Interpretación en Lenguaje Natural:** Comprende relatos cotidianos de los usuarios sin necesidad de jerga técnica o jurídica.
2. **Clasificación y Filtrado de Dominio:** 
   * Detecta automáticamente si la consulta pertenece al ámbito laboral o si está fuera de dominio (rechazando consultas ajenas).
   * Identifica el tipo de caso (Terminación laboral, salarios y prestaciones, vacaciones, acoso laboral, condiciones/cambio de funciones, etc.).
3. **Capa de Inteligencia Eficiente:** Utiliza un sistema híbrido que prioriza validaciones locales, normalización de texto, caché y reglas deterministas antes de invocar a modelos de lenguaje pesados, optimizando costes y latencia.
4. **Base de Conocimiento Jurídico (RAG):** Búsqueda semántica precisa sobre fragmentos normativos relevantes para extraer las fuentes y artículos exactos.
5. **Cálculos Deterministas:** Procesamiento lógico de variables clave (fechas, salarios, días trabajados) mediante código estructurado para evitar errores aritméticos por parte de la IA.
6. **Estructura de Respuesta Estandarizada:** Cada consulta exitosa ofrece:
   * Resumen de la situación.
   * Normas y artículos aplicables con sus respectivas citas y fuentes verificables.
   * Acciones recomendadas a seguir.
   * Información faltante (si es necesaria para una mejor evaluación) y descargo de responsabilidad legal.
7. **Historial Persistente:** Almacenamiento seguro de consultas previas mediante base de datos relacional.

---

## Arquitectura Técnica

HIKARI está construido bajo una arquitectura modular y limpia:
* **Frontend:** Interfaz de usuario moderna, rápida y responsiva enfocada en la experiencia de producto.
* **Backend:** API robusta desarrollada con **FastAPI** (Python).
* **Capa de Datos:** **PostgreSQL / Supabase** para la persistencia de consultas, caché y metadatos normativos.
* **Inteligencia y Modelos:** Integración de embeddings ligeros, base de conocimiento vectorial y un modelo de lenguaje con filtros estrictos de post-procesamiento (verificación de esquema, citas y seguridad).

---

## Límites y Dominio
HIKARI está restringido estrictamente al **Derecho Laboral Colombiano**. No emite certezas absolutas cuando la información aportada es insuficiente y rechaza de forma controlada cualquier consulta que escape de su dominio legal.

---
*Desarrollado bajo los estándares de calidad técnica y arquitectura de SG Labs.*