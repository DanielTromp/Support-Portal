# Support Portal

White-label FAQ knowledge base. Deploy an empty container, upload a branded PDF, and the portal is ready. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **White-Label Branding** -- Company name, colors, logo, and contact info from a single PDF upload
- **PDF Template Workflow** -- Fill in a Word template, export to PDF, upload to portal
- **Fuzzy Search** -- Fuse.js-powered search with result highlighting
- **Dynamic Categories** -- Category icons auto-detected by keyword heuristic
- **Bilingual** -- Dutch (default) / English toggle
- **Backward Compatible** -- Legacy bullet-format PDFs still work (auto-detected)
- **Containerized** -- Multi-stage Docker build, ~150MB image, starts empty

## How It Works

```
Deploy container → Fill in Word template → Export to PDF → Upload → Portal is branded and ready
```

1. Start the container (see Quick Start below)
2. Open the Word template at `docs/template.docx`
3. Fill in the **BRAND CONFIGURATION** section (company name, colors, logo URL, contact info)
4. Add your FAQ content in the **FAQ CONTENT** section using `=== Category ===`, `Q:`, and `A:` markers
5. Export to PDF
6. Upload the PDF via the portal's upload button
7. The portal applies your branding and displays your FAQ content

## Quick Start

### Docker (recommended)

```bash
docker compose up -d --build
```

Open [http://localhost:3000](http://localhost:3000) -- the portal starts empty and prompts for a PDF upload.

### Local Development

```bash
npm install
npm run dev
```

## PDF Template Format

The parser auto-detects two formats:

### New template format (recommended)

```
BRAND CONFIGURATION

Company Name: Acme Corp
Primary Color: #FF6600
Accent Color: #1B2340
Logo URL: https://example.com/logo.png
Support Email: support@acme.com
Support Phone: +31 20 123 4567

FAQ CONTENT

=== Getting Started ===

Q: How do I activate my SIM card?
A: Insert the SIM card and follow the on-screen wizard.

=== Billing ===

Q: How do I view my invoice?
A: Log in to your account portal and navigate to Billing.
```

### Legacy format (backward compatible)

Bullet-based format (■/•/n prefix) with hardcoded Dutch category headers. Parsed as fallback when no new-format markers are detected. Brand stays at default.

## Project Structure

```
src/
  app/
    api/faq/route.ts        # GET  /api/faq
    api/upload/route.ts      # POST /api/upload
    page.tsx                 # Main page with theme application
    globals.css              # CSS variables, Tailwind base
  components/
    Header.tsx               # Brand-aware nav bar
    HeroSearch.tsx            # Hero section with search
    CategoryFilter.tsx        # Keyword-heuristic category icons
    FaqList.tsx               # Grouped FAQ display
    FaqCard.tsx               # Expandable accordion card
    UploadModal.tsx           # Drag-and-drop PDF upload
    Footer.tsx                # Brand-aware footer
  lib/
    i18n.ts                  # NL/EN translations
    parse-pdf.ts             # Dual-format PDF parser
    brand-theme.ts           # Color derivation (hex→RGB, lighten/darken)
  types/
    index.ts                 # FaqItem, FaqData, BrandConfig, Language
docs/
  template.docx              # Word template for partners
  generate-template.js       # Script to regenerate the template
data/                        # Runtime FAQ data (created by uploads, gitignored)
```

## Production Deployment

The portal runs behind Traefik. For external access through Cloudflare:

```bash
cp .env.example .env
# Set CLOUDFLARED_TOKEN in .env

podman-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

FAQ data is stored in `data/faq.json` and persisted via Docker volume mount.

## Tech Stack

| Component   | Technology                    |
|-------------|-------------------------------|
| Framework   | Next.js 14 (App Router)       |
| Language    | TypeScript                    |
| Styling     | Tailwind CSS + CSS Variables  |
| Search      | Fuse.js (fuzzy client-side)   |
| PDF Parsing | pdf-parse                     |
| Icons       | Lucide React                  |
| Container   | Node 22 Alpine (multi-stage)  |
