import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { FaqData } from "@/types";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const DATA_PATH = path.join(process.cwd(), "data", "faq.json");

export async function GET() {
  try {
    let brand = null;
    let uploadedAt = null;
    let fileName = null;

    if (fs.existsSync(DATA_PATH)) {
      try {
        const raw = fs.readFileSync(DATA_PATH, "utf-8");
        const data = JSON.parse(raw);
        brand = data.brand || null;
        uploadedAt = data.uploadedAt || null;
        fileName = data.fileName || null;
      } catch (err) {
        console.error("Error reading faq.json for brand:", err);
      }
    }

    const db = getDb();
    
    // Fetch categories
    const categoriesRows = db.prepare('SELECT name FROM faq_categories ORDER BY name').all() as { name: string }[];
    const categories = categoriesRows.map(c => c.name);

    // Fetch enabled FAQs
    const faqsRows = db.prepare(`
      SELECT f.id, f.question, f.answer, f.aliases, c.name as category
      FROM faqs f
      LEFT JOIN faq_categories c ON f.category_id = c.id
      WHERE f.is_enabled = 1
      ORDER BY f.id DESC
    `).all() as any[];

    const items = faqsRows.map(row => {
      // If there are aliases, we might append them to the question string so Fuse.js finds them,
      // or map them to a separate field. The frontend expects `{id, question, answer, category}`. 
      // We can pass aliases inside the `question` or as a property.
      // Let's pass the exact FaqItem interface.
      return {
        id: String(row.id),
        question: row.question,
        answer: row.answer,
        category: row.category || "Uncategorized",
        aliases: row.aliases
      };
    });

    const responseData: FaqData & { items: any[] } = {
      categories,
      items,
      uploadedAt,
      fileName,
      brand,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("API /faq error:", error);
    return NextResponse.json(
      { error: "Failed to read FAQ data" },
      { status: 500 }
    );
  }
}
