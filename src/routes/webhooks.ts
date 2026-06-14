import { Router } from 'express';
import type { Response, Request } from 'express';
import { db as prisma } from '../db';
import { asyncHandler } from '../middleware/async-handler';
import { EmailWebhookSchema } from 'core';
import { TicketStatus, TicketPriority } from '../lib/prisma/client';

export const webhookRouter = Router();

// POST /api/webhooks/email
webhookRouter.post('/email', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = EmailWebhookSchema.parse(req.body);
  
  // Try to find a user with the matching email
  const user = await prisma.user.findUnique({
    where: { email: validatedData.from },
  });

  const ticket = await prisma.ticket.create({
    data: {
      title: validatedData.subject,
      description: validatedData.body,
      customerEmail: validatedData.from,
      userId: user?.id,
      status: TicketStatus.open,
      priority: TicketPriority.medium,
    },
  });

  res.status(201).json(ticket);
}));
