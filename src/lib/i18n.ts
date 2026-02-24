import { Language } from "@/types";

const translations = {
  nl: {
    title: "Supportportaal",
    hero_title: "Hoe kunnen we u helpen?",
    hero_subtitle:
      "Doorzoek onze kennisbank voor antwoorden op veelgestelde vragen over mobiele dienstverlening.",
    search_placeholder: "Zoek in veelgestelde vragen...",
    all_categories: "Alle categorieën",
    no_results: "Geen resultaten gevonden",
    no_results_hint: "Probeer een andere zoekterm of selecteer een andere categorie.",
    no_data: "Geen FAQ-gegevens beschikbaar",
    no_data_hint:
      "Upload een FAQ PDF om de kennisbank te vullen.",
    upload_pdf: "PDF uploaden",
    upload_title: "FAQ PDF uploaden",
    upload_description:
      "Upload een FAQ PDF om de kennisbank bij te werken. De vorige data wordt vervangen.",
    upload_drop: "Sleep een PDF-bestand hierheen",
    upload_or: "of",
    upload_browse: "Bladeren",
    upload_processing: "Bezig met verwerken...",
    upload_success: "PDF succesvol verwerkt!",
    upload_error: "Er is een fout opgetreden bij het verwerken van de PDF.",
    upload_replace_warning: "Let op: de huidige data wordt volledig vervangen.",
    articles: "artikelen",
    categories: "categorieën",
    footer_powered: "Support Portal",
    footer_version: "Versie 1.0",
    footer_disclaimer:
      "De informatie is indicatief en kan afwijken van de actuele situatie. Raadpleeg bij twijfel altijd de Operator-portal of de supportdesk.",
    contact_support: "Neem contact op met support",
    close: "Sluiten",
    language: "Taal",
    results_for: "resultaten voor",
    expand_all: "Alles uitklappen",
    collapse_all: "Alles inklappen",
  },
  en: {
    title: "Support Portal",
    hero_title: "How can we help you?",
    hero_subtitle:
      "Search our knowledge base for answers to frequently asked questions about mobile services.",
    search_placeholder: "Search frequently asked questions...",
    all_categories: "All categories",
    no_results: "No results found",
    no_results_hint: "Try a different search term or select another category.",
    no_data: "No FAQ data available",
    no_data_hint:
      "Upload a FAQ PDF to populate the knowledge base.",
    upload_pdf: "Upload PDF",
    upload_title: "Upload FAQ PDF",
    upload_description:
      "Upload a FAQ PDF to update the knowledge base. Previous data will be replaced.",
    upload_drop: "Drop a PDF file here",
    upload_or: "or",
    upload_browse: "Browse",
    upload_processing: "Processing...",
    upload_success: "PDF processed successfully!",
    upload_error: "An error occurred while processing the PDF.",
    upload_replace_warning: "Note: all current data will be replaced.",
    articles: "articles",
    categories: "categories",
    footer_powered: "Support Portal",
    footer_version: "Version 1.0",
    footer_disclaimer:
      "The information is indicative and may differ from the current situation. When in doubt, always consult the Operator portal or the support desk.",
    contact_support: "Contact support",
    close: "Close",
    language: "Language",
    results_for: "results for",
    expand_all: "Expand all",
    collapse_all: "Collapse all",
  },
} as const;

export function t(lang: Language, key: keyof (typeof translations)["nl"]): string {
  return translations[lang][key];
}

export default translations;
