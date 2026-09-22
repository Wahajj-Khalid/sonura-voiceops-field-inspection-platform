# Sonura: Autonomous Voice AI Field Inspection and Safety Compliance Platform

Sonura is an enterprise-grade, multi-tenant field operations and safety compliance platform. It empowers field maintenance technicians and industrial safety inspectors to conduct hands-free equipment audits using real-time WebRTC voice conversational agents, local zero-cost vector Retrieval-Augmented Generation (RAG) for technical equipment manuals, multimodal computer vision for structural defect analysis, and automated verifiable single-page compliance certification.

The architecture strictly adheres to Hexagonal Architecture (Ports and Adapters) on the backend and Feature-Driven Vertical Slices on the frontend, enforcing complete data isolation through PostgreSQL Row-Level Security (RLS) across client organizations.

---

## Live Deployment

The application is deployed and can be accessed directly at: [Sonura Platform](https://sonura-voiceops-field-inspection-dn42.onrender.com/)

---

## System Architecture

* **Web Console UI**: Next.js 15+ (App Router, React 19, TypeScript, Tailwind CSS v4)
* **Core API Gateway**: FastAPI (Python 3.12+), Uvicorn, Pydantic v2
* **Voice Agent Worker**: LiveKit Agents Python SDK, Deepgram Nova-2 (STT), Deepgram Aura (TTS), Groq Cloud LLM
* **Vector Knowledge Base**: FastEmbed in-memory local embeddings (`BAAI/bge-small-en-v1.5`, 384 dimensions) with Supabase PGVector cosine similarity RPC
* **Multimodal Defect Triage**: Google Gemini Vision AI via resilient multi-model fallback adapter
* **Transactional Email**: Resend via transactional email port adapter
* **Live Session Testing**: In-memory ephemeral session credential injection for LiveKit and Gemini

---

## Repository Structure

```text
project-root/
├── .env.example                          # Root environment template configuration
├── .gitignore                            # Root version control ignore rules
├── .python-version                       # Python runtime version lock (3.12.9)
├── docker-compose.yml                   # Container orchestration specification
├── backend/
│   ├── .dockerignore                     # Docker build exclusions for backend
│   ├── .python-version                   # Backend Python version lock (3.12.9)
│   ├── Dockerfile                        # Multi-stage Python 3.12 slim container
│   ├── requirements.txt                  # Consolidated Python dependencies
│   ├── migrations/
│   │   └── 001_initial_schema.sql        # Supabase PostgreSQL schema and RPC functions
│   ├── scripts/
│   │   ├── ingest_manual.py              # Technical manual PDF ingestion utility
│   │   └── test_system_e2e.py            # Automated end-to-end integration test suite
│   └── app/
│       ├── adapters/                     # Vendor adapter implementations
│       │   ├── db/
│       │   │   └── supabase_adapter.py   # Supabase database and storage adapter
│       │   ├── email/
│       │   │   └── resend_adapter.py     # Resend transactional email adapter
│       │   ├── rag/
│       │   │   └── vector_rag_adapter.py # FastEmbed in-memory vector RAG adapter
│       │   ├── vision/
│       │   │   └── gemini_vision_adapter.py # Gemini multimodal defect triage adapter
│       │   └── voice/
│       │       └── livekit_adapter.py    # LiveKit WebRTC room token and agent dispatch
│       ├── agent/                        # AI agent workers and risk assessors
│       │   ├── audit_analyzer.py         # Groq LLM autonomous compliance risk scorer
│       │   └── voice_agent.py            # LiveKit real-time voice copilot worker
│       ├── api/
│       │   └── v1/
│       │       ├── endpoints/            # REST API route controllers
│       │       │   ├── audio.py          # Dual-channel audio upload and signed URLs
│       │       │   ├── auth.py           # HS256 JWT login and role claims
│       │       │   ├── contact.py        # Enterprise pilot inquiry submissions
│       │       │   ├── inspections.py    # Field audit telemetry and reviews
│       │       │   ├── notifications.py  # User and role targeted notifications
│       │       │   ├── organizations.py  # Tenant provisioning, live diagnostics, quotas
│       │       │   ├── rag.py            # PDF manual upload and semantic vector querying
│       │       │   ├── sites.py          # Site facilities registration and binding
│       │       │   ├── team.py           # Team roster and member suspension controls
│       │       │   ├── templates.py      # Checklist template protocol builder
│       │       │   ├── vision.py         # Multimodal photo triage controller
│       │       │   └── voice.py          # WebRTC room token provisioning with session hashing
│       │       └── router.py             # Centralized v1 API router
│       ├── core/                         # Core infrastructure configurations
│       │   ├── config.py                 # Pydantic-Settings environment loader with multi-path lookup
│       │   ├── constants.py              # Model names, vector dimensions, plan quotas
│       │   └── security.py               # Password hashing, JWT tokens, prompt sanitization, agent auth
│       ├── domain/                       # Pure domain entities and Pydantic schemas
│       │   ├── common.py                 # Enums for statuses, priority, and roles
│       │   ├── inspection.py             # Inspection items and response models
│       │   ├── models.py                 # Consolidated domain model exports
│       │   ├── notification.py           # Notification domain models
│       │   ├── organization.py           # Organization and telemetry schemas
│       │   ├── site.py                   # Site and facility domain models
│       │   ├── team.py                   # Team member and safety check schemas
│       │   └── template.py               # Checklist template schemas
│       ├── ports/                        # Abstract port interfaces (Hexagonal Pattern)
│       │   ├── db_port.py                # Database and storage abstraction
│       │   ├── email_port.py             # Transactional email abstraction
│       │   ├── rag_port.py               # Vector knowledge base abstraction
│       │   ├── vision_port.py            # Multimodal vision analysis abstraction
│       │   └── voice_port.py             # WebRTC voice agent abstraction
│       └── main.py                       # FastAPI application entrypoint and middleware
└── frontend/
    ├── .dockerignore                     # Docker build exclusions for frontend
    ├── Dockerfile                        # Multi-stage Node 20 Alpine container
    ├── package.json                      # Frontend dependencies and scripts
    ├── postcss.config.mjs                # PostCSS configuration
    ├── tailwind.config.js                # Tailwind CSS configuration
    ├── tsconfig.json                     # TypeScript compiler configuration
    ├── public/
    │   └── icon.svg                      # Custom vector brand asset
    └── src/
        ├── app/                          # Next.js 15 App Router
        │   ├── (auth)/
        │   │   └── login/
        │   │       └── page.tsx          # Login page with demo profile selector
        │   ├── dashboard/
        │   │   └── page.tsx          # Role-aware executive dashboard shell
        │   ├── global-error.tsx          # Root error boundary for runtime isolation
        │   ├── globals.css               # Spatial intelligence glassmorphism styles
        │   ├── layout.tsx                # Root HTML layout and AuthProvider wrapper
        │   └── page.tsx                  # Public landing page and certificate specimen
        ├── components/                   # Flat reusable UI primitives and landing elements
        │   ├── landing/                  # Landing page sections
        │   │   ├── animated-logo.tsx     # Animated vector brand logo
        │   │   ├── capabilities-section.tsx # Core capabilities grid
        │   │   ├── certificate-specimen-card.tsx # Interactive printable specimen card
        │   │   ├── compliance-section.tsx # Regulatory proof workflow
        │   │   ├── contact-section.tsx   # Pilot inquiry contact form
        │   │   ├── data.ts               # Specimen reports and scale options
        │   │   ├── hero-section.tsx      # Platform hero banner and CTA
        │   │   ├── navbar.tsx            # Sticky navigation bar with quick search
        │   │   ├── pricing-section.tsx   # Subscription plan tiers and quotas
        │   │   ├── quicklinks-section.tsx # Centered brand and responsive link columns
        │   │   ├── search-modal.tsx      # Interactive platform search modal
        │   │   └── security-section.tsx  # RLS and cryptographic security highlights
        │   ├── layout/                   # Global application shells
        │   │   ├── app-header.tsx        # Top header with user profile, ephemeral keys, alerts
        │   │   ├── app-sidebar.tsx       # Collapsible role-tailored navigation sidebar
        │   │   ├── dashboard-shell.tsx   # Responsive padding-aware workspace container
        │   │   └── ephemeral-keys-modal.tsx # In-memory live session credentials manager
        │   └── ui/                       # Flat atomic UI primitives
        │       ├── badge.tsx             # Themed status badges
        │       ├── button.tsx            # Interactive button component
        │       ├── card.tsx              # Frosted glassmorphism card container
        │       ├── confirmation-modal.tsx # Action confirmation modal dialog
        │       ├── footer.tsx            # Application footer
        │       ├── input.tsx             # Text, number, and password input
        │       ├── logo.tsx              # Vector logo component
        │       ├── metric-card.tsx       # KPI telemetry metric card
        │       ├── modal.tsx             # Base accessible modal wrapper
        │       ├── select.tsx            # Custom searchable dropdown component
        │       ├── sidebar.tsx           # Base sidebar layout primitive
        │       └── textarea.tsx          # Multi-line text input primitive
        ├── config/                       # Centralized configuration tokens
        │   ├── constants.ts              # Route paths, defaults, and demo accounts
        │   └── theme.ts                  # Color tokens and glassmorphism specifications
        ├── features/                     # Vertical slice feature domains
        │   ├── audits/                   # Audit history, audio player, report modal
        │   │   ├── audio-evidence-player.tsx # WebM duration fallback audio player
        │   │   ├── audit-history.tsx     # Filterable organizational audit archive
        │   │   ├── audit-report-modal.tsx # Single-page printable A4 compliance certificate
        │   │   └── supervisor-triage.tsx # Supervisor triage review queue
        │   ├── auth/                     # Authentication context and route guards
        │   │   ├── auth-context.tsx      # Token persistence and authenticated fetch
        │   │   ├── login-form.tsx        # One-click demo profile login form
        │   │   └── protected-route.tsx   # Client-side RBAC route protection guard
        │   ├── execution/                # Hands-free voice HUD and vision triage
        │   │   ├── audio-orb.tsx         # Interactive pulsating WebRTC microphone orb
        │   │   ├── camera-triage.tsx     # Mobile camera capture and Gemini triage card
        │   │   ├── checklist-tile.tsx    # Responsive non-overflowing checkpoint tile
        │   │   ├── inspector-hud.tsx     # Inspector voice walkthrough HUD console
        │   │   ├── use-voice-session.ts  # Dual-channel audio mixer and LiveKit pipeline
        │   │   └── voice-copilot.tsx     # Spoken dialogue stream and session controls
        │   ├── facilities/               # Facility sites and equipment units
        │   │   ├── site-form-modal.tsx   # Site registration modal with draft auto-save
        │   │   └── site-list.tsx         # Interactive facility grid with delete guards
        │   ├── knowledge/                # Technical equipment manuals and vector test bench
        │   │   ├── manual-list.tsx       # Indexed manual repository and chunk viewer
        │   │   ├── manual-uploader.tsx   # PDF parser and vector embedding ingestion
        │   │   └── vector-test-bench.tsx # Real-time semantic vector search test bench
        │   ├── organization/             # Org admin controls, notifications, settings
        │   │   ├── notification-inbox.tsx # Filtered user and role notification inbox
        │   │   ├── org-overview.tsx      # Workspace overview with quota progress bars
        │   │   ├── settings-panel.tsx    # TTS personality and automation webhooks
        │   │   ├── team-member-modal.tsx # Team invitation modal with draft auto-save
        │   │   └── team-roster.tsx       # Member roster with suspension controls
        │   ├── platform/                 # Super admin commands and system telemetry
        │   │   ├── health-diagnostics.tsx # LiveKit, Groq, Deepgram, and PGVector health
        │   │   ├── platform-overview.tsx # Global cross-tenant analytics and storage
        │   │   ├── tenant-directory.tsx  # Tenant directory with custom quota editing
        │   │   ├── tenant-drilldown.tsx  # Deep drilldown into client tenant data
        │   │   └── tenant-provision-form.tsx # New tenant organization provisioning
        │   └── templates/                # Standardized checklist protocol builder
        │       ├── template-builder-modal.tsx # Dynamic question builder with draft auto-save
        │       └── template-list.tsx     # Workspace checklist template directory
        └── types/
            └── index.ts                  # Shared TypeScript interfaces and union types
```

---

## Technical Features

* **Hands-Free WebRTC Voice Copilot with Dynamic Session Hashing**: Real-time two-way audio streaming using LiveKit Agents, Deepgram Nova-2 speech recognition, Deepgram Aura voice generation, and Groq Cloud LLM for sub-200ms spoken checklist interaction. Room names utilize dynamic session hashing (`inspection-unit-{unit_id}-{session_uuid}`) to ensure instant disconnects and reconnects without lingering room deadlocks.
* **Local In-Memory Vector RAG**: Zero-cost semantic technical manual retrieval powered by FastEmbed (`BAAI/bge-small-en-v1.5`, 384 dimensions) and Supabase PGVector cosine similarity RPC filtering, partitioned strictly by tenant organization.
* **Multimodal Defect Triage**: Integrates Google Gemini Vision AI to detect cracks, corrosion, leaks, clogged filters, and mechanical damage from mobile photos, automatically flagging checklist items and alerting the inspector via voice telemetry.
* **Dual-Channel Audio Evidence Vault**: Captures mixed audio of both the technician microphone and the remote AI assistant, uploading sessions to Supabase Storage with authenticated private 1-hour signed playback URLs.
* **Verifiable Single-Page Compliance Certificates**: Formats completed inspection telemetry, AI safety evaluations, itemized readings, and evidence photos into an audit-ready, single-page A4 compliance certificate with one-click print styling.
* **Encapsulated Database Privacy**: The Voice Agent executes all checklist updates and manual queries exclusively through the secure Backend REST API. External workers do not require direct Supabase credentials.
* **Ephemeral Session Keys (BYOK for Live Testing)**: Evaluators can test live voice calls against their own LiveKit and Gemini instances by clicking the Key icon in the top header. Credentials exist strictly in active browser memory and are permanently wiped on page refresh.
* **Strict Multi-Tenant Row-Level Security**: Isolates data across organizations using PostgreSQL RLS policies, cryptographic HS256 JWT claims, and Pydantic v2 payload sanitization against SQL injection and prompt manipulation.
* **Member Access Suspension Controls**: Super Admins and Organization Admins can suspend or restore individual user accounts with immediate authentication lockout enforcement.

---

## Multi-Tenant Role Matrix

```text
+---------------------------------------------------------------------------------------------------+
| System Role       | Permissions and Accessible Feature Modules                                    |
+-------------------+-------------------------------------------------------------------------------+
| Super Admin       | - Global platform command and cross-tenant analytics telemetry               |
|                   | - Tenant directory with custom quota editing and suspension controls         |
|                   | - Individual user account suspension across any organization                 |
|                   | - New tenant provisioning form                                               |
|                   | - LiveKit, Groq, Deepgram, and PGVector system diagnostics with live pings   |
|                   | - Global audit archive across all client organizations                       |
|                   | - Platform settings (global defaults, model endpoints)                        |
+-------------------+-------------------------------------------------------------------------------+
| Org Admin         | - Organization executive overview with live quota utilization progress bars   |
|                   | - Site and equipment facility registration (enforcing max_sites quota)       |
|                   | - Dynamic checklist template builder (create, edit, delete)                  |
|                   | - Team member roster management and individual member suspension controls    |
|                   | - Technical manuals RAG repository (tenant-scoped)                            |
|                   | - Organization audit archive and single-page certificate inspector           |
|                   | - Workspace notifications and settings (custom webhooks and TTS personality)  |
+-------------------+-------------------------------------------------------------------------------+
| Supervisor        | - Review and triage queue with one-click approve and flag sign-off actions   |
|                   | - Sites overview (read-only equipment statuses)                              |
|                   | - Checklist template creation and editing                                    |
|                   | - Technical manuals RAG repository (tenant-scoped)                            |
|                   | - Organization audit archive and printable certificates                      |
|                   | - Inspection completion alerts and notifications                             |
|                   | - (Restricted from workspace settings and team deletion)                     |
+-------------------+-------------------------------------------------------------------------------+
| Inspector         | - Hands-free voice inspection HUD with LiveKit WebRTC audio channel          |
|                   | - Real-time checkpoint synchronization and inline manual edit overrides       |
|                   | - Mobile camera photo capture and Gemini Vision defect triage                |
|                   | - Dynamic equipment unit selection (defaults to assigned, allows all org)    |
|                   | - On-demand technical manual lookup (voice tool call and reader)             |
|                   | - Targeted notifications (approval and defect feedback)                      |
|                   | - (Restricted from template modification, review sign-off, and settings)     |
+-------------------+-------------------------------------------------------------------------------+
```

---

## Cloud Deployment Architecture and Hybrid Execution

### The 512 MB Free Tier Constraint
Running both the **FastEmbed ONNX Vector Model** (~220 MB RAM) and a **LiveKit WebRTC Voice Worker** (~230 MB RAM) simultaneously inside a single free-tier container (such as Render's 512 MB limit) causes immediate Linux Out-Of-Memory (OOM) kernel termination during active audio handshakes.

### Operational Resolution

1. **Production Cloud Deployment**: The cloud-hosted FastAPI backend runs purely as a high-speed REST API and vector query service (~75 MB RAM), completely eliminating OOM restarts.
2. **Real-Time Voice Streaming Options**:
   * **Option A (Zero-Lag Local Agent Execution)**: The voice agent worker is executed on any local terminal or developer machine via `python -m app.agent.voice_agent dev`. Because LiveKit connects outbound via WebSockets to `wss://sonura-qw29qnzq.livekit.cloud`, the local worker immediately services live WebRTC calls placed from the public Render production frontend.
   * **Option B (Ephemeral Browser Session Keys)**: Users evaluating the live deployment without access to server environment secrets can click the Key icon in the top header and provide their own LiveKit credentials. The frontend requests dynamically signed tokens for their specific LiveKit project on the fly.

---

## Local Setup and Installation

### Prerequisites

* Docker and Docker Compose (or Node.js 20+ and Python 3.12+)
* Active Supabase Project with `vector` extension enabled
* LiveKit Cloud or self-hosted WebRTC instance
* API Keys for Groq, Deepgram, Google Gemini, and Resend

### 1. Clone the Repository

```bash
git clone https://github.com/Wahajj-Khalid/sonura-voiceops-field-inspection-platform.git
cd sonura-voiceops-field-inspection-platform
```

### 2. Configure Environment Variables

Create a root `.env` file from the provided template:

```bash
cp .env.example .env
```

Populate the required credentials in `.env`:

```env
ENVIRONMENT=development
SECRET_KEY=super_secret_key_change_me_32_chars_minimum_length_production
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GROQ_API_KEY=gsk_your_groq_api_key
GEMINI_API_KEY=your-gemini-api-key
LIVEKIT_URL=wss://your-livekit-domain.livekit.cloud
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
DEEPGRAM_API_KEY=your-deepgram-api-key
RESEND_API_KEY=your-resend-api-key
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-domain.livekit.cloud
```

### 3. Apply Database Migrations

Execute the complete schema and RPC definition file `backend/migrations/001_initial_schema.sql` inside the Supabase SQL Editor.

---

## Running the Application

### Option A: Running via Docker Compose (Recommended for Full Stack)

Build and launch all services in detached mode:

```bash
docker compose build
docker compose up -d
```

Check running container resource utilization:

```bash
docker stats --no-stream
```

Access the interfaces:
* Frontend Application: `http://localhost:3000`
* Backend API Documentation: `http://localhost:8000/docs`
* Health Check: `http://localhost:8000/health`

### Option B: Running via Native Commands

#### 1. Start the FastAPI Backend Server

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Start the LiveKit Voice Agent Worker

```bash
cd backend
source venv/bin/activate
python -m app.agent.voice_agent dev
```

#### 3. Start the Next.js Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Automated End-to-End System Testing

The platform includes an automated end-to-end verification script that exercises all endpoints, role authentication tokens, tenant isolation policies, RAG vector searches, and vision triage logic:

```bash
cd backend
python scripts/test_system_e2e.py
```

Or execute directly inside the running Docker container:

```bash
docker compose exec backend python scripts/test_system_e2e.py
```

---

## Pre-Provisioned Demo Credentials

For testing and local verification, the default migration seeds the following role accounts (Password: `sonura2026` for all accounts):

* **Super Admin**: `admin@sonura.ai` (Sonura Global Platform Operations)
* **Org Admin**: `john@titanhvac.com` (Titan HVAC Services Inc.)
* **Supervisor**: `sarah@titanhvac.com` (Titan HVAC Services Inc.)
* **Inspector**: `op1@titanhvac.com` (Titan HVAC Services Inc.)

---

## Architectural Considerations and Operational Guardrails

* **Zero-Deadlock Room Recycling**: Room names embed ephemeral session IDs to guarantee immediate agent worker dispatches on reconnects without waiting for lingering room teardown timers.
* **Resilient Vision Discovery**: The vision adapter queries Google Gemini models using the `x-goog-api-key` header, automatically attempting active model endpoints (`gemini-3.6-flash`, `gemini-flash-latest`, `gemini-3.7-flash`) before dynamic discovery, preventing request timeouts.
* **WebM Duration Reconciliation**: The audio evidence player implements client-side seeking fallbacks to calculate accurate audio durations for WebM streams recorded in Chromium browsers.
* **Modal Draft Persistence**: All creation modals (Site registration, Checklist builder, Team invitations, Tenant provisioning) automatically cache unsaved form drafts in `localStorage` to avoid data loss on accidental backdrop clicks.
* **Responsive Layout Integrity**: Checkpoint responses and telemetry alerts wrap within fluid card containers, with responsive padding offsets (`lg:pl-64` and `lg:pl-20`) preventing sidebar clipping across mobile, tablet, and desktop viewports.