import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkAccess } from '@/lib/rbac';
import { getDb } from '@/lib/db';
import PDFDocument from 'pdfkit';

export const dynamic = 'force-dynamic';

function buildPdf(title: string, dataRenderer: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(24).font('Helvetica-Bold').text(title, { align: 'center' }).moveDown(1);
    
    dataRenderer(doc);
    
    doc.end();
  });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/import-export')) {
    return new Response('Forbidden', { status: 403 });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get('format') || 'json';
  
  const db = getDb();
  const categories = db.prepare('SELECT id, name, slug FROM faq_categories').all() as any[];
  const items = db.prepare(`
    SELECT f.id, f.question, f.aliases, f.answer, f.is_enabled, c.slug as category
    FROM faqs f
    LEFT JOIN faq_categories c ON f.category_id = c.id
  `).all() as any[];

  const exportData = {
    categories,
    items
  };

  if (format === 'json') {
    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="faq-export.json"'
      }
    });
  }

  if (format === 'pdf') {
    const pdfBuffer = await buildPdf('Frequently Asked Questions Export', (doc) => {
      categories.forEach(cat => {
        doc.fontSize(18).font('Helvetica-Bold').text(cat.name).moveDown(0.5);
        const catItems = items.filter(i => i.category === cat.slug);
        
        if (catItems.length === 0) {
           doc.fontSize(10).font('Helvetica-Oblique').fillColor('#666666').text('(No FAQs currently)').moveDown(1);
        }

        catItems.forEach(item => {
           doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000').text(`Q: ${item.question}`);
           if (item.aliases) {
              doc.fontSize(10).font('Helvetica-Oblique').fillColor('#666666').text(`Aliases: ${item.aliases}`);
           }
           doc.fontSize(11).font('Helvetica').fillColor('#333333').text(item.answer).moveDown(1);
        });
        doc.moveDown(1);
      });

      const uncategorizedItems = items.filter(i => !i.category);
      if (uncategorizedItems.length > 0) {
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#000000').text('Uncategorized').moveDown(0.5);
        uncategorizedItems.forEach(item => {
           doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000').text(`Q: ${item.question}`);
           if (item.aliases) {
              doc.fontSize(10).font('Helvetica-Oblique').fillColor('#666666').text(`Aliases: ${item.aliases}`);
           }
           doc.fontSize(11).font('Helvetica').fillColor('#333333').text(item.answer).moveDown(1);
        });
        doc.moveDown(1);
      }
    });

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="faq-export.pdf"'
      }
    });
  }

  return new Response('Invalid format', { status: 400 });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/import-export')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const data = await req.json();
  if (!data.categories || !data.items) {
    return NextResponse.json({ error: 'Invalid FAQ JSON format' }, { status: 400 });
  }

  const db = getDb();
  
  db.transaction(() => {
    // We will clear existing and optionally replace everything
    db.exec('DELETE FROM faqs');
    db.exec('DELETE FROM faq_categories');

    const insertCat = db.prepare('INSERT INTO faq_categories (name, slug) VALUES (?, ?)');
    for (const cat of data.categories) {
       insertCat.run(cat.name, cat.slug);
    }

    const insertFaq = db.prepare(
      'INSERT INTO faqs (category_id, question, aliases, answer, is_enabled) VALUES ((SELECT id FROM faq_categories WHERE slug = ?), ?, ?, ?, ?)'
    );

    for (const item of data.items) {
       insertFaq.run(
         item.category || null,
         item.question || '',
         item.aliases || '',
         item.answer || '',
         item.is_enabled === undefined ? 1 : item.is_enabled
       );
    }
  })();

  return NextResponse.json({ ok: true, message: 'FAQ Import complete' });
}
