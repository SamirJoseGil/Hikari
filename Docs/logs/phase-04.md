# Fase 4 — Frontend conectado a la API real

### Qué cambió

- Nueva UI de HIKARI en `Frontend/app/routes/_index.tsx`: hero (nombre, propuesta de valor,
  aviso de dominio exclusivo), formulario con textarea + 3 ejemplos rápidos, panel de
  resultado y panel de historial. Mantiene la identidad visual existente (blanco/negro,
  bordes gruesos, tipografía Georgia serif, toggle día/noche con `js-cookie`, `framer-motion`).
- `Frontend/app/root.tsx`: agrega un `loader` que expone `BACKEND_URL` al cliente vía
  `window.ENV` (patrón estándar de Remix para variables de entorno en runtime).

### Componentes/pantallas añadidos

- `app/components/hikari/ConsultationForm.tsx`: textarea (con label asociado, `aria-invalid`,
  error accesible), 3 ejemplos rápidos (autoenvían), botón con estado de carga
  (`ANALIZANDO...`, deshabilitado, evita envíos duplicados).
- `app/components/hikari/ConsultationResult.tsx`: renderiza `ConsultationResponse` en
  secciones (Qué está pasando, Análisis, Normas aplicables, Qué puedes hacer, Información que
  falta, Fuentes, Aviso), ocultando secciones vacías. Vista especial para
  `scope = "fuera_de_dominio"` ("Este caso parece estar fuera del ámbito laboral de HIKARI").
  Nunca muestra JSON crudo.
- `app/components/hikari/HistoryPanel.tsx`: lista de consultas previas, clic para volver a
  mostrar su respuesta guardada (sin nueva llamada al backend).
- `app/lib/hikariApi.ts` + `app/types/hikari.ts`: cliente HTTP tipado hacia el backend real
  (sin mocks) y tipos que reflejan el contrato del backend.

### Cómo se conecta al backend

- `POST {BACKEND_URL}/api/consultations` al enviar el formulario (sin recargar la página).
- `GET {BACKEND_URL}/api/consultations?limit=20` al montar la página y después de cada consulta
  nueva, para refrescar el historial.
- `BACKEND_URL` se resuelve así: `window.ENV.BACKEND_URL` (inyectado por el loader desde
  `process.env.BACKEND_URL`) con fallback a `http://127.0.0.1:8000`.

### Casos probados manualmente (navegador real, backend real)

- **Entrada vacía:** botón "Consultar" sin texto → error accesible en línea, sin llamada a la API.
- **Loading:** al enviar, botón cambia a "ANALIZANDO...", se deshabilita junto con los ejemplos
  rápidos (evita doble envío); esto se verificó en vivo.
- **C3** ("Me estafaron comprando un carro usado."): respondió de inmediato con la tarjeta de
  "fuera del ámbito laboral de HIKARI", sin secciones vacías, con disclaimer. Se agregó al
  historial correctamente.
- **Historial:** al hacer clic en una consulta previa (C2 real, generada en fase 3), se
  renderizó su `ConsultationResponse` completa (resumen, análisis, normas con artículo y
  descripción, acciones, información faltante, citas con fuente/URL, disclaimer) — confirma que
  el render de una respuesta laboral completa funciona correctamente.
- **Modo oscuro:** el toggle día/noche funciona y mantiene la legibilidad y el estilo en ambas
  variantes.
- **C1 y C2 con llamada nueva a Gemini:** no se pudieron completar con una respuesta jurídica
  real en esta sesión porque la cuota gratuita diaria de Gemini (20 solicitudes/día) ya estaba
  agotada por las pruebas de las fases 3 y 4 (ver "Problemas"). En su lugar se verificó el
  camino de **error controlado**: el backend agota su único reintento y devuelve una
  `ConsultationResponse` de fallback (200, con `missing_information` explicando que el análisis
  no está disponible); el frontend la renderiza igual que cualquier respuesta laboral, sin
  romperse y sin mostrar JSON ni stack traces. C1 y C2 sí se habían verificado con Gemini real
  y contenido correcto en la Fase 3 (ver `Docs/logs/phase-03.md`), y el historial de esta fase
  reutiliza exactamente esas respuestas guardadas para confirmar el render.

### Problemas encontrados

1. **Puerto 8000 ocupado localmente por Portainer** (contenedor Docker ya usa ese puerto en esta
   máquina). Se usó el puerto 8010 para el backend en las pruebas de esta fase y se ajustó
   `Frontend/.env` (`BACKEND_URL=http://127.0.0.1:8010`). No es un problema de código; solo hay
   que verificar el puerto libre en cada entorno.
2. **Cuota diaria de Gemini agotada** (Free Tier: 20 solicitudes/día para `gemini-3.8-flash`) por
   el volumen de pruebas reales en fases 3 y 4. Esto impidió generar una respuesta jurídica nueva
   en esta fase, pero permitió verificar en vivo el manejo de errores del backend/frontend.
3. **Bug real encontrado y corregido:** el SDK `google-genai` reintenta automáticamente hasta 5
   veces con backoff (hasta 60s) ante 429/5xx, lo que hacía que una sola consulta colgara varios
   minutos y multiplicaba las llamadas reales más allá del único reintento que define nuestra
   política de costos. Se corrigió pasando `http_options` con `retry_options=HttpRetryOptions(attempts=1)`
   y `timeout=20_000` al crear el cliente en `embedding_service.py` y `llm_service.py`. Con esto,
   una consulta que falla ahora responde en segundos (con el fallback controlado) en vez de
   minutos. Los 23 tests automatizados (con fakes) se re-ejecutaron después del cambio y siguen
   en verde.

### Próxima fase

Pulir la experiencia con Gemini real una vez se restablezca la cuota (verificar C1/C2 nuevos, no
solo desde historial), y considerar áreas de mejora de producto que el hackathon aún no cubre
(no se listan aquí funcionalidades nuevas fuera de alcance, según las restricciones de esta fase).
