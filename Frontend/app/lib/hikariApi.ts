import type { ConsultationHistoryItem, ConsultationResponse } from "~/types/hikari";

function getBackendUrl(): string {
  if (typeof window !== "undefined" && window.ENV?.BACKEND_URL) {
    return window.ENV.BACKEND_URL;
  }
  return "http://127.0.0.1:8000";
}

export class HikariApiError extends Error {}

export async function createConsultation(message: string): Promise<ConsultationResponse> {
  let response: Response;
  try {
    response = await fetch(`${getBackendUrl()}/api/consultations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
  } catch {
    throw new HikariApiError("No pudimos conectar con el servidor de HIKARI. Verifica tu conexión e inténtalo de nuevo.");
  }

  if (!response.ok) {
    let detail = "No pudimos procesar tu consulta. Inténtalo de nuevo en unos minutos.";
    try {
      const body = await response.json();
      if (response.status === 422 && Array.isArray(body.detail)) {
        detail = body.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(" ") || detail;
      }
    } catch {
      // ignore malformed error bodies; keep the generic message
    }
    throw new HikariApiError(detail);
  }

  return response.json();
}

export async function fetchHistory(limit = 20): Promise<ConsultationHistoryItem[]> {
  try {
    const response = await fetch(`${getBackendUrl()}/api/consultations?limit=${limit}`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}
