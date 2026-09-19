export type Scope = "laboral" | "fuera_de_dominio" | "ambiguo";

export interface NormReference {
  code: string;
  article?: string | null;
  description?: string | null;
}

export interface Citation {
  source: string;
  excerpt?: string | null;
  url?: string | null;
}

export interface ActionItem {
  description: string;
  priority?: string | null;
}

export interface MissingInformationItem {
  question: string;
  reason?: string | null;
}

export interface ConsultationResponse {
  scope: Scope;
  intent: string;
  summary: string;
  legal_analysis: string;
  norms: NormReference[];
  actions: ActionItem[];
  missing_information: MissingInformationItem[];
  citations: Citation[];
  disclaimer: string;
}

export interface ConsultationHistoryItem {
  id: number;
  question: string;
  scope: Scope;
  intent: string;
  response: ConsultationResponse;
  created_at: string;
}
