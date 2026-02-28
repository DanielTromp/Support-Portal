import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const DATA_PATH = path.join(process.cwd(), 'data', 'faq.json');
const DB_PATH = path.join(process.cwd(), 'data', 'support-portal.db');

function migrate() {
  if (!fs.existsSync(DATA_PATH)) {
    console.log('No faq.json found. Skipping migration.');
    return;
  }

  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  let faqData;
  try {
    faqData = JSON.parse(raw);
  } catch {
    console.error('Failed to parse faq.json');
    return;
  }

  const db = new Database(DB_PATH);
  
  const existingFaqs = db.prepare('SELECT COUNT(*) as count FROM faqs').get() as { count: number };
  if (existingFaqs.count > 0) {
    console.log('FAQs already exist in DB. Skipping migration to avoid duplicates.');
    return;
  }

  const categories = faqData.categories || [];
  const items = faqData.items || [];

  const catMap = new Map<string, number>();

  db.transaction(() => {
    // Insert categories
    const insertCat = db.prepare('INSERT INTO faq_categories (name, slug) VALUES (?, ?)');
    for (const cat of categories) {
      const slug = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      try {
        const result = insertCat.run(cat, slug);
        catMap.set(cat, result.lastInsertRowid as number);
      } catch (e) {
        // Might exist
        const existing = db.prepare('SELECT id FROM faq_categories WHERE name = ?').get(cat) as { id: number };
        if (existing) {
          catMap.set(cat, existing.id);
        }
      }
    }

    // Insert items
    const insertFaq = db.prepare('INSERT INTO faqs (category_id, question, answer, is_enabled) VALUES (?, ?, ?, 1)');
    for (const item of items) {
       const catId = catMap.get(item.category) || null;
       insertFaq.run(catId, item.question, item.answer);
    }
  })();

  console.log(`Successfully migrated ${items.length} FAQs and ${categories.length} categories.`);
}

migrate();
