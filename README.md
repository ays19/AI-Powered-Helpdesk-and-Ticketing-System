# AI Helpdesk & Ticketing System

> A production-deployed, full-stack AI helpdesk that classifies, resolves, and replies to support tickets autonomously — before a human ever sees them.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Railway-brightgreen)](https://ai-powered-helpdesk-and-ticketing-system.up.railway.app)
[![Tests](https://img.shields.io/badge/Tests-145%20passing-blue)](#testing)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

**Track:** Kaggle AI Agents Intensive Capstone — Agents for Business (Google × Kaggle 2026)

🌐 **Live Demo:** https://ai-powered-helpdesk-and-ticketing-system.up.railway.app  
📄 **Kaggle Writeup:** https://www.kaggle.com/competitions/vibecoding-agents-capstone-project/writeups/new-writeup-1783086059176  
🎬 **Demo Video:** https://www.youtube.com/watch?v=rSMxxQLQCcU&t=32s

> **Demo credentials**
> Email: `admin@example.com` · Password: `password123`

---

## Table of Contents

- [Overview](#overview)
- [Agent Architecture](#agent-architecture)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [AI Development Workflow](#ai-development-workflow)

---

## Overview

Every growing software business hits the same wall: a support inbox that grows faster than the team can handle it. Agents spend most of their time on repetitive, predictable tickets — password resets, billing questions, access issues — questions that have clear, documented answers.

**The core insight:** most support tickets should never reach a human agent at all.

The AI Helpdesk & Ticketing System uses a **three-agent pipeline** to handle the entire ticket lifecycle autonomously:

1. A customer sends an email or submits a ticket via the web UI
2. **Agent 1** classifies it (General / Technical / Refund)
3. **Agent 2** reads the knowledge base and resolves it if possible — sending the reply email automatically
4. If it cannot resolve it, the ticket is escalated to a human agent with the classification already done

For tickets that reach a human, **Agent 3** can polish their draft reply into professional, empathetic language before it is sent.

---

## Agent Architecture

```
Inbound Email / Web Form
         │
         ▼
┌─────────────────────┐
│   Ticket Creation   │  status: new
└────────┬────────────┘
         │  PgBoss queues job: ticket-classification
         ▼
┌─────────────────────────────────────────────┐
│   Agent 1 — Classification Worker           │
│                                             │
│  • Reads ticket title + description         │
│  • Calls Groq (llama-3.1-8b-instant)        │
│  • Returns one of:                          │
│    general_question | technical_question    │
│    | refund_request                         │
│  • Updates ticket category                  │
│  • Transitions status: new → open           │
└────────┬────────────────────────────────────┘
         │  PgBoss queues job: ticket-auto-resolve
         ▼
┌─────────────────────────────────────────────┐
│   Agent 2 — Auto-Resolve Worker             │
│                                             │
│  • Reads full knowledge-base.md             │
│  • Calls Groq with ticket + KB context      │
│  • Binary contract:                         │
│    ├── Complete reply → isAiResolved=true   │
│    │   → PgBoss queues: send-email          │
│    │   → Customer receives resolution email │
│    └── CANNOT_RESOLVE → stays open          │
│        for human agent                      │
└─────────────────────────────────────────────┘
         │  (on-demand, human-triggered)
         ▼
┌─────────────────────────────────────────────┐
│   Agent 3 — Polish Reply (On-Demand)        │
│                                             │
│  • Human agent drafts a reply               │
│  • Clicks "Polish"                          │
│  • Groq rewrites in professional tone       │
│  • Agent reviews and sends                  │
└─────────────────────────────────────────────┘
```

**Why a queue-based pipeline?**

Using PgBoss (a PostgreSQL-backed job queue) rather than a simple `await` chain gives the agent pipeline:

- **Fault tolerance** — if an LLM call fails, PgBoss retries the job automatically
- **No blocking** — ticket creation returns immediately; AI processing is asynchronous
- **Idempotency** — row-level locking (`SELECT ... FOR UPDATE`) prevents duplicate AI replies on retried jobs
- **Visibility** — jobs are persisted in the database, making failures inspectable

---

## Key Features

### AI Features
| Feature | Description |
|---|---|
| Auto-classification | Classifies every ticket into one of three categories using Groq |
| Auto-resolution | Resolves tickets from a knowledge base, sends reply email automatically |
| Polish Reply | Rewrites human draft replies into professional, empathetic language |
| Ticket Summarization | One-click LLM summary of any ticket's full conversation thread |
| Inbound email → ticket | Converts inbound customer emails into tickets via Resend webhook |
| Outbound email | Sends AI-generated and agent replies to customers via Resend |

### Ticket Management
| Feature | Description |
|---|---|
| Search | Real-time keyword search across all tickets |
| Status filter | One-click filter: All / Open / In-Progress / Resolved / Closed |
| Priority indicators | 🟢 Low · 🟡 Medium · 🟠 High · 🔴 Critical |
| Category badges | AI-assigned category visible on every ticket card |
| Newest-first ordering | Enforced server-side, consistent at any scale |
| Light / dark mode | Full theme toggle — Obsidian Jade dark theme + clean light theme |

### Admin & Security
| Feature | Description |
|---|---|
| Role-based access control | Admin and Agent roles; sign-up disabled by design |
| User management | Admin provisions all agent accounts |
| Analytics dashboard | Total tickets, AI resolution rate, avg resolution time, traffic chart |
| Sentry error tracking | Full stack traces and source maps in production |
| XSS prevention | Three layers: Helmet CSP + React 18 escaping + Zod input validation |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Bun |
| Backend | Express 4 + TypeScript |
| Frontend | React 18 + Vite + TanStack Query v5 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth | Better Auth (email/password, admin plugin) |
| Database | PostgreSQL + Prisma ORM v7 |
| AI | Vercel AI SDK + Groq (`llama-3.1-8b-instant`) |
| Job Queue | PgBoss (PostgreSQL-backed async queue) |
| Email | Resend (transactional + inbound webhooks) |
| Validation | Zod (shared schemas in `core/`) |
| Error Monitoring | Sentry (Node + React) |
| Testing | Vitest + React Testing Library + Playwright (E2E) |
| Deployment | Railway + Docker |
| AI Coding Agent | Antigravity CLI |

---

## Project Structure

```
.
├── src/                        # Express backend
│   ├── server.ts               # App entry point, middleware, route registration
│   ├── auth.ts                 # Better Auth configuration
│   ├── lib/
│   │   ├── queue.ts            # PgBoss workers — classification, auto-resolve, send-email
│   │   ├── ai.ts               # Groq LLM calls (classify, resolve, polish, summarize)
│   │   └── email.ts            # Resend outbound email helpers
│   └── routes/                 # Express route handlers
│       ├── tickets.ts
│       ├── users.ts
│       ├── replies.ts
│       ├── dashboard.ts
│       └── webhooks.ts
│
├── client/                     # React frontend (Vite)
│   └── src/
│       ├── components/         # shadcn/ui + custom components
│       ├── pages/              # Route-level page components
│       ├── lib/
│       │   ├── auth-client.ts  # Better Auth client
│       │   └── api.ts          # Axios instance + API helpers
│       └── main.tsx
│
├── core/                       # Shared TypeScript types + Zod schemas
│   └── src/schemas/            # ticket.ts, user.ts, reply.ts
│
├── prisma/
│   ├── schema.prisma           # Data model
│   ├── migrations/             # Migration history
│   └── src/seed.ts             # Seeds admin + AI agent user
│
├── e2e/                        # Playwright end-to-end tests
│   ├── auth.spec.ts
│   ├── tickets.spec.ts
│   ├── ticket-details.spec.ts
│   ├── users.spec.ts
│   └── webhooks.spec.ts
│
├── scripts/
│   ├── reset-admin.ts          # Deletes and re-seeds the admin user
│   └── seed-100-tickets.ts     # Seeds demo ticket data
│
├── src/knowledge-base.md       # The AI agent's knowledge source (support policies)
├── AGENTS.md                   # AI coding agent rules and project context
├── Dockerfile
└── .env.example
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.2+
- PostgreSQL 14+ (local or cloud)
- [Groq API key](https://console.groq.com/) (free tier available)
- [Resend API key](https://resend.com/) (for email features)
- [Sentry](https://sentry.io/) DSN (optional — for error monitoring)

### 1. Clone the repository

```bash
git clone https://github.com/ays19/HELPDESK.git
cd HELPDESK
```

### 2. Install dependencies

```bash
bun install
```

This installs dependencies for the root, `client/`, and `core/` workspaces in one command.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the required values. See [Environment Variables](#environment-variables) for the full reference.

### 4. Set up the database

```bash
# Run all migrations
bunx prisma migrate dev

# Seed the admin user and AI agent user
bun run db:seed
```

The seed script creates two accounts using the credentials from your `.env`:
- **Admin:** `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
- **AI Agent:** `ai@example.com` (internal use only)

### 5. Start the development servers

```bash
bun run dev:all
```

| Service | URL |
|---|---|
| Express API | http://localhost:4000 |
| React frontend | http://localhost:5173 |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values below.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | ✅ | Session signing secret — any random string, min 32 chars |
| `BETTER_AUTH_URL` | ✅ | Backend URL — `http://localhost:4000` in dev |
| `TRUSTED_ORIGINS` | ✅ | Frontend URL for CORS — `http://localhost:5173` in dev |
| `SEED_ADMIN_EMAIL` | ✅ | Email for the seeded admin account |
| `SEED_ADMIN_PASSWORD` | ✅ | Password for the seeded admin account |
| `GROQ_API_KEY` | ✅ | Groq API key — [console.groq.com](https://console.groq.com/) |
| `RESEND_API_KEY` | ✅ | Resend API key — [resend.com](https://resend.com/) |
| `WEBHOOK_SECRET` | ✅ | Secret for validating inbound email webhooks (Resend → Svix) |
| `SENTRY_DSN` | ⬜ | Sentry DSN for backend error tracking |
| `VITE_SENTRY_DSN` | ⬜ | Sentry DSN for frontend error tracking |
| `SENTRY_AUTH_TOKEN` | ⬜ | Sentry auth token for source map uploads |
| `SENTRY_ORG` | ⬜ | Sentry organisation slug |
| `SENTRY_PROJECT` | ⬜ | Sentry project slug |

> **Note:** For E2E tests, create a separate `.env.test` file pointing to a test database (e.g. `helpdesk_test`). The test suite resets and re-seeds this database before every run.

---

## Development

```bash
# Both servers (recommended)
bun run dev:all

# Backend only (Express on port 4000)
bun run dev

# Frontend only (Vite on port 5173)
bun run dev:client

# Type check (no emit)
bun run typecheck

# Reset and re-seed the admin user
bun run scripts/reset-admin.ts

# Seed 100 demo tickets for a realistic dashboard
bun run scripts/seed-100-tickets.ts
```

---

## Testing

The project has **145 tests across 20 files**.

### Unit + Component Tests — Vitest + React Testing Library (118 tests)

```bash
cd client && bun run test
```

Covers 9 component files (TicketCard, ReplyForm, CreateTicketModal, UserModal, UserTable, LoginForm, ThemeToggle, TicketDetail, DeleteUserModal) and 6 page files (TicketDetails × 3, TicketsList, Users, Home).

### E2E Tests — Playwright (27 tests)

> E2E tests require a separate `.env.test` file and a running test database.

```bash
# Headless
bun run test:e2e

# Interactive UI mode (recommended for development)
bun run test:e2e:ui

# Debug mode
bun run test:e2e:debug
```

The `test:e2e` command automatically:
1. Resets the test database
2. Runs all Prisma migrations
3. Seeds the test admin user
4. Runs all 27 Playwright specs

Covers: authentication flows, ticket creation and persistence, ticket status updates, user management (CRUD), and inbound email webhook processing.

---

## Deployment

### Railway (recommended)

The project is deployed on Railway. On every deploy, the `start` command runs automatically:

```bash
bunx prisma migrate deploy   # runs pending migrations
bun run db:seed              # creates admin if not exists (idempotent)
bun run src/server.ts        # starts the Express server
```

Set all environment variables from the [Environment Variables](#environment-variables) section in your Railway project settings.

### Docker

```bash
# Build the image
docker build -t helpdesk .

# Run with environment variables
docker run -p 4000:4000 \
  -e DATABASE_URL="postgresql://..." \
  -e BETTER_AUTH_SECRET="..." \
  -e BETTER_AUTH_URL="..." \
  -e TRUSTED_ORIGINS="..." \
  -e GROQ_API_KEY="..." \
  -e RESEND_API_KEY="..." \
  -e WEBHOOK_SECRET="..." \
  -e SEED_ADMIN_EMAIL="admin@example.com" \
  -e SEED_ADMIN_PASSWORD="your-password" \
  helpdesk
```

The Docker image:
- Installs all dependencies with `bun install --frozen-lockfile`
- Generates the Prisma client
- Builds the React frontend (`client/dist/`)
- Exposes port 4000
- On start: runs migrations → seeds → starts server

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/sign-in/email` | Sign in with email + password |
| POST | `/api/auth/sign-out` | Sign out |
| GET | `/api/auth/get-session` | Get current session |

### Tickets
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/tickets` | Agent | List all tickets (supports status filter + search) |
| GET | `/api/tickets/:id` | Agent | Get single ticket with replies |
| POST | `/api/tickets` | Agent | Create a new ticket |
| PATCH | `/api/tickets/:id` | Agent | Update ticket (status, priority, assignee) |
| DELETE | `/api/tickets/:id` | Admin | Soft-delete a ticket |
| POST | `/api/tickets/:id/summarize` | Agent | Generate AI summary |

### Replies
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/tickets/:id/replies` | Agent | Send a reply (triggers outbound email) |
| POST | `/api/tickets/:id/replies/polish` | Agent | Polish a draft reply via AI |

### Users (Admin only)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users` | Admin | List all users |
| POST | `/api/users` | Admin | Create a new agent account |
| PUT | `/api/users/:id` | Admin | Update a user |
| DELETE | `/api/users/:id` | Admin | Soft-delete a user |

### Dashboard
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard/stats` | Admin | Ticket stats (total, open, AI resolved, avg time) |
| GET | `/api/dashboard/traffic` | Admin | Daily ticket traffic for chart |

### Webhooks
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/webhooks/email` | Svix signature | Inbound email → ticket creation |

---

## AI Development Workflow

This project was built with [Antigravity CLI](https://antigravity.dev) as the primary AI coding agent.

### AGENTS.md

`AGENTS.md` is the project memory file — it contains the full tech stack, environment variable reference, testing rules, architectural decisions, and all context an AI coding agent needs to work correctly in this codebase. Every new session, the agent reads this file first.

### Planning Documents

| File | Purpose |
|---|---|
| `AGENTS.md` | AI agent rules, stack reference, testing constraints |
| `project-scope.md` | Goals, non-goals, and system boundaries |
| `implementation-plan.md` | Phased build order and dependencies |
| `tech-stack.md` | Technology choices and rationale |

### Custom Agent Skills

The `.agents/skills/` directory contains four reusable instruction sets:

| Skill | Purpose |
|---|---|
| `better-auth-best-practices/` | Authentication patterns and session handling rules |
| `e2e-test-writer/` | Playwright test writing conventions for this codebase |
| `frontend-design/` | UI component and styling constraints |
| `security-reviewer/` | Security checklist — enforced Helmet, Zod, and XSS rules |

### Knowledge Base

`src/knowledge-base.md` is the auto-resolve agent's only source of truth. It contains official support policies (password reset, refund policy, certificate questions, etc.). The agent is explicitly instructed not to answer from outside this file — if it can't find a clear answer, it returns `CANNOT_RESOLVE` and escalates to a human agent.

---

## License


**Kaggle Writeup:** Released under the [Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/) license.

---

## Citation

If you reference this project, please cite it as:

```
AHSAN YASIR SHARAR. HELPDESK: AI Agents That Resolve Support Tickets Before a Human Sees Them.
https://www.kaggle.com/competitions/vibecoding-agents-capstone-project/writeups/new-writeup-1783086059176
2026. Kaggle.
```

---

*Built with Bun · Express · React · PostgreSQL · Prisma · PgBoss · Groq · Resend · Sentry · Deployed on Railway*
