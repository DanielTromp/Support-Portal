export interface BrandConfig {
  companyName: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  supportEmail: string;
  supportPhone: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface FaqData {
  categories: string[];
  items: FaqItem[];
  uploadedAt: string | null;
  fileName: string | null;
  brand: BrandConfig | null;
}

export type Language = "nl" | "en";

export interface CategoryIcon {
  name: string;
  icon: string;
}

export interface DbUser {
  id: number;
  username: string;
  role: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  username: string;
  started_at: string;
  language: string;
  message_count: number;
  total_tokens_in: number;
  total_tokens_out: number;
  total_cost: number;
}

export interface ChatMessage {
  id: number;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_in: number;
  tokens_out: number;
  cost: number;
  model: string | null;
  created_at: string;
}

export interface ActivityLogEntry {
  id: number;
  username: string | null;
  session_id: string | null;
  action: string;
  details_json: string | null;
  created_at: string;
}

export interface SystemLogEntry {
  id: number;
  level: string;
  message: string;
  details_json: string | null;
  created_at: string;
}

export interface UsageStats {
  totals: {
    total_sessions: number;
    total_tokens_in: number;
    total_tokens_out: number;
    total_cost: number;
    total_messages: number;
  };
  byUser: {
    username: string;
    sessions: number;
    tokens_in: number;
    tokens_out: number;
    cost: number;
  }[];
  byDay: {
    day: string;
    tokens_in: number;
    tokens_out: number;
    cost: number;
    messages: number;
  }[];
}
