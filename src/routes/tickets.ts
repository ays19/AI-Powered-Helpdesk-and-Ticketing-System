import { Router } from 'express';
import type { Response } from 'express';
import { db as prisma } from '../db';
import type { CreateTicketBody } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/async-handler';

export const ticketRouter = Router();

// GET /api/tickets
ticketRouter.get('/', asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.json(tickets);
}));

// GET /api/tickets/:id
ticketRouter.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.id },
  });
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }
  res.json(ticket);
}));

// POST /api/tickets
ticketRouter.post('/', asyncHandler(async (req: AuthenticatedRequest<{}, {}, CreateTicketBody>, res: Response) => {
  const { title, description, priority } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }
  
  const ticket = await prisma.ticket.create({
    data: {
      title,
      description: description || '',
      priority: priority || 'medium',
      status: 'open',
    },
  });
  res.status(201).json(ticket);
}));

// PATCH /api/tickets/:id
ticketRouter.patch('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const ticket = await prisma.ticket.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(ticket);
}));

// DELETE /api/tickets/:id
ticketRouter.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const deleted = await prisma.ticket.delete({
    where: { id: req.params.id },
  });
  res.json(deleted);
}));
