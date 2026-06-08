# Helpdesk & Ticketing System

A full-stack helpdesk and ticketing system built with **Express**, **React**, **TypeScript**, and **Bun**.

## Tech Stack

| Layer    | Technology             |
| -------- | ---------------------- |
| Runtime  | Bun                    |
| Server   | Express 4 + TypeScript |
| Client   | React 18 + Vite + TypeScript |
| Styling  | Vanilla CSS            |

## Getting Started

```bash
# Install server dependencies
bun install

# Install client dependencies
cd client && bun install && cd ..

# Run both server and client in development
bun run dev:all
```

- **API server**: http://localhost:4000
- **Client dev server**: http://localhost:5173

## API Endpoints

| Method | Endpoint            | Description          |
| ------ | ------------------- | -------------------- |
| GET    | /api/health         | Health check         |
| GET    | /api/tickets        | List all tickets     |
| GET    | /api/tickets/:id    | Get a single ticket  |
| POST   | /api/tickets        | Create a new ticket  |
| PATCH  | /api/tickets/:id    | Update a ticket      |
| DELETE | /api/tickets/:id    | Delete a ticket      |

## Production Build

```bash
bun run build:client   # Build the React client
bun run start          # Start Express (serves built client)
```
