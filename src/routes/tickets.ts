import { Router } from 'express';
import type { Response } from 'express';
import { db as prisma } from '../db';
import type { CreateTicketBody } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/async-handler';
import { createTicketSchema, updateTicketSchema } from 'core';
import { TicketStatus } from '../lib/prisma/client';
import { mapTicket, toDbStatus } from '../lib/ticket-mapper';

export const ticketRouter = Router();

// GET /api/tickets
ticketRouter.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { sortBy, sortOrder } = req.query;
  const validSortFields = ['id', 'title', 'status', 'priority', 'category', 'createdAt', 'updatedAt'];
  const field = validSortFields.includes(sortBy as string) ? (sortBy as string) : 'createdAt';
  const order = sortOrder === 'asc' ? 'asc' : 'desc';

  const tickets = await prisma.ticket.findMany({
    orderBy: { [field]: order },
    include: { user: true, assignedTo: true }
  });
  res.json(tickets.map(mapTicket));
}));

// GET /api/tickets/:id
ticketRouter.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.id },
    include: { user: true, assignedTo: true }
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
  const { assigned_to, ...rest } = validatedData;

  if (assigned_to) {
    const userExists = await prisma.user.findUnique({
      where: { id: assigned_to, deletedAt: null }
    });
    if (!userExists) {
      res.status(400).json({ error: 'Assigned user does not exist' });
      return;
    }
  }
  
  const ticket = await prisma.ticket.create({
    data: {
      ...rest,
      assignedToId: assigned_to || null,
      description: rest.description || '',
      status: TicketStatus.open,
      userId: req.user?.id,
    },
    include: { user: true, assignedTo: true }
  });
  res.status(201).json(mapTicket(ticket));
}));

// PATCH /api/tickets/:id
ticketRouter.patch('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validatedData = updateTicketSchema.parse(req.body);

  if (validatedData.assigned_to) {
    const userExists = await prisma.user.findUnique({
      where: { id: validatedData.assigned_to, deletedAt: null }
    });
    if (!userExists) {
      res.status(400).json({ error: 'Assigned user does not exist' });
      return;
    }
  }
  
  const updateData: any = {
    ...validatedData,
    ...(validatedData.status && { status: toDbStatus(validatedData.status) }),
  };

  if ('assigned_to' in validatedData) {
    updateData.assignedToId = validatedData.assigned_to;
    delete updateData.assigned_to;
  }

  const ticket = await prisma.ticket.update({
    where: { id: req.params.id },
    data: updateData,
    include: { user: true, assignedTo: true }
  });
  res.json(mapTicket(ticket));
}));

// DELETE /api/tickets/:id
ticketRouter.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const deleted = await prisma.ticket.delete({
    where: { id: req.params.id },
    include: { user: true, assignedTo: true }
  });
  res.json(mapTicket(deleted));
}));
