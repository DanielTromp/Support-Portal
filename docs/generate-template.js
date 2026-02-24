const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, PageBreak, LevelFormat,
        Header, Footer, PageNumber, ShadingType } = require('docx');

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 24 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 48, bold: true, color: "1B1F3B", font: "Arial" },
        paragraph: { spacing: { before: 240, after: 200 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, color: "1B1F3B", font: "Arial" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, color: "6C2BD9", font: "Arial" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
    ]
  },
  numbering: {
    config: [{
      reference: "instructions-list",
      levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
    }]
  },
  sections: [{
    properties: {
      page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "Support Portal \u2014 PDF Template", color: "999999", size: 18, font: "Arial" })]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Page ", size: 18, color: "999999" }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "999999" })]
      })] })
    },
    children: [
      // ── PAGE 1: INSTRUCTIONS ──
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("Support Portal")] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
        children: [new TextRun({ text: "PDF Template", size: 36, color: "6C2BD9", font: "Arial" })] }),

      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Instructions")] }),

      new Paragraph({ spacing: { after: 200 },
        children: [new TextRun({ text: "This template is used to configure and populate a white-label support portal. Follow the steps below to set up your branded portal." })] }),

      new Paragraph({ numbering: { reference: "instructions-list", level: 0 }, spacing: { after: 100 },
        children: [new TextRun({ text: "Fill in the Brand Configuration", bold: true }), new TextRun(" section on the next page with your company details (name, colors, logo URL, contact info).")] }),
      new Paragraph({ numbering: { reference: "instructions-list", level: 0 }, spacing: { after: 100 },
        children: [new TextRun({ text: "Add your FAQ content", bold: true }), new TextRun(" using the specified format: category headers wrapped in === markers, questions prefixed with Q:, and answers prefixed with A:.")] }),
      new Paragraph({ numbering: { reference: "instructions-list", level: 0 }, spacing: { after: 100 },
        children: [new TextRun({ text: "Export this document to PDF", bold: true }), new TextRun(" (File \u2192 Save As \u2192 PDF, or File \u2192 Export \u2192 Create PDF).")] }),
      new Paragraph({ numbering: { reference: "instructions-list", level: 0 }, spacing: { after: 100 },
        children: [new TextRun({ text: "Upload the PDF", bold: true }), new TextRun(" to your support portal using the upload button in the header.")] }),
      new Paragraph({ numbering: { reference: "instructions-list", level: 0 }, spacing: { after: 200 },
        children: [new TextRun({ text: "Done!", bold: true }), new TextRun(" The portal will automatically apply your branding and display your FAQ content.")] }),

      new Paragraph({ spacing: { before: 200, after: 200 },
        shading: { fill: "FFF3CD", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "Note: ", bold: true, color: "856404" }), new TextRun({ text: "Do not modify the section headers (BRAND CONFIGURATION, FAQ CONTENT) or the format markers (===, Q:, A:). The parser relies on these exact patterns.", color: "856404" })] }),

      // ── PAGE 2: BRAND CONFIGURATION ──
      new Paragraph({ children: [new PageBreak()] }),

      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 400 },
        children: [new TextRun({ text: "BRAND CONFIGURATION", size: 32, bold: true, color: "1B1F3B", font: "Arial" })] }),

      new Paragraph({ spacing: { after: 100 },
        children: [new TextRun({ text: "Replace the example values below with your company information. Leave fields empty if not applicable.", italics: true, color: "666666" })] }),
      new Paragraph({ spacing: { after: 20 } }),

      new Paragraph({ spacing: { after: 120 },
        children: [new TextRun({ text: "Company Name: ", bold: true }), new TextRun("Your Company Name")] }),
      new Paragraph({ spacing: { after: 120 },
        children: [new TextRun({ text: "Primary Color: ", bold: true }), new TextRun("#6C2BD9")] }),
      new Paragraph({ spacing: { after: 120 },
        children: [new TextRun({ text: "Accent Color: ", bold: true }), new TextRun("#1B1F3B")] }),
      new Paragraph({ spacing: { after: 120 },
        children: [new TextRun({ text: "Logo URL: ", bold: true }), new TextRun("https://example.com/logo.png")] }),
      new Paragraph({ spacing: { after: 120 },
        children: [new TextRun({ text: "Support Email: ", bold: true }), new TextRun("support@example.com")] }),
      new Paragraph({ spacing: { after: 120 },
        children: [new TextRun({ text: "Support Phone: ", bold: true }), new TextRun("+31 20 123 4567")] }),

      new Paragraph({ spacing: { before: 300, after: 200 },
        shading: { fill: "E8F5E9", type: ShadingType.CLEAR },
        children: [new TextRun({ text: "Color format: ", bold: true, color: "2E7D32" }), new TextRun({ text: "Use hex color codes (e.g., #FF6600). Primary Color is used for buttons, links, and accents. Accent Color is used for the header and footer background.", color: "2E7D32" })] }),

      // ── PAGE 3+: FAQ CONTENT ──
      new Paragraph({ children: [new PageBreak()] }),

      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 400 },
        children: [new TextRun({ text: "FAQ CONTENT", size: 32, bold: true, color: "1B1F3B", font: "Arial" })] }),

      new Paragraph({ spacing: { after: 200 },
        children: [new TextRun({ text: "Add your FAQ categories and questions below. Each category is wrapped in === markers. Questions start with Q: and answers start with A:.", italics: true, color: "666666" })] }),

      // Category: Getting Started
      new Paragraph({ spacing: { before: 300, after: 200 },
        children: [new TextRun({ text: "=== Getting Started ===", size: 28, bold: true, color: "6C2BD9" })] }),

      new Paragraph({ spacing: { after: 60 },
        children: [new TextRun({ text: "Q: ", bold: true, color: "1B1F3B" }), new TextRun({ text: "How do I activate my SIM card?", bold: true })] }),
      new Paragraph({ spacing: { after: 200 },
        children: [new TextRun({ text: "A: ", bold: true, color: "6C2BD9" }), new TextRun("Insert the SIM card into your device and follow the on-screen activation wizard. You may need to restart your device after insertion.")] }),

      new Paragraph({ spacing: { after: 60 },
        children: [new TextRun({ text: "Q: ", bold: true, color: "1B1F3B" }), new TextRun({ text: "What are the supported devices?", bold: true })] }),
      new Paragraph({ spacing: { after: 200 },
        children: [new TextRun({ text: "A: ", bold: true, color: "6C2BD9" }), new TextRun("We support all modern smartphones running iOS 14+ or Android 10+. For a full compatibility list, visit our website.")] }),

      // Category: Billing
      new Paragraph({ spacing: { before: 300, after: 200 },
        children: [new TextRun({ text: "=== Billing ===", size: 28, bold: true, color: "6C2BD9" })] }),

      new Paragraph({ spacing: { after: 60 },
        children: [new TextRun({ text: "Q: ", bold: true, color: "1B1F3B" }), new TextRun({ text: "How do I view my invoice?", bold: true })] }),
      new Paragraph({ spacing: { after: 200 },
        children: [new TextRun({ text: "A: ", bold: true, color: "6C2BD9" }), new TextRun("Log in to your account portal and navigate to the Billing section. Your invoices are available for download in PDF format.")] }),

      new Paragraph({ spacing: { after: 60 },
        children: [new TextRun({ text: "Q: ", bold: true, color: "1B1F3B" }), new TextRun({ text: "What payment methods do you accept?", bold: true })] }),
      new Paragraph({ spacing: { after: 200 },
        children: [new TextRun({ text: "A: ", bold: true, color: "6C2BD9" }), new TextRun("We accept credit cards (Visa, Mastercard), direct debit (SEPA), and iDEAL for customers in the Netherlands.")] }),

      // Category: Technical Support
      new Paragraph({ spacing: { before: 300, after: 200 },
        children: [new TextRun({ text: "=== Technical Support ===", size: 28, bold: true, color: "6C2BD9" })] }),

      new Paragraph({ spacing: { after: 60 },
        children: [new TextRun({ text: "Q: ", bold: true, color: "1B1F3B" }), new TextRun({ text: "My internet connection is slow, what should I do?", bold: true })] }),
      new Paragraph({ spacing: { after: 200 },
        children: [new TextRun({ text: "A: ", bold: true, color: "6C2BD9" }), new TextRun("First, check your signal strength. If you have good signal, try toggling airplane mode on and off. If the issue persists, contact our support team.")] }),

      new Paragraph({ spacing: { after: 60 },
        children: [new TextRun({ text: "Q: ", bold: true, color: "1B1F3B" }), new TextRun({ text: "How do I configure voicemail?", bold: true })] }),
      new Paragraph({ spacing: { after: 200 },
        children: [new TextRun({ text: "A: ", bold: true, color: "6C2BD9" }), new TextRun("Dial *86 from your device to access voicemail setup. Follow the voice prompts to record your greeting and set a PIN.")] }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/Users/daniel/Documents/code/support-portal/docs/template.docx", buffer);
  console.log("Template created: docs/template.docx");
});
