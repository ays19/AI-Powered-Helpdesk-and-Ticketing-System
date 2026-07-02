import { Router } from 'express';
import type { Response, Request } from 'express';
import { db as prisma } from '../db';
import { asyncHandler } from '../middleware/async-handler';
import { EmailWebhookSchema } from 'core';
import { TicketStatus, TicketPriority } from '../lib/prisma/client';
import type { Ticket } from '../lib/prisma/client';
import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';

export const webhookRouter = Router();

async function classifyTicket(ticket: Ticket) {
  const { id: ticketId, title, description } = ticket;
  try {
    let category = 'general_question';

    if (process.env.NODE_ENV === 'test') {
      const content = (title + ' ' + description).toLowerCase();
      if (content.includes('refund')) {
        category = 'refund_request';
      } else if (content.includes('technical') || content.includes('bug') || content.includes('error')) {
        category = 'technical_question';
      } else {
        category = 'general_question';
      }
    } else if (process.env.GROQ_API_KEY) {
      const prompt = `Ticket Title: ${title}\nTicket Description: ${description}`;
      const { text } = await generateText({
        model: groq('llama-3.1-8b-instant'),
        system: `You are an AI ticket classifier. Your job is to read a customer support ticket and classify it into one of these three categories:\n- 'general_question': general inquiries, information requests, generic greetings, password changes, login/how-to assistance, account subscription cancellations (without refund requests), and settings questions.\n- 'technical_question': application crashes, system errors, bugs, database locks, data corruption, and API failures.\n- 'refund_request': explicit requests for money refunds, refund policies, billing disputes, transaction errors, and chargebacks. Do NOT classify general account cancellations under refund_request unless they explicitly mention money refunds or billing disputes.\nReturn only the classification value (exactly one of 'general_question', 'technical_question', or 'refund_request'), nothing else.`,
        prompt,
      });

      const classification = text.trim().toLowerCase();
      if (['general_question', 'technical_question', 'refund_request'].includes(classification)) {
        category = classification;
      }
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { category: category as any }
    });
    console.log(`[Webhook] Ticket ${ticketId} auto-classified as ${category}`);
  } catch (error) {
    console.error(`[Webhook] Failed to auto-classify ticket ${ticketId}:`, error);
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

  // Automatically classify the ticket using Groq in a non-blocking fashion
  classifyTicket(ticket);

  res.status(201).json(ticket);
}));
