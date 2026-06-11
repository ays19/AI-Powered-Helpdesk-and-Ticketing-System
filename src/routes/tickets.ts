import { Router } from 'express';
import type { Response } from 'express';
import { db as prisma } from '../db';
import type { CreateTicketBody } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth';

export const ticketRouter = Router();

// GET /api/tickets
ticketRouter.get('/', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// GET /api/tickets/:id
ticketRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
    });
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// POST /api/tickets
ticketRouter.post('/', async (req: AuthenticatedRequest<{}, {}, CreateTicketBody>, res: Response) => {
  const { title, description, priority } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }
  
  try {
    const ticket = await prisma.ticket.create({
      data: {
        title,
        description: description || '',
        priority: priority || 'medium',
        status: 'open',
      },
    });
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// PATCH /api/tickets/:id
ticketRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(ticket);
  } catch (error) {
    res.status(404).json({ error: 'Ticket not found or update failed' });
  }
});

// DELETE /api/tickets/:id
ticketRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await prisma.ticket.delete({
      where: { id: req.params.id },
    });
    res.json(deleted);
  } catch (error) {
    res.status(404).json({ error: 'Ticket not found or delete failed' });
  }
});
