# Tech Stack

## Runtime
- **Bun** — package manager, test runner, and script runner

## Frontend
- React 18 + TypeScript
- Vite (dev server + build)
- Tailwind CSS v4 + shadcn/ui (base-nova style)
- TanStack Query v5 (server state)
- Axios (HTTP client)
- React Hook Form + `@hookform/resolvers/zod`
- React Router v6

## Backend
- Express 4 + TypeScript
- Better Auth (email/password, admin plugin, `disableSignUp`)
- Helmet, express-rate-limit (security)

## Database
- PostgreSQL
- Prisma ORM (v7, config via `prisma.config.ts`)
- Soft-delete pattern via `deletedAt` field

## Shared (`core/` package)
- Zod validation schemas shared between client and server
- `UserRole` enum — single source of truth

## AI
- Vercel AI SDK (`ai` + `@ai-sdk/google`)
- Google Gemini 2.0 Flash — ticket classification, summaries, suggested replies

## Testing
- **Component**: Vitest v4 + React Testing Library + jsdom
- **E2E**: Playwright