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
