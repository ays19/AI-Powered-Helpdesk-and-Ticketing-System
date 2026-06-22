// UserRole is defined in core/ — single source of truth shared with the client.
export { UserRole } from 'core';


export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketCategory = 'general_question' | 'technical_question' | 'refund_request';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  customerEmail?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketBody {
  title: string;
  description?: string;
  priority?: TicketPriority;
  category?: TicketCategory;
}
