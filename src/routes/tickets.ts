import { Router } from 'express';
import type { Response } from 'express';
import { db as prisma } from '../db';
import type { CreateTicketBody } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/async-handler';
import { createTicketSchema, updateTicketSchema, createReplySchema } from 'core';
import { TicketStatus, ReplySenderType } from '../lib/prisma/client';
import { mapTicket, toDbStatus } from '../lib/ticket-mapper';
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

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
  const ticketNumber = parseInt(req.params.id, 10);
  if (isNaN(ticketNumber)) {
    res.status(400).json({ error: 'Invalid ticket number' });
    return;
  }
  const ticket = await prisma.ticket.findUnique({
    where: { ticketNumber },
    include: { 
      user: true, 
      assignedTo: true,
      replies: {
        include: { user: true },
        orderBy: { createdAt: 'asc' }
      }
    }
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
  const ticketNumber = parseInt(req.params.id, 10);
  if (isNaN(ticketNumber)) {
    res.status(400).json({ error: 'Invalid ticket number' });
    return;
  }
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
    where: { ticketNumber },
    data: updateData,
    include: { user: true, assignedTo: true }
  });
  res.json(mapTicket(ticket));
}));

// DELETE /api/tickets/:id
ticketRouter.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const ticketNumber = parseInt(req.params.id, 10);
  if (isNaN(ticketNumber)) {
    res.status(400).json({ error: 'Invalid ticket number' });
    return;
  }
  const deleted = await prisma.ticket.delete({
    where: { ticketNumber },
    include: { user: true, assignedTo: true }
  });
  res.json(mapTicket(deleted));
}));

// POST /api/tickets/polish
ticketRouter.post('/polish', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { content, customerName } = req.body;
  if (!content || typeof content !== 'string') {
    res.status(400).json({ error: 'Content is required and must be a string' });
    return;
  }

  try {
    let polishedText = '';
    const agentName = req.user?.name || 'Support Agent';

    if (process.env.NODE_ENV === 'test') {
      // Mock mode for automated tests only
      const greeting = customerName ? `Dear ${customerName},\n\n` : 'Dear Customer,\n\n';
      polishedText = `${greeting}${content.trim()} (Polished by AI)\n\nBest regards,\n${agentName}\nhttps://www.linkedin.com/in/yasirsharar/`;
    } else if (!process.env.GROQ_API_KEY) {
      res.status(503).json({ error: 'GROQ_API_KEY is not configured. Add your key to .env and restart the server.' });
      return;
    } else {
      const { text } = await generateText({
        model: groq('llama-3.1-8b-instant'),
        system: 
        "You are a helpful writing assistant for a customer support team." +
        "Improve the given reply for clarity, professional tone, and grammar." +
        "Preserve the original meaning and keep the response concise." +
        "Do NOT add any sign-off, closing, or signature (e.g. no 'Best regards', 'Sincerely', etc). " +
        "Return only the improved body text with no preamble or explanation. " +
        "If a customer name is provided, address the customer respectfully by their name at the beginning if not already present. Do not duplicate greetings.",
        prompt: `Customer Name: ${customerName || ''}\nDraft content: ${content}`,
      });
      polishedText = `${text.trim()}\n\nBest regards,\n${agentName}\nhttps://www.linkedin.com/in/yasirsharar/`;
    }

    res.json({ polishedContent: polishedText });
  } catch (error: any) {
    console.error('AI polishing failed:', error);
    res.status(500).json({ error: 'Failed to polish reply using AI' });
  }
}));

// POST /api/tickets/:id/replies

ticketRouter.post('/:id/replies', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const ticketNumber = parseInt(req.params.id, 10);
  if (isNaN(ticketNumber)) {
    res.status(400).json({ error: 'Invalid ticket number' });
    return;
  }
  const validatedData = createReplySchema.parse(req.body);

  const ticket = await prisma.ticket.findUnique({
    where: { ticketNumber }
  });
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const reply = await prisma.ticketReply.create({
    data: {
      content: validatedData.content,
      ticketId: ticket.id,
      userId: req.user.id,
      senderType: ReplySenderType.agent,
    },
    include: {
      user: true
    }
  });

  res.status(201).json(reply);
}));

// POST /api/tickets/:id/summarize
ticketRouter.post('/:id/summarize', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const ticketNumber = parseInt(req.params.id, 10);
  if (isNaN(ticketNumber)) {
    res.status(400).json({ error: 'Invalid ticket number' });
    return;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { ticketNumber },
    include: {
      replies: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  try {
    let summaryText = '';

    if (process.env.NODE_ENV === 'test') {
      summaryText = `Summary of Ticket: ${ticket.title} - Description: ${ticket.description}. Total replies: ${ticket.replies.length}.`;
    } else if (!process.env.GROQ_API_KEY) {
      res.status(503).json({ error: 'GROQ_API_KEY is not configured. Add your key to .env and restart the server.' });
      return;
    } else {
      // Build conversational context for the model
      let conversationStr = `Ticket Title: ${ticket.title}\nTicket Description: ${ticket.description}\n\n`;
      if (ticket.replies.length > 0) {
        conversationStr += "Conversation History:\n";
        ticket.replies.forEach((reply, idx) => {
          conversationStr += `[Reply #${idx + 1} by ${reply.senderType}]: ${reply.content}\n`;
        });
      }

      const { text } = await generateText({
        model: groq('llama-3.1-8b-instant'),
        system: 'You are a customer support assistant. Your job is to read a helpdesk ticket (including its title, description, and the replies/conversation history) and write a concise, professional summary of the ticket and the conversation. Focus on the main issue, what has been discussed/resolved, and any next steps. Do not include any meta text, intro, or explanation, just return the summary itself.',
        prompt: conversationStr,
      });

      summaryText = text.trim();
    }

    res.json({ summary: summaryText });
  } catch (error: any) {
    console.error('AI ticket summarization failed:', error);
    res.status(500).json({ error: 'Failed to summarize ticket using AI' });
  }
}));
