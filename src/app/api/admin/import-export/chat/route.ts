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
  const sessions = db.prepare('SELECT id, user_id, title, started_at, language FROM chat_sessions ORDER BY started_at DESC').all() as any[];
  const messages = db.prepare('SELECT session_id, role, content, tokens_in, tokens_out, cost, model, created_at FROM chat_messages ORDER BY created_at ASC').all() as any[];

  // Group messages by session
  for (const s of sessions) {
      s.messages = messages.filter(m => m.session_id === s.id).map(m => {
          // Remove session_id to clean up
          const copy = { ...m };
          delete copy.session_id;
          return copy;
      });
  }

  const exportData = {
    sessions
  };

  if (format === 'json') {
    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="chat-history-export.json"'
      }
    });
  }

  if (format === 'pdf') {
    const pdfBuffer = await buildPdf('Chat History Export', (doc) => {
      sessions.forEach((sess, idx) => {
        if (idx !== 0) {
           doc.addPage();
        }
        
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000').text(`Session: ${sess.title || sess.id}`).moveDown(0.2);
        doc.fontSize(10).font('Helvetica').fillColor('#666666').text(`Started: ${sess.started_at} | Language: ${sess.language}`).moveDown(1);

        sess.messages.forEach((msg: any) => {
           let roleLabel = '';
           let color = '';
           if (msg.role === 'user') {
               roleLabel = 'USER'; color = '#0056b3';
           } else if (msg.role === 'assistant') {
               roleLabel = 'AI ASSISTANT'; color = '#10b981';
           } else {
               roleLabel = 'SYSTEM'; color = '#888888';
           }

           doc.fontSize(10).font('Helvetica-Bold').fillColor(color).text(`${roleLabel} (${msg.created_at})`).moveDown(0.2);
           doc.fontSize(11).font('Helvetica').fillColor('#333333').text(msg.content).moveDown(1);
        });
      });
    });

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="chat-history-export.pdf"'
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
  if (!data.sessions || !Array.isArray(data.sessions)) {
    return NextResponse.json({ error: 'Invalid Chat History JSON format' }, { status: 400 });
  }

  const db = getDb();
  
  db.transaction(() => {
    // We append or recreate entirely? The user didn't specify, but for chat history, completely wiping it 
    // might be highly destructive, so we will use INSERT OR IGNORE since IDs are UUIDs. 
    const insertSession = db.prepare('INSERT OR IGNORE INTO chat_sessions (id, user_id, title, started_at, language) VALUES (?, ?, ?, ?, ?)');
    const insertMessage = db.prepare('INSERT OR IGNORE INTO chat_messages (session_id, role, content, tokens_in, tokens_out, cost, model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

    for (const sess of data.sessions) {
       insertSession.run(sess.id, sess.user_id, sess.title, sess.started_at, sess.language);
       if (sess.messages && Array.isArray(sess.messages)) {
           for (const msg of sess.messages) {
               insertMessage.run(
                   sess.id, 
                   msg.role, 
                   msg.content, 
                   msg.tokens_in || 0, 
                   msg.tokens_out || 0, 
                   msg.cost || 0,
                   msg.model || null,
                   msg.created_at
               );
           }
       }
    }
  })();

  return NextResponse.json({ ok: true, message: 'Chat History Import complete' });
}
