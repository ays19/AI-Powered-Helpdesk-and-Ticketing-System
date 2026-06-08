import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Ticket, CreateTicketBody } from '../types';

export const ticketRouter = Router();

// In-memory store (replace with a database later)
let tickets: Ticket[] = [
  {
    id: '1',
    title: 'Login page not loading',
    description: 'Users report a blank screen when accessing /login',
    status: 'open',
    priority: 'high',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Update billing information',
    description: 'Customer requested a change to their payment method',
    status: 'in-progress',
    priority: 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let nextId = 3;

// GET /api/tickets
ticketRouter.get('/', (_req: Request, res: Response) => {
  res.json(tickets);
});

// GET /api/tickets/:id
ticketRouter.get('/:id', (req: Request, res: Response) => {
  const ticket = tickets.find((t) => t.id === req.params.id);
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }
  res.json(ticket);
});

// POST /api/tickets
ticketRouter.post('/', (req: Request<{}, {}, CreateTicketBody>, res: Response) => {
  const { title, description, priority } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }
  const ticket: Ticket = {
    id: String(nextId++),
    title,
    description: description ?? '',
    status: 'open',
    priority: priority ?? 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tickets.push(ticket);
  res.status(201).json(ticket);
});

// PATCH /api/tickets/:id
ticketRouter.patch('/:id', (req: Request, res: Response) => {
  const idx = tickets.findIndex((t) => t.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }
  tickets[idx] = {
    ...tickets[idx]!,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  res.json(tickets[idx]);
});

// DELETE /api/tickets/:id
ticketRouter.delete('/:id', (req: Request, res: Response) => {
  const idx = tickets.findIndex((t) => t.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }
  const [deleted] = tickets.splice(idx, 1);
  res.json(deleted);
});
