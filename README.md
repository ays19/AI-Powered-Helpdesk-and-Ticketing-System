# AI Helpdesk & Ticketing System

A full-stack AI-powered helpdesk and ticketing system built with **Express**, **React**, **TypeScript**, and **Bun**.

## Tech Stack

| Layer       | Technology                                              |
|-------------|--------------------------------------------------------|
| Runtime     | Bun                                                    |
| Backend     | Express 4 + TypeScript                                 |
| Frontend    | React 18 + Vite + TypeScript + TanStack Query v5 + Axios |
| Styling     | Tailwind CSS v4 + shadcn/ui                            |
| Auth        | Better Auth (email/password, admin plugin)             |
| Database    | PostgreSQL via Prisma ORM                              |
| AI          | Vercel AI SDK + Google Gemini 2.0 Flash                |
| Validation  | Zod (shared schemas in `core/`)                        |
| Testing     | Vitest + React Testing Library (component) · Playwright (E2E) |

## Monorepo Structure

```
.
├── src/          # Express backend
├── client/       # React frontend (Vite)
├── core/         # Shared TypeScript types, Zod schemas, enums
├── prisma/       # Prisma schema, migrations, seed script
├── scripts/      # Dev utility scripts (reset-admin, etc.)
└── e2e/          # Playwright end-to-end tests
```

## Getting Started

### 1. Environment Setup

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

| Variable                  | Description                                      |
|---------------------------|--------------------------------------------------|
| `DATABASE_URL`            | PostgreSQL connection string                     |
| `BETTER_AUTH_SECRET`      | Session signing secret (any long random string)  |
| `BETTER_AUTH_URL`         | Server URL (`http://localhost:4000` in dev)      |
| `CLIENT_URL`              | Frontend URL (`http://localhost:5173` in dev)    |
| `TRUSTED_ORIGINS`         | Same as `CLIENT_URL`                             |
| `SEED_ADMIN_EMAIL`        | Email for the seeded admin account               |
| `SEED_ADMIN_PASSWORD`     | Password for the seeded admin account            |
| `WEBHOOK_SECRET`          | Secret for validating inbound email webhooks     |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key for AI features            |

### 2. Install & Run

```bash
# Install all dependencies (root + client)
bun install
cd client && bun install && cd ..

# Set up the database
bunx prisma migrate dev

# Seed the admin account
bunx prisma db seed

# Start both server and client in development
bun run dev:all
```

- **API server**: http://localhost:4000
- **Client dev server**: http://localhost:5173

## API Endpoints

### Auth
| Method | Endpoint            | Description                     |
|--------|---------------------|---------------------------------|
| POST   | /api/auth/sign-in/email | Sign in with email/password |
| POST   | /api/auth/sign-out      | Sign out                    |
| GET    | /api/auth/get-session   | Get current session         |

### Tickets
| Method | Endpoint            | Description          |
|--------|---------------------|----------------------|
| GET    | /api/health         | Health check         |
| GET    | /api/tickets        | List all tickets     |
| GET    | /api/tickets/:id    | Get a single ticket  |
| POST   | /api/tickets        | Create a new ticket  |
| PATCH  | /api/tickets/:id    | Update a ticket      |
| DELETE | /api/tickets/:id    | Delete a ticket      |

### Users (Admin only)
| Method | Endpoint         | Description           |
|--------|------------------|-----------------------|
| GET    | /api/users       | List all users        |
| POST   | /api/users       | Create a new agent    |
| PUT    | /api/users/:id   | Update a user         |
| DELETE | /api/users/:id   | Soft-delete a user    |

### Webhooks
| Method | Endpoint               | Description                                   |
|--------|------------------------|-----------------------------------------------|
| POST   | /api/webhooks/email    | Create ticket from inbound email (secret-gated) |

## Production Build

```bash
bun run build:client   # Build the React client
bun run start          # Start Express (serves built client)
```

## Testing

```bash
# Component tests (Vitest + React Testing Library)
cd client && bun run test

# E2E tests (Playwright) — requires both servers running
bun run test:e2e
```
