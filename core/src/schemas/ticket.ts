import { z } from 'zod';

/**
 * Allowed values for the TicketCategory enum.
 * Must stay in sync with the Prisma `TicketCategory` enum.
 */
export const TICKET_CATEGORIES = [
  'general_question',
  'technical_question',
  'refund_request',
] as const;

export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export const TICKET_STATUSES = ['open', 'in-progress', 'resolved', 'closed'] as const;

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export const createTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(255, 'Title is too long'),
  description: z.string().optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  category: z.enum(TICKET_CATEGORIES).optional(),
});

export type CreateTicketFormValues = z.infer<typeof createTicketSchema>;

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export const updateTicketSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  status: z.enum(TICKET_STATUSES).optional(),
  category: z.enum(TICKET_CATEGORIES).optional(),
});

export type UpdateTicketFormValues = z.infer<typeof updateTicketSchema>;
