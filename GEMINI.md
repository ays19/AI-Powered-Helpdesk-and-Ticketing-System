# Project Memory

## Tech Stack
- **Runtime**: Bun
- **Backend**: Express 4 + TypeScript
- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui (default theme, base-nova style)

## Tools & Context
### Documentation Fetching with Context7
When you need to look up documentation for the libraries used in this project (React, Express, Bun, Vite, etc.), use the **Context7 MCP**.

#### Steps to use Context7:
1. Always start with `resolve-library-id` using the library name and your question.
2. Pick the best match (ID format: `/org/project`) based on exact name match, description relevance, code snippet count, source reputation, and benchmark score.
3. Use `query-docs` with the selected library ID and the full question to fetch the most up-to-date documentation.
4. Use the fetched documentation to write code or answer questions.

*Do not use Context7 for refactoring, writing scripts from scratch, debugging business logic, code review, or general programming concepts.*

### Writing E2E Tests with e2e-test-writer
When asked to write, run, or troubleshoot end-to-end tests for the Helpdesk & Ticketing System, use the **e2e-test-writer** skill:
1. Read the instructions in the [e2e-test-writer SKILL.md](file:///media/ays19/Learning2/Claude%20Code%20for%20Professional%20Developers/code/AI%20Helpdesk%20&%20Ticketing%20System/.agents/skills/e2e-test-writer/SKILL.md) to understand test structure, database reset/setup workflows, page URLs, credentials, and Playwright locators/matchers.
2. Put E2E spec files in the `/e2e` directory with the naming format `*.spec.ts`.
3. Use the integrated scripts (`test:db:setup`, `test:e2e`, etc.) to setup testing conditions and run the test suite.


## Project Context
### Database
- **Provider**: PostgreSQL via Prisma ORM.
- **Client Output**: Custom location at `src/lib/prisma/client` (configured in [schema.prisma](file:///media/ays19/Learning2/Claude%20Code%20for%20Professional%20Developers/code/AI%20Helpdesk%20&%20Ticketing%20System/prisma/schema.prisma)).

### Authentication
- **Framework**: `better-auth` integration for both frontend and backend.
- **Configuration** ([src/auth.ts](file:///media/ays19/Learning2/Claude%20Code%20for%20Professional%20Developers/code/AI%20Helpdesk%20&%20Ticketing%20System/src/auth.ts)):
  - **Email & Password**: Enabled.
  - **Registration Restriction**: `disableSignUp: true` is configured to prevent arbitrary registrations.
  - **Admin Plugin**: Configured with `defaultRole: UserRole.AGENT`.
  - **Role Enum**: `admin` and `agent` (defined in [types/index.ts](file:///media/ays19/Learning2/Claude%20Code%20for%20Professional%20Developers/code/AI%20Helpdesk%20&%20Ticketing%20System/src/types/index.ts)).
- **Database Seeding**: Because public signup is disabled, the seeding script ([seed.ts](file:///media/ays19/Learning2/Claude%20Code%20for%20Professional%20Developers/code/AI%20Helpdesk%20&%20Ticketing%20System/prisma/src/seed.ts)) uses `auth.api.createUser()` on the backend, which bypasses registration restrictions and handles hashing/account creation correctly.
- **Frontend Integration**:
  - Auth Client helper defined in [auth-client.ts](file:///media/ays19/Learning2/Claude%20Code%20for%20Professional%20Developers/code/AI%20Helpdesk%20&%20Ticketing%20System/client/src/lib/auth-client.ts). Uses `adminClient` plugin to support client-side role definitions.
  - Uses `authClient.useSession()` for checking login state and user metadata.
  - Form submission targets `authClient.signIn.email({ email, password })`.

### Pages & Routing
- **Admin Users Page**: A page located at `/users` ([client/src/pages/Users.tsx](file:///media/ays19/Learning2/Claude%20Code%20for%20Professional%20Developers/code/AI%20Helpdesk%20&%20Ticketing%20System/client/src/pages/Users.tsx)) with a simple "Users" heading:
  - Accessible only to administrators (`session.user.role === UserRole.ADMIN`).
  - Automatically redirects unauthenticated users to `/login`.
  - Displays a clean "Access Denied" view for authenticated users who are not administrators.
  - Added navigation links in [App.tsx](file:///media/ays19/Learning2/Claude%20Code%20for%20Professional%20Developers/code/AI%20Helpdesk%20&%20Ticketing%20System/client/src/App.tsx) that conditionally render the `/users` link for administrators.

### Rate Limiting
- **Configuration**: Standard `express-rate-limit` middleware on auth and standard routes.
- **Environment Behavior**: Configured with a `skip` callback (`skip: () => process.env.NODE_ENV !== 'production'`) so rate limits are only enforced in the production environment.

## Lessons Learned & Gotchas
- **Ref Forwarding**: Custom UI wrappers (like `Input` inside `client/src/components/ui/input.tsx`) must be wrapped in `React.forwardRef` to allow `react-hook-form` to properly bind their DOM nodes and register input values.
- **CORS & Trusted Origins**: CORS configuration in `src/server.ts` and `trustedOrigins` in `src/auth.ts` must align with the frontend origin (`CLIENT_URL` or `TRUSTED_ORIGINS` in `.env`).
- **Better Auth Role Type Safety on Client**: To read and type custom fields (like `role` via the admin plugin) on the client, you must register the corresponding plugin (e.g. `adminClient()`) in the client's `createAuthClient` call. Otherwise, typescript will not know about the field on `session.user`.



gister the corresponding plugin (e.g. `adminClient()`) in the client's `createAuthClient` call. Otherwise, typescript will not know about the field on `session.user`.



