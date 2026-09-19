import type { ConsultationHistoryItem, ConsultationResponse } from "~/types/hikari";

const STORAGE_KEY = "hikari_guest_history";
const MAX_ITEMS = 30;

// Guest ("modo invitado") history lives only in this browser, never on the backend
// under another user's identity — there is no real auth to scope it to yet.
export function loadGuestHistory(): ConsultationHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConsultationHistoryItem[]) : [];
  } catch {
    return [];
  }
}

export function addGuestHistoryItem(question: string, response: ConsultationResponse): ConsultationHistoryItem {
  const item: ConsultationHistoryItem = {
    id: Date.now(),
    question,
    scope: response.scope,
    intent: response.intent,
    response,
    created_at: new Date().toISOString(),
  };
  const updated = [item, ...loadGuestHistory()].slice(0, MAX_ITEMS);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return item;
}

export function guestHistoryCount(): number {
  return loadGuestHistory().length;
}
