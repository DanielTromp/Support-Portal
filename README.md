# Support Portal

White-label FAQ knowledge base with admin panel, AI chat, and user management. Deploy a container, upload a branded PDF, and the portal is ready. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **White-Label Branding** -- Company name, colors, logo, and contact info from a single PDF upload
- **PDF Template Workflow** -- Fill in a Word template, export to PDF, upload to portal
- **Authentication** -- NextAuth v5 with credentials login, JWT sessions, role-based access (admin/user)
- **Admin Panel** -- Dashboard, user management, chat config, chat history, activity logs, usage stats, system logs
- **AI Chat** -- OpenRouter integration (configurable model/provider), conversation history, token tracking
- **Fuzzy Search** -- Fuse.js-powered search with result highlighting
- **Dynamic Categories** -- Category icons auto-detected by keyword heuristic
- **Bilingual** -- Dutch (default) / English toggle
- **Activity Tracking** -- Page views, searches, and user actions logged to SQLite
- **Backward Compatible** -- Legacy bullet-format PDFs still work (auto-detected)
- **Containerized** -- Multi-stage Docker build, starts empty

## How It Works

```
Deploy container → Seed DB → Log in → Upload branded PDF → Portal is ready
```

1. Start the container (see Quick Start below)
2. Run `npm run seed` to create default users
3. Log in as admin (default: `admin` / `admin123`)
4. Configure AI chat in Admin > Chat Config (optional, requires OpenRouter API key)
5. Open the Word template at `docs/template.docx`
6. Fill in the **BRAND CONFIGURATION** section (company name, colors, logo URL, contact info)
7. Add your FAQ content in the **FAQ CONTENT** section using `=== Category ===`, `Q:`, and `A:` markers
8. Export to PDF and upload via the portal's upload button
9. The portal applies your branding and displays your FAQ content

## Quick Start

### Docker (recommended)

```bash
cp .env.example .env
# Fill in NEXTAUTH_SECRET and ENCRYPTION_KEY (see .env.example for generation commands)

docker compose up -d --build
docker compose exec support-portal npx tsx scripts/seed.ts
```

Open [http://localhost:3000](http://localhost:3000).

### Local Development

```bash
cp .env.example .env.local
# Fill in NEXTAUTH_SECRET and ENCRYPTION_KEY

npm install
npm run seed
npm run dev
```

### Default Users

| Username | Password   | Role  |
|----------|------------|-------|
| admin    | admin123   | Admin |
| user     | user123    | User  |

Change these immediately via Admin > Users after first login.

## Admin Panel

Accessible at `/admin` for admin users. Includes:

- **Dashboard** -- Summary cards, recent activity, recent errors
- **Users** -- Create, edit, delete users and assign roles
- **Chat Config** -- OpenRouter API key, model selection, system prompt, max tokens
- **Chat History** -- Browse all chat sessions and messages
- **Activity** -- Paginated activity log with action filters
- **Usage** -- Token usage totals, per-user breakdown, per-day stats
- **Uploads** -- Current FAQ data status
- **System Logs** -- Paginated logs with level filter

## AI Chat

The chat panel uses OpenRouter to connect to any supported LLM. Configure in Admin > Chat Config:

1. Add your OpenRouter API key
2. Choose a model (default: `google/gemini-2.5-flash`)
3. Customize the system prompt
4. Set max tokens per response

Chat responses render full markdown (headings, lists, code blocks, links).

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

Bullet-based format with hardcoded Dutch category headers. Parsed as fallback when no new-format markers are detected. Brand stays at default.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXTAUTH_SECRET` | Yes | Random secret for JWT signing (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | No | Base URL, defaults to `http://localhost:3000` |
| `ENCRYPTION_KEY` | Yes | 64-char hex string for AES-256-GCM config encryption (`openssl rand -hex 32`) |

## Project Structure

```
src/
  app/
    api/
      auth/[...nextauth]/   # NextAuth handlers
      faq/                   # GET /api/faq
      upload/                # POST /api/upload
      chat/                  # POST /api/chat (OpenRouter)
      activity/              # POST /api/activity
      admin/
        users/               # CRUD /api/admin/users
        config/              # GET/PUT /api/admin/config
        chat-sessions/       # GET /api/admin/chat-sessions
        activity/            # GET /api/admin/activity
        logs/                # GET /api/admin/logs
        usage/               # GET /api/admin/usage
    auth/login/              # Login page
    admin/                   # Admin panel (8 pages)
    page.tsx                 # Main portal page
  components/
    Header.tsx               # Nav bar with user menu
    HeroSearch.tsx           # Hero section with search
    CategoryFilter.tsx       # Category icons
    FaqList.tsx              # Grouped FAQ display
    FaqCard.tsx              # Expandable accordion card
    ChatPanel.tsx            # AI chat slide-out panel
    UploadModal.tsx          # Drag-and-drop PDF upload
    Footer.tsx               # Brand-aware footer
    SessionProvider.tsx      # NextAuth session wrapper
    admin/
      AdminSidebar.tsx       # Admin navigation sidebar
  lib/
    auth.ts                  # NextAuth config (full, Node.js)
    auth.config.ts           # NextAuth config (Edge-safe)
    db.ts                    # SQLite singleton + schema
    version.ts               # App + schema version constants
    migrations.ts            # Migration runner + definitions
    crypto.ts                # AES-256-GCM encrypt/decrypt
    logger.ts                # System + activity logging
    openrouter.ts            # OpenRouter API client
    i18n.ts                  # NL/EN translations
    parse-pdf.ts             # Dual-format PDF parser
    brand-theme.ts           # Color derivation
  types/
    index.ts                 # All TypeScript interfaces
    next-auth.d.ts           # NextAuth type augmentation
scripts/
  seed.ts                    # Create default users
  migrate.ts                 # Standalone migration runner
docs/
  template.docx              # Word template for partners
data/                        # Runtime data (SQLite DB + FAQ JSON, gitignored)
```

## Versioning & Migrations

The app tracks both application version and database schema version.

### Version Check

```
GET /api/version
```

Returns:

```json
{ "app": "2.0.0", "schema": 2, "schemaApplied": 2, "upToDate": true }
```

| Field | Description |
|-------|-------------|
| `app` | Application version (semver, from `package.json`) |
| `schema` | Schema version the code expects |
| `schemaApplied` | Schema version currently in the database |
| `upToDate` | `true` if `schemaApplied >= schema` |

### How Migrations Work

Migrations run **automatically on app startup** (first database access). They also run via:

```bash
# Inside container
npm run migrate

# Local development
npx tsx scripts/migrate.ts
```

Each migration is tracked in the `schema_version` table. Already-applied migrations are skipped. All migrations are idempotent.

### Migration History

| Version | Name | Description |
|---------|------|-------------|
| 1 | `add_faq_tables` | Creates `faq_categories` and `faqs` tables |
| 2 | `add_roles_and_rbac` | Creates `roles` table (admin/user/trainer defaults), removes CHECK constraint from `users.role` |

### Upgrading from main/chat branch to trainer branch

If you have a running container built from the `main` or `chat` branch:

1. **Rebuild** the container from the `trainer` branch:
   ```bash
   docker compose up -d --build
   ```
2. Migrations run automatically on first request. No manual steps needed.
3. Verify with `GET /api/version` — `schemaApplied` should be `2`.

To run migrations manually before the first request:

```bash
docker compose exec support-portal npm run migrate
```

### Adding New Migrations

Add a new entry to the `migrations` array in `src/lib/migrations.ts`:

```typescript
{
  version: 3,
  name: 'describe_what_changed',
  up: (db) => {
    db.exec(`ALTER TABLE ...`);
  },
},
```

Then bump `SCHEMA_VERSION` in `src/lib/version.ts` and `version` in `package.json`.

## Production Deployment

```bash
cp .env.example .env
# Fill in NEXTAUTH_SECRET, ENCRYPTION_KEY, and optionally CLOUDFLARED_TOKEN

# Basic
docker compose up -d --build

# With Cloudflare tunnel
podman-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Data is stored in `data/` (SQLite DB + FAQ JSON) and persisted via Docker volume mount.

## Tech Stack

| Component   | Technology                          |
|-------------|-------------------------------------|
| Framework   | Next.js 14 (App Router)             |
| Language    | TypeScript                          |
| Styling     | Tailwind CSS + CSS Variables        |
| Auth        | NextAuth v5 (Credentials, JWT)      |
| Database    | SQLite (better-sqlite3)             |
| AI Chat     | OpenRouter (any LLM)                |
| Search      | Fuse.js (fuzzy client-side)         |
| PDF Parsing | pdf-parse                           |
| Markdown    | react-markdown + @tailwindcss/typography |
| Icons       | Lucide React                        |
| Container   | Node 22 Alpine (multi-stage)        |
