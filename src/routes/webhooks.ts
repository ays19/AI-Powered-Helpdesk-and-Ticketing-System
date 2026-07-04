import { Router } from 'express';
import type { Response, Request } from 'express';
import { db as prisma } from '../db';
import { asyncHandler } from '../middleware/async-handler';
import { EmailWebhookSchema } from 'core';
import { TicketStatus, TicketPriority } from '../lib/prisma/client';
import type { Ticket } from '../lib/prisma/client';
import { boss, TICKET_CLASSIFICATION_QUEUE, TICKET_AUTO_RESOLVE_QUEUE } from '../lib/queue';

export const webhookRouter = Router();

async function classifyTicket(ticket: Ticket) {
  try {
    const jobId = await boss.send(TICKET_CLASSIFICATION_QUEUE, {
      ticketId: ticket.id,
      title: ticket.title,
      description: ticket.description
    });
    console.log(`[Webhook] Enqueued classification job ${jobId} for ticket ${ticket.id}`);
  } catch (error) {
    console.error(`[Webhook] Failed to enqueue classification job for ticket ${ticket.id}:`, error);
  }
}

// POST /api/webhooks/email
webhookRouter.post('/email', asyncHandler(async (req: Request, res: Response) => {
  // Verify webhook secret to prevent spoofed ticket creation
  const incomingSecret = req.headers['x-webhook-secret'];
  if (!process.env.WEBHOOK_SECRET || incomingSecret !== process.env.WEBHOOK_SECRET) {
    res.status(401).json({ error: 'Unauthorized: Invalid or missing webhook secret' });
    return;
  }

  const validatedData = EmailWebhookSchema.parse(req.body);
  
  // Try to find a user with the matching email
  const user = await prisma.user.findUnique({
    where: { email: validatedData.from },
  });

  // Find the AI agent user
  const aiAgent = await prisma.user.findUnique({
    where: { email: 'ai@example.com' },
  });

  const ticket = await prisma.ticket.create({
    data: {
      title: validatedData.subject,
      description: validatedData.body,
      customerEmail: validatedData.from,
      userId: user?.id,
      status: TicketStatus.new,
      priority: TicketPriority.medium,
      assignedToId: aiAgent?.id || null,
    },
  });

  // Automatically classify the ticket using Groq in a non-blocking fashion
  classifyTicket(ticket);

  // Enqueue the auto-resolve job in parallel (email creation path)
  try {
    console.log(`[Queue] Enqueuing auto-resolve job for ticket ${ticket.id} at ${new Date().toISOString()}`);
    await boss.send(TICKET_AUTO_RESOLVE_QUEUE, { ticketId: ticket.id });
    console.log(`[Route/webhooks] Enqueued ticket-auto-resolve job for ticket ${ticket.id} (enqueue #1 — email creation path)`);
  } catch (error) {
    console.error(`[Route/webhooks] Failed to enqueue auto-resolve job for ticket ${ticket.id}:`, error);
  }

  res.status(201).json(ticket);
}));
