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
