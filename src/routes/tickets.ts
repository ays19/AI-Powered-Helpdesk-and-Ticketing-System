import { Router } from 'express';
import type { Response } from 'express';
import { db as prisma } from '../db';
import type { CreateTicketBody } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/async-handler';
import { createTicketSchema, updateTicketSchema } from 'core';
import { TicketStatus } from '../lib/prisma/client';

function mapTicket(ticket: any) {
  if (!ticket) return ticket;
  return {
    ...ticket,
    status: ticket.status === 'in_progress' ? 'in-progress' : ticket.status,
  };
}

export const ticketRouter = Router();

// GET /api/tickets
ticketRouter.get('/', asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.json(tickets.map(mapTicket));
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
  res.json(mapTicket(ticket));
}));

// POST /api/tickets
ticketRouter.post('/', asyncHandler(async (req: AuthenticatedRequest<{}, {}, CreateTicketBody>, res: Response) => {
  const validatedData = createTicketSchema.parse(req.body);
  
  const ticket = await prisma.ticket.create({
    data: {
      ...validatedData,
      description: validatedData.description || '',
      status: TicketStatus.open,
    },
  });
  res.status(201).json(mapTicket(ticket));
}));

// PATCH /api/tickets/:id
ticketRouter.patch('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validatedData = updateTicketSchema.parse(req.body);
  
  const updateData: any = { ...validatedData };
  if (updateData.status === 'in-progress') {
    updateData.status = 'in_progress';
  }

  const ticket = await prisma.ticket.update({
    where: { id: req.params.id },
    data: updateData,
  });
  res.json(mapTicket(ticket));
}));

// DELETE /api/tickets/:id
ticketRouter.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const deleted = await prisma.ticket.delete({
    where: { id: req.params.id },
  });
  res.json(mapTicket(deleted));
}));
