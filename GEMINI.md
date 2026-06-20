# Project Memory

## Tech Stack
- **Runtime**: Bun
- **Backend**: Express 4 + TypeScript
- **Frontend**: React 18 + Vite + TypeScript + TanStack Query v5 + Axios
- **Styling**: Tailwind CSS v4 + shadcn/ui (default theme, base-nova style)
- **Component Testing**: Vitest v4 + React Testing Library + jsdom

## Tools & Context
### Documentation Fetching with Context7
When you need to look up documentation for the libraries used in this project (React, Express, Bun, Vite, etc.), use the **Context7 MCP**.

#### Steps to use Context7:
1. Always start with `resolve-library-id` using the library name and your question.
2. Pick the best match (ID format: `/org/project`) based on exact name match, description relevance, code snippet count, source reputation, and benchmark score.
3. Use `query-docs` with the selected library ID and the full question to fetch the most up-to-date documentation.
4. Use the fetched documentation to write code or answer questions.

*Do not use Context7 for refactoring, writing scripts from scratch, debugging business logic, code review, or general programming concepts.*

### Writing Component Tests
> [!IMPORTANT]
> **Primary Testing Strategy**: Rely mostly on component tests for verifying client-side behavior, page rendering, user interaction, API calls (using mocks), and routing logic. Avoid writing E2E tests for features that can be tested at the component level.

Component tests live in the `client/` directory and use **Vitest** as the test runner and **React Testing Library** for rendering and querying the DOM.

#### Setup & Configuration
- **Vitest config**: [client/vitest.config.ts](file:///media/ays19/Learning2/Claude%20Code%20for%20Professional%20Developers/code/AI%20Helpdesk%20&%20Ticketing%20System/client/vitest.config.ts) — merges Vite config, sets `environment: 'jsdom'`, and points to the setup file.
- **Setup file**: [client/vitest.setup.ts](file:///media/ays19/Learning2/Claude%20Code%20for%20Professional%20Developers/code/AI%20Helpdesk%20&%20Ticketing%20System/client/vitest.setup.ts) — imports `@testing-library/jest-dom` to register custom DOM matchers globally.
- **TypeScript**: `tsconfig.json` includes `"vitest/globals"` and `"@testing-library/jest-dom"` in `types`.

#### File Conventions
- Place test files in a `__tests__/` folder co-located with the component being tested (e.g. `client/src/pages/__tests__/Users.test.tsx`).
- Use the naming convention `<ComponentName>.test.tsx`.

#### Test Render Helper
- Use the shared `renderWithQuery` helper from [client/src/test-utils.tsx](file:///media/ays19/Learning2/Claude%20Code%20for%20Professional%20Developers/code/AI%20Helpdesk%20&%20Ticketing%20System/client/src/test-utils.tsx) instead of manually wrapping components in providers.
- It wraps the component in both `QueryClientProvider` (with `retry: false`) and `MemoryRouter`.
- Import it as: `import { renderWithQuery } from '@/test-utils';`

#### Mocking Patterns
- **Mock `authClient`**: `vi.mock('@/lib/auth-client', () => ({ authClient: { useSession: vi.fn() } }))` — then control its return value per test with `(authClient.useSession as any).mockReturnValue(...)`.
- **Mock `axios`**: `vi.mock('axios')` — then control calls with `(axios.get as any).mockResolvedValue({ data: [...] })` or `.mockRejectedValue(new Error(...))` per test.
- Call `vi.resetAllMocks()` in `beforeEach` to ensure test isolation.

#### Scripts
| Script | Command | When to use |
|---|---|---|
| `bun run test` | `vitest run` | CI / verify all tests pass once |
| `bun run test:watch` | `vitest` | **Writing tests** — reruns on every file save |

### Writing E2E Tests with e2e-test-writer
> [!IMPORTANT]
> **Secondary Testing Strategy**: Use E2E tests only when absolutely necessary (e.g., complex multi-step user workflows spanning backend and frontend that cannot be reliably covered by component tests and mocks, or critical authentication state flows).

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

### Data Validation
- **Library**: Zod.
- **Usage**: All incoming request bodies (POST, PATCH) must be validated using Zod schemas before processing to ensure type safety and data integrity.
- **Shared Validation Schemas**:
  - Validation schemas shared between the client and the server (such as form inputs that match API payloads) are located in the local workspace package `core` (e.g. [core/src/schemas](file:///media/ays19/Learning2/Claude%20Code%20for%20Professional%20Developers/code/AI%20Helpdesk%20&%20Ticketing%20System/core/src/schemas)).
  - To define a new schema:
    1. Create/update a schema file in `core/src/schemas/`.
    2. Export it from `core/src/index.ts`.
    3. Import it using `import { ... } from 'core'` in both the server (`src/`) and the client (`client/src/`).
  - Forms on the client should be built using `react-hook-form` and `@hookform/resolvers/zod` with these shared schemas (e.g. `CreateUserModal` in [Users.tsx](file:///media/ays19/Learning2/Claude%20Code%20for%20Professional%20Developers/code/AI%20Helpdesk%20&%20Ticketing%20System/client/src/pages/Users.tsx)).

### Data Fetching & State Management
- **Axios & TanStack Query**: The client uses Axios as the HTTP client and `@tanstack/react-query` (v5) for managing server state.
  - The application is wrapped with `QueryClientProvider` in [App.tsx](file:///media/ays19/Learning2/Claude%20Code%20for%20Professional%20Developers/code/AI%20Helpdesk%20&%20Ticketing%20System/client/src/App.tsx).
  - Use the `useQuery` hook for retrieving data and `useMutation` hooks for state modification requests (POST, PATCH, DELETE, etc.).
  - Ensure to call `queryClient.invalidateQueries({ queryKey: [...] })` inside mutation success callbacks to trigger automatic cache invalidation and UI updates.

### Ticket Categories
- **Enum**: `TicketCategory` with three values: `general_question`, `technical_question`, `refund_request`.
- **Prisma Schema**: Defined as a native PostgreSQL enum in [schema.prisma](file:///media/ays19/Learning2/Claude%20Code%20for%20Professional%20Developers/code/AI%20Helpdesk%20&%20Ticketing%20System/prisma/schema.prisma). The `Ticket` model has a `category` field defaulting to `general_question`.
- **Shared Validation**: The `TICKET_CATEGORIES` const and the `category` field on both `createTicketSchema` and `updateTicketSchema` are defined in [core/src/schemas/ticket.ts](file:///media/ays19/Learning2/Claude%20Code%20for%20Professional%20Developers/code/AI%20Helpdesk%20&%20Ticketing%20System/core/src/schemas/ticket.ts). Both the server routes ([src/routes/tickets.ts](file:///media/ays19/Learning2/Claude%20Code%20for%20Professional%20Developers/code/AI%20Helpdesk%20&%20Ticketing%20System/src/routes/tickets.ts)) and client form ([CreateTicketModal.tsx](file:///media/ays19/Learning2/Claude%20Code%20for%20Professional%20Developers/code/AI%20Helpdesk%20&%20Ticketing%20System/client/src/components/CreateTicketModal.tsx)) import these shared schemas — **do not duplicate them locally**.
- **TypeScript Types**: `TicketCategory` type alias is defined in both [src/types/index.ts](file:///media/ays19/Learning2/Claude%20Code%20for%20Professional%20Developers/code/AI%20Helpdesk%20&%20Ticketing%20System/src/types/index.ts) (server) and [client/src/types.ts](file:///media/ays19/Learning2/Claude%20Code%20for%20Professional%20Developers/code/AI%20Helpdesk%20&%20Ticketing%20System/client/src/types.ts) (client).
- **Frontend Display**: [TicketCard.tsx](file:///media/ays19/Learning2/Claude%20Code%20for%20Professional%20Developers/code/AI%20Helpdesk%20&%20Ticketing%20System/client/src/components/TicketCard.tsx) renders a color-coded badge per category using `CATEGORY_LABELS` and `CATEGORY_BADGE_CLASSES` maps. Human-readable labels:
  | Enum Value | Display Label |
  |---|---|
  | `general_question` | General Question |
  | `technical_question` | Technical Question |
  | `refund_request` | Refund Request |

## Lessons Learned & Gotchas
- **Ref Forwarding**: Custom UI wrappers (like `Input` inside `client/src/components/ui/input.tsx`) must be wrapped in `React.forwardRef` to allow `react-hook-form` to properly bind their DOM nodes and register input values.
- **CORS & Trusted Origins**: CORS configuration in `src/server.ts` and `trustedOrigins` in `src/auth.ts` must align with the frontend origin (`CLIENT_URL` or `TRUSTED_ORIGINS` in `.env`).
- **Better Auth Role Type Safety on Client**: To read and type custom fields (like `role` via the admin plugin) on the client, you must register the corresponding plugin (e.g. `adminClient()`) in the client's `createAuthClient` call. Otherwise, typescript will not know about the field on `session.user`.
- **jest-dom TypeScript types**: For `toBeInTheDocument()` and other jest-dom matchers to be recognised by `tsc`, both `"vitest/globals"` and `"@testing-library/jest-dom"` must be present in the `types` array in `client/tsconfig.json`. Missing either will cause TS2339 errors during `bun run build`.
- **Role Enum Usage**: Avoid using hardcoded magic strings like `'admin'` or `'agent'` for roles. Always import and use the `UserRole` enum (defined in `client/src/types.ts` for the client and `src/types/index.ts` for the server) to ensure strict type safety across components, page checks, and testing mocks.



