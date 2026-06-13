import { Router } from 'express';
import type { Response } from 'express';
import { db as prisma } from '../db';
import type { CreateTicketBody } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/async-handler';
import { z } from 'zod';

const CreateTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

const UpdateTicketSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['open', 'in-progress', 'resolved', 'closed']).optional(),
});

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
  const validatedData = CreateTicketSchema.parse(req.body);
  
  const ticket = await prisma.ticket.create({
    data: {
      ...validatedData,
      description: validatedData.description || '',
      status: 'open',
    },
  });
  res.status(201).json(ticket);
}));

// PATCH /api/tickets/:id
ticketRouter.patch('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validatedData = UpdateTicketSchema.parse(req.body);
  
  const ticket = await prisma.ticket.update({
    where: { id: req.params.id },
    data: validatedData,
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
