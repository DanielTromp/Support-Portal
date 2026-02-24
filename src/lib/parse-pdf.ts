import { FaqItem, FaqData, BrandConfig } from "@/types";

// ── New template format markers ──────────────────────────────────────────────
const BRAND_SECTION_MARKER = /^BRAND\s+CONFIGURATION$/i;
const FAQ_SECTION_MARKER = /^FAQ\s+CONTENT$/i;
const CATEGORY_HEADER = /^===\s*(.+?)\s*===$/;
const QUESTION_LINE = /^Q:\s*(.+)/;
const ANSWER_LINE = /^A:\s*(.+)/;

function isNewFormat(text: string): boolean {
  return (
    BRAND_SECTION_MARKER.test(text.split("\n").map(l => l.trim()).find(l => BRAND_SECTION_MARKER.test(l)) || "") ||
    /^BRAND\s+CONFIGURATION$/im.test(text) ||
    /^FAQ\s+CONTENT$/im.test(text) ||
    /^===\s*.+\s*===$/m.test(text) ||
    /^Q:\s*.+/m.test(text)
  );
}

// ── Brand config parser ──────────────────────────────────────────────────────
function parseBrandConfig(lines: string[]): BrandConfig | null {
  const fieldMap: Record<string, keyof BrandConfig> = {
    "company name": "companyName",
    "primary color": "primaryColor",
    "accent color": "accentColor",
    "logo url": "logoUrl",
    "support email": "supportEmail",
    "support phone": "supportPhone",
  };

  const config: Partial<BrandConfig> = {};

  for (const line of lines) {
    const match = line.match(/^(.+?):\s*(.+)$/);
    if (!match) continue;
    const key = match[1].trim().toLowerCase();
    const value = match[2].trim();
    const field = fieldMap[key];
    if (field) {
      config[field] = value;
    }
  }

  // Must have at least a company name to count as brand config
  if (!config.companyName) return null;

  return {
    companyName: config.companyName,
    primaryColor: config.primaryColor || "",
    accentColor: config.accentColor || "",
    logoUrl: config.logoUrl || "",
    supportEmail: config.supportEmail || "",
    supportPhone: config.supportPhone || "",
  };
}

// ── New template format parser ───────────────────────────────────────────────
function parseNewFormat(text: string, fileName: string): FaqData {
  const lines = text.split("\n").map((l) => l.trim());
  const items: FaqItem[] = [];
  const categoriesSet = new Set<string>();
  let brand: BrandConfig | null = null;

  let section: "none" | "brand" | "faq" = "none";
  let brandLines: string[] = [];
  let currentCategory = "General";
  let currentQuestion = "";
  let currentAnswer: string[] = [];
  let itemCounter = 0;

  function flushItem() {
    if (currentQuestion && currentAnswer.length > 0) {
      itemCounter++;
      const catSlug = currentCategory.toLowerCase().replace(/[^a-z0-9]/g, "-");
      items.push({
        id: `${catSlug}-${itemCounter}`,
        question: currentQuestion,
        answer: currentAnswer.join(" ").trim(),
        category: currentCategory,
      });
    }
    currentQuestion = "";
    currentAnswer = [];
  }

  for (const line of lines) {
    if (!line) continue;

    // Section detection
    if (BRAND_SECTION_MARKER.test(line)) {
      section = "brand";
      continue;
    }
    if (FAQ_SECTION_MARKER.test(line)) {
      // Finalize brand section
      if (brandLines.length > 0) {
        brand = parseBrandConfig(brandLines);
      }
      section = "faq";
      continue;
    }

    if (section === "brand") {
      brandLines.push(line);
      continue;
    }

    if (section === "faq" || section === "none") {
      // Category header
      const catMatch = line.match(CATEGORY_HEADER);
      if (catMatch) {
        flushItem();
        currentCategory = catMatch[1].trim();
        categoriesSet.add(currentCategory);
        continue;
      }

      // Question
      const qMatch = line.match(QUESTION_LINE);
      if (qMatch) {
        flushItem();
        currentQuestion = qMatch[1].trim();
        categoriesSet.add(currentCategory);
        continue;
      }

      // Answer start
      const aMatch = line.match(ANSWER_LINE);
      if (aMatch) {
        currentAnswer.push(aMatch[1].trim());
        continue;
      }

      // Continuation line (part of current answer or multi-line question)
      if (currentAnswer.length > 0) {
        currentAnswer.push(line);
      } else if (currentQuestion) {
        // Multi-line question before any answer line
        currentQuestion += " " + line;
      }
    }
  }

  // Flush remaining
  flushItem();

  // If brand lines were collected but FAQ section marker was never hit
  if (!brand && brandLines.length > 0) {
    brand = parseBrandConfig(brandLines);
  }

  return {
    categories: Array.from(categoriesSet),
    items,
    uploadedAt: new Date().toISOString(),
    fileName,
    brand,
  };
}

// ── Legacy format parser (bullet-based: ■/•/n prefix) ───────────────────────
const KNOWN_CATEGORIES = [
  "DATA",
  "DEKKING",
  "SIM-KAARTEN",
  "VoLTE",
  "VOICE – NEDERLAND",
  "VOICE – ROAMING",
  "VOICE - NEDERLAND",
  "VOICE - ROAMING",
  "VOICEMAIL",
  "SMS",
  "OVERIG",
];

function normalizeCategoryName(raw: string): string {
  const normalized = raw.toUpperCase().replace(/\s*[–-]\s*/g, " – ");
  const map: Record<string, string> = {
    DATA: "Data",
    DEKKING: "Dekking",
    "SIM-KAARTEN": "SIM-kaarten",
    VOLTE: "VoLTE",
    "VOICE – NEDERLAND": "Voice – Nederland",
    "VOICE – ROAMING": "Voice – Roaming",
    VOICEMAIL: "Voicemail",
    SMS: "SMS",
    OVERIG: "Overig",
  };
  return map[normalized] || raw;
}

function parseLegacyFormat(text: string, fileName: string): FaqData {
  const lines = text.split("\n").map((l) => l.trim());
  const items: FaqItem[] = [];
  const categoriesSet = new Set<string>();
  let currentCategory = "Overig";
  let currentQuestion = "";
  let currentAnswer: string[] = [];
  let itemCounter = 0;

  function flushItem() {
    if (currentQuestion && currentAnswer.length > 0) {
      itemCounter++;
      const catSlug = currentCategory.toLowerCase().replace(/[^a-z0-9]/g, "-");
      items.push({
        id: `${catSlug}-${itemCounter}`,
        question: currentQuestion,
        answer: currentAnswer.join(" ").trim(),
        category: currentCategory,
      });
    }
    currentQuestion = "";
    currentAnswer = [];
  }

  for (const line of lines) {
    if (!line) continue;

    // Check if line is a category header
    const upperLine = line.toUpperCase().replace(/\s+/g, " ").replace(/\s*[–-]\s*/g, " – ");
    const matchedCategory = KNOWN_CATEGORIES.find((cat) => {
      const normalizedCat = cat.toUpperCase().replace(/\s*[–-]\s*/g, " – ");
      return upperLine === normalizedCat;
    });

    if (matchedCategory) {
      flushItem();
      currentCategory = normalizeCategoryName(matchedCategory);
      categoriesSet.add(currentCategory);
      continue;
    }

    // Skip table of contents bullet points
    if (line.startsWith("•") || line.startsWith("Inhoudsopgave")) continue;

    // Check if line starts with a question marker
    const questionMatch = line.match(/^[■▪●•]\s*(.+)/) || line.match(/^n\s+(.+\?)\s*$/);
    if (questionMatch) {
      flushItem();
      currentQuestion = questionMatch[1].trim();
      categoriesSet.add(currentCategory);
      continue;
    }

    // Detect multi-line questions
    const bulletMatch = line.match(/^n\s+(.+)/);
    if (bulletMatch && !currentQuestion && categoriesSet.size > 0) {
      flushItem();
      currentQuestion = bulletMatch[1].trim();
      categoriesSet.add(currentCategory);
      continue;
    }

    // If the current question doesn't end with ?, this line may continue the question
    if (currentQuestion && !currentQuestion.endsWith("?") && currentAnswer.length === 0) {
      currentQuestion += " " + line;
      continue;
    }

    // If we have a current question, this line is part of the answer
    if (currentQuestion) {
      currentAnswer.push(line);
    }
  }

  flushItem();

  return {
    categories: Array.from(categoriesSet),
    items,
    uploadedAt: new Date().toISOString(),
    fileName,
    brand: null,
  };
}

// ── Public API ───────────────────────────────────────────────────────────────
export function parseFaqText(text: string, fileName: string): FaqData {
  if (isNewFormat(text)) {
    return parseNewFormat(text, fileName);
  }
  return parseLegacyFormat(text, fileName);
}
